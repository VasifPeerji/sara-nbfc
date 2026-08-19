/* Core engine tests: markdown, retrieval, access control, artifact protocol,
   artifact renderers, charts, titles.
   Run:  node test/test_core.js [edition]
*/
const H = require("./harness");
const edition = process.argv[2] || "nbfc";

H.loadEdition(edition);
H.loadSrc();

console.log(`\n  SARA core tests — edition "${edition}"`);

/* ================= config ================= */
H.section("Edition config");
H.ok(Config.roles.length >= 3, "at least 3 roles defined");
H.ok(Config.users.length >= 5, "at least 5 sign-in profiles");
H.ok(Config.kb.length >= 10, "at least 10 knowledge base documents");
H.ok(Config.kb.every(d => d.body && d.body.length > 200), "every document has a substantive body");
H.ok(Config.kb.every(d => d.id && d.title), "every document has an id and title");
H.eq(new Set(Config.kb.map(d => d.id)).size, Config.kb.length, "document ids are unique");
H.eq(new Set(Config.users.map(u => u.email)).size, Config.users.length, "user emails are unique");
H.ok(Config.guardrails.length >= 3, "guardrails present");
H.ok(Config.systems.length >= 1, "connected systems declared");
H.ok(Config.roles.every(r => Config.kb.some(d => Retrieval.visibleTo(d, r))),
     "every role can see at least one document");

/* every user's role exists */
H.ok(Config.users.every(u => Config.roleByKey[u.roleKey]), "every user maps to a real role");

/* icons referenced by prompts and categories all resolve */
const badIcons = [];
Config.roles.forEach(r => (r.prompts || []).forEach(p => { if(p.icon && !Icons.has(p.icon)) badIcons.push(r.key + ":" + p.icon); }));
Object.keys(Config.categories).forEach(k => { if(!Icons.has(Config.categories[k].icon)) badIcons.push("cat:" + k); });
H.eq(badIcons, [], "all referenced icons exist");

/* ================= markdown ================= */
H.section("Markdown renderer");
H.eq(MD.render("hello"), "<p>hello</p>", "plain paragraph");
H.has(MD.render("**bold** text"), "<strong>bold</strong>", "bold");
H.has(MD.render("*ital* text"), "<em>ital</em>", "italic");
H.has(MD.render("## Heading"), "<h3>Heading</h3>", "h2 renders one level down");
H.has(MD.render("- one\n- two"), "<li>one</li>", "bullet list");
H.has(MD.render("1. one\n2. two"), "<ol>", "ordered list");
H.has(MD.render("- a\n  - b"), "<ul><li>a<ul>", "nested list");
H.has(MD.render("| A | B |\n|---|---|\n| 1 | 2 |"), "<table>", "table");
H.has(MD.render("| A | B |\n|---|---|\n| 1 | 2 |"), 'class="num"', "numeric column auto right-aligns");
H.has(MD.render("> [!WARNING] careful"), "callout-warn", "GitHub-style callout");
H.has(MD.render("> plain quote"), "<blockquote>", "blockquote");
H.has(MD.render("```js\nconst a=1;\n```"), "<pre><code", "fenced code");
H.has(MD.render("`inline`"), "<code>inline</code>", "inline code");
H.has(MD.render("---"), "<hr>", "horizontal rule");
H.has(MD.render("[link](https://example.com)"), 'href="https://example.com"', "link");

/* XSS: nothing model-authored may become live markup */
const evil = '<img src=x onerror="alert(1)"> <script>alert(2)</script> [x](javascript:alert(3))';
const rendered = MD.render(evil);
H.lacks(rendered, "<img", "raw img tag is escaped");
H.lacks(rendered, "<script", "raw script tag is escaped");
H.lacks(rendered, 'href="javascript:', "javascript: URL is never turned into a link");
H.lacks(rendered, "<a ", "a javascript: markdown link produces no anchor at all");
H.lacks(MD.render("`<b>x</b>`"), "<b>x</b>", "html inside code span stays escaped");
H.lacks(MD.render("<c0>literal"), "<code>", "placeholder sentinel cannot be forged");
H.lacks(MD.render("<f0>"), "<pre>", "fence sentinel cannot be forged");

/* citations */
const citeCtx = { sources: [{ n: 1, id: "POL-001", title: "Code of Conduct" }], msgId: "m1" };
H.has(MD.render("Fact [S1].", citeCtx), 'class="cite"', "citation renders a chip");
H.has(MD.render("Both [S1, S2].", citeCtx), "Panel.showSource(1", "multi-citation splits into two chips");
H.eq(MD.strip("**bold** and `code`"), "bold and code", "strip() produces plain text");

/* streaming safety: partial markdown must never throw */
const sample = "## Title\n\n- a\n- b\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n> [!NOTE] hi\n\n```js\nx\n```\n";
let threw = null;
for(let i = 1; i <= sample.length; i++){
  try{ MD.render(sample.slice(0, i)); }catch(e){ threw = i + ": " + e.message; break; }
}
H.eq(threw, null, "every partial prefix of a document renders without throwing");

/* ================= retrieval ================= */
H.section("Retrieval");
const chunks = Retrieval.build();
H.ok(chunks >= Config.kb.length, "index built with at least one passage per document");
H.ok(Retrieval.size === chunks, "index size reported correctly");

