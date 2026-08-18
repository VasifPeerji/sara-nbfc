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

signIn("gm");

const ops = Router.operatorRuns();
const tasks = Router.taskRuns();

H.eq(ops.length, OP_ORDER.length, "every Operator department is reachable");
ops.forEach(r => {
  const at = 'operator run "' + r.id + '"';
  H.ok(!!r.title && r.title.length > 8, at + " has a run title a person would recognise");
  H.ok(!!r.what && r.what.length > 40, at + " says what it actually does");
  H.ok(r.triggers.length >= 10, at + " carries enough trigger vocabulary (" + r.triggers.length + ")");
  H.ok(r.steps >= 8, at + " has a real journey behind it");
});
/* A profile reaches a subset of the guided tasks by design: a Managing
   Director does not raise non-conformities. What matters is that the
   subset is a real one and that every journey is reachable by somebody. */
H.ok(tasks.length >= 1, "the signed-in profile reaches the tasks that are theirs (" + tasks.length + ")");
tasks.forEach(r => {
  H.ok(!!Journeys.find(r.id), 'task "' + r.id + '" resolves to a real journey');
});
const reachable = new Set();
Config.roles.forEach(r => {
  S.role = r;
  Router.taskRuns().forEach(t => reachable.add(t.id));
});
S.role = Config.roles.find(r => r.key === "dealer_principal");
Config.journeys.forEach(j => {
  H.ok(reachable.has(j.id), 'journey "' + j.id + '" is reachable by at least one role');
});

/* a target that does not exist can never be launched */
H.eq(Router.findRun("operator", "nonexistent"), null, "an unknown operator id resolves to nothing");
H.eq(Router.findRun("task", "made-up-task"), null, "an unknown task id resolves to nothing");
H.eq(Router.findRun("operator", "service-write-up"), null, "a task id is not accepted as an operator id");

/* every journey in the edition carries trigger vocabulary, or the
   deterministic classifier can never reach it */
H.section("Every guided task is reachable without a model");
Config.journeys.forEach(j => {
  H.ok((j.triggers || []).length >= 5,
    'journey "' + j.id + '" carries trigger vocabulary (' + (j.triggers || []).length + ")");
});

/* ==================================================================
   2. the deterministic classifier, on real questions
   ================================================================== */
H.section("Operator: work to be done in the systems of record");

const OPERATOR_CASES = [
  ["park up HT-412 and re-cut the shift plan", "control"],
  ["take it out of service on the shift board", "control"],
  ["reassign the crew to another source", "control"],
  ["plan the work order and release it", "maintenance"],
  ["create the order from the notification", "maintenance"],
  ["schedule the repair in sap pm", "maintenance"],
  ["build the isolation list and issue the permit", "isolation"],
  ["generate the tagging list for the asset", "isolation"],
  ["raise the work clearance application", "isolation"],
  ["record it in ehs and classify the incident", "safety"],
  ["notify the regulator and assign the investigation", "safety"],
  ["raise a purchase requisition for the strut", "supply"],
  ["check stock across the group and source the part", "supply"],
  ["process the mobilisation and grant site access", "contractor"],
  ["check the induction pack for the crew", "contractor"],
];
OPERATOR_CASES.forEach(([q, want]) => {
  const d = rule(q);
  H.eq(d.intent, "operator", 'operator: "' + q + '" (why: ' + d.why + ")");
  if (d.intent === "operator") H.eq(d.target, want, 'operator: "' + q + '" reaches ' + want);
});

H.section("Guided task: work that should produce a record");

signIn("supervisor");
const TASK_CASES = [
  ["prepare a permit to work for the conveyor job", "permit-isolation"],
  ["write up an incident from last night", "hazard-incident"],
  ["capture the defect the operator reported", "defect-workorder"],
  ["put together a shift handover", "shift-handover"],
];
TASK_CASES.forEach(([q, want]) => {
  const d = rule(q);
  H.eq(d.intent, "task", 'task: "' + q + '" (why: ' + d.why + ")");
  if (d.intent === "task") H.eq(d.target, want, 'task: "' + q + '" reaches ' + want);
});

signIn("tsf_eng");
[["complete the tailings surveillance record for this week", "tsf-surveillance"],
 ["report an environmental incident, we have a hydrocarbon spill", "environmental-incident"]]
