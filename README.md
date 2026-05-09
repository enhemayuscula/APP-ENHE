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


## v1.2 · Navegación, carteles y estilo

Cambios:
- Al pulsar una opción del menú, la app se desplaza automáticamente a la sección activa.
- Estilo visual reforzado en negro, granate y dorado, alineado con el cartel de Ñ Mayúscula.
- Fondo principal con imagen de escenario.
- Módulo de carteles en Conciertos: próximos y pasados.
- Ficha de concierto ampliada con cartel, miniatura y texto público.
- Cartel inicial incluido: Sala Cien x Cien · 16 junio · 22:00 h.
- Caché PWA actualizado a v1.2 para forzar renovación de archivos.


## APP-ENHE v1.3 · Ensayos y asistencia

Cambios aplicados:
- Nuevo menú **Ensayos**.
- Calendario de ensayos con fecha, horario, lugar, objetivo, estado y notas.
- Selección de temas por ensayo:
  - marcar todo el repertorio,
  - usar setlist actual,
  - marcar temas individuales,
  - limpiar selección.
- Control de asistencia al ensayo por miembro de la banda.
- Panel de confirmación de asistencia a concierto:
  - en modo usuario permite copiar mensaje para WhatsApp,
  - en modo administrador permite guardar la confirmación recibida.
- En modo usuario se ocultan los controles de administrador para que no induzcan a error.

Limitación importante:
APP-ENHE sigue siendo una app estática en GitHub Pages. Los datos que se guardan se guardan en el navegador local. Para asistencia compartida en tiempo real haría falta una base de datos o un formulario externo conectado a Google Sheets, Supabase, Firebase o similar.


## v1.4 · Google Sheet primero

- La fuente de verdad del CRM vuelve a ser Google Sheet maestro.
- La app intenta sincronizar desde `https://docs.google.com/spreadsheets/d/1mrffAdGxfzRL602XHD4Uw-EKiYBgZ4PgLuVuOFPxEGU`.
- `localStorage` queda como caché del navegador, no como base principal.
- Se corrige formación: Miguel = voz; Jeffrey = bajo.
- Si la hoja no es pública/published CSV o no hay Apps Script configurado, la app mostrará la última caché local y avisará.


## APP-ENHE v1.5 · Google Sheet endpoint conectado

Fuente principal de datos:

- Google Sheet maestro: `1mrffAdGxfzRL602XHD4Uw-EKiYBgZ4PgLuVuOFPxEGU`
- Apps Script `/exec`: `https://script.google.com/macros/s/AKfycbwMPx0moS9-P_RI6s8K4q1aFA7ZaiAvtwpq3IKnoph-MHVTTzQzC4wHNNfo9SIQDe22fQ/exec`

La app debe usar Google Sheet como fuente principal. `localStorage` queda como caché temporal del navegador, no como base maestra.

Botón principal de sincronización:

- `Actualizar todo desde Google Sheet`

Datos que intenta sincronizar:

- CRM
- CONCIERTOS
- ENSAYOS
- CANCIONES
- SETLIST
- Formación

Formación corregida:

- Miguel — Voz
- Esther — Voz
- Lorenzo — Guitarra solista
- Oscar — Guitarra rítmica
- Jeffrey — Bajo
- Pepe — Batería
