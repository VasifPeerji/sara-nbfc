/* ------------------------------------------------------------------
   Settings, profile popover, knowledge-base browser, connected systems.
   ------------------------------------------------------------------ */

const Settings = (function(){

  let tab = "model";

  const ACCENTS = ["#4d7cfe","#2f7df6","#0ea5e9","#14b8a6","#2fbf71","#8b5cf6","#d946a6","#ef4a5c","#e0a11b","#f97316"];

  function open(which){
    tab = which || tab || "model";
    paint();
    $$("#setTabs button").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-tab") === tab); });
    el("setSub").textContent = Config.product.name + " " + Config.product.version +
      (Config.product.vendor ? " · " + Config.product.vendor : "");
    Modals.show("ovSettings");
  }
  function setTab(which){ tab = which; open(which); }

  function paint(){
    const bodyEl = el("setBody");
    bodyEl.innerHTML = tab === "model" ? paneModel()
                     : tab === "answers" ? paneAnswers()
                     : tab === "search" ? paneSearch()
                     : tab === "appearance" ? paneAppearance()
                     : tab === "usage" ? Analytics.paneMarkup()
                     : paneAbout();
    Icons.hydrate(bodyEl);
    el("setNote").textContent = tab === "model"
      ? "The key is stored in this browser only and is never sent anywhere except the provider."
      : "";
  }

  /* ---------------- model ---------------- */
  function paneModel(){
    const p = currentProvider();
    const keyed = PROVIDERS.filter(function(x){ return !!Keys.get(x.id); }).length;
    return '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("brain") + "Provider and model</div>" +
      '<div class="mp-head" style="border:1px solid var(--line);border-radius:var(--r);padding:12px">' +
        Models.logoTile(p) +
        '<span class="mn"><span class="tt">' + esc(p.name) + " · " + esc(S.model) + "</span>" +
        '<span class="ss">' + (Keys.get(p.id) ? "Key set" : "No key set") + " · " + esc(CORS_NOTE[p.cors] || "") + "</span></span>" +
      "</div>" +
      '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +
        '<button class="btn btn-primary" onclick="Modals.close(\'ovSettings\');Models.open()">Change model</button>' +
        '<button class="btn" onclick="Models.keyDialog(\'' + escJs(p.id) + '\')">Set key</button>' +
        '<button class="btn" onclick="Models.testProvider(\'' + escJs(p.id) + '\')">Test</button>' +
      "</div>" +
      '<div class="hint" style="margin-top:10px">' + PROVIDERS.length + " providers available · " + keyed + " with a key stored in this browser.</div>" +
    "</div>" +

    '<div class="set-sec"' + (modelCaps(S.model).effort ? "" : ' style="display:none"') + ' id="s_effortWrap">' +
      '<div class="set-sec-t">' + Icons.el("zap") + "Reasoning effort</div>" +
      '<div class="fld">' +
        '<select class="inp" id="s_effort">' +
          EFFORTS.map(function(e){
            return '<option value="' + escAttr(e.id) + '"' + (e.id === S.effort ? " selected" : "") + ">" +
                   esc(e.label) + " — " + esc(e.note) + "</option>";
          }).join("") +
        "</select>" +
        '<div class="hint">Only applies to OpenAI reasoning models. GPT-5.1 defaults to no reasoning, which makes structured output less reliable, so “Fast” is the sweet spot for a live session.</div>' +
      "</div>" +
    "</div>" +

    '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("image") + "Generated images</div>" +
      '<div class="sw-row"><span><span class="lbl">Allow image generation</span>' +
        '<span class="sub">Lets the workspace render an illustration when one genuinely helps. Adds cost and several seconds, so it is off by default.</span></span>' +
        '<label class="sw"><input type="checkbox" id="s_images"' + (S.images ? " checked" : "") + "><i></i></label></div>" +
    "</div>";
  }

  /* Keys, base URLs and connection tests all live in the model picker now,
     so there is exactly one place to manage a provider. */

  /* ---------------- answers ---------------- */
  function paneAnswers(){
    const styles = [
      { id: "brief", label: "Brief", note: "Shortest answer that is still complete." },
      { id: "balanced", label: "Balanced", note: "Length follows the question. Recommended." },
      { id: "thorough", label: "Thorough", note: "Full structure, edge cases and next checks." },
    ];
    return '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("doc") + "Answer length</div>" +
      '<div class="seg" id="s_style">' + styles.map(function(s){
        return '<button class="' + (S.answerStyle === s.id ? "on" : "") + '" onclick="Settings.pickStyle(\'' + s.id + '\')" title="' + escAttr(s.note) + '">' + esc(s.label) + "</button>";
      }).join("") + "</div>" +
      '<div class="hint" style="margin-top:8px" id="s_styleHint">' + esc((styles.find(function(s){ return s.id === S.answerStyle; }) || styles[1]).note) + "</div>" +
    "</div>" +

    '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("panel") + "Workspace</div>" +
      '<div class="sw-row"><span><span class="lbl">Open the workspace automatically</span>' +
        '<span class="sub">When an answer produces a draft, chart or checklist, reveal the side panel straight away.</span></span>' +
        '<label class="sw"><input type="checkbox" id="s_autoPanel"' + (S.autoPanel ? " checked" : "") + "><i></i></label></div>" +
      '<div class="sw-row"><span><span class="lbl">Always expand sources</span>' +
        '<span class="sub">Show the retrieved documents under every answer instead of keeping them collapsed.</span></span>' +
        '<label class="sw"><input type="checkbox" id="s_traceOpen"' + (S.traceOpen ? " checked" : "") + "><i></i></label></div>" +
    "</div>" +

    '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("shield") + "Access</div>" +
      '<div class="hint">You are signed in as <b>' + esc(S.user ? S.user.name : "—") + "</b> (" + esc(S.user ? S.user.title : "") + ")." +
        " Retrieval is limited to <b>" + esc((CLEARANCE[currentClearance()] || {}).label) + "</b> material within " +
        esc((currentScopes().join(", ") || "general reference")) + "." +
        " To see the platform behave differently, switch profile from the account menu.</div>" +
    "</div>";
  }
  function pickStyle(id){
    S.answerStyle = id;
    paint();
  }

  /* ---------------- search ----------------
     An enterprise buyer's first question about anything that leaves the
     browser is "where does it go". So this pane names every host before it
     offers a single toggle, rather than burying the list in a footnote. */
  function paneSearch(){
    const hosts = Web.hosts();
    const on = Web.enabled().length;

    const connectors = Web.connectors().map(function(c){
      const checked = (S.webConnectors || []).indexOf(c.id) !== -1;
      return '<div class="sw-row"><span><span class="lbl">' + esc(c.name) +
        ' <span class="tag">' + esc(c.kind) + "</span></span>" +
        '<span class="sub">' + esc(c.note) + '</span>' +
        '<span class="sub mono">' + esc(c.host || "custom connector") + "</span></span>" +
        '<label class="sw"><input type="checkbox"' + (checked ? " checked" : "") +
          ' onchange="Web.toggleConnector(\'' + escJs(c.id) + '\');Settings.repaint()"><i></i></label></div>';
    }).join("");

    return '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("globe") + "Web search</div>" +
      '<div class="seg" id="s_web">' + Web.MODES.map(function(m){
        const short = m.id === "off" ? "Off" : m.id === "on" ? "Always" : "Auto";
        return '<button class="' + (S.web === m.id ? "on" : "") + '" onclick="Settings.pickWeb(\'' + m.id +
               '\')" title="' + escAttr(m.hint) + '">' + short + "</button>";
      }).join("") + "</div>" +
      '<div class="hint" style="margin-top:8px">' + esc(Web.mode().hint) +
        (S.web === "auto" ? " It searches when the question asks for something current, names a year, reaches outside the company, or when the knowledge base barely matched." : "") +
      "</div>" +
    "</div>" +

    '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("shield") + "Where the requests go</div>" +
      (hosts.length
        ? '<div class="host-list">' + hosts.map(function(h){
            return '<span class="host">' + Icons.el("external") + esc(h) + "</span>";
          }).join("") + "</div>" +
          '<div class="hint" style="margin-top:10px">These are the only hosts web search contacts, and it contacts them only when a search actually runs. Every one is a public read-only endpoint that needs no key and no account. Your question is sent as the search term; your name, role and the knowledge base never are.</div>'
        : '<div class="hint">No sources are switched on, so nothing leaves this browser.</div>') +
    "</div>" +

    '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("library") + "Sources · " + on + " of " + Web.connectors().length + " on</div>" +
      connectors +
    "</div>" +

    '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("filter") + "How much to bring back</div>" +
      '<div class="fld"><label for="s_webTopK">Results per search</label>' +
        '<select class="inp" id="s_webTopK" style="width:auto" onchange="Settings.pickWebTopK(this.value)">' +
          [3,4,5,6,7,8].map(function(n){
            return '<option value="' + n + '"' + (S.webTopK === n ? " selected" : "") + ">" + n + "</option>";
          }).join("") + "</select>" +
        '<div class="hint">More results give wider coverage and a longer prompt. Five is the sweet spot.</div>' +
      "</div>" +
      '<div class="sw-row"><span><span class="lbl">Read the top pages in full</span>' +
        '<span class="sub">Fetches the pages themselves instead of relying on search summaries, so answers quote the source rather than a snippet. Adds a few seconds, and routes those two page fetches through the r.jina.ai reader.</span></span>' +
        '<label class="sw"><input type="checkbox"' + (S.webRead ? " checked" : "") +
          ' onchange="Settings.pickWebRead(this.checked)"><i></i></label></div>' +
    "</div>" +

    '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("paperclip") + "File search</div>" +
      '<div class="hint">Attach a document to any conversation and SARA reads it alongside the knowledge base, with citations back to the extract it used. ' +
        (FileParse.hasInflate()
          ? "PDF, Word, Excel, PowerPoint, CSV, RTF, HTML and plain text are read here in this browser: the file is never uploaded, and only the matching extract is sent to the model you chose."
          : '<b style="color:var(--warn)">This browser cannot decompress files, so only CSV and plain text can be read. Use a current Chrome, Edge, Firefox or Safari.</b>') +
      "</div>" +
      '<div class="host-list" style="margin-top:10px">' +
        FileParse.supported().map(function(e){ return '<span class="host">.' + esc(e) + "</span>"; }).join("") +
      "</div>" +
      '<div class="hint" style="margin-top:10px">' + Attachments.count() +
        " file" + (Attachments.count() === 1 ? "" : "s") + " attached in this session." +
        (Attachments.count() ? ' <button class="lnk" onclick="Attachments.clearAll();Settings.repaint()">Clear them</button>' : "") +
      "</div>" +
    "</div>";
  }

  function pickWeb(id){ Web.set(id); paint(); }
  function pickWebTopK(v){ S.webTopK = clamp(parseInt(v, 10) || 5, 3, 10); savePrefs(); }
  function pickWebRead(on){ S.webRead = !!on; savePrefs(); paint(); }
  function repaint(){ paint(); }

  /* ---------------- appearance ---------------- */
  function paneAppearance(){
    const themes = [
      { id: "system", label: "System", icon: "monitor" },
      { id: "dark",   label: "Dark",   icon: "moon" },
      { id: "light",  label: "Light",  icon: "sun" },
    ];
    const densities = [{ id: "compact", label: "Compact" }, { id: "cosy", label: "Cosy" }, { id: "relaxed", label: "Relaxed" }];
    return '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("sun") + "Theme</div>" +
      '<div class="seg">' + themes.map(function(t){
        return '<button class="' + (S.theme === t.id ? "on" : "") + '" onclick="Settings.pickTheme(\'' + t.id + '\')">' + esc(t.label) + "</button>";
      }).join("") + "</div>" +
      '<div class="hint" style="margin-top:8px">' +
        (S.theme === "system"
          ? "Following this device, which is currently set to <b>" + resolvedTheme() + "</b>. Changing it on the device changes SARA straight away."
          : "Fixed to " + S.theme + ", whatever this device is set to.") +
      "</div>" +
    "</div>" +
    '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("grid") + "Density</div>" +
      '<div class="seg">' + densities.map(function(d){
        return '<button class="' + (S.density === d.id ? "on" : "") + '" onclick="Settings.pickDensity(\'' + d.id + '\')">' + esc(d.label) + "</button>";
      }).join("") + "</div>" +
    "</div>" +
    '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("spark") + "Accent</div>" +
      '<div class="swatches">' + ACCENTS.map(function(c){
        return '<button class="swatch' + (S.accent.toLowerCase() === c ? " on" : "") + '" style="background:' + c +
               '" onclick="Settings.pickAccent(\'' + c + '\')" aria-label="' + c + '"></button>';
      }).join("") + "</div>" +
      '<div class="hint" style="margin-top:8px">The edition ships with ' + esc(Config.brand.accent) +
        '. <button class="btn btn-sm" style="margin-left:6px" onclick="Settings.pickAccent(\'' + escJs(Config.brand.accent) + '\')">Reset to brand</button></div>' +
    "</div>";
  }
  function pickTheme(id){ S.theme = id; applyTheme(); savePrefs(); paint(); }
  function pickDensity(id){ S.density = id; applyTheme(); savePrefs(); paint(); }
  function pickAccent(hex){ applyAccent(hex); savePrefs(); paint(); }

  /* ---------------- about ---------------- */
  function paneAbout(){
    const st = Config.stats;
    /* Connector ids cannot be validated when the edition loads, because the
       registry is defined further down the build. Checked here instead, so
       a typo in an edition surfaces where every other config problem does. */
    const unknown = (S.webConnectors || []).filter(function(id){ return !Web.connector(id); });
    const issues = CFG_ISSUES.concat(unknown.map(function(id){
      return 'Unknown web connector "' + id + '" — it will simply never run.';
    }));
    return '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("info") + "This deployment</div>" +
      '<div class="kb-stats">' +
        stat(st.docs, "documents indexed") +
        stat(Retrieval.size, "retrievable passages") +
        stat(Config.roles.length, "roles configured") +
        stat(Config.systems.length, "connected systems") +
      "</div>" +
      '<div class="hint" style="margin-top:10px">' +
        esc(Config.product.name) + " " + esc(Config.product.version) +
        " for <b>" + esc(Config.company.name) + "</b>" + (Config.company.industry ? " · " + esc(Config.company.industry) : "") + ".<br>" +
        "Runs entirely in this file. It calls the model provider, and " +
        (S.web === "off"
          ? "nothing else — web search is off."
          : "the " + Web.hosts().length + " public search hosts listed under Search. Files you attach are read here and never uploaded.") +
      "</div>" +
    "</div>" +

    '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("database") + "Stored on this device</div>" +
      '<div class="hint">Conversations, preferences and the API key are held in this browser\'s local storage for this profile. Nothing is uploaded.</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +
        '<button class="btn btn-sm" onclick="Sidebar.clearAll()">Delete all chats</button>' +
        '<button class="btn btn-sm btn-danger" onclick="Settings.resetAll()">Reset everything</button>' +
      "</div>" +
    "</div>" +

    (issues.length ? '<div class="set-sec">' +
      '<div class="set-sec-t">' + Icons.el("alert") + "Configuration notices (" + issues.length + ")</div>" +
      '<div class="hint">These come from validating the edition file at load. They do not stop the product running.</div>' +
      "<ul style=\"margin-top:8px;padding-left:18px;font-size:var(--t-sm);color:var(--tx-2);line-height:1.7\">" +
        issues.slice(0, 12).map(function(i){ return "<li>" + esc(i) + "</li>"; }).join("") +
      "</ul></div>" : "");
  }
  function stat(v, l){
    return '<div class="kb-stat"><div class="v">' + esc(fmtNum(v)) + '</div><div class="l">' + esc(l) + "</div></div>";
  }

  function resetAll(){
    if(!window.confirm("Reset everything on this device: chats, preferences and the stored API key?")) return;
    Store.del("prefs"); Store.del("lastUser");
    Config.roles.forEach(function(r){ Store.del("convos_" + r.key); });
    Store.del("convos_anon");
    toast("Reset. Reloading…", "info", 1200);
    setTimeout(function(){ location.reload(); }, 900);
  }

  /* ---------------- save ---------------- */
  function save(){
    const effort = el("s_effort");
    const images = el("s_images"), autoPanel = el("s_autoPanel"), traceOpen = el("s_traceOpen");
    if(effort) S.effort = effort.value;
    if(images) S.images = images.checked;
    if(autoPanel) S.autoPanel = autoPanel.checked;
    if(traceOpen) S.traceOpen = traceOpen.checked;
    savePrefs();
    applyModelChip();
    Modals.close("ovSettings");
    toast("Settings saved", "ok");
  }

  /* The chip shows the model, since that is what changes most; the provider
     shows as the coloured monogram beside it. */
  function applyModelChip(){
    const n = el("modelChipName");
    if(!n) return;
    const p = currentProvider();
    n.textContent = S.model;
    const glyph = $(".model-chip .glyph");
    if(glyph){
      const mark = providerLogoSvg(p.id, Models.logoInk(providerBrandHex(p.id) || p.colour));
      if(mark){
        glyph.innerHTML = mark;
        glyph.style.background = "transparent";
        glyph.classList.remove("mono-glyph");
        glyph.classList.add("brand-glyph");
      }else{
        glyph.textContent = Models.monogram(p.name);
        glyph.style.background = p.colour;
        glyph.classList.remove("brand-glyph");
        glyph.classList.add("mono-glyph");
      }
    }
    const chip = el("modelChip");
    if(chip) chip.setAttribute("title", p.name + " · " + S.model +
      (modelCaps(S.model).effort ? " · effort " + S.effort : "") +
      (Keys.get(p.id) ? "" : " · no key set"));
    if(chip) chip.classList.toggle("nokey", !Keys.get(p.id));
  }

  return {
    open: open, tab: setTab, save: save, paint: paint, repaint: repaint,
    pickStyle: pickStyle, pickTheme: pickTheme, pickDensity: pickDensity, pickAccent: pickAccent,
    pickWeb: pickWeb, pickWebTopK: pickWebTopK, pickWebRead: pickWebRead,
    applyModelChip: applyModelChip, resetAll: resetAll,
  };
})();


