/* Guided tasks: the config contract, branching, and the document produced.

   The check that matters most here is the last group: a task must complete
   and produce a usable document with no API key and no network. A task that
   silently depends on a model call is a task that fails in front of the
   person it was built for.

   Run:  node test/test_journeys.js [edition]
*/
const H = require("./harness");
const edition = process.argv[2] || "base";
H.loadEdition(edition);
H.loadSrc();
Retrieval.build();

console.log(`\n  SARA guided task tests — edition "${edition}"`);

const J = Config.journeys;

/* ================= contract ================= */
H.section("Every task is complete enough to run");
{
  H.ok(J.length >= 1, "the edition ships at least one guided task");
  H.eq(new Set(J.map(j => j.id)).size, J.length, "task ids are unique");

  J.forEach(function(j){
    const at = 'task "' + j.id + '"';
    H.ok(!!j.title && j.title.length > 6, at + " has a real title");
    H.ok(!!j.tagline, at + " has a tagline for the card");
    H.ok(Icons.has(j.icon), at + ' uses a real icon ("' + j.icon + '")');
    /* The cap is on what the person is ASKED, not on the number of steps.
       A calc, check or clock step is a result rather than a question: it
       works something out from earlier answers and shows it. Counting a
       computed figure against the budget for someone's patience would push
       tasks towards showing less working, which is the opposite of the
       point. */
    const DERIVED_TYPES = ["calc", "check", "clock"];
    const asked = j.steps.filter(s => DERIVED_TYPES.indexOf(s.type) === -1);
    H.ok(asked.length >= 3, at + " asks for enough to be worth doing");
    H.ok(asked.length <= 12,
         at + " asks " + asked.length + " questions, which is more than someone will finish");
    H.ok(j.steps.length <= 16, at + " has " + j.steps.length + " steps in total, which is too long to follow");
    H.ok(!!j.produce, at + " produces something");
    H.ok(!!j.produce.title, at + " names what it produces");
    H.ok((j.produce.sections || []).length >= 2, at + " produces a document with real structure");
    j.for.forEach(function(k){
      H.ok(!!Config.roleByKey[k], at + ' is scoped to a role that exists ("' + k + '")');
    });
  });
}

