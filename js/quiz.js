// quiz.js - Logique du questionnaire (échelle Likert)

function updateProgress() {
    const progress = Math.round(((currentQuestionIndex) / QUESTIONS.length) * 100);
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    progressBar.style.width = `${Math.max(progress, 3)}%`;
    progressText.textContent = Math.max(progress, 3);
}

function updateQuestionCounter() {
    const totalEl = document.getElementById('total-questions');
    if (totalEl) totalEl.textContent = QUESTIONS.length;
}

function showQuestion() {
    const question = QUESTIONS[currentQuestionIndex];

    document.getElementById('question-text').innerHTML = question.text;
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    updateQuestionCounter();

    hideQuizError();
    updateProgress();

    const container = document.getElementById('options-container');
    container.innerHTML = '';

    // Légende de l'échelle
    const legend = document.createElement('div');
    legend.className = 'likert-legend';
    legend.setAttribute('aria-hidden', 'true');
    legend.innerHTML = `
        <span>Désaccord</span>
        <span>Accord</span>
    `;
    container.appendChild(legend);

    const scale = document.createElement('div');
    scale.className = 'likert-scale';
    scale.setAttribute('role', 'radiogroup');
    scale.setAttribute('aria-labelledby', 'question-text');

    LIKERT_OPTIONS.forEach((option) => {
        const isSelected = answers[question.id] === option.value;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `likert-option option-card text-left w-full rounded-2xl p-3 sm:p-4 flex items-center gap-x-3 sm:gap-x-4 ${isSelected ? 'selected border-[#c9c9c9]' : 'border-[#292929] hover:border-[#5a5a5a]'}`;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        btn.setAttribute('aria-label', `${option.text} — ${option.value} sur 5`);
        btn.dataset.value = option.value;

        btn.innerHTML = `
            <div class="likert-value w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-semibold ${isSelected ? 'border-[#c9c9c9] bg-[#c9c9c9] text-black' : 'border-[#3a3a3a] text-[#888]'}">
                ${isSelected ? '<i class="fa-solid fa-check text-xs"></i>' : option.value}
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm sm:text-base leading-snug text-[#ddd]">${option.text}</div>
            </div>
        `;

        btn.onclick = () => selectOption(question.id, option.value, btn);
        btn.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectOption(question.id, option.value, btn);
            }
        };
        scale.appendChild(btn);
    });

    container.appendChild(scale);

    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    btnPrev.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === QUESTIONS.length - 1) {
        btnNext.innerHTML = `
            <span>VOIR LE RÉSULTAT</span>
            <i class="fa-solid fa-chart-bar ml-2"></i>
        `;
    } else {
        btnNext.innerHTML = `
            <span>SUIVANT</span>
            <i class="fa-solid fa-arrow-right"></i>
        `;
    }

    const options = scale.querySelectorAll('[role="radio"]');
    options.forEach((opt, idx) => {
        opt.onkeydown = (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                options[(idx + 1) % options.length].focus();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                options[(idx - 1 + options.length) % options.length].focus();
            }
        };
    });

    if (options.length > 0) {
        const selected = scale.querySelector('[aria-checked="true"]');
        setTimeout(() => (selected || options[2]).focus(), 50);
    }
}

function selectOption(questionId, value, element) {
    const scale = element.parentElement;
    const allOptions = scale.querySelectorAll('[role="radio"]');

    allOptions.forEach((opt) => {
        opt.classList.remove('selected', 'border-[#c9c9c9]');
        opt.classList.add('border-[#292929]');
        opt.setAttribute('aria-checked', 'false');

        const circle = opt.querySelector('.likert-value');
        if (circle) {
            circle.classList.remove('border-[#c9c9c9]', 'bg-[#c9c9c9]', 'text-black');
            circle.classList.add('border-[#3a3a3a]', 'text-[#888]');
            circle.textContent = opt.dataset.value;
        }
    });

    element.classList.remove('border-[#292929]');
    element.classList.add('selected', 'border-[#c9c9c9]');
    element.setAttribute('aria-checked', 'true');

    const circle = element.querySelector('.likert-value');
    if (circle) {
        circle.classList.remove('border-[#3a3a3a]', 'text-[#888]');
        circle.classList.add('border-[#c9c9c9]', 'bg-[#c9c9c9]', 'text-black');
        circle.innerHTML = '<i class="fa-solid fa-check text-xs"></i>';
    }

    answers[questionId] = value;
    hideQuizError();
}

function nextQuestion() {
    const currentQ = QUESTIONS[currentQuestionIndex];

    if (!answers[currentQ.id]) {
        showQuizError("Veuillez choisir un niveau d'accord.");
        return;
    }

    hideQuizError();

    if (currentQuestionIndex < QUESTIONS.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        showResults();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
}

function showQuizError(message) {
    const errorEl = document.getElementById('quiz-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

function hideQuizError() {
    const errorEl = document.getElementById('quiz-error');
    if (errorEl) {
        errorEl.classList.add('hidden');
    }
}

window.showQuestion = showQuestion;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;