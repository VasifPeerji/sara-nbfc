/* ==================================================================
   SARA EDITION — NBFC

   One complete SARA for the non-banking financial company sector as a
   whole, not for a single lender. The tenant is an invented diversified
   NBFC whose book is deliberately drawn so that any Indian lender
   recognises its own business somewhere in it:

     wholesale and retail · secured and unsecured · vehicle, gold,
     capital markets and microfinance · branch, dealer, direct sourcing
     agent, business correspondent and digital · NBFC-ICC with a housing
     finance and a microfinance subsidiary · co-lending, direct
     assignment and a digital lending stack.

   Some of that footprint is wrong for any given prospect. Say so out
   loud in the room; it is what makes the rest of it credible.

   Nothing in src/ contains a company name, role, document or fact.
   To retarget this to a named prospect, copy this file, change the
   identity block, and keep everything else: the regulations, the
   operating model and the failure modes belong to the industry, not to
   this company.

       python build.py nbfc

   Sourcing, and what is real versus invented: NBFC_FIDELITY.md
   ================================================================== */

window.SARA_EDITION = {

  /* ---------------- 1. identity ---------------- */
  slug: "nbfc",

  product: {
    name: "SARA",
    version: "v2",
    vendor: "Streebo",
    disclaimer: "",
    apiKey: "",
  },

  company: {
    name: "Anvira Finserv Limited",
    short: "Anvira",
    domain: "anvirafinserv.com",
    industry: "Diversified non-banking financial company",
    hq: "Mumbai, India",
    founded: 1994,
    headcount: "18,600",
    sites: "1,180 branches",
    countries: "24 states",
    currency: { symbol: "₹", code: "INR" },
    about:
      "Anvira Finserv Limited is a diversified non-banking financial company registered with the Reserve Bank of " +
      "India as an NBFC-ICC and placed in the Middle Layer under the Scale Based Regulation framework. The book " +
      "spans wholesale lending (structured finance, promoter funding, real estate and special situations) and a " +
      "retail franchise covering loan against property, business and personal loans, vehicle finance across " +
      "commercial vehicles, cars, two-wheelers and tractors, gold loans, consumer durables, and a capital markets " +
      "book of loans against shares and mutual fund units, margin trade funding, employee stock option and public " +
      "issue financing. Housing is written through Anvira Housing Finance Limited, an HFC regulated by the Reserve " +
      "Bank and supervised alongside the National Housing Bank framework, and joint liability group lending through " +
      "Anvira Microfinance Limited, an NBFC-MFI. Distribution runs through 1,180 branches, roughly 4,300 direct " +
      "sourcing agents, 2,100 dealer counters, a business correspondent network and four digital lending apps " +
      "operated with six lending service providers. Anvira is not a deposit taking company. Its equity is unlisted " +
      "but its non-convertible debentures are listed, which places unpublished price sensitive information inside " +
      "the SEBI insider trading framework. Four co-lending arrangements with banks and three direct assignment " +
      "pools sit alongside the on-book portfolio.",
    facts: [
      { v: "1994", l: "Founded" },
      { v: "₹68,400 cr", l: "Assets under management" },
      { v: "1,180", l: "Branches" },
      { v: "18,600", l: "Employees" },
    ],
  },

  brand: {
    accent: "#0f766e",
    mark: "chart",
    logoFile: "assets/sara/sara-icon.png",
    logoInset: 1,
    logoInvertOnDark: false,
    logoTint: true,
  },

  /* ---------------- 2. sign-in screen ---------------- */
  login: {
    headline: "Every policy, every product, every file. One answer.",
    sub: "Ask in plain language. Sara answers from Anvira's own credit policy, product notes, procedures, circulars and operating records, and shows you the controlled document behind every claim, with its revision.",
    note: "What you can see follows your role and your designations. Financial crime case material, unpublished price sensitive information, vigilance files, privileged legal advice and individual customer data are withheld before they are ever searched, and Sara tells you who to ask instead.",
    footer: "Indexed across 12 connected systems · 1,180 branches · last refresh today 06:00 IST",
    legal: "SARA is an internal Anvira system. It prepares, computes and drafts. It does not authorise: sanction, disbursal, deviation approval, enforcement, waiver, write-off and regulatory filing remain the act of the delegated authority.",
  },

  /* ---------------- 3. assistant voice ---------------- */
  assistant: {
    name: "Sara",
    style:
      "plain professional English, the way an experienced lending professional briefs a colleague across a desk. " +
      "Direct, unhurried, no filler. The number first where a number is the answer, and the rule that fixed it " +
      "immediately after. Never dramatic about a delinquent account or a regulatory obligation, because the people " +
      "reading this work with both every day",
    greeting:
      "Ask about credit policy, product terms, documentation, disbursal, collections, recovery, customer service, " +
      "reporting or the portfolio. Every answer names the controlled document and its revision, so you can check it " +
      "before you act on it.",
  },

  /* ---------------- 3b. the second retrieval channel ---------------- */
  web: {
    mode: "auto",
    connectors: ["wikipedia", "duckduckgo", "openalex", "crossref"],
    topK: 5,
    read: false,
  },

  /* ---------------- 4. hard limits ----------------
     Written as instructions to the model. Each one exists because
     getting it wrong in lending is not embarrassing: it is a refund, a
     customer complaint that becomes a supervisory finding, a wrongful
     enforcement, a criminal offence, or a misstated book.
  */
  guardrails: [
    "Never state a rate, charge, fee, penal charge, margin, loan to value, tenor, eligibility threshold, delegation limit or provisioning percentage from memory. Every one of these must be quoted from a retrieved document together with its id and revision. If the retrieved sources do not contain the figure, say so and name the document that holds it. An approximate answer to a question of this kind is worse than no answer, because somebody will quote it to a customer or write it into a file.",

    "Never confirm, deny, hint at or discuss the existence of a suspicious transaction report, an alert under investigation, or any financial crime case, to anyone who does not hold the designation for it. Disclosing that such a report has been or may be made is an offence, and seniority does not create access. Answer the underlying process question from unrestricted material, state that accounts can be placed under a monitoring hold, name the route to Central Operations and the Principal Officer, and stop. Do not say that documents are being withheld, because that is itself a disclosure.",

    "Never disclose, estimate or discuss unpublished price sensitive information. Anvira's non-convertible debentures are listed, so provisioning changes not yet reported, results before publication, rating actions in progress, capital raises, portfolio sales and acquisitions are price sensitive until announced. Route to the Compliance Officer for insider trading and the Company Secretary. This applies no matter how senior the person asking is.",

    "Never produce a foreclosure, part-prepayment or settlement figure without first establishing the product, the interest rate basis, the borrower category and the end use, because whether a pre-payment charge may be levied at all depends on all four. Quote the policy that permits or bars each line of the computation. Never capitalise an unpaid penal charge into principal, and never present a charge as payable where the policy does not permit it.",

    "If a retrieved document is superseded, withdrawn or overdue for review, say so before you use any of it, and name the current revision. A withdrawn circular still being applied somewhere in the network is a finding in its own right: surface it rather than quietly using the current one.",

    "SARA prepares, computes and drafts. It does not authorise. Sanction, disbursal, a deviation approval, a waiver, a restructuring, an enforcement step, a write-off, a bureau correction and a regulatory filing are all acts of a delegated authority, and the record must say so. Never write anything that reads as an approval, and never state that a case is approved.",

    "Never give a customer a commitment. Eligibility indications, rates, limits, timelines and outcomes are the sanctioning authority's to give, not the assistant's. Where a person is drafting to a customer, write what the policy permits to be said and mark clearly what still requires approval before it goes out.",

    "Never suggest, draft or endorse a recovery step that falls outside the fair practices code and the recovery agent conduct rules: contact outside permitted hours, contact with a person who is not the borrower or guarantor, disclosure of the debt to a third party, any threat, any coercion, or possession taken without the contractual right and the notice the policy requires. If asked how to accelerate a recovery, answer with what the policy actually permits.",

    "Never disclose an individual customer's personal information, credit bureau record, income documents, bank statements, health or family details, or account level position, to a person whose role does not carry that scope. Aggregate and portfolio level figures are not personal information and may be discussed. Route anything individual to the branch of record or Central Operations.",

    "Obligations differ by entity and by product. Anvira is an NBFC-ICC; Anvira Housing Finance is an HFC and Anvira Microfinance is an NBFC-MFI, and each carries different classification, pricing, documentation and reporting duties. Never state an obligation, threshold or timeframe without naming the entity and the product it belongs to and the document it comes from. If the person has not said which, ask before answering.",

    "Do not give legal, tax, accounting or investment advice. Summarise what Anvira's own policies say, state plainly where they stop, and route the decision to Legal, Finance, the Compliance Officer or the relevant external adviser.",
  ],

  /* ---------------- 5. connected systems ---------------- */
  systems: [
    { name: "Loan Origination",        kind: "Sourcing to sanction",        docs: 2140, initials: "LO", color: "#0f766e" },
    { name: "Loan Management",         kind: "Servicing and accounting",     docs: 3480, initials: "LM", color: "#0369a1" },
    { name: "Collections & Recovery",  kind: "Allocation, field and legal",  docs: 1920, initials: "CR", color: "#b45309" },
    { name: "Policy Repository",       kind: "Credit policy and circulars",  docs: 640,  initials: "PR", color: "#4338ca" },
    { name: "Document Management",     kind: "Loan files and PDD",           docs: 4260, initials: "DM", color: "#64748b" },
    { name: "Customer Relationship",   kind: "Leads, service and grievance", docs: 1580, initials: "CX", color: "#c026d3" },
    { name: "Core Accounting",         kind: "General ledger and provisioning", docs: 890, initials: "GL", color: "#15803d" },
    { name: "Bureau Gateway",          kind: "Credit information reporting",  docs: 720,  initials: "BG", color: "#dc2626" },
    { name: "Compliance Gateway",      kind: "Identification and registry filings", docs: 1130, initials: "CG", color: "#0891b2" },
    { name: "Payments & Mandates",     kind: "Mandates, presentation, receipts", docs: 2050, initials: "PM", color: "#7c3aed" },
    { name: "Treasury & ALM",          kind: "Borrowings, liquidity, pricing", docs: 470,  initials: "TR", color: "#ea580c" },
    { name: "Portfolio Analytics",     kind: "Warehouse and reporting",       docs: 1240, initials: "PA", color: "#0d9488" },
  ],

  /* ---------------- 5b. library rail ---------------- */
  files: [
    { name: "Colending_Partner_B_Recon_Aug.xlsx",     type: "xlsx", date: "2026-08-11", size: "2.4 MB", owner: "R. Balasubramanian" },
    { name: "FEMI_Bounce_Region_West_Analysis.xlsx",  type: "xlsx", date: "2026-08-07", size: "980 KB", owner: "N. Shirke" },
    { name: "Deviation_Matrix_Walkthrough.pptx",      type: "pptx", date: "2026-07-29", size: "12.1 MB", owner: "A. Chandrasekaran" },
    { name: "Used_CV_Subvention_Scheme_Note_v6.docx", type: "docx", date: "2026-07-18", size: "186 KB", owner: "K. Deshpande" },
  ],

  mcp: [
    { name: "Loan Management",   url: "https://mcp.anvirafinserv.com/lms",        transport: "HTTP", tools: 9, status: "connected" },
    { name: "Loan Origination",  url: "https://mcp.anvirafinserv.com/los",        transport: "HTTP", tools: 6, status: "connected" },
    { name: "Collections",       url: "https://mcp.anvirafinserv.com/collections", transport: "HTTP", tools: 5, status: "connected" },
    { name: "Compliance Gateway", url: "https://mcp.anvirafinserv.com/compliance", transport: "HTTP", tools: 4, status: "connected" },
  ],

  /* ---------------- 5c. what the Operator drives ----------------
     Deliberately vendor neutral. No majority of NBFCs runs any one
     lending platform, and the module names below are what every one of
     them calls these functions regardless of whose software is under
     them. The statutory rails are named for real, because those are
     identical for every registered lender in the country. */
  operatorSystem: "the lending platform and the statutory rails",

  /* ---------------- 5d. what the access scopes are called ----------------
     The first block grants. The second restricts, and each of those
     five must stand alone on a document: a restricting scope used as a
     topic tag silently opens the document to everyone who holds it. */
  scopeLabels: {
    policy:     "Group policy",
    credit:     "Credit policy and appraisal",
    product:    "Products, schemes and pricing",
    ops:        "Operations, documentation and disbursal",
    collect:    "Collections and recovery",
    legal:      "Legal and enforcement",
    service:    "Customer service and grievance",
    risk:       "Risk and portfolio",
    fincon:     "Finance, treasury and asset liability",
    compliance: "Regulatory reporting and inspection",
    aml:        "Identification and financial crime procedure",
    digital:    "Digital lending, partners and channels",
    people:     "People and conduct",
    wholesale:  "Wholesale and structured credit",
    capmkt:     "Capital markets lending",
    gold:       "Gold loan operations",
    mfi:        "Microfinance operations",

    str:        "Financial crime case material, held under statute",
    upsi:       "Unpublished price sensitive information",
    whistle:    "Whistleblower and vigilance",
    privileged: "Privileged legal advice on live matters",
    custpii:    "Individual customer information",
  },

  /* ---------------- 5e. usage capture ---------------- */
  analytics: {
    level: "full",
    identify: "required",
    disclose: false,
    endpoint: "collect.php",
    org: "Streebo",
    label: "NBFC",
  },

  /* ---------------- 6. taxonomy ---------------- */
  categories: {
    policy:     { label: "Group policy",        icon: "shield" },
    credit:     { label: "Credit & appraisal",  icon: "checklist" },
    product:    { label: "Products & pricing",  icon: "grid" },
    ops:        { label: "Operations",          icon: "settings" },
    collect:    { label: "Collections",         icon: "route" },
    legal:      { label: "Legal & enforcement", icon: "scale" },
    service:    { label: "Service & grievance", icon: "headphones" },
    risk:       { label: "Risk & portfolio",    icon: "target" },
    compliance: { label: "Compliance & returns", icon: "checks" },
    aml:        { label: "Identification & AML", icon: "search" },
    digital:    { label: "Digital & partners",  icon: "globe" },
    treasury:   { label: "Finance & treasury",  icon: "chart" },
    wholesale:  { label: "Wholesale credit",    icon: "building" },
    capmkt:     { label: "Capital markets",     icon: "trend" },
    people:     { label: "People & conduct",    icon: "users" },
    audit:      { label: "Audit & inspection",  icon: "alert" },
  },

  /* ---------------- 7. the words people actually use ----------------
     This drives query expansion, so it is functional rather than
     decorative: a branch officer types POS and means principal
     outstanding, and retrieval has to know that.
  */
  glossary: [
    { term: "DPD", def: "days past due, the count of days an instalment has remained unpaid" },
    { term: "SMA", def: "special mention account, the pre-default stages SMA-0, SMA-1 and SMA-2 by days overdue" },
    { term: "NPA", def: "non performing asset, an account classified once overdue passes the prescribed period" },
    { term: "IRACP", def: "income recognition, asset classification and provisioning, the classification framework" },
    { term: "ECL", def: "expected credit loss, the Ind AS 109 provisioning model with its three stages" },
    { term: "PD", def: "probability of default, one of the three expected credit loss parameters" },
    { term: "LGD", def: "loss given default, the share of exposure not expected to be recovered" },
    { term: "EAD", def: "exposure at default, the balance expected to be outstanding when default occurs" },
    { term: "POS", def: "principal outstanding, the unpaid principal balance on a loan" },
    { term: "LTV", def: "loan to value, the exposure expressed against the assessed value of the security" },
    { term: "FOIR", def: "fixed obligation to income ratio, the share of income already committed to obligations" },
    { term: "EMI", def: "equated monthly instalment" },
    { term: "MHP", def: "minimum holding period, the seasoning a loan must complete before it can be transferred" },
    { term: "KFS", def: "key facts statement, the standard disclosure given to the borrower before sanction" },
    { term: "APR", def: "annual percentage rate, the all-inclusive cost of credit including fees and recoveries" },
    { term: "ROI", def: "rate of interest, contracted on a loan; not return on investment in this business" },
    { term: "TAT", def: "turnaround time, from login to sanction or from sanction to disbursal" },
    { term: "PDD", def: "post disbursement documents, the papers still outstanding after money has gone out" },
    { term: "RCU", def: "risk containment unit, the team that investigates suspected fraud in a file" },
    { term: "FI", def: "field investigation, the physical verification of a residence or business" },
    { term: "LAP", def: "loan against property, a secured loan against residential or commercial premises" },
    { term: "LAS", def: "loan against securities, lending against listed shares or mutual fund units" },
    { term: "MTF", def: "margin trade funding, funding a client's market purchases against a margin" },
    { term: "DSA", def: "direct selling agent, an external sourcing channel partner" },
    { term: "BC", def: "business correspondent, an agent who serves customers on behalf of the lender" },
    { term: "LSP", def: "lending service provider, an agent performing lending functions for a regulated entity" },
    { term: "DLA", def: "digital lending app, the customer facing application through which credit is offered" },
    { term: "DLG", def: "default loss guarantee, a contractual cover over a portfolio's defaults" },
    { term: "CLM", def: "co-lending, where two regulated entities each hold a share of the same loan" },
    { term: "DA", def: "direct assignment, the sale of a pool of loans without a securitisation structure" },
    { term: "PTC", def: "pass through certificate, the instrument issued in a securitisation" },
    { term: "SARFAESI", def: "the securitisation and reconstruction of financial assets and enforcement of security interest framework" },
    { term: "NACH", def: "national automated clearing house, the mandate based collection rail" },
    { term: "UMRN", def: "unique mandate reference number, the identifier of a registered mandate" },
    { term: "CKYC", def: "central know your customer registry, where identification records are filed" },
    { term: "CERSAI", def: "the central registry where security interests are registered" },
    { term: "CIMS", def: "the supervisory returns portal, which replaced the earlier filing system" },
    { term: "CRILC", def: "the central repository of information on large credits" },
    { term: "GNPA", def: "gross non performing assets, before provisions" },
    { term: "NNPA", def: "net non performing assets, after provisions" },
    { term: "PCR", def: "provision coverage ratio" },
    { term: "CoF", def: "cost of funds, the weighted average cost of the borrowing book" },
    { term: "NIM", def: "net interest margin, yield less cost of funds on average assets" },
    { term: "AUM", def: "assets under management, on-book plus assigned and co-lent exposure" },
    { term: "SBR", def: "scale based regulation, the framework placing lenders in base, middle, upper and top layers" },
    { term: "ICC", def: "investment and credit company, the category this entity is registered under" },
    { term: "HFC", def: "housing finance company, the subsidiary writing home loans" },
    { term: "MFI", def: "microfinance institution, the subsidiary writing joint liability group loans" },
    { term: "ALM", def: "asset liability management, matching the maturity of borrowings to assets" },
    { term: "CRAR", def: "capital to risk weighted assets ratio" },
    { term: "NOF", def: "net owned funds" },
    { term: "PSL", def: "priority sector lending, the categories that qualify under the priority sector framework" },
    { term: "RBIA", def: "risk based internal audit" },
    { term: "ATR", def: "action taken report, the response to an audit or inspection observation" },
    { term: "GRO", def: "grievance redressal officer" },
    { term: "PNO", def: "principal nodal officer, the escalation point for customer grievances" },
    { term: "STR", def: "suspicious transaction report, filed under the anti money laundering framework" },
    { term: "UPSI", def: "unpublished price sensitive information" },
    { term: "OTS", def: "one time settlement, a negotiated closure below the contracted dues" },
    { term: "FEMI", def: "first equated monthly instalment, the first repayment after disbursal" },
  ],

  /* ---------------- 8. roles ----------------
     Thirty-seven roles across ten functions, covering employees, external
     channel partners and agents. Clearance runs 1 to 4. The five
     restricting scopes are granted to almost nobody and never by rank:
     the managing director holds `upsi` because the disclosure process
     requires it, and does not hold `str`, because the statute does not
     care how senior anyone is.
  */
  roles: [],

  /* ---------------- 9. sign-in profiles ---------------- */
  users: [],

  /* ---------------- 10. guided tasks ---------------- */
  journeys: [],

  /* ---------------- 11. domain diagrams ---------------- */
  diagrams: [],

  /* ---------------- 12. the corpus ---------------- */
  kb: [],
};
