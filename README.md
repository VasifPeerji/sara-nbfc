# SARA for NBFC

A knowledge and workflow assistant for non-banking financial companies, built as a
single self-contained HTML file with no runtime dependencies.

This is a whole-sector build rather than a per-client one. The tenant is an invented
diversified NBFC whose book is drawn broadly enough that most Indian lenders recognise
their own business somewhere in it: wholesale and retail, secured and unsecured,
vehicle, gold, capital markets and microfinance, across branch, dealer, agent,
correspondent and digital channels.

| | |
|---|---|
| Documents | 109, about 45,000 words |
| Roles and sign-in profiles | 37 and 39 |
| Guided tasks | 16, of which 13 can refuse to produce their document |
| Operator applications | 8, across 72 steps |
| Tests | 7,789 checks across 12 suites |

## Build

```bash
python build.py nbfc
```

Writes `sara_nbfc.html`. Open it directly from the filesystem; there is no server and
no network call except to whichever model provider you configure. `python build.py`
with no argument builds every edition in `editions/`.

The build fails on any reference to a host outside `ALLOWED_RUNTIME_HOSTS`, and runs
`node --check` over both the concatenated bundle and the edition file, because a single
unterminated string ships a blank page with a useless console.

## Test

```bash
python run_tests.py
```

Runs every suite, cheapest first, and prints one line each. `python run_tests.py router`
runs only the suites whose name matches. Any suite can also be run on its own:
`node test/test_operator.js`.

```bash
node test/audit_retrieval.js nbfc
```

`audit_retrieval.js` prints what every prompt card actually retrieves. Unit tests
cannot catch a card that pulls a plausible but wrong document, so run it after any
corpus change.

## The four things this demonstrates

**Access control runs before retrieval, not after.** A document above a person's
clearance, or outside their scopes, is never scored and never sent. It is not filtered
out of an answer afterwards, and there is no prompt asking the model to be careful.
Withheld documents are counted and reported to the model as a note, so it can refuse
and name who to approach without seeing them. The showpiece is the customer information
extract at clearance 2: the Managing Director at clearance 4 is refused it and a
Grievance Officer at clearance 3 is not, because handling customer records is a
function rather than a rank.

**Retrieval is real.** BM25 over paragraph-chunked documents with stemming, field
weighting, glossary-driven query expansion and a recency nudge. The model only ever
receives retrieved passages, so it cannot cite a document that does not exist. A
question like *why are first instalments bouncing on new commercial vehicle loans in
the west* pulls eight documents across three functions, and no one of them states the
answer.

**Guided tasks are deterministic, and can refuse.** No step, branch, computation or
document depends on a model call, so a task completes with no API key and no network:
the suite asserts it by revoking the key first. Thirteen of the sixteen can stop and
decline to produce their document, naming the rule they failed. The repossession gate
checks the possession clause against the agreement **actually executed on that
account**, not against the current template, which is a distinction no lending platform
holds.

**The Operator does the last mile, and stops when it should not do it.** Eight
applications: origination, servicing, collections and co-lending on a deliberately
vendor-neutral platform, then CKYCR, CERSAI, RBI CIMS and RBI CMS, named for real
because there is exactly one of each and every registered lender files into all four.
The collections run takes an aged account as far as the authorisation gate and then
refuses to raise the repossession, because the knowledge base knows what the platform
does not.

## Documentation

| | |
|---|---|
| [`NBFC_FIDELITY.md`](NBFC_FIDELITY.md) | What is real, what is reconstructed, what is invented. Read before presenting |
| [`DEMO_RUNBOOK.md`](DEMO_RUNBOOK.md) | How to run the demonstration, and the questions you will get |
| [`HANDOVER.md`](HANDOVER.md) | Retargeting to a named lender, and where the sharp edges are |

## Layout

| Path | What it holds |
|---|---|
| `build.py` | Concatenates `src/` plus one edition into the single output file |
| `run_tests.py` | Runs every suite, cheapest first |
| `src/` | The product. Contains no company name, role, document or fact |
| `editions/` | One file per tenant. Everything customer-specific lives here |
| `test/` | Suites, fixtures and the retrieval audit |
| `collector/` | Optional usage collector and its console |
| `assets/` | Brand marks, inlined at build time |

## Retargeting

Copy `editions/nbfc.js`, change the identity block, and keep the rest. The
regulations, the operating model and the failure modes belong to the industry, not to
the invented tenant. [`HANDOVER.md`](HANDOVER.md) sets out what to change and in what
order.
