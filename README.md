# APP-ENHE · versión modular

Esta carpeta sustituye al `index.html` monolítico por una estructura más manejable.

## Estructura

- `index.html`: estructura HTML de la app.
- `css/styles.css`: estilos principales.
- `js/assets.js`: rutas de archivos descargables y logo.
- `js/data.js`: datos iniciales de la app.
- `js/app.js`: lógica de CRM, setlist, dossier, presupuestos, importación/exportación y UI.
- `assets/`: logo, dossier PDF, setlist PDF y Excel.

## Subida a GitHub

Sube todos los archivos y carpetas manteniendo esta estructura:

```txt
APP-ENHE/
├─ index.html
├─ css/
│  ├─ styles.css
│  └─ admin-guard.css
├─ js/
│  ├─ admin-guard.js
│  ├─ assets.js
│  ├─ data.js
│  └─ app.js
└─ assets/
   ├─ logo-n-mayuscula.jpg
   ├─ N_Mayuscula_dossier_comercial_FINAL_pulido.pdf
   ├─ Setlist_N_Bloques_Estrategicos.pdf
   └─ Ene_Mayuscula_CRM_MAESTRO_UNIFICADO_v2_columnas_distintas.xlsx
```

> Importante: el `index.html` mantiene la llamada existente a `css/admin-guard.css` y `js/admin-guard.js`.
> Si esos archivos ya estaban en el repo, no los borres. Si no estaban, la app seguirá funcionando salvo la protección/admin guard.

## Cambio aplicado

No se ha reescrito funcionalidad a propósito. Se ha separado el monolito en archivos para que sea editable y mantenible.
