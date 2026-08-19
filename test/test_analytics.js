/* ==================================================================
   test_analytics.js
   ------------------------------------------------------------------
   Usage recording, and specifically what it does NOT record.

   The capture level is the whole safety story. A build handed to a
   testing and certification body must not quietly carry away the text
   its engineers typed, so the level is enforced in one place, inside
   `track()`, rather than at every call site. This asserts:

     off      records nothing at all
     counts   keeps shapes and timings, drops every identifier and text
     detail   keeps our own identifiers, drops what anyone typed
     full     keeps both sides of the conversation

   plus the two things that make the transcript actually arrive: an
   outbox that survives a failed send, and unique event ids so the
   collector can drop the duplicates that retrying produces.

       node test/test_analytics.js
   ================================================================== */

const H = require("./harness");

H.loadEdition("nbfc");
H.loadSrc();

/* localStorage and network stubs, so the module runs headless and
   nothing actually leaves */
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};
let posts = [];
let failNext = 0;
global.fetch = function (url, opts) {
  posts.push({ url, opts });
  if (failNext > 0) { failNext--; return Promise.reject(new Error("network")); }
  return Promise.resolve({ ok: true, type: "basic" });
};
/* Node 22 defines `navigator` as a read-only global, so a plain
   assignment is silently ignored and the real one wins. */
Object.defineProperty(global, "navigator", {
  configurable: true, writable: true,
  value: {
    userAgent: "test", language: "en-GB",
    sendBeacon: function (url, body) { posts.push({ url, body, beacon: true }); return true; },
  },
});
global.screen = { width: 1440, height: 900 };
global.toast = function () {};

function reset(level, endpoint, identify) {
  Object.keys(store).forEach(k => delete store[k]);
  posts = []; failNext = 0;
  Config.analytics = { level: level, endpoint: endpoint || "", identify: identify || "off",
                       org: "Streebo", note: "" };
  Analytics.clear();
}
function events() {
  const raw = store["sara_nbfc_usage"];
  return raw ? JSON.parse(raw).events : [];
}
function outbox() {
  const raw = store["sara_nbfc_usage_outbox"];
  return raw ? JSON.parse(raw) : [];
}
/* a finished exchange, the shape finish() hands over */
function exchange(q, a, extra) {
  Analytics.turn(q, {
    text: a,
    decision: { intent: (extra || {}).intent || "knowledge", target: (extra || {}).target || "" },
    sources: ((extra || {}).cited || []).map(id => ({ id: id })),
  }, Object.assign({ role: "Test Engineer, High Power", ms: 1200, model: "gpt-5.1" }, extra || {}));
}

/* ==================================================================
   1. what this edition ships with
   ================================================================== */
H.section("The edition declares what is recorded");

const declared = JSON.parse(JSON.stringify(Config.analytics || {}));

H.ok(Analytics.LEVELS.indexOf(declared.level) !== -1,
  'the CESI edition declares a valid level ("' + declared.level + '")');
H.eq(declared.level, "full",
  "this build is for a hosted link, so it captures the conversation");

/* The endpoint is deliberately relative. It resolves against wherever
   the page is served from, which is what lets the hosting team drop
   collect.php beside the html with nothing to configure and nothing to
   rebuild. An absolute third-party URL here would be a mistake nobody
   would notice until the data went to the wrong place. */
H.ok(!/^https?:\/\//i.test(declared.endpoint),
  'the endpoint is relative, so hosting needs no rebuild ("' + declared.endpoint + '")');
H.ok(declared.endpoint.indexOf("collect") === 0,
  "and it points at the collector that ships beside it");

H.eq(declared.disclose, false,
  "the generated legal line is off: this is invented data, briefed on the call");
/* One collector can serve every prospect, so each batch has to say
   which demo it came from. It falls back to the customer name, so a
   build nobody labelled is still separable. */
H.ok(!!declared.label, 'the build labels itself for a shared collector ("' + declared.label + '")');

