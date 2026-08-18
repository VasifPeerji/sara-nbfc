/* The new step types, driven end to end through the real engine.

   test_calc.js proves the arithmetic. This proves the plumbing: that a
   calc step recomputes when an earlier answer changes, that a check step
   with a failed blocking condition stops the task and produces a hold
   notice instead of the document, that a table step collects rows, that a
   file step extracts named fields without inventing any, and that all of
   it reaches the produced record with the working attached.

   A synthetic task is used rather than a shipped one so that this suite
   keeps testing the engine as the edition's tasks change.

   Run:  node test/test_engine.js [edition]
*/
const H = require("./harness");
const edition = process.argv[2] || "nbfc";
H.loadEdition(edition);
H.loadSrc();
Retrieval.build();

console.log(`\n  SARA engine tests — edition "${edition}"`);

/* Sign in as somebody who can read what the task cites, or the citation
   chips resolve to nothing and half the assertions test the wrong thing. */
S.user = Config.users.filter((u) => u.roleKey === "cse")[0] || Config.users[0];

/* ================= the synthetic task ================= */

const TASK = {
  id: "engine_probe",
  title: "Settlement figure for {account}",
  icon: "rupee",
  for: ["cse", "central_ops"],
  steps: [
    { id: "account", type: "text", q: "Which account?" },
    { id: "rateBasis", type: "choice", q: "Rate basis?", options: ["Floating", "Fixed"] },
    { id: "borrower", type: "choice", q: "Borrower category?", options: ["Individual", "Company"] },
    { id: "pos", type: "number", q: "Principal outstanding?" },
    { id: "roi", type: "number", q: "Rate of interest?" },
    { id: "days", type: "number", q: "Days since last rest?" },
    { id: "penal", type: "number", q: "Unpaid penal charges?" },

    /* the computation */
    { id: "payoff", type: "calc", q: "Amount payable",
      compute: {
        lines: [
          { label: "Principal outstanding", op: "value", from: "pos", as: "P", cite: "PR-004" },
          { label: "Interest accrued", op: "interest", of: "pos", rate: "roi", days: "days", as: "I", cite: "PR-006" },
          { label: "Pre-payment charge", op: "percent", of: "pos", pct: 4, as: "C", cite: "PR-004",
            when: { rateBasis: "Fixed" },
            because: "Not payable on a floating rate facility to an individual" },
          { label: "Unpaid penal charges", op: "value", from: "penal", as: "N", cite: "PR-003",
            note: "Shown separately and never added to principal before interest" },
        ],
        total: { label: "Amount payable", of: ["P", "I", "C", "N"] },
      } },

    /* the conditions */
    { id: "conditions", type: "check", q: "Before the quote is issued",
      rules: [
        { label: "Account identified", of: "account", test: "present", cite: "PR-004" },
        { label: "Rate basis established", of: "rateBasis", test: "present", cite: "PR-001" },
        { label: "No dispute open on the charges", of: "dispute", test: "falsy", cite: "GP-005",
          fail: "A dispute is open on this account and must be resolved first" },
        { label: "Customer contact on record", of: "contact", test: "truthy", cite: "GP-004", blocking: false },
      ] },

    /* the clock */
    { id: "validity", type: "clock", q: "How long this quote stands",
      clocks: [
        { label: "Quote valid to", from: "quoteDate", every: 7, unit: "days",
          owner: "Customer Service", consequence: "Interest accrues daily after this date", cite: "PR-004" },
      ] },

    /* the rows */
    { id: "receipts", type: "table", q: "Unapplied receipts to set off", optional: true,
      columns: [
        { key: "ref", label: "Reference" },
        { key: "date", label: "Date", kind: "date" },
        { key: "amount", label: "Amount", kind: "money" },
      ] },
  ],
  produce: {
    kind: "Settlement quote",
    title: "Settlement quote for {account}",
    meta: [{ k: "Account", from: "account" }, { k: "Rate basis", from: "rateBasis" }],
    sections: [
      { h: "How the figure is arrived at", fromStep: "payoff" },
      { h: "Conditions", fromStep: "conditions" },
      { h: "Validity", fromStep: "validity" },
      { h: "Unapplied receipts", fromTable: "receipts" },
      { h: "Note", body: "Prepared for account {account}." },
    ],
    halt: {
      kind: "Quote withheld",
      title: "Settlement quote withheld for {account}",
      intro: "A quote cannot be issued while the following are outstanding.",
      route: "Refer to the Grievance Redressal Officer.",
    },
    footer: "This quote is not an approval.",
  },
};

Config.journeys = (Config.journeys || []).concat([TASK]);

/* Drive the task by writing answers and letting the engine recompute,
   which is what the UI does through answer(). */
