/* Portfolio interactions: nav, filter, PDF/image lightbox, copy, reveal, gauges.
   Works with your current index.html as-is (no HTML edits needed). */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const isPdf = u => /\.pdf(?:[?#].*)?$/i.test(u);

  /* Styles for PDF thumbnails and the viewer (injected so style.css stays untouched) */
  const css = document.createElement('style');
  css.textContent = `
    .frame{position:relative}
    .pdf-thumb{width:100%;height:100%;border:0;background:#fff;pointer-events:none}
    .badge{position:absolute;top:10px;left:10px;z-index:1;background:var(--ink);color:var(--bg);font:500 .7rem var(--mono);padding:3px 8px;border-radius:var(--r)}
    .m-img{align-items:start!important}
    .viewer{width:100%;display:grid;gap:0}
    .viewer iframe{width:100%;height:75vh;border:0;background:#fff}
    .viewer img{width:100%;max-height:75vh;object-fit:contain}
    .v-bar{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--surface);font:.78rem var(--mono)}
    .v-bar button,.v-bar a{font:inherit;color:var(--ink);background:var(--chip);border:1px solid var(--chip-line);border-radius:var(--r);padding:5px 10px;cursor:pointer;text-decoration:none}
    .v-bar button:disabled{opacity:.4;cursor:default}
    @media (max-width:860px){.viewer iframe{height:60vh}}`;
  document.head.appendChild(css);

  /* ---------- 1. Mobile menu ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => { menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- 2. Project filter ---------- */
  const chips = $$('.chip'), cards = $$('.project'), empty = $('#empty');
  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach(c => { const on = c === chip; c.classList.toggle('active', on); c.setAttribute('aria-selected', on); });
    let shown = 0;
    cards.forEach(card => {
      const match = f === 'all' || card.dataset.cat === f;
      card.classList.toggle('hide', !match);
      if (match) { shown++; card.classList.remove('fade'); void card.offsetWidth; card.classList.add('fade'); }
    });
    empty.hidden = shown > 0;
  }));

  /* ---------- 3. Card thumbnails: PNG/JPG, PDF, or several files ----------
     Files come from the optional data-files="a.png,b.pdf" attribute on the card,
     otherwise from the card's <img src>. Optional data-thumb="x.png" = preview image. */
  cards.forEach(card => {
    const frame = $('.frame', card), img = $('img', frame);
    const files = (card.dataset.files || img.getAttribute('src') || '').split(',').map(s => s.trim()).filter(Boolean);
    card._files = files;
    const first = files[0];
    if (card.dataset.thumb) img.src = card.dataset.thumb;
    else if (first && isPdf(first)) {
      // Browsers can't show a PDF inside <img>, so use its first page as a live preview
      const f = document.createElement('iframe');
      f.className = 'pdf-thumb'; f.tabIndex = -1; f.loading = 'lazy';
      f.title = img.alt; f.src = first + '#toolbar=0&navpanes=0&view=FitH';
      img.replaceWith(f);
    } else {
      if (first) img.src = first;
      img.addEventListener('error', () => { img.style.display = 'none'; frame.classList.add('noimg'); });
    }
    const label = files.length > 1 ? files.length + ' files' : (isPdf(first || '') ? 'PDF' : '');
    if (label) { const b = document.createElement('span'); b.className = 'badge'; b.textContent = label; frame.appendChild(b); }
  });

  /* ---------- 4. Lightbox (PDF + multi-file viewer) ---------- */
  const modal = $('#modal'), holder = $('.m-img'), oldImg = $('#m-img');
  oldImg.style.display = 'none';
  const viewer = document.createElement('div');
  viewer.className = 'viewer';
  holder.appendChild(viewer);
  let lastFocus = null, files = [], idx = 0, title = '';

  const render = () => {
    const url = files[idx];
    viewer.replaceChildren();
    const bar = document.createElement('div'); bar.className = 'v-bar';
    const prev = document.createElement('button'); prev.textContent = 'Prev'; prev.disabled = idx === 0;
    const next = document.createElement('button'); next.textContent = 'Next'; next.disabled = idx === files.length - 1;
    const count = document.createElement('span'); count.textContent = (idx + 1) + ' / ' + files.length;
    const open = document.createElement('a'); open.href = url; open.target = '_blank'; open.rel = 'noopener'; open.textContent = 'Open in new tab';
    prev.onclick = () => { idx--; render(); };
    next.onclick = () => { idx++; render(); };
    if (files.length > 1) bar.append(prev, count, next);
    bar.append(open);
    let view;
    if (isPdf(url)) { view = document.createElement('iframe'); view.src = url + '#view=FitH'; view.title = title; }
    else { view = document.createElement('img'); view.src = url; view.alt = title; }
    viewer.append(bar, view);
  };
  const openModal = card => {
    files = card._files || []; idx = 0;
    title = $('h3', card).textContent;
    $('#m-tag').textContent = $('.tag', card).textContent;
    $('#m-title').textContent = title;
    $('#m-loc').textContent = $('[data-loc]', card).textContent;
    $('#m-role').textContent = $('[data-role]', card).textContent;
    $('#m-scope').textContent = $('[data-scope]', card).textContent;
    render();
    lastFocus = document.activeElement;
    modal.hidden = false; document.body.style.overflow = 'hidden';
    $('#m-close').focus();
  };
  const closeModal = () => {
    modal.hidden = true; document.body.style.overflow = '';
    viewer.replaceChildren();
    if (lastFocus) lastFocus.focus();
  };
  $$('.inspect').forEach(b => b.addEventListener('click', () => openModal(b.closest('.project'))));
  $('#m-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight' && idx < files.length - 1) { idx++; render(); }
    if (e.key === 'ArrowLeft' && idx > 0) { idx--; render(); }
  });

  /* ---------- 5. Copy to clipboard + toast ---------- */
  const toast = $('#toast'); let timer;
  const showToast = msg => {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(timer); timer = setTimeout(() => toast.classList.remove('show'), 1800);
  };
  const copyText = async text => {
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
  };
  $$('.copy').forEach(b => b.addEventListener('click', async () => { await copyText(b.dataset.copy); showToast('Copied!'); }));

  /* ---------- 6. Scroll reveal ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 })
    : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---------- Skill gauges ---------- */
  $$('.gauge').forEach(g => {
    for (let i = 0; i < 10; i++) { const s = document.createElement('i'); if (i < +g.dataset.level) s.className = 'on'; g.appendChild(s); }
  });

  /* ---------- 7. Dark mode toggle (remembers choice) ---------- */
  const root = document.documentElement, tbtn = $('#theme');
  const syncTheme = () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    tbtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    tbtn.setAttribute('aria-pressed', dark);
  };
  syncTheme();
  tbtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncTheme();
  });

  /* ---------- 8. Works carousel: arrows, mouse drag, counter ---------- */
  const track = $('#grid'), prevB = $('#prev'), nextB = $('#next'), count = $('#count');
  const visible = () => cards.filter(c => !c.classList.contains('hide'));
  const stepPx = () => { const c = visible()[0]; return c ? c.offsetWidth + 20 : 340; };
  const updateCar = () => {
    const max = track.scrollWidth - track.clientWidth;
    prevB.disabled = track.scrollLeft < 4;
    nextB.disabled = track.scrollLeft > max - 4;
    const n = visible().length;
    const at = Math.min(n, Math.round(track.scrollLeft / stepPx()) + 1);
    count.textContent = n ? at + ' / ' + n : '0 / 0';
  };
  prevB.addEventListener('click', () => track.scrollBy({ left: -stepPx(), behavior: 'smooth' }));
  nextB.addEventListener('click', () => track.scrollBy({ left: stepPx(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateCar, { passive: true });
  window.addEventListener('resize', updateCar);
  chips.forEach(ch => ch.addEventListener('click', () => { track.scrollTo({ left: 0 }); updateCar(); }));
  track.addEventListener('dragstart', e => e.preventDefault());

  // Click-and-drag scrolling for mouse users (touch uses native swipe)
  let down = false, sx = 0, sl = 0, moved = 0;
  track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft;
  });
  window.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - sx;
    moved = Math.max(moved, Math.abs(dx));
    if (moved > 5) { track.classList.add('drag'); track.scrollLeft = sl - dx; }
  });
  window.addEventListener('pointerup', () => { if (down) { down = false; track.classList.remove('drag'); } });
  track.addEventListener('click', e => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  updateCar();
})();
