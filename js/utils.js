'use strict';

// ─── Month labels (uses i18n if available) ────────────────────
const MONTHS_FR   = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const MONTHS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
// Helpers dynamiques
function getMonths()      { return (typeof t === 'function') ? t('months')       : MONTHS_FULL; }
function getMonthsShort() { return (typeof t === 'function') ? t('months_short') : MONTHS_FR; }

// ─── Currency formatter (€ FR) ────────────────────────────────
function fmt(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// ─── Date formatter (YYYY-MM-DD → DD/MM/YYYY) ────────────────
function fmtDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

// ─── XSS protection ───────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
