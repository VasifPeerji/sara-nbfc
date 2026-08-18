/* ==================================================================
   audit_retrieval.js
   ------------------------------------------------------------------
   Every prompt card on the welcome screen is a promise: click it and
   something useful happens. A card that retrieves the wrong document
   is the single most visible way a demo falls over, and no unit test
   can catch it because the retrieval is working perfectly — it is
   just answering a different question from the one on the card.

   So this prints, for every prompt card of every role, signed in as
   that role: the top document, its score, and how far ahead of second
   place it is. Read it. A card whose top hit is not obviously the
   document it was written for is a card to reword.

       node test/audit_retrieval.js mining [--all]

   Without --all it prints only the ones worth looking at:
     WEAK   top score below the corpus floor, so the answer will be
            thin or the router will treat it as out of domain
     CLOSE  second place within 15 percent, so a small corpus change
            will silently flip which document is quoted
     BLOCK  the card is written for a role that cannot read anything
            relevant, which is only correct if the card is deliberately
            demonstrating a refusal
   ================================================================== */

const H = require("./harness");
const edition = process.argv[2] || "mining";
const showAll = process.argv.indexOf("--all") !== -1;

H.loadEdition(edition);
H.loadSrc();
Retrieval.build();

const FLOOR = 8.0;
let cards = 0, weak = 0, close = 0, blocked = 0;

console.log("\nPrompt card retrieval audit — " + edition + "\n");

Config.roles.forEach(role => {
  const rows = [];
  (role.prompts || []).forEach(p => {
    cards++;
    const hit = Retrieval.search(p.q, { role: role, topK: 3 });
    const top = hit.sources[0];
    const second = hit.sources[1];
    const gap = (top && second) ? (top.score - second.score) / top.score : 1;

    const flags = [];
    if (!top || top.score < FLOOR) { flags.push("WEAK"); weak++; }
    if (top && second && gap < 0.15) { flags.push("CLOSE"); close++; }
    if (hit.blocked && hit.blocked.length) {
      flags.push("BLOCK:" + hit.blocked.length);
      if (!top) blocked++;
    }
    if (!flags.length && !showAll) return;

    rows.push("    " + (flags.join(" ") || "ok").padEnd(14) +
      (top ? (top.id + " " + top.score.toFixed(1)).padEnd(16) : "— none —".padEnd(16)) +
      (second ? "(2nd " + second.id + " " + second.score.toFixed(1) + ") " : "") +
      "\n                  " + JSON.stringify(p.t) +
      "\n                  " + p.q.slice(0, 96));
  });
  if (rows.length) {
    console.log("  " + role.title + "  (clearance " + role.clearance + ")");
    console.log(rows.join("\n"));
    console.log("");
  }
});

console.log("  " + cards + " cards · " + weak + " weak · " + close + " close · " +
            blocked + " retrieving nothing at all");
console.log("  A card marked BLOCK with a good top hit is healthy: it means the");
console.log("  person gets a partial answer and is told what was withheld.\n");
