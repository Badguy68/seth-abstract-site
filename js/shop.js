let currentShopCategory = "album";

//Create each product card and add to page based on product info
//"./productimages/${product.image}.jpg"
function createShopCardHTML(product) {
  return `
    <article class="shop-card" data-product-id="${product.id}">
      <button class="shop-card-image-button" type="button" aria-label="Open ${product.name} artwork">
        <img src="../home_assets/profile_pic_Art.png" alt="${product.name}">
      </button>

      <div class="shop-card-body">
        <h2 class="shop-card-title">${product.name}</h2>

        <div class="shop-card-controls">
          <button class="qty-btn qty-minus" type="button" aria-label="Decrease quantity">−</button>

          <button class="qty-display is-empty" type="button">
            <span class="qty-display-text">Add</span>
          </button>

          <button class="qty-btn qty-plus" type="button" aria-label="Increase quantity">+</button>
        </div>
      </div>
    </article>
  `;
}

//Actually load up the products based on category and put into html file
function renderShopProducts(category) {
  const shopGrid = document.getElementById("shop-grid");
  const tabDescription = document.getElementById("shop-tab-description");

  const filteredProducts = shopProducts.filter((product) => product.category === category);

  shopGrid.innerHTML = filteredProducts.map(createShopCardHTML).join("");
  tabDescription.textContent = shopTabDescriptions[category];
}

//Change visuals of the tab and run re-render of shop area
function setActiveTab(category) {
  currentShopCategory = category;

  const albumTab = document.getElementById("tab-album");
  const artTab = document.getElementById("tab-art");

  albumTab.classList.toggle("is-active", category === "album");
  artTab.classList.toggle("is-active", category === "art");

  renderShopProducts(category);
}

//Set up onclick functions for tabs
function initializeShopTabs() {
  const albumTab = document.getElementById("tab-album");
  const artTab = document.getElementById("tab-art");

  albumTab.addEventListener("click", () => setActiveTab("album"));
  artTab.addEventListener("click", () => setActiveTab("art"));
}

//Start Page
initializeShopTabs();
renderShopProducts(currentShopCategory);