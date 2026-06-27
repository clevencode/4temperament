// results.js - Affichage des résultats (délègue le calcul à TemperamentScoring)

const BALANCED_COPY = {
  title: 'ÉQUILIBRÉ',
  subtitle: 'Profil sans dominance nette',
  summary: 'Tes réponses neutres ne révèlent pas de tempérament dominant. C\'est normal : réponds avec plus de conviction pour un profil plus précis.',
  description: 'Quand les affirmations reçoivent surtout une réponse « Neutre », aucun tempérament ne se détache clairement. Les quatre parts restent égales (25 % chacun). Relis les affirmations et choisis le niveau d\'accord qui te correspond vraiment.',
  strengths: ['Ouverture à tous les styles de personnalité', 'Flexibilité comportementale', 'Absence de biais fort dans les réponses'],
  weaknesses: ['Difficile d\'identifier un tempérament dominant', 'Relancer le test avec des réponses plus affirmées'],
  careers: ['Tout domaine où la polyvalence est un atout'],
  activities: ['Explorer plusieurs activités pour découvrir tes préférences']
};

const REJECTION_COPY = {
  badge: 'MOINS AFFIRMÉ',
  subtitle: 'Profil basé sur le désaccord',
  summary: (name) => `Tu as surtout répondu « pas d'accord ». Le tempérament le moins affirmé dans tes réponses est ${name} — cela ne signifie pas que tu es l'opposé, mais que ces traits ressortent moins dans ton profil actuel.`,
  description: 'Ce résultat reflète une prédominance de désaccord dans tes réponses. Les pourcentages indiquent quels tempéraments sont les moins caractérisés par tes choix. Pour un profil positif plus net, réponds en indiquant ce qui te ressemble vraiment.'
};

function calculateResults() {
  return TemperamentScoring.calculate(answers);
}

function buildResultBarsHtml(result) {
  const order = ['sanguineo', 'colerico', 'melancolico', 'fleumatico'];
  const dominantBadge = result.profileMode === 'rejection' ? REJECTION_COPY.badge : 'PRINCIPAL';

  return order.map(key => {
    const t = TEMPERAMENTS[key];
    const percent = result.percentages[key];
    const isDominant = !result.isBalanced && key === result.dominant;

    return `
      <div class="result-bar-item">
        <div class="flex justify-between items-center mb-1.5 px-1 gap-x-2">
          <div class="flex items-center gap-x-2 min-w-0">
            ${temperamentEmoji(t.emoji, 'sm', isDominant ? t.color : null)}
            <span class="type-ui font-semibold text-lg truncate ${isDominant ? '' : 'text-[#aaa]'}" style="color: ${isDominant ? t.color : ''}">${t.name}</span>
            ${isDominant ? `<span class="type-caption px-2 py-px rounded shrink-0" style="background: ${t.color}25; color: ${t.color}; font-weight:600;">${dominantBadge}</span>` : ''}
          </div>
          <span class="type-ui font-semibold tabular-nums w-10 text-right text-sm shrink-0" style="color:#c9c9c9">${percent}%</span>
        </div>
        <div class="result-bar-track">
          <div class="result-bar-fill result-bar" style="width: ${percent}%; background: linear-gradient(to right, ${t.color}, #fff, ${t.color});"></div>
        </div>
      </div>`;
  }).join('');
}

function getBalancedSecondaryReason(result) {
  if (result.allNeutral) return 'Toutes les réponses étaient neutres';
  if (result.mostlyNeutral) return 'Majorité de réponses neutres (≥ 80 %)';
  return 'Signal trop faible pour déterminer un dominant';
}

function buildSecondaryResultHtml(result) {
  if (result.isBalanced) {
    return `
      <div class="text-3xl opacity-60 shrink-0">—</div>
      <div class="min-w-0">
        <div class="type-ui font-semibold text-lg text-[#888]">Non déterminé</div>
        <div class="type-body text-sm text-[#666]">${getBalancedSecondaryReason(result)}</div>
      </div>`;
  }

  const secondary = TEMPERAMENTS[result.secondary];
  const pct = result.secondaryPercent ?? Math.round(result.percentages[result.secondary]);
  return `
    ${temperamentEmoji(secondary.emoji, 'lg', secondary.color)}
    <div class="min-w-0">
      <div class="type-ui font-semibold text-xl" style="color: ${secondary.color}">${secondary.name}</div>
      <div class="type-body text-sm text-[#888]">${secondary.subtitle} — ${pct}%</div>
    </div>`;
}

