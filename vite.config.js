import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import multiReplacePlugin from './vite-plugin-multi-replace';
import settings from './app/js/settings.js';
import jscc from 'rollup-plugin-jscc';
import eslintPlugin from 'vite-plugin-eslint';
import { VitePluginRadar } from 'vite-plugin-radar';
import { globSync } from 'tinyglobby';
import { resolveBrand, logoSvg, defaultLogo } from './app/js/utils/brand.js';
import { brandCss, brandTokens, writeBrandAssets, stripFontImports, fontFile } from './scripts/branding.mjs';

const buildTimestamp = Date.now();

// ─── Banner / Head injection architecture ────────────────────────────────────
//
// ala-cas-5 Thymeleaf layout includes <ala:banner> and <ala:footer> but treats
// <ala:head> as a no-op (https://github.com/AtlasOfLivingAustralia/ala-cas-5/issues/29).
// CAS pages therefore never load head.html — only banner.html reaches them.
//
// All normal ALA application pages include banner.html via SSI as well, so
// delivering init via banner gives exactly-once loading on every page including CAS.
//
// Build outputs
// ─────────────
//  dist/banner.html  ← injectInitToBody()       prepends js/jquery-fallback.js + css/init.css + js/init.js
//                    ← injectThemeCssLinks()     prepends theme CSS <link> tags
//
//  dist/js/jquery-fallback.js ← emitJqueryFallback(): jQuery + Bootstrap 3 JS, each guarded
//                       so it only runs when the page lacks it (see "CAS has no jQuery")
//
//  dist/head.html    ← intentionally empty of init (CAS never fetches it)
//
//  dist/js/init.js   ← classic IIFE bundle (BUILD_INIT=1 pass)
//                       stable filename — URL is baked into banner.html at build time
//                       ?v=<timestamp> query string provides per-deploy cache busting
//  dist/css/init.css ← same, companion stylesheet from the IIFE pass
//
// Dual build passes (package.json "build" script)
// ────────────────────────────────────────────────
//  Pass 1 (mainConfig): normal Vite build — ES modules with content-hashed filenames
//          Used by the dev server (HMR) and as the source of truth for test HTML pages.
//  Pass 2 (BUILD_INIT=1 → initLibConfig): lib/IIFE mode — emits js/init.js (stable)
//          This is what banner.html references. Classic <script> (no type=module),
//          no crossorigin attribute → loads cross-origin from the skin host without
//          CORS headers, matching how ala-brunch delivered the script.
//
// CAS has no jQuery
// ─────────────────
//  ala-cas-5's layout.html loads jQuery through the message keys #{webjars.jquerymin.js},
//  jqueryui, jquerycookie and headmin. CAS 5.3 defined them (cas-server-core-web); CAS 6 does
//  not and ala-cas-5 has them commented out, so the page gets src="webjars.jquerymin.js" (404)
//  and no jQuery at all: its Bootstrap JS, its inline $() scripts and our init.js (jquery-i18next)
//  all fail. That is why the brunch banner broke too after the CAS 6 upgrade.
//  So banner.html first loads js/jquery-fallback.js: a classic, parser-blocking script (it has
//  to run before the CAS inline scripts that follow the banner) that defines jQuery and
//  Bootstrap only on that CAS symptom (a literal webjars.jquerymin.js script src) and only when
//  missing. Other ALA/LA apps, and CAS once ala-cas-5 restores the keys, get a no-op, so their
//  jQuery instance, plugins and late-loaded Bootstrap are kept.
//  tests/e2e/cas-login.spec.js reproduces the CAS page to check both cases.
//
// Why `defer` on the injected init <script>
// ──────────────────────────────────────────
//  init.js runs after parsing, once the page's own (or the fallback) jQuery and Bootstrap and the
//  deferred commonui application.js are in place.
//
// ─────────────────────────────────────────────────────────────────────────────

// A theme with no app/themes/<theme> (like 'material', discontinued) builds as 'clean'
const theme = fs.existsSync(`app/themes/${settings.theme}`) ? settings.theme : 'clean';
if (theme !== settings.theme) console.warn(`settings.theme '${settings.theme}' is not in app/themes: using 'clean'`);
const cleanBased = [
  'flatly', 'superhero', 'yeti', 'cosmo', 'darkly', 'paper', 'sandstone', 'simplex', 'slate'
].includes(theme);
const themeAssets = cleanBased || theme === 'clean' ? 'clean' : theme;
const baseUrl = process.env.BASE_BRANDING_URL.replace(/\/+$|^\/+/, '');
// Logo and footer links from settings.js, already HTML-escaped (scripts/branding.mjs)
const brand = brandTokens(settings, baseUrl);

