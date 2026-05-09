/**
 * Ñ MAYÚSCULA — BACKEND GRUPO V5 / TONALIDADES + DURACIONES
 * SOLO para el Apps Script de la hoja "Ñ Mayúscula - Gestión Grupo".
 * NO pegar en el Apps Script del CRM comercial.
 */

const GRUPO_SHEETS = {
  miembros: 'MIEMBROS',
  pagos: 'PAGOS_LOCAL',
  ensayos: 'ENSAYOS',
  conciertos: 'CONCIERTOS',
  repertorio: 'REPERTORIO',
  setlists: 'SETLISTS',
  config: 'CONFIG_GRUPO'
};

const GRUPO_MIEMBROS_DEFAULT = [
  ['jeff', 'Jeff', 'Bajista', 'Bajo', '', 'Sí'],
  ['miguel', 'Miguel', 'Vocalista', 'Voz', '', 'Sí'],
  ['esther', 'Esther', 'Vocalista', 'Voz', '', 'Sí'],
  ['pepe', 'Pepe', 'Baterista', 'Batería', '', 'Sí'],
  ['oscar', 'Óscar', 'Guitarrista', 'Guitarra', '', 'Sí'],
  ['lorenzo', 'Lorenzo', 'Guitarrista', 'Guitarra', '', 'Sí']
];