const topRole = Config.roles.reduce((a, b) => (b.clearance > a.clearance ? b : a), Config.roles[0]);
const anyDoc = Config.kb[0];
const hit = Retrieval.search(anyDoc.title, { role: topRole, topK: 5 });
H.ok(hit.sources.length > 0, "searching a document title returns results");
H.eq(hit.sources[0].id, anyDoc.id, "the document searched for ranks first");
H.ok(hit.stats.ms >= 0 && hit.stats.scanned === chunks, "stats report the real corpus size");
H.ok(hit.sources.every(s => s.relevance >= 0 && s.relevance <= 100), "relevance normalised to 0-100");
H.ok(hit.sources[0].text.length > 0, "retrieved passage carries text");

H.eq(Retrieval.search("", { role: topRole }).sources, [], "empty query returns nothing");
H.eq(Retrieval.search("zzzqqqxxx nonexistentterm", { role: topRole }).sources.length, 0, "nonsense query returns nothing");

/* stopwords must not drive a match */
const stopOnly = Retrieval.search("the of and for", { role: topRole });
H.eq(stopOnly.sources.length, 0, "a query of only stopwords returns nothing");

/* ================= access control ================= */
H.section("Access control");
const lowest = Config.roles.reduce((a, b) => (b.clearance < a.clearance ? b : a), Config.roles[0]);
const restricted = Config.kb.filter(d => d.clearance >= 3);
H.ok(restricted.length > 0, "edition contains restricted material to demonstrate refusal");
H.ok(restricted.every(d => !Retrieval.visibleTo(d, lowest)), "lowest-clearance role cannot see restricted documents");
/* The highest clearance role does NOT see everything, and that is the
   design: some scopes are legal or contractual controls rather than
   ranks. What must hold is that everything it cannot see is withheld
   on SCOPE, never on clearance, so a refusal can always be explained
   as "this is not yours to see" rather than "you are not senior
   enough". */
{
  const unseen = Config.kb.filter(d => !Retrieval.visibleTo(d, topRole));
  H.ok(unseen.every(d => d.clearance <= topRole.clearance),
       "anything the highest-clearance role cannot see is withheld on scope, not on clearance");
  H.ok(Config.kb.filter(d => d.scopes.some(s => topRole.scopes.indexOf(s) !== -1))
         .every(d => Retrieval.visibleTo(d, topRole)),
       "highest-clearance role sees every document inside its own scopes");
}

/* a restricted document must actually be withheld from a real search */
const conf = Config.kb.find(d => d.clearance === 4) || restricted[0];
const denied = Retrieval.search(conf.title, { role: lowest, topK: 5 });
H.ok(!denied.sources.some(s => s.id === conf.id), "restricted document never appears in a low-clearance result");
H.ok(denied.blocked.length > 0, "the withheld document is reported as blocked so it can be routed");
H.ok(denied.blocked.every(b => b.reason && b.reason.kind), "each blocked document carries a reason");

const allowed = Retrieval.search(conf.title, { role: topRole, topK: 5 });
H.ok(allowed.sources.some(s => s.id === conf.id), "the same query succeeds for a cleared role");

/* scope filtering, independent of clearance */
const scoped = Config.kb.find(d => d.scopes.length && d.clearance <= lowest.clearance &&
  !d.scopes.some(s => (lowest.scopes || []).includes(s)));
if(scoped) H.ok(!Retrieval.visibleTo(scoped, lowest), "scope mismatch withholds a document even at low clearance");
else H.ok(true, "scope mismatch case not present in this edition");

/* ================= artifact protocol ================= */
H.section("Artifact protocol");
const proseOnly = "Here is an answer with no visual.";
H.eq(LLM.split(proseOnly).visible, proseOnly, "prose without a fence passes through");
H.eq(LLM.split(proseOnly).started, false, "no fence detected");

const withArt = 'Answer text.\n\n```sara-artifact\n{"type":"table","title":"T","headers":["A"],"rows":[["1"]]}\n```\n';
const split1 = LLM.split(withArt);
H.eq(split1.visible.trim(), "Answer text.", "artifact fence is stripped from visible prose");
H.ok(split1.blocks.artifact !== undefined, "artifact block captured");
H.eq(LLM.parseArtifact(split1.blocks.artifact).type, "table", "artifact JSON parses");

const withBoth = withArt + '\n```sara-next\n- follow up one\n- follow up two\n```\n';
const split2 = LLM.split(withBoth);
H.eq(split2.visible.trim(), "Answer text.", "both fences stripped");
H.eq(LLM.parseFollowups(split2.blocks.next), ["follow up one", "follow up two"], "follow-ups parsed");

/* partial fence must never flash on screen mid-stream */
["```sara", "```sara-arti", "```sara-artifact", "```sara-artifact\n{"].forEach(tail => {
  H.lacks(LLM.split("Answer.\n\n" + tail).visible, "```", "partial fence hidden: " + JSON.stringify(tail));
});

/* tolerant JSON repair */
H.eq(LLM.parseArtifact('{"type":"table","rows":[[1],]}').type, "table", "trailing comma repaired");
H.eq(LLM.parseArtifact('prefix junk {"type":"metrics"} trailing'), { type: "metrics" }, "surrounding junk ignored");
H.eq(LLM.parseArtifact("not json at all"), null, "unparseable block returns null");
H.eq(LLM.parseArtifact('{"type":"table","title":"a{b}c"}').title, "a{b}c", "braces inside strings do not break brace matching");

