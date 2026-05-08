/**
 * Ñ MAYÚSCULA — BACKEND GRUPO / GOOGLE SHEETS
 *
 * Uso recomendado:
 * 1) Crea un Google Sheet para la gestión interna del grupo.
 * 2) Abre Extensiones > Apps Script.
 * 3) Pega este archivo completo.
 * 4) Ejecuta GRUPO_PREPARAR_SHEETS() una vez y autoriza.
 * 5) Despliega como Web App: Ejecutar como tú / Acceso cualquiera con el enlace.
 * 6) Copia la URL /exec y configúrala en whatsapp.html.
 *
 * Endpoints principales:
 * GET ?action=grupoInit
 * GET ?action=grupoData
 * GET ?action=grupoSaveMember&id=...&nombre=...&rol=...&instrumento=...&foto=...
 * GET ?action=grupoSavePayment&mes=YYYY-MM&id=...&pagado=1&fecha=YYYY-MM-DD
 * GET ?action=grupoSaveEvent&type=ensayo|concierto&fecha=...&hora=...&titulo=...&lugar=...&notas=...
 */

const GRUPO_SHEETS = {
  miembros: 'MIEMBROS',
  pagos: 'PAGOS_LOCAL',
  ensayos: 'ENSAYOS',
  conciertos: 'CONCIERTOS',
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

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').trim();

  if (action.indexOf('grupo') === 0) {
    return GRUPO_API_(e);
  }

  return GRUPO_JSON_({
    ok: true,
    message: 'Backend grupo activo. Usa action=grupoData o action=grupoInit.',
    availableActions: ['grupoInit', 'grupoData', 'grupoSaveMember', 'grupoSavePayment', 'grupoSaveEvent']
  });
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

    if (action === 'grupoData') {
      return GRUPO_JSON_({ ok: true, data: GRUPO_DATA_() });
    }

    if (action === 'grupoSaveMember') {
      GRUPO_SAVE_MEMBER_(p);
      return GRUPO_JSON_({ ok: true, message: 'Miembro guardado', data: GRUPO_DATA_() });
    }

    if (action === 'grupoSavePayment') {
      GRUPO_SAVE_PAYMENT_(p);
      return GRUPO_JSON_({ ok: true, message: 'Pago guardado', data: GRUPO_DATA_() });
    }

    if (action === 'grupoSaveEvent') {
      GRUPO_SAVE_EVENT_(p);
      return GRUPO_JSON_({ ok: true, message: 'Evento guardado', data: GRUPO_DATA_() });
    }

    return GRUPO_JSON_({ ok: false, error: 'Acción no reconocida: ' + action });
  } catch (err) {
    return GRUPO_JSON_({ ok: false, error: err.message, stack: String(err.stack || '') });
  }
}

function GRUPO_PREPARAR_SHEETS() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const miembros = GRUPO_GET_OR_CREATE_(ss, GRUPO_SHEETS.miembros);
  if (miembros.getLastRow() === 0) {
    miembros.getRange(1, 1, 1, 6).setValues([['ID', 'Nombre', 'Rol', 'Instrumento', 'Foto URL', 'Activo']]);
    miembros.getRange(2, 1, GRUPO_MIEMBROS_DEFAULT.length, 6).setValues(GRUPO_MIEMBROS_DEFAULT);
  }

  const pagos = GRUPO_GET_OR_CREATE_(ss, GRUPO_SHEETS.pagos);
  if (pagos.getLastRow() === 0) {
    pagos.getRange(1, 1, 1, 8).setValues([['Mes', 'ID Miembro', 'Nombre', 'Cuota', 'Pagado', 'Fecha pago', 'Última actualización', 'Notas']]);
  }

  const ensayos = GRUPO_GET_OR_CREATE_(ss, GRUPO_SHEETS.ensayos);
  if (ensayos.getLastRow() === 0) {
    ensayos.getRange(1, 1, 1, 8).setValues([['ID', 'Fecha', 'Hora', 'Lugar', 'Temas', 'Notas', 'Estado', 'Última actualización']]);
  }

  const conciertos = GRUPO_GET_OR_CREATE_(ss, GRUPO_SHEETS.conciertos);
  if (conciertos.getLastRow() === 0) {
    conciertos.getRange(1, 1, 1, 10).setValues([['ID', 'Fecha', 'Hora', 'Sala / Evento', 'Dirección', 'Llegada / Prueba', 'Notas', 'Estado', 'Caché', 'Última actualización']]);
  }

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

  [miembros, pagos, ensayos, conciertos, config].forEach(sh => {
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setBackground('#1F4E78').setFontColor('#FFFFFF');
    sh.autoResizeColumns(1, sh.getLastColumn());
  });
}

function GRUPO_ASEGURAR_SHEETS_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(GRUPO_SHEETS.miembros) || !ss.getSheetByName(GRUPO_SHEETS.config)) {
    GRUPO_PREPARAR_SHEETS();
  }
}