const GRUPO_REPERTORIO_V5 = [
  ["el-ritmo-del-garaje", 1, "Bloque 1 · ARRANQUE MUY ARRIBA", "El Ritmo del Garaje", "", "Ambos", "En ensayo", "G / Sol", "G / Sol", "Mantener", "4:00", "", "", "Cómodo y reconocible para voces compartidas."],
  ["groenlandia", 2, "Bloque 1 · ARRANQUE MUY ARRIBA", "Groenlandia", "", "Miguel", "En ensayo", "C / Do", "C / Do", "Mantener", "4:00", "", "", "Mantener tono original."],
  ["voy-en-un-coche", 3, "Bloque 1 · ARRANQUE MUY ARRIBA", "Voy en Un Coche", "", "Esther", "En ensayo", "A / La", "A / La", "Mantener", "3:30", "", "", "Tema ya femenino; revisar comodidad real en ensayo."],
  ["rojitas-las-orejas", 4, "Bloque 1 · ARRANQUE MUY ARRIBA", "Rojitas Las Orejas", "", "Miguel", "En ensayo", "Em / Mi menor", "Em / Mi menor", "Mantener", "3:45", "", "", "Mantener tono original."],
  ["lobo-hombre-en-paris", 5, "Bloque 1 · ARRANQUE MUY ARRIBA", "Lobo Hombre en París", "", "Miguel", "En ensayo", "A / La", "A / La", "Mantener", "4:10", "", "", "Revisar altura en estribillo y final."],
  ["perlas-ensangrentadas", 6, "Bloque 1 · ARRANQUE MUY ARRIBA", "Perlas Ensangrentadas", "", "Ambos", "En ensayo", "A / La", "A / La", "Mantener", "3:45", "", "", "Funciona como tema compartido."],
  ["la-chica-de-ayer", 7, "Bloque 2 · ASENTAMIENTO DEL SHOW", "La Chica de Ayer", "", "Miguel", "En ensayo", "G / Sol", "G / Sol", "Mantener", "4:00", "", "", "Mantener tono original."],
  ["pongamos-que-hablo-de-madrid", 8, "Bloque 2 · ASENTAMIENTO DEL SHOW", "Pongamos Que Hablo de Madrid", "", "Esther", "En ensayo", "D / Re", "F / Fa", "Subir 1 tono y medio", "4:00", "", "", "Probar primero en F. Si queda alta, alternativa segura: E / Mi."],
  ["heroe-de-leyenda", 9, "Bloque 2 · ASENTAMIENTO DEL SHOW", "Héroe de Leyenda", "", "Miguel", "En ensayo", "Em / Mi menor", "Em / Mi menor", "Mantener", "4:50", "", "", "Revisar resistencia vocal; tema exigente si va muy arriba de energía."],
  ["que-hace-una-chica-como-tu", 10, "Bloque 2 · ASENTAMIENTO DEL SHOW", "Qué Hace Una Chica Como tú…", "", "Miguel", "En ensayo", "C / Do", "C / Do", "Mantener", "4:00", "", "", "Mantener tono original."],
  ["dejame", 11, "Bloque 2 · ASENTAMIENTO DEL SHOW", "Déjame", "", "Esther", "En ensayo", "G / Sol", "A / La", "Subir 1 tono", "3:50", "", "", "Probar en A. Si pierde cuerpo o queda demasiado brillante, volver a G."],
  ["no-puedo-vivir-sin-ti", 12, "Bloque 2 · ASENTAMIENTO DEL SHOW", "No Puedo Vivir Sin Ti", "", "Miguel", "En ensayo", "C / Do", "C / Do", "Mantener", "4:00", "", "", "Mantener tono original."],
  ["maneras-de-vivir", 13, "Bloque 2 · ASENTAMIENTO DEL SHOW", "Maneras de Vivir", "", "Ambos", "En ensayo", "E / Mi", "E / Mi", "Mantener", "4:15", "", "", "Buen tono de banda/guitarras y voces compartidas."],
  ["mil-calles-llevan-hacia-ti", 14, "Bloque 3 · DESARROLLO / SUBIDA", "Mil Calles Llevan Hacia Ti", "", "Miguel", "En ensayo", "A / La", "A / La", "Mantener", "4:00", "", "", "Mantener tono original."],
  ["cadillac-solitario", 15, "Bloque 3 · DESARROLLO / SUBIDA", "Cadillac Solitario", "", "Miguel", "En ensayo", "G / Sol", "G / Sol", "Mantener", "5:15", "", "", "Mantener tono original."],
  ["porque-te-vas-lilith", 16, "Bloque 3 · DESARROLLO / SUBIDA", "Porque Te Vas - Lilith", "", "Esther", "En ensayo", "G#m / Sol# menor", "Am / La menor", "Subir medio tono", "4:00", "", "", "Más práctico para directo y muy cercano al original de referencia."],
  ["flaca", 17, "Bloque 3 · DESARROLLO / SUBIDA", "Flaca", "", "Miguel", "En ensayo", "G / Sol", "G / Sol", "Mantener", "4:05", "", "", "Mantener tono original."],
  ["mueve-tus-caderas", 18, "Bloque 3 · DESARROLLO / SUBIDA", "Mueve Tus Caderas", "", "Lorenzo", "En ensayo", "D / Re", "D / Re", "Mantener", "3:40", "", "", "Mantener tono original para Lorenzo."],
  ["carolina", 19, "Bloque 4 · RECTA FINAL EN ALTO", "Carolina", "", "Miguel", "En ensayo", "G / Sol", "G / Sol", "Mantener", "3:45", "", "", "Mantener tono original."],
  ["el-calor-del-amor-en-un-bar", 20, "Bloque 4 · RECTA FINAL EN ALTO", "El Calor del Amor en un Bar", "", "Miguel", "En ensayo", "Em / Mi menor", "Em / Mi menor", "Mantener", "4:00", "", "", "Mantener tono original."],
  ["whisky-barato", 21, "Bloque 4 · RECTA FINAL EN ALTO", "Whisky Barato", "", "Esther", "En ensayo", "G / Sol", "A / La", "Subir 1 tono", "4:15", "", "", "Probar en A. Si queda demasiado brillante, dejar en G."],
  ["escuela-de-calor", 22, "Bloque 4 · RECTA FINAL EN ALTO", "Escuela de Calor", "", "Miguel", "En ensayo", "D / Re", "D / Re", "Mantener", "4:10", "", "", "Mantener tono original."],
  ["bailare-sobre-tu-tumba-extended", 23, "Bloque 4 · RECTA FINAL EN ALTO", "Bailaré Sobre Tu Tumba (Extended)", "", "Miguel", "En ensayo", "F / Fa", "F / Fa", "Mantener / revisar", "6:00", "", "", "Mantener de momento. Si molesta en guitarra o voz, probar E / Mi."],
  ["ni-tu-ni-nadie", 24, "Bloque 5 · CIERRE OBLIGATORIO", "Ni tú ni Nadie", "", "Esther", "En ensayo", "G / Sol → A / La", "G / Sol → A / La", "Mantener modulación", "4:10", "", "", "Confirmar si se mantiene la subida final. Si se simplifica, dejar todo en G."],
  ["quiero-besarte", 25, "Bloque 5 · CIERRE OBLIGATORIO", "Quiero Besarte", "", "Miguel", "En ensayo", "C / Do", "C / Do", "Mantener", "3:50", "", "", "Mantener tono original."],
  ["enamorado-de-la-moda-juvenil", 26, "Bloque 5 · CIERRE OBLIGATORIO", "Enamorado de la Moda Juvenil", "", "Ambos", "En ensayo", "E / Mi", "E / Mi", "Mantener", "4:10", "", "", "Mantener tono original para cierre compartido."]
];

