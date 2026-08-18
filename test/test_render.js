/* Renderer HTML-safety suite.

   The markdown renderer builds HTML in passes, and any pass that runs over
   already-generated markup can corrupt it. This suite pins the invariant:
   post-processing must touch text only, never tags or attribute values.

   Run:  node test/test_render.js [edition]
*/
const H = require("./harness");
const edition = process.argv[2] || "base";
H.loadEdition(edition);
H.loadSrc();

console.log(`\n  SARA render-safety tests — edition "${edition}"`);

/* ---------- helpers ---------- */
const tagsIn = (html) => String(html).match(/<[^>]*>/g) || [];

function attributesAreIntact(html){
  /* a tag whose quotes are unbalanced has had markup injected into an attribute */
  const bad = tagsIn(html).filter(function(t){
    if(t.indexOf("<span") !== -1 && t.indexOf("<span") !== 0) return true;  // span opened inside another tag
    const quotes = (t.match(/"/g) || []).length;
    return quotes % 2 !== 0;
  });
  return bad;
}

/* ================= the reported bug ================= */
H.section("Status highlighting must not corrupt attributes");
{
  /* AGR-HWSC-01 in the AGLink edition: the title ends in the word "failed",
     which the status pass rewrote inside the citation's title attribute. */
  const ctx = {
    sources: [{ n: 1, id: "AGR-HWSC-01",
                title: "Stopping seed set: options when a herbicide has already failed" }],
    msgId: "m_test",
  };
  const html = MD.render("Seed set is what matters now [S1].", ctx);

  H.eq(attributesAreIntact(html), [], "citation tag survives a status word in its title");
  H.has(html, 'class="cite"', "the citation still renders");
  H.has(html, "Panel.showSource(0,'m_test')", "its click handler is intact");
  H.lacks(html, 'v-crit">failed</span>"', "no span was injected into the title attribute");

  /* the tag itself must contain no nested markup at all */
  const citeTag = tagsIn(html).find(function(t){ return t.indexOf('class="cite"') !== -1; });
  H.ok(!!citeTag, "found the citation tag");
  H.lacks(citeTag, "<span", "citation tag contains no injected span");
  H.lacks(citeTag, "v-crit", "citation tag contains no status class");

  /* and the visible label is still just the number */
  H.has(html, ">1</button>", "button label is the citation number alone");
}

/* ================= every real document title ================= */
H.section("Sweep every document title through a citation");
{
  let broken = null;
  Config.kb.forEach(function(doc){
    const ctx = { sources: [{ n: 1, id: doc.id, title: doc.title }], msgId: "m" };
    const html = MD.render("Claim [S1].", ctx);
    const bad = attributesAreIntact(html);
    if(bad.length && !broken) broken = doc.id + " -> " + bad[0];
  });
  H.eq(broken, null, "no document title in this edition breaks its citation markup");
}

/* ================= status words still work where they should ================= */
H.section("Highlighting still applies to prose");
{
  const html = MD.render("The audit failed and the permit expired, but the review is complete.");
  H.has(html, '<span class="v-crit">failed</span>', "crit word highlighted in prose");
  H.has(html, '<span class="v-crit">expired</span>', "second crit word highlighted");
  H.has(html, '<span class="v-ok">complete</span>', "ok word highlighted");
  H.eq(attributesAreIntact(html), [], "prose highlighting produces valid markup");
}

/* ================= places it must NOT reach ================= */
H.section("Highlighting must skip code and markup");
{
  const inlineCode = MD.render("Run `deploy --failed` to retry.");
  H.lacks(inlineCode, 'v-crit">failed', "no highlighting inside an inline code span");
  H.has(inlineCode, "<code>", "the code span still renders");

  const block = MD.render("```\nif (status === 'failed') retry();\n```");
  H.lacks(block, "v-crit", "no highlighting inside a fenced code block");
  H.has(block, "<pre><code", "the code block still renders");

  const link = MD.render("See [the failed run](https://example.com/failed-run).");
  const linkTag = tagsIn(link).find(function(t){ return t.indexOf("<a ") === 0; });
  H.ok(!!linkTag, "link renders");
  H.lacks(linkTag, "<span", "no span injected into the href");
  H.lacks(linkTag, "v-crit", "href is untouched by highlighting");
  H.has(link, 'v-crit">failed</span>', "but the link's visible text is still highlighted");
  H.eq(attributesAreIntact(link), [], "link markup is valid");
}

/* ================= adversarial content ================= */
H.section("Adversarial titles and prose");
{
  const nasty = [
    'Report: "failed" outcomes',
    "Q3 review: complete, approved & closed",
    "Incident <critical> escalation",
    "Policy 'expired' / non-compliant items",
    "At risk, overdue and pending: a monitor's guide",
  ];
  let broke = null;
  nasty.forEach(function(title){
    const ctx = { sources: [{ n: 1, id: "X-1", title: title }], msgId: "m" };
    const html = MD.render("Point [S1].", ctx);
    const bad = attributesAreIntact(html);
    if(bad.length && !broke) broke = title + " -> " + bad[0];
    if(html.indexOf("<script") !== -1 && !broke) broke = "script leaked from: " + title;
  });
  H.eq(broke, null, "adversarial source titles never break the markup");

  /* Status highlighting is deliberately paragraph-only: headings, list items
     and table cells are already scannable by structure, and colouring them
     turns a dense answer into confetti. Pinned here so the boundary stays a
     decision rather than drifting. */
  const table = MD.render("| Item | State |\n|---|---|\n| Seal | failed |");
  H.eq(attributesAreIntact(table), [], "table markup stays valid");
  H.lacks(table, "v-crit", "table cells are not status-highlighted");

  const heading = MD.render("## The failed batch");
  H.eq(attributesAreIntact(heading), [], "heading markup stays valid");
  H.lacks(heading, "v-crit", "headings are not status-highlighted");

  const list = MD.render("- the run failed\n- the next one is complete");
  H.eq(attributesAreIntact(list), [], "list markup stays valid");
  H.lacks(list, "v-crit", "list items are not status-highlighted");
}

/* ================= streaming ================= */
H.section("Streaming safety");
{
  const ctx = {
    sources: [{ n: 1, id: "AGR-HWSC-01",
                title: "Stopping seed set: options when a herbicide has already failed" }],
    msgId: "m",
  };
  const src = "The window is closing [S1]. The audit failed and the permit expired.\n\n| A | B |\n|---|---|\n| 1 | 2 |";
  let bad = null;
  for(let i = 1; i <= src.length; i++){
    const html = MD.render(src.slice(0, i), ctx);
    if(attributesAreIntact(html).length){ bad = "prefix length " + i; break; }
  }
  H.eq(bad, null, "no partial render ever produces broken markup");
}

H.report(`SARA render safety (${edition})`);
