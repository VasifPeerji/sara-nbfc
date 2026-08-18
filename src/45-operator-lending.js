/* ==================================================================
   45-operator-sap.js
   The systems a mine actually records work in, as the Operator drives
   them.
   ------------------------------------------------------------------
   Three things live here:

     OP_DEPT       the six applications, their fields and the step
                   sequence the Operator works through
     opAppSurface  every screen, authored at 1280 x 720
     OP_ANCHOR     which control each step acts on, by step index

   WHY THESE SYSTEMS. There is no single mining application used by a
   majority of mining companies. The fleet management market is split
   between four or five vendors, mine planning between another four,
   and safety systems between a dozen. There are only two things a
   mining company anywhere in the world reliably has: an ERP, which
   for the large majority of the industry is SAP, and a mine control
   or dispatch console, whose vendor differs but whose shape does not.
   So the Operator drives those two, and the mining-specific detail
   lives in the data on the screens rather than in a vendor's chrome.

   FIDELITY. The SAP side uses the published Fiori Horizon design
   values and the real Fiori intent-based URL shape
   (#SemanticObject-action), the real transaction concepts
   (notification, order, work clearance application, operational
   permit, requisition, release strategy) and the real module
   boundaries. It is not a screenshot of any customer's system, and
   no customer's Fiori launchpad looks exactly like anybody else's.
   The Mine Control console is deliberately generic: it is the shape
   common to the dispatch systems in use, not a copy of one of them.
   What is sourced and what is reconstructed is set out in
   MINING_FIDELITY.md.

   WHY THIS IS NOT THE PRODUCT. The Operator is the last mile. The
   value sits before it. The isolation list in the `isolation` run is
   right because the register and the standard say so; the notification
   deadline in the `safety` run comes from the jurisdiction matrix; and
   the `contractor` run stops itself, because the knowledge says the
   induction pack is fourteen months stale. SAP holds none of that.
   ================================================================== */

/* ---------------- the cast that appears inside the systems ---------- */
const SAP_PEOPLE = [
  { id: "DO", name: "D. Okoye",      role: "Mining Supervisor",        site: "Marra Downs" },
  { id: "WP", name: "W. Petersen",   role: "Heavy Duty Fitter",        site: "Marra Downs" },
  { id: "JB", name: "J. Bianchi",    role: "Maintenance Planner",      site: "Marra Downs" },
  { id: "SN", name: "S. Nakamura",   role: "Senior Geotechnical Eng.", site: "Marra Downs" },
  { id: "RF", name: "R. Fitzgerald", role: "HSE Superintendent",       site: "Marra Downs" },
  { id: "MK", name: "M. Kowalski",   role: "Contractor Management",    site: "Group" },
];

/* ==================================================================
   the six applications
   ================================================================== */
const OP_ORDER = ["control", "maintenance", "isolation", "safety", "supply", "contractor"];

const SAP_HOST = "fiori.{org}.com";
const SAP_SLUG = "sap/bc/ui2/flp";

