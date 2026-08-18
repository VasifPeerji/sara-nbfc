/* ------------------------------------------------------------------
   Sign-in and role switching.

   Roles are not decoration: the selected profile decides which documents
   retrieval is even allowed to see, what the assistant is told about the
   person, and which starter questions are offered.
   ------------------------------------------------------------------ */

const Login = (function(){

  function renderBrand(){
    const c = Config;
    el("lbMark").innerHTML = brandMark();
    el("lbMark").classList.toggle("has-logo", hasBrandLogo());
    el("lbName").textContent = c.product.name;
    el("lbVer").textContent = [c.product.version, c.product.vendor ? "by " + c.product.vendor : ""].filter(Boolean).join(" · ");

    const head = c.login.headline || (c.company.name + "'s own knowledge, on demand.");
    /* the last word carries the accent, which reads as designed rather than random */
    const words = String(head).trim().split(/\s+/);
    const tail = words.length > 2 ? words.pop() : "";
    el("lbHead").innerHTML = esc(words.join(" ")) + (tail ? " <em>" + esc(tail) + "</em>" : "");

    el("lbSub").textContent = c.login.sub ||
      ("Ask in plain language. Every answer is drawn from " + c.company.name +
       "'s documented knowledge and shows you exactly which document it came from.");

    el("lbFacts").innerHTML = (c.company.facts || []).slice(0, 4).map(function(f){
      return '<div class="lb-fact"><div class="v">' + esc(f.v) + '</div><div class="l">' + esc(f.l) + "</div></div>";
    }).join("");

    el("lbFoot").textContent = c.login.footer ||
      (Config.stats.docs + " documents indexed across " + Config.stats.systems + " connected systems");

    el("loginNote").textContent = c.login.note ||
      "Each profile sees a different slice of the knowledge base. Questions outside your clearance are declined and routed to the owner, rather than answered vaguely.";

    const told = Analytics.disclosure();
    el("loginLegal").textContent = told
      ? (c.login.legal ? c.login.legal + " " + told : told)
      : c.login.legal ||
      (c.product.name + " is an internal system. Conversations are retained for enterprise compliance.");

    document.title = c.product.name + " · " + c.company.name;

    /* The rail tooltip names the system the Operator drives, which is
       the edition's business and not the shell's. Hardcoding a vendor
       here is how a previous build shipped another customer's product
       name in a tooltip. */
    document.querySelectorAll("[data-tip-system]").forEach(function(el){
      el.setAttribute("data-tip", "Operator — drive " + (c.operatorSystem || "the system"));
    });
  }

  function renderRoles(filter){
    const q = String(filter || "").trim().toLowerCase();
    const list = Config.users.filter(function(u){
      if(!q) return true;
      const role = Config.roleByKey[u.roleKey] || {};
      return (u.name + " " + u.title + " " + (role.dept || "") + " " + (role.title || "")).toLowerCase().indexOf(q) !== -1;
    });

    const wrap = el("loginRoles");
    if(!list.length){
      wrap.innerHTML = '<div class="side-empty">No profile matches that search.</div>';
      return;
    }
    wrap.innerHTML = list.map(function(u){
      const role = Config.roleByKey[u.roleKey] || {};
      const cl = CLEARANCE[role.clearance] || CLEARANCE[1];
      return '<button class="lr" onclick="Login.signIn(\'' + escJs(u.email) + '\')">' +
        '<span class="av av-lg" style="background:' + rgba(u.avatarColor, 0.18) + ";color:" + u.avatarColor + '">' + esc(u.av) + "</span>" +
        '<span class="mn"><span class="nm">' + esc(u.name) + "</span>" +
        '<span class="rl">' + esc(u.title) + (role.dept ? " · " + esc(role.dept) : "") + "</span></span>" +
        '<span class="tier" data-t="' + role.clearance + '">' + esc(cl.label) + "</span>" +
        '<span class="i go">' + Icons.svg("chevright") + "</span></button>";
    }).join("");
  }

  function show(){
    document.body.classList.add("logged-out");
    renderBrand();
    renderRoles("");
    const f = el("loginFilter");
    if(f){ f.value = ""; setTimeout(function(){ f.focus(); }, 60); }
  }

  function signIn(email){
    /* The one check that holds even if the card has been removed from the
       page: no identity, no sign-in. This also covers restoreSession() on
       a reload, which previously signed the last person straight back in
       and produced a visitor with a role and no identity. */
    if(typeof Analytics !== "undefined" && Analytics.blocked && Analytics.blocked()){
      Analytics.gate();
      return;
    }
    const user = Config.users.find(function(u){ return u.email === email; }) || Config.users[0];
    if(!user){ toast("This edition has no user profiles configured", "err"); return; }

    S.user = user;
    S.role = Config.roleByKey[user.roleKey] || Config.roles[0];
    Analytics.track("signin", { role: S.role.title });
    Store.set("lastUser", user.email);

    document.body.classList.remove("logged-out");

    Sidebar.restore();
    S.currentId = null;
    S.bookmarkFilter = null;
    S.view = "chats";

    applyChrome();
    Library.init();          /* bookmarks and pinned files are per profile */
    Sidebar.render();
    Chat.init();
    Palette.build();

    setTimeout(function(){
      const input = el("composerIn");
      if(input) input.focus();
    }, 120);
  }

  /* Chrome that depends on who is signed in. */
  function applyChrome(){
    const role = currentRole();
    const cl = CLEARANCE[role.clearance] || CLEARANCE[1];

    /* The clearance badge is deliberately not in the header. It still shows on
       the sign-in screen, in the account menu, on the welcome screen and in
       every retrieval trace, which is where it carries meaning. */
    void cl;

    const side = el("side");
    if(side) side.setAttribute("data-view", S.view);
    document.getElementById("app").setAttribute("data-side", S.view);
    const sideOff = document.getElementById("app").classList.contains("side-off");
    $$(".rail-btn[data-view]").forEach(function(b){
      b.classList.toggle("on", !sideOff && b.getAttribute("data-view") === S.view);
    });

    const input = el("composerIn");
    if(input) input.placeholder = "Message " + (Config.assistant.name || Config.product.name);

    const foot = el("footnote");
    if(foot){
      foot.innerHTML = esc(Config.product.disclaimer ||
        (Config.assistant.name || Config.product.name) +
        " answers from " + Config.company.name + "'s knowledge base and can make mistakes. Check anything consequential against the source.") +
        '<span class="sep">|</span><a href="#" onclick="Modals.openKb();return false">Knowledge base</a>' +
        '<span class="sep">|</span><a href="#" onclick="Modals.openSystems();return false">Connected systems</a>';
    }

    Settings.applyModelChip();
    Sidebar.renderMe();
  }

  function signOut(){
    closeFloaters();
    if(S.streaming) Chat.stop();
    Sidebar.persist();
    Store.del("lastUser");   /* otherwise a refresh would sign straight back in */
    S.user = null; S.role = null;
    S.convos = []; S.currentId = null;
    Panel.reset();
    show();
  }

  function switchRole(email){
    closeFloaters();
    Sidebar.persist();
    signIn(email);
    toast("Signed in as " + (S.user.name) + " — " + S.user.title, "ok", 3600);
  }

  /* A refresh should not throw the person back to the sign-in screen. The last
     profile is restored if it still exists in this edition; if the edition has
     been re-skinned since, the stored email will not match and sign-in shows
     as normal rather than failing. */
  function restoreSession(){
    const last = Store.get("lastUser", "");
    if(!last) return false;
    const user = Config.users.find(function(u){ return u.email === last; });
    if(!user) return false;
    signIn(user.email);
    return true;
  }

  function init(){
    const f = el("loginFilter");
    if(f) f.addEventListener("input", function(){ renderRoles(f.value); });
    if(!restoreSession()){
      show();
    }else{
      /* the sign-in screen still needs its content built for a later sign-out */
      renderBrand();
      renderRoles("");
    }
  }

  return { init: init, show: show, signIn: signIn, signOut: signOut, switchRole: switchRole, applyChrome: applyChrome, renderRoles: renderRoles };
})();
