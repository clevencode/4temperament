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
          <span class="text-lg sm:text-xl">${t.emoji}</span>
          <span class="font-semibold ${isDominant ? '' : 'text-[#aaa]'}" style="color: ${isDominant ? t.color : ''}">${t.name}</span>
          ${isDominant ? `<span class="text-[10px] px-2 py-px rounded tracking-widest" style="background: ${t.color}25; color: ${t.color}; font-weight:600;">${dominantBadge}</span>` : ''}
        </div>
        <span class="font-semibold tabular-nums w-10 text-right" style="color:#c9c9c9">${percent}%</span>
      </div>
      <div class="h-1 sm:h-[5px] bg-[#111] rounded-full overflow-hidden border border-[#1f1f1f]">
        <div class="h-1 sm:h-[5px] rounded-full result-bar"
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
  iconContainer.innerHTML = '<span style="color:#c9c9c9">⚖️</span>';
  iconContainer.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(0,0,0,0.3))';
  iconContainer.style.border = '1px solid #44444440';

  renderResultBars(result);

  document.getElementById('secondary-result').innerHTML = `
    <div class="text-3xl opacity-60">—</div>
    <div>
      <div class="font-semibold text-lg text-[#888]">Non déterminé</div>
      <div class="text-sm text-[#666]">${result.allNeutral ? 'Toutes les réponses étaient neutres' : result.mostlyNeutral ? 'Majorité de réponses neutres (≥ 80 %)' : 'Signal trop faible pour déterminer un dominant'}</div>
    </div>
  `;

  document.getElementById('profile-summary').textContent = BALANCED_COPY.summary;
  document.getElementById('result-description').textContent = BALANCED_COPY.description;

  document.getElementById('strengths-list').innerHTML = BALANCED_COPY.strengths.map(s =>
    `<li class="flex items-start gap-x-2"><i class="fa-solid fa-check mt-1" style="color:#c9c9c9"></i><span class="text-[#ccc]">${s}</span></li>`
  ).join('');

  document.getElementById('weaknesses-list').innerHTML = BALANCED_COPY.weaknesses.map(w =>
    `<li class="flex items-start gap-x-2"><i class="fa-solid fa-minus mt-1 text-[#555]"></i><span class="text-[#ccc]">${w}</span></li>`
  ).join('');

  document.getElementById('careers-list').innerHTML = BALANCED_COPY.careers.map(c =>
    `<li class="flex items-start gap-x-2"><i class="fa-solid fa-arrow-right mt-1 text-[#888]"></i><span class="text-[#ccc]">${c}</span></li>`
  ).join('');

  document.getElementById('activities-list').innerHTML = BALANCED_COPY.activities.map(a =>
    `<li class="flex items-start gap-x-2"><i class="fa-solid fa-arrow-right mt-1 text-[#888]"></i><span class="text-[#ccc]">${a}</span></li>`
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
  iconContainer.innerHTML = `<span style="color:${dominant.color}">${dominant.emoji}</span>`;
  iconContainer.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(0,0,0,0.3))';
  iconContainer.style.border = `1px solid ${dominant.color}40`;

  renderResultBars(result);

  document.getElementById('secondary-result').innerHTML = `
    <div class="text-4xl" style="color: ${secondary.color}">${secondary.emoji}</div>
    <div>
      <div class="font-semibold text-xl" style="color: ${secondary.color}">${secondary.name}</div>
      <div class="text-sm text-[#888]">${secondary.subtitle} — ${result.secondaryPercent}%</div>
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
      `<li class="flex items-start gap-x-2"><i class="fa-solid fa-check mt-1" style="color:#c9c9c9"></i><span class="text-[#ccc]">Tu as clarifié ce qui te ressemble moins (${dominant.name})</span></li>`;
    document.getElementById('weaknesses-list').innerHTML =
      `<li class="flex items-start gap-x-2"><i class="fa-solid fa-minus mt-1 text-[#555]"></i><span class="text-[#ccc]">Relance le test en répondant ce qui t'identifie positivement</span></li>`;
    document.getElementById('careers-list').innerHTML =
      `<li class="flex items-start gap-x-2"><i class="fa-solid fa-arrow-right mt-1 text-[#888]"></i><span class="text-[#ccc]">Non applicable — profil basé sur le désaccord</span></li>`;
    document.getElementById('activities-list').innerHTML =
      `<li class="flex items-start gap-x-2"><i class="fa-solid fa-arrow-right mt-1 text-[#888]"></i><span class="text-[#ccc]">Explore librement sans te limiter à un seul type</span></li>`;
  } else {
    document.getElementById('strengths-list').innerHTML = dominant.strengths.map(s =>
      `<li class="flex items-start gap-x-2"><i class="fa-solid fa-check mt-1" style="color:#c9c9c9"></i><span class="text-[#ccc]">${s}</span></li>`
    ).join('');

    document.getElementById('weaknesses-list').innerHTML = dominant.weaknesses.map(w =>
      `<li class="flex items-start gap-x-2"><i class="fa-solid fa-minus mt-1 text-[#555]"></i><span class="text-[#ccc]">${w}</span></li>`
    ).join('');

    document.getElementById('careers-list').innerHTML = (dominant.recommendedCareers || []).map(c =>
      `<li class="flex items-start gap-x-2"><i class="fa-solid fa-arrow-right mt-1 text-[#888]"></i><span class="text-[#ccc]">${c}</span></li>`
    ).join('');

    document.getElementById('activities-list').innerHTML = (dominant.preferredActivities || []).map(a =>
      `<li class="flex items-start gap-x-2"><i class="fa-solid fa-arrow-right mt-1 text-[#888]"></i><span class="text-[#ccc]">${a}</span></li>`
    ).join('');
  }
}

function showResults() {
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
    text += 'Fais le test toi aussi : https://clevencode.github.io/4temperament';
    return text;
  }

  const dominant = TEMPERAMENTS[result.dominant];

  if (result.profileMode === 'rejection') {
    let text = `Mon profil (mode désaccord) : trait le moins affirmé — ${dominant.name} (${result.dominantPercent}%).\n\n`;
    text += `${REJECTION_COPY.description}\n\n`;
    text += `Sanguin ${result.percentages.sanguineo}% • Colérique ${result.percentages.colerico}% • Mélancolique ${result.percentages.melancolico}% • Flegmatique ${result.percentages.fleumatico}%\n\n`;
    text += 'Fais le test toi aussi : https://clevencode.github.io/4temperament';
    return text;
  }

  let text = `Mon tempérament dominant est ${dominant.name} (${dominant.subtitle}) — ${result.dominantPercent}%.\n\n`;
  text += `Description : ${dominant.description}\n\n`;
  text += `Points forts : ${dominant.strengths.join(', ')}\n\n`;
  text += `Carrières recommandées : ${(dominant.recommendedCareers || []).join(', ')}\n`;
  text += `Activités préférées : ${(dominant.preferredActivities || []).join(', ')}\n\n`;
  text += 'Fais le test toi aussi : https://clevencode.github.io/4temperament';
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
  const url = `https://t.me/share/url?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://clevencode.github.io/4temperament')}`;
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