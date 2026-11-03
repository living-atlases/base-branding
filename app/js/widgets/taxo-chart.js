import i18n from 'i18next';
import { biocacheService, hubQuery, label, pieColors, getJSON, openRecords, titleStyle } from './charts.js';

// Records by kingdom, drilling down rank by rank to species; a species slice, or the records
// button of a drilled level, opens those records in the occurrence search

const ranks = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];
const breakdown = (rank, name) => `${biocacheService}/breakdown.json?${hubQuery}`
  + `${name !== undefined ? `&name=${encodeURIComponent(name)}` : ''}&fq=rank:(species%20OR%20subspecies)&rank=${rank}`;
const points = (taxa, rank) => (taxa || []).map(t => ({
  name: label(t.label), raw: t.label, rank, y: t.count, drilldown: Boolean(t.label)
}));
const fqOf = (rank, name) => `${ranks[rank]}%3A${encodeURIComponent(`"${name}"`)}`;

export function drawTaxoChart(Highcharts, container) {
  const levels = []; // the drilled levels shown, { rank, name }, the current one last
  return getJSON(breakdown('kingdom')).then(data => {
    Highcharts.chart(container, {
      chart: {
        type: 'pie',
        events: {
          drilldown(e) {
            if (e.seriesOptions) return;
            const chart = this;
            const { rank, raw } = e.point;
            if (rank === ranks.length - 1) {
              openRecords(fqOf(rank, raw));
              return;
            }
            chart.showLoading();
            getJSON(breakdown(ranks[rank], raw)).then(d => {
              levels.push({ rank, name: raw });
              chart.hideLoading();
              chart.recordsButton.show();
              chart.addSeriesAsDrilldown(e.point, { name: label(raw), data: points(d.taxa, rank + 1) });
            }).catch(err => { chart.hideLoading(); console.error(err); });
          },
          drillup() {
            levels.pop();
            if (!levels.length) this.recordsButton.hide();
          }
        }
      },
      credits: false,
      title: { text: label(i18n.t('index.stats.taxonomies')), style: titleStyle },
      legend: { enabled: false },
      plotOptions: {
        pie: { allowPointSelect: true, cursor: 'pointer', colors: pieColors(Highcharts, 'taxo') },
        series: { borderWidth: 0, dataLabels: { enabled: true, distance: 30 } }
      },
      series: [{ name: label(i18n.t('index.charts.kingdoms')), colorByPoint: true, data: points(data.taxa, 0) }],
      drilldown: { series: [] }
    }, chart => {
      chart.recordsButton = chart.renderer.button(label(i18n.t('index.stats.records')), 10, 10)
        .attr({ zIndex: 3 })
        .on('click', () => {
          const level = levels[levels.length - 1];
          if (level) openRecords(fqOf(level.rank, level.name));
        })
        .add();
      chart.recordsButton.hide();
    });
  });
}
