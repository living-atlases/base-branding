import path from 'path';

export default function multiReplacePlugin(rules) {
  return {
    name: 'vite-plugin-multi-replace',
    enforce: 'pre',

    // Sólo filtramos para .js y .css (ahorra tiempo de parseo)
    transform(code, id) {
      if (!id.match(/\\.(js|css)$/)) return;

      let out = code;
      for (const { match } of rules) {
        out = out.replace(new RegExp(match.find, 'g'), match.replace);
      }
      return out === code ? null : { code: out, map: null };
    },

    // En HTML aplicamos **todas** las reglas sin mirar el nombre de archivo
    transformIndexHtml(html) {
      return rules.reduce(
        (acc, { match }) => acc.replace(new RegExp(match.find, 'g'), match.replace),
        html
      );
    }
  };
}