H.section("Every step can be answered");
{
  /* The derived types ask nothing: they work something out from earlier
     answers and show it. They still carry `q`, because the step is
     announced before the working appears. */
  const TYPES = ["choice", "multi", "text", "textarea", "number", "date", "confirm",
                 "calc", "check", "clock", "table", "file"];
  const DERIVED = ["calc", "check", "clock"];
  J.forEach(function(j){
    const ids = j.steps.map(s => s.id);
    H.eq(new Set(ids).size, ids.length, 'task "' + j.id + '" has unique field ids');

    j.steps.forEach(function(s, i){
      const at = 'task "' + j.id + '" step ' + (i + 1);
      H.ok(!!s.q, at + " asks something");
      H.ok(TYPES.indexOf(s.type) !== -1, at + ' has a known type ("' + s.type + '")');
      if(s.type === "choice" || s.type === "multi"){
        H.ok(s.options.length >= 2, at + " offers a real choice");
        /* A radio list is read top to bottom before choosing, so it stays
           short. A checkbox list is scanned and ticked, so it may be longer
           where the domain genuinely has that many items: the fatal risk
           set is eleven because the framework names eleven, and splitting
           it across two questions would be worse than a long list. */
        H.ok(s.options.length <= (s.type === "multi" ? 13 : 12),
             at + " is not an unreadable list (" + s.options.length + " options)");
        const vals = s.options.map(o => (typeof o === "string" ? o : o.v));
        H.eq(new Set(vals).size, vals.length, at + " has distinct option values");
        H.ok(vals.every(v => !!v), at + " has no empty option values");
      }
      /* branching must point at a field that is asked earlier, or the step
         can never appear */
      if(s.when){
        Object.keys(s.when).forEach(function(f){
          const src = j.steps.findIndex(x => x.id === f);
          H.ok(src !== -1, at + ' branches on a field that exists ("' + f + '")');
          H.ok(src < i, at + ' branches on a field asked before it ("' + f + '")');
        });
      }

      /* A derived step computes from what came before, so everything it
         reads has to have been asked already. A line referring forward
         silently evaluates to zero, which is the worst possible failure in
         a figure somebody sends to a customer. */
      if(DERIVED.indexOf(s.type) !== -1){
        const earlier = j.steps.slice(0, i).map(x => x.id);
        const own = [];
        const refs = [];
        if(s.type === "calc"){
          H.ok(!!(s.compute && s.compute.lines || []).length, at + " declares lines to compute");
          (s.compute.lines || []).forEach(function(l){
            H.ok(!!l.label, at + " has a label on every line");
            H.ok(!!l.op, at + " names an operation on every line");
            if(l.as) own.push(l.as);
            ["from", "of", "rate", "days", "pct", "principal", "months", "part", "whole", "to"]
              .forEach(function(k){
                const v = l[k];
                if(typeof v === "string") refs.push(v);
                else if(Array.isArray(v)) v.forEach(function(x){ if(typeof x === "string") refs.push(x); });
              });
            if(l.when) Object.keys(l.when).forEach(function(f){ refs.push(f); });
          });
          if(s.compute.total && s.compute.total.of) s.compute.total.of.forEach(function(k){ refs.push(k); });
        }
        if(s.type === "check"){
          H.ok(!!(s.rules || []).length, at + " declares rules to check");
          (s.rules || []).forEach(function(r){
            H.ok(!!r.label, at + " has a label on every rule");
            /* An unknown test silently reports not-applicable, so the rule
               looks like it ran and never fails. */
            H.ok(!r.test || !!Calc.TESTS[r.test],
                 at + ' uses test "' + r.test + '", which does not exist');
            if(typeof r.of === "string") refs.push(r.of);
            if(r.when) Object.keys(r.when).forEach(function(f){ refs.push(f); });
          });
        }
        if(s.type === "clock"){
          const clocks = s.clocks || (s.clock ? [s.clock] : []);
          H.ok(clocks.length > 0, at + " declares at least one clock");
          clocks.forEach(function(c){
            H.ok(!!c.label, at + " has a label on every clock");
            H.ok(c.every !== undefined, at + " states an interval on every clock");
            if(typeof c.from === "string") refs.push(c.from);
          });
        }
        refs.forEach(function(ref){
          /* a bare numeric literal is a constant, not a reference */
          if(/^-?[\d.]+$/.test(String(ref))) return;
          H.ok(earlier.indexOf(ref) !== -1 || own.indexOf(ref) !== -1,
               at + ' reads "' + ref + '", which is not asked before it and is not one of its own lines');
        });
      }

      if(s.type === "table"){
        H.ok((s.columns || []).length >= 2, at + " declares at least two columns");
        const keys = (s.columns || []).map(c => c.key);
        H.eq(new Set(keys).size, keys.length, at + " has distinct column keys");
        H.ok(keys.every(Boolean), at + " has no empty column keys");
      }

      if(s.type === "file"){
        H.ok((s.fields || []).length >= 1, at + " names at least one field to read");
        (s.fields || []).forEach(function(f){
          H.ok(!!f.key, at + " has a key on every field");
          const pats = Array.isArray(f.match) ? f.match : [f.match];
          pats.forEach(function(pat){
            let ok = true;
            try{ new RegExp(pat); }catch(e){ ok = false; }
            H.ok(ok, at + ' has an invalid pattern for "' + f.key + '"');
          });
        });
      }
    });
  });
}

/* ================= grounding =================
   The reason this is not a form: the rule being applied is quoted from the
   company's own document, with its id, and the person can open it. */
