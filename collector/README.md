# SARA analytics — collector and console

Three files, one console, every instance.

```
collect.php     the collector, for shared PHP hosting
collect.js      the collector, for a Node box (also serves the folder)
apps-script.gs  the collector, for zero infrastructure (writes to a Google Sheet)
viewer.html     the console: open it, read everything
make_sample.py  writes a multi-instance sample log, for trying the console
```

---

## Deploying

Put `sara_<instance>.html`, `collect.php` and `viewer.html` in the same
folder on an HTTPS host. Nothing else to configure: the endpoint in each
build is the **relative** path `collect.php`, so it resolves against
wherever the page is served from. Moving hosts moves the collector with
it, and a copy emailed as a `file://` attachment sends nothing at all.

**The one-look diagnostic:** open `<link>/collect.php?check=1`.

| What you see | What it means |
|---|---|
| JSON with an event count | working |
| Raw `<?php` source | the host is not executing PHP — use `apps-script.gs` instead |
| 404 | wrong folder |

Then open `viewer.html`. Reading over HTTP needs the read key: the
shipped `$READ_KEY` in `collect.php` and `DEFAULT_READ_KEY` in
`viewer.html` already match, so it works out of the box. Change both, or
open `viewer.html?k=yourkey`.

---

## One console, every instance

Each build sends a `label` with every batch — `Mining`, `CESI`,
`AGLink`, `Automotive`, and whatever is built next. The console groups
and filters on it. There are two ways to arrange that, and the first is
usually the right one.

### A. A collector per instance, one console over the top (recommended)

```
/sara/
  viewer.html                ONE console, for every instance
  mining/     sara_mining.html    + collect.php + data/
  cesi/       sara_cesi.html      + collect.php + data/
  aglink/     sara_aglink.html    + collect.php + data/
```

Each demo keeps posting to the **relative** `collect.php` beside it, so
nothing is rebuilt and a copy that travels as a `file://` attachment
still sends nothing at all. Point the console at all of them with
`src`, a comma separated list of collectors, relative or absolute:

```
/sara/viewer.html?src=/sara/mining/collect.php,/sara/cesi/collect.php,/sara/aglink/collect.php
```

The console reads them concurrently, merges, de-duplicates and lets the
instance chips filter them apart. **A collector that is down is named in
a banner rather than quietly reducing the numbers**, because a missing
instance otherwise looks exactly like an idle one. Add `&k=` once if
every collector shares a read key, or give an entry its own with
`...collect.php?k=itsownkey`.

Bookmark that URL. Adding an instance means adding one path to it.

> **Mind the trailing slash.** The endpoint is relative, so
> `https://host/sara/mining/` resolves it to `/sara/mining/collect.php`
> while `https://host/sara/mining` resolves it to `/sara/collect.php`.
> Make each instance a real directory with an index file and the server
> adds the slash for you.

### B. One shared collector

Deploy `collect.php` once at `/sara/`, set every build's `endpoint` to
the absolute `https://host/sara/collect.php` and rebuild. The console
then needs no `src` at all. Simpler to host, and everything lands in one
log.

The trade: an absolute endpoint means a copy handed to a prospect, or
opened from a USB stick, **will** report back. That is fine if it is
what you intend, but it stops being true to say the file does not phone
home, so stop saying it.

---

## Protecting the console

Once one console covers every instance, its URL is the most sensitive
thing in the deployment: it holds every prospect's conversations, and
`/sara/viewer.html` is a URL people guess.

The read key does not help here, because the console carries the key to
whoever opens it. Pick one of these instead:

- **Basic auth on that one path.** An `.htaccess` and an `.htpasswd`
  covering `viewer.html`. One file, supported everywhere, and the right
  answer.
- **An unguessable filename.** Rename it to something like
  `console-7fk29qd.html`. Weaker, but it takes ten seconds.
