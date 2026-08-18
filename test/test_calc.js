/* Deterministic computation.

   Every expected figure below is worked by hand and the working is in the
   comment. A test that asserts the code agrees with itself proves nothing;
   these numbers go into a document a branch sends to a customer, so they are
   checked against the arithmetic rather than against a previous run.

   The last section is the one that matters most: everything here must work
   with no API key and no network, because that is the product's claim.

   Run:  node test/test_calc.js [edition]
*/
const H = require("./harness");
const edition = process.argv[2] || "nbfc";
H.loadEdition(edition);
H.loadSrc();

console.log(`\n  SARA computation tests — edition "${edition}"`);

/* Compare to the paisa. Anything looser and a rounding bug hides. */
function near(actual, expected, label, tol) {
  const t = tol === undefined ? 0.005 : tol;
  H.ok(Math.abs(actual - expected) <= t,
       `${label}\n      expected ${expected}\n      actual   ${actual}`);
}

/* ================= money formatting ================= */
H.section("Indian digit grouping");

H.eq(Calc.money(1234567.5), "12,34,567.50", "lakh and crore grouping, not thousands");
H.eq(Calc.money(999), "999.00", "under a thousand is ungrouped");
H.eq(Calc.money(1000), "1,000.00", "the first group is three digits");
H.eq(Calc.money(100000), "1,00,000.00", "one lakh");
H.eq(Calc.money(10000000), "1,00,00,000.00", "one crore");
H.eq(Calc.money(-4500.5), "-4,500.50", "negative amounts keep the sign outside");
H.eq(Calc.money(1234567, 0), "12,34,567", "zero decimal places");

/* ================= dates ================= */
H.section("Dates and day counts");

H.eq(Calc.dayCount("2026-01-01", "2026-01-31"), 30, "day count is exclusive of the start");
H.eq(Calc.dayCount("2026-02-28", "2026-03-01"), 1, "2026 is not a leap year");
H.eq(Calc.dayCount("2024-02-28", "2024-03-01"), 2, "2024 is, and the count reflects it");
H.eq(Calc.isoDate(Calc.addDays("2026-08-18", 60)), "2026-10-17", "60 days from 18 August");
H.eq(Calc.isoDate(Calc.addMonths("2026-01-31", 1)), "2026-02-28",
     "31 January plus a month clamps to the end of February, it does not roll into March");
H.eq(Calc.isoDate(Calc.addMonths("2026-01-31", 3)), "2026-04-30", "and again into April");
H.eq(Calc.isoDate(Calc.addMonths("2026-03-15", -1)), "2026-02-15", "months go backwards too");
H.eq(Calc.isoDate(Calc.parseDate("18/08/2026")), "2026-08-18", "day-first dates are understood");

/* ================= simple interest ================= */
H.section("Simple interest");

/* 1,00,000 x 14% x 47/365 = 100000 x 0.14 x 0.128767... = 1,802.74 */
near(Calc.interest(100000, 14, 47, 365), 1802.7397, "47 days at 14% on a lakh, actual/365", 0.001);
/* the same on a 360 basis is larger: 100000 x 0.14 x 47/360 = 1,827.78 */
near(Calc.interest(100000, 14, 47, 360), 1827.7778, "the basis changes the answer, which is why it is explicit", 0.001);
near(Calc.interest(100000, 14, 0, 365), 0, "no days, no interest");
near(Calc.interest(0, 14, 47, 365), 0, "no principal, no interest");

/* ================= the annuity instalment ================= */
H.section("Instalment");

/* i = 0.01, n = 60, f = 1.01^60 = 1.81669670
   EMI = 500000 x 0.01 x 1.81669670 / 0.81669670 = 11,122.22 */
near(Calc.emi(500000, 12, 60), 11122.2224, "5 lakh at 12% over 60 months", 0.01);
/* i = 0.0075, n = 36, f = 1.0075^36 = 1.3086451
   EMI = 300000 x 0.0075 x 1.3086451 / 0.3086451 = 9,539.9198 */
near(Calc.emi(300000, 9, 36), 9539.9198, "3 lakh at 9% over 36 months", 0.001);
H.eq(Calc.emi(120000, 0, 12), 10000, "an interest free facility amortises straight-line rather than dividing by zero");
H.eq(Calc.emi(100000, 12, 0), 0, "no tenor, no instalment, and no NaN");

/* ================= amortisation ================= */
H.section("Amortisation schedule");

