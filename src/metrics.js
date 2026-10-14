import { db } from './db.js';

// Desfase actual de Europe/Madrid respecto a UTC, en horas (1 en invierno, 2 en verano).
function madridOffsetHours() {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  return Math.round((local - utc) / 3600000);
}

export async function getMetrics(days, promoId = null) {
  const tz = `+${madridOffsetHours()} hours`;
  const since = days > 0 ? `datetime('now', '-${Number(days)} days')` : `'1970-01-01'`;
  const promoFilter = promoId ? ' AND promo_id = ' + Number(promoId) : '';
  const vWhere = `ts >= ${since}${promoFilter}`;
  const all = (sql) => db.all(sql);
  const one = async (sql) => (await db.get(sql)).n;
  // known=true descarta las visitas sin valor (p. ej. sin ciudad) en vez de agruparlas como 'Desconocido'.
  const group = (col, limit = 10, known = false) =>
    all(`SELECT COALESCE(${col}, 'Desconocido') AS label, COUNT(*) AS n, COUNT(DISTINCT visitor_id) AS u
         FROM visits WHERE ${vWhere}${known ? ` AND (${col}) IS NOT NULL` : ''} GROUP BY label ORDER BY n DESC LIMIT ${limit}`);

  // Todas las consultas en paralelo: con Turso cada una es un viaje de red.
  const [visits, uniques, promoVisits, coupons, redeemed, whatsapp, daily, redeemedRows, byPromo, byHour, recentCoupons,
    bySource, byCountry, byCity, byDevice, byOs, byInApp, byReferrer, byLang, byCampaign, noCity, noCountry] = await Promise.all([
    one(`SELECT COUNT(*) AS n FROM visits WHERE ${vWhere}`),
    one(`SELECT COUNT(DISTINCT visitor_id) AS n FROM visits WHERE ${vWhere}`),
    one(`SELECT COUNT(*) AS n FROM visits WHERE ${vWhere} AND promo_id IS NOT NULL`),
    one(`SELECT COUNT(*) AS n FROM coupons WHERE created_at >= ${since}${promoFilter}`),
    one(`SELECT COUNT(*) AS n FROM coupons WHERE redeemed_at >= ${since}${promoFilter}`),
    one(`SELECT COUNT(*) AS n FROM events WHERE type = 'whatsapp' AND ts >= ${since}${promoFilter}`),
    all(`SELECT date(ts, '${tz}') AS day, COUNT(*) AS visits, COUNT(DISTINCT visitor_id) AS uniques
         FROM visits WHERE ${vWhere} GROUP BY day ORDER BY day`),
    all(`SELECT date(redeemed_at, '${tz}') AS day, COUNT(*) AS n FROM coupons
         WHERE redeemed_at >= ${since}${promoFilter} GROUP BY day`),
    all(`
    SELECT p.id, p.slug, p.title, p.active, p.valid_until,
      (SELECT COUNT(*) FROM visits v WHERE v.promo_id = p.id AND v.ts >= ${since}) AS visits,
      (SELECT COUNT(DISTINCT visitor_id) FROM visits v WHERE v.promo_id = p.id AND v.ts >= ${since}) AS uniques,
      (SELECT COUNT(*) FROM visits v WHERE v.promo_id = p.id AND v.ts >= ${since} AND v.source = 'qr') AS qr,
      (SELECT COUNT(*) FROM visits v WHERE v.promo_id = p.id AND v.ts >= ${since} AND v.source = 'ig') AS ig,
      (SELECT COUNT(*) FROM coupons c WHERE c.promo_id = p.id AND c.created_at >= ${since}) AS coupons,
      (SELECT COUNT(*) FROM coupons c WHERE c.promo_id = p.id AND c.redeemed_at >= ${since}) AS redeemed
    FROM promos p ORDER BY p.sort, p.id`),
    all(`SELECT CAST(strftime('%H', ts, '${tz}') AS INTEGER) AS h, COUNT(*) AS n FROM visits WHERE ${vWhere} GROUP BY h`),
    all(`
    SELECT c.code, c.created_at, c.redeemed_at, c.source, p.title
    FROM coupons c JOIN promos p ON p.id = c.promo_id
    WHERE 1=1${promoFilter.replace('promo_id', 'c.promo_id')}
    ORDER BY COALESCE(c.redeemed_at, c.created_at) DESC LIMIT 25`),
    group('source'),
    group('country', 10, true),
    group(`city || CASE WHEN country IS NOT NULL THEN ' (' || country || ')' ELSE '' END`, 10, true),
    group('device'),
    group('os'),
    group(`COALESCE(in_app, browser)`),
    group('referrer', 8),
    group('lang', 8),
    group('utm_campaign', 8),
    one(`SELECT COUNT(*) AS n FROM visits WHERE ${vWhere} AND city IS NULL`),
    one(`SELECT COUNT(*) AS n FROM visits WHERE ${vWhere} AND country IS NULL`),
  ]);

  const redeemedDaily = Object.fromEntries(redeemedRows.map((r) => [r.day, r.n]));
  daily.forEach((d) => (d.redeemed = redeemedDaily[d.day] || 0));
  const hours = Array.from({ length: 24 }, (_, h) => byHour.find((r) => r.h === h)?.n || 0);

  return {
    kpis: { visits, uniques, promoVisits, coupons, redeemed, whatsapp },
    daily,
    byPromo,
    hours,
    recentCoupons,
    bySource,
    byCountry,
    byCity,
    byDevice,
    byOs,
    byInApp,
    byReferrer,
    byLang,
    byCampaign,
    noCity,
    noCountry,
  };
}
