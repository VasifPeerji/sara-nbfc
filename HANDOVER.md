# Handover: retargeting this to a named lender

The whole product is one HTML file built from `src/` plus one edition file. **Nothing
in `src/` contains a company name, a role, a document or a fact.** Everything specific
to a lender lives in `editions/nbfc.js`, which is one file of about 4,000 lines.

To retarget: copy that file, change the identity block, and keep the rest. The
regulations, the operating model and the failure modes belong to the industry rather
than to the invented tenant, and they are the part that took the longest to get right.

```bash
cp editions/nbfc.js editions/clientname.js
# edit the identity block
python build.py clientname          # writes sara_clientname.html
python run_tests.py                 # every suite runs against the new edition
```

The suites read the edition, not a fixture, so they check the new one as soon as it
exists. That is deliberate: a retarget that breaks a scope or orphans a document fails
the build rather than surfacing in a room.

---

## What to change, in order of how much it matters

### 1. The identity block (fifteen minutes)

At the top of the edition file. Company name, short name, domain, industry
description, headquarters, headcount, sites, currency, the `about` paragraph, and the
accent colour.

**Check an invented tenant name against the RBI register before using it.** The first
name this build carried turned out to belong to a real lender, which is not a cosmetic
problem: the documents describe policy failures, an account in default and a complaint
upheld against the tenant, and all of that reads as being about whoever actually holds
the name. A web search is not sufficient and did not find it. The register is at
`rbi.org.in`, under the list of NBFCs, and a company-name search at the Ministry of
Corporate Affairs is worth the second minute.

If the build is for the sector rather than for one named prospect, set
`analytics.audience: "sector"` and a `sectorLabel`. That stops the identify gate telling
the reader the demonstration was prepared specifically for a company they have never
heard of, and stops it offering the invented tenant as the example organisation.

Change `operatorSystem` if the client names their lending platform something
particular. It is currently "the lending platform and the statutory rails" and it
appears in the welcome wall and in the router's replies.

The Operator's hosts pick up `company.short` automatically through the `{org}` token,
so `lending.{org}.com` becomes `lending.clientname.com` with no edit.

### 2. The roles and the sign-in profiles (half a day)

37 roles and 39 profiles. Most lenders will recognise 30 of them and call four
something else.

Each role carries a `clearance` (1 to 4), a list of `scopes`, a title, and its prompt
cards. **Getting the scopes right matters more than getting the titles right**, because
the scopes are what the access control demonstration turns on.

Two rules the suite enforces, and both exist for a reason:

- A **restricting scope must stand alone** on a document. `visibleTo` grants on any
  matching scope, so adding a topic scope alongside a restricting one silently opens
  the document to everyone holding the topic.
- A **case-level restriction** (financial crime, vigilance, privileged advice) attaches
  to a designation and never to rank. No clearance 4 role may hold one.

### 3. The knowledge base (the real work: a week or more)

109 documents, roughly 45,000 words. They are the product. Retrieval, access control,
the citations and every guided task's working all point back into them.

Retargeting is not rewriting. In order:

1. **Keep** every document whose subject is regulatory or sector standard. Change the
   company name in the body and nothing else.
2. **Change the numbers** in the internal-policy documents to the client's: margin
   ceilings, delegation limits, tenor caps, charge schedules, thresholds.
3. **Drop** whole segments the client does not write. If they do no gold lending,
   remove the gold documents, the gold role, the gold guided task and the gold prompt
   cards together. The suite will tell you if you leave one behind.
4. **Add** what they do that Kritanya does not.

Every document needs `id`, `title`, `cat`, `clearance`, `scopes`, `tags`, `owner`,
`updated`, `rev`, `system` and `body`. The `tags` do real work: they feed both
retrieval and the domain vocabulary.

After any corpus change, run `node test/audit_retrieval.js nbfc`. It prints what every
prompt card actually retrieves. **Unit tests cannot catch a card that pulls a plausible
but wrong document**, and that is the failure mode that survives to a demonstration:
it scores well, it returns something, and the answer is confidently about the wrong
subject. Five of those were found that way during this build.

### 4. The guided tasks (a day each, if you change one)

16 of them in `journeys`. Each is a list of steps with types (`text`, `number`, `date`,
`choice`, `confirm`, `calc`, `check`, `clock`, `table`, `file`).