const sch = Calc.schedule(500000, 12, 60, "2026-09-05");
H.eq(sch.length, 60, "one row per instalment");
H.eq(sch[0].due, "2026-09-05", "the first instalment falls on the start date");
H.eq(sch[1].due, "2026-10-05", "and then monthly");
/* first month interest = 500000 x 1% = 5,000.00 exactly */
near(sch[0].interest, 5000, "first month interest is one per cent of the opening balance");
near(sch[0].principal, 6122.22, "and the rest of the instalment is principal", 0.01);
H.eq(sch[59].balance, 0, "the closing balance is exactly zero, not a few paise");
H.ok(Math.abs(sch[59].payment - sch[0].payment) < 1,
     "the final instalment absorbs the rounding without being visibly different");
/* Each row is presented rounded to the paisa, so 60 rounded principals
   sum to 499,999.98 rather than exactly 500,000. The unrounded balance
   closes at zero, which is the figure that matters; the two-paisa
   difference is presentation and is the reason the closing balance is
   asserted rather than the sum of the column. */
const totalPrincipal = sch.reduce((a, r) => a + r.principal, 0);
near(totalPrincipal, 499999.98, "rounded rows sum to within two paise of the amount financed", 0.005);

/* ================= all-inclusive rate ================= */
H.section("Annual percentage rate");

/* With no fees at all, the APR is the contracted rate. */
const instal = Calc.emi(500000, 12, 60);
near(Calc.apr(500000, instal, 60), 12, "with no fees the rate is the contracted rate", 0.02);

/* A 2% processing fee deducted at disbursal: the borrower receives
   4,90,000 but repays the instalment on 5,00,000. The all-inclusive rate
   must therefore be materially above 12%. */
const aprWithFee = Calc.apr(490000, instal, 60);
H.ok(aprWithFee > 12.8 && aprWithFee < 13.4,
     `a 2% deducted fee lifts a 12% facility to about 13%, got ${aprWithFee.toFixed(3)}`);
H.ok(aprWithFee > Calc.apr(500000, instal, 60),
     "computing on the sanctioned amount rather than what the borrower received understates the rate");
H.eq(Calc.apr(0, 1000, 12), 0, "no advance, no rate");
H.eq(Calc.apr(100000, 0, 12), 0, "no instalment, no rate");

/* ================= classification ================= */
H.section("Asset classification");

H.eq(Calc.stage(0).code, "Standard", "nothing overdue");
H.eq(Calc.stage(1).code, "SMA-0", "one day overdue is already a special mention");
H.eq(Calc.stage(30).code, "SMA-0", "30 days is the top of SMA-0");
H.eq(Calc.stage(31).code, "SMA-1", "31 days moves to SMA-1");
H.eq(Calc.stage(60).code, "SMA-1", "60 is the top of SMA-1");
H.eq(Calc.stage(61).code, "SMA-2", "61 moves to SMA-2");
H.eq(Calc.stage(90).code, "SMA-2", "90 days is still SMA-2, not yet non performing");
H.eq(Calc.stage(91).code, "NPA", "beyond 90 days it is non performing");
H.eq(Calc.dpd("2026-06-05", "2026-08-18"), 74, "days past due from the oldest unpaid instalment");
H.eq(Calc.dpd("2026-09-05", "2026-08-18"), 0, "a due date in the future is not overdue");

H.section("The upgrade test");

/* The rule most often got wrong: clearing one facility does not upgrade
   the borrower while another still carries arrears. */
const oneClear = Calc.upgrade([
  { facility: "Vehicle loan", arrears: 0 },
  { facility: "Business loan", arrears: 18400 },
]);
H.eq(oneClear.eligible, false,
     "clearing one facility does not upgrade a borrower who is in arrears on another");
H.eq(oneClear.blocking.length, 1, "and the report names which facility is blocking");
H.eq(oneClear.total, 18400, "with the total arrears across all facilities");

const allClear = Calc.upgrade([
  { facility: "Vehicle loan", arrears: 0 },
  { facility: "Business loan", arrears: 0 },
]);
H.eq(allClear.eligible, true, "upgrade only when the entire arrears across every facility are cleared");

const partPaid = Calc.upgrade([{ facility: "Vehicle loan", arrears: 0.004 }]);
H.eq(partPaid.eligible, true, "a rounding remnant under half a paisa is not arrears");

/* ================= ratios and bands ================= */
H.section("Ratios and bands");

H.eq(Calc.ratio(4500000, 6000000), 75, "loan to value as a percentage");
H.eq(Calc.ratio(100, 0), 0, "a zero denominator returns zero rather than infinity");
const bands = [{ to: 30, code: "SMA-0" }, { to: 60, code: "SMA-1" }, { to: 90, code: "SMA-2" }, { code: "NPA" }];
H.eq(Calc.band(15, bands).code, "SMA-0", "the first band the value does not exceed wins");
H.eq(Calc.band(90, bands).code, "SMA-2", "boundaries are inclusive");
H.eq(Calc.band(400, bands).code, "NPA", "a band with no ceiling is the catch-all");

