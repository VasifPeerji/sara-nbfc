/* Web search: connectors, fusion, and the line between company knowledge
   and the open internet.

   Every payload below is the real response shape, taken from a live call to
   that endpoint rather than invented, because the thing that breaks a
   connector is never the code — it is an API returning a field where you
   expected an array.

   Run:  node test/test_web.js [edition]
*/
const H = require("./harness");
const edition = process.argv[2] || "nbfc";
H.loadEdition(edition);
H.loadSrc();

console.log(`\n  SARA web-search tests — edition "${edition}"`);

/* ================= stubbed endpoints ================= */

const PAYLOADS = {
  "en.wikipedia.org": {
    pages: [
      { id: 966470, key: "Lolium", title: "Lolium",
        excerpt: 'often called <span class="searchmatch">ryegrass</span>, but this term is',
        description: "genus of grasses" },
      { id: 12, key: "Herbicide_resistance", title: "Herbicide resistance",
        excerpt: "resistance to a herbicide", description: null },
    ],
  },
  "api.duckduckgo.com": {
    Heading: "Ryegrass",
    Abstract: "", AbstractText: "Ryegrass is a genus of tufted grasses.",
    AbstractURL: "https://en.wikipedia.org/wiki/Lolium", AbstractSource: "Wikipedia",
    Definition: "", DefinitionURL: "",
    Results: [{ FirstURL: "https://example.gov.au/ryegrass", Text: "Ryegrass management — Official site" }],
    RelatedTopics: [
      { FirstURL: "https://example.org/annual", Text: "Annual ryegrass, a winter grass" },
      { Topics: [{ FirstURL: "https://example.org/nested", Text: "Nested topic entry here" }] },
      { Name: "no url here" },
    ],
  },
  "api.openalex.org": {
    results: [
      { id: "https://openalex.org/W1", doi: "https://doi.org/10.1000/abc",
        display_name: "Resistance mechanisms in Lolium rigidum",
        publication_date: "2025-04-02", publication_year: 2025, cited_by_count: 42,
        primary_location: { source: { display_name: "Weed Science" }, landing_page_url: "https://ws.example/1" },
        abstract_inverted_index: { "Target": [0], "site": [1], "resistance": [2], "is": [3], "widespread": [4] } },
    ],
  },
  "api.crossref.org": {
    message: { items: [
      { title: ["Managing resistant ryegrass"], URL: "https://doi.org/10.1000/xyz",
        abstract: "<jats:p>A field study across 40 sites.</jats:p>",
        issued: { "date-parts": [[2024, 9, 3]] },
        "container-title": ["Crop Protection"], type: "journal-article" },
    ] },
  },
  "api.stackexchange.com": {
    items: [{ title: "How do I index a &amp; b?", link: "https://stackoverflow.com/q/1",
              score: 12, answer_count: 3, is_answered: true,
              tags: ["mysql", "indexing"], creation_date: 1700000000 }],
  },
  "hn.algolia.com": {
    hits: [
      { objectID: "1", title: "A story with a url", url: "https://example.com/story", points: 90, num_comments: 12,
        created_at: "2026-01-05T00:00:00Z" },
      { objectID: "2", title: "A story with no url", url: null, points: 5, num_comments: 1,
        created_at: "2026-01-06T00:00:00Z" },
      { objectID: "3", title: null },
    ],
  },
};

let calls = [];
let failing = new Set();