function run(answers) {
  Journeys.start(TASK.id);
  Object.keys(answers).forEach((k) => { Journeys.answers[k] = answers[k]; });
  Journeys._recompute();
  return Journeys._build();
}

const BASE = {
  account: "LN-4471902",
  rateBasis: "Floating",
  borrower: "Individual",
  pos: 1248000,
  roi: 13.5,
  days: 47,
  penal: 1500,
  dispute: false,
  contact: true,
  quoteDate: "2026-08-18",
};

/* ================= calc ================= */
H.section("Calc step");

let spec = run(BASE);
let d = Journeys.derived.payoff;

H.ok(!!d, "the calc step produced a result without being clicked through");
H.eq(d.lines.length, 4, "every declared line is present");
/* 1248000 x 13.5% x 47/365 = 21,694.68 */
H.ok(Math.abs(d.lines[1].value - 21694.68) < 0.01, "interest is computed from the answers");
H.eq(d.lines[2].skipped, true, "the charge line is skipped on a floating rate facility");
H.has(d.lines[2].because, "floating rate", "and carries the reason into the record");
H.ok(Math.abs(d.total.value - 1271194.68) < 0.01, "the total is the sum of the applicable lines");
H.eq(Journeys.answers.payoff, d.total.value,
     "the headline figure is written back as an answer so later steps can branch on it");

H.section("Calc recomputes when an earlier answer changes");

/* The failure this guards against: a person corrects the rate and the
   quote keeps the figure worked out from the old one. */
const changed = run(Object.assign({}, BASE, { roi: 18 }));
const d2 = Journeys.derived.payoff;
/* 1248000 x 18% x 47/365 = 28,926.25 */
H.ok(Math.abs(d2.lines[1].value - 28926.25) < 0.01, "the interest line follows the corrected rate");
H.ok(d2.total.value > d.total.value, "and the total moves with it");
void changed;

const fixedRate = run(Object.assign({}, BASE, { rateBasis: "Fixed" }));
const d3 = Journeys.derived.payoff;
H.eq(!!d3.lines[2].skipped, false, "on a fixed rate facility the charge line applies");
/* 4% of 12,48,000 = 49,920 */
H.ok(Math.abs(d3.lines[2].value - 49920) < 0.01, "and is four per cent of the principal outstanding");
void fixedRate;

/* ================= check ================= */
H.section("Check step");

spec = run(BASE);
let c = Journeys.derived.conditions;
H.eq(c.rows.filter((r) => r.state === "pass").length, 4, "a clean case passes every condition");
H.eq(Calc.blockers(c.rows).length, 0, "and nothing blocks");
H.eq(Journeys.answers.conditions, "Clear", "the check writes its verdict back as an answer");

const advisoryOnly = run(Object.assign({}, BASE, { contact: false }));
c = Journeys.derived.conditions;
H.eq(c.rows[3].state, "fail", "the advisory condition fails");
H.eq(Calc.blockers(c.rows).length, 0, "but an advisory failure does not block");
H.eq(advisoryOnly.kind, "Settlement quote", "and the document is still produced");

/* ================= the halt ================= */
H.section("A failed blocking condition stops the task");

Journeys.start(TASK.id);
Object.keys(BASE).forEach((k) => { Journeys.answers[k] = BASE[k]; });
Journeys.answers.dispute = true;
Journeys._recompute();
const blocked = Journeys.derived.conditions;
H.eq(Calc.blockers(blocked.rows).length, 1, "the open dispute blocks");

/* mark the halt the way submit() does when the person acknowledges it */
Journeys.active.halted = { step: "conditions", reasons: Calc.blockers(blocked.rows) };
const held = Journeys._build();

H.eq(held.halted, true, "the record is marked as a halt");
H.eq(held.kind, "Quote withheld", "and does not present itself as the quote");
H.has(held.title, "withheld", "the title says so");
H.ok(held.sections.some((s) => (s.checks || []).length),
     "the conditions that were not met are carried into the record");
H.ok(held.sections.some((s) => String(s.body || "").indexOf("Grievance") !== -1),
     "and the route onward is stated");
H.ok(!held.sections.some((s) => s.computation),
     "the settlement working is not included, because no settlement is being offered");

/* ================= clock ================= */
H.section("Clock step");

run(BASE);
const k = Journeys.derived.validity;
H.eq(k.clocks.length, 1, "the clock is computed");
H.eq(k.clocks[0].due, "2026-08-25", "seven days from the quote date");
H.eq(k.clocks[0].owner, "Customer Service", "with its owner");
H.has(k.clocks[0].consequence, "accrues", "and the consequence of letting it pass");

/* ================= table ================= */
H.section("Table step");