/** Présentation unifiée — même logique métier pour résultat final et vue complète historique. */
function getResultPresentation(result) {
  if (result.isBalanced) {
    return {
      typeLabel: 'RÉSULTAT',
      resultName: BALANCED_COPY.title,
      resultNameColor: '#c9c9c9',
      resultSubtitle: BALANCED_COPY.subtitle,
      profileSummary: BALANCED_COPY.summary,
      description: BALANCED_COPY.description,
      secondaryHtml: buildSecondaryResultHtml(result),
      strengthsHtml: BALANCED_COPY.strengths.map(s => listItem(s, 'checkCircle', 'silver')).join(''),
      weaknessesHtml: BALANCED_COPY.weaknesses.map(w => listItem(w, 'minus', 'subtle')).join(''),
      careersHtml: BALANCED_COPY.careers.map(c => listItem(c, 'arrowRight', 'muted')).join(''),
      activitiesHtml: BALANCED_COPY.activities.map(a => listItem(a, 'arrowRight', 'muted')).join(''),
      cardBorder: '1px solid #2f2f2f',
      cardBg: 'linear-gradient(145deg, #161616 0%, #0a0a0a 100%)',
      iconEmoji: '⚖️',
      iconColor: '#c9c9c9',
      iconShellBorder: '1px solid #44444440',
      iconShellBg: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(0,0,0,0.3))',
      badgeLabel: 'PROFIL ÉQUILIBRÉ',
      badgeColor: '#c9c9c9'
    };
  }

  const dominant = TEMPERAMENTS[result.dominant];
  const secondary = TEMPERAMENTS[result.secondary];
  const isRejection = result.profileMode === 'rejection';
  const domPct = result.dominantPercent ?? Math.round(result.percentages[result.dominant]);
  const secPct = result.secondaryPercent ?? Math.round(result.percentages[result.secondary]);

  if (isRejection) {
    return {
      typeLabel: 'TRAIT MOINS AFFIRMÉ',
      resultName: dominant.name,
      resultNameColor: dominant.color,
      resultSubtitle: REJECTION_COPY.subtitle,
      profileSummary: REJECTION_COPY.summary(dominant.name),
      description: REJECTION_COPY.description,
      secondaryHtml: buildSecondaryResultHtml(result),
      strengthsHtml: listItem(`Tu as clarifié ce qui te ressemble moins (${dominant.name})`, 'checkCircle', 'silver'),
      weaknessesHtml: listItem('Relance le test en répondant ce qui t\'identifie positivement', 'minus', 'subtle'),
      careersHtml: listItem('Non applicable — profil basé sur le désaccord', 'arrowRight', 'muted'),
      activitiesHtml: listItem('Explore librement sans te limiter à un seul type', 'arrowRight', 'muted'),
      cardBorder: `1px solid ${dominant.color}40`,
      cardBg: 'linear-gradient(145deg, #161616 0%, #0a0a0a 100%)',
      iconEmoji: dominant.emoji,
      iconColor: dominant.color,
      iconShellBorder: `1px solid ${dominant.color}40`,
      iconShellBg: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(0,0,0,0.3))',
      badgeLabel: 'MODE DÉSACCORD',
      badgeColor: dominant.color
    };
  }

  return {
    typeLabel: 'TEMPÉRAMENT PRINCIPAL',
    resultName: dominant.name,
    resultNameColor: dominant.color,
    resultSubtitle: dominant.subtitle,
    profileSummary: `Tu es principalement <span style="color:${dominant.color}"><strong>${dominant.name}</strong></span> avec des traits forts de <span style="color:${secondary.color}"><strong>${secondary.name}</strong></span> (${domPct}% / ${secPct}%).`,
    description: dominant.description,
    secondaryHtml: buildSecondaryResultHtml(result),
    strengthsHtml: dominant.strengths.map(s => listItem(s, 'checkCircle', 'silver')).join(''),
    weaknessesHtml: dominant.weaknesses.map(w => listItem(w, 'minus', 'subtle')).join(''),
    careersHtml: (dominant.recommendedCareers || []).map(c => listItem(c, 'arrowRight', 'muted')).join(''),
    activitiesHtml: (dominant.preferredActivities || []).map(a => listItem(a, 'arrowRight', 'muted')).join(''),
    cardBorder: `1px solid ${dominant.color}40`,
    cardBg: 'linear-gradient(145deg, #161616 0%, #0a0a0a 100%)',
    iconEmoji: dominant.emoji,
    iconColor: dominant.color,
    iconShellBorder: `1px solid ${dominant.color}40`,
    iconShellBg: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(0,0,0,0.3))',
    badgeLabel: dominant.name.toUpperCase(),
    badgeColor: dominant.color
  };
}

