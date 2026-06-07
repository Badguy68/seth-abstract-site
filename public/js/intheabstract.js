/* =========================================================
   CLEAN URL
   Keeps hidden QR/passcode data useful on first load,
   then visually removes it from the address bar.
========================================================= */

function cleanAbstractUrl() {
  const cleanUrl = window.location.origin + window.location.pathname;

  if (window.location.search || window.location.hash) {
    window.history.replaceState({}, document.title, cleanUrl);
  }
}

/* =========================================================
   LOAD CURRENT WEEK
========================================================= */

function loadAbstractWeek() {
  const post = ABSTRACT_POSTS[CURRENT_ABSTRACT_WEEK];

  if (!post) {
    console.error("No abstract post found for:", CURRENT_ABSTRACT_WEEK);
    return;
  }

  document.getElementById("witness-count").textContent = post.witnessCount;
  document.getElementById("archive-week").textContent = post.weekNumber;
  document.getElementById("archive-updated").textContent = post.updated;

  document.getElementById("song-cover").src = post.currentListening.cover;
  document.getElementById("song-title").textContent = post.currentListening.title;
  document.getElementById("song-artist").textContent = post.currentListening.artist;

  document.getElementById("current-fragment").textContent = post.fragment;

  document.getElementById("weekly-post").innerHTML = post.blogHtml;

  document.getElementById("community-thought").innerHTML = post.voices.thought;
  document.getElementById("community-poem").innerHTML = post.voices.poem;
  document.getElementById("self-poem").innerHTML = post.voices.poemSelf;
}

/* =========================================================
   SUBMISSION FORM
========================================================= */

const ABSTRACT_WEBHOOK_URL = "https://hook.us2.make.com/yls82e8g8aq2mwnujx44q8lcrc3uii4j";

function setupAbstractForm() {
  const form = document.getElementById("abstract-submit-form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector("button");
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    const formData = new FormData(form);

    const payload = {
      type: formData.get("type"),
      message: formData.get("message")
    };

    try {
      const response = await fetch(ABSTRACT_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      form.reset();
      submitButton.textContent = "Sent";
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      submitButton.textContent = "Send to the Archive";
    } finally {
      submitButton.disabled = false;
    }
  });
}

/* =========================================================
   AUDIO PLAYERS
========================================================= */

function setupAudioPlayers() {

    // Setup end behavior
    document.querySelectorAll(".audio-entry audio").forEach(audio => {

        audio.addEventListener("ended", () => {

            // Return to beginning
            audio.currentTime = 0;

            // Pause
            audio.pause();

            // Restore play icon
            const button = audio
                .closest(".audio-entry")
                .querySelector(".audio-button");

            button.textContent = "▶";
        });

    });

    // Handle play/pause clicks
    document.addEventListener("click", function (e) {

        if (!e.target.classList.contains("audio-button")) return;

        const entry = e.target.closest(".audio-entry");

        const audio = entry.querySelector("audio");

        if (audio.paused) {

            // Pause all other players
            document.querySelectorAll(".audio-entry audio").forEach(a => {

                if (a !== audio) {

                    a.pause();
                    a.currentTime = 0;

                    const otherButton = a
                        .closest(".audio-entry")
                        .querySelector(".audio-button");

                    otherButton.textContent = "▶";
                }

            });

            // Play current audio
            audio.play();

            e.target.textContent = "❚❚";

        } else {

            audio.pause();

            e.target.textContent = "▶";
        }

    });

}

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadAbstractWeek();
  setupAbstractForm();
  setupAudioPlayers();
  cleanAbstractUrl();
});