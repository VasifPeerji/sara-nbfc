/* Minimal DOM/browser stubs so the src modules can be exercised in Node.
   Loaded first by every test file. */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

/* ---------- stubs ---------- */
function stubNode(tag){
  const node = {
    tagName: (tag || "div").toUpperCase(),
    children: [], style: { setProperty(){}, removeProperty(){} },
    dataset: {}, _attrs: {}, _html: "", textContent: "", value: "",
    classList: {
      _set: new Set(),
      add(...c){ c.forEach(x => this._set.add(x)); },
      remove(...c){ c.forEach(x => this._set.delete(x)); },
      toggle(c, on){ if(on === undefined) this._set.has(c) ? this._set.delete(c) : this._set.add(c); else on ? this._set.add(c) : this._set.delete(c); },
      contains(c){ return this._set.has(c); },
    },
    set innerHTML(v){ this._html = String(v); },
    get innerHTML(){ return this._html; },
    setAttribute(k, v){ this._attrs[k] = v; },
    getAttribute(k){ return this._attrs[k] === undefined ? null : this._attrs[k]; },
    removeAttribute(k){ delete this._attrs[k]; },
    appendChild(c){ this.children.push(c); return c; },
    insertBefore(c){ this.children.unshift(c); return c; },
    removeChild(c){ return c; },
    remove(){},
    addEventListener(){}, removeEventListener(){},
    querySelector(){ return null; },
    querySelectorAll(){ return []; },
    closest(){ return null; },
    getBoundingClientRect(){ return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
    focus(){}, click(){}, scrollIntoView(){},
    insertAdjacentHTML(){},
  };
  return node;
}

const documentStub = {
  readyState: "complete",
  documentElement: stubNode("html"),
  body: stubNode("body"),
  title: "",
  getElementById(){ return null; },
  querySelector(){ return null; },
  querySelectorAll(){ return []; },
  createElement(tag){ return stubNode(tag); },
  addEventListener(){},
  execCommand(){ return true; },
};

const storage = new Map();
const localStorageStub = {
  getItem(k){ return storage.has(k) ? storage.get(k) : null; },
  setItem(k, v){ storage.set(k, String(v)); },
  removeItem(k){ storage.delete(k); },
  clear(){ storage.clear(); },
};

global.window = global;
global.document = documentStub;
global.localStorage = localStorageStub;
global.navigator = { language: "en-GB", clipboard: null };
global.location = { reload(){} };
global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} });
global.performance = global.performance || { now: () => Date.now() };
global.AbortController = global.AbortController || function(){ this.signal = {}; this.abort = () => {}; };
global.Blob = global.Blob || function(){};
global.URL = global.URL || { createObjectURL: () => "blob:x", revokeObjectURL(){} };
global.prompt = (msg, def) => (global.__promptReply !== undefined ? global.__promptReply : (def || "x"));
global.confirm = () => (global.__confirmReply !== undefined ? global.__confirmReply : true);
global.alert = () => {};
global.SpeechSynthesisUtterance = function(){};
global.speechSynthesis = { speak(){}, cancel(){}, speaking: false };

/* ---------- module loading (mirrors build.py order) ---------- */
const JS_FILES = [
  "19-logos.js", "20-icons.js", "21-util.js", "22-state.js", "23-markdown.js", "24-retrieval.js",
  "25-llm.js", "26-charts.js", "26b-diagrams.js", "27-artifacts.js", "28-panel.js", "29-chat.js",
  "30-sidebar.js", "31-login.js", "32-settings.js", "33-palette.js", "34-export.js",
  "36-library.js", "37-models.js", "38-files.js", "39-web.js", "43-journeys.js",
  "45-operator-lending.js", "44-operator-shell.js", "46-router.js", "47-analytics.js",
  /* 40-init.js is excluded: it boots against a real DOM */
];

function loadEdition(name){
  const file = path.join(ROOT, "editions", name + ".js");
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

function loadSrc(){
  JS_FILES.forEach(f => {
    const file = path.join(ROOT, "src", f);
    vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
  });
}

/* ---------- tiny assertion kit ---------- */
let passed = 0;
const failures = [];
function ok(cond, label){
  if(cond) passed++;
  else failures.push(label);
}
function eq(actual, expected, label){
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if(a === b) passed++;
  else failures.push(`${label}\n      expected ${b}\n      actual   ${a}`);
}
function has(hay, needle, label){
  if(String(hay).indexOf(needle) !== -1) passed++;
  else failures.push(`${label}\n      "${needle}" not found in: ${String(hay).slice(0, 220)}`);
}
function lacks(hay, needle, label){
  if(String(hay).indexOf(needle) === -1) passed++;
  else failures.push(`${label}\n      "${needle}" unexpectedly present in: ${String(hay).slice(0, 220)}`);
}
function section(name){ console.log("\n  " + name); }
function report(title){
  console.log("\n" + "=".repeat(64));
  if(failures.length){
    console.log(`  ${title}: ${passed} passed, ${failures.length} FAILED`);
    failures.forEach((f, i) => console.log(`\n  ${i + 1}. ${f}`));
    console.log("=".repeat(64));
    process.exit(1);
  }
  console.log(`  ${title}: all ${passed} checks passed`);
  console.log("=".repeat(64));
}

module.exports = { ROOT, loadEdition, loadSrc, ok, eq, has, lacks, section, report, stubNode };
