# Modo online: qué falta configurar

La base de datos ya está creada y probada: proyecto **Consultorio** en Supabase (región São Paulo, plan gratis), con la tabla `records`, seguridad por usuario (RLS) y la función para borrar la cuenta. El esquema está en `supabase/schema.sql`.

Lo que sigue solo lo puede hacer el dueño de las cuentas. Sin estos pasos, el modo online funciona únicamente con el acceso por email, y los enlaces del mail vuelven a `localhost`.

## 1. Dirección de la app (obligatorio)

Supabase → proyecto Consultorio → **Authentication → URL Configuration**:

- **Site URL:** `https://abelg88.github.io/PsicoApp/`
- **Redirect URLs:** agregar `https://abelg88.github.io/PsicoApp/` (y `http://localhost:8000/` para probar en local).

## 2. Entrar con Google

1. En Google Cloud Console → APIs y servicios → Credenciales → **Crear ID de cliente de OAuth** (tipo: aplicación web).
2. URI de redireccionamiento autorizado: `https://infjyoqfrhhbudxojsts.supabase.co/auth/v1/callback`
3. Copiar el ID de cliente y el secreto en Supabase → **Authentication → Providers → Google** y activarlo.
4. En la pantalla de consentimiento de Google, publicar la app (si queda "en prueba" solo entran los usuarios de prueba).

## 3. Entrar con Facebook

1. En developers.facebook.com crear una app (tipo consumidor) y agregar el producto **Inicio de sesión con Facebook**.
2. URI de redireccionamiento de OAuth válido: `https://infjyoqfrhhbudxojsts.supabase.co/auth/v1/callback`
3. Copiar el identificador y la clave secreta en Supabase → **Authentication → Providers → Facebook** y activarlo.
4. Pasar la app a modo "En vivo". Meta pide una URL de política de privacidad y una de eliminación de datos: se puede usar la de la app (Panel → Privacidad y legales).

El botón de cada proveedor aparece solo en la app cuando el proveedor está activado en Supabase.

## 4. Mails de acceso

El envío de mails que trae Supabase es para pruebas y está limitado a muy pocos mails por hora. Para uso real hay que cargar un SMTP propio en **Authentication → Emails → SMTP Settings** (Resend, Brevo, etc.).

Para que el usuario pueda escribir un código en vez de abrir el enlace, agregar `{{ .Token }}` a la plantilla "Magic Link".

## 5. Límites del plan gratis

- El proyecto se **pausa después de unos 7 días sin actividad**. Con usuarios activos no pasa; si pasa, se reactiva desde el panel de Supabase.
- 500 MB de base de datos. Cada consultorio ocupa poco (todo va comprimido y cifrado), pero conviene mirar el uso si crecen los usuarios.
- No hay copias de seguridad automáticas en el plan gratis: cada dispositivo conserva su copia completa, y la app sigue pidiendo la copia de seguridad manual.

## Cómo funciona

- En el dispositivo, el núcleo (pacientes, turnos, cobros, ajustes) es un bloque cifrado y cada registro de historia clínica es otro bloque cifrado.
- Cada bloque se sube como una fila de `records`. La clave de cifrado se deriva de la contraseña del usuario y nunca sale del dispositivo.
- Si dos dispositivos cambian cosas distintas, se unen registro por registro y gana el cambio más nuevo. Los borrados se propagan.
- Si la clave se cambia en un dispositivo, los otros piden la clave nueva.
- La cuenta (Google, Facebook o email) solo identifica al usuario: no reemplaza a la clave. **Sin la clave, los datos de la nube no se pueden abrir.**

## Qué no hace todavía

- No hay recuperación de clave.
- No hay varios usuarios sobre un mismo consultorio (secretaria, colegas).
- No hay turnos online para pacientes ni avisos automáticos: necesitan un servidor que vea datos sin cifrar, y es una decisión de diseño aparte.
