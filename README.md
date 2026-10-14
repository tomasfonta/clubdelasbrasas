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

## Despliegue (Render)

`render.yaml` crea el servicio con un disco persistente de 1 GB para la base SQLite. Define en el dashboard:
`ADMIN_PASSWORD`, `ADMIN_PATH`, `BASE_URL` (dominio final) y `WHATSAPP_NUMBER`.

⚠️ Pon el dominio definitivo en `BASE_URL` **antes** de descargar e imprimir los QR: el QR codifica esa URL.
