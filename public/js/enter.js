/* =========================================================
   PAGE SETTINGS

   These are the two values you normally change.
========================================================= */

// This must match the song keyword used in songs.json.
const FEATURED_SONG = "davina-larose";

// Add a title between the backticks to show the presave section.
// Leave it completely empty to hide the section and its spacing.
const PRESAVE_SONG_TITLE = ``;

/* =========================================================
   ONE-TIME SITE SETTINGS
========================================================= */

const SONG_DATABASE_URL = "/songs/songs.json";

const MUSIC_PRESAVE_WEBHOOK_URL =
  "https://hook.us2.make.com/ewmi52n15g1adbf6vf2aybcjvhetnndu";

/* =========================================================
   PAGE STARTUP
========================================================= */

function initializeEnterPage() {
  initializePresave();
  initializePrintCarousel();
  initializeFeaturedSong();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeEnterPage,
    {
      once: true
    }
  );
} else {
  initializeEnterPage();
}

/* =========================================================
   PRESAVE
========================================================= */

function initializePresave() {
  const section = document.getElementById(
    "presave-section"
  );

  const title = document.getElementById(
    "presave-title"
  );

  const form = document.getElementById(
    "music-presave-form"
  );

  const cleanTitle = String(
    PRESAVE_SONG_TITLE || ""
  ).trim();

  section.toggleAttribute(
    "hidden",
    !cleanTitle
  );

  if (!cleanTitle) {
    return;
  }

  title.textContent =
    `Presave “${cleanTitle}”`;

  form.addEventListener(
    "submit",
    handlePresaveSubmit
  );
}

async function handlePresaveSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const emailInput = document.getElementById(
    "music-presave-email"
  );

  const message = document.getElementById(
    "music-presave-message"
  );

  const button = form.querySelector(
    "button[type='submit']"
  );

  const defaultButtonText =
    button.textContent;

  const email =
    emailInput.value.trim();

  if (!email) {
    message.textContent =
      "Enter your email first.";

    emailInput.focus();

    return;
  }

  try {
    button.disabled = true;
    button.textContent = "Submitting...";
    message.textContent = "";

    const response = await fetch(
      MUSIC_PRESAVE_WEBHOOK_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          createdAt: new Date().toISOString(),
          email,
          presaveSong: String(
            PRESAVE_SONG_TITLE || ""
          ).trim()
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        `Presave webhook returned ${response.status}.`
      );
    }

    form.reset();

    message.textContent =
      "Received. Thank you.";
  } catch (error) {
    console.error(
      "Presave submission failed:",
      error
    );

    message.textContent =
      "Something failed. Please try again.";
  } finally {
    button.disabled = false;
    button.textContent = defaultButtonText;
  }
}

/* =========================================================
   FEATURED SONG
========================================================= */

async function initializeFeaturedSong() {
  const songID = String(
    FEATURED_SONG || ""
  )
    .trim()
    .toLowerCase();

  try {
    const response = await fetch(
      SONG_DATABASE_URL,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `Song database returned ${response.status}.`
      );
    }

    const database =
      await response.json();

    const song =
      findSong(database, songID);

    fillSongCard(
      song,
      songID
    );

    fillFixedPlatformButtons(song);

    document.getElementById(
      "song-status"
    ).hidden = true;

    document.getElementById(
      "release-card"
    ).hidden = false;

    document.title =
      `${song.title || song.name || "Music"} | Seth Abstract`;
  } catch (error) {
    console.error(
      "Featured song failed to load:",
      error
    );

    showSongError(
      "The latest release could not be loaded."
    );
  }
}

/*
  Supports:

  1. A top-level song array
  2. A database.songs array
  3. A database.songs keyword object
  4. A top-level keyword object
*/
function findSong(database, songID) {
  if (Array.isArray(database)) {
    return database.find((song) => {
      return matchesSongID(
        song,
        songID
      );
    });
  }

  if (Array.isArray(database?.songs)) {
    return database.songs.find((song) => {
      return matchesSongID(
        song,
        songID
      );
    });
  }

  if (
    database?.songs &&
    typeof database.songs === "object"
  ) {
    return database.songs[songID];
  }

  return database?.[songID];
}

function matchesSongID(song, songID) {
  return [
    song?.id,
    song?.slug,
    song?.songID
  ]
    .filter(Boolean)
    .some((value) => {
      return (
        String(value)
          .trim()
          .toLowerCase() === songID
      );
    });
}

