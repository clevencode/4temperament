// main.js - Point d'entrée et initialisation de l'application

// --- PERSISTENCE (localStorage) ---
const PREFS_KEY = 'temperamentsPrefs';
const HISTORY_KEY = 'temperamentsResultsHistory';
const MAX_HISTORY_ENTRIES = 20;

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
  createEntry({ dominant, secondary, percentages, answers, userName }) {
    return {
      id: Date.now(),
      date: new Date().toISOString(),
      userName: userName || 'Anônimo',
      dominant,
      secondary,
      percentages,
      answers: answers || {}
    };
  }
};

// Estado temporário do módulo (evita poluir window global)
let currentHistoryCache = [];
let currentEditingId = null;

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
  currentEditingId = null;
  // Pas de reset de userName ici (logo simple = retour accueil)
  showScreen('intro-screen');
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
window.navigateToQuiz = navigateToQuiz;
window.navigateToResults = navigateToResults;

/**
 * MELHOR PRÁTICA: Carrega todo o estado do usuário de uma vez no início.
 * Isso garante que nome + histórico sobrevivam a reinícios do app.
 */
function loadUserState() {
    // Carregar preferências (nome + flag de já completou)
    const prefs = loadPreferences();
    if (prefs) {
        if (prefs.userName) {
            userName = prefs.userName;
        }
    }

    // Carregar histórico completo
    currentHistoryCache = HistoryManager.load();

    // Se não tiver nome salvo nas prefs, tenta pegar do último resultado do histórico
    if (!userName && currentHistoryCache.length > 0) {
        const last = currentHistoryCache[0];
        if (last.userName && last.userName !== 'Anônimo') {
            userName = last.userName;
        }
    }

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
    // Usar navegação centralizada
    const prefs = loadPreferences();

    if (prefs && prefs.hasCompletedTest) {
        // Usuário já fez o teste antes → vai direto para o questionário (novo ou après historique)
        currentEditingId = null;
        navigateToQuiz();
        currentQuestionIndex = 0;
        answers = {};
        showQuestion();
        return;
    }

    // Primeira vez → demande nom (flux guidé)
    showScreen('name-screen');

    // Pré-preencher nome (persistência)
    if (userName) {
        const nameInput = document.getElementById('user-name-input');
        if (nameInput) nameInput.value = userName;
    }

    setTimeout(() => {
        const nameInput = document.getElementById('user-name-input');
        if (nameInput) nameInput.focus();
    }, 80);
}

function saveNameAndContinue() {
    const nameInput = document.getElementById('user-name-input');
    const name = nameInput ? nameInput.value.trim() : '';
    
    userName = name;
    currentEditingId = null;
    saveNameOnly();
    
    // Navigation centralisée vers about (explication)
    showScreen('about-screen');
}

function continueAnonymously() {
    userName = '';
    currentEditingId = null;
    
    showScreen('about-screen');
}

// Melhor prática: função única para salvar preferências do usuário
function saveUserPreferences(extra = {}) {
    try {
        const existing = localStorage.getItem(PREFS_KEY);
        let prefs = existing ? JSON.parse(existing) : {};

        if (userName) prefs.userName = userName;
        if (extra.hasCompletedTest) prefs.hasCompletedTest = true;

        Object.assign(prefs, extra);

        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch(e) {
        console.warn('Erro ao salvar preferências do usuário');
    }
}

function saveNameOnly() {
    saveUserPreferences();
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
        userName
    });

    if (currentEditingId) {
        // Modo edição: atualiza o resultado existente
        HistoryManager.update(currentEditingId, {
            dominant: entry.dominant,
            secondary: entry.secondary,
            percentages: entry.percentages,
            answers: entry.answers,
            lastEdited: new Date().toISOString()
        });
        currentEditingId = null;
    } else {
        // Novo resultado
        HistoryManager.add(entry);
    }

    // Garante que o nome do usuário fique salvo nas preferências (melhor prática)
    if (userName) {
        saveUserPreferences();
    }
}