function GRUPO_DATA_() {
  return {
    miembros: GRUPO_READ_MIEMBROS_(),
    pagos: GRUPO_READ_PAGOS_(),
    ensayos: GRUPO_READ_TABLE_(GRUPO_SHEETS.ensayos),
    conciertos: GRUPO_READ_TABLE_(GRUPO_SHEETS.conciertos),
    config: GRUPO_READ_CONFIG_()
  };
}

function GRUPO_READ_MIEMBROS_() {
  const rows = GRUPO_READ_TABLE_(GRUPO_SHEETS.miembros);
  return rows.map(r => ({
    id: String(r.ID || '').trim(),
    nombre: String(r.Nombre || '').trim(),
    rol: String(r.Rol || '').trim(),
    instrumento: String(r.Instrumento || '').trim(),
    foto: String(r['Foto URL'] || '').trim(),
    activo: String(r.Activo || '').trim() !== 'No'
  })).filter(r => r.id);
}

function GRUPO_READ_PAGOS_() {
  const rows = GRUPO_READ_TABLE_(GRUPO_SHEETS.pagos);
  return rows.map(r => ({
    mes: String(r.Mes || '').trim(),
    id: String(r['ID Miembro'] || '').trim(),
    nombre: String(r.Nombre || '').trim(),
    cuota: Number(r.Cuota || 0),
    pagado: String(r.Pagado || '').trim() === 'Sí',
    fecha: GRUPO_DATE_TO_STRING_(r['Fecha pago']),
    notas: String(r.Notas || '').trim()
  })).filter(r => r.mes && r.id);
}

function GRUPO_READ_CONFIG_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(GRUPO_SHEETS.config);
  const out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  values.forEach(r => { if (r[0]) out[String(r[0])] = r[1]; });
  return out;
}

function GRUPO_READ_TABLE_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(sheetName);
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(GRUPO_SHEETS.miembros);
  const id = String(p.id || '').trim().toLowerCase();
  if (!id) throw new Error('Falta id de miembro');

  const row = [
    id,
    String(p.nombre || '').trim(),
    String(p.rol || '').trim(),
    String(p.instrumento || '').trim(),
    String(p.foto || '').trim(),
    String(p.activo || 'Sí').trim() || 'Sí'
  ];

  const target = GRUPO_FIND_ROW_(sh, 1, id);
  if (target > 0) sh.getRange(target, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
}

function GRUPO_SAVE_PAYMENT_(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(GRUPO_SHEETS.pagos);
  const mes = String(p.mes || '').trim();
  const id = String(p.id || '').trim().toLowerCase();
  if (!mes || !id) throw new Error('Falta mes o id de miembro');

  const nombre = String(p.nombre || '').trim();
  const cuota = Number(String(p.cuota || '0').replace(',', '.')) || 0;
  const pagado = String(p.pagado || '') === '1' || String(p.pagado || '').toLowerCase() === 'true' ? 'Sí' : 'No';
  const fecha = String(p.fecha || '').trim();
  const notas = String(p.notas || '').trim();

  const target = GRUPO_FIND_PAYMENT_ROW_(sh, mes, id);
  const row = [mes, id, nombre, cuota, pagado, fecha, new Date(), notas];
  if (target > 0) sh.getRange(target, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
}

function GRUPO_SAVE_EVENT_(p) {
  const type = String(p.type || '').trim();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = type === 'concierto' ? GRUPO_SHEETS.conciertos : GRUPO_SHEETS.ensayos;
  const sh = ss.getSheetByName(sheetName);
  const id = String(p.id || Utilities.getUuid()).trim();

  if (type === 'concierto') {
    const row = [
      id,
      String(p.fecha || '').trim(),
      String(p.hora || '').trim(),
      String(p.titulo || p.sala || '').trim(),
      String(p.direccion || '').trim(),
      String(p.llegada || '').trim(),
      String(p.notas || '').trim(),
      String(p.estado || 'Confirmado').trim(),
      String(p.cache || '').trim(),
      new Date()
    ];
    const target = GRUPO_FIND_ROW_(sh, 1, id);
    if (target > 0) sh.getRange(target, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    return;
  }

  const row = [
    id,
    String(p.fecha || '').trim(),
    String(p.hora || '').trim(),
    String(p.lugar || '').trim(),
    String(p.temas || '').trim(),
    String(p.notas || '').trim(),
    String(p.estado || 'Previsto').trim(),
    new Date()
  ];
  const target = GRUPO_FIND_ROW_(sh, 1, id);
  if (target > 0) sh.getRange(target, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
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
  const m = String(mes || '').trim();
  const member = String(id || '').trim().toLowerCase();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === m && String(values[i][1] || '').trim().toLowerCase() === member) return i + 2;
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

function GRUPO_JSON_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
