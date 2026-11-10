
/* Orawitz Heizung — interactions: nav, reveal, FAQ, tabs, wizard, count-up, forms (client-side only) */
(function () {
  "use strict";

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var navRow = document.querySelector(".header-row2");
  var nav = document.getElementById("main-nav");
  if (toggle && navRow) {
    toggle.addEventListener("click", function () {
      var open = navRow.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "MENÜ ×" : "MENÜ ☰";
    });
    if (nav) {
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) {
          navRow.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.textContent = "MENÜ ☰";
        }
      });
    }
  }

  /* ---------- active nav link ---------- */
  var page = document.body.getAttribute("data-page");
  if (page && nav) {
    nav.querySelectorAll("a").forEach(function (a) {
      if (a.getAttribute("data-nav") === page) a.classList.add("active");
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- count-up (hero rating) ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var dur = 1100, t0 = null;
    var fmt = function (v) {
      return v.toFixed(decimals).replace(".", ",");
    };
    var step = function (ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { requestAnimationFrame(step); cio.disconnect(); }
        });
      }, { threshold: 0.4 });
      cio.observe(el);
    } else { el.textContent = fmt(target); }
  });

  /* ---------- gauge needle sweep ---------- */
  var needle = document.getElementById("gauge-needle");
  if (needle) {
    setTimeout(function () { needle.style.transform = "rotate(38deg)"; }, 250);
  }

  /* ---------- FAQ accordions ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    var panel = item.querySelector(".faq-a");
    if (!btn || !panel) return;
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      var list = item.closest(".faq");
      if (list) {
        list.querySelectorAll(".faq-item.open").forEach(function (other) {
          if (other !== item) {
            other.classList.remove("open");
            other.querySelector(".faq-a").style.maxHeight = null;
            other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
          }
        });
      }
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
      panel.style.maxHeight = !isOpen ? panel.scrollHeight + "px" : null;
    });
  });

  /* ---------- tabs (Sanitär) ---------- */
  var tabsBar = document.querySelector(".tabs-bar");
  if (tabsBar) {
    tabsBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".tab-btn");
      if (!btn) return;
      tabsBar.querySelectorAll(".tab-btn").forEach(function (b) {
        b.classList.remove("active"); b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      var target = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-panel").forEach(function (p) {
        p.classList.toggle("active", p.id === target);
      });
    });
  }

  /* ---------- hero mini-assistant (Startseite) ---------- */
  var gleisBtns = document.querySelectorAll(".gleis button");
  var heroGewerk = document.getElementById("hero-gewerk");
  var heroStart = document.getElementById("hero-start");
  var chosenGleis = null;
  gleisBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      gleisBtns.forEach(function (x) { x.classList.remove("sel"); });
      b.classList.add("sel");
      chosenGleis = b.getAttribute("data-gleis");
    });
  });
  if (heroStart) {
    heroStart.addEventListener("click", function (e) {
      e.preventDefault();
      var q = new URLSearchParams();
      if (chosenGleis) q.set("gleis", chosenGleis);
      if (heroGewerk && heroGewerk.value) q.set("gewerk", heroGewerk.value);
      var plz = document.getElementById("hero-plz");
      if (plz && plz.value.trim()) q.set("plz", plz.value.trim());
      window.location.href = "anfrage.html" + (q.toString() ? "?" + q.toString() : "");
    });
  }

  /* ---------- Anfrage-Assistent wizard ---------- */
  var wizard = document.querySelector(".wizard");
  if (wizard) {
    var steps = Array.prototype.slice.call(wizard.querySelectorAll(".wiz-step"));
    var bars = Array.prototype.slice.call(wizard.querySelectorAll(".wiz-progress span"));
    var current = 0;
    var state = { gleis: null, gewerk: "", gebaeude: "", plz: "02826", ort: "Görlitz" };
    var errBox = wizard.querySelector(".wiz-error");
    var showErr = function (msg) {
      if (!errBox) return;
      errBox.textContent = msg;
      errBox.classList.add("show");
    };
    var hideErr = function () { if (errBox) errBox.classList.remove("show"); };
    var goTo = function (n) {
      current = n;
      steps.forEach(function (s, i) { s.classList.toggle("active", i === n); });
      bars.forEach(function (b, i) {
        b.classList.toggle("done", i < n);
        b.classList.toggle("now", i === n);
      });
      hideErr();
      wizard.scrollIntoView({ behavior: "smooth", block: "start" });
      if (n === 2) fillSummary();
    };
    var markInvalid = function (field, bad) {
      field.classList.toggle("invalid", bad);
      return !bad;
    };
    var validField = function (input) {
      var field = input.closest(".wiz-field");
      if (!field) return true;
      var val = (input.value || "").trim();
      var ok = true;
      if (input.hasAttribute("required") && !val) ok = false;
      if (ok && input.type === "email" && val) ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
      if (ok && input.type === "tel" && val) {
        ok = val.replace(/[\s+()/-]/g, "").length >= 8 && /^[+0-9][0-9\s()+/-]*$/.test(val);
      }
      if (ok && input.tagName === "TEXTAREA" && input.hasAttribute("required")) ok = val.length >= 2;
      if (ok && input.name === "wz-name") ok = val.length >= 2;
      return markInvalid(field, !ok);
    };
    var fillSummary = function () {
      var map = {
        "sum-gleis": state.gleis === "akut" ? "Akuter Ausfall / Störung" : (state.gleis === "geplant" ? "Geplantes Vorhaben" : "—"),
        "sum-gewerk": state.gewerk || "—",
        "sum-gebaeude": state.gebaeude || "—",
        "sum-ort": (state.plz || "") + " " + (state.ort || ""),
        "sum-name": (document.getElementById("wz-name") || {}).value || "—",
        "sum-tel": (document.getElementById("wz-tel") || {}).value || "—",
        "sum-mail": (document.getElementById("wz-mail") || {}).value || "—",
        "sum-termin": (document.getElementById("wz-termin") || {}).value || "Kein Wunschtermin angegeben"
      };
      Object.keys(map).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.textContent = map[id];
      });
    };
    /* step 1 choice buttons */
    wizard.querySelectorAll("[data-wz-gleis]").forEach(function (b) {
      b.addEventListener("click", function () {
        wizard.querySelectorAll("[data-wz-gleis]").forEach(function (x) { x.classList.remove("sel"); });
        b.classList.add("sel");
        state.gleis = b.getAttribute("data-wz-gleis");
        hideErr();
      });
    });
    /* step 2 selects */
    var gw = document.getElementById("wz-gewerk");
    var gb = document.getElementById("wz-gebaeude");
    var pz = document.getElementById("wz-plz");
    var ot = document.getElementById("wz-ort");
    if (gw) gw.addEventListener("change", function () { state.gewerk = gw.value; });
    if (gb) gb.addEventListener("change", function () { state.gebaeude = gb.value; });
    if (pz) pz.addEventListener("input", function () { state.plz = pz.value; });
    if (ot) ot.addEventListener("input", function () { state.ort = ot.value; });
    /* prefill from hero / query string */
    var params = new URLSearchParams(window.location.search);
    var pg = params.get("gleis");
    if (pg) {
      var pre = wizard.querySelector('[data-wz-gleis="' + pg + '"]');
      if (pre) { pre.click(); }
    }
    var pgew = params.get("gewerk");
    if (pgew && gw) { gw.value = pgew; state.gewerk = pgew; }
    var pplz = params.get("plz");
    if (pplz && pz) { pz.value = pplz; state.plz = pplz; }
    /* next / back */
    wizard.querySelectorAll("[data-wz-next]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (current === 0 && !state.gleis) { showErr("Bitte wählen Sie zuerst: akuter Ausfall oder geplantes Vorhaben."); return; }
        if (current === 1) {
          if (!state.gewerk) { showErr("Bitte wählen Sie das gewünschte Gewerk."); return; }
          if (!state.gebaeude) { showErr("Bitte wählen Sie den Gebäudetyp."); return; }
        }
        goTo(Math.min(current + 1, steps.length - 1));
      });
    });
    wizard.querySelectorAll("[data-wz-back]").forEach(function (b) {
      b.addEventListener("click", function () { goTo(Math.max(current - 1, 0)); });
    });
    /* step 3 inputs: live validation */
    wizard.querySelectorAll(".wiz-step[data-step='3'] input, .wiz-step[data-step='3'] textarea").forEach(function (input) {
      input.addEventListener("blur", function () { validField(input); });
      input.addEventListener("input", function () {
        var f = input.closest(".wiz-field");
        if (f && f.classList.contains("invalid")) validField(input);
      });
    });
    /* submit */
    var form = wizard.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        wizard.querySelectorAll(".wiz-step[data-step='3'] input[required], .wiz-step[data-step='3'] textarea[required]").forEach(function (input) {
          if (!validField(input)) ok = false;
        });
        var consent = document.getElementById("wz-dsgvo");
        if (consent && !consent.checked) {
          ok = false;
          consent.closest(".check-field").style.outline = "2px solid var(--orange)";
          consent.closest(".check-field").style.outlineOffset = "4px";
          consent.closest(".check-field").style.borderRadius = "6px";
        } else if (consent) {
          consent.closest(".check-field").style.outline = "";
        }
        if (!ok) { showErr("Bitte füllen Sie alle Pflichtfelder aus und bestätigen Sie den Datenschutzhinweis."); return; }
        hideErr();
        wizard.style.display = "none";
        var success = document.getElementById("wz-success");
        if (success) {
          success.classList.add("show");
          success.setAttribute("tabindex", "-1");
          success.focus();
        }
      });
    }
  }

  /* ---------- contact form (Kontakt) ---------- */
  document.querySelectorAll("form.quote-form").forEach(function (form) {
    var success = form.parentElement.querySelector(".form-success");
    var setInvalid = function (field, bad) {
      field.classList.toggle("invalid", bad);
      var input = field.querySelector("input, select, textarea");
      if (input) input.setAttribute("aria-invalid", bad ? "true" : "false");
      return !bad;
    };
    var validateField = function (field) {
      var input = field.querySelector("input, select, textarea");
      if (!input) return true;
      var val = (input.value || "").trim();
      var ok = true;
      if (input.hasAttribute("required") && !val) ok = false;
      if (ok && input.type === "email" && val) ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
      if (ok && input.type === "tel" && val) {
        ok = val.replace(/[\s+()/-]/g, "").length >= 8 && /^[+0-9][0-9\s()+/-]*$/.test(val);
      }
      if (ok && input.tagName === "TEXTAREA" && input.hasAttribute("required")) ok = val.length >= 2;
      if (ok && input.name === "name") ok = val.length >= 2;
      return setInvalid(field, !ok);
    };
    form.querySelectorAll(".field").forEach(function (field) {
      var input = field.querySelector("input, select, textarea");
      if (input) {
        input.addEventListener("blur", function () { validateField(field); });
        input.addEventListener("input", function () {
          if (field.classList.contains("invalid")) validateField(field);
        });
      }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var allOk = true;
      form.querySelectorAll(".field").forEach(function (field) {
        if (!validateField(field)) allOk = false;
      });
      var consent = form.querySelector('input[type="checkbox"][required]');
      if (consent && !consent.checked) {
        allOk = false;
        consent.closest(".check-field").style.outline = "2px solid var(--orange)";
        consent.closest(".check-field").style.outlineOffset = "4px";
        consent.closest(".check-field").style.borderRadius = "4px";
      } else if (consent) {
        consent.closest(".check-field").style.outline = "";
      }
      if (!allOk) {
        var firstBad = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (firstBad) firstBad.focus();
        return;
      }
      form.style.display = "none";
      if (success) {
        success.classList.add("show");
        success.setAttribute("tabindex", "-1");
        success.focus();
      }
    });
  });
})();
