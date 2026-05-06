/* =========================================================
   SIMPLE SECRET CHECK (NO HASHES)
========================================================= */

const SECRET_KEYWORD_HASHES = [
  "092cda390b47416151199357c71b71d07dbc1fc70a57399d2c91fe246691112c",
  "97d8b48aaf83f22eaea10489a20f4f85c880e0dbb22e5afe0522edd131d9c289",
  "f354ee99e2bc863ce19d80b843353476394ebc3530a51c9290d629065bacc3b3",
  "41ffd8b76afc92a65758fd9a080ae80421c196f251263b87cbfb6e567dda0879",
  "f31852d7e68e8ab270326b1dbb472a2e65ff1a80ed2f4672ff7b280cbfbd9c82"
];

function normalize(word) {
  return word.trim().toLowerCase();
}

function getUserInputs() {
  const inputs = document.querySelectorAll(".secret-input");
  return Array.from(inputs).map(input => normalize(input.value));
}

//Get user input and turn into hashes
async function getUserInputHashes() {
  const words = getUserInputs();

  const hashes = await Promise.all(
    words.map(word => sha256(word))
  );

  return hashes;
}

function arraysMatchAsSets(a, b) {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((val, i) => val === sortedB[i]);
}

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function handleSecretSubmit(e) {
  e.preventDefault();

  const message = document.getElementById("secret-message");
  const words = getUserInputs();

  if (words.some(w => w.length === 0)) {
    message.textContent = "enter five";
    return;
  }

  const userHashes = await getUserInputHashes();

  const isCorrect = arraysMatchAsSets(
    userHashes,
    SECRET_KEYWORD_HASHES
  );

  if (isCorrect) {
    message.textContent = "entering the abstract now";
    window.location.href = "/secrets/intheabstract/";
  } else {
    message.textContent = "something is not in the flow";
  }
}

function initializeSecretPage() {
  document
    .getElementById("secret-form")
    .addEventListener("submit", handleSecretSubmit);
}

initializeSecretPage();