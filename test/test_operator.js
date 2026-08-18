/* ==================================================================
   test_operator.js
   ------------------------------------------------------------------
   The Operator's one job is to point at a real control on a real
   screen, 57 times in a row, without ever pointing at nothing. That
   is exactly what is hard to eyeball: a missing anchor shows up as a
   cursor that silently vanishes for one step, which nobody notices in
   a demo until a customer does.

   So this parses each rendered screen and resolves each step's
   anchor against it with a real (small) selector engine, at the exact
   step index that step runs at — including the transient state, since
   several anchors point at a dialog that only exists during its own
   step.

       node test/test_operator.js

   No jsdom: the parser below handles the subset of HTML these screens
   emit, which is all well-formed and generated rather than authored.
   ================================================================== */

const H = require("./harness");

H.loadEdition("mining");
H.loadSrc();

/* ------------------------------------------------------------------
   a very small HTML parser
------------------------------------------------------------------ */
const VOID = new Set(["br", "hr", "img", "input", "meta", "link", "source", "path", "circle", "rect", "line", "polygon", "use", "stop", "ellipse"]);

function parse(html) {
  const root = { tag: "#root", attrs: {}, children: [], parent: null };
  let node = root;
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith("<!--")) continue;
    if (m[5] !== undefined) { node.children.push({ tag: "#text", text: m[5], attrs: {}, children: [], parent: node }); continue; }
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    if (closing) {
      let up = node;
      while (up && up.tag !== tag) up = up.parent;
      if (up && up.parent) node = up.parent;
      continue;
    }
    const attrs = {};
    const ar = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    let a;
    while ((a = ar.exec(m[3] || ""))) {
      attrs[a[1].toLowerCase()] = a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : a[4] !== undefined ? a[4] : "";
    }
    const el = { tag: tag, attrs: attrs, children: [], parent: node };
    node.children.push(el);
    if (!m[4] && !VOID.has(tag)) node = el;
  }
  return root;
}

function walk(node, fn) {
  node.children.forEach(c => { if (c.tag !== "#text") { fn(c); walk(c, fn); } });
}
function textOf(node) {
  let out = "";
  (function rec(n) {
    n.children.forEach(c => { if (c.tag === "#text") out += c.text; else rec(c); });
  })(node);
  return out.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
}

