/* ------------------------------------------------------------------
   The three non-chat rail views: Bookmarks, Files, MCP servers.

   Bookmarks are named collections of conversations, reorderable by drag.
   Files present the knowledge base the way people expect to meet it, as
   documents with a type and a date, plus a "Frequently used" section the
   user pins to explicitly.
   MCP is a working mock: servers can be added, listed and removed, and the
   list persists, but nothing is dialled. That is deliberate and the runbook
   says so out loud.
   ------------------------------------------------------------------ */

const Library = (function(){

  /* ================= file typing ================= */
  const FILE_TYPES = {
    pdf:  { color: "#e8556f", label: "PDF document",   icon: "doc" },
    docx: { color: "#2f6fed", label: "Word document",  icon: "file" },
    xlsx: { color: "#1f9d55", label: "Spreadsheet",    icon: "table" },
    pptx: { color: "#e0701b", label: "Presentation",   icon: "grid" },
    csv:  { color: "#1f9d55", label: "CSV",            icon: "table" },
    txt:  { color: "#7b8494", label: "Text file",      icon: "file" },
  };
  /* A document's category implies the format it would really be held in. */
  const CAT_TYPE = {
    finance: "xlsx", commercial: "docx", people: "docx", customer: "docx",
    it: "txt", reference: "pdf",
  };

  function typeFor(doc){
    if(doc.file && doc.file.type && FILE_TYPES[doc.file.type]) return doc.file.type;
    return CAT_TYPE[doc.cat] || "pdf";
  }
  function nameFor(doc){
    if(doc.file && doc.file.name) return doc.file.name;
    const base = String(doc.title)
      .replace(/[^\w\d\s-]/g, "")
      .trim().replace(/\s+/g, "_").slice(0, 46);
    return base + (doc.rev ? "_v" + String(doc.rev).replace(/[^\w.]/g, "") : "") + "." + typeFor(doc);
  }
  /* Stable, derived from content length, so it never changes between loads. */
  function sizeFor(doc){
    const bytes = 24000 + String(doc.body || "").length * 62;
    if(bytes > 1048576) return (bytes / 1048576).toFixed(1) + " MB";
    return Math.round(bytes / 1024) + " KB";
  }

  /* ================= state ================= */
  function bmKey(){ return "bookmarks_" + ((S.user && S.user.roleKey) || "anon"); }
  function pinKey(){ return "pinnedFiles_" + ((S.user && S.user.roleKey) || "anon"); }
  const MCP_KEY = "mcpServers";

  let bookmarks = [];
  let pinned = [];
  let servers = [];
  let fileSort = { col: "name", dir: "asc" };
  let dragFrom = -1;

  function load(){
    bookmarks = Store.get(bmKey(), null);
    if(!Array.isArray(bookmarks)){
      bookmarks = (Config.bookmarks || []).map(function(b, i){
        return { id: "bm_seed_" + i, name: b.name || ("Bookmark " + (i + 1)), chatIds: [] };
      });
    }
    pinned = Store.get(pinKey(), null);
    if(!Array.isArray(pinned)) pinned = (Config.pinnedFiles || []).slice();

    servers = Store.get(MCP_KEY, null);
    if(!Array.isArray(servers)){
      servers = (Config.mcp || []).map(function(m, i){
        return Object.assign({ id: "mcp_seed_" + i, name: "Server", url: "", transport: "HTTP", tools: 0, status: "connected" }, m);
      });
    }
  }
  function saveBookmarks(){ Store.set(bmKey(), bookmarks); }
  function savePinned(){ Store.set(pinKey(), pinned); }
  function saveServers(){ Store.set(MCP_KEY, servers); }

  /* ================= bookmarks ================= */
  function liveCount(b){
    return (b.chatIds || []).filter(function(id){
      return S.convos.some(function(c){ return c.id === id && c.messages.length; });
    }).length;
  }

  function renderBookmarks(){
    const wrap = el("bmList"); if(!wrap) return;
    const q = ((el("bmSearch") || {}).value || "").trim().toLowerCase();
    const list = bookmarks.filter(function(b){ return !q || b.name.toLowerCase().indexOf(q) !== -1; });

    if(!list.length){
      wrap.innerHTML = q
        ? '<div class="side-empty">No bookmark matches that filter.</div>'
        : '<div class="side-blank"><span class="orb">' + Icons.el("bookmark") + "</span>" +
          "<h5>No bookmarks yet</h5><p>Group related chats into a bookmark so you can find them again. Use the plus above, or the bookmark icon in the header of any chat.</p></div>";
      Icons.hydrate(wrap);
      return;
    }

    wrap.innerHTML = list.map(function(b, i){
      return '<div class="bm" draggable="true" data-i="' + i + '" data-id="' + escAttr(b.id) + '" onclick="Library.openBookmark(\'' + escJs(b.id) + '\')">' +
        '<span class="bm-grip">' + Icons.el("grip") + "</span>" +
        '<span class="bm-name">' + esc(b.name) + "</span>" +
        '<span class="bm-n">' + liveCount(b) + "</span>" +
        '<button class="bm-act" onclick="event.stopPropagation();Library.renameBookmark(\'' + escJs(b.id) + '\')" aria-label="Rename">' + Icons.el("edit") + "</button>" +
        '<button class="bm-act danger" onclick="event.stopPropagation();Library.deleteBookmark(\'' + escJs(b.id) + '\')" aria-label="Delete">' + Icons.el("trash") + "</button>" +
      "</div>";
    }).join("");
    Icons.hydrate(wrap);
    bindDrag(wrap);
  }

  /* drag to reorder */
  function bindDrag(wrap){
    $$(".bm", wrap).forEach(function(node){
      node.addEventListener("dragstart", function(e){
        dragFrom = +node.getAttribute("data-i");
        node.classList.add("dragging");
        try{ e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(dragFrom)); }catch(err){}
      });
      node.addEventListener("dragend", function(){
        node.classList.remove("dragging");
        $$(".bm", wrap).forEach(function(n){ n.classList.remove("drop-before", "drop-after"); });
      });
      node.addEventListener("dragover", function(e){
        e.preventDefault();
        const r = node.getBoundingClientRect();
        const after = (e.clientY - r.top) > r.height / 2;
        node.classList.toggle("drop-after", after);
        node.classList.toggle("drop-before", !after);
      });
      node.addEventListener("dragleave", function(){ node.classList.remove("drop-before", "drop-after"); });
      node.addEventListener("drop", function(e){
        e.preventDefault();
        const to = +node.getAttribute("data-i");
        const r = node.getBoundingClientRect();
        const after = (e.clientY - r.top) > r.height / 2;
        reorder(dragFrom, after ? to + 1 : to);
      });
    });
  }
  function reorder(from, to){
    if(from < 0 || from >= bookmarks.length) return;
    const moved = bookmarks.splice(from, 1)[0];
    if(from < to) to--;
    bookmarks.splice(clamp(to, 0, bookmarks.length), 0, moved);
    saveBookmarks();
    renderBookmarks();
  }

  function newBookmark(name){
    const value = (name != null) ? name : window.prompt("Name this bookmark", "");
    if(value == null) return null;
    const clean = String(value).trim().slice(0, 48);
    if(!clean) return null;
    const b = { id: uid("bm"), name: clean, chatIds: [] };
    bookmarks.unshift(b);
    saveBookmarks();
    renderBookmarks();
    toast("Bookmark “" + clean + "” created", "ok");
    return b;
  }
  function renameBookmark(id){
    closeFloaters();
    const b = bookmarks.find(function(x){ return x.id === id; });
    if(!b) return;
    const next = window.prompt("Rename bookmark", b.name);
    if(next == null) return;
    b.name = String(next).trim().slice(0, 48) || b.name;
    saveBookmarks(); renderBookmarks();
  }
  function deleteBookmark(id){
    closeFloaters();
    const b = bookmarks.find(function(x){ return x.id === id; });
    if(!b) return;
    if(!window.confirm("Delete the bookmark “" + b.name + "”? The chats in it are not deleted.")) return;
    bookmarks = bookmarks.filter(function(x){ return x.id !== id; });
    saveBookmarks(); renderBookmarks();
    toast("Bookmark deleted", "info");
  }
  function openBookmark(id){
    const b = bookmarks.find(function(x){ return x.id === id; });
    if(!b) return;
    if(!liveCount(b)){
      toast("“" + b.name + "” has no chats in it yet", "info");
      return;
    }
    Sidebar.showBookmark(b);
  }

  /* membership, driven from the chat header */
  function inBookmark(bookmarkId, chatId){
    const b = bookmarks.find(function(x){ return x.id === bookmarkId; });
    return !!(b && b.chatIds.indexOf(chatId) !== -1);
  }
  function toggleChat(bookmarkId, chatId){
    const b = bookmarks.find(function(x){ return x.id === bookmarkId; });
    if(!b) return;
    const at = b.chatIds.indexOf(chatId);
    if(at === -1) b.chatIds.push(chatId); else b.chatIds.splice(at, 1);
    saveBookmarks();
    renderBookmarks();
    Sidebar.render();
    Chat.updateThreadTitle();
    toast(at === -1 ? "Added to “" + b.name + "”" : "Removed from “" + b.name + "”", at === -1 ? "ok" : "info");
  }
  function bookmarksForChat(chatId){
    return bookmarks.filter(function(b){ return b.chatIds.indexOf(chatId) !== -1; });
  }

  /* menu shown by the bookmark button in the chat header */
  function chatMenu(event){
    event.stopPropagation();
    closeFloaters();
    const c = Chat.conversation();
    if(!c || !c.messages.length){ toast("Nothing to bookmark yet", "warn"); return; }

    const node = document.createElement("div");
    node.className = "menu";
    node.innerHTML =
      '<div class="menu-head">Add this chat to</div>' +
      (bookmarks.length
        ? bookmarks.map(function(b){
            const on = inBookmark(b.id, c.id);
            return '<button class="menu-item" onclick="Library.toggleChat(\'' + escJs(b.id) + "','" + escJs(c.id) + '\')">' +
              Icons.el(on ? "check" : "bookmark") + esc(b.name) +
              '<span class="spacer"></span><kbd>' + liveCount(b) + "</kbd></button>";
          }).join("")
        : '<div class="side-empty" style="padding:10px 8px;text-align:left">No bookmarks yet.</div>') +
      '<div class="menu-sep"></div>' +
      '<button class="menu-item" onclick="Library.newBookmarkWithChat(\'' + escJs(c.id) + '\')">' + Icons.el("plus") + "New bookmark…</button>";

    const r = event.currentTarget.getBoundingClientRect();
    placeFloater(node, r.right - 200, r.bottom + 6);
    Icons.hydrate(node);
  }
  function newBookmarkWithChat(chatId){
    closeFloaters();
    const b = newBookmark();
    if(!b) return;
    b.chatIds.push(chatId);
    saveBookmarks();
    renderBookmarks(); Sidebar.render(); Chat.updateThreadTitle();
  }

  /* ================= files ================= */
  function allFiles(){
    const role = currentRole();
    const list = Config.kb.map(function(d){
      const t = typeFor(d);
      return {
        id: "f_" + d.id,
        docId: d.id,
        name: nameFor(d),
        type: t,
        date: d.updated || "",
        size: sizeFor(d),
        owner: d.owner || "",
        visible: Retrieval.visibleTo(d, role),
      };
    });
    (Config.files || []).forEach(function(f, i){
      list.push({
        id: "fx_" + i,
        docId: f.docId || null,
        name: f.name || ("file_" + i),
        type: FILE_TYPES[f.type] ? f.type : "pdf",
        date: f.date || "",
        size: f.size || "—",
        owner: f.owner || "Uploaded",
        visible: true,
      });
    });
    return list;
  }

  function sortFiles(col){
    fileSort = (fileSort.col === col)
      ? { col: col, dir: fileSort.dir === "asc" ? "desc" : "asc" }
      : { col: col, dir: col === "date" ? "desc" : "asc" };
    renderFiles();
  }

  /* A div, not a button: the row contains its own star button and nesting
     buttons is invalid HTML, which makes the parser close the outer one and
     tear the row apart. */
  function fileRow(f){
    const t = FILE_TYPES[f.type] || FILE_TYPES.pdf;
    const isPinned = pinned.indexOf(f.id) !== -1;
    const open = "Library.openFile('" + escJs(f.id) + "')";
    return '<div class="file' + (f.visible ? "" : " locked") + '" role="button" tabindex="0"' +
      ' onclick="' + open + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + open + '}">' +
      '<span class="file-ic" style="background:' + t.color + '">' + Icons.el(f.visible ? t.icon : "lock") + "</span>" +
      '<span class="file-mn"><span class="file-nm">' + esc(f.name) + "</span>" +
      '<span class="file-sub">' + esc(f.size) + (f.owner ? " · " + esc(f.owner) : "") + "</span></span>" +
      '<span class="file-date">' + esc(f.date ? fmtDate(f.date) : "—") + "</span>" +
      '<button class="file-star' + (isPinned ? " on" : "") + '" title="' + (isPinned ? "Remove from frequently used" : "Add to frequently used") +
        '" onclick="event.stopPropagation();Library.togglePin(\'' + escJs(f.id) + '\')" aria-label="Frequently used">' + Icons.el("star") + "</button>" +
    "</div>";
  }

  /* Files the person attached this session. Kept in their own section
     above the corpus because they are a different kind of thing: theirs,
     temporary, and not subject to company clearance. */
  function attachedSection(q){
    const list = Attachments.all().filter(function(a){
      return !q || a.name.toLowerCase().indexOf(q) !== -1;
    });
    if(!list.length) return "";

    const rows = list.map(function(a){
      const t = FILE_TYPES[a.kind] || FILE_TYPES.pdf;
      const state = a.state === "ready"
        ? FileParse.fmtBytes(a.size || 0) + " · " + (a.words || 0).toLocaleString() + " words"
        : a.state === "error" ? a.error : "Reading…";
      return '<div class="file file-att' + (a.state === "error" ? " locked" : "") + '">' +
        '<span class="file-ic" style="background:' + (a.state === "error" ? "var(--crit)" : t.color) + '">' +
          Icons.el(a.state === "error" ? "alert" : a.state === "ready" ? t.icon : "refresh") + "</span>" +
        '<span class="file-mn"><span class="file-nm">' + esc(a.name) + "</span>" +
        '<span class="file-sub">' + esc(state) + "</span></span>" +
        '<button class="file-star danger" onclick="Attachments.remove(\'' + escJs(a.id) + '\')" ' +
          'title="Remove this file" aria-label="Remove ' + escAttr(a.name) + '">' + Icons.el("trash") + "</button>" +
      "</div>";
    }).join("");

    return '<div class="file-sec">' + Icons.el("paperclip") + "Attached in this session</div>" + rows +
      '<div class="file-note">Parsed in your browser, never uploaded, and cleared when you close the tab.</div>';
  }

  function renderFiles(){
    const wrap = el("fileList"); if(!wrap) return;
    const q = ((el("fileSearch") || {}).value || "").trim().toLowerCase();

    let list = allFiles();
    if(q) list = list.filter(function(f){ return (f.name + " " + f.owner).toLowerCase().indexOf(q) !== -1; });

    const dir = fileSort.dir === "desc" ? -1 : 1;
    list.sort(function(a, b){
      if(fileSort.col === "date") return (String(a.date).localeCompare(String(b.date))) * dir;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }) * dir;
    });

    const favs = list.filter(function(f){ return pinned.indexOf(f.id) !== -1; });
    const rest = list.filter(function(f){ return pinned.indexOf(f.id) === -1; });

    const arrow = function(col){
      return fileSort.col === col ? (fileSort.dir === "desc" ? "▼" : "▲") : "";
    };
    let html =
      '<button class="side-new" onclick="Attachments.pick()">' +
        Icons.el("upload") + "<span>Upload a file</span>" +
        '<span class="spacer"></span><kbd>or drop it</kbd></button>' +
      attachedSection(q) +
      '<div class="file-head">' +
        '<button class="col-name' + (fileSort.col === "name" ? " on" : "") + '" onclick="Library.sortFiles(\'name\')">Name ' +
          Icons.el("updown") + '<span>' + arrow("name") + "</span></button>" +
        '<button class="col-date' + (fileSort.col === "date" ? " on" : "") + '" onclick="Library.sortFiles(\'date\')">Date ' +
          Icons.el("updown") + '<span>' + arrow("date") + "</span></button>" +
      "</div>";

    if(!list.length){
      html += '<div class="side-empty">No file matches that filter.</div>';
    }else{
      if(favs.length){
        html += '<div class="file-sec">' + Icons.el("star") + "Frequently used</div>" + favs.map(fileRow).join("");
        html += '<div class="file-sec">All files</div>';
      }
      html += rest.map(fileRow).join("");
    }

    if(!favs.length && list.length){
      html += '<div class="side-blank" style="margin-top:var(--s4)"><span class="orb">' + Icons.el("star") + "</span>" +
        "<h5>Frequently used</h5><p>Star a file to keep it at the top of this list, so the documents you reach for every day are one click away.</p></div>";
    }

    wrap.innerHTML = html;
    Icons.hydrate(wrap);
  }

  function togglePin(id){
    const at = pinned.indexOf(id);
    if(at === -1) pinned.push(id); else pinned.splice(at, 1);
    savePinned();
    renderFiles();
    toast(at === -1 ? "Added to frequently used" : "Removed from frequently used", at === -1 ? "ok" : "info");
  }

  function openFile(id){
    const f = allFiles().find(function(x){ return x.id === id; });
    if(!f) return;
    if(f.docId){ Modals.openDoc(f.docId); return; }
    toast("“" + f.name + "” has no indexed content in this build", "warn");
  }

  /* ================= mcp (mock) ================= */
  function renderMcp(){
    const wrap = el("mcpList"); if(!wrap) return;
    const q = ((el("mcpSearch") || {}).value || "").trim().toLowerCase();
    const list = servers.filter(function(s){ return !q || String(s.name).toLowerCase().indexOf(q) !== -1; });

    if(!list.length){
      wrap.innerHTML = q
        ? '<div class="side-empty">No server matches that filter.</div>'
        : '<div class="side-blank"><span class="orb">' + Icons.el("layers") + "</span>" +
          "<h5>No MCP servers yet</h5><p>Create your first MCP server to get started.</p>" +
          '<button class="btn btn-sm" style="margin-top:12px" onclick="Library.newMcp()">Add a server</button></div>';
      Icons.hydrate(wrap);
      return;
    }

    wrap.innerHTML = list.map(function(s){
      return '<div class="mcp">' +
        '<span class="mcp-ic">' + Icons.el("layers") + "</span>" +
        '<span class="mcp-mn"><span class="mcp-nm">' + esc(s.name) + "</span>" +
        '<span class="mcp-sub"><span class="dot' + (s.status === "connected" ? "" : " off") + '"></span>' +
          esc(s.transport || "HTTP") + (s.tools ? " · " + s.tools + " tools" : "") + "</span></span>" +
        '<button class="bm-act danger" style="opacity:1" onclick="Library.removeMcp(\'' + escJs(s.id) + '\')" aria-label="Remove">' + Icons.el("trash") + "</button>" +
      "</div>";
    }).join("");
    Icons.hydrate(wrap);
  }

  function newMcp(){
    const name = window.prompt("MCP server name", "");
    if(name == null) return;
    const clean = String(name).trim().slice(0, 40);
    if(!clean) return;
    const url = window.prompt("Server URL", "https://") || "";
    servers.unshift({
      id: uid("mcp"), name: clean, url: String(url).trim(),
      transport: /^https?:/i.test(url) ? "HTTP" : "stdio", tools: 0, status: "connected",
    });
    saveServers();
    renderMcp();
    toast("“" + clean + "” added. Tool calls are not dialled in this build.", "info", 4200);
  }
  function removeMcp(id){
    const s = servers.find(function(x){ return x.id === id; });
    if(!s) return;
    if(!window.confirm("Remove the MCP server “" + s.name + "”?")) return;
    servers = servers.filter(function(x){ return x.id !== id; });
    saveServers();
    renderMcp();
  }

  /* ================= lifecycle ================= */
  function init(){
    load();
    renderBookmarks();
    renderFiles();
    renderMcp();
  }
  function renderAll(){ renderBookmarks(); renderFiles(); renderMcp(); }

  return {
    init: init, load: load, renderAll: renderAll,
    renderBookmarks: renderBookmarks, newBookmark: newBookmark, newBookmarkWithChat: newBookmarkWithChat,
    renameBookmark: renameBookmark, deleteBookmark: deleteBookmark, openBookmark: openBookmark,
    toggleChat: toggleChat, inBookmark: inBookmark, bookmarksForChat: bookmarksForChat, chatMenu: chatMenu,
    renderFiles: renderFiles, sortFiles: sortFiles, togglePin: togglePin, openFile: openFile,
    renderMcp: renderMcp, newMcp: newMcp, removeMcp: removeMcp,
    get bookmarks(){ return bookmarks; },
    get pinned(){ return pinned; },
    get servers(){ return servers; },
  };
})();
