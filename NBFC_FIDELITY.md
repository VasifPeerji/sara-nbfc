# What is real in this build, and what is not

This is the document to read before presenting, and the one to quote from if
somebody in the room asks whether we made something up. The short answer is: the
regulations, the registries and the failure modes are real; the company, the people
and every number are invented; the screens are reconstructions.

Say that out loud early. It costs nothing and it buys the rest of the demonstration.

---

## 1. Real, and checkable by anyone in the room

These are public facts. If a client's compliance officer looks them up during the
meeting, they will find them.

| Thing | Where it is real |
|---|---|
| **Scale Based Regulation**, and the Base / Middle / Upper / Top layers | RBI's framework for NBFCs |
| **NBFC-ICC** as a registration category | RBI |
| **CKYCR**, the Central KYC Records Registry, operated by CERSAI | ckycrportal.com |
| **CERSAI**, the central register of security interests | cersai.org.in |
| Registration of a security interest **within thirty days** of its creation | Central Registry rules |
| **CIMS**, the Centralised Information Management System, for supervisory returns | cims.rbi.org.in |
| **DNBS return names**: DNBS-02 Important Financial Parameters, DNBS-04A and 04B liquidity, DNBS-13 overseas investment | RBI returns |
| **RBI CMS**, where a complaint arrives once escalated | cms.rbi.org.in |
| **SMA-0, SMA-1, SMA-2 and NPA** on days past due, with NPA at 90 | RBI income recognition and asset classification norms |
| Upgrade only on clearing **the entire arrears across all facilities** | RBI clarification on upgrade |
| **Key Facts Statement** and **APR** disclosure to a retail borrower | RBI |
| **Co-lending** between a bank and an NBFC as an arrangement | RBI |
| **Recovery agent conduct**: identification, calling hours, no harassment | RBI Fair Practices Code |
| **Hypothecation endorsed on the registration certificate** for a financed vehicle | Motor Vehicles Act, done through VAHAN |
| Escalation to the **Ombudsman** after the lender has had its turn | RBI Ombudsman Scheme |

The product's behaviour follows these. The repossession gate refuses on a missing
possession clause because that is a real doctrine, not because it makes a good demo.

## 2. Reconstructed: right in shape, not copied from anything

**Every screen in the Operator.** None is a screenshot, a trace, or a copy of any
page.

The lending platform is deliberately **not any vendor's product**. No lending platform
is used by a majority of NBFCs: the market is split across a dozen vendors, several
large lenders have built their own, and plenty run different software per product
line. Building the demonstration on one vendor's chrome would make it wrong for almost
everybody we show it to. What is reproduced is the shape the category shares:
origination, servicing, collections and co-lending, and the object names every lender
uses whatever software sits underneath (application, sanction, deviation, disbursal
memo, mandate, bucket, demand notice, settlement advice).

The four registries are drawn in the design language of Indian government filing
portals, which is a real and consistent language (a utility strip, a banded identity
header, a breadcrumb, a form). They are **not** copies of the real pages, and the real
pages look different.

**No public authority's emblem is drawn anywhere in this build.** The registry mark is
a plain lettered tile. Reproducing the State Emblem is restricted under the State
Emblem of India (Prohibition of Improper Use) Act 2005, and a sales demonstration has
no business doing it. This was a decision, not an oversight, and it is recorded in
`src/45-operator-lending.js` where the mark is drawn.

**The 109 knowledge documents** are written to be typical of the sector. They are not
extracted from, scraped from, or derived from any lender's actual policy. Where a
document states a regulatory position, that position is real; where it states an
internal threshold (a margin ceiling, a delegation limit, a retention amount), that is
an invented number chosen to be plausible.

## 3. Invented: all of it

Everything specific to a person, a company or a case:

- **Kritanya Finserv Limited**, its AUM, branch count, headcount, subsidiaries and book
- Every **employee**: all 39 sign-in profiles across 37 roles
- Every **customer**: Ravindra Salunkhe, Sameer Qadri, Anjali Deshmukh, Meenakshi
  Raghavan and the rest
- Every **account number, vehicle registration, property, KIN, filing reference and
  acknowledgement number**
- Every **partner**: Nandini Bank, Sahyadri Cooperative Bank, Meghdoot Small Finance
  Bank, Sanghvi Motors
- Every **figure and date** on every screen

No real person's data appears anywhere in this build.

## 4. Things to be careful about saying

A few places where the build shows something that looks like a rule but is not being
claimed as one. If asked, answer with what is on this list rather than improvising.

**Filing due dates.** The CIMS dashboard shows a due date against each return. The
date is invented and shown as a system fact, not as a claim about the statutory
timeline. The **thirty-day CERSAI window is real** and is claimed as such.

**Complaint response windows.** The RBI CMS screen shows a "response due" date per
complaint. Same position: it is a date in a system, not a claim about the scheme's
timelines.

**The margin ladder** in the origination run (90 / 80 / 75 / 65 per cent by asset age,
less five points for tippers and construction equipment) is a plausible internal credit
policy, not a regulation. Present it as Kritanya's policy, which is what the documents
say it is.

**Delegation limits** (who may approve a deviation of how many percentage points) are
invented. Every lender sets its own.

**The bureau names** are not used. The screens say "commercial bureau" and "consumer
bureau" rather than naming one, because naming one invites a comparison we do not need.

## 5. What to do when a client says "that is not how we do it"

Agree, immediately, and mean it. This is a whole-sector build: the footprint is drawn
broadly enough that no single lender matches all of it, so some of it is wrong for
everybody. That is a feature of the build and it is the reason the rest of it is
credible.

Then say what actually retargets: the identity block, the roles, the documents, the
thresholds. The regulations, the operating model and the failure modes belong to the
industry and do not move. `HANDOVER.md` sets out how.