H.section("Cited guidance resolves to a real, readable document");
{
  let cited = 0;
  J.forEach(function(j){
    j.steps.forEach(function(s, i){
      if(!s.cite) return;
      cited++;
      const at = 'task "' + j.id + '" step ' + (i + 1);
      const doc = Config.kb.find(d => d.id === s.cite);
      H.ok(!!doc, at + ' cites a document that exists ("' + s.cite + '")');
      if(!doc) return;
      /* a task offered to a role that cannot read the cited document would
         show a step with no justification behind it */
      j.for.forEach(function(k){
        const role = Config.roleByKey[k];
        if(role) H.ok(Retrieval.visibleTo(doc, role),
                      at + " cites " + s.cite + ", which " + k + " is cleared to read");
      });
    });

    (j.produce.sections || []).forEach(function(sec){
      if(sec.fromStep){
        const src = j.steps.filter(x => x.id === sec.fromStep)[0];
        H.ok(!!src, 'task "' + j.id + '" has a section reading step "' + sec.fromStep + '", which does not exist');
        if(src) H.ok(["calc", "check", "clock"].indexOf(src.type) !== -1,
          'task "' + j.id + '" reads step "' + sec.fromStep + '", which is a ' + src.type + ' and produces no working');
      }
      if(sec.fromTable){
        const src = j.steps.filter(x => x.id === sec.fromTable)[0];
        H.ok(!!src && src.type === "table",
          'task "' + j.id + '" has a section reading table "' + sec.fromTable + '", which is not a table step');
      }
      if(!sec.fromDoc) return;
      const doc = Config.kb.find(d => d.id === sec.fromDoc);
      H.ok(!!doc, 'task "' + j.id + '" quotes a document that exists ("' + sec.fromDoc + '")');
      if(!doc) return;
      const paras = String(doc.body).split(/\n\s*\n/);
      H.ok((sec.para || 0) < paras.length,
           'task "' + j.id + '" quotes paragraph ' + (sec.para || 0) + " of " + sec.fromDoc + ", which exists");
      H.ok(paras[sec.para || 0].length > 60,
           'task "' + j.id + '" quotes a substantive paragraph of ' + sec.fromDoc);
    });
  });
  H.ok(cited >= 2, "the edition's tasks cite the knowledge base at least twice");
}

/* ================= role scoping ================= */
H.section("Tasks are offered to people who can act on them");
{
  const covered = new Set();
  J.forEach(j => j.for.forEach(k => covered.add(k)));
  H.ok(covered.size >= 2, "tasks span more than one role");

  Config.roles.forEach(function(r){
    const list = Journeys.forRole(r);
    H.ok(list.every(j => !j.for.length || j.for.indexOf(r.key) !== -1),
         r.key + " is only offered tasks scoped to them");
  });

  const unscoped = J.filter(j => !j.for.length);
  unscoped.forEach(function(j){
    H.eq(Journeys.forRole(Config.roles[0]).indexOf(j) !== -1, true,
         'task "' + j.id + '" has no scope, so everyone sees it');
  });
}

/* ================= branching ================= */
H.section("Branching shows and hides the right steps");
{
  const vis = Journeys._visible;
  H.eq(vis({ when: null }, {}), true, "a step with no condition always shows");
  H.eq(vis({ when: { a: "x" } }, { a: "x" }), true, "an exact match shows the step");
  H.eq(vis({ when: { a: "x" } }, { a: "y" }), false, "a different answer hides it");
  H.eq(vis({ when: { a: ["x", "y"] } }, { a: "y" }), true, "any of a list matches");
  H.eq(vis({ when: { a: [true] } }, { a: true }), true, "a confirm answer matches");
  H.eq(vis({ when: { a: [true] } }, { a: false }), false, "and the opposite does not");
  H.eq(vis({ when: { a: ["x"] } }, { a: ["x", "z"] }), true, "a multi-select containing the value matches");
  H.eq(vis({ when: { a: ["x"] } }, {}), false, "an unanswered condition hides the step");
  H.eq(vis({ when: { a: "x", b: "y" } }, { a: "x", b: "y" }), true, "two conditions both met shows");
  H.eq(vis({ when: { a: "x", b: "y" } }, { a: "x", b: "z" }), false, "two conditions, one unmet hides");

  /* every conditional step is reachable by some real set of answers */
  J.forEach(function(j){
    j.steps.filter(s => s.when).forEach(function(s){
      const answers = {};
      Object.keys(s.when).forEach(function(f){
        const w = s.when[f];
        answers[f] = Array.isArray(w) ? w[0] : w;
      });
      H.eq(Journeys._visible(s, answers), true,
           'task "' + j.id + '" step "' + s.id + '" is reachable');
      /* and the values it branches on are ones the earlier step can produce */
      Object.keys(s.when).forEach(function(f){
        const src = j.steps.find(x => x.id === f);
        if(!src || (src.type !== "choice" && src.type !== "multi")) return;
        const vals = src.options.map(o => (typeof o === "string" ? o : o.v));
        const want = Array.isArray(s.when[f]) ? s.when[f] : [s.when[f]];
        want.forEach(function(v){
          H.ok(vals.indexOf(v) !== -1,
               'task "' + j.id + '" step "' + s.id + '" branches on "' + v + '", which "' + f + '" can actually return');
        });
      });
    });
  });
}

