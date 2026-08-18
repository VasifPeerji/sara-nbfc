/* Edition integrity for the NBFC build.

   These are the checks unit tests on src/ cannot make, because they are
   about the content: whether a scope actually restricts, whether a role can
   read what its own prompt cards ask for, whether a document is real prose
   or a stub. Run after every corpus change.

   Run:  node test/test_nbfc.js [edition]
*/
const H = require("./harness");
const edition = process.argv[2] || "nbfc";
H.loadEdition(edition);
H.loadSrc();
Retrieval.build();

console.log(`\n  SARA edition integrity — "${edition}"`);

/* A restricting scope holds material that a statute, a listing obligation or
   an undertaking keeps from people who are otherwise fully cleared. Not
   seniority, and never a topic. */
const RESTRICTING = ["str", "upsi", "whistle", "privileged", "custpii"];

const cats = Object.keys(Config.categories);
const scopeNames = Object.keys(Config.scopeLabels);

/* ================= documents ================= */
H.section("Documents");

const seen = {};
Config.kb.forEach((d) => {
  H.ok(!seen[d.id], `duplicate document id ${d.id}`);
  seen[d.id] = true;
  H.ok(cats.indexOf(d.cat) >= 0, `${d.id} uses undeclared category "${d.cat}"`);
  H.ok([1, 2, 3, 4].indexOf(d.clearance) >= 0, `${d.id} clearance is ${d.clearance}`);
  (d.scopes || []).forEach((s) =>
    H.ok(scopeNames.indexOf(s) >= 0, `${d.id} carries undeclared scope "${s}"`));
  ["owner", "updated", "rev", "system", "tags", "body"].forEach((k) =>
    H.ok(d[k] !== undefined && d[k] !== "", `${d.id} is missing ${k}`));
  H.ok((d.body || "").length >= 600,
       `${d.id} body is only ${(d.body || "").length} chars — a stub reads as a defect`);
  H.ok((d.tags || []).length >= 4, `${d.id} has ${(d.tags || []).length} tags; retrieval needs more`);
  H.ok(/^\d{4}-\d{2}-\d{2}$/.test(d.updated || ""), `${d.id} updated "${d.updated}" is not ISO`);
});

/* THE GUARD.
   visibleTo grants access when the role holds ANY of a document's scopes, so
   a restricting scope sharing a document with a topic scope restricts
   nothing. This was a real defect on an earlier build, and every
   scope-holder assertion still passed while it was broken. */
H.section("Restricting scopes actually restrict");

Config.kb.forEach((d) => {
  const r = (d.scopes || []).filter((s) => RESTRICTING.indexOf(s) >= 0);
  if (!r.length) return;
  H.ok(d.scopes.length === 1,
       `${d.id} carries [${d.scopes.join(", ")}] — the topic scope defeats ${r.join(", ")}`);
});

RESTRICTING.forEach((s) => {
  const holders = Config.roles.filter((r) => (r.scopes || []).indexOf(s) >= 0);
  H.ok(holders.length > 0, `nobody holds ${s}, so anything tagged with it is unreadable`);
  H.ok(holders.length <= 6,
       `${s} is held by ${holders.length} roles, which is not a restriction`);
});

/* ================= seniority is not access ================= */
/* The five restricting scopes are not one kind of thing.

   `str`, `whistle` and `privileged` hold CASES: a report it is an offence to
   disclose, an identity that is protected, advice that is privileged. These
   attach to a designation, never to rank, and no amount of seniority creates
   a route in.

   `upsi` and `custpii` hold CATEGORIES OF DATA that some senior functions
   genuinely need: the disclosure process cannot run without the first, and
   an escalated grievance cannot be answered without the second. They are
   restricted by function rather than by rank, which means a clearance 4 role
   may legitimately hold them. */
H.section("Seniority is not access");

const CASE_SCOPES = ["str", "whistle", "privileged"];
const top = Config.roles.filter((r) => r.clearance === 4);
H.ok(top.length > 0, "no clearance 4 roles exist");
top.forEach((r) => {
  const held = (r.scopes || []).filter((s) => CASE_SCOPES.indexOf(s) >= 0);
  H.ok(held.length === 0,
       `${r.key} holds ${held.join(", ")}; case-level scopes attach to a designation, not to rank`);
});
CASE_SCOPES.forEach((s) => {
  const holders = Config.roles.filter((r) => (r.scopes || []).indexOf(s) >= 0);
  H.ok(holders.length <= 2,
       `${s} is held by ${holders.length} roles (${holders.map((r) => r.key).join(", ")}); a case scope should sit with one designation`);
});

const md = Config.roles.filter((r) => r.key === "md_ceo")[0];
H.ok(!!md, "the managing director role is missing");
if (md) {
  H.ok((md.scopes || []).indexOf("str") < 0,
       "the managing director holds str; the statute does not care how senior anyone is");
  const strDocs = Config.kb.filter((d) => (d.scopes || []).indexOf("str") >= 0);
  const readable = strDocs.filter((d) => Retrieval.visibleTo(d, md));
  H.ok(readable.length === 0,
       `the managing director can read ${readable.map((d) => d.id).join(", ")}`);
}

