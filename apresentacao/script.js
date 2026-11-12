(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const bar = document.querySelector('.progress span');
  const counter = document.querySelector('.counter');
  const dotsBox = document.querySelector('.dots');
  const prevBtn = document.querySelector('[data-nav="prev"]');
  const nextBtn = document.querySelector('[data-nav="next"]');
  const fullBtn = document.querySelector('[data-nav="full"]');
  const lightbox = document.querySelector('.lightbox');
  let current = 0;

  slides.forEach((slide) => {
    slide.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--i', i));
  });

  const dots = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.title = slide.dataset.title || `Slide ${i + 1}`;
    dot.addEventListener('click', () => go(i));
    dotsBox.appendChild(dot);
    return dot;
  });

  counter.querySelector('i').textContent = slides.length;

  function animateCounters(slide) {
    slide.querySelectorAll('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      const start = performance.now();
      const duration = 1200;
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      setTimeout(() => requestAnimationFrame(tick), 400);
    });
  }

  function go(index) {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === next);
      slide.classList.toggle('is-before', i < next);
      slide.setAttribute('aria-hidden', i === next ? 'false' : 'true');
    });
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === next));
    const active = slides[next];
    active.scrollTop = 0;
    document.body.classList.toggle('on-dark', active.matches('.slide--cover, .slide--dark'));
    bar.style.width = `${((next + 1) / slides.length) * 100}%`;
    counter.querySelector('b').textContent = next + 1;
    prevBtn.disabled = next === 0;
    nextBtn.disabled = next === slides.length - 1;
    if (next !== current || !active.dataset.seen) animateCounters(active);
    active.dataset.seen = '1';
    current = next;
    history.replaceState(null, '', `#${next + 1}`);
  }

  const goNext = () => go(current + 1);
  const goPrev = () => go(current - 1);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);
  fullBtn.addEventListener('click', toggleFullscreen);

  document.addEventListener('keydown', (event) => {
    if (!lightbox.hidden) {
      if (event.key === 'Escape') closeLightbox();
      return;
    }
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(event.key)) { event.preventDefault(); goNext(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(event.key)) { event.preventDefault(); goPrev(); }
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(slides.length - 1);
    else if (event.key.toLowerCase() === 'f') toggleFullscreen();
  });

  let touchX = null;
  let touchY = null;
  document.addEventListener('touchstart', (event) => {
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', (event) => {
    if (touchX === null || !lightbox.hidden) return;
    const dx = event.changedTouches[0].clientX - touchX;
    const dy = event.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? goNext : goPrev)();
    touchX = null;
  });

  function openLightbox(src, alt) {
    const img = lightbox.querySelector('img');
    img.src = src;
    img.alt = alt;
    lightbox.hidden = false;
  }
  function closeLightbox() { lightbox.hidden = true; }

  document.querySelectorAll('.shot img, .phone img').forEach((img) => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });
  lightbox.addEventListener('click', closeLightbox);

  const fromHash = Number(location.hash.slice(1)) - 1;
  go(Number.isInteger(fromHash) && fromHash >= 0 ? fromHash : 0);
})();
