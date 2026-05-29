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

  document.getElementById("community-thought").textContent = post.voices.thought;
  document.getElementById("community-poem").innerHTML = post.voices.poem;
  document.getElementById("self-poem").innerHTML = post.voices.poemSelf;
}

/* =========================================================
   SUBMISSION FORM
   Replace WEBHOOK_URL with your Make webhook.
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
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadAbstractWeek();
  setupAbstractForm();
  cleanAbstractUrl();
});