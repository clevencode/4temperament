// results.js - Lógica de cálculo e exibição de resultados

function calculateResults() {
    const scores = {
        sanguineo: 0,
        colerico: 0,
        melancolico: 0,
        fleumatico: 0
    };

    // Contar respostas
    Object.values(answers).forEach(type => {
        if (scores[type] !== undefined) scores[type]++;
    });

    const total = Object.values(scores).reduce((a, b) => a + b, 0) || 14;

    const percentages = {
        sanguineo: Math.round((scores.sanguineo / total) * 100),
        colerico: Math.round((scores.colerico / total) * 100),
        melancolico: Math.round((scores.melancolico / total) * 100),
        fleumatico: Math.round((scores.fleumatico / total) * 100)
    };

    // Ordenar para encontrar dominante e secundário
    let sorted = Object.entries(percentages).sort((a, b) => b[1] - a[1]);
    
    return {
        scores,
        percentages,
        dominant: sorted[0][0],
        secondary: sorted[1][0],
        dominantPercent: sorted[0][1]
    };
}

function showResults() {
    document.getElementById('quiz-screen').classList.add('hidden');
    const resultsScreen = document.getElementById('results-screen');
    resultsScreen.classList.remove('hidden');

    const result = calculateResults();
    const dominant = TEMPERAMENTS[result.dominant];
    const secondary = TEMPERAMENTS[result.secondary];

    // Cartão principal (estilo Y2K preto)
    const mainCard = document.getElementById('main-result-card');
    mainCard.style.background = `linear-gradient(145deg, #161616 0%, #0a0a0a 100%)`;
    mainCard.style.border = `1px solid #2f2f2f`;
    
    document.getElementById('result-name').textContent = dominant.name;
    document.getElementById('result-name').style.color = dominant.color;
    document.getElementById('result-subtitle').textContent = dominant.subtitle;
    document.getElementById('result-subtitle').style.color = '#aaa';
    
    const iconContainer = document.getElementById('result-icon');
    iconContainer.innerHTML = `<span style="color:${dominant.color}">${dominant.emoji}</span>`;
    iconContainer.style.background = `linear-gradient(145deg, rgba(255,255,255,0.06), rgba(0,0,0,0.3))`;
    iconContainer.style.border = `1px solid ${dominant.color}40`;

    // Barras de porcentagem
    const barsContainer = document.getElementById('results-bars');
    barsContainer.innerHTML = '';

    const order = ['sanguineo', 'colerico', 'melancolico', 'fleumatico'];
    
    order.forEach(key => {
        const t = TEMPERAMENTS[key];
        const percent = result.percentages[key];
        const isDominant = key === result.dominant;

        const div = document.createElement('div');
        div.innerHTML = `
            <div class="flex justify-between items-center mb-1.5 px-1">
                <div class="flex items-center gap-x-2">
                    <span class="text-xl">${t.emoji}</span>
                    <span class="font-semibold ${isDominant ? '' : 'text-[#aaa]'}" style="color: ${isDominant ? t.color : ''}">${t.name}</span>
                    ${isDominant ? `<span class="text-[10px] px-2 py-px rounded tracking-widest" style="background: ${t.color}25; color: ${t.color}; font-weight:600;">PRINCIPAL</span>` : ''}
                </div>
                <span class="font-semibold tabular-nums w-10 text-right" style="color:#c9c9c9">${percent}%</span>
            </div>
            <div class="h-[5px] bg-[#111] rounded-full overflow-hidden border border-[#1f1f1f]">
                <div class="h-[5px] rounded-full result-bar" 
                     style="width: ${percent}%; background: linear-gradient(to right, ${t.color}, #fff, ${t.color});">
                </div>
            </div>
        `;
        barsContainer.appendChild(div);
    });

    // Temperamento secundário
    const secondaryEl = document.getElementById('secondary-result');
    secondaryEl.innerHTML = `
        <div class="text-4xl" style="color: ${secondary.color}">${secondary.emoji}</div>
        <div>
            <div class="font-semibold text-xl" style="color: ${secondary.color}">${secondary.name}</div>
            <div class="text-sm text-[#888]">${secondary.subtitle}</div>
        </div>
    `;

    // Resumo do perfil
    document.getElementById('profile-summary').innerHTML = 
        `Tu es principalement <span style="color:${dominant.color}"><strong>${dominant.name}</strong></span> avec des traits forts de <span style="color:${secondary.color}"><strong>${secondary.name}</strong></span>.`;

    // Descrição
    document.getElementById('result-description').textContent = dominant.description;

    // Pontos fortes
    const strengthsList = document.getElementById('strengths-list');
    strengthsList.innerHTML = dominant.strengths.map(s => 
        `<li class="flex items-start gap-x-2"><i class="fa-solid fa-check mt-1" style="color:#c9c9c9"></i><span class="text-[#ccc]">${s}</span></li>`
    ).join('');

    // Pontos a melhorar
    const weaknessesList = document.getElementById('weaknesses-list');
    weaknessesList.innerHTML = dominant.weaknesses.map(w => 
        `<li class="flex items-start gap-x-2"><i class="fa-solid fa-minus mt-1 text-[#555]"></i><span class="text-[#ccc]">${w}</span></li>`
    ).join('');
}

// Expor funções
window.showResults = showResults;
window.calculateResults = calculateResults;