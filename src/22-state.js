/* ------------------------------------------------------------------
   Edition contract + runtime state.

   Everything customer-specific arrives as window.SARA_EDITION. This module
   normalises it, fills defaults and validates, so a partial or slightly
   malformed edition still produces a working product instead of a blank
   screen. Validation problems are reported in Settings > About.
   ------------------------------------------------------------------ */

const CFG_ISSUES = [];
function cfgIssue(msg){ CFG_ISSUES.push(msg); }

/* Clearance ladder. Higher sees everything below it. */
const CLEARANCE = {
  1: { key: 1, label: "General", note: "Published to everyone" },
  2: { key: 2, label: "Internal", note: "All employees" },
  3: { key: 3, label: "Restricted", note: "Function leads and above" },
  4: { key: 4, label: "Confidential", note: "Executive and named owners" },
};

const DEFAULT_CATEGORIES = {
  policy:    { label: "Policy",        icon: "shield" },
  procedure: { label: "Procedure",     icon: "checklist" },
  technical: { label: "Technical",     icon: "code" },
  product:   { label: "Product",       icon: "grid" },
  commercial:{ label: "Commercial",    icon: "trendup" },
  people:    { label: "People",        icon: "users" },
  finance:   { label: "Finance",       icon: "chart" },
  legal:     { label: "Legal & risk",  icon: "quote" },
  ops:       { label: "Operations",    icon: "route" },
  reference: { label: "Reference",     icon: "library" },
  /* files the person attached themselves; never authored by an edition */
  attachment:{ label: "Attached file", icon: "paperclip" },
};

