/* ------------------------------------------------------------------
   Artifact renderers.

   A registry, not a switch: each type declares its icon, label, renderer
   and text serialiser. Adding a type is one entry here plus one line in
   the schema list inside the system prompt. Nothing else in the app knows
   the set of types.

   Every renderer treats its spec as untrusted and normalises before use.
   ------------------------------------------------------------------ */

const Artifacts = (function(){

  /* ---------- helpers ---------- */
  const arr  = function(v){ return Array.isArray(v) ? v : []; };
  const str  = function(v, d){ return (v == null || v === "") ? (d || "") : String(v); };
  const txt  = function(v){ return MD.inline(str(v)); };
  /* multi-line artifact body text: bold + line breaks only */
  const body = function(v){
    return str(v).split(/\n{2,}/).map(function(p){
      return "<p>" + MD.inline(p).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  };
  const chipRow = function(list){
    const items = arr(list).filter(Boolean);
    if(!items.length) return "";
    return items.map(function(m){
      if(typeof m === "object" && m) return '<span class="chip">' + esc(str(m.k || m.label)) + ": " + esc(str(m.v || m.value)) + "</span>";
      return '<span class="chip">' + esc(str(m)) + "</span>";
    }).join("");
  };

  const STATUS_CLASS = { ok: "chip-ok", good: "chip-ok", warn: "chip-warn", warning: "chip-warn",
                         crit: "chip-crit", critical: "chip-crit", info: "chip-info" };

  /* ================= 1. document ================= */
  function renderDocument(a){
    const sections = arr(a.sections);
    const meta = arr(a.meta).filter(function(m){ return m && (m.k || m.v); });
    return '<div class="art"><div class="doc">' +
      '<div class="doc-head">' +
        '<div class="doc-kind">' + esc(str(a.kind, "Document")) + "</div>" +
        '<div class="doc-title">' + esc(str(a.title, "Untitled")) + "</div>" +
        (meta.length ? '<div class="doc-meta">' + meta.map(function(m){
          return '<div class="doc-meta-row"><span class="k">' + esc(str(m.k)) + '</span><span class="v">' + txt(m.v) + "</span></div>";
        }).join("") + "</div>" : "") +
      "</div>" +
      '<div class="doc-body">' +
        (sections.length
          ? sections.map(function(s){
              /* A section may carry a drawing instead of, or as well as,
                 its prose. A quote with the settlement drawn on it is a
                 different document from a permit that lists it. */
              const dg = (s && s.diagram && typeof Diagrams !== "undefined")
                ? Diagrams.render(s.diagram) : "";
              return (s && s.h ? "<h4>" + esc(str(s.h)) + "</h4>" : "") + body(s && s.body) + dg;
            }).join("")
          : body(a.body)) +
      "</div>" +
      (a.footer ? '<div class="doc-sign">' + body(a.footer) + "</div>" : "") +
    "</div></div>";
  }
  function textDocument(a){
    const lines = [str(a.kind, "Document").toUpperCase(), str(a.title), ""];
    arr(a.meta).forEach(function(m){ if(m && m.k) lines.push(str(m.k) + ": " + str(m.v)); });
    lines.push("");
    arr(a.sections).forEach(function(s){
      if(s && s.h) lines.push(str(s.h), "-".repeat(String(s.h).length));
      lines.push(MD.strip(str(s && s.body)), "");
      /* the drawing has to survive a copy-paste, so it flattens too */
      if(s && s.diagram && typeof Diagrams !== "undefined"){
        const d = Diagrams.toText(s.diagram);
        if(d) lines.push(d, "");
      }
    });
    if(!arr(a.sections).length && a.body) lines.push(MD.strip(str(a.body)));
    if(a.footer) lines.push("", MD.strip(str(a.footer)));
    return lines.join("\n");
  }

  /* ================= 2. checklist ================= */
  function renderChecklist(a, id){
    let groups = arr(a.groups);
    if(!groups.length && arr(a.items).length) groups = [{ name: "", items: a.items }];

    const all = groups.reduce(function(n, g){ return n + arr(g.items).length; }, 0);
    const done = (a._done || []).length;

    let html = '<div class="art">';
    if(all){
      html += '<div class="ckl-progress"><span class="n">' + done + " / " + all + "</span>" +
              '<span class="bar"><i style="width:' + (all ? (done / all) * 100 : 0) + '%"></i></span>' +
              '<span class="n" style="color:var(--tx-3);font-weight:400">complete</span></div>';
    }
    html += '<div class="ckl">';
    let idx = 0;
    groups.forEach(function(g){
      if(g && g.name) html += '<div class="ckl-group-t">' + esc(str(g.name)) + "</div>";
      arr(g && g.items).forEach(function(it){
        const key = idx++;
        const isDone = (a._done || []).indexOf(key) !== -1;
        const prio = String((it && it.priority) || "").toLowerCase();
        const meta = [];
        if(it && it.owner) meta.push('<span class="chip">' + Icons.el("user") + esc(str(it.owner)) + "</span>");
        if(it && it.due)   meta.push('<span class="chip">' + Icons.el("clock") + esc(str(it.due)) + "</span>");
        if(prio === "high") meta.push('<span class="chip chip-crit">High priority</span>');
        html += '<div class="ckl-item' + (isDone ? " done" : "") + '" data-prio="' + escAttr(prio) + '">' +
          '<span class="ckl-prio"></span>' +
          '<button class="ckl-box" onclick="Artifacts.toggle(\'' + escJs(id) + "'," + key + ')" aria-label="Toggle">' + Icons.el("check") + "</button>" +
          '<span class="ckl-main">' +
            '<span class="ckl-t">' + txt(it && (it.t || it.title || it.text)) + "</span>" +
            ((it && it.d) ? '<span class="ckl-d">' + txt(it.d) + "</span>" : "") +
            (meta.length ? '<span class="ckl-meta">' + meta.join("") + "</span>" : "") +
          "</span></div>";
      });
    });
    return html + "</div></div>";
  }
  function textChecklist(a){
    const lines = [str(a.title), ""];
    let groups = arr(a.groups);
    if(!groups.length && arr(a.items).length) groups = [{ name: "", items: a.items }];
    let i = 0;
    groups.forEach(function(g){
      if(g && g.name) lines.push("## " + str(g.name));
      arr(g && g.items).forEach(function(it){
        const mark = (a._done || []).indexOf(i++) !== -1 ? "[x]" : "[ ]";
        const bits = [];
        if(it && it.owner) bits.push(str(it.owner));
        if(it && it.due) bits.push("due " + str(it.due));
        lines.push("- " + mark + " " + MD.strip(str(it && (it.t || it.title))) + (bits.length ? "  (" + bits.join(", ") + ")" : ""));
        if(it && it.d) lines.push("      " + MD.strip(str(it.d)));
      });
      lines.push("");
    });
    return lines.join("\n");
  }

  /* ================= 3. table ================= */
  function renderTable(a, id){
    const headers = arr(a.headers).map(function(h){ return str(h); });
    let rows = arr(a.rows).map(function(r){ return arr(r).map(function(c){ return str(c); }); });
    if(!headers.length || !rows.length) return '<div class="art"><div class="panel-empty"><p>No table data was supplied.</p></div></div>';

    /* numeric columns are right-aligned and get an inline magnitude bar */
    const numeric = headers.map(function(_, i){
      const col = rows.map(function(r){ return r[i]; }).filter(function(v){ return v !== undefined && v !== ""; });
      return col.length > 1 && col.every(isNumeric);
    });
    const maxima = headers.map(function(_, i){
      if(!numeric[i]) return 0;
      return rows.reduce(function(m, r){ return Math.max(m, Math.abs(toNum(r[i]))); }, 0);
    });

    const sort = a._sort;
    if(sort && sort.col != null && headers[sort.col] !== undefined){
      const c = sort.col, dir = sort.dir === "desc" ? -1 : 1;
      rows = rows.slice().sort(function(x, y){
        const xv = x[c], yv = y[c];
        if(numeric[c]) return (toNum(xv) - toNum(yv)) * dir;
        return String(xv).localeCompare(String(yv), undefined, { numeric: true }) * dir;
      });
    }

    let html = '<div class="art"><div class="dt-wrap"><div class="dt-scroll"><table class="dt"><thead><tr>';
    headers.forEach(function(h, i){
      const on = sort && sort.col === i;
      html += "<th" + (numeric[i] ? ' class="num' + (on ? " sorted" : "") + '"' : (on ? ' class="sorted"' : "")) +
              " onclick=\"Artifacts.sort('" + escJs(id) + "'," + i + ')">' + esc(h) +
              '<span class="sort">' + (on ? (sort.dir === "desc" ? "▼" : "▲") : "↕") + "</span></th>";
    });
    html += "</tr></thead><tbody>";
    rows.forEach(function(r){
      html += "<tr>";
      headers.forEach(function(_, i){
        const v = r[i] === undefined ? "" : r[i];
        if(numeric[i] && maxima[i]){
          const pct = clamp((Math.abs(toNum(v)) / maxima[i]) * 100, 0, 100);
          html += '<td class="num dt-bar"><span class="fill" style="width:' + pct.toFixed(1) + '%;right:0;left:auto"></span><span>' + esc(v) + "</span></td>";
        }else{
          html += "<td>" + txt(v) + "</td>";
        }
      });
      html += "</tr>";
    });
    html += "</tbody>";
    if(arr(a.footer).length){
      html += "<tfoot><tr>" + arr(a.footer).map(function(c, i){
        return "<td" + (numeric[i] ? ' class="num"' : "") + ">" + esc(str(c)) + "</td>";
      }).join("") + "</tr></tfoot>";
    }
    html += "</table></div></div>";
    if(a.note) html += '<div class="art-note">' + MD.inline(str(a.note)) + "</div>";
    return html + "</div>";
  }
  function textTable(a){
    const headers = arr(a.headers).map(String);
    const rows = arr(a.rows).map(function(r){ return arr(r).map(String); });
    const lines = [];
    if(a.title) lines.push(str(a.title), "");
    lines.push("| " + headers.join(" | ") + " |");
    lines.push("|" + headers.map(function(){ return "---"; }).join("|") + "|");
    rows.forEach(function(r){ lines.push("| " + r.join(" | ") + " |"); });
    if(arr(a.footer).length) lines.push("| " + arr(a.footer).map(String).join(" | ") + " |");
    if(a.note) lines.push("", MD.strip(str(a.note)));
    return lines.join("\n");
  }

  /* ================= 4. chart ================= */
  function renderChart(a){ return '<div class="art">' + Charts.render(a) + "</div>"; }
  function textChart(a){
    const lines = [str(a.title), ""];
    const labels = arr(a.labels).map(String);
    arr(a.series).forEach(function(s){
      lines.push(str(s && s.name, "Series") + ":");
      arr(s && s.data).forEach(function(v, i){ lines.push("  " + (labels[i] || i + 1) + ": " + v + " " + str(a.unit)); });
    });
    if(a.note) lines.push("", MD.strip(str(a.note)));
    return lines.join("\n");
  }

  /* ================= 5. flow ================= */
  const FLOW_KINDS = { step: "step", decision: "decision", end: "end", risk: "risk" };
  function renderFlow(a){
    const steps = arr(a.steps);
    if(!steps.length) return '<div class="art"><div class="panel-empty"><p>No steps were supplied.</p></div></div>';
    let html = '<div class="art"><div class="flow">';
    steps.forEach(function(s, i){
      const kind = FLOW_KINDS[String((s && s.kind) || "").toLowerCase()] || "step";
      const meta = chipRow(s && s.meta);
      html += '<div class="flow-node" data-kind="' + kind + '">' +
        '<span class="idx">' + (kind === "decision" ? "?" : kind === "end" ? "✓" : kind === "risk" ? "!" : (i + 1)) + "</span>" +
        '<span class="mn"><span class="tt">' + txt(s && (s.t || s.title)) + "</span>" +
        ((s && s.d) ? '<span class="dd">' + txt(s.d) + "</span>" : "") +
        (meta ? '<span class="meta">' + meta + "</span>" : "") +
        "</span></div>";
      if(i < steps.length - 1){
        const via = (steps[i + 1] && steps[i + 1].via) || (s && s.via) || "";
        html += '<div class="flow-link">' + Icons.el("arrowdown") + (via ? "<span>" + esc(str(via)) + "</span>" : "") + "</div>";
      }
    });
    return html + "</div></div>";
  }
  function textFlow(a){
    const lines = [str(a.title), ""];
    arr(a.steps).forEach(function(s, i){
      lines.push((i + 1) + ". " + MD.strip(str(s && (s.t || s.title))));
      if(s && s.d) lines.push("   " + MD.strip(str(s.d)));
      if(s && s.via) lines.push("   -> " + str(s.via));
    });
    return lines.join("\n");
  }

  /* ================= 6. timeline ================= */
  function renderTimeline(a){
    const events = arr(a.events);
    if(!events.length) return '<div class="art"><div class="panel-empty"><p>No events were supplied.</p></div></div>';
    let html = '<div class="art"><div class="tl">';
    events.forEach(function(e){
      const status = String((e && e.status) || "planned").toLowerCase();
      const meta = chipRow(e && e.meta);
      html += '<div class="tl-item" data-status="' + escAttr(status) + '">' +
        '<div class="tl-when">' + esc(str(e && e.when)) + "</div>" +
        '<div class="tl-t">' + txt(e && (e.t || e.title)) + "</div>" +
        ((e && e.d) ? '<div class="tl-d">' + txt(e.d) + "</div>" : "") +
        (meta ? '<div class="tl-meta">' + meta + "</div>" : "") +
        "</div>";
    });
    return html + "</div></div>";
  }
  function textTimeline(a){
    const lines = [str(a.title), ""];
    arr(a.events).forEach(function(e){
      lines.push(str(e && e.when) + " — " + MD.strip(str(e && (e.t || e.title))) + " [" + str(e && e.status, "planned") + "]");
      if(e && e.d) lines.push("    " + MD.strip(str(e.d)));
    });
    return lines.join("\n");
  }

  /* ================= 7. comparison ================= */
  const MARKS = { yes: ["check", "yes"], no: ["close", "no"], partial: ["minus", "part"], part: ["minus", "part"] };
  function cell(v){
    const key = String(v).trim().toLowerCase();
    if(MARKS[key]){
      const m = MARKS[key];
      return '<span class="mark ' + m[1] + '">' + Icons.el(m[0]) + esc(key === "part" ? "partial" : key) + "</span>";
    }
    return txt(v);
  }
  function renderComparison(a){
    const options = arr(a.options).map(function(o){ return typeof o === "string" ? { name: o } : (o || {}); });
    const criteria = arr(a.criteria);
    if(!options.length || !criteria.length) return '<div class="art"><div class="panel-empty"><p>Not enough data to compare.</p></div></div>';

    let html = '<div class="art"><div class="cmp"><div class="cmp-scroll"><table><thead><tr><th></th>';
    options.forEach(function(o, i){
      const best = a.best === i;
      html += '<th class="opt' + (best ? " best" : "") + '"><span class="opt-n">' + esc(str(o.name)) + "</span>" +
              (o.sub ? '<span class="opt-s">' + esc(str(o.sub)) + "</span>" : "") + "</th>";
    });
    html += "</tr></thead><tbody>";
    criteria.forEach(function(c){
      html += '<tr><td class="crit-name">' + esc(str(c && c.name)) + "</td>";
      options.forEach(function(_, i){
        const vals = arr(c && c.values);
        const isBest = c && c.best === i;
        html += "<td" + (isBest ? ' class="best"' : "") + ">" + cell(vals[i] === undefined ? "—" : vals[i]) + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";
    if(a.verdict) html += '<div class="cmp-verdict">' + MD.inline(str(a.verdict)) + "</div>";
    return html + "</div></div>";
  }
  function textComparison(a){
    const options = arr(a.options).map(function(o){ return typeof o === "string" ? o : str(o && o.name); });
    const lines = [str(a.title), "", "| Criterion | " + options.join(" | ") + " |",
                   "|---|" + options.map(function(){ return "---|"; }).join("")];
    arr(a.criteria).forEach(function(c){
      lines.push("| " + str(c && c.name) + " | " + arr(c && c.values).map(String).join(" | ") + " |");
    });
    if(a.verdict) lines.push("", MD.strip(str(a.verdict)));
    return lines.join("\n");
  }

  /* ================= 8. metrics ================= */
  const DIR_ICON = { up: "trendup", down: "trenddown", flat: "minus" };
  function renderMetrics(a){
    const items = arr(a.items);
    if(!items.length) return '<div class="art"><div class="panel-empty"><p>No metrics were supplied.</p></div></div>';
    let html = '<div class="art"><div class="mx">';
    items.forEach(function(m){
      const dir = String((m && m.dir) || "").toLowerCase();
      const status = String((m && m.status) || "").toLowerCase();
      const pct = m && m.pct != null ? clamp(toNum(m.pct), 0, 100) : null;
      html += '<div class="mx-c"' + (status ? ' data-status="' + escAttr(status) + '"' : "") + ">" +
        '<div class="mx-l">' + esc(str(m && m.label)) + "</div>" +
        '<div class="mx-v">' + esc(str(m && m.value)) + "</div>" +
        ((m && m.delta) ? '<div class="mx-d ' + (DIR_ICON[dir] ? dir : "flat") + '">' +
            Icons.el(DIR_ICON[dir] || "minus") + esc(str(m.delta)) + "</div>" : "") +
        (pct != null ? '<div class="mx-bar"><i style="width:' + pct + '%"></i></div>' : "") +
      "</div>";
    });
    html += "</div>";
    if(a.note) html += '<div class="art-note">' + MD.inline(str(a.note)) + "</div>";
    return html + "</div>";
  }
  function textMetrics(a){
    const lines = [str(a.title), ""];
    arr(a.items).forEach(function(m){
      lines.push(str(m && m.label) + ": " + str(m && m.value) + (m && m.delta ? "  (" + str(m.delta) + ")" : ""));
    });
    if(a.note) lines.push("", MD.strip(str(a.note)));
    return lines.join("\n");
  }

  /* ================= 9. code ================= */
  const KEYWORDS = ("const let var function return if else for while do break continue class extends new this " +
    "import from export default async await try catch finally throw typeof instanceof null true false undefined " +
    "def elif print lambda None True False and or not in is with as pass raise yield global " +
    "select from where group by order having join left right inner outer on as insert update delete into values " +
    "public private protected static void int string bool double float var end begin then").split(" ");
  const KW_RE = new RegExp("\\b(" + KEYWORDS.join("|") + ")\\b", "g");

  /* Placeholders are uppercase-only and digit-free so the keyword, number
     and function passes below cannot match inside one. esc() has already
     removed every raw "<", so a placeholder cannot be forged by the input. */
  const HOLD_ALPHA = "ABCDEFGHIJ";
  const holdKey = function(n){ return String(n).split("").map(function(d){ return HOLD_ALPHA[+d]; }).join(""); };

  function highlightCode(code){
    let s = esc(code);
    const holds = [];
    const hold = function(html){ holds.push(html); return "<z" + holdKey(holds.length - 1) + "z>"; };
    /* comments and strings first, so keywords inside them are left alone */
    s = s.replace(/(^|\n)(\s*)(#|\/\/|--)(.*)/g, function(m, nl, sp, mark, rest){
      return nl + sp + hold('<span class="tok-c">' + mark + rest + "</span>");
    });
    s = s.replace(/\/\*[\s\S]*?\*\//g, function(m){ return hold('<span class="tok-c">' + m + "</span>"); });
    s = s.replace(/(&quot;|&#39;|`)(?:(?!\1)[\s\S])*?\1/g, function(m){ return hold('<span class="tok-s">' + m + "</span>"); });

    s = s.replace(KW_RE, '<span class="tok-k">$1</span>');
    s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-n">$1</span>');
    s = s.replace(/\b([A-Za-z_]\w*)(?=\s*\()/g, '<span class="tok-f">$1</span>');

    /* a held string can contain an earlier placeholder, so unwind repeatedly */
    for(let pass = 0; pass < 4 && s.indexOf("<z") !== -1; pass++){
      s = s.replace(/<z([A-J]+)z>/g, function(m, key){
        const i = +key.split("").map(function(c){ return HOLD_ALPHA.indexOf(c); }).join("");
        return holds[i] !== undefined ? holds[i] : m;
      });
    }
    return s;
  }
  function renderCode(a){
    const code = str(a.code);
    return '<div class="art"><div class="code-wrap">' +
      '<div class="code-head">' + Icons.el("code") +
        "<span>" + esc(str(a.filename) || str(a.language, "snippet")) + "</span>" +
        '<span class="spacer"></span>' +
        '<span>' + esc(String(code.split("\n").length)) + " lines</span>" +
      "</div><pre><code>" + highlightCode(code) + "</code></pre></div></div>";
  }
  function textCode(a){ return str(a.code); }

  /* ================= 10. image ================= */
  function renderImage(a, id){
    if(a._img){
      return '<div class="art"><div class="img-art"><img src="' + escAttr(a._img) + '" alt="' + escAttr(str(a.title)) + '">' +
        (a.caption ? '<div class="cap">' + txt(a.caption) + "</div>" : "") + "</div></div>";
    }
    if(a._imgError){
      return '<div class="art"><div class="msg-err">' + Icons.el("alert") +
        '<span class="mn"><b>Image could not be generated</b><span class="dtl">' + esc(str(a._imgError)) + "</span>" +
        '<span class="acts"><button class="btn btn-sm" onclick="Artifacts.retryImage(\'' + escJs(id) + '\')">Try again</button></span></span></div></div>';
    }
    return '<div class="art"><div class="img-art"><div class="img-loading"><span class="ring"></span>' +
      "<span>Generating image…</span></div>" +
      (a.caption ? '<div class="cap">' + txt(a.caption) + "</div>" : "") + "</div></div>";
  }
  function textImage(a){ return str(a.title) + "\n\n" + str(a.prompt) + (a.caption ? "\n\n" + str(a.caption) : ""); }

  /* ================= registry ================= */
  const TYPES = {
    document:   { icon: "doc",       label: "Document",   render: renderDocument,   text: textDocument },
    checklist:  { icon: "checklist", label: "Checklist",  render: renderChecklist,  text: textChecklist },
    table:      { icon: "table",     label: "Table",      render: renderTable,      text: textTable },
    chart:      { icon: "bars",      label: "Chart",      render: renderChart,      text: textChart },
    flow:       { icon: "flow",      label: "Process",    render: renderFlow,       text: textFlow },
    timeline:   { icon: "timeline",  label: "Timeline",   render: renderTimeline,   text: textTimeline },
    comparison: { icon: "compare",   label: "Comparison", render: renderComparison, text: textComparison },
    metrics:    { icon: "grid",      label: "Metrics",    render: renderMetrics,    text: textMetrics },
    code:       { icon: "code",      label: "Code",       render: renderCode,       text: textCode },
    image:      { icon: "image",     label: "Image",      render: renderImage,      text: textImage },
  };

  /* The domain diagrams register themselves as artifact types, so a
     settlement waterfall gets the panel, the copy, the download, the
     widen and the print path without any of that being written twice.
     They live in their own module because they are the only part of the
     product that knows what a delinquency bucket is. */
  if(typeof Diagrams !== "undefined"){
    Object.keys(Diagrams.TYPES).forEach(function(k){
      const d = Diagrams.TYPES[k];
      TYPES[k] = {
        icon: d.icon, label: d.label,
        render: function(a){ return '<div class="art art-dg">' + Diagrams.render(a) + "</div>"; },
        text: d.text,
      };
    });
  }

  /* Aliases the model reaches for even when told not to. */
  const ALIAS = { doc: "document", memo: "document", email: "document", letter: "document",
                  tasks: "checklist", todo: "checklist", steps: "flow", process: "flow",
                  graph: "chart", bar: "chart", line: "chart", donut: "chart", pie: "chart",
                  matrix: "comparison", compare: "comparison", kpi: "metrics", stats: "metrics",
                  data: "table", grid: "table", schedule: "timeline", plan: "timeline",
                  /* domain diagrams, under the names people actually say */
                  heat: "heatmap", concentration: "heatmap", coverage: "heatmap",
                  currency: "currency", staleness: "currency" };

  function typeOf(spec){
    const raw = String((spec && spec.type) || "").toLowerCase().trim();
    return TYPES[raw] ? raw : (ALIAS[raw] || null);
  }

  function render(spec, id){
    const t = typeOf(spec);
    if(!t) return '<div class="art"><div class="panel-empty"><span class="orb">' + Icons.el("alert") +
                  "</span><h4>Unsupported visual</h4><p>The assistant asked for a “" +
                  esc(String((spec && spec.type) || "unknown")) + "” view, which this workspace does not render.</p></div></div>";
    try{
      return TYPES[t].render(spec, id);
    }catch(err){
      return '<div class="art"><div class="msg-err">' + Icons.el("alert") +
             '<span class="mn"><b>This visual could not be drawn</b><span class="dtl">' + esc(err.message) + "</span></span></div></div>";
    }
  }

  function toText(spec){
    const t = typeOf(spec);
    if(!t) return JSON.stringify(spec, null, 2);
    try{ return TYPES[t].text(spec); }catch(e){ return JSON.stringify(spec, null, 2); }
  }

  return {
    TYPES: TYPES,
    typeOf: typeOf,
    render: render,
    toText: toText,
    icon: function(spec){ const t = typeOf(spec); return t ? TYPES[t].icon : "spark"; },
    label: function(spec){ const t = typeOf(spec); return t ? TYPES[t].label : "Visual"; },

    /* ---- interactions (bound from rendered markup) ---- */
    toggle: function(id, key){
      const a = Panel.find(id); if(!a) return;
      a.spec._done = a.spec._done || [];
      const at = a.spec._done.indexOf(key);
      if(at === -1) a.spec._done.push(key); else a.spec._done.splice(at, 1);
      Panel.repaint(id);
      Sidebar.persist();
    },
    sort: function(id, col){
      const a = Panel.find(id); if(!a) return;
      const cur = a.spec._sort;
      a.spec._sort = (cur && cur.col === col)
        ? { col: col, dir: cur.dir === "asc" ? "desc" : "asc" }
        : { col: col, dir: "asc" };
      Panel.repaint(id);
    },
    retryImage: function(id){
      const a = Panel.find(id); if(!a) return;
      a.spec._imgError = null;
      Panel.repaint(id);
      Panel.generateImage(a);
    },
  };
})();
