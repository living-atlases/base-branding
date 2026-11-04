// Build-time pieces shared by the Bootstrap 3 (vite.config.js) and Bootstrap 5 (build-bs5.mjs) builds,
// so both get the same look from settings.js:
//  - css/la-tokens.css: the @font-face of the theme fonts, the --la-* custom properties and the
//    Bootstrap buttons in those colours (not for Bootswatch, which has its own)
//  - fonts/<font>/*.woff2: those fonts (variable, latin and latin-ext) from @fontsource-variable/<font>
//  - images/logo.svg: the default logo, in the colours of the theme
//  - ::token:: values for banner.html and footer.html (logo, footer links), HTML-escaped
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveBrand, tokensCss, buttonsCss, logoSvg, defaultLogo, serviceUrl, safeUrl, assetUrl, escapeHtml } from '../app/js/utils/brand.js';
import { footerOf } from '../app/js/utils/defaults.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// A font of settings.brand is bundled when its @fontsource-variable package is installed:
// 'Plus Jakarta Sans' -> node_modules/@fontsource-variable/plus-jakarta-sans
const fontId = family => family.toLowerCase().trim().replace(/\s+/g, '-');
const fontPkg = id => path.join(root, 'node_modules/@fontsource-variable', id);
export const fontFile = (id, file) => {
  const f = path.join(fontPkg(id), 'files', path.basename(file));
  return /^[\w-]+$/.test(id) && fs.existsSync(f) ? f : null;
};

// The latin and latin-ext faces of each font, as the package's own index.css declares them
function fontFaces(brand) {
  const faces = [];
  for (const family of new Set([brand.font, brand.headingFont])) {
    const id = fontId(family);
    const css = path.join(fontPkg(id), 'index.css');
    if (!fs.existsSync(css)) {
      console.warn(`[branding] no @fontsource-variable/${id}: '${family}' must be loaded by your pages`);
      continue;
    }
    const re = /\/\*\s*[\w-]+-(latin|latin-ext)-wght-normal\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
    for (const [, , body] of fs.readFileSync(css, 'utf8').matchAll(re)) {
      const file = body.match(/url\(\.\/files\/([\w.-]+\.woff2)\)/)[1];
      faces.push({ id, family, file, range: body.match(/unicode-range:\s*([^;]+);/)[1].trim() });
    }
  }
  return faces;
}

// The fonts are served from the branding host to the pages of every module (other origins), so the
// server has to send Access-Control-Allow-Origin for them (see the README); if it doesn't, the
// pages fall back to the system font of the --la-font stack.
const fontFaceCss = faces => faces.map(({ id, family, file, range }) => `@font-face {
  font-family: "${family.replace(/["\;{}]/g, '')}";
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url("../fonts/${id}/${file}") format("woff2-variations"), url("../fonts/${id}/${file}") format("woff2");
  unicode-range: ${range};
}`).join('\n');

// bs5: for the Bootstrap 5 build, which always gets the buttons in the brand colours (its base CSS
// has the ALA ones); the Bootstrap 3 build gets them unless a Bootswatch theme styles its own
export function brandCss(settings, { bs5 = false } = {}) {
  const brand = resolveBrand(settings);
  return `/* Generated from settings.js by scripts/branding.mjs: do not edit, change settings.brand */\n`
    + fontFaceCss(fontFaces(brand)) + '\n' + tokensCss(brand)
    + (bs5 || !brand.bootswatch ? buttonsCss() : '');
}

// Writes <outDir>/css/la-tokens.css, the fonts of the theme in <outDir>/fonts/<font>/ and, when
// settings.brand keeps the default logo, <outDir>/images/logo.svg in the colours of the theme
export function writeBrandAssets(settings, outDir, { bs5 = false } = {}) {
  const brand = resolveBrand(settings);
  fs.mkdirSync(path.join(outDir, 'css'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'css/la-tokens.css'), brandCss(settings, { bs5 }));
  for (const { id, file } of fontFaces(brand)) {
    fs.mkdirSync(path.join(outDir, 'fonts', id), { recursive: true });
    fs.copyFileSync(fontFile(id, file), path.join(outDir, 'fonts', id, file));
  }
  if (brand.logo === defaultLogo) {
    fs.mkdirSync(path.join(outDir, 'images'), { recursive: true });
    fs.writeFileSync(path.join(outDir, defaultLogo), logoSvg(brand));
  }
}

const link = (settings, { i18n, url }) =>
  `<li><a data-i18n="${escapeHtml(i18n)}" href="${escapeHtml(safeUrl(serviceUrl(settings, url)))}"></a></li>`;

// The ALA commonui CSS @imports Google Fonts (Lato, Roboto); drop that from the copies in <cssDir>,
// so no page of the branding asks a font service for anything (README, "Fonts")
export function stripFontImports(cssDir) {
  for (const f of fs.readdirSync(cssDir).filter(n => n.endsWith('.css'))) {
    const p = path.join(cssDir, f);
    const css = fs.readFileSync(p, 'utf8');
    const out = css.replace(/@import\s+url\(\s*["']?https?:\/\/fonts\.googleapis\.com\/[^)]*\)\s*;?/g, '');
    if (out !== css) fs.writeFileSync(p, out);
  }
}

// ::token:: values of the header and footer fragments, the same in both builds
export function brandTokens(settings, baseUrl) {
  const { logo } = resolveBrand(settings);
  const footer = footerOf(settings);
  return {
    brandLogo: escapeHtml(assetUrl(baseUrl, logo)),
    footerLinks: (footer.links || []).map(l => link(settings, l)).join('\n          '),
    footerSocial: (footer.social || []).map(s =>
      `<a href="${escapeHtml(safeUrl(s.url))}" rel="noopener">${escapeHtml(s.name)}</a>`).join('\n        ')
  };
}
