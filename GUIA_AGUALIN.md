# Agualin — guía de la aplicación

## Qué es

Agualin es una aplicación web progresiva, adaptable a teléfonos y computadoras, para registrar el agua tomada durante el día. Muestra el avance frente a una meta diaria, permite observar los horarios de consumo y conserva un historial por cuenta.

## Acceso y creación de cuenta

- La persona crea una cuenta con un nombre de usuario y una contraseña; no necesita correo electrónico.
- El usuario admite de 3 a 24 letras minúsculas, números, puntos, guiones y guiones bajos.
- Al crear la cuenta se exige una contraseña de al menos 12 caracteres.
- Supabase Auth administra la contraseña. Agualin guarda en su perfil únicamente el nombre de usuario asociado a la cuenta.
- Como no se usa correo, no hay recuperación automática de contraseña. Conviene guardarla en un lugar seguro.

## Pantallas

### 1. Crear cuenta o entrar

La pantalla inicial permite alternar entre **Crear cuenta** y **Entrar**. En ambos casos se usa el mismo nombre de usuario y contraseña. Una vez autenticada, la cuenta muestra solo sus propios registros.

### 2. Mi día

Es el panel principal de hidratación. Incluye:

- Una botella que se llena según el porcentaje de la meta diaria alcanzado.
- Los mililitros registrados hoy, la meta configurada y lo que falta para alcanzarla.
- Botones de registro rápido para 150, 250, 350 y 500 ml, además de un campo para escribir otra cantidad.
- Los registros recientes del día y el total de vasos o entradas.
- Un gráfico de consumo por bloques de dos horas y el bloque con más agua registrada.

### 3. Progreso

Resume los últimos siete días con un gráfico diario. También presenta el promedio diario, el día con mayor consumo y la cantidad de registros de la semana. Los días sin entradas aparecen sin consumo registrado.

### 4. Ajustes

Se abre desde el panel principal. Permite elegir una meta diaria entre 2 y 5 litros, configurar cada cuánto avisar (30, 45, 60 o 90 minutos) y definir el horario de inicio y fin. Desde el panel principal también se pueden activar o apagar los avisos.

## Recordatorios

Cuando vence el intervalo configurado, Agualin muestra el recordatorio. Si no se registra agua, vuelve a avisar cada dos segundos hasta que se registre una cantidad, se pause el aviso por 30 minutos o se apaguen los recordatorios. En navegadores compatibles puede vibrar.

El navegador debe permitir las notificaciones y la aplicación debe permanecer abierta para mantener el temporizador. Los navegadores pueden reducir la frecuencia en segundo plano; las notificaciones push confiables con la aplicación cerrada necesitan un servicio de notificaciones del servidor.

## Datos e historial

- Los registros incluyen cantidad, hora y día local, y se sincronizan con Supabase.
- Cada cuenta consulta y modifica únicamente sus propios registros mediante políticas RLS.
- `agualim` es el nombre técnico del esquema Supabase que ya usa el historial y las cuentas. Se conserva así para mantener compatibilidad con las cuentas existentes; el nombre visible del producto es **Agualin**.
- `agualim.water_logs` almacena las entradas de agua. `agualim.profiles` relaciona el usuario de Supabase Auth con su nombre de usuario de Agualin.
- La meta y las preferencias personales del navegador se guardan localmente en ese dispositivo.

## Instalación y disponibilidad

Agualin puede abrirse como sitio web o instalarse desde el navegador que admita aplicaciones web progresivas. En el teléfono se recomienda permitir notificaciones y mantener la aplicación disponible durante el horario de avisos.

El sitio de producción es [agualin.vercel.app](https://agualin.vercel.app). El nombre visible dentro de la app es **Agualin**.

## Consideraciones

La aplicación sirve para observar hábitos y registrar agua; no reemplaza una recomendación médica. Las necesidades de hidratación varían según la persona, la actividad, el clima y la salud. La meta diaria se puede ajustar desde **Ajustes**.

