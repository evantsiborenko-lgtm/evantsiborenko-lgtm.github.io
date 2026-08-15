(() => {
  'use strict';

  const METRIKA_ID = 109744286;
  const STORAGE_KEY = 'kvs_marketplace_checkout_v2';
  const PAYMENT_URL = 'https://c2c.cbrpay.ru/AS1I002E5DAN3MRN8KQP9R97693V67MF';
  const TELEGRAM_URL = 'https://t.me/KVSemenov';
  const MAX_URL = 'https://max.ru/u/f9LHodD0cOKuClAudA4jEpZrep-7nIAqAzFLSRJ-VVg5xAf6X7CzlSECuB4';

  const SERVICES = {
    infographic: {title: 'Инфографика', price: 1500, split: false},
    visual: {title: 'Рекламный визуал', price: 2000, split: false},
    productLoop: {title: 'Product Loop', price: 4000, split: true},
    marketplaceVideo: {title: 'Marketplace Video', price: 8000, split: true},
    bundle: {title: 'Комплект для карточки товара', price: 9900, split: true}
  };

  const ADDONS = {
    voice: {title: 'Закадровый голос', price: 1500, services: ['productLoop', 'marketplaceVideo', 'bundle']},
    subtitles: {title: 'Стилизованные субтитры', price: 1000, services: ['productLoop', 'marketplaceVideo', 'bundle']},
    lipsync: {title: 'Липсинк и озвучка персонажа', price: 3000, services: ['productLoop', 'marketplaceVideo', 'bundle'], review: true, note: 'Сначала проверим исходники и подтвердим возможность выполнения.'},
    extraFormat: {title: 'Дополнительный формат кадра', price: 1000, services: Object.keys(SERVICES)},
    urgent: {title: 'Срочно до 48 часов', percent: 30, services: Object.keys(SERVICES), review: true, note: 'Доступность зависит от свободного производственного окна.'}
  };

  const drawer = document.querySelector('[data-checkout]');
  if (!drawer) return;

  const panel = drawer.querySelector('.checkout-panel');
  const serviceContainer = drawer.querySelector('[data-checkout-services]');
  const addonsContainer = drawer.querySelector('[data-checkout-addons]');
  const summaryConfigure = drawer.querySelector('[data-checkout-summary-configure]');
  const summaryPayment = drawer.querySelector('[data-checkout-summary-payment]');
  const stepLabel = drawer.querySelector('[data-checkout-step]');
  const errorBox = drawer.querySelector('[data-checkout-error]');
  const customerPerson = drawer.querySelector('[data-customer-person]');
  const customerBusiness = drawer.querySelector('[data-customer-business]');
  const customerTypeButtons = [...drawer.querySelectorAll('[data-customer-type]')];
  const paymentStandard = drawer.querySelector('[data-payment-standard]');
  const paymentReview = drawer.querySelector('[data-payment-review]');
  const paymentBusiness = drawer.querySelector('[data-payment-business]');
  const paymentReported = drawer.querySelector('[data-payment-reported]');
  const paymentAmount = drawer.querySelector('[data-payment-amount]');
  const paymentStageCopy = drawer.querySelector('[data-payment-stage-copy]');
  const orderCodeEls = [...drawer.querySelectorAll('[data-order-code]')];
  const paymentLink = drawer.querySelector('[data-payment-link]');

  let focusReturn = null;
  let state = loadState();

  function track(goal, params = {}) {
    if (typeof window.ym !== 'function') return;
    try { window.ym(METRIKA_ID, 'reachGoal', goal, params); } catch (_) {}
  }

  function money(value) {
    return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
  }

  function normalizeState(value) {
    const serviceId = SERVICES[value?.serviceId] ? value.serviceId : '';
    const addons = Array.isArray(value?.addons)
      ? [...new Set(value.addons)].filter(id => ADDONS[id] && (!serviceId || ADDONS[id].services.includes(serviceId)))
      : [];
    return {
      serviceId,
      addons,
      customerType: value?.customerType === 'business' ? 'business' : 'person',
      orderId: typeof value?.orderId === 'string' ? value.orderId : ''
    };
  }

  function loadState() {
    try {
      return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    } catch (_) {
      return normalizeState({});
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state))); } catch (_) {}
  }

  function invalidateOrderId() { state.orderId = ''; }

  function generateOrderId() {
    if (state.orderId) return state.orderId;
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    state.orderId = `KVS-MP-${date}-${random}`;
    saveState();
    return state.orderId;
  }

  function getAvailableAddons() {
    if (!state.serviceId) return [];
    return Object.entries(ADDONS).filter(([, addon]) => addon.services.includes(state.serviceId));
  }

  function getCalculation() {
    const service = SERVICES[state.serviceId];
    if (!service) return {total: 0, first: 0, second: 0, urgent: 0, requiresReview: false};
    const fixedAddonTotal = state.addons.reduce((sum, id) => sum + (ADDONS[id]?.price || 0), 0);
    const subtotal = service.price + fixedAddonTotal;
    const urgent = state.addons.includes('urgent') ? Math.round(subtotal * 0.30) : 0;
    const total = subtotal + urgent;
    const first = service.split ? Math.round(total / 2) : total;
    const second = service.split ? total - first : 0;
    return {total, first, second, urgent, requiresReview: state.addons.some(id => ADDONS[id]?.review)};
  }

  function renderServices() {
    serviceContainer.innerHTML = Object.entries(SERVICES).map(([id, service]) => `
      <label class="checkout-choice${state.serviceId === id ? ' is-selected' : ''}">
        <input type="radio" name="checkout-service" value="${id}" ${state.serviceId === id ? 'checked' : ''}>
        <span><strong>${service.title}</strong><small>${service.split ? '2 этапа оплаты для проекта' : 'оплата одним платежом'}</small></span>
        <b>${money(service.price)}</b>
      </label>
    `).join('');
  }

  function renderAddons() {
    const available = getAvailableAddons();
    if (!available.length) {
      addonsContainer.innerHTML = '<p class="checkout-muted">Сначала выберите основную услугу.</p>';
      return;
    }
    addonsContainer.innerHTML = available.map(([id, addon]) => `
      <label class="checkout-addon${state.addons.includes(id) ? ' is-selected' : ''}">
        <input type="checkbox" value="${id}" ${state.addons.includes(id) ? 'checked' : ''}>
        <span><strong>${addon.title}</strong>${addon.note ? `<small>${addon.note}</small>` : ''}</span>
        <b>${addon.percent ? `+${addon.percent}%` : `+${money(addon.price)}`}</b>
      </label>
    `).join('');
  }

  function buildSummaryHtml() {
    const service = SERVICES[state.serviceId];
    if (!service) return '<p class="checkout-muted">Выберите услугу — здесь появится расчёт.</p>';
    const calc = getCalculation();
    const addonLines = state.addons.map(id => {
      const addon = ADDONS[id];
      if (!addon) return '';
      return `<li><span>${addon.title}</span><b>${addon.percent ? `+${money(calc.urgent)}` : `+${money(addon.price)}`}</b></li>`;
    }).join('');
    const stages = calc.second
      ? `<div class="checkout-stages"><span>Этап 1 сейчас <b>${money(calc.first)}</b></span><span>Этап 2 после согласования превью <b>${money(calc.second)}</b></span></div>`
      : `<div class="checkout-stages"><span>К оплате перед началом работы <b>${money(calc.first)}</b></span></div>`;
    return `<ul class="checkout-summary-lines"><li><span>${service.title}</span><b>${money(service.price)}</b></li>${addonLines}</ul><div class="checkout-total"><span>${calc.requiresReview ? 'Предварительная стоимость' : 'Стоимость проекта'}</span><strong>${money(calc.total)}</strong></div>${stages}`;
  }

  function renderSummary() {
    const html = buildSummaryHtml();
    summaryConfigure.innerHTML = html;
    summaryPayment.innerHTML = html;
  }

  function renderCustomerType() {
    customerTypeButtons.forEach(button => {
      const selected = button.dataset.customerType === state.customerType;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    customerPerson.hidden = state.customerType !== 'person';
    customerBusiness.hidden = state.customerType !== 'business';
  }

  function renderAll() {
    state = normalizeState(state);
    renderServices();
    renderAddons();
    renderSummary();
    renderCustomerType();
    saveState();
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
  }

  function setView(view) {
    [...drawer.querySelectorAll('[data-checkout-view]')].forEach(el => { el.hidden = el.dataset.checkoutView !== view; });
    const steps = {configure: 'Шаг 1 из 3 · Состав заказа', customer: 'Шаг 2 из 3 · Заказчик', payment: 'Шаг 3 из 3 · Оплата / заявка'};
    stepLabel.textContent = steps[view] || '';
    showError('');
    panel?.scrollTo({top: 0, behavior: 'smooth'});
  }

  function openCheckout(serviceId = '') {
    focusReturn = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (serviceId && SERVICES[serviceId]) {
      state.serviceId = serviceId;
      state.addons = state.addons.filter(id => ADDONS[id]?.services.includes(serviceId));
      invalidateOrderId();
    }
    renderAll();
    setView('configure');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('checkout-open');
    drawer.querySelector('[data-close-checkout]')?.focus();
    track('marketplace_checkout_open', {service: state.serviceId || 'none'});
  }

  function closeCheckout() {
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('checkout-open');
    showError('');
    if (focusReturn) focusReturn.focus();
  }

  function getCustomerData() {
    if (state.customerType === 'business') {
      return {
        company: drawer.querySelector('[name="company"]')?.value.trim() || '',
        inn: drawer.querySelector('[name="inn"]')?.value.trim() || '',
        kpp: drawer.querySelector('[name="kpp"]')?.value.trim() || '',
        contact: drawer.querySelector('[name="business-contact"]')?.value.trim() || '',
        email: drawer.querySelector('[name="business-email"]')?.value.trim() || ''
      };
    }
    return {
      name: drawer.querySelector('[name="person-name"]')?.value.trim() || '',
      payer: drawer.querySelector('[name="payer-name"]')?.value.trim() || ''
    };
  }

  function validateCustomer() {
    const offerAccepted = drawer.querySelector('[name="offer-accepted"]')?.checked;
    const consentAccepted = drawer.querySelector('[name="consent-accepted"]')?.checked;
    if (!offerAccepted || !consentAccepted) return 'Нужно отдельно подтвердить оферту и согласие на обработку персональных данных.';
    const data = getCustomerData();
    if (state.customerType === 'business') {
      if (!data.company || !data.inn || !data.contact || !data.email) return 'Для счёта заполните организацию, ИНН, контактное лицо и email.';
      if (!/^(?:\d{10}|\d{12})$/.test(data.inn)) return 'Проверьте ИНН: обычно это 10 или 12 цифр.';
    } else if (!data.name) {
      return 'Укажите имя заказчика.';
    }
    return '';
  }

  function showPaymentView() {
    const orderId = generateOrderId();
    const calc = getCalculation();
    const customer = getCustomerData();
    orderCodeEls.forEach(el => { el.textContent = orderId; });
    paymentStandard.hidden = true;
    paymentReview.hidden = true;
    paymentBusiness.hidden = true;
    paymentReported.hidden = true;

    if (state.customerType === 'business') {
      paymentBusiness.hidden = false;
      track('marketplace_invoice_request_view', {service: state.serviceId, total: calc.total});
    } else if (calc.requiresReview) {
      paymentReview.hidden = false;
      track('marketplace_checkout_review_required', {service: state.serviceId, total: calc.total});
    } else {
      paymentStandard.hidden = false;
      paymentAmount.textContent = money(calc.first);
      paymentStageCopy.textContent = calc.second ? `Это оплата этапа 1. После согласования защищённого превью останется ${money(calc.second)}.` : 'После фактического поступления платежа заказ будет принят в работу.';
      paymentLink.href = PAYMENT_URL;
      track('marketplace_checkout_payment_view', {service: state.serviceId, total: calc.total, due: calc.first});
    }

    const payerName = customer.payer || customer.name || customer.company || '';
    drawer.querySelector('[data-payer-reminder]').textContent = payerName ? `Плательщик: ${payerName}` : '';
    setView('payment');
  }

  function buildOrderText(mode = 'request') {
    const service = SERVICES[state.serviceId];
    const calc = getCalculation();
    const customer = getCustomerData();
    const lines = [`Заказ ${generateOrderId()}`, `${service?.title || 'Услуга'} — ${money(service?.price || 0)}`];
    state.addons.forEach(id => {
      const addon = ADDONS[id];
      if (addon) lines.push(`${addon.title} — ${addon.percent ? `+${addon.percent}%` : `+${money(addon.price)}`}`);
    });
    lines.push(`Стоимость проекта — ${money(calc.total)}`);
    if (calc.second) {
      lines.push(`Этап 1 — ${money(calc.first)}`, `Этап 2 после согласования превью — ${money(calc.second)}`);
    } else {
      lines.push(`К оплате — ${money(calc.first)}`);
    }
    if (state.customerType === 'business') {
      lines.push('', `Заказчик: ${customer.company}`, `ИНН: ${customer.inn}`);
      if (customer.kpp) lines.push(`КПП: ${customer.kpp}`);
      lines.push(`Контактное лицо: ${customer.contact}`, `Email: ${customer.email}`, '', 'Прошу подтвердить заказ и выставить счёт.');
    } else {
      lines.push('', `Заказчик: ${customer.name}`);
      if (customer.payer) lines.push(`Имя плательщика: ${customer.payer}`);
      if (mode === 'paid') lines.push('', `Оплату этапа 1 в размере ${money(calc.first)} отправил(а) по СБП. Прошу проверить поступление.`);
      else if (calc.requiresReview) lines.push('', 'Прошу проверить исходники/доступность опций и подтвердить итоговую сумму до оплаты.');
      else lines.push('', 'Прошу подтвердить состав заказа.');
    }
    return lines.join('\n');
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (_) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      textarea.remove();
      return ok;
    }
  }

  async function copyAmount() {
    await copyText(String(getCalculation().first));
    const button = drawer.querySelector('[data-copy-amount]');
    if (!button) return;
    const old = button.textContent;
    button.textContent = 'Сумма скопирована';
    setTimeout(() => { button.textContent = old; }, 1600);
  }

  async function copyOrder(mode) {
    await copyText(buildOrderText(mode));
    const button = drawer.querySelector(`[data-copy-order="${mode}"]`);
    if (button) {
      const old = button.textContent;
      button.textContent = 'Заказ скопирован';
      setTimeout(() => { button.textContent = old; }, 1600);
    }
    track('marketplace_checkout_copy', {mode, service: state.serviceId, total: getCalculation().total});
  }

  async function copyAndOpen(url, mode, channel) {
    await copyText(buildOrderText(mode));
    track(channel === 'telegram' ? 'marketplace_telegram_click' : 'marketplace_max_click', {location: 'checkout', mode});
    window.open(url, '_blank', 'noopener');
  }

  serviceContainer.addEventListener('change', event => {
    const input = event.target.closest('input[name="checkout-service"]');
    if (!input || !SERVICES[input.value]) return;
    state.serviceId = input.value;
    state.addons = state.addons.filter(id => ADDONS[id]?.services.includes(state.serviceId));
    invalidateOrderId();
    renderAll();
    track('marketplace_checkout_service', {service: state.serviceId});
  });

  addonsContainer.addEventListener('change', event => {
    const input = event.target.closest('input[type="checkbox"]');
    if (!input || !ADDONS[input.value]) return;
    if (input.checked) state.addons = [...new Set([...state.addons, input.value])];
    else state.addons = state.addons.filter(id => id !== input.value);
    invalidateOrderId();
    renderAll();
    track('marketplace_checkout_addon', {addon: input.value, enabled: input.checked ? 1 : 0});
  });

  customerTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
      state.customerType = button.dataset.customerType === 'business' ? 'business' : 'person';
      invalidateOrderId();
      renderCustomerType();
      saveState();
      track('marketplace_checkout_customer_type', {type: state.customerType});
    });
  });

  document.addEventListener('click', event => {
    const opener = event.target.closest('[data-open-checkout], [data-checkout-service]');
    if (opener) { event.preventDefault(); openCheckout(opener.dataset.checkoutService || ''); return; }
    if (event.target.closest('[data-close-checkout]')) { closeCheckout(); return; }
    if (event.target.closest('[data-checkout-next="customer"]')) {
      if (!state.serviceId) { showError('Выберите основную услугу.'); return; }
      setView('customer'); return;
    }
    if (event.target.closest('[data-checkout-back="configure"]')) { setView('configure'); return; }
    if (event.target.closest('[data-checkout-back="customer"]')) { setView('customer'); return; }
    if (event.target.closest('[data-checkout-next="payment"]')) {
      const error = validateCustomer();
      if (error) { showError(error); return; }
      showPaymentView(); return;
    }
    if (event.target.closest('[data-copy-amount]')) { copyAmount(); return; }
    if (event.target.closest('[data-payment-link]')) {
      const calc = getCalculation();
      track('marketplace_sbp_click', {service: state.serviceId, due: calc.first, total: calc.total});
      return;
    }
    if (event.target.closest('[data-payment-reported-button]')) {
      paymentStandard.hidden = true;
      paymentReported.hidden = false;
      track('marketplace_payment_reported', {service: state.serviceId, due: getCalculation().first});
      return;
    }
    const copyButton = event.target.closest('[data-copy-order]');
    if (copyButton) { copyOrder(copyButton.dataset.copyOrder || 'request'); return; }
    const messenger = event.target.closest('[data-checkout-messenger]');
    if (messenger) {
      const mode = messenger.dataset.orderMode || 'request';
      const channel = messenger.dataset.checkoutMessenger;
      copyAndOpen(channel === 'telegram' ? TELEGRAM_URL : MAX_URL, mode, channel);
    }
  });

  drawer.querySelector('.checkout-backdrop')?.addEventListener('click', closeCheckout);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drawer.getAttribute('aria-hidden') === 'false') closeCheckout();
  });

  renderAll();
  setView('configure');
})();
