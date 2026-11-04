# Agualim

Aplicación web progresiva para registrar hidratación diaria, ver ritmo por horas y consultar el historial semanal. La interfaz se adapta a móvil y escritorio.

## Desarrollo local

1. `npm install`
2. Copia `.env.example` a `.env.local` y agrega la URL Supabase y la clave `anon` pública.
3. `npm run dev`

Al dejar las variables vacías, los registros se guardan en el navegador. Con Supabase configurado, se entra con usuario y contraseña, sin correo. Supabase Auth protege la contraseña; `agualim.profiles` guarda solo el usuario y las cuentas se aíslan mediante RLS. El nombre se mapea a una identidad interna del dominio reservado `.invalid`, sin depender del servidor SMTP. Sin correo real no hay recuperación automática de contraseña.

## Base de datos compartida

Las migraciones están en `supabase/migrations/`. Usan solo el esquema `agualim`; habilitan RLS en `water_logs` y `profiles`. Cada usuario autenticado solo puede acceder a sus registros y su perfil. En el frontend se usa únicamente la clave pública `anon`.

En el VPS autohospedado, el administrador debe exponer `agualim` a PostgREST y habilitar los permisos de esquema/tabla para los roles apropiados. Los ajustes globales del VPS permanecen fuera de este repositorio.

## Recordatorios

Los recordatorios comienzan con la frecuencia elegida. Si no se registra agua, el aviso se repite cada 2 segundos hasta que se registre un vaso, se pause por 30 minutos o se apaguen los avisos. Puede vibrar en navegadores que admiten la API de vibración. El temporizador funciona mientras la app está abierta; el navegador puede ralentizarlo cuando queda en segundo plano y no puede garantizar esa frecuencia con la app cerrada. Push fiable con la app cerrada requiere configurar VAPID, guardar suscripciones y un servicio programado del lado del servidor.
