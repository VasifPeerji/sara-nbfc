/* ==================================================================
   test_operator.js
   ------------------------------------------------------------------
   The Operator's one job is to point at a real control on a real
   screen, seventy-plus times in a row, without ever pointing at
   nothing. That is exactly what is hard to eyeball: a missing anchor
   shows up as a cursor that silently vanishes for one step, which
   nobody notices in a demo until a customer does.

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

H.loadEdition("nbfc");
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
    steps: d.steps.map(s => ({ label: s[0], view: s[1], act: s[2] || "", needs: s[3] || "", ms: 0 })),
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

H.ok(OP_ORDER.length === 8, "eight applications across the estate");

/* Four modules of the tenant's own platform, four statutory registries.
   The split is what the demonstration is about, so it is asserted rather
   than left to whatever the table happens to contain. */
const PLATFORM = OP_ORDER.filter(k => !OP_DEPT[k].statutory);
const RAILS    = OP_ORDER.filter(k => OP_DEPT[k].statutory);
H.eq(PLATFORM, ["origination", "lms", "collections", "colending"], "four platform modules, in order");
H.eq(RAILS, ["ckycr", "cersai", "cims", "cms"], "four statutory registries, in order");

let totalSteps = 0;
OP_ORDER.forEach(key => {
  const d = OP_DEPT[key];
  const at = 'department "' + key + '"';
  H.ok(!!d, at + " exists");
  H.ok(!!d.label && !!d.slug && /^#[0-9A-Fa-f]{6}$/.test(d.color), at + " has a label, slug and colour");
  H.ok(d.nav.length >= 5, at + " lists its object tabs in the navigation bar");
  H.ok(d.steps.length >= 8, at + " has a journey worth watching (" + d.steps.length + " steps)");
  H.ok(d.steps.length <= 14, at + " is short enough to hold attention");
  H.ok(!!d.runTitle && !!d.runWhat, at + " says what the run is and what it does");
  H.ok((d.triggers || []).length >= 8, at + " gives the router enough to route on");
  totalSteps += d.steps.length;

  /* Every department's first view is home and its last is verify. The
     shell relies on both: it navigates to home, and it falls back to
     verify the moment the run finishes. */
  H.eq(d.steps[0][1], "home", at + " starts on home");
  H.eq(d.steps[d.steps.length - 1][1], "verify", at + " ends on verify");
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

  /* A step may declare the parameters it needs before it can be
     performed. Each one must be a field the department actually
     declares, or the run stops to ask a question it cannot ask. */
  const ids = (d.fields || []).map(f => f.id);
  d.steps.forEach((s, i) => {
    String(s[3] || "").split(",").map(x => x.trim()).filter(Boolean).forEach(need => {
      H.ok(ids.indexOf(need) !== -1,
        at + " step " + i + ' needs "' + need + '", which it declares as a field');
    });
  });

  /* Every required field must be reached by some step, or the run will
     never ask for it and will quietly use the demonstration value. */
  (d.fields || []).filter(f => f.required).forEach(f => {
    const reached = d.steps.some(s => String(s[3] || "").split(",").map(x => x.trim()).indexOf(f.id) !== -1);
    H.ok(reached, at + ' asks for its required field "' + f.id + '" at some step');
  });

  /* a field with options has to be answerable from them */
  (d.fields || []).forEach(f => {
    if (f.options) H.ok(f.options.length >= 2, at + ' field "' + f.id + '" offers a real choice');
    H.ok(!!f.label && !!f.ask, at + ' field "' + f.id + '" has a label and a question');
  });
});
H.ok(totalSteps >= 60 && totalSteps <= 90, "the programme is the right size (" + totalSteps + " steps)");

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
H.ok(anchored >= 60, "the whole programme is anchored (" + anchored + " steps)");

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

    /* One component set, two skins, so the chrome selectors are the same
       for every screen in the estate. What must hold is the same three
       things: one global header, one navigation strip with the app's own
       tabs, and exactly one of those tabs marked current. A screen with
       two active tabs, or none, is a screen where a viewer cannot tell
       where they are. */
    H.ok(queryAll(root, ".fin-gh").length === 1, at + " has one global header");
    H.ok(queryAll(root, ".fin-nav__tabs").length === 1, at + " has one navigation strip");
    H.ok(queryAll(root, ".fin-main").length === 1, at + " has one scrolling work area");
    H.ok(queryAll(root, ".fin-tab").length >= 5, at + " shows the app's own tabs");

    const active = queryAll(root, ".fin-tab.is-active");
    H.eq(active.length, 1, at + " marks exactly one tab as current");

    /* The skin has to match what the department actually is. A registry
       that renders in the platform's chrome, or the reverse, destroys the
       one thing this estate is demonstrating: that the Operator crosses
       out of the company's own systems and into somebody else's. */
    const shells = queryAll(root, ".fin");
    H.ok(shells.length === 1, at + " renders exactly one application shell");
    if (shells.length) {
      H.eq(shells[0].attrs["data-sys"], d.statutory ? "gov" : "platform",
        at + " renders in the " + (d.statutory ? "registry" : "platform") + " skin");
      H.eq(shells[0].attrs["data-app"], key, at + " names the application it is");
    }
    if (d.statutory) {
      H.ok(queryAll(root, ".fin-util").length === 1, at + " carries the registry utility strip");
      H.ok(queryAll(root, ".fin-crumb").length === 1, at + " carries a breadcrumb");
      H.ok(queryAll(root, ".fin-gh__mark").length === 1, at + " carries the registry mark");
    } else {
      H.ok(queryAll(root, ".fin-gh__mod").length === 1, at + " names the module it is in");
      const app = queryAll(root, ".fin-nav__app");
      H.ok(app.length === 1 && textOf(app[0]).trim().length > 2, at + " names the app in the navigation bar");
    }

    /* no unreplaced template token ever reaches a screen */
    H.eq((html.match(/\{[a-z]+\}/g) || []).slice(0, 1), [], at + " leaves no unfilled token");
    H.ok(html.indexOf("undefined") === -1, at + " renders no undefined value");
    H.ok(html.indexOf("[object Object]") === -1, at + " renders no stringified object");
    H.ok(html.indexOf("NaN") === -1, at + " renders no NaN");
  });
});

