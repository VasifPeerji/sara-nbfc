/* ------------------------------------------------------------------
   Retrieval.

   Real BM25 over the edition's corpus, not a decorative "searching..."
   animation. Documents are chunked at build-of-index time, scored per
   chunk, then collapsed to the best chunk per document.

   Access control happens BEFORE scoring: a document the signed-in role is
   not cleared for is never retrieved and never reaches the model. Blocked
   documents are still counted so the assistant can say "there are three
   documents I can see but you are not cleared for" and route the person
   to the owner. That refusal is the point, not a side effect.
   ------------------------------------------------------------------ */

const STOPWORDS = new Set(("a about above after again against all am an and any are aren as at be because been before " +
  "being below between both but by can cannot could couldn did didn do does doesn doing don down during each few for " +
  "from further had hadn has hasn have haven having he her here hers herself him himself his how i if in into is isn " +
  "it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over " +
  "own same shan she should shouldn so some such than that the their theirs them themselves then there these they this " +
  "those through to too under until up very was wasn we were weren what when where which while who whom why will with " +
  "won would wouldn you your yours yourself yourselves please tell show give need want get got make made using use " +
  "us let s t re ve ll d m o").split(" "));

/* Light stemmer. Enough to bind plural/tense variants without a real
   morphological analyser, and safe on domain nouns. */
