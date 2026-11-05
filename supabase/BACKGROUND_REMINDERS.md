# Recordatorios aunque Agualin esté cerrada

La entrega en segundo plano necesita una suscripción Web Push y un proceso programado en el servidor. El navegador pide permiso al tocar **Activar avisos**. No se puede obligar al sistema operativo a mostrar avisos si la persona revoca el permiso, desactiva las notificaciones o pone el teléfono en un modo que las silencie.

## Preparar el servicio

1. Aplicar `migrations/20261105000100_background_reminders.sql` en la misma base Supabase que usa Agualin.
2. Crear un par de claves VAPID una sola vez con `npx web-push generate-vapid-keys`. Guardar la clave pública para `VITE_VAPID_PUBLIC_KEY`; configurar `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` en las variables de entorno del servidor. La clave privada y `SUPABASE_SERVICE_ROLE_KEY` solo van en variables privadas del servidor.
3. Generar un valor largo para `CRON_SECRET`. Configurarlo como variable de entorno privada en el hosting.
4. En Supabase, habilitar Vault, guardar ese mismo secreto como `agualin_push_cron_secret` y guardar la URL desplegada `https://TU-DOMINIO/api/push-reminders` como `agualin_push_cron_url`.
5. Ejecutar `background-reminders-cron.sql` para llamar al endpoint cada minuto. Revisar en Supabase Cron que el trabajo quede activo.
6. Volver a desplegar la app para que Vite incluya `VITE_VAPID_PUBLIC_KEY`. Instalarla/abrirla con HTTPS en el teléfono y tocar **Activar avisos** una vez.

Cada aviso se repite cada dos minutos desde que vence el intervalo elegido, dentro del horario configurado. Registrar agua detiene la repetición. El botón de pausa suspende los avisos por 30 minutos; desactivarlos elimina el recordatorio en segundo plano. El proveedor push y el sistema operativo aún pueden demorar, agrupar o silenciar notificaciones.

Si se vuelve a ejecutar el SQL del cron, primero quitar el trabajo anterior con `select cron.unschedule('agualin-background-water-reminders');`.
