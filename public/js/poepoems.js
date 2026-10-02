//Base setup
const wordPairs = Object.create(null);

//Connect to the UI
const writingArea = document.getElementById("writing");
const poemDisplay = document.getElementById("poem-display");
const poemPlaceholder = document.getElementById("poem-placeholder");
const autoPoeButton = document.getElementById("auto-poe");
const gameMessage = document.getElementById("game-message");
const wordForm = document.getElementById("word-form");
const submitWordButton = document.getElementById("submit-word");
const newLineButton = document.getElementById("new-line");
const finishPoemButton = document.getElementById("finish-poem");
const writingControls = document.getElementById("writing-controls");
const finishedControls = document.getElementById("finished-controls");
const copyPoemButton = document.getElementById("copy-poem");
const startAnotherButton = document.getElementById("start-another");
const clearPoemButton = document.getElementById("clear-poem");

//IMPORTANT VARS
const poemEntries = [];

let modelReady = false;
let poemFinished = false;
let poeTimer = null;
let wordCount = 0;

let automaticWordLimit = 100;

//TOKENIZE THE WORDS
function tokenize(text) {
    const normalizedText = text
        .normalize("NFC")
        .toLowerCase()
        .replace(/[‘’ʼ]/g, "'");

    return normalizedText.match(/\p{L}+(?:'\p{L}+)*/gu) ?? [];
}

//ADD WORD PAIRS TO OBJECT LIST
function addTexttoModel(text){
    //Load words into an array, filtering out punctuation and converting to lowercase
    const words = tokenize(text);

    //Loop through word array and add pairs to master object
    for (let i = 0; i < words.length - 1; i++) {
        const a = wordPairs[words[i]];
        if(a === undefined){wordPairs[words[i]] = Object.create(null);}

        const b = wordPairs[words[i]][words[i+1]];
        if(b === undefined){
            wordPairs[words[i]][words[i+1]] = 1;
        }
        else{
            wordPairs[words[i]][words[i+1]]++
        }
    }

}

//Create suggestions based off a word, returning an array
function getSuggestions(word) {
    const suggestList = wordPairs[word.toLowerCase()];

    if(suggestList === undefined){return [];}
    else{
        const convertedList = Object.entries(suggestList);
        convertedList.sort(function (wordA, wordB){
            return wordB[1] - wordA[1];
        })
        return convertedList;
    }
}

//Select a random word from the suggessted words
function selectNextWord(lastWord){
    const suggestions = getSuggestions(lastWord);

    if(suggestions.length < 1){return null;}

    let totalCount = 0;

    for(const s of suggestions){
        totalCount += s[1];
    }

    const rand = Math.random() * totalCount;

    let count = 0;
    for(const w of suggestions){
        count += w[1];

        if(count >= rand){return w[0]};
    }

    return suggestions[0][0];
}

//ADD POE WORD
function addPoeWord(){

    //Get the word need to add
    let newWord = "The";

    if(poemEntries.length > 0){
        let lastWord = "";

        for (let i = poemEntries.length - 1; i >= 0; i--) {
            const entry = poemEntries[i];

            if (entry.type === "word") {
                lastWord = entry.text;
                break;
            }
        }

        newWord = selectNextWord(lastWord);
    }

    //Handle no prediction!
    if(newWord === null){
        gameMessage.textContent = "Poe has no recorded response. Your turn again.";
        console.log("NO WORD");
        return;
    }
    

    //Add it to the text array for the new poem
    const newEntry = {
        type: "word",
        text: newWord,
        author: "poe"
    };
    poemEntries.push(newEntry);

    wordCount++;

    addNewWord();
}

//VISUAL OF POEM
function addNewWord(){
    let entry = poemEntries[poemEntries.length - 1];

    //ADD WORD
    if(entry.type === "word"){
        const lastNode = poemDisplay.lastChild;

        if (lastNode && lastNode.textContent !== "\n") {
            poemDisplay.appendChild(document.createTextNode(" "));
        }

        const span = document.createElement("span");

        span.textContent = entry.text;
        span.className = entry.author === "poe" ? "word-poe" : "word-player";

        span.setAttribute(
            "aria-label",
            `${entry.text}, by ${entry.author === "poe" ? "Poe" : "you"}`
        );

        if (entry.author === "poe") {
            span.classList.add("word-entering");
        }

        poemDisplay.appendChild(span);
        poemPlaceholder.hidden = true;

    }

    //ADD LINE BREAKS
    else{
        poemDisplay.appendChild(document.createTextNode("\n"));
        return;
    }
}

//PLAYER INPUT
function readPlayerWord() {
    const word = writingArea.value
        .trim()
        .normalize("NFC")
        .toLowerCase()
        .replace(/[‘’ʼ]/g, "'");

    if (!/^\p{L}+(?:'\p{L}+)*$/u.test(word)) {
        return null;
    }

    return word;
}

function playerTurnFinish(word, endLine=false){
    const newEntry = {
        type: "word",
        text: word,
        author: "player"
    };
    poemEntries.push(newEntry);

    addNewWord();

    if (endLine) {
        addLineBreak();
    }

    wordCount++;
    gameMessage.textContent = "";
    addPoeWord();
}

wordForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!modelReady || poeTimer !== null || poemFinished) {
        return;
    }

    const word = readPlayerWord();

    if (word === null) {
        gameMessage.textContent =
            "Enter one word without punctuation. Internal apostrophes are allowed.";
        return;
    }

    playerTurnFinish(word);

    writingArea.value = "";
    writingArea.focus();
});

