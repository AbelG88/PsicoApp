# Pruebas

Corren la app real en Chrome sin interfaz (`/usr/bin/google-chrome`).

```
cd tests && npm install
CX_PRIV=/ruta/a/consultorio-clave-privada.json npm run offline   # flujo completo sin conexión
npm run migracion                                                # abrir datos de la versión anterior
CX_EMAIL=... CX_PASS=... npm run online                          # dos dispositivos contra Supabase
```

La prueba online necesita un usuario de prueba con contraseña creado a mano en Supabase, y lo borra al terminar.
