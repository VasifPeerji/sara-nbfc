# Do I send collect.php and viewer.html every time?

No. **Neither file mentions CESI, or any customer.** They are the
product; only `sara_<slug>.html` changes per prospect. So you have a
choice, and it is worth making deliberately once rather than drifting.

---

## Model A — one folder per prospect

```
/d/cesi-4f9c/     sara_cesi.html   collect.php   viewer.html   data/
/d/acme-8b21/     sara_acme.html   collect.php   viewer.html   data/
```

Send all three every time. The two extra files are byte-identical
copies, so it is a drag-and-drop, not work.

**Good for:** total isolation. One prospect's link, folder and log have
nothing to do with anyone else's. If a link leaks, it leaks one demo. If
you want to hand a whole folder to a colleague, it is self-contained.

**This is what you are doing now, and it is a perfectly good default.**

---

## Model B — one collector, every prospect

Put the collector up **once**, at a stable address:

```
/analytics/collect.php
/analytics/viewer.html
/analytics/data/
```

Then each demo is a single file in its own folder:

```
/d/cesi-4f9c/sara_cesi.html
/d/acme-8b21/sara_acme.html
```

To do that, the build points at the collector by full URL instead of the
relative path. In the edition, before building:

```js
analytics: {
  level:    "full",
  endpoint: "https://<your-host>/analytics/collect.php",
  label:    "CESI",          // what this demo is called in the report
  identify: "required",
},
```

`label` is what separates prospects in the viewer. Leave it out and it
falls back to the edition slug, which still works but reads worse.

**Good for:** you only ever send the team one file. Every demo lands in
one place, and `viewer.html` grows a **demo picker** so you can look at
one prospect or all of them. Verified with two demos in one log: picking
CESI showed 1 visitor and 1 question, picking Aurora showed 1 visitor and
2, and All demos showed both.

**Watch out for:** the collector must allow the demo's origin. If the
demos and the collector are on the same host, nothing to do. If they are
on different hosts, set `$ALLOW_ORIGIN` in `collect.php` to the demo
origin, or leave it as `*`.

---

## Which to pick

| | Model A | Model B |
|---|---|---|
| Files to send the team | 3 | 1 |
| Setup per prospect | none | none, once the collector is up |
| Where the transcripts live | one folder per prospect | one place |
| One link leaking exposes | that prospect | that prospect (the log is not reachable from the demo) |
| Comparing two prospects | open two viewers | one picker |

Start with A while it is one or two demos. Move to B the first time you
find yourself opening three viewers in three tabs. Moving is not a
migration: the old folders keep working, and new builds simply point at
the shared collector.

---

## Either way, the per-demo work is the same

Whatever you choose, the only thing that changes per prospect is
`sara_<slug>.html`. `collect.php` and `viewer.html` never change: they
store and render whatever arrives, keyed by the `label` and `edition`
each build sends. They do not need to know a customer exists.
