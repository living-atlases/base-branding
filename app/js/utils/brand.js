// Look of the branding (colours, font) and URL helpers, shared by the build scripts (node) and the
// page code: no DOM here. settings.brand overrides the theme preset, which overrides the defaults.

const defaults = {
  colors: {
    primary: '#00838f',
    accent: '#ffb703',
    ink: '#1c2a30', // text on the page background
    muted: '#5d6b71', // secondary text
    line: '#e3e8e6', // borders
    surface: '#f4f7f6', // the band of numbers, card placeholders
    page: '#ffffff', // page background
    headerBg: '#ffffff' // header background
    // Unless set, from the ones above:
    // highlight: big numbers and card links (primary)
    // primaryDark: footer background (primary darkened)
    // headerInk: header text (white or ink, whichever reads better on headerBg)
    // headerAccent: active menu item and account button (primary, accent or headerInk: the first
    //   that stands out on headerBg and takes readable text)
    // onPrimary, onAccent, onHeaderAccent: text on those (white or ink)
  },
  font: 'Inter',
  radius: 8 // px, of buttons, cards and menus
};

// The Bootswatch 3 themes built on 'clean': their brand and navbar colours, the page colours of the
// dark ones, a font of their own (none of the ones Bootswatch used) and their corner radius
const presets = {
  cosmo: { colors: { primary: '#2780e3', accent: '#ff7518', headerBg: '#222222' }, font: 'Space Grotesk', radius: 0 },
  darkly: {
    colors: { primary: '#375a7f', accent: '#00bc8c', highlight: '#00bc8c', ink: '#ffffff', muted: '#aaaaaa', line: '#464545', surface: '#303030', page: '#222222', headerBg: '#375a7f' },
    font: 'Outfit', radius: 6
  },
  flatly: { colors: { primary: '#2c3e50', accent: '#18bc9c', headerBg: '#2c3e50' }, font: 'Plus Jakarta Sans', radius: 6 },
  paper: { colors: { primary: '#1976d2', accent: '#ff9800', headerBg: '#1976d2' }, font: 'Nunito', radius: 3 },
  sandstone: { colors: { primary: '#325d88', accent: '#93c54b', headerBg: '#3e3f3a', surface: '#f8f5f0' }, font: 'Work Sans', headingFont: 'Fraunces', radius: 4 },
  simplex: { colors: { primary: '#d9230f', accent: '#469408' }, font: 'Manrope', radius: 4 },
  slate: {
    colors: { primary: '#3a3f44', accent: '#62c462', highlight: '#ffffff', ink: '#c8c8c8', muted: '#999999', line: '#1c1e22', surface: '#32383e', page: '#272b30', headerBg: '#3a3f44' },
    font: 'IBM Plex Sans', radius: 4
  },
  superhero: {
    colors: { primary: '#df691a', accent: '#5cb85c', highlight: '#f0ad4e', ink: '#ebebeb', muted: '#9fb1c2', line: '#4e5d6c', surface: '#4e5d6c', page: '#2b3e50', headerBg: '#b8540f' },
    font: 'Sora', radius: 0
  },
  yeti: { colors: { primary: '#008cba', accent: '#43ac6a', headerBg: '#333333' }, font: 'Figtree', radius: 0 }
};

const hex = c => {
  const h = c.replace('#', '');
  const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
};
// a mixed with b, t of the way (0: a, 1: b)
export const mix = (a, b, t) => '#' + hex(a)
  .map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0'))
  .join('');

const luminance = c => {
  const [r, g, b] = hex(c).map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
// WCAG contrast ratio of two colours
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const textOn = (bg, ink) => (contrast(bg, '#ffffff') >= contrast(bg, ink) ? '#ffffff' : ink);

export function resolveBrand(settings) {
  const brand = settings.brand || {};
  const preset = presets[settings.theme] || {};
  const colors = { ...defaults.colors, ...(preset.colors || {}), ...(brand.colors || {}) };
  // They end up in CSS and in colour maths, so hex only
  for (const [k, v] of Object.entries(colors)) {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) throw new Error(`settings.brand.colors.${k}: '${v}' is not a #rrggbb colour`);
  }
  const dark = '#1c2a30';
  const set = (k, v) => { if (!colors[k]) colors[k] = v; };
  set('primaryDark', mix(colors.primary, '#000000', 0.45));
  set('highlight', colors.primary);
  set('headerInk', textOn(colors.headerBg, dark));
  set('headerLine', mix(colors.headerBg, colors.headerInk, 0.14));
  // Seen on the header, and with readable text on it (the account button)
  const readable = c => contrast(c, colors.headerBg) >= 3 && contrast(c, textOn(c, dark)) >= 4.5;
  set('headerAccent', [colors.primary, colors.accent].find(readable) || colors.headerInk);
  set('onPrimary', textOn(colors.primary, dark));
  set('onAccent', textOn(colors.accent, dark));
  set('onHeaderAccent', textOn(colors.headerAccent, dark));
  const font = brand.font || preset.font || defaults.font;
  const radius = Number(brand.radius ?? preset.radius ?? defaults.radius);
  if (!(radius >= 0 && radius <= 32)) throw new Error(`settings.brand.radius: '${brand.radius}' is not a number of px from 0 to 32`);
  return {
    bootswatch: Boolean(presets[settings.theme]), // a Bootswatch theme, which styles its own buttons
    colors,
    font,
    headingFont: brand.headingFont || preset.headingFont || font,
    radius,
    logo: brand.logo || defaultLogo,
    logoWide: Boolean(brand.logoWide),
    footerLogo: brand.footerLogo || null
  };
}

