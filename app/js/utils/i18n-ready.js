import i18n from 'i18next';

// Runs fn once the DOM is parsed and i18next has its namespace: i18next fetches it over the
// network, so code that reads i18n.t() on DOMContentLoaded alone would get the raw keys.
export const whenI18n = fn => {
  const onI18n = () => (i18n.isInitialized ? fn() : i18n.on('initialized', () => fn()));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onI18n);
  else onI18n();
};

// Translates the data-i18n attributes of an element added after the first $('body').localize()
export const localize = el => {
  if (i18n.isInitialized && window.jQuery && window.jQuery.fn.localize) window.jQuery(el).localize();
};

export const onReady = fn => {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
};
