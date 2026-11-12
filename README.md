# PsicoApp

App para el consultorio: turnos, cobros y deudas. Funciona en el celular, sin internet y sin cuentas.

**Usarla:** https://abelg88.github.io/PsicoApp/

## Qué hace

- **Agenda:** turnos por día con estado (programado, asistió, canceló, canceló tarde, faltó). Se pueden repetir semanalmente. Recordatorio por WhatsApp en un toque.
- **Pacientes:** valor por sesión, obra social o particular, teléfono, notas administrativas y saldo.
- **Cobros y deudas:** registro de pagos (efectivo, transferencia, Mercado Pago), deuda por paciente y total, aviso de deuda por WhatsApp.
- **Mes:** cobrado, facturado, proyectado y cantidad de sesiones por estado.
- **Ajustes:** elegir si se cobra la cancelación tardía y la falta sin aviso, firma de los mensajes, copia de seguridad, cambio de clave.

## Cómo se calculan los números

- **Cobra una sesión** si el turno está en *Asistió*, o en *Canceló tarde* / *Faltó* cuando esa opción está activada en Ajustes. *Programado* y *Canceló* no se cobran.
- **Saldo del paciente** = sesiones que se cobran − pagos registrados. Positivo es deuda, negativo es saldo a favor. Los pagos no se asignan a sesiones puntuales.
- **Mes:** *Cobrado* suma los pagos con fecha del mes. *Facturado* suma las sesiones que se cobran del mes. *Proyectado* es facturado más los turnos todavía programados. No incluye deudas de meses anteriores.
- Cada turno guarda su propio valor. Cambiar el valor del paciente no modifica los turnos ya cargados.

## Instalarla en el celular

1. Abrir el link en Chrome (Android) o Safari (iPhone).
2. Menú del navegador → **Agregar a pantalla de inicio**.
3. La primera vez pide crear una clave (mínimo 6 caracteres).

## Privacidad y datos

- Los datos se guardan **solo en el teléfono**, cifrados con la clave (AES-GCM, clave derivada con PBKDF2). No hay servidor ni base de datos.
- Este repositorio contiene únicamente el código. Nunca hay datos de pacientes acá.
- La app se bloquea sola al salir a otra aplicación (por ejemplo, al abrir WhatsApp). Lo que estaba sin guardar en un formulario se pierde.
- El número de teléfono se usa tal cual para armar el link de WhatsApp. Con 10 dígitos se asume Argentina (+54 9).
- **No hay recuperación de clave.** Si se olvida, los datos no se pueden abrir.
- **Si se borran los datos del navegador o se pierde el celular, se pierde todo.** Descargar una copia de seguridad seguido (Ajustes → Descargar copia) y guardarla en Drive o enviarla por mail. El archivo está cifrado con la clave que tenía al momento de descargarlo.
- Las notas del paciente son para datos administrativos. No cargar información clínica.

## Para desarrollo

Es una PWA estática: HTML, CSS y JavaScript sin dependencias ni paso de build.

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la app |
| `sw.js` | Service worker (funcionamiento sin internet) |
| `manifest.webmanifest` | Datos para instalarla como app |
| `icon.svg`, `icon-192.png`, `icon-512.png` | Íconos |

Para probar en local: `python3 -m http.server` en la carpeta y abrir `http://localhost:8000`.

Datos: todo vive en un único objeto `{patients, sessions, payments, settings}` que se cifra completo y se guarda en `localStorage` (clave `consultorio_v1`, formato `v:1`). La copia de seguridad es ese mismo contenido descargado como `.json`.

Para publicar cambios: subir a `main`. GitHub Pages sirve desde la raíz de esa rama. Si se cambia algo que debe verse al instante, subir también el número de versión de la caché en `sw.js` (`consultorio-v1` → `consultorio-v2`).

## Limitaciones conocidas

- Un turno no se puede editar (fecha, hora o valor): hay que borrarlo y crearlo de nuevo. Los turnos repetidos se borran de a uno.
- No hay búsqueda de pacientes ni forma de archivarlos. Eliminar un paciente borra también sus sesiones y cobros.
- Un turno pasado que quedó en *Programado* no se marca de ninguna forma.
- Los datos están en un solo dispositivo: no hay sincronización ni uso en dos teléfonos.
- Después de publicar una versión nueva, el celular puede mostrar la anterior hasta abrir la app una segunda vez (cache primero).

## Pendiente

Ideas a futuro, por prioridad:

1. Editar turnos y borrar una serie completa.
2. Aviso de turnos pasados sin estado y recordatorio de hacer copia de seguridad.
3. Buscador y archivo de pacientes.
4. Recibos en PDF.
5. Exportar a Excel y control de obras sociales.
6. Historia clínica (requiere pensar bien privacidad y cifrado antes de sumarla).
