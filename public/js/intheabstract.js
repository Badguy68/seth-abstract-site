/* =========================================================
   THE ABSTRACT / LIVING ARCHIVE

   HOW TO UPDATE THE PAGE:
   1. Add an entry to the matching /data/*.json file.
   2. Set "publishAt" to an ISO date/time WITH timezone.
   3. Save and deploy. No HTML or JS edits required.

   This JS replaces the old CURRENT_ABSTRACT_WEEK system.
========================================================= */

/* =========================================================
   SETTINGS / FILE LOCATIONS
========================================================= */

// Existing Make webhook preserved from your previous JS.
const ABSTRACT_WEBHOOK_URL =
  "https://hook.us2.make.com/yls82e8g8aq2mwnujx44q8lcrc3uii4j";

const ABSTRACT_FILES = {
  settings: "../intheabstract/data/archive-settings.json",
  videos: "../intheabstract/data/videos.json",
  selfPoems: "../intheabstract/data/self-poems.json",
  witnessPoems: "../intheabstract/data/witness-poems.json",
  audio: "../intheabstract/data/audio.json",
  thoughts: "../intheabstract/data/thoughts.json",
  artwork: "../intheabstract/data/artwork.json"
};

// Number shown before clicking "See more".
const INITIAL_LIST_COUNT = 5;

// When you click "See more", load 10 more on desktop / 5 on mobile.
const LOAD_MORE_DESKTOP = 10;
const LOAD_MORE_MOBILE = 5;

// NEW badges disappear automatically after 10 days.
const NEW_FOR_DAYS = 10;
const ONE_DAY = 24 * 60 * 60 * 1000;

const ARCHIVE_FALLBACK_IMAGE = "/images/abstract/placeholder-video.svg";

// Content is loaded once. These are the visible, published entries.
let archive = {
  settings: {},
  videos: [],
  selfPoems: [],
  witnessPoems: [],
  audio: [],
  thoughts: [],
  artwork: []
};

let selectedVideoId = null;
const listStates = {};

/* =========================================================
   CLEAN URL (PRESERVED FROM YOUR OLD PAGE)
========================================================= */

function cleanAbstractUrl() {
  // Read passcode / QR parameters here BEFORE removing them.
  // This cosmetic cleanup is NOT access control.
  const query = new URLSearchParams(window.location.search);
  const arrivalCode = query.get("code") || query.get("passcode") || "";

  if (window.location.search) {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  return arrivalCode;
}

/* =========================================================
   FETCH + DATE HELPERS
========================================================= */

async function loadJson(path, fallback) {
  try {
    // Prevent stale cached JSON after you publish new content.
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);

    const result = await response.json();
    if (Array.isArray(fallback) && !Array.isArray(result)) {
      throw new Error(`${path} should contain a JSON array`);
    }
    return result;
  } catch (error) {
    console.error("The Abstract: could not load", path, error);
    return fallback;
  }
}

function publicationTime(item) {
  return Date.parse(item.publishAt || "");
}

function isPublished(item) {
  const date = publicationTime(item);
  return item.published !== false && Number.isFinite(date) && date <= Date.now();
}

function newestFirst(items) {
  return [...items].filter(isPublished).sort((a, b) => publicationTime(b) - publicationTime(a));
}

function isNew(item) {
  const age = Date.now() - publicationTime(item);
  return age >= 0 && age < NEW_FOR_DAYS * ONE_DAY;
}

function formatDate(item) {
  const date = publicationTime(item);
  if (!Number.isFinite(date)) return "";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
      timeZone: archive.settings.displayTimeZone || "UTC"
    }).format(new Date(date));
  } catch (error) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric", timeZone: "UTC"
    }).format(new Date(date));
  }
}

// Use actual elements/textContent rather than inserting untrusted text as HTML.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function makeNewTag() {
  return el("span", "new-tag", "NEW");
}

function setSectionNew(elementId, items) {
  const slot = document.getElementById(elementId);
  slot.replaceChildren();
  if (items.some(isNew)) slot.append(makeNewTag());
}

function safeImageSource(source, fallback) {
  return typeof source === "string" && source.trim() ? source : fallback;
}