The contract, all of it enforced by `test_journeys.js`:

- **No step, branch, computation or document may depend on a model call.** The suite
  revokes the API key and runs every task to completion.
- **A derived step may only refer backwards.** A line referring forward silently
  evaluates to zero, which in a figure sent to a customer is the worst failure
  available and nothing else catches it.
- **A citation must be readable by everyone the task is offered to.** Citing a
  clearance 2 document to a clearance 1 audience is a broken link at best.
- **At most 12 questions and 16 steps.** Computed results are not questions and do not
  count.
- Every rule must name a test that exists in `Calc.TESTS`. An unknown test reports
  not-applicable, so the rule looks like it ran and can never fail.

### 5. The Operator (two days if the estate changes)

`src/45-operator-lending.js`. Eight applications, 72 steps.

Most clients need no change here at all: the four platform modules are deliberately
vendor neutral, and the four registries are the same for every registered lender in
the country. Change it only if the client wants their own platform's chrome, and think
hard first, because a half-right imitation of software the audience uses daily is worse
than an honest generic.

If you do change it, the contract is in `test_operator.js`:

- Every department's first view is `home` and its last is `verify`.
- Every step has an anchor, and the anchor must resolve on that step's own rendered
  screen at that step's index.
- Every view a step names must have a URL, or the address bar lies.
- A registry must not sit on the tenant's own host, and a platform module must.

### 6. What not to touch

`src/` holds the product. Changing it changes every edition. If a client needs
something that seems to require a `src/` change, it is usually a new step type or a new
artifact renderer, and those are additive.

---

## Where the sharp edges are

Things that cost time during this build and will cost it again.

**Restricting scopes are grants, not filters.** `visibleTo` returns true on any
matching scope. A restricting scope sharing a document with a topic scope restricts
nothing. The suite checks this now; it did not always.

**A declared scope with no document behind it restricts nothing and says nothing.**
`custpii` sat that way for a while: named in the settings panel, held by five roles,
carrying no material. The check that should have caught it returned early when a scope
had no documents.

**Retrieval floors are corpus-size dependent.** IDF rises with the corpus, so both
`CORPUS_FLOOR` in the router and `CARD_FLOOR` in `test_nbfc.js` must be re-measured
when documents are added or removed. Both carry their measurements in a comment; both
are pinned by tests.

**Trigger phrases must not be shared** between an Operator run and a guided task. A
phrase in both lists means the outcome is decided by tie-breaking rather than by
anybody. The rule that splits them: the guided task answers whether, which or how much;
the Operator does the work. `test_router.js` fails the build on any overlap.

**Glossary entries drive query expansion.** People say "bounce" and the document says
"dishonour"; they say "repossession" and it says "taking possession". Cross-document
threads do not resolve without those bridges. If a retargeted corpus uses different
vocabulary, the glossary is where that is fixed.

**Write files with a tool, not with a shell heredoc.** Backslash escapes in JS string
literals get mangled, and a corrupted `\n\n` inside a document body produces a build
that looks fine and reads wrong.

---

## Layout

| Path | What it holds |
|---|---|
| `build.py` | Concatenates `src/` plus one edition into the single output file |
| `run_tests.py` | Runs every suite, cheapest first |
| `src/` | The product. No company name, role, document or fact |
| `editions/` | One file per tenant. Everything client-specific |
| `test/` | Suites, fixtures and the retrieval audit |
| `collector/` | Optional usage collector and its console |
| `assets/` | Brand marks, inlined at build time |
| `NBFC_FIDELITY.md` | What is real, what is reconstructed, what is invented |
| `DEMO_RUNBOOK.md` | How to present it |

## State of the build

| | |
|---|---|
| Documents | 109, about 45,000 words |
| Roles / profiles | 37 / 39 |
| Prompt cards | 185 |
| Guided tasks | 16, of which 13 can refuse to produce their document |
| Operator applications | 8, across 72 steps |
| Scopes | 22, of which 5 restrict |
| Glossary | 66 terms, driving query expansion |
| Tests | 7,789 checks across 12 suites |
| Output | `sara_nbfc.html`, about 1.6 MB, no runtime dependencies |