const GRUPO_SETLIST_V5 = [
  'setlist-repartido-bloques-v2-enhe',
  'Ñ Mayúscula · Setlist repartido por bloques v2',
  'Sala',
  "[\"el-ritmo-del-garaje\", \"groenlandia\", \"voy-en-un-coche\", \"rojitas-las-orejas\", \"lobo-hombre-en-paris\", \"perlas-ensangrentadas\", \"la-chica-de-ayer\", \"pongamos-que-hablo-de-madrid\", \"heroe-de-leyenda\", \"que-hace-una-chica-como-tu\", \"dejame\", \"no-puedo-vivir-sin-ti\", \"maneras-de-vivir\", \"mil-calles-llevan-hacia-ti\", \"cadillac-solitario\", \"porque-te-vas-lilith\", \"flaca\", \"mueve-tus-caderas\", \"carolina\", \"el-calor-del-amor-en-un-bar\", \"whisky-barato\", \"escuela-de-calor\", \"bailare-sobre-tu-tumba-extended\", \"ni-tu-ni-nadie\", \"quiero-besarte\", \"enamorado-de-la-moda-juvenil\"]",
  'Música estimada: 1:47:25 · Transiciones y presentación: 16:30 · Duración total aprox.: 2:03:55. Cierre exacto: Ni tú ni nadie → Quiero besarte → Enamorado de la moda juvenil.',
  new Date()
];

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').trim();
  if (action.indexOf('grupo') === 0) return GRUPO_API_(e);
  return GRUPO_JSON_({ ok: true, message: 'Backend grupo V5 activo' });
}

function GRUPO_API_(e) {
  try {
    const p = e.parameter || {};
    const action = String(p.action || '').trim();

    if (action === 'grupoInit') { GRUPO_PREPARAR_SHEETS(); return GRUPO_JSON_({ ok: true, message: 'Hojas preparadas', data: GRUPO_DATA_() }); }
    GRUPO_ASEGURAR_SHEETS_();

    if (action === 'grupoData') return GRUPO_JSON_({ ok: true, data: GRUPO_DATA_() });
    if (action === 'grupoResetRepertorioEnhe' || action === 'grupoResetTonalidadesEnhe' || action === 'grupoResetDuracionesEnhe') { GRUPO_REEMPLAZAR_REPERTORIO_V5(); return GRUPO_JSON_({ ok: true, message: 'Repertorio V5 reemplazado', data: GRUPO_DATA_() }); }
    if (action === 'grupoSaveMember') { GRUPO_SAVE_MEMBER_(p); return GRUPO_JSON_({ ok: true, message: 'Miembro guardado', data: GRUPO_DATA_() }); }
    if (action === 'grupoSavePayment') { GRUPO_SAVE_PAYMENT_(p); return GRUPO_JSON_({ ok: true, message: 'Pago guardado', data: GRUPO_DATA_() }); }
    if (action === 'grupoSaveEvent') { GRUPO_SAVE_EVENT_(p); return GRUPO_JSON_({ ok: true, message: 'Evento guardado', data: GRUPO_DATA_() }); }
    if (action === 'grupoSaveSong') { GRUPO_SAVE_SONG_(p); return GRUPO_JSON_({ ok: true, message: 'Canción guardada', data: GRUPO_DATA_() }); }
    if (action === 'grupoDeleteSong') { GRUPO_DELETE_ROW_BY_ID_(GRUPO_SHEETS.repertorio, p.id); return GRUPO_JSON_({ ok: true, message: 'Canción eliminada', data: GRUPO_DATA_() }); }
    if (action === 'grupoSaveSetlist') { GRUPO_SAVE_SETLIST_(p); return GRUPO_JSON_({ ok: true, message: 'Setlist guardado', data: GRUPO_DATA_() }); }
    if (action === 'grupoDeleteSetlist') { GRUPO_DELETE_ROW_BY_ID_(GRUPO_SHEETS.setlists, p.id); return GRUPO_JSON_({ ok: true, message: 'Setlist eliminado', data: GRUPO_DATA_() }); }

    return GRUPO_JSON_({ ok: false, error: 'Acción no reconocida: ' + action });
  } catch (err) {
    return GRUPO_JSON_({ ok: false, error: err.message, stack: String(err.stack || '') });
  }
}

