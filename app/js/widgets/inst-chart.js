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
          dataLabels: { minFontSize: 8 }
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
