import { layout, html, esc, logo, waIcon } from './layout.js';

const MENU_SECTIONS = ['Para picotear', 'Empanadas', 'A la parrilla', 'Milanesas', 'Bocatas', 'Ensaladas', 'Veggie', 'Complementos', 'Bebidas'];

const waLink = (promo) => `/go/whatsapp${promo ? `?promo=${promo.id}` : ''}`;

const fmtDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

export function homePage(s) {
  const mapQuery = encodeURIComponent(`El Club de las Brasas, ${s.address}`);
  return layout({
    title: 'El Club de las Brasas · Parrilla argentina en El Palo, Málaga',
    description: 'Parrilla argentina a la brasa en El Palo, Málaga. Carnes, empanadas y milanesas. Reserva tu mesa por WhatsApp.',
    body: html`
<header class="hero">
  <div class="hero-inner">
    ${logo('logo hero-logo')}
    <p class="hero-kicker">Parrilla argentina · El Palo, Málaga</p>
    <h1 class="sr-only">El Club de las Brasas</h1>
    <p class="hero-lead">Fuego lento, carne de verdad y la sobremesa larga de toda la vida, a un paso del mar.</p>
    <div class="cta-row">
      <a class="btn btn-wa" href="${waLink()}">${waIcon} Reservar por WhatsApp</a>
      <a class="btn btn-ghost" href="/go/carta">Ver la carta</a>
    </div>
  </div>
  <div class="embers" aria-hidden="true"></div>
</header>

<main>
  <section class="story">
    <figure class="story-art">
      <img src="/img/ilustracion.jpg" width="1062" height="1100" alt="Ilustración de un sifón, un vaso de vino y una tabla con carne a la brasa, pan, cuchillo y tenedor" loading="lazy">
    </figure>
    <div class="story-copy">
      <h2>Bienvenido al club</h2>
      <p>Aquí la brasa manda. Cortes a la parrilla, empanadas recién horneadas, milanesas como las de casa y un buen tinto con soda para acompañar.</p>
      <p>Sin prisas, como se come en Argentina. Ven con amigos, con la familia o solo. En el club siempre hay sitio.</p>
      <ul class="chips" aria-label="Secciones de la carta">
        ${MENU_SECTIONS.map((m) => `<li>${m}</li>`)}
      </ul>
      <a class="link-arrow" href="/go/carta">Ver la carta completa →</a>
    </div>
  </section>

  <section class="reserve">
    <h2>¿Te guardamos una mesa?</h2>
    <p>Escríbenos por WhatsApp con el día, la hora y cuántos sois. Te confirmamos al momento.</p>
    <a class="btn btn-wa btn-lg" href="${waLink()}">${waIcon} Reservar por WhatsApp</a>
  </section>

  <section class="info">
    <div class="info-card">
      <h3>Dónde</h3>
      <p>${esc(s.address)}</p>
      <a class="link-arrow" href="https://www.google.com/maps/search/?api=1&query=${mapQuery}" target="_blank" rel="noopener">Cómo llegar →</a>
    </div>
    <div class="info-card">
      <h3>Cuándo</h3>
      <p>${esc(s.hours)}</p>
    </div>
    <div class="info-card">
      <h3>Síguenos</h3>
      <p>Promos, cortes del día y lo que sale de la parrilla.</p>
      <a class="link-arrow" href="${esc(s.instagram)}" target="_blank" rel="noopener">Instagram →</a>
    </div>
  </section>

  <div class="map">
    <iframe title="Mapa de El Club de las Brasas" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=${mapQuery}&output=embed"></iframe>
  </div>
</main>

<footer class="foot">
  ${logo('logo foot-logo')}
  <p>© ${new Date().getFullYear()} El Club de las Brasas · El Palo, Málaga</p>
</footer>

<a class="fab-wa" href="${waLink()}" aria-label="Reservar por WhatsApp">${waIcon}</a>`,
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
      <button class="btn btn-ember btn-lg btn-block" type="submit">Obtener mi cupón</button>
    </form>
    <p class="ticket-hint">Te damos un código único para enseñar en el local.</p>`}
    ${promo.conditions ? `<p class="ticket-cond">${esc(promo.conditions)}</p>` : ''}
    ${promo.valid_until ? `<p class="ticket-cond">Válido hasta el ${fmtDate(promo.valid_until)}.</p>` : ''}
  </div>
</article>
<a class="btn btn-wa btn-block" href="${waLink(promo)}">${waIcon} Reservar mesa por WhatsApp</a>`,
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
<a class="btn btn-wa btn-block" href="${waLink(promo)}">${waIcon} Reservar mesa por WhatsApp</a>`,
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
  <a class="btn btn-ghost btn-block" href="/">Volver al inicio</a>
</main>`,
  });
}
