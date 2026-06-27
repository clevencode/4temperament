// modals.js - Logique des modaux

let modalPreviousFocus = null;
let modalTrapHandler = null;

function getModalFocusable(modal) {
  const dialog = modal?.querySelector('[data-modal-dialog]');
  if (!dialog) return [];
  return [...dialog.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(el => el.offsetParent !== null);
}

function trapModalFocus(e) {
  if (e.key !== 'Tab') return;
  const modal = document.getElementById('all-modal');
  if (!modal || modal.classList.contains('hidden')) return;
  const focusable = getModalFocusable(modal);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

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

    modalPreviousFocus = document.activeElement;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const closeBtn = modal.querySelector('[data-modal-close]');
    const focusable = getModalFocusable(modal);
    (closeBtn || focusable[0])?.focus();

    modalTrapHandler = (e) => {
        if (e.key === 'Escape') {
            hideAllTemperaments();
            return;
        }
        trapModalFocus(e);
    };
    document.addEventListener('keydown', modalTrapHandler);
}

function hideAllTemperaments() {
    const modal = document.getElementById('all-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    modal.classList.remove('flex');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    if (modalTrapHandler) {
        document.removeEventListener('keydown', modalTrapHandler);
        modalTrapHandler = null;
    }

    if (modalPreviousFocus?.focus) {
        modalPreviousFocus.focus();
        modalPreviousFocus = null;
    }
}

function handleModalBackdropClick(e) {
    if (e.target.id === 'all-modal') hideAllTemperaments();
}

function showAboutModal() {
    if (typeof navigateToTemperamentsAbout === 'function') navigateToTemperamentsAbout();
}

function hideAboutModal() {
    if (typeof navigateToIntro === 'function') navigateToIntro();
}

// Expor funções
window.showAllTemperaments = showAllTemperaments;
window.hideAllTemperaments = hideAllTemperaments;
window.handleModalBackdropClick = handleModalBackdropClick;
window.showAboutModal = showAboutModal;
window.hideAboutModal = hideAboutModal;