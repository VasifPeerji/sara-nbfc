/* ==================================================================
   test_router.js
   ------------------------------------------------------------------
   The router decides which of four products answers a message, and it
   has to do that with no API key at all, because that is how this file
   is demonstrated most of the time. So the deterministic classifier is
   the thing under test here, on a corpus of real questions.

   The bar is not "the LLM will sort it out". It is: with no network,
   does the right thing happen.

       node test/test_router.js
   ================================================================== */

const H = require("./harness");

H.loadEdition(process.argv[2] || "nbfc");
H.loadSrc();

/* the app builds the retrieval index at boot; the router leans on it to
   tell a knowledge question from a general one, so build it here too */
Retrieval.build();

/* sign in, since routing is per-role */
function signIn(roleKey) {
  const role = Config.roles.find(r => r.key === roleKey);
  const user = Config.users.find(u => u.roleKey === roleKey) || { name: "Test User", roleKey: roleKey };
  S.user = user;
  S.role = role;
  return role;
}

function rule(text) { return Router.rulesClassify(text); }

/* ==================================================================
   1. the registry the router can reach
   ================================================================== */
H.section("The router can only launch things that exist");

/* Signed in as Central Operations: the profile that reaches the most
   guided tasks, so "the subset is a real one" is actually testing
   something. A Managing Director legitimately reaches none of them —
   guided tasks are operational instruments — which is why the sweep
   below asks whether every journey is reachable by SOMEBODY rather
   than whether any one profile reaches them all. */
signIn("central_ops");

const ops = Router.operatorRuns();
const tasks = Router.taskRuns();

H.eq(ops.length, OP_ORDER.length, "every Operator application is reachable");
ops.forEach(r => {
  const at = 'operator run "' + r.id + '"';
  H.ok(!!r.title && r.title.length > 8, at + " has a run title a person would recognise");
  H.ok(!!r.what && r.what.length > 40, at + " says what it actually does");
  H.ok(r.triggers.length >= 10, at + " carries enough trigger vocabulary (" + r.triggers.length + ")");
  H.ok(r.steps >= 8, at + " has a real journey behind it");
});
/* A profile reaches a subset of the guided tasks by design: a Managing
   Director prepares no foreclosure quotes and reaches none of them at
   all. What matters is that the subset is a real one for the people who
   do the work, and that every journey is reachable by somebody. */
H.ok(tasks.length >= 1, "the signed-in profile reaches the tasks that are theirs (" + tasks.length + ")");
tasks.forEach(r => {
  H.ok(!!Journeys.find(r.id), 'task "' + r.id + '" resolves to a real journey');
});
const reachable = new Set();
Config.roles.forEach(r => {
  S.role = r;
  Router.taskRuns().forEach(t => reachable.add(t.id));
});
Config.journeys.forEach(j => {
  H.ok(reachable.has(j.id), 'journey "' + j.id + '" is reachable by at least one role');
});

/* a target that does not exist can never be launched */
signIn("md_ceo");
H.eq(Router.findRun("operator", "nonexistent"), null, "an unknown operator id resolves to nothing");
H.eq(Router.findRun("task", "made-up-task"), null, "an unknown task id resolves to nothing");
H.eq(Router.findRun("operator", "foreclosure_quote"), null, "a task id is not accepted as an operator id");

/* every journey in the edition carries trigger vocabulary, or the
   deterministic classifier can never reach it */
H.section("Every guided task is reachable without a model");
Config.journeys.forEach(j => {
  H.ok((j.triggers || []).length >= 5,
    'journey "' + j.id + '" carries trigger vocabulary (' + (j.triggers || []).length + ")");
});

/* ------------------------------------------------------------------
   and the two lists must not share vocabulary

   A phrase in both an Operator run's triggers and a guided task's is a
   phrase whose outcome is settled by tie-breaking rather than by
   anybody. The split is: the guided task answers whether, which or how
   much; the Operator does the work in the system. So "can this vehicle
   be repossessed" is the task and "raise a repossession request" is the
   Operator, and neither list carries the other's words.
------------------------------------------------------------------ */
H.section("The Operator and the guided tasks do not compete for the same words");

const journeyTriggers = [];
Config.journeys.forEach(j => (j.triggers || []).forEach(t => journeyTriggers.push([String(t).toLowerCase(), j.id])));

