// Bootstrap 5 build: dist/bs5/{assets,banner,footer,head}.mustache + css/js/fonts.
//
// Apps using ala-bootstrap5 (spatial-service, ...) fetch <headerAndFooter.baseURL>/{assets,banner,footer}.mustache
// and render them server-side ({{headerFooterServer}}, {{containerClass}}, {{loginURL}}, {{loginStatus}}, ...).
// Same repo and branch as the Bootstrap 3 build: run `npm run build` (vite) first, this adds dist/bs5/.
//
// Publish dist/ and point those apps to https://<host>/<branding>/bs5 (headerAndFooter.baseURL).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import settings from '../app/js/settings.js';
import { buildCommonui } from './build-commonui.mjs';
import { brandTokens, langMenu, writeBrandAssets, stripFontImports } from './branding.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist', 'bs5');
const baseUrl = (process.env.BASE_BRANDING_URL || settings.baseFooterUrl).replace(/\/+$/, '');
const buildTimestamp = Date.now();

// 1. Build the ALA Bootstrap 5 base (git submodule) if needed
const bs5Build = buildCommonui('commonui-bs5-2019', 'build', 'commonui-bs5-2019.package-lock.json');

// 2. Static resources of the base
fs.rmSync(out, { recursive: true, force: true });
for (const d of ['css', 'js', 'fonts']) {
  fs.cpSync(path.join(bs5Build, d), path.join(out, d), { recursive: true });
}
fs.copyFileSync(path.join(root, 'app/bs5/branding-bs5.css'), path.join(out, 'css/branding-bs5.css'));
// The look shared with the Bootstrap 3 build: tokens and Inter from settings.brand, header and footer CSS
writeBrandAssets(settings, out, { bs5: true });
stripFontImports(path.join(out, 'css'));
fs.copyFileSync(path.join(root, 'app/themes/clean/css/la-brand.css'), path.join(out, 'css/la-brand.css'));
// Apache: .mustache has no content type by default and the app (Java URLConnection) refuses it
fs.copyFileSync(path.join(root, 'app/bs5/htaccess'), path.join(out, '.htaccess'));

// 3. Templates: ::token:: are build time values, {{token}} are rendered by the app at runtime
const tokens = {
  buildTimestamp, baseUrl,
  centralServer: settings.mainLAUrl,
  collectoryURL: settings.services.collectory.url,
  datasetsURL: `${settings.services.collectory.url}/datasets`,
  biocacheURL: settings.services.biocache.url,
  bieURL: settings.services.bie.url,
  regionsURL: settings.services.regions.url,
  listsURL: settings.services.lists.url,
  spatialURL: settings.services.spatial.url,
  casURL: settings.services.cas.url,
  imagesURL: settings.services.images.url,
  ...brandTokens(settings, baseUrl),
  langMenu: langMenu(settings, { bs5: true })
};
// The footer is the Bootstrap 3 one: its markup does not depend on Bootstrap
const sources = { footer: 'app/themes/clean/assets/footer.html' };
for (const name of ['assets', 'banner', 'footer', 'head']) {
  let txt = fs.readFileSync(path.join(root, sources[name] || `app/bs5/${name}.mustache`), 'utf8');
  txt = txt.replace(/::(\w+)::/g, (m, k) => (k in tokens ? tokens[k] : m));
  const left = txt.match(/::\w+::/g);
  if (left) throw new Error(`${name}.mustache: unresolved tokens ${left.join(', ')}`);
  fs.writeFileSync(path.join(out, `${name}.mustache`), txt);
}
console.log(`dist/bs5 ready (baseUrl ${baseUrl})`);
