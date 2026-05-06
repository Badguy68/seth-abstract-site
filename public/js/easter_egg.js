//EGG FUCNTION TO REPLACE ALL WORDS WITH WORD WITH A DELAY
function replaceWithDelay(node, theWord) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (!node.nodeValue.trim()) return;

    const words = node.nodeValue.split(/\b/);

    words.forEach((word, i) => {
      if (/\w+/.test(word)) {
        setTimeout(() => {
          words[i] = theWord;
          node.nodeValue = words.join("");
        }, Math.random() * 1500);
      }
    });
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (["SCRIPT", "STYLE"].includes(node.tagName)) return;
    node.childNodes.forEach(child => replaceWithDelay(child, theWord));
  }
}