OP_ORDER.forEach(key => {
  (OP_DEPT[key].triggers || []).forEach(tr => {
    const t = String(tr).toLowerCase();
    const clash = journeyTriggers.find(([jt]) => jt === t || jt.indexOf(t) !== -1 || t.indexOf(jt) !== -1);
    H.ok(!clash, 'operator "' + key + '" trigger "' + t + '" does not overlap a task trigger' +
      (clash ? ' (clashes with "' + clash[0] + '" on ' + clash[1] + ")" : ""));
  });
});

/* and no two guided tasks claim the same phrase either */
const seen = new Map();
journeyTriggers.forEach(([t, id]) => {
  const prior = seen.get(t);
  H.ok(prior === undefined || prior === id, 'task trigger "' + t + '" belongs to one task only');
  seen.set(t, id);
});

/* ==================================================================
   2. the deterministic classifier, on real questions
   ================================================================== */
H.section("Operator: work to be done in the systems of record");

/* Signed in as Central Operations throughout: the role that reaches the
   most guided tasks, so the Operator has to win on its own merits rather
   than by the tasks being unavailable. */
signIn("central_ops");

const OPERATOR_CASES = [
  ["take the application through to a credit decision", "origination"],
  ["pull the bureau report and route it to the sanctioning authority", "origination"],
  ["work the application up to sanction", "origination"],
  ["book the disbursement on LN-CV-2026-0118420", "lms"],
  ["release the funds to the dealer and register the mandate", "lms"],
  ["set up the loan and set the first instalment", "lms"],
  ["work the arrears on this account", "collections"],
  ["raise a repossession request on MH-31-CQ-4482", "collections"],
  ["open the collections queue and chase the account", "collections"],
  ["reconcile the partner file for july", "colending"],
  ["raise the settlement advice for the month", "colending"],
  ["run the reconciliation against the pool", "colending"],
  ["search the central kyc registry for this customer", "ckycr"],
  ["upload the kyc record to ckycr", "ckycr"],
  ["register the security interest on cersai", "cersai"],
  ["file the charge on the central register", "cersai"],
  ["file the return in cims", "cims"],
  ["submit the supervisory return", "cims"],
  ["answer the complaint in rbi cms", "cms"],
  ["lodge the response to the escalated complaint", "cms"],
];
OPERATOR_CASES.forEach(([q, want]) => {
  const d = rule(q);
  H.eq(d.intent, "operator", 'operator: "' + q + '" (why: ' + d.why + ")");
  if (d.intent === "operator") H.eq(d.target, want, 'operator: "' + q + '" reaches ' + want);
});

/* every application is reached by at least one of them, so a run that
   nothing routes to cannot sit in the estate unnoticed */
const reachedOps = new Set(OPERATOR_CASES.map(([q]) => rule(q).target));
OP_ORDER.forEach(k => H.ok(reachedOps.has(k), 'operator run "' + k + '" is reached by a real instruction'));

H.section("Guided task: work that should produce a record");

const TASK_CASES = [
  ["cse", "prepare a foreclosure quote for this account", "foreclosure_quote"],
  ["repo_coordinator", "can this vehicle be repossessed", "repossession_gate"],
  ["repo_coordinator", "repossession go no go on MH-31-CQ-4482", "repossession_gate"],
  ["portfolio_risk", "work out the asset classification on this account", "asset_classification"],
  ["credit_manager", "who can approve this deviation", "deviation_routing"],
  ["gro", "triage this complaint", "complaint_triage"],
  ["cpa", "check the identification pack", "kyc_validation"],
  ["loan_ops", "can this file disburse", "predisbursal_qc"],
  ["central_ops", "co-lending reconciliation for the month", "colending_recon"],
  ["gold_appraiser", "what is the gold loan ltv and can we auction", "gold_auction"],
  ["capmkt_ops", "work out the securities cover and whether a margin call is due", "securities_cover"],
  ["wholesale_rm", "run the covenant test on this facility", "covenant_monitoring"],
];
TASK_CASES.forEach(([role, q, want]) => {
  signIn(role);
  const d = rule(q);
  H.eq(d.intent, "task", 'task: "' + q + '" (why: ' + d.why + ")");
  if (d.intent === "task") H.eq(d.target, want, 'task: "' + q + '" reaches ' + want);
});

