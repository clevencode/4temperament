// main.js - Ponto de entrada e inicialização do aplicativo

// Inicialização do Tailwind (se necessário)
function initializeTailwind() {
    // Tailwind já é carregado via CDN no index.html
    // Podemos adicionar configurações extras aqui no futuro
}

// Funções de navegação principais
function startQuiz() {
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    // Reset do estado
    currentQuestionIndex = 0;
    answers = {};
    
    showQuestion();
}

function restartQuiz() {
    // Voltar para a tela inicial
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('intro-screen').classList.remove('hidden');
}

// Inicialização geral
function initializeApp() {
    initializeTailwind();

    // Suporte a teclado
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

    // Clique no logo para voltar ao início
    const logo = document.querySelector('.fa-brain');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.onclick = () => {
            document.getElementById('results-screen').classList.add('hidden');
            document.getElementById('quiz-screen').classList.add('hidden');
            document.getElementById('intro-screen').classList.remove('hidden');
        };
    }

    console.log('%c[Quiz] Application modularisée chargée avec succès (Y2K Black Premium)', 'color:#666');
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);

// Expor funções globais úteis
window.startQuiz = startQuiz;
window.restartQuiz = restartQuiz;