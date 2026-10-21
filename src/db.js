import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

// Producción: Turso (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN). Local: fichero SQLite en ./data.
const remote = !!process.env.TURSO_DATABASE_URL;
if (!remote) mkdirSync('./data', { recursive: true });

const client = createClient(
  remote
    ? { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: `file:${process.env.DATABASE_PATH || './data/brasas.db'}` },
);

const toObjects = (rs) => rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])));

export const db = {
  all: async (sql, args = []) => toObjects(await client.execute({ sql, args })),
  get: async (sql, args = []) => toObjects(await client.execute({ sql, args }))[0],
  run: async (sql, args = []) => {
    const r = await client.execute({ sql, args });
    return { changes: r.rowsAffected };
  },
};

export const SCHEMA = `
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
`;

const shortId = () => randomBytes(3).toString('hex');

const SEED_PROMOS = [
  ['pinta', 'Pinta gratis', '1 PINTA GRATIS', 'Te invitamos a una pinta de cerveza bien fría.', 'Con la compra de cualquier consumición. Un cupón por persona.'],
  ['tapa', 'Tapa gratis', '1 TAPA GRATIS', 'Una tapa de la casa para acompañar tu bebida.', 'Con la compra de una bebida. Un cupón por persona.'],
  ['empanada', 'Empanada de regalo', 'EMPANADA GRATIS', 'Prueba nuestras empanadas argentinas recién horneadas.', 'Con cualquier plato de la parrilla. Un cupón por persona.'],
  ['postre', 'Postre de la casa', 'POSTRE GRATIS', 'Cierra la comida con algo dulce, invita la casa.', 'Mesas de 2 o más personas que pidan parrilla. Un cupón por mesa.'],
  ['descuento', '10% de descuento', '-10%', 'Un 10% de descuento en el total de tu cuenta.', 'No acumulable con otras promociones. Un cupón por mesa.'],
];

const DEFAULT_SETTINGS = {
  whatsapp_number: process.env.WHATSAPP_NUMBER || '34600000000',
  whatsapp_message: 'Hola! Quiero reservar una mesa en El Club de las Brasas 🔥',
  events_message: 'Hola! Quiero información para organizar un evento en El Club de las Brasas 🔥',
  catering_message: 'Hola! Quiero pedir presupuesto de catering de parrilla para un evento 🔥',
  phone: '',
  address: 'El Palo, Málaga',
  hours: 'Martes a domingo · 13:00–16:30 y 20:00–00:00',
  instagram: 'https://www.instagram.com/elclubdelasbrasas/',
  menu_url: 'https://elclubdelasbrasas.tucartadigital.com/',
};

// Crea tablas y datos iniciales. Idempotente: se ejecuta en cada arranque.
export async function initDb() {
  if (!remote) await client.execute('PRAGMA journal_mode = WAL');
  await client.executeMultiple(SCHEMA);

  // Seed: 5 promos con slug no adivinable. El slug no se edita nunca: es lo que va impreso en el QR.
  if ((await db.get('SELECT COUNT(*) AS n FROM promos')).n === 0) {
    await client.batch(
      SEED_PROMOS.map(([key, ...rest], i) => ({
        sql: 'INSERT INTO promos (slug, title, badge, description, conditions, sort) VALUES (?, ?, ?, ?, ?, ?)',
        args: [`${key}-${shortId()}`, ...rest, i],
      })),
      'write',
    );
  }
  await client.batch(
    Object.entries(DEFAULT_SETTINGS).map(([k, v]) => ({ sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', args: [k, v] })),
    'write',
  );
  console.log(`🗄️  Base de datos: ${remote ? `Turso (${new URL(process.env.TURSO_DATABASE_URL).host})` : 'fichero local'}`);
}

export async function getSettings() {
  return Object.fromEntries((await db.all('SELECT key, value FROM settings')).map((r) => [r.key, r.value]));
}

export async function saveSettings(values) {
  const stmts = Object.keys(DEFAULT_SETTINGS)
    .filter((k) => typeof values[k] === 'string')
    .map((k) => ({ sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', args: [k, values[k].trim()] }));
  if (stmts.length) await client.batch(stmts, 'write');
}

export const isPromoLive = (p) =>
  !!p && Number(p.active) === 1 && (!p.valid_until || p.valid_until >= new Date().toISOString().slice(0, 10));

const COUPON_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newCouponCode() {
  const bytes = randomBytes(6);
  let s = '';
  for (const b of bytes) s += COUPON_ALPHABET[b % COUPON_ALPHABET.length];
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}
