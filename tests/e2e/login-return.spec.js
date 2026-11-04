// The login link of the banner must bring the visitor back to the page they were on: with the
// bare CAS login URL (what the build and the ALA apps put there) CAS stays on its own page.
// Run after `npm run build`.
import { test, expect } from '@playwright/test';
import settings from '../../app/js/settings.js';
import { addLoginReturn } from '../../app/js/login-return.js';
import { brandingBase, distFile, serviceStub } from './helpers.js';

const fakeRoot = hrefs => {
  const links = hrefs.map(href => ({ href, getAttribute: () => href, setAttribute(_, v) { this.href = v; } }));
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

test('links that are not a CAS login are not touched', () => {
  const root = fakeRoot(['/login', 'https://auth.example.org/userdetails/myprofile/']);
  addLoginReturn(root, 'https://hub.example.org/');
  expect(root.links.map(l => l.href)).toEqual(['/login', 'https://auth.example.org/userdetails/myprofile/']);
});
