import './widgets.css';
import settings from '../settings';
import { whenI18n, onReady } from '../utils/i18n-ready.js';
import { widgetsOf } from '../utils/defaults.js';
import { mountStats } from './stats.js';
import { loadHighcharts } from './charts.js';
import { drawTaxoChart } from './taxo-chart.js';
import { drawInstChart } from './inst-chart.js';
import { mountInstitutions } from './institutions.js';

// Optional home widgets. Each one draws only when settings.homeWidgets turns it on AND its
// container is on the page, so module pages (which load this file through banner.html) do
// nothing, and a portal that turns the charts off never downloads Highcharts.
// A section with the la-widgets class around the containers is shown once one of them draws.

const on = widgetsOf(settings);
const reveal = container => {
  const section = container.closest('.la-widgets');
  if (section) section.hidden = false;
};

const charts = [
  ['taxoChart', 'taxo-container', drawTaxoChart],
  ['instChart', 'inst-container', drawInstChart]
];

onReady(() => {
  if (on.stats) mountStats();
});

whenI18n(() => {
  for (const [key, id, draw] of charts) {
    const container = document.getElementById(id);
    if (!on[key] || !container) continue;
    reveal(container);
    container.classList.add('is-loading');
    loadHighcharts()
      .then(Highcharts => draw(Highcharts, container))
      .then(() => container.classList.remove('is-loading'))
      .catch(err => {
        console.error(err);
        container.hidden = true;
      });
  }
  const box = document.getElementById('accordion-home-institutions');
  if (on.institutions && box) {
    mountInstitutions(box).then(drawn => { if (drawn) reveal(box); }).catch(err => console.error(err));
  }
});