/* A restriction without a route is a dead end, and people route around
   dead ends rather than respecting them. */
H.section("Every restriction has a route");

RESTRICTING.forEach((s) => {
  const restricted = Config.kb.filter((d) => (d.scopes || []).indexOf(s) >= 0);
  if (!restricted.length) return;
  const open = Config.kb.filter((d) =>
    d.clearance === 1 &&
    (d.tags || []).some((t) => String(t).toLowerCase().indexOf(s) >= 0));
  H.ok(open.length > 0,
       `material tagged ${s} exists with no clearance-1 document describing the process`);
});

/* ================= roles ================= */
H.section("Roles and profiles");

const roleKeys = Config.roles.map((r) => r.key);
Config.roles.forEach((r) => {
  H.ok((r.persona || "").length > 80, `${r.key} has no usable persona`);
  H.ok((r.focus || "").length > 40, `${r.key} has no usable focus`);
  H.ok((r.prompts || []).length >= 4, `${r.key} has ${(r.prompts || []).length} prompt cards`);
  H.ok((r.scopes || []).every((s) => scopeNames.indexOf(s) >= 0),
       `${r.key} carries an undeclared scope`);
});
Config.users.forEach((u) =>
  H.ok(roleKeys.indexOf(u.roleKey) >= 0, `${u.name} maps to unknown role ${u.roleKey}`));
Config.roles.forEach((r) =>
  H.ok(Config.users.some((u) => u.roleKey === r.key), `${r.key} has no sign-in profile`));

/* A prompt card that retrieves nothing is a dead tile on the welcome wall.
   audit_retrieval.js reports what each one actually pulls; this asserts only
   that something readable comes back at all. */
H.section("Every prompt card retrieves something");

/* search() returns { sources, blocked, stats }, not an array. Reading .length
   off the result object yields undefined, which compares false against
   everything and reports the whole wall as broken.

   Presence alone is a weak assertion: BM25 returns something for almost any
   query that shares a word with any document. The floor is what makes this
   check mean anything. Measured across the corpus, real matches sit at 6 and
   above while noise tops out around 4, so a card below the floor is pulling
   a document that happens to share vocabulary rather than one that answers
   it. RE-MEASURE THIS as the corpus grows; it is corpus-size dependent. */
const CARD_FLOOR = 6.0;

Config.roles.forEach((r) => {
  (r.prompts || []).forEach((p) => {
    const res = Retrieval.search(p.q, { role: r, topK: 3 });
    const got = (res && res.sources) || [];
    const top = got.length ? Number(got[0].score || 0) : 0;
    H.ok(top >= CARD_FLOOR,
         `${r.key} · "${p.t}" tops out at ${top.toFixed(1)} (floor ${CARD_FLOOR})` +
         `\n      ${p.q}` +
         `\n      best match: ${got.length ? got[0].id + " — " + got[0].title : "nothing"}` +
         (res && res.blocked && res.blocked.length
            ? `\n      ${res.blocked.length} withheld on access, so the gap may be a scope problem` : ""));
  });
});

/* ================= card destinations =================
   A card that retrieves a plausible but wrong document is invisible to every
   other check: it scores well, it returns something, and the answer is
   confidently about the wrong subject. The audit found five of these. These
   assertions pin the ones that were wrong, plus a few that matter most, so a
   later corpus edit cannot quietly undo them. */
H.section("Prompt cards reach the right document");

const DESTINATIONS = [
  /* all five found wrong by audit_retrieval */
  ["dealer_exec", "How much of a used tipper's value can be funded and what decides the margin?", "CH-001"],
  ["fi_officer", "The customer offered me money to write a positive report. What am I required to do?", "OP-010"],
  ["rcu_officer", "The pattern suggests a branch employee is involved. What is the process and who do I notify first?", "RK-004"],
  ["tele_collections", "The customer says he already paid and we have not credited it. What do I do on the call?", "CO-005"],
  ["repo_coordinator", "The customer has come with money before the sale. What are the release rules?", "CO-008"],
  /* the ones a demo turns on */
  ["cse", "A customer wants his foreclosure amount right now. What can I tell him and what has to be worked out formally?", "PR-004"],
  ["branch_manager", "A long-standing customer's top-up disbursal is blocked in the system and I cannot see a reason. What do I do and who do I contact?", "CM-002"],
  ["repo_coordinator", "What has to be true before a vehicle can be repossessed, and who confirms each item?", "CO-007"],
];

