/* ------------------------------------------------------------------
   Charts, drawn as plain SVG.

   No charting library: the file stays dependency-free, the output inherits
   the theme tokens automatically, and it prints as vector rather than a
   rasterised canvas.
   ------------------------------------------------------------------ */

const Charts = (function(){

  const W = 660, H = 320;
  const SERIES = ["#4d7cfe","#2fbf71","#e0a11b","#ef4a5c","#3aa8e0","#a855f7","#ec4899","#84cc16","#f97316","#14b8a6"];

  function colorAt(i){ return i === 0 ? (S.accent || SERIES[0]) : SERIES[i % SERIES.length]; }

  /* Axis ticks on 1/2/5 x 10^n boundaries. */
  function niceTicks(min, max, count){
    if(max === min){ max = min + 1; }
    const span = max - min;
    const rough = span / (count || 5);
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const norm = rough / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const ticks = [];
    for(let v = lo; v <= hi + step * 0.5; v += step) ticks.push(+v.toFixed(10));
    return { ticks: ticks, lo: lo, hi: hi };
  }

  function fmtTick(v){
    const a = Math.abs(v);
    if(a >= 1e9) return (v / 1e9).toFixed(a % 1e9 ? 1 : 0) + "B";
    if(a >= 1e6) return (v / 1e6).toFixed(a % 1e6 ? 1 : 0) + "M";
    if(a >= 1e3) return (v / 1e3).toFixed(a % 1e3 ? 1 : 0) + "k";
    return String(+v.toFixed(2));
  }

  /* Shorten a category label so axes stay legible. */
  function short(s, n){
    const t = String(s == null ? "" : s);
    return t.length > (n || 12) ? t.slice(0, (n || 12) - 1) + "…" : t;
  }

  function normalise(spec){
    let series = Array.isArray(spec.series) ? spec.series : [];
    if(!series.length && Array.isArray(spec.data)) series = [{ name: spec.title || "Value", data: spec.data }];
    series = series.map(function(s, i){
      return {
        name: s && s.name != null ? String(s.name) : "Series " + (i + 1),
        data: (Array.isArray(s && s.data) ? s.data : []).map(toNum),
      };
    }).filter(function(s){ return s.data.length; });

    let labels = (Array.isArray(spec.labels) ? spec.labels : []).map(function(l){ return String(l == null ? "" : l); });
    const maxLen = series.reduce(function(n, s){ return Math.max(n, s.data.length); }, 0);
    while(labels.length < maxLen) labels.push("");
    labels = labels.slice(0, maxLen);
    series.forEach(function(s){ while(s.data.length < maxLen) s.data.push(0); });
    return { labels: labels, series: series, unit: spec.unit || "" };
  }

  function legend(series){
    if(series.length < 2) return "";
    return '<div class="chart-legend">' + series.map(function(s, i){
      return '<span class="lg"><span class="sw" style="background:' + colorAt(i) + '"></span>' + esc(s.name) + "</span>";
    }).join("") + "</div>";
  }

  /* ---------------- vertical bars (grouped) ---------------- */
  function bar(d, stacked){
    const padL = 46, padR = 14, padT = 14, padB = 46;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    let maxV = 0, minV = 0;
    if(stacked){
      d.labels.forEach(function(_, i){
        const sum = d.series.reduce(function(n, s){ return n + Math.max(0, s.data[i]); }, 0);
        if(sum > maxV) maxV = sum;
      });
    }else{
      d.series.forEach(function(s){ s.data.forEach(function(v){ if(v > maxV) maxV = v; if(v < minV) minV = v; }); });
    }
    const t = niceTicks(Math.min(0, minV), maxV || 1, 5);
    const y = function(v){ return padT + plotH - ((v - t.lo) / (t.hi - t.lo || 1)) * plotH; };

    let svg = "";
    /* grid */
    svg += '<g class="grid">' + t.ticks.map(function(v){
      return '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>';
    }).join("") + "</g>";
    svg += '<g class="axis">' + t.ticks.map(function(v){
      return '<text x="' + (padL - 8) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + esc(fmtTick(v)) + "</text>";
    }).join("") + "</g>";

    const n = d.labels.length || 1;
    const slot = plotW / n;
    const groupPad = Math.min(14, slot * 0.22);
    const inner = slot - groupPad;
    const bw = stacked ? inner : inner / Math.max(1, d.series.length);
    const showVals = n * d.series.length <= 14;

    d.labels.forEach(function(lab, i){
      const x0 = padL + i * slot + groupPad / 2;
      if(stacked){
        let acc = 0;
        d.series.forEach(function(s, si){
          const v = Math.max(0, s.data[i]);
          const yTop = y(acc + v), yBot = y(acc);
          acc += v;
          if(yBot - yTop < 0.4) return;
          svg += '<rect class="bar" x="' + x0.toFixed(1) + '" y="' + yTop.toFixed(1) + '" width="' + bw.toFixed(1) +
                 '" height="' + (yBot - yTop).toFixed(1) + '" fill="' + colorAt(si) + '" rx="2"><title>' +
                 esc(s.name + " · " + lab + ": " + fmtNum(s.data[i]) + " " + d.unit) + "</title></rect>";
        });
      }else{
        d.series.forEach(function(s, si){
          const v = s.data[i];
          const base = y(Math.max(0, t.lo));
          const yTop = Math.min(y(v), base), yBot = Math.max(y(v), base);
          const x = x0 + si * bw;
          svg += '<rect class="bar" x="' + x.toFixed(1) + '" y="' + yTop.toFixed(1) + '" width="' + Math.max(1, bw - 2).toFixed(1) +
                 '" height="' + Math.max(1, yBot - yTop).toFixed(1) + '" fill="' + colorAt(si) + '" rx="2"><title>' +
                 esc(s.name + " · " + lab + ": " + fmtNum(v) + " " + d.unit) + "</title></rect>";
          if(showVals && Math.abs(yBot - yTop) > 12){
            svg += '<text class="chart-val" x="' + (x + (bw - 2) / 2).toFixed(1) + '" y="' + (yTop - 4).toFixed(1) +
                   '" text-anchor="middle">' + esc(fmtTick(v)) + "</text>";
          }
        });
      }
      svg += '<g class="axis"><text x="' + (padL + i * slot + slot / 2).toFixed(1) + '" y="' + (H - padB + 18) +
             '" text-anchor="middle">' + esc(short(lab, n > 8 ? 7 : 12)) + "</text></g>";
    });

    return svg;
  }

  /* ---------------- horizontal bars (ranking) ---------------- */
  function hbar(d){
    const rows = d.labels.length || 1;
    const rowH = 30, padT = 10, padB = 26, padR = 46;
    const labelW = 128;
    const height = padT + rows * rowH + padB;
    const plotW = W - labelW - padR;

    let maxV = 0;
    d.series.forEach(function(s){ s.data.forEach(function(v){ if(v > maxV) maxV = v; }); });
    const t = niceTicks(0, maxV || 1, 4);
    const x = function(v){ return labelW + (v / (t.hi || 1)) * plotW; };

    let svg = '<g class="grid">' + t.ticks.map(function(v){
      return '<line x1="' + x(v).toFixed(1) + '" x2="' + x(v).toFixed(1) + '" y1="' + padT + '" y2="' + (padT + rows * rowH) + '"/>';
    }).join("") + "</g>";
    svg += '<g class="axis">' + t.ticks.map(function(v){
      return '<text x="' + x(v).toFixed(1) + '" y="' + (padT + rows * rowH + 16) + '" text-anchor="middle">' + esc(fmtTick(v)) + "</text>";
    }).join("") + "</g>";

    d.labels.forEach(function(lab, i){
      const cy = padT + i * rowH + rowH / 2;
      svg += '<g class="axis"><text x="' + (labelW - 10) + '" y="' + (cy + 4).toFixed(1) + '" text-anchor="end">' +
             esc(short(lab, 18)) + "</text></g>";
      const per = d.series.length;
      const bh = Math.min(16, (rowH - 8) / per);
      d.series.forEach(function(s, si){
        const v = Math.max(0, s.data[i]);
        const yTop = cy - (per * bh) / 2 + si * bh;
        svg += '<rect class="bar" x="' + labelW + '" y="' + yTop.toFixed(1) + '" width="' + Math.max(1, x(v) - labelW).toFixed(1) +
               '" height="' + Math.max(2, bh - 2).toFixed(1) + '" fill="' + colorAt(si) + '" rx="2"><title>' +
               esc(s.name + " · " + lab + ": " + fmtNum(v) + " " + d.unit) + "</title></rect>";
        svg += '<text class="chart-val" x="' + (x(v) + 6).toFixed(1) + '" y="' + (yTop + bh / 2 + 2).toFixed(1) + '">' +
               esc(fmtTick(v)) + "</text>";
      });
    });
    return { svg: svg, height: height };
  }

  /* ---------------- line ---------------- */
  function line(d){
    const padL = 46, padR = 16, padT = 14, padB = 42;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    let maxV = -Infinity, minV = Infinity;
    d.series.forEach(function(s){ s.data.forEach(function(v){ if(v > maxV) maxV = v; if(v < minV) minV = v; }); });
    if(!isFinite(maxV)){ maxV = 1; minV = 0; }
    const pad = (maxV - minV) * 0.12 || 1;
    const t = niceTicks(minV - pad < 0 && minV >= 0 ? 0 : minV - pad, maxV + pad, 5);

    const n = d.labels.length || 1;
    const x = function(i){ return padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW); };
    const y = function(v){ return padT + plotH - ((v - t.lo) / (t.hi - t.lo || 1)) * plotH; };

    let svg = '<g class="grid">' + t.ticks.map(function(v){
      return '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>';
    }).join("") + "</g>";
    svg += '<g class="axis">' + t.ticks.map(function(v){
      return '<text x="' + (padL - 8) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + esc(fmtTick(v)) + "</text>";
    }).join("") + "</g>";

    const every = Math.ceil(n / 9);
    d.labels.forEach(function(lab, i){
      if(i % every) return;
      svg += '<g class="axis"><text x="' + x(i).toFixed(1) + '" y="' + (H - padB + 18) + '" text-anchor="middle">' +
             esc(short(lab, 9)) + "</text></g>";
    });

    d.series.forEach(function(s, si){
      const col = colorAt(si);
      const pts = s.data.map(function(v, i){ return x(i).toFixed(1) + "," + y(v).toFixed(1); });
      if(d.series.length === 1){
        const area = "M" + pts.join(" L") + " L" + x(n - 1).toFixed(1) + "," + y(t.lo).toFixed(1) +
                     " L" + x(0).toFixed(1) + "," + y(t.lo).toFixed(1) + " Z";
        svg += '<path d="' + area + '" fill="' + col + '" opacity="0.1"/>';
      }
      svg += '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + col +
             '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
      if(n <= 24){
        s.data.forEach(function(v, i){
          svg += '<circle class="dot" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="3" fill="' + col +
                 '" stroke="var(--bg-side)" stroke-width="1.5"><title>' +
                 esc(s.name + " · " + d.labels[i] + ": " + fmtNum(v) + " " + d.unit) + "</title></circle>";
        });
      }
    });
    return svg;
  }

  /* ---------------- donut ---------------- */
  function donut(d){
    const size = 300, cx = 150, cy = 150, r = 108, thick = 40;
    const values = (d.series[0] ? d.series[0].data : []).map(function(v){ return Math.max(0, v); });
    const total = values.reduce(function(a, b){ return a + b; }, 0);
    if(!total) return { svg: "", legend: "", height: size };

    let angle = -Math.PI / 2;
    let svg = "";
    values.forEach(function(v, i){
      const sweep = (v / total) * Math.PI * 2;
      if(sweep <= 0) return;
      const end = angle + sweep;
      const large = sweep > Math.PI ? 1 : 0;
      const x1 = cx + Math.cos(angle) * r,        y1 = cy + Math.sin(angle) * r;
      const x2 = cx + Math.cos(end) * r,          y2 = cy + Math.sin(end) * r;
      const x3 = cx + Math.cos(end) * (r - thick), y3 = cy + Math.sin(end) * (r - thick);
      const x4 = cx + Math.cos(angle) * (r - thick), y4 = cy + Math.sin(angle) * (r - thick);
      /* a single 100% slice cannot be drawn as an arc, so draw two rings */
      if(values.filter(function(x){ return x > 0; }).length === 1){
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - thick / 2) + '" fill="none" stroke="' + colorAt(i) +
               '" stroke-width="' + thick + '"/>';
      }else{
        svg += '<path class="bar" d="M' + x1.toFixed(1) + " " + y1.toFixed(1) +
               " A" + r + " " + r + " 0 " + large + " 1 " + x2.toFixed(1) + " " + y2.toFixed(1) +
               " L" + x3.toFixed(1) + " " + y3.toFixed(1) +
               " A" + (r - thick) + " " + (r - thick) + " 0 " + large + " 0 " + x4.toFixed(1) + " " + y4.toFixed(1) +
               ' Z" fill="' + colorAt(i) + '"><title>' +
               esc(d.labels[i] + ": " + fmtNum(v) + " (" + Math.round((v / total) * 100) + "%)") + "</title></path>";
      }
      angle = end;
    });

    svg += '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" style="font-size:24px;font-weight:600;fill:var(--tx)">' +
           esc(fmtTick(total)) + "</text>";
    svg += '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" style="font-size:11px;fill:var(--tx-3)">' +
           esc(d.unit || "total") + "</text>";

    const lg = '<div class="chart-legend">' + d.labels.map(function(l, i){
      const pct = Math.round((values[i] / total) * 100);
      return '<span class="lg"><span class="sw" style="background:' + colorAt(i) + '"></span>' +
             esc(l) + ' <span style="color:var(--tx-3)">' + fmtNum(values[i]) + " · " + pct + "%</span></span>";
    }).join("") + "</div>";

    return { svg: svg, legend: lg, height: size, viewBox: "0 0 300 " + size };
  }

  /* ---------------- entry point ---------------- */
  function render(spec){
    const d = normalise(spec || {});
    if(!d.series.length) return '<div class="panel-empty"><p>No chart data was supplied.</p></div>';

    const kind = String(spec.chart || spec.kind || "bar").toLowerCase();
    let inner = "", viewBox = "0 0 " + W + " " + H, lg = legend(d.series);

    if(kind === "donut" || kind === "doughnut" || kind === "pie"){
      const out = donut(d);
      inner = out.svg; viewBox = out.viewBox; lg = out.legend;
    }else if(kind === "hbar" || kind === "horizontal" || kind === "ranking"){
      const out = hbar(d);
      inner = out.svg; viewBox = "0 0 " + W + " " + out.height;
    }else if(kind === "line" || kind === "area" || kind === "trend"){
      inner = line(d);
    }else if(kind === "stacked"){
      inner = bar(d, true);
    }else{
      inner = bar(d, false);
    }

    return '<div class="chart">' +
      (spec.title ? '<div class="chart-t">' + esc(spec.title) + "</div>" : "") +
      (spec.subtitle ? '<div class="chart-s">' + esc(spec.subtitle) + "</div>" : "") +
      '<svg viewBox="' + viewBox + '" preserveAspectRatio="xMidYMid meet" role="img">' + inner + "</svg>" +
      lg +
      (spec.note ? '<div class="art-note">' + MD.inline(spec.note) + "</div>" : "") +
      "</div>";
  }

  return { render: render, colorAt: colorAt };
})();
