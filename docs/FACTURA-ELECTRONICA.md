# Factura electrónica

## Qué hace hoy (modo asistido)

1. En **Plata → Comprobantes** aparecen los cobros sin comprobante, por paciente, y las sesiones presentadas o cobradas a cada obra social, por mes.
2. "Facturar" arma los datos tal como los pide ARCA en *Comprobantes en línea* (tipo según la condición fiscal, período, condición de IVA del receptor, descripción, importe), con botones para copiar.
3. Se emite en ARCA y se anota el número, el CAE y su vencimiento. Los cobros quedan vinculados al comprobante.
4. Si se cargó el tope anual de la categoría, la app muestra cuánto va en los últimos 12 meses.

No emite por su cuenta: ARCA exige un certificado digital por contribuyente y sus servicios no se pueden llamar desde un navegador.

## Conector para emisión real (preparado, sin implementar)

El punto de enganche es `FAC.provider` en `modules/plata.js`. Un proveedor es un objeto con:

```js
FAC.provider = {
  nombre: 'Mi proveedor',
  // recibe el comprobante preparado y devuelve {num, cae, caeV}
  async emitir(comprobante) { ... }
};
```

Para implementarlo hace falta un servidor (por ejemplo una Edge Function de Supabase) que guarde el certificado y la clave privada fiscal de cada profesional y llame a WSFEv1 de ARCA, o a un servicio intermediario pago. Eso implica custodiar credenciales fiscales de terceros: conviene resolverlo con asesoramiento contable y legal antes de ofrecerlo.