const toReplace = [
  /index\.html$/, /errorPage\.html$/, /testPage\.html$/, /testPageCas\.html$/, /testSmall\.html$/,
  /testPageSpatial\.html$/
];

const toReplaceOthers = [
  /head\.html$/, /banner\.html$/, /footer\.html$/, ...toReplace
];

const r = (files, find, replace) => ({ files, match: { find, replace } });

const fragmentFiles = {
  INDEX_BODY: `app/themes/${themeAssets}/assets/indexBody.html`,
  TEST_BODY: `app/themes/${themeAssets}/assets/testBody.html`,
  HEADLOCAL_HERE: `app/themes/${themeAssets}/assets/headLocal.html`,
  HEAD_HERE: `app/themes/${themeAssets}/assets/head.html`,
  BANNER_HERE: `app/themes/${themeAssets}/assets/banner.html`,
  FOOTER_HERE: `app/themes/${themeAssets}/assets/footer.html`
};

function applyRulesToText(text) {
  return rulesBase.reduce((acc, rule) => {
    const { find, replace } = rule.match;
    return acc.replace(new RegExp(find, 'g'), replace);
  }, text);
}

const rulesBase = [
  r(toReplace, '::containerClass::', 'container'),
  r(toReplace, '::headerFooterServer::', process.env.NODE_ENV === 'development'
    ? 'http://localhost:3333'
    : settings.baseFooterUrl),
  r(toReplace, '::loginURL::', `${settings.services.cas.url}/cas/login`),
  r(toReplace, '::logoutURL::', `${settings.services.cas.url}/cas/logout`),
  r(toReplace, '::searchServer::', settings.services.bie.url),
  r(toReplace, '::searchPath::', '/search'),
  r(toReplace, '::centralServer::', settings.mainLAUrl),
  r(toReplaceOthers, '::collectoryURL::', settings.services.collectory.url),
  r(toReplaceOthers, '::datasetsURL::', `${settings.services.collectory.url}/datasets`),
  r(toReplaceOthers, '::biocacheURL::', settings.services.biocache.url),
  r(toReplaceOthers, '::bieURL::', settings.services.bie.url),
  r(toReplaceOthers, '::regionsURL::', settings.services.regions.url),
  r(toReplaceOthers, '::listsURL::', settings.services.lists.url),
  r(toReplaceOthers, '::spatialURL::', settings.services.spatial.url),
  r(toReplaceOthers, '::casURL::', settings.services.cas.url),
  r(toReplaceOthers, '::imagesURL::', settings.services.images.url),
  // ::centralServer::, ::loginStatus::, ::loginURL::... are left in banner.html and footer.html for
  // the ALA apps to fill at runtime; these are ours and the build fills them everywhere
  ...['brandLogo', 'footerLogo', 'footerLogoClass', 'footerLinks', 'footerSocial', 'langMenu'].map(k => r(toReplaceOthers, `::${k}::`, brand[k]))
];

const replacements = Object.fromEntries(
  Object.entries(fragmentFiles).map(([k, f]) => {
    let raw = fs.readFileSync(f, 'utf8');
    raw = prefixStaticUrls(raw, baseUrl);
    return [k, raw];
  })
);

const rules = [
  ...Object.entries(fragmentFiles).map(([key]) =>
    r(toReplaceOthers, key, replacements[key])
  ),
  ...rulesBase
];

function prefixStaticUrls(html, baseUrl) {
  return html.replace(/(href|src)=["'](css|js|fonts|images)\/(.*?)["']/g, (_, attr, folder, rest) => {
    return `${attr}="${baseUrl}/${folder}/${rest}"`;
  });
}

function virtualGlobalCss() {
  const cssFiles = globSync('app/css/*.css', { onlyFiles: true });
  const content = cssFiles.map(f => `import '/${f}';`).join('\n');

  return {
    name: 'virtual-global-css',
    resolveId(id) {
      if (id === 'virtual:global-css') return id;
    },
    load(id) {
      if (id === 'virtual:global-css') return content;
    }
  };
}

// Fragments with no <body> that must NOT receive the init script.
const skipInjectionFragments = ['head.html', 'footer.html'];