function stem(w){
  if(w.length <= 3) return w;
  if(/[^aeiou]ies$/.test(w)) return w.slice(0, -3) + "y";
  if(/(ches|shes|sses|xes|zes)$/.test(w)) return w.slice(0, -2);
  if(/[^s]s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  if(/(ing)$/.test(w) && w.length > 6) return w.slice(0, -3);
  if(/(ed)$/.test(w) && w.length > 5) return w.slice(0, -2);
  return w;
}

function tokenize(text){
  return String(text || "")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .split(/[^a-z0-9'&/-]+/)
    .map(function(t){ return t.replace(/^[-'/&]+|[-'/&]+$/g, ""); })
    .filter(function(t){ return t && t.length > 1 && !STOPWORDS.has(t); })
    .map(stem);
}

const Retrieval = (function(){

  const CHUNK_WORDS = 150;      /* target chunk size */
  const CHUNK_MIN   = 45;       /* below this, merge forward */
  const K1 = 1.4, B = 0.72;

  let chunks = [];
  let df = Object.create(null);
  let avgLen = 1;
  let synonyms = Object.create(null);

  /* ---------- index build ---------- */
  function splitBody(body){
    const paras = String(body || "").split(/\n\s*\n/).map(function(p){ return p.trim(); }).filter(Boolean);
    const out = [];
    let buf = [], count = 0;
    paras.forEach(function(p){
      const n = p.split(/\s+/).length;
      if(count && count + n > CHUNK_WORDS){ out.push(buf.join("\n\n")); buf = []; count = 0; }
      buf.push(p); count += n;
    });
    if(buf.length) out.push(buf.join("\n\n"));
    /* merge a trailing runt into the previous chunk */
    if(out.length > 1 && out[out.length - 1].split(/\s+/).length < CHUNK_MIN){
      const last = out.pop();
      out[out.length - 1] += "\n\n" + last;
    }
    return out.length ? out : [String(body || "")];
  }

  /* Everything the index covers. Files the person attached are documents
     like any other: same chunking, same scoring, same citations. They are
     tagged so access control and the trace can tell them apart, and so a
     file attached in one conversation never surfaces in another. */
  function corpus(){
    const extra = (typeof Attachments !== "undefined") ? Attachments.asDocs() : [];
    return Config.kb.concat(extra);
  }

  function buildSynonyms(docs){
    synonyms = Object.create(null);
    const add = function(from, to){
      const k = stem(String(from).toLowerCase());
      if(!k) return;
      synonyms[k] = synonyms[k] || [];
      tokenize(to).forEach(function(t){ if(synonyms[k].indexOf(t) === -1) synonyms[k].push(t); });
    };
    /* glossary works in both directions: acronym -> expansion and back */
    (Config.glossary || []).forEach(function(g){
      if(!g || !g.term) return;
      add(g.term, g.def || "");
      tokenize(g.def || "").forEach(function(t){ add(t, g.term); });
    });
    /* document titles teach the index that an id implies its subject */
    docs.forEach(function(d){ if(d.id) add(d.id, d.title); });
  }

  function build(){
    chunks = [];
    df = Object.create(null);
    const docs = corpus();

    docs.forEach(function(doc){
      const parts = splitBody(doc.body);
      parts.forEach(function(text, i){
        const titleTokens = tokenize(doc.title);
        const tagTokens   = tokenize((doc.tags || []).join(" ") + " " + (doc.cat || "") + " " + (doc.owner || ""));
        const bodyTokens  = tokenize(text);

        /* field weighting is done by repeating high-value fields into the
           term vector rather than scoring fields separately */
        const terms = Object.create(null);
        const push = function(list, weight){
          list.forEach(function(t){ terms[t] = (terms[t] || 0) + weight; });
        };
        push(bodyTokens, 1);
        push(titleTokens, 3);
        push(tagTokens, 2);

        chunks.push({
          doc: doc,
          part: i,
          parts: parts.length,
          text: text,
          terms: terms,
          len: bodyTokens.length + titleTokens.length * 3 + tagTokens.length * 2,
          attachment: !!doc.attachment,
        });
      });
    });

    chunks.forEach(function(c){
      Object.keys(c.terms).forEach(function(t){ df[t] = (df[t] || 0) + 1; });
    });
    avgLen = chunks.length ? chunks.reduce(function(n, c){ return n + c.len; }, 0) / chunks.length : 1;

    buildSynonyms(docs);
    return chunks.length;
  }

  /* ---------- query ---------- */
  function expand(queryTokens){
    const out = queryTokens.slice();
    const weights = Object.create(null);
    queryTokens.forEach(function(t){ weights[t] = 1; });
    queryTokens.forEach(function(t){
      (synonyms[t] || []).forEach(function(s){
        if(weights[s] === undefined){ out.push(s); weights[s] = 0.45; }   /* expansions count less */
      });
    });
    return { tokens: out, weights: weights };
  }

  function idf(term){
    const n = chunks.length || 1;
    const d = df[term] || 0;
    return Math.log(1 + (n - d + 0.5) / (d + 0.5));
  }

  /* Freshness nudge so a 2019 memo does not outrank this year's revision. */
  function recencyBoost(dateStr){
    if(!dateStr) return 1;
    const t = Date.parse(dateStr);
    if(isNaN(t)) return 1;
    const years = (Date.now() - t) / (365.25 * 86400000);
    if(years <= 0.5) return 1.12;
    if(years <= 1.5) return 1.06;
    if(years <= 3) return 1;
    return 0.93;
  }

  function visibleTo(doc, role){
    /* a file the person attached themselves is theirs to read; clearance
       governs the company's documents, not the person's own */
    if(doc.attachment) return true;
    if(doc.clearance > (role.clearance || 1)) return false;
    /* a document with no scopes is company-wide reference material */
    if(!doc.scopes || !doc.scopes.length) return true;
    const scopes = role.scopes || [];
    return doc.scopes.some(function(s){ return scopes.indexOf(s) !== -1; });
  }

  /* Why a document was withheld — drives the routing message. */
  function denyReason(doc, role){
    if(doc.clearance > (role.clearance || 1)){
      return { kind: "clearance", label: (CLEARANCE[doc.clearance] || {}).label || "Restricted" };
    }
    const names = (Config.scopeLabels || {});
    return { kind: "scope", label: (doc.scopes || []).map(s => names[s] || s).join(", ") };
  }

  function search(query, opts){
    opts = opts || {};
    const role = opts.role || currentRole();
    const topK = opts.topK || 5;
    const started = (typeof performance !== "undefined" ? performance.now() : Date.now());

    const qTokens = tokenize(query);
    if(!qTokens.length){
      return { sources: [], blocked: [], stats: {
        scanned: chunks.length, docs: Config.kb.length, matched: 0,
        blocked: 0, attached: 0, topCoverage: 0, ms: 0, terms: [],
      } };
    }
    const ex = expand(qTokens);

    const scored = [];
    const blockedDocs = Object.create(null);
    const convoId = opts.convoId || null;

    chunks.forEach(function(c){
      /* an attachment belongs to the conversation it was dropped into;
         it must never surface in a different thread */
      if(c.attachment && convoId && c.doc.convoId !== convoId) return;

      let score = 0, hits = 0;
      ex.tokens.forEach(function(t){
        const f = c.terms[t];
        if(!f) return;
        hits++;
        const norm = f * (K1 + 1) / (f + K1 * (1 - B + B * (c.len / avgLen)));
        score += idf(t) * norm * (ex.weights[t] || 1);
      });
      if(score <= 0) return;

      /* a chunk covering more of the question beats one repeating a single term */
      const coverage = hits / ex.tokens.length;
      score *= (0.62 + 0.38 * coverage) * recencyBoost(c.doc.updated);

      if(!visibleTo(c.doc, role)){
        const cur = blockedDocs[c.doc.id];
        if(!cur || cur.score < score){
          blockedDocs[c.doc.id] = { doc: c.doc, score: score, reason: denyReason(c.doc, role) };
        }
        return;
      }
      scored.push({ chunk: c, score: score, hits: hits, coverage: coverage });
    });

    /* best chunk per document */
    const bestByDoc = Object.create(null);
    scored.forEach(function(s){
      const id = s.chunk.doc.id;
      if(!bestByDoc[id] || bestByDoc[id].score < s.score) bestByDoc[id] = s;
    });

    let ranked = Object.keys(bestByDoc).map(function(k){ return bestByDoc[k]; })
      .sort(function(a, b){ return b.score - a.score; });

    /* Relative cut-off: drop the long tail of weak matches so the model is
       not handed noise, but never drop everything. An attached file is
       exempt: the person is holding it, so a weak match is still the
       document they mean. */
    if(ranked.length){
      const top = ranked[0].score;
      ranked = ranked.filter(function(r, i){
        return i === 0 || r.chunk.attachment || r.score >= top * 0.24;
      });
    }
    const topCoverage = ranked.length ? ranked[0].coverage : 0;

    /* Reserve slots for attached files. Without this a forty-document
       corpus quietly outscores the PDF someone dropped in ten seconds ago,
       and "summarise this" answers about something else entirely. */
    const reserve = clamp(parseInt(Config.attachments.reserve, 10) || 0, 0, 4);
    if(reserve && ranked.length > topK){
      const attached = ranked.filter(function(r){ return r.chunk.attachment; }).slice(0, reserve);
      const head = ranked.slice(0, topK);
      const missing = attached.filter(function(a){ return head.indexOf(a) === -1; });
      if(missing.length){
        const room = Math.max(0, topK - attached.length);
        const rest = ranked.filter(function(r){ return attached.indexOf(r) === -1; }).slice(0, room);
        ranked = attached.concat(rest).sort(function(a, b){ return b.score - a.score; });
      }
    }
    ranked = ranked.slice(0, topK);

    const sources = ranked.map(function(r, i){
      const d = r.chunk.doc;
      return {
        n: i + 1,
        id: d.id,
        title: d.title,
        cat: d.cat,
        owner: d.owner,
        updated: d.updated,
        rev: d.rev,
        system: d.system,
        clearance: d.clearance,
        part: r.chunk.part + 1,
        parts: r.chunk.parts,
        text: r.chunk.text,
        attachment: !!d.attachment,
        score: r.score,
        relevance: 0,       /* filled below, normalised for display */
        terms: qTokens,
      };
    });
    const top = sources.length ? sources[0].score : 1;
    sources.forEach(function(s){ s.relevance = Math.round(clamp(s.score / (top || 1), 0, 1) * 100); });

    /* Only report a withheld document if it was genuinely competitive.
       Without this, almost every answer would claim documents were withheld
       on the strength of one shared word, which both cheapens the refusal
       and misleads the person asking. */
    let blocked = Object.keys(blockedDocs).map(function(k){ return blockedDocs[k]; })
      .sort(function(a, b){ return b.score - a.score; });
    if(blocked.length){
      const bestVisible = ranked.length ? ranked[0].score : 0;
      const bestOverall = Math.max(bestVisible, blocked[0].score);
      blocked = blocked.filter(function(b){ return b.score >= bestOverall * 0.28; }).slice(0, 4);
    }

    const ms = Math.max(1, Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - started));
    return {
      sources: sources,
      blocked: blocked,
      stats: {
        scanned: chunks.length,
        docs: Config.kb.length,
        matched: ranked.length,
        blocked: blocked.length,
        attached: sources.filter(function(s){ return s.attachment; }).length,
        /* how much of the question the best passage actually covered.
           Auto web search reads this: a corpus that matched only one term
           in seven has not really answered anything. */
        topCoverage: topCoverage,
        ms: ms,
        terms: qTokens,
      },
    };
  }

  /* ---------- snippets ---------- */
  /* Highest-density window of query terms, for the source card preview. */
  function snippet(text, terms, maxWords){
    const words = String(text).split(/\s+/);
    const want = maxWords || 34;
    if(words.length <= want) return text;
    const set = new Set(terms.map(stem));
    let bestAt = 0, bestScore = -1;
    for(let i = 0; i + 8 < words.length; i += 4){
      let score = 0;
      for(let j = i; j < Math.min(i + want, words.length); j++){
        const t = stem(words[j].toLowerCase().replace(/[^a-z0-9']/g, ""));
        if(set.has(t)) score++;
      }
      if(score > bestScore){ bestScore = score; bestAt = i; }
    }
    const slice = words.slice(bestAt, bestAt + want).join(" ");
    return (bestAt > 0 ? "… " : "") + slice + (bestAt + want < words.length ? " …" : "");
  }

  /* Wrap query terms in <mark>. Input is escaped first by the caller. */
  function highlight(escapedHtml, terms){
    if(!terms || !terms.length) return escapedHtml;
    const uniq = Array.from(new Set(terms.filter(function(t){ return t && t.length > 2; })));
    if(!uniq.length) return escapedHtml;
    /* match the stem as a prefix so "resistant" highlights for "resistance" */
    const pattern = uniq.map(function(t){
      return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join("|");
    let re;
    try{ re = new RegExp("\\b(" + pattern + ")([a-z]{0,4})\\b", "gi"); }
    catch(e){ return escapedHtml; }
    return escapedHtml.replace(re, "<mark>$1$2</mark>");
  }

  return {
    build: build,
    search: search,
    snippet: snippet,
    highlight: highlight,
    visibleTo: visibleTo,
    tokenize: tokenize,
    corpus: corpus,
    get size(){ return chunks.length; },
  };
})();
