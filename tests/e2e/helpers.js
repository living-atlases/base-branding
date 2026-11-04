// Shared by the home and Bootstrap 5 specs (and scripts/screenshots.mjs): serve the built dist/
// through page.route under the base URL baked into it, so the pages load as in production.
import fs from 'node:fs';
import path from 'node:path';
import settings from '../../app/js/settings.js';

export const root = path.resolve(import.meta.dirname, '../..');
export const dist = path.join(root, 'dist');

const types = {
  '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.mustache': 'text/html'
};
export const contentType = file => types[path.extname(file)] || 'application/json';

export function readDist(file) {
  const p = path.join(dist, file);
  if (!fs.existsSync(p)) throw new Error(`${p} not found: run npm run build before the e2e tests`);
  return fs.readFileSync(p, 'utf8');
}

// The skin base URL is whatever the build baked into banner.html (BASE_BRANDING_URL).
export function brandingBase() {
  const m = readDist('banner.html').match(/src="(https?:\/\/[^"]+?)\/js\/init\.js/);
  if (!m) throw new Error('dist/banner.html does not load js/init.js');
  return m[1];
}

// $.getJSON and fetch read these cross-origin, so they need the CORS header to reach the page.
export const json = body => ({
  contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*' },
  body: JSON.stringify(body)
});

// A file of dist/ for a request under base, or null. CORS on, as the branding server must send
// it for the fonts (README, "Fonts").
export function distFile(href, base) {
  if (!href.startsWith(base + '/')) return null;
  let rel = decodeURIComponent(href.slice(base.length));
  if (rel === '/') rel = '/index.html';
  const file = path.join(dist, rel);
  if (!file.startsWith(dist) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return { status: 404, body: '' };
  }
  return {
    contentType: contentType(file),
    headers: { 'access-control-allow-origin': '*' },
    body: fs.readFileSync(file)
  };
}

// Sample answers of the biocache and collectory services for the home widgets
export const KINGDOMS = [
  { label: 'Plantae', count: 9000 },
  { label: 'Animalia', count: 5200 },
  { label: 'Fungi', count: 1200 },
  { label: 'Chromista', count: 300 }
];
// Ten, so the drilled pie uses the whole colour ramp. The last one dwarfs the rest, as the real
// nameless buckets do.
export const PHYLA = [
  { label: 'Tracheophyta', count: 800 }, { label: 'Bryophyta', count: 700 },
  { label: 'Rhodophyta', count: 600 }, { label: 'Marchantiophyta', count: 500 },
  { label: 'Chlorophyta', count: 400 }, { label: 'Charophyta', count: 300 },
  { label: 'Anthocerotophyta', count: 200 }, { label: 'Glaucophyta', count: 100 },
  { label: 'Prasinodermophyta', count: 50 }, { label: '', count: 9000 }
];
export const INSTITUTIONS = [
  { label: 'Wakanda Natural History Museum', fq: 'institution_uid:in1', count: 5000 },
  { label: 'Royal Botanic Garden of Wakanda', fq: 'institution_uid:in2', count: 2500 },
  { label: 'University of Birnin Zana', fq: 'institution_uid:in3', count: 1200 }
];

const institutionList = () =>
  Array.from({ length: 30 }, (_, i) => ({ uid: `in${i + 1}`, name: `Institution ${String(i + 1).padStart(2, '0')}` }));

// Stubs of the services the widgets call, or null for any other request
export function serviceStub(url, { kingdoms = KINGDOMS, institutions = INSTITUTIONS } = {}) {
  if (url.pathname.endsWith('/breakdown.json')) {
    // The drilled call carries name=<the clicked level>; the first one does not.
    return json({ taxa: url.searchParams.get('name') ? PHYLA : kingdoms });
  }
  // The big numbers (stats widget) of a build without settings.isDevel, which mocks them
  if (url.pathname.endsWith('/occurrences/search')) return json({ totalRecords: 86965283 });
  if (url.pathname.endsWith('/occurrence/facets')) return json([{ fieldResult: institutions }]);
  // The collectory list of institutions: more than the institutions widget shows at first
  if (url.pathname.endsWith('/ws/institution')) return json(institutionList());
  if (url.pathname.endsWith('/ws/dataResource/count') || url.pathname.endsWith('/ws/institution/count')) return json({ total: 30 });
  // A data hub (settings.dataHub): the same 30 institutions as members. The hub of
  // settings.dataHubToFlag has the first three.
  const hub = url.pathname.match(/\/ws\/dataHub\/([\w-]+)$/);
  if (hub) {
    const n = hub[1] === settings.dataHubToFlag ? 3 : 30;
    return json({ uid: hub[1], memberInstitutions: institutionList().slice(0, n), memberCollections: [], memberDataResources: [] });
  }
  return null;
}

// A page of an ala-bootstrap5 app: dist/bs5/*.mustache with their {{...}} placeholders filled in,
// assets.mustache in <head>, banner and footer around body
export function bs5Page(base, { loginStatus = 'signedOut', body = '' } = {}) {
  const vars = {
    headerFooterServer: `${base}/bs5`, containerClass: 'container', loginStatus,
    loginURL: '/login', logoutURL: '/logout', searchServer: 'https://species.example', searchPath: '/search'
  };
  const render = t => t.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">${render(readDist('bs5/assets.mustache'))}</head>
<body>${render(readDist('bs5/banner.mustache'))}
<main class="container py-4" id="main_content">${body}</main>
${render(readDist('bs5/footer.mustache'))}</body></html>`;
}