/* ==================================================================
   4. the run itself advances the way the shell expects
   ================================================================== */
H.section("A run advances through navigation and every step");

const tenantSlug = String(Config.company.short).toLowerCase().replace(/[^a-z0-9]/g, "");

OP_ORDER.forEach(key => {
  const d = OP_DEPT[key];
  const at = 'run "' + key + '"';

  /* the view the shell asks for must change as the run progresses,
     otherwise the browser sits on one screen for the whole journey */
  const views = d.steps.map((s, i) => opViewFor({ tasks: [taskAt(key, i)] }, key));
  H.eq(views.length, d.steps.length, at + " resolves a view for every step");
  H.ok(new Set(views).size >= 5, at + " moves through at least five distinct screens");

  /* navigation phases resolve to the browser start page, not an app screen */
  ["newtab", "address-focus", "typing-url", "press-enter", "loading"].forEach(phase => {
    const t = taskAt(key, 0, "navigating");
    t.phase = phase;
    H.eq(opViewFor({ tasks: [t] }, key), "browser-start", at + " shows the new-tab page during " + phase);
  });

  /* a finished run lands on verify */
  const done = taskAt(key, d.steps.length - 1, "done");
  H.eq(opViewFor({ tasks: [done] }, key), "verify", at + " ends on the verification screen");

  /* The estate is several systems on several hosts. The platform carries
     the tenant's own name; a registry does not and must not, because it
     is not theirs — so a host without the tenant's name has to be a
     department that declares itself statutory. */
  const host = opOrgHost(key);
  H.ok(opHomeUrl(key).indexOf(host) === 0, at + " navigates to its own host");
  H.ok(/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host), at + " resolves to a real host shape (" + host + ")");
  if (d.statutory) {
    H.ok(host.indexOf(tenantSlug) === -1, at + " is a registry, so it does not sit on the tenant's own host");
  } else {
    H.ok(host.indexOf(tenantSlug) !== -1, at + " carries the tenant's own name in the host (" + host + ")");
  }

  d.steps.forEach((s, i) => {
    const url = opUrlFor(key, s[1]);
    H.ok(url.indexOf(host + "/" + d.slug) === 0,
      at + " step " + i + " has a URL under the app path");
    /* An in-app route is #Object-action and must not gain a slash in
       front of it, or the URL reads as a fake to anyone who uses the
       product. A path route must keep its slash. */
    const tail = url.slice((host + "/" + d.slug).length);
    H.ok(tail === "" || /^[#?]/.test(tail) || tail.charAt(0) === "/",
      at + " step " + i + " joins its route correctly (" + tail.slice(0, 24) + ")");
  });
});

/* the four platform modules are one product on one host */
H.eq(new Set(PLATFORM.map(k => opOrgHost(k))).size, 1, "the four platform modules share one host");
H.eq(new Set(PLATFORM.map(k => OP_DEPT[k].slug)).size, 4, "and each is its own module path");
H.eq(new Set(RAILS.map(k => opOrgHost(k))).size, 4, "each registry is its own external site");

