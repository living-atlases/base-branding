import fs from 'fs';
import path from 'path';

function multiReplacePlugin(replacements) {
  return {
    name: 'vite-plugin-multi-replace',
    enforce: 'pre',
    transformIndexHtml(html, { filename }) {
      let replacedHtml = html;

      for (const [search, replace] of Object.entries(replacements)) {
        replacedHtml = replacedHtml.replace(new RegExp(search, 'g'), replace);
      }

      // Aplicar reemplazos dentro de los reemplazos
      for (const [search, replace] of Object.entries(replacements)) {
        replacedHtml = replacedHtml.replace(new RegExp(search, 'g'), replace);
      }

      return replacedHtml;
    }
  };
}

export default multiReplacePlugin;