function GRUPO_PREPARAR_SHEETS() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  GRUPO_PREP_(ss, GRUPO_SHEETS.miembros, ['ID', 'Nombre', 'Rol', 'Instrumento', 'Foto URL', 'Activo'], GRUPO_MIEMBROS_DEFAULT);
  GRUPO_PREP_(ss, GRUPO_SHEETS.pagos, ['Mes', 'ID Miembro', 'Nombre', 'Cuota', 'Pagado', 'Fecha pago', 'Última actualización', 'Notas'], []);
  GRUPO_PREP_(ss, GRUPO_SHEETS.ensayos, ['ID', 'Fecha', 'Hora', 'Lugar', 'Temas', 'Notas', 'Estado', 'Última actualización'], []);
  GRUPO_PREP_(ss, GRUPO_SHEETS.conciertos, ['ID', 'Fecha', 'Hora', 'Sala / Evento', 'Dirección', 'Llegada / Prueba', 'Notas', 'Estado', 'Caché', 'Última actualización'], []);
  GRUPO_PREP_(ss, GRUPO_SHEETS.repertorio, ['ID', '#', 'Bloque', 'Canción', 'Artista', 'Cantante', 'Estado', 'Tono original', 'Tono Ñ recomendado', 'Ajuste', 'Duración', 'Enlace', 'Letra / Acordes', 'Notas'], GRUPO_REPERTORIO_V5);
  GRUPO_PREP_(ss, GRUPO_SHEETS.setlists, ['ID', 'Nombre', 'Tipo', 'Canciones', 'Notas', 'Última actualización'], [GRUPO_SETLIST_V5]);

  const config = GRUPO_GET_OR_CREATE_(ss, GRUPO_SHEETS.config);
  if (config.getLastRow() === 0) {
    config.getRange(1, 1, 5, 2).setValues([
      ['Clave', 'Valor'],
      ['local_mensual', '217'],
      ['grupo_whatsapp', 'https://chat.whatsapp.com/DopDnMsh4qR4WPSNrNVNHH'],
      ['nombre_grupo', 'Ñ Mayúscula'],
      ['ultima_preparacion', new Date()]
    ]);
  }
  Object.keys(GRUPO_SHEETS).forEach(k => GRUPO_FORMAT_(ss.getSheetByName(GRUPO_SHEETS[k])));
}

function GRUPO_REEMPLAZAR_REPERTORIO_V5() {
  GRUPO_PREPARAR_SHEETS();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rep = ss.getSheetByName(GRUPO_SHEETS.repertorio);
  const set = ss.getSheetByName(GRUPO_SHEETS.setlists);

  rep.clear();
  rep.getRange(1, 1, 1, 14).setValues([['ID', '#', 'Bloque', 'Canción', 'Artista', 'Cantante', 'Estado', 'Tono original', 'Tono Ñ recomendado', 'Ajuste', 'Duración', 'Enlace', 'Letra / Acordes', 'Notas']]);
  rep.getRange(2, 1, GRUPO_REPERTORIO_V5.length, 14).setValues(GRUPO_REPERTORIO_V5);

  set.clear();
  set.getRange(1, 1, 1, 6).setValues([['ID', 'Nombre', 'Tipo', 'Canciones', 'Notas', 'Última actualización']]);
  set.getRange(2, 1, 1, 6).setValues([GRUPO_SETLIST_V5]);

  GRUPO_FORMAT_(rep);
  GRUPO_FORMAT_(set);
}

function GRUPO_PREP_(ss, name, headers, defaults) {
  const sh = GRUPO_GET_OR_CREATE_(ss, name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (defaults && defaults.length) sh.getRange(2, 1, defaults.length, headers.length).setValues(defaults);
  }
}

function GRUPO_FORMAT_(sh) {
  if (!sh) return;
  sh.setFrozenRows(1);
  if (sh.getLastColumn() > 0) {
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setBackground('#1F4E78').setFontColor('#FFFFFF');
    sh.autoResizeColumns(1, sh.getLastColumn());
  }
}