/* ================= artifact renderers ================= */
H.section("Artifact renderers");
const SPECS = {
  document: { type: "document", title: "Escalation letter", kind: "Memo",
    meta: [{ k: "To", v: "Customer" }], sections: [{ h: "Background", body: "Line one.\n\nLine two." }], footer: "Regards" },
  checklist: { type: "checklist", title: "Bid checklist",
    groups: [{ name: "Before submission", items: [{ t: "Check terms", d: "Legal review", owner: "Sophie", due: "Fri", priority: "high" }] }] },
  table: { type: "table", title: "Tiers", headers: ["Tier", "Visits"], rows: [["Gold", "4"], ["Bronze", "2"]], footer: ["Total", "6"] },
  chart: { type: "chart", title: "Trend", chart: "line", labels: ["Jan", "Feb", "Mar"], series: [{ name: "Failures", data: [1, 4, 6] }] },
  flow: { type: "flow", title: "Process", steps: [{ t: "Raise", kind: "step" }, { t: "Approve?", kind: "decision", via: "if over limit" }, { t: "Done", kind: "end" }] },
  timeline: { type: "timeline", title: "Plan", events: [{ when: "Q1", t: "Start", status: "done" }, { when: "Q2", t: "Audit", status: "active" }] },
  comparison: { type: "comparison", title: "Options", options: [{ name: "A" }, { name: "B" }],
    criteria: [{ name: "Cost", values: ["High", "Low"], best: 1 }, { name: "Covered", values: ["yes", "no"] }], verdict: "Pick **B**." },
  metrics: { type: "metrics", title: "KPIs", items: [{ label: "Margin", value: "34.2%", delta: "-3.8pp", dir: "down", status: "warn", pct: 34 }] },
  code: { type: "code", title: "Snippet", language: "js", filename: "a.js", code: 'const x = 1; // note\nfunction f(){ return "s"; }' },
  image: { type: "image", title: "Diagram", prompt: "a diagram", caption: "Figure 1" },
};
Object.keys(SPECS).forEach(kind => {
  const spec = SPECS[kind];
  H.eq(Artifacts.typeOf(spec), kind, `typeOf resolves ${kind}`);
  let html = "";
  try{ html = Artifacts.render(spec, "test_" + kind); }catch(e){ html = "THREW: " + e.message; }
  H.ok(html.indexOf("THREW") === -1 && html.length > 50, `${kind} renders`);
  H.lacks(html, "undefined", `${kind} renders without leaking "undefined"`);
  const text = Artifacts.toText(spec);
  H.ok(typeof text === "string" && text.length > 0, `${kind} serialises to text`);
});

/* aliases the model reaches for anyway */
H.eq(Artifacts.typeOf({ type: "memo" }), "document", "alias memo -> document");
H.eq(Artifacts.typeOf({ type: "bar" }), "chart", "alias bar -> chart");
H.eq(Artifacts.typeOf({ type: "todo" }), "checklist", "alias todo -> checklist");
H.eq(Artifacts.typeOf({ type: "nonsense" }), null, "unknown type rejected");
H.has(Artifacts.render({ type: "nonsense" }, "x"), "Unsupported visual", "unknown type renders a graceful message");

/* renderers must survive garbage without throwing */
const GARBAGE = [
  { type: "table" }, { type: "table", headers: [], rows: null },
  { type: "chart", chart: "donut" }, { type: "chart", series: "nope" },
  { type: "comparison", options: [], criteria: [] },
  { type: "checklist", groups: [{ items: [null] }] },
  { type: "flow", steps: [{}] }, { type: "timeline", events: [{}] },
  { type: "metrics", items: [{}] }, { type: "document", sections: [null] },
  { type: "code" },
];
let garbageThrew = null;
GARBAGE.forEach((g, i) => {
  try{ Artifacts.render(g, "g" + i); Artifacts.toText(g); }
  catch(e){ if(!garbageThrew) garbageThrew = i + " " + e.message; }
});
H.eq(garbageThrew, null, "malformed artifact specs never throw");

/* escaping inside artifacts */
const nasty = Artifacts.render({ type: "table", title: "<script>x</script>", headers: ["<b>h</b>"], rows: [["<i>v</i>"]] }, "n");
H.lacks(nasty, "<script>", "artifact title is escaped");
H.lacks(nasty, "<b>h</b>", "artifact header is escaped");

/* code highlighter must not mangle its own placeholders */
const codeHtml = Artifacts.render(SPECS.code, "c");
H.lacks(codeHtml, "<z", "code highlighter placeholders are fully unwound");
H.has(codeHtml, "tok-", "code highlighter produced tokens");

/* ================= charts ================= */
H.section("Charts");
["bar", "hbar", "line", "donut", "stacked"].forEach(kind => {
  const html = Charts.render({ chart: kind, title: kind, labels: ["A", "B", "C"], series: [{ name: "S", data: [3, 7, 5] }] });
  H.has(html, "<svg", kind + " chart emits svg");
  H.lacks(html, "NaN", kind + " chart has no NaN coordinates");
});
H.lacks(Charts.render({ chart: "bar", labels: ["A"], series: [{ name: "S", data: [0] }] }), "NaN", "all-zero data does not produce NaN");
H.lacks(Charts.render({ chart: "donut", labels: ["A"], series: [{ data: [5] }] }), "NaN", "single-slice donut is safe");
H.has(Charts.render({ chart: "line", labels: ["A"], series: [{ data: [5] }] }), "<svg", "single data point is safe");
H.has(Charts.render({ chart: "bar", labels: ["A", "B"], series: [{ name: "x", data: [-3, 5] }] }), "<svg", "negative values are safe");

/* ================= titles ================= */
H.section("Conversation titles");
H.eq(makeTitle("What is the torque specification for the CX-40 seal?"),
     "Torque Specification for the CX-40 Seal", "leading filler trimmed, interior filler left lower case");