const Config = (function(){
  const raw = (typeof window !== "undefined" && window.SARA_EDITION) || {};
  if(!window.SARA_EDITION) cfgIssue("No edition loaded — SARA_EDITION is undefined.");

  const pick = (v, d) => (v === undefined || v === null || v === "" ? d : v);

  const C = {};
  C.slug = pick(raw.slug, "app");

  C.product = Object.assign({
    name: "SARA", version: "v2",
    tagline: "Enterprise knowledge assistant",
    vendor: "Streebo", vendorUrl: "",
    disclaimer: "",
    bootMs: 2400,           /* how long the splash is held, 0-6000 */
  }, raw.product || {});

  C.company = Object.assign({
    name: "Your Company", short: "", domain: "company.com",
    industry: "", hq: "", founded: "", headcount: "", sites: "", countries: "",
    currency: { symbol: "$", code: "USD" },
    about: "", facts: [],
  }, raw.company || {});
  if(!C.company.short) C.company.short = C.company.name.split(/\s+/)[0];
  if(!raw.company) cfgIssue("Missing `company` block.");

  /* brand.logo is a data URI inlined at build time from brand.logoFile, so the
     product keeps its real logo without the output needing a second file.
     brand.mark is the drawn fallback used when no logo asset is supplied.
     logoInset shrinks the mark inside its container (0.667 mirrors the h-2/3
     the platform uses); logoInvertOnDark flips a monochrome dark logo so it
     stays visible on the dark theme. */
  C.brand = Object.assign({
    accent: "#4d7cfe", mark: "spark", logo: "",
    logoInset: 1, logoInvertOnDark: false,
  }, raw.brand || {});
  C.brand.logoInset = clamp(parseFloat(C.brand.logoInset) || 1, 0.3, 1);

  C.login = Object.assign({
    headline: "", sub: "", note: "", legal: "", footer: "",
  }, raw.login || {});

  C.assistant = Object.assign({
    name: C.product.name,
    persona: "", style: "", greeting: "",
  }, raw.assistant || {});

  C.guardrails = Array.isArray(raw.guardrails) ? raw.guardrails.slice() : [];
  C.glossary   = Array.isArray(raw.glossary) ? raw.glossary.slice() : [];
  /* Domain diagrams. An edition without any simply has none, and nothing
     downstream has to test for that. Normalised here rather than read
     straight off `raw`, because everything else is: a key that skips this
     function is a key that silently disappears. */
  C.diagrams   = Array.isArray(raw.diagrams) ? raw.diagrams.slice() : [];

  /* Display names for scope keys. A scope key is an identifier the access
     engine matches on, and title-casing it produces things like "Hplab".
     An edition may name them properly; anything unnamed falls back. */
  C.scopeLabels = Object.assign({}, raw.scopeLabels || {});

  /* What the Operator drives, for the one place the welcome wall says it. */
  C.operatorSystem = pick(raw.operatorSystem, "the system");

  /* Usage recording. Local only unless an endpoint is named here, and
     there is no default endpoint. See 47-analytics.js for the levels. */
  C.analytics = Object.assign({ level: "detail", endpoint: "", identify: "off",
                               disclose: false, org: "", note: "", label: "" },
                              raw.analytics || {});
  /* Falls back to the customer's name, so a shared collector can always
     tell one prospect's demo from another even if nobody set a label. */
  if (!C.analytics.label) C.analytics.label = C.company.name || C.slug;

  /* How many documents an answer is grounded in. Raise it for editions whose
     hero question depends on seeing a whole thread at once. */
  C.retrieval = Object.assign({ topK: 5 }, raw.retrieval || {});
  C.retrieval.topK = clamp(parseInt(C.retrieval.topK, 10) || 5, 3, 10);

  C.categories = Object.assign({}, DEFAULT_CATEGORIES, raw.categories || {});

  /* ---------------- the second retrieval channel ----------------
     Web search is off unless an edition asks for it, and even then it
     contacts only the hosts named here. An enterprise buyer is entitled to
     read that list before the file is opened, so it lives in the edition
     rather than being buried in code. `extra` lets an edition register its
     own connector (same shape, its own run()) without touching src/. */
  C.web = Object.assign({
    mode: "auto",                                        /* off | on | auto */
    connectors: ["wikipedia", "duckduckgo", "openalex"],
    topK: 5,
    read: false,        /* fetch the top pages as text rather than snippets */
    readCount: 2,
    extra: [],
  }, raw.web || {});
  C.web.topK = clamp(parseInt(C.web.topK, 10) || 5, 3, 10);
  C.web.readCount = clamp(parseInt(C.web.readCount, 10) || 2, 1, 3);
  if(!Array.isArray(C.web.connectors)) C.web.connectors = [];
  if(!Array.isArray(C.web.extra)) C.web.extra = [];
  if(["off", "on", "auto"].indexOf(C.web.mode) === -1) C.web.mode = "auto";

  /* Files the person attaches during a conversation. `reserve` guarantees
     the document in front of them cannot be crowded out of an answer by a
     large corpus, which is the failure mode that makes file search feel
     broken. */
  C.attachments = Object.assign({ enabled: true, reserve: 2 }, raw.attachments || {});
  C.attachments.reserve = clamp(parseInt(C.attachments.reserve, 10) || 2, 0, 4);

  C.systems = (Array.isArray(raw.systems) ? raw.systems : []).map(s => Object.assign({
    name: "System", kind: "", docs: 0, color: hashColor(s && s.name), initials: initials(s && s.name),
  }, s));

  /* Library rail seeds. All optional: the Files view derives itself from the
     knowledge base, so an edition that declares none of these still works. */
  C.mcp         = Array.isArray(raw.mcp) ? raw.mcp.slice() : [];
  C.files       = Array.isArray(raw.files) ? raw.files.slice() : [];
  C.bookmarks   = Array.isArray(raw.bookmarks) ? raw.bookmarks.slice() : [];
  C.pinnedFiles = Array.isArray(raw.pinnedFiles) ? raw.pinnedFiles.slice() : [];

  /* ---------------- roles ---------------- */
  C.roles = (Array.isArray(raw.roles) ? raw.roles : []).map((r, i) => {
    const role = Object.assign({
      key: "role" + i, title: "Employee", dept: "",
      clearance: 2, scopes: [], focus: "", persona: "", greeting: "",
      prompts: [],
    }, r);
    role.clearance = clamp(parseInt(role.clearance, 10) || 2, 1, 4);
    role.scopes = Array.isArray(role.scopes) ? role.scopes : [];
    role.prompts = (Array.isArray(role.prompts) ? role.prompts : []).map(p =>
      typeof p === "string" ? { t: p, q: p, s: "", icon: "spark" }
                            : Object.assign({ t: "", q: "", s: "", icon: "spark" }, p));
    return role;
  });
  if(!C.roles.length) cfgIssue("No `roles` defined — at least one is required.");

  C.roleByKey = {};
  C.roles.forEach(r => { C.roleByKey[r.key] = r; });

  /* ---------------- users ---------------- */
  C.users = (Array.isArray(raw.users) ? raw.users : []).map((u, i) => {
    const user = Object.assign({
      name: "User " + (i + 1), roleKey: (C.roles[0] || {}).key,
      title: "", email: "", location: "", avatarColor: "",
    }, u);
    if(!C.roleByKey[user.roleKey]){
      cfgIssue(`User "${user.name}" points at unknown role "${user.roleKey}".`);
      user.roleKey = (C.roles[0] || {}).key;
    }
    const role = C.roleByKey[user.roleKey] || {};
    if(!user.title) user.title = role.title || "";
    if(!user.email) user.email = user.name.toLowerCase().replace(/[^a-z]+/g, ".") + "@" + C.company.domain;
    if(!user.avatarColor) user.avatarColor = hashColor(user.name);
    user.av = initials(user.name);
    return user;
  });
  if(!C.users.length) cfgIssue("No `users` defined — the sign-in screen needs at least one.");


  /* ---------------- guided tasks ----------------
     Real work the customer's own people complete inside the assistant, each
     ending in a document they can use. Validated after roles exist, because
     a task scoped to a role that does not exist would simply never appear
     and nobody would know why. */
  C.journeys = (Array.isArray(raw.journeys) ? raw.journeys : []).map((j, i) => {
    const job = Object.assign({
      id: "task" + (i + 1), title: "Untitled task", tagline: "", intro: "",
      icon: "checklist", est: "", for: [], doneTitle: "", doneNote: "",
      steps: [], produce: null,
    }, j);
    job.for = Array.isArray(job.for) ? job.for : [];
    job.steps = (Array.isArray(job.steps) ? job.steps : []).map((s, k) =>
      Object.assign({ id: "s" + (k + 1), type: "text", q: "", help: "", cite: "",
                      options: [], optional: false, when: null, placeholder: "" }, s));
    if(!job.steps.length) cfgIssue(`Guided task "${job.id}" has no steps.`);
    if(!job.produce) cfgIssue(`Guided task "${job.id}" produces nothing — it needs a \`produce\` block.`);
    return job;
  });

  const seenJob = new Set();
  const STEP_TYPES = ["choice", "multi", "text", "textarea", "number", "date", "confirm"];
  C.journeys.forEach(job => {
    if(seenJob.has(job.id)) cfgIssue(`Duplicate guided task id "${job.id}".`);
    seenJob.add(job.id);
    job.for.forEach(k => {
      if(!C.roleByKey[k]) cfgIssue(`Guided task "${job.id}" is scoped to unknown role "${k}".`);
    });
    const ids = new Set();
    job.steps.forEach((s, k) => {
      const where = `Guided task "${job.id}" step ${k + 1}`;
      if(ids.has(s.id)) cfgIssue(`${where} reuses the field id "${s.id}".`);
      ids.add(s.id);
      if(STEP_TYPES.indexOf(s.type) === -1) cfgIssue(`${where} has unknown type "${s.type}".`);
      if((s.type === "choice" || s.type === "multi") && !s.options.length){
        cfgIssue(`${where} is a ${s.type} with no options.`);
      }
      if(s.when) Object.keys(s.when).forEach(f => {
        if(!job.steps.some(x => x.id === f)) cfgIssue(`${where} branches on unknown field "${f}".`);
      });
    });
  });

  /* ---------------- knowledge base ---------------- */
  const seenIds = new Set();
  C.kb = (Array.isArray(raw.kb) ? raw.kb : []).map((d, i) => {
    const doc = Object.assign({
      id: "DOC-" + String(i + 1).padStart(3, "0"),
      title: "Untitled document", cat: "reference",
      owner: "", updated: "", rev: "", system: "",
      clearance: 1, scopes: [], tags: [], body: "",
    }, d);
    doc.clearance = clamp(parseInt(doc.clearance, 10) || 1, 1, 4);
    doc.scopes = Array.isArray(doc.scopes) ? doc.scopes : [];
    doc.tags = Array.isArray(doc.tags) ? doc.tags : [];
    if(seenIds.has(doc.id)) cfgIssue(`Duplicate document id "${doc.id}".`);
    seenIds.add(doc.id);
    if(!C.categories[doc.cat]){
      cfgIssue(`Document "${doc.id}" uses unknown category "${doc.cat}".`);
      doc.cat = "reference";
    }
    if(!doc.body) cfgIssue(`Document "${doc.id}" has no body text — it can never be retrieved usefully.`);
    return doc;
  });
  if(C.kb.length < 5) cfgIssue("Knowledge base has fewer than 5 documents — retrieval will look thin in a demo.");

  /* Scopes actually used anywhere, for validation and the scope chip. */
  C.allScopes = Array.from(new Set(
    C.kb.flatMap(d => d.scopes).concat(C.roles.flatMap(r => r.scopes))
  )).sort();

  C.roles.forEach(r => {
    r.scopes.forEach(s => {
      if(!C.kb.some(d => d.scopes.includes(s)))
        cfgIssue(`Role "${r.key}" is granted scope "${s}" but no document carries it.`);
    });
  });

  /* Corpus figures quoted in the UI. Real counts, not decoration. */
  C.stats = {
    docs: C.kb.length,
    systems: C.systems.length,
    words: C.kb.reduce((n, d) => n + String(d.body).split(/\s+/).filter(Boolean).length, 0),
    updated: C.kb.map(d => d.updated).filter(Boolean).sort().pop() || "",
  };

  return C;
})();