function GRUPO_ASEGURAR_SHEETS_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(GRUPO_SHEETS.miembros) || !ss.getSheetByName(GRUPO_SHEETS.repertorio) || !ss.getSheetByName(GRUPO_SHEETS.setlists)) GRUPO_PREPARAR_SHEETS();
}

function GRUPO_DATA_() {
  return {
    miembros: GRUPO_READ_MIEMBROS_(),
    pagos: GRUPO_READ_PAGOS_(),
    ensayos: GRUPO_READ_TABLE_(GRUPO_SHEETS.ensayos),
    conciertos: GRUPO_READ_TABLE_(GRUPO_SHEETS.conciertos),
    repertorio: GRUPO_READ_REPERTORIO_(),
    setlists: GRUPO_READ_SETLISTS_(),
    config: GRUPO_READ_CONFIG_()
  };
}

function GRUPO_READ_MIEMBROS_() {
  return GRUPO_READ_TABLE_(GRUPO_SHEETS.miembros).map(r => ({
    id: String(r.ID || '').trim(), nombre: String(r.Nombre || '').trim(), rol: String(r.Rol || '').trim(),
    instrumento: String(r.Instrumento || '').trim(), foto: String(r['Foto URL'] || '').trim(),
    activo: String(r.Activo || '').trim() !== 'No'
  })).filter(r => r.id);
}

function GRUPO_READ_PAGOS_() {
  return GRUPO_READ_TABLE_(GRUPO_SHEETS.pagos).map(r => ({
    mes: String(r.Mes || '').trim(), id: String(r['ID Miembro'] || '').trim(), nombre: String(r.Nombre || '').trim(),
    cuota: Number(r.Cuota || 0), pagado: String(r.Pagado || '').trim() === 'Sí',
    fecha: GRUPO_DATE_TO_STRING_(r['Fecha pago']), notas: String(r.Notas || '').trim()
  })).filter(r => r.mes && r.id);
}

function GRUPO_READ_REPERTORIO_() {
  return GRUPO_READ_TABLE_(GRUPO_SHEETS.repertorio).map(r => ({
    id: String(r.ID || '').trim(), orden: Number(r['#'] || 0), bloque: String(r.Bloque || '').trim(),
    titulo: String(r['Canción'] || '').trim(), artista: String(r.Artista || '').trim(), cantante: String(r.Cantante || '').trim(),
    estado: String(r.Estado || '').trim(), tonoOriginal: String(r['Tono original'] || '').trim(),
    tonalidad: String(r['Tono Ñ recomendado'] || '').trim(), tonoRecomendado: String(r['Tono Ñ recomendado'] || '').trim(),
    ajuste: String(r.Ajuste || '').trim(), duracion: String(r['Duración'] || '').trim(),
    link: String(r.Enlace || '').trim(), letra: String(r['Letra / Acordes'] || '').trim(), notas: String(r.Notas || '').trim()
  })).filter(r => r.id || r.titulo);
}

function GRUPO_READ_SETLISTS_() {
  return GRUPO_READ_TABLE_(GRUPO_SHEETS.setlists).map(r => ({
    id: String(r.ID || '').trim(), nombre: String(r.Nombre || '').trim(), tipo: String(r.Tipo || '').trim(),
    canciones: String(r.Canciones || '').trim(), notas: String(r.Notas || '').trim()
  })).filter(r => r.id || r.nombre);
}

function GRUPO_READ_CONFIG_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GRUPO_SHEETS.config);
  const out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(r => { if (r[0]) out[String(r[0])] = r[1]; });
  return out;
}

function GRUPO_READ_TABLE_(sheetName) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const headers = values.shift().map(String);
  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function GRUPO_SAVE_MEMBER_(p) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GRUPO_SHEETS.miembros);
  const id = String(p.id || '').trim().toLowerCase();
  if (!id) throw new Error('Falta id de miembro');
  GRUPO_UPSERT_(sh, 1, id, [id, String(p.nombre || '').trim(), String(p.rol || '').trim(), String(p.instrumento || '').trim(), String(p.foto || '').trim(), String(p.activo || 'Sí').trim() || 'Sí']);
}

