import { createHmac, timingSafeEqual, createHash } from 'node:crypto';

const PASSWORD = process.env.ADMIN_PASSWORD || '123456';
const SECRET = process.env.SESSION_SECRET || createHash('sha256').update(`cb:${PASSWORD}`).digest('hex');
const COOKIE = 'cb_admin';
const TTL_MS = 1000 * 60 * 60 * 24 * 30;

export const ADMIN_PATH = `/${(process.env.ADMIN_PATH || 'admin').replace(/^\/+|\/+$/g, '')}`;

if (!process.env.ADMIN_PASSWORD) console.warn('⚠️  ADMIN_PASSWORD no definido: usando la clave por defecto. Cámbiala en producción.');

const sign = (v) => createHmac('sha256', SECRET).update(v).digest('hex');

function safeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export const checkPassword = (pw) => safeEqual(createHash('sha256').update(String(pw)).digest('hex'), createHash('sha256').update(PASSWORD).digest('hex'));

export function login(req, res) {
  const exp = String(Date.now() + TTL_MS);
  res.cookie(COOKIE, `${exp}.${sign(exp)}`, { maxAge: TTL_MS, httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/' });
}

export function logout(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

export function isAdmin(req) {
  const [exp, sig] = String(req.cookies[COOKIE] || '').split('.');
  return !!exp && !!sig && safeEqual(sig, sign(exp)) && Number(exp) > Date.now();
}

export function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.redirect(`${ADMIN_PATH}/login?next=${encodeURIComponent(req.originalUrl)}`);
}

// Freno simple a fuerza bruta: 8 intentos fallidos por IP cada 15 minutos.
const attempts = new Map();
export function tooManyAttempts(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  attempts.set(ip, list);
  return list.length >= 8;
}
export const failedAttempt = (ip) => attempts.set(ip, [...(attempts.get(ip) || []), Date.now()]);
