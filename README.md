# Web de Pelones Cantabria

Web de la asociación con dos vistas (isla 3D y web clásica), tienda de pedidos, noticias y agenda, galería, colaboradores, contacto, páginas legales, cuentas de usuario y panel de gestión con **app de sorteos en directo**.

- **Frontend:** HTML + CSS + JavaScript sin compilación (módulos ES). Three.js desde jsDelivr para la vista 3D.
- **Backend:** [Supabase](https://supabase.com) (plan gratuito) → autenticación, base de datos PostgreSQL con seguridad por filas (RLS), tiempo real y almacenamiento de fotos.
- **Alojamiento:** [Vercel](https://vercel.com) (plan gratuito) → web estática + 3 funciones (`/api/config`, `/api/health`, `/api/keepalive`).
- **Sin backend configurado** la web funciona en **modo demostración** (datos en el navegador) para poder probarla.

## Estructura

```
index.html                 Página única (router por #secciones)
assets/css/styles.css      Diseño
assets/js/app.js           Arranque, router y vistas públicas
assets/js/admin.js         Panel de gestión (sorteos, pedidos, mensajes, contenido, usuarios, ajustes)
assets/js/api.js           Capa de datos: Supabase o modo demo (misma interfaz)
assets/js/world3d.js       Isla 3D con el pelón
assets/js/content.js       Textos de la asociación, iconos y pelón en SVG
assets/js/ui.js            Utilidades (modales, avisos, confeti…)
assets/js/config.js        Claves públicas de Supabase (opcional)
api/*.js                   Funciones de Vercel
supabase/schema.sql        Tablas, seguridad, funciones, tiempo real y contenido inicial
vercel.json                Cabeceras de seguridad (CSP), caché y tarea diaria
```

## Puesta en marcha (unos 15 minutos)

### 1. Base de datos (Supabase)
1. Crea una cuenta en supabase.com → **New project** (región *West EU / Ireland* o *Central EU / Frankfurt*). Guarda la contraseña de la base de datos.
2. **SQL Editor → New query**, pega todo `supabase/schema.sql` y pulsa **Run**.
3. **Authentication → URL Configuration**: en *Site URL* pon la dirección final de la web (p. ej. `https://pelones-cantabria.vercel.app`) y añádela también en *Redirect URLs* como `https://pelones-cantabria.vercel.app/**`.
4. **Authentication → Email Templates** (opcional): traduce los correos de confirmación y de "restablecer contraseña" al español.
5. **Project Settings → API**: copia *Project URL* y la clave *anon public*.

### 2. Web (Vercel)
1. Sube esta carpeta a un repositorio de GitHub (o usa `npx vercel` desde la carpeta).
2. En vercel.com → **Add New → Project** → importa el repositorio. *Framework preset:* **Other**. Sin comando de build.
3. **Settings → Environment Variables:** `SUPABASE_URL` y `SUPABASE_ANON_KEY` (los valores del paso 1.5). Opcional: `CRON_SECRET`.
4. **Deploy**. Comprueba `https://TU-WEB.vercel.app/api/health` → debe responder `{"ok":true,"backend":"supabase","database":"ok"}`.

### 3. Primera administradora
1. En la web, **Crear cuenta** con tu correo y confírmalo.
2. En Supabase → SQL Editor ejecuta:
   ```sql
   update public.profiles set role = 'admin' where email = 'TU_CORREO@ejemplo.com';
   ```
3. Entra en la web: verás el icono de engranaje → **Panel**. Desde **Usuarios** das permiso de *Voluntario* al resto del equipo.

### 4. Rellenar datos
Panel → **Ajustes**: correo, WhatsApp, teléfono y dirección (no se encontraron publicados en internet, por eso están vacíos). Panel → **Productos**: revisa los precios (los de inicio son orientativos). Páginas legales: completa NIF, nº de registro y dirección (marcados entre corchetes en *Privacidad* y *Aviso legal*, en `assets/js/app.js`).

## App de sorteos
1. Panel → **Sorteos** → interruptor **App de sorteos en la web** (apagado por defecto: el público no ve nada).
2. **Nuevo sorteo**: título, precio, cantidad de números, fecha y lugar.
3. Los voluntarios registran ventas con **Venta rápida** (`7`, `7, 12`, `40-45`) o pulsando cada número. La base de datos impide vender dos veces el mismo número aunque dos personas lo intenten a la vez.
4. **Publicado** → el público ve en directo libres/vendidos (solo nombre e inicial del apellido; teléfonos y correos nunca salen del panel).
5. Tras el sorteo: **Sacar número al azar** (opcional) o **Añadir premio** → marca cada fila como visible → activa **Resultados publicados**.

## Seguridad
- Políticas RLS en todas las tablas: el público solo lee lo publicado; voluntarios venden números y ven pedidos/mensajes; solo administración publica, edita contenido y cambia permisos (un usuario no puede subirse el rol).
- El total de los pedidos se recalcula en el servidor con los precios reales.
- Antispam: máx. 5 mensajes / 5 pedidos por correo y hora; campo trampa en el formulario.
- CSP y cabeceras de seguridad en `vercel.json`. Fotos reducidas antes de subirlas.
- `/api/keepalive` se ejecuta a diario para que el proyecto gratuito de Supabase no se pause por inactividad.

## Fuentes de la información
IDIVAL · Real Racing Club (2016 y 2017) · El Diario Cantabria (2023) · Mi Grano de Arena · Blog AMPA CEIP Cabo Mayor (2017) · Blog CEO Príncipe de Asturias, Ramales (2026) · Vive Campoo (2018) · abloque.com (2017) · ifomo.es y Santander Qué Hacer (Semana Grande 2026).