const OP_DEPT = {

  /* ---------------------------------------------------------------
     MINE CONTROL
     The dispatch console. Every mine has one; the vendor differs.
     This is where a defect first becomes a decision, and where the
     ground status that should govern that decision is displayed.
  --------------------------------------------------------------- */
  control: {
    label: "Mine Control", slug: "ops", color: "#e0a11b",
    host: "minecontrol.{org}.com",
    favMark: "M", favBg: "#e0a11b",
    tabTitle: "Shift Board | Mine Control",
    icon: "monitor",
    runTitle: "Park the unit up and re-cut the shift plan",
    runWhat:
      "Takes an operator's concern off the radio and into the record: parks the unit, checks the ground status of the area the crew would be moved to, rebalances the assignments and raises the defect into maintenance.",
    fields: [
      { id: "unit", label: "Unit", required: true, kind: "id",
        ask: "Which unit is it?",
        why: "It selects the machine on the board, so the wrong one here parks up somebody else's truck.",
        hints: ["truck", "excavator", "loader", "drill", "dozer", "grader", "unit", "ht-", "ex-", "digger", "haul"],
        lead: ["unit", "truck", "on", "for", "machine", "the"] },
      { id: "concern", label: "Operator's concern", required: true,
        ask: "What is the operator reporting?",
        why: "It becomes the malfunction text on the notification, and a vague one costs the fitter an hour.",
        hints: ["noise", "leak", "brake", "steering", "vibration", "smell", "crack", "overheat", "warning", "alarm", "fault", "smoke", "bottoming"],
        lead: ["reporting", "reported", "concern is", "says", "complaining of", "with a", "has a"] },
      { id: "area", label: "Area",
        ask: "Which area is the crew working in?",
        options: ["Pit 3 470 bench", "Pit 3 490 bench", "Pit 1 320 bench", "ROM pad", "Waste dump north"],
        hints: ["pit", "bench", "ramp", "dump", "rom", "east wall", "cutback"],
        lead: ["in", "at", "on the", "area is", "working"] },
    ],
    triggers: [
      "park up", "park it up", "take it out of service", "shift board", "dispatch",
      "mine control", "reassign the crew", "rebalance the fleet", "unit is down",
      "truck is down", "re-cut the plan", "move the crew",
    ],
    nav: ["Shift Board", "Equipment", "Assignments", "Ground Status", "Reports"],
    paths: {
      home:     "shift-board",
      unit:     "equipment/unit",
      down:     "equipment/unit?status=parked",
      ground:   "ground-status",
      reassign: "assignments?rebalance=1",
      confirm:  "assignments?applied=1",
      defect:   "equipment/unit?notify=1",
      verify:   "shift-board?updated=1",
    },
    steps: [
      ["Open the shift board", "home", "inspect"],
      ["Select the unit", "unit", "click", "unit"],
      ["Record the operator's concern", "unit", "type", "concern"],
      ["Park the unit up and tag it out", "down", "click"],
      ["Check ground status before moving the crew", "ground", "click", "area"],
      ["Open assignment rebalance", "reassign", "click"],
      ["Move the crew to a released source", "reassign", "click"],
      ["Apply the revised shift plan", "confirm", "click"],
      ["Raise the defect into maintenance", "defect", "click"],
      ["Verify the board", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     SAP PLANT MAINTENANCE
     Notification to released work order. The transaction every
     maintenance department in the industry recognises.
  --------------------------------------------------------------- */
  maintenance: {
    label: "Maintenance", slug: SAP_SLUG, color: "#0070f2",
    host: SAP_HOST, favMark: "F", favBg: "#0070f2",
    tabTitle: "Maintenance Order | SAP Fiori",
    icon: "settings",
    runTitle: "Turn the defect into a released work order",
    runWhat:
      "Opens the notification the shift board raised, records the malfunction properly, classifies it, creates the order, plans the operations and components, checks material availability and releases it.",
    fields: [
      { id: "asset", label: "Asset", required: true, kind: "id",
        ask: "Which asset is the notification against?",
        why: "The asset drives the equipment master, the isolation register and the component list.",
        hints: ["truck", "excavator", "conveyor", "crusher", "mill", "pump", "screen", "unit", "ht-", "cv-", "asset"],
        lead: ["asset", "on", "for", "against", "equipment", "unit"] },
      { id: "concern", label: "Malfunction", required: true,
        ask: "What is the malfunction, as observed?",
        why: "It is the text the tradesperson reads before they walk to the machine.",
        hints: ["noise", "leak", "brake", "steering", "vibration", "crack", "overheat", "fault", "bottoming", "wear", "failure"],
        lead: ["malfunction is", "fault is", "symptom is", "reporting", "reported", "with a", "has a"] },
      { id: "priority", label: "Priority",
        ask: "What priority should this carry?",
        options: ["1 Very high", "2 High", "3 Medium", "4 Low"],
        hints: ["priority", "urgent", "immediate", "high", "medium", "low", "breakdown", "safety"],
        lead: ["priority", "at priority", "as", "urgency"] },
    ],
    triggers: [
      "work order", "maintenance order", "create the order", "plan the job",
      "release the order", "sap pm", "put it in sap", "schedule the repair",
      "plan the work order", "raise the maintenance order",
    ],
    nav: ["Home", "Notifications", "Orders", "Assets", "Confirmations"],
    paths: {
      home:     "#Shell-home",
      inbox:    "#MaintenanceNotification-manage",
      notif:    "#MaintenanceNotification-display&/10004417",
      classify: "#MaintenanceNotification-display&/10004417?classify=X",
      order:    "#MaintenanceOrder-create&/from=10004417",
      ops:      "#MaintenanceOrder-create&/operations",
      parts:    "#MaintenanceOrder-create&/components",
      avail:    "#MaterialAvailability-check&/4000871",
      release:  "#MaintenanceOrder-manage&/4000871?release=X",
      verify:   "#MaintenanceOrder-manage&/4000871",
    },
    steps: [
      ["Open the Fiori launchpad", "home", "inspect"],
      ["Open the notification inbox", "inbox", "click"],
      ["Open the notification", "notif", "click", "asset"],
      ["Record the malfunction detail", "notif", "type", "concern"],
      ["Classify the notification", "classify", "click", "priority"],
      ["Create the order from the notification", "order", "click"],
      ["Plan the operations", "ops", "click"],
      ["Add the components", "parts", "click"],
      ["Check material availability", "avail", "click"],
      ["Release the order", "release", "click"],
      ["Verify the order", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     SAP WORK CLEARANCE MANAGEMENT
     Operational permit and isolation. WCM is the real SAP module for
     this and it is used in mining, utilities and process plants.
     The verification screen is the one that matters.
  --------------------------------------------------------------- */
  isolation: {
    label: "Isolation", slug: SAP_SLUG, color: "#d20a0a",
    host: SAP_HOST, favMark: "F", favBg: "#0070f2",
    tabTitle: "Work Clearance | SAP Fiori",
    icon: "lock",
    runTitle: "Build the isolation list and issue the permit",
    runWhat:
      "Creates the work clearance application from the order, generates the tagging list from the asset's isolation register, verifies it against the plant, attaches the group lockbox and the work party, and takes it through approval to an issued operational permit.",
    fields: [
      { id: "asset", label: "Asset", required: true, kind: "id",
        ask: "Which asset is being isolated?",
        why: "The tagging list is generated from that asset's isolation register.",
        hints: ["conveyor", "crusher", "screen", "truck", "mill", "pump", "cv-", "ht-", "asset", "unit"],
        lead: ["asset", "isolate", "isolating", "on", "for", "the"] },
      { id: "work", label: "Work", required: true,
        ask: "What is the work?",
        why: "The permit covers an activity, not an intention, and the scope decides which controls attach.",
        hints: ["replace", "repair", "change", "inspect", "weld", "clean", "lagging", "pulley", "liner", "strut"],
        lead: ["work is", "to", "job is", "doing", "carrying out", "replacing", "repairing"] },
      { id: "party", label: "Work party size", kind: "number",
        ask: "How many people will be working on it?",
        why: "Every one of them puts a personal lock on the group lockbox, so the count has to be right.",
        hints: ["people", "person", "crew", "fitters", "party", "hands"],
        lead: ["people", "person", "crew of", "party of", "fitters"] },
    ],
    triggers: [
      "work clearance", "wcm", "tagging list", "issue the permit", "operational permit",
      "danger tags", "group lockbox", "build the isolation list", "print the tags",
      "generate the tagging list",
    ],
    nav: ["Home", "Applications", "Approvals", "Tagging", "Permits"],
    paths: {
      home:     "#WorkClearanceApplication-create&/from=4000871",
      scope:    "#WorkClearanceApplication-create&/scope",
      register: "#IsolationRegister-display&/asset",
      taglist:  "#WorkClearanceApplication-create&/tagging",
      check:    "#WorkClearanceApplication-create&/verify",
      lockbox:  "#WorkClearanceApplication-create&/lockbox",
      approve:  "#WorkApproval-manage&/30112",
      issue:    "#OperationalPermit-issue&/88214",
      verify:   "#OperationalPermit-issue&/88214?print=X",
    },
    steps: [
      ["Open work clearance management", "home", "inspect"],
      ["Create the application from the order", "home", "click", "asset"],
      ["Describe the work", "scope", "type", "work"],
      ["Open the isolation register for the asset", "register", "click"],
      ["Generate the tagging list", "taglist", "click"],
      ["Verify the list against the plant", "check", "click"],
      ["Attach the group lockbox and the work party", "lockbox", "click", "party"],
      ["Send for work approval", "approve", "click"],
      ["Issue the operational permit", "issue", "click"],
      ["Print the danger tags", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     SAP EHS — INCIDENT MANAGEMENT
     The jurisdiction notification screen is the one nobody else can
     produce, because the rule is in the knowledge base, not the ERP.
  --------------------------------------------------------------- */
  safety: {
    label: "Safety", slug: SAP_SLUG, color: "#e76500",
    host: SAP_HOST, favMark: "E", favBg: "#d20a0a",
    tabTitle: "Incident | SAP EHS",
    icon: "alert",
    runTitle: "Record the incident and start what it triggers",
    runWhat:
      "Creates the incident record, classifies it on worst credible outcome rather than actual outcome, links the critical control involved, resolves the notification obligation for that jurisdiction, assigns the investigation and raises the control verification it should trigger.",
    fields: [
      { id: "site", label: "Site", required: true,
        ask: "Which site did this happen at?",
        why: "The notification obligation, the regulator and the timeframe are all different at each of the six.",
        options: ["Marra Downs", "Northgate", "Cerro Bravo", "Kalunga", "Talbot Lake", "Tanjung Rasa"],
        hints: ["marra", "northgate", "cerro", "kalunga", "talbot", "tanjung", "site", "mine"],
        lead: ["at", "on", "site is", "happened at", "from"] },
      { id: "event", label: "What happened", required: true,
        ask: "What happened, factually?",
        why: "It is the record an investigation and possibly a regulator will read.",
        hints: ["found", "defeated", "fell", "struck", "injured", "guard", "interlock", "released", "collapsed", "fire", "magnet"],
        lead: ["happened", "found", "reporting", "a fitter", "an operator", "somebody", "we found"] },
      { id: "potential", label: "Worst credible outcome",
        ask: "If it had gone slightly differently, what was the worst credible outcome?",
        why: "Classification runs on potential, not on what actually happened, and it drives everything downstream.",
        options: ["Fatality or permanent disability", "Serious injury, lost time", "Minor injury, treatment only", "No injury potential"],
        hints: ["fatality", "fatal", "permanent", "serious", "lost time", "minor", "no injury", "potential"],
        lead: ["potential", "could have", "worst case", "classified as"] },
    ],
    triggers: [
      "record it in ehs", "ehs", "incident record", "notify the regulator",
      "start the investigation", "classify the incident", "raise the incident in ehs",
      "log it in ehs", "assign the investigation", "link the critical control",
      "resolve the notification",
    ],
    nav: ["Home", "Incidents", "Risk", "Actions", "Controls"],
    paths: {
      home:      "#IncidentManagement-manage",
      record:    "#Incident-create",
      classify:  "#Incident-create&/classification",
      control:   "#Incident-create&/controls",
      notify:    "#Incident-create&/notification",
      invest:    "#Incident-manage&/26-0417?investigation=X",
      ccv:       "#ControlVerification-create&/from=26-0417",
      assign:    "#ControlVerification-create&/assignment",
      verify:    "#IncidentManagement-manage&/26-0417",
    },
    steps: [
      ["Open incident management", "home", "inspect"],
      ["Create the incident record", "record", "click", "site"],
      ["Record what happened", "record", "type", "event"],
      ["Classify on worst credible outcome", "classify", "click", "potential"],
      ["Link the critical control involved", "control", "click"],
      ["Resolve the notification obligation", "notify", "click"],
      ["Assign the investigation", "invest", "click"],
      ["Raise the control verification it triggers", "ccv", "click"],
      ["Assign it to a verifier", "assign", "click"],
      ["Verify the record", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     SAP MATERIALS MANAGEMENT
     Requisition to purchase order. The stock check across plants is
     the step that pays for the whole run.
  --------------------------------------------------------------- */
  supply: {
    label: "Supply", slug: SAP_SLUG, color: "#30914c",
    host: SAP_HOST, favMark: "F", favBg: "#0070f2",
    tabTitle: "Purchase Requisition | SAP Fiori",
    icon: "database",
    runTitle: "Raise the requisition and get it released",
    runWhat:
      "Creates the requisition against the order, checks whether the group already owns the part somewhere else before buying one, assigns the source of supply, sets the delivery, takes it through the release strategy and converts it to a purchase order.",
    fields: [
      { id: "material", label: "Material", required: true,
        ask: "What part is needed?",
        why: "It selects the material master, which carries the lead time and the stock position.",
        hints: ["strut", "pulley", "liner", "bearing", "pump", "motor", "hose", "cylinder", "part", "assembly", "kit"],
        lead: ["part is", "need a", "need the", "material is", "for a", "order a", "requisition for"] },
      { id: "qty", label: "Quantity", kind: "number",
        ask: "How many?",
        hints: ["qty", "quantity", "off", "each", "units"],
        lead: ["quantity", "qty", "x", "of them"] },
      { id: "urgency", label: "Urgency",
        ask: "How urgent is it?",
        options: ["Breakdown, plant is down", "Next maintenance window", "Next planned service", "Stock replenishment"],
        hints: ["breakdown", "urgent", "down", "window", "planned", "stock", "asap", "today"],
        lead: ["urgency", "it is", "this is", "needed"] },
      { id: "value", label: "Estimated value", kind: "money",
        ask: "What is the estimated value?",
        why: "It decides which release strategy the requisition falls into and therefore who has to approve it.",
        hints: ["value", "cost", "usd", "dollars", "worth", "priced", "approximately"],
        lead: ["value", "cost", "worth", "about", "around", "approximately"] },
    ],
    triggers: [
      "requisition", "purchase requisition", "raise a pr", "order the part",
      "purchase order", "source the part", "release strategy",
      "check stock", "expedite the part", "procurement",
    ],
    nav: ["Home", "Requisitions", "Orders", "Materials", "Suppliers"],
    paths: {
      home:    "#PurchaseRequisition-manage",
      create:  "#PurchaseRequisition-create",
      item:    "#PurchaseRequisition-create&/item",
      stock:   "#MaterialStock-display&/1000",
      source:  "#PurchaseRequisition-create&/source",
      deliver: "#PurchaseRequisition-create&/delivery",
      release: "#PurchaseRequisition-manage&/4500218841?release=X",
      po:      "#PurchaseOrder-create&/from=4500218841",
      verify:  "#PurchaseOrder-manage&/4500991204",
    },
    steps: [
      ["Open requisitions", "home", "inspect"],
      ["Create the requisition", "create", "click", "material"],
      ["Enter the quantity", "item", "type", "qty"],
      ["Check stock across the group", "stock", "click"],
      ["Assign the source of supply", "source", "click"],
      ["Set the delivery and expedite", "deliver", "click", "urgency"],
      ["Submit to the release strategy", "release", "click", "value"],
      ["Convert to a purchase order", "po", "click"],
      ["Verify the order", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     CONTRACTOR GATEWAY
     The only run in the product that stops itself. It stops because
     the knowledge base knows the induction pack at this site still
     teaches a procedure withdrawn fourteen months ago, and the gate
     is the last place that can be caught cheaply.
  --------------------------------------------------------------- */
  contractor: {
    label: "Contractor", slug: "mobilise", color: "#f97316",
    host: "gateway.{org}.com", favMark: "C", favBg: "#f97316",
    tabTitle: "Mobilisation | Contractor Gateway",
    icon: "users",
    runTitle: "Mobilise the crew, and stop if the gate fails",
    runWhat:
      "Works the mobilisation request through competency verification and the induction pack check, blocks the mobilisation when the site's pack is found to reference a withdrawn procedure, reissues the site onto the current pack, and only then grants access.",
    fields: [
      { id: "company", label: "Contracting company", required: true,
        ask: "Which contracting company?",
        why: "It selects the mobilisation request and the prequalification record.",
        hints: ["services", "mining", "contractor", "crew from", "rockline", "company", "ltd", "pty"],
        lead: ["company", "contractor", "crew from", "for", "from"] },
      { id: "site", label: "Site",
        ask: "Which site are they mobilising to?",
        why: "The induction pack in issue differs by site, which is the whole point of this run.",
        options: ["Marra Downs", "Northgate", "Cerro Bravo", "Kalunga", "Talbot Lake", "Tanjung Rasa"],
        hints: ["marra", "northgate", "cerro", "kalunga", "talbot", "tanjung", "site", "mine"],
        lead: ["to", "at", "site is", "mobilising to"] },
      { id: "headcount", label: "Headcount", kind: "number",
        ask: "How many people?",
        hints: ["people", "person", "crew", "headcount", "workers", "personnel"],
        lead: ["people", "person", "crew of", "headcount", "a crew"] },
    ],
    triggers: [
      "contractor gateway", "grant site access", "mobilise the crew", "induction pack",
      "competency check", "onboard the contractor", "process the mobilisation",
      "check the induction", "mobilisation request", "verify the competencies",
      "clear them for site",
    ],
    nav: ["Dashboard", "Mobilisations", "Competency", "Induction", "Assurance"],
    paths: {
      home:     "dashboard",
      req:      "requests/2026-0884",
      comp:     "requests/2026-0884/competency",
      pack:     "requests/2026-0884/induction",
      blocked:  "requests/2026-0884/induction?blocked=1",
      register: "induction/register",
      reissue:  "induction/register?reissue=1",
      recheck:  "requests/2026-0884/induction?cleared=1",
      verify:   "requests/2026-0884?granted=1",
    },
    steps: [
      ["Open the contractor gateway", "home", "inspect"],
      ["Open the mobilisation request", "req", "click", "company"],
      ["Set the headcount", "req", "type", "headcount"],
      ["Verify individual competencies", "comp", "click"],
      ["Check the induction pack version", "pack", "click", "site"],
      ["Mobilisation blocked: the pack is stale", "blocked", "inspect"],
      ["Open the induction pack register", "register", "click"],
      ["Reissue the site onto the current pack", "reissue", "click"],
      ["Re-run the induction check", "recheck", "click"],
      ["Grant site access", "verify", "click"],
    ],
  },
};

/* ================================================================
   small helpers
   ================================================================ */
function sapIco(n) { return (typeof Icons !== "undefined" && Icons.svg) ? Icons.svg(n) : ""; }

/** Is the running step the one whose label matches? Lets a screen open
    a transient thing — a dialog, a message — only while it is used. */
function sapOn(task, re) {
  if (!task || task.status !== "running") return false;
  const s = task.steps[task.index];
  return !!(s && re.test(s.label));
}
/** Has the run already passed the step whose label matches? */
function sapPast(task, re) {
  if (!task) return false;
  if (task.status === "done") return true;
  const i = task.steps.findIndex(s => re.test(s.label));
  return i >= 0 && task.index > i;
}

/* ================================================================
   what this run was told
   ----------------------------------------------------------------
   Screens read the run's parameters rather than their own sample
   data, so the unit, the concern, the site and the figures on screen
   are the ones the person actually asked for. Where a parameter was
   not given, the fallback is the demonstration value, and the step
   that needs it has already stopped and asked before it gets here.
   ================================================================ */
function sapParams() {
  try {
    return (typeof OpState !== "undefined" && OpState.get && OpState.get().params) || {};
  } catch (e) { return {}; }
}
function sapP(id, fallback) {
  const v = sapParams()[id];
  return (v === undefined || v === null || v === "") ? (fallback || "") : String(v);
}
function sapGiven(id) { const v = sapParams()[id]; return !!(v !== undefined && v !== null && v !== ""); }

/** A field the person can edit while they hold the screen. */
function sapEditable(id, inner, cls) {
  return '<div class="sap-in ' + (cls || "") + '" data-op-field="' + id + '">' + inner + "</div>";
}

/* The demonstration values, used only where the request did not carry
   one and the step did not need to stop and ask for it. */
const SAP_FALLBACK = {
  unit: "HT-412",
  concern: "Rear left strut bottoming out over the ramp crest, audible metal contact on every pass, worse when loaded.",
  area: "Pit 3 470 bench",
  asset: "HT-412",
  priority: "2 High",
  work: "Replace the rear left suspension strut assembly",
  party: "3",
  site: "Marra Downs",
  event: "A fitter found the access guard interlock on the CV-212 head pulley defeated with a magnet taped against the sensor, with the belt able to run while the guard was open.",
  potential: "Fatality or permanent disability",
  material: "Suspension strut assembly, rear, 240t class",
  qty: "2",
  urgency: "Breakdown, plant is down",
  value: "$86,400",
  company: "Rockline Mining Services",
  headcount: "22",
};

/** Text that types itself out while a `type` step runs. Paced against
    the step's own dwell so it finishes just before the step ends at
    every speed setting. */
function sapTyped(task, full, re) {
  if (sapPast(task, re)) return { text: full, caret: false };
  if (!sapOn(task, re)) return { text: "", caret: false };
  const hold = opHold(OP_STEP_TICKS.type || 50);
  const span = Math.max(1, hold - 8);
  const n = Math.round(full.length * ((task.tick - 4) / span));
  return { text: full.slice(0, Math.max(0, Math.min(full.length, n))), caret: true };
}

/** Everything on the current screen that types itself, so the shell can
    update it in place instead of rebuilding the DOM ten times a second. */
function opLiveText(key, view, task) {
  if (!task || task.status !== "running") return [];
  const out = [];
  const add = (id, full, re, placeholder) => {
    const s = sapTyped(task, full, re);
    if (sapOn(task, re) || sapPast(task, re)) out.push({ id: id, text: s.text, caret: s.caret, placeholder: placeholder || "" });
  };
  if (key === "control" && (view === "unit" || view === "down" || view === "defect")) {
    add("sapConcern", sapP("concern", SAP_FALLBACK.concern), /Record the operator's concern/,
        "What the operator is reporting...");
  } else if (key === "maintenance" && (view === "notif" || view === "classify")) {
    add("sapMalfunction", sapP("concern", SAP_FALLBACK.concern), /Record the malfunction detail/,
        "Malfunction, as observed...");
  } else if (key === "isolation" && (view === "scope" || view === "register" || view === "taglist")) {
    add("sapWork", sapP("work", SAP_FALLBACK.work), /Describe the work/,
        "What people will physically do...");
  } else if (key === "safety" && (view === "record" || view === "classify" || view === "control")) {
    add("sapEvent", sapP("event", SAP_FALLBACK.event), /Record what happened/,
        "What happened, factually...");
  } else if (key === "supply" && (view === "item" || view === "stock" || view === "source")) {
    add("sapQty", sapP("qty", SAP_FALLBACK.qty), /Enter the quantity/, "0");
  } else if (key === "contractor" && (view === "req" || view === "comp")) {
    add("sapHead", sapP("headcount", SAP_FALLBACK.headcount), /Set the headcount/, "0");
  }
  return out;
}

/** A field that types itself while its step runs. Rendered here as
    well as pushed by opLiveText, so a screen rendered cold — in a
    test, or straight after a resize — shows the same thing. */
function sapTypeBox(fieldId, domId, full, re, placeholder, task, tall) {
  const shown = sapOn(task, re) || sapPast(task, re);
  const t = shown ? sapTyped(task, full, re) : { text: "", caret: false };
  return '<div class="sap-in' + (tall ? " sap-in--area" : "") + (t.text ? "" : " is-empty") + '" id="' + domId +
    '" data-op-field="' + fieldId + '">' +
    (t.text ? esc(t.text) + (t.caret ? '<span class="op-caret"></span>' : "") : esc(placeholder)) +
    "</div>";
}

/* ---------------- Fiori building blocks ---------------- */

function sapField(label, value, cls) {
  const empty = value === "" || value === null || value === undefined;
  return '<div class="sap-f"><label>' + esc(label) + "</label>" +
    '<div class="sap-in ' + (cls || "") + (empty ? " is-empty" : "") + '">' +
    (empty ? "&nbsp;" : value) + "</div></div>";
}

/** SAP's object status: a coloured word, not a badge. */
function sapStatus(text, tone) {
  return '<span class="sap-os sap-os--' + (tone || "none") + '">' + esc(text) + "</span>";
}

function sapCard(title, body, opts) {
  const o = opts || {};
  return '<section class="sap-card ' + (o.cls || "") + '">' +
    '<header class="sap-card__h"><h3>' + esc(title) +
      (o.count !== undefined ? " <em>(" + esc(o.count) + ")</em>" : "") + "</h3>" +
      '<span class="sap-sp"></span>' + (o.act || "") + "</header>" +
    '<div class="sap-card__b' + (o.flush ? " sap-card__b--flush" : "") + '">' + body + "</div>" +
    (o.foot ? '<footer class="sap-card__f">' + o.foot + "</footer>" : "") +
    "</section>";
}

function sapTable(cols, rows, opts) {
  const o = opts || {};
  const head = "<tr>" + (o.check ? '<th class="sap-t__chk"></th>' : "") +
    cols.map(c => "<th" + (c.num ? ' class="sap-num"' : "") + "><span>" + esc(c.t || c) + "</span></th>").join("") +
    (o.act ? '<th class="sap-t__act"></th>' : "") + "</tr>";
  const body = rows.map(r => {
    const cells = (r.c || r).map((v, i) => {
      const num = cols[i] && cols[i].num;
      return "<td" + (num ? ' class="sap-num"' : "") + ">" + v + "</td>";
    }).join("");
    /* A row may declare the field it stands for, so that picking it while
       the person holds the screen sets that value on the run instead of
       only moving a highlight. `pick` names the field, `val` the value it
       carries; without `val` the shell reads the row's first real cell. */
    const pick = r.pick ? ' data-op-pick="' + esc(r.pick) + '"' : "";
    const val = r.val ? ' data-op-value="' + esc(r.val) + '"' : "";
    return '<tr class="' + (r.cls || "") + '"' + pick + val + ">" +
      (o.check ? '<td class="sap-t__chk"><i' + (r.checked ? ' class="is-on"' : "") + "></i></td>" : "") + cells +
      (o.act ? '<td class="sap-t__act">&#9662;</td>' : "") + "</tr>";
  }).join("");
  return '<div class="sap-t__wrap"><table class="sap-t"><thead>' + head +
    "</thead><tbody>" + body + "</tbody></table></div>";
}

function sapKpis(list) {
  return '<div class="sap-kpis">' + list.map(k =>
    '<div class="sap-kpi ' + (k.cls || "") + '"><label>' + esc(k.l) + "</label><b>" + esc(k.v) + "</b>" +
    (k.s ? "<small>" + esc(k.s) + "</small>" : "") + "</div>").join("") + "</div>";
}

/** SAP's message strip: the honest one that says what is wrong. */
function sapStrip(text, tone, strong) {
  const t = tone ? " sap-strip--" + tone : "";
  return '<div class="sap-strip' + t + '">' +
    sapIco(tone === "err" ? "alert" : tone === "warn" ? "alert" : tone === "ok" ? "check" : "info") +
    "<span>" + (strong ? "<b>" + esc(strong) + "</b> " : "") + esc(text) + "</span></div>";
}

function sapToast(text) {
  return '<div class="sap-toast">' + sapIco("check") + "<span>" + esc(text) + "</span></div>";
}

function sapDialog(title, body, foot, wide) {
  return '<div class="sap-dlg__bd"><div class="sap-dlg' + (wide ? " sap-dlg--wide" : "") + '">' +
    '<header class="sap-dlg__h"><b>' + esc(title) + '</b><i>' + sapIco("close") + "</i></header>" +
    '<div class="sap-dlg__b">' + body + "</div>" +
    '<footer class="sap-dlg__f">' + foot + "</footer></div></div>";
}

function sapBtn(label, kind) {
  return '<button class="sap-btn' + (kind ? " sap-btn--" + kind : "") + '">' + esc(label) + "</button>";
}

/** The object page header: the shape every S/4 transaction shares. */
function sapObjHeader(eyebrow, title, status, fields, acts) {
  return '<div class="sap-oh"><div class="sap-oh__row">' +
    '<div class="sap-oh__id"><div class="sap-oh__eyebrow">' + esc(eyebrow) + "</div>" +
      '<div class="sap-oh__title">' + esc(title) + "</div>" +
      (status ? '<div class="sap-oh__status">' + status + "</div>" : "") + "</div>" +
    '<div class="sap-oh__acts">' + (acts || "") + "</div></div>" +
    (fields && fields.length
      ? '<div class="sap-oh__fields">' + fields.map(f =>
          '<div class="sap-oh__f"><label>' + esc(f.k) + "</label><div>" + f.v + "</div></div>").join("") + "</div>"
      : "") +
    "</div>";
}

/** The global shell bar and the app navigation. Identical on every SAP
    screen, which is what makes six transactions read as one system. */
function sapShell(key, body, opts) {
  const o = opts || {};
  const d = OP_DEPT[key] || OP_DEPT.maintenance;
  const user = (typeof state !== "undefined" && state.user && state.user.name) ? state.user.name : "D. Okoye";
  const initials = user.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const org = (typeof Config !== "undefined" && Config.company && Config.company.short) || "Vantorra";
  const tabs = (d.nav || []).map((t, i) =>
    '<div class="sap-tab ' + (i === (o.tab === undefined ? 1 : o.tab) ? "is-active" : "") + '">' +
    esc(t) + "</div>").join("");

  return '<div class="sap" data-app="' + key + '">' +
    '<header class="sap-gh">' +
      '<div class="sap-gh__home">' + sapIco("grid") + "</div>" +
      '<div class="sap-gh__logo"><em>SAP</em></div>' +
      '<div class="sap-gh__title">' + esc(o.appTitle || d.label) + "</div>" +
      '<div class="sap-gh__search">' + sapIco("search") + "<span>Search</span></div>" +
      '<span class="sap-gh__sp"></span>' +
      '<div class="sap-gh__tools">' +
        '<div class="sap-gh__tool">' + sapIco("alert") + "<b>4</b></div>" +
        '<div class="sap-gh__tool">' + sapIco("help") + "</div>" +
        '<div class="sap-gh__me">' + esc(initials) + "</div>" +
      "</div>" +
    "</header>" +
    (o.bare ? "" :
      '<nav class="sap-nav"><div class="sap-nav__app">' + esc(org) + " &middot; " + esc(d.label) + "</div>" +
      '<div class="sap-nav__tabs">' + tabs + "</div></nav>") +
    '<div class="sap-main">' + body + "</div>" +
    (o.dialog || "") +
    "</div>";
}

/* ==================================================================
   MINE CONTROL — the dispatch console
   ================================================================== */
function mcShell(body, opts) {
  const o = opts || {};
  const d = OP_DEPT.control;
  const org = (typeof Config !== "undefined" && Config.company && Config.company.short) || "Vantorra";
  const tabs = d.nav.map((t, i) =>
    '<div class="mc-tab ' + (i === (o.tab === undefined ? 0 : o.tab) ? "is-active" : "") + '">' +
    esc(t) + "</div>").join("");
  return '<div class="mc" data-app="control">' +
    '<header class="mc-gh"><div class="mc-gh__logo">' + sapIco("monitor") +
      "<b>Mine Control</b><em>" + esc(org) + " &middot; Marra Downs</em></div>" +
      '<div class="mc-gh__tabs">' + tabs + "</div>" +
      '<span class="mc-sp"></span>' +
      '<div class="mc-gh__shift"><label>Night shift</label><b>Hour 7 of 12</b></div>' +
    "</header>" +
    '<div class="mc-main">' + body + "</div>" +
    (o.dialog || "") +
    "</div>";
}

function mcControl(view, task) {
  const unit = sapP("unit", SAP_FALLBACK.unit);
  const concern = sapP("concern", SAP_FALLBACK.concern);
  const area = sapP("area", SAP_FALLBACK.area);
  const parked = sapOn(task, /Park the unit up/) || sapPast(task, /Park the unit up/);
  const applied = sapPast(task, /Apply the revised shift plan/);

  const fleet = [
    { u: "HT-408", t: "CAT 793F", op: "K. Adeyemi",  st: "Hauling",  loc: "Pit 3 470",  pay: "228 t" },
    { u: "HT-411", t: "CAT 793F", op: "M. Sione",    st: "Hauling",  loc: "Pit 3 470",  pay: "236 t" },
    { u: unit,     t: "CAT 793F", op: "J. Willmot",  st: parked ? "Parked up" : "Hauling", loc: "Pit 3 470", pay: parked ? "—" : "231 t" },
    { u: "HT-415", t: "CAT 793F", op: "R. Tamang",   st: "Hauling",  loc: "Pit 1 320",  pay: "233 t" },
    { u: "HT-419", t: "CAT 793F", op: "P. Nguyen",   st: "Queueing", loc: "Pit 1 320",  pay: "—" },
    { u: "EX-06",  t: "Hitachi EX3600", op: "L. Kaur", st: "Loading", loc: "Pit 3 470", pay: "—" },
    { u: "EX-09",  t: "Hitachi EX3600", op: "T. Moloi", st: "Loading", loc: "Pit 1 320", pay: "—" },
  ];

  if (view === "home" || view === "verify") {
    const updated = view === "verify";
    return mcShell(
      sapKpis([
        { l: "Tonnes to plan", v: updated ? "94%" : "97%", s: "shift to date", cls: updated ? "is-warn" : "" },
        { l: "Trucks available", v: updated ? "6 of 7" : "7 of 7", cls: updated ? "is-warn" : "" },
        { l: "Dig units", v: "2 of 2" },
        { l: "Avg cycle", v: updated ? "24.1 min" : "22.8 min" },
        { l: "Ground triggers", v: "1 Amber", cls: "is-warn" },
      ]) +
      (updated ? sapStrip("Shift plan revised. " + unit + " parked up, crew moved to Pit 1 320 bench, notification 10004417 raised to maintenance.", "ok", "Applied.") : "") +
      sapCard("Fleet status", sapTable(
        ["Unit", "Type", "Operator", "Status", "Location", "Last payload"],
        fleet.map(f => ({
          c: [f.u, f.t, f.op,
              f.st === "Parked up" ? sapStatus("Parked up", "err") :
              f.st === "Queueing" ? sapStatus("Queueing", "warn") : sapStatus(f.st, "ok"),
              (updated && f.u === unit) ? "Workshop" : f.loc, f.pay],
          cls: f.u === unit ? "is-sel" : "",
        })), { act: true }), { flush: true, count: fleet.length }),
      { tab: 0 });
  }

  if (view === "unit" || view === "down" || view === "defect") {
    const dialog = view === "down"
      ? sapDialog("Change unit status",
          '<div class="sap-grid2">' +
            sapField("Unit", esc(unit)) +
            sapField("New status", sapStatus("Parked up — tagged out", "err")) +
            sapField("Reason", "Operator reported defect") +
            sapField("Released by", "Competent maintenance person only") +
          "</div>" +
          sapStrip("A unit parked on a suspected defect is not returned to service from this screen. Release requires a competent maintenance person and a record.", "warn", "Note."),
          sapBtn("Cancel") + sapBtn("Park up and tag out", "emph"))
      : view === "defect"
      ? sapDialog("Raise to maintenance",
          '<div class="sap-grid2">' +
            sapField("Asset", esc(unit)) +
            sapField("Notification type", "M2 Malfunction report") +
            sapField("Planner group", "Marra Downs mobile") +
            sapField("Priority", "2 High") +
          "</div>" +
          sapField("Malfunction text", esc(concern)) +
          sapStrip("Creates notification 10004417 in SAP Plant Maintenance and links it to this unit's status change.", "info"),
          sapBtn("Cancel") + sapBtn("Create notification", "emph"))
      : "";

    return mcShell(
      '<div class="mc-two">' +
        "<div>" +
          sapCard("Unit " + esc(unit),
            '<div class="mc-unit">' +
              '<div class="mc-unit__row"><label>Type</label><b>CAT 793F, 240 t class</b></div>' +
              '<div class="mc-unit__row"><label>Operator</label><b>J. Willmot</b></div>' +
              '<div class="mc-unit__row"><label>Status</label><b>' +
                (parked ? sapStatus("Parked up — tagged out", "err") : sapStatus("Hauling", "ok")) + "</b></div>" +
              '<div class="mc-unit__row"><label>Location</label><b>' + esc(area) + "</b></div>" +
              '<div class="mc-unit__row"><label>Engine hours</label><b>41,268</b></div>' +
              '<div class="mc-unit__row"><label>Payload average</label><b>231 t, shift to date</b></div>' +
            "</div>", { flush: true }) +
          sapCard("Operator concern",
            sapTypeBox("concern", "sapConcern", concern, /Record the operator's concern/,
                       "What the operator is reporting...", task, true)) +
        "</div>" +
        "<div>" +
          sapCard("Live parameters", sapTable(
            ["Channel", "Value", "Trend"],
            [
              ["Rear left strut pressure", "3.1 MPa", sapStatus("Low", "warn")],
              ["Rear right strut pressure", "5.8 MPa", sapStatus("Normal", "ok")],
              ["Rack and roll", "4.2 deg", sapStatus("Elevated", "warn")],
              ["Brake oil temperature", "68 C", sapStatus("Normal", "ok")],
              ["Payload variance", "+1.4%", sapStatus("Normal", "ok")],
            ]), { flush: true }) +
          sapCard("Recent events", sapTable(
            ["Time", "Event"],
            [
              ["02:14", "Operator radio call, suspension noise"],
              ["01:52", "Payload event, 244 t"],
              ["23:40", "Prestart completed, no defects"],
            ]), { flush: true }) +
        "</div>" +
      "</div>",
      { tab: 1, dialog: dialog });
  }

  if (view === "ground") {
    return mcShell(
      sapStrip("Pit 3 sector E2 is at Amber. Under the trigger action response plan, non-essential access is restricted and the area is not a destination for a re-assigned crew this shift.",
               "warn", "Ground status.") +
      sapCard("Trigger action response status, by sector", sapTable(
        ["Sector", "Area", "Level", "Source", "Since", "Released by"],
        [
          { c: ["E1", "Pit 3 470–500", sapStatus("Green", "ok"), "Radar", "—", "—"] },
          { c: ["E2", "Pit 3 470–500", sapStatus("Amber", "warn"), "Radar velocity", "29 Jul", "Geotech, pending"], cls: "is-alert" },
          { c: ["E3", "Pit 3 500–530", sapStatus("Green", "ok"), "Radar", "—", "—"] },
          { c: ["N1", "Pit 1 320–350", sapStatus("Green", "ok"), "Prism", "—", "—"] },
          { c: ["N2", "Pit 1 350–380", sapStatus("Green", "ok"), "Prism", "—", "—"] },
          { c: ["D1", "Waste dump north", sapStatus("Green", "ok"), "Visual", "—", "—"] },
        ]), { flush: true }) +
      sapCard("Released sources available this shift", sapTable(
        ["Source", "Sector", "Material", "Dig unit", "Status"],
        [
          { c: ["Pit 1 320 bench", "N1", "Ore, oxide", "EX-09", sapStatus("Released", "ok")], cls: "is-sel",
            pick: "area", val: "Pit 1 320 bench" },
          { c: ["Waste dump north", "D1", "Waste", "EX-11", sapStatus("Released", "ok")],
            pick: "area", val: "Waste dump north" },
          { c: ["Pit 3 470 bench", "E2", "Ore, sulphide", "EX-06", sapStatus("Restricted", "warn")],
            pick: "area", val: "Pit 3 470 bench" },
        ]), { flush: true }),
      { tab: 3 });
  }

  if (view === "reassign" || view === "confirm") {
    const moved = sapPast(task, /Move the crew to a released source/) || sapOn(task, /Apply the revised shift plan/) || applied;
    const dialog = (sapOn(task, /Apply the revised shift plan/) || applied)
      ? sapDialog("Apply revised shift plan",
          sapTable(["Change", "From", "To"], [
            [esc(unit), "Pit 3 470, hauling", "Workshop, parked up"],
            ["HT-408", "Pit 3 470, EX-06", "Pit 1 320, EX-09"],
            ["HT-411", "Pit 3 470, EX-06", "Pit 1 320, EX-09"],
          ]) +
          sapStrip("Destination checked against ground status: Pit 1 320 bench is sector N1, released.", "ok"),
          sapBtn("Cancel") + sapBtn("Apply", "emph"))
      : "";
    return mcShell(
      sapCard("Assignments",
        '<div class="mc-lanes">' +
          '<div class="mc-lane' + (moved ? "" : " is-sel") + '"><div class="mc-lane__h"><b>EX-06</b>' +
            "<span>Pit 3 470 bench &middot; sector E2</span>" + sapStatus("Amber", "warn") + "</div>" +
            '<div class="mc-lane__trucks">' +
              (moved ? '<em class="is-gone">HT-408</em><em class="is-gone">HT-411</em>'
                     : "<em>HT-408</em><em>HT-411</em>") +
              '<em class="' + (parked ? "is-down" : "") + '">' + esc(unit) + "</em>" +
            "</div></div>" +
          '<div class="mc-lane' + (moved ? " is-sel" : "") + '"><div class="mc-lane__h"><b>EX-09</b>' +
            "<span>Pit 1 320 bench &middot; sector N1</span>" + sapStatus("Green", "ok") + "</div>" +
            '<div class="mc-lane__trucks"><em>HT-415</em><em>HT-419</em>' +
              (moved ? '<em class="is-new">HT-408</em><em class="is-new">HT-411</em>' : "") +
            "</div></div>" +
        "</div>", { flush: true }) +
      sapCard("Effect on the shift", sapKpis([
        { l: "Trucks hauling", v: moved ? "4" : "5", cls: moved ? "is-warn" : "" },
        { l: "Forecast tonnes", v: moved ? "94% of plan" : "97% of plan", cls: moved ? "is-warn" : "" },
        { l: "Haul distance", v: moved ? "+1.4 km" : "—" },
        { l: "Restricted sectors avoided", v: "1", cls: "is-ok" },
      ])),
      { tab: 2, dialog: dialog });
  }
  return "";
}

/* ==================================================================
   SAP PLANT MAINTENANCE
   ================================================================== */
function sapMaintenance(view, task) {
  const asset = sapP("asset", SAP_FALLBACK.asset);
  const concern = sapP("concern", SAP_FALLBACK.concern);
  const priority = sapP("priority", SAP_FALLBACK.priority);

  if (view === "home") {
    const tile = (t, kpi, sub, cls) =>
      '<div class="sap-tile ' + (cls || "") + '"><b>' + esc(t) + "</b>" +
      (kpi ? '<div class="sap-tile__kpi">' + esc(kpi) + "</div>" : "") +
      (sub ? "<small>" + esc(sub) + "</small>" : "") + "</div>";
    return sapShell("maintenance",
      '<div class="sap-lp">' +
        '<div class="sap-lp__grp"><h4>Maintenance</h4><div class="sap-lp__tiles">' +
          tile("Manage Notifications", "38", "12 unassigned", "is-sel") +
          tile("Manage Orders", "114", "9 overdue") +
          tile("Technical Objects", "", "Equipment and functional locations") +
          tile("Confirm Operations", "27", "open confirmations") +
        "</div></div>" +
        '<div class="sap-lp__grp"><h4>Safety and permits</h4><div class="sap-lp__tiles">' +
          tile("Work Clearance", "6", "applications open") +
          tile("Operational Permits", "3", "issued today") +
          tile("Incidents", "2", "under investigation") +
          tile("Control Verification", "47%", "isolation, this site", "is-warn") +
        "</div></div>" +
        '<div class="sap-lp__grp"><h4>Supply</h4><div class="sap-lp__tiles">' +
          tile("Purchase Requisitions", "21", "8 awaiting release") +
          tile("Material Stock", "", "Across plants") +
          tile("Purchase Orders", "63", "open") +
        "</div></div>" +
      "</div>", { tab: 0, appTitle: "Home" });
  }

  if (view === "inbox") {
    return sapShell("maintenance",
      sapObjHeader("Maintenance", "Manage Notifications", "", [
        { k: "Planner group", v: "Marra Downs mobile" },
        { k: "Open", v: "38" },
        { k: "Unassigned", v: "12" },
      ], sapBtn("Create")) +
      sapCard("Notifications", sapTable(
        ["Notification", "Type", "Asset", "Description", "Priority", "Created", "Status"],
        [
          { c: ["10004417", "M2", esc(asset), "Rear left strut bottoming out", sapStatus("2 High", "warn"), "Today 02:31", sapStatus("OSNO", "none")], cls: "is-sel" },
          { c: ["10004412", "M2", "CV-118", "Belt tracking to the north side", sapStatus("3 Medium", "none"), "Yesterday", sapStatus("OSNO", "none")],
            pick: "asset", val: "CV-118" },
          { c: ["10004409", "M1", "EX-06", "Bucket tooth adapter cracked", sapStatus("2 High", "warn"), "Yesterday", sapStatus("NOPR", "ok")],
            pick: "asset", val: "EX-06" },
          { c: ["10004401", "M2", "HT-419", "Air conditioning not cooling", sapStatus("4 Low", "none"), "2 days ago", sapStatus("OSNO", "none")],
            pick: "asset", val: "HT-419" },
          { c: ["10004396", "M3", "CR-01", "Lube leak at the countershaft", sapStatus("2 High", "warn"), "3 days ago", sapStatus("NOPR", "ok")],
            pick: "asset", val: "CR-01" },
        ]), { flush: true, count: 38 }),
      { tab: 1, appTitle: "Manage Notifications" });
  }

  if (view === "notif" || view === "classify") {
    const dialog = view === "classify"
      ? sapDialog("Classify notification",
          '<div class="sap-grid2">' +
            sapField("Notification type", "M2 Malfunction report") +
            sapField("Priority", sapStatus(esc(priority), "warn")) +
            sapField("Breakdown indicator", "Set") +
            sapField("Effect on production", "Unit unavailable") +
            sapField("Damage code", "Suspension, strut, loss of function") +
            sapField("Cause code", "To be determined by investigation") +
          "</div>" +
          sapStrip("Priority 1 and 2 notifications on a safety critical system require the asset to remain tagged out until released by a competent person.", "warn"),
          sapBtn("Cancel") + sapBtn("Apply", "emph"))
      : "";
    return sapShell("maintenance",
      sapObjHeader("Notification 10004417", esc(asset) + " — rear left suspension",
        sapStatus("OSNO Outstanding", "none"), [
        { k: "Asset", v: esc(asset) },
        { k: "Functional location", v: "MD-MIN-HAUL-793F" },
        { k: "Reported by", v: "Mine Control, night shift" },
        { k: "Priority", v: sapStatus(esc(priority), "warn") },
        { k: "Planner group", v: "Marra Downs mobile" },
      ], sapBtn("Classify") + sapBtn("Create Order", "emph")) +
      '<div class="sap-two">' +
        "<div>" +
          sapCard("Malfunction",
            sapTypeBox("concern", "sapMalfunction", concern, /Record the malfunction detail/,
                       "Malfunction, as observed...", task, true) +
            sapStrip("Record what was observed. The suspected cause belongs in the separate field so the tradesperson is informed without being led.", "info")) +
          sapCard("Items and activities", sapTable(
            ["Item", "Object part", "Damage", "Detected"],
            [["0010", "Suspension strut, rear left", "Loss of function", "In operation"]]), { flush: true }) +
        "</div>" +
        "<div>" +
          sapCard("Asset history, last 12 months", sapTable(
            ["Date", "Order", "Work"],
            [
              ["12 May 2026", "4000612", "Strut charge, both rear"],
              ["04 Mar 2026", "4000388", "500 hr service"],
              ["19 Jan 2026", "4000201", "Rear suspension inspection"],
            ]), { flush: true }) +
          sapCard("Safety critical", sapStrip(
            "Suspension is a safety critical system under the maintenance standard. The unit remains parked and tagged out until released by a competent person, and that release is recorded.", "warn"), { flush: true }) +
        "</div>" +
      "</div>",
      { tab: 1, appTitle: "Display Notification", dialog: dialog });
  }

  if (view === "order" || view === "ops" || view === "parts" || view === "avail" || view === "release" || view === "verify") {
    const hasOps = view === "ops" || view === "parts" || view === "avail" || view === "release" || view === "verify";
    const hasParts = view === "parts" || view === "avail" || view === "release" || view === "verify";
    const released = view === "verify";
    const dialog = view === "avail"
      ? sapDialog("Material availability check",
          sapTable(["Material", "Description", "Reqd", "Plant stock", "Availability"], [
            { c: ["1000-4471", "Suspension strut assembly, rear", "1", "0", sapStatus("Not available", "err")], cls: "is-alert" },
            { c: ["1000-2210", "Seal kit, strut", "1", "4", sapStatus("Available", "ok")] },
            { c: ["1000-8802", "Nitrogen charge kit", "1", "2", sapStatus("Available", "ok")] },
          ]) +
          sapStrip("One component is not available at this plant. The order can be released, but the operation that consumes it will not be schedulable until a requisition is raised.", "warn", "1 of 3 missing."),
          sapBtn("Close") + sapBtn("Raise requisition", "emph"), true)
      : view === "release"
      ? sapDialog("Release order",
          '<div class="sap-grid2">' +
            sapField("Order", "4000871") +
            sapField("Order type", "PM01 Corrective") +
            sapField("Planned cost", "$94,200") +
            sapField("Scheduled start", "Tomorrow 06:00") +
          "</div>" +
          sapStrip("Releasing permits confirmations and material withdrawal. Work still requires an issued operational permit and an isolation before it can start.", "info"),
          sapBtn("Cancel") + sapBtn("Release", "emph"))
      : "";

    return sapShell("maintenance",
      sapObjHeader("Order 4000871", "Replace rear left suspension strut — " + esc(asset),
        released ? sapStatus("REL Released", "ok") : sapStatus("CRTD Created", "none"), [
        { k: "Order type", v: "PM01 Corrective" },
        { k: "Asset", v: esc(asset) },
        { k: "Priority", v: sapStatus(esc(priority), "warn") },
        { k: "Work centre", v: "MD-WKSHP" },
        { k: "Planned cost", v: "$94,200" },
      ], sapBtn("Print") + (released ? sapBtn("Confirm") : sapBtn("Release", "emph"))) +
      (released ? sapToast("Order 4000871 released. Notification 10004417 set to NOPR.") : "") +
      sapCard("Operations", hasOps ? sapTable(
        ["Op", "Work centre", "Description", "Trade", "Hours", "Requires"],
        [
          { c: ["0010", "MD-WKSHP", "Isolate and prove de-energised", "Fitter", "0.5", "Operational permit"], cls: "is-new" },
          { c: ["0020", "MD-WKSHP", "Support body, fit props", "Fitter", "0.5", "Mechanical restraint"], cls: "is-new" },
          { c: ["0030", "MD-WKSHP", "Remove strut assembly", "Fitter x2", "3.0", "10 t crane"], cls: "is-new" },
          { c: ["0040", "MD-WKSHP", "Fit replacement strut", "Fitter x2", "3.0", "Component"], cls: "is-new" },
          { c: ["0050", "MD-WKSHP", "Charge and set ride height", "Fitter", "1.5", "Nitrogen kit"], cls: "is-new" },
          { c: ["0060", "MD-WKSHP", "Function test and release", "Supervisor", "0.5", "Competent person"], cls: "is-new" },
        ]) : '<div class="sap-empty">No operations planned yet.</div>', { flush: true, count: hasOps ? 6 : 0 }) +
      sapCard("Components", hasParts ? sapTable(
        ["Item", "Material", "Description", "Qty", "Plant stock", "Lead time"],
        [
          { c: ["0010", "1000-4471", "Suspension strut assembly, rear", "1", sapStatus("0", "err"), "16 weeks"], cls: "is-alert" },
          { c: ["0020", "1000-2210", "Seal kit, strut", "1", sapStatus("4", "ok"), "—"] },
          { c: ["0030", "1000-8802", "Nitrogen charge kit", "1", sapStatus("2", "ok"), "—"] },
        ]) : '<div class="sap-empty">No components assigned yet.</div>', { flush: true, count: hasParts ? 3 : 0 }),
      { tab: 2, appTitle: released ? "Manage Orders" : "Create Order", dialog: dialog });
  }
  return "";
}

/* ==================================================================
   SAP WORK CLEARANCE MANAGEMENT
   ================================================================== */
function sapIsolation(view, task) {
  const asset = sapP("asset", SAP_FALLBACK.asset);
  const work = sapP("work", SAP_FALLBACK.work);
  const party = sapP("party", SAP_FALLBACK.party);
  const n = Math.max(1, parseInt(party, 10) || 3);

  const points = [
    ["10", "Battery isolator, main", "Electrical", "IP-412-01", "Padlock"],
    ["20", "Starter isolation, cab", "Electrical, stored", "IP-412-02", "Padlock"],
    ["30", "Hydraulic accumulator bleed", "Hydraulic, stored", "IP-412-03", "Valve lock"],
    ["40", "Body raise circuit lockout", "Hydraulic", "IP-412-04", "Valve lock"],
    ["50", "Suspension charge isolation", "Stored gas pressure", "IP-412-05", "Valve lock"],
    ["60", "Fire suppression actuator", "Stored pressure", "IP-412-06", "Pin"],
    ["70", "Body props fitted, both sides", "Gravitational", "MR-412-01", "Mechanical restraint"],
  ];

  if (view === "home" || view === "scope") {
    return sapShell("isolation",
      sapObjHeader("Work Clearance Application", "WCA 30112 — " + esc(asset),
        sapStatus("Created", "none"), [
        { k: "From order", v: "4000871" },
        { k: "Asset", v: esc(asset) },
        { k: "Technical system", v: "MD-MIN-HAUL-793F" },
        { k: "Requested by", v: "J. Bianchi, Maintenance Planner" },
      ], sapBtn("Check") + sapBtn("Generate tagging list", "emph")) +
      '<div class="sap-two">' +
        "<div>" +
          sapCard("Scope of work",
            sapTypeBox("work", "sapWork", work, /Describe the work/,
                       "What people will physically do...", task, true) +
            sapStrip("A permit covers an activity, not an outcome. The controls that attach are chosen from what people will physically do.", "info")) +
          sapCard("Application type", '<div class="sap-grid2">' +
            sapField("Application type", "Operational permit with isolation") +
            sapField("Work approval", "Required") +
            sapField("Tagging required", "Yes") +
            sapField("Valid from", "Tomorrow 06:00") +
          "</div>", { flush: false }) +
        "</div>" +
        "<div>" +
          sapCard("Linked documents", sapTable(["Type", "Reference", "Title"], [
            ["Order", "4000871", "Replace rear left suspension strut"],
            ["Notification", "10004417", "Rear left strut bottoming out"],
            ["Standard", "FRS-04", "Energy Isolation"],
            ["Procedure", "HSE-211 rev 6", "Energy Isolation Procedure"],
          ]), { flush: true }) +
        "</div>" +
      "</div>",
      { tab: 1, appTitle: "Create Work Clearance Application" });
  }

  if (view === "register") {
    return sapShell("isolation",
      sapObjHeader("Isolation Register", esc(asset) + " — MD-MIN-HAUL-793F",
        sapStatus("Current", "ok"), [
        { k: "Points", v: "7" },
        { k: "Last verified", v: "14 Feb 2026" },
        { k: "Verified by", v: "W. Petersen" },
      ], sapBtn("Generate tagging list", "emph")) +
      sapCard("Isolation points", sapTable(
        ["Point", "Description", "Energy", "Tag", "Method"],
        points.map(p => ({ c: p.map(esc) }))), { flush: true, count: 7 }) +
      sapStrip("The register is generated from the equipment master. It is a starting point, not a substitute for walking the plant: a register that has drifted after a modification is the most common reason an isolation is incomplete.", "info"),
      { tab: 3, appTitle: "Display Isolation Register" });
  }

  if (view === "taglist" || view === "check" || view === "lockbox") {
    const verified = view === "check" || view === "lockbox";
    const withLock = view === "lockbox";
    const dialog = view === "check"
      ? sapDialog("Field verification against the plant",
          sapTable(["Point", "Description", "Found on plant", "Result"], [
            { c: ["10", "Battery isolator, main", "Yes", sapStatus("Verified", "ok")] },
            { c: ["20", "Starter isolation, cab", "Yes", sapStatus("Verified", "ok")] },
            { c: ["30", "Hydraulic accumulator bleed", "Yes", sapStatus("Verified", "ok")] },
            { c: ["40", "Body raise circuit lockout", "Yes", sapStatus("Verified", "ok")] },
            { c: ["50", "Suspension charge isolation", "Yes", sapStatus("Verified", "ok")] },
            { c: ["60", "Fire suppression actuator", "Relocated in the 2025 upgrade", sapStatus("Register drift", "err")], cls: "is-alert" },
            { c: ["70", "Body props fitted, both sides", "Yes", sapStatus("Verified", "ok")] },
          ]) +
          sapStrip("Point 60 is not where the register says it is. The plant was modified and the register was never updated, which is a management of change closure failure. Corrected position captured; the register update is raised against the equipment master.", "err", "1 of 7 corrected.") +
          sapStrip("Point 70 is a mechanical restraint, not an isolation. A hydraulic circuit holding a raised body is not a restraint and props must be physically confirmed as seated.", "warn"),
          sapBtn("Cancel") + sapBtn("Accept corrected list", "emph"), true)
      : "";

    return sapShell("isolation",
      sapObjHeader("Tagging List", "TL 30112 — " + esc(asset),
        verified ? sapStatus("Verified against plant", "ok") : sapStatus("Generated", "none"), [
        { k: "Points", v: "7" },
        { k: "Corrections", v: verified ? "1" : "—" },
        { k: "Work party", v: withLock ? esc(String(n)) : "—" },
      ], sapBtn("Verify") + sapBtn("Send for approval", "emph")) +
      sapCard("Tagging list", sapTable(
        ["Point", "Description", "Energy", "Tag", "Method", "Status"],
        points.map((p, i) => ({
          c: p.map(esc).concat([
            i === 5 && verified ? sapStatus("Corrected", "warn")
              : verified ? sapStatus("Verified", "ok") : sapStatus("Generated", "none")]),
          cls: i === 5 && verified ? "is-alert" : "",
        }))), { flush: true, count: 7 }) +
      (withLock
        ? sapCard("Group lockbox", sapTable(
            ["Lock", "Holder", "Role", "Applied"],
            Array.from({ length: n }, (_, i) => ({
              c: ["PL-" + (2201 + i),
                  esc([SAP_PEOPLE[1].name, "A. Mensah", "T. Bakker", "C. Ferreira", "S. Ivanov"][i % 5]),
                  "Fitter", "Pending"],
              cls: "is-new",
            }))) +
            sapStrip("The isolation keys go into lockbox LB-14 and every one of the " + n +
                     " people applies a personal lock to the box. Nobody holds isolations on behalf of anybody else.",
                     "ok", "Group lockbox LB-14."), { flush: true, count: n })
        : ""),
      { tab: 3, appTitle: "Tagging List", dialog: dialog });
  }

  if (view === "approve" || view === "issue" || view === "verify") {
    const issued = view === "issue" || view === "verify";
    const dialog = view === "issue"
      ? sapDialog("Issue operational permit",
          '<div class="sap-grid2">' +
            sapField("Permit", "OP 88214") +
            sapField("Asset", esc(asset)) +
            sapField("Valid from", "Tomorrow 06:00") +
            sapField("Valid to", "Tomorrow 18:00, one shift") +
            sapField("Issuing authority", "D. Okoye, appointed") +
            sapField("Acceptor", "W. Petersen") +
          "</div>" +
          sapStrip("The permit does not cross a shift change. If the work is incomplete at 18:00 it stops, this permit is closed and a new one is issued to the incoming party.", "warn"),
          sapBtn("Cancel") + sapBtn("Issue permit", "emph"))
      : "";
    return sapShell("isolation",
      sapObjHeader(issued ? "Operational Permit 88214" : "Work Approval 30112",
        esc(asset) + " — " + esc(work),
        issued ? sapStatus("Issued", "ok") : sapStatus("Approved", "ok"), [
        { k: "Isolation points", v: "7" },
        { k: "Work party", v: esc(String(n)) },
        { k: "Lockbox", v: "LB-14" },
        { k: "Valid", v: "One shift" },
      ], issued ? sapBtn("Print danger tags", "emph") : sapBtn("Issue permit", "emph")) +
      (view === "verify" ? sapToast("7 danger tags and " + n + " personal lock labels sent to the workshop printer.") : "") +
      '<div class="sap-two">' +
        "<div>" +
          sapCard("Approval chain", sapTable(["Step", "Role", "Person", "Status"], [
            { c: ["1", "Requestor", "J. Bianchi, Planner", sapStatus("Complete", "ok")] },
            { c: ["2", "Technical review", "Maintenance Supervisor", sapStatus("Complete", "ok")] },
            { c: ["3", "Issuing authority", "D. Okoye, appointed", issued ? sapStatus("Issued", "ok") : sapStatus("Approved", "ok")], cls: "is-new" },
          ]), { flush: true }) +
          sapStrip("SARA prepared this permit. It did not issue it. The issue is the act of the appointed issuing authority and the record says so.", "info") +
        "</div>" +
        "<div>" +
          (view === "verify"
            ? sapCard("Danger tags", '<div class="sap-tags">' +
                points.map(p => '<div class="sap-tag"><b>DANGER</b><span>DO NOT OPERATE</span>' +
                  "<em>" + esc(p[3]) + "</em><small>" + esc(p[1]) + "</small></div>").join("") +
                "</div>", { flush: true })
            : sapCard("Permit conditions", '<ul class="sap-list">' +
                "<li>Every energy source on the tagging list isolated, locked and proven de-energised.</li>" +
                "<li>Try test performed and the control returned to off.</li>" +
                "<li>Body props fitted and confirmed seated before anyone goes underneath.</li>" +
                "<li>Every person applies a personal lock to lockbox LB-14.</li>" +
                "<li>Permit does not transfer between shifts.</li>" +
                "</ul>", { flush: false })) +
        "</div>" +
      "</div>",
      { tab: 4, appTitle: issued ? "Operational Permit" : "Work Approval", dialog: dialog });
  }
  return "";
}

/* ==================================================================
   SAP EHS — INCIDENT MANAGEMENT
   ================================================================== */
const SAP_REG = {
  "Marra Downs":  { j: "Western Australia", r: "Department of Energy, Mines, Industry Regulation and Safety", t: "Immediately on becoming aware, written notice to follow", pre: "Preserve the incident site until an inspector directs otherwise" },
  "Northgate":    { j: "Queensland", r: "Resources Safety and Health Queensland", t: "Immediately for a serious accident; within the prescribed period for a high potential incident", pre: "Site Senior Executive holds personal statutory obligations" },
  "Cerro Bravo":  { j: "Chile", r: "SERNAGEOMIN", t: "Immediate notification for fatal and serious accidents", pre: "Affected area must be preserved" },
  "Kalunga":      { j: "Zambia", r: "Mines Safety Department", t: "Immediately, with a written return following", pre: "Environmental matters additionally to the environmental authority" },
  "Talbot Lake":  { j: "Ontario, Canada", r: "Provincial occupational health and safety regulator", t: "Immediate notice for a critical injury or fatality", pre: "Scene preserved; joint health and safety committee involvement is a legal requirement" },
  "Tanjung Rasa": { j: "Indonesia", r: "Ministry of Energy and Mineral Resources, mine inspectorate", t: "As prescribed by the inspectorate", pre: "Kepala Teknik Tambang carries personal accountability for reporting" },
};

function sapSafety(view, task) {
  const site = sapP("site", SAP_FALLBACK.site);
  const event = sapP("event", SAP_FALLBACK.event);
  const potential = sapP("potential", SAP_FALLBACK.potential);
  const reg = SAP_REG[site] || SAP_REG["Marra Downs"];
  const hp = /Fatality|Serious/i.test(potential);

  if (view === "home" || view === "verify") {
    const done = view === "verify";
    return sapShell("safety",
      sapObjHeader("Environment, Health and Safety", "Manage Incidents", "", [
        { k: "Open", v: done ? "13" : "12" },
        { k: "Under investigation", v: "2" },
        { k: "Overdue actions", v: "9" },
      ], sapBtn("Report Incident", "emph")) +
      (done ? sapToast("Incident 26-0417 recorded, classified high potential, notification obligation resolved, investigation and control verification assigned.") : "") +
      sapCard("Incidents", sapTable(
        ["Incident", "Site", "Type", "Potential", "Critical control", "Status"],
        [
          done ? { c: ["26-0417", esc(site), "Near miss", sapStatus("Fatality", "err"), "Energy isolation", sapStatus("Under investigation", "warn")], cls: "is-new" }
               : { c: ["26-0412", "Kalunga", "Near miss", sapStatus("Serious injury", "warn"), "Vehicles and mobile equipment", sapStatus("Under investigation", "warn")], cls: "is-sel" },
          { c: ["26-0411", "Northgate", "Injury", sapStatus("Serious injury", "warn"), "Ground control", sapStatus("Actions open", "warn")],
            pick: "site", val: "Northgate" },
          { c: ["26-0408", "Marra Downs", "Near miss", sapStatus("Fatality", "err"), "Energy isolation", sapStatus("Closed", "ok")] },
          { c: ["26-0403", "Cerro Bravo", "Environmental", sapStatus("No injury", "none"), "Hazardous substances", sapStatus("Closed", "ok")],
            pick: "site", val: "Cerro Bravo" },
          { c: ["26-0399", "Marra Downs", "Near miss", sapStatus("Fatality", "err"), "Energy isolation", sapStatus("Closed", "ok")] },
        ]), { flush: true, count: done ? 13 : 12 }),
      { tab: 1, appTitle: "Manage Incidents" });
  }

  if (view === "record" || view === "classify" || view === "control" || view === "notify") {
    const dialog =
      view === "classify"
        ? sapDialog("Classify incident",
            '<div class="sap-grid2">' +
              sapField("Actual outcome", "No injury") +
              sapField("Worst credible outcome", sapStatus(esc(potential), hp ? "err" : "none")) +
              sapField("Classification", hp ? sapStatus("High potential incident", "err") : sapStatus("Standard", "none")) +
              sapField("Investigation", hp ? "Structured, independent lead, within 48 hours" : "Local") +
            "</div>" +
            sapStrip("Classification runs on potential, not on outcome. Nobody was hurt here and it is still classified the same as a fatality, because the control that failed was the one standing between a person and a nip point.", "err"),
            sapBtn("Cancel") + sapBtn("Apply classification", "emph"))
      : view === "control"
        ? sapDialog("Link the critical control",
            sapTable(["Fatal risk", "Critical control", "Verification, this site", "Events, 90 days"], [
              { c: ["Energy isolation", "Personal lock and danger tag at every point", sapStatus("47%", "err"), "3"], cls: "is-alert" },
              { c: ["Energy isolation", "Guard and interlock function", sapStatus("47%", "err"), "3"], cls: "is-sel" },
              { c: ["Vehicles and mobile equipment", "Positive communication", sapStatus("91%", "ok"), "0"] },
              { c: ["Ground control", "TARP response", sapStatus("93%", "ok"), "0"] },
            ]) +
            sapStrip("The control being linked is the lowest verified control at this site and the third event against it in 90 days. That is what the verification task at the end of this run is for.", "warn"),
            sapBtn("Cancel") + sapBtn("Link control", "emph"), true)
      : view === "notify"
        ? sapDialog("Notification obligation",
            '<div class="sap-grid2">' +
              sapField("Site", esc(site)) +
              sapField("Jurisdiction", esc(reg.j)) +
              sapField("Regulator", esc(reg.r)) +
              sapField("Classification", hp ? sapStatus("High potential incident", "err") : sapStatus("Standard", "none")) +
            "</div>" +
            sapField("Timeframe", esc(reg.t)) +
            sapField("Also required", esc(reg.pre)) +
            sapStrip("The clock runs from when it happened, not from when this record was created. Notification is made by the accountable person named in the site's statutory register, never by the site directly and never by SARA.", "warn"),
            sapBtn("Close") + sapBtn("Assign to accountable person", "emph"), true)
      : "";

    return sapShell("safety",
      sapObjHeader("Incident 26-0417", esc(site) + " — near miss",
        hp ? sapStatus("High potential", "err") : sapStatus("Recorded", "none"), [
        { k: "Site", v: esc(site) },
        { k: "Occurred", v: "27 Jul 2026, 14:20" },
        { k: "Reported", v: "27 Jul 2026, 14:35" },
        { k: "Actual outcome", v: "No injury" },
        { k: "Worst credible", v: sapStatus(esc(potential), hp ? "err" : "none") },
      ], sapBtn("Classify") + sapBtn("Save", "emph")) +
      '<div class="sap-two">' +
        "<div>" +
          sapCard("What happened",
            sapTypeBox("event", "sapEvent", event, /Record what happened/,
                       "What happened, factually...", task, true) +
            sapStrip("What was seen and done, in order. The reporter's view of the cause is captured separately so an investigation can tell observation from opinion.", "info")) +
          sapCard("People and area", '<div class="sap-grid2">' +
            sapField("Area", "CHPP secondary screening") +
            sapField("Employment", "Contractor") +
            sapField("Work being done", "Fault finding, belt tracking") +
            sapField("Reported by", "Vantorra fitter") +
          "</div>") +
        "</div>" +
        "<div>" +
          sapCard("Critical control", sapTable(["Fatal risk", "Control", "Status"], [
            { c: ["Energy isolation", "Guard and interlock function", sapStatus("Failed", "err")], cls: "is-alert" },
          ]), { flush: true }) +
          sapCard("Same control, this site, 90 days", sapTable(["Incident", "Date", "Outcome"], [
            ["26-0408", "3 Jul 2026", "No injury"],
            ["26-0399", "8 Jun 2026", "No injury"],
          ]), { flush: true }) +
          sapStrip("Three events on the same critical control in 90 days, each closed locally with a briefing. The pattern is the finding.", "warn") +
        "</div>" +
      "</div>",
      { tab: 1, appTitle: "Report Incident", dialog: dialog });
  }

  if (view === "invest" || view === "ccv" || view === "assign") {
    const assigned = view === "assign";
    const dialog = view === "assign"
      ? sapDialog("Assign control verification",
          '<div class="sap-grid2">' +
            sapField("Fatal risk", "Energy isolation") +
            sapField("Control", "Guard and interlock function") +
            sapField("Where", "CHPP, at the work") +
            sapField("Method", "Observe in use, physically test") +
            sapField("Verifier", "R. Fitzgerald, HSE Superintendent") +
            sapField("Due", "Within 7 days") +
          "</div>" +
          sapStrip("Method is set to observe and test rather than record check, because 62 percent of this site's isolation verifications were recorded as record check only and the standard states that does not verify effectiveness.", "warn"),
          sapBtn("Cancel") + sapBtn("Assign", "emph"), true)
      : "";
    return sapShell("safety",
      sapObjHeader("Incident 26-0417", "Investigation and follow up",
        sapStatus("Under investigation", "warn"), [
        { k: "Classification", v: sapStatus("High potential", "err") },
        { k: "Investigation lead", v: "Independent of the work" },
        { k: "Commence by", v: "Within 48 hours" },
        { k: "Report due", v: "21 days" },
      ], sapBtn("Save", "emph")) +
      sapCard("Actions", sapTable(
        ["Action", "Description", "Owner", "Due", "Status"],
        [
          { c: ["A-1", "Structured investigation, independent lead", "L. Dlamini, HSE", "21 days", sapStatus("Assigned", "ok")], cls: "is-new" },
          { c: ["A-2", "Withdraw method statement RMS-CHPP-14 from use", "M. Kowalski", "Immediate", sapStatus("Assigned", "ok")], cls: "is-new" },
          { c: ["A-3", "Inspect all guards and interlocks at the CHPP", "Maintenance", "24 hours", sapStatus("Complete", "ok")], cls: "is-new" },
          assigned
            ? { c: ["A-4", "Critical control verification, isolation, in the field", "R. Fitzgerald", "7 days", sapStatus("Assigned", "ok")], cls: "is-new" }
            : { c: ["A-4", "Critical control verification, isolation, in the field", "—", "7 days", sapStatus("Not assigned", "warn")], cls: "is-alert" },
        ]), { flush: true, count: 4 }) +
      sapStrip("A briefing was the corrective action on both previous events against this control. This time the actions reach the method statement and the verification instead.", "info"),
      { tab: 3, appTitle: "Manage Incident", dialog: dialog });
  }
  return "";
}

/* ==================================================================
   SAP MATERIALS MANAGEMENT
   ================================================================== */
function sapSupply(view, task) {
  const material = sapP("material", SAP_FALLBACK.material);
  const qty = sapP("qty", SAP_FALLBACK.qty);
  const urgency = sapP("urgency", SAP_FALLBACK.urgency);
  const value = sapP("value", SAP_FALLBACK.value);

  if (view === "home") {
    return sapShell("supply",
      sapObjHeader("Materials Management", "Manage Purchase Requisitions", "", [
        { k: "Open", v: "21" },
        { k: "Awaiting release", v: "8" },
        { k: "Plant", v: "1000 Marra Downs" },
      ], sapBtn("Create", "emph")) +
      sapCard("Requisitions", sapTable(
        ["Requisition", "Material", "Description", "Qty", "Value", "Status"],
        [
          { c: ["4500218838", "1000-3390", "Bucket tooth, adapter", "12", "$14,200", sapStatus("Released", "ok")] },
          { c: ["4500218835", "1000-7712", "Conveyor belt, 1400 mm", "180 m", "$212,000", sapStatus("Awaiting release", "warn")] },
          { c: ["4500218829", "1000-1104", "Filter kit, 500 hr", "40", "$8,900", sapStatus("Released", "ok")] },
          { c: ["4500218821", "1000-6640", "Ground engaging tools set", "6", "$46,300", sapStatus("Converted", "ok")] },
        ]), { flush: true, count: 21 }),
      { tab: 1, appTitle: "Manage Purchase Requisitions" });
  }

  if (view === "create" || view === "item" || view === "stock" || view === "source" || view === "deliver") {
    const sourced = view === "source" || view === "deliver";
    const dialog =
      view === "stock"
        ? sapDialog("Stock across plants — material 1000-4471",
            sapTable(["Plant", "Site", "Unrestricted", "Reserved", "In transit", "Freight to 1000"], [
              { c: ["1000", "Marra Downs", sapStatus("0", "err"), "0", "0", "—"] },
              { c: ["3000", "Cerro Bravo", sapStatus("2", "ok"), "0", "0", "14 days, sea and road"], cls: "is-sel" },
              { c: ["4000", "Kalunga", sapStatus("1", "ok"), "1", "0", "22 days"] },
              { c: ["2000", "Northgate", sapStatus("0", "none"), "0", "0", "—"] },
              { c: ["5000", "Talbot Lake", sapStatus("0", "none"), "0", "0", "—"] },
            ]) +
            sapStrip("Cerro Bravo holds two, unreserved, and can transfer in 14 days against a 16 week lead time from the manufacturer. A stock transfer costs freight; a new unit costs $86,400 and four months.", "ok", "The group already owns one."),
            sapBtn("Buy new") + sapBtn("Raise stock transfer", "emph"), true)
        : view === "deliver"
        ? sapDialog("Delivery and expedite",
            '<div class="sap-grid2">' +
              sapField("Urgency", sapStatus(esc(urgency), /Breakdown/i.test(urgency) ? "err" : "none")) +
              sapField("Required on site", "Within 14 days") +
              sapField("Route", "Stock transfer from plant 3000") +
              sapField("Freight", "Expedited sea and road") +
            "</div>" +
            sapStrip("Emergency and expedited freight carries a substantial premium and is recorded against the event, so the site can see what its breakdowns cost in freight rather than absorbing it.", "info"),
            sapBtn("Cancel") + sapBtn("Apply", "emph"))
        : "";

    return sapShell("supply",
      sapObjHeader("Purchase Requisition", "4500218841 — " + esc(material),
        sapStatus("Created", "none"), [
        { k: "Plant", v: "1000 Marra Downs" },
        { k: "For order", v: "4000871" },
        { k: "Material", v: "1000-4471" },
        { k: "Requested by", v: "J. Bianchi" },
      ], sapBtn("Check") + sapBtn("Submit for release", "emph")) +
      '<div class="sap-two">' +
        "<div>" +
          sapCard("Item", '<div class="sap-grid2">' +
            sapField("Material", esc(material)) +
            '<div class="sap-f"><label>Quantity</label>' +
              sapTypeBox("qty", "sapQty", qty, /Enter the quantity/, "0", task) + "</div>" +
            sapField("Unit", "EA") +
            sapField("Account assignment", "F Order 4000871") +
            sapField("Plant", "1000 Marra Downs") +
            sapField("Storage location", "MOB1 Mobile workshop") +
          "</div>") +
          (sourced
            ? sapCard("Source of supply", sapTable(["Type", "Source", "Lead time", "Price", "Selected"], [
                { c: ["Stock transfer", "Plant 3000 Cerro Bravo", "14 days", "Freight only", sapStatus("Selected", "ok")], cls: "is-new" },
                { c: ["Contract", "OEM dealer, 4600001182", "16 weeks", "$86,400", "—"] },
                { c: ["Contract", "Rebuild specialist, 4600002204", "9 weeks", "$61,800", "—"] },
              ]), { flush: true })
            : sapCard("Source of supply", '<div class="sap-empty">No source assigned yet.</div>', { flush: true })) +
        "</div>" +
        "<div>" +
          sapCard("Material master", sapTable(["Field", "Value"], [
            ["Material", "1000-4471"],
            ["Description", "Suspension strut assembly, rear, 240t class"],
            ["Material group", "Mobile equipment, major component"],
            ["Criticality", sapStatus("Critical spare", "warn")],
            ["Planned lead time", "112 days"],
            ["Reorder point", "1"],
            ["Plant stock", sapStatus("0", "err")],
          ]), { flush: true }) +
          sapStrip("This part is classified a critical spare with a reorder point of one, and plant stock is zero. The holding level and the reorder point are reviewed against this event.", "warn") +
        "</div>" +
      "</div>",
      { tab: 1, appTitle: "Create Purchase Requisition", dialog: dialog });
  }

  if (view === "release" || view === "po" || view === "verify") {
    const done = view === "verify";
    const dialog = view === "release"
      ? sapDialog("Release strategy",
          sapTable(["Level", "Role", "Limit", "Status"], [
            { c: ["1", "Superintendent", "$50,000", sapStatus("Released", "ok")], cls: "is-new" },
            { c: ["2", "Manager", "$250,000", sapStatus("Released", "ok")], cls: "is-new" },
            { c: ["3", "Mine Manager", "$1,000,000", sapStatus("Not required", "none")] },
          ]) +
          '<div class="sap-grid2">' +
            sapField("Requisition value", esc(value)) +
            sapField("Release strategy", "MD2 Sustaining, site") +
          "</div>" +
          sapStrip("Value falls inside level 2. Splitting a commitment to bring each part inside a lower level is a control breach regardless of intent, and the system checks the combined value against the order.", "info"),
          sapBtn("Cancel") + sapBtn("Release", "emph"), true)
      : "";
    return sapShell("supply",
      sapObjHeader(done ? "Purchase Order 4500991204" : "Purchase Requisition 4500218841",
        esc(material),
        done ? sapStatus("Ordered", "ok") : sapStatus("Released", "ok"), [
        { k: "Value", v: esc(value) },
        { k: "Quantity", v: esc(qty) + " EA" },
        { k: "Source", v: "Stock transfer, plant 3000" },
        { k: "Required", v: "14 days" },
      ], done ? sapBtn("Print") : sapBtn("Convert to order", "emph")) +
      (done ? sapToast("Stock transfer order 4500991204 created against requisition 4500218841. Component reserved on maintenance order 4000871.") : "") +
      sapCard("Document flow", sapTable(["Document", "Number", "Status"], [
        { c: ["Notification", "10004417", sapStatus("In process", "warn")] },
        { c: ["Maintenance order", "4000871", sapStatus("Released", "ok")] },
        { c: ["Work clearance", "30112", sapStatus("Approved", "ok")] },
        { c: ["Operational permit", "88214", sapStatus("Issued", "ok")] },
        { c: ["Requisition", "4500218841", sapStatus("Released", "ok")] },
        done ? { c: ["Stock transfer order", "4500991204", sapStatus("Ordered", "ok")], cls: "is-new" }
             : { c: ["Purchase order", "—", sapStatus("Not created", "none")] },
      ]), { flush: true }),
      { tab: 2, appTitle: done ? "Manage Purchase Orders" : "Manage Purchase Requisitions", dialog: dialog });
  }
  return "";
}

/* ==================================================================
   CONTRACTOR GATEWAY
   ================================================================== */
const CG_PACKS = [
  { site: "Cerro Bravo",  v: "v7.0", issued: "22 Jul 2025", parent: "HSE-211 rev 6", ok: true },
  { site: "Kalunga",      v: "v7.0", issued: "30 Jul 2025", parent: "HSE-211 rev 6", ok: true },
  { site: "Talbot Lake",  v: "v7.0", issued: "04 Aug 2025", parent: "HSE-211 rev 6", ok: true },
  { site: "Tanjung Rasa", v: "v7.0", issued: "19 Aug 2025", parent: "HSE-211 rev 6", ok: true },
  { site: "Marra Downs",  v: "v6.2", issued: "11 Mar 2025", parent: "HSE-211 rev 4 (withdrawn 16 Jun 2025)", ok: false },
  { site: "Northgate",    v: "v6.2", issued: "11 Mar 2025", parent: "HSE-211 rev 4 (withdrawn 16 Jun 2025)", ok: false },
];

function cgContractor(view, task) {
  const company = sapP("company", SAP_FALLBACK.company);
  const site = sapP("site", SAP_FALLBACK.site);
  const head = sapP("headcount", SAP_FALLBACK.headcount);
  const rec = CG_PACKS.find(p => p.site === site) || CG_PACKS[4];
  const reissued = sapPast(task, /Reissue the site onto the current pack/);
  const packNow = reissued ? "v7.0" : rec.v;
  const packOk = reissued || rec.ok;

  const shell = (body, opts) => {
    const o = opts || {};
    const d = OP_DEPT.contractor;
    const org = (typeof Config !== "undefined" && Config.company && Config.company.short) || "Vantorra";
    const tabs = d.nav.map((t, i) =>
      '<div class="cg-tab ' + (i === (o.tab === undefined ? 0 : o.tab) ? "is-active" : "") + '">' +
      esc(t) + "</div>").join("");
    return '<div class="cg" data-app="contractor">' +
      '<header class="cg-gh"><div class="cg-gh__logo">' + sapIco("users") +
        "<b>Contractor Gateway</b></div>" +
        '<div class="cg-gh__tabs">' + tabs + '</div><span class="sap-sp"></span>' +
        '<div class="cg-gh__me">' + esc(org) + "</div></header>" +
      '<div class="cg-main">' + body + "</div>" + (o.dialog || "") + "</div>";
  };

  if (view === "home") {
    return shell(
      sapKpis([
        { l: "Contractor personnel on site", v: "9,614" },
        { l: "Mobilisations this week", v: "42" },
        { l: "Blocked at the gate", v: "7", cls: "is-warn" },
        { l: "Competencies expiring 30 days", v: "218", cls: "is-warn" },
        { l: "Induction packs out of date", v: "2 sites", cls: "is-err" },
      ]) +
      sapCard("Mobilisation requests", sapTable(
        ["Request", "Company", "Site", "People", "Scope", "Status"],
        [
          { c: ["2026-0884", esc(company), esc(site), esc(head), "Conveyor structural repairs and pulley changeouts", sapStatus("In verification", "warn")], cls: "is-sel" },
          { c: ["2026-0881", "Delta Drilling", "Kalunga", "14", "Grade control drilling", sapStatus("Access granted", "ok")],
            pick: "company", val: "Delta Drilling" },
          { c: ["2026-0879", "Prime Electrical", "Cerro Bravo", "6", "Substation maintenance", sapStatus("Access granted", "ok")],
            pick: "company", val: "Prime Electrical" },
          { c: ["2026-0877", "Aurora Earthworks", "Northgate", "31", "Haul road construction", sapStatus("Blocked", "err")],
            pick: "company", val: "Aurora Earthworks" },
        ]), { flush: true }),
      { tab: 0 });
  }

  if (view === "req" || view === "comp") {
    return shell(
      sapObjHeader("Mobilisation 2026-0884", esc(company) + " — " + esc(site),
        sapStatus("In verification", "warn"), [
        { k: "Company", v: esc(company) },
        { k: "Site", v: esc(site) },
        { k: "Prequalification", v: sapStatus("Current", "ok") },
        { k: "Insurances", v: sapStatus("Current", "ok") },
      ], sapBtn("Verify") + sapBtn("Grant access", "emph")) +
      '<div class="sap-two">' +
        "<div>" +
          sapCard("Request", '<div class="sap-grid2">' +
            sapField("Scope", "Conveyor structural repairs and pulley changeouts") +
            '<div class="sap-f"><label>Headcount</label>' +
              sapTypeBox("headcount", "sapHead", head, /Set the headcount/, "0", task) + "</div>" +
            sapField("Start", "Monday 06:00") +
            sapField("Vantorra representative", "D. Okoye, Mining Supervisor") +
          "</div>") +
          (view === "comp"
            ? sapCard("Competency verification", sapTable(
                ["Requirement", "Required for", "Verified", "Expiring 30 days", "Result"],
                [
                  { c: ["Working at height", "18 of " + esc(head), "18", "1", sapStatus("Pass", "ok")] },
                  { c: ["Energy isolation", esc(head) + " of " + esc(head), esc(head), "3", sapStatus("Pass", "ok")] },
                  { c: ["Confined space", "6 of " + esc(head), "6", "0", sapStatus("Pass", "ok")] },
                  { c: ["Rigging and dogging", "4 of " + esc(head), "4", "0", sapStatus("Pass", "ok")] },
                  { c: ["Medicals and fitness for work", esc(head) + " of " + esc(head), esc(head), "2", sapStatus("Pass", "ok")] },
                  { c: ["Verification of competency, site specific", esc(head) + " of " + esc(head), esc(head), "0", sapStatus("Pass", "ok")] },
                ]), { flush: true })
            : "") +
        "</div>" +
        "<div>" +
          sapCard("Gate checklist", sapTable(["Check", "Status"], [
            ["Company prequalification", sapStatus("Verified", "ok")],
            ["Insurances", sapStatus("Verified", "ok")],
            ["Individual competencies", view === "comp" ? sapStatus("Verified", "ok") : sapStatus("Pending", "warn")],
            ["Medicals and fitness for work", view === "comp" ? sapStatus("Verified", "ok") : sapStatus("Pending", "warn")],
            ["Safe work method statements", sapStatus("Reviewed", "ok")],
            ["Plant and equipment", sapStatus("Verified", "ok")],
            ["Site induction", sapStatus("Not started", "none")],
          ]), { flush: true }) +
        "</div>" +
      "</div>",
      { tab: 1 });
  }

  if (view === "pack" || view === "blocked" || view === "recheck") {
    const cleared = view === "recheck";
    const blocked = view === "blocked" && !packOk;
    return shell(
      sapObjHeader("Mobilisation 2026-0884", "Induction pack check — " + esc(site),
        blocked ? sapStatus("Blocked", "err") : cleared ? sapStatus("Cleared", "ok") : sapStatus("Checking", "warn"), [
        { k: "Site", v: esc(site) },
        { k: "Pack in issue", v: cleared ? sapStatus("v7.0", "ok") : sapStatus(esc(packNow), packOk ? "ok" : "err") },
        { k: "People affected", v: esc(head) },
      ], sapBtn("Open register") + (cleared ? sapBtn("Grant access", "emph") : sapBtn("Grant access"))) +
      (blocked
        ? sapStrip("Induction pack " + rec.v + " at " + site + " reproduces " + rec.parent +
            ". Delivering the induction from this pack teaches all " + head +
            " people a withdrawn isolation method as the correct one. Mobilisation is blocked until the pack is reissued.",
            "err", "Mobilisation blocked.")
        : cleared
        ? sapStrip("Pack v7.0 now in issue at " + site + ", built against HSE-211 revision 6. Induction may proceed.", "ok", "Cleared.")
        : "") +
      sapCard("Pack content check", sapTable(
        ["Section", "Parent document", "Pack references", "Result"],
        [
          { c: ["Site hazards and fatal risks", "FRS-00 rev 4.0", "FRS-00 rev 4.0", sapStatus("Current", "ok")] },
          { c: ["Traffic management", "MIN-331 rev 4.4", "MIN-331 rev 4.4", sapStatus("Current", "ok")] },
          { c: ["Energy isolation", "HSE-211 rev 6",
                cleared ? "HSE-211 rev 6" : "HSE-211 rev 4",
                cleared ? sapStatus("Current", "ok") : sapStatus("Withdrawn 16 Jun 2025", "err")],
            cls: cleared ? "is-new" : "is-alert" },
          { c: ["Emergency response", "EMR-900 rev 4.0", "EMR-900 rev 4.0", sapStatus("Current", "ok")] },
          { c: ["Cultural heritage", "CSP-700 rev 5.0", "CSP-700 rev 5.0", sapStatus("Current", "ok")] },
        ]), { flush: true }) +
      (blocked
        ? sapCard("What the withdrawn revision teaches", '<div class="cg-diff">' +
            '<div class="cg-diff__col is-bad"><h5>Pack v6.2, from rev 4</h5><ul>' +
              "<li>A nominated isolation officer holds the isolation on behalf of the work party.</li>" +
              "<li>Verification is described as confirming the isolating device.</li>" +
              "<li>No group lockbox.</li><li>No try test.</li></ul></div>" +
            '<div class="cg-diff__col is-good"><h5>Current rev 6</h5><ul>' +
              "<li>Every person applies a personal lock, to the point or to a group lockbox.</li>" +
              "<li>Verification is an attempted start with the normal controls.</li>" +
              "<li>Group lockbox mandatory for more than one person.</li>" +
              "<li>Try test mandatory.</li></ul></div>" +
            "</div>", { flush: false })
        : ""),
      { tab: 3 });
  }

  if (view === "register" || view === "reissue") {
    const doing = view === "reissue";
    const dialog = doing
      ? sapDialog("Reissue induction pack",
          '<div class="sap-grid2">' +
            sapField("Sites", "Marra Downs, Northgate") +
            sapField("From", sapStatus("v6.2", "err")) +
            sapField("To", sapStatus("v7.0", "ok")) +
            sapField("Parent", "HSE-211 rev 6") +
          "</div>" +
          sapStrip("Reissue also flags every person inducted on v6.2 since 16 June 2025 for a refresher: 1,847 at Marra Downs and 1,213 at Northgate. The pack was the vector, so the pack is the corrective action.", "warn", "3,060 people flagged."),
          sapBtn("Cancel") + sapBtn("Reissue and flag refreshers", "emph"), true)
      : "";
    return shell(
      sapObjHeader("Induction", "Pack version register", "", [
        { k: "Sites", v: "6" },
        { k: "Out of date", v: doing ? sapStatus("0", "ok") : sapStatus("2", "err") },
        { k: "Reissue obligation", v: "30 days from a parent revision" },
      ], sapBtn("Reissue", "emph")) +
      sapCard("Packs in issue", sapTable(
        ["Site", "Pack", "Issued", "Isolation section built from", "Status"],
        CG_PACKS.map(p => {
          const fixed = doing && !p.ok;
          return {
            c: [esc(p.site), fixed ? "v7.0" : esc(p.v), fixed ? "Today" : esc(p.issued),
                fixed ? "HSE-211 rev 6" : esc(p.parent),
                (p.ok || fixed) ? sapStatus("Current", "ok") : sapStatus("14 months stale", "err")],
            cls: fixed ? "is-new" : (p.ok ? "" : "is-alert"),
          };
        })), { flush: true, count: 6 }) +
      sapStrip("The document management system does not link derived material to its parent, so this register is the only mechanism connecting an induction pack to the procedure it reproduces. It is maintained by hand.", "info"),
      { tab: 3, dialog: dialog });
  }

  if (view === "verify") {
    return shell(
      sapObjHeader("Mobilisation 2026-0884", esc(company) + " — " + esc(site),
        sapStatus("Access granted", "ok"), [
        { k: "People", v: esc(head) },
        { k: "Induction pack", v: sapStatus("v7.0", "ok") },
        { k: "Access from", v: "Monday 06:00" },
        { k: "Vantorra representative", v: "D. Okoye" },
      ], sapBtn("Print gate pass", "emph")) +
      sapToast("Site access granted for " + head + " personnel. Induction scheduled on pack v7.0.") +
      sapCard("Gate record", sapTable(["Check", "Verified by", "Result"], [
        ["Company prequalification", "M. Kowalski", sapStatus("Pass", "ok")],
        ["Individual competencies", "M. Kowalski", sapStatus("Pass", "ok")],
        ["Medicals and fitness for work", "Occupational Health", sapStatus("Pass", "ok")],
        ["Safe work method statements", "R. Fitzgerald", sapStatus("Pass", "ok")],
        ["Plant and equipment", "Maintenance", sapStatus("Pass", "ok")],
        { c: ["Induction pack currency", "Contractor Gateway", sapStatus("Pass, v7.0", "ok")], cls: "is-new" },
      ]), { flush: true }) +
      sapStrip("This mobilisation was stopped at the gate and released only after the pack was reissued. The two other mobilisations to this site this week are being re-checked against the same finding.", "ok"),
      { tab: 1 });
  }
  return "";
}

/* ================================================================
   the surface
   ================================================================ */
function opAppSurface(key, view, task) {
  if (key === "control")     return mcControl(view, task);
  if (key === "maintenance") return sapMaintenance(view, task);
  if (key === "isolation")   return sapIsolation(view, task);
  if (key === "safety")      return sapSafety(view, task);
  if (key === "supply")      return sapSupply(view, task);
  if (key === "contractor")  return cgContractor(view, task);
  return "";
}

/* ==================================================================
   OP_ANCHOR — which control each step acts on
   ------------------------------------------------------------------
   [selector, textToMatch, fallbackSelector] per step index. Held by
   index rather than by label so rewording a step can never silently
   point the cursor at the wrong control. Every entry is exercised by
   test_operator.js, which fails the build if a step has no anchor or
   if an anchor resolves to nothing on its own screen.
   ================================================================== */
const OP_ANCHOR = {

  control: [
    [".sap-kpi", ""],                                                  /* 0  open the board */
    [".sap-t tbody tr.is-sel", "", ".sap-t tbody tr"],                 /* 1  select the unit */
    ["#sapConcern", ""],                                               /* 2  record the concern */
    [".sap-dlg__f .sap-btn--emph", "Park up and tag out"],             /* 3  park up */
    [".sap-t tbody tr.is-alert", "", ".sap-t tbody tr"],               /* 4  ground status */
    [".mc-lane.is-sel .mc-lane__h", "", ".mc-lane__h"],                /* 5  rebalance */
    [".mc-lane__trucks .is-new", "", ".mc-lane__trucks"],              /* 6  move the crew */
    [".sap-dlg__f .sap-btn--emph", "Apply"],                           /* 7  apply */
    [".sap-dlg__f .sap-btn--emph", "Create notification"],             /* 8  raise the defect */
    [".sap-strip", ""],                                                /* 9  verify */
  ],

  maintenance: [
    [".sap-tile.is-sel", "", ".sap-tile"],                             /* 0  launchpad */
    [".sap-t tbody tr.is-sel", "", ".sap-t tbody tr"],                 /* 1  inbox */
    [".sap-oh__title", ""],                                            /* 2  open notification */
    ["#sapMalfunction", ""],                                           /* 3  malfunction text */
    [".sap-dlg__f .sap-btn--emph", "Apply"],                           /* 4  classify */
    [".sap-oh__acts .sap-btn--emph", "Release", ".sap-oh__title"],     /* 5  create order */
    [".sap-t tbody tr.is-new", "", ".sap-card__h"],                    /* 6  operations */
    [".sap-t tbody tr.is-alert", "", ".sap-t tbody tr"],               /* 7  components */
    [".sap-dlg__f .sap-btn--emph", "Raise requisition"],               /* 8  availability */
    [".sap-dlg__f .sap-btn--emph", "Release"],                         /* 9  release */
    [".sap-toast", ""],                                                /* 10 verify */
  ],

  isolation: [
    [".sap-oh__title", ""],                                            /* 0  open WCM */
    [".sap-oh__acts .sap-btn--emph", "Generate tagging list"],         /* 1  create application */
    ["#sapWork", ""],                                                  /* 2  describe the work */
    [".sap-t tbody tr", ""],                                           /* 3  isolation register */
    [".sap-t tbody tr", ""],                                           /* 4  generate tagging list */
    [".sap-dlg__f .sap-btn--emph", "Accept corrected list"],           /* 5  verify against plant */
    [".sap-t tbody tr.is-new", "", ".sap-card__h"],                    /* 6  lockbox */
    [".sap-t tbody tr.is-new", "", ".sap-t tbody tr"],                 /* 7  approval */
    [".sap-dlg__f .sap-btn--emph", "Issue permit"],                    /* 8  issue */
    [".sap-toast", ""],                                                /* 9  print tags */
  ],

  safety: [
    [".sap-t tbody tr.is-sel", "", ".sap-t tbody tr"],                 /* 0  incident inbox */
    [".sap-oh__title", ""],                                            /* 1  create record */
    ["#sapEvent", ""],                                                 /* 2  what happened */
    [".sap-dlg__f .sap-btn--emph", "Apply classification"],            /* 3  classify */
    [".sap-dlg__f .sap-btn--emph", "Link control"],                    /* 4  link the control */
    [".sap-dlg__f .sap-btn--emph", "Assign to accountable person"],    /* 5  notification */
    [".sap-t tbody tr.is-alert", "", ".sap-t tbody tr"],               /* 6  investigation */
    [".sap-oh__acts .sap-btn--emph", "Save", ".sap-card__h"],          /* 7  raise CCV */
    [".sap-dlg__f .sap-btn--emph", "Assign"],                          /* 8  assign verifier */
    [".sap-toast", ""],                                                /* 9  verify */
  ],

  supply: [
    [".sap-t tbody tr", ""],                                           /* 0  requisitions */
    [".sap-oh__title", ""],                                            /* 1  create */
    ["#sapQty", ""],                                                   /* 2  quantity */
    [".sap-dlg__f .sap-btn--emph", "Raise stock transfer"],            /* 3  stock across plants */
    [".sap-t tbody tr.is-new", "", ".sap-card__h"],                    /* 4  source of supply */
    [".sap-dlg__f .sap-btn--emph", "Apply"],                           /* 5  delivery */
    [".sap-dlg__f .sap-btn--emph", "Release"],                         /* 6  release strategy */
    [".sap-oh__acts .sap-btn--emph", "Convert to order", ".sap-oh__title"], /* 7  convert */
    [".sap-toast", ""],                                                /* 8  verify */
  ],

  contractor: [
    [".sap-kpi", ""],                                                  /* 0  dashboard */
    [".sap-t tbody tr.is-sel", "", ".sap-t tbody tr"],                 /* 1  open request */
    ["#sapHead", ""],                                                  /* 2  headcount */
    [".sap-t tbody tr", ""],                                           /* 3  competencies */
    [".sap-t tbody tr.is-alert", "", ".sap-t tbody tr"],               /* 4  pack version */
    [".sap-strip--err", ""],                                           /* 5  BLOCKED */
    [".sap-t tbody tr.is-alert", "", ".sap-t tbody tr"],               /* 6  register */
    [".sap-dlg__f .sap-btn--emph", "Reissue and flag refreshers"],     /* 7  reissue */
    [".sap-t tbody tr.is-new", "", ".sap-t tbody tr"],                 /* 8  re-check */
    [".sap-toast", ""],                                                /* 9  grant access */
  ],
};