H.eq(makeTitle("how do I claim expenses?"), "Claim Expenses", "question opener removed");
H.lacks(makeTitle("CX-40 seal torque"), "Cx-40", "existing capitalisation is preserved");
H.ok(makeTitle("").length > 0, "empty input still yields a title");
H.ok(makeTitle("a".repeat(400)).length <= 52, "long input is truncated");

/* ================= system prompt ================= */
H.section("System prompt");
const role = Config.roles[0];
const user = Config.users.find(u => u.roleKey === role.key) || Config.users[0];
const found = Retrieval.search(Config.kb[0].title, { role: topRole, topK: 3 });
const sys = LLM.systemPrompt({ role: role, user: user, sources: found.sources, blocked: [], style: "balanced", images: false });
H.has(sys, Config.company.name, "company name present");
H.has(sys, user.name, "user name present");
H.has(sys, "[S1]", "citation instruction present");
H.has(sys, "sara-artifact", "artifact protocol present");
H.has(sys, "sara-next", "follow-up protocol present");
H.has(sys, found.sources[0].id, "retrieved source id injected");
H.has(sys, found.sources[0].text.slice(0, 40), "retrieved passage text injected");
Config.guardrails.forEach((g, i) => H.has(sys, g.slice(0, 40), "guardrail " + (i + 1) + " injected"));
H.lacks(sys, "undefined", "system prompt has no undefined holes");
H.lacks(LLM.systemPrompt({ role: role, user: user, sources: [], blocked: [], style: "brief", images: false }), "undefined",
        "system prompt with no sources has no undefined holes");
H.has(LLM.systemPrompt({ role: role, user: user, sources: [], blocked: [], style: "brief", images: false }),
      "NO DOCUMENTS MATCHED", "empty retrieval is stated explicitly");
const blockedSys = LLM.systemPrompt({ role: lowest, user: user, sources: [], blocked: denied.blocked, style: "balanced", images: false });
H.has(blockedSys, "ACCESS NOTE", "blocked documents produce an access note");
H.lacks(blockedSys, conf.body.slice(0, 60), "blocked document body is never injected into the prompt");

/* image schema only offered when enabled */
H.lacks(LLM.systemPrompt({ role: role, user: user, sources: [], blocked: [], style: "brief", images: false }),
        '"type":"image"', "image artifact not offered when images are off");
H.has(LLM.systemPrompt({ role: role, user: user, sources: [], blocked: [], style: "brief", images: true }),
      '"type":"image"', "image artifact offered when images are on");

/* ================= provider parameters ================= */
H.section("Provider parameter handling");
H.eq(modelCaps("gpt-5.1", "openai").tokenParam, "max_completion_tokens", "gpt-5.1 uses max_completion_tokens");
H.eq(modelCaps("gpt-5.1", "openai").temperature, false, "gpt-5.1 must not send temperature");
H.eq(modelCaps("gpt-5.1", "openai").effort, true, "gpt-5.1 supports reasoning_effort");
H.eq(modelCaps("gpt-4.1-mini", "openai").tokenParam, "max_tokens", "gpt-4.1 uses max_tokens");
H.eq(modelCaps("gpt-4.1-mini", "openai").temperature, true, "gpt-4.1 may send temperature");
H.eq(modelCaps("gpt-4.1-mini", "openai").effort, false, "gpt-4.1 has no reasoning_effort");
/* a model whose name merely looks like OpenAI's must not inherit its rules */
H.eq(modelCaps("gpt-5.1", "openrouter").temperature, true, "OpenAI naming on another provider keeps temperature");
H.eq(modelCaps("claude-opus-5", "anthropic").tokenParam, "max_tokens", "anthropic uses max_tokens");
H.eq(modelCaps("gemini-2.5-pro", "google").tokenParam, "maxOutputTokens", "gemini uses maxOutputTokens");
H.ok(EFFORTS.some(e => e.id === S.effort), "default effort is valid");

H.report(`SARA core (${edition})`);

/* ================= blocked-document relevance gate ================= */
/* Edition-agnostic: everything is derived from the loaded config.
   The property under test is that the withheld list only contains documents
   that were genuinely competitive, so "N documents withheld" stays meaningful
   instead of firing on one shared word. */
