// quiz.js - Logique du questionnaire

function updateProgress() {
    const progress = Math.round(((currentQuestionIndex) / QUESTIONS.length) * 100);
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    progressBar.style.width = `${Math.max(progress, 7)}%`;
    progressText.textContent = Math.max(progress, 7);
}

function showQuestion() {
    const question = QUESTIONS[currentQuestionIndex];
    
    // Texto da pergunta
    document.getElementById('question-text').innerHTML = question.text;
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;

    hideQuizError(); // Esconde qualquer erro anterior ao mostrar nova pergunta

    updateProgress();

    // Renderizar opções
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    question.options.forEach((option, idx) => {
        const isSelected = answers[question.id] === option.type;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `option-card text-left w-full rounded-2xl p-5 flex items-start gap-x-4 ${isSelected ? 'selected border-[#c9c9c9]' : 'border-[#292929] hover:border-[#5a5a5a]'}`;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        btn.setAttribute('aria-label', option.text);
        
        btn.innerHTML = `
            <div class="w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-[#c9c9c9] bg-[#c9c9c9]' : 'border-[#3a3a3a]'}">
                ${isSelected ? '<i class="fa-solid fa-check text-xs text-black"></i>' : ''}
            </div>
            <div class="flex-1">
                <div class="text-base leading-snug text-[#ddd]">${option.text}</div>
            </div>
        `;

        btn.onclick = () => selectOption(question.id, option.type, btn);
        // Keyboard support
        btn.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectOption(question.id, option.type, btn);
            }
        };
        container.appendChild(btn);
    });

    // État des boutons
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const nextText = document.getElementById('btn-next-text');

    btnPrev.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === QUESTIONS.length - 1) {
        nextText.textContent = "VOIR LE RÉSULTAT";
        btnNext.innerHTML = `
            <span>VOIR LE RÉSULTAT</span>
            <i class="fa-solid fa-chart-bar ml-2"></i>
        `;
    } else {
        nextText.textContent = "SUIVANT";
        btnNext.innerHTML = `
            <span>SUIVANT</span>
            <i class="fa-solid fa-arrow-right"></i>
        `;
    }

    // Keyboard arrow navigation for options (best practice for radiogroup)
    const options = container.querySelectorAll('[role="radio"]');
    options.forEach((opt, idx) => {
        opt.onkeydown = (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const next = options[(idx + 1) % options.length];
                next.focus();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev = options[(idx - 1 + options.length) % options.length];
                prev.focus();
            }
        };
    });

    // Focus first option for better UX when question loads
    if (options.length > 0) {
        // Don't auto focus if already selected? Simple: focus first
        setTimeout(() => options[0].focus(), 50);
    }
}

function selectOption(questionId, type, element) {
    // Desmarcar todas
    const allOptions = element.parentElement.children;
    for (let i = 0; i < allOptions.length; i++) {
        const opt = allOptions[i];
        opt.classList.remove('selected', 'border-[#c9c9c9]');
        opt.classList.add('border-[#292929]');
        opt.setAttribute('aria-checked', 'false');
        
        const check = opt.querySelector('.fa-check');
        if (check) check.remove();
        
        const circle = opt.querySelector('div');
        if (circle) {
            circle.classList.remove('border-[#c9c9c9]', 'bg-[#c9c9c9]');
            circle.classList.add('border-[#3a3a3a]');
        }
    }

    // Selecionar esta
    element.classList.remove('border-[#292929]');
    element.classList.add('selected', 'border-[#c9c9c9]');
    element.setAttribute('aria-checked', 'true');
    
    const circle = element.querySelector('div');
    if (circle) {
        circle.classList.remove('border-[#3a3a3a]');
        circle.classList.add('border-[#c9c9c9]', 'bg-[#c9c9c9]');
        circle.innerHTML = '<i class="fa-solid fa-check text-xs text-black"></i>';
    }

    answers[questionId] = type;

    // Esconde o erro quando uma opção é selecionada
    hideQuizError();
}

function nextQuestion() {
    const currentQ = QUESTIONS[currentQuestionIndex];
    
    if (!answers[currentQ.id]) {
        // Mostra aviso se nenhuma opção foi escolhida
        showQuizError("Veuillez choisir au moins une option.");
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

// Expor funções necessárias globalmente
window.showQuestion = showQuestion;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;

