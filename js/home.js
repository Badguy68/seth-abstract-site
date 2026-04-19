/* =========================================================
   HERO FONT ROTATION
   Purpose: Rotates the Seth Abstract display font
   ========================================================= */

const layers = document.querySelectorAll(".hero-font-layer");

let index = 0;
let interval = null;
let isAnimating = false;

function showLayer(i) {
  layers.forEach((layer, idx) => {
    layer.classList.toggle("is-active", idx === i);
  });
}

//RUNS ONCE SCROLL START
function start() {
  if (isAnimating) return;

  isAnimating = true;

  interval = setInterval(() => {
    index = (index + 1) % layers.length;
    showLayer(index);
  }, 100);

  startHeroImages();
}

//STOPS ON SCROLL BACK TO TOP
function stop() {
  if (!isAnimating) return;

  isAnimating = false;
  clearInterval(interval);
  interval = null;

  index = 0;
  showLayer(index);

  stopHeroImages();
}

window.addEventListener("scroll", () => {
  if (window.scrollY > 10) {
    start();
  } else {
    stop();
  }
});

showLayer(0);

/* =========================================================
   HERO IMAGE ROTATION
   ========================================================= */

const heroImageElements = document.querySelectorAll(".hero-grid-image");

const heroImages = [
  "./home_assets/hero_images/img1.png",
  "./home_assets/hero_images/img2.png",
  "./home_assets/hero_images/img3.png",
  "./home_assets/hero_images/img4.png",
  "./home_assets/hero_images/img5.png",
  "./home_assets/hero_images/img6.png"
];

const heroImageIntervals = [450, 320, 415, 210, 300];
//const heroImageIntervals = [280, 190, 150, 210, 300];

let heroImageTimers = [];

function setInitialHeroImages() {
  heroImageElements.forEach((img, i) => {
      img.src = heroImages[i];
  });
}

function getRandomHeroImage(currentSrc) {
  const currentFile = currentSrc.split("/").pop();
  const randomIndex = Math.floor(Math.random() * heroImages.length);
  
  if (heroImages[randomIndex].split("/").pop() == currentFile) {return getRandomHeroImage(currentSrc);}
  
  return heroImages[randomIndex];
}

let imageIndex = 0;

function startHeroImages() {
  if (heroImageTimers.length > 0) return;

  const timer = setInterval(() => {
    const img = heroImageElements[imageIndex];

    img.src = getRandomHeroImage(img.src);

    imageIndex = (imageIndex + 1) % heroImageElements.length;
  }, 180); //single global rhythm

  heroImageTimers.push(timer);
}

function stopHeroImages() {
  heroImageTimers.forEach((timer) => clearInterval(timer));
  heroImageTimers = [];

  setInitialHeroImages();

  imageIndex = 0;
}

setInitialHeroImages();




/* =========================================================
   ALBUM SONG SHOWCASE ROTATION
   ========================================================= */
const songs = [
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "She Walks in Beauty",
    title: "Track 1",
    desc: "A cinematic reinterpretation of Byron’s poem."
  },
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "Ozymandias",
    title: "Track 2",
    desc: "A powerful, decaying anthem inspired by Shelley."
  },
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "A Dream Within a Dream",
    title: "Track 3",
    desc: "A haunting reflection on time and illusion."
  }
];

let currentSong = 0;


function updateSong() {
  const song = songs[currentSong];

  document.getElementById("music-img").src = song.img;
  document.getElementById("music-poem").textContent = song.poem;
  document.getElementById("music-title").textContent = song.title;
  document.getElementById("music-desc").textContent = song.desc;
}

updateSong();

setInterval(() => {
  currentSong = (currentSong + 1) % songs.length;
  updateSong();
}, 2000);