function createImage(src, alt) {
  const img = el("img");
  img.src = src;
  img.alt = alt;
  img.loading = "lazy";
  img.addEventListener("error", () => {
    if (!img.src.endsWith(ARCHIVE_FALLBACK_IMAGE)) img.src = ARCHIVE_FALLBACK_IMAGE;
  });
  return img;
}

/* =========================================================
   HERO: INTRO, LINKS, AND LIVE COUNTS
========================================================= */

function renderHero() {
  const description = archive.settings.description;
  if (description) document.getElementById("archive-description").textContent = description;

  const playlist = document.getElementById("playlist-link");
  if (archive.settings.spotifyPlaylistUrl) {
    playlist.href = archive.settings.spotifyPlaylistUrl;
    playlist.removeAttribute("aria-disabled");
    playlist.title = "Open the Witnesses' Spotify playlist";
  } else {
    playlist.href = "#";
    playlist.setAttribute("aria-disabled", "true");
    playlist.title = "Add spotifyPlaylistUrl to archive-settings.json";
    playlist.addEventListener("click", event => event.preventDefault());
  }

  const poemCount = archive.selfPoems.length + archive.witnessPoems.length;
  const total = poemCount + archive.audio.length + archive.thoughts.length +
    archive.artwork.length + archive.videos.length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-poems").textContent = poemCount;
  document.getElementById("stat-artworks").textContent = archive.artwork.length;
  document.getElementById("stat-audio").textContent = archive.audio.length;
  document.getElementById("stat-videos").textContent = archive.videos.length;
}

/* =========================================================
   VIDEO: FEATURED PLAYER + SIDE-SCROLLING HISTORY
========================================================= */

