// CAS login page replica: the real ala-cas-5 (CAS 6) HTML with dist/banner.html and
// dist/footer.html inlined, as AlaTemplateClient does server side. Everything is served
// through page.route, so the test is hermetic and reproduces production conditions:
// CAS 6 renders src="webjars.jquerymin.js" literally (404), so the page has no jQuery
// unless our banner brings it.
//
// Run after `npm run build`. CAS_LIVE=1 also checks the deployed https://auth.l-a.site.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const dist = path.join(root, 'dist');
const CAS = 'https://auth.cas.test';

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

// The skin base URL is whatever the build baked into banner.html (BASE_BRANDING_URL).
function brandingBase(banner) {
  const m = banner.match(/src="(https?:\/\/[^"]+?)\/js\/init\.js/);
  if (!m) throw new Error('dist/banner.html does not load js/init.js');
  return m[1];
}

// webjarKeys: 'missing' is CAS 6 today; 'fixed' is ala-cas-5 with the webjars.* keys restored,
// where CAS itself loads jQuery before the banner (the same as any ALA app page that already has jQuery).
async function openCasLogin(page, { webjarKeys = 'missing', lateBootstrap = false } = {}) {
  const banner = readDist('banner.html');
  const footer = readDist('footer.html');
  const base = brandingBase(banner);
  let html = fs.readFileSync(path.join(import.meta.dirname, 'fixtures/cas-login.html'), 'utf8')
    .replace('<!--ALA_BANNER-->', banner)
    .replace('<!--ALA_FOOTER-->', footer)
    .replaceAll('HEADER_FOOTER_URL', base);
  if (webjarKeys === 'fixed') {
    html = html.replace('src="webjars.jquerymin.js"', 'src="/cas/webjars/jquery/3.6.0/jquery.min.js"');
  }
  if (lateBootstrap) {
    // Like apps that load Bootstrap after the banner (footer/deferred assets): drop it from <head>.
    html = html.replace(`<script type="text/javascript" src="${base}/js/bootstrap.min.js"></script>`, '');
  }

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    const href = url.origin + url.pathname;
    if (href === `${CAS}/cas/login`) {
      return route.fulfill({ contentType: 'text/html', body: html });
    }
    if (href === `${CAS}/cas/webjars/jquery/3.6.0/jquery.min.js`) {
      // CAS's own jQuery, tagged so the test can tell it apart from the banner fallback,
      // plus a plugin that a second jQuery copy would wipe out.
      const body = readDist('js/jquery.min.js') + ';window.__casJQuery = jQuery; jQuery.fn.casPlugin = function () {};';
      return route.fulfill({ contentType: 'text/javascript', body });
    }
    if (url.origin === CAS) {
      // Literal message keys 404 as in production; other CAS assets (chosen, migrate, cas.js...)
      // are not under test, so they are served empty.
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

  await page.goto(`${CAS}/cas/login`);
  await settle(page);
  return errors;
}

// On a first visit i18next-config.js reloads once with ?lang=<lng> (to set the grails locale);
// wait for it so assertions don't race that navigation.
async function settle(page) {
  await page.waitForURL(/[?&]lang=/, { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('load');
}

const jqueryErrors = errors => errors.filter(e => /\$ is not defined|jQuery is not defined|requires jQuery/.test(e));

async function expectBrandingWorks(page) {
  await expect(page.locator('[data-i18n^="nav."]').first()).not.toBeEmpty();
  expect(await page.evaluate(() => typeof window.jQuery)).toBe('function');
  // Bootstrap dropdowns need jQuery + bootstrap.js (the CAS head copy fails without jQuery).
  // The language menu when the theme shows it (single-language hubs hide it), else any navbar menu.
  const dropdown = page.locator('#dropdown-lang:visible, .navbar .dropdown:visible').first();
  await dropdown.locator('.dropdown-toggle').first().click();
  await expect(dropdown).toHaveClass(/open/);
}

test('CAS 6 without webjars.* keys: the banner still gets jQuery, i18n and dropdowns', async ({ page }) => {
  const errors = await openCasLogin(page);
  await expectBrandingWorks(page);
  // The CAS inline scripts right after the banner ($("a[autoRedirectType=client]"), $("#fm1").submit)
  // run during parsing, so jQuery must already be there synchronously. The only error left is the
  // CAS <head> bootstrap.min.js, which runs before the banner can do anything (the fallback then
  // loads Bootstrap again); only the ala-cas-5 fix removes it.
  const headBootstrap = /^Bootstrap's JavaScript requires jQuery$/;
  expect(jqueryErrors(errors).filter(e => !headBootstrap.test(e))).toEqual([]);
});

test('CAS that already loads jQuery: the banner keeps that jQuery and its plugins', async ({ page }) => {
  const errors = await openCasLogin(page, { webjarKeys: 'fixed' });
  await expectBrandingWorks(page);
  expect(await page.evaluate(() => window.jQuery === window.__casJQuery)).toBe(true);
  expect(await page.evaluate(() => typeof window.jQuery.fn.casPlugin)).toBe('function');
  expect(jqueryErrors(errors)).toEqual([]);
});

test('page with jQuery but Bootstrap loaded after the banner: the fallback loads nothing', async ({ page }) => {
  await openCasLogin(page, { webjarKeys: 'fixed', lateBootstrap: true });
  await expect(page.locator('[data-i18n^="nav."]').first()).not.toBeEmpty();
  expect(await page.evaluate(() => window.jQuery === window.__casJQuery)).toBe(true);
  // The page's own (late) Bootstrap is the only one allowed; a second copy breaks dropdowns.
  expect(await page.evaluate(() => typeof window.jQuery.fn.collapse)).toBe('undefined');
});

test('deployed auth.l-a.site login has working branding', async ({ page }) => {
  test.skip(!process.env.CAS_LIVE, 'set CAS_LIVE=1 to check the deployed CAS');
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('https://auth.l-a.site/cas/login');
  await settle(page);
  await expectBrandingWorks(page);
  expect(jqueryErrors(errors)).toEqual([]);
});