/* ==================================================================
   Modals: overlay plumbing, profile popover, knowledge base, systems
   ================================================================== */
const Modals = (function(){

  function show(id){ el(id).classList.add("open"); }
  function close(id){ el(id).classList.remove("open"); }
  function closeAll(){ $$(".ov.open").forEach(function(o){ o.classList.remove("open"); }); }
  function anyOpen(){ return !!$(".ov.open"); }

  /* ---------------- profile popover ---------------- */
  function profile(event){
    event.stopPropagation();
    closeFloaters();
    if(!S.user) return;

    const others = Config.users.filter(function(u){ return u.email !== S.user.email; }).slice(0, 6);
    const node = document.createElement("div");
    node.className = "pop";
    node.innerHTML =
      '<div class="pop-me">' +
        '<span class="av av-lg" style="background:' + rgba(S.user.avatarColor, 0.18) + ";color:" + S.user.avatarColor + '">' + esc(S.user.av) + "</span>" +
        '<span class="mn"><span class="nm">' + esc(S.user.name) + '</span><span class="em">' + esc(S.user.email) + "</span></span>" +
      "</div>" +
      '<div class="pop-clear">' + Icons.el("shield") +
        "<span>" + esc((CLEARANCE[currentClearance()] || {}).label) + " access</span>" +
        '<span class="spacer"></span></div>' +
      '<button class="menu-item" onclick="Settings.open(\'model\')">' + Icons.el("settings") + "Settings</button>" +
      '<button class="menu-item" onclick="Modals.openKb()">' + Icons.el("library") + "Knowledge base</button>" +
      '<button class="menu-item" onclick="Modals.openSystems()">' + Icons.el("plug") + "Connected systems</button>" +
      '<div class="menu-sep"></div>' +
      '<div class="menu-head">Switch profile</div>' +
      others.map(function(u){
        return '<button class="menu-item" onclick="Login.switchRole(\'' + escJs(u.email) + '\')">' +
          '<span class="av av-sm" style="background:' + rgba(u.avatarColor, 0.18) + ";color:" + u.avatarColor + '">' + esc(u.av) + "</span>" +
          esc(u.name) + "</button>";
      }).join("") +
      '<div class="menu-sep"></div>' +
      '<button class="menu-item danger" onclick="Login.signOut()">' + Icons.el("logout") + "Sign out</button>";

    const r = event.currentTarget.getBoundingClientRect();
    placeFloater(node, r.left, r.top - 12);
    Icons.hydrate(node);
  }

  /* ---------------- knowledge base ---------------- */
  function openKb(){
    closeFloaters();
    const cats = Object.keys(Config.categories).filter(function(k){
      return Config.kb.some(function(d){ return d.cat === k; });
    });
    const sel = el("kbCat");
    sel.innerHTML = '<option value="">All categories</option>' + cats.map(function(k){
      return '<option value="' + escAttr(k) + '">' + esc(Config.categories[k].label) + "</option>";
    }).join("");

    const visible = Config.kb.filter(function(d){ return Retrieval.visibleTo(d, currentRole()); }).length;
    el("kbSub").textContent = Config.company.name + " · " + Config.kb.length + " documents · you can see " + visible;

    el("kbStats").innerHTML =
      '<div class="kb-stat"><div class="v">' + fmtNum(Config.kb.length) + '</div><div class="l">documents</div></div>' +
      '<div class="kb-stat"><div class="v">' + fmtNum(Retrieval.size) + '</div><div class="l">passages</div></div>' +
      '<div class="kb-stat"><div class="v">' + fmtNum(visible) + '</div><div class="l">visible to you</div></div>' +
      '<div class="kb-stat"><div class="v">' + fmtNum(Config.kb.length - visible) + '</div><div class="l">restricted</div></div>';

    filterKb();
    show("ovKb");
    setTimeout(function(){ const i = el("kbSearch"); if(i) i.focus(); }, 60);
  }

  function filterKb(){
    const q = (el("kbSearch").value || "").trim().toLowerCase();
    const cat = el("kbCat").value;
    const role = currentRole();

    const rows = Config.kb.filter(function(d){
      if(cat && d.cat !== cat) return false;
      if(!q) return true;
      return (d.title + " " + d.id + " " + (d.tags || []).join(" ") + " " + d.owner).toLowerCase().indexOf(q) !== -1;
    });

    const list = el("kbList");
    if(!rows.length){
      list.innerHTML = '<div class="side-empty">No documents match.</div>';
      return;
    }
    list.innerHTML = rows.map(function(d){
      const can = Retrieval.visibleTo(d, role);
      const cat2 = Config.categories[d.cat] || { label: d.cat, icon: "file" };
      const meta = [d.id, cat2.label, d.owner, d.updated ? fmtDate(d.updated) : ""].filter(Boolean).join(" · ");
      return '<button class="kb-row' + (can ? "" : " locked") + '" onclick="Modals.openDoc(\'' + escJs(d.id) + '\')">' +
        '<span class="ic">' + Icons.el(cat2.icon) + "</span>" +
        '<span class="mn"><span class="tt">' + esc(d.title) + '</span><span class="ss">' + esc(meta) + "</span></span>" +
        (can ? "" : '<span class="i lock">' + Icons.svg("lock") + "</span>") +
      "</button>";
    }).join("");
    Icons.hydrate(list);
  }

  function openDoc(id){
    Analytics.track("doc", { id: id });
    const d = Config.kb.find(function(x){ return x.id === id; });
    if(!d) return;
    if(!Retrieval.visibleTo(d, currentRole())){
      toast("“" + d.title + "” is above your access level. Owner: " + (d.owner || "unassigned") + ".", "warn", 5000);
      return;
    }
    close("ovKb");
    Panel.add({
      id: "kb_" + d.id,
      kind: "source",
      title: d.title,
      ts: Date.now(),
      spec: {
        id: d.id, title: d.title, cat: d.cat, owner: d.owner, updated: d.updated,
        rev: d.rev, system: d.system, clearance: d.clearance,
        part: 1, parts: 1, text: d.body, terms: [], relevance: 100,
      },
    });
    Panel.open();
  }

  /* ---------------- connected systems ---------------- */
  function openSystems(){
    closeFloaters();
    el("sysSub").textContent = Config.systems.length
      ? "Indexed sources feeding " + (Config.assistant.name || Config.product.name)
      : "No systems are declared in this edition.";
    el("sysGrid").innerHTML = Config.systems.map(function(s){
      return '<div class="sys"><span class="ic" style="background:' + s.color + '">' + esc(s.initials) + "</span>" +
        '<span class="mn"><span class="tt">' + esc(s.name) + "</span>" +
        '<span class="ss"><span class="dot"></span>' + esc(s.kind || "Connected") +
        (s.docs ? " · " + fmtNum(s.docs) + " items" : "") + "</span></span></div>";
    }).join("") || '<div class="side-empty">Nothing configured.</div>';
    show("ovSystems");
  }

  return {
    show: show, close: close, closeAll: closeAll, anyOpen: anyOpen,
    profile: profile, openKb: openKb, filterKb: filterKb, openDoc: openDoc, openSystems: openSystems,
  };
})();
