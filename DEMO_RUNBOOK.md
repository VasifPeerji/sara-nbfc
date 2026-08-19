# Running the demonstration

Open `sara_nbfc.html`. There is no server, no install and no network call except to
whichever model provider is configured. It runs from a USB stick in a room with no
wifi, and the guided tasks and the Operator run with no API key at all.

Read `NBFC_FIDELITY.md` before the first time you present this. It is one page and it
is what you say when somebody asks whether we made something up.

---

## Before the room

1. **Build fresh** if anything changed: `python build.py nbfc`, then `python run_tests.py`.
2. **Set a key** in Settings if you want the knowledge answers to be written by a
   model. Without one, the guided tasks and the Operator still run in full; only the
   prose answers stop.
3. **Pick your profile.** Sign in as the person whose job the room actually does. The
   whole product is scoped to the profile, so signing in as the Managing Director and
   then demonstrating a collections workflow makes both halves look wrong.
4. **Decide what you are not going to show.** There are 16 guided tasks and 8 Operator
   runs. A good session shows three or four things properly. A session that shows
   twenty-four things shows nothing.

## The four things worth showing

Pick from these by audience. Each is five to eight minutes.

### 1. Access control that runs before retrieval, not after

**Sign in as:** any two profiles, one senior and one junior.

Ask something restricted and watch it refuse, then sign in as the person who holds the
designation and ask again.

The line to say: **a document above your clearance or outside your scopes is never
scored and never sent to the model.** It is not filtered out of an answer afterwards.
There is no prompt instructing the model to be careful. The model never sees it.

**The showpiece is the customer information extract.** It sits at clearance 2, so:

| Profile | Clearance | Reads it? |
|---|---|---|
| Managing Director | 4 | **No** |
| Chief Risk Officer | 4 | **No** |
| Grievance Redressal Officer | 3 | Yes |
| Branch Manager | 2 | **No** |

Seniority is not access. Handling customer records is a function, not a rank. That
table is the argument, and it lands in about fifteen seconds.

