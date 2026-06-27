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
    // Cacher l'écran d'accueil
    document.getElementById('intro-screen').classList.add('hidden');

    // Como loadUserState() já rodou no init, userName já está carregado se existir.

    const prefs = loadPreferences();

    if (prefs && prefs.hasCompletedTest) {
        // Usuário já fez o teste antes → vai direto para o questionário
        currentEditingId = null;

        document.getElementById('quiz-screen').classList.remove('hidden');
        currentQuestionIndex = 0;
        answers = {};
        showQuestion();
        return;
    }

    // Primeira vez → pede nome
    document.getElementById('name-screen').classList.remove('hidden');
    
    // Pré-preencher nome (já deve estar em userName graças ao loadUserState)
    if (userName) {
        const nameInput = document.getElementById('user-name-input');
        if (nameInput) nameInput.value = userName;
    }

    // Focus sur le champ nom
    setTimeout(() => {
        const nameInput = document.getElementById('user-name-input');
        if (nameInput) nameInput.focus();
    }, 100);
}

function saveNameAndContinue() {
    const nameInput = document.getElementById('user-name-input');
    const name = nameInput.value.trim();
    
    // Le nom est optionnel - on accepte même s'il est vide
    userName = name;
    currentEditingId = null;
    
    // Salvar nome nas preferências
    saveNameOnly();
    
    // Cacher l'écran nom
    document.getElementById('name-screen').classList.add('hidden');
    
    // Afficher l'explication de l'application
    document.getElementById('about-screen').classList.remove('hidden');
}

