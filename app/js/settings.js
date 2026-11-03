export default {
  isDevel: true,
  inMante: false, // set to true and deploy if you want to set a maintenance message in all the services
  enabledLangs: ['en', 'es', 'zh', 'sw'],
  mainDomain: 'l-a.site', // used for cookies (without http/https)
  mainLAUrl: 'https://l-a.site',
  baseFooterUrl: 'https://l-a.site',
  // 'clean' or one of the https://bootswatch.com/3/ themes built on it: 'cosmo', 'darkly', 'flatly',
  // 'paper', 'sandstone', 'simplex', 'slate', 'superhero', 'yeti'; 'material' is experimental.
  // LA_THEME=<name> overrides it at build time (npm run screenshots builds every theme that way).
  theme: (typeof process !== 'undefined' && process.env.LA_THEME) || 'clean',
  // Look of the header, footer and home in both builds (Bootstrap 3 and 5). See "Customize the
  // look" in the README. Every key is optional: what you leave out comes from the theme.
  brand: {
    logo: 'images/logo.svg', // relative to this branding, or an absolute URL
    colors: {
      // primary: '#1b6e5a', // links, buttons, the active menu item and the big numbers
      // primaryDark: '#0f3f34', // footer background
      // accent: '#e3a72f', // main hero button
    },
    // font: 'Inter', // 'Inter' is bundled; any other name must be loaded by your pages
  },
  home: {
    hero: {
      interval: 7000, // ms between slides; slides never move by themselves with prefers-reduced-motion
      // Credits are shown as plain text under the (i) button; leave out what you don't know.
      slides: [
        // { image, species, institution, author, license, licenseUrl, recordUrl }
        { image: 'images/slide01.jpg', species: 'Vespidae' },
        { image: 'images/slide3.png', species: 'Felis catus' }
      ],
      // Buttons under the slogan: the text is the i18n key, the url can use the service names;
      // style: 'accent', 'primary' or 'ghost' (outlined)
      buttons: [
        { i18n: 'index.hero.search', url: '{biocache}/search', style: 'accent' },
        { i18n: 'index.hero.collections', url: '{collectory}', style: 'ghost' }
      ]
    },
    // Cards of the home: title, text and link text are the <i18n>.title, .text and .link keys
    cards: [
      { i18n: 'index.cards.area', image: 'images/slide3.png', url: '{biocache}/explore/your-area/' },
      { i18n: 'index.cards.spatial', image: 'images/slide2.jpg', url: '{spatial}' },
      { i18n: 'index.cards.collections', image: 'images/slide01.jpg', url: '{collectory}' }
    ],
    partners: [
      { name: 'GBIF', logo: 'images/gbif.png', url: 'https://www.gbif.org' },
      { name: 'TDWG', logo: 'images/tdwg.png', url: 'https://www.tdwg.org' }
    ]
  },
  // Optional widgets: each one draws only when it is true here and its container is on the page
  // (indexBody.html has all of them). Charts load Highcharts from this branding on demand.
  homeWidgets: {
    stats: true, // big numbers: occurrences, datasets, institutions, species (#stats_*)
    taxoChart: true, // records by kingdom, drilling down to species (#taxo-container)
    instChart: true, // records by institution (#inst-container)
    institutions: false // institutions with their collections and data resources (#accordion-home-institutions)
  },
  // null: the widgets count the whole portal. A data hub uid ('dh1'): only that hub.
  dataHub: null,
  // Institutions of this other data hub get a badge in the institutions widget (null: none)
  dataHubToFlag: null,
  // flagBadge: { image: 'images/flag.png', title: 'Member of ...', url: 'https://...' },
  institutionsExclude: [], // institution uids the institutions widget leaves out
  // chartColors: { taxo: '#1b6e5a', inst: '#e3a72f' }, // base colour of each pie (default: brand primary, accent)
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

