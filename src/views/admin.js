import { layout, html, esc, logo } from './layout.js';
import { ADMIN_PATH } from '../auth.js';
import { isPromoLive } from '../db.js';

const A = ADMIN_PATH;
const nf = new Intl.NumberFormat('es-ES');
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '–');

const SOURCE_LABELS = { qr: 'QR impreso', ig: 'Instagram', directo: 'Directo', google: 'Google', facebook: 'Facebook', referral: 'Otra web' };
const DEVICE_LABELS = { mobile: 'Móvil', desktop: 'Ordenador', tablet: 'Tablet' };

const fmtTs = (ts) =>
  ts ? new Date(`${ts.replace(' ', 'T')}Z`).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

function adminShell({ title, active, body, flash }) {
  const tab = (key, href, label) => `<a href="${A}${href}" class="${active === key ? 'on' : ''}">${label}</a>`;
  return layout({
    title: `${title} · Admin`,
    css: 'admin',
    robots: 'noindex,nofollow',
    body: html`
<header class="bar">
  <a href="${A}" class="bar-brand">${logo('logo bar-logo')}<span>Admin</span></a>
  <nav class="tabs">
    ${tab('metrics', '', 'Métricas')}
    ${tab('promos', '/promos', 'Promos y QR')}
    ${tab('validate', '/validar', 'Validar cupón')}
    ${tab('settings', '/ajustes', 'Ajustes')}
  </nav>
  <form method="post" action="${A}/logout"><button class="btn-text" type="submit">Salir</button></form>
</header>
<main class="wrap">
  ${flash ? `<p class="flash">${esc(flash)}</p>` : ''}
  ${body}
</main>`,
  });
}

export function loginPage({ error, next }) {
  return layout({
    title: 'Acceso',
    css: 'admin',
    robots: 'noindex,nofollow',
    body: html`
<main class="login">
  ${logo('logo login-logo')}
  <form method="post" action="${A}/login" class="card login-card">
    <label for="pw">Clave de acceso</label>
    <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
    <input type="hidden" name="next" value="${esc(next)}">
    ${error ? `<p class="err">${esc(error)}</p>` : ''}
    <button class="btn" type="submit">Entrar</button>
  </form>
</main>`,
  });
}

/* ---------- gráficos (SVG renderizado en servidor, una sola serie, tooltip nativo por barra) ---------- */

