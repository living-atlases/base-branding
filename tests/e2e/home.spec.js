// The home page (dist/index.html): hero carousel and the optional widgets of settings.homeWidgets.
//
// The charts draw a pie with Highcharts and walk into it with the drilldown module. Highcharts 11
// still initialises modules with a factory and 12 dropped it, so a bump past 11 breaks the
// drilldown silently: the pie still renders and the click does nothing. These tests click, which
// is what catches it.
//
// Served through page.route under the base URL of the build, with the services stubbed.
// Run after `npm run build`.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import settings from '../../app/js/settings.js';
import { homeOf, widgetsOf } from '../../app/js/utils/defaults.js';
import { root, readDist, brandingBase, distFile, serviceStub, KINGDOMS, PHYLA, INSTITUTIONS } from './helpers.js';

const on = widgetsOf(settings);
const home = homeOf(settings);

async function openHome(page, { kingdoms } = {}) {
  const base = brandingBase();
  // window.open(...).focus() is what a slice does; record it instead.
  await page.addInitScript(() => {
    window.__opened = [];
    window.open = url => { window.__opened.push(url); return { focus() {} }; };
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    const stub = serviceStub(url, { kingdoms });
    if (stub) return route.fulfill(stub);
    const file = distFile(url.origin + url.pathname, base);
    if (file) return route.fulfill(file);
    return route.abort();
  });
  await page.goto(`${base}/?lang=en`);
  await page.waitForLoadState('load');
  return { base };
}

const slices = (page, container) => page.locator(`#${container} .highcharts-series path.highcharts-point`);

// The pie grows into place with an entry animation, and for the first frames a slice is a sliver
// that Playwright refuses to click. Wait for it to have real size and click it like a visitor.
const clickSlice = async (page, container) => {
  const slice = slices(page, container).first();
  await expect.poll(async () => {
    const box = await slice.boundingBox();
    return box ? Math.round(Math.min(box.width, box.height)) : 0;
  }, { message: 'the pie slice never grew past its entry animation' }).toBeGreaterThan(20);
  await slice.click();
};

test.describe('hero', () => {
  test('shows the first slide with its credits behind the (i) button', async ({ page }) => {
    await openHome(page);
    const first = home.hero.slides[0];
    await expect(page.locator('.la-hero__slide.is-active')).toHaveCount(1);
    await expect(page.locator('.la-hero__slide').first()).toHaveAttribute('style', /background-image/);

    const credit = page.locator('#la-hero-credit');
    await expect(credit).toBeHidden();
    await page.locator('.la-credit__i').click();
    await expect(credit).toBeVisible();
    await expect(credit).toContainText(first.species);
    await expect(page.locator('.la-credit__i')).toHaveAttribute('aria-expanded', 'true');
  });

  test('with prefers-reduced-motion the slides do not move by themselves', async ({ page }) => {
    test.skip(home.hero.slides.length < 2, 'one slide only');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    const active = () => page.locator('.la-hero__slide').evaluateAll(s => s.findIndex(e => e.classList.contains('is-active')));
    expect(await active()).toBe(0);
    await page.waitForTimeout(Math.max(3000, home.hero.interval) + 800);
    expect(await active()).toBe(0);
    // The dots still move it
    await page.locator('.la-hero__dot').nth(1).click();
    expect(await active()).toBe(1);
  });

  test('the slides move by themselves, and a tap on a phone does not stop them', async ({ browser }) => {
    test.skip(home.hero.slides.length < 2, 'one slide only');
    const page = await browser.newPage({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } });
    await openHome(page);
    const active = () => page.locator('.la-hero__slide').evaluateAll(s => s.findIndex(e => e.classList.contains('is-active')));
    await page.locator('.la-hero p').tap();
    const before = await active();
    await expect.poll(active, { timeout: Math.max(3000, home.hero.interval) + 3000 }).not.toBe(before);
    await page.close();
  });

  test('cards and partners come from settings.home', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('#la-home-cards .la-card')).toHaveCount(home.cards.length);
    await expect(page.locator('#la-home-cards .la-card h3').first()).not.toBeEmpty();
    await expect(page.locator('#la-home-partners img')).toHaveCount(home.partners.length);
  });
});

