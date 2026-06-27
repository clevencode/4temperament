// modals.js - Logique des modaux

function showAllTemperaments() {
    const modal = document.getElementById('all-modal');
    const content = document.getElementById('all-temperaments-content');
    content.innerHTML = '';

    Object.keys(TEMPERAMENTS).forEach(key => {
        const t = TEMPERAMENTS[key];
        
        const card = document.createElement('div');
        card.className = 'y2k-card chrome-border rounded-3xl p-6 relative overflow-hidden';
        
        card.innerHTML = `
            <div class="flex items-center gap-x-3 mb-4">
                <div class="icon-badge icon-badge--lg icon-badge--chrome" style="color: ${t.color}">
                    ${temperamentEmoji(t.emoji, 'md', t.color)}
                </div>
                <div>
                    <div class="type-display y2k-heading text-2xl" style="color: ${t.color}">${t.name}</div>
                    <div class="type-caption text-[#666]">${t.subtitle}</div>
                </div>
            </div>
            
            <p class="type-body mb-4 text-[#aaa]">${t.description}</p>
            
            <div class="grid grid-cols-1 gap-x-6">
                <div>
                    <div class="type-label mb-1.5" style="color:#999">POINTS FORTS</div>
                    <ul class="space-y-px">
                        ${t.strengths.map(s => `<li class="type-list-item flex"><span class="mr-1.5 text-[#555]">•</span> ${s}</li>`).join('')}
                    </ul>
                </div>
                <div class="mt-4">
                    <div class="type-label mb-1.5" style="color:#999">À AMÉLIORER</div>
                    <ul class="space-y-px">
                        ${t.weaknesses.map(w => `<li class="type-list-item flex"><span class="mr-1.5 text-[#555]">•</span> ${w}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        content.appendChild(card);
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // ESC support standardisé
    const esc = (e) => { if (e.key === 'Escape') { hideAllTemperaments(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc, { once: true });
}

function hideAllTemperaments() {
    const modal = document.getElementById('all-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

function showAboutModal() {
    if (typeof navigateToTemperamentsAbout === 'function') {
        navigateToTemperamentsAbout();
    }
}

function hideAboutModal() {
    if (typeof navigateToIntro === 'function') navigateToIntro();
}

// Expor funções
window.showAllTemperaments = showAllTemperaments;
window.hideAllTemperaments = hideAllTemperaments;
window.showAboutModal = showAboutModal;
window.hideAboutModal = hideAboutModal;