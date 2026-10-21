import { layout, html, esc, logo, waIcon } from './layout.js';
import { STORE, fmtPrice } from '../store.js';

const waLink = (promo) => `/go/whatsapp${promo ? `?promo=${promo.id}` : ''}`;

const fmtDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

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

// Qué se ofrece en las secciones de eventos y catering de la home.
const HOME_EVENTS = ['Eventos privados en el salón', 'Catas de vino', 'Reuniones de equipo', 'Comidas de empresa', 'Cumpleaños'];
const HOME_CATERING = ['Bodas', 'Cumpleaños', 'Festejos', 'Eventos de empresa'];

// Imagen de portada (la misma de la tarjeta y el flyer).
const parrillitaImg = (cls) => html`<picture>
  <source srcset="/img/parrillita.webp" type="image/webp">
  <img class="${cls}" src="/img/parrillita.png" width="1080" height="1478" alt="El Club de las Brasas · Parrillita al paso &amp; take away">
</picture>`;

export function homePage(s) {
  const mapQuery = encodeURIComponent(`El Club de las Brasas, ${s.address}`);
  // «Martes a domingo · 13:00–16:30 y 20:00–00:00» → dos renglones.
  const hours = s.hours.split(/\s*·\s*/).map(esc).join('<br>');
  return layout({
    title: 'El Club de las Brasas · Parrilla argentina en El Palo, Málaga',
    description: 'Parrilla argentina a la brasa en El Palo, Málaga. Carnes, empanadas y milanesas. Reserva tu mesa por WhatsApp.',
    body: html`
<header class="h-intro">
  <h1 class="sr-only">El Club de las Brasas · Parrilla argentina en El Palo, Málaga</h1>
  ${parrillitaImg('h-intro-art')}
  <a class="h-scroll" href="#conocenos" aria-label="Bajar">↓</a>
</header>

<main>
  <!-- El vídeo es sticky sólo dentro de este bloque: el panel bordó sube sobre él y luego todo sigue normal. -->
  <div class="h-stack">
  <section class="h-video" id="conocenos">
    <video class="h-video-bg" autoplay muted loop playsinline preload="metadata" poster="/video/parrilla-poster.jpg" aria-hidden="true">
      <source src="/video/parrilla.mp4" type="video/mp4">
    </video>
    <div class="h-video-copy">
      <p class="hero-kicker">Parrilla argentina</p>
      <h2>Conócenos</h2>
      <p class="h-video-lead">Fuego lento, carne de verdad y la sobremesa larga de toda la vida, a un paso del mar.</p>
      <p class="h-place">${esc(s.address)}</p>
      <div class="sign-solo">${sign({ href: `https://www.google.com/maps/search/?api=1&query=${mapQuery}`, color: 'black', icon: 'pin', big: 'Llegar', small: 'Cómo', smallFirst: true, external: true })}</div>
    </div>
  </section>

  <section class="reserve">
    <h2>¿Te guardamos una mesa?</h2>
    <p>Escríbenos por WhatsApp con el día, la hora y cuántos sois. Te confirmamos al momento.</p>
    <p class="reserve-hours">${hours}</p>
    <div class="reserve-ctas">
      ${sign({ href: waLink(), color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: 'Reservar por', smallFirst: true })}
      ${sign({ href: '/go/carta', color: 'cream', icon: 'menu', big: 'Carta', small: 'Ver la', smallFirst: true })}
    </div>
  </section>
  </div>

  <section class="h-events">
    <img class="h-events-bg" src="/img/eventos-portada.jpg" width="1000" height="982" alt="" loading="lazy">
    <div class="h-events-copy">
      <p class="hero-kicker">Eventos en el club</p>
      <h2>Tu celebración, a la brasa</h2>
      <p>Reservamos el salón para ti y encendemos la parrilla para todo el grupo.</p>
      <ul class="chips">${HOME_EVENTS.map((t) => `<li>${t}</li>`)}</ul>
      <div class="sign-solo">${sign({ href: '/eventos?src=home', color: 'cream', icon: 'calendar', big: 'Eventos', small: 'Ver', smallFirst: true })}</div>
    </div>
  </section>

  <section class="h-events h-catering">
    <img class="h-events-bg" src="/img/catering-portada.jpg" width="1000" height="1000" alt="" loading="lazy">
    <div class="h-events-copy">
      <p class="hero-kicker">Catering</p>
      <h2>Llevamos la brasa a tu fiesta</h2>
      <p>Parrilla argentina donde tú digas, con el fuego, la carne y el parrillero.</p>
      <ul class="chips">${HOME_CATERING.map((t) => `<li>${t}</li>`)}</ul>
      <div class="sign-solo">${sign({ href: '/catering?src=home', color: 'red', icon: 'grill', big: 'Catering', small: 'Ver', smallFirst: true })}</div>
    </div>
  </section>

  <section class="h-store">
    <p class="hero-kicker">Tienda · por encargo</p>
    <h2>El club en tu congelador</h2>
    <p class="h-store-lead">Empanadas y milanesas congeladas, hechas en el club. Haz tu pedido y te avisamos cuándo pasar a recogerlo.</p>
    <div class="h-store-grid">
      ${STORE.map((c) => html`<a class="h-store-card" href="/tienda?src=home#${c.id}">
        <img src="${c.img}" width="318" height="318" alt="" loading="lazy">
        <span><strong>${c.title}</strong><small>${c.items.length} ${c.id === 'empanadas' ? 'sabores' : 'variedades'}</small></span>
      </a>`)}
    </div>
    <div class="sign-solo">${sign({ href: '/tienda?src=home', color: 'black', icon: 'bag', big: 'Pedido', small: 'Hacer mi', smallFirst: true })}</div>
  </section>
</main>

<footer class="foot">
  ${logo('logo foot-logo')}
  <p><a href="${esc(s.instagram)}" target="_blank" rel="noopener">Instagram</a> · © ${new Date().getFullYear()} El Club de las Brasas · El Palo, Málaga</p>
</footer>

<a class="fab-wa" href="${waLink()}" aria-label="Reservar por WhatsApp">${waIcon}</a>
<script>
  // Sin animación para quien la tiene desactivada en el sistema: el vídeo se queda en el póster.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelector('.h-video-bg')?.pause();
</script>`,
  });
}

function promoShell({ promo, inner, robots = 'noindex,nofollow' }) {
  return layout({
    title: `${promo.title} · El Club de las Brasas`,
    description: promo.description,
    robots,
    body: html`
<main class="promo-page">
  <a href="/" class="promo-logo-link">${logo('logo promo-logo')}</a>
  ${inner}
  <p class="promo-foot"><a href="/">elclubdelasbrasas</a> · Parrilla argentina en El Palo, Málaga</p>
</main>`,
  });
}

export function promoPage(promo, { coupon, src }) {
  return promoShell({
    promo,
    inner: html`
<article class="ticket">
  <div class="ticket-top">
    <span class="ticket-kicker">Promo exclusiva</span>
    <p class="ticket-badge">${esc(promo.badge || promo.title)}</p>
    <h1>${esc(promo.title)}</h1>
    <p class="ticket-desc">${esc(promo.description)}</p>
  </div>
  <div class="ticket-cut" aria-hidden="true"></div>
  <div class="ticket-bottom">
    ${coupon
      ? couponBlock(coupon)
      : html`
    <form method="post" action="/p/${esc(promo.slug)}/cupon">
      <input type="hidden" name="src" value="${esc(src)}">
      ${sign({ submit: true, color: 'red', icon: 'ticket', big: 'Cupón', small: 'Obtener mi', smallFirst: true })}
    </form>
    <p class="ticket-hint">Te damos un código único para enseñar en el local.</p>`}
    ${promo.conditions ? `<p class="ticket-cond">${esc(promo.conditions)}</p>` : ''}
    ${promo.valid_until ? `<p class="ticket-cond">Válido hasta el ${fmtDate(promo.valid_until)}.</p>` : ''}
  </div>
</article>
${sign({ href: waLink(promo), color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: 'Reservar mesa por', smallFirst: true })}`,
  });
}

function couponBlock(coupon) {
  if (coupon.redeemed_at) {
    return html`<div class="coupon coupon-used">
      <p class="coupon-label">Cupón</p>
      <p class="coupon-code">${esc(coupon.code)}</p>
      <p class="coupon-status">Ya canjeado. ¡Gracias por venir!</p>
    </div>`;
  }
  return html`<div class="coupon">
    <p class="coupon-label">Tu cupón</p>
    <img class="coupon-qr" src="/cupon/${esc(coupon.code)}.svg" width="180" height="180" alt="Código QR del cupón ${esc(coupon.code)}">
    <p class="coupon-code">${esc(coupon.code)}</p>
    <p class="coupon-status">Enseña esta pantalla al pedir. Lo escaneamos y listo.</p>
  </div>`;
}

export function promoEndedPage(promo) {
  return promoShell({
    promo,
    inner: html`
<article class="ticket ticket-ended">
  <div class="ticket-top">
    <span class="ticket-kicker">Promo finalizada</span>
    <h1>${esc(promo.title)}</h1>
    <p class="ticket-desc">Esta promoción ya no está disponible. Síguenos en Instagram para no perderte la próxima.</p>
  </div>
</article>
${sign({ href: waLink(promo), color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: 'Reservar mesa por', smallFirst: true })}`,
  });
}

export function notFoundPage() {
  return layout({
    title: 'Página no encontrada · El Club de las Brasas',
    robots: 'noindex',
    body: html`
<main class="promo-page">
  <a href="/" class="promo-logo-link">${logo('logo promo-logo')}</a>
  <article class="ticket ticket-ended"><div class="ticket-top">
    <h1>Aquí no hay brasa</h1>
    <p class="ticket-desc">La página que buscas no existe.</p>
  </div></article>
  ${sign({ href: '/', color: 'black', icon: 'home', big: 'Inicio', small: 'Volver al', smallFirst: true })}
</main>`,
  });
}

/* Landings de los QR impresos (tarjeta personal y flyer): logo y una columna de botones, pensadas para móvil. */

const SIGN_FLAME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5c2.5 3 5 5.4 5 9a5 5 0 0 1-10 0c0-1.8.8-3.2 1.8-4.3.2 1.6 1 2.6 2 3 0-2.6.2-5.2 1.2-7.7z"/></svg>`;

// Sin teléfono en Ajustes, «Llamar» marca el mismo número de WhatsApp.
const telOf = (s) => (s.phone || `+${s.whatsapp_number}`).replace(/[^\d+]/g, '');

function linksPage(s, buttons) {
  return layout({
    title: 'El Club de las Brasas · Parrilla argentina en El Palo',
    description: 'Parrilla argentina a la brasa en El Palo, Málaga. Carta, reservas por WhatsApp y teléfono.',
    robots: 'noindex,nofollow',
    body: html`
<main class="links-page">
  <a href="/" class="links-brand">
    ${parrillitaImg('links-art')}
  </a>
  <h1 class="sr-only">El Club de las Brasas</h1>
  <nav class="links-list">${buttons}</nav>
  <p class="links-foot sign-foot"><span class="sign-flame" aria-hidden="true">${SIGN_FLAME}</span>${esc(s.address)}<br>${esc(s.hours)}</p>
</main>`,
  });
}

export const tarjetaPage = (s) => linksPage(s, [
  sign({ href: '/eventos?src=tarjeta', color: 'cream', icon: 'calendar', big: 'Eventos', small: 'en el club' }),
  sign({ href: '/catering?src=tarjeta', color: 'red', icon: 'grill', big: 'Catering', small: 'y parrilladas' }),
  sign({ href: '/', color: 'black', icon: 'steak', big: 'Parrilla', small: 'Nuestra', smallFirst: true }),
  sign({ href: '/go/whatsapp?motivo=eventos&src=tarjeta', color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: 'Hablemos por', smallFirst: true }),
  sign({ href: `tel:${telOf(s)}`, color: 'cream', icon: 'phone', big: 'Contacto' }),
].join(''));

export const flyerPage = (s) => linksPage(s, [
  sign({ href: '/go/carta', color: 'cream', icon: 'menu', big: 'Carta', small: 'Ver la', smallFirst: true }),
  sign({ href: '/', color: 'black', icon: 'steak', big: 'Parrilla', small: 'Nuestra', smallFirst: true }),
  sign({ href: '/go/whatsapp?src=flyer', color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: 'Reserva por', smallFirst: true, label: 'Reservar por WhatsApp' }),
  sign({ href: `tel:${telOf(s)}`, color: 'red', icon: 'phone', big: 'Llamar' }),
].join(''));

/* Páginas de eventos en el club y de catering (desde la tarjeta). Misma plantilla, distinto contenido.
   Fotos de prueba en /img/eventos y /img/catering: se cambian sustituyendo los ficheros. */

const SERVICES = {
  eventos: {
    title: 'Eventos en el club',
    kicker: 'Tu evento, a la brasa',
    description: 'Cumpleaños, comidas de empresa y celebraciones a la brasa en El Palo, Málaga.',
    lead: 'Celebra con parrilla argentina, buen vino y la sobremesa larga de toda la vida, a un paso del mar.',
    photos: [
      ['eventos/evento-1.jpg', 'Mesa larga de cumpleaños'],
      ['eventos/evento-2.jpg', 'Parrilla encendida para un grupo'],
      ['eventos/evento-3.jpg', 'Comida de empresa'],
      ['eventos/evento-4.jpg', 'Tabla de carnes para compartir'],
      ['eventos/evento-5.jpg', 'Brindis en el club'],
      ['eventos/evento-6.jpg', 'Sobremesa con amigos'],
    ],
    types: ['Eventos privados en el salón', 'Catas de vino', 'Reuniones de equipo', 'Comidas de empresa', 'Cumpleaños', 'Despedidas'],
    steps: [
      ['Nos cuentas tu idea', 'Fecha, cuántos sois y qué celebráis. Por WhatsApp o por teléfono, como prefieras.'],
      ['Armamos el menú', 'Te proponemos un menú a medida: parrillada, empanadas, milanesas, opciones veggie y bebida.'],
      ['Reservamos el espacio', 'Confirmamos día, hora y número de personas, y te guardamos la mesa para el grupo.'],
      ['Disfrutas, nosotros a la brasa', 'El día del evento sólo tienes que venir. La parrilla, el servicio y la sobremesa corren de nuestra cuenta.'],
    ],
  },
  catering: {
    title: 'Catering',
    kicker: 'Llevamos la brasa a tu evento',
    description: 'Catering de parrilla argentina para bodas, empresas y fiestas privadas en Málaga.',
    lead: 'Parrilla argentina donde tú digas: llevamos el fuego, la carne y el parrillero para que tu evento sea a la brasa.',
    photos: [
      ['catering/catering-1.jpg', 'Parrilla montada en un jardín'],
      ['catering/catering-2.jpg', 'Parrillero sirviendo a los invitados'],
      ['catering/catering-3.jpg', 'Mesa de catering con carnes y ensaladas'],
      ['catering/catering-4.jpg', 'Empanadas recién horneadas'],
      ['catering/catering-5.jpg', 'Invitados alrededor del fuego'],
      ['catering/catering-6.jpg', 'Cortes a la brasa listos para servir'],
    ],
    types: ['Bodas', 'Cumpleaños', 'Festejos', 'Eventos de empresa', 'Fiestas privadas'],
    steps: [
      ['Nos cuentas tu evento', 'Fecha, lugar y número de invitados. Por WhatsApp o por teléfono, como prefieras.'],
      ['Diseñamos el menú', 'Te proponemos un menú a medida: cortes a la parrilla, empanadas, guarniciones, opciones veggie y postre.'],
      ['Llevamos la parrilla', 'Vamos al lugar con todo lo necesario y nuestro parrillero se encarga del fuego.'],
      ['Tú disfrutas', 'Servimos a tus invitados y dejamos todo recogido. Tú sólo tienes que disfrutar.'],
    ],
  },
};

function servicePage(s, key) {
  const c = SERVICES[key];
  return layout({
    title: `${c.title} · El Club de las Brasas`,
    description: c.description,
    robots: 'noindex,nofollow',
    body: html`
<main class="ev-page">
  <a href="/" class="promo-logo-link">${logo('logo promo-logo')}</a>
  <header class="ev-head">
    <p class="hero-kicker">${c.kicker}</p>
    <h1>${c.title}</h1>
    <p class="ev-lead">${c.lead}</p>
  </header>

  <div class="ev-gallery" aria-label="Fotos de ${c.title.toLowerCase()}">
    ${c.photos.map(([f, alt]) => `<img src="/img/${f}" width="900" height="675" alt="${esc(alt)}" loading="lazy">`)}
  </div>

  <section>
    <h2>${key === 'catering' ? 'Para qué ocasiones' : 'Qué celebramos'}</h2>
    <ul class="chips">${c.types.map((t) => `<li>${t}</li>`)}</ul>
  </section>

  <section>
    <h2>Cómo funciona</h2>
    <ol class="ev-steps">
      ${c.steps.map(([t, d]) => `<li><h3>${t}</h3><p>${d}</p></li>`)}
    </ol>
  </section>

  <div class="ev-cta">
    ${sign({ href: `/go/whatsapp?motivo=${key}&src=${key}`, color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: 'Pedir presupuesto por', smallFirst: true })}
    ${sign({ href: `tel:${telOf(s)}`, color: 'red', icon: 'phone', big: 'Llamar' })}
  </div>
  <p class="links-foot">${esc(s.address)}<br>${esc(s.hours)}</p>
</main>`,
  });
}

export const eventosPage = (s) => servicePage(s, 'eventos');
export const cateringPage = (s) => servicePage(s, 'catering');

/* Tienda por encargo: el pedido se manda por WhatsApp (GET /go/pedido arma el mensaje). Funciona sin JS;
   el script sólo añade los botones − / + y el resumen. */
export function tiendaPage(s, { empty = false } = {}) {
  return layout({
    title: 'Tienda por encargo · El Club de las Brasas',
    description: 'Empanadas y milanesas congeladas por encargo en El Palo, Málaga. Haz tu pedido por WhatsApp y recógelo en el club.',
    body: html`
<main class="ev-page store-page">
  <a href="/" class="promo-logo-link">${logo('logo promo-logo')}</a>
  <header class="ev-head">
    <p class="hero-kicker">Tienda · por encargo</p>
    <h1>El club en tu congelador</h1>
    <p class="ev-lead">Elige cuántas quieres de cada una y mándanos el pedido por WhatsApp. Te confirmamos el día para pasar a recogerlo por ${esc(s.address)}.</p>
  </header>
  ${empty ? '<p class="store-empty">Elige al menos un producto para hacer el pedido.</p>' : ''}
  <form class="store-form" method="get" action="/go/pedido">
    ${STORE.map((c) => html`<section class="store-cat" id="${c.id}">
      <div class="store-cat-head">
        <img src="${c.img}" width="318" height="318" alt="${esc(c.title)}" loading="lazy">
        <div><h2>${c.title}</h2><p>${c.note}</p></div>
      </div>
      <ul class="store-items">
        ${c.items.map((i) => html`<li class="store-item">
          <div class="store-item-txt"><h3>${i.name}</h3><p>${i.desc}</p><p class="store-price">${fmtPrice(i.price)}</p></div>
          <div class="qty">
            <button type="button" class="qty-btn" data-step="-1" aria-label="Quitar una">${SIGN_ICONS.minus}</button>
            <input type="number" name="q_${i.id}" value="0" min="0" max="99" inputmode="numeric" aria-label="Cantidad de ${esc(i.name)}">
            <button type="button" class="qty-btn" data-step="1" aria-label="Añadir una">${SIGN_ICONS.plus}</button>
          </div>
        </li>`)}
      </ul>
    </section>`)}
    <div class="store-bar">
      <p class="store-sum" aria-live="polite">Tu pedido está vacío</p>
      ${sign({ submit: true, color: 'green', icon: 'whatsapp', big: 'WhatsApp', small: 'Pedir por', smallFirst: true })}
    </div>
  </form>
  <p class="links-foot">${esc(s.address)}<br>${esc(s.hours)}</p>
</main>
<script>
  // Botones − / + y resumen del pedido.
  const form = document.querySelector('.store-form');
  const sum = document.querySelector('.store-sum');
  const update = () => {
    const n = [...form.querySelectorAll('input[type=number]')].reduce((t, i) => t + (parseInt(i.value, 10) || 0), 0);
    sum.textContent = n ? n + (n === 1 ? ' unidad en tu pedido' : ' unidades en tu pedido') : 'Tu pedido está vacío';
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
