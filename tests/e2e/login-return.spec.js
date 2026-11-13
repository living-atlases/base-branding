// The login link of the banner must bring the visitor back to the page they were on: with the
// bare CAS login URL (what the build and the ALA apps put there) CAS stays on its own page.
// Run after `npm run build`.
import { test, expect } from '@playwright/test';
import settings from '../../app/js/settings.js';
import { addLoginReturn } from '../../app/js/login-return.js';
import { brandingBase, distFile, serviceStub } from './helpers.js';

const fakeRoot = (hrefs, className = 'loginBtn') => {
  const links = hrefs.map(href => ({ href, className, getAttribute: () => href, setAttribute(_, v) { this.href = v; } }));
  return { links, querySelectorAll: () => links };
};

test('the home login link returns to the home', async ({ page }) => {
  const base = brandingBase();
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    const stub = serviceStub(url);
    if (stub) return route.fulfill(stub);
    const file = distFile(url.origin + url.pathname, base);
    return file ? route.fulfill(file) : route.abort();
  });
  await page.goto(`${base}/?lang=en`);
  const href = await page.locator('a.loginBtn').first().getAttribute('href');
  const url = new URL(href);
  expect(url.origin + url.pathname).toBe(`${settings.services.cas.url}/cas/login`);
  expect(url.searchParams.get('service')).toBe(`${base}/`);
  const logout = new URL(await page.locator('a.logoutBtn').first().getAttribute('href'));
  expect(logout.origin + logout.pathname).toBe(`${settings.services.cas.url}/cas/logout`);
  expect(logout.searchParams.get('url')).toBe(`${base}/`);
});

test('a login link that already has its service is left alone', () => {
  const root = fakeRoot(['https://auth.example.org/cas/login?service=https%3A%2F%2Fapp.example.org%2Fx']);
  addLoginReturn(root, 'https://hub.example.org/page');
  expect(root.links[0].href).toBe('https://auth.example.org/cas/login?service=https%3A%2F%2Fapp.example.org%2Fx');
});

test('the CAS ticket and the hash of the page are not sent back as the service', () => {
  const root = fakeRoot(['https://auth.example.org/cas/login']);
  addLoginReturn(root, 'https://hub.example.org/registros/search?q=a&ticket=ST-1#top');
  const url = new URL(root.links[0].href);
  expect(url.searchParams.get('service')).toBe('https://hub.example.org/registros/search?q=a');
});

test('a crafted ?lang= does not travel on in the service', () => {
  const root = fakeRoot(['https://auth.example.org/cas/login']);
  addLoginReturn(root, 'https://hub.example.org/?lang=%3Cimg%20onerror%3Dx%3E&q=a');
  const service = new URL(root.links[0].href).searchParams.get('service');
  expect(service).toBe('https://hub.example.org/?q=a');
  expect(root.links[0].href).not.toContain('onerror');
});

// The ALA apps sign in by OIDC: the bare CAS login leaves them signed out. On their pages the
// link goes to the app's /login?path= (ala-auth's LoginController), which comes back to the page
const SERVICES = {
  biocache: { url: 'https://hub.example.org/registros' },
  bie: { url: 'https://especies.example.org' },
  cas: { url: 'https://auth.example.org' }
};

test('on a page of an app under a path the link goes to its /login with the page as path', () => {
  const root = fakeRoot(['https://auth.example.org/cas/login']);
  addLoginReturn(root, 'https://hub.example.org/registros/occurrences/search?q=lynx&lang=es#map', SERVICES);
  const url = new URL(root.links[0].href);
  expect(url.origin + url.pathname).toBe('https://hub.example.org/registros/login');
  expect(url.searchParams.get('path')).toBe('/registros/occurrences/search?q=lynx');
});

