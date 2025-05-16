export default {
  isDevel: true,
  inMante: false, // set to true and deploy if you want to set a maintenance message in all the services
  enabledLangs: ['en', 'es', 'zh', 'sw'],
  mainDomain: 'l-a.site', // used for cookies (without http/https)
  mainLAUrl: 'https://l-a.site',
  baseFooterUrl: 'https://l-a.site',
  theme: 'simplex', // for now 'material', 'clean', 'superhero', 'yeti', 'cosmo', 'darkly', 'paper', 'sandstone', 'simplex', 'slate' or 'flatly' themes are available. See the last ones in: https://bootswatch.com/3/
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

