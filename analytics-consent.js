(() => {
  'use strict';

  const STORAGE_KEY = 'kvs_analytics_consent_v1';
  const METRIKA_ID = 109744286;
  const PRIVACY_URL = 'https://kvsvideo.ru/privacy.html';
  let banner = null;
  let metrikaStarted = false;

  function getChoice() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }

  function setChoice(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
  }

  function loadMetrika() {
    if (metrikaStarted || getChoice() !== 'allow') return;
    metrikaStarted = true;

    window.ym = window.ym || function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = window.ym.l || (Date.now ? Date.now() : new Date().getTime());

    const src = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
    if (!Array.from(document.scripts).some((script) => script.src === src)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = src;
      const firstScript = document.scripts[0];
      if (firstScript && firstScript.parentNode) firstScript.parentNode.insertBefore(script, firstScript);
      else document.head.appendChild(script);
    }

    window.ym(METRIKA_ID, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });
  }

  function closeBanner() {
    if (!banner) return;
    banner.remove();
    banner = null;
  }

  function allowAnalytics() {
    setChoice('allow');
    closeBanner();
    loadMetrika();
    document.dispatchEvent(new CustomEvent('kvs:analytics-consent', { detail: { value: 'allow' } }));
  }

  function denyAnalytics() {
    const wasLoaded = metrikaStarted || typeof window.ym === 'function';
    setChoice('deny');
    closeBanner();
    document.dispatchEvent(new CustomEvent('kvs:analytics-consent', { detail: { value: 'deny' } }));
    if (wasLoaded) location.reload();
  }

  function makeBanner(manageMode = false) {
    closeBanner();

    banner = document.createElement('section');
    banner.className = 'kvs-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'kvs-consent-title');
    banner.innerHTML = `
      <div class="kvs-consent__copy">
        <strong id="kvs-consent-title">Аналитика сайта</strong>
        <p>Мы используем Яндекс Метрику для статистики посещений и улучшения сайта. Сервис может использовать cookie и данные об устройстве. <a href="${PRIVACY_URL}">Подробнее в Политике конфиденциальности</a>.</p>
      </div>
      <div class="kvs-consent__actions">
        <button type="button" class="kvs-consent__button" data-kvs-consent="allow">Разрешить аналитику</button>
        <button type="button" class="kvs-consent__button" data-kvs-consent="deny">Только необходимые</button>
      </div>
      ${manageMode ? '<button type="button" class="kvs-consent__close" aria-label="Закрыть настройки аналитики">×</button>' : ''}
    `;

    banner.addEventListener('click', (event) => {
      const choice = event.target.closest('[data-kvs-consent]');
      if (choice) {
        choice.dataset.kvsConsent === 'allow' ? allowAnalytics() : denyAnalytics();
        return;
      }
      if (event.target.closest('.kvs-consent__close')) closeBanner();
    });

    document.body.appendChild(banner);
  }

  function openSettings() {
    makeBanner(true);
  }

  function init() {
    const choice = getChoice();
    if (choice === 'allow') loadMetrika();
    else if (choice !== 'deny') makeBanner(false);

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-analytics-settings]');
      if (!trigger) return;
      event.preventDefault();
      openSettings();
    });
  }

  window.KVSAnalyticsConsent = {
    open: openSettings,
    allow: allowAnalytics,
    deny: denyAnalytics,
    choice: getChoice
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