H.eq(declared.identify, "required",
  "the identify card has no way past it: a skippable card is a card everyone skips");

/* ==================================================================
   2. off
   ================================================================== */
H.section("Off records nothing at all");

reset("off");
Analytics.begin();
exchange("a question", "an answer");
Analytics.track("doc", { id: "STD-010" });
H.eq(events().length, 0, "no event survives at level off");
H.eq(Analytics.isOn(), false, "the module reports itself as off");
H.eq(Analytics.disclosure(), "", "there is nothing to disclose when nothing is recorded");

/* ==================================================================
   3. counts
   ================================================================== */
H.section("Counts keeps the shape and drops everything else");

reset("counts");
Analytics.begin();
exchange("the customer's measured results", "Here is what I found…",
         { cited: ["STD-010", "TST-002"], withheld: [{ doc: { id: "TDA-3184" } }] });
Analytics.track("doc", { id: "TDA-3184" });

const c = events().find(e => e.k === "turn");
H.eq(c.i, "knowledge", "the intent is kept");
H.eq(c.src, 2, "the number of sources is kept");
H.eq(c.blk, 1, "the number withheld is kept");
H.eq(c.r, "Test Engineer, High Power", "the profile is kept");
H.eq(c.q, undefined, "the question is NOT kept");
H.eq(c.a, undefined, "the answer is NOT kept");
H.eq(c.cite, undefined, "the cited document ids are NOT kept");
H.eq(c.blkd, undefined, "the withheld document ids are NOT kept");
H.eq(events().find(e => e.k === "doc").did, undefined, "a document id is NOT kept");

/* ==================================================================
   4. detail
   ================================================================== */
H.section("Detail keeps our identifiers and nothing anyone typed");

reset("detail");
Analytics.begin();
exchange("the customer's measured results", "Here is what I found…",
         { cited: ["STD-010", "TST-002"], withheld: [{ doc: { id: "TDA-3184" } }] });
Analytics.track("doc", { id: "TDA-3184" });
Analytics.track("refused", { id: "TDA-3184", reason: "scope" });
Analytics.track("operator", { id: "sales", ev: "ask", field: "object" });
Analytics.track("task", { id: "report-draft", ev: "done", n: 9 });

const d = events().find(e => e.k === "turn");
H.eq(d.q, undefined, "the question is still NOT kept at detail");
H.eq(d.a, undefined, "the answer is still NOT kept at detail");
H.eq((d.cite || []).join(","), "STD-010,TST-002", "the cited documents ARE kept");
H.eq((d.blkd || []).join(","), "TDA-3184", "the withheld documents ARE kept");
H.eq(events().find(e => e.k === "refused").why, "scope", "the reason for a refusal IS kept");
H.eq(events().find(e => e.k === "operator").f, "object", "the field the Operator asked for IS kept");

const s = Analytics.summary();
H.eq(s.questions, 1, "the summary counts the exchange");
H.eq(s.withheld, 1, "the summary totals what was withheld");
H.eq(s.tasksDone, 1, "the summary counts finished guided tasks");
H.eq((s.docs[0] || {}).k, "STD-010", "the summary ranks the documents answered from");
H.eq((s.askedFor[0] || {}).k, "object", "the summary reports what the Operator had to ask for");
H.eq(Analytics.transcript().length, 0, "no transcript is available at detail");

/* ==================================================================
   5. full
   ================================================================== */
H.section("Full keeps both sides of the conversation");

reset("full");
Analytics.begin();
exchange("what duties does IEC 62271-100 require", "It requires the terminal fault duties…",
         { cited: ["STD-010"] });
exchange("and the short-line fault?", "Clause 7.105 covers that.", { cited: ["STD-010"] });

const f = events().filter(e => e.k === "turn");
H.eq(f.length, 2, "both exchanges are recorded");
H.eq(f[0].q, "what duties does IEC 62271-100 require", "the question IS kept");
H.eq(f[0].a, "It requires the terminal fault duties…", "the answer IS kept");

