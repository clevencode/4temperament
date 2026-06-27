// tabs.js — Info tabs with Y2K chip underline

function buildInfoTabsHtml(panels) {
  const chips = panels.map((panel, index) => {
    const active = index === 0;
    const iconHtml = panel.icon
      ? icon(panel.icon, { size: 'xs', tone: active ? 'silver' : 'muted', className: 'info-tab-chip__icon' })
      : '';
    return `<button type="button" class="info-tab-chip${active ? ' is-active' : ''}" role="tab" data-info-tab="${panel.id}" aria-selected="${active ? 'true' : 'false'}">${iconHtml}<span>${panel.label}</span></button>`;
  }).join('');

  const panelHtml = panels.map((panel, index) =>
    `<div class="info-tab-panel${index === 0 ? ' is-active' : ''}" role="tabpanel" data-info-panel="${panel.id}">${panel.content}</div>`
  ).join('');

  return `
    <div class="info-tabs y2k-card chrome-border rounded-3xl page-card" data-info-tabs>
      <div class="info-tabs__bar" role="tablist" aria-label="Détails du résultat">${chips}</div>
      <div class="info-tabs__body">${panelHtml}</div>
    </div>`;
}

function activateInfoTab(root, tabId) {
  if (!root) return;
  root.querySelectorAll('[data-info-tab]').forEach(chip => {
    const active = chip.dataset.infoTab === tabId;
    chip.classList.toggle('is-active', active);
    chip.setAttribute('aria-selected', active ? 'true' : 'false');
    const iconEl = chip.querySelector('.icon');
    if (iconEl) {
      iconEl.classList.toggle('icon--silver', active);
      iconEl.classList.toggle('icon--muted', !active);
    }
  });
  root.querySelectorAll('[data-info-panel]').forEach(panel => {
    panel.classList.toggle('is-active', panel.dataset.infoPanel === tabId);
  });
}

function initInfoTabs() {
  if (document.body.dataset.infoTabsBound) return;
  document.body.dataset.infoTabsBound = 'true';

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-info-tab]');
    if (!chip) return;
    const root = chip.closest('[data-info-tabs]');
    if (!root) return;
    activateInfoTab(root, chip.dataset.infoTab);
  });
}

window.buildInfoTabsHtml = buildInfoTabsHtml;
window.activateInfoTab = activateInfoTab;
window.initInfoTabs = initInfoTabs;