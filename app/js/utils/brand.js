// Look of the branding (colours, font) and URL helpers, shared by the build scripts (node) and the
// page code: no DOM here. settings.brand overrides the theme preset, which overrides the defaults.

const defaults = {
  primary: '#1b6e5a',
  accent: '#e3a72f',
  ink: '#1c2a30', // text on the page background
  muted: '#5d6b71', // secondary text
  line: '#e3e8e6', // borders
  surface: '#f4f7f6', // the band of numbers, card placeholders
  page: '#ffffff' // page background
  // highlight: big numbers and card links; primary unless set (the dark themes set it)
};

// The Bootswatch 3 themes built on 'clean': their brand colour, and the page colours of the dark ones
const presets = {
  cosmo: { primary: '#2780e3', accent: '#ff7518' },
  darkly: { primary: '#375a7f', accent: '#00bc8c', highlight: '#00bc8c', ink: '#ffffff', muted: '#aaaaaa', line: '#464545', surface: '#303030', page: '#222222' },
  flatly: { primary: '#2c3e50', accent: '#18bc9c' },
  paper: { primary: '#2196f3', accent: '#ff9800' },
  sandstone: { primary: '#325d88', accent: '#93c54b' },
  simplex: { primary: '#d9230f', accent: '#469408' },
  slate: { primary: '#3a3f44', accent: '#62c462', highlight: '#ffffff', ink: '#c8c8c8', muted: '#999999', line: '#1c1e22', surface: '#32383e', page: '#272b30' },
  superhero: { primary: '#df691a', accent: '#5cb85c', highlight: '#f0ad4e', ink: '#ebebeb', muted: '#9fb1c2', line: '#4e5d6c', surface: '#4e5d6c', page: '#2b3e50' },
  yeti: { primary: '#008cba', accent: '#43ac6a' }
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

export function resolveBrand(settings) {
  const brand = settings.brand || {};
  const colors = { ...defaults, ...(presets[settings.theme] || {}), ...(brand.colors || {}) };
  // They end up in CSS and in colour maths, so hex only
  for (const [k, v] of Object.entries(colors)) {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) throw new Error(`settings.brand.colors.${k}: '${v}' is not a #rrggbb colour`);
  }
  if (!colors.primaryDark) colors.primaryDark = mix(colors.primary, '#000000', 0.45);
  if (!colors.highlight) colors.highlight = colors.primary;
  return { colors, font: brand.font || 'Inter', logo: brand.logo || 'images/logo.svg' };
}

const toKebab = k => k.replace(/[A-Z]/g, c => '-' + c.toLowerCase());

// :root custom properties for the header, footer and home CSS of both builds
export function tokensCss(brand) {
  const vars = Object.entries(brand.colors).map(([k, v]) => `  --la-${toKebab(k)}: ${v};`);
  const font = brand.font.replace(/["\\;{}]/g, '');
  vars.push(`  --la-font: "${font}", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;`);
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
