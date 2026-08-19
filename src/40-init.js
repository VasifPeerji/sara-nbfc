/* ------------------------------------------------------------------
   Boot, global listeners, keyboard shortcuts.
   ------------------------------------------------------------------ */

(function(){

  function bindKeys(){
    document.addEventListener("keydown", function(e){
      const mod = e.ctrlKey || e.metaKey;
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      const typing = tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement && document.activeElement.isContentEditable);

      /* Escape unwinds one layer at a time */
      if(e.key === "Escape"){
        if($(".menu, .pop")){ closeFloaters(); return; }
        if(Modals.anyOpen()){ Modals.closeAll(); Palette.close(); return; }
        if(S.streaming){ Chat.stop(); return; }
        return;
      }

      if(document.body.classList.contains("logged-out")) return;

      if(mod && (e.key === "k" || e.key === "K")){ e.preventDefault(); Palette.open(); return; }
      if(mod && e.shiftKey && (e.key === "o" || e.key === "O")){ e.preventDefault(); Chat.newChat(); return; }
      if(mod && (e.key === "b" || e.key === "B")){ e.preventDefault(); Sidebar.toggle(); return; }
      if(mod && e.key === "\\"){ e.preventDefault(); Panel.toggle(); return; }
      if(mod && (e.key === "m" || e.key === "M")){ e.preventDefault(); Models.open(); return; }
      if(mod && (e.key === "/" )){ e.preventDefault(); el("composerIn").focus(); return; }

      /* bare "/" focuses the composer, the way search boxes behave */
      if(!typing && e.key === "/" && !mod){ e.preventDefault(); el("composerIn").focus(); }
    });
  }

  function bindGlobal(){
    document.addEventListener("click", function(e){
      /* The click that opened a floater is still on its way up to here.
         Closing on it would shut the thing it just opened, which is what
         made the download button look inert. */
      if(floaterJustOpened()) return;
      if(e.target.closest && (e.target.closest(".menu") || e.target.closest(".pop"))) return;
      closeFloaters();
    });
    document.addEventListener("contextmenu", function(e){
      if(!e.target.closest || !e.target.closest(".convo")) return;
      const node = e.target.closest(".convo");
      const btn = node.querySelector(".convo-more");
      if(!btn) return;
      e.preventDefault();
      btn.click();
    });

    window.addEventListener("resize", debounce(function(){
      Panel.syncOverlayScrim();
    }, 120));

    const scrim = el("mobScrim");
    if(scrim) scrim.addEventListener("click", function(){
      document.getElementById("app").classList.add("side-off");
      Panel.close();
    });

    /* Warn before losing an in-flight answer. */
    window.addEventListener("beforeunload", function(e){
      if(!S.streaming) return;
      e.preventDefault();
      e.returnValue = "";
    });

    /* Persist on the way out so nothing is lost on a hard close. */
    window.addEventListener("pagehide", function(){
      if(S.user) Sidebar.persist();
    });
  }

  function boot(){
    loadPrefs();
    applyTheme();
    watchSystemTheme();
    applyBrandLogoStyle();
    document.documentElement.style.setProperty("--panel-w", (S.panelWidth || 440) + "px");

    /* If this file's edition block was swapped for a different organisation,
       the accent will no longer match the logo the build baked in. Re-tint
       from the untinted original that ships alongside it. Asynchronous, but
       the splash is held for seconds, so it lands long before anyone looks. */
    syncBrandLogo().then(function(changed){
      if(changed && document.body.classList.contains("logged-out")) Login.show();
    });

    Icons.hydrate(document);
    /* before the index is built: a file restored from the previous page
       load has to be in the corpus, not added to it a moment later */
    Attachments.init();
    Retrieval.build();
    Analytics.begin();
    Web.syncButton();

    Panel.initResize();
    Panel.paint();
    /* A floating pane must not start open on top of an empty conversation.
       Each pane uses its own breakpoint: the workspace floats from 1024 down,
       the sidebar only from 820 down. */
    if(Panel.isSideOverlay()) document.getElementById("app").classList.add("side-off");
    if(Panel.isPanelOverlay()) Panel.close();
    Panel.syncOverlayScrim();
    /* and again whenever the window changes, because the stylesheet's
       breakpoints keep applying and the pane state has to keep up with
       them. Coalesced into a frame: a drag-resize fires this by the
       hundred and the work is a class toggle either way. */
    Panel.syncBreakpoints();
    let resizeFrame = 0;
    window.addEventListener("resize", function(){
      if(resizeFrame) return;
      resizeFrame = requestAnimationFrame(function(){
        resizeFrame = 0;
        Panel.syncBreakpoints();
      });
    });
    Settings.applyModelChip();

    bindKeys();
    bindGlobal();
    Journeys.init();
    Login.init();

    /* Hold the splash long enough to actually read it. A plain timer, not one
       nested in requestAnimationFrame: rAF never fires in a backgrounded tab,
       which would leave the splash up forever. */
    const bootMs = clamp(parseInt(Config.product.bootMs, 10) || 2400, 0, 6000);
    document.documentElement.style.setProperty("--boot-ms", bootMs + "ms");
    setTimeout(function(){ document.body.classList.remove("booting"); }, bootMs);

    if(CFG_ISSUES.length && typeof console !== "undefined" && console.warn){
      console.warn("[" + Config.product.name + "] edition validation notices:\n - " + CFG_ISSUES.join("\n - "));
    }
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