/* ================= interpolation ================= */
H.section("Answers reach the document");
{
  const fill = Journeys._fill;
  H.eq(fill("Hello {name}", { name: "Ada" }), "Hello Ada", "a field is substituted");
  H.eq(fill("{a} and {b}", { a: "1", b: "2" }), "1 and 2", "several fields are substituted");
  H.eq(fill("Missing {nope}", {}), "Missing —", "an unanswered field becomes a dash, not the literal token");
  H.eq(fill("List {x}", { x: ["a", "b"] }), "List a, b", "a multi-select renders as a list");
  H.eq(fill("Confirm {x}", { x: true }), "Confirm Yes", "a confirm renders as Yes");
  H.eq(fill("Confirm {x}", { x: false }), "Confirm No", "and No");
  H.eq(fill("No fields here", {}), "No fields here", "text with no fields is untouched");

  /* every {token} in a produce block must be a field the task actually asks */
  J.forEach(function(j){
    const ids = j.steps.map(s => s.id);
    const blob = JSON.stringify(j.produce);
    (blob.match(/\{(\w+)\}/g) || []).forEach(function(tok){
      const field = tok.slice(1, -1);
      H.ok(ids.indexOf(field) !== -1,
           'task "' + j.id + '" interpolates {' + field + '}, which it asks for');
    });
  });
}

/* ================= completion, with no model and no network =================
   The point of the whole design. */
