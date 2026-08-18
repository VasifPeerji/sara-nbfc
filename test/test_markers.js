/* Regression suite for the side-channel markers.
   Kept separate from test_core.js because it is all about one contract: the
   sara-artifact / sara-next blocks must never reach the reader, however the
   model chooses to fence them.

   Run:  node test/test_markers.js [edition]
*/
const H = require("./harness");
const edition = process.argv[2] || "base";
H.loadEdition(edition);
H.loadSrc();

console.log(`\n  SARA marker tests — edition "${edition}"`);

/* ================= the bug seen in the field ================= */
H.section("Bare marker leak (the reported bug)");
{
  const bare = [
    "Answer text here.",
    "",
    "sara-next",
    "- Do you want a step-by-step on collecting samples?",
    "- Ryegrass specifically, or other species as well?",
  ].join("\n");
  const out = LLM.split(bare);
  H.eq(out.visible.trim(), "Answer text here.", "bare sara-next marker is stripped from the prose");
  H.lacks(out.visible, "sara-next", "the token never survives into the answer");
  H.eq(LLM.parseFollowups(out.blocks.next).length, 2, "follow-ups still parsed from an unfenced block");
}

/* ================= every fencing style a model actually uses ================= */
H.section("Marker variants");
{
  const variants = [
    ["```sara-next",     "standard fence"],
    ["~~~sara-next",     "tilde fence"],
    ["sara-next",        "no fence"],
    ["`sara-next`",      "inline backticks"],
    ["**sara-next**",    "bolded"],
    ["sara-next:",       "trailing colon"],
    ["  ```sara-next  ", "indented and padded"],
    ["SARA-NEXT",        "upper case"],
    ["sara_next",        "underscore"],
    ["sara next",        "space instead of hyphen"],
  ];
  variants.forEach(function(v){
    const raw = ["Prose.", "", v[0], "- first follow up here", "- second follow up here"].join("\n");
    const out = LLM.split(raw);
    H.eq(out.visible.trim(), "Prose.", "prose clean: " + v[1]);
    H.eq(LLM.parseFollowups(out.blocks.next).length, 2, "follow-ups parsed: " + v[1]);
  });
}

H.section("Artifact marker, same tolerance");
{
  const bare = ['Prose.', '', 'sara-artifact', '{"type":"table","headers":["A"],"rows":[["1"]]}'].join("\n");
  const out = LLM.split(bare);
  H.eq(out.visible.trim(), "Prose.", "bare sara-artifact marker stripped");
  H.eq(LLM.parseArtifact(out.blocks.artifact).type, "table", "bare artifact block still parses");

  const both = [
    "Prose.", "",
    "```sara-artifact", '{"type":"metrics","items":[]}', "```", "",
    "sara-next", "- one question here", "- two question here",
  ].join("\n");
  const b = LLM.split(both);
  H.eq(b.visible.trim(), "Prose.", "mixed fencing: prose clean");
  H.eq(LLM.parseArtifact(b.blocks.artifact).type, "metrics", "mixed fencing: artifact parsed");
  H.eq(LLM.parseFollowups(b.blocks.next).length, 2, "mixed fencing: follow-ups parsed");
}

/* ================= things that must NOT be treated as markers ================= */
H.section("False positives");
{
  const code = ["Here is code:", "", "```js", "const saraNext = 1;", "```", "", "Done."].join("\n");
  const out = LLM.split(code);
  H.eq(out.started, false, "an ordinary code fence is not a marker");
  H.has(out.visible, "const saraNext", "ordinary code survives intact");
  H.has(out.visible, "Done.", "prose after a code block survives");

  const prose = "Sarah checked the paddock and sara-next season it will be worse.";
  H.eq(LLM.split(prose).started, false, "the token mid-sentence is not a marker line");

  const heading = ["Answer.", "", "## Next steps", "- do a thing"].join("\n");
  H.eq(LLM.split(heading).started, false, "an ordinary Next steps heading is untouched");
  H.has(LLM.split(heading).visible, "Next steps", "and survives into the answer");
}

/* ================= streaming ================= */
H.section("Streaming safety");
{
  ["```sara", "```sara-ne", "sara-nex", "```sara-artifac", "sara-"].forEach(function(tail){
    const out = LLM.split("Answer.\n" + tail);
    H.lacks(out.visible, "sara", "partial marker hidden mid-stream: " + JSON.stringify(tail));
  });
  H.has(LLM.split("Answer.\nsarah went to the paddock").visible, "sarah",
        "a real word beginning with 'sara' is not swallowed");

  const full = [
    "Answer sentence.", "",
    "```sara-artifact", '{"type":"table","headers":["A"],"rows":[["1"]]}', "```", "",
    "```sara-next", "- follow up one", "- follow up two", "```",
  ].join("\n");
  let leaked = null;
  for(let i = 1; i <= full.length; i++){
    if(/sara[-_ ]?(artifact|next)/i.test(LLM.split(full.slice(0, i)).visible)){ leaked = i; break; }
  }
  H.eq(leaked, null, "no streaming prefix ever leaks a marker into the answer");

  /* and the final state must still yield both channels */
  const done = LLM.split(full);
  H.eq(done.visible.trim(), "Answer sentence.", "final prose is clean");
  H.ok(!!done.blocks.artifact && !!done.blocks.next, "both channels captured at the end");
}

/* ================= the prompt must not compete ================= */
H.section("Prompt no longer duplicates the follow-up channel");
{
  const sys = LLM.systemPrompt({
    role: Config.roles[0], user: Config.users[0],
    sources: [], blocked: [], style: "balanced", images: false,
  });
  H.lacks(sys, 'Close with a short "Next" line', "the old competing Next instruction is gone");
  H.has(sys, "do not introduce it with a heading", "the block is declared machine-read only");
  H.has(sys, 'Never write the words "sara-next"', "the model is told not to echo the tokens");
}

H.report(`SARA markers (${edition})`);
