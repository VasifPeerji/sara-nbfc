/* ------------------------------------------------------------------
   Chat engine: composer, retrieval trace, streaming render, message
   actions. Conversation records live here; the sidebar only presents them.
   ------------------------------------------------------------------ */

const Chat = (function(){

  let pendingFrame = null;
  let stickToBottom = true;

  /* ---------------- conversation records ---------------- */
  function conversation(){
    return S.convos.find(function(c){ return c.id === S.currentId; }) || null;
  }
  function ensureConversation(seedTitle){
    let c = conversation();
    if(c) return c;
    c = { id: uid("c"), title: seedTitle || "New chat", ts: Date.now(), updated: Date.now(),
          temp: !!S.temporary, messages: [] };
    S.convos.unshift(c);
    S.currentId = c.id;
    /* files were dropped before this conversation existed; hand them over
       now, or retrieval will filter them out of the answer they were
       attached for */
    Attachments.claim(c.id);
    return c;
  }

  /* ---------------- temporary chat ----------------
     A temporary chat lives only in memory: it is never written to the sidebar
     and never persisted, so closing the tab is enough to lose it. Toggling
     always starts a fresh conversation, because retro-fitting the flag onto
     an existing one would leave the earlier turns already on disk. */
  function toggleTemporary(){
    if(S.streaming) stop();
    S.temporary = !S.temporary;
    document.body.classList.toggle("temp-chat", S.temporary);
    S.currentId = null;
    Panel.reset();
    renderConversation();
    Sidebar.render();
    Attachments.render();
    const input = el("composerIn");
    if(input){ input.value = ""; autogrow(input); input.focus(); }
    toast(S.temporary
      ? "Temporary chat on. Nothing from here is saved to history."
      : "Temporary chat off. New chats are saved again.", S.temporary ? "info" : "ok", 4000);
  }
  function findMessage(id){
    const c = conversation();
    if(!c) return null;
    return c.messages.find(function(m){ return m.id === id; }) || null;
  }

  /* ---------------- composer ---------------- */
  function autogrow(node){
    node.style.height = "auto";
    node.style.height = Math.min(220, node.scrollHeight) + "px";
    const send = el("sendBtn");
    if(send && !S.streaming) send.disabled = !node.value.trim();
  }
  function onKey(e){
    if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); submit(e); }
  }
  function submit(e){
    if(e && e.preventDefault) e.preventDefault();
    if(S.streaming){ stop(); return false; }
    const input = el("composerIn");
    const text = input.value.trim();
    if(!text) return false;
    input.value = "";
    autogrow(input);
    send(text);
    return false;
  }
  function ask(text){
    const input = el("composerIn");
    if(S.streaming){ toast("Wait for the current answer to finish", "warn"); return; }
    input.value = text;
    autogrow(input);
    send(text);
  }
  function prefill(text){
    const input = el("composerIn");
    input.value = text;
    autogrow(input);
    input.focus();
  }

  /* ---------------- scrolling ---------------- */
  function nearBottom(){
    const t = el("thread");
    return t.scrollHeight - t.scrollTop - t.clientHeight < 120;
  }
  function scrollToEnd(force){
    const t = el("thread");
    if(force || stickToBottom) t.scrollTop = t.scrollHeight;
  }
  function initScroll(){
    const t = el("thread"), pill = el("toBottom");
    t.addEventListener("scroll", function(){
      stickToBottom = nearBottom();
      pill.classList.toggle("show", !stickToBottom && t.scrollHeight > t.clientHeight + 200);
    }, { passive: true });
  }

  /* ---------------- welcome ---------------- */
  function renderWelcome(){
    const role = currentRole();
    const c = Config;
    const name = (S.user && S.user.name || "").split(/\s+/)[0] || "there";
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const scopeChips = (role.scopes || []).slice(0, 8).map(function(s){
      return '<span class="chip">' + esc(scopeLabel(s)) + "</span>";
    }).join("");

    const prompts = (role.prompts || []).slice(0, 6).map(function(p){
      return '<button class="prompt" onclick="Chat.ask(\'' + escJs(p.q) + '\')">' +
        '<span class="ic">' + Icons.el(Icons.has(p.icon) ? p.icon : "spark") + "</span>" +
        '<span class="mn"><span class="tt">' + esc(p.t) + "</span>" +
        (p.s ? '<span class="ss">' + esc(p.s) + "</span>" : "") + "</span></button>";
    }).join("");

    /* Tasks come before suggested questions on purpose. Someone opening this
       for the first time is looking for what it can do for them, and
       finishing a job they actually have is a better first answer than a
       clever question they did not ask. */
    /* Guided tasks and Operator runs sit together. To the person using
       this they are the same thing: work that finishes, rather than an
       answer to read. */
    const tasks = Router.cardsMarkup(4, 3);

    return '<div class="welcome">' +
      '<div class="welcome-orb' + (hasBrandLogo() ? " has-logo" : "") + '">' + brandMark() + "</div>" +
      '<h1 class="welcome-h">' + esc(greet) + ", <em>" + esc(name) + "</em>.</h1>" +
      '<p class="welcome-sub">' + esc(role.greeting || c.assistant.greeting ||
        ("Ask anything about " + c.company.name + ". Answers come from the company knowledge base, with the source attached.")) + "</p>" +
      (scopeChips ? '<div class="welcome-scope">' + scopeChips + "</div>" : "") +
      (tasks ? '<div class="welcome-sec">' + Icons.el("checklist") + "Get something done" +
               (Journeys.forRole().length > 4
                 ? '<button class="lnk" onclick="Journeys.openPicker()">See all ' +
                   Journeys.forRole().length + "</button>" : "") + "</div>" + tasks : "") +
      (prompts ? (tasks ? '<div class="welcome-sec">' + Icons.el("spark") + "Or ask a question</div>" : "") +
                 '<div class="prompts">' + prompts + "</div>" : "") +
    "</div>";
  }

  /** Why documents were withheld, in one line.

      A clearance block and a scope block are different things and only
      one of them is about seniority. Reporting both as "above your
      access level" is what made the access model look like a hierarchy
      when it is not: a laboratory authorisation is a competence record,
      and the Managing Director does not hold one. */
  function blockedSummary(blocked){
    const list = blocked || [];
    if(!list.length) return "";
    const lvl = list.filter(b => b.reason && b.reason.kind === "clearance").length;
    const scp = list.filter(b => b.reason && b.reason.kind === "scope");
    const names = [];
    scp.forEach(b => String((b.reason && b.reason.label) || "").split(", ").forEach(n => {
      if(n && names.indexOf(n) === -1) names.push(n);
    }));
    const parts = [];
    if(lvl) parts.push(lvl + " above your clearance");
    if(scp.length) parts.push(scp.length + " outside your scopes" +
      (names.length ? " (" + names.slice(0, 2).join(", ") + ")" : ""));
    return parts.join(", ");
  }

  function scopeLabel(s){
    const named = (Config.scopeLabels || {})[s];
    if (named) return named;
    return String(s).replace(/[_-]+/g, " ").replace(/\b\w/g, function(ch){ return ch.toUpperCase(); });
  }

  /* ---------------- message markup ---------------- */
  function userMarkup(m){
    return '<div class="msg msg-user" id="' + m.id + '">' +
      '<div class="bubble">' + esc(m.text) + "</div>" +
      '<div class="edit-row">' +
        '<button class="ib ib-sm tip tip-b" data-tip="Edit and resend" onclick="Chat.editUser(\'' + escJs(m.id) + '\')">' + Icons.el("edit") + "</button>" +
        '<button class="ib ib-sm tip tip-b" data-tip="Copy" onclick="Chat.copy(\'' + escJs(m.id) + '\')">' + Icons.el("copy") + "</button>" +
      "</div></div>";
  }

  function traceMarkup(m){
    const t = m.trace;
    if(!t) return "";
    if(t.state === "searching" || t.state === "web" || t.state === "routing"){
      return '<div class="trace" id="tr_' + m.id + '"><div class="trace-head">' +
        '<span class="i spin">' + Icons.svg("refresh") + "</span>" +
        '<span class="lbl">' + (t.state === "web" ? "Searching the web…"
          : t.state === "routing" ? "Working out what you are asking for…"
          : "Searching the knowledge base…") +
        "</span></div></div>";
    }
    /* Routed away from retrieval entirely. Show what it decided and why,
       because a router that silently redirects is a router nobody trusts. */
    if(t.state === "routed"){
      const d = m.decision || {};
      return '<div class="trace is-routed" id="tr_' + m.id + '"><div class="trace-head">' +
        Router.badge(d) +
        '<span class="lbl">' + esc(d.why || "") + "</span>" +
        '<span class="n">' + (d.source === "llm" ? "classified" : "matched") + "</span>" +
        "</div></div>";
    }
    const s = t.stats || {};
    const w = m.web || null;
    const webCount = w && w.results ? w.results.length : 0;

    const bits = [];
    if(s.matched) bits.push(s.matched + " source" + (s.matched === 1 ? "" : "s") + " from " + s.docs + " documents");
    if(s.attached) bits.push(s.attached + " from your attached file" + (s.attached === 1 ? "" : "s"));
    if(webCount) bits.push(webCount + " web result" + (webCount === 1 ? "" : "s"));
    if(!bits.length) bits.push("No matching documents in the knowledge base");
    const totalMs = (s.ms || 0) + (w ? w.ms : 0);
    const label = bits.join(" · ") + (totalMs ? " · " + totalMs + " ms" : "");

    let steps =
      '<div class="trace-step">' + Icons.el("check") + "<span>Query expanded to " + (s.terms || []).length + " terms</span>" +
        '<span class="n">' + esc((s.terms || []).slice(0, 6).join(", ")) + "</span></div>" +
      '<div class="trace-step">' + Icons.el("check") + "<span>Scanned " + s.scanned + " passages across " + s.docs + " documents</span>" +
        '<span class="n">' + s.ms + " ms</span></div>" +
      '<div class="trace-step">' + Icons.el("check") + "<span>Filtered by your access level</span>" +
        '<span class="n">' + (CLEARANCE[currentClearance()] || {}).label + "</span></div>" +
      (s.attached
        ? '<div class="trace-step">' + Icons.el("paperclip") + "<span>Read " + s.attached + " extract" +
          (s.attached === 1 ? "" : "s") + " from the file" + (s.attached === 1 ? "" : "s") + " you attached</span></div>"
        : "") +
      (t.blockedCount
        ? '<div class="trace-step">' + Icons.el("lock") +
          "<span style=\"color:var(--warn)\">" + t.blockedCount + " matching document" + (t.blockedCount === 1 ? "" : "s") +
          " withheld" + (t.blockedWhy ? " — " + esc(t.blockedWhy) : "") + "</span></div>"
        : "");

    /* Why the web was searched matters as much as that it was: an auto
       decision the presenter cannot explain is a decision nobody trusts. */
    if(w){
      steps += '<div class="trace-step">' + Icons.el("globe") +
        "<span>Searched the web because " + esc(w.why || "web search is switched on") + "</span>" +
        '<span class="n">' + w.ms + " ms</span></div>";
      (w.connectors || []).forEach(function(c){
        steps += '<div class="trace-step trace-sub">' + Icons.el(c.error ? "alert" : "check") +
          "<span" + (c.error ? ' style="color:var(--warn)"' : "") + ">" + esc(c.name) +
          (c.error ? " — " + esc(c.error) : " returned " + c.count + " result" + (c.count === 1 ? "" : "s")) +
          "</span><span class=\"n\">" + c.ms + " ms</span></div>";
      });
      if(w.read) steps += '<div class="trace-step trace-sub">' + Icons.el("doc") +
        "<span>Read the top pages in full rather than using search snippets</span></div>";
      if(w.failed) steps += '<div class="trace-step trace-sub">' + Icons.el("alert") +
        '<span style="color:var(--warn)">Web search failed: ' + esc(w.failed) + "</span></div>";
    }

    const list = (m.sources || []).map(function(src){
      const cat = Config.categories[src.cat] || { label: src.cat };
      return '<button class="src' + (src.attachment ? " src-att" : "") + '" onclick="Panel.showSource(' + (src.n - 1) + ",'" + escJs(m.id) + "')\">" +
        '<span class="src-n">' + src.n + "</span>" +
        '<span class="src-main"><span class="src-t">' + esc(src.title) + "</span>" +
        '<span class="src-m">' + esc(src.id) + " · " + esc(cat.label) +
          (src.updated ? " · " + esc(fmtDate(src.updated)) : "") + "</span></span>" +
        '<span class="src-score">' + src.relevance + "%</span></button>";
    }).join("");

    /* A div, not a button: each row carries its own "open the page" link,
       and an anchor nested in a button is invalid markup that the parser
       tears apart. */
    const webList = (webCount ? w.results : []).map(function(r){
      const open = "Panel.showWeb(" + (r.n - 1) + ",'" + escJs(m.id) + "')";
      return '<div class="wsrc" role="button" tabindex="0" onclick="' + open +
        '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + open + '}">' +
        '<span class="wsrc-n">' + Icons.el("globe") + r.n + "</span>" +
        '<span class="wsrc-main"><span class="wsrc-t">' + esc(r.title) + "</span>" +
        '<span class="wsrc-m">' + esc(r.site) + (r.date ? " · " + esc(r.date) : "") +
          (r.read ? " · page read in full" : "") + "</span></span>" +
        '<a class="wsrc-go" href="' + escAttr(r.url) + '" target="_blank" rel="noopener noreferrer"' +
          ' onclick="event.stopPropagation()" aria-label="Open the page">' + Icons.el("external") + "</a>" +
      "</div>";
    }).join("");

    return '<div class="trace' + (S.traceOpen ? " open" : "") + '" id="tr_' + m.id + '">' +
      '<button class="trace-head" onclick="this.parentNode.classList.toggle(\'open\')">' +
        Icons.el(webCount && !s.matched ? "globe" : s.matched ? "library" : "info") +
        '<span class="lbl">' + esc(label) + "</span>" +
        Icons.el("chevdown", "caret") +
      "</button>" +
      '<div class="trace-body">' + steps +
        (list ? '<div class="src-list">' + list + "</div>" : "") +
        (webList ? '<div class="src-sec">' + Icons.el("globe") + "From the web</div>" +
                   '<div class="src-list">' + webList + "</div>" : "") +
      "</div>" +
    "</div>";
  }

  /* ---------------- guided tasks ----------------
     A task lives in the thread as an ordinary assistant turn whose body is
     the task card. Keeping it in the conversation rather than in a modal is
     the point: someone can stop half way, ask a question in their own words,
     and pick the task back up, because it never took the screen away. */
  function journeyMarkup(m){
    return '<div class="msg msg-ai" id="' + m.id + '">' +
      '<div class="msg-head">' +
        '<span class="msg-mark' + (hasBrandLogo() ? " has-logo" : "") + '">' + brandMark() + "</span>" +
        '<span class="msg-name">' + esc(Config.assistant.name || Config.product.name) + "</span>" +
        '<span class="msg-time">' + esc(fmtTime(m.ts)) + "</span>" +
      "</div>" +
      '<div id="jn_' + m.id + '"></div>' +
      '<div class="msg-body md" id="body_' + m.id + '"></div>' +
      '<div id="art_' + m.id + '"></div>' +
      '<div class="msg-acts" id="acts_' + m.id + '"></div>' +
    "</div>";
  }

  /* Reopening the conversation later shows what was completed, not a live
     card: the answers are already recorded and the document already exists. */
  function journeyStatic(m){
    if(!m.journey) return "";
    return '<div class="jn jn-past">' +
      '<div class="jn-head">' +
        '<span class="jn-ic">' + Icons.el(Icons.has(m.journey.icon) ? m.journey.icon : "checklist") + "</span>" +
        '<span class="jn-hm"><span class="jn-ht">' + esc(m.journey.title) + "</span>" +
        '<span class="jn-hs">' + (m.journey.done ? "Completed" : "Not finished") + "</span></span>" +
      "</div>" +
      (m.journey.rows && m.journey.rows.length
        ? '<div class="jn-body">' + m.journey.rows.map(function(r){
            return '<div class="jn-done static">' +
              '<span class="jn-dtick">' + Icons.el("check") + "</span>" +
              '<span class="jn-dm"><span class="jn-dq">' + esc(r.q) + "</span>" +
              '<span class="jn-da">' + esc(r.a) + "</span></span></div>";
          }).join("") + "</div>"
        : "") +
    "</div>";
  }

  function beginJourney(journey){
    const c = ensureConversation(journey.title);
    const inner = el("threadInner");
    if(!c.messages.length){
      c.title = journey.title;
      if(inner) inner.innerHTML = "";
    }
    const m = {
      id: uid("m"), role: "assistant", kind: "journey", ts: Date.now(),
      text: "", sources: [], followups: [], artifactId: null,
      journey: { id: journey.id, title: journey.title, icon: journey.icon, done: false, rows: [] },
    };
    c.messages.push(m);
    if(inner){
      inner.insertAdjacentHTML("beforeend", journeyMarkup(m));
      Icons.hydrate(el(m.id));
      stickToBottom = true;
      scrollToEnd(true);
    }
    Sidebar.persist();
    Sidebar.render();
    updateThreadTitle();
    return { msgId: m.id };
  }

  /* The document is already built and on screen before this runs. Anything
     the model adds is a covering note on top, so a missing key or a dead
     network costs a paragraph, never the task. */
  async function completeJourney(journey, answers, spec, artifactId){
    const c = conversation();
    const m = c && c.messages.slice().reverse().find(function(x){ return x.kind === "journey"; });
    if(!m) return;

    m.artifact = spec;
    m.artifactId = artifactId;
    m.journey.done = true;
    m.journey.rows = (journey.steps || [])
      .filter(function(s){ return answers[s.id] !== undefined && answers[s.id] !== ""; })
      .map(function(s){
        const v = answers[s.id];
        return { q: s.q, a: Array.isArray(v) ? v.join(", ") : (v === true ? "Yes" : v === false ? "No" : String(v)) };
      });
    Sidebar.persist();

    if(!Keys.get(S.provider)) return;

    const lines = m.journey.rows.map(function(r){ return "- " + r.q + " " + r.a; }).join("\n");
    const found = Retrieval.search(journey.title + " " + Object.values(answers).join(" "),
                                   { role: currentRole(), topK: 4, convoId: c.id });
    const sys = LLM.systemPrompt({
      role: currentRole(), user: S.user, sources: found.sources, blocked: found.blocked,
      web: null, attached: [], style: "brief", images: false,
    });
    const ask = `A colleague has just completed the task "${journey.title}" and the record below has already been produced for them.

${lines}

Write two or three sentences for them: confirm what has been prepared, name the single most important thing to do next, and flag anything in the sources that affects it. Do not restate the list. Do not produce an artifact or follow-up block.`;

    m.sources = found.sources;
    m.streaming = true;
    paintAssistant(m, true);

    try{
      let raw = "";
      await LLM.stream([{ role: "system", content: sys }, { role: "user", content: ask }], {
        maxTokens: 700,
        onDelta: function(cumulative){ raw = cumulative; scheduleRender(m, raw); },
      });
      m.text = LLM.split(raw).visible.trim();
    }catch(err){
      m.text = "";
    }
    m.streaming = false;
    paintAssistant(m, true);
    Sidebar.persist();
    scrollToEnd();
  }

  function assistantMarkup(m){
    return '<div class="msg msg-ai" id="' + m.id + '">' +
      '<div class="msg-head">' +
        '<span class="msg-mark' + (hasBrandLogo() ? " has-logo" : "") + '">' + brandMark() + "</span>" +
        '<span class="msg-name">' + esc(Config.assistant.name || Config.product.name) + "</span>" +
        '<span class="msg-time">' + esc(fmtTime(m.ts)) + "</span>" +
      "</div>" +
      '<div id="tw_' + m.id + '">' + traceMarkup(m) + "</div>" +
      '<div class="msg-body md" id="body_' + m.id + '"></div>' +
      /* the drawing sits in the answer, not behind a card. A credit
         engineer should not have to click to see a section. */
      '<div id="dg_' + m.id + '"></div>' +
      '<div id="run_' + m.id + '"></div>' +
      '<div id="art_' + m.id + '"></div>' +
      '<div id="fup_' + m.id + '"></div>' +
      '<div class="msg-acts" id="acts_' + m.id + '"></div>' +
    "</div>";
  }

  function actionsMarkup(m){
    if(S.streaming && m.streaming) return "";
    const rate = m.rating;
    return '<button class="ib ib-sm tip tip-b" data-tip="Read aloud" onclick="Chat.speak(\'' + escJs(m.id) + '\')">' + Icons.el("speaker") + "</button>" +
      '<button class="ib ib-sm tip tip-b" data-tip="Copy" onclick="Chat.copy(\'' + escJs(m.id) + '\')">' + Icons.el("copy") + "</button>" +
      '<button class="ib ib-sm tip tip-b" data-tip="Regenerate" onclick="Chat.regenerate(\'' + escJs(m.id) + '\')">' + Icons.el("refresh") + "</button>" +
      '<button class="ib ib-sm tip tip-b' + (rate === 1 ? " rated-up" : "") + '" data-tip="Helpful" onclick="Chat.rate(\'' + escJs(m.id) + '\',1)">' + Icons.el("thumbup") + "</button>" +
      '<button class="ib ib-sm tip tip-b' + (rate === -1 ? " rated-down" : "") + '" data-tip="Not helpful" onclick="Chat.rate(\'' + escJs(m.id) + '\',-1)">' + Icons.el("thumbdown") + "</button>";
  }

  /* ---------------- rendering ---------------- */
  function renderConversation(){
    const inner = el("threadInner");
    const c = conversation();
    Panel.reset();

    if(!c || !c.messages.length){
      inner.innerHTML = renderWelcome();
      Icons.hydrate(inner);
      updateThreadTitle();
      return;
    }

    inner.innerHTML = c.messages.map(function(m){
      return m.role === "user" ? userMarkup(m)
           : m.kind === "journey" ? journeyMarkup(m)
           : assistantMarkup(m);
    }).join("");

    c.messages.forEach(function(m){
      if(m.role !== "assistant") return;
      if(m.kind === "journey"){
        const host = el("jn_" + m.id);
        if(host){ host.innerHTML = journeyStatic(m); Icons.hydrate(host); }
      }
      paintAssistant(m, true);
    });

    Icons.hydrate(inner);
    updateThreadTitle();
    scrollToEnd(true);
  }

  /* Repaint one assistant message body, artifact reference and follow-ups. */
  function paintAssistant(m, full){
    const bodyEl = el("body_" + m.id);
    if(!bodyEl) return;

    const ctx = { sources: m.sources || [], web: (m.web && m.web.results) || [], msgId: m.id };
    bodyEl.innerHTML = m.text ? MD.render(m.text, ctx)
      : (m.streaming ? '<div class="thinking"><span class="dots"><i></i><i></i><i></i></span><span>Composing the answer…</span></div>' : "");
    bodyEl.classList.toggle("streaming", !!m.streaming && !!m.text);

    if(m.error){
      bodyEl.innerHTML = '<div class="msg-err">' + Icons.el("alert") +
        '<span class="mn"><b>' + esc(m.error.title || "Something went wrong") + "</b>" +
        '<span class="dtl">' + esc(m.error.detail || "") + "</span>" +
        '<span class="acts">' +
          '<button class="btn btn-sm" onclick="Chat.regenerate(\'' + escJs(m.id) + '\')">Try again</button>' +
          (m.error.settings ? '<button class="btn btn-sm btn-primary" onclick="Models.open()">Choose model</button>' : "") +
        "</span></span></div>";
    }

    if(full || !m.streaming){
      const runEl = el("run_" + m.id);
      if(runEl){
        runEl.innerHTML = m.action ? Router.actionMarkup(m.action) : "";
        if(m.action) Icons.hydrate(runEl);
      }

      const dgEl = el("dg_" + m.id);
      if(dgEl){
        dgEl.innerHTML = m.diagram ? Diagrams.render(m.diagram) : "";
        if(m.diagram) Icons.hydrate(dgEl);
      }

      const artEl = el("art_" + m.id);
      if(artEl) artEl.innerHTML = m.artifactId ? artifactRefMarkup(m) : "";

      const fupEl = el("fup_" + m.id);
      if(fupEl){
        fupEl.innerHTML = (m.followups && m.followups.length && !m.streaming)
          ? '<div class="fups">' + m.followups.map(function(q){
              return '<button class="fup" onclick="Chat.ask(\'' + escJs(q) + '\')">' + Icons.el("arrowright") + esc(q) + "</button>";
            }).join("") + "</div>"
          : "";
      }

      const actsEl = el("acts_" + m.id);
      if(actsEl) actsEl.innerHTML = m.streaming ? "" : actionsMarkup(m);
    }

    Icons.hydrate(el(m.id));
  }

  function artifactRefMarkup(m){
    const rec = Panel.find(m.artifactId);
    if(!rec) return "";
    if(rec.kind === "building"){
      return '<button class="art-ref building"><span class="ic">' + Icons.el("spark") + "</span>" +
        '<span class="mn"><span class="tt">Preparing visual…</span>' +
        '<span class="ss">Building the workspace view</span></span></button>';
    }
    return '<button class="art-ref" onclick="Panel.show(\'' + escJs(rec.id) + '\')">' +
      '<span class="ic">' + Icons.el(Artifacts.icon(rec.spec)) + "</span>" +
      '<span class="mn"><span class="tt">' + esc(rec.spec.title || Artifacts.label(rec.spec)) + "</span>" +
      '<span class="ss">' + esc(Artifacts.label(rec.spec)) + " · open in the workspace</span></span>" +
      '<span class="i go">' + Icons.svg("chevright") + "</span></button>";
  }

  function updateThreadTitle(){
    const c = conversation();
    const t = el("threadTitle");
    if(t) t.textContent = c && c.messages.length ? c.title : "";
    const save = el("saveBtn");
    if(save) save.classList.toggle("on", !!(c && Library.bookmarksForChat(c.id).length));
  }

  /* ---------------- the send loop ---------------- */
  async function send(text){
    const c = ensureConversation();
    stickToBottom = true;

    /* first user turn names the conversation */
    if(!c.messages.length){
      c.title = makeTitle(text);
      el("threadInner").innerHTML = "";
    }

    const userMsg = { id: uid("m"), role: "user", text: text, ts: Date.now() };
    c.messages.push(userMsg);
    el("threadInner").insertAdjacentHTML("beforeend", userMarkup(userMsg));
    Icons.hydrate(el(userMsg.id));

    const aiMsg = {
      id: uid("m"), role: "assistant", text: "", ts: Date.now(),
      sources: [], followups: [], artifactId: null, streaming: true,
      trace: { state: "searching" },
    };
    c.messages.push(aiMsg);
    el("threadInner").insertAdjacentHTML("beforeend", assistantMarkup(aiMsg));
    Icons.hydrate(el(aiMsg.id));
    paintAssistant(aiMsg, true);
    scrollToEnd();

    setStreaming(true);
    Sidebar.render();

    const repaintTrace = function(){
      const node = el("tw_" + aiMsg.id);
      if(node){ node.innerHTML = traceMarkup(aiMsg); Icons.hydrate(node); }
      scrollToEnd();
    };

    /* ---- routing: which of the four products is this? ----
       Done before retrieval, because three of the four outcomes do not
       need retrieval at all, and two of them do not need the model for
       the answer either. */
    aiMsg.trace = { state: "routing" };
    repaintTrace();
    let decision;
    try{
      decision = await Router.route(text);
    }catch(err){
      decision = Router.rulesClassify(text);
    }
    aiMsg.decision = decision;

    /* Work in the system, or a guided task: the router replies in its own
       words and hands over. No retrieval, and no model call for the body. */
    if(decision.intent === "operator" || decision.intent === "task"){
      const run = Router.findRun(decision.intent, decision.target);
      if(run){
        aiMsg.trace = { state: "routed" };
        aiMsg.text = decision.intent === "operator" ? Router.operatorReply(run) : Router.taskReply(run);
        aiMsg.action = { kind: decision.intent, id: run.id, launched: true };
        repaintTrace();
        finish(aiMsg, c);
        /* let the message paint, and the reader start reading it, before
           the surface changes underneath them */
        setTimeout(function(){ Router.launch(decision.intent, run.id, decision.params); }, 900);
        return;
      }
      /* the target went away between classification and here: answer it as
         a question rather than doing nothing */
      decision = { intent: "knowledge", target: null, source: decision.source, why: "target unavailable" };
      aiMsg.decision = decision;
    }

    if(decision.intent === "outofdomain"){
      aiMsg.trace = { state: "routed" };
      aiMsg.text = Router.outOfDomainReply();
      repaintTrace();
      finish(aiMsg, c);
      return;
    }

    /* ---- retrieval: the company's own knowledge ---- */
    let found;
    try{
      found = Retrieval.search(text, { role: currentRole(), topK: Config.retrieval.topK, convoId: c.id });
    }catch(err){
      found = { sources: [], blocked: [], stats: { scanned: 0, docs: Config.kb.length, matched: 0, ms: 0, terms: [] } };
    }
    aiMsg.sources = found.sources;
    aiMsg.trace = { state: "done", stats: found.stats, blockedCount: found.blocked.length,
                    blockedWhy: blockedSummary(found.blocked) };
    /* stashed for finish(), which records the whole exchange in one place */
    aiMsg.withheld = found.blocked;
    found.blocked.forEach(function(b){
      Analytics.track("refused", { id: (b.doc || {}).id, reason: (b.reason || {}).kind });
    });

    /* ---- the drawing, if this question has one ----
       Deterministic and before the model runs. Lending reads workings,
       plan views and trigger bands rather than paragraphs, and that has
       to hold with no key and no network. Access control is applied
       inside pick(), because a chart of a restricted record is the
       restricted record. */
    try{
      const dg = Diagrams.pick(text, currentRole());
      if(dg){
        aiMsg.diagram = dg;
        Panel.add({ id: "dg_" + aiMsg.id, kind: "artifact",
                    title: dg.title || Diagrams.label(dg), spec: dg,
                    ts: Date.now(), msgId: aiMsg.id });
        Analytics.track("diagram", { id: dg._id || Diagrams.typeOf(dg) });
      }
    }catch(e){ /* a missing drawing must never cost the answer */ }

    repaintTrace();

    /* ---- retrieval: the open web, when the question reaches outside ----
       Failure here is never fatal. A search that times out costs the answer
       some context; an exception would cost the answer entirely. */
    const want = Web.shouldSearch(text, found.stats);
    if(want.yes){
      aiMsg.trace.state = "web";
      repaintTrace();
      try{
        const web = await Web.search(text, { signal: null });
        web.why = want.why;
        /* kept even when it returns nothing: the trace showing six sources
           tried and none answered is information, and hiding it would make
           a failed search look like a search that never ran */
        aiMsg.web = web;
      }catch(err){
        aiMsg.web = { results: [], connectors: [], ms: 0, why: want.why,
                      failed: (err && err.message) || String(err) };
      }
      aiMsg.trace.state = "done";
      repaintTrace();
    }

    /* ---- provider ---- */
    if(!Keys.get(S.provider)){
      const prov = currentProvider();
      aiMsg.streaming = false;
      aiMsg.error = {
        title: "No API key for " + prov.name,
        detail: "Open the model picker in the header and set a key for " + prov.name +
                ", or switch to a provider you already have a key for. Keys are stored only in this browser.",
        settings: true,
      };
      finish(aiMsg, c);
      return;
    }

    const controller = new AbortController();
    S.abort = controller;

    const messages = buildRequestMessages(c, aiMsg, found, aiMsg.web);
    let raw = "";

    try{
      await LLM.stream(messages, {
        signal: controller.signal,
        maxTokens: S.answerStyle === "thorough" ? 4200 : 3000,
        onDelta: function(cumulative){
          raw = cumulative;
          scheduleRender(aiMsg, raw);
        },
      });
      applyRaw(aiMsg, raw, true);
    }catch(err){
      if(err && err.name === "AbortError"){
        applyRaw(aiMsg, raw, true);
        aiMsg.stopped = true;
      }else{
        aiMsg.error = {
          title: err && err.code === "network" ? "Could not reach the assistant" : "The assistant could not answer",
          detail: (err && err.message) || String(err),
          settings: !!(err && (err.status === 401 || err.status === 403 || err.status === 404)),
        };
      }
    }

    finish(aiMsg, c);
  }

  function finish(aiMsg, c){
    /* One exchange, recorded once. Every path through send() ends here:
       a knowledge answer, a routed reply, a productivity answer and an
       error alike, so nothing can be answered without being recorded. */
    try{
      if(!aiMsg.logged){
        aiMsg.logged = true;
        let asked = "";
        for(let i = c.messages.length - 1; i >= 0; i--){
          if(c.messages[i] === aiMsg) continue;
          if(c.messages[i].role === "user"){ asked = c.messages[i].text || ""; break; }
        }
        Analytics.turn(asked, aiMsg, {
          role: (currentRole() || {}).title || "",
          withheld: aiMsg.withheld || [],
          ms: Date.now() - (aiMsg.ts || Date.now()),
          model: (typeof S !== "undefined" && S.model) || "",
        });
      }
    }catch(e){ /* recording must never break an answer */ }

    aiMsg.streaming = false;
    S.abort = null;
    setStreaming(false);
    if(pendingFrame){ cancelAnimationFrame(pendingFrame); pendingFrame = null; }
    paintAssistant(aiMsg, true);
    c.updated = Date.now();
    Sidebar.persist();
    Sidebar.render();
    updateThreadTitle();
    scrollToEnd();
  }

  /* Throttle DOM writes to one per frame during streaming.
     The frame reads the newest accumulated text rather than whatever was
     current when it was scheduled: frames are dropped while one is pending,
     and in a backgrounded tab rAF stops entirely, so capturing the value at
     schedule time would paint a stale chunk on resume. */
  function scheduleRender(m, raw){
    m.pendingRaw = raw;
    if(pendingFrame) return;
    pendingFrame = requestAnimationFrame(function(){
      pendingFrame = null;
      applyRaw(m, m.pendingRaw, false);
      scrollToEnd();
    });
  }

  function applyRaw(m, raw, done){
    const parts = LLM.split(raw);
    m.text = parts.visible.replace(/\s+$/, done ? "" : "");
    m.raw = raw;

    if(parts.started && !m.artifactId && parts.blocks.artifact !== undefined){
      m.artifactId = "a_" + m.id;
      Panel.startBuilding(m.artifactId, "Preparing visual");
      const artEl = el("art_" + m.id);
      if(artEl){ artEl.innerHTML = artifactRefMarkup(m); Icons.hydrate(artEl); }
    }

    if(done){
      m.followups = LLM.parseFollowups(parts.blocks.next);

      if(parts.blocks.artifact !== undefined){
        const spec = LLM.parseArtifact(parts.blocks.artifact);
        if(spec && Artifacts.typeOf(spec)){
          m.artifactId = m.artifactId || ("a_" + m.id);
          m.artifact = spec;
          const rec = Panel.add({
            id: m.artifactId, kind: "artifact", title: spec.title || Artifacts.label(spec),
            spec: spec, ts: Date.now(), msgId: m.id,
          });
          if(Artifacts.typeOf(spec) === "image") Panel.generateImage(rec);
          if(S.autoPanel) Panel.open();
        }else{
          /* the block was malformed — drop it rather than show a broken panel */
          if(m.artifactId) Panel.cancelBuilding(m.artifactId);
          m.artifactId = null;
        }
      }else if(m.artifactId){
        Panel.cancelBuilding(m.artifactId);
        m.artifactId = null;
      }
    }

    paintAssistant(m, done);
  }

  function buildRequestMessages(c, aiMsg, found, web){
    const attached = Attachments.forConvo(c.id)
      .filter(function(a){ return a.state === "ready"; })
      .map(function(a){ return { title: a.name, label: FileParse.label(a.kind), pages: a.pages }; });

    const sys = LLM.systemPrompt({
      role: currentRole(),
      user: S.user,
      sources: found.sources,
      blocked: found.blocked,
      web: web || null,
      attached: attached,
      style: S.answerStyle,
      images: S.images,
      /* the domain drawings the model may ask for. Empty in an edition
         that has none, so the prompt never advertises what cannot be
         rendered. A drawing was very likely already attached above
         without the model's help; this is the second path, not the
         first. */
      diagrams: (typeof Diagrams !== "undefined" && !aiMsg.diagram) ? Diagrams.SCHEMA : "",
    });

    const history = [];
    const prior = c.messages.filter(function(m){ return m !== aiMsg && !m.error && (m.text || "").trim(); });
    prior.slice(-9).forEach(function(m){
      history.push({ role: m.role === "user" ? "user" : "assistant", content: String(m.text).slice(0, 4000) });
    });

    /* A productivity answer has no sources by definition, and the base
       prompt is written for an assistant that answers from documents. The
       directive relaxes that one rule and, more importantly, forbids the
       answer from pretending it has a document behind it. */
    const extra = (aiMsg.decision && aiMsg.decision.intent === "productivity")
      ? [{ role: "system", content: Router.productivityDirective() }] : [];

    return [{ role: "system", content: sys }].concat(extra, history);
  }

  function setStreaming(on){
    S.streaming = on;
    const btn = el("sendBtn"), composer = el("composer"), input = el("composerIn");
    if(!btn) return;
    btn.classList.toggle("stop", on);
    btn.innerHTML = Icons.svg(on ? "stop" : "arrowup");
    btn.disabled = on ? false : !(input && input.value.trim());
    btn.setAttribute("aria-label", on ? "Stop" : "Send");
    if(composer) composer.classList.toggle("busy", on);
  }

  function stop(){
    if(S.abort){ try{ S.abort.abort(); }catch(e){} }
  }

  /* ---------------- message actions ---------------- */
  function copy(id){
    const m = findMessage(id);
    if(!m) return;
    let out = m.text;
    if(m.role === "assistant"){
      if(m.sources && m.sources.length){
        out += "\n\nSources\n" + m.sources.map(function(s){
          return "[S" + s.n + "] " + s.id + " — " + s.title + (s.updated ? " (updated " + s.updated + ")" : "");
        }).join("\n");
      }
      if(m.diagram) out += "\n\n---\n" + Diagrams.toText(m.diagram);
      if(m.artifact) out += "\n\n---\n" + Artifacts.toText(m.artifact);
    }
    copyText(out, "Message");
  }
  function rate(id, value){
    const m = findMessage(id);
    if(!m) return;
    m.rating = m.rating === value ? 0 : value;
    paintAssistant(m, true);
    Sidebar.persist();
    if(m.rating === 1) toast("Marked as helpful", "ok");
    else if(m.rating === -1) toast("Marked as not helpful. In production this feeds the retrieval tuning queue.", "info", 4200);
  }
  function speak(id){
    const m = findMessage(id);
    if(!m) return;
    if(!("speechSynthesis" in window)){ toast("This browser cannot read text aloud", "warn"); return; }
    if(speechSynthesis.speaking){ speechSynthesis.cancel(); return; }
    const u = new SpeechSynthesisUtterance(MD.strip(m.text).slice(0, 4000));
    u.rate = 1.02;
    speechSynthesis.speak(u);
  }
  function regenerate(id){
    const c = conversation();
    if(!c || S.streaming) return;
    const at = c.messages.findIndex(function(m){ return m.id === id; });
    if(at < 1) return;
    const question = c.messages[at - 1];
    if(!question || question.role !== "user") return;
    c.messages.splice(at - 1);
    renderConversation();
    send(question.text);
  }
  function editUser(id){
    const m = findMessage(id);
    const c = conversation();
    if(!m || !c || S.streaming) return;
    const at = c.messages.findIndex(function(x){ return x.id === id; });
    prefill(m.text);
    c.messages.splice(at);
    renderConversation();
  }

  /* ---------------- voice ---------------- */
  function voice(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){ toast("Voice input is not available in this browser", "warn"); return; }
    const btn = el("micBtn");
    if(Chat._rec){ Chat._rec.stop(); return; }
    const rec = new SR();
    Chat._rec = rec;
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    btn.classList.add("on");
    let finalText = "";
    rec.onresult = function(e){
      let interim = "";
      for(let i = e.resultIndex; i < e.results.length; i++){
        if(e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      prefill((finalText + interim).trim());
    };
    rec.onerror = function(e){
      toast(e.error === "not-allowed" ? "Microphone permission denied" : "Voice input failed", "warn");
    };
    rec.onend = function(){ btn.classList.remove("on"); Chat._rec = null; };
    try{ rec.start(); }catch(e){ btn.classList.remove("on"); Chat._rec = null; }
  }

  /* ---------------- lifecycle ---------------- */
  function newChat(){
    if(S.streaming) stop();
    S.currentId = null;
    Panel.reset();
    renderConversation();
    Sidebar.render();
    Attachments.render();
    const input = el("composerIn");
    if(input){ input.value = ""; autogrow(input); input.focus(); }
  }

  function load(id){
    if(S.streaming) stop();
    S.currentId = id;
    renderConversation();
    Sidebar.render();
    Attachments.render();
    /* re-register artifacts from the stored messages so the panel works after a reload */
    const c = conversation();
    if(c){
      c.messages.forEach(function(m){
        if(m.artifact && m.artifactId){
          Panel.add({ id: m.artifactId, kind: "artifact", title: m.artifact.title || Artifacts.label(m.artifact),
                      spec: m.artifact, ts: m.ts, msgId: m.id });
        }
      });
      if(S.artifacts.length){ S.artifactIdx = S.artifacts.length - 1; Panel.paint(); }
      c.messages.forEach(function(m){ if(m.role === "assistant") paintAssistant(m, true); });
    }
  }

  function init(){
    initScroll();
    setStreaming(false);
    renderConversation();
    Attachments.render();
    Web.syncButton();
  }

  return {
    init: init, newChat: newChat, load: load,
    submit: submit, send: send, ask: ask, prefill: prefill, stop: stop,
    autogrow: autogrow, onKey: onKey, voice: voice,
    copy: copy, rate: rate, speak: speak, regenerate: regenerate, editUser: editUser,
    toggleTemporary: toggleTemporary,
    renderConversation: renderConversation, updateThreadTitle: updateThreadTitle,
    scrollToEnd: scrollToEnd,
    conversation: conversation, findMessage: findMessage,
    beginJourney: beginJourney, completeJourney: completeJourney,
  };
})();