.forEach(([q, want]) => {
  const d = rule(q);
  H.eq(d.intent, "task", 'task: "' + q + '"');
  if (d.intent === "task") H.eq(d.target, want, 'task: "' + q + '" reaches ' + want);
});

H.section("Knowledge: the corpus should answer it");

signIn("supervisor");
const KNOWLEDGE_CASES = [
  "what geotechnical inspections are required after a significant rainfall event",
  "what beach width and freeboard does the tailings operating manual require",
  "what exclusion distances apply for a surface production blast",
  "what has to be verified before a contractor worker can mobilise to site",
  "what energy sources have to be isolated on a haul truck before working on it",
  "what does the standard require after a high potential incident",
];
KNOWLEDGE_CASES.forEach(q => {
  const d = rule(q);
  H.eq(d.intent, "knowledge", 'knowledge: "' + q + '" (why: ' + d.why + ")");
});

/* The same noun, two different intents. This is the distinction the
   whole router exists to make. */
H.section("The same subject, asked two ways");

signIn("mine_manager");
const PAIRS = [
  ["what has to be on an isolation list", "knowledge",
   "build the isolation list and issue the permit", "operator"],
  ["what does a maintenance work order have to carry before it can be scheduled", "knowledge",
   "plan the work order and release it", "operator"],
  ["what has to happen before a contractor crew starts work", "knowledge",
   "process the mobilisation and grant site access", "operator"],
];
PAIRS.forEach(([qa, wa, qb, wb]) => {
  H.eq(rule(qa).intent, wa, '"' + qa + '" is ' + wa);
  H.eq(rule(qb).intent, wb, '"' + qb + '" is ' + wb);
});

H.section("Productivity: in domain, but no document covers it");

