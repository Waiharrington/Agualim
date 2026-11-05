# Agualin

Aplicación web progresiva para registrar hidratación diaria, ver ritmo por horas y consultar el historial semanal. La interfaz se adapta a móvil y escritorio.

Consulta [la guía de Agualin](GUIA_AGUALIN.md) para conocer las pantallas, el flujo de uso y las funciones disponibles.

## Desarrollo local

1. `npm install`
2. Copia `.env.example` a `.env.local` y agrega la URL Supabase y la clave `anon` pública.
3. `npm run dev`

Al dejar las variables vacías, los registros se guardan en el navegador. Con Supabase configurado, se entra con usuario y contraseña, sin correo. Supabase Auth protege la contraseña; `agualim.profiles` guarda solo el usuario y las cuentas se aíslan mediante RLS. El nombre se mapea a una identidad interna del dominio reservado `.invalid`, sin depender del servidor SMTP. Sin correo real no hay recuperación automática de contraseña.

## Base de datos compartida

Las migraciones están en `supabase/migrations/`. Usan solo el esquema `agualim`; habilitan RLS en `water_logs` y `profiles`. Cada usuario autenticado solo puede acceder a sus registros y su perfil. En el frontend se usa únicamente la clave pública `anon`.

El esquema técnico `agualim` está expuesto por PostgREST en el VPS autohospedado. Las tablas mantienen RLS y permisos acotados; el esquema se conserva con ese nombre para no romper las cuentas existentes.

## Recordatorios

Los recordatorios se pueden programar desde cada minuto hasta cada 24 horas. Si no se registra agua, llega un segundo aviso a los 2 minutos y continúa cada 2 minutos hasta registrar o pausar. Puede vibrar en navegadores compatibles. El temporizador funciona mientras la app está abierta; el navegador puede ralentizarlo en segundo plano y no puede garantizar la frecuencia con la app cerrada.

La foto del vaso se analiza desde una función privada de Vercel con Groq. La clave `GROQ_API_KEY` se configura solo en el servidor; nunca se expone en el JavaScript del navegador. La estimación es visual y debe confirmarse o corregirse antes de registrar.
