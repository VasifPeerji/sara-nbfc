/* ==================================================================
   47-analytics.js
   Who opened the demo, and what they actually asked it.
   ------------------------------------------------------------------
   A handover copy goes out on a link and then disappears. This records
   what happened to it and, when configured to, posts it back:

     visit      a browser opened the file: when, from where, on what
     identify   who they said they were, if the link asks
     signin     which demo profile they chose
     turn       ONE COMPLETE EXCHANGE: what they typed, what Sara
                answered, which intent it routed to, which documents
                were cited, which were withheld, and how long it took
     task /     guided tasks and Operator runs started and finished,
     operator   including which field the Operator had to stop and ask for
     refused    a document the access model withheld, and why

   HOW IT GETS BACK. Batches are POSTed to `analytics.endpoint`. There is
   no default endpoint and no bundled key, so a build with that field
   empty makes no network call at all. Delivery is best-effort but not
   lossy: anything that fails to send stays in an outbox in the browser
   and goes with the next batch, including on the next visit days later.
   Every event carries a unique id so the collector can drop duplicates.

   CAPTURE LEVELS, set as `analytics.level`:

     "off"     nothing is recorded
     "counts"  shapes and timings only. No ids, no text
     "detail"  plus which document, task, run and refusal. All of that
               is our own content, not anything they typed
     "full"    plus the verbatim question AND Sara's answer, which is
               what makes the transcript reviewable

   `full` is the setting for a hosted prospect link, and it is the one
   to be deliberate about. It captures a real conversation. Whatever is
   chosen, the sign-in screen says so in its own legal line, generated
   from this configuration rather than written by hand, so the promise
   on screen cannot drift away from what the code does.
   ================================================================== */