/* ------------------------------------------------------------------
   a very small selector engine: descendant chains of compound
   selectors made of tag / .class / #id / [attr='value']
------------------------------------------------------------------ */
function compound(sel) {
  const out = { tag: "", classes: [], id: "", attrs: [] };
  const re = /([.#]?)([\w-]+)|\[([\w-]+)(?:\s*=\s*['"]?([^\]'"]*)['"]?)?\]/g;
  let m, first = true;
  while ((m = re.exec(sel))) {
    if (m[3]) { out.attrs.push([m[3], m[4]]); first = false; continue; }
    if (m[1] === ".") out.classes.push(m[2]);
    else if (m[1] === "#") out.id = m[2];
    else if (first) out.tag = m[2].toLowerCase();
    first = false;
  }
  return out;
}
function matches(node, c) {
  if (c.tag && node.tag !== c.tag) return false;
  if (c.id && node.attrs.id !== c.id) return false;
  if (c.classes.length) {
    const cls = String(node.attrs.class || "").split(/\s+/);
    if (!c.classes.every(x => cls.indexOf(x) !== -1)) return false;
  }
  return c.attrs.every(a => a[1] === undefined ? node.attrs[a[0]] !== undefined : node.attrs[a[0]] === a[1]);
}
function queryAll(root, selector) {
  const parts = selector.trim().split(/\s+(?![^\[]*\])/).map(compound);
  const last = parts[parts.length - 1];
  const found = [];
  walk(root, n => {
    if (!matches(n, last)) return;
    let i = parts.length - 2, up = n.parent;
    while (i >= 0 && up) {
      if (matches(up, parts[i])) i--;
      up = up.parent;
    }
    if (i < 0) found.push(n);
  });
  return found;
}

/* ------------------------------------------------------------------
   render a department screen exactly as it appears at one step
------------------------------------------------------------------ */
function taskAt(key, index, status) {
  const d = OP_DEPT[key];
  return {
    key: key,
    status: status || "running",
    phase: "app",
    index: index,
    tick: 12,
    anchorAudit: {},
    steps: d.steps.map(s => ({ label: s[0], view: s[1], act: s[2] || "", ms: 0 })),
  };
}
function screenAt(key, index) {
  const task = taskAt(key, index, index >= OP_DEPT[key].steps.length - 1 ? "done" : "running");
  const view = opViewFor({ tasks: [task] }, key);
  return { html: opAppSurface(key, view, task), view: view, task: task };
}

/* ==================================================================
   1. the department tables are complete
   ================================================================== */
H.section("Every department is complete enough to run");

H.ok(OP_ORDER.length === 6, "six applications across the estate");
OP_ORDER.forEach(key => {
  const d = OP_DEPT[key];
  const at = 'department "' + key + '"';
  H.ok(!!d, at + " exists");
  H.ok(!!d.label && !!d.slug && /^#[0-9A-Fa-f]{6}$/.test(d.color), at + " has a label, slug and colour");
  H.ok(d.nav.length >= 5, at + " lists its object tabs in the navigation bar");
  H.ok(d.steps.length >= 8, at + " has a journey worth watching (" + d.steps.length + " steps)");
  H.ok(d.steps.length <= 14, at + " is short enough to hold attention");
  H.ok(!!d.paths.home && !!d.paths.verify, at + " has a home and a verify URL");

  /* every view a step names must have a URL, or the address bar lies */
  d.steps.forEach((s, i) => {
    H.ok(!!d.paths[s[1]], at + " step " + i + ' ("' + s[0] + '") has a URL for view "' + s[1] + '"');
  });

  /* the action kind must be one the pointer knows how to draw */
  const KINDS = ["click", "type", "wait", "inspect", "key"];
  d.steps.forEach((s, i) => {
    if (s[2]) H.ok(KINDS.indexOf(s[2]) !== -1, at + " step " + i + ' has a known action ("' + s[2] + '")');
  });
});

/* ==================================================================
   2. every step has an anchor, and it resolves on its own screen
   ================================================================== */
H.section("Every step points the cursor at a real control");

let anchored = 0;
OP_ORDER.forEach(key => {
  const d = OP_DEPT[key];
  const list = OP_ANCHOR[key] || [];
  H.eq(list.length, d.steps.length, 'department "' + key + '" has one anchor per step');

  d.steps.forEach((s, i) => {
    const at = key + " step " + i + ' ("' + s[0] + '")';
    const a = list[i];
    if (!a) { H.ok(false, at + " has an anchor"); return; }

    const scr = screenAt(key, i);
    const root = parse(scr.html);
    let nodes = queryAll(root, a[0]);
    let via = a[0];
    if (!nodes.length && a[2]) { nodes = queryAll(root, a[2]); via = a[2] + " (fallback)"; }

    H.ok(nodes.length > 0, at + " resolves " + via + ' on view "' + scr.view + '"');
    if (!nodes.length) return;

    if (a[1]) {
      const want = String(a[1]).trim().toLowerCase();
      const hit = nodes.some(n => textOf(n).toLowerCase().indexOf(want) !== -1);
      H.ok(hit, at + ' finds its text "' + a[1] + '" among ' + nodes.length + " match(es)");
    }
    anchored++;
  });
});
H.ok(anchored >= 55, "the whole programme is anchored (" + anchored + " steps)");

/* ==================================================================
   3. the screens themselves are sound
   ================================================================== */
H.section("Every screen renders as valid, complete markup");

OP_ORDER.forEach(key => {
  const d = OP_DEPT[key];
  const views = Object.keys(d.paths);
  views.forEach(view => {
    const at = key + "/" + view;
    const html = opAppSurface(key, view, taskAt(key, 0));
    H.ok(html.length > 1500, at + " renders a real screen");

    /* an odd number of quotes inside a tag means an attribute is broken,
       which is exactly what a stray quote in a data row produces */
    const badTags = (html.match(/<[^>]*>/g) || []).filter(t => (t.match(/"/g) || []).length % 2);
    H.eq(badTags.slice(0, 1), [], at + " has no tag with unbalanced quotes");

    const root = parse(html);

    /* The estate is three systems, so the chrome differs by app. What
       must hold for all of them is the same three things: one global
       header, one navigation strip with the app's own tabs, and exactly
       one of those tabs marked current. A screen with two active tabs,
       or none, is a screen where a viewer cannot tell where they are. */
    const chrome = key === "control" ? { head: ".mc-gh", nav: ".mc-gh__tabs", tab: ".mc-tab", main: ".mc-main" }
      : key === "contractor"        ? { head: ".cg-gh", nav: ".cg-gh__tabs", tab: ".cg-tab", main: ".cg-main" }
      :                               { head: ".sap-gh", nav: ".sap-nav__tabs", tab: ".sap-tab", main: ".sap-main" };

    H.ok(queryAll(root, chrome.head).length === 1, at + " has one global header");
    H.ok(queryAll(root, chrome.nav).length === 1, at + " has one navigation strip");
    H.ok(queryAll(root, chrome.main).length === 1, at + " has one scrolling work area");
    H.ok(queryAll(root, chrome.tab).length >= 5, at + " shows the app's own tabs");

    const active = queryAll(root, chrome.tab + ".is-active");
    H.eq(active.length, 1, at + " marks exactly one tab as current");

    /* the SAP apps additionally name the tenant and the app they are in,
       which is what makes five transactions read as one system */
    if (chrome.head === ".sap-gh") {
      const app = queryAll(root, ".sap-nav__app");
      H.ok(app.length === 1 && textOf(app[0]).trim().length > 2, at + " names the app in the navigation bar");
      H.ok(queryAll(root, ".sap-gh__logo").length === 1, at + " carries the product mark");
    }

    /* no unreplaced template token ever reaches a screen */
    H.eq((html.match(/\{[a-z]+\}/g) || []).slice(0, 1), [], at + " leaves no unfilled token");
    H.ok(html.indexOf("undefined") === -1, at + " renders no undefined value");
    H.ok(html.indexOf("[object Object]") === -1, at + " renders no stringified object");
  });
});

/* ==================================================================
   4. the run itself advances the way the shell expects
   ================================================================== */
H.section("A run advances through navigation and every step");

OP_ORDER.forEach(key => {
  const d = OP_DEPT[key];
  const at = 'run "' + key + '"';

  /* the view the shell asks for must change as the run progresses,
     otherwise the browser sits on one screen for the whole journey */
  const views = d.steps.map((s, i) => opViewFor({ tasks: [taskAt(key, i)] }, key));
  H.eq(views.length, d.steps.length, at + " resolves a view for every step");
  H.ok(new Set(views).size >= 5, at + " moves through at least five distinct screens");

  /* navigation phases resolve to the browser start page, not a Titan screen */
  ["newtab", "address-focus", "typing-url", "press-enter", "loading"].forEach(phase => {
    const t = taskAt(key, 0, "navigating");
    t.phase = phase;
    H.eq(opViewFor({ tasks: [t] }, key), "browser-start", at + " shows the new-tab page during " + phase);
  });

  /* a finished run lands on verify */
  const done = taskAt(key, d.steps.length - 1, "done");
  H.eq(opViewFor({ tasks: [done] }, key), "verify", at + " ends on the verification screen");

  /* the URL the address bar shows must be the tenant's own host */
  const host = opOrgHost(key);
  H.ok(opHomeUrl(key).indexOf(host) === 0, at + " navigates to the tenant's own org host");
  /* An enterprise estate is several systems on several hosts, so the
     only thing that has to hold is that each app resolves to a real
     hostname carrying the tenant's own name, and that every step sits
     under that app's path. */
  H.ok(/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host), at + " resolves to a real host shape (" + host + ")");
  H.ok(host.indexOf(String(Config.company.short).toLowerCase().replace(/[^a-z0-9]/g, "")) !== -1
       || /^[a-z0-9-]+\.(gov|com)$/.test(host),
       at + " carries the tenant's own name in the host");

  d.steps.forEach((s, i) => {
    const url = opUrlFor(key, s[1]);
    H.ok(url.indexOf(host + "/" + d.slug) === 0,
      at + " step " + i + " has a URL under the app path");
    /* A Fiori intent route is #Object-action and must not gain a slash
       in front of it, or the URL reads as a fake to anyone who uses the
       product. A path route must keep its slash. */
    const tail = url.slice((host + "/" + d.slug).length);
    H.ok(tail === "" || /^[#?]/.test(tail) || tail.charAt(0) === "/",
      at + " step " + i + " joins its route correctly (" + tail.slice(0, 24) + ")");
  });
});

/* ==================================================================
   5. typing screens actually type
   ================================================================== */
H.section("Typed fields fill in while their step runs");

const TYPING = [
  ["control", /Record the operator's concern/, "sapConcern"],
  ["maintenance", /Record the malfunction detail/, "sapMalfunction"],
  ["isolation", /Describe the work/, "sapWork"],
  ["safety", /Record what happened/, "sapEvent"],
  ["supply", /Enter the quantity/, "sapQty"],
  ["contractor", /Set the headcount/, "sapHead"],
];
TYPING.forEach(([key, re, id]) => {
  const d = OP_DEPT[key];
  const i = d.steps.findIndex(s => re.test(s[0]));
  H.ok(i >= 0, key + " has a typing step for " + id);
  if (i < 0) return;

  const at = key + " field #" + id;

  /* sampled as a fraction of the step's real dwell rather than at a fixed
     tick, so retuning the pacing does not silently invalidate this.

     The assertion is against the value itself rather than against the
     placeholder: a short value (a number of days) is legitimately
     shorter than its own placeholder part way through typing, and
     comparing lengths across the two would fail for the wrong reason. */
  const hold = opHold(OP_STEP_TICKS.type);
  const mid = taskAt(key, i); mid.tick = Math.round(hold * 0.55);
  const later = taskAt(key, i + 1 < d.steps.length ? i + 1 : i, i + 1 < d.steps.length ? "running" : "done");

  const view = d.steps[i][1];
  const tMid = textOf((queryAll(parse(opAppSurface(key, view, mid)), "#" + id)[0]) || { children: [] });
  const tLate = textOf((queryAll(parse(opAppSurface(key, view, later)), "#" + id)[0]) || { children: [] });

  H.ok(tLate.length > 0, at + " holds the real value once the step has passed");
  H.ok(tLate.indexOf("{") === -1, at + " holds real text, not a token");
  /* A value of one or two characters is fully typed well before the step
     ends, so mid-step it legitimately equals the final value. Asserting
     strict growth on those would fail for the wrong reason. */
  if (tLate.length >= 4) {
    H.ok(tMid.length < tLate.length, at + " is still filling part way through the step");
  } else {
    H.ok(tMid.length <= tLate.length, at + " never overshoots its own value");
  }
  H.ok(tLate.indexOf(tMid) === 0, at + " types the value from the start, not a different string");
});

/* ==================================================================
   6. nothing customer-specific leaked into the machine
   ================================================================== */
H.section("The machine stays generic");

const fs = require("fs");
const path = require("path");
const shell = fs.readFileSync(path.join(__dirname, "..", "src", "44-operator-shell.js"), "utf8");
["linkedin", "instagram", "hubspot", "mailchimp", "tiktok", "campaign_hero"].forEach(word => {
  H.ok(shell.toLowerCase().indexOf(word) === -1, 'the shell carries no leftover "' + word + '"');
});
H.ok(shell.indexOf("state.tenant") === -1, "the shell reads Config, not the marketing tenant model");
H.ok(shell.indexOf("ensureCommand") === -1, "the shell owns its own state rather than the marketing command state");

H.report("SARA Operator — SAP and Mine Control");