const tr = Analytics.transcript();
H.eq(tr.length, 1, "the exchanges group into one session");
H.eq(tr[0].turns.length, 2, "the session holds both exchanges in order");
H.eq(tr[0].turns[1].q, "and the short-line fault?", "the second question is second");

/* long text is truncated rather than stored whole */
reset("full");
Analytics.begin();
exchange("x".repeat(9000), "y".repeat(9000));
const big = events().find(e => e.k === "turn");
H.ok(big.q.length <= 4000, "a very long question is truncated");
H.ok(big.a.length <= 4000, "a very long answer is truncated");

/* ==================================================================
   6. who opened it
   ================================================================== */
H.section("The visit records the browser, and the gate records the person");

/* With identify off, the session opens at boot as it always did. */
reset("full");
Config.analytics.identify = "off";
Analytics.begin();
const visit = events().find(e => e.k === "visit");
H.ok(!!visit, "a visit is recorded at boot when no identity is demanded");
H.ok(!!visit.env, "the visit carries the browser environment");
H.eq(visit.env.lang, "en-GB", "the language is recorded");
H.eq(visit.env.screen, "1440x900", "the screen size is recorded");

/* ------------------------------------------------------------------
   Identity is a precondition, not a sheet of glass over the app.

   The report was showing "unidentified users" who had signed in with a
   role and sent no messages. The cause was here: the visit event was
   recorded and delivery started BEFORE the card was shown, so anybody
   who opened the link and walked away became a visitor record. These
   assertions exist so that cannot come back.
   ------------------------------------------------------------------ */
H.section("Nothing is recorded until we know who is looking");

reset("full");
Config.analytics.identify = "required";
H.eq(Analytics.blocked(), true, "with identity required and nobody identified, the app is blocked");

Analytics.begin();
H.eq(events().filter(e => e.k === "visit").length, 0,
  "no visit is recorded while the identity is outstanding");
H.eq(events().length, 0, "in fact nothing at all is recorded");

/* an event raised while blocked must not create a phantom visitor */
Analytics.track("signin", { role: "Mining Supervisor" });
H.eq(events().filter(e => e.k === "visit").length, 0,
  "a stray sign-in does not open a session on its own");

Analytics.identify("A. Rossi", "Streebo", "a.rossi@example.com");
H.eq(Analytics.blocked(), false, "once identified, the app is released");
H.eq(Analytics.who().name, "A. Rossi", "the name is kept");
H.eq(Analytics.who().company, "Streebo", "the organisation is kept");

const held = events().find(e => e.k === "visit");
H.ok(!!held, "the visit is recorded once identity is settled");
H.ok(!!held.who && held.who.name === "A. Rossi",
  "and it carries the identity, rather than arriving anonymously ahead of it");
H.ok(events().findIndex(e => e.k === "visit") < events().findIndex(e => e.k === "identify"),
  "the visit still opens the session, it is only delayed");

/* a second begin() must not open a second session */
Analytics.begin();
H.eq(events().filter(e => e.k === "visit").length, 1, "the session opens exactly once");

Config.analytics.identify = "off";

reset("detail");
Analytics.begin();
Analytics.identify("A. Rossi", "CESI", "a.rossi@example.com");
const payloadWho = JSON.parse(JSON.stringify({ x: 1 }));   /* keep lint honest */
H.ok(!!payloadWho, "");
H.eq(events().find(e => e.k === "identify").who, undefined,
  "at detail, who they are is not written into the event stream");

/* ==================================================================
   7. the disclosure follows the configuration
   ================================================================== */
H.section("The generated legal line is opt-in, and correct when it is on");

/* Off by default. A demonstration on invented data, briefed on the call,
   does not need a generated legal line, and the edition keeps whatever
   it wrote for the sign-in screen. */
reset("full", "https://example.invalid/c");
H.eq(Analytics.disclosure(), "",
  "nothing is generated unless the edition asks for it");
H.eq(declared.disclose, false, "the CESI edition ships with it off");

