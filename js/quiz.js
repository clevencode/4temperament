// quiz.js - Logique du questionnaire (échelle Likert)

const QuizFlow = {
  LIKERT_MIN: 1,
  LIKERT_MAX: 5,

  isValidAnswer(value) {
    const n = Number(value);
    return Number.isInteger(n) && n >= this.LIKERT_MIN && n <= this.LIKERT_MAX;
  },

  isQuestionAnswered(questionId, answersMap = answers) {
    return this.isValidAnswer(answersMap[questionId]);
  },

  getAnsweredCount(answersMap = answers, questions = QUESTIONS) {
    return questions.filter(q => this.isQuestionAnswered(q.id, answersMap)).length;
  },

  getMissingQuestions(answersMap = answers, questions = QUESTIONS) {
    return questions.filter(q => !this.isQuestionAnswered(q.id, answersMap));
  },

  getFirstUnansweredIndex(answersMap = answers, questions = QUESTIONS) {
    const idx = questions.findIndex(q => !this.isQuestionAnswered(q.id, answersMap));
    return idx === -1 ? null : idx;
  },

  canAdvanceFrom(index, answersMap = answers, questions = QUESTIONS) {
    const question = questions[index];
    if (!question) return false;
    return this.isQuestionAnswered(question.id, answersMap);
  },

  canComplete(answersMap = answers, questions = QUESTIONS) {
    return this.getMissingQuestions(answersMap, questions).length === 0;
  },

  normalizeAnswers(raw = {}) {
    const normalized = {};
    Object.entries(raw).forEach(([id, value]) => {
      const n = Number(value);
      if (this.isValidAnswer(n)) normalized[Number(id)] = n;
    });
    return normalized;
  }
};

function updateProgress() {
  const total = QUESTIONS.length;
  const answered = QuizFlow.getAnsweredCount();
  const progress = Math.round((answered / total) * 100);
  const progressBar = document.getElementById('progress-bar');
  const progressTrack = document.getElementById('progress-track');
  const progressText = document.getElementById('progress-text');

  const displayPercent = answered === 0 ? 0 : Math.max(progress, 3);
  if (progressBar) progressBar.style.width = `${displayPercent}%`;
  if (progressTrack) {
    progressTrack.setAttribute('aria-valuenow', String(answered));
    progressTrack.setAttribute('aria-valuemax', String(total));
    progressTrack.setAttribute('aria-valuemin', '0');
  }
  if (progressText) progressText.textContent = `${answered}/${total}`;
}

function updateQuestionCounter() {
  const totalEl = document.getElementById('total-questions');
  if (totalEl) totalEl.textContent = QUESTIONS.length;
}

