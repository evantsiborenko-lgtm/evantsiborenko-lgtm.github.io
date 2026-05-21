const PAYMENT_URL = 'https://c2c.cbrpay.ru/AS1I002E5DAN3MRN8KQP9R97693V67MF';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Adjust for fixed header height (approx 70px)
                const headerOffset = 70;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. FAQ Accordion (Accessible)
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        
        questionBtn.addEventListener('click', () => {
            const isExpanded = questionBtn.getAttribute('aria-expanded') === 'true';
            
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherBtn = otherItem.querySelector('.faq-question');
                    if (otherBtn) {
                        otherBtn.setAttribute('aria-expanded', 'false');
                    }
                }
            });
            
            // Toggle current item
            if (isExpanded) {
                item.classList.remove('active');
                questionBtn.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('active');
                questionBtn.setAttribute('aria-expanded', 'true');
            }
        });
    });


    // --- DYNAMIC CATALOG RENDERING ---
    const catalogContainer = document.getElementById('catalog-container');
    if (catalogContainer && window.birthdayCatalog) {
        renderCatalog(catalogContainer, window.birthdayCatalog);
    }

    function renderCatalog(container, data) {
        // 1. Categories Grid
        const categoriesHTML = `
            <div class="catalog-categories-grid">
                <button class="category-card category-active active" type="button" aria-expanded="true" aria-controls="catalog-detail-birthday" id="cat-btn-birthday">
                    <div class="category-card-content">
                        <h3>День рождения</h3>
                        <p>42 ролика, 7 серий, доступно сейчас</p>
                    </div>
                </button>
                <button class="category-card category-soon" type="button" disabled aria-disabled="true">
                    <div class="category-card-content">
                        <h3>Новый год</h3>
                        <p>скоро</p>
                    </div>
                </button>
                <button class="category-card category-soon" type="button" disabled aria-disabled="true">
                    <div class="category-card-content">
                        <h3>8 Марта</h3>
                        <p>скоро</p>
                    </div>
                </button>
                <button class="category-card category-soon" type="button" disabled aria-disabled="true">
                    <div class="category-card-content">
                        <h3>День святого Валентина</h3>
                        <p>скоро</p>
                    </div>
                </button>
                <button class="category-card category-soon" type="button" disabled aria-disabled="true">
                    <div class="category-card-content">
                        <h3>Свадьба / годовщина</h3>
                        <p>скоро</p>
                    </div>
                </button>
            </div>
        `;

        // 2. Birthday Detail View
        let seriesListHTML = '<div id="birthday-series" class="series-list">';
        
        data.series.forEach((series, index) => {
            const seriesLabel = series.folderName || String(index + 1).padStart(2, '0');
            const seriesSkus = data.skus.filter(sku => sku.seriesId === series.id);
            
            let skusHTML = '<div class="sku-grid">';
            seriesSkus.forEach(sku => {
                skusHTML += `
                    <div class="sku-card">
                        <div class="sku-visual" data-video="${sku.video}">
                            <img src="${sku.poster}" alt="${sku.title}" loading="lazy" decoding="async" style="position:absolute; width:100%; height:100%; object-fit:cover; z-index:1;">
                        </div>
                        <div class="sku-info">
                            <div class="sku-meta">
                                <span class="sku-code">${sku.id}</span>
                                <span class="sku-duration">${sku.duration}</span>
                            </div>
                            <h5 class="sku-title">${sku.title}</h5>
                            <span class="sku-price">${sku.price} ₽</span>
                            <div class="sku-actions">
                                <button class="btn btn-secondary btn-sm preview-btn" data-video="${sku.video}">Смотреть пример</button>
                                <a href="https://t.me/KVSemenov" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Заказать ролик — 49 ₽</a>
                                <a href="https://t.me/KVSemenov" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">С именем / своим текстом +299 ₽</a>
                            </div>
                        </div>
                    </div>
                `;
            });
            skusHTML += '</div>';

            seriesListHTML += `
                <div class="series-item">
                    <button class="series-header" aria-expanded="false" aria-controls="series-content-${index}" id="series-btn-${index}">
                        <div class="series-header-info">
                            <h4>${seriesLabel} — ${series.title}</h4>
                            <p>${series.desc} (Цена серии: 199 ₽)</p>
                        </div>
                        <span class="series-icon" aria-hidden="true">+</span>
                    </button>
                    <div id="series-content-${index}" class="series-content" role="region" aria-labelledby="series-btn-${index}" hidden>
                        ${skusHTML}
                        <div style="text-align:center; margin-top: 20px;">
                            <a href="https://t.me/KVSemenov" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Заказать серию — 199 ₽</a>
                        </div>
                    </div>
                </div>
            `;
        });
        seriesListHTML += '</div>';

        const birthdayDetailHTML = `
            <div id="catalog-detail-birthday" class="catalog-detail" role="region" aria-labelledby="cat-btn-birthday">
                <div class="detail-header">
                    <h3 class="detail-title">День рождения — 42 видео-открытки</h3>
                    <p class="detail-desc">7 визуальных стилей: сказочная книга, волшебный подарок, котики, торт, premium, космос и котик-доставщик. Все ролики готовы к отправке в Telegram, WhatsApp и соцсетях.</p>
                    <div class="detail-pricing">
                        <span>1 готовый ролик — <strong>49 ₽</strong></span>
                        <span>Серия из 6 роликов — <strong>199 ₽</strong></span>
                        <span>Premium Pack 12 роликов — <strong>299 ₽</strong></span>
                        <span>Cats Pack 12 роликов — <strong>299 ₽</strong></span>
                        <span>Полный набор 42 ролика — <strong>490 ₽</strong></span>
                        <span>Персонализация имени/текста — <strong>+299 ₽</strong></span>
                    </div>
                </div>
                ${seriesListHTML}
                <div class="full-set-block" id="birthday-full-pack">
                    <div class="full-set-content">
                        <h3>Полный набор “День рождения” — 42 видео-открытки</h3>
                        <p>Все 7 серий в одном наборе. Подходит, если хотите иметь открытки на разные случаи: для родных, друзей, коллег, детей и тёплых личных поздравлений.</p>
                        <span class="full-set-price">490 ₽</span>
                    </div>
                    <div class="hero-buttons">
                        <a href="https://t.me/KVSemenov" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-large">Заказать полный набор</a>
                        <a href="https://c2c.cbrpay.ru/AS1I002E5DAN3MRN8KQP9R97693V67MF" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-large">Оплатить по СБП</a>
                    </div>
                </div>
            </div>
        `;

        // Render everything
        container.innerHTML += categoriesHTML + birthdayDetailHTML;
        
        initCatalogInteractions();
    }

    function initCatalogInteractions() {
        // Prevent context menu on media elements (soft protection)
        document.querySelectorAll('.sku-visual, img, video').forEach(el => {
            el.addEventListener('contextmenu', e => e.preventDefault());
        });

        // Hover preview for devices that really support hover (desktop / mouse / trackpad).
        // Do not rely on screen width: some tablets have a mouse, and some small windows are still desktop.
        const canHoverPreview = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

        function ensurePreviewVideo(visual) {
            const videoSrc = visual.getAttribute('data-video');
            if (!videoSrc) return null;

            let video = visual.querySelector('video.site-preview-video');
            if (!video) {
                video = document.createElement('video');
                video.className = 'site-preview-video';

                // Attributes first: improves autoplay reliability in Chrome/Safari.
                video.muted = true;
                video.defaultMuted = true;
                video.loop = true;
                video.playsInline = true;
                video.autoplay = true;
                video.preload = 'metadata';
                video.setAttribute('muted', '');
                video.setAttribute('playsinline', '');
                video.setAttribute('webkit-playsinline', '');
                video.setAttribute('controlsList', 'nodownload');
                video.setAttribute('disablePictureInPicture', '');
                video.setAttribute('aria-hidden', 'true');
                video.addEventListener('contextmenu', e => e.preventDefault());
                video.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:2; background:#000;';

                video.src = videoSrc;
                visual.appendChild(video);
            }
            return video;
        }

        if (canHoverPreview) {
            document.querySelectorAll('.sku-visual').forEach(visual => {
                const startPreview = function() {
                    const video = ensurePreviewVideo(visual);
                    if (!video) return;
                    video.currentTime = 0;
                    video.load();
                    const playPromise = video.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch(err => console.log('Preview autoplay blocked:', err));
                    }
                };

                const stopPreview = function() {
                    const video = visual.querySelector('video.site-preview-video');
                    if (video) {
                        video.pause();
                        video.currentTime = 0;
                    }
                };

                visual.addEventListener('pointerenter', startPreview);
                visual.addEventListener('mouseenter', startPreview);
                visual.addEventListener('pointerleave', stopPreview);
                visual.addEventListener('mouseleave', stopPreview);
            });
        }

        // Accordions
        const birthdayCatBtn = document.getElementById('cat-btn-birthday');
        const birthdayDetail = document.getElementById('catalog-detail-birthday');

        if (birthdayCatBtn && birthdayDetail) {
            birthdayCatBtn.addEventListener('click', () => {
                const isExpanded = birthdayCatBtn.getAttribute('aria-expanded') === 'true';
                if (isExpanded) {
                    birthdayCatBtn.setAttribute('aria-expanded', 'false');
                    birthdayCatBtn.classList.remove('active');
                    birthdayDetail.hidden = true;
                } else {
                    birthdayCatBtn.setAttribute('aria-expanded', 'true');
                    birthdayCatBtn.classList.add('active');
                    birthdayDetail.hidden = false;
                }
            });
        }

        const seriesItems = document.querySelectorAll('.series-item');
        seriesItems.forEach(item => {
            const headerBtn = item.querySelector('.series-header');
            const content = item.querySelector('.series-content');
            if (headerBtn && content) {
                headerBtn.addEventListener('click', () => {
                    const isExpanded = headerBtn.getAttribute('aria-expanded') === 'true';
                    if (isExpanded) {
                        item.classList.remove('active');
                        headerBtn.setAttribute('aria-expanded', 'false');
                        content.hidden = true;
                    } else {
                        item.classList.add('active');
                        headerBtn.setAttribute('aria-expanded', 'true');
                        content.hidden = false;
                    }
                });
            }
        });

        // Modal Logic
        const modal = document.getElementById('video-modal');
        const modalVideo = document.getElementById('modal-video');
        const modalClose = document.querySelector('.modal-close');
        let focusReturnElement = null;

        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                focusReturnElement = this;
                const videoSrc = this.getAttribute('data-video');
                modalVideo.src = videoSrc;
                modal.hidden = false;
                modalVideo.play().catch(e => {});
                modalClose.focus();
            });
        });

        function closeModal() {
            modal.hidden = true;
            modalVideo.pause();
            modalVideo.src = ""; // Unload video
            if (focusReturnElement) {
                focusReturnElement.focus();
            }
        }

        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }

        // Close on overlay click
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.hidden) {
                closeModal();
            }
        });
    }

});