/* OutVenture Media site script: tracking, navigation, hero, media, forms. No dependencies. */
(function () {
  'use strict';
  var OV = window.OV || {};
  var ROOT = document.documentElement.getAttribute('data-root') || '/';
  var IDX = OV.preview ? 'index.html' : '';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.dataLayer = window.dataLayer || [];

  /* ---------- Tracking: one call for every event ---------- */
  function track(event, params) {
    params = params || {};
    var payload = { event: event };
    for (var k in params) payload[k] = params[k];
    window.dataLayer.push(payload);
    if (!OV.gtm) {
      if (typeof window.gtag === 'function') window.gtag('event', event, params);
      if (typeof window.fbq === 'function' && event === 'generate_lead') window.fbq('track', 'Lead', { content_name: params.form_name });
    }
  }
  window.ovTrack = track;
  var ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid'];
  function store(key, val) { try { if (val === undefined) return window.sessionStorage.getItem(key); window.sessionStorage.setItem(key, val); } catch (e) { return null; } }
  (function () {
    var q = new URLSearchParams(window.location.search), found = {};
    ATTR_KEYS.forEach(function (k) { if (q.get(k)) found[k] = q.get(k); });
    if (Object.keys(found).length && !store('ov_attr')) store('ov_attr', JSON.stringify(found));
    if (!store('ov_landing')) { store('ov_landing', window.location.pathname); store('ov_referrer', document.referrer || 'direct'); }
  })();
  function attribution() {
    var out = {};
    try { var a = JSON.parse(store('ov_attr') || '{}'); for (var k in a) out[k] = a[k]; } catch (e) {}
    out.landing_page = store('ov_landing') || ''; out.referrer = store('ov_referrer') || ''; out.submitted_from = window.location.pathname;
    return out;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a,button'); if (!a) return;
    var href = a.getAttribute('href') || '';
    if (a.hasAttribute('data-cta')) track('cta_click', { cta_text: a.textContent.trim().slice(0, 80), cta_location: a.getAttribute('data-cta'), link_url: href });
    if (href.indexOf('mailto:') === 0) track('click_email', { link_url: href.replace('mailto:', '') });
    else if (href.indexOf('tel:') === 0) track('click_phone', { link_url: href.replace('tel:', '') });
    else if (a.hasAttribute('data-social')) track('click_social', { network: a.getAttribute('data-social'), link_url: href });
    else if (a.classList.contains('tile')) track('portfolio_open', { project: a.getAttribute('href') });
    else if (a.classList.contains('reel')) track('reel_open', { link_url: href });
  });

  /* ---------- Navigation ---------- */
  var toggle = document.querySelector('.menu-toggle'), nav = document.getElementById('site-nav'), header = document.querySelector('.site-header');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); toggle.textContent = open ? 'Close' : 'Menu';
      if (header) header.classList.toggle('menu-open', open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; toggle.focus(); }
    });
  }

  /* ---------- Hero: the line draws over the film, then the words come in ---------- */
  var heroLine = document.querySelector('.hero-line'), heroCopy = document.getElementById('hero-copy');
  if (heroLine && heroCopy) {
    var start = function () {
      if (reduce) { heroCopy.classList.add('is-in'); return; }
      heroLine.classList.add('is-drawing');
      setTimeout(function () { heroCopy.classList.add('is-in'); }, 900);
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
    var heroVideo = document.querySelector('.hero-film video');
    if (heroVideo) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) heroVideo.play().catch(function () {}); else heroVideo.pause(); }); }, { threshold: 0.1 });
      io.observe(heroVideo);
    }
  }

  /* ---------- Reel scrollers: play in view, pause out of view, arrow buttons ---------- */
  var reelVideos = [].slice.call(document.querySelectorAll('.reel video'));
  if (reelVideos.length && 'IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { var v = en.target; if (en.isIntersecting && !reduce) { v.play().catch(function () {}); } else { v.pause(); } });
    }, { threshold: 0.6 });
    reelVideos.forEach(function (v) { rio.observe(v); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-scroll]'); if (!b) return;
    var el = document.getElementById(b.getAttribute('data-scroll')); if (!el) return;
    el.scrollBy({ left: (el.clientWidth * 0.8) * parseInt(b.getAttribute('data-dir'), 10), behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- Film embeds: click to load ---------- */
  function embedUrl(url) {
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
    if (m) return 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0&modestbranding=1';
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&dnt=1';
    return url;
  }
  document.addEventListener('click', function (e) {
    var p = e.target.closest('.film .play'); if (!p) return;
    var fig = p.closest('.film'), url = fig.getAttribute('data-film');
    var f = document.createElement('iframe');
    f.src = embedUrl(url); f.allow = 'autoplay; fullscreen; picture-in-picture'; f.setAttribute('allowfullscreen', ''); f.title = p.getAttribute('aria-label') || 'Film';
    fig.appendChild(f); p.remove();
    track('film_play', { film_url: url });
  });

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img'), last = null;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-lightbox]');
      if (a) { e.preventDefault(); lbImg.src = a.getAttribute('href'); lbImg.alt = a.querySelector('img').alt; lb.classList.add('is-open'); last = a; lb.querySelector('button').focus(); }
      if (e.target.closest('[data-close]') || e.target === lb) { lb.classList.remove('is-open'); lbImg.src = ''; if (last) last.focus(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('is-open')) { lb.classList.remove('is-open'); if (last) last.focus(); } });
  }

  /* ---------- Portfolio filters (shown once there are enough projects) ---------- */
  var filters = document.querySelector('.filters');
  if (filters) {
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-filter]'); if (!b) return;
      var f = b.getAttribute('data-filter');
      [].forEach.call(filters.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      [].forEach.call(document.querySelectorAll('#portfolio-grid .tile'), function (t) { t.hidden = f !== '' && (t.getAttribute('data-type') || '').indexOf(f) === -1; });
      track('portfolio_filter', { filter: f || 'all' });
    });
  }

  /* ---------- Pricing toggle ---------- */
  var billing = document.querySelector('.billing');
  if (billing) {
    billing.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-plan]'); if (!b) return;
      var plan = b.getAttribute('data-plan');
      [].forEach.call(billing.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      [].forEach.call(document.querySelectorAll('[data-price-' + plan + ']'), function (el) { el.textContent = el.getAttribute('data-price-' + plan); });
      [].forEach.call(document.querySelectorAll('[data-per-' + plan + ']'), function (el) { el.textContent = el.getAttribute('data-per-' + plan); });
      track('pricing_toggle', { billing: plan });
    });
  }

  /* ---------- Inquiry form: one path, preselected from the page the visitor came from ---------- */
  var form = document.getElementById('inquiry-form');
  if (form) {
    var q = new URLSearchParams(window.location.search);
    var svc = q.get('service'), pkg = q.get('package');
    var map = { 'half-day-shoot': 'half-day-shoot', 'single-day-shoot': 'single-day-shoot', 'multi-day-production': 'multi-day-production', management: 'social-media-management', influencer: 'influencer-management' };
    if (svc && map[svc]) { var box = form.querySelector('input[name="services"][data-slug="' + map[svc] + '"]'); if (box) box.checked = true; }
    if (pkg) form.querySelector('#f-package').value = pkg;
    if (svc === 'management') { var sb = document.getElementById('f-submit'); if (sb) sb.textContent = 'Apply for services'; }
    var started = false;
    form.addEventListener('input', function () { if (!started) { started = true; track('form_start', { form_name: 'inquiry' }); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = form.querySelector('.form-error'), ok = true;
      [].forEach.call(form.querySelectorAll('[required]'), function (f) {
        var bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
        f.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) { err.textContent = 'Fill in the highlighted fields so we can reply.'; return; }
      err.textContent = '';
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = data[k] ? data[k] + ', ' + v : v; });
      var attr = attribution(); for (var k in attr) data['source_' + k] = attr[k];
      data._subject = 'New inquiry: ' + data.name + ' at ' + data.business;
      data._replyto = data.email;
      var btn = form.querySelector('[type="submit"]'); btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending';
      var done = function () {
        track('generate_lead', { form_name: 'inquiry', services: data.services || 'not chosen', timing: data.timing || '' });
        store('ov_lead_name', (data.name || '').split(' ')[0]);
        window.location.href = ROOT + 'thanks/' + IDX + '?form=inquiry';
      };
      if (OV.preview) { done(); return; }
      fetch(OV.formspree, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); done(); })
        .catch(function () { err.textContent = 'Your inquiry did not send. Check your connection and try again, or email ' + OV.email + '.'; btn.disabled = false; btn.textContent = btn.dataset.label; track('form_error', { form_name: 'inquiry' }); });
    });
  }
  var hello = document.getElementById('thanks-name');
  if (hello) { var n = store('ov_lead_name'); if (n) hello.textContent = ', ' + n; }
})();