const withRows = run(Object.assign({}, BASE, {
  receipts: [
    { ref: "RCP-8821", date: "2026-07-04", amount: "4500" },
    { ref: "RCP-9014", date: "2026-07-29", amount: "1200" },
  ],
}));
const tableSection = withRows.sections.filter((s) => (s.rows || []).length)[0];
H.ok(!!tableSection, "the rows reach the produced record");
H.eq(tableSection.rows.length, 2, "both of them");
H.eq(tableSection.columns.length, 3, "with the column definitions from the step");

const noRows = run(BASE);
H.ok(!noRows.sections.some((s) => (s.rows || []).length),
     "an empty optional table produces no section rather than an empty one");

/* ================= file extraction ================= */
H.section("File field extraction");

const parsed =
  "SANCTION LETTER\nAccount Number: LN-4471902\n" +
  "Sanctioned Amount: Rs. 15,00,000\nRate of Interest: 13.50% p.a. floating\n" +
  "Tenor: 120 months\nProcessing Fee: Rs. 22,500\n";

const fields = Journeys._extract(parsed, [
  { key: "account", label: "Account", match: "Account Number:\\s*([A-Z0-9-]+)" },
  { key: "amount", label: "Sanctioned amount", match: "Sanctioned Amount:\\s*Rs\\.?\\s*([\\d,]+)" },
  { key: "roi", label: "Rate", match: "Rate of Interest:\\s*([\\d.]+)" },
  { key: "guarantor", label: "Guarantor", match: "Guarantor:\\s*(.+)" },
]);

H.eq(fields.account, "LN-4471902", "an identifier is read out of the document");
H.eq(fields.amount, "15,00,000", "so is an amount, as written");
H.eq(fields.roi, "13.50", "and a rate");
H.eq(fields.guarantor, "",
     "a field that is not in the document comes back empty rather than guessed");

const firstMatch = Journeys._extract("Ref: AAA-1\nRef: BBB-2", [
  { key: "ref", match: ["Reference:\\s*(\\S+)", "Ref:\\s*(\\S+)"] },
]);
H.eq(firstMatch.ref, "AAA-1", "patterns are tried in order and the first that matches wins");

const badPattern = Journeys._extract("anything", [{ key: "x", match: "([unclosed" }]);
H.eq(badPattern.x, "", "an invalid pattern yields empty rather than throwing");

/* ================= the produced record ================= */
H.section("The record carries the working");

spec = run(BASE);
H.eq(spec.type, "document", "a document is produced");
H.eq(spec.kind, "Settlement quote", "of the declared kind");
H.lacks(spec.title, "{", "with the title interpolated");

const comp = spec.sections.filter((s) => s.computation)[0];
H.ok(!!comp, "the computation reaches the record");
H.eq(comp.computation.lines.length, 4, "with every line");
H.ok(comp.computation.lines.some((l) => l.skipped),
     "including the line that did not apply, so the reader can see it was considered");
H.ok(comp.computation.lines.every((l) => !!l.cite),
     "and every line names the document that fixed it");

const checks = spec.sections.filter((s) => (s.checks || []).length)[0];
H.ok(!!checks, "the conditions reach the record");
const clocks = spec.sections.filter((s) => (s.clocks || []).length)[0];
H.ok(!!clocks, "so do the dates");

/* The record has to survive being copied out of the app. */
const flat = Artifacts.toText(spec);
H.has(flat, "Principal outstanding", "the flattened text carries the line labels");
H.has(flat, "PR-004", "and the citations");
H.has(flat, "Amount payable", "and the total");
H.has(flat, "[pass]", "and the state of each condition");

const html = Artifacts.render(spec, "probe");
H.has(html, "wk-t", "the record renders the working as a table");
H.has(html, "wk-chk", "and the conditions");
H.lacks(html, "undefined", "with nothing undefined leaking into the markup");
H.eq((html.match(/<[^>]*>/g) || []).filter((t) => (t.match(/"/g) || []).length % 2), [],
     "and no tag with unbalanced quotes");

/* ================= no model, no network ================= */
H.section("The whole task runs with no key and no network");

S.apiKey = "";
Config.product.apiKey = "";
const realFetch = global.fetch;
global.fetch = function () { throw new Error("the journey engine attempted a network call"); };
try {
  const offline = run(BASE);
  H.eq(offline.type, "document", "the document is still produced");
  H.ok(Math.abs(Journeys.derived.payoff.total.value - 1271194.68) < 0.01,
       "with the same figure");
  H.ok(offline.sections.filter((s) => s.computation).length === 1,
       "and the working still attached");
} finally {
  global.fetch = realFetch;
}

H.report(`SARA engine (${edition})`);
