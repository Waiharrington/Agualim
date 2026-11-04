# Agualim

Aplicación web progresiva para registrar hidratación diaria, ver ritmo por horas y consultar el historial semanal. La interfaz se adapta a móvil y escritorio.

## Desarrollo local

1. `npm install`
2. Copia `.env.example` a `.env.local` y agrega la URL Supabase y la clave `anon` pública.
3. `npm run dev`

Al dejar las variables vacías, los registros se guardan en el navegador. Con Supabase configurado, la app permite iniciar sesión con contraseña, crear una cuenta sin confirmación de correo (según la configuración Auth actual del VPS) o solicitar un enlace de correo. Los registros se guardan bajo el esquema `agualim` con RLS por usuario.

## Base de datos compartida

La migración está en `supabase/migrations/20261104000100_agualim_initial_schema.sql`. Usa solo el esquema `agualim`; habilita RLS en `water_logs` y cada usuario autenticado solo puede ver y cambiar sus propios registros. En el frontend se usa únicamente la clave pública `anon`.

En el VPS autohospedado, el administrador debe exponer `agualim` a PostgREST y habilitar los permisos de esquema/tabla para los roles apropiados. Los ajustes globales del VPS permanecen fuera de este repositorio.

## Recordatorios

Los recordatorios comienzan con la frecuencia elegida. Si no se registra agua, el aviso se repite cada 2 segundos hasta que se registre un vaso, se pause por 30 minutos o se apaguen los avisos. Puede vibrar en navegadores que admiten la API de vibración. El temporizador funciona mientras la app está abierta; el navegador puede ralentizarlo cuando queda en segundo plano y no puede garantizar esa frecuencia con la app cerrada. Push fiable con la app cerrada requiere configurar VAPID, guardar suscripciones y un servicio programado del lado del servidor.
