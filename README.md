# APP-ENHE v2.7 · Lady Stone Acuerdos Económicos

Versión completa para APP-ENHE.

## Cambios principales

- Añade el módulo **Lady Stone Admin**.
- Control interno de Asociación Musical y Cultural Lady Janis Joplin Stone.
- Separación por proyectos:
  - Ñ Mayúscula
  - Breathless Cover Band
  - Común asociación
- Control de acuerdos económicos completos: caché fijo, extras, mínimo garantizado, porcentajes de taquilla, porcentaje de barra, canon de sala, taquilla gestionada por sala/banda y acuerdos mixtos.
- Control de gastos e ingresos.
- Control de facturas y liquidaciones.
- Resumen económico interno por proyecto.
- Exportación CSV del control Lady Stone.
- Mantiene Google Sheet como fuente principal.
- Mantiene localStorage solo como caché temporal.
- No vende entradas y no emite facturas oficiales: es control interno.

## Apps Script

Usar el archivo separado:

`APP_ENHE_BRIDGE_v2_6_economic_agreements.gs`

No subirlo a GitHub.

Pasos:
1. Sustituir SOLO el bridge activo de Apps Script por el contenido del `.gs`.
2. Guardar.
3. Ejecutar `APP_ENHE_instalar_o_actualizar`.
4. Implementar > Gestionar implementaciones > Editar > Nueva versión > Implementar.
5. Probar `?action=health`.
6. Debe devolver versión `2.6-economic-agreements`.

## GitHub

Subir todo el contenido de este ZIP al repo APP-ENHE, sustituyendo archivos.

No incluye carpeta `apps-script`.

## Prueba

https://enhemayuscula.github.io/APP-ENHE/?v=26economicagreements

Entrar como admin con clave 1929 y abrir:

`Lady Stone`

## Nota operativa

Este módulo es la primera base de administración central. 
Cuando esté estable en Ñ, se podrá replicar la arquitectura a APP-BCB y, si conviene, crear una app central independiente `APP-LADY-STONE`.


## Cambios v2.7

- Renombra el bloque de entradas a **Acuerdo económico / liquidación**.
- Añade selector obligatorio de modelo económico.
- Añade campos de caché fijo, mínimo garantizado, extras, porcentaje de taquilla y porcentaje de barra.
- Calcula neto estimado según modelo.
- Guarda los campos ampliados en Google Sheet mediante el bridge v2.7.


## v2.7

Corrige edición, borrado y control de duplicados en acuerdos económicos Lady Stone.


## Revisión 2.7.3-callback-fix

Paquete completo preparado para subir a GitHub Pages.

Cambios incluidos:
- `index.html` actualizado para cargar todos los recursos con `2.7.3-callback-fix`.
- `js/app.js` actualizado con `findBaseTariff()` para evitar el corte en `saveData()`.
- `js/app.js` actualizado con `appsScriptJSONP()` más estable para respuestas lentas de Apps Script.
- Guardado de conciertos con confirmación visual de envío a Google Sheet.
- `sw.js` actualizado con nuevo nombre de caché para evitar arrastre de archivos antiguos.