signIn("mine_manager");
const PRODUCTIVITY_CASES = [
  "draft an email to the contractor explaining why the mobilisation is on hold",
  "write a short note for the crew about the change to the shift plan",
  "summarise this into three bullets for the Monday operations meeting",
  "explain how a slope monitoring radar works in plain english",
  "help me word a message to the community about tomorrow's blast",
];
PRODUCTIVITY_CASES.forEach(q => {
  const d = rule(q);
  H.ok(d.intent === "productivity" || d.intent === "knowledge",
    'productivity: "' + q + '" routes usefully, got ' + d.intent + " (" + d.why + ")");
});
/* the clearly-drafting ones must not be answered as if a document said it */
["draft an email to the contractor explaining why the mobilisation is on hold",
 "help me word a message to the community about tomorrow's blast"].forEach(q => {
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

signIn("operator");
const opTasks = Router.taskRuns().map(r => r.id);
Config.journeys.forEach(j => {
  const allowed = !j.for || !j.for.length || j.for.indexOf("operator") !== -1;
  H.eq(opTasks.indexOf(j.id) !== -1, allowed,
    'haul truck operator ' + (allowed ? "can" : "cannot") + ' reach "' + j.id + '"');
});

/* asking for a task this role cannot run must not route to it */
const denied = Config.journeys.find(j => j.for && j.for.length && j.for.indexOf("operator") === -1);
if (denied) {
  const d = rule((denied.triggers || [])[0] || denied.title);
  H.ok(d.intent !== "task" || d.target !== denied.id,
    'the haul truck operator asking for "' + denied.id + '" is not routed into it');
}

/* ==================================================================
   4. the model classifies, it does not decide
   ================================================================== */
H.section("A hallucinated target can never launch anything");

signIn("gm");
H.eq(Router._parseDecision('{"intent":"operator","target":"isolation","why":"x"}').intent, "operator",
  "a well-formed decision parses");
H.eq(Router._parseDecision('{"intent":"nonsense","target":"isolation"}'), null,
  "an unknown intent is rejected outright");
H.eq(Router._parseDecision("I think this is about the isolation app"), null,
  "prose instead of JSON is rejected");
H.eq(Router._parseDecision('```json\n{"intent":"task","target":"hazard-incident","why":"y"}\n```').target,
  "hazard-incident", "a fenced decision still parses");
H.eq(Router._parseDecision(""), null, "an empty reply is rejected");

/* the classifier prompt must actually contain the real ids, or the model
   is being asked to invent them */
const msgs = Router._classifierMessages("issue the permit");
H.eq(msgs.length, 2, "the classifier call is one system message and the query");
Router.operatorRuns().forEach(r => {
  H.has(msgs[0].content, '"' + r.id + '"', "the classifier prompt lists operator id " + r.id);
});
Router.taskRuns().forEach(r => {
  H.has(msgs[0].content, '"' + r.id + '"', "the classifier prompt lists task id " + r.id);
});
Router.INTENTS.forEach(i => {
  H.has(msgs[0].content, '"' + i + '"', "the classifier prompt defines intent " + i);
});

/* ==================================================================
   5. what the person is shown
   ================================================================== */
H.section("Every routed outcome renders something usable");

signIn("mine_manager");
const opRun = Router.operatorRuns()[0];
const taskRun = Router.taskRuns()[0];

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

signIn("mine_manager");

const EXTRACT = [
  ["park up unit HT-412, the operator is reporting a rumbling noise from the rear left, area is Pit 3 470 bench",
   "control", { unit: "HT-412", area: "Pit 3 470 bench" }],
  ["plan the work order on asset HT-412 at priority 2 High",
   "maintenance", { asset: "HT-412", priority: "2 High" }],
  ["build the isolation list for asset CV-204, crew of 4 people",
   "isolation", { asset: "CV-204", party: "4" }],
  ["record it in ehs, site is Northgate, potential is Fatality or permanent disability",
   "safety", { site: "Northgate", potential: "Fatality or permanent disability" }],
  ["raise a purchase requisition, quantity 2, value about $86,400",
   "supply", { qty: "2", value: "$86,400" }],
  ["process the mobilisation for Rockline Mining Services, site is Marra Downs, a crew of 22 people",
   "contractor", { company: "Rockline Mining Services", site: "Marra Downs", headcount: "22" }],
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

const partial = Router.extractParams("operator", "contractor",
  "process the mobilisation for Rockline Mining Services, site is Marra Downs");
H.ok(!!partial.company, "the company that was stated is captured");
H.ok(!!partial.site, "the site that was stated is captured");
H.eq(partial.headcount, undefined, "the headcount that was NOT stated is left empty");

const bare = Router.extractParams("operator", "contractor", "process the mobilisation");
H.eq(Object.keys(bare).length, 0, "a bare instruction yields no invented values");

/* A figure that belongs to an identifier is not money. */
H.eq(Router.extractParams("operator", "supply", "raise a purchase requisition against order 4000871").value, undefined,
  "an order number is never read as an amount");

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

/* as a role the tasks are actually offered to: a task the signed-in
   person cannot run must not be routed to, which is tested above */
signIn("supervisor");

const JOURNEY_CASES = [
  ["write up an incident, site is Northgate, worst credible outcome is Fatality or permanent disability",
   "hazard-incident", { site: "Northgate", potential: "Fatality or permanent disability" }],
  ["capture the defect on asset HT-412, the system is Braking",
   "defect-workorder", { asset: "HT-412", system: "Braking" }],
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

/* A choice is never guessed. "a service booking" must not select the
   "Scheduled service" option out of the visit-type list. */
H.section("A choice is matched exactly or left for the person");
const q1 = Router.extractJourney("hazard-incident",
  "write up an incident, something nearly went wrong on the plant");
H.eq(q1.kind, undefined, "a loose word overlap does not select an outcome");
const q2 = Router.extractJourney("hazard-incident",
  "write up an incident, it was a Near miss");
H.eq(q2.kind, "Near miss", "an option named in the request is selected");

/* A value question with no value in the request stays unanswered. */
const co = Router.extractJourney("defect-workorder", "capture the defect on asset HT-412");
H.eq(co.symptom, undefined, "no description in the request means none is invented");

/* Nothing is extracted for a journey the request does not describe. */
H.eq(Object.keys(Router.extractJourney("blast-clearance", "what is the policy on parental leave")).length, 0,
  "an unrelated request prefills nothing");

/* Extraction must never return a value for a step id that does not exist. */
Config.journeys.forEach(j => {
  const ids = new Set((j.steps || []).map(s => s.id));
  const got = Router.extractJourney(j.id, "raise it for Mrs Delaney on RO-118402, quoted $486, it is red");
  Object.keys(got).forEach(k => H.ok(ids.has(k), j.id + ' never invents the step "' + k + '"'));
});

H.report("SARA intent router");
