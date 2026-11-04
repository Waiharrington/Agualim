# Agualim

Aplicación web progresiva para registrar hidratación diaria, ver ritmo por horas y consultar el historial semanal. La interfaz se adapta a móvil y escritorio.

## Desarrollo local

1. `npm install`
2. Copia `.env.example` a `.env.local` y agrega la URL Supabase y la clave `anon` pública.
3. `npm run dev`

Al dejar las variables vacías, los registros se guardan en el navegador. Con Supabase configurado, la app requiere iniciar sesión por enlace de correo y guarda los registros bajo el esquema `agualim` con RLS por usuario.

## Base de datos compartida

La migración está en `supabase/migrations/20261104000100_agualim_initial_schema.sql`. Usa solo el esquema `agualim`; habilita RLS en `water_logs` y cada usuario autenticado solo puede ver y cambiar sus propios registros. En el frontend se usa únicamente la clave pública `anon`.

En el VPS autohospedado, el administrador debe exponer `agualim` a PostgREST y habilitar los permisos de esquema/tabla para los roles apropiados. Los ajustes globales del VPS permanecen fuera de este repositorio.

## Recordatorios

Los recordatorios del navegador funcionan mientras la aplicación permanece abierta. Notificaciones push fiables cuando está cerrada requieren configurar VAPID, guardar suscripciones y desplegar un servicio programado del lado de Supabase. La app no genera notificaciones repetidas a intervalos de segundos.
