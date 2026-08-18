/* ------------------------------------------------------------------
   Markdown renderer.

   Deliberately hand-written rather than permissive: the model never gets
   to emit raw HTML. Source is escaped first, then a fixed set of markdown
   constructs is re-introduced. Also tolerant of half-finished input, since
   it re-renders on every streaming chunk.

   Placeholder sentinels use a raw "<". esc() turns every "<" in the source
   into "&lt;" before sentinels are inserted, so model output can never
   forge one.

   Extras beyond CommonMark:
     [S1] / [S1,S3]      inline citation chips
     > [!WARNING] ...    GitHub-style callouts
   ------------------------------------------------------------------ */

const MD = (function(){

  /* ---------- inline ---------- */
  function inline(src, ctx){
    let s = esc(src);

    /* code spans first, so their contents are never re-processed */
    const codes = [];
    s = s.replace(/`([^`\n]+)`/g, function(m, c){
      codes.push(c);
      return "<c" + (codes.length - 1) + ">";
    });

    /* links: [label](url) — only http(s) and mailto survive */
    s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
      function(m, label, url){
        return '<a href="' + escAttr(url) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
      });

    /* citations: [S2] or [S1, S3] */
    s = s.replace(/\[\s*S(\d+(?:\s*,\s*S?\d+)*)\s*\]/gi, function(m, body){
      const nums = body.split(/\s*,\s*/)
        .map(function(x){ return parseInt(String(x).replace(/^S/i, ""), 10); })
        .filter(function(n){ return n > 0; });
      if(!nums.length) return m;
      return nums.map(function(n){
        const doc = ctx && ctx.sources && ctx.sources[n - 1];
        const tip = doc ? (doc.id + " · " + doc.title) : ("Source " + n);
        return '<button class="cite" title="' + escAttr(tip) + '" onclick="Panel.showSource(' + (n - 1) +
               ",'" + escJs((ctx && ctx.msgId) || "") + "')\">" + n + "</button>";
      }).join("");
    });

    /* web citations: [W1] or [W1, W2]. A separate namespace from [S1] on
       purpose — the reader must never have to work out whether a claim came
       from the company or from the open internet, so the chip says so. */
    s = s.replace(/\[\s*W(\d+(?:\s*,\s*W?\d+)*)\s*\]/gi, function(m, body){
      const nums = body.split(/\s*,\s*/)
        .map(function(x){ return parseInt(String(x).replace(/^W/i, ""), 10); })
        .filter(function(n){ return n > 0; });
      if(!nums.length) return m;
      return nums.map(function(n){
        const hit = ctx && ctx.web && ctx.web[n - 1];
        const tip = hit ? ((hit.site ? hit.site + " · " : "") + hit.title) : ("Web result " + n);
        return '<button class="cite cite-web" title="' + escAttr(tip) + '" onclick="Panel.showWeb(' + (n - 1) +
               ",'" + escJs((ctx && ctx.msgId) || "") + "')\">" + Icons.svg("globe") + n + "</button>";
      }).join("");
    });

    s = s.replace(/\*\*\*([^*\n]+)\*\*\*/g, "<strong><em>$1</em></strong>");
    s = s.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[\s(])\*([^*\n]+?)\*(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>");
    s = s.replace(/(^|[\s(])_([^_\n]+?)_(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>");
    s = s.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");

    /* bare urls that were not already linked */
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, function(m, pre, url){
      return pre + '<a href="' + escAttr(url) + '" target="_blank" rel="noopener noreferrer">' + url + "</a>";
    });

    s = s.replace(/<c(\d+)>/g, function(m, i){ return "<code>" + codes[+i] + "</code>"; });
    return s;
  }

  /* Highlight status words so long prose stays scannable.

     This runs over HTML that inline() has already produced, so it must touch
     text only. Applied naively it rewrites words inside attributes: a citation
     whose source title ends in "failed" had a <span> injected into its title=""
     attribute, which broke the attribute and spilled markup into the button.
     So the string is split on tags, and only the text between them is
     transformed. Content inside <code> and <pre> is skipped as well, since
     recolouring a word inside a code sample is never wanted. */
  const STATUS_RULES = [
    [/\b(compliant|approved|on track|resolved|closed|passed|complete)\b/gi, "v-ok"],
    [/\b(at risk|overdue|pending|expiring|monitor|caution)\b/gi, "v-warn"],
    [/\b(breach|non-compliant|critical|failed|expired|prohibited)\b/gi, "v-crit"],
  ];

  function statusWords(html){
    /* odd indices are tags, because the separator is captured */
    const parts = String(html).split(/(<[^>]*>)/);
    let skip = 0;
    for(let i = 0; i < parts.length; i++){
      if(i % 2 === 1){
        if(/^<(code|pre)\b/i.test(parts[i])) skip++;
        else if(/^<\/(code|pre)\s*>/i.test(parts[i])) skip = Math.max(0, skip - 1);
        continue;
      }
      if(skip > 0 || !parts[i]) continue;
      let text = parts[i];
      STATUS_RULES.forEach(function(rule){
        text = text.replace(rule[0], '<span class="' + rule[1] + '">$1</span>');
      });
      parts[i] = text;
    }
    return parts.join("");
  }

  /* ---------- tables ---------- */
  const isDivider = function(line){
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
  };
  function splitRow(line){
    let t = line.trim();
    if(t.charAt(0) === "|") t = t.slice(1);
    if(t.charAt(t.length - 1) === "|") t = t.slice(0, -1);
    return t.split(/(?<!\\)\|/).map(function(c){ return c.trim().replace(/\\\|/g, "|"); });
  }
  function renderTable(head, aligns, rows, ctx){
    const cellClass = function(i){
      if(aligns[i] === "right") return ' class="num"';
      /* auto right-align a column whose body is consistently numeric */
      const col = rows.map(function(r){ return r[i]; })
                      .filter(function(v){ return v !== undefined && v !== ""; });
      if(col.length && col.every(isNumeric)) return ' class="num"';
      return "";
    };
    let h = '<div class="tbl-wrap"><table><thead><tr>';
    head.forEach(function(c, i){ h += "<th" + cellClass(i) + ">" + inline(c, ctx) + "</th>"; });
    h += "</tr></thead><tbody>";
    rows.forEach(function(r){
      h += "<tr>";
      for(let i = 0; i < head.length; i++) h += "<td" + cellClass(i) + ">" + inline(r[i] || "", ctx) + "</td>";
      h += "</tr>";
    });
    return h + "</tbody></table></div>";
  }

  /* ---------- lists ---------- */
  const BULLET  = /^(\s*)[-*+]\s+(.*)$/;
  const ORDERED = /^(\s*)(\d{1,3})[.)]\s+(.*)$/;

  function renderList(items, ordered, ctx){
    /* items: [{indent, text, ordered}] — nesting is rebuilt from indentation */
    let html = ordered ? "<ol>" : "<ul>";
    let i = 0;
    const baseIndent = items[0].indent;
    while(i < items.length){
      const it = items[i];
      const kids = [];
      let j = i + 1;
      while(j < items.length && items[j].indent > baseIndent){ kids.push(items[j]); j++; }
      html += "<li>" + inline(it.text, ctx);
      if(kids.length) html += renderList(kids, kids[0].ordered, ctx);
      html += "</li>";
      i = j;
    }
    return html + (ordered ? "</ol>" : "</ul>");
  }

  /* ---------- callouts ---------- */
  const CALLOUT_MAP = {
    NOTE:      { cls: "callout-info", icon: "info",  label: "Note" },
    TIP:       { cls: "callout-ok",   icon: "spark", label: "Tip" },
    IMPORTANT: { cls: "callout-info", icon: "info",  label: "Important" },
    WARNING:   { cls: "callout-warn", icon: "alert", label: "Warning" },
    CAUTION:   { cls: "callout-crit", icon: "alert", label: "Caution" },
  };

  /* ---------- block pass ---------- */
  function render(src, ctx){
    ctx = ctx || {};
    if(src == null) return "";
    let text = String(src)
      .replace(/\r\n?/g, "\n")
      .replace(/\t/g, "    ")
      .replace(/^<f\d+>$/gm, "");   /* neutralise a forged fence placeholder */

    /* pull fenced code out before anything else */
    const fences = [];
    text = text.replace(/```([\w+-]*)\n?([\s\S]*?)(?:```|$)/g, function(m, lang, code){
      fences.push({ lang: lang || "", code: code.replace(/\n$/, "") });
      return "\n<f" + (fences.length - 1) + ">\n";
    });

    const lines = text.split("\n");
    let out = "";
    let para = [];

    const flushPara = function(){
      if(!para.length) return;
      out += "<p>" + statusWords(inline(para.join("\n"), ctx)).replace(/\n/g, "<br>") + "</p>";
      para = [];
    };

    for(let i = 0; i < lines.length; i++){
      const line = lines[i];

      /* code fence placeholder */
      const fm = line.match(/^<f(\d+)>$/);
      if(fm){
        flushPara();
        const f = fences[+fm[1]];
        out += "<pre><code" + (f.lang ? ' class="lang-' + escAttr(f.lang) + '"' : "") + ">" + esc(f.code) + "</code></pre>";
        continue;
      }

      if(!line.trim()){ flushPara(); continue; }

      /* heading */
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if(h){
        flushPara();
        const lvl = Math.min(h[1].length + 1, 4); /* an h1 inside a chat answer is too loud */
        out += "<h" + lvl + ">" + inline(h[2].replace(/\s*#+\s*$/, ""), ctx) + "</h" + lvl + ">";
        continue;
      }

      /* horizontal rule */
      if(/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)){ flushPara(); out += "<hr>"; continue; }

      /* table */
      if(line.indexOf("|") !== -1 && i + 1 < lines.length && isDivider(lines[i + 1])){
        flushPara();
        const head = splitRow(line);
        const aligns = splitRow(lines[i + 1]).map(function(c){
          return /^:.*:$/.test(c) ? "center" : /:$/.test(c) ? "right" : "left";
        });
        const rows = [];
        let j = i + 2;
        while(j < lines.length && lines[j].indexOf("|") !== -1 && lines[j].trim()){
          rows.push(splitRow(lines[j])); j++;
        }
        out += renderTable(head, aligns, rows, ctx);
        i = j - 1;
        continue;
      }

      /* blockquote / callout */
      if(/^\s*>/.test(line)){
        flushPara();
        const buf = [];
        let j = i;
        while(j < lines.length && /^\s*>/.test(lines[j])){
          buf.push(lines[j].replace(/^\s*>\s?/, "")); j++;
        }
        i = j - 1;
        const alert = buf[0] && buf[0].match(/^\[!(\w+)\]\s*(.*)$/i);
        if(alert && CALLOUT_MAP[alert[1].toUpperCase()]){
          const c = CALLOUT_MAP[alert[1].toUpperCase()];
          const title = alert[2].trim();
          const rest = buf.slice(1).join("\n").trim();
          out += '<div class="callout ' + c.cls + '">' + Icons.el(c.icon) +
                 "<div><b>" + inline(title || c.label, ctx) + "</b>" +
                 (rest ? inline(rest, ctx) : "") + "</div></div>";
        }else{
          out += "<blockquote>" + render(buf.join("\n"), ctx) + "</blockquote>";
        }
        continue;
      }

      /* lists */
      if(BULLET.test(line) || ORDERED.test(line)){
        flushPara();
        const items = [];
        let j = i;
        while(j < lines.length){
          const b = lines[j].match(BULLET), o = lines[j].match(ORDERED);
          if(b){ items.push({ indent: b[1].length, text: b[2], ordered: false }); j++; }
          else if(o){ items.push({ indent: o[1].length, text: o[3], ordered: true }); j++; }
          else if(lines[j].trim() && /^\s{2,}\S/.test(lines[j]) && items.length){
            items[items.length - 1].text += " " + lines[j].trim(); j++;   /* lazy continuation */
          }
          else break;
        }
        i = j - 1;
        if(items.length) out += renderList(items, items[0].ordered, ctx);
        continue;
      }

      para.push(line);
    }
    flushPara();
    return out;
  }

  return {
    render: render,
    inline: function(s, ctx){ return inline(s, ctx); },
    /* markdown -> plain text, for clipboard and export */
    strip: function(src){
      return String(src || "")
        .replace(/```[\w+-]*\n?([\s\S]*?)```/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/(^|\s)\*([^*]+)\*/g, "$1$2")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^\s*>\s?/gm, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim();
    },
  };
})();
