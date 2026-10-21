import { randomUUID } from 'node:crypto';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { db } from './db.js';

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|preview|whatsapp\/|telegrambot|headless|lighthouse|curl|wget|python-requests/i;
const VISITOR_COOKIE = 'cb_vid';

export const isBot = (req) => BOT_RE.test(req.get('user-agent') || '');

// Cookie first-party y funcional: identifica el dispositivo para no generar cupones duplicados.
export function visitorId(req, res) {
  let id = req.cookies[VISITOR_COOKIE];
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    id = randomUUID();
    res.cookie(VISITOR_COOKIE, id, { maxAge: 1000 * 60 * 60 * 24 * 365, httpOnly: true, sameSite: 'lax', secure: req.secure });
  }
  return id;
}

function inAppBrowser(ua) {
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook';
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return 'TikTok';
  if (/WhatsApp/i.test(ua)) return 'WhatsApp';
  return null;
}

// Origen de la visita: ?src=qr (impreso), ?src=ig (link en bio/stories), utm_source, o el referrer.
function resolveSource(req, inApp) {
  const src = String(req.query.src || req.query.utm_source || '').toLowerCase().slice(0, 40);
  if (src) return src;
  const ref = req.get('referer') || '';
  if (/instagram\./i.test(ref) || inApp === 'Instagram') return 'ig';
  if (/google\./i.test(ref)) return 'google';
  if (/facebook\.|fb\./i.test(ref) || inApp === 'Facebook') return 'facebook';
  if (ref && !ref.includes(req.get('host'))) return 'referral';
  return 'directo';
}

export async function recordVisit(req, res, promoId = null) {
  const vid = visitorId(req, res);
  if (isBot(req)) return vid;
  // Vuelta a la misma página tras cambiar de idioma: no es una visita nueva.
  if (req.cookies.cb_relang) {
    res.clearCookie('cb_relang');
    return vid;
  }
  const ua = req.get('user-agent') || '';
  const parsed = new UAParser(ua).getResult();
  const inApp = inAppBrowser(ua);
  const geo = geoip.lookup(req.ip) || {};
  const ref = req.get('referer') || null;
  await db.run(`INSERT INTO visits
    (path, promo_id, visitor_id, source, utm_source, utm_medium, utm_campaign, referrer, country, region, city, device, os, browser, in_app, lang)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    req.path,
    promoId,
    vid,
    resolveSource(req, inApp),
    req.query.utm_source?.toString().slice(0, 80) ?? null,
    req.query.utm_medium?.toString().slice(0, 80) ?? null,
    req.query.utm_campaign?.toString().slice(0, 80) ?? null,
    ref && !ref.includes(req.get('host')) ? ref.slice(0, 300) : null,
    geo.country || null,
    geo.region || null,
    geo.city || null,
    parsed.device.type || 'desktop',
    parsed.os.name || null,
    parsed.browser.name || null,
    inApp,
    (req.get('accept-language') || '').split(',')[0].slice(0, 12) || null,
  ]);
  return vid;
}

export async function recordEvent(req, res, type, promoId = null) {
  const vid = visitorId(req, res);
  if (isBot(req)) return;
  await db.run('INSERT INTO events (type, visitor_id, promo_id) VALUES (?, ?, ?)', [type, vid, promoId]);
}