test('on a page of an app on its own host the link goes to that host /login', () => {
  const root = fakeRoot(['https://auth.example.org/cas/login']);
  addLoginReturn(root, 'https://especies.example.org/species/2435261', SERVICES);
  const url = new URL(root.links[0].href);
  expect(url.origin + url.pathname).toBe('https://especies.example.org/login');
  expect(url.searchParams.get('path')).toBe('/species/2435261');
});

test('on the home of a hub, outside its apps, the link stays on CAS with the home as service', () => {
  const root = fakeRoot(['https://auth.example.org/cas/login']);
  addLoginReturn(root, 'https://hub.example.org/', SERVICES);
  const url = new URL(root.links[0].href);
  expect(url.origin + url.pathname).toBe('https://auth.example.org/cas/login');
  expect(url.searchParams.get('service')).toBe('https://hub.example.org/');
});

test('a path that only starts like an app is not taken for it', () => {
  const root = fakeRoot(['https://auth.example.org/cas/login']);
  addLoginReturn(root, 'https://hub.example.org/registros-old/x', SERVICES);
  expect(new URL(root.links[0].href).pathname).toBe('/cas/login');
});

// The logout comes back to the page too: the apps' own /logout and the bare CAS logout take ?url=
test("an app's own logout link gets this page as url", () => {
  const root = fakeRoot(['/registros/logout?'], 'logoutBtn');
  addLoginReturn(root, 'https://hub.example.org/registros/occurrences/search?q=lynx&lang=es', SERVICES);
  const url = new URL(root.links[0].href);
  expect(url.origin + url.pathname).toBe('https://hub.example.org/registros/logout');
  expect(url.searchParams.get('url')).toBe('https://hub.example.org/registros/occurrences/search?q=lynx');
});

test('the bare CAS logout of the home gets the home as url', () => {
  const root = fakeRoot(['https://auth.example.org/cas/logout'], 'logoutBtn');
  addLoginReturn(root, 'https://hub.example.org/', SERVICES);
  const url = new URL(root.links[0].href);
  expect(url.origin + url.pathname).toBe('https://auth.example.org/cas/logout');
  expect(url.searchParams.get('url')).toBe('https://hub.example.org/');
});

// After a GitHub or Google login on CAS itself the page is the provider's way back, good only once:
// as the logout url CAS replays it with the code spent ("Aplicación no autorizada a usar CAS")
test('on the CAS page after a GitHub login the logout goes back to the bare CAS login', () => {
  const root = fakeRoot(['https://auth.example.org/cas/logout'], 'logoutBtn');
  addLoginReturn(root, 'https://auth.example.org/cas/login?client_name=GitHub&code=fd0f&iss=https%3A%2F%2Fgithub.com%2Flogin%2Foauth', SERVICES);
  const url = new URL(root.links[0].href);
  expect(url.origin + url.pathname).toBe('https://auth.example.org/cas/logout');
  expect(url.searchParams.get('url')).toBe('https://auth.example.org/cas/login');
});

test('on the CAS page after a Google login neither code nor state travel in the logout url', () => {
  const root = fakeRoot(['https://auth.example.org/cas/logout'], 'logoutBtn');
  addLoginReturn(root, 'https://auth.example.org/cas/login?authuser=0&client_name=Google&code=4%2F0A&iss=https%3A%2F%2Faccounts.google.com&prompt=none&state=1d37', SERVICES);
  expect(new URL(root.links[0].href).searchParams.get('url')).toBe('https://auth.example.org/cas/login');
});

// Some apps put the bare CAS logout in the banner (registros, especies, regiones...): CAS closes its
// session and sends back to the page, but the app keeps its own and the visitor is still signed in
// there. Like the login, on an app page the logout goes through the app's /logout, which closes both
test('on a page of an app the bare CAS logout goes through the app /logout with the page as url', () => {
  const root = fakeRoot(['https://auth.example.org/cas/logout'], 'logoutBtn');
  addLoginReturn(root, 'https://especies.example.org/search?q=lynx', SERVICES);
  const url = new URL(root.links[0].href);
  expect(url.origin + url.pathname).toBe('https://especies.example.org/logout');
  expect(url.searchParams.get('url')).toBe('https://especies.example.org/search?q=lynx');
});

