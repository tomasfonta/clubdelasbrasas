import { db } from './db.js';

// Desfase actual de Europe/Madrid respecto a UTC, en horas (1 en invierno, 2 en verano).
function madridOffsetHours() {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  return Math.round((local - utc) / 3600000);
}

export function getMetrics(days, promoId = null) {
  const tz = `+${madridOffsetHours()} hours`;
  const since = days > 0 ? `datetime('now', '-${Number(days)} days')` : `'1970-01-01'`;
  const promoFilter = promoId ? ' AND promo_id = ' + Number(promoId) : '';
  const vWhere = `ts >= ${since}${promoFilter}`;
  const all = (sql) => db.prepare(sql).all();
  const one = (sql) => db.prepare(sql).get();
  const group = (col, limit = 10) =>
    all(`SELECT COALESCE(${col}, 'Desconocido') AS label, COUNT(*) AS n, COUNT(DISTINCT visitor_id) AS u
         FROM visits WHERE ${vWhere} GROUP BY label ORDER BY n DESC LIMIT ${limit}`);

  const kpis = {
    visits: one(`SELECT COUNT(*) AS n FROM visits WHERE ${vWhere}`).n,
    uniques: one(`SELECT COUNT(DISTINCT visitor_id) AS n FROM visits WHERE ${vWhere}`).n,
    promoVisits: one(`SELECT COUNT(*) AS n FROM visits WHERE ${vWhere} AND promo_id IS NOT NULL`).n,
    coupons: one(`SELECT COUNT(*) AS n FROM coupons WHERE created_at >= ${since}${promoFilter}`).n,
    redeemed: one(`SELECT COUNT(*) AS n FROM coupons WHERE redeemed_at >= ${since}${promoFilter}`).n,
    whatsapp: one(`SELECT COUNT(*) AS n FROM events WHERE type = 'whatsapp' AND ts >= ${since}${promoFilter}`).n,
  };

  const daily = all(`
    SELECT date(ts, '${tz}') AS day, COUNT(*) AS visits, COUNT(DISTINCT visitor_id) AS uniques
    FROM visits WHERE ${vWhere} GROUP BY day ORDER BY day`);
  const redeemedDaily = Object.fromEntries(
    all(`SELECT date(redeemed_at, '${tz}') AS day, COUNT(*) AS n FROM coupons
         WHERE redeemed_at >= ${since}${promoFilter} GROUP BY day`).map((r) => [r.day, r.n]),
  );
  daily.forEach((d) => (d.redeemed = redeemedDaily[d.day] || 0));

  const byPromo = all(`
    SELECT p.id, p.slug, p.title, p.active, p.valid_until,
      (SELECT COUNT(*) FROM visits v WHERE v.promo_id = p.id AND v.ts >= ${since}) AS visits,
      (SELECT COUNT(DISTINCT visitor_id) FROM visits v WHERE v.promo_id = p.id AND v.ts >= ${since}) AS uniques,
      (SELECT COUNT(*) FROM visits v WHERE v.promo_id = p.id AND v.ts >= ${since} AND v.source = 'qr') AS qr,
      (SELECT COUNT(*) FROM visits v WHERE v.promo_id = p.id AND v.ts >= ${since} AND v.source = 'ig') AS ig,
      (SELECT COUNT(*) FROM coupons c WHERE c.promo_id = p.id AND c.created_at >= ${since}) AS coupons,
      (SELECT COUNT(*) FROM coupons c WHERE c.promo_id = p.id AND c.redeemed_at >= ${since}) AS redeemed
    FROM promos p ORDER BY p.sort, p.id`);

  const byHour = all(`SELECT CAST(strftime('%H', ts, '${tz}') AS INTEGER) AS h, COUNT(*) AS n FROM visits WHERE ${vWhere} GROUP BY h`);
  const hours = Array.from({ length: 24 }, (_, h) => byHour.find((r) => r.h === h)?.n || 0);

  const recentCoupons = all(`
    SELECT c.code, c.created_at, c.redeemed_at, c.source, p.title
    FROM coupons c JOIN promos p ON p.id = c.promo_id
    WHERE 1=1${promoFilter.replace('promo_id', 'c.promo_id')}
    ORDER BY COALESCE(c.redeemed_at, c.created_at) DESC LIMIT 25`);

  return {
    kpis,
    daily,
    byPromo,
    hours,
    recentCoupons,
    bySource: group('source'),
    byCountry: group('country'),
    byCity: group(`city || CASE WHEN country IS NOT NULL THEN ' (' || country || ')' ELSE '' END`),
    byDevice: group('device'),
    byOs: group('os'),
    byInApp: group(`COALESCE(in_app, browser)`),
    byReferrer: group('referrer', 8),
    byLang: group('lang', 8),
    byCampaign: group('utm_campaign', 8),
  };
}
