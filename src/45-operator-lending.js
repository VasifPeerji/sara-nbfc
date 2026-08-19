/* ==================================================================
   45-operator-lending.js
   The systems a lender actually records work in, as the Operator
   drives them.
   ------------------------------------------------------------------
   Four things live here:

     OP_SITES      the tenant's estate, as the browser's bookmarks
     OP_DEPT       the eight applications, their fields and the step
                   sequence the Operator works through
     opAppSurface  every screen, authored at 1280 x 720
     OP_ANCHOR     which control each step acts on, by step index

   WHY THESE SYSTEMS. There is no lending platform used by a majority
   of NBFCs. The market is split between a dozen vendors, several
   large lenders have built their own, and a good number run different
   software per product line. A demonstration built on one vendor's
   chrome would therefore be wrong for almost everybody who saw it.

   So the Operator drives two kinds of thing.

   The platform is the shape the category shares: origination,
   servicing, collections and co-lending, which is what every lender
   calls these functions whatever software sits under them. The object
   names on the screens — application, sanction, deviation, disbursal
   memo, mandate, bucket, demand notice, settlement advice — are the
   industry's, not a vendor's.

   The registries are named for real, because there is exactly one of
   each and every registered lender in the country files into all four:

     CKYCR    the Central KYC Records Registry, operated by CERSAI
     CERSAI   the central register of security interests
     CIMS     the Reserve Bank's Centralised Information Management
              System, which supervisory returns are filed through
     CMS      the Reserve Bank's Complaint Management System, which
              is where a complaint arrives once it has been escalated

   FIDELITY. What is sourced and what is reconstructed is set out in
   NBFC_FIDELITY.md. In short: the registries, the return names, the
   filing windows and the classification rules are real; the screens
   are reconstructions in the design language of each family, not
   copies of any page; the company, the customers, the accounts and
   every figure are invented. No public authority's emblem is drawn
   anywhere in this build.

   WHY THIS IS NOT THE PRODUCT. The Operator is the last mile. The
   value sits before it. The margin ceiling in the `origination` run is
   right because the product note says so; the withholding in the `lms`
   run comes from the disbursal policy; and the `collections` run
   refuses to raise a repossession, because the knowledge base knows
   the agreement executed on that account in 2019 does not carry the
   clause that authorises it. No lending platform holds that.
   ================================================================== */

/* ---------------- the tenant's estate ------------------------------
   The bookmarks bar and the new-tab tiles. The estate is deliberately
   several systems on several hosts: the four platform modules share a
   host because they are one product, and each registry is its own
   external site, which is what makes crossing to one read as leaving
   the building. A {org} token resolves to the tenant's own slug. */
const OP_SITES = [
  { id: "lending", label: "Lending platform",  host: "lending.{org}.com",  mark: "L", bg: "#0f766e" },
  { id: "core",    label: "Core accounting",   host: "core.{org}.com",     mark: "G", bg: "#15803d" },
  { id: "docs",    label: "Loan files",        host: "docs.{org}.com",     mark: "D", bg: "#64748b" },
  { id: "bureau",  label: "Bureau gateway",    host: "bureau.{org}.com",   mark: "B", bg: "#b45309" },
  { id: "ckycr",   label: "CKYCR",             host: "ckycrportal.com",    mark: "K", bg: "#1b4d89" },
  { id: "cersai",  label: "CERSAI",            host: "cersai.org.in",      mark: "C", bg: "#0891b2" },
  { id: "cims",    label: "RBI CIMS",          host: "cims.rbi.org.in",    mark: "R", bg: "#7c3aed" },
  { id: "cms",     label: "RBI CMS",           host: "cms.rbi.org.in",     mark: "R", bg: "#dc2626" },
  { id: "outlook", label: "Outlook",           host: "outlook.office.com", icon: "outlook" },
  { id: "teams",   label: "Teams",             host: "teams.microsoft.com", icon: "teams" },
];

/* ==================================================================
   the eight applications
   ------------------------------------------------------------------
   Four platform modules on one host, then four statutory registries
   on their own. A department carrying `statutory: true` is somebody
   else's site: the browser leaves the tenant's estate to reach it,
   and the shell skins it differently so that is visible.
   ================================================================== */
const OP_ORDER = [
  "origination", "lms", "collections", "colending",
  "ckycr", "cersai", "cims", "cms",
];

const LEND_HOST = "lending.{org}.com";

