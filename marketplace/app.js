(() => {
  'use strict';

  const METRIKA_ID = 109744286;
  const sentGoals = new Set();

  const reachGoal = (goal, params) => {
    if (typeof window.ym !== 'function') return;
    try {
      window.ym(METRIKA_ID, 'reachGoal', goal, params || {});
    } catch (_) {}
  };

  const reachGoalOnce = (goal, params) => {
    if (sentGoals.has(goal)) return;
    sentGoals.add(goal);
    reachGoal(goal, params);
  };

  const showcase = document.querySelector('[data-showcase]');
  if (showcase) {
    const slides = [...showcase.querySelectorAll('[data-slide]')];
    const tabs = [...showcase.querySelectorAll('[data-go]')];
    const current = showcase.querySelector('[data-current]');
    const title = showcase.querySelector('[data-slide-title]');
    const copy = showcase.querySelector('[data-slide-copy]');
    const prev = showcase.querySelector('[data-prev]');
    const next = showcase.querySelector('[data-next]');
    const stage = showcase.querySelector('[data-stage]');
    const videoShell = showcase.querySelector('[data-video-shell]');
    const video = showcase.querySelector('[data-video]');
    const playButton = showcase.querySelector('[data-video-play]');
    const soundButton = showcase.querySelector('[data-video-sound]');
    const poster = showcase.querySelector('[data-video-poster]');
    const videoIndex = slides.findIndex(slide => slide.querySelector('[data-video-shell]'));

    const content = [
      ['Исходная фотография', 'Стартовый материал — одна фотография товара на нейтральном фоне.'],
      ['Главная карточка', 'Товар получает коммерческую подачу и понятную систему преимуществ для первого слайда карточки.'],
      ['Безопасность', 'Отдельная инфографика показывает светоотражающие элементы и объясняет их пользу покупателю.'],
      ['Комфорт каждый день', 'Спинка, лямки и нагрудная стяжка превращены в аргументы для выбора товара.'],
      ['Вместимость', 'Открытый рюкзак наглядно показывает отделения и привычный школьный набор внутри.'],
      ['Lifestyle-сцена', 'Тот же товар показан в естественной школьной ситуации с двумя вариантами персонализации.'],
      ['Готовый видеоролик', 'Кейс завершается коротким рекламным видео. Звук выключен по умолчанию и включается только пользователем.']
    ];

    let active = 0;
    let pointerId = null;
    let pointerType = '';
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let videoLoaded = false;

    if ('IntersectionObserver' in window) {
      const caseObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            reachGoalOnce('marketplace_case_view');
            caseObserver.disconnect();
            break;
          }
        }
      }, {threshold: [0.35]});
      caseObserver.observe(showcase);
    }

    if (stage) {
      stage.tabIndex = 0;
      stage.setAttribute('role', 'group');
      stage.setAttribute('aria-label', 'Демонстрационный кейс. Используйте стрелки влево и вправо для смены этапа.');
      stage.style.touchAction = 'pan-y pinch-zoom';
      stage.style.userSelect = 'none';
      stage.style.webkitUserSelect = 'none';
      stage.style.cursor = window.matchMedia('(pointer: fine)').matches ? 'grab' : '';
      stage.querySelectorAll('img').forEach(img => {
        img.draggable = false;
        img.style.webkitUserDrag = 'none';
      });
    }

    const pauseVideo = () => {
      if (!video || video.paused) return;
      video.pause();
      videoShell?.classList.remove('is-playing');
      if (playButton) {
        playButton.hidden = false;
        playButton.setAttribute('aria-label', 'Продолжить видео');
        const label = playButton.querySelector('b');
        if (label) label.textContent = 'Продолжить';
      }
    };

    const ensureMedia = (index) => {
      const slide = slides[index];
      if (!slide) return;
      const img = slide.querySelector('img[data-src]');
      if (img && !img.src) {
        img.src = img.dataset.src;
        img.draggable = false;
        img.style.webkitUserDrag = 'none';
        img.removeAttribute('data-src');
      }
      if (index === videoIndex && poster && !poster.src) {
        poster.src = videoShell.dataset.poster;
        poster.draggable = false;
      }

      const nextSlide = slides[index + 1];
      const nextImage = nextSlide?.querySelector('img[data-src]');
      if (nextImage && !nextImage.src && window.matchMedia('(min-width: 901px)').matches) {
        const preloader = new Image();
        preloader.src = nextImage.dataset.src;
      }
    };

    const loadVideoSources = () => {
      if (!video || !videoShell || videoLoaded) return;

      const sources = [
        {src: videoShell.dataset.mp4, type: 'video/mp4'},
        {src: videoShell.dataset.webm, type: 'video/webm'}
      ].filter(item => item.src);

      sources.forEach(item => {
        const source = document.createElement('source');
        source.src = item.src;
        source.type = item.type;
        video.appendChild(source);
      });

      video.muted = true;
      video.defaultMuted = true;
      video.preload = 'metadata';
      video.load();
      videoLoaded = true;
    };

    const resetDragVisual = () => {
      const slide = slides[active];
      if (!slide) return;
      slide.style.transform = '';
      slide.style.opacity = '';
      if (stage && window.matchMedia('(pointer: fine)').matches) stage.style.cursor = 'grab';
    };

    const go = (index) => {
      resetDragVisual();
      const normalized = (index + slides.length) % slides.length;
      if (normalized !== videoIndex) pauseVideo();
      slides.forEach((slide, i) => {
        const selected = i === normalized;
        slide.hidden = !selected;
        slide.classList.toggle('is-active', selected);
      });
      tabs.forEach((tab, i) => {
        const selected = i === normalized;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      active = normalized;
      ensureMedia(active);
      if (current) current.textContent = String(active + 1).padStart(2, '0');
      if (title) title.textContent = content[active][0];
      if (copy) copy.textContent = content[active][1];
    };

    const markShowcaseInteraction = (method) => {
      reachGoalOnce('marketplace_showcase_interaction', {
        method,
        slide: String(active + 1)
      });
    };

    const handleKeyboardNavigation = (event, keepTabFocus = false) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

      let targetIndex = null;
      if (event.key === 'ArrowRight') targetIndex = active + 1;
      else if (event.key === 'ArrowLeft') targetIndex = active - 1;
      else if (event.key === 'Home') targetIndex = 0;
      else if (event.key === 'End') targetIndex = slides.length - 1;
      else return;

      event.preventDefault();
      markShowcaseInteraction('keyboard');
      go(targetIndex);
      if (keepTabFocus) tabs[active]?.focus({preventScroll: true});
    };

    tabs.forEach((tab, i) => {
      tab.tabIndex = i === active ? 0 : -1;
      tab.addEventListener('click', () => {
        markShowcaseInteraction('tab');
        go(Number(tab.dataset.go));
      });
      tab.addEventListener('keydown', event => handleKeyboardNavigation(event, true));
    });

    prev?.addEventListener('click', () => {
      markShowcaseInteraction('arrow');
      go(active - 1);
    });
    next?.addEventListener('click', () => {
      markShowcaseInteraction('arrow');
      go(active + 1);
    });

    stage?.addEventListener('keydown', event => {
      if (event.target !== stage) return;
      handleKeyboardNavigation(event, false);
    });

    const beginSwipe = event => {
      if (!stage || pointerId !== null) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.target.closest('button,a')) return;

      pointerId = event.pointerId;
      pointerType = event.pointerType || 'mouse';
      startX = lastX = event.clientX;
      startY = lastY = event.clientY;

      try { stage.setPointerCapture(pointerId); } catch (_) {}
      if (pointerType === 'mouse') {
        try { stage.focus({preventScroll: true}); } catch (_) { stage.focus(); }
        stage.style.cursor = 'grabbing';
        event.preventDefault();
      }
    };

    const moveSwipe = event => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      lastX = event.clientX;
      lastY = event.clientY;

      const dx = lastX - startX;
      const dy = lastY - startY;
      if (Math.abs(dx) <= Math.abs(dy) * 1.05) return;

      const slide = slides[active];
      if (slide) {
        const visualX = Math.max(-36, Math.min(36, dx * 0.18));
        slide.style.transform = `translate3d(${visualX}px,0,0)`;
        slide.style.opacity = String(Math.max(.82, 1 - Math.min(Math.abs(dx), 220) / 1200));
      }
      if (pointerType === 'mouse') event.preventDefault();
    };

    const finishSwipe = (event, cancelled = false) => {
      if (pointerId === null || (event.pointerId !== undefined && event.pointerId !== pointerId)) return;

      const dx = lastX - startX;
      const dy = lastY - startY;
      const threshold = pointerType === 'mouse' ? 42 : 52;
      const horizontal = Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.2;
      const oldPointerId = pointerId;
      const oldPointerType = pointerType;

      pointerId = null;
      pointerType = '';
      try {
        if (stage?.hasPointerCapture(oldPointerId)) stage.releasePointerCapture(oldPointerId);
      } catch (_) {}

      resetDragVisual();
      if (!cancelled && horizontal) {
        markShowcaseInteraction(oldPointerType === 'mouse' ? 'mouse-swipe' : 'touch-swipe');
        go(active + (dx < 0 ? 1 : -1));
      }
    };

    stage?.addEventListener('pointerdown', beginSwipe);
    stage?.addEventListener('pointermove', moveSwipe, {passive: false});
    stage?.addEventListener('pointerup', event => finishSwipe(event, false));
    stage?.addEventListener('pointercancel', event => finishSwipe(event, true));
    stage?.addEventListener('lostpointercapture', event => {
      if (pointerId !== null && event.pointerId === pointerId) finishSwipe(event, true);
    });
    stage?.addEventListener('dragstart', event => event.preventDefault());

    playButton?.addEventListener('click', async () => {
      loadVideoSources();
      try {
        await video.play();
        videoShell.classList.add('is-loaded', 'is-playing');
        playButton.hidden = true;
        soundButton.hidden = false;
        reachGoalOnce('marketplace_video_play');
      } catch (_) {
        videoShell.classList.remove('is-playing');
        playButton.hidden = false;
      }
    });

    soundButton?.addEventListener('click', () => {
      video.muted = !video.muted;
      soundButton.setAttribute('aria-pressed', String(!video.muted));
      soundButton.setAttribute('aria-label', video.muted ? 'Включить звук' : 'Выключить звук');
    });

    video?.addEventListener('ended', () => {
      videoShell.classList.remove('is-playing');
      playButton.hidden = false;
      playButton.setAttribute('aria-label', 'Воспроизвести видео ещё раз');
      const label = playButton.querySelector('b');
      if (label) label.textContent = 'Смотреть ещё раз';
    });

    video?.addEventListener('pause', () => {
      if (video.ended) return;
      videoShell.classList.remove('is-playing');
    });

    if ('IntersectionObserver' in window && videoShell) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (!entry.isIntersecting) pauseVideo();
      }, {threshold: 0.01});
      observer.observe(videoShell);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseVideo();
    });

    ensureMedia(0);
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const priceLink = target.closest('.price-card a');
    if (priceLink) {
      const card = priceLink.closest('.price-card');
      reachGoal('marketplace_price_click', {
        service: card?.querySelector('.price-label')?.textContent?.trim() || '',
        price: card?.querySelector('h3')?.textContent?.trim() || ''
      });
      return;
    }

    const orderCta = target.closest('.header-cta, .hero-actions .button-primary');
    if (orderCta) {
      reachGoal('marketplace_order_cta', {
        location: orderCta.classList.contains('header-cta') ? 'header' : 'hero'
      });
      return;
    }

    const link = target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';

    if (href.includes('t.me/KVSemenov')) {
      reachGoal('marketplace_telegram_click', {location: 'order'});
    } else if (href.includes('max.ru/')) {
      reachGoal('marketplace_max_click', {
        location: link.closest('.order-channel') ? 'channel' : 'order'
      });
    }
  });

  const finePointer = window.matchMedia('(pointer: fine) and (min-width: 901px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reticle = document.querySelector('[data-reticle]');
  const trails = [...document.querySelectorAll('[data-trail]')];

  if (finePointer.matches && !reducedMotion.matches && reticle && trails.length) {
    const points = trails.map(() => ({x: -100, y: -100}));
    let targetX = -100;
    let targetY = -100;
    let raf = 0;

    const render = () => {
      raf = 0;
      reticle.style.transform = `translate3d(${targetX - 12}px,${targetY - 12}px,0)`;
      let leaderX = targetX;
      let leaderY = targetY;
      points.forEach((point, i) => {
        const lag = 0.32 - i * 0.045;
        point.x += (leaderX - point.x) * lag;
        point.y += (leaderY - point.y) * lag;
        trails[i].style.transform = `translate3d(${point.x}px,${point.y}px,0) rotate(${45 + i * 18}deg)`;
        leaderX = point.x;
        leaderY = point.y;
      });
      const moving = points.some(p => Math.abs(p.x - targetX) > .5 || Math.abs(p.y - targetY) > .5);
      if (moving) raf = requestAnimationFrame(render);
    };

    window.addEventListener('pointermove', event => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!raf) raf = requestAnimationFrame(render);
    }, {passive: true});

    document.addEventListener('pointerover', event => {
      reticle.classList.toggle('is-active', Boolean(event.target.closest('a,button,summary')));
    }, {passive: true});
  }
})();