function continueAnonymously() {
    userName = '';
    currentEditingId = null;
    
    // Cacher l'écran nom
    document.getElementById('name-screen').classList.add('hidden');
    
    // Aller directement à l'écran d'explication
    document.getElementById('about-screen').classList.remove('hidden');
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
    container.className = 'y2k-card chrome-border rounded-3xl max-w-lg w-full max-h-[85vh] overflow-auto relative';
    container.onclick = (e) => e.stopImmediatePropagation();

    // Header
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-7 py-5 sticky top-0 bg-[#0f0f0f] border-b border-[#222]';
    header.innerHTML = `
        <h3 id="history-title" class="font-bold text-xl y2k-heading">Historique des résultats</h3>
        <button class="text-3xl text-[#555] hover:text-white leading-none" aria-label="Fermer">×</button>
    `;
    header.querySelector('button').onclick = () => modal.remove();

    // Content
    const content = document.createElement('div');
    content.className = 'p-7';

    if (history.length === 0) {
        content.innerHTML = `<p class="text-[#888] text-center py-8">Aucun résultat enregistré pour le moment.</p>`;
    } else {
        history.forEach((entry, index) => {
            const dominant = TEMPERAMENTS[entry.dominant];
            const secondary = TEMPERAMENTS[entry.secondary];
            const dateStr = new Date(entry.date).toLocaleDateString('fr-FR', { 
                day: '2-digit', month: 'short', year: 'numeric' 
            });

            const card = document.createElement('div');
            card.className = 'border border-[#292929] rounded-2xl p-4 mb-3';
            card.dataset.historyIndex = index;

            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="flex items-center gap-x-2">
                            <span class="text-2xl">${dominant.emoji}</span>
                            <span class="font-semibold text-lg" style="color: ${dominant.color}">${dominant.name}</span>
                        </div>
                        <div class="text-xs text-[#888]">${dateStr} ${entry.userName && entry.userName.length > 0 ? '• ' + entry.userName : ''}</div>
                    </div>
                    <div class="text-right text-xs">
                        <div>Principal: <span class="font-semibold">${Math.round(entry.percentages[entry.dominant])}%</span></div>
                        <div class="text-[#888]">Secundário: ${secondary.name} (${Math.round(entry.percentages[entry.secondary])}%)</div>
                    </div>
                </div>
            `;

            // Action buttons container
            const actions = document.createElement('div');
            actions.className = 'flex flex-wrap gap-2 mt-3';

            // Share (WhatsApp as primary for this feature)
            const shareBtn = document.createElement('button');
            shareBtn.className = 'px-3 py-1 text-xs glossy-btn rounded-full flex items-center gap-x-1';
            shareBtn.innerHTML = `<i class="fa-brands fa-whatsapp"></i><span>Partager</span>`;
            shareBtn.onclick = (e) => {
                e.stopImmediatePropagation();
                shareResultFromHistory(index);
            };

            // Refazer (edit mode)
            const refazerBtn = document.createElement('button');
            refazerBtn.className = 'px-3 py-1 text-xs border border-[#444] hover:bg-[#222] rounded-full flex items-center gap-x-1';
            refazerBtn.innerHTML = `<i class="fa-solid fa-redo"></i><span>Refaire le test</span>`;
            refazerBtn.onclick = (e) => {
                e.stopImmediatePropagation();
                refazerTeste(index);
                modal.remove();
            };

            // Full view
            const viewBtn = document.createElement('button');
            viewBtn.className = 'px-3 py-1 text-xs border border-[#444] hover:bg-[#222] rounded-full flex items-center gap-x-1';
            viewBtn.innerHTML = `<i class="fa-solid fa-eye"></i><span>Vue complète</span>`;
            viewBtn.onclick = (e) => {
                e.stopImmediatePropagation();
                showFullResult(index);
                modal.remove();
            };

            actions.append(shareBtn, refazerBtn, viewBtn);
            card.appendChild(actions);
            content.appendChild(card);
        });
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'px-7 py-5 border-t border-[#222] flex justify-end gap-3';

    if (history.length > 0) {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'px-4 py-2 text-xs text-red-400 hover:text-red-300';
        clearBtn.textContent = 'Effacer l\'historique';
        clearBtn.onclick = () => {
            if (confirm('Voulez-vous vraiment effacer tout l\'historique ?')) {
                HistoryManager.clear();
                modal.remove();
                alert('Historique effacé.');
            }
        };
        footer.appendChild(clearBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'px-6 py-2 glossy-btn text-xs tracking-[2px] uppercase rounded-full';
    closeBtn.textContent = 'FERMER';
    closeBtn.onclick = () => modal.remove();
    footer.appendChild(closeBtn);

    container.append(header, content, footer);
    modal.append(container);
    document.body.appendChild(modal);

    // ESC to close (best practice for modals)
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler, { once: true });
}

function clearResultsHistory() {
    if (confirm('Voulez-vous vraiment effacer tout l\'historique des résultats ?')) {
        HistoryManager.clear();
        const modal = document.getElementById('results-history-modal');
        if (modal) modal.remove();
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

    const shareHTML = shareSectionHTML ? shareSectionHTML(index) : '';

    let html = `
        <div onclick="event.target.remove()" class="absolute inset-0"></div>
        <div onclick="event.stopImmediatePropagation()" class="y2k-card chrome-border rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto relative">
            <div class="flex items-center justify-between px-7 py-5 sticky top-0 bg-[#0f0f0f] border-b border-[#222]">
                <h3 class="font-bold text-xl y2k-heading">Vue complète du résultat</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-3xl text-[#555] hover:text-white">×</button>
            </div>

            <div class="p-7 space-y-6">

                <!-- Dominant -->
                <div>
                    <div class="flex items-center gap-x-3 mb-2">
                        <span class="text-5xl">${dominant.emoji}</span>
                        <div>
                            <div class="text-xs tracking-widest text-[#666]">TEMPÉRAMENT DOMINANT</div>
                            <div class="text-3xl font-bold" style="color: ${dominant.color}">${dominant.name}</div>
                            <div class="text-sm text-[#aaa]">${dominant.subtitle} — ${Math.round(entry.percentages[entry.dominant])}%</div>
                        </div>
                    </div>
                    <p class="text-sm leading-relaxed text-[#ccc]">${dominant.description}</p>
                </div>

                <!-- Secondary -->
                <div>
                    <div class="text-xs tracking-widest text-[#666] mb-1">TEMPÉRAMENT SECONDAIRE</div>
                    <div class="flex items-center gap-x-2">
                        <span class="text-3xl">${secondary.emoji}</span>
                        <span class="font-semibold text-xl" style="color: ${secondary.color}">${secondary.name}</span>
                        <span class="text-sm text-[#888]">(${Math.round(entry.percentages[entry.secondary])}%)</span>
                    </div>
                </div>

                <!-- Percentages -->
                <div>
                    <div class="text-xs tracking-widest text-[#666] mb-2">RÉPARTITION</div>
                    <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
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

            <!-- Share section (reutilizável) -->
            <div class="px-7 py-5 border-t border-[#222]">
                <div class="text-xs uppercase tracking-widest text-[#666] mb-2">Partager le résultat</div>
                ${shareSectionHTML ? shareSectionHTML(index) : ''}
            </div>

            <div class="px-7 py-5 border-t border-[#222] flex items-center justify-between text-xs text-[#666]">
                <div>${date} ${entry.userName && entry.userName.length > 0 ? '• ' + entry.userName : ''}</div>
                <button onclick="this.closest('.fixed').remove()" class="px-6 py-1.5 glossy-btn text-xs tracking-widest rounded-full">FERMER</button>
            </div>
        </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    // ESC to close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler, { once: true });
}

// Função reutilizável para gerar a seção de compartilhamento
function shareSectionHTML(index) {
    return `
        <div class="flex flex-wrap gap-2">
            <button onclick="shareFullResultOnWhatsApp(${index}); event.stopImmediatePropagation();" 
                    class="px-4 py-2 text-xs glossy-btn rounded-full tracking-widest uppercase flex items-center gap-x-1 border border-[#292929]">
                <i class="fa-brands fa-whatsapp mr-1"></i>WhatsApp
            </button>
            <button onclick="shareFullResultOnTelegram(${index}); event.stopImmediatePropagation();" 
                    class="px-4 py-2 text-xs glossy-btn rounded-full tracking-widest uppercase flex items-center gap-x-1 border border-[#292929]">
                <i class="fa-brands fa-telegram mr-1"></i>Telegram
            </button>
            <button onclick="shareFullResultOnInstagram(${index}); event.stopImmediatePropagation();" 
                    class="px-4 py-2 text-xs glossy-btn rounded-full tracking-widest uppercase flex items-center gap-x-1 border border-[#292929]">
                <i class="fa-brands fa-instagram mr-1"></i>Instagram
            </button>
            <button onclick="copyFullResult(${index}); event.stopImmediatePropagation();" 
                    class="px-4 py-2 text-xs border border-[#292929] hover:bg-[#111] rounded-full tracking-widest uppercase flex items-center gap-x-1">
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

/**
 * Refazer / Editar um resultado do histórico.
 * Carrega as respostas antigas e marca para atualização (não cria novo registro).
 */
function refazerTeste(index) {
    const entry = currentHistoryCache[index];
    if (!entry) {
        restartQuiz();
        return;
    }

    const modal = document.getElementById('results-history-modal');
    if (modal) modal.remove();

    // Marca que estamos editando este registro específico
    currentEditingId = entry.id;

    // Restaura respostas anteriores para edição
    answers = entry.answers ? JSON.parse(JSON.stringify(entry.answers)) : {};

    if (entry.userName && entry.userName.length > 0) {
        userName = entry.userName;
    }

    // Vai direto para as perguntas
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('name-screen').classList.add('hidden');
    document.getElementById('about-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.add('hidden');

    document.getElementById('quiz-screen').classList.remove('hidden');

    currentQuestionIndex = 0;
    showQuestion();
}

function startQuizAfterAbout() {
    // Cacher l'écran d'explication
    document.getElementById('about-screen').classList.add('hidden');
    
    // Afficher l'écran du quiz
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    // Réinitialiser l'état du questionnaire
    currentQuestionIndex = 0;
    answers = {};
    
    showQuestion();
}

function restartQuiz() {
    // Réinitialiser les données
    userName = '';
    currentEditingId = null;
    
    // Cacher tous les écrans sauf l'accueil
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('name-screen').classList.add('hidden');
    document.getElementById('about-screen').classList.add('hidden');
    document.getElementById('intro-screen').classList.remove('hidden');
}

// Initialisation générale
function initializeApp() {
    // === MELHOR PRÁTICA: Carregar estado completo do usuário no início ===
    loadUserState();

    initializeTailwind();

    // Screen management helper (focus + a11y)
    window.showScreen = function(screenId) {
        // Hide all screens
        document.querySelectorAll('[id$="-screen"]').forEach(s => {
            s.classList.add('hidden');
            s.setAttribute('aria-hidden', 'true');
        });
        // Hide modals? handled separately

        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
            screen.removeAttribute('aria-hidden');
            // Focus first interactive or heading
            const focusTarget = screen.querySelector('button, input, [tabindex], h1, h2, h3');
            if (focusTarget) setTimeout(() => focusTarget.focus(), 50);
        }
    };

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

    // Clique sur le logo pour revenir au début
    const logo = document.querySelector('.fa-brain');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.onclick = () => {
            document.getElementById('results-screen').classList.add('hidden');
            document.getElementById('quiz-screen').classList.add('hidden');
            document.getElementById('name-screen').classList.add('hidden');
            document.getElementById('about-screen').classList.add('hidden');
            document.getElementById('intro-screen').classList.remove('hidden');
        };
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