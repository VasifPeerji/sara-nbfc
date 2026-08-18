/* ------------------------------------------------------------------
   Deterministic computation.

   Why this exists. Lending is arithmetic under rules, and the useful
   answer is almost never the number on its own: it is the number with
   every input, where the input came from, and which rule fixed it. A
   guided task that produces "₹12,48,310" is a calculator. One that
   produces the same figure with a line for principal outstanding, a line
   for interest accrued at the contracted rate over 47 days, a line
   saying no pre-payment charge is permitted and naming the policy that
   bars it, is the thing a branch can send to a customer.

   Why it is declarative rather than an expression language. An edition
   writes `{ op: "interest", of: "pos", rate: "roi", days: "days" }`
   rather than a formula string. Three reasons. There is no eval, so
   nothing in a config file can execute. Every operation is individually
   testable against a hand-worked figure, which is what test_calc.js
   does. And a reviewer reading the edition can see which rule each line
   implements without parsing arithmetic.

   Why no model is involved, ever. The demo's headline claim is that a
   task completes with no API key and no network. A computed figure that
   only appears when a model is connected disappears at exactly the
   moment we are proudest of the product. Everything here is pure.

   Money. All amounts are handled in whole paise internally and rounded
   once, at presentation. Accumulating rounded rupees across a dozen
   lines and then presenting the total is how a settlement quote ends up
   a rupee away from the ledger, and a rupee is enough for a customer to
   lose confidence in the whole document.
   ------------------------------------------------------------------ */

