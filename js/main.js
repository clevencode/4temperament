// main.js - Point d'entrée et initialisation de l'application

// --- PERSISTENCE (localStorage) ---
const PREFS_KEY = 'temperamentsPrefs';
const HISTORY_KEY = 'temperamentsResultsHistory';
const QUIZ_PROGRESS_KEY = 'temperamentsQuizProgress';
const MAX_HISTORY_ENTRIES = 20;

// =====================================================
// QUIZ PROGRESS — brouillon en cours (reprise après retour accueil)
// =====================================================
const QuizProgress = {
  save({ answers: ans, currentQuestionIndex: idx }) {
    if (!ans || Object.keys(ans).length === 0) {
      this.clear();
      return;
    }
    try {
      localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify({
        answers: ans,
        currentQuestionIndex: idx,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Impossible de sauvegarder la progression du quiz');
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(QUIZ_PROGRESS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clear() {
    localStorage.removeItem(QUIZ_PROGRESS_KEY);
  },

  hasInProgress() {
    const data = this.load();
    return !!(data && data.answers && Object.keys(data.answers).length > 0);
  },

  getAnsweredCount() {
    const data = this.load();
    return data?.answers ? Object.keys(data.answers).length : 0;
  }
};

// =====================================================
// HISTORY MANAGER - Lógica de negócio do Histórico
// Separação clara de dados e regras de negócio
// =====================================================
const HistoryManager = {
  KEY: HISTORY_KEY,
  MAX: MAX_HISTORY_ENTRIES,

  load() {
    try {
      const data = localStorage.getItem(this.KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAll(history) {
    try {
      // Mantém apenas os mais recentes
      const limited = history.slice(0, this.MAX);
      localStorage.setItem(this.KEY, JSON.stringify(limited));
      return limited;
    } catch (e) {
      console.error('Erro ao salvar histórico:', e);
      return history;
    }
  },

  add(entry) {
    const history = this.load();
    // Adiciona no início (mais recente primeiro)
    history.unshift(entry);
    return this.saveAll(history);
  },

  update(id, updatedFields) {
    const history = this.load();
    const index = history.findIndex(item => item.id === id);
    
    if (index === -1) {
      console.warn('Entrada não encontrada no histórico:', id);
      return history;
    }

    // Atualiza mantendo os campos existentes + novos
    history[index] = {
      ...history[index],
      ...updatedFields,
      // Sempre atualiza a data da edição
      lastEdited: new Date().toISOString()
    };

    return this.saveAll(history);
  },

  getById(id) {
    return this.load().find(item => item.id === id) || null;
  },

  remove(id) {
    const history = this.load().filter(item => item.id !== id);
    return this.saveAll(history);
  },

  clear() {
    localStorage.removeItem(this.KEY);
    return [];
  },

  /**
   * Cria uma nova entrada de resultado
   * Alinhado com a lógica de negócio: um "resultado final" contém
   * o outcome + os dados que levaram até ele (answers)
   */
  createEntry({ dominant, secondary, percentages, answers, userName, isBalanced, allNeutral, profileMode }) {
    return {
      id: Date.now(),
      date: new Date().toISOString(),
      userName: userName || 'Anônimo',
      dominant,
      secondary,
      percentages,
      answers: answers || {},
      isBalanced: !!isBalanced,
      allNeutral: !!allNeutral,
      profileMode: profileMode || 'agreement'
    };
  },

  /** Recalcule ou normalise une entrée pour l'affichage (logique métier unique). */
  resolveEntry(entry) {
    if (entry?.answers && Object.keys(entry.answers).length > 0 && typeof TemperamentScoring !== 'undefined') {
      return { ...TemperamentScoring.calculate(entry.answers), answers: entry.answers };
    }
    return entry;
  }
};

// Estado temporário do módulo (evita poluir window global)
let currentHistoryCache = [];
let currentEditingId = null;
let currentDetailIndex = null;

// =====================================================
// NAVIGATION CENTRALISÉE (Navegabilidade)
// Best practice: une seule fonction canonique pour transitions d'écrans
// + helpers pour flux alignés à la logique métier (self-discovery guidé)
// Évite les toggles dispersés, focus management, règles UI (notice edition)
// =====================================================
function showScreen(screenId) {
  // Cacher tous les écrans principaux
  document.querySelectorAll('[id$="-screen"]').forEach(s => {
    s.classList.add('hidden');
    s.setAttribute('aria-hidden', 'true');
  });

  const screen = document.getElementById(screenId);
  if (!screen) return;

  screen.classList.remove('hidden');
  screen.removeAttribute('aria-hidden');

  // Règle métier : notice d'édition uniquement visible dans quiz quand en édition
  const notice = document.getElementById('quiz-edit-notice');
  if (notice) {
    if (screenId === 'quiz-screen' && currentEditingId != null) {
      notice.classList.remove('hidden');
    } else {
      notice.classList.add('hidden');
    }
  }

  // Focus management (accessibilité + navegabilidade)
  setTimeout(() => {
    const focusTarget = screen.querySelector('button:not([disabled]), input, [tabindex]:not([tabindex="-1"]), h1, h2, h3');
    if (focusTarget) focusTarget.focus();
  }, 60);
}

// Helpers de flux explicites (clarté + maintenabilité)
function navigateToIntro() {
  persistQuizProgressIfNeeded();
  currentEditingId = null;
  showScreen('intro-screen');
  updateIntroCta();
}

function navigateToAbout() {
  persistQuizProgressIfNeeded();
  showScreen('about-screen');
}

function navigateToTemperamentsAbout() {
  persistQuizProgressIfNeeded();
  showScreen('temperaments-about-screen');
}

function openAboutFromNav(target) {
  if (target === 'theory') {
    navigateToTemperamentsAbout();
  } else if (target === 'screen') {
    navigateToAbout();
  } else if (target === 'history') {
    navigateToHistory();
  }
}

function isQuizScreenVisible() {
  const el = document.getElementById('quiz-screen');
  return el && !el.classList.contains('hidden');
}

/** Sauvegarde le brouillon uniquement pour un nouveau test (pas édition historique). */
function persistQuizProgressIfNeeded() {
  if (!isQuizScreenVisible() || currentEditingId != null) return;
  if (!answers || Object.keys(answers).length === 0) return;
  QuizProgress.save({ answers, currentQuestionIndex });
}

function persistQuizProgress() {
  if (currentEditingId != null) return;
  QuizProgress.save({ answers, currentQuestionIndex });
}

function clearQuizProgress() {
  QuizProgress.clear();
}

function updateIntroCta() {
  const label = document.getElementById('intro-start-label');
  const icon = document.getElementById('intro-start-icon');
  const hint = document.getElementById('intro-continue-hint');
  if (!label) return;

  const saved = QuizProgress.load();
  const hasProgress = saved && saved.answers && Object.keys(saved.answers).length > 0;

  if (hasProgress) {
    const answered = Object.keys(saved.answers).length;
    const qIndex = Math.min(saved.currentQuestionIndex ?? 0, (typeof QUESTIONS !== 'undefined' ? QUESTIONS.length : 30) - 1);
    label.textContent = 'CONTINUER';
    if (icon && typeof setIntroStartIcon === 'function') {
      setIntroStartIcon(icon, 'continue');
    }
    if (hint) {
      hint.textContent = `Reprendre à la question ${qIndex + 1} — ${answered} réponse${answered > 1 ? 's' : ''} sauvegardée${answered > 1 ? 's' : ''}`;
      hint.classList.remove('hidden');
    }
  } else {
    label.textContent = 'COMMENCER LE TEST';
    if (icon && typeof setIntroStartIcon === 'function') {
      setIntroStartIcon(icon, 'start');
    }
    if (hint) hint.classList.add('hidden');
  }
}

function navigateToQuiz() {
  showScreen('quiz-screen');
}

function navigateToResults() {
  showScreen('results-screen');
}

// Exposer pour modules (vanilla JS, scripts chargés dans l'ordre)
window.showScreen = showScreen;
window.navigateToIntro = navigateToIntro;
window.navigateToAbout = navigateToAbout;
window.navigateToTemperamentsAbout = navigateToTemperamentsAbout;
window.navigateToQuiz = navigateToQuiz;
window.navigateToResults = navigateToResults;
window.openAboutFromNav = openAboutFromNav;
window.navigateToHistory = navigateToHistory;
window.showResultsHistory = showResultsHistory;
window.startNewTestFromHistory = startNewTestFromHistory;
window.clearResultsHistory = clearResultsHistory;

/**
 * MELHOR PRÁTICA: Carrega todo o estado do usuário de uma vez no início.
 * Isso garante que nome + histórico sobrevivam a reinícios do app.
 */
function loadUserState() {
    // Carregar preferências (sem restaurar nome — teste 100 % anonyme)
    loadPreferences();

    // Carregar histórico completo
    currentHistoryCache = HistoryManager.load();
    userName = '';
    updateIntroCta();

    console.log('%c[Quiz] Estado do usuário carregado do localStorage (persistência ativa)', 'color:#4ade80');
}

function savePreferences() {
    saveUserPreferences({ hasCompletedTest: true });
}

function loadPreferences() {
    try {
        const saved = localStorage.getItem(PREFS_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {}
    return null;
}

function shouldSkipIntro() {
    const prefs = loadPreferences();
    return prefs && prefs.hasCompletedTest;
}

// Initialisation de Tailwind (si nécessaire)
function initializeTailwind() {
    // Tailwind est déjà chargé via CDN dans index.html
}

// Fonctions de navigation principales
function startQuiz() {
    userName = '';
    currentEditingId = null;

    const saved = QuizProgress.load();
    if (saved && saved.answers && Object.keys(saved.answers).length > 0) {
        answers = typeof QuizFlow !== 'undefined'
            ? QuizFlow.normalizeAnswers(saved.answers)
            : JSON.parse(JSON.stringify(saved.answers));

        const savedIndex = Math.min(saved.currentQuestionIndex ?? 0, QUESTIONS.length - 1);
        const firstUnanswered = typeof QuizFlow !== 'undefined'
            ? QuizFlow.getFirstUnansweredIndex(answers)
            : null;

        if (firstUnanswered != null && !QuizFlow.isQuestionAnswered(QUESTIONS[savedIndex]?.id, answers)) {
            currentQuestionIndex = firstUnanswered;
        } else {
            currentQuestionIndex = savedIndex;
        }
    } else {
        answers = {};
        currentQuestionIndex = 0;
    }

    navigateToQuiz();
    showQuestion();
}

// Melhor prática: função única para salvar preferências do usuário
function saveUserPreferences(extra = {}) {
    try {
        const existing = localStorage.getItem(PREFS_KEY);
        let prefs = existing ? JSON.parse(existing) : {};

        if (extra.hasCompletedTest) prefs.hasCompletedTest = true;

        Object.assign(prefs, extra);

        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch(e) {
        console.warn('Erro ao salvar preferências do usuário');
    }
}

// === HISTÓRICO DE RESULTADOS FINAIS ===

/**
 * Salva um resultado no histórico.
 * Se estiver em modo de edição (currentEditingId), atualiza o registro existente.
 * Caso contrário, adiciona um novo.
 * 
 * Esta função encapsula a regra de negócio: 
 * "Editar um teste anterior atualiza o registro, não duplica"
 */
function saveResultToHistory(resultData) {
    const entry = HistoryManager.createEntry({
        dominant: resultData.dominant,
        secondary: resultData.secondary,
        percentages: resultData.percentages,
        answers: resultData.answers,
        userName,
        isBalanced: resultData.isBalanced,
        allNeutral: resultData.allNeutral,
        profileMode: resultData.profileMode
    });

    if (currentEditingId) {
        // Modo edição: atualiza o resultado existente
        HistoryManager.update(currentEditingId, {
            dominant: entry.dominant,
            secondary: entry.secondary,
            percentages: entry.percentages,
            answers: entry.answers,
            isBalanced: entry.isBalanced,
            allNeutral: entry.allNeutral,
            profileMode: entry.profileMode,
            lastEdited: new Date().toISOString()
        });
        currentEditingId = null;
    } else {
        // Novo resultado
        HistoryManager.add(entry);
    }

}

function loadResultsHistory() {
    return HistoryManager.load();
}

function navigateToHistory() {
  persistQuizProgressIfNeeded();
  showScreen('history-screen');
  renderHistoryScreen();
}

function showResultsHistory() {
  navigateToHistory();
}

function buildHistoryCard(entry, index) {
  const resolved = HistoryManager.resolveEntry(entry);
  const isBalanced = resolved.isBalanced;
  const isRejection = !isBalanced && resolved.profileMode === 'rejection';
  const dominant = isBalanced
    ? { name: 'Équilibré', emoji: '⚖️', color: '#c9c9c9' }
    : isRejection
      ? { name: `↓ ${TEMPERAMENTS[resolved.dominant].name}`, emoji: TEMPERAMENTS[resolved.dominant].emoji, color: TEMPERAMENTS[resolved.dominant].color }
      : TEMPERAMENTS[resolved.dominant];
  const secondary = isBalanced ? null : TEMPERAMENTS[resolved.secondary];
  const dateStr = new Date(entry.date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  const statsHtml = isBalanced
    ? `<div>Profil: <span class="font-semibold">25% × 4</span></div>
       <div class="text-[#888]">Aucune dominance nette</div>`
    : `<div>Principal: <span class="font-semibold">${Math.round(resolved.percentages[resolved.dominant])}%</span></div>
       <div class="text-[#888]">Secondaire: ${secondary.name} (${Math.round(resolved.percentages[resolved.secondary])}%)</div>`;

  const card = document.createElement('div');
  card.className = 'border border-[#292929] rounded-2xl p-4 mb-3 last:mb-0 cursor-pointer hover:border-[#555] transition-colors';
  card.style.borderLeft = `4px solid ${dominant.color}`;
  card.dataset.historyIndex = index;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Voir détails du résultat ${dominant.name}`);

  card.innerHTML = `
    <div class="flex justify-between items-start mb-2">
      <div>
        <div class="flex items-center gap-x-2">
          ${temperamentEmoji(dominant.emoji, 'sm', dominant.color)}
          <span class="type-ui font-semibold text-lg" style="color: ${dominant.color}">${dominant.name}</span>
        </div>
        <div class="type-caption normal-case tracking-normal text-[#888]">${dateStr}</div>
      </div>
      <div class="text-right type-caption normal-case tracking-normal">${statsHtml}</div>
    </div>
    <div class="flex flex-wrap gap-2 mt-3">
      <button type="button" data-action="share" class="type-btn px-3 py-1 text-xs glossy-btn rounded-full flex items-center gap-x-1" aria-label="Partager sur WhatsApp">
        ${icon('whatsapp', { size: 'sm', tone: 'whatsapp' })}<span>Partager</span>
      </button>
      <button type="button" data-action="edit" class="type-btn px-3 py-1 text-xs border border-[#444] hover:bg-[#222] rounded-full flex items-center gap-x-1" aria-label="Modifier ce résultat">
        ${icon('edit', { size: 'sm', tone: 'muted' })}<span>Modifier</span>
      </button>
      <button type="button" data-action="view" class="type-btn px-3 py-1 text-xs border border-[#444] hover:bg-[#222] rounded-full flex items-center gap-x-1" aria-label="Voir les détails complets">
        ${icon('eye', { size: 'sm', tone: 'muted' })}<span>Détails</span>
      </button>
    </div>
  `;

  return card;
}

function renderHistoryScreen() {
  const container = document.getElementById('history-screen-content');
  const clearBtn = document.getElementById('history-clear-btn');
  if (!container) return;

  const history = loadResultsHistory();
  currentHistoryCache = history;
  container.innerHTML = '';

  if (history.length === 0) {
    container.innerHTML = '<p class="type-body text-[#888] text-center py-6">Aucun résultat enregistré pour le moment.</p>';
    if (clearBtn) clearBtn.classList.add('hidden');
    return;
  }

  history.forEach((entry, index) => {
    container.appendChild(buildHistoryCard(entry, index));
  });

  if (clearBtn) clearBtn.classList.remove('hidden');
}

function handleHistoryScreenClick(e) {
  const card = e.target.closest('[data-history-index]');
  if (!card) return;

  const idx = parseInt(card.dataset.historyIndex, 10);
  if (isNaN(idx)) return;

  if (e.target.closest('[data-action="share"]')) {
    e.stopPropagation();
    shareResultFromHistory(idx);
  } else if (e.target.closest('[data-action="edit"]')) {
    e.stopPropagation();
    refazerTeste(idx);
  } else if (e.target.closest('[data-action="view"]')) {
    e.stopPropagation();
    showFullResult(idx);
  } else {
    showFullResult(idx);
  }
}

function initHistoryScreen() {
  const container = document.getElementById('history-screen-content');
  if (!container || container.dataset.bound) return;
  container.dataset.bound = 'true';
  container.addEventListener('click', handleHistoryScreenClick);
}

function startNewTestFromHistory() {
  currentEditingId = null;
  startQuiz();
}

function clearResultsHistory() {
  if (!confirm('Voulez-vous vraiment effacer tout l\'historique des résultats ?')) return;

  HistoryManager.clear();
  renderHistoryScreen();
  alert('Historique effacé.');
}

function buildResultBarsHtml(result) {
  const order = ['sanguineo', 'colerico', 'melancolico', 'fleumatico'];
  const dominantBadge = result.profileMode === 'rejection' ? 'MOINS AFFIRMÉ' : 'PRINCIPAL';

  return order.map(key => {
    const t = TEMPERAMENTS[key];
    const percent = result.percentages[key];
    const isDominant = !result.isBalanced && key === result.dominant;

    return `
      <div>
        <div class="flex justify-between items-center mb-1.5 px-1">
          <div class="flex items-center gap-x-2">
            ${temperamentEmoji(t.emoji, 'sm', isDominant ? t.color : null)}
            <span class="type-ui font-semibold text-lg ${isDominant ? '' : 'text-[#aaa]'}" style="color: ${isDominant ? t.color : ''}">${t.name}</span>
            ${isDominant ? `<span class="type-caption px-2 py-px rounded" style="background: ${t.color}25; color: ${t.color}; font-weight:600;">${dominantBadge}</span>` : ''}
          </div>
          <span class="type-ui font-semibold tabular-nums w-10 text-right text-sm" style="color:#c9c9c9">${percent}%</span>
        </div>
        <div class="result-bar-track">
          <div class="result-bar-fill result-bar" style="width: ${percent}%; background: linear-gradient(to right, ${t.color}, #fff, ${t.color});"></div>
        </div>
      </div>`;
  }).join('');
}

function buildResultDetailHtml(resolved, index) {
  const isBalanced = resolved.isBalanced;
  const isRejection = !isBalanced && resolved.profileMode === 'rejection';
  const dominant = isBalanced ? null : TEMPERAMENTS[resolved.dominant];
  const secondary = isBalanced ? null : TEMPERAMENTS[resolved.secondary];
  const shareHTML = typeof shareSectionHTML === 'function' ? shareSectionHTML(index) : '';

  let typeLabel, resultName, resultNameColor, resultSubtitle, iconHtml, profileSummary, description;
  let strengthsHtml, weaknessesHtml, careersHtml, activitiesHtml, secondaryHtml;

  if (isBalanced) {
    typeLabel = 'RÉSULTAT';
    resultName = 'ÉQUILIBRÉ';
    resultNameColor = '#c9c9c9';
    resultSubtitle = 'Profil sans dominance nette';
    iconHtml = temperamentEmoji('⚖️', 'xl', '#c9c9c9');
    profileSummary = 'Tes réponses neutres ne révèlent pas de tempérament dominant. C\'est normal : réponds avec plus de conviction pour un profil plus précis.';
    description = 'Quand les affirmations reçoivent surtout une réponse « Neutre », aucun tempérament ne se détache clairement. Les quatre parts restent égales (25 % chacun).';
    secondaryHtml = `
      <div class="text-3xl opacity-60">—</div>
      <div>
        <div class="type-ui font-semibold text-lg text-[#888]">Non déterminé</div>
        <div class="type-body text-sm text-[#666]">${resolved.allNeutral ? 'Toutes les réponses étaient neutres' : resolved.mostlyNeutral ? 'Majorité de réponses neutres (≥ 80 %)' : 'Signal trop faible pour déterminer un dominant'}</div>
      </div>`;
    strengthsHtml = [
      'Ouverture à tous les styles de personnalité',
      'Flexibilité comportementale',
      'Absence de biais fort dans les réponses'
    ].map(s => listItem(s, 'checkCircle', 'silver')).join('');
    weaknessesHtml = [
      'Difficile d\'identifier un tempérament dominant',
      'Relancer le test avec des réponses plus affirmées'
    ].map(w => listItem(w, 'minus', 'subtle')).join('');
    careersHtml = listItem('Tout domaine où la polyvalence est un atout', 'arrowRight', 'muted');
    activitiesHtml = listItem('Explorer plusieurs activités pour découvrir tes préférences', 'arrowRight', 'muted');
  } else if (isRejection) {
    typeLabel = 'TRAIT MOINS AFFIRMÉ';
    resultName = dominant.name;
    resultNameColor = dominant.color;
    resultSubtitle = 'Profil basé sur le désaccord';
    iconHtml = temperamentEmoji(dominant.emoji, 'xl', dominant.color);
    profileSummary = `Tu as surtout répondu « pas d'accord ». Le tempérament le moins affirmé dans tes réponses est ${dominant.name} — cela ne signifie pas que tu es l'opposé, mais que ces traits ressortent moins dans ton profil actuel.`;
    description = 'Ce résultat reflète une prédominance de désaccord dans tes réponses. Les pourcentages indiquent quels tempéraments sont les moins caractérisés par tes choix.';
    secondaryHtml = `
      ${temperamentEmoji(secondary.emoji, 'lg', secondary.color)}
      <div>
        <div class="type-ui font-semibold text-xl" style="color: ${secondary.color}">${secondary.name}</div>
        <div class="type-body text-sm text-[#888]">${secondary.subtitle} — ${Math.round(resolved.percentages[resolved.secondary])}%</div>
      </div>`;
    strengthsHtml = listItem(`Tu as clarifié ce qui te ressemble moins (${dominant.name})`, 'checkCircle', 'silver');
    weaknessesHtml = listItem('Relance le test en répondant ce qui t\'identifie positivement', 'minus', 'subtle');
    careersHtml = listItem('Non applicable — profil basé sur le désaccord', 'arrowRight', 'muted');
    activitiesHtml = listItem('Explore librement sans te limiter à un seul type', 'arrowRight', 'muted');
  } else {
    typeLabel = 'TEMPÉRAMENT PRINCIPAL';
    resultName = dominant.name;
    resultNameColor = dominant.color;
    resultSubtitle = dominant.subtitle;
    iconHtml = temperamentEmoji(dominant.emoji, 'xl', dominant.color);
    profileSummary = `Tu es principalement <span style="color:${dominant.color}"><strong>${dominant.name}</strong></span> avec des traits forts de <span style="color:${secondary.color}"><strong>${secondary.name}</strong></span> (${Math.round(resolved.percentages[resolved.dominant])}% / ${Math.round(resolved.percentages[resolved.secondary])}%).`;
    description = dominant.description;
    secondaryHtml = `
      ${temperamentEmoji(secondary.emoji, 'lg', secondary.color)}
      <div>
        <div class="type-ui font-semibold text-xl" style="color: ${secondary.color}">${secondary.name}</div>
        <div class="type-body text-sm text-[#888]">${secondary.subtitle} — ${Math.round(resolved.percentages[resolved.secondary])}%</div>
      </div>`;
    strengthsHtml = dominant.strengths.map(s => listItem(s, 'checkCircle', 'silver')).join('');
    weaknessesHtml = dominant.weaknesses.map(w => listItem(w, 'minus', 'subtle')).join('');
    careersHtml = (dominant.recommendedCareers || []).map(c => listItem(c, 'arrowRight', 'muted')).join('');
    activitiesHtml = (dominant.preferredActivities || []).map(a => listItem(a, 'arrowRight', 'muted')).join('');
  }

  const cardBorder = isBalanced ? '1px solid #2f2f2f' : `1px solid ${dominant.color}40`;
  const cardBg = 'linear-gradient(145deg, #161616 0%, #0a0a0a 100%)';

  const profilePanel = `
    <div class="layout-grid-2 info-tab-grid">
      <div>
        <div class="type-label mb-2.5">TEMPÉRAMENT SECONDAIRE</div>
        <div class="flex items-center gap-x-3">${secondaryHtml}</div>
      </div>
      <div>
        <div class="type-label mb-2.5">TON PROFIL</div>
        <div class="type-body text-lg leading-snug font-medium text-[#ccc]">${profileSummary}</div>
      </div>
    </div>
    <div class="info-tab-section">
      <div class="type-label text-[#777] mb-2">À PROPOS DE TOI</div>
      <div class="type-result-body text-[#ccc]">${description}</div>
    </div>`;

  const tabsHtml = typeof buildInfoTabsHtml === 'function'
    ? buildInfoTabsHtml([
        { id: 'profile', label: 'Profil', icon: 'user', content: profilePanel },
        { id: 'strengths', label: 'Points forts', icon: 'strengths', content: `${sectionHeading('strengths', 'TES POINTS FORTS', 'success')}<ul class="space-y-[7px]">${strengthsHtml}</ul>` },
        { id: 'weaknesses', label: 'À améliorer', icon: 'weaknesses', content: `${sectionHeading('weaknesses', 'À AMÉLIORER', 'warning')}<ul class="space-y-[7px]">${weaknessesHtml}</ul>` },
        { id: 'careers', label: 'Carrières', icon: 'careers', content: `${sectionHeading('careers', 'CARRIÈRES RECOMMANDÉES')}<ul class="space-y-[7px]">${careersHtml}</ul>` },
        { id: 'activities', label: 'Activités', icon: 'activities', content: `${sectionHeading('activities', 'ACTIVITÉS PRÉFÉRÉES')}<ul class="space-y-[7px]">${activitiesHtml}</ul>` },
        { id: 'share', label: 'Partager', icon: 'share', content: `${sectionHeading('share', 'PARTAGER LE RÉSULTAT')}${shareHTML}<p class="type-caption normal-case tracking-normal text-[#666] mt-3">Partage ce résultat avec tes amis !</p>` }
      ])
    : '';

  return `
    <div class="rounded-3xl p-6 text-white premium-shadow relative overflow-hidden page-card" style="background:${cardBg}; border:${cardBorder}">
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      <div class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      <div class="layout-row relative z-10">
        <div class="layout-row__main">
          <div class="type-label opacity-60 mb-1">${typeLabel}</div>
          <div class="type-display type-result-name y2k-title mb-2" style="color:${resultNameColor}">${resultName}</div>
          <div class="type-ui text-xl tracking-tight opacity-80" style="color:#aaa">${resultSubtitle}</div>
        </div>
        <div class="layout-row__aside">
          <div class="temperament-icon-shell temperament-icon-shell--result mx-auto mb-1">${iconHtml}</div>
        </div>
      </div>
    </div>

    <div class="y2k-card chrome-border rounded-3xl p-6 page-card">
      <div class="type-label text-[#888] mb-5 px-1">RÉPARTITION DES TEMPÉRAMENTS</div>
      <div class="space-y-6">${buildResultBarsHtml(resolved)}</div>
    </div>

    ${tabsHtml}`;
}

function showFullResult(index) {
  const entry = currentHistoryCache[index];
  if (!entry) return;

  currentDetailIndex = index;
  const resolved = HistoryManager.resolveEntry(entry);

  const dateEl = document.getElementById('result-detail-date');
  if (dateEl) {
    dateEl.textContent = `Résultat du ${new Date(entry.date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })}`;
  }

  const container = document.getElementById('result-detail-content');
  if (container) {
    container.innerHTML = buildResultDetailHtml(resolved, index);
    const tabs = container.querySelector('[data-info-tabs]');
    if (tabs && typeof activateInfoTab === 'function') activateInfoTab(tabs, 'profile');
  }

  showScreen('result-detail-screen');
}

function initResultDetailScreen() {
  const editBtn = document.getElementById('result-detail-edit-btn');
  if (!editBtn || editBtn.dataset.bound) return;
  editBtn.dataset.bound = 'true';
  editBtn.addEventListener('click', () => {
    if (currentDetailIndex != null) refazerTeste(currentDetailIndex);
  });
}

// Função reutilizável para gerar a seção de compartilhamento (utilisée dans results + full view)
function shareSectionHTML(index) {
    return `
        <div class="flex flex-wrap gap-2">
            <button onclick="if(window.shareFullResultOnWhatsApp)window.shareFullResultOnWhatsApp(${index});" 
                    class="type-btn min-h-[40px] px-4 py-2 glossy-btn rounded-full flex items-center gap-x-1 border border-[#292929]">
                ${icon('whatsapp', { size: 'sm', tone: 'whatsapp', className: 'mr-1' })}WhatsApp
            </button>
            <button onclick="if(window.shareFullResultOnTelegram)window.shareFullResultOnTelegram(${index});" 
                    class="type-btn min-h-[40px] px-4 py-2 glossy-btn rounded-full flex items-center gap-x-1 border border-[#292929]">
                ${icon('telegram', { size: 'sm', tone: 'telegram', className: 'mr-1' })}Telegram
            </button>
            <button onclick="if(window.shareFullResultOnInstagram)window.shareFullResultOnInstagram(${index});" 
                    class="type-btn min-h-[40px] px-4 py-2 glossy-btn rounded-full flex items-center gap-x-1 border border-[#292929]">
                ${icon('instagram', { size: 'sm', tone: 'instagram', className: 'mr-1' })}Instagram
            </button>
            <button onclick="if(window.copyFullResult)window.copyFullResult(${index});" 
                    class="type-btn min-h-[40px] px-4 py-2 border border-[#292929] hover:bg-[#111] rounded-full flex items-center gap-x-1">
                ${icon('copy', { size: 'sm', tone: 'muted', className: 'mr-1' })}Copier
            </button>
        </div>
    `;
}

// Compartilhar resultado específico do histórico (apenas WhatsApp)
function shareResultFromHistory(index) {
    const entry = currentHistoryCache[index];
    if (!entry) return;

    const resolved = HistoryManager.resolveEntry(entry);
    let text = `Mon résultat des 4 Tempéraments :\n\n`;

    if (resolved.isBalanced) {
        text += `Profil équilibré — 25% par tempérament\n\n`;
    } else {
        const dominant = TEMPERAMENTS[resolved.dominant];
        const secondary = TEMPERAMENTS[resolved.secondary];
        text += `Principal : ${dominant.name} (${Math.round(resolved.percentages[resolved.dominant])}%)\n`;
        text += `Secondaire : ${secondary.name} (${Math.round(resolved.percentages[resolved.secondary])}%)\n\n`;
    }

    text += `Fais le test toi aussi : https://clevencode.github.io/4temperament`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// =====================================================
// Partage depuis Vue Complète (historique) - corrigé
// Alinhado com a lógica de share no results.js
// =====================================================
function getFullResultText(index) {
    const entry = currentHistoryCache[index];
    if (!entry) return '';

    const resolved = HistoryManager.resolveEntry(entry);

    if (resolved.isBalanced) {
        let text = 'Mon profil des 4 Tempéraments est équilibré (25 % chacun).\n\n';
        text += `Sanguin ${resolved.percentages.sanguineo}% • Colérique ${resolved.percentages.colerico}% • `;
        text += `Mélancolique ${resolved.percentages.melancolico}% • Flegmatique ${resolved.percentages.fleumatico}%\n\n`;
        text += 'Fais le test toi aussi : https://clevencode.github.io/4temperament';
        return text;
    }

    const dominant = TEMPERAMENTS[resolved.dominant];
    const secondary = TEMPERAMENTS[resolved.secondary];

    let text = `Mon tempérament dominant est ${dominant.name} (${dominant.subtitle}).\n\n`;
    text += `Description : ${dominant.description}\n\n`;
    text += `Principal : ${dominant.name} (${Math.round(resolved.percentages[resolved.dominant])}%)\n`;
    text += `Secondaire : ${secondary.name} (${Math.round(resolved.percentages[resolved.secondary])}%)\n\n`;
    text += `Points forts : ${dominant.strengths.join(', ')}\n\n`;
    text += `Carrières recommandées : ${(dominant.recommendedCareers || []).join(', ')}\n`;
    text += `Activités préférées : ${(dominant.preferredActivities || []).join(', ')}\n\n`;
    text += 'Fais le test toi aussi : https://clevencode.github.io/4temperament';
    return text;
}

function shareFullResultOnWhatsApp(index) {
    const text = getFullResultText(index);
    if (!text) return;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function shareFullResultOnTelegram(index) {
    const text = getFullResultText(index);
    if (!text) return;
    const url = `https://t.me/share/url?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://clevencode.github.io/4temperament')}`;
    window.open(url, '_blank');
}

function shareFullResultOnInstagram(index) {
    const text = getFullResultText(index);
    if (!text) return;
    // Instagram: copier + ouvrir (même pattern que results)
    navigator.clipboard.writeText(text).then(() => {
        alert("Texte copié ! Ouvre Instagram et colle-le dans la légende d'un post ou d'une story.");
        window.open('https://www.instagram.com/', '_blank');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert("Texte copié ! Ouvre Instagram et colle-le.");
        window.open('https://www.instagram.com/', '_blank');
    });
}

function copyFullResult(index) {
    const text = getFullResultText(index);
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        alert("Résultat copié dans le presse-papiers !");
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert("Résultat copié !");
    });
}

// Exposer pour les handlers inline du shareSectionHTML
window.shareFullResultOnWhatsApp = shareFullResultOnWhatsApp;
window.shareFullResultOnTelegram = shareFullResultOnTelegram;
window.shareFullResultOnInstagram = shareFullResultOnInstagram;
window.copyFullResult = copyFullResult;

/**
 * Refazer / Editar um resultado do histórico.
 * Carrega as respostas antigas e marca para atualização (não cria novo registro).
 */
function refazerTeste(index) {
    const entry = currentHistoryCache[index];
    if (!entry) {
        navigateToIntro();
        return;
    }

    clearQuizProgress();
    currentEditingId = entry.id;
    answers = entry.answers
        ? (typeof QuizFlow !== 'undefined'
            ? QuizFlow.normalizeAnswers(entry.answers)
            : JSON.parse(JSON.stringify(entry.answers)))
        : {};
    userName = '';

    currentQuestionIndex = 0;
    navigateToQuiz();
    showQuestion();
    // Notice visibility is now handled inside showScreen based on currentEditingId
}

function startQuizAfterAbout() {
    clearQuizProgress();
    currentQuestionIndex = 0;
    answers = {};
    currentEditingId = null;
    navigateToQuiz();
    showQuestion();
}

function restartQuiz() {
    clearQuizProgress();
    answers = {};
    currentQuestionIndex = 0;
    userName = '';
    currentEditingId = null;
    navigateToIntro();
}

// Initialisation générale
function initializeApp() {
    // === MELHOR PRÁTICA: Carregar estado completo do usuário no início ===
    loadUserState();

    initializeTailwind();
    initHistoryScreen();
    initResultDetailScreen();
    if (typeof initInfoTabs === 'function') initInfoTabs();

    // Centralized navigation already exposed earlier. Delegate for external use.
    window.showScreen = showScreen;

    // Support clavier
    document.addEventListener('keydown', function(e) {
        const quizVisible = !document.getElementById('quiz-screen').classList.contains('hidden');
        if (!quizVisible) return;

        if (e.key === 'Enter' && !e.target.closest('.likert-option')) {
            e.preventDefault();
            nextQuestion();
        }
        
        if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
            prevQuestion();
        }
    });

    // Typing animation for the hero "TEMPÉRAMENT" word
    initTemperamentTyping();

    console.log('%c[Quiz] Application modularisée chargée avec succès (Y2K Black Premium)', 'color:#666');
}

// Typing animation for the four temperaments in the hero title
function initTemperamentTyping() {
    const typingEl = document.getElementById('temperament-typing');
    if (!typingEl) return;

    const words = ['SANGUIN', 'COLÉRIQUE', 'MÉLANCOLIQUE', 'FLEGMATIQUE'];
    const temperamentColors = {
        'SANGUIN': '#ff8a3d',      // Quente, energético (laranja)
        'COLÉRIQUE': '#ff5252',    // Fogo, líder (vermelho intenso)
        'MÉLANCOLIQUE': '#7b7eff', // Profundo, reflexivo (azul índigo)
        'FLEGMATIQUE': '#3ed9c4'   // Calmo, equilibrado (verde-azulado)
    };

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const chromeEl = typingEl.parentElement; // o span com a classe chrome-text

    function applyColor(word) {
        if (!chromeEl) return;

        const color = temperamentColors[word] || '#c9c9c9';
        // Gradiente tingido com a cor do temperamento, mantendo o efeito metálico
        chromeEl.style.background = `linear-gradient(145deg, ${color} 0%, #f5f5f5 22%, ${color} 48%, #a0a0a0 62%, ${color} 82%, #f5f5f5 100%)`;
        chromeEl.style.webkitBackgroundClip = 'text';
        chromeEl.style.webkitTextFillColor = 'transparent';
    }

    function type() {
        const currentWord = words[wordIndex];
        
        if (!isDeleting) {
            // Typing forward
            typingEl.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;

            // Aplica a cor assim que começar a digitar a palavra
            if (charIndex === 1) {
                applyColor(currentWord);
            }

            if (charIndex === currentWord.length) {
                // Pause at full word
                isDeleting = true;
                setTimeout(type, 1600);
                return;
            }
            setTimeout(type, 110);
        } else {
            // Deleting
            typingEl.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;

            if (charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(type, 450);
                return;
            }
            setTimeout(type, 60);
        }
    }

    // Define a cor inicial para o primeiro temperamento
    applyColor(words[0]);

    // Start the animation
    type();
}

// Initialiser quand le DOM est prêt
document.addEventListener('DOMContentLoaded', initializeApp);

// Expor funções globais úteis
window.startQuiz = startQuiz;
window.restartQuiz = restartQuiz;
window.persistQuizProgress = persistQuizProgress;
window.clearQuizProgress = clearQuizProgress;
window.updateIntroCta = updateIntroCta;