DESTINATIONS.forEach(([roleKey, q, want]) => {
  const role = Config.roles.filter((r) => r.key === roleKey)[0];
  H.ok(!!role, `card destination names unknown role ${roleKey}`);
  if (!role) return;
  const got = (Retrieval.search(q, { role: role, topK: 3 }).sources || []);
  const top = got[0];
  H.ok(!!top && top.id === want,
       `${roleKey} should reach ${want} but reaches ${top ? top.id : "nothing"}` +
       `\n      ${q}` +
       `\n      top 3: ${got.map((s) => s.id + " " + s.score.toFixed(1)).join(", ")}`);
});

/* The branch manager's blocked top-up must land on the open holds procedure
   and must NOT reach the restricted case material, because that pairing is
   the whole access demonstration. */
const bm = Config.roles.filter((r) => r.key === "branch_manager")[0];
if (bm) {
  const res = Retrieval.search(
    "A long-standing customer's top-up disbursal is blocked in the system and I cannot see a reason.",
    { role: bm, topK: 8 });
  const ids = (res.sources || []).map((s) => s.id);
  H.ok(ids.indexOf("RS-001") < 0,
       "the branch manager can retrieve the financial crime case file; the wall is not holding");
}

/* ================= cross-document threads =================
   The product's central claim is that it answers questions no single
   document answers. That only works if the evidence reaches the model
   together, and BM25 is lexical: a question asked in branch vocabulary can
   retrieve the symptoms and miss the cause entirely, which produces a
   confident answer about the wrong thing.

   These assert that each thread's evidence lands inside the retrieval
   window for the role that would ask, and that no single document states
   the conclusion. Corpus edits break this silently, so it is checked. */
H.section("Cross-document threads resolve");

const THREADS = [
  {
    name: "first instalment bounces",
    role: "cro",
    q: "Complaints, first instalment bounces and field visit costs are all rising in one region at once. What connects them?",
    /* symptom, the rule that misreads it, the analysis, the cause, the lead time */
    needs: ["SV-002", "CO-002", "RK-006", "PR-007", "OP-013"],
  },
  {
    name: "first instalment bounces, from the field",
    role: "area_sales",
    q: "First instalment bounce rates have risen in my area over the last two months. What is driving it?",
    needs: ["RK-006", "PR-007"],
  },
  {
    name: "template currency",
    role: "chief_compliance",
    q: "Which customer-facing templates and letters are still on a superseded version?",
    needs: ["PR-008", "GP-002", "AU-001"],
  },
  {
    name: "co-lending retention",
    role: "cro",
    q: "Across the co-lending arrangements, what exposure do we actually retain and is it what we intended?",
    needs: ["DG-001", "DG-002"],
  },
];

THREADS.forEach((t) => {
  const role = Config.roles.filter((r) => r.key === t.role)[0];
  H.ok(!!role, `thread "${t.name}" names an unknown role ${t.role}`);
  if (!role) return;
  const res = Retrieval.search(t.q, { role: role, topK: Config.retrieval.topK });
  const got = (res.sources || []).map((s) => s.id);
  t.needs.forEach((id) => {
    H.ok(got.indexOf(id) >= 0,
         `thread "${t.name}": ${id} is outside the retrieval window\n` +
         `      returned: ${got.join(", ")}\n` +
         `      the symptoms will reach the model without the cause`);
  });
  /* every link must also be readable by the person asking, or the thread is
     a demo that only works when signed in as somebody else */
  t.needs.forEach((id) => {
    const doc = Config.kb.filter((d) => d.id === id)[0];
    H.ok(!!doc && Retrieval.visibleTo(doc, role),
         `thread "${t.name}": ${t.role} cannot read ${id}`);
  });
});

/* No single document may state a whole thread. If one did, the thread would
   be a lookup rather than a synthesis, and the claim would be false. */
const NEVER_IN_ONE_DOC = [
  ["subvention", "sponsor bank", "complaint"],
  ["retention floor", "part-prepayment", "blended rate disclosed"],
];
NEVER_IN_ONE_DOC.forEach((terms) => {
  const guilty = Config.kb.filter((d) => {
    const b = (d.body || "").toLowerCase();
    return terms.every((t) => b.indexOf(t) >= 0);
  });
  H.ok(guilty.length === 0,
       `${guilty.map((d) => d.id).join(", ")} states a whole thread in one document (${terms.join(" + ")})`);
});

/* ================= scope hygiene ================= */
H.section("Scope hygiene");

const byRoles = {};
Config.roles.forEach((r) => (r.scopes || []).forEach((s) => { byRoles[s] = (byRoles[s] || 0) + 1; }));
scopeNames.forEach((s) => H.ok(byRoles[s] > 0, `scope ${s} is labelled but held by no role`));

const byDocs = {};
Config.kb.forEach((d) => (d.scopes || []).forEach((s) => { byDocs[s] = (byDocs[s] || 0) + 1; }));
Object.keys(byDocs).forEach((s) =>
  H.ok(byRoles[s] > 0, `documents carry ${s} but no role holds it`));

H.report(`SARA edition (${edition})`);
