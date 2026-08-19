/* ------------------------------------------------------------------
   Shared helpers: DOM, escaping, dates, ids, toasts, clipboard.
   ------------------------------------------------------------------ */

const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const el = (id) => document.getElementById(id);

/* Escape for HTML text nodes. Everything model-authored goes through this
   before it is ever put near innerHTML. */
function esc(s){
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
/* Escape for use inside an HTML attribute in a template string. */
function escAttr(s){ return esc(s).replace(/`/g, "&#96;"); }
/* Escape for a single-quoted JS string inside an inline handler. */
function escJs(s){
  return String(s == null ? "" : s)
    .replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;")
    .replace(/\r?\n/g, "\\n").replace(/</g, "\\x3c");
}

function uid(prefix){
  return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

function debounce(fn, ms){
  let t; return function(){ clearTimeout(t); const a = arguments, c = this; t = setTimeout(() => fn.apply(c, a), ms); };
}

function initials(name){
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return "?";
  if(parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ---------------- dates ---------------- */
function fmtTime(ts){
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function fmtDate(d){
  const dt = (d instanceof Date) ? d : new Date(d);
  if(isNaN(dt)) return String(d);
  return dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateLong(d){
  const dt = (d instanceof Date) ? d : new Date(d);
  if(isNaN(dt)) return String(d);
  return dt.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function relTime(ts){
  const s = Math.floor((Date.now() - ts) / 1000);
  if(s < 45) return "just now";
  if(s < 3600) return Math.floor(s / 60) + "m ago";
  if(s < 86400) return Math.floor(s / 3600) + "h ago";
  const d = Math.floor(s / 86400);
  if(d === 1) return "yesterday";
  if(d < 7) return d + "d ago";
  return fmtDate(ts);
}
/* Sidebar grouping, mirrors the buckets in the Sara UI. */
function dayBucket(ts){
  const now = new Date(); const then = new Date(ts);
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(then)) / 86400000);
  if(days <= 0) return "Today";
  if(days === 1) return "Yesterday";
  if(days <= 7) return "Previous 7 days";
  if(days <= 30) return "Previous 30 days";
  return then.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/* ---------------- numbers ---------------- */
function fmtNum(n){
  if(n == null || n === "" || isNaN(n)) return String(n ?? "");
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function isNumeric(v){
  if(typeof v === "number") return isFinite(v);
  if(typeof v !== "string") return false;
  return /^[-+]?[\d,]*\.?\d+%?$/.test(v.trim()) && /\d/.test(v);
}
function toNum(v){
  if(typeof v === "number") return v;
  const m = String(v).replace(/[^0-9.\-]/g, "");
  const n = parseFloat(m);
  return isNaN(n) ? 0 : n;
}

/* ---------------- colour ---------------- */
function hexToRgb(hex){
  let h = String(hex || "").replace("#", "").trim();
  if(h.length === 3) h = h.split("").map(c => c + c).join("");
  const n = parseInt(h, 16);
  if(isNaN(n)) return { r: 77, g: 124, b: 254 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgba(hex, a){
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function mixHex(hex, target, amount){
  const a = hexToRgb(hex), b = hexToRgb(target);
  const m = (x, y) => Math.round(x + (y - x) * amount);
  return "#" + [m(a.r, b.r), m(a.g, b.g), m(a.b, b.b)].map(v => v.toString(16).padStart(2, "0")).join("");
}
/* Readable foreground for a given background. */
function onColor(hex){
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#10131a" : "#ffffff";
}
/* Stable colour for a string, used for avatars and system tiles. */
const PALETTE = ["#4d7cfe","#2fbf71","#e0a11b","#ef4a5c","#3aa8e0","#a855f7","#ec4899","#84cc16","#f97316","#14b8a6"];
function hashColor(s){
  let h = 0; const str = String(s || "");
  for(let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/* ---------------- storage ---------------- */
const Store = {
  key(name){ return `sara_${(window.SARA_EDITION && SARA_EDITION.slug) || "app"}_${name}`; },
  get(name, fallback){
    try{
      const raw = localStorage.getItem(Store.key(name));
      return raw == null ? fallback : JSON.parse(raw);
    }catch(e){ return fallback; }
  },
  set(name, value){
    try{ localStorage.setItem(Store.key(name), JSON.stringify(value)); return true; }
    catch(e){ return false; }
  },
  del(name){ try{ localStorage.removeItem(Store.key(name)); }catch(e){} },
};

/* ---------------- toasts ---------------- */
const TOAST_ICON = { ok: "check", err: "alert", warn: "alert", info: "info" };
function toast(msg, kind, ms){
  const wrap = el("toasts"); if(!wrap) return;
  const k = kind || "info";
  const node = document.createElement("div");
  node.className = "toast " + k;
  node.innerHTML = Icons.el(TOAST_ICON[k] || "info") + `<span>${esc(msg)}</span>`;
  wrap.appendChild(node);
  setTimeout(() => {
    node.classList.add("leaving");
    setTimeout(() => node.remove(), 220);
  }, ms || 3000);
}

/* ---------------- clipboard ---------------- */
async function copyText(text, label){
  try{
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(text);
    }else{
      /* file:// pages are not a secure context in some browsers */
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:-9999px;opacity:0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
    toast((label || "Copied") + " to clipboard", "ok");
    return true;
  }catch(e){
    toast("Could not copy to clipboard", "err");
    return false;
  }
}

function downloadBlob(content, filename, mime){
  const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* Filesystem-safe filename. */
function safeName(s){
  return String(s || "sara").replace(/[^\w\d\-. ]+/g, "").replace(/\s+/g, "_").slice(0, 70) || "sara";
}

/* ---------------- floating layers ---------------- */
function closeFloaters(){
  $$(".menu, .pop").forEach(n => n.remove());
  $$(".convo-more.open").forEach(n => n.classList.remove("open"));
}
/* Position a floating layer inside the viewport near an anchor point. */
/* A floater is almost always opened BY a click, and that click is still
   travelling when the floater appears. It carries on up to the document
   handler in 40-init.js, whose job is to close any open floater when you
   click away from one, and that handler cannot tell "you clicked away"
   from "you just opened this". So it closed the menu inside the same
   event that created it, and the button read as doing nothing at all.

   Four of the five openers happened to hide the problem by calling
   stopPropagation on an event they were handed. The fifth, the download
   button, is invoked as `Panel.download()` with no event to stop, so it
   was broken in every build.

   Stopping propagation at each call site is the wrong fix twice over: it
   has to be remembered every time, and it cannot be done at all when the
   floater is opened from a keyboard shortcut or the command palette. So
   the flag is set here, where a floater is actually created, and read
   once by that handler.

   It clears on the next turn as well as on the next click, so a floater
   opened without a click does not go on to swallow an unrelated one. */
let FLOATER_FRESH = false;
function floaterJustOpened(){
  if(!FLOATER_FRESH) return false;
  FLOATER_FRESH = false;
  return true;
}

function placeFloater(node, x, y){
  document.body.appendChild(node);
  const r = node.getBoundingClientRect();
  const pad = 8;
  let left = x, top = y;
  if(left + r.width > window.innerWidth - pad)  left = window.innerWidth - r.width - pad;
  if(top + r.height > window.innerHeight - pad) top = Math.max(pad, y - r.height);
  node.style.left = Math.max(pad, left) + "px";
  node.style.top  = Math.max(pad, top) + "px";
  FLOATER_FRESH = true;
  setTimeout(function(){ FLOATER_FRESH = false; }, 0);
}
