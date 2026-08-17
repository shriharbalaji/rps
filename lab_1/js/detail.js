/* ==========================================================================
   Variation D — "Moss & Page" (Botanical Cozy)
   Detail page logic: reads ?id= from the URL, renders the full book record,
   an add/remove reading-nook button, prev/next navigation, a "more in this
   genre" strip, and drives the shared header Nook panel + growing plant.
   Plain script, no modules — must run from file://.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Constants                                                            */
  /* ------------------------------------------------------------------ */

  var NOOK_KEY = "botanical-nook";
  var RELATED_LIMIT = 8;

  var SPRIG_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
    '<path d="M12 21V10" stroke-linecap="round"/>' +
    '<path d="M12 10C12 5 8 3 4 3c0 5 3.5 8.5 8 7Z" fill="currentColor" stroke="none"/>' +
    '<path d="M12 13c0-4.5 3.5-6.5 7-6.5 0 4.5-3 7.5-7 7Z" fill="currentColor" stroke="none" opacity="0.75"/>' +
    "</svg>";

  var STAR_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 2.5l2.95 6.28 6.93.72-5.17 4.73 1.44 6.83L12 17.77l-6.15 3.29 1.44-6.83-5.17-4.73 6.93-.72L12 2.5z"/></svg>';

  /* ------------------------------------------------------------------ */
  /* DOM references                                                        */
  /* ------------------------------------------------------------------ */

  var detailRoot = document.getElementById("bookDetail");
  var headerNote = document.getElementById("headerNote");
  var relatedSection = document.getElementById("relatedSection");
  var relatedTitle = document.getElementById("relatedTitle");
  var relatedStrip = document.getElementById("relatedStrip");

  var nookToggle = document.getElementById("nookToggle");
  var nookCount = document.getElementById("nookCount");
  var nookPanel = document.getElementById("nookPanel");
  var nookBackdrop = document.getElementById("nookBackdrop");
  var nookClose = document.getElementById("nookClose");
  var nookList = document.getElementById("nookList");
  var nookPlantSvg = document.getElementById("nookPlantSvg");
  var nookPlantCaption = document.getElementById("nookPlantCaption");

  /* ------------------------------------------------------------------ */
  /* localStorage helpers (mirrors js/main.js — duplicated intentionally  */
  /* since this project has no shared module file)                        */
  /* ------------------------------------------------------------------ */

  function safeGetItem(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSetItem(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }
  function getNook() {
    var raw = safeGetItem(NOOK_KEY);
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }
  function setNook(ids) { safeSetItem(NOOK_KEY, JSON.stringify(ids)); }
  function isSaved(id) { return getNook().indexOf(id) !== -1; }
  function toggleSaved(id) {
    var list = getNook();
    var index = list.indexOf(id);
    if (index === -1) list.push(id); else list.splice(index, 1);
    setNook(list);
    refreshNookUI();
    return index === -1;
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
  /* Growing potted plant SVG (mirrors js/main.js)                        */
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
    var baseX = 64, baseY = 100;
    var leaves = Math.min(count, 10);
    var stemHeight = count === 0 ? 6 : 20 + Math.min(count, 12) * 6.2;
    var topY = baseY - stemHeight;
    var parts = [];
    parts.push(
      '<svg class="nook-plant-svg" viewBox="0 0 128 148" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A potted plant with ' +
      leaves + " leaves, grown from " + count + ' saved book(s)">'
    );
    if (count === 0) {
      parts.push('<path d="M64 100 C64 92 60 88 56 86 C60 92 62 96 64 100Z" fill="var(--sage-400,#8ea87c)"/>');
      parts.push('<path d="M64 100 C64 93 68 90 72 89 C68 94 65 97 64 100Z" fill="var(--sage-500,#6f9160)"/>');
    } else {
      parts.push(
        '<path d="M' + baseX + " " + baseY + " C " + (baseX - 4) + " " + (baseY - stemHeight * 0.5) +
        ", " + (baseX + 3) + " " + (baseY - stemHeight * 0.7) + ", " + baseX + " " + topY +
        '" stroke="var(--sage-600,#567047)" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
      );
      for (var i = 0; i < leaves; i++) {
        var t = (i + 1) / (leaves + 0.4);
        var y = baseY - t * stemHeight;
        var side = i % 2 === 0 ? "left" : "right";
        var scale = 0.65 + t * 0.55;
        parts.push(leafPath(baseX, y, side, scale));
      }
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
    if (count === 0) return "Your nook is empty — plant your first book below.";
    var stage = count <= 3 ? "sprouting" : count <= 7 ? "growing nicely" : "thriving";
    return "Your nook has " + count + " book" + (count === 1 ? "" : "s") + " — your plant is " + stage + ".";
  }

  function refreshNookUI() {
    var list = getNook();
    var count = list.length;

    if (nookCount) nookCount.textContent = String(count);
    if (nookToggle) {
      nookToggle.setAttribute("aria-label", "Open my reading nook, " + count + " saved book" + (count === 1 ? "" : "s"));
    }
    if (nookPlantSvg) nookPlantSvg.innerHTML = buildPlantSVG(count);
    if (nookPlantCaption) nookPlantCaption.textContent = plantCaption(count);
    if (nookList) renderNookList(list);
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
      var b = (typeof BOOKS !== "undefined" ? BOOKS : []).find(function (bk) { return bk.id === id; });
      if (b) fragment.appendChild(buildNookItem(b));
    });
    nookList.appendChild(fragment);
  }

  function buildNookItem(bk) {
    var item = document.createElement("div");
    item.className = "nook-item";

    var link = document.createElement("a");
    link.href = "book.html?id=" + encodeURIComponent(bk.id);
    link.style.display = "flex";
    link.style.gap = "0.7rem";
    link.style.flex = "1";
    link.style.minWidth = "0";
    link.style.alignItems = "center";

    var cover = document.createElement("div");
    cover.className = "nook-item-cover";
    cover.style.setProperty("--cover-a", bk.coverFrom);
    cover.style.setProperty("--cover-b", bk.coverTo);
    if (bk.cover) {
      var img = document.createElement("img");
      img.src = bk.cover;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener("error", function () { img.remove(); });
      cover.appendChild(img);
    }

    var info = document.createElement("div");
    info.className = "nook-item-info";
    var title = document.createElement("p");
    title.className = "nook-item-title";
    title.textContent = bk.title;
    var author = document.createElement("p");
    author.className = "nook-item-author";
    author.textContent = bk.author;
    info.appendChild(title);
    info.appendChild(author);

    link.appendChild(cover);
    link.appendChild(info);

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "nook-item-remove";
    removeBtn.setAttribute("aria-label", "Remove " + bk.title + " from your reading nook");
    removeBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">' +
      '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    removeBtn.addEventListener("click", function () {
      removeSaved(bk.id);
      if (book && bk.id === book.id) {
        refreshDetailButton();
      }
    });

    item.appendChild(link);
    item.appendChild(removeBtn);
    return item;
  }

  /* ------------------------------------------------------------------ */
  /* Nook panel open/close                                                 */
  /* ------------------------------------------------------------------ */

  var lastFocused = null;

  function openNook() {
    lastFocused = document.activeElement;
    nookPanel.classList.add("is-open");
    nookBackdrop.classList.add("is-open");
    nookPanel.setAttribute("aria-hidden", "false");
    nookToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (nookClose) nookClose.focus();
  }
  function closeNook() {
    nookPanel.classList.remove("is-open");
    nookBackdrop.classList.remove("is-open");
    nookPanel.setAttribute("aria-hidden", "true");
    nookToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }
  function bindNookPanel() {
    if (nookToggle) {
      nookToggle.addEventListener("click", function () {
        if (nookPanel.classList.contains("is-open")) closeNook(); else openNook();
      });
    }
    if (nookClose) nookClose.addEventListener("click", closeNook);
    if (nookBackdrop) nookBackdrop.addEventListener("click", closeNook);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nookPanel.classList.contains("is-open")) closeNook();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Resolve the requested book                                            */
  /* ------------------------------------------------------------------ */

  var params = new URLSearchParams(window.location.search);
  var requestedId = params.get("id");

  var book = null;
  if (typeof BOOKS !== "undefined" && requestedId) {
    book = BOOKS.find(function (b) { return b.id === requestedId; }) || null;
  }

  /* ------------------------------------------------------------------ */
  /* Shared helpers                                                        */
  /* ------------------------------------------------------------------ */

  function isPresent(value) { return value !== null && value !== undefined && value !== ""; }

  function getNeighbours(currentBook) {
    if (typeof BOOKS === "undefined" || BOOKS.length <= 1) return null;
    var index = BOOKS.findIndex(function (b) { return b.id === currentBook.id; });
    if (index === -1) return null;
    return {
      prev: BOOKS[(index - 1 + BOOKS.length) % BOOKS.length],
      next: BOOKS[(index + 1) % BOOKS.length]
    };
  }

  function attachCoverImage(coverEl, forBook) {
    if (!forBook.cover) return;
    var img = document.createElement("img");
    img.className = "cover-img";
    img.src = forBook.cover;
    img.alt = "Cover of " + forBook.title;
    img.loading = "lazy";
    img.addEventListener("load", function () { coverEl.classList.add("has-image"); });
    img.addEventListener("error", function () { img.remove(); coverEl.classList.remove("has-image"); });
    coverEl.appendChild(img);
  }

  function buildCoverEl(forBook, extraClass) {
    var cover = document.createElement("div");
    cover.className = "book-cover" + (extraClass ? " " + extraClass : "");
    cover.style.setProperty("--cover-a", forBook.coverFrom);
    cover.style.setProperty("--cover-b", forBook.coverTo);

    var coverTitle = document.createElement("p");
    coverTitle.className = "cover-title";
    coverTitle.textContent = forBook.title;
    var coverAuthor = document.createElement("p");
    coverAuthor.className = "cover-author";
    coverAuthor.textContent = forBook.author;

    cover.appendChild(coverTitle);
    cover.appendChild(coverAuthor);
    attachCoverImage(cover, forBook);
    return cover;
  }

  /* ------------------------------------------------------------------ */
  /* Rendering — not found                                                 */
  /* ------------------------------------------------------------------ */

  function renderNotFound() {
    document.title = "Book not found — Moss & Page";
    if (headerNote) headerNote.textContent = "Not found";
    detailRoot.innerHTML =
      '<section class="not-found">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<path d="M12 21V9M12 9C12 4 7 2 3 2c0 5 4 9 9 7Z"/><path d="M12 12c0-4 4-6 8-6 0 4-3.5 7-8 6.5Z"/></svg>' +
      "<h1>This page has wilted</h1>" +
      "<p>We couldn't find a book matching that link. It may have been moved, or the address was mistyped.</p>" +
      '<a class="btn btn-primary" href="index.html">Back to the shelf</a>' +
      "</section>";
  }

  /* ------------------------------------------------------------------ */
  /* Rendering — main detail                                               */
  /* ------------------------------------------------------------------ */

  var nookBtnRef = null;

  function refreshDetailButton() {
    if (!nookBtnRef || !book) return;
    var saved = isSaved(book.id);
    nookBtnRef.setAttribute("aria-pressed", saved ? "true" : "false");
    nookBtnRef.innerHTML = SPRIG_SVG + "<span>" + (saved ? "In your reading nook" : "Add to reading nook") + "</span>";
  }

  function renderDetail(theBook) {
    document.title = theBook.title + " — Moss & Page";
    if (headerNote) headerNote.textContent = theBook.genre;

    var fragment = document.createDocumentFragment();
    var layout = document.createElement("div");
    layout.className = "detail-layout";
    layout.appendChild(buildCoverColumn(theBook));
    layout.appendChild(buildInfoColumn(theBook));
    fragment.appendChild(layout);

    var neighbours = getNeighbours(theBook);
    if (neighbours) fragment.appendChild(buildPager(neighbours));

    detailRoot.appendChild(fragment);

    if (neighbours) bindKeyboardNav(neighbours);

    renderRelated(theBook);
  }

  function buildCoverColumn(theBook) {
    var coverCol = document.createElement("div");
    coverCol.className = "detail-cover-col";
    coverCol.appendChild(buildCoverEl(theBook, "detail-cover"));

    if (typeof theBook.rating === "number") {
      var rating = document.createElement("span");
      rating.className = "rating detail-rating";
      rating.innerHTML = STAR_SVG;
      rating.appendChild(document.createTextNode(" " + theBook.rating.toFixed(1) + " / 5"));
      coverCol.appendChild(rating);
    }

    coverCol.appendChild(buildNookButton(theBook));
    return coverCol;
  }

  function buildNookButton(theBook) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-primary btn-block";
    nookBtnRef = btn;

    btn.addEventListener("click", function () {
      toggleSaved(theBook.id);
      refreshDetailButton();
    });

    refreshDetailButton();
    return btn;
  }

  function buildInfoColumn(theBook) {
    var info = document.createElement("div");
    info.className = "detail-info";

    var eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = theBook.genre;
    info.appendChild(eyebrow);

    var title = document.createElement("h1");
    title.className = "detail-title";
    title.textContent = theBook.title;
    info.appendChild(title);

    if (isPresent(theBook.subtitle)) {
      var subtitle = document.createElement("p");
      subtitle.className = "detail-subtitle";
      subtitle.textContent = theBook.subtitle;
      info.appendChild(subtitle);
    }

    var author = document.createElement("p");
    author.className = "detail-author";
    author.appendChild(document.createTextNode("by "));
    var strong = document.createElement("strong");
    strong.textContent = theBook.author;
    author.appendChild(strong);
    if (isPresent(theBook.year)) author.appendChild(document.createTextNode(" · " + theBook.year));
    info.appendChild(author);

    info.appendChild(buildAboutSection(theBook));
    if (theBook.quote && isPresent(theBook.quote.text)) info.appendChild(buildQuoteSection(theBook));
    info.appendChild(buildMetaSection(theBook));
    if (theBook.tags && theBook.tags.length > 0) info.appendChild(buildTagsSection(theBook));

    return info;
  }

  function buildAboutSection(theBook) {
    var section = document.createElement("section");
    section.className = "detail-section";
    var heading = document.createElement("h2");
    heading.className = "section-title";
    heading.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c4 3 6 7 6 11a6 6 0 1 1-12 0c0-4 2-8 6-11Z"/></svg> About this book';
    section.appendChild(heading);
    (theBook.blurb || []).forEach(function (paragraph) {
      var p = document.createElement("p");
      p.className = "blurb";
      p.textContent = paragraph;
      section.appendChild(p);
    });
    return section;
  }

  function buildQuoteSection(theBook) {
    var section = document.createElement("section");
    section.className = "detail-section";
    var heading = document.createElement("h2");
    heading.className = "section-title";
    heading.textContent = "From the book";
    section.appendChild(heading);

    var quote = document.createElement("blockquote");
    quote.className = "pull-quote";
    quote.appendChild(document.createTextNode("“" + theBook.quote.text + "”"));
    if (isPresent(theBook.quote.source)) {
      var cite = document.createElement("cite");
      cite.textContent = "— " + theBook.quote.source;
      quote.appendChild(cite);
    }
    section.appendChild(quote);
    return section;
  }

  function buildMetaSection(theBook) {
    var section = document.createElement("section");
    section.className = "detail-section";
    var heading = document.createElement("h2");
    heading.className = "section-title";
    heading.textContent = "Publication details";
    section.appendChild(heading);

    var metaGrid = document.createElement("div");
    metaGrid.className = "meta-grid";

    var fields = [
      ["Published", isPresent(theBook.year) ? String(theBook.year) : null],
      ["Pages", isPresent(theBook.pages) ? theBook.pages.toLocaleString() : null],
      ["Genre", theBook.genre],
      ["Publisher", isPresent(theBook.publisher) ? theBook.publisher : null],
      ["Language", theBook.language],
      ["ISBN", isPresent(theBook.isbn) ? theBook.isbn : null],
      ["Rating", typeof theBook.rating === "number" ? theBook.rating.toFixed(1) + " / 5" : null]
    ];

    fields.forEach(function (field) {
      if (!isPresent(field[1])) return;
      var item = document.createElement("div");
      item.className = "meta-item";
      var label = document.createElement("span");
      label.className = "meta-label";
      label.textContent = field[0];
      var value = document.createElement("p");
      value.className = "meta-value";
      value.textContent = field[1];
      item.appendChild(label);
      item.appendChild(value);
      metaGrid.appendChild(item);
    });

    section.appendChild(metaGrid);
    return section;
  }

  function buildTagsSection(theBook) {
    var section = document.createElement("section");
    section.className = "detail-section";
    var heading = document.createElement("h2");
    heading.className = "section-title";
    heading.textContent = "Themes";
    section.appendChild(heading);

    var list = document.createElement("ul");
    list.className = "tag-list";
    theBook.tags.forEach(function (tag) {
      var li = document.createElement("li");
      li.className = "tag";
      li.textContent = tag;
      list.appendChild(li);
    });
    section.appendChild(list);
    return section;
  }

  /* ------------------------------------------------------------------ */
  /* Related books ("more in this genre")                                  */
  /* ------------------------------------------------------------------ */

  function renderRelated(theBook) {
    if (!relatedSection || !relatedStrip || typeof BOOKS === "undefined") return;

    var related = BOOKS.filter(function (b) {
      return b.genre === theBook.genre && b.id !== theBook.id;
    }).slice(0, RELATED_LIMIT);

    if (!related.length) {
      relatedSection.hidden = true;
      return;
    }

    relatedTitle.lastChild.textContent = " More in " + theBook.genre;

    var fragment = document.createDocumentFragment();
    related.forEach(function (relatedBook) { fragment.appendChild(buildRelatedCard(relatedBook)); });
    relatedStrip.replaceChildren(fragment);
    relatedSection.hidden = false;
  }

  function buildRelatedCard(relatedBook) {
    var item = document.createElement("li");
    item.className = "book-card";

    var link = document.createElement("a");
    link.className = "book-card-link";
    link.href = "book.html?id=" + encodeURIComponent(relatedBook.id);
    link.setAttribute("aria-label", relatedBook.title + " by " + relatedBook.author);
    link.appendChild(buildCoverEl(relatedBook));

    var body = document.createElement("div");
    body.className = "book-card-body";
    var title = document.createElement("h3");
    title.className = "book-title";
    title.textContent = relatedBook.title;
    var author = document.createElement("p");
    author.className = "book-author";
    author.textContent = relatedBook.author;
    body.appendChild(title);
    body.appendChild(author);
    link.appendChild(body);
    item.appendChild(link);

    return item;
  }

  /* ------------------------------------------------------------------ */
  /* Previous / next pager                                                 */
  /* ------------------------------------------------------------------ */

  function buildPager(neighbours) {
    var nav = document.createElement("nav");
    nav.className = "pager";
    nav.setAttribute("aria-label", "Book navigation");
    nav.appendChild(buildPagerLink("prev", neighbours.prev));
    nav.appendChild(buildPagerLink("next", neighbours.next));
    return nav;
  }

  function buildPagerLink(direction, neighbour) {
    var isPrev = direction === "prev";
    var link = document.createElement("a");
    link.className = "pager-link " + (isPrev ? "pager-prev" : "pager-next");
    link.href = "book.html?id=" + encodeURIComponent(neighbour.id);
    link.setAttribute("aria-label", (isPrev ? "Previous" : "Next") + " book: " + neighbour.title);
    link.innerHTML = isPrev
      ? '<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var text = document.createElement("span");
    text.className = "pager-text";
    var label = document.createElement("span");
    label.className = "pager-label";
    label.textContent = isPrev ? "Previous" : "Next";
    var pagerTitle = document.createElement("span");
    pagerTitle.className = "pager-title";
    pagerTitle.textContent = neighbour.title;
    text.appendChild(label);
    text.appendChild(pagerTitle);
    link.appendChild(text);
    return link;
  }

  function bindKeyboardNav(neighbours) {
    document.addEventListener("keydown", function (event) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      var target = event.target;
      var tag = target && target.tagName;
      if ((target && target.isContentEditable) || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key === "ArrowLeft") window.location.href = "book.html?id=" + encodeURIComponent(neighbours.prev.id);
      else if (event.key === "ArrowRight") window.location.href = "book.html?id=" + encodeURIComponent(neighbours.next.id);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                  */
  /* ------------------------------------------------------------------ */

  bindNookPanel();
  refreshNookUI();

  if (!book) {
    renderNotFound();
  } else {
    renderDetail(book);
  }
})();
