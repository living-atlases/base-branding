// Bootstrap 3 pages: the footer on short pages, and no font requests to third parties.
// Run after `npm run build`.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { root, brandingBase, distFile } from './helpers.js';

async function open(page, file) {
  const base = brandingBase();
  const requested = [];
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    requested.push(url.hostname);
    const f = distFile(url.origin + url.pathname, base);
    return f ? route.fulfill(f) : route.abort();
  });
  await page.goto(`${base}/${file}?lang=en`);
  await page.waitForLoadState('load');
  await page.waitForFunction(() => window.i18next && window.i18next.isInitialized);
  return requested;
}

test('on a short page the footer sits at the bottom of the window, not halfway up', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1400 });
  await open(page, 'testSmall.html');
  const gap = () => page.locator('#la-footer').evaluate(f => Math.round(window.innerHeight - f.getBoundingClientRect().bottom));
  await expect.poll(gap).toBeLessThanOrEqual(1);
  // and follows the window when it grows
  await page.setViewportSize({ width: 1280, height: 1800 });
  await expect.poll(gap).toBeLessThanOrEqual(1);
  expect(await gap()).toBeGreaterThanOrEqual(-1);
});

test('on a long page the footer keeps its own margin', async ({ page }) => {
  await open(page, '');
  const margin = await page.locator('#la-footer').evaluate(f => f.style.marginTop);
  expect(margin).toBe('');
});

test('fonts come from the branding, never from a font service', async ({ page }) => {
  const hosts = await open(page, '');
  expect(hosts.filter(h => /fonts\.(googleapis|gstatic)\.com/.test(h))).toEqual([]);
  // the Bootswatch CSS used to @import Google Fonts
  for (const theme of ['cosmo', 'darkly', 'flatly', 'paper', 'sandstone', 'simplex', 'slate', 'superhero', 'yeti']) {
    const css = fs.readFileSync(path.join(root, 'app/themes', theme, 'css/bootstrap.min.css'), 'utf8');
    expect(css, theme).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
  }
});
