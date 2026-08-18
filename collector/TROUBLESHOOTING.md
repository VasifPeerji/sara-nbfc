# Nothing is showing up in viewer.html

Work down this list. The first step usually settles it, and in most
cases the data is already there.

---

## Step 1. Ask the collector

Open this in a browser, replacing the path with wherever the demo lives:

```
https://<your-link>/collect.php?check=1
```

What you get back tells you which link in the chain is broken.

### You see JSON with `"events": 0`

The collector works and can write, but nothing has arrived.

- Are `sara_cesi.html` and `collect.php` **in the same folder**? The demo
  posts to a path beside itself. If the html is in `/demo/` and the php
  is at the root, they never meet.
- Have a conversation in the demo, wait ten seconds, then reload the
  check URL. Batches go every 20 events, every 30 seconds, and when the
  page is closed.

### You see JSON with `"events"` above 0

**The data is arriving.** The viewer just cannot read it, which is
Step 2 below.

### You see JSON with `"writable": false`

The web user cannot write to the folder. Ask the team to `chmod 755`
(or `775`) the folder the files are in, or to create a `data` folder
inside it and make that writable.

### You see the PHP source code, starting `<?php`

**The host is not running PHP.** It is serving `collect.php` as a text
file. Nothing has ever been stored and nothing ever will be.

This is what happens on a static host: S3, Azure Blob, Netlify,
Cloudflare Pages, a plain CDN. Ask the team whether PHP is enabled for
that folder. If it is a static host, use `apps-script.gs` instead — it
needs no server at all, writes into a Google Sheet, and takes about five
minutes to set up.

### You get 404

`collect.php` is not in that folder, or it was renamed. It has to sit
beside `sara_cesi.html`.

### You get 403

Something in front of the site is blocking it: a WAF, or a rule that
denies POST or `.php` in that directory. Ask the team.

---

## Step 2. Let the viewer read the log

`collect.php` deliberately drops an `.htaccess` in `data/` denying web
access, because transcripts should not be fetchable by anyone who
guesses a filename. **That also stops `viewer.html` fetching the file
directly**, which is why it can show nothing while the data is fine.

Two ways round it. Either is correct.

### Read it in the browser

1. Open `collect.php` and set a read key:

   ```php
   $READ_KEY = 'pick-something-random';
   ```

2. Open the viewer with that key on the end:

   ```
   https://<your-link>/viewer.html?k=pick-something-random
   ```

The viewer asks the collector for the log rather than fetching the file,
so `data/` stays protected.

### Or just download it

Pull `data/usage-2026-08.ndjson` off the server with FTP, cPanel or
whatever the team uses, then open `viewer.html` anywhere and use the
**Open a log…** button. Works offline, on your own laptop.

---

## Step 3. Check what the demo itself thinks

In the demo, open **Settings → Usage**.

- **"waiting to send"** with a number: the demo has data but cannot
  reach the collector. Something is wrong at Step 1. Nothing is lost;
  it will go as soon as the collector answers.
- **Sessions 0, Exchanges 0**: recording is off in this build. The
  edition needs `analytics.level: "full"` and an `endpoint`. Check the
  build is the current one.
- **Numbers look right, "Stored in this browser only"**: this build has
  no endpoint set. It is an older build. Rebuild and redeploy.

You can also press **Send now** on that panel to force a batch.

---

## Step 4. Look at the browser console

In the demo, F12, Network tab, filter for `collect`.

- **No request at all** — the build has no endpoint, or the page was
  opened from a file rather than over http. A `file://` copy sends
  nothing by design.
- **A request that is red / failed** — read the status:
  - `404` the collector is not at that path
  - `403` a key mismatch, or a WAF
  - `500` the collector cannot write; see Step 1
  - `CORS` the request was answered without the right headers. The demo
    retries the rest of the session without CORS automatically, so this
    usually recovers by itself.

---

## The two most common causes, in order

1. **The viewer cannot read a folder that is denied on purpose.** The
   data is there. Do Step 2.
2. **The host does not execute PHP.** Step 1 tells you in one look. Use
   `apps-script.gs` instead.

Nothing in this list loses data. Anything the demo could not send stays
in the visitor's browser and goes with the next batch, including on
their next visit days later.