/* ------------------------------------------------------------------
   Runtime state
   ------------------------------------------------------------------ */
const S = {
  user: null,
  role: null,

  /* provider */
  provider: "openai",
  model: "gpt-5.1",
  effort: "low",
  pinnedModels: [],          // "provider:model" refs shown at the top of the picker
  answerStyle: "balanced",   // brief | balanced | thorough
  images: false,
  /* the second retrieval channel. The edition sets the opening position;
     everything here is the customer's to change and is remembered. */
  web: Config.web.mode,      // off | on | auto
  webConnectors: Config.web.connectors.slice(),
  webTopK: Config.web.topK,
  webRead: !!Config.web.read,
  autoPanel: true,           // open the workspace when an answer produces one
  traceOpen: false,          // expand the retrieval trace by default

  /* appearance. "system" by default so a file handed to a customer opens in
     whatever theme their machine is already set to. */
  theme: "system",           // system | dark | light
  density: "cosy",
  accent: Config.brand.accent,

  /* conversations */
  convos: [],
  currentId: null,
  filter: "",

  /* sidebar */
  view: "chats",            // chats | bookmarks | files | mcp
  bookmarkFilter: null,     // when set, the chat list shows only this bookmark

  /* a temporary chat is never written to history and never persisted */
  temporary: false,

  /* transport */
  streaming: false,
  abort: null,

  /* panel */
  panelOpen: true,
  panelWide: false,
  panelWidth: 440,
  artifacts: [],      // every artifact in the current conversation
  artifactIdx: -1,
};