function getResultsScreenSubheading(result) {
  if (result.isBalanced) return 'Répartition équilibrée — aucun tempérament dominant';
  if (result.profileMode === 'rejection') return 'Tempérament le moins affirmé dans tes réponses';
  return 'Voici ton tempérament principal';
}

/** Carte hero réutilisable — résultat final, vue complète historique, etc. */
function buildResultHeroCardHtml(view) {
  return `
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    <div class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    <div class="layout-row layout-row--responsive relative z-10">
      <div class="layout-row__main">
        <div class="type-label opacity-60 mb-1">${view.typeLabel}</div>
        <div class="type-display type-result-name y2k-title mb-2" style="color:${view.resultNameColor}">${view.resultName}</div>
        <div class="type-ui text-lg sm:text-xl tracking-tight opacity-80" style="color:#aaa">${view.resultSubtitle}</div>
      </div>
      <div class="layout-row__aside">
        <div class="temperament-icon-shell temperament-icon-shell--result mx-auto" style="background:${view.iconShellBg}; border:${view.iconShellBorder}">${temperamentEmoji(view.iconEmoji, 'xl', view.iconColor)}</div>
      </div>
    </div>`;
}

function buildResultHeroSectionHtml(view, { tag = 'section', className = 'result-hero-card', ariaLabel = 'Résumé du tempérament' } = {}) {
  return `
    <${tag} class="${className} rounded-3xl p-4 sm:p-6 text-white premium-shadow relative overflow-hidden main-result-bg" style="background:${view.cardBg}; border:${view.cardBorder}" aria-label="${ariaLabel}">
      ${buildResultHeroCardHtml(view)}
    </${tag}>`;
}

function applyResultHeroCard(element, view) {
  if (!element || !view) return;
  element.className = 'result-hero-card rounded-3xl p-4 sm:p-6 text-white premium-shadow relative overflow-hidden main-result-bg page-card';
  element.style.background = view.cardBg;
  element.style.border = view.cardBorder;
  element.innerHTML = buildResultHeroCardHtml(view);
}

function renderResultHero(result) {
  const view = getResultPresentation(result);

  const subheading = document.getElementById('results-hero-subheading');
  if (subheading) subheading.textContent = getResultsScreenSubheading(result);

  applyResultHeroCard(document.getElementById('main-result-card'), view);
}

function buildLiveShareHtml() {
  return `
    <div class="flex flex-wrap gap-2">
      <button type="button" onclick="shareOnWhatsApp()"
              class="type-btn min-h-[44px] px-4 py-2 glossy-btn rounded-full flex items-center gap-x-1 border border-[#292929]">
        ${icon('whatsapp', { size: 'sm', tone: 'whatsapp', className: 'mr-1' })}WhatsApp
      </button>
      <button type="button" onclick="shareOnTelegram()"
              class="type-btn min-h-[44px] px-4 py-2 glossy-btn rounded-full flex items-center gap-x-1 border border-[#292929]">
        ${icon('telegram', { size: 'sm', tone: 'telegram', className: 'mr-1' })}Telegram
      </button>
      <button type="button" onclick="shareOnInstagram()"
              class="type-btn min-h-[44px] px-4 py-2 glossy-btn rounded-full flex items-center gap-x-1 border border-[#292929]">
        ${icon('instagram', { size: 'sm', tone: 'instagram', className: 'mr-1' })}Instagram
      </button>
    </div>
    <button type="button" onclick="copyResultToClipboard()"
            class="type-btn mt-3 min-h-[44px] px-4 py-2 border border-[#292929] hover:bg-[#111] rounded-full flex items-center gap-x-1">
      ${icon('copy', { size: 'sm', tone: 'muted', className: 'mr-1' })}Copier le texte
    </button>`;
}

