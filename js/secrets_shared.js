/* =========================================================
   COMMUNITY SECRET EXCHANGE
========================================================= */

/*
  Replace these later with your Make webhook URLs.
*/
const COMMUNITY_SUBMIT_WEBHOOK_URL = "PASTE_MAKE_SUBMIT_WEBHOOK_HERE";
const COMMUNITY_FETCH_WEBHOOK_URL = "PASTE_MAKE_FETCH_WEBHOOK_HERE";

const COMMUNITY_STORAGE_KEY = "communitySecretExchangeComplete";
const COMMUNITY_RECEIVED_SECRET_KEY = "communityReceivedSecret";

function getFormView() {
  return document.getElementById("secret-form-view");
}

function getResultView() {
  return document.getElementById("secret-result-view");
}

function getSecretInput() {
  return document.getElementById("community-secret-input");
}

function getFormMessage() {
  return document.getElementById("community-form-message");
}

function getReceivedSecretText() {
  return document.getElementById("community-received-secret-text");
}

function normalizeSecretText(text) {
  return text.trim();
}

function hasCompletedExchange() {
  return localStorage.getItem(COMMUNITY_STORAGE_KEY) === "true";
}

function saveCompletedExchange(receivedSecret) {
  localStorage.setItem(COMMUNITY_STORAGE_KEY, "true");
  localStorage.setItem(COMMUNITY_RECEIVED_SECRET_KEY, receivedSecret);
}

function getSavedReceivedSecret() {
  return localStorage.getItem(COMMUNITY_RECEIVED_SECRET_KEY);
}

function showFormView() {
  getFormView().classList.remove("is-hidden");
  getResultView().classList.add("is-hidden");
}

function showResultView(secretText) {
  getReceivedSecretText().textContent = secretText;

  getFormView().classList.add("is-hidden");
  getResultView().classList.remove("is-hidden");
}

function buildSubmitPayload(secretText) {
  return {
    secret: secretText,
    createdAt: new Date().toISOString(),
    source: "community-secret-page"
  };
}

async function submitSecretToMake(secretText) {
  const payload = buildSubmitPayload(secretText);

  const response = await fetch(COMMUNITY_SUBMIT_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Secret submit webhook failed.");
  }
}

async function fetchSecretsFromMake() {
  const response = await fetch(COMMUNITY_FETCH_WEBHOOK_URL);

  if (!response.ok) {
    throw new Error("Secret fetch webhook failed.");
  }

  return await response.json();
}

function chooseRandomSecret(secrets) {
  if (!Array.isArray(secrets) || secrets.length === 0) {
    return "No one has left anything here yet.";
  }

  /*
    Since your newly submitted secret should be newest,
    we ignore the final item in the array.

    This assumes Make returns secrets oldest → newest.
  */
  const usableSecrets = secrets.length > 1
    ? secrets.slice(0, -1)
    : secrets;

  const randomIndex = Math.floor(Math.random() * usableSecrets.length);

  return usableSecrets[randomIndex].secret;
}

async function handleCommunitySubmit(event) {
  event.preventDefault();

  const input = getSecretInput();
  const message = getFormMessage();

  const secretText = normalizeSecretText(input.value);

  if (secretText.length < 20) {
    message.textContent = "leave a little more behind";
    return;
  }

  try {
    const submitButton = document.querySelector(".community-submit");
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    await submitSecretToMake(secretText);

    const secrets = await fetchSecretsFromMake();
    const receivedSecret = chooseRandomSecret(secrets);

    saveCompletedExchange(receivedSecret);

    input.value = "";
    showResultView(receivedSecret);
  } catch (error) {
    console.error(error);
    message.textContent = "the exchange failed. try again later.";
  } finally {
    const submitButton = document.querySelector(".community-submit");
    submitButton.disabled = false;
    submitButton.textContent = "Send Secret";
  }
}

function initializeCommunitySecretPage() {
  if (hasCompletedExchange()) {
    const savedSecret = getSavedReceivedSecret();

    if (savedSecret) {
      showResultView(savedSecret);
      return;
    }
  }

  showFormView();

  document
    .getElementById("community-secret-form")
    .addEventListener("submit", handleCommunitySubmit);
}

initializeCommunitySecretPage();