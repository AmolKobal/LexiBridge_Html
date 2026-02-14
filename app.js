const frenchInput = document.getElementById("frenchWord");
const englishInput = document.getElementById("englishWord");
const categorySelect = document.getElementById("categorySelect");
const tagsInput = document.getElementById("tagsInput");
const addBtn = document.getElementById("addBtn");
const wordList = document.getElementById("wordList");
const searchInput = document.getElementById("searchInput");

let vocabulary = JSON.parse(localStorage.getItem("vocabulary")) || [];
let editIndex = null;

function saveToStorage() {
    localStorage.setItem("vocabulary", JSON.stringify(vocabulary));
}

function renderWords(filter = "") {
    wordList.innerHTML = "";

    vocabulary
        .filter(word =>
            word.french.toLowerCase().includes(filter.toLowerCase()) ||
            word.english.toLowerCase().includes(filter.toLowerCase()) ||
            word.category.toLowerCase().includes(filter.toLowerCase()) ||
            word.tags.join(",").toLowerCase().includes(filter.toLowerCase())
        )
        .forEach((word, index) => {
            const li = document.createElement("li");

            const span = document.createElement("span");
            span.innerHTML = `
        <strong>${word.french}</strong> → ${word.english}
        <em>(${word.category || "Uncategorized"})</em>
      `;
            if (word.learned) span.classList.add("learned");

            // Tags
            if (word.tags) {
                word.tags.forEach(tag => {
                    const tagEl = document.createElement("span");
                    tagEl.classList.add("tag");
                    tagEl.textContent = tag;
                    span.appendChild(tagEl);
                });
            }

            const actions = document.createElement("div");
            actions.classList.add("actions");

            const learnBtn = document.createElement("button");
            learnBtn.textContent = word.learned ? "Unlearn" : "Learned";
            learnBtn.onclick = () => {
                vocabulary[index].learned = !vocabulary[index].learned;
                saveToStorage();
                renderWords(searchInput.value);
            };

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.onclick = () => loadForEdit(index);

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.onclick = () => {
                vocabulary.splice(index, 1);
                saveToStorage();
                renderWords(searchInput.value);
            };

            actions.append(learnBtn, editBtn, deleteBtn);
            li.append(span, actions);

            wordList.appendChild(li);
        });
}

function loadForEdit(index) {
    const word = vocabulary[index];

    frenchInput.value = word.french;
    englishInput.value = word.english;
    categorySelect.value = word.category;
    tagsInput.value = word.tags.join(", ");

    editIndex = index;
}

addBtn.onclick = () => {
    const french = frenchInput.value.trim();
    const english = englishInput.value.trim();
    const category = categorySelect.value;
    const tags = tagsInput.value
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

    if (!french || !english) {
        alert("Enter both French and English words");
        return;
    }

    const wordData = {
        french,
        english,
        learned: false,
        category,
        tags
    };

    if (editIndex !== null) {
        vocabulary[editIndex] = {
            ...vocabulary[editIndex],
            french,
            english,
            category,
            tags
        };
        editIndex = null;
    } else {
        vocabulary.push(wordData);
    }

    frenchInput.value = "";
    englishInput.value = "";
    categorySelect.value = "";
    tagsInput.value = "";

    saveToStorage();
    renderWords(searchInput.value);
};

searchInput.oninput = (e) => {
    renderWords(e.target.value);
};

// Initial render
renderWords();
