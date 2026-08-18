<?php
/* ==================================================================
   collect.php
   The endpoint SARA posts demo usage to, and reads it back from.
   ------------------------------------------------------------------
   PUT IT IN THE SAME FOLDER AS sara_cesi.html AND IT IS CONFIGURED.
   The page posts to a relative path, so there is no URL to set up and
   nothing to rebuild.

   Three things it does, by query string:

     POST  (no query)      store a batch
     GET   ?check=1        say whether this is working, and how much is
                           stored. Open it in a browser to diagnose
     GET   ?log=1&k=KEY    return the log, for viewer.html

   WHY READING GOES THROUGH HERE. The log lives in data/, and this file
   drops an .htaccess in there denying web access, because transcripts
   should not be fetchable by anyone who guesses the filename. That also
   means viewer.html cannot fetch the raw file, so it asks for it here
   instead, with the read key. Set $READ_KEY below and open
   viewer.html?k=THAT_KEY.

   It appends one JSON object per line. No database, no dependencies.
   ================================================================== */

/* ---------------- settings ---------------- */

/* Write key. Empty means anyone who finds the URL can add to the log,
   which is fine for a folder nobody can guess. To set one, put the same
   value here and on the end of `endpoint` in the edition, as
   ?k=YOUR_SECRET. */
$SHARED_SECRET = '';

/* Read key, used by viewer.html to pull the log back through here
   rather than fetching data/ directly, which is denied on purpose.

   This ships already matching the constant in viewer.html, so the two
   files work together the moment they are uploaded and nothing has to
   be configured. To use your own, change it in BOTH files and open
   viewer.html?k=YOUR_KEY. Set it to '' to switch web reading off
   entirely and read the log by downloading it. */
$READ_KEY = 'dz448vdctgd91acwvxxo';

$LOG_DIR      = __DIR__ . '/data';
$MAX_BODY     = 1024 * 512;                 // 512 KB per batch
$ALLOW_ORIGIN = '*';                        // or the exact demo origin

/* ------------------------------------------------------------------ */

header('Access-Control-Allow-Origin: ' . $ALLOW_ORIGIN);
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function log_file($dir) { return $dir . '/usage-' . gmdate('Y-m') . '.ndjson'; }
function all_logs($dir) { $g = glob($dir . '/usage-*.ndjson'); sort($g); return $g ?: []; }

/* ==================================================================
   GET ?check=1  — is any of this working?
   ------------------------------------------------------------------
   Open this in a browser. If you see JSON, PHP runs and the collector
   is alive. If you see this file's source code, the host is not
   executing PHP and nothing will ever be stored.
   ================================================================== */
