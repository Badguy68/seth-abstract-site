async function loadComponent(selector, filePath) {
  const element = document.querySelector(selector);

  if (!element) return;

  const response = await fetch(filePath);
  const html = await response.text();

  element.innerHTML = html;
}

async function loadSiteLayout() {
  await loadComponent("#site-header", "/components/header.html");
  await loadComponent("#site-footer", "/components/footer.html");

  setActiveNavItem();
}

function setActiveNavItem() {
  const activePage = document.body.dataset.activePage;

  if (!activePage) return;

  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    const itemPage = item.dataset.page;
    item.classList.toggle("active", itemPage === activePage);
  });
}

loadSiteLayout();