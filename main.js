'use strict';

/* ---------- Мобильное меню ---------- */

const menuButton = document.getElementById('menubtn');
const navLinks = document.getElementById('navlinks');

if (menuButton && navLinks) {
  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menuButton.textContent = open ? '×' : '☰';
  };

  menuButton.addEventListener('click', () => {
    setMenu(!navLinks.classList.contains('open'));
  });

  navLinks.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) {
      setMenu(false);
      menuButton.focus();
    }
  });

  // При переходе на широкий экран меню закрываем, чтобы оно не осталось «открытым»
  window.matchMedia('(min-width: 801px)').addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });
}

/* ---------- Карусели ----------
   Положение слайдов считает CSS (переменная --index),
   здесь — только индекс, кнопки, счётчик и доступность. */

const carousels = [...document.querySelectorAll('[data-carousel-root]')];

const perView = (carousel) => {
  const value = Number.parseInt(getComputedStyle(carousel).getPropertyValue('--per-view'), 10);
  return value > 0 ? value : 1;
};

const pad = (number) => String(number).padStart(2, '0');

const updateCarousel = (carousel, delta = 0) => {
  const track = carousel.querySelector('[data-carousel-track]');
  const previous = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  const counter = carousel.querySelector('[data-carousel-counter]');
  if (!track || !previous || !next || !counter) return;

  const items = [...track.children];
  if (!items.length) return;

  const visible = Math.min(perView(carousel), items.length);
  const maxIndex = items.length - visible;
  const current = Number.parseInt(carousel.dataset.carouselIndex || '0', 10) || 0;
  const index = Math.min(maxIndex, Math.max(0, current + delta));

  carousel.dataset.carouselIndex = String(index);
  carousel.style.setProperty('--index', String(index));

  // Слайды вне окна не должны попадать в Tab и в чтение скринридером:
  // иначе фокус «прокрутит» скрытый контейнер и сломает положение ленты.
  items.forEach((item, i) => {
    item.inert = i < index || i >= index + visible;
  });

  previous.disabled = index === 0;
  next.disabled = index >= maxIndex;

  // Если фокус был на кнопке, которая стала неактивной, переносим его на парную
  if (next.disabled && document.activeElement === next && !previous.disabled) previous.focus();
  if (previous.disabled && document.activeElement === previous && !next.disabled) next.focus();

  if (carousel.dataset.carouselKind === 'works') {
    counter.textContent = `${pad(index + 1)}–${pad(index + visible)} / ${items.length}`;
  } else {
    counter.textContent = `${pad(index + 1)} / ${pad(items.length)}`;
  }
};

carousels.forEach((carousel) => updateCarousel(carousel));

document.addEventListener('click', (event) => {
  const button = event.target instanceof Element
    ? event.target.closest('[data-carousel-next], [data-carousel-prev]')
    : null;
  if (!button || button.disabled) return;

  const carousel = button.closest('[data-carousel-root]');
  if (carousel) updateCarousel(carousel, button.hasAttribute('data-carousel-next') ? 1 : -1);
});

// При смене ширины экрана меняется число видимых слайдов — пересчитываем
let resizeFrame = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => carousels.forEach((carousel) => updateCarousel(carousel)));
});

/* ---------- Просмотр фото ---------- */

const lightbox = document.getElementById('photo-lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;

if (lightbox && lightboxImage && lightboxClose) {
  const openPhoto = (item) => {
    const thumbnail = item.matches('img') ? item : item.querySelector('img');
    lightboxImage.src = item.matches('a') ? item.href : (thumbnail?.currentSrc || thumbnail?.src || '');
    lightboxImage.alt = thumbnail?.alt || 'Фотография';
    lightbox.showModal();
  };

  document.querySelectorAll('.work-photo, .review-card, .master-photo').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      openPhoto(item);
    });

    // Фото мастера — не ссылка, поэтому открываем с клавиатуры вручную
    if (item.matches('.master-photo')) {
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPhoto(item);
        }
      });
    }
  });

  lightboxClose.addEventListener('click', () => lightbox.close());

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  lightbox.addEventListener('close', () => {
    lightboxImage.removeAttribute('src');
  });
}