# PsicoApp

App para el consultorio: turnos, cobros y deudas. Funciona en el celular, sin internet y sin cuentas.

**Usarla:** https://abelg88.github.io/PsicoApp/

## Versión 2: una suite por módulos

La app sigue siendo la misma de tres pestañas, y ahora suma módulos que se prenden y apagan desde **Panel** (el engranaje):

- **Se adapta a la profesión.** Al empezar se elige entre psicología, psiquiatría, medicina, fonoaudiología, kinesiología, nutrición, terapia ocupacional, psicopedagogía u otra. Cambian las secciones de la historia clínica, las frases frecuentes, las prestaciones y hasta el vocabulario ("sesión" o "consulta").
- **Historia clínica de carga rápida.** Desde Hoy, cada turno atendido tiene un botón **+ Nota**: se abre el cuadro listo para escribir o dictar, con frases frecuentes a un toque, "Copiar la anterior" y la nota previa a la vista. Se guarda sola. Cada nota se puede corregir 24 horas; después queda firmada con una huella encadenada y solo admite aclaraciones. Incluye ficha del paciente, consentimientos informados para imprimir, constancia de asistencia y la copia completa para entregar al paciente.
- **Facturación y reportes.** Factura asistida para ARCA (prepara los datos, se emite en ARCA y se guarda número y CAE), control del tope anual, recibos, gastos del consultorio, reportes por año y exportación a Excel. Ver `docs/FACTURA-ELECTRONICA.md`.
- **Panel de control.** Datos del consultorio, prestaciones con duración y valor, **aumento de aranceles por porcentaje** (con deshacer), obras sociales, montos y módulos.
- **Agenda avanzada.** Recordatorios en tanda por WhatsApp para el día siguiente, prestaciones como botones al agendar, aviso de turnos superpuestos, videollamada por paciente y cancelación por vacaciones.
- **Dos modos.** Sin conexión (todo cifrado en el dispositivo, con copia de seguridad que ahora incluye la historia clínica) y **online** (cuenta de Google, Facebook o email, con los datos cifrados en una base de datos y sincronizados entre dispositivos). Ver `docs/MODO-ONLINE.md`.
- **Legales y privacidad.** Términos y política de privacidad con aceptación, guía de cumplimiento (Ley 26.529 y Ley 25.326), aviso de privacidad para pacientes, entrega de datos a pedido del paciente, registro de actividad y borrado total.
- **Aportes.** Cada 30 días la app invita a colaborar. Se desactiva con un código firmado que se genera con `tools/codigos.html` y la clave privada del desarrollador (que no está en el repositorio).

## Qué hace

Tres pestañas (**Hoy**, **Pacientes**, **Plata**) y un engranaje de Ajustes.

- **Hoy:** la semana siempre a la vista. Una tira de lunes a domingo muestra con puntos qué días tienen turnos; se toca un día, se desliza a los costados para pasar de día o se usan las flechas para cambiar de semana. Un toque en el círculo marca que asistió, y si el paciente debe plata aparece **Cobrar $X** en la misma fila: registra el cobro con el último medio usado y se puede deshacer. Tocar el turno abre la hoja para cambiar estado, fecha, hora, valor y autorización, recordar por WhatsApp o borrarlo.
- **Vista de mes:** con "Ver mes" el calendario muestra cada día con un punto por turno: asistió, programado, sin cerrar, canceló, faltó. Al pie, el resumen del mes. Tocar un día muestra sus turnos abajo.
- **Repetir sin esfuerzo:**
  - Al crear un turno se elige el paciente con un botón (aparecen los que más atendés) y la repetición con un combo: cada semana o cada 2 semanas, con distintas cantidades. Recuerda la última que usó cada paciente.
  - **Por renovar:** cuando una serie está por terminar o terminó hace poco, aparece un aviso con el botón **Renovar 4**, que agenda cuatro turnos más con el mismo horario y valores.
  - **Agendar de nuevo:** desde un turno, un botón crea el de la semana que viene, sin completar nada.
  - Si cambiás la hora, el día o el valor de un turno que es parte de una serie, la app pregunta si aplica el cambio a los siguientes.
  - Casi todo lo que agenda avisa con "Deshacer" por unos segundos. Se pueden borrar de a uno o con todos los siguientes. Los turnos pasados sin cerrar se marcan y se avisa.
