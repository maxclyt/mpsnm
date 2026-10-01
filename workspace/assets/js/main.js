(function () {
  "use strict";

  /* -----------------------------------------------------------------
     CONFIGURACAO DE CHECKOUT
     Substitua "#" pelos links reais de pagamento de cada plano.
     ----------------------------------------------------------------- */
  var CHECKOUT_LINKS = {
    basico: "#",
    completo: "#"
  };

  var LEGAL_LINKS = {
    termos: "#",
    privacidade: "#",
    contato: "#"
  };

  /* -----------------------------------------------------------------
     UPSELL (modal ao clicar no Plano Básico)
     Altere apenas specialPrice. O percentual de desconto e o texto do
     botao sao calculados automaticamente a partir de regularPrice.
     ----------------------------------------------------------------- */
  var UPSELL = {
    regularPrice: 25,
    specialPrice: 23
  };

  /* Contagem regressiva: data real do ENEM (mes 0-indexado, 10 = novembro). */
  var ENEM_DATE = new Date(2026, 10, 8, 0, 0, 0);

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var siblings = Array.prototype.slice.call(
            el.parentElement ? el.parentElement.children : []
          ).filter(function (n) { return n.classList && n.classList.contains("reveal"); });
          var index = siblings.indexOf(el);
          var delay = index > 0 ? Math.min(index * 70, 280) : 0;
          setTimeout(function () { el.classList.add("is-visible"); }, delay);
          revealObserver.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Topbar state ---------- */
  var topbar = document.getElementById("topbar");
  function onScrollTopbar() {
    if (!topbar) return;
    topbar.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  onScrollTopbar();

  /* ---------- Mobile fixed CTA ---------- */
  var mobileCta = document.getElementById("mobileCta");
  var hero = document.getElementById("hero");
  function onScrollMobileCta() {
    if (!mobileCta || !hero) return;
    var trigger = hero.offsetTop + hero.offsetHeight * 0.6;
    mobileCta.classList.toggle("is-visible", window.scrollY > trigger);
  }
  onScrollMobileCta();

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScrollTopbar();
      onScrollMobileCta();
      ticking = false;
    });
  }, { passive: true });

  /* ---------- Checkout / legal links ---------- */
  document.querySelectorAll("[data-checkout]").forEach(function (btn) {
    var key = btn.getAttribute("data-checkout");
    var url = CHECKOUT_LINKS[key] || "#";
    btn.setAttribute("href", url);
    btn.addEventListener("click", function (event) {
      if (key === "basico") {
        event.preventDefault();
        openUpsell();
        return;
      }
      if (!url || url === "#") {
        event.preventDefault();
        flash(btn, "Configure o link de checkout do plano " + key + ".");
      }
    });
  });

  document.querySelectorAll("[data-legal]").forEach(function (link) {
    var key = link.getAttribute("data-legal");
    var url = LEGAL_LINKS[key] || "#";
    link.setAttribute("href", url);
    if (!url || url === "#") {
      link.addEventListener("click", function (event) { event.preventDefault(); });
    }
  });

  /* ---------- Feature cards glow follows cursor ---------- */
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".feature").forEach(function (card) {
      card.addEventListener("mousemove", function (event) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (event.clientX - rect.left) + "px");
        card.style.setProperty("--my", (event.clientY - rect.top) + "px");
      });
    });
  }

  /* ---------- FAQ: fecha os outros ao abrir um ---------- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq__item"));
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- Helper: aviso discreto (sem pop-up) ---------- */
  function flash(anchor, message) {
    var existing = document.getElementById("inlineNotice");
    if (existing) existing.parentNode.removeChild(existing);

    var note = document.createElement("span");
    note.id = "inlineNotice";
    note.textContent = message;
    note.setAttribute("role", "status");
    note.style.cssText = [
      "position:fixed",
      "left:50%",
      "bottom:96px",
      "transform:translateX(-50%)",
      "z-index:80",
      "max-width:90vw",
      "padding:10px 16px",
      "border-radius:999px",
      "font-size:0.78rem",
      "color:#F4F7F5",
      "background:rgba(8,18,13,0.95)",
      "border:1px solid rgba(255,255,255,0.12)",
      "box-shadow:0 20px 50px -24px rgba(0,0,0,0.9)",
      "opacity:0",
      "transition:opacity .25s ease"
    ].join(";");

    document.body.appendChild(note);
    window.requestAnimationFrame(function () { note.style.opacity = "1"; });
    setTimeout(function () {
      note.style.opacity = "0";
      setTimeout(function () {
        if (note.parentNode) note.parentNode.removeChild(note);
      }, 280);
    }, 2600);
  }

  /* ---------- Ano dinamico no rodape (fallback estatico) ---------- */
  var yearSlots = document.querySelectorAll("[data-year]");
  yearSlots.forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* =================================================================
     UPSELL — modal exibido ao clicar no Plano Básico
     ================================================================= */
  var upsellEl = document.getElementById("upsell");
  var upsellOpen = false;
  var upsellLastFocus = null;

  function checkoutUrl(key) {
    return CHECKOUT_LINKS[key] || "#";
  }

  function goToCheckout(key) {
    var url = checkoutUrl(key);
    if (!url || url === "#") {
      flash(document.body, "Configure o link de checkout do plano " + key + ".");
      return;
    }
    window.location.href = url;
  }

  function openUpsell() {
    if (!upsellEl || upsellOpen) return;
    upsellLastFocus = document.activeElement;
    upsellEl.hidden = false;
    document.body.classList.add("upsell-lock");
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { upsellEl.classList.add("is-open"); });
    });
    upsellOpen = true;
    var accept = document.getElementById("upsellAccept");
    if (accept) accept.focus({ preventScroll: true });
  }

  function closeUpsell() {
    if (!upsellEl || !upsellOpen) return;
    upsellEl.classList.remove("is-open");
    document.body.classList.remove("upsell-lock");
    upsellOpen = false;
    setTimeout(function () {
      if (!upsellOpen) upsellEl.hidden = true;
    }, 380);
    if (upsellLastFocus && upsellLastFocus.focus) {
      upsellLastFocus.focus({ preventScroll: true });
    }
  }

  function setupUpsell() {
    if (!upsellEl) return;

    var regular = Number(UPSELL.regularPrice) || 0;
    var special = Number(UPSELL.specialPrice) || 0;
    var discount = regular > 0 && special < regular
      ? Math.round((1 - special / regular) * 100)
      : 0;

    upsellEl.querySelectorAll("[data-upsell-regular]").forEach(function (el) {
      el.textContent = String(regular);
    });
    upsellEl.querySelectorAll("[data-upsell-special]").forEach(function (el) {
      el.textContent = String(special);
    });

    var discountEl = upsellEl.querySelector("[data-upsell-discount]");
    if (discountEl) {
      if (discount > 0) {
        discountEl.textContent = "-" + discount + "%";
        discountEl.hidden = false;
      } else {
        discountEl.hidden = true;
      }
    }

    var accept = document.getElementById("upsellAccept");
    if (accept) {
      accept.textContent = "SIM, QUERO O COMPLETO POR R$" + special + "! →";
      accept.addEventListener("click", function (event) {
        event.preventDefault();
        goToCheckout("completo");
      });
    }

    var decline = document.getElementById("upsellDecline");
    if (decline) {
      decline.addEventListener("click", function () {
        closeUpsell();
        setTimeout(function () { goToCheckout("basico"); }, 220);
      });
    }

    upsellEl.querySelectorAll("[data-upsell-close]").forEach(function (el) {
      el.addEventListener("click", closeUpsell);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && upsellOpen) closeUpsell();
    });
  }
  setupUpsell();

  /* =================================================================
     CONTAGEM REGRESSIVA — tempo real ate o ENEM
     ================================================================= */
  function setupCountdown() {
    var grid = document.getElementById("enemCountdown");
    var done = document.getElementById("enemCountdownDone");
    if (!grid) return;

    var cells = {
      days: grid.querySelector('[data-countdown="days"]'),
      hours: grid.querySelector('[data-countdown="hours"]'),
      minutes: grid.querySelector('[data-countdown="minutes"]'),
      seconds: grid.querySelector('[data-countdown="seconds"]')
    };

    function pad(n) { return (n < 10 ? "0" : "") + n; }

    function tick() {
      var diff = ENEM_DATE.getTime() - Date.now();
      if (diff <= 0) {
        grid.hidden = true;
        if (done) done.hidden = false;
        return false;
      }
      var totalSec = Math.floor(diff / 1000);
      if (cells.days) cells.days.textContent = pad(Math.floor(totalSec / 86400));
      if (cells.hours) cells.hours.textContent = pad(Math.floor((totalSec % 86400) / 3600));
      if (cells.minutes) cells.minutes.textContent = pad(Math.floor((totalSec % 3600) / 60));
      if (cells.seconds) cells.seconds.textContent = pad(totalSec % 60);
      return true;
    }

    if (!tick()) return;
    setInterval(tick, 1000);
  }
  setupCountdown();

  /* =================================================================
     CARROSSEIS AUTOMATICOS
     ================================================================= */
  function initCarousels() {
    document.querySelectorAll("[data-carousel]").forEach(function (root) {
      var track = root.querySelector(".carousel__track");
      var slides = Array.prototype.slice.call(root.querySelectorAll(".carousel__slide"));
      if (!track || slides.length < 2) return;

      var dotsWrap = root.querySelector(".carousel__dots");
      var prevBtn = root.querySelector(".carousel__arrow--prev");
      var nextBtn = root.querySelector(".carousel__arrow--next");
      var viewport = root.querySelector(".carousel__viewport") || root;
      var interval = parseInt(root.getAttribute("data-interval"), 10) || 3000;
      var realCount = slides.length;
      var index = 0;
      var pos = 1;
      var timer = null;
      var paused = false;
      var resumeTimer = null;

      var firstClone = slides[0].cloneNode(true);
      var lastClone = slides[realCount - 1].cloneNode(true);
      firstClone.setAttribute("aria-hidden", "true");
      lastClone.setAttribute("aria-hidden", "true");
      track.appendChild(firstClone);
      track.insertBefore(lastClone, slides[0]);

      function applyTransform(animate) {
        if (!animate) track.style.transition = "none";
        else track.style.transition = "";
        track.style.transform = "translateX(" + (-pos * 100) + "%)";
        if (!animate) { void track.offsetWidth; }
      }

      function setActiveDot(i) {
        if (!dotsWrap) return;
        Array.prototype.forEach.call(dotsWrap.children, function (dot, di) {
          dot.classList.toggle("is-active", di === i);
          dot.setAttribute("aria-selected", di === i ? "true" : "false");
        });
      }

      function goTo(realIndex, animate) {
        pos = realIndex + 1;
        applyTransform(animate !== false);
        index = ((realIndex % realCount) + realCount) % realCount;
        setActiveDot(index);
      }

      function next() { goTo(index + 1, true); }
      function prev() { goTo(index - 1, true); }

      if (dotsWrap) {
        slides.forEach(function (_, i) {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className = "carousel__dot";
          dot.setAttribute("role", "tab");
          dot.setAttribute("aria-label", "Ir para o item " + (i + 1));
          dot.addEventListener("click", function () { userGoTo(i); });
          dotsWrap.appendChild(dot);
        });
      }

      track.addEventListener("transitionend", function (event) {
        if (event.target !== track) return;
        if (pos === 0) { pos = realCount; applyTransform(false); }
        else if (pos === realCount + 1) { pos = 1; applyTransform(false); }
      });

      function pause() { paused = true; }
      function resumeLater(delay) {
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function () { paused = false; }, delay);
      }
      function userGoTo(i) { goTo(i, true); pause(); resumeLater(6000); }

      if (prevBtn) prevBtn.addEventListener("click", function () { prev(); pause(); resumeLater(6000); });
      if (nextBtn) nextBtn.addEventListener("click", function () { next(); pause(); resumeLater(6000); });

      if (window.matchMedia("(hover: hover)").matches) {
        root.addEventListener("mouseenter", function () { paused = true; clearTimeout(resumeTimer); });
        root.addEventListener("mouseleave", function () { paused = false; });
      }

      root.addEventListener("focusin", function () { pause(); });
      root.addEventListener("focusout", function () { resumeLater(6000); });
      root.addEventListener("touchstart", function () { pause(); resumeLater(6000); }, { passive: true });

      var startX = 0;
      var startY = 0;
      var dragging = false;
      viewport.addEventListener("touchstart", function (event) {
        if (event.touches.length !== 1) return;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        dragging = true;
      }, { passive: true });
      viewport.addEventListener("touchend", function (event) {
        if (!dragging) return;
        dragging = false;
        var touch = event.changedTouches[0];
        var dx = touch.clientX - startX;
        var dy = touch.clientY - startY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) next(); else prev();
          pause();
          resumeLater(6000);
        }
      }, { passive: true });

      goTo(0, false);
      setActiveDot(0);

      if (!reduceMotion) {
        timer = setInterval(function () {
          if (!paused && !document.hidden) next();
        }, interval);
      }
    });
  }
  initCarousels();
})();
