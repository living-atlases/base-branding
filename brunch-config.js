// See http://brunch.io for documentation.

// For a different structure than /app/ see:
// https://github.com/brunch/brunch/issues/1676

const fs = require('fs');
const settings = require('./app/js/settings.js');
const toReplace = [/index\.html$/,      // index can be used as your main LA page
                   /errorPage\.html/,   // An error page that can be used in your infrastructure
                   /testPage\.html$/,   // testPate is just for text some headings, buttons, etc
                   /testSmall\.html$/]; // testSmall is for test the footer with small contents

const toReplaceOthers = [/banner\.html$/,
                         /footer\.html$/,
                         /index\.html$/,      // index can be used as your main LA page
                         /errorPage\.html/,   // An error page that can be used in your infrastructure
                         /testPage\.html$/,   // testPate is just for text some headings, buttons, etc
                         /testSmall\.html$/]; // testSmall is for test the footer with small contents

// Don't add head.html above because this replacement is done by ala-boostrap
exports.files = {
  javascripts: {
    joinTo: {
      'js/vendor.js': /^(?!app)/, // Files that are not in `app/js` dir.
      'js/app.js': /^app\/js/
    }
  },
  stylesheets: {
    joinTo: {
      'css/app.css': /^app\/css/
    }
  }
};

exports.plugins = {
  // TODO add eslint
  // This do some var substition in js code:
  jscc: {
    values: {
      _LOCALES_URL: process.env.NODE_ENV === 'development' ? 'http://localhost:3333': settings.baseFooterUrl
    }
  },
  babel: {presets: ['latest']},
  copycat: {
    // just copy ALA default builded files to our build
    // These are loaded by ala-bootstrap3 library, so we need to load manually in our development testPage
    'js': [ 'commonui-bs3-2019/build/js/'],
    'css': [ 'commonui-bs3-2019/build/css/' ],
    'fonts': 'commonui-bs3-2019/build/fonts/',
    verbose : false, // shows each file that is copied to the destination directory
    onlyChanged: true // only copy a file if it's modified time has changed (only effective when using brunch watch)
  },
  // Maybe replace this plugin by: https://github.com/bmatcuk/html-brunch-static
  replacement: {
    replacements: [
      // Right now this file replacements are only done with `brunch build` and not via the watcher
      // So if you edit them, exec `brunch build` later
      { files: toReplace, match: { find: 'HEADLOCAL_HERE', replace: () => {
        // console.log("Replacing local head");
        return fs.readFileSync('app/assets/headLocal.html', 'utf8');
      }}},
      { files: toReplace, match: { find: 'HEAD_HERE', replace: () => {
        // console.log("Replacing head");
        return fs.readFileSync('app/assets/head.html', 'utf8');
      }}},
      { files: toReplace, match: { find: 'BANNER_HERE', replace: () => {
        // console.log("Replacing banner");
        return fs.readFileSync('app/assets/banner.html', 'utf8');
      }}},
      { files: toReplace, match: { find: 'FOOTER_HERE', replace: () => {
        // console.log("Replacing footer");
        return fs.readFileSync('app/assets/footer.html', 'utf8');
      }}},

      // These replacements are done by
      // https://github.com/AtlasOfLivingAustralia/ala-bootstrap3/blob/grails2/grails-app/taglib/au/org/ala/bootstrap3/HeaderFooterTagLib.groovy#L208
      // in the ALA modules that uses it (most of them)

      { files: toReplace, match: { find: '::containerClass::', replace: 'container' }},
      { files: toReplace, match: { find: '::headerFooterServer::', replace:
                                   process.env.NODE_ENV === 'development' ?
                                   'http://localhost:3333':
                                   settings.baseFooterUrl }},
      { files: toReplace, match: { find: '::loginURL::', replace: `${settings.services.cas.url}/cas/login` }},
      { files: toReplace, match: { find: '::logoutURL::', replace: `${settings.services.cas.url}/cas/logout` }},
      { files: toReplace, match: { find: '::searchServer::', replace: settings.services.bie.url }},
      { files: toReplace, match: { find: '::searchPath::', replace: '/search'}},
      { files: toReplace, match: { find: '::centralServer::', replace: settings.mainLAUrl }},


      // These other replacements are only done during build time (and are specific for this skin), so see toReplaceOthers var.
      // Also edit app/js/settings.js before build


      { files: toReplaceOthers, match: { find: '::collectoryURL::', replace: settings.services.collectory.url }},
      { files: toReplaceOthers, match: { find: '::datasetsURL::', replace: `${settings.services.collectory.url}/datasets`
      }},
      { files: toReplaceOthers, match: { find: '::biocacheURL::', replace: settings.services.biocache.url }},
      { files: toReplaceOthers, match: { find: '::bieURL::', replace: settings.services.bie.url }},
      { files: toReplaceOthers, match: { find: '::regionsURL::', replace: settings.services.regions.url }},
      { files: toReplaceOthers, match: { find: '::listsURL::', replace: settings.services.lists.url }},
      { files: toReplaceOthers, match: { find: '::spatialURL::', replace: settings.services.spatial.url }},
      { files: toReplaceOthers, match: { find: '::casURL::', replace: settings.services.cas.url }},
      { files: toReplaceOthers, match: { find: '::imagesURL::', replace: settings.services.images.url }},

      // And just for testing:
      { files: toReplace, match: { find: '::loginStatus::', replace:  process.env.NODE_ENV === 'development' ? 'signedIn': '::loginStatus::' }}

    ]
  },
  // https://www.npmjs.com/package/brunch-browser-sync
  browserSync: {
    port: 3333,
    open: false // Don't open a browser tab on each modification
  }
  // Also:
  // https://github.com/mikefarah/git-digest-brunch
};

exports.conventions = {
  // file won't be compiled and will be just moved to public directory instead
  ignored: [
  ]
};

exports.server = {
  noPushState: true // returns 404 when file not found
  // If you want to test other html page during development
  // indexPath: 'testPage.html'
};

// FIXME, document this
exports.paths = {
  watched: ['app/js', 'app/css', 'app/assets' ]
};

// https://brunch.io/docs/troubleshooting
exports.watcher = {
  awaitWriteFinish: true,
  usePolling: true
}

// exports.optimize = true; // same like brunch build --production