if (isset($_GET['check'])) {
  $exists   = is_dir($LOG_DIR);
  $writable = $exists ? is_writable($LOG_DIR) : is_writable(__DIR__);
  $events = 0; $last = null; $bytes = 0;
  foreach (all_logs($LOG_DIR) as $f) {
    $bytes += filesize($f);
    $fh = fopen($f, 'r');
    if ($fh) {
      while (($line = fgets($fh)) !== false) { if (trim($line) !== '') $events++; }
      fclose($fh);
    }
  }
  if ($events) {
    $files = all_logs($LOG_DIR);
    $lines = file(end($files), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $row = json_decode(end($lines), true);
    $last = $row['server']['received'] ?? null;
  }
  header('Content-Type: application/json');
  echo json_encode([
    'ok'          => true,
    'collector'   => 'SARA usage collector',
    'php'         => PHP_VERSION,
    'dir'         => $LOG_DIR,
    'dirExists'   => $exists,
    'writable'    => (bool) $writable,
    'logFiles'    => array_map('basename', all_logs($LOG_DIR)),
    'events'      => $events,
    'bytes'       => $bytes,
    'lastReceived'=> $last,
    'readEnabled' => $READ_KEY !== '',
    'writeKeySet' => $SHARED_SECRET !== '',
    'hint'        => $writable
      ? ($events ? 'Working. Open viewer.html to read it.'
                 : 'Working, but nothing stored yet. Have a conversation in the demo first.')
      : 'The web user cannot write to this folder. chmod it to 755 or 775, or point $LOG_DIR somewhere writable.',
  ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
  exit;
}

/* ==================================================================
   GET ?log=1&k=KEY  — hand the log to viewer.html
   ================================================================== */
if (isset($_GET['log'])) {
  if ($READ_KEY === '') {
    http_response_code(403);
    header('Content-Type: text/plain');
    echo "Reading over http is switched off. Set \$READ_KEY in collect.php,\n";
    echo "then open viewer.html?k=THAT_KEY. Or download data/*.ndjson and\n";
    echo "open it with the button in viewer.html.\n";
    exit;
  }
  if (!isset($_GET['k']) || !hash_equals($READ_KEY, $_GET['k'])) {
    http_response_code(403); header('Content-Type: text/plain'); echo "wrong key\n"; exit;
  }
  header('Content-Type: application/x-ndjson; charset=utf-8');
  header('Cache-Control: no-store');
  header('X-Robots-Tag: noindex, nofollow');
  foreach (all_logs($LOG_DIR) as $f) { readfile($f); }
  exit;
}

/* ==================================================================
   POST — store a batch
   ================================================================== */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  header('Content-Type: text/plain');
  echo "This is the SARA usage collector.\n\n";
  echo "Add ?check=1 to this URL to see whether it is working.\n";
  exit;
}

if ($SHARED_SECRET !== '' && (!isset($_GET['k']) || !hash_equals($SHARED_SECRET, $_GET['k']))) {
  http_response_code(403); header('Content-Type: text/plain'); echo "no\n"; exit;
}

$raw = file_get_contents('php://input', false, null, 0, $MAX_BODY + 1);
if ($raw === false || strlen($raw) === 0) { http_response_code(400); echo "empty\n"; exit; }
if (strlen($raw) > $MAX_BODY)             { http_response_code(413); echo "too big\n"; exit; }

$in = json_decode($raw, true);
if (!is_array($in) || !isset($in['events']) || !is_array($in['events'])) {
  http_response_code(400); echo "bad payload\n"; exit;
}

/* ---------------- what the browser cannot tell us ----------------
   The client sends timezone, language and user agent. Where the
   request actually came from is only knowable here. */
function client_ip() {
  foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $h) {
    if (!empty($_SERVER[$h])) { $v = explode(',', $_SERVER[$h]); return trim($v[0]); }
  }
  return '';
}

$server = [
  'received' => gmdate('c'),
  'ip'       => client_ip(),
  'country'  => $_SERVER['HTTP_CF_IPCOUNTRY'] ?? '',   // present behind Cloudflare
  'origin'   => $_SERVER['HTTP_ORIGIN'] ?? '',
];

if (!is_dir($LOG_DIR)) { @mkdir($LOG_DIR, 0755, true); }

/* Deny direct web access to the transcripts. viewer.html reads them
   through ?log= above rather than fetching the file, precisely because
   of this. Apache honours it; on nginx, deny /data in the site config. */
$ht = $LOG_DIR . '/.htaccess';
if (!file_exists($ht)) { @file_put_contents($ht, "Require all denied\nDeny from all\n"); }

$fh = @fopen(log_file($LOG_DIR), 'ab');
if (!$fh) {
  http_response_code(500);
  header('Content-Type: application/json');
  echo json_encode(['ok' => false, 'error' => 'cannot write to ' . $LOG_DIR,
                    'hint' => 'chmod the folder to 755 or 775']);
  exit;
}
flock($fh, LOCK_EX);
$n = 0;
foreach ($in['events'] as $e) {
  if (!is_array($e)) continue;
  /* The server's own view of the batch. A browser can be tampered
     with, a collector cannot, so the judgement about whether this
     arrived identified is recorded here rather than left to be
     re-derived later from data the browser supplied. */
  $who = is_array($in['visitor'] ?? null) ? ($in['visitor']['who'] ?? null) : null;
  $named = is_array($who) && !empty($who['name']) && empty($who['skipped']);
  $tamper = is_array($in['visitor'] ?? null) ? ($in['visitor']['tamper'] ?? null) : null;
  $server['identified'] = $named;
  if (!empty($tamper)) $server['tamper'] = $tamper;

  $row = [
    'app'     => $in['app']     ?? '',
    'edition' => $in['edition'] ?? '',
    'label'   => $in['label']   ?? '',
    'level'   => $in['level']   ?? '',
    'visitor' => $in['visitor'] ?? null,
    'session' => $in['session'] ?? null,
    'server'  => $server,
    'event'   => $e,
  ];
  fwrite($fh, json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
  $n++;
}
flock($fh, LOCK_UN);
fclose($fh);

header('Content-Type: application/json');
echo json_encode(['ok' => true, 'stored' => $n]);
