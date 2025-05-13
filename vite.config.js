import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import multiReplacePlugin from './vite-plugin-multi-replace';
import settings from './app/js/settings.js';
import jscc from 'rollup-plugin-jscc';
import eslintPlugin from 'vite-plugin-eslint';

const theme = settings.theme;
const cleanBased = ['flatly', 'superhero', 'yeti', 'cosmo', 'darkly', 'paper', 'sandstone', 'simplex', 'slate'].includes(theme);
const themeAssets = cleanBased || theme === 'clean' ? 'clean' : theme;

const baseUrl = process.env.BASE_BRANDING_URL.replace(/\/+$/, '');;

import glob from 'fast-glob';

function virtualGlobalCss() {
  const cssFiles = glob.sync('app/css/*.css', { onlyFiles: true });
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

function injectThemeCssLinks(theme) {
  const themePath = `app/themes/${theme}/css/*.css`;
  const files = glob.sync(themePath, { onlyFiles: true });

  return {
    name: 'inject-theme-css-links',
    transformIndexHtml(html) {
      const links = files.map(file => ({
        tag: 'link',
        attrs: {
          rel: 'stylesheet',
          href: `${baseUrl}/${file}`,
          'data-theme': theme
        },
        injectTo: 'head'
      }));
      return { html, tags: links };
    }
  };
}

function prefixStaticUrls(html, baseUrl) {
  return html.replace(/(href|src)=["'](css|js|fonts|images)\/(.*?)["']/g, (_, attr, folder, rest) => {
    return `${attr}="${baseUrl}/${folder}/${rest}"`;
  });
}

const fragmentFiles = {
  INDEX_BODY: `app/themes/${themeAssets}/assets/indexBody.html`,
  TEST_BODY: `app/themes/${themeAssets}/assets/testBody.html`,
  HEADLOCAL_HERE: `app/themes/${themeAssets}/assets/headLocal.html`,
  HEAD_HERE: `app/themes/${themeAssets}/assets/head.html`,
  BANNER_HERE: `app/themes/${themeAssets}/assets/banner.html`,
  FOOTER_HERE: `app/themes/${themeAssets}/assets/footer.html`
};

const replacements = Object.fromEntries(
  Object.entries(fragmentFiles).map(([k, f]) => {
    const raw = fs.readFileSync(f, 'utf8');
    return [k, prefixStaticUrls(raw, baseUrl)];
  })
);

Object.assign(replacements, {
  '::containerClass::': 'container',
  '::headerFooterServer::': process.env.NODE_ENV === 'development' ? 'http://localhost:3333' : baseUrl,
  '::loginURL::': `${settings.services.cas.url}/cas/login`,
  '::logoutURL::': `${settings.services.cas.url}/cas/logout`,
  '::searchServer::': settings.services.bie.url,
  '::searchPath::': '/search',
  '::centralServer::': settings.mainLAUrl,
  '::collectoryURL::': settings.services.collectory.url,
  '::datasetsURL::': `${settings.services.collectory.url}/datasets`,
  '::biocacheURL::': settings.services.biocache.url,
  '::bieURL::': settings.services.bie.url,
  '::regionsURL::': settings.services.regions.url,
  '::listsURL::': settings.services.lists.url,
  '::spatialURL::': settings.services.spatial.url,
  '::casURL::': settings.services.cas.url,
  '::imagesURL::': settings.services.images.url,
  '::loginStatus::': process.env.NODE_ENV === 'development' ? 'signedIn' : '::loginStatus::'
});

function hotReloadFragments() {
  const watched = new Set(Object.values(fragmentFiles).map(f => path.resolve(f)));
  return {
    name: 'hot-reload-fragments',
    handleHotUpdate({ file, server }) {
      const abs = path.resolve(file);
      if (!watched.has(abs)) return;
      for (const [key, fragPath] of Object.entries(fragmentFiles)) {
        if (path.resolve(fragPath) === abs) {
          replacements[key] = fs.readFileSync(abs, 'utf8');
        }
      }
      server.ws.send({ type: 'full-reload' });
    }
  };
}

const copyCommands = [
  { src: 'commonui-bs3-2019/build/js/*', dest: 'js' },
  { src: 'commonui-bs3-2019/build/css/*', dest: 'css' },
  { src: 'commonui-bs3-2019/build/fonts/*', dest: 'fonts' },
  { src: 'app/assets/fonts/*', dest: 'fonts' },
  { src: 'app/assets/*', dest: '' },
  { src: 'app/assets/images/*', dest: 'images' },
  { src: 'app/assets/locales/*', dest: 'locales' }
];

if (theme === 'material') {
  copyCommands.push(
    { src: 'app/themes/material/material-lite/*', dest: 'material-lite' },
    { src: 'app/themes/material/custom-bootstrap/*', dest: 'custom-bootstrap' }
  );
}

export default defineConfig({
  base: `${baseUrl}/`,
  assetsInclude: ['app/assets/*.ico', 'app/assets/images/*', 'app/assets/locales/**/*'],
  plugins: [
    eslintPlugin(),
    multiReplacePlugin(replacements),
    injectThemeCssLinks(themeAssets),
    virtualGlobalCss(),
    hotReloadFragments(),
    viteStaticCopy({ targets: copyCommands }),
    jscc({ values: { _LOCALES_URL: baseUrl, _DEBUG: 1 } })
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        errorPage: path.resolve(__dirname, 'errorPage.html'),
        testPage: path.resolve(__dirname, 'testPage.html'),
        testSmall: path.resolve(__dirname, 'testSmall.html')
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