/* On, it has to say the right thing for the level it is on. */
function withDisclosure(level, endpoint) {
  reset(level, endpoint);
  Config.analytics.disclose = true;
  return Analytics.disclosure();
}
H.has(withDisclosure("detail", ""), "Nothing is sent anywhere",
  "with no endpoint it says nothing is sent");
H.has(withDisclosure("detail", "https://example.invalid/c"), "What you type is not recorded",
  "at detail it says the text is not recorded");
H.has(withDisclosure("detail", "https://example.invalid/c"), "Streebo",
  "it names who the data goes to");
H.has(withDisclosure("full", "https://example.invalid/c"), "what you type and what it answers",
  "at full it says the conversation is recorded");
H.eq(withDisclosure("off", "https://example.invalid/c"), "",
  "there is nothing to say when nothing is recorded");

/* ==================================================================
   7b. where the batches go
   ================================================================== */
/* Sends resolve on a microtask and one in flight blocks the next, so
   these cases yield between themselves the way a browser would. */
async function endpoints() {
  H.section("A relative endpoint resolves against the page it was served from");

  /* This is what lets the hosting team drop collect.php next to the html
     and be finished: no URL has to be known at build time. */
  Object.defineProperty(global, "location", {
    configurable: true, writable: true,
    value: { protocol: "https:", href: "https://demo.example.com/d/9f3a/sara_nbfc.html" },
  });

  const sentTo = async (endpoint) => {
    reset("detail", endpoint);
    Analytics.begin();
    await Promise.resolve();
    return posts.length ? posts[0].url : null;
  };

  H.eq(await sentTo("collect.php"), "https://demo.example.com/d/9f3a/collect.php",
    "a relative endpoint resolves beside the page, not at the site root");
  H.eq(await sentTo("collect.php?k=abc"), "https://demo.example.com/d/9f3a/collect.php?k=abc",
    "a secret on the query string survives resolution");
  H.eq(await sentTo("https://elsewhere.example.com/collect"), "https://elsewhere.example.com/collect",
    "an absolute endpoint is left exactly as written");

  /* A copy opened from disk has no collector beside it, and firing failed
     requests at a path that cannot exist is noise, not resilience. */
  location.protocol = "file:";
  location.href = "file:///C:/Users/x/Desktop/sara_nbfc.html";
  reset("full", "collect.php");
  Analytics.begin();
  for (let i = 0; i < 30; i++) { exchange("q" + i, "a" + i); await Promise.resolve(); }
  Analytics.flush();
  await Promise.resolve();
  H.eq(posts.length, 0, "a file:// copy sends nothing at all");
  H.ok(events().length > 0, "but it still records locally, so Settings, Usage still works");

  location.protocol = "https:";
  location.href = "https://demo.example.com/d/9f3a/sara_nbfc.html";
}

H.section("With no endpoint, nothing is ever dispatched");

reset("full");
Analytics.begin();
for (let i = 0; i < 60; i++) exchange("q" + i, "a" + i);
Analytics.flush();
H.eq(posts.length, 0, "no request is made when no endpoint is configured");
H.eq(outbox().length, 0, "and nothing is queued for sending");

H.section("With an endpoint it posts, and it posts to that one only");

/* Sends resolve on a microtask, so a synchronous burst produces one
   dispatch and then waits. Yield between phases, the way a browser
   does between keystrokes, rather than asserting mid-flight. */