The same holds for financial crime case material (only the Principal Officer),
vigilance files (only the Audit Committee chair's investigating officer) and privileged
advice on live matters (only the named matter team). Sara says who to approach rather
than pretending the material is not there.

### 2. A question no single document answers

**Sign in as:** Chief Risk Officer.

**Ask:** *why are first instalments bouncing on new commercial vehicle loans in the
west*

It returns eight documents and puts them together:

| | |
|---|---|
| RK-006 | Portfolio Analysis: First Instalment Default, Used Commercial Vehicle |
| PR-007 | Scheme Circular: Used Commercial Vehicle Dealer Subvention |
| CR-008 | Credit Product Note: Commercial Vehicle Finance |
| CO-002 | Bucket Strategy and Account Allocation |
| SV-002 | Complaints Register Extract: Vehicle Finance, June to July 2026 |
| CH-001 | Dealer Channel Handbook |
| PR-010 | Product and Scheme Master Register |

The eighth is CR-005, the loan against property product note, which is not on point.
Say so if anyone notices. Retrieval that never returns anything loose is retrieval
somebody has curated by hand, and the room can tell.

The point to make: **no one of those documents states the answer.** The causal chain
runs across a portfolio analysis, a scheme circular and a service complaints extract,
owned by three different functions, and nobody had put them next to each other. That is
the thing a search box cannot do and a person with a full diary does not do either.

If you want to push it, ask the follow-up: *what would you change first*. The answer
has to come from the same set and it is a different answer from any one of them.

### 3. A guided task that refuses to produce its document

**Sign in as:** Repossession Coordinator.

**Ask:** *can this vehicle be repossessed*

Answer the questions as they come: account `LN-CV-2019-0044821`, vehicle
`MH-31-CQ-4482`, agreement executed 14 March 2019, 148 days past due, notice served,
grievance open.

It refuses, and it says why:

> **Repossession NOT authorised on MH-31-CQ-4482**
> The executed agreement carries the possession clause: **no**. Possession is not taken
> on any facility whose executed agreement does not carry the clause, whatever the
> arrears position. This goes to Legal.
> No grievance or dispute open on the account: **no**. Recovery steps on the disputed
> arrears are suspended until it is resolved.

Two things to say about it.

First, **it omits the working.** There is no calculation, no schedule, no draft letter,
because nothing is being authorised and a working would read as a step towards doing
it anyway.

Second, the first precondition is the one that matters: the clause is checked against
**the agreement actually executed on that account**, not against the current template.
Older templates do not all carry it. A system that checks the template in force today
gets this wrong every time and never finds out.

Thirteen of the sixteen guided tasks can refuse like this. The other three
(classification, document tracking and deviation routing) report their checks without
withholding the document, because in those three the working is the thing you needed
even when a check fails.

### 4. The Operator, crossing out of the company's own systems

**Sign in as:** Repossession Coordinator.

**Ask:** *work the arrears on account LN-CV-2019-0044821, vehicle MH-31-CQ-4482*

A Windows machine opens Chrome, types the address, and works the collections module one
control at a time. Watch for three moments:

- **It stops and asks.** If you did not state the arrears figure, it pauses at step four
  and asks in its own chat panel rather than inventing one. Answer it and it carries on
  from the same step.
- **It refuses.** The authorisation gate fails on the same two conditions, and no
  repossession request is raised. The run then suspends recovery on the disputed
  charges, refers the agreement defect to Legal, and flags three more accounts on the
  same template vintage.
- **It does not end in a green tick.** The last screen says *no repossession request was
  raised*. Nothing succeeded, so nothing claims to have.

Say plainly: **the platform holds the arrears. The knowledge base holds which agreement
template was in force in March 2019, and that is the reason this stopped.**

If the audience is operations rather than risk, run the origination or the co-lending
run instead. Both complete normally and both show the same shape.

## The estate the Operator drives

Four modules of a lending platform, then four statutory registries.

| Run | Ends in |
|---|---|
| Loan Origination | A sanction at the ceiling, with the deviation declined |
| Loan Management | A disbursal with a retention against the one open condition |
| Collections & Recovery | **No repossession request** |
| Co-lending | A settlement advice with both breaks itemised |
| CKYCR | An update filed against the existing KIN, not a duplicate |
| CERSAI | A security interest registered on day three of thirty |
| RBI CIMS | A return filed with the variance explained, not edited |
| RBI CMS | A response upholding both heads of the complaint |

The platform is deliberately not any vendor's product. The registries are named for
real. If asked why, the answer is in `NBFC_FIDELITY.md` section 2 and it is a good
answer: no lending platform has majority share, so building on one would make the demo
wrong for almost every prospect.

## Questions you will get

**"Is this connected to our systems?"**
No. This is a demonstration of what the product does, built on an invented lender.
Connecting it is implementation work and we scope that separately.

**"Where did these documents come from?"**
They were written for this build to be typical of the sector. Nothing is taken from any
lender's actual policy. The regulations they cite are real.

**"How much of this needs the LLM?"**
Open Settings and read the usage panel. It counts it: the percentage of questions
routed with no model call at all. The guided tasks and the Operator are fully
deterministic, so they complete with the key removed.

**"Can it do X?"**
If X is in the build, show it. If it is not, say so and write it down. Do not
improvise a capability on a screen.

**"That is not how we do it."**
Agree immediately. This is a whole-sector build and some of it is wrong for everybody.
Then ask how they do it, and write that down too. That conversation is the reason to
be in the room.

## After the room

The usage panel in Settings holds what actually happened: the questions asked, where
they were routed, which documents were cited, which were withheld, which tasks ran and
where the Operator had to stop and ask. Export it as CSV or JSON before you close the
file, because it is stored in the browser and a cleared browser takes it with it.
