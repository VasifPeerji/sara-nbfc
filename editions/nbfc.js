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

  /* ---------------- 3a. retrieval depth ----------------
     Eight rather than the default five. The cross-document threads in this
     corpus need six or seven documents to resolve, and at five the causal
     documents fall outside the window while the symptoms stay inside it,
     which produces a confident answer about the wrong thing. */
  retrieval: { topK: 8 },

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
    service:    { label: "Service & grievance", icon: "users" },
    risk:       { label: "Risk & portfolio",    icon: "target" },
    compliance: { label: "Compliance & returns", icon: "checklist" },
    aml:        { label: "Identification & AML", icon: "search" },
    digital:    { label: "Digital & partners",  icon: "globe" },
    treasury:   { label: "Finance & treasury",  icon: "chart" },
    wholesale:  { label: "Wholesale credit",    icon: "building" },
    capmkt:     { label: "Capital markets",     icon: "trendup" },
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
    { term: "bounce", def: "the dishonour of a repayment instrument or mandate presentation, whether for want of funds or because the mandate was not registered" },
    { term: "dishonour", def: "a bounce, where a presented instalment is returned unpaid with a reason code" },
    { term: "field visit", def: "a collections officer visiting a borrower at the recorded address, allocated by bucket" },
    { term: "lead time", def: "the working days a sponsor bank takes to register and confirm a repayment mandate as active" },
    { term: "repossession", def: "taking possession of a financed vehicle on default, lawful only where every precondition in the procedure is satisfied and authorised in writing" },
    { term: "precondition", def: "something that must be true before possession is taken, confirmed by a named authority on the authorisation checklist" },
  ],

  /* ---------------- 8. roles ----------------
     Thirty-seven roles across ten functions, covering employees, external
     channel partners and agents. Clearance runs 1 to 4. The five
     restricting scopes are granted to almost nobody and never by rank:
     the managing director holds `upsi` because the disclosure process
     requires it, and does not hold `str`, because the statute does not
     care how senior anyone is.
  */
  roles: [

    /* ============ sourcing and distribution ============ */
    {
      key: "sales_officer",
      title: "Sales Officer",
      dept: "Sourcing",
      clearance: 1,
      scopes: ["policy", "product"],
      focus: "Sources personal, business and two-wheeler loans out of a branch in Nashik. Carries a monthly target, meets customers at their shop or home, and logs files on a phone.",
      persona: "This person is standing in front of a customer with the customer waiting. Answer in two or three short sentences, eligibility or documentation first. Never send them to read a policy: tell them the answer and name the document only so they know it is real. Be explicit about what they may say to a customer and what needs credit to confirm.",
      greeting: "Ask what a customer qualifies for, what papers to collect, what a scheme actually offers, and what you can and cannot commit to on the spot.",
      prompts: [
        { t: "Customer is self-employed with no ITR", s: "What can I still do?", q: "My customer runs a shop and has no income tax return. What income proof can I collect instead for a business loan?", icon: "user" },
        { t: "What documents for a two-wheeler loan?", s: "Full checklist", q: "What is the complete document checklist for a two-wheeler loan for a salaried customer?", icon: "checklist" },
        { t: "Can I promise this rate?", s: "What I may commit", q: "The customer is asking me to confirm the interest rate and the processing fee. What am I allowed to tell them before sanction?", icon: "alert" },
        { t: "Customer's CIBIL is 690", s: "Is it a decline?", q: "My customer has a bureau score of 690. Is that an automatic decline for a personal loan or can it go through with conditions?", icon: "chart" },
        { t: "How long until disbursal?", s: "Realistic timeline", q: "What is the normal turnaround from file login to disbursal for a business loan, and what usually delays it?", icon: "clock" },
      ],
    },
    {
      key: "dealer_exec",
      title: "Dealer Sales Executive",
      dept: "Sourcing · external",
      clearance: 1,
      scopes: ["product"],
      focus: "Sits at a commercial vehicle dealership in Nagpur and originates finance for vehicles sold on the floor. Employed by the dealer, not by Anvira.",
      persona: "An external partner at a dealer counter with a buyer waiting to drive away. Give the scheme terms and the document list plainly. This person does not work for Anvira, so never disclose internal policy reasoning, credit thresholds, deviation authority or anything about another customer. Where the answer depends on internal policy, give the outcome and name the Anvira contact.",
      greeting: "Ask about vehicle finance schemes, margins, documents and what the customer needs to bring today.",
      prompts: [
        { t: "What is the margin on a used tipper?", s: "Funding percentage", q: "How much of a used tipper's value can be funded and what decides the margin?", icon: "truck" },
        { t: "Subvention scheme terms", s: "What is live now", q: "What are the terms of the current dealer subvention scheme on new commercial vehicles?", icon: "grid" },
        { t: "Documents for a fleet buyer", s: "Company-owned vehicles", q: "A transport company wants to buy three vehicles in the company name. What documents do I collect?", icon: "checklist" },
        { t: "Customer wants same-day delivery", s: "What is possible", q: "The customer wants to take delivery today. What has to be complete before the vehicle can be released?", icon: "clock" },
        { t: "Who do I call at Anvira?", s: "Escalation route", q: "A file is stuck at the credit stage. Who at Anvira do I contact and what do they need from me?", icon: "users" },
      ],
    },
    {
      key: "dsa_principal",
      title: "Direct Sourcing Agent, Principal",
      dept: "Sourcing · external",
      clearance: 1,
      scopes: ["policy", "product"],
      focus: "Runs a loan agency in Pune with eleven staff, sourcing loan against property and business loans for four lenders including Anvira.",
      persona: "An external channel partner who also works for competitors. Answer product and process questions fully, because that is what makes the channel productive. Never disclose credit policy thresholds, scorecard logic, deviation authority, pricing floors or anything about another partner's performance. Be direct about conduct obligations, because the lender carries what this agency does.",
      greeting: "Ask about products, eligibility, documentation, payout terms and the conduct rules your team has to follow.",
      prompts: [
        { t: "What are my team's conduct obligations?", s: "Sourcing conduct", q: "What conduct rules apply to my staff when they collect documents and talk to customers on Anvira's behalf?", icon: "shield" },
        { t: "Property types you will not fund", s: "Negative list", q: "Which property types are on the negative list for loan against property?", icon: "building" },
        { t: "When is a file considered logged?", s: "Login criteria", q: "What has to be present before a loan against property file counts as logged rather than pending?", icon: "checklist" },
        { t: "Payout on a rejected file", s: "How it works", q: "How does payout work when a file is sanctioned but not disbursed, or disbursed and then foreclosed early?", icon: "rupee" },
        { t: "Customer data I collect", s: "What I must not do", q: "What are the rules on storing and sharing customer documents that my staff collect?", icon: "lock" },
      ],
    },
    {
      key: "bc_agent",
      title: "Business Correspondent",
      dept: "Microfinance · external",
      clearance: 1,
      scopes: ["policy", "product", "mfi"],
      focus: "Serves twenty-two joint liability groups across four villages in Bihar for Anvira Microfinance. Conducts centre meetings, collects instalments in cash and remits the same day.",
      persona: "Works in a village with a group of women waiting at a centre meeting. Answer in short, concrete sentences. Household income limits, group rules and collection conduct are the daily questions. Be exact about cash handling and receipting, because that is where trust and fraud both live. Never discuss another group's or another member's position.",
      greeting: "Ask about group rules, eligibility, instalment collection, receipting and what to do when a member cannot pay.",
      prompts: [
        { t: "A member cannot pay this week", s: "What happens to the group", q: "One member of a joint liability group cannot pay her instalment this week. What am I supposed to do?", icon: "users" },
        { t: "Household income limit", s: "Who qualifies", q: "What is the household income limit for a microfinance loan and how is household income worked out?", icon: "chart" },
        { t: "Cash collected today", s: "Remittance rules", q: "What are the rules on how quickly I have to remit cash I collect at a centre meeting, and what receipt does the member get?", icon: "rupee" },
        { t: "Member wants a second loan", s: "Indebtedness rules", q: "A member already has loans from two other lenders. Can she take one from us as well?", icon: "alert" },
        { t: "Group wants to meet somewhere else", s: "Centre meeting rules", q: "The group wants to change the centre meeting place and time. What are the rules on that?", icon: "calendar" },
      ],
    },
    {
      key: "branch_manager",
      title: "Branch Manager",
      dept: "Sourcing",
      clearance: 2,
      scopes: ["policy", "product", "credit", "ops", "service", "collect", "gold", "people"],
      focus: "Runs a branch in Indore with nineteen staff across sourcing, operations, gold loan and collections. Owns the branch profit and loss, the cash, the vault and the customer complaints that reach the counter.",
      persona: "A frontline leader deciding something now with a customer or an auditor in front of them. Give the decision first, then the two conditions it depends on, then what must be recorded. Be precise about what they may authorise themselves and what has to go up, because that boundary is where branch findings come from.",
      greeting: "Ask about branch decisions: file quality, cash and vault, gold appraisal, customer escalations, collections at the counter, and what has to be recorded before it goes up.",
      prompts: [
        { t: "Customer disputes a bounce charge", s: "Can I waive it?", q: "A customer is at the counter disputing a bounce charge. Can I waive it at the branch, and what do I record?", icon: "users" },
        { t: "Vault holding above limit", s: "What do I do today", q: "Gold pledged at the branch has taken the vault above its holding limit. What am I required to do?", icon: "lock" },
        { t: "Top-up is blocked and I do not know why", s: "Who do I ask", q: "A long-standing customer's top-up disbursal is blocked in the system and I cannot see a reason. What do I do and who do I contact?", icon: "alert" },
        { t: "Deviation I can approve", s: "My authority", q: "Which credit deviations can I approve at branch level and which have to go to the regional credit manager?", icon: "checklist" },
        { t: "Field agent complaint", s: "Handling it properly", q: "A customer says our field collections agent visited at night and spoke to her neighbour. What am I required to do?", icon: "shield" },
      ],
    },
    {
      key: "area_sales",
      title: "Area Sales Manager",
      dept: "Sourcing",
      clearance: 3,
      scopes: ["policy", "product", "credit", "risk", "digital", "people"],
      focus: "Covers eleven branches across western Maharashtra for retail secured and unsecured lending. Owns volume, mix, channel productivity and the early delinquency that comes back from what was sourced.",
      persona: "Manages through numbers and other people. Wants the pattern, not the case. Lead with what the portfolio is doing, then the likely cause, then the specific branches or channels involved. This person can see risk material, so be direct about early delinquency and sourcing quality rather than softening it.",
      greeting: "Ask about volume and mix, channel productivity, early delinquency, scheme performance and where sourcing quality is slipping.",
      prompts: [
        { t: "First EMI bounces are up in my area", s: "Why", q: "First instalment bounce rates have risen in my area over the last two months. What is driving it?", icon: "trendup" },
        { t: "Which channel is sourcing the worst files?", s: "Sourcing quality", q: "Which sourcing channels in my area are producing the highest early delinquency relative to volume?", icon: "chart" },
        { t: "Is the subvention scheme working?", s: "Scheme performance", q: "Is the used commercial vehicle subvention scheme actually producing profitable volume or just cheaper volume?", icon: "grid" },
        { t: "Turnaround is slipping", s: "Where is the delay", q: "My branches are complaining that sanction turnaround has slipped. Where in the process is the time going?", icon: "clock" },
        { t: "Digital leads are not converting", s: "Funnel drop-off", q: "Leads coming from the digital channel are converting far below branch-sourced leads. Where are they dropping off?", icon: "globe" },
      ],
    },

    /* ============ credit ============ */
    {
      key: "cpa",
      title: "Credit Processing Associate",
      dept: "Credit",
      clearance: 1,
      scopes: ["credit", "ops"],
      focus: "Logs files at the Pune credit hub, runs deduplication and bureau checks, raises queries back to sourcing and prepares the file for the credit manager.",
      persona: "Working through a queue with a turnaround clock running. Answer with the specific requirement and where it comes from. This person's job is completeness, so be exact about what makes a document acceptable rather than describing it loosely.",
      greeting: "Ask what makes a document acceptable, what a query should say, when a file can move forward and when it goes back.",
      prompts: [
        { t: "Is this address proof acceptable?", s: "Officially valid documents", q: "The customer has given a utility bill in his father's name. Is that acceptable as address proof?", icon: "checklist" },
        { t: "Bureau shows a settled account", s: "Does it block the file?", q: "The bureau report shows an account settled two years ago. Does that block the file or is it a deviation?", icon: "chart" },
        { t: "Duplicate customer match", s: "What do I do", q: "Deduplication has flagged a possible match with an existing customer. What do I check before I proceed?", icon: "search" },
        { t: "Bank statement is only four months", s: "Is that enough", q: "The customer has given four months of bank statements. What period is required and can I proceed?", icon: "calendar" },
        { t: "How do I write a query?", s: "Query standards", q: "What is the standard for raising a query back to sourcing so that it does not bounce a second time?", icon: "mail" },
      ],
    },
    {
      key: "fi_officer",
      title: "Field Investigation Officer",
      dept: "Credit",
      clearance: 1,
      scopes: ["credit", "ops"],
      focus: "Verifies residence and business addresses across Coimbatore, photographs premises, interviews neighbours and files a verification report the same day.",
      persona: "Standing outside a house or a shop with a phone. Answer in short sentences with the requirement first. This person's report becomes evidence in a fraud investigation later, so be exact about what has to be recorded and photographed, and blunt about what must never be assumed or filled in afterwards.",
      greeting: "Ask what a verification has to capture, what makes a report negative, and what to do when nobody is there.",
      prompts: [
        { t: "Nobody is home", s: "What do I record", q: "There is nobody at the residence address. Do I mark it negative or come back, and what do I record?", icon: "alert" },
        { t: "Shop exists but is not his", s: "Business verification", q: "The shop at the business address exists but the neighbours say it belongs to someone else. How do I report that?", icon: "building" },
        { t: "What photographs are required?", s: "Evidence standard", q: "What photographs and geotagging are required for a residence verification to be accepted?", icon: "grid" },
        { t: "Customer offered me tea and money", s: "What I do", q: "The customer offered me money to write a positive report. What am I required to do?", icon: "shield" },
        { t: "Address does not exist", s: "Negative report", q: "The address on the application does not exist at all. What does my report have to say and who does it go to?", icon: "search" },
      ],
    },
    {
      key: "credit_manager",
      title: "Credit Manager",
      dept: "Credit",
      clearance: 2,
      scopes: ["policy", "credit", "product", "ops", "risk"],
      focus: "Underwrites secured and unsecured retail files at the Pune hub within a delegated authority. Decides, conditions or declines around forty files a week.",
      persona: "Making a decision that will be audited. Give the policy position first, then the deviations the file carries, then who can clear each one. Never soften a decline into a maybe. Be exact about what has to be minuted, because an approval taken outside delegation has to be unwound later.",
      greeting: "Ask about credit policy, appraisal, deviations, approval authority, compensating controls and what has to go on the file.",
      prompts: [
        { t: "Two deviations on one file", s: "Who approves", q: "This file carries both a bureau score deviation and a loan to value deviation. Who can approve that combination?", icon: "checklist" },
        { t: "Income is seasonal", s: "How do I assess", q: "The applicant's income is seasonal and swings by half between quarters. How does the policy say I assess repayment capacity?", icon: "chart" },
        { t: "Valuation looks inflated", s: "What are my options", q: "The valuation on this property looks high against the surrounding market. What are my options under policy?", icon: "building" },
        { t: "Guarantor instead of collateral", s: "Is it allowed", q: "Can a personal guarantee substitute for the shortfall in collateral cover, and what does it require?", icon: "users" },
        { t: "Can I approve my own deviation?", s: "Delegation limits", q: "Which deviation combinations are not delegable at any level, and what happens to a file that carries one?", icon: "alert" },
      ],
    },
    {
      key: "rcm",
      title: "Regional Credit Manager",
      dept: "Credit",
      clearance: 3,
      scopes: ["policy", "credit", "product", "ops", "risk", "legal"],
      focus: "Holds the regional credit authority for western India across secured and unsecured retail. Clears escalated deviations, owns regional portfolio quality and sits on the regional credit committee.",
      persona: "Decides the cases that were too difficult for the hub, and answers to the chief credit officer for the portfolio that results. Lead with the position and the precedent. This person needs to see the pattern behind a case, so connect the file in front of them to what the portfolio is doing.",
      greeting: "Ask about escalated deviations, portfolio quality, policy interpretation, precedent and where the region's credit decisions are drifting.",
      prompts: [
        { t: "Deviation approvals are rising", s: "Is policy too tight?", q: "Deviation approvals in my region have risen sharply this quarter. Is that a policy problem or a sourcing problem?", icon: "trendup" },
        { t: "One branch keeps escalating", s: "Pattern or capability", q: "One branch escalates far more files than its peers. What does the pattern in those files tell us?", icon: "chart" },
        { t: "Restructure a stressed borrower", s: "What is permitted", q: "A business loan borrower has asked for a restructuring. What is permitted and what does it do to classification?", icon: "route" },
        { t: "Policy says one thing, product note another", s: "Which governs", q: "The credit policy and the product note give different loan to value ceilings for the same product. Which governs?", icon: "alert" },
        { t: "Early delinquency in one scheme", s: "Root cause", q: "One scheme is producing early delinquency well above the rest of the book. What is actually causing it?", icon: "search" },
      ],
    },
    {
      key: "cco",
      title: "Chief Credit Officer",
      dept: "Credit",
      clearance: 4,
      scopes: ["policy", "credit", "product", "ops", "risk", "wholesale", "capmkt", "gold", "mfi"],
      focus: "Owns credit policy, the delegation matrix and portfolio quality across every product and both subsidiaries. Chairs the credit committee.",
      persona: "Sets the rules everybody else works to. Wants the portfolio consequence, not the case. Lead with what the book is doing and what in policy is producing it. Be willing to say that a policy is the problem, because this person can change it.",
      greeting: "Ask about credit policy across the book, delegation, portfolio quality, product performance and where policy is producing the wrong outcome.",
      prompts: [
        { t: "Which product is losing money on credit?", s: "Portfolio view", q: "Across the book, which products are carrying credit losses that the pricing does not cover?", icon: "chart" },
        { t: "Is the delegation matrix working?", s: "Approval quality", q: "Are deviation approvals concentrated where the delegation matrix intended, and where are they drifting?", icon: "checklist" },
        { t: "Unsecured book is growing fastest", s: "Should it be?", q: "The unsecured book is growing faster than anything else. What does its vintage behaviour say about whether it should be?", icon: "trendup" },
        { t: "Same borrower across three products", s: "Aggregate exposure", q: "How do we see aggregate exposure when a borrower holds a vehicle loan, a business loan and a gold loan across different systems?", icon: "search" },
        { t: "Policy change nobody applied", s: "Implementation gap", q: "Where has a credit policy change been issued but not actually implemented in the branches or the system?", icon: "alert" },
      ],
    },

    /* ============ wholesale and capital markets ============ */
    {
      key: "wholesale_rm",
      title: "Relationship Manager, Wholesale",
      dept: "Wholesale",
      clearance: 3,
      scopes: ["wholesale", "credit", "product", "risk", "legal"],
      focus: "Covers structured finance, promoter funding and real estate exposures for mid-market corporates out of Mumbai. Twenty-eight live relationships, each with its own covenant package.",
      persona: "Manages a small number of large, individually negotiated exposures where the documentation is the product. Answer with the covenant, the test and the consequence. This person is asked by the borrower for flexibility and by risk for discipline, so be exact about what the facility agreement actually permits.",
      greeting: "Ask about covenants, security cover, drawdown conditions, monitoring obligations and what a facility agreement actually allows.",
      prompts: [
        { t: "Security cover has slipped", s: "What is the consequence", q: "Security cover on a promoter funding facility has fallen below the covenanted level. What happens now?", icon: "alert" },
        { t: "Borrower wants a covenant waiver", s: "Who can give it", q: "A real estate borrower has asked for a waiver of the quarterly financial covenant. Who can approve that and what does it require?", icon: "checklist" },
        { t: "Escrow is not being routed", s: "Project monitoring", q: "Project receivables are not flowing through the designated escrow. What are our rights and what do I do first?", icon: "route" },
        { t: "When is a covenant test due?", s: "Monitoring calendar", q: "What are the covenant testing dates and reporting obligations across my portfolio this quarter?", icon: "calendar" },
        { t: "Drawdown conditions not met", s: "Can it still fund", q: "The borrower wants the next tranche but two conditions precedent are outstanding. What are my options?", icon: "rupee" },
      ],
    },
    {
      key: "capmkt_ops",
      title: "Capital Markets Lending Officer",
      dept: "Capital markets",
      clearance: 2,
      scopes: ["capmkt", "ops", "credit", "product"],
      focus: "Runs the loan against securities and margin trade funding book from Mumbai: daily valuation, margin calls, top-ups, pledge creation and invocation.",
      persona: "Works against moving prices with a same-day clock. Lead with the number and the deadline. This is the one part of the book where a missed call becomes a loss the same week, so be exact about cure windows and what triggers invocation.",
      greeting: "Ask about eligible securities, cover, margin calls, cure periods, pledge creation and invocation.",
      prompts: [
        { t: "Cover has fallen below the limit", s: "What happens today", q: "Cover on a loan against securities account has fallen below the required level. What has to happen today?", icon: "alert" },
        { t: "Is this security eligible?", s: "Approved list", q: "The client wants to pledge a small-cap share that is not on the approved list. What are the rules?", icon: "checklist" },
        { t: "Client did not meet the margin call", s: "Invocation", q: "The client has not met a margin call within the cure period. What is the invocation process and who authorises it?", icon: "route" },
        { t: "Employee stock option funding", s: "How it works", q: "What are the terms and conditions for funding an employee stock option exercise?", icon: "grid" },
        { t: "Public issue financing limits", s: "Per applicant", q: "What limits apply to financing a client's application in a public issue?", icon: "chart" },
      ],
    },

    /* ============ risk ============ */
    {
      key: "portfolio_risk",
      title: "Portfolio Risk Analyst",
      dept: "Risk",
      clearance: 3,
      scopes: ["risk", "credit", "fincon", "digital"],
      focus: "Analyses vintage, roll rates, delinquency and expected credit loss across every product. Builds the monthly risk pack and the quarterly provisioning inputs.",
      persona: "Lives in the numbers and is expected to explain them. Lead with what moved, then by how much, then what is actually causing it. Never present a correlation as a cause. Be explicit about which figures come from which document, because these numbers end up in the provisioning.",
      greeting: "Ask about vintage, roll rates, delinquency, concentration, expected credit loss and where a portfolio number is coming from.",
      prompts: [
        { t: "Bucket movement changed this month", s: "What moved", q: "Roll rates from the thirty day bucket worsened this month. Which products and which regions are driving it?", icon: "trendup" },
        { t: "Is this a credit problem?", s: "Or something else", q: "First instalment bounce rates jumped in one region for one product but the score distribution is unchanged. What else could cause that?", icon: "search" },
        { t: "Stage 2 migration", s: "Expected credit loss", q: "What is moving accounts into stage two this quarter and what does it do to the provision?", icon: "chart" },
        { t: "Concentration in the wholesale book", s: "Where is the risk", q: "Where is exposure concentrated in the wholesale book by sector, group and geography?", icon: "grid" },
        { t: "Collection efficiency versus delinquency", s: "They disagree", q: "Collection efficiency looks stable but delinquency is rising. How can both be true?", icon: "alert" },
      ],
    },
    {
      key: "rcu_officer",
      title: "Risk Containment Unit Officer",
      dept: "Risk",
      clearance: 3,
      scopes: ["risk", "credit", "ops", "legal", "custpii"],
      focus: "Investigates suspected fraud in loan files: forged income documents, manipulated valuations, collusive sourcing and identity substitution. Samples files and runs case investigations.",
      persona: "Building a case that may end in a police complaint or a staff dismissal, so precision matters more than speed. Be exact about evidence, chain of custody and what may be recorded about a named individual. This person holds customer information; that does not extend to financial crime case material, which is a separate designation.",
      greeting: "Ask about fraud typologies, sampling, evidence standards, case documentation and the referral routes.",
      prompts: [
        { t: "Income documents look fabricated", s: "How do I prove it", q: "Salary slips on several files from one sourcing agent look fabricated. What evidence do I need before I can call it fraud?", icon: "search" },
        { t: "Same valuer on every inflated file", s: "Collusion", q: "The same empanelled valuer appears on every file where the valuation looks inflated. How do I take that forward?", icon: "alert" },
        { t: "Employee may be involved", s: "What is the process", q: "The pattern suggests a branch employee is involved. What is the process and who do I notify first?", icon: "users" },
        { t: "Reporting a fraud", s: "Internal and external", q: "Once a case is established, what are the internal reporting steps and the external reporting obligations?", icon: "checklist" },
        { t: "Customer says it was not him", s: "Identity substitution", q: "A customer says he never took the loan that is in his name. How do I investigate a suspected identity substitution?", icon: "shield" },
      ],
    },
    {
      key: "cro",
      title: "Chief Risk Officer",
      dept: "Risk",
      clearance: 4,
      scopes: ["risk", "credit", "policy", "fincon", "compliance", "wholesale", "capmkt", "ops", "collect", "mfi", "gold"],
      focus: "Independent of business. Owns the risk appetite statement, the risk pack to the board risk committee, and the challenge to credit and business on where the book is going.",
      persona: "Paid to say the uncomfortable thing early. Lead with the exposure and the trajectory, not the reassurance. Where several documents together suggest a problem that no single document states, say so plainly and name the documents. Distinguish clearly between what is measured and what is inferred.",
      greeting: "Ask about risk appetite, portfolio trajectory, concentration, emerging exposures and where the book is drifting away from what was approved.",
      prompts: [
        { t: "What is the biggest emerging risk?", s: "Across the book", q: "Looking across the whole book, what is the largest risk that is building but not yet showing in the delinquency numbers?", icon: "alert" },
        { t: "Are we inside risk appetite?", s: "Against the statement", q: "Which portfolios are operating outside the limits set in the risk appetite statement?", icon: "target" },
        { t: "Something is wrong in one region", s: "Connect the evidence", q: "Complaints, first instalment bounces and field visit costs are all rising in one region at once. What connects them?", icon: "search" },
        { t: "Co-lending exposure", s: "What do we actually hold", q: "Across the co-lending arrangements, what exposure do we actually retain and is it what we intended?", icon: "grid" },
        { t: "An audit finding keeps recurring", s: "Why is it not fixed", q: "The same internal audit observation has recurred across three cycles. Why has it not been closed?", icon: "checklist" },
      ],
    },

    /* ============ operations ============ */
    {
      key: "loan_ops",
      title: "Loan Operations Executive",
      dept: "Operations",
      clearance: 1,
      scopes: ["ops", "credit"],
      focus: "Prepares agreements, checks sanction conditions, registers mandates and releases disbursals from the Pune central operations unit.",
      persona: "The last check before money leaves. Answer with the requirement and where it is written. This person is the control, so be blunt about what must be complete before disbursal and what can never be treated as a post-disbursal item.",
      greeting: "Ask about agreements, sanction conditions, mandates, disbursal checks and what has to be complete before money goes out.",
      prompts: [
        { t: "Can this disburse today?", s: "Pre-disbursal checks", q: "What has to be complete before a loan against property file can be disbursed?", icon: "checklist" },
        { t: "Mandate registration failed", s: "What are my options", q: "The electronic mandate registration failed at the sponsor bank. What are the alternatives and how long do they take?", icon: "alert" },
        { t: "Sanction condition not met", s: "Can it be a PDD", q: "One sanction condition is outstanding. Can it be carried as a post-disbursement document or does it block disbursal?", icon: "checklist" },
        { t: "Part disbursement request", s: "How it works", q: "The customer wants the loan released in two tranches. What does the policy require for a part disbursement?", icon: "rupee" },
        { t: "Agreement signed at the wrong place", s: "Execution defects", q: "The agreement was signed but the stamping is from the wrong state. What is the consequence and what do I do?", icon: "scale" },
      ],
    },
    {
      key: "pdd_officer",
      title: "Documentation and PDD Officer",
      dept: "Operations",
      clearance: 2,
      scopes: ["ops", "legal", "credit"],
      focus: "Tracks every document still outstanding after disbursal across the secured book: registration certificates with the hypothecation endorsement, registered mortgages, insurance copies, security interest filings and end use evidence.",
      persona: "Chases documents that everybody else considers finished business. Lead with the clock: what is due, when it was due, and what the exposure looks like if it is never received. Be exact about which documents change the security position rather than merely the file's tidiness.",
      greeting: "Ask about outstanding post-disbursement documents, the timelines that govern them, escalation and what an open item actually costs us.",
      prompts: [
        { t: "What is overdue right now?", s: "Ageing view", q: "Which post-disbursement documents are overdue across the secured book and by how long?", icon: "clock" },
        { t: "Registration certificate not received", s: "Vehicle finance", q: "The registration certificate with our hypothecation endorsement has not come back. What is the timeline and what do I do now?", icon: "truck" },
        { t: "Does an open PDD change our security?", s: "Real consequence", q: "Which outstanding documents actually leave the exposure unsecured rather than just incomplete?", icon: "alert" },
        { t: "Security interest not registered", s: "Registry filing", q: "A security interest was not filed with the registry within the window. What is the consequence and can it be cured?", icon: "scale" },
        { t: "Escalation for a stuck document", s: "Who owns it", q: "A document has been outstanding for four months and the branch is not responding. What is the escalation route?", icon: "route" },
      ],
    },
    {
      key: "gold_appraiser",
      title: "Gold Appraiser and Vault Custodian",
      dept: "Operations · gold",
      clearance: 1,
      scopes: ["gold", "ops"],
      focus: "Appraises pledged ornaments at a branch in Thrissur, records purity and weight in the customer's presence, seals the packet and holds the vault key jointly with the branch manager.",
      persona: "Handling somebody's family gold in front of them. Answer with the procedure step and the record it produces. Be exact about what must happen in the customer's presence and what must be recorded, because that is what protects both the customer and the appraiser.",
      greeting: "Ask about appraisal method, purity and weight recording, packet sealing, vault custody, release and auction procedure.",
      prompts: [
        { t: "Customer disputes the purity", s: "What do I do", q: "The customer disagrees with the purity I have assessed. What does the procedure require me to do?", icon: "alert" },
        { t: "Must the customer be present?", s: "Appraisal rules", q: "What parts of the appraisal have to happen in the customer's presence and what has to be recorded?", icon: "users" },
        { t: "Ornament has stones in it", s: "How do I weigh it", q: "The ornament has stones set into it. How do I arrive at the net weight for funding?", icon: "target" },
        { t: "Releasing the packet at closure", s: "Timeline and record", q: "The customer has closed the loan. What is the timeline for releasing the ornaments and what do I record?", icon: "lock" },
        { t: "Packet seal is broken", s: "What now", q: "A sealed packet in the vault has a broken seal. What am I required to do?", icon: "shield" },
      ],
    },
    {
      key: "central_ops",
      title: "Central Operations Manager",
      dept: "Operations",
      clearance: 3,
      scopes: ["ops", "credit", "collect", "service", "compliance", "gold", "capmkt", "custpii"],
      focus: "Runs the central operations unit: disbursal, documentation, mandate management, receipt application, reconciliation and the registry filings. Owns turnaround and the operational control environment.",
      persona: "Sees the whole processing pipeline and where it breaks. Lead with the volume and the failure rate, then the cause, then the fix. This person holds customer information but not financial crime case material, and the boundary matters: hold instructions arrive here without a reason attached, and that is by design.",
      greeting: "Ask about processing volumes, turnaround, reconciliation, mandate and receipt failures, registry filings and where the pipeline is breaking.",
      prompts: [
        { t: "Mandate failures at one bank", s: "Pattern", q: "Electronic mandate registrations are failing at one sponsor bank far more than the rest. What is happening?", icon: "alert" },
        { t: "Unapplied receipts", s: "Reconciliation", q: "How many receipts are sitting unapplied and what is stopping them from matching to accounts?", icon: "rupee" },
        { t: "A hold instruction with no reason", s: "What do I do", q: "We have received an instruction to place an account under a monitoring hold with no reason stated. What is the correct handling?", icon: "lock" },
        { t: "Registry filings overdue", s: "Compliance exposure", q: "Which registry filings are approaching or past their window, and what is the exposure?", icon: "clock" },
        { t: "Turnaround has slipped", s: "Where", q: "Where in the disbursal pipeline is turnaround being lost, and is it people, documents or the system?", icon: "route" },
      ],
    },

    /* ============ collections and recovery ============ */
    {
      key: "tele_collections",
      title: "Tele-collections Agent",
      dept: "Collections",
      clearance: 1,
      scopes: ["collect", "service"],
      focus: "Calls customers in the early delinquency buckets from the Jaipur collections centre. Around ninety connected calls a day, mostly one to thirty days past due.",
      persona: "On a call right now with a customer who may be angry, embarrassed or genuinely unable to pay. Give the permitted words and the permitted options, in order. Be absolutely exact about calling hours, who may be spoken to and what may never be said, because this is where conduct complaints are made.",
      greeting: "Ask what you may say, what you may offer, who you may call, and what to do when a customer refuses or disputes.",
      prompts: [
        { t: "Customer is abusive", s: "What do I do", q: "The customer is abusive on the call and refuses to discuss the account. What am I supposed to do?", icon: "alert" },
        { t: "Can I call his brother?", s: "Third party contact", q: "The customer is not answering. Can I call the reference number he gave, and what can I say to them?", icon: "users" },
        { t: "Customer promises to pay Friday", s: "Recording a promise", q: "The customer has promised to pay on Friday. How do I record that and what happens if it is broken?", icon: "calendar" },
        { t: "He says he already paid", s: "Disputed payment", q: "The customer says he already paid and we have not credited it. What do I do on the call?", icon: "search" },
        { t: "What hours can I call?", s: "Contact rules", q: "What are the permitted hours and frequency for contacting a customer about an overdue instalment?", icon: "clock" },
      ],
    },
    {
      key: "field_collections",
      title: "Field Collections Officer",
      dept: "Collections",
      clearance: 1,
      scopes: ["collect"],
      focus: "Visits delinquent customers across suburban Chennai in the sixty to one hundred and eighty day buckets. Collects, negotiates and reports back the same evening.",
      persona: "Standing at somebody's door, often with neighbours watching. Answer with what is permitted and what is not, in short sentences. Be blunt about the conduct line: this person's behaviour is the lender's behaviour, and one visit outside the rules becomes a complaint that outlives the recovery.",
      greeting: "Ask what a visit may and may not involve, what you can collect and receipt, and what to do when the customer is not there or will not pay.",
      prompts: [
        { t: "Customer is not at home", s: "Can I ask around", q: "The customer is not at home. Can I ask the neighbours about him and what may I tell them?", icon: "users" },
        { t: "He offers part payment", s: "Can I take it", q: "The customer is offering half the overdue amount in cash. Can I accept it and what receipt do I give?", icon: "rupee" },
        { t: "He says he will pay if I take the vehicle", s: "Surrender", q: "The customer says he cannot pay and wants to surrender the vehicle. What is the correct process?", icon: "truck" },
        { t: "Family says he is unwell", s: "What now", q: "The family says the customer is seriously ill in hospital. What am I supposed to do?", icon: "shield" },
        { t: "What am I not allowed to do?", s: "Conduct line", q: "What is a field collections officer specifically prohibited from doing during a visit?", icon: "alert" },
      ],
    },
    {
      key: "repo_coordinator",
      title: "Repossession and Yard Coordinator",
      dept: "Collections",
      clearance: 2,
      scopes: ["collect", "legal", "ops"],
      focus: "Coordinates vehicle repossession across Tamil Nadu: agent allocation, notice tracking, inventory at the yard, valuation and sale. Holds the yard register.",
      persona: "Arranging something that is lawful only if every precondition is met, and expensive to unwind if it is not. Lead with the preconditions, in order, and say plainly when one is missing. Never help arrange a step that the contract or the notice position does not support.",
      greeting: "Ask about repossession preconditions, notices, agent authorisation, inventory, valuation, sale and release.",
      prompts: [
        { t: "Can this vehicle be repossessed?", s: "Preconditions", q: "What has to be true before a vehicle can be repossessed, and who confirms each item?", icon: "checklist" },
        { t: "Agreement may not have the clause", s: "Older contract", q: "This loan was executed on an older agreement template. How do I check whether it carries the repossession clause?", icon: "scale" },
        { t: "Customer has a complaint open", s: "Does it stop us", q: "The customer has an unresolved grievance on the account. Does that affect a repossession?", icon: "alert" },
        { t: "Inventory at the yard", s: "What must be recorded", q: "What has to be recorded and photographed when a repossessed vehicle arrives at the yard?", icon: "grid" },
        { t: "Customer wants it back", s: "Release before sale", q: "The customer has come with money before the sale. What are the release rules?", icon: "route" },
      ],
    },
    {
      key: "acm",
      title: "Area Collections Manager",
      dept: "Collections",
      clearance: 3,
      scopes: ["collect", "legal", "risk", "ops", "service", "people"],
      focus: "Runs collections across nine branches in Tamil Nadu, in-house teams and three empanelled agencies. Owns bucket movement, resolution rate, agency performance and the conduct of everyone recovering in the area.",
      persona: "Accountable both for recovery and for how it is achieved, and those pull against each other. Lead with the number, then the conduct exposure it might be creating. Be direct about agency performance, because an agency that recovers well and behaves badly is a liability, not an asset.",
      greeting: "Ask about bucket movement, resolution, agency performance, settlement authority, conduct exposure and legal escalation.",
      prompts: [
        { t: "One agency recovers well but generates complaints", s: "What do I do", q: "One empanelled agency has the best resolution rate in the area and also the most conduct complaints. How do I handle that?", icon: "alert" },
        { t: "Settlement authority", s: "What can I approve", q: "What settlement can I approve at area level and what has to go to the head of collections?", icon: "checklist" },
        { t: "Bucket is not rolling back", s: "Why", q: "The sixty to ninety day bucket is not rolling back the way it did last quarter. What has changed?", icon: "trendup" },
        { t: "When do we go legal?", s: "Escalation criteria", q: "At what point does an account move from field collections to legal recovery, and who decides?", icon: "scale" },
        { t: "Agents contacting at night", s: "Conduct breach", q: "I have evidence that an agency's staff are calling customers after permitted hours. What am I required to do?", icon: "shield" },
      ],
    },
    {
      key: "legal_recovery",
      title: "Legal and Recovery Officer",
      dept: "Legal",
      clearance: 3,
      scopes: ["legal", "collect", "ops", "privileged"],
      focus: "Runs the legal recovery pipeline for western India: enforcement of security interests, dishonoured cheque proceedings, arbitration, settlement conferences and execution.",
      persona: "Works to statutory processes where a procedural defect loses the case. Lead with the step, the limitation and the document that must exist. Be exact about what has already been done and what cannot be done retrospectively. This person holds privileged advice on live matters; nobody else does.",
      greeting: "Ask about enforcement, notices, dishonoured cheque proceedings, arbitration, limitation and settlement conferences.",
      prompts: [
        { t: "Notice period has expired", s: "Next step", q: "The demand notice period has expired and there has been no response. What is the next step and what has to be on file?", icon: "route" },
        { t: "Cheque bounced, what is the clock?", s: "Limitation", q: "A cheque has been dishonoured. What are the notice and filing timelines and what happens if we miss them?", icon: "clock" },
        { t: "Can we enforce on this security?", s: "Eligibility", q: "Which exposures are eligible for enforcement of the security interest and which are not?", icon: "scale" },
        { t: "Borrower has approached a forum", s: "Effect on us", q: "The borrower has approached a forum challenging the classification. What does that do to our recovery steps?", icon: "alert" },
        { t: "Settlement conference", s: "How we prepare", q: "What do we need to prepare before a settlement conference and who can commit to the terms?", icon: "users" },
      ],
    },
    {
      key: "head_collections",
      title: "Head of Collections",
      dept: "Collections",
      clearance: 4,
      scopes: ["collect", "legal", "risk", "policy", "ops", "service", "people", "mfi", "gold"],
      focus: "Owns collections and recovery across every product and both subsidiaries: in-house teams, tele-calling centres, field agencies, the legal pipeline and the write-off recommendation to the committee.",
      persona: "Answers for the money recovered and for every complaint the recovery generated. Lead with the portfolio position, then the conduct exposure, then the structural cause. Willing to hear that the collections problem originated in credit or operations, and interested in evidence for it.",
      greeting: "Ask about recovery performance, agency network, conduct exposure, settlement and write-off policy, and where collections is being handed a problem made elsewhere.",
      prompts: [
        { t: "Where is recovery underperforming?", s: "Across the book", q: "Which products and regions are underperforming on recovery relative to their delinquency profile?", icon: "chart" },
        { t: "Are complaints structural?", s: "Conduct pattern", q: "Are our recovery-related complaints concentrated in particular agencies, products or regions, and what does that say?", icon: "alert" },
        { t: "Cases collections should not be chasing", s: "Wrong problem", q: "Are there accounts in collections that are actually operational failures rather than genuine defaults?", icon: "search" },
        { t: "Write-off recommendation", s: "What supports it", q: "What has to be established before an account can be recommended for write-off?", icon: "checklist" },
        { t: "Cost of recovery", s: "Is it worth it", q: "What does recovery actually cost us per rupee recovered, by channel and by bucket?", icon: "rupee" },
      ],
    },

    /* ============ customer service and grievance ============ */
    {
      key: "cse",
      title: "Customer Service Executive",
      dept: "Service",
      clearance: 1,
      scopes: ["service", "product", "ops"],
      focus: "Handles inbound calls and branch walk-ins: statements, foreclosure quotes, no-objection certificates, charge disputes and complaints.",
      persona: "Talking to a customer who wants an answer now. Give what may be said, plainly, and what has to be raised. Be exact about what this person may commit to, because a wrong figure quoted at the counter becomes a refund and a complaint.",
      greeting: "Ask about statements, foreclosure, no-objection certificates, charges, complaints and what you may tell a customer directly.",
      prompts: [
        { t: "Customer wants a foreclosure figure", s: "Can I give it", q: "A customer wants his foreclosure amount right now. What can I tell him and what has to be worked out formally?", icon: "rupee" },
        { t: "Disputes a penal charge", s: "What do I say", q: "The customer is disputing a penal charge on his account. What can I explain and what do I raise?", icon: "alert" },
        { t: "No-objection certificate not received", s: "After closure", q: "The customer closed his loan a month ago and has not received the no-objection certificate. What is the timeline?", icon: "checklist" },
        { t: "This is a complaint", s: "How do I log it", q: "When does a customer's unhappiness become a formal complaint, and what happens once it is logged?", icon: "users" },
        { t: "Customer wants his documents back", s: "Property papers", q: "The customer has closed his loan against property and wants his original documents. What is the process and timeline?", icon: "lock" },
      ],
    },
    {
      key: "gro",
      title: "Grievance Redressal Officer",
      dept: "Service",
      clearance: 3,
      scopes: ["service", "policy", "compliance", "collect", "ops", "credit", "custpii"],
      focus: "Owns the grievance pipeline for retail: classification, investigation, response within the committed timeline, and the root cause that goes back to the function responsible.",
      persona: "Has a clock running on every case and a supervisory eye on the pattern. Lead with the classification and the deadline, then what the investigation has to establish. Care about whether a complaint is one of many, because a repeated cause is a different problem from a single case.",
      greeting: "Ask about complaint classification, timelines, investigation, escalation and whether a case is part of a pattern.",
      prompts: [
        { t: "How long do I have?", s: "Response clock", q: "What is the timeline for responding to a customer complaint and when does it start?", icon: "clock" },
        { t: "Is this escalatable externally?", s: "Which forum", q: "This complaint has not been resolved to the customer's satisfaction. Where can they take it next and what does that mean for us?", icon: "route" },
        { t: "Same complaint from many customers", s: "Systemic", q: "Several customers have complained about the same charge on the same product. How do I treat that differently?", icon: "search" },
        { t: "Complaint about a recovery agent", s: "Investigation", q: "A customer alleges misconduct by a recovery agent. What does my investigation have to establish and who else is notified?", icon: "shield" },
        { t: "Customer wants compensation", s: "What can we offer", q: "The customer is asking for compensation for the inconvenience. What can we offer and who approves it?", icon: "rupee" },
      ],
    },
    {
      key: "pno",
      title: "Principal Nodal Officer",
      dept: "Service",
      clearance: 4,
      scopes: ["service", "policy", "compliance", "collect", "legal", "ops", "credit", "risk", "custpii"],
      focus: "The named escalation point for customer grievances across the group. Represents Anvira before external redress forums and owns the complaints reporting that goes to the board and the regulator.",
      persona: "Accountable externally for how the group treats its customers. Lead with the position the group can defend, then the gap between that and what actually happened. Interested in root cause and in whether the same failure has produced other complaints, because that is what turns a case into a finding.",
      greeting: "Ask about escalated grievances, external forums, complaints reporting, systemic causes and what the group's position actually is.",
      prompts: [
        { t: "What are customers complaining about most?", s: "Themes", q: "What are the dominant complaint themes this quarter and how have they moved?", icon: "chart" },
        { t: "An external forum has asked for a response", s: "What we file", q: "An external redress forum has sought our reply on a case. What has to go into that response?", icon: "scale" },
        { t: "Root cause keeps recurring", s: "Not fixed", q: "Which complaint root causes have recurred after being reported as fixed?", icon: "alert" },
        { t: "Charge complaints on one product", s: "Systemic issue", q: "Charge-related complaints are concentrated in one product. Is this a communication problem or a policy problem?", icon: "search" },
        { t: "What has to be reported?", s: "Complaints reporting", q: "What complaints information has to be reported, to whom, and how often?", icon: "checklist" },
      ],
    },

    /* ============ compliance, financial crime and audit ============ */
    {
      key: "reporting_analyst",
      title: "Regulatory Reporting Analyst",
      dept: "Compliance",
      clearance: 3,
      scopes: ["compliance", "fincon", "risk", "ops", "credit"],
      focus: "Prepares and files the supervisory returns: the returns calendar, data extraction, validation, submission and the exception queue that comes back.",
      persona: "Works to filing deadlines where a late or wrong return is visible immediately. Lead with the return, the due date and the data source. Be exact about which system a figure comes from and about validation failures, because those are what cause a resubmission.",
      greeting: "Ask about returns, due dates, data sources, validation, exceptions and resubmission.",
      prompts: [
        { t: "What is due this month?", s: "Returns calendar", q: "Which supervisory returns are due this month and what does each one need?", icon: "calendar" },
        { t: "Validation failure on a return", s: "How to fix", q: "A return has failed validation at submission. How do I identify the cause and correct it?", icon: "alert" },
        { t: "Two systems disagree", s: "Which figure files", q: "The loan management system and the general ledger give different outstanding figures. Which one goes into the return?", icon: "search" },
        { t: "Large exposure reporting", s: "Threshold and cycle", q: "What has to be reported on large exposures, at what threshold, and on what cycle?", icon: "chart" },
        { t: "We filed something wrong", s: "Correction process", q: "A figure in a filed return was wrong. What is the correction process and what has to be recorded?", icon: "checklist" },
      ],
    },
    {
      key: "internal_auditor",
      title: "Internal Auditor",
      dept: "Audit",
      clearance: 3,
      scopes: ["compliance", "policy", "credit", "ops", "collect", "risk", "service", "gold", "whistle", "mfi", "aml", "people"],
      focus: "Runs risk based internal audits of branches, the credit hubs, central operations and the collections network. Owns findings, ratings and the action taken reports that close them.",
      persona: "Looks for the gap between what a policy says and what actually happens. Lead with the control, the evidence expected, and what a failure of it would produce. Interested in repeat findings and in observations closed without a real fix, because those are the ones that come back.",
      greeting: "Ask about controls, audit scope, evidence, findings, ratings, action taken reports and repeat observations.",
      prompts: [
        { t: "What should I test at a branch?", s: "Branch audit scope", q: "What are the highest-value controls to test in a branch audit and what evidence proves each one?", icon: "checklist" },
        { t: "Finding was closed but not fixed", s: "Repeat observation", q: "How do I establish that an observation was closed on paper without the underlying issue being fixed?", icon: "alert" },
        { t: "Gold vault controls", s: "What to check", q: "What controls do I test around gold appraisal, packet sealing and vault custody?", icon: "lock" },
        { t: "Deviation approvals outside authority", s: "How to sample", q: "How do I test whether deviation approvals were taken within the delegation matrix?", icon: "checklist" },
        { t: "A protected disclosure has come in", s: "Handling", q: "A protected disclosure has been received about a branch. What is the handling process and who may know?", icon: "shield" },
      ],
    },
    {
      key: "principal_officer",
      title: "Principal Officer, Financial Crime",
      dept: "Compliance",
      clearance: 3,
      scopes: ["aml", "compliance", "ops", "policy", "str", "custpii"],
      focus: "The designated officer for the anti money laundering framework. Owns customer identification standards, risk categorisation, transaction monitoring, alert disposition and the reports filed with the financial intelligence unit.",
      persona: "Holds material that it is an offence to disclose, and that shapes everything. Be precise about identification standards and monitoring procedure, which are ordinary compliance material, and rigorous about case material, which is not. Never help anyone outside the designation learn that a case exists.",
      greeting: "Ask about identification standards, risk categorisation, monitoring, alert disposition, reporting and record keeping.",
      prompts: [
        { t: "Alert disposition standard", s: "What closes an alert", q: "What has to be established and recorded before a transaction monitoring alert can be closed without escalation?", icon: "checklist" },
        { t: "A branch is asking why an account is held", s: "What I may say", q: "A branch manager is asking why an account has been placed under a monitoring hold. What may I tell him?", icon: "lock" },
        { t: "Beneficial ownership", s: "Non-individual customers", q: "How is beneficial ownership established and recorded for a non-individual customer?", icon: "users" },
        { t: "Risk categorisation review", s: "How often", q: "How often does a customer's risk categorisation have to be reviewed and what triggers an off-cycle review?", icon: "calendar" },
        { t: "Record keeping obligations", s: "How long", q: "What identification and transaction records have to be kept, and for how long?", icon: "grid" },
      ],
    },
    {
      key: "chief_compliance",
      title: "Chief Compliance Officer",
      dept: "Compliance",
      clearance: 4,
      scopes: ["compliance", "policy", "aml", "digital", "legal", "service", "risk", "credit", "ops", "collect", "gold", "mfi", "people"],
      focus: "Owns the compliance function across the group. No business responsibility and no dual role. Tracks regulatory change, owns the compliance testing programme, and reports to the audit committee and the board.",
      persona: "Reads a circular and has to know what it changes. Lead with the obligation, then everything it touches: policy, product, process, system parameter, customer document, return and owner. Be direct about where the group is not yet compliant, because that is the job.",
      greeting: "Ask about regulatory change, compliance testing, inspection readiness, policy currency and where an obligation is not being met.",
      prompts: [
        { t: "A new circular has come out", s: "What does it change", q: "A new circular has been issued. Which of our policies, products, processes, system parameters, customer documents and returns does it affect?", icon: "route" },
        { t: "Where are we not compliant?", s: "Honest position", q: "Where does the compliance testing programme show that we are not actually doing what our policy says?", icon: "alert" },
        { t: "Templates that were never updated", s: "Document currency", q: "Which customer-facing templates and letters are still on a superseded version?", icon: "checklist" },
        { t: "Digital lending partners", s: "Oversight", q: "What are our oversight obligations over lending service providers and digital lending apps, and are we meeting them?", icon: "globe" },
        { t: "Inspection is coming", s: "What will they find", q: "Based on our own testing and audit findings, what is an inspection most likely to raise?", icon: "search" },
      ],
    },

    /* ============ finance and treasury ============ */
    {
      key: "treasury_analyst",
      title: "Treasury and ALM Analyst",
      dept: "Finance",
      clearance: 3,
      scopes: ["fincon", "risk", "compliance"],
      focus: "Manages the borrowing programme, the maturity profile and the liquidity position. Prepares the asset liability committee pack and the pricing inputs that go into product rates.",
      persona: "Thinks in maturity buckets and basis points. Lead with the position and the gap. This person's numbers set the floor under every product rate, so be exact about what is contracted, what is assumed and what is a projection.",
      greeting: "Ask about borrowings, cost of funds, maturity gaps, liquidity, pricing inputs and the asset liability position.",
      prompts: [
        { t: "Where is the maturity gap?", s: "Bucket view", q: "Where are the largest negative gaps in the maturity profile and what is covering them?", icon: "chart" },
        { t: "Cost of funds has moved", s: "Effect on pricing", q: "Cost of funds has risen this quarter. What does that do to the floor under our product rates?", icon: "trendup" },
        { t: "Concentration in borrowings", s: "Funding risk", q: "How concentrated is the borrowing book by lender, instrument and maturity?", icon: "grid" },
        { t: "Co-lending and assignment cash flows", s: "Liquidity effect", q: "How do the co-lending and assignment arrangements affect the liquidity position?", icon: "route" },
        { t: "Liquidity buffer", s: "Are we adequate", q: "What liquidity buffer are we required to hold and where do we currently stand?", icon: "shield" },
      ],
    },
    {
      key: "cfo",
      title: "Chief Financial Officer",
      dept: "Finance",
      clearance: 4,
      scopes: ["fincon", "risk", "compliance", "policy", "wholesale", "capmkt", "credit", "collect", "upsi", "ops"],
      focus: "Owns the financial statements, provisioning, capital, the borrowing programme, investor and rating agency relationships, and the disclosure calendar for the listed debt.",
      persona: "Answers to the board, the auditors, the rating agencies and the debenture holders. Lead with the number and its provenance. Distinguish sharply between what is reported, what is provisional and what is unpublished, because the last of those cannot leave a small group of people.",
      greeting: "Ask about provisioning, margins, capital, funding, the borrowing programme, rating and disclosure.",
      prompts: [
        { t: "What is moving the provision?", s: "This quarter", q: "What is driving the movement in the expected credit loss provision this quarter?", icon: "chart" },
        { t: "Margin compression", s: "Where", q: "Where is net interest margin compressing and is it pricing, mix or cost of funds?", icon: "trendup" },
        { t: "Capital position", s: "Headroom", q: "What is our capital position and how much growth headroom does it actually give us?", icon: "target" },
        { t: "Rating agency question", s: "What they will ask", q: "Based on the portfolio, what is the rating agency most likely to press us on at the next review?", icon: "search" },
        { t: "Disclosure obligations", s: "Listed debt", q: "What are our continuing disclosure obligations on the listed debentures and what triggers one?", icon: "checklist" },
      ],
    },

    /* ============ digital ============ */
    {
      key: "digital_pm",
      title: "Digital Lending Product Manager",
      dept: "Digital",
      clearance: 2,
      scopes: ["digital", "product", "ops", "compliance", "credit"],
      focus: "Owns the digital lending journeys and the relationships with six lending service providers and four applications. Responsible for the funnel, the disclosures shown in the journey and the partner oversight file.",
      persona: "Builds a journey that has to convert and comply at the same time. Lead with the requirement that constrains the design, then the design option. Be exact about what must be shown to a customer and at what point, because the disclosure sequence is not a design preference.",
      greeting: "Ask about digital journeys, partner obligations, disclosures, consent, data handling and funnel performance.",
      prompts: [
        { t: "What must the journey show?", s: "Disclosure sequence", q: "What has to be disclosed to a customer in a digital journey, and at what point in the flow?", icon: "checklist" },
        { t: "Partner wants to hold the data", s: "Is that allowed", q: "A lending service provider wants to retain customer data on its own systems. What is permitted?", icon: "lock" },
        { t: "Loss guarantee arrangement", s: "Limits", q: "What limits and conditions apply to a default loss guarantee arrangement with a partner?", icon: "shield" },
        { t: "Where is the funnel leaking?", s: "Drop-off", q: "Where are applicants dropping out of the digital journey and what is causing it?", icon: "trendup" },
        { t: "Partner is not on our register", s: "What now", q: "We are working with an application that is not on our published partner register. What are the consequences?", icon: "alert" },
      ],
    },

    /* ============ executive ============ */
    {
      key: "md_ceo",
      title: "Managing Director and Chief Executive",
      dept: "Executive",
      clearance: 4,
      scopes: ["policy", "credit", "risk", "fincon", "collect", "service", "compliance", "digital", "product", "wholesale", "capmkt", "ops", "legal", "upsi", "aml", "gold", "mfi", "people"],
      focus: "Runs the group. Accountable to the board for growth, asset quality, conduct and the regulatory relationship across the parent and both subsidiaries.",
      persona: "Has limited time and wants the thing that matters, with the number attached. Lead with the answer, then the one or two facts that support it, then what would change the picture. Do not present a balanced survey when there is a clear answer. Say when something is not knowable from what exists.",
      greeting: "Ask anything about the group: growth, asset quality, conduct, cost, funding, the regulatory position and what is coming.",
      prompts: [
        { t: "What should worry me most?", s: "Across the group", q: "Across the whole group, what is the single thing most likely to cost us money or standing in the next two quarters?", icon: "alert" },
        { t: "Where did growth come from?", s: "And what it cost", q: "Where did disbursal growth come from this quarter and what did it cost us to acquire in each channel?", icon: "trendup" },
        { t: "Are we treating customers well?", s: "Honest answer", q: "What does our own complaints and conduct evidence say about how we are actually treating customers?", icon: "users" },
        { t: "A problem nobody has connected", s: "Across functions", q: "Is there a problem showing up in more than one function that nobody has connected yet?", icon: "search" },
        { t: "What will the regulator ask?", s: "Inspection view", q: "If an inspection started next month, what would it most likely find?", icon: "checklist" },
      ],
    },
  ],

  /* ---------------- 9. sign-in profiles ---------------- */
  users: [
    { name: "Rohit Kulkarni",        roleKey: "sales_officer",      title: "Sales Officer",                        location: "Nashik, MH" },
    { name: "Fatima Sheikh",         roleKey: "sales_officer",      title: "Sales Officer",                        location: "Hyderabad, TS" },
    { name: "Manjunath Gowda",       roleKey: "dealer_exec",        title: "Dealer Sales Executive",               location: "Nagpur, MH" },
    { name: "Harpreet Sandhu",       roleKey: "dsa_principal",      title: "DSA Principal",                        location: "Pune, MH" },
    { name: "Sunita Devi",           roleKey: "bc_agent",           title: "Business Correspondent",               location: "Muzaffarpur, BR" },
    { name: "Anand Menon",           roleKey: "branch_manager",     title: "Branch Manager",                       location: "Indore, MP" },
    { name: "Reshma Qureshi",        roleKey: "branch_manager",     title: "Branch Manager",                       location: "Thrissur, KL" },
    { name: "Nikhil Shirke",         roleKey: "area_sales",         title: "Area Sales Manager",                   location: "Pune, MH" },
    { name: "Divya Ramaswamy",       roleKey: "cpa",                title: "Credit Processing Associate",          location: "Pune, MH" },
    { name: "Sandeep Yadav",         roleKey: "fi_officer",         title: "Field Investigation Officer",          location: "Coimbatore, TN" },
    { name: "Arjun Chandrasekaran",  roleKey: "credit_manager",     title: "Credit Manager",                       location: "Pune, MH" },
    { name: "Meera Bhattacharya",    roleKey: "rcm",                title: "Regional Credit Manager",              location: "Mumbai, MH" },
    { name: "Vikram Ranganathan",    roleKey: "cco",                title: "Chief Credit Officer",                 location: "Mumbai, MH" },
    { name: "Zoya Mirza",            roleKey: "wholesale_rm",       title: "Relationship Manager, Wholesale",      location: "Mumbai, MH" },
    { name: "Karan Deshpande",       roleKey: "capmkt_ops",         title: "Capital Markets Lending Officer",      location: "Mumbai, MH" },
    { name: "Ananya Bose",           roleKey: "portfolio_risk",     title: "Portfolio Risk Analyst",               location: "Mumbai, MH" },
    { name: "Imran Ansari",          roleKey: "rcu_officer",        title: "Risk Containment Unit Officer",        location: "Delhi, DL" },
    { name: "Lakshmi Narayanan",     roleKey: "cro",                title: "Chief Risk Officer",                   location: "Mumbai, MH" },
    { name: "Pooja Agarwal",         roleKey: "loan_ops",           title: "Loan Operations Executive",            location: "Pune, MH" },
    { name: "Gopal Krishnan",        roleKey: "pdd_officer",        title: "Documentation and PDD Officer",        location: "Chennai, TN" },
    { name: "Rajan Nair",            roleKey: "gold_appraiser",     title: "Gold Appraiser",                       location: "Thrissur, KL" },
    { name: "Ritu Balasubramanian",  roleKey: "central_ops",        title: "Central Operations Manager",           location: "Pune, MH" },
    { name: "Neha Chaudhary",        roleKey: "tele_collections",   title: "Tele-collections Agent",               location: "Jaipur, RJ" },
    { name: "Selvam Murugan",        roleKey: "field_collections",  title: "Field Collections Officer",            location: "Chennai, TN" },
    { name: "Bhaskar Reddy",         roleKey: "repo_coordinator",   title: "Repossession Coordinator",             location: "Chennai, TN" },
    { name: "Aarti Joshi",           roleKey: "acm",                title: "Area Collections Manager",             location: "Chennai, TN" },
    { name: "Faisal Rahman",         roleKey: "legal_recovery",     title: "Legal and Recovery Officer",           location: "Mumbai, MH" },
    { name: "Devika Pillai",         roleKey: "head_collections",   title: "Head of Collections",                  location: "Mumbai, MH" },
    { name: "Sneha Wagh",            roleKey: "cse",                title: "Customer Service Executive",           location: "Pune, MH" },
    { name: "Tarun Bakshi",          roleKey: "gro",                title: "Grievance Redressal Officer",          location: "Mumbai, MH" },
    { name: "Shalini Verma",         roleKey: "pno",                title: "Principal Nodal Officer",              location: "Mumbai, MH" },
    { name: "Prakash Iyer",          roleKey: "reporting_analyst",  title: "Regulatory Reporting Analyst",         location: "Mumbai, MH" },
    { name: "Joseph Fernandes",      roleKey: "internal_auditor",   title: "Internal Auditor",                     location: "Mumbai, MH" },
    { name: "Kavita Rangarajan",     roleKey: "principal_officer",  title: "Principal Officer, Financial Crime",   location: "Mumbai, MH" },
    { name: "Suresh Pattabhiraman",  roleKey: "chief_compliance",   title: "Chief Compliance Officer",             location: "Mumbai, MH" },
    { name: "Ishaan Malhotra",       roleKey: "treasury_analyst",   title: "Treasury and ALM Analyst",             location: "Mumbai, MH" },
    { name: "Georgina D'Souza",      roleKey: "cfo",                title: "Chief Financial Officer",              location: "Mumbai, MH" },
    { name: "Aditya Rao",            roleKey: "digital_pm",         title: "Digital Lending Product Manager",      location: "Bengaluru, KA" },
    { name: "Sanjay Vaidyanathan",   roleKey: "md_ceo",             title: "Managing Director and Chief Executive", location: "Mumbai, MH" },
  ],

  /* ---------------- 10. guided tasks ----------------
     Sixteen workflows. Each is here because it costs staff time, carries
     financial consequence, or is a recurring source of rework.

     The invariant that matters: every role in a task's `for` must be
     cleared to read every document the task cites. A step whose
     justification half its audience cannot open is worse than a step with
     no citation at all.

     Nothing in a task depends on a model. Steps, branching, computation
     and the produced record are all deterministic, so a task completes
     with no key and no network.
  */
  journeys: [

    /* ========== COMPUTE AND EVIDENCE ========== */
    {
      id: "foreclosure_quote",
      title: "Foreclosure and part-prepayment quote",
      tagline: "Work out what is actually payable, and whether a charge may be levied at all",
      icon: "rupee",
      for: ["cse", "branch_manager", "central_ops", "loan_ops", "gro"],
      triggers: ["foreclosure quote", "prepayment charge", "settlement figure", "close my loan",
                 "part prepayment", "payoff amount", "foreclosure amount"],
      doneTitle: "Quote prepared",
      doneNote: "The quote is in the workspace with every line and the policy behind it. It is not an approval.",
      steps: [
        { id: "account", type: "text", q: "Which loan account?",
          placeholder: "LN-4471902", help: "The account number as it appears on the statement." },
        { id: "product", type: "choice", q: "Which product is this?",
          options: ["Loan against property", "Business loan", "Personal loan", "Commercial vehicle",
                    "Car", "Two-wheeler", "Gold loan", "Home loan (HFC)"],
          cite: "PR-010" },
        { id: "sanctionDate", type: "date", q: "When was the facility sanctioned or last renewed?",
          help: "The regime that applies is set by the sanction date on the file, not by the date of this request.",
          cite: "PR-004" },
        { id: "rateBasis", type: "choice", q: "Is the rate floating or fixed today?",
          options: [
            { v: "Floating", t: "Floating", d: "Linked to the benchmark" },
            { v: "Fixed", t: "Fixed", d: "Fixed for the period stated in the sanction" },
          ],
          help: "Check the sanction letter rather than inferring it from the schedule.",
          cite: "PR-004" },
        { id: "borrower", type: "choice", q: "Who is the borrower?",
          options: [
            { v: "Individual", t: "An individual", d: "With or without co-borrowers" },
            { v: "MSE", t: "A micro or small enterprise", d: "Evidenced on the file, not asserted" },
            { v: "Other", t: "Any other entity", d: "Company, partnership, trust" },
          ],
          cite: "PR-004" },
        { id: "purpose", type: "choice", q: "What was the recorded end use?",
          options: ["Non-business", "Business"], cite: "PR-004" },
        { id: "valueDate", type: "date", q: "Value date for this quote?" },
        { id: "pos", type: "number", q: "Principal outstanding on the value date?" },
        { id: "roi", type: "number", q: "Contracted rate of interest, per cent per annum?" },
        { id: "days", type: "number", q: "Days since the last rest?", cite: "PR-002" },
        { id: "penal", type: "number", q: "Unpaid penal charges, if any?",
          optional: true, cite: "PR-003",
          help: "Shown separately. These are never added to principal before interest is computed." },
        { id: "setoff", type: "confirm", q: "Have unapplied receipts and suspense entries been set off?",
          cite: "PR-004", yes: "Yes, checked and set off", no: "Not yet",
          help: "Set them off before quoting, not after the customer disputes the figure." },
        { id: "quote", type: "calc", q: "The amount payable",
          compute: {
            lines: [
              { label: "Principal outstanding", op: "value", from: "pos", as: "P", cite: "PR-004" },
              { label: "Interest accrued to the value date", op: "interest", of: "pos", rate: "roi",
                days: "days", basis: 365, as: "I", cite: "PR-004" },
              { label: "Pre-payment charge, floating rate to an individual",
                op: "constant", value: 0, as: "C1", cite: "PR-004",
                when: { rateBasis: "Floating", borrower: "Individual", purpose: "Non-business" },
                note: "No charge is levied, whatever the source of funds and whether in part or in full" },
              { label: "Pre-payment charge, floating rate for a business purpose",
                op: "constant", value: 0, as: "C2", cite: "PR-004",
                when: { rateBasis: "Floating", borrower: "MSE" },
                note: "No charge is levied on a micro or small enterprise borrower" },
              { label: "Pre-payment charge, as provided in the agreement",
                op: "percent", of: "pos", pct: 4, as: "C3", cite: "PR-004",
                when: { rateBasis: "Fixed" },
                because: "Not payable: this is a floating rate facility and no charge is permitted",
                note: "Only at the rate stated in the key facts statement, and only on the amount pre-paid" },
              { label: "Unpaid penal charges", op: "value", from: "penal", as: "N", cite: "PR-003",
                note: "Shown separately and not capitalised into principal" },
            ],
            total: { label: "Amount payable on the value date", of: ["P", "I", "C1", "C2", "C3", "N"] },
          } },
        { id: "checks", type: "check", q: "Before the quote goes out",
          rules: [
            { label: "Sanction date established", of: "sanctionDate", test: "present", cite: "PR-004",
              fail: "The applicable regime cannot be determined without it" },
            { label: "Rate basis taken from the sanction letter", of: "rateBasis", test: "present", cite: "PR-001" },
            { label: "Borrower category evidenced, not asserted", of: "borrower", test: "present", cite: "PR-004",
              pass: "Recorded on the file" },
            { label: "Unapplied receipts checked and set off", of: "setoff", test: "truthy", cite: "PR-004",
              fail: "Set off any unapplied receipt before quoting, not after the customer disputes it" },
          ] },
        { id: "validity", type: "clock", q: "How long this quote stands",
          clocks: [
            { label: "Quote valid to", from: "valueDate", every: 7, unit: "days",
              owner: "Customer Service",
              consequence: "Interest continues to accrue daily after this date and the figure must be reworked",
              cite: "PR-004" },
          ] },
      ],
      produce: {
        kind: "Foreclosure quote",
        title: "Foreclosure quote for {account}",
        meta: [
          { k: "Account", from: "account" }, { k: "Product", from: "product" },
          { k: "Rate basis", from: "rateBasis" }, { k: "Borrower", from: "borrower" },
          { k: "Value date", from: "valueDate" },
        ],
        sections: [
          { h: "Amount payable", fromStep: "quote",
            body: "Every line below is computed from the account position and the policy named against it." },
          { h: "Whether a charge may be levied", fromDoc: "PR-004", para: 2 },
          { h: "Before this is issued", fromStep: "checks" },
          { h: "Validity", fromStep: "validity" },
          { h: "On receipt of the full amount", body: "The account is closed, the no-objection certificate is issued and every security is released within the period stated in the product note, and satisfaction of charge is filed with the registry where one was created." },
        ],
        halt: {
          kind: "Quote not issued",
          title: "Foreclosure quote withheld for {account}",
          intro: "A quote cannot be issued until the following are settled. Quoting a figure before they are is the most common way this policy is breached.",
          route: "Complete the outstanding items and run this again. Where the sanction date or the borrower category cannot be established from the file, refer to Central Operations.",
        },
        footer: "Prepared by SARA from the account position and the policies cited. This is a quote, not an approval, and it is not a demand.",
      },
    },

    {
      id: "kfs_apr",
      title: "Key Facts Statement and effective rate",
      tagline: "Build the disclosure with a true all-inclusive rate and the repayment schedule",
      icon: "doc",
      for: ["credit_manager", "loan_ops", "cpa", "digital_pm", "central_ops"],
      triggers: ["key facts statement", "kfs", "annual percentage rate", "apr",
                 "all inclusive rate", "amortisation schedule", "disclosure before sanction"],
      doneTitle: "Statement prepared",
      doneNote: "The statement and the schedule are in the workspace. The borrower's acknowledgement must be obtained before the contract is executed.",
      steps: [
        { id: "applicant", type: "text", q: "Applicant name?" },
        { id: "product", type: "choice", q: "Which product?",
          options: ["Loan against property", "Business loan", "Personal loan", "Commercial vehicle",
                    "Two-wheeler", "Consumer durable", "Home loan (HFC)"], cite: "PR-010" },
        { id: "amount", type: "number", q: "Sanctioned amount?" },
        { id: "roi", type: "number", q: "Rate of interest, per cent per annum?", cite: "PR-005" },
        { id: "months", type: "number", q: "Tenor in months?" },
        { id: "fee", type: "number", q: "Processing fee recovered at disbursal?", cite: "PR-002" },
        { id: "otherCosts", type: "number", q: "Any other cost recovered at disbursal?",
          optional: true, cite: "PR-005",
          help: "Documentation charges, and the premium of any insurance that is a condition of the facility." },
        { id: "issued", type: "date", q: "Date the statement is issued?" },
        { id: "penalStated", type: "confirm", q: "Is the penal charge quantum and trigger stated?", cite: "PR-003" },
        { id: "grievanceStated", type: "confirm", q: "Is the grievance officer named with contact details?", cite: "PR-005" },
        { id: "rate", type: "calc", q: "The all-inclusive rate",
          compute: {
            lines: [
              { label: "Sanctioned amount", op: "value", from: "amount", as: "S", cite: "PR-005" },
              { label: "Processing fee", op: "value", from: "fee", as: "F", negative: true, cite: "PR-002" },
              { label: "Other costs recovered at disbursal", op: "value", from: "otherCosts",
                as: "O", negative: true, cite: "PR-005" },
              { label: "Amount the borrower actually receives", op: "subtract", of: ["S", "F", "O"],
                as: "NET", cite: "PR-005",
                note: "The rate is computed on this, not on the sanctioned amount" },
              { label: "Instalment", op: "emi", principal: "amount", rate: "roi", months: "months",
                as: "EMI", cite: "PR-005" },
              { label: "Total of all payments", op: "multiply", of: ["EMI", "months"], as: "TOT", cite: "PR-005" },
              { label: "Contracted rate", op: "value", from: "roi", unit: "percent", as: "R", cite: "PR-005" },
            ],
            total: { label: "Total payable over the tenor", of: ["TOT"] },
          } },
        { id: "disclosure", type: "check", q: "What the statement must carry",
          rules: [
            { label: "All-inclusive rate computed on what the borrower receives", of: "rate",
              test: "present", cite: "PR-005" },
            { label: "Every fee itemised, none absorbed into the headline", of: "fee",
              test: "present", cite: "PR-002" },
            { label: "Penal charge quantum and trigger stated", of: "penalStated", test: "truthy", cite: "PR-003",
              fail: "The quantum and what triggers it must appear in the statement" },
            { label: "Grievance officer named with contact details", of: "grievanceStated",
              test: "truthy", cite: "PR-005", fail: "The statement must name the officer and how to reach them" },
          ] },
        { id: "validity", type: "clock", q: "How long the terms stand",
          clocks: [
            { label: "Statement valid to", from: "issued", every: 3, unit: "days",
              owner: "Credit", consequence: "The terms stated remain available to the borrower until this date",
              cite: "PR-005" },
          ] },
      ],
      produce: {
        kind: "Key Facts Statement",
        title: "Key Facts Statement for {applicant}",
        meta: [
          { k: "Applicant", from: "applicant" }, { k: "Product", from: "product" },
          { k: "Sanctioned amount", from: "amount" }, { k: "Tenor (months)", from: "months" },
          { k: "Issued", from: "issued" },
        ],
        sections: [
          { h: "Cost of the facility", fromStep: "rate",
            body: "The all-inclusive rate is computed on the amount the borrower actually receives after deductions at disbursal." },
          { h: "What this statement must carry", fromStep: "disclosure" },
          { h: "Validity", fromStep: "validity" },
          { h: "Why the basis of the computation matters", fromDoc: "PR-005", para: 2 },
          { h: "Nothing outside this statement", body: "No charge may be recovered at any point in the life of the facility that is not disclosed here, unless the borrower has been separately informed and has agreed." },
        ],
        footer: "The borrower's acknowledgement of receipt must be obtained and retained on the file. A file without it is not disbursement-ready.",
      },
    },

    {
      id: "asset_classification",
      title: "Asset classification and the upgrade test",
      tagline: "Stage, classification date, and whether the account may actually be upgraded",
      icon: "chart",
      for: ["portfolio_risk", "acm", "head_collections", "reporting_analyst",
            "central_ops", "cro", "internal_auditor"],
      triggers: ["asset classification", "npa date", "sma stage", "days past due",
                 "can this account be upgraded", "upgrade to standard", "iracp"],
      doneTitle: "Classification worked out",
      doneNote: "The stage, the dates and the upgrade position are in the workspace with the rule behind each.",
      steps: [
        { id: "borrower", type: "text", q: "Borrower name or identifier?" },
        { id: "facility", type: "text", q: "Which facility is being assessed?" },
        { id: "oldestDue", type: "date", q: "Date of the oldest instalment still unpaid?",
          cite: "RK-001", help: "The day count runs from the due date, and there is no grace period." },
        { id: "asOn", type: "date", q: "Position as at which date?" },
        { id: "position", type: "calc", q: "Days past due and stage",
          compute: {
            lines: [
              { label: "Days past due", op: "days", from: "oldestDue", to: "asOn",
                as: "DPD", unit: "days", cite: "RK-001" },
            ],
            total: { label: "Days past due", of: ["DPD"], unit: "days" },
          } },
        { id: "facilities", type: "table", q: "Every facility of this borrower, and the arrears on each",
          help: "Upgrade is tested across all facilities of the borrower, not on this one alone.",
          cite: "RK-001",
          columns: [
            { key: "facility", label: "Facility" },
            { key: "product", label: "Product" },
            { key: "arrears", label: "Arrears outstanding", kind: "money" },
          ] },
        { id: "totalArrears", type: "number", q: "Total arrears of interest and principal across all facilities?",
          cite: "RK-001",
          help: "The sum of the arrears column above. Upgrade requires this to be nil." },
        { id: "upgradeTest", type: "check", q: "The upgrade test",
          rules: [
            { label: "Entire arrears cleared across every facility of this borrower",
              of: "totalArrears", test: "lte", value: 0, cite: "RK-001",
              pass: "Nothing outstanding on any facility",
              fail: "Arrears remain. Reducing days past due below a threshold does not upgrade the account" },
            { label: "Arrears position established from all facilities, not one",
              of: "facilities", test: "present", cite: "RK-001" },
          ],
          halt: false },
        { id: "secured", type: "choice", q: "Is the exposure secured?",
          options: ["Secured", "Unsecured"], cite: "RK-001" },
      ],
      produce: {
        kind: "Classification note",
        title: "Classification of {facility} for {borrower}",
        meta: [
          { k: "Borrower", from: "borrower" }, { k: "Facility", from: "facility" },
          { k: "Oldest unpaid due date", from: "oldestDue" }, { k: "Position as at", from: "asOn" },
        ],
        sections: [
          { h: "Days past due", fromStep: "position" },
          { h: "Facilities of this borrower", fromTable: "facilities" },
          { h: "The upgrade test", fromStep: "upgradeTest",
            body: "An account classified as non performing is upgraded to standard only when the entire arrears of interest and principal are paid, and where the borrower holds more than one facility, across all of them." },
          { h: "What the policy says", fromDoc: "RK-001", para: 6 },
        ],
        footer: "Classification is a mechanical consequence of the day-end position. It is not a judgement and is never adjusted to produce a reported number.",
      },
    },
  ],

  /* ---------------- 11. domain diagrams ---------------- */
  diagrams: [],

  /* ---------------- 12. the corpus ---------------- */
  kb: [

    /* ================= GROUP POLICY ================= */
    {
      id: "GP-001", title: "Group Charter and Operating Model", cat: "policy", clearance: 1, scopes: ["policy"],
      owner: "Managing Director's Office", updated: "2026-01-20", rev: "7.0", system: "Policy Repository",
      tags: ["charter", "operating model", "accountability", "subsidiary", "governance", "entity", "group"],
      body:
        "Anvira Finserv Limited is registered with the Reserve Bank of India as a non-banking financial company in the investment and credit company category and is placed in the Middle Layer under the Scale Based Regulation framework. It is a non-deposit taking company. Two subsidiaries operate under separate registrations: Anvira Housing Finance Limited, a housing finance company, and Anvira Microfinance Limited, an NBFC-MFI. Each entity carries its own registration, its own board, its own capital requirement and its own classification, pricing, documentation and reporting obligations.\n\n" +
        "Entity boundaries are not administrative. A policy of the parent does not automatically apply to a subsidiary, and an obligation that binds the housing finance company does not bind the parent merely because the customer is the same person. Every policy in this repository names the entity or entities it governs in its first paragraph. Where a document does not name an entity, it governs Anvira Finserv Limited alone.\n\n" +
        "Accountability model. Business heads own volume, mix and profitability for their products. The Chief Credit Officer owns credit policy and the delegation matrix. The Chief Risk Officer owns risk appetite and independent challenge and has no business responsibility. The Chief Compliance Officer owns the compliance function, holds no business role and carries no dual responsibility that could create a conflict. Functional owners set standards and provide assurance; they do not originate, sanction or collect.\n\n" +
        "The three questions. Every decision at every level is expected to answer three questions in this order: is it within policy, can the customer be shown why, and can we explain it to an auditor a year from now. Where the answer to the first is no, the decision escalates regardless of its commercial size.\n\n" +
        "Standards hierarchy. Board approved policy sits above functional policy, which sits above product notes and standard operating procedures, which sit above circulars, forms and templates. A circular may implement a policy; it may not extend or weaken one. Where a form and its parent policy disagree, the parent governs and the discrepancy is a document control finding to be raised, not an inconsistency to be worked around. This matters more than it sounds: the person at the counter follows the form.",
    },
    {
      id: "GP-002", title: "Document Control, Revision and Template Currency", cat: "policy", clearance: 1, scopes: ["policy"],
      owner: "Company Secretary", updated: "2026-03-05", rev: "4.2", system: "Policy Repository",
      tags: ["document control", "revision", "superseded", "withdrawn", "template", "letter", "review cycle", "currency", "circular"],
      body:
        "Every controlled document carries an identifier, a revision number, an owner and a review date. A document is valid only in its current revision. A printed or downloaded copy is uncontrolled unless it is stamped and registered, and an uncontrolled copy may not be relied on to price, sanction, communicate with a customer or compute an amount payable.\n\n" +
        "Review cycle. Policies approved by the board are reviewed annually. Functional policies and product notes are reviewed every 18 months. Standard operating procedures are reviewed every 24 months. A document past its review date is flagged overdue; overdue does not mean invalid, but it does mean the owner must look and record what they found.\n\n" +
        "Withdrawal and downstream reissue. When a revision is superseded, the previous revision is marked withdrawn on the same day. Withdrawal in the repository is not the whole obligation. Any derived material that reproduces or references the withdrawn content must be identified and reissued within 30 days: customer letter templates, notices, statement narrations, key facts statement formats, sanction letter formats, application forms, branch field cards, training packs and partner-facing documentation. The owner of the parent document is accountable for that reissue, not the owner of the derived material.\n\n" +
        "Known weakness. Derived material is the weakest link in this standard and has been raised in internal audit more than once. Customer-facing templates are produced by different functions from the policies they quote, are configured separately in the loan management and communication systems, and are not automatically flagged when a parent revision changes. A template inventory linking every customer-facing document to its parent policy does not currently exist. Until it does, the 30 day reissue obligation is manual and is not reliably met.\n\n" +
        "Forms and templates may not add or weaken. A form, letter or system-generated notice may not introduce a charge, a rate, a trigger or a consequence that its parent policy does not carry, and may not state one that differs. Where a template and its parent disagree, the parent governs, and the template is corrected rather than the policy being read to fit it.",
    },
    {
      id: "GP-003", title: "Delegation of Authority", cat: "policy", clearance: 2, scopes: ["policy", "credit", "fincon"],
      owner: "Chief Financial Officer", updated: "2026-02-18", rev: "9.1", system: "Policy Repository",
      tags: ["delegation", "authority", "approval", "threshold", "sanction", "waiver", "settlement", "write-off", "splitting"],
      body:
        "Authority to commit Anvira is delegated by value and by type. Credit sanction, deviation approval, charge waiver, settlement, write-off, operating expenditure and contract term each carry their own limits, and a limit in one category never transfers to another. Nothing in this document delegates a statutory or designated function.\n\n" +
        "Credit sanction, retail secured. Credit Manager up to 50 lakh. Regional Credit Manager up to 2 crore. Chief Credit Officer up to 15 crore. Above 15 crore, the Credit Committee. Retail unsecured runs at one third of these limits at each level. Wholesale exposures are sanctioned only by the Credit Committee regardless of amount.\n\n" +
        "Charge waiver. Branch Manager up to 2,500 rupees per account per instance and not more than twice in a financial year for the same customer. Area Sales Manager or Area Collections Manager up to 10,000. Regional head up to 50,000. Above that, the functional head. A waiver granted to settle a complaint is recorded against the complaint, not against the branch's discretionary limit, so that complaint-driven waivers remain visible as a pattern.\n\n" +
        "Settlement and write-off. Area Collections Manager may approve a settlement recovering not less than the principal outstanding. Head of Collections may approve a settlement below principal outstanding up to 25 lakh of sacrifice. Beyond that, and for any technical or prudential write-off, the Board Committee. A settlement and a write-off are different acts with different consequences and are never recorded interchangeably.\n\n" +
        "Splitting is prohibited. Dividing a facility, a waiver or a commitment into parts to bring each part within a lower authority is a control breach regardless of intent, and it is among the most common internal audit findings across the sector. Where a total exposure to a borrower or a group will foreseeably exceed a threshold, it is approved at the level the whole exposure requires.\n\n" +
        "Undelegable combinations. Certain deviation combinations are not delegable at any level and must go to the Credit Committee: a bureau deviation together with an income assessment deviation; a loan to value deviation on a property that also carries a title deviation; and any deviation on an account where the borrower or a related party is an employee of Anvira or of an empanelled service provider.",
    },
    {
      id: "GP-004", title: "Fair Practices Code", cat: "policy", clearance: 1, scopes: ["policy", "service", "collect", "product"],
      owner: "Chief Compliance Officer", updated: "2026-04-12", rev: "6.0", system: "Policy Repository",
      tags: ["fair practices", "FPC", "transparency", "sanction letter", "language", "recovery", "conduct", "possession", "repossession clause"],
      body:
        "This code governs Anvira Finserv Limited and both subsidiaries and applies to every employee, direct sourcing agent, business correspondent, lending service provider and recovery agency acting on their behalf. Engaging an agent does not transfer the obligation; what the agent does, Anvira has done.\n\n" +
        "Applications and communication. All communication with a borrower is in a language the borrower understands or in the vernacular of the region, and the borrower's preference is recorded at application. Every application is acknowledged with an indication of the time normally taken to decide it. Where an application is rejected, the reason is conveyed in writing.\n\n" +
        "Sanction and disclosure. No loan is sanctioned without a written sanction letter stating the amount, the annualised rate of interest, the method of application of interest, the tenor, the schedule, every fee and charge, and the conditions of the facility. The key facts statement is provided before the contract is executed, and the borrower's acknowledgement is retained on the file. A copy of the executed loan agreement together with every enclosure quoted in it is furnished to the borrower at the time of sanction, without the borrower having to ask.\n\n" +
        "Changes in terms. Any change in the rate of interest, a charge, or any other term is notified to the borrower in advance and is applied prospectively only. A change is never applied to a period that has already run.\n\n" +
        "Recovery conduct. Anvira does not resort to harassment. Recovery does not involve persistently bothering the borrower at odd hours, contact outside the hours permitted by the collections policy, the use of muscle power, contact with persons who are not the borrower or the guarantor, disclosure of the debt to any third party, or any conduct that humiliates the borrower or their family. Every person recovering on Anvira's behalf is trained on this paragraph and their authorisation names it.\n\n" +
        "Possession of security. Where a facility is secured, the loan agreement contains an explicit clause permitting possession on default, and that clause sets out the notice to be given before possession, the circumstances in which it may be taken, the procedure for taking possession, the provision for the borrower to redeem the security before sale, and the procedure for sale. Possession is not taken on any facility whose executed agreement does not carry that clause, whatever the arrears position. Where an older executed agreement is found not to carry it, the matter goes to Legal and the account is not actioned for possession until Legal has advised.\n\n" +
        "Release of securities. On repayment of all dues, all securities are released within the period stated in the product note, and the release is not made conditional on the settlement of any other claim Anvira may have against the borrower unless that right is expressly reserved in the agreement and notice of it has been given.",
    },
    {
      id: "GP-005", title: "Grievance Redressal Policy", cat: "service", clearance: 1, scopes: ["policy", "service"],
      owner: "Principal Nodal Officer", updated: "2026-05-08", rev: "5.1", system: "Customer Relationship",
      tags: ["grievance", "complaint", "nodal officer", "escalation", "timeline", "redressal", "30 days", "systemic"],
      body:
        "Every customer of Anvira Finserv Limited and its subsidiaries has a right to be heard and to be told what was decided and why. This policy applies to complaints received at a branch, through the contact centre, by email, by post, through a digital application, through a lending service provider, or forwarded by any external forum.\n\n" +
        "Three levels. Level one is the branch or the contact centre, which acknowledges immediately and resolves within seven working days. Level two is the Grievance Redressal Officer, reached where level one has not resolved the matter or the customer is dissatisfied with the outcome. Level three is the Principal Nodal Officer. The name, designation, address, telephone number and email of the Grievance Redressal Officer and the Principal Nodal Officer are displayed at every branch, in every loan agreement, on the website and in every digital application.\n\n" +
        "Timeline. A complaint is acknowledged on receipt and given a unique reference. A final response is issued within 30 days of receipt at the earliest point of entry into Anvira, not from the date it reached the officer who answered it. Where a complaint cannot be resolved within 30 days, the customer is told in writing before the thirtieth day, given a reason and a revised date. A complaint closed without a response having been communicated to the customer is not closed.\n\n" +
        "Escalation outside Anvira. Where the customer is not satisfied with the response, or where no response has been received within 30 days, the customer may approach the external redress mechanism, and the response must tell them so, name the forum and give the address. Concealing or omitting that route is a serious conduct failure.\n\n" +
        "Root cause. Every complaint is classified against a root cause taxonomy at closure, and the classification is the responsibility of the officer who investigated, not of the officer who logged it. Where the same root cause produces more than five complaints in a rolling quarter, or any complaint arising from a system parameter, a template or a policy interpretation, the matter is escalated to the Chief Compliance Officer as a potential systemic issue regardless of how easily the individual cases were settled.\n\n" +
        "Reporting. The number of complaints received, disposed of and pending, their categories, and the number escalated to the external forum are reported to the board committee quarterly and disclosed as required in the annual financial statements.",
    },
    {
      id: "GP-006", title: "Outsourcing and Service Provider Policy", cat: "policy", clearance: 2, scopes: ["policy", "compliance", "digital", "ops"],
      owner: "Chief Compliance Officer", updated: "2025-12-14", rev: "4.0", system: "Policy Repository",
      tags: ["outsourcing", "vendor", "service provider", "due diligence", "agent", "material", "accountability", "exit", "concentration"],
      body:
        "Anvira outsources a number of activities: sourcing, field verification, tele-calling, field collections, valuation, document storage, technology hosting and parts of the digital lending journey. Outsourcing an activity never outsources the responsibility for it. Anvira remains answerable to its customers and to the regulator for anything done on its behalf.\n\n" +
        "What may not be outsourced. Core management functions may not be outsourced: the internal audit function, compliance, the sanctioning of loans, the decision on a customer's grievance, and the designated officer functions. A service provider may prepare, verify, collect or present; it may not decide.\n\n" +
        "Materiality. Each arrangement is assessed as material or non-material against the disruption it would cause on failure, the customer data it touches and the concentration it creates. Material arrangements require board committee approval, a documented due diligence file, a written agreement with defined service levels, audit and inspection rights covering the regulator as well as Anvira, business continuity provisions, and a tested exit plan. A material arrangement without an exit plan is a finding.\n\n" +
        "Due diligence. Before engagement and annually afterwards: legal standing, financial position, ownership and control, conflicts of interest, capacity, security posture, sub-contracting arrangements, litigation and regulatory history, and evidence of insurance. The file is retained and is the first thing an inspection will ask for.\n\n" +
        "Conduct and training. Every person employed by a service provider who deals with an Anvira customer is trained on the fair practices code and the collections conduct rules, carries an identity card and a written authorisation naming Anvira, and is registered against the arrangement. Anvira may require the removal of any such person from Anvira work without stating a reason.\n\n" +
        "Concentration. Where a single provider serves more than a quarter of a critical activity by volume, the concentration is reported to the board committee with a mitigation plan. Convenience is not a mitigation.",
    },
    {
      id: "GP-007", title: "Whistleblower and Protected Disclosure Policy", cat: "people", clearance: 1, scopes: ["policy", "people"],
      owner: "Chairman, Audit Committee", updated: "2025-10-22", rev: "3.2", system: "Policy Repository",
      tags: ["whistleblower", "protected disclosure", "vigilance", "retaliation", "anonymous", "audit committee", "speak up"],
      body:
        "Anyone may raise a concern about wrongdoing at Anvira: an employee, a contractor, a direct sourcing agent, a business correspondent, a service provider's staff, a customer or a member of the public. Wrongdoing includes fraud, misappropriation, falsification of records, bribery, a breach of the fair practices code, misconduct in recovery, manipulation of financial reporting, and any deliberate breach of a regulatory obligation.\n\n" +
        "How to raise it. Concerns may be raised with any manager, with the Head of Internal Audit, or through the independently operated disclosure line, which accepts anonymous reports. A concern raised anonymously is investigated on its merits; the fact that the person did not identify themselves is not a reason to weigh it less.\n\n" +
        "Confidentiality. The identity of a person making a disclosure is known only to the investigating officer and the Chairman of the Audit Committee, and case material is held in a restricted file. This policy describes the process and is open to everyone; the cases themselves are not.\n\n" +
        "Protection. Retaliation against a person who raises a concern in good faith is a dismissible matter. Retaliation includes dismissal, demotion, transfer, withholding of increment or incentive, exclusion from work, and informal pressure. This protection extends to service provider personnel working on Anvira business. A concern that turns out to be mistaken is protected; a concern raised in bad faith to cause harm is not.\n\n" +
        "Handling. Every disclosure is acknowledged, assigned, investigated and closed with a written outcome to the Audit Committee. Where a disclosure concerns a member of senior management, it is handled by the Audit Committee directly. Where it concerns financial reporting or a regulatory obligation, the Chief Compliance Officer is informed of the substance without the identity of the discloser.",
    },
    {
      id: "GP-008", title: "Business Continuity and Operational Resilience", cat: "policy", clearance: 2, scopes: ["policy", "ops", "compliance"],
      owner: "Chief Operating Officer", updated: "2026-01-08", rev: "3.0", system: "Policy Repository",
      tags: ["business continuity", "BCP", "disaster recovery", "resilience", "critical function", "recovery time", "incident"],
      body:
        "Anvira identifies its critical business functions, the maximum period each can be unavailable before customers or the regulator are materially affected, and the arrangements that restore them. Critical functions are: collection of instalments, application of receipts, disbursal of sanctioned facilities, customer contact channels, the general ledger, and regulatory reporting.\n\n" +
        "Recovery objectives. Collection and receipt application must be restored within four hours. Customer contact channels within four hours. Disbursal within one working day. Reporting within two working days, subject to any filing deadline falling sooner, in which case the deadline governs and the regulator is informed of the incident.\n\n" +
        "Dependency on third parties. The recovery objective of a function is meaningless if the provider it depends on cannot meet it. Every material outsourcing arrangement records the provider's own recovery commitment and is tested against Anvira's objective, not against the provider's marketing material. Where a provider cannot meet the objective, either an alternate is arranged or the objective is revised and the residual risk accepted at board committee level.\n\n" +
        "Testing. Each critical function is tested at least annually and the test includes an actual failover rather than a walkthrough. A test that does not fail anything has usually not tested anything. Findings are tracked to closure and reported to the board committee.\n\n" +
        "Incident handling. Any incident affecting a critical function is logged, classified by severity, and reported internally within one hour of detection. Incidents meeting the reportable threshold are notified externally within the timeframe set in the compliance calendar. Customer-affecting incidents require a communication plan approved by the Chief Compliance Officer before any message goes out.",
    },
    {
      id: "GP-009", title: "Information and Records Retention", cat: "policy", clearance: 2, scopes: ["policy", "ops", "compliance", "legal"],
      owner: "Company Secretary", updated: "2025-11-30", rev: "2.4", system: "Policy Repository",
      tags: ["records", "retention", "storage", "destruction", "loan file", "custody", "title deed", "archive", "original documents"],
      body:
        "Records are retained for the period required by the obligation that created them, and the longest applicable period governs where more than one applies. A record may not be destroyed while it is the subject of a live dispute, an investigation, an inspection, or a regulatory query, regardless of its scheduled destruction date.\n\n" +
        "Loan files. The executed agreement, the security documents, the key facts statement acknowledgement, the sanction letter and the identification records are retained for the life of the facility and for eight years after final settlement. Where a facility ends in enforcement or litigation, the file is retained for eight years after final disposal of the proceedings.\n\n" +
        "Identification records. Records relating to customer identification and the evidence supporting them are retained for the period required by the anti money laundering framework, measured from the end of the relationship, and transaction records for the period measured from the date of the transaction. These periods run independently of the loan file period and are frequently longer.\n\n" +
        "Original security documents. Title deeds, share certificates and other original instruments are held in fire-resistant storage under dual custody with a movement register. Every removal is recorded with the reason, the authorising officer and the date of return. An original that leaves storage and is not returned within five working days is escalated to Central Operations the same day.\n\n" +
        "Destruction. Records are destroyed only against an approved destruction schedule, with a certificate naming what was destroyed, when, by whom and under which authority. Confidential material is destroyed by secure means. A destruction certificate is itself a permanent record.",
    },
    {
      id: "GP-010", title: "Conflict of Interest and Related Party Dealings", cat: "policy", clearance: 2, scopes: ["policy", "people", "credit"],
      owner: "Company Secretary", updated: "2025-09-16", rev: "3.0", system: "Policy Repository",
      tags: ["conflict of interest", "related party", "employee loan", "declaration", "recusal", "gift", "empanelment"],
      body:
        "A conflict of interest exists wherever a person's private interest could influence, or could reasonably appear to influence, a decision they take on Anvira's behalf. The test is appearance as well as fact, because a decision that has to be explained afterwards is already expensive.\n\n" +
        "Declaration. Every employee declares conflicts on joining and annually, and on discovery in between. Declarable matters include a family member employed by a customer, a supplier, a service provider or a competitor; a financial interest in any of them; a directorship or partnership; and any personal relationship with a borrower whose file the employee could influence.\n\n" +
        "Management by removal, not disclosure. A declared conflict is managed by removing the person from the decision. Disclosure alone is not management. An employee may not appraise, sanction, disburse, waive, settle or collect on a file in which they have a declared interest, and the file records who was recused and who decided instead.\n\n" +
        "Facilities to employees and connected persons. Any facility to an employee, a director, their relatives, or an entity in which any of them holds an interest, is sanctioned one level above the authority its amount would otherwise attract, and is reported to the board committee. Any deviation on such a file is not delegable and goes to the Credit Committee.\n\n" +
        "Empanelment. Valuers, advocates, recovery agencies, verification agencies and service providers are empanelled through a documented process. No person may participate in an empanelment decision concerning a party in which they or a relative hold an interest. Empanelment is reviewed annually against performance and conduct, and an agency removed for conduct may not be re-empanelled under a different name, which requires the ownership check to be done properly rather than on the letterhead.\n\n" +
        "Gifts. Gifts and hospitality above the threshold set by the Company Secretary are recorded in the register, and nothing is accepted from a party in an active tender, an active credit decision or an active recovery negotiation.",
    },

    /* ================= CREDIT POLICY ================= */
    {
      id: "CR-001", title: "Master Credit Policy", cat: "credit", clearance: 2, scopes: ["credit", "policy"],
      owner: "Chief Credit Officer", updated: "2026-04-01", rev: "12.0", system: "Policy Repository",
      tags: ["credit policy", "appraisal", "underwriting", "eligibility", "four eyes", "capacity", "character", "collateral"],
      body:
        "This policy governs credit decisions in Anvira Finserv Limited. Anvira Housing Finance and Anvira Microfinance maintain their own credit policies which are aligned to this one but are not replaced by it. Where a product note and this policy differ, this policy governs and the product note is corrected.\n\n" +
        "What credit assesses. Every proposal is assessed on repayment capacity, willingness to repay, and the security available if both fail. The order matters. A facility is not sanctioned because the security is good; security is what remains when the assessment of capacity was wrong. Loan to value is a limit on loss, not a substitute for underwriting.\n\n" +
        "Four eyes. No person may both source and sanction. No person may sanction a facility they appraised. The credit function reports to the Chief Credit Officer and not to the business, at every level. A business head may escalate a decision; they may not overturn one.\n\n" +
        "Repayment capacity. Assessed from documented income, adjusted for existing obligations disclosed on the bureau and observed in bank statements. The fixed obligation to income ratio ceiling is 55 per cent for salaried borrowers with monthly income above 50,000 rupees, 50 per cent below that, and 45 per cent for self-employed borrowers assessed on financial statements. The proposed instalment is included in the numerator. Obligations visible on a bank statement but absent from the bureau are included; obligations reported closed on the bureau within the last 60 days require evidence of closure.\n\n" +
        "Willingness. The bureau record is the principal evidence. A current overdue of more than 30 days on any live facility is a decline at hub level and may only be taken as a deviation by the Regional Credit Manager with a written rationale. A written-off or settled account within the last 36 months is a deviation regardless of amount. A bureau score is one input and never the decision by itself; a thin file is not a bad file.\n\n" +
        "Ability to verify. Anvira does not lend where it cannot verify. Where income cannot be documented in any of the ways the product note permits, the file is declined rather than approved against a higher rate or a lower loan to value. Pricing does not cure an unverifiable file.\n\n" +
        "End use. Every facility states its end use in the sanction and, above the thresholds in the product note, evidence of end use is a post-disbursement obligation. A facility whose stated end use is not permitted by the product note is not sanctioned, and a facility drawn for a purpose other than the one sanctioned is an event of default.",
    },
    {
      id: "CR-002", title: "Deviation Matrix and Exception Approval", cat: "credit", clearance: 2, scopes: ["credit", "policy", "risk"],
      owner: "Chief Credit Officer", updated: "2026-04-01", rev: "8.3", system: "Policy Repository",
      tags: ["deviation", "exception", "approval authority", "compensating control", "matrix", "escalation", "undelegable"],
      body:
        "A deviation is a sanction that departs from a stated norm in the credit policy or a product note. Deviations are permitted, recorded and monitored. A departure that is not recorded as a deviation is not a deviation; it is a policy breach, and the distinction is the whole point of this document.\n\n" +
        "Recording. Every deviation is recorded against a code from the deviation register with the norm, the actual, the rationale, the compensating control and the approving authority. A file may not be disbursed while a deviation is recorded as pending. The approving authority is the person, not the office: the record names an individual.\n\n" +
        "Authority by deviation. Loan to value in excess of the norm by up to five percentage points: Credit Manager. Up to ten points: Regional Credit Manager. Beyond ten points: Chief Credit Officer. Fixed obligation to income ratio in excess by up to five points: Credit Manager; beyond that, Regional Credit Manager. Bureau score below the product floor by up to 30 points: Credit Manager; beyond that, Regional Credit Manager. A current overdue above 30 days on a live facility: Regional Credit Manager only. A written-off or settled account in the last 36 months: Regional Credit Manager up to 25 lakh exposure, Chief Credit Officer above.\n\n" +
        "Combinations escalate. Where a file carries two deviations, the approving authority is one level above the higher of the two. Where it carries three or more, the Chief Credit Officer approves regardless of the individual levels. Counting deviations as separate approvals at their individual levels is the most common way this matrix is defeated and is treated as a breach.\n\n" +
        "Not delegable at any level. A bureau deviation together with an income assessment deviation. A loan to value deviation on a property that also carries a title or valuation deviation. Any deviation on a facility to an employee, a director, their relatives, or an entity connected to them. Any deviation on a facility to a person connected with an empanelled valuer, advocate, recovery agency or verification agency. These go to the Credit Committee.\n\n" +
        "Compensating controls. A compensating control is something that reduces the risk the norm was protecting against. A higher rate of interest is not a compensating control; it is pricing. Acceptable compensating controls include additional collateral, a reduced tenor, a co-applicant with independent income, a larger own contribution, an escrow of receivables, and a shorter first review date. The control is recorded and its continued existence is monitored.\n\n" +
        "Monitoring. Deviation volumes are reported monthly by product, region, branch, sourcing channel and approving authority. A branch or a channel whose deviation rate exceeds twice the product average for two consecutive months is reviewed by the Regional Credit Manager, and the review is minuted whether or not it finds anything.",
    },
    {
      id: "CR-003", title: "Income Assessment Standards", cat: "credit", clearance: 2, scopes: ["credit"],
      owner: "Chief Credit Officer", updated: "2026-02-26", rev: "6.1", system: "Policy Repository",
      tags: ["income", "salaried", "self-employed", "banking", "ITR", "GST", "cash flow", "seasonal", "surrogate"],
      body:
        "Income is assessed from documents that a third party produced, and corroborated against banking. A document the applicant produced for the purpose of the application is corroboration, not evidence.\n\n" +
        "Salaried. Latest three salary slips, six months of salary credit in the bank statement, and the latest Form 16 or two years of income tax returns where the tenor exceeds five years. Net take-home is used, not gross. Variable pay is included at 50 per cent where it has been received in each of the last four quarters and at nil otherwise. An employer not on the approved employer list requires the employer to be verified independently.\n\n" +
        "Self-employed, documented. Two years of income tax returns with computation, two years of audited or certified financial statements where turnover requires them, twelve months of banking for every operating account, and goods and services tax returns for the same period where the applicant is registered. Income is assessed on the lower of the declared profit and the profit implied by banking turnover at the margin appropriate to the trade.\n\n" +
        "Seasonal income. Where income arrives in two or three concentrated periods a year, annual income is assessed over a full twelve months rather than annualised from a strong quarter, and the repayment structure is matched to the pattern where the product permits it. Assessing a seasonal borrower on a peak quarter is the single most common cause of early delinquency in the business loan book and is a recorded deviation, not a judgement call.\n\n" +
        "Cash income. Cash receipts not routed through a bank account are not counted as income. Where a trade is genuinely cash-based, the applicant is assessed on banked receipts only, and the resulting eligibility is what it is. A borrower whose banked receipts do not support the instalment is not made eligible by an assertion about cash.\n\n" +
        "Surrogate programmes. Where the product note permits a surrogate, the surrogate substitutes for the income document, never for the assessment. Permitted surrogates are set out in each product note with their own caps and are not transferable between products.\n\n" +
        "Banking analysis. Twelve months where available, six months minimum. Reviewed for average balance, credit summation, inward returns, existing obligation debits, and any pattern of funds arriving immediately before a balance is required. Three or more inward returns in six months is a deviation. Round-sum credits immediately before the statement period ends are reported to the risk containment unit rather than assessed.",
    },
    {
      id: "CR-004", title: "Collateral, Valuation and Title", cat: "credit", clearance: 2, scopes: ["credit", "legal", "ops"],
      owner: "Chief Credit Officer", updated: "2026-03-19", rev: "7.0", system: "Policy Repository",
      tags: ["collateral", "valuation", "title", "search report", "LTV", "property", "negative list", "valuer", "encumbrance"],
      body:
        "Security is taken to limit loss, not to justify a facility. Every secured facility requires a valuation and a title investigation, and neither may be waived by any authority below the Credit Committee.\n\n" +
        "Valuation. Two independent valuations from empanelled valuers are required where the property value exceeds one crore rupees, and the lower is used. Below that, one valuation is sufficient. A valuation is valid for six months. A valuation more than six months old at the date of disbursal is refreshed, and a refresh that produces a materially lower figure re-opens the sanction rather than being noted on the file. The same valuer may not value more than three properties for the same borrower or the same sourcing channel in a rolling quarter.\n\n" +
        "Loan to value. Loan to value is computed on the lower of the transaction value and the assessed market value, never on the distress or realisable value and never on a guidance value where it is higher. Product ceilings are in the product notes. Any funding of stamp duty, registration or fees is included in the numerator.\n\n" +
        "Title. A search report from an empanelled advocate covering the period required by the product note, an encumbrance certificate, the chain of title, approved plans, and evidence of the property's permitted use. A title report with a qualification is a deviation whose level depends on the qualification: a technical qualification capable of cure is a Credit Manager deviation with the cure as a post-disbursement condition; a qualification going to the root of title is not sanctionable at any level.\n\n" +
        "Negative list. Properties on the negative list are not funded: agricultural land where conversion has not been effected, properties in unauthorised or unapproved layouts, properties under litigation, properties where the approach is not a legally recorded right of way, industrial property in a category the product note excludes, properties within the prohibited distance of a defence or railway installation, and any property where the borrower's interest is a lease with less than twice the loan tenor remaining.\n\n" +
        "Creation and perfection. Security is created in the manner the product note requires and registered where registration is required. A charge that is created but not registered within the statutory window is a post-disbursement failure with a real consequence, not an administrative one, and is escalated to Legal on the day it is discovered rather than at the next review.",
    },
    {
      id: "CR-005", title: "Credit Product Note: Loan Against Property", cat: "credit", clearance: 2, scopes: ["credit", "product"],
      owner: "Head of Secured Lending", updated: "2026-03-30", rev: "9.2", system: "Policy Repository",
      tags: ["LAP", "loan against property", "secured", "LTV", "tenor", "end use", "self-occupied", "commercial property"],
      body:
        "Loan against property is a secured facility to individuals and non-individual entities against residential or commercial property owned by the borrower or a co-applicant. Written by Anvira Finserv Limited. Loans for the purchase or construction of a residence are written by Anvira Housing Finance under its own product note and are not covered here.\n\n" +
        "Eligibility. Individuals aged 24 to 65 at maturity, and entities with three completed years of operation. Every owner of the property is a co-applicant without exception. A property owned partly by a minor is not accepted.\n\n" +
        "Loan to value. Self-occupied residential up to 65 per cent. Rented residential up to 60 per cent. Self-occupied commercial up to 60 per cent. Rented commercial up to 55 per cent. Industrial property up to 50 per cent and only where the product is available in that location. Special category properties, including those with a single potential buyer, up to 40 per cent.\n\n" +
        "Ticket and tenor. Minimum 10 lakh, maximum 7.5 crore. Tenor up to 15 years for residential security and 12 years for commercial, and in every case not beyond the borrower's 65th birthday and not beyond the residual life of the property assessed by the valuer less five years.\n\n" +
        "Rate basis. Available on a floating rate linked to the published benchmark, and on a fixed rate for the first three years reverting to floating. The rate basis is stated in the sanction letter and in the key facts statement and determines what may be charged on pre-payment, so it is never left to be inferred from the schedule.\n\n" +
        "End use. Business expansion, working capital, purchase of commercial premises, debt consolidation, and personal purposes including education and medical treatment. Not permitted: any speculative purpose, investment in capital markets, on-lending, purchase of agricultural land, or any purpose prohibited by law. End use evidence is a post-disbursement obligation above 50 lakh and is called for within 90 days of disbursal.\n\n" +
        "Documentation. Identification and address for every applicant, income as per the income assessment standards, property title chain, valuation, insurance of the property assigned to Anvira, and the security documents appropriate to the state. Insurance covering the property for not less than the outstanding is a continuing obligation, not a one-time document.",
    },
    {
      id: "CR-006", title: "Credit Product Note: Business Loan, Unsecured", cat: "credit", clearance: 2, scopes: ["credit", "product"],
      owner: "Head of Unsecured Lending", updated: "2026-05-14", rev: "7.1", system: "Policy Repository",
      tags: ["business loan", "unsecured", "MSME", "vintage", "GST", "banking surrogate", "turnover"],
      body:
        "An unsecured term facility to proprietorships, partnerships, limited liability partnerships and private limited companies for working capital and business expansion. Written by Anvira Finserv Limited.\n\n" +
        "Eligibility. Business vintage of three completed years evidenced by registration and by banking. Minimum annual turnover 40 lakh where assessed on financial statements, 60 lakh where assessed on a banking surrogate. Applicant aged 25 to 60 at maturity. The business and the applicant must both be resident in a location Anvira serves, and the business premises must be verifiable.\n\n" +
        "Ticket and tenor. Minimum 3 lakh, maximum 75 lakh. Tenor 12 to 48 months. Facilities above 25 lakh require a personal guarantee from every partner, designated partner or director holding more than 20 per cent.\n\n" +
        "Assessment routes. Financial statement route: two years of returns and statements, eligibility at up to 3.0 times average annual cash profit. Banking surrogate route: twelve months of banking across all operating accounts, eligibility at up to 20 per cent of annual credit summation net of inter-account transfers, contra entries and any single credit exceeding 15 per cent of the total. Goods and services tax route: twelve months of filed returns, eligibility at up to 15 per cent of declared annual turnover. Only one route is used and the route is recorded in the sanction.\n\n" +
        "Bureau. Commercial and consumer bureau reports for the entity and for every guarantor. Consumer score floor 700, and a commercial report showing any account in the substandard category or worse is a decline not open to deviation below the Chief Credit Officer.\n\n" +
        "Known weakness. The banking surrogate route is where this product's early delinquency concentrates, and the cause is almost always inter-account transfers not being netted properly at the assessment stage. Where a borrower operates more than two current accounts, netting is verified by a second person before sanction.\n\n" +
        "Not permitted. Businesses on the excluded activity list, entities less than three years old however strong the promoter, borrowers whose only banking is with a co-operative institution not on the approved list, and any facility whose stated purpose is the repayment of another unsecured facility taken within the preceding six months.",
    },
    {
      id: "CR-007", title: "Credit Product Note: Personal Loan", cat: "credit", clearance: 2, scopes: ["credit", "product"],
      owner: "Head of Unsecured Lending", updated: "2026-05-14", rev: "8.0", system: "Policy Repository",
      tags: ["personal loan", "unsecured", "salaried", "employer category", "FOIR", "bureau", "digital"],
      body:
        "An unsecured term facility to salaried individuals for personal purposes. Written by Anvira Finserv Limited and offered through branches, direct sourcing agents and the digital channel.\n\n" +
        "Eligibility. Salaried individuals aged 23 to 58 at maturity, in continuous employment for 12 months and with the current employer for 6 months. Net monthly income at least 25,000 rupees in metropolitan locations and 20,000 elsewhere. The employer must be on the approved employer list; employers outside it require independent verification and attract a lower ceiling.\n\n" +
        "Employer categories. Category A covers listed entities, public sector undertakings and government. Category B covers established private employers meeting the vintage and headcount thresholds. Category C covers everything else that passes verification. Eligibility multiples and rate bands differ by category and are set out in the pricing circular, not here, because they change more often than this note does.\n\n" +
        "Ticket and tenor. Minimum 50,000 rupees, maximum 25 lakh subject to eligibility. Tenor 12 to 60 months. Fixed rate for the full tenor.\n\n" +
        "Bureau floor. Score floor 720 for category C, 700 for category B, 680 for category A. Below the floor by up to 30 points is a Credit Manager deviation; beyond that, Regional Credit Manager. No facility is sanctioned to an applicant with a current overdue above 30 days on any live account without a Regional Credit Manager deviation and a written rationale.\n\n" +
        "Obligation ratio. The fixed obligation to income ratio ceiling is 55 per cent, including the proposed instalment. Where the applicant holds more than three live unsecured facilities, the ceiling reduces to 50 per cent regardless of income, and where they hold more than five, the file is declined irrespective of ratio.\n\n" +
        "Digital channel. Where the facility is sourced through a digital application, the identification, the disclosures and the consent sequence follow the digital lending policy, and the credit assessment is not relaxed on the grounds that the journey is digital. The same floors, ratios and documentation apply.",
    },
    {
      id: "CR-008", title: "Credit Product Note: Commercial Vehicle Finance", cat: "credit", clearance: 2, scopes: ["credit", "product"],
      owner: "Head of Vehicle Finance", updated: "2026-06-02", rev: "10.1", system: "Policy Repository",
      tags: ["commercial vehicle", "CV", "used vehicle", "hypothecation", "margin", "first time buyer", "fleet", "tipper", "funding percentage", "construction equipment", "route"],
      body:
        "Finance for new and used commercial vehicles: goods carriers, passenger carriers, tippers and construction equipment. Written by Anvira Finserv Limited and sourced principally through dealer counters and direct sourcing agents.\n\n" +
        "Borrower segments. First time buyer, first time user, small fleet operator with two to five vehicles, and fleet operator with more than five. Each carries its own margin, tenor and documentation requirements, and the segment is recorded in the sanction because it determines the collections strategy later.\n\n" +
        "Margin. New vehicle to a fleet operator: up to 90 per cent funding. New vehicle to a first time buyer: up to 80 per cent. Used vehicle up to five years old: up to 75 per cent of the assessed value. Used vehicle five to eight years old: up to 65 per cent. Vehicles older than eight years at the end of the proposed tenor are not funded. Tippers and construction equipment carry a five percentage point lower ceiling in every segment because their resale is narrower.\n\n" +
        "Tenor. New vehicles up to 60 months. Used vehicles up to 48 months and in no case beyond the vehicle completing ten years from date of first registration.\n\n" +
        "Assessment. Fleet operators are assessed on financial statements and on route viability. First time buyers are assessed on the attached load or route, the driving licence and experience, and a guarantor with independent income. A first time buyer without either an attached route or a guarantor is a decline, not a higher-margin approval.\n\n" +
        "Security. Hypothecation of the vehicle endorsed on the registration certificate, comprehensive insurance with Anvira as loss payee, and a personal guarantee for non-individual borrowers. The endorsement of hypothecation on the registration certificate is a post-disbursement obligation with a hard timeline and is the single largest open item in the secured book.\n\n" +
        "Known weakness. First instalment bounce rates on this product are structurally higher than on any other secured product. The dominant causes are the gap between the disbursal date convention in the applicable scheme and the mandate registration lead time, not borrower quality, and any analysis that treats them as the same thing will reach the wrong conclusion.",
    },
    {
      id: "CR-009", title: "Credit Product Note: Gold Loan", cat: "credit", clearance: 1, scopes: ["credit", "product", "gold"],
      owner: "Head of Gold Loans", updated: "2026-04-22", rev: "6.4", system: "Policy Repository",
      tags: ["gold loan", "ornament", "purity", "LTV", "auction", "release", "tenor", "renewal", "vault"],
      body:
        "A facility against the pledge of gold ornaments, written by Anvira Finserv Limited at designated branches only. Ornaments only: bullion, coins other than those permitted, and primary gold are not accepted.\n\n" +
        "Loan to value. Funding does not exceed 75 per cent of the value of the pledged ornaments at any time during the tenor, computed on the net weight of gold content and on the reference rate published daily by Treasury, being the average closing price of the preceding thirty days for the relevant purity. Making charges, stones and any non-gold component are excluded from the valuation entirely.\n\n" +
        "Appraisal. Appraisal is carried out at the branch by a certified appraiser in the physical presence of the customer. Purity is assessed by touchstone and confirmed by a second method where the assessed purity is below 20 carat. Gross weight, stone deduction and net weight are recorded on the appraisal certificate, signed by the appraiser and the customer, and a copy is given to the customer before the packet is sealed.\n\n" +
        "Tenor and renewal. Standard tenor 12 months. Renewal on payment of accrued interest and a fresh appraisal, and a renewal is a fresh facility rather than a continuation. Rolling over accrued interest into a renewed principal is not permitted.\n\n" +
        "Loan to value breach during the tenor. Where the loan to value ratio exceeds the ceiling because of a fall in the reference rate, the customer is given notice to pay the shortfall or pledge additional ornaments within the period stated in the notice. A facility in breach is not renewed and is not topped up.\n\n" +
        "Auction. Where dues remain unpaid after the notice period, ornaments are sold by public auction with prior notice to the customer stating the date and place. The auction is conducted through an approved auctioneer. Anvira does not participate in the auction of its own pledged ornaments. Any surplus over dues and reasonable costs is returned to the customer within seven working days of the sale, and any shortfall remains recoverable from the customer.\n\n" +
        "Release on closure. On full repayment the ornaments are released to the customer within seven working days, in the same sealed packet, verified against the appraisal certificate in the customer's presence. Where release is delayed beyond that period for a reason attributable to Anvira, compensation is payable to the customer at the rate set in the pricing circular for each day of delay.",
    },
    {
      id: "CR-010", title: "Credit Product Note: Loan Against Securities and Margin Funding", cat: "credit", clearance: 2, scopes: ["credit", "product", "capmkt"],
      owner: "Head of Capital Markets Lending", updated: "2026-06-18", rev: "5.0", system: "Policy Repository",
      tags: ["LAS", "loan against shares", "mutual fund", "margin trade funding", "cover", "margin call", "invocation", "approved list", "IPO", "ESOP"],
      body:
        "Facilities against listed securities and mutual fund units, including margin trade funding, employee stock option financing and public issue financing. Written by Anvira Finserv Limited from the Mumbai desk only. This is the one product where the security's value changes every trading day, and every rule below follows from that.\n\n" +
        "Approved securities. Only securities on the approved list are accepted. The list is maintained by the Risk function, reviewed monthly and immediately on a market event, and is based on index membership, market capitalisation, delivery volumes and impact cost. Securities under a surveillance measure, in a trade-to-trade segment, or subject to a corporate action pending record date are removed from the list until the position resolves.\n\n" +
        "Cover. Facilities against listed equity shares are maintained at a minimum cover consistent with the regulatory margin applicable to the entity, computed daily on the closing price. Facilities against debt-oriented mutual fund units carry a lower margin as set in the risk circular. Cover is computed on the portfolio, not security by security, but a single security may not exceed 40 per cent of the pledged portfolio value.\n\n" +
        "Daily valuation and margin call. The portfolio is valued after market close every trading day. Where cover falls below the required level, a margin call is issued the same evening by email and message. The customer has until the close of the second trading day after the call to restore cover by paying down the facility or pledging additional approved securities.\n\n" +
        "Invocation. Where cover is not restored within the cure period, the pledge is invoked and securities are sold to restore cover, beginning with the most liquid holding. Invocation is authorised by the Head of Capital Markets Lending and is not a desk decision. The customer is informed before the sale where the cure period has expired, and immediately after where market conditions required same-day action under the emergency provision.\n\n" +
        "Employee stock option financing. Funded against the shares to be allotted on exercise, with the allotment routed to the pledged account. The facility is bridging in nature with a maximum tenor of 12 months and is not renewed. Eligibility is assessed on the employee's income independently of the value of the shares.\n\n" +
        "Public issue financing. Funded per applicant against the application, within the ceiling per borrower per issue set in the risk circular. The facility is settled from the refund and the allotment on listing, and the desk does not carry an unallotted position beyond the settlement date.",
    },
    {
      id: "CR-011", title: "Credit Product Note: Microfinance, Joint Liability Group", cat: "credit", clearance: 1, scopes: ["credit", "product", "mfi"],
      owner: "Anvira Microfinance, Head of Credit", updated: "2026-03-11", rev: "5.3", system: "Policy Repository",
      tags: ["microfinance", "JLG", "joint liability", "household income", "indebtedness", "centre meeting", "collateral free", "MFI"],
      body:
        "Collateral-free loans to women organised in joint liability groups, written by Anvira Microfinance Limited, an NBFC-MFI. This product is not written by Anvira Finserv Limited and the parent's credit policy does not govern it; this note and the microfinance credit policy do.\n\n" +
        "Household income ceiling. Lending is confined to households whose annual income does not exceed the ceiling notified for the category of location. Household income is the income of all members of the household from all sources, assessed by a structured interview at the borrower's residence and corroborated by the group, and recorded on the household income assessment sheet. The assessment is refreshed at every fresh loan cycle rather than carried forward.\n\n" +
        "Indebtedness. The total repayment obligation of a household to all lenders, including the proposed loan, does not exceed the prescribed share of monthly household income. Obligations are established from the credit information report of every adult member of the household, not of the applicant alone. A household already served by the maximum permitted number of lenders is not eligible however small the proposed loan.\n\n" +
        "Group formation. Groups of five to ten women from the same locality, self-selected, not related to one another within the group, each with an independent income-generating activity. Group recognition follows a compulsory group training and a group recognition test conducted by an officer who did not form the group. A group formed and recognised by the same person is a control failure.\n\n" +
        "Collateral and guarantee. No collateral, no security deposit and no guarantee is taken. The joint liability is moral and is not enforced as a legal guarantee against other members. No member is compelled to pay another member's instalment, and any practice of holding a centre meeting until a shortfall is made good is prohibited.\n\n" +
        "Pricing and transparency. The interest rate, the processing fee and the insurance premium are the only charges. There is no penalty on delayed payment, no prepayment penalty, and no security deposit. The loan card given to the borrower states the amount, the rate, the total payable, the schedule and the grievance route in the local language.\n\n" +
        "Collection conduct. Collection takes place at the designated centre meeting place at the agreed time. Recovery is not made at the borrower's residence except where the borrower has failed to attend two consecutive meetings, and never at an odd hour. No group member and no member of a borrower's family is approached to recover another member's dues.",
    },
    {
      id: "CR-012", title: "Wholesale Credit Policy: Structured and Promoter Funding", cat: "wholesale", clearance: 3, scopes: ["wholesale", "credit"],
      owner: "Chief Credit Officer", updated: "2026-05-27", rev: "4.2", system: "Policy Repository",
      tags: ["wholesale", "structured", "promoter funding", "real estate", "covenant", "security cover", "escrow", "special situations"],
      body:
        "Wholesale exposures are individually negotiated facilities to corporate borrowers: structured and mezzanine finance, promoter funding against listed and unlisted holdings, real estate project finance, and special situations. Every wholesale exposure is sanctioned by the Credit Committee regardless of amount.\n\n" +
        "What is underwritten. In wholesale, the documentation is the product. The covenant package, the security structure, the cash flow waterfall and the conditions to drawdown are underwritten with the same rigour as the borrower's financials, because they are what converts a view about a business into a recoverable exposure.\n\n" +
        "Security cover. Promoter funding against listed holdings is maintained at a minimum cover of 2.0 times the outstanding, tested on the closing price at each month end and at any time the Risk function calls a test. Real estate project exposures are secured on the project land, the receivables and the shares of the project entity, at a minimum cover of 1.75 times computed on the security value assessed at sanction and revalued annually.\n\n" +
        "Covenants. Every facility carries financial covenants tested at the frequency stated in the agreement, information covenants requiring periodic financial and operating data, and affirmative and negative covenants. A covenant test that is missed is treated as a breach unless the agreement expressly provides otherwise; silence is not a cure.\n\n" +
        "Escrow and cash flow. Real estate and receivable-backed exposures are structured with the designated escrow as the only permitted route for project receipts, with the waterfall documented and the account bank instructed. Escrow leakage is an event of default in its own right and is escalated to the Credit Committee on discovery, not at the next monitoring cycle.\n\n" +
        "Waivers. A covenant waiver is approved by the Credit Committee alone. A relationship manager, a business head and the Chief Credit Officer individually may not waive a covenant. A waiver is granted for a defined period against a defined remedy and is recorded with an expiry date; a waiver without an expiry date has not been granted.\n\n" +
        "Monitoring. Each exposure carries a monitoring calendar naming every test, its date, the evidence required and the accountable person. The calendar is reviewed monthly by the Chief Risk Officer. A test whose evidence has not been received within 15 days of its due date is reported as an exception whether or not the underlying position is believed to be sound.",
    },
    {
      id: "CR-013", title: "Credit Scorecard and Model Governance", cat: "credit", clearance: 3, scopes: ["credit", "risk"],
      owner: "Chief Risk Officer", updated: "2026-02-06", rev: "3.1", system: "Portfolio Analytics",
      tags: ["scorecard", "model", "validation", "override", "drift", "governance", "cut-off", "champion challenger"],
      body:
        "Anvira uses application scorecards for personal loans, business loans and two-wheeler finance, and behavioural scorecards for portfolio management across the retail book. A scorecard informs a decision; it does not take one. No facility is declined solely because of a score, and no facility is approved solely because of a score.\n\n" +
        "Model inventory. Every model in use is registered with its purpose, its development sample, its performance metrics at development, its approved cut-offs, its owner and its validation date. A model not in the inventory may not be used in a decision, and a model in production without a current validation is escalated to the Risk Committee.\n\n" +
        "Validation. Independent validation before deployment and annually thereafter, covering discrimination, calibration, stability of the population and stability of the individual characteristics. Where the population stability index exceeds 0.25 on the overall score or 0.10 on any characteristic carrying more than 15 per cent of the weight, the model is reviewed out of cycle.\n\n" +
        "Overrides. An underwriter may override a scorecard recommendation within the deviation matrix. Every override is recorded with a reason code. Override rates are monitored by product, region and underwriter: an override rate above 15 per cent indicates either that the cut-off is wrong or that the underwriting is, and both are worth knowing. A model whose recommendations are overridden more than a quarter of the time is not in use, whatever the inventory says.\n\n" +
        "Drift and the limits of a score. A scorecard is built on a population and a period. Where sourcing mix, geography or scheme structure changes materially, the score's meaning changes with it even though the number looks the same. The most common misreading in this business is to conclude from an unchanged score distribution that credit quality is unchanged, when the thing that moved was not credit quality at all.\n\n" +
        "Champion and challenger. Material changes to a cut-off are deployed as a challenger on a defined share of volume for at least two full vintage cycles before adoption. A cut-off changed without a challenger requires Risk Committee approval and a written rationale.",
    },
    {
      id: "CR-014", title: "Credit Approval Process and Turnaround Standards", cat: "credit", clearance: 1, scopes: ["credit", "ops"],
      owner: "Chief Credit Officer", updated: "2026-01-29", rev: "5.5", system: "Loan Origination",
      tags: ["turnaround", "TAT", "login", "query", "sanction", "process", "queue", "SLA", "dedupe"],
      body:
        "This procedure sets out how a file moves from sourcing to sanction, and the standards each stage is held to. Turnaround is measured from login, and login has a definition, because a file counted as logged before it is complete makes the turnaround number meaningless.\n\n" +
        "Login. A file is logged when the application form is complete and signed, identification and address documents for every applicant are present and legible, income documents for the assessment route are present, the processing fee instrument is received, and the property or asset details are recorded where the product is secured. A file missing any of these is not logged and is returned the same day with the specific gap named.\n\n" +
        "Deduplication and bureau. Run at login, before any assessment work. Deduplication is run on identifier, name and date of birth, mobile number and address across the parent and both subsidiaries. A positive match is investigated before the file proceeds, and a match on an account in default is a decline unless the Regional Credit Manager records otherwise.\n\n" +
        "Queries. A query is raised once, in writing, listing every gap. Raising queries one at a time is the single largest avoidable component of turnaround and is monitored by underwriter. A file may not be queried a second time on a point that was visible at the first query unless new information has come in.\n\n" +
        "Turnaround standards. Unsecured retail: decision within two working days of a complete file. Secured retail: within five working days of a complete file, exclusive of the time taken for valuation and title, each of which carries its own standard of three and five working days. Wholesale: no standard turnaround; each case carries a timetable agreed at mandate.\n\n" +
        "Sanction. The sanction records the amount, rate, tenor, schedule, security, every deviation with its approver, every condition precedent and every post-disbursement obligation with its due date. A condition recorded without a due date is not a condition. The sanction letter and the key facts statement are issued to the customer before the agreement is executed.\n\n" +
        "Validity. A sanction is valid for 90 days for unsecured facilities and 180 days for secured. An expired sanction is re-appraised rather than extended, with fresh bureau and fresh income where the expiry exceeds 30 days.",
    },

    /* ================= PRODUCTS, PRICING AND DISCLOSURE ================= */
    {
      id: "PR-001", title: "Interest Rate Policy and Pricing Framework", cat: "product", clearance: 2, scopes: ["product", "credit", "fincon"],
      owner: "Chief Financial Officer", updated: "2026-04-08", rev: "8.0", system: "Policy Repository",
      tags: ["interest rate", "pricing", "benchmark", "spread", "floating", "fixed", "risk based pricing", "reset", "annualised"],
      body:
        "This policy governs how Anvira Finserv Limited arrives at the rate of interest on every facility. Each subsidiary maintains its own rate policy approved by its own board. The rate approach, the gradation of risk and the rationale for charging different rates to different borrowers are disclosed on the website and in the sanction letter.\n\n" +
        "Components. Every rate is built as cost of funds, plus operating cost, plus credit cost for the product and risk band, plus margin. The cost of funds input is published monthly by Treasury and is the same for every product; the other three vary. No facility is priced below the sum of cost of funds and credit cost for its band without Chief Financial Officer approval recorded against the file.\n\n" +
        "Floating rate facilities. Priced as a spread over the Anvira benchmark lending rate, which is published monthly and is not changed retrospectively. The spread is fixed at sanction for the life of the facility unless the agreement provides for a reset on a defined event. When the benchmark moves, the rate moves with it and the borrower is informed of the revised rate, the revised instalment or tenor, and the effective date, before the change takes effect.\n\n" +
        "Fixed rate facilities. The rate is fixed for the period stated in the sanction. Where a facility is fixed for an initial period and floating thereafter, the sanction letter, the key facts statement and the agreement all state the date on which the basis changes and how the floating rate will then be computed. This is not a detail: whether a facility is fixed or floating at the moment a borrower asks to pre-pay determines whether any charge may be levied at all.\n\n" +
        "Annualised rate. Every rate communicated to a borrower is an annualised rate. A monthly rate is never quoted to a borrower without the annualised equivalent alongside it, and never quoted alone in any customer-facing document, advertisement or digital journey.\n\n" +
        "Gradation of risk. Rate bands are set by product, by borrower segment, by security type and by bureau band. Two borrowers of the same product may be priced differently, and the file records which band was applied and why. A rate outside the band for the recorded segment is a pricing deviation approved by the Head of the product and reported monthly.\n\n" +
        "Excessive rate. No facility carries a rate that is excessive relative to the cost and the risk. The board reviews the rate range for every product annually against the credit cost actually incurred, and where a product's realised credit cost is materially below the credit cost priced in, the band is reduced rather than the margin being retained.",
    },
    {
      id: "PR-002", title: "Schedule of Charges", cat: "product", clearance: 1, scopes: ["product", "service", "ops"],
      owner: "Head of Products", updated: "2026-06-01", rev: "11.2", system: "Policy Repository",
      tags: ["charges", "fee", "processing fee", "bounce charge", "dishonour", "statement", "duplicate", "schedule", "disclosure"],
      body:
        "This schedule lists every charge Anvira Finserv Limited may recover from a borrower. A charge that is not in this schedule may not be recovered, whatever a system parameter, a letter or a local practice says. Every charge is disclosed in the key facts statement before the contract is executed and is displayed on the website.\n\n" +
        "Processing fee. Up to 2 per cent of the sanctioned amount for secured retail facilities and up to 3 per cent for unsecured, subject to the product note. Recovered on disbursal. Where a sanctioned facility is not availed, the processing fee is refunded net of the actual out-of-pocket costs incurred, itemised to the customer.\n\n" +
        "Instrument dishonour charge. 500 rupees per instance for retail facilities and 750 for business facilities, recovered once per instrument per presentation. Where an instrument is represented in the same cycle, the charge is levied once for the cycle, not once per presentation. Where dishonour arises from a technical failure at Anvira's end or at the sponsor bank rather than from insufficiency of funds, no charge is levied and any charge already applied is reversed without the customer having to ask.\n\n" +
        "Servicing charges. Duplicate statement 250 rupees. Duplicate no-objection certificate 500. Repayment instrument swap 500. Amortisation schedule, interest certificate and provisional certificate are provided free once each financial year and at 250 rupees thereafter. No charge is levied for a statement of account requested in connection with a complaint.\n\n" +
        "Collection and legal costs. Actual costs of a field visit, a notice, or legal proceedings are recoverable only where the loan agreement expressly provides for their recovery and only against evidence of the cost incurred. A standard recovery charge not linked to an actual cost is not a permitted charge.\n\n" +
        "Charges on foreclosure. Governed by PR-004. Nothing in this schedule permits a charge on pre-payment or foreclosure that PR-004 does not permit, and where the two documents differ, PR-004 governs.\n\n" +
        "Taxes. Goods and services tax is applied on charges where applicable and is shown separately in every communication, never absorbed into the headline figure.",
    },
    {
      id: "PR-003", title: "Penal Charges Policy", cat: "product", clearance: 1, scopes: ["product", "collect", "service", "ops"],
      owner: "Chief Compliance Officer", updated: "2026-02-04", rev: "3.0", system: "Policy Repository",
      tags: ["penal charge", "penal interest", "default", "delay", "capitalisation", "compounding", "reversal", "reasonable"],
      body:
        "This policy replaced the previous penal interest regime across Anvira Finserv Limited and both subsidiaries with effect from 1 April 2024. It governs every charge levied on a borrower for a delay in payment or for non-compliance with a term of the facility.\n\n" +
        "Charge, not interest. A charge levied for delayed payment or for breach of a material term is a penal charge. It is not penal interest, it does not form part of the rate of interest, and it is not added to the principal. Recovering a penal charge by adding it to the outstanding and then applying the contracted rate to the resulting figure is capitalisation and is prohibited without exception.\n\n" +
        "No compounding. Penal charges do not compound. A penal charge levied in one cycle does not attract a penal charge in the next merely because it remains unpaid. Interest is never applied to an unpaid penal charge.\n\n" +
        "Quantum. Penal charges are reasonable and proportionate to the breach and are not discriminatory within a product category. For individual borrowers taking a facility for a purpose other than business, the penal charge is not higher than the charge applied to non-individual borrowers for the same breach. The quantum for each product is set out in the pricing circular and is expressed as a fixed amount or a percentage of the overdue instalment, never as a rate per annum on the outstanding.\n\n" +
        "Disclosure. The quantum and the reason for a penal charge are disclosed in the key facts statement, in the sanction letter and in the loan agreement, and are displayed on the website. A reminder for a payment due carries the applicable penal charge alongside the amount due. A charge that appears on a statement without having been disclosed at sanction is reversed.\n\n" +
        "Implementation. Every system parameter, letter template, notice, statement narration and digital journey that referenced penal interest was to be reconfigured before the effective date, and every customer-facing document reissued under the document control standard. The parameter change and the template change are separate tasks owned by different functions, and completing one does not complete the other.\n\n" +
        "Reversal. Where a penal charge has been levied contrary to this policy, it is reversed together with any interest wrongly applied to it, without waiting for the customer to ask, and the reversal is reported to the Chief Compliance Officer as an incident rather than handled as a routine waiver.",
    },
    {
      id: "PR-004", title: "Pre-payment, Part-payment and Foreclosure Charges", cat: "product", clearance: 1, scopes: ["product", "service", "ops", "collect"],
      owner: "Head of Products", updated: "2026-01-12", rev: "4.0", system: "Policy Repository",
      tags: ["foreclosure", "prepayment", "part payment", "closure", "charge", "floating", "fixed", "micro small enterprise", "business purpose", "payoff"],
      body:
        "This policy governs what may be recovered when a borrower repays a facility of Anvira Finserv Limited ahead of schedule, in whole or in part. It applies to facilities sanctioned or renewed on or after 1 January 2026. Facilities sanctioned before that date are governed by the terms of their own agreements, and the applicable regime is determined by the sanction date recorded on the file rather than by the date of the request.\n\n" +
        "Establish four things first. No foreclosure or part-payment figure is quoted until four facts are established and recorded: the product, the interest rate basis on the date of the request, the borrower category, and the end use recorded in the sanction. Whether any charge may be levied at all depends on all four together, and quoting a figure before establishing them is the most common way this policy is breached.\n\n" +
        "Floating rate facilities to individuals for a purpose other than business. No pre-payment or foreclosure charge is levied, whatever the source of funds, whether the repayment is in part or in full, and whether or not a co-borrower is present. There is no lock-in period and no minimum notice.\n\n" +
        "Floating rate facilities to individuals and to micro and small enterprises for a business purpose. No pre-payment or foreclosure charge is levied. Where a borrower's classification as a micro or small enterprise is asserted rather than evidenced on the file, the classification is verified before a charge is quoted, and the file records what was relied on.\n\n" +
        "Fixed rate facilities, and facilities to borrowers outside the categories above. A charge may be levied only where the loan agreement provides for it, only at the rate stated in the key facts statement, and only on the amount pre-paid. The charge is disclosed as an amount in the quote, not as a percentage the customer is left to compute.\n\n" +
        "Computing the payoff. The amount payable is the principal outstanding on the value date, plus interest accrued to that date at the contracted rate, plus any permitted pre-payment charge, plus any unpaid instalment, plus any unpaid penal charge shown separately. Unpaid penal charges are never capitalised into the principal before interest is computed. Any amount held in an unapplied receipt or a suspense entry is set off before the figure is quoted, not after the customer disputes it.\n\n" +
        "Quote validity and closure. A foreclosure quote is valid to the value date stated on it and states the daily interest that accrues after that date. On receipt of the full amount the account is closed, the no-objection certificate is issued and every security is released within the period stated in the product note, and satisfaction of charge is filed with the registry where one was created.",
    },
    {
      id: "PR-005", title: "Key Facts Statement Standard", cat: "product", clearance: 1, scopes: ["product", "credit", "ops", "service", "digital"],
      owner: "Chief Compliance Officer", updated: "2026-03-22", rev: "3.1", system: "Policy Repository",
      tags: ["KFS", "key facts statement", "APR", "annual percentage rate", "disclosure", "amortisation", "acknowledgement", "validity", "all inclusive"],
      body:
        "A key facts statement is provided to every borrower of Anvira Finserv Limited and both subsidiaries for every retail and micro, small and medium enterprise facility, before the loan contract is executed. It is a standard-format summary in simple language, in a language the borrower understands, and it is given whether or not the borrower asks for it.\n\n" +
        "What it contains. The lender's name and the facility type; the sanctioned amount; the tenor; the interest rate and whether it is fixed or floating, with the benchmark and spread where floating; the annual percentage rate; the total amount payable over the tenor; the instalment amount, frequency and number; the fees and charges itemised; the penal charge quantum and what triggers it; the pre-payment position; details of any recovery agent engagement; the grievance route with the name and contact of the officer; and details of any third-party product bundled with the facility.\n\n" +
        "Annual percentage rate. The annual percentage rate is the all-inclusive annualised cost of the facility to the borrower. It includes the interest rate and every fee and cost recovered by Anvira or by any third party on Anvira's behalf, including processing fee, documentation charges, and the premium of any insurance where the insurance is a condition of the facility. It excludes contingent charges that arise only on a breach, such as penal charges and dishonour charges. Where a fee is recovered by deduction from the disbursal, the amount actually received by the borrower is the basis for the computation, not the sanctioned amount.\n\n" +
        "Amortisation schedule. An amortisation schedule accompanies the statement, showing for each instalment the principal component, the interest component and the closing balance. Where the facility carries a moratorium, a step structure or a balloon, the schedule reflects it rather than assuming a level instalment.\n\n" +
        "Validity and acknowledgement. The statement carries a validity period of not less than three working days for facilities with a tenor of seven days or more, during which the terms stated remain available to the borrower. The borrower's acknowledgement of receipt is obtained and retained on the file. A file without the acknowledgement is not disbursement-ready.\n\n" +
        "Nothing outside it. No charge may be recovered at any point in the life of the facility that was not disclosed in the key facts statement, unless the borrower has been separately informed and has agreed. This is the practical reason an error in the statement is not a documentation defect: it constrains what can lawfully be recovered for the whole tenor, on every file cut from the same template.",
    },
    {
      id: "PR-006", title: "Interest Application, Rest and Appropriation", cat: "product", clearance: 2, scopes: ["product", "ops", "fincon"],
      owner: "Financial Controller", updated: "2025-11-18", rev: "2.6", system: "Loan Management",
      tags: ["interest", "accrual", "rest", "broken period", "value date", "day count", "appropriation", "unapplied receipt", "first instalment"],
      body:
        "Interest on term facilities is computed on a monthly rest on the principal outstanding at the beginning of the rest period, on an actual by 365 day count basis. Facilities on a daily rest are identified in their product note and are the exception.\n\n" +
        "Broken period interest. Where disbursal does not coincide with the start of a rest period, interest for the broken period from the date of disbursal to the start of the first full period is recovered separately and is not folded into the first instalment. The amount and the period are shown to the borrower before the first instalment falls due, because an unexplained first debit is one of the most common causes of a first-cycle complaint.\n\n" +
        "First instalment date. The first instalment date is set by the product note or by the applicable scheme circular, and the gap between disbursal and the first instalment is a deliberate parameter rather than an artefact. Where a scheme sets a fixed calendar date for the first instalment irrespective of the disbursal date, the resulting gap can be materially shorter than the standard convention, and the mandate registration lead time must be checked against it before the disbursal is released.\n\n" +
        "Appropriation. Receipts are appropriated in the order set out in the loan agreement. In the absence of a contrary term, appropriation is to costs and charges actually incurred, then to penal charges, then to interest, then to principal. Appropriating a receipt to principal ahead of accrued interest, or to a later instalment ahead of an earlier one, changes what the borrower owes and is not a matter of operational convenience.\n\n" +
        "Value dating. A receipt is value dated to the date the funds were realised, not the date the entry was passed. A receipt realised on a working day and applied two days later is applied with effect from the realisation date, and any interest or penal charge that accrued in between is reversed.\n\n" +
        "Unapplied receipts. A receipt that cannot be matched to an account is held in an unapplied account and investigated within two working days. An unapplied receipt is not income and is never used to suppress a delinquency figure. The balance of unapplied receipts is reported to Central Operations weekly and to the Financial Controller monthly.",
    },
    {
      id: "PR-007", title: "Scheme Circular: Used Commercial Vehicle Dealer Subvention", cat: "product", clearance: 2, scopes: ["product", "credit", "ops"],
      owner: "Head of Vehicle Finance", updated: "2026-02-10", rev: "6.0", system: "Policy Repository",
      tags: ["subvention", "scheme", "used CV", "dealer", "first instalment", "disbursal date", "convention", "renewal", "mandate", "dishonour", "bounce", "interval", "west region"],
      body:
        "This circular sets out the terms of the dealer subvention scheme on used commercial vehicles, under which a participating dealer bears part of the interest cost for an initial period in return for an agreed volume commitment. It applies to Anvira Finserv Limited and supersedes revision 5.2 with effect from 1 March 2026. The scheme is co-terminus with the dealer agreements and comes up for renewal on 31 October 2026, and the participating dealer agreements auto-renew on that date unless notice is given 30 days beforehand.\n\n" +
        "Participating dealers. Twenty-two used commercial vehicle counters across Maharashtra, Gujarat and Madhya Pradesh, listed in the annexure to the dealer agreement. Volume commitment of 40 units a quarter per counter for the full subvention, and a reduced subvention below that.\n\n" +
        "Subvention mechanics. The dealer bears the difference between the card rate and the scheme rate for the first six instalments, settled monthly against the dealer's account. The borrower's contracted rate is the card rate throughout; the borrower's instalment does not change when the subvention period ends, because the subvention is settled with the dealer and not with the borrower.\n\n" +
        "First instalment convention, changed at this revision. Under revision 5.2 the first instalment fell on the corresponding date of the month following disbursal, producing a gap of between 30 and 60 days. Under revision 6.0 the first instalment falls on the 5th of the month following disbursal, irrespective of the disbursal date, so that the dealer settlement cycle and the instalment cycle align. Where a case is disbursed in the last week of a month, the resulting gap between disbursal and the first instalment is as short as nine days.\n\n" +
        "Operational condition. Because the gap can be materially shorter than the standard convention, the repayment mandate must be registered and confirmed active before the disbursal is released on any case under this scheme. Releasing a disbursal against a mandate still in registration leaves the first instalment to be collected with no active mandate, and the resulting dishonour is not a borrower default.\n\n" +
        "Documentation. Standard used commercial vehicle documentation applies without relaxation. The scheme affects pricing and the instalment calendar only; it does not alter margin, tenor, assessment or the endorsement of hypothecation.\n\n" +
        "Review. Scheme performance is reviewed quarterly by the Head of Vehicle Finance against volume, yield net of subvention, and early delinquency. The review is minuted and goes to the Chief Credit Officer.",
    },
    {
      id: "PR-008", title: "Customer Communication Template Register", cat: "product", clearance: 2, scopes: ["product", "ops", "service", "compliance"],
      owner: "Head of Customer Experience", updated: "2026-05-19", rev: "2.2", system: "Customer Relationship",
      tags: ["template", "letter", "notice", "reminder", "narration", "register", "version", "configured", "parent policy", "demand letter"],
      body:
        "This register lists the customer-facing templates in use across Anvira Finserv Limited: letters, notices, reminders, statement narrations, sanction and key facts formats, and the message templates used in the digital and messaging channels. For each template it records the owner, the current version, the date it was last reissued, and the systems in which it is configured.\n\n" +
        "Why the register exists. Templates are configured in three places: the loan management system for statements and system-generated notices, the communication platform for messages and email, and the collections system for reminders and demand letters. A template exists independently in each. Changing a policy changes none of them, and changing one does not change the others.\n\n" +
        "Gaps recorded at this revision. The register covers the retail secured and unsecured products and the gold loan. It does not yet cover the collections system's demand and reminder templates for the vehicle finance products, which are maintained separately by the collections technology team and were brought into scope only in April 2026. Those templates have not been version-mapped to their parent policies.\n\n" +
        "Penal charge reconfiguration, status. Following the penal charges policy, the system parameter governing the computation of penal charges was changed across all products with effect from the policy date. The customer-facing templates were then reissued product by product: retail secured in March 2024, personal and business loans in April 2024, gold in May 2024. The used commercial vehicle templates in the collections system were scheduled for the same exercise and were recorded as complete on the basis of the loan management system change, which is a different system. The demand and reminder templates issued to used commercial vehicle borrowers from the collections system continue to carry the pre-2024 wording, describing a monthly penal interest applied on the outstanding and compounded.\n\n" +
        "No template may state a term the parent does not carry. A template stating a charge, a rate, a consequence or a computation method that its parent policy does not carry is corrected on discovery, and the matter is raised as a document control non-conformance, because the borrower who received it was told something Anvira may not do.\n\n" +
        "Reissue obligation. Where a parent policy is revised, the owner of the parent identifies every template in this register that reproduces or references the changed content and reissues it within 30 days, in every system in which it is configured. Completion is evidenced by the configuration record from each system, not by an email confirming the change was requested.",
    },
    {
      id: "PR-009", title: "Insurance and Third-Party Products", cat: "product", clearance: 1, scopes: ["product", "credit", "service"],
      owner: "Head of Products", updated: "2026-04-30", rev: "3.4", system: "Policy Repository",
      tags: ["insurance", "third party", "bundled", "consent", "optional", "premium", "loss payee", "free look", "mis-selling"],
      body:
        "Anvira distributes insurance as a corporate agent and requires insurance as security on certain facilities. The two are different things and are never presented to a customer as the same thing.\n\n" +
        "Insurance required as security. Where the product note requires the financed asset or the mortgaged property to be insured, the requirement is a condition of the facility, the sum insured is not less than the outstanding, and Anvira is recorded as loss payee. The borrower is free to place that insurance with any insurer of their choice that meets the stated conditions. A borrower who chooses their own insurer is not charged differently and is not delayed.\n\n" +
        "Insurance sold as a product. Life, health and other cover distributed by Anvira is optional in every case. Optional means the facility is sanctioned, priced and disbursed identically whether or not the customer takes it. A customer's decision not to take an optional product is recorded, and no file may be held, re-priced or re-appraised because of it.\n\n" +
        "Consent. Consent to an optional product is separate, explicit and recorded, and is never obtained by a pre-ticked box, a bundled signature, or an inference from silence. In a digital journey the consent is a distinct step the customer must act on. In a branch it is a separate signature on a separate form.\n\n" +
        "Premium funded by the facility. Where the premium of a required insurance is funded by the facility, it is included in the amount financed, disclosed in the key facts statement, and included in the annual percentage rate computation. Where the premium of an optional product is funded, the customer is shown the effect on the instalment and on the total payable before agreeing.\n\n" +
        "Cancellation and refund. Where a customer cancels an optional product within the free-look period, the premium is refunded in full by the insurer and any amount funded by the facility is adjusted against the outstanding. Where a facility is foreclosed, any refund of premium attributable to the unexpired period is claimed and adjusted, and this is done as part of the closure rather than left for the customer to pursue.\n\n" +
        "Mis-selling. Presenting an optional product as compulsory, implying that a facility depends on it, or recording a consent the customer did not give, is a conduct matter rather than a sales practice question. It is reported through the grievance route and investigated as misconduct.",
    },
    {
      id: "PR-010", title: "Product and Scheme Master Register", cat: "product", clearance: 1, scopes: ["product", "credit", "ops"],
      owner: "Head of Products", updated: "2026-06-25", rev: "14.0", system: "Policy Repository",
      tags: ["product master", "scheme", "register", "live", "withdrawn", "code", "entity", "effective date", "lapsed"],
      body:
        "This register is the single list of every product and scheme in force across the group, the entity that writes it, its product code, the current revision of its product note, and its status. A product or scheme not in this register may not be sourced, priced or booked, and a scheme that has lapsed may not be applied to a case sanctioned after its expiry however far advanced the case is.\n\n" +
        "Anvira Finserv Limited. Loan against property; business loan unsecured; personal loan; consumer durable finance; commercial vehicle finance covering new, used and construction equipment; car finance covering new and used; two-wheeler finance; tractor finance; gold loan; loan against securities; margin trade funding; employee stock option financing; public issue financing; wholesale structured finance; promoter funding; real estate project finance.\n\n" +
        "Anvira Housing Finance Limited. Home loan for purchase; home loan for construction; home improvement; balance transfer with top-up; affordable housing. Each carries its own product note under the housing finance company's own credit policy.\n\n" +
        "Anvira Microfinance Limited. Joint liability group income generation loan; group emergency loan; individual graduation loan for members completing three cycles.\n\n" +
        "Schemes in force. Used commercial vehicle dealer subvention, revision 6.0, effective 1 March 2026, review 31 October 2026. Two-wheeler festival scheme, seasonal, currently lapsed. Balance transfer offer on loan against property, revision 3.1, open. Employee banking programme rate concession, revision 2.0, open. Each scheme names its product, its effective date, its expiry and its owner.\n\n" +
        "Withdrawn in the last twelve months. Unsecured business loan express variant, withdrawn September 2025 following the vintage tightening. Personal loan digital pre-approved variant, suspended March 2026 pending the partner review. A withdrawn product's note is retained for the life of the outstanding book written under it, because the terms of those facilities are still governed by it.\n\n" +
        "Change control. A new product, a new scheme, or a change to an existing one is approved by the Product Committee, recorded here with an effective date, and communicated by circular. A scheme communicated by email or in a sales meeting but not recorded here does not exist.",
    },

    /* ================= OPERATIONS ================= */
    {
      id: "OP-001", title: "Pre-disbursal Checklist and Disbursal Procedure", cat: "ops", clearance: 1, scopes: ["ops", "credit"],
      owner: "Central Operations Manager", updated: "2026-05-06", rev: "9.0", system: "Loan Management",
      tags: ["disbursal", "pre-disbursal", "checklist", "condition precedent", "release", "maker checker", "part disbursement", "hold"],
      body:
        "No facility is disbursed until every item on this checklist is satisfied and recorded. Disbursal is the last control before money leaves, and an item deferred here becomes a post-disbursement document that may never arrive.\n\n" +
        "The checklist. Sanction in force and within validity. Loan agreement and every security document executed by every applicant and guarantor, correctly stamped for the state of execution. Key facts statement issued and the borrower's acknowledgement on file. Sanction letter accepted. Every condition precedent satisfied and evidenced, not merely asserted. Identification and address records complete for every applicant. Repayment mandate registered and confirmed active. Insurance in force with Anvira recorded as loss payee where the product requires it. Valuation within validity. Title clear or the qualification cleared to the level the deviation matrix requires. Every deviation approved by the named authority, with none pending. Disbursal account belongs to the borrower and has been verified by penny drop or an equivalent check.\n\n" +
        "Condition precedent versus post-disbursement document. A condition precedent is satisfied before money moves. A post-disbursement document is one that cannot exist until after disbursal, such as a registration certificate bearing the endorsement of hypothecation, or a registered mortgage where registration follows the advance. Anything that could have been obtained before disbursal is a condition precedent, and reclassifying it as a post-disbursement item to release a file is a control breach.\n\n" +
        "Maker and checker. The operations executive who prepares the disbursal does not release it. Release is by a second person of at least the grade specified in the delegation, who re-verifies the checklist rather than confirming that it was ticked.\n\n" +
        "Mandate before money. The repayment mandate must be registered and confirmed active before release. Where a scheme or a product sets a first instalment date that falls close to disbursal, the interval between the two is checked against the mandate registration lead time for the sponsor bank concerned, and the disbursal is held rather than released against a mandate still in registration.\n\n" +
        "Part disbursement. Where the sanction permits tranches, each tranche carries its own condition precedent set and its own release, and the checklist is run again. Interest runs on the amount actually disbursed.\n\n" +
        "Disbursal to a third party. Money is released to the borrower's own account except where the product note expressly permits payment to a dealer, a seller or a builder against the documents that note requires. Payment to any other account is not a variation to be approved locally; it is refused.",
    },
    {
      id: "OP-002", title: "Loan Documentation and Execution Standards", cat: "ops", clearance: 1, scopes: ["ops", "legal", "credit"],
      owner: "Head of Central Operations", updated: "2026-02-20", rev: "7.3", system: "Document Management",
      tags: ["documentation", "execution", "stamping", "witness", "guarantor", "power of attorney", "defect", "custody"],
      body:
        "Loan documents are the only evidence of what was agreed. A defect in execution is not discovered when the file is made; it is discovered years later when the facility is being enforced, which is the point at which it cannot be cured.\n\n" +
        "Execution. Every applicant, co-applicant and guarantor signs in person before an authorised Anvira official or a person authorised in writing to witness. Signatures are matched against the identification record. A document signed outside the presence of a witnessing official is re-executed rather than accepted with a note.\n\n" +
        "Stamping. Documents are stamped in accordance with the law of the state in which they are executed, at the rate applicable on the date of execution, before or at the time of execution. A document stamped in the wrong state, at the wrong rate, or after execution carries a defect that affects its admissibility. Where a discrepancy is discovered, Legal is consulted before any attempt to cure, because an incorrect cure can make the position worse.\n\n" +
        "Non-individual borrowers. A resolution of the board or the partners authorising the borrowing and naming the persons authorised to execute, the constitution documents, and evidence of the signatory's authority. A facility to a company executed by a person not named in the resolution is not secured by the documents it appears to be secured by.\n\n" +
        "Guarantees. A guarantor executes a separate deed of guarantee, is given a copy, and is informed in writing of the extent of the liability being undertaken. A guarantor who did not receive the deed cannot be told later that they should have understood it.\n\n" +
        "Blank and undated documents. No document is taken blank, partially completed, or undated for later completion. Undated security documents and blank signed instruments are prohibited without exception and their presence in a file is reported as an incident.\n\n" +
        "Custody. Executed documents move to central storage within five working days of disbursal, are logged in, and are held under dual custody. Originals released for enforcement, registration or return are logged out against a named officer with a return date.",
    },
    {
      id: "OP-003", title: "Repayment Mandate Management", cat: "ops", clearance: 1, scopes: ["ops", "collect", "service"],
      owner: "Head of Payments Operations", updated: "2026-06-11", rev: "5.4", system: "Payments & Mandates",
      tags: ["mandate", "NACH", "UMRN", "registration", "sponsor bank", "presentation", "dishonour", "re-presentation", "lead time", "swap"],
      body:
        "Every instalment-bearing facility carries a registered repayment mandate. This procedure covers registration, presentation, dishonour handling and replacement. The mandate is the collection mechanism for the whole book, and most first-cycle failures are mandate failures rather than credit failures.\n\n" +
        "Registration. Mandates are registered electronically where the customer's bank supports it and on paper where it does not. An electronic mandate is confirmed active when the sponsor bank returns the unique mandate reference; a mandate that has been submitted is not a mandate that is registered. Registration is confirmed in the system against the reference, not against the acknowledgement of submission.\n\n" +
        "Registration lead time. The standard assumption used in the disbursal procedure is that an electronic mandate registers and confirms within one working day of submission. Actual performance varies materially by sponsor bank and is published monthly by Payments Operations in the sponsor bank performance note. Where the published lead time for a customer's bank exceeds the interval between disbursal and the first instalment date, the case is flagged before release and either the disbursal is held or the first instalment date is reset within what the product or scheme permits.\n\n" +
        "Paper mandates. A paper mandate is scanned, submitted and tracked to registration in the same way. Paper registration takes materially longer than electronic and is used only where the electronic route is unavailable for that bank, not as a fallback when the electronic route has failed once. A branch that has moved a dealer's or a channel's cases to paper because electronic registrations kept failing has masked a problem rather than solved one, and the pattern is reported to Payments Operations.\n\n" +
        "Presentation. Instalments are presented on the due date. Where the due date is not a working day, presentation is on the next working day and no penal charge arises for the intervening period.\n\n" +
        "Dishonour and re-presentation. A dishonour is captured with its return reason code. Codes indicating insufficiency of funds permit re-presentation within the same cycle as the product note allows. Codes indicating that the mandate is not registered, has been cancelled, or has failed technically do not represent a borrower default: these are routed to Payments Operations for correction, no dishonour charge is levied, and the account is not allocated to collections on the strength of them.\n\n" +
        "Replacement. A customer may replace a mandate at any time at the charge in the schedule. The replacement is confirmed active before the old one is cancelled, so that no cycle is left without a live mandate.",
    },
    {
      id: "OP-004", title: "Post Disbursement Document Tracking", cat: "ops", clearance: 1, scopes: ["ops", "legal", "credit"],
      owner: "Head of Central Operations", updated: "2026-06-08", rev: "6.2", system: "Document Management",
      tags: ["PDD", "post disbursement", "outstanding", "registration certificate", "hypothecation", "registered mortgage", "ageing", "escalation", "unsecured"],
      body:
        "A post disbursement document is one that could not exist before money moved. Every such document is recorded at disbursal with an owner and a due date, and tracked until it is received and verified. An item recorded without a due date is not tracked, and an item tracked without an owner is not chased.\n\n" +
        "Standard items and their clocks. Registration certificate bearing the endorsement of hypothecation: within 60 days of the vehicle being delivered, or 150 days from the date of first disbursal, whichever falls earlier. Registered mortgage where registration follows disbursal: within 30 days. Filing of the security interest with the registry: within 30 days of creation. Insurance policy copy with Anvira as loss payee: within 30 days. End use evidence where the product note requires it: within 90 days. Occupancy or completion certificate on a construction facility: as set in the sanction.\n\n" +
        "Which items change the security position. Not every outstanding document matters equally, and treating them as one list is why the ageing report is ignored. Items that leave the exposure effectively unsecured until received are: the endorsement of hypothecation on a vehicle, the registered mortgage, and the registry filing. Everything else is a documentation gap. The ageing report distinguishes the two, and the escalation runs on the first group.\n\n" +
        "Ageing and escalation. Outstanding items are reported weekly by product, branch, sourcing channel and age band. An item 30 days past due escalates to the branch manager, 60 days to the area manager, and 90 days to the Head of Central Operations with the exposure quantified. An item outstanding beyond 120 days is reported to the Chief Risk Officer and the exposure is treated as unsecured for internal risk reporting whatever the system's security flag says.\n\n" +
        "Sourcing accountability. Where an item is outstanding because the sourcing channel has not obtained it, the channel's payout is withheld against the specific case under the terms of the channel agreement. Withholding is applied per case, not as a blanket hold on the channel, so that the channel can see which file to fix.\n\n" +
        "Closure. An item is closed when the document is received, verified against the requirement and imaged. A receipt entry without the document imaged is not closure, and a sample of closures is verified monthly by Internal Audit.",
    },
    {
      id: "OP-005", title: "Receipt Application, Reconciliation and Refunds", cat: "ops", clearance: 2, scopes: ["ops", "fincon", "collect"],
      owner: "Central Operations Manager", updated: "2026-04-17", rev: "4.8", system: "Loan Management",
      tags: ["receipt", "reconciliation", "unapplied", "suspense", "cash", "refund", "excess", "break", "field collection"],
      body:
        "Every rupee received is applied to an account on the day it is realised, or is held in an identified unapplied account and investigated. Money received and not applied is money the customer has paid and Anvira has not recognised, and it produces a delinquency that is not real.\n\n" +
        "Channels. Mandate presentation, direct transfer, payment gateway, branch counter, field collection in cash, and collections through business correspondents. Each channel has its own reconciliation, and the reconciliations are performed daily against the bank statement and the channel's own settlement file, not against the internal ledger alone.\n\n" +
        "Field cash. Cash collected in the field is receipted to the customer at the point of collection from a pre-numbered receipt or the mobile application, and remitted the same day or by the start of the next working day where collection is after banking hours. An unremitted collection beyond that is escalated to the Area Collections Manager the same day and to the risk containment unit if unexplained after 24 hours. The receipt issued to the customer is the customer's proof of payment regardless of whether the money reached Anvira.\n\n" +
        "Unapplied receipts. Investigated within two working days. Common causes are a payment made against an old or incorrect reference, a payment by a person other than the borrower, a part payment that does not match any instalment, and a receipt from a closed account. An unapplied receipt is never netted against another customer's shortfall.\n\n" +
        "Excess and refunds. Where an account is overpaid, the excess is refunded to the borrower's account within seven working days of the account being closed or the excess being identified, whichever is earlier. A refund is not held against a possible future dues position on another facility unless the agreement expressly permits set-off and the borrower has been told.\n\n" +
        "Breaks. A reconciliation break is aged from the day it arose. Breaks older than seven days are reported to the Financial Controller weekly with the cause and the owner. A break carried forward without a cause recorded is not a break that is being worked.\n\n" +
        "What reconciliation reveals. Persistent breaks in one channel, one branch or one agency are a leakage and conduct signal before they are an accounting problem, and are reported to the risk containment unit as well as to Finance.",
    },
    {
      id: "OP-006", title: "Security Interest and Registry Filings", cat: "ops", clearance: 2, scopes: ["ops", "legal", "compliance"],
      owner: "Head of Central Operations", updated: "2026-03-27", rev: "3.5", system: "Compliance Gateway",
      tags: ["security interest", "registry", "CERSAI", "charge", "satisfaction", "30 days", "filing", "priority", "delay"],
      body:
        "Security interests created in favour of Anvira are registered with the central registry within the period prescribed, and satisfaction is filed when the facility closes. Registration establishes priority against other creditors and puts the world on notice; an unregistered charge is a charge Anvira may be unable to rely on when it matters.\n\n" +
        "Timeline. Registration is filed within 30 days of the creation of the security interest. The clock runs from creation, not from disbursal and not from receipt of the documents at the central unit, so a file that takes two weeks to reach central operations has already consumed half the window.\n\n" +
        "Ownership. Central Operations files and owns the record. The branch is accountable for despatching the documents within two working days of execution. A filing missed because the documents did not travel is a branch failure recorded against the branch, not a central operations failure, and the ageing report shows both legs.\n\n" +
        "Delay. Where the window is missed, the filing is made immediately, the exposure is listed on the delayed filings register, Legal is informed the same day, and the position is assessed. Late filing does not automatically restore priority. Concealing a missed filing until it surfaces at enforcement is treated as a serious conduct matter, not as an operational lapse.\n\n" +
        "Satisfaction. On closure of the facility, satisfaction of the charge is filed and evidence is retained on the file and given to the borrower with the no-objection certificate. A borrower whose loan is closed but whose charge remains on the register cannot deal with their own property, and this is one of the most common causes of a complaint months after closure.\n\n" +
        "Reconciliation. The register of filings is reconciled monthly against the secured book: every live secured facility requiring a filing has one, and every closed facility has a satisfaction. Both directions are checked, because an unreleased charge is as much a defect as an unregistered one.",
    },
    {
      id: "OP-007", title: "Vehicle Hypothecation and Registration Operations", cat: "ops", clearance: 1, scopes: ["ops", "credit", "legal"],
      owner: "Head of Vehicle Operations", updated: "2026-05-29", rev: "4.1", system: "Document Management",
      tags: ["hypothecation", "registration certificate", "RC", "endorsement", "termination", "NOC", "transport authority", "dealer", "insurance"],
      body:
        "Anvira's interest in a financed vehicle is recorded by an endorsement of hypothecation on the certificate of registration issued by the transport authority. Until that endorsement exists, the vehicle is registered in the borrower's name with no record of Anvira's interest, and the exposure is unsecured in substance whatever the loan documents say.\n\n" +
        "Obtaining the endorsement. The dealer or the borrower files the registration application together with the hypothecation form signed by Anvira. Central Operations issues the signed form on disbursal and records the case as a post disbursement item due within 60 days of delivery or 150 days from first disbursal, whichever is earlier.\n\n" +
        "Verification on receipt. The certificate is verified against the loan record for the registration number, engine number, chassis number, the borrower's name, and the presence and correctness of the hypothecation endorsement in Anvira's name. A certificate received with the endorsement missing, in the wrong name, or with a mismatched chassis number is not closure and is returned for correction.\n\n" +
        "Insurance linkage. Comprehensive insurance with Anvira as loss payee is verified against the registration number at the same time, and renewal is tracked annually for the life of the facility. A financed vehicle running without insurance is an uncovered exposure, and the renewal check is not optional because the endorsement is in place.\n\n" +
        "Termination on closure. On closure, Anvira issues the no-objection certificate and the termination of hypothecation form to the borrower within seven working days, and the borrower files for removal of the endorsement. Where the borrower does not file, Anvira's obligation is discharged by issuing the documents, but the closure record notes it.\n\n" +
        "Repossessed and sold vehicles. Where a vehicle is sold following repossession, the transfer and the removal of the endorsement are completed as part of the sale, and the file is not closed until both are evidenced. An endorsement left in place on a vehicle Anvira has sold produces a claim from the buyer later.\n\n" +
        "Known weakness. This is the largest open post disbursement population in the secured book. The dominant causes are the certificate being retained by the dealer, the borrower not collecting it, and the endorsement being applied for without the signed form. The ageing report separates these three causes so the chase goes to the right party.",
    },
    {
      id: "OP-008", title: "Gold Appraisal and Vault Operations Manual", cat: "ops", clearance: 1, scopes: ["gold", "ops"],
      owner: "Head of Gold Loans", updated: "2026-04-25", rev: "8.1", system: "Loan Management",
      tags: ["gold", "appraisal", "purity", "touchstone", "net weight", "packet", "seal", "vault", "dual custody", "release", "auction"],
      body:
        "This manual governs the appraisal, custody, release and auction of pledged ornaments at designated branches of Anvira Finserv Limited. Every step described here happens in the customer's presence unless this manual says otherwise, because the customer's confidence in what is in the packet is the whole product.\n\n" +
        "Appraisal. Carried out by a certified appraiser at the branch counter in the physical presence of the customer. Gross weight is recorded on a calibrated and sealed scale. Purity is assessed by touchstone against certified needles. Where assessed purity is below 20 carat, or where the ornament shows soldering, plating or an unusual density, a second method is used and the result recorded. Stones, enamel, lac, thread and any non-gold component are deducted and the deduction is shown to the customer.\n\n" +
        "The appraisal certificate. Records the number of items, a description of each, gross weight, deduction, net weight, assessed purity, the reference rate applied and the resulting eligible amount. Signed by the appraiser and the customer. A copy is given to the customer before the packet is sealed. No packet is sealed before the customer has the copy in hand.\n\n" +
        "Sealing and custody. Ornaments are placed in a tamper-evident packet in the customer's presence, sealed, and the seal number recorded against the loan account. The packet moves to the vault the same day. The vault operates under dual custody: two key holders, neither able to open it alone, with a movement register recording every opening, the reason, and both signatures.\n\n" +
        "Disputes at appraisal. Where the customer disagrees with the assessed purity or weight, the appraisal is repeated in the presence of the branch manager. If the customer still disagrees, the ornaments are returned unpledged and the file closed with the disagreement recorded. A customer is never persuaded to accept an assessment they dispute.\n\n" +
        "Broken seal. A packet found with a broken or altered seal is not opened. The branch manager and Central Operations are informed the same day, the packet is secured, and the opening is carried out jointly with the customer present and the risk containment unit informed.\n\n" +
        "Release. On full repayment, the packet is retrieved under dual custody, opened in the customer's presence, verified item by item against the appraisal certificate, and handed over against the customer's signature, within seven working days of closure. Where release is delayed beyond that period for a reason attributable to Anvira, compensation is payable at the rate in the pricing circular for each day of delay, and the delay is reported as an incident.\n\n" +
        "Auction. Conducted only after the notice period in the product note has expired, through an approved auctioneer, with prior notice to the customer stating the date and place. Anvira does not bid. Any surplus over dues and reasonable costs is returned to the customer within seven working days of the sale, and the computation of dues and costs is given to the customer with the payment rather than on request.",
    },
    {
      id: "OP-009", title: "Branch Operations and Cash Handling", cat: "ops", clearance: 1, scopes: ["ops", "policy"],
      owner: "Head of Branch Operations", updated: "2026-03-14", rev: "6.0", system: "Loan Management",
      tags: ["branch", "cash", "counter", "vault limit", "insurance", "keys", "opening", "closing", "surprise check", "display"],
      body:
        "This procedure governs the daily operation of a branch: opening and closing, cash and valuables, customer service at the counter, and the records a branch is required to hold.\n\n" +
        "Opening and closing. The branch opens and closes with two authorised persons present. Keys to the strong room and the vault are held by different officers, and no officer holds both sets. Duplicate keys are lodged with the designated custodian outside the branch and their withdrawal is recorded.\n\n" +
        "Cash retention. Cash held overnight does not exceed the branch's approved retention limit, which is set by branch category and is the limit for which the branch's insurance cover is in force. Cash above the limit is remitted the same day. A branch that exceeds its limit is uninsured on the excess, so the limit is a hard operational rule and not a target.\n\n" +
        "Vault holding limit for pledged ornaments. Each gold-enabled branch has a value limit for ornaments held, again set against the insurance cover. Where the limit is approached, Central Operations is informed the same day and either arranges a transfer to the regional strong room or approves a temporary increase in cover before further pledges are accepted. Accepting a pledge that takes the branch beyond its cover is not a business decision available at the branch.\n\n" +
        "Surprise checks. Cash, ornaments, security documents, blank instrument stationery and the receipt book series are subject to surprise verification by the area manager at least monthly and by Internal Audit without notice. The verification is recorded whether or not it finds anything.\n\n" +
        "Display obligations. Every branch displays the schedule of charges, the fair practices code, the grievance route with the names and contact details of the Grievance Redressal Officer and the Principal Nodal Officer, the registration details of the entity, and the working hours, in English, Hindi and the local language, in a place a customer can read without asking.\n\n" +
        "Customer records at the counter. No customer file, identification document or account statement is left on an open counter or in an unlocked drawer. Customer information visible to another customer at the counter is a data incident.",
    },
    {
      id: "OP-010", title: "Field Investigation and Verification Manual", cat: "ops", clearance: 1, scopes: ["ops", "credit"],
      owner: "Head of Credit Operations", updated: "2026-01-23", rev: "5.2", system: "Loan Origination",
      tags: ["field investigation", "FI", "verification", "residence", "business", "negative", "geotag", "photograph", "evidence", "sampling", "inducement", "bribe", "integrity", "offered money", "report it"],
      body:
        "Field investigation establishes that the applicant exists at the address given, that the business exists and operates as described, and that what the file says about both is true. The report becomes evidence in a fraud investigation later, so it is written to be relied on rather than to close a queue item.\n\n" +
        "Residence verification. Confirms the applicant lives at the address, the type and status of the accommodation, the period of stay, the composition of the household, and a neighbour's independent confirmation. Photographs of the entrance showing the house number, and the geotag and timestamp from the application, are mandatory. A verification without a geotagged photograph is not accepted.\n\n" +
        "Business verification. Confirms the business exists at the address, the nature of the activity, the visible scale of operations, the number of people working, the stock or equipment present, the signage, and how long the business has operated there. Where the applicant claims ownership of the premises or the business, that claim is tested with the neighbours and the result recorded either way.\n\n" +
        "Nobody available. Where nobody is present, the officer records the attempt with the photograph, timestamp and geotag and returns at a different time on a different day. A file is marked negative for non-availability only after two attempts at different times, and the record shows both. Marking a case negative on the first attempt, or positive without meeting anybody, are the two most common verification failures.\n\n" +
        "What makes a report negative. The address does not exist; the applicant is not known there; the business does not exist or is materially different from what was declared; the premises are locked and unused across both visits; or an independent source contradicts the file. A negative report is not a decline by itself, but it is never overwritten by the branch. Only the Credit Manager may proceed against a negative report, as a recorded deviation.\n\n" +
        "Integrity. An officer offered an inducement records it and reports it to the Head of Credit Operations the same day. Reporting is protected. An officer who accepts an inducement is dismissed and reported to the risk containment unit.\n\n" +
        "Sampling and re-verification. Ten per cent of positive verifications are re-verified independently each month, weighted towards agencies, branches and sourcing channels with the highest early delinquency. Re-verification findings are reported to the Chief Credit Officer, and an agency whose re-verification failure rate exceeds the threshold is suspended pending review.",
    },
    {
      id: "OP-011", title: "Customer Identification Operations and Registry Upload", cat: "ops", clearance: 1, scopes: ["ops", "aml", "compliance"],
      owner: "Central Operations Manager", updated: "2026-05-21", rev: "4.6", system: "Compliance Gateway",
      tags: ["KYC", "CKYC", "identification", "OVD", "upload", "registry", "identifier", "exception", "periodic update", "video"],
      body:
        "This procedure covers the operational handling of customer identification records: capture, verification, upload to the central registry, and periodic update. The standards for what is acceptable are set in the identification and financial crime policy; this document covers how the work is done and what the deadlines are.\n\n" +
        "Capture. Identification and address records are captured for every applicant, co-applicant, guarantor and, for non-individual customers, every beneficial owner and authorised signatory. Documents are verified against originals or through the permitted electronic route, and the officer who verified is recorded by name.\n\n" +
        "Registry search first. Before creating a fresh record, the central registry is searched for an existing identifier. Where one exists and the record is current, it is downloaded and used rather than a duplicate being created. Creating a duplicate registry record for a customer who already has one is an error that follows the customer for years.\n\n" +
        "Upload. Where no identifier exists, the record is uploaded to the central registry within the window set in the compliance calendar, measured from the commencement of the account based relationship. Uploads are made in batches daily and the acknowledgement file is reconciled the same day; a record submitted is not a record accepted.\n\n" +
        "Exception queue. Records rejected by the registry return to an exception queue with a reason code. Common causes are a mismatch in name format, an image below the required resolution, an unsupported document type and a duplicate identifier. Exceptions are worked within two working days. An exception left unworked is an unfiled record, and the ageing of the queue is reported weekly.\n\n" +
        "Periodic update. Records are updated on the cycle set by the customer's risk categorisation. The cycle is triggered from the date of the last update, not from the date of onboarding, and a customer whose update is due is contacted rather than being allowed to lapse and then blocked at the counter.\n\n" +
        "Video based identification. Where the product permits identification through a video process, the session is conducted by a trained Anvira official, is recorded with the customer's consent, captures the live image and the documents, includes the random questions the procedure requires, and is stored with the audit trail. The official conducting the session is an employee of the regulated entity and this function is not outsourced.",
    },
    {
      id: "OP-012", title: "Service Standards and Turnaround Commitments", cat: "ops", clearance: 1, scopes: ["ops", "service", "credit"],
      owner: "Head of Central Operations", updated: "2026-02-13", rev: "3.3", system: "Loan Management",
      tags: ["turnaround", "TAT", "service standard", "statement", "NOC", "foreclosure quote", "document return", "measurement", "clock"],
      body:
        "These are the commitments Anvira makes on how long things take. Each is measured from the point the customer's request is complete, and the measurement is published internally by product and branch each month.\n\n" +
        "Origination. Acknowledgement of an application immediately. Decision within two working days of a complete unsecured file and five for a complete secured file, exclusive of valuation and title. Disbursal within two working days of the file becoming disbursement-ready.\n\n" +
        "Servicing. Statement of account within two working days. Foreclosure quote within three working days of the request, and where the account is straightforward, the same working day. Interest certificate within three working days. Repayment instrument swap effective from the next cycle where requested at least seven working days before the due date.\n\n" +
        "Closure. Account closed on the day the full amount is realised. No-objection certificate within seven working days of closure. Return of original security documents within 15 working days of closure. Filing of satisfaction of charge within 15 working days. Return of pledged ornaments within seven working days.\n\n" +
        "Grievances. Acknowledgement immediately with a reference. Resolution within seven working days at the first level, and a final response within 30 days of first receipt anywhere in Anvira.\n\n" +
        "How the clock is measured. The clock starts when the request is complete, and completeness is defined for each item so that it cannot be reset by asking for something the customer has already given. A request returned for a document that was on the file is not a fresh request, and the original clock continues to run.\n\n" +
        "Failure to meet a standard. Where a standard is missed, the customer is informed with a reason and a revised date before the standard expires, not afterwards. Where a delay in returning documents or filing satisfaction is attributable to Anvira, compensation is payable as set out in the relevant product note, and the payment does not require the customer to ask for it.",
    },

    /* ================= COLLECTIONS AND RECOVERY ================= */
    {
      id: "CO-001", title: "Collections and Recovery Policy", cat: "collect", clearance: 1, scopes: ["collect", "policy"],
      owner: "Head of Collections", updated: "2026-05-04", rev: "8.0", system: "Collections & Recovery",
      tags: ["collections", "recovery", "policy", "delinquency", "conduct", "escalation", "in-house", "agency", "principles"],
      body:
        "This policy governs recovery across Anvira Finserv Limited and both subsidiaries, whether the recovery is by an employee, an empanelled agency, a business correspondent or a legal representative. Recovery is a commercial activity conducted within a conduct boundary, and where the two conflict the conduct boundary governs.\n\n" +
        "Principles. A borrower in arrears is a customer, not an adversary. The first purpose of contact is to establish why payment has not been made, because the response to inability is different from the response to unwillingness and treating the two the same produces neither recovery nor goodwill. Every contact is recorded. Nothing is said to a borrower that could not be repeated in front of a regulator.\n\n" +
        "What is never permitted. Contact outside the permitted hours. Contact with any person who is not the borrower or a guarantor about the debt. Disclosure of the debt to an employer, a neighbour, a relative or a colleague. Any threat, of legal action that is not available, of criminal consequence, or of anything else. Any use or suggestion of force. Publication of a borrower's name or photograph. Retaining a borrower's documents, identity papers or property as leverage. Persistent calling designed to harass rather than to reach the borrower. These apply to every person recovering on Anvira's behalf, and to conduct on any channel including messaging.\n\n" +
        "Permitted hours. A borrower may be contacted between 8am and 7pm on any day, by any channel, and at no other time. The hours are the borrower's local time. A borrower who asks to be contacted at a particular time within those hours is contacted then.\n\n" +
        "Deceased, hospitalised and distressed borrowers. Where a borrower has died, recovery contact stops immediately and the account routes to the legal team for handling with the estate. Where a borrower is seriously ill or hospitalised, field and tele contact is suspended and the account is reviewed by the Area Collections Manager. A borrower in evident distress is not pressed; the contact is ended and escalated.\n\n" +
        "Complaints about recovery. A complaint alleging misconduct in recovery is treated as a conduct matter and not as a collections dispute. It is investigated by the Grievance Redressal Officer independently of the collections line, and the outcome is reported to the Head of Collections and to the Chief Compliance Officer. The person complained of does not investigate their own conduct.\n\n" +
        "Recovery is not the only answer. Where an account is delinquent for a reason within Anvira's control, such as a mandate that was never registered, a receipt that was not applied, or a charge that should not have been levied, it is corrected rather than collected. Collecting on a delinquency Anvira created is the most expensive mistake available in this function.",
    },
    {
      id: "CO-002", title: "Bucket Strategy and Account Allocation", cat: "collect", clearance: 1, scopes: ["collect", "risk", "ops"],
      owner: "Head of Collections", updated: "2026-06-16", rev: "6.1", system: "Collections & Recovery",
      tags: ["bucket", "DPD", "allocation", "strategy", "first instalment", "FEMI", "tele", "field", "roll rate", "intent"],
      body:
        "Accounts are allocated to a recovery channel by delinquency bucket, product, exposure and history. Allocation is refreshed daily from the day-end position and is not held over from the previous cycle.\n\n" +
        "Buckets. Bucket X covers accounts overdue 1 to 30 days, handled by tele-calling. Bucket 1 covers 31 to 60 days, tele-calling with field support. Bucket 2 covers 61 to 90 days, field. Bucket 3 covers 91 to 180 days, field and agency. Beyond 180 days, recovery and legal. Movement between buckets is by the day-end position and not by the collector's assessment.\n\n" +
        "First instalment dishonour. An account whose first instalment dishonours is allocated directly to field contact irrespective of bucket, on the reasoning that a borrower who does not pay the first instalment is signalling intent rather than experiencing hardship. This rule is longstanding and it is worth stating what it assumes: that the instrument was presented against a live mandate, on a date the borrower expected, for an amount the borrower was told. Where any of those three is not true, the dishonour is not an intent signal and the allocation is wrong.\n\n" +
        "Exclusions from allocation. An account is not allocated to recovery where the arrears arise from a dishonour with a return reason indicating that the mandate was not registered, was cancelled or failed technically; where a receipt is known to be unapplied against the account; where a charge under dispute accounts for the whole of the overdue; or where a grievance is open on the matter that caused the arrears. Central Operations publishes the exclusion file daily and allocation runs after it is applied, not before.\n\n" +
        "Contact intensity. Bucket X permits up to three contact attempts a week. Bucket 1 up to four. Bucket 2 and beyond up to five, of which not more than two may be field visits. A promise to pay recorded and within date suspends further contact until the promised date passes.\n\n" +
        "Agency allocation. Accounts are allocated to empanelled agencies by geography and product, with a fixed review of performance and conduct. No agency receives more than a quarter of any product's delinquent population in a region, and allocation is rotated so that no single agency becomes the only party with a relationship in a territory.\n\n" +
        "Measurement. Roll rates, resolution rates, cost per rupee recovered and complaints per thousand accounts contacted are reported by channel, agency, branch and product monthly. An agency or a team with a high resolution rate and a high complaint rate is not performing well; it is generating a liability, and the two figures are always read together.",
    },
    {
      id: "CO-003", title: "Recovery Agent Code of Conduct", cat: "collect", clearance: 1, scopes: ["collect", "policy", "people"],
      owner: "Head of Collections", updated: "2026-05-04", rev: "7.2", system: "Collections & Recovery",
      tags: ["agent", "conduct", "code", "identity card", "authorisation", "training", "hours", "third party", "harassment", "prohibited"],
      body:
        "This code binds every person who contacts an Anvira borrower about an overdue amount: employees, empanelled agency staff, business correspondents and legal representatives. It is issued with the authorisation letter and acknowledged in writing before any allocation is made.\n\n" +
        "Identification. Every agent carries a photo identity card issued by their employer and a written authorisation from Anvira naming the agent, the agency, the period of validity and this code. Both are shown to the borrower unprompted at the start of any visit. An agent who cannot produce both is not authorised to be there, and a borrower is entitled to refuse the contact.\n\n" +
        "Training. No person is allocated an account until they have completed the conduct training and passed the assessment, covering this code, the fair practices code, the permitted hours, what may and may not be said, the handling of vulnerable borrowers, and the receipting of money. Training is refreshed annually and after any conduct incident.\n\n" +
        "Hours and place. Contact only between 8am and 7pm local time. Visits at the borrower's residence or business address as recorded. No visit to a borrower's workplace where the employer would learn of the debt, no visit to a place of worship, a hospital, a school, or a funeral, and no contact at a family event.\n\n" +
        "Who may be spoken to. The borrower and any guarantor, and nobody else. Where the borrower is unavailable, the agent may leave a request to call back, giving their name and a contact number, without stating the reason for the visit or that a debt is involved. A message left with a family member, a neighbour, a colleague or a security guard never mentions the loan, the amount or the arrears.\n\n" +
        "What is prohibited. Raising the voice, using abusive or obscene language, using a caste, communal or gendered slur, making any threat, implying a criminal consequence for a civil debt, entering premises without permission, refusing to leave when asked, taking or photographing property, obstructing a person, following a borrower, contacting a borrower repeatedly in a way designed to distress rather than to reach them, and posting about a borrower on any public or group channel.\n\n" +
        "Money. An agent may accept payment only where authorised for that account, and issues a pre-numbered receipt or a system receipt at the moment of collection. The receipt is the borrower's proof of payment and is valid against Anvira whether or not the money is remitted. An agent who collects without receipting is dismissed and reported.\n\n" +
        "Consequences. A breach of this code is grounds for immediate withdrawal of authorisation. A serious breach ends the agency's empanelment and is reported to the Chief Compliance Officer. Anvira does not accept an agency's explanation that a breach was the act of one person acting alone: the agency is responsible for the people it deploys, and Anvira is responsible for the agency.",
    },
    {
      id: "CO-004", title: "Agency Empanelment and Oversight", cat: "collect", clearance: 2, scopes: ["collect", "compliance", "policy"],
      owner: "Head of Collections", updated: "2026-03-31", rev: "4.4", system: "Collections & Recovery",
      tags: ["agency", "empanelment", "due diligence", "oversight", "audit", "performance", "de-empanelment", "ownership", "training records"],
      body:
        "Recovery agencies are empanelled against a documented process and reviewed continuously. Anvira is answerable for what an agency does, so the empanelment file is a control document rather than a procurement record.\n\n" +
        "Empanelment. Requires the constitution and ownership of the agency, the identity and antecedents of its principals, litigation and regulatory history, the geography and products it will serve, its staffing plan, its training capability, evidence of employee verification for every person to be deployed, and a written agreement carrying this code, audit rights, data handling obligations and termination rights.\n\n" +
        "Ownership check. The ownership of an agency is verified rather than accepted from its letterhead. An agency previously de-empanelled for conduct may not be re-empanelled under a different name, and the check exists specifically to catch that. Common ownership across two agencies operating in the same territory is disclosed at empanelment and, where it exists, both count as one for the concentration limit.\n\n" +
        "Deployment register. Every individual deployed on Anvira accounts is registered by name, identity number, agency, territory and training completion date, before allocation. An account contacted by a person not on the register is an unauthorised contact and is reported as an incident whatever the outcome of the contact.\n\n" +
        "Oversight. Monthly review of resolution rate, cost, complaints, receipting discipline and remittance timeliness. Quarterly on-site review of the agency's premises, call recordings, receipt books and training records. Annual re-verification of the empanelment file.\n\n" +
        "Reading performance honestly. An agency is assessed on recovery and conduct together. Resolution rate alone will always favour the agency willing to go furthest, which is the agency most likely to produce the complaint that costs more than the recovery. Where an agency is at the top of the recovery table and the top of the complaint table at the same time, the complaints are investigated before the performance is rewarded.\n\n" +
        "De-empanelment. Immediate on a serious conduct breach, a collection not receipted, a remittance not made, deployment of an unregistered person, or any misrepresentation in the empanelment file. On de-empanelment, all allocated accounts are recalled within two working days, the agency's access is withdrawn, all customer data held by it is required to be returned or destroyed with certification, and the borrowers contacted by it in the preceding 90 days are reviewed for conduct complaints.",
    },
    {
      id: "CO-005", title: "Tele-calling Standards", cat: "collect", clearance: 1, scopes: ["collect", "service"],
      owner: "Head of Tele-collections", updated: "2026-04-09", rev: "5.0", system: "Collections & Recovery",
      tags: ["tele-calling", "call", "script", "recording", "promise to pay", "PTP", "disposition", "abusive", "disputed", "callback", "already paid", "disputed payment", "verification", "credited", "not contradicted"],
      body:
        "This standard governs contact by telephone and messaging with borrowers in arrears. Every call is recorded, every outcome is dispositioned, and the recording is the record.\n\n" +
        "Opening. The agent identifies themselves by name, names Anvira, states that the call concerns the borrower's loan account, and confirms they are speaking to the borrower before saying anything about the account. Where the person answering is not the borrower, the agent does not state the reason for the call and asks only for a convenient time to reach the borrower.\n\n" +
        "The conversation. Establish whether the borrower is aware the instalment is unpaid; establish why; state the amount due and the charge that applies; offer the payment routes; agree a date. Ask before assuming. A borrower who says the payment was made is not contradicted on the call: the agent takes the date, amount and reference, ends the call courteously, and raises it for verification the same day.\n\n" +
        "Promise to pay. Recorded with the amount and the date, and the date must be one the borrower proposed or accepted. A promise suspends further contact until it passes. A broken promise is recorded as such and moves the account to the next contact intensity, not to a different tone.\n\n" +
        "Disputed charge or payment. Where the borrower disputes a charge or asserts a payment, the account is flagged for verification and contact is suspended on that amount until it is resolved. Continuing to press for an amount under verification is the single most common source of a complaint that Anvira then loses.\n\n" +
        "Abuse and threats. Where a borrower becomes abusive, the agent may say once that the call will end if it continues, and then end the call courteously. The agent does not respond in kind, does not argue and does not call back immediately. The disposition records what happened. Where a borrower makes a threat against the agent, it is reported to the supervisor immediately and the account is escalated rather than reallocated to another caller.\n\n" +
        "Contact limits. Within the permitted hours, and within the attempts allowed for the bucket. An unanswered call is an attempt. Calling repeatedly from different numbers to defeat the limit is a conduct breach.\n\n" +
        "Quality monitoring. A sample of calls per agent per week is reviewed against this standard by a supervisor outside the agent's reporting line. Findings are coached, and a conduct finding is reported rather than coached.",
    },
    {
      id: "CO-006", title: "Field Visit Standards", cat: "collect", clearance: 1, scopes: ["collect"],
      owner: "Head of Field Collections", updated: "2026-04-09", rev: "5.1", system: "Collections & Recovery",
      tags: ["field visit", "home visit", "neighbour", "receipt", "cash", "surrender", "vulnerable", "geotag", "not at home", "prohibited"],
      body:
        "This standard governs visits to a borrower in arrears. A field visit is the most visible thing Anvira does and it happens where the borrower's neighbours can see it, so the standard is written tightly.\n\n" +
        "Before the visit. The officer confirms the account is allocated to them, is not on the exclusion file, and carries no open grievance or verification flag. The officer checks whether a promise to pay is live; a visit inside a live promise is not made.\n\n" +
        "At the door. The officer introduces themselves by name, shows the identity card and the authorisation, and asks whether it is convenient to talk. The conversation takes place where the borrower chooses. The officer does not enter the premises unless invited and leaves immediately when asked.\n\n" +
        "Borrower not present. The officer may ask whether the borrower is expected and when. The officer may leave a card with their name and number and a request to call. The officer does not state the reason for the visit, does not mention a loan or an amount, and does not ask a neighbour about the borrower's finances, habits, whereabouts or family. Asking a neighbour anything beyond whether the borrower lives there is a breach.\n\n" +
        "Money. Cash is accepted only where the officer is authorised to collect on that account. A pre-numbered receipt or the mobile receipt is issued at the moment of collection, before the money is pocketed, and the borrower keeps it. Cash is remitted the same day or by the start of the next working day. There is no circumstance in which cash is collected without a receipt.\n\n" +
        "Vulnerable circumstances. Where the borrower has died, is seriously ill, is hospitalised, or is in evident distress, the visit ends. The officer records what they found and escalates to the Area Collections Manager the same day. Recovery contact on that account stops until the manager has reviewed it. An officer is never criticised for ending a visit on these grounds.\n\n" +
        "Surrender of a financed asset. Where a borrower offers to surrender a financed vehicle, the officer does not take possession on the spot. Voluntary surrender follows the repossession procedure: the written surrender, the inventory, the valuation and the borrower's rights before sale all apply, and taking a vehicle on a doorstep conversation exposes Anvira to a conversion claim however willing the borrower appeared.\n\n" +
        "Recording the visit. Every visit is logged the same day with the time, the geotag, who was met, what was discussed, what was agreed and what was collected. A visit not logged did not happen, and the officer is not paid for it.",
    },
    {
      id: "CO-007", title: "Repossession Procedure", cat: "collect", clearance: 2, scopes: ["collect", "legal", "ops"],
      owner: "Head of Collections", updated: "2026-06-04", rev: "6.3", system: "Collections & Recovery",
      tags: ["repossession", "possession", "vehicle", "notice", "clause", "authorisation", "precondition", "voluntary surrender", "grievance", "before possession", "checklist", "who confirms", "arrears threshold", "executed agreement"],
      body:
        "This procedure governs taking possession of a financed vehicle on default. Possession is lawful only where every precondition below is satisfied. A repossession taken without one of them is a conversion, and the consequences are the return of the vehicle, compensation, a complaint on the record and a finding at the next inspection.\n\n" +
        "Preconditions, all of which must hold. First, the executed loan agreement for this account contains the possession clause required by the fair practices code, setting out the notice, the circumstances, the procedure, the borrower's right to redeem before sale and the sale procedure. Second, the arrears position meets the threshold in the product note. Third, the demand notice has been served and the period stated in it has expired. Fourth, no grievance is open on the account and no dispute is under verification on the arrears relied on. Fifth, the account is not on the exclusion file. Sixth, the person taking possession is on the deployment register with a valid authorisation naming the account.\n\n" +
        "Verifying the clause. The clause is verified against the executed agreement on the file, not against the current template. Agreements executed on older templates do not all carry it. Where the executed agreement does not carry the clause, or the executed copy cannot be located, the matter goes to Legal and no possession is taken pending advice, whatever the arrears.\n\n" +
        "Authorisation. Possession is authorised in writing by the Area Collections Manager for that territory against a checklist evidencing each precondition. The authorisation names the account, the vehicle, the agent and a validity period. A blanket or standing authorisation is not valid.\n\n" +
        "Taking possession. Without force, without breaking a lock, without entering a closed compound, and without obstructing or detaining any person. Where the vehicle is in the borrower's possession and the borrower objects, possession is not taken and the matter returns to Legal. Where the vehicle carries goods or passengers, possession is not taken. Where a driver who is not the borrower is present, the driver is allowed to remove personal belongings and to arrange onward travel.\n\n" +
        "At the point of possession. An inventory is prepared listing the vehicle's condition, accessories, fuel, tools, documents and any goods, signed by the agent and, where present, the borrower or driver. The vehicle is photographed from all sides and the odometer recorded. Personal belongings are returned to the borrower immediately and never retained as leverage.\n\n" +
        "Notice after possession. The borrower is informed in writing within 24 hours that possession has been taken, where the vehicle is held, what is owed, how the vehicle may be redeemed, and by when. The right to redeem before sale is stated in that notice, not left to be discovered.\n\n" +
        "Voluntary surrender. Follows the same procedure. A written surrender is obtained, the inventory and photographs are taken, and the borrower is given the same notice of dues and the right to redeem. A voluntary surrender does not waive the borrower's rights and is not recorded as though it were a repossession.",
    },
    {
      id: "CO-008", title: "Yard Custody, Valuation and Sale", cat: "collect", clearance: 2, scopes: ["collect", "legal", "ops"],
      owner: "Head of Collections", updated: "2026-06-04", rev: "4.0", system: "Collections & Recovery",
      tags: ["yard", "custody", "inventory", "valuation", "sale", "auction", "reserve", "shortfall", "surplus", "redemption", "notice of sale", "release", "redeem", "before sale", "return the vehicle", "tender"],
      body:
        "This procedure governs a repossessed or surrendered vehicle from arrival at the yard to sale and settlement of the account.\n\n" +
        "Custody. Vehicles are held only at approved yards, insured, secured and under a yard register recording arrival, condition, the inventory and every movement. The yard operator is empanelled under the outsourcing policy. A vehicle held at an unapproved location, at an agent's premises or at a branch, is an uninsured and undocumented exposure and is reported as an incident.\n\n" +
        "Condition on arrival. Verified against the inventory taken at possession, with any discrepancy recorded and photographed the same day. A discrepancy between possession and arrival is investigated by the risk containment unit, not resolved between the agent and the yard.\n\n" +
        "Redemption before sale: the customer comes with money. The borrower may redeem the repossessed vehicle at any time before the sale is concluded by paying the amount stated in the post-possession notice. Where the borrower arrives with that amount, the tender is accepted, the vehicle is released back to them within two working days and the account is regularised. A redemption tender is never refused on the ground that a sale has been arranged, an auction has been advertised or a buyer is waiting, and it is not refused because the yard or the auctioneer would charge a cancellation. Those costs are recovered from the borrower under the notice, not used as a reason to decline the release.\n\n" +
        "Valuation. An independent valuation from an empanelled valuer before sale. Where the vehicle is more than five years old or has been in an accident, two valuations. The reserve price is set from the valuation by the Head of Collections and is not set below it without written reasons recorded.\n\n" +
        "Notice of sale. The borrower and every guarantor are given written notice of the intended sale stating the date, the manner of sale and the reserve, with the period required by the agreement. Sale before the notice period expires is void as against the borrower and is treated as a serious breach.\n\n" +
        "Sale. By auction or through an approved channel, conducted transparently. Anvira does not purchase the vehicle. No employee, agent, valuer, yard operator or their relatives may bid, directly or through another person, and a declaration to that effect is taken from the successful bidder.\n\n" +
        "Settlement of the account. Sale proceeds are applied to the dues and to the reasonable and evidenced costs of possession, custody, valuation and sale. The borrower is given a written statement showing the sale price, each cost itemised, and the resulting surplus or shortfall. A surplus is returned to the borrower within seven working days. A shortfall remains recoverable and is pursued under the ordinary recovery process; it does not justify a different standard of conduct.\n\n" +
        "Closing the file. The transfer of the vehicle and the removal of the endorsement of hypothecation are completed as part of the sale. The file is not closed until both are evidenced, because an endorsement left in place on a vehicle Anvira has sold produces a claim from the buyer later.",
    },
    {
      id: "CO-009", title: "Settlement and Compromise Policy", cat: "collect", clearance: 2, scopes: ["collect", "legal", "credit", "risk"],
      owner: "Head of Collections", updated: "2026-02-27", rev: "5.2", system: "Collections & Recovery",
      tags: ["settlement", "OTS", "compromise", "sacrifice", "authority", "bureau reporting", "classification", "waiver", "no dues"],
      body:
        "A settlement is an agreement to accept less than the contracted dues in full discharge of the account. It is a commercial decision with consequences for the borrower's credit record, for classification and for provisioning, and none of those may be traded away to close a case.\n\n" +
        "When a settlement is considered. Where recovery in full is not realistically achievable within a reasonable period, where enforcement would cost more than it recovers, where the borrower's circumstances have changed materially and permanently, or where a legal position is genuinely uncertain. A settlement is not used to make a bucket look better at a month end.\n\n" +
        "Authority. Recovering not less than the principal outstanding: Area Collections Manager. Sacrifice of principal up to 25 lakh: Head of Collections. Beyond that: the Board Committee. The sacrifice is computed against the full contracted dues including interest and charges, and the computation is shown in the approval note rather than summarised.\n\n" +
        "What must be established first. That the account is genuinely delinquent and the arrears are not the product of an unapplied receipt, an unregistered mandate or a disputed charge. That the security position has been assessed and any realisable security has been considered. That there is no indication of fraud, because a settlement is not available on an account under fraud investigation.\n\n" +
        "The offer and the document. Made in writing, stating the amount, the date by which it must be paid, that the offer lapses if the date is missed, and precisely what the borrower receives on payment. The settlement agreement is executed before the payment is accepted as settlement rather than as a part payment.\n\n" +
        "Credit reporting. An account closed by settlement is reported to the credit information companies as settled, not as closed. The borrower is told this in writing before they accept, in plain language, because it affects their ability to borrow for years and a borrower who discovers it afterwards has a legitimate grievance. Reporting an account as closed when it was settled is a misreport and is corrected on discovery.\n\n" +
        "After settlement. A no-dues certificate is issued, every security is released, satisfaction of charge is filed, and the credit bureau report is updated within the reporting cycle. A borrower who has settled and whose charge remains registered has not received what they paid for.\n\n" +
        "Monitoring. Settlements are reported monthly by product, region, authority and sacrifice, with the recovery rate against the security value where security existed. A concentration of settlements in one branch, one agency or one officer is reviewed by the risk containment unit as a matter of course rather than on suspicion.",
    },
    {
      id: "CO-010", title: "Write-off and Provisioning Interface", cat: "collect", clearance: 3, scopes: ["collect", "fincon", "risk"],
      owner: "Head of Collections", updated: "2026-01-16", rev: "3.6", system: "Core Accounting",
      tags: ["write-off", "technical write-off", "prudential", "recovery after write-off", "board", "provision", "de-recognition", "pursuit"],
      body:
        "A write-off removes an exposure from the books. It does not extinguish the debt, does not release any security, and does not end Anvira's right to recover. This document sets out when a write-off is recommended, who approves it, and what continues afterwards.\n\n" +
        "Types. A technical or prudential write-off removes the exposure from the balance sheet while the claim is retained and pursued. A waiver extinguishes the claim and is a different act requiring different approval. The two are never recorded interchangeably, and a technical write-off is never described to a borrower as a waiver.\n\n" +
        "When a write-off is recommended. Where the account is fully provided, where recovery efforts have been exhausted or the cost of further pursuit exceeds the realistic recovery, where the security has been realised or is not realisable, and where the legal position has been assessed. The recommendation records what was recovered, what was attempted, and what remains available.\n\n" +
        "Approval. Every write-off is approved by the Board Committee on a recommendation from the Head of Collections countersigned by the Chief Risk Officer and the Chief Financial Officer. No operational authority may write off an exposure, and a write-off is never applied to bring a delinquency figure inside a target.\n\n" +
        "What continues. Recovery continues on a written-off account within the ordinary conduct rules. Security continues to be held and is released only on settlement or realisation. Legal proceedings already commenced continue. The account continues to be reported to the credit information companies until it is settled or closed.\n\n" +
        "Recovery after write-off. Amounts recovered on a written-off account are recognised as recovery in the period received and are reported separately from current-book collections, because netting them into collection efficiency flatters the figure and hides how the current book is actually performing.\n\n" +
        "Reporting. Write-offs are reported to the Board Committee quarterly by product, vintage, region and originating channel, with the recovery achieved on previously written-off accounts alongside. A concentration of write-offs in one vintage, one scheme or one sourcing channel is a credit and sourcing finding and is referred to the Chief Credit Officer, not merely noted.",
    },
    {
      id: "CO-011", title: "Microfinance Collection Conduct", cat: "collect", clearance: 1, scopes: ["collect", "mfi"],
      owner: "Anvira Microfinance, Head of Operations", updated: "2026-03-11", rev: "4.1", system: "Collections & Recovery",
      tags: ["microfinance", "centre meeting", "JLG", "group", "cash collection", "conduct", "no coercion", "residence", "MFI", "restructure"],
      body:
        "This standard governs collection by Anvira Microfinance Limited. The joint liability model creates a specific risk: pressure applied to a group rather than to a borrower, which is both prohibited and, when it happens, invisible in the collection numbers because the money arrives.\n\n" +
        "Place and time. Collection takes place at the designated centre meeting place at the agreed time. A borrower who misses a meeting may be visited at her residence only after two consecutive absences, within permitted hours, and only by the assigned officer.\n\n" +
        "Group pressure is prohibited. No member is required, asked or encouraged to pay another member's instalment. A centre meeting is not held open, extended or reconvened until a shortfall is made good. No member's name is read out as defaulting. No group is denied a subsequent loan cycle because of one member's arrears where the group's own repayment is regular.\n\n" +
        "Joint liability, honestly stated. The joint liability in this product is a mutual undertaking within the group and is not enforced by Anvira as a legal guarantee against other members. Nothing is said to a group that implies otherwise, and no officer suggests that other members will be pursued for a member's dues.\n\n" +
        "Cash handling. Every collection is receipted to the member at the point of collection and entered against her loan card. Cash is remitted the same day. A member's loan card is her record and is never retained by the officer between meetings.\n\n" +
        "Hardship. Where a member cannot pay because of illness, bereavement, a natural event or the loss of her income activity, the officer records the circumstance and refers it to the branch manager the same day. Restructuring options exist and are offered; pressing a member in genuine hardship is prohibited and is a conduct matter.\n\n" +
        "What is never permitted. Visiting at odd hours. Sitting outside a member's house until payment is made. Speaking to a member's husband, employer or family about the debt without her consent. Taking any household article, utensil, livestock or document. Raising the voice at a centre meeting. Any suggestion that a member's other borrowings, ration entitlements or government benefits are affected.\n\n" +
        "Supervision. Branch managers attend a sample of centre meetings unannounced each month. Members are asked directly, away from the officer, whether collection has been conducted as described here, and the answers are recorded whether or not they raise anything.",
    },

    /* ================= RISK, CLASSIFICATION AND FRAUD ================= */
    {
      id: "RK-001", title: "Income Recognition, Asset Classification and Provisioning", cat: "risk", clearance: 2, scopes: ["risk", "fincon", "credit", "compliance"],
      owner: "Chief Risk Officer", updated: "2026-04-15", rev: "7.0", system: "Core Accounting",
      tags: ["IRACP", "NPA", "SMA", "DPD", "classification", "upgrade", "day-end", "provisioning", "substandard", "doubtful", "overdue"],
      body:
        "This policy governs how an exposure is classified and provided for. It applies to Anvira Finserv Limited; each subsidiary applies its own policy aligned to the framework applicable to it. Classification is a mechanical consequence of the day-end position, not a judgement, and it is never adjusted to produce a reported number.\n\n" +
        "Overdue. An amount is overdue if it has not been paid on the due date fixed by Anvira. There is no grace period. An instalment due on the 5th and unpaid at the end of the 5th is overdue on the 5th, and the day count begins from that date.\n\n" +
        "Day-end flagging. Accounts are flagged as part of the day-end process for the relevant calendar date. The position is stamped daily; it is not derived at month end from a month-end balance. An account that was overdue for eleven days and then paid was in the special mention stages for those eleven days and the record shows it.\n\n" +
        "Special mention stages. SMA-0 where the principal or interest is overdue between 1 and 30 days. SMA-1 between 31 and 60 days. SMA-2 between 61 and 90 days. These are reported and monitored, and an account in SMA-2 is on the last step before classification.\n\n" +
        "Non performing. An exposure is classified as non performing where the instalment or interest remains overdue for more than 90 days. The classification is borrower-level for the facilities of that borrower where the policy or the framework requires it, not facility-level in isolation.\n\n" +
        "Sub-classification. A non performing exposure is substandard for the first 12 months, doubtful thereafter, and loss where it is identified as uncollectible. The clock runs from the date of classification and is not reset by a part payment that does not clear the arrears.\n\n" +
        "Upgrade. This is the rule most often got wrong. An account classified as non performing is upgraded to standard only when the entire arrears of interest and principal are paid. Not the overdue instalment, not enough to bring the days past due below the threshold: the entire arrears. Where a borrower holds more than one facility, upgrade of any one requires the entire arrears across all of that borrower's facilities to be cleared. A part payment that reduces the days past due does not upgrade the account and does not stop the sub-classification clock.\n\n" +
        "Provisioning. Provision is held against every exposure at the rate set out in the provisioning schedule by classification and security position, and the expected credit loss computation under the accounting standard runs alongside it. Where the two produce different figures, the higher governs for reporting and the difference is disclosed. No provision is released on the strength of a security valuation that has not been refreshed within its validity.",
    },
    {
      id: "RK-002", title: "Expected Credit Loss Methodology", cat: "risk", clearance: 3, scopes: ["risk", "fincon"],
      owner: "Chief Risk Officer", updated: "2026-03-08", rev: "4.1", system: "Portfolio Analytics",
      tags: ["ECL", "stage 1", "stage 2", "stage 3", "PD", "LGD", "EAD", "significant increase", "forward looking", "overlay", "backtest"],
      body:
        "Expected credit loss is computed under the applicable accounting standard on every financial asset carried at amortised cost. This document sets out the model, the staging criteria and the governance around the judgements.\n\n" +
        "Staging. Stage 1 covers exposures without a significant increase in credit risk since initial recognition, provided for at twelve month expected loss. Stage 2 covers exposures where credit risk has increased significantly, provided at lifetime expected loss. Stage 3 covers credit-impaired exposures, provided at lifetime expected loss with interest recognised on the net carrying amount.\n\n" +
        "Significant increase in credit risk. Determined by a combination of quantitative and qualitative triggers, not by days past due alone. Quantitative: 30 days past due, a defined deterioration in behavioural score, or a defined increase in probability of default relative to origination. Qualitative: restructuring, a covenant breach on a wholesale exposure, security cover falling below the covenanted level, a downgrade of an external rating, or the borrower entering a resolution process. The 30 day trigger is a rebuttable presumption; rebutting it in any portfolio requires Risk Committee approval and evidence, and it has not been rebutted in any portfolio at this revision.\n\n" +
        "Parameters. Probability of default is estimated per pool from observed default experience over a full cycle where available. Loss given default is estimated from realised recoveries net of the costs of recovery, discounted to the date of default, and reflects the security actually realised rather than the security valued at origination. Exposure at default reflects the amortisation profile and, for revolving facilities, an estimate of further drawdown.\n\n" +
        "Pooling. Exposures are pooled by product, security type, vintage and geography. A pool must be large enough for its experience to be meaningful and homogeneous enough for that experience to apply to every member; a pool that is neither produces a precise number with no content.\n\n" +
        "Forward looking information. Macroeconomic scenarios are applied with weights approved annually by the Risk Committee. The scenarios and weights, and the sensitivity of the provision to them, are disclosed. A scenario set that has never moved the provision is not doing any work and is challenged at review.\n\n" +
        "Management overlay. An overlay may be applied where the model demonstrably does not capture a known risk, is approved by the Risk Committee with a written rationale and a defined release trigger, and is disclosed. An overlay without a release trigger becomes permanent and is treated as a model failure to be corrected rather than an overlay to be maintained.\n\n" +
        "Backtesting. Model outputs are backtested annually against realised losses by pool. Persistent under-prediction in a pool is a model finding and is escalated before the next reporting cycle, not at the next scheduled validation.",
    },
    {
      id: "RK-003", title: "Risk Appetite Statement", cat: "risk", clearance: 3, scopes: ["risk", "policy", "fincon", "credit"],
      owner: "Chief Risk Officer", updated: "2026-04-29", rev: "5.0", system: "Policy Repository",
      tags: ["risk appetite", "limit", "tolerance", "breach", "concentration", "board", "capital", "liquidity", "conduct"],
      body:
        "The board sets the risk Anvira is willing to accept in pursuit of its plan. This statement expresses that as limits, and a limit is a boundary rather than a target. Operating at a limit is not compliance, it is the absence of headroom.\n\n" +
        "Credit risk. Gross non performing assets not to exceed the level stated in the board schedule at group level, with sub-limits by product. Unsecured exposure not to exceed the stated share of the total book. Exposure to any single borrower group not to exceed the stated share of owned funds. Exposure to any one sector in the wholesale book not to exceed the stated share of the wholesale book. Vintage delinquency at six months on the book not to exceed the level stated for each product.\n\n" +
        "Concentration. By geography, by sourcing channel, by product and by counterparty. No single sourcing channel to originate more than the stated share of a product's monthly volume. No single dealer counter to originate more than the stated share of a scheme's volume. Concentration limits exist because a channel that becomes indispensable cannot be disciplined.\n\n" +
        "Liquidity and funding. Minimum liquidity buffer, maximum negative cumulative gap in each maturity bucket, maximum share of borrowings from any single lender, and maximum share of borrowings maturing in any rolling three month window. These are set in the asset liability policy and are limits of this statement.\n\n" +
        "Conduct. Complaints per thousand live accounts not to exceed the stated level by product. Complaints alleging recovery misconduct not to exceed the stated level in any region. A conduct limit breach is reported to the board committee in the same way as a credit limit breach, and the fact that no money has been lost is not a mitigation.\n\n" +
        "Operational. Unreconciled items above the stated age and value. Post disbursement documents outstanding beyond the stated period as a share of the secured book. Registry filings missed. Each of these is a limit and each has an owner.\n\n" +
        "Breach handling. A breach is reported to the Chief Risk Officer on the day it is identified and to the board committee at its next meeting, with the cause, the exposure, the remediation and the date by which the position returns inside the limit. A breach may be accepted temporarily only by the board committee, only with a defined expiry, and never by the business that caused it. A limit repeatedly breached and repeatedly accepted is not a limit and is either enforced or changed.",
    },
    {
      id: "RK-004", title: "Fraud Risk Management and the Risk Containment Unit", cat: "risk", clearance: 3, scopes: ["risk", "credit", "ops"],
      owner: "Chief Risk Officer", updated: "2026-05-12", rev: "5.4", system: "Loan Origination",
      tags: ["fraud", "RCU", "typology", "sampling", "investigation", "staff involvement", "identity substitution", "collusion", "reporting", "recovery", "employee involvement", "staff", "notify", "line manager", "access"],
      body:
        "The risk containment unit detects, investigates and reports fraud in origination and servicing. It is independent of credit and of business, reports to the Chief Risk Officer, and its findings are not subject to commercial override.\n\n" +
        "Typologies seen in this book. Fabricated or altered income documents. Manipulated bank statements. Inflated valuations, usually concentrated on a small number of valuers. Fictitious or substituted borrowers, where the person who signs is not the person whose identification is on the file. Collusive sourcing, where a channel, a valuer and sometimes an employee operate together across a run of files. Vehicle cases where the asset does not exist or is financed twice. Gold cases involving low-purity or plated ornaments. Diversion of a facility to a purpose other than the one sanctioned.\n\n" +
        "Detection. Rule-based screening at login, sampling of disbursed files, re-verification of a share of positive field investigations, analysis of early delinquency clusters by channel, valuer, employee and geography, and referrals from any employee. A cluster of first instalment defaults from one sourcing point is a fraud signal before it is a credit signal, and is screened as such.\n\n" +
        "Sampling. Ten per cent of disbursed files each month, weighted towards the channels, branches and valuers with the highest early delinquency, plus a random sample so that a channel cannot infer that it is not being looked at.\n\n" +
        "Investigation standard. Evidence is gathered and preserved so that it can support a police complaint or a disciplinary proceeding. Original documents are secured. Statements are taken and signed. Nothing is confronted before the evidence is secured, because a warned party destroys records. The investigating officer does not decide the outcome alone: findings go to the fraud review committee.\n\n" +
        "Suspected employee involvement. Where the pattern implicates an employee, the Chief Risk Officer and the Head of Human Resources are informed before anyone else, and the employee's line manager is not informed at that point. System access is reviewed and, where necessary, restricted quietly. The investigation is conducted by an officer with no reporting relationship to the person concerned.\n\n" +
        "Identity substitution. Where a customer states that a facility in their name was not taken by them, the account is placed on hold for recovery purposes immediately, the file's identification records and the field verification are pulled and examined, the signatures on the executed documents are compared, and the customer is not pursued for the dues while the investigation runs. Continuing recovery against a person who says they did not take the loan, before establishing that they did, is both a conduct failure and evidence against Anvira later.\n\n" +
        "Reporting. Established frauds are reported internally to the board committee and externally as required by the reporting framework, within the timeframes in the compliance calendar. Recovery is pursued separately from the classification and provisioning treatment, which follows the ordinary policy and is not deferred pending the investigation.",
    },
    {
      id: "RK-005", title: "Early Warning Signals and Portfolio Monitoring", cat: "risk", clearance: 3, scopes: ["risk", "credit", "collect", "fincon"],
      owner: "Chief Risk Officer", updated: "2026-06-09", rev: "3.8", system: "Portfolio Analytics",
      tags: ["early warning", "vintage", "roll rate", "collection efficiency", "flow rate", "cohort", "leading indicator", "monitoring", "review"],
      body:
        "Portfolio monitoring exists to see a problem while it is still cheap. This document sets out what is monitored, at what frequency, and how the measures are read together, because most of them are misleading on their own.\n\n" +
        "Vintage analysis. Delinquency at three, six, nine and twelve months on the book, by product, sourcing channel, scheme, geography and score band, compared with the same points for earlier cohorts. Vintage is the only measure that separates a change in portfolio quality from a change in portfolio size, and it is the first thing read.\n\n" +
        "Roll and flow rates. The share of each bucket that rolls forward, rolls back or resolves, monthly. Roll rates respond to a change in collection capacity as much as to a change in borrower behaviour, so a movement is never attributed to credit quality until the collections side has been ruled out.\n\n" +
        "Collection efficiency and delinquency read together. Collection efficiency is the share of billed instalments collected in the period. It can hold steady while delinquency rises, and the two are not in conflict when that happens: efficiency measures the current billing, delinquency measures the accumulated stock. Efficiency can also be flattered by collections against written-off accounts, by receipts applied late, and by a growing book where the denominator is dominated by fresh, current accounts. Where the two disagree, the book is decomposed by cohort before any conclusion is drawn.\n\n" +
        "First instalment default. Tracked separately from all other delinquency, by product, scheme, dealer counter, branch and sourcing channel. It is the shortest-feedback measure available and it is the one most often misread, because it is sensitive to the instalment calendar and to mandate registration as well as to borrower quality. A movement in first instalment default is checked against the disbursal-to-first-instalment interval and the mandate registration lead time before it is treated as a credit signal.\n\n" +
        "Concentration and correlation. Exposure by sector, geography, group and channel. In the wholesale book, additionally by promoter group and by counterparty to the security.\n\n" +
        "Leading operational indicators. Deviation rates, override rates, field verification failure rates, post disbursement document ageing, unapplied receipts, mandate registration failures by sponsor bank, and complaint volumes by root cause. These move before delinquency does. A rise in mandate registration failures at one sponsor bank is a collections problem four weeks before it appears in a bucket.\n\n" +
        "Review cadence. Weekly operational dashboard to the functional heads. Monthly risk pack to the executive. Quarterly portfolio review to the board risk committee, including every limit against its threshold and every measure that has moved more than its stated tolerance, whether or not it has crossed a limit.",
    },

    /* ================= COMPLIANCE, FINANCIAL CRIME AND AUDIT ================= */
    {
      id: "CM-001", title: "Customer Identification and Financial Crime Policy", cat: "aml", clearance: 1, scopes: ["aml", "compliance", "ops"],
      owner: "Principal Officer, Financial Crime", updated: "2026-05-26", rev: "9.0", system: "Compliance Gateway",
      tags: ["KYC", "AML", "identification", "OVD", "beneficial owner", "risk categorisation", "monitoring", "designated officer", "str", "record keeping"],
      body:
        "This policy governs customer identification, ongoing due diligence, transaction monitoring and reporting across Anvira Finserv Limited and both subsidiaries. It is open to every employee, because everybody who onboards or services a customer operates under it. The case material generated under it is not open, and that distinction runs through this document.\n\n" +
        "Designated officers. The board designates a Principal Officer responsible for monitoring, reporting and record keeping, and a Designated Director. These are personal designations. The functions attaching to them are not delegable, are not exercised by seniority, and are not shared with the business.\n\n" +
        "Identification. Every customer is identified before an account based relationship commences, using an officially valid document and the permitted verification routes. For non-individual customers, the constitution, the authorised signatories and every beneficial owner above the prescribed threshold are identified. A relationship is not commenced on the basis that identification will follow.\n\n" +
        "Risk categorisation. Every customer is categorised as low, medium or high risk on onboarding, from the customer type, the product, the geography, the expected activity and the identification obtained. The categorisation drives the depth of due diligence and the frequency of periodic update, and it is reviewed on a defined cycle and immediately on a trigger.\n\n" +
        "Ongoing due diligence. Activity is monitored against the profile recorded at onboarding. A material divergence is examined rather than absorbed. Enhanced due diligence applies to high risk customers, to politically exposed persons, and to any relationship where the beneficial ownership is complex or opaque.\n\n" +
        "Transaction monitoring and alerts. Alerts are generated by rules and scenarios maintained by the financial crime team and reviewed periodically for effectiveness. Every alert is dispositioned by a trained analyst with the reasoning recorded. An alert closed without recorded reasoning is not closed.\n\n" +
        "Reporting, and the wall around it. Where analysis gives grounds for suspicion, a report is made to the financial intelligence unit by the Principal Officer within the prescribed period. It is an offence to disclose to the customer, or to any person other than those designated, that such a report has been made or is being contemplated, or to disclose the information contained in it. This prohibition binds every employee at every level, including the board and the Managing Director. Case material is held in a restricted file accessible only to the designated team.\n\n" +
        "What a branch is told. A branch may be instructed to place an account under a transaction monitoring hold without being given a reason, and the absence of a reason is deliberate rather than an oversight. The branch actions the hold, does not discuss it with the customer, does not speculate about it internally, and directs any query to Central Operations. A branch that receives such an instruction has not been told that a report exists, and should not conclude that one does.\n\n" +
        "Record keeping. Identification records are retained for the prescribed period from the end of the relationship and transaction records for the prescribed period from the transaction. Records relating to a report are retained separately and for as long as the framework requires.",
    },
    {
      id: "CM-002", title: "Account Holds and Restricted Instructions", cat: "ops", clearance: 1, scopes: ["ops", "service", "collect", "credit"],
      owner: "Central Operations Manager", updated: "2026-05-26", rev: "2.3", system: "Loan Management",
      tags: ["hold", "block", "restricted instruction", "no reason", "str", "customer query", "escalation", "branch", "disbursal blocked", "monitoring"],
      body:
        "An account may be placed under a hold that blocks disbursal, top-up, renewal, closure or the release of security. This document tells any employee what to do when they meet one, and is deliberately written to be readable by everybody.\n\n" +
        "Kinds of hold. An operational hold, such as a documentation or reconciliation hold, carries a reason and an owner and is resolved by fixing the underlying item. A legal hold arises from proceedings or an order and is managed by Legal. A compliance or transaction monitoring hold is placed by Central Operations on the instruction of a designated function and carries no reason.\n\n" +
        "A hold with no reason is not an error. Where an account carries a hold and the system shows no reason, the instruction is complete as it stands. It has not been recorded badly, and there is no further detail waiting to be looked up. Some instructions are placed by functions that are prohibited from stating why, and the absence of a reason is the design rather than a defect in it.\n\n" +
        "What the branch does. Action the hold. Do not process the blocked transaction. Do not attempt to work around it through another product, another entity or another branch. Do not discuss it with the customer beyond what this document permits.\n\n" +
        "What to tell the customer. That the request cannot be processed at present, that it has been referred, and that they will be contacted. Nothing further. Do not say that the account is under review, under investigation, blocked by compliance, or flagged, and do not speculate. Do not tell the customer to contact any department directly. If the customer presses, repeat the same sentence; it is complete and it is accurate.\n\n" +
        "What not to do internally. Do not raise it in a branch or regional group message. Do not ask the relationship manager or the sourcing channel to find out. Do not email a query naming the customer to a distribution list. A query about a held account goes to Central Operations through the ticketing route and to nobody else.\n\n" +
        "Escalation. Raise a ticket to Central Operations with the account number and the transaction that was blocked. Central Operations acknowledges within one working day. Where the hold is operational, the reason and the owner are given. Where it is not, the response says that the hold stands and that the account will be updated when the position changes, and that response is the complete answer.\n\n" +
        "Why this matters. Some holds sit behind obligations where any disclosure, including to the customer and including within Anvira, is itself an offence. An employee who follows this document has met their obligation in full. An employee who tries to be helpful by finding out and explaining may create a personal liability for themselves as well as for Anvira.",
    },
    {
      id: "CM-003", title: "Regulatory Reporting Calendar and Returns", cat: "compliance", clearance: 2, scopes: ["compliance", "fincon", "risk", "ops"],
      owner: "Chief Compliance Officer", updated: "2026-06-20", rev: "6.5", system: "Compliance Gateway",
      tags: ["returns", "calendar", "filing", "CIMS", "CRILC", "large exposure", "validation", "resubmission", "deadline", "owner"],
      body:
        "This calendar lists every return Anvira and its subsidiaries file, the entity that files it, the frequency, the due date, the data owner and the preparer. A return not on this calendar is not being tracked, and the completeness of the calendar is reviewed against the applicable frameworks each quarter.\n\n" +
        "Filing platform. Supervisory returns are filed on the centralised information management system, which replaced the earlier filing platform. Every entity is registered separately with its own users, and user access is reviewed half yearly. A user who has left is removed on the day of exit rather than at the next review.\n\n" +
        "Large credit reporting. Exposures to a single borrower above the prescribed threshold are reported to the central repository within the period prescribed after each quarter end, and specified events are reported as they occur rather than at quarter end. The population is drawn at borrower level across all facilities and both subsidiaries where required, which is why it cannot be produced from a single product system.\n\n" +
        "Preparation. Every return is prepared from a defined source, and the source is named on the working paper. Where the loan management system and the general ledger produce different figures for the same measure, the reconciled figure is filed and the reconciliation is retained; filing whichever system was easier to extract from is the most common cause of a subsequent correction.\n\n" +
        "Validation. Returns are validated before submission and again on the platform. Common causes of a validation failure are a code not in the permitted list, a total that does not agree to its components, a period that does not align with the reporting date, and a null in a mandatory field where the underlying record genuinely has no value. Failures are worked from the platform's own error file rather than by resubmitting and hoping.\n\n" +
        "Submission and acknowledgement. A return is filed only when the acknowledgement is received and stored against the calendar entry. A submission without an acknowledgement is not a filing, and the calendar is not marked complete on the strength of an upload.\n\n" +
        "Correction. Where a filed return is found to be wrong, it is corrected through the platform's correction route at the earliest opportunity, the correction is recorded on the calendar with the cause, and where the error is material the Chief Compliance Officer informs the supervisor rather than waiting to be asked.\n\n" +
        "Accountability. The preparer prepares, the data owner certifies the figures, and the Chief Compliance Officer is accountable for the filing. A missed deadline is reported to the audit committee whether or not an extension was obtained.",
    },
    {
      id: "CM-004", title: "Regulatory Change Management", cat: "compliance", clearance: 2, scopes: ["compliance", "policy", "legal"],
      owner: "Chief Compliance Officer", updated: "2026-04-03", rev: "3.2", system: "Policy Repository",
      tags: ["regulatory change", "circular", "impact assessment", "implementation", "policy", "system parameter", "template", "owner", "evidence", "closure"],
      body:
        "A new or amended regulatory requirement is tracked from publication to implemented and evidenced. This process exists because the failure mode is not missing a circular; it is reading one, changing the policy, and never changing the six other things the policy touched.\n\n" +
        "Capture. Compliance monitors the sources daily and records every applicable instrument on the regulatory change register with its date, its effective date and the entities it binds. Applicability is assessed for the parent and each subsidiary separately, because the same instrument may bind one and not another.\n\n" +
        "Impact assessment. Within ten working days of publication, the requirement is mapped through the full chain, and each link gets a named owner and a date: the policy that must change; the product or products affected; the process or standard operating procedure; the system parameter or configuration; the customer-facing document, template, letter, notice or statement narration; the disclosure on the website or in the digital journey; the regulatory return affected; the training that must be refreshed; and the monitoring that will evidence it afterwards.\n\n" +
        "The link most often missed. Customer-facing templates are configured in more than one system and owned by functions other than the policy owner. A change recorded as complete because the policy was reissued and the primary system parameter was changed will leave templates in the secondary systems untouched. Completion of the template link requires the configuration record from every system in which that template exists, and the impact assessment lists them individually rather than as a single line.\n\n" +
        "Implementation and evidence. Each link is closed against evidence: the approved policy, the configuration screenshot or change record, the reissued template from each system, the updated return specification, the training completion report. An email confirming that a change was requested is not evidence of implementation.\n\n" +
        "Assurance after the event. Every material change is tested by compliance testing within one quarter of the effective date, on a sample of live cases and live customer communications rather than on the documentation of the change. Testing looks at what a customer actually received.\n\n" +
        "Reporting. Open items on the register, their age and their owners are reported to the audit committee quarterly. An item recorded as closed that testing later finds open is reported as a failed closure and not silently reopened.",
    },
    {
      id: "CM-005", title: "Internal Audit Charter and Risk Based Audit Plan", cat: "audit", clearance: 2, scopes: ["compliance", "policy", "risk"],
      owner: "Head of Internal Audit", updated: "2026-01-31", rev: "4.0", system: "Policy Repository",
      tags: ["internal audit", "RBIA", "charter", "independence", "finding", "rating", "ATR", "closure", "repeat finding", "audit committee"],
      body:
        "Internal audit provides independent assurance to the audit committee on the design and operating effectiveness of controls. It reports functionally to the audit committee, its head is appointed and removed by that committee, and its plan, scope and findings are not subject to management approval.\n\n" +
        "Risk based planning. The annual plan is built from a risk assessment of every auditable unit: branches, credit hubs, central operations, collections, the agency network, treasury, technology and each subsidiary. Units are audited at a frequency driven by their assessed risk, and the assessment is refreshed at least annually and on a trigger such as a fraud, a regulatory observation or a significant change in volume.\n\n" +
        "Findings and ratings. Every finding records the control, what was expected, what was found, the sample and population tested, the risk, the recommendation and the agreed action with an owner and a date. Findings are rated high, medium or low. The rating reflects the risk if the control fails, not the amount involved in the instances found, because a low-value instance of a broken control is evidence about the control rather than about the value.\n\n" +
        "Action taken reports. Management responds with an action taken report and evidence. Internal audit verifies closure independently rather than accepting the report. Verification tests the control again on fresh transactions; a finding closed on the strength of a corrected instance and a circular reminding staff of the rule has not been verified.\n\n" +
        "Repeat findings. A finding raised again after being closed is reported to the audit committee as a repeat with the previous closure evidence attached, and the rating is escalated by one level. A repeat finding is treated as a failure of the closure process as much as of the control, and the closure that was accepted is examined.\n\n" +
        "Low-rated findings. A low rating means the risk of the control failing is low, not that the finding may be closed without action. Low-rated findings that touch document control, template management, customer disclosure or delegation are reviewed annually as a group, because these are the findings most often closed on an assurance rather than a fix, and the ones most likely to reappear as a customer-facing failure at scale.\n\n" +
        "Reporting. Every finding, its status, its age and its owner is reported to the audit committee quarterly. Findings open beyond their agreed date are reported individually with the reason.",
    },
    {
      id: "CM-006", title: "Compliance Testing Programme", cat: "compliance", clearance: 2, scopes: ["compliance", "policy", "service", "collect"],
      owner: "Chief Compliance Officer", updated: "2026-06-12", rev: "2.8", system: "Policy Repository",
      tags: ["compliance testing", "monitoring", "sample", "customer communication", "disclosure", "conduct", "outcome", "exception", "second line"],
      body:
        "Compliance testing checks that what Anvira does matches what its policies say, on live cases rather than on documentation. It is second line assurance, distinct from internal audit, and it tests outcomes for customers rather than the existence of controls.\n\n" +
        "What is tested. Disclosure at sanction, including the key facts statement, its contents and the borrower's acknowledgement. The accuracy of charges applied against the schedule and against what was disclosed. Recovery conduct, tested from call recordings and field visit logs rather than from the conduct policy. Complaint handling against the committed timelines and the quality of the response. Identification standards. Digital journey disclosures. Partner and agent conduct. The currency of customer-facing templates against their parent policies.\n\n" +
        "Method. A risk-weighted sample of live cases each quarter, drawn independently rather than supplied by the function being tested. Testing follows the customer's experience: what was sent, what was said, what was charged, what was received. Where a document was supposed to be given to a customer, the test is whether the customer's copy exists, not whether the template exists.\n\n" +
        "Template currency testing. Templates are tested by pulling the actual communications sent to customers in the period, from every system that sends them, and comparing them against the parent policy in force on the date they were sent. Testing the template library rather than the sent items misses templates configured in systems that are not in the library, which is where this failure lives.\n\n" +
        "Exceptions. Every exception records the case, what was expected, what happened, the customer impact, and whether other customers are likely to be affected in the same way. The last question is the one that matters: an exception affecting one customer is remediated for that customer, and an exception arising from a template, a parameter or a policy interpretation is remediated for the whole affected population without waiting for those customers to complain.\n\n" +
        "Remediation. Where customers have been charged something that should not have been charged, or told something that was not correct, the affected population is identified, refunds or corrections are made proactively, and the customers are informed. A remediation that waits for the customer to notice is not a remediation.\n\n" +
        "Reporting. Results, exceptions, remediations and open items are reported to the audit committee quarterly and to the Chief Executive monthly, with the population affected quantified rather than described.",
    },
    {
      id: "CM-007", title: "Supervisory Inspection Readiness", cat: "audit", clearance: 2, scopes: ["compliance", "policy", "risk"],
      owner: "Chief Compliance Officer", updated: "2026-05-15", rev: "3.0", system: "Policy Repository",
      tags: ["inspection", "supervisory", "readiness", "observation", "response", "evidence", "single point", "self assessment", "commitment"],
      body:
        "This procedure governs how Anvira prepares for, conducts itself during, and responds to a supervisory inspection.\n\n" +
        "Single point of contact. The Chief Compliance Officer is the single point of contact. Every request for information is routed through that office, logged, answered from a single verified source, and the answer retained. Two functions answering the same question differently is the most damaging thing that can happen during an inspection, and it happens when the routing is bypassed for speed.\n\n" +
        "Standing readiness. The following are kept current at all times rather than assembled on notice: the policy set with approval dates; the compliance calendar with filing evidence; the regulatory change register; internal audit findings with their status; compliance testing results; the complaints register with root causes; the outsourcing register with due diligence files; the delegation matrix; the deviation register; and the board and committee minutes.\n\n" +
        "Answering. Answers are complete, accurate and confined to the question. Nothing is volunteered that has not been asked, and nothing asked for is withheld. Where an answer is not known, it is not estimated: the office says it will confirm, and confirms.\n\n" +
        "Self assessment. Before each inspection cycle, compliance prepares an honest internal assessment of where Anvira is likely to be found wanting, drawing on its own testing results, audit findings and complaint root causes. The assessment goes to the audit committee. Its value is entirely in its honesty; an assessment written to reassure is worse than none, because it removes the last chance to fix something before it is found.\n\n" +
        "What is most likely to be raised. Based on the current internal evidence: the currency of customer-facing templates against revised policies, particularly in systems outside the primary template library; post disbursement documents outstanding beyond their timelines in the secured book; the closure quality of previously reported low-rated findings; oversight evidence over digital lending partners; and the completeness of borrower-level aggregation across products and entities.\n\n" +
        "Responding to observations. Each observation gets a factual response, an agreed action, an owner and a date. Anvira does not contest an observation that is correct, and does not accept one that is not. A commitment made in a response is tracked on the regulatory change register and evidenced in the same way as any other obligation, because an uncompleted commitment is the observation that returns.",
    },

    /* ================= RESTRICTED ================= */
    {
      id: "RS-001", title: "Financial Crime Case File: Alert Disposition Standard", cat: "aml", clearance: 3, scopes: ["str"],
      owner: "Principal Officer, Financial Crime", updated: "2026-06-30", rev: "5.1", system: "Compliance Gateway",
      tags: ["str", "alert", "case", "disposition", "escalation", "financial intelligence", "restricted", "designated"],
      body:
        "Access to this document is confined to the designated financial crime team. It sets out how an alert becomes a case, how a case is analysed, and how a decision to report is taken and recorded. Nothing in it may be discussed with, summarised for, or confirmed to any person outside the designation, at any level of the organisation.\n\n" +
        "Alert to case. An alert is dispositioned within the period set in the operating standard. Where the analyst cannot satisfy themselves that the activity is consistent with the customer's recorded profile and a legitimate explanation, the alert is escalated to a case. The threshold is not proof and it is not balance of probabilities; it is grounds for suspicion, which is a lower bar and is deliberately so.\n\n" +
        "Case analysis. The case file records the activity, the customer's profile, the account history, the relationships identified, any information obtained from the business without disclosing the reason for the request, the analyst's reasoning, and the conclusion. Where information is sought from a branch, the request is framed so that it does not reveal that a case exists.\n\n" +
        "Decision. The decision to report rests with the Principal Officer. The reasoning is recorded whether the decision is to report or not to report, because a decision not to report is as much a decision as its opposite and is reviewed with the same rigour.\n\n" +
        "Operational measures. Where a case requires it, an account may be placed under a transaction monitoring hold. The instruction is issued to Central Operations without a reason and the business is not told why. The operating standard for the receiving function is set out in the open document on account holds, which is deliberately written so that a branch can comply fully without learning anything.\n\n" +
        "Prohibition on disclosure. Disclosing to a customer, or to any person other than those designated, that a report has been made, is being made, or is being contemplated, or disclosing the information contained in it, is an offence. This binds every employee including the board and the Managing Director. A request for access to this material from any person outside the designation, however senior, is declined and the request itself is recorded.\n\n" +
        "Retention. Case files are retained for the period prescribed, separately from the customer's ordinary records, with access logged.",
    },
    {
      id: "RS-002", title: "Insider List and Trading Window Procedure", cat: "compliance", clearance: 3, scopes: ["upsi"],
      owner: "Company Secretary", updated: "2026-06-22", rev: "4.0", system: "Policy Repository",
      tags: ["upsi", "insider", "trading window", "designated persons", "structured digital database", "listed debentures", "restricted"],
      body:
        "Access to this document is confined to designated persons under the insider trading framework. Anvira's non-convertible debentures are listed, which brings the group inside that framework even though its equity is not listed.\n\n" +
        "What is price sensitive here. Financial results before publication. A change in the expected credit loss provision or in asset quality before it is reported. A rating action in progress or under discussion. A material acquisition, disposal, portfolio sale or capital raise. A material regulatory action or a supervisory finding of significance. A change in key managerial personnel. The commencement or resolution of a material dispute. Information about a wholesale borrower obtained by virtue of the lending relationship where that borrower is itself listed.\n\n" +
        "Designated persons and the database. The Company Secretary maintains the list of designated persons and the structured database recording every instance in which unpublished price sensitive information is shared, with the sender, the recipient, the nature of the information and the date. Entries are made at the time of sharing rather than reconstructed afterwards, and the database is maintained with an audit trail that cannot be altered.\n\n" +
        "Trading window. The window closes for designated persons from the end of each quarter until the second working day after the results are published, and at any other time the Company Secretary determines. No designated person deals in the securities of Anvira, or of a listed borrower about which they hold unpublished information, while the window is closed or while in possession of such information.\n\n" +
        "Need to know. Information is shared only with those who need it for a legitimate purpose, and the sharing is recorded. Being senior is not a legitimate purpose. A person who receives such information without a legitimate purpose informs the Company Secretary and is added to the database.\n\n" +
        "Lending relationships. Information about a listed borrower obtained through the lending relationship is confidential to the relationship and is price sensitive in relation to that borrower's own securities. It is not shared beyond the deal team and is never used for any purpose other than the credit decision.\n\n" +
        "Breach. A suspected breach is reported to the Company Secretary and the audit committee immediately. Trading in breach is a matter for the regulator as well as for Anvira, and the group cooperates fully.",
    },
    {
      id: "RS-003", title: "Vigilance Case Register", cat: "people", clearance: 3, scopes: ["whistle"],
      owner: "Chairman, Audit Committee", updated: "2026-07-02", rev: "3.0", system: "Policy Repository",
      tags: ["whistle", "vigilance", "protected disclosure", "identity", "investigation", "restricted", "audit committee", "retaliation"],
      body:
        "Access to this register is confined to the investigating officer and the Chairman of the Audit Committee. It records protected disclosures received, their handling and their outcomes. The whistleblower policy describing how a concern may be raised and how the person raising it is protected is an open document available to everybody; this register is not.\n\n" +
        "What is recorded. The date received, the channel, whether the discloser identified themselves, the substance, the units and individuals concerned, the investigating officer, the steps taken, the findings and the outcome. The identity of a discloser who gave it is recorded in a sealed field accessible only to the Chairman of the Audit Committee.\n\n" +
        "Handling. The investigating officer has no reporting relationship to any person named in the disclosure. Where the disclosure concerns a member of senior management, the Audit Committee handles it directly and appoints an external investigator where appropriate. The investigation does not begin by asking the named person for an explanation, because that identifies the discloser by inference in a small unit.\n\n" +
        "Protecting identity by construction. Requests for information during an investigation are framed so that they do not narrow the field of who could have raised the concern. Where a disclosure concerns a unit small enough that any enquiry would identify the discloser, the enquiry is widened deliberately to cover comparable units.\n\n" +
        "Access requests. A request for access to this register or to any case in it, from management including the Managing Director, is declined by the Chairman of the Audit Committee, and the request is recorded in the register. Recording the request is not an accusation; it is how the protection is evidenced if it is ever tested.\n\n" +
        "Outcomes. Every case is closed with a written outcome to the Audit Committee, stating what was found, what action was taken, and whether any control weakness was identified. Control weaknesses are passed to internal audit as a finding, described in a way that does not reveal the source.\n\n" +
        "Retaliation monitoring. Where a discloser is identifiable within Anvira, their employment record is monitored for twelve months for transfer, appraisal, increment and exclusion, and any adverse movement is examined by the Chairman of the Audit Committee before it takes effect.",
    },
    {
      id: "RS-004", title: "Privileged Legal Advice: Live Matters", cat: "legal", clearance: 3, scopes: ["privileged"],
      owner: "Head of Legal", updated: "2026-07-08", rev: "2.0", system: "Policy Repository",
      tags: ["privileged", "legal advice", "live matter", "litigation", "restricted", "matter team", "waiver", "opinion"],
      body:
        "Access to this material is confined to the named team for each matter. It holds counsel's opinions and internal legal assessments on matters that are live, contemplated or under investigation, and it is held under legal professional privilege.\n\n" +
        "Why the restriction is narrow. Privilege protects a communication made for the purpose of obtaining or giving legal advice. It can be lost by disclosure. Circulating an opinion beyond the people who need it for the matter risks waiving privilege over it, and a waived opinion becomes available to the other side. The restriction is therefore not a matter of sensitivity or seniority but of preserving a protection that only exists while it is maintained.\n\n" +
        "Matter teams. Each matter has a named team recorded by the Head of Legal, comprising the individuals who need the advice in order to act on it. Additions are made by the Head of Legal on request with a reason recorded. A person who no longer needs the advice is removed.\n\n" +
        "Handling. Advice on a live matter is not summarised into a general update, is not quoted in a committee paper, and is not paraphrased in an email to a wider group. Where a committee needs to take a decision informed by the advice, the Head of Legal attends and speaks to it rather than circulating it.\n\n" +
        "What is not privileged. The existence of a dispute, the amounts claimed, the procedural position and the provision held against it are ordinary business information and are reported in the normal way. It is the advice that is protected, not the fact of the matter, and treating the whole matter as restricted obstructs the business without protecting anything.\n\n" +
        "Requests for access. A request from outside the matter team, including from senior management, is considered by the Head of Legal against whether the requester needs the advice to act. Where the answer is no, the request is declined and the Head of Legal offers a briefing on the position instead, which meets the need without risking the protection.",
    },

    /* ================= OPEN COUNTERPARTS TO THE RESTRICTED SET =================
       Every restricting scope needs a document at clearance 1 that explains the
       process without exposing the case, or the control becomes a dead end and
       people route around it instead of respecting it. */
    {
      id: "CM-008", title: "Insider Information: What Every Employee Must Do", cat: "compliance", clearance: 1, scopes: ["policy", "compliance"],
      owner: "Company Secretary", updated: "2026-06-22", rev: "2.1", system: "Policy Repository",
      tags: ["upsi", "insider", "price sensitive", "listed debentures", "trading", "employee obligation", "who to contact", "confidential"],
      body:
        "Anvira's non-convertible debentures are listed. That brings the whole group inside the insider trading framework even though the equity is not listed, and it means information you may come across in an ordinary day's work can be price sensitive. This document is for everybody and explains what you must do. The list of designated persons, the database of who holds what, and the details of any specific matter are restricted to the Company Secretary's office.\n\n" +
        "What counts. Financial results before they are published. A change in provisioning or asset quality before it is reported. A rating action being discussed. A material acquisition, disposal, portfolio sale or capital raise. A significant regulatory action. A change in key managerial personnel. Information about a listed borrower that you learned because Anvira lends to them.\n\n" +
        "What you must do. Treat it as confidential. Do not pass it on inside Anvira to anyone who does not need it to do their job, and do not pass it outside at all, including to family. Do not deal in Anvira's securities, or in the securities of a listed borrower you have learned something about, while you hold the information. Do not discuss it in a lift, a cab, a group chat or a social setting.\n\n" +
        "If you come across something you think is price sensitive. Tell the Company Secretary's office. You will be told whether it is, and if it is you will be recorded as holding it, which is a normal administrative step and not an accusation of anything.\n\n" +
        "The trading window. Designated persons may not deal while the window is closed. If you are a designated person you will have been told. If you are not sure whether you are, ask the Company Secretary's office rather than assuming.\n\n" +
        "If somebody asks you for information of this kind. Including somebody senior, and including somebody who seems entitled to it: refer them to the Company Secretary's office rather than deciding yourself. Being senior is not a legitimate purpose, and you are not expected to make that judgement.\n\n" +
        "Who to contact. The Company Secretary's office for anything on this page. You will not be penalised for raising something that turns out not to be price sensitive.",
    },
    {
      id: "LG-001", title: "Receiving a Legal Notice or Court Process", cat: "legal", clearance: 1, scopes: ["legal", "ops", "service"],
      owner: "Head of Legal", updated: "2026-07-08", rev: "3.1", system: "Policy Repository",
      tags: ["privileged", "legal notice", "summons", "court", "process", "acknowledge", "do not reply", "escalation", "timeline"],
      body:
        "This document tells any employee what to do when a legal notice, a summons, an order, a regulatory communication or a lawyer's letter arrives. The advice Legal then gives on the matter is privileged and is held by the named matter team; this page is about the first hour and is open to everybody.\n\n" +
        "Do not reply. Not by email, not verbally, not to be helpful, and not to say that the matter is being looked into. Anything said or written in response can be produced later. A courteous acknowledgement of receipt to a process server is fine; a substantive response is not, whoever asks for one.\n\n" +
        "Record the arrival properly. Note the date and time of receipt, who received it, and how it arrived, and keep the envelope. Timelines in legal matters run from service, and the date of receipt is frequently the fact in dispute later.\n\n" +
        "Send it to Legal the same day. Scan the complete document including every annexure and send it to the Legal inbox with the account number where there is one. The original goes by internal despatch and is not kept at the branch.\n\n" +
        "Do not alter the file. Once a notice arrives, nothing on that account's file is amended, completed, backdated or tidied up. A gap in a file is a manageable problem; a gap that appears to have been filled after the notice arrived is a much worse one.\n\n" +
        "Stop recovery contact on that account. Where the notice relates to the account, tele-calling and field contact stop until Legal advises. This is done through the exclusion file so that it takes effect the same day.\n\n" +
        "Tell the customer nothing about the merits. If the customer or their lawyer contacts you, take a note and pass it to Legal. Do not concede anything, do not deny anything, do not offer a settlement, and do not explain Anvira's position.\n\n" +
        "Why Legal's advice is not circulated. The advice Legal gives on a live matter is protected only for as long as it stays within the people who need it to act. Forwarding it, summarising it in an update or quoting it in a committee paper can remove that protection and hand it to the other side. If you need to know where a matter stands in order to do your job, ask Legal for the position rather than for the opinion.",
    },

    /* ================= CHANNELS, PRODUCTS AND SERVICE ================= */
    {
      id: "CR-015", title: "Credit Product Note: Two-Wheeler and Consumer Durable Finance", cat: "credit", clearance: 1, scopes: ["credit", "product"],
      owner: "Head of Vehicle Finance", updated: "2026-04-18", rev: "6.2", system: "Policy Repository",
      tags: ["two-wheeler", "consumer durable", "documents", "checklist", "margin", "salaried", "dealer", "small ticket", "bureau"],
      body:
        "Small ticket finance for two-wheelers and consumer durables, written by Anvira Finserv Limited and sourced principally at dealer counters. High volume, thin file, and the documentation checklist is therefore fixed rather than a matter of judgement at the counter.\n\n" +
        "Two-wheeler eligibility. Applicants aged 21 to 60 at maturity. Salaried applicants with six months in the current job, or self-employed with two years of business vintage. Minimum net monthly income 12,000 rupees. A valid driving licence for the class of vehicle is required before disbursal and is not a post disbursement item.\n\n" +
        "Two-wheeler document checklist. This is the complete list and nothing further is required at login. One officially valid identity document. One address proof, which may be the same document where it carries the current address. A recent photograph. For salaried applicants: the latest two salary slips and three months of bank statement showing salary credit. For self-employed applicants: six months of bank statement and evidence of the business, being a registration, a licence or a tax registration. The driving licence. The proforma invoice from the dealer. The signed application and the mandate form. Where the applicant is not the registered owner-to-be, the file does not proceed.\n\n" +
        "Margin and tenor. Up to 85 per cent of the on-road price for salaried applicants and 80 per cent for self-employed. Tenor 12 to 48 months. Minimum own contribution is collected by the dealer and evidenced before disbursal.\n\n" +
        "Bureau. Score floor 680. Scores between 650 and 679 may be taken by the Credit Manager as a recorded deviation where the applicant is salaried, has no current overdue, and has at least one satisfactorily conducted facility. A score below 650, or any current overdue above 30 days, is a decline at the counter. A thin file with no score is assessed on banking and employment rather than declined for absence of a score.\n\n" +
        "Consumer durable finance. Assessed on the same identity and income basis with a shorter tenor of 6 to 24 months and a margin set by product category. The goods are hypothecated where the value warrants it, and the delivery challan and serial number are captured at disbursal.\n\n" +
        "Security. Hypothecation of the vehicle endorsed on the certificate of registration, and comprehensive insurance with Anvira as loss payee. The endorsement is tracked as a post disbursement item under the standard timeline, and two-wheeler cases are the largest count in that population.",
    },
    {
      id: "CM-009", title: "Credit Information Reporting and Bureau Policy", cat: "compliance", clearance: 1, scopes: ["compliance", "credit", "service", "ops"],
      owner: "Chief Compliance Officer", updated: "2026-05-11", rev: "4.3", system: "Bureau Gateway",
      tags: ["bureau", "CIBIL", "credit information", "score", "reporting", "correction", "dispute", "settled", "written off", "consent", "thin file"],
      body:
        "Anvira is a member of the credit information companies and both reports to them and draws from them. This policy covers both directions and the customer's rights in each.\n\n" +
        "Drawing a report. A credit information report is drawn only with the applicant's consent, recorded on the application, and only for the purpose of assessing that application or managing an existing facility. Drawing a report without a live purpose is a misuse of the membership.\n\n" +
        "Reading a score. A score is one input. It compresses a history into a number and it does not know why the history is what it is. A score at or a little below a product floor is a reason to look at the report, not a reason to decline without looking. What matters is the current position, the conduct on live facilities and the reason for any past adverse entry.\n\n" +
        "A score in the high six hundreds. Not an automatic decline on any product. It is below the floor on some products and within it on others, and the deviation matrix sets who may take it. What is examined is whether there is a current overdue, how many live unsecured facilities the applicant already holds, whether any account has been settled or written off, and whether the score is low because of adverse history or because the file is thin. A thin file with no adverse entry is a different proposition from a damaged file at the same score.\n\n" +
        "A settled or written-off entry. An account reported settled means the lender accepted less than the contracted dues. It is a deviation on every product and is not a decline by itself; the questions are how long ago, how large, and what has happened since. An account reported as written off and still outstanding is a decline. The entry is verified from the report itself rather than from the applicant's explanation of it.\n\n" +
        "Reporting. Anvira reports the position of every borrower monthly within the cycle prescribed. Accounts are reported accurately: current as current, overdue with the correct days past due, settled as settled, and written off as written off. Reporting a settled account as closed, or delaying an adverse report, is a misreport and is corrected on discovery.\n\n" +
        "Corrections and disputes. A customer may dispute an entry with Anvira or with the credit information company. Anvira investigates from its own records, responds within the period prescribed, and where the entry is wrong, corrects it with the company and confirms the correction to the customer in writing. A correction is not conditional on the customer paying anything.\n\n" +
        "Telling the customer. Where an application is declined wholly or substantially because of the credit information report, the customer is told so and told how to obtain their own report. A customer is never told their score by an employee reading it off a screen, and never told that Anvira can improve it.",
    },
    {
      id: "CH-001", title: "Dealer Channel Handbook", cat: "product", clearance: 1, scopes: ["product", "ops"],
      owner: "Head of Vehicle Finance", updated: "2026-06-05", rev: "5.0", system: "Loan Origination",
      tags: ["dealer", "channel", "delivery", "release", "fleet", "company owned", "escalation", "contact", "payout", "documents"],
      body:
        "This handbook is for staff at dealer counters who originate Anvira finance. It covers what to collect, what has to be complete before a vehicle leaves the floor, and who to contact when something is stuck.\n\n" +
        "Before delivery. A vehicle is not delivered against a sanction alone. Delivery may take place only when the sanction is in force, the loan agreement and security documents are executed by every applicant and guarantor, the margin has been received and evidenced, the repayment mandate is registered and confirmed active, insurance is in force with Anvira as loss payee, and the disbursal has been released by Anvira. A customer who wants to take delivery the same day can, provided all of these are complete the same day. Delivering against an expected disbursal is not permitted and the dealer carries the risk if it happens.\n\n" +
        "Fleet and company-owned vehicles. Where the buyer is a company, a partnership or a limited liability partnership, collect the constitution documents, the registration and tax registrations, the latest two years of financial statements, twelve months of banking for every operating account, the board or partners' resolution authorising the borrowing and naming the signatories, identity and address for every director or partner and for every guarantor, and evidence of the existing fleet with registration numbers. Personal guarantees are required from every partner, designated partner or director holding more than 20 per cent. A resolution that does not name the person who actually signs is the most common reason a fleet file is returned.\n\n" +
        "Margin on used commercial vehicles. Up to 75 per cent of assessed value for a vehicle up to five years old, and up to 65 per cent for one between five and eight years. Vehicles older than eight years at the end of the proposed tenor are not funded. Tippers and construction equipment carry a five percentage point lower ceiling in every segment because their resale market is narrower. New vehicles run at up to 90 per cent for a fleet operator and 80 per cent for a first time buyer. These are ceilings, not entitlements: the margin on a given case is set by credit and is not varied at the counter.\n\n" +
        "Subvention. Margin is per the product note and is not varied at the counter. Where a subvention scheme applies, the scheme circular governs, the borrower's contracted rate is the card rate, and the borrower's instalment does not change when the subvention period ends. Do not describe a subvention to a customer as a lower interest rate.\n\n" +
        "The first instalment date. Under the current used commercial vehicle scheme the first instalment falls on the 5th of the month following disbursal whatever the disbursal date, so a late-month delivery can have a first instalment only days later. Tell the customer the date and the amount before delivery, and confirm the mandate is active. Most first instalment failures on this product come from a customer who did not expect the debit that early.\n\n" +
        "Registration and hypothecation. File the registration application with the hypothecation form signed by Anvira, and send the certificate of registration bearing the endorsement to Anvira as soon as it is issued. Holding certificates at the counter is the largest single cause of outstanding post disbursement documents, and payout is withheld on the specific case until it is received.\n\n" +
        "When a file is stuck. Contact the Anvira dealer desk for the location with the application number. The desk responds within one working day with the specific item outstanding and who holds it. Escalation is to the Area Sales Manager for the territory, then to the regional vehicle finance head. Do not ask the customer to contact Anvira directly and do not tell the customer that Anvira has declined a file; declines are communicated by Anvira in writing.",
    },
    {
      id: "CH-002", title: "Channel Partner Handbook", cat: "product", clearance: 1, scopes: ["policy", "product", "ops"],
      owner: "Head of Distribution", updated: "2026-06-05", rev: "4.2", system: "Loan Origination",
      tags: ["DSA", "channel partner", "sourcing", "file login", "complete file", "payout", "clawback", "customer data", "conduct", "storage"],
      body:
        "This handbook is for direct sourcing agents and their staff. It sets out what a complete file is, how payout works, and the obligations that come with handling Anvira customers and their documents.\n\n" +
        "When a file is logged. A file is logged, and the turnaround clock starts, only when it is complete. Complete means: the application form filled and signed by every applicant; identity and address documents for every applicant and guarantor, legible and within validity; the income documents required for the assessment route being used, for the full period required; the processing fee instrument; the property or asset details with the supporting documents where the product is secured; and the mandate form signed. A file short of any of these is not logged, is returned the same day with the specific gap named, and does not count towards volume until it comes back complete.\n\n" +
        "One query, not several. Anvira raises queries once, listing every gap. If a second query arrives on a point that was visible at the first, raise it with the desk, because that is a failure on Anvira's side and it is measured.\n\n" +
        "What you may tell a customer. Product features, the documents required, the process and the indicative timeline. What you may not tell a customer: that a facility is approved, what rate they will get, what limit they will get, or when money will arrive. Those are Anvira's to communicate and only after sanction. A commitment made at sourcing that Anvira does not honour becomes a complaint against Anvira and a conduct finding against the channel.\n\n" +
        "Payout. Paid on disbursal against the agreed grid. Withheld on a specific case where a post disbursement document attributable to sourcing is outstanding, released when it is received. Clawed back in full where a facility is foreclosed within the period stated in the channel agreement, where a file is found to carry a document that was not genuine, or where the customer states they did not apply. Clawback for a non-genuine document applies whether or not the agency knew.\n\n" +
        "Customer data. Documents you collect belong to the customer and are held by you only to pass to Anvira. Send them to Anvira and do not retain copies beyond the period stated in the channel agreement. Do not store customer documents on personal devices or personal messaging accounts, do not share them with any other lender, and do not use a customer's details to source for anyone else. A customer's information obtained for an Anvira application is used for that application and nothing else.\n\n" +
        "Conduct. Your staff act in Anvira's name when they meet an Anvira customer, and what they do, Anvira has done. Every person you deploy is registered with Anvira before they source, carries identification, and is trained on the fair practices code. Anvira may require the removal of any person from Anvira work without giving a reason.\n\n" +
        "What ends an empanelment. A non-genuine document in a file. A customer who says they never applied. Collecting money from a customer in Anvira's name. Holding a customer's original documents. Sharing customer data. Misrepresenting a sanction. These end the relationship rather than attracting a warning.",
    },
    {
      id: "SV-001", title: "Customer Compensation Policy", cat: "service", clearance: 1, scopes: ["service", "policy", "ops"],
      owner: "Principal Nodal Officer", updated: "2026-05-08", rev: "2.5", system: "Customer Relationship",
      tags: ["compensation", "customer", "delay", "wrongful charge", "reversal", "proactive", "authority", "documents", "goodwill"],
      body:
        "Where Anvira's own failure has cost a customer money or has delayed something they were entitled to, compensation is paid. This policy sets out when, how much and who approves it. Compensation is a correction, not a favour, and the customer is not required to ask for it.\n\n" +
        "Paid without being asked. Reversal of any charge levied contrary to policy, with interest wrongly applied to it. Reversal of a dishonour charge where the dishonour was technical or arose at Anvira's end. Correction of a credit information misreport. Refund of an excess collected. These are identified and paid on discovery, including for the whole affected population where the cause was a template, a parameter or a policy interpretation rather than a one-off.\n\n" +
        "Delay compensation. Where original security documents are not returned within the period in the product note, or satisfaction of a charge is not filed within it, or pledged ornaments are not released within seven working days of closure, compensation accrues per day of delay at the rate in the pricing circular from the day after the period expires. The delay is measured from the customer's entitlement, not from when Anvira noticed.\n\n" +
        "Loss actually suffered. Where a customer has incurred a direct, evidenced financial loss because of an Anvira failure, including a charge levied by another institution, interest on a facility they had to take, or a fee they had to pay to correct something Anvira got wrong, the loss is reimbursed against evidence.\n\n" +
        "Inconvenience. Where a customer has suffered material inconvenience without a quantifiable loss, such as repeated visits to a branch to obtain something they were entitled to, or a wrongful recovery contact, a goodwill amount may be paid within the schedule in the annexure. It is recorded as compensation against the complaint and not as a discretionary waiver, so that the pattern remains visible.\n\n" +
        "Authority. The Grievance Redressal Officer may approve up to the amount in the annexure. Beyond that, the Principal Nodal Officer. For a population-wide remediation, the Chief Compliance Officer approves the remediation and the Chief Financial Officer records the provision. No compensation is approved by the function whose failure caused it.\n\n" +
        "What compensation is not. It is not a settlement of the complaint. Paying compensation does not close the complaint, does not require the customer to withdraw anything, and is never made conditional on the customer accepting the outcome or not escalating further. A payment offered on condition that the customer drops the matter is not compensation and is prohibited.\n\n" +
        "Recording. Every payment records the cause, the population affected, the amount and the remediation of the underlying cause. Compensation paid repeatedly for the same cause is escalated as a systemic issue whatever the individual amounts.",
    },

    /* ================= PARTNERSHIPS AND DIGITAL ================= */
    {
      id: "DG-001", title: "Co-Lending Policy", cat: "digital", clearance: 2, scopes: ["digital", "credit", "fincon", "compliance"],
      owner: "Head of Partnerships", updated: "2026-01-05", rev: "3.0", system: "Loan Management",
      tags: ["co-lending", "CLM", "retention", "escrow", "blended rate", "partner", "transfer", "reconciliation", "share", "customer interface"],
      body:
        "Anvira participates in co-lending arrangements under which Anvira and a partner bank each hold a share of the same loan to the same borrower on their own books. This policy governs those arrangements. It applies from 1 January 2026 to every arrangement entered into or renewed on or after that date.\n\n" +
        "Retention. Each participant retains a minimum of 10 per cent of every individual loan under the arrangement, on its own books, for the life of the loan. The floor applies loan by loan and continuously, not as an average across the portfolio and not only at origination. A share that falls below the floor at any point during the life of the loan is a breach of the arrangement.\n\n" +
        "How the floor is lost without anybody deciding to lose it. Where a part-prepayment is applied to one participant's share ahead of the other's, the proportions shift. Where the application rule in the operating agreement is not implemented in the same way in both participants' systems, the two records of the same loan diverge and one of them will show a share below the floor. The application rule is therefore configured, tested and reconciled rather than assumed, and the retention position is tested at every reconciliation rather than at origination alone.\n\n" +
        "Transfer timing. The partner's share of a loan originated by Anvira is transferred within 15 calendar days of the loan being disbursed. A loan not transferred within that period is retained wholly by Anvira and is not transferred later under the arrangement.\n\n" +
        "Blended rate. The borrower is charged a single blended rate computed from each participant's share and each participant's rate, and that rate is what appears in the key facts statement, the sanction letter and the agreement. Where shares change during the life of the loan, the blended rate is recomputed only where the agreement provides for it, and any change is communicated to the borrower before it takes effect. A blended rate disclosed at sanction that no longer matches the arrangement is a disclosure failure regardless of whether the borrower is paying more or less.\n\n" +
        "Escrow. All flows between the participants, and all borrower collections under the arrangement, pass through the joint escrow operated under the agreement. Money does not move between participants outside it. The escrow is reconciled daily and the balance is confirmed by both participants monthly.\n\n" +
        "Single customer interface. The borrower deals with one participant for service, grievance and recovery, named in the agreement and disclosed to the borrower. A borrower is never passed between the two, and a grievance is not deflected on the ground that the other participant holds the majority share.\n\n" +
        "Reconciliation. Loan-level reconciliation between the two systems at least monthly, covering outstanding, share, rate, collections, charges and classification. Breaks are aged and owned. Two institutions holding different records of the same loan is the recognised failure mode of this product, and reconciliation is the control that catches it before the borrower does.",
    },
    {
      id: "DG-002", title: "Co-Lending Partner Arrangements: Operating Summary", cat: "digital", clearance: 2, scopes: ["digital", "fincon", "ops", "credit"],
      owner: "Head of Partnerships", updated: "2026-06-28", rev: "2.4", system: "Loan Management",
      tags: ["co-lending", "partner", "arrangement", "share", "application rule", "reconciliation", "break", "escrow", "operating"],
      body:
        "This summary records the operating terms of each live co-lending arrangement and the reconciliation position. The executed agreements govern; this document exists so that operations, finance and reconciliation are working from the same understanding of what each arrangement actually requires.\n\n" +
        "Partner A, secured retail. Anvira 20 per cent, partner 80 per cent. Anvira originates, appraises to the jointly agreed credit policy, and services. Part-prepayments are applied pro rata to both shares. Escrow settlement weekly. Reconciliation monthly, currently clean.\n\n" +
        "Partner B, business loans. Anvira 20 per cent, partner 80 per cent. Anvira originates and services. The operating agreement provides that part-prepayments are applied pro rata. The application rule as configured in Anvira's loan management system applies a part-prepayment to Anvira's share first and reduces the partner's share only when Anvira's share is exhausted, which is not what the agreement provides. On accounts that have taken part-prepayments, Anvira's retained share therefore falls faster than the partner's, and on a number of accounts it has fallen below the 10 per cent floor. The blended rate on those accounts no longer corresponds to the actual shares. This was identified at the May reconciliation, the population is being sized, and the configuration change is with technology.\n\n" +
        "Partner C, vehicle finance. Anvira 25 per cent, partner 75 per cent. Partner originates, Anvira services and collects. Escrow settlement fortnightly. Reconciliation monthly, two aged breaks relating to charges applied by Anvira that the partner has not recognised.\n\n" +
        "Partner D, affordable housing through the housing finance subsidiary. Subsidiary 20 per cent, partner 80 per cent. Reconciliation monthly, clean.\n\n" +
        "What the reconciliation covers. Loan-level outstanding on both books, each participant's share in amount and percentage, the rate on each share and the blended rate disclosed to the borrower, collections and their split, charges levied and recognised, and classification status on both books. A loan classified differently by the two participants is reported immediately rather than at the next cycle.\n\n" +
        "Break handling. Breaks are aged from the reconciliation date on which they first appeared, with a cause and an owner. A break older than 30 days is escalated to the Head of Partnerships and the partner's counterpart jointly. A break arising from a difference in how the two systems apply a rule is escalated immediately regardless of value, because the value grows with every subsequent transaction and the population is larger than the break that surfaced.",
    },
    {
      id: "DG-003", title: "Digital Lending, Partners and Applications", cat: "digital", clearance: 2, scopes: ["digital", "compliance", "product", "ops"],
      owner: "Chief Compliance Officer", updated: "2026-05-30", rev: "4.1", system: "Policy Repository",
      tags: ["digital lending", "LSP", "DLA", "disclosure", "consent", "data", "disbursal", "loss guarantee", "register", "oversight"],
      body:
        "This policy governs lending through digital channels and through lending service providers and digital lending applications acting for Anvira. The obligations sit on Anvira as the regulated entity; engaging a partner does not move them.\n\n" +
        "Register of applications. Every digital lending application through which Anvira lends is recorded on the register, reported as required, and published on Anvira's website. An application not on the published register is not authorised to source for Anvira, and lending through one that is not on the register is a breach whatever the commercial arrangement says.\n\n" +
        "What the journey must show, and when. Before the borrower commits: the name of the regulated entity lending the money, prominently and not only in a footer; the loan amount, tenor and instalment; the annual percentage rate; the fees and charges itemised; the key facts statement, in full, as a document the borrower can retain; the cooling-off period and what it permits; the grievance route with the name and contact of the officer; and, where an application presents offers from more than one lender, the same details for each so the borrower can compare. The sequence is fixed. Presenting the key facts statement after acceptance, or making it available only on request, does not meet the requirement however clearly the terms appear elsewhere.\n\n" +
        "Consent. Separate, explicit and recorded for the credit assessment, for each category of data accessed, and for any optional product. Never bundled into a single acceptance and never obtained by a pre-ticked box. Consent may be withdrawn, and the journey provides the means to withdraw it.\n\n" +
        "Data. Only data needed for the assessment is collected. Access to a borrower's contacts, media, call logs or location for any purpose other than a stated and consented one is prohibited. Customer data is stored on servers located in India. A partner may process data on Anvira's behalf under the agreement; it does not hold it on its own account, may not use it for its own purposes or for any other lender, and returns or destroys it on termination with certification.\n\n" +
        "Flow of money. Disbursal is made directly from Anvira to the borrower's own bank account, and repayments flow directly from the borrower to Anvira. Neither passes through an account held by a partner or through any pool account. Any arrangement that routes borrower money through a partner is refused, whatever operational convenience is offered.\n\n" +
        "Default loss guarantee. Where a partner provides a guarantee over a portfolio's defaults, the cover does not exceed 5 per cent of the total disbursed amount of that portfolio, is documented, is held only in the permitted forms, and is invoked within the period stated in the framework. The existence of a guarantee does not relax the credit assessment; a facility that would not be sanctioned on its own merits is not sanctioned because it is covered.\n\n" +
        "Oversight. Each partner carries a due diligence file under the outsourcing policy, an annual review, periodic testing of the live journey against this policy as a customer experiences it, and a review of its complaint handling. Testing the journey against the partner's documentation rather than against the live application is not oversight.",
    },

    /* ================= TREASURY, FUNDING AND CAPITAL ================= */
    {
      id: "TR-001", title: "Asset Liability Management Policy", cat: "treasury", clearance: 3, scopes: ["fincon", "risk", "compliance"],
      owner: "Chief Financial Officer", updated: "2026-04-24", rev: "6.1", system: "Treasury & ALM",
      tags: ["ALM", "maturity gap", "bucket", "liquidity", "ALCO", "mismatch", "behavioural", "interest rate risk", "tolerance"],
      body:
        "This policy governs the management of maturity and interest rate mismatch between Anvira's assets and its borrowings. It is owned by the asset liability committee, which meets monthly and on any event that moves the position materially.\n\n" +
        "Structural mismatch is the business. A lending company borrows shorter than it lends, and the whole discipline is keeping the mismatch inside limits that survive a market that closes. The policy therefore sets tolerances rather than seeking to eliminate the gap.\n\n" +
        "Maturity buckets. Cash flows are placed in the standard time buckets running from one to seven days out to over five years. The cumulative negative gap as a share of cumulative outflows may not exceed the tolerance set for each of the first four buckets, which are the ones that matter when funding tightens. Tolerances are in the board schedule and are limits of the risk appetite statement.\n\n" +
        "Behavioural assumptions. Contractual maturity is not always the right input. Prepayment behaviour on retail secured facilities, the roll-over of working capital lines, and the drawdown profile of sanctioned but undrawn wholesale commitments are modelled from observed behaviour and reviewed annually. Every behavioural assumption is documented, approved by the committee, and stress tested against its contractual position, because an assumption that has never been tested against contract is an opinion.\n\n" +
        "Liquidity buffer. A buffer of unencumbered high quality liquid assets is maintained to cover projected net outflows over a stressed 30 day horizon. The buffer is held in instruments that can be realised in a market that is not functioning normally, which excludes anything whose liquidity depends on the counterparty that is under stress.\n\n" +
        "Interest rate risk. The book carries floating rate assets funded partly by fixed rate borrowings and partly by floating. Sensitivity of net interest income to a parallel shift is computed monthly and reported to the committee, together with the effect on economic value. The repricing profile of assets and liabilities is reported by bucket rather than in aggregate, because an aggregate that nets a short-dated asset against a long-dated liability conceals the exposure.\n\n" +
        "Contingency funding plan. Names the triggers that indicate funding stress, the actions available at each stage, who authorises each, and the order in which they are used. Tested annually. The plan assumes that the cheapest sources close first and that a plan depending on drawing an undrawn line assumes the line is still there.\n\n" +
        "Reporting. The gap statement, the buffer position, the sensitivity analysis and every limit against its tolerance go to the committee monthly and to the board risk committee quarterly, with any breach reported when it occurs rather than at the next scheduled meeting.",
    },
    {
      id: "TR-002", title: "Borrowing Programme and Funding Concentration", cat: "treasury", clearance: 3, scopes: ["fincon", "risk"],
      owner: "Head of Treasury", updated: "2026-06-14", rev: "5.3", system: "Treasury & ALM",
      tags: ["borrowing", "funding", "concentration", "lender", "instrument", "NCD", "term loan", "refinancing", "covenant", "maturity wall"],
      body:
        "This document sets out how Anvira funds itself, the limits on where that funding comes from, and how refinancing risk is managed. Anvira is not a deposit taking company, so every rupee lent is borrowed and the borrowing book is as much a risk portfolio as the lending book.\n\n" +
        "Sources. Term loans from banks, non-convertible debentures placed with institutions, commercial paper, external commercial borrowing where permitted, refinance from the relevant institutions for eligible portfolios, securitisation and direct assignment, and subordinated debt counting towards capital.\n\n" +
        "Concentration limits. No single lender may account for more than the share of total borrowings stated in the board schedule. No single instrument type may exceed its stated share. No more than the stated share of borrowings may mature in any rolling three month window, which is the limit that prevents a maturity wall from forming quietly as individual facilities are added.\n\n" +
        "Why concentration matters more here than the rate. A lender that funds a fifth of the book has a view on Anvira's strategy whether or not it exercises it, and a refinancing that must happen on a date is negotiated from a weak position. Diversification is bought with basis points and is worth them.\n\n" +
        "Covenants on borrowings. Anvira's own borrowings carry covenants: capital adequacy, asset quality, exposure concentration, and in some facilities a restriction on further borrowing without consent. These are monitored on the same calendar as the covenants Anvira imposes on its wholesale borrowers, and a breach of a borrowing covenant is reported to the Chief Financial Officer and the audit committee immediately. A cross-default clause means a technical breach on one facility can accelerate several.\n\n" +
        "Refinancing. Facilities maturing within the next twelve months are tracked with the intended refinancing source and its status. A facility inside six months of maturity with no identified source is escalated to the asset liability committee. Refinancing is arranged before it is needed rather than when it is needed, because the terms available to a borrower who must refinance are not the terms available to one who need not.\n\n" +
        "Securitisation and assignment. Portfolio sales are a funding source and a capital tool, subject to the retention and seasoning requirements applicable to each structure. A pool is not assembled to remove a problem from the book: the selection criteria are documented, the pool is representative, and the retained exposure is recorded and provided for.\n\n" +
        "Reporting. The borrowing book by lender, instrument, maturity, rate and covenant status is reported to the asset liability committee monthly and to the board quarterly.",
    },
    {
      id: "TR-003", title: "Cost of Funds and Product Pricing Inputs", cat: "treasury", clearance: 3, scopes: ["fincon", "product", "risk"],
      owner: "Head of Treasury", updated: "2026-06-14", rev: "4.0", system: "Treasury & ALM",
      tags: ["cost of funds", "marginal", "weighted average", "benchmark", "spread", "transfer price", "margin", "NIM", "pricing", "floor"],
      body:
        "Treasury publishes the cost of funds inputs that set the floor under every product rate. This document defines those inputs, how they are computed, and how they are used, so that a pricing discussion is about margin rather than about whose number is right.\n\n" +
        "Two different numbers. The weighted average cost of funds is the cost of the existing borrowing book and is the correct input for measuring the margin actually earned on the existing asset book. The marginal cost of funds is the cost of the next rupee borrowed and is the correct input for pricing new business. Using the weighted average to price new business in a rising market prices the whole book below its replacement cost, and this is the single most common pricing error in the sector.\n\n" +
        "Published monthly. Treasury publishes the weighted average cost, the marginal cost, and the marginal cost by tenor bucket, on the first working day of each month, together with the benchmark lending rate for the month. The published figures are the only inputs used in pricing; a product team does not compute its own.\n\n" +
        "Transfer pricing. Each product is charged the marginal cost for the tenor bucket matching the behavioural maturity of that product, not the contractual maturity and not a single group average. A short-tenor unsecured product funded at the cost of five year money looks unprofitable and is not; a long-tenor secured product funded at the cost of three month money looks profitable and is carrying the mismatch on somebody else's page.\n\n" +
        "The floor. No facility is priced below the sum of the applicable marginal cost of funds and the credit cost for its risk band. Operating cost and margin sit above that floor and are where pricing decisions are actually made. A rate below the floor requires Chief Financial Officer approval recorded against the file, and is granted for a relationship reason rather than a competitive one.\n\n" +
        "Credit cost input. Supplied by Risk from the expected credit loss model by product and band, refreshed quarterly. Where realised credit cost in a product diverges from the priced credit cost by more than the stated tolerance for two consecutive quarters, pricing is reviewed rather than the divergence being carried.\n\n" +
        "Net interest margin. Reported by product as yield less transfer-priced cost of funds on average assets, monthly. Reporting margin against the group average cost of funds rather than the transfer price makes every short product look good and every long product look bad, and tells nobody anything about either.",
    },
    {
      id: "TR-004", title: "Capital Adequacy and Owned Funds", cat: "treasury", clearance: 3, scopes: ["fincon", "compliance", "risk"],
      owner: "Chief Financial Officer", updated: "2026-05-02", rev: "3.4", system: "Core Accounting",
      tags: ["capital", "CRAR", "owned funds", "tier 1", "tier 2", "risk weight", "headroom", "growth", "leverage", "subordinated debt"],
      body:
        "Anvira maintains capital against its risk weighted assets at not less than the level prescribed for its layer under the scale based framework, and at not less than the internal floor set by the board, which is above the prescribed level. Capital is the constraint on growth, and the internal floor exists so that the constraint binds before the regulatory one does.\n\n" +
        "Composition. Tier 1 capital comprises paid-up equity, free reserves and retained earnings, less the deductions prescribed. Tier 2 includes eligible subordinated debt subject to the applicable discount as it approaches maturity, general provisions within the permitted share of risk weighted assets, and other eligible instruments. Subordinated debt raised to support growth is amortising capital and is planned as such rather than treated as permanent.\n\n" +
        "Risk weights. Applied by asset class as prescribed. The weighted position is computed monthly and reconciled to the general ledger. Off balance sheet exposures, including sanctioned but undrawn commitments and the retained exposure in assigned pools, carry their applicable conversion and are not omitted because they are not funded.\n\n" +
        "Headroom, honestly stated. Growth headroom is the capital available above the internal floor divided by the marginal risk weight of the growth being planned, and it is stated in disbursal capacity rather than as a ratio. A ratio comfortably above the requirement can still support only a quarter of planned growth, and the plan is tested against the capital rather than the capital being read as adequate because the ratio looks healthy.\n\n" +
        "Internal capital assessment. An annual assessment of capital against the full risk profile, including risks not captured in the prescribed risk weights: concentration, interest rate risk in the banking book, operational and conduct risk, and the risk in the co-lending and assignment arrangements. The assessment drives the internal floor.\n\n" +
        "Stress. Capital is projected under stressed scenarios covering a rise in credit cost, a fall in disbursal volume, a rise in cost of funds and a combination of all three. The projection identifies the point at which the internal floor is breached and the actions available before it is.\n\n" +
        "Reporting. Position, headroom, projection and the plan for any capital raise go to the board quarterly. Any movement that takes the ratio within the stated distance of the internal floor is reported when it occurs.",
    },
    {
      id: "TR-005", title: "Direct Assignment and Securitisation", cat: "treasury", clearance: 3, scopes: ["fincon", "credit", "compliance", "risk"],
      owner: "Head of Treasury", updated: "2026-03-17", rev: "3.1", system: "Treasury & ALM",
      tags: ["direct assignment", "securitisation", "pool", "MRR", "minimum holding period", "seasoning", "servicing", "true sale", "retained", "selection"],
      body:
        "Anvira transfers portfolios by direct assignment and through securitisation structures, as a funding source and as a capital management tool. This document governs pool selection, retention, servicing and the accounting consequence.\n\n" +
        "Seasoning and holding period. Loans are transferred only after they have completed the minimum holding period applicable to their tenor and structure. A loan transferred before it is seasoned has not demonstrated anything about its behaviour, and the requirement exists precisely to prevent origination for immediate sale.\n\n" +
        "Retention. Anvira retains the minimum share required for the structure, in the form required, for the period required. The retained exposure is recorded, risk weighted and provided for on the same basis as an on-book exposure of the same quality. Retained exposure treated as off balance sheet because the pool has been sold is the way this product goes wrong.\n\n" +
        "Pool selection. Criteria are documented before the pool is drawn and are applied mechanically. The pool is representative of the portfolio from which it is drawn on delinquency, vintage, geography, ticket and product. A pool is never assembled by excluding accounts a servicer expects to deteriorate; that is adverse selection, it is visible in the performance within two quarters, and it ends the relationship with the buyer.\n\n" +
        "Representations. Anvira represents the accuracy of the loan data, the validity of the documentation and the security, and compliance with its own credit policy at origination. A representation that turns out to be wrong triggers a repurchase obligation, so the data supplied is verified against the loan files on a sample before the pool is offered rather than extracted and sent.\n\n" +
        "Servicing. Anvira continues to service assigned loans. The borrower's experience does not change, the borrower is informed of the assignment as required, and collections are held in trust for the buyer and remitted on the agreed cycle. Servicing an assigned loan to a lower standard than an on-book loan is a breach of the servicing agreement and is visible in the comparative collection efficiency, which the buyer monitors.\n\n" +
        "Accounting and disclosure. Transfers are assessed against the de-recognition criteria and accounted accordingly; a transfer that does not meet them stays on the balance sheet whatever the legal form. The retained exposure, the servicing obligation and any credit enhancement provided are disclosed.\n\n" +
        "Monitoring. Pool performance against the projections made at sale is tracked monthly and reported to the asset liability committee. A pool underperforming its projection is examined for selection and servicing before the market is told it was the economy.",
    },

    /* ================= LEGAL AND ENFORCEMENT ================= */
    {
      id: "LG-002", title: "Legal Recovery Framework", cat: "legal", clearance: 2, scopes: ["legal", "collect"],
      owner: "Head of Legal", updated: "2026-04-11", rev: "5.0", system: "Collections & Recovery",
      tags: ["legal recovery", "escalation", "route", "cost benefit", "advocate", "panel", "case management", "limitation", "decision"],
      body:
        "This framework governs the movement of an account from ordinary collections into legal recovery, the routes available, and how a route is chosen. Legal recovery is expensive and slow, and the decision to use it is a commercial one taken on evidence rather than a default when collections has run out of ideas.\n\n" +
        "When an account moves to legal. Where the arrears exceed the threshold in the collections policy and ordinary recovery has been exhausted; where the borrower is untraceable and the security must be preserved; where the borrower has disputed the debt in a manner requiring adjudication; where a limitation period is approaching; or where a third party has taken a step that requires Anvira to respond. The Area Collections Manager recommends and the Legal and Recovery Officer decides.\n\n" +
        "Routes available. Enforcement of a security interest where the exposure and the security qualify. Proceedings on a dishonoured instrument. Arbitration where the agreement provides for it. A suit for recovery. Proceedings before the appropriate tribunal where the exposure crosses its threshold. Insolvency proceedings against a corporate borrower. Each carries a different cost, timeline and evidentiary requirement, and the file is assessed against all of them rather than defaulting to the one used last time.\n\n" +
        "Cost and benefit. Before a route is chosen, the realistic recovery, the cost of the route including counsel and court fees, the likely timeline, and the strength of the documentation are recorded. Where the cost approaches the recovery, the account is a candidate for settlement or write-off rather than for proceedings, and pursuing it anyway to demonstrate seriousness is not a reason this framework recognises.\n\n" +
        "Documentation is the constraint. Every route depends on documents that had to be correct years earlier: the executed agreement, correct stamping, the security documents, the registration, and the notices served. A defect discovered at this stage generally cannot be cured, which is why the documentation and execution standards matter far more than they appear to at origination.\n\n" +
        "Panel advocates. Proceedings are conducted through empanelled advocates allocated by territory and matter type. Every matter has a named advocate, a named Anvira officer, a case plan and a next date. An advocate holding a matter with no recorded next date is not managing it.\n\n" +
        "Case management. Every matter is on the register with its stage, next date, exposure, provision and the last action. The register is reviewed monthly by the Legal and Recovery Officer and quarterly by the Head of Legal. Matters where nothing has happened for two consecutive quarters are reviewed for withdrawal or settlement.\n\n" +
        "Conduct during proceedings. The conduct rules do not relax because a matter is in court. Contact with the borrower on the debt continues to follow the collections policy, and communication about the proceedings goes through the advocate.",
    },
    {
      id: "LG-003", title: "Enforcement of Security Interest", cat: "legal", clearance: 2, scopes: ["legal", "collect", "ops"],
      owner: "Head of Legal", updated: "2026-05-20", rev: "4.2", system: "Collections & Recovery",
      tags: ["SARFAESI", "enforcement", "security interest", "demand notice", "possession", "sale notice", "eligibility", "objection", "symbolic", "classification"],
      body:
        "This procedure governs enforcement of a security interest over immovable property without the intervention of a court, where the exposure and the security qualify. It is the principal recovery route on the loan against property and housing books.\n\n" +
        "Eligibility. The exposure must be secured by a validly created and registered security interest over property that is not excluded from enforcement, the account must be classified as non performing, and the outstanding must exceed the threshold prescribed. Agricultural land is excluded. A security interest that was never registered, or was registered late in a way that affects its standing, is examined by Legal before any step is taken.\n\n" +
        "Demand notice. A written demand notice is served on the borrower and every guarantor, stating the amount due, the security over which enforcement is proposed, and the period within which payment must be made, being not less than the period prescribed. Service is effected in the manner prescribed and the evidence of service is retained, because service is the fact most often disputed and the one most often poorly evidenced.\n\n" +
        "Objection by the borrower. Where the borrower makes a representation or raises an objection within the notice period, Anvira considers it and communicates the reasons for accepting or rejecting it within the period prescribed. This is not a formality: a reasoned reply issued on time protects the enforcement, and a failure to reply is the most common ground on which an enforcement is set aside.\n\n" +
        "Possession. Where the notice period expires without payment, possession may be taken, symbolic or physical, in the manner prescribed and with the assistance of the authorities where required. An inventory is prepared and the property is secured and insured from the date of possession.\n\n" +
        "Valuation and sale notice. An independent valuation is obtained and the reserve price fixed from it. Notice of sale is given to the borrower and every guarantor, stating the date, the manner of sale and the reserve, with the period prescribed. Sale before that period expires is void, and shortening it because a buyer is waiting is not available.\n\n" +
        "Redemption. The borrower may redeem the security at any time before the sale is concluded by paying the amount due together with costs. A redemption tender received before conclusion is accepted and the sale does not proceed.\n\n" +
        "Application of proceeds and shortfall. Proceeds are applied to costs actually incurred and evidenced, then to the dues. The borrower is given a statement showing the sale price, each cost itemised, and the resulting surplus or shortfall. A surplus is returned within the period prescribed. A shortfall remains recoverable through the ordinary routes.\n\n" +
        "What stops an enforcement. A stay or an order from any forum. A pending representation not yet replied to. An unresolved grievance going to the arrears relied on. A defect in the security documents or in service. Each is checked before every step rather than once at the outset, because the position can change between the demand notice and the sale.",
    },
    {
      id: "LG-004", title: "Dishonoured Instrument Proceedings", cat: "legal", clearance: 2, scopes: ["legal", "collect", "ops"],
      owner: "Head of Legal", updated: "2026-02-05", rev: "4.4", system: "Collections & Recovery",
      tags: ["dishonour", "cheque", "notice", "limitation", "complaint", "30 days", "15 days", "instrument", "presentation", "evidence"],
      body:
        "This procedure governs proceedings on a dishonoured cheque or electronic mandate. The timelines are short, they are strict, and a missed step ends the remedy entirely, so the calendar is managed centrally rather than by the branch holding the account.\n\n" +
        "Presentation. The instrument must be presented within its validity. An instrument presented after it has expired produces no remedy however clear the dishonour, and re-presenting an expired instrument does not revive it.\n\n" +
        "The dishonour memo. Obtained from the bank stating the reason for dishonour. It is the foundation document and the original is retained. A memo showing a reason other than insufficiency of funds or an instruction to stop payment may not support proceedings, and Legal assesses it before a notice is issued.\n\n" +
        "Demand notice. A written notice demanding payment must be sent within 30 days of receiving the dishonour memo. The notice must state the amount, the instrument, the dishonour and the demand. The date of receipt of the memo is therefore recorded on the day it arrives, because the clock runs from it and it is frequently the fact in dispute.\n\n" +
        "The waiting period and the filing window. The drawer has 15 days from receipt of the notice to pay. Where payment is not made, the complaint must be filed within one month of the expiry of that 15 day period. Both periods are hard. A complaint filed outside the window is liable to be dismissed as time barred whatever the merits, and the borrower will still owe the money but the remedy is gone.\n\n" +
        "Service of the notice. Sent to the address recorded in the loan file by a mode that produces evidence of despatch and delivery. Where the notice is returned unclaimed, service is generally taken as effected on the date of return, and the file records the tracking evidence. Sending a notice to an address the borrower has told Anvira is no longer current is a defect Anvira created.\n\n" +
        "Evidence. The loan agreement, the instrument, the dishonour memo, the notice with proof of despatch and delivery, the statement of account, and the authorisation of the officer who will depose. The officer who deposes must have personal knowledge of the account, so the deponent is identified at the outset rather than when the matter is listed.\n\n" +
        "Central calendar. Every dishonour eligible for proceedings is entered on the legal calendar with the memo date, the notice due date, the expiry of the waiting period, and the filing deadline. The calendar is reviewed weekly. A deadline missed is reported to the Head of Legal with the reason, because the remedy is gone and the exposure has changed.\n\n" +
        "Settlement during proceedings. Where the borrower pays, the matter is withdrawn or compounded as the law permits, and the withdrawal is completed rather than left pending. An abandoned proceeding remains on the register and against the borrower's record.",
    },
    {
      id: "LG-005", title: "Arbitration and Conciliation", cat: "legal", clearance: 2, scopes: ["legal", "collect"],
      owner: "Head of Legal", updated: "2026-01-19", rev: "3.2", system: "Collections & Recovery",
      tags: ["arbitration", "conciliation", "arbitrator", "clause", "award", "execution", "notice", "settlement conference", "Lok Adalat", "neutral"],
      body:
        "Where the loan agreement provides for arbitration, disputes are referred to it. This procedure covers invocation, the conduct of the reference, the award and its execution, and the conciliation and settlement forums used alongside it.\n\n" +
        "Invoking. The arbitration clause is read before it is invoked: the seat, the governing rules, the mechanism for appointing the arbitrator and any pre-condition such as a notice period or a requirement to attempt conciliation first. Invoking without satisfying a pre-condition gives the borrower a ground to challenge everything that follows.\n\n" +
        "Appointment. The arbitrator is appointed by the mechanism the clause provides. Anvira does not appoint a person with any connection to Anvira, to the panel advocate conducting the matter, or to the borrower. An award from a proceeding where the appointment can be attacked is an award that will be attacked, and the challenge is heard long after the recovery was needed.\n\n" +
        "Conduct. The borrower is given proper notice of every hearing at the address on record and at any address they provide. Proceeding without evidence that the borrower was notified is the most common defect in this route. The record of the reference is maintained by the panel advocate and reviewed by the Legal and Recovery Officer at each stage.\n\n" +
        "The award and execution. The award is obtained, and execution is a separate proceeding requiring its own preparation. An award that is never executed has recovered nothing, and matters are frequently left at this point because the award feels like the conclusion. The register therefore tracks awards separately and shows the execution stage against each.\n\n" +
        "Conciliation and settlement conferences. Anvira participates in conciliation and in settlement forums, including organised settlement events, where an account is suitable. Suitability means the borrower is contactable, the dispute is about amount or capacity rather than liability, and Anvira is prepared to settle within a range approved in advance.\n\n" +
        "Preparing for a settlement conference. Before attending: the statement of account reconciled and current; the security position and its realisable value; the recovery already made; the settlement range approved by the authority under the settlement policy; and the officer attending must hold that authority or be able to reach the person who does during the conference. An officer attending without an approved range cannot settle, and the opportunity does not usually come round twice.\n\n" +
        "Recording the outcome. A settlement reached is reduced to writing at the forum, executed, and implemented through the settlement policy including the credit information reporting consequence, which is explained to the borrower at the conference rather than communicated afterwards.",
    },

    /* ================= WHOLESALE MONITORING ================= */
    {
      id: "WH-001", title: "Covenant Monitoring and Testing", cat: "wholesale", clearance: 3, scopes: ["wholesale", "credit", "risk", "legal"],
      owner: "Chief Risk Officer", updated: "2026-06-19", rev: "3.3", system: "Portfolio Analytics",
      tags: ["covenant", "testing", "financial covenant", "information covenant", "breach", "waiver", "calendar", "evidence", "monitoring", "cure"],
      body:
        "Every wholesale facility carries covenants, and a covenant that is not tested on time is not a covenant. This procedure governs the monitoring calendar, the testing, and what happens when a test is failed or missed.\n\n" +
        "The monitoring calendar. Each facility has a calendar drawn from the executed agreement at drawdown, naming every covenant, its test date, the evidence required, the person accountable for obtaining it and the person accountable for testing it. The calendar is built from the agreement rather than from the term sheet, because the two frequently differ and the agreement governs.\n\n" +
        "Financial covenants. Tested on the frequency the agreement states, from financial statements or a compliance certificate in the form the agreement requires. A certificate in a form other than the one prescribed is not evidence of compliance. Where the agreement requires audited statements, management accounts do not substitute unless the agreement says they may.\n\n" +
        "Information covenants. Periodic financial and operating information, delivered within the period the agreement allows. Late delivery is a breach in its own right and is recorded as one. Where information is habitually late from a borrower, that pattern is itself the early warning signal and is reported to the Chief Risk Officer whether or not the financial covenants are being met.\n\n" +
        "Security cover. Where the facility carries a security cover covenant, cover is computed at the frequency the agreement requires and at any time the Risk function calls a test. Promoter funding against listed holdings is tested on the closing price at each month end. Cover falling below the covenanted level triggers the top-up mechanism in the agreement, and the cure period runs from the date of the test, not from the date the relationship manager raised it.\n\n" +
        "A missed test. Where the evidence has not been received by the test date, the covenant is treated as breached unless the agreement expressly provides otherwise. Silence is not a cure and an assurance from the borrower that the position is sound is not evidence. Missed tests are reported as exceptions to the Chief Risk Officer within 15 days of the due date.\n\n" +
        "Breach handling. A breach is notified internally the day it is identified, assessed for whether it is technical or substantive, and reported to the Credit Committee. The rights available under the agreement are identified before any conversation with the borrower, because rights not reserved in that conversation may be lost.\n\n" +
        "Waivers. Only the Credit Committee may waive a covenant. A waiver is granted for a defined period against a defined remedy, is recorded with an expiry date, and is tracked to expiry on the same calendar. A waiver without an expiry has not been granted, and a facility carrying a rolling series of waivers is a facility whose covenant package no longer describes the risk and is re-documented rather than waived again.",
    },
    {
      id: "WH-002", title: "Real Estate Project Monitoring and Escrow", cat: "wholesale", clearance: 3, scopes: ["wholesale", "credit", "risk", "ops"],
      owner: "Head of Real Estate Finance", updated: "2026-05-23", rev: "4.0", system: "Portfolio Analytics",
      tags: ["real estate", "project", "escrow", "waterfall", "receivables", "leakage", "milestone", "drawdown", "site visit", "approvals"],
      body:
        "Real estate project exposures are monitored on construction progress, sales velocity and cash flow, and are secured on the project land, the receivables and the shares of the project entity. The escrow is the control that makes the security effective, and escrow leakage is the failure mode of the product.\n\n" +
        "Drawdown against milestones. Tranches are released against verified construction progress certified by the lender's independent engineer, against approvals obtained, and against the conditions precedent for that tranche. Releasing against a certificate from the borrower's own engineer, or against a milestone that has not been physically verified, removes the only mechanism ensuring the money went into the project.\n\n" +
        "The escrow and the waterfall. Every project receipt is routed to the designated escrow. The account bank operates it under an agreement recording the waterfall: statutory dues, project cost as certified, interest and fees, principal repayment, and only then release to the borrower. The waterfall is instructed to the account bank in writing at drawdown, and the instruction is reconfirmed annually.\n\n" +
        "Detecting leakage. Escrow receipts are reconciled monthly against sales recorded by the borrower and against the receivables register. A divergence means either that sales are being recorded that are not being collected, or that collections are being routed outside the escrow. Both are serious and neither is resolved by asking the borrower for an explanation and accepting it. Leakage is an event of default and is escalated to the Credit Committee on discovery rather than at the next monitoring cycle.\n\n" +
        "Site visits. Monthly by the relationship manager and quarterly by an officer independent of the relationship, with photographs and a note on progress against the certified position. A project reported as progressing that has no visible activity is identified by visiting it, and by nothing else.\n\n" +
        "Approvals and title. The approvals register is maintained and each approval is tracked to renewal. A lapsed approval stops sales and stops the escrow, and it is therefore monitored as closely as the financial covenants.\n\n" +
        "Sales velocity and inventory. Units sold, units unsold, the realisation against the price assumed at appraisal, and the inventory overhang. Where velocity falls materially below the appraisal assumption, the exposure is re-assessed against the revised cash flow rather than against the original projection.\n\n" +
        "What is reported. A monthly project note covering construction progress, escrow receipts against sales, drawdown against the sanctioned schedule, approvals status, and any covenant tested in the period, going to the Chief Risk Officer and quarterly to the Credit Committee.",
    },
    {
      id: "WH-003", title: "Promoter Funding: Cover, Margin Call and Invocation", cat: "wholesale", clearance: 3, scopes: ["wholesale", "capmkt", "credit", "risk"],
      owner: "Head of Capital Markets Lending", updated: "2026-06-18", rev: "3.0", system: "Portfolio Analytics",
      tags: ["promoter funding", "pledge", "cover", "margin call", "invocation", "listed", "encumbrance", "disclosure", "cure period", "liquidity"],
      body:
        "Promoter funding is lending against a promoter's holding in a listed company, secured by a pledge of those shares. The security is liquid, publicly priced and highly correlated with the borrower's own fortunes, which is the risk the covenant package exists to manage.\n\n" +
        "Cover. A minimum cover of 2.0 times the outstanding, tested on the closing price at each month end and at any time the Risk function calls a test. Cover is computed on the pledged shares only, valued at the closing price, with a discount applied to any holding whose recent traded volume would not permit orderly sale within the period assumed.\n\n" +
        "Why liquidity is part of the valuation. A pledge over shares that cannot be sold without moving the price is not worth its market value. The discount is set by Risk from traded volumes and impact cost and is reviewed monthly. A holding representing more than a stated number of days of average traded volume is discounted accordingly, and a holding in a security under a surveillance measure is valued at nil for cover purposes until the measure is lifted.\n\n" +
        "Margin call. Where cover falls below the covenanted level, a call is issued the same day naming the shortfall, the ways it may be cured and the cure deadline. Cure is by paying down the facility or pledging additional acceptable shares. The cure period is stated in the agreement and runs from the call, not from acknowledgement.\n\n" +
        "Invocation. Where cover is not restored within the cure period, the pledge is invoked and shares are sold to restore cover. Invocation is authorised by the Head of Capital Markets Lending with the Chief Risk Officer informed, and never by the relationship team. The sale is conducted to minimise market impact, in tranches where the holding warrants it.\n\n" +
        "Disclosure consequences. Creation, invocation and release of a pledge over the shares of a listed company carry disclosure obligations on the borrower and, in some circumstances, on Anvira. Every step is cleared with the Company Secretary before it is taken, and the timing is planned around the disclosure rather than the disclosure being handled afterwards.\n\n" +
        "Information held. Anvira may learn things about a listed borrower through this relationship that are not public. That information is confidential to the deal team, is price sensitive in relation to that borrower's securities, and is handled under the insider information framework. It is never used for any purpose other than the credit decision.\n\n" +
        "Concentration. Exposure to a single promoter group, and aggregate exposure to pledges over a single security across all borrowers, are limited under the risk appetite statement. Two facilities to different borrowers secured on the same security are one exposure for concentration purposes.",
    },

    /* ================= OPERATING RECORDS =================
       These are the records rather than the policies: performance notes,
       analysis, audit observations and complaint extracts. Each states only
       what it observed. The connections between them are not written down
       anywhere, which is the point. */
    {
      id: "OP-013", title: "Sponsor Bank Mandate Registration Performance, July 2026", cat: "ops", clearance: 1, scopes: ["ops", "collect"],
      owner: "Head of Payments Operations", updated: "2026-08-04", rev: "1.0", system: "Payments & Mandates",
      tags: ["mandate", "registration", "sponsor bank", "lead time", "T+1", "failure rate", "paper mandate", "UMRN", "performance", "dishonour", "bounce", "first instalment", "nagpur", "amravati"],
      body:
        "This note publishes actual mandate registration performance by sponsor bank for July 2026, as required by the mandate management procedure. The disbursal procedure assumes a standard registration lead time of one working day; these are the figures against which that assumption should be checked case by case.\n\n" +
        "Median registration time, electronic. Meridian Bank 1 working day. National Commerce Bank 1 working day. Pashchim Gramin Bank 2 working days. Sunfield Bank 3 working days, with the ninetieth percentile at 4.5 working days. Sunfield has been at or above 3 working days for five consecutive months and has advised that its mandate processing was moved to a consolidated hub in February 2026.\n\n" +
        "First attempt failure rate, electronic. Group average 6 per cent. Meridian 3 per cent. National Commerce 5 per cent. Sunfield 22 per cent, concentrated in the Nagpur and Amravati catchments. The dominant Sunfield rejection reasons are account title mismatch against the bank's own record and a signature image below the resolution the hub accepts. A rejected registration is resubmitted and the clock restarts, so a case that fails once at Sunfield is typically 6 to 8 working days to an active mandate.\n\n" +
        "Paper substitution. Paper mandate volume rose 41 per cent quarter on quarter, and 78 per cent of the increase is from four branches in the Nagpur and Amravati catchments. Those branches have advised the desk that they are routing cases for one dealer group to paper as a matter of course because the electronic registrations kept failing. Paper registration currently takes 9 to 11 working days end to end. The mandate procedure states that paper is used where the electronic route is unavailable for that bank, not as a fallback after a failure, and that a channel moved to paper has masked a problem rather than solved one.\n\n" +
        "What the desk is doing. The account title mismatch issue has been raised with Sunfield and a data cleanup of the affected customer records is under way. No change to the published lead time is expected before October.\n\n" +
        "How to use this note. Before releasing a disbursal, compare the interval between the disbursal date and the first instalment date against the median lead time for the customer's bank, and against the ninetieth percentile where the case is going to Sunfield or is being routed on paper. Where the lead time is longer than the interval, hold the disbursal or reset the first instalment date within what the product or scheme permits.",
    },
    {
      id: "RK-006", title: "Portfolio Analysis: First Instalment Default, Used Commercial Vehicle", cat: "risk", clearance: 3, scopes: ["risk", "credit", "collect"],
      owner: "Portfolio Risk", updated: "2026-08-06", rev: "1.0", system: "Portfolio Analytics",
      tags: ["first instalment", "FEMI", "default", "used CV", "west region", "score distribution", "return reason", "vintage", "spike", "analysis"],
      body:
        "This note examines the rise in first instalment default on used commercial vehicle finance in the West region over June and July 2026. It sets out what the data shows and does not offer a conclusion, because the conclusion is not available from the data held by this function alone.\n\n" +
        "The movement. First instalment default on used commercial vehicle cases in the West region rose from 3.1 per cent of cases disbursed in March 2026 to 11.4 per cent of cases disbursed in June 2026. The same measure for the used commercial vehicle book outside the West region moved from 2.9 to 3.4 per cent over the same period. New commercial vehicle finance in the West region was flat at 2.6 per cent.\n\n" +
        "Credit quality is unchanged. The bureau score distribution of cases disbursed in June is not materially different from March: mean 726 against 729, and the share below the product floor is 4 per cent in both months. Deviation rates are unchanged. The mix by borrower segment, ticket size, vehicle age and tenor is within normal variation. Field verification failure rates are flat. On every credit measure available to this function, the cases defaulting at the first instalment look like the cases that did not.\n\n" +
        "Return reason codes. This is the most striking figure in the data. Of the first instalment dishonours in the June cohort, 63 per cent carry a return reason indicating that the mandate was not registered or was not active at presentation, against 11 per cent in the March cohort. Insufficiency of funds accounts for 21 per cent of the June cohort against 74 per cent in March. The composition of the failure has changed, not only its size.\n\n" +
        "Timing. In the June cohort, the median interval between disbursal and the first instalment date is 12 days, against 38 days in the March cohort. The interval is shortest for cases disbursed in the final week of a month.\n\n" +
        "Concentration. 71 per cent of the affected cases originate from four branches in the Nagpur and Amravati catchments and from counters associated with one dealer group.\n\n" +
        "What this function cannot determine. Why the interval changed, what the mandate registration lead time is for the banks these customers use, and how these accounts were treated after the dishonour. Those sit with Products, Payments Operations and Collections respectively. This note has been circulated to all three and to the Chief Risk Officer.\n\n" +
        "What is not recommended. Tightening credit on this product or this region on the strength of these figures. Nothing in the credit data supports it, and a tightening applied to a cause that is not credit will reduce volume without reducing the default.",
    },
    {
      id: "SV-002", title: "Complaints Register Extract: Vehicle Finance, June to July 2026", cat: "service", clearance: 2, scopes: ["service", "collect", "compliance"],
      owner: "Grievance Redressal Officer", updated: "2026-08-08", rev: "1.0", system: "Customer Relationship",
      tags: ["complaints", "register", "extract", "vehicle finance", "field visit", "bounce charge", "root cause", "cluster", "west region", "conduct"],
      body:
        "This extract covers complaints received on vehicle finance products in June and July 2026, prepared for the quarterly conduct pack. It reports what was received and how it was classified. It does not investigate causes outside the grievance function.\n\n" +
        "Volume. 213 complaints on vehicle finance in the two months, against a two-month average of 96 for the preceding four months. 147 of the 213 relate to used commercial vehicle accounts, and 118 of those 147 originate from customers in the Nagpur and Amravati districts.\n\n" +
        "Dominant themes in the used commercial vehicle cluster. Sixty-one complaints allege that a field collections officer visited within days of the vehicle being delivered, in several cases before the customer was aware any instalment had fallen due. A recurring phrase in the customer's own words is that they were not told the instalment would be taken so soon after taking delivery. Thirty-four complaints allege that the debit was attempted when the customer had been told the mandate was not yet active. Twenty-nine complaints dispute a dishonour charge on the ground that the customer had funds and the debit never reached their bank. Twenty-three complaints concern the conduct of the field visit itself, of which nine allege that a person other than the borrower was spoken to.\n\n" +
        "Charge disputes across the vehicle book. Separately from the cluster above, 38 complaints in the two months dispute the amount of a penal charge on used commercial vehicle accounts. In 26 of these the customer refers to a demand letter or reminder they received and says the amount does not match what they were told at sanction. These have been classified under the root cause code for customer did not understand the charge, which is the code that has been applied to charge disputes on this product for the last several quarters.\n\n" +
        "Resolution. 168 of the 213 have been resolved within the committed timeline. Thirty-one dishonour charges have been reversed on the ground that the dishonour was not attributable to insufficiency of funds. Four cases have been escalated to the Principal Nodal Officer and one has been taken by the customer to the external forum.\n\n" +
        "Observation for the conduct pack. The used commercial vehicle cluster is concentrated in two districts, in one product, over two months, and both the volume and the concentration are outside anything seen in the preceding four months. The grievance function has resolved the individual cases and has not established what produced them, which requires information held by Operations, Products and Collections.",
    },
    {
      id: "AU-001", title: "Internal Audit Report: Document Control and Template Management", cat: "audit", clearance: 2, scopes: ["compliance", "policy", "risk"],
      owner: "Head of Internal Audit", updated: "2025-12-11", rev: "1.0", system: "Policy Repository",
      tags: ["internal audit", "observation", "template", "document control", "inventory", "low rated", "closed", "assurance", "ATR", "scope"],
      body:
        "Thematic review of document control and the management of customer-facing templates across Anvira Finserv Limited, conducted November 2025 and reported December 2025.\n\n" +
        "Scope. The policy repository, the template library maintained by Customer Experience, and the configuration of customer-facing templates in the loan management system. Testing covered 40 templates against their parent policies and the reissue evidence for the six policy revisions issued in the preceding twelve months. Templates configured in the collections system and in the communication platform were outside scope for this review, on the basis that the template library was understood to be the single inventory.\n\n" +
        "Observation 1, rated medium. Reissue evidence for two of the six policy revisions consisted of an email confirming the change had been requested rather than a configuration record evidencing it had been made. Management action: evidence standard tightened. Closed May 2026 on verification.\n\n" +
        "Observation 2, rated low. A complete inventory linking every customer-facing template to its parent policy does not exist. The template library maintained by Customer Experience is comprehensive for the products it covers but is not established as the sole inventory, and templates may exist in systems outside it without being recorded. No instance of a template carrying incorrect content was identified in the sample tested.\n\n" +
        "Rating rationale for observation 2. Rated low on the basis that no incorrect template was found in testing, that the products carrying the largest volumes were within the library, and that management confirmed a review of template holdings had been carried out during the period.\n\n" +
        "Management response to observation 2. Management accepted the observation and advised that a review of template holdings across systems had been completed during the period and that a consolidated inventory would be established as part of the customer experience technology roadmap. No date was recorded against the inventory.\n\n" +
        "Closure. Observation 2 was closed in February 2026 on the basis of management's confirmation that the review had been carried out. No re-testing was performed, and no evidence of the review or of the resulting inventory was obtained, the observation having been rated low.\n\n" +
        "Note for the next cycle. The audit charter provides that low-rated findings touching document control, template management, customer disclosure or delegation are reviewed annually as a group, on the basis that these are the findings most often closed on an assurance rather than on a fix. Observation 2 falls into that group and is carried forward to the next annual review of closed low-rated findings.",
    },
    {
      id: "SV-003", title: "Complaint Root Cause Analysis, Rolling Four Quarters", cat: "service", clearance: 2, scopes: ["service", "compliance", "risk"],
      owner: "Principal Nodal Officer", updated: "2026-07-16", rev: "1.0", system: "Customer Relationship",
      tags: ["root cause", "analysis", "complaints", "classification", "charge", "coding", "systemic", "trend", "product", "taxonomy"],
      body:
        "This analysis covers complaints closed in the four quarters to June 2026 across all products and both subsidiaries, classified against the root cause taxonomy. It is prepared for the board committee and for the Chief Compliance Officer.\n\n" +
        "Volume and distribution. 4,187 complaints closed in the period. By product: vehicle finance 34 per cent, personal and business loans 26 per cent, loan against property 17 per cent, gold 12 per cent, microfinance 7 per cent, capital markets 4 per cent.\n\n" +
        "Root cause distribution. Recovery conduct 22 per cent. Charges disputed 21 per cent. Turnaround and delay 16 per cent. Document return and no-objection certificate 13 per cent. Statement and account information 9 per cent. Mis-selling of an optional product 6 per cent. Credit information reporting 5 per cent. Other 8 per cent.\n\n" +
        "Charges disputed, examined. This is the second largest category and it is concentrated: 47 per cent of charge complaints across the group arise on used commercial vehicle accounts, which represent 9 per cent of live accounts. Within that concentration, the dominant sub-code is customer did not understand the charge, applied to 71 per cent of used commercial vehicle charge complaints.\n\n" +
        "A limitation of the classification. The sub-code customer did not understand the charge is applied where the customer's stated grievance is that the amount was not what they expected. It is applied on the customer's description of the problem rather than on any verification of what the customer was actually told or sent. Where a customer says the amount does not match what they were told, the classification records that the customer did not understand it, and does not record whether what they were sent was correct. The taxonomy has no code for a charge communicated incorrectly, and the closure process does not require the communication the customer received to be retrieved and checked against the policy in force.\n\n" +
        "Consequence for this analysis. A charge complaint arising from an incorrect communication and one arising from a customer's misreading are recorded identically, and are therefore indistinguishable in this report and in every report drawn from it. The concentration in one product is visible; whether it is a communication problem or a comprehension problem is not, and cannot be determined from the classification.\n\n" +
        "Recommendation. That the taxonomy be extended to distinguish a charge communicated incorrectly from a charge not understood, and that closure of a charge complaint require the actual communication sent to the customer to be retrieved and compared against the policy in force on the date it was sent. Referred to the Chief Compliance Officer for the compliance testing programme.\n\n" +
        "Systemic escalations in the period. Nine root causes exceeded the systemic threshold and were escalated. Charges disputed on used commercial vehicle accounts was not among them, having been treated as a comprehension issue distributed across many customers rather than as a single cause.",
    },
    {
      id: "AU-002", title: "Internal Audit Report: Branch Operations Thematic Review", cat: "audit", clearance: 2, scopes: ["compliance", "ops", "gold", "risk"],
      owner: "Head of Internal Audit", updated: "2026-06-26", rev: "1.0", system: "Policy Repository",
      tags: ["internal audit", "branch", "thematic", "cash", "vault", "PDD", "surprise check", "finding", "repeat", "rating"],
      body:
        "Thematic review of branch operations across 46 branches in four regions, conducted April and May 2026.\n\n" +
        "Observation 1, rated high. In 11 of 46 branches, pledged ornament holdings exceeded the branch's approved value limit on at least one day in the period tested, in three cases for more than a week. In each instance the branch continued to accept fresh pledges. The limit is set against the insurance cover in force, so holdings above it are uninsured. Management action agreed: system block on fresh pledges above the limit, with an override available only to Central Operations. Target October 2026.\n\n" +
        "Observation 2, rated high. Post disbursement documents outstanding beyond 120 days stood at 4.8 per cent of the secured book by count at the time of testing, against the internal limit of 3.0 per cent. The concentration is in vehicle finance and specifically in certificates of registration bearing the endorsement of hypothecation. In 62 per cent of the aged cases tested, the certificate had been issued by the transport authority and was held by the dealer rather than being untraceable. Management action agreed: dealer-level ageing published weekly and payout withheld case by case. Target September 2026.\n\n" +
        "Observation 3, rated medium. Surprise verification of cash, ornaments and security document stationery was performed at the required monthly frequency in 29 of 46 branches. In 9 branches no surprise verification was recorded in the three months tested. Where verification was performed, the record in 14 branches did not state what was counted.\n\n" +
        "Observation 4, rated medium. Display of the schedule of charges, the fair practices code and the grievance route was complete in 38 of 46 branches. In 8 branches one or more displays were absent, out of date, or in English only. In 3 of those the displayed schedule of charges was a superseded version.\n\n" +
        "Observation 5, rated low. Repeat of a finding first raised in the June 2024 branch review. Movement registers for original security documents were incomplete in 12 branches, with removals recorded without a return date or without the authorising officer. The 2024 finding was closed in November 2024 on management's confirmation that registers had been reissued in the standard format. Re-testing was not performed at closure. Rating escalated to medium on repeat as required by the audit charter.\n\n" +
        "General observation. Three of the five findings above concern a control that is performed but not evidenced, rather than a control that is absent. The distinction matters for remediation: a reminder does not fix an evidence problem, and each of these actions therefore requires a change to the record rather than a communication to the branches.",
    },
    {
      id: "RK-007", title: "Management Information Definitions", cat: "risk", clearance: 2, scopes: ["risk", "fincon", "collect", "credit"],
      owner: "Chief Risk Officer", updated: "2026-02-19", rev: "3.0", system: "Portfolio Analytics",
      tags: ["MIS", "definition", "collection efficiency", "delinquency", "vintage", "denominator", "measure", "consistency", "comparability"],
      body:
        "Every measure reported inside Anvira is defined here. A measure reported without reference to this document is not comparable with anything, and most disagreements about the numbers turn out to be disagreements about the definitions.\n\n" +
        "Collection efficiency. Amounts collected in the period against amounts billed in the period, expressed as a percentage. Current collection efficiency counts only collections against instalments billed in the same period. Total collection efficiency includes collections against arrears billed in earlier periods and against written-off accounts. The two differ materially and are always labelled. Reporting total efficiency without the label is the most common way a deteriorating book is made to look stable.\n\n" +
        "Why efficiency and delinquency can move in opposite directions. Efficiency measures a flow against the current billing; delinquency measures a stock accumulated over time. In a book growing quickly, the denominator of efficiency is dominated by fresh accounts that are all current, so efficiency can hold while the older cohorts deteriorate underneath it. Any comparison of the two is therefore made cohort by cohort, and a divergence is decomposed before it is explained.\n\n" +
        "Delinquency. Accounts with any amount overdue, by days past due band, as a percentage of live accounts by count and of principal outstanding by value. Count and value are always reported together, because a book with small delinquent tickets and one with large ones look identical on count.\n\n" +
        "Vintage delinquency. The share of a disbursal cohort delinquent at a fixed number of months on the book, measured from the disbursal month. The only measure that isolates a change in quality from a change in volume, and the first one read when anything moves.\n\n" +
        "First instalment default. A case where the first scheduled instalment is not collected on its due date, expressed as a share of cases disbursed in the cohort month. Measured on the first presentation and not on any re-presentation. This measure is sensitive to the instalment calendar and to mandate registration as well as to borrower quality, so it is reported alongside the median interval between disbursal and first instalment and the dishonour return reason distribution. A movement in first instalment default is not attributed to credit quality until both of those have been examined.\n\n" +
        "Return reason distribution. Dishonours split by reason code, grouped as insufficiency of funds, mandate not registered or inactive, mandate cancelled, technical, and other. The mandate and technical groups are not borrower defaults and are excluded from behavioural scoring and from collections allocation.\n\n" +
        "Roll and flow rates. The share of a bucket at the start of a period that has moved forward, backward or resolved by the end. Reported on opening balances, never on closing.\n\n" +
        "Denominators. Every measure states its denominator on the report. A percentage without a denominator is not a measure.",
    },

    /* ================= SERVICE, PEOPLE AND CAPITAL MARKETS OPERATIONS ================= */
    {
      id: "SV-004", title: "Complaint Handling Procedure", cat: "service", clearance: 1, scopes: ["service", "ops", "collect"],
      owner: "Grievance Redressal Officer", updated: "2026-05-08", rev: "4.0", system: "Customer Relationship",
      tags: ["complaint", "logging", "classification", "investigation", "response", "closure", "escalation", "reference", "timeline", "evidence"],
      body:
        "This procedure covers what happens from the moment a customer expresses dissatisfaction to the moment the complaint is closed. The policy sets the entitlements; this document is how the work is done.\n\n" +
        "When it is a complaint. Any expression of dissatisfaction about a product, a service, a charge, a person or a process, however it arrives and however it is worded, is a complaint. A customer does not have to use the word, does not have to write, and does not have to ask for it to be treated as one. A request for information is not a complaint; a request for information that the customer has already made once and not received is.\n\n" +
        "Logging. Logged the same day with a unique reference, the channel, the date of first receipt anywhere in Anvira, the customer's own words, and the account. The reference is given to the customer at once. The 30 day clock runs from first receipt, not from the date the complaint reached the officer who will answer it, and a complaint forwarded internally does not restart it.\n\n" +
        "Classification. Provisionally at logging, and finally at closure by the officer who investigated. The final classification is the one that feeds the root cause reporting, so it is made on what the investigation found rather than on how the customer described the problem.\n\n" +
        "Investigation. Establish what actually happened from the records: the account, the transaction, the communication actually sent to the customer, the call recording where there is one, the field visit log, and the system entries with their timestamps. Where the complaint concerns something the customer was told or sent, retrieve the actual communication and compare it against the policy in force on the date it was sent. Where it concerns conduct, obtain the recording or the log before speaking to the person complained of.\n\n" +
        "Independence. A complaint about a person, a branch or a function is not investigated by that person, that branch or that function. Complaints alleging misconduct in recovery are investigated by the grievance function independently of the collections line.\n\n" +
        "The response. In writing, in the language the customer used, stating what was found, what is being done, and what the customer may do if they remain dissatisfied, including the external forum with its address. A response that states the outcome without stating what was found does not close the matter and usually produces a second complaint.\n\n" +
        "Where the customer is right. Correct it, pay any compensation due under the compensation policy without the customer having to ask, and check whether other customers are affected by the same cause. That last step is the one most often skipped and the one that matters most.\n\n" +
        "Closure. A complaint is closed when the response has been issued and received. A complaint closed in the system without a response having gone out is reopened on discovery and reported as a process failure.",
    },
    {
      id: "HR-001", title: "Employee Conduct and Discipline", cat: "people", clearance: 1, scopes: ["people", "policy"],
      owner: "Head of Human Resources", updated: "2026-01-14", rev: "5.0", system: "Policy Repository",
      tags: ["conduct", "discipline", "misconduct", "integrity", "customer money", "confidentiality", "reporting", "investigation", "dismissal"],
      body:
        "This code applies to every employee of Anvira and both subsidiaries. It sets out the standard expected and what happens when it is not met.\n\n" +
        "Integrity in handling money. Money received from a customer is receipted at the moment it is received and remitted within the time the procedure allows. There is no circumstance in which an employee holds a customer's money without a receipt having been issued, and none in which a customer's payment is applied to another customer's account. A shortfall in remittance is a matter for investigation and not for a conversation.\n\n" +
        "Customer information. Customer data is used only for the purpose it was collected for. It is not copied to a personal device or a personal messaging account, not shared with another lender, not shared with a family member or an acquaintance of the customer, and not used to source business for anyone. An employee who leaves takes nothing.\n\n" +
        "Facilities and connected interests. An employee does not appraise, sanction, disburse, waive, settle or collect on a file in which they or a relative have an interest. Interests are declared on discovery rather than at the next annual cycle.\n\n" +
        "Truthfulness in records. A record is made contemporaneously and accurately. A verification not performed is not recorded as performed. A visit not made is not logged. A document not seen is not marked as verified. Falsifying a record is treated as seriously as taking money, because every control downstream depends on it.\n\n" +
        "Conduct towards customers. The fair practices code and the collections conduct rules bind every employee, including those who do not deal with customers routinely. Abusive language, discrimination, and any conduct that humiliates a customer are dismissible matters.\n\n" +
        "Reporting. An employee who becomes aware of misconduct reports it, to their manager, to Human Resources, to Internal Audit, or through the protected disclosure line. Reporting in good faith is protected. Failing to report misconduct that an employee knew about is itself a disciplinary matter.\n\n" +
        "Investigation and discipline. Allegations are investigated by a person with no reporting relationship to the employee concerned. The employee is told the substance of the allegation and given an opportunity to respond before any decision. Outcomes range from counselling to dismissal and, where a criminal offence is involved, a complaint to the authorities. An employee dismissed for a conduct matter is recorded as such and the record is disclosed on any reference request.",
    },
    {
      id: "HR-002", title: "Field Staff: Identification, Conduct and Safety", cat: "people", clearance: 1, scopes: ["people", "collect", "ops"],
      owner: "Head of Human Resources", updated: "2026-03-06", rev: "3.4", system: "Policy Repository",
      tags: ["field staff", "identity card", "authorisation", "safety", "lone working", "vehicle", "cash carrying", "verification", "training", "withdrawal"],
      body:
        "This standard covers employees and empanelled agency staff who visit customers: sourcing officers, field investigation officers, field collections officers and repossession agents.\n\n" +
        "Before deployment. Employment verification including identity, address, previous employment and a check for any adverse record. Registration on the deployment register with a photograph. Completion of the conduct training and the assessment. Issue of a photo identity card and, for collections and repossession, a written authorisation naming the person, the territory and the validity period. Nobody visits a customer before all of these are complete.\n\n" +
        "Identification at every visit. The identity card and, where applicable, the authorisation are shown unprompted at the start of every visit. A customer is entitled to refuse a visit from a person who cannot produce both, and to report it, and Anvira will support the customer in that.\n\n" +
        "Withdrawal of authorisation. Anvira may withdraw an authorisation at any time without giving a reason, and does so immediately on any conduct allegation pending investigation. Withdrawal pending investigation is a precaution and is not a finding against the person.\n\n" +
        "Personal safety. Field staff work alone in unfamiliar places and sometimes meet hostility. No officer is required to enter a place they judge unsafe, to remain where they are being threatened, or to complete a visit in a situation that has deteriorated. Ending a visit on safety grounds is recorded and is never counted against the officer's performance. Where an officer is threatened, it is reported to the supervisor immediately and the account is escalated rather than reassigned to somebody else to try again.\n\n" +
        "Cash carrying. Cash collected is remitted the same day or by the start of the next working day. Officers do not carry cash overnight where a remittance point is available, do not travel with cash above the limit set for the territory, and do not remit through another person. An officer who is robbed reports it immediately and is not held liable where the procedure was followed.\n\n" +
        "Working hours. Customer contact only between 8am and 7pm. No officer is set a target, an incentive or a route plan that can only be achieved by contacting customers outside those hours, and an officer instructed to do so reports it.\n\n" +
        "Vehicles and travel. Officers required to travel by two-wheeler are provided with a helmet and are covered by accident insurance. Travel plans for remote territories are recorded with the supervisor.",
    },
    {
      id: "HR-003", title: "Training, Certification and Competency Register", cat: "people", clearance: 1, scopes: ["people", "ops", "compliance"],
      owner: "Head of Human Resources", updated: "2026-04-21", rev: "3.1", system: "Policy Repository",
      tags: ["training", "certification", "competency", "register", "refresher", "gold appraiser", "conduct", "mandatory", "lapse", "record"],
      body:
        "This register records what every role must be trained and certified in, the validity of each certification, and the consequence of a lapse. A certification that has lapsed is a certification that does not exist.\n\n" +
        "Mandatory for everyone, annually. Fair practices code. Customer identification and financial crime awareness. Information and data handling. Code of conduct. Protected disclosure. Completion is a condition of continued access to customer systems, and access is withdrawn on lapse rather than at the next review.\n\n" +
        "Role-specific certification. Credit underwriters: credit policy and the deviation matrix, on appointment and on every material policy revision. Gold appraisers: appraisal method, purity assessment and vault procedure, on appointment and refreshed every two years, with a practical assessment rather than a written one. Field investigation officers: verification standards and evidence. Collections staff, employed and agency: the recovery agent code of conduct, on appointment, annually, and after any conduct incident. Capital markets desk: the approved securities framework, margin call and invocation. Digital lending product staff: the digital lending framework and the disclosure sequence.\n\n" +
        "Agency staff. Recorded in this register alongside employees, because the obligation to have trained them sits on Anvira. An agency that cannot produce training records for a person it has deployed has deployed an untrained person on Anvira's behalf, whatever its own records say.\n\n" +
        "Training on a policy revision. Where a policy is revised materially, the training linked to it is refreshed within 60 days and completion is tracked to the individual. A policy revision issued without the linked training refreshed is an incomplete implementation and is recorded as an open item on the regulatory change register.\n\n" +
        "Lapse. A lapsed mandatory certification withdraws system access. A lapsed role certification withdraws the authority attached to it: an uncertified appraiser does not appraise, an uncertified collections officer is not allocated accounts, and an underwriter whose policy certification has lapsed does not sanction. Restoration follows completion and is not backdated.\n\n" +
        "Records. Completion records are retained for the period in the records retention policy and are the first evidence requested when a conduct matter is investigated or an inspection asks how a person came to be doing what they were doing.",
    },
    {
      id: "CP-001", title: "Capital Markets Operations: Daily Valuation, Margin Call and Invocation", cat: "capmkt", clearance: 2, scopes: ["capmkt", "ops", "risk"],
      owner: "Head of Capital Markets Lending", updated: "2026-06-18", rev: "4.2", system: "Loan Management",
      tags: ["valuation", "margin call", "cure period", "invocation", "pledge", "cover", "approved list", "corporate action", "same day", "escalation"],
      body:
        "This procedure governs the daily operation of the loan against securities and margin trade funding book. Everything here runs to a same-day clock, and a step taken a day late is a step that has lost its value.\n\n" +
        "End of day valuation. The pledged portfolio of every account is valued after market close on the closing price of each security, with the applicable haircut and the liquidity discount from the risk circular. Securities removed from the approved list during the day are valued at nil from that day, not from the next review.\n\n" +
        "Cover computation. Cover is the valued portfolio against the outstanding including accrued interest. It is computed on the portfolio rather than security by security, but the single-security concentration limit is tested at the same time and a breach of it is treated as a shortfall even where overall cover is adequate.\n\n" +
        "Issuing the call. Where cover is below the required level, the margin call is issued the same evening, by email and message to the contacts on record, stating the shortfall in rupees, the ways it may be cured, the cure deadline as a date and time, and what happens if it is not met. A call that states a percentage rather than an amount is not actionable by the client and is not a call.\n\n" +
        "The cure period. Runs to the close of the second trading day after the call. It runs from issue, not from acknowledgement, and a client who does not respond is not given more time for that reason. Cure is by payment reducing the outstanding or by pledging additional approved securities, and a pledge is effective when it is confirmed in the depository, not when it is instructed.\n\n" +
        "Escalation during the cure period. The desk contacts the client on each day of the period and records the contact. Where the shortfall widens materially during the period because prices have moved further, a revised call is issued for the increased amount and the original deadline stands.\n\n" +
        "Invocation. Where cover is not restored by the deadline, the pledge is invoked. Authorised by the Head of Capital Markets Lending with the Chief Risk Officer informed, never by the desk alone. Securities are sold to restore cover with a margin above it, beginning with the most liquid holding and in tranches where the size warrants it. The client is informed before the sale where the cure period has expired normally, and immediately afterwards where the emergency provision in the agreement was used.\n\n" +
        "Corporate actions. A security under a pending corporate action with a record date inside the cure period is identified before the call is issued, because entitlement, transfer restrictions and price adjustment can each affect both the valuation and the ability to sell. The desk checks the corporate action calendar as part of the end of day run rather than at invocation.\n\n" +
        "Records. The valuation, the cover computation, the call, every contact, the cure or the failure to cure, the invocation authority and the sale are recorded against the account. This is the sequence a client disputes afterwards, and the record is the only answer.",
    },
  ],
};
