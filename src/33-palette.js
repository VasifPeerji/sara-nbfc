/* ------------------------------------------------------------------
   Command palette (Ctrl/Cmd K).

   One box over four indexes: suggested questions for the signed-in role,
   the knowledge base, past conversations, and commands. With 50+ documents
   and a dozen roles this is the only navigation that scales.
   ------------------------------------------------------------------ */

const Palette = (function(){

  let items = [];      /* full index */
  let shown = [];      /* current filtered view, flattened */
  let cursor = 0;

  const COMMANDS = [
    { t: "New chat",              icon: "compose",  run: function(){ Chat.newChat(); },        kbd: "Ctrl ⇧ O" },
    { t: "Change model",          icon: "brain",    run: function(){ Models.open(); },         kbd: "Ctrl M" },
    { t: "Temporary chat",        icon: "ghost",    run: function(){ Chat.toggleTemporary(); } },
    { t: "Guided tasks",          icon: "checklist", run: function(){ Journeys.openPicker(); } },
    { t: "Browse knowledge base", icon: "library",  run: function(){ Modals.openKb(); } },
    { t: "Connected systems",     icon: "plug",     run: function(){ Modals.openSystems(); } },
    { t: "Bookmarks",             icon: "bookmark", run: function(){ Sidebar.view("bookmarks"); } },
    { t: "Files",                 icon: "paperclip",run: function(){ Sidebar.view("files"); } },
    { t: "MCP servers",           icon: "layers",   run: function(){ Sidebar.view("mcp"); } },
    { t: "Toggle workspace",      icon: "panel",    run: function(){ Panel.toggle(); },        kbd: "Ctrl \\" },
    { t: "Toggle sidebar",        icon: "chat",     run: function(){ Sidebar.toggle(); },      kbd: "Ctrl B" },
    /* cycles the same three the settings pane offers, so the palette can
       never leave the theme in a state that pane cannot represent */
    { t: "Switch theme",          icon: "moon",     run: function(){
        const order = ["system", "dark", "light"];
        Settings.pickTheme(order[(order.indexOf(S.theme) + 1) % order.length]);
      } },
    { t: "Export this chat",      icon: "download", run: function(){ Exporter.conversation(); } },
    { t: "Print / save as PDF",   icon: "share",    run: function(){ Exporter.printThread(); } },
    { t: "Settings",              icon: "settings", run: function(){ Settings.open("model"); } },
    { t: "Sign out",              icon: "logout",   run: function(){ Login.signOut(); } },
  ];

  /* ---------------- index ---------------- */
  function build(){
    items = [];
    const role = currentRole();

    (role.prompts || []).forEach(function(p){
      items.push({ group: "Suggested for you", t: p.t, s: p.s || p.q, icon: Icons.has(p.icon) ? p.icon : "spark",
                   run: function(){ Chat.ask(p.q); } });
    });

    Config.kb.forEach(function(d){
      const can = Retrieval.visibleTo(d, role);
      const cat = Config.categories[d.cat] || { label: d.cat, icon: "file" };
      items.push({
        group: "Knowledge base",
        t: d.title,
        s: d.id + " · " + cat.label + (d.owner ? " · " + d.owner : "") + (can ? "" : " · restricted"),
        icon: can ? cat.icon : "lock",
        keys: (d.tags || []).join(" ") + " " + d.id + " " + d.owner,
        run: function(){ Modals.openDoc(d.id); },
      });
    });

    S.convos.filter(function(c){ return c.messages.length; }).slice(0, 25).forEach(function(c){
      items.push({ group: "Recent chats", t: c.title, s: relTime(c.updated || c.ts), icon: "chat",
                   run: function(){ Chat.load(c.id); } });
    });

    COMMANDS.forEach(function(cmd){
      items.push({ group: "Commands", t: cmd.t, s: "", icon: cmd.icon, kbd: cmd.kbd, run: cmd.run });
    });
  }

  /* ---------------- scoring ---------------- */
  /* Subsequence match with bonuses for prefix and word-start hits. */
  function score(haystack, needle){
    const h = haystack.toLowerCase(), n = needle.toLowerCase();
    if(!n) return 1;
    const direct = h.indexOf(n);
    if(direct === 0) return 1000;
    if(direct > 0) return 600 - Math.min(direct, 200) + (h[direct - 1] === " " ? 120 : 0);
    let hi = 0, sc = 0, streak = 0;
    for(let ni = 0; ni < n.length; ni++){
      const ch = n[ni];
      let found = -1;
      for(let i = hi; i < h.length; i++){ if(h[i] === ch){ found = i; break; } }
      if(found === -1) return 0;
      sc += 12 - Math.min(10, found - hi);
      if(found > 0 && h[found - 1] === " ") sc += 18;
      streak = (found === hi) ? streak + 6 : 0;
      sc += streak;
      hi = found + 1;
    }
    return sc;
  }

  function filter(q){
    cursor = 0;
    const query = String(q || "").trim();
    const scored = items.map(function(it){
      const hay = it.t + " " + (it.s || "") + " " + (it.keys || "");
      return { it: it, sc: query ? score(hay, query) : 1 };
    }).filter(function(x){ return x.sc > 0; });

    if(query) scored.sort(function(a, b){ return b.sc - a.sc; });

    /* keep groups in a stable order, cap each so one group cannot flood */
    const ORDER = ["Suggested for you", "Recent chats", "Knowledge base", "Commands"];
    const byGroup = {};
    scored.forEach(function(x){
      const g = x.it.group;
      byGroup[g] = byGroup[g] || [];
      if(byGroup[g].length < (query ? 8 : 5)) byGroup[g].push(x.it);
    });

    shown = [];
    let html = "";
    ORDER.forEach(function(g){
      const list = byGroup[g];
      if(!list || !list.length) return;
      html += '<div class="cmd-grp">' + esc(g) + "</div>";
      list.forEach(function(it){
        const idx = shown.length;
        shown.push(it);
        html += '<button class="cmd-it" data-i="' + idx + '" onclick="Palette.run(' + idx + ')">' +
          '<span class="ic">' + Icons.el(it.icon) + "</span>" +
          '<span class="mn"><span class="tt">' + esc(it.t) + "</span>" +
          (it.s ? '<span class="ss">' + esc(it.s) + "</span>" : "") + "</span>" +
          (it.kbd ? "<kbd>" + esc(it.kbd) + "</kbd>" : "") +
        "</button>";
      });
    });

    const listEl = el("cmdList");
    listEl.innerHTML = html || '<div class="cmd-empty">Nothing matches “' + esc(query) + '”.<br>Press Enter to ask it as a question.</div>';
    Icons.hydrate(listEl);
    highlight();
  }

  function highlight(){
    $$("#cmdList .cmd-it").forEach(function(node, i){
      node.classList.toggle("on", i === cursor);
      if(i === cursor && node.scrollIntoView) node.scrollIntoView({ block: "nearest" });
    });
  }

  function key(e){
    if(e.key === "ArrowDown"){ e.preventDefault(); cursor = Math.min(cursor + 1, shown.length - 1); highlight(); }
    else if(e.key === "ArrowUp"){ e.preventDefault(); cursor = Math.max(cursor - 1, 0); highlight(); }
    else if(e.key === "Enter"){
      e.preventDefault();
      if(shown.length) run(cursor);
      else{
        const q = el("cmdIn").value.trim();
        close();
        if(q) Chat.ask(q);
      }
    }
  }

  function run(i){
    const it = shown[i];
    if(!it) return;
    close();
    setTimeout(function(){ it.run(); }, 30);
  }

  function open(){
    build();
    el("ovCmd").classList.add("open");
    const inp = el("cmdIn");
    inp.value = "";
    filter("");
    setTimeout(function(){ inp.focus(); }, 50);
  }
  function close(){ el("ovCmd").classList.remove("open"); }

  return { build: build, open: open, close: close, filter: filter, key: key, run: run };
})();