/** Contenu empilhé réutilisable — résultat final et vue complète (sans tabs). */
function buildResultBodyHtml(result, shareHtml = '') {
  const view = getResultPresentation(result);

  return `
      <section class="y2k-card chrome-border rounded-3xl p-4 sm:p-6 result-flow-section" aria-labelledby="result-bars-label">
        <div id="result-bars-label" class="type-label text-[#888] mb-5 px-1">RÉPARTITION DES TEMPÉRAMENTS</div>
        <div class="space-y-6">${buildResultBarsHtml(result)}</div>
      </section>

      <section class="layout-grid-2 info-tab-grid result-flow-section" aria-label="Profil et tempérament secondaire">
        <div class="y2k-card chrome-border rounded-3xl p-4 sm:p-6 h-full">
          <div class="type-label mb-2.5">TEMPÉRAMENT SECONDAIRE</div>
          <div class="flex items-center gap-x-3">${view.secondaryHtml}</div>
        </div>
        <div class="y2k-card chrome-border rounded-3xl p-4 sm:p-6 h-full">
          <div class="type-label mb-2.5">TON PROFIL</div>
          <div class="type-body text-base sm:text-lg leading-snug font-medium text-[#ccc]">${view.profileSummary}</div>
        </div>
      </section>

      <section class="y2k-card chrome-border rounded-3xl p-4 sm:p-6 result-flow-section" aria-labelledby="result-about-label">
        <div id="result-about-label" class="type-label text-[#777] mb-2">À PROPOS DE TOI</div>
        <div class="type-result-body text-[#ccc]">${view.description}</div>
      </section>

      <section class="layout-grid-2 result-flow-section" aria-label="Points forts et axes d'amélioration">
        <div class="y2k-card chrome-border rounded-3xl p-4 sm:p-6 h-full">
          ${sectionHeading('strengths', 'TES POINTS FORTS', 'success')}
          <ul class="space-y-[7px]">${view.strengthsHtml}</ul>
        </div>
        <div class="y2k-card chrome-border rounded-3xl p-4 sm:p-6 h-full">
          ${sectionHeading('weaknesses', 'À AMÉLIORER', 'warning')}
          <ul class="space-y-[7px]">${view.weaknessesHtml}</ul>
        </div>
      </section>

      <section class="layout-grid-2 result-flow-section" aria-label="Carrières et activités">
        <div class="y2k-card chrome-border rounded-3xl p-4 sm:p-6 h-full">
          ${sectionHeading('careers', 'CARRIÈRES RECOMMANDÉES')}
          <ul class="space-y-[7px]">${view.careersHtml}</ul>
        </div>
        <div class="y2k-card chrome-border rounded-3xl p-4 sm:p-6 h-full">
          ${sectionHeading('activities', 'ACTIVITÉS PRÉFÉRÉES')}
          <ul class="space-y-[7px]">${view.activitiesHtml}</ul>
        </div>
      </section>

      <section class="y2k-card chrome-border rounded-3xl p-4 sm:p-7 result-flow-section result-flow-share" aria-labelledby="result-share-label">
        ${sectionHeading('share', 'PARTAGER LE RÉSULTAT')}
        <div id="result-share-label" class="sr-only">Options de partage</div>
        ${shareHtml}
        <p class="type-caption normal-case tracking-normal text-[#666] mt-3">Partage ce résultat avec tes amis !</p>
      </section>`;
}

function renderResultScreen(result) {
  renderResultHero(result);

  const body = document.getElementById('results-body');
  if (body) {
    body.innerHTML = buildResultBodyHtml(result, buildLiveShareHtml());
  }
}

function buildResultDetailHtml(result, index) {
  const view = getResultPresentation(result);
  const shareHTML = typeof shareSectionHTML === 'function' ? shareSectionHTML(index) : '';

  return `
    <div class="result-flow-content">
      ${buildResultHeroSectionHtml(view, { className: 'result-hero-card result-detail-hero' })}
      ${buildResultBodyHtml(result, shareHTML)}
    </div>`;
}

function renderBalancedResult(result) {
  renderResultScreen(result);
}

function renderDominantResult(result) {
  renderResultScreen(result);
}

