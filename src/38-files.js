/* ------------------------------------------------------------------
   File search: reading the user's own documents, in the browser.

   The knowledge base answers questions about what the company has already
   written down. File search answers questions about the document someone
   is holding right now — the tender that arrived this morning, the
   supplier's spec, the spreadsheet a colleague sent.

   Every format here is parsed with browser primitives and nothing else:
   no pdf.js, no SheetJS, no upload, no server. DEFLATE comes from the
   platform's own DecompressionStream, which is what makes a zero-
   dependency ZIP and PDF reader possible at all. The practical
   consequence is the one enterprises ask about first: the file never
   leaves the machine. What leaves is the extract sent to the model the
   customer chose, exactly like a knowledge base document.

   Parsed files become session documents in the same BM25 index as the
   corpus, so they are retrieved, cited and inspected by the machinery
   that already exists rather than a parallel path bolted alongside it.
   ------------------------------------------------------------------ */

const FileParse = (function(){

  const MAX_BYTES = 24 * 1024 * 1024;   /* refuse beyond this, with a reason */
  const MAX_CHARS = 400000;             /* ~60k words: far more than retrieval needs */

  /* Extension drives the parser. Content sniffing is a fallback, because a
     .txt full of PDF bytes is a renamed PDF far more often than it is text. */
  const KIND_BY_EXT = {
    pdf:"pdf",
    docx:"docx", docm:"docx",
    xlsx:"xlsx", xlsm:"xlsx",
    pptx:"pptx", pptm:"pptx",
    csv:"csv", tsv:"csv",
    rtf:"rtf",
    htm:"html", html:"html",
    txt:"text", md:"text", markdown:"text", log:"text", json:"text",
    xml:"text", yaml:"text", yml:"text", ini:"text", conf:"text",
    doc:"legacy", xls:"legacy", ppt:"legacy",
  };

  const KIND_LABEL = {
    pdf:"PDF", docx:"Word document", xlsx:"Spreadsheet", pptx:"Presentation",
    csv:"Delimited data", rtf:"Rich text", html:"Web page", text:"Text file",
  };

  function extOf(name){
    const m = /\.([a-z0-9]+)\s*$/i.exec(String(name || ""));
    return m ? m[1].toLowerCase() : "";
  }
  function kindOf(name){ return KIND_BY_EXT[extOf(name)] || ""; }
  function label(kind){ return KIND_LABEL[kind] || "Document"; }
  function supported(){
    return Object.keys(KIND_BY_EXT).filter(function(e){ return KIND_BY_EXT[e] !== "legacy"; });
  }

  /* ================= binary helpers ================= */

  function hasInflate(){ return typeof DecompressionStream === "function"; }

  /* format: "deflate" for zlib-wrapped (PDF), "deflate-raw" for ZIP members */
  async function decompress(bytes, format){
    const source = new ReadableStream({
      start: function(c){ c.enqueue(bytes); c.close(); },
    });
    const out = source.pipeThrough(new DecompressionStream(format));
    return new Uint8Array(await new Response(out).arrayBuffer());
  }

  function utf8(bytes){
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }

  /* Byte-for-char view, so string offsets stay byte offsets. Chunked because
     apply() on a multi-megabyte array overflows the argument stack. */
  function latin1(bytes){
    let s = "";
    const STEP = 0x8000;
    for(let i = 0; i < bytes.length; i += STEP){
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + STEP));
    }
    return s;
  }

  /* ================= XML scanning =================
     A scanner rather than a DOMParser call: identical behaviour in the
     browser and in Node, which means the tests exercise the shipping code
     path instead of a stub. OOXML is machine-written and regular, so a
     scanner is sufficient and considerably faster than building a tree. */

  const ENTITIES = { amp:"&", lt:"<", gt:">", quot:'"', apos:"'", nbsp:" " };

  function unent(s){
    if(String(s).indexOf("&") === -1) return String(s);
    return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function(m, e){
      if(e.charAt(0) === "#"){
        const n = e.charAt(1).toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        if(!isFinite(n) || n <= 0 || n > 0x10ffff) return m;
        try{ return String.fromCodePoint(n); }catch(err){ return m; }
      }
      const v = ENTITIES[e.toLowerCase()];
      return v === undefined ? m : v;
    });
  }

  /* Namespace prefixes vary by producer (w:t, x:t, plain t), so every
     comparison is on the local name. */
  function localName(n){
    const s = String(n || "");
    const i = s.indexOf(":");
    return i === -1 ? s : s.slice(i + 1);
  }

  function attr(attrs, name){
    if(!attrs) return "";
    const re = new RegExp("(?:^|\\s)(?:[\\w.-]+:)?" + name + '\\s*=\\s*"([^"]*)"', "i");
    const m = re.exec(attrs);
    return m ? unent(m[1]) : "";
  }

  /* handler(kind, name, attrs, text) where kind is open | close | self | text */
  function scanXml(xml, handler){
    const s = String(xml || "");
    const n = s.length;
    let i = 0;
    while(i < n){
      const lt = s.indexOf("<", i);
      if(lt === -1){ if(i < n) handler("text", null, null, s.slice(i)); break; }
      if(lt > i) handler("text", null, null, s.slice(i, lt));

      /* comments and CDATA must not be parsed as tags */
      if(s.startsWith("<!--", lt)){
        const end = s.indexOf("-->", lt);
        i = end === -1 ? n : end + 3;
        continue;
      }
      if(s.startsWith("<![CDATA[", lt)){
        const end = s.indexOf("]]>", lt);
        handler("text", null, null, s.slice(lt + 9, end === -1 ? n : end));
        i = end === -1 ? n : end + 3;
        continue;
      }

      const gt = s.indexOf(">", lt);
      if(gt === -1) break;
      const raw = s.slice(lt + 1, gt);
      i = gt + 1;
      if(!raw || raw.charAt(0) === "?" || raw.charAt(0) === "!") continue;

      if(raw.charAt(0) === "/"){ handler("close", raw.slice(1).trim(), null, null); continue; }
      const self = raw.charAt(raw.length - 1) === "/";
      const body = self ? raw.slice(0, -1) : raw;
      const sp = body.search(/\s/);
      handler(self ? "self" : "open",
              (sp === -1 ? body : body.slice(0, sp)).trim(),
              sp === -1 ? "" : body.slice(sp),
              null);
    }
  }

  /* ================= ZIP =================
     Read from the central directory, never from local headers: an entry
     written in streaming mode carries zeroes for its sizes in the local
     header, and the central directory is the only place the truth lives. */

  function readZip(bytes){
    if(bytes.length < 22) return null;
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    const floor = Math.max(0, bytes.length - 65557);
    for(let i = bytes.length - 22; i >= floor; i--){
      if(dv.getUint32(i, true) === 0x06054b50){ eocd = i; break; }
    }
    if(eocd === -1) return null;

    const count = dv.getUint16(eocd + 10, true);
    let at = dv.getUint32(eocd + 16, true);
    const entries = [];
    for(let n = 0; n < count; n++){
      if(at + 46 > bytes.length || dv.getUint32(at, true) !== 0x02014b50) break;
      const nameLen  = dv.getUint16(at + 28, true);
      const extraLen = dv.getUint16(at + 30, true);
      const cmtLen   = dv.getUint16(at + 32, true);
      entries.push({
        name:   utf8(bytes.subarray(at + 46, at + 46 + nameLen)),
        method: dv.getUint16(at + 10, true),
        csize:  dv.getUint32(at + 20, true),
        local:  dv.getUint32(at + 42, true),
      });
      at += 46 + nameLen + extraLen + cmtLen;
    }
    return entries.length ? { bytes: bytes, dv: dv, entries: entries } : null;
  }

  function zipHas(zip, name){
    return zip.entries.some(function(e){ return e.name === name; });
  }
  function zipList(zip, re){
    return zip.entries.filter(function(e){ return re.test(e.name); }).map(function(e){ return e.name; });
  }

  async function zipRead(zip, name){
    const e = zip.entries.find(function(x){ return x.name === name; });
    if(!e) return "";
    const at = e.local;
    if(at + 30 > zip.bytes.length || zip.dv.getUint32(at, true) !== 0x04034b50) return "";
    const start = at + 30 + zip.dv.getUint16(at + 26, true) + zip.dv.getUint16(at + 28, true);
    const raw = zip.bytes.subarray(start, start + e.csize);
    if(e.method === 0) return utf8(raw);
    if(e.method === 8){
      try{ return utf8(await decompress(raw, "deflate-raw")); }catch(err){ return ""; }
    }
    return "";   /* bzip2/lzma members: vanishingly rare in Office output */
  }

  /* ================= DOCX ================= */

  async function parseDocx(zip){
    const warnings = [];
    if(!zipHas(zip, "word/document.xml")) return { text: "", warnings: ["This .docx has no document part and cannot be read."] };

    const parts = ["word/document.xml"].concat(
      zipList(zip, /^word\/(footnotes|endnotes)\.xml$/)
    );

    let text = "";
    for(const part of parts){
      const xml = await zipRead(zip, part);
      if(!xml) continue;
      if(part !== "word/document.xml") text += "\n\n## Notes\n\n";
      text += runsToText(xml);
    }
    return { text: tidy(text), warnings: warnings };
  }

  /* Shared by DOCX and PPTX: both mark text with a <t> run and paragraphs
     with <p>, in different namespaces that localName() flattens. */
  function runsToText(xml){
    let buf = "";
    let capture = false;
    let cellDepth = 0;

    scanXml(xml, function(kind, name, attrs, text){
      const n = localName(name);
      if(kind === "text"){ if(capture) buf += unent(text); return; }

      if(n === "t" && kind === "open"){ capture = true; return; }
      if(n === "t" && kind === "close"){ capture = false; return; }

      if(kind === "open" || kind === "self"){
        if(n === "tab") buf += "\t";
        else if(n === "br" || n === "cr") buf += "\n";
        else if(n === "tc") cellDepth++;
        return;
      }
      if(kind === "close"){
        if(n === "p") buf += cellDepth > 0 ? " " : "\n";
        else if(n === "tc"){ cellDepth = Math.max(0, cellDepth - 1); buf += " | "; }
        else if(n === "tr") buf = buf.replace(/\s*\|\s*$/, "") + "\n";
        else if(n === "tbl") buf += "\n";
      }
    });
    return buf;
  }

  /* ================= XLSX ================= */

  /* ---- number formats ----
     Excel stores a date as a plain number and a format, so a parser that
     reads only the value returns 46092 where the spreadsheet shows
     11/03/2026, and 0.075 where it shows 7.5%. On a business workbook —
     invoices, schedules, site registers — that is not a cosmetic difference:
     it is the difference between an extract the model can answer from and one
     that quietly misleads it. So the style table is read and date, time and
     percentage cells are rendered as what the person actually sees. */

  const BUILTIN_DATE = new Set([14,15,16,17,22,27,30,36,50,51,52,53,54,55,56,57,58]);
  const BUILTIN_TIME = new Set([18,19,20,21,45,46,47]);

  function numberFormats(xml){
    const custom = Object.create(null);
    const cellXfs = [];
    let inCellXfs = false;
    scanXml(xml, function(kind, name, attrs){
      const n = localName(name);
      if(n === "numFmt" && kind !== "close"){
        custom[attr(attrs, "numFmtId")] = attr(attrs, "formatCode");
        return;
      }
      if(n === "cellXfs"){ inCellXfs = (kind === "open"); return; }
      /* only the cellXfs block indexes by a cell's s= attribute; cellStyleXfs
         is a different table and reading it would shift every format */
      if(inCellXfs && n === "xf" && kind !== "close") cellXfs.push(attr(attrs, "numFmtId") || "0");
    });
    return { custom: custom, cellXfs: cellXfs };
  }

  function styleKind(styles, s){
    if(!styles) return "";
    const idx = parseInt(s, 10);
    const id = isFinite(idx) ? styles.cellXfs[idx] : undefined;
    if(id === undefined) return "";
    const num = parseInt(id, 10);
    if(num === 9 || num === 10) return "percent";
    if(BUILTIN_DATE.has(num)) return "date";
    if(BUILTIN_TIME.has(num)) return "time";

    const code = styles.custom[id];
    if(!code) return "";
    /* strip colour/locale sections and quoted literals, so a format like
       [$-409]"due "dd/mm/yyyy is judged on its date tokens alone */
    const bare = String(code).replace(/\[[^\]]*\]/g, "").replace(/"[^"]*"/g, "").replace(/\\./g, "");
    if(bare.indexOf("%") !== -1) return "percent";
    if(/[dy]/i.test(bare) && /[dmy]/i.test(bare)) return "date";
    if(/[hs]/i.test(bare) && bare.indexOf(":") !== -1) return "time";
    return "";
  }

  /* Serial 25569 is 1970-01-01 in the 1900 system. Correct from 1900-03-01
     onward, which is every date a business workbook contains; earlier serials
     are off by one because Excel believes 1900 was a leap year. */
  function excelDate(value, date1904){
    const n = parseFloat(value);
    if(!isFinite(n) || n <= 0 || n > 2958465) return null;
    const days = n + (date1904 ? 1462 : 0) - 25569;
    const d = new Date(Math.round(days * 86400000));
    return isNaN(d.getTime()) ? null : d;
  }

  function pad(n){ return String(n).padStart(2, "0"); }

  function formatCell(value, kind, date1904){
    const n = parseFloat(value);
    if(kind === "percent" && isFinite(n)){
      return trimFloat(n * 100) + "%";
    }
    if((kind === "date" || kind === "time") && isFinite(n)){
      const d = excelDate(n, date1904);
      if(!d) return value;
      const date = d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
      const time = pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());
      if(kind === "time" && n < 1) return time;
      return (n % 1 === 0) ? date : date + " " + time;
    }
    return isFinite(n) && String(value).indexOf("E") === -1 ? trimFloat(n) : value;
  }

  /* 46357.60416666666 is binary-float noise, not precision. */
  function trimFloat(n){
    const r = Math.round(n * 1e9) / 1e9;
    return String(r);
  }

  async function parseXlsx(zip){
    const warnings = [];
    const shared = sharedStrings(await zipRead(zip, "xl/sharedStrings.xml"));
    const styles = zipHas(zip, "xl/styles.xml")
      ? numberFormats(await zipRead(zip, "xl/styles.xml")) : null;
    const sheets = await sheetOrder(zip);
    if(!sheets.length) return { text: "", warnings: ["No worksheets found in this workbook."] };
    const date1904 = sheets.date1904;

    let text = "";
    let truncated = false;
    for(const sheet of sheets){
      const xml = await zipRead(zip, sheet.path);
      if(!xml) continue;
      const rows = sheetRows(xml, shared, styles, date1904);
      if(!rows.length) continue;
      if(rows.length > 500){ rows.length = 500; truncated = true; }
      text += "\n\n## " + sheet.name + "\n\n";
      text += rows.map(function(r){ return r.join(" | "); }).join("\n");
    }
    if(truncated) warnings.push("Long sheets were read to the first 500 rows.");
    return { text: tidy(text), warnings: warnings, sheets: sheets.length };
  }

  /* Sheet order and names come from workbook.xml; the file a name maps to
     comes from the relationship table. Guessing that sheet1.xml is the
     first tab is right most of the time and wrong exactly when it matters. */
  async function sheetOrder(zip){
    const wb = await zipRead(zip, "xl/workbook.xml");
    const rels = await zipRead(zip, "xl/_rels/workbook.xml.rels");
    /* old Mac workbooks count days from 1904, which shifts every date by
       four years and a day if it is ignored */
    const date1904 = /date1904\s*=\s*"(1|true)"/i.test(wb);

    const byId = {};
    scanXml(rels, function(kind, name, attrs){
      if(localName(name) !== "Relationship" || kind === "close") return;
      const target = attr(attrs, "Target").replace(/^\/?xl\//, "").replace(/^\.\//, "");
      byId[attr(attrs, "Id")] = "xl/" + target;
    });

    const out = [];
    scanXml(wb, function(kind, name, attrs){
      if(localName(name) !== "sheet" || kind === "close") return;
      const id = attr(attrs, "id");         /* r:id, matched on local name */
      const path = byId[id];
      if(path && zipHas(zip, path)) out.push({ name: attr(attrs, "name") || "Sheet", path: path });
    });

    const list = out.length ? out
      /* no usable relationships: fall back to file order */
      : zipList(zip, /^xl\/worksheets\/sheet\d+\.xml$/)
          .sort(function(a, b){ return (parseInt(/(\d+)/.exec(a)[1], 10) - parseInt(/(\d+)/.exec(b)[1], 10)); })
          .map(function(p, i){ return { name: "Sheet " + (i + 1), path: p }; });
    list.date1904 = date1904;
    return list;
  }

  function sharedStrings(xml){
    const out = [];
    let cur = null, capture = false;
    scanXml(xml, function(kind, name, attrs, text){
      const n = localName(name);
      if(kind === "text"){ if(capture && cur !== null) cur += unent(text); return; }
      if(n === "si"){
        if(kind === "open"){ cur = ""; }
        else if(kind === "close"){ out.push(cur || ""); cur = null; }
        return;
      }
      if(n === "t") capture = (kind === "open");
    });
    return out;
  }

  function colIndex(ref){
    const m = /^([A-Z]+)/.exec(String(ref).toUpperCase());
    if(!m) return -1;
    let n = 0;
    for(let i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64);
    return n - 1;
  }

  function sheetRows(xml, shared, styles, date1904){
    const rows = [];
    let row = null, cells = null;
    let type = "", col = -1, value = "", inline = "", style = "";
    let inV = false, inT = false;

    const flushCell = function(){
      if(col < 0 && !value && !inline) { type = ""; value = ""; inline = ""; style = ""; return; }
      let out = "";
      if(type === "s"){
        const idx = parseInt(value, 10);
        out = (isFinite(idx) && shared[idx] !== undefined) ? shared[idx] : "";
      }else if(type === "inlineStr"){
        out = inline;
      }else if(type === "b"){
        out = value === "1" ? "TRUE" : value === "0" ? "FALSE" : value;
      }else if(type === "e"){
        out = value;                       /* #REF!, #N/A: show it, do not hide it */
      }else{
        /* a bare number: the style decides whether it is a date or a percent */
        out = value ? formatCell(value, styleKind(styles, style), date1904) : inline;
      }
      if(cells && col >= 0) cells[col] = out;
      else if(cells) cells.push(out);
      type = ""; value = ""; inline = ""; style = ""; col = -1;
    };

    scanXml(xml, function(kind, name, attrs, text){
      const n = localName(name);
      if(kind === "text"){
        if(inV) value += unent(text);
        else if(inT) inline += unent(text);
        return;
      }
      if(n === "row"){
        if(kind === "open"){ cells = []; row = true; }
        else if(kind === "close" && row){
          const width = cells.length;
          for(let i = 0; i < width; i++) if(cells[i] === undefined) cells[i] = "";
          if(cells.some(function(v){ return String(v).trim() !== ""; })) rows.push(cells);
          cells = null; row = false;
        }
        return;
      }
      if(n === "c"){
        if(kind === "open" || kind === "self"){
          type = attr(attrs, "t") || "";
          col = colIndex(attr(attrs, "r"));
          style = attr(attrs, "s") || "";
          value = ""; inline = "";
          if(kind === "self") flushCell();
        }else if(kind === "close") flushCell();
        return;
      }
      /* only <v> and the <t> inside <is> hold values; <f> holds the formula
         and must never be read as data */
      if(n === "v"){ inV = (kind === "open"); if(kind === "open") value = ""; return; }
      if(n === "t"){ inT = (kind === "open"); return; }
    });
    return rows;
  }

  /* ================= PPTX ================= */

  /* Notes are matched through each slide's relationship file, not by
     number. PowerPoint numbers notesSlide parts in the order notes were
     first added, so a deck whose only note is on slide two stores it as
     notesSlide1 — and pairing by number silently attributes it to slide one.
     Wrong content under a confident heading is worse than no content. */
  async function notesFor(zip, slidePath){
    const rels = "ppt/slides/_rels/" + slidePath.split("/").pop() + ".rels";
    if(!zipHas(zip, rels)) return "";
    let target = "";
    scanXml(await zipRead(zip, rels), function(kind, name, attrs){
      if(localName(name) !== "Relationship" || kind === "close" || target) return;
      if(!/notesSlide$/.test(attr(attrs, "Type"))) return;
      target = attr(attrs, "Target").replace(/^\.\.\//, "").replace(/^\/?ppt\//, "");
    });
    if(!target) return "";
    const path = "ppt/" + target;
    return zipHas(zip, path) ? tidy(runsToText(await zipRead(zip, path))) : "";
  }

  async function parsePptx(zip){
    const slides = zipList(zip, /^ppt\/slides\/slide\d+\.xml$/)
      .sort(function(a, b){ return parseInt(/(\d+)/.exec(a)[1], 10) - parseInt(/(\d+)/.exec(b)[1], 10); });
    if(!slides.length) return { text: "", warnings: ["No slides found in this presentation."] };

    let text = "";
    for(let i = 0; i < slides.length; i++){
      const body = tidy(runsToText(await zipRead(zip, slides[i])));
      const notes = await notesFor(zip, slides[i]);
      text += "\n\n## Slide " + (i + 1) + "\n\n" + body;
      if(notes) text += "\n\nSpeaker notes: " + notes;
    }
    return { text: tidy(text), warnings: [], pages: slides.length };
  }

  /* ================= PDF =================
     Deliberately xref-free. Real PDFs in circulation have damaged cross
     reference tables, incremental updates and hybrid xref streams, and a
     reader that insists on walking them correctly fails on files every
     other tool opens. So every stream in the file is harvested and then
     classified by what it contains: content streams carry text operators,
     ToUnicode maps carry bfchar and bfrange. That is all text extraction
     needs, and it degrades gracefully instead of throwing. */

  const CP1252_HIGH =
    "€‚ƒ„…†‡ˆ‰Š‹ŒŽ" +
    "‘’“”•–—˜™š›œžŸ";

  function winAnsi(b){
    if(b >= 128 && b < 160) return CP1252_HIGH.charAt(b - 128);
    return String.fromCharCode(b);
  }

  function hexToStr(hex){
    const h = String(hex).replace(/[^0-9a-fA-F]/g, "");
    if(h.length <= 2) return String.fromCharCode(parseInt(h, 16) || 0);
    let s = "";
    for(let i = 0; i + 1 < h.length; i += 4){
      const cu = parseInt(h.substr(i, 4), 16);
      if(isFinite(cu)) s += String.fromCharCode(cu);
    }
    return s;
  }

  /* Filters chain, and real producers use chains: ReportLab wraps its
     content streams in /Filter [ /ASCII85Decode /FlateDecode ], so a reader
     that only looks for FlateDecode inflates base-85 text and gets nothing.
     Each of these is small enough to be worth having rather than declaring
     the file unreadable. */
  function ascii85(bytes){
    const out = [];
    let tuple = 0, count = 0;
    let i = 0;
    /* skip an optional <~ prefix */
    if(bytes.length > 1 && bytes[0] === 60 && bytes[1] === 126) i = 2;
    for(; i < bytes.length; i++){
      const c = bytes[i];
      if(c === 126) break;                              /* ~> terminator */
      if(c === 32 || c === 10 || c === 13 || c === 9 || c === 12 || c === 0) continue;
      if(c === 122 && count === 0){ out.push(0, 0, 0, 0); continue; }   /* z */
      if(c < 33 || c > 117) continue;
      tuple = tuple * 85 + (c - 33);
      if(++count === 5){
        out.push((tuple >>> 24) & 255, (tuple >>> 16) & 255, (tuple >>> 8) & 255, tuple & 255);
        tuple = 0; count = 0;
      }
    }
    if(count > 1){
      for(let k = count; k < 5; k++) tuple = tuple * 85 + 84;   /* pad with 'u' */
      const full = [(tuple >>> 24) & 255, (tuple >>> 16) & 255, (tuple >>> 8) & 255, tuple & 255];
      for(let k = 0; k < count - 1; k++) out.push(full[k]);
    }
    return new Uint8Array(out);
  }

  function asciiHex(bytes){
    let hex = "";
    for(let i = 0; i < bytes.length; i++){
      const c = bytes[i];
      if(c === 62) break;                               /* > terminator */
      const ch = String.fromCharCode(c);
      if(/[0-9a-fA-F]/.test(ch)) hex += ch;
    }
    if(hex.length % 2) hex += "0";
    const out = new Uint8Array(hex.length / 2);
    for(let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  function runLength(bytes){
    const out = [];
    let i = 0;
    while(i < bytes.length){
      const n = bytes[i++];
      if(n === 128) break;
      if(n < 128){ for(let k = 0; k <= n && i < bytes.length; k++) out.push(bytes[i++]); }
      else { const b = bytes[i++]; for(let k = 0; k < 257 - n; k++) out.push(b); }
    }
    return new Uint8Array(out);
  }

  function parseCMap(src){
    const map = Object.create(null);
    let m;

    const ranges = /beginbfrange([\s\S]*?)endbfrange/g;
    while((m = ranges.exec(src))){
      let block = m[1];
      /* array form first, then blank it out so the triple form below does
         not re-match its first two tokens */
      const arr = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\[([\s\S]*?)\]/g;
      let a;
      while((a = arr.exec(block))){
        const lo = parseInt(a[1], 16);
        const items = a[3].match(/<[0-9a-fA-F]*>/g) || [];
        items.forEach(function(it, i){ map[lo + i] = hexToStr(it); });
      }
      block = block.replace(arr, " ");

      const trip = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
      let t;
      while((t = trip.exec(block))){
        const lo = parseInt(t[1], 16), hi = parseInt(t[2], 16);
        const base = parseInt(t[3], 16);
        const wide = t[3].length > 2;
        if(!isFinite(lo) || !isFinite(hi) || hi < lo || hi - lo > 65535) continue;
        for(let c = lo; c <= hi; c++){
          const v = base + (c - lo);
          map[c] = wide ? String.fromCharCode(v) : String.fromCharCode(v & 0xff);
        }
      }
    }

    const chars = /beginbfchar([\s\S]*?)endbfchar/g;
    while((m = chars.exec(src))){
      const pair = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
      let p;
      while((p = pair.exec(m[1]))) map[parseInt(p[1], 16)] = hexToStr(p[2]);
    }
    return map;
  }

  function readLiteral(s, at){
    let depth = 1, i = at + 1;
    const out = [];
    while(i < s.length){
      const c = s.charAt(i);
      if(c === "\\"){
        const d = s.charAt(i + 1);
        i += 2;
        if(d === "n") out.push(10);
        else if(d === "r") out.push(13);
        else if(d === "t") out.push(9);
        else if(d === "b") out.push(8);
        else if(d === "f") out.push(12);
        else if(d === "\n"){ /* line continuation */ }
        else if(d === "\r"){ if(s.charAt(i) === "\n") i++; }
        else if(d >= "0" && d <= "7"){
          let oct = d;
          while(oct.length < 3 && s.charAt(i) >= "0" && s.charAt(i) <= "7"){ oct += s.charAt(i); i++; }
          out.push(parseInt(oct, 8) & 255);
        }
        else out.push(d.charCodeAt(0) & 255);
        continue;
      }
      if(c === "("){ depth++; out.push(40); i++; continue; }
      if(c === ")"){ depth--; i++; if(!depth) break; out.push(41); continue; }
      out.push(s.charCodeAt(i) & 255);
      i++;
    }
    return { bytes: out, next: i };
  }

  function decodeBytes(bytes, cmap){
    if(cmap){
      /* embedded subsets almost always use two-byte codes; accept that
         reading only when the map actually covers it */
      if(bytes.length >= 2 && bytes.length % 2 === 0){
        let s = "", hits = 0, total = bytes.length / 2;
        for(let i = 0; i < bytes.length; i += 2){
          const code = (bytes[i] << 8) | bytes[i + 1];
          if(cmap[code] !== undefined){ s += cmap[code]; hits++; }
        }
        if(hits >= total - 1 && hits > 0) return s;
      }
      let s1 = "", hits1 = 0;
      for(let i = 0; i < bytes.length; i++){
        if(cmap[bytes[i]] !== undefined){ s1 += cmap[bytes[i]]; hits1++; }
        else s1 += winAnsi(bytes[i]);
      }
      if(hits1 > 0) return s1;
    }
    let out = "";
    for(let i = 0; i < bytes.length; i++) out += winAnsi(bytes[i]);
    return out;
  }

  /* Turn one content stream into text.

     Text runs are collected with the position they were drawn at, then
     reassembled by geometry rather than emitted in the order the operators
     happen to appear. That ordering matters more than it sounds: a PDF table
     draws each cell as its own positioned run, so a reader that emits
     linearly turns one row into three separate lines and the relationship
     between "Northam", "compliant" and the date is destroyed. Grouping runs
     into rows by their y coordinate and sorting by x puts the row back
     together, which is what both retrieval and the model need. */
  function contentText(cs, cmaps){
    const runs = [];
    let stack = [];
    let cmap = null;
    let size = 12;
    let tm = null, tlm = null, leading = 0;
    let last = null;
    const n = cs.length;
    let i = 0;

    const setMatrix = function(m){ tm = m.slice(); tlm = m.slice(); };
    /* tlm = translate(tx, ty) x tlm, then the text matrix restarts from it */
    const nextLine = function(tx, ty){
      if(!tlm) tlm = [1, 0, 0, 1, 0, 0];
      tlm = [tlm[0], tlm[1], tlm[2], tlm[3],
             tx * tlm[0] + ty * tlm[2] + tlm[4],
             tx * tlm[1] + ty * tlm[3] + tlm[5]];
      tm = tlm.slice();
      last = null;
    };

    const emit = function(bytes){
      const text = decodeBytes(bytes, cmap);
      if(!text) return;
      const x = tm ? tm[4] : 0, y = tm ? tm[5] : 0;
      /* Showing a string advances the text matrix by its width, which needs
         font metrics we do not have. So two shows at the same recorded
         position are consecutive text, not overlapping text. */
      if(last && last.y === y && last.x === x){ last.text += text; return; }
      const scale = tm && Math.abs(tm[0]) > 0.01 ? Math.abs(tm[0]) : 1;
      last = { x: x, y: y, text: text, size: size * scale };
      runs.push(last);
    };

    while(i < n){
      const ch = cs.charAt(i);

      if(ch === "%"){ while(i < n && cs.charAt(i) !== "\n" && cs.charAt(i) !== "\r") i++; continue; }
      if(ch === " " || ch === "\n" || ch === "\r" || ch === "\t" || ch === "\f" || ch === "\0"){ i++; continue; }

      if(ch === "("){
        const r = readLiteral(cs, i);
        stack.push({ t: "s", v: r.bytes });
        i = r.next;
        continue;
      }
      if(ch === "<" && cs.charAt(i + 1) === "<"){
        /* inline dictionary: skip it whole */
        let depth = 0, j = i;
        while(j < n){
          if(cs.charAt(j) === "<" && cs.charAt(j + 1) === "<"){ depth++; j += 2; continue; }
          if(cs.charAt(j) === ">" && cs.charAt(j + 1) === ">"){ depth--; j += 2; if(!depth) break; continue; }
          j++;
        }
        i = j;
        continue;
      }
      if(ch === "<"){
        const end = cs.indexOf(">", i);
        const hex = cs.slice(i + 1, end === -1 ? n : end).replace(/[^0-9a-fA-F]/g, "");
        const bytes = [];
        const pad = hex.length % 2 ? hex + "0" : hex;
        for(let k = 0; k < pad.length; k += 2) bytes.push(parseInt(pad.substr(k, 2), 16));
        stack.push({ t: "s", v: bytes });
        i = end === -1 ? n : end + 1;
        continue;
      }
      if(ch === "["){ stack.push({ t: "[" }); i++; continue; }
      if(ch === "]"){
        const items = [];
        while(stack.length && stack[stack.length - 1].t !== "[") items.unshift(stack.pop());
        stack.pop();
        stack.push({ t: "a", v: items });
        i++;
        continue;
      }
      if(ch === "/"){
        let j = i + 1;
        while(j < n && !/[\s/[\]()<>]/.test(cs.charAt(j))) j++;
        stack.push({ t: "n", v: cs.slice(i + 1, j) });
        i = j;
        continue;
      }
      if(ch === "-" || ch === "+" || ch === "." || (ch >= "0" && ch <= "9")){
        let j = i;
        while(j < n && /[-+.\d]/.test(cs.charAt(j))) j++;
        stack.push({ t: "#", v: parseFloat(cs.slice(i, j)) });
        i = j;
        continue;
      }

      let j = i;
      while(j < n && /[A-Za-z*'"0-9]/.test(cs.charAt(j))) j++;
      const op = j > i ? cs.slice(i, j) : cs.charAt(i);
      i = j > i ? j : i + 1;

      const top = stack[stack.length - 1];
      const num = function(back){
        const t = stack[stack.length - back];
        return t && t.t === "#" ? t.v : 0;
      };

      if(op === "Tf"){
        const nameTok = stack[stack.length - 2];
        if(nameTok && nameTok.t === "n") cmap = cmaps[nameTok.v] || null;
        if(top && top.t === "#" && top.v > 0) size = top.v;
      }else if(op === "Tj"){
        if(top && top.t === "s") emit(top.v);
      }else if(op === "'"){
        nextLine(0, -leading);
        if(top && top.t === "s") emit(top.v);
      }else if(op === '"'){
        nextLine(0, -leading);
        if(top && top.t === "s") emit(top.v);
      }else if(op === "TJ"){
        if(top && top.t === "a"){
          let buf = [];
          top.v.forEach(function(item){
            if(item.t === "s") buf = buf.concat(item.v);
            /* wide negative kerning is how a PDF draws a space it never wrote */
            else if(item.t === "#" && item.v < -170) buf.push(32);
          });
          if(buf.length) emit(buf);
        }
      }else if(op === "Td"){
        nextLine(num(2), num(1));
      }else if(op === "TD"){
        leading = -num(1);
        nextLine(num(2), num(1));
      }else if(op === "TL"){
        leading = num(1);
      }else if(op === "T*"){
        nextLine(0, -leading);
      }else if(op === "Tm"){
        if(stack.length >= 6){
          setMatrix([num(6), num(5), num(4), num(3), num(2), num(1)]);
          last = null;
        }
      }else if(op === "BT"){
        setMatrix([1, 0, 0, 1, 0, 0]);
        last = null;
      }
      stack = [];
    }
    return assemble(runs);
  }

  /* Rebuild reading order from geometry: rows top to bottom, cells left to
     right. A gap wider than roughly one character is a space; a gap wider
     than a whole em is a column boundary, which is what keeps a table row
     legible as a row. */
  function assemble(runs){
    if(!runs.length) return "";

    const sorted = runs.slice().sort(function(a, b){ return b.y - a.y; });
    const lines = [];
    let cur = null;
    sorted.forEach(function(r){
      if(!cur || Math.abs(cur.y - r.y) > 2.5){
        cur = { y: r.y, items: [] };
        lines.push(cur);
      }
      cur.items.push(r);
    });

    return lines.map(function(line){
      line.items.sort(function(a, b){ return a.x - b.x; });
      let out = "", prevEnd = null, prevSize = 12;
      line.items.forEach(function(r){
        if(prevEnd !== null){
          const gap = r.x - prevEnd;
          const unit = Math.max(4, prevSize);
          if(gap > unit * 1.1) out += "  |  ";
          else if(gap > unit * 0.16) out += " ";
        }
        out += r.text;
        prevSize = r.size || 12;
        /* no font metrics, so an average advance. Only ever used to decide
           whether the next run is a space away or a column away. */
        prevEnd = r.x + r.text.length * prevSize * 0.5;
      });
      return out.replace(/\s+$/, "");
    }).filter(Boolean).join("\n");
  }

  async function parsePdf(bytes){
    const warnings = [];
    const text = latin1(bytes);

    if(/\/Encrypt\s+\d+\s+\d+\s+R/.test(text)){
      return { text: "", warnings: ["This PDF is password protected or rights-restricted, so its text cannot be read."] };
    }

    /* harvest every indirect object and its stream */
    const objs = [];
    const objRe = /(\d+)\s+\d+\s+obj\b/g;
    let m;
    while((m = objRe.exec(text))){
      const num = +m[1];
      const start = m.index + m[0].length;
      const endObj = text.indexOf("endobj", start);
      const streamAt = text.indexOf("stream", start);
      const hasStream = streamAt !== -1 && (endObj === -1 || streamAt < endObj);
      const dict = text.slice(start, hasStream ? streamAt : (endObj === -1 ? Math.min(start + 4000, text.length) : endObj));

      let data = null;
      if(hasStream){
        let s = streamAt + 6;
        if(text.charCodeAt(s) === 13) s++;
        if(text.charCodeAt(s) === 10) s++;
        let end = -1;
        const lm = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict);
        if(lm){
          const cand = s + (+lm[1]);
          if(cand <= text.length && /^\s*endstream/.test(text.substr(cand, 16))) end = cand;
        }
        if(end === -1){
          end = text.indexOf("endstream", s);
          if(end === -1) end = text.length;
          while(end > s && (text.charCodeAt(end - 1) === 10 || text.charCodeAt(end - 1) === 13)) end--;
        }
        data = bytes.subarray(s, end);
      }
      objs.push({ num: num, dict: dict, data: data });
      if(endObj !== -1) objRe.lastIndex = Math.max(objRe.lastIndex, endObj);
    }

    const byNum = Object.create(null);
    objs.forEach(function(o){ if(byNum[o.num] === undefined) byNum[o.num] = o; });

    const inflate = async function(data){
      /* zlib wrapper first, then raw, then raw past a stray leading byte:
         between them these cover every malformed Flate stream seen in the
         wild without giving up on the file */
      for(const attempt of [["deflate", 0], ["deflate-raw", 0], ["deflate-raw", 1]]){
        try{ return await decompress(data.subarray(attempt[1]), attempt[0]); }catch(err){ /* next */ }
      }
      return null;
    };

    const decodeStream = async function(o){
      if(!o || !o.data || !o.data.length) return null;
      const fm = /\/Filter\s*(\[[^\]]*\]|\/[A-Za-z0-9]+)/.exec(o.dict);
      const chain = (fm ? fm[1].match(/\/([A-Za-z0-9]+)/g) || [] : [])
        .map(function(f){ return f.slice(1); });
      if(!chain.length) return o.data;

      let data = o.data;
      for(const filter of chain){
        if(filter === "FlateDecode"){ data = await inflate(data); }
        else if(filter === "ASCII85Decode"){ data = ascii85(data); }
        else if(filter === "ASCIIHexDecode"){ data = asciiHex(data); }
        else if(filter === "RunLengthDecode"){ data = runLength(data); }
        else return null;      /* DCT, JPX, CCITT, JBIG2: pictures, not text */
        if(!data || !data.length) return null;
      }
      return data;
    };

    /* font resource name -> ToUnicode map, built globally. Per-page
       resource dictionaries would be more precise, but producers reuse the
       same names consistently and the fallback encoding covers the rest. */
    const cmaps = Object.create(null);
    const fontRefs = Object.create(null);
    objs.forEach(function(o){
      let block = null;
      const inlineDict = /\/Font\s*<<([\s\S]*?)>>/.exec(o.dict);
      if(inlineDict) block = inlineDict[1];
      else{
        const ref = /\/Font\s+(\d+)\s+\d+\s+R/.exec(o.dict);
        if(ref && byNum[+ref[1]]) block = byNum[+ref[1]].dict;
      }
      if(!block) return;
      const rr = /\/([A-Za-z0-9_.#+-]+)\s+(\d+)\s+\d+\s+R/g;
      let x;
      while((x = rr.exec(block))) fontRefs[x[1]] = +x[2];
    });

    for(const name of Object.keys(fontRefs)){
      const font = byNum[fontRefs[name]];
      if(!font) continue;
      const tu = /\/ToUnicode\s+(\d+)\s+\d+\s+R/.exec(font.dict);
      if(!tu) continue;
      const raw = await decodeStream(byNum[+tu[1]]);
      if(!raw) continue;
      try{ cmaps[name] = parseCMap(latin1(raw)); }catch(err){ /* unreadable map */ }
    }

    /* every decodable stream that looks like page content */
    /* Every stream that could hold page text. Form XObjects are deliberately
       included: headers, footers and stamped blocks live in them, and
       skipping them loses real content. Font programs and images cannot
       contain text and are skipped so they are not inflated for nothing. */
    let body = "";
    for(const o of objs){
      if(!o.data) continue;
      if(/\/Type\s*\/(ObjStm|XRef|Metadata|Font|FontDescriptor)\b/.test(o.dict)) continue;
      if(/\/Subtype\s*\/(Image|Type1C|TrueType|CIDFontType0C|OpenType)\b/.test(o.dict)) continue;
      const raw = await decodeStream(o);
      if(!raw || !raw.length) continue;
      const cs = latin1(raw);
      if(cs.indexOf("BT") === -1 && cs.indexOf("Tj") === -1 && cs.indexOf("TJ") === -1) continue;
      const piece = contentText(cs, cmaps);
      if(piece.trim()) body += piece + "\n\n";
    }

    const pages = (text.match(/\/Type\s*\/Page[^s]/g) || []).length || 1;
    const clean = tidy(body);

    if(!clean){
      warnings.push("No text layer found. This looks like a scan or an image-only PDF, and SARA reads text rather than pictures of text.");
    }else if(clean.length < pages * 40){
      warnings.push("Very little text was recoverable, so this PDF may be partly scanned.");
    }
    return { text: clean, warnings: warnings, pages: pages };
  }

  /* ================= flat formats ================= */

  /* Split on commas or tabs, honouring RFC 4180 quoting so an address field
     containing a comma does not become two columns. */
  function parseDelimited(src){
    const text = String(src).replace(/\r\n?/g, "\n");
    const head = text.slice(0, 4000);
    const tabs = (head.match(/\t/g) || []).length;
    const commas = (head.match(/,/g) || []).length;
    const semis = (head.match(/;/g) || []).length;
    const delim = tabs > commas ? "\t" : (semis > commas ? ";" : ",");

    const rows = [];
    let row = [], field = "", quoted = false;
    for(let i = 0; i < text.length; i++){
      const c = text.charAt(i);
      if(quoted){
        if(c === '"'){
          if(text.charAt(i + 1) === '"'){ field += '"'; i++; }
          else quoted = false;
        }else field += c;
        continue;
      }
      if(c === '"'){ quoted = true; continue; }
      if(c === delim){ row.push(field); field = ""; continue; }
      if(c === "\n"){ row.push(field); rows.push(row); row = []; field = ""; continue; }
      field += c;
    }
    if(field || row.length){ row.push(field); rows.push(row); }

    const kept = rows.filter(function(r){ return r.some(function(v){ return String(v).trim() !== ""; }); });
    const truncated = kept.length > 800;
    if(truncated) kept.length = 800;
    return {
      text: kept.map(function(r){ return r.map(function(v){ return String(v).trim(); }).join(" | "); }).join("\n"),
      warnings: truncated ? ["Read to the first 800 rows."] : [],
      rows: kept.length,
    };
  }

  function parseHtml(src){
    let s = String(src)
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|li|tr|h[1-6]|section|article|br)\s*>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ");
    return { text: tidy(unent(s)), warnings: [] };
  }

  /* RTF control words carry no text; \'hh escapes do. */
  function parseRtf(src){
    let s = String(src)
      .replace(/\\'([0-9a-fA-F]{2})/g, function(m, h){ return winAnsi(parseInt(h, 16)); })
      .replace(/\\(par|line|page)\b/g, "\n")
      .replace(/\\tab\b/g, "\t")
      .replace(/\{\\\*[\s\S]*?\}/g, " ")
      .replace(/\\[a-zA-Z]+-?\d*\s?/g, "")
      .replace(/[{}]/g, "");
    return { text: tidy(s), warnings: [] };
  }

  /* ================= shared ================= */

  function tidy(s){
    return String(s || "")
      .replace(/\r\n?/g, "\n")
      .replace(/ /g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /* Retrieval chunks on blank lines, so a wall of single-newline text
     indexes as one enormous chunk and cites badly. Group lines into
     paragraph-sized blocks, respecting headings the parsers emit. */
  function paragraphise(text){
    const lines = String(text).split("\n");
    const out = [];
    let buf = [], words = 0;
    const flush = function(){
      if(buf.length){ out.push(buf.join("\n")); buf = []; words = 0; }
    };
    lines.forEach(function(line){
      const t = line.trim();
      if(!t){ flush(); return; }
      if(/^#{1,4}\s/.test(t)){ flush(); out.push(t); return; }
      buf.push(t);
      words += t.split(/\s+/).length;
      if(words >= 110) flush();
    });
    flush();
    return out.join("\n\n");
  }

  function fmtBytes(n){
    if(n >= 1048576) return (n / 1048576).toFixed(1) + " MB";
    if(n >= 1024) return Math.round(n / 1024) + " KB";
    return n + " bytes";
  }

  /* ================= entry point ================= */

  /* Resolves to { ok, kind, text, chars, pages, warnings, error }.
     Never throws: a file that cannot be read is a message to the person who
     dropped it, not an exception in the console. */
  async function parse(file, bytes){
    const name = (file && file.name) || "file";
    const size = bytes ? bytes.length : ((file && file.size) || 0);
    let kind = kindOf(name);

    if(kind === "legacy"){
      return { ok: false, kind: kind, name: name,
               error: "This is the pre-2007 binary Office format. Re-save it as .docx, .xlsx or .pptx and it will read fine." };
    }
    if(size > MAX_BYTES){
      return { ok: false, kind: kind, name: name,
               error: "That file is " + fmtBytes(size) + ". The limit is " + fmtBytes(MAX_BYTES) + " so the browser stays responsive." };
    }

    /* content sniffing catches a renamed or extension-less file */
    if(bytes && bytes.length > 4){
      const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
      if(sig === "%PDF") kind = "pdf";
      else if(bytes[0] === 0x50 && bytes[1] === 0x4b && (kind === "" || kind === "text")) kind = "zip?";
      else if(!kind) kind = "text";
    }
    if(!kind) kind = "text";

    if(kind !== "text" && kind !== "csv" && kind !== "html" && kind !== "rtf" && !hasInflate()){
      return { ok: false, kind: kind, name: name,
               error: "This browser cannot decompress files. Open the file in a current version of Chrome, Edge, Firefox or Safari." };
    }

    let result;
    try{
      if(kind === "pdf"){
        result = await parsePdf(bytes);
      }else if(kind === "docx" || kind === "xlsx" || kind === "pptx" || kind === "zip?"){
        const zip = readZip(bytes);
        if(!zip){
          return { ok: false, kind: kind, name: name,
                   error: "The file is not a readable Office package. It may be corrupt or still downloading." };
        }
        const actual = kind !== "zip?" ? kind
          : zipHas(zip, "word/document.xml") ? "docx"
          : zipHas(zip, "xl/workbook.xml") ? "xlsx"
          : zipList(zip, /^ppt\/slides\//).length ? "pptx" : "";
        if(!actual){
          return { ok: false, kind: "zip", name: name,
                   error: "This is a ZIP archive rather than a document. Attach the files inside it individually." };
        }
        kind = actual;
        result = actual === "docx" ? await parseDocx(zip)
               : actual === "xlsx" ? await parseXlsx(zip)
               : await parsePptx(zip);
      }else if(kind === "csv"){
        result = parseDelimited(utf8(bytes));
      }else if(kind === "html"){
        result = parseHtml(utf8(bytes));
      }else if(kind === "rtf"){
        result = parseRtf(utf8(bytes));
      }else{
        result = { text: tidy(utf8(bytes)), warnings: [] };
      }
    }catch(err){
      return { ok: false, kind: kind, name: name,
               error: "That file could not be read: " + ((err && err.message) || String(err)) };
    }

    let text = paragraphise(result.text || "");
    const warnings = (result.warnings || []).slice();
    if(text.length > MAX_CHARS){
      text = text.slice(0, MAX_CHARS);
      warnings.push("Only the first " + Math.round(MAX_CHARS / 1000) + "k characters were indexed.");
    }
    if(!text){
      return { ok: false, kind: kind, name: name,
               error: warnings[0] || "No readable text was found in that file." };
    }

    return {
      ok: true, kind: kind, name: name,
      text: text,
      chars: text.length,
      words: text.split(/\s+/).filter(Boolean).length,
      pages: result.pages || result.sheets || result.rows || 0,
      size: size,
      warnings: warnings,
    };
  }

  return {
    parse: parse,
    kindOf: kindOf, label: label, supported: supported, extOf: extOf,
    fmtBytes: fmtBytes, hasInflate: hasInflate,
    /* exposed for the tests, which check the parsers directly */
    _internals: {
      readZip: readZip, zipRead: zipRead, scanXml: scanXml, unent: unent,
      runsToText: runsToText, sheetRows: sheetRows, sharedStrings: sharedStrings,
      parseDelimited: parseDelimited, parseRtf: parseRtf, parseHtml: parseHtml,
      parseCMap: parseCMap, contentText: contentText, paragraphise: paragraphise,
      decodeBytes: decodeBytes, colIndex: colIndex, tidy: tidy,
      ascii85: ascii85, asciiHex: asciiHex, runLength: runLength,
      numberFormats: numberFormats, styleKind: styleKind, formatCell: formatCell,
      excelDate: excelDate,
    },
  };
})();


/* ------------------------------------------------------------------
   Attachments.

   A parsed file becomes a document in the live index, scoped to the
   conversation it was attached to. It is never written to the persistent
   store that holds chat history: extracted text is large and would evict
   real conversations from localStorage. It lives in sessionStorage
   instead, which survives the reload that used to lose a demo and is gone
   when the tab closes.
   ------------------------------------------------------------------ */

const Attachments = (function(){

  const KEY = "attachments";
  const SESSION_BUDGET = 3 * 1024 * 1024;   /* keep well inside the 5 MB quota */
  /* where a file waits between being dropped and the conversation existing */
  const PENDING = "__new__";

  let items = [];          /* newest first */
  let seq = 0;

  /* ---------------- session-scoped persistence ---------------- */
  function session(){
    try{
      if(typeof sessionStorage === "undefined" || !sessionStorage) return null;
      return sessionStorage;
    }catch(err){ return null; }
  }
  function storeKey(){ return "sara_" + Config.slug + "_" + KEY; }

  function persist(){
    const ss = session();
    if(!ss) return;
    /* newest first, dropping the tail if the budget is exceeded */
    const out = [];
    let total = 0;
    for(const a of items){
      const size = a.text.length + 400;
      if(total + size > SESSION_BUDGET) break;
      total += size;
      out.push(a);
    }
    try{ ss.setItem(storeKey(), JSON.stringify(out)); }
    catch(err){ try{ ss.removeItem(storeKey()); }catch(e){} }
  }

  function restore(){
    const ss = session();
    if(!ss) return;
    try{
      const raw = ss.getItem(storeKey());
      if(!raw) return;
      const parsed = JSON.parse(raw);
      if(!Array.isArray(parsed)) return;
      items = parsed.filter(function(a){ return a && a.id && a.text; });
      items.forEach(function(a){
        const n = parseInt(String(a.id).replace(/\D+/g, ""), 10);
        if(isFinite(n) && n > seq) seq = n;
      });
    }catch(err){ items = []; }
  }

  /* ---------------- queries ---------------- */
  function all(){ return items.slice(); }
  function forConvo(convoId){
    return items.filter(function(a){ return !convoId || a.convoId === convoId; });
  }
  function current(){
    const c = Chat.conversation();
    return forConvo(c ? c.id : PENDING);
  }
  function find(id){ return items.find(function(a){ return a.id === id; }) || null; }
  function count(){ return items.length; }

  /* Attachments are documents in the retrieval index, shaped exactly like
     corpus documents so nothing downstream needs to know the difference. */
  function asDocs(convoId){
    return forConvo(convoId).filter(function(a){ return a.state === "ready" && a.text; }).map(function(a){
      return {
        id: a.id,
        convoId: a.convoId,
        title: a.name,
        cat: "attachment",
        owner: a.owner,
        updated: a.date,
        rev: "",
        system: "Attached by you",
        clearance: 1,
        scopes: [],
        tags: [FileParse.label(a.kind), "attachment", "uploaded"],
        body: a.text,
        attachment: true,
      };
    });
  }

  /* ---------------- adding ---------------- */
  function readBytes(file){
    return new Promise(function(resolve, reject){
      if(file.arrayBuffer){
        file.arrayBuffer().then(function(buf){ resolve(new Uint8Array(buf)); }, reject);
        return;
      }
      const r = new FileReader();
      r.onload = function(){ resolve(new Uint8Array(r.result)); };
      r.onerror = function(){ reject(new Error("The file could not be read from disk.")); };
      r.readAsArrayBuffer(file);
    });
  }

  async function add(file){
    const convo = Chat.conversation();
    const convoId = convo ? convo.id : PENDING;
    const id = "ATT-" + (++seq);

    const pending = {
      id: id, convoId: convoId, name: file.name || "file",
      kind: FileParse.kindOf(file.name) || "text",
      size: file.size || 0, state: "reading", text: "",
      owner: (S.user && S.user.name) || "You",
      date: new Date().toISOString().slice(0, 10),
      ts: Date.now(), warnings: [],
    };
    items.unshift(pending);
    render();

    let bytes;
    try{
      bytes = await readBytes(file);
    }catch(err){
      pending.state = "error";
      pending.error = (err && err.message) || "The file could not be read.";
      render();
      return pending;
    }

    pending.state = "parsing";
    render();

    const parsed = await FileParse.parse(file, bytes);
    if(!parsed.ok){
      pending.state = "error";
      pending.error = parsed.error;
      pending.kind = parsed.kind || pending.kind;
      render();
      toast(pending.name + ": " + pending.error, "warn", 6000);
      return pending;
    }

    pending.state = "ready";
    pending.kind = parsed.kind;
    pending.text = parsed.text;
    pending.chars = parsed.chars;
    pending.words = parsed.words;
    pending.pages = parsed.pages;
    pending.warnings = parsed.warnings || [];

    Retrieval.build();
    persist();
    render();
    if(pending.warnings.length) toast(pending.name + ": " + pending.warnings[0], "info", 5200);
    return pending;
  }

  async function addFiles(fileList){
    const list = Array.prototype.slice.call(fileList || []);
    if(!list.length) return;
    for(const f of list) await add(f);
    const ready = list.length === 1 ? "1 file" : list.length + " files";
    const ok = items.filter(function(a){ return a.state === "ready"; }).length;
    if(ok) toast(ready + " attached. Ask a question about it and SARA reads it alongside the knowledge base.", "ok", 5000);
  }

  /* A file is almost always dropped before the first message is typed, so it
     is attached while there is no conversation yet and parked under
     PENDING. The moment the conversation exists it has to be re-tagged, or
     retrieval filters the file out of the very answer it was attached for. */
  function claim(convoId){
    if(!convoId || convoId === PENDING) return 0;
    let moved = 0;
    items.forEach(function(a){
      if(a.convoId === PENDING){ a.convoId = convoId; moved++; }
    });
    if(moved){ Retrieval.build(); persist(); }
    return moved;
  }

  function remove(id){
    const at = items.findIndex(function(a){ return a.id === id; });
    if(at === -1) return;
    const name = items[at].name;
    items.splice(at, 1);
    Retrieval.build();
    persist();
    render();
    if(typeof Library !== "undefined") Library.renderFiles();
    toast("“" + name + "” removed", "info");
  }

  function clearAll(){
    if(!items.length) return;
    items = [];
    Retrieval.build();
    persist();
    render();
    if(typeof Library !== "undefined") Library.renderFiles();
  }

  /* ---------------- composer chips ---------------- */
  function chip(a){
    const cls = "att att-" + a.state;
    const meta = a.state === "ready"
      ? FileParse.label(a.kind) + (a.pages ? " · " + a.pages + (a.kind === "xlsx" ? " sheets" : a.kind === "csv" ? " rows" : " pages") : "") +
        " · " + (a.words || 0).toLocaleString() + " words"
      : a.state === "error" ? a.error
      : a.state === "parsing" ? "Reading the text…" : "Loading…";

    return '<div class="' + cls + '" title="' + escAttr(a.name + " — " + meta) + '">' +
      '<span class="att-ic">' + Icons.el(a.state === "error" ? "alert" : a.state === "ready" ? "file" : "refresh") + "</span>" +
      '<span class="att-mn"><span class="att-nm">' + esc(a.name) + "</span>" +
      '<span class="att-ss">' + esc(meta) + "</span></span>" +
      '<button class="att-x" onclick="Attachments.remove(\'' + escJs(a.id) + '\')" aria-label="Remove ' + escAttr(a.name) + '">' +
        Icons.el("close") + "</button>" +
    "</div>";
  }

  function render(){
    const wrap = el("attachBar");
    if(!wrap) return;
    const list = current();
    wrap.innerHTML = list.length
      ? list.map(chip).join("") +
        (list.length > 1 ? '<button class="att-clear" onclick="Attachments.clearAll()">Clear all</button>' : "")
      : "";
    wrap.classList.toggle("on", list.length > 0);
    Icons.hydrate(wrap);
    if(typeof Library !== "undefined" && S.view === "files") Library.renderFiles();
  }

  /* ---------------- picking and dropping ---------------- */
  function pick(){
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = FileParse.supported().map(function(e){ return "." + e; }).join(",");
    input.style.display = "none";
    input.addEventListener("change", function(){
      addFiles(input.files);
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  }

  /* Drop anywhere over the conversation. The counter guards against the
     dragleave that fires when the pointer crosses a child element. */
  function initDrop(){
    const zone = el("main") || document.body;
    const veil = el("dropVeil");
    let depth = 0;

    const show = function(on){
      depth = on ? depth : 0;
      if(veil) veil.classList.toggle("on", on);
    };

    window.addEventListener("dragenter", function(e){
      if(!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") === -1) return;
      e.preventDefault();
      depth++;
      show(true);
    });
    window.addEventListener("dragover", function(e){
      if(!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") === -1) return;
      e.preventDefault();
      try{ e.dataTransfer.dropEffect = "copy"; }catch(err){}
    });
    window.addEventListener("dragleave", function(){
      depth = Math.max(0, depth - 1);
      if(!depth) show(false);
    });
    window.addEventListener("drop", function(e){
      if(!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
      e.preventDefault();
      show(false);
      if(!S.user) return;
      addFiles(e.dataTransfer.files);
    });
    if(zone && zone.addEventListener){ /* zone kept for clarity of intent */ }
  }

  /* Paste a file straight from the clipboard, which is how a screenshot or
     a copied document usually arrives. */
  function initPaste(){
    window.addEventListener("paste", function(e){
      if(!e.clipboardData || !e.clipboardData.files || !e.clipboardData.files.length) return;
      const files = Array.prototype.filter.call(e.clipboardData.files, function(f){
        return FileParse.kindOf(f.name) && FileParse.kindOf(f.name) !== "legacy";
      });
      if(!files.length) return;
      e.preventDefault();
      addFiles(files);
    });
  }

  function init(){
    restore();
    render();
    initDrop();
    initPaste();
  }

  return {
    init: init, add: add, addFiles: addFiles, remove: remove, clearAll: clearAll, claim: claim,
    pick: pick, render: render,
    all: all, current: current, forConvo: forConvo, find: find, count: count,
    asDocs: asDocs,
  };
})();
