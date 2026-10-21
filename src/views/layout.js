import { statSync } from 'node:fs';

export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const html = (strings, ...values) =>
  strings.reduce((out, s, i) => out + s + (i < values.length ? (Array.isArray(values[i]) ? values[i].join('') : values[i] ?? '') : ''), '');

// Versión del CSS = fecha de modificación: los estáticos se cachean 7 días y así el navegador baja el nuevo al cambiar.
const cssVersion = (name) => {
  try { return statSync(`public/css/${name}.css`).mtimeMs.toString(36).slice(0, 8); } catch { return '0'; }
};

// lang: idioma de la página. switcher: pinta el selector ES | EN arriba a la derecha (sólo en la web pública).
// Los enlaces ?lang= los atiende el middleware de idioma de server.js (guarda la cookie y vuelve a la misma página).
const langSwitch = (lang) => html`<nav class="lang-switch" aria-label="Idioma / Language">
  <a href="?lang=es" hreflang="es" lang="es"${lang === 'es' ? ' aria-current="true"' : ''}>ES</a>
  <a href="?lang=en" hreflang="en" lang="en"${lang === 'en' ? ' aria-current="true"' : ''}>EN</a>
</nav>`;

export function layout({ title, description = '', body, css = 'site', robots = 'index,follow', ogImage = '/img/ilustracion.jpg', lang = 'es', switcher = false }) {
  return html`<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#0d0b0a">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${ogImage}">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat+Brush&family=Oswald:wght@500;600&family=Rubik:wght@600;800&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/${css}.css?v=${cssVersion(css)}">
</head>
<body>
${switcher ? langSwitch(lang) : ''}
${body}
</body>
</html>`;
}

export const logo = (cls = 'logo') => `<svg class="${cls}" aria-label="El Club de las Brasas" role="img"><use href="/img/logo-sprite.svg#logo"/></svg>`;

export const waIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.42 9.42 0 0 1-1.45-5.03c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.99 6.67 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.2-4.24 9.43-9.44 9.43zm8.04-17.47A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.65l6.04-1.58a11.33 11.33 0 0 0 5.43 1.38h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.04-1.18-5.89-3.33-8.04z"/></svg>`;
