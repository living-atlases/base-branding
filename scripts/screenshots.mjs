// npm run screenshots [theme...]: builds every clean-based theme (LA_THEME=<theme>) and writes
//  - screenshots/<theme>.png       576x768 home, the theme thumbnails (la-toolkit shows them too)
//  - screenshots/bs3/<theme>.png   full home page at 1280px, for the README
//  - screenshots/bs5/<theme>.png   a Bootstrap 5 page with the bs5 header and footer
// Services are stubbed with the samples of tests/e2e/helpers.js. Leaves dist/ built with the last
// theme: run `npm run build` afterwards. Needs Chromium (see playwright.config.js).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { root, brandingBase, distFile, serviceStub, bs5Page } from '../tests/e2e/helpers.js';

const all = ['clean', 'cosmo', 'darkly', 'flatly', 'paper', 'sandstone', 'simplex', 'slate', 'superhero', 'yeti'];
const full = ['clean', 'flatly', 'darkly']; // the ones with a full page and a bs5 shot
const themes = process.argv.slice(2).length ? process.argv.slice(2) : all;
const out = path.join(root, 'screenshots');
const APP = 'https://app.bs5.test';
const executablePath = [process.env.PW_CHROMIUM, '/usr/bin/chromium'].find(p => p && fs.existsSync(p));

const sampleBody = `<h1>Occurrence records</h1>
<p class="lead">A page of a module (biocache, collectory, spatial...): its own content between the branding header and footer.</p>
<p><a class="btn btn-primary" href="#">Search</a> <a class="btn btn-outline-secondary" href="#">Download</a></p>`;

async function route(page, base, html) {
  await page.route('**/*', r => {
    const url = new URL(r.request().url());
    if (html && url.origin === APP) return r.fulfill({ contentType: 'text/html', body: html });
    const stub = serviceStub(url);
    if (stub) return r.fulfill(stub);
    const file = distFile(url.origin + url.pathname, base);
    return file ? r.fulfill(file) : r.abort();
  });
}

const settle = async page => {
  await page.waitForLoadState('load');
  await page.waitForFunction(() => window.i18next && window.i18next.isInitialized);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500); // counters and pie animations
};

const env = theme => ({ ...process.env, LA_THEME: theme, BASE_BRANDING_URL: 'https://l-a.site' });
fs.mkdirSync(path.join(out, 'bs3'), { recursive: true });
fs.mkdirSync(path.join(out, 'bs5'), { recursive: true });

const browser = await chromium.launch(executablePath ? { executablePath } : {});
for (const theme of themes) {
  console.log(`${theme}: building`);
  execFileSync('npx', ['vite', 'build', '--logLevel', 'warn'], { cwd: root, env: env(theme), stdio: 'inherit' });
  execFileSync('npx', ['vite', 'build', '--logLevel', 'warn'], { cwd: root, env: { ...env(theme), BUILD_INIT: '1' }, stdio: 'inherit' });
  const base = brandingBase();

  const thumb = await browser.newPage({ viewport: { width: 576, height: 768 } });
  await route(thumb, base);
  await thumb.goto(`${base}/?lang=en`);
  await settle(thumb);
  await thumb.screenshot({ path: path.join(out, `${theme}.png`) });
  await thumb.close();

  if (!full.includes(theme)) continue;
  const home = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await route(home, base);
  await home.goto(`${base}/?lang=en`);
  await settle(home);
  await home.screenshot({ path: path.join(out, 'bs3', `${theme}.png`), fullPage: true });
  await home.close();

  execFileSync('node', ['scripts/build-bs5.mjs'], { cwd: root, env: env(theme), stdio: 'ignore' });
  const bs5 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await route(bs5, base, bs5Page(base, { body: sampleBody }));
  await bs5.goto(`${APP}/?lang=en`);
  await settle(bs5);
  await bs5.screenshot({ path: path.join(out, 'bs5', `${theme}.png`), fullPage: true });
  await bs5.close();
}
await browser.close();
console.log(`screenshots in ${path.relative(process.cwd(), out)}/`);
