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
