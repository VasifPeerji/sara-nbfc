/* ==================================================================
   46-router.js
   Intent routing: one question, four different kinds of answer.
   ------------------------------------------------------------------
   A laboratory does not ask one kind of question. In the same hour the
   same test engineer will ask what a standard requires, ask for a test
   work to be scoped, ask for the record to be raised in the ERP,
   and ask for a note to the customer to be drafted. Those are four
   different products behind one box, and the person asking should not
   have to know which one they are addressing.

   So every message is classified first:

     knowledge     answer from the company's own corpus, with citations
     task          a guided task exists that finishes this properly
     operator      this is work in the tenant's own systems; drive it
     productivity  general help inside the domain: draft, explain, plan.
                   Answered from the model, and labelled as such, because
                   an answer with no document behind it must never be
                   dressed up as one that has
     outofdomain   politely out of scope

   THE MODEL CLASSIFIES. IT DOES NOT DECIDE.
   The LLM returns an intent and a target id, and that is all it is
   trusted with. The target is then looked up in the real registry, and
   anything that does not resolve falls through to the deterministic
   classifier below. A hallucinated task id can therefore never launch
   anything, because nothing launches from a string the model wrote.

   The deterministic classifier is not a fallback nobody exercises: it
   is the whole router when no API key is set, which is how this file is
   demonstrated more often than not. It has to be good on its own.
   ================================================================== */

