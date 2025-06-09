## Introduction

This is a base branding for new Living Atlas deployments. That is, some ALA header, banner and footer theme with:

- Good integration with ALA modules trying to avoid jquery conflicts and similar
- Good integration with `CAS` Authentication
- Multilingual
- Modern javascript code without lost of compatibility with old browsers
- Digest usage for skip cache old js/css when we release a new version

You can use this as a basis for a new LA infrastructure branding or just to see how you can integrate your branding with ALA dependencies, etc.

## Strategy 

A LA compatible branding consist (currently) in a Bootstrap v3 footer and header html/css/js files that are loaded by all ALA java modules. But also some resources (like fonts, js/css dependencies, etcetera) are loaded from this branding (like jQuery or Bootstrap). 

In other words, we can have our custom html with our custom look & feel, image, css, menus, and still we need to put in our branding some common libs and resources that should be loaded by the ALA modules (like bootstrap, jquery and other js libs).

Our strategy is to keep our brandings in sync with these dependencies easily. For this we just copy all that resources from the [ALA current branding](https://github.com/AtlasOfLivingAustralia/commonui-bs3-2019/) that is included in this repository as a [git submodule](https://github.com/living-atlases/base-branding/blob/master/.gitmodules) and their resources are copied on each build (See the `vite.config.js`). With the same strategy the LA branding includes their [WP theme](https://github.com/AtlasOfLivingAustralia/commonui-bs3-2019/) as a submodule, so, if they change some css in the WP theme, their branding is also updated.

```
This base branding ---- uses ---> ALA branding resources ---- uses ----> ALA WP theme resources
```

For instance, to avoid conflicts, we only load js libs that are not used by ALA (like `i18next` js lib) and we use the libs that ALA already include in their branding and software (as the jQuery lib or the Boostrap 3 framework and deps).

The goal is also not to deal with [duplicate code and their problems](https://en.wikipedia.org/wiki/Duplicate_code).

So if ALA fix some js error, or if add a new chart lib, or similar, we can include that changes in our build easily. 

This is how the `base-branding` includes the ALA theme code in the build process (see (See the `vite.config.js`):

![image](https://github.com/living-atlases/base-branding/assets/180085/fe465bc3-335a-42c0-a5c6-ff1d4823edf6)

The branding also create a homepage, a test page and an error page. But if you need some more complex homepage, and for instance, you need to use a CMS (like Wordpress), our recommendation is that you can use a similar strategy to avoid the need of keed in sync your LA branding and your CMS theme. So you can develop a common header/footer and css styling in your CMS, and include it in a fork of this sample branding. In summary:

```
Your branding ---- uses ---> ALA branding resources ---- uses ----> ALA WP theme resources
              `--- uses ---> you CMS theme resources
```

So if for instance, you change a logo or a footer link in your CMS you can have the same change in your LA portal easily. For that you need to include it a submodule and also copy your resources in `vite.config.js` during the build like we do with the ALA resources. 

Also in general we try not to mix libs versions like different Boostrap or jQuery versions.

Other strategy is to have an independent CMS theme with their own js/css and a simpler LA branding with a similar look a feel but using ALA libs (Bootstrap 3 ...).

## Styling

ALA uses Bootstrap version 3 in most of their modules.

This branding has currently several themes in `app/themes`. One is a `clean` Boostrap 3 theme that you can easy adapt to your site needs. This is useful when you already have a css/html style (for instance of your blog or main site) that you want to integrate with the new LA portal. Based in this clean BS3 theme there are other customized versions using many of the https://bootswatch.com/3/ themes.

Additionally we have a material-bootstrap experimental theme in `app/themes/material` as a demostration of how to do a different look&feel to a LA portal with other js/css libs. This `material` theme uses:
- Material Design Lite https://getmdl.io/ with a custom theme that you can https://getmdl.io/customize/index.html change, download and put instead of `app/themes/material/css/material.min.css`.
- And experimentally also [Material Bootstrap Design](https://github.com/FezVrasta/bootstrap-material-design) to have similar style in the ALA modules.
If you only want to do minor style changes, have a look to `app/themes/material/css/material-custom-styles.css`.

This styling is not the most important work of this `base-branding`, but instead the integration with ALA and the vite configuration that gives you the possibility to use modern javascript code and modern libraries or use `i18next`, for example.

## Structure

```
├──app
│   ├── assets           # static assets, like index/header/footer/banner.html
│   │   ├── fonts        # etc
│   │   ├── locales
│   │   └── images
│   ├── css              # put your css here
│   ├── js               # put your js code here
│   └── themes
│       ├── clean        # clean BS3 theme that you can select in settings.js
│       │   ├── assets
│       │   ├── js
│       │   └── css
│       │   (...)        # add your custom theme here
│       └── material     # material-BS3 theme that you can select in settings.js
│           ├── assets
│           ├── css
│           └── js
├──commonui-bs3-2019     # ALA branding as submodule
│
├──node-modules          # 'yarn add module', to install
│                        # any node module and use it in your js code
└──dist
    ├── css              # The 'dist' directory is what you have to deploy
    │   └── images       # It's generated by `vite`
    ├── fonts
    ├── locales
    ├── images
    └── js
```
Vite compiles in `dist` your `js`/`css` and make this compatible with older browsers (so you can use node modules or ES6 code without problems).

## Basic settings

See and edit `app/js/settings.js` there you can select for instance the theme you want to use.

## Development

This is using https://vite.dev instead of gulp and using [ALA commonui-bs3-2019](https://github.com/AtlasOfLivingAustralia/commonui-bs3-2019) as a git submodule to use the same assets used by ALA modules.

### Usage

```
# First use:

git clone --recurse-submodule https://github.com/living-atlases/base-branding.git
# if you cloned without the submodules: git submodule update --init --recursive # use --init only the fist time

npm install

npm run dev
```

Test with:
- http://localhost:3333/
- http://localhost:3333/testPage.html
- http://localhost:3333/errorPage.html

## Deployment and ALA configuration

```
BASE_BRANDING_URL=https://l-a.site npm run build && rsync -a --delete dist/ your-server:/srv/your-server-domain/www/test-skin/

```

And in your inventories:

```
header_and_footer_baseurl = https://l-a.site/test-skin
header_and_footer_version = 2
```

The `version = 2` will substitute some `::variables::` like login/logout urls in your `head/banner/footer.html` in production. This is also done in `index.html` and during development with the `app/js/settings.js` values. See [ala-bootstrap3 HeaderFotterTagLib.groovy ](https://github.com/AtlasOfLivingAustralia/ala-bootstrap3/blob/351067716c685dc9a896d0a57abd1b4afdfaee39/grails-app/taglib/au/org/ala/bootstrap3/HeaderFooterTagLib.groovy#L218) for more details. Use the appropriate skin (see below).

`test-skin` is just a directory in your vhost root so you can keep different versions of a skin for testing purposes, for developing, etc. For instance when ALA uses `commonui-bs3-2019` directory their modules uses resources like `https://www.ala.org.au/commonui-bs3-2019/head.html`.

More information about [rsync and scp directories here](https://www.joeldare.com/wiki/copy_a_directory_recursively_using_scp).

### About skin.layouts recommend to use on each ALA modules

In general you should use `main` or `generic` skin in your ALA modules. Some coments:

- `collectory`: `ala` skin layout works well
- `species`: `ala` skin layout works well
- `regions`: `main` skin layout works well
- `bie-index`: `main` skin layout works well
- `lists`: `main` skin layout works well
- `images`: `main` skin layout works well
- `biocache`: `ala` skin layout works well
- `userdetails`: `ala-main` skin layout works well

[Here you have a table of skin layouts recommended](https://docs.google.com/spreadsheets/d/19rs1GuxZX2tRfm2x8YYf83fAcBrIG1gObIqVOV6C870/edit?usp=sharing), variables names, layouts used by ALA, links to code, etc.

## Why Vite?

Vite provides an extremely fast development experience with:

- Native ES Modules support
- Instant server start with hot module replacement (HMR)
- Optimized production builds
- Out-of-the-box support for TypeScript, JSX, CSS preprocessors
- Simpler configuration compared to traditional bundlers

We handle ALA dependencies (jquery, autocomplete, etc.) through Vite's optimized dependency management, which offers:
- Better integration with modern ES modules
- More efficient bundling
- Improved caching for faster rebuilds

See `vite.config.js`` for implementation details and customization options.

## TODO

- [x] Add error page
- [x] LA occurrences, etc stats in index
- [x] use of SASS and better style customization options
- [x] Nowadays, during development, if you modify the head/footer/banner you need an extra manual build to update well your index and testPage with your changes. We have to find a better way to replace the HEADER, BANNER etc. See `vite.config.js` for more details.
- [ ] Integration of some EU cookie utility like: https://www.npmjs.com/package/@beyonk/gdpr-cookie-consent-banner
- [ ] Add sample `/favicon/{manifest.json|favicon.*}` required by `CAS`

Pull Request welcome!

## Screenshots

### Material theme

Home page with stats:

![](https://raw.github.com/living-atlases/base-branding/master/la-base-index.png)

Multilingual menu selection integrated with `grails` i18n:

![](https://raw.github.com/living-atlases/base-branding/master/screenshots/material/collectory-i18n.png)

`CAS` Authentication links in drawer (and other configurable links):

![](https://raw.github.com/living-atlases/base-branding/master/screenshots/material/drawer.png)

ALA Species autocompletion integrated and sticky footer:

![](https://raw.github.com/living-atlases/base-branding/master/screenshots/material/sticky-footer-autocomplete.png)

Error page:

![](https://raw.github.com/living-atlases/base-branding/master/screenshots/material/error-page.png)

### Clean theme

Home page with stats:

![](https://raw.github.com/living-atlases/base-branding/master/screenshots/clean/index.png)

`CAS` Authentication links in dropdown (and other configurable links):

![](https://raw.github.com/living-atlases/base-branding/master/screenshots/clean/menu-auth-and-links.png)

ALA Species autocompletion integrated and sticky footer:

![](https://raw.github.com/living-atlases/base-branding/master/screenshots/clean/autocomplete.png)

Error page:

![](https://raw.github.com/living-atlases/base-branding/master/screenshots/clean/error.png)

## Error pages

You can enable a error banner in `js/settings` variable `inMante` to `true` that will visible in all the LA modules using this skin.

Also you can configure a error page in your nginx proxy, for instance:

```
error_page 503 https://l-a.site/errorPage.html;
```
or in Apache:

```
ErrorDocument 503 https://l-a.site/errorPage.html, for instance;
```

## Caveats

- If this header/footer/etc are used from `subdomains.your.l-a.site` you can not use relative urls. You should use like `https://your.l-a.site/img/someResource.png` instead of `img/someResource.png`. If you don't use absolute urls, `collectory` will try to access to `img/someResource.png` in their tomcat without success with `404` errors, and the same with the rest of tools.
- [ala-cas-5 layout ignores head.html](https://github.com/AtlasOfLivingAustralia/ala-cas-5/issues/29) right now.
- `collectory` has an old version of `ala-bootstrap3`.

## License

Apache-2.0 © 2020-2021 [Living Atlases](https://living-atlases.gbif.org)

Additionally:

- Some `html`/`css`/`js` based in Material Design Lite, Apache License 2.0.
- Bootstrap Material Design, MIT license.

## More information

- https://github.com/AtlasOfLivingAustralia/documentation/wiki/Styling-the-web-app