function dailyChart(daily, days) {
  // Rellena los días sin visitas para que el eje temporal sea continuo.
  const map = Object.fromEntries(daily.map((d) => [d.day, d]));
  const span = days > 0 ? days : Math.max(daily.length, 1);
  const start = days > 0 ? new Date(Date.now() - (days - 1) * 864e5) : new Date(`${daily[0]?.day || new Date().toISOString().slice(0, 10)}T12:00:00`);
  const series = [];
  for (let i = 0; i < span; i++) {
    const d = new Date(start.getTime() + i * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
    series.push(map[d] || { day: d, visits: 0, uniques: 0, redeemed: 0 });
  }
  if (!series.some((d) => d.visits)) return `<p class="empty">Todavía no hay visitas en este periodo.</p>`;

  const W = 900, H = 220, padL = 36, padB = 26, padT = 10;
  const max = Math.max(...series.map((d) => d.visits), 1);
  const nice = Math.max(Math.ceil(max / 4) * 4, 4);
  const bw = (W - padL) / series.length;
  const y = (v) => padT + (H - padT - padB) * (1 - v / nice);
  const ticks = [0, nice / 2, nice];
  const labelEvery = Math.ceil(series.length / 8);
  const fmtDay = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return html`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Visitas por día">
    ${ticks.map((t) => `<line class="grid" x1="${padL}" x2="${W}" y1="${y(t)}" y2="${y(t)}"/><text class="axis" x="${padL - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`)}
    ${series.map((d, i) => {
      const x = padL + i * bw;
      const h = H - padB - y(d.visits);
      const bar = d.visits
        ? `<path class="bar" d="${roundedTop(x + Math.max(bw * 0.18, 1), y(d.visits), Math.max(bw * 0.64, 2), h)}"/>`
        : '';
      const label = i % labelEvery === 0 ? `<text class="axis" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${fmtDay(d.day)}</text>` : '';
      return `<g class="hit"><rect x="${x}" y="${padT}" width="${bw}" height="${H - padT - padB}" fill="transparent"/>${bar}<title>${fmtDay(d.day)}: ${d.visits} visitas · ${d.uniques} únicos · ${d.redeemed} canjes</title></g>${label}`;
    })}
    <line class="baseline" x1="${padL}" x2="${W}" y1="${H - padB}" y2="${H - padB}"/>
  </svg>`;
}

function hourChart(hours) {
  if (!hours.some(Boolean)) return `<p class="empty">Sin datos.</p>`;
  const W = 900, H = 140, padB = 22, padT = 8;
  const max = Math.max(...hours, 1);
  const bw = W / 24;
  return html`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Visitas por hora del día">
    ${hours.map((n, h) => {
      const bh = ((H - padB - padT) * n) / max;
      const bar = n ? `<path class="bar" d="${roundedTop(h * bw + bw * 0.2, H - padB - bh, bw * 0.6, bh)}"/>` : '';
      const label = h % 3 === 0 ? `<text class="axis" x="${h * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${h}h</text>` : '';
      return `<g class="hit"><rect x="${h * bw}" y="0" width="${bw}" height="${H - padB}" fill="transparent"/>${bar}<title>${h}:00–${h}:59 · ${n} visitas</title></g>${label}`;
    })}
    <line class="baseline" x1="0" x2="${W}" y1="${H - padB}" y2="${H - padB}"/>
  </svg>`;
}

// Barra con las esquinas superiores redondeadas (4px) y la base plana sobre el eje.
function roundedTop(x, y, w, h) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function breakdown(title, rows, labels = {}) {
  const max = Math.max(...rows.map((r) => r.n), 1);
  return html`<section class="card">
    <h3>${title}</h3>
    ${rows.length
      ? `<table class="hbars"><tbody>${rows
          .map(
            (r) => `<tr><th scope="row" title="${esc(r.label)}">${esc(labels[r.label] || r.label)}</th>
              <td class="hb"><span style="width:${Math.max((r.n / max) * 100, 2)}%"></span></td>
              <td class="num">${nf.format(r.n)}</td></tr>`,
          )
          .join('')}</tbody></table>`
      : '<p class="empty">Sin datos.</p>'}
  </section>`;
}

export function dashboardPage({ m, days, promos, promoId }) {
  const k = m.kpis;
  const ranges = [[7, '7 días'], [30, '30 días'], [90, '90 días'], [0, 'Todo']];
  const tile = (label, value, sub = '') => `<div class="tile"><p class="tile-label">${label}</p><p class="tile-value">${nf.format(value)}</p>${sub ? `<p class="tile-sub">${sub}</p>` : ''}</div>`;

  return adminShell({
    title: 'Métricas',
    active: 'metrics',
    body: html`
<form class="filters" method="get" action="${A}">
  <div class="seg" role="group" aria-label="Periodo">
    ${ranges.map(([d, l]) => `<a href="${A}?d=${d}${promoId ? `&promo=${promoId}` : ''}" class="${d === days ? 'on' : ''}">${l}</a>`)}
  </div>
  <input type="hidden" name="d" value="${days}">
  <label class="sel">Promo
    <select name="promo" onchange="this.form.submit()">
      <option value="">Todas + web</option>
      ${promos.map((p) => `<option value="${p.id}" ${p.id === promoId ? 'selected' : ''}>${esc(p.title)}</option>`)}
    </select>
  </label>
  <noscript><button class="btn">Aplicar</button></noscript>
</form>

<div class="tiles">
  ${tile('Visitas', k.visits)}
  ${tile('Visitantes únicos', k.uniques)}
  ${tile('Visitas a promos', k.promoVisits)}
  ${tile('Cupones generados', k.coupons, `${pct(k.coupons, k.promoVisits)} de las visitas a promos`)}
  ${tile('Cupones canjeados', k.redeemed, `${pct(k.redeemed, k.coupons)} de los generados`)}
  ${tile('Clics en WhatsApp', k.whatsapp)}
</div>

<section class="card">
  <h3>Visitas por día</h3>
  ${dailyChart(m.daily, days)}
</section>

<section class="card">
  <h3>Rendimiento por promo</h3>
  <div class="table-scroll">
  <table class="data">
    <thead><tr><th>Promo</th><th>Estado</th><th class="num">Visitas</th><th class="num">Únicos</th><th class="num">Desde QR</th><th class="num">Desde IG</th><th class="num">Cupones</th><th class="num">Canjes</th><th class="num">Conversión</th></tr></thead>
    <tbody>
      ${m.byPromo.map(
        (p) => `<tr><td><a href="${A}?d=${days}&promo=${p.id}">${esc(p.title)}</a></td>
          <td>${isPromoLive(p) ? '<span class="pill ok">● Activa</span>' : '<span class="pill off">○ Inactiva</span>'}</td>
          <td class="num">${nf.format(p.visits)}</td><td class="num">${nf.format(p.uniques)}</td>
          <td class="num">${nf.format(p.qr)}</td><td class="num">${nf.format(p.ig)}</td>
          <td class="num">${nf.format(p.coupons)}</td><td class="num">${nf.format(p.redeemed)}</td>
          <td class="num">${pct(p.redeemed, p.uniques)}</td></tr>`,
      )}
    </tbody>
  </table>
  </div>
  <p class="note">Conversión = canjes en el local ÷ visitantes únicos de la promo.</p>
</section>

<div class="grid2">
  ${breakdown('Origen', m.bySource, SOURCE_LABELS)}
  ${breakdown('App / navegador', m.byInApp)}
  ${breakdown('Ciudad', m.byCity)}
  ${breakdown('País', m.byCountry)}
  ${breakdown('Dispositivo', m.byDevice, DEVICE_LABELS)}
  ${breakdown('Sistema', m.byOs)}
  ${breakdown('Idioma del móvil', m.byLang)}
  ${breakdown('Campaña (utm_campaign)', m.byCampaign)}
</div>

<section class="card">
  <h3>Hora del día (Madrid)</h3>
  ${hourChart(m.hours)}
</section>

${m.byReferrer.some((r) => r.label !== 'Desconocido') ? breakdown('Webs que enlazan', m.byReferrer.filter((r) => r.label !== 'Desconocido')) : ''}

<section class="card">
  <h3>Últimos cupones</h3>
  ${m.recentCoupons.length
    ? html`<div class="table-scroll"><table class="data"><thead><tr><th>Código</th><th>Promo</th><th>Origen</th><th>Generado</th><th>Canjeado</th></tr></thead><tbody>
      ${m.recentCoupons.map(
        (c) => `<tr><td><a class="mono" href="${A}/canje/${esc(c.code)}">${esc(c.code)}</a></td><td>${esc(c.title)}</td><td>${esc(SOURCE_LABELS[c.source] || c.source || '')}</td>
          <td>${fmtTs(c.created_at)}</td><td>${c.redeemed_at ? `<span class="pill ok">✓ ${fmtTs(c.redeemed_at)}</span>` : '<span class="pill off">Pendiente</span>'}</td></tr>`,
      )}</tbody></table></div>`
    : '<p class="empty">Aún no se ha generado ningún cupón.</p>'}
</section>`,
  });
}

export function promosPage({ promos, baseUrl, flash }) {
  return adminShell({
    title: 'Promos y QR',
    active: 'promos',
    flash,
    body: html`
<p class="lead">Cada promo tiene un enlace fijo. El QR impreso lleva <code>?src=qr</code> y el enlace para Instagram <code>?src=ig</code>, así medimos de dónde viene cada visita. <strong>El enlace no cambia aunque edites el texto</strong>: puedes imprimir los QR tranquilo.</p>
${promos.map((p) => {
  const url = `${baseUrl}/p/${p.slug}`;
  return html`<section class="card promo-edit" id="promo-${p.id}">
  <div class="promo-qr">
    <img src="${A}/qr/${p.id}.svg?src=qr" width="160" height="160" alt="QR de ${esc(p.title)}">
    <div class="qr-links">
      <a class="btn btn-sm" href="${A}/qr/${p.id}.png?src=qr&download=1">PNG</a>
      <a class="btn btn-sm btn-ghost" href="${A}/qr/${p.id}.svg?src=qr&download=1">SVG</a>
    </div>
  </div>
  <form method="post" action="${A}/promos/${p.id}" class="promo-form">
    <div class="row">
      <label>Título<input name="title" value="${esc(p.title)}" required maxlength="80"></label>
      <label>Destacado (grande)<input name="badge" value="${esc(p.badge)}" maxlength="30" placeholder="1 PINTA GRATIS"></label>
    </div>
    <label>Descripción<textarea name="description" rows="2" maxlength="300">${esc(p.description)}</textarea></label>
    <label>Condiciones<textarea name="conditions" rows="2" maxlength="300">${esc(p.conditions)}</textarea></label>
    <div class="row">
      <label>Válida hasta (opcional)<input type="date" name="valid_until" value="${esc(p.valid_until || '')}"></label>
      <label class="check"><input type="checkbox" name="active" value="1" ${p.active ? 'checked' : ''}> Activa</label>
    </div>
    <div class="links">
      <div><span>QR impreso</span><input readonly value="${esc(url)}?src=qr" onclick="this.select()"></div>
      <div><span>Link para Instagram</span><input readonly value="${esc(url)}?src=ig" onclick="this.select()"></div>
    </div>
    <div class="actions">
      <button class="btn" type="submit">Guardar</button>
      <a class="btn btn-ghost" href="/p/${esc(p.slug)}?preview=1" target="_blank" rel="noopener">Ver página</a>
      <a class="btn-text" href="${A}?promo=${p.id}">Ver métricas →</a>
    </div>
  </form>
</section>`;
})}`,
  });
}

export function validatePage({ error, code = '' }) {
  return adminShell({
    title: 'Validar cupón',
    active: 'validate',
    body: html`
<section class="card validate">
  <h2>Validar cupón</h2>
  <p class="lead">Lo más rápido: escanea el QR del móvil del cliente con la cámara de tu móvil (con la sesión de admin abierta). O escribe el código:</p>
  <form method="get" action="${A}/validar" class="code-form">
    <input name="code" value="${esc(code)}" placeholder="ABC-123" autocomplete="off" autocapitalize="characters" required pattern="[A-Za-z0-9]{3}-?[A-Za-z0-9]{3}">
    <button class="btn" type="submit">Comprobar</button>
  </form>
  ${error ? `<p class="err">${esc(error)}</p>` : ''}
</section>`,
  });
}

export function redeemPage({ coupon, promo, flash }) {
  const live = isPromoLive(promo);
  let state;
  if (coupon.redeemed_at) state = `<div class="verdict bad"><p class="verdict-big">✕ Ya canjeado</p><p>Se usó el ${fmtTs(coupon.redeemed_at)}.</p></div>`;
  else if (!live) state = `<div class="verdict warn"><p class="verdict-big">! Promo inactiva</p><p>La promo está desactivada o caducada. Puedes canjearlo igualmente si el local lo decide.</p></div>`;
  else state = `<div class="verdict ok"><p class="verdict-big">✓ Cupón válido</p><p>Generado el ${fmtTs(coupon.created_at)}.</p></div>`;

  return adminShell({
    title: `Cupón ${coupon.code}`,
    active: 'validate',
    flash,
    body: html`
<section class="card validate">
  <p class="mono code-big">${esc(coupon.code)}</p>
  <h2>${esc(promo.title)}</h2>
  ${promo.badge ? `<p class="badge-big">${esc(promo.badge)}</p>` : ''}
  ${promo.conditions ? `<p class="lead">${esc(promo.conditions)}</p>` : ''}
  ${state}
  ${coupon.redeemed_at
    ? `<form method="post" action="${A}/canje/${esc(coupon.code)}/deshacer"><button class="btn-text" type="submit">Deshacer canje (error)</button></form>`
    : `<form method="post" action="${A}/canje/${esc(coupon.code)}"><button class="btn btn-lg btn-block btn-ok" type="submit">Marcar como canjeado</button></form>`}
  <p><a class="btn-text" href="${A}/validar">← Validar otro</a></p>
</section>`,
  });
}

export function settingsPage({ s, flash }) {
  const field = (key, label, hint = '') =>
    `<label>${label}<input name="${key}" value="${esc(s[key])}">${hint ? `<small>${hint}</small>` : ''}</label>`;
  return adminShell({
    title: 'Ajustes',
    active: 'settings',
    flash,
    body: html`
<form method="post" action="${A}/ajustes" class="card settings">
  <h2>Datos del local</h2>
  ${field('whatsapp_number', 'Número de WhatsApp', 'Con prefijo de país y sin espacios ni +. Ej: 34612345678')}
  ${field('whatsapp_message', 'Mensaje pre-escrito de reserva')}
  ${field('address', 'Dirección')}
  ${field('hours', 'Horario')}
  ${field('instagram', 'Instagram (URL)')}
  ${field('menu_url', 'Carta (URL)')}
  <div class="actions"><button class="btn" type="submit">Guardar</button></div>
</form>`,
  });
}
