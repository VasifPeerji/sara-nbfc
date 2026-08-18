/* ------------------------------------------------------------------
   Guided tasks.

   Answering a question is useful. Finishing the job is why someone opens
   the tool at all. A guided task walks a person through real work they
   have to do anyway — submitting a sample, raising a permit, preparing an
   audit — and hands them the finished document at the end.

   Two things make this different from a form:

   1. Every rule it applies is quoted from the company's own documents and
      cited, so the person can see why they are being asked for something
      and check it. A generic form asserts; this shows its source.
   2. It runs inside the conversation. Anyone can stop mid-task, ask
      something in their own words, and carry on. The task is a helper, not
      a mode you are trapped in.

   The structure is deterministic and authored in the edition file: the
   steps, the branching and the document produced at the end never depend
   on a model call, so a task always completes even with no API key and no
   network. Where a model is available it adds a written summary on top.
   That order matters — reliability first, polish second.
   ------------------------------------------------------------------ */

const Journeys = (function(){

  let active = null;     /* { journey, at, answers, msgId, done } */

  function all(){ return Config.journeys || []; }
  function find(id){ return all().find(function(j){ return j.id === id; }) || null; }

  /* A task nobody in this role can act on is noise. Scoping the list keeps
     the picker honest rather than showing everyone everything. */
  function forRole(role){
    const key = (role || currentRole()).key;
    return all().filter(function(j){
      return !j.for || !j.for.length || j.for.indexOf(key) !== -1;
    });
  }
  function available(){ return forRole().length > 0; }

  /* ================= step logic ================= */

  /* A step can depend on an earlier answer, which is what makes a task feel
     like the job rather than a questionnaire: nobody should be asked about
     a withholding period for a crop that has none. */
  function visible(step, answers){
    if(!step.when) return true;
    return Object.keys(step.when).every(function(field){
      const want = step.when[field];
      const got = answers[field];
      const list = Array.isArray(want) ? want : [want];
      if(Array.isArray(got)) return got.some(function(g){ return list.indexOf(g) !== -1; });
      return list.indexOf(got) !== -1;
    });
  }

  function steps(journey, answers){
    return (journey.steps || []).filter(function(s){ return visible(s, answers); });
  }

  function stepAt(){
    if(!active) return null;
    const list = steps(active.journey, active.answers);
    return list[active.at] || null;
  }

  function progress(){
    if(!active) return { at: 0, total: 0 };
    const list = steps(active.journey, active.answers);
    return { at: Math.min(active.at, list.length), total: list.length };
  }

  /* ================= grounding =================
     The point of difference. A step that says "collect at least 20 heads"
     is an assertion; a step that shows the passage it came from, with the
     document id and date, is something the person can act on and defend. */
  function guidance(step){
    if(!step || !step.cite) return null;
    const doc = Config.kb.find(function(d){ return d.id === step.cite; });
    if(!doc) return null;
    if(!Retrieval.visibleTo(doc, currentRole())) return null;
    const terms = Retrieval.tokenize(step.q + " " + (step.help || ""));
    return {
      id: doc.id,
      title: doc.title,
      updated: doc.updated,
      text: Retrieval.snippet(doc.body, terms, 46),
    };
  }

  /* ================= rendering ================= */

  function fieldMarkup(step){
    const id = "jf_" + step.id;
    const answer = active.answers[step.id];

    if(step.type === "choice" || step.type === "multi"){
      const multi = step.type === "multi";
      const chosen = multi ? (Array.isArray(answer) ? answer : []) : [answer];
      return '<div class="jn-opts' + (multi ? " multi" : "") + '">' +
        (step.options || []).map(function(o, i){
          const val = typeof o === "string" ? o : o.v;
          const lbl = typeof o === "string" ? o : (o.t || o.v);
          const sub = typeof o === "string" ? "" : (o.d || "");
          const on = chosen.indexOf(val) !== -1;
          return '<button class="jn-opt' + (on ? " on" : "") + '" ' +
            'onclick="Journeys.pick(' + i + ')">' +
            '<span class="jn-tick">' + Icons.el(multi ? (on ? "check" : "square") : (on ? "check" : "circle")) + "</span>" +
            '<span class="jn-om"><span class="jn-ot">' + esc(lbl) + "</span>" +
            (sub ? '<span class="jn-od">' + esc(sub) + "</span>" : "") + "</span></button>";
        }).join("") +
        (multi ? '<button class="btn btn-primary jn-next" onclick="Journeys.submit()">Continue</button>' : "") +
      "</div>";
    }

    if(step.type === "confirm"){
      return '<div class="jn-confirm">' +
        '<button class="btn btn-primary" onclick="Journeys.answer(true)">' + esc(step.yes || "Yes") + "</button>" +
        '<button class="btn" onclick="Journeys.answer(false)">' + esc(step.no || "No") + "</button>" +
      "</div>";
    }

    const type = step.type === "date" ? "date" : step.type === "number" ? "number" : "text";
    const tag = step.type === "textarea" ? "textarea" : "input";
    const common = 'class="inp jn-in" id="' + id + '" ' +
      'placeholder="' + escAttr(step.placeholder || "") + '" ' +
      'onkeydown="Journeys.key(event)"';

    return '<div class="jn-input">' +
      (tag === "textarea"
        ? "<textarea " + common + ' rows="3"></textarea>'
        : '<input type="' + type + '" ' + common + ">") +
      '<button class="btn btn-primary" onclick="Journeys.submit()">Continue</button>' +
      (step.optional ? '<button class="btn jn-skip" onclick="Journeys.skip()">Skip</button>' : "") +
    "</div>";
  }

  function answeredRow(step, value){
    const auto = !!(active && active.prefilled && active.prefilled[step.id]);
    return '<button class="jn-done' + (auto ? " is-auto" : "") + '" onclick="Journeys.reopen(\'' +
      escJs(step.id) + '\')" title="Change this answer">' +
      '<span class="jn-dtick">' + Icons.el(auto ? "spark" : "check") + "</span>" +
      '<span class="jn-dm"><span class="jn-dq">' + esc(step.q) +
        (auto ? '<span class="jn-dauto">from your request</span>' : "") + "</span>" +
      '<span class="jn-da">' + esc(display(value)) + "</span></span>" +
      '<span class="jn-dedit">' + Icons.el("edit") + "</span>" +
    "</button>";
  }

  function display(v){
    if(Array.isArray(v)) return v.join(", ");
    if(v === true) return "Yes";
    if(v === false) return "No";
    return v === undefined || v === "" ? "—" : String(v);
  }

  function card(){
    if(!active) return "";
    const j = active.journey;
    const list = steps(j, active.answers);
    const p = progress();
    const step = stepAt();
    const pct = p.total ? Math.round((p.at / p.total) * 100) : 0;

    let html = '<div class="jn">' +
      '<div class="jn-head">' +
        '<span class="jn-ic">' + Icons.el(Icons.has(j.icon) ? j.icon : "checklist") + "</span>" +
        '<span class="jn-hm"><span class="jn-ht">' + esc(j.title) + "</span>" +
        '<span class="jn-hs">' + (active.done
          ? "Completed"
          : "Step " + Math.min(p.at + 1, p.total) + " of " + p.total) + "</span></span>" +
        (active.done ? "" : '<button class="jn-x" onclick="Journeys.cancel()" aria-label="Leave this task">' +
          Icons.el("close") + "</button>") +
      "</div>" +
      '<div class="jn-bar"><i style="width:' + (active.done ? 100 : pct) + '%"></i></div>' +
      '<div class="jn-body">';

    /* answered so far */
    list.slice(0, p.at).forEach(function(s){
      html += answeredRow(s, active.answers[s.id]);
    });

    if(active.done){
      html += '<div class="jn-finish">' +
        '<span class="jn-fic">' + Icons.el("check") + "</span>" +
        '<span class="jn-fm"><span class="jn-ft">' + esc(j.doneTitle || "Done") + "</span>" +
        '<span class="jn-fd">' + esc(j.doneNote || "Your document is in the workspace on the right. You can download or print it from there.") +
        "</span></span></div>" +
        '<div class="jn-acts">' +
          '<button class="btn btn-primary" onclick="Journeys.showResult()">' + Icons.el("doc") + "Open the document</button>" +
          '<button class="btn" onclick="Journeys.restart()">' + Icons.el("refresh") + "Start again</button>" +
        "</div>";
    }else if(step){
      const g = guidance(step);
      html += '<div class="jn-step">' +
        '<div class="jn-q">' + esc(step.q) + (step.optional ? '<span class="jn-opt-tag">optional</span>' : "") + "</div>" +
        (step.help ? '<div class="jn-help">' + esc(step.help) + "</div>" : "") +
        (g ? '<div class="jn-cite">' +
              '<div class="jn-cite-h">' + Icons.el("library") +
                "<span>From " + esc(g.id) + (g.updated ? " · updated " + esc(fmtDate(g.updated)) : "") + "</span>" +
                '<button class="jn-cite-open" onclick="Modals.openDoc(\'' + escJs(g.id) + '\')">Open</button>' +
              "</div>" +
              '<div class="jn-cite-t">' + esc(g.text) + "</div>" +
            "</div>" : "") +
        fieldMarkup(step) +
      "</div>";
    }

    return html + "</div></div>";
  }

  function paint(){
    if(!active) return;
    const host = el("jn_" + active.msgId);
    if(!host) return;
    host.innerHTML = card();
    Icons.hydrate(host);
    const input = host.querySelector(".jn-in");
    if(input) setTimeout(function(){ input.focus(); }, 40);
    Chat.scrollToEnd();
  }

  /* ================= flow ================= */

  /** Start a task, optionally already knowing some of the answers.

      A request like "get the additional work authorised on RO-118402, front
      pads at 2mm, red, quoted $486" has already answered four of the eight
      questions. Asking them again is the fastest way to make a guided task
      feel like a form rather than an assistant, so anything the request
      carried is filled in, marked as having come from the request, and
      skipped. Every prefilled answer is still one click away from being
      changed, because a wrong value that cannot be corrected is worse than
      a question that was asked twice. */
  function start(id, prefill){
    const j = find(id);
    if(!j) return;
    if(S.streaming){ toast("Wait for the current answer to finish", "warn"); return; }

    const seed = {};
    const from = {};
    if(prefill && typeof prefill === "object"){
      (j.steps || []).forEach(function(s){
        const v = prefill[s.id];
        if(v === undefined || v === null || v === "") return;
        seed[s.id] = v;
        from[s.id] = true;
      });
    }

    const convo = Chat.beginJourney(j);
    active = { journey: j, at: 0, answers: seed, prefilled: from,
               msgId: convo.msgId, done: false, result: null };
    Analytics.track("task", { id: j.id, ev: "start", n: Object.keys(seed || {}).length });
    skipAnswered();
    paint();
  }

  /** Walk past anything the request already answered. Conditional steps are
      re-evaluated as it goes, because filling one answer can reveal or hide
      a later question. */
  function skipAnswered(){
    if(!active) return;
    let guard = 0;
    while(guard++ < 64){
      const list = steps(active.journey, active.answers);
      if(active.at >= list.length){ finish(); return; }
      const s = list[active.at];
      const has = active.answers[s.id] !== undefined && active.answers[s.id] !== "";
      if(!has || !active.prefilled[s.id]) return;
      active.at++;
    }
  }

  /** How many of the current answers came from the request rather than
      from the person working through the task. */
  function prefilledCount(){
    if(!active || !active.prefilled) return 0;
    const list = steps(active.journey, active.answers);
    return list.filter(function(s){ return active.prefilled[s.id]; }).length;
  }

  function pick(i){
    const step = stepAt();
    if(!step) return;
    const o = (step.options || [])[i];
    if(o === undefined) return;
    const val = typeof o === "string" ? o : o.v;

    if(step.type === "multi"){
      const cur = Array.isArray(active.answers[step.id]) ? active.answers[step.id].slice() : [];
      const at = cur.indexOf(val);
      if(at === -1) cur.push(val); else cur.splice(at, 1);
      active.answers[step.id] = cur;
      paint();
      return;
    }
    answer(val);
  }

  function submit(){
    const step = stepAt();
    if(!step) return;
    if(step.type === "multi"){
      const cur = active.answers[step.id];
      if((!cur || !cur.length) && !step.optional){ toast("Pick at least one", "warn"); return; }
      advance();
      return;
    }
    const node = el("jf_" + step.id);
    const value = node ? String(node.value || "").trim() : "";
    if(!value && !step.optional){ toast("This one is needed to finish the task", "warn"); return; }
    answer(value);
  }

  function skip(){
    const step = stepAt();
    if(!step) return;
    active.answers[step.id] = "";
    advance();
  }

  function answer(value){
    const step = stepAt();
    if(!step) return;
    active.answers[step.id] = value;
    /* answering it by hand means it is theirs now, not the request's */
    if(active.prefilled) delete active.prefilled[step.id];
    advance();
  }

  function key(e){
    if(e.key !== "Enter") return;
    const step = stepAt();
    if(step && step.type === "textarea" && !e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    submit();
  }

  /* Changing an earlier answer rewinds to it. Anything after may no longer
     apply, because branching depends on it. */
  function reopen(stepId){
    if(!active || active.done) return;
    const list = steps(active.journey, active.answers);
    const at = list.findIndex(function(s){ return s.id === stepId; });
    if(at === -1) return;
    active.at = at;
    paint();
  }

  function advance(){
    active.at++;
    const list = steps(active.journey, active.answers);
    if(active.at >= list.length){ finish(); return; }
    skipAnswered();
    if(active && !active.done) paint();
  }

  function cancel(){
    if(!active) return;
    const host = el("jn_" + active.msgId);
    if(host) host.innerHTML = '<div class="jn jn-left">' + Icons.el("info") +
      "<span>Task left. Ask anything, or start it again from the tasks list.</span></div>";
    active = null;
  }

  function restart(){
    if(!active) return;
    const id = active.journey.id;
    active = null;
    start(id);
  }

  /* ================= the document ================= */

  function fill(template, answers){
    return String(template || "").replace(/\{(\w+)\}/g, function(m, field){
      const v = answers[field];
      return v === undefined || v === "" ? "—" : display(v);
    });
  }

  /* ==================================================================
     TURNING ANSWERS INTO A DRAWING

     A produced record can carry a diagram, and the diagram has to be
     built from what the person just answered rather than from a fixed
     picture. A settlement waterfall drawn from a template is
     decoration; one drawn from the figures this person actually
     entered is the record.

     The edition stays declarative: it writes `diagram: { use: "..." }`
     plus any fixed values, and the builders below do the work. Nothing
     here calls a model, so the drawing appears with no key and no
     network, which is the whole point of it.
     ================================================================== */

  function deepFill(v, a){
    if(typeof v === "string") return fill(v, a);
    if(Array.isArray(v)) return v.map(function(x){ return deepFill(x, a); });
    if(v && typeof v === "object"){
      const out = {};
      Object.keys(v).forEach(function(k){ out[k] = deepFill(v[k], a); });
      return out;
    }
    return v;
  }

  /** A multi-select answer arrives as an array, a single as a string. */
  function list(v){
    if(Array.isArray(v)) return v.slice();
    if(v == null || v === "") return [];
    return [String(v)];
  }
  function dnum(v, d){
    const x = parseFloat(String(v == null ? "" : v).replace(/[^0-9.\-]/g, ""));
    return isFinite(x) ? x : (d || 0);
  }

  /* Populated in the engine phase alongside the computation, decision and
     clock outputs. A builder turns what the person just answered into a
     spec: a settlement waterfall drawn from a template is decoration, one
     drawn from the figures this person actually entered is the record. */
  const DIAGRAM_FROM = {};

  /* Per-type emptiness tests. A drawing with no rows is a box with a
     title on it, which reads as a defect rather than as an absence. */
  const EMPTY_WHEN = {};

  function buildDiagram(spec, a){
    if(!spec) return null;
    const made = Object.assign({}, deepFill(spec, a));
    const use = made.use || made.type;
    const out = DIAGRAM_FROM[use] ? DIAGRAM_FROM[use](made, a) : made;
    delete out.use;
    /* an empty drawing is worse than no drawing */
    if(EMPTY_WHEN[out.type] && EMPTY_WHEN[out.type](out)) return null;
    return out;
  }

  /* Built from the answers and the edition's template, with no model call,
     so a task always produces its document. */
  function build(){
    const j = active.journey;
    const a = active.answers;
    const p = j.produce || {};

    const meta = (p.meta || []).map(function(m){
      return { k: m.k, v: m.from ? display(a[m.from]) : fill(m.v, a) };
    });
    meta.push({ k: "Prepared by", v: (S.user && S.user.name) || "—" });
    meta.push({ k: "Date", v: fmtDate(new Date().toISOString().slice(0, 10)) });

    const sections = (p.sections || []).filter(function(s){
      return !s.when || visible({ when: s.when }, a);
    }).map(function(s){
      /* a section can quote a document rather than restate it, which keeps
         the produced record consistent with the procedure it came from */
      if(s.fromDoc){
        const doc = Config.kb.find(function(d){ return d.id === s.fromDoc; });
        if(doc && Retrieval.visibleTo(doc, currentRole())){
          const para = String(doc.body).split(/\n\s*\n/)[s.para || 0] || "";
          return { h: s.h || doc.title, body: para + "\n\nSource: " + doc.id +
                   (doc.updated ? ", updated " + fmtDate(doc.updated) : "") };
        }
        return null;
      }
      const out = { h: s.h, body: fill(s.body, a) };
      if(s.diagram){
        const d = buildDiagram(s.diagram, a);
        if(d) out.diagram = d;
      }
      return out;
    }).filter(Boolean);

    return {
      type: "document",
      kind: p.kind || "Record",
      title: fill(p.title || j.title, a),
      meta: meta,
      sections: sections,
      footer: fill(p.footer || "", a),
    };
  }

  function finish(){
    active.done = true;
    const spec = build();

    /* What was put in and what came out. The produced record is
       flattened to text here so it can be read back without the app. */
    try{
      const flat = [spec.title || ""]
        .concat((spec.meta || []).map(function(m){ return m.k + ": " + m.v; }))
        .concat((spec.sections || []).map(function(s){
          return (s.h ? s.h + "\n" : "") + String(s.body || "");
        }))
        .join("\n\n");
      Analytics.track("task", {
        id: active.journey.id, ev: "done",
        n: (active.journey.steps || []).length,
        title: active.journey.title,
        inputs: active.answers,
        output: flat,
      });
    }catch(e){ /* recording must never break a deliverable */ }

    const id = "jn_" + active.msgId;
    active.result = id;

    Panel.add({ id: id, kind: "artifact", title: spec.title, spec: spec,
                ts: Date.now(), msgId: active.msgId });
    Panel.open();
    paint();

    Chat.completeJourney(active.journey, active.answers, spec, id);
  }

  function showResult(){
    if(active && active.result) Panel.show(active.result);
  }

  /* ================= entry points ================= */

  function cardsMarkup(limit){
    const list = forRole().slice(0, limit || 6);
    if(!list.length) return "";
    return '<div class="jn-cards">' + list.map(function(j){
      return '<button class="jn-card" onclick="Journeys.start(\'' + escJs(j.id) + '\')">' +
        '<span class="jn-cic">' + Icons.el(Icons.has(j.icon) ? j.icon : "checklist") + "</span>" +
        '<span class="jn-cm"><span class="jn-ct">' + esc(j.title) + "</span>" +
        (j.tagline ? '<span class="jn-cs">' + esc(j.tagline) + "</span>" : "") + "</span>" +
        (j.est ? '<span class="jn-cest">' + esc(j.est) + "</span>" : "") +
      "</button>";
    }).join("") + "</div>";
  }

  function openPicker(){
    if(!available()){ toast("No guided tasks are configured for your role", "info"); return; }
    const list = forRole();
    const body = el("taskList");
    if(!body) return;
    body.innerHTML = list.map(function(j){
      return '<button class="jn-card" onclick="Modals.close(\'ovTasks\');Journeys.start(\'' + escJs(j.id) + '\')">' +
        '<span class="jn-cic">' + Icons.el(Icons.has(j.icon) ? j.icon : "checklist") + "</span>" +
        '<span class="jn-cm"><span class="jn-ct">' + esc(j.title) + "</span>" +
        (j.tagline ? '<span class="jn-cs">' + esc(j.tagline) + "</span>" : "") +
        (j.intro ? '<span class="jn-cintro">' + esc(j.intro) + "</span>" : "") + "</span>" +
        (j.est ? '<span class="jn-cest">' + esc(j.est) + "</span>" : "") +
      "</button>";
    }).join("");
    const sub = el("taskSub");
    if(sub) sub.textContent = list.length + " task" + (list.length === 1 ? "" : "s") +
      " you can complete here, for " + ((currentRole().title) || "your role") + ".";
    Icons.hydrate(body);
    Modals.show("ovTasks");
  }

  function init(){
    const btn = el("railTasks");
    if(btn) btn.style.display = available() ? "" : "none";
  }

  return {
    init: init, start: start, openPicker: openPicker, cardsMarkup: cardsMarkup,
    pick: pick, submit: submit, skip: skip, answer: answer, key: key,
    reopen: reopen, cancel: cancel, restart: restart, showResult: showResult,
    prefilledCount: prefilledCount,
    available: available, forRole: forRole, all: all, find: find,
    /* exposed for the tests */
    _visible: visible, _steps: steps, _fill: fill, _diagram: buildDiagram,
    get active(){ return active; },
    get answers(){ return active ? active.answers : null; },
    _build: function(){ return build(); },
  };
})();