- **Pacientes:** buscador (nombre, obra social, teléfono), saldo, historial de sesiones y cobros, aviso de deuda por WhatsApp. Se pueden archivar: se ocultan de las listas y de los turnos nuevos, pero conservan historial y deuda.
- **Plata:** cobrado, facturado, proyectado y deuda de pacientes del mes, y el estado de cada obra social.
- **Reporte de deudas:** en Plata → "Reporte y reclamos". Filtra por antigüedad (+15, +30, +60, +90 días), monto mínimo, obra social o particulares, y oculta a quienes ya avisaste en la última semana. Los pagos se aplican a las sesiones más viejas primero, así que muestra desde cuándo debe cada uno. Cada fila arma un mensaje con el detalle de las sesiones pendientes y tu alias, en tres tonos (amable, recordatorio y formal con oferta de cuotas) que se eligen solos según la antigüedad o a mano. Registra cuándo y cuántas veces avisaste. Se puede copiar el mensaje y descargar la lista en CSV.
- **Obras sociales y prepagas** (lo que más cambió):
  - Cada una tiene valor por sesión, código de práctica, día límite de presentación, plazo de pago y si exige autorización.
  - Cada paciente tiene su obra social, nº de afiliado, lo que paga la obra social, el copago propio y un tope de sesiones por mes.
  - Cada sesión asistida se sigue como **sin presentar → presentada → cobrada**, o **débito**.
  - Antes de presentar avisa de autorizaciones faltantes, afiliados sin número, sesiones que pasan el tope y el vencimiento del mes.
  - Genera la **planilla de asistencia para firmar** (imprimir o guardar como PDF) con tus datos, el afiliado, las fechas y las firmas, en una hoja por paciente o en un listado del mes. Las columnas se configuran por obra social, y se puede guardar el link al modelo oficial si exigen el suyo.
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
- Las notas del paciente son para datos administrativos. La información clínica va en la Historia clínica, que se guarda aparte, cifrada registro por registro.

## Para desarrollo

Es una PWA estática: HTML, CSS y JavaScript sin dependencias ni paso de build.

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la app |
| `sw.js` | Service worker (funcionamiento sin internet) |
| `manifest.webmanifest` | Datos para instalarla como app |
| `icon.svg`, `icon-192.png`, `icon-512.png` | Íconos |
| `modules/kernel.js` | Núcleo de módulos: registro, profesiones, bóveda cifrada (IndexedDB), páginas y copia completa |
| `modules/panel.js`, `hc.js`, `plata.js`, `agenda.js`, `legal.js`, `don.js`, `nube.js` | Un archivo por módulo |
| `vendor/supabase.js` | Cliente de Supabase (licencia MIT), solo se carga en modo online |
| `tools/codigos.html` | Generador de códigos de aporte (pide la clave privada) |
| `supabase/schema.sql`, `docs/`, `tests/` | Esquema de la base, guías y pruebas de punta a punta |

Para probar en local: `python3 -m http.server` en la carpeta y abrir `http://localhost:8000`.

Los módulos extienden `index.html` sin tocarlo: envuelven `render`, `save`, `unlock` y `lock`, escuchan sus propias acciones (`data-act="x:módulo:acción"`) y agregan sus filas a las pantallas después de dibujarlas. Los datos livianos de los módulos viven en `S.x`; la historia clínica, en IndexedDB (`consultorio_vault`), cifrada con una clave propia guardada dentro de `S.x`.

Datos: todo vive en un único objeto `{patients, sessions, payments, settings}` que se cifra completo y se guarda en `localStorage` (clave `consultorio_v1`, formato `v:1`). La copia de seguridad es ese mismo contenido descargado como `.json`.

