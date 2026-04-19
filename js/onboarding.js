'use strict';

// ─── Onboarding ───────────────────────────────────────────────
const TOTAL_STEPS = 7;
let currentStep   = 1;
let _onboardingKey = 'rm-onboarding-done';
let _onboardingUsername = '';

function setOnboardingUser(username) {
  _onboardingUsername = username || '';
  _onboardingKey = `rm-onboarding-done-${username}`;
}

function _greeting() {
  const h = new Date().getHours();
  if (h < 12) return t('greeting_morning');
  if (h < 18) return t('greeting_afternoon');
  return t('greeting_evening');
}

function checkOnboarding() {
  if (localStorage.getItem(_onboardingKey)) return;

  const titleEl = document.getElementById('welcomeTitle');
  if (titleEl) {
    const name = _onboardingUsername ? `, ${_onboardingUsername}` : '';
    titleEl.textContent = `${_greeting()}${name} 👋`;
  }
  const modalEl = document.getElementById('welcomeModal');
  if (!modalEl) { startOnboarding(); return; }
  const bsWelcome = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
  bsWelcome.show();
}

function welcomeStartGuide() {
  const modalEl = document.getElementById('welcomeModal');
  const bs = bootstrap.Modal.getInstance(modalEl);
  if (bs) bs.hide();
  setTimeout(() => startOnboarding(), 300);
}

function welcomeSkip() {
  const modalEl = document.getElementById('welcomeModal');
  const bs = bootstrap.Modal.getInstance(modalEl);
  if (bs) bs.hide();
  localStorage.setItem(_onboardingKey, 'true');
}

function startOnboarding() {
  currentStep = 1;
  updateOnboardingUI();
  document.getElementById('onboardingOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeOnboarding() {
  document.getElementById('onboardingOverlay').classList.remove('active');
  document.body.style.overflow = '';
  localStorage.setItem(_onboardingKey, 'true');
}

function nextOnboardingStep() {
  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    updateOnboardingUI();
  } else {
    closeOnboarding();
  }
}

function prevOnboardingStep() {
  if (currentStep > 1) {
    currentStep--;
    updateOnboardingUI();
  }
}

function updateOnboardingUI() {
  // Dernière étape : "Commencer" flottant en haut à droite sur mobile
  const card = document.getElementById('onboardingCard');
  if (card) card.classList.toggle('ob-last-step', currentStep === TOTAL_STEPS);

  // Étapes
  document.querySelectorAll('.onboarding-step').forEach(el => {
    el.classList.remove('active');
  });
  const active = document.querySelector(`.onboarding-step[data-step="${currentStep}"]`);
  if (active) active.classList.add('active');

  // Barre de progression
  const pct = (currentStep / TOTAL_STEPS) * 100;
  document.getElementById('onboardingProgressBar').style.width = pct + '%';

  // Bouton suivant / terminer
  const nextBtn = document.getElementById('obNextBtn');
  if (currentStep === TOTAL_STEPS) {
    nextBtn.innerHTML = t('ob_btn_start') + ' <i class="bi bi-check-lg ms-1"></i>';
  } else {
    nextBtn.innerHTML = t('ob_btn_next') + ' <i class="bi bi-arrow-right ms-1"></i>';
  }

  // Bouton précédent (masqué à la première étape)
  const prevBtn = document.getElementById('obPrevBtn');
  prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

  // Bouton passer (masqué à la dernière étape)
  const skipBtn = document.getElementById('obSkipBtn');
  skipBtn.style.display = currentStep === TOTAL_STEPS ? 'none' : 'block';

  // Points de navigation
  const dotsEl = document.getElementById('obDots');
  dotsEl.innerHTML = Array.from({ length: TOTAL_STEPS }, (_, i) =>
    `<span class="ob-dot ${i + 1 === currentStep ? 'active' : ''}" onclick="goToStep(${i + 1})"></span>`
  ).join('');
}

function goToStep(step) {
  currentStep = step;
  updateOnboardingUI();
}
