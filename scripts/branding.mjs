// Build-time pieces shared by the Bootstrap 3 (vite.config.js) and Bootstrap 5 (build-bs5.mjs) builds,
// so both get the same look from settings.js:
//  - css/la-tokens.css: the Inter @font-face and the --la-* colour and font custom properties
//  - fonts/inter/*.woff2: Inter (variable, latin and latin-ext) from @fontsource-variable/inter
//  - ::token:: values for banner.html and footer.html (logo, footer links), HTML-escaped
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveBrand, tokensCss, serviceUrl, safeUrl, assetUrl, escapeHtml } from '../app/js/utils/brand.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontDir = path.join(root, 'node_modules/@fontsource-variable/inter/files');
const fontFiles = {
  // unicode-range of each subset, as @fontsource-variable/inter/index.css declares them
  'inter-latin-wght-normal.woff2':
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'inter-latin-ext-wght-normal.woff2':
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
};

// The font is served from the branding host to the pages of every module (other origins), so the
// server has to send Access-Control-Allow-Origin for it (see the README); if it doesn't, the
// pages fall back to the system font of the --la-font stack.
function fontFaceCss() {
  return Object.entries(fontFiles).map(([file, range]) => `@font-face {
  font-family: "Inter";
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url("../fonts/inter/${file}") format("woff2-variations"), url("../fonts/inter/${file}") format("woff2");
  unicode-range: ${range};
}`).join('\n');
}

export function brandCss(settings) {
  return `/* Generated from settings.js by scripts/branding.mjs: do not edit, change settings.brand */\n`
    + fontFaceCss() + '\n' + tokensCss(resolveBrand(settings));
}

// Writes <outDir>/css/la-tokens.css and <outDir>/fonts/inter/
export function writeBrandAssets(settings, outDir) {
  fs.mkdirSync(path.join(outDir, 'css'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'css/la-tokens.css'), brandCss(settings));
  fs.mkdirSync(path.join(outDir, 'fonts/inter'), { recursive: true });
  for (const f of Object.keys(fontFiles)) {
    fs.copyFileSync(path.join(fontDir, f), path.join(outDir, 'fonts/inter', f));
  }
}

const link = (settings, { i18n, url }) =>
  `<li><a data-i18n="${escapeHtml(i18n)}" href="${escapeHtml(safeUrl(serviceUrl(settings, url)))}"></a></li>`;

// ::token:: values of the header and footer fragments, the same in both builds
export function brandTokens(settings, baseUrl) {
  const { logo } = resolveBrand(settings);
  const footer = settings.footer || {};
  return {
    brandLogo: escapeHtml(assetUrl(baseUrl, logo)),
    footerLinks: (footer.links || []).map(l => link(settings, l)).join('\n          '),
    footerSocial: (footer.social || []).map(s =>
      `<a href="${escapeHtml(safeUrl(s.url))}" rel="noopener">${escapeHtml(s.name)}</a>`).join('\n        ')
  };
}
