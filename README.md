# Venta Nacional

Aplicación web para registrar pedidos, códigos y cantidades desde una PDA o un computador.

## Desarrollo

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Antes de publicar cambios:

```bash
pnpm test
pnpm build
```

## Funciones

- Cada pedido mantiene sus propios códigos. Al ingresar un código existente, la cantidad se suma.
- Si se corrige un código y pasa a coincidir con otro, ambas cantidades se fusionan en una sola fila.
- «Copiar para Excel» copia una tabla tabulada para pegarla en Excel.
- HOME permite renombrar y borrar pedidos. En la pantalla de códigos se puede borrar una fila o todas, con confirmación.

## Pedidos compartidos entre PDA y PC

La aplicación usa Supabase cuando están configuradas `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Copia `.env.example` a `.env.local` para trabajar localmente y configura las mismas variables en Vercel para producción. Solo se usa la clave pública; nunca una clave `secret` o `service_role` en variables `VITE_`.

Se usa la URL normal del sitio en PDA y PC, sin token ni cuenta. Cualquier visitante puede **ver y modificar todos los pedidos**. Los cambios aparecen automáticamente en los demás dispositivos en un máximo aproximado de tres segundos mientras la página esté abierta.

Al activar Supabase, HOME ofrece incorporar los pedidos que estaban guardados en el navegador de esa PDA. La importación es atómica: si falla una fila, no se agrega ninguna de ese lote. La copia anterior permanece en el dispositivo.

Las migraciones SQL están en `supabase/migrations`. Las tablas no conceden acceso directo a visitantes anónimos; la API pública ofrece las operaciones de esta aplicación.
