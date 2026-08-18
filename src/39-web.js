/* ------------------------------------------------------------------
   Web search.

   The knowledge base is the company's memory. It is, by definition, a
   closed world: it cannot know what a regulator published this morning or
   what a competitor announced last week. Web search is the second
   retrieval channel, and it is deliberately built the same way as the
   first — search, rank, cite, show your work — rather than handed to the
   model as an opaque tool call. The presenter can point at the trace and
   say which source said what, and when.

   Everything here is keyless and callable from a browser. That is not a
   compromise, it is the requirement: the deliverable is one HTML file
   with no backend, and an enterprise buyer is entitled to see exactly
   which hosts it contacts. Settings lists them, every one is a public
   read-only endpoint, and no user identity is ever sent.

   Each connector's CORS behaviour was verified against a live request
   rather than assumed. Endpoints move, so a connector that fails is
   reported in the trace and the answer continues without it.
   ------------------------------------------------------------------ */

const Web = (function(){

  const TIMEOUT_MS = 7000;      /* per connector */
  const READER = "https://r.jina.ai/";

  /* Strip the markup that several of these APIs return inside their
     snippets, without letting any of it reach the renderer. */
  function plain(s, max){
    const out = String(s || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function(m, e){
        const map = { amp:"&", lt:"<", gt:">", quot:'"', apos:"'", nbsp:" " };
        if(e.charAt(0) === "#"){
          const n = e.charAt(1).toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
          return isFinite(n) && n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : " ";
        }
        return map[e.toLowerCase()] !== undefined ? map[e.toLowerCase()] : " ";
      })
      .replace(/\s+/g, " ")
      .trim();
    const cap = max || 460;
    return out.length > cap ? out.slice(0, cap).replace(/\s+\S*$/, "") + "…" : out;
  }

  function siteOf(url){
    const m = /^https?:\/\/([^/?#]+)/i.exec(String(url || ""));
    return m ? m[1].replace(/^www\./, "") : "";
  }

  /* Same page reached by http and https, with and without a trailing slash
     and with tracking parameters, is one result. */
  function normUrl(url){
    let u = String(url || "").trim();
    u = u.replace(/^http:/i, "https:")
         .replace(/[?&](utm_[^=]+|ref|fbclid|gclid)=[^&#]*/gi, "")
         .replace(/[?&]$/, "")
         .replace(/#.*$/, "")
         .replace(/\/+$/, "");
    return u.toLowerCase();
  }

  async function getJson(url, signal){
    const ctrl = new AbortController();
    const timer = setTimeout(function(){ ctrl.abort(); }, TIMEOUT_MS);
    const onAbort = function(){ ctrl.abort(); };
    if(signal && signal.addEventListener) signal.addEventListener("abort", onAbort);
    try{
      const res = await fetch(url, { signal: ctrl.signal, headers: { "Accept": "application/json" } });
      if(!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    }finally{
      clearTimeout(timer);
      if(signal && signal.removeEventListener) signal.removeEventListener("abort", onAbort);
    }
  }

  /* ================= connectors =================
     kinds is presentation only: it tells the reader what a source is good
     for, which matters when six results arrive from six different worlds. */

  const CONNECTORS = [
    {
      id: "wikipedia",
      name: "Wikipedia",
      host: "en.wikipedia.org",
      kind: "Reference",
      note: "Background, definitions and entities. The fastest way to establish what something is.",
      async run(q, signal){
        const url = "https://en.wikipedia.org/w/rest.php/v1/search/page?q=" +
                    encodeURIComponent(q) + "&limit=6";
        const data = await getJson(url, signal);
        return (data.pages || []).map(function(p){
          return {
            title: p.title,
            url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(p.key),
            snippet: plain(p.excerpt || p.description || ""),
            kind: "Reference",
          };
        });
      },
    },

    {
      id: "duckduckgo",
      name: "DuckDuckGo",
      host: "api.duckduckgo.com",
      kind: "Web",
      note: "Direct answers and official sites. Anonymous: no identifier is sent with the query.",
      async run(q, signal){
        const url = "https://api.duckduckgo.com/?q=" + encodeURIComponent(q) +
                    "&format=json&no_html=1&skip_disambig=1";
        const data = await getJson(url, signal);
        const out = [];
        if(data.AbstractText && data.AbstractURL){
          out.push({
            title: data.Heading || siteOf(data.AbstractURL),
            url: data.AbstractURL,
            snippet: plain(data.AbstractText),
            kind: data.AbstractSource ? "Web · " + data.AbstractSource : "Web",
          });
        }
        if(data.Definition && data.DefinitionURL){
          out.push({
            title: (data.Heading || q) + " — definition",
            url: data.DefinitionURL,
            snippet: plain(data.Definition),
            kind: "Definition",
          });
        }
        const flatten = function(list){
          (list || []).forEach(function(t){
            if(t.Topics) return flatten(t.Topics);
            if(!t.FirstURL || !t.Text) return;
            out.push({ title: plain(t.Text, 90), url: t.FirstURL, snippet: plain(t.Text), kind: "Web" });
          });
        };
        flatten(data.Results);
        flatten(data.RelatedTopics);
        return out.slice(0, 8);
      },
    },

    {
      id: "openalex",
      name: "OpenAlex",
      host: "api.openalex.org",
      kind: "Research",
      note: "Peer-reviewed literature across every field, with abstracts. The strongest evidence a keyless source can give.",
      async run(q, signal){
        const url = "https://api.openalex.org/works?search=" + encodeURIComponent(q) +
                    "&per-page=5&sort=relevance_score:desc";
        const data = await getJson(url, signal);
        return (data.results || []).map(function(w){
          const loc = w.primary_location || {};
          const venue = (loc.source && loc.source.display_name) || "";
          return {
            title: w.display_name || w.title || "Untitled work",
            url: w.doi || loc.landing_page_url || w.id,
            snippet: plain(invertAbstract(w.abstract_inverted_index)) ||
                     [venue, w.publication_year, (w.cited_by_count || 0) + " citations"].filter(Boolean).join(" · "),
            date: w.publication_date || (w.publication_year ? String(w.publication_year) : ""),
            kind: venue ? "Research · " + venue : "Research",
          };
        });
      },
    },

    {
      id: "crossref",
      name: "Crossref",
      host: "api.crossref.org",
      kind: "Research",
      note: "The DOI registry: published papers, standards and reports, with citable references.",
      async run(q, signal){
        const url = "https://api.crossref.org/works?query=" + encodeURIComponent(q) +
                    "&rows=5&select=title,URL,abstract,issued,container-title,type";
        const data = await getJson(url, signal);
        return ((data.message || {}).items || []).map(function(w){
          const parts = ((w.issued || {})["date-parts"] || [[]])[0] || [];
          return {
            title: (w.title || [])[0] || "Untitled",
            url: w.URL,
            snippet: plain(w.abstract || "") || (w["container-title"] || [])[0] || "",
            date: parts.length ? parts.slice(0, 3).map(function(n, i){ return i ? String(n).padStart(2, "0") : n; }).join("-") : "",
            kind: "Research" + (w.type ? " · " + String(w.type).replace(/-/g, " ") : ""),
          };
        });
      },
    },

    {
      id: "stackexchange",
      name: "Stack Overflow",
      host: "api.stackexchange.com",
      kind: "Technical",
      note: "Practitioner answers to concrete technical problems.",
      async run(q, signal){
        const url = "https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=" +
                    encodeURIComponent(q) + "&site=stackoverflow&pagesize=5";
        const data = await getJson(url, signal);
        return (data.items || []).map(function(it){
          return {
            title: plain(it.title),
            url: it.link,
            snippet: [
              it.is_answered ? "Answered" : "Unanswered",
              (it.score || 0) + " votes",
              (it.answer_count || 0) + " answers",
              (it.tags || []).slice(0, 5).join(", "),
            ].filter(Boolean).join(" · "),
            date: it.creation_date ? new Date(it.creation_date * 1000).toISOString().slice(0, 10) : "",
            kind: "Technical",
          };
        });
      },
    },

    {
      id: "hackernews",
      name: "Hacker News",
      host: "hn.algolia.com",
      kind: "Industry",
      note: "What the technology industry is discussing, and the articles it is discussing.",
      async run(q, signal){
        const url = "https://hn.algolia.com/api/v1/search?query=" + encodeURIComponent(q) +
                    "&hitsPerPage=5&tags=story";
        const data = await getJson(url, signal);
        return (data.hits || []).filter(function(h){ return h.title; }).map(function(h){
          return {
            title: h.title,
            url: h.url || ("https://news.ycombinator.com/item?id=" + h.objectID),
            snippet: plain(h.story_text || "") ||
                     [(h.points || 0) + " points", (h.num_comments || 0) + " comments"].join(" · "),
            date: (h.created_at || "").slice(0, 10),
            kind: "Industry",
          };
        });
      },
    },
  ];

  /* OpenAlex stores abstracts as a word -> positions map for licensing
     reasons. Rebuilding the sentence is a few lines and turns a useless
     field into the best snippet in the result set. */
  function invertAbstract(index){
    if(!index || typeof index !== "object") return "";
    const words = [];
    Object.keys(index).forEach(function(w){
      (index[w] || []).forEach(function(pos){ words[pos] = w; });
    });
    return words.join(" ").replace(/\s+/g, " ").trim();
  }

  const BY_ID = {};
  CONNECTORS.forEach(function(c){ BY_ID[c.id] = c; });

  /* An edition may add its own connector: same shape, its own run(). That
     is how a customer's internal search endpoint gets in without touching
     src/. */
  function registry(){
    const extra = (Config.web.extra || []).filter(function(c){ return c && c.id && typeof c.run === "function"; });
    return CONNECTORS.concat(extra);
  }
  function connector(id){
    return BY_ID[id] || registry().find(function(c){ return c.id === id; }) || null;
  }
  /* The edition sets the opening position; S holds what the customer chose
     afterwards, so a handed-over file remembers its own configuration. */
  function enabled(){
    const want = S.webConnectors || [];
    return registry().filter(function(c){ return want.indexOf(c.id) !== -1; });
  }
  function toggleConnector(id){
    const want = (S.webConnectors || []).slice();
    const at = want.indexOf(id);
    if(at === -1) want.push(id); else want.splice(at, 1);
    S.webConnectors = want;
    savePrefs();
  }
  function hosts(){
    const list = enabled().map(function(c){ return c.host; }).filter(Boolean);
    if(S.webRead) list.push("r.jina.ai");
    return Array.from(new Set(list));
  }

  /* ================= ranking =================
     Reciprocal rank fusion across the connectors, nudged by how much of
     the question each result actually mentions. RRF is the standard way to
     merge ranked lists that have no comparable scores, which is exactly
     the situation: a Wikipedia rank and a Crossref rank mean different
     things and cannot be added. */

  const RRF_K = 8;

  function lexicalOverlap(result, terms){
    if(!terms.length) return 0;
    const hay = Retrieval.tokenize(result.title + " " + result.snippet);
    if(!hay.length) return 0;
    const set = new Set(hay);
    let hits = 0;
    terms.forEach(function(t){ if(set.has(t)) hits++; });
    return hits / terms.length;
  }

  function rank(groups, query, topK){
    const terms = Retrieval.tokenize(query);
    const merged = Object.create(null);

    groups.forEach(function(g){
      g.results.forEach(function(r, i){
        if(!r || !r.url || !r.title) return;
        const key = normUrl(r.url);
        if(!key) return;
        if(!merged[key]){
          merged[key] = {
            title: String(r.title).trim(),
            url: r.url,
            site: siteOf(r.url),
            snippet: r.snippet || "",
            date: r.date || "",
            kind: r.kind || g.connector.kind || "Web",
            from: [],
            score: 0,
          };
        }
        const rec = merged[key];
        rec.score += 1 / (RRF_K + i + 1);
        if(rec.from.indexOf(g.connector.name) === -1) rec.from.push(g.connector.name);
        /* keep the longest snippet: different sources describe the same
           page with wildly different amounts of usable text */
        if((r.snippet || "").length > rec.snippet.length) rec.snippet = r.snippet;
        if(!rec.date && r.date) rec.date = r.date;
      });
    });

    const list = Object.keys(merged).map(function(k){ return merged[k]; });
    list.forEach(function(r){
      r.score = r.score * (1 + 0.9 * lexicalOverlap(r, terms)) * (r.from.length > 1 ? 1.15 : 1);
    });
    list.sort(function(a, b){ return b.score - a.score; });

    const out = list.slice(0, topK);
    const top = out.length ? out[0].score : 1;
    out.forEach(function(r, i){
      r.n = i + 1;
      r.relevance = Math.round(clamp(r.score / (top || 1), 0, 1) * 100);
    });
    return out;
  }

  /* ================= deep read =================
     A snippet is enough to know a page is relevant and rarely enough to
     answer from. When reading is enabled the top results are fetched as
     text so the model quotes the page rather than the search result. */
  async function read(url, signal){
    const ctrl = new AbortController();
    const timer = setTimeout(function(){ ctrl.abort(); }, TIMEOUT_MS + 4000);
    if(signal && signal.addEventListener) signal.addEventListener("abort", function(){ ctrl.abort(); });
    try{
      const res = await fetch(READER + String(url).replace(/^https?:\/\//i, "https://"),
                              { signal: ctrl.signal, headers: { "Accept": "text/plain" } });
      if(!res.ok) throw new Error("HTTP " + res.status);
      const body = await res.text();
      return String(body).replace(/\n{3,}/g, "\n\n").slice(0, 9000);
    }finally{
      clearTimeout(timer);
    }
  }

  async function readTop(results, signal){
    const depth = clamp(parseInt(Config.web.readCount, 10) || 2, 1, 3);
    const targets = results.slice(0, depth);
    await Promise.all(targets.map(async function(r){
      try{
        const body = await read(r.url, signal);
        if(body && body.length > 200){
          r.full = body;
          r.read = true;
        }
      }catch(err){
        r.readError = (err && err.name === "AbortError") ? "timed out" : "could not be read";
      }
    }));
    return results;
  }

  /* ================= the search ================= */

  async function search(query, opts){
    opts = opts || {};
    const started = Date.now();
    const list = enabled();
    const topK = clamp(parseInt(S.webTopK, 10) || 5, 3, 10);

    if(!list.length){
      return { results: [], connectors: [], ms: 0, query: query,
               error: "No web sources are switched on. Settings › Search." };
    }

    const runs = await Promise.all(list.map(async function(c){
      const t0 = Date.now();
      try{
        const results = await c.run(query, opts.signal);
        return { connector: c, results: (results || []).filter(Boolean), ms: Date.now() - t0, error: null };
      }catch(err){
        const why = (err && err.name === "AbortError") ? "timed out"
                  : /Failed to fetch|NetworkError|Load failed/i.test((err && err.message) || "") ? "unreachable from the browser"
                  : (err && err.message) || "failed";
        return { connector: c, results: [], ms: Date.now() - t0, error: why };
      }
    }));

    const results = rank(runs, query, topK);

    if(S.webRead && results.length){
      try{ await readTop(results, opts.signal); }catch(err){ /* reading is best effort */ }
    }

    return {
      query: query,
      results: results,
      connectors: runs.map(function(r){
        return { id: r.connector.id, name: r.connector.name, host: r.connector.host,
                 count: r.results.length, ms: r.ms, error: r.error };
      }),
      ms: Date.now() - started,
      read: !!S.webRead,
    };
  }

  /* ================= when to search =================
     Auto mode has to be explainable, so it is a rule the presenter can
     state out loud rather than a model call: search the web when the
     question reaches outside the company, or when the corpus barely
     covered it. The reason is carried through to the trace. */

  /* Every rule here names something a static corpus provably cannot hold:
     what is current, what is happening outside, what an external body
     requires, what something costs today.

     There is deliberately no rule for question form. "What is our leave
     policy" is phrased identically to "what is a herbicide group", and a
     rule matching "what is" fired on almost every internal question — which
     would mean searching the web to answer questions the company had already
     written down. General knowledge is covered by the coverage test below
     instead: if the corpus did not really answer it, the web gets a turn. */
  const EXTERNAL = [
    [/\b(latest|newest|up to date|right now|today|yesterday|this (week|month)|as of (today|now))\b/i,
     "the question asks for what is current"],
    [/\b(news|headlines|announced|announcement|launch(ed|es)?|released|published|reported|acquisition|merger)\b/i,
     "the question is about recent events"],
    [/\b(competitors?|market share|industry (trend|benchmark)|benchmark against|state of the art)\b/i,
     "the question looks outside the company"],
    /* the digit runs are +, not single: a trailing \b after one digit can
       never match the second digit of "ISO 9001" */
    [/\b(regulation|legislation|directive|statutory|ISO ?\d+|IEC ?\d+|AS\/NZS|EN ?\d{3,})\b/i,
     "the question concerns external rules"],
    [/\b(price of|market price|share price|spot price|exchange rate|forecast for|weather)\b/i,
     "the question asks for a live figure"],
  ];

  /* A year at or beyond this one is a question about now. An older year is
     usually a reference to a document the corpus already holds, so it is not
     a reason to search. Computed rather than written down, because a
     hard-coded year is a demo that quietly rots. */
  function namesCurrentYear(query){
    const found = String(query).match(/\b(20\d\d)\b/g);
    if(!found) return false;
    const now = new Date().getFullYear();
    return found.some(function(y){ return parseInt(y, 10) >= now; });
  }

  function shouldSearch(query, kbStats){
    if(S.web === "off") return { yes: false };
    if(S.web === "on") return { yes: true, why: "web search is switched on" };

    for(const rule of EXTERNAL){
      if(rule[0].test(query)) return { yes: true, why: rule[1] };
    }
    if(namesCurrentYear(query)) return { yes: true, why: "the question names a specific year" };
    if(kbStats && kbStats.matched === 0){
      return { yes: true, why: "nothing in the knowledge base matched" };
    }
    if(kbStats && kbStats.topCoverage !== undefined && kbStats.topCoverage < 0.34){
      return { yes: true, why: "the knowledge base covered the question only thinly" };
    }
    return { yes: false };
  }

  /* ================= mode control ================= */

  const MODES = [
    { id: "off",  label: "Web search off",     hint: "Answers come from the knowledge base alone." },
    { id: "on",   label: "Web search on",      hint: "Every question also searches the web." },
    { id: "auto", label: "Web search on auto", hint: "SARA searches the web when a question reaches outside the company." },
  ];

  function mode(){ return MODES.find(function(m){ return m.id === S.web; }) || MODES[0]; }

  function cycle(){
    const order = ["off", "on", "auto"];
    S.web = order[(order.indexOf(S.web) + 1) % order.length];
    savePrefs();
    syncButton();
    const m = mode();
    toast(m.label + ". " + m.hint, S.web === "off" ? "info" : "ok", 3800);
  }

  function set(id){
    if(["off", "on", "auto"].indexOf(id) === -1) return;
    S.web = id;
    savePrefs();
    syncButton();
  }

  function syncButton(){
    const btn = el("webBtn");
    if(!btn) return;
    const m = mode();
    btn.classList.toggle("on", S.web === "on");
    btn.classList.toggle("auto", S.web === "auto");
    btn.setAttribute("data-tip", m.label + " · click to change");
    btn.setAttribute("aria-pressed", S.web !== "off" ? "true" : "false");
    const lbl = el("webBtnLabel");
    if(lbl) lbl.textContent = S.web === "auto" ? "Web · auto" : "Web";
  }

  return {
    search: search, read: read, rank: rank,
    shouldSearch: shouldSearch,
    connectors: registry, enabled: enabled, connector: connector, hosts: hosts,
    toggleConnector: toggleConnector,
    cycle: cycle, set: set, mode: mode, modes: MODES, syncButton: syncButton,
    plain: plain, siteOf: siteOf, normUrl: normUrl, invertAbstract: invertAbstract,
    MODES: MODES,
  };
})();
