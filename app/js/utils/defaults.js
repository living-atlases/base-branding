// What the home, widgets and footer use when settings.js has no home, homeWidgets or footer: the
// la-toolkit generator (generator-living-atlas) writes its own settings.js without them. These are
// the same values as the sample app/js/settings.js; a key in settings.js replaces the whole default.

const home = {
  hero: {
    interval: 7000,
    slides: [
      { image: 'images/slide01.jpg', species: 'Vespidae' },
      { image: 'images/slide3.png', species: 'Felis catus' }
    ],
    buttons: [
      { i18n: 'index.hero.search', url: '{biocache}/search', style: 'accent' },
      { i18n: 'index.hero.collections', url: '{collectory}', style: 'ghost' }
    ]
  },
  cards: [
    { i18n: 'index.cards.area', image: 'images/slide3.png', url: '{biocache}/explore/your-area/' },
    { i18n: 'index.cards.spatial', image: 'images/slide2.jpg', url: '{spatial}' },
    { i18n: 'index.cards.collections', image: 'images/slide01.jpg', url: '{collectory}' }
  ],
  partners: [
    { name: 'GBIF', logo: 'images/gbif.png', url: 'https://www.gbif.org' },
    { name: 'TDWG', logo: 'images/tdwg.png', url: 'https://www.tdwg.org' }
  ]
};

const homeWidgets = { stats: true, taxoChart: true, instChart: true, institutions: false };

const footer = {
  links: [
    { i18n: 'footer.links.about', url: '{central}/about/' },
    { i18n: 'footer.links.contact', url: '{central}/contact/' },
    { i18n: 'footer.links.data-policy', url: '{central}/data-policy/' }
  ],
  social: [{ name: 'GitHub', url: 'https://github.com/living-atlases' }]
};

export const homeOf = settings => settings.home || home;
export const widgetsOf = settings => settings.homeWidgets || homeWidgets;
export const footerOf = settings => settings.footer || footer;
