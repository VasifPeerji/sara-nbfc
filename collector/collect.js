/* ==================================================================
   collect.js
   The same collector, for a host that runs Node rather than PHP.
   ------------------------------------------------------------------
       node collect.js
       PORT=8080 SECRET=... LOG_DIR=./data ROOT=./public node collect.js

   It also serves the folder it sits in, so putting sara_cesi.html,
   viewer.html and this file together and running it is the entire
   deployment. Requests to /collect are collected; everything else is
   served as a file.

   No dependencies. Appends one JSON object per event to a monthly
   newline-delimited file, exactly like collect.php, so viewer.html
   reads either.

   Behind nginx or IIS, proxy /collect to this and let the front end
   terminate TLS.
   ================================================================== */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8787);
const SECRET = process.env.SECRET || "";   /* empty means no check */
const ROOT    = process.env.ROOT || __dirname;
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "data");
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";
const MAX_BODY = 512 * 1024;

fs.mkdirSync(LOG_DIR, { recursive: true });

function clientIp(req) {
  const h = req.headers;
  const fwd = h["cf-connecting-ip"] || h["x-forwarded-for"] || "";
  if (fwd) return String(fwd).split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "";
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Vary", "Origin");
}

/* Serving the folder as well as collecting means one process is the
   whole deployment: put sara_cesi.html, viewer.html and this file in a
   directory, run it, and the demo posts to a sibling path exactly as it
   would on a PHP host. On shared hosting the web server already does
   this half and collect.php does the other. */
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript",
                ".css": "text/css", ".json": "application/json",
                ".png": "image/png", ".svg": "image/svg+xml",
                ".ndjson": "application/x-ndjson", ".ico": "image/x-icon" };

function serveStatic(req, res, pathname) {
  /* resolve inside the directory, so ../ cannot escape it */
  const rel = decodeURIComponent(pathname).replace(/^\/+/, "") || "index.html";
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(path.resolve(ROOT))) { res.writeHead(403); return res.end("no\n"); }

  fs.readFile(file, function (err, buf) {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("not found\n"); }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Robots-Tag": "noindex, nofollow",
    });
    res.end(buf);
  });
}

/* matches viewer.html, so the pair works on upload with no setup */
const READ_KEY = process.env.READ_KEY || "dz448vdctgd91acwvxxo";

function allLogs() {
  try {
    return fs.readdirSync(LOG_DIR).filter(f => /^usage-.*\.ndjson$/.test(f)).sort()
      .map(f => path.join(LOG_DIR, f));
  } catch (e) { return []; }
}

http.createServer(function (req, res) {
  const url = new URL(req.url, "http://x");
  const pathname = url.pathname;
  const isCollect = /\/collect(\.php|\.js)?$/.test(pathname);

  /* The log folder is denied to the web on purpose, exactly as the
     .htaccess does on Apache, so the viewer takes the same path here as
     it does on a real host rather than working only in the lab. */
  if (req.method === "GET" && /^\/data\//.test(pathname)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("denied\n");
  }

  /* ?check=1 — is any of this working? */
  if (isCollect && url.searchParams.has("check")) {
    let events = 0, bytes = 0, last = null;
    const files = allLogs();
    files.forEach(f => {
      const txt = fs.readFileSync(f, "utf8");
      bytes += Buffer.byteLength(txt);
      const lines = txt.split(/\r?\n/).filter(Boolean);
      events += lines.length;
      if (lines.length) {
        try { last = (JSON.parse(lines[lines.length - 1]).server || {}).received || last; } catch (e) {}
      }
    });
    let writable = true;
    try { fs.accessSync(LOG_DIR, fs.constants.W_OK); } catch (e) { writable = false; }
    cors(res);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      ok: true, collector: "SARA usage collector", runtime: "node " + process.version,
      dir: LOG_DIR, dirExists: fs.existsSync(LOG_DIR), writable: writable,
      logFiles: files.map(f => path.basename(f)), events: events, bytes: bytes,
      lastReceived: last, readEnabled: READ_KEY !== "", writeKeySet: SECRET !== "",
      hint: !writable ? "The process cannot write to the log folder."
            : events ? "Working. Open viewer.html to read it."
            : "Working, but nothing stored yet. Have a conversation in the demo first.",
    }, null, 2));
  }

  /* ?log=1&k=KEY — hand the log to viewer.html */
  if (isCollect && url.searchParams.has("log")) {
    cors(res);
    if (!READ_KEY) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      return res.end("Reading over http is switched off. Set READ_KEY.\n");
    }
    if (url.searchParams.get("k") !== READ_KEY) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      return res.end("wrong key\n");
    }
    res.writeHead(200, { "Content-Type": "application/x-ndjson; charset=utf-8",
                         "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" });
    return res.end(allLogs().map(f => fs.readFileSync(f, "utf8")).join(""));
  }

  if (req.method === "GET" && !isCollect) return serveStatic(req, res, pathname);

  if (req.method === "GET" && isCollect) {
    res.writeHead(405, { "Content-Type": "text/plain" });
    return res.end("This is the SARA usage collector.\n\nAdd ?check=1 to see whether it is working.\n");
  }

  cors(res);

  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (req.method !== "POST") { res.writeHead(405, { "Content-Type": "text/plain" }); return res.end("POST only\n"); }

  if (SECRET && url.searchParams.get("k") !== SECRET) {
    res.writeHead(403, { "Content-Type": "text/plain" }); return res.end("no\n");
  }

  let body = "", tooBig = false;
  req.on("data", function (c) {
    body += c;
    if (body.length > MAX_BODY) { tooBig = true; req.destroy(); }
  });
  req.on("end", function () {
    if (tooBig) { res.writeHead(413); return res.end("too big\n"); }
    let inp;
    try { inp = JSON.parse(body); } catch (e) { res.writeHead(400); return res.end("bad json\n"); }
    if (!inp || !Array.isArray(inp.events)) { res.writeHead(400); return res.end("bad payload\n"); }

    const who = (inp.visitor || {}).who || null;
    const server = {
      received: new Date().toISOString(),
      ip: clientIp(req),
      country: req.headers["cf-ipcountry"] || "",
      origin: req.headers.origin || "",
      /* The server's own view of the batch. A browser can be tampered
         with, a collector cannot, so the judgement about whether this
         arrived identified is recorded here rather than left to be
         re-derived later from data the browser supplied. */
      identified: !!(who && who.name && !who.skipped),
    };
    if ((inp.visitor || {}).tamper) server.tamper = inp.visitor.tamper;

    const file = path.join(LOG_DIR, "usage-" + new Date().toISOString().slice(0, 7) + ".ndjson");
    const lines = inp.events.map(function (e) {
      return JSON.stringify({
        app: inp.app || "", edition: inp.edition || "", label: inp.label || "",
        level: inp.level || "",
        visitor: inp.visitor || null, session: inp.session || null,
        server: server, event: e,
      });
    }).join("\n") + "\n";

    fs.appendFile(file, lines, function (err) {
      if (err) { res.writeHead(500); return res.end("cannot write\n"); }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, stored: inp.events.length }));
    });
  });
}).listen(PORT, function () {
  console.log("SARA collector + static server on :" + PORT);
  console.log("  serving " + ROOT);
  console.log("  logging " + LOG_DIR);
  if (!SECRET) console.log("No SECRET set: anyone who finds this URL can write to the log.");
});
