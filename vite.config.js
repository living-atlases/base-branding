import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import multiReplacePlugin from './vite-plugin-multi-replace';
import settings from './app/js/settings.js';
import jscc from 'rollup-plugin-jscc';
import Inspect from 'vite-plugin-inspect';

const theme = settings.theme;
const cleanBased = ['flatly', 'superhero', 'yeti', 'cosmo', 'darkly', 'paper', 'sandstone', 'simplex', 'slate'].includes(theme);
const themeAssets = cleanBased || theme === 'clean' ? 'clean' : theme;

const baseUrl = process.env.BASE_BRANDING_URL;

const replacements = {
  'INDEX_BODY': fs.readFileSync(`app/themes/${themeAssets}/assets/indexBody.html`, 'utf8'),
  'TEST_BODY': fs.readFileSync(`app/themes/${themeAssets}/assets/testBody.html`, 'utf8'),
  'HEADLOCAL_HERE': fs.readFileSync(`app/themes/${themeAssets}/assets/headLocal.html`, 'utf8'),
  'HEAD_HERE': fs.readFileSync(`app/themes/${themeAssets}/assets/head.html`, 'utf8'),
  'BANNER_HERE': fs.readFileSync(`app/themes/${themeAssets}/assets/banner.html`, 'utf8'),
  'FOOTER_HERE': fs.readFileSync(`app/themes/${themeAssets}/assets/footer.html`, 'utf8'),
  '::containerClass::': 'container',
  '::headerFooterServer::': baseUrl,
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
};

const copyCommands = [
  { src: 'commonui-bs3-2019/build/js/*', dest: 'js' },
  { src: 'commonui-bs3-2019/build/css/*', dest: 'css' },
  { src: 'commonui-bs3-2019/build/fonts/*', dest: 'fonts' },
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
  assetsInclude: ['app/assets/*.ico', 'app/assets/images/*', 'app/assets/locales/**/*' ],
  plugins: [
    // Inspect(),
    multiReplacePlugin(replacements),
    viteStaticCopy({ targets: copyCommands }),
    jscc({
      values: { _LOCALES_URL: baseUrl, _DEBUG: 1 },
    })
  ],
  build: {
    // sourceMaps: true,
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
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('app/js')) {
            return 'app';
          }
          if (cleanBased && id.includes('app/themes/clean/js')) {
            return 'app';
          }
          if (id.includes(`app/themes/${theme}/js`)) {
            return 'app';
          }
          if (id.includes('app/css')) {
            return 'app';
          }
          if (cleanBased && id.includes('app/themes/clean/css')) {
            return 'app';
          }
          if (id.includes(`app/themes/${theme}/css`)) {
            return 'app';
          }
        }
      },
      external: [
        "js/jquery.min.js",
        "js/jquery-migration.min.js",
        "js/bootstrap.js",
        "js/autocomplete.js",
        "js/application.js",
        "css/bootstrap.min.css",
        "css/bootstrap-theme.min.css",
        "css/ala-styles.min.css",
        "css/ala-theme.min.css",
        "css/autocomplete.min.css",
        "css/autocomplete-extra.min.css",
        "css/font-awesome.min.css"
      ]
    },
    cssCodeSplit: false,
    watch: {
      // https://rollupjs.org/configuration-options/#watch
    }
  },
  server: {
    port: 3333,
    open: false,
    hmr: true,
    watch: {
      usePolling: true
    }
  }
});
