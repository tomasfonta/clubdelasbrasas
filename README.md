# El Club de las Brasas

Landing de la parrilla (El Palo, Málaga) + promos con QR para Instagram + panel admin con métricas.

Node 20+ · Express · SQLite en [Turso](https://turso.tech) (libSQL) · sin build.

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:3000  ·  admin en /admin
```

## Cómo funciona

| Ruta | Qué es |
|---|---|
| `/` | Landing con botón de reserva por WhatsApp |
| `/p/<slug>` | Página de cada promo. El slug lleva un sufijo aleatorio (`pinta-b6d4b2`) para que no se pueda adivinar |
| `/p/<slug>?src=qr` | Enlace que va dentro del QR impreso |
| `/p/<slug>?src=ig` | Enlace para bio / stories de Instagram |
| `/go/whatsapp`, `/go/carta` | Redirecciones que cuentan clics |
| `/<ADMIN_PATH>` | Panel admin (clave en `ADMIN_PASSWORD`) |

**Flujo del cupón**

1. El cliente abre la promo (desde el QR o el link de Instagram) → se registra la visita con origen, ciudad, dispositivo, app…
2. Pulsa *Obtener mi cupón* → recibe un código único (`ABC-123`) y un QR. Uno por promo y por móvil.
3. En el local, el camarero escanea ese QR con su móvil (con sesión de admin abierta) → ve *Cupón válido* / *Ya canjeado* → *Marcar como canjeado*.
   Sin sesión de admin, ese QR sólo lleva a la página de la promo: la ruta del panel no se expone.
   También se puede teclear el código en *Validar cupón*.

**Métricas**: visitas, únicos, cupones generados/canjeados, clics en WhatsApp, por día, por promo, origen (QR/IG/Google/directo), ciudad, país, dispositivo, sistema, app (Instagram in-app, Safari…), idioma, hora del día y `utm_campaign`. Los bots y las previsualizaciones de enlaces (Instagram/WhatsApp) no cuentan.

Para distinguir publicaciones, añade `&utm_campaign=post-pinta-octubre` al link de Instagram.

## Base de datos

**SQLite alojado en [Turso](https://turso.tech)**, plan gratuito. La app se conecta con `@libsql/client`.

- **Producción:** si existen `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, usa Turso.
- **Local:** si no existen, usa el fichero `./data/brasas.db`. No hace falta cuenta para desarrollar.
- Al arrancar crea las tablas si no existen y, la primera vez, las 5 promos y los ajustes por defecto ([src/db.js](src/db.js)).
- Tablas: `promos`, `visits` (cada visita con origen, ciudad, dispositivo…), `coupons` (códigos y canjes), `events` (clics en WhatsApp / carta) y `settings` (WhatsApp, dirección, horario…).

```
Cliente ──HTTPS──▶ Render (Web Service, Node/Express) ──HTTPS──▶ Turso (SQLite gestionado)
```

El Web Service no guarda nada en disco: se puede redeployar sin perder datos y no necesita disco persistente.

### Crear la base en Turso

```bash
brew install tursodatabase/tap/turso
turso auth signup                      # o: turso auth login
turso db locations                     # elige la región más cercana a Frankfurt
turso db create clubdelasbrasas --location <región>
turso db show clubdelasbrasas --url    # → TURSO_DATABASE_URL (libsql://...)
turso db tokens create clubdelasbrasas # → TURSO_AUTH_TOKEN
```

Tras el primer deploy la app crea las tablas sola. Para consultar los datos a mano: `turso db shell clubdelasbrasas`.

### Pasar datos de una base existente

Si ya había datos en un fichero SQLite (local o en un disco de Render), cópialos a Turso conservando los slugs de las promos, para que los QR ya impresos sigan funcionando:

```bash
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/migrate-to-turso.js ./data/brasas.db
```

⚠️ Reemplaza el contenido de las tablas en Turso.

## Variables de entorno

| Variable | Obligatoria | Ejemplo | Para qué |
|---|---|---|---|
| `TURSO_DATABASE_URL` | Sí en producción | `libsql://clubdelasbrasas-xxx.turso.io` | Base de datos |
| `TURSO_AUTH_TOKEN` | Sí en producción | `eyJhbGci...` | Token de acceso a Turso |
| `ADMIN_PASSWORD` | Sí | `una-clave-larga` | Clave del panel admin. Por defecto `123456` |
| `BASE_URL` | Sí | `https://elclubdelasbrasas.es` | URL pública. Va dentro de los QR. Sin barra final |
| `ADMIN_PATH` | No | `admin` | Ruta del panel → `https://.../admin` |
| `SESSION_SECRET` | Recomendada | (aleatoria) | Firma la cookie de sesión del admin. `render.yaml` la genera sola |
| `WHATSAPP_NUMBER` | No | `34612345678` | Número inicial de reservas (prefijo país, sin `+`). Después se edita en *Ajustes* |
| `NODE_VERSION` | Sí en Render | `24` | Versión de Node |
| `PORT` | No | — | Render la pone sola |

> `WHATSAPP_NUMBER` sólo se usa la primera vez que se crea la base. Luego manda lo que pongas en *Admin → Ajustes*.

## Subirlo a Render

### Opción A — Blueprint

El repo trae `render.yaml` (servicio web en Frankfurt, health check en `/health`, `NODE_VERSION` y `SESSION_SECRET`).

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint** → repo `tomasfonta/clubdelasbrasas`, rama `main`.
2. Rellena `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ADMIN_PASSWORD`, `BASE_URL` y `WHATSAPP_NUMBER`.
   Si aún no tienes dominio, pon la URL que da Render (`https://<servicio>.onrender.com`) y cámbiala luego.
3. **Apply** y espera al deploy. En los logs debe aparecer `🗄️  Base de datos: Turso (...)`.

### Opción B — Web Service ya creado

1. En el servicio → **Environment**: añade `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` (y el resto de la tabla).
2. **Settings → Health Check Path**: `/health`.
3. Si tenía un disco persistente con datos, migra antes (ver *Pasar datos de una base existente*, desde la pestaña **Shell** del servicio con `/var/data/brasas.db`) y después borra el disco en **Disks**.
4. Guarda: Render redeploya solo. Comprueba en los logs `🗄️  Base de datos: Turso (...)`.

> Ojo: si el servicio arranca **sin** las variables de Turso, usa un fichero local que se borra en cada deploy.

### Dominio propio

1. **Settings → Custom Domains → Add** (ej. `elclubdelasbrasas.es` y `www.`).
2. Crea los registros DNS que indica Render. El HTTPS se activa solo.
3. Cambia `BASE_URL` al dominio final.

⚠️ **Pon el dominio definitivo en `BASE_URL` antes de descargar e imprimir los QR**: el QR lleva esa URL dentro.

### Actualizar

Cada `git push` a `main` redeploya solo. Los datos viven en Turso y no se tocan.

### Copias de seguridad

Turso guarda el historial y permite restaurar a un momento anterior (`turso db create <nueva> --from-db clubdelasbrasas --timestamp ...`). Copia manual:

```bash
turso db shell clubdelasbrasas .dump > backup.sql
```
