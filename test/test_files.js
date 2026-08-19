/* File search: the parsers, and the path from a dropped file to a citation.

   Two layers of fixture, on purpose.

   The built-in ones are assembled here in JavaScript, using the same
   platform primitives the parser reads with, so this suite runs anywhere
   with nothing installed. The ones under test/fixtures/ are written by the
   libraries real people use — openpyxl, python-pptx, ReportLab — and catch
   what our own idea of a producer never would. Generate them with
   `python test/make_fixtures.py`; the suite says which it found.

   Run:  node test/test_files.js [edition]
*/
const H = require("./harness");
const fs = require("fs");
const path = require("path");

const edition = process.argv[2] || "nbfc";
H.loadEdition(edition);
H.loadSrc();

console.log(`\n  SARA file-search tests — edition "${edition}"`);

const MARKER = "ZEBRAFISH";
const SENTENCE = "Cross-check R&D spend < 5% against the compliance register.";

/* ================= fixture building ================= */

const enc = (s) => new TextEncoder().encode(s);

async function deflateRaw(bytes){
  const src = new ReadableStream({ start(c){ c.enqueue(bytes); c.close(); } });
  const out = src.pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(out).arrayBuffer());
}
async function deflateZlib(bytes){
  const src = new ReadableStream({ start(c){ c.enqueue(bytes); c.close(); } });
  const out = src.pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/* A real ZIP, written the way Office writes one: deflated members, sizes
   carried in the central directory. CRCs are left at zero because the
   reader never verifies them, and pretending otherwise would test a
   checksum implementation rather than the reader. */
async function makeZip(files){
  const parts = [], central = [];
  let offset = 0;

  for(const [name, text] of Object.entries(files)){
    const raw = enc(text);
    const packed = await deflateRaw(raw);
    const nameBytes = enc(name);

    const local = new Uint8Array(30 + nameBytes.length + packed.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); lv.setUint16(6, 0, true); lv.setUint16(8, 8, true);
    lv.setUint32(18, packed.length, true);
    lv.setUint32(22, raw.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(packed, 30 + nameBytes.length);
    parts.push(local);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(10, 8, true);
    cv.setUint32(20, packed.length, true);
    cv.setUint32(24, raw.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    cd.set(nameBytes, 46);
    central.push(cd);

    offset += local.length;
  }

  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, central.length, true);
  ev.setUint16(10, central.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);

  const all = parts.concat(central, [eocd]);
  const total = all.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for(const p of all){ out.set(p, at); at += p.length; }
  return out;
}

const DOCX_XML =
  '<?xml version="1.0"?><w:document xmlns:w="http://x"><w:body>' +
  `<w:p><w:r><w:t>${MARKER} report</w:t></w:r></w:p>` +
  '<w:p><w:r><w:t xml:space="preserve">R&amp;D spend &lt; 5% is compliant.</w:t></w:r></w:p>' +
  '<w:p><w:r><w:t>Left</w:t><w:tab/><w:t>right</w:t><w:br/><w:t>next line</w:t></w:r></w:p>' +
  "<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Site</w:t></w:r></w:p></w:tc>" +
  "<w:tc><w:p><w:r><w:t>Status</w:t></w:r></w:p></w:tc></w:tr>" +
  "<w:tr><w:tc><w:p><w:r><w:t>Northam</w:t></w:r></w:p></w:tc>" +
  "<w:tc><w:p><w:r><w:t>at risk</w:t></w:r></w:p></w:tc></w:tr></w:tbl>" +
  "</w:body></w:document>";

/* A PDF with one uncompressed and one Flate-compressed content stream, so
   both decode paths are covered without any fixture on disk. */
async function makePdf(){
  const content = `BT /F1 12 Tf 72 720 Td (${MARKER} inline pdf) Tj T* (Second line here) Tj ET`;
  const packed = await deflateZlib(enc(content));

  const head = "%PDF-1.4\n";
  const chunks = [head];
  let body = "";
  body += "1 0 obj\n<< /Type /Page /Contents 2 0 R >>\nendobj\n";
  body += `2 0 obj\n<< /Length ${packed.length} /Filter /FlateDecode >>\nstream\n`;

  const prefix = enc(head.slice(head.length) + body);
  const suffix = enc("\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n");
  const headBytes = enc(head + body);
  const out = new Uint8Array(headBytes.length + packed.length + suffix.length);
  out.set(headBytes, 0);
  out.set(packed, headBytes.length);
  out.set(suffix, headBytes.length + packed.length);
  void chunks; void prefix;
  return out;
}

/* ================= the suite ================= */

async function main(){

  /* ---------- XML scanner ---------- */
  H.section("XML scanner");
  {
    const seen = [];
    FileParse._internals.scanXml('<a x="1"><b/>text<!-- skip --><c>x</c></a>',
      (kind, name, attrs, text) => seen.push([kind, name || text]));
    H.eq(seen[0], ["open", "a"], "open tag with attributes");
    H.eq(seen[1], ["self", "b"], "self-closing tag");
    H.eq(seen[2], ["text", "text"], "text between tags");
    H.eq(seen.filter(s => s[1] === " skip ").length, 0, "comments are skipped entirely");

    const cdata = [];
    FileParse._internals.scanXml("<a><![CDATA[<not a tag>]]></a>",
      (kind, name, attrs, text) => { if(kind === "text") cdata.push(text); });
    H.eq(cdata, ["<not a tag>"], "CDATA is text, not markup");

    const u = FileParse._internals.unent;
    H.eq(u("a &amp; b &lt; c &#65; &#x42;"), "a & b < c A B", "entities decode, named and numeric");
    H.eq(u("plain text"), "plain text", "text with no entities is untouched");
  }

  /* ---------- ZIP + DOCX ---------- */
  H.section("ZIP reader and DOCX");
  {
    const zip = await makeZip({ "word/document.xml": DOCX_XML, "other.txt": "ignored" });
    const parsed = FileParse._internals.readZip(zip);
    H.ok(!!parsed, "central directory located");
    H.eq(parsed.entries.length, 2, "both members enumerated");
    H.eq(await FileParse._internals.zipRead(parsed, "other.txt"), "ignored", "a member inflates back to its source");

    const r = await FileParse.parse({ name: "report.docx", size: zip.length }, zip);
    H.ok(r.ok, "docx parses" + (r.ok ? "" : ": " + r.error));
    H.has(r.text, MARKER, "body text recovered");
    H.has(r.text, "R&D spend < 5%", "escaped entities decoded, not left as &amp;");
    H.has(r.text, "Left\tright", "a tab run becomes a tab");
    H.has(r.text, "Site | Status", "table row cells are separated");
    H.has(r.text, "Northam | at risk", "second table row survives");
    H.lacks(r.text, "<w:", "no markup leaks into the extract");
    H.eq(r.kind, "docx", "kind reported");
  }

  /* ---------- PDF ---------- */
  H.section("PDF");
  {
    const pdf = await makePdf();
    const r = await FileParse.parse({ name: "note.pdf", size: pdf.length }, pdf);
    H.ok(r.ok, "flate-compressed content stream decodes" + (r.ok ? "" : ": " + r.error));
    H.has(r.text, MARKER, "text operators yield their strings");
    H.has(r.text, "Second line here", "a second Tj after T* is kept");

    /* the filter chain that broke this the first time */
    /* vector produced by Python's base64.a85encode, so this checks the
       decoder against a reference implementation rather than against itself */
    const a85 = FileParse._internals.ascii85;
    H.eq(new TextDecoder().decode(a85(enc("87cURD_*#4DfTZ)+T~>"))), "Hello, World!",
         "ASCII85 decodes, which is half of ReportLab's filter chain");
    H.eq(new TextDecoder().decode(a85(enc("<~87cURD]i,\"Ebo80~>"))), "Hello World!",
         "and tolerates the <~ prefix");
    H.eq(FileParse._internals.runLength(new Uint8Array([2, 65, 66, 67, 254, 90, 128])).length, 6,
         "RunLength decodes a literal run and a repeat run");
    H.eq(new TextDecoder().decode(FileParse._internals.asciiHex(enc("48656c6c6f>"))), "Hello",
         "ASCIIHex decodes");

    const cmap = FileParse._internals.parseCMap(
      "begincmap 1 beginbfchar <0041> <0061> endbfchar " +
      "2 beginbfrange <0050> <0052> <0070> <0060> <0060> [<0041> <0042>] endbfrange endcmap");
    H.eq(cmap[0x41], "a", "bfchar maps a single code");
    H.eq(cmap[0x50], "p", "bfrange maps the start of a range");
    H.eq(cmap[0x52], "r", "bfrange maps the end of a range");
    H.eq(cmap[0x60], "A", "the array form of bfrange maps its first entry");
    H.eq(cmap[0x61], "B", "the array form maps its second entry");

    H.eq(FileParse._internals.decodeBytes([0x93, 0x94], null), "“”",
         "WinAnsi high range maps to curly quotes, not to control characters");

    const encrypted = enc("%PDF-1.4\ntrailer << /Encrypt 9 0 R >>");
    const e = await FileParse.parse({ name: "locked.pdf", size: encrypted.length }, encrypted);
    H.eq(e.ok, false, "an encrypted PDF is refused");
    H.has(e.error, "password protected", "and says why in words a person can act on");
  }

  /* ---------- spreadsheets and flat files ---------- */
  H.section("Delimited and flat formats");
  {
    const csv = 'Site,Status,Note\nNortham,compliant,"Reviewed, signed"\nX,at risk,"a ""quoted"" word"\n';
    const r = await FileParse.parse({ name: "d.csv", size: csv.length }, enc(csv));
    H.ok(r.ok, "csv parses");
    H.has(r.text, "Northam | compliant | Reviewed, signed", "a comma inside quotes stays in its field");
    H.has(r.text, 'a "quoted" word', "doubled quotes collapse to one");

    const tsv = FileParse._internals.parseDelimited("a\tb\tc\n1\t2\t3\n");
    H.has(tsv.text, "a | b | c", "tabs are detected as the delimiter");

    const semi = FileParse._internals.parseDelimited("a;b;c\n1;2;3\n");
    H.has(semi.text, "a | b | c", "semicolons are detected, as European Excel writes them");

    const html = FileParse._internals.parseHtml(
      "<html><head><style>p{color:red}</style></head><body><p>First</p><p>Second &amp; last</p>" +
      "<script>alert(1)</script></body></html>");
    H.has(html.text, "First", "html text extracted");
    H.has(html.text, "Second & last", "entities decoded in html");
    H.lacks(html.text, "alert", "script contents are dropped");
    H.lacks(html.text, "color:red", "style contents are dropped");

    const rtf = FileParse._internals.parseRtf("{\\rtf1\\ansi Hello \\'93quoted\\'94 world\\par done}");
    H.has(rtf.text, "Hello", "rtf text extracted");
    H.has(rtf.text, "“quoted”", "rtf hex escapes decode through WinAnsi");
  }

  /* ---------- refusals ---------- */
  H.section("Files it must refuse, with a reason");
  {
    const legacy = await FileParse.parse({ name: "old.doc", size: 10 }, enc("junk"));
    H.eq(legacy.ok, false, "pre-2007 .doc is refused");
    H.has(legacy.error, "Re-save it as", "and says what to do instead");

    const big = await FileParse.parse({ name: "huge.pdf", size: 99 * 1024 * 1024 }, null);
    H.eq(big.ok, false, "an oversized file is refused before it is read");
    H.has(big.error, "limit is", "and states the limit");

    const empty = await FileParse.parse({ name: "empty.txt", size: 0 }, enc("   \n\n  "));
    H.eq(empty.ok, false, "a file with no readable text is refused");

    const notZip = await FileParse.parse({ name: "broken.docx", size: 4 }, enc("junk"));
    H.eq(notZip.ok, false, "a corrupt Office package is refused");
    H.has(notZip.error, "not a readable Office package", "with a plain-language reason");
  }

  /* ---------- chunking ---------- */
  H.section("Extracts are chunked for retrieval");
  {
    /* Retrieval splits on blank lines. A wall of single-newline text would
       index as one enormous chunk and cite uselessly. */
    const wall = Array.from({ length: 60 }, (_, i) => "Line " + i + " of running text here.").join("\n");
    const out = FileParse._internals.paragraphise(wall);
    H.ok(out.split(/\n\s*\n/).length > 3, "long text is broken into retrievable paragraphs");

    const headed = FileParse._internals.paragraphise("## Sheet A\nrow one\nrow two\n## Sheet B\nrow three");
    H.has(headed, "## Sheet A\n\n", "a heading always starts its own block");
  }

  /* ---------- attachments end to end ---------- */
  H.section("From a dropped file to a citation");
  {
    S.user = Config.users[0];
    S.role = Config.roleByKey[S.user.roleKey];
    S.currentId = null;

    const zip = await makeZip({ "word/document.xml": DOCX_XML });
    Retrieval.build();                 /* baseline is the corpus on its own */
    const before = Retrieval.size;
    H.ok(before > 0, "the corpus is indexed before anything is attached");
    const rec = await Attachments.add({ name: "supplier.docx", size: zip.length,
                                        arrayBuffer: () => Promise.resolve(zip.buffer) });

    H.eq(rec.state, "ready", "the file reached the ready state" + (rec.error ? ": " + rec.error : ""));
    H.ok(Retrieval.size > before, "its passages entered the live index");
    H.eq(Attachments.count(), 1, "it is listed as attached");

    const convoId = Chat.conversation() ? Chat.conversation().id : "__new__";
    const hit = Retrieval.search(MARKER + " report", { role: currentRole(), topK: 5, convoId: convoId });
    H.ok(hit.sources.some(s => s.id === rec.id), "a question about it retrieves it");
    H.eq(hit.stats.attached >= 1, true, "the trace counts it as an attached source");
    const src = hit.sources.find(s => s.id === rec.id);
    H.eq(src.attachment, true, "the source is flagged as an attachment, not company material");
    H.eq(src.system, "Attached by you", "and labelled so in the panel");

    /* the citation must render safely, which is where the last renderer bug lived */
    const html = MD.render("Per your document [S" + src.n + "].", { sources: hit.sources, msgId: "m1" });
    H.has(html, 'class="cite"', "it cites like any other source");
    H.eq((html.match(/<[^>]*>/g) || []).filter(t => (t.match(/"/g) || []).length % 2).length, 0,
         "the citation markup is well formed");

    /* another conversation must not see it */
    const other = Retrieval.search(MARKER + " report", { role: currentRole(), topK: 5, convoId: "c_somewhere_else" });
    H.eq(other.sources.some(s => s.id === rec.id), false, "a different conversation cannot retrieve it");

    /* clearance governs company documents, not the person's own file */
    const junior = Config.roles.reduce((a, b) => (a.clearance <= b.clearance ? a : b));
    H.eq(Retrieval.visibleTo(Attachments.asDocs()[0], junior), true,
         "the most junior role can still read a file they attached themselves");

    /* reserved slots: a large corpus must not crowd out the dropped file */
    const generic = Retrieval.search("compliant status review site", { role: currentRole(), topK: 3, convoId: convoId });
    H.ok(generic.sources.length <= 3, "topK is still respected");

    /* The flow that actually happens: open a new chat, drop a file, then
       type. The file is attached while no conversation exists, and unless it
       is handed over when one is created, retrieval filters it out of the
       very answer it was attached for. */
    Attachments.clearAll();
    S.currentId = null;
    const dropped = await Attachments.add({ name: "dropped.docx", size: zip.length,
                                            arrayBuffer: () => Promise.resolve(zip.buffer) });
    H.eq(dropped.convoId, "__new__", "a file dropped before the first message waits unassigned");

    const born = Chat.conversation() || (function(){
      /* mirrors what send() does on the first turn */
      S.convos.unshift({ id: "c_born", title: "t", ts: Date.now(), updated: Date.now(), messages: [] });
      S.currentId = "c_born";
      Attachments.claim("c_born");
      return { id: "c_born" };
    })();
    H.eq(Attachments.find(dropped.id).convoId, born.id, "creating the conversation claims it");
    H.eq(Retrieval.search(MARKER, { role: currentRole(), topK: 5, convoId: born.id })
           .sources.some(s => s.id === dropped.id), true,
         "so the first answer in that chat can actually retrieve it");
    Attachments.remove(dropped.id);
    S.currentId = null;

    const rec2 = await Attachments.add({ name: "supplier.docx", size: zip.length,
                                         arrayBuffer: () => Promise.resolve(zip.buffer) });
    Attachments.remove(rec2.id);
    Attachments.remove(rec.id);
    H.eq(Attachments.count(), 0, "removing it takes it out of the list");
    H.eq(Retrieval.size, before, "and out of the index");
    H.eq(Retrieval.search(MARKER, { role: currentRole(), topK: 5, convoId: convoId })
           .sources.some(s => s.id === rec.id), false, "so it can no longer be retrieved");
  }

  /* ---------- the prompt ---------- */
  H.section("What the model is told about an attached file");
  {
    const sources = [{ n: 1, id: "ATT-9", title: "supplier.docx", attachment: true,
                       owner: "Ellie", updated: "2026-07-29", system: "Attached by you",
                       text: "Supplier says 14 days.", parts: 1, part: 1 }];
    const sys = LLM.systemPrompt({
      role: Config.roles[0], user: Config.users[0], sources: sources, blocked: [],
      attached: [{ title: "supplier.docx", label: "Word document", pages: 3 }],
      style: "balanced", images: false,
    });
    H.has(sys, "ATTACHED BY THIS PERSON", "the source block marks it as not a company document");
    H.has(sys, "Files this person attached", "the prompt names the attached files");
    H.has(sys, "does not override a company procedure",
         "and states that an attached file carries no authority over company rules");
  }

  /* ---------- real producer output ---------- */
  H.section("Files written by real producers");
  {
    const dir = path.join(H.ROOT, "test", "fixtures");
    if(!fs.existsSync(dir)){
      console.log("    (skipped — run `python test/make_fixtures.py` to generate them)");
    }else{
      const read = (n) => new Uint8Array(fs.readFileSync(path.join(dir, n)));
      const have = (n) => fs.existsSync(path.join(dir, n));

      if(have("sample.docx")){
        const r = await FileParse.parse({ name: "sample.docx" }, read("sample.docx"));
        H.ok(r.ok, "real docx parses");
        H.has(r.text, MARKER, "docx body text");
        H.has(r.text, "Northam | compliant", "docx table");
      }
      if(have("sample.xlsx")){
        const r = await FileParse.parse({ name: "sample.xlsx" }, read("sample.xlsx"));
        H.ok(r.ok, "openpyxl workbook parses");
        H.has(r.text, "## Sites", "the first sheet is named from workbook.xml");
        H.has(r.text, "## Notes", "the second sheet is reached through the relationship table");
        H.has(r.text, "Second sheet reached", "and its content is read");
        H.has(r.text, MARKER, "a cell past a gap keeps its column");
        H.has(r.text, "1234.5", "a numeric cell keeps its value");
        H.lacks(r.text, "B6*2", "a formula is never read as data");

        /* Excel holds a date as a bare number plus a format. Reading only the
           value reports 46092 where the sheet shows 11/03/2026, which on an
           invoice or a schedule is not a cosmetic difference. */
        H.has(r.text, "## Typed", "the typed sheet is reached");
        H.has(r.text, "2026-03-11", "a built-in date format is rendered as a date");
        H.lacks(r.text, "46092", "and never as the raw serial number");
        H.has(r.text, "2026-12-01 14:30", "a date-time keeps its time");
        H.has(r.text, "7.5%", "a percentage is rendered as a percentage");
        H.lacks(r.text, "0.075", "and never as the raw fraction");
        H.has(r.text, "2026-05-02", "a custom dd/mm/yyyy format is recognised as a date");
        H.eq(/\d{5}\.\d{6,}/.test(r.text), false, "no binary-float noise reaches the extract");
      }
      /* the conversion itself, checked against known serials */
      H.eq(FileParse._internals.formatCell("46092", "date", false), "2026-03-11", "serial 46092 is 11 March 2026");
      H.eq(FileParse._internals.formatCell("0.075", "percent", false), "7.5%", "0.075 renders as 7.5%");
      H.eq(FileParse._internals.formatCell("1234.5", "", false), "1234.5", "a plain number is left alone");
      H.eq(FileParse._internals.formatCell("Northam", "", false), "Northam", "text is left alone");
      H.eq(FileParse._internals.formatCell("46092", "date", true), "2030-03-12",
           "the 1904 date system shifts by four years and a day");
      if(have("sample.pptx")){
        const r = await FileParse.parse({ name: "sample.pptx" }, read("sample.pptx"));
        H.ok(r.ok, "python-pptx deck parses");
        H.has(r.text, "## Slide 1", "slides are numbered");
        H.has(r.text, MARKER, "slide text");
        /* the bug this test exists for: notes belong to the slide that owns
           them, not to the slide with the matching part number */
        const two = r.text.slice(r.text.indexOf("## Slide 2"));
        H.has(two, "Speaker note on slide two", "a note is attributed to the slide that owns it");
        H.lacks(r.text.slice(0, r.text.indexOf("## Slide 2")), "Speaker note",
                "and not to the slide whose number happens to match the part");
      }
      if(have("simple.pdf")){
        const r = await FileParse.parse({ name: "simple.pdf" }, read("simple.pdf"));
        H.ok(r.ok, "ReportLab PDF parses through the ASCII85 + Flate chain");
        H.has(r.text, MARKER, "PDF heading text");
        H.has(r.text, SENTENCE, "PDF body text, exactly");
        H.has(r.text, "Page two content follows", "the second page is read");
        H.eq(r.pages, 2, "page count is right");
      }
      if(have("embedded.pdf")){
        const r = await FileParse.parse({ name: "embedded.pdf" }, read("embedded.pdf"));
        H.ok(r.ok, "PDF with an embedded TrueType subset parses");
        H.has(r.text, MARKER, "text mapped through the ToUnicode CMap");
        H.has(r.text, SENTENCE, "and reads exactly, not as mojibake");
        H.has(r.text, "“quoted”", "curly quotes survive the CMap");
        H.has(r.text, "–", "so does an en dash");
      }
      if(have("layout.pdf")){
        const r = await FileParse.parse({ name: "layout.pdf" }, read("layout.pdf"));
        H.ok(r.ok, "a PDF with columns and a table parses");
        /* The regression this exists for: a PDF draws each table cell as its
           own positioned run, so emitting operators in order turns one row
           into three lines and destroys the relationship between the cells. */
        H.has(r.text, "Northam", "table content is read");
        const row = r.text.split("\n").find(l => l.indexOf("Northam") !== -1);
        H.has(row, "compliant", "a table row is reassembled as one line");
        H.has(row, "2026-03-11", "with every cell of that row, in order");
        H.eq(/Site.*Status.*Reviewed/.test(r.text.split("\n").find(l => l.indexOf("Site") !== -1) || ""),
             true, "the header row is reassembled too");
        const left = r.text.split("\n").find(l => l.indexOf("LEFT COLUMN line one") !== -1);
        H.has(left, "RIGHT COLUMN line one", "side-by-side text is kept on the line it was drawn on");
        H.lacks(r.text, "LEFT COLUMN line one\nRIGHT COLUMN line two",
                "and rows are not interleaved out of order");
      }
      if(have("scanned.pdf")){
        const r = await FileParse.parse({ name: "scanned.pdf" }, read("scanned.pdf"));
        H.eq(r.ok, false, "an image-only PDF is not silently reported as empty");
        H.has(r.error, "scan", "it says the file looks like a scan");
      }
      if(have("sample.csv")){
        const r = await FileParse.parse({ name: "sample.csv" }, read("sample.csv"));
        H.ok(r.ok, "csv fixture parses");
        H.has(r.text, "Reviewed, signed and " + MARKER, "quoted field with a comma survives");
      }
    }
  }

  H.report(`SARA file search (${edition})`);
}

main().catch((err) => {
  console.error("\n  SUITE CRASHED:", err && err.stack || err);
  process.exit(1);
});
