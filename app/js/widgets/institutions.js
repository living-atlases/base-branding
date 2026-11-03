import settings from '../settings';
import { assetUrl, safeUrl } from '../utils/brand.js';
import { brandingBase } from '../utils/base-url.js';
import { localize } from '../utils/i18n-ready.js';
import { biocache, collectory, getJSON } from './charts.js';

// Institutions as cards that open to list their collections, and under each collection its data
// resources. With settings.dataHub only the hub's members are listed; without it, every
// institution of the portal. Collections are fetched when a card is opened, not up front.
// Names come from the collectory, so they are only ever written with textContent.

const dh = settings.dataHub;
const exclude = new Set(settings.institutionsExclude || []);
const byName = (a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' });

const el = (tag, attrs = {}, text) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
};
const recordsLink = (field, uid, name) =>
  el('a', { href: `${biocache}/occurrences/search?q=${field}%3A${encodeURIComponent(uid)}#tab_mapView` }, name);

// Institutions of settings.dataHubToFlag, which get the settings.flagBadge badge
const flagged = () => (settings.dataHubToFlag
  ? getJSON(`${collectory}/ws/dataHub/${encodeURIComponent(settings.dataHubToFlag)}`)
    .then(d => new Set((d.memberInstitutions || []).map(i => i.uid)))
    .catch(() => new Set())
  : Promise.resolve(new Set()));

const members = () => (dh
  ? getJSON(`${collectory}/ws/dataHub/${encodeURIComponent(dh)}`).then(d => ({
    institutions: d.memberInstitutions || [],
    collections: new Set((d.memberCollections || []).map(c => c.uid)),
    resources: new Set((d.memberDataResources || []).map(r => r.uid))
  }))
  : getJSON(`${collectory}/ws/institution`).then(list => ({ institutions: list || [] })));

function badge() {
  const b = settings.flagBadge || {};
  const img = el('img', { src: assetUrl(brandingBase, b.image || 'images/flag.png'), alt: b.title || '', title: b.title || '' });
  img.className = 'la-entity__badge';
  if (!b.url) return img;
  const a = el('a', { href: safeUrl(b.url), rel: 'noopener', target: '_blank' });
  a.append(img);
  return a;
}

function fillCollections(body, uid, m) {
  body.textContent = '…';
  return getJSON(`${collectory}/ws/institution/${encodeURIComponent(uid)}`).then(inst => {
    const cols = (inst.collections || []).filter(c => !m.collections || m.collections.has(c.uid)).sort(byName);
    body.replaceChildren();
    if (!cols.length) {
      body.append(el('p', { 'data-i18n': 'index.institutions.none' }));
      localize(body);
      return;
    }
    const ul = el('ul', { class: 'la-entity__collections' });
    for (const c of cols) {
      const li = el('li');
      li.append(recordsLink('collection_uid', c.uid, c.name));
      ul.append(li);
      getJSON(`${collectory}/ws/collection/${encodeURIComponent(c.uid)}`).then(col => {
        const drs = (col.linkedRecordProviders || []).filter(r => !m.resources || m.resources.has(r.uid)).sort(byName);
        if (!drs.length) return;
        const sub = el('ul', { class: 'la-entity__resources' });
        for (const r of drs) {
          const rli = el('li');
          rli.append(recordsLink('data_resource_uid', r.uid, r.name));
          sub.append(rli);
        }
        li.append(sub);
      }).catch(err => console.error(err));
    }
    body.append(ul);
  }).catch(err => {
    body.textContent = '';
    console.error(err);
  });
}

export function mountInstitutions(box) {
  return Promise.all([members(), flagged()]).then(([m, flags]) => {
    const list = m.institutions.filter(i => !exclude.has(i.uid)).sort(byName);
    if (!list.length) return false;
    box.replaceChildren(el('h2', { 'data-i18n': 'index.stats.institutions' }));
    const grid = el('div', { class: 'la-entities' });
    for (const inst of list) {
      const card = el('details', { class: 'la-entity' });
      const summary = el('summary');
      summary.append(el('span', { class: 'la-entity__name' }, inst.name));
      if (flags.has(inst.uid)) summary.append(badge());
      const body = el('div', { class: 'la-entity__body' });
      card.append(summary, body);
      card.addEventListener('toggle', () => {
        if (card.open && !card.dataset.loaded) {
          card.dataset.loaded = '1';
          fillCollections(body, inst.uid, m);
        }
      });
      grid.append(card);
    }
    box.append(grid);
    localize(box);
    return true;
  });
}