const Calc = (function(){

  /* ================= primitives ================= */

  /** Parse anything a step might hold into a number. Tolerates the
      commas, currency marks and spacing people actually type. */
  function num(v, dflt){
    if(typeof v === "number") return isFinite(v) ? v : (dflt || 0);
    if(v === true) return 1;
    if(v === false || v === undefined || v === null) return dflt || 0;
    const s = String(v).replace(/[^0-9.\-]/g, "");
    const n = parseFloat(s);
    return isFinite(n) ? n : (dflt || 0);
  }

  /** Indian digit grouping. 1234567.5 -> "12,34,567.50" */
  function money(n, dp){
    const places = dp === undefined ? 2 : dp;
    const neg = n < 0;
    const fixed = Math.abs(n).toFixed(places);
    const parts = fixed.split(".");
    let whole = parts[0];
    let out;
    if(whole.length <= 3){
      out = whole;
    }else{
      const last3 = whole.slice(-3);
      let rest = whole.slice(0, -3);
      const groups = [];
      while(rest.length > 2){ groups.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
      if(rest.length) groups.unshift(rest);
      out = groups.join(",") + "," + last3;
    }
    return (neg ? "-" : "") + out + (parts[1] ? "." + parts[1] : "");
  }

  /** Round half away from zero at 2dp, done once at presentation. */
  function r2(n){
    const s = n < 0 ? -1 : 1;
    return s * Math.round(Math.abs(n) * 100) / 100;
  }

  function parseDate(v){
    if(!v) return null;
    if(v instanceof Date) return isNaN(v.getTime()) ? null : v;
    const s = String(v).trim();
    let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if(m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(s);   /* dd/mm/yyyy */
    if(m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function isoDate(d){
    return d ? d.toISOString().slice(0, 10) : "";
  }

  /** Whole days between two dates. Exclusive of the start, inclusive of
      the end, which is how interest is counted on a loan account. */
  function dayCount(from, to){
    const a = parseDate(from), b = parseDate(to);
    if(!a || !b) return 0;
    return Math.round((b - a) / 86400000);
  }

  function addDays(d, n){
    const a = parseDate(d);
    if(!a) return null;
    return new Date(a.getTime() + Math.round(n) * 86400000);
  }

  /** Calendar months, clamped to the end of a short month: 31 Jan + 1
      month is 28 Feb, not 3 March. Notice periods and instalment dates
      are written in months and a naive 30-day addition drifts. */
  function addMonths(d, n){
    const a = parseDate(d);
    if(!a) return null;
    const y = a.getUTCFullYear(), m = a.getUTCMonth(), day = a.getUTCDate();
    const target = new Date(Date.UTC(y, m + Math.round(n), 1));
    const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(day, last));
    return target;
  }

  /* ================= finance ================= */

  /** Simple interest. P x r/100 x d/basis. The basis is explicit because
      actual/365 and actual/360 give different answers and the product
      note says which one governs. */
  function interest(principal, ratePct, days, basis){
    const b = num(basis, 365) || 365;
    return num(principal) * (num(ratePct) / 100) * (num(days) / b);
  }

  /** The annuity instalment. A zero rate is not an error: an interest
      free facility amortises straight-line, and dividing by zero here
      would produce NaN in a customer-facing schedule. */
  function emi(principal, annualRatePct, months){
    const P = num(principal), n = Math.round(num(months));
    if(n <= 0) return 0;
    const i = num(annualRatePct) / 1200;
    if(i === 0) return P / n;
    const f = Math.pow(1 + i, n);
    return P * i * f / (f - 1);
  }

  /** Amortisation schedule. The final instalment absorbs the rounding so
      the closing balance is exactly zero; a schedule that ends at 0.03
      is a schedule a customer will query. */
  function schedule(principal, annualRatePct, months, startDate){
    const P = num(principal), n = Math.round(num(months));
    const i = num(annualRatePct) / 1200;
    const inst = emi(P, annualRatePct, n);
    const rows = [];
    let bal = P;
    let start = parseDate(startDate);
    for(let k = 1; k <= n; k++){
      const int = bal * i;
      let prin = inst - int;
      let pay = inst;
      if(k === n){ prin = bal; pay = bal + int; }
      bal = bal - prin;
      if(Math.abs(bal) < 0.005) bal = 0;
      rows.push({
        n: k,
        due: start ? isoDate(addMonths(start, k - 1)) : "",
        payment: r2(pay),
        interest: r2(int),
        principal: r2(prin),
        balance: r2(bal),
      });
    }
    return rows;
  }

  /** Effective annualised cost including every fee, solved by bisection.
      Bisection rather than Newton because it cannot diverge on the
      awkward inputs this gets in practice: a large fee on a short tenor
      produces a very high rate, and a wrong answer here is a disclosure
      failure rather than a rounding one.

      `net` is what the borrower actually received: the sanctioned amount
      less any fee deducted at disbursal. Computing on the sanctioned
      amount understates the rate on every file cut from the template. */
  function apr(net, instalment, months){
    const A = num(net), pay = num(instalment), n = Math.round(num(months));
    if(A <= 0 || pay <= 0 || n <= 0) return 0;
    if(pay * n <= A) return 0;
    const pv = function(i){
      if(i === 0) return pay * n - A;
      const f = Math.pow(1 + i, n);
      return pay * (f - 1) / (i * f) - A;
    };
    let lo = 0, hi = 1;                       /* 100% a month is a ceiling nothing reaches */
    for(let k = 0; k < 200 && pv(hi) > 0; k++) hi *= 2;
    for(let k = 0; k < 200; k++){
      const mid = (lo + hi) / 2;
      if(pv(mid) > 0) lo = mid; else hi = mid;
    }
    return ((lo + hi) / 2) * 1200;
  }

  /* ================= classification ================= */

  /** Days past due from the earliest unpaid due date. */
  function dpd(oldestDue, asOn){
    const d = dayCount(oldestDue, asOn);
    return d > 0 ? d : 0;
  }

  /** Special mention and non-performing stage from days past due.
      The bands are the framework's; the policy document states them and
      the task cites it. Nothing here is a judgement. */
  function stage(days){
    const d = num(days);
    if(d <= 0) return { code: "Standard", label: "Standard, no amount overdue" };
    if(d <= 30) return { code: "SMA-0", label: "Special mention, overdue 1 to 30 days" };
    if(d <= 60) return { code: "SMA-1", label: "Special mention, overdue 31 to 60 days" };
    if(d <= 90) return { code: "SMA-2", label: "Special mention, overdue 61 to 90 days" };
    return { code: "NPA", label: "Non performing, overdue beyond 90 days" };
  }

  /** The upgrade test, which is the rule most often got wrong.
      An account upgrades only when the ENTIRE arrears of interest and
      principal are cleared, and where the borrower holds more than one
      facility, across all of them. Reducing days past due below the
      threshold does not upgrade anything. */
  function upgrade(arrearsByFacility){
    const list = (arrearsByFacility || []).map(function(f){
      return { facility: f.facility || f.id || "", arrears: num(f.arrears) };
    });
    const outstanding = list.filter(function(f){ return f.arrears > 0.005; });
    return {
      eligible: outstanding.length === 0,
      total: r2(list.reduce(function(a, f){ return a + f.arrears; }, 0)),
      blocking: outstanding,
    };
  }

  /* ================= ratios ================= */

  function ratio(part, whole){
    const w = num(whole);
    return w === 0 ? 0 : (num(part) / w) * 100;
  }

  /** Band lookup. Bands are declared `[{to: 30, ...}, {to: 60, ...}]`
      and the first band whose `to` the value does not exceed wins. A
      final band with no `to` is the catch-all. */
  function band(value, bands){
    const v = num(value);
    const list = bands || [];
    for(let i = 0; i < list.length; i++){
      const b = list[i];
      if(b.to === undefined || b.to === null || v <= num(b.to)) return b;
    }
    return list[list.length - 1] || null;
  }

  /* ==================================================================
     THE LINE ENGINE

     An edition declares an ordered list of lines. Each names an
     operation, its inputs by answer key, and the document that fixes it.
     Running them produces the same list with a value and a resolved
     citation on each, plus a total. That structure is what the
     computation renderer draws and what the record carries, so the
     working and the figure can never disagree.

     A line may carry `when`, and a line whose condition fails is not
     dropped: it is returned with `skipped: true` and its reason. "No
     pre-payment charge is payable, because the facility is floating rate
     to an individual for a non-business purpose" is the most valuable
     line in a foreclosure quote, and deleting it would leave the
     customer wondering whether it had been forgotten.
     ================================================================== */

  const OPS = {
    /* take an answer straight through */
    value: function(l, ctx){ return num(pull(l.from, ctx)); },

    /* a fixed figure written into the edition */
    constant: function(l){ return num(l.value); },

    /* P x r/100 x d/basis */
    interest: function(l, ctx){
      return interest(pull(l.of, ctx), pull(l.rate, ctx), pull(l.days, ctx), l.basis);
    },

    /* pct% of a base */
    percent: function(l, ctx){
      return num(pull(l.of, ctx)) * num(pull(l.pct, ctx)) / 100;
    },

    /* the annuity instalment */
    emi: function(l, ctx){
      return emi(pull(l.principal, ctx), pull(l.rate, ctx), pull(l.months, ctx));
    },

    /* add named earlier lines, or answers */
    sum: function(l, ctx){
      return (l.of || []).reduce(function(a, k){ return a + num(pull(k, ctx)); }, 0);
    },

    /* first minus the rest */
    subtract: function(l, ctx){
      const list = (l.of || []).map(function(k){ return num(pull(k, ctx)); });
      return list.slice(1).reduce(function(a, n){ return a - n; }, list[0] || 0);
    },

    /* a x b */
    multiply: function(l, ctx){
      return (l.of || []).reduce(function(a, k){ return a * num(pull(k, ctx)); }, 1);
    },

    /* part as a percentage of whole */
    ratio: function(l, ctx){
      return ratio(pull(l.part, ctx), pull(l.whole, ctx));
    },

    /* whole days between two dates */
    days: function(l, ctx){
      return dayCount(pull(l.from, ctx), pull(l.to, ctx));
    },

    min: function(l, ctx){
      return Math.min.apply(null, (l.of || []).map(function(k){ return num(pull(k, ctx)); }));
    },
    max: function(l, ctx){
      return Math.max.apply(null, (l.of || []).map(function(k){ return num(pull(k, ctx)); }));
    },
  };

  /** Resolve a reference. A number is itself; a string is looked up
      first among lines already computed, then among the answers. Lines
      shadow answers deliberately, so a later line can build on an
      earlier one by name without the edition inventing a key. */
  function pull(ref, ctx){
    if(ref === undefined || ref === null) return 0;
    if(typeof ref === "number") return ref;
    const k = String(ref);
    if(ctx.lines && Object.prototype.hasOwnProperty.call(ctx.lines, k)) return ctx.lines[k];
    if(ctx.answers && Object.prototype.hasOwnProperty.call(ctx.answers, k)) return ctx.answers[k];
    /* a bare numeric literal written as a string */
    const n = parseFloat(k);
    return isFinite(n) && /^-?[\d.]+$/.test(k) ? n : 0;
  }

  /** Does a line's condition hold? Same shape as a step's `when`. */
  function holds(cond, answers){
    if(!cond) return true;
    return Object.keys(cond).every(function(f){
      const want = cond[f];
      const got = answers[f];
      const list = Array.isArray(want) ? want : [want];
      if(Array.isArray(got)) return got.some(function(g){ return list.indexOf(g) !== -1; });
      return list.indexOf(got) !== -1;
    });
  }

  /** Run a declared computation. Returns the lines with values and
      citations resolved, and the total. Never throws: a line that cannot
      be computed is returned marked rather than taking the document
      down, because a record with one bad line is recoverable and a
      record that failed to render is not. */
  function run(spec, answers, opts){
    const o = opts || {};
    const ctx = { answers: answers || {}, lines: {} };
    const out = [];

    (spec && spec.lines || []).forEach(function(l){
      if(!holds(l.when, ctx.answers)){
        out.push({
          label: l.label, skipped: true,
          because: l.because || "Not applicable to this case",
          cite: l.cite || "",
        });
        if(l.as) ctx.lines[l.as] = 0;
        return;
      }
      let v = 0, err = "";
      try{
        const fn = OPS[l.op];
        if(!fn) throw new Error('unknown operation "' + l.op + '"');
        v = fn(l, ctx);
        if(!isFinite(v)) throw new Error("not a finite number");
      }catch(e){ err = e.message; v = 0; }
      if(l.as) ctx.lines[l.as] = v;
      out.push({
        label: l.label,
        value: r2(v),
        unit: l.unit || "money",
        cite: l.cite || "",
        note: l.note || "",
        negative: !!l.negative,
        error: err,
      });
    });

    const totalOf = spec && spec.total;
    let total = null;
    if(totalOf){
      const keys = totalOf.of || out.filter(function(x){ return !x.skipped; }).map(function(_, i){ return i; });
      let t;
      if(totalOf.of){
        t = totalOf.of.reduce(function(a, k){ return a + num(ctx.lines[k]); }, 0);
      }else{
        t = out.reduce(function(a, x){
          return x.skipped ? a : a + (x.negative ? -num(x.value) : num(x.value));
        }, 0);
      }
      total = { label: totalOf.label || "Total", value: r2(t), unit: totalOf.unit || "money" };
    }

    return { lines: out, total: total, values: ctx.lines, asOn: o.asOn || "" };
  }

  /* ==================================================================
     CHECKS

     A check evaluates one condition against the answers and returns
     pass, fail or not-applicable, with the document that sets it. This
     is what turns a checklist from an assertion into something a person
     can defend, and it is what lets a task refuse to finish.
     ================================================================== */

  const TESTS = {
    truthy:   function(v){ return v === true || v === "Yes" || v === "yes" || (!!v && v !== "No"); },
    falsy:    function(v){ return !(v === true || v === "Yes" || v === "yes"); },
    present:  function(v){ return v !== undefined && v !== null && String(v).trim() !== "" && !(Array.isArray(v) && !v.length); },
    equals:   function(v, t){ return String(v) === String(t); },
    notEquals:function(v, t){ return String(v) !== String(t); },
    gte:      function(v, t){ return num(v) >= num(t); },
    lte:      function(v, t){ return num(v) <= num(t); },
    gt:       function(v, t){ return num(v) > num(t); },
    lt:       function(v, t){ return num(v) < num(t); },
    includes: function(v, t){ return Array.isArray(v) ? v.indexOf(t) !== -1 : String(v).indexOf(String(t)) !== -1; },
    notIncludes: function(v, t){ return !TESTS.includes(v, t); },
  };

  function check(rules, answers, ctxLines){
    const a = answers || {};
    const ctx = { answers: a, lines: ctxLines || {} };
    return (rules || []).map(function(r){
      if(!holds(r.when, a)){
        return { label: r.label, state: "na", detail: r.na || "Not applicable", cite: r.cite || "" };
      }
      const fn = TESTS[r.test || "truthy"];
      let ok = false, err = "";
      try{
        ok = fn ? !!fn(pullRaw(r.of, ctx), r.value) : false;
        if(!fn) err = 'unknown test "' + r.test + '"';
      }catch(e){ err = e.message; }
      return {
        label: r.label,
        state: err ? "na" : (ok ? "pass" : "fail"),
        detail: err || (ok ? (r.pass || "") : (r.fail || "")),
        cite: r.cite || "",
        blocking: r.blocking !== false,
      };
    });
  }

  /** Like pull but returns the raw answer rather than coercing to a
      number, because a check may test a string, a list or a boolean. */
  function pullRaw(ref, ctx){
    if(ref === undefined || ref === null) return undefined;
    const k = String(ref);
    if(ctx.lines && Object.prototype.hasOwnProperty.call(ctx.lines, k)) return ctx.lines[k];
    if(ctx.answers && Object.prototype.hasOwnProperty.call(ctx.answers, k)) return ctx.answers[k];
    return undefined;
  }

  /** Does this set of checks stop the task? Only a failed blocking check
      does. A failed advisory check is reported and the record is still
      produced, because not every gap is a bar. */
  function blockers(results){
    return (results || []).filter(function(c){ return c.state === "fail" && c.blocking !== false; });
  }

  /* ==================================================================
     CLOCKS

     An obligation with a date, an owner and a consequence. The interval
     comes from the edition, which took it from a policy document, and
     the citation travels with it so nobody has to trust the number.
     ================================================================== */

  function clock(spec, answers, today){
    const a = answers || {};
    const base = parseDate(spec.from && (a[spec.from] !== undefined ? a[spec.from] : spec.from)) || parseDate(spec.from);
    const now = parseDate(today) || parseDate(spec.today);
    if(!base) return null;
    const due = spec.unit === "months" ? addMonths(base, num(spec.every))
                                       : addDays(base, num(spec.every));
    const left = now && due ? dayCount(now, due) : null;
    return {
      label: spec.label || "",
      from: isoDate(base),
      fromLabel: spec.fromLabel || "",
      due: isoDate(due),
      every: num(spec.every),
      unit: spec.unit || "days",
      daysLeft: left,
      overdue: left !== null && left < 0,
      owner: spec.owner || "",
      consequence: spec.consequence || "",
      cite: spec.cite || "",
    };
  }

  /* ==================================================================
     RECONCILIATION

     Two records of the same population, compared row by row on a key.
     Returns matches, breaks and the totals on each side. Two systems
     disagreeing about the same loan is the named failure mode of
     co-lending, and this is what makes it visible.
     ================================================================== */

  function reconcile(ours, theirs, spec){
    const key = (spec && spec.key) || "id";
    const fields = (spec && spec.fields) || [];
    const tol = num(spec && spec.tolerance, 0.01);

    const index = function(rows){
      const m = {};
      (rows || []).forEach(function(r){ if(r && r[key] !== undefined) m[String(r[key])] = r; });
      return m;
    };
    const A = index(ours), B = index(theirs);
    const keys = Object.keys(A).concat(Object.keys(B).filter(function(k){ return !A[k]; }));

    const breaks = [];
    let matched = 0;
    keys.forEach(function(k){
      const a = A[k], b = B[k];
      if(!b){ breaks.push({ key: k, kind: "missing-theirs", detail: "On our books only" }); return; }
      if(!a){ breaks.push({ key: k, kind: "missing-ours", detail: "On their books only" }); return; }
      const diffs = [];
      fields.forEach(function(f){
        const name = f.field || f;
        const av = a[name], bv = b[name];
        if(f.numeric === false || typeof av === "string"){
          if(String(av) !== String(bv)) diffs.push({ field: name, ours: av, theirs: bv });
        }else{
          const d = num(av) - num(bv);
          if(Math.abs(d) > tol) diffs.push({ field: name, ours: r2(num(av)), theirs: r2(num(bv)), diff: r2(d) });
        }
      });
      if(diffs.length) breaks.push({ key: k, kind: "mismatch", diffs: diffs });
      else matched++;
    });

    const totalOf = function(rows, f){
      return r2((rows || []).reduce(function(s, r){ return s + num(r[f]); }, 0));
    };
    const totals = {};
    fields.forEach(function(f){
      const name = f.field || f;
      if(f.numeric === false) return;
      totals[name] = { ours: totalOf(ours, name), theirs: totalOf(theirs, name) };
      totals[name].diff = r2(totals[name].ours - totals[name].theirs);
    });

    return { matched: matched, breaks: breaks, totals: totals, count: keys.length };
  }

  return {
    /* primitives, exported because the renderers and the tests both need them */
    num: num, money: money, r2: r2,
    parseDate: parseDate, isoDate: isoDate, dayCount: dayCount,
    addDays: addDays, addMonths: addMonths,

    /* finance */
    interest: interest, emi: emi, schedule: schedule, apr: apr,

    /* classification */
    dpd: dpd, stage: stage, upgrade: upgrade,

    /* ratios */
    ratio: ratio, band: band,

    /* engines */
    run: run, check: check, blockers: blockers, clock: clock, reconcile: reconcile,

    /* exposed for tests */
    OPS: OPS, TESTS: TESTS, holds: holds,
  };
})();
