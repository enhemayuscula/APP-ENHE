/**
 * Ñ MAYÚSCULA — BACKEND GRUPO V3 / REPERTORIO REAL EÑE
 * Este archivo es SOLO para el Apps Script de la hoja "Ñ Mayúscula - Gestión Grupo".
 * NO se pega en el Apps Script del CRM comercial.
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

const GRUPO_REPERTORIO_ENHE = [
  ["el-ritmo-del-garaje", "El ritmo del garaje", "", "Ambos", "En ensayo", "", "", "", "", "1 · ARRANQUE / ENCHUFE. Bloque 1. Entrar con energía.", "1 · ARRANQUE / ENCHUFE"],
  ["groenlandia", "Groenlandia", "", "Miguel", "En ensayo", "", "", "", "", "1 · ARRANQUE / ENCHUFE. Bloque 1. Cortar poco.", "1 · ARRANQUE / ENCHUFE"],
  ["voy-en-un-coche", "Voy en un coche", "", "Esther", "En ensayo", "", "", "", "", "1 · ARRANQUE / ENCHUFE. Bloque 1.", "1 · ARRANQUE / ENCHUFE"],
  ["rojitas-las-orejas", "Rojitas las orejas", "", "Miguel", "En ensayo", "", "", "", "", "1 · ARRANQUE / ENCHUFE. Bloque 1.", "1 · ARRANQUE / ENCHUFE"],
  ["perlas-ensangrentadas", "Perlas ensangrentadas", "", "Ambos", "En ensayo", "", "", "", "", "1 · ARRANQUE / ENCHUFE. Bloque 1. Sin presentación larga hasta después del 5.", "1 · ARRANQUE / ENCHUFE"],
  ["pongamos-que-hablo-de-madrid", "Pongamos que hablo de Madrid", "", "Esther", "En ensayo", "", "", "", "", "2 · CLÁSICOS + EMOCIÓN. Bloque 2. Pop reconocible y tramo cantable.", "2 · CLÁSICOS + EMOCIÓN"],
  ["lobo-hombre-en-paris", "Lobo hombre en París", "", "Miguel", "En ensayo", "", "", "", "", "2 · CLÁSICOS + EMOCIÓN. Bloque 2.", "2 · CLÁSICOS + EMOCIÓN"],
  ["dejame", "Déjame", "", "Esther", "En ensayo", "", "", "", "", "2 · CLÁSICOS + EMOCIÓN. Bloque 2.", "2 · CLÁSICOS + EMOCIÓN"],
  ["la-chica-de-ayer", "La chica de ayer", "", "Miguel", "En ensayo", "", "", "", "", "2 · CLÁSICOS + EMOCIÓN. Bloque 2.", "2 · CLÁSICOS + EMOCIÓN"],
  ["porque-te-vas-lilith", "Porque te vas - Lilith", "", "Esther", "En ensayo", "", "", "", "", "2 · CLÁSICOS + EMOCIÓN. Bloque 2. Respirar, pero no dejar caer el tempo.", "2 · CLÁSICOS + EMOCIÓN"],
  ["heroe-de-leyenda", "Héroe de leyenda", "", "Miguel", "En ensayo", "", "", "", "", "3 · CENTRO ROCK / VARIEDAD. Bloque 3. Peso, contraste y narrativa.", "3 · CENTRO ROCK / VARIEDAD"],
  ["maneras-de-vivir", "Maneras de vivir", "", "Ambos", "En ensayo", "", "", "", "", "3 · CENTRO ROCK / VARIEDAD. Bloque 3.", "3 · CENTRO ROCK / VARIEDAD"],
  ["que-hace-una-chica-como-tu", "Qué hace una chica como tú…", "", "Miguel", "En ensayo", "", "", "", "", "3 · CENTRO ROCK / VARIEDAD. Bloque 3.", "3 · CENTRO ROCK / VARIEDAD"],
  ["whisky-barato", "Whisky barato", "", "Esther", "En ensayo", "", "", "", "", "3 · CENTRO ROCK / VARIEDAD. Bloque 3.", "3 · CENTRO ROCK / VARIEDAD"],
  ["no-puedo-vivir-sin-ti", "No puedo vivir sin ti", "", "Miguel", "En ensayo", "", "", "", "", "3 · CENTRO ROCK / VARIEDAD. Bloque 3.", "3 · CENTRO ROCK / VARIEDAD"],
  ["mueve-tus-caderas", "Mueve tus caderas", "", "Lorenzo", "En ensayo", "", "", "", "", "3 · CENTRO ROCK / VARIEDAD. Bloque 3. Momento Lorenzo.", "3 · CENTRO ROCK / VARIEDAD"],
  ["mil-calles-llevan-hacia-ti", "Mil calles llevan hacia ti", "", "Miguel", "En ensayo", "", "", "", "", "4 · RECTA DE SUBIDA. Bloque 4. Enlazar casi seguido.", "4 · RECTA DE SUBIDA"],
  ["cadillac-solitario", "Cadillac solitario", "", "Miguel", "En ensayo", "", "", "", "", "4 · RECTA DE SUBIDA. Bloque 4. Temas de bar, carretera y baile.", "4 · RECTA DE SUBIDA"],
  ["flaca", "Flaca", "", "Miguel", "En ensayo", "", "", "", "", "4 · RECTA DE SUBIDA. Bloque 4.", "4 · RECTA DE SUBIDA"],
  ["carolina", "Carolina", "", "Miguel", "En ensayo", "", "", "", "", "4 · RECTA DE SUBIDA. Bloque 4.", "4 · RECTA DE SUBIDA"],
  ["el-calor-del-amor-en-un-bar", "El calor del amor en un bar", "", "Miguel", "En ensayo", "", "", "", "", "4 · RECTA DE SUBIDA. Bloque 4.", "4 · RECTA DE SUBIDA"],
  ["escuela-de-calor", "Escuela de calor", "", "Miguel", "En ensayo", "", "", "", "", "4 · RECTA DE SUBIDA. Bloque 4.", "4 · RECTA DE SUBIDA"],
  ["bailare-sobre-tu-tumba-extended", "Bailaré sobre tu tumba (extended)", "", "Miguel", "En ensayo", "", "", "", "", "4 · RECTA DE SUBIDA. Bloque 4. Preparar el cierre con máxima energía.", "4 · RECTA DE SUBIDA"],
  ["ni-tu-ni-nadie", "Ni tú ni nadie", "", "Esther", "En ensayo", "", "", "", "", "5 · CIERRE FIJO. Cierre obligatorio. No alterar el orden.", "5 · CIERRE FIJO"],
  ["quiero-besarte", "Quiero besarte", "", "Miguel", "En ensayo", "", "", "", "", "5 · CIERRE FIJO. Cierre obligatorio. No alterar el orden.", "5 · CIERRE FIJO"],
  ["enamorado-de-la-moda-juvenil", "Enamorado de la moda juvenil", "", "Ambos", "En ensayo", "", "", "", "", "5 · CIERRE FIJO. Final exacto. Ambos cierran arriba.", "5 · CIERRE FIJO"]
];

const GRUPO_SETLIST_ENHE = [
  'orden-estrategico-bloques-enhe',
  'Ñ Mayúscula · Orden estratégico por bloques',
  'Sala',
  "[\"el-ritmo-del-garaje\", \"groenlandia\", \"voy-en-un-coche\", \"rojitas-las-orejas\", \"perlas-ensangrentadas\", \"pongamos-que-hablo-de-madrid\", \"lobo-hombre-en-paris\", \"dejame\", \"la-chica-de-ayer\", \"porque-te-vas-lilith\", \"heroe-de-leyenda\", \"maneras-de-vivir\", \"que-hace-una-chica-como-tu\", \"whisky-barato\", \"no-puedo-vivir-sin-ti\", \"mueve-tus-caderas\", \"mil-calles-llevan-hacia-ti\", \"cadillac-solitario\", \"flaca\", \"carolina\", \"el-calor-del-amor-en-un-bar\", \"escuela-de-calor\", \"bailare-sobre-tu-tumba-extended\", \"ni-tu-ni-nadie\", \"quiero-besarte\", \"enamorado-de-la-moda-juvenil\"]",
  'Música: 1:47:25 · Ágil: 1:59:55 · Amplio: 2:03:55. Final obligatorio: NI TÚ NI NADIE → QUIERO BESARTE → ENAMORADO DE LA MODA JUVENIL.',
  new Date()
];

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').trim();
  if (action.indexOf('grupo') === 0) return GRUPO_API_(e);
  return GRUPO_JSON_({ ok: true, message: 'Backend grupo V3 activo' });
}

function GRUPO_API_(e) {
  try {
    const p = e.parameter || {};
    const action = String(p.action || '').trim();

    if (action === 'grupoInit') {
      GRUPO_PREPARAR_SHEETS();
      return GRUPO_JSON_({ ok: true, message: 'Hojas preparadas', data: GRUPO_DATA_() });
    }
    GRUPO_ASEGURAR_SHEETS_();

    if (action === 'grupoData') return GRUPO_JSON_({ ok: true, data: GRUPO_DATA_() });
    if (action === 'grupoResetRepertorioEnhe') {
      GRUPO_REEMPLAZAR_REPERTORIO_ENHE();
      return GRUPO_JSON_({ ok: true, message: 'Repertorio de Ñ Mayúscula reemplazado', data: GRUPO_DATA_() });
    }
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
  GRUPO_PREP_(ss, GRUPO_SHEETS.repertorio, ['ID', 'Canción', 'Artista', 'Cantante', 'Estado', 'Tonalidad', 'Duración', 'Enlace', 'Letra / Acordes', 'Notas', 'Bloque'], GRUPO_REPERTORIO_ENHE);
  GRUPO_PREP_(ss, GRUPO_SHEETS.setlists, ['ID', 'Nombre', 'Tipo', 'Canciones', 'Notas', 'Última actualización'], [GRUPO_SETLIST_ENHE]);

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

function GRUPO_REEMPLAZAR_REPERTORIO_ENHE() {
  GRUPO_PREPARAR_SHEETS();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rep = ss.getSheetByName(GRUPO_SHEETS.repertorio);
  const set = ss.getSheetByName(GRUPO_SHEETS.setlists);

  if (rep.getLastRow() > 1) rep.getRange(2, 1, rep.getLastRow() - 1, rep.getLastColumn()).clearContent();
  rep.getRange(2, 1, GRUPO_REPERTORIO_ENHE.length, GRUPO_REPERTORIO_ENHE[0].length).setValues(GRUPO_REPERTORIO_ENHE);

  if (set.getLastRow() > 1) set.getRange(2, 1, set.getLastRow() - 1, set.getLastColumn()).clearContent();
  set.getRange(2, 1, 1, GRUPO_SETLIST_ENHE.length).setValues([GRUPO_SETLIST_ENHE]);

  GRUPO_FORMAT_(rep);
  GRUPO_FORMAT_(set);
}

function GRUPO_PREP_(ss, name, headers, defaults) {
  const sh = GRUPO_GET_OR_CREATE_(ss, name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (defaults && defaults.length) sh.getRange(2, 1, defaults.length, headers.length).setValues(defaults);
  } else {
    const currentLastCol = sh.getLastColumn();
    if (currentLastCol < headers.length) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
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
    id: String(r.ID || '').trim(),
    nombre: String(r.Nombre || '').trim(),
    rol: String(r.Rol || '').trim(),
    instrumento: String(r.Instrumento || '').trim(),
    foto: String(r['Foto URL'] || '').trim(),
    activo: String(r.Activo || '').trim() !== 'No'
  })).filter(r => r.id);
}

function GRUPO_READ_PAGOS_() {
  return GRUPO_READ_TABLE_(GRUPO_SHEETS.pagos).map(r => ({
    mes: String(r.Mes || '').trim(),
    id: String(r['ID Miembro'] || '').trim(),
    nombre: String(r.Nombre || '').trim(),
    cuota: Number(r.Cuota || 0),
    pagado: String(r.Pagado || '').trim() === 'Sí',
    fecha: GRUPO_DATE_TO_STRING_(r['Fecha pago']),
    notas: String(r.Notas || '').trim()
  })).filter(r => r.mes && r.id);
}

function GRUPO_READ_REPERTORIO_() {
  return GRUPO_READ_TABLE_(GRUPO_SHEETS.repertorio).map(r => ({
    id: String(r.ID || '').trim(),
    titulo: String(r['Canción'] || '').trim(),
    artista: String(r.Artista || '').trim(),
    cantante: String(r.Cantante || '').trim(),
    estado: String(r.Estado || '').trim(),
    tonalidad: String(r.Tonalidad || '').trim(),
    duracion: String(r['Duración'] || '').trim(),
    link: String(r.Enlace || '').trim(),
    letra: String(r['Letra / Acordes'] || '').trim(),
    notas: String(r.Notas || '').trim(),
    bloque: String(r.Bloque || '').trim()
  })).filter(r => r.id || r.titulo);
}

function GRUPO_READ_SETLISTS_() {
  return GRUPO_READ_TABLE_(GRUPO_SHEETS.setlists).map(r => ({
    id: String(r.ID || '').trim(),
    nombre: String(r.Nombre || '').trim(),
    tipo: String(r.Tipo || '').trim(),
    canciones: String(r.Canciones || '').trim(),
    notas: String(r.Notas || '').trim()
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
  const row = [id, String(p.titulo || p.cancion || '').trim(), String(p.artista || '').trim(), String(p.cantante || '').trim(), String(p.estado || 'En ensayo').trim(), String(p.tonalidad || '').trim(), String(p.duracion || '').trim(), String(p.link || '').trim(), String(p.letra || '').trim(), String(p.notas || '').trim(), String(p.bloque || '').trim()];
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