function videoThumbSource(video) {
  if (video.thumbnail) return video.thumbnail;

  // YouTube generates thumbnail images for public/unlisted videos.
  if (/^[\w-]{11}$/.test(video.youtubeId || "")) {
    return `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
  }

  return ARCHIVE_FALLBACK_IMAGE;
}

function selectVideo(video) {
  selectedVideoId = video.id;

  document.getElementById("video-title").textContent = video.title || "Untitled video";
  document.getElementById("video-date").textContent = formatDate(video);
  document.getElementById("video-summary").textContent = video.description || "";
  document.getElementById("video-section-title").firstChild.textContent =
    video.id === archive.videos[0]?.id ? "Latest video " : "From the video archive ";

  const newSlot = document.getElementById("video-new");
  newSlot.replaceChildren();
  if (isNew(video)) newSlot.append(makeNewTag());

  const frame = document.getElementById("featured-video-frame");
  frame.replaceChildren(); // Stops the previous video/iframe immediately.

  const play = el("button", "video-poster-button");
  play.type = "button";
  play.setAttribute("aria-label", `Play video: ${video.title}`);
  play.append(createImage(videoThumbSource(video), `Thumbnail for ${video.title}`));
  play.append(el("span", "video-play-icon", "▶"));
  frame.append(play);

  play.addEventListener("click", () => {
    const id = video.youtubeId || "";
    if (!/^[\w-]{11}$/.test(id)) {
      // Demo entries have empty IDs; don't embed unrelated videos.
      alert("Add this video's 11-character YouTube ID to videos.json to enable playback.");
      return;
    }

    const iframe = el("iframe");
    iframe.title = `YouTube video: ${video.title}`;
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frame.replaceChildren(iframe);
  });

  document.querySelectorAll(".video-thumb").forEach(button => {
    const active = button.dataset.id === video.id;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderVideos() {
  const track = document.getElementById("video-track");
  track.replaceChildren();
  const frame = document.getElementById("featured-video-frame");

  if (!archive.videos.length) {
    frame.append(el("div", "video-empty", "The first video message will appear here."));
    document.getElementById("video-title").textContent = "Video messages";
    document.getElementById("video-summary").textContent = "Add your first video to /data/videos.json.";
    return;
  }

  archive.videos.forEach(video => {
    const button = el("button", "video-thumb");
    button.type = "button";
    button.dataset.id = video.id;
    button.setAttribute("aria-pressed", "false");

    const imageBox = el("span", "video-thumb-image");
    imageBox.append(createImage(videoThumbSource(video), `Preview: ${video.title}`));
    button.append(imageBox);
    button.append(el("span", "video-thumb-title", video.title));
    button.append(el("span", "video-thumb-date", formatDate(video)));

    button.addEventListener("click", () => selectVideo(video));
    track.append(button);
  });

  // Newest published video is selected on each visit.
  selectVideo(archive.videos[0]);
}

function setupScrollArrows() {
  document.querySelectorAll("[data-scroll]").forEach(button => {
    button.addEventListener("click", () => {
      const track = document.getElementById(button.dataset.scroll);
      const firstCard = track.firstElementChild;
      if (!firstCard) return;

      const step = firstCard.getBoundingClientRect().width + 14;
      const direction = Number(button.dataset.direction);
      track.scrollBy({ left: direction * step, behavior: "smooth" });
    });
  });
}

/* =========================================================
   POEMS AND WITNESS THOUGHTS
   Click any title to open the focused reading overlay.
========================================================= */

function createTextRow(item, kind) {
  const button = el("button", "archive-row");
  button.type = "button";
  button.setAttribute("aria-label", `Read ${item.title}`);

  const title = el("span", "archive-row-title", item.title || "Untitled");
  if (isNew(item)) title.append(makeNewTag());

  button.append(title);
  button.append(el("span", "archive-row-date", formatDate(item)));
  button.append(el("span", "archive-row-arrow", "›"));
  button.addEventListener("click", () => openReadingModal(item, kind));
  return button;
}

function openReadingModal(item, kind) {
  const category = kind === "thoughts" ? "Witness thoughts & responses" :
    kind === "selfPoems" ? "Seth's poetry" : "Poetry from the Witnesses";

  const byline = item.author || (kind === "selfPoems" ? "Seth Abstract" : "Anonymous Witness");
  const content = document.getElementById("modal-content");
  content.replaceChildren();

  const literaryText = el("div", "literary-text" + (kind === "thoughts" ? "" : " poem-text"), item.text || "");
  content.append(literaryText);

  // Witness thought entries can contain Seth's direct reply.
  if (kind === "thoughts" && item.response) {
    const response = el("div", "response-block");
    response.append(el("div", "response-label", "A response from Seth"));
    response.append(el("div", "literary-text", item.response));
    content.append(response);
  }

  showModal(category, item.title, `${byline} · ${formatDate(item)}`);
}

/* =========================================================
   AUDIO PLAYERS
   The existing player's core behavior has been preserved:
   - Play/pause on click
   - Starting one stops and resets the others
   - Finishing resets to 0:00, pauses, returns to ▶
========================================================= */

function createAudioRow(item) {
  const row = el("div", "audio-entry");
  const button = el("button", "audio-button", "▶");
  button.type = "button";
  button.setAttribute("aria-label", `Play ${item.title}`);
  button.setAttribute("aria-pressed", "false");

  const info = el("div", "audio-info");
  const title = el("div", "audio-title", item.title || "Untitled recording");
  if (isNew(item)) title.append(makeNewTag());
  info.append(title);
  info.append(el("div", "audio-subtitle", formatDate(item)));

  const time = el("span", "audio-time", item.duration || "—:—");
  const audio = el("audio");
  audio.preload = "metadata";
  audio.src = item.src || "";

  if (!item.src) {
    button.disabled = true;
    button.title = "Add an audio file path to audio.json";
  }

  audio.addEventListener("loadedmetadata", () => {
    if (!Number.isFinite(audio.duration)) return;
    const minutes = Math.floor(audio.duration / 60);
    const seconds = Math.floor(audio.duration % 60).toString().padStart(2, "0");
    time.textContent = `${minutes}:${seconds}`;
  });

  row.append(button, info, time, audio);
  return row;
}

function setAudioButton(audio, playing) {
  const button = audio.closest(".audio-entry")?.querySelector(".audio-button");
  if (!button) return;

  button.textContent = playing ? "❚❚" : "▶";
  button.classList.toggle("is-playing", playing);
  button.setAttribute("aria-pressed", String(playing));
  const title = audio.closest(".audio-entry").querySelector(".audio-title")?.firstChild?.textContent || "audio";
  button.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${title}`);
}

