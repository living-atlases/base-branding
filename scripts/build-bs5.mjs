// Bootstrap 5 build: dist/bs5/{assets,banner,footer,head}.mustache + css/js/fonts.
//
// Apps using ala-bootstrap5 (spatial-service, ...) fetch <headerAndFooter.baseURL>/{assets,banner,footer}.mustache
// and render them server-side ({{headerFooterServer}}, {{containerClass}}, {{loginURL}}, {{loginStatus}}, ...).
// Same repo and branch as the Bootstrap 3 build: run `npm run build` (vite) first, this adds dist/bs5/.
//
// Publish dist/ and point those apps to https://<host>/<branding>/bs5 (headerAndFooter.baseURL).
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import settings from '../app/js/settings.js';

const root = path.resolve(import.meta.dirname, '..');
const bs5Dir = path.join(root, 'commonui-bs5-2019');
const out = path.join(root, 'dist', 'bs5');
const baseUrl = (process.env.BASE_BRANDING_URL || settings.baseFooterUrl).replace(/\/+$/, '');
const buildTimestamp = Date.now();

// 1. Build the ALA Bootstrap 5 base (git submodule) if needed
if (!fs.existsSync(path.join(bs5Dir, 'build', 'css', 'bootstrap.min.css'))) {
  if (!fs.existsSync(path.join(bs5Dir, 'source'))) {
    throw new Error('commonui-bs5-2019 submodule missing: git submodule update --init');
  }
  const vars = {
    homeDomain: settings.mainLAUrl,
    signUpURL: `${settings.services.cas.url}/userdetails/registration/createAccount`,
    profileURL: `${settings.services.cas.url}/userdetails/myprofile`,
    fathomID: ''
  };
  fs.writeFileSync(path.join(bs5Dir, 'buildvars.js'), `module.exports = ${JSON.stringify(vars, null, 2)};\n`);
  execSync('npm install --no-audit --no-fund && npx gulp', { cwd: bs5Dir, stdio: 'inherit' });
}

// 2. Static resources of the base
fs.rmSync(out, { recursive: true, force: true });
for (const d of ['css', 'js', 'fonts']) {
  fs.cpSync(path.join(bs5Dir, 'build', d), path.join(out, d), { recursive: true });
}
fs.copyFileSync(path.join(root, 'app/bs5/branding-bs5.css'), path.join(out, 'css/branding-bs5.css'));
// Apache: .mustache has no content type by default and the app (Java URLConnection) refuses it
fs.copyFileSync(path.join(root, 'app/bs5/htaccess'), path.join(out, '.htaccess'));

// 3. Templates: ::token:: are build time values, {{token}} are rendered by the app at runtime
const localeNames = { en: 'English', es: 'Español', zh: '简体中文', sw: 'Swahili', pt: 'Português', fr: 'Français' };
const localeLinks = settings.enabledLangs.map(l =>
  `              <li class="locale-link" data-locale="${l}"><a class="dropdown-item ${l}-locale-link" href="#"><span class="lang_link_${l}">${localeNames[l] || l}</span></a></li>`
).join('\n');
const tokens = {
  buildTimestamp, baseUrl, LOCALE_LINKS: localeLinks,
  centralServer: settings.mainLAUrl,
  collectoryURL: settings.services.collectory.url,
  datasetsURL: `${settings.services.collectory.url}/datasets`,
  biocacheURL: settings.services.biocache.url,
  bieURL: settings.services.bie.url,
  regionsURL: settings.services.regions.url,
  listsURL: settings.services.lists.url,
  spatialURL: settings.services.spatial.url,
  casURL: settings.services.cas.url,
  imagesURL: settings.services.images.url
};
for (const name of ['assets', 'banner', 'footer', 'head']) {
  let txt = fs.readFileSync(path.join(root, 'app/bs5', `${name}.mustache`), 'utf8');
  txt = txt.replace(/::(\w+)::/g, (m, k) => (k in tokens ? tokens[k] : m));
  const left = txt.match(/::\w+::/g);
  if (left) throw new Error(`${name}.mustache: unresolved tokens ${left.join(', ')}`);
  fs.writeFileSync(path.join(out, `${name}.mustache`), txt);
}
console.log(`dist/bs5 ready (baseUrl ${baseUrl})`);