/* ================= the line engine ================= */
H.section("Computation lines");

/* A foreclosure quote on a floating rate facility to an individual for a
   non-business purpose. No pre-payment charge is permitted, and the line
   saying so must survive into the record rather than being dropped. */
const answers = {
  pos: 1248000,
  roi: 13.5,
  days: 47,
  penal: 1500,
  rateBasis: "Floating",
  borrower: "Individual",
  purpose: "Non-business",
  chargePct: 4,
};
const quote = Calc.run({
  lines: [
    { label: "Principal outstanding", op: "value", from: "pos", as: "P", cite: "PR-004" },
    { label: "Interest accrued to value date", op: "interest", of: "pos", rate: "roi", days: "days", as: "I", cite: "PR-006" },
    { label: "Pre-payment charge", op: "percent", of: "pos", pct: "chargePct", as: "C", cite: "PR-004",
      when: { rateBasis: "Fixed" },
      because: "Not payable: floating rate facility to an individual for a non-business purpose" },
    { label: "Unpaid penal charges", op: "value", from: "penal", as: "N", cite: "PR-003",
      note: "Shown separately and not added to principal before interest" },
  ],
  total: { label: "Amount payable", of: ["P", "I", "C", "N"] },
}, answers);

H.eq(quote.lines.length, 4, "every declared line appears, including the one that does not apply");
H.eq(quote.lines[2].skipped, true, "the pre-payment charge line is skipped");
H.has(quote.lines[2].because, "floating rate",
      "and says why, because a silently missing line reads as an oversight");
H.eq(quote.lines[2].cite, "PR-004", "a skipped line still carries the policy that barred it");
/* 1248000 x 0.135 = 168,480; x 47/365 = 21,694.68 */
near(quote.lines[1].value, 21694.68, "interest: 1248000 x 13.5% x 47/365", 0.01);
/* 12,48,000 + 21,694.68 + 0 + 1,500 = 12,71,194.68 */
near(quote.total.value, 1271194.68, "the total is the sum of the lines that applied", 0.01);
H.eq(quote.values.C, 0, "a skipped line contributes zero rather than being undefined");

/* Penal charges must never be capitalised: interest is computed on the
   principal outstanding, not on principal plus unpaid penal charges. */
const wrong = Calc.interest(answers.pos + answers.penal, answers.roi, answers.days, 365);
H.ok(wrong > quote.lines[1].value,
     "capitalising the penal charge before computing interest would overstate the quote");

H.section("Line engine edge cases");

const bad = Calc.run({ lines: [{ label: "Nonsense", op: "notAnOperation", cite: "X" }] }, {});
H.eq(bad.lines[0].value, 0, "an unknown operation yields zero rather than throwing");
H.has(bad.lines[0].error, "unknown operation", "and says what went wrong");

const chained = Calc.run({
  lines: [
    { label: "A", op: "constant", value: 100, as: "a" },
    { label: "B", op: "constant", value: 40, as: "b" },
    { label: "A less B", op: "subtract", of: ["a", "b"], as: "c" },
    { label: "Half of that", op: "percent", of: "c", pct: 50 },
  ],
}, {});
H.eq(chained.lines[2].value, 60, "a line can build on earlier lines by name");
H.eq(chained.lines[3].value, 30, "and on the result of that");

/* ================= checks ================= */
H.section("Checks");

const preconditions = [
  { label: "Agreement carries the possession clause", of: "clause", test: "truthy", cite: "GP-004",
    fail: "The executed agreement does not carry the clause required by the fair practices code" },
  { label: "Demand notice served and cure period expired", of: "notice", test: "truthy", cite: "CO-007" },
  { label: "No grievance open on the account", of: "grievance", test: "falsy", cite: "CO-007" },
  { label: "Arrears above the product threshold", of: "dpd", test: "gte", value: 90, cite: "CO-007" },
  { label: "Vehicle insured", of: "insured", test: "truthy", cite: "CR-008", blocking: false },
];

const clean = Calc.check(preconditions,
  { clause: true, notice: true, grievance: false, dpd: 124, insured: true });
H.eq(clean.filter((c) => c.state === "pass").length, 5, "every precondition passes on a clean case");
H.eq(Calc.blockers(clean).length, 0, "and nothing blocks");

const blocked = Calc.check(preconditions,
  { clause: false, notice: true, grievance: true, dpd: 124, insured: false });
H.eq(Calc.blockers(blocked).length, 2,
     "the missing clause and the open grievance block; the uninsured vehicle is advisory and does not");
H.eq(blocked[0].state, "fail", "the clause check fails");
H.has(blocked[0].detail, "fair practices code", "and explains what is missing");
H.eq(blocked[4].state, "fail", "the advisory check also fails");
H.eq(Calc.blockers(blocked).map((b) => b.label).indexOf("Vehicle insured"), -1,
     "but an advisory failure does not stop the task");