H.section("A task completes and produces a document offline");
{
  S.user = Config.users[0];
  S.role = Config.roleByKey[S.user.roleKey];

  /* no provider key at all */
  Keys.revoke(S.provider);
  H.eq(Keys.get(S.provider), "", "no API key is configured for this check");

  J.forEach(function(j){
    const at = 'task "' + j.id + '"';
    const answers = {};

    /* Sign in as somebody the task is actually offered to. Building it as
       whoever happened to be first in the cast quietly drops every quoted
       section they are not cleared for, which looks like a broken document
       and is really a clearance filter doing its job. */
    const who = Config.users.find(u => !j.for.length || j.for.indexOf(u.roleKey) !== -1);
    H.ok(!!who, at + " has somebody in the cast who can run it");
    if(who){ S.user = who; S.role = Config.roleByKey[who.roleKey]; }

    /* answer every step the way the first option or a plausible value would */
    j.steps.forEach(function(s){
      if(!Journeys._visible(s, answers)) return;
      if(s.type === "choice"){
        const o = s.options[0];
        answers[s.id] = typeof o === "string" ? o : o.v;
      }else if(s.type === "multi"){
        const o = s.options[0];
        answers[s.id] = [typeof o === "string" ? o : o.v];
      }else if(s.type === "confirm"){
        answers[s.id] = true;
      }else if(s.type === "date"){
        answers[s.id] = "2026-07-29";
      }else if(s.type === "number"){
        answers[s.id] = "12";
      }else{
        answers[s.id] = "Test value for " + s.id;
      }
    });

    const asked = Journeys._steps(j, answers);
    H.ok(asked.length >= 3, at + " asks at least three steps on this path");
    H.ok(asked.every(s => answers[s.id] !== undefined), at + " has every asked step answered");

    /* build the document the way the engine does */
    const spec = (function(){
      const prev = Journeys.active;
      void prev;
      /* drive the real builder through the module's own entry point */
      Journeys.start(j.id);
      Object.keys(answers).forEach(function(k){ Journeys.answers[k] = answers[k]; });
      return Journeys._build();
    })();

    H.eq(spec.type, "document", at + " produces a document artifact");
    H.ok(!!spec.title && spec.title.indexOf("{") === -1, at + " has a fully interpolated title");
    H.ok(spec.sections.length >= 2, at + " produces sections");
    H.ok(spec.meta.some(m => m.k === "Prepared by"), at + " records who prepared it");
    H.ok(spec.meta.some(m => m.k === "Date"), at + " records when");
    H.eq(spec.meta.filter(m => String(m.v).indexOf("{") !== -1), [], at + " leaves no raw tokens in its metadata");

    const body = spec.sections.map(s => s.h + " " + s.body).join("\n");
    H.lacks(body, "{", at + " leaves no raw tokens in its body");
    H.lacks(body, "undefined", at + " has no undefined in its body");

    /* A quoted section carries the document's own words, not a promise.
       Sections gated on an answer are only expected when that answer was
       given: a conditional section correctly absent is not a failure. */
    (j.produce.sections || []).filter(s => s.fromDoc).forEach(function(sec){
      const applies = !sec.when || Journeys._visible({ when: sec.when }, answers);
      const out = spec.sections.find(x => x.h === sec.h ||
        (Config.kb.find(d => d.id === sec.fromDoc) || {}).title === x.h);
      if(!applies){
        H.eq(!!out, false, at + " leaves out the " + sec.fromDoc + " section when its condition is unmet");
        return;
      }
      H.ok(!!out, at + " includes its quoted section for " + sec.fromDoc);
      if(out) H.has(out.body, "Source: " + sec.fromDoc, at + " attributes the quote to " + sec.fromDoc);
    });

    /* and the same task down a branch that does trigger them */
    (j.produce.sections || []).filter(s => s.fromDoc && s.when).forEach(function(sec){
      const branched = Object.assign({}, answers);
      Object.keys(sec.when).forEach(function(f){
        const w = sec.when[f];
        branched[f] = Array.isArray(w) ? w[0] : w;
      });
      Journeys.start(j.id);
      Object.keys(branched).forEach(function(k){ Journeys.answers[k] = branched[k]; });
      const alt = Journeys._build();
      const got = alt.sections.find(x => x.h === sec.h ||
        (Config.kb.find(d => d.id === sec.fromDoc) || {}).title === x.h);
      H.ok(!!got, at + " does include the " + sec.fromDoc + " section when its condition is met");
      if(got) H.has(got.body, "Source: " + sec.fromDoc, at + " attributes it to " + sec.fromDoc);
    });

    /* the artifact renderer accepts it */
    const html = Artifacts.render(spec, "t_" + j.id);
    H.ok(html.length > 200, at + " renders in the workspace");
    H.eq((html.match(/<[^>]*>/g) || []).filter(t => (t.match(/"/g) || []).length % 2).length, 0,
         at + " renders with balanced attribute quotes");
    H.ok(Artifacts.toText(spec).length > 100, at + " exports as text");
  });
}

H.section("Hostile answers cannot break the document");
{
  const nasty = '<img src=x onerror=alert(1)>" onclick="evil()';
  const j = J[0];
  Journeys.start(j.id);
  j.steps.forEach(function(s){ Journeys.answers[s.id] = nasty; });
  const spec = Journeys._build();
  const html = Artifacts.render(spec, "t_hostile");
  H.lacks(html, "<img src=x", "raw markup from an answer does not reach the document");
  H.lacks(html, 'onclick="evil', "an injected handler cannot close an attribute");
  H.eq((html.match(/<[^>]*>/g) || []).filter(t => (t.match(/"/g) || []).length % 2).length, 0,
       "the document renders with balanced quotes despite hostile answers");
}

H.report(`SARA guided tasks (${edition})`);
