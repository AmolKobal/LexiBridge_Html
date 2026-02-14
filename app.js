const frenchInput = document.getElementById("frenchWord");
const englishInput = document.getElementById("englishWord");
const addBtn = document.getElementById("addBtn");
const wordList = document.getElementById("wordList");
const searchInput = document.getElementById("searchInput");

let vocabulary = JSON.parse(localStorage.getItem("vocabulary")) || [];

function saveToStorage() {
    localStorage.setItem("vocabulary", JSON.stringify(vocabulary));
}

function renderWords(filter = "") {
    wordList.innerHTML = "";

    vocabulary
        .filter(word =>
            word.french.toLowerCase().includes(filter.toLowerCase()) ||
            word.english.toLowerCase().includes(filter.toLowerCase())
        )
        .forEach((word, index) => {
            const li = document.createElement("li");

            const span = document.createElement("span");
            span.textContent = `${word.french} → ${word.english}`;
            if (word.learned) span.classList.add("learned");

            const actions = document.createElement("div");
            actions.classList.add("actions");

            const learnBtn = document.createElement("button");
            learnBtn.textContent = word.learned ? "Unlearn" : "Learned";
            learnBtn.onclick = () => {
                vocabulary[index].learned = !vocabulary[index].learned;
                saveToStorage();
                renderWords(searchInput.value);
            };

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.onclick = () => {
                vocabulary.splice(index, 1);
                saveToStorage();
                renderWords(searchInput.value);
            };

            actions.appendChild(learnBtn);
            actions.appendChild(deleteBtn);

            li.appendChild(span);
            li.appendChild(actions);

            wordList.appendChild(li);
        });
}

addBtn.onclick = () => {
    const french = frenchInput.value.trim();
    const english = englishInput.value.trim();

    if (!french || !english) {
        alert("Please enter both words");
        return;
    }

    vocabulary.push({ french, english, learned: false });

    frenchInput.value = "";
    englishInput.value = "";

    saveToStorage();
    renderWords();
};

searchInput.oninput = (e) => {
    renderWords(e.target.value);
};

// Initial render
renderWords();
