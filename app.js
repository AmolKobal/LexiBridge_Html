const frenchInput = document.getElementById("frenchWord");
const englishInput = document.getElementById("englishWord");
const categorySelect = document.getElementById("categorySelect");
const tagsInput = document.getElementById("tagsInput");
const addBtn = document.getElementById("addBtn");
const wordList = document.getElementById("wordList");
const searchInput = document.getElementById("searchInput");

const categoryFilter = document.getElementById("categoryFilter");
const tagFilters = document.getElementById("tagFilters");

const totalCount = document.getElementById("totalCount");
const learnedCount = document.getElementById("learnedCount");
const remainingCount = document.getElementById("remainingCount");

let selectedTag = "";

let vocabulary = JSON.parse(localStorage.getItem("vocabulary")) || [];
let editIndex = null;

function saveToStorage() {
    localStorage.setItem("vocabulary", JSON.stringify(vocabulary));
}

function renderWords() {
    const search = searchInput.value.toLowerCase();
    const category = categoryFilter.value;

    wordList.innerHTML = "";

    const filtered = vocabulary.filter(word => {
        const matchesSearch =
            word.french.toLowerCase().includes(search) ||
            word.english.toLowerCase().includes(search) ||
            word.tags.join(",").toLowerCase().includes(search);

        const matchesCategory =
            !category || word.category === category;

        const matchesTag =
            !selectedTag || word.tags.includes(selectedTag);

        return matchesSearch && matchesCategory && matchesTag;
    });

    filtered.forEach((word, index) => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.innerHTML = `
            <strong>${word.french}</strong> → ${word.english}
            <em>(${word.category || "Uncategorized"})</em>
            `;
        if (word.learned) {
            span.classList.add("learned");
            li.classList.add("learned");
        }

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
            word.learned = !word.learned;
            saveToStorage();
            renderWords();
            renderTagFilters();
            updateStats();
        };

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.onclick = () => loadForEdit(index);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => {
            vocabulary.splice(index, 1);
            saveToStorage();
            renderWords();
            renderTagFilters();
            updateStats();
        };

        actions.append(learnBtn, editBtn, deleteBtn);
        li.append(span, actions);

        wordList.appendChild(li);
    });

    updateStats();
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

function renderTagFilters() {
    tagFilters.innerHTML = "";

    const allTags = [...new Set(vocabulary.flatMap(w => w.tags))];

    allTags.forEach(tag => {
        const chip = document.createElement("span");
        chip.textContent = tag;
        chip.classList.add("filter-chip");

        if (tag === selectedTag) chip.classList.add("active");

        chip.onclick = () => {
            selectedTag = selectedTag === tag ? "" : tag;
            renderTagFilters();
            renderWords();
        };

        tagFilters.appendChild(chip);
    });
}

function updateStats() {
    const total = vocabulary.length;
    const learned = vocabulary.filter(w => w.learned).length;

    totalCount.textContent = total;
    learnedCount.textContent = learned;
    remainingCount.textContent = total - learned;
}

searchInput.oninput = renderWords;
categoryFilter.onchange = renderWords;

// Initial render
renderWords();
