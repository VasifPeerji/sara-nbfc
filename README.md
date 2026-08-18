# SARA for NBFC

A knowledge and workflow assistant for non-banking financial companies, built as a
single self-contained HTML file with no runtime dependencies.

This is a whole-sector build rather than a per-client one. The tenant is an invented
diversified NBFC whose book is drawn broadly enough that most Indian lenders recognise
their own business somewhere in it: wholesale and retail, secured and unsecured,
vehicle, gold, capital markets and microfinance, across branch, dealer, agent,
correspondent and digital channels.

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
node test/test_core.js nbfc      # config, retrieval, access, markdown, theme
node test/test_journeys.js nbfc  # guided tasks, including with the API key revoked
node test/test_operator.js nbfc  # every step anchor against its rendered screen
node test/test_router.js nbfc    # intent classification without a model
node test/audit_retrieval.js nbfc
```

`audit_retrieval.js` prints what every prompt card actually retrieves. Unit tests
cannot catch a card that pulls the wrong document, so run it after any corpus change.

## Layout

| Path | What it holds |
|---|---|
| `build.py` | Concatenates `src/` plus one edition into the single output file |
| `src/` | The product. Contains no company name, role, document or fact |
| `editions/` | One file per tenant. Everything customer-specific lives here |
| `test/` | Suites, fixtures and the retrieval audit |
| `collector/` | Optional usage collector and its console |
| `assets/` | Brand marks, inlined at build time |

## How it works

Retrieval is real: BM25 over paragraph-chunked documents with stemming, field
weighting, glossary-driven query expansion and a recency nudge. The model only ever
receives retrieved passages, so it cannot cite a document that does not exist.

Access control runs **before** retrieval. A document above a person's clearance, or
outside their scopes, is never scored and never sent. Withheld documents are counted
and reported to the model as a note so it can refuse and route without seeing them.

Guided tasks are deterministic. Steps, branching, computation and the resulting
document never depend on a model call, so a task completes with no API key and no
network. The test suite asserts this by revoking the key first.

## Retargeting

Copy `editions/nbfc.js`, change the identity block, and keep the rest. The
regulations, the operating model and the failure modes belong to the industry, not to
the invented tenant.