Para publicar cambios: subir a `main`. GitHub Pages sirve desde la raíz de esa rama. Si se cambia algo que debe verse al instante, subir también el número de versión de la caché en `sw.js` (`consultorio-v10` → `consultorio-v10`).

## Prepagas precargadas: qué se sabe y qué no

OSDE, Swiss Medical, Galeno, SanCor Salud y Medicus están como atajos ("Cargar rápido" al crear una obra social, o "Agregar con un toque" al cargar un paciente). **Solo precargan el nombre y una nota:** busqué en internet el instructivo de facturación para psicólogos de cada una y no encontré ninguno público, así que la app no inventa reglas. Lo poco que sí hay:

- **OSDE:** sistema de turnos para profesionales de salud mental que valida el nº de afiliado.
- **Swiss Medical:** portal de prestadores con usuario y contraseña; las autorizaciones se tramitan en "Trámite Centro de Atención Prestadores".
- **SanCor Salud:** "Gestión de Autorización y Facturación online" desde su sitio Autogestión (según el manual de un colegio profesional, no de psicología).
- **Galeno y Medicus:** nada público encontrado.

Cada una queda marcada como **"Requisitos sin confirmar"** hasta que completes valor, tope, autorización y fecha límite. En Editar, el botón **"Copiar las preguntas"** arma el mensaje para pedirle a Prestadores lo que hace falta: autorización, sesiones reconocidas, valor y copago, fecha límite y canal de presentación, planilla, factura y plazo de pago. Una resolución del Ministerio de Salud sobre prestaciones de psicología menciona topes de sesiones y firmas en la facturación, pero hay que verificar que cada prepaga la aplique.

## Planilla de asistencia: qué exigen

El formato **cambia según la obra social** y en la mayoría **es obligatoria**. Según instructivos públicos: IOMA pide la planilla diaria con firma del profesional y del afiliado (y hay que cargar la firmada en la facturación digital); OSPACA no autoriza facturas sin su planilla de asistencia, con sus propios modelos; IAPOS tiene planillas por módulo con fecha, firma y sello, firma del afiliado, aclaración y DNI; OSIAD pide una constancia mensual antes del día 10; y el marco nacional de salud mental prevé una planilla inicial y una de evolución mensual. No hay un formato único, así que la planilla de la app es genérica y configurable, y conviene verificar el modelo vigente en el instructivo de cada obra social.

## Limitaciones conocidas

- La planilla de la app es genérica: si una obra social exige su modelo exacto, hay que usar el suyo. La app tampoco emite facturas electrónicas ni se conecta a sus portales: prepara la planilla y el control, y la presentación se hace por el canal de cada una.
- Cuando se edita un turno de una serie, el cambio a los siguientes se aplica solo si se confirma.
- Eliminar un paciente borra también sus sesiones y cobros: para conservar el historial conviene archivarlo.
- Sin el modo online, los datos están en un solo dispositivo. Con el modo online se sincronizan, pero sigue sin haber recuperación de clave.
- La historia clínica usa firma electrónica (clave y huella de control), no firma digital con certificado.
- Los textos legales se redactaron sin un estudio jurídico: conviene hacerlos revisar antes de vender la app.
- Después de publicar una versión nueva, el celular puede mostrar la anterior hasta abrir la app una segunda vez (cache primero).

## Pendiente

Ideas a futuro, por prioridad:

1. Cargar los requisitos reales de cada prepaga a medida que se confirmen, y sus modelos de planilla (hoy es un formato genérico configurable).
2. Aviso de "hay una versión nueva" y validación más estricta al restaurar una copia.
4. Cargar topes y requisitos de las obras sociales más usadas ya preconfigurados.
5. Planilla de evolución mensual y planilla inicial de tratamiento.
6. Emisión real de facturas, adjuntos en la historia clínica, turnos online para pacientes y recuperación de clave.
