/* Portfolio interactions: nav, filter, lightbox, copy, reveal, gauges */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- 1. Mobile menu ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- 2. Project filter ---------- */
  const chips = $$('.chip'), cards = $$('.project'), empty = $('#empty');
  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach(c => {
      const on = c === chip;
      c.classList.toggle('active', on);
      c.setAttribute('aria-selected', on);
    });
    let shown = 0;
    cards.forEach(card => {
      const match = f === 'all' || card.dataset.cat === f;
      card.classList.toggle('hide', !match);
      if (match) { shown++; card.classList.remove('fade'); void card.offsetWidth; card.classList.add('fade'); }
    });
    empty.hidden = shown > 0;
  }));

  /* Show a placeholder label if a CAD image has not been uploaded yet */
  $$('.frame img').forEach(img => {
    img.addEventListener('error', () => { img.style.display = 'none'; img.parentElement.classList.add('noimg'); });
  });

  /* ---------- 3. CAD lightbox ---------- */
  const modal = $('#modal');
  let lastFocus = null;
  const openModal = card => {
    const img = $('img', card);
    $('#m-img').src = img.getAttribute('src');
    $('#m-img').alt = img.alt;
    $('#m-tag').textContent = $('.tag', card).textContent;
    $('#m-title').textContent = $('h3', card).textContent;
    $('#m-loc').textContent = $('[data-loc]', card).textContent;
    $('#m-role').textContent = $('[data-role]', card).textContent;
    $('#m-scope').textContent = $('[data-scope]', card).textContent;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#m-close').focus();
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  $$('.inspect').forEach(b => b.addEventListener('click', () => openModal(b.closest('.project'))));
  $('#m-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  /* ---------- 4. Copy to clipboard + toast ---------- */
  const toast = $('#toast');
  let timer;
  const showToast = msg => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('show'), 1800);
  };
  const copyText = async text => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers / non-secure contexts
      const t = document.createElement('textarea');
      t.value = text; document.body.appendChild(t); t.select();
      document.execCommand('copy'); t.remove();
    }
  };
  $$('.copy').forEach(b => b.addEventListener('click', async () => {
    await copyText(b.dataset.copy);
    showToast('Copied!');
  }));

  /* ---------- 5. Scroll reveal ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }), { threshold: .12 })
    : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---------- Skill gauges (10 segments) ---------- */
  $$('.gauge').forEach(g => {
    const lvl = +g.dataset.level;
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('i');
      if (i < lvl) s.className = 'on';
      g.appendChild(s);
    }
  });
})();