/* Homepage hero zipline: a guest pushes off the ridge, rides the cable down (it dips under their weight),
   brakes, swings to a stop on pendulum physics, waves, then rides again while the hero is in view */
(function () {
  'use strict';
  var hero = document.querySelector('.hero-film'), svg = hero && hero.querySelector('.zip'), rider = hero && hero.querySelector('.zip-rider');
  if (!svg || !rider || !svg.getScreenCTM) return;
  var cable = svg.querySelector('.zip-cable'), trail = svg.querySelector('.zip-trail'), glow = svg.querySelector('#zip-glow'), swing = rider.querySelector('.zr-swing');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var A = { x: 985, y: -18 }, B = { x: 1560, y: 42 }, SAG = 14, DIP = 16;
  var visible = true, ready = false, timer = null, raf = null;

  /* cable shape: unloaded it hangs in a gentle curve; loaded it bends to a point under the rider */
  var START = 0.035, END = 0.955;   /* launch just clear of the start pole */   /* the rider stops just short of the platform pole */
  function loadPoint(s, extra) {
    return { x: A.x + (B.x - A.x) * s, y: A.y + (B.y - A.y) * s + (2 * SAG + 4 * DIP) * s * (1 - s) + (extra || 0) * 4 * s * (1 - s) };
  }
  function drawCable(s, loaded, wobble, extra) {
    if (!loaded) {
      cable.setAttribute('d', 'M' + A.x + ' ' + A.y + ' Q' + (A.x + B.x) / 2 + ' ' + ((A.y + B.y) / 2 + 2 * SAG + wobble) + ' ' + B.x + ' ' + B.y);
      return;
    }
    var P = loadPoint(s, extra);
    var c1 = { x: (A.x + P.x) / 2, y: (A.y + P.y) / 2 + 2 * SAG * s * s }, c2 = { x: (P.x + B.x) / 2, y: (P.y + B.y) / 2 + 2 * SAG * (1 - s) * (1 - s) };
    cable.setAttribute('d', 'M' + A.x + ' ' + A.y + ' Q' + c1.x + ' ' + c1.y + ' ' + P.x + ' ' + P.y + ' Q' + c2.x + ' ' + c2.y + ' ' + B.x + ' ' + B.y);
  }
  /* gold streak along the cable behind the rider, brightest at the trolley */
  function drawTrail(s, loaded) {
    if (!loaded || s <= 0.01) { trail.classList.remove('is-on'); return; }
    var P = loadPoint(s), f = Math.max(0, (s - 0.22) / s), T = { x: A.x + (P.x - A.x) * f, y: A.y + (P.y - A.y) * f };
    trail.setAttribute('d', 'M' + T.x + ' ' + T.y + ' L' + P.x + ' ' + P.y);
    glow.setAttribute('x1', T.x); glow.setAttribute('y1', T.y); glow.setAttribute('x2', P.x); glow.setAttribute('y2', P.y);
    trail.classList.add('is-on');
  }
  function toHero(p) {
    var m = svg.getScreenCTM(), r = hero.getBoundingClientRect();
    if (!m) return { x: 0, y: 0 };
    return { x: p.x * m.a + p.y * m.c + m.e - r.left, y: p.x * m.b + p.y * m.d + m.f - r.top };
  }
  function place(pt, theta) {
    rider.style.transform = 'translate(' + (pt.x - rider.offsetWidth / 2) + 'px,' + (pt.y - 1) + 'px)';
    swing.style.transform = 'rotate(' + (theta * 57.2958).toFixed(2) + 'deg)';
  }
  /* gravity on the way down, then a springy brake at the platform */
  function progress(u) {
    if (u < 0.82) return 0.9 * Math.pow(u / 0.82, 1.8);
    var k = (u - 0.82) / 0.18, c = 1.70158;
    return 0.9 + 0.1 * (1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2));
  }

  function ride() {
    var PREP = 450, DUR = 4200, SETTLE = 2400;
    var t0 = null, last = null, x1 = null, v1 = 0, th = 0, om = 0, s = 0;
    rider.classList.add('is-on');
    function frame(now) {
      if (t0 === null) { t0 = now; last = now; }
      var t = now - t0, dt = Math.min(0.05, (now - last) / 1000) || 0.016, loaded = true, wob = 0;
      last = now;
      if (t < PREP) {                                   /* little push back before launch */
        s = START - 0.012 * Math.sin(Math.PI * t / PREP);
      } else if (t < PREP + DUR) {
        if (!rider.classList.contains('is-riding')) rider.classList.add('is-riding');
        s = START + (END - START) * progress((t - PREP) / DUR);
      } else if (t < PREP + DUR + SETTLE) {
        s = END;
        var k = (t - PREP - DUR) / 1000;
        wob = 22 * Math.exp(-2.6 * k) * Math.sin(14 * k);
        rider.classList.remove('is-riding');
        rider.classList.toggle('is-waving', k > 0.35 && k < 1.8);
      } else {
        rider.classList.remove('is-on', 'is-waving');
        drawCable(0, false, 0);
        raf = null;
        timer = setTimeout(function () { timer = null; if (visible) ride(); }, 8000);
        return;
      }
      drawCable(Math.max(0, s), loaded, 0, wob);
      var pt = toHero(loadPoint(Math.max(0, Math.min(1, s)), wob));
      /* pendulum: body lags behind the trolley's acceleration and swings itself out */
      var v = x1 === null ? 0 : (pt.x - x1) / dt, ax = (v - v1) / dt;
      x1 = pt.x; v1 = v;
      om += (-36 * th - 0.022 * Math.max(-2500, Math.min(2500, ax)) - 1.5 * om) * dt;
      th = Math.max(-0.8, Math.min(0.8, th + om * dt));
      place(pt, th);
      drawTrail(Math.max(0, Math.min(1, s)), rider.classList.contains('is-riding'));
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    svg.classList.add('is-in');
    ready = true;
    drawCable(0, false, 0);
    if (reduce) {
      rider.classList.add('is-on'); drawCable(END, true, 0, 0); place(toHero(loadPoint(END)), 0);
      window.addEventListener('resize', function () { place(toHero(loadPoint(END)), 0); });
      return;
    }
    drawCable(START, true, 0, 0); place(toHero(loadPoint(START)), 0);
    timer = setTimeout(function () { timer = null; ride(); }, 500);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && ready && !reduce && !timer && !raf) timer = setTimeout(function () { timer = null; ride(); }, 600);
    }, { threshold: 0.2 }).observe(hero);
  }
  /* wait for the ridgeline to finish drawing before the cable appears */
  setTimeout(start, reduce ? 0 : 2600);
})();