test('on a page of an app under a path the bare CAS logout goes through its /logout', () => {
  const root = fakeRoot(['https://auth.example.org/cas/logout'], 'logoutBtn');
  addLoginReturn(root, 'https://hub.example.org/registros/occurrences/search?q=lynx', SERVICES);
  const url = new URL(root.links[0].href);
  expect(url.origin + url.pathname).toBe('https://hub.example.org/registros/logout');
  expect(url.searchParams.get('url')).toBe('https://hub.example.org/registros/occurrences/search?q=lynx');
});

// Signed in with the portal password: the CAS page is the bare /cas/login and the logout comes
// back to it, as f503250 left it
test('on the CAS page after a portal password login the logout still comes back to it', () => {
  const root = fakeRoot(['https://auth.example.org/cas/logout'], 'logoutBtn');
  addLoginReturn(root, 'https://auth.example.org/cas/login', SERVICES);
  const url = new URL(root.links[0].href);
  expect(url.origin + url.pathname).toBe('https://auth.example.org/cas/logout');
  expect(url.searchParams.get('url')).toBe('https://auth.example.org/cas/login');
});

test('a page of an app keeps its own query in the logout url', () => {
  const root = fakeRoot(['https://auth.example.org/cas/logout'], 'logoutBtn');
  addLoginReturn(root, 'https://especies.example.org/search?q=code&scope=all', SERVICES);
  expect(new URL(root.links[0].href).searchParams.get('url')).toBe('https://especies.example.org/search?q=code&scope=all');
});

test("an app's own logout keeps the page as url after a GitHub login too", () => {
  // the app took the provider's way back on its /callback and then showed this page
  const root = fakeRoot(['/registros/logout?'], 'logoutBtn');
  addLoginReturn(root, 'https://hub.example.org/registros/occurrences/search?q=lynx', SERVICES);
  expect(new URL(root.links[0].href).searchParams.get('url')).toBe('https://hub.example.org/registros/occurrences/search?q=lynx');
});

test('only the provider parameters are dropped, the rest of the page stays', () => {
  const root = fakeRoot(['https://auth.example.org/cas/logout'], 'logoutBtn');
  addLoginReturn(root, 'https://hub.example.org/page?q=a&client_name=GitHub&code=fd0f&iss=x', SERVICES);
  expect(new URL(root.links[0].href).searchParams.get('url')).toBe('https://hub.example.org/page?q=a');
});

test('a client_name without code or state is not taken for a provider way back', () => {
  const root = fakeRoot(['https://auth.example.org/cas/logout'], 'logoutBtn');
  addLoginReturn(root, 'https://hub.example.org/page?client_name=x&scope=all', SERVICES);
  expect(new URL(root.links[0].href).searchParams.get('url')).toBe('https://hub.example.org/page?client_name=x&scope=all');
});

test('a logout that already says where to go, or of another host, is left alone', () => {
  const root = fakeRoot(['https://auth.example.org/cas/logout?url=https%3A%2F%2Fx.example.org%2F', 'https://other.example.org/logout'], 'logoutBtn');
  addLoginReturn(root, 'https://hub.example.org/', SERVICES);
  expect(root.links.map(l => l.href)).toEqual(['https://auth.example.org/cas/logout?url=https%3A%2F%2Fx.example.org%2F', 'https://other.example.org/logout']);
});

test('links that are not a CAS login are not touched', () => {
  const root = fakeRoot(['/login', 'https://auth.example.org/userdetails/myprofile/']);
  addLoginReturn(root, 'https://hub.example.org/');
  expect(root.links.map(l => l.href)).toEqual(['/login', 'https://auth.example.org/userdetails/myprofile/']);
});
