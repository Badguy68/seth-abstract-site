let currentShopCategory = "album";
const cartState = {};
let currentModalProductID = null;
let currentModalSide = "front";

//===================LOADING CARDS AND TABS=====================================
//Create each product card and add to page based on product info
//"./productimages/${product.image}.jpg"
function createShopCardHTML(product) {
  const quantity = getProductQuantity(product.id);
  const displayText = quantity > 0 ? quantity : "Add";
  const emptyClass = quantity > 0 ? "" : "is-empty";
  const selectedClass = quantity > 0 ? "is-selected" : "";

  return `
    <article class="shop-card ${selectedClass}" data-product-id="${product.id}">
      <button class="shop-card-image-button" type="button" aria-label="Open ${product.name} artwork">
        <img src="../home_assets/profile_pic_Art.png" alt="${product.name}">
      </button>

      <div class="shop-card-body">
        <h2 class="shop-card-title">${product.name}</h2>

        <div class="shop-card-price">
          $${product.price.toFixed(2)}
        </div>

        <div class="shop-card-controls">
          <button class="qty-btn qty-minus" type="button" aria-label="Decrease quantity">−</button>

          <button class="qty-display ${emptyClass}" type="button">
            <span class="qty-display-text">${displayText}</span>
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
function initializeShopPage() {
  initializeShopTabs();
  initializeShopGridEvents();
  renderShopProducts(currentShopCategory);
  updateCartUI();
  initializeShopModalEvents();
}
initializeShopPage();


//===================QUANTITY OF CARDS AND SAVING CARD STATES=====================================
function getProductQuantity(productId) {
  return cartState[productId] || 0;
}

function setProductQuantity(productId, quantity) {
  if (quantity <= 0) {
    delete cartState[productId];
  } else {
    cartState[productId] = quantity;
  }
}

function increaseProductQuantity(productId) {
  const currentQuantity = getProductQuantity(productId);
  setProductQuantity(productId, currentQuantity + 1);
}

function decreaseProductQuantity(productId) {
  const currentQuantity = getProductQuantity(productId);
  setProductQuantity(productId, currentQuantity - 1);
}


//===================STICKY CART STUFF=====================================
function getCartItemCount() {
  return Object.values(cartState).reduce((total, quantity) => total + quantity, 0);
}

//Crazy setup but properly multiplies each product by its quantity and price and totals all products
function getCartSubtotal() {
  return Object.entries(cartState).reduce((total, [productId, quantity]) => {
    const product = shopProducts.find((item) => item.id === productId);

    if (!product) return total;

    return total + product.price * quantity;
  }, 0);
}

function getCartDiscountAmount() {
  return 0;
}

function getCartTotal() {
  const subtotal = getCartSubtotal();
  const discount = getCartDiscountAmount();

  return subtotal - discount;
}

function updateCartUI() {
  const cartCountElement = document.getElementById("shop-cart-count");
  const cartDiscountElement = document.getElementById("shop-cart-discount");
  const cartTotalElement = document.getElementById("shop-cart-total");

  const itemCount = getCartItemCount();
  const discountAmount = getCartDiscountAmount();
  const totalAmount = getCartTotal();

  cartCountElement.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  cartDiscountElement.textContent = `Discount: $${discountAmount.toFixed(2)}`;
  cartTotalElement.textContent = `Total: $${totalAmount.toFixed(2)}`;
}

//After something changed totally refresh UI and products
function refreshShopUI() {
  renderShopProducts(currentShopCategory);
  updateCartUI();
}


//===================DEALING WITH ACTUAL QUANTITY BUTTONS AND BUTTONS / FLIPPING=====================================
function initializeShopGridEvents() {
  const shopGrid = document.getElementById("shop-grid");

  shopGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".shop-card");

    if (!card) return;

    const productId = card.dataset.productId;

    if (event.target.closest(".shop-card-image-button")) {
      openShopModal(productId);
      return;
    }

    if (event.target.closest(".qty-plus")) {
      increaseProductQuantity(productId);
      refreshShopUI();
      return;
    }

    if (event.target.closest(".qty-minus")) {
      decreaseProductQuantity(productId);
      refreshShopUI();
      return;
    }
  });
}

//===================POPUP IMAGE MODAL HANDLER STUFF=====================================
function getProductById(productId) {
  return shopProducts.find((product) => product.id === productId);
}

function updateModalImage() {
  const modalImage = document.getElementById("shop-modal-image");

  if (!currentModalProductID) return;

  const imageSrc =
    currentModalSide === "front"
      ? "./shop-front-images/" + currentModalProductID + ".jpg"
      : "./shop-back-images/" + currentModalProductID + ".jpg";

  modalImage.src = "../home_assets/profile_pic_Art.png"; //imageSrc;
  modalImage.alt = `${currentModalProductID} ${currentModalSide}`;
}

function openShopModal(productId) {
  const modal = document.getElementById("shop-modal");

  currentModalProductID = productId;
  currentModalSide = "front";

  updateModalImage();

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeShopModal() {
  const modal = document.getElementById("shop-modal");
  const modalImage = document.getElementById("shop-modal-image");

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");

  currentModalProductID = null;
  currentModalSide = "front";
  modalImage.src = "";
  modalImage.alt = "";
}

function flipShopModalCard() {
  const modalImage = document.getElementById("shop-modal-image");

  if (!currentModalProductID) return;

  modalImage.classList.add("is-flipping");

  setTimeout(() => {
    currentModalSide = currentModalSide === "front" ? "back" : "front";
    updateModalImage();
  }, 175);

  setTimeout(() => {
    modalImage.classList.remove("is-flipping");
  }, 350);
}

function initializeShopModalEvents() {
  const modal = document.getElementById("shop-modal");
  const modalBackdrop = modal.querySelector(".shop-modal-backdrop");
  const modalClose = document.getElementById("shop-modal-close");
  const modalImage = document.getElementById("shop-modal-image");

  modalBackdrop.addEventListener("click", closeShopModal);
  modalClose.addEventListener("click", closeShopModal);
  modalImage.addEventListener("click", flipShopModalCard);
}

