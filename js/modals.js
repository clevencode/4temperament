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
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-3xl ring-1 ring-white/10" style="background: #111; color: ${t.color}">
                    ${t.emoji}
                </div>
                <div>
                    <div class="font-bold text-2xl y2k-heading tracking-[-0.5px]" style="color: ${t.color}">${t.name}</div>
                    <div class="text-xs tracking-[1.5px] text-[#666]">${t.subtitle}</div>
                </div>
            </div>
            
            <p class="text-sm mb-4 text-[#aaa] leading-relaxed">${t.description}</p>
            
            <div class="grid grid-cols-1 gap-x-6 text-xs">
                <div>
                    <div class="uppercase tracking-[1px] font-semibold mb-1.5" style="color:#999">POINTS FORTS</div>
                    <ul class="space-y-px text-[#aaa]">
                        ${t.strengths.map(s => `<li class="flex"><span class="mr-1.5 text-[#555]">•</span> ${s}</li>`).join('')}
                    </ul>
                </div>
                <div class="mt-4">
                    <div class="uppercase tracking-[1px] font-semibold mb-1.5" style="color:#999">À AMÉLIORER</div>
                    <ul class="space-y-px text-[#aaa]">
                        ${t.weaknesses.map(w => `<li class="flex"><span class="mr-1.5 text-[#555]">•</span> ${w}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        content.appendChild(card);
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function hideAllTemperaments() {
    const modal = document.getElementById('all-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

function showAboutModal() {
    const modal = document.getElementById('about-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function hideAboutModal() {
    const modal = document.getElementById('about-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

// Expor funções
window.showAllTemperaments = showAllTemperaments;
window.hideAllTemperaments = hideAllTemperaments;
window.showAboutModal = showAboutModal;
window.hideAboutModal = hideAboutModal;