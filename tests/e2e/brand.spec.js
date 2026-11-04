// The look of each theme (app/js/utils/brand.js and scripts/branding.mjs), without a browser:
// readable header colours, a bundled font, and themes that don't all look alike.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { root } from './helpers.js';
import { resolveBrand, contrast, logoSvg } from '../../app/js/utils/brand.js';
import { brandCss } from '../../scripts/branding.mjs';

const themes = fs.readdirSync(path.join(root, 'app/themes')).filter(t => fs.statSync(path.join(root, 'app/themes', t)).isDirectory());

for (const theme of themes) {
  test(`${theme}: header text and accent read on the header, and its fonts are bundled`, () => {
    const brand = resolveBrand({ theme });
    const c = brand.colors;
    expect(contrast(c.headerInk, c.headerBg), 'header text').toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.headerAccent, c.headerBg), 'header accent').toBeGreaterThanOrEqual(3);
    expect(contrast(c.onHeaderAccent, c.headerAccent), 'account button').toBeGreaterThanOrEqual(4.5);
    const css = brandCss({ theme });
    for (const family of new Set([brand.font, brand.headingFont])) {
      expect(css, `${family} has no @font-face`).toContain(`font-family: "${family}"`);
    }
    expect(logoSvg(brand)).toContain(c.headerAccent);
  });
}

test('no two themes share header colour, font and corner radius', () => {
  const looks = themes.map(theme => {
    const b = resolveBrand({ theme });
    return `${b.colors.headerBg} ${b.font} ${b.headingFont} ${b.radius}`;
  });
  expect(new Set(looks).size).toBe(themes.length);
  expect(new Set(themes.map(theme => resolveBrand({ theme }).font)).size, 'one font per theme').toBe(themes.length);
});

test('a colour that is not #hex is refused', () => {
  expect(() => resolveBrand({ theme: 'clean', brand: { colors: { headerBg: 'red;}' } } })).toThrow(/headerBg/);
  expect(() => resolveBrand({ theme: 'clean', brand: { radius: '4px' } })).toThrow(/radius/);
});