const Analytics = (function () {

  const LEVELS = ["off", "counts", "detail", "full"];
  const KEY = "usage";
  const OUTBOX = "usage_outbox";
  const MAX_EVENTS = 4000;       /* what the Usage panel reads back */
  const MAX_OUTBOX = 600;        /* what is still waiting to be sent */
  const BATCH = 20;              /* send once this many are waiting */
  const EVERY_MS = 30000;        /* and at least this often */
  const MAX_TEXT = 4000;         /* per answer, so one long reply cannot fill storage */

  let mem = null;
  let out = null;
  let seq = 0;
  let started = 0;
  let sessionId = "";
  let sending = false;
  let noCors = false;            /* set once a CORS attempt has failed */
  let timer = null;

  /** Where batches go.

      A relative value is resolved against the page, so putting
      collect.php next to sara_cesi.html is the whole configuration:
      nobody has to know the final URL at build time, and moving the
      demo to another host moves the collector with it.

      A file:// copy sends nothing. An emailed build has no collector
      beside it, and firing failed requests at a path that cannot exist
      is noise rather than resilience. */
  function resolveEndpoint(raw) {
    const e = String(raw || "");
    if (!e) return "";
    try {
      if (typeof location !== "undefined" && location.protocol === "file:") return "";
      if (/^https?:\/\//i.test(e)) return e;
      if (typeof location === "undefined") return e;
      return new URL(e, location.href).href;
    } catch (err) { return e; }
  }

  function cfg() {
    const a = (typeof Config !== "undefined" && Config.analytics) || {};
    return {
      level: LEVELS.indexOf(a.level) === -1 ? "detail" : a.level,
      endpoint: resolveEndpoint(a.endpoint),
      identify: ["off", "optional", "required"].indexOf(a.identify) === -1 ? "off" : a.identify,
      label: a.label || "",
      disclose: a.disclose === true,
      note: a.note || "",
      org: a.org || "",
      /* Who the build is for. Only "sector" means anything; everything
         else, including nothing, keeps the per-prospect wording. The
         whitelist here is the reason a new field has to be added in two
         places: cfg() is what the rest of the module reads, and a key
         that is not in it silently does not exist. */
      audience: a.audience === "sector" ? "sector" : "",
      sectorLabel: a.sectorLabel || "",
    };
  }
  function rank() { return LEVELS.indexOf(cfg().level); }
  function on() { return rank() > 0; }
  function atLeast(l) { return rank() >= LEVELS.indexOf(l); }

  function rid(n) {
    let s = "";
    while (s.length < (n || 10)) s += Math.random().toString(36).slice(2);
    return s.slice(0, n || 10);
  }

  /* ---------------- what is remembered ---------------- */

  function load() {
    if (mem) return mem;
    const saved = Store.get(KEY, null);
    mem = (saved && Array.isArray(saved.events)) ? saved : {
      id: "v_" + rid(12),
      first: Date.now(),
      sessions: 0,
      who: null,          /* filled by identify() */
      events: [],
    };
    return mem;
  }
  function outbox() {
    if (out) return out;
    out = Store.get(OUTBOX, null) || [];
    if (!Array.isArray(out)) out = [];
    return out;
  }
  function save() {
    if (mem) {
      if (mem.events.length > MAX_EVENTS) mem.events = mem.events.slice(-MAX_EVENTS);
      Store.set(KEY, mem);
    }
    if (out) {
      if (out.length > MAX_OUTBOX) out = out.slice(-MAX_OUTBOX);
      Store.set(OUTBOX, out);
    }
  }

  /** What the browser can say about itself. No fingerprinting beyond
      what any web server already sees in a request. */
  function env() {
    const e = {};
    try {
      e.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      e.lang = navigator.language || "";
      e.screen = (screen.width || 0) + "x" + (screen.height || 0);
      e.ua = String(navigator.userAgent || "").slice(0, 200);
      e.ref = String(document.referrer || "").slice(0, 200);
      e.href = String(location.href).split("?")[0].slice(0, 200);
    } catch (err) { /* a stubbed environment, in tests */ }
    return e;
  }

  /* ---------------- recording ---------------- */

  /** Record one event.

      Fields are dropped here, by level, rather than at the call sites.
      A new call site therefore cannot leak something the level forbids
      by forgetting to check, which is the only way this stays honest as
      the product grows. */
  function track(kind, d) {
    if (!on()) return null;
    const data = d || {};
    const m = load();
    const e = {
      id: m.id + "-" + (++seq) + "-" + Date.now().toString(36),
      s: sessionId,
      at: Date.now(),
      t: Date.now() - (started || Date.now()),
      k: kind,
    };

    /* counts and above: shape, timing, and who was signed in */
    if (typeof data.ms === "number") e.ms = Math.round(data.ms);
    if (typeof data.n === "number") e.n = data.n;
    if (typeof data.sources === "number") e.src = data.sources;
    if (typeof data.blocked === "number") e.blk = data.blocked;
    if (typeof data.chars === "number") e.ch = data.chars;
    if (data.intent) e.i = data.intent;
    if (data.routedBy) e.rb = data.routedBy;
    if (data.ev) e.e = data.ev;
    if (data.role) e.r = data.role;
    if (data.model) e.mdl = data.model;
    /* A gate bypass is a governance signal about the session, not
       information about the person, so it is carried at every level
       including counts. */
    if (data.tamper && data.tamper.length) e.tamper = data.tamper.slice(0, 6);

    /* detail and above: our own identifiers */
    if (atLeast("detail")) {
      if (data.id) e.did = data.id;
      if (data.target) e.tg = data.target;
      if (data.reason) e.why = data.reason;
      if (data.field) e.f = data.field;
      if (data.cited && data.cited.length) e.cite = data.cited.slice(0, 12);
      if (data.withheld && data.withheld.length) e.blkd = data.withheld.slice(0, 12);
    }

    /* full: the conversation, and what was put into and taken out of a
       guided task or an Operator run. Those are the person's own words
       and figures, so they sit at the same level as the conversation. */
    if (atLeast("full")) {
      if (data.text) e.q = String(data.text).slice(0, MAX_TEXT);
      if (data.answer) e.a = String(data.answer).slice(0, MAX_TEXT);
      if (data.env) e.env = data.env;
      if (data.who) e.who = data.who;
      if (data.inputs) e.in = trim(data.inputs);
      if (data.output) e.out = String(data.output).slice(0, MAX_TEXT);
      if (data.title) e.ttl = String(data.title).slice(0, 200);
    }

    m.events.push(e);
    if (cfg().endpoint) outbox().push(e);
    save();

    if (cfg().endpoint && outbox().length >= BATCH) flush();
    return e;
  }

  /** Values a person typed into a task or a run, kept readable and
      bounded. A textarea can hold a great deal. */
  function trim(obj) {
    const out = {};
    Object.keys(obj || {}).slice(0, 40).forEach(function (k) {
      const v = obj[k];
      out[k] = Array.isArray(v) ? v.join(", ")
             : (v === true ? "Yes" : v === false ? "No"
             : String(v === undefined || v === null ? "" : v).slice(0, 600));
    });
    return out;
  }

  /** One complete exchange. The single most useful thing in here. */
  function turn(userText, aiMsg, extra) {
    if (!on()) return;
    const x = extra || {};
    const dec = (aiMsg && aiMsg.decision) || {};
    const cited = ((aiMsg && aiMsg.sources) || []).map(s => s.id).filter(Boolean);
    const blkd = (x.withheld || []).map(b => (b.doc || {}).id).filter(Boolean);
    track("turn", {
      role: x.role || "",
      intent: dec.intent || x.intent || "knowledge",
      target: dec.target || "",
      routedBy: dec.source || "",
      sources: cited.length,
      blocked: blkd.length,
      cited: cited,
      withheld: blkd,
      ms: x.ms || 0,
      chars: (userText || "").length,
      model: x.model || "",
      text: userText || "",
      answer: (aiMsg && aiMsg.text) || "",
    });
  }

  /* ---------------- who is looking ---------------- */

  function who() { return load().who; }

  /** Is the app waiting on an identity it has been told to insist on?

      Everything downstream keys off this one predicate: the gate, the
      app's own visibility, whether sign-in is permitted, whether an
      event is recorded, and whether anything is sent. */
  function blocked() {
    const c = cfg();
    if (!on()) return false;
    return c.identify === "required" && !who();
  }

  /** Record that somebody went round the gate rather than through it.

      This cannot prevent a determined person with developer tools from
      tampering with a static file — nothing client-side can. What it can
      do is make the attempt visible, so a bypassed session is reported
      as a bypass rather than sitting in the report looking like an
      ordinary anonymous visitor. */
  function noteTamper(what) {
    const m = load();
    m.tamper = (m.tamper || []);
    if (m.tamper.indexOf(what) === -1) m.tamper.push(what);
    save();
  }

  function identify(name, company, email) {
    const m = load();
    m.who = {
      name: String(name || "").slice(0, 80),
      company: String(company || "").slice(0, 80),
      email: String(email || "").slice(0, 120),
      at: Date.now(),
    };
    save();
    closeGate();
    /* the visit event has been held back until now, so that it carries
       the identity rather than arriving anonymously ahead of it */
    openSession();
    track("identify", { who: m.who });
    flush();
  }
  function skipIdentify() {
    const m = load();
    m.who = { skipped: true, at: Date.now() };
    save();
    closeGate();
    openSession();
    track("identify", { who: m.who });
  }

  function closeGate() {
    if (gateWatch) { try { gateWatch.disconnect(); } catch (e) {} gateWatch = null; }
    if (gateTimer) { clearInterval(gateTimer); gateTimer = null; }
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.classList.remove("an-gated");
    }
    const g = document.getElementById("anGate");
    if (g && g.parentNode) g.parentNode.removeChild(g);
  }

  /** The card that asks who is looking, once per browser, before the
      sign-in screen.

      No Skip. A skippable card is a card almost everyone skips, and a
      demonstration prepared for one named organisation with a
      restricted link has a legitimate reason to know who opened it.
      The copy says exactly that, because a person who understands why
      they are being asked gives a real answer, and a person who does
      not types "asdf". */
  function gate() {
    const c = cfg();
    if (c.identify === "off" || who()) return;
    if (typeof document === "undefined" || !document.body) return;
    if (document.getElementById("anGate")) return;

    /* The application is hidden and inert behind this, rather than
       merely covered by it. A person who removes the overlay is left
       looking at nothing, and cannot sign in either. */
    document.documentElement.classList.add("an-gated");
    const org = c.org || (Config.product && Config.product.vendor) || "";
    const wrap = document.createElement("div");
    wrap.id = "anGate";
    wrap.className = "an-gate";
    /* Who this build is actually for.

       A build made for one named prospect says so, and should: it is
       true, and it is what explains why the link is not to be passed
       on. A whole-sector build must not. Its tenant is invented, so
       naming it here would not merely be vague, it would be wrong, and
       telling a reader the demonstration was prepared for a company
       they have never heard of makes it look like somebody else's,
       forwarded to them.

       One flag, because it is one decision: it changes the sentence and
       the placeholders together. Anything other than "sector", including
       nothing at all, keeps the per-prospect wording. */
    const sector = c.audience === "sector";
    const intro = sector
      ? "This is a demonstration of " + esc(Config.product.name) +
        (org ? " by " + esc(org) : "") + ", built for the " +
        esc(c.sectorLabel || Config.company.industry || "sector") +
        " rather than for any one company. The link is shared with named people only. " +
        "Confirming your details lets us verify that access is genuine and makes sure any " +
        "follow-up reaches the right person."
      : "This demonstration of " + esc(Config.product.name) +
        " was prepared specifically for " + esc(Config.company.name) +
        (org ? " by " + esc(org) : "") + ", and the link is shared with named people only. " +
        "Confirming your details lets us verify that access is genuine and makes sure any " +
        "follow-up reaches the right person.";

    wrap.innerHTML =
      '<div class="an-gate__card">' +
        '<div class="an-gate__h">Please confirm who you are</div>' +
        '<p class="an-gate__p">' + intro + "</p>" +
        '<p class="an-gate__p an-gate__p--em">Please use your real work details. ' +
          "Nothing here is published or shared outside the project team.</p>" +
        '<label class="an-gate__l">Full name<input id="anGateName" autocomplete="name" placeholder="e.g. ' +
          /* a name out of this edition's own demo cast, so the example
             does not belong to the last prospect this was built for */
          esc((((Config.users || [])[0]) || {}).name || "Alex Morgan") + '"></label>' +
        /* In a sector build the tenant is invented, so offering its name
           as the example organisation invites the reader to think we
           believe they work there. */
        '<label class="an-gate__l">Organisation<input id="anGateOrg" autocomplete="organization" placeholder="e.g. ' +
          esc(sector ? "your organisation" : Config.company.name) + '"></label>' +
        '<label class="an-gate__l">Work email<input id="anGateMail" type="email" autocomplete="email" placeholder="' +
          esc(sector ? "name@yourcompany.com" : "name@" + (Config.company.domain || "company.com")) + '"></label>' +
        '<div class="an-gate__err" id="anGateErr"></div>' +
        '<div class="an-gate__acts">' +
          '<button class="btn btn-primary" id="anGateGo">Continue to the demonstration</button>' +
        "</div>" +
        (disclosure() ? '<p class="an-gate__n">' + esc(disclosure()) + "</p>" : "") +
      "</div>";
    document.body.appendChild(wrap);

    /* Put it back if it is taken away, and notice that it happened. */
    if (typeof MutationObserver === "function") {
      gateWatch = new MutationObserver(function () {
        if (!blocked()) return;
        if (!document.getElementById("anGate")) { noteTamper("gate-removed"); gate(); }
      });
      gateWatch.observe(document.body, { childList: true });
    }
    gateTimer = setInterval(function () {
      if (!blocked()) return;
      const el = document.getElementById("anGate");
      if (!el) { noteTamper("gate-removed"); gate(); return; }
      if (!document.documentElement.classList.contains("an-gated")) {
        noteTamper("gate-unhidden");
        document.documentElement.classList.add("an-gated");
      }
      /* the card itself styled out of existence */
      if (typeof getComputedStyle === "function") {
        const vis = getComputedStyle(el);
        if (vis.display === "none" || vis.visibility === "hidden" || Number(vis.opacity) < 0.2) {
          noteTamper("gate-hidden");
          el.style.setProperty("display", "flex", "important");
          el.style.setProperty("visibility", "visible", "important");
          el.style.setProperty("opacity", "1", "important");
        }
      }
    }, 700);
    if (gateTimer && typeof gateTimer.unref === "function") gateTimer.unref();

    const err = function (msg, focus) {
      const e = document.getElementById("anGateErr");
      if (e) e.textContent = msg;
      const f = document.getElementById(focus);
      if (f) f.focus();
    };
    const go = document.getElementById("anGateGo");
    /* A harness with a minimal document stub gets this far and finds no
       controls. The gate must never throw: a thrown error here would
       take the whole boot down and, worse, leave the app visible with
       the gate half-built. */
    if (!go) return;
    go.onclick = function () {
      const n = (document.getElementById("anGateName").value || "").trim();
      const o = (document.getElementById("anGateOrg").value || "").trim();
      const m = (document.getElementById("anGateMail").value || "").trim();

      /* Enough of a check to catch a keyboard mash, not enough to argue
         with anyone whose name is genuinely short. */
      if (n.length < 3 || n.indexOf(" ") === -1) {
        return err("Please enter your full name.", "anGateName");
      }
      if (!o) return err("Please enter your organisation.", "anGateOrg");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(m)) {
        return err("Please enter a valid work email address.", "anGateMail");
      }
      identify(n, o, m);
    };
    ["anGateName", "anGateOrg", "anGateMail"].forEach(function (id) {
      const f = document.getElementById(id);
      if (!f) return;
      f.addEventListener("keydown", function (e) { if (e.key === "Enter") go.click(); });
      f.addEventListener("input", function () {
        const box = document.getElementById("anGateErr");
        if (box) box.textContent = "";
      });
    });
    setTimeout(function () {
      const f = document.getElementById("anGateName");
      if (f) f.focus();
    }, 60);
  }

  /* ---------------- what the sign-in screen must say ----------------
     Generated from the configuration rather than written by hand, so
     the promise on the screen cannot drift away from the behaviour. */
  function disclosure() {
    const c = cfg();
    const org = c.org || (Config.product && Config.product.vendor) || "the vendor";
    /* Off by default. The sign-in screen keeps whatever the edition
       wrote, and the covering conversation does the rest. Set
       `analytics.disclose: true` to have this generated instead, which
       is what you want on a link that will reach people who were not
       on the call. */
    if (!c.disclose) return "";
    if (c.level === "off") return "";
    if (!c.endpoint) {
      return "Usage is recorded in this browser only so you can see how the demo was used. " +
        "Nothing is sent anywhere. You can view or clear it under Settings, Usage.";
    }
    if (c.level === "full") {
      return "This is a hosted demonstration. Conversations with " + Config.product.name +
        ", including what you type and what it answers, are recorded and shared with " + org +
        " so the demonstration can be reviewed and followed up. Do not enter confidential or " +
        "personal information.";
    }
    return "This is a hosted demonstration. How the demo is used is recorded and shared with " +
      org + ". What you type is not recorded.";
  }

  /* ---------------- boot ---------------- */

  let sessionOpen = false, gateWatch = null, gateTimer = null;

  function begin() {
    if (!on()) return;
    started = Date.now();
    sessionId = "s_" + rid(10);
    const m = load();
    m.sessions = (m.sessions || 0) + 1;
    m.last = started;
    save();

    /* Nothing is recorded and nothing leaves the browser until we know
       who is looking. The visit event used to be tracked right here,
       which is why somebody who opened the link and never completed the
       card still appeared in the report as an unidentified visitor with
       a role and no messages. */
    if (blocked()) { gate(); return; }
    openSession();
  }

  /** The session proper: only reached once identity is settled. */
  function openSession() {
    if (sessionOpen) return;
    sessionOpen = true;
    const m = load();
    track("visit", {
      n: m.sessions, env: env(),
      who: m.who || undefined,
      tamper: m.tamper && m.tamper.length ? m.tamper.slice(0, 6) : undefined,
    });

    if (cfg().endpoint) {
      flush();                                   /* anything left from last time */
      timer = setInterval(function () { flush(); }, EVERY_MS);
      /* a browser wants this timer; a headless harness must not be held
         open by it, so release it where the runtime allows */
      if (timer && typeof timer.unref === "function") timer.unref();
      if (typeof window !== "undefined" && window.addEventListener) {
        window.addEventListener("pagehide", function () { flush(true); });
        window.addEventListener("beforeunload", function () { flush(true); });
        document.addEventListener("visibilitychange", function () {
          if (document.visibilityState === "hidden") flush(true);
        });
      }
    }
  }

  /* ---------------- delivery ----------------
     Optimistic: the outbox is cleared when a send is dispatched, and
     restored if it demonstrably failed. Every event carries a unique id
     so a duplicate arriving after a retry is the collector's problem to
     drop, not a reason to lose data here. */
  function payload(events) {
    const m = load();
    return JSON.stringify({
      v: 1,
      app: (Config.product && Config.product.name) || "SARA",
      edition: Config.slug,
      /* which demo this is, so one collector can serve every prospect */
      label: cfg().label || Config.slug,
      level: cfg().level,
      sent: Date.now(),
      visitor: {
        id: m.id, first: m.first, sessions: m.sessions,
        who: atLeast("full") ? (m.who || null) : null,
        /* so the collector can mark the whole batch, not just one event */
        tamper: (m.tamper && m.tamper.length) ? m.tamper.slice(0, 6) : undefined,
      },
      session: { id: sessionId, started: started },
      events: events,
    });
  }

  function flush(unloading) {
    const c = cfg();
    if (!c.endpoint || sending) return;
    /* an identity we insisted on has to arrive with the data, not after
       it, so the outbox waits rather than sending anonymously */
    if (blocked()) return;
    const box = outbox();
    if (!box.length) return;

    const batch = box.slice(0, BATCH * 5);
    const body = payload(batch);
    const keep = box.slice(batch.length);

    /* clear first: a send that never resolves must not pin the outbox */
    out = keep; save();

    if (unloading && typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        /* text/plain avoids a CORS preflight, which a simple collector
           will not be answering during a page unload */
        navigator.sendBeacon(c.endpoint, new Blob([body], { type: "text/plain;charset=UTF-8" }));
        return;
      } catch (e) { /* fall through */ }
    }

    sending = true;
    const opts = {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: body,
    };
    if (noCors) opts.mode = "no-cors";

    try {
      fetch(c.endpoint, opts).then(function (r) {
        sending = false;
        /* an opaque response cannot be inspected; treat it as delivered */
        if (r && r.type !== "opaque" && r.ok === false) restore(batch);
      }).catch(function () {
        sending = false;
        /* the usual cause is a collector without CORS headers: retry the
           rest of this session without them rather than losing it all */
        if (!noCors) { noCors = true; restore(batch); flush(); return; }
        restore(batch);
      });
    } catch (e) {
      sending = false;
      restore(batch);
    }
  }
  function restore(batch) {
    out = batch.concat(outbox());
    save();
  }

  /* ---------------- reading it back ---------------- */

  function summary() {
    const m = load();
    const ev = m.events;
    const count = k => ev.filter(e => e.k === k).length;
    const tally = (k, f) => {
      const o = {};
      ev.filter(e => e.k === k).forEach(e => { const v = e[f]; if (v) o[v] = (o[v] || 0) + 1; });
      return Object.keys(o).map(x => ({ k: x, n: o[x] })).sort((a, b) => b.n - a.n);
    };
    const turns = ev.filter(e => e.k === "turn");
    const times = turns.map(e => e.ms).filter(x => typeof x === "number" && x > 0);
    const citedAll = {};
    turns.forEach(e => (e.cite || []).forEach(id => { citedAll[id] = (citedAll[id] || 0) + 1; }));
    return {
      installation: m.id,
      who: m.who,
      sessions: m.sessions || 0,
      first: m.first, last: m.last,
      events: ev.length,
      pending: outbox().length,
      questions: turns.length,
      messages: turns.length * 2,
      medianMs: times.length ? times.slice().sort((a, b) => a - b)[Math.floor(times.length / 2)] : 0,
      withheld: turns.reduce((s, e) => s + (e.blk || 0), 0),
      refusals: count("refused"),
      intents: tally("turn", "i"),
      routedBy: tally("turn", "rb"),
      /* How much of the routing needed no model at all. It is the
         product's own claim, so it is a measured number rather than a
         sentence in a deck, and it is the first thing anyone asks. */
      ruleRouted: turns.filter(e => e.rb === "rules").length,
      roles: tally("signin", "r"),
      docs: Object.keys(citedAll).map(k => ({ k: k, n: citedAll[k] })).sort((a, b) => b.n - a.n),
      opened: tally("doc", "did"),
      tasks: tally("task", "did"),
      runs: tally("operator", "did"),
      askedFor: tally("operator", "f"),
      tasksDone: ev.filter(e => e.k === "task" && e.e === "done").length,
      runsDone: ev.filter(e => e.k === "operator" && e.e === "done").length,
      controls: ev.filter(e => e.k === "operator" && e.e === "control").length,
    };
  }

  /** The conversation, grouped by session, for reading. */
  function transcript() {
    if (!atLeast("full")) return [];
    const byS = {};
    load().events.forEach(function (e) {
      if (e.k !== "turn") return;
      const k = e.s || "session";
      (byS[k] = byS[k] || []).push(e);
    });
    return Object.keys(byS).map(k => ({ session: k, turns: byS[k] }));
  }

  function toJson() {
    return JSON.stringify({
      meta: { app: Config.product.name, edition: Config.slug, level: cfg().level,
              exported: new Date().toISOString() },
      visitor: { id: load().id, who: load().who, sessions: load().sessions },
      summary: summary(), events: load().events }, null, 2);
  }

  function toCsv() {
    const rows = [["at", "session", "kind", "role", "intent", "target", "routed by", "id", "event",
                   "sources", "withheld", "ms", "question", "answer"]];
    load().events.forEach(e => rows.push([
      e.at ? new Date(e.at).toISOString() : "", e.s || "", e.k || "", e.r || "", e.i || "",
      e.tg || "", e.rb || "", e.did || "", e.e || "",
      e.src === undefined ? "" : e.src, e.blk === undefined ? "" : e.blk,
      e.ms === undefined ? "" : e.ms,
      (e.q || "").replace(/"/g, '""'), (e.a || "").replace(/"/g, '""'),
    ]));
    return rows.map(r => r.map(c => /[",\n\r]/.test(String(c)) ? '"' + c + '"' : c).join(",")).join("\n");
  }

  function download(name, text, mime) {
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: mime || "text/plain" }));
      a.download = name;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    } catch (e) { toast("Could not save the file", "err"); }
  }
  function exportJson() { download(Config.slug + "-usage.json", toJson(), "application/json"); toast("Usage exported", "ok"); }
  function exportCsv() { download(Config.slug + "-usage.csv", toCsv(), "text/csv"); toast("Usage exported", "ok"); }

  function clear() {
    mem = { id: "v_" + rid(12), first: Date.now(), sessions: 0, who: null, events: [] };
    out = [];
    /* clearing the history clears the identity with it, so the next
       begin() has to go through the gate again rather than opening a
       session against a visitor record that no longer exists */
    sessionOpen = false;
    save();
    if (typeof toast === "function") toast("Usage history cleared", "ok");
    try {
      const ov = document.getElementById("ovSettings");
      if (ov && ov.classList.contains("show") && Settings && Settings.open) Settings.open("usage");
    } catch (e) { /* no DOM */ }
  }

  /* ---------------- the Usage panel ---------------- */

  let view = "summary";
  function setView(v) { view = v; if (Settings && Settings.open) Settings.open("usage"); }

  function bar(list, total, limit) {
    if (!list.length) return '<div class="an-empty">Nothing yet.</div>';
    return list.slice(0, limit || 6).map(function (r) {
      const pct = total ? Math.round((r.n / total) * 100) : 0;
      return '<div class="an-row"><span class="an-row__k">' + esc(r.k) + "</span>" +
        '<span class="an-row__bar"><i style="width:' + Math.max(pct, 2) + '%"></i></span>' +
        '<span class="an-row__n">' + r.n + "</span></div>";
    }).join("");
  }

  function transcriptMarkup() {
    if (!atLeast("full")) {
      return '<div class="an-empty">This build records what was used, not what was said. ' +
        "Set the capture level to full to keep the conversation.</div>";
    }
    const list = transcript();
    if (!list.length) return '<div class="an-empty">No conversation recorded yet.</div>';
    return list.slice(-6).reverse().map(function (s) {
      return '<div class="an-sess"><div class="an-sess__h">' + Icons.el("chat") +
        "Session " + esc(s.session.slice(0, 8)) + " &middot; " + s.turns.length + " exchange" +
        (s.turns.length === 1 ? "" : "s") + " &middot; " +
        esc(s.turns[0].at ? new Date(s.turns[0].at).toLocaleString() : "") + "</div>" +
        s.turns.map(function (t) {
          return '<div class="an-turn">' +
            '<div class="an-turn__q">' + esc(t.q || "") + "</div>" +
            '<div class="an-turn__meta">' + esc(t.r || "") +
              (t.i ? " &middot; " + esc(t.i) : "") +
              (t.src ? " &middot; " + t.src + " source" + (t.src === 1 ? "" : "s") : "") +
              (t.blk ? ' &middot; <b class="an-w">' + t.blk + " withheld</b>" : "") +
            "</div>" +
            '<div class="an-turn__a">' + esc(String(t.a || "").slice(0, 1200)) +
              (String(t.a || "").length > 1200 ? "…" : "") + "</div>" +
          "</div>";
        }).join("") + "</div>";
    }).join("");
  }

  function paneMarkup() {
    const c = cfg();
    if (c.level === "off") {
      return '<div class="set-sec"><div class="set-sec-t">' + Icons.el("chart") + "Usage</div>" +
        '<div class="an-empty">Usage recording is switched off for this build. ' +
        "Nothing is being recorded and nothing is being sent.</div></div>";
    }
    const s = summary();
    const when = t => t ? new Date(t).toLocaleString() : "—";
    const tabs = '<div class="an-vtabs">' +
      ['summary', 'transcript'].map(function (v) {
        return '<button class="an-vtab' + (view === v ? " on" : "") + '" onclick="Analytics.setView(\'' + v + '\')">' +
          (v === "summary" ? "Summary" : "Conversations") + "</button>";
      }).join("") + "</div>";

    if (view === "transcript") {
      return '<div class="set-sec">' + tabs + transcriptMarkup() + "</div>";
    }

    return '<div class="set-sec">' + tabs +
      '<div class="an-kpis">' +
        '<div class="an-kpi"><b>' + s.sessions + "</b><label>Sessions</label></div>" +
        '<div class="an-kpi"><b>' + s.questions + "</b><label>Exchanges</label></div>" +
        '<div class="an-kpi"><b>' + s.tasksDone + "</b><label>Tasks finished</label></div>" +
        '<div class="an-kpi"><b>' + s.runsDone + "</b><label>Runs completed</label></div>" +
        '<div class="an-kpi"><b>' + s.withheld + "</b><label>Withheld</label></div>" +
      "</div>" +
      '<div class="an-meta">Visitor <code>' + esc(s.installation) + "</code>" +
        (s.who && s.who.name ? " &middot; " + esc(s.who.name) +
          (s.who.company ? ", " + esc(s.who.company) : "") : "") +
        " &middot; first opened " + esc(when(s.first)) + " &middot; last " + esc(when(s.last)) +
        (s.pending ? ' &middot; <b class="an-w">' + s.pending + " waiting to send</b>" : "") +
      "</div>" +
    "</div>" +

    '<div class="set-sec"><div class="set-sec-t">' + Icons.el("route") + "Where the questions went</div>" +
      bar(s.intents, s.questions, 6) +
      (s.questions
        ? '<div class="an-note">' + Icons.el("zap") +
          Math.round((s.ruleRouted / s.questions) * 100) + " per cent of these were routed with no model call: " +
          s.ruleRouted + " of " + s.questions + "." +
          "</div>"
        : "") + "</div>" +

    '<div class="set-sec"><div class="set-sec-t">' + Icons.el("users") + "Profiles used</div>" +
      bar(s.roles, s.roles.reduce(function (a, b) { return a + b.n; }, 0), 8) + "</div>" +

    (atLeast("detail")
      ? '<div class="set-sec"><div class="set-sec-t">' + Icons.el("file") + "Documents Sara answered from</div>" +
          bar(s.docs, s.docs.reduce(function (a, b) { return a + b.n; }, 0), 8) + "</div>" +
        '<div class="set-sec"><div class="set-sec-t">' + Icons.el("checklist") + "Guided tasks and Operator runs</div>" +
          bar(s.tasks.concat(s.runs), s.tasks.concat(s.runs).reduce(function (a, b) { return a + b.n; }, 0), 10) +
          (s.askedFor.length
            ? '<div class="an-note">' + Icons.el("chat") + "The Operator had to stop and ask for: " +
              esc(s.askedFor.slice(0, 5).map(function (x) { return x.k; }).join(", ")) + "</div>"
            : "") + "</div>"
      : "") +

    '<div class="set-sec"><div class="set-sec-t">' + Icons.el("shield") + "What is being recorded</div>" +
      '<div class="an-level">Level <b>' + esc(c.level) + "</b>" +
        (c.level === "counts" ? " — event shapes and timings only."
         : c.level === "detail" ? " — which documents, tasks and runs were used. Nothing anyone typed."
         : " — the full conversation, both sides.") + "</div>" +
      (c.level === "full"
        ? '<div class="an-warn">' + Icons.el("alert") +
          "Conversations are being recorded in full." +
          (c.endpoint ? " They are sent to the address below." : " They stay in this browser.") +
          "</div>" : "") +
      '<div class="an-level">' + (c.endpoint
        ? Icons.el("globe") + "Sent to <code>" + esc(c.endpoint) + "</code>"
        : Icons.el("lock") + "Stored in this browser only. Nothing is sent anywhere.") + "</div>" +
      (c.note ? '<div class="an-note">' + esc(c.note) + "</div>" : "") +
      '<div class="an-acts">' +
        '<button class="btn btn-sm" onclick="Analytics.exportJson()">' + Icons.el("download") + "Export JSON</button>" +
        '<button class="btn btn-sm" onclick="Analytics.exportCsv()">' + Icons.el("table") + "Export CSV</button>" +
        (cfg().endpoint ? '<button class="btn btn-sm" onclick="Analytics.flush()">' + Icons.el("upload") + "Send now</button>" : "") +
        '<button class="btn btn-sm btn-ghost" onclick="Analytics.clear()">' + Icons.el("trash") + "Clear</button>" +
      "</div>" +
    "</div>";
  }

  return {
    begin: begin, track: track, turn: turn, flush: flush,
    identify: identify, skipIdentify: skipIdentify, who: who, disclosure: disclosure,
    blocked: blocked, gate: gate,
    summary: summary, transcript: transcript, paneMarkup: paneMarkup, setView: setView,
    exportJson: exportJson, exportCsv: exportCsv, clear: clear,
    toJson: toJson, toCsv: toCsv,
    isOn: on, level: function () { return cfg().level; }, LEVELS: LEVELS,
    _outbox: function () { return outbox(); },
  };
})();