/* Persisted preferences (never the conversation content — that has its own key). */
const PREF_KEYS = ["provider","model","effort","pinnedModels","answerStyle","images",
                   "web","webConnectors","webTopK","webRead",
                   "autoPanel","traceOpen","theme","density","accent","panelWidth"];

function loadPrefs(){
  const p = Store.get("prefs", {}) || {};
  PREF_KEYS.forEach(k => { if(p[k] !== undefined) S[k] = p[k]; });
  if(!Array.isArray(S.pinnedModels)) S.pinnedModels = [];
  if(!Array.isArray(S.webConnectors)) S.webConnectors = Config.web.connectors.slice();
  if(["system", "dark", "light"].indexOf(S.theme) === -1) S.theme = "system";
  if(["off","on","auto"].indexOf(S.web) === -1) S.web = Config.web.mode;
  S.webTopK = clamp(parseInt(S.webTopK, 10) || Config.web.topK, 3, 10);

  /* An edition may ship a key so the customer can open the file and just use it. */
  if(Config.product.apiKey && !Keys.get("openai")) Keys.set("openai", Config.product.apiKey, 0);

  /* Migrate the single-provider key from earlier builds. */
  if(p.apiKey && !Keys.get("openai")) Keys.set("openai", p.apiKey, 0);
}
function savePrefs(){
  const p = {};
  PREF_KEYS.forEach(k => { p[k] = S[k]; });
  Store.set("prefs", p);
}

