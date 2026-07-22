const SONG_DATABASE_URL = "./songs.json";

async function loadSongPage() {
  const statusElement = document.getElementById("song-status");
  const contentElement = document.getElementById("song-content");
  const noteElement = document.getElementById("song-note");

  // Read the value after ?song=
  const parameters = new URLSearchParams(window.location.search);

  const songID = parameters.get("song")?.trim().toLowerCase();

  // Stop if no song was provided
  if (!songID) {
    showSongError("No song was selected.");
    return;
  }

  try {
    // Load the JSON database
    const response = await fetch(SONG_DATABASE_URL);

    const songs = await response.json();

    // Find the entry matching the URL
    const song = songs[songID];

    if (!song) {
      showSongError("Sorry, that song could not be found.");
      return;
    }

    // Insert the song information
    document.getElementById("song-title").textContent = song.title;
    document.getElementById("song-description").textContent =
      song.description;

    const coverElement = document.getElementById("song-cover");

    coverElement.src = `./album-covers/${songID}.jpg`;
    coverElement.alt =`${song.title} album cover`;

    // Update the platform cards
    document
      .querySelectorAll("[data-platform]")
      .forEach((platformCard) => {
        const platformName = platformCard.dataset.platform;
        const platformURL = song.links?.[platformName];

        if (platformURL) {
          platformCard.href = platformURL;
          platformCard.hidden = false;
        } else {
          platformCard.hidden = true;
        }
      });

    // Update the browser tab
    document.title = `${song.title}`;

    // Update the page description
    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    );

    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", song.description);
    }

    // Reveal the completed page
    statusElement.hidden = true;
    contentElement.hidden = false;
    noteElement.hidden = false;
  } catch (error) {
    showSongError(
      "The song information could not be loaded. Please try again."
    );
  }
}

function showSongError(message) {
  const statusElement = document.getElementById("song-status");
  statusElement.textContent = message;
}

loadSongPage();