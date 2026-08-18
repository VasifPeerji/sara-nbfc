/* ------------------------------------------------------------------
   Lending diagrams, drawn as plain SVG.

   Why these exist. A bar chart is not how lending communicates. A
   settlement figure is a waterfall, a delinquent book is a bucket
   distribution, an approval is a chain of authorities, and an
   obligation is a dated timeline. Handing a credit manager a pie chart
   of a deviation matrix is the tell that the product was built by
   people who have not sat in a credit hub.

   The lending types (waterfall, ageing, schedule, chain, timeline,
   flow) are added alongside the computation, decision and clock
   outputs, because they are the same job: showing the working.

   Why they are deterministic. Everything here draws from a spec object,
   with no model involved. The demo's headline claim is that it runs
   with no API key and no network, so a visual that only appears when a
   model is connected disappears at exactly the moment we are proudest
   of the product. Guided tasks and prompt cards supply the spec
   directly; the model may also ask for one, but it is never the only
   path.

   Theme. Colours come from the CSS custom properties, so every diagram
   follows light and dark without a second code path, and prints as
   vector rather than a rasterised canvas.
   ------------------------------------------------------------------ */

const Diagrams = (function(){

  const W = 660;

  /* ---------- small helpers ---------- */

  const n = function(v, d){ const x = parseFloat(v); return isFinite(x) ? x : (d || 0); };
  const arr = function(v){ return Array.isArray(v) ? v : []; };
  const str = function(v, d){ return (v == null || v === "") ? (d || "") : String(v); };
  const r1 = function(v){ return Math.round(v * 10) / 10; };

  /** Status colour by name, so a spec can say "amber" and mean it. */
  /* Orange is a literal because the four TARP colours are fixed by
     convention and there is no orange in the token set. Green, amber,
     orange and red have to be four distinguishable colours or the whole
     chart says nothing. */
  const STATUS = { ok: "var(--ok)", green: "var(--ok)", pass: "var(--ok)",
                   warn: "var(--warn)", amber: "var(--warn)", caution: "var(--warn)",
                   orange: "#e8590c",
                   crit: "var(--crit)", red: "var(--crit)", fail: "var(--crit)",
                   info: "var(--info)", blue: "var(--info)", mute: "var(--tx-3)" };
  function statusColor(k, fallback){
    return STATUS[String(k || "").toLowerCase()] || fallback || "var(--a)";
  }

  function t(x, y, s, cls, anchor, size){
    return '<text x="' + r1(x) + '" y="' + r1(y) + '"' +
      (anchor ? ' text-anchor="' + anchor + '"' : "") +
      ' class="dg-t' + (cls ? " " + cls : "") + '"' +
      (size ? ' style="font-size:' + size + 'px"' : "") + ">" + esc(s) + "</text>";
  }
  function line(x1, y1, x2, y2, stroke, dash, wdt){
    return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) +
      '" stroke="' + (stroke || "var(--line-2)") + '" stroke-width="' + (wdt || 1) + '"' +
      (dash ? ' stroke-dasharray="' + dash + '"' : "") + ' />';
  }
  function rect(x, y, w, h, fill, extra){
    return '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(Math.max(0, w)) +
      '" height="' + r1(Math.max(0, h)) + '" fill="' + (fill || "none") + '"' +
      (extra || "") + " />";
  }
  function poly(pts, fill, stroke, dash){
    return '<polygon points="' + pts.map(function(p){ return r1(p[0]) + "," + r1(p[1]); }).join(" ") +
      '" fill="' + (fill || "none") + '" stroke="' + (stroke || "none") + '"' +
      (dash ? ' stroke-dasharray="' + dash + '"' : "") + " />";
  }
  function path(pts, stroke, dash, wdt, fill){
    const d = pts.map(function(p, i){ return (i ? "L" : "M") + r1(p[0]) + " " + r1(p[1]); }).join(" ");
    return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' + (stroke || "var(--a)") +
      '" stroke-width="' + (wdt || 2) + '" stroke-linejoin="round" stroke-linecap="round"' +
      (dash ? ' stroke-dasharray="' + dash + '"' : "") + " />";
  }

  /** A padlock, for anything held, blocked or withheld. Kept because it
      is the one symbol that reads without a legend. */
  function padlock(x, y, s, color){
    const w = s, h = s * 0.72;
    return '<g transform="translate(' + r1(x - w / 2) + "," + r1(y - h / 2) + ')">' +
      '<path d="M' + r1(w * 0.28) + " " + r1(h * 0.36) + " V" + r1(h * 0.24) +
      " a" + r1(w * 0.22) + " " + r1(w * 0.22) + " 0 0 1 " + r1(w * 0.44) + ' 0 V' + r1(h * 0.36) +
      '" fill="none" stroke="' + color + '" stroke-width="1.5" />' +
      rect(w * 0.12, h * 0.36, w * 0.76, h * 0.62, color, ' rx="2"') +
      "</g>";
  }

  /** Dimension line with ticks and a label, the way a section is marked up. */
  function dim(x1, y1, x2, y2, label, color, above){
    const c = color || "var(--tx-2)";
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const vert = Math.abs(x2 - x1) < Math.abs(y2 - y1);
    let out = line(x1, y1, x2, y2, c, "", 1);
    const k = 4;
    out += vert ? line(x1 - k, y1, x1 + k, y1, c) + line(x2 - k, y2, x2 + k, y2, c)
                : line(x1, y1 - k, x1, y1 + k, c) + line(x2, y2 - k, x2, y2 + k, c);
    if(label){
      const lx = vert ? mx + 8 : mx;
      const ly = vert ? my + 3 : my + (above === false ? 13 : -5);
      out += t(lx, ly, label, "dg-dim", vert ? "start" : "middle", 10);
    }
    return out;
  }

  function frame(inner, h, extra){
    return '<div class="dg"' + (extra || "") + '><svg viewBox="0 0 ' + W + " " + Math.round(h) +
      '" width="100%" preserveAspectRatio="xMidYMid meet" role="img">' + inner + "</svg></div>";
  }

  /** The strip under a diagram that says what the reading means and
      which controlled document set the criterion. */
  function verdict(title, body, cite, kind){
    if(!title && !body && !cite) return "";
    const c = statusColor(kind, "var(--a)");
    return '<div class="dg-say" style="--dgc:' + c + '">' +
      (title ? '<b class="dg-say__h">' + esc(title) + "</b>" : "") +
      (body ? "<span>" + esc(body) + "</span>" : "") +
      (cite ? '<span class="dg-say__c">' + esc(cite) + "</span>" : "") + "</div>";
  }

  function head(a){
    const bits = [];
    if(a.site) bits.push(str(a.site));
    if(a.facility) bits.push(str(a.facility));
    if(a.wall) bits.push(str(a.wall));
    if(a.asset) bits.push(str(a.asset));
    if(a.blastid) bits.push(str(a.blastid));
    if(!a.title && !bits.length) return "";
    return '<div class="dg-hd">' +
      (a.title ? "<b>" + esc(a.title) + "</b>" : "") +
      (bits.length ? "<span>" + esc(bits.join("  ·  ")) + "</span>" : "") + "</div>";
  }

  /* ==================================================================
     1. SLOPE MONITORING AGAINST A TARP
     ------------------------------------------------------------------
     Velocity over time with the trigger bands drawn behind it. The
     bands are the point: a number on its own tells a supervisor
     nothing, the same number sitting inside the amber band tells them
     what the plan already requires them to do.
     ================================================================== */
  function renderHeatmap(a){
    const rows = arr(a.rows).map(String), cols = arr(a.cols).map(String);
    const vals = arr(a.values);
    const target = a.target != null ? n(a.target) : null;
    const labW = 120, cellW = Math.max(34, Math.min(74, (W - labW - 16) / Math.max(cols.length, 1)));
    const cellH = 30, topH = 74;
    const H = topH + rows.length * cellH + 34;

    let all = [];
    vals.forEach(function(r){ arr(r).forEach(function(v){ if(v != null && isFinite(n(v))) all.push(n(v)); }); });
    const lo = all.length ? Math.min.apply(null, all) : 0;
    const hi = all.length ? Math.max.apply(null, all) : 1;

    function colorFor(v){
      if(v == null || !isFinite(n(v))) return "var(--bg-2)";
      const x = n(v);
      if(target != null){
        if(x >= target) return "var(--ok)";
        if(x >= target * 0.85) return "var(--warn)";
        return "var(--crit)";
      }
      const f = hi === lo ? 1 : (x - lo) / (hi - lo);
      return f > 0.66 ? "var(--ok)" : f > 0.33 ? "var(--warn)" : "var(--crit)";
    }
    function opacityFor(v){
      if(v == null || !isFinite(n(v))) return 0.1;
      const x = n(v);
      if(target != null) return x >= target ? 0.30 : Math.max(0.22, Math.min(0.72, (target - x) / Math.max(target, 1) * 1.9));
      const f = hi === lo ? 0.5 : (x - lo) / (hi - lo);
      return 0.22 + 0.5 * (1 - f);
    }

    let s = "";
    cols.forEach(function(c, j){
      const x = labW + j * cellW + cellW / 2;
      s += '<g transform="rotate(-40 ' + r1(x) + " " + (topH - 8) + ')">' +
        t(x, topH - 8, c.length > 16 ? c.slice(0, 15) + "…" : c, "dg-ax", "end", 10) + "</g>";
    });
    rows.forEach(function(r, i){
      const y = topH + i * cellH;
      s += t(labW - 8, y + cellH / 2 + 3, r.length > 20 ? r.slice(0, 19) + "…" : r, "dg-key", "end", 10.5);
      cols.forEach(function(c, j){
        const v = (vals[i] || [])[j];
        const x = labW + j * cellW;
        s += rect(x + 1, y + 1, cellW - 2, cellH - 2, colorFor(v),
                  ' rx="3" opacity="' + r1(opacityFor(v)) + '"');
        if(v != null && isFinite(n(v))){
          s += t(x + cellW / 2, y + cellH / 2 + 4, r1(n(v)) + str(a.unit), "dg-cell", "middle", 10.5);
        }
      });
    });

    if(target != null){
      s += t(labW, H - 10, "Target " + r1(target) + str(a.unit) + ".  Green at or above, red below 85 per cent of it.",
             "dg-ax", "start", 10);
    }
    return head(a) + frame(s, H) + verdict(a.verdict || "", str(a.notes),
      a.cite ? "Source: " + str(a.cite) : "", a.kind || "");
  }

  function textHeatmap(a){
    const rows = arr(a.rows), cols = arr(a.cols), vals = arr(a.values);
    const lines = [str(a.title, "Heatmap"), ["", ""].concat(cols).join("\t")];
    rows.forEach(function(r, i){ lines.push([r].concat(arr(vals[i]).map(function(v){ return str(v); })).join("\t")); });
    if(a.target != null) lines.push("Target: " + n(a.target) + str(a.unit));
    if(a.notes) lines.push(str(a.notes));
    if(a.cite) lines.push("Source: " + a.cite);
    return lines.join("\n");
  }

  /* ==================================================================
     7. DOCUMENT CURRENCY TIMELINE
     ------------------------------------------------------------------
     Derived material against the revision it was built from. One lane
     per site, a marker on the day the parent was withdrawn, and the
     reissue obligation drawn as a deadline. What was a date in a
     register becomes a distance.
     ================================================================== */
  function dnum(d){ const x = Date.parse(d); return isFinite(x) ? x : null; }

  function renderCurrency(a){
    const rows = arr(a.rows).map(function(r){ return r || {}; });
    const P = { l: 132, r: 82, t: 46, b: 42 };
    const laneH = 30, H = P.t + rows.length * laneH + P.b;
    const plotW = W - P.l - P.r;

    const parent = a.parent || {};
    const wd = dnum(parent.withdrawn);
    const today = dnum(a.today) || Date.now();
    const stamps = rows.map(function(r){ return dnum(r.issued); }).filter(Boolean)
      .concat(wd ? [wd] : []).concat([today]);
    const t0 = Math.min.apply(null, stamps), t1 = Math.max.apply(null, stamps);
    const span = Math.max(1, t1 - t0);
    const x = function(ms){ return P.l + ((ms - t0) / span) * plotW; };

    let s = "";
    /* the withdrawal, and the day the reissue was due */
    if(wd){
      const due = wd + n(a.obligationDays, 30) * 86400000;
      s += rect(x(wd), P.t - 14, Math.max(2, x(Math.min(due, t1)) - x(wd)), rows.length * laneH + 18,
                "var(--warn)", ' opacity=".10"');
      s += line(x(wd), P.t - 18, x(wd), P.t + rows.length * laneH + 4, "var(--crit)", "", 1.6);
      s += t(x(wd), P.t - 24, str(parent.id) + " rev withdrawn", "dg-bad", "middle", 10);
      s += line(x(due), P.t - 14, x(due), P.t + rows.length * laneH + 4, "var(--warn)", "4 3", 1.4);
      s += t(x(due) + 4, P.t + rows.length * laneH + 16, n(a.obligationDays, 30) + " day reissue obligation",
             "dg-ax", "start", 9.5);
    }
    /* today */
    s += line(x(today), P.t - 14, x(today), P.t + rows.length * laneH + 4, "var(--line-3)", "2 3", 1);
    s += t(x(today), P.t - 24, "today", "dg-ax", "middle", 9.5);

    rows.forEach(function(r, i){
      const y = P.t + i * laneH + laneH / 2;
      const iss = dnum(r.issued);
      const ok = r.ok !== false;
      const c = ok ? "var(--ok)" : "var(--crit)";
      s += t(P.l - 10, y + 3, str(r.name), "dg-key", "end", 10.5);
      if(iss != null){
        s += rect(x(iss), y - 6, Math.max(3, x(today) - x(iss)), 12, c, ' rx="6" opacity=".30"');
        s += '<circle cx="' + r1(x(iss)) + '" cy="' + r1(y) + '" r="4" fill="' + c + '" />';
        s += t(x(iss) + 8, y - 9, str(r.version), "dg-val", "start", 10);
      }
      if(!ok && wd){
        const months = Math.round((today - wd) / 2629800000);
        s += t(W - P.r + 6, y + 3, months + " mo stale", "dg-bad", "start", 10);
      }else if(ok){
        s += t(W - P.r + 6, y + 3, "current", "dg-ax", "start", 10);
      }
      if(r.affected) s += t(W - P.r + 6, y + 14, fmtNum(r.affected) + " inducted", "dg-ax", "start", 9);
    });

    const stale = rows.filter(function(r){ return r.ok === false; });
    const total = stale.reduce(function(acc, r){ return acc + n(r.affected); }, 0);
    return head(a) + frame(s, H) + verdict(
      stale.length ? stale.length + " of " + rows.length + " still on withdrawn content" : "All current",
      stale.length ? stale.map(function(r){ return str(r.name); }).join(" and ") +
        (total ? ", and " + fmtNum(total) + " people taught the withdrawn method as the correct one" : "") +
        (parent.replacedBy ? ". Current parent is " + str(parent.replacedBy) + "." : "")
        : str(a.notes),
      a.cite ? "Register: " + str(a.cite) : "", stale.length ? "crit" : "ok");
  }

  function textCurrency(a){
    const p = a.parent || {};
    return [str(a.title, "Document currency"),
      p.id ? p.id + " withdrawn " + str(p.withdrawn) + (p.replacedBy ? ", replaced by " + p.replacedBy : "") : "",
      "Reissue obligation: " + n(a.obligationDays, 30) + " days",
      arr(a.rows).map(function(r){
        return "- " + str(r.name) + ": " + str(r.version) + " issued " + str(r.issued) +
          (r.ok === false ? "  STALE" : "  current") + (r.affected ? ", " + r.affected + " inducted" : "");
      }).join("\n"),
      a.cite ? "Source: " + a.cite : ""].filter(Boolean).join("\n");
  }

  /* ================= registry ================= */
  const TYPES = {
    heatmap:   { icon: "grid",      label: "Heatmap",           render: renderHeatmap,    text: textHeatmap },
    currency:  { icon: "timeline",  label: "Currency",          render: renderCurrency,   text: textCurrency },
  };

  /* Names a person, a journey or a model might reasonably reach for. */
  const ALIAS = {
    matrix: "heatmap", grid: "heatmap", concentration: "heatmap", coverage: "heatmap",
    versions: "currency", register: "currency", staleness: "currency", currentness: "currency",
  };

  function typeOf(spec){
    const raw = String((spec && (spec.diagram || spec.type)) || "").toLowerCase().trim();
    return TYPES[raw] ? raw : (ALIAS[raw] || null);
  }

  function render(spec){
    const k = typeOf(spec);
    if(!k) return "";
    try{ return TYPES[k].render(spec); }
    catch(err){
      return '<div class="dg-err">' + Icons.el("alert") +
        "<span>This diagram could not be drawn: " + esc(err.message) + "</span></div>";
    }
  }
  function toText(spec){
    const k = typeOf(spec);
    if(!k) return "";
    try{ return TYPES[k].text(spec); }catch(e){ return ""; }
  }

  /* ==================================================================
     PICKING A DIAGRAM FOR A QUESTION

     The edition declares diagrams with the phrases they answer. This
     runs after retrieval and before the model, so the drawing appears
     whether or not a key is set, which is the difference between a
     capability and a demo that needs the wifi to work.

     `needs` names the documents the drawing is built from, and the
     drawing is withheld unless the person can read all of them.
     Otherwise a diagram becomes a way around access control: the chart
     of a restricted record is the restricted record.
     ================================================================== */
  function pick(question, role){
    const defs = arr(typeof Config !== "undefined" && Config.diagrams);
    if(!defs.length) return null;
    const q = " " + String(question || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ") + " ";

    let best = null, bestScore = 0;
    defs.forEach(function(d){
      let score = 0;
      arr(d.when).forEach(function(phrase){
        const p = String(phrase).toLowerCase().trim();
        if(!p) return;
        if(q.indexOf(" " + p + " ") >= 0 || q.indexOf(p) >= 0) score += p.split(" ").length;
      });
      if(score > bestScore){ bestScore = score; best = d; }
    });
    if(!best || bestScore < n(best.floor, 2)) return null;

    /* every source document has to be readable, or there is no drawing */
    const needs = arr(best.needs);
    if(needs.length && typeof Retrieval !== "undefined" && role){
      const ok = needs.every(function(id){
        const doc = (Config.kb || []).filter(function(x){ return x.id === id; })[0];
        return doc ? Retrieval.visibleTo(doc, role) : true;
      });
      if(!ok) return null;
    }
    return best.spec ? Object.assign({ _id: best.id }, best.spec) : null;
  }

  /* Handed to the model alongside the generic artifact schemas. Kept
     next to the renderers so the two cannot drift: a schema that
     describes a field nobody draws is worse than no schema. */
  const SCHEMA = [
    '{"type":"heatmap","title","rows":[],"cols":[],"values":[[0]],"unit":"%","target":0,"notes","cite"}',
    '{"type":"currency","title","today":"YYYY-MM-DD","parent":{"id","withdrawn":"YYYY-MM-DD","replacedBy"},"obligationDays":30,"rows":[{"name","version","issued":"YYYY-MM-DD","ok":true,"affected":0}],"cite"}',
    "Use these for anything a lending professional would expect to see drawn: a concentration or coverage matrix, or derived material against the revision it was built from. Never invent figures. Every number must come from a retrieved passage.",
  ].join("\n");

  return {
    TYPES: TYPES,
    SCHEMA: SCHEMA,
    typeOf: typeOf,
    render: render,
    toText: toText,
    pick: pick,
    icon: function(spec){ const k = typeOf(spec); return k ? TYPES[k].icon : "layers"; },
    label: function(spec){ const k = typeOf(spec); return k ? TYPES[k].label : "Diagram"; },
  };
})();
