const frenchInput = document.getElementById("frenchWord");
const englishInput = document.getElementById("englishWord");
const categorySelect = document.getElementById("categorySelect");
const tagsInput = document.getElementById("tagsInput");
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

const quizProgress = document.getElementById("quizProgress");

const darkModeToggle = document.getElementById("darkModeToggle");

const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");
const completeSound = document.getElementById("complete");

const quizStreak = document.getElementById("quizStreak");

let streak = Number(localStorage.getItem("streak")) || 0;

const vocabSection = document.getElementById("vocabSection");
const quizSection = document.getElementById("quizSection");

const showVocabBtn = document.getElementById("showVocabBtn");
const showAddBtn = document.getElementById("showAddBtn");
const showQuizBtn = document.getElementById("showQuizBtn");

const navButtons = [
    showVocabBtn,
    showQuizBtn
];

quizAnswer.style.display = "block";
submitAnswerBtn.style.display = "block";
concludeQuizBtn.style.display = "block";

const navIndicator = document.getElementById("navIndicator");


const wordModal = document.getElementById("wordModal");
const modalTitle = document.getElementById("modalTitle");
const modalFrench = document.getElementById("modalFrench");
const modalEnglish = document.getElementById("modalEnglish");
const modalCategory = document.getElementById("modalCategory");
const modalTags = document.getElementById("modalTags");

const openAddModal = document.getElementById("openAddModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveWordBtn = document.getElementById("saveWordBtn");

let editingWordId = null;

///////////////////////////////////////////////////////

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
            <em class="category">(${word.category || "Uncategorized"})</em>
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

function startQuiz() {

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

startQuizBtn.onclick = startQuiz;

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
        streak++;
        score++;
        quizFeedback.textContent = "✅ Correct!";
        quizFeedback.className = "correct";
        showToast("Correct answer!", "success");
        playSound(true);
    } else {
        streak = 0;
        quizFeedback.textContent = `❌ Wrong! → ${correctAnswer}`;
        quizFeedback.className = "wrong";
        showToast("Wrong answer!", "error");
        playSound(false);
    }

    saveStreak();
    updateStreakUI();

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

    updateProgress();
}

function finishQuiz(concludedEarly = false) {

    playCompleteSound();

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
        <button id="restartQuizBtn">Restart Quiz</button>`;

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

    streak = 0;
    saveStreak();
    updateStreakUI();

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

function showToast(message, type = "info") {
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.className = "toast hidden";
    }, 2000);
}

function updateProgress() {
    const percent = ((currentIndex) / quizWords.length) * 100;
    quizProgress.style.width = `${percent}%`;
}

const darkToggle = document.getElementById("darkModeToggle");

darkToggle.checked = localStorage.getItem("darkMode") === "true";

darkToggle.onchange = () => {
    document.body.classList.toggle("dark", darkToggle.checked);
    localStorage.setItem("darkMode", darkToggle.checked);
};

if (darkToggle.checked) {
    document.body.classList.add("dark");
}

function playSound(isCorrect) {
    if (isCorrect) {
        correctSound.currentTime = 0;
        correctSound.play();
    } else {
        wrongSound.currentTime = 0;
        wrongSound.play();
    }
}

function playCompleteSound() {
    completeSound.currentTime = 0;
    completeSound.play();
}

function saveStreak() {
    localStorage.setItem("streak", streak);
}

function updateStreakUI() {
    quizStreak.textContent = `🔥 Streak: ${streak}`;
}

function showSection(section, button) {
    [vocabSection, quizSection]
        .forEach(sec => sec.classList.add("hidden"));

    setTimeout(() => {
        section.classList.remove("hidden");
    }, 50); // tiny delay = smoother animation

    setActiveButton(button);
}

showVocabBtn.onclick = () => location.hash = "#vocab";
showQuizBtn.onclick = () => location.hash = "#quiz";

function setActiveButton(activeBtn) {
    navButtons.forEach(btn => btn.classList.remove("active"));
    activeBtn.classList.add("active");
}

setActiveButton(showVocabBtn);

function moveIndicator(index) {
    navIndicator.style.transform = `translateX(${index * 100}%)`;
}

function setActiveButton(activeBtn) {
    navButtons.forEach(btn => btn.classList.remove("active"));
    activeBtn.classList.add("active");

    const index = navButtons.indexOf(activeBtn);
    moveIndicator(index);
}

function router() {
    const hash = window.location.hash || "#vocab";

    if (hash === "#quiz") showSection(quizSection, showQuizBtn);
    else showSection(vocabSection, showVocabBtn);
}

window.addEventListener("hashchange", router);
window.addEventListener("load", router);

// Swipe
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener("touchend", e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const diff = touchEndX - touchStartX;

    if (Math.abs(diff) < 50) return;

    const currentIndex = navButtons.findIndex(btn =>
        btn.classList.contains("active")
    );

    if (diff < 0 && currentIndex < navButtons.length - 1) {
        navButtons[currentIndex + 1].click();
    }

    if (diff > 0 && currentIndex > 0) {
        navButtons[currentIndex - 1].click();
    }
}

document.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", function (e) {
        const ripple = document.createElement("span");
        ripple.className = "ripple";

        ripple.style.left = `${e.offsetX}px`;
        ripple.style.top = `${e.offsetY}px`;

        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 500);
    });
});

openAddModal.onclick = () => {
    editingWordId = null;
    modalTitle.textContent = "Add Word";

    modalFrench.value = "";
    modalEnglish.value = "";
    modalCategory.value = "";
    modalTags.value = "";

    wordModal.classList.remove("hidden");
};

closeModalBtn.onclick = () => {
    wordModal.classList.add("hidden");
};

saveWordBtn.onclick = () => {

    const french = modalFrench.value.trim();
    const english = modalEnglish.value.trim();
    const category = modalCategory.value;
    const tags = modalTags.value.split(",").map(t => t.trim()).filter(Boolean);

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
        showToast("Word Updated", "success");
    } else {
        vocabulary.push(wordData);
        showToast("Word Added", "success");
    }

    modalFrench.value = "";
    modalEnglish.value = "";
    modalCategory.value = "";
    modalTags.value = "";

    saveToStorage();
    renderTagFilters();
    populateQuizTags();
    updateStats();
    renderWords(editIndex);

    wordModal.classList.add("hidden");

};

function loadForEdit(index) {

    modalTitle.textContent = "Edit Word";

    const word = vocabulary[index];
    editingWordId = word.id;

    modalFrench.value = word.french;
    modalEnglish.value = word.english;
    modalCategory.value = word.category || "";
    modalTags.value = (word.tags || []).join(", ");

    wordModal.classList.remove("hidden");

    editIndex = index;
}

////////////////////////////////////////////////////

searchInput.oninput = renderWords;
categoryFilter.onchange = renderWords;

// Initial render
renderWords();
renderTagFilters();
populateQuizTags();
updateStats();