function fillSongCard(song, songID) {
  const title =
    song.title ||
    song.name ||
    songID;

  const description =
    song.shortDescription ||
    song.description ||
    "The latest release by Seth Abstract.";

  const cover =
    `/songs/album-covers/${songID}.jpg`;
    

  document.getElementById(
    "featured-song-title"
  ).textContent = title;

  document.getElementById(
    "featured-song-description"
  ).textContent = description;

  const coverElement =
    document.getElementById(
      "featured-song-cover"
    );

  coverElement.src = cover;

  coverElement.alt =
    song.coverAlt ||
    `${title} album cover`;
}

/*
  The four platform elements already exist in the HTML.

  This function only attaches URLs from the selected song.
  It does not create, remove, or rearrange the buttons.
*/
function fillFixedPlatformButtons(song) {
  const platforms = [
    "spotify",
    "apple",
    "youtube",
    "suno"
  ];

  platforms.forEach((platform) => {
    const element = document.querySelector(
      `[data-platform="${platform}"]`
    );

    const url = getPlatformURL(
      song,
      platform
    );

    if (!element) {
      return;
    }

    if (url) {
      element.href = url;

      element.classList.remove(
        "is-unavailable"
      );

      element.removeAttribute(
        "aria-disabled"
      );

      element.removeAttribute(
        "tabindex"
      );
    } else {
      element.removeAttribute(
        "href"
      );

      element.classList.add(
        "is-unavailable"
      );

      element.setAttribute(
        "aria-disabled",
        "true"
      );

      element.setAttribute(
        "tabindex",
        "-1"
      );
    }
  });
}

function getPlatformURL(song, platform) {
  const aliases = {
    spotify: [
      "spotify"
    ],

    apple: [
      "apple",
      "appleMusic",
      "applemusic"
    ],

    youtube: [
      "youtube",
      "youtubeMusic",
      "youtubemusic"
    ],

    suno: [
      "suno"
    ]
  };

  const sources = [
    song.links,
    song.platforms,
    song
  ].filter(Boolean);

  for (const source of sources) {
    for (const key of aliases[platform]) {
      const value = source[key];

      if (
        typeof value === "string" &&
        /^https?:\/\//i.test(value.trim())
      ) {
        return value.trim();
      }
    }
  }

  return "";
}

function showSongError(message) {
  const status = document.getElementById(
    "song-status"
  );

  const card = document.getElementById(
    "release-card"
  );

  if (status) {
    status.textContent = message;
    status.hidden = false;
  }

  if (card) {
    card.hidden = true;
  }
}

/* =========================================================
   AUTOMATIC ART-PRINT CAROUSEL
========================================================= */