async function delivery() {
  reset("full", "https://example.invalid/collect?k=secret");
  Analytics.begin();

  /* opening the link is reported straight away, so a visit that ends
     after ten seconds is still a visit you know about */
  await Promise.resolve();
  H.ok(posts.length >= 1, "opening the link reports the visit immediately");
  if (posts.length) {
    H.eq(JSON.parse(posts[0].opts.body).events[0].k, "visit", "the first thing sent is the visit");
  }

  for (let i = 0; i < 25; i++) { exchange("q" + i, "a" + i); await Promise.resolve(); }
  await Promise.resolve();
  Analytics.flush();
  await Promise.resolve();

  const withTurns = posts.map(p => JSON.parse(p.opts.body))
                         .filter(b => b.events.some(e => e.k === "turn"));
  H.ok(withTurns.length >= 1, "the exchanges are dispatched too (" + posts.length + " posts)");

  const body = withTurns[0];
  H.eq(posts[0].url, "https://example.invalid/collect?k=secret",
    "it posts to the configured endpoint and nowhere else");
  H.eq(posts[0].opts.headers["Content-Type"], "text/plain;charset=UTF-8",
    "it posts as text/plain, so a simple collector needs no CORS preflight");
  H.eq(body.edition, "nbfc", "the payload names the edition");
  H.eq(body.level, "full", "the payload states the level it was captured at");
  H.ok(!!body.visitor.id, "the payload carries a visitor id");
  H.ok(!!body.session.id, "the payload carries a session id");
  H.ok(body.events.some(e => e.q && e.a), "the payload carries both sides of the conversation");
  H.ok(body.events.every(e => !!e.id), "every event carries a unique id, so duplicates can be dropped");

  const allIds = posts.flatMap(p => JSON.parse(p.opts.body).events.map(e => e.id));
  H.eq(new Set(allIds).size, allIds.length, "no event id repeats across the batches");

  /* and at detail, the dispatched payload obeys the level too */
  reset("detail", "https://example.invalid/collect");
  Analytics.begin();
  for (let i = 0; i < 25; i++) { exchange("q" + i, "a" + i); await Promise.resolve(); }
  await Promise.resolve();
  Analytics.flush();
  await Promise.resolve();
  const sentAtDetail = posts.flatMap(p => JSON.parse(p.opts.body).events);
  H.eq(sentAtDetail.some(e => e.q !== undefined || e.a !== undefined), false,
    "at detail, no text leaves in the dispatched payload either");
}