/* ==================================================================
   5. typing screens actually type
   ================================================================== */
H.section("Typed fields fill in while their step runs");

const TYPING = [
  ["origination", /Enter the amount sought/, "finAmount"],
  ["lms", /Enter the amount to release/, "finRelease"],
  ["collections", /Record the arrears position/, "finArrears"],
  ["colending", /Enter the partner file reference/, "finFile"],
  ["ckycr", /Enter the customer to search for/, "finSearch"],
  ["cersai", /Enter the property to search/, "finAsset"],
  ["cims", /Explain the flagged variance/, "finReason"],
  ["cms", /Record the finding/, "finFinding"],
];
H.eq(TYPING.length, OP_ORDER.length, "every application has a field somebody actually types into");

TYPING.forEach(([key, re, id]) => {
  const d = OP_DEPT[key];
  const i = d.steps.findIndex(s => re.test(s[0]));
  H.ok(i >= 0, key + " has a typing step for " + id);
  if (i < 0) return;
  H.eq(d.steps[i][2], "type", key + " step " + i + " is declared as a typing step");

  const at = key + " field #" + id;

  /* sampled as a fraction of the step's real dwell rather than at a fixed
     tick, so retuning the pacing does not silently invalidate this.

     The assertion is against the value itself rather than against the
     placeholder: a short value is legitimately shorter than its own
     placeholder part way through typing, and comparing lengths across
     the two would fail for the wrong reason. */
  const hold = opHold(OP_STEP_TICKS.type);
  const mid = taskAt(key, i); mid.tick = Math.round(hold * 0.55);
  const later = taskAt(key, i + 1 < d.steps.length ? i + 1 : i, i + 1 < d.steps.length ? "running" : "done");

  const view = d.steps[i][1];
  const tMid = textOf((queryAll(parse(opAppSurface(key, view, mid)), "#" + id)[0]) || { children: [] });
  const tLate = textOf((queryAll(parse(opAppSurface(key, view, later)), "#" + id)[0]) || { children: [] });

  H.ok(tLate.length > 0, at + " holds the real value once the step has passed");
  H.ok(tLate.indexOf("{") === -1, at + " holds real text, not a token");
  H.ok(tLate.indexOf("&") === -1, at + " holds text, not a half-escaped entity");
  if (tLate.length >= 4) {
    H.ok(tMid.length < tLate.length, at + " is still filling part way through the step");
  } else {
    H.ok(tMid.length <= tLate.length, at + " never overshoots its own value");
  }
  H.ok(tLate.indexOf(tMid) === 0, at + " types the value from the start, not a different string");

  /* the same text the shell will push into it in place, character for
     character — otherwise the field jumps when the live updater takes over */
  const live = (opLiveText(key, view, mid) || []).find(f => f.id === id);
  H.ok(!!live, at + " is declared to the shell's live updater");
  if (live) H.eq(live.text, tMid, at + " renders exactly what the live updater will push");
});

/* ==================================================================
   6. what is named, and what is deliberately not
   ================================================================== */
H.section("The registries are named, the platform is not");

/* The whole argument for this estate is that no lending platform is
   named and every registry is. A vendor's name creeping into the
   platform side would make the demonstration wrong for most of the
   market it is shown to. */
const surface = require("fs").readFileSync(
  require("path").join(__dirname, "..", "src", "45-operator-lending.js"), "utf8");

["SAP", "Fiori", "Salesforce", "Oracle", "Finacle", "Temenos", "Nucleus", "FinnOne",
 "Pennant", "Jocata", "Lentra", "Sopra", "BaNCS"].forEach(vendor => {
  H.ok(!new RegExp("\\b" + vendor + "\\b", "i").test(surface),
    "no lending platform vendor is named (" + vendor + ")");
});

/* and nothing from the build this was grown out of survived */
["mining", "Mine Control", "isolation", "tagging list", "Marra Downs", "geotech"].forEach(word => {
  H.ok(surface.toLowerCase().indexOf(word.toLowerCase()) === -1,
    'no leftover from the previous estate ("' + word + '")');
});

/* No public authority's emblem is drawn anywhere. A lettered tile is the
   mark, and the file says why. */
["ashoka", "satyameva", "lion capital"].forEach(word => {
  H.ok(surface.toLowerCase().indexOf(word) === -1, 'no state emblem is reproduced ("' + word + '")');
});
H.has(surface, "Prohibition of Improper Use", "and the reason is recorded where the mark is drawn");

