// Copia una base SQLite existente (fichero) a Turso, conservando ids y slugs de las promos
// para que los QR ya impresos sigan funcionando.
//
// Uso:
//   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/migrate-to-turso.js ./data/brasas.db
//
// Reemplaza el contenido de las tablas en Turso por el del fichero.
import { createClient } from '@libsql/client';
import { existsSync } from 'node:fs';

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error('Indica el fichero de origen: node scripts/migrate-to-turso.js ./data/brasas.db');
  process.exit(1);
}
if (!process.env.TURSO_DATABASE_URL) {
  console.error('Falta TURSO_DATABASE_URL (y TURSO_AUTH_TOKEN).');
  process.exit(1);
}

const { SCHEMA } = await import('../src/db.js');
const source = createClient({ url: `file:${file}` });
const target = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

await target.executeMultiple(SCHEMA);

// Orden padre → hijo por las claves foráneas.
const TABLES = ['settings', 'promos', 'visits', 'coupons', 'events'];
const CHUNK = 200;

await target.batch([...TABLES].reverse().map((t) => `DELETE FROM ${t}`), 'write');

for (const table of TABLES) {
  const rs = await source.execute(`SELECT * FROM ${table}`);
  const cols = rs.columns;
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
  for (let i = 0; i < rs.rows.length; i += CHUNK) {
    await target.batch(
      rs.rows.slice(i, i + CHUNK).map((r) => ({ sql, args: cols.map((_, j) => r[j]) })),
      'write',
    );
  }
  console.log(`✓ ${table}: ${rs.rows.length} filas`);
}

console.log('Migración completa.');