export const defaultLogo = 'images/logo.svg';

// The default logo, a leaf in the header accent colour: generated, so it matches every theme
export function logoSvg(brand) {
  const { headerAccent, onHeaderAccent } = brand.colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="19" fill="${headerAccent}"/><path d="M12 27c2-9 8-14 17-15-1 8-6 14-15 15m-2 1 9-9" stroke="${onHeaderAccent}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>\n`;
}

const toKebab = k => k.replace(/[A-Z]/g, c => '-' + c.toLowerCase());

// The Bootstrap buttons of the module pages (BS3 and BS5 class names) in the brand colours, for the
// builds whose Bootstrap CSS has other colours: clean (the ALA commonui CSS) and every Bootstrap 5
// build. The default and secondary ones stay neutral, so a page tells its main action from the rest.
export function buttonsCss() {
  const neutral = 'color: #1c2a30; background-color: #ffffff; border-color: #c4ccc9; background-image: none; text-shadow: none;';
  const neutralHover = 'color: #1c2a30; background-color: #eef2f1; border-color: #aab5b1;';
  return `.btn.btn-primary, .btn.btn-primary:focus {
  color: var(--la-on-primary); background-color: var(--la-primary); border-color: var(--la-primary); background-image: none; text-shadow: none;
}
.btn.btn-primary:hover, .btn.btn-primary:active, .btn.btn-primary.active, .open > .btn.btn-primary.dropdown-toggle, .btn.btn-primary.show {
  color: var(--la-on-primary); background-color: var(--la-primary-dark); border-color: var(--la-primary-dark);
}
.btn.btn-default, .btn.btn-default:focus, .btn.btn-secondary, .btn.btn-secondary:focus { ${neutral} }
.btn.btn-default:hover, .btn.btn-default:active, .btn.btn-default.active, .open > .btn.btn-default.dropdown-toggle,
.btn.btn-secondary:hover, .btn.btn-secondary:active, .btn.btn-secondary.active, .btn.btn-secondary.show { ${neutralHover} }
.btn.btn-outline-primary { color: var(--la-primary); border-color: var(--la-primary); background-color: transparent; }
.btn.btn-outline-primary:hover, .btn.btn-outline-primary:active, .btn.btn-outline-primary.active {
  color: var(--la-on-primary); background-color: var(--la-primary); border-color: var(--la-primary);
}
.btn.btn-outline-secondary { color: #1c2a30; border-color: #c4ccc9; background-color: transparent; }
.btn.btn-outline-secondary:hover, .btn.btn-outline-secondary:active, .btn.btn-outline-secondary.active { ${neutralHover} }
.btn.btn-link { color: var(--la-primary); }
.pagination > .active > a, .pagination > .active > span, .pagination .page-item.active .page-link {
  color: var(--la-on-primary); background-color: var(--la-primary); border-color: var(--la-primary);
}
`;
}

const fontStack = (name, generic) =>
  `"${name.replace(/["\\;{}]/g, '')}", ${generic}`;

// :root custom properties for the header, footer and home CSS of both builds
export function tokensCss(brand) {
  const vars = Object.entries(brand.colors).map(([k, v]) => `  --la-${toKebab(k)}: ${v};`);
  const sans = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  vars.push(`  --la-font: ${fontStack(brand.font, sans)};`);
  vars.push(`  --la-heading-font: ${fontStack(brand.headingFont, sans)};`);
  vars.push(`  --la-radius: ${brand.radius}px;`);
  // A wide logo (brand.logoWide) keeps its proportions, on a rounded box in the footer
  if (brand.logoWide) vars.push('  --la-logo-w: auto;', '  --la-logo-r: 6px;');
  return `:root {\n${vars.join('\n')}\n}\n`;
}

// '{biocache}/search' -> the biocache URL + /search; '{central}' is settings.mainLAUrl
export function serviceUrl(settings, tpl) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => {
    if (k === 'central') return settings.mainLAUrl;
    return settings.services[k] ? settings.services[k].url : m;
  });
}

// Only http(s), mailto and relative URLs; anything else (javascript:, data:...) becomes '#'
export function safeUrl(url) {
  const u = String(url || '').trim();
  if (/^(https?:|mailto:)/i.test(u) || /^[/.#?]/.test(u) || !/^[\w+.-]+:/.test(u)) return u || '#';
  return '#';
}

// A path of this branding (images/x.png) under its base URL; absolute URLs are kept
export const assetUrl = (base, p) =>
  safeUrl(/^(https?:)?\/\//i.test(p) ? p : `${String(base).replace(/\/+$/, '')}/${String(p).replace(/^\/+/, '')}`);

export const escapeHtml = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