const OP_DEPT = {

  /* ---------------------------------------------------------------
     LOAN ORIGINATION
     Sourcing to sanction. The run takes a used commercial vehicle
     application to a decision, and the interesting part is that it
     does not approve it quietly: the margin sought is above the
     ceiling for the asset's age, so the case is raised as a deviation
     and routed to the authority that can actually take it.
  --------------------------------------------------------------- */
  origination: {
    label: "Loan Origination", slug: "origination", color: "#0f766e",
    host: LEND_HOST, favMark: "LO", favBg: "#0f766e",
    tabTitle: "Application | Loan Origination",
    icon: "checklist",
    module: "Origination",
    runTitle: "Take the application through to a credit decision",
    runWhat:
      "Opens the application, pulls the bureau report, works the income and obligation assessment, tests the margin sought against the ceiling for the asset, raises the shortfall as a deviation rather than absorbing it, routes it to the authority whose delegation actually covers it, and records the sanction with its conditions.",
    fields: [
      { id: "applicant", label: "Applicant", required: true,
        ask: "Whose application should I open?",
        why: "It selects the file, so the wrong name here works somebody else's case.",
        hints: ["applicant", "borrower", "customer", "case for", "application of", "transport", "traders", "enterprises", "salunkhe"],
        lead: ["for", "of", "applicant", "borrower", "customer", "case"] },
      { id: "amount", label: "Loan amount sought", required: true, kind: "money",
        ask: "How much is being sought?",
        why: "It is the figure the margin is tested against, and it goes on the sanction.",
        hints: ["lakh", "lakhs", "crore", "amount", "loan of", "seeking", "asking", "rupees", "rs", "inr"],
        lead: ["for", "of", "amount", "seeking", "sought", "wants", "loan of"] },
      { id: "product", label: "Product",
        ask: "Which product is this being written under?",
        options: ["Used commercial vehicle", "New commercial vehicle", "Loan against property",
                  "Business loan", "Loan against securities", "Gold loan"],
        hints: ["used cv", "commercial vehicle", "truck", "tipper", "lap", "property", "business loan", "gold", "securities"],
        lead: ["under", "product", "against", "for a"] },
      { id: "tenor", label: "Tenor in months", kind: "number",
        ask: "Over how many months?",
        hints: ["months", "month", "tenor", "tenure", "years", "year"],
        lead: ["over", "for", "tenor", "tenure", "months"] },
    ],
    triggers: [
      "open the application", "credit decision", "loan origination", "work the application",
      "assess the application", "sanction the loan", "credit queue", "pull the bureau",
      "raise the deviation", "route it for sanction", "take it to sanction",
      "underwrite", "appraise the case", "loan origination system",
    ],
    nav: ["Queue", "Application", "Credit", "Deviations", "Sanction"],
    paths: {
      home:      "queue",
      app:       "applications/APP-2026-118420",
      bureau:    "applications/APP-2026-118420/bureau",
      income:    "applications/APP-2026-118420/assessment",
      margin:    "applications/APP-2026-118420/asset",
      deviation: "applications/APP-2026-118420/deviations?raise=1",
      matrix:    "applications/APP-2026-118420/authority",
      sanction:  "applications/APP-2026-118420/sanction",
      verify:    "applications/APP-2026-118420?sanctioned=1",
    },
    steps: [
      ["Open the credit queue", "home", "inspect"],
      ["Open the application", "app", "click", "applicant"],
      ["Enter the amount sought", "app", "type", "amount"],
      ["Pull the bureau report", "bureau", "click"],
      ["Assess income against obligations", "income", "click"],
      ["Test the margin against the asset", "margin", "click", "product"],
      ["Raise the shortfall as a deviation", "deviation", "click"],
      ["Route it to the sanctioning authority", "matrix", "click"],
      ["Record the sanction and its conditions", "sanction", "click"],
      ["Verify the sanction", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     LOAN MANAGEMENT
     Sanction to a loan that repays itself. The run books the
     disbursal, withholds against the condition that is still open
     rather than releasing the whole amount, registers the mandate,
     sets the first instalment date and puts the outstanding documents
     on a tracker with an owner and a date.
  --------------------------------------------------------------- */
  lms: {
    label: "Loan Management", slug: "servicing", color: "#0369a1",
    host: LEND_HOST, favMark: "LM", favBg: "#0369a1",
    tabTitle: "Loan account | Loan Management",
    icon: "rupee",
    module: "Servicing",
    runTitle: "Book the disbursement and set the loan up to repay",
    runWhat:
      "Runs the pre-disbursal checklist, releases the sanctioned amount less a withholding against the one condition still open, registers the repayment mandate, sets the first instalment date far enough out that the mandate is live before it is presented, and puts every outstanding document on the tracker with an owner and a date.",
    fields: [
      { id: "loan", label: "Loan account", required: true, kind: "id",
        ask: "Which loan account?",
        why: "It selects the account, and a disbursal booked on the wrong one is a real payment to the wrong dealer.",
        hints: ["account", "loan", "ln-", "app-", "case", "file"],
        lead: ["account", "loan", "on", "for", "file"] },
      { id: "disbursal", label: "Amount to release", required: true, kind: "money",
        ask: "How much should be released?",
        why: "It is the amount that actually leaves the account, so I will not assume it.",
        hints: ["release", "disburse", "disbursal", "lakh", "crore", "pay out", "amount"],
        lead: ["release", "disburse", "pay out", "of", "amount"] },
      { id: "emidate", label: "First instalment date",
        ask: "When should the first instalment fall?",
        options: ["5th of next month", "10th of next month", "15th of next month", "1st of the month after next"],
        hints: ["emi", "instalment", "installment", "first emi", "due date", "5th", "10th", "15th"],
        lead: ["on the", "from the", "first emi", "due"] },
    ],
    triggers: [
      "book the disbursement", "disburse the loan", "release the funds", "loan management",
      "set up the loan", "register the mandate", "nach mandate", "first emi date",
      "release the disbursal", "withhold the disbursal", "book the loan",
      "set the first instalment", "lms", "servicing",
    ],
    nav: ["Portfolio", "Loan account", "Disbursement", "Mandates", "Documents"],
    paths: {
      home:    "portfolio",
      account: "loans/LN-CV-2026-0118420",
      predisb: "loans/LN-CV-2026-0118420/checklist",
      release: "loans/LN-CV-2026-0118420/disbursal",
      hold:    "loans/LN-CV-2026-0118420/disbursal?withhold=1",
      mandate: "loans/LN-CV-2026-0118420/mandate",
      emi:     "loans/LN-CV-2026-0118420/schedule",
      pdd:     "loans/LN-CV-2026-0118420/documents",
      verify:  "loans/LN-CV-2026-0118420?booked=1",
    },
    steps: [
      ["Open the loan portfolio", "home", "inspect"],
      ["Open the loan account", "account", "click", "loan"],
      ["Run the pre-disbursal checklist", "predisb", "click"],
      ["Enter the amount to release", "release", "type", "disbursal"],
      ["Withhold against the open condition", "hold", "click"],
      ["Register the repayment mandate", "mandate", "click"],
      ["Set the first instalment date", "emi", "click", "emidate"],
      ["Open the document tracker", "pdd", "click"],
      ["Put an owner and a date on each document", "pdd", "click"],
      ["Verify the loan account", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     COLLECTIONS AND RECOVERY
     The run that stops itself.

     It works an aged commercial vehicle account up to the point of
     raising a repossession, and then refuses to raise it. Two
     conditions fail: the agreement executed on this account in 2019
     predates the template that carries the possession clause, and
     there is a grievance open on the very charges in the arrears.

     What follows the refusal is not a workaround. The run suspends
     recovery on the disputed amount, refers the agreement defect to
     Legal, and flags every other account of the same vintage in the
     bucket — because if one agreement is missing the clause, the
     others written that quarter will be too.
  --------------------------------------------------------------- */
  collections: {
    label: "Collections & Recovery", slug: "collections", color: "#b45309",
    host: LEND_HOST, favMark: "CR", favBg: "#b45309",
    tabTitle: "Account | Collections",
    icon: "route",
    module: "Collections",
    runTitle: "Work the arrears, and stop if repossession is not authorised",
    runWhat:
      "Opens the aged account, reads the repayment history, confirms the demand notice was served, and takes the repossession request as far as the authorisation gate. The gate fails on two counts, so no repossession is raised: recovery on the disputed charges is suspended, the agreement defect goes to Legal, and every account of the same agreement vintage in the bucket is flagged for the same check.",
    fields: [
      { id: "account", label: "Loan account", required: true, kind: "id",
        ask: "Which account should I work?",
        why: "It selects the file, and enforcement steps recorded against the wrong account are close to impossible to unwind.",
        hints: ["account", "loan", "ln-", "case", "file", "borrower"],
        lead: ["account", "loan", "on", "for", "file"] },
      { id: "vehicle", label: "Vehicle registration", kind: "id",
        ask: "Which vehicle is the security?",
        why: "The repossession request is raised against the registration, not against the account.",
        hints: ["registration", "vehicle", "truck", "reg no", "mh-", "number plate", "hypothecated"],
        lead: ["vehicle", "registration", "reg", "truck", "on"] },
      { id: "arrears", label: "Arrears position", kind: "money",
        ask: "What is the arrears position I should record?",
        hints: ["arrears", "overdue", "outstanding", "unpaid", "dues", "lakh", "in default"],
        lead: ["arrears", "overdue", "of", "outstanding", "unpaid"] },
    ],
    triggers: [
      "work the arrears", "collections", "recovery action", "arrears bucket",
      "demand notice", "aged account", "raise a repossession request",
      "enforcement", "field allocation", "chase the account",
      "work the account", "collections queue",
    ],
    nav: ["Buckets", "Account", "Field", "Legal", "Assurance"],
    paths: {
      home:    "buckets",
      account: "accounts/LN-CV-2019-0044821",
      history: "accounts/LN-CV-2019-0044821/history",
      notice:  "accounts/LN-CV-2019-0044821/notices",
      request: "accounts/LN-CV-2019-0044821/repossession",
      blocked: "accounts/LN-CV-2019-0044821/repossession?authorised=0",
      hold:    "accounts/LN-CV-2019-0044821/holds",
      legal:   "accounts/LN-CV-2019-0044821/legal",
      verify:  "accounts/LN-CV-2019-0044821?stopped=1",
    },
    steps: [
      ["Open the arrears buckets", "home", "inspect"],
      ["Open the account", "account", "click", "account"],
      ["Read the repayment history", "history", "click"],
      ["Record the arrears position", "history", "type", "arrears"],
      ["Confirm the demand notice was served", "notice", "click"],
      ["Open the repossession request", "request", "click", "vehicle"],
      ["Repossession not authorised: two conditions fail", "blocked", "inspect"],
      ["Suspend recovery on the disputed charges", "hold", "click"],
      ["Refer the agreement defect to Legal", "legal", "click"],
      ["Flag the same vintage across the bucket", "legal", "click"],
      ["Verify: no repossession was raised", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     CO-LENDING
     Two lenders, one borrower, one set of receipts, and two systems
     that will not agree by themselves. The run reconciles the
     partner's monthly file and works the two breaks that actually
     recur: interest apportioned on different day counts, and receipts
     dated on collection by one side and on clearance by the other.
  --------------------------------------------------------------- */
  colending: {
    label: "Co-lending", slug: "colending", color: "#4338ca",
    host: LEND_HOST, favMark: "CL", favBg: "#4338ca",
    tabTitle: "Reconciliation | Co-lending",
    icon: "compare",
    module: "Co-lending",
    runTitle: "Reconcile the partner file and settle the month",
    runWhat:
      "Loads the partner's monthly file against the pool, runs the reconciliation, and works the two breaks that recur in every co-lending arrangement: interest apportioned on a different day-count basis, and receipts dated on collection by one side and on clearance by the other. Then raises the settlement advice for the net.",
    fields: [
      { id: "partner", label: "Partner", required: true,
        ask: "Which partner arrangement?",
        why: "Each arrangement has its own share, its own basis and its own settlement calendar.",
        options: ["Nandini Bank Limited", "Sahyadri Cooperative Bank", "Meghdoot Small Finance Bank"],
        hints: ["partner", "bank", "arrangement", "nandini", "sahyadri", "meghdoot", "co-lender"],
        lead: ["with", "partner", "for", "arrangement"] },
      { id: "file", label: "Partner file reference", required: true,
        ask: "Which partner file should I reconcile?",
        why: "It is the file that is actually loaded, and reconciling last month's twice looks exactly like a clean month.",
        hints: ["file", "reference", "csv", "upload", "clm-", "statement"],
        lead: ["file", "reference", "load", "reconcile"] },
      { id: "month", label: "Settlement month",
        ask: "Which month is being settled?",
        options: ["July 2026", "June 2026", "May 2026"],
        hints: ["month", "july", "june", "may", "period", "settlement month"],
        lead: ["for", "month", "period", "settling"] },
    ],
    triggers: [
      "reconcile the partner file", "load the partner file", "partner file",
      "settlement advice", "raise the settlement advice", "reconcile the pool",
      "settle the month", "apportionment", "clm", "run the reconciliation",
    ],
    nav: ["Arrangements", "Pool", "Reconciliation", "Settlement", "Reporting"],
    paths: {
      home:    "arrangements",
      pool:    "arrangements/CLM-2023-07/pool",
      load:    "arrangements/CLM-2023-07/reconciliation?load=1",
      match:   "arrangements/CLM-2023-07/reconciliation",
      breaks:  "arrangements/CLM-2023-07/reconciliation?unmatched=1",
      resolve: "arrangements/CLM-2023-07/reconciliation/items",
      settle:  "arrangements/CLM-2023-07/settlement",
      verify:  "arrangements/CLM-2023-07/settlement?raised=1",
    },
    steps: [
      ["Open the co-lending arrangements", "home", "inspect"],
      ["Open the partner arrangement", "pool", "click", "partner"],
      ["Enter the partner file reference", "load", "type", "file"],
      ["Run the reconciliation", "match", "wait", "month"],
      ["Open the unmatched items", "breaks", "click"],
      ["Work the apportionment break", "resolve", "click"],
      ["Work the receipt dating break", "resolve", "click"],
      ["Raise the settlement advice", "settle", "click"],
      ["Verify the settlement", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     CKYCR — the Central KYC Records Registry
     Operated by CERSAI. Every regulated entity searches it before it
     collects identification documents again, and files the record it
     creates. The run does both, and the thing worth watching is the
     comparison: the registry's record is older than the file on hand,
     so what gets uploaded is an update, not a duplicate.
  --------------------------------------------------------------- */
  ckycr: {
    label: "CKYCR", slug: "ckyc", color: "#1b4d89",
    host: "ckycrportal.com", statutory: true,
    favMark: "K", favBg: "#1b4d89",
    tabTitle: "Search | CKYC Records Registry",
    icon: "key",
    authority: "CERSAI",
    authorityLong: "Central Registry of Securitisation Asset Reconstruction and Security Interest of India",
    runTitle: "Search the central registry and file the KYC record",
    runWhat:
      "Searches the central registry on the identifier before any document is asked for again, downloads the record that already exists, compares it against the file on hand, and uploads the difference as an update rather than creating a second record for the same person.",
    fields: [
      { id: "customer", label: "Customer", required: true,
        ask: "Whose record should I search for?",
        why: "The search runs on the person, and a search on the wrong one returns a record we then wrongly treat as theirs.",
        hints: ["customer", "applicant", "borrower", "search for", "record for", "kin", "salunkhe"],
        lead: ["for", "of", "customer", "search", "record"] },
      { id: "idtype", label: "Identifier type",
        ask: "Which identifier should I search on?",
        options: ["PAN", "Aadhaar (last four)", "Passport", "Voter ID", "Driving licence"],
        hints: ["pan", "aadhaar", "aadhar", "passport", "voter", "driving licence", "driving license", "identifier"],
        lead: ["on", "using", "by", "identifier"] },
    ],
    triggers: [
      "ckyc", "ckycr", "central kyc", "kyc registry", "search the registry",
      "download the kyc record", "upload the kyc record", "kin number",
      "file the kyc record", "central kyc records registry",
    ],
    nav: ["Home", "Search", "Download", "Upload", "Reports"],
    paths: {
      home:    "home",
      search:  "search",
      results: "search?results=1",
      record:  "records/50492817330622",
      compare: "records/50492817330622/compare",
      prepare: "upload/prepare",
      upload:  "upload/batch",
      verify:  "upload/batch?ack=1",
    },
    steps: [
      ["Open the registry", "home", "inspect"],
      ["Enter the customer to search for", "search", "type", "customer"],
      ["Run the search", "results", "click", "idtype"],
      ["Download the existing record", "record", "click"],
      ["Compare it against the file on hand", "compare", "click"],
      ["Prepare the update, not a new record", "prepare", "click"],
      ["Upload the batch", "upload", "click"],
      ["Verify the acknowledgement", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     CERSAI — the central register of security interests
     Filed within thirty days of the security interest being created.
     The run searches the property first, which is the step that
     matters: an existing charge found before disbursal is a decision,
     and the same charge found after it is a loss.
  --------------------------------------------------------------- */
  cersai: {
    label: "CERSAI", slug: "sirs", color: "#0891b2",
    host: "cersai.org.in", statutory: true,
    favMark: "C", favBg: "#0891b2",
    tabTitle: "Security Interest | CERSAI",
    icon: "lock",
    authority: "CERSAI",
    authorityLong: "Central Registry of Securitisation Asset Reconstruction and Security Interest of India",
    runTitle: "Register the security interest on the central register",
    runWhat:
      "Searches the property on the central register before the charge is created, reads what the search returns, files the particulars of the security interest and the borrower inside the statutory window, and takes the acknowledgement onto the loan file.",
    fields: [
      { id: "asset", label: "Property", required: true,
        ask: "Which property is the security?",
        why: "The search and the filing are both against the property, and a filing against the wrong one leaves the real charge unregistered.",
        hints: ["property", "flat", "plot", "premises", "survey", "asset", "wakad", "address"],
        lead: ["property", "at", "against", "on", "premises"] },
      { id: "charge", label: "Amount secured", kind: "money",
        ask: "What amount is being secured?",
        hints: ["secured", "charge", "amount", "lakh", "crore", "value"],
        lead: ["of", "secured", "charge", "for", "amount"] },
    ],
    triggers: [
      "cersai", "security interest", "register the charge", "central register",
      "particulars of charge", "sirs", "search the property", "existing charge",
      "file the charge", "register the security interest",
    ],
    nav: ["Home", "Search", "Create", "Filings", "Reports"],
    paths: {
      home:     "home",
      search:   "search",
      existing: "search?results=1",
      form:     "filings/new",
      security: "filings/new/security",
      borrower: "filings/new/borrower",
      submit:   "filings/new/submit",
      verify:   "filings/SI-2026-4471908?ack=1",
    },
    steps: [
      ["Open the central register", "home", "inspect"],
      ["Enter the property to search", "search", "type", "asset"],
      ["Read what the search returns", "existing", "click"],
      ["Start the particulars of charge", "form", "click"],
      ["Record the security interest", "security", "click", "charge"],
      ["Record the borrower particulars", "borrower", "click"],
      ["Submit inside the filing window", "submit", "click"],
      ["Verify the register entry", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     CIMS — the Reserve Bank's supervisory returns
     The interesting part of a return is never the arithmetic. It is
     the validation that fires because a figure moved more than the
     rule allows, and the explanation somebody has to write for it.
  --------------------------------------------------------------- */
  cims: {
    label: "RBI CIMS", slug: "returns", color: "#7c3aed",
    host: "cims.rbi.org.in", statutory: true,
    favMark: "R", favBg: "#7c3aed",
    tabTitle: "Return filing | RBI CIMS",
    icon: "bars",
    authority: "Reserve Bank of India",
    authorityLong: "Centralised Information Management System",
    runTitle: "Prepare and file the supervisory return",
    runWhat:
      "Selects the return and the period, extracts the figures from the warehouse rather than retyping them, runs the validation rules, writes the explanation the variance check demands instead of forcing the figure to fit, and files inside the due date.",
    fields: [
      { id: "retn", label: "Return", required: true,
        ask: "Which return should I file?",
        options: ["DNBS-02 Important Financial Parameters", "DNBS-04A Structural Liquidity",
                  "DNBS-04B Dynamic Liquidity", "DNBS-13 Overseas Investment"],
        hints: ["dnbs", "return", "financial parameters", "liquidity", "overseas", "filing"],
        lead: ["file", "return", "the"] },
      { id: "period", label: "Reporting period", required: true,
        ask: "For which period?",
        options: ["Quarter ended 30 June 2026", "Quarter ended 31 March 2026", "Quarter ended 31 December 2025"],
        hints: ["quarter", "period", "june", "march", "december", "q1", "q4", "ended"],
        lead: ["for", "period", "quarter", "ended"] },
      { id: "reason", label: "Reason for the variance", required: true,
        ask: "What is the reason for the variance the validation has flagged?",
        why: "The rule wants an explanation, and a return that is edited until the rule stops firing is a misstatement.",
        hints: ["because", "variance", "movement", "reason", "explanation", "due to", "on account of"],
        lead: ["because", "reason", "due to", "on account of", "explanation"] },
    ],
    triggers: [
      "cims", "file the return", "supervisory return", "dnbs", "regulatory return",
      "rbi return", "quarterly return", "return filing", "validation errors",
      "submit the return", "important financial parameters",
    ],
    nav: ["Dashboard", "Returns", "Validation", "Submission", "History"],
    paths: {
      home:     "dashboard",
      pick:     "returns/select",
      extract:  "returns/DNBS02/extract",
      draft:    "returns/DNBS02/draft",
      validate: "returns/DNBS02/validate",
      fix:      "returns/DNBS02/validate?item=7",
      submit:   "returns/DNBS02/submit",
      verify:   "returns/DNBS02/submit?ack=1",
    },
    steps: [
      ["Open the filing dashboard", "home", "inspect"],
      ["Select the return and the period", "pick", "click", "retn,period"],
      ["Extract the figures from the warehouse", "extract", "wait"],
      ["Populate the return", "draft", "click"],
      ["Run the validation rules", "validate", "wait"],
      ["Explain the flagged variance", "fix", "type", "reason"],
      ["Submit the return", "submit", "click"],
      ["Verify the filing acknowledgement", "verify", "inspect"],
    ],
  },

  /* ---------------------------------------------------------------
     CMS — the Reserve Bank's Complaint Management System
     Where a complaint arrives once the customer has been past us. The
     run answers it on the account trail rather than on the template,
     and the finding it records is that the customer is right.
  --------------------------------------------------------------- */
  cms: {
    label: "RBI CMS", slug: "complaints", color: "#dc2626",
    host: "cms.rbi.org.in", statutory: true,
    favMark: "R", favBg: "#dc2626",
    tabTitle: "Complaint | RBI CMS",
    icon: "scale",
    authority: "Reserve Bank of India",
    authorityLong: "Complaint Management System",
    runTitle: "Answer the complaint escalated through the regulator",
    runWhat:
      "Opens the complaint, reads what the customer says happened, pulls the account trail against it, records the finding that the charge was levied twice and the bureau report was filed on the wrong status, sets the redress, and lodges the response inside the window rather than on the last day.",
    fields: [
      { id: "complaint", label: "Complaint reference", required: true, kind: "id",
        ask: "Which complaint reference?",
        why: "The response is lodged against the reference, and against the wrong one it is both a non-response and a disclosure.",
        hints: ["complaint", "reference", "cms-", "case", "escalated", "ombudsman"],
        lead: ["complaint", "reference", "case", "on", "for"] },
      { id: "finding", label: "Finding", required: true,
        ask: "What did the account trail actually show?",
        why: "It is the finding that goes on the record, and it has to be what the trail shows rather than what the template says.",
        hints: ["found", "trail shows", "levied", "charged", "reversed", "finding", "twice", "duplicate"],
        lead: ["found", "shows", "finding", "because", "that"] },
      { id: "remedy", label: "Redress",
        ask: "What redress should I set?",
        options: ["Refund the charge with interest", "Refund the charge",
                  "Correct the bureau report", "Refund and correct the bureau report",
                  "Explain, no adjustment due"],
        hints: ["refund", "reverse", "correct the bureau", "credit back", "waive", "redress", "remedy"],
        lead: ["redress", "remedy", "set", "with a"] },
    ],
    triggers: [
      "rbi cms", "complaint management system", "escalated complaint",
      "answer the complaint", "respond to the complaint", "regulator complaint",
      "lodge the response", "cms complaint", "answer the regulator",
      "response to the ombudsman",
    ],
    nav: ["Dashboard", "Complaints", "Response", "Documents", "History"],
    paths: {
      home:    "dashboard",
      case:    "complaints/CMS-2026-0084713",
      says:    "complaints/CMS-2026-0084713/statement",
      trail:   "complaints/CMS-2026-0084713/trail",
      draft:   "complaints/CMS-2026-0084713/response",
      redress: "complaints/CMS-2026-0084713/response?redress=1",
      submit:  "complaints/CMS-2026-0084713/response/submit",
      verify:  "complaints/CMS-2026-0084713?lodged=1",
    },
    steps: [
      ["Open the complaints dashboard", "home", "inspect"],
      ["Open the complaint", "case", "click", "complaint"],
      ["Read what the customer says happened", "says", "click"],
      ["Pull the account trail against it", "trail", "click"],
      ["Record the finding", "draft", "type", "finding"],
      ["Set the redress", "redress", "click", "remedy"],
      ["Lodge the response inside the window", "submit", "click"],
      ["Verify the response is lodged", "verify", "inspect"],
    ],
  },
};

/* ================================================================
   small helpers
   ================================================================ */
function finIco(n) { return (typeof Icons !== "undefined" && Icons.svg) ? Icons.svg(n) : ""; }

/** Is the running step the one whose label matches? Lets a screen open
    a transient thing — a dialog, a message — only while it is used. */
function finOn(task, re) {
  if (!task || task.status !== "running") return false;
  const s = task.steps[task.index];
  return !!(s && re.test(s.label));
}
/** Has the run already passed the step whose label matches? */
function finPast(task, re) {
  if (!task) return false;
  if (task.status === "done") return true;
  const i = task.steps.findIndex(s => re.test(s.label));
  return i >= 0 && task.index > i;
}

/* ================================================================
   what this run was told
   ----------------------------------------------------------------
   Screens read the run's parameters rather than their own sample
   data, so the applicant, the amount, the account and the figures on
   screen are the ones the person actually asked for. Where a
   parameter was not given, the fallback is the demonstration value,
   and the step that needs it has already stopped and asked before it
   gets here.
   ================================================================ */
function finParams() {
  try {
    return (typeof OpState !== "undefined" && OpState.get && OpState.get().params) || {};
  } catch (e) { return {}; }
}
function finP(id, fallback) {
  const v = finParams()[id];
  return (v === undefined || v === null || v === "") ? (fallback || "") : String(v);
}
function finGiven(id) { const v = finParams()[id]; return !!(v !== undefined && v !== null && v !== ""); }

/** A field the person can edit while they hold the screen. */
function finEditable(id, inner, cls) {
  return '<div class="fin-in ' + (cls || "") + '" data-op-field="' + id + '">' + inner + "</div>";
}

/* --------------------------------------------------------------------
   money, the way it is written here

   The shell must not carry a currency convention: the same machine
   drives a lender in one country and a registry in another. So it asks
   this file, and this file knows two things the generic path cannot.

   Digits group in the Indian system — the last three, then in pairs —
   because a figure written 1,860,000 on a sanction letter is the first
   thing in the room that reads as foreign.

   And people say the amount in lakh and crore. Somebody typing
   "eighteen lakh sixty" into the chat means 18,60,000, and a run that
   files that as eighteen rupees is worse than one that stops to ask.
-------------------------------------------------------------------- */
function opFormatMoney(text) {
  const raw = String(text || "").trim();
  const sym = (typeof Config !== "undefined" && Config.company && Config.company.currency &&
               Config.company.currency.symbol) || "₹";
  const m = raw.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!m) return raw;
  let n = Number(m[1].replace(/,/g, ""));
  if (!isFinite(n)) return raw;

  const tail = raw.slice(raw.indexOf(m[1]) + m[1].length).toLowerCase();
  if (/^\s*(?:point\s*\d+\s*)?(?:lakh|lac|lakhs|lacs)\b/.test(tail)) n *= 100000;
  else if (/^\s*(?:crore|cr|crores)\b/.test(tail)) n *= 10000000;

  /* Round to paise before asking whether there are any. Multiplying by
     a lakh leaves a remainder in the tenth decimal place, and a whole
     number of rupees written as "18,60,000.00" is the tell that a
     figure has been through arithmetic nobody checked. */
  n = Math.round(n * 100) / 100;

  const grouped = (typeof Calc !== "undefined" && Calc.money)
    ? Calc.money(n, n % 1 ? 2 : 0)
    : String(n);
  return sym + grouped;
}

/* The demonstration values, used only where the request did not carry
   one and the step did not need to stop and ask for it. Every name,
   account, registration and figure below is invented. */
const FIN_FALLBACK = {
  applicant: "Ravindra Transport Company",
  amount:    "₹18,60,000",
  product:   "Used commercial vehicle",
  tenor:     "48",

  loan:      "LN-CV-2026-0118420",
  disbursal: "₹17,36,000",
  emidate:   "10th of next month",

  account:   "LN-CV-2019-0044821",
  vehicle:   "MH-31-CQ-4482",
  arrears:   "₹2,86,400",

  partner:   "Nandini Bank Limited",
  file:      "CLM-2023-07-NBL-2026-07.csv",
  month:     "July 2026",

  customer:  "Ravindra Salunkhe",
  idtype:    "PAN",

  asset:     "Flat 1104, Sanskruti Residency, Wakad, Pune 411057",
  charge:    "₹62,00,000",

  retn:      "DNBS-02 Important Financial Parameters",
  period:    "Quarter ended 30 June 2026",
  reason:    "The movement is the reclassification of the co-lending book following the partner novation in May, not new lending.",

  complaint: "CMS-2026-0084713",
  finding:   "The bounce charge was levied twice for the same presentation on 07 May, and the account was reported 30+ DPD for June after it had been regularised on 12 June.",
  remedy:    "Refund and correct the bureau report",
};

/** Text that types itself out while a `type` step runs. Paced against
    the step's own dwell so it finishes just before the step ends at
    every speed setting. */
function finTyped(task, full, re) {
  if (finPast(task, re)) return { text: full, caret: false };
  if (!finOn(task, re)) return { text: "", caret: false };
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
    const s = finTyped(task, full, re);
    if (finOn(task, re) || finPast(task, re)) {
      out.push({ id: id, text: s.text, caret: s.caret, placeholder: placeholder || "" });
    }
  };

  /* Every entry below pushes the SAME expression the screen renders,
     not the raw parameter. Where a figure is parsed, clamped or
     regrouped on its way to the screen — and a money field is all
     three — pushing the raw parameter makes the field type one number
     and jump to another the moment the shell takes over. */
  if (key === "origination" && (view === "app" || view === "bureau")) {
    add("finAmount", losRs(losSought()), /Enter the amount sought/, "Amount sought");
  }
  if (key === "lms" && (view === "release" || view === "hold")) {
    add("finRelease", losRs(lmsRelease()), /Enter the amount to release/, "Amount to release");
  }
  if (key === "collections" && (view === "history" || view === "notice")) {
    add("finArrears", losRs(colArrears()), /Record the arrears position/, "Arrears as at today");
  }
  if (key === "colending" && (view === "load" || view === "match")) {
    add("finFile", finP("file", FIN_FALLBACK.file), /Enter the partner file reference/, "Partner file reference");
  }
  if (key === "ckycr" && (view === "search" || view === "results")) {
    add("finSearch", finP("customer", FIN_FALLBACK.customer), /Enter the customer to search for/, "Name as recorded");
  }
  if (key === "cersai" && (view === "search" || view === "existing")) {
    add("finAsset", finP("asset", FIN_FALLBACK.asset), /Enter the property to search/, "Property description");
  }
  if (key === "cims" && (view === "fix" || view === "submit")) {
    add("finReason", finP("reason", FIN_FALLBACK.reason), /Explain the flagged variance/, "Reason for the movement");
  }
  if (key === "cms" && (view === "draft" || view === "redress" || view === "submit")) {
    add("finFinding", finP("finding", FIN_FALLBACK.finding), /Record the finding/, "What the account trail shows");
  }
  return out;
}

/** A field that fills itself in during its own step.

    `domId` is what the shell updates in place; `fieldId` is the run
    parameter it holds, so that a person who takes control can correct
    the value on the screen and have the correction land on the run
    rather than only on the pixels. */
function finTypeField(task, domId, fieldId, full, re, placeholder, cls) {
  const s = finTyped(task, full, re);
  const started = finOn(task, re) || finPast(task, re);
  const body = started
    ? esc(s.text) + (s.caret ? '<span class="op-caret"></span>' : "")
    : esc(placeholder || "");
  return '<div class="fin-in ' + (cls || "") + (started ? "" : " is-empty") +
    '" id="' + domId + '"' + (fieldId ? ' data-op-field="' + fieldId + '"' : "") + ">" +
    (body || "&nbsp;") + "</div>";
}

/* ---------------- building blocks ---------------- */

function finField(label, value, cls) {
  const empty = value === "" || value === null || value === undefined;
  return '<div class="fin-f"><label>' + esc(label) + "</label>" +
    '<div class="fin-in ' + (cls || "") + (empty ? " is-empty" : "") + '">' +
    (empty ? "&nbsp;" : value) + "</div></div>";
}

/** An object status: a coloured word, not a badge. */
function finStatus(text, tone) {
  return '<span class="fin-os fin-os--' + (tone || "none") + '">' + esc(text) + "</span>";
}

function finCard(title, body, opts) {
  const o = opts || {};
  return '<section class="fin-card ' + (o.cls || "") + '">' +
    '<header class="fin-card__h"><h3>' + esc(title) +
      (o.count !== undefined ? " <em>(" + esc(o.count) + ")</em>" : "") + "</h3>" +
      '<span class="fin-sp"></span>' + (o.act || "") + "</header>" +
    '<div class="fin-card__b' + (o.flush ? " fin-card__b--flush" : "") + '">' + body + "</div>" +
    (o.foot ? '<footer class="fin-card__f">' + o.foot + "</footer>" : "") +
    "</section>";
}

function finTable(cols, rows, opts) {
  const o = opts || {};
  const head = "<tr>" + (o.check ? '<th class="fin-t__chk"></th>' : "") +
    cols.map(c => "<th" + (c.num ? ' class="fin-num"' : "") + "><span>" + esc(c.t || c) + "</span></th>").join("") +
    (o.act ? '<th class="fin-t__act"></th>' : "") + "</tr>";
  const body = rows.map(r => {
    const cells = (r.c || r).map((v, i) => {
      const num = cols[i] && cols[i].num;
      return "<td" + (num ? ' class="fin-num"' : "") + ">" + v + "</td>";
    }).join("");
    /* A row may declare the field it stands for, so that picking it while
       the person holds the screen sets that value on the run instead of
       only moving a highlight. `pick` names the field, `val` the value it
       carries; without `val` the shell reads the row's first real cell. */
    const pick = r.pick ? ' data-op-pick="' + esc(r.pick) + '"' : "";
    const val = r.val ? ' data-op-value="' + esc(r.val) + '"' : "";
    return '<tr class="' + (r.cls || "") + '"' + pick + val + ">" +
      (o.check ? '<td class="fin-t__chk"><i' + (r.checked ? ' class="is-on"' : "") + "></i></td>" : "") + cells +
      (o.act ? '<td class="fin-t__act">&#9662;</td>' : "") + "</tr>";
  }).join("");
  return '<div class="fin-t__wrap"><table class="fin-t"><thead>' + head +
    "</thead><tbody>" + body + "</tbody></table></div>";
}

function finKpis(list) {
  return '<div class="fin-kpis">' + list.map(k =>
    '<div class="fin-kpi ' + (k.cls || "") + '"><label>' + esc(k.l) + "</label><b>" + esc(k.v) + "</b>" +
    (k.s ? "<small>" + esc(k.s) + "</small>" : "") + "</div>").join("") + "</div>";
}

/** The message strip: the honest one that says what is wrong. */
function finStrip(text, tone, strong) {
  const t = tone ? " fin-strip--" + tone : "";
  return '<div class="fin-strip' + t + '">' +
    finIco(tone === "err" ? "alert" : tone === "warn" ? "alert" : tone === "ok" ? "check" : "info") +
    "<span>" + (strong ? "<b>" + esc(strong) + "</b> " : "") + esc(text) + "</span></div>";
}

function finToast(text) {
  return '<div class="fin-toast">' + finIco("check") + "<span>" + esc(text) + "</span></div>";
}

function finDialog(title, body, foot, wide) {
  return '<div class="fin-dlg__bd"><div class="fin-dlg' + (wide ? " fin-dlg--wide" : "") + '">' +
    '<header class="fin-dlg__h"><b>' + esc(title) + "</b><i>" + finIco("close") + "</i></header>" +
    '<div class="fin-dlg__b">' + body + "</div>" +
    '<footer class="fin-dlg__f">' + foot + "</footer></div></div>";
}

function finBtn(label, kind) {
  return '<button class="fin-btn' + (kind ? " fin-btn--" + kind : "") + '">' + esc(label) + "</button>";
}

/** The object page header: the shape every record in the estate shares. */
function finObjHeader(eyebrow, title, status, fields, acts) {
  return '<div class="fin-oh"><div class="fin-oh__row">' +
    '<div class="fin-oh__id"><div class="fin-oh__eyebrow">' + esc(eyebrow) + "</div>" +
      '<div class="fin-oh__title">' + esc(title) + "</div>" +
      (status ? '<div class="fin-oh__status">' + status + "</div>" : "") + "</div>" +
    '<div class="fin-oh__acts">' + (acts || "") + "</div></div>" +
    (fields && fields.length
      ? '<div class="fin-oh__fields">' + fields.map(f =>
          '<div class="fin-oh__f"><label>' + esc(f.k) + "</label><div>" + f.v + "</div></div>").join("") + "</div>"
      : "") +
    "</div>";
}

/** The funnel across the top of a case: where it is and where it stopped. */
function finFlow(steps) {
  return '<div class="fin-flow">' + steps.map(s =>
    '<div class="fin-flow__s ' + (s.state ? "is-" + s.state : "") + '">' +
    "<label>" + esc(s.k) + "</label><b>" + esc(s.v) + "</b></div>").join("") + "</div>";
}

/** A gate: the conditions an action is allowed under, and whether each
    one actually holds. Every failing row carries the rule it failed,
    because "not authorised" without the reason is just an obstacle. */
function finGate(rows) {
  return '<div class="fin-gate">' + rows.map(r =>
    '<div class="fin-gate__r ' + (r.pass ? "is-pass" : "is-fail") + '">' +
      '<span class="fin-gate__m">' + (r.pass ? "&#10003;" : "&#10007;") + "</span>" +
      '<span class="fin-gate__t"><b>' + esc(r.t) + "</b>" +
        (r.d ? "<span>" + esc(r.d) + "</span>" : "") +
        (r.cite ? "<em>" + esc(r.cite) + "</em>" : "") +
      "</span></div>").join("") + "</div>";
}

/** An acknowledgement receipt. Every registry run ends in one. */
function finAck(title, fields) {
  return '<div class="fin-ack"><div class="fin-ack__h">' + finIco("check") + "<span>" + esc(title) + "</span></div>" +
    '<div class="fin-ack__b">' + fields.map(f =>
      '<div class="fin-ack__f' + (f.wide ? " is-wide" : "") + '"><label>' + esc(f.k) + "</label>" +
      "<b>" + esc(f.v) + "</b>" + (f.s ? "<small>" + esc(f.s) + "</small>" : "") + "</div>").join("") +
    "</div></div>";
}

/** Label and value rows, for a record summary panel. */
function finMini(rows) {
  return '<div class="fin-mini">' + rows.map(r =>
    '<div class="fin-mini__r"><label>' + esc(r.k) + "</label><b" +
    (r.neg ? ' class="is-neg"' : "") + ">" + r.v + "</b></div>").join("") + "</div>";
}

/** A bar against a ceiling: a margin, a cover, a limit. */
function finBar(pct, ceilingPct, label) {
  const over = pct > ceilingPct;
  return '<div class="fin-bar"><span class="fin-bar__t' + (over ? " is-over" : "") + '">' +
    '<i style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i>' +
    '<u style="left:' + Math.max(0, Math.min(100, ceilingPct)) + '%"></u></span>' +
    "<b>" + esc(label) + "</b></div>";
}

/* ==================================================================
   the shells
   ------------------------------------------------------------------
   Two skins over the one component set above. A department carrying
   `statutory: true` is a registry, so it gets the filing-portal
   chrome; everything else is a module of the tenant's own platform.
   ================================================================== */

function finOrg() {
  return (typeof Config !== "undefined" && Config.company && Config.company.short) || "the lender";
}
function finOrgFull() {
  return (typeof Config !== "undefined" && Config.company && Config.company.name) || finOrg();
}
function finUser() {
  return (typeof state !== "undefined" && state.user && state.user.name) ? state.user.name : "A. Chandrasekaran";
}

function finTabs(d, active) {
  return (d.nav || []).map((t, i) =>
    '<div class="fin-tab ' + (i === (active === undefined ? 1 : active) ? "is-active" : "") + '">' +
    esc(t) + "</div>").join("");
}

/** The tenant's own platform: one product, four modules. */
function finPlatform(key, body, opts) {
  const o = opts || {};
  const d = OP_DEPT[key];
  const initials = finUser().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return '<div class="fin" data-sys="platform" data-app="' + key + '">' +
    '<header class="fin-gh">' +
      '<div class="fin-gh__home">' + finIco("grid") + "</div>" +
      '<div class="fin-gh__logo">' + finIco("rupee") + "<b>" + esc(finOrg()) + " Lending</b></div>" +
      '<div class="fin-gh__mod"><em>Module</em> ' + esc(d.module || d.label) + "</div>" +
      '<div class="fin-gh__search">' + finIco("search") + "<span>Search accounts, applications, customers</span></div>" +
      '<span class="fin-gh__sp"></span>' +
      '<div class="fin-gh__tools">' +
        '<div class="fin-gh__tool">' + finIco("alert") + "<b>6</b></div>" +
        '<div class="fin-gh__tool">' + finIco("help") + "</div>" +
        '<div class="fin-gh__me">' + esc(initials) + "</div>" +
      "</div>" +
    "</header>" +
    '<nav class="fin-nav"><div class="fin-nav__app">' + esc(finOrg()) + " &middot; " + esc(d.label) + "</div>" +
    '<div class="fin-nav__tabs">' + finTabs(d, o.tab) + "</div></nav>" +
    '<div class="fin-main">' + body + "</div>" +
    (o.dialog || "") +
    "</div>";
}

/** A statutory registry: somebody else's site, and it has to look it.

    The identity mark is a lettered tile. No public authority's emblem
    is drawn: reproducing the State Emblem is restricted under the
    State Emblem of India (Prohibition of Improper Use) Act 2005, and
    a demonstration has no business doing it. */
function finRegistry(key, body, opts) {
  const o = opts || {};
  const d = OP_DEPT[key];
  return '<div class="fin" data-sys="gov" data-app="' + key + '">' +
    '<div class="fin-util"><em>' + esc(d.authority || "") + "</em>" +
      "<span>" + esc(d.authorityLong || "") + "</span>" +
      '<span class="fin-sp"></span><span>A- A A+</span><span>English</span><span>Skip to main content</span></div>' +
    '<header class="fin-gh fin-gh--gov">' +
      '<div class="fin-gh__mark">' + esc(d.favMark || "R") + "</div>" +
      '<div class="fin-gh__id"><b>' + esc(o.appTitle || d.tabTitle.split("|").pop().trim()) + "</b>" +
        "<em>" + esc(d.authorityLong || "") + "</em></div>" +
      '<span class="fin-gh__sp"></span>' +
      '<div class="fin-gh__re"><label>Reporting entity</label><b>' + esc(finOrgFull()) + "</b></div>" +
    "</header>" +
    '<nav class="fin-nav fin-nav--gov"><div class="fin-nav__app">' + esc(d.label) + "</div>" +
    '<div class="fin-nav__tabs">' + finTabs(d, o.tab) + "</div></nav>" +
    '<div class="fin-crumb">Home <span>&rsaquo;</span> <b>' + esc(o.crumb || d.nav[1] || "Search") + "</b></div>" +
    '<div class="fin-main">' + body + "</div>" +
    (o.dialog || "") +
    "</div>";
}

/** One entry point, so a screen never has to know which skin it is in. */
function finShell(key, body, opts) {
  return OP_DEPT[key] && OP_DEPT[key].statutory
    ? finRegistry(key, body, opts)
    : finPlatform(key, body, opts);
}

/* ==================================================================
   LOAN ORIGINATION
   ------------------------------------------------------------------
   The case is a used commercial vehicle to a two-truck operator. It is
   chosen because it fails in the way real cases fail: not on identity,
   not on the bureau, but on five percentage points of margin, because
   the asset is a tipper and tippers carry a lower ceiling than the
   truck the same policy line otherwise covers.

   The run does not absorb that. It raises it, routes it to the
   authority whose delegation actually covers five points rather than
   the nearer one that covers three, and records what came back —
   which was a sanction at the ceiling and a declined deviation.
   ================================================================== */

const LOS_ASSET  = "2022 Tata Signa 2823.TK tipper";
const LOS_REG    = "MH-15-BR-7719";
const LOS_VALUE  = 2480000;
const LOS_CEIL   = 70;          /* used CV up to five years, less the tipper carve-out */
const LOS_APP    = "APP-2026-118420";

function losSought() {
  const raw = finP("amount", FIN_FALLBACK.amount).replace(/[^\d.]/g, "");
  const n = Number(raw);
  return isFinite(n) && n > 0 ? n : 1860000;
}
function losPct() { return (losSought() / LOS_VALUE) * 100; }
function losCeilingAmt() { return Math.round(LOS_VALUE * LOS_CEIL / 100); }
function losGap() { return Math.max(0, losSought() - losCeilingAmt()); }
function losRs(n) { return "₹" + ((typeof Calc !== "undefined" && Calc.money) ? Calc.money(n, 0) : String(n)); }

function losFlow(task) {
  const at = i => finPast(task, [/Open the application/, /Pull the bureau report/,
    /Test the margin/, /Route it to the sanctioning/, /Record the sanction/][i]);
  return finFlow([
    { k: "Sourced", v: "Branch, Nashik", state: "done" },
    { k: "Login", v: at(0) ? "Complete" : "In progress", state: at(0) ? "done" : "now" },
    { k: "Credit", v: at(1) ? "Assessed" : "Pending", state: at(1) ? "done" : at(0) ? "now" : "" },
    { k: "Deviation", v: at(2) ? "Raised" : "—", state: at(2) ? "done" : "" },
    { k: "Sanction", v: at(4) ? "Recorded" : at(3) ? "With authority" : "—",
      state: at(4) ? "done" : at(3) ? "now" : "" },
  ]);
}

function finOrigination(view, task) {
  const applicant = finP("applicant", FIN_FALLBACK.applicant);
  const product   = finP("product", FIN_FALLBACK.product);
  const tenor     = finP("tenor", FIN_FALLBACK.tenor);
  const sought    = losSought();

  if (view === "home") {
    const queue = [
      { c: ["APP-2026-118395", "Deepa Nair Enterprises", "Business loan", "₹9,00,000", "Coimbatore", finStatus("With credit", "info")] },
      { c: ["APP-2026-118412", "Mahalaxmi Traders", "Loan against property", "₹41,00,000", "Indore", finStatus("Awaiting FI", "warn")] },
      { c: [LOS_APP, esc(applicant), "Used commercial vehicle", losRs(sought), "Nashik", finStatus("Ready for credit", "ok")],
        cls: "is-sel", pick: "applicant", val: applicant },
      { c: ["APP-2026-118431", "Sunil Kumbhar", "Two wheeler", "₹86,000", "Sangli", finStatus("With credit", "info")] },
      { c: ["APP-2026-118447", "Zaid Logistics LLP", "New commercial vehicle", "₹32,40,000", "Nagpur", finStatus("Awaiting documents", "warn")] },
      { c: ["APP-2026-118460", "Prakash Jewellers", "Gold loan", "₹2,20,000", "Thrissur", finStatus("Ready for credit", "ok")] },
    ];
    return finShell("origination",
      finKpis([
        { l: "In the queue", v: "38" },
        { l: "Ready for credit", v: "11", cls: "is-ok" },
        { l: "Beyond turnaround", v: "3", cls: "is-warn" },
        { l: "Deviations open", v: "7" },
        { l: "Sanctioned this month", v: "412" },
      ]) +
      finCard("Credit queue", finTable(
        ["Application", "Applicant", "Product", "Amount", "Branch", "Status"],
        queue, { act: true }), { flush: true, count: queue.length }),
      { tab: 0 });
  }

  if (view === "app") {
    return finShell("origination",
      finObjHeader("Application " + LOS_APP, applicant,
        finStatus("With credit", "info"),
        [{ k: "Product", v: esc(product) }, { k: "Branch", v: "Nashik" },
         { k: "Sourced by", v: "Rohit Kulkarni" }, { k: "In queue", v: "2 days" }],
        finBtn("Assign to me") + finBtn("Open assessment", "emph")) +
      losFlow(task) +
      '<div class="fin-two">' +
        finCard("Application", '<div class="fin-grid2">' +
          finField("Applicant", esc(applicant)) +
          finField("Constitution", "Proprietorship") +
          finField("Proprietor", "Ravindra Salunkhe") +
          finField("Vintage in business", "9 years") +
          '<div class="fin-f"><label>Amount sought</label>' +
            finTypeField(task, "finAmount", "amount", losRs(sought),
              /Enter the amount sought/, "Amount sought") + "</div>" +
          finField("Tenor sought", esc(tenor) + " months") +
        "</div>", { }) +
        finCard("Asset offered", finMini([
          { k: "Asset", v: esc(LOS_ASSET) },
          { k: "Registration", v: esc(LOS_REG) },
          { k: "Year of manufacture", v: "2022" },
          { k: "Assessed value", v: losRs(LOS_VALUE) },
          { k: "Valuer", v: "Empanelled, report dated 04 Aug 2026" },
          { k: "Existing fleet", v: "2 vehicles, both financed with us" },
        ]), { flush: true }) +
      "</div>",
      { tab: 1 });
  }

  if (view === "bureau") {
    const lines = [
      { c: ["Commercial bureau", "Rank 4 of 10", "₹28,40,000", "2 live facilities", finStatus("Satisfactory", "ok")] },
      { c: ["Consumer bureau, proprietor", "741", "₹3,16,200", "3 live facilities", finStatus("Satisfactory", "ok")] },
      { c: ["Two wheeler loan, other lender", "—", "₹41,800", "Current", finStatus("30 days past due once, Mar 2026", "warn")],
        cls: "is-warn" },
      { c: ["Personal loan, other lender", "—", "₹0", "Closed 2021", finStatus("Settled, not paid in full", "err")],
        cls: "is-alert" },
      { c: ["Our own accounts", "—", "₹11,92,400", "2 live facilities", finStatus("No overdue in 24 months", "ok")] },
    ];
    return finShell("origination",
      finObjHeader("Application " + LOS_APP, applicant, finStatus("Bureau pulled", "info"),
        [{ k: "Pulled", v: "Today, 11:04" }, { k: "Consent", v: "On file, 04 Aug 2026" },
         { k: "Enquiries, 6 months", v: "2" }, { k: "Written off / settled", v: "1" }], "") +
      finStrip("A settled account is not a clean closure and does not become one with age. It is a condition on the sanction, not a decline on its own.", "warn", "Read it as it is.") +
      finCard("Bureau summary", finTable(
        ["Source", "Score / rank", "Exposure", "Position", "Read"], lines), { flush: true, count: lines.length }) +
      finCard("What this changes", '<ul class="fin-list">' +
        "<li>The settled personal loan is disclosed on the application and matches what the proprietor told the branch.</li>" +
        "<li>The single 30 day delinquency is fourteen months old and on a facility of ₹41,800.</li>" +
        "<li>Neither is a decline. Both are carried into the conditions on the sanction.</li>" +
        "</ul>"),
      { tab: 2 });
  }

  if (view === "income") {
    const rows = [
      { c: ["Freight earnings, attached route", "₹1,42,000", "Trip sheets, 12 months", finStatus("Accepted", "ok")] },
      { c: ["Less: driver, fuel, tyres, maintenance", "₹84,600", "Route norms and invoices", finStatus("Accepted", "ok")] },
      { c: ["Net earnings per vehicle per month", "₹57,400", "Derived", finStatus("Accepted", "ok")] },
      { c: ["Existing obligations", "₹38,200", "Bureau and own book", finStatus("Verified", "ok")] },
      { c: ["Proposed instalment on this facility", "₹49,850", "At ₹17,36,000 for " + esc(tenor) + " months", finStatus("Computed", "info")],
        cls: "is-warn" },
    ];
    return finShell("origination",
      finObjHeader("Application " + LOS_APP, applicant, finStatus("Assessment", "info"),
        [{ k: "Vehicles after this", v: "3" }, { k: "Route", v: "Nashik – Bhiwandi, attached" },
         { k: "Assessment method", v: "Route viability" }, { k: "Field investigation", v: "Positive, 06 Aug 2026" }], "") +
      '<div class="fin-two">' +
        finCard("Income and obligations", finTable(
          ["Line", "Per month", "Evidence", "Status"], rows), { flush: true }) +
        finCard("Where that leaves it", finMini([
          { k: "Earnings, three vehicles", v: "₹1,72,200" },
          { k: "Total obligations after this", v: "₹88,050" },
          { k: "Instalment to net income", v: "51.1 per cent" },
          { k: "Policy ceiling", v: "60 per cent" },
          { k: "Guarantor", v: "Spouse, independent income, on file" },
          { k: "Read", v: finStatus("Serviceable", "ok") },
        ]), { flush: true }) +
      "</div>",
      { tab: 2 });
  }

  if (view === "margin") {
    const pct = losPct();
    return finShell("origination",
      finObjHeader("Application " + LOS_APP, applicant, finStatus("Margin tested", "warn"),
        [{ k: "Asset", v: esc(LOS_ASSET) }, { k: "Assessed value", v: losRs(LOS_VALUE) },
         { k: "Sought", v: losRs(losSought()) }, { k: "Ceiling", v: losRs(losCeilingAmt()) }], "") +
      finStrip("The ceiling for a used commercial vehicle up to five years old is 75 per cent. Tippers and construction equipment carry a five percentage point lower ceiling, because the resale market for them is narrower. That is what applies here.",
        "warn", "Why 70 and not 75.") +
      '<div class="fin-two">' +
        finCard("Margin against the ceiling",
          finBar(pct, LOS_CEIL, pct.toFixed(2) + " per cent sought, ceiling " + LOS_CEIL + " per cent") +
          '<div style="height:10px"></div>' +
          finTable(["Line", { t: "Amount", num: true }], [
            ["Assessed value of the asset", losRs(LOS_VALUE)],
            ["Funding at the ceiling of " + LOS_CEIL + " per cent", losRs(losCeilingAmt())],
            ["Amount sought", losRs(losSought())],
            { c: ["Shortfall to be covered or deviated", losRs(losGap())], cls: "is-alert" },
          ])) +
        finCard("The ladder this came off", finTable(
          ["Asset age at sanction", { t: "Ceiling" }], [
            ["New, to a fleet operator", "90 per cent"],
            ["New, to a first time buyer", "80 per cent"],
            ["Used, up to five years", "75 per cent"],
            { c: ["Tipper or construction equipment", "less 5 percentage points"], cls: "is-alert" },
            ["Used, five to eight years", "65 per cent"],
            ["Older than eight years at the end of the tenor", "Not funded"],
          ]), { flush: true, foot: "Ceilings, not entitlements. The margin on a case is set by credit and is not varied at the counter." }) +
      "</div>",
      { tab: 2 });
  }

  if (view === "deviation") {
    return finShell("origination",
      finObjHeader("Application " + LOS_APP, applicant, finStatus("Deviation being raised", "warn"),
        [{ k: "Type", v: "Margin above ceiling" }, { k: "Extent", v: (losPct() - LOS_CEIL).toFixed(2) + " percentage points" },
         { k: "Amount", v: losRs(losGap()) }, { k: "Raised by", v: esc(finUser()) }], "") +
      finCard("Deviations on this application", finTable(
        ["Deviation", "Extent", "Raised", "Status"], [
          { c: ["Margin above the ceiling for the asset", (losPct() - LOS_CEIL).toFixed(2) + " pp", "Today", finStatus("Being raised", "warn")], cls: "is-alert" },
          ["Settled account in the bureau", "Disclosed", "Today", finStatus("Noted, condition proposed", "info")],
        ]), { flush: true }),
      { tab: 3,
        dialog: finDialog("Raise deviation",
          '<div class="fin-grid2">' +
            finField("Deviation type", "Margin above the ceiling for the asset") +
            finField("Policy line", "Used CV up to five years, tipper carve-out") +
            finField("Ceiling", LOS_CEIL + " per cent · " + losRs(losCeilingAmt())) +
            finField("Sought", losPct().toFixed(2) + " per cent · " + losRs(losSought())) +
          "</div>" +
          finField("Justification recorded",
            "Nine years in the trade, an attached route, two facilities with us running clean for twenty four months and a guarantor with independent income. The shortfall is " +
            losRs(losGap()) + ".", "fin-in--area") +
          finStrip("A deviation is raised at the extent it actually is. Reducing the amount sought to make it fit the ceiling without telling the applicant is not an approval, it is a different loan.", "warn"),
          finBtn("Cancel") + finBtn("Raise deviation", "emph")) });
  }

  if (view === "matrix") {
    const rows = [
      ["Up to 1 percentage point", "Credit Manager", "Same day", finStatus("Not applicable", "none")],
      ["Above 1 and up to 3 percentage points", "Regional Credit Manager", "1 working day", finStatus("Not applicable", "none")],
      { c: ["Above 3 and up to 7 percentage points", "Chief Credit Officer", "2 working days", finStatus("This case", "warn")], cls: "is-alert" },
      ["Above 7 percentage points", "Credit Committee", "At the next sitting", finStatus("Not applicable", "none")],
    ];
    return finShell("origination",
      finObjHeader("Application " + LOS_APP, applicant, finStatus("Routing for sanction", "info"),
        [{ k: "Deviation", v: (losPct() - LOS_CEIL).toFixed(2) + " pp" },
         { k: "Falls to", v: "Chief Credit Officer" },
         { k: "Nearest lower authority", v: "Regional Credit Manager" },
         { k: "Turnaround", v: "2 working days" }], "") +
      finStrip("Five points is above the Regional Credit Manager's delegation. The file goes to the Chief Credit Officer, and it takes two days longer for that reason.",
        "info", "Routed up, not across.") +
      finCard("Delegation for a margin deviation", finTable(
        ["Extent", "Authority", "Turnaround", "This case"], rows), { flush: true }),
      { tab: 3,
        dialog: finDialog("Route for sanction",
          '<div class="fin-grid2">' +
            finField("Application", LOS_APP) +
            finField("Applicant", esc(applicant)) +
            finField("Recommended", losRs(losSought()) + " for " + esc(tenor) + " months") +
            finField("Deviation", (losPct() - LOS_CEIL).toFixed(2) + " pp on margin") +
          "</div>" +
          finStrip("The recommendation goes up with the deviation attached to it, not stripped out of it.", "info"),
          finBtn("Cancel") + finBtn("Route to Chief Credit Officer", "emph")) });
  }

  if (view === "sanction") {
    return finShell("origination",
      finObjHeader("Application " + LOS_APP, applicant, finStatus("Decision returned", "info"),
        [{ k: "Decided by", v: "Chief Credit Officer" }, { k: "Decided", v: "Today, 16:20" },
         { k: "Deviation", v: "Declined" }, { k: "Sanctioned", v: losRs(losCeilingAmt()) }], "") +
      finCard("Sanctioned terms", finTable(
        ["Term", "Recommended", "Sanctioned"], [
          ["Amount", losRs(losSought()), losRs(losCeilingAmt())],
          ["Margin", losPct().toFixed(2) + " per cent", LOS_CEIL + " per cent"],
          ["Tenor", esc(tenor) + " months", esc(tenor) + " months"],
          ["Rate of interest", "13.50 per cent", "13.50 per cent"],
          { c: ["Deviation on margin", "Sought", finStatus("Declined", "err")], cls: "is-alert" },
        ]), { flush: true }),
      { tab: 4,
        dialog: finDialog("Record sanction decision",
          finStrip("The deviation was declined. The facility is sanctioned at the ceiling, and the balance of " +
            losRs(losGap()) + " is to be funded by the borrower from own sources with proof before disbursal.",
            "warn", "As decided.") +
          finCard("Conditions to be recorded", '<ul class="fin-list">' +
            "<li>Own contribution of " + losRs(losGap()) + " evidenced before release.</li>" +
            "<li>Guarantee of the proprietor's spouse, with independent income proof.</li>" +
            "<li>Settled account in the bureau to be disclosed in the credit note and reviewed at first renewal.</li>" +
            "<li>Hypothecation to be endorsed on the registration certificate within thirty days of delivery.</li>" +
            "</ul>"),
          finBtn("Back") + finBtn("Record decision", "emph"), true) });
  }

  /* verify */
  return finShell("origination",
    finToast("Sanction recorded on " + LOS_APP + " at " + losRs(losCeilingAmt()) + ", deviation declined, four conditions attached.") +
    finObjHeader("Application " + LOS_APP, applicant, finStatus("Sanctioned", "ok"),
      [{ k: "Sanctioned", v: losRs(losCeilingAmt()) }, { k: "Tenor", v: esc(tenor) + " months" },
       { k: "Rate", v: "13.50 per cent" }, { k: "Conditions", v: "4" }],
      finBtn("Print sanction letter") + finBtn("Send to Loan Management", "emph")) +
    losFlow(task) +
    '<div class="fin-two">' +
      finCard("What the applicant is told", '<ul class="fin-list">' +
        "<li>Sanctioned at " + losRs(losCeilingAmt()) + ", not the " + losRs(losSought()) + " sought.</li>" +
        "<li>The reason, in one line: the asset is a tipper, and the ceiling for a tipper is five points lower.</li>" +
        "<li>The balance of " + losRs(losGap()) + " is theirs to fund, and proof is needed before anything is released.</li>" +
        "<li>The key facts statement goes with the sanction letter, not after it.</li>" +
        "</ul>") +
      finCard("Trail", finTable(["Step", "By", "At"], [
        ["Application opened", esc(finUser()), "11:02"],
        ["Bureau pulled", esc(finUser()), "11:04"],
        ["Assessment completed", esc(finUser()), "12:40"],
        ["Deviation raised", esc(finUser()), "14:15"],
        ["Routed to Chief Credit Officer", esc(finUser()), "14:16"],
        { c: ["Decision recorded", "Chief Credit Officer", "16:20"], cls: "is-new" },
      ]), { flush: true }) +
    "</div>",
    { tab: 4 });
}

/* ==================================================================
   LOAN MANAGEMENT
   ------------------------------------------------------------------
   The sanction becomes money and a repayment. The step worth watching
   is the withholding: one condition is still open, so what is released
   is the sanction less a retention, rather than the whole amount with
   a promise to chase the paperwork afterwards. Chasing paperwork after
   the money has gone is how post-disbursement document ageing starts.
   ================================================================== */

const LMS_LOAN   = "LN-CV-2026-0118420";
const LMS_SANC   = 1736000;
const LMS_HOLD   = 40000;

function lmsRelease() {
  const raw = finP("disbursal", FIN_FALLBACK.disbursal).replace(/[^\d.]/g, "");
  const n = Number(raw);
  return isFinite(n) && n > 0 ? Math.min(n, LMS_SANC) : LMS_SANC;
}
function lmsNet() { return Math.max(0, lmsRelease() - LMS_HOLD); }

function lmsFlow(task) {
  const done = re => finPast(task, re);
  return finFlow([
    { k: "Sanction", v: "Recorded", state: "done" },
    { k: "Checklist", v: done(/Run the pre-disbursal checklist/) ? "Run" : "Pending",
      state: done(/Run the pre-disbursal checklist/) ? "done" : "now" },
    { k: "Disbursal", v: done(/Withhold against the open condition/) ? "Released with retention" : "—",
      state: done(/Withhold against the open condition/) ? "done" : "" },
    { k: "Mandate", v: done(/Register the repayment mandate/) ? "Registered" : "—",
      state: done(/Register the repayment mandate/) ? "done" : "" },
    { k: "Documents", v: done(/Put an owner and a date/) ? "Tracked" : "—",
      state: done(/Put an owner and a date/) ? "done" : "" },
  ]);
}

function finLms(view, task) {
  const loan = finP("loan", FIN_FALLBACK.loan);
  const emid = finP("emidate", FIN_FALLBACK.emidate);

  if (view === "home") {
    const rows = [
      { c: ["LN-LAP-2026-0033157", "Anjali Deshmukh", "Loan against property", "₹62,00,000", finStatus("Awaiting charge filing", "warn")] },
      { c: [esc(loan), "Ravindra Transport Company", "Used commercial vehicle", losRs(LMS_SANC), finStatus("Ready to disburse", "ok")],
        cls: "is-sel", pick: "loan", val: loan },
      { c: ["LN-BL-2026-0091044", "Deepa Nair Enterprises", "Business loan", "₹9,00,000", finStatus("Disbursed", "ok")] },
      { c: ["LN-GL-2026-0210338", "Prakash Jewellers", "Gold loan", "₹2,20,000", finStatus("Disbursed", "ok")] },
      { c: ["LN-CV-2026-0118512", "Zaid Logistics LLP", "New commercial vehicle", "₹32,40,000", finStatus("Awaiting own contribution", "warn")] },
    ];
    return finShell("lms",
      finKpis([
        { l: "Ready to disburse", v: "23", cls: "is-ok" },
        { l: "Held on conditions", v: "6", cls: "is-warn" },
        { l: "Disbursed today", v: "₹14.2 cr" },
        { l: "Mandates pending", v: "9" },
        { l: "Documents overdue", v: "31", cls: "is-err" },
      ]) +
      finCard("Accounts awaiting action", finTable(
        ["Account", "Borrower", "Product", "Sanctioned", "Status"], rows, { act: true }),
        { flush: true, count: rows.length }),
      { tab: 0 });
  }

  if (view === "account") {
    return finShell("lms",
      finObjHeader("Loan account " + loan, "Ravindra Transport Company",
        finStatus("Ready to disburse", "ok"),
        [{ k: "Product", v: "Used commercial vehicle" }, { k: "Sanctioned", v: losRs(LMS_SANC) },
         { k: "Rate", v: "13.50 per cent" }, { k: "Tenor", v: "42 months" }],
        finBtn("Open checklist") + finBtn("Disburse", "emph")) +
      lmsFlow(task) +
      '<div class="fin-two">' +
        finCard("Account", finMini([
          { k: "Sanction reference", v: LOS_APP },
          { k: "Asset", v: esc(LOS_ASSET) },
          { k: "Registration", v: esc(LOS_REG) },
          { k: "Dealer", v: "Sanghvi Motors, Nashik" },
          { k: "Own contribution required", v: losRs(losGap()) },
          { k: "Guarantor", v: "On file, spouse of the proprietor" },
        ]), { flush: true }) +
        finCard("Conditions on the sanction", finTable(
          ["Condition", "Status"], [
            ["Own contribution evidenced", finStatus("Received, receipt on file", "ok")],
            ["Guarantee executed", finStatus("Executed", "ok")],
            ["Insurance with our clause", finStatus("Policy on file", "ok")],
            { c: ["Hypothecation endorsed on the registration certificate", finStatus("Open, application lodged", "warn")], cls: "is-warn" },
          ]), { flush: true }) +
      "</div>",
      { tab: 1 });
  }

  if (view === "predisb") {
    const rows = [
      ["Sanction letter accepted by the borrower", "Branch", finStatus("On file", "ok")],
      ["Loan agreement executed on the current template", "Operations", finStatus("v5.0, executed 14 Aug 2026", "ok")],
      ["Key facts statement acknowledged", "Branch", finStatus("Acknowledged", "ok")],
      ["Own contribution evidenced", "Operations", finStatus("₹1,24,000 receipt on file", "ok")],
      ["Invoice in the borrower's name", "Operations", finStatus("On file", "ok")],
      ["Insurance with our clause endorsed", "Operations", finStatus("On file", "ok")],
      { c: ["Hypothecation endorsed on the registration certificate", "Operations", finStatus("Not yet, application lodged 12 Aug", "warn")], cls: "is-warn" },
      ["Repayment mandate signed", "Branch", finStatus("Signed, not yet registered", "info")],
    ];
    return finShell("lms",
      finObjHeader("Pre-disbursal checklist", loan, finStatus("One item open", "warn"),
        [{ k: "Items", v: "8" }, { k: "Cleared", v: "7" }, { k: "Open", v: "1" },
         { k: "Run by", v: esc(finUser()) }], "") +
      finStrip("Seven of eight are cleared. The eighth is the endorsement, which cannot be cleared before delivery, so it is handled by retaining part of the disbursal rather than by waiving it.",
        "warn", "Do not waive it.") +
      finCard("Checklist", finTable(["Item", "Owner", "Status"], rows), { flush: true, count: rows.length }),
      { tab: 2 });
  }

  if (view === "release" || view === "hold") {
    const dlg = view === "hold"
      ? finDialog("Withhold from this disbursal",
          '<div class="fin-grid2">' +
            finField("Against condition", "Hypothecation endorsement on the registration certificate") +
            finField("Amount withheld", losRs(LMS_HOLD)) +
            finField("Released now", losRs(lmsNet())) +
            finField("Release of the retention", "On the endorsed certificate reaching the file") +
          "</div>" +
          finStrip("A retention has to be a number the borrower is told, with the one thing that releases it. A retention nobody can discharge is a charge under another name.",
            "info", "Tell them how to get it back."),
          finBtn("Cancel") + finBtn("Withhold and release the balance", "emph"))
      : "";
    return finShell("lms",
      finObjHeader("Disbursal memo", loan, finStatus(view === "hold" ? "Retention being applied" : "Being prepared", view === "hold" ? "warn" : "info"),
        [{ k: "Sanctioned", v: losRs(LMS_SANC) }, { k: "Beneficiary", v: "Sanghvi Motors, Nashik" },
         { k: "Mode", v: "NEFT" }, { k: "Value date", v: "Today" }], "") +
      '<div class="fin-two">' +
        finCard("Disbursal", '<div class="fin-grid2">' +
          finField("Sanctioned amount", losRs(LMS_SANC)) +
          '<div class="fin-f"><label>Amount to release</label>' +
            finTypeField(task, "finRelease", "disbursal", losRs(lmsRelease()),
              /Enter the amount to release/, "Amount to release") + "</div>" +
          finField("Withheld against open condition", view === "hold" || finPast(task, /Withhold against/) ? losRs(LMS_HOLD) : "") +
          finField("Net payable to the dealer", view === "hold" || finPast(task, /Withhold against/) ? losRs(lmsNet()) : "") +
        "</div>") +
        finCard("Beneficiary", finMini([
          { k: "Name", v: "Sanghvi Motors" },
          { k: "Account", v: "Current account, verified by penny drop" },
          { k: "Verified on", v: "14 Aug 2026" },
          { k: "Invoice", v: "SM/2026-27/1184, in the borrower's name" },
          { k: "Delivery", v: "On release of this memo" },
        ]), { flush: true }) +
      "</div>",
      { tab: 2, dialog: dlg });
  }

  if (view === "mandate") {
    return finShell("lms",
      finObjHeader("Repayment mandate", loan, finStatus("Being registered", "info"),
        [{ k: "Scheme", v: "NACH debit" }, { k: "Bank", v: "Borrower's current account" },
         { k: "Frequency", v: "Monthly" }, { k: "Until", v: "Cancelled" }], "") +
      finCard("Mandates on this account", finTable(
        ["Reference", "Bank", "Maximum amount", "Status"], [
          { c: ["To be allotted on registration", "Borrower's bank", losRs(60000), finStatus("Being registered", "info")], cls: "is-new" },
        ]), { flush: true }),
      { tab: 3,
        dialog: finDialog("Register mandate",
          '<div class="fin-grid2">' +
            finField("Instalment", losRs(49850)) +
            finField("Maximum amount on the mandate", losRs(60000)) +
            finField("First presentation", esc(emid)) +
            finField("Registration turnaround", "Up to 3 working days") +
          "</div>" +
          finStrip("The mandate is registered before the first instalment falls, not in the same week. A first instalment presented against an unregistered mandate bounces for a reason that has nothing to do with the borrower, and it is the single largest cause of a first-instalment bounce.",
            "warn", "Why the date matters."),
          finBtn("Cancel") + finBtn("Register mandate", "emph")) });
  }

  if (view === "emi") {
    const sched = [
      ["1", esc(emid), losRs(49850), losRs(19530), losRs(30320), losRs(1705680)],
      ["2", "Next month", losRs(49850), losRs(19189), losRs(30661), losRs(1675019)],
      ["3", "Month after", losRs(49850), losRs(18844), losRs(31006), losRs(1644013)],
      ["4", "—", losRs(49850), losRs(18495), losRs(31355), losRs(1612658)],
      ["5", "—", losRs(49850), losRs(18142), losRs(31708), losRs(1580950)],
    ];
    return finShell("lms",
      finObjHeader("Repayment schedule", loan, finStatus("Being set", "info"),
        [{ k: "Instalment", v: losRs(49850) }, { k: "Instalments", v: "42" },
         { k: "Rate", v: "13.50 per cent" }, { k: "First falls", v: esc(emid) }], "") +
      finCard("First five instalments", finTable(
        ["No", "Due", { t: "Instalment", num: true }, { t: "Interest", num: true },
         { t: "Principal", num: true }, { t: "Balance", num: true }], sched), { flush: true }),
      { tab: 3,
        dialog: finDialog("Set first instalment date",
          '<div class="fin-grid2">' +
            finField("Disbursal value date", "Today") +
            finField("Mandate registration", "Up to 3 working days") +
            finField("First instalment", esc(emid)) +
            finField("Clear days between the two", "At least 12") +
          "</div>" +
          finStrip("Broken period interest from the value date to the first instalment is charged separately and shown on the schedule. It is not folded into instalment one, where nobody sees it.",
            "info"),
          finBtn("Cancel") + finBtn("Set date", "emph")) });
  }

  if (view === "pdd") {
    const owned = finOn(task, /Put an owner and a date/) || finPast(task, /Put an owner and a date/);
    const rows = [
      { c: ["Registration certificate with our hypothecation", owned ? "Operations, Nashik" : "—",
            owned ? "Due 11 Sep 2026" : "—", finStatus(owned ? "Tracked" : "Untracked", owned ? "info" : "err")],
        cls: owned ? "is-new" : "is-alert" },
      { c: ["Retention release on the endorsed certificate", owned ? "Operations, Nashik" : "—",
            owned ? "On receipt" : "—", finStatus(owned ? "Tracked" : "Untracked", owned ? "info" : "err")],
        cls: owned ? "is-new" : "is-alert" },
      ["Insurance renewal with our clause", "Branch, Nashik", "Due 13 Aug 2027", finStatus("Tracked", "info")],
      ["Permit and fitness certificate", "Branch, Nashik", "Due 30 Sep 2026", finStatus("Tracked", "info")],
      ["Executed agreement to the central file", "Operations, Nashik", "Due 21 Aug 2026", finStatus("Tracked", "info")],
    ];
    return finShell("lms",
      finObjHeader("Post-disbursement documents", loan,
        finStatus(owned ? "Every item owned and dated" : "Two items unowned", owned ? "ok" : "err"),
        [{ k: "Items", v: "5" }, { k: "Owned", v: owned ? "5" : "3" },
         { k: "Oldest due", v: "21 Aug 2026" }, { k: "Retention held", v: losRs(LMS_HOLD) }], "") +
      (owned
        ? finStrip("Every item now has a person and a date. An item with neither is not a tracked document, it is a list entry.", "ok", "Owned.")
        : finStrip("Two items came across from the checklist with no owner and no date. Ageing on post-disbursement documents starts exactly here.", "err", "Unowned.")) +
      finCard("Documents", finTable(["Document", "Owner", "Due", "Status"], rows), { flush: true, count: rows.length }),
      { tab: 4 });
  }

  /* verify */
  return finShell("lms",
    finToast("Disbursal of " + losRs(lmsNet()) + " released, " + losRs(LMS_HOLD) +
      " retained, mandate registered and five documents tracked.") +
    finObjHeader("Loan account " + loan, "Ravindra Transport Company", finStatus("Live", "ok"),
      [{ k: "Released", v: losRs(lmsNet()) }, { k: "Retained", v: losRs(LMS_HOLD) },
       { k: "First instalment", v: esc(emid) }, { k: "Documents tracked", v: "5" }],
      finBtn("Print disbursal memo") + finBtn("Open account", "emph")) +
    lmsFlow(task) +
    '<div class="fin-two">' +
      finCard("What was actually done", '<ul class="fin-list">' +
        "<li>Released " + losRs(lmsNet()) + " to the dealer, not the full sanction.</li>" +
        "<li>Retained " + losRs(LMS_HOLD) + " against the one condition that cannot be met before delivery.</li>" +
        "<li>Set the first instalment far enough out that the mandate is live before it is presented.</li>" +
        "<li>Gave every outstanding document a person and a date.</li>" +
        "</ul>") +
      finCard("Account", finMini([
        { k: "Principal outstanding", v: losRs(LMS_SANC) },
        { k: "Instalment", v: losRs(49850) },
        { k: "Retention released on", v: "Endorsed registration certificate" },
        { k: "Classification", v: finStatus("Standard", "ok") },
        { k: "Next review", v: "First instalment presentation" },
      ]), { flush: true }) +
    "</div>",
    { tab: 1 });
}

/* ==================================================================
   COLLECTIONS AND RECOVERY — the run that stops itself
   ------------------------------------------------------------------
   Everything about this account says take the vehicle. It is 148 days
   past due and classified non-performing, the arrears are real, the
   demand notice was served and acknowledged, and the field agency has
   located the vehicle.

   It stops anyway, on two conditions that have nothing to do with how
   far behind the borrower is.

   The first is the one no lending platform can answer: the agreement
   executed on this account in March 2019 was on a template withdrawn
   in November 2020, and the clause that authorises taking possession
   was introduced at that revision. The platform holds the arrears. The
   knowledge base holds which template was in force in March 2019 and
   what it did and did not say.

   The second is that a grievance is open on charges inside the very
   arrears being enforced.

   What follows is not a workaround. Recovery on the disputed amount is
   suspended, the agreement defect goes to Legal, and every account of
   the same vintage in the bucket is flagged — because a template
   defect is never one account.
   ================================================================== */

const COL_ACCT  = "LN-CV-2019-0044821";
const COL_ASSET = "2019 Ashok Leyland 1920 truck";
const COL_GRV   = "GRV-2026-04412";

function colArrears() {
  const raw = finP("arrears", FIN_FALLBACK.arrears).replace(/[^\d.]/g, "");
  const n = Number(raw);
  return isFinite(n) && n > 0 ? n : 286400;
}

function colGateRows() {
  return [
    { pass: true, t: "The account is classified non-performing and the arrears exceed the threshold",
      d: "148 days past due, " + losRs(colArrears()) + " across five instalments.",
      cite: "Recovery policy, arrears thresholds" },
    { pass: true, t: "A demand notice has been served and acknowledged",
      d: "Served 12 July 2026 by registered post with acknowledgement due; acknowledgement on file 16 July 2026.",
      cite: "Recovery policy, notice before enforcement" },
    { pass: false, t: "The executed agreement carries the possession clause",
      d: "The agreement on this account was executed on 14 March 2019 on template v3.2. The possession clause was introduced at v4.0 in November 2020. The template actually executed here does not carry it.",
      cite: "Possession is not taken on any facility whose executed agreement does not carry the clause, whatever the arrears position. This goes to Legal." },
    { pass: false, t: "No grievance or dispute is open on the amounts in arrears",
      d: COL_GRV + " has been open since 22 June 2026 on bounce charges of ₹4,720 that are inside the arrears being enforced.",
      cite: "Recovery steps on the disputed arrears are suspended until it is resolved." },
  ];
}

function finCollections(view, task) {
  const acct    = finP("account", FIN_FALLBACK.account);
  const vehicle = finP("vehicle", FIN_FALLBACK.vehicle);

  if (view === "home") {
    const rows = [
      ["0 dpd, watch", "1,842", "₹214.6 cr", "Tele-calling", finStatus("On plan", "ok")],
      ["1 to 30 dpd", "914", "₹96.2 cr", "Tele-calling and field", finStatus("On plan", "ok")],
      ["31 to 60 dpd", "388", "₹41.8 cr", "Field", finStatus("Behind", "warn")],
      ["61 to 90 dpd", "196", "₹22.4 cr", "Field and legal notice", finStatus("Behind", "warn")],
      { c: ["Above 90 dpd, non-performing", "281", "₹34.1 cr", "Legal and enforcement", finStatus("This bucket", "err")],
        cls: "is-alert", pick: "account", val: acct },
    ];
    return finShell("collections",
      finKpis([
        { l: "Accounts in arrears", v: "3,621" },
        { l: "Non-performing", v: "281", cls: "is-err" },
        { l: "Enforcement requests open", v: "34" },
        { l: "Grievances open in the book", v: "18", cls: "is-warn" },
        { l: "Recovered this month", v: "₹8.9 cr", cls: "is-ok" },
      ]) +
      finCard("Arrears buckets", finTable(
        ["Bucket", "Accounts", "Outstanding", "Strategy", "Status"], rows, { act: true }),
        { flush: true, count: rows.length }),
      { tab: 0 });
  }

  if (view === "account") {
    return finShell("collections",
      finObjHeader("Account " + acct, "Sameer Qadri Transport",
        finStatus("Non-performing, 148 days", "err"),
        [{ k: "Product", v: "Used commercial vehicle" }, { k: "Outstanding", v: losRs(412600) },
         { k: "Arrears", v: losRs(colArrears()) }, { k: "Branch", v: "Nagpur" }],
        finBtn("Allocate to field") + finBtn("Enforcement", "emph")) +
      finFlow([
        { k: "Allocation", v: "Field agency", state: "done" },
        { k: "Contact", v: "Made 04 Aug", state: "done" },
        { k: "Notice", v: "Served 12 Jul", state: "done" },
        { k: "Authorisation", v: "Being checked", state: "now" },
        { k: "Possession", v: "—", state: "" },
      ]) +
      '<div class="fin-two">' +
        finCard("Account", finMini([
          { k: "Borrower", v: "Sameer Qadri Transport, proprietorship" },
          { k: "Disbursed", v: "March 2019" },
          { k: "Agreement executed", v: "14 March 2019" },
          { k: "Agreement template", v: "v3.2" },
          { k: "Security", v: esc(COL_ASSET) },
          { k: "Registration", v: esc(vehicle) },
          { k: "Classification", v: finStatus("Non-performing", "err"), neg: true },
        ]), { flush: true }) +
        finCard("Open items on this account", finTable(
          ["Item", "Since", "Status"], [
            { c: ["Grievance " + COL_GRV + " on bounce charges", "22 Jun 2026", finStatus("Open", "err")], cls: "is-alert" },
            ["Field visit report", "04 Aug 2026", finStatus("Vehicle located, plying", "info")],
            ["Demand notice", "12 Jul 2026", finStatus("Served and acknowledged", "ok")],
            ["Settlement enquiry from the borrower", "09 Aug 2026", finStatus("Awaiting our response", "warn")],
          ]), { flush: true }) +
      "</div>",
      { tab: 1 });
  }

  if (view === "history" || view === "notice") {
    const rows = [
      { c: ["Mar 2026", losRs(18420), losRs(18420), "Cleared", finStatus("Paid", "ok")] },
      { c: ["Apr 2026", losRs(18420), losRs(18420), "Cleared", finStatus("Paid", "ok")] },
      { c: ["May 2026", losRs(18420), losRs(0), "Returned, insufficient funds", finStatus("Bounced", "err")], cls: "is-alert" },
      { c: ["Jun 2026", losRs(18420), losRs(0), "Returned, insufficient funds", finStatus("Bounced", "err")], cls: "is-alert" },
      { c: ["Jul 2026", losRs(18420), losRs(0), "Not presented", finStatus("Unpaid", "err")], cls: "is-alert" },
    ];
    const notices = [
      { c: ["Reminder, 30 days", "Sent 04 Jun 2026", "SMS and letter", finStatus("Delivered", "ok")] },
      { c: ["Reminder, 60 days", "Sent 03 Jul 2026", "Letter", finStatus("Delivered", "ok")] },
      { c: ["Demand notice", "Served 12 Jul 2026", "Registered post with acknowledgement due", finStatus("Acknowledged 16 Jul 2026", "ok")], cls: "is-new" },
      { c: ["Charges disputed by the borrower", "Raised 22 Jun 2026", "Branch, in writing", finStatus("Grievance " + COL_GRV + " open", "err")], cls: "is-alert" },
    ];
    return finShell("collections",
      finObjHeader("Account " + acct, "Sameer Qadri Transport", finStatus("Non-performing, 148 days", "err"),
        [{ k: "Instalment", v: losRs(18420) }, { k: "Unpaid instalments", v: "5" },
         { k: "Bounce charges in arrears", v: losRs(4720) }, { k: "Last receipt", v: "28 Apr 2026" }], "") +
      (view === "notice"
        ? finStrip("The notice limb is clean: served by registered post, acknowledgement on file. It is the only one of the four conditions that is going to be this easy.", "ok", "Served.")
        : "") +
      '<div class="fin-two">' +
        finCard(view === "notice" ? "Notices and correspondence" : "Repayment history",
          view === "notice"
            ? finTable(["Step", "When", "How", "Status"], notices)
            : finTable(["Month", { t: "Due", num: true }, { t: "Received", num: true }, "Presentation", "Status"], rows),
          { flush: true }) +
        finCard("Arrears position", '<div class="fin-grid2">' +
          finField("Unpaid instalments", "5") +
          finField("Days past due", "148") +
          '<div class="fin-f"><label>Arrears as at today</label>' +
            finTypeField(task, "finArrears", "arrears", losRs(colArrears()),
              /Record the arrears position/, "Arrears as at today") + "</div>" +
          finField("Of which disputed", losRs(4720)) +
        "</div>" +
        finStrip("₹4,720 of these arrears are the charges the grievance is about. Enforcing the whole figure enforces the disputed part with it.", "warn")) +
      "</div>",
      { tab: view === "notice" ? 3 : 1 });
  }

  if (view === "request") {
    return finShell("collections",
      finObjHeader("Repossession request", esc(vehicle), finStatus("Authorisation being checked", "warn"),
        [{ k: "Account", v: esc(acct) }, { k: "Vehicle", v: esc(vehicle) },
         { k: "Located", v: "Nagpur, plying" }, { k: "Agency", v: "Empanelled, certificate current" }], "") +
      '<div class="fin-two">' +
        finCard("Request", finMini([
          { k: "Raised by", v: esc(finUser()) },
          { k: "Vehicle", v: esc(vehicle) },
          { k: "Agency", v: "Empanelled, agents carry identity and authorisation" },
          { k: "Proposed yard", v: "Approved yard, Nagpur, insured" },
          { k: "Inventory and photographs", v: "On taking possession" },
        ]), { flush: true }) +
        finCard("What is checked before it is raised", '<ul class="fin-list">' +
          "<li>The classification and the arrears.</li>" +
          "<li>That a demand notice was served and acknowledged.</li>" +
          "<li>That the agreement actually executed on this account authorises possession.</li>" +
          "<li>That nothing is in dispute on the amounts being enforced.</li>" +
          "</ul>") +
      "</div>",
      { tab: 3,
        dialog: finDialog("Check authorisation",
          finStrip("Four conditions, checked against the file that exists rather than against the template in force today.", "info"),
          finBtn("Cancel") + finBtn("Check authorisation", "emph")) });
  }

  if (view === "blocked") {
    return finShell("collections",
      finStrip("Repossession is not authorised on " + vehicle +
        ". Two of the four conditions fail, and neither is about how far behind the borrower is. No request has been raised.",
        "err", "Stopped.") +
      finObjHeader("Repossession request", esc(vehicle), finStatus("Not authorised", "err"),
        [{ k: "Conditions", v: "4" }, { k: "Met", v: "2" }, { k: "Failed", v: "2" },
         { k: "Request raised", v: "No" }], "") +
      finCard("Authorisation", finGate(colGateRows()), { flush: true }) +
      finCard("Where this came from", '<ul class="fin-list">' +
        "<li>The arrears, the classification and the notice are in this system.</li>" +
        "<li>Which agreement template was in force in March 2019, and what it did and did not say, is not. It is in the policy repository, and it is the reason this stopped.</li>" +
        "<li>The grievance is in the service system, on a different reference, against the same account.</li>" +
        "</ul>"),
      { tab: 3 });
  }

  if (view === "hold") {
    return finShell("collections",
      finObjHeader("Holds on " + acct, "Sameer Qadri Transport", finStatus("Being applied", "warn"),
        [{ k: "Disputed amount", v: losRs(4720) }, { k: "Grievance", v: COL_GRV },
         { k: "Open since", v: "22 Jun 2026" }, { k: "Undisputed arrears", v: losRs(colArrears() - 4720) }], "") +
      finCard("Holds", finTable(["Hold", "Applies to", "Until", "Status"], [
        { c: ["Recovery suspended on the disputed charges", losRs(4720), "The grievance is resolved", finStatus("Being applied", "warn")], cls: "is-warn" },
        { c: ["Enforcement suspended", "The whole account", "Legal reverts on the agreement", finStatus("Being applied", "warn")], cls: "is-warn" },
        ["Ordinary follow-up on the undisputed arrears", losRs(colArrears() - 4720), "Continues", finStatus("Not suspended", "ok")],
      ]), { flush: true }),
      { tab: 2,
        dialog: finDialog("Suspend recovery on the disputed charges",
          '<div class="fin-grid2">' +
            finField("Grievance", COL_GRV) +
            finField("Disputed", losRs(4720)) +
            finField("Suspended until", "The grievance is resolved") +
            finField("Undisputed arrears", losRs(colArrears() - 4720)) +
          "</div>" +
          finStrip("Following up the undisputed arrears is not suspended. Suspending everything would be as wrong as enforcing everything, and it is the borrower who loses either way.",
            "info", "Only the disputed part."),
          finBtn("Cancel") + finBtn("Suspend recovery", "emph")) });
  }

  if (view === "legal") {
    const flagged = finOn(task, /Flag the same vintage/) || finPast(task, /Flag the same vintage/);
    const vintage = [
      { c: ["LN-CV-2019-0044713", "Feb 2019", "v3.2", "Non-performing", finStatus(flagged ? "Flagged" : "Not checked", flagged ? "warn" : "none")], cls: flagged ? "is-warn" : "" },
      { c: [esc(acct), "Mar 2019", "v3.2", "Non-performing", finStatus("Stopped today", "err")], cls: "is-alert" },
      { c: ["LN-CV-2019-0045102", "Apr 2019", "v3.2", "61 to 90 days", finStatus(flagged ? "Flagged" : "Not checked", flagged ? "warn" : "none")], cls: flagged ? "is-warn" : "" },
      { c: ["LN-CV-2019-0045688", "Jun 2019", "v3.2", "Non-performing", finStatus(flagged ? "Flagged" : "Not checked", flagged ? "warn" : "none")], cls: flagged ? "is-warn" : "" },
      { c: ["LN-CV-2021-0061204", "Mar 2021", "v4.0", "Non-performing", finStatus("Clause present", "ok")] },
    ];
    return finShell("collections",
      finObjHeader("Legal referral", acct, finStatus(flagged ? "Referred, vintage flagged" : "Being referred", flagged ? "info" : "warn"),
        [{ k: "Defect", v: "Executed template does not carry the possession clause" },
         { k: "Template", v: "v3.2, withdrawn Nov 2020" },
         { k: "Accounts of the same vintage in this bucket", v: "4" },
         { k: "Referred to", v: "Legal and Recovery" }], "") +
      (flagged
        ? finStrip("A template defect is never one account. Every non-performing account in this bucket executed on v3.2 is flagged for the same check before any enforcement step is taken on it.",
            "warn", "Not one account.")
        : finStrip("This goes to Legal as a defect in the executed agreement, not as a question about this borrower.", "info")) +
      finCard("Accounts on the withdrawn template", finTable(
        ["Account", "Executed", "Template", "Position", "Status"], vintage), { flush: true, count: vintage.length }),
      { tab: 3,
        dialog: finOn(task, /Refer the agreement defect/)
          ? finDialog("Refer to Legal",
              '<div class="fin-grid2">' +
                finField("Account", esc(acct)) +
                finField("Defect", "Possession clause absent from the executed agreement") +
                finField("Template executed", "v3.2, 14 March 2019") +
                finField("Clause introduced at", "v4.0, November 2020") +
              "</div>" +
              finStrip("Legal is asked what can be done on an agreement that does not carry the clause, not asked to approve taking the vehicle anyway.",
                "info", "The question being asked."),
              finBtn("Cancel") + finBtn("Refer to Legal", "emph"))
          : "" });
  }

  /* verify — and deliberately not a success screen */
  return finShell("collections",
    finStrip("No repossession request was raised on " + vehicle +
      ". Recovery on the disputed charges is suspended, the agreement defect is with Legal, and three more accounts on the same template are flagged.",
      "warn", "What actually happened.") +
    finObjHeader("Account " + acct, "Sameer Qadri Transport", finStatus("Enforcement suspended", "warn"),
      [{ k: "Repossession raised", v: "No" }, { k: "Recovery suspended on", v: losRs(4720) },
       { k: "With Legal", v: "Agreement defect" }, { k: "Accounts flagged", v: "3" }],
      finBtn("Print the file note") + finBtn("Open grievance " + COL_GRV, "emph")) +
    '<div class="fin-two">' +
      finCard("What was done", finTable(["Action", "Status"], [
        ["Arrears position recorded", finStatus("Done", "ok")],
        ["Demand notice confirmed served", finStatus("Done", "ok")],
        { c: ["Repossession request", finStatus("Not raised, not authorised", "err")], cls: "is-alert" },
        { c: ["Recovery on the disputed charges", finStatus("Suspended", "warn")], cls: "is-warn" },
        ["Agreement defect", finStatus("Referred to Legal", "info")],
        ["Same-vintage accounts", finStatus("3 flagged", "warn")],
      ]), { flush: true }) +
      finCard("What happens next", '<ul class="fin-list">' +
        "<li>The grievance is answered on its own merits, and quickly, because it is now holding up an account.</li>" +
        "<li>Legal says what can be enforced on an agreement executed before November 2020.</li>" +
        "<li>Ordinary follow-up on the undisputed arrears continues. Nothing about this stops us asking to be paid.</li>" +
        "<li>The three flagged accounts are checked before any enforcement step is taken on them.</li>" +
        "</ul>") +
    "</div>",
    { tab: 4 });
}

/* ==================================================================
   CO-LENDING
   ------------------------------------------------------------------
   Two lenders, one borrower, one set of receipts, two systems that
   will not agree by themselves. The breaks worked here are the two
   that recur in every arrangement: interest apportioned on different
   day counts, and receipts dated on collection by one side and on
   clearance by the other across a month end.
   ================================================================== */

const CLM_REF = "CLM-2023-07";

function finColending(view, task) {
  const partner = finP("partner", FIN_FALLBACK.partner);
  const file    = finP("file", FIN_FALLBACK.file);
  const month   = finP("month", FIN_FALLBACK.month);

  if (view === "home") {
    const rows = [
      { c: [CLM_REF, esc(partner), "80 : 20", "4,182", "₹1,284.6 cr", finStatus("Due for settlement", "warn")],
        cls: "is-sel", pick: "partner", val: partner },
      { c: ["CLM-2024-02", "Sahyadri Cooperative Bank", "75 : 25", "1,106", "₹214.8 cr", finStatus("Settled", "ok")] },
      { c: ["CLM-2025-11", "Meghdoot Small Finance Bank", "80 : 20", "638", "₹96.4 cr", finStatus("Settled", "ok")] },
    ];
    return finShell("colending",
      finKpis([
        { l: "Arrangements", v: "3" },
        { l: "Accounts in the pools", v: "5,926" },
        { l: "Our share outstanding", v: "₹319.2 cr" },
        { l: "Due for settlement", v: "1", cls: "is-warn" },
        { l: "Breaks last month", v: "9" },
      ]) +
      finCard("Co-lending arrangements", finTable(
        ["Reference", "Partner", "Share", "Accounts", "Pool", "Status"], rows, { act: true }),
        { flush: true, count: rows.length }),
      { tab: 0 });
  }

  if (view === "pool") {
    return finShell("colending",
      finObjHeader("Arrangement " + CLM_REF, esc(partner), finStatus("Due for settlement", "warn"),
        [{ k: "Share", v: "80 partner : 20 us" }, { k: "Accounts", v: "4,182" },
         { k: "Pool", v: "₹1,284.6 cr" }, { k: "Settlement", v: "Monthly, by the 10th" }],
        finBtn("Open pool") + finBtn("Reconcile", "emph")) +
      '<div class="fin-two">' +
        finCard("Pool composition", finTable(
          ["Product", "Accounts", { t: "Pool", num: true }, { t: "Our share", num: true }], [
            ["Used commercial vehicle", "1,914", "₹584.2 cr", "₹116.8 cr"],
            ["Business loan", "1,286", "₹381.4 cr", "₹76.3 cr"],
            ["Loan against property", "642", "₹248.6 cr", "₹49.7 cr"],
            ["Two wheeler", "340", "₹70.4 cr", "₹14.1 cr"],
          ]), { flush: true }) +
        finCard("How this arrangement works", finMini([
          { k: "Sourcing and servicing", v: "Us" },
          { k: "Share of each loan", v: "80 partner, 20 us" },
          { k: "Interest apportionment", v: "Actual by 365, per the arrangement" },
          { k: "Receipt dating", v: "On clearance, per the arrangement" },
          { k: "Escrow", v: "Collections into escrow, swept on settlement" },
          { k: "Last settled", v: "10 July 2026" },
        ]), { flush: true }) +
      "</div>",
      { tab: 1 });
  }

  if (view === "load" || view === "match") {
    const running = finOn(task, /Run the reconciliation/);
    const done = finPast(task, /Run the reconciliation/);
    return finShell("colending",
      finObjHeader("Reconciliation " + CLM_REF, esc(month),
        finStatus(done ? "Complete, 14 unmatched" : running ? "Running" : "Being loaded",
                  done ? "warn" : running ? "info" : "none"),
        [{ k: "Partner", v: esc(partner) }, { k: "Period", v: esc(month) },
         { k: "Our records", v: "4,182" }, { k: "Partner records", v: "4,180" }], "") +
      (done
        ? finKpis([
            { l: "Records compared", v: "4,182" },
            { l: "Matched", v: "4,168", cls: "is-ok" },
            { l: "Unmatched", v: "14", cls: "is-warn" },
            { l: "Value in question", v: "₹2,82,592", cls: "is-warn" },
            { l: "Net before breaks", v: "₹1,42,86,540" },
          ])
        : "") +
      '<div class="fin-two">' +
        finCard("Partner file", '<div class="fin-grid2">' +
          finField("Partner", esc(partner)) +
          finField("Period", esc(month)) +
          '<div class="fin-f"><label>File reference</label>' +
            finTypeField(task, "finFile", "file", file,
              /Enter the partner file reference/, "Partner file reference") + "</div>" +
          finField("Records", done || running ? "4,180" : "") +
        "</div>" +
        (done ? finStrip("Two accounts in our pool are absent from the partner file, and twelve differ on a figure. Neither is a system fault, and both recur every month.", "warn") : "")) +
        finCard("Reconciliation basis", finMini([
          { k: "Matched on", v: "Loan reference and instalment number" },
          { k: "Interest basis, ours", v: "Actual by 360" },
          { k: "Interest basis, the arrangement", v: "Actual by 365" },
          { k: "Receipt dating, ours", v: "On collection" },
          { k: "Receipt dating, the arrangement", v: "On clearance" },
          { k: "Tolerance", v: "₹1 per record" },
        ]), { flush: true }) +
      "</div>",
      { tab: 2 });
  }

  if (view === "breaks") {
    const rows = [
      { c: ["Interest apportioned on a different day count", "9", "₹18,412", "Basis", finStatus("Open", "err")], cls: "is-alert" },
      { c: ["Receipt dated on collection, not on clearance", "3", "₹2,64,180", "Timing", finStatus("Open", "err")], cls: "is-alert" },
      ["Account closed by the borrower after the partner cut-off", "2", "₹0", "Timing", finStatus("Explained", "ok")],
    ];
    return finShell("colending",
      finObjHeader("Unmatched items", esc(month), finStatus("14 items, two causes", "warn"),
        [{ k: "Items", v: "14" }, { k: "Causes", v: "3" },
         { k: "Value in question", v: "₹2,82,592" }, { k: "Recurring", v: "Both of the two that matter" }], "") +
      finStrip("Fourteen items, and only two things actually causing them. Working the causes settles the month; working the fourteen settles this month and none of the next ones.",
        "info", "Work the cause.") +
      finCard("Unmatched, grouped by cause", finTable(
        ["Cause", "Items", { t: "Value", num: true }, "Type", "Status"], rows), { flush: true, count: rows.length }),
      { tab: 2 });
  }

  if (view === "resolve") {
    const onDating = finOn(task, /Work the receipt dating break/) || finPast(task, /Work the receipt dating break/);
    const rows = [
      { c: ["Interest apportioned on a different day count", "9", "₹18,412",
            finStatus(onDating ? "Resolved, partner basis applied" : "Being worked", onDating ? "ok" : "warn")],
        cls: onDating ? "is-new" : "is-warn" },
      { c: ["Receipt dated on collection, not on clearance", "3", "₹2,64,180",
            finStatus(onDating ? "Being worked" : "Queued", onDating ? "warn" : "none")],
        cls: onDating ? "is-warn" : "" },
      ["Account closed after the partner cut-off", "2", "₹0", finStatus("Explained, no adjustment", "ok")],
    ];
    return finShell("colending",
      finObjHeader("Reconciliation items", esc(month), finStatus("Being worked", "info"),
        [{ k: "Worked", v: onDating ? "1 of 2" : "0 of 2" },
         { k: "Adjustment so far", v: onDating ? "₹18,412" : "₹0" },
         { k: "Basis", v: "Per the arrangement, not per either system" },
         { k: "Approver", v: "Head of Co-lending" }], "") +
      finCard("Items", finTable(["Cause", "Items", { t: "Value", num: true }, "Status"], rows), { flush: true }),
      { tab: 2,
        dialog: onDating && finOn(task, /Work the receipt dating break/)
          ? finDialog("Move the receipts to the clearance month",
              '<div class="fin-grid2">' +
                finField("Items", "3") +
                finField("Value", "₹2,64,180") +
                finField("Our dating", "On collection, 30 and 31 July") +
                finField("The arrangement", "On clearance, 01 and 04 August") +
              "</div>" +
              finStrip("These receipts are ours in July and theirs in August only because the two systems date them differently. The arrangement says clearance, so they move to August and the July settlement is smaller by that amount.",
                "info", "The arrangement decides, not either system."),
              finBtn("Cancel") + finBtn("Move to the clearance month", "emph"))
          : finOn(task, /Work the apportionment break/)
          ? finDialog("Apply the arrangement basis",
              '<div class="fin-grid2">' +
                finField("Items", "9") +
                finField("Difference", "₹18,412") +
                finField("Our basis", "Actual by 360") +
                finField("The arrangement", "Actual by 365") +
              "</div>" +
              finStrip("Our servicing system apportions on 360 and the arrangement says 365. The arrangement wins, and the standing difference goes to the platform team so next month is nine items smaller.",
                "info", "Fix it here and upstream."),
              finBtn("Cancel") + finBtn("Apply the arrangement basis", "emph"))
          : "" });
  }

  if (view === "settle") {
    return finShell("colending",
      finObjHeader("Settlement advice", esc(month), finStatus("Being raised", "info"),
        [{ k: "Partner", v: esc(partner) }, { k: "Period", v: esc(month) },
         { k: "Direction", v: "Payable to the partner" }, { k: "Due", v: "By the 10th" }], "") +
      '<div class="fin-two">' +
        finCard("Settlement", finTable(["Line", { t: "Amount", num: true }], [
          ["Collections in the escrow account", "₹1,84,20,416"],
          ["Partner share of principal and interest", "₹1,45,68,540"],
          ["Less: interest apportionment adjustment", "−₹18,412"],
          ["Less: receipts moved to the clearance month", "−₹2,64,180"],
          ["Add: servicing fee due to us", "−₹1,72,140"],
          { c: ["Net payable to the partner", "₹1,41,13,808"], cls: "is-new" },
        ]), { flush: true }) +
        finCard("On the advice", finMini([
          { k: "Reference", v: "STL-" + CLM_REF + "-2026-07" },
          { k: "Basis", v: "The arrangement, both adjustments shown" },
          { k: "Supporting file", v: esc(file) },
          { k: "Approved by", v: "Head of Co-lending" },
          { k: "To be paid", v: "By the 10th" },
        ]), { flush: true }) +
      "</div>",
      { tab: 3,
        dialog: finDialog("Raise settlement advice",
          finStrip("Both adjustments are shown on the advice as separate lines with their reason. A net figure with the workings taken out of it is the thing the partner queries every month.",
            "info", "Show the adjustments."),
          finBtn("Cancel") + finBtn("Raise settlement advice", "emph")) });
  }

  /* verify */
  return finShell("colending",
    finToast("Settlement advice STL-" + CLM_REF + "-2026-07 raised for ₹1,41,13,808, both adjustments itemised.") +
    finObjHeader("Settlement " + CLM_REF, esc(month), finStatus("Raised", "ok"),
      [{ k: "Net payable", v: "₹1,41,13,808" }, { k: "Adjustments", v: "2, itemised" },
       { k: "Unmatched remaining", v: "0" }, { k: "Due", v: "By the 10th" }],
      finBtn("Print advice") + finBtn("Send to the partner", "emph")) +
    '<div class="fin-two">' +
      finCard("What was settled", finTable(["Cause", "Items", "Outcome"], [
        ["Interest apportioned on a different day count", "9", "Arrangement basis applied, ₹18,412"],
        ["Receipt dated on collection, not on clearance", "3", "Moved to August, ₹2,64,180"],
        ["Account closed after the partner cut-off", "2", "Explained, no adjustment"],
        { c: ["Standing difference raised with the platform team", "—", "Day count basis on the servicing system"], cls: "is-new" },
      ]), { flush: true }) +
      finCard("Why next month is smaller", '<ul class="fin-list">' +
        "<li>Nine of the fourteen items were one configuration line in our own servicing system.</li>" +
        "<li>That has gone to the platform team as a change, not into next month's reconciliation as a habit.</li>" +
        "<li>The receipt dating difference is inherent to the two systems and will recur; it is netted every month and shown, not hidden.</li>" +
        "</ul>") +
    "</div>",
    { tab: 3 });
}

/* ==================================================================
   CKYCR — the Central KYC Records Registry
   ------------------------------------------------------------------
   The run searches before it asks the customer for anything, which is
   the point of a central registry and the part most often skipped. The
   record it finds is seven years old and carries an address the
   customer moved out of, so what is uploaded is an update against the
   same identifier rather than a second record for the same person.

   A duplicate record is not a filing error that gets tidied up later.
   It is a person who now exists twice in the national registry, and
   every lender who searches them after that gets half the picture.
   ================================================================== */

const CKY_KIN   = "5049 2817 3306 22";
const CKY_TITLE = "Central KYC Records Registry";

function finCkycr(view, task) {
  const customer = finP("customer", FIN_FALLBACK.customer);
  const idtype   = finP("idtype", FIN_FALLBACK.idtype);

  if (view === "home") {
    return finShell("ckycr",
      finKpis([
        { l: "Searches this month", v: "18,204" },
        { l: "Records downloaded", v: "11,486" },
        { l: "Records uploaded", v: "6,318" },
        { l: "Uploads rejected", v: "27", cls: "is-warn" },
        { l: "Possible duplicates flagged", v: "4", cls: "is-err" },
      ]) +
      finStrip("A search comes before a document request, not after it. A customer who is already on the registry should not be asked for identification a second time.",
        "info", "Search first.") +
      '<div class="fin-two">' +
        finCard("Recent activity", finTable(["Activity", "Reference", "By", "Status"], [
          ["Batch upload", "UPL-2026-08-0441", "Compliance Gateway", finStatus("Accepted, 1,204 records", "ok")],
          ["Batch upload", "UPL-2026-08-0440", "Compliance Gateway", finStatus("Accepted with 3 warnings", "warn")],
          ["Download", "DWN-2026-08-2216", "Operations, Pune", finStatus("Complete", "ok")],
          ["Batch upload", "UPL-2026-08-0438", "Compliance Gateway", finStatus("2 records rejected, image size", "err")],
        ]), { flush: true }) +
        finCard("Reporting entity", finMini([
          { k: "Entity", v: esc(finOrgFull()) },
          { k: "Category", v: "Non-banking financial company" },
          { k: "Registration", v: "RE-NBFC-0000418" },
          { k: "Authorised users", v: "34" },
          { k: "Last upload", v: "Today, 09:12" },
        ]), { flush: true }) +
      "</div>",
      { tab: 0, appTitle: CKY_TITLE, crumb: "Home" });
  }

  if (view === "search" || view === "results") {
    const done = view === "results";
    const hits = [
      { c: [CKY_KIN, esc(customer), "Individual", "Nashik, MH", "11 Feb 2019", finStatus("Active", "ok")],
        cls: "is-sel", pick: "customer", val: customer },
    ];
    return finShell("ckycr",
      finCard("Search the registry", '<div class="fin-grid2">' +
        '<div class="fin-f"><label>Name as recorded</label>' +
          finTypeField(task, "finSearch", "customer", customer,
            /Enter the customer to search for/, "Name as recorded") + "</div>" +
        finField("Identifier type", esc(idtype)) +
        finField("Identifier", done ? "Masked, verified on entry" : "") +
        finField("Date of birth", done ? "Masked, verified on entry" : "") +
      "</div>" +
      finStrip("The identifier is masked on this screen and in the log. A search screen that shows a full identification number in plain text is a screen somebody will photograph.",
        "info", "Masked by design."),
        { act: finBtn("Clear") + finBtn("Search", "emph") }) +
      (done
        ? finCard("Search result", finTable(
            ["KIN", "Name", "Type", "Place", "Record date", "Status"], hits),
            { flush: true, count: 1, foot: "One record. A second record for the same person is what the search exists to prevent." })
        : finCard("Search result", '<div class="fin-empty">Enter the details above and search.</div>', { flush: true })),
      { tab: 1, appTitle: CKY_TITLE, crumb: "Search" });
  }

  if (view === "record") {
    return finShell("ckycr",
      finObjHeader("KIN " + CKY_KIN, customer, finStatus("Active", "ok"),
        [{ k: "Record date", v: "11 Feb 2019" }, { k: "Uploaded by", v: "Another reporting entity" },
         { k: "Last updated", v: "Never" }, { k: "Type", v: "Individual" }],
        finBtn("Print") + finBtn("Download record", "emph")) +
      finCard("Record on the registry", finMini([
        { k: "Name", v: esc(customer) },
        { k: "Constitution", v: "Individual" },
        { k: "Address on record", v: "Plot 14, Ambad, Nashik 422010" },
        { k: "Mobile on record", v: "Masked, ends 4471" },
        { k: "Identification", v: esc(idtype) + ", verified" },
        { k: "Photograph", v: "On record, dated 2019" },
        { k: "Related persons", v: "None recorded" },
      ]), { flush: true }),
      { tab: 2, appTitle: CKY_TITLE, crumb: "Download" });
  }

  if (view === "compare") {
    return finShell("ckycr",
      finObjHeader("Compare", customer, finStatus("Three differences", "warn"),
        [{ k: "Registry record", v: "11 Feb 2019" }, { k: "File on hand", v: "04 Aug 2026" },
         { k: "Differences", v: "3" }, { k: "Action", v: "Update, not a new record" }], "") +
      finStrip("The registry record is seven years old and the address on it is one the customer left. That makes this an update against the same identifier. Uploading it as a new record would create a second person on the national registry who is the same person.",
        "warn", "Update, not new.") +
      finCard("What differs", '<div class="fin-diff">' +
        '<div class="fin-diff__col is-bad"><h5>On the registry, 11 Feb 2019</h5><ul>' +
          "<li>Plot 14, Ambad, Nashik 422010</li>" +
          "<li>Mobile ending 4471</li>" +
          "<li>Photograph dated 2019</li>" +
          "<li>No related persons recorded</li>" +
        "</ul></div>" +
        '<div class="fin-diff__col is-good"><h5>On our file, verified 04 Aug 2026</h5><ul>' +
          "<li>Survey 22/4, Pathardi Phata, Nashik 422010, proof dated Jul 2026</li>" +
          "<li>Mobile ending 8802, verified by one time password</li>" +
          "<li>Photograph taken at the branch, Aug 2026</li>" +
          "<li>Spouse recorded as guarantor on the facility</li>" +
        "</ul></div>" +
      "</div>", { }) +
      finCard("What we do not touch", '<ul class="fin-list">' +
        "<li>The identifier itself. It is the same person and the same number.</li>" +
        "<li>The KIN. Updating a record keeps it; creating one throws it away.</li>" +
        "<li>The 2019 record date. The registry keeps the history, and so should we.</li>" +
        "</ul>"),
      { tab: 2, appTitle: CKY_TITLE, crumb: "Download" });
  }

  if (view === "prepare" || view === "upload") {
    const uploading = view === "upload";
    return finShell("ckycr",
      finObjHeader(uploading ? "Batch UPL-2026-08-0442" : "Prepare update", customer,
        finStatus(uploading ? "Being uploaded" : "Being prepared", "info"),
        [{ k: "Record type", v: "Update" }, { k: "KIN", v: CKY_KIN },
         { k: "Fields changed", v: "3" }, { k: "Records in batch", v: uploading ? "1" : "—" }], "") +
      finCard("Record being filed", finTable(["Field", "On the registry", "Being filed", "Action"], [
        { c: ["Record type", "Existing", "Update", finStatus("U", "info")], cls: "is-new" },
        ["KIN", CKY_KIN, CKY_KIN, finStatus("Unchanged", "none")],
        { c: ["Address", "Plot 14, Ambad, Nashik", "Survey 22/4, Pathardi Phata, Nashik", finStatus("Changed", "warn")], cls: "is-warn" },
        { c: ["Mobile", "Ends 4471", "Ends 8802", finStatus("Changed", "warn")], cls: "is-warn" },
        { c: ["Photograph", "2019", "Aug 2026", finStatus("Changed", "warn")], cls: "is-warn" },
        ["Identification", esc(idtype), esc(idtype), finStatus("Unchanged", "none")],
      ]), { flush: true }),
      { tab: 3, appTitle: CKY_TITLE, crumb: "Upload",
        dialog: uploading
          ? finDialog("Upload batch",
              '<div class="fin-grid2">' +
                finField("Batch", "UPL-2026-08-0442") +
                finField("Records", "1") +
                finField("Type", "Update") +
                finField("Submitted by", esc(finUser())) +
              "</div>" +
              finStrip("One record, and it is an update. The acknowledgement is taken onto the loan file, because the file has to show the registry was searched and filed, not that somebody meant to.", "info"),
              finBtn("Cancel") + finBtn("Upload batch", "emph"))
          : finDialog("Prepare update",
              finStrip("Filed as an update against " + CKY_KIN + ". Filing it as a new record would create a duplicate, and a duplicate on the national registry is not ours to clean up afterwards.",
                "warn", "Type U, not N."),
              finBtn("Cancel") + finBtn("Prepare update", "emph")) });
  }

  /* verify */
  return finShell("ckycr",
    finAck("Upload accepted", [
      { k: "Acknowledgement", v: "ACK-CKYC-2026-08-0442-001", wide: true, s: "Taken onto the loan file" },
      { k: "KIN", v: CKY_KIN },
      { k: "Record type", v: "Update" },
      { k: "Records accepted", v: "1" },
      { k: "Records rejected", v: "0" },
      { k: "Filed by", v: esc(finOrgFull()) },
      { k: "Filed at", v: "Today" },
    ]) +
    '<div style="height:12px"></div>' +
    '<div class="fin-two">' +
      finCard("What this run avoided", '<ul class="fin-list">' +
        "<li>Asking the customer for identification they had already given somebody else.</li>" +
        "<li>Creating a second record for a person who was already on the registry.</li>" +
        "<li>Leaving a seven year old address on the national record while holding a current one on our own file.</li>" +
        "</ul>") +
      finCard("On the loan file now", finTable(["Item", "Reference"], [
        ["Registry searched", "Today"],
        ["Record downloaded", CKY_KIN],
        ["Update filed", "UPL-2026-08-0442"],
        { c: ["Acknowledgement", "ACK-CKYC-2026-08-0442-001"], cls: "is-new" },
      ]), { flush: true }) +
    "</div>",
    { tab: 3, appTitle: CKY_TITLE, crumb: "Upload" });
}

/* ==================================================================
   CERSAI — the central register of security interests
   ------------------------------------------------------------------
   The search is the whole value of this run. A charge found before
   money moves is a conversation; the same charge found afterwards is a
   loss, and it is found by whoever searches next rather than by us.
   ================================================================== */

const CER_TITLE = "Security Interest Registration";
const CER_LOAN  = "LN-LAP-2026-0033157";

function cerCharge() {
  const raw = finP("charge", FIN_FALLBACK.charge).replace(/[^\d.]/g, "");
  const n = Number(raw);
  return isFinite(n) && n > 0 ? n : 6200000;
}

function finCersai(view, task) {
  const asset = finP("asset", FIN_FALLBACK.asset);

  if (view === "home") {
    return finShell("cersai",
      finKpis([
        { l: "Filings this month", v: "1,284" },
        { l: "Searches this month", v: "2,916" },
        { l: "Awaiting filing", v: "11", cls: "is-warn" },
        { l: "Beyond thirty days", v: "0", cls: "is-ok" },
        { l: "Satisfactions filed", v: "308" },
      ]) +
      finStrip("Registration is due within thirty days of the security interest being created. Nothing here is beyond that, and the number that matters is the one that stays at nought.",
        "ok", "Inside the window.") +
      '<div class="fin-two">' +
        finCard("Awaiting filing", finTable(["Loan", "Borrower", "Security", "Created", "Days"], [
          { c: [CER_LOAN, "Anjali Deshmukh", "Immovable property, Pune", "14 Aug 2026", "3"], cls: "is-sel" },
          ["LN-LAP-2026-0033102", "Farhan Qureshi", "Immovable property, Thane", "12 Aug 2026", "5"],
          ["LN-LAP-2026-0032988", "Sridevi Iyer", "Immovable property, Chennai", "09 Aug 2026", "8"],
        ]), { flush: true }) +
        finCard("Reporting entity", finMini([
          { k: "Entity", v: esc(finOrgFull()) },
          { k: "Category", v: "Non-banking financial company" },
          { k: "Registration", v: "CE-NBFC-0018842" },
          { k: "Authorised users", v: "12" },
          { k: "Last filing", v: "Yesterday, 17:41" },
        ]), { flush: true }) +
      "</div>",
      { tab: 0, appTitle: CER_TITLE, crumb: "Home" });
  }

  if (view === "search" || view === "existing") {
    const done = view === "existing";
    return finShell("cersai",
      finCard("Search by property", '<div class="fin-grid2">' +
        '<div class="fin-f"><label>Property description</label>' +
          finTypeField(task, "finAsset", "asset", asset,
            /Enter the property to search/, "Property description") + "</div>" +
        finField("Type of security interest", "Immovable property") +
        finField("State", done ? "Maharashtra" : "") +
        finField("District", done ? "Pune" : "") +
      "</div>", { act: finBtn("Clear") + finBtn("Search", "emph") }) +
      (done
        ? finCard("Charges on record", finTable(
            ["Filing", "Secured creditor", "Type", "Created", "Amount", "Status"], [
              { c: ["SI-2016-1140882", "A scheduled commercial bank", "Immovable property", "22 Mar 2016", "₹34,00,000",
                    finStatus("Satisfied, 08 Feb 2021", "ok")], cls: "is-new" },
            ]), { flush: true, count: 1,
              foot: "One historic charge, satisfied in 2021. Nothing subsisting on this property." })
        : finCard("Charges on record", '<div class="fin-empty">Enter the property and search.</div>', { flush: true })) +
      (done
        ? finStrip("This is the search that has to happen before the money moves. The same search a week later is not diligence, it is a discovery.",
            "info", "Before, not after.")
        : ""),
      { tab: 1, appTitle: CER_TITLE, crumb: "Search" });
  }

  if (view === "form" || view === "security" || view === "borrower") {
    const stage = view === "security" ? 1 : view === "borrower" ? 2 : 0;
    return finShell("cersai",
      finObjHeader("Particulars of charge", CER_LOAN, finStatus("Being filed", "info"),
        [{ k: "Type", v: "Creation of security interest" }, { k: "Security", v: "Immovable property" },
         { k: "Created", v: "14 Aug 2026" }, { k: "Day", v: "3 of 30" }],
        finBtn("Save draft") + finBtn("Continue", "emph")) +
      finFlow([
        { k: "Step 1", v: "Filing type", state: "done" },
        { k: "Step 2", v: "Security interest", state: stage >= 1 ? (stage > 1 ? "done" : "now") : "" },
        { k: "Step 3", v: "Borrower", state: stage >= 2 ? "now" : "" },
        { k: "Step 4", v: "Submit", state: "" },
        { k: "Step 5", v: "Acknowledgement", state: "" },
      ]) +
      '<div class="fin-two">' +
        finCard("Security interest", '<div class="fin-grid2">' +
          finField("Property", esc(asset)) +
          finField("Type", "Immovable property") +
          finField("Nature of charge", "Mortgage by deposit of title deeds") +
          finField("Amount secured", stage >= 1 ? "₹" + Calc.money(cerCharge(), 0) : "") +
          finField("Date created", stage >= 1 ? "14 Aug 2026" : "") +
          finField("Title documents", stage >= 1 ? "Deposited 14 Aug 2026, receipt on file" : "") +
        "</div>") +
        finCard("Borrower", '<div class="fin-grid2">' +
          finField("Name", stage >= 2 ? "Anjali Deshmukh" : "") +
          finField("Constitution", stage >= 2 ? "Individual" : "") +
          finField("Identification", stage >= 2 ? "Masked, verified" : "") +
          finField("Address", stage >= 2 ? "Wakad, Pune 411057" : "") +
        "</div>" +
        finStrip("Borrower particulars are filed as they are on the executed documents. A registry entry that does not match the deed is a registry entry somebody will dispute.", "info")) +
      "</div>",
      { tab: 2, appTitle: CER_TITLE, crumb: "Create",
        dialog: view === "security"
          ? finDialog("Record the security interest",
              '<div class="fin-grid2">' +
                finField("Property", esc(asset)) +
                finField("Amount secured", "₹" + Calc.money(cerCharge(), 0)) +
                finField("Nature", "Mortgage by deposit of title deeds") +
                finField("Date created", "14 Aug 2026") +
              "</div>" +
              finStrip("The date of creation is the date the title deeds were deposited, and it is the date the thirty days run from. Filing it as today would restart a clock that has already been running for three days.",
                "warn", "The date matters."),
              finBtn("Cancel") + finBtn("Save security interest", "emph"))
          : view === "borrower"
          ? finDialog("Record the borrower particulars",
              '<div class="fin-grid2">' +
                finField("Name", "Anjali Deshmukh") +
                finField("Constitution", "Individual") +
                finField("Identification", "Masked, verified") +
                finField("Address", "Wakad, Pune 411057") +
              "</div>",
              finBtn("Cancel") + finBtn("Save borrower", "emph"))
          : "" });
  }

  if (view === "submit") {
    return finShell("cersai",
      finObjHeader("Particulars of charge", CER_LOAN, finStatus("Ready to submit", "info"),
        [{ k: "Amount secured", v: "₹" + Calc.money(cerCharge(), 0) }, { k: "Created", v: "14 Aug 2026" },
         { k: "Filing on", v: "Day 3 of 30" }, { k: "Fee", v: "As prescribed" }], "") +
      finCard("Filing summary", finTable(["Particular", "Value"], [
        ["Filing type", "Creation of security interest"],
        ["Loan account", CER_LOAN],
        ["Borrower", "Anjali Deshmukh"],
        ["Property", esc(asset)],
        ["Nature of charge", "Mortgage by deposit of title deeds"],
        { c: ["Amount secured", "₹" + Calc.money(cerCharge(), 0)], cls: "is-new" },
        ["Date of creation", "14 Aug 2026"],
      ]), { flush: true }),
      { tab: 2, appTitle: CER_TITLE, crumb: "Create",
        dialog: finDialog("Submit filing",
          finStrip("Filed on day three of thirty. A filing made on day twenty-nine is inside the window and still the wrong habit, because nothing about the file improves in the twenty-six days in between.",
            "info", "Day three."),
          finBtn("Back") + finBtn("Submit filing", "emph")) });
  }

  /* verify */
  return finShell("cersai",
    finAck("Security interest registered", [
      { k: "Filing reference", v: "SI-2026-4471908", wide: true, s: "Taken onto the loan file" },
      { k: "Loan account", v: CER_LOAN },
      { k: "Amount secured", v: "₹" + Calc.money(cerCharge(), 0) },
      { k: "Date created", v: "14 Aug 2026" },
      { k: "Date filed", v: "Today, day 3 of 30" },
      { k: "Filed by", v: esc(finOrgFull()) },
    ]) +
    '<div style="height:12px"></div>' +
    '<div class="fin-two">' +
      finCard("What is now on the file", finTable(["Item", "Reference"], [
        ["Search before creation", "Today, one satisfied charge from 2016"],
        ["Charge created", "14 Aug 2026, deeds deposited"],
        { c: ["Registered", "SI-2026-4471908"], cls: "is-new" },
        ["Satisfaction to be filed", "On closure of the facility"],
      ]), { flush: true }) +
      finCard("The last line is the one that gets forgotten", '<ul class="fin-list">' +
        "<li>Filing the charge is remembered because the money depends on it.</li>" +
        "<li>Filing the satisfaction is forgotten because nothing of ours depends on it. It is the borrower who cannot sell their property.</li>" +
        "<li>It is put on the account now, dated to closure, rather than left to the day somebody complains.</li>" +
        "</ul>") +
    "</div>",
    { tab: 3, appTitle: CER_TITLE, crumb: "Filings" });
}

/* ==================================================================
   CIMS — the Reserve Bank's supervisory returns
   ------------------------------------------------------------------
   The arithmetic in a return is never the interesting part. The
   interesting part is the validation rule that fires because a figure
   moved further than the rule allows, and what somebody does about it.
   There are two things to do: explain the movement, or change the
   figure until the rule stops firing. The second one is a misstatement.
   ================================================================== */

const CIM_TITLE = "Return filing";

function finCims(view, task) {
  const retn   = finP("retn", FIN_FALLBACK.retn);
  const period = finP("period", FIN_FALLBACK.period);

  if (view === "home") {
    const rows = [
      { c: [esc(retn), esc(period), "Quarterly", "15 Aug 2026", finStatus("Not filed", "warn")],
        cls: "is-sel", pick: "retn", val: retn },
      ["DNBS-04A Structural Liquidity", "Quarter ended 30 June 2026", "Quarterly", "15 Aug 2026", finStatus("Filed 08 Aug 2026", "ok")],
      ["DNBS-04B Dynamic Liquidity", "Quarter ended 30 June 2026", "Quarterly", "15 Aug 2026", finStatus("Filed 08 Aug 2026", "ok")],
      ["DNBS-13 Overseas Investment", "Quarter ended 30 June 2026", "Quarterly", "15 Aug 2026", finStatus("Nil return filed", "ok")],
    ];
    return finShell("cims",
      finKpis([
        { l: "Returns due this cycle", v: "4" },
        { l: "Filed", v: "3", cls: "is-ok" },
        { l: "Outstanding", v: "1", cls: "is-warn" },
        { l: "Days to due date", v: "2", cls: "is-warn" },
        { l: "Filed late, last 8 quarters", v: "0", cls: "is-ok" },
      ]) +
      finCard("Returns for this cycle", finTable(
        ["Return", "Period", "Frequency", "Due", "Status"], rows, { act: true }),
        { flush: true, count: rows.length }),
      { tab: 0, appTitle: CIM_TITLE, crumb: "Dashboard" });
  }

  if (view === "pick") {
    return finShell("cims",
      finObjHeader("Select return", esc(retn), finStatus("Selected", "info"),
        [{ k: "Period", v: esc(period) }, { k: "Frequency", v: "Quarterly" },
         { k: "Due", v: "15 Aug 2026" }, { k: "Prepared by", v: esc(finUser()) }], "") +
      '<div class="fin-two">' +
        finCard("Return", '<div class="fin-grid2">' +
          finField("Return", esc(retn)) +
          finField("Reporting period", esc(period)) +
          finField("Entity", esc(finOrgFull())) +
          finField("Category", "NBFC-ICC, Middle Layer") +
        "</div>") +
        finCard("Source of the figures", finMini([
          { k: "General ledger", v: "As at 30 June 2026, closed" },
          { k: "Loan management", v: "As at 30 June 2026" },
          { k: "Portfolio warehouse", v: "Refreshed 04 Jul 2026" },
          { k: "Method", v: "Extracted, not retyped" },
          { k: "Previous quarter", v: "Held for the variance check" },
        ]), { flush: true }) +
      "</div>",
      { tab: 1, appTitle: CIM_TITLE, crumb: "Returns" });
  }

  if (view === "extract") {
    return finShell("cims",
      finObjHeader(esc(retn), esc(period), finStatus("Extracting", "info"),
        [{ k: "Source", v: "Portfolio warehouse and general ledger" }, { k: "Fields", v: "184" },
         { k: "Extracted", v: "184" }, { k: "Typed by hand", v: "0" }], "") +
      finStrip("Every figure is extracted from the ledger and the warehouse. Nothing on this return is typed by hand, because a return typed by hand is a return that reconciles to nothing.",
        "info", "Extracted, not retyped.") +
      finCard("Extraction", finTable(["Block", "Fields", "Source", "Status"], [
        ["Assets and liabilities", "46", "General ledger", finStatus("Extracted", "ok")],
        ["Income and expenditure", "38", "General ledger", finStatus("Extracted", "ok")],
        ["Asset classification and provisioning", "44", "Loan management", finStatus("Extracted", "ok")],
        ["Capital and leverage", "22", "General ledger", finStatus("Extracted", "ok")],
        ["Exposures and concentration", "34", "Portfolio warehouse", finStatus("Extracted", "ok")],
      ]), { flush: true }),
      { tab: 1, appTitle: CIM_TITLE, crumb: "Returns" });
  }

  if (view === "draft") {
    const rows = [
      ["Total assets", "₹74,182.60 cr", "₹72,904.10 cr", "+1.75%", finStatus("Within tolerance", "ok")],
      { c: ["Gross loans and advances", "₹68,412.40 cr", "₹74,688.20 cr", "−8.40%", finStatus("Beyond tolerance", "err")], cls: "is-alert" },
      { c: ["Investments", "₹4,916.80 cr", "₹1,204.30 cr", "+308.3%", finStatus("Beyond tolerance", "err")], cls: "is-alert" },
      { c: ["Gross non-performing assets", "₹2,184.60 cr", "₹2,096.40 cr", "+4.21%", finStatus("Within tolerance", "ok")], cls: "is-new" },
      ["Provision coverage", "68.4%", "67.9%", "+0.74%", finStatus("Within tolerance", "ok")],
      ["Capital to risk weighted assets", "19.42%", "19.08%", "+1.78%", finStatus("Within tolerance", "ok")],
    ];
    return finShell("cims",
      finObjHeader(esc(retn), esc(period), finStatus("Populated", "info"),
        [{ k: "Fields", v: "184" }, { k: "Populated", v: "184" },
         { k: "Compared against", v: "Quarter ended 31 Mar 2026" }, { k: "Not yet validated", v: "Yes" }], "") +
      finCard("Key parameters against the previous quarter", finTable(
        ["Parameter", "This quarter", "Previous", "Movement", "Read"], rows), { flush: true, count: rows.length }),
      { tab: 1, appTitle: CIM_TITLE, crumb: "Returns" });
  }

  if (view === "validate") {
    const rows = [
      ["Total assets equals liabilities and equity", "Hard", finStatus("Passed", "ok")],
      ["Provisioning agrees to the classification schedule", "Hard", finStatus("Passed", "ok")],
      ["Capital ratio computed on the reported risk weights", "Hard", finStatus("Passed", "ok")],
      ["Non-performing assets agree to the ageing schedule", "Hard", finStatus("Passed", "ok")],
      { c: ["Gross loans and advances moved more than 5 per cent", "Soft, explanation required", finStatus("Flagged", "err")], cls: "is-alert" },
      { c: ["Investments moved more than 5 per cent", "Soft, explanation required", finStatus("Flagged, same cause", "warn")], cls: "is-warn" },
    ];
    return finShell("cims",
      finObjHeader(esc(retn), esc(period), finStatus("2 flagged, 0 errors", "warn"),
        [{ k: "Rules run", v: "142" }, { k: "Passed", v: "140" },
         { k: "Hard errors", v: "0" }, { k: "Explanations required", v: "2" }], "") +
      finStrip("No hard error. Two soft rules want an explanation, and both are the same movement seen from two sides: the book that left advances is the book that arrived in investments.",
        "warn", "One cause, two flags.") +
      finCard("Validation", finTable(["Rule", "Type", "Result"], rows), { flush: true, count: rows.length }),
      { tab: 2, appTitle: CIM_TITLE, crumb: "Validation" });
  }

  if (view === "fix" || view === "submit") {
    const submitting = view === "submit";
    return finShell("cims",
      finObjHeader(esc(retn), esc(period),
        finStatus(submitting ? "Ready to file" : "Explanation being recorded", submitting ? "ok" : "warn"),
        [{ k: "Flagged", v: "2" }, { k: "Explained", v: submitting ? "2" : "1" },
         { k: "Figures changed", v: "0" }, { k: "Due", v: "15 Aug 2026" }], "") +
      finStrip("The figure is not being changed. A return edited until the rule stops firing is a misstatement, and the rule exists to make somebody write down why the book moved.",
        "warn", "Explain it, do not edit it.") +
      '<div class="fin-two">' +
        finCard("Flagged item 7 of 142", '<div class="fin-grid2">' +
          finField("Parameter", "Gross loans and advances") +
          finField("Movement", "−8.40 per cent") +
          finField("Tolerance", "5 per cent") +
          finField("Figure changed", "No") +
        "</div>" +
        '<div class="fin-f"><label>Reason for the movement</label>' +
          finTypeField(task, "finReason", "reason", finP("reason", FIN_FALLBACK.reason),
            /Explain the flagged variance/, "Reason for the movement", "fin-in--area") + "</div>") +
        finCard("Cross-check", finMini([
          { k: "Advances down", v: "₹6,275.80 cr" },
          { k: "Investments up", v: "₹3,712.50 cr" },
          { k: "Difference", v: "Repayments and write-offs in the quarter" },
          { k: "Ties to", v: "Note 14, co-lending novation" },
          { k: "Board note", v: "Approved 22 May 2026" },
          { k: "Read", v: finStatus("Explained and traceable", "ok") },
        ]), { flush: true }) +
      "</div>",
      { tab: 2, appTitle: CIM_TITLE, crumb: submitting ? "Submission" : "Validation",
        dialog: submitting
          ? finDialog("Submit return",
              '<div class="fin-grid2">' +
                finField("Return", esc(retn)) +
                finField("Period", esc(period)) +
                finField("Hard errors", "0") +
                finField("Explanations attached", "2") +
              "</div>" +
              finStrip("Filed on the 13th against a due date of the 15th. Two days is not comfort, it is the margin that means a system failure on the due date is survivable.",
                "info", "Two days early."),
              finBtn("Back") + finBtn("Submit return", "emph"))
          : "" });
  }

  /* verify */
  return finShell("cims",
    finAck("Return filed", [
      { k: "Acknowledgement", v: "CIMS-ACK-2026-Q1-0018842", wide: true, s: "Held with the return working papers" },
      { k: "Return", v: esc(retn) },
      { k: "Period", v: esc(period) },
      { k: "Filed", v: "Today, due 15 Aug 2026" },
      { k: "Hard errors", v: "0" },
      { k: "Explanations attached", v: "2" },
    ]) +
    '<div style="height:12px"></div>' +
    '<div class="fin-two">' +
      finCard("What was filed", finTable(["Item", "Outcome"], [
        ["Figures extracted from the ledger and warehouse", finStatus("184 of 184", "ok")],
        ["Figures typed by hand", finStatus("0", "ok")],
        ["Hard validation errors", finStatus("0", "ok")],
        { c: ["Soft rules explained rather than edited", finStatus("2", "ok")], cls: "is-new" },
        ["Filed against the due date", finStatus("2 days early", "ok")],
      ]), { flush: true }) +
      finCard("What the working papers now hold", '<ul class="fin-list">' +
        "<li>The extraction, so every figure ties back to a ledger balance rather than to somebody's spreadsheet.</li>" +
        "<li>The two explanations, in the words they were filed in.</li>" +
        "<li>The board note the movement ties to, referenced rather than described.</li>" +
        "<li>The acknowledgement, which is the only proof the filing happened.</li>" +
        "</ul>") +
    "</div>",
    { tab: 3, appTitle: CIM_TITLE, crumb: "Submission" });
}

/* ==================================================================
   CMS — the Reserve Bank's Complaint Management System
   ------------------------------------------------------------------
   By the time a complaint arrives here, the customer has already been
   past us once and was not satisfied. The temptation is to answer the
   regulator rather than the customer. This run answers the account
   trail, and the trail says the customer is right on both counts.
   ================================================================== */

const CMS_TITLE = "Complaint Management System";
const CMS_ACCT  = "LN-PL-2024-0072215";

function finCms(view, task) {
  const complaint = finP("complaint", FIN_FALLBACK.complaint);
  const remedy    = finP("remedy", FIN_FALLBACK.remedy);

  if (view === "home") {
    const rows = [
      { c: [esc(complaint), "Meenakshi Raghavan", "Charges and credit information", "04 Aug 2026", "Today", finStatus("Response due", "err")],
        cls: "is-sel", pick: "complaint", val: complaint },
      ["CMS-2026-0084402", "Iqbal Shaikh", "Recovery conduct", "28 Jul 2026", "22 Aug 2026", finStatus("Under examination", "warn")],
      ["CMS-2026-0084188", "Lalitha Venkatesh", "Loan servicing", "21 Jul 2026", "—", finStatus("Responded 03 Aug 2026", "ok")],
      ["CMS-2026-0083944", "Gurmeet Singh Bedi", "Charges", "14 Jul 2026", "—", finStatus("Closed, redress paid", "ok")],
    ];
    return finShell("cms",
      finKpis([
        { l: "Open complaints", v: "12" },
        { l: "Response due this week", v: "2", cls: "is-warn" },
        { l: "Responded late, this year", v: "0", cls: "is-ok" },
        { l: "Upheld against us, this year", v: "9" },
        { l: "Redress paid, this year", v: "₹4.18 lakh" },
      ]) +
      finCard("Complaints", finTable(
        ["Reference", "Complainant", "Ground", "Received", "Response due", "Status"], rows, { act: true }),
        { flush: true, count: rows.length }),
      { tab: 0, appTitle: CMS_TITLE, crumb: "Dashboard" });
  }

  if (view === "case") {
    return finShell("cms",
      finObjHeader("Complaint " + complaint, "Meenakshi Raghavan", finStatus("Response due today", "err"),
        [{ k: "Ground", v: "Charges and credit information" }, { k: "Account", v: CMS_ACCT },
         { k: "Received", v: "04 Aug 2026" }, { k: "Previously to us", v: "Yes, 09 Jul 2026" }],
        finBtn("Download the complaint") + finBtn("Start response", "emph")) +
      finFlow([
        { k: "To us", v: "09 Jul 2026", state: "done" },
        { k: "Our reply", v: "16 Jul 2026", state: "done" },
        { k: "Escalated", v: "04 Aug 2026", state: "done" },
        { k: "Examination", v: "Today", state: "now" },
        { k: "Response", v: "—", state: "" },
      ]) +
      finStrip("This customer came to us first and got a reply that did not resolve it. Whatever the trail shows now, that part is already ours.",
        "warn", "She came to us first.") +
      finCard("Complaint", finMini([
        { k: "Complainant", v: "Meenakshi Raghavan" },
        { k: "Account", v: CMS_ACCT + ", personal loan" },
        { k: "Grounds", v: "Charges levied twice, and credit information wrongly reported" },
        { k: "Relief sought", v: "Refund and correction of the credit report" },
        { k: "Our earlier reply", v: "16 Jul 2026, charges stated to be correctly levied" },
      ]), { flush: true }),
      { tab: 1, appTitle: CMS_TITLE, crumb: "Complaints" });
  }

  if (view === "says") {
    return finShell("cms",
      finObjHeader("Complaint " + complaint, "Meenakshi Raghavan", finStatus("Being examined", "info"),
        [{ k: "Heads of complaint", v: "2" }, { k: "Account", v: CMS_ACCT },
         { k: "Period", v: "May to July 2026" }, { k: "Documents attached", v: "3" }], "") +
      finCard("What the customer says", finTable(["Head", "What is alleged", "Amount", "Status"], [
        { c: ["Charges", "A single failed instalment on 07 May was charged for twice", "₹1,180", finStatus("To be examined", "warn")], cls: "is-alert" },
        { c: ["Credit information", "The account was reported 30 days past due for June after it had been paid on 12 June", "—", finStatus("To be examined", "warn")], cls: "is-alert" },
      ]), { flush: true, count: 2 }) +
      finCard("In her words", finField("Statement",
        "The instalment failed once in May and I was charged twice for it. I wrote to the branch and was told the charges were correct. " +
        "I paid everything on 12 June and my credit report still shows me thirty days late for June. I have been refused a loan because of it.",
        "fin-in--area")),
      { tab: 1, appTitle: CMS_TITLE, crumb: "Complaints" });
  }

  if (view === "trail") {
    const rows = [
      ["07 May 2026", "Instalment presented", "₹8,240", finStatus("Returned, insufficient funds", "warn")],
      { c: ["07 May 2026", "Bounce charge levied", "₹590", finStatus("Correct", "ok")] },
      { c: ["09 May 2026", "Bounce charge levied again, same presentation", "₹590", finStatus("Duplicate", "err")], cls: "is-alert" },
      ["12 Jun 2026", "Payment received, account regularised", "₹17,070", finStatus("Cleared same day", "ok")],
      { c: ["05 Jul 2026", "Credit information filed for June", "30+ days past due", finStatus("Wrong, account was current on 12 Jun", "err")], cls: "is-alert" },
      ["16 Jul 2026", "Our reply to the customer", "—", finStatus("Said the charges were correct", "err")],
    ];
    return finShell("cms",
      finObjHeader("Account trail", CMS_ACCT, finStatus("Both heads made out", "err"),
        [{ k: "Entries examined", v: "6" }, { k: "Heads upheld", v: "2 of 2" },
         { k: "Duplicate charge", v: "₹590" }, { k: "Credit information", v: "Wrongly filed" }], "") +
      finStrip("Both heads of the complaint are made out on our own records. The charge was levied twice for one presentation, and the June credit information was filed a fortnight after the account was regularised.",
        "err", "She is right, twice.") +
      finCard("Account trail", finTable(["Date", "Entry", "Amount", "Read"], rows), { flush: true, count: rows.length }),
      { tab: 2, appTitle: CMS_TITLE, crumb: "Response" });
  }

  if (view === "draft" || view === "redress" || view === "submit") {
    const stage = view === "draft" ? 0 : view === "redress" ? 1 : 2;
    return finShell("cms",
      finObjHeader("Response to " + complaint, "Meenakshi Raghavan",
        finStatus(stage === 2 ? "Ready to lodge" : "Being drafted", stage === 2 ? "ok" : "info"),
        [{ k: "Heads upheld", v: "2 of 2" }, { k: "Redress", v: stage >= 1 ? esc(remedy) : "—" },
         { k: "Amount", v: stage >= 1 ? "₹623" : "—" }, { k: "Due", v: "Today" }], "") +
      '<div class="fin-two">' +
        finCard("Finding", '<div class="fin-f"><label>What the account trail shows</label>' +
          finTypeField(task, "finFinding", "finding", finP("finding", FIN_FALLBACK.finding),
            /Record the finding/, "What the account trail shows", "fin-in--area") + "</div>" +
          finStrip("The finding is what the trail shows, in plain words, including the part where our own reply of 16 July was wrong. A response that omits that is answering the regulator rather than the customer.",
            "warn", "Say the whole of it.")) +
        finCard("Redress", finTable(["Head", "Redress", { t: "Amount", num: true }], [
          ["Duplicate bounce charge", stage >= 1 ? "Refunded" : "—", stage >= 1 ? "₹590" : "—"],
          ["Interest on the refund", stage >= 1 ? "From 09 May to today" : "—", stage >= 1 ? "₹33" : "—"],
          { c: ["Credit information for June", stage >= 1 ? "Correction filed with all four bureaus" : "—", "—"],
            cls: stage >= 1 ? "is-new" : "" },
          { c: ["Our reply of 16 July", stage >= 1 ? "Withdrawn and corrected in this response" : "—", "—"],
            cls: stage >= 1 ? "is-new" : "" },
        ]), { flush: true }) +
      "</div>",
      { tab: 2, appTitle: CMS_TITLE, crumb: "Response",
        dialog: stage === 1
          ? finDialog("Set the redress",
              '<div class="fin-grid2">' +
                finField("Redress", esc(remedy)) +
                finField("Refund", "₹590") +
                finField("Interest on the refund", "₹33") +
                finField("Bureau correction", "All four, filed within two working days") +
              "</div>" +
              finStrip("The refund is the easy half. The correction is the half she actually came for: she was refused a loan on a report we filed wrongly, and a refund does not undo that.",
                "warn", "The correction matters more than the money."),
              finBtn("Cancel") + finBtn("Set redress", "emph"))
          : stage === 2
          ? finDialog("Lodge the response",
              '<div class="fin-grid2">' +
                finField("Complaint", esc(complaint)) +
                finField("Heads upheld", "2 of 2") +
                finField("Redress", esc(remedy)) +
                finField("Lodged", "Today, on the due date") +
              "</div>" +
              finStrip("Attached: the account trail, the duplicate charge entry, and the bureau correction request with its own reference. A response without the underlying entries is an assertion.",
                "info", "With the evidence, not without it."),
              finBtn("Back") + finBtn("Lodge response", "emph"))
          : "" });
  }

  /* verify */
  return finShell("cms",
    finAck("Response lodged", [
      { k: "Acknowledgement", v: "CMS-RESP-2026-0084713-01", wide: true, s: "Copy to the customer the same day" },
      { k: "Complaint", v: esc(complaint) },
      { k: "Heads upheld", v: "2 of 2" },
      { k: "Redress", v: esc(remedy) },
      { k: "Refund and interest", v: "₹623" },
      { k: "Bureau correction", v: "CORR-2026-08-1184, all four bureaus" },
    ]) +
    '<div style="height:12px"></div>' +
    '<div class="fin-two">' +
      finCard("What was accepted", finTable(["Head", "Outcome"], [
        { c: ["A single presentation was charged for twice", finStatus("Upheld, refunded with interest", "ok")], cls: "is-new" },
        { c: ["June credit information filed after the account was regularised", finStatus("Upheld, correction filed", "ok")], cls: "is-new" },
        { c: ["Our reply of 16 July 2026", finStatus("Withdrawn as wrong", "err")], cls: "is-alert" },
      ]), { flush: true }) +
      finCard("What this complaint changes", '<ul class="fin-list">' +
        "<li>The duplicate charge was a re-presentation posting the charge a second time. Every account with two bounce charges inside seventy-two hours is being pulled.</li>" +
        "<li>The June credit information was filed on a monthly cut that ignored a same-month regularisation. That is a change to the filing job, not to this account.</li>" +
        "<li>The reply of 16 July was written from the charge schedule rather than from the account. That is the one worth being uncomfortable about.</li>" +
        "</ul>") +
    "</div>",
    { tab: 4, appTitle: CMS_TITLE, crumb: "History" });
}

/* ================================================================
   the surface
   ================================================================ */
function opAppSurface(key, view, task) {
  if (key === "origination") return finOrigination(view, task);
  if (key === "lms")         return finLms(view, task);
  if (key === "collections") return finCollections(view, task);
  if (key === "colending")   return finColending(view, task);
  if (key === "ckycr")       return finCkycr(view, task);
  if (key === "cersai")      return finCersai(view, task);
  if (key === "cims")        return finCims(view, task);
  if (key === "cms")         return finCms(view, task);
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

  origination: [
    [".fin-kpi", ""],                                                  /* 0  the queue */
    [".fin-oh__title", ""],                                            /* 1  open the application */
    ["#finAmount", ""],                                                /* 2  amount sought */
    [".fin-t tbody tr.is-alert", "", ".fin-t tbody tr"],               /* 3  bureau */
    [".fin-t tbody tr.is-warn", "", ".fin-t tbody tr"],                /* 4  income */
    [".fin-bar b", "", ".fin-t tbody tr.is-alert"],                    /* 5  margin */
    [".fin-dlg__f .fin-btn--emph", "Raise deviation"],                 /* 6  deviation */
    [".fin-dlg__f .fin-btn--emph", "Route to"],                        /* 7  authority */
    [".fin-dlg__f .fin-btn--emph", "Record decision"],                 /* 8  sanction */
    [".fin-toast", ""],                                                /* 9  verify */
  ],

  lms: [
    [".fin-kpi", ""],                                                  /* 0  portfolio */
    [".fin-oh__title", ""],                                            /* 1  the account */
    [".fin-t tbody tr.is-warn", "", ".fin-t tbody tr"],                /* 2  checklist */
    ["#finRelease", ""],                                               /* 3  amount to release */
    [".fin-dlg__f .fin-btn--emph", "Withhold"],                        /* 4  withhold */
    [".fin-dlg__f .fin-btn--emph", "Register mandate"],                /* 5  mandate */
    [".fin-dlg__f .fin-btn--emph", "Set date"],                        /* 6  first instalment */
    [".fin-t tbody tr.is-alert", "", ".fin-t tbody tr"],               /* 7  documents, unowned */
    [".fin-t tbody tr.is-new", "", ".fin-t tbody tr"],                 /* 8  documents, owned */
    [".fin-toast", ""],                                                /* 9  verify */
  ],

  collections: [
    [".fin-kpi", ""],                                                  /* 0  buckets */
    [".fin-oh__title", ""],                                            /* 1  the account */
    [".fin-t tbody tr.is-alert", "", ".fin-t tbody tr"],               /* 2  history */
    ["#finArrears", ""],                                               /* 3  arrears */
    [".fin-t tbody tr.is-new", "", ".fin-t tbody tr"],                 /* 4  notice served */
    [".fin-dlg__f .fin-btn--emph", "Check authorisation"],             /* 5  the request */
    [".fin-gate__r.is-fail", "", ".fin-strip--err"],                   /* 6  NOT AUTHORISED */
    [".fin-dlg__f .fin-btn--emph", "Suspend recovery"],                /* 7  suspend */
    [".fin-dlg__f .fin-btn--emph", "Refer to Legal"],                  /* 8  refer */
    [".fin-t tbody tr.is-warn", "", ".fin-t tbody tr"],                /* 9  vintage */
    [".fin-strip--warn", "", ".fin-strip"],                            /* 10 verify, and not a toast */
  ],

  colending: [
    [".fin-t tbody tr.is-sel", "", ".fin-t tbody tr"],                 /* 0  arrangements */
    [".fin-oh__title", ""],                                            /* 1  the arrangement */
    ["#finFile", ""],                                                  /* 2  file reference */
    [".fin-kpi", "", ".fin-oh__title"],                                /* 3  run it */
    [".fin-t tbody tr.is-alert", "", ".fin-t tbody tr"],               /* 4  unmatched */
    [".fin-dlg__f .fin-btn--emph", "Apply the arrangement basis"],     /* 5  apportionment */
    [".fin-dlg__f .fin-btn--emph", "Move to the clearance month"],     /* 6  dating */
    [".fin-dlg__f .fin-btn--emph", "Raise settlement advice"],         /* 7  settle */
    [".fin-toast", ""],                                                /* 8  verify */
  ],

  ckycr: [
    [".fin-kpi", ""],                                                  /* 0  the registry */
    ["#finSearch", ""],                                                /* 1  who to search for */
    [".fin-t tbody tr.is-sel", "", ".fin-t tbody tr"],                 /* 2  the result */
    [".fin-oh__title", ""],                                            /* 3  download */
    [".fin-diff__col.is-bad", "", ".fin-diff__col"],                   /* 4  compare */
    [".fin-dlg__f .fin-btn--emph", "Prepare update"],                  /* 5  update, not new */
    [".fin-dlg__f .fin-btn--emph", "Upload batch"],                    /* 6  upload */
    [".fin-ack", ""],                                                  /* 7  verify */
  ],

  cersai: [
    [".fin-kpi", ""],                                                  /* 0  the register */
    ["#finAsset", ""],                                                 /* 1  the property */
    [".fin-t tbody tr.is-new", "", ".fin-t tbody tr"],                  /* 2  what the search returns */
    [".fin-oh__title", ""],                                            /* 3  particulars of charge */
    [".fin-dlg__f .fin-btn--emph", "Save security interest"],          /* 4  security interest */
    [".fin-dlg__f .fin-btn--emph", "Save borrower"],                   /* 5  borrower */
    [".fin-dlg__f .fin-btn--emph", "Submit filing"],                   /* 6  submit */
    [".fin-ack", ""],                                                  /* 7  verify */
  ],

  cims: [
    [".fin-kpi", ""],                                                  /* 0  the dashboard */
    [".fin-oh__title", "", ".fin-t tbody tr.is-sel"],                  /* 1  return and period */
    [".fin-strip", ""],                                                /* 2  extract */
    [".fin-t tbody tr.is-alert", "", ".fin-t tbody tr"],               /* 3  populate */
    [".fin-t tbody tr.is-alert", "", ".fin-t tbody tr"],               /* 4  validate */
    ["#finReason", ""],                                                /* 5  explain */
    [".fin-dlg__f .fin-btn--emph", "Submit return"],                   /* 6  submit */
    [".fin-ack", ""],                                                  /* 7  verify */
  ],

  cms: [
    [".fin-kpi", ""],                                                  /* 0  the dashboard */
    [".fin-oh__title", ""],                                            /* 1  the complaint */
    [".fin-t tbody tr.is-alert", "", ".fin-t tbody tr"],               /* 2  what she says */
    [".fin-t tbody tr.is-alert", "", ".fin-t tbody tr"],               /* 3  the trail */
    ["#finFinding", ""],                                               /* 4  the finding */
    [".fin-dlg__f .fin-btn--emph", "Set redress"],                     /* 5  redress */
    [".fin-dlg__f .fin-btn--emph", "Lodge response"],                  /* 6  lodge */
    [".fin-ack", ""],                                                  /* 7  verify */
  ],
};
