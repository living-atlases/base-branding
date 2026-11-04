import i18n from 'i18next';
import settings from '../settings';
import { resolveBrand, escapeHtml, mix } from '../utils/brand.js';
import { brandingBase } from '../utils/base-url.js';

// Shared bits of the home charts (taxo-chart.js, inst-chart.js).
//
// Highcharts is not bundled: the first chart loads js/highcharts/{highcharts,drilldown}.js from
// this branding, so pages without charts never download it. They are classic scripts, so they load
// cross-origin without CORS, and the drilldown module registers itself on window.Highcharts.
// Highcharts stays on 11.x: 12 dropped the factory initialisation of modules and the drilldown
// breaks silently with it (tests/e2e/home-charts.spec.js clicks into a pie to catch that).

export const biocache = settings.services.biocache.url;
// With isDevel the charts read ALA's services, so a portal without data yet (or the demo) shows
// real charts; the numbers of stats.js are mocked instead
export const biocacheService = settings.isDevel ? 'https://biocache-ws.ala.org.au/ws' : settings.services.biocacheService.url;
export const collectory = settings.isDevel ? 'https://collections.ala.org.au' : settings.services.collectory.url;
const dh = settings.dataHub;

// The records the charts count: the whole portal, or settings.dataHub only
export const hubQuery = dh ? `q=data_hub_uid:${encodeURIComponent(dh)}` : 'q=*:*';

const loadScript = src => new Promise((resolve, reject) => {
  const s = document.createElement('script');
  s.src = src;
  s.onload = resolve;
  s.onerror = () => reject(new Error(`could not load ${src}`));
  document.head.append(s);
});

let loading = null;
export function loadHighcharts() {
  if (loading) return loading;
  const has = () => window.Highcharts && window.Highcharts.Chart;
  const hasDrilldown = () => has() && window.Highcharts.Chart.prototype.addSeriesAsDrilldown;
  loading = (has() ? Promise.resolve() : loadScript(`${brandingBase}/js/highcharts/highcharts.js`))
    .then(() => (hasDrilldown() ? null : loadScript(`${brandingBase}/js/highcharts/drilldown.js`)))
    .then(() => {
      const Highcharts = window.Highcharts;
      const fmt = new Intl.NumberFormat(i18n.resolvedLanguage || 'en').formatToParts(1234.5);
      const part = t => (fmt.find(p => p.type === t) || {}).value;
      Highcharts.setOptions({
        // Highcharts 11 sizes every label in em of the chart's own font-size, which defaults to
        // 1rem; the module pages set html{font-size} to 10 or 14px, so pin it to a px size.
        chart: { style: { fontSize: '16px', fontFamily: getComputedStyle(document.body).getPropertyValue('--la-font').trim() || 'sans-serif' } },
        lang: {
          loading: i18n.t('index.charts.loading'),
          thousandsSep: part('group') || ',',
          decimalPoint: part('decimal') || '.'
        },
        // What walks back up a drilldown is the breadcrumbs component; showFullPath keeps it to
        // one button, and {level.name} is the level being returned to.
        drilldown: {
          breadcrumbs: { showFullPath: false, format: `◁ ${escapeHtml(i18n.t('index.charts.back'))} {level.name}` },
          // The labels of drillable slices default to underlined dark blue links
          activeDataLabelStyle: { color: '#1c2a30', textDecoration: 'none', fontWeight: '600' }
        }
      });
      return Highcharts;
    });
  return loading;
}

// Ten shades of one colour, from a bit darker to much lighter, and no further than that: a slice
// close to white reads as missing on a white page.
export const pieColors = (Highcharts, which) => {
  const custom = (settings.chartColors || {})[which];
  const { colors } = resolveBrand(settings);
  // a number is an entry of the Highcharts palette (hex colours), as the earlier hub settings had
  const base = typeof custom === 'number'
    ? Highcharts.getOptions().colors[custom]
    : custom || (which === 'inst' ? colors.accent : colors.primary);
  return Array.from({ length: 10 }, (v, i) => (i < 2
    ? mix(base, '#000000', 0.25 - i * 0.125)
    : mix(base, '#ffffff', ((i - 1) * 0.6) / 8)));
};

// Names come from the API: Highcharts parses labels as a small HTML subset, so escape them
export const label = name => (name ? escapeHtml(name) : escapeHtml(i18n.t('index.charts.unnamed')));

export const getJSON = url => fetch(url).then(r => {
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
});

export const openRecords = fq => {
  const w = window.open(`${biocache}/occurrences/search?fq=${fq}`, '_blank');
  if (w) w.focus();
};

export const titleStyle = { fontSize: '20px', fontWeight: 700 };