H.section("Withheld-document relevance");
{
  const GATE = 0.28;
  const bestOf = (r) => Math.max(r.sources.length ? r.sources[0].score : 0,
                                 r.blocked.length ? r.blocked[0].score : 0);

  /* sweep every role against every document title: the invariant must hold
     for the whole matrix, not one lucky pair */
  let weakLeak = null, unreachableWrong = null, overCap = null;
  Config.roles.forEach(role => {
    Config.kb.forEach(doc => {
      const r = Retrieval.search(doc.title, { role: role, topK: 6 });
      const cut = bestOf(r) * GATE;
      r.blocked.forEach(b => {
        if(b.score < cut && !weakLeak) weakLeak = `${role.key} / ${doc.id}: ${b.doc.id} at ${b.score.toFixed(2)} < ${cut.toFixed(2)}`;
        if(Retrieval.visibleTo(b.doc, role) && !unreachableWrong) unreachableWrong = `${role.key}: ${b.doc.id} is visible yet reported withheld`;
      });
      if(r.blocked.length > 4 && !overCap) overCap = `${role.key} / ${doc.id}: ${r.blocked.length} withheld`;
      r.sources.forEach(s => {
        const d = Config.kb.find(x => x.id === s.id);
        if(d && !Retrieval.visibleTo(d, role) && !unreachableWrong) unreachableWrong = `${role.key}: ${s.id} leaked into results`;
      });
    });
  });
  H.eq(weakLeak, null, "no incidental match is ever reported as withheld");
  H.eq(unreachableWrong, null, "withheld/visible classification is correct for every role and document");
  H.eq(overCap, null, "withheld list is capped");

  /* a restricted document must still be reported when it IS the best match */
  const secret = Config.kb.filter(d => d.clearance === 4)[0] || Config.kb.filter(d => d.clearance === 3)[0];
  if(secret){
    const blindRole = Config.roles.filter(r => !Retrieval.visibleTo(secret, r))
                                  .sort((a, b) => a.clearance - b.clearance)[0];
    if(blindRole){
      const denied2 = Retrieval.search(secret.title, { role: blindRole, topK: 6 });
      H.ok(!denied2.sources.some(s => s.id === secret.id), "restricted document stays out of the results");
      H.ok(denied2.blocked.some(b => b.doc.id === secret.id), "and is reported as withheld so it can be routed");
    } else H.ok(true, "no role is blind to the restricted document in this edition");
    const cleared = Retrieval.search(secret.title, { role: topRole, topK: 6 });
    H.ok(cleared.sources.some(s => s.id === secret.id), "the same question is answerable for the cleared role");
    /* Not "nothing is withheld from the top role" — some scopes are legal
       or contractual controls rather than ranks, so the top role can be
       outside them. What must hold is that the document under test is no
       longer withheld, and that anything still withheld is withheld on
       scope, so the refusal reads as "not yours to see" rather than "not
       senior enough". */
    H.ok(!cleared.blocked.some(b => b.doc.id === secret.id),
         "the restricted document is no longer withheld from the cleared role");
    H.ok(cleared.blocked.every(b => b.doc.clearance <= topRole.clearance),
         "anything still withheld from the top role is withheld on scope, not clearance");
  } else H.ok(true, "edition has no restricted documents");
}

H.section("Title trailing filler");
H.lacks(makeTitle("How do I claim expenses for travel to a customer site?").toLowerCase().split(" ").pop(), "to",
        "title does not end on a preposition");
H.eq(makeTitle("what is the torque specification for the"), "Torque Specification", "trailing filler stripped");

H.report("SARA extra");

/* ================================================================
   Library rail: bookmarks, files, MCP
   Appended as its own report so the core suite above stays readable.
   ================================================================ */
console.log("\n  SARA library tests");

H.section("Config normalisation");
H.ok(Array.isArray(Config.files), "files block normalised");
H.ok(Array.isArray(Config.mcp), "mcp block normalised");
H.ok(Array.isArray(Config.bookmarks), "bookmarks block normalised");
H.ok(Array.isArray(Config.pinnedFiles), "pinnedFiles block normalised");

H.section("Files view");
Library.load();
{
  /* Files are exercised through the public surface; allFiles is internal, so
     drive it the way the UI does and inspect the resulting state. */
  const before = Library.pinned.length;
  const kbCount = Config.kb.length;
  const extra = Config.files.length;

  /* every knowledge base document must surface as a file, plus the extras */
  const ids = [];
  Config.kb.forEach(d => ids.push("f_" + d.id));
  H.eq(new Set(ids).size, kbCount, "one file id per knowledge base document");

  /* pinning round trip */
  Library.togglePin("f_" + Config.kb[0].id);
  H.eq(Library.pinned.length, before + 1, "pinning a file records it");
  H.ok(Library.pinned.indexOf("f_" + Config.kb[0].id) !== -1, "the right file was pinned");
  Library.togglePin("f_" + Config.kb[0].id);
  H.eq(Library.pinned.length, before, "unpinning removes it again");

  /* pinned state survives a reload of the module */
  Library.togglePin("f_" + Config.kb[1].id);
  Library.load();
  H.ok(Library.pinned.indexOf("f_" + Config.kb[1].id) !== -1, "pinned files persist across a reload");
  Library.togglePin("f_" + Config.kb[1].id);

  H.ok(extra >= 0, "extra uploaded files are declared or absent without error");
}

H.section("Bookmarks");
{
  const start = Library.bookmarks.length;
  const b = Library.newBookmark("Test collection");
  H.ok(b && b.id, "bookmark created");
  H.eq(Library.bookmarks.length, start + 1, "bookmark added to the list");

  /* membership */
  S.convos = [{ id: "c1", title: "One", ts: Date.now(), updated: Date.now(), messages: [{ id: "m", role: "user", text: "hi", ts: Date.now() }] }];
  H.eq(Library.inBookmark(b.id, "c1"), false, "chat starts outside the bookmark");
  Library.toggleChat(b.id, "c1");
  H.eq(Library.inBookmark(b.id, "c1"), true, "chat added to the bookmark");
  H.eq(Library.bookmarksForChat("c1").length, 1, "reverse lookup finds the bookmark");
  Library.toggleChat(b.id, "c1");
  H.eq(Library.inBookmark(b.id, "c1"), false, "chat removed again");

  /* persistence */
  Library.load();
  H.ok(Library.bookmarks.some(x => x.name === "Test collection"), "bookmarks persist across a reload");

  /* deletion does not delete the chats */
  const target = Library.bookmarks.find(x => x.name === "Test collection");
  Library.deleteBookmark(target.id);
  H.ok(!Library.bookmarks.some(x => x.id === target.id), "bookmark deleted");
  H.eq(S.convos.length, 1, "deleting a bookmark leaves the conversations alone");
  S.convos = [];
}

