const SHOP_WEBHOOK_URL = "https://hook.us2.make.com/k53rdemx7o9jg7hcl19ye876vybexlhm";

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
        <img src="./shop-front-images/${product.id}.jpg" alt="${product.name}">
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
  initializeCheckoutOverlayEvents()
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

    //Check what was pressed and run the logic
    if (event.target.closest(".qty-display")) {
      const currentQuantity = getProductQuantity(productId);

      if (currentQuantity === 0) {
        increaseProductQuantity(productId);
        refreshShopUI();
      }

      return;
    }

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

  modalImage.src = imageSrc;
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


//===================CART CHECKOUT SYSTEM=====================================
function getCartItemsDetailed() {
  return Object.entries(cartState)
    .map(([productId, quantity]) => {
      const product = getProductById(productId);

      if (!product) return null;

      return {
        id: product.id,
        name: product.name,
        catalog_object_id: product.square,
        quantity,
        price: product.price,
        lineTotal: product.price * quantity
      };
    })
    .filter(Boolean);
}

function buildOrderPayload() {
  const email = document.getElementById("shop-checkout-email").value.trim();
  const marketingOptIn = document.getElementById("shop-checkout-optin").checked;

  return {
    createdAt: new Date().toISOString(),
    email,
    marketingOptIn,
    items: getCartItemsDetailed()
  };
}

function renderCheckoutOverlay() {
  const checkoutItemsElement = document.getElementById("shop-checkout-items");
  const checkoutItemCountElement = document.getElementById("shop-checkout-item-count");
  const checkoutDiscountElement = document.getElementById("shop-checkout-discount");
  const checkoutTotalElement = document.getElementById("shop-checkout-total");

  const items = getCartItemsDetailed();
  const itemCount = getCartItemCount();
  const discount = getCartDiscountAmount();
  const total = getCartTotal();

  if (items.length === 0) {
    checkoutItemsElement.innerHTML = `
      <div class="shop-checkout-item">
        <div class="shop-checkout-item-name">Your cart is empty</div>
      </div>
    `;
  } else {
    checkoutItemsElement.innerHTML = items.map((item) => `
      <div class="shop-checkout-item">
        <div class="shop-checkout-item-name">${item.name}</div>
        <div class="shop-checkout-item-meta">
          ${item.quantity} × $${item.price.toFixed(2)}
        </div>
      </div>
    `).join("");
  }

  checkoutItemCountElement.textContent = itemCount;
  checkoutDiscountElement.textContent = `$${discount.toFixed(2)}`;
  checkoutTotalElement.textContent = `$${total.toFixed(2)}`;
}

function openCheckoutOverlay() {
  const overlay = document.getElementById("shop-checkout-overlay");

  renderCheckoutOverlay();

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
}

function closeCheckoutOverlay() {
  const overlay = document.getElementById("shop-checkout-overlay");

  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

async function sendPendingOrderToWebhook(orderPayload) {
  const response = await fetch(SHOP_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(orderPayload)
  });

  if (!response.ok) {
    throw new Error("Failed to send order to webhook.");
  }

  return response.json();
}

async function handleCheckoutSubmit() {
  const itemCount = getCartItemCount();

  if (itemCount === 0) {
    alert("Your cart is empty.");
    return;
  }

  const emailInput = document.getElementById("shop-checkout-email");
  const email = emailInput.value.trim();

  if (!email) {
    alert("Please enter your email before continuing.");
    emailInput.focus();
    return;
  }

  const orderPayload = buildOrderPayload();

  try {
    const submitButton = document.getElementById("shop-checkout-submit");
    submitButton.disabled = true;
    submitButton.textContent = "Continuing...";

    

  // Create webhook-safe copy
  const webhookPayload = {
    ...orderPayload,
    items: orderPayload.items.map(item => ({
      ...item,
      quantity: String(item.quantity)
    }))
  };

  const response = await sendPendingOrderToWebhook(webhookPayload);

  console.log("Received response from webhook:", response);
    window.location.href = response.checkoutUrl;
  } catch (error) {
    alert("Something went wrong while preparing checkout. Please try again.");
    console.error(error);
  } finally {
    const submitButton = document.getElementById("shop-checkout-submit");
    submitButton.disabled = false;
    submitButton.textContent = "Checkout";
  }
}


//===================PAGE INITIALIZATION=====================================

function applySecretCardFromUrl() {
  const params = new URLSearchParams(window.location.search);

  if (!params.get("gated") === "true") return;

  setProductQuantity("thekey", 1);

  window.history.replaceState({}, "", "/shop/");
}

function initializeCheckoutOverlayEvents() {
  const overlay = document.getElementById("shop-checkout-overlay");
  const backdrop = overlay.querySelector(".shop-checkout-backdrop");
  const backButton = document.getElementById("shop-checkout-close");
  const openButton = document.getElementById("shop-cart-open-checkout");
  const submitButton = document.getElementById("shop-checkout-submit");

  applySecretCardFromUrl();

  openButton.addEventListener("click", openCheckoutOverlay);
  backButton.addEventListener("click", closeCheckoutOverlay);
  backdrop.addEventListener("click", closeCheckoutOverlay);
  submitButton.addEventListener("click", handleCheckoutSubmit);

  updateCartUI();
}