/* ---------------- theme ----------------
   S.theme is what the person chose, which may be "system"; resolvedTheme()
   is what is actually on screen. Everything that varies by appearance must
   read the resolved value, never the preference, or a customer whose laptop
   is in light mode gets dark-mode contrast maths.

   The head bootstrap in build.py applies the same rule before the first
   paint, so the two must agree on the storage key and the fallback. */
const THEME_QUERY = "(prefers-color-scheme: dark)";

function systemTheme(){
  /* a browser that cannot report a preference gets the product's own default
     rather than being silently treated as light */
  if(typeof matchMedia !== "function") return "dark";
  try{ return matchMedia(THEME_QUERY).matches ? "dark" : "light"; }
  catch(e){ return "dark"; }
}
function resolvedTheme(){
  return S.theme === "system" ? systemTheme() : (S.theme === "light" ? "light" : "dark");
}

function applyTheme(){
  const root = document.documentElement;
  root.setAttribute("data-theme", resolvedTheme());
  root.setAttribute("data-density", S.density === "cosy" ? "" : S.density);
  applyAccent(S.accent);
}

/* Follow the operating system live: someone who flips their laptop to dark
   mid-meeting should see SARA follow, not need to reload. */
function watchSystemTheme(){
  if(typeof matchMedia !== "function") return;
  let mq;
  try{ mq = matchMedia(THEME_QUERY); }catch(e){ return; }
  const onChange = function(){ if(S.theme === "system") applyTheme(); };
  if(mq.addEventListener) mq.addEventListener("change", onChange);
  else if(mq.addListener) mq.addListener(onChange);      /* older Safari */
}

function applyAccent(hex){
  const root = document.documentElement;
  const light = resolvedTheme() === "light";
  S.accent = hex;
  root.style.setProperty("--a", hex);
  root.style.setProperty("--a-soft", rgba(hex, light ? 0.11 : 0.15));
  root.style.setProperty("--a-line", rgba(hex, 0.34));
  root.style.setProperty("--a-text", light ? mixHex(hex, "#000000", 0.24) : mixHex(hex, "#ffffff", 0.34));
  root.style.setProperty("--a-contrast", onColor(hex));
}

/* The product mark, used everywhere SARA identifies itself: boot screen,
   sign-in, welcome orb, assistant avatar and the conversation list. One
   function so supplying a logo changes all of them at once. */
