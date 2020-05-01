(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    var val = aliases[name];
    return (val && name !== val) ? expandAlias(val) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (bundle && typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = typeof window === 'undefined' ? this : window;
var process;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("js/i18next-config.js", function(exports, require, module) {
'use strict';

var settings = require('./settings');
var i18n = require('i18next');
var jqueryI18next = require('jquery-i18next');
// var backend = require('i18next-xhr-backend');
var Backend = require('i18next-service-backend').default;
var lngDetector = require('i18next-browser-languagedetector');
var cache = require('i18next-localstorage-cache');
var Url = require('domurl');
var Cookies = require('js-cookie');

// We use this backend as remote because subdomains.l-a.site should request to l-a.site domain
var backOpts = {
  // service url to the backend service
  // i.e. https://api.spacetranslate.com or https://api.locize.io
  service: 'http://localhost:3333',
  projectId: '',
  apiKey: '',
  referenceLng: 'en',
  version: 'locales'
};
var backend = new Backend();
backend.init(null, backOpts);

var currentUrl = new Url();

var laSessionCookie = 'la-lang-session';

var i18nOpts = {
  backend: backOpts,
  //  lng: 'es',
  fallbackLng: {
    zh: ['en'],
    "sw-TZ": ['en'],
    default: ['en']
  },
  sendMissingTo: 'fallback',
  interpolation: {
    escapeValue: false,
    formatSeparator: ',',
    format: function f(value, format, lng) {
      // https://www.i18next.com/formatting.html
      // console.log(`Value: ${value} with format: ${format} to lang: ${lng}`);
      if (format === 'uppercase') return value.toUpperCase();
      if (value instanceof Date) return moment(value).format(format);
      if (format === 'number') return Intl.NumberFormat(lng).format(value);
      return value;
    }
  },
  whitelist: settings.enabledLangs,
  load: 'languageOnly', // 'es' o 'en', previously: 'all', // es-ES -> es, en-US -> en
  debug: true,
  ns: 'common',
  defaultNS: 'common',
  saveMissing: true, // if true seems it's fails to getResourceBundle
  saveMissingTo: 'en',
  keySeparator: 'ß',
  nsSeparator: 'ð',
  pluralSeparator: 'đ'
};

var detectorOptions = {
  // order and from where user language should be detected
  order: ['querystring', 'cookie', 'navigator', 'localStorage', 'htmlTag'],

  // keys or params to lookup language from
  lookupQuerystring: 'lang',
  lookupCookie: 'i18next',
  lookupLocalStorage: 'i18nextLng',
  cookieMinutes: 525600, // a year
  // cache user language on
  caches: ['cookie'],
  excludeCacheFor: ['cimode'] // languages to not persist (cookie, localStorage)
};

if (document.location.host !== 'localhost:3333') {
  // We set the upper domain in production so all ALA modules get the same locale
  detectorOptions.cookieDomain = settings.mainDomain;
}

var cacheOptions = {
  // turn on or off
  enabled: false,
  // prefix for stored languages
  prefix: 'i18next_res_',
  // expiration
  expirationTime: 7 * 24 * 60 * 60 * 1000,
  // language versions
  versions: {}
};

i18nOpts.cache = cacheOptions;
i18nOpts.detection = detectorOptions;

i18nOpts.sendMissing = false;
i18nOpts.missingKeyHandler = function miss(lng, ns, key, defaultValue) {
  // call to some API here
  console.log('"' + key + '": "' + defaultValue + '"');
};

i18n.on('languageChanged', function (lng) {
  if (i18n.services.languageDetector) {
    console.log('On lang changed ' + lng);
    // Store in the cookie the selection
    i18n.services.languageDetector.cacheUserLanguage(lng);
  }
});

(function ($) {
  i18n.use(backend).use(lngDetector).use(cache).init(i18nOpts, function (err, t) {
    // initialized and ready to
    if (err) {
      console.error(err);
      return;
    }
    console.log('Language initialized: ' + i18n.language);
    jqueryI18next.init(i18n, $, { i18nName: 'i18next' });
    console.log('jquery i18next initialized');
    $("body").localize();

    $('.locale-link').on('click', function (e) {
      e.preventDefault();
      var lang = $(this).data('locale');
      console.log('Lang clicked ' + lang);

      i18n.changeLanguage(lang);

      // Change ?lang param and reload
      currentUrl.query.lang = lang;
      document.location.search = currentUrl.query;
    });

    if (typeof Cookies.get(laSessionCookie) === 'undefined' && typeof currentUrl.query.lang === 'undefined') {
      // Workaround to set grails locale
      // This will use to do a unique lang redirect (to force grails to set the lang for the session)
      var in30Minutes = 1 / 48;
      // grails default session lifetime is 30min
      Cookies.set(laSessionCookie, '/', { expires: in30Minutes });
      currentUrl.query.lang = i18n.language;
      document.location.search = currentUrl.query;
    }

    // cookies eu consent
    /* const cookiesOpt = {
     *   cookieTitle: t('Uso de Cookies'),
     *   cookieMessage: t('Utilizamos cookies para asegurar un mejor uso de nuestra web. Si continúas navegando, consideramos que aceptas su uso'),
     *   showLink: false,
     *   position: 'bottom',
     *   linkText: 'Lee más',
     *   linkRouteName: '/privacy',
     *   acceptButtonText: t('Aceptar'),
     *   html: false,
     *   expirationInDays: 70,
     *   forceShow: false
     * };
     */
    // CookieConsent.init(cookiesOpt);
  });
})(jQuery);
});

require.register("js/index-auth.js", function(exports, require, module) {
'use strict';

var Cookies = require('js-cookie');
var settings = require('./settings');
var authCookieName = 'ALA-Auth';
var loginClass = 'signedIn';
var logoutClass = 'signedOut';

var loginStatusInIndex = function loginStatusInIndex() {
  if ((document.location.origin === settings.mainLAUrl || document.location.host === 'localhost:3333') && document.location.pathname === '/') {
    if (settings.isDevel) console.log("We are in the main url, let's see if we are authenticated");
    // As this page is plain html, we have to detect if with are authenticated via Cookies
    // NOTE: For make this work you need ala.cookie.httpOnly to false in /data/cas/config/application.yml
    // We should use another way to see if it's authenticated

    var authCookie = Cookies.get(authCookieName, { domain: settings.mainDomain, path: '/' });
    var in30Minutes = 1 / 48;

    if (typeof authCookie === 'undefined' && document.location.host === 'localhost:3333') {
      console.log("We set a test cookie if we are in development");
      Cookies.set(authCookieName, '/', { expires: in30Minutes });
    }

    if (typeof authCookie !== 'undefined') {
      // https://github.com/AtlasOfLivingAustralia/ala-bootstrap3/blob/master/grails-app/taglib/au/org/ala/bootstrap3/HeaderFooterTagLib.groovy
      if (settings.isDevel) console.log("Auth cookie present so logged in");
      $("#drawer-nav-menu").removeClass("::loginStatus::").addClass("signedIn");
    } else {
      if (settings.isDevel) console.log("No auth cookie not present so not-logged in");
      $("#drawer-nav-menu").removeClass("::loginStatus:").addClass("signedOut");
    }
  } else {
    if (settings.isDevel) console.log("We aren't in the main url");
  }
};

$(function () {
  // wait til drawer elements are visible
  var checkExist = setInterval(function () {
    if (window.jQuery) {
      clearInterval(checkExist);
      loginStatusInIndex();
    } else {
      if (settings.isDevel) console.log("jquery not loaded");
    }
  }, 1000);
});
});

require.register("js/init.js", function(exports, require, module) {
'use strict';

require('./settings.js').default;
require('./index-auth.js');
require('./i18next-config.js');
require('./mante.js');
require('./stats.js');

document.addEventListener('DOMContentLoaded', function () {
  console.log('LA skin initialized');
});
});

require.register("js/mante.js", function(exports, require, module) {
"use strict";

var settings = require('./settings');

$(function () {
  if (settings.inMante) {
    console.log("Setting manteinance banner");

    var manteDiv = "<div class=\"row\">\n    <div class=\"col-md-6\">\n      <div class=\"error-template\">\n        <h1 data-i18n=\"error.title\"></h1>\n        <h2 data-i18n=\"error.subtitle\"></h2>\n        <div>\n          <p data-i18n=\"error.description\"></p>\n        </div>\n        <div class=\"error-actions\">\n          <a data-i18n=\"error.button\" href=\"" + settings.mainLAUrl + "\" style=\"margin-top: 10px;\" class=\"btn btn-primary btn-lg\"></a>\n        </div>\n      </div>\n    </div>\n    <div class=\"col-md-6\">\n      <img src=\"images/error.svg\" alt=\"Error Image\" onerror=\"this.onerror=null; this.src='images/error.png'\">\n    </div>\n  </div>";
    $("#mante-container").html(manteDiv);
    $("#mante-container").show();
  }
});
});

require.register("js/settings.js", function(exports, require, module) {
'use strict';

module.exports = {
  isDevel: true,
  inMante: false, // set to true and deploy if you want to set a maintenance message in all the services
  enabledLangs: ['en', 'es', 'zh', 'sw'],
  mainDomain: 'l-a.site', // used for cookies (without http/https)
  mainLAUrl: 'https://l-a.site',
  baseFooterUrl: 'https://l-a.site',
  services: {
    collectory: { url: 'https://collections.l-a.site', title: 'Collections' },
    biocache: { url: 'https://biocache.l-a.site', title: 'Occurrence records' },
    biocacheService: { url: 'https://biocache-ws.l-a.site', title: 'Occurrence records webservice' },
    bie: { url: 'https://especies.gbif.es', title: 'Species' },
    bieDis: { url: 'https://species.l-a.site', title: 'Species' },
    regions: { url: 'https://regions.l-a.site', title: 'Regions' },
    lists: { url: 'https://lists.l-a.site', title: 'Species List' },
    spatial: { url: 'https://spatial.l-a.site', title: 'Spatial Portal' },
    images: { url: 'https://images.l-a.site', title: 'Images Service' },
    cas: { url: 'https://auth.l-a.site', title: 'CAS' }
  },
  otherLinks: [{ title: 'Datasets', url: 'https://collections.l-a.site/datasets' }, { title: 'Explore your area', url: 'http://biocache.l-a.site/explore/your-area/' }, { title: 'Datasets', url: 'https://collections.l-a.site/datasets' }, { title: 'twitter', url: '', icon: 'twitter' }]
};
});

;require.register("js/stats.js", function(exports, require, module) {
'use strict';

var settings = require('./settings');
// FIXME var { locale } = require('./i18n_init');

var _require = require('countup.js'),
    CountUp = _require.CountUp;

var collectory = settings.services.collectory.url;
var biocacheService = settings.services.biocacheService.url;

var setCounter = function setCounter(id, val, onEnd) {
  var options = {
    separator: ',', // FIXME  locale === 'en' ? ',': '.',
    duration: 1
  };
  // If testing set some dummy value
  if (val === 0 && settings.isDevel) {
    val = 123456;
  }
  options.startVal = Math.round(val - val * 4 / 100); // we increment only a %
  console.log('Start val ' + options.startVal + ' to ' + val);
  var countUp = new CountUp(id, val, options);
  if (!countUp.error) {
    countUp.start(function () {
      $('#' + id).addClass('loaded_stats');if (typeof onEnd !== 'undefined') onEnd();
    });
  } else {
    console.error(countUp.error);
  }
};

var getStats = function getStats(url, callback) {
  if (settings.isDevel) {
    if (url.indexOf('species') > -1) callback([{ count: 10402 }]);else callback({ totalRecords: 86965283, total: 12922 });
  } else {
    // Real call in production
    $.getJSON(url, callback);
  }
};

// If you want to show collections stats:
// `${collectory}/ws/dataResource/count`
var loadStats = function loadStats() {
  getStats(biocacheService + '/occurrences', function (data) {
    setCounter('stats_occurrences', data.totalRecords, function () {
      return getStats(collectory + '/ws/dataResource/count', function (data) {
        setCounter('stats_datasets', data.total, function () {
          return getStats(collectory + '/ws/institution/count', function (data) {
            setCounter('stats_institutions', data.total);
          });
        });
      });
    });
  });
  // Right now this is slow so we put here
  getStats(biocacheService + '/occurrence/facets?q=*:*&facets=species&pageSize=0', function (data) {
    setCounter("stats_species", data[0].count);
  });
};

document.addEventListener("DOMContentLoaded", function () {
  if ((document.location.origin === settings.mainLAUrl || document.location.host === 'localhost') && document.location.pathname === '/') {
    // only load stats on /
    loadStats();
  }
});
});

require.alias("process/browser.js", "process");process = require('process');require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map