import i18n from 'i18next';
import { assetUrl, safeUrl } from '../utils/brand.js';
import { whenI18n } from '../utils/i18n-ready.js';

// Hero of the home: full-bleed images (settings.home.hero.slides) under a dark veil, with the
// credits of the current one behind the (i) button. Credits come from settings and the API, so
// they are only ever written with textContent. Only the first image loads with the page; the
// next one is fetched once the page has loaded, while the current one shows. No autoplay with prefers-reduced-motion.

const creditFields = ['species', 'institution', 'author'];

function renderCredit(box, slide) {
  box.replaceChildren();
  const parts = [];
  for (const f of creditFields) {
    if (!slide[f]) continue;
    const el = document.createElement(f === 'species' ? 'em' : 'span');
    el.textContent = f === 'author' ? `${i18n.t('index.credit.author')} ${slide.author}` : slide[f];
    parts.push(el);
  }
  if (slide.license) {
    const el = document.createElement(slide.licenseUrl ? 'a' : 'span');
    el.textContent = slide.license;
    if (slide.licenseUrl) {
      el.href = safeUrl(slide.licenseUrl);
      el.rel = 'license noopener';
    }
    parts.push(el);
  }
  if (slide.recordUrl) {
    const el = document.createElement('a');
    el.href = safeUrl(slide.recordUrl);
    el.textContent = i18n.t('index.credit.record');
    parts.push(el);
  }
  parts.forEach((el, i) => {
    if (i) box.append(' · ');
    box.append(el);
  });
  return parts.length > 0;
}

// The renditions of a slide: image alone, or an image with {w} in it and the widths it comes in
// (ratio: width / height), and the same again for an optional narrow cut for phones (slide.narrow)
const renditions = s => [s, s.narrow].filter(Boolean).flatMap(r => (Array.isArray(r.widths) && /\{w\}/.test(r.image)
  ? r.widths.map(w => ({ src: r.image.replace('{w}', w), w, h: w / (r.ratio || 2.4) }))
  : [{ src: r.image, w: 0, h: 0 }]));

// The smallest rendition that covers the hero box (in device px) without upscaling, or else the
// one that upscales least: a phone gets the narrow cut, a retina desktop the widest one
export function pickRendition(slide, boxW, boxH) {
  const sized = renditions(slide).filter(r => r.w);
  if (!sized.length) return slide.image;
  if (!boxW || !boxH) return sized[0].src; // a hero with no size yet: its smallest image
  const scale = r => Math.max(boxW / r.w, boxH / r.h);
  const covering = sized.filter(r => scale(r) <= 1).sort((a, b) => a.w * a.h - b.w * b.h);
  return (covering[0] || sized.sort((a, b) => scale(a) - scale(b))[0]).src;
}

export function mountHero(hero, { slides = [], interval = 7000 } = {}, base) {
  const holder = hero.querySelector('.la-hero__slides');
  const dots = hero.querySelector('.la-hero__dots');
  const credit = hero.querySelector('.la-credit');
  const creditBox = hero.querySelector('.la-credit__txt');
  const creditBtn = hero.querySelector('.la-credit__i');
  if (!holder || !slides.length) {
    if (credit) credit.hidden = true;
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const box = hero.getBoundingClientRect();
  const els = slides.map((s, i) => {
    const el = document.createElement('div');
    el.className = 'la-hero__slide';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-roledescription', 'slide');
    el.dataset.src = assetUrl(base, pickRendition(s, box.width * dpr, box.height * dpr));
    // A CSS value from settings: only keywords, numbers and percentages
    if (/^[\w\s.%-]+$/.test(s.position || '')) el.style.backgroundPosition = s.position;
    if (i > 0) el.setAttribute('aria-hidden', 'true');
    holder.append(el);
    return el;
  });
  const load = i => {
    const el = els[i];
    if (el && el.dataset.src) {
      el.style.backgroundImage = `url("${el.dataset.src.replace(/["\\]/g, '\\$&')}")`;
      delete el.dataset.src;
    }
  };

  let current = 0;
  const dotEls = slides.length > 1 ? slides.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'la-hero__dot';
    b.addEventListener('click', () => { show(i); stop(); });
    dots.append(b);
    return b;
  }) : [];

  const showCredit = () => {
    const has = renderCredit(creditBox, slides[current]);
    credit.hidden = !has;
  };

  function show(i) {
    load(i);
    els[current].classList.remove('is-active');
    els[current].setAttribute('aria-hidden', 'true');
    current = i;
    els[i].classList.add('is-active');
    els[i].removeAttribute('aria-hidden');
    dotEls.forEach((d, j) => d.setAttribute('aria-current', j === i ? 'true' : 'false'));
    if (i18n.isInitialized) showCredit();
    if (document.readyState === 'complete') preloadNext();
  }
  // The next image, so it is there when its turn comes; never before the page has loaded, so it
  // doesn't compete with the first one
  function preloadNext() { load((current + 1) % els.length); }
  window.addEventListener('load', preloadNext, { once: true });

  creditBtn.addEventListener('click', () => {
    const open = creditBox.hidden;
    creditBox.hidden = !open;
    creditBtn.setAttribute('aria-expanded', String(open));
  });

  let timer = null;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = () => {
    if (reduced || els.length < 2 || timer) return;
    timer = setInterval(() => show((current + 1) % els.length), Math.max(3000, interval));
  };
  const stop = () => { clearInterval(timer); timer = null; };
  // Paused under a mouse and while focus is inside (the search box); a touch is no hover, or a tap
  // would stop it for good
  hero.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') stop(); });
  hero.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !hero.contains(document.activeElement)) start(); });
  hero.addEventListener('focusin', stop);
  hero.addEventListener('focusout', e => { if (!hero.contains(e.relatedTarget) && !hero.matches(':hover')) start(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  load(0);
  show(0);
  start();
  hero.classList.add('is-ready');

  whenI18n(() => {
    showCredit();
    dotEls.forEach((d, i) => d.setAttribute('aria-label', `${i18n.t('index.slide')} ${i + 1}`));
  });
}