function GRUPO_SAVE_PAYMENT_(p) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GRUPO_SHEETS.pagos);
  const mes = String(p.mes || '').trim();
  const id = String(p.id || '').trim().toLowerCase();
  if (!mes || !id) throw new Error('Falta mes o id');
  const row = [mes, id, String(p.nombre || '').trim(), Number(String(p.cuota || '0').replace(',', '.')) || 0, (String(p.pagado || '') === '1' || String(p.pagado || '').toLowerCase() === 'true') ? 'Sí' : 'No', String(p.fecha || '').trim(), new Date(), String(p.notas || '').trim()];
  const target = GRUPO_FIND_PAYMENT_ROW_(sh, mes, id);
  if (target > 0) sh.getRange(target, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
}

function GRUPO_SAVE_EVENT_(p) {
  const type = String(p.type || '').trim();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(type === 'concierto' ? GRUPO_SHEETS.conciertos : GRUPO_SHEETS.ensayos);
  const id = String(p.id || Utilities.getUuid()).trim();
  if (type === 'concierto') {
    GRUPO_UPSERT_(sh, 1, id, [id, String(p.fecha || '').trim(), String(p.hora || '').trim(), String(p.titulo || p.sala || '').trim(), String(p.direccion || '').trim(), String(p.llegada || '').trim(), String(p.notas || '').trim(), String(p.estado || 'Confirmado').trim(), String(p.cache || '').trim(), new Date()]);
    return;
  }
  GRUPO_UPSERT_(sh, 1, id, [id, String(p.fecha || '').trim(), String(p.hora || '').trim(), String(p.lugar || '').trim(), String(p.temas || '').trim(), String(p.notas || '').trim(), String(p.estado || 'Previsto').trim(), new Date()]);
}

function GRUPO_SAVE_SONG_(p) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GRUPO_SHEETS.repertorio);
  const id = String(p.id || GRUPO_SLUG_(p.titulo || p.cancion || '')).trim().toLowerCase();
  if (!id) throw new Error('Falta id/título de canción');
  const target = GRUPO_FIND_ROW_(sh, 1, id);
  let orden = Number(p.orden || 0);
  if (!orden && target > 0) orden = Number(sh.getRange(target, 2).getValue() || 0);
  if (!orden) orden = sh.getLastRow();
  const row = [id, orden, String(p.bloque || '').trim(), String(p.titulo || p.cancion || '').trim(), String(p.artista || '').trim(), String(p.cantante || '').trim(), String(p.estado || 'En ensayo').trim(), String(p.tonoOriginal || '').trim(), String(p.tonoRecomendado || p.tonalidad || '').trim(), String(p.ajuste || '').trim(), String(p.duracion || '').trim(), String(p.link || '').trim(), String(p.letra || '').trim(), String(p.notas || '').trim()];
  GRUPO_UPSERT_(sh, 1, id, row);
}

function GRUPO_SAVE_SETLIST_(p) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GRUPO_SHEETS.setlists);
  const id = String(p.id || GRUPO_SLUG_(p.nombre || '')).trim().toLowerCase();
  if (!id) throw new Error('Falta id/nombre de setlist');
  GRUPO_UPSERT_(sh, 1, id, [id, String(p.nombre || '').trim(), String(p.tipo || 'Sala').trim(), String(p.canciones || '[]').trim(), String(p.notas || '').trim(), new Date()]);
}

function GRUPO_UPSERT_(sh, col, value, row) {
  const target = GRUPO_FIND_ROW_(sh, col, value);
  if (target > 0) sh.getRange(target, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
}

function GRUPO_DELETE_ROW_BY_ID_(sheetName, id) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const r = GRUPO_FIND_ROW_(sh, 1, String(id || '').trim().toLowerCase());
  if (r > 0) sh.deleteRow(r);
}

function GRUPO_FIND_ROW_(sh, col, value) {
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const values = sh.getRange(2, col, last - 1, 1).getValues();
  const needle = String(value || '').trim().toLowerCase();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toLowerCase() === needle) return i + 2;
  }
  return -1;
}

function GRUPO_FIND_PAYMENT_ROW_(sh, mes, id) {
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const values = sh.getRange(2, 1, last - 1, 2).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === mes && String(values[i][1] || '').trim().toLowerCase() === id) return i + 2;
  }
  return -1;
}

function GRUPO_GET_OR_CREATE_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function GRUPO_DATE_TO_STRING_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v || '').trim();
}

function GRUPO_SLUG_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Utilities.getUuid();
}

function GRUPO_JSON_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
