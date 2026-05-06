/* =========================================================
   WOVEN GALLERY
========================================================= */

const TOTAL_IMAGES = 7;
const IMAGE_FOLDER = "/home_assets/hero_images/";
const IMAGE_EXTENSION = ".png";

const IMAGES_PER_LOAD = 16;

//Random starting number
let currentImageNumber = Math.floor(Math.random() * TOTAL_IMAGES) + 1;
let isLoadingImages = false;

function getImagePath(imageNumber) {
  return `${IMAGE_FOLDER}img${imageNumber}${IMAGE_EXTENSION}`;
}

function getNextImageNumber() {
  const nextNumber = currentImageNumber;

  currentImageNumber++;

  if (currentImageNumber > TOTAL_IMAGES) {
    currentImageNumber = 1;
  }

  return nextNumber;
}

function createGalleryItem(imageNumber) {
  const item = document.createElement("article");
  item.className = "gallery-item";

  const img = document.createElement("img");
  img.src = getImagePath(imageNumber);
  img.alt = `Woven image ${imageNumber}`;
  img.loading = "lazy";

  item.appendChild(img);

  return item;
}

function loadMoreImages() {
  if (isLoadingImages) return;

  isLoadingImages = true;

  const galleryGrid = document.getElementById("gallery-grid");

  for (let i = 0; i < IMAGES_PER_LOAD; i++) {
    const imageNumber = getNextImageNumber();
    const item = createGalleryItem(imageNumber);

    galleryGrid.appendChild(item);
  }

  isLoadingImages = false;
}

function initializeInfiniteScroll() {
  const sentinel = document.getElementById("gallery-sentinel");

  const observer = new IntersectionObserver((entries) => {
    const firstEntry = entries[0];

    if (firstEntry.isIntersecting) {
      loadMoreImages();
    }
  }, {
    root: null,
    rootMargin: "400px",
    threshold: 0
  });

  observer.observe(sentinel);
}

//Init The Gallery
loadMoreImages();
initializeInfiniteScroll();