const na = Calc.check([{ label: "Only for gold", of: "x", when: { product: "Gold" }, na: "Not a gold facility" }],
  { product: "Vehicle" });
H.eq(na[0].state, "na", "a check whose condition does not hold is not applicable rather than failed");

/* ================= clocks ================= */
H.section("Obligation clocks");

const rc = Calc.clock({
  label: "Registration certificate with hypothecation endorsement",
  from: "delivered", every: 60, unit: "days",
  owner: "Documentation and PDD Officer",
  consequence: "The exposure is unsecured in substance until it is received",
  cite: "OP-004",
}, { delivered: "2026-06-20" }, "2026-08-18");

H.eq(rc.due, "2026-08-19", "60 days from 20 June");
H.eq(rc.daysLeft, 1, "one day left as at 18 August");
H.eq(rc.overdue, false, "not yet overdue");

const late = Calc.clock({ label: "x", from: "d", every: 30, unit: "days" },
  { d: "2026-06-01" }, "2026-08-18");
H.eq(late.overdue, true, "past its date");
H.eq(late.daysLeft, -48, "and by how much");

const months = Calc.clock({ label: "x", from: "d", every: 1, unit: "months" },
  { d: "2026-01-31" }, "2026-02-10");
H.eq(months.due, "2026-02-28", "a monthly interval clamps to the end of a short month");

/* ================= reconciliation ================= */
H.section("Reconciliation");

const ours = [
  { id: "L-1001", outstanding: 480000, share: 20, rate: 13.5 },
  { id: "L-1002", outstanding: 250000, share: 20, rate: 13.5 },
  { id: "L-1003", outstanding: 610000, share: 8.4, rate: 13.5 },
  { id: "L-1004", outstanding: 190000, share: 20, rate: 13.5 },
];
const theirs = [
  { id: "L-1001", outstanding: 480000, share: 80, rate: 13.5 },
  { id: "L-1002", outstanding: 250000, share: 80, rate: 13.5 },
  { id: "L-1003", outstanding: 604000, share: 91.6, rate: 13.5 },
  { id: "L-1005", outstanding: 320000, share: 80, rate: 13.5 },
];
const rec = Calc.reconcile(ours, theirs, {
  key: "id",
  fields: [{ field: "outstanding" }, { field: "rate" }],
  tolerance: 0.01,
});
H.eq(rec.matched, 2, "two loans agree on every compared field");
H.eq(rec.breaks.length, 3, "one amount mismatch and two one-sided records");
H.eq(rec.breaks.filter((b) => b.kind === "mismatch").length, 1, "L-1003 differs on outstanding");
H.eq(rec.breaks.filter((b) => b.kind === "missing-theirs").length, 1, "L-1004 is on our books only");
H.eq(rec.breaks.filter((b) => b.kind === "missing-ours").length, 1, "L-1005 is on theirs only");
near(rec.totals.outstanding.diff, 1530000 - 1654000, "the totals differ by the one-sided records and the break", 0.01);

/* The retention floor: a share below 10 per cent is the breach that
   part-prepayment application produces without anybody deciding to. */
const belowFloor = ours.filter((r) => r.share < 10);
H.eq(belowFloor.length, 1, "one loan has fallen below the ten per cent retention floor");
H.eq(belowFloor[0].id, "L-1003", "and it is the one whose outstanding also disagrees");

/* ================= no model, no network ================= */
H.section("Nothing here needs a model or a network");

/* The claim is that a task completes with the key revoked. Prove it by
   revoking it and running the whole engine again. */
if (typeof Keys !== "undefined" && Keys.set) { try { Keys.set("openai", ""); } catch (e) {} }
S.apiKey = "";
Config.product.apiKey = "";
const offlineFetch = global.fetch;
global.fetch = function () { throw new Error("the computation engine attempted a network call"); };

try {
  const again = Calc.run({
    lines: [
      { label: "Principal outstanding", op: "value", from: "pos", as: "P" },
      { label: "Interest", op: "interest", of: "pos", rate: "roi", days: "days", as: "I" },
    ],
    total: { label: "Payable", of: ["P", "I"] },
  }, answers);
  near(again.total.value, 1269694.68, "the same quote computes with no key and no network", 0.01);
  H.eq(Calc.stage(94).code, "NPA", "classification too");
  H.eq(Calc.schedule(100000, 10, 12, "2026-09-05").length, 12, "and the schedule");
  H.ok(Calc.apr(490000, instal, 60) > 12, "and the all-inclusive rate");
} finally {
  global.fetch = offlineFetch;
}

H.report(`SARA computation (${edition})`);