function brandMark(){
  if(Config.brand.logo){
    return '<img class="brand-img" src="' + escAttr(Config.brand.logo) + '" alt="" draggable="false">';
  }
  return Icons.svg(Icons.has(Config.brand.mark) ? Config.brand.mark : "spark");
}
function hasBrandLogo(){ return !!Config.brand.logo; }

/* ---------------- logo re-tinting ----------------
   The build tints the mark to the edition's accent, which is right until
   somebody swaps the edition block inside an already-built file for a
   different organisation. Then the whole interface turns their colour and
   the logo stays the old one, which looks broken.

   So the untinted original travels with the file, and if the accent no
   longer matches what was baked, the browser re-tints from that original.
   The maths is the same as build.py's: every pixel of a flat two-tone mark
   sits on the line between the base colour and white, so solving for that
   blend factor and re-mixing against the new accent preserves the
   antialiasing exactly, where a hue rotation would muddy it.

   This is what lets a re-skin be "paste the edition block in" with no
   Python, no build step and no image editor. */
function retintLogo(src, accentHex, base){
  return new Promise(function(resolve){
    if(typeof document === "undefined" || !document.createElement) return resolve(null);
    const img = new Image();
    img.onerror = function(){ resolve(null); };
    img.onload = function(){
      try{
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        if(!canvas.width || !canvas.height) return resolve(null);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;
        const a = hexToRgb(accentHex);
        const bx = base[0], by = base[1], bz = base[2];
        const dx = 255 - bx, dy = 255 - by, dz = 255 - bz;
        const denom = (dx * dx + dy * dy + dz * dz) || 1;
        for(let i = 0; i < px.length; i += 4){
          if(px[i + 3] === 0) continue;
          let t = ((px[i] - bx) * dx + (px[i + 1] - by) * dy + (px[i + 2] - bz) * dz) / denom;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          px[i]     = Math.round(a.r + (255 - a.r) * t);
          px[i + 1] = Math.round(a.g + (255 - a.g) * t);
          px[i + 2] = Math.round(a.b + (255 - a.b) * t);
        }
        ctx.putImageData(data, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      }catch(err){ resolve(null); }   /* a tainted or oversized canvas keeps the baked logo */
    };
    img.src = src;
  });
}

function sameColour(a, b){
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

async function syncBrandLogo(){
  const source = typeof window !== "undefined" ? window.SARA_LOGO_SOURCE : null;
  const baked  = typeof window !== "undefined" ? window.SARA_LOGO_BAKED : null;
  const base   = (typeof window !== "undefined" && window.SARA_LOGO_BASE) || [0, 107, 217];
  if(!source || !Config.brand.logoTint) return false;
  if(sameColour(baked, Config.brand.accent)) return false;   /* already the right colour */

  const uri = await retintLogo(source, Config.brand.accent, base);
  if(!uri) return false;
  Config.brand.logo = uri;
  refreshBrandLogo();
  return true;
}

/* Static markup written by the build does not go through brandMark(), so the
   boot mark and the favicon are updated by hand. */
function refreshBrandLogo(){
  if(typeof document === "undefined" || !document.querySelectorAll) return;
  $$("img.brand-img").forEach(function(node){ node.src = Config.brand.logo; });
  const fav = document.querySelector('link[rel="icon"]');
  if(fav) fav.href = Config.brand.logo;
}

/* Applied once at boot so every logo instance obeys the edition's sizing and
   inversion rules without each call site knowing about them. */
function applyBrandLogoStyle(){
  const root = document.documentElement;
  root.style.setProperty("--logo-inset", (Config.brand.logoInset * 100) + "%");
  root.classList.toggle("logo-invert-dark", !!Config.brand.logoInvertOnDark);
}

/* ---------------- current user helpers ---------------- */
function currentRole(){ return S.role || Config.roles[0] || { scopes: [], clearance: 1 }; }
function currentScopes(){ return currentRole().scopes || []; }
function currentClearance(){ return currentRole().clearance || 1; }
