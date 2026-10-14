import express from 'express';
import cookieParser from 'cookie-parser';
import QRCode from 'qrcode';
import { db, initDb, getSettings, saveSettings, isPromoLive, newCouponCode } from './src/db.js';
import { recordVisit, recordEvent, visitorId } from './src/track.js';
import { ADMIN_PATH as A, isAdmin, requireAdmin, login, logout, checkPassword, tooManyAttempts, failedAttempt } from './src/auth.js';
import { getMetrics } from './src/metrics.js';
import { homePage, promoPage, promoEndedPage, notFoundPage } from './src/views/public.js';
import { loginPage, dashboardPage, promosPage, validatePage, redeemPage, settingsPage } from './src/views/admin.js';

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(cookieParser());
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static('public', { maxAge: '7d' }));

// Express 4 no captura errores de handlers async: los reenviamos al manejador de errores.
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const baseUrl = (req) => (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
const promoBySlug = (slug) => db.get('SELECT * FROM promos WHERE slug = ?', [slug]);
const promoById = (id) => db.get('SELECT * FROM promos WHERE id = ?', [Number(id)]);
const couponByCode = (code) => db.get('SELECT * FROM coupons WHERE code = ?', [normalizeCode(code)]);
const allPromos = () => db.all('SELECT * FROM promos ORDER BY sort, id');

function normalizeCode(raw) {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length === 6 ? `${s.slice(0, 3)}-${s.slice(3)}` : s;
}

const qrOptions = { margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0d0b0a', light: '#ffffff' } };

/* ---------------------------------- Público ---------------------------------- */

app.get('/health', (req, res) => res.send('ok'));

app.get('/', h(async (req, res) => {
  const [settings] = await Promise.all([getSettings(), recordVisit(req, res)]);
  res.send(homePage(settings));
}));

app.get('/go/whatsapp', h(async (req, res) => {
  const promo = req.query.promo ? await promoById(req.query.promo) : null;
  const [s] = await Promise.all([getSettings(), recordEvent(req, res, 'whatsapp', promo?.id ?? null)]);
  const text = promo ? `${s.whatsapp_message}\n(Vengo por la promo: ${promo.title})` : s.whatsapp_message;
  res.redirect(`https://wa.me/${s.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`);
}));

app.get('/go/carta', h(async (req, res) => {
  const [s] = await Promise.all([getSettings(), recordEvent(req, res, 'carta')]);
  res.redirect(s.menu_url);
}));

app.get('/p/:slug', h(async (req, res) => {
  const promo = await promoBySlug(req.params.slug);
  if (!promo) return res.status(404).send(notFoundPage());
  // ?c=1 es la vuelta tras generar el cupón y ?preview=1 la vista previa del admin: no cuentan como visita.
  const skip = req.query.c === '1' || (req.query.preview === '1' && isAdmin(req));
  const vid = skip ? visitorId(req, res) : await recordVisit(req, res, promo.id);
  const coupon = await db.get('SELECT * FROM coupons WHERE promo_id = ? AND visitor_id = ?', [promo.id, vid]);
  if (!isPromoLive(promo) && !coupon) return res.send(promoEndedPage(promo));
  res.send(promoPage(promo, { coupon, src: String(req.query.src || '').slice(0, 40) }));
}));

app.post('/p/:slug/cupon', h(async (req, res) => {
  const promo = await promoBySlug(req.params.slug);
  if (!promo) return res.status(404).send(notFoundPage());
  if (!isPromoLive(promo)) return res.redirect(303, `/p/${promo.slug}`);
  const vid = visitorId(req, res);
  const existing = await db.get('SELECT id FROM coupons WHERE promo_id = ? AND visitor_id = ?', [promo.id, vid]);
  if (!existing) {
    const source =
      String(req.body.src || '').slice(0, 40) ||
      (await db.get('SELECT source FROM visits WHERE visitor_id = ? AND promo_id = ? ORDER BY id DESC LIMIT 1', [vid, promo.id]))?.source ||
      'directo';
    for (let i = 0; i < 5; i++) {
      try {
        await db.run('INSERT INTO coupons (code, promo_id, visitor_id, source) VALUES (?, ?, ?, ?)', [newCouponCode(), promo.id, vid, source]);
        break;
      } catch (e) {
        if (String(e.message).includes('coupons.visitor_id')) break; // doble envío: el cupón ya existe
        if (!String(e.message).includes('coupons.code')) throw e;
      }
    }
  }
  res.redirect(303, `/p/${promo.slug}?c=1`);
}));

// QR del cupón: apunta a /v/CODE, que sólo lleva al canje si quien escanea es admin.
app.get('/cupon/:code.svg', h(async (req, res) => {
  const coupon = await couponByCode(req.params.code);
  if (!coupon) return res.sendStatus(404);
  res.type('image/svg+xml').set('Cache-Control', 'private, max-age=86400');
  res.send(await QRCode.toString(`${baseUrl(req)}/v/${coupon.code}`, { ...qrOptions, type: 'svg' }));
}));

app.get('/v/:code', h(async (req, res) => {
  const coupon = await couponByCode(req.params.code);
  if (!coupon) return res.status(404).send(notFoundPage());
  if (isAdmin(req)) return res.redirect(`${A}/canje/${coupon.code}`);
  res.redirect(`/p/${(await promoById(coupon.promo_id)).slug}?c=1`);
}));

/* ----------------------------------- Admin ----------------------------------- */

const admin = express.Router();

admin.get('/login', (req, res) => {
  if (isAdmin(req)) return res.redirect(A);
  res.send(loginPage({ next: String(req.query.next || '') }));
});

admin.post('/login', (req, res) => {
  const next = String(req.body.next || '');
  const safeNext = next.startsWith(A) ? next : A;
  if (tooManyAttempts(req.ip)) return res.status(429).send(loginPage({ error: 'Demasiados intentos. Espera 15 minutos.', next }));
  if (!checkPassword(req.body.password || '')) {
    failedAttempt(req.ip);
    return res.status(401).send(loginPage({ error: 'Clave incorrecta.', next }));
  }
  login(req, res);
  res.redirect(303, safeNext);
});

admin.post('/logout', (req, res) => {
  logout(res);
  res.redirect(303, `${A}/login`);
});

admin.use(requireAdmin);

admin.get('/', h(async (req, res) => {
  const days = [0, 7, 30, 90].includes(Number(req.query.d)) ? Number(req.query.d) : 30;
  const promoId = req.query.promo ? Number(req.query.promo) : null;
  const [m, promos] = await Promise.all([getMetrics(days, promoId), allPromos()]);
  res.send(dashboardPage({ m, days, promos, promoId }));
}));

admin.get('/promos', h(async (req, res) => {
  res.send(promosPage({ promos: await allPromos(), baseUrl: baseUrl(req), flash: req.query.ok ? 'Promo guardada.' : '' }));
}));

admin.post('/promos/:id', h(async (req, res) => {
  const p = await promoById(req.params.id);
  if (!p) return res.sendStatus(404);
  const b = req.body;
  const clip = (v, n) => String(v ?? '').trim().slice(0, n);
  const validUntil = /^\d{4}-\d{2}-\d{2}$/.test(b.valid_until || '') ? b.valid_until : null;
  await db.run(`UPDATE promos SET title = ?, badge = ?, description = ?, conditions = ?, valid_until = ?, active = ?, updated_at = datetime('now') WHERE id = ?`, [
    clip(b.title, 80) || p.title,
    clip(b.badge, 30),
    clip(b.description, 300),
    clip(b.conditions, 300),
    validUntil,
    b.active === '1' ? 1 : 0,
    p.id,
  ]);
  res.redirect(303, `${A}/promos?ok=1#promo-${p.id}`);
}));

admin.get('/qr/:id.:ext(svg|png)', h(async (req, res) => {
  const p = await promoById(req.params.id);
  if (!p) return res.sendStatus(404);
  const src = ['qr', 'ig'].includes(req.query.src) ? req.query.src : 'qr';
  const url = `${baseUrl(req)}/p/${p.slug}?src=${src}`;
  const name = `qr-${p.slug.replace(/-[0-9a-f]{6}$/, '')}`;
  if (req.query.download) res.attachment(`${name}.${req.params.ext}`);
  if (req.params.ext === 'svg') return res.type('image/svg+xml').send(await QRCode.toString(url, { ...qrOptions, type: 'svg' }));
  res.type('png').send(await QRCode.toBuffer(url, { ...qrOptions, width: 1200, margin: 2 }));
}));

admin.get('/validar', h(async (req, res) => {
  if (!req.query.code) return res.send(validatePage({}));
  const coupon = await couponByCode(req.query.code);
  if (!coupon) return res.send(validatePage({ code: req.query.code, error: 'No existe ningún cupón con ese código.' }));
  res.redirect(`${A}/canje/${coupon.code}`);
}));

admin.get('/canje/:code', h(async (req, res) => {
  const coupon = await couponByCode(req.params.code);
  if (!coupon) return res.send(validatePage({ code: req.params.code, error: 'No existe ningún cupón con ese código.' }));
  const flash = req.query.ok === '1' ? 'Cupón canjeado ✓' : req.query.ok === '0' ? 'Canje deshecho.' : '';
  res.send(redeemPage({ coupon, promo: await promoById(coupon.promo_id), flash }));
}));

admin.post('/canje/:code', h(async (req, res) => {
  const code = normalizeCode(req.params.code);
  // WHERE redeemed_at IS NULL: dos personas escaneando a la vez no pueden canjearlo dos veces.
  const r = await db.run(`UPDATE coupons SET redeemed_at = datetime('now') WHERE code = ? AND redeemed_at IS NULL`, [code]);
  res.redirect(303, `${A}/canje/${code}${r.changes ? '?ok=1' : ''}`);
}));

admin.post('/canje/:code/deshacer', h(async (req, res) => {
  const code = normalizeCode(req.params.code);
  await db.run('UPDATE coupons SET redeemed_at = NULL WHERE code = ?', [code]);
  res.redirect(303, `${A}/canje/${code}?ok=0`);
}));

admin.get('/ajustes', h(async (req, res) => res.send(settingsPage({ s: await getSettings(), flash: req.query.ok ? 'Ajustes guardados.' : '' }))));

admin.post('/ajustes', h(async (req, res) => {
  await saveSettings(req.body);
  res.redirect(303, `${A}/ajustes?ok=1`);
}));

app.use(A, (req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.set('Cache-Control', 'no-store');
  next();
}, admin);

app.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /p/\nDisallow: /v/\nDisallow: /go/\n`));

app.use((req, res) => res.status(404).send(notFoundPage()));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Error interno. Inténtalo de nuevo en unos segundos.');
});

await initDb();
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`🔥 El Club de las Brasas en http://localhost:${port}  ·  admin: http://localhost:${port}${A}`));
