// Bootstrap 3 pages: the footer on short pages, and no font requests to third parties.
// Run after `npm run build`.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import settings from '../../app/js/settings.js';
import { resolveBrand } from '../../app/js/utils/brand.js';
import { root, brandingBase, distFile } from './helpers.js';

const rgb = hex => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

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

// The ALA commonui Bootstrap 3 CSS of clean has its own orange buttons; la-tokens.css gives them
// the brand colours, and keeps the default one neutral so the main action stands out
test('module page buttons take the brand colours, and default ones stay neutral', async ({ page }) => {
  await open(page, 'testSmall.html');
  const { bootswatch, colors } = resolveBrand(settings);
  test.skip(bootswatch, 'a Bootswatch theme styles its own buttons');
  const bg = await page.evaluate(() => {
    const main = document.body;
    main.insertAdjacentHTML('beforeend', '<a class="btn btn-primary" id="b1">A</a><a class="btn btn-default" id="b2">B</a>');
    return ['b1', 'b2'].map(id => getComputedStyle(document.getElementById(id)).backgroundColor);
  });
  expect(bg[0]).toBe(rgb(colors.primary));
  expect(bg[1]).toBe('rgb(255, 255, 255)');
});
