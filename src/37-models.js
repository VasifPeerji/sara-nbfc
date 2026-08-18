/* ------------------------------------------------------------------
   Model picker.

   Two columns: providers on the left, that provider's models on the right.
   The search box spans both, so typing "claude" finds Anthropic's models
   without first selecting Anthropic.

   Each provider carries its own key, its own optional base URL override and
   its own expiry, set through the key dialog. Nothing here assumes OpenAI.
   ------------------------------------------------------------------ */

const Models = (function(){

  let activeProvider = null;   /* which provider's models are showing */
  let query = "";
  let keyProvider = null;      /* provider whose key dialog is open */

  const EXPIRY_OPTIONS = [
    { h: 0,    label: "Never expires",     note: "Your key will never expire" },
    { h: 12,   label: "Expires in 12 hours", note: "Your key will be discarded after 12 hours" },
    { h: 24,   label: "Expires in 1 day",  note: "Your key will be discarded after 1 day" },
    { h: 168,  label: "Expires in 7 days", note: "Your key will be discarded after 7 days" },
    { h: 720,  label: "Expires in 30 days", note: "Your key will be discarded after 30 days" },
  ];

  function monogram(name){
    const clean = String(name).replace(/[^A-Za-z0-9 .]/g, "");
    const parts = clean.split(/[\s.]+/).filter(Boolean);
    if(parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  }

  /* Several official marks are near-black (Anthropic, xAI, GitHub) or very
     light (Huggingface yellow). Drawn in their own colour they vanish into
     one theme or the other, so a mark that cannot carry itself against the
     current background falls back to the text colour. */
  function logoInk(hex){
    const { r, g, b } = hexToRgb(hex);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    /* the resolved theme, not the preference: "system" is neither */
    if(resolvedTheme() === "light") return lum > 0.82 ? "var(--tx)" : hex;
    return lum < 0.30 ? "var(--tx)" : hex;
  }

  /* Official mark where one exists, coloured monogram tile otherwise. */
  function logoTile(p, cls){
    const svg = providerLogoSvg(p.id, logoInk(providerBrandHex(p.id) || p.colour));
    if(svg) return '<span class="mp-logo brand' + (cls ? " " + cls : "") + '">' + svg + "</span>";
    return '<span class="mp-logo' + (cls ? " " + cls : "") + '" style="background:' + p.colour + '">' +
           esc(monogram(p.name)) + "</span>";
  }

  function modelsOf(p){
    const extra = Store.get("customModels", {}) || {};
    const own = (extra[p.id] || []);
    return own.concat((p.models || []).filter(function(m){ return own.indexOf(m) === -1; }));
  }
  function addCustomModel(providerId, modelId){
    const extra = Store.get("customModels", {}) || {};
    extra[providerId] = extra[providerId] || [];
    if(extra[providerId].indexOf(modelId) === -1) extra[providerId].unshift(modelId);
    Store.set("customModels", extra);
  }

  const refOf = function(pid, mid){ return pid + ":" + mid; };
  function isPinned(pid, mid){ return S.pinnedModels.indexOf(refOf(pid, mid)) !== -1; }
  function togglePin(pid, mid){
    const ref = refOf(pid, mid);
    const at = S.pinnedModels.indexOf(ref);
    if(at === -1) S.pinnedModels.push(ref); else S.pinnedModels.splice(at, 1);
    savePrefs();
    render();
  }

  /* ---------------- open / close ---------------- */
  function open(){
    activeProvider = activeProvider || S.provider;
    query = "";
    el("ovModel").classList.add("open");
    render();
    const input = el("mpSearch");
    if(input){ input.value = ""; setTimeout(function(){ input.focus(); }, 60); }
  }
  function close(){ el("ovModel").classList.remove("open"); }

  function search(v){ query = String(v || "").trim(); render(); }

  /* ---------------- render ---------------- */
  function providerRow(p){
    const hasKey = !!Keys.get(p.id);
    const isOn = activeProvider === p.id;
    const isLive = S.provider === p.id;
    return '<button class="mp-p' + (isOn ? " on" : "") + '" onclick="Models.pick(\'' + escJs(p.id) + '\')">' +
      logoTile(p) +
      '<span class="mp-p-name">' + esc(p.name) + "</span>" +
      (isLive ? '<span class="mp-live" title="Current provider"></span>' : "") +
      (hasKey ? "" : '<span class="mp-nokey" title="No key set">' + Icons.el("key") + "</span>") +
      '<span class="mp-gear" role="button" tabindex="0" title="Set API key" ' +
        'onclick="event.stopPropagation();Models.keyDialog(\'' + escJs(p.id) + '\')">' + Icons.el("settings") + "</span>" +
      '<span class="i mp-chev">' + Icons.svg("chevright") + "</span>" +
    "</button>";
  }

  function modelRow(pid, mid){
    const current = S.provider === pid && S.model === mid;
    const pinned = isPinned(pid, mid);
    return '<div class="mp-m' + (current ? " on" : "") + '" role="button" tabindex="0"' +
      ' onclick="Models.use(\'' + escJs(pid) + "','" + escJs(mid) + '\')">' +
      '<span class="mp-m-name">' + esc(mid) + "</span>" +
      (current ? '<span class="i mp-tick">' + Icons.svg("check") + "</span>" : "") +
      '<button class="mp-pin' + (pinned ? " on" : "") + '" title="' + (pinned ? "Unpin" : "Pin to the top") +
        '" onclick="event.stopPropagation();Models.togglePin(\'' + escJs(pid) + "','" + escJs(mid) + '\')">' +
        Icons.el("pin") + "</button>" +
    "</div>";
  }

  function render(){
    const left = el("mpProviders"), right = el("mpModels");
    if(!left) return;

    /* ---- searching: flatten models across every provider ---- */
    if(query){
      const q = query.toLowerCase();
      const hits = [];
      PROVIDERS.forEach(function(p){
        modelsOf(p).forEach(function(m){
          if((m + " " + p.name).toLowerCase().indexOf(q) !== -1) hits.push({ p: p, m: m });
        });
      });
      const provs = PROVIDERS.filter(function(p){ return p.name.toLowerCase().indexOf(q) !== -1; });

      left.innerHTML =
        (hits.length ? '<div class="mp-grp">Models</div>' + hits.slice(0, 40).map(function(h){
          return '<div class="mp-m" role="button" tabindex="0" onclick="Models.use(\'' + escJs(h.p.id) + "','" + escJs(h.m) + '\')">' +
            logoTile(h.p, "sm") +
            '<span class="mp-m-name">' + esc(h.m) + '</span><span class="mp-m-prov">' + esc(h.p.name) + "</span></div>";
        }).join("") : "") +
        (provs.length ? '<div class="mp-grp">Providers</div>' + provs.map(providerRow).join("") : "") +
        (!hits.length && !provs.length
          ? '<div class="mp-blank">Nothing matches “' + esc(query) + '”.<br>' +
            'Press Enter to use it as a model id on ' + esc((PROVIDER_BY_ID[activeProvider] || PROVIDERS[0]).name) + ".</div>"
          : "");
      right.innerHTML = "";
      right.classList.add("empty");
      Icons.hydrate(left);
      return;
    }

    /* ---- normal: pinned, then providers ---- */
    const pins = S.pinnedModels.map(function(ref){
      const i = ref.indexOf(":");
      const p = PROVIDER_BY_ID[ref.slice(0, i)];
      return p ? { p: p, m: ref.slice(i + 1) } : null;
    }).filter(Boolean);

    left.innerHTML =
      (pins.length ? '<div class="mp-grp">Pinned</div>' + pins.map(function(h){
        const current = S.provider === h.p.id && S.model === h.m;
        return '<div class="mp-m' + (current ? " on" : "") + '" role="button" tabindex="0" onclick="Models.use(\'' + escJs(h.p.id) + "','" + escJs(h.m) + '\')">' +
          logoTile(h.p, "sm") +
          '<span class="mp-m-name">' + esc(h.m) + "</span>" +
          '<button class="mp-pin on" title="Unpin" onclick="event.stopPropagation();Models.togglePin(\'' + escJs(h.p.id) + "','" + escJs(h.m) + '\')">' +
          Icons.el("pin") + "</button></div>";
      }).join("") : "") +
      '<div class="mp-grp">Providers</div>' + PROVIDERS.map(providerRow).join("");

    const p = PROVIDER_BY_ID[activeProvider] || PROVIDERS[0];
    const list = modelsOf(p);
    right.classList.remove("empty");
    right.innerHTML =
      '<div class="mp-head">' +
        logoTile(p) +
        '<span class="mn"><span class="tt">' + esc(p.name) + "</span>" +
        '<span class="ss">' + esc(CORS_NOTE[p.cors] || "") + "</span></span>" +
      "</div>" +
      '<div class="mp-sub">' +
        (Keys.get(p.id)
          ? '<span class="chip chip-ok">' + Icons.el("check") + "Key set</span>"
          : '<span class="chip chip-warn">' + Icons.el("key") + "No key</span>") +
        '<button class="btn btn-sm" onclick="Models.keyDialog(\'' + escJs(p.id) + '\')">Set key</button>' +
        '<button class="btn btn-sm" onclick="Models.testProvider(\'' + escJs(p.id) + '\')">Test</button>' +
      "</div>" +
      '<div class="mp-mlist">' + list.map(function(m){ return modelRow(p.id, m); }).join("") + "</div>" +
      '<div class="mp-custom">' +
        '<input class="inp" id="mpCustom" placeholder="Or type a model id…" autocomplete="off" spellcheck="false"' +
        ' onkeydown="if(event.key===\'Enter\'){event.preventDefault();Models.useCustom(\'' + escJs(p.id) + '\')}">' +
        '<button class="btn btn-sm" onclick="Models.useCustom(\'' + escJs(p.id) + '\')">Use</button>' +
      "</div>";

    Icons.hydrate(left);
    Icons.hydrate(right);
  }

  function pick(pid){ activeProvider = pid; render(); }

  function use(pid, mid){
    S.provider = pid;
    S.model = mid;
    savePrefs();
    Settings.applyModelChip();
    close();
    if(!Keys.get(pid)){
      toast("Switched to " + (PROVIDER_BY_ID[pid] || {}).name + " · " + mid + ". Set a key to use it.", "warn", 5000);
      keyDialog(pid);
    }else{
      toast("Now using " + mid + " on " + (PROVIDER_BY_ID[pid] || {}).name, "ok");
    }
  }
  function useCustom(pid){
    const input = el("mpCustom");
    const mid = (input && input.value || "").trim();
    if(!mid) return;
    addCustomModel(pid, mid);
    use(pid, mid);
  }

  /* Enter in the search box with no match uses the text as a model id. */
  function searchKey(e){
    if(e.key !== "Enter") return;
    e.preventDefault();
    const q = (el("mpSearch").value || "").trim();
    if(!q) return;
    const p = PROVIDER_BY_ID[activeProvider] || PROVIDERS[0];
    addCustomModel(p.id, q);
    use(p.id, q);
  }

  /* ---------------- key dialog ---------------- */
  function keyDialog(pid){
    keyProvider = pid;
    const p = PROVIDER_BY_ID[pid];
    if(!p) return;
    const meta = Keys.meta(pid) || {};
    const base = Keys.base(pid);

    el("keyTitle").textContent = "Set API Key for " + p.name;
    el("keyLabel").textContent = p.name + " API Key";
    el("keyInput").value = Keys.get(pid) || "";
    el("keyInput").placeholder = "Enter value for " + p.name + " API Key";
    el("keyBase").value = base;
    el("keyBaseDefault").textContent = p.base || "—";

    const sel = el("keyExpiry");
    sel.innerHTML = EXPIRY_OPTIONS.map(function(o){
      return '<option value="' + o.h + '">' + esc(o.label) + "</option>";
    }).join("");
    /* reflect the stored expiry if there is one */
    sel.value = meta.exp ? String(nearestTtl(meta.exp)) : "0";
    updateExpiryNote();

    el("keyDeployWrap").style.display = p.needsDeployment ? "" : "none";
    if(p.needsDeployment) el("keyDeploy").value = Store.get("azureDeployment", "") || "";

    el("keyState").className = "key-state";
    el("keyState").textContent = CORS_NOTE[p.cors] || "";

    Modals.show("ovKey");
    setTimeout(function(){ el("keyInput").focus(); }, 60);
  }
  function nearestTtl(exp){
    const hoursLeft = (exp - Date.now()) / 3600000;
    let best = EXPIRY_OPTIONS[1];
    EXPIRY_OPTIONS.forEach(function(o){
      if(o.h && Math.abs(o.h - hoursLeft) < Math.abs(best.h - hoursLeft)) best = o;
    });
    return best.h;
  }
  function updateExpiryNote(){
    const h = +el("keyExpiry").value;
    const opt = EXPIRY_OPTIONS.find(function(o){ return o.h === h; }) || EXPIRY_OPTIONS[0];
    el("keyNote").textContent = opt.note;
    el("keyNote").classList.toggle("warn", h === 0);
  }

  function submitKey(){
    if(!keyProvider) return;
    const p = PROVIDER_BY_ID[keyProvider];
    const value = (el("keyInput").value || "").trim();
    const ttl = +el("keyExpiry").value;
    Keys.setBase(keyProvider, el("keyBase").value);
    if(p.needsDeployment) Store.set("azureDeployment", (el("keyDeploy").value || "").trim());
    if(!value){
      el("keyState").className = "key-state err";
      el("keyState").innerHTML = Icons.el("alert") + "Enter a key, or press Revoke to remove the stored one.";
      Icons.hydrate(el("keyState"));
      return;
    }
    Keys.set(keyProvider, value, ttl);
    Modals.close("ovKey");
    render();
    Settings.applyModelChip();
    toast("Key saved for " + p.name + (ttl ? ", expiring in " + ttl + "h" : ""), "ok");
  }
  function revokeKey(){
    if(!keyProvider) return;
    const p = PROVIDER_BY_ID[keyProvider];
    Keys.revoke(keyProvider);
    el("keyInput").value = "";
    render();
    Settings.applyModelChip();
    toast("Key revoked for " + p.name, "info");
  }

  async function testProvider(pid, fromDialog){
    const p = PROVIDER_BY_ID[pid];
    const stateEl = fromDialog ? el("keyState") : null;
    if(fromDialog){
      /* test what is currently typed, not only what is saved */
      const typed = (el("keyInput").value || "").trim();
      Keys.setBase(pid, el("keyBase").value);
      if(typed) Keys.set(pid, typed, +el("keyExpiry").value);
      if(p.needsDeployment) Store.set("azureDeployment", (el("keyDeploy").value || "").trim());
    }
    if(!Keys.get(pid)){
      if(stateEl){ stateEl.className = "key-state err"; stateEl.textContent = "Enter a key first."; }
      else toast("Set a key for " + p.name + " first", "warn");
      return;
    }
    const model = (S.provider === pid ? S.model : modelsOf(p)[0]);
    if(stateEl){
      stateEl.className = "key-state busy";
      stateEl.innerHTML = Icons.el("refresh", "spin") + "Contacting " + esc(p.name) + "…";
      Icons.hydrate(stateEl);
    }else{
      toast("Testing " + p.name + "…", "info", 1800);
    }
    try{
      const r = await LLM.test(pid, model);
      const msg = p.name + " responded in " + r.ms + " ms using " + model + ".";
      if(stateEl){ stateEl.className = "key-state ok"; stateEl.innerHTML = Icons.el("check") + esc(msg); Icons.hydrate(stateEl); }
      else toast(msg, "ok", 4200);
    }catch(err){
      const msg = err.message || "Connection failed.";
      if(stateEl){ stateEl.className = "key-state err"; stateEl.innerHTML = Icons.el("alert") + esc(msg); Icons.hydrate(stateEl); }
      else toast(msg, "err", 6000);
    }
  }

  return {
    open: open, close: close, search: search, searchKey: searchKey,
    pick: pick, use: use, useCustom: useCustom, togglePin: togglePin,
    keyDialog: keyDialog, submitKey: submitKey, revokeKey: revokeKey,
    updateExpiryNote: updateExpiryNote, testProvider: testProvider,
    testDialog: function(){ if(keyProvider) testProvider(keyProvider, true); },
    modelsOf: modelsOf, monogram: monogram, logoTile: logoTile, logoInk: logoInk,
  };
})();