- **Do not host it.** Fetch each log with
  `collect.php?log=1&k=KEY`, save the files, and drag them onto a local
  copy of the console. It reads several at once, so this works fine.

Change `$READ_KEY` in `collect.php` and `DEFAULT_READ_KEY` in
`viewer.html` from the shipped default in any case. The default is
published in this repository.

---

## What identity is guaranteed, and what is not

`analytics.identify: "required"` makes identity a **precondition for the
application**, not a card on top of it:

- Nothing is recorded and nothing is sent until the card is completed. The
  visit event is held back so that it arrives carrying the identity.
- The app is not rendered behind the card. Removing the node in developer
  tools leaves a blank page.
- Sign-in refuses independently, which also covers a page reload
  restoring the previous session.
- Removing or hiding the card is detected, undone, and recorded as a
  tamper flag that rides on the visit event and the batch.
- The collector records **its own judgement** of whether a batch arrived
  identified, and the console believes the collector over the browser.

**What this does not do.** This is a static HTML file. A determined person
with developer tools can always defeat client-side gating — that is true
of any such file, from any vendor. What is guaranteed is that it cannot
happen *accidentally*, that no data is recorded without an identity in the
normal flow, and that a bypass appears in the console **as a bypass**
rather than sitting there looking like an ordinary anonymous visitor.

If you need a guarantee stronger than that, the answer is not a better
gate — it is serving the file from behind an authenticating proxy, or
issuing a per-recipient link. Say so plainly rather than over-claiming.

---

## The console

Open `viewer.html`. It reads through the collector, falls back to raw
paths, and if neither works it asks `?check=1` and reports the actual
cause rather than "no data".

You can also **drag log files onto it**, or use *Load files…*, including
several at once from different collectors. That is how you read instances
that report to separate endpoints side by side, and it works from
`file://` with no server at all.

**Tabs**

| Tab | What it is for |
|---|---|
| Overview | KPIs, activity over time, and ranked breakdowns by instance, organisation, role, intent, cited and withheld documents, tasks, runs, and the fields the Operator had to stop and ask for |
| People | One row per visitor, sortable on every column. Click a row to expand every session, every exchange, and the inputs and outputs of each guided task and Operator run |
| Conversations | The reading pane: list on the left, whole exchange on the right, `j`/`k` or arrow keys to move |
| Sessions | One row per session, with length, exchanges, tasks, runs and roles |
| Activity | The raw event stream, newest first |

**Filters** apply across every tab: instance, date range (24h / 7d / 30d /
90d / all, or an explicit from–to), organisation, and flags for
identified, unidentified, had a conversation, something withheld, and
bypassed the gate. **Search** matches questions, answers, names,
organisations and the values typed into tasks and runs, and highlights
what it matched.

**Sorting** is on any column in People and Sessions, and by date,
instance, intent or role in Conversations.

**Export** writes a CSV of the conversations currently on screen — the
filtered view, not the whole log. `Ctrl`/`Cmd`+`P` prints a clean report.

Press `/` to jump to search from anywhere.

---

## Levels

Set in each edition under `analytics`.

| Level | What is recorded |
|---|---|
| `off` | nothing |
| `counts` | shapes and timings only |
| `detail` | plus our own identifiers: document ids, task and run ids, refusal reasons |
| `full` | plus the conversation itself and the values typed into tasks and runs |

The level is enforced inside `track()` rather than at each call site, so a
new call site cannot leak by forgetting to check.

`full` is the shipped default because the whole point is reading the
conversation. It is the person's own words, so think before pointing a
`full` build at a customer who was promised confidentiality, and set
`analytics.disclose: true` if the link will travel beyond the people who
were on the call.

---

## Trying it without a deployment

```bash
python make_sample.py > data/sample-multi.ndjson
```

Then open `viewer.html` and drop that file on it. The sample covers four
instances, ten people, identified and unidentified visitors, conversations
with citations and withheld documents, completed tasks and Operator runs,
and two people who went round the gate — so every part of the console has
something to show.
