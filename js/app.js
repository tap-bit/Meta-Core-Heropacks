(function () {
  'use strict';

  function el(tag, props, children) {
    var e = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'text') e.textContent = props[k];
      else e.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }

  function safeUrl(u) {
    try {
      var p = new URL(u, location.href);
      return p.protocol === 'https:' || p.protocol === 'http:' ? p.href : null;
    } catch (e) { return null; }
  }

  function safeAsset(u) {
    return typeof u === 'string' && !/^\s*(javascript|data|vbscript):/i.test(u) ? u : null;
  }

  function youtubeEmbed(u) {
    var m = String(u).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? 'https://www.youtube.com/embed/' + m[1] : null;
  }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function card(p) {
    var thumb = safeAsset(p.thumbnail || (p.images && p.images[0]));
    var media = thumb ? el('img', { src: thumb, alt: p.title, loading: 'lazy' }) : el('div', { 'class': 'ph' });
    var b = el('button', { 'class': 'card', type: 'button' }, [
      media,
      el('div', { 'class': 'info' }, [el('strong', { text: p.title }), el('span', { text: 'by ' + p.creator })]),
      el('div', { 'class': 'hover', text: p.description || '' })
    ]);
    b.addEventListener('click', function () { openModal(p); });
    return b;
  }

  var modal = document.getElementById('modal');
  var content = document.getElementById('modal-content');

  function openModal(p) {
    content.textContent = '';
    content.appendChild(el('h3', { text: p.title }));
    content.appendChild(el('p', { 'class': 'creator', text: 'by ' + p.creator }));
    content.appendChild(el('p', { text: p.description || '' }));
    (p.images || []).forEach(function (src) {
      var s = safeAsset(src);
      if (s) content.appendChild(el('img', { src: s, alt: p.title, loading: 'lazy' }));
    });
    (p.videos || []).forEach(function (v) {
      var emb = youtubeEmbed(v);
      if (emb) {
        content.appendChild(el('div', { 'class': 'video' }, [el('iframe', { src: emb, title: p.title + ' video', allowfullscreen: '', loading: 'lazy' })]));
      } else if (safeUrl(v)) {
        content.appendChild(el('p', {}, [el('a', { href: safeUrl(v), target: '_blank', rel: 'noopener noreferrer', text: 'Watch video' })]));
      }
    });
    var links = el('div', { 'class': 'links' });
    (p.links || []).forEach(function (l) {
      var u = safeUrl(l.url);
      if (u) links.appendChild(el('a', { href: u, target: '_blank', rel: 'noopener noreferrer', text: l.label || u }));
    });
    if (links.children.length) content.appendChild(links);
    modal.hidden = false;
  }

  function closeModal() { modal.hidden = true; content.textContent = ''; }
  document.getElementById('close').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  function renderGrid(list, q) {
    var grid = document.getElementById('grid');
    grid.textContent = '';
    q = (q || '').toLowerCase();
    var shown = list.filter(function (p) {
      return !q || (p.title + ' ' + p.creator).toLowerCase().indexOf(q) !== -1;
    });
    if (!shown.length) grid.appendChild(el('p', { text: 'No heropacks found.' }));
    shown.forEach(function (p) { grid.appendChild(card(p)); });
  }

  function renderCarousel(list) {
    var featured = list.filter(function (p) { return p.featured !== false; });
    var section = document.getElementById('carousel').parentNode;
    if (!featured.length) { section.hidden = true; return; }
    var items = shuffle(featured);
    // Repeat so one half always overfills the viewport; duplicate for the seamless -50% loop.
    var half = items.slice();
    while (half.length < 6) half = half.concat(items);
    var track = document.getElementById('track');
    half.concat(half).forEach(function (p) { track.appendChild(card(p)); });
    track.style.setProperty('--dur', half.length * 5 + 's');
  }

  fetch('data/heropacks.json')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (list) {
      renderCarousel(list);
      renderGrid(list, '');
      document.getElementById('search').addEventListener('input', function (e) { renderGrid(list, e.target.value); });
    })
    .catch(function () {
      document.getElementById('grid').textContent = 'Could not load heropacks.';
    });
})();