function initializePrintCarousel() {
  const stage = document.getElementById(
    "print-carousel"
  );

  const track = document.getElementById(
    "print-track"
  );

  const originalCards = track
    ? Array.from(track.children)
    : [];

  if (
    !stage ||
    !track ||
    originalCards.length === 0
  ) {
    return;
  }

  if (originalCards.length === 1) {
    originalCards[0].classList.add(
      "is-active"
    );

    centerPrintCard(
      stage,
      track,
      0,
      false
    );

    track.classList.add(
      "is-ready"
    );

    return;
  }

  const originalCardCount =
    originalCards.length;

  /*
    One full cloned set is placed before the real cards,
    and another full cloned set is placed after them.

    With six original cards, the track becomes:

    cloned 1–6 | real 1–6 | cloned 1–6
  */
  const leadingClones =
    document.createDocumentFragment();

  const trailingClones =
    document.createDocumentFragment();

  originalCards.forEach((card) => {
    const leadingClone =
      card.cloneNode(true);

    const trailingClone =
      card.cloneNode(true);

    leadingClone.setAttribute(
      "aria-hidden",
      "true"
    );

    trailingClone.setAttribute(
      "aria-hidden",
      "true"
    );

    leadingClones.append(
      leadingClone
    );

    trailingClones.append(
      trailingClone
    );
  });

  track.insertBefore(
    leadingClones,
    track.firstChild
  );

  track.append(
    trailingClones
  );

  /*
    Start on the first card in the real middle set.

    This gives the first card cloned images on its left and
    real images on its right.
  */
  let currentIndex =
    originalCardCount;

  let advanceTimer = null;
  let transitionTimer = null;
  let resizeTimer = null;
  let isTransitioning = false;

  /*
    A new movement begins every three seconds, matching the
    pace of the original carousel.
  */
  const MOVE_INTERVAL = 2400;

  /*
    This must match the 760ms transform transition in CSS.
  */
  const MOVE_DURATION = 760;

  const TRANSITION_SAFETY_DELAY =
    MOVE_DURATION + 200;

  const reduceMotion =
    window
      .matchMedia(
        "(prefers-reduced-motion: reduce)"
      )
      .matches;

  function moveToCurrentCard(
    animate = true
  ) {
    const cards = Array.from(
      track.children
    );

    cards.forEach((card, index) => {
      card.classList.toggle(
        "is-active",
        index === currentIndex
      );
    });

    centerPrintCard(
      stage,
      track,
      currentIndex,
      animate && !reduceMotion
    );
  }

  function clearTimers() {
    window.clearTimeout(
      advanceTimer
    );

    window.clearTimeout(
      transitionTimer
    );

    advanceTimer = null;
    transitionTimer = null;
  }

  function scheduleNextMove(
    delay = MOVE_INTERVAL
  ) {
    window.clearTimeout(
      advanceTimer
    );

    if (
      reduceMotion ||
      document.hidden
    ) {
      return;
    }

    advanceTimer = window.setTimeout(
      advanceCarousel,
      delay
    );
  }

  function advanceCarousel() {
    if (
      isTransitioning ||
      document.hidden
    ) {
      return;
    }

    isTransitioning = true;
    currentIndex += 1;

    moveToCurrentCard(true);

    /*
      transitionend normally finishes the movement.
      This timer is only a browser safety fallback.
    */
    transitionTimer = window.setTimeout(
      finishMove,
      TRANSITION_SAFETY_DELAY
    );
  }

  function snapToRealSet() {
    /*
      We have reached the first card in the cloned ending set.

      Move to the identical first card in the real middle set.
      The neighboring cards are also identical, making the
      entire visible composition match perfectly.
    */
    if (
      currentIndex >=
      originalCardCount * 2
    ) {
      currentIndex -=
        originalCardCount;
    }

    /*
      This condition protects against unexpected positioning
      during a resize.
    */
    if (
      currentIndex <
      originalCardCount
    ) {
      currentIndex +=
        originalCardCount;
    }

    track.classList.add(
      "is-resetting"
    );

    moveToCurrentCard(false);

    /*
      Force the browser to apply the transition-free position
      before normal transitions are restored.
    */
    void track.offsetWidth;

    track.classList.remove(
      "is-resetting"
    );
  }

  function finishMove() {
    if (!isTransitioning) {
      return;
    }

    window.clearTimeout(
      transitionTimer
    );

    transitionTimer = null;

    if (
      currentIndex ===
      originalCardCount * 2
    ) {
      snapToRealSet();
    }

    isTransitioning = false;

    /*
      The movement lasts 760ms, so wait only the remaining
      2240ms before moving again.

      760ms + 2240ms = one movement every 3000ms.
    */
    scheduleNextMove(
      MOVE_INTERVAL - MOVE_DURATION
    );
  }

  track.addEventListener(
    "transitionend",
    (event) => {
      if (
        event.target !== track ||
        event.propertyName !== "transform"
      ) {
        return;
      }

      finishMove();
    }
  );

  window.addEventListener(
    "resize",
    () => {
      clearTimers();

      window.clearTimeout(
        resizeTimer
      );

      resizeTimer = window.setTimeout(
        () => {
          isTransitioning = false;

          snapToRealSet();
          scheduleNextMove();
        },
        120
      );
    }
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      clearTimers();

      if (document.hidden) {
        return;
      }

      isTransitioning = false;

      snapToRealSet();
      scheduleNextMove();
    }
  );

  /*
    Build and position the carousel before revealing it.
  */
  window.requestAnimationFrame(
    () => {
      snapToRealSet();

      track.classList.add(
        "is-ready"
      );

      scheduleNextMove();
    }
  );
}

function centerPrintCard(
  stage,
  track,
  index,
  animate
) {
  const card =
    track.children[index];

  if (!card) {
    return;
  }

  track.classList.toggle(
    "is-animated",
    animate
  );

  const centeredOffset =
    card.offsetLeft -
    (
      (
        stage.clientWidth -
        card.offsetWidth
      ) / 2
    );

  track.style.transform =
    `translate3d(${-centeredOffset}px, 0, 0)`;
}