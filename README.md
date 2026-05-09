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



## Roles de acceso

- **Usuario**: modo por defecto. Permite consultar la app sin editar, importar, exportar ni hacer backup.
- **Administrador**: pulsar `Acceso admin` e introducir la clave configurada para activar edición, importación, exportación y backup en ese navegador.

Nota: APP-ENHE está publicada en GitHub Pages como app estática. Este control bloquea la interfaz y evita cambios accidentales, pero no equivale a un sistema de usuarios con servidor.


## Parche repertorio enriquecido v4.1

Cambios aplicados:
- Se reconstruye el módulo Canciones/Repertorio con los 26 temas del setlist estratégico.
- Se añaden campos de trabajo por canción: duración directo, duración original, tono original, tono actual, tono de ensayo, tonos propuestos para Miguel, Esther y Lorenzo, capo, BPM, estructura, letra/acordes/tablatura, enlaces Spotify/YouTube/acordes y fuente de validación.
- Se incorpora la playlist general de Spotify aportada para Ñ Mayúscula.
- Se añade carga de URLs por lote para pegar referencias de Spotify, YouTube o acordes por tema.
- La migración respeta datos ya editados en localStorage y completa campos vacíos desde los datos iniciales.

Nota: las tonalidades se dejan como pendientes de reconstrucción/validación para no introducir datos no confirmados. Las duraciones de directo aparecen como provisionales y deben validarse en ensayo.


## Parche 4.2 · Tonalidades reconstruidas

- Añadidas tonalidades de referencia por canción.
- Añadidas propuestas de ensayo para Miguel, Esther y Lorenzo.
- Añadidos enlaces de búsqueda Spotify/YouTube por tema.
- Añadido enlace externo de acordes por tema cuando existe.
- La migración rellena campos vacíos o placeholders antiguos sin borrar ediciones reales.

Importante: los tonos quedan como reconstrucción provisional. Deben validarse en ensayo antes de tratarlos como tono definitivo de Ñ Mayúscula.


## Versión v1.1 · PWA instalable

Esta versión permite instalar APP-ENHE como app en móvil desde GitHub Pages.

Archivos añadidos:
- `manifest.json`
- `sw.js`
- `icons/icon-192.png`
- `icons/icon-512.png`
- `icons/maskable-512.png`
- `icons/apple-touch-icon.png`

Uso recomendado:
1. Abrir `https://enhemayuscula.github.io/APP-ENHE/`
2. En Android: Chrome → menú de tres puntos → Instalar app / Añadir a pantalla de inicio.
3. En iPhone: Safari → compartir → Añadir a pantalla de inicio.

La app entra por defecto en modo usuario / solo lectura. El modo administrador se activa con la clave interna definida en la app.
