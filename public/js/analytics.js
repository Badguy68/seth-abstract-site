
const gaScript = document.createElement("script");

gaScript.async = true;

gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-NB7LTYMNQJ";

document.head.appendChild(gaScript);

window.dataLayer = window.dataLayer || [];

function gtag() { dataLayer.push(arguments); }

gtag('js', new Date());

gtag('config', 'G-NB7LTYMNQJ');