/* ------------------------------------------------------------------
   the question-shaped guided task

   Half of these tasks exist to answer a question and produce the
   working behind the answer, so their trigger lists are written as
   questions on purpose. A router that discarded a trigger because the
   sentence ends in a question mark would never reach them.
------------------------------------------------------------------ */
H.section("A task whose own question is asked verbatim is that task");

[["repo_coordinator", "can this vehicle be repossessed", "repossession_gate"],
 ["loan_ops", "can this file disburse", "predisbursal_qc"],
 ["credit_manager", "who can approve this deviation", "deviation_routing"]].forEach(([role, q, id]) => {
  signIn(role);
  const d = rule(q);
  H.eq(d.target, id, 'the task trigger carries it: "' + q + '"');
  H.has(d.why, "task trigger", "and the router says that is why");
});

H.section("Knowledge: the corpus should answer it");

signIn("branch_manager");
const KNOWLEDGE_CASES = [
  "what margin can we fund a used tipper at",
  "what does the policy say about the possession clause",
  "what has to be on the file before disbursal",
  "how long do we have to respond to a complaint",
  "what is the ceiling for a used commercial vehicle over five years",
  "what has to be endorsed on the registration certificate after delivery",
];
KNOWLEDGE_CASES.forEach(q => {
  const d = rule(q);
  H.eq(d.intent, "knowledge", 'knowledge: "' + q + '" (why: ' + d.why + ")");
});

/* ------------------------------------------------------------------
   asking ABOUT the subject is not asking the task's question

   The two shapes that have to stay with the corpus even when they
   contain a guided task's trigger word for word: a question that asks
   what a document says, and a question that asks what a thing is.
------------------------------------------------------------------ */
H.section("Asking what a document says, or what a thing is, stays knowledge");

const ABOUT_CASES = [
  ["repo_coordinator", "what does the policy say about repossession preconditions"],
  ["loan_ops", "what does the standard require for a disbursal checklist"],
  ["credit_manager", "where does the circular state who can approve this deviation"],
  ["gro", "what does the procedure say about the grievance clock"],
  ["portfolio_risk", "what does the policy say about asset classification"],
  ["gold_appraiser", "what does the manual say about gold loan ltv"],
  ["cse", "what is a foreclosure quote"],
  ["repo_coordinator", "what is a repossession authorisation"],
];
ABOUT_CASES.forEach(([role, q]) => {
  signIn(role);
  const d = rule(q);
  H.eq(d.intent, "knowledge", 'about, not do: "' + q + '" (why: ' + d.why + ")");
});

/* The same noun, two different intents. This is the distinction the
   whole router exists to make. */
H.section("The same subject, asked two ways");

signIn("central_ops");
const PAIRS = [
  ["what has to be on the file before disbursal", "knowledge",
   "book the disbursement on this account", "operator"],
  ["what does the co-lending arrangement say about apportionment", "knowledge",
   "reconcile the partner file for july", "operator"],
  ["what has to be searched before a charge is created", "knowledge",
   "register the security interest on cersai", "operator"],
];
PAIRS.forEach(([qa, wa, qb, wb]) => {
  H.eq(rule(qa).intent, wa, '"' + qa + '" is ' + wa);
  H.eq(rule(qb).intent, wb, '"' + qb + '" is ' + wb);
});

H.section("Productivity: in domain, but no document covers it");

signIn("credit_manager");
const PRODUCTIVITY_CASES = [
  "draft an email to the applicant explaining why the deviation was declined",
  "write a short note for the branch about the change to the margin ladder",
  "summarise this into three bullets for the monday credit meeting",
  "explain how a bureau score is put together in plain english",
  "help me word a message to the borrower about the retention",
];
PRODUCTIVITY_CASES.forEach(q => {
  const d = rule(q);
  H.ok(d.intent === "productivity" || d.intent === "knowledge",
    'productivity: "' + q + '" routes usefully, got ' + d.intent + " (" + d.why + ")");
});
/* the clearly-drafting ones must not be answered as if a document said it */
["draft an email to the applicant explaining why the deviation was declined",
 "help me word a message to the borrower about the retention"].forEach(q => {
  H.eq(rule(q).intent, "productivity", 'drafting: "' + q + '" is productivity, not knowledge');
});

