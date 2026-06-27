// icons.js — Iconografia Y2K + moderna, alinhada à lógica de negócio

const AppIcons = {
  brand: 'fa-solid fa-brain',

  arrowRight: 'fa-solid fa-arrow-right',
  arrowLeft: 'fa-solid fa-arrow-left',
  play: 'fa-solid fa-play',

  restart: 'fa-solid fa-rotate-right',
  results: 'fa-solid fa-chart-simple',
  check: 'fa-solid fa-check',
  checkCircle: 'fa-solid fa-circle-check',

  clock: 'fa-solid fa-clock',
  history: 'fa-solid fa-clock-rotate-left',
  info: 'fa-solid fa-circle-info',
  user: 'fa-solid fa-user',

  strengths: 'fa-solid fa-circle-check',
  weaknesses: 'fa-solid fa-triangle-exclamation',
  careers: 'fa-solid fa-briefcase',
  activities: 'fa-solid fa-heart',
  share: 'fa-solid fa-share-nodes',
  list: 'fa-solid fa-table-cells',

  edit: 'fa-solid fa-pen-to-square',
  eye: 'fa-solid fa-eye',
  copy: 'fa-solid fa-copy',
  plus: 'fa-solid fa-plus',
  minus: 'fa-solid fa-minus',

  whatsapp: 'fa-brands fa-whatsapp',
  telegram: 'fa-brands fa-telegram',
  instagram: 'fa-brands fa-instagram'
};

const IconTones = {
  strengths: 'success',
  weaknesses: 'warning',
  careers: 'muted',
  activities: 'muted',
  share: 'muted',
  brand: 'silver',
  nav: 'silver'
};

function icon(name, opts = {}) {
  const {
    size = 'sm',
    tone = 'default',
    badge = false,
    chrome = false,
    className = '',
    animate = false
  } = opts;

  const fa = AppIcons[name];
  if (!fa) return '';

  const classes = [
    fa,
    'icon',
    `icon--${size}`,
    tone !== 'default' ? `icon--${tone}` : '',
    animate ? 'icon--animate-nudge' : '',
    className
  ].filter(Boolean).join(' ');

  const el = `<i class="${classes}" aria-hidden="true"></i>`;

  if (badge || chrome) {
    const badgeClass = [
      'icon-badge',
      `icon-badge--${size === 'xs' ? 'sm' : size === 'xl' ? 'lg' : 'md'}`,
      chrome ? 'icon-badge--chrome' : ''
    ].filter(Boolean).join(' ');
    return `<span class="${badgeClass}" aria-hidden="true">${el}</span>`;
  }

  return el;
}

function temperamentEmoji(emoji, size = 'md', color = null) {
  const style = color ? ` style="color:${color}"` : '';
  return `<span class="temperament-icon temperament-icon--${size}" aria-hidden="true"${style}>${emoji}</span>`;
}

function listItemIcon(name, tone = 'muted') {
  return icon(name, { size: 'xs', tone, className: 'list-icon' });
}

function listItem(text, iconName = 'check', tone = 'silver') {
  return `<li class="flex items-start gap-x-2"><span class="list-icon-wrap">${listItemIcon(iconName, tone)}</span><span class="type-list-item">${text}</span></li>`;
}

function sectionHeading(iconName, label, tone) {
  const resolvedTone = tone || IconTones[iconName] || 'muted';
  return `<div class="section-heading"><span class="icon-badge icon-badge--sm">${icon(iconName, { size: 'sm', tone: resolvedTone })}</span><h3 class="type-label">${label}</h3></div>`;
}

function setIntroStartIcon(el, mode) {
  if (!el) return;
  const name = mode === 'continue' ? 'play' : 'arrowRight';
  el.className = `${AppIcons[name]} icon icon--sm icon--silver icon--animate-nudge group-active:translate-x-0.5 transition`;
  el.setAttribute('aria-hidden', 'true');
}

window.AppIcons = AppIcons;
window.IconTones = IconTones;
window.icon = icon;
window.temperamentEmoji = temperamentEmoji;
window.listItemIcon = listItemIcon;
window.listItem = listItem;
window.sectionHeading = sectionHeading;
window.setIntroStartIcon = setIntroStartIcon;