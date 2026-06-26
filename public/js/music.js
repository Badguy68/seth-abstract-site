const MUSIC_PRESAVE_WEBHOOK_URL = "https://hook.us2.make.com/ewmi52n15g1adbf6vf2aybcjvhetnndu";

function getPresaveForm() {
  return document.getElementById("music-presave-form");
}

function getPresaveEmail() {
  return document.getElementById("music-presave-email");
}

function getPresaveMessage() {
  return document.getElementById("music-presave-message");
}

function buildPresavePayload() {
  return {
    createdAt: new Date().toISOString(),
    email: getPresaveEmail().value.trim()
  };
}

async function sendPresaveToWebhook(payload) {
  const response = await fetch(MUSIC_PRESAVE_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Presave webhook failed.");
  }

  return response;
}

async function handlePresaveSubmit(event) {
  event.preventDefault();

  const form = getPresaveForm();
  const emailInput = getPresaveEmail();
  const message = getPresaveMessage();
  const button = form.querySelector("button");

  const email = emailInput.value.trim();

  if (!email) {
    message.textContent = "enter your email first";
    return;
  }

  try {
    button.disabled = true;
    button.textContent = "Submitting...";
    message.textContent = "";

    await sendPresaveToWebhook(buildPresavePayload());

    emailInput.value = "";
    message.textContent = "received. thank you.";
  } catch (error) {
    console.error(error);
    message.textContent = "something failed. try again.";
  } finally {
    button.disabled = false;
    button.textContent = "Submit";
  }
}

function initializeMusicPresave() {
  const form = getPresaveForm();

  if (!form) return;

  form.addEventListener("submit", handlePresaveSubmit);
}

initializeMusicPresave();