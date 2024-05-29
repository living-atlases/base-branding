import settings from './settings.js';
import './index-auth.js';
import './i18next-config.js';
import './mante.js';
import './stats.js';
import './autocomplete-conf.js';
import './import-css.js';

async function loadThemeResources(theme) {
  try {
    // Importar CSS del tema
    // await import(`../themes/${theme}/css/styles.css`);
    if (theme == "material") {
      await import('../themes/material/css/material-custom-styles.css');
      await import('../themes/material/css/cas-style.css');
    } else {
      await import('../themes/clean/css/lang.css');
      await import('../themes/clean/css/cas-style.css');
      await import('../themes/clean/css/sticky-footer.css');
      if (theme != 'clean') {
        await import(`../themes/${theme}/css/bootstrap.min.css`);
      }
    }

    console.log(`Resources for theme ${theme} loaded successfully.`);
  } catch (error) {
    console.error(`Failed to load resources for theme ${theme}:`, error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('LA skin initialized');
  loadThemeResources(settings.theme);
});
