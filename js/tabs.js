// tabs.js — Navigation par sections (style historique, pas navbar)

const RESULT_SECTIONS = [
  { id: 'profile', label: 'Profil', desc: 'Tempérament et résumé', icon: 'user' },
  { id: 'strengths', label: 'Points forts', desc: 'Tes atouts naturels', icon: 'strengths', tone: 'success' },
  { id: 'weaknesses', label: 'À améliorer', desc: 'Axes de progression', icon: 'weaknesses', tone: 'warning' },
  { id: 'careers', label: 'Carrières', desc: 'Métiers recommandés', icon: 'careers' },
  { id: 'activities', label: 'Activités', desc: 'Loisirs adaptés', icon: 'activities' },
  { id: 'share', label: 'Partager', desc: 'Envoyer à tes proches', icon: 'share' }
];

function buildSectionNavItem(panel, index) {
  const active = index === 0;
  const panelId = `info-panel-${panel.id}`;
  const tabId = `info-tab-${panel.id}`;
  const tone = active ? 'silver' : (panel.tone || 'muted');
  const iconHtml = panel.icon
    ? icon(panel.icon, { size: 'sm', tone, className: 'result-section-nav__icon' })
    : '';

  return `<button type="button" class="result-section-nav__item${active ? ' is-active' : ''}" role="tab" id="${tabId}" data-info-tab="${panel.id}" aria-controls="${panelId}" aria-selected="${active ? 'true' : 'false'}" tabindex="${active ? '0' : '-1'}">
    <span class="icon-badge icon-badge--sm" aria-hidden="true">${iconHtml}</span>
    <span class="result-section-nav__text">
      <span class="result-section-nav__title">${panel.label}</span>
      <span class="result-section-nav__desc">${panel.desc}</span>
    </span>
  </button>`;
}

function buildInfoTabsHtml(panels) {
  const navItems = panels.map((panel, index) => buildSectionNavItem(panel, index)).join('');

  const panelHtml = panels.map((panel, index) => {
    const panelId = `info-panel-${panel.id}`;
    const tabId = `info-tab-${panel.id}`;
    return `<div class="info-tab-panel${index === 0 ? ' is-active' : ''}" role="tabpanel" id="${panelId}" data-info-panel="${panel.id}" aria-labelledby="${tabId}"${index === 0 ? '' : ' hidden'}>${panel.content}</div>`;
  }).join('');

  return `
    <div class="result-sections y2k-card chrome-border rounded-3xl p-4 sm:p-8 page-card" data-info-tabs>
      <div class="type-caption pb-3 text-[#666]">DÉTAILS DU RÉSULTAT</div>
      <nav class="result-section-nav" role="tablist" aria-label="Détails du résultat">${navItems}</nav>
      <div class="result-section-body info-tabs__body">${panelHtml}</div>
    </div>`;
}

function activateInfoTab(root, tabId) {
  if (!root) return;
  root.querySelectorAll('[data-info-tab]').forEach(tab => {
    const active = tab.dataset.infoTab === tabId;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
    tab.setAttribute('tabindex', active ? '0' : '-1');
    const section = RESULT_SECTIONS.find(s => s.id === tab.dataset.infoTab);
    const iconEl = tab.querySelector('.icon');
    if (iconEl && section && typeof AppIcons !== 'undefined') {
      let tone = section.tone || 'muted';
      if (active) {
        tone = section.tone === 'success' ? 'success' : section.tone === 'warning' ? 'warning' : 'silver';
      }
      iconEl.className = `icon icon--sm icon--${tone} ${AppIcons[section.icon]}`;
    }
  });
  root.querySelectorAll('[data-info-panel]').forEach(panel => {
    const active = panel.dataset.infoPanel === tabId;
    panel.classList.toggle('is-active', active);
    if (active) panel.removeAttribute('hidden');
    else panel.setAttribute('hidden', '');
  });
}

function handleInfoTabKeydown(e) {
  const tab = e.target.closest('[data-info-tab]');
  if (!tab) return;
  const root = tab.closest('[data-info-tabs]');
  if (!root) return;

  const tabs = [...root.querySelectorAll('[data-info-tab]')];
  const idx = tabs.indexOf(tab);
  let next = null;

  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length];
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(idx - 1 + tabs.length) % tabs.length];
  else if (e.key === 'Home') next = tabs[0];
  else if (e.key === 'End') next = tabs[tabs.length - 1];
  else return;

  e.preventDefault();
  activateInfoTab(root, next.dataset.infoTab);
  next.focus();
}

function initInfoTabs() {
  if (document.body.dataset.infoTabsBound) return;
  document.body.dataset.infoTabsBound = 'true';

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-info-tab]');
    if (!tab) return;
    const root = tab.closest('[data-info-tabs]');
    if (!root) return;
    activateInfoTab(root, tab.dataset.infoTab);
    tab.focus();
  });

  document.addEventListener('keydown', handleInfoTabKeydown);
}

window.RESULT_SECTIONS = RESULT_SECTIONS;
window.buildInfoTabsHtml = buildInfoTabsHtml;
window.activateInfoTab = activateInfoTab;
window.initInfoTabs = initInfoTabs;