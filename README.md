# PsicoApp

App para el consultorio: turnos, cobros y deudas. Funciona en el celular, sin internet y sin cuentas.

**Usarla:** https://abelg88.github.io/PsicoApp/

## Qué hace

- **Agenda:** turnos por día con estado (programado, asistió, canceló, canceló tarde, faltó). Se pueden editar, repetir semanalmente y borrar de a uno o con todos los siguientes de la serie. Los turnos pasados que quedaron sin cerrar se marcan y se avisa. Recordatorio por WhatsApp en un toque.
- **Pacientes:** valor por sesión, obra social o particular, teléfono, notas administrativas y saldo. Buscador por nombre, obra social o teléfono, y opción de archivar a quien ya no viene (se oculta de las listas y de los turnos nuevos, pero conserva historial y deuda).
- **Cobros y deudas:** registro de pagos (efectivo, transferencia, Mercado Pago), deuda por paciente y total, aviso de deuda por WhatsApp.
- **Mes:** cobrado, facturado, proyectado y cantidad de sesiones por estado.
- **Ajustes:** elegir si se cobra la cancelación tardía y la falta sin aviso, firma de los mensajes, copia de seguridad (con aviso si pasaron 15 días o más sin hacer una), cambio de clave.

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
- La app se bloquea sola si se sale a otra aplicación más de 30 segundos. Un salto corto (por ejemplo, a WhatsApp) no la bloquea.
- El teléfono se normaliza para el link de WhatsApp: acepta `11 2345 6789`, `011 15 2345 6789`, `+54 9 11 2345 6789` y similares (Argentina). Un celular sin código de área no genera link. Números de otros países se usan tal cual, con código de país.
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

- Al editar un turno repetido se cambia solo ese turno, no la serie.
- Eliminar un paciente borra también sus sesiones y cobros: para conservar el historial conviene archivarlo.
- Los datos están en un solo dispositivo: no hay sincronización ni uso en dos teléfonos.
- Después de publicar una versión nueva, el celular puede mostrar la anterior hasta abrir la app una segunda vez (cache primero).

## Pendiente

Ideas a futuro, por prioridad:

1. Aviso de "hay una versión nueva" y validación más estricta al restaurar una copia.
2. Recibos en PDF.
3. Exportar a Excel y control de obras sociales.
4. Historia clínica (requiere pensar bien privacidad y cifrado antes de sumarla).