function showResults() {
  if (typeof QuizFlow !== 'undefined' && !QuizFlow.canComplete(answers)) {
    if (typeof redirectToFirstUnanswered === 'function') {
      redirectToFirstUnanswered();
    } else if (typeof showQuizError === 'function') {
      const missing = QuizFlow.getMissingQuestions(answers).length;
      showQuizError(
        missing === 1
          ? 'Répondez à toutes les affirmations avant de voir le résultat.'
          : `Il reste ${missing} affirmations sans réponse.`
      );
    }
    return;
  }

  if (typeof navigateToResults === 'function') {
    navigateToResults();
  } else {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.remove('hidden');
  }

  const result = calculateResults();

  if (result.isBalanced) {
    renderBalancedResult(result);
  } else {
    renderDominantResult(result);
  }

  if (typeof saveUserPreferences === 'function') {
    saveUserPreferences({ hasCompletedTest: true });
  } else if (typeof savePreferences === 'function') {
    savePreferences();
  }

  if (typeof saveResultToHistory === 'function') {
    saveResultToHistory({ ...result, answers: { ...answers } });
  }

  if (typeof clearQuizProgress === 'function') {
    clearQuizProgress();
  }
  if (typeof updateIntroCta === 'function') {
    updateIntroCta();
  }
}

function getResultText() {
  const result = calculateResults();

  if (result.isBalanced) {
    let text = 'Mon profil des 4 Tempéraments est équilibré (25 % chacun).\n\n';
    text += `${BALANCED_COPY.summary}\n\n`;
    text += `Sanguin ${result.percentages.sanguineo}% • Colérique ${result.percentages.colerico}% • Mélancolique ${result.percentages.melancolico}% • Flegmatique ${result.percentages.fleumatico}%\n\n`;
    text += `${SITE_CONFIG.shareCta} ${SITE_CONFIG.url}`;
    return text;
  }

  const dominant = TEMPERAMENTS[result.dominant];

  if (result.profileMode === 'rejection') {
    let text = `Mon profil (mode désaccord) : trait le moins affirmé — ${dominant.name} (${result.dominantPercent}%).\n\n`;
    text += `${REJECTION_COPY.description}\n\n`;
    text += `Sanguin ${result.percentages.sanguineo}% • Colérique ${result.percentages.colerico}% • Mélancolique ${result.percentages.melancolico}% • Flegmatique ${result.percentages.fleumatico}%\n\n`;
    text += `${SITE_CONFIG.shareCta} ${SITE_CONFIG.url}`;
    return text;
  }

  let text = `Mon tempérament dominant est ${dominant.name} (${dominant.subtitle}) — ${result.dominantPercent}%.\n\n`;
  text += `Description : ${dominant.description}\n\n`;
  text += `Points forts : ${dominant.strengths.join(', ')}\n\n`;
  text += `Carrières recommandées : ${(dominant.recommendedCareers || []).join(', ')}\n`;
  text += `Activités préférées : ${(dominant.preferredActivities || []).join(', ')}\n\n`;
  text += `${SITE_CONFIG.shareCta} ${SITE_CONFIG.url}`;
  return text;
}

function copyResultToClipboard() {
  const text = getResultText();
  navigator.clipboard.writeText(text).then(() => {
    alert('Résultat copié dans le presse-papiers !');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Résultat copié !');
  });
}

function shareOnWhatsApp() {
  const url = `https://wa.me/?text=${encodeURIComponent(getResultText())}`;
  window.open(url, '_blank');
}

function shareOnTelegram() {
  const text = getResultText();
  const url = `https://t.me/share/url?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE_CONFIG.url)}`;
  window.open(url, '_blank');
}

function shareOnInstagram() {
  const text = getResultText();
  navigator.clipboard.writeText(text).then(() => {
    alert("Texte copié ! Ouvre Instagram et colle-le dans la légende d'un post ou d'une story.");
    window.open('https://www.instagram.com/', '_blank');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert("Texte copié ! Ouvre Instagram et colle-le dans la légende.");
    window.open('https://www.instagram.com/', '_blank');
  });
}

window.buildResultBarsHtml = buildResultBarsHtml;
window.getResultPresentation = getResultPresentation;
window.buildResultHeroCardHtml = buildResultHeroCardHtml;
window.buildResultHeroSectionHtml = buildResultHeroSectionHtml;
window.applyResultHeroCard = applyResultHeroCard;
window.buildResultBodyHtml = buildResultBodyHtml;
window.buildLiveShareHtml = buildLiveShareHtml;
window.renderResultScreen = renderResultScreen;
window.buildResultDetailHtml = buildResultDetailHtml;
window.showResults = showResults;
window.calculateResults = calculateResults;
window.copyResultToClipboard = copyResultToClipboard;
window.shareOnWhatsApp = shareOnWhatsApp;
window.shareOnTelegram = shareOnTelegram;
window.shareOnInstagram = shareOnInstagram;