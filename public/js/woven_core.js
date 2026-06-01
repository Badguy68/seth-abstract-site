/* =========================================================
   WOVEN UPLOAD BASE
========================================================= */

const WOVEN_WEBHOOK_URL = "https://hook.us2.make.com/12f9afxunyvlepuxj18hf5tngolhmx0y";
const WOVEN_STORAGE_KEY = "wovenUploadSubmitted_Core";

const CANVAS_SIZE = 700;

let originalImage = null;

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
  localStorage.setItem(WOVEN_STORAGE_KEY, "true");
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

  applySaturationFilter();
}

function applySaturationFilter() {
  const canvas = getCanvas();
  const ctx = getContext();

  const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] / 255;
    const g = pixels[i + 1] / 255;
    const b = pixels[i + 2] / 255;

    const hsl = rgbToHsl(r, g, b);

    const h = hsl[0];
    const l = Math.max(hsl[2], 0.1);

    const saturatedRgb = hslToRgb(h, 1, l);

    pixels[i] = saturatedRgb[0] * 255;
    pixels[i + 1] = saturatedRgb[1] * 255;
    pixels[i + 2] = saturatedRgb[2] * 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;

    s = l > 0.5
      ? d / (2 - max - min)
      : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h = h / 6;
  }

  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r;
  let g;
  let b;

  if (s === 0) {
    r = l;
    g = l;
    b = l;
  } else {
    const q = l < 0.5
      ? l * (1 + s)
      : l + s - l * s;

    const p = 2 * l - q;

    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return [r, g, b];
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;

  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;

  return p;
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
    style: "core",
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
  getSubmitButton().addEventListener("click", handleSubmit);
}

initializeWovenUploadBase();