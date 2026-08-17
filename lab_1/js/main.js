/* ==========================================================================
   Variation D — "Moss & Page" (Botanical Cozy)
   Home page logic: search, sort, genre filter, mood quick-filter, grid
   rendering, cover fallback, and the "My Reading Nook" localStorage shelf
   with a potted plant that grows as books are saved.
   Plain script, no modules — must run from file://.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Constants                                                            */
  /* ------------------------------------------------------------------ */

  var NOOK_KEY = "botanical-nook";
  var SEARCH_DEBOUNCE_MS = 160;

  var MOODS = [
    { id: "contemplative", label: "Contemplative", genres: ["Poetry", "Philosophy"],
      icon: '<path d="M12 3c4.5 3 7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 2.5-9 7-12Z"/>' },
    { id: "wander", label: "Wander", genres: ["Travel"],
      icon: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6 6-2Z" fill="var(--paper,#fff)"/>' },
    { id: "curious", label: "Curious", genres: ["Science", "Biography"],
      icon: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' },
    { id: "storytime", label: "Storytime", genres: ["Children’s Fiction", "Children's Fiction", "Historical Fiction", "Drama"],
      icon: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5v-13Z"/>' }
  ];

  var STAR_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 2.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8-6.1-3.5-6.1 3.5 1.4-6.8-5.1-4.7 6.9-.8z"/>' +
    "</svg>";

  var SPRIG_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
    '<path d="M12 21V10" stroke-linecap="round"/>' +
    '<path d="M12 10C12 5 8 3 4 3c0 5 3.5 8.5 8 7Z" fill="currentColor" stroke="none"/>' +
    '<path d="M12 13c0-4.5 3.5-6.5 7-6.5 0 4.5-3 7.5-7 7Z" fill="currentColor" stroke="none" opacity="0.75"/>' +
    "</svg>";

  /* ------------------------------------------------------------------ */
  /* DOM references                                                       */
  /* ------------------------------------------------------------------ */

  var grid = document.getElementById("bookGrid");
  var headerNote = document.getElementById("headerNote");
  var resultCount = document.getElementById("resultCount");
  var searchInput = document.getElementById("searchInput");
  var genreSelect = document.getElementById("genreSelect");
  var sortSelect = document.getElementById("sortSelect");
  var moodRow = document.getElementById("moodRow");

  var nookToggle = document.getElementById("nookToggle");
  var nookCount = document.getElementById("nookCount");
  var nookPanel = document.getElementById("nookPanel");
  var nookBackdrop = document.getElementById("nookBackdrop");
  var nookClose = document.getElementById("nookClose");
  var nookList = document.getElementById("nookList");
  var nookPlantSvg = document.getElementById("nookPlantSvg");
  var nookPlantCaption = document.getElementById("nookPlantCaption");

  /* ------------------------------------------------------------------ */
  /* State                                                                 */
  /* ------------------------------------------------------------------ */

  var state = {
    search: "",
    genre: "",
    mood: "",
    sortBy: "title-asc"
  };

  var searchDebounceTimer = null;

  /* ------------------------------------------------------------------ */
  /* localStorage helpers (Reading Nook)                                   */
  /* ------------------------------------------------------------------ */

  function safeGetItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      /* localStorage unavailable (private mode, quota, etc.) — ignore */
    }
  }

  function getNook() {
    var raw = safeGetItem(NOOK_KEY);
    if (!raw) {
      return [];
    }
    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function setNook(ids) {
    safeSetItem(NOOK_KEY, JSON.stringify(ids));
  }

  function isSaved(id) {
    return getNook().indexOf(id) !== -1;
  }

  function toggleSaved(id) {
    var list = getNook();
    var index = list.indexOf(id);
    if (index === -1) {
      list.push(id);
    } else {
      list.splice(index, 1);
    }
    setNook(list);
    refreshNookUI();
    return index === -1; // true = now saved
  }

  function removeSaved(id) {
    var list = getNook();
    var index = list.indexOf(id);
    if (index !== -1) {
      list.splice(index, 1);
      setNook(list);
      refreshNookUI();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Growing potted plant SVG                                             */
  /* ------------------------------------------------------------------ */

  function leafPath(x, y, side, scale) {
    var dir = side === "left" ? -1 : 1;
    var w = 16 * scale * dir;
    var h = 11 * scale;
    return (
      '<path d="M' + x + " " + y + " C " +
      (x + w * 0.3) + " " + (y - h) + ", " +
      (x + w) + " " + (y - h * 0.7) + ", " +
      (x + w * 0.9) + " " + y + " C " +
      (x + w * 0.5) + " " + (y + h * 0.35) + ", " +
      x + " " + (y + h * 0.15) + ", " + x + " " + y +
      ' Z" fill="var(--sage-400, #8ea87c)" opacity="0.92"/>'
    );
  }

  function potSVG() {
    return (
      '<path d="M30 108 L98 108 L90 130 A8 8 0 0 1 82 137 L46 137 A8 8 0 0 1 38 130 Z" ' +
      'fill="var(--clay-500, #bd7148)"/>' +
      '<rect x="26" y="100" width="76" height="12" rx="4" fill="var(--clay-400, #cf8f68)"/>' +
      '<ellipse cx="64" cy="103" rx="34" ry="6" fill="var(--sage-700, #40532f)" opacity="0.55"/>'
    );
  }

  function buildPlantSVG(count) {
    var baseX = 64;
    var baseY = 100;
    var leaves = Math.min(count, 10);
    var stemHeight = count === 0 ? 6 : 20 + Math.min(count, 12) * 6.2;
    var topY = baseY - stemHeight;

    var parts = [];
    parts.push(
      '<svg class="nook-plant-svg" viewBox="0 0 128 148" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A potted plant with ' +
      leaves + " leaves, grown from " + count + ' saved book(s)">'
    );

    if (count === 0) {
      // Seedling in soil — just a tiny nub, no leaves yet.
      parts.push('<path d="M64 100 C64 92 60 88 56 86 C60 92 62 96 64 100Z" fill="var(--sage-400,#8ea87c)"/>');
      parts.push('<path d="M64 100 C64 93 68 90 72 89 C68 94 65 97 64 100Z" fill="var(--sage-500,#6f9160)"/>');
    } else {
      // Stem
      parts.push(
        '<path d="M' + baseX + " " + baseY + " C " + (baseX - 4) + " " + (baseY - stemHeight * 0.5) +
        ", " + (baseX + 3) + " " + (baseY - stemHeight * 0.7) + ", " + baseX + " " + topY +
        '" stroke="var(--sage-600,#567047)" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
      );

      // Leaves alternating up the stem
      for (var i = 0; i < leaves; i++) {
        var t = (i + 1) / (leaves + 0.4);
        var y = baseY - t * stemHeight;
        var side = i % 2 === 0 ? "left" : "right";
        var scale = 0.65 + t * 0.55;
        parts.push(leafPath(baseX, y, side, scale));
      }

      // A little flower/bud once the nook is well-established
      if (count >= 8) {
        parts.push(
          '<circle cx="' + baseX + '" cy="' + (topY - 3) + '" r="5.5" fill="var(--clay-400,#cf8f68)"/>' +
          '<circle cx="' + baseX + '" cy="' + (topY - 3) + '" r="2.2" fill="var(--clay-600,#995a38)"/>'
        );
      }
    }

    parts.push(potSVG());
    parts.push("</svg>");
    return parts.join("");
  }

  function plantCaption(count) {
    if (count === 0) {
      return "Your nook is empty — plant your first book below.";
    }
    var stage = count <= 3 ? "sprouting" : count <= 7 ? "growing nicely" : "thriving";
    return "Your nook has " + count + " book" + (count === 1 ? "" : "s") + " — your plant is " + stage + ".";
  }

  function refreshNookUI() {
    var list = getNook();
    var count = list.length;

    if (nookCount) {
      nookCount.textContent = String(count);
    }
    if (nookToggle) {
      nookToggle.setAttribute("aria-label", "Open my reading nook, " + count + " saved book" + (count === 1 ? "" : "s"));
    }
    if (nookPlantSvg) {
      nookPlantSvg.innerHTML = buildPlantSVG(count);
    }
    if (nookPlantCaption) {
      nookPlantCaption.textContent = plantCaption(count);
    }

    if (nookList) {
      renderNookList(list);
    }

    // Keep sprig buttons in the grid in sync (e.g. after removing from panel).
    document.querySelectorAll(".sprig-btn").forEach(function (btn) {
      var id = btn.getAttribute("data-book-id");
      var saved = isSaved(id);
      btn.setAttribute("aria-pressed", saved ? "true" : "false");
      var title = btn.getAttribute("data-book-title") || "this book";
      btn.setAttribute("aria-label", (saved ? "Remove " : "Add ") + title + (saved ? " from" : " to") + " your reading nook");
    });
  }

  function renderNookList(ids) {
    nookList.replaceChildren();

    if (!ids.length) {
      var empty = document.createElement("div");
      empty.className = "nook-empty";
      empty.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
        '<path d="M12 21V10M12 10C12 5 8 3 4 3c0 5 3.5 8.5 8 7Z"/></svg>' +
        "<p>Nothing tucked away yet. Tap the sprig on any book to add it here.</p>";
      nookList.appendChild(empty);
      return;
    }

    var fragment = document.createDocumentFragment();
    ids.forEach(function (id) {
      var book = (typeof BOOKS !== "undefined" ? BOOKS : []).find(function (b) { return b.id === id; });
      if (!book) {
        return;
      }
      fragment.appendChild(buildNookItem(book));
    });
    nookList.appendChild(fragment);
  }

  function buildNookItem(book) {
    var item = document.createElement("div");
    item.className = "nook-item";

    var link = document.createElement("a");
    link.href = "book.html?id=" + encodeURIComponent(book.id);
    link.style.display = "flex";
    link.style.gap = "0.7rem";
    link.style.flex = "1";
    link.style.minWidth = "0";
    link.style.alignItems = "center";

    var cover = document.createElement("div");
    cover.className = "nook-item-cover";
    cover.style.setProperty("--cover-a", book.coverFrom);
    cover.style.setProperty("--cover-b", book.coverTo);
    if (book.cover) {
      var img = document.createElement("img");
      img.src = book.cover;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener("error", function () { img.remove(); });
      cover.appendChild(img);
    }

    var info = document.createElement("div");
    info.className = "nook-item-info";
    var title = document.createElement("p");
    title.className = "nook-item-title";
    title.textContent = book.title;
    var author = document.createElement("p");
    author.className = "nook-item-author";
    author.textContent = book.author;
    info.appendChild(title);
    info.appendChild(author);

    link.appendChild(cover);
    link.appendChild(info);

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "nook-item-remove";
    removeBtn.setAttribute("aria-label", "Remove " + book.title + " from your reading nook");
    removeBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">' +
      '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    removeBtn.addEventListener("click", function () {
      removeSaved(book.id);
      renderResults();
    });

    item.appendChild(link);
    item.appendChild(removeBtn);
    return item;
  }

  /* ------------------------------------------------------------------ */
  /* Nook panel open/close (accessible dialog)                            */
  /* ------------------------------------------------------------------ */

  var lastFocused = null;

  function openNook() {
    lastFocused = document.activeElement;
    nookPanel.classList.add("is-open");
    nookBackdrop.classList.add("is-open");
    nookPanel.setAttribute("aria-hidden", "false");
    nookToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (nookClose) {
      nookClose.focus();
    }
  }

  function closeNook() {
    nookPanel.classList.remove("is-open");
    nookBackdrop.classList.remove("is-open");
    nookPanel.setAttribute("aria-hidden", "true");
    nookToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function bindNookPanel() {
    if (nookToggle) {
      nookToggle.addEventListener("click", function () {
        if (nookPanel.classList.contains("is-open")) {
          closeNook();
        } else {
          openNook();
        }
      });
    }
    if (nookClose) {
      nookClose.addEventListener("click", closeNook);
    }
    if (nookBackdrop) {
      nookBackdrop.addEventListener("click", closeNook);
    }
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nookPanel.classList.contains("is-open")) {
        closeNook();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Cover rendering with fallback                                        */
  /* ------------------------------------------------------------------ */

  function attachCoverImage(coverEl, book) {
    if (!book.cover) {
      return;
    }
    var img = document.createElement("img");
    img.className = "cover-img";
    img.src = book.cover;
    img.alt = "Cover of " + book.title;
    img.loading = "lazy";
    img.addEventListener("load", function () {
      coverEl.classList.add("has-image");
    });
    img.addEventListener("error", function () {
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
      coverEl.classList.remove("has-image");
    });
    coverEl.appendChild(img);
  }

  function buildCover(book) {
    var cover = document.createElement("div");
    cover.className = "book-cover";
    cover.style.setProperty("--cover-a", book.coverFrom);
    cover.style.setProperty("--cover-b", book.coverTo);

    var coverTitle = document.createElement("p");
    coverTitle.className = "cover-title";
    coverTitle.textContent = book.title;

    var coverAuthor = document.createElement("p");
    coverAuthor.className = "cover-author";
    coverAuthor.textContent = book.author;

    cover.appendChild(coverTitle);
    cover.appendChild(coverAuthor);
    attachCoverImage(cover, book);
    return cover;
  }

  /* ------------------------------------------------------------------ */
  /* Filtering, sorting                                                    */
  /* ------------------------------------------------------------------ */

  function matchesSearch(book, needle) {
    if (book.title.toLowerCase().indexOf(needle) !== -1) return true;
    if (book.author.toLowerCase().indexOf(needle) !== -1) return true;
    if (book.genre.toLowerCase().indexOf(needle) !== -1) return true;
    if (book.tags && book.tags.some(function (tag) { return tag.toLowerCase().indexOf(needle) !== -1; })) return true;
    return false;
  }

  function moodMatchesGenre(moodId, genre) {
    var mood = MOODS.find(function (m) { return m.id === moodId; });
    if (!mood) {
      return true;
    }
    return mood.genres.indexOf(genre) !== -1;
  }

  function matchesFilters(book) {
    if (state.search && !matchesSearch(book, state.search)) return false;
    if (state.genre && book.genre !== state.genre) return false;
    if (state.mood && !moodMatchesGenre(state.mood, book.genre)) return false;
    return true;
  }

  function numOrNegInfinity(value) {
    return value === null || value === undefined ? -Infinity : value;
  }

  var sortComparators = {
    "title-asc": function (a, b) { return a.title.localeCompare(b.title); },
    "author-asc": function (a, b) { return a.author.localeCompare(b.author); },
    "year-desc": function (a, b) { return numOrNegInfinity(b.year) - numOrNegInfinity(a.year); },
    "year-asc": function (a, b) { return -numOrNegInfinity(b.year) + numOrNegInfinity(a.year); },
    "rating-desc": function (a, b) { return numOrNegInfinity(b.rating) - numOrNegInfinity(a.rating); }
  };

  function computeResults() {
    var filtered = BOOKS.filter(matchesFilters);
    var comparator = sortComparators[state.sortBy] || sortComparators["title-asc"];
    filtered.sort(comparator);
    return filtered;
  }

  /* ------------------------------------------------------------------ */
  /* Card rendering                                                        */
  /* ------------------------------------------------------------------ */

  function createBookCard(book) {
    var item = document.createElement("li");
    item.className = "book-card reveal";

    var link = document.createElement("a");
    link.className = "book-card-link";
    link.href = "book.html?id=" + encodeURIComponent(book.id);

    var label = book.title + " by " + book.author + ", " + book.genre;
    if (book.rating !== null && book.rating !== undefined) {
      label += ", rated " + book.rating + " out of 5";
    }
    link.setAttribute("aria-label", label);
    link.appendChild(buildCover(book));

    var body = document.createElement("div");
    body.className = "book-card-body";

    var title = document.createElement("h2");
    title.className = "book-title";
    title.textContent = book.title;

    var author = document.createElement("p");
    author.className = "book-author";
    author.textContent = book.year ? book.author + " · " + book.year : book.author;

    var meta = document.createElement("div");
    meta.className = "book-meta";

    var badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = book.genre;
    meta.appendChild(badge);

    if (book.rating !== null && book.rating !== undefined) {
      var rating = document.createElement("span");
      rating.className = "rating";
      rating.innerHTML = STAR_SVG;
      rating.appendChild(document.createTextNode(book.rating.toFixed(1)));
      meta.appendChild(rating);
    }

    body.appendChild(title);
    body.appendChild(author);
    body.appendChild(meta);
    link.appendChild(body);
    item.appendChild(link);

    var sprig = document.createElement("button");
    sprig.type = "button";
    sprig.className = "sprig-btn";
    sprig.innerHTML = SPRIG_SVG;
    sprig.setAttribute("data-book-id", book.id);
    sprig.setAttribute("data-book-title", book.title);
    var saved = isSaved(book.id);
    sprig.setAttribute("aria-pressed", saved ? "true" : "false");
    sprig.setAttribute("aria-label", (saved ? "Remove " : "Add ") + book.title + (saved ? " from" : " to") + " your reading nook");
    sprig.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      toggleSaved(book.id);
    });
    item.appendChild(sprig);

    return item;
  }

  function createEmptyState() {
    var item = document.createElement("li");
    item.className = "empty-state";
    item.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<path d="M12 21V9M12 9C12 4 7 2 3 2c0 5 4 9 9 7Z"/><path d="M12 12c0-4 4-6 8-6 0 4-3.5 7-8 6.5Z"/></svg>' +
      "<strong>No books in this corner of the nook</strong>" +
      "<p>Try a different mood, clear the search, or choose another genre.</p>";
    return item;
  }

  /* ------------------------------------------------------------------ */
  /* Reveal-on-scroll (gentle motion, gated behind reduced-motion)         */
  /* ------------------------------------------------------------------ */

  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealObserver = null;

  function getRevealObserver() {
    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      return null;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    }
    return revealObserver;
  }

  function observeReveal(el) {
    var observer = getRevealObserver();
    if (observer) {
      observer.observe(el);
    } else {
      el.classList.add("is-visible");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rendering pipeline                                                    */
  /* ------------------------------------------------------------------ */

  function updateResultCount(count) {
    if (!resultCount) return;
    resultCount.replaceChildren();
    var mark = document.createElement("mark");
    mark.textContent = String(count);
    resultCount.appendChild(mark);
    resultCount.appendChild(document.createTextNode(" book" + (count === 1 ? "" : "s") + " found"));
  }

  function renderResults() {
    var results = computeResults();
    var fragment = document.createDocumentFragment();

    if (results.length === 0) {
      fragment.appendChild(createEmptyState());
    } else {
      results.forEach(function (book) {
        fragment.appendChild(createBookCard(book));
      });
    }
    grid.replaceChildren(fragment);
    updateResultCount(results.length);

    Array.prototype.forEach.call(grid.querySelectorAll(".book-card.reveal"), observeReveal);
  }

  /* ------------------------------------------------------------------ */
  /* Mood chips                                                            */
  /* ------------------------------------------------------------------ */

  function renderMoodChips() {
    if (!moodRow) return;
    var fragment = document.createDocumentFragment();

    var allChip = document.createElement("button");
    allChip.type = "button";
    allChip.className = "mood-chip";
    allChip.setAttribute("aria-pressed", "true");
    allChip.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h16M4 6h16M4 18h16" stroke-linecap="round"/></svg><span>All moods</span>';
    allChip.addEventListener("click", function () { selectMood(""); });
    fragment.appendChild(allChip);

    MOODS.forEach(function (mood) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "mood-chip";
      chip.setAttribute("data-mood", mood.id);
      chip.setAttribute("aria-pressed", "false");
      chip.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' + mood.icon + "</svg><span>" + mood.label + "</span>";
      chip.addEventListener("click", function () { selectMood(mood.id); });
      fragment.appendChild(chip);
    });

    moodRow.appendChild(fragment);
  }

  function selectMood(moodId) {
    state.mood = moodId;
    Array.prototype.forEach.call(moodRow.children, function (chip) {
      var chipMood = chip.getAttribute("data-mood") || "";
      chip.setAttribute("aria-pressed", chipMood === moodId ? "true" : "false");
    });
    renderResults();
  }

  /* ------------------------------------------------------------------ */
  /* Genre select                                                          */
  /* ------------------------------------------------------------------ */

  function renderGenreOptions() {
    if (!genreSelect) return;
    var genres = Array.from(new Set(BOOKS.map(function (b) { return b.genre; }))).sort();
    genres.forEach(function (genre) {
      var opt = document.createElement("option");
      opt.value = genre;
      opt.textContent = genre;
      genreSelect.appendChild(opt);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Event bindings                                                        */
  /* ------------------------------------------------------------------ */

  function bindEvents() {
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer);
        searchDebounceTimer = window.setTimeout(function () {
          state.search = searchInput.value.trim().toLowerCase();
          renderResults();
        }, SEARCH_DEBOUNCE_MS);
      });
    }
    if (genreSelect) {
      genreSelect.addEventListener("change", function () {
        state.genre = genreSelect.value;
        renderResults();
      });
    }
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        state.sortBy = sortSelect.value;
        renderResults();
      });
    }
    bindNookPanel();
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                  */
  /* ------------------------------------------------------------------ */

  function init() {
    if (typeof BOOKS === "undefined" || !BOOKS.length) {
      if (headerNote) headerNote.textContent = "The shelf is empty right now";
      grid.replaceChildren();
      var errorItem = document.createElement("li");
      errorItem.className = "empty-state";
      errorItem.innerHTML = "<strong>Could not load the catalogue.</strong>";
      grid.appendChild(errorItem);
      return;
    }

    renderGenreOptions();
    renderMoodChips();
    bindEvents();
    refreshNookUI();
    renderResults();
  }

  init();
})();
