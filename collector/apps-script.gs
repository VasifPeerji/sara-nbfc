/* ==================================================================
   apps-script.gs
   The zero-infrastructure collector: transcripts land in a Google Sheet.
   ------------------------------------------------------------------
   No server, no hosting, no cost. Use this when standing up PHP or Node
   is more trouble than the demo is worth, or when the team would rather
   read the conversations in a spreadsheet than in a log file.

   SETUP, about five minutes:

     1. Create a Google Sheet. Call the first tab "events".
     2. Extensions, Apps Script. Paste this file over Code.gs.
     3. Put the Sheet id in SHEET_ID below (it is the long string in the
        Sheet URL between /d/ and /edit).
     4. Set SECRET to something random.
     5. Deploy, New deployment, type Web app.
          Execute as:      Me
          Who has access:  Anyone
        Copy the /exec URL it gives you.
     6. In editions/cesi.js:
          analytics: { level: "full",
                       endpoint: "https://script.google.com/.../exec?k=YOUR_SECRET" }
        Rebuild.

   ONE THING TO KNOW. Apps Script web apps do not return CORS headers,
   so the browser cannot read the response. SARA handles that: the first
   attempt fails, it switches to a no-cors send for the rest of the
   session, and the data arrives. Nothing is lost, because anything not
   confirmed stays in the outbox and goes with the next batch.
   ================================================================== */

var SHEET_ID = 'PUT_YOUR_SHEET_ID_HERE';
var SECRET   = 'change-this-to-something-random';
var TAB      = 'events';

var HEADERS = ['received', 'edition', 'level', 'visitor', 'name', 'company', 'email',
               'session', 'kind', 'role', 'intent', 'target', 'docId', 'sources',
               'withheld', 'ms', 'question', 'answer', 'cited', 'blocked', 'eventId'];

function doPost(e) {
  try {
    if (SECRET && (!e.parameter || e.parameter.k !== SECRET)) {
      return out({ ok: false, error: 'forbidden' });
    }
    var body = JSON.parse(e.postData.contents);
    if (!body || !body.events || !body.events.length) return out({ ok: true, stored: 0 });

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB) ||
                SpreadsheetApp.openById(SHEET_ID).insertSheet(TAB);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    var v = body.visitor || {};
    var who = v.who || {};
    var now = new Date();
    var rows = body.events.map(function (ev) {
      return [
        now,
        body.edition || '',
        body.level || '',
        v.id || '',
        who.name || '',
        who.company || '',
        who.email || '',
        (body.session || {}).id || '',
        ev.k || '',
        ev.r || '',
        ev.i || '',
        ev.tg || '',
        ev.did || '',
        ev.src === undefined ? '' : ev.src,
        ev.blk === undefined ? '' : ev.blk,
        ev.ms === undefined ? '' : ev.ms,
        ev.q || '',
        ev.a || '',
        (ev.cite || []).join(' '),
        (ev.blkd || []).join(' '),
        ev.id || '',
      ];
    });

    /* one write rather than one per row: Apps Script quotas are tight */
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    return out({ ok: true, stored: rows.length });

  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

/* A GET is handy for checking the deployment is live from a browser. */
function doGet() {
  return out({ ok: true, service: 'SARA usage collector' });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Run once from the editor to grant the Sheet permission and check the
   id is right, rather than discovering it is wrong during a demo. */
function testMe() {
  var s = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB);
  Logger.log(s ? ('OK, tab "' + TAB + '" found, ' + s.getLastRow() + ' rows')
               : ('Tab "' + TAB + '" not found'));
}
