import i18n from 'i18next';
import { biocacheService, hubQuery, label, pieColors, getJSON, openRecords, titleStyle } from './charts.js';

// Records by institution; a slice opens that institution's records in the occurrence search

export function drawInstChart(Highcharts, container) {
  return getJSON(`${biocacheService}/occurrence/facets?${hubQuery}&facets=institution_uid&pageSize=0`).then(data => {
    const fieldResult = (data[0] && data[0].fieldResult) || [];
    Highcharts.chart(container, {
      chart: {
        type: 'pie',
        events: {
          drilldown(e) { openRecords(encodeURIComponent(e.point.fq)); }
        }
      },
      credits: false,
      title: { text: label(i18n.t('index.stats.institutions')), style: titleStyle },
      legend: { enabled: false },
      plotOptions: {
        pie: {
          allowPointSelect: true, cursor: 'pointer', colors: pieColors(Highcharts, 'inst'),
          // Highcharts shrinks the pie to make room for every label, and with dozens of long
          // institution names it ends up a coin: fix its size and label only the big slices
          // (the tooltip names the rest)
          size: '70%',
          dataLabels: {
            minFontSize: 8, distance: 16,
            filter: { property: 'percentage', operator: '>', value: 3 },
            style: { width: '130px', textOverflow: 'clip' }
          }
        },
        series: { borderWidth: 0, dataLabels: { enabled: true } }
      },
      series: [{
        name: label(i18n.t('index.stats.records')),
        colorByPoint: true,
        data: fieldResult.map(r => ({ name: label(r.label), fq: r.fq, y: r.count, drilldown: true }))
      }],
      drilldown: { series: [] }
    });
  });
}
