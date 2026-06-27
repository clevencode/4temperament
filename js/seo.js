// seo.js — SEO centralisé, aligné à la logique métier du quiz

const PAGE_SEO = {
  'intro-screen': {
    title: null,
    description: null
  },
  'temperaments-about-screen': {
    title: 'Théorie des 4 tempéraments',
    description:
      'Origines (Hippocrate, Galien) et les 4 types : Sanguin, Colérique, Mélancolique, Flegmatique. Comprends la théorie classique avant le test.'
  },
  'about-screen': {
    title: 'Comment fonctionne le test',
    description:
      '30 affirmations, échelle d\'accord, calcul du tempérament dominant et secondaire. Test 100 % anonyme, sans inscription.'
  },
  'quiz-screen': {
    title: 'Questionnaire en cours',
    description:
      'Réponds aux 30 affirmations pour découvrir ton profil des 4 tempéraments. Progression sauvegardée localement.'
  },
  'results-screen': {
    title: 'Ton résultat',
    description:
      'Profil personnalisé : tempérament principal, secondaire, points forts, carrières et activités recommandées.'
  },
  'history-screen': {
    title: 'Historique des résultats',
    description:
      'Consulte tes résultats enregistrés sur cet appareil. Modifie ou partage tes profils précédents.'
  },
  'result-detail-screen': {
    title: 'Détail du résultat',
    description:
      'Vue complète d\'un résultat : répartition, profil, conseils et options de partage.'
  }
};

function buildPageTitle(screenId) {
  const page = PAGE_SEO[screenId];
  if (!page?.title) return SITE_CONFIG.title;
  return `${page.title} • ${SITE_CONFIG.name}`;
}

function buildPageDescription(screenId) {
  const page = PAGE_SEO[screenId];
  return page?.description || SITE_CONFIG.description;
}

function setMetaContent(selector, content) {
  const el = document.querySelector(selector);
  if (el && content) el.setAttribute('content', content);
}

function setLinkHref(selector, href) {
  const el = document.querySelector(selector);
  if (el && href) el.setAttribute('href', href);
}

function applyPageSeo(screenId) {
  const title = buildPageTitle(screenId);
  const description = buildPageDescription(screenId);
  const url = `${SITE_CONFIG.url}/`;

  document.title = title;
  setMetaContent('meta[name="description"]', description);
  setMetaContent('meta[name="keywords"]', SITE_CONFIG.keywords.join(', '));
  setMetaContent('meta[property="og:title"]', title);
  setMetaContent('meta[property="og:description"]', description);
  setMetaContent('meta[property="og:url"]', url);
  setMetaContent('meta[name="twitter:title"]', title);
  setMetaContent('meta[name="twitter:description"]', description);
  setMetaContent('meta[name="twitter:url"]', url);
  setLinkHref('link[rel="canonical"]', url);
}

function buildStructuredData() {
  const faq = [
    {
      question: 'Qu\'est-ce que les 4 tempéraments ?',
      answer:
        'Une classification classique de la personnalité (Sanguin, Colérique, Mélancolique, Flegmatique) issue de la Grèce antique, utile pour mieux se connaître.'
    },
    {
      question: 'Combien de temps dure le test ?',
      answer: `Environ ${SITE_CONFIG.durationMinutes} minutes pour ${SITE_CONFIG.questionCount} affirmations.`
    },
    {
      question: 'Le test est-il anonyme ?',
      answer: 'Oui. Aucun nom ni compte requis. Les résultats sont stockés uniquement sur ton appareil.'
    },
    {
      question: 'Quels tempéraments puis-je obtenir ?',
      answer: `Le test identifie un profil dominant et secondaire parmi : ${SITE_CONFIG.temperamentTypes.join(', ')}.`
    }
  ];

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      description: SITE_CONFIG.description,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      inLanguage: SITE_CONFIG.language,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR'
      },
      featureList: [
        `${SITE_CONFIG.questionCount} questions`,
        'Résultat dominant et secondaire',
        '100 % anonyme',
        'Historique local',
        'Partage WhatsApp, Telegram, Instagram'
      ],
      image: SITE_CONFIG.ogImage
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    }
  ];
}

function injectStructuredData() {
  const existing = document.getElementById('structured-data');
  if (existing) existing.remove();

  const script = document.createElement('script');
  script.id = 'structured-data';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(buildStructuredData());
  document.head.appendChild(script);
}

function initSeo() {
  applyPageSeo('intro-screen');
  injectStructuredData();
}

window.PAGE_SEO = PAGE_SEO;
window.applyPageSeo = applyPageSeo;
window.initSeo = initSeo;