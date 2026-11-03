import settings from '../settings';
import { CountUp } from 'countup.js';

// Big numbers of the home (#stats_occurrences, #stats_datasets, #stats_institutions, #stats_species),
// counting up when they arrive. With settings.dataHub they count only that data hub.

const collectory = settings.services.collectory.url;
const biocacheService = settings.services.biocacheService.url;
const dh = settings.dataHub;

const lang = () => (window.i18next && window.i18next.resolvedLanguage) || 'en';

const setCounter = (id, val) => {
  const el = document.getElementById(id);
  if (!el || typeof val !== 'number') return;
  // If testing set some dummy value
  if (val === 0 && settings.isDevel) val = 123456;
  const fmt = new Intl.NumberFormat(lang());
  const countUp = new CountUp(el, val, {
    startVal: Math.round(val - val * 4 / 100), // we increment only a %
    duration: 1,
    formattingFn: n => fmt.format(n)
  });
  if (!countUp.error) {
    countUp.start(() => el.classList.add('loaded_stats'));
  } else {
    console.error(countUp.error);
  }
};

const getStats = (url, callback) => {
  // As many times during development, the LA portal is not returning stats, let's mock this a bit
  if (settings.isDevel) {
    if (url.indexOf('species') > -1) callback([{ count: 10402 }]);
    else if (url.indexOf('/ws/dataHub/') > -1) callback({ memberDataResources: new Array(42), memberInstitutions: new Array(7) });
    else callback({ totalRecords: 86965283, total: 12922 });
  } else {
    // Real call in production
    $.getJSON(url, callback);
  }
};

const q = dh ? `q=data_hub_uid:${encodeURIComponent(dh)}` : 'q=*:*';

export function mountStats() {
  if (!document.getElementById('stats_occurrences')) return;
  getStats(`${biocacheService}/occurrences/search?${q}&pageSize=0`, data => setCounter('stats_occurrences', data.totalRecords));
  getStats(`${biocacheService}/occurrence/facets?${q}&facets=species&pageSize=0`, data => setCounter('stats_species', data[0] && data[0].count));
  if (dh) {
    getStats(`${collectory}/ws/dataHub/${encodeURIComponent(dh)}`, data => {
      setCounter('stats_datasets', (data.memberDataResources || []).length);
      setCounter('stats_institutions', (data.memberInstitutions || []).length);
    });
  } else {
    getStats(`${collectory}/ws/dataResource/count`, data => setCounter('stats_datasets', data.total));
    getStats(`${collectory}/ws/institution/count`, data => setCounter('stats_institutions', data.total));
  }
}
