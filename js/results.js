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

function renderResultBars(result) {
  const barsContainer = document.getElementById('results-bars');
  barsContainer.innerHTML = '';
  const order = ['sanguineo', 'colerico', 'melancolico', 'fleumatico'];
  const dominantBadge = result.profileMode === 'rejection' ? REJECTION_COPY.badge : 'PRINCIPAL';

  order.forEach(key => {
    const t = TEMPERAMENTS[key];
    const percent = result.percentages[key];
    const isDominant = !result.isBalanced && key === result.dominant;

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="flex justify-between items-center mb-1.5 px-1">
        <div class="flex items-center gap-x-2">
          ${temperamentEmoji(t.emoji, 'sm', isDominant ? t.color : null)}
          <span class="type-ui font-semibold text-lg ${isDominant ? '' : 'text-[#aaa]'}" style="color: ${isDominant ? t.color : ''}">${t.name}</span>
          ${isDominant ? `<span class="type-caption px-2 py-px rounded" style="background: ${t.color}25; color: ${t.color}; font-weight:600;">${dominantBadge}</span>` : ''}
        </div>
        <span class="type-ui font-semibold tabular-nums w-10 text-right text-sm" style="color:#c9c9c9">${percent}%</span>
      </div>
      <div class="result-bar-track">
        <div class="result-bar-fill result-bar"
             style="width: ${percent}%; background: linear-gradient(to right, ${t.color}, #fff, ${t.color});">
        </div>
      </div>
    `;
    barsContainer.appendChild(div);
  });
}

function renderBalancedResult(result) {
  const heading = document.querySelector('#results-screen .text-center.mb-9 h2');
  const subheading = document.querySelector('#results-screen .text-center.mb-9 p');
  if (heading) heading.textContent = 'TON PROFIL EST';
  if (subheading) subheading.textContent = 'Répartition équilibrée — aucun tempérament dominant';

  const mainCard = document.getElementById('main-result-card');
  mainCard.style.background = 'linear-gradient(145deg, #161616 0%, #0a0a0a 100%)';
  mainCard.style.border = '1px solid #2f2f2f';

  const typeLabel = document.getElementById('result-type-label');
  if (typeLabel) typeLabel.textContent = 'RÉSULTAT';

  document.getElementById('result-name').textContent = BALANCED_COPY.title;
  document.getElementById('result-name').style.color = '#c9c9c9';
  document.getElementById('result-subtitle').textContent = BALANCED_COPY.subtitle;
  document.getElementById('result-subtitle').style.color = '#aaa';

  const iconContainer = document.getElementById('result-icon');
  iconContainer.innerHTML = temperamentEmoji('⚖️', 'xl', '#c9c9c9');
  iconContainer.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(0,0,0,0.3))';
  iconContainer.style.border = '1px solid #44444440';

  renderResultBars(result);

  document.getElementById('secondary-result').innerHTML = `
    <div class="text-3xl opacity-60">—</div>
    <div>
      <div class="type-ui font-semibold text-lg text-[#888]">Non déterminé</div>
      <div class="type-body text-sm text-[#666]">${result.allNeutral ? 'Toutes les réponses étaient neutres' : result.mostlyNeutral ? 'Majorité de réponses neutres (≥ 80 %)' : 'Signal trop faible pour déterminer un dominant'}</div>
    </div>
  `;

  document.getElementById('profile-summary').textContent = BALANCED_COPY.summary;
  document.getElementById('result-description').textContent = BALANCED_COPY.description;

  document.getElementById('strengths-list').innerHTML = BALANCED_COPY.strengths.map(s =>
    listItem(s, 'checkCircle', 'silver')
  ).join('');

  document.getElementById('weaknesses-list').innerHTML = BALANCED_COPY.weaknesses.map(w =>
    listItem(w, 'minus', 'subtle')
  ).join('');

  document.getElementById('careers-list').innerHTML = BALANCED_COPY.careers.map(c =>
    listItem(c, 'arrowRight', 'muted')
  ).join('');

  document.getElementById('activities-list').innerHTML = BALANCED_COPY.activities.map(a =>
    listItem(a, 'arrowRight', 'muted')
  ).join('');
}

function renderDominantResult(result) {
  const dominant = TEMPERAMENTS[result.dominant];
  const secondary = TEMPERAMENTS[result.secondary];
  const isRejection = result.profileMode === 'rejection';

  const heading = document.querySelector('#results-screen .text-center.mb-9 h2');
  const subheading = document.querySelector('#results-screen .text-center.mb-9 p');
  if (heading) heading.textContent = 'TON PROFIL EST';
  if (subheading) {
    subheading.textContent = isRejection
      ? 'Tempérament le moins affirmé dans tes réponses'
      : 'Voici ton tempérament principal';
  }

  const mainCard = document.getElementById('main-result-card');
  mainCard.style.background = 'linear-gradient(145deg, #161616 0%, #0a0a0a 100%)';
  mainCard.style.border = '1px solid #2f2f2f';

  const typeLabel = document.getElementById('result-type-label');
  if (typeLabel) typeLabel.textContent = isRejection ? 'TRAIT MOINS AFFIRMÉ' : 'TEMPÉRAMENT PRINCIPAL';

  document.getElementById('result-name').textContent = dominant.name;
  document.getElementById('result-name').style.color = dominant.color;
  document.getElementById('result-subtitle').textContent = isRejection ? REJECTION_COPY.subtitle : dominant.subtitle;
  document.getElementById('result-subtitle').style.color = '#aaa';

  const iconContainer = document.getElementById('result-icon');
  iconContainer.innerHTML = temperamentEmoji(dominant.emoji, 'xl', dominant.color);
  iconContainer.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(0,0,0,0.3))';
  iconContainer.style.border = `1px solid ${dominant.color}40`;

  renderResultBars(result);

  document.getElementById('secondary-result').innerHTML = `
    ${temperamentEmoji(secondary.emoji, 'lg', secondary.color)}
    <div>
      <div class="type-ui font-semibold text-xl" style="color: ${secondary.color}">${secondary.name}</div>
      <div class="type-body text-sm text-[#888]">${secondary.subtitle} — ${result.secondaryPercent}%</div>
    </div>
  `;

  if (isRejection) {
    document.getElementById('profile-summary').innerHTML =
      REJECTION_COPY.summary(dominant.name);
    document.getElementById('result-description').textContent = REJECTION_COPY.description;
  } else {
    document.getElementById('profile-summary').innerHTML =
      `Tu es principalement <span style="color:${dominant.color}"><strong>${dominant.name}</strong></span> avec des traits forts de <span style="color:${secondary.color}"><strong>${secondary.name}</strong></span> (${result.dominantPercent}% / ${result.secondaryPercent}%).`;
    document.getElementById('result-description').textContent = dominant.description;
  }

  if (isRejection) {
    document.getElementById('strengths-list').innerHTML =
      listItem(`Tu as clarifié ce qui te ressemble moins (${dominant.name})`, 'checkCircle', 'silver');
    document.getElementById('weaknesses-list').innerHTML =
      listItem('Relance le test en répondant ce qui t\'identifie positivement', 'minus', 'subtle');
    document.getElementById('careers-list').innerHTML =
      listItem('Non applicable — profil basé sur le désaccord', 'arrowRight', 'muted');
    document.getElementById('activities-list').innerHTML =
      listItem('Explore librement sans te limiter à un seul type', 'arrowRight', 'muted');
  } else {
    document.getElementById('strengths-list').innerHTML = dominant.strengths.map(s =>
      listItem(s, 'checkCircle', 'silver')
    ).join('');

    document.getElementById('weaknesses-list').innerHTML = dominant.weaknesses.map(w =>
      listItem(w, 'minus', 'subtle')
    ).join('');

    document.getElementById('careers-list').innerHTML = (dominant.recommendedCareers || []).map(c =>
      listItem(c, 'arrowRight', 'muted')
    ).join('');

    document.getElementById('activities-list').innerHTML = (dominant.preferredActivities || []).map(a =>
      listItem(a, 'arrowRight', 'muted')
    ).join('');
  }
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

  const resultsTabs = document.getElementById('results-info-tabs');
  if (resultsTabs && typeof activateInfoTab === 'function') {
    activateInfoTab(resultsTabs, 'profile');
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

window.showResults = showResults;
window.calculateResults = calculateResults;
window.copyResultToClipboard = copyResultToClipboard;
window.shareOnWhatsApp = shareOnWhatsApp;
window.shareOnTelegram = shareOnTelegram;
window.shareOnInstagram = shareOnInstagram;