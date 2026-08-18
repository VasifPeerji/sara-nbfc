/* ------------------------------------------------------------------
   Conversation sidebar: list, search, date grouping, per-chat menu,
   and persistence to localStorage.
   ------------------------------------------------------------------ */

const Sidebar = (function(){

  const MAX_STORED = 40;

  /* ---------------- persistence ---------------- */
  function storeKey(){ return "convos_" + ((S.user && S.user.roleKey) || "anon"); }

  function persist(){
    /* Artifacts are kept with their message so a reloaded chat still opens
       its visuals. Generated images are dropped: they are large and can be
       regenerated. */
    const slim = S.convos.filter(function(c){ return !c.temp; }).slice(0, MAX_STORED).map(function(c){
      return {
        id: c.id, title: c.title, ts: c.ts, updated: c.updated,
        messages: c.messages.map(function(m){
          const out = { id: m.id, role: m.role, text: m.text, ts: m.ts };
          if(m.rating) out.rating = m.rating;
          if(m.sources && m.sources.length) out.sources = m.sources;
          if(m.followups && m.followups.length) out.followups = m.followups;
          if(m.artifact){
            const spec = Object.assign({}, m.artifact);
            delete spec._img;
            out.artifact = spec;
            out.artifactId = m.artifactId;
          }
          return out;
        }),
      };
    });
    Store.set(storeKey(), slim);
  }

  function restore(){
    const raw = Store.get(storeKey(), []);
    S.convos = Array.isArray(raw) ? raw.filter(function(c){ return c && c.id && Array.isArray(c.messages); }) : [];
    S.convos.forEach(function(c){
      c.messages.forEach(function(m){ m.streaming = false; });
    });
  }

  /* ---------------- rendering ---------------- */
  function visible(){
    const q = (S.filter || "").trim().toLowerCase();
    const bm = S.bookmarkFilter;
    return S.convos
      .filter(function(c){ return c.messages.length > 0 && !c.temp; })
      .filter(function(c){ return !bm || bm.chatIds.indexOf(c.id) !== -1; })
      .filter(function(c){
        if(!q) return true;
        if(c.title.toLowerCase().indexOf(q) !== -1) return true;
        return c.messages.some(function(m){ return String(m.text).toLowerCase().indexOf(q) !== -1; });
      })
      .sort(function(a, b){ return (b.updated || b.ts) - (a.updated || a.ts); });
  }

  function render(){
    const wrap = el("convoList");
    if(!wrap) return;
    const list = visible();

    const bm = S.bookmarkFilter;
    if(!list.length){
      wrap.innerHTML =
        (bm ? '<button class="side-sec" onclick="Sidebar.showAll()">' + Icons.el("chevleft") +
              "<span>" + esc(bm.name) + '</span></button>' : "") +
        '<div class="side-empty">' +
        (bm ? "This bookmark has no chats in it."
         : S.filter ? "No chats match that search."
         : "Your conversations appear here.<br>Ask something to begin.") +
        "</div>";
      Icons.hydrate(wrap);
      renderMe();
      return;
    }

    let html = "";
    if(bm){
      html += '<button class="side-sec" onclick="Sidebar.showAll()">' + Icons.el("chevleft") +
              "<span>" + esc(bm.name) + "</span><span class=\"spacer\"></span><span class=\"n\">" + list.length + "</span></button>";
    }

    let bucket = null;
    list.forEach(function(c){
      const b = dayBucket(c.updated || c.ts);
      if(b !== bucket){
        bucket = b;
        html += '<div class="side-group-label">' + esc(b) + "</div>";
      }
      const inBm = Library.bookmarksForChat(c.id).length > 0;
      html += '<div class="convo' + (c.id === S.currentId ? " on" : "") + (inBm ? " pinned" : "") +
              '" onclick="Chat.load(\'' + escJs(c.id) + '\')">' +
        '<span class="convo-ic' + (hasBrandLogo() ? " has-logo" : "") + '">' + brandMark() + "</span>" +
        '<span class="convo-t">' + esc(c.title) + "</span>" +
        '<button class="convo-more" onclick="event.stopPropagation();Sidebar.menu(event,\'' + escJs(c.id) + '\')" aria-label="Chat options">' +
          Icons.el("dots") + "</button>" +
      "</div>";
    });

    wrap.innerHTML = html;
    Icons.hydrate(wrap);
    renderMe();
  }

  function renderMe(){
    if(!S.user) return;
    const av = el("sideMeAv"), nm = el("sideMeName"), rl = el("sideMeRole"), rail = el("railMe");
    if(av){
      av.textContent = S.user.av;
      av.style.background = rgba(S.user.avatarColor, 0.18);
      av.style.color = S.user.avatarColor;
    }
    if(nm) nm.textContent = S.user.name;
    if(rl) rl.textContent = S.user.title;
    if(rail){
      rail.textContent = S.user.av;
      rail.style.background = rgba(S.user.avatarColor, 0.18);
      rail.style.color = S.user.avatarColor;
    }
  }

  /* ---------------- interactions ---------------- */
  function toggle(){
    const app = document.getElementById("app");
    app.classList.toggle("side-off");
    const opening = !app.classList.contains("side-off");
    /* only when both panes float do they need to be mutually exclusive */
    if(opening && Panel.isSideOverlay()) Panel.close();
    $$(".rail-btn[data-view]").forEach(function(b){
      b.classList.toggle("on", opening && b.getAttribute("data-view") === S.view);
    });
    Panel.syncOverlayScrim();
  }

  function filter(v){ S.filter = v; render(); }

  /* Switch which rail view the sidebar is showing. Clicking the active view
     again collapses the sidebar, the way the rail behaves in Sara. */
  function view(name){
    const app = document.getElementById("app");
    const side = el("side");
    const closed = app.classList.contains("side-off");
    if(!closed && S.view === name){ toggle(); return; }
    S.view = name;
    if(side) side.setAttribute("data-view", name);
    app.setAttribute("data-side", name);
    if(name !== "chats") S.bookmarkFilter = null;
    $$(".rail-btn[data-view]").forEach(function(b){
      b.classList.toggle("on", b.getAttribute("data-view") === name);
    });
    if(closed) toggle();
    if(name === "bookmarks") Library.renderBookmarks();
    else if(name === "files") Library.renderFiles();
    else if(name === "mcp") Library.renderMcp();
    else render();
    const input = el(name === "chats" ? "convoSearch" : name === "bookmarks" ? "bmSearch" : name === "files" ? "fileSearch" : "mcpSearch");
    if(input) setTimeout(function(){ input.focus(); }, 80);
  }

  function showBookmark(b){
    S.bookmarkFilter = b;
    S.filter = "";
    const i = el("convoSearch"); if(i) i.value = "";
    S.view = "chats";
    const side = el("side"); if(side) side.setAttribute("data-view", "chats");
    $$(".rail-btn[data-view]").forEach(function(x){ x.classList.toggle("on", x.getAttribute("data-view") === "chats"); });
    render();
    ensureOpen();
  }
  function showAll(){ S.bookmarkFilter = null; render(); }
  function ensureOpen(){
    const app = document.getElementById("app");
    if(app.classList.contains("side-off")) toggle();
  }

  function menu(event, id){
    event.preventDefault();
    closeFloaters();
    const c = S.convos.find(function(x){ return x.id === id; });
    if(!c) return;
    event.currentTarget.classList.add("open");

    const node = document.createElement("div");
    node.className = "menu";
    node.innerHTML =
      '<button class="menu-item" onclick="Sidebar.rename(\'' + escJs(id) + '\')">' + Icons.el("edit") + "Rename</button>" +
      '<button class="menu-item" onclick="Sidebar.duplicate(\'' + escJs(id) + '\')">' + Icons.el("copy") + "Duplicate</button>" +
      '<button class="menu-item" onclick="Exporter.conversation(\'' + escJs(id) + '\')">' + Icons.el("download") + "Export as Markdown</button>" +
      '<div class="menu-sep"></div>' +
      '<button class="menu-item danger" onclick="Sidebar.remove(\'' + escJs(id) + '\')">' + Icons.el("trash") + "Delete</button>";

    const r = event.currentTarget.getBoundingClientRect();
    placeFloater(node, r.left - 150, r.bottom + 6);
    Icons.hydrate(node);
  }

  function rename(id){
    closeFloaters();
    const c = S.convos.find(function(x){ return x.id === id; });
    if(!c) return;
    const next = window.prompt("Rename this chat", c.title);
    if(next == null) return;
    c.title = String(next).trim().slice(0, 70) || c.title;
    persist(); render(); Chat.updateThreadTitle();
  }
  function duplicate(id){
    closeFloaters();
    const c = S.convos.find(function(x){ return x.id === id; });
    if(!c) return;
    const copy = JSON.parse(JSON.stringify(c));
    copy.id = uid("c");
    copy.title = c.title + " (copy)";
    copy.ts = copy.updated = Date.now();
    copy.messages.forEach(function(m){
      const old = m.id;
      m.id = uid("m");
      if(m.artifactId) m.artifactId = "a_" + m.id;
      void old;
    });
    S.convos.unshift(copy);
    persist(); render();
    toast("Chat duplicated", "ok");
  }
  function remove(id){
    closeFloaters();
    const c = S.convos.find(function(x){ return x.id === id; });
    if(!c) return;
    if(!window.confirm("Delete “" + c.title + "”? This cannot be undone.")) return;
    S.convos = S.convos.filter(function(x){ return x.id !== id; });
    if(S.currentId === id){ S.currentId = null; Chat.renderConversation(); }
    persist(); render();
    toast("Chat deleted", "info");
  }
  function clearAll(){
    if(!S.convos.length){ toast("There is nothing to clear", "info"); return; }
    if(!window.confirm("Delete all " + S.convos.length + " conversations for this profile?")) return;
    S.convos = [];
    S.currentId = null;
    persist(); render();
    Chat.renderConversation();
    toast("All chats deleted", "info");
  }

  return {
    persist: persist, restore: restore, render: render, renderMe: renderMe,
    toggle: toggle, filter: filter, view: view, showBookmark: showBookmark, showAll: showAll,
    menu: menu, rename: rename,
    duplicate: duplicate, remove: remove, clearAll: clearAll,
  };
})();
