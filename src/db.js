import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';

const DB_PATH = process.env.DATABASE_PATH || './data/brasas.db';
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS promos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  badge TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  conditions TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  valid_until TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  path TEXT NOT NULL,
  promo_id INTEGER REFERENCES promos(id) ON DELETE SET NULL,
  visitor_id TEXT NOT NULL,
  source TEXT NOT NULL,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
  referrer TEXT,
  country TEXT, region TEXT, city TEXT,
  device TEXT, os TEXT, browser TEXT, in_app TEXT,
  lang TEXT
);
CREATE INDEX IF NOT EXISTS visits_ts ON visits(ts);
CREATE INDEX IF NOT EXISTS visits_promo ON visits(promo_id);

CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  promo_id INTEGER NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  redeemed_at TEXT,
  UNIQUE (promo_id, visitor_id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  type TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  promo_id INTEGER REFERENCES promos(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS events_ts ON events(ts);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

const shortId = () => randomBytes(3).toString('hex');

// Seed: 5 promos con slug no adivinable. El slug no se edita nunca: es lo que va impreso en el QR.
if (db.prepare('SELECT COUNT(*) AS n FROM promos').get().n === 0) {
  const seed = [
    ['pinta', 'Pinta gratis', '1 PINTA GRATIS', 'Te invitamos a una pinta de cerveza bien fría.', 'Con la compra de cualquier consumición. Un cupón por persona.'],
    ['tapa', 'Tapa gratis', '1 TAPA GRATIS', 'Una tapa de la casa para acompañar tu bebida.', 'Con la compra de una bebida. Un cupón por persona.'],
    ['empanada', 'Empanada de regalo', 'EMPANADA GRATIS', 'Prueba nuestras empanadas argentinas recién horneadas.', 'Con cualquier plato de la parrilla. Un cupón por persona.'],
    ['postre', 'Postre de la casa', 'POSTRE GRATIS', 'Cierra la comida con algo dulce, invita la casa.', 'Mesas de 2 o más personas que pidan parrilla. Un cupón por mesa.'],
    ['descuento', '10% de descuento', '-10%', 'Un 10% de descuento en el total de tu cuenta.', 'No acumulable con otras promociones. Un cupón por mesa.'],
  ];
  const insert = db.prepare('INSERT INTO promos (slug, title, badge, description, conditions, sort) VALUES (?, ?, ?, ?, ?, ?)');
  seed.forEach(([key, ...rest], i) => insert.run(`${key}-${shortId()}`, ...rest, i));
}

const DEFAULT_SETTINGS = {
  whatsapp_number: process.env.WHATSAPP_NUMBER || '34600000000',
  whatsapp_message: 'Hola! Quiero reservar una mesa en El Club de las Brasas 🔥',
  address: 'El Palo, Málaga',
  hours: 'Martes a domingo · 13:00–16:30 y 20:00–00:00',
  instagram: 'https://www.instagram.com/elclubdelasbrasas/',
  menu_url: 'https://elclubdelasbrasas.tucartadigital.com/',
};
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insertSetting.run(k, v);

export function getSettings() {
  return Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((r) => [r.key, r.value]));
}

export function saveSettings(values) {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    if (typeof values[k] === 'string') upsert.run(k, values[k].trim());
  }
}

export const isPromoLive = (p) =>
  !!p && p.active === 1 && (!p.valid_until || p.valid_until >= new Date().toISOString().slice(0, 10));

const COUPON_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newCouponCode() {
  const bytes = randomBytes(6);
  let s = '';
  for (const b of bytes) s += COUPON_ALPHABET[b % COUPON_ALPHABET.length];
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}
