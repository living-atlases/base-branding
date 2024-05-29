import settings from './settings.js';
import './index-auth.js';
import './i18next-config.js';
import './mante.js';
import './stats.js';
import './autocomplete-conf.js';
// This loads all the css in app/css
import './import-css.js';

// And this only the themes one (as import glob does not allow use of variables only literals)
// If you use a custom theme, you can remove this and load your css directly
async function loadThemeResources(theme) {
  try {
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
