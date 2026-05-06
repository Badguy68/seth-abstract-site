/* =========================================================
   COMMUNITY SECRET EXCHANGE
========================================================= */

/*
  Replace these later with your Make webhook URLs.
*/
const COMMUNITY_SUBMIT_WEBHOOK_URL = "https://hook.us2.make.com/yfzc0ohfgvizirbjztl7bip5kcw66wae";

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


function saveCompletedExchange(receivedSecret) {
  localStorage.setItem(COMMUNITY_STORAGE_KEY, "true");
  localStorage.setItem(COMMUNITY_RECEIVED_SECRET_KEY, receivedSecret);
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

//Send the secret to Make and get a random secret back in exchange.
async function submitSecretToMake(secretText) {
  const payload = {
    inputSecret: secretText,
  };

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

  return await response.json();
}



async function handleCommunitySubmit(event) {
  event.preventDefault();

  const input = getSecretInput();
  const message = getFormMessage();

  const secretText = input.value.trim();

  if (secretText.length < 20) {
    message.textContent = "leave a little more behind";
    return;
  }

  try {
    //Button Stuff
    const submitButton = document.querySelector(".community-submit");
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    //Send and get secret
    const secretReturn = await submitSecretToMake(secretText);
    const receivedSecret = secretReturn.secret;

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
  if (localStorage.getItem(COMMUNITY_STORAGE_KEY) === "true") {
    const savedSecret = localStorage.getItem(COMMUNITY_RECEIVED_SECRET_KEY);

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