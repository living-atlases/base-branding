import './settings.js';
import './index-auth.js';
import './i18next-config.js';
import './mante.js';
import './widgets/index.js'; // optional home widgets: settings.homeWidgets
import './footer-bottom.js'; // the footer at the bottom of the window on short pages
import './autocomplete-conf.js';
import 'url-polyfill'; // for URL() usage in older browsers

// ALA's commonui application.js (bs3 and bs5) calls fathom.trackEvent() on BIE tab clicks without
// checking Fathom is loaded; LA portals don't load it, so give it a no-op unless a real one exists.
window.fathom = window.fathom || { trackEvent() {}, trackPageview() {}, trackGoal() {} };
