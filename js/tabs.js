// tabs.js — Info tabs with Y2K chip underline

function buildInfoTabsHtml(panels) {
  const chips = panels.map((panel, index) => {
    const active = index === 0;
    const panelId = `info-panel-${panel.id}`;
    const iconHtml = panel.icon
      ? icon(panel.icon, { size: 'xs', tone: active ? 'silver' : 'muted', className: 'info-tab-chip__icon' })
      : '';
    return `<button type="button" class="info-tab-chip${active ? ' is-active' : ''}" role="tab" id="info-tab-${panel.id}" data-info-tab="${panel.id}" aria-controls="${panelId}" aria-selected="${active ? 'true' : 'false'}" tabindex="${active ? '0' : '-1'}">${iconHtml}<span>${panel.label}</span></button>`;
  }).join('');

  const panelHtml = panels.map((panel, index) => {
    const panelId = `info-panel-${panel.id}`;
    const tabId = `info-tab-${panel.id}`;
    return `<div class="info-tab-panel${index === 0 ? ' is-active' : ''}" role="tabpanel" id="${panelId}" data-info-panel="${panel.id}" aria-labelledby="${tabId}"${index === 0 ? '' : ' hidden'}>${panel.content}</div>`;
  }).join('');

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
    chip.setAttribute('tabindex', active ? '0' : '-1');
    const iconEl = chip.querySelector('.icon');
    if (iconEl) {
      iconEl.classList.toggle('icon--silver', active);
      iconEl.classList.toggle('icon--muted', !active);
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
  const chip = e.target.closest('[data-info-tab]');
  if (!chip) return;
  const root = chip.closest('[data-info-tabs]');
  if (!root) return;

  const tabs = [...root.querySelectorAll('[data-info-tab]')];
  const idx = tabs.indexOf(chip);
  let next = null;

  if (e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length];
  else if (e.key === 'ArrowLeft') next = tabs[(idx - 1 + tabs.length) % tabs.length];
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
    const chip = e.target.closest('[data-info-tab]');
    if (!chip) return;
    const root = chip.closest('[data-info-tabs]');
    if (!root) return;
    activateInfoTab(root, chip.dataset.infoTab);
    chip.focus();
  });

  document.addEventListener('keydown', handleInfoTabKeydown);
}

window.buildInfoTabsHtml = buildInfoTabsHtml;
window.activateInfoTab = activateInfoTab;
window.initInfoTabs = initInfoTabs;