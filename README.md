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
- Al copiar para Excel se genera una tabla tabulada.

## Pedidos compartidos entre PDA y PC

La aplicación usa Supabase cuando están configuradas `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Copia `.env.example` a `.env.local` para trabajar localmente y configura las mismas variables en Vercel para producción. Solo se usa la clave pública; nunca una clave `secret` o `service_role` en variables `VITE_`.

El enlace de acceso es la URL del sitio con `#access=TOKEN`. El token se generó en Supabase y puede consultarse en el SQL Editor con:

```sql
select token from public.workspace_access where singleton = true;
```

Se usa el mismo enlace en PDA y PC. No hay cuentas. Cualquiera que tenga el enlace puede **ver y modificar todos los pedidos**; compártelo solo con el equipo. Los cambios aparecen automáticamente en los demás dispositivos en un máximo aproximado de tres segundos mientras la página esté abierta. Si se pierde el enlace, el dueño del proyecto puede volver a consultar el token en Supabase.

Al activar Supabase, HOME ofrece importar los pedidos que estaban guardados en el navegador de esa PDA o desde un respaldo JSON. La importación es atómica: si falla una fila, no se agrega ninguna de ese lote. La copia anterior permanece en el dispositivo. Importar el mismo archivo JSON varias veces creará pedidos duplicados.

Las migraciones SQL están en `supabase/migrations`. Las tablas no conceden acceso directo a visitantes anónimos: las funciones verifican el token antes de leer o modificar datos.