/* the registries are named, and named correctly */
H.eq(OP_DEPT.ckycr.host, "ckycrportal.com", "CKYCR sits on its own registry host");
H.eq(OP_DEPT.cersai.host, "cersai.org.in", "CERSAI sits on its own registry host");
H.eq(OP_DEPT.cims.host, "cims.rbi.org.in", "CIMS sits on the Reserve Bank's host");
H.eq(OP_DEPT.cms.host, "cms.rbi.org.in", "RBI CMS sits on the Reserve Bank's host");
RAILS.forEach(k => {
  H.ok(!!OP_DEPT[k].authority && !!OP_DEPT[k].authorityLong,
    'registry "' + k + '" names the authority that operates it');
});

/* ==================================================================
   7. the run that stops itself
   ================================================================== */
H.section("Collections refuses to raise the repossession");

const gate = colGateRows();
H.eq(gate.length, 4, "the repossession gate tests four conditions");
H.eq(gate.filter(r => r.pass).length, 2, "two of them hold");
H.eq(gate.filter(r => !r.pass).length, 2, "two of them do not");
gate.forEach((r, i) => {
  H.ok(!!r.t && !!r.d, "gate condition " + i + " states what it is and what was found");
  H.ok(!!r.cite, "gate condition " + i + " carries the rule it was tested against");
});

/* the two that fail are the two no lending platform can answer */
const failed = gate.filter(r => !r.pass).map(r => r.t.toLowerCase());
H.ok(failed.some(t => t.indexOf("possession clause") !== -1),
  "the executed agreement's possession clause is one of the failures");
H.ok(failed.some(t => t.indexOf("grievance") !== -1 || t.indexOf("dispute") !== -1),
  "the open grievance is the other");

/* the blocked screen says so, and the verification screen does not
   pretend anything succeeded */
const blocked = opAppSurface("collections", "blocked", taskAt("collections", 6));
H.has(blocked, "not authorised", "the blocked screen says the action is not authorised");
H.eq(queryAll(parse(blocked), ".fin-gate__r.is-fail").length, 2,
  "the blocked screen shows both failing conditions");
H.eq(queryAll(parse(blocked), ".fin-toast").length, 0,
  "the blocked screen carries no success toast");

const cverify = opAppSurface("collections", "verify",
  taskAt("collections", OP_DEPT.collections.steps.length - 1, "done"));
H.eq(queryAll(parse(cverify), ".fin-toast").length, 0,
  "and neither does the verification screen: nothing succeeded");
H.has(cverify, "No repossession request was raised", "the verification screen says what did not happen");

/* every other run does end in something */
OP_ORDER.filter(k => k !== "collections").forEach(key => {
  const html = opAppSurface(key, "verify", taskAt(key, OP_DEPT[key].steps.length - 1, "done"));
  const root = parse(html);
  H.ok(queryAll(root, ".fin-toast").length + queryAll(root, ".fin-ack").length >= 1,
    'run "' + key + '" ends in a confirmation or an acknowledgement');
});

/* ==================================================================
   8. nothing customer-specific leaked into the machine
   ================================================================== */
H.section("The machine stays generic");

const shell = require("fs").readFileSync(
  require("path").join(__dirname, "..", "src", "44-operator-shell.js"), "utf8");
["linkedin", "instagram", "hubspot", "mailchimp", "tiktok", "campaign_hero",
 "cersai", "ckyc", "anvira", "nbfc", "repossession"].forEach(word => {
  H.ok(shell.toLowerCase().indexOf(word) === -1, 'the shell carries no "' + word + '"');
});
H.ok(shell.indexOf("state.tenant") === -1, "the shell reads Config, not the marketing tenant model");
H.ok(shell.indexOf("ensureCommand") === -1, "the shell owns its own state rather than the marketing command state");
H.ok(shell.indexOf("const OP_SITES") === -1, "the estate lives with the applications, not in the machine");

/* The machine must not carry a currency convention either: digit
   grouping and the symbol both differ by market, and the application
   layer is the only thing that knows which market this is. */
H.ok(shell.indexOf('"$"') === -1, "the machine hardcodes no currency symbol");
H.ok(shell.indexOf("opFormatMoney") !== -1, "the machine asks the application layer to format money");
H.eq(opFormatMoney("1860000"), "₹18,60,000", "figures group the way they are written here");
H.eq(opFormatMoney("18.6 lakh"), "₹18,60,000", "and a figure said in lakh is understood");
H.eq(opFormatMoney("1.2 crore"), "₹1,20,00,000", "and one said in crore");

H.report("SARA Operator — the lending platform and the statutory rails");
