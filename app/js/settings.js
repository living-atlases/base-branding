export default {
  isDevel: true,
  inMante: false, // set to true and deploy if you want to set a maintenance message in all the services
  enabledLangs: ['en', 'es', 'zh', 'sw'],
  mainDomain: 'l-a.site', // used for cookies (without http/https)
  mainLAUrl: 'https://l-a.site',
  baseFooterUrl: 'https://l-a.site',
  // 'clean' or one of the https://bootswatch.com/3/ themes built on it: 'cosmo', 'darkly', 'flatly',
  // 'paper', 'sandstone', 'simplex', 'slate', 'superhero', 'yeti' (a theme of your own goes in app/themes).
  // LA_THEME=<name> overrides it at build time (npm run screenshots builds every theme that way).
  theme: (typeof process !== 'undefined' && process.env.LA_THEME) || 'clean',
  // Look of the header, footer and home in both builds (Bootstrap 3 and 5). See "Customize the
  // look" in the README. Every key is optional: a missing brand key comes from the theme, and a
  // missing home, homeWidgets or footer from app/js/utils/defaults.js.
  brand: {
    logo: 'images/logo.svg', // relative to this branding, or an absolute URL
    colors: {
      // primary: '#00838f', // links, buttons and the big numbers
      // primaryDark: '#00484f', // footer background
      // accent: '#ffb703', // search button
      // headerBg: '#ffffff', // header background; its text and accent follow from it
    },
    // font: 'Inter', // body text; headingFont: titles (the font by default). A font with an
    //   @fontsource-variable package in node_modules is bundled; any other must be loaded by your pages
    // radius: 8, // px, corners of buttons, cards and menus
  },
  home: {
    hero: {
      interval: 7000, // ms between slides; slides never move by themselves with prefers-reduced-motion
      // Credits are shown as plain text under the (i) button; leave out what you don't know.
      // position: the CSS background-position of the image, for the part that stays when a narrow
      // screen crops it. These photos come from GBIF records (images/CREDITS.md).
      slides: [
        // { image, position, species, institution, author, license, licenseUrl, recordUrl }
        {
          image: 'images/hero-orca.jpg', position: '35% 50%', species: 'Orcinus orca', institution: 'iNaturalist (via GBIF)',
          author: 'Евгений Егорейченков', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', recordUrl: 'https://www.gbif.org/occurrence/2980844512'
        },
        {
          image: 'images/hero-kingfisher.jpg', position: '45% 50%', species: 'Alcedo atthis', institution: 'iNaturalist (via GBIF)',
          author: 'Frank Sengpiel', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', recordUrl: 'https://www.gbif.org/occurrence/1993731423'
        },
        {
          image: 'images/hero-dolphin.jpg', position: '55% 50%', species: 'Delphinidae', institution: 'iNaturalist (via GBIF)',
          author: 'Daniel', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', recordUrl: 'https://www.gbif.org/occurrence/4121112404'
        },
        {
          image: 'images/hero-rosella.jpg', position: '62% 50%', species: 'Platycercus elegans', institution: 'iNaturalist (via GBIF)',
          author: 'Ellen Rykers', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', recordUrl: 'https://www.gbif.org/occurrence/1993726184'
        },
        {
          image: 'images/hero-nudibranch.jpg', position: '50% 40%', species: 'Felimare californiensis', institution: 'iNaturalist (via GBIF)',
          author: 'Madeleine Claire', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', recordUrl: 'https://www.gbif.org/occurrence/3466156222'
        }
      ],
      // Search box: a GET form to url with the text in param; search: false hides it
      search: { url: '{biocache}/occurrences/search', param: 'q' },
      // Buttons under the search box: the text is the i18n key, the url can use the service names;
      // style: 'accent', 'primary' or 'ghost' (outlined)
      buttons: [
        { i18n: 'index.hero.area', url: '{biocache}/explore/your-area/', style: 'primary' },
        { i18n: 'index.hero.collections', url: '{collectory}', style: 'ghost' }
      ]
    },
    // Cards of the home: title, text and link text are the <i18n>.title, .text and .link keys
    // (CC0 photos from GBIF records, images/CREDITS.md)
    cards: [
      { i18n: 'index.cards.area', image: 'images/card-swallowtail.jpg', url: '{biocache}/explore/your-area/' },
      { i18n: 'index.cards.spatial', image: 'images/card-jellyfish.jpg', url: '{spatial}' },
      { i18n: 'index.cards.collections', image: 'images/card-conure.jpg', url: '{collectory}' }
    ],
    partners: [
      { name: 'GBIF', logo: 'images/gbif.png', url: 'https://www.gbif.org' },
      { name: 'TDWG', logo: 'images/tdwg.png', url: 'https://www.tdwg.org' }
    ]
  },
  // Home widgets, all on by default: each one draws only when it is true here and its container is on the page
  // (indexBody.html has all of them). Charts load Highcharts from this branding on demand.
  homeWidgets: {
    stats: true, // big numbers: occurrences, datasets, institutions, species (#stats_*)
    taxoChart: true, // records by kingdom, drilling down to species (#taxo-container)
    instChart: true, // records by institution (#inst-container)
    institutions: true // institutions with their collections and data resources (#accordion-home-institutions)
  },
  // null: the widgets count the whole portal. A data hub uid ('dh1'): only that hub.
  dataHub: null,
  // Institutions of this other data hub get a badge in the institutions widget (null: none)
  dataHubToFlag: null,
  // flagBadge: { image: 'images/flag.png', title: 'Member of ...', url: 'https://...' }, // no image: a text pill
  institutionsExclude: [], // institution uids the institutions widget leaves out
  institutionsShow: 12, // institution cards shown before "show all" (a filter appears with more)
  // chartColors: { taxo: '#00838f', inst: '#ffb703' }, // base colour of each pie (default: brand primary, accent)
  footer: {
    // Last column of the footer: the text is the i18n key
    links: [
      { i18n: 'footer.links.about', url: '{central}/about/' },
      { i18n: 'footer.links.contact', url: '{central}/contact/' },
      { i18n: 'footer.links.data-policy', url: '{central}/data-policy/' }
    ],
    social: [
      { name: 'GitHub', url: 'https://github.com/living-atlases' }
    ]
  },
  services: {
    collectory: { url: 'https://collections.l-a.site', title: 'Collections' },
    biocache: { url: 'https://biocache.l-a.site', title: 'Occurrence records' },
    biocacheService: {
      url: 'https://biocache-ws.l-a.site',
      title: 'Occurrence records webservice',
    },
    bie: { url: 'https://species.l-a.site', title: 'Species' },
    bieService: {
      url: 'https://bie.ala.org.au/ws',
      title: 'Species webservice',
    },
    regions: { url: 'https://regions.l-a.site', title: 'Regions' },
    lists: { url: 'https://lists.l-a.site', title: 'Species List' },
    spatial: { url: 'https://spatial.l-a.site', title: 'Spatial Portal' },
    images: { url: 'https://images.l-a.site', title: 'Images Service' },
    cas: { url: 'https://auth.l-a.site', title: 'CAS' },
  },
  otherLinks: [
    { title: 'Datasets', url: 'https://collections.l-a.site/datasets' },
    {
      title: 'Explore your area',
      url: 'http://biocache.l-a.site/explore/your-area/',
    },
    { title: 'Datasets', url: 'https://collections.l-a.site/datasets' },
    { title: 'twitter', url: '', icon: 'twitter' },
  ],
  analytics: {
    googleId: 'UA-XXXXXXXX-1'
  }
};

