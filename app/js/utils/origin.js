export const originOf = url => new URL(url, location.href).origin;

export const isHomeFromAppOrigin = mainLAUrl =>
  (location.origin === originOf(mainLAUrl) || location.host === 'localhost:3333') &&
  location.pathname === '/';

