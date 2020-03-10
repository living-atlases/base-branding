module.exports = {
  isDevel: true,
  inMante: true, // set to true and deploy if you want to set a maintenance message in all the services
  enabledLangs: ['en', 'sw'],
  mainDomain: 'tanbif.ditnet.ac.tz', // used for cookies (without http/https)
  mainLAUrl: 'https://tanbif.ditnet.ac.tz',
  baseFooterUrl: 'https://tanbif.ditnet.ac.tz/tz-ui-2020',
  services: {
    collectory: { url: 'https://collections.tanbif.ditnet.ac.tz', title: 'Collections' },
    biocache: { url: 'https://tanbif.ditnet.ac.tz', title: 'Occurrence records' },
    bie: { url: 'https://species.tanbif.ditnet.ac.tz', title: 'Species' },
    regions: { url: 'https://regions.tanbif.ditnet.ac.tz', title: 'Regions' },
    lists: { url: 'https://lists.tanbif.ditnet.ac.tz', title: 'Species List' },
    spatial: { url: 'https://spatial.tanbif.ditnet.ac.tz', title: 'Spatial Portal' },
    images: { url: 'https://images.tanbif.ditnet.ac.tz', title: 'Images Service' },
    cas: { url: 'https://auth.tanbif.ditnet.ac.tz', title: 'CAS' }
  },
  otherLinks: [
    { title: 'Datasets', url: 'https://collections.tanbif.ditnet.ac.tz/datasets' },
    { title: 'Explore your area', url: 'http://records.tanbif.ditnet.ac.tz/explore/your-area/' },
    { title: 'Datasets', url: 'https://collections.tanbif.ditnet.ac.tz/datasets' },
    { title: 'twitter', url: '', icon: 'twitter' }
  ]
}
