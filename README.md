# PsicoApp

App para el consultorio: turnos, cobros y deudas. Funciona en el celular, sin internet y sin cuentas.

**Usarla:** https://abelg88.github.io/PsicoApp/

## Qué hace

- **Agenda:** turnos por día con estado (programado, asistió, canceló, canceló tarde, faltó). Se pueden repetir semanalmente. Recordatorio por WhatsApp en un toque.
- **Pacientes:** valor por sesión, obra social o particular, teléfono, notas administrativas y saldo.
- **Cobros y deudas:** registro de pagos (efectivo, transferencia, Mercado Pago), deuda por paciente y total, aviso de deuda por WhatsApp.
- **Mes:** cobrado, facturado, proyectado y cantidad de sesiones por estado.
- **Ajustes:** elegir si se cobra la cancelación tardía y la falta sin aviso, firma de los mensajes, copia de seguridad, cambio de clave.

## Instalarla en el celular

1. Abrir el link en Chrome (Android) o Safari (iPhone).
2. Menú del navegador → **Agregar a pantalla de inicio**.
3. La primera vez pide crear una clave (mínimo 6 caracteres).

## Privacidad y datos

- Los datos se guardan **solo en el teléfono**, cifrados con la clave (AES-GCM, clave derivada con PBKDF2). No hay servidor ni base de datos.
- Este repositorio contiene únicamente el código. Nunca hay datos de pacientes acá.
- La app se bloquea sola al salir a otra aplicación.
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

Para publicar cambios: subir a `main`. GitHub Pages sirve desde la raíz de esa rama. Si se cambia algo que debe verse al instante, subir también el número de versión de la caché en `sw.js` (`consultorio-v1` → `consultorio-v2`).

## Pendiente

- Recibos en PDF
- Historia clínica
- Control de obras sociales
- Exportar a Excel
