# El Club de las Brasas

Landing de la parrilla (El Palo, Málaga) + promos con QR para Instagram + panel admin con métricas.

Node 22.13+ · Express · SQLite nativo (`node:sqlite`) · sin build.

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

Sí tiene base de datos, pero **no hace falta crear ninguna aparte**: es un fichero **SQLite** que la app crea sola al arrancar (`node:sqlite`, incluido en Node, sin dependencias nativas).

- Ruta del fichero: variable `DATABASE_PATH` (por defecto `./data/brasas.db`).
- En el primer arranque crea las tablas y carga las 5 promos y los ajustes por defecto.
- Tablas: `promos`, `visits` (cada visita con origen, ciudad, dispositivo…), `coupons` (códigos y canjes), `events` (clics en WhatsApp / carta) y `settings` (WhatsApp, dirección, horario…).

⚠️ En Render el disco del servidor se borra en cada deploy. Por eso el fichero tiene que vivir en un **disco persistente** (ver abajo). Sin disco, cada deploy borraría métricas, cupones y cambios en las promos, y **los enlaces de las promos cambiarían** (el slug se genera al crear la base), invalidando los QR impresos.

## Variables de entorno

| Variable | Obligatoria | Ejemplo | Para qué |
|---|---|---|---|
| `ADMIN_PASSWORD` | Sí | `una-clave-larga` | Clave del panel admin. Por defecto `123456`: cámbiala en producción |
| `BASE_URL` | Sí | `https://elclubdelasbrasas.es` | URL pública. Va dentro de los QR. Sin barra final |
| `DATABASE_PATH` | Sí en Render | `/var/data/brasas.db` | Ruta del fichero SQLite, dentro del disco persistente |
| `ADMIN_PATH` | No | `admin` | Ruta del panel → `https://.../admin` |
| `SESSION_SECRET` | Recomendada | (aleatoria) | Firma la cookie de sesión del admin. `render.yaml` la genera sola |
| `WHATSAPP_NUMBER` | No | `34612345678` | Número inicial de reservas (prefijo país, sin `+` ni espacios). Después se edita en *Ajustes* |
| `NODE_VERSION` | Sí en Render | `24` | Node ≥ 22.13 (por `node:sqlite`) |
| `PORT` | No | — | Render la pone sola |

> `WHATSAPP_NUMBER` sólo se usa la primera vez que se crea la base. Luego manda lo que pongas en *Admin → Ajustes*.

## Subirlo a Render

Necesita el plan **Starter (~7 $/mes)** o superior: el plan gratis no admite discos persistentes.

### Opción A — Blueprint (recomendada)

El repo ya trae `render.yaml` con todo configurado (servicio web, disco de 1 GB en `/var/data`, `DATABASE_PATH`, `NODE_VERSION` y `SESSION_SECRET`).

1. En [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**.
2. Conecta el repo `tomasfonta/clubdelasbrasas` y rama `main`.
3. Render te pedirá los valores que faltan: `ADMIN_PASSWORD`, `ADMIN_PATH` (`admin`), `BASE_URL` y `WHATSAPP_NUMBER`.
   Si aún no tienes dominio, pon de momento la URL que te da Render (`https://elclubdelasbrasas.onrender.com`) y cámbiala luego.
4. **Apply**. El primer deploy tarda unos minutos (`npm ci` + arranque).
5. Comprueba que abre la web y entra al panel en `https://<tu-url>/admin`.

### Opción B — A mano

1. **New → Web Service** → conecta el repo, rama `main`.
2. Configuración:
   - Runtime: **Node** · Región: **Frankfurt** (la más cercana a España)
   - Build command: `npm ci`
   - Start command: `npm start`
   - Plan: **Starter**
3. **Advanced → Add Disk**: nombre `data`, mount path `/var/data`, 1 GB.
4. **Environment**: añade las variables de la tabla de arriba, con `DATABASE_PATH=/var/data/brasas.db` y `NODE_VERSION=24`.
5. **Create Web Service**.

### Dominio propio

1. En el servicio → **Settings → Custom Domains → Add** (ej. `elclubdelasbrasas.es` y `www.elclubdelasbrasas.es`).
2. Crea en tu proveedor de dominio los registros DNS que indica Render. El HTTPS se activa solo.
3. Cambia `BASE_URL` al dominio final (Render redeploya solo).

⚠️ **Pon el dominio definitivo en `BASE_URL` antes de descargar e imprimir los QR**: el QR lleva esa URL dentro. Si cambias de dominio después, los QR impresos seguirán apuntando al anterior.

### Actualizar

Cada `git push` a `main` redeploya solo. La base de datos se conserva porque está en el disco.

### Copias de seguridad

Render hace snapshots diarios del disco (se restauran desde **Disks** en el servicio). Para bajarte una copia manual:

```bash
render ssh <servicio>    # o la pestaña "Shell" del dashboard
sqlite3 /var/data/brasas.db ".backup /var/data/backup.db"
```