async function retries() {
H.section("A failed send is retried, not lost");

reset("detail", "https://example.invalid/collect");
Analytics.begin();
failNext = 99;                       /* every attempt fails */
for (let i = 0; i < 25; i++) exchange("q" + i, "a" + i);
await Promise.resolve();
{
  H.ok(outbox().length > 0, "events that failed to send stay in the outbox (" + outbox().length + ")");

  /* and they go out on the next visit, days later */
  failNext = 0;
  posts = [];
  Analytics.flush();
  H.ok(posts.length >= 1, "the outbox is retried");

  H.section("The outbox cannot grow without limit");
  reset("counts", "https://example.invalid/collect");
  Analytics.begin();
  failNext = 9999;
  for (let i = 0; i < 900; i++) Analytics.track("doc", { id: "X" });
  H.ok(outbox().length <= 600, "the outbox is capped (" + outbox().length + ")");
  H.ok(events().length <= 4000, "the local history is capped (" + events().length + ")");

  /* ==================================================================
     9. export
     ================================================================== */
  H.section("It exports something a person can read");

  reset("full");
  Analytics.begin();
  exchange("what does a certificate cover", "The object tested, in the configuration tested.",
           { cited: ["CER-001"] });

  const json = JSON.parse(Analytics.toJson());
  H.eq(json.meta.edition, "nbfc", "the JSON export names the edition");
  H.eq(json.meta.level, "full", "the JSON export states the capture level");
  H.ok(Array.isArray(json.events), "the JSON export carries the events");

  const csv = Analytics.toCsv().split("\n");
  H.has(csv[0], "question", "the CSV has a question column");
  H.has(csv[0], "answer", "the CSV has an answer column");
  H.ok(csv.length >= 3, "the CSV has the events in it");

  /* a comma, a quote or a newline in an answer cannot break the file */
  reset("full");
  Analytics.begin();
  exchange('he said "yes, it failed"', "Line one,\nline two with \"quotes\"");
  const whole = Analytics.toCsv();
  H.eq((whole.match(/"/g) || []).length % 2, 0, "quotes across the whole file are balanced");
  H.has(whole, '"Line one,\nline two', "a newline inside a value is quoted, not left to split the row");

}
}

endpoints().then(delivery).then(retries).then(async function () {
  /* ==================================================================
     10. what went into and came out of a run
     ================================================================== */
  H.section("A use case and an Operator run carry their inputs and outputs");

  reset("full");
  Analytics.begin();
  Analytics.track("task", { id: "non-conformity", ev: "done", n: 7,
    title: "Raise a non-conformity",
    inputs: { campaign: "TO-31842", kind: "Test object did not meet the criterion",
              affected: false, when: ["From cold", "At speed"] },
    output: "Non-conformity: TO-31842\n\nClassification: ..." });
  Analytics.track("operator", { id: "sales", ev: "done", n: 11,
    title: "Quote a test programme and hold the assets",
    inputs: { customer: "Nordwind Schaltanlagen", site: "Milan" },
    output: "1. Open Sales Cloud\n2. Open the opportunity" });

  const task = events().find(e => e.k === "task");
  const run = events().find(e => e.k === "operator");
  H.eq(task.ttl, "Raise a non-conformity", "the use case is recorded by name, not just its id");
  H.eq(task.in.campaign, "TO-31842", "a text answer is kept");
  H.eq(task.in.affected, "No", "a yes/no answer is kept readably rather than as a boolean");
  H.eq(task.in.when, "From cold, At speed", "a multiple choice is kept as a readable list");
  H.has(task.out, "Non-conformity: TO-31842", "the produced record is kept");
  H.eq(run.ttl, "Quote a test programme and hold the assets", "the Operator run is recorded by name");
  H.eq(run.in.site, "Milan", "the parameters the run was given are kept");
  H.has(run.out, "Open Sales Cloud", "the steps it performed are kept");

  /* a very long answer cannot fill the browser's storage */
  reset("full");
  Analytics.begin();
  Analytics.track("task", { id: "x", ev: "done", inputs: { note: "y".repeat(2000) },
                            output: "z".repeat(9000) });
  const big2 = events().find(e => e.k === "task");
  H.ok(big2.in.note.length <= 600, "one answer cannot run away with the record");
  H.ok(big2.out.length <= 4000, "nor can one produced document");

  /* and none of it leaves at detail, because it is what a person typed */
  reset("detail");
  Analytics.begin();
  Analytics.track("task", { id: "non-conformity", ev: "done", title: "Raise a non-conformity",
                            inputs: { campaign: "TO-31842" }, output: "..." });
  const dTask = events().find(e => e.k === "task");
  H.eq(dTask.did, "non-conformity", "the use case is still identified at detail");
  H.eq(dTask.in, undefined, "but what was typed into it is not kept");
  H.eq(dTask.out, undefined, "and neither is what came out");
  H.eq(dTask.ttl, undefined, "nor the title, which can carry a customer name");

  /* ==================================================================
     11. how much was said
     ================================================================== */
  H.section("Message count is a count of both sides");

  reset("full");
  Analytics.begin();
  exchange("one", "a"); exchange("two", "b"); exchange("three", "c");
  const sm = Analytics.summary();
  H.eq(sm.questions, 3, "three questions");
  H.eq(sm.messages, 6, "six messages, because each exchange is two");

  /* ==================================================================
     12. one collector, many prospects
     ================================================================== */
  H.section("Every batch says which demo it came from");

  reset("detail", "https://example.invalid/collect");
  Config.analytics.label = "CESI";
  Analytics.begin();
  await Promise.resolve();
  const labelled = JSON.parse(posts[0].opts.body);
  H.eq(labelled.label, "CESI", "the label rides along in the payload");
  H.eq(labelled.edition, "nbfc", "so does the edition, as a fallback");

  reset("detail", "https://example.invalid/collect");
  Config.analytics.label = "";
  Analytics.begin();
  await Promise.resolve();
  H.eq(JSON.parse(posts[0].opts.body).label, "nbfc",
    "an unlabelled build still identifies itself by edition");

  /* ==================================================================
   how the routing was decided
   ------------------------------------------------------------------
   The deterministic classifier is the product's claim to work with no
   API key at all. Nothing was counting how often it was enough, which
   made it the one claim in the room with no number behind it.
   ================================================================== */
H.section("The usage panel counts how much routing needed no model");

Analytics.clear();
Analytics.identify({ name: "Test", org: "Streebo", email: "t@example.com" });

const DECISIONS = [
  { intent: "knowledge", target: null, source: "rules" },
  { intent: "knowledge", target: null, source: "rules" },
  { intent: "operator", target: "collections", source: "rules" },
  { intent: "task", target: "foreclosure_quote", source: "rules" },
  { intent: "knowledge", target: null, source: "llm" },
];
DECISIONS.forEach((dec, i) => {
  Analytics.turn("question " + i, { text: "answer " + i, sources: [], decision: dec },
                 { role: "central_ops", ms: 400 });
});

const sum = Analytics.summary();
H.eq(sum.questions, 5, "five exchanges recorded");
H.eq(sum.ruleRouted, 4, "four of them were routed with no model call");
H.ok(sum.routedBy.some(x => x.k === "rules" && x.n === 4), "the tally names the rules path");
H.ok(sum.routedBy.some(x => x.k === "llm" && x.n === 1), "and the model path");

/* it has to reach the panel and the export, or it is a number nobody
   can see and nobody can check afterwards */
H.has(Analytics.paneMarkup(), "routed with no model call", "the panel says so in words");
H.has(Analytics.toCsv(), "routed by", "the export carries the column");
H.has(Analytics.toCsv(), "rules", "and the value");

/* ==================================================================
   who the identify gate says this build is for
   ------------------------------------------------------------------
   A build made for one named prospect says so, and should. A
   whole-sector build must not: its tenant is invented, so naming it
   would not merely be vague, it would be wrong, and telling a reader
   the demonstration was prepared for a company they have never heard
   of makes it look like somebody else's, forwarded on.
   ================================================================== */
H.section("The gate does not claim this build was made for the reader");

/* against the DECLARED config: this suite swaps Config.analytics for its
   own while exercising the levels, so the live object is whatever the
   last case left behind */
H.eq(declared.audience, "sector", "the edition declares itself a sector build");
H.ok(!!declared.sectorLabel, "and says which sector, so the sentence reads");

/* There is no real DOM here to render the gate into, so the assertions
   are against the source of the sentence. What has to hold is that
   neither the tenant's name nor the per-prospect claim can reach a
   sector build at all. */
const src = require("fs").readFileSync(
  require("path").join(__dirname, "..", "src", "47-analytics.js"), "utf8");
const gateFn = src.slice(src.indexOf("const sector = c.audience"), src.indexOf("document.body.appendChild(wrap)"));

H.ok(gateFn.indexOf("prepared specifically for") !== -1,
  "the per-prospect wording still exists for the editions that need it");
const sectorBranch = gateFn.slice(0, gateFn.indexOf(": \"This demonstration of \""));
H.ok(sectorBranch.indexOf("Config.company.name") === -1,
  "the sector wording never names the tenant");
H.ok(sectorBranch.indexOf("rather than for any one company") !== -1,
  "and says plainly that it was not built for one");
H.ok(gateFn.indexOf('sector ? "your organisation"') !== -1,
  "the organisation placeholder does not offer the invented tenant");
H.ok(gateFn.indexOf('"name@yourcompany.com"') !== -1,
  "and neither does the email placeholder");

/* the name itself: a tenant that collides with a real lender turns
   invented policy failures into statements about a real company */
H.ok(/kritanya/i.test(Config.company.name), "the tenant is the renamed one");
H.ok(!/anvira/i.test(JSON.stringify(Config.company)), "and no trace of the old name is left in the identity block");

H.report("SARA usage analytics");
});