function setupAudioPlayers() {
  // Works for audio rows inserted later by "See more".
  document.addEventListener("click", async event => {
    const button = event.target.closest(".audio-button");
    if (!button || button.disabled) return;

    const audio = button.closest(".audio-entry").querySelector("audio");
    if (!audio.paused) {
      audio.pause();
      setAudioButton(audio, false);
      return;
    }

    // Only one recording at a time; reset other recordings.
    document.querySelectorAll(".audio-entry audio").forEach(other => {
      if (other !== audio) {
        other.pause();
        if (Number.isFinite(other.duration)) other.currentTime = 0;
        setAudioButton(other, false);
      }
    });

    try {
      await audio.play();
      setAudioButton(audio, true);
    } catch (error) {
      console.error("Audio could not play:", error);
      setAudioButton(audio, false);
    }
  });

  // `ended` doesn't bubble, so use capture = true.
  document.addEventListener("ended", event => {
    if (!(event.target instanceof HTMLAudioElement)) return;
    const audio = event.target;
    audio.pause();
    audio.currentTime = 0;
    setAudioButton(audio, false);
  }, true);
}

/* =========================================================
   EXPANDING LISTS
   First 5 entries, then +10 desktop / +5 mobile.
   New rows are appended (already-playing audio isn't removed).
========================================================= */

function setupCollectionList(key, items, createRow) {
  const container = document.getElementById(`${key}-list`);
  const button = document.getElementById(`${key}-more`);
  const count = document.getElementById(`${key}-count`);
  container.replaceChildren();

  count.textContent = `${items.length} entries`;
  setSectionNew(`${key}-new`, items);

  if (!items.length) {
    container.append(el("p", "archive-empty", "Nothing collected here yet."));
    button.hidden = true;
    return;
  }

  listStates[key] = { items, shown: 0 };

  function appendNext(amount) {
    const state = listStates[key];
    const nextItems = state.items.slice(state.shown, state.shown + amount);
    nextItems.forEach(item => container.append(createRow(item)));
    state.shown += nextItems.length;

    const remaining = state.items.length - state.shown;
    button.hidden = remaining <= 0;
    if (remaining > 0) {
      const batchSize = window.matchMedia("(max-width: 760px)").matches
        ? LOAD_MORE_MOBILE : LOAD_MORE_DESKTOP;
      button.innerHTML = `See ${Math.min(batchSize, remaining)} more <span aria-hidden="true">⌄</span>`;
    }
  }

  appendNext(INITIAL_LIST_COUNT);
  button.addEventListener("click", () => {
    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    appendNext(isMobile ? LOAD_MORE_MOBILE : LOAD_MORE_DESKTOP);
  });
}

function renderTextAndAudioCollections() {
  setupCollectionList("self-poems", archive.selfPoems, item => createTextRow(item, "selfPoems"));
  setupCollectionList("witness-poems", archive.witnessPoems, item => createTextRow(item, "witnessPoems"));
  setupCollectionList("audio", archive.audio, createAudioRow);
  setupCollectionList("thoughts", archive.thoughts, item => createTextRow(item, "thoughts"));
}

/* =========================================================
   GALLERY
   Horizontal scroller + expand a grid without leaving page.
========================================================= */

function createGalleryCard(item, inGrid = false) {
  const button = el("button", inGrid ? "gallery-grid-card" : "gallery-card");
  button.type = "button";
  button.setAttribute("aria-label", `View artwork: ${item.title}`);
  button.append(createImage(safeImageSource(item.image, ARCHIVE_FALLBACK_IMAGE), item.alt || item.title));
  const title = el("span", "gallery-title", item.title || "Untitled artwork");
  if (isNew(item)) title.append(makeNewTag());
  button.append(title);
  button.append(el("span", "gallery-date", formatDate(item)));
  button.addEventListener("click", () => openArtworkModal(item));
  return button;
}

function openArtworkModal(item) {
  const content = document.getElementById("modal-content");
  content.replaceChildren();
  content.append(createImage(safeImageSource(item.image, ARCHIVE_FALLBACK_IMAGE), item.alt || item.title));
  if (item.description) content.append(el("p", "artwork-description", item.description));
  showModal("The gallery", item.title, `${item.artist || "Anonymous Witness"} · ${formatDate(item)}`);
}