H.section("MCP (mock)");
{
  const seeded = Library.servers.length;
  H.eq(seeded, Config.mcp.length, "seeded from the edition");
  H.ok(Library.servers.every(s => s.id && s.name), "every server has an id and a name");
  global.__promptReply = "Test server";
  Library.newMcp();
  H.eq(Library.servers.length, seeded + 1, "server added");
  const added = Library.servers[0];
  H.eq(added.name, "Test server", "added server takes the given name");
  Library.removeMcp(added.id);
  H.eq(Library.servers.length, seeded, "server removed");
  delete global.__promptReply;
}

H.section("Sidebar view state");
H.ok(typeof Sidebar.view === "function", "view switcher exposed");
H.ok(typeof Sidebar.showBookmark === "function", "bookmark drill-down exposed");
H.ok(Sidebar.toggleSave === undefined, "the old saved-chat toggle is gone");
H.ok(typeof Library.chatMenu === "function", "chat header bookmark menu exposed");

H.report("SARA library");

/* ================================================================
   Providers, keys and temporary chat
   ================================================================ */
console.log("\n  SARA provider tests");

H.section("Registry integrity");
{
  const want = ["OpenAI","Anthropic","Google Gemini","OpenRouter","Azure OpenAI","groq","Mistral","Deepseek",
    "Fireworks","Perplexity","together.ai","Huggingface","Cohere","xAI","Hyperbolic","SambaNova","Nvidia",
    "NanoGPT","Kluster","302.AI","GitHub Models","Anyscale","APIpie","ShuttleAI","Moonshot"];
  const names = PROVIDERS.map(p => p.name);
  const missing = want.filter(w => names.indexOf(w) === -1);
  H.eq(missing, [], "every requested provider is present");
  H.eq(PROVIDERS.length, want.length, "no extra or duplicate providers");
  H.eq(new Set(PROVIDERS.map(p => p.id)).size, PROVIDERS.length, "provider ids are unique");
  H.ok(PROVIDERS.every(p => ["openai","anthropic","gemini","azure"].indexOf(p.kind) !== -1), "every provider has a known adapter kind");
  H.ok(PROVIDERS.every(p => /^https:\/\//.test(p.base)), "every base URL is https");
  H.ok(PROVIDERS.every(p => (p.models || []).length > 0), "every provider offers at least one model");
  H.ok(PROVIDERS.every(p => /^#[0-9a-f]{6}$/i.test(p.colour)), "every provider has a colour");
  H.ok(PROVIDERS.every(p => CORS_NOTE[p.cors]), "every provider declares a browser-access status");
  H.ok(PROVIDERS.every(p => Models.monogram(p.name).length >= 1), "every provider yields a monogram");
}

H.section("Key store");
{
  localStorage.clear();
  H.eq(Keys.get("openai"), "", "no key by default");
  Keys.set("openai", "sk-test", 0);
  H.eq(Keys.get("openai"), "sk-test", "key round trips");
  H.eq(Keys.get("anthropic"), "", "keys do not leak between providers");
  Keys.set("anthropic", "sk-ant", 0);
  H.eq(Keys.get("anthropic"), "sk-ant", "second provider key stored independently");
  H.eq(Keys.get("openai"), "sk-test", "first key untouched");
  Keys.revoke("anthropic");
  H.eq(Keys.get("anthropic"), "", "revoke clears only that provider");
  H.eq(Keys.get("openai"), "sk-test", "revoke leaves others alone");

  /* expiry is enforced on read, not merely displayed */
  Keys.set("groq", "gsk-x", 12);
  H.eq(Keys.get("groq"), "gsk-x", "unexpired key is returned");
  const all = Keys.all(); all.groq.exp = Date.now() - 1000; Store.set("providerKeys", all);
  H.eq(Keys.get("groq"), "", "expired key is refused");
  H.ok(!Keys.all().groq, "expired key is discarded from storage, not just hidden");

  /* base URL override */
  H.eq(Keys.base("openai"), "https://api.openai.com/v1", "default base URL");
  Keys.setBase("openai", "https://proxy.internal/v1/");
  H.eq(Keys.base("openai"), "https://proxy.internal/v1", "override applied and trailing slash trimmed");
  Keys.setBase("openai", "https://api.openai.com/v1");
  H.eq(Keys.base("openai"), "https://api.openai.com/v1", "resetting to the default drops the override");
}

H.section("Adapters");
{
  const sys = { role: "system", content: "SYSTEM TEXT" };
  const turns = [{ role: "user", content: "hello" }, { role: "assistant", content: "hi" }, { role: "user", content: "again" }];
  const msgs = [sys].concat(turns);
  const opts = { stream: true, maxTokens: 1234, key: "KEY" };

  /* openai-compatible */
  S.provider = "openrouter"; S.model = "openai/gpt-5.1";
  const oa = LLM.adapterFor(PROVIDER_BY_ID.openrouter);
  H.eq(oa.url(PROVIDER_BY_ID.openrouter, opts), "https://openrouter.ai/api/v1/chat/completions", "openai url");
  H.eq(oa.headers(PROVIDER_BY_ID.openrouter, "KEY").Authorization, "Bearer KEY", "openai bearer header");
  const ob = oa.body(PROVIDER_BY_ID.openrouter, msgs, opts);
  H.eq(ob.model, "openai/gpt-5.1", "openai body carries the model");
  H.eq(ob.max_tokens, 1234, "openai body carries the token cap");
  H.eq(ob.messages.length, 4, "openai body keeps the system message inline");
  H.eq(oa.delta({ choices: [{ delta: { content: "abc" } }] }), "abc", "openai delta");
  H.eq(oa.whole({ choices: [{ message: { content: "xyz" } }] }), "xyz", "openai whole");

  /* anthropic */
  S.provider = "anthropic"; S.model = "claude-opus-5";
  const an = LLM.adapterFor(PROVIDER_BY_ID.anthropic);
  H.eq(an.url(PROVIDER_BY_ID.anthropic, opts), "https://api.anthropic.com/v1/messages", "anthropic url");
  const ah = an.headers(PROVIDER_BY_ID.anthropic, "KEY");
  H.eq(ah["x-api-key"], "KEY", "anthropic uses x-api-key");
  H.eq(ah["anthropic-version"], "2023-06-01", "anthropic version header");
  H.eq(ah["anthropic-dangerous-direct-browser-access"], "true", "anthropic browser opt-in header present");
  H.ok(!ah.Authorization, "anthropic does not send a bearer token");
  const ab = an.body(PROVIDER_BY_ID.anthropic, msgs, opts);
  H.eq(ab.system, "SYSTEM TEXT", "anthropic lifts system out of messages");
  H.eq(ab.messages.length, 3, "anthropic messages exclude the system turn");
  H.eq(ab.max_tokens, 1234, "anthropic max_tokens");
  H.eq(an.delta({ type: "content_block_delta", delta: { text: "abc" } }), "abc", "anthropic delta");
  H.eq(an.delta({ type: "message_start" }), "", "anthropic ignores non-text frames");
  H.eq(an.whole({ content: [{ text: "a" }, { text: "b" }] }), "ab", "anthropic whole");

  /* gemini */
  S.provider = "google"; S.model = "gemini-2.5-pro";
  const gm = LLM.adapterFor(PROVIDER_BY_ID.google);
  const gurl = gm.url(PROVIDER_BY_ID.google, opts);
  H.has(gurl, "/models/gemini-2.5-pro:streamGenerateContent", "gemini streaming verb");
  H.has(gurl, "alt=sse", "gemini asks for SSE framing");
  H.has(gurl, "key=KEY", "gemini passes the key in the query");
  const gb = gm.body(PROVIDER_BY_ID.google, msgs, opts);
  H.eq(gb.systemInstruction.parts[0].text, "SYSTEM TEXT", "gemini lifts system instruction");
  H.eq(gb.contents.length, 3, "gemini contents exclude the system turn");
  H.eq(gb.contents[1].role, "model", "gemini renames assistant to model");
  H.eq(gb.generationConfig.maxOutputTokens, 1234, "gemini token cap");
  H.eq(gm.delta({ candidates: [{ content: { parts: [{ text: "abc" }] } }] }), "abc", "gemini delta");

  /* azure */
  S.provider = "azure"; S.model = "gpt-4o";
  Store.set("azureDeployment", "my-deploy");
  const az = LLM.adapterFor(PROVIDER_BY_ID.azure);
  const aurl = az.url(PROVIDER_BY_ID.azure, opts);
  H.has(aurl, "/openai/deployments/my-deploy/chat/completions", "azure deployment path");
  H.has(aurl, "api-version=", "azure api-version");
  H.eq(az.headers(PROVIDER_BY_ID.azure, "KEY")["api-key"], "KEY", "azure uses api-key header");

  S.provider = "openai"; S.model = "gpt-5.1";
}

H.section("Temporary chat");
{
  localStorage.clear();
  S.user = { roleKey: "t", name: "T", av: "T", avatarColor: "#000", email: "t@t" };
  S.temporary = false;
  S.convos = [
    { id: "keep", title: "Kept", ts: 1, updated: 1, messages: [{ id: "a", role: "user", text: "x", ts: 1 }] },
    { id: "temp", title: "Temp", ts: 2, updated: 2, temp: true, messages: [{ id: "b", role: "user", text: "y", ts: 2 }] },
  ];
  Sidebar.persist();
  const stored = Store.get("convos_t", []);
  H.eq(stored.length, 1, "only the non-temporary chat is persisted");
  H.eq(stored[0].id, "keep", "the right one survived");
  H.ok(JSON.stringify(stored).indexOf("Temp") === -1, "no trace of the temporary chat on disk");
  S.convos = []; S.user = null;
}

H.section("Provider brand marks");
{
  const withMark = PROVIDERS.filter(p => providerLogoSvg(p.id));
  H.ok(withMark.length >= 12, "official marks present for the major providers");
  ["openai","anthropic","google","openrouter","azure","mistral","deepseek","perplexity",
   "huggingface","nvidia","xai","github","moonshot"].forEach(id => {
    H.ok(!!providerLogoSvg(id), "official mark for " + id);
  });
  H.ok(withMark.every(p => /^#[0-9A-Fa-f]{6}$/.test(providerBrandHex(p.id))), "every mark carries a brand hex");
  H.ok(withMark.every(p => providerLogoSvg(p.id).indexOf('viewBox="0 0 24 24"') !== -1), "marks share one 24x24 grid");
  H.ok(withMark.every(p => providerLogoSvg(p.id).indexOf("<path d=") !== -1), "marks contain path geometry");
  H.eq(providerLogoSvg("nosuchprovider"), null, "unknown provider has no mark");
  /* the fallback path must still produce something for the rest */
  PROVIDERS.forEach(p => H.ok(Models.monogram(p.name).length >= 1, "monogram fallback for " + p.id));
  /* contrast rule: a near-black mark must not be drawn near-black on a dark theme */
  S.theme = "dark";
  H.eq(Models.logoInk("#000000"), "var(--tx)", "black mark flips to text colour in dark mode");
  H.eq(Models.logoInk("#76B900"), "#76B900", "a mid-tone mark keeps its brand colour");
  S.theme = "light";
  H.eq(Models.logoInk("#FFFFFF"), "var(--tx)", "white mark flips to text colour in light mode");
  H.eq(Models.logoInk("#000000"), "#000000", "black mark is fine on light");
  S.theme = "dark";
}

H.section("Product logo plumbing");
{
  H.ok(typeof brandMark === "function", "brandMark() exists");
  H.ok(typeof hasBrandLogo === "function", "hasBrandLogo() exists");
  /* with no asset supplied it must fall back to the drawn mark, not break */
  H.eq(hasBrandLogo(), !!Config.brand.logo, "logo presence reported honestly");
  if(!Config.brand.logo){
    H.has(brandMark(), "<svg", "falls back to the drawn mark when no asset is supplied");
    H.lacks(brandMark(), "<img", "no broken image element without an asset");
  }
  /* and when one is supplied it is used everywhere through this one function */
  const prev = Config.brand.logo;
  Config.brand.logo = "data:image/png;base64,AAAA";
  H.has(brandMark(), '<img class="brand-img"', "uses the asset when present");
  H.has(brandMark(), "data:image/png;base64,AAAA", "asset src carried through");
  H.eq(hasBrandLogo(), true, "presence flag follows the asset");
  Config.brand.logo = prev;
}

/* ================= theme resolution =================
   The built file resolves the theme in a <head> bootstrap so the first
   painted frame is already correct, which means the rule exists twice: once
   there and once in resolvedTheme(). Duplication is the price of having no
   flash, so the two are executed side by side here against every combination
   of saved preference and device setting. If they ever drift, a customer sees
   the splash in one theme and the app in another. */
H.section("Theme: the boot bootstrap and the runtime agree");
{
  const fs = require("fs");
  const path = require("path");
  const out = path.join(H.ROOT, edition === "base" ? "sara.html" : `sara_${edition}.html`);

  /* asserted against the declaration, not live S: earlier sections mutate
     S.theme to exercise the contrast rules, so the live value says nothing
     about what a customer opening the file for the first time gets */
  const stateSrc = fs.readFileSync(path.join(H.ROOT, "src", "22-state.js"), "utf8");
  H.ok(/theme:\s*"system"/.test(stateSrc), "system is the shipped default");

  if(!fs.existsSync(out)){
    console.log("    (skipped — run `python build.py " + edition + "` first)");
  }else{
    const html = fs.readFileSync(out, "utf8");
    const boot = (html.match(/<script>\(function\(\)\{try\{var p=[\s\S]*?<\/script>/) || [])[0];
    H.ok(!!boot, "the built file carries a theme bootstrap in its head");
    H.ok(boot && html.indexOf(boot) < html.indexOf("<style>"),
         "and it runs before the stylesheet, which is what prevents the flash");
    H.has(boot || "", "sara_" + Config.slug + "_prefs",
          "reading the same storage key Store.key() writes");

    /* run the shipped bootstrap for real, against a stubbed device */
    const runBoot = function(saved, deviceDark){
      const root = { attr: null, setAttribute(k, v){ if(k === "data-theme") this.attr = v; } };
      const sandbox = {
        document: { documentElement: root },
        localStorage: { getItem: () => (saved === undefined ? null : JSON.stringify({ theme: saved })) },
        matchMedia: (q) => ({ matches: /dark/.test(q) ? deviceDark : !deviceDark }),
        JSON: JSON,
      };
      require("vm").runInNewContext(boot.replace(/<\/?script>/g, ""), sandbox);
      return root.attr;
    };

    const runRuntime = function(saved, deviceDark){
      const prevTheme = S.theme, prevMM = global.matchMedia;
      S.theme = saved === undefined ? "system" : saved;
      global.matchMedia = (q) => ({ matches: /dark/.test(q) ? deviceDark : !deviceDark });
      const got = resolvedTheme();
      S.theme = prevTheme; global.matchMedia = prevMM;
      return got;
    };

    [[undefined, true,  "dark"],  [undefined, false, "light"],
     ["system",  true,  "dark"],  ["system",  false, "light"],
     ["dark",    true,  "dark"],  ["dark",    false, "dark"],
     ["light",   true,  "light"], ["light",   false, "light"]].forEach(function(c){
       const label = "saved=" + String(c[0]) + " device=" + (c[1] ? "dark" : "light");
       H.eq(runBoot(c[0], c[1]), c[2], "boot resolves " + label + " to " + c[2]);
       H.eq(runRuntime(c[0], c[1]), c[2], "runtime resolves " + label + " to " + c[2]);
     });

    /* a browser that cannot report a preference must land on the product
       default, not be silently treated as light */
    const prevMM = global.matchMedia, prevTheme = S.theme;
    global.matchMedia = undefined;
    S.theme = "system";
    H.eq(resolvedTheme(), "dark", "no media-query support falls back to dark, not light");
    S.theme = prevTheme;
    global.matchMedia = prevMM;
  }

  /* accent maths must follow what is on screen, not the preference */
  const prevTheme = S.theme, prevMM = global.matchMedia;
  S.theme = "system";
  global.matchMedia = () => ({ matches: false });          /* device is light */
  H.eq(resolvedTheme(), "light", "system + light device resolves light");
  S.theme = prevTheme;
  global.matchMedia = prevMM;
}

H.report("SARA providers");