// Inject the branding JS so it loads on every page — including CAS pages.
// CAS does NOT include head.html (https://github.com/AtlasOfLivingAustralia/ala-cas-5/issues/29),
// so the script can only ride along in banner.html (the fragment CAS does
// include). In production it is emitted as a single self-contained CLASSIC
// (IIFE) bundle at the stable path js/init.js and injected as a plain
// <script src> — no type=module, no crossorigin — so the CAS page can load it
// cross-origin from the skin host WITHOUT CORS (matches the brunch behaviour).
//
// Prod: inject ONLY into banner.html — all pages include banner server-side, so
// init loads exactly once everywhere (CAS included). No duplication.
// Dev: inject into full pages (banner injection not applicable in dev mode).
// Cache-busting via ?v=buildTimestamp query string (filename is stable, no hash).
function injectInitToBody() {
  return {
    name: 'inject-init-to-body',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const shouldSkip = skipInjectionFragments.some(f => ctx.path.endsWith(f));
        if (shouldSkip) return html;

        const prod = !!ctx.bundle;
        const isBannerFragment = ctx.path.endsWith('banner.html') && !html.includes('<body');
        const hasBody = html.includes('<body');

        // Prod: only banner.html (ALA apps + CAS include banner via SSI — no duplication)
        // Dev:  full pages only (banner is inlined from source, SSI not applicable)
        if (prod && !isBannerFragment) return html;
        if (!prod && !hasBody) return html;

        const src = prod ? `${baseUrl}/js/init.js?v=${buildTimestamp}` : '/app/js/init.js';
        const cssSrc = prod ? `${baseUrl}/css/init.css?v=${buildTimestamp}` : null;
        const attrs = prod ? { src, defer: true } : { type: 'module', src };
        const cssTag = cssSrc ? `<link rel="stylesheet" href="${cssSrc}">` : '';
        const fallbackTag = `<script src="${baseUrl}/js/jquery-fallback.js?v=${buildTimestamp}"></script>`;
        const scriptTag = prod
          ? `<script src="${src}" defer></script>`
          : `<script type="module" src="${src}"></script>`;

        if (isBannerFragment) {
          return fallbackTag + '\n' + cssTag + '\n' + scriptTag + '\n' + html;
        }
        // Dev: inject into body-prepend of full pages
        return { html, tags: [{ tag: 'script', attrs, injectTo: 'body-prepend' }] };
      }
    }
  };
}

// Theme CSS of banner.html (and of the local pages): css/la-tokens.css, then the Bootswatch
// bootstrap.min.css of a clean-based theme, then the clean (or your own theme's) CSS on top of it.
function injectThemeCssLinks(theme) {
  const files = [
    'css/la-tokens.css',
    ...(cleanBased ? globSync(`app/themes/${settings.theme}/css/*.css`, { onlyFiles: true }) : []),
    ...globSync(`app/themes/${theme}/css/*.css`, { onlyFiles: true }).sort()
  ];

  return {
    name: 'inject-theme-css-links',
    transformIndexHtml(html, ctx) {
      const hasHead = html.includes('<head>') || ctx.path.endsWith('head.html');
      // banner.html has no <head> but CAS only includes banner — inject theme CSS
      // as raw prepended links so the CAS page gets the theme styles.
      const isBannerFragment = ctx.path.endsWith('banner.html') && !html.includes('<body');
      if (isBannerFragment && ctx.bundle) {
        const rawLinks = files
          .map(file => `<link rel="stylesheet" href="${baseUrl}/${file}" data-theme="${theme}">`)
          .join('\n');
        return rawLinks + '\n' + html;
      }
      const links = hasHead
        ? files.map(file => ({
            tag: 'link',
            attrs: {
              rel: 'stylesheet',
              href: `${baseUrl}/${file}`,
              'data-theme': theme
            },
            injectTo: 'head'
          }))
        : [];
      return { html, tags: links };
    }
  };
}

// css/la-tokens.css, fonts/<font>/ and images/logo.svg: generated from settings.js, served by the dev server and
// written into dist/ by the main build pass
function brandAssets() {
  return {
    name: 'brand-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0];
        if (url === '/css/la-tokens.css') {
          res.setHeader('Content-Type', 'text/css');
          return res.end(brandCss(settings));
        }
        const brand = resolveBrand(settings);
        if (url === `/${defaultLogo}` && brand.logo === defaultLogo) {
          res.setHeader('Content-Type', 'image/svg+xml');
          return res.end(logoSvg(brand));
        }
        const font = url.match(/^\/fonts\/([\w-]+)\/([\w.-]+\.woff2)$/);
        if (font) {
          const f = fontFile(font[1], font[2]);
          if (f) {
            res.setHeader('Content-Type', 'font/woff2');
            return res.end(fs.readFileSync(f));
          }
        }
        next();
      });
    },
    closeBundle() {
      if (process.env.BUILD_INIT) return; // only the main pass
      writeBrandAssets(settings, path.resolve(__dirname, 'dist'));
      stripFontImports(path.resolve(__dirname, 'dist/css'));
    }
  };
}

