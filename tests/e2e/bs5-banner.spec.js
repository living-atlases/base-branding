// The Bootstrap 5 header and footer (dist/bs5/*.mustache) rendered as ala-bootstrap5 does: the
// {{...}} placeholders filled in, assets.mustache in <head>, banner and footer in <body>.
// Run after `npm run build`.
import { test, expect } from '@playwright/test';
import { brandingBase, distFile, bs5Page } from './helpers.js';

const APP = 'https://app.bs5.test';

async function openBs5(page, opts) {
  const base = brandingBase();
  const html = bs5Page(base, opts);
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === APP) return route.fulfill({ contentType: 'text/html', body: html });
    const file = distFile(url.origin + url.pathname, base);
    return file ? route.fulfill(file) : route.abort();
  });
  await page.goto(`${APP}/?lang=en`);
  await page.waitForLoadState('load');
  await page.waitForFunction(() => window.i18next && window.i18next.isInitialized);
}

test('the Bootstrap 5 header is translated and its dropdowns open', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await openBs5(page);
  await expect(page.locator('#la-header [data-i18n="nav.collectory"]')).not.toBeEmpty();
  await page.locator('#dropdown-lang .dropdown-toggle').click();
  await expect(page.locator('#dropdown-lang .dropdown-menu')).toBeVisible();
  expect(errors).toEqual([]);
});

test('header and footer take the shared tokens and the Inter font', async ({ page }) => {
  await openBs5(page);
  const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--la-primary').trim());
  expect(primary).toMatch(/^#[0-9a-f]{6}$/i);
  await expect(page.locator('#la-footer')).toBeVisible();
  await expect(page.locator('#la-footer [data-i18n="footer.explore"]')).not.toBeEmpty();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px Inter'))).toBe(true);
});

test('the account button says what the login status allows', async ({ page }) => {
  await openBs5(page, { loginStatus: 'signedIn' });
  await expect(page.locator('.la-account__in')).toBeVisible();
  await expect(page.locator('.la-account__out')).toBeHidden();
  await page.locator('.la-account__toggle').click();
  await expect(page.locator('.la-account .logoutBtn')).toBeVisible();
  await expect(page.locator('.la-account .loginBtn')).toBeHidden();
});