function renderGallery() {
  const track = document.getElementById("gallery-track");
  const expanded = document.getElementById("gallery-expanded");
  const button = document.getElementById("gallery-toggle");

  track.replaceChildren();
  expanded.replaceChildren();
  document.getElementById("gallery-count").textContent = `${archive.artwork.length} works`;
  setSectionNew("gallery-new", archive.artwork);

  if (!archive.artwork.length) {
    track.append(el("p", "archive-empty", "The first artwork will appear here."));
    button.hidden = true;
    return;
  }

  archive.artwork.forEach((item, index) => {
    const card = createGalleryCard(item);
    if (index < 3) card.querySelector("img").loading = "eager";
    track.append(card);
  });
  button.hidden = archive.artwork.length <= 3;

  button.addEventListener("click", () => {
    if (expanded.hidden) {
      archive.artwork.forEach(item => expanded.append(createGalleryCard(item, true)));
      expanded.hidden = false;
      button.innerHTML = 'Close gallery <span aria-hidden="true">⌃</span>';
      button.setAttribute("aria-expanded", "true");
    } else {
      expanded.hidden = true;
      expanded.replaceChildren();
      button.innerHTML = 'Explore the gallery <span aria-hidden="true">⌄</span>';
      button.setAttribute("aria-expanded", "false");
    }
  });
}

/* =========================================================
   SHARED FOCUSED OVERLAY
========================================================= */

function showModal(category, title, byline) {
  const dialog = document.getElementById("archive-modal");
  document.getElementById("modal-category").textContent = category;
  document.getElementById("modal-title").textContent = title || "Untitled";
  document.getElementById("modal-byline").textContent = byline || "";
  dialog.showModal();
  document.getElementById("modal-scroll").scrollTop = 0;
}

function setupModal() {
  const dialog = document.getElementById("archive-modal");
  document.getElementById("modal-close").addEventListener("click", () => dialog.close());

  // Clicking the backdrop closes the overlay. Escape also works natively.
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
}

/* =========================================================
   SUBMISSION FORM / EXISTING MAKE WEBHOOK
   Sends JSON like the old page (type, message), plus optional
   name, email and artwork/file URL. No Make scenario changes
   should be needed unless you want to use the new fields.
========================================================= */

function setupAbstractForm() {
  const form = document.getElementById("abstract-submit-form");
  const button = document.getElementById("submission-button");
  const status = document.getElementById("submission-status");

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!ABSTRACT_WEBHOOK_URL) {
      status.textContent = "Add your Make webhook URL to intheabstract.js before using the form.";
      status.classList.add("is-error");
      return;
    }

    const values = new FormData(form);
    const payload = {
  type: values.get("type"),
  message: values.get("message"),
  email: values.get("email"),
  page: "The Abstract"
};

    button.disabled = true;
    button.textContent = "Sending...";
    status.textContent = "";
    status.classList.remove("is-error");

    try {
      const response = await fetch(ABSTRACT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Make webhook returned ${response.status}`);

      form.reset();
      status.textContent = "Received. Thank you for contributing to The Abstract.";
    } catch (error) {
      console.error("Abstract submission failed:", error);
      status.textContent = "Something went wrong. Please try again.";
      status.classList.add("is-error");
    } finally {
      button.disabled = false;
      button.innerHTML = 'Send to the Archive <span aria-hidden="true">→</span>';
    }
  });
}

/* =========================================================
   INITIALIZE ALL COLLECTIONS
========================================================= */

async function loadAbstractArchive() {
  const [settings, videos, selfPoems, witnessPoems, audio, thoughts, artwork] =
    await Promise.all([
      loadJson(ABSTRACT_FILES.settings, {}),
      loadJson(ABSTRACT_FILES.videos, []),
      loadJson(ABSTRACT_FILES.selfPoems, []),
      loadJson(ABSTRACT_FILES.witnessPoems, []),
      loadJson(ABSTRACT_FILES.audio, []),
      loadJson(ABSTRACT_FILES.thoughts, []),
      loadJson(ABSTRACT_FILES.artwork, [])
    ]);

  archive = {
    settings,
    videos: newestFirst(videos),
    selfPoems: newestFirst(selfPoems),
    witnessPoems: newestFirst(witnessPoems),
    audio: newestFirst(audio),
    thoughts: newestFirst(thoughts),
    artwork: newestFirst(artwork)
  };

  renderHero();
  renderVideos();
  renderTextAndAudioCollections();
  renderGallery();
}

/* =========================================================
   INIT
========================================================= */
console.log("ALIVE");
document.addEventListener("DOMContentLoaded", () => {
  cleanAbstractUrl();
  setupScrollArrows();
  setupAudioPlayers();
  setupModal();
  setupAbstractForm();
  loadAbstractArchive();
});
