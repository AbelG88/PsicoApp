# PsicoApp

App para el consultorio: turnos, cobros y deudas. Funciona en el celular, sin internet y sin cuentas.

**Usarla:** https://abelg88.github.io/PsicoApp/

## Qué hace

Tres pestañas (**Hoy**, **Pacientes**, **Plata**) y un engranaje de Ajustes.

- **Hoy:** turnos del día. Un toque en el círculo marca que asistió; tocar el turno abre la hoja para cambiar estado, fecha, hora, valor, autorización, recordar por WhatsApp o borrarlo. Los turnos se pueden repetir semanalmente y borrar de a uno o con todos los siguientes de la serie. Los turnos pasados sin cerrar se marcan y se avisa.
- **Pacientes:** buscador (nombre, obra social, teléfono), saldo, historial de sesiones y cobros, aviso de deuda por WhatsApp. Se pueden archivar: se ocultan de las listas y de los turnos nuevos, pero conservan historial y deuda.
- **Plata:** cobrado, facturado, proyectado y deuda de pacientes del mes, y el estado de cada obra social.
- **Obras sociales y prepagas** (lo que más cambió):
  - Cada una tiene valor por sesión, código de práctica, día límite de presentación, plazo de pago y si exige autorización.
  - Cada paciente tiene su obra social, nº de afiliado, lo que paga la obra social, el copago propio y un tope de sesiones por mes.
  - Cada sesión asistida se sigue como **sin presentar → presentada → cobrada**, o **débito**.
  - Antes de presentar avisa de autorizaciones faltantes, afiliados sin número, sesiones que pasan el tope y el vencimiento del mes.
  - Descarga la planilla del mes en CSV (se abre en Excel), marca como presentado o cobrado, controla cuántos días pasaron desde la presentación y arma el texto del reclamo de un débito.
- **Poco tipeo:**
  - **Montos como botones:** los montos que usás (valor de sesión, lo que paga la obra social, copagos) se aprenden solos y aparecen como botones en pacientes, turnos y cobros. Un toque los carga, y el campo para escribir otro queda debajo. En Ajustes se pueden quitar o agregar.
  - **Todo se completa solo:** el valor del turno viene del paciente, la hora sale de un combo y arranca en el horario habitual de ese paciente, y la repetición es un combo (no repetir, 4, 8, 12, 24 semanas o todo el año).
  - **Cobros:** botones para la deuda completa o una sesión, el medio de pago como botones con el último usado ya elegido, y la nota opcional escondida.
  - **Obra social:** al elegirla en un paciente se completan sola lo que paga y el copago habitual.
- **Ajustes:** cobrar o no la cancelación tardía y la falta sin aviso, firma de los mensajes, obras sociales, copia de seguridad (con aviso si pasaron 15 días o más) y cambio de clave.

## Cómo se calculan los números

- **Cobra una sesión al paciente** si el turno está en *Asistió*, o en *Canceló tarde* / *Faltó* cuando esa opción está activada en Ajustes. *Programado* y *Canceló* no se cobran.
- **Saldo del paciente** = sesiones que se le cobran − pagos registrados. Positivo es deuda, negativo es saldo a favor. Para pacientes de obra social, lo que cobra el paciente es solo su copago.
- **Obra social:** solo las sesiones *Asistió* se le facturan. Lo que debe la obra social es la suma de lo que paga por sesión (por presentar + presentado + débitos).
- **Plata del mes:** *Cobrado* suma los pagos de pacientes y las sesiones que la obra social pagó ese mes. *Facturado* suma sesiones cobradas al paciente más lo facturado a obras sociales. *Proyectado* es facturado más los turnos todavía programados. *Te deben* es solo deuda de pacientes. Ninguno incluye deudas de meses anteriores.
- Cada turno guarda su propio valor. Cambiar el valor del paciente o de la obra social no modifica los turnos ya cargados.

## Qué piden las obras sociales

Armé el módulo a partir de instructivos públicos de prestadores (IOMA, OSPe, OSIAD, OSPACP y otros). No encontré las reglas de OSDE, Swiss Medical ni Galeno para psicólogos, así que por eso cada financiador es configurable. Lo que se repite:

- Orden médica o prescripción y, en general, **autorización previa**.
- **Planilla de asistencia** con firma del paciente y del profesional, y en algunos casos planilla de evolución mensual.
- Facturación **a mes vencido**, con fecha límite de presentación distinta en cada una (por ejemplo del 1 al 10, hasta el 15, o hasta 90 días en IOMA).
- Topes de sesiones por mes o por autorización, y débitos por errores formales.

Antes de usarlo con una obra social conviene confirmar sus fechas y formatos en su instructivo de prestadores. La planilla CSV es una base en formato genérico: cada obra social puede pedir su propio formato o un portal.

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

Para publicar cambios: subir a `main`. GitHub Pages sirve desde la raíz de esa rama. Si se cambia algo que debe verse al instante, subir también el número de versión de la caché en `sw.js` (`consultorio-v5` → `consultorio-v6`).

## Limitaciones conocidas

- La app no emite facturas electrónicas ni se conecta a los portales de las obras sociales: prepara la planilla y el control, y la presentación se hace por el canal de cada una.
- No imprime ni arma la planilla de asistencia para firmar.
- Al editar un turno repetido se cambia solo ese turno, no la serie.
- Eliminar un paciente borra también sus sesiones y cobros: para conservar el historial conviene archivarlo.
- Los datos están en un solo dispositivo: no hay sincronización ni uso en dos teléfonos.
- Después de publicar una versión nueva, el celular puede mostrar la anterior hasta abrir la app una segunda vez (cache primero).

## Pendiente

Ideas a futuro, por prioridad:

1. Planilla de asistencia para firmar y PDF por obra social con el formato que pida cada una.
2. Aviso de "hay una versión nueva" y validación más estricta al restaurar una copia.
3. Recibos en PDF y exportar todo a Excel.
4. Cargar topes y requisitos de las obras sociales más usadas ya preconfigurados.
5. Marcar asistencia y cobrar desde la misma pantalla de Hoy.
6. Historia clínica (requiere pensar bien privacidad y cifrado antes de sumarla).
