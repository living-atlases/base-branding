// A crafted ?lang= must not reach the locales request, the i18next cookie or the DOM.
// i18next keeps the raw detected code in i18n.language even when it is not in
// supportedLngs, so the banner has to read i18n.resolvedLanguage instead.
//
// Served through page.route over the same CAS login replica as cas-login.spec.js, so the
// banner's jQuery fallback applies.
// Run after `npm run build`.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import settings from '../../app/js/settings.js';

const root = path.resolve(import.meta.dirname, '../..');
const dist = path.join(root, 'dist');
const CAS = 'https://auth.cas.test';
const ENABLED = settings.enabledLangs;

const types = {
  '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2'
};
const contentType = file => types[path.extname(file)] || 'application/json';

function readDist(file) {
  const p = path.join(dist, file);
  if (!fs.existsSync(p)) throw new Error(`${p} not found: run npm run build before the e2e tests`);
  return fs.readFileSync(p, 'utf8');
}

function brandingBase(banner) {
  const m = banner.match(/src="(https?:\/\/[^"]+?)\/js\/init\.js/);
  if (!m) throw new Error('dist/banner.html does not load js/init.js');
  return m[1];
}

async function openCasLoginWithLang(page, lang) {
  const banner = readDist('banner.html');
  const base = brandingBase(banner);
  const html = fs.readFileSync(path.join(import.meta.dirname, 'fixtures/cas-login.html'), 'utf8')
    .replace('<!--ALA_BANNER-->', banner)
    .replace('<!--ALA_FOOTER-->', readDist('footer.html'))
    .replaceAll('HEADER_FOOTER_URL', base);

  const requested = [];
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    // Paths only: the browser normalises ../ away before sending, so a crafted lang shows
    // up as the junk path segment it became.
    requested.push(url.pathname);
    const href = url.origin + url.pathname;
    if (href === `${CAS}/cas/login`) {
      return route.fulfill({ contentType: 'text/html', body: html });
    }
    if (url.origin === CAS) {
      if (url.pathname.startsWith('/cas/webjars.')) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ contentType: contentType(url.pathname), body: '' });
    }
    if (href.startsWith(base + '/')) {
      const file = path.join(dist, decodeURIComponent(href.slice(base.length)));
      if (file.startsWith(dist) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        return route.fulfill({ contentType: contentType(file), body: fs.readFileSync(file) });
      }
      return route.fulfill({ status: 404, body: '' });
    }
    return route.abort();
  });

  await page.goto(`${CAS}/cas/login?lang=${lang}`);
  await page.waitForLoadState('load');
  await page.waitForFunction(() => window.i18next && window.i18next.resolvedLanguage, null, { timeout: 10000 });
  return requested;
}

// The i18next cookie itself cannot be asserted here: it is written on settings.mainDomain,
// which this fixture host is not, so the browser drops it. What it must never hold is the raw value.
// With more than one language the banner renders #dropdown-lang (scripts/branding.mjs) and its
// .html() sink is live: the toggle must never show anything but a supported code. With one, there
// is no menu at all.
const MULTI = ENABLED.length > 1;
const dropdownLang = page =>
  page.locator('#dropdown-lang .dropdown-toggle').evaluate(e => e.textContent.trim());

// The language segment of every /locales/<lng>/<ns> request the page made.
const requestedLocales = requested => requested
  .filter(r => r.includes('/locales/'))
  .map(r => r.split('/locales/')[1].split('/')[0]);

test('a crafted ?lang= never becomes the language of a locales request', async ({ page }) => {
  const requested = await openCasLoginWithLang(page, '../../../evil');

  const requestedLangs = requestedLocales(requested);
  expect(requestedLangs.length).toBeGreaterThan(0);
  for (const lang of requestedLangs) expect(ENABLED).toContain(lang);
  expect(ENABLED).toContain(await page.evaluate(() => window.i18next.resolvedLanguage));
  if (MULTI) expect(ENABLED).toContain(await dropdownLang(page));
  expect(await page.evaluate(() => document.body.innerHTML)).not.toContain('evil');
  expect(await page.evaluate(() => document.cookie)).not.toContain('evil');
});

// The locales go out without cache headers: without a per-build ?v= a browser keeps the texts
// of an older branding (keys shown raw, buttons without a label) long after a deploy
test('the locales are requested with the version of this build', async ({ page }) => {
  const urls = [];
  page.on('request', r => { if (r.url().includes('/locales/')) urls.push(new URL(r.url())); });
  await openCasLoginWithLang(page, ENABLED[0]);
  expect(urls.length).toBeGreaterThan(0);
  const init = readDist('banner.html').match(/js\/init\.js\?v=(\d+)/);
  for (const u of urls) {
    expect(u.searchParams.get('v'), `${u.pathname} has no ?v=`).toMatch(/^\d{13}$/);
    expect(u.searchParams.get('v')).not.toBe('$_BUILD_ID');
  }
  expect(init, 'banner.html loads js/init.js?v=').toBeTruthy();
});

test('markup in ?lang= is not injected into the page', async ({ page }) => {
  await openCasLoginWithLang(page, encodeURIComponent('<img src=x onerror=window.__xss=1>'));

  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  expect(await page.evaluate(() => document.body.innerHTML)).not.toContain('onerror');
  if (MULTI) expect(await page.locator('#dropdown-lang').evaluate(e => e.querySelectorAll('img').length)).toBe(0);
  expect(ENABLED).toContain(await page.evaluate(() => window.i18next.resolvedLanguage));
});

test('a supported ?lang= still resolves', async ({ page }) => {
  await openCasLoginWithLang(page, ENABLED[0]);

  expect(await page.evaluate(() => window.i18next.resolvedLanguage)).toBe(ENABLED[0]);
  if (MULTI) expect(await dropdownLang(page)).toBe(ENABLED[0]);
});

test('the language menu lists the enabled languages, and is not there with only one', async ({ page }) => {
  await openCasLoginWithLang(page, ENABLED[0]);

  const listed = await page.locator('#dropdown-lang .locale-link').evaluateAll(ls => ls.map(l => l.dataset.locale));
  expect(listed).toEqual(MULTI ? ENABLED : []);
});