H.section("Out of domain: politely not our business");

const OUT_CASES = [
  "what is the capital of Portugal",
  "write me a poem about the sea",
  "who won the football last night",
  "recommend a restaurant for dinner",
];
OUT_CASES.forEach(q => {
  H.eq(rule(q).intent, "outofdomain", 'out of domain: "' + q + '"');
});

/* ==================================================================
   3. access control still governs what the router offers
   ================================================================== */
H.section("The router never offers what the role may not run");

signIn("dealer_exec");
const dealerTasks = Router.taskRuns().map(r => r.id);
Config.journeys.forEach(j => {
  const allowed = !j.for || !j.for.length || j.for.indexOf("dealer_exec") !== -1;
  H.eq(dealerTasks.indexOf(j.id) !== -1, allowed,
    "a dealer sales executive " + (allowed ? "can" : "cannot") + ' reach "' + j.id + '"');
});

/* asking for a task this role cannot run must not route to it */
const denied = Config.journeys.find(j => j.for && j.for.length && j.for.indexOf("dealer_exec") === -1);
if (denied) {
  const d = rule((denied.triggers || [])[0] || denied.title);
  H.ok(d.intent !== "task" || d.target !== denied.id,
    'the dealer executive asking for "' + denied.id + '" is not routed into it');
}

/* ==================================================================
   4. the model classifies, it does not decide
   ================================================================== */
H.section("A hallucinated target can never launch anything");

signIn("md_ceo");
H.eq(Router._parseDecision('{"intent":"operator","target":"cersai","why":"x"}').intent, "operator",
  "a well-formed decision parses");
H.eq(Router._parseDecision('{"intent":"nonsense","target":"cersai"}'), null,
  "an intent outside the four is rejected");
H.eq(Router.findRun("operator", "made-up-department"), null,
  "a target the model invented resolves to nothing");

const msgs = Router._classifierMessages("anything");
H.ok(msgs.length >= 1, "the classifier prompt is built");
Router.INTENTS.forEach(i => {
  H.has(msgs[0].content, '"' + i + '"', "the classifier prompt defines intent " + i);
});

/* ==================================================================
   5. what the person is shown
   ================================================================== */
H.section("Every routed outcome renders something usable");

signIn("central_ops");
const opRun = Router.operatorRuns()[0];
const taskRun = Router.taskRuns()[0];
H.ok(!!opRun, "there is an Operator run to render");
H.ok(!!taskRun, "and a guided task this role can reach");