function hotReloadFragments() {
  const watched = new Set(Object.values(fragmentFiles).map(f => path.resolve(f)));
  return {
    name: 'hot-reload-fragments',
    handleHotUpdate({ file, server }) {
      const abs = path.resolve(file);
      if (!watched.has(abs)) return;
      for (const [key, fragPath] of Object.entries(fragmentFiles)) {
        if (path.resolve(fragPath) === abs) {
          let raw = fs.readFileSync(abs, 'utf8');
          raw = prefixStaticUrls(raw, baseUrl);
          raw = applyRulesToText(raw, abs);
          replacements[key] = raw;
        }
      }
      server.ws.send({ type: 'full-reload' });
    }
  };
}

// Generate the Spatial Portal (spatial-hub) skin layout.
//
// spatial-hub runs as a fat WAR with precompiled GSPs, so its portal.gsp (hardcoded ALA
// header) can't be overridden by a volume mount. Instead spatial-hub's BootStrap.groovy
// registers an external views/assets resolver: a layout GSP dropped at
//   /data/spatial-hub/views/layouts/<name>.gsp
// is used when skin.layout=<name>. We emit such a layout with the ALA header replaced by a
// Living Atlas navbar. Only ::variable:: URL tokens are substituted at build time; the GSP's
// own ${grailsApplication...} expressions and <asset:*>/<g:*>/<hf:*>/<ala:*> tags are left
// untouched (no prefixStaticUrls, no init/theme-CSS injection — those are for banner.html).
//
// Output: dist/spatial/views/layouts/spatial-layout.gsp
// (the companion CSS is copied to dist/spatial/assets via copyCommands)
function generateSpatialLayout() {
  const srcGsp = 'app/spatial/spatial-layout.gsp';
  return {
    name: 'generate-spatial-layout',
    apply: 'build',
    closeBundle() {
      if (process.env.BUILD_INIT) return; // only the main pass emits the skin
      if (!fs.existsSync(srcGsp)) return;
      const gsp = applyRulesToText(fs.readFileSync(srcGsp, 'utf8'));
      const outDir = path.resolve(__dirname, 'dist/spatial/views/layouts');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'spatial-layout.gsp'), gsp);
    }
  };
}

// Emit dist/js/jquery-fallback.js, loaded first by banner.html (see "CAS has no jQuery").
// The commonui jQuery and Bootstrap 3 builds are wrapped in guards so they only run on pages
// that lack them. A plain synchronous file (not injected markup) also works on slow connections.
function emitJqueryFallback() {
  const vendor = 'commonui-bs3-2019/build/js';
  return {
    name: 'emit-jquery-fallback',
    apply: 'build',
    closeBundle() {
      if (process.env.BUILD_INIT) return; // only the main pass
      const read = f => fs.readFileSync(path.resolve(__dirname, vendor, f), 'utf8');
      // Only on the CAS 6 symptom (the literal message key as script src, already parsed in <head>):
      // other apps may load jQuery/Bootstrap after the banner and must not get a second copy.
      const js = [
        '/* Loaded by banner.html: jQuery and Bootstrap 3 JS for CAS 6 pages, which lack them. */',
        'if (document.querySelector(\'script[src$="webjars.jquerymin.js"]\')) {',
        'if (!window.jQuery) {', read('jquery.min.js'), '}',
        'if (window.jQuery && !window.jQuery.fn.collapse) {', read('bootstrap.min.js'), '}',
        '}',
        ''
      ].join('\n');
      const outDir = path.resolve(__dirname, 'dist/js');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'jquery-fallback.js'), js);
    }
  };
}

// Dev-only: full-reload the preview when the Spatial skin sources change. The header CSS is
// served by vite-plugin-static-copy (outside Vite's module graph, so no automatic HMR); this
// watches app/spatial/** and reloads so testPageSpatial.html reflects edits live.
function hotReloadSpatial() {
  const dir = path.resolve(__dirname, 'app/spatial');
  return {
    name: 'hot-reload-spatial',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(dir);
      server.watcher.on('change', file => {
        if (path.resolve(file).startsWith(dir)) server.ws.send({ type: 'full-reload' });
      });
    }
  };
}