const Router = (function () {

  const INTENTS = ["knowledge", "task", "operator", "productivity", "outofdomain"];

  /* ---------------------------------------------------------------
     what the router can reach
  --------------------------------------------------------------- */

  /** Operator runs, described the way a person would ask for them. */
  function operatorRuns() {
    if (typeof OP_ORDER === "undefined") return [];
    return OP_ORDER.map(k => ({
      id: k,
      kind: "operator",
      label: OP_DEPT[k].label,
      title: OP_DEPT[k].runTitle,
      what: OP_DEPT[k].runWhat,
      triggers: OP_DEPT[k].triggers || [],
      steps: OP_DEPT[k].steps.length,
      color: OP_DEPT[k].color,
      icon: OP_DEPT[k].icon || "monitor",
    }));
  }

  /** Guided tasks this role may actually run. */
  function taskRuns() {
    if (typeof Journeys === "undefined") return [];
    return Journeys.forRole().map(j => ({
      id: j.id,
      kind: "task",
      label: j.title,
      title: j.title,
      what: j.tagline || j.intro || "",
      triggers: j.triggers || [],
      est: j.est || "",
      icon: j.icon || "checklist",
    }));
  }

  function findRun(kind, id) {
    const list = kind === "operator" ? operatorRuns() : taskRuns();
    return list.find(r => r.id === id) || null;
  }

  /* ---------------------------------------------------------------
     the deterministic classifier
  --------------------------------------------------------------- */

  const STOP = new Set(("a an the of for to in on at is are was were be been am do does did " +
    "i we you he she it they me my our your this that these those and or but if then so " +
    "can could should would will shall may might must have has had please help with about " +
    "from by as into over under how what when where which who why").split(" "));

  function terms(text) {
    return String(text || "").toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP.has(w));
  }

  /* verbs that mean "go and do it", as opposed to "tell me about it" */
  const DO_VERBS = /\b(raise|create|open|start|book|allocate|invoice|post|submit|order|run|schedule|process|update|enter|record|log|generate|issue|send|set ?up|put through|push|complete|close off|write ?up|do)\b/i;
  /* Phrasings that mean "explain it to me".

     A question word only counts where it actually opens a question. It
     used to match anywhere, so "the brakes squeal WHEN cold" read as a
     question and a clear instruction to raise a repair order was
     answered from the knowledge base instead of being carried out. */
  const ASK_OPENERS = /^\s*(?:so\s+|and\s+|ok(?:ay)?[,\s]+|hey[,\s]+)?(what|why|when|where|which|who|whom|whose|how|can|could|should|would|is|are|do|does|did|am|has|have)\b/i;
  const ASK_PHRASES = /\b(explain|describe|tell me about|difference between|what is|what are|what does|why is|why does|how do i|how does|how long|how much|how many|can i|am i allowed|is it ok|are we allowed|should i|what happens if|walk me through)\b/i;
  const ASK_TOPIC = /\b(policy|rule|procedure|guideline|standard|requirement)s?\s+(?:on|for|about|regarding|says?)\b/i;
  function isAsk(t) {
    return /\?\s*$/.test(t) || ASK_OPENERS.test(t) || ASK_PHRASES.test(t) || ASK_TOPIC.test(t);
  }
  /* drafting and general-productivity phrasings */
  const MAKE_SHAPE = /\b(draft|write|compose|rewrite|reword|summari[sz]e|summary|bullet|note|email|message|letter|reply|respond|script|agenda|checklist|plan|outline|translate|shorten|tidy|polish)\b/i;

  /* An explicit request to compose something. Decided by shape rather
     than by retrieval, because "draft an email to the customer about the
     failed duty" retrieves the duty documents perfectly well and is
     still not a question about test method policy. */
  const COMPOSE = /\b(draft|compose|rewrite|re-?word|paraphrase|summari[sz]e|proof-?read|polish|shorten|translate)\b/i;
  const COMPOSE_OBJ = /\b(write|word|put together|knock up|give me)\b[^.?!]{0,28}\b(email|note|memo|letter|message|reply|response|apology|script|agenda|summary|outline|bullets?|paragraph|wording|text|draft)\b/i;
  function isCompose(t) { return COMPOSE.test(t) || COMPOSE_OBJ.test(t); }

  /* How relevant the best retrieved passage has to be before the corpus
     is treated as answering the question. Calibrated against the corpus:
     a real question scores 8 to 25, a question about something else
     entirely still scrapes 2 to 3 on incidental word overlap. The gap is
     wide, so the threshold sits in the middle of it rather than being
     tuned to any single query. */
  /* BM25 will always find some overlap, so the top passage has to be
     relevant enough to be worth quoting.

     The floor is corpus dependent, because IDF rises with corpus size
     and with vocabulary density, so it is measured rather than guessed.
     Over this edition's corpus, thirty real questions spread across
     every role and segment, and twenty general-knowledge ones:

       real questions   2.7 to 34.8
       general junk     up to 7.8

     Those two ranges OVERLAP, and it is a mistake to go looking for a
     threshold that separates them: "what has to be on the file before
     we can disburse" scores 2.7 because it is written almost entirely
     in stopwords, and "what is the capital of Portugal" scores 7.8
     because capital adequacy and capital markets are both real subjects
     here.

     So this is a junk filter, not a question detector. It sits above
     the junk, not below the questions, and a real question that falls
     under it still reaches the corpus through the in-domain branch. */
  const CORPUS_FLOOR = 9.0;
  function bestScore(hit) {
    const s = hit && hit.sources && hit.sources[0];
    return s && typeof s.score === "number" ? s.score : 0;
  }

  /* Generic workplace nouns. A drafting request is only ours if it is
     drafting something for this business: "draft an email to the customer"
     is in scope, "write me a poem about the sea" is not, and the verb is
     identical in both. */
  const WORK_NOUN = /\b(customer|client|colleague|manager|team|staff|technician|engineer|advisor|adviser|supplier|laboratory|lab|branch|site|platform|department|meeting|handover|shift|invoice|quote|quotation|order|booking|appointment|campaign|complaint|claim|report|certificate|standard|email|note|memo|letter|message|reply|agenda|minutes|policy|procedure|process|deadline|apolog)/i;

  /** Does this look like it belongs to this business at all? */
  function inDomain(text) {
    const t = String(text || "").toLowerCase();
    const words = terms(t);
    if (!words.length) return false;

    /* The corpus and the configuration are the domain vocabulary, so the
       check is derived rather than hand-listed, and it re-skins with the
       edition rather than needing maintenance. */
    const vocab = domainVocab();
    if (words.some(w => vocab.has(w))) return true;

    /* Generic business-assistant work counts, but only when it is aimed at
       something in a workplace. */
    return MAKE_SHAPE.test(t) && WORK_NOUN.test(t);
  }

  /* Words that appear in the domain vocabulary but carry no domain
     signal on their own. "Write" is in there because the corpus talks
     about writing a case up, and on its own it would make "write me a
     poem" look like company business.

     Maintained by measurement rather than by intuition: every word in
     the last group below was, on test, the single word letting a
     general-knowledge question through. */
  const VOCAB_NOISE = new Set(("write written writing run running open opened check checked set put get " +
    "take taken make made give given work working time day days week weeks month months year years " +
    "need needs use used using help call called send sent show shown keep kept hold held find found " +
    "know known thing things way ways one two three new old good best first last next " +
    /* Homonyms. Each is a real word in this business — capital adequacy,
       a second charge, a repayment plan, the rule in a circular, the
       end of a tenor — and each carries no domain signal standing
       alone, which is how "what is the capital of Portugal" and "how do
       I get a stain OUT of a shirt" started looking like our business. */
    "capital second end all rule plan out").split(" "));

  let VOCAB = null;
  function domainVocab() {
    if (VOCAB) return VOCAB;
    VOCAB = new Set();
    const add = s => terms(s).forEach(w => { if (!VOCAB_NOISE.has(w)) VOCAB.add(w); });
    (Config.kb || []).forEach(d => { add(d.title); (d.tags || []).forEach(add); });
    (Config.glossary || []).forEach(g => { add(g.term); add(g.def); });
    Object.keys(Config.categories || {}).forEach(k => add((Config.categories[k] || {}).label || k));
    (Config.roles || []).forEach(r => add(r.title));
    (Config.systems || []).forEach(s => add(s.name));
    /* Every run, not the ones this role can reach. The vocabulary is
       cached, so building it from the signed-in role meant whoever
       signed in first decided what the whole session considered to be
       company business. Access control governs what a person may READ;
       it has nothing to say about what counts as our subject matter. */
    if (typeof OP_ORDER !== "undefined") {
      OP_ORDER.forEach(k => {
        const d = OP_DEPT[k] || {};
        add(d.label); add(d.runTitle); (d.triggers || []).forEach(add);
      });
    }
    (Config.journeys || []).forEach(j => { add(j.title); (j.triggers || []).forEach(add); });
    return VOCAB;
  }

  /** Does the text contain this phrase as whole words?

      A plain indexOf does not: "los" is inside "foreclosure", so an
      acronym trigger scored on every question that happened to contain
      a longer word wrapping it, and the wrong product answered. Every
      occurrence is checked rather than only the first, because the one
      that lands on a word boundary is rarely the one that comes first. */
  function hasPhrase(text, phrase) {
    if (!phrase) return false;
    let i = text.indexOf(phrase);
    while (i !== -1) {
      const before = i === 0 ? " " : text.charAt(i - 1);
      const after = i + phrase.length >= text.length ? " " : text.charAt(i + phrase.length);
      if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return true;
      i = text.indexOf(phrase, i + 1);
    }
    return false;
  }

  /** Overlap between a query and a run's own trigger vocabulary. */
  function runScore(run, words, text) {
    const bag = new Set();
    terms(run.label).forEach(w => bag.add(w));
    terms(run.title || "").forEach(w => bag.add(w));
    terms(run.what || "").forEach(w => bag.add(w));
    let score = 0;
    words.forEach(w => { if (bag.has(w)) score += 1; });
    /* an explicit trigger is worth far more than an incidental word that
       happens to appear in a tagline */
    (run.triggers || []).forEach(tr => {
      const t = String(tr).toLowerCase();
      if (hasPhrase(text, t)) score += t.indexOf(" ") !== -1 ? 5 : 3;
    });
    return score;
  }

  /** "the work in progress ageing report" is a report, not a work in
      progress job. A noun immediately before the word "report" makes the
      whole phrase the name of a report, and that beats whatever the noun
      itself would otherwise have matched. */
  const NAMED_REPORT = /\b(\w{3,})\s+report\b/i;
  const REPORT_ARTICLE = /^(?:the|this|that|any|some|one|our|your)$/i;
  function isNamedReport(t) {
    const m = String(t).match(NAMED_REPORT);
    return !!(m && !REPORT_ARTICLE.test(m[1]));
  }
  function reportBias(run, t) {
    if (run.id !== "reports") return 0;
    if (isNamedReport(t)) return 6;
    if (/\breport\b/i.test(t)) return 3;
    return 0;
  }

  /* A question that names a source of authority and a saying verb is
     asking for the document, not for the answer to be worked out. It is
     the one shape that has to stay with the corpus even when it happens
     to contain a guided task's trigger phrase. */
  /* Is this question about a CASE, or about the rule?

     A guided task takes a case and works it: it needs an account, a
     file, a vehicle in front of somebody. So the signal is a modal
     aimed at us or a demonstrative pointing at an instance — "can this
     vehicle", "can we", "should we", "is this account". Without one,
     the question is about the rule, and the rule is what the corpus is
     for: "what notice is required before a gold auction" is a question
     about notice, not an instruction to value somebody's gold. */
  const ABOUT_A_CASE =
    /\b(?:can|could|should|shall|may|must|do|does|is|are|has|have|will)\s+(?:we|i|they|it|this|that|the)\b|\bthis\s+(?:account|file|case|customer|borrower|vehicle|loan|facility|application|complaint|deviation|agreement|return|charge|property|partner)\b|\bam\s+i\b|\bare\s+we\b/;

  const SEEKS_DOCUMENT =
    /\b(?:polic(?:y|ies)|circular|standard|manual|guideline|direction|directions|note|sop|procedure)\b[^.?]{0,40}\b(?:say|says|said|state|states|require|requires|provide|provides|permit|permits|allow|allows|define|defines)\b/;

  /** The longest multi-word trigger, among the tasks this person can
      run, that appears in the text word for word. Longest wins, because
      a five-word phrase is a far more deliberate match than a two-word
      one that happens to sit inside it. */
  function bestTriggerPhrase(tasks, text) {
    let best = null;
    tasks.forEach(entry => {
      (entry.r.triggers || []).forEach(tr => {
        const p = String(tr).toLowerCase();
        if (p.indexOf(" ") === -1) return;
        if (!hasPhrase(text, p)) return;
        if (!best || p.length > best.phrase.length) best = { id: entry.r.id, phrase: p };
      });
    });
    return best;
  }

  function rulesClassify(text) {
    const t = String(text || "").toLowerCase().trim();
    const words = terms(t);
    const why = [];

    if (!words.length) return { intent: "knowledge", target: null, source: "rules", why: "empty" };

    const ops = operatorRuns().map(r => ({ r: r, s: runScore(r, words, t) + reportBias(r, t) }))
      .sort((a, b) => b.s - a.s);
    const tasks = taskRuns().map(r => ({ r: r, s: runScore(r, words, t) }))
      .sort((a, b) => b.s - a.s);

    const bestOp = ops[0] || { s: 0 };
    const bestTask = tasks[0] || { s: 0 };
    const wantsAction = DO_VERBS.test(t);
    const asks = isAsk(t);


    /* An action verb is what separates "raise the repair order" from
       "what goes on a repair order". Without one, a strong subject match
       is a question about the subject, not a request to do it. */
    if (wantsAction && !asks) {
      if (bestOp.s >= 3 && bestOp.s >= bestTask.s) {
        why.push("action verb + " + bestOp.r.label + " (" + bestOp.s + ")");
        return { intent: "operator", target: bestOp.r.id, source: "rules", why: why.join("; ") };
      }
      if (bestTask.s >= 3) {
        why.push("action verb + task " + bestTask.r.id + " (" + bestTask.s + ")");
        return { intent: "task", target: bestTask.r.id, source: "rules", why: why.join("; ") };
      }
    }

    /* An explicit request to compose something is settled here, before
       the subject match and before retrieval. "Draft an email to the
       customer about the recall" retrieves the recall documents
       beautifully and is still not a question about recall policy, and
       "write a short note about the duty result" is not an instruction
       to go and record a result in the system of record. */
    if (isCompose(t)) {
      return { intent: "productivity", target: null, source: "rules", why: "composition request" };
    }

    /* A guided task's own trigger phrase, word for word, is its author
       saying "this is the question this task is for". Many of these
       tasks exist precisely to answer a question — can this be
       repossessed, can this file disburse, who can approve this — so
       requiring the text not to be a question would rule out the very
       phrasing they were written for.

       Three things keep this narrow. The phrase has to be more than one
       word, so an incidental noun cannot do it. The question has to be
       about a case rather than about the rule, because half these
       triggers are noun phrases naming a thing and a question about
       that thing belongs to the corpus: "what notice is required before
       a gold auction" is asking about notice. And a question that names
       a document as its source is left to the corpus whatever else it
       says, because that is what it asked for. */
    const phrase = bestTriggerPhrase(tasks, t);
    if (phrase && ABOUT_A_CASE.test(t) && !SEEKS_DOCUMENT.test(t)) {
      return { intent: "task", target: phrase.id, source: "rules",
               why: 'task trigger "' + phrase.phrase + '"' };
    }

    /* A very strong subject match carries even a bare noun phrase:
       "publish the certificate to the register" is not a general
       knowledge question. */
    if (bestOp.s >= 6 && bestOp.s > bestTask.s && !asks) {
      return { intent: "operator", target: bestOp.r.id, source: "rules",
               why: "strong Operator match " + bestOp.r.label + " (" + bestOp.s + ")" };
    }
    if (bestTask.s >= 6 && !asks) {
      return { intent: "task", target: bestTask.r.id, source: "rules",
               why: "strong task match " + bestTask.r.id + " (" + bestTask.s + ")" };
    }

    /* Does the company's own corpus actually answer this? That is a far
       better signal than guessing from shape, and it is free.

       If retrieval is not usable, say so in `why` rather than reporting
       "no corpus match": those are very different states, and silently
       conflating them sends every knowledge question to the model. */
    let hit = null;
    try {
      hit = Retrieval.search(text, { role: currentRole(), topK: 4 });
    } catch (e) {
      /* the index is built at boot, so this is a genuine fault. An
         ask-shaped question is still a knowledge question. */
      if (asks) return { intent: "knowledge", target: null, source: "rules", why: "retrieval unavailable" };
      hit = null;
    }
    if (!hit) {
      return { intent: inDomain(t) ? "productivity" : "outofdomain", target: null,
               source: "rules", why: "retrieval unavailable" };
    }

    /* Matching at all is not the test: BM25 will always find some overlap.
       The best passage has to be relevant enough to be worth quoting. */
    const top = bestScore(hit);
    if (hit.sources.length && top >= CORPUS_FLOOR) {
      return { intent: "knowledge", target: null, source: "rules",
               why: hit.sources.length + " document(s) matched, top " + top.toFixed(1) };
    }
    /* Weak overlap plus an ask-shaped question is still a question for the
       corpus, and the honest "nothing in here covers that" is the answer. */
    if (asks && inDomain(t)) {
      return { intent: "knowledge", target: null, source: "rules",
               why: "in domain question, weak corpus match (" + top.toFixed(1) + ")" };
    }
    /* Nothing visible matched, but something relevant was withheld. That
       is still a knowledge question, and the refusal is the answer.

       The relevance floor applies here too. Without it, any query at all
       routes to knowledge the moment a restricted document scrapes a
       point of incidental overlap, which is how "who won the football"
       ended up being treated as a question about the corpus. */
    const blockedTop = (hit.blocked && hit.blocked[0] && typeof hit.blocked[0].score === "number")
      ? hit.blocked[0].score : 0;
    if (blockedTop >= CORPUS_FLOOR) {
      return { intent: "knowledge", target: null, source: "rules",
               why: "matched, withheld on access (" + blockedTop.toFixed(1) + ")" };
    }

    /* A making verb on its own is not enough. "Write me a poem about the
       sea" and "write a note for the customer" are the same verb, and
       only one of them is this product's business. inDomain() already
       requires the verb to be aimed at something in the workplace. */
    if (inDomain(t)) {
      return { intent: "productivity", target: null, source: "rules", why: "in domain, no corpus match" };
    }
    return { intent: "outofdomain", target: null, source: "rules", why: "no domain vocabulary" };
  }

  /* ---------------------------------------------------------------
     the LLM classifier
  --------------------------------------------------------------- */

  function classifierMessages(text) {
    const role = currentRole();
    const ops = operatorRuns().map(r =>
      '  { "id": "' + r.id + '", "runs_in_titan": "' + r.title + '", "does": "' + r.what + '" }').join("\n");
    const tasks = taskRuns().map(r =>
      '  { "id": "' + r.id + '", "task": "' + r.label + '", "produces": "' + r.what + '" }').join("\n");

    const sys =
      "You are the intent router for " + (Config.company.name) + "'s internal assistant. " +
      "You classify one message. You do not answer it, and you do not do the work.\n\n" +
      "Reply with JSON only, no prose and no code fence:\n" +
      '{"intent":"...","target":"...","why":"..."}\n\n' +
      "intent is exactly one of:\n" +
      '  "operator"     the person is asking for work to be DONE in the company\'s own systems.\n' +
      '                 target must be one of the operator ids below.\n' +
      '  "task"         a guided task exists that would finish this properly and produce a record.\n' +
      '                 target must be one of the task ids below.\n' +
      '  "knowledge"    a question about a standard, a test method, a procedure, accreditation,\n' +
      '                 certification, safety, commercial or compliance detail that the\n' +
      '                 company\'s own documents should answer. target must be "".\n' +
      '  "productivity" general help inside the domain that no internal document would carry:\n' +
      '                 drafting an email or note, explaining a general engineering concept,\n' +
      '                 summarising, planning, rewording. target must be "".\n' +
      '  "outofdomain"  nothing to do with this business or this industry. target must be "".\n\n' +
      "Decide by what the person WANTS, not by subject matter. \"What does a type test certificate cover\" " +
      "is knowledge. \"Issue the certificate\" is operator. The same noun appears in both.\n\n" +
      "Prefer knowledge when genuinely unsure: answering from a document is always safe, and " +
      "starting the wrong task or driving the wrong system is not.\n\n" +
      "OPERATOR IDS:\n" + ops + "\n\nTASK IDS:\n" + tasks + "\n\n" +
      "PARAMS. Only when intent is \"operator\", also pull out the values the run needs, using\n" +
      "exactly these keys. Include a key ONLY if the message actually states it. Never guess and\n" +
      "never fill in a plausible default: a missing value gets asked for later, and a wrong one\n" +
      "is written into the dealer management system.\n" + fieldsBlock() + "\n\n" +
      "The person asking is a " + role.title + " in " + role.dept + ".";

    return [{ role: "system", content: sys }, { role: "user", content: String(text || "") }];
  }

  /** The parameter keys each operator run accepts, for the classifier. */
  function fieldsBlock() {
    return operatorRuns().map(r => {
      const fs = (OP_DEPT[r.id] && OP_DEPT[r.id].fields) || [];
      if (!fs.length) return "";
      return "  " + r.id + ": " + fs.map(f =>
        f.id + " (" + (f.kind || "text") + (f.options ? ", one of: " + f.options.join(" | ") : "") + ")"
      ).join(", ");
    }).filter(Boolean).join("\n");
  }

  function parseDecision(raw) {
    const s = String(raw || "");
    const m = s.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      const o = JSON.parse(m[0]);
      if (!o || INTENTS.indexOf(o.intent) === -1) return null;
      const params = {};
      if (o.params && typeof o.params === "object") {
        Object.keys(o.params).forEach(k => {
          const v = o.params[k];
          if (v !== null && v !== undefined && String(v).trim()) params[k] = String(v).trim();
        });
      }
      return { intent: o.intent, target: String(o.target || "") || null,
               why: String(o.why || ""), params: params };
    } catch (e) { return null; }
  }

  /* ---------------------------------------------------------------
     pulling the run's parameters out of what was actually asked
     ------------------------------------------------------------
     Whatever is found here is what the Operator fills in. Whatever is
     not found is NOT invented: the run stops at the step that needs it
     and asks in its own chat. That is the difference between a replay
     and something worth watching.
  --------------------------------------------------------------- */

  function extractParams(kind, id, text) {
    if (kind === "task") return extractJourney(id, text);
    if (kind !== "operator") return {};
    const d = OP_DEPT[id];
    if (!d || !d.fields) return {};
    const t = String(text || "");
    const out = {};

    d.fields.forEach(f => {
      const v = grab(f, t, d.fields);
      if (v) out[f.id] = v;
    });
    return out;
  }

  /* ---------------------------------------------------------------
     guided tasks
     ------------------------------------------------------------
     A journey step is already a field declaration: it has an id, a
     type, a question and, where it is a choice, the closed set of
     answers. So the same reading is done against the step itself and
     nothing extra has to be maintained per journey.

     The same rule applies as everywhere else: only what the request
     actually said. A step that cannot be read is left unanswered and
     the person is asked it, which is what a guided task is for.
  --------------------------------------------------------------- */
  function extractJourney(id, text) {
    const j = (typeof Journeys !== "undefined") ? Journeys.find(id) : null;
    if (!j || !j.steps) return {};
    const t = String(text || "");
    const out = {};

    j.steps.forEach(step => {
      const v = grabStep(step, t, j.steps);
      if (v !== undefined && v !== null && v !== "") out[step.id] = v;
    });
    return out;
  }

  /** Option values, whatever shape the journey wrote them in, plus the
      short label where one exists: a person writes "red", not "Red — now". */
  function optionForms(step) {
    return (step.options || []).map(o => {
      if (o && typeof o === "object") return { v: o.v, forms: [o.v, o.t, o.d].filter(Boolean) };
      return { v: o, forms: [o] };
    }).filter(x => x.v !== undefined && x.v !== null && x.v !== "");
  }

  /** The words that introduce this step's answer. Explicit `lead` wins;
      otherwise they are derived from the step's own question, which is
      usually written in exactly the words a person would use. */
  const LEAD_SKIP = /^(what|which|does|will|your|have|been|this|that|they|them|with|from|into|when|where|kind|much|many|need|needs|there|before|after|else|are|and|the|any)$/;
  function stepLead(step) {
    if (step.lead && step.lead.length) return step.lead.slice();
    return terms(step.q || "").filter(w => w.length > 3 && !LEAD_SKIP.test(w)).slice(0, 4);
  }

  /* Things people write in a recognisable shape whatever the question was
     worded like. Checked before the free-text reader, because "on RO-118402"
     is a repair order however the step phrased the question. */
  const readRO = t => { const m = t.match(/\b((?:RO|WO|JOB)[-\s]?\d{3,})\b/i);
                        return m ? m[1].toUpperCase().replace(/\s/g, "-") : ""; };
  const readOdo = t => { const m = t.match(/\b(\d{2,3}[,\s]?\d{3})\s*(?:km|kms|miles)?\b/i);
                         return m ? m[1].replace(/[,\s]/g, "") : ""; };
  /* An identifier is segments of letters and digits joined by hyphens,
     carrying at least one digit and at least one letter. That is a plant
     tag (HT-412), a loan account (LN-CV-2026-0118420), a registration
     (MH-31-CQ-4482), a complaint (CMS-2026-0084713) and a return
     (DNBS-04A). It is not a date: a date has no letters in it. */
  const ID_SHAPE = "[A-Za-z0-9]{1,8}(?:-[A-Za-z0-9]{1,8}){1,5}";
  function identifiersIn(t) {
    const out = [];
    const re = new RegExp("\\b" + ID_SHAPE + "\\b", "g");
    let m;
    while ((m = re.exec(t))) {
      if (/\d/.test(m[0]) && /[A-Za-z]/.test(m[0])) out.push({ v: m[0].toUpperCase(), at: m.index });
    }
    return out;
  }

  /** Which of the identifiers in a sentence this field is about.

      Prefer the one this field's own words introduce. Failing that, take
      one that no OTHER field's words introduce. And if every candidate
      plainly belongs to somebody else, return nothing, so the run stops
      and asks rather than recording the account number as the vehicle. */
  function pickIdentifier(t, mine, others) {
    const found = identifiersIn(t);
    if (!found.length) return "";
    const near = (at, words) => {
      const before = t.slice(Math.max(0, at - 26), at).toLowerCase();
      return (words || []).some(w => {
        const x = String(w).toLowerCase();
        return x.length > 2 && new RegExp("\\b" + esc4re(x) + "\\b[^\\w]{0,4}$").test(before);
      });
    };
    const own = found.find(c => near(c.at, mine));
    if (own) return own.v;
    const free = found.find(c => !near(c.at, others));
    return free ? free.v : "";
  }

  const readPlate = (t, ctx) => pickIdentifier(t, (ctx && ctx.mine) || [], (ctx && ctx.others) || []);
  const readPart = t => { const m = t.match(/\b([0-9A-Z]{3,}(?:[-\s][0-9A-Z]{2,}){1,3})\b/);
                          return (m && /\d/.test(m[1])) ? m[1].trim() : ""; };
  const readMoney = t => { const m = t.match(/(?:^|[^\w-])\$\s?([\d][\d,]*(?:\.\d{2})?)/);
                           return m ? money(m[1]) : ""; };
  /* Enterprise identifiers: TO-31842, WO-00412, Q-08841, CO-00731 */
  const readRef = t => { const m = t.match(/\b([A-Z]{1,3}-\d{2,6}(?:-\d{2,6})?)\b/);
                         return m ? m[1] : ""; };
  const readCampaign = t => { const m = t.match(/\b(\d{2}[A-Z]{1,2}-?\d{2,4})\b/);
                              if (m) return m[1];
                              const v = t.match(/\bVIN\s*\.{0,3}\s*([A-Z0-9]{4,17})\b/i);
                              return v ? "VIN …" + v[1] : ""; };

  /* A question can legitimately accept more than one shape: "Vehicle and
     registration?" is answered by either. The readers are tried in order
     and the first that finds something wins. */
  /** A loan, account or facility identifier, as a lending system writes it. */
  function readAssetId(t, ctx) {
    return pickIdentifier(t, (ctx && ctx.mine) || [], (ctx && ctx.others) || []);
  }

  const SHAPES = [
    { when: /which asset|\basset\b|which unit|\bunit\b|equipment|which truck|which machine|which conveyor/i,
      read: [readAssetId] },
    { when: /recall|campaign reference/i, read: [readCampaign] },
    { when: /repair order|\bro\b|job (?:number|card)|work order/i, read: [readRO] },
    { when: /which project|project or|test order|which campaign|which order|reference number/i, read: [readRef] },
    { when: /odomet|mileage|kilometre|\bkm\b/i, read: [readOdo] },
    { when: /part number|part no\b/i, read: [readPart] },
    { when: /vehicle|which car|registration|rego|number plate/i, read: [vehicle, readPlate] },
    { when: /total|quoted|cost|value|amount|figure|price/i, read: [readMoney] },
  ];

  function grabStep(step, t, siblings) {
    const low = t.toLowerCase();
    const kind = step.type || "text";

    if (kind === "choice" || kind === "multi") {
      /* Exact only. A wrong selection is written into a record and read as
         fact; an unanswered one is simply asked. Fuzzy matching here chose
         "Scheduled service" out of the phrase "a service booking", which is
         exactly the sort of quiet wrongness this must never do. */
      const hits = optionForms(step)
        .filter(o => o.forms.some(f => low.indexOf(String(f).toLowerCase()) !== -1))
        .map(o => o.v);
      if (!hits.length) return "";
      return kind === "multi" ? hits : hits[0];
    }

    if (kind === "confirm") {
      /* only where the question's own subject is present, or "is this a
         safety-critical defect" would be answered by any stray "yes" */
      const flat = low.replace(/[-_/]+/g, " ");
      const near = stepLead(step).some(w => flat.indexOf(String(w).replace(/[-_/]+/g, " ")) !== -1);
      if (!near) return "";
      const yes = /\b(yes|yeah|yep|it is|confirmed|there is|has an?|it'?s)\b/i.test(t);
      const no = /\b(no|not|isn'?t|does ?n'?t|without|none|nothing)\b/i.test(t);
      if (yes && !no) return true;
      if (no && !yes) return false;
      return "";
    }

    if (kind === "date") {
      const m = t.match(/\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/);
      if (m) return m[1];
      if (/\b(today|this morning|this afternoon)\b/i.test(t)) return "today";
      return "";
    }

    /* A shape that recognises the question owns the answer. If the question
       asks for a value and the request carries no value, the answer is "not
       stated" — falling through to the free-text reader here is how "Value
       of the return?" came back as the word "for". */
    const q = String(step.q || "");
    for (let k = 0; k < SHAPES.length; k++) {
      if (!SHAPES[k].when.test(q)) continue;
      const ctx = {
        mine: stepLead(step),
        others: (siblings || []).filter(x => x.id !== step.id)
          .reduce((a, x) => a.concat(stepLead(x)), []),
      };
      for (let n = 0; n < SHAPES[k].read.length; n++) {
        const v = SHAPES[k].read[n](t, ctx);
        if (v) return v;
      }
      return "";
    }

    if (kind === "number") {
      const near = hintRe({ hints: stepLead(step) }, "[^.,;]{0,20}?(?:^|[^\\w-])([\\d][\\d,]*)");
      const m = near ? t.match(near) : null;
      return m ? m[1].replace(/,/g, "") : "";
    }

    /* free text */
    const f = { id: step.id, label: q || step.id, lead: stepLead(step) };
    return quoted(t) || afterHint(f, t, (siblings || []).map(x => ({
      id: x.id, lead: stepLead(x),
    })));
  }

  function grab(f, t, siblings) {
    const low = t.toLowerCase();

    /* an option list is a closed set, so match against it directly */
    if (f.options) {
      const hit = f.options.find(o => low.indexOf(String(o).toLowerCase()) !== -1);
      if (hit) return hit;
      const loose = f.options.find(o => {
        const words = terms(o).filter(w => w.length > 4);
        return words.length && words.filter(w => low.indexOf(w) !== -1).length >= Math.ceil(words.length / 2);
      });
      if (loose) return loose;
    }

    if (f.kind === "money") {
      /* prefer a figure that is actually introduced as this field, so
         "authorised to 500 on a 2019 SUV" does not read 2019 as money */
      /* the number has to start a token: without this, "write off against
         RO-117318" read the repair order number as the amount */
      const near = hintRe(f, "[^.,;]{0,26}?(?:^|[^\\w-])(\\$?\\s?[\\d][\\d,]*(?:\\.\\d{2})?)");
      const m1 = near ? t.match(near) : null;
      if (m1) return money(m1[1]);
      const m2 = t.match(/(?:^|[^\w-])\$\s?([\d][\d,]*(?:\.\d{2})?)/);
      if (m2) return money(m2[1]);
      return "";
    }

    if (f.kind === "id") {
      /* An identifier is a shape, not a phrase: segments of letters and
         digits joined by hyphens, carrying at least one digit and at
         least one letter. That covers a plant tag (HT-412), an account
         (LN-CV-2026-0118420), a registration (MH-31-CQ-4482) and a
         return (DNBS-04A), and excludes a date, which has no letters.

         Read as free text an identifier ran on to the next field's lead
         word and put "HT-412, the operator is" into the record. Matched
         with too short a shape it silently truncated LN-CV-2026-0118420
         to CV-2026, which is worse: that still looks like an account
         number, it is simply somebody else's. So a shape that matches is
         authoritative, and one that does not returns nothing rather than
         falling through, and the run stops and asks. */
      return pickIdentifier(t,
        (f.hints || []).concat(f.lead || []),
        (siblings || []).filter(x => x.id !== f.id)
          .reduce((a, x) => a.concat(x.hints || [], x.lead || []), []));
    }

    if (f.kind === "number") {
      const near = hintRe(f, "[^.,;]{0,20}?(?:^|[^\\w-])(\\d{1,4})");
      const m1 = near ? t.match(near) : null;
      if (m1) return m1[1];
      /* A unit usually follows its figure: "42 months", "22 people",
         "3 vehicles". The field already lists those words as its own
         hints, so read them from there rather than from a hardcoded
         list that is the same thing written out again and drifts. */
      const units = (f.hints || []).map(esc4re).filter(Boolean);
      if (units.length) {
        const after = t.match(new RegExp("\\b(\\d{1,4})\\s*(?:" + units.join("|") + ")\\b", "i"));
        if (after) return after[1];
      }
      const m2 = t.match(/\b(\d{1,4})\s*(?:weeks?|wks?|days?|hours?|hrs?)\b/i);
      if (m2) return m2[1];
      return "";
    }

    /* dates, in the formats a dealership actually types */
    if (f.id === "from" || /date/i.test(f.label)) {
      const m = t.match(/\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/);
      if (m) return m[1];
      const m2 = t.match(/\b(?:from|since)\s+(?:the\s+)?([A-Za-z]+\s+\d{4}|\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)/i);
      if (m2) return m2[1];
      return "";
    }

    /* a part number is a shape, not a phrase */
    if (f.id === "part") {
      const m = t.match(/\b([0-9A-Z]{3,}(?:[-\s][0-9A-Z]{2,}){1,3})\b/);
      if (m && /\d/.test(m[1])) return m[1].trim();
      return quoted(t) || afterHint(f, t, siblings);
    }

    /* A test object arrives as its own clause rather than after a lead
       word: "..., 145 kV SF6 circuit breaker to IEC 62271-100, at
       Milan". Take the clause that names a piece of equipment, then let
       the usual truncation cut it at the next field. */
    if (f.id === "object") {
      const EQUIP = /(circuit[- ]?breakers?|breakers?|switchgear|switchboards?|transformers?|cable systems?|cables?|\bgis\b|disconnectors?|switches|relays?|\bieds?\b|meters?|arresters?|bushings?|insulators?|reactors?|converters?|solar cells?|capacitor banks?)/i;
      const clause = (t.split(/[,;]/).find(x => EQUIP.test(x)) || "").trim();
      if (clause) {
        /* The clause usually carries the instruction too: "build a quote
           for a 400 kV cable system" is an instruction plus an object.
           A rating is the reliable left edge of the object; without one,
           walk back from the equipment noun over its own describing
           words and stop at the instruction. */
        const INSTR = /^(build|quote|quoted|price|priced|issue|certify|certified|test|tested|testing|schedule|record|raise|open|publish|release|create|make|get|need|want|run|please|can|could|would|we|i|you|this|that|for|on|of|to|with|a|an|the|and|our|their|its)$/i;
        let from = -1;
        const rating = clause.match(/\d[\d.,]*\s*(?:kV|kA|MVA|kVA|MW|V|A)\b/i);
        if (rating) from = clause.indexOf(rating[0]);
        if (from < 0) {
          const eq = clause.match(EQUIP);
          if (eq) {
            const head = clause.slice(0, clause.indexOf(eq[0]));
            const words = head.split(/\s+/).filter(Boolean);
            let back = 0;
            while (back < 3 && words.length - 1 - back >= 0 && !INSTR.test(words[words.length - 1 - back])) back++;
            const keep = back ? words.slice(words.length - back).join(" ") : "";
            from = keep ? head.lastIndexOf(keep) : head.length;
          }
        }
        const cut = from >= 0 ? clause.slice(from) : clause;
        const v = stopAtNextField(f, cut.replace(/^\s*(?:for|on|of|a|an|the)\b\s*/i, "").trim(), siblings);
        if (v.length >= 3 && terms(v).length) return v;
      }
      return afterHint(f, t, siblings);
    }

    /* A standard reference. Read by shape, not by the clause after a
       lead word: "to IEC 62271-100 2021 edition" anchored on the lead
       "to iec" and handed back the reference with the IEC cut off. */
    if (f.id === "standard" || /\bstandard\b/i.test(f.label || "")) {
      const m = t.match(/\b((?:ISO\/IEC|IEC\/IEEE|IEC|IEEE|CENELEC|EN|ANSI|ISO|OIML)\s*[A-Z]{0,3}\s?\d{3,5}(?:[-\u2013]\d{1,4})*(?:\s*:\s*\d{4})?(?:\s+\d{4})?(?:\s+edition)?)/i);
      if (m) return m[1].replace(/\s+/g, " ").trim();
      return afterHint(f, t, siblings);
    }

    /* a repair order or job reference */
    if (f.id === "ro") {
      const m = t.match(/\b((?:RO|WO|JOB)[-\s]?\d{3,})\b/i);
      if (m) return m[1].toUpperCase().replace(/\s/g, "-");
      return afterHint(f, t, siblings);
    }

    /* a stock number, or failing that the vehicle itself */
    if (f.id === "unit") {
      const m = t.match(/\b([NU]-\d{4,})\b/i);
      if (m) return m[1].toUpperCase();
      const veh = vehicle(t);
      if (veh) return veh;
      return afterHint(f, t, siblings);
    }

    if (f.id === "vehicle") {
      const veh = vehicle(t);
      if (veh) return veh;
      const reg = t.match(/\b([A-Z]{2,3}[-\s]?\d{2,4}[A-Z]?)\b/);
      if (reg) return reg[1];
      return "";
    }

    /* a person: "for Mrs Halloran", "customer is Halloran" */
    if (f.id === "customer") {
      const m = t.match(/\b(?:for|customer(?:\s+is)?|client(?:\s+is)?|on behalf of)\s+((?:Mr|Mrs|Ms|Miss|Dr)\.?\s+)?([A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)?)/);
      if (m) return ((m[1] || "") + m[2]).trim();
      return "";
    }

    /* free text: anything quoted, or whatever follows the hint word */
    return quoted(t) || afterHint(f, t, siblings);
  }

  /** "2022 SUV 2.0T", "2019 dual-cab" - a year followed by a description. */
  function vehicle(t) {
    const m = t.match(/\b((?:19|20)\d{2}\s+[A-Za-z][\w-]*(?:\s+[\w.\/-]+){0,3})/);
    return m ? m[1].trim() : "";
  }

  function quoted(t) {
    const m = t.match(/["“]([^"”]{4,140})["”]/);
    return m ? m[1].trim() : "";
  }

  /** A pattern anchored on any of the field's own hint words. */
  function hintRe(f, tail) {
    const hints = (f.hints || []).map(esc4re).filter(Boolean);
    if (!hints.length) return null;
    return new RegExp("(?:" + hints.join("|") + ")" + tail, "i");
  }

  /** The clause after a LEAD word.

      Lead words and hint words are different things and conflating them
      was a real bug. "Noise" is a hint that a message is about a service
      concern, but it is part of the value, not an introduction to it:
      anchoring on it turned "concern is a rumbling noise from the front"
      into "from the front". Only `lead` introduces a value. */
  function afterHint(f, t, siblings) {
    const leads = (f.lead || []).slice().sort((a, b) => b.length - a.length);
    for (let i = 0; i < leads.length; i++) {
      const re = new RegExp("\\b" + esc4re(leads[i]) +
        "\\b(?:\\s+(?:is|are|was|of|to|as|a|an|the|says?|said|reports?|reported|describes?))*[:,]?\\s+([^.;\\n]{3,180})", "i");
      /* The LAST occurrence of the lead word, not the first. "issue the
         change order for order TO-31842" anchored on the first "order"
         and captured "for order TO-31842". The lead nearest the value
         is the one that introduces it.

         The tail of `re` runs greedily to the end of the clause, so a
         plain global exec finds one match and stops. The occurrences
         have to be located first, then the pattern applied at each. */
      const finder = new RegExp("\\b" + esc4re(leads[i]) + "\\b", "gi");
      const at = [];
      let f2;
      while ((f2 = finder.exec(t))) {
        at.push(f2.index);
        if (finder.lastIndex === f2.index) finder.lastIndex++;
      }
      for (let k = at.length - 1; k >= 0; k--) {
        const m = t.slice(at[k]).match(re);
        if (!m || m.index !== 0) continue;
        const v = stopAtNextField(f, m[1].trim(), siblings);
        /* Truncating at the next field can leave a scrap: "return for part
           number ..." cut at "part" leaves "for". A value has to carry at
           least one word that means something. */
        if (v.length >= 3 && terms(v).length) return v;
      }
    }
    return "";
  }

  /** One clause per field. A value runs until the next field starts, so
      "concern is a rumbling noise, authorised up to $600" does not put
      the authorisation into the concern. */
  /* Connectives that join one clause to the next. None of them can be
     part of a name, a reference or a description, so wherever one
     appears the value has already ended. Without this, a lead word with
     no following field to cut on swallowed the rest of the sentence. */
  const CLAUSE_END = /\s+(?:through to|so that|in order to|and then|so we can|before |after |ready for|up to sanction)\b/i;

  function stopAtNextField(f, v, siblings) {
    const clause = v.search(CLAUSE_END);
    if (clause > 2) v = v.slice(0, clause).trim();
    /* Only this department's other fields. Cutting on every department's
       lead words meant "a rumbling noise FROM the front" was truncated by
       the Reports date field, which has nothing to do with this run. */
    const others = [];
    const optCuts = [];
    (siblings || []).forEach(x => {
      if (x.id === f.id) return;
      (x.lead || []).forEach(l => { if (String(l).length > 3) others.push(l); });

      /* A closed option list makes a short lead word safe to cut on.
         Cutting on a bare "at" would wreck free text, but cutting on
         "at Milan", where Milan is one of that field's own options,
         cannot. Without this, "IEC 62271-100 2021 edition, at Milan"
         went into the standard field whole. */
      if (x.options) {
        const opts = x.options
          .map(o => esc4re(typeof o === "string" ? o : (o.v || o.t || "")))
          .filter(Boolean).join("|");
        if (!opts) return;
        const shorts = (x.lead || []).filter(l => String(l).length <= 3).map(esc4re);
        const pre = shorts.length ? "(?:(?:" + shorts.join("|") + ")\\s+)?" : "";
        optCuts.push(new RegExp("[,;]?\\s+" + pre + "(?:" + opts + ")\\b", "i"));
      }
    });
    let cut = v.length;
    others.concat(["and then", "then", "also", "after that"]).forEach(w => {
      const m = v.match(new RegExp("[,;]?\\s+" + esc4re(w) + "\\b", "i"));
      if (m && m.index >= 0 && m.index < cut) cut = m.index;
    });
    optCuts.forEach(re => {
      const m = v.match(re);
      if (m && m.index >= 0 && m.index < cut) cut = m.index;
    });
    return v.slice(0, cut).replace(/[,;:\s]+$/, "").trim();
  }

  function money(raw) {
    const n = String(raw).replace(/[^\d.]/g, "");
    if (!n) return "";
    const parts = n.split(".");
    const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return "$" + whole + (parts[1] ? "." + parts[1].slice(0, 2) : "");
  }

  function esc4re(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  /* ---------------------------------------------------------------
     route
  --------------------------------------------------------------- */

  /** Classify, then validate against the real registry. Anything the
      model returns that does not resolve is discarded, not repaired. */
  async function route(text, opts) {
    const o = opts || {};
    const fallback = rulesClassify(text);
    if (fallback.intent === "operator" || fallback.intent === "task") {
      fallback.params = extractParams(fallback.intent, fallback.target, text);
    }

    if (o.rulesOnly || !Keys.get(S.provider)) return fallback;

    let decision = null;
    try {
      const raw = await LLM.once(classifierMessages(text), { maxTokens: 200, temperature: 0 });
      decision = parseDecision(raw);
    } catch (e) {
      return Object.assign({}, fallback, { note: "classifier unavailable, routed on rules" });
    }
    if (!decision) return Object.assign({}, fallback, { note: "classifier returned nothing usable" });

    if (decision.intent === "operator" || decision.intent === "task") {
      const run = findRun(decision.intent, decision.target);
      if (!run) {
        /* the model named something that does not exist, or that this role
           may not run. Never launch on it. */
        return Object.assign({}, fallback, { note: "classifier named an unknown target" });
      }
      /* Parameters are read out of the message the same way whichever
         classifier ran, and the model's own reading is merged on top only
         where the pattern reader found nothing. Neither is allowed to
         invent: a field that appears in neither stays empty and the run
         stops and asks for it. */
      const params = Object.assign(
        {}, decision.params || {}, extractParams(decision.intent, run.id, text));
      /* a value the model returned for a step that does not exist is
         discarded here rather than being handed to the task */
      if (decision.intent === "task") {
        const j = Journeys.find(run.id);
        const ids = new Set(((j && j.steps) || []).map(x => x.id));
        Object.keys(params).forEach(k => { if (!ids.has(k)) delete params[k]; });
      }
      return { intent: decision.intent, target: run.id, source: "llm",
               why: decision.why, params: params };
    }
    return { intent: decision.intent, target: null, source: "llm", why: decision.why };
  }

  /* ---------------------------------------------------------------
     what the person sees
  --------------------------------------------------------------- */

  const INTENT_LABEL = {
    knowledge: "Knowledge base",
    task: "Guided task",
    /* filled from the edition at read time, see intentLabel() */
    operator: "",
    productivity: "General assistance",
    outofdomain: "Out of scope",
  };
  function intentLabel(k) {
    return INTENT_LABEL[k] || (k === "operator" ? String(Config.operatorSystem || "the system") : k);
  }

  function badge(decision) {
    if (!decision) return "";
    return '<span class="rt-badge" data-i="' + decision.intent + '">' +
      Icons.svg(decision.intent === "operator" ? "monitor"
        : decision.intent === "task" ? "checklist"
        : decision.intent === "productivity" ? "spark"
        : decision.intent === "outofdomain" ? "info" : "database") +
      esc(intentLabel(decision.intent)) + "</span>";
  }

  /** The card offering an Operator run, shown in the transcript. */
  function operatorCard(run, launched) {
    return '<div class="rt-run" data-kind="operator" style="--rc:' + run.color + '">' +
      '<div class="rt-run__h"><span class="rt-run__ic">' + Icons.svg("monitor") + "</span>" +
        '<span class="rt-run__t"><b>' + esc(run.title) + "</b>" +
        "<span>" + esc(run.what) + "</span></span>" +
        '<span class="rt-run__meta">' + run.steps + " steps</span></div>" +
      '<div class="rt-run__f">' +
        '<button class="btn btn-sm btn-primary" onclick="Router.launch(\'operator\',\'' + escJs(run.id) + '\')">' +
          Icons.el(launched ? "refresh" : "arrowright") + (launched ? "Run again" : "Watch it run") + "</button>" +
        '<span class="rt-run__note">' + (launched
          ? "Running in " + esc(String(Config.operatorSystem)) + " now."
          : "Opens a browser session and drives " + esc(String(Config.operatorSystem)) + ".") + "</span>" +
      "</div></div>";
  }

  /** The card offering a guided task. */
  function taskCard(run, launched) {
    return '<div class="rt-run" data-kind="task">' +
      '<div class="rt-run__h"><span class="rt-run__ic">' +
        Icons.svg(Icons.has(run.icon) ? run.icon : "checklist") + "</span>" +
        '<span class="rt-run__t"><b>' + esc(run.label) + "</b>" +
        "<span>" + esc(run.what) + "</span></span>" +
        (run.est ? '<span class="rt-run__meta">' + esc(run.est) + "</span>" : "") + "</div>" +
      '<div class="rt-run__f">' +
        '<button class="btn btn-sm btn-primary" onclick="Router.launch(\'task\',\'' + escJs(run.id) + '\')">' +
          Icons.el("arrowright") + (launched ? "Start again" : "Start") + "</button>" +
        '<span class="rt-run__note">Produces a record you can hand on.</span>' +
      "</div></div>";
  }

  function actionMarkup(action) {
    if (!action) return "";
    const run = findRun(action.kind, action.id);
    if (!run) return "";
    return action.kind === "operator" ? operatorCard(run, action.launched) : taskCard(run, action.launched);
  }

  function launch(kind, id, params) {
    const run = findRun(kind, id);
    if (!run) return;
    if (kind === "operator") { Operator.open(run.id, params || {}); return; }
    Journeys.start(run.id, params || {});
  }

  /* ---------------------------------------------------------------
     the "get something done" wall on the welcome screen
  --------------------------------------------------------------- */

  /** Guided tasks and Operator runs together. They are the same thing to
      the person using it: work that finishes, rather than an answer. */
  function cardsMarkup(taskLimit, opLimit) {
    const tasks = taskRuns().slice(0, taskLimit || 4);
    const ops = operatorRuns().slice(0, opLimit || 3);
    if (!tasks.length && !ops.length) return "";

    let out = "";
    if (tasks.length) {
      out += '<div class="jn-cards">' + tasks.map(r =>
        '<button class="jn-card" onclick="Router.launch(\'task\',\'' + escJs(r.id) + '\')">' +
          '<span class="jn-cic">' + Icons.el(Icons.has(r.icon) ? r.icon : "checklist") + "</span>" +
          '<span class="jn-cm"><span class="jn-ct">' + esc(r.label) + "</span>" +
          (r.what ? '<span class="jn-cs">' + esc(r.what) + "</span>" : "") + "</span>" +
          (r.est ? '<span class="jn-cest">' + esc(r.est) + "</span>" : "") +
        "</button>").join("") + "</div>";
    }
    if (ops.length) {
      out += '<div class="wl-sec"><span class="i">' + Icons.svg("monitor") + "</span>RUN IT IN " +
        esc(String(Config.operatorSystem || "the system").toUpperCase()) + "</div>" +
        '<div class="jn-cards jn-cards--op">' + ops.map(r =>
        '<button class="jn-card jn-card--op" onclick="Router.launch(\'operator\',\'' + escJs(r.id) + '\')" ' +
          'style="--rc:' + r.color + '">' +
          '<span class="jn-cic">' + Icons.el("monitor") + "</span>" +
          '<span class="jn-cm"><span class="jn-ct">' + esc(r.title) + "</span>" +
          '<span class="jn-cs">' + esc(r.what) + "</span></span>" +
          '<span class="jn-cest">' + r.steps + " steps</span>" +
        "</button>").join("") + "</div>";
    }
    return out;
  }

  /* ---------------------------------------------------------------
     the replies the router writes itself
  --------------------------------------------------------------- */

  function operatorReply(run) {
    const sys = String(Config.operatorSystem || "the system");
    return "That is work in " + sys + " rather than a question, so I will do it rather than describe it.\n\n" +
      "**" + run.title + "** — " + run.what + " I am opening a browser session and driving " + sys + " through it " +
      "now, one control at a time. " + run.steps + " steps. You can pause it at any point.";
  }

  function taskReply(run) {
    return "There is a guided task for this, which is better than an answer because it produces a record you can " +
      "hand on.\n\n**" + run.label + "** — " + run.what + " I will take you through it. Every rule it applies is " +
      "quoted from " + Config.company.short + "'s own procedures, so you can see why you are being asked for each thing.";
  }

  function outOfDomainReply() {
    return "That is outside what I cover. I am " + Config.company.short + "'s internal assistant, so I work across " +
      "the group's own test methods and standards, accreditation and quality documents, laboratory procedures, " +
      "certification rules, consulting methodologies and commercial governance — plus general help inside the " +
      "domain like drafting a customer note or explaining a concept.\n\nIf you meant something about the business, " +
      "ask it again with a bit more context and I will pick it up.";
  }

  /** Appended to the system prompt when the answer cannot come from the
      corpus. The point is that the answer must not be dressed up as one
      that has a document behind it. */
  function productivityDirective() {
    return "ROUTING NOTE. This message was classified as general assistance: it is inside the domain " +
      "but no internal document covers it, and none was retrieved. Answer it from your own knowledge and do the " +
      "work asked for — draft the text, explain the concept, produce the outline.\n\n" +
      "Two absolute rules for this answer:\n" +
      "1. Do not cite, quote or imply any " + Config.company.short + " document, policy or procedure. There are no " +
      "sources for this answer. Never invent a document id.\n" +
      "2. Where the answer touches anything the company would have its own rule about — a figure, a limit, an " +
      "authority, an acceptance criterion, a safety procedure — say plainly that this is general guidance and that " +
      "the company's own document governs, and name who owns it.\n\n" +
      "Every hard limit in your instructions still applies in full.";
  }

  return {
    route: route, rulesClassify: rulesClassify, launch: launch,
    extractParams: extractParams, extractJourney: extractJourney,
    operatorRuns: operatorRuns, taskRuns: taskRuns, findRun: findRun,
    badge: badge, actionMarkup: actionMarkup, cardsMarkup: cardsMarkup,
    operatorReply: operatorReply, taskReply: taskReply, outOfDomainReply: outOfDomainReply,
    productivityDirective: productivityDirective,
    INTENTS: INTENTS, INTENT_LABEL: INTENT_LABEL, CORPUS_FLOOR: CORPUS_FLOOR,
    /* exposed for the tests */
    _terms: terms, _runScore: runScore, _classifierMessages: classifierMessages,
    _parseDecision: parseDecision, _inDomain: inDomain, _domainVocab: domainVocab,
  };
})();