const opCard = Router.actionMarkup({ kind: "operator", id: opRun.id, launched: true });
H.ok(opCard.indexOf(opRun.title) !== -1, "the operator card names the run");
H.has(opCard, "Router.launch('operator'", "the operator card can be re-run");
H.eq((opCard.match(/<[^>]*>/g) || []).filter(t => (t.match(/"/g) || []).length % 2), [],
  "the operator card has no tag with unbalanced quotes");

const taskCard = Router.actionMarkup({ kind: "task", id: taskRun.id });
H.ok(taskCard.indexOf(taskRun.label) !== -1, "the task card names the task");
H.has(taskCard, "Router.launch('task'", "the task card can be started");

H.eq(Router.actionMarkup({ kind: "operator", id: "nope" }), "", "an unknown action renders nothing");
H.eq(Router.actionMarkup(null), "", "no action renders nothing");

const wall = Router.cardsMarkup(4, 3);
H.ok(wall.indexOf("RUN IT IN " + String(Config.operatorSystem).toUpperCase()) !== -1,
  "the welcome wall offers Operator runs alongside tasks, naming the real system");
H.eq((wall.match(/<[^>]*>/g) || []).filter(t => (t.match(/"/g) || []).length % 2), [],
  "the welcome wall has no tag with unbalanced quotes");

Router.INTENTS.forEach(i => {
  const b = Router.badge({ intent: i });
  H.ok(b.indexOf(Router.INTENT_LABEL[i]) !== -1, "intent " + i + " has a badge label");
});

/* the replies the router writes itself must be real prose, not stubs */
H.ok(Router.operatorReply(opRun).length > 120, "the operator reply says something");
H.ok(Router.taskReply(taskRun).length > 120, "the task reply says something");
H.ok(Router.outOfDomainReply().length > 120, "the out-of-domain reply says something");
H.has(Router.outOfDomainReply(), Config.company.short, "the out-of-domain reply names the company");

/* the productivity directive must forbid inventing provenance */
const dir = Router.productivityDirective();
H.has(dir, "Do not cite", "the productivity directive forbids citing a document");
H.has(dir, "Never invent a document id", "the productivity directive forbids inventing an id");
H.has(dir, "still applies in full", "the productivity directive keeps the hard limits");

/* ==================================================================
   6. the run is built from what was actually said
   ================================================================== */
H.section("Parameters come out of the request, and only out of the request");

signIn("central_ops");

const EXTRACT = [
  ["take the application for Ravindra Transport Company through to a credit decision, amount sought 18,60,000, over 42 months",
   "origination", { applicant: "Ravindra Transport Company", tenor: "42" }],
  ["book the disbursement on account LN-CV-2026-0118420, release 17,36,000",
   "lms", { loan: "LN-CV-2026-0118420" }],
  ["work the arrears on account LN-CV-2019-0044821, vehicle MH-31-CQ-4482",
   "collections", { account: "LN-CV-2019-0044821", vehicle: "MH-31-CQ-4482" }],
  ["reconcile the partner file for Nandini Bank Limited, month is July 2026",
   "colending", { partner: "Nandini Bank Limited", month: "July 2026" }],
  ["file the return in cims, DNBS-04A Structural Liquidity, Quarter ended 30 June 2026",
   "cims", { retn: "DNBS-04A Structural Liquidity", period: "Quarter ended 30 June 2026" }],
];

EXTRACT.forEach(([q, dept, want]) => {
  const d = rule(q);
  H.eq(d.intent, "operator", 'routes to the Operator: "' + q.slice(0, 46) + '…"');
  H.eq(d.target, dept, "reaches " + dept);
  const got = Router.extractParams("operator", dept, q);
  Object.keys(want).forEach(k => {
    H.eq(got[k], want[k], dept + " reads " + k + " from the request");
  });
});

/* The whole point: what was not said is not filled in. */
H.section("What was not said is left empty, not guessed");

const partial = Router.extractParams("operator", "collections",
  "work the arrears on account LN-CV-2019-0044821");
H.ok(!!partial.account, "the account that was stated is captured");
H.eq(partial.vehicle, undefined, "the registration that was NOT stated is left empty");
H.eq(partial.arrears, undefined, "and neither is the arrears figure invented");

const bare = Router.extractParams("operator", "collections", "work the arrears");
H.eq(Object.keys(bare).length, 0, "a bare instruction yields no invented values");

/* A figure that belongs to an identifier is not money. */
H.eq(Router.extractParams("operator", "lms", "book the disbursement on account LN-CV-2026-0118420").disbursal,
  undefined, "an account number is never read as an amount");

/* Every required field must be reachable by the extractor or askable,
   or the run would stall with no way forward. */
H.section("Every gated field can be supplied");
OP_ORDER.forEach(key => {
  const d = OP_DEPT[key];
  (d.fields || []).forEach(f => {
    const at = key + "." + f.id;
    H.ok(!!f.label, at + " has a label");
    if (f.required) {
      H.ok(!!f.ask && f.ask.length > 12, at + " has a question worth asking");
      H.ok((f.lead || []).length > 0 || !!f.options || f.kind === "money" || f.kind === "number",
        at + " can be read out of a sentence");
    }
  });
  /* a step that declares a need must name a field that exists */
  d.steps.forEach((s, i) => {
    if (!s[3]) return;
    String(s[3]).split(",").map(x => x.trim()).forEach(id => {
      H.ok((d.fields || []).some(f => f.id === id),
        key + " step " + i + ' needs "' + id + '", which is a declared field');
    });
  });
  /* every required field is gated by some step, or nothing would ever ask */
  (d.fields || []).filter(f => f.required).forEach(f => {
    H.ok(d.steps.some(s => s[3] && String(s[3]).split(",").map(x => x.trim()).indexOf(f.id) !== -1),
      key + "." + f.id + " is required, so some step must gate on it");
  });
});

/* ==================================================================
   7. guided tasks are built from the request too
   ================================================================== */
H.section("Guided tasks read the request the same way");

signIn("repo_coordinator");
const JOURNEY_CASES = [
  ["can this vehicle be repossessed, account LN-CV-2019-0044821, vehicle MH-31-CQ-4482",
   "repossession_gate", { account: "LN-CV-2019-0044821", vehicle: "MH-31-CQ-4482" }],
];
JOURNEY_CASES.forEach(([q, id, want]) => {
  const d = rule(q);
  H.eq(d.intent, "task", 'task: "' + q.slice(0, 44) + '…"');
  H.eq(d.target, id, "reaches " + id);
  const got = Router.extractJourney(id, q);
  Object.keys(want).forEach(k => H.eq(got[k], want[k], id + " reads " + k + " from the request"));
  /* every extracted key must be a real step of that journey */
  const steps = new Set((Journeys.find(id).steps || []).map(s => s.id));
  Object.keys(got).forEach(k => H.ok(steps.has(k), id + ' extracted "' + k + '", which is a real step'));
});

/* A choice is never guessed. */
H.section("A choice is matched exactly or left for the person");
signIn("portfolio_risk");
const q1 = Router.extractJourney("asset_classification",
  "work out the classification, the facility has something behind it");
H.eq(q1.secured, undefined, "a loose word overlap does not select an option");
const q2 = Router.extractJourney("asset_classification",
  "work out the classification, the facility is Secured");
H.eq(q2.secured, "Secured", "an option named in the request is selected");

/* A value question with no value in the request stays unanswered. */
const co = Router.extractJourney("repossession_gate", "can this vehicle be repossessed");
H.eq(co.account, undefined, "no account in the request means none is invented");
H.eq(co.dpdDays, undefined, "and no days past due either");

/* Nothing is extracted for a journey the request does not describe. */
H.eq(Object.keys(Router.extractJourney("gold_auction", "what is the policy on parental leave")).length, 0,
  "an unrelated request prefills nothing");

/* Extraction must never return a value for a step id that does not exist. */
Config.journeys.forEach(j => {
  const ids = new Set((j.steps || []).map(s => s.id));
  const got = Router.extractJourney(j.id,
    "raise it for Ravindra Transport on LN-CV-2026-0118420, quoted 18,60,000, it is Secured");
  Object.keys(got).forEach(k => H.ok(ids.has(k), j.id + ' never invents the step "' + k + '"'));
});

/* ==================================================================
   8. a trigger has to land on a word
   ================================================================== */
H.section("A trigger matches a word, not a fragment inside one");

/* "los" sat inside "forecLOSure", so an acronym trigger scored on every
   question that happened to contain a longer word wrapping it. The
   acronym is gone from the list, and the matcher no longer allows it. */
signIn("cse");
const fq = rule("prepare a foreclosure quote for this account");
H.eq(fq.intent, "task", "a foreclosure quote is a guided task");
H.eq(fq.target, "foreclosure_quote", "and it is that task, not Loan Origination");

/* the same guarantee, stated directly against the scorer */
OP_ORDER.forEach(key => {
  (OP_DEPT[key].triggers || []).forEach(tr => {
    const t = String(tr);
    if (t.indexOf(" ") !== -1) return;
    H.ok(t.length >= 3, 'operator "' + key + '" single-word trigger "' + t + '" is long enough to be meant');
  });
});

/* ==================================================================
   9. the two measured constants
   ------------------------------------------------------------------
   The corpus floor and the noise list are numbers somebody measured
   against a corpus, and this corpus is not the one they were first
   measured against. Both are pinned here so that adding documents,
   which changes IDF, fails this file rather than quietly changing what
   the product treats as its own business.
   ================================================================== */
H.section("The corpus floor sits above the junk, not below the questions");

/* Real questions, across every role and segment, phrased as the people
   who hold those roles phrase them. */
const REAL_QUESTIONS = [
  ["branch_manager", "what margin can we fund a used tipper at"],
  ["credit_manager", "what is the ceiling for a used commercial vehicle over five years"],
  ["cpa", "what counts as an officially valid document for address proof"],
  ["loan_ops", "what has to be on the file before we can disburse"],
  ["pdd_officer", "how long do we have to get the hypothecation endorsed"],
  ["repo_coordinator", "what has to be true before we can take possession of a vehicle"],
  ["field_collections", "what are the rules on the hours a recovery agent may call"],
  ["acm", "when does an account become non performing"],
  ["gold_appraiser", "what notice is required before a gold auction"],
  ["capmkt_ops", "what haircut applies to loans against shares"],
  ["wholesale_rm", "what happens if a borrower breaches a financial covenant"],
  ["cse", "how is a foreclosure charge calculated on a floating rate loan"],
  ["gro", "what is the timeline for responding to a grievance"],
  ["chief_compliance", "what does scale based regulation require of a middle layer nbfc"],
  ["principal_officer", "what triggers a suspicious transaction report"],
  ["reporting_analyst", "which returns does an nbfc file quarterly"],
  ["treasury_analyst", "what are the asset liability mismatch limits"],
  ["cro", "how is expected credit loss provisioning staged"],
  ["digital_pm", "what has to be disclosed in a key facts statement"],
  ["central_ops", "how are co-lending receipts apportioned between partners"],
  ["rcu_officer", "what happens when a document is found to be forged"],
  ["bc_agent", "what is the household income limit for a microfinance loan"],
];

/* Nothing here is company business by any reading. */
const JUNK_QUESTIONS = [
  "what is the capital of Portugal",
  "write me a poem about the sea",
  "who won the football last night",
  "recommend a restaurant for dinner",
  "how do I bake sourdough bread",
  "what is the tallest mountain in the world",
  "tell me a joke about penguins",
  "what year did the second world war end",
  "how many kilometres is a marathon",
  "what is the best film of all time",
  "explain photosynthesis to a child",
  "what is the offside rule in football",
  "give me a workout plan for the week",
  "how do I get a stain out of a shirt",
  "what is the population of Brazil",
  "how long should I boil an egg",
  "what is the speed of light",
];

function topScore(q) {
  const hit = Retrieval.search(q, { role: S.role, topK: 4 });
  const src = hit && hit.sources && hit.sources[0];
  return src && typeof src.score === "number" ? src.score : 0;
}

let junkTop = 0, realTop = 0, realLow = Infinity;
JUNK_QUESTIONS.forEach(q => { signIn("md_ceo"); junkTop = Math.max(junkTop, topScore(q)); });
REAL_QUESTIONS.forEach(([role, q]) => {
  signIn(role);
  const s = topScore(q);
  realTop = Math.max(realTop, s);
  realLow = Math.min(realLow, s);
});

H.ok(junkTop < Router.CORPUS_FLOOR,
  "general-knowledge junk tops out at " + junkTop.toFixed(1) +
  ", under the floor of " + Router.CORPUS_FLOOR);
H.ok(realTop > Router.CORPUS_FLOOR * 2,
  "a real question reaches " + realTop.toFixed(1) + ", well clear of it");

/* The two ranges overlap, and that is the point: the floor cannot be a
   question detector, so it is not asked to be one. A real question
   below it still reaches the corpus, through the in-domain branch. */
H.ok(realLow < junkTop,
  "the ranges overlap (" + realLow.toFixed(1) + " vs " + junkTop.toFixed(1) +
  "), so the floor is a junk filter and not a question detector");

REAL_QUESTIONS.forEach(([role, q]) => {
  signIn(role);
  const d = rule(q);
  H.ok(d.intent !== "outofdomain", 'in domain: "' + q + '" (' + d.intent + ", " + d.why + ")");
});
JUNK_QUESTIONS.forEach(q => {
  signIn("md_ceo");
  const d = rule(q);
  H.eq(d.intent, "outofdomain", 'out of domain: "' + q + '" (' + d.why + ")");
});

H.section("The domain vocabulary does not depend on who signed in first");

/* It is built once and cached. Building it from the runs the CURRENT
   role can reach meant whoever signed in first decided, for the whole
   session, what the product considered to be its own business — 1,014
   words for one profile against 1,043 for another. */
const vocab = Router._domainVocab();
["sales_officer", "central_ops", "md_ceo", "dealer_exec"].forEach(k => {
  signIn(k);
  H.eq(Router._domainVocab().size, vocab.size,
    "the vocabulary is the same size signed in as " + k);
});
["foreclosure", "covenant", "auction", "repossession", "cersai", "mandate"].forEach(w => {
  H.ok(vocab.has(w), 'the vocabulary knows "' + w + '" whoever is signed in');
});

H.report("SARA intent router");