const copyCommands = [
  { src: 'commonui-bs3-2019/build/js/*', dest: 'js' },
  { src: 'commonui-bs3-2019/build/css/*', dest: 'css' },
  { src: 'commonui-bs3-2019/build/fonts/*', dest: 'fonts' },
  { src: 'app/assets/*', dest: '' },
  { src: `app/themes/${themeAssets}`, dest: 'app/themes/' },
  // A bootswatch theme only brings its css, and the glyphicon urls in it are relative to the
  // theme (../fonts/), so it needs the fonts next to its css as 'clean' has them. Both targets
  // copy contents, so neither races the other creating app/themes/<theme>
  ...(cleanBased ? [{ src: `app/themes/${theme}/*`, dest: `app/themes/${theme}` },
    { src: 'app/themes/clean/fonts/*', dest: `app/themes/${theme}/fonts` }] : []),
  // Highcharts, loaded on demand by the chart widgets (app/js/widgets/charts.js)
  { src: 'node_modules/highcharts/highcharts.js', dest: 'js/highcharts' },
  { src: 'node_modules/highcharts/modules/drilldown.js', dest: 'js/highcharts' },
  { src: 'app/assets/images/*', dest: 'images' },
  { src: 'app/assets/locales/*', dest: 'locales' }
];

// Second build pass (BUILD_INIT=1): emit app/js/init.js as one standalone
// classic IIFE bundle at the stable name js/init.js, keeping the main HTML
// build output (emptyOutDir:false). This is what the banner injection points
// to in production.
const initLibConfig = defineConfig({
  base: `${baseUrl}/`,
  plugins: [jscc({ values: { _LOCALES_URL: baseUrl, _BUILD_ID: buildTimestamp, _DEBUG: 1 } })],
  build: {
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, 'app/js/init.js'),
      formats: ['iife'],
      name: 'AlaBranding',
      fileName: () => 'js/init.js'
    },
    rollupOptions: {
      output: { assetFileNames: () => 'css/init.css' }
    }
  }
});

const mainConfig = defineConfig({
  base: `${baseUrl}/`,
  assetsInclude: ['app/assets/*.ico', 'app/assets/images/*', 'app/assets/locales/**/*'],
  plugins: [
    eslintPlugin(),
    multiReplacePlugin(rules),
    virtualGlobalCss(),
    hotReloadFragments(),
    viteStaticCopy({ targets: copyCommands }),
    injectInitToBody(),
    injectThemeCssLinks(themeAssets),
    brandAssets(),
    generateSpatialLayout(),
    emitJqueryFallback(),
    hotReloadSpatial(),
    jscc({ values: { _LOCALES_URL: baseUrl, _BUILD_ID: buildTimestamp, _DEBUG: 1 } }),
    VitePluginRadar({ analytics: { id: settings.analytics.googleId } }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        init: path.resolve(__dirname, 'app/js/init.js'),
        errorPage: path.resolve(__dirname, 'errorPage.html'),
        testPage: path.resolve(__dirname, 'testPage.html'),
        testPageCas: path.resolve(__dirname, 'testPageCas.html'),
        testSmall: path.resolve(__dirname, 'testSmall.html'),
        testPageSpatial: path.resolve(__dirname, 'testPageSpatial.html'),
        head: path.resolve(__dirname, 'head.html'),
        banner: path.resolve(__dirname, 'banner.html'),
        footer: path.resolve(__dirname, 'footer.html')
      },
      output: {
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: 'css/[name].[hash].css',
        dir: 'dist',
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('app/js')) return 'app';
          if (cleanBased && id.includes('app/themes/clean/js')) return 'app';
          if (id.includes(`app/themes/${theme}/js`)) return 'app';
          if (id.includes('app/css')) return 'app';
          if (cleanBased && id.includes('app/themes/clean/css')) return 'app';
          if (id.includes(`app/themes/${theme}/css`)) return 'app';
          if (id.includes(`app/themes/${theme}/fonts`)) return 'app';
        }
      },
      external: [
        'js/jquery.min.js',
        'js/jquery-migration.min.js',
        'js/bootstrap.js',
        'js/autocomplete.js',
        'js/application.js',
        'css/bootstrap.min.css',
        'css/bootstrap-theme.min.css',
        'css/ala-styles.min.css',
        'css/ala-theme.min.css',
        'css/autocomplete.min.css',
        'css/autocomplete-extra.min.css',
        'css/font-awesome.min.css'
      ]
    },
    cssCodeSplit: true
  },
  server: {
    port: 3333,
    open: false,
    hmr: true,
    watch: { usePolling: true }
  }
});

export default process.env.BUILD_INIT ? initLibConfig : mainConfig;

