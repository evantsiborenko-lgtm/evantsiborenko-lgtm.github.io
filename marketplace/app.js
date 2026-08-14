(() => {
  'use strict';

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

    const content = [
      ['Исходник → готовая карточка', 'Сразу показываем разницу между исходной фотографией и подготовленным коммерческим визуалом.'],
      ['Product-сцена', 'Тот же товар переносится в более выразительный рекламный контекст без потери его роли в кадре.'],
      ['Подарочное позиционирование', 'Один и тот же продукт можно подать под другой сценарий продажи и другую мотивацию покупателя.'],
      ['Premium-позиционирование', 'Меняем окружение и настроение, сохраняя товар главным объектом композиции.'],
      ['Готовый видеоматериал', 'Финальный этап — короткий ролик. Звук выключен по умолчанию и включается только по действию пользователя.']
    ];

    let active = 0;
    let touchX = 0;
    let touchY = 0;
    let videoLoaded = false;

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
        img.removeAttribute('data-src');
      }
      if (index === 4 && poster && !poster.src) poster.src = videoShell.dataset.poster;

      const nextSlide = slides[index + 1];
      const nextImage = nextSlide?.querySelector('img[data-src]');
      if (nextImage && !nextImage.src && window.matchMedia('(min-width: 901px)').matches) {
        const preloader = new Image();
        preloader.src = nextImage.dataset.src;
      }
    };

    const go = (index) => {
      const normalized = (index + slides.length) % slides.length;
      if (normalized !== 4) pauseVideo();
      slides.forEach((slide, i) => {
        const selected = i === normalized;
        slide.hidden = !selected;
        slide.classList.toggle('is-active', selected);
      });
      tabs.forEach((tab, i) => {
        const selected = i === normalized;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-selected', String(selected));
      });
      active = normalized;
      ensureMedia(active);
      if (current) current.textContent = String(active + 1).padStart(2, '0');
      if (title) title.textContent = content[active][0];
      if (copy) copy.textContent = content[active][1];
    };

    tabs.forEach(tab => tab.addEventListener('click', () => go(Number(tab.dataset.go))));
    prev?.addEventListener('click', () => go(active - 1));
    next?.addEventListener('click', () => go(active + 1));

    stage?.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse') return;
      touchX = event.clientX;
      touchY = event.clientY;
    }, {passive: true});

    stage?.addEventListener('pointerup', event => {
      if (event.pointerType === 'mouse') return;
      const dx = event.clientX - touchX;
      const dy = event.clientY - touchY;
      if (Math.abs(dx) < 52 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      go(active + (dx < 0 ? 1 : -1));
    }, {passive: true});

    playButton?.addEventListener('click', async () => {
      if (!videoLoaded) {
        video.src = videoShell.dataset.src;
        video.muted = true;
        video.defaultMuted = true;
        video.preload = 'metadata';
        video.load();
        videoLoaded = true;
      }
      try {
        await video.play();
        videoShell.classList.add('is-loaded', 'is-playing');
        playButton.hidden = true;
        soundButton.hidden = false;
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
