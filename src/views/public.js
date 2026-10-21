import { layout, html, esc, logo, waIcon } from './layout.js';
import { STORE, fmtPrice } from '../store.js';

const waLink = (promo) => `/go/whatsapp${promo ? `?promo=${promo.id}` : ''}`;

// Idioma: cada vista recibe lang ('es' | 'en') y usa T('español', 'english') para los textos fijos.
const tr = (lang) => (es, en) => (lang === 'en' ? en : es);
const hoursOf = (s, lang) => (lang === 'en' && s.hours_en ? s.hours_en : s.hours);
// Layout de la web pública: idioma y selector ES | EN.
const page = (lang, opts) => layout({ ...opts, lang, switcher: true });

const fmtDate = (d, lang) =>
  new Date(`${d}T12:00:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

// Botón por defecto de la web: cartel de chapa. Ícono dibujado | texto en dos renglones (uno chico, uno grande) | flecha.
const ico = (paths) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const SIGN_ICONS = {
  calendar: ico('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m12 12.4 1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z"/>'),
  grill: ico('<path d="M3.5 11h17a8.5 7 0 0 1-17 0z"/><path d="m8 17.5-2.5 4.5M16 17.5l2.5 4.5M12 18v4"/><path d="M12 2.5c1.6 2 2.6 3.6 1 6M9 4.5c1 1.3 1.6 2.3.6 4M15.6 5c.8 1 1 2 .2 3.5"/>'),
  steak: ico('<path d="M2.5 11.5c0-3.3 3-5.5 7-5.5 2.2 0 3.3.9 5.4.9s3.4-1 5.1 0c1.9 1.2 1.8 4.4-.2 6.2-1.6 1.5-1.2 3-3.3 4.4-2.3 1.6-5.8 1.9-8.7.9-3.3-1.1-5.3-3.6-5.3-6.9z"/><path d="M8.2 8.6v7.2M8.2 12.2h5.6"/><path d="M15.6 10.4c1 .1 1.8.8 1.9 1.7M11.8 15.2c.9.4 1.9.3 2.6-.3M4.9 11c.1-.9.6-1.6 1.3-2"/>'),
  phone: ico('<path d="M6.6 3.5h-2a1.5 1.5 0 0 0-1.5 1.6A16.5 16.5 0 0 0 18.9 20.9a1.5 1.5 0 0 0 1.6-1.5v-2a1 1 0 0 0-.8-1l-3.4-.8a1 1 0 0 0-1 .3l-1.5 1.6a12 12 0 0 1-5.8-5.8l1.6-1.5a1 1 0 0 0 .3-1l-.8-3.4a1 1 0 0 0-1-.8z"/><path d="M14.5 3.5a6 6 0 0 1 6 6M14.5 7a2.5 2.5 0 0 1 2.5 2.5"/>'),
  menu: ico('<path d="M3 5.5c3-1.2 6-1 9 1 3-2 6-2.2 9-1v14c-3-1.2-6-1-9 1-3-2-6-2.2-9-1z"/><path d="M12 6.5v14M6 9.5h3M6 12.5h3M15 9.5h3M15 12.5h3"/>'),
  pin: ico('<path d="M12 21.5s-6.5-6-6.5-11.2a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11.2-6.5 11.2z"/><circle cx="12" cy="10.3" r="2.4"/>'),
  ticket: ico('<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2.2a1.8 1.8 0 0 0 0 3.6V16a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2.2a1.8 1.8 0 0 0 0-3.6z"/><path d="M14.5 6v12" stroke-dasharray="1.6 2"/><path d="m8.6 10.2.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2z"/>'),
  bag: ico('<path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5"/>'),
  plus: ico('<path d="M12 5v14M5 12h14"/>'),
  minus: ico('<path d="M5 12h14"/>'),
  home: ico('<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5"/>'),
  back: ico('<path d="M20 12H5M11 5l-7 7 7 7"/>'),
  globe: ico('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3.2 3.2 14.8 0 18M12 3c-3.2 3.2-3.2 14.8 0 18"/>'),
  whatsapp: waIcon.replace('class="ico"', ''),
};
const signArrow = '<svg class="sign-arrow" viewBox="0 0 40 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h33M28 5l8 7-8 7"/></svg>';

// small: renglón chico; si va antes o después del grande lo decide `smallFirst`.
// Con `submit` se pinta como <button> (formularios); `external` abre en otra pestaña.
function sign({ href, color, icon, big, small = '', smallFirst = false, label, submit = false, external = false }) {
  const smallEl = small ? `<small>${small}</small>` : '';
  const inner = html`
      <span class="sign-ico">${SIGN_ICONS[icon]}</span>
      <span class="sign-txt">${smallFirst ? smallEl : ''}<strong>${big}</strong>${smallFirst ? '' : smallEl}</span>
      ${signArrow}`;
  const aria = `aria-label="${esc(label || [smallFirst ? small : '', big, smallFirst ? '' : small].join(' ').trim())}"`;
  if (submit) return html`<button class="sign sign-${color}" type="submit" ${aria}>${inner}</button>`;
  return html`<a class="sign sign-${color}" href="${esc(href)}" ${aria}${external ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`;
}

// Cartel pequeño para volver a la home, arriba a la izquierda.
const backSign = (T) => html`<a class="sign sign-cream sign-back" href="/">${SIGN_ICONS.back}<span>${T('Volver', 'Back')}</span></a>`;

// Qué se ofrece en las secciones de eventos y catering de la home.
const HOME_EVENTS = {
  es: ['Eventos privados en el salón', 'Catas de vino', 'Reuniones de equipo', 'Comidas de empresa', 'Cumpleaños'],
  en: ['Private events in our dining room', 'Wine tastings', 'Team gatherings', 'Company lunches', 'Birthdays'],
};
const HOME_CATERING = {
  es: ['Bodas', 'Cumpleaños', 'Festejos', 'Eventos de empresa'],
  en: ['Weddings', 'Birthdays', 'Celebrations', 'Corporate events'],
};

// Imagen de portada (la misma de la tarjeta y el flyer).
const parrillitaImg = (cls) => html`<picture>
  <source srcset="/img/parrillita.webp" type="image/webp">
  <img class="${cls}" src="/img/parrillita.png" width="1080" height="1478" alt="El Club de las Brasas · Parrillita al paso &amp; take away">
</picture>`;

export function homePage(s, lang) {
  const T = tr(lang);
  // «Martes a domingo · 13:00–16:30 y 20:00–00:00» → dos renglones.
  const hours = hoursOf(s, lang).split(/\s*·\s*/).map(esc).join('<br>');
  return page(lang, {
    title: T('El Club de las Brasas · Parrilla argentina en El Palo, Málaga', 'El Club de las Brasas · Argentine grill in El Palo, Málaga'),
    description: T(
      'Parrilla argentina a la brasa en El Palo, Málaga. Carnes, empanadas y milanesas. Reserva tu mesa por WhatsApp.',
      'Argentine wood-fire grill in El Palo, Málaga. Grilled meats, empanadas and milanesas. Book your table on WhatsApp.',
    ),
    body: html`
<header class="h-intro">
  <h1 class="sr-only">El Club de las Brasas · ${T('Parrilla argentina en El Palo, Málaga', 'Argentine grill in El Palo, Málaga')}</h1>
  ${parrillitaImg('h-intro-art')}
  <a class="h-scroll" href="#conocenos" aria-label="${T('Bajar', 'Scroll down')}">↓</a>
</header>

<main>
  <!-- El vídeo es sticky sólo dentro de este bloque: el panel bordó sube sobre él y luego todo sigue normal. -->
  <div class="h-stack">
  <section class="h-video" id="conocenos">
    <video class="h-video-bg" autoplay muted loop playsinline preload="metadata" poster="/video/parrilla-poster.jpg" aria-hidden="true">
      <source src="/video/parrilla.mp4" type="video/mp4">
    </video>
    <div class="h-video-copy">
      <p class="hero-kicker">${T('Parrilla argentina', 'Argentine grill')}</p>
      <h2>${T('Conócenos', 'Get to know us')}</h2>
      <p class="h-video-lead">${T(
        'Fuego lento, carne de verdad y la sobremesa larga de toda la vida, a un paso del mar.',
        'Slow fire, real meat and long, unhurried meals, just steps from the sea.',
      )}</p>
      <p class="h-place">${esc(s.address)}</p>
      <div class="sign-solo">${sign({ href: '/go/carta', color: 'cream', icon: 'menu', big: T('Carta', 'Menu'), small: T('Ver la', 'See the'), smallFirst: true })}</div>
    </div>
  </section>

  <section class="reserve">
    <h2>${T('¿Te guardamos una mesa?', 'Shall we save you a table?')}</h2>
    <p>${T(
      'Escríbenos por WhatsApp con el día, la hora y cuántos sois. Te confirmamos al momento.',
      'Send us a WhatsApp with the day, time and how many of you. We’ll confirm right away.',
    )}</p>
    <p class="reserve-hours">${hours}</p>
    <div class="reserve-ctas">
      ${sign({ href: waLink(), color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: T('Reservar por', 'Book on'), smallFirst: true })}
      ${sign({ href: '/go/carta', color: 'cream', icon: 'menu', big: T('Carta', 'Menu'), small: T('Ver la', 'See the'), smallFirst: true })}
    </div>
  </section>
  </div>

  <section class="h-events">
    <img class="h-events-bg" src="/img/eventos-portada.jpg" width="1000" height="982" alt="" loading="lazy">
    <div class="h-events-copy">
      <p class="hero-kicker">${T('Eventos en el club', 'Events at the club')}</p>
      <h2>${T('Tu celebración, a la brasa', 'Your celebration, on the grill')}</h2>
      <p>${T('Reservamos el salón para ti y encendemos la parrilla para todo el grupo.', 'We book the dining room for you and fire up the grill for the whole group.')}</p>
      <ul class="chips">${HOME_EVENTS[lang].map((t) => `<li>${t}</li>`)}</ul>
      <div class="sign-solo">${sign({ href: '/eventos?src=home', color: 'cream', icon: 'calendar', big: T('Eventos', 'Events'), small: T('Ver', 'See'), smallFirst: true })}</div>
    </div>
  </section>

  <section class="h-events h-catering">
    <img class="h-events-bg" src="/img/catering-portada.jpg" width="1000" height="1000" alt="" loading="lazy">
    <div class="h-events-copy">
      <p class="hero-kicker">Catering</p>
      <h2>${T('Llevamos la brasa a tu fiesta', 'We bring the grill to your party')}</h2>
      <p>${T('Parrilla argentina donde tú digas, con el fuego, la carne y el parrillero.', 'Argentine barbecue wherever you want it: the fire, the meat and the grill master.')}</p>
      <ul class="chips">${HOME_CATERING[lang].map((t) => `<li>${t}</li>`)}</ul>
      <div class="sign-solo">${sign({ href: '/catering?src=home', color: 'red', icon: 'grill', big: 'Catering', small: T('Ver', 'See'), smallFirst: true })}</div>
    </div>
  </section>

  <section class="h-store">
    <p class="hero-kicker">${T('Tienda · por encargo', 'Shop · made to order')}</p>
    <h2>${T('El club en tu congelador', 'The club in your freezer')}</h2>
    <p class="h-store-lead">${T(
      'Empanadas y milanesas congeladas, hechas en el club. Haz tu pedido y te avisamos cuándo pasar a recogerlo.',
      'Frozen empanadas and milanesas, made at the club. Place your order and we’ll let you know when to pick it up.',
    )}</p>
    <div class="h-store-grid">
      ${STORE.map((c) => html`<a class="h-store-card" href="/tienda?src=home#${c.id}">
        <img src="${c.img}" width="318" height="318" alt="" loading="lazy">
        <span><strong>${T(c.title, c.title_en)}</strong><small>${c.items.length} ${c.id === 'empanadas' ? T('sabores', 'flavours') : T('variedades', 'kinds')}</small></span>
      </a>`)}
    </div>
    <div class="sign-solo">${sign({ href: '/tienda?src=home', color: 'black', icon: 'bag', big: T('Pedido', 'Order'), small: T('Hacer mi', 'Place my'), smallFirst: true })}</div>
  </section>
</main>

<footer class="foot">
  ${logo('logo foot-logo')}
  <p><a href="${esc(s.instagram)}" target="_blank" rel="noopener">Instagram</a> · © ${new Date().getFullYear()} El Club de las Brasas · El Palo, Málaga</p>
</footer>

<a class="fab-wa" href="${waLink()}" aria-label="${T('Reservar por WhatsApp', 'Book on WhatsApp')}">${waIcon}</a>
<script>
  // Sin animación para quien la tiene desactivada en el sistema: el vídeo se queda en el póster.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelector('.h-video-bg')?.pause();
</script>`,
  });
}

function promoShell({ promo, lang, inner, robots = 'noindex,nofollow' }) {
  const T = tr(lang);
  return page(lang, {
    title: `${promo.title} · El Club de las Brasas`,
    description: promo.description,
    robots,
    body: html`
<main class="promo-page">
  <a href="/" class="promo-logo-link">${logo('logo promo-logo')}</a>
  ${inner}
  <p class="promo-foot"><a href="/">elclubdelasbrasas</a> · ${T('Parrilla argentina en El Palo, Málaga', 'Argentine grill in El Palo, Málaga')}</p>
</main>`,
  });
}

export function promoPage(promo, lang, { coupon, src }) {
  const T = tr(lang);
  return promoShell({
    promo,
    lang,
    inner: html`
<article class="ticket">
  <div class="ticket-top">
    <span class="ticket-kicker">${T('Promo exclusiva', 'Exclusive offer')}</span>
    <p class="ticket-badge">${esc(promo.badge || promo.title)}</p>
    <h1>${esc(promo.title)}</h1>
    <p class="ticket-desc">${esc(promo.description)}</p>
  </div>
  <div class="ticket-cut" aria-hidden="true"></div>
  <div class="ticket-bottom">
    ${coupon
      ? couponBlock(coupon, T)
      : html`
    <form method="post" action="/p/${esc(promo.slug)}/cupon">
      <input type="hidden" name="src" value="${esc(src)}">
      ${sign({ submit: true, color: 'red', icon: 'ticket', big: T('Cupón', 'Coupon'), small: T('Obtener mi', 'Get my'), smallFirst: true })}
    </form>
    <p class="ticket-hint">${T('Te damos un código único para enseñar en el local.', 'You’ll get a unique code to show at the restaurant.')}</p>`}
    ${promo.conditions ? `<p class="ticket-cond">${esc(promo.conditions)}</p>` : ''}
    ${promo.valid_until ? `<p class="ticket-cond">${T('Válido hasta el', 'Valid until')} ${fmtDate(promo.valid_until, lang)}.</p>` : ''}
  </div>
</article>
${sign({ href: waLink(promo), color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: T('Reservar mesa por', 'Book a table on'), smallFirst: true })}`,
  });
}

function couponBlock(coupon, T) {
  if (coupon.redeemed_at) {
    return html`<div class="coupon coupon-used">
      <p class="coupon-label">${T('Cupón', 'Coupon')}</p>
      <p class="coupon-code">${esc(coupon.code)}</p>
      <p class="coupon-status">${T('Ya canjeado. ¡Gracias por venir!', 'Already redeemed. Thanks for coming!')}</p>
    </div>`;
  }
  return html`<div class="coupon">
    <p class="coupon-label">${T('Tu cupón', 'Your coupon')}</p>
    <img class="coupon-qr" src="/cupon/${esc(coupon.code)}.svg" width="180" height="180" alt="${T('Código QR del cupón', 'Coupon QR code')} ${esc(coupon.code)}">
    <p class="coupon-code">${esc(coupon.code)}</p>
    <p class="coupon-status">${T('Enseña esta pantalla al pedir. Lo escaneamos y listo.', 'Show this screen when you order. We scan it and that’s it.')}</p>
  </div>`;
}

export function promoEndedPage(promo, lang) {
  const T = tr(lang);
  return promoShell({
    promo,
    lang,
    inner: html`
<article class="ticket ticket-ended">
  <div class="ticket-top">
    <span class="ticket-kicker">${T('Promo finalizada', 'Offer ended')}</span>
    <h1>${esc(promo.title)}</h1>
    <p class="ticket-desc">${T(
      'Esta promoción ya no está disponible. Síguenos en Instagram para no perderte la próxima.',
      'This offer is no longer available. Follow us on Instagram so you don’t miss the next one.',
    )}</p>
  </div>
</article>
${sign({ href: waLink(promo), color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: T('Reservar mesa por', 'Book a table on'), smallFirst: true })}`,
  });
}

export function notFoundPage(lang = 'es') {
  const T = tr(lang);
  return page(lang, {
    title: `${T('Página no encontrada', 'Page not found')} · El Club de las Brasas`,
    robots: 'noindex',
    body: html`
<main class="promo-page">
  <a href="/" class="promo-logo-link">${logo('logo promo-logo')}</a>
  <article class="ticket ticket-ended"><div class="ticket-top">
    <h1>${T('Aquí no hay brasa', 'No embers here')}</h1>
    <p class="ticket-desc">${T('La página que buscas no existe.', 'The page you’re looking for doesn’t exist.')}</p>
  </div></article>
  ${sign({ href: '/', color: 'black', icon: 'home', big: T('Inicio', 'Home'), small: T('Volver al', 'Back to'), smallFirst: true })}
</main>`,
  });
}

/* Landings de los QR impresos (tarjeta personal y flyer): logo y una columna de botones, pensadas para móvil. */

const SIGN_FLAME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5c2.5 3 5 5.4 5 9a5 5 0 0 1-10 0c0-1.8.8-3.2 1.8-4.3.2 1.6 1 2.6 2 3 0-2.6.2-5.2 1.2-7.7z"/></svg>`;

// Sin teléfono en Ajustes, «Llamar» marca el mismo número de WhatsApp.
const telOf = (s) => (s.phone || `+${s.whatsapp_number}`).replace(/[^\d+]/g, '');

function linksPage(s, lang, buttons) {
  const T = tr(lang);
  return page(lang, {
    title: `El Club de las Brasas · ${T('Parrilla argentina en El Palo', 'Argentine grill in El Palo')}`,
    description: T(
      'Parrilla argentina a la brasa en El Palo, Málaga. Carta, reservas por WhatsApp y teléfono.',
      'Argentine wood-fire grill in El Palo, Málaga. Menu, bookings on WhatsApp and by phone.',
    ),
    robots: 'noindex,nofollow',
    body: html`
<main class="links-page">
  <a href="/" class="links-brand">
    ${parrillitaImg('links-art')}
  </a>
  <h1 class="sr-only">El Club de las Brasas</h1>
  <nav class="links-list">${buttons}</nav>
  <p class="links-foot sign-foot"><span class="sign-flame" aria-hidden="true">${SIGN_FLAME}</span>${esc(s.address)}<br>${esc(hoursOf(s, lang))}</p>
</main>`,
  });
}

export function tarjetaPage(s, lang) {
  const T = tr(lang);
  return linksPage(s, lang, [
    sign({ href: '/eventos?src=tarjeta', color: 'cream', icon: 'calendar', big: T('Eventos', 'Events'), small: T('en el club', 'at the club') }),
    sign({ href: '/catering?src=tarjeta', color: 'red', icon: 'grill', big: 'Catering', small: T('y parrilladas', '& barbecues') }),
    sign({ href: '/', color: 'black', icon: 'steak', big: T('Parrilla', 'Grill'), small: T('Nuestra', 'Our'), smallFirst: true }),
    sign({ href: '/go/whatsapp?motivo=eventos&src=tarjeta', color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: T('Hablemos por', 'Chat with us on'), smallFirst: true }),
    sign({ href: `tel:${telOf(s)}`, color: 'cream', icon: 'phone', big: T('Contacto', 'Contact') }),
  ].join(''));
}

export function flyerPage(s, lang) {
  const T = tr(lang);
  return linksPage(s, lang, [
    sign({ href: '/go/carta', color: 'cream', icon: 'menu', big: T('Carta', 'Menu'), small: T('Ver la', 'See the'), smallFirst: true }),
    sign({ href: '/', color: 'black', icon: 'steak', big: T('Parrilla', 'Grill'), small: T('Nuestra', 'Our'), smallFirst: true }),
    sign({ href: '/go/whatsapp?src=flyer', color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: T('Reserva por', 'Book on'), smallFirst: true, label: T('Reservar por WhatsApp', 'Book on WhatsApp') }),
    sign({ href: `tel:${telOf(s)}`, color: 'red', icon: 'phone', big: T('Llamar', 'Call') }),
  ].join(''));
}

/* Páginas de eventos en el club y de catering (desde la tarjeta). Misma plantilla, distinto contenido.
   Fotos de prueba en /img/eventos y /img/catering: se cambian sustituyendo los ficheros.
   Cada texto como { es, en }. */
const SERVICES = {
  eventos: {
    title: { es: 'Eventos en el club', en: 'Events at the club' },
    kicker: { es: 'Tu evento, a la brasa', en: 'Your event, on the grill' },
    description: {
      es: 'Eventos privados, catas de vino, reuniones de equipo y celebraciones a la brasa en El Palo, Málaga.',
      en: 'Private events, wine tastings, team gatherings and celebrations around the grill in El Palo, Málaga.',
    },
    lead: {
      es: 'Celebra con parrilla argentina, buen vino y la sobremesa larga de toda la vida, a un paso del mar.',
      en: 'Celebrate with Argentine barbecue, good wine and long, unhurried meals, just steps from the sea.',
    },
    photos: [
      ['eventos/evento-1.jpg', { es: 'Mesa larga de cumpleaños', en: 'Long birthday table' }],
      ['eventos/evento-2.jpg', { es: 'Parrilla encendida para un grupo', en: 'Grill fired up for a group' }],
      ['eventos/evento-3.jpg', { es: 'Comida de empresa', en: 'Company lunch' }],
      ['eventos/evento-4.jpg', { es: 'Tabla de carnes para compartir', en: 'Meat board to share' }],
      ['eventos/evento-5.jpg', { es: 'Brindis en el club', en: 'A toast at the club' }],
      ['eventos/evento-6.jpg', { es: 'Sobremesa con amigos', en: 'Lingering with friends' }],
    ],
    typesTitle: { es: 'Qué celebramos', en: 'What we host' },
    types: {
      es: ['Eventos privados en el salón', 'Catas de vino', 'Reuniones de equipo', 'Comidas de empresa', 'Cumpleaños', 'Despedidas'],
      en: ['Private events in our dining room', 'Wine tastings', 'Team gatherings', 'Company lunches', 'Birthdays', 'Farewell parties'],
    },
    steps: {
      es: [
        ['Nos cuentas tu idea', 'Fecha, cuántos sois y qué celebráis. Por WhatsApp o por teléfono, como prefieras.'],
        ['Armamos el menú', 'Te proponemos un menú a medida: parrillada, empanadas, milanesas, opciones veggie y bebida.'],
        ['Reservamos el espacio', 'Confirmamos día, hora y número de personas, y te guardamos la mesa para el grupo.'],
        ['Disfrutas, nosotros a la brasa', 'El día del evento sólo tienes que venir. La parrilla, el servicio y la sobremesa corren de nuestra cuenta.'],
      ],
      en: [
        ['Tell us your idea', 'Date, how many of you and what you’re celebrating. On WhatsApp or by phone, whichever you prefer.'],
        ['We plan the menu', 'We suggest a tailored menu: mixed grill, empanadas, milanesas, veggie options and drinks.'],
        ['We book the space', 'We confirm the day, time and number of guests, and keep the table for your group.'],
        ['You enjoy, we grill', 'On the day you just turn up. The grill, the service and the long chat afterwards are on us.'],
      ],
    },
  },
  catering: {
    title: { es: 'Catering', en: 'Catering' },
    kicker: { es: 'Llevamos la brasa a tu evento', en: 'We bring the grill to your event' },
    description: {
      es: 'Catering de parrilla argentina para bodas, cumpleaños y festejos en Málaga.',
      en: 'Argentine barbecue catering for weddings, birthdays and celebrations in Málaga.',
    },
    lead: {
      es: 'Parrilla argentina donde tú digas: llevamos el fuego, la carne y el parrillero para que tu evento sea a la brasa.',
      en: 'Argentine barbecue wherever you want it: we bring the fire, the meat and the grill master.',
    },
    photos: [
      ['catering/catering-1.jpg', { es: 'Parrilla montada en un jardín', en: 'Grill set up in a garden' }],
      ['catering/catering-2.jpg', { es: 'Parrillero sirviendo a los invitados', en: 'Grill master serving guests' }],
      ['catering/catering-3.jpg', { es: 'Mesa de catering con carnes y ensaladas', en: 'Catering table with meats and salads' }],
      ['catering/catering-4.jpg', { es: 'Empanadas recién horneadas', en: 'Freshly baked empanadas' }],
      ['catering/catering-5.jpg', { es: 'Invitados alrededor del fuego', en: 'Guests around the fire' }],
      ['catering/catering-6.jpg', { es: 'Cortes a la brasa listos para servir', en: 'Grilled cuts ready to serve' }],
    ],
    typesTitle: { es: 'Para qué ocasiones', en: 'For which occasions' },
    types: {
      es: ['Bodas', 'Cumpleaños', 'Festejos', 'Eventos de empresa', 'Fiestas privadas'],
      en: ['Weddings', 'Birthdays', 'Celebrations', 'Corporate events', 'Private parties'],
    },
    steps: {
      es: [
        ['Nos cuentas tu evento', 'Fecha, lugar y número de invitados. Por WhatsApp o por teléfono, como prefieras.'],
        ['Diseñamos el menú', 'Te proponemos un menú a medida: cortes a la parrilla, empanadas, guarniciones, opciones veggie y postre.'],
        ['Llevamos la parrilla', 'Vamos al lugar con todo lo necesario y nuestro parrillero se encarga del fuego.'],
        ['Tú disfrutas', 'Servimos a tus invitados y dejamos todo recogido. Tú sólo tienes que disfrutar.'],
      ],
      en: [
        ['Tell us about your event', 'Date, venue and number of guests. On WhatsApp or by phone, whichever you prefer.'],
        ['We design the menu', 'We suggest a tailored menu: grilled cuts, empanadas, sides, veggie options and dessert.'],
        ['We bring the grill', 'We come to the venue with everything needed and our grill master takes care of the fire.'],
        ['You enjoy', 'We serve your guests and clean up afterwards. All you have to do is enjoy.'],
      ],
    },
  },
};

function servicePage(s, lang, key) {
  const T = tr(lang);
  const c = SERVICES[key];
  return page(lang, {
    title: `${c.title[lang]} · El Club de las Brasas`,
    description: c.description[lang],
    robots: 'noindex,nofollow',
    body: html`
<main class="ev-page">
  ${backSign(T)}
  <a href="/" class="promo-logo-link">${logo('logo promo-logo')}</a>
  <header class="ev-head">
    <p class="hero-kicker">${c.kicker[lang]}</p>
    <h1>${c.title[lang]}</h1>
    <p class="ev-lead">${c.lead[lang]}</p>
  </header>

  <div class="ev-gallery" aria-label="${T('Fotos', 'Photos')}: ${c.title[lang]}">
    ${c.photos.map(([f, alt]) => `<img src="/img/${f}" width="900" height="675" alt="${esc(alt[lang])}" loading="lazy">`)}
  </div>

  <section>
    <h2>${c.typesTitle[lang]}</h2>
    <ul class="chips">${c.types[lang].map((t) => `<li>${t}</li>`)}</ul>
  </section>

  <section>
    <h2>${T('Cómo funciona', 'How it works')}</h2>
    <ol class="ev-steps">
      ${c.steps[lang].map(([t, d]) => `<li><h3>${t}</h3><p>${d}</p></li>`)}
    </ol>
  </section>

  <div class="ev-cta">
    ${sign({ href: `/go/whatsapp?motivo=${key}&src=${key}`, color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: T('Pedir presupuesto por', 'Get a quote on'), smallFirst: true })}
    ${sign({ href: `tel:${telOf(s)}`, color: 'red', icon: 'phone', big: T('Llamar', 'Call') })}
  </div>
  <p class="links-foot">${esc(s.address)}<br>${esc(hoursOf(s, lang))}</p>
</main>`,
  });
}

export const eventosPage = (s, lang) => servicePage(s, lang, 'eventos');
export const cateringPage = (s, lang) => servicePage(s, lang, 'catering');

/* Tienda por encargo: el pedido se manda por WhatsApp (GET /go/pedido arma el mensaje). Funciona sin JS;
   el script sólo añade los botones − / + y el resumen. */
export function tiendaPage(s, lang, { empty = false } = {}) {
  const T = tr(lang);
  return page(lang, {
    title: `${T('Tienda por encargo', 'Made-to-order shop')} · El Club de las Brasas`,
    description: T(
      'Empanadas y milanesas congeladas por encargo en El Palo, Málaga. Haz tu pedido por WhatsApp y recógelo en el club.',
      'Frozen empanadas and milanesas made to order in El Palo, Málaga. Order on WhatsApp and pick it up at the club.',
    ),
    body: html`
<main class="ev-page store-page">
  ${backSign(T)}
  <a href="/" class="promo-logo-link">${logo('logo promo-logo')}</a>
  <header class="ev-head">
    <p class="hero-kicker">${T('Tienda · por encargo', 'Shop · made to order')}</p>
    <h1>${T('El club en tu congelador', 'The club in your freezer')}</h1>
    <p class="ev-lead">${T(
      'Elige cuántas quieres de cada una y mándanos el pedido por WhatsApp. Te confirmamos el día para pasar a recogerlo por',
      'Choose how many of each you’d like and send us your order on WhatsApp. We’ll confirm the day you can pick it up at',
    )} ${esc(s.address)}.</p>
  </header>
  ${empty ? `<p class="store-empty">${T('Elige al menos un producto para hacer el pedido.', 'Choose at least one product to place your order.')}</p>` : ''}
  <form class="store-form" method="get" action="/go/pedido">
    ${STORE.map((c) => html`<section class="store-cat" id="${c.id}">
      <div class="store-cat-head">
        <img src="${c.img}" width="318" height="318" alt="${esc(T(c.title, c.title_en))}" loading="lazy">
        <div><h2>${T(c.title, c.title_en)}</h2><p>${T(c.note, c.note_en)}</p></div>
      </div>
      <ul class="store-items">
        ${c.items.map((i) => html`<li class="store-item">
          <div class="store-item-txt"><h3>${T(i.name, i.name_en)}</h3><p>${T(i.desc, i.desc_en)}</p><p class="store-price">${fmtPrice(i.price, lang)}</p></div>
          <div class="qty">
            <button type="button" class="qty-btn" data-step="-1" aria-label="${T('Quitar una', 'Remove one')}">${SIGN_ICONS.minus}</button>
            <input type="number" name="q_${i.id}" value="0" min="0" max="99" inputmode="numeric" aria-label="${T('Cantidad de', 'Quantity of')} ${esc(T(i.name, i.name_en))}">
            <button type="button" class="qty-btn" data-step="1" aria-label="${T('Añadir una', 'Add one')}">${SIGN_ICONS.plus}</button>
          </div>
        </li>`)}
      </ul>
    </section>`)}
    <div class="store-bar">
      <p class="store-sum" aria-live="polite">${T('Tu pedido está vacío', 'Your order is empty')}</p>
      ${sign({ submit: true, color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: T('Pedir por', 'Order on'), smallFirst: true })}
    </div>
  </form>
  <p class="links-foot">${esc(s.address)}<br>${esc(hoursOf(s, lang))}</p>
</main>
<script>
  // Botones − / + y resumen del pedido.
  const form = document.querySelector('.store-form');
  const sum = document.querySelector('.store-sum');
  const words = ${JSON.stringify(T(['unidad en tu pedido', 'unidades en tu pedido', 'Tu pedido está vacío'], ['item in your order', 'items in your order', 'Your order is empty']))};
  const update = () => {
    const n = [...form.querySelectorAll('input[type=number]')].reduce((t, i) => t + (parseInt(i.value, 10) || 0), 0);
    sum.textContent = n ? n + ' ' + (n === 1 ? words[0] : words[1]) : words[2];
  };
  form.addEventListener('click', (e) => {
    const b = e.target.closest('.qty-btn'); if (!b) return;
    const input = b.parentElement.querySelector('input');
    input.value = Math.min(99, Math.max(0, (parseInt(input.value, 10) || 0) + Number(b.dataset.step)));
    update();
  });
  form.addEventListener('input', update);
  update();
</script>`,
  });
}
