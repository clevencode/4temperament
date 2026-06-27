// main.js - Point d'entrée et initialisation de l'application

// --- PERSISTENCE (localStorage) ---
const PREFS_KEY = 'temperamentsPrefs';
const RESULTS_HISTORY_KEY = 'temperamentsResultsHistory';

let currentResultsHistory = [];
let editingHistoryId = null;

function savePreferences() {
    const prefs = {
        userName: userName || '',
        hasCompletedTest: true
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
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

    const prefs = loadPreferences();

    if (prefs && prefs.hasCompletedTest) {
        // Usuário já fez o teste antes → vai direto para o questionário
        editingHistoryId = null;
        // (pode preencher nome salvo se existir)
        if (prefs.userName) {
            userName = prefs.userName;
        }
        document.getElementById('quiz-screen').classList.remove('hidden');
        currentQuestionIndex = 0;
        answers = {};
        showQuestion();
        return;
    }

    // Primeira vez → pede nome
    document.getElementById('name-screen').classList.remove('hidden');
    
    // Pré-preencher nome se salvo
    if (prefs && prefs.userName) {
        const nameInput = document.getElementById('user-name-input');
        if (nameInput) nameInput.value = prefs.userName;
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
    editingHistoryId = null;
    
    // Salvar nome nas preferências
    saveNameOnly();
    
    // Cacher l'écran nom
    document.getElementById('name-screen').classList.add('hidden');
    
    // Afficher l'explication de l'application
    document.getElementById('about-screen').classList.remove('hidden');
}

function continueAnonymously() {
    userName = '';
    editingHistoryId = null;
    
    // Cacher l'écran nom
    document.getElementById('name-screen').classList.add('hidden');
    
    // Aller directement à l'écran d'explication
    document.getElementById('about-screen').classList.remove('hidden');
}

// Salva apenas o nome (sem marcar como completado)
function saveNameOnly() {
    try {
        const existing = localStorage.getItem(PREFS_KEY);
        let prefs = existing ? JSON.parse(existing) : {};
        prefs.userName = userName || '';
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch(e) {}
}

// === HISTÓRICO DE RESULTADOS FINAIS ===

function saveResultToHistory(resultData) {
    try {
        let history = [];
        const saved = localStorage.getItem(RESULTS_HISTORY_KEY);
        if (saved) {
            history = JSON.parse(saved);
        }

        const newEntry = {
            id: editingHistoryId || Date.now(),
            date: editingHistoryId 
                ? (history.find(h => h.id === editingHistoryId)?.date || new Date().toISOString()) 
                : new Date().toISOString(),
            userName: userName || 'Anônimo',
            dominant: resultData.dominant,
            secondary: resultData.secondary,
            percentages: resultData.percentages,
            answers: resultData.answers || {}
        };

        if (editingHistoryId) {
            // Atualiza o registro existente em vez de criar novo
            const idx = history.findIndex(h => h.id === editingHistoryId);
            if (idx !== -1) {
                history[idx] = newEntry;
            } else {
                history.unshift(newEntry);
            }
        } else {
            history.unshift(newEntry);
        }

        // Limita a 20 resultados
        if (history.length > 20) {
            history = history.slice(0, 20);
        }

        localStorage.setItem(RESULTS_HISTORY_KEY, JSON.stringify(history));
        editingHistoryId = null; // limpa após salvar
    } catch (e) {
        console.warn('Não foi possível salvar histórico de resultados');
    }
}

function loadResultsHistory() {
    try {
        const saved = localStorage.getItem(RESULTS_HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function showResultsHistory() {
    const history = loadResultsHistory();
    currentResultsHistory = history;

    const modal = document.createElement('div');
    modal.id = 'temp-results-history-modal';
    modal.className = 'fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4';
    
    let html = `
        <div onclick="event.target.remove()" class="absolute inset-0"></div>
        <div onclick="event.stopImmediatePropagation()" class="y2k-card chrome-border rounded-3xl max-w-lg w-full max-h-[85vh] overflow-auto relative">
            <div class="flex items-center justify-between px-7 py-5 sticky top-0 bg-[#0f0f0f] border-b border-[#222]">
                <h3 class="font-bold text-xl y2k-heading">Historique des résultats</h3>
                <button onclick="this.closest('#temp-results-history-modal').remove()" class="text-3xl text-[#555] hover:text-white">×</button>
            </div>
            <div class="p-7">
    `;

    if (history.length === 0) {
        html += `<p class="text-[#888] text-center py-8">Aucun résultat enregistré pour le moment.</p>`;
    } else {
        history.forEach((entry, i) => {
            const dominant = TEMPERAMENTS[entry.dominant];
            const secondary = TEMPERAMENTS[entry.secondary];
            const date = new Date(entry.date).toLocaleDateString('fr-FR', { 
                day: '2-digit', month: 'short', year: 'numeric' 
            });

            html += `
                <div class="border border-[#292929] rounded-2xl p-4 mb-3">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="flex items-center gap-x-2">
                                <span class="text-2xl">${dominant.emoji}</span>
                                <span class="font-semibold text-lg" style="color: ${dominant.color}">${dominant.name}</span>
                            </div>
                            <div class="text-xs text-[#888]">${date} ${entry.userName && entry.userName.length > 0 ? '• ' + entry.userName : ''}</div>
                        </div>
                        <div class="text-right text-xs">
                            <div>Principal: <span class="font-semibold">${Math.round(entry.percentages[entry.dominant])}%</span></div>
                            <div class="text-[#888]">Secundário: ${secondary.name} (${Math.round(entry.percentages[entry.secondary])}%)</div>
                        </div>
                    </div>

                    <!-- Opções por resultado -->
                    <div class="flex flex-wrap gap-2 mt-3">
                        <button onclick="shareResultFromHistory(${i}); event.stopImmediatePropagation();" 
                                class="px-3 py-1 text-xs glossy-btn rounded-full flex items-center gap-x-1">
                            <i class="fa-brands fa-whatsapp"></i>
                            <span>Partager</span>
                        </button>
                        <button onclick="refazerTeste(${i}); this.closest('#temp-results-history-modal').remove();" 
                                class="px-3 py-1 text-xs border border-[#444] hover:bg-[#222] rounded-full flex items-center gap-x-1">
                            <i class="fa-solid fa-redo"></i>
                            <span>Refaire le test</span>
                        </button>
                        <button onclick="showFullResult(${i}); this.closest('#temp-results-history-modal').remove();" 
                                class="px-3 py-1 text-xs border border-[#444] hover:bg-[#222] rounded-full flex items-center gap-x-1">
                            <i class="fa-solid fa-eye"></i>
                            <span>Vue complète</span>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    html += `
            </div>
            <div class="px-7 py-5 border-t border-[#222] flex justify-end gap-3">
                ${history.length > 0 ? `<button onclick="clearResultsHistory(); this.closest('#temp-results-history-modal').remove()" class="px-4 py-2 text-xs text-red-400 hover:text-red-300">Effacer l'historique</button>` : ''}
                <button onclick="this.closest('#temp-results-history-modal').remove()" class="px-6 py-2 glossy-btn text-xs tracking-[2px] uppercase rounded-full">FERMER</button>
            </div>
        </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function clearResultsHistory() {
    if (confirm('Voulez-vous vraiment effacer tout l\'historique des résultats ?')) {
        localStorage.removeItem(RESULTS_HISTORY_KEY);
        const modal = document.getElementById('temp-results-history-modal');
        if (modal) modal.remove();
        alert('Historique effacé.');
    }
}

function showFullResult(index) {
    const entry = currentResultsHistory[index];
    if (!entry) return;

    const dominant = TEMPERAMENTS[entry.dominant];
    const secondary = TEMPERAMENTS[entry.secondary];

    const date = new Date(entry.date).toLocaleDateString('fr-FR', { 
        day: '2-digit', month: 'long', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4';

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

            <div class="px-7 py-5 border-t border-[#222] flex items-center justify-between text-xs text-[#666]">
                <div>${date} ${entry.userName && entry.userName.length > 0 ? '• ' + entry.userName : ''}</div>
                <button onclick="this.closest('.fixed').remove()" class="px-6 py-1.5 glossy-btn text-xs tracking-widest rounded-full">FERMER</button>
            </div>
        </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);
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
    const entry = currentResultsHistory[index];
    if (!entry) return;

    const dominant = TEMPERAMENTS[entry.dominant];
    const secondary = TEMPERAMENTS[entry.secondary];

    let text = `Mon résultat des 4 Tempéraments :\n\n`;

    if (entry.userName && entry.userName !== 'Anônimo') {
        text += `Nom : ${entry.userName}\n`;
    }

    text += `Principal : ${dominant.name} (${Math.round(entry.percentages[entry.dominant])}%)\n`;
    text += `Secondaire : ${secondary.name} (${Math.round(entry.percentages[entry.secondary])}%)\n\n`;
    text += `Fais le test toi aussi : https://clevencode.github.io/4temperament`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Refazer o teste (edita o resultado anterior em vez de criar novo)
function refazerTeste(index) {
    const entry = currentResultsHistory[index];
    if (!entry) {
        restartQuiz();
        return;
    }

    const modal = document.getElementById('temp-results-history-modal');
    if (modal) modal.remove();

    // Define que estamos editando este registro específico
    editingHistoryId = entry.id;

    // Carrega as respostas anteriores (para editar)
    answers = entry.answers ? JSON.parse(JSON.stringify(entry.answers)) : {};

    if (entry.userName && entry.userName !== 'Anônimo') {
        userName = entry.userName;
    }

    // Esconde todas as telas
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('name-screen').classList.add('hidden');
    document.getElementById('about-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.add('hidden');

    // Vai direto para o questionário com as respostas anteriores carregadas
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
    editingHistoryId = null;
    
    // Cacher tous les écrans sauf l'accueil
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('name-screen').classList.add('hidden');
    document.getElementById('about-screen').classList.add('hidden');
    document.getElementById('intro-screen').classList.remove('hidden');
}

// Initialisation générale
function initializeApp() {
    initializeTailwind();

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

    console.log('%c[Quiz] Application modularisée chargée avec succès (Y2K Black Premium)', 'color:#666');
}

// Initialiser quand le DOM est prêt
document.addEventListener('DOMContentLoaded', initializeApp);

// Expor funções globais úteis
window.startQuiz = startQuiz;
window.restartQuiz = restartQuiz;