import './home.css';
import settings from '../settings.js';
import { assetUrl, serviceUrl, safeUrl } from '../utils/brand.js';
import { brandingBase } from '../utils/base-url.js';
import { localize, onReady } from '../utils/i18n-ready.js';
import { homeOf } from '../utils/defaults.js';
import { mountHero } from './hero-carousel.js';

// The home page (index.html only): hero search box and buttons, cards and partners from settings.home.
// Texts are i18n keys, so they go through data-i18n like the rest of the page.

const home = homeOf(settings);
const el = (tag, attrs = {}, children = []) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
  e.append(...children);
  return e;
};
const url = u => safeUrl(serviceUrl(settings, u));

// A plain GET form: no autocomplete, so it doesn't touch the header search (autocompleteHeader)
function mountSearch(form) {
  const search = (home.hero && home.hero.search) ?? {};
  if (!search) return;
  form.action = url(search.url || '{biocache}/occurrences/search');
  form.querySelector('input').name = search.param || 'q';
  form.hidden = false;
}

function mountButtons(box) {
  for (const b of (home.hero && home.hero.buttons) || []) {
    box.append(el('a', { class: `la-btn la-btn--${b.style || 'primary'}`, href: url(b.url), 'data-i18n': b.i18n }));
  }
}

function mountCards(box) {
  for (const c of home.cards || []) {
    box.append(el('a', { class: 'la-card', href: url(c.url) }, [
      c.image ? el('div', { class: 'la-card__img' }, [el('img', { src: assetUrl(brandingBase, c.image), alt: '', loading: 'lazy' })]) : '',
      el('div', { class: 'la-card__body' }, [
        el('h3', { 'data-i18n': `${c.i18n}.title` }),
        el('p', { 'data-i18n': `${c.i18n}.text` }),
        el('span', { class: 'la-card__link', 'data-i18n': `${c.i18n}.link` })
      ])
    ]));
  }
}

function mountPartners(box) {
  const partners = home.partners || [];
  if (!partners.length) {
    box.closest('.la-partners').hidden = true;
    return;
  }
  for (const p of partners) {
    const img = el('img', { src: assetUrl(brandingBase, p.logo), alt: p.name, loading: 'lazy' });
    box.append(p.url ? el('a', { href: safeUrl(p.url), title: p.name, rel: 'noopener' }, [img]) : img);
  }
}

onReady(() => {
  const hero = document.getElementById('la-hero');
  if (!hero) return;
  mountHero(hero, home.hero, brandingBase);
  const parts = [
    [hero.querySelector('.la-hero__search'), mountSearch],
    [hero.querySelector('.la-hero__buttons'), mountButtons],
    [document.getElementById('la-home-cards'), mountCards],
    [document.getElementById('la-home-partners'), mountPartners]
  ];
  for (const [box, mount] of parts) {
    if (!box) continue;
    mount(box);
    localize(box);
  }
});
