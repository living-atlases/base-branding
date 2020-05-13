## Introduction

This is a base branding for new Living Atlas deployments. That is, some ALA header, banner and footer theme with:

- Well integration with ALA modules trying to avoid jquery conflicts and similar
- Well integration with `CAS` Authentication
- Multilingual
- Modern javascript code without lost compatibility with old browsers
- Digest usage for skip cache old js/css when we release a new version

You can use this as a basis for a new LA infrastructure branding or just to see how you can integrate your branding with ALA dependencies, etc.

## Styling

ALA uses Bootstrap version 3 in most of their modules.

Additionally we use:
- Material Design Lite https://getmdl.io/ with a custom theme that you can https://getmdl.io/customize/index.html change, download and put instead of `app/css/material.min.css`.
Anyway you can drop any of these last dependencies and create your header/footer from scratch with your own style. See `app/assets/head*.html` for more details.
- And experimentally also [Material Bootstrap Design](https://github.com/FezVrasta/bootstrap-material-design) to have similar style in the ALA modules.
If you only want to do minor style changes, have a look to `app/css/material-custom-styles.css`.

This styling is not the most important work of this branding, but instead the integration with ALA and the brunch configuration that gives you the possibility to use modern javascript code and modern libraries or use `i18next`, for example.

## Structure

```
├──app
│   ├── assets           # static assets, like index/header/footer/banner.html
│   │   ├── fonts        # etc
│   │   ├── locales
│   │   └── images
│   ├── css              # put your css here
│   ├── (...)
│   └── js               # put your js code here
│
├──commonui-bs3-2019     # ALA branding as submodule
│
├──node-modules          # 'yarn add module', to install
│                        # any node module and use it in your js code
└──public
    ├── css              # The 'public' directory is what you have to deploy
    │   └── images       # It's generated by `brunch`
    ├── fonts
    ├── locales
    ├── images
    └── js
```
Brunch compiles in public your `js`/`css` and make this compatible with older browsers (so you can use node modules or ES6 code without problems).

## Basic settings

See and edit `app/js/settings.js`.

## Development

This is using https://brunch.io instead of gulp and using [ALA commonui-bs3-2019](https://github.com/AtlasOfLivingAustralia/commonui-bs3-2019) as a git submodule to use the same assets used by ALA modules.

### Usage

```
# First use:

git clone --recurse-submodule https://github.com/living-atlases/base-branding.git

# install yarn with or similar:
# https://classic.yarnpkg.com/en/docs/install/#debian-stable

yarn install
npm install -g brunch

# During development
brunch watch -s
# or
brunch build
# or
brunch build --production
```

Test with:
- http://localhost:3333/
- http://localhost:3333/testPage.html
- http://localhost:3333/errorPage.html

## Deployment and ALA configuration

```
brunch build --production && rsync -a --delete --info=progress2 public/ your-server:/srv/your-server-domain/www/test-skin/

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

- `collectory`: `ala` skin layout works better than `generic`
- `regions`: `main` skin layout has breadcrumbs and `generic` doesn't (BIE autocomplete fails with both)
- `species`: `generic` skin layout works well
- `lists`: `main` skin layout works well, TODO: test `generic` layout
- `biocache`: `generic` skin layout works well
- `userdetails`: `main` skin layout has breadcrumbs and `generic` doesn't
- `cas`: `generic` AND `main` skins work well

## Why brunch?

With [brunch.io](https://brunch.io) we can use node modules, ES6 js code, sourcemaps, minimize, development with watch and browser auto reload etc, with a more easy configuration than gulp.

We copy the ALA dependencies (jquery, autocomplete, etc) via a plugin from the ALA submodule, so we can integrate ALA modules well.

See the `brunch-config.js` for more details.

## TODO

- [x] Add error page
- [x] LA occurrences, etc stats in index
- [ ] use of SASS and better style customization options
- [ ] Nowadays, during development, if you modify the head/footer/banner you need an extra manual `brunch build` to update well your index and testPage with your changes. We have to find a better way to replace the HEADER, BANNER etc. See `brunch-config.js` plugins for more details.
- [ ] Integration of some EU cookie utility like: https://www.npmjs.com/package/@beyonk/gdpr-cookie-consent-banner
- [ ] Add sample `/favicon/{manifest.json|favicon.*}` required by `CAS`

Pull Request welcome!

## Screenshots

Home page with stats:

![](https://raw.github.com/living-atlases/base-branding/master/la-base-index.png)

Multilingual menu selection integrated with `grails` i18n:

![](https://raw.github.com/living-atlases/base-branding/master/la-base-branding-collectory-i18n.png)

`CAS` Authentication links in drawer (and other configurable links):

![](https://raw.github.com/living-atlases/base-branding/master/la-base-branding-drawer.png)

ALA Species autocompletion integrated and sticky footer:

![](https://raw.github.com/living-atlases/base-branding/master/la-base-sticky-footer-autocomplete.png)

Error page:

![](https://raw.github.com/living-atlases/base-branding/master/error-page.png)

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

Some peculiarities to take into account:

- [ala-cas-5 layout ignores head.html](https://github.com/AtlasOfLivingAustralia/ala-cas-5/issues/29) right now.
- `collectory` has an old version of `ala-bootstrap3`.

## License

Apache-2.0 © 2020 [Living Atlases](https://living-atlases.gbif.org)

Additionally:

- Some `html`/`css`/`js` based in Material Design Lite, Apache License 2.0.
- Bootstrap Material Design, MIT license.

## More information

- https://github.com/AtlasOfLivingAustralia/documentation/wiki/Styling-the-web-app
