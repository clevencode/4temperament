// quiz.js - Lógica do questionário

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

    updateProgress();

    // Renderizar opções
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    question.options.forEach((option) => {
        const isSelected = answers[question.id] === option.type;

        const div = document.createElement('div');
        div.className = `option-card cursor-pointer rounded-2xl p-5 flex items-start gap-x-4 ${isSelected ? 'selected border-[#c9c9c9]' : 'border-[#292929]'}`;
        
        div.innerHTML = `
            <div class="w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-[#c9c9c9] bg-[#c9c9c9]' : 'border-[#3a3a3a]'}">
                ${isSelected ? '<i class="fa-solid fa-check text-xs text-black"></i>' : ''}
            </div>
            <div class="flex-1">
                <div class="text-base leading-snug text-[#ddd]">${option.text}</div>
            </div>
        `;

        div.onclick = () => selectOption(question.id, option.type, div);
        container.appendChild(div);
    });

    // Estado dos botões
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
}

function selectOption(questionId, type, element) {
    // Desmarcar todas
    const allOptions = element.parentElement.children;
    for (let i = 0; i < allOptions.length; i++) {
        const opt = allOptions[i];
        opt.classList.remove('selected', 'border-[#c9c9c9]');
        opt.classList.add('border-[#292929]');
        
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
    
    const circle = element.querySelector('div');
    if (circle) {
        circle.classList.remove('border-[#3a3a3a]');
        circle.classList.add('border-[#c9c9c9]', 'bg-[#c9c9c9]');
        circle.innerHTML = '<i class="fa-solid fa-check text-xs text-black"></i>';
    }

    answers[questionId] = type;
}

function nextQuestion() {
    const currentQ = QUESTIONS[currentQuestionIndex];
    
    if (!answers[currentQ.id]) {
        // Seleciona automaticamente a primeira opção
        const container = document.getElementById('options-container');
        if (container.children.length > 0) {
            const first = container.children[0];
            const option = currentQ.options[0];
            answers[currentQ.id] = option.type;
            
            first.classList.add('selected', 'border-[#c9c9c9]');
            first.classList.remove('border-[#292929]');
            const circle = first.querySelector('div');
            circle.classList.add('border-[#c9c9c9]', 'bg-[#c9c9c9]');
            circle.classList.remove('border-[#3a3a3a]');
            circle.innerHTML = '<i class="fa-solid fa-check text-xs text-black"></i>';
        }
    }

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

// Expor funções necessárias globalmente
window.showQuestion = showQuestion;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;