// git add .
// git commit -m "message"
// git push

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
    poem: "Charge of the Light Brigade",
    title: "Track 1",
    desc: "cinematic orchestral rock"
  },
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "Annabel Lee",
    title: "Track 2",
    desc: "dark rap with a grieving electric guitar"
  },
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "Stopping by Woods on a Snowy Evening",
    title: "Track 3",
    desc: "dramatic and haunting folk"
  },
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "A Dream Within a Dream",
    title: "Track 4",
    desc: "experimental dark synthwave"
  },
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "Toil and Trouble",
    title: "Track 5",
    desc: "witchy edm with a high energy beat"
  },
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "The Raven",
    title: "Track 6",
    desc: "energetic and flowing dark rap"
  },
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "She Walks in Beauty",
    title: "Track 7",
    desc: "funky and fun romantic pop"
  },
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "The Road Not Taken",
    title: "Track 8",
    desc: "glowing country featuring a folk choir"
  },
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "I could not stop for Death",
    title: "Track 9",
    desc: "driving alt-rock with powerful vocals"
  },
  {
    img: "./home_assets/living_archive_cover.png",
    poem: "Ozymandias",
    title: "Track 10",
    // desc: "epic cinematic metal with heavy storytelling"
    desc: "secret keyword: belief"
  }
];

let currentSong = 0;


function updateSong() {
  //Check if Easter Egg is active, if so, skip updating songs
  if (document.getElementById("easter-check").innerHTML.includes("Raven")) return;
  if (document.getElementById("easter-check2").innerHTML.includes("Raven")) return;

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