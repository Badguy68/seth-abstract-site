/* =========================================================
   WOVEN UPLOAD BASE
========================================================= */

const WOVEN_WEBHOOK_URL = "https://hook.us2.make.com/12f9afxunyvlepuxj18hf5tngolhmx0y";
const WOVEN_STORAGE_KEY = "wovenUploadSubmitted";

const CANVAS_SIZE = 700;

let originalImage = null;
let currentThreshold = 128;

/* =========================================================
   ELEMENT HELPERS
========================================================= */

function getCanvas() {
  return document.getElementById("woven-canvas");
}

function getContext() {
  return getCanvas().getContext("2d");
}

function getImageInput() {
  return document.getElementById("woven-image-input");
}

function getSlider() {
  return document.getElementById("woven-threshold-slider");
}

function getSubmitButton() {
  return document.getElementById("woven-submit-button");
}

function getStatusMessage() {
  return document.getElementById("woven-status-message");
}

function getFormView() {
  return document.getElementById("woven-upload-form-view");
}

function getSuccessView() {
  return document.getElementById("woven-success-view");
}

/* =========================================================
   LOCAL STORAGE
========================================================= */

function hasAlreadySubmitted() {
  return localStorage.getItem(WOVEN_STORAGE_KEY) === "true";
}

function saveSuccessfulSubmission() {
  //localStorage.setItem(WOVEN_STORAGE_KEY, "true");
}

function showSuccessView() {
  getFormView().classList.add("is-hidden");
  getSuccessView().classList.remove("is-hidden");
}

/* =========================================================
   IMAGE LOADING
========================================================= */

function handleImageUpload(event) {
  const file = event.target.files[0];

  if (!file) return;

  const imageUrl = URL.createObjectURL(file);
  const img = new Image();

  img.onload = () => {
    originalImage = img;
    drawThresholdImage();

    URL.revokeObjectURL(imageUrl);
  };

  img.src = imageUrl;
}


/* =========================================================
   CANVAS DRAWING
========================================================= */

function getSquareCrop(image) {
  const sourceSize = Math.min(image.width, image.height);

  const sourceX = (image.width - sourceSize) / 2;
  const sourceY = (image.height - sourceSize) / 2;

  return {
    sourceX,
    sourceY,
    sourceSize
  };
}

function drawThresholdImage() {
  if (!originalImage) return;

  const canvas = getCanvas();
  const ctx = getContext();

  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const crop = getSquareCrop(originalImage);

  ctx.drawImage(
    originalImage,
    crop.sourceX,
    crop.sourceY,
    crop.sourceSize,
    crop.sourceSize,
    0,
    0,
    CANVAS_SIZE,
    CANVAS_SIZE
  );

  applyThresholdFilter();
}

function applyThresholdFilter() {
  const canvas = getCanvas();
  const ctx = getContext();

  const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];

    const brightness = (red + green + blue) / 3;
    const value = brightness >= currentThreshold ? 255 : 0;

    pixels[i] = value;
    pixels[i + 1] = value;
    pixels[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
}


/* =========================================================
   CONTROLS
========================================================= */

function handleThresholdChange(event) {
  currentThreshold = Number(event.target.value);
  drawThresholdImage();
}


/* =========================================================
   SUBMISSION
========================================================= */

function getCanvasBase64() {
  const canvas = getCanvas();

  return canvas.toDataURL("image/png");
}

function buildUploadPayload() {
  return {
    createdAt: new Date().toISOString(),
    style: "base",
    threshold: currentThreshold,
    imageWidth: CANVAS_SIZE,
    imageHeight: CANVAS_SIZE,
    imageBase64: getCanvasBase64()
  };
}

async function sendImageToWebhook(payload) {
  const response = await fetch(WOVEN_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Upload webhook failed.");
  }

  return response;
}

async function handleSubmit() {
  const status = getStatusMessage();
  const submitButton = getSubmitButton();

  if (!originalImage) {
    status.textContent = "choose an image first";
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    status.textContent = "";

    const payload = buildUploadPayload();

    await sendImageToWebhook(payload);

    saveSuccessfulSubmission();
    showSuccessView();
  } catch (error) {
    console.error(error);
    status.textContent = "something failed. try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Accept Image";
  }
}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeWovenUploadBase() {
  if (hasAlreadySubmitted()) {
    showSuccessView();
    return;
  }

  getImageInput().addEventListener("change", handleImageUpload);
  getSlider().addEventListener("input", handleThresholdChange);
  getSubmitButton().addEventListener("click", handleSubmit);
}

initializeWovenUploadBase();