function isMobileQuizView() {
  return window.matchMedia('(max-width: 639px)').matches;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollToQuizNav() {
  if (!isMobileQuizView()) return;

  const quizScreen = document.getElementById('quiz-screen');
  if (!quizScreen || quizScreen.classList.contains('hidden')) return;

  const target = document.getElementById('quiz-nav') || document.getElementById('btn-next');
  if (!target) return;

  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';

  requestAnimationFrame(() => {
    setTimeout(() => {
      target.scrollIntoView({ behavior, block: 'end', inline: 'nearest' });
    }, 120);
  });
}

function updateNextButtonState() {
  const btnNext = document.getElementById('btn-next');
  if (!btnNext) return;

  const canAdvance = QuizFlow.canAdvanceFrom(currentQuestionIndex, answers);
  btnNext.disabled = !canAdvance;
  btnNext.setAttribute('aria-disabled', canAdvance ? 'false' : 'true');
  btnNext.classList.toggle('opacity-40', !canAdvance);
  btnNext.classList.toggle('cursor-not-allowed', !canAdvance);
}

function focusCurrentQuestionOptions() {
  const container = document.getElementById('options-container');
  const scale = container?.querySelector('.likert-scale');
  const options = scale?.querySelectorAll('[role="radio"]');
  if (!options?.length) return;

  const selected = scale.querySelector('[aria-checked="true"]');
  (selected || options[2]).focus({ preventScroll: false });

  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showQuestion() {
  const question = QUESTIONS[currentQuestionIndex];

  document.getElementById('question-text').innerHTML = question.text;
  document.getElementById('current-question').textContent = currentQuestionIndex + 1;
  updateQuestionCounter();

  hideQuizError();
  updateProgress();

  const announcer = document.getElementById('quiz-announcer');
  if (announcer) {
    announcer.textContent = `Question ${currentQuestionIndex + 1} sur ${QUESTIONS.length}`;
  }

  const container = document.getElementById('options-container');
  container.innerHTML = '';

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
  scale.setAttribute('aria-required', 'true');

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
            <div class="likert-value w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex-shrink-0 ${isSelected ? 'is-selected' : 'border-[#3a3a3a] text-[#888]'}">
                ${isSelected ? icon('check', { size: 'xs', tone: 'inherit' }) : option.value}
            </div>
            <div class="flex-1 min-w-0">
                <div class="type-likert-label">${option.text}</div>
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

  if (btnPrev) {
    const atStart = currentQuestionIndex === 0;
    btnPrev.disabled = atStart;
    btnPrev.setAttribute('aria-disabled', atStart ? 'true' : 'false');
    btnPrev.classList.toggle('opacity-40', atStart);
    btnPrev.classList.toggle('cursor-not-allowed', atStart);
  }

  if (currentQuestionIndex === QUESTIONS.length - 1) {
    btnNext.innerHTML = `
            <span>VOIR LE RÉSULTAT</span>
            ${icon('results', { size: 'sm', tone: 'silver', className: 'ml-2' })}
        `;
  } else {
    btnNext.innerHTML = `
            <span>SUIVANT</span>
            ${icon('arrowRight', { size: 'sm', tone: 'silver' })}
        `;
  }

  updateNextButtonState();

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
    const focusTarget = selected || options[2];
    setTimeout(() => {
      if (isMobileQuizView()) {
        focusTarget.focus({ preventScroll: true });
        scrollToQuizNav();
      } else {
        focusTarget.focus({ preventScroll: false });
      }
    }, 50);
  } else {
    scrollToQuizNav();
  }
}

function selectOption(questionId, value, element) {
  if (!QuizFlow.isValidAnswer(value)) return;

  const scale = element.parentElement;
  const allOptions = scale.querySelectorAll('[role="radio"]');

  allOptions.forEach((opt) => {
    opt.classList.remove('selected', 'border-[#c9c9c9]');
    opt.classList.add('border-[#292929]');
    opt.setAttribute('aria-checked', 'false');

    const circle = opt.querySelector('.likert-value');
    if (circle) {
      circle.classList.remove('is-selected');
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
    circle.classList.add('is-selected');
    circle.innerHTML = icon('check', { size: 'xs', tone: 'inherit' });
  }

  answers[questionId] = Number(value);
  hideQuizError();
  updateProgress();
  updateNextButtonState();
  scrollToQuizNav();

  if (typeof persistQuizProgress === 'function') persistQuizProgress();
}

function redirectToFirstUnanswered() {
  const firstMissing = QuizFlow.getFirstUnansweredIndex(answers);
  if (firstMissing == null) return false;

  currentQuestionIndex = firstMissing;
  if (typeof persistQuizProgress === 'function') persistQuizProgress();
  showQuestion();

  const missing = QuizFlow.getMissingQuestions(answers).length;
  showQuizError(
    missing === 1
      ? 'Il reste 1 affirmation sans réponse.'
      : `Il reste ${missing} affirmations sans réponse.`
  );
  return true;
}

function nextQuestion() {
  if (!QuizFlow.canAdvanceFrom(currentQuestionIndex, answers)) {
    showQuizError('Veuillez choisir un niveau d\'accord avant de continuer.');
    focusCurrentQuestionOptions();
    return;
  }

  hideQuizError();

  if (currentQuestionIndex < QUESTIONS.length - 1) {
    currentQuestionIndex++;
    if (typeof persistQuizProgress === 'function') persistQuizProgress();
    showQuestion();
    return;
  }

  if (QuizFlow.canComplete(answers)) {
    showResults();
    return;
  }

  redirectToFirstUnanswered();
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    if (typeof persistQuizProgress === 'function') persistQuizProgress();
    showQuestion();
  }
}

function showQuizError(message) {
  const errorEl = document.getElementById('quiz-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function hideQuizError() {
  const errorEl = document.getElementById('quiz-error');
  if (errorEl) {
    errorEl.classList.add('hidden');
  }
}

window.QuizFlow = QuizFlow;
window.showQuestion = showQuestion;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;
window.showQuizError = showQuizError;
window.hideQuizError = hideQuizError;
window.redirectToFirstUnanswered = redirectToFirstUnanswered;