test.describe('home charts', () => {
  test.skip(!on.taxoChart || !on.instChart, 'settings.homeWidgets turns the charts off');

  test('the taxonomic pie renders the kingdoms it was given, with a translated title', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('#la-home-charts')).toBeVisible();
    await expect(slices(page, 'taxo-container')).toHaveCount(KINGDOMS.length);
    for (const container of ['taxo-container', 'inst-container']) {
      const title = page.locator(`#${container} text.highcharts-title`);
      await expect(title).toContainText(/\S/);
      await expect(title).not.toContainText('index.');
    }
  });

  // Highcharts 11 sizes text in em of the chart's font-size, and the module pages set a small
  // root size: without an explicit chart font-size the data labels came out at 7px.
  test('the data labels are readable, not shrunk by the page root size', async ({ page }) => {
    await openHome(page);
    await expect(slices(page, 'taxo-container')).toHaveCount(KINGDOMS.length);
    const size = await page.locator('#taxo-container .highcharts-data-labels text').first()
      .evaluate(e => parseFloat(getComputedStyle(e).fontSize));
    expect(size).toBeGreaterThanOrEqual(10);
  });

  test('clicking a kingdom drills into it, so the drilldown module is loaded', async ({ page }) => {
    await openHome(page);
    await expect(slices(page, 'taxo-container')).toHaveCount(KINGDOMS.length);

    const drilled = page.waitForRequest(r => r.url().includes('/breakdown.json') && r.url().includes('name='));
    await clickSlice(page, 'taxo-container');
    await drilled;
    await expect(slices(page, 'taxo-container')).toHaveCount(PHYLA.length);

    // None of them may be white: the page behind is, so such a slice reads as missing.
    const fills = await slices(page, 'taxo-container').evaluateAll(ps => ps.map(p => p.getAttribute('fill')));
    const washedOut = fills.filter(fill => {
      const [r, g, b] = (fill.match(/\d+/g) || []).map(Number);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b > 240;
    });
    expect(washedOut, 'a slice is too pale to tell from the page behind it').toEqual([]);

    // The records button opens the search of the drilled level
    await page.locator('#taxo-container .highcharts-button').filter({ hasText: /\S/ }).first().click();
    await expect.poll(() => page.evaluate(() => window.__opened.length)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.__opened[0])).toContain('kingdom%3A%22Plantae%22');
  });

  test('the institutions pie renders and a slice opens its records search', async ({ page }) => {
    await openHome(page);
    await expect(slices(page, 'inst-container')).toHaveCount(INSTITUTIONS.length);
    await clickSlice(page, 'inst-container');
    await expect.poll(() => page.evaluate(() => window.__opened)).toContain(
      `${settings.services.biocache.url}/occurrences/search?fq=${encodeURIComponent(INSTITUTIONS[0].fq)}`
    );
  });

  test('names from the API are shown as text, never as markup', async ({ page }) => {
    const evil = '<img src=x onerror="window.__xss=1">Evil';
    await openHome(page, { kingdoms: [{ label: evil, count: 10 }, ...KINGDOMS] });
    await expect(slices(page, 'taxo-container')).toHaveCount(KINGDOMS.length + 1);
    await expect(page.locator('#taxo-container')).toContainText('Evil');
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(await page.locator('#taxo-container img').count()).toBe(0);
  });
});

test.describe('institutions', () => {
  test.skip(!on.institutions, 'settings.homeWidgets turns the institutions off');

  test('a long list shows a few cards, a filter and a button for the rest', async ({ page }) => {
    await openHome(page);
    const shown = Number(settings.institutionsShow) || 12;
    const cards = page.locator('#accordion-home-institutions .la-entity');
    await expect(cards).toHaveCount(30);
    await expect(page.locator('#accordion-home-institutions .la-entity:visible')).toHaveCount(shown);
    await page.locator('.la-entities__filter').fill('institution 2');
    await expect(page.locator('#accordion-home-institutions .la-entity:visible')).toHaveCount(10); // 20 to 29
    await page.locator('.la-entities__filter').fill('');
    await page.locator('.la-entities__more').click();
    await expect(page.locator('#accordion-home-institutions .la-entity:visible')).toHaveCount(30);
    await expect(page.locator('.la-entities__more')).toBeHidden();
  });
});

test('pages without chart containers never download Highcharts', async ({ page }) => {
  expect(readDist('js/init.js')).not.toContain('Highcharts JS v');
  const requested = [];
  const base = brandingBase();
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    requested.push(url.pathname);
    const file = distFile(url.origin + url.pathname, base);
    return file ? route.fulfill(file) : route.abort();
  });
  await page.goto(`${base}/testPage.html?lang=en`);
  await page.waitForLoadState('load');
  await page.waitForFunction(() => window.i18next && window.i18next.isInitialized);
  expect(requested.filter(p => p.includes('highcharts'))).toEqual([]);
});

test('highcharts is 11.x and not a version with a known advisory', () => {
  // <11.4.9 carries GHSA-5793-x2q3-c3q7 and GHSA-rmqc-xvr3-v46c; 12 breaks the drilldown (above)
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const entry = lock.packages['node_modules/highcharts'];
  expect(entry, 'highcharts is not in package-lock.json').toBeTruthy();
  const [major, minor, patch] = entry.version.split('.').map(Number);
  expect(major).toBe(11);
  expect(minor > 4 || (minor === 4 && patch >= 9), `highcharts ${entry.version} is below 11.4.9`).toBe(true);
});