newLineButton.addEventListener("click", function () {
    if (!modelReady || poeTimer !== null || poemFinished) {
        return;
    }

    const inputIsEmpty = writingArea.value.trim() === "";

    if (inputIsEmpty) {
        addLineBreak();

        writingArea.value = "";
        gameMessage.textContent = "New line. Your turn.";
        writingArea.focus();

        return;
    }

    const word = readPlayerWord();

    if (word === null) {
        gameMessage.textContent =
            "Enter one word without punctuation. Internal apostrophes are allowed.";
        return;
    }

    gameMessage.textContent = "";
    playerTurnFinish(word, true);

    writingArea.value = "";
    writingArea.focus();
});

//LINE BREAKS
function addLineBreak() {
    poemEntries.push({
        type: "lineBreak"
    });

    addNewWord();
}

//LOAD IN TRAINING TEXT
async function loadTrainingText() {
    const response = await fetch("./poe.txt");

    if (!response.ok) {
        throw new Error(`Could not load Raven: HTTP ${response.status}`);
    }

    const text = await response.text();
    console.log(text);

    addTexttoModel(text);

    console.log("Poe loaded:", Object.keys(wordPairs).length);

    modelReady = true;
    autoPoeButton.disabled = false;
    writingArea.disabled = false;
    submitWordButton.disabled = false;
    newLineButton.disabled = false;
    finishPoemButton.disabled = false;
    clearPoemButton.disabled = false;
    
    gameMessage.textContent = "Poe is ready. Select Let Poe write.";  
}

loadTrainingText();

//AUTO POE BUTTON
autoPoeButton.addEventListener("click", function () {
    automaticWordLimit = wordCount + 50;
    if (poeTimer === null) {
        startPoe();
    } else {
        stopPoe();
    }
});

function startPoe() {
    if (!modelReady || poeTimer !== null) {
        return;
    }

    wordCount = 0;

    autoPoeButton.textContent = "Pause Poe";
    gameMessage.textContent = "Poe is writing…";

    poeTimer = setInterval(addPoeWord, 350);

    // Produce the first word immediately.
    addPoeWord();
}

function stopPoe(message = "Poe is paused.") {
    clearInterval(poeTimer);
    poeTimer = null;

    autoPoeButton.textContent = "Let Poe write";
    gameMessage.textContent = message;
}

//FINISH THE POEM
finishPoemButton.addEventListener("click", function () {
    if (!modelReady || poemFinished) {
        return;
    }

    if (writingArea.value.trim() !== "") {
        gameMessage.textContent =
            "Add your typed word or clear it before finishing.";
        writingArea.focus();
        return;
    }

    const hasWords = poemEntries.some(function (entry) {
        return entry.type === "word";
    });

    if (!hasWords) {
        gameMessage.textContent = "Write at least one word before finishing.";
        return;
    }

    stopPoe();

    poemFinished = true;
    writingControls.hidden = true;
    finishedControls.hidden = false;

    gameMessage.textContent = "Your poem is complete.";
    copyPoemButton.focus();
});


function getPoemText() {
    let text = "";

    for (const entry of poemEntries) {
        if (entry.type === "lineBreak") {
            text += "\n";
        } else if (entry.type === "word") {
            if (text !== "" && !text.endsWith("\n")) {
                text += " ";
            }

            text += entry.text;
        }
    }

    return text;
}

copyPoemButton.addEventListener("click", async function () {
    if (!poemFinished) {
        return;
    }

    try {
        await navigator.clipboard.writeText(getPoemText());
        gameMessage.textContent = "Poem copied.";
    } catch (error) {
        console.error(error);
        gameMessage.textContent =
            "Could not copy automatically. Select the poem and copy it manually.";
    }
});

startAnotherButton.addEventListener("click", resetPoem);
clearPoemButton.addEventListener("click", resetPoem);

function resetPoem() {
    stopPoe();

    poemEntries.length = 0;
    wordCount = 0;
    poemFinished = false;

    poemDisplay.replaceChildren();
    poemPlaceholder.hidden = false;
    writingArea.value = "";

    writingControls.hidden = false;
    finishedControls.hidden = true;

    gameMessage.textContent = "A fresh page. Your turn.";
    writingArea.focus();
}