function stubFetch(){
  calls = [];
  global.fetch = function(url){
    calls.push(String(url));
    const host = (/^https?:\/\/([^/?#]+)/.exec(String(url)) || [])[1] || "";
    if(failing.has(host)) return Promise.reject(new TypeError("Failed to fetch"));
    const body = PAYLOADS[host];
    if(!body) return Promise.resolve({ ok: false, status: 404, statusText: "Not Found" });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  };
}

const ALL = ["wikipedia", "duckduckgo", "openalex", "crossref", "stackexchange", "hackernews"];

async function main(){
  S.user = Config.users[0];
  S.role = Config.roleByKey[S.user.roleKey];

  /* ---------- helpers ---------- */
  H.section("Text and URL handling");
  {
    H.eq(Web.plain('<span class="searchmatch">ryegrass</span> &amp; more'), "ryegrass & more",
         "markup is stripped and entities decoded before anything is rendered");
    H.eq(Web.plain("<script>alert(1)</script>hello"), "alert(1) hello",
         "a script tag cannot survive as markup");
    H.eq(Web.plain("x".repeat(600)).length <= 462, true, "long snippets are capped");
    H.eq(Web.siteOf("https://www.example.com/a/b?c=1"), "example.com", "site strips www and path");

    H.eq(Web.normUrl("http://Example.com/page/"), Web.normUrl("https://example.com/page"),
         "http/https, trailing slash and case all normalise to one key");
    H.eq(Web.normUrl("https://x.com/a?utm_source=y"), "https://x.com/a",
         "tracking parameters are dropped so the same page dedupes");
    H.eq(Web.normUrl("https://x.com/a#frag"), "https://x.com/a", "fragments are dropped");

    H.eq(Web.invertAbstract({ "Target": [0], "site": [1], "resistance": [2] }), "Target site resistance",
         "OpenAlex inverted abstracts are rebuilt into a sentence");
    H.eq(Web.invertAbstract(null), "", "a missing abstract is empty, not a crash");
  }

  /* ---------- connectors ---------- */
  H.section("Every connector parses its real response shape");
  {
    stubFetch();
    S.webConnectors = ALL.slice();
    S.webRead = false;
    S.webTopK = 10;

    const out = await Web.search("ryegrass resistance");
    H.eq(out.connectors.length, 6, "all six connectors ran");
    H.eq(out.connectors.filter(c => c.error).length, 0, "none errored");
    H.eq(calls.length, 6, "one request each, no retries");
    H.ok(calls.every(u => u.indexOf("ryegrass%20resistance") !== -1 || u.indexOf("ryegrass+resistance") !== -1),
         "the query is url-encoded into every request");

    const byUrl = {};
    out.results.forEach(r => { byUrl[r.url] = r; });

    H.ok(out.results.some(r => /wikipedia\.org\/wiki\/Lolium/.test(r.url)), "wikipedia result present");
    H.ok(out.results.some(r => r.url === "https://example.gov.au/ryegrass"), "duckduckgo Results entry present");
    H.ok(out.results.some(r => r.url === "https://example.org/nested"), "nested RelatedTopics are flattened");
    H.ok(out.results.some(r => r.url === "https://doi.org/10.1000/abc"), "openalex prefers the DOI as the url");
    H.ok(out.results.some(r => r.url === "https://doi.org/10.1000/xyz"), "crossref result present");
    H.ok(out.results.some(r => r.url === "https://stackoverflow.com/q/1"), "stack overflow result present");
    H.ok(out.results.some(r => r.url === "https://example.com/story"), "hn story with a url uses the article");
    H.ok(out.results.some(r => /news\.ycombinator\.com\/item\?id=2/.test(r.url)),
         "hn story without a url falls back to the discussion");
    H.eq(out.results.some(r => !r.title), false, "a hit with no title is dropped rather than rendered blank");

    const openalex = out.results.find(r => r.url === "https://doi.org/10.1000/abc");
    H.eq(openalex.snippet, "Target site resistance is widespread", "openalex snippet is the rebuilt abstract");
    H.eq(openalex.date, "2025-04-02", "openalex date");
    H.has(openalex.kind, "Weed Science", "openalex names the journal");

    const crossref = out.results.find(r => r.url === "https://doi.org/10.1000/xyz");
    H.eq(crossref.snippet, "A field study across 40 sites.", "crossref JATS markup is stripped from the abstract");
    H.eq(crossref.date, "2024-09-03", "crossref date parts are zero padded");

    const so = out.results.find(r => r.url === "https://stackoverflow.com/q/1");
    H.eq(so.title, "How do I index a & b?", "stack overflow titles are entity decoded");
    H.has(so.snippet, "12 votes", "and given a useful synthetic snippet");

    /* every result must be renderable */
    out.results.forEach(r => {
      H.eq(/[<>]/.test(r.title), false, "no angle brackets survive into a title: " + r.title.slice(0, 40));
    });
    void byUrl;
  }

  /* ---------- fusion ---------- */
  H.section("Merging six ranked lists");
  {
    const groups = [
      { connector: { name: "A", kind: "Web" }, results: [
        { title: "Shared page", url: "https://example.com/shared", snippet: "short" },
        { title: "Only in A", url: "https://example.com/a", snippet: "aaa" },
      ] },
      { connector: { name: "B", kind: "Research" }, results: [
        { title: "Shared page", url: "http://example.com/shared/", snippet: "a much longer description of it" },
        { title: "Only in B", url: "https://example.com/b", snippet: "bbb" },
      ] },
    ];
    const ranked = Web.rank(groups, "shared page", 10);
    H.eq(ranked.length, 3, "the same page from two connectors is one result");

    const shared = ranked.find(r => /shared/.test(r.url));
    H.eq(shared.from.length, 2, "and records both sources it came from");
    H.eq(shared.snippet, "a much longer description of it", "keeping the more useful of the two snippets");
    H.eq(ranked[0].url === shared.url, true, "a page two connectors agree on ranks first");
    H.eq(ranked[0].n, 1, "results are numbered from one for citation");
    H.eq(ranked[0].relevance, 100, "the top result is the relevance baseline");
    H.ok(ranked.every(r => r.relevance >= 0 && r.relevance <= 100), "relevance stays in range");

    const capped = Web.rank(groups, "shared", 2);
    H.eq(capped.length, 2, "topK caps the merged list");

    H.eq(Web.rank([{ connector: { name: "A" }, results: [{ title: "x" }] }], "q", 5).length, 0,
         "a result with no url is discarded, not rendered as a dead link");
  }

  /* ---------- resilience ---------- */
  H.section("One source failing must not lose the answer");
  {
    stubFetch();
    failing = new Set(["api.openalex.org", "api.crossref.org"]);
    S.webConnectors = ALL.slice();

    const out = await Web.search("ryegrass");
    const broken = out.connectors.filter(c => c.error);
    H.eq(broken.length, 2, "both failures are recorded");
    H.has(broken[0].error, "unreachable from the browser",
          "a fetch rejection is reported as what it usually is, a CORS refusal");
    H.ok(out.results.length > 0, "the working connectors still returned results");
    H.ok(out.connectors.every(c => typeof c.ms === "number"), "each source is timed, working or not");
    failing = new Set();

    /* a 404 from an endpoint that moved */
    global.fetch = () => Promise.resolve({ ok: false, status: 404, statusText: "Not Found" });
    const dead = await Web.search("anything");
    H.eq(dead.results.length, 0, "no results when every endpoint is dead");
    H.eq(dead.connectors.every(c => !!c.error), true, "and every one is marked failed");
    H.has(dead.connectors[0].error, "404", "with the status, so it can be diagnosed");

    S.webConnectors = [];
    const none = await Web.search("anything");
    H.has(none.error, "No web sources", "switching every source off is handled, not a crash");
    S.webConnectors = ALL.slice();
  }

  /* ---------- when it searches ---------- */
  H.section("Deciding whether to search at all");
  {
    const strong = { matched: 4, topCoverage: 0.9 };

    S.web = "off";
    H.eq(Web.shouldSearch("what is the latest news", strong).yes, false, "off means off, whatever the question");

    S.web = "on";
    H.eq(Web.shouldSearch("what is our leave policy", strong).yes, true, "on means every question");

    S.web = "auto";
    /* The regression this pins: a rule matching "what is" fired on almost
       every internal question, so auto mode searched the web to answer
       things the company had already written down. */
    ["what is our leave policy",
     "who is the owner of the escalation procedure",
     "define the approval threshold",
     "how does our onboarding work",
     "what was the cost of the Northam upgrade",
     "which revision superseded the 2019 standard"].forEach((q) => {
       H.eq(Web.shouldSearch(q, strong).yes, false, "auto leaves this internal question alone: " + q);
     });
    H.eq(Web.shouldSearch("what is our leave policy", { matched: 0, topCoverage: 0 }).yes, true,
         "auto searches when the corpus matched nothing");
    H.has(Web.shouldSearch("what is our leave policy", { matched: 0 }).why, "nothing in the knowledge base",
          "and says so in words the presenter can repeat");
    H.eq(Web.shouldSearch("our policy", { matched: 2, topCoverage: 0.2 }).yes, true,
         "auto searches when the corpus barely covered the question");

    [["what is the latest guidance", "current"],
     ["was this announced recently", "recent events"],
     ["what changed in 2026", "specific year"],
     ["what does ISO 9001 require", "external rules"],
     ["what is the market share of our competitor", "outside the company"],
     ["what is the price of urea", "live figure"]].forEach(([q, expect]) => {
       const d = Web.shouldSearch(q, strong);
       H.eq(d.yes, true, "auto fires on: " + q);
       H.has(d.why, expect, "and explains it as: " + expect);
     });

    S.web = "auto";
  }

  /* ---------- modes ---------- */
  H.section("Mode control");
  {
    S.web = "off";
    Web.cycle(); H.eq(S.web, "on", "off cycles to on");
    Web.cycle(); H.eq(S.web, "auto", "on cycles to auto");
    Web.cycle(); H.eq(S.web, "off", "auto cycles back to off");
    Web.set("on"); H.eq(S.web, "on", "a mode can be set directly");
    Web.set("nonsense"); H.eq(S.web, "on", "an unknown mode is ignored rather than breaking the pill");
  }

  /* ---------- the outbound surface ---------- */
  H.section("Hosts contacted are exactly what is declared");
  {
    S.webConnectors = ["wikipedia", "openalex"];
    S.webRead = false;
    H.eq(Web.hosts().sort(), ["api.openalex.org", "en.wikipedia.org"],
         "the host list follows the switched-on sources");

    S.webRead = true;
    H.ok(Web.hosts().indexOf("r.jina.ai") !== -1, "turning on full-page reading declares the reader host");
    S.webRead = false;

    Web.toggleConnector("crossref");
    H.ok(Web.hosts().indexOf("api.crossref.org") !== -1, "toggling a source on adds its host");
    Web.toggleConnector("crossref");
    H.eq(Web.hosts().indexOf("api.crossref.org"), -1, "and toggling it off removes it");

    H.eq(Web.connector("wikipedia").host, "en.wikipedia.org", "connectors are addressable by id");
    H.eq(Web.connector("nope"), null, "an unknown id resolves to nothing rather than throwing");
    Web.connectors().forEach(c => {
      H.ok(!!c.name && !!c.note && !!c.kind, "connector " + c.id + " is fully described for the settings pane");
    });

    S.webConnectors = ALL.slice();
  }

  /* ---------- the prompt ---------- */
  H.section("What the model is told about web results");
  {
    const web = { results: [
      { n: 1, title: "Resistance survey 2026", url: "https://example.org/s", site: "example.org",
        date: "2026-02-01", kind: "Research", snippet: "Forty sites surveyed." },
      { n: 2, title: "Page read in full", url: "https://example.org/f", site: "example.org",
        kind: "Web", snippet: "short", full: "The complete text of the page." },
    ] };
    const sys = LLM.systemPrompt({
      role: Config.roles[0], user: Config.users[0], sources: [], blocked: [],
      web: web, style: "balanced", images: false,
    });

    H.has(sys, "## WEB RESULTS", "the block is present");
    H.has(sys, "[W1] Resistance survey 2026", "results are numbered in the W namespace");
    H.has(sys, "https://example.org/s", "with their url, so a claim can be traced");
    H.has(sys, "PAGE TEXT:", "a page read in full is marked as such");
    H.has(sys, "The complete text of the page.", "and its text is what the model sees");
    H.has(sys, "never as [S1]", "the two citation namespaces are explicitly kept apart");
    H.has(sys, "A web result never overrides them", "company documents are stated to govern");
    H.has(sys, "say which is which", "and a contradiction must be surfaced, not smoothed over");

    const noWeb = LLM.systemPrompt({
      role: Config.roles[0], user: Config.users[0], sources: [], blocked: [],
      web: null, style: "balanced", images: false,
    });
    H.lacks(noWeb, "WEB RESULTS", "with web search off, none of it reaches the prompt");
    H.lacks(noWeb, "[W1]", "and the model is never told the W namespace exists");

    const empty = LLM.systemPrompt({
      role: Config.roles[0], user: Config.users[0], sources: [], blocked: [],
      web: { results: [] }, style: "balanced", images: false,
    });
    H.lacks(empty, "WEB RESULTS", "a search that found nothing adds nothing to the prompt");
  }

  /* ---------- rendering ---------- */
  H.section("Web citations render distinctly and safely");
  {
    const ctx = { msgId: "m1", sources: [{ n: 1, id: "DOC-1", title: "Internal policy" }],
                  web: [{ title: 'A "quoted" headline that failed', site: "example.org", url: "https://example.org/x" }] };

    const html = MD.render("Ours says one thing [S1]; the web says another [W1].", ctx);
    H.has(html, 'class="cite"', "the company citation renders");
    H.has(html, 'class="cite cite-web"', "the web citation renders in its own class");
    H.has(html, "Panel.showWeb(0,'m1')", "and opens the web viewer, not the document viewer");

    /* the bug class that broke citations before: a status word inside an
       attribute. "failed" is in the title here on purpose. */
    const tags = html.match(/<[^>]*>/g) || [];
    H.eq(tags.filter(t => (t.match(/"/g) || []).length % 2).length, 0,
         "every tag has balanced quotes despite a status word in the title");
    H.eq(tags.filter(t => t.indexOf("<span") > 0).length, 0, "no span was injected inside another tag");

    const many = MD.render("Both agree [W1, W2].", ctx);
    H.eq((many.match(/cite-web/g) || []).length, 2, "a comma-separated web citation becomes two chips");

    H.eq(MD.render("Cost is [W]", ctx).indexOf("cite-web"), -1, "a bare [W] is left as text");
    H.has(MD.render("See [W9].", ctx), "cite-web", "a citation past the end still renders as a chip");
    H.has(MD.render("See [W9].", ctx), "Web result 9", "with an honest fallback label");
  }

  H.report(`SARA web search (${edition})`);
}

main().catch((err) => {
  console.error("\n  SUITE CRASHED:", err && err.stack || err);
  process.exit(1);
});
