// What the home, widgets and footer use when settings.js has no home, homeWidgets or footer: the
// la-toolkit generator (generator-living-atlas) writes its own settings.js without them. These are
// the same values as the sample app/js/settings.js; a key in settings.js replaces the whole default.

const home = {
  hero: {
    interval: 7000,
    slides: [
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
    search: { url: '{biocache}/occurrences/search', param: 'q' },
    buttons: [
      { i18n: 'index.hero.area', url: '{biocache}/explore/your-area/', style: 'primary' },
      { i18n: 'index.hero.collections', url: '{collectory}', style: 'ghost' }
    ]
  },
  cards: [
    { i18n: 'index.cards.area', image: 'images/card-swallowtail.jpg', url: '{biocache}/explore/your-area/' },
    { i18n: 'index.cards.spatial', image: 'images/card-jellyfish.jpg', url: '{spatial}' },
    { i18n: 'index.cards.collections', image: 'images/card-conure.jpg', url: '{collectory}' }
  ],
  partners: [
    { name: 'GBIF', logo: 'images/gbif.png', url: 'https://www.gbif.org' },
    { name: 'TDWG', logo: 'images/tdwg.png', url: 'https://www.tdwg.org' }
  ]
};

const homeWidgets = { stats: true, taxoChart: true, instChart: true, institutions: true };

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
