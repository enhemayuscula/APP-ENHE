# APP-ENHE v2.5 · Lady Stone Admin

Versión completa para APP-ENHE.

## Cambios principales

- Añade el módulo **Lady Stone Admin**.
- Control interno de Asociación Musical y Cultural Lady Janis Joplin Stone.
- Separación por proyectos:
  - Ñ Mayúscula
  - Breathless Cover Band
  - Común asociación
- Control de entradas / taquilla / liquidación.
- Control de gastos e ingresos.
- Control de facturas y liquidaciones.
- Resumen económico interno por proyecto.
- Exportación CSV del control Lady Stone.
- Mantiene Google Sheet como fuente principal.
- Mantiene localStorage solo como caché temporal.
- No vende entradas y no emite facturas oficiales: es control interno.

## Apps Script

Usar el archivo separado:

`APP_ENHE_BRIDGE_v2_5_lady_stone_admin.gs`

No subirlo a GitHub.

Pasos:
1. Sustituir SOLO el bridge activo de Apps Script por el contenido del `.gs`.
2. Guardar.
3. Ejecutar `APP_ENHE_instalar_o_actualizar`.
4. Implementar > Gestionar implementaciones > Editar > Nueva versión > Implementar.
5. Probar `?action=health`.
6. Debe devolver versión `2.5-lady-stone-admin`.

## GitHub

Subir todo el contenido de este ZIP al repo APP-ENHE, sustituyendo archivos.

No incluye carpeta `apps-script`.

## Prueba

https://enhemayuscula.github.io/APP-ENHE/?v=25ladystone

Entrar como admin con clave 1929 y abrir:

`Lady Stone`

## Nota operativa

Este módulo es la primera base de administración central. 
Cuando esté estable en Ñ, se podrá replicar la arquitectura a APP-BCB y, si conviene, crear una app central independiente `APP-LADY-STONE`.
