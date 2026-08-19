/* ------------------------------------------------------------------
   Artifact panel controller.

   The panel is deliberately not always-on. It opens when an answer
   produces something worth looking at, and stays closed otherwise, so
   that when it does open it means something.
   ------------------------------------------------------------------ */

const Panel = (function(){

  let building = null;   /* artifact id currently streaming */

  /* ---------------- open / close ---------------- */
  /* Two different breakpoints, and conflating them was a bug: the panel
     becomes a floating overlay at 1024, but the sidebar stays an ordinary
     grid column until 820. Only a pane that is actually floating should dim
     the conversation behind it. */
  function isPanelOverlay(){ return window.matchMedia("(max-width:1024px)").matches; }
  function isSideOverlay(){  return window.matchMedia("(max-width:820px)").matches; }
  function isNarrow(){ return isPanelOverlay(); }

  function setOpen(open){
    S.panelOpen = !!open;
    const app = document.getElementById("app");
    app.classList.toggle("panel-off", !S.panelOpen);
    /* only collapse the sidebar when it too is floating, otherwise opening
       the workspace needlessly hides a perfectly good column */
    if(S.panelOpen && isSideOverlay()) app.classList.add("side-off");
    const btn = el("panelBtn");
    if(btn) btn.classList.toggle("on", S.panelOpen);
    const railChats = el("railChats");
    if(railChats) railChats.classList.toggle("on", !app.classList.contains("side-off"));
    syncOverlayScrim();
  }
  function open(){ setOpen(true); }
  function close(){ setOpen(false); }
  function toggle(){ setOpen(!S.panelOpen); }

  function toggleWide(){
    S.panelWide = !S.panelWide;
    document.getElementById("app").classList.toggle("panel-wide", S.panelWide);
    const b = el("panelWideBtn");
    if(b){ b.innerHTML = Icons.svg(S.panelWide ? "collapse" : "expand"); b.classList.toggle("on", S.panelWide); }
  }

  function syncOverlayScrim(){
    const app = document.getElementById("app");
    const sideOpen = !app.classList.contains("side-off");
    document.body.classList.toggle("overlay-open",
      (isPanelOverlay() && S.panelOpen) || (isSideOverlay() && sideOpen));
  }

  /* ---------------- the breakpoints, after boot ----------------

     Only the CROSSINGS are acted on, not every resize. Reapplying the
     boot rule on each event would fight a person who has just closed a
     pane by hand, and reopening one on the way back up is only right
     when we were the ones who closed it in the first place. */
  let wasSideOverlay = null, wasPanelOverlay = null;
  let weCollapsedSide = false, weClosedPanel = false;

  function syncBreakpoints(){
    const app = document.getElementById("app");
    if(!app) return;
    const sideNow = isSideOverlay(), panelNow = isPanelOverlay();

    /* first call establishes the baseline rather than acting on it: at
       boot the layout has already been set from the same widths */
    if(wasSideOverlay === null){
      wasSideOverlay = sideNow;
      wasPanelOverlay = panelNow;
      return;
    }

    if(sideNow !== wasSideOverlay){
      if(sideNow){
        /* it has just become a floating overlay, so an open sidebar is
           now covering the conversation rather than sitting beside it */
        weCollapsedSide = !app.classList.contains("side-off");
        app.classList.add("side-off");
      }else if(weCollapsedSide){
        app.classList.remove("side-off");
        weCollapsedSide = false;
      }
      wasSideOverlay = sideNow;
    }

    if(panelNow !== wasPanelOverlay){
      if(panelNow){
        weClosedPanel = !!S.panelOpen;
        if(S.panelOpen) close();
      }else if(weClosedPanel){
        open();
        weClosedPanel = false;
      }
      wasPanelOverlay = panelNow;
    }

    const railChats = el("railChats");
    if(railChats) railChats.classList.toggle("on", !app.classList.contains("side-off"));
    syncOverlayScrim();
  }

  /* ---------------- resize ---------------- */
  function initResize(){
    const grip = el("panelGrip");
    if(!grip) return;
    let startX = 0, startW = 0, dragging = false;

    const down = function(e){
      dragging = true; grip.classList.add("dragging");
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      startW = document.getElementById("panel").getBoundingClientRect().width;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      e.preventDefault();
    };
    const move = function(e){
      if(!dragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const w = clamp(startW + (startX - x), 320, Math.min(900, window.innerWidth - 420));
      S.panelWidth = Math.round(w);
      document.documentElement.style.setProperty("--panel-w", S.panelWidth + "px");
    };
    const up = function(){
      if(!dragging) return;
      dragging = false; grip.classList.remove("dragging");
      document.body.style.userSelect = ""; document.body.style.cursor = "";
      savePrefs();
    };

    grip.addEventListener("mousedown", down);
    grip.addEventListener("touchstart", down, { passive: false });
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    grip.addEventListener("dblclick", function(){
      S.panelWidth = 440;
      document.documentElement.style.setProperty("--panel-w", "440px");
      savePrefs();
    });
  }

  /* ---------------- artifact registry for this conversation ---------------- */
  function find(id){
    return S.artifacts.find(function(a){ return a.id === id; }) || null;
  }
  function current(){
    return S.artifacts[S.artifactIdx] || null;
  }

  /* Register (or replace) an artifact and show it. */
  function add(record){
    const existing = S.artifacts.findIndex(function(a){ return a.id === record.id; });
    if(existing === -1) S.artifacts.push(record);
    else S.artifacts[existing] = record;
    S.artifactIdx = S.artifacts.findIndex(function(a){ return a.id === record.id; });
    paint();
    return record;
  }

  function show(id){
    const at = S.artifacts.findIndex(function(a){ return a.id === id; });
    if(at === -1) return;
    S.artifactIdx = at;
    open();
    paint();
  }

  function step(delta){
    if(!S.artifacts.length) return;
    S.artifactIdx = clamp(S.artifactIdx + delta, 0, S.artifacts.length - 1);
    paint();
  }

  function repaint(id){
    if(!id || (current() && current().id === id)) paint();
  }

  /* ---------------- streaming placeholder ---------------- */
  function startBuilding(id, hint){
    building = id;
    add({ id: id, kind: "building", title: hint || "Preparing visual", spec: null, ts: Date.now() });
    if(S.autoPanel) open();
  }
  function cancelBuilding(id){
    if(building !== id) return;
    building = null;
    const at = S.artifacts.findIndex(function(a){ return a.id === id && a.kind === "building"; });
    if(at !== -1){
      S.artifacts.splice(at, 1);
      S.artifactIdx = clamp(S.artifactIdx, -1, S.artifacts.length - 1);
      if(!S.artifacts.length) S.artifactIdx = -1;
    }
    paint();
  }

  /* ---------------- source viewer ---------------- */
  function showSource(index, msgId){
    const msg = Chat.findMessage(msgId);
    const sources = (msg && msg.sources) || [];
    const src = sources[index];
    if(!src){ toast("That source is no longer available", "warn"); return; }
    add({
      id: "src_" + (msgId || "x") + "_" + index,
      kind: "source",
      title: src.title,
      spec: src,
      ts: Date.now(),
    });
    open();
  }

  /* ---------------- web result viewer ---------------- */
  function showWeb(index, msgId){
    const msg = Chat.findMessage(msgId);
    const results = (msg && msg.web && msg.web.results) || [];
    const hit = results[index];
    if(!hit){ toast("That web result is no longer available", "warn"); return; }
    add({
      id: "web_" + (msgId || "x") + "_" + index,
      kind: "web",
      title: hit.title,
      spec: hit,
      ts: Date.now(),
    });
    open();
  }

  function renderWeb(r){
    const chips = [
      '<span class="chip">' + Icons.el("globe") + esc(r.site || "web") + "</span>",
      r.date ? '<span class="chip">' + Icons.el("clock") + esc(r.date) + "</span>" : "",
      r.kind ? '<span class="chip">' + esc(r.kind) + "</span>" : "",
      (r.from && r.from.length) ? '<span class="chip">' + Icons.el("search") + esc(r.from.join(" + ")) + "</span>" : "",
    ].filter(Boolean).join("");

    const body = r.full
      ? String(r.full).split(/\n\s*\n/).slice(0, 60).map(function(p){ return "<p>" + esc(p) + "</p>"; }).join("")
      : "<p>" + esc(r.snippet || "No summary was returned for this result.") + "</p>";

    return '<div class="art">' +
      '<div class="srcdoc-hit web">' + Icons.el("globe") +
        "<span>Live web result · relevance " + (r.relevance != null ? r.relevance : 100) + "%" +
        (r.read ? " · page read in full" : " · search summary") + "</span></div>" +
      '<div class="srcdoc-head">' +
        '<div class="srcdoc-t">' + esc(r.title) + "</div>" +
        '<div class="srcdoc-meta">' + chips + "</div>" +
      "</div>" +
      '<a class="web-open" href="' + escAttr(r.url) + '" target="_blank" rel="noopener noreferrer">' +
        Icons.el("external") + '<span class="mn"><span class="tt">Open the page</span>' +
        '<span class="ss">' + esc(r.url) + "</span></span></a>" +
      '<div class="srcdoc-body">' + body + "</div>" +
      '<div class="art-note">This came from the public internet, not from ' + esc(Config.company.name) +
        ". It is shown so you can check it yourself before acting on it. Company documents are what govern internally.</div>" +
    "</div>";
  }

  function renderSource(src){
    const cl = CLEARANCE[src.clearance] || CLEARANCE[1];
    const cat = Config.categories[src.cat] || { label: src.cat, icon: "file" };
    const chips = [
      '<span class="chip">' + Icons.el(cat.icon) + esc(cat.label) + "</span>",
      src.owner ? '<span class="chip">' + Icons.el("user") + esc(src.owner) + "</span>" : "",
      src.updated ? '<span class="chip">' + Icons.el("clock") + esc(fmtDate(src.updated)) + "</span>" : "",
      src.rev ? '<span class="chip">rev ' + esc(src.rev) + "</span>" : "",
      src.system ? '<span class="chip">' + Icons.el("database") + esc(src.system) + "</span>" : "",
      /* an attached file has no company clearance: it is the person's own */
      src.attachment ? "" : '<span class="chip">' + Icons.el("lock") + esc(cl.label) + "</span>",
    ].filter(Boolean).join("");

    const paras = String(src.text).split(/\n\s*\n/).map(function(p){
      return "<p>" + Retrieval.highlight(esc(p), src.terms || []) + "</p>";
    }).join("");

    return '<div class="art">' +
      '<div class="srcdoc-hit">' + Icons.el("target") +
        "<span>Matched extract " + (src.part || 1) + " of " + (src.parts || 1) +
        " · relevance " + (src.relevance != null ? src.relevance : 100) + "%</span></div>" +
      '<div class="srcdoc-head">' +
        '<div class="srcdoc-id">' + esc(src.id) + "</div>" +
        '<div class="srcdoc-t">' + esc(src.title) + "</div>" +
        '<div class="srcdoc-meta">' + chips + "</div>" +
      "</div>" +
      '<div class="srcdoc-body">' + paras + "</div>" +
      '<div class="art-note">' + (src.attachment
        ? "This is the extract SARA read from the file you attached. The file was parsed in this browser and never uploaded anywhere; only this extract was sent to the model. Highlighting shows the terms that matched your question."
        : "This is the extract the answer was drawn from, exactly as it is held in " +
          esc(src.system || "the knowledge base") + ". Highlighting shows the terms that matched your question.") +
      "</div>" +
    "</div>";
  }

  /* ---------------- paint ---------------- */
  function paint(){
    const bodyEl = el("panelBody"), titleEl = el("panelTitle"), subEl = el("panelSub");
    const navEl = el("panelNav"), posEl = el("panelPos"), stampEl = el("panelStamp");
    if(!bodyEl) return;

    const a = current();
    const fab = el("panelFab");
    if(fab) fab.classList.toggle("has-artifact", S.artifacts.length > 0);

    if(!a){
      titleEl.textContent = "Workspace";
      subEl.textContent = "";
      navEl.style.display = "none";
      bodyEl.innerHTML =
        '<div class="panel-empty"><span class="orb">' + Icons.el("panel") + "</span>" +
        "<h4>Nothing to show yet</h4>" +
        "<p>When an answer produces something worth looking at — a draft, a checklist, a chart, a source document — it appears here.</p></div>";
      Icons.hydrate(bodyEl);
      return;
    }

    /* multi-artifact stepper */
    if(S.artifacts.length > 1){
      navEl.style.display = "flex";
      posEl.textContent = (S.artifactIdx + 1) + " of " + S.artifacts.length;
      stampEl.textContent = relTime(a.ts);
    }else{
      navEl.style.display = "none";
    }

    if(a.kind === "building"){
      titleEl.textContent = a.title;
      subEl.innerHTML = '<span class="chip chip-a">Working</span>';
      bodyEl.innerHTML = '<div class="panel-building"><div class="skel"></div><div class="skel"></div>' +
                         '<div class="skel"></div><div class="skel"></div><div class="skel"></div></div>';
      return;
    }

    if(a.kind === "source"){
      titleEl.textContent = a.spec.id;
      subEl.innerHTML = a.spec.attachment
        ? '<span class="chip chip-a">' + Icons.el("paperclip") + "File you attached</span>"
        : '<span class="chip chip-a">' + Icons.el("library") + "Source document</span>";
      bodyEl.innerHTML = renderSource(a.spec);
      Icons.hydrate(bodyEl);
      bodyEl.scrollTop = 0;
      return;
    }

    if(a.kind === "web"){
      titleEl.textContent = a.spec.site || "Web result";
      subEl.innerHTML = '<span class="chip chip-a">' + Icons.el("globe") + "From the web</span>";
      bodyEl.innerHTML = renderWeb(a.spec);
      Icons.hydrate(bodyEl);
      bodyEl.scrollTop = 0;
      return;
    }

    titleEl.textContent = a.spec.title || Artifacts.label(a.spec);
    subEl.innerHTML = '<span class="chip">' + Icons.el(Artifacts.icon(a.spec)) + Artifacts.label(a.spec) + "</span>" +
                      (a.spec.subtitle ? "<span>" + esc(a.spec.subtitle) + "</span>" : "");
    bodyEl.innerHTML = Artifacts.render(a.spec, a.id);
    Icons.hydrate(bodyEl);
    bodyEl.scrollTop = 0;
  }

  /* ---------------- image generation ---------------- */
  async function generateImage(record){
    if(!record || !record.spec || Artifacts.typeOf(record.spec) !== "image") return;
    if(!S.images){
      record.spec._imgError = "Image generation is switched off in Settings.";
      repaint(record.id);
      return;
    }
    try{
      const url = await LLM.image(String(record.spec.prompt || record.spec.title || "").slice(0, 900));
      record.spec._img = url;
      record.spec._imgError = null;
    }catch(err){
      record.spec._imgError = err.message || "Generation failed.";
    }
    repaint(record.id);
  }

  /* ---------------- export from the panel ---------------- */
  function asText(){
    const a = current();
    if(!a) return "";
    if(a.kind === "source"){
      return [a.spec.id, a.spec.title, "", "Owner: " + (a.spec.owner || "—"),
              "Updated: " + (a.spec.updated || "—"), "", a.spec.text].join("\n");
    }
    if(a.kind === "web"){
      return [a.spec.title, a.spec.url, "",
              [a.spec.site, a.spec.date, a.spec.kind].filter(Boolean).join(" · "), "",
              a.spec.full || a.spec.snippet || ""].join("\n");
    }
    return Artifacts.toText(a.spec);
  }
  function copy(){
    const t = asText();
    if(!t){ toast("Nothing to copy", "warn"); return; }
    const kind = current() ? current().kind : "";
    copyText(t, kind === "source" ? "Source" : kind === "web" ? "Web result" : "Visual");
  }
  function download(){
    const a = current();
    if(!a){ toast("Nothing to download", "warn"); return; }
    Exporter.artifactMenu(a);
  }

  return {
    open: open, close: close, toggle: toggle, toggleWide: toggleWide,
    isNarrow: isNarrow, isPanelOverlay: isPanelOverlay, isSideOverlay: isSideOverlay,
    initResize: initResize, syncBreakpoints: syncBreakpoints,
    add: add, find: find, show: show, step: step, repaint: repaint, paint: paint,
    current: current,
    startBuilding: startBuilding, cancelBuilding: cancelBuilding,
    showSource: showSource, showWeb: showWeb,
    generateImage: generateImage,
    copy: copy, download: download, asText: asText,
    syncOverlayScrim: syncOverlayScrim,
    reset: function(){ S.artifacts = []; S.artifactIdx = -1; building = null; paint(); },
  };
})();
