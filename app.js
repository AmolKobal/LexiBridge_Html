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

const quizCategory = document.getElementById("quizCategory");
const quizTag = document.getElementById("quizTag");
const startQuizBtn = document.getElementById("startQuizBtn");

const quizBox = document.getElementById("quizBox");
const quizQuestion = document.getElementById("quizQuestion");
const quizAnswer = document.getElementById("quizAnswer");
const submitAnswerBtn = document.getElementById("submitAnswerBtn");
const quizFeedback = document.getElementById("quizFeedback");
const quizScore = document.getElementById("quizScore");
const concludeQuizBtn = document.getElementById("concludeQuizBtn");


let quizWords = [];
let currentQuestion = null;
let score = 0;
let totalQuestions = 0;

let currentIndex = 0;
let quizResults = [];


const confirmModal = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

let confirmCallback = null;

const toast = document.getElementById("toast");

function showToast(message, type = "info") {
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.className = "toast hidden";
    }, 2000);
}

///////////////////////////////////////////////////////

quizAnswer.style.display = "block";
submitAnswerBtn.style.display = "block";
concludeQuizBtn.style.display = "block";

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
            word.tags?.join(",").toLowerCase().includes(search);

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
            populateQuizTags();
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
            populateQuizTags();
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
    renderTagFilters();
    populateQuizTags();
    updateStats();
    renderWords(searchInput.value);

    showToast("Word saved!", "success");
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

function populateQuizTags() {
    quizTag.innerHTML = `<option value="">All Tags</option>`;

    const allTags = [...new Set(vocabulary.flatMap(w => w.tags))];

    allTags.forEach(tag => {
        const option = document.createElement("option");
        option.value = tag;
        option.textContent = tag;
        quizTag.appendChild(option);
    });
}

startQuizBtn.onclick = () => {
    const selectedCategory = quizCategory.value;
    const selectedTag = quizTag.value;

    quizWords = vocabulary.filter(word => {
        const matchCategory = !selectedCategory || word.category === selectedCategory;
        const matchTag = !selectedTag || word.tags.includes(selectedTag);
        return matchCategory && matchTag;
    });

    if (quizWords.length === 0) {
        alert("No words match selected filters");
        return;
    }

    shuffle(quizWords);

    currentIndex = 0;
    score = 0;
    quizResults = [];

    quizBox.classList.remove("hidden");

    showQuestion();
};


function nextQuestion() {
    quizFeedback.textContent = "";
    quizAnswer.value = "";

    const randomIndex = Math.floor(Math.random() * quizWords.length);
    currentQuestion = quizWords[randomIndex];

    quizQuestion.textContent = `Translate: ${currentQuestion.french}`;
    quizScore.textContent = `Score: ${score} / ${totalQuestions}`;
}

submitAnswerBtn.onclick = () => {
    const word = quizWords[currentIndex];
    const userAnswer = quizAnswer.value.trim();
    const correctAnswer = word.english;

    const isCorrect =
        userAnswer.toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
        score++;
        quizFeedback.textContent = "✅ Correct!";
        quizFeedback.className = "correct";
        showToast("Correct answer!", "success");
    } else {
        quizFeedback.textContent = `❌ Wrong! → ${correctAnswer}`;
        quizFeedback.className = "wrong";
        showToast("Wrong answer!", "error");
    }

    quizResults.push({
        french: word.french,
        correctAnswer,
        userAnswer,
        isCorrect
    });

    currentIndex++;

    setTimeout(showQuestion, 800);
};

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showQuestion() {
    quizFeedback.textContent = "";
    quizAnswer.value = "";

    if (currentIndex >= quizWords.length) {
        finishQuiz();
        return;
    }

    const word = quizWords[currentIndex];

    quizQuestion.textContent =
        `(${currentIndex + 1}/${quizWords.length}) Translate: ${word.french}`;

    quizScore.textContent = `Score: ${score}`;
}

function finishQuiz(concludedEarly = false) {
    const attempted = quizResults.length;
    const wrongAnswers = quizResults.filter(r => !r.isCorrect);

    quizQuestion.textContent =
        concludedEarly ? "🛑 Quiz Concluded" : "🎉 Quiz Completed!";

    quizAnswer.style.display = "none";
    submitAnswerBtn.style.display = "none";
    concludeQuizBtn.style.display = "none";

    quizFeedback.className = "";
    quizFeedback.innerHTML = `
    <strong>Results</strong><br/><br/>
    Total Questions: ${quizWords.length} <br/>
    Attempted: ${attempted} <br/>
    Correct: ${score} <br/>
    Accuracy: ${attempted ? Math.round((score / attempted) * 100) : 0}% 
    <br/><br/>

    ${wrongAnswers.length ?
            `<button id="reviewWrongBtn">Review Wrong Answers</button>` :
            `<em>Perfect Score! 🎉</em>`}
      
    <br/><br/>
    <button id="restartQuizBtn">Restart Quiz</button>
  `;

    document
        .getElementById("restartQuizBtn")
        .onclick = resetQuiz;

    if (wrongAnswers.length) {
        document
            .getElementById("reviewWrongBtn")
            .onclick = reviewWrongAnswers;
    }
}

function reviewWrongAnswers() {
    const wrongAnswers = quizResults.filter(r => !r.isCorrect);

    quizQuestion.textContent = "📉 Wrong Answers Review";
    quizFeedback.className = "";

    quizFeedback.innerHTML = wrongAnswers
        .map(r => `
            <div class="review-item">
                <strong>${r.french}</strong><br/>
                Your Answer: <span class="wrong">${r.userAnswer || "(blank)"}</span><br/>
                Correct Answer: <span class="correct">${r.correctAnswer}</span>
            </div>
            <hr/>`)
        .join("");

    quizScore.textContent = "";
}

function resetQuiz() {
    quizBox.classList.add("hidden");

    quizAnswer.style.display = "block";
    submitAnswerBtn.style.display = "block";
    concludeQuizBtn.style.display = "block";

    quizAnswer.value = "";
    quizFeedback.textContent = "";
    quizScore.textContent = "";
}

concludeQuizBtn.onclick = () => {
    showConfirm(
        "Are you sure you want to conclude the quiz?",
        () => finishQuiz(true)
    );
};

function showConfirm(message, onYes) {
    confirmMessage.textContent = message;
    confirmModal.classList.remove("hidden");

    confirmCallback = onYes;
}

confirmNo.onclick = () => {
    confirmModal.classList.add("hidden");
    confirmCallback = null;
};

confirmYes.onclick = () => {
    confirmModal.classList.add("hidden");

    if (confirmCallback) {
        confirmCallback();
    }

    confirmCallback = null;
};

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        confirmModal.classList.add("hidden");
    }
});


searchInput.oninput = renderWords;
categoryFilter.onchange = renderWords;

// Initial render
renderWords();
renderTagFilters();
populateQuizTags();
updateStats();