function loadResultsHistory() {
    return HistoryManager.load();
}

/**
 * Exibe o histórico de resultados.
 * Usa abordagem com event delegation para melhor performance e manutenção.
 */
function showResultsHistory() {
    const history = loadResultsHistory();
    currentHistoryCache = history; // cache para event handlers

    const modal = document.createElement('div');
    modal.id = 'results-history-modal';
    modal.className = 'fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'history-title');

    // Container principal
    const container = document.createElement('div');
    container.className = 'y2k-card chrome-border rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[95dvh] sm:max-h-[85vh] overflow-auto relative';
    container.onclick = (e) => e.stopImmediatePropagation();

    // Header
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-4 sm:px-7 py-4 sm:py-5 sticky top-0 bg-[#0f0f0f] border-b border-[#222]';
    header.innerHTML = `
        <h3 id="history-title" class="font-bold text-xl y2k-heading">Historique des résultats</h3>
        <button class="text-3xl text-[#555] hover:text-white leading-none" aria-label="Fermer">×</button>
    `;
    const headerCloseBtn = header.querySelector('button');
    headerCloseBtn.onclick = () => closeModal(modal);
    headerCloseBtn.setAttribute('aria-label', 'Fermer l\'historique');

    // Content
    const content = document.createElement('div');
    content.className = 'p-4 sm:p-7';

    // Bouton pour nouveau test (intuitif: séparer nouveau vs modifier)
    const newTestBtn = document.createElement('button');
    newTestBtn.className = 'w-full mb-4 px-4 py-2 glossy-btn rounded-full text-xs tracking-widest uppercase flex items-center justify-center gap-x-2';
    newTestBtn.innerHTML = `<i class="fa-solid fa-plus"></i><span>Nouveau test</span>`;
    newTestBtn.onclick = () => {
        closeModal(modal);
        currentEditingId = null;
        startQuiz();
    };
    content.appendChild(newTestBtn);

    if (history.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'text-[#888] text-center py-8';
        emptyMsg.textContent = 'Aucun résultat enregistré pour le moment.';
        content.appendChild(emptyMsg);
    } else {
        // Use event delegation on the content container for better navegabilidade & perf
        content.addEventListener('click', (e) => {
            const card = e.target.closest('[data-history-index]');
            if (!card) return;
            const idx = parseInt(card.dataset.historyIndex, 10);
            if (isNaN(idx)) return;

            if (e.target.closest('[data-action="share"]')) {
                e.stopImmediatePropagation();
                shareResultFromHistory(idx);
            } else if (e.target.closest('[data-action="edit"]')) {
                e.stopImmediatePropagation();
                refazerTeste(idx);
                closeModal(modal);
            } else if (e.target.closest('[data-action="view"]')) {
                e.stopImmediatePropagation();
                showFullResult(idx);
                closeModal(modal);
            } else {
                // Click on card body → vue complète (discoverability)
                showFullResult(idx);
                closeModal(modal);
            }
        });

        history.forEach((entry, index) => {
            const dominant = TEMPERAMENTS[entry.dominant];
            const secondary = TEMPERAMENTS[entry.secondary];
            const dateStr = new Date(entry.date).toLocaleDateString('fr-FR', { 
                day: '2-digit', month: 'short', year: 'numeric' 
            });

            const card = document.createElement('div');
            card.className = 'border border-[#292929] rounded-2xl p-4 mb-3 cursor-pointer hover:border-[#555] transition-colors';
            card.style.borderLeft = `4px solid ${dominant.color}`;
            card.dataset.historyIndex = index;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Voir détails du résultat ${dominant.name}`);

            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="flex items-center gap-x-2">
                            <span class="text-2xl">${dominant.emoji}</span>
                            <span class="font-semibold text-base sm:text-lg" style="color: ${dominant.color}">${dominant.name}</span>
                        </div>
                        <div class="text-[10px] sm:text-xs text-[#888]">${dateStr} ${entry.userName && entry.userName.length > 0 ? '• ' + entry.userName : ''}</div>
                    </div>
                    <div class="text-right text-[10px] sm:text-xs">
                        <div>Principal: <span class="font-semibold">${Math.round(entry.percentages[entry.dominant])}%</span></div>
                        <div class="text-[#888]">Secundário: ${secondary.name} (${Math.round(entry.percentages[entry.secondary])}%)</div>
                    </div>
                </div>
            `;

            // Actions explicites (icônes + labels) pour découvrabilité
            const actions = document.createElement('div');
            actions.className = 'flex flex-wrap gap-2 mt-3';
            actions.innerHTML = `
                <button data-action="share" class="px-3 py-1 text-xs glossy-btn rounded-full flex items-center gap-x-1" aria-label="Partager sur WhatsApp">
                    <i class="fa-brands fa-whatsapp"></i><span>Partager</span>
                </button>
                <button data-action="edit" class="px-3 py-1 text-xs border border-[#444] hover:bg-[#222] rounded-full flex items-center gap-x-1" aria-label="Modifier ce résultat">
                    <i class="fa-solid fa-edit"></i><span>Modifier</span>
                </button>
                <button data-action="view" class="px-3 py-1 text-xs border border-[#444] hover:bg-[#222] rounded-full flex items-center gap-x-1" aria-label="Voir les détails complets">
                    <i class="fa-solid fa-eye"></i><span>Détails</span>
                </button>
            `;

            card.appendChild(actions);
            content.appendChild(card);
        });
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'px-4 sm:px-7 py-4 sm:py-5 border-t border-[#222] flex justify-end gap-3';

    if (history.length > 0) {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'px-4 py-2 text-xs text-red-400 hover:text-red-300';
        clearBtn.textContent = 'Effacer l\'historique';
        clearBtn.onclick = () => {
            if (confirm('Voulez-vous vraiment effacer tout l\'historique ?')) {
                HistoryManager.clear();
                closeModal(modal);
                // Optionally refresh if needed
                alert('Historique effacé.');
            }
        };
        footer.appendChild(clearBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'px-6 py-2 glossy-btn text-xs tracking-[2px] uppercase rounded-full';
    closeBtn.textContent = 'FERMER';
    closeBtn.onclick = () => closeModal(modal);
    footer.appendChild(closeBtn);

    container.append(header, content, footer);
    modal.append(container);
    document.body.appendChild(modal);

    // ESC standardisé
    attachModalEscClose(modal);
}

function clearResultsHistory() {
    if (confirm('Voulez-vous vraiment effacer tout l\'historique des résultats ?')) {
        HistoryManager.clear();
        const modal = document.getElementById('results-history-modal');
        if (modal) closeModal(modal);
        alert('Historique effacé.');
    }
}

function showFullResult(index) {
    const entry = currentHistoryCache[index];
    if (!entry) return;

    const dominant = TEMPERAMENTS[entry.dominant];
    const secondary = TEMPERAMENTS[entry.secondary];

    const date = new Date(entry.date).toLocaleDateString('fr-FR', { 
        day: '2-digit', month: 'long', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    // Backdrop separate for reliable close
    const backdrop = document.createElement('div');
    backdrop.className = 'absolute inset-0';
    backdrop.onclick = () => closeModal(modal);

    const content = document.createElement('div');
    content.className = 'y2k-card chrome-border rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[95dvh] sm:max-h-[90vh] overflow-auto relative';
    content.onclick = (e) => e.stopImmediatePropagation();

    const shareHTML = (typeof shareSectionHTML === 'function') ? shareSectionHTML(index) : '';

    content.innerHTML = `
        <div class="flex items-center justify-between px-4 sm:px-7 py-4 sm:py-5 sticky top-0 bg-[#0f0f0f] border-b border-[#222]">
            <h3 class="font-bold text-xl y2k-heading">Vue complète du résultat</h3>
            <button class="text-3xl text-[#555] hover:text-white leading-none" aria-label="Fermer">×</button>
        </div>

        <div class="p-4 sm:p-7 space-y-5 sm:space-y-6">

            <!-- Contexte -->
            <div class="text-xs text-[#888] mb-2">
                Résultat du ${date} ${entry.userName && entry.userName.length > 0 ? '• ' + entry.userName : ''}
            </div>

            <!-- Dominant -->
            <div>
                <div class="flex items-center gap-x-3 mb-2">
                    <span class="text-4xl sm:text-5xl">${dominant.emoji}</span>
                    <div>
                        <div class="text-xs tracking-widest text-[#666]">TEMPÉRAMENT DOMINANT</div>
                        <div class="text-2xl sm:text-3xl font-bold" style="color: ${dominant.color}">${dominant.name}</div>
                        <div class="text-sm text-[#aaa]">${dominant.subtitle} — ${Math.round(entry.percentages[entry.dominant])}%</div>
                    </div>
                </div>
                <p class="text-sm leading-relaxed text-[#ccc]">${dominant.description}</p>
            </div>

            <!-- Secondary -->
            <div>
                <div class="text-xs tracking-widest text-[#666] mb-1">TEMPÉRAMENT SECONDAIRE</div>
                <div class="flex items-center gap-x-2">
                    <span class="text-2xl sm:text-3xl">${secondary.emoji}</span>
                    <span class="font-semibold text-lg sm:text-xl" style="color: ${secondary.color}">${secondary.name}</span>
                    <span class="text-sm text-[#888]">(${Math.round(entry.percentages[entry.secondary])}%)</span>
                </div>
            </div>

            <!-- Percentages -->
            <div>
                <div class="text-xs tracking-widest text-[#666] mb-2">RÉPARTITION</div>
                <div class="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-1 text-xs sm:text-sm">
                    ${Object.keys(entry.percentages).map(key => {
                        const t = TEMPERAMENTS[key];
                        const pct = entry.percentages[key];
                        return `<div class="flex justify-between"><span>${t.emoji} ${t.name}</span><span class="font-semibold">${pct}%</span></div>`;
                    }).join('')}
                </div>
            </div>

            <!-- Strengths -->
            <div>
                <div class="flex items-center gap-x-2 mb-2 text-emerald-400">
                    <i class="fa-solid fa-check"></i>
                    <span class="uppercase tracking-widest text-xs font-semibold">Points forts</span>
                </div>
                <ul class="space-y-1 text-sm text-[#ccc]">
                    ${dominant.strengths.map(s => `<li>• ${s}</li>`).join('')}
                </ul>
            </div>

            <!-- Weaknesses -->
            <div>
                <div class="flex items-center gap-x-2 mb-2 text-amber-400">
                    <i class="fa-solid fa-exclamation"></i>
                    <span class="uppercase tracking-widest text-xs font-semibold">À améliorer</span>
                </div>
                <ul class="space-y-1 text-sm text-[#ccc]">
                    ${dominant.weaknesses.map(w => `<li>• ${w}</li>`).join('')}
                </ul>
            </div>

            <!-- Careers -->
            <div>
                <div class="flex items-center gap-x-2 mb-2 text-[#888]">
                    <i class="fa-solid fa-briefcase"></i>
                    <span class="uppercase tracking-widest text-xs font-semibold">Carrières recommandées</span>
                </div>
                <ul class="space-y-1 text-sm text-[#ccc]">
                    ${(dominant.recommendedCareers || []).map(c => `<li>• ${c}</li>`).join('')}
                </ul>
            </div>

            <!-- Activities -->
            <div>
                <div class="flex items-center gap-x-2 mb-2 text-[#888]">
                    <i class="fa-solid fa-heart"></i>
                    <span class="uppercase tracking-widest text-xs font-semibold">Activités préférées</span>
                </div>
                <ul class="space-y-1 text-sm text-[#ccc]">
                    ${(dominant.preferredActivities || []).map(a => `<li>• ${a}</li>`).join('')}
                </ul>
            </div>

        </div>

        <!-- Share section (réutilisable) -->
        <div class="px-4 sm:px-7 py-4 sm:py-5 border-t border-[#222]">
            <div class="text-xs uppercase tracking-widest text-[#666] mb-2">Partager le résultat</div>
            ${shareHTML}
        </div>

        <div class="px-4 sm:px-7 py-4 sm:py-5 border-t border-[#222] flex flex-wrap gap-2 items-center justify-between text-xs text-[#666]">
            <button class="edit-from-full px-4 py-1.5 text-xs border border-[#444] hover:bg-[#222] rounded-full flex items-center gap-x-1">
                <i class="fa-solid fa-edit"></i>
                <span>Modifier</span>
            </button>
            <button class="close-full px-5 sm:px-6 py-1.5 glossy-btn text-xs tracking-widest rounded-full">FERMER</button>
        </div>
    `;

    // Attach handlers after
    const xBtn = content.querySelector('button[aria-label="Fermer"]');
    if (xBtn) xBtn.onclick = () => closeModal(modal);

    const editBtn = content.querySelector('.edit-from-full');
    if (editBtn) editBtn.onclick = () => {
        closeModal(modal);
        refazerTeste(index);
    };

    const closeFooterBtn = content.querySelector('.close-full');
    if (closeFooterBtn) closeFooterBtn.onclick = () => closeModal(modal);

    modal.append(backdrop, content);
    document.body.appendChild(modal);

    attachModalEscClose(modal);
}

// =====================================================
// HELPERS MODAUX (standardisation pour navegabilidade)
// Fermeture cohérente (ESC, backdrop, X) pour tous les modaux dynamiques
// =====================================================
function closeModal(modal) {
  if (!modal) return;
  if (modal.parentNode) modal.parentNode.removeChild(modal);
}

function attachModalEscClose(modal, onClose) {
  const handler = (e) => {
    if (e.key === 'Escape') {
      closeModal(modal);
      if (onClose) onClose();
      document.removeEventListener('keydown', handler);
    }
  };
  document.addEventListener('keydown', handler, { once: true });
  return handler;
}

// Função reutilizável para gerar a seção de compartilhamento (utilisée dans results + full view)
function shareSectionHTML(index) {
    return `
        <div class="flex flex-wrap gap-2">
            <button onclick="if(window.shareFullResultOnWhatsApp)window.shareFullResultOnWhatsApp(${index});" 
                    class="min-h-[40px] px-3 sm:px-4 py-2 text-xs glossy-btn rounded-full tracking-widest uppercase flex items-center gap-x-1 border border-[#292929]">
                <i class="fa-brands fa-whatsapp mr-1"></i>WhatsApp
            </button>
            <button onclick="if(window.shareFullResultOnTelegram)window.shareFullResultOnTelegram(${index});" 
                    class="min-h-[40px] px-3 sm:px-4 py-2 text-xs glossy-btn rounded-full tracking-widest uppercase flex items-center gap-x-1 border border-[#292929]">
                <i class="fa-brands fa-telegram mr-1"></i>Telegram
            </button>
            <button onclick="if(window.shareFullResultOnInstagram)window.shareFullResultOnInstagram(${index});" 
                    class="min-h-[40px] px-3 sm:px-4 py-2 text-xs glossy-btn rounded-full tracking-widest uppercase flex items-center gap-x-1 border border-[#292929]">
                <i class="fa-brands fa-instagram mr-1"></i>Instagram
            </button>
            <button onclick="if(window.copyFullResult)window.copyFullResult(${index});" 
                    class="min-h-[40px] px-3 sm:px-4 py-2 text-xs border border-[#292929] hover:bg-[#111] rounded-full tracking-widest uppercase flex items-center gap-x-1">
                <i class="fa-solid fa-copy mr-1"></i>Copier
            </button>
        </div>
    `;
}

// Permettre d'appuyer sur Entrée dans le champ nom
function setupNameInput() {
    const nameInput = document.getElementById('user-name-input');
    if (nameInput) {
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveNameAndContinue();
            }
        });
    }
}

// Compartilhar resultado específico do histórico (apenas WhatsApp)
function shareResultFromHistory(index) {
    const entry = currentHistoryCache[index];
    if (!entry) return;

    const dominant = TEMPERAMENTS[entry.dominant];
    const secondary = TEMPERAMENTS[entry.secondary];

    let text = `Mon résultat des 4 Tempéraments :\n\n`;

    if (entry.userName && entry.userName.length > 0) {
        text += `Nom : ${entry.userName}\n`;
    }

    text += `Principal : ${dominant.name} (${Math.round(entry.percentages[entry.dominant])}%)\n`;
    text += `Secondaire : ${secondary.name} (${Math.round(entry.percentages[entry.secondary])}%)\n\n`;
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
    const dominant = TEMPERAMENTS[entry.dominant];
    const secondary = TEMPERAMENTS[entry.secondary];
    const namePart = (entry.userName && entry.userName.length > 0) ? `${entry.userName} - ` : '';

    let text = `${namePart}Mon tempérament dominant est ${dominant.name} (${dominant.subtitle}).\n\n`;
    text += `Description : ${dominant.description}\n\n`;
    text += `Principal : ${dominant.name} (${Math.round(entry.percentages[entry.dominant])}%)\n`;
    text += `Secondaire : ${secondary.name} (${Math.round(entry.percentages[entry.secondary])}%)\n\n`;
    text += `Points forts : ${dominant.strengths.join(', ')}\n\n`;
    text += `Carrières recommandées : ${(dominant.recommendedCareers || []).join(', ')}\n`;
    text += `Activités préférées : ${(dominant.preferredActivities || []).join(', ')}\n\n`;
    text += `Fais le test toi aussi : https://clevencode.github.io/4temperament`;
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

    const modal = document.getElementById('results-history-modal');
    if (modal) modal.remove();

    // Business logic: edition met à jour l'entrée existante (pas de duplication)
    currentEditingId = entry.id;
    answers = entry.answers ? JSON.parse(JSON.stringify(entry.answers)) : {};
    if (entry.userName && entry.userName.length > 0) {
        userName = entry.userName;
    }

    currentQuestionIndex = 0;
    navigateToQuiz();
    showQuestion();
    // Notice visibility is now handled inside showScreen based on currentEditingId
}

function startQuizAfterAbout() {
    // Réinitialiser quiz state pour un nouveau parcours
    currentQuestionIndex = 0;
    answers = {};
    // Note: currentEditingId doit déjà être null ici (flux normal)
    navigateToQuiz();
    showQuestion();
}

function restartQuiz() {
    // Retour à l'accueil propre : réinitialise états + navigation centralisée
    userName = '';
    currentEditingId = null;
    navigateToIntro();
}

// Initialisation générale
function initializeApp() {
    // === MELHOR PRÁTICA: Carregar estado completo do usuário no início ===
    loadUserState();

    initializeTailwind();

    // Centralized navigation already exposed earlier. Delegate for external use.
    window.showScreen = showScreen;

    // Support clavier
    document.addEventListener('keydown', function(e) {
        const quizVisible = !document.getElementById('quiz-screen').classList.contains('hidden');
        if (!quizVisible) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            nextQuestion();
        }
        
        if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
            prevQuestion();
        }
    });

    // Logo clique → home fiable (navegabilidade)
    const logo = document.querySelector('.fa-brain');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.setAttribute('aria-label', 'Retour à l\'accueil');
        logo.onclick = () => navigateToIntro();
    }

    // Configurer le champ nom
    setupNameInput();

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