/**
 * Wahai Orang Beriman — list / summary / detail with scroll restore.
 */

(function () {
  "use strict";

  var STORAGE_KEY = "wob-lang";
  var CHEVRON =
    '<svg class="ayat-row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

  var state = {
    view: "list",
    returnView: "list",
    ayatId: null,
    listScrollY: 0,
    summaryScrollY: 0,
    lang: { bm: true, en: true }
  };

  /* ── Utilities ─────────────────────────────────────────────── */

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function truncate(str, max) {
    if (!str) return "";
    if (str.length <= max) return str;
    return str.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }

  function findAyat(id) {
    for (var i = 0; i < APP_AYAT.length; i++) {
      if (APP_AYAT[i].id === id) return APP_AYAT[i];
    }
    return null;
  }

  function groupBySurah() {
    var groups = [];
    var map = {};
    APP_AYAT.forEach(function (a) {
      if (!map[a.surah]) {
        map[a.surah] = {
          surah: a.surah,
          surahName: a.surahName,
          items: []
        };
        groups.push(map[a.surah]);
      }
      map[a.surah].items.push(a);
    });
    return groups;
  }

  function previewText(ayat) {
    if (state.lang.bm) {
      return { text: truncate(ayat.translation.bm, 110), cls: "lang-bm" };
    }
    if (state.lang.en) {
      return { text: truncate(ayat.translation.en, 110), cls: "lang-en" };
    }
    return { text: truncate(ayat.arabic, 80), cls: "" };
  }

  function guidancePreview(ayat) {
    if (state.lang.bm && ayat.guidance) {
      return { text: ayat.guidance.bm, cls: "lang-bm" };
    }
    if (state.lang.en && ayat.guidance) {
      return { text: ayat.guidance.en, cls: "lang-en" };
    }
    return previewText(ayat);
  }

  function surahLabel(group) {
    if (state.lang.bm && !state.lang.en) return group.surahName.bm;
    if (state.lang.en && !state.lang.bm) return group.surahName.en;
    if (group.surahName.bm === group.surahName.en) return group.surahName.bm;
    return group.surahName.bm + " / " + group.surahName.en;
  }

  function saveBrowseScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    if (state.view === "list") state.listScrollY = y;
    if (state.view === "summary") state.summaryScrollY = y;
  }

  /* ── Language prefs ────────────────────────────────────────── */

  function loadLang() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (typeof parsed.bm === "boolean") state.lang.bm = parsed.bm;
      if (typeof parsed.en === "boolean") state.lang.en = parsed.en;
      if (!state.lang.bm && !state.lang.en) {
        state.lang.bm = true;
        state.lang.en = true;
      }
    } catch (e) {
      /* ignore */
    }
  }

  function saveLang() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lang));
    } catch (e) {
      /* ignore */
    }
  }

  function syncToggleUI() {
    var bm = document.getElementById("toggle-bm");
    var en = document.getElementById("toggle-en");
    if (bm) bm.checked = state.lang.bm;
    if (en) en.checked = state.lang.en;
  }

  function applyLangVisibility(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-lang='bm']").forEach(function (el) {
      el.classList.toggle("lang-hidden", !state.lang.bm);
    });
    scope.querySelectorAll("[data-lang='en']").forEach(function (el) {
      el.classList.toggle("lang-hidden", !state.lang.en);
    });
  }

  function syncTabs() {
    var tabs = document.getElementById("view-tabs");
    var backBtn = document.getElementById("back-btn");
    var isDetail = state.view === "detail";

    if (tabs) tabs.hidden = isDetail;
    if (backBtn) backBtn.hidden = !isDetail;

    document.querySelectorAll(".view-tab").forEach(function (tab) {
      var active = tab.getAttribute("data-view") === state.view;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  /* ── Renderers ─────────────────────────────────────────────── */

  function renderAyatRows(groups, mode) {
    return groups
      .map(function (g) {
        var prefix = mode === "summary" ? "guide-surah-" : "surah-";
        var rows = g.items
          .map(function (a) {
            var prev =
              mode === "summary" ? guidancePreview(a) : previewText(a);
            var previewClass =
              "ayat-row-preview " +
              prev.cls +
              (mode === "summary" ? " ayat-row-preview--full" : "");
            return (
              '<button type="button" class="ayat-row" data-ayat-id="' +
              escapeHtml(a.id) +
              '">' +
              '<span class="ayat-row-main">' +
              '<span class="ayat-row-ref">' +
              escapeHtml(g.surahName.bm) +
              " · " +
              a.ayah +
              "</span>" +
              '<span class="' +
              previewClass +
              '">' +
              escapeHtml(prev.text) +
              "</span>" +
              "</span>" +
              CHEVRON +
              "</button>"
            );
          })
          .join("");

        return (
          '<section class="section-block" id="' +
          prefix +
          g.surah +
          '">' +
          '<div class="section-header">' +
          '<span class="section-number">' +
          g.surah +
          "</span>" +
          '<h2 class="section-title">' +
          escapeHtml(surahLabel(g)) +
          "</h2>" +
          "</div>" +
          rows +
          "</section>"
        );
      })
      .join("");
  }

  function renderList() {
    return renderAyatRows(groupBySurah(), "list");
  }

  function renderSummary() {
    var intro =
      '<p class="page-intro">Ringkasan panduan bagi setiap ayat yang bermula dengan <em>يَا أَيُّهَا الَّذِينَ آمَنُوا</em>. Ketik untuk baca penuh.</p>';
    return intro + renderAyatRows(groupBySurah(), "summary");
  }

  function renderNav(mode) {
    var groups = groupBySurah();
    var prefix = mode === "summary" ? "guide-surah-" : "surah-";
    return groups
      .map(function (g) {
        return (
          '<button type="button" class="nav-btn" data-target="' +
          prefix +
          g.surah +
          '">' +
          g.surah +
          ". " +
          escapeHtml(g.surahName.bm) +
          "</button>"
        );
      })
      .join("");
  }

  function renderDetail(ayat) {
    var surahTitle =
      state.lang.bm && !state.lang.en
        ? ayat.surahName.bm
        : state.lang.en && !state.lang.bm
          ? ayat.surahName.en
          : ayat.surahName.bm === ayat.surahName.en
            ? ayat.surahName.bm
            : ayat.surahName.bm + " / " + ayat.surahName.en;

    var html = '<article class="detail-view">';
    html +=
      '<p class="detail-ref">' +
      escapeHtml(ayat.surahName.bm) +
      " " +
      ayat.surah +
      ":" +
      ayat.ayah +
      "</p>";
    html += '<h2 class="detail-surah">' + escapeHtml(surahTitle) + "</h2>";

    html += '<div class="content-block">';
    html += '<span class="content-label label-arabic">Arab</span>';
    html +=
      '<p class="arabic verse-block">' +
      escapeHtml(ayat.arabic).replace(/\n/g, "<br>") +
      "</p>";
    html += "</div>";

    if (ayat.guidance) {
      html += '<div class="content-block">';
      html +=
        '<span class="content-label label-guidance">Panduan</span>';
      html +=
        '<p class="guidance-block" data-lang="bm">' +
        escapeHtml(ayat.guidance.bm) +
        "</p>";
      html +=
        '<p class="guidance-block" data-lang="en">' +
        escapeHtml(ayat.guidance.en) +
        "</p>";
      html += "</div>";
    }

    html +=
      '<div class="content-block" data-lang="bm">' +
      '<span class="content-label label-malay">Melayu</span>' +
      '<p class="translation translation-malay">' +
      escapeHtml(ayat.translation.bm) +
      "</p></div>";

    html +=
      '<div class="content-block" data-lang="en">' +
      '<span class="content-label label-english">English</span>' +
      '<p class="translation translation-english">' +
      escapeHtml(ayat.translation.en) +
      "</p></div>";

    html += '<div class="content-block">';
    html += '<span class="content-label label-tafsir">Tafsir · Ibn Kathir</span>';
    html +=
      '<p class="tafsir" data-lang="bm">' + escapeHtml(ayat.tafsir.bm) + "</p>";
    html +=
      '<p class="tafsir" data-lang="en">' + escapeHtml(ayat.tafsir.en) + "</p>";
    html += "</div>";

    html += "</article>";
    return html;
  }

  /* ── View switching ────────────────────────────────────────── */

  function showBrowse(view, restoreScroll, pushHistory) {
    state.view = view;
    state.returnView = view;
    state.ayatId = null;
    document.body.classList.remove("is-detail");
    syncTabs();

    var main = document.getElementById("main-content");
    var nav = document.getElementById("section-nav");
    main.innerHTML = view === "summary" ? renderSummary() : renderList();
    nav.innerHTML = renderNav(view);
    nav.hidden = false;
    bindListEvents();
    initNavObserver();

    var y = 0;
    if (restoreScroll) {
      y = view === "summary" ? state.summaryScrollY : state.listScrollY;
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        window.scrollTo(0, y);
      });
    });

    if (pushHistory) {
      var hash = view === "summary" ? "#ringkasan" : "#";
      history.pushState({ view: view }, "", hash);
    }
  }

  function showList(restoreScroll, pushHistory) {
    showBrowse("list", restoreScroll, pushHistory);
  }

  function showSummary(restoreScroll, pushHistory) {
    showBrowse("summary", restoreScroll, pushHistory);
  }

  function showDetail(id, pushHistory) {
    var ayat = findAyat(id);
    if (!ayat) return;

    if (state.view === "list" || state.view === "summary") {
      state.returnView = state.view;
      saveBrowseScroll();
    }

    state.view = "detail";
    state.ayatId = id;
    document.body.classList.add("is-detail");
    syncTabs();

    var nav = document.getElementById("section-nav");
    if (nav) nav.hidden = true;

    var main = document.getElementById("main-content");
    main.innerHTML = renderDetail(ayat);
    applyLangVisibility(main);
    window.scrollTo(0, 0);

    if (pushHistory) {
      history.pushState(
        { view: "detail", ayatId: id, returnView: state.returnView },
        "",
        "#ayat/" + id
      );
    }
  }

  function restoreBrowse(returnView, restoreScroll) {
    if (returnView === "summary") {
      showSummary(restoreScroll, false);
    } else {
      showList(restoreScroll, false);
    }
  }

  function goBack() {
    if (state.view !== "detail") return;
    if (history.state && history.state.view === "detail") {
      history.back();
      return;
    }
    var ret = state.returnView || "list";
    history.replaceState(
      { view: ret },
      "",
      ret === "summary" ? "#ringkasan" : "#"
    );
    restoreBrowse(ret, true);
  }

  /* ── Events ────────────────────────────────────────────────── */

  function bindListEvents() {
    document.querySelectorAll(".ayat-row").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showDetail(btn.getAttribute("data-ayat-id"), true);
      });
    });

    document.querySelectorAll(".nav-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.dataset.target);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function initNavObserver() {
    var buttons = document.querySelectorAll(".nav-btn");
    if (!buttons.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            buttons.forEach(function (b) {
              b.classList.toggle(
                "active",
                b.dataset.target === entry.target.id
              );
            });
          }
        });
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );

    document.querySelectorAll(".section-block").forEach(function (el) {
      observer.observe(el);
    });
  }

  function bindChrome() {
    document.getElementById("back-btn").addEventListener("click", goBack);

    document.querySelectorAll(".view-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var next = tab.getAttribute("data-view");
        if (next === state.view) return;
        saveBrowseScroll();
        if (next === "summary") {
          showSummary(false, true);
        } else {
          showList(false, true);
        }
      });
    });

    document.getElementById("toggle-bm").addEventListener("change", function (e) {
      if (!e.target.checked && !state.lang.en) {
        e.target.checked = true;
        return;
      }
      state.lang.bm = e.target.checked;
      saveLang();
      refreshForLang();
    });

    document.getElementById("toggle-en").addEventListener("change", function (e) {
      if (!e.target.checked && !state.lang.bm) {
        e.target.checked = true;
        return;
      }
      state.lang.en = e.target.checked;
      saveLang();
      refreshForLang();
    });

    window.addEventListener("popstate", function (event) {
      var s = event.state;
      if (s && s.view === "detail" && s.ayatId) {
        if (s.returnView) state.returnView = s.returnView;
        showDetail(s.ayatId, false);
      } else if (s && s.view === "summary") {
        showSummary(true, false);
      } else {
        showList(true, false);
      }
    });
  }

  function refreshForLang() {
    if (state.view === "detail" && state.ayatId) {
      var ayat = findAyat(state.ayatId);
      if (!ayat) return;
      var main = document.getElementById("main-content");
      main.innerHTML = renderDetail(ayat);
      applyLangVisibility(main);
    } else if (state.view === "summary") {
      saveBrowseScroll();
      showSummary(true, false);
    } else {
      saveBrowseScroll();
      showList(true, false);
    }
  }

  function routeFromHash() {
    var hash = location.hash || "";
    var ayatMatch = hash.match(/^#ayat\/(.+)$/);
    if (ayatMatch) {
      var id = decodeURIComponent(ayatMatch[1]);
      if (findAyat(id)) {
        history.replaceState(
          { view: "detail", ayatId: id, returnView: "list" },
          "",
          location.hash
        );
        showDetail(id, false);
        return;
      }
    }
    if (hash === "#ringkasan") {
      history.replaceState({ view: "summary" }, "", "#ringkasan");
      showSummary(false, false);
      return;
    }
    history.replaceState({ view: "list" }, "", "#");
    showList(false, false);
  }

  function init() {
    loadLang();
    syncToggleUI();
    bindChrome();
    routeFromHash();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
