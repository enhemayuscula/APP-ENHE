const APP_ENHE_APP_VERSION = '3.0.0-biblioteca-pistas';
const STORE_KEY = 'n_mayuscula_control_pro_v16_biblioteca_pistas';
const OLD_STORE_KEYS = ['n_mayuscula_control_pro_v12_lady_stone_economic_agreements','n_mayuscula_control_pro_v11_lady_stone_admin','n_mayuscula_control_pro_v10_budget_advanced','n_mayuscula_control_pro_v9_admin_notice_fix','n_mayuscula_control_pro_v8_mobile_sheet_lite','n_mayuscula_control_pro_v7_mobile_sheet_jsonp','n_mayuscula_control_pro_v6_sheet_master_v20','n_mayuscula_control_pro_v5_sheet_master','n_mayuscula_control_pro_v4_sheet_first','n_mayuscula_control_pro_v3','n_mayuscula_control_pro_v2','n_mayuscula_control_pro'];
let db = loadData();
let filteredCRM = [];
const tabs = [
  ['dashboard','Panel','●'],['crm','CRM','●'],['followup','Seguimiento','●'],['gmail','Gmail','●'],['concerts','Conciertos','●'],['rehearsals','Ensayos','●'],['local','Local ensayo','●'],
  ['ladyStone','Lady Stone','●'],['audioLibrary','Pistas','●'],['budget','Presupuesto','●'],['repertoire','Canciones','●'],['setlist','Setlist','●'],['dossier','Dossier','●'],['templates','Plantillas','●'],['tasks','Tareas','●'],['importExport','Exportar','●']
];

function clone(o){return JSON.parse(JSON.stringify(o));}
function shouldSeedReplace(v){
  if(v === undefined || v === null || v === '') return true;
  const x = String(v).toLowerCase().trim();
  return x === '—' ||
    x.includes('pendiente validar') ||
    x.includes('pendiente de reconstrucción') ||
    x.includes('campo preparado para recuperar') ||
    x.includes('tonalidades pendientes') ||
    x.includes('urls por tema pendientes') ||
    x.includes('provisional · revisar en ensayo');
}
function loadData(){
  // v1.9: Google Sheet es la fuente principal.
  // localStorage solo sirve como caché de esta versión, nunca como fuente maestra.
  let data=clone(INITIAL_DATA);
  try{
    const raw=localStorage.getItem(STORE_KEY);
    if(raw){
      const cached=JSON.parse(raw);
      if(cached && cached.appCacheVersion === APP_ENHE_APP_VERSION){
        data=Object.assign(clone(INITIAL_DATA), cached);
      }
    }
  }catch(e){}
  return migrateData(data);
}
function clearOldLocalCaches(){
  try{
    OLD_STORE_KEYS.forEach(k=>localStorage.removeItem(k));
    if(window.caches){
      caches.keys().then(keys=>keys.forEach(k=>{
        if(!String(k).includes('v1-8')) caches.delete(k);
      })).catch(()=>{});
    }
  }catch(e){}
}
function migrateData(data){
  data.repertoire = Array.isArray(data.repertoire) ? data.repertoire : [];
  data.artistReferences = Array.isArray(data.artistReferences) ? data.artistReferences : [];
  data.bandMembers = Array.isArray(data.bandMembers) && data.bandMembers.length ? data.bandMembers : [
    {id:'miguel_voz',name:'Miguel',role:'Voz'},
    {id:'esther',name:'Esther',role:'Voz'},
    {id:'lorenzo',name:'Lorenzo',role:'Guitarra solista'},
    {id:'oscar',name:'Oscar',role:'Guitarra rítmica'},
    {id:'jeffrey',name:'Jeffrey',role:'Bajo'},
    {id:'pepe',name:'Pepe',role:'Batería'}
  ];

  data.bandMembers = data.bandMembers.map(m => {
    if((m.id === 'miguel_bajo') || (m.name === 'Miguel' && /bajo/i.test(String(m.role||'')))) {
      return {id:'jeffrey', name:'Jeffrey', role:'Bajo'};
    }
    return m;
  });

  const defaultSong = {
    id: 0,
    order: '',
    title: '',
    titleCanonical: '',
    artist: '',
    versionReference: '',
    singer: '',
    leadVocal: '',
    duration: '',
    durationLive: '',
    durationOriginal: '',
    durationStatus: '',
    tone: '',
    originalKey: '',
    currentKey: '',
    rehearsalKey: '',
    keyStatus: '',
    keyMiguel: '',
    keyEsther: '',
    keyLorenzo: '',
    transposeNotes: '',
    capo: '',
    bpm: '',
    block: 'Bloque 1',
    blockNumber: '',
    blockObjective: '',
    stageControl: '',
    status: 'Activo',
    spotifyPlaylistUrl: '',
    spotifyUrl: '',
    youtubeUrl: '',
    chordsUrl: '',
    chordsText: '',
    structure: '',
    lyricsNotes: '',
    notes: '',
    sourceNotes: ''
  };

  data.repertoire = data.repertoire.map((song,idx)=>Object.assign({}, defaultSong, {
    id: idx+1
  }, song || {}));

  // Importante: si el navegador tenía una versión antigua en localStorage,
  // completamos desde INITIAL_DATA sin borrar ediciones existentes.
  const seed = Array.isArray(INITIAL_DATA.repertoire) ? INITIAL_DATA.repertoire : [];
  seed.forEach(seedSong=>{
    const match = data.repertoire.find(song => norm(song.titleCanonical||song.title) === norm(seedSong.titleCanonical||seedSong.title));
    if(match){
      Object.keys(seedSong).forEach(key=>{
        if(shouldSeedReplace(match[key])){
          match[key] = seedSong[key];
        }
      });
    }else{
      const next = nextId(data.repertoire);
      data.repertoire.push(Object.assign({}, defaultSong, seedSong, {id: next}));
    }
  });

  data.repertoire.sort((a,b)=>(Number(a.order)||Number(a.id)||0)-(Number(b.order)||Number(b.id)||0));

  data.concerts = Array.isArray(data.concerts) ? data.concerts : [];
  data.localPayments = Array.isArray(data.localPayments) ? data.localPayments : [];
  data.localConfig = Object.assign({monthlyAmount:217, source:'CONFIG_GRUPO / Google Sheet'}, data.localConfig || {});

  data.ladyStone = normalizeLadyStoneData(data.ladyStone);
  const defaultConcert = {
    id: 0,
    date: '',
    time: '',
    eventName: '',
    venue: '',
    city: '',
    type: 'Sala',
    status: 'Pre-reserva',
    fee: 0,
    deposit: 0,
    paid: 0,
    sound: '',
    contactId: 0,
    posterUrl: '',
    posterThumbUrl: '',
    posterTitle: '',
    publicInfo: '',
    attendance: {},
    attendanceNotes: '',
    notes: ''
  };
  data.concerts = data.concerts.map((concert, idx)=>Object.assign({}, defaultConcert, {id: idx+1}, concert || {}));
  const seedConcerts = Array.isArray(INITIAL_DATA.concerts) ? INITIAL_DATA.concerts : [];
  seedConcerts.forEach(seedConcert=>{
    const match = data.concerts.find(concert =>
      norm(concert.date) === norm(seedConcert.date) &&
      norm(concert.eventName) === norm(seedConcert.eventName) &&
      norm(concert.venue) === norm(seedConcert.venue)
    );
    if(match){
      Object.keys(seedConcert).forEach(key=>{
        if(shouldSeedReplace(match[key])) match[key] = seedConcert[key];
      });
    }else{
      data.concerts.push(Object.assign({}, defaultConcert, seedConcert, {id: nextId(data.concerts)}));
    }
  });
  data.concerts.sort((a,b)=>String(a.date||'9999-99-99').localeCompare(String(b.date||'9999-99-99')) || String(a.time||'99:99').localeCompare(String(b.time||'99:99')));

  const defaultAttendance = {};
  data.bandMembers.forEach(m=>{ defaultAttendance[m.id] = {status:'Pendiente', notes:''}; });

  const defaultRehearsal = {
    id: 0,
    date: '',
    startTime: '',
    endTime: '',
    place: '',
    status: 'Pendiente',
    objective: '',
    allSongs: false,
    songIds: [],
    notes: '',
    attendance: clone(defaultAttendance)
  };
  data.rehearsals = Array.isArray(data.rehearsals) ? data.rehearsals : [];
  data.rehearsals = data.rehearsals.map((r,idx)=>{
    const item = Object.assign({}, defaultRehearsal, {id: idx+1}, r || {});
    item.songIds = Array.isArray(item.songIds) ? item.songIds.map(Number).filter(Boolean) : [];
    item.allSongs = item.allSongs === true || item.allSongs === 'true';
    item.attendance = Object.assign({}, clone(defaultAttendance), item.attendance || {});
    data.bandMembers.forEach(m=>{
      if(typeof item.attendance[m.id] === 'string'){
        item.attendance[m.id] = {status:item.attendance[m.id], notes:''};
      }else{
        item.attendance[m.id] = Object.assign({status:'Pendiente', notes:''}, item.attendance[m.id] || {});
      }
    });
    return item;
  });
  data.rehearsals.sort((a,b)=>String(a.date||'9999-99-99').localeCompare(String(b.date||'9999-99-99')) || String(a.startTime||'99:99').localeCompare(String(b.startTime||'99:99')));

  data.concerts.forEach(c=>{
    c.attendance = c.attendance || {};
    data.bandMembers.forEach(m=>{
      if(typeof c.attendance[m.id] === 'string'){
        c.attendance[m.id] = {status:c.attendance[m.id], notes:''};
      }else{
        c.attendance[m.id] = Object.assign({status:'Pendiente', notes:''}, c.attendance[m.id] || {});
      }
    });
  });

  return data;
}
function saveData(){db.appCacheVersion=APP_ENHE_APP_VERSION;localStorage.setItem(STORE_KEY, JSON.stringify(db)); refreshAll();}
function resetData(){if(confirm('¿Restaurar los datos iniciales importados del Excel? Se perderán cambios locales de esta app.')){localStorage.removeItem(STORE_KEY);db=clone(INITIAL_DATA);refreshAll();}}
function esc(v){return String(v??'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function eur(n){n=Number(n||0);return n? n.toLocaleString('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}) : '—';}
function compact(v,n=95){v=String(v??'').trim(); return v.length>n ? v.slice(0,n-1)+'…' : v;}
function nextId(arr){return (arr||[]).reduce((m,x)=>Math.max(m, Number(x.id)||0),0)+1;}

function parseEuroValue(v){
  if(typeof v==='number') return Number.isFinite(v)?v:0;
  let s=String(v??'').trim();
  if(!s) return 0;
  s=s.replace(/\s/g,'').replace(/[^\d,.\-]/g,'');
  if(s.includes(',') && s.includes('.')){
    s=s.replace(/\./g,'').replace(',','.');
  }else{
    s=s.replace(',','.');
  }
  const n=Number(s);
  return Number.isFinite(n)?n:0;
}
function money2(n){
  n=Number(n||0);
  return n.toLocaleString('es-ES',{minimumFractionDigits:2, maximumFractionDigits:2})+' €';
}

function todayISO(){
  return new Date().toISOString().slice(0,10);
}

function defaultLadyStoneData(){
  return {
    association:{
      name:'Asociación Musical y Cultural Lady Janis Joplin Stone',
      scope:'Comunidad de Madrid',
      address:'C/ Hermanos García Noblejas, 131, 6º A · 28037 Madrid',
      operationalBase:'Lady Stone Music · Local Janis Joplin · C. Torre de Don Miguel, 13-A · Villa de Vallecas · 28031 Madrid',
      president:'Miguel Ángel Fernández Sánchez',
      status:'Borrador / pendiente de constitución'
    },
    projects:[
      {id:'enhe', name:'Ñ Mayúscula', status:'Activo', app:'APP-ENHE'},
      {id:'bcb', name:'Breathless Cover Band', status:'Activo', app:'APP-BCB'},
      {id:'common', name:'Común asociación', status:'Interno', app:'Lady Stone'}
    ],
    tickets:[],
    movements:[],
    invoices:[],
    documents:[],
    settings:{
      defaultVatTickets:10,
      defaultSgaePct:8.5,
      notes:'Una sola asociación con proyectos separados. No mezclar saldos Ñ / BCB.'
    }
  };
}

function normalizeLadyProjectName(v){
  const x=norm(v);
  if(x.includes('breathless') || x.includes('bcb')) return 'Breathless Cover Band';
  if(x.includes('comun') || x.includes('asociacion')) return 'Común asociación';
  return 'Ñ Mayúscula';
}

function normalizeLadyStoneData(raw){
  const base=defaultLadyStoneData();
  raw = raw && typeof raw === 'object' ? raw : {};
  const out=Object.assign({}, base, raw);
  out.association=Object.assign({}, base.association, raw.association||{});
  out.settings=Object.assign({}, base.settings, raw.settings||{});
  out.projects=Array.isArray(raw.projects) && raw.projects.length ? raw.projects : base.projects;
  out.tickets=Array.isArray(raw.tickets) ? raw.tickets : [];
  out.movements=Array.isArray(raw.movements) ? raw.movements : [];
  out.invoices=Array.isArray(raw.invoices) ? raw.invoices : [];
  out.documents=Array.isArray(raw.documents) ? raw.documents : [];
  return out;
}

function ensureLadyStone(){
  db.ladyStone = normalizeLadyStoneData(db.ladyStone);
  return db.ladyStone;
}
function normalizeMonthValue(v){
  if(v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0,7);
  let raw=String(v??'').trim();
  if(!raw) return '';
  // Apps Script puede devolver "2026-05-01T09:00:00" o fechas localizadas.
  const iso=raw.match(/^(\d{4})-(\d{2})(?:-\d{2})?/);
  if(iso) return `${iso[1]}-${iso[2]}`;
  const slash=raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if(slash) return `${slash[3]}-${String(slash[2]).padStart(2,'0')}`;
  const yearMonth=raw.match(/(\d{4})\D+(\d{1,2})/);
  if(yearMonth) return `${yearMonth[1]}-${String(yearMonth[2]).padStart(2,'0')}`;
  const d=new Date(raw);
  if(!isNaN(d.getTime())) return d.toISOString().slice(0,7);
  return raw.slice(0,7);
}
function normalizeMemberKey(v){
  let s=norm(v).replace(/[^a-z0-9]+/g,'');
  if(s==='miguelvoz' || s==='miguelcantante') return 'miguel';
  if(s==='jeff' || s==='jeffbajista') return 'jeffrey';
  if(s.includes('miguel')) return 'miguel';
  if(s.includes('esther')) return 'esther';
  if(s.includes('lorenzo')) return 'lorenzo';
  if(s.includes('oscar')) return 'oscar';
  if(s.includes('jeffrey') || s.includes('jeff')) return 'jeffrey';
  if(s.includes('pepe')) return 'pepe';
  return s;
}
function memberDisplayName(id, fallback=''){
  const key=normalizeMemberKey(id||fallback);
  const map={miguel:'Miguel',esther:'Esther',lorenzo:'Lorenzo',oscar:'Oscar',jeffrey:'Jeffrey',pepe:'Pepe'};
  return map[key] || fallback || id || '';
}
function isPaymentPaid(v){
  const x=norm(v).replace(/\./g,'').trim();
  if(!x) return false;
  if(['no','n','false','0','pendiente','sinpagar','sin pagar','nopagado','no pagado','debe',''].includes(x)) return false;
  return ['si','sí','s','pagado','pagada','paid','true','1','ok','confirmado','cobrado'].includes(x);
}
function mergeTextNotes(a,b){
  const out=[];
  [a,b].forEach(v=>String(v??'').split('|').map(x=>x.trim()).filter(Boolean).forEach(x=>{if(!out.includes(x)) out.push(x);}));
  return out.join(' | ');
}
function consolidateLocalPaymentRows(items){
  const allowed=['miguel','esther','lorenzo','oscar','jeffrey','pepe'];
  const byKey=new Map();

  (items||[]).forEach((item,idx)=>{
    const month=normalizeMonthValue(item.month || item.Mes || item.mes);
    const memberId=normalizeMemberKey(item.memberId || item['ID Miembro'] || item.id_miembro || item.name || item.Nombre);
    if(!month || !allowed.includes(memberId)) return;

    const key=month+'|'+memberId;
    const amount=parseEuroValue(item.amount ?? item.Cuota ?? item.cuota ?? item.importe);
    const paidValue=item.paid ?? item.Pagado ?? item.pagado ?? '';
    const clean={
      id:item.id || idx+1,
      month,
      memberId,
      name:memberDisplayName(memberId, item.name || item.Nombre),
      amount: amount || 36.17,
      paid:isPaymentPaid(paidValue)?'SI':'NO',
      paidDate:item.paidDate || item['Fecha pago'] || item.fecha_pago || '',
      updatedAt:item.updatedAt || item['Última actualización'] || item.actualizado_en || '',
      notes:item.notes || item.Notas || item.notas || '',
      raw:item.raw || item
    };

    if(!byKey.has(key)){
      byKey.set(key, clean);
    }else{
      const prev=byKey.get(key);
      prev.amount=prev.amount || clean.amount;
      prev.paid=(isPaymentPaid(prev.paid)||isPaymentPaid(clean.paid))?'SI':'NO';
      prev.paidDate=prev.paidDate || clean.paidDate;
      prev.updatedAt=clean.updatedAt || prev.updatedAt;
      prev.notes=mergeTextNotes(prev.notes, clean.notes);
      byKey.set(key, prev);
    }
  });

  const order={miguel:1,esther:2,lorenzo:3,oscar:4,jeffrey:5,pepe:6};
  return [...byKey.values()].sort((a,b)=>
    String(b.month).localeCompare(String(a.month)) || (order[a.memberId]||99)-(order[b.memberId]||99)
  );
}


const GOOGLE_SHEET_MASTER = {
  spreadsheetId: '1mrffAdGxfzRL602XHD4Uw-EKiYBgZ4PgLuVuOFPxEGU',
  gid: '2128742185',
  userUrl: 'https://docs.google.com/spreadsheets/d/1mrffAdGxfzRL602XHD4Uw-EKiYBgZ4PgLuVuOFPxEGU/edit?gid=2128742185#gid=2128742185',
  csvUrl: 'https://docs.google.com/spreadsheets/d/1mrffAdGxfzRL602XHD4Uw-EKiYBgZ4PgLuVuOFPxEGU/export?format=csv&gid=2128742185',
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwmB2voyp9DCqFoHa939EXbBc05eOvt6VVJAatP47aDFmzWPg5Fn3KSrt8CcEDsVAet5g/exec'
};

function sheetStatus(msg, type='info'){
  const els=[document.getElementById('sheetSyncStatus'), document.getElementById('sheetSyncStatusExport')].filter(Boolean);
  if(!els.length) return;
  els.forEach(el=>{
    el.className = 'notice ' + (type==='ok'?'ok':type==='bad'?'bad':'');
    el.innerHTML = msg;
  });
}
function parseCSV(text){
  const rows=[]; let row=[]; let cur=''; let q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(q){
      if(c==='"' && n==='"'){cur+='"';i++;}
      else if(c==='"'){q=false;}
      else cur+=c;
    }else{
      if(c==='"') q=true;
      else if(c===','){row.push(cur);cur='';}
      else if(c==='\n'){row.push(cur);rows.push(row);row=[];cur='';}
      else if(c==='\r'){}
      else cur+=c;
    }
  }
  row.push(cur); rows.push(row);
  return rows.filter(r=>r.some(v=>String(v||'').trim()!==''));
}
function normalizeHeader(h){
  return norm(String(h||'').replace(/\s+/g,' '));
}
function rowObjectFromHeaders(headers,row){
  const o={};
  headers.forEach((h,i)=>{o[String(h||'').trim()]=row[i]??'';});
  return o;
}
function pick(row, names){
  const keys=Object.keys(row);
  for(const name of names){
    const target=normalizeHeader(name);
    const found=keys.find(k=>normalizeHeader(k)===target);
    if(found!==undefined) return row[found] ?? '';
  }
  return '';
}
function crmFromSheetRow(row, id, index){
  const raw = row || {};
  return {
    id: Number(pick(row,['id','ID'])) || id,
    sheetRow: Number(pick(row,['sheetRow','Fila','Nº fila','rowNumber'])) || index + 2,
    claveCRM: pick(row,['ClaveCRM','Clave CRM','claveCRM']),
    campaign: pick(row,['Campaña','campaign','origen','Origen','tipo_evento','Tipo evento']) || 'CRM Google Sheet',
    origin: pick(row,['Origen','origin','fuente','Fuente']),
    organization: pick(row,[
      'Organización / Local','Organizacion / Local','Organización','Organizacion','Local','Empresa','organization',
      'empresa_entidad','Empresa / entidad','Entidad','sala_lugar','Sala / lugar','Sala','Lugar','contacto','Contacto'
    ]),
    opportunityType: pick(row,['Tipo oportunidad','Tipo de oportunidad','opportunityType','tipo_evento','Tipo evento','Evento']),
    segment: pick(row,['Segmento','segment']),
    municipality: pick(row,['Municipio / Provincia','Municipio','Provincia','Ciudad','city','municipality','ciudad']),
    address: pick(row,['Dirección','Direccion','address','direccion']),
    email: pick(row,['Email','Correo','Correo electrónico','email']),
    emailCc: pick(row,['Email CC','CC','emailCc']),
    phone: pick(row,['Teléfono','Telefono','phone','telefono','WhatsApp']),
    web: pick(row,['Web','web']),
    sourceUrl: pick(row,['Fuente URL','URL fuente','sourceUrl']),
    priority: pick(row,['Prioridad','priority']) || 'Media',
    send: pick(row,['Enviar','send']) || 'Revisar',
    sendStatus: pick(row,['Estado envío','Estado envio','sendStatus','estado','Estado']) || 'Pendiente',
    sendDate: pick(row,['Fecha envío','Fecha envio','sendDate']),
    sendError: pick(row,['Error envío','Error envio','sendError']),
    sentSubject: pick(row,['Asunto enviado','sentSubject']),
    responseReceived: pick(row,['Respuesta recibida','responseReceived']),
    responseDate: pick(row,['Fecha respuesta','responseDate']),
    contactPerson: pick(row,['Persona contacto','Persona de contacto','contactPerson','contacto','Contacto']),
    contactPhone: pick(row,['Teléfono contacto','Telefono contacto','contactPhone']),
    interest: pick(row,['Interés','Interes','interest']),
    availability: pick(row,['Disponibilidad / fechas','Disponibilidad','Fechas','availability','fecha_evento','Fecha evento','ventana_fecha','Ventana fecha']),
    conditions: pick(row,['Condiciones','conditions']),
    budget: pick(row,['Caché / presupuesto','Cache / presupuesto','Presupuesto','budget','importe_o_rango','Importe o rango']),
    technicalRequirements: pick(row,['Requisitos técnicos','Requisitos tecnicos','technicalRequirements']),
    nextAction: pick(row,['Próxima acción','Proxima accion','nextAction','siguiente_paso','Siguiente paso']) || 'Revisar siguiente paso',
    nextActionDate: pick(row,['Fecha próxima acción','Fecha proxima accion','nextActionDate','fecha_siguiente_paso','Fecha siguiente paso']),
    followNotes: pick(row,['Notas seguimiento','followNotes','notas','Notas']),
    lastImport: pick(row,['Última importación','Ultima importacion','lastImport','actualizado_en','Actualizado en']),
    originNotes: pick(row,['Observaciones origen','originNotes']),
    lastEmailReceived: pick(row,['Último email recibido','Ultimo email recibido','lastEmailReceived','ultima_respuesta_email','Última respuesta email']),
    responseSender: pick(row,['Email remitente respuesta','responseSender']),
    sendDossier: pick(row,['Enviar dossier','sendDossier']),
    dossierSent: pick(row,['Dossier enviado','dossierSent']),
    dossierSendDate: pick(row,['Fecha envío dossier','Fecha envio dossier','dossierSendDate']),
    dossierResponseType: pick(row,['Tipo respuesta dossier','dossierResponseType']),
    dossierNotes: pick(row,['Notas dossier','dossierNotes']),
    dossierStatus: pick(row,['Estado dossier','dossierStatus']),
    raw: row
  };
}
function applyCRMFromSheetRows(rows){
  if(!rows.length) throw new Error('La hoja no contiene filas útiles.');
  const headers = rows[0].map(h=>String(h||'').trim());
  const items = rows.slice(1)
    .map((r,i)=>rowObjectFromHeaders(headers,r))
    .map((row,i)=>crmFromSheetRow(row,i+1,i))
    .filter(x=>x.organization || x.email || x.phone || x.contactPerson || x.campaign);
  if(!items.length) throw new Error('No se han detectado registros CRM útiles en la hoja.');
  db.crm = items;
  db.createdFrom.googleSheetUserUrl = GOOGLE_SHEET_MASTER.userUrl;
  db.createdFrom.lastImport = new Date().toLocaleString('es-ES') + ' · Google Sheet maestro';
  db.sheetSync = {
    source: 'Google Sheet maestro',
    spreadsheetId: GOOGLE_SHEET_MASTER.spreadsheetId,
    gid: GOOGLE_SHEET_MASTER.gid,
    records: items.length,
    updatedAt: new Date().toISOString(),
    status: 'ok'
  };
}
function appEnheEndpointUrl(params={}){
  const url = new URL(GOOGLE_SHEET_MASTER.appsScriptUrl);
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k, v));
  url.searchParams.set('ts', String(Date.now()));
  return url.toString();
}
function appsScriptJSONP(params={}){
  return new Promise((resolve,reject)=>{
    if(!GOOGLE_SHEET_MASTER.appsScriptUrl) return reject(new Error('No hay URL /exec de Apps Script configurada.'));
    const cb='APP_ENHE_JSONP_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const script=document.createElement('script');
    const timeout=setTimeout(()=>{
      cleanup();
      reject(new Error('Tiempo agotado leyendo Apps Script.'));
    }, 25000);
    function cleanup(){
      clearTimeout(timeout);
      try{delete window[cb];}catch(e){window[cb]=undefined;}
      script.remove();
    }
    window[cb]=function(payload){
      cleanup();
      resolve(payload);
    };
    script.onerror=function(){
      cleanup();
      reject(new Error('No se pudo cargar el endpoint de Apps Script.'));
    };
    script.src=appEnheEndpointUrl(Object.assign({}, params, {callback:cb}));
    document.head.appendChild(script);
  });
}

function isAdminActive(){
  return document.body.classList.contains('admin-enabled') ||
    localStorage.getItem('app_enhe_admin_local_unlocked_v2') === '1';
}

function sheetWriteEnabled(){
  return !!(GOOGLE_SHEET_MASTER && GOOGLE_SHEET_MASTER.appsScriptUrl);
}

function attendanceToSheetFields(attendance){
  const out={};
  const map={
    miguel_voz:'asistencia_miguel',
    miguel:'asistencia_miguel',
    esther:'asistencia_esther',
    lorenzo:'asistencia_lorenzo',
    oscar:'asistencia_oscar',
    jeffrey:'asistencia_jeffrey',
    pepe:'asistencia_pepe'
  };
  Object.keys(map).forEach(id=>{
    const v=attendance && attendance[id];
    if(v){
      out[map[id]] = typeof v === 'string' ? v : (v.status || '');
    }
  });
  return out;
}

function concertToSheetRow(c){
  return Object.assign({
    id:c.id,
    ID:c.id,
    estado:c.status || '',
    Estado:c.status || '',
    fecha:c.date || '',
    Fecha:c.date || '',
    hora:c.time || '',
    Hora:c.time || '',
    titulo:c.eventName || '',
    'Sala / Evento':c.eventName || c.venue || '',
    sala_lugar:c.venue || '',
    ciudad:c.city || '',
    direccion:c.address || '',
    entrada:c.publicInfo || '',
    cartel_url:c.posterUrl || '',
    cartel_titulo:c.posterTitle || '',
    notas_publicas:c.publicInfo || '',
    notas_produccion:c.notes || '',
    Caché:c.fee || '',
    actualizado_en:new Date().toISOString()
  }, attendanceToSheetFields(c.attendance||{}));
}

function rehearsalToSheetRow(r){
  return Object.assign({
    id:r.id,
    ID:r.id,
    fecha:r.date || '',
    Fecha:r.date || '',
    hora_inicio:r.startTime || '',
    hora_fin:r.endTime || '',
    Hora:[r.startTime||'',r.endTime||''].filter(Boolean).join('-'),
    lugar:r.place || '',
    Lugar:r.place || '',
    estado:r.status || '',
    Estado:r.status || '',
    objetivo:r.objective || '',
    temas_ids:r.allSongs ? 'TODOS' : JSON.stringify(r.songIds || []),
    temas_texto:r.allSongs ? 'Todos los temas' : (r.songTitles || ''),
    Temas:r.allSongs ? 'Todos los temas' : (r.songTitles || ''),
    notas:r.notes || '',
    Notas:r.notes || '',
    actualizado_en:new Date().toISOString()
  }, attendanceToSheetFields(r.attendance||{}));
}

function taskToSheetRow(t){
  return {
    id:t.id,
    ID:t.id,
    titulo:t.title || '',
    Tarea:t.title || '',
    responsable:t.owner || '',
    Responsable:t.owner || '',
    fecha:t.due || '',
    Fecha:t.due || '',
    estado:t.status || '',
    Estado:t.status || '',
    prioridad:t.priority || '',
    Prioridad:t.priority || '',
    area:t.area || '',
    Área:t.area || '',
    notas:t.notes || '',
    Notas:t.notes || '',
    actualizado_en:new Date().toISOString()
  };
}

function localPaymentToSheetRow(patch){
  const id=normalizeMemberKey(patch.memberId || patch.name);
  const name=memberDisplayName(id);
  return {
    mes:normalizeMonthValue(patch.month) || new Date().toISOString().slice(0,7),
    Mes:normalizeMonthValue(patch.month) || new Date().toISOString().slice(0,7),
    memberId:id,
    'ID Miembro':id,
    nombre:name,
    Nombre:name,
    cuota:parseEuroValue(patch.amount) || 36.17,
    Cuota:parseEuroValue(patch.amount) || 36.17,
    pagado:isPaymentPaid(patch.paid) ? 'SI' : 'NO',
    Pagado:isPaymentPaid(patch.paid) ? 'SI' : 'NO',
    fecha_pago:patch.paidDate || '',
    'Fecha pago':patch.paidDate || '',
    notas:patch.notes || '',
    Notas:patch.notes || '',
    actualizado_en:new Date().toISOString(),
    'Última actualización':new Date().toISOString()
  };
}


function ladyStoneTicketToSheetRow(t){
  return {
    id:t.id,
    ID:t.id,
    Proyecto:t.project||'',
    Fecha:t.date||'',
    Evento:t.event||'',
    Sala:t.venue||'',
    Modelo_economico:t.agreementType||'',
    Modelo_economico_texto:t.agreementLabel||agreementLabel(t.agreementType),
    Canal:t.channel||'',
    Enlace:t.url||'',
    Aforo:t.capacity||0,
    Invitaciones:t.invites||0,
    Cache_fijo:t.cacheFixed||0,
    Minimo_garantizado:t.minimumGuarantee||0,
    Extra_sonido:t.extraSound||0,
    Extra_luces:t.extraLights||0,
    Extra_desplazamiento:t.extraTravel||0,
    Extra_otros:t.extraOther||0,
    Extras_total:t.extrasTotal||0,
    Precio_anticipada:t.priceAdvance||0,
    Vendidas_anticipada:t.soldAdvance||0,
    Precio_taquilla:t.priceDoor||0,
    Vendidas_taquilla:t.soldDoor||0,
    Porcentaje_taquilla:t.ticketPct||0,
    Entradas_vendidas:t.soldTotal||0,
    Taquilla_bruta:t.gross||0,
    Taquilla_neta_sin_iva:t.netAfterVat||0,
    IVA_cultural:t.vatAmount||0,
    Importe_porcentaje_taquilla:t.ticketPctAmount||0,
    Barra_bruta:t.barGross||0,
    Porcentaje_barra:t.barPct||0,
    Base_barra:t.barBaseMode||'',
    Barra_base_calculo:t.barBase||0,
    Horario_barra:t.barWindow||'',
    Importe_porcentaje_barra:t.barPctAmount||0,
    Canon_sala:t.canon||0,
    SGAE_modo:t.sgaeMode||'',
    SGAE_estimado:t.sgaeAmount||0,
    Otros_gastos:t.otherExpenses||0,
    Ajuste_manual:t.manualAmount||0,
    Importe_base_acuerdo:t.agreementGross||0,
    Base_calculo:t.baseDescription||'',
    Neto_estimado:t.netEstimate||0,
    Neto_por_proyecto:t.netPerProject||0,
    Reparto_bandas:t.splitBands||'',
    Estado:t.status||'Previsión',
    Notas:t.notes||'',
    actualizado_en:new Date().toISOString()
  };
}
function ladyStoneMovementToSheetRow(m){
  return {
    id:m.id, ID:m.id, Proyecto:m.project||'', Fecha:m.date||'', Tipo:m.type||'', Concepto:m.concept||'', Importe:m.amount||0,
    Pagado_por:m.paidBy||'', Forma_pago:m.method||'', Estado:m.status||'Registrado', Notas:m.notes||'', actualizado_en:new Date().toISOString()
  };
}
function ladyStoneInvoiceToSheetRow(i){
  return {
    id:i.id, ID:i.id, Proyecto:i.project||'', Fecha:i.date||'', Cliente:i.client||'', Concepto:i.concept||'', Importe:i.amount||0,
    Estado:i.status||'', Quien_factura:i.invoiceBy||'', Fecha_cobro_prevista:i.dueDate||'', Notas:i.notes||'', actualizado_en:new Date().toISOString()
  };
}
function pushLadyStoneTicketToSheet(t){return pushSheetRow('upsertLadyStoneTicket', ladyStoneTicketToSheetRow(t));}
function pushLadyStoneMovementToSheet(m){return pushSheetRow('upsertLadyStoneMovement', ladyStoneMovementToSheetRow(m));}
function pushLadyStoneInvoiceToSheet(i){return pushSheetRow('upsertLadyStoneInvoice', ladyStoneInvoiceToSheetRow(i));}

function pushSheetRow(action,row,opts={}){
  if(!sheetWriteEnabled()) return Promise.reject(new Error('No hay endpoint Apps Script configurado.'));
  if(!isAdminActive() && !opts.allowUser) return Promise.reject(new Error('Modo usuario: no se puede escribir en Google Sheet.'));
  sheetStatus('Guardando en Google Sheet maestro…');
  return appsScriptJSONP({action, key:'1929', row:JSON.stringify(row)})
    .then(payload=>{
      if(!payload || payload.ok===false) throw new Error(payload?.error || 'No se pudo guardar en Google Sheet.');
      sheetStatus('Guardado en Google Sheet maestro. Actualizando vista…','ok');
      return syncCRMFromGoogleSheet({silent:true, afterWrite:true}).then(()=>payload);
    })
    .catch(err=>{
      sheetStatus('Guardado solo en este navegador. Falló Google Sheet: '+esc(err.message||err),'bad');
      throw err;
    });
}

function deleteSheetRow(action,row,opts={}){
  if(!sheetWriteEnabled()) return Promise.reject(new Error('No hay endpoint Apps Script configurado.'));
  if(!isAdminActive() && !opts.allowUser) return Promise.reject(new Error('Modo usuario: no se puede borrar en Google Sheet.'));
  sheetStatus('Borrando en Google Sheet maestro…');
  return appsScriptJSONP({action, key:'1929', row:JSON.stringify(row)})
    .then(payload=>{
      if(!payload || payload.ok===false) throw new Error(payload?.error || 'No se pudo borrar en Google Sheet.');
      sheetStatus('Borrado en Google Sheet maestro. Actualizando vista…','ok');
      return syncCRMFromGoogleSheet({silent:true, afterWrite:true}).then(()=>payload);
    })
    .catch(err=>{
      sheetStatus('Borrado solo en este navegador. Falló Google Sheet: '+esc(err.message||err),'bad');
      throw err;
    });
}

function deleteLadyStoneTicketFromSheet(id){return deleteSheetRow('deleteLadyStoneTicket', {id:id, ID:id});}
function deleteLadyStoneMovementFromSheet(id){return deleteSheetRow('deleteLadyStoneMovement', {id:id, ID:id});}
function deleteLadyStoneInvoiceFromSheet(id){return deleteSheetRow('deleteLadyStoneInvoice', {id:id, ID:id});}

function pushConcertToSheet(c){
  return pushSheetRow('upsertConcert', concertToSheetRow(c));
}

function pushRehearsalToSheet(r){
  return pushSheetRow('upsertRehearsal', rehearsalToSheetRow(r));
}

function pushTaskToSheet(t){
  return pushSheetRow('upsertTask', taskToSheetRow(t));
}

function pushLocalPaymentToSheet(p){
  return pushSheetRow('upsertLocalPayment', localPaymentToSheetRow(p));
}

function alertSheetWriteError(err){
  alert('El cambio se ha guardado en este navegador, pero NO se ha podido enviar a Google Sheet.\\n\\nMotivo: '+(err.message||err)+'\\n\\nHasta que no se guarde en Google Sheet, el móvil y otros equipos no verán ese cambio.');
}


function sheetListFromPayload(payload){
  if(!payload || !payload.sheets) return [];
  return Object.entries(payload.sheets).map(([key,value])=>Object.assign({key}, value || {}));
}
function sameSheetName(a,b){
  return norm(String(a||'')).replace(/[^a-z0-9]/g,'') === norm(String(b||'')).replace(/[^a-z0-9]/g,'');
}
function findPayloadSheet(payload, names=[], gid=''){
  const sheets=sheetListFromPayload(payload);
  if(gid){
    const byGid=sheets.find(s=>String(s.gid||'')===String(gid));
    if(byGid) return byGid;
  }
  for(const name of names){
    const exact=sheets.find(s=>sameSheetName(s.name||s.key, name));
    if(exact) return exact;
  }
  for(const name of names){
    const partial=sheets.find(s=>sameSheetName(s.name||s.key, name) || sameSheetName(name, s.name||s.key));
    if(partial) return partial;
  }
  return null;
}
function rowsFromPayloadSheet(sheet){
  return sheet && Array.isArray(sheet.rows) ? sheet.rows : [];
}
function rowsLookLikeCRM(rows){
  return rows.some(r=>pick(r,['Email','email','Correo','telefono','Teléfono','Empresa','Organización','empresa_entidad','Campaña','campaign','contacto']));
}
function rowsLookLikeConcerts(rows){
  return rows.some(r=>pick(r,['fecha','Fecha','titulo','Título','sala_lugar','Sala / lugar','eventName','Concierto','cartel_url']));
}
function rowsLookLikeSongs(rows){
  return rows.some(r=>pick(r,['titulo','Título','title','Tema','artista','Artista','tono_actual_banda','tono_propuesto_miguel']));
}
function rowsLookLikeRehearsals(rows){
  return rows.some(r=>pick(r,['fecha','Fecha','hora_inicio','Hora inicio','temas_ids','temas_texto','objetivo','Ensayo']));
}
function firstSheetByRows(payload, predicate){
  return sheetListFromPayload(payload).find(s=>predicate(rowsFromPayloadSheet(s)));
}
function applyCRMObjectsFromSheet(rows){
  const items=rows
    .map((row,i)=>crmFromSheetRow(row,i+1,i))
    .filter(x=>x.organization || x.email || x.phone || x.contactPerson || x.campaign);
  if(items.length) db.crm=items;
  return items.length;
}
function memberAttendanceFromRow(row, prefix='asistencia_'){
  const ids=['miguel_voz','esther','lorenzo','oscar','jeffrey','pepe'];
  const aliases={
    miguel_voz:['asistencia_miguel','Miguel','Asistencia Miguel'],
    esther:['asistencia_esther','Esther','Asistencia Esther'],
    lorenzo:['asistencia_lorenzo','Lorenzo','Asistencia Lorenzo'],
    oscar:['asistencia_oscar','Oscar','Asistencia Oscar'],
    jeffrey:['asistencia_jeffrey','Jeffrey','Asistencia Jeffrey'],
    pepe:['asistencia_pepe','Pepe','Asistencia Pepe']
  };
  const attendance={};
  ids.forEach(id=>{
    const st=pick(row, aliases[id]) || 'Pendiente';
    attendance[id]={status:st||'Pendiente', notes:''};
  });
  return attendance;
}
function mapConcertRow(row,i){
  return {
    id: Number(pick(row,['id','ID'])) || i+1,
    date: String(pick(row,['fecha','Fecha','date','Fecha evento'])||'').slice(0,10),
    time: String(pick(row,['hora','Hora','time'])||'').slice(0,5),
    eventName: pick(row,['titulo','Título','eventName','Concierto','Evento']) || 'Concierto Ñ Mayúscula',
    venue: pick(row,['sala_lugar','Sala / lugar','venue','Sala','Lugar','lugar']),
    city: pick(row,['ciudad','Ciudad','city']),
    type: pick(row,['tipo','Tipo','type']) || 'Concierto',
    status: pick(row,['estado','Estado','status']) || 'Pendiente',
    fee: Number(String(pick(row,['fee','caché','Cache','Importe','importe','importe_o_rango'])||'').replace(/[^\d.,-]/g,'').replace(',','.')) || 0,
    deposit: Number(String(pick(row,['deposit','anticipo','Anticipo'])||'').replace(/[^\d.,-]/g,'').replace(',','.')) || 0,
    paid: Number(String(pick(row,['paid','cobrado','Cobrado'])||'').replace(/[^\d.,-]/g,'').replace(',','.')) || 0,
    sound: pick(row,['sound','sonido','Sonido']),
    contactId: Number(pick(row,['contactId','contacto_id'])) || 0,
    posterUrl: pick(row,['cartel_url','Cartel URL','posterUrl','poster_url']),
    posterThumbUrl: pick(row,['cartel_thumb_url','posterThumbUrl','poster_thumb_url']) || pick(row,['cartel_url','posterUrl']),
    posterTitle: pick(row,['cartel_titulo','Cartel título','posterTitle']),
    publicInfo: pick(row,['notas_publicas','Notas públicas','publicInfo','entrada','Entrada','direccion','Dirección']),
    notes: pick(row,['notas_produccion','Notas producción','notes','notas','Notas']),
    attendance: memberAttendanceFromRow(row),
    attendanceNotes: pick(row,['attendanceNotes','notas_asistencia','Notas asistencia']),
    raw: row
  };
}
function applyConcertsFromSheet(rows){
  const items=rows.map(mapConcertRow).filter(x=>x.date || x.eventName || x.venue || x.posterUrl);
  if(items.length) db.concerts=items;
  return items.length;
}
function parseSongIds(value){
  const text=String(value||'').trim();
  if(!text) return [];
  return text.split(/[;,|]/).map(x=>Number(String(x).trim())).filter(Boolean);
}
function mapRehearsalRow(row,i){
  const allSongs=norm(pick(row,['todos_los_temas','Todos los temas','allSongs'])).includes('si') || norm(pick(row,['temas_ids','temas_ids'])).includes('todos');
  return {
    id: Number(pick(row,['id','ID'])) || i+1,
    date: String(pick(row,['fecha','Fecha','date'])||'').slice(0,10),
    startTime: String(pick(row,['hora_inicio','Hora inicio','startTime'])||'').slice(0,5),
    endTime: String(pick(row,['hora_fin','Hora fin','endTime'])||'').slice(0,5),
    place: pick(row,['lugar','Lugar','place','local','Local']),
    status: pick(row,['estado','Estado','status']) || 'Pendiente',
    objective: pick(row,['objetivo','Objetivo','objective']),
    notes: pick(row,['notas','Notas','notes']),
    allSongs,
    songIds: allSongs ? [] : parseSongIds(pick(row,['temas_ids','Temas IDs','songIds'])),
    songTitles: pick(row,['temas_texto','Temas texto','Temas','songs']),
    attendance: memberAttendanceFromRow(row),
    raw: row
  };
}
function applyRehearsalsFromSheet(rows){
  const items=rows.map(mapRehearsalRow).filter(x=>x.date || x.place || x.objective || x.songIds.length || x.songTitles);
  if(items.length) db.rehearsals=items;
  return items.length;
}
function mapSongRow(row,i){
  return {
    id: Number(pick(row,['id','ID'])) || i+1,
    order: Number(pick(row,['orden','Orden','order'])) || i+1,
    title: pick(row,['titulo','Título','title','Tema']) || 'Tema sin título',
    titleCanonical: norm(pick(row,['titulo','Título','title','Tema'])).toUpperCase(),
    artist: pick(row,['artista','Artista','artist']),
    versionReference: pick(row,['versionReference','referencia','Referencia']),
    singer: pick(row,['voz_principal','Voz principal','singer','Voz']),
    leadVocal: pick(row,['voz_asignada','Voz asignada','leadVocal','voz_principal']),
    duration: pick(row,['duracion_directo','Duración directo','duration','duracion','Duración']),
    durationLive: pick(row,['duracion_directo','Duración directo','durationLive','duration']),
    durationOriginal: pick(row,['duracion_original','Duración original','durationOriginal']),
    durationStatus: pick(row,['durationStatus','estado_duracion','Estado duración']) || 'Google Sheet',
    tone: pick(row,['tono_actual_banda','Tono actual banda','tone','tono','Tono']),
    originalKey: pick(row,['tono_original','Tono original','originalKey']),
    currentKey: pick(row,['tono_actual_banda','Tono actual banda','currentKey','tone']),
    rehearsalKey: pick(row,['tono_propuesto_ensayo','Tono propuesto ensayo','rehearsalKey']),
    keyStatus: pick(row,['keyStatus','estado_tono','Estado tono']) || 'Google Sheet',
    keyMiguel: pick(row,['tono_propuesto_miguel','Tono propuesto Miguel','keyMiguel']),
    keyEsther: pick(row,['tono_propuesto_esther','Tono propuesto Esther','keyEsther']),
    keyLorenzo: pick(row,['tono_propuesto_lorenzo','Tono propuesto Lorenzo','keyLorenzo']),
    transposeNotes: pick(row,['notas_transporte','Notas transporte','transposeNotes']),
    capo: pick(row,['capo','Capo','cejilla','Cejilla']),
    bpm: pick(row,['bpm','BPM']),
    block: pick(row,['bloque','Bloque','block']),
    status: pick(row,['estado','Estado','status']) || 'Activo',
    spotifyUrl: pick(row,['spotify_url','Spotify','spotifyUrl']),
    spotifyPlaylistUrl: db.createdFrom?.spotifyPlaylistUrl || '',
    youtubeUrl: pick(row,['youtube_url','YouTube','youtubeUrl']),
    chordsUrl: pick(row,['acordes_url','Acordes URL','chordsUrl']),
    structure: pick(row,['estructura','Estructura','structure']),
    chordsText: pick(row,['tablatura','Tabla','letra_acordes','Letra acordes','chordsText']),
    notes: pick(row,['notas_interpretacion','Notas interpretación','notes']),
    internalNotes: pick(row,['notas_internas','Notas internas','internalNotes']),
    validatedAt: pick(row,['validado_en_ensayo','Validado en ensayo','validatedAt']),
    raw: row
  };
}
function applySongsFromSheet(rows){
  const items=rows.map(mapSongRow).filter(x=>x.title && x.title!=='Tema sin título');
  if(items.length) db.repertoire=items;
  return items.length;
}
function applySetlistFromSheet(rows){
  const items=rows.map((row,i)=>({
    order:Number(pick(row,['orden','Orden','order'])) || i+1,
    title:pick(row,['titulo','Título','title','Tema']),
    vocal:pick(row,['voz','Voz','vocal']),
    key:pick(row,['tono','Tono','key']),
    duration:pick(row,['duracion','Duración','duration']),
    block:pick(row,['bloque','Bloque','block']) || 'Setlist',
    notes:pick(row,['notas','Notas','notes'])
  })).filter(x=>x.title);
  if(!items.length) return 0;
  db.strategicSetlist = {
    title:'Setlist desde Google Sheet',
    subtitle:'Datos sincronizados desde Google Sheet maestro',
    musicDuration:'',
    agileDuration:'',
    extendedDuration:'',
    legend:unique(items.map(x=>x.vocal).filter(Boolean)),
    rule:'Validar orden definitivo antes de cada concierto.',
    finalMandatory:'',
    promoterReading:'Setlist de trabajo sincronizado desde Google Sheet.',
    blocks:[{
      id:1,
      name:'SETLIST',
      objective:'Orden de concierto cargado desde Google Sheet.',
      musicDuration:'',
      stageControl:'',
      songs:items
    }]
  };
  return items.length;
}

function mapLocalPaymentRow(row,i){
  const memberRaw = pick(row,['ID Miembro','id_miembro','miembro_id','memberId','member_id']) || pick(row,['Nombre','nombre','miembro','name']);
  const cuotaRaw = pick(row,['Cuota','cuota','importe','amount']);
  const pagadoRaw = pick(row,['Pagado','pagado','paid','estado_pago','Estado pago']);
  return {
    id: Number(pick(row,['id','ID'])) || i+1,
    month: normalizeMonthValue(pick(row,['Mes','mes','month'])),
    memberId: normalizeMemberKey(memberRaw),
    name: memberDisplayName(memberRaw, pick(row,['Nombre','nombre','miembro','name'])),
    amount: parseEuroValue(cuotaRaw),
    paid: isPaymentPaid(pagadoRaw) ? 'SI' : 'NO',
    paidDate: pick(row,['Fecha pago','fecha_pago','paidDate']),
    updatedAt: pick(row,['Última actualización','actualizado_en','updatedAt']),
    notes: pick(row,['Notas','notas','notes']),
    raw: row
  };
}
function applyLocalPaymentsFromSheet(rows){
  const mapped=rows.map(mapLocalPaymentRow);
  const items=consolidateLocalPaymentRows(mapped);
  if(items.length) db.localPayments=items;
  return items.length;
}
function applyAllFromGoogleSheetPayload(payload){
  if(!payload || payload.ok===false) throw new Error(payload?.error || 'Respuesta no válida de Apps Script.');
  const report={crm:0, concerts:0, rehearsals:0, songs:0, setlist:0, local:0};

  const crmSheet = findPayloadSheet(payload, ['CRM','CRM_GENERAL','CRM GENERAL','CRM_MAESTRO','CRM MAESTRO'], GOOGLE_SHEET_MASTER.gid) || firstSheetByRows(payload, rowsLookLikeCRM);
  const concertSheet = findPayloadSheet(payload, ['CONCIERTOS','Conciertos','BOLOS','Bolos','EVENTOS','Eventos']) || firstSheetByRows(payload, rowsLookLikeConcerts);
  const rehearsalSheet = findPayloadSheet(payload, ['ENSAYOS','Ensayos','CALENDARIO_ENSAYOS','Calendario ensayos']) || firstSheetByRows(payload, rowsLookLikeRehearsals);
  const songsSheet = findPayloadSheet(payload, ['CANCIONES','Canciones','REPERTORIO','Repertorio']) || firstSheetByRows(payload, rowsLookLikeSongs);
  const setlistSheet = findPayloadSheet(payload, ['SETLIST','Setlist','SETLIST_CONCIERTO','Setlist concierto']);

  const crmRows=rowsFromPayloadSheet(crmSheet);
  if(crmRows.length) report.crm=applyCRMObjectsFromSheet(crmRows);

  const concertRows=rowsFromPayloadSheet(concertSheet);
  if(concertRows.length) report.concerts=applyConcertsFromSheet(concertRows);

  const rehearsalRows=rowsFromPayloadSheet(rehearsalSheet);
  if(rehearsalRows.length) report.rehearsals=applyRehearsalsFromSheet(rehearsalRows);

  const songRows=rowsFromPayloadSheet(songsSheet);
  if(songRows.length) report.songs=applySongsFromSheet(songRows);

  const setlistRows=rowsFromPayloadSheet(setlistSheet);
  if(setlistRows.length) report.setlist=applySetlistFromSheet(setlistRows);

  const localSheet = findPayloadSheet(payload, ['PAGOS_LOCAL','LOCAL_ENSAYO_PAGOS','Pagos local','Local ensayo']);
  const rawLocalRows = payload?.rawSheets?.PAGOS_LOCAL?.rows || payload?.sheets?.PAGOS_LOCAL?.rows || [];
  const normalizedLocalRows = Array.isArray(payload?.data?.pagosLocal) ? payload.data.pagosLocal : [];
  const localRows = rawLocalRows.length ? rawLocalRows : (normalizedLocalRows.length ? normalizedLocalRows : rowsFromPayloadSheet(localSheet));
  report.local=applyLocalPaymentsFromSheet(localRows);
  const localMensual=parseEuroValue(payload?.data?.localMensual || payload?.localMensual || 0);
  if(localMensual){
    db.localConfig=Object.assign({}, db.localConfig||{}, {monthlyAmount:localMensual, source:'CONFIG_GRUPO / Google Sheet', updatedAt:new Date().toISOString()});
  }

  const ladyTicketsRows = rowsFromPayloadSheet(findPayloadSheet(payload, ['LADY_STONE_ENTRADAS','ENTRADAS','TAQUILLA']));
  const ladyMovementsRows = rowsFromPayloadSheet(findPayloadSheet(payload, ['LADY_STONE_MOVIMIENTOS','MOVIMIENTOS']));
  const ladyInvoicesRows = rowsFromPayloadSheet(findPayloadSheet(payload, ['LADY_STONE_FACTURAS','FACTURAS','LIQUIDACIONES']));
  applyLadyStoneFromSheet(ladyTicketsRows, ladyMovementsRows, ladyInvoicesRows);

  const formacionPayload = Array.isArray(payload?.data?.miembros) ? payload.data.miembros : payload.formacion;
  if(Array.isArray(formacionPayload) && formacionPayload.length){
    db.bandMembers=formacionPayload.map(m=>({
      id: norm(m.id||m.nombre||m.name).includes('miguel') ? 'miguel_voz' : (m.id || norm(m.nombre||m.name).replace(/[^a-z0-9]/g,'_')),
      name: m.nombre || m.name || '',
      role: m.rol || m.role || m.instrumento || ''
    })).filter(x=>x.name);
  }

  if(false && Array.isArray(payload.formacion) && payload.formacion.length){
    db.bandMembers=payload.formacion.map(m=>({
      id: norm(m.nombre||m.name).includes('miguel') ? 'miguel_voz' : norm(m.nombre||m.name).replace(/[^a-z0-9]/g,'_'),
      name: m.nombre || m.name || '',
      role: m.rol || m.role || ''
    })).filter(x=>x.name);
  }

  db.createdFrom.googleSheetUserUrl = GOOGLE_SHEET_MASTER.userUrl;
  db.createdFrom.lastImport = new Date().toLocaleString('es-ES') + ' · Google Sheet maestro';
  db.sheetSync = {
    source: 'Google Sheet maestro / Apps Script',
    spreadsheetId: GOOGLE_SHEET_MASTER.spreadsheetId,
    gid: GOOGLE_SHEET_MASTER.gid,
    records: report.crm,
    concerts: report.concerts,
    rehearsals: report.rehearsals,
    songs: report.songs,
    setlist: report.setlist,
    updatedAt: new Date().toISOString(),
    status: 'ok',
    endpoint: GOOGLE_SHEET_MASTER.appsScriptUrl,
    version: payload.version || ''
  };
  return report;
}
async function syncCRMFromGoogleSheet(opts={}){
  const silent = !!opts.silent;
  try{
    sheetStatus('Sincronizando con Google Sheet maestro…');
    const payload=await appsScriptJSONP({action:'mobile'});
    const report=applyAllFromGoogleSheetPayload(payload);
    saveData();
    refreshAll();
    sheetStatus(`Google Sheet sincronizada. CRM: ${report.crm}. Conciertos: ${report.concerts}. Ensayos: ${report.rehearsals}. Canciones: ${report.songs}. Local: ${report.local || 0}.`, 'ok');
    if(!silent) alert(`Datos actualizados desde Google Sheet.\nCRM: ${report.crm}\nConciertos: ${report.concerts}\nEnsayos: ${report.rehearsals}\nCanciones: ${report.songs}\nLocal ensayo: ${report.local || 0}`);
    return true;
  }catch(err){
    db.sheetSync = Object.assign({}, db.sheetSync||{}, {status:'error', error:String(err.message||err), updatedAt:new Date().toISOString(), endpoint: GOOGLE_SHEET_MASTER.appsScriptUrl});
    sheetStatus('SIN CONEXIÓN REAL CON GOOGLE SHEET en este dispositivo. No se debe fiar de estos datos hasta sincronizar. Motivo: '+esc(err.message||err), 'bad');
    if(!silent) alert('No se pudo sincronizar con Google Sheet: '+(err.message||err));
    return false;
  }
}

function statusClass(s){
  const x=norm(s);
  if(x.includes('enviado')||x.includes('confirmado')||x.includes('realizado')||x.includes('actualizado')) return 'status s-green';
  if(x.includes('sin email')||x.includes('revisar')||x.includes('pendiente')||x.includes('borrador')||x.includes('pre')) return 'status s-amber';
  if(x.includes('no enviar')||x.includes('descartado')||x.includes('cancelado')||x.includes('error')) return 'status s-red';
  if(x.includes('respuesta')||x.includes('negociacion')||x.includes('dossier')) return 'status s-blue';
  if(x.includes('alta')||x.includes('muy')) return 'status s-gold';
  return 'status s-gray';
}
function badge(s){return `<span class="${statusClass(s)}">${esc(s||'—')}</span>`;}
function setTab(id, opts={}){
  const section = document.getElementById(id);
  if(!section) return;
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  section.classList.add('active');
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active', b.dataset.tab===id));
  if(id==='crm') renderCRM();
  if(id==='gmail') renderGmail();
  if(id==='followup') renderFollowup();
  if(id==='concerts') renderConcerts();
  if(id==='rehearsals') renderRehearsals();
  if(id==='local') renderLocalPayments();
  if(id==='ladyStone') renderLadyStoneAdmin();
  if(id==='budget') calcBudget();
  if(id==='repertoire') renderRepertoire();
  if(id==='setlist') renderSetlist();
  if(id==='dossier') renderDossier();
  if(id==='templates') {renderContactOptions();renderTemplates();}
  if(id==='tasks') renderTasks();
  if(opts.updateUrl !== false){
    try{
      const url = new URL(window.location.href);
      url.searchParams.set('tab', id);
      window.history.replaceState({}, '', url);
    }catch(e){}
  }
  if(opts.scroll !== false){
    requestAnimationFrame(()=>{
      section.scrollIntoView({behavior:'smooth', block:'start'});
      section.setAttribute('tabindex','-1');
      try{ section.focus({preventScroll:true}); }catch(e){}
    });
  }
}
function renderNav(){
  const nav=document.getElementById('nav');
  nav.innerHTML=tabs.map(t=>`<button data-tab="${t[0]}" onclick="setTab('${t[0]}')"><span>${t[2]}</span>${t[1]}<small>${tabCount(t[0])}</small></button>`).join('');
}
function tabCount(id){
  if(id==='crm')return db.crm.length;
  if(id==='gmail')return db.gmailResponses.length;
  if(id==='concerts')return db.concerts.length;
  if(id==='rehearsals')return (db.rehearsals||[]).length;
  if(id==='tasks')return db.tasks.length;
  if(id==='ladyStone')return (ensureLadyStone().tickets.length + ensureLadyStone().movements.length + ensureLadyStone().invoices.length);
  if(id==='repertoire')return db.repertoire.length;
  if(id==='setlist')return setlistRows().length;
  return '';
}

function renderSheetSyncPanel(){
  const el=document.getElementById('sheetSyncMini');
  if(!el) return;
  const sync=db.sheetSync||{};
  const status=sync.status==='ok'?'Sincronizado':'Pendiente de sincronizar';
  const updated=sync.updatedAt ? new Date(sync.updatedAt).toLocaleString('es-ES') : (db.createdFrom.lastImport || '—');
  el.innerHTML=`
    <div class="detailItem">
      <small>Fuente de datos</small>
      <strong>Google Sheet maestro</strong><br>
      <span style="color:var(--muted)">Estado: ${esc(status)} · Última lectura: ${esc(updated)} · Endpoint Apps Script activo</span>
    </div>
    <div class="actions" style="margin-top:10px">
      <button class="btn gold" type="button" onclick="syncCRMFromGoogleSheet()">Actualizar todo desde Google Sheet</button>
      <a class="btn ghost" href="${esc(GOOGLE_SHEET_MASTER.userUrl)}" target="_blank" rel="noopener">Abrir Google Sheet</a>
    </div>
  `;
}

function refreshAll(){
  renderNav();
  renderSheetSyncPanel();
  document.getElementById('sideLoaded').innerHTML=`${db.crm.length} contactos · ${db.gmailResponses.length} respuestas Gmail<br>Última importación: ${esc(db.createdFrom.lastImport || '—')}`;
  document.getElementById('heroBadges').innerHTML=[
    `${db.crm.length} contactos CRM`,`${countBy(db.crm,'campaign','Salas')} salas`,`${countBy(db.crm,'campaign','Eventos/Bodas/Festejos')} eventos/bodas/festejos`,
    `${db.gmailResponses.length} respuestas Gmail`,`${(db.rehearsals||[]).length} ensayos`,`${(db.localPayments||[]).length} pagos local`,`${ensureLadyStone().tickets.length} controles asociación`,`${db.repertoire.length} canciones`,`${setlistRows().length} temas setlist`,`${db.templates.length} plantillas`
  ].map(x=>`<span class="badge">${esc(x)}</span>`).join('');
  fillFilters();
  renderDashboard();
  renderCRM();
  renderFollowup();
  renderGmail();
  renderConcerts();
  renderRehearsals();
  renderLocalPayments();
  renderLadyStoneAdmin();
  renderBudgetUI();
  renderRepertoire();
  renderSetlist();
  renderDossier();
  renderContactOptions();
  renderTemplates();
  renderTasks();
  document.getElementById('openSheet').href=db.createdFrom.googleSheetUserUrl || '#';
  document.getElementById('driveDossier').href=db.createdFrom.driveDossierUrl || '#';
}
function countBy(arr,key,value){return arr.filter(x=>String(x[key]||'')===value).length;}
function counts(arr,key){return arr.reduce((a,x)=>{const k=String(x[key]||'Sin dato');a[k]=(a[k]||0)+1;return a;},{});}
function fillSelect(id, values, label){
  const el=document.getElementById(id); if(!el)return;
  const cur=el.value;
  el.innerHTML=`<option value="">${label}</option>` + [...new Set(values.filter(Boolean))].sort().map(v=>`<option ${v===cur?'selected':''}>${esc(v)}</option>`).join('');
}
function fillFilters(){
  fillSelect('fCampaign', db.crm.map(x=>x.campaign), 'Campaña');
  fillSelect('fPriority', db.crm.map(x=>x.priority), 'Prioridad');
  fillSelect('fStatus', db.crm.map(x=>x.sendStatus), 'Estado envío');
  fillSelect('fSegment', db.crm.map(x=>x.segment), 'Segmento');
}
function renderDashboard(){
  const total=db.crm.length, sent=countBy(db.crm,'sendStatus','Enviado'), noEmail=db.crm.filter(x=>norm(x.sendStatus).includes('sin email')).length, responses=db.crm.filter(x=>x.responseReceived).length, dossier=db.crm.filter(x=>norm(x.sendDossier)==='si'||norm(x.sendDossier)==='sí').length;
  document.getElementById('kpis').innerHTML=[
    ['Contactos CRM', total, 'gold'],
    ['Emails enviados', sent, 'good'],
    ['Respuestas en CRM', responses, 'good'],
    ['Sin email / revisar', noEmail, 'warn'],
    ['Dossier pendiente', dossier, 'warn'],
    ['Respuestas Gmail', db.gmailResponses.length, 'gold'],
    ['Salas', countBy(db.crm,'campaign','Salas'), 'blue'],
    ['Eventos/Bodas/Festejos', countBy(db.crm,'campaign','Eventos/Bodas/Festejos'), 'blue']
  ].map(k=>`<div class="card kpi ${k[2]}"><strong>${k[1]}</strong><span>${k[0]}</span></div>`).join('');
  renderBars('sendBars', counts(db.crm,'sendStatus'));
  renderBars('priorityBars', counts(db.crm,'priority'));
  const actions = [
    {t:'Revisar contactos sin email', n:noEmail, tab:'followup'},
    {t:'Trabajar respuestas recibidas', n:responses, tab:'followup'},
    {t:'Enviar dossier / cerrar condiciones', n:dossier, tab:'followup'},
    {t:'Prioridad Muy alta + Alta', n:db.crm.filter(x=>['muy alta','alta'].includes(norm(x.priority))).length, tab:'crm'}
  ];
  document.getElementById('actionCards').innerHTML=actions.map(a=>`<div class="detailItem"><small>${esc(a.t)}</small><div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:22px">${a.n}</strong><button class="btn small gold" onclick="setTab('${a.tab}')">Abrir</button></div></div>`).join('');
  document.getElementById('dashResponses').innerHTML=db.gmailResponses.slice(0,5).map(r=>`<div class="detailItem"><small>${esc(r.emailDate)} · ${esc(r.senderEmail)}</small><div><strong>${esc(compact(r.subject,70))}</strong><br><span style="color:var(--muted)">${esc(compact(r.summary,120))}</span></div></div>`).join('');
}
function renderBars(id, obj){
  const max=Math.max(1,...Object.values(obj));
  document.getElementById(id).innerHTML=Object.entries(obj).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="barRow"><span>${esc(k)}</span><div class="bar"><i style="width:${Math.max(3,v/max*100)}%"></i></div><strong>${v}</strong></div>`).join('');
}
function crmFiltered(){
  const q=norm(document.getElementById('q')?.value||'');
  const campaign=document.getElementById('fCampaign')?.value||'';
  const priority=document.getElementById('fPriority')?.value||'';
  const status=document.getElementById('fStatus')?.value||'';
  const segment=document.getElementById('fSegment')?.value||'';
  const special=document.getElementById('fSpecial')?.value||'';
  let rows=db.crm.filter(x=>{
    const text=norm([x.organization,x.email,x.phone,x.municipality,x.segment,x.opportunityType,x.nextAction,x.followNotes,x.lastEmailReceived,x.sourceUrl].join(' '));
    if(q && !text.includes(q)) return false;
    if(campaign && x.campaign!==campaign) return false;
    if(priority && x.priority!==priority) return false;
    if(status && x.sendStatus!==status) return false;
    if(segment && x.segment!==segment) return false;
    if(special==='responded' && !x.responseReceived) return false;
    if(special==='noemail' && !norm(x.sendStatus).includes('sin email')) return false;
    if(special==='dossier' && !['si','sí'].includes(norm(x.sendDossier)) && !x.dossierStatus) return false;
    if(special==='next' && !x.nextAction && !x.nextActionDate) return false;
    return true;
  });
  return rows;
}
function renderCRM(){
  filteredCRM=crmFiltered();
  const tbody=document.querySelector('#crmTable tbody');
  document.getElementById('crmCount').textContent=`Mostrando ${filteredCRM.length} de ${db.crm.length} contactos.`;
  tbody.innerHTML=filteredCRM.map(x=>`<tr>
    <td><strong>${esc(x.organization)}</strong><br><span style="color:var(--muted)">${esc(compact(x.opportunityType,70))}</span></td>
    <td>${esc(x.campaign)}</td><td>${esc(compact(x.segment,70))}</td><td>${esc(x.municipality)}</td>
    <td>${x.email?`<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>`:'—'}<br><span style="color:var(--muted)">${esc(x.phone||x.contactPhone||'')}</span></td>
    <td>${badge(x.priority)}</td><td>${badge(x.sendStatus)}</td>
    <td>${x.responseReceived?badge('Respuesta'):'—'}${x.responseDate?`<br><small>${esc(x.responseDate)}</small>`:''}</td>
    <td>${esc(x.nextAction||'')}${x.nextActionDate?`<br><small>${esc(x.nextActionDate)}</small>`:''}</td>
    <td>${x.sendDossier||x.dossierStatus?`${badge(x.sendDossier||'—')}<br><small>${esc(x.dossierStatus||'')}</small>`:'—'}</td>
    <td><div class="actions"><button class="btn small gold" onclick="viewContact(${x.id})">Ver</button><button class="btn small dark" onclick="openContactModal(${x.id})">Editar</button>${x.email?`<button class="btn small ghost" onclick="composeForContact(${x.id})">Email</button>`:''}</div></td>
  </tr>`).join('') || `<tr><td colspan="11" class="muted">Sin resultados.</td></tr>`;
}
function viewContact(id){
  const x=db.crm.find(r=>r.id===id); if(!x)return;
  const keys=[
    ['Organización',x.organization],['Campaña',x.campaign],['Tipo oportunidad',x.opportunityType],['Segmento',x.segment],
    ['Municipio / Provincia',x.municipality],['Dirección',x.address],['Email',x.email],['Email CC',x.emailCc],['Teléfono',x.phone],
    ['Web',x.web],['Fuente URL',x.sourceUrl],['Prioridad',x.priority],['Enviar',x.send],['Estado envío',x.sendStatus],['Fecha envío',x.sendDate],
    ['Asunto enviado',x.sentSubject],['Respuesta recibida',x.responseReceived],['Fecha respuesta',x.responseDate],['Persona contacto',x.contactPerson],
    ['Interés',x.interest],['Disponibilidad / fechas',x.availability],['Condiciones',x.conditions],['Caché / presupuesto',x.budget],
    ['Requisitos técnicos',x.technicalRequirements],['Próxima acción',x.nextAction],['Fecha próxima acción',x.nextActionDate],['Notas seguimiento',x.followNotes],
    ['Último email recibido',x.lastEmailReceived],['Remitente respuesta',x.responseSender],['Enviar dossier',x.sendDossier],['Dossier enviado',x.dossierSent],
    ['Estado dossier',x.dossierStatus],['Notas dossier',x.dossierNotes]
  ];
  document.getElementById('modalTitle').textContent=x.organization || 'Contacto';
  document.getElementById('modalBody').innerHTML=`<div class="actions"><button class="btn gold" onclick="openContactModal(${x.id})">Editar</button>${x.email?`<button class="btn dark" onclick="composeForContact(${x.id})">Preparar email</button>`:''}${x.web?`<a class="btn ghost" target="_blank" rel="noopener" href="${esc(x.web)}">Abrir web</a>`:''}${x.sourceUrl?`<a class="btn ghost" target="_blank" rel="noopener" href="${esc(x.sourceUrl)}">Fuente</a>`:''}</div><div class="hr"></div><div class="detailGrid">${keys.map(([k,v])=>`<div class="detailItem ${String(v||'').length>140?'span2':''}"><small>${esc(k)}</small><div>${v?esc(v):'—'}</div></div>`).join('')}</div>`;
  openModal();
}
function contactFields(){return [
  ['organization','Organización / local','text','span2'],['campaign','Campaña','select','',unique(db.crm.map(x=>x.campaign))],['priority','Prioridad','select','',unique(db.crm.map(x=>x.priority))],
  ['opportunityType','Tipo oportunidad','text','span2'],['segment','Segmento','select','span2',unique(db.crm.map(x=>x.segment))],
  ['municipality','Municipio / provincia','text'],['address','Dirección','text'],
  ['email','Email','email'],['emailCc','Email CC','email'],['phone','Teléfono','text'],['web','Web','text'],
  ['send','Enviar','select','', ['SI','NO']],['sendStatus','Estado envío','select','',unique(db.crm.map(x=>x.sendStatus).concat(['Pendiente','Enviado','Sin email / revisar','No enviar']))],
  ['responseReceived','Respuesta recibida','textarea','span2'],['responseDate','Fecha respuesta','date'],
  ['contactPerson','Persona contacto','text'],['contactPhone','Teléfono contacto','text'],['interest','Interés','select','', ['', 'Alto','Medio','Bajo','No interesa']],
  ['availability','Disponibilidad / fechas','textarea','span2'],['conditions','Condiciones','textarea','span2'],['budget','Caché / presupuesto','text'],['technicalRequirements','Requisitos técnicos','textarea','span2'],
  ['nextAction','Próxima acción','text','span2'],['nextActionDate','Fecha próxima acción','date'],['followNotes','Notas seguimiento','textarea','span4'],
  ['sendDossier','Enviar dossier','select','', ['', 'Sí','No']],['dossierStatus','Estado dossier','select','', ['', 'Borrador creado','Enviado','Pendiente','No enviar']],['dossierNotes','Notas dossier','textarea','span2']
];}
function unique(arr){return [...new Set(arr.filter(Boolean))].sort();}
function renderForm(fields,obj){
  return `<div class="formGrid">${fields.map(f=>{
    const [key,label,type,cls,opts]=f, val=obj?.[key]??'';
    if(type==='select') return `<div class="field ${cls||''}"><label>${esc(label)}</label><select name="${key}">${(opts||[]).map(o=>`<option ${String(o)===String(val)?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
    if(type==='textarea') return `<div class="field ${cls||''}"><label>${esc(label)}</label><textarea name="${key}">${esc(val)}</textarea></div>`;
    return `<div class="field ${cls||''}"><label>${esc(label)}</label><input type="${type}" name="${key}" value="${esc(val)}"></div>`;
  }).join('')}</div>`;
}
let modalContext=null;
function openModal(){document.getElementById('modal').classList.add('open');}
function closeModal(){document.getElementById('modal').classList.remove('open');modalContext=null;}
function readForm(fields){const root=document.getElementById('modalBody');const o={};fields.forEach(f=>{const el=root.querySelector(`[name="${f[0]}"]`);o[f[0]]=el?el.value:''});return o;}
function openContactModal(id=null){
  const item=id?db.crm.find(x=>x.id===id):{campaign:'Salas',priority:'Media',send:'SI',sendStatus:'Pendiente'};
  modalContext={type:'contact',id};
  document.getElementById('modalTitle').textContent=id?'Editar contacto':'Nuevo contacto';
  document.getElementById('modalBody').innerHTML=renderForm(contactFields(), item)+`<div class="hr"></div><div class="actions"><button class="btn gold" onclick="saveContact()">Guardar</button><button class="btn dark" onclick="closeModal()">Cancelar</button>${id?`<button class="btn red" onclick="deleteRecord('crm',${id})">Borrar</button>`:''}</div>`;
  openModal();
}
function saveContact(){
  const obj=readForm(contactFields());
  if(modalContext.id){const idx=db.crm.findIndex(x=>x.id===modalContext.id);db.crm[idx]=Object.assign({},db.crm[idx],obj);}
  else {obj.id=nextId(db.crm);obj.sheetRow='';obj.raw={};db.crm.unshift(obj);}
  closeModal();saveData();
}
function deleteRecord(arrName,id){
  if(!confirm('¿Borrar este registro?'))return;
  db[arrName]=db[arrName].filter(x=>x.id!==id);
  closeModal();saveData();
}
function listCard(rows, empty='Sin registros.'){
  return rows.slice(0,10).map(x=>`<div class="detailItem"><small>${esc(x.campaign||x.emailDate||'')}</small><div><strong>${esc(x.organization||x.senderEmail)}</strong><br><span style="color:var(--muted)">${esc(compact(x.nextAction||x.responseReceived||x.summary||x.sendStatus||'',130))}</span></div><div class="actions" style="margin-top:8px"><button class="btn small gold" onclick="${x.organization?`viewContact(${x.id})`:`setTab('gmail')`}">Abrir</button>${x.email?`<button class="btn small dark" onclick="composeForContact(${x.id})">Email</button>`:''}</div></div>`).join('') || `<p class="muted">${empty}</p>`;
}
function renderFollowup(){
  const responded=db.crm.filter(x=>x.responseReceived);
  const dossier=db.crm.filter(x=>['si','sí'].includes(norm(x.sendDossier))||x.dossierStatus);
  const noEmail=db.crm.filter(x=>norm(x.sendStatus).includes('sin email'));
  const next=db.crm.filter(x=>x.nextAction||x.nextActionDate).sort((a,b)=>String(a.nextActionDate||'9999').localeCompare(String(b.nextActionDate||'9999')));
  document.getElementById('followResponded').innerHTML=listCard(responded);
  document.getElementById('followDossier').innerHTML=listCard(dossier);
  document.getElementById('followNoEmail').innerHTML=listCard(noEmail);
  document.getElementById('followNext').innerHTML=listCard(next);
}
function renderGmail(){
  const q=norm(document.getElementById('qGmail')?.value||'');
  const rows=db.gmailResponses.filter(r=>!q || norm([r.senderEmail,r.senderName,r.subject,r.summary,r.importStatus].join(' ')).includes(q));
  document.querySelector('#gmailTable tbody').innerHTML=rows.map(r=>{
    const crm = r.crmRow ? db.crm.find(x=>String(x.sheetRow)===String(r.crmRow)) : null;
    return `<tr><td>${esc(r.emailDate)}</td><td><strong>${esc(r.senderName||'')}</strong><br>${esc(r.senderEmail)}</td><td>${esc(r.subject)}</td><td>${badge(r.importStatus)}</td><td>${esc(compact(r.summary,260))}</td><td>${crm?`<button class="btn small gold" onclick="viewContact(${crm.id})">Ver CRM</button>`:'—'}</td></tr>`;
  }).join('')||'<tr><td colspan="6">Sin respuestas.</td></tr>';
}
function concertFields(){return [
  ['date','Fecha','date'],['time','Hora','time'],['eventName','Evento','text','span2'],['venue','Sala / lugar','text','span2'],['city','Ciudad','text'],['type','Tipo','select','', ['Sala','Boda Madrid','Boda premium completa','Fiesta privada','Ayuntamiento','Empresa','Otro']],['status','Estado','select','', ['Pre-reserva','Presupuesto enviado','Confirmado','Realizado','Cancelado']],['fee','Caché total','number'],['deposit','Anticipo','number'],['paid','Cobrado adicional','number'],['sound','Sonido/iluminación','text'],['contactId','ID contacto CRM','number'],['posterTitle','Título del cartel','text','span2'],['posterUrl','URL / ruta del cartel','text','span2'],['posterThumbUrl','URL / ruta miniatura','text','span2'],['publicInfo','Texto público / entrada / dirección','textarea','span4'],['notes','Notas producción','textarea','span4']
];}
function concertIsPast(concert){
  if(!concert.date) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = new Date(String(concert.date)+'T00:00:00');
  return !Number.isNaN(d.getTime()) && d < today;
}
function concertPosterSrc(concert){
  return concert.posterThumbUrl || concert.posterUrl || '';
}
function renderConcertPosters(arr){
  const box=document.getElementById('concertPosterGrid');
  if(!box) return;
  const withPoster=(arr||[]).filter(x=>concertPosterSrc(x)||x.posterUrl);
  const upcoming=withPoster.filter(x=>!concertIsPast(x));
  const past=withPoster.filter(x=>concertIsPast(x));
  const renderGroup=(title,rows)=> rows.length ? `
    <div class="posterGroup">
      <h4>${esc(title)}</h4>
      <div class="posterGrid">
        ${rows.map(x=>{
          const src=concertPosterSrc(x);
          const full=x.posterUrl||src;
          return `<article class="posterCard">
            ${src?`<a href="${esc(full)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="${esc(x.posterTitle||x.eventName||'Cartel concierto')}"></a>`:`<div class="posterEmpty">Sin cartel</div>`}
            <div class="posterInfo">
              <strong>${esc(x.posterTitle||x.eventName||'Concierto')}</strong>
              <span>${esc([x.date,x.time].filter(Boolean).join(' · '))}</span>
              <span>${esc([x.venue,x.city].filter(Boolean).join(' · '))}</span>
              ${x.publicInfo?`<p>${esc(x.publicInfo)}</p>`:''}
              <div class="actions">
                <button class="btn small gold" onclick="openConcertModal(${x.id})">Editar</button>
                ${full?`<a class="btn small dark" href="${esc(full)}" target="_blank" rel="noopener">Abrir cartel</a>`:''}
              </div>
            </div>
          </article>`;
        }).join('')}
      </div>
    </div>` : '';
  box.innerHTML = renderGroup('Próximos conciertos', upcoming) + renderGroup('Conciertos pasados', past) || `<div class="card"><p class="muted">Todavía no hay carteles cargados. Entra como admin, edita un concierto y pega una URL/ruta de cartel o usa “Subir cartel al navegador”.</p></div>`;
}
function renderConcerts(){
  const arr=db.concerts||[];
  const total=arr.reduce((s,x)=>s+Number(x.fee||0),0), deposit=arr.reduce((s,x)=>s+Number(x.deposit||0)+Number(x.paid||0),0), pending=Math.max(0,total-deposit);
  document.getElementById('concertKpis').innerHTML=[
    ['Conciertos', arr.length],['Facturación prevista', eur(total)],['Cobrado/anticipos', eur(deposit)],['Pendiente', eur(pending)]
  ].map(k=>`<div class="card kpi"><strong>${k[1]}</strong><span>${k[0]}</span></div>`).join('');
  renderConcertPosters(arr);
  document.querySelector('#concertTable tbody').innerHTML=arr.map(x=>{const paid=Number(x.deposit||0)+Number(x.paid||0), pending=Math.max(0,Number(x.fee||0)-paid);return `<tr><td>${esc(x.date)} ${esc(x.time||'')}</td><td><strong>${esc(x.eventName)}</strong><br><span style="color:var(--muted)">${esc(compact(x.notes,80))}</span></td><td>${esc(x.venue)}<br><span style="color:var(--muted)">${esc(x.city)}</span></td><td>${esc(x.type)}</td><td>${badge(x.status)}</td><td>${eur(x.fee)}</td><td>${eur(x.deposit)}</td><td>${eur(x.paid)}</td><td>${eur(pending)}</td><td><button class="btn small gold" onclick="openConcertModal(${x.id})">Editar</button> <button class="btn small red" onclick="deleteRecord('concerts',${x.id})">Borrar</button></td></tr>`}).join('')||'<tr><td colspan="10" class="muted">Todavía no hay conciertos creados. Usa “+ Concierto” o la calculadora de presupuesto.</td></tr>';
}
function posterUploadBlock(item){
  const current = item?.posterUrl || item?.posterThumbUrl || '';
  return `<div class="hr"></div>
  <div class="posterUploader">
    <h4>Cartel del concierto</h4>
    <p class="muted">Puedes pegar una ruta/URL en el campo “URL / ruta del cartel” o cargar una imagen local. La carga local se guarda en este navegador y entra en el backup JSON.</p>
    ${current?`<img class="posterPreview" src="${esc(current)}" alt="Cartel actual">`:''}
    <label class="btn dark">Subir cartel al navegador
      <input type="file" accept="image/*" style="display:none" onchange="loadConcertPosterFile(this.files[0])">
    </label>
    <div class="notice" style="margin-top:10px">Para un cartel común a toda la banda, lo más limpio es subir la imagen a <code>assets/posters/</code> en GitHub y pegar aquí la ruta.</div>
  </div>`;
}
function loadConcertPosterFile(file){
  if(!file) return;
  const maxSide = 1200;
  const reader = new FileReader();
  reader.onload = function(e){
    const img = new Image();
    img.onload = function(){
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      const root=document.getElementById('modalBody');
      const poster=root.querySelector('[name="posterUrl"]');
      const thumb=root.querySelector('[name="posterThumbUrl"]');
      if(poster) poster.value=dataUrl;
      if(thumb) thumb.value=dataUrl;
      const preview=root.querySelector('.posterPreview');
      if(preview) preview.src=dataUrl;
      else {
        const uploader=root.querySelector('.posterUploader');
        if(uploader) uploader.insertAdjacentHTML('afterbegin', `<img class="posterPreview" src="${dataUrl}" alt="Cartel cargado">`);
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function openConcertModal(id=null,preset=null){
  const item=id?db.concerts.find(x=>x.id===id):(preset||{status:'Pre-reserva',type:'Sala',fee:0,deposit:0,paid:0});
  modalContext={type:'concert',id};
  document.getElementById('modalTitle').textContent=id?'Editar concierto':'Nuevo concierto';
  document.getElementById('modalBody').innerHTML=renderForm(concertFields(), item)+posterUploadBlock(item)+`<div class="hr"></div><div class="actions"><button class="btn gold" onclick="saveConcert()">Guardar</button><button class="btn dark" onclick="closeModal()">Cancelar</button></div>`;
  openModal();
}
function saveConcert(){
  const obj=readForm(concertFields());
  ['fee','deposit','paid','contactId'].forEach(k=>obj[k]=Number(obj[k]||0));
  let item;
  if(modalContext.id){
    const idx=db.concerts.findIndex(x=>x.id===modalContext.id);
    item=Object.assign({},db.concerts[idx],obj);
    db.concerts[idx]=item;
  }else{
    obj.id=nextId(db.concerts);
    item=obj;
    db.concerts.push(item);
  }
  closeModal();
  saveData();
  pushConcertToSheet(item).catch(alertSheetWriteError);
}

function bandMembers(){
  return Array.isArray(db.bandMembers) && db.bandMembers.length ? db.bandMembers : [
    {id:'miguel_voz',name:'Miguel',role:'Voz'},
    {id:'esther',name:'Esther',role:'Voz'},
    {id:'lorenzo',name:'Lorenzo',role:'Guitarra solista'},
    {id:'oscar',name:'Oscar',role:'Guitarra rítmica'},
    {id:'jeffrey',name:'Jeffrey',role:'Bajo'},
    {id:'pepe',name:'Pepe',role:'Batería'}
  ];
}
function memberLabel(id){
  const m=bandMembers().find(x=>x.id===id);
  return m ? `${m.name} · ${m.role}` : id;
}
function memberOptions(value=''){
  return bandMembers().map(m=>`<option value="${esc(m.id)}" ${m.id===value?'selected':''}>${esc(m.name)} · ${esc(m.role)}</option>`).join('');
}
function attendanceOptions(value='Pendiente'){
  return ['Pendiente','Confirmado','Duda','No asiste','Llega tarde','Necesita revisar horario'].map(v=>`<option ${v===value?'selected':''}>${esc(v)}</option>`).join('');
}
function attendanceSummary(attendance){
  const a=attendance||{};
  const members=bandMembers();
  const confirmed=members.filter(m=>norm(a[m.id]?.status).includes('confirm')).length;
  const no=members.filter(m=>norm(a[m.id]?.status).includes('no asiste')).length;
  const doubt=members.filter(m=>['duda','necesita revisar horario','llega tarde'].some(x=>norm(a[m.id]?.status).includes(x))).length;
  const pending=Math.max(0,members.length-confirmed-no-doubt);
  return {confirmed,no,doubt,pending,total:members.length};
}
function attendancePills(attendance){
  const a=attendance||{};
  return `<div class="attendanceGrid">`+bandMembers().map(m=>{
    const item=a[m.id]||{status:'Pendiente',notes:''};
    return `<div class="attendanceChip"><strong>${esc(m.name)}</strong><small>${esc(m.role)}</small>${badge(item.status||'Pendiente')}${item.notes?`<em>${esc(compact(item.notes,60))}</em>`:''}</div>`;
  }).join('')+`</div>`;
}
function rehearsalFields(){return [
  ['date','Fecha','date'],
  ['startTime','Hora inicio','time'],
  ['endTime','Hora fin','time'],
  ['place','Lugar / local','text','span2'],
  ['status','Estado','select','', ['Pendiente','Confirmado','Movido','Cancelado','Realizado']],
  ['objective','Objetivo del ensayo','text','span4'],
  ['notes','Notas','textarea','span4']
];}
function rehearsalSongs(item){
  if(item?.allSongs) return db.repertoire||[];
  const ids=(item?.songIds||[]).map(Number);
  return (db.repertoire||[]).filter(s=>ids.includes(Number(s.id)));
}
function rehearsalSongChecklist(item){
  const selected=(item?.songIds||[]).map(Number);
  const allSongs = item?.allSongs === true;
  const rows=(db.repertoire||[]).map(s=>{
    const checked=allSongs || selected.includes(Number(s.id));
    return `<label class="songCheck"><input type="checkbox" data-rehearsal-song value="${esc(s.id)}" ${checked?'checked':''}> <span><strong>${esc(s.title)}</strong><small>${esc(s.artist||'')} · ${esc(s.currentKey||s.tone||'tono pendiente')} · ${esc(s.singer||s.leadVocal||'voz pendiente')}</small></span></label>`;
  }).join('');
  return `<div class="hr"></div>
    <div class="rehearsalSelector">
      <h4>Temas previstos</h4>
      <label class="songCheck all"><input type="checkbox" id="rehearsalAllSongs" ${allSongs?'checked':''}> <span><strong>Trabajar todo el repertorio</strong><small>Útil para ensayos generales o repaso completo.</small></span></label>
      <div class="actions" style="margin:10px 0">
        <button type="button" class="btn small gold" onclick="setRehearsalSongsMode('all')">Marcar todos</button>
        <button type="button" class="btn small dark" onclick="setRehearsalSongsMode('setlist')">Usar setlist actual</button>
        <button type="button" class="btn small red" onclick="setRehearsalSongsMode('clear')">Limpiar</button>
      </div>
      <div class="songCheckList">${rows || '<p class="muted">No hay canciones cargadas.</p>'}</div>
    </div>`;
}
function rehearsalAttendanceEditor(item){
  const a=item?.attendance||{};
  return `<div class="hr"></div><h4>Asistencia al ensayo</h4><div class="attendanceEditGrid">`+bandMembers().map(m=>{
    const itemA=a[m.id]||{status:'Pendiente',notes:''};
    return `<div class="attendanceEditItem">
      <label>${esc(m.name)} · ${esc(m.role)}</label>
      <select data-rehearsal-attendance="${esc(m.id)}">${attendanceOptions(itemA.status||'Pendiente')}</select>
      <input data-rehearsal-attendance-note="${esc(m.id)}" placeholder="Notas" value="${esc(itemA.notes||'')}">
    </div>`;
  }).join('')+`</div>`;
}
function setRehearsalSongsMode(mode){
  const all=document.getElementById('rehearsalAllSongs');
  const checks=[...document.querySelectorAll('[data-rehearsal-song]')];
  if(mode==='all'){
    if(all) all.checked=true;
    checks.forEach(ch=>ch.checked=true);
  }
  if(mode==='clear'){
    if(all) all.checked=false;
    checks.forEach(ch=>ch.checked=false);
  }
  if(mode==='setlist'){
    if(all) all.checked=false;
    const titles=new Set(setlistRows().map(x=>norm(x.title)));
    checks.forEach(ch=>{
      const song=db.repertoire.find(s=>Number(s.id)===Number(ch.value));
      ch.checked=!!song && titles.has(norm(song.title));
    });
  }
}
function openRehearsalModal(id=null){
  const defaultAttendance={};
  bandMembers().forEach(m=>defaultAttendance[m.id]={status:'Pendiente',notes:''});
  const item=id?db.rehearsals.find(x=>x.id===id):{status:'Pendiente',allSongs:false,songIds:[],attendance:defaultAttendance};
  modalContext={type:'rehearsal',id};
  document.getElementById('modalTitle').textContent=id?'Editar ensayo':'Nuevo ensayo';
  document.getElementById('modalBody').innerHTML=renderForm(rehearsalFields(), item)+rehearsalSongChecklist(item)+rehearsalAttendanceEditor(item)+`<div class="hr"></div><div class="actions"><button class="btn gold" onclick="saveRehearsal()">Guardar</button><button class="btn dark" onclick="closeModal()">Cancelar</button>${id?`<button class="btn red" onclick="deleteRecord('rehearsals',${id})">Borrar</button>`:''}</div>`;
  openModal();
}
function saveRehearsal(){
  const obj=readForm(rehearsalFields());
  obj.allSongs=!!document.getElementById('rehearsalAllSongs')?.checked;
  obj.songIds=obj.allSongs?[]:[...document.querySelectorAll('[data-rehearsal-song]:checked')].map(x=>Number(x.value)).filter(Boolean);
  obj.attendance={};
  bandMembers().forEach(m=>{
    const st=document.querySelector(`[data-rehearsal-attendance="${m.id}"]`)?.value||'Pendiente';
    const notes=document.querySelector(`[data-rehearsal-attendance-note="${m.id}"]`)?.value||'';
    obj.attendance[m.id]={status:st,notes};
  });
  let item;
  if(modalContext.id){
    const idx=db.rehearsals.findIndex(x=>x.id===modalContext.id);
    item=Object.assign({},db.rehearsals[idx],obj);
    db.rehearsals[idx]=item;
  }else{
    obj.id=nextId(db.rehearsals||[]);
    item=obj;
    db.rehearsals.push(item);
  }
  closeModal();
  saveData();
  pushRehearsalToSheet(item).catch(alertSheetWriteError);
}
function viewRehearsalModal(id){
  const r=(db.rehearsals||[]).find(x=>x.id===id);
  if(!r)return;
  const songs=rehearsalSongs(r);
  document.getElementById('modalTitle').textContent='Ensayo · '+(r.date||'sin fecha');
  document.getElementById('modalBody').innerHTML=`
    <div class="detailGrid">
      <div class="detailItem"><small>Fecha</small><div><strong>${esc(r.date||'—')}</strong></div></div>
      <div class="detailItem"><small>Horario</small><div>${esc([r.startTime,r.endTime].filter(Boolean).join(' - ')||'—')}</div></div>
      <div class="detailItem"><small>Lugar</small><div>${esc(r.place||'—')}</div></div>
      <div class="detailItem"><small>Estado</small><div>${badge(r.status||'Pendiente')}</div></div>
      <div class="detailItem span2"><small>Objetivo</small><div>${esc(r.objective||'—')}</div></div>
      <div class="detailItem span2"><small>Notas</small><div>${esc(r.notes||'—')}</div></div>
    </div>
    <div class="hr"></div>
    <h4>Temas previstos</h4>
    ${r.allSongs?'<p><strong>Todo el repertorio.</strong></p>':songs.length?`<div class="pillList">${songs.map(s=>`<span class="pill">${esc(s.title)}</span>`).join('')}</div>`:'<p class="muted">Sin temas seleccionados.</p>'}
    <div class="hr"></div>
    <h4>Asistencia al ensayo</h4>
    ${attendancePills(r.attendance)}
    <div class="hr"></div>
    <div class="actions"><button class="btn gold" onclick="openRehearsalModal(${r.id})">Editar</button><button class="btn dark" onclick="closeModal()">Cerrar</button></div>`;
  openModal();
}
function renderRehearsals(){
  const section=document.getElementById('rehearsals');
  if(!section)return;
  db.rehearsals = Array.isArray(db.rehearsals) ? db.rehearsals : [];
  const today=new Date().toISOString().slice(0,10);
  const upcoming=db.rehearsals.filter(r=>!r.date || r.date>=today).sort((a,b)=>String(a.date||'9999-99-99').localeCompare(String(b.date||'9999-99-99')) || String(a.startTime||'99:99').localeCompare(String(b.startTime||'99:99')));
  const confirmed=db.rehearsals.filter(r=>norm(r.status).includes('confirm')).length;
  const pending=db.rehearsals.filter(r=>norm(r.status).includes('pend')).length;
  const totalSongs=(db.repertoire||[]).length;
  const kpis=document.getElementById('rehearsalKpis');
  if(kpis) kpis.innerHTML=[
    ['Ensayos', db.rehearsals.length],
    ['Próximos', upcoming.length],
    ['Confirmados', confirmed],
    ['Canciones disponibles', totalSongs],
    ['Pendientes', pending],
    ['Miembros', bandMembers().length]
  ].map(k=>`<div class="card kpi"><strong>${esc(k[1])}</strong><span>${esc(k[0])}</span></div>`).join('');
  const next=document.getElementById('nextRehearsals');
  if(next) next.innerHTML=upcoming.slice(0,5).map(r=>{
    const songs=rehearsalSongs(r);
    const sum=attendanceSummary(r.attendance);
    return `<div class="detailItem"><small>${esc(r.date||'Sin fecha')} · ${esc([r.startTime,r.endTime].filter(Boolean).join(' - ')||'sin horario')}</small><div><strong>${esc(r.place||'Lugar pendiente')}</strong><br><span style="color:var(--muted)">${esc(r.objective||'Objetivo pendiente')} · ${r.allSongs?'Todo el repertorio':songs.length+' temas'} · ${sum.confirmed}/${sum.total} confirmados</span></div><div class="actions" style="margin-top:8px"><button class="btn small dark" onclick="viewRehearsalModal(${r.id})">Ver</button><button class="btn small gold" onclick="openRehearsalModal(${r.id})">Editar</button></div></div>`;
  }).join('') || '<p class="muted">No hay ensayos creados todavía.</p>';
  const tbody=document.querySelector('#rehearsalTable tbody');
  if(tbody) tbody.innerHTML=db.rehearsals.map(r=>{
    const songs=rehearsalSongs(r);
    const sum=attendanceSummary(r.attendance);
    return `<tr>
      <td><strong>${esc(r.date||'—')}</strong></td>
      <td>${esc([r.startTime,r.endTime].filter(Boolean).join(' - ')||'—')}</td>
      <td>${esc(r.place||'—')}</td>
      <td>${esc(compact(r.objective||r.notes||'—',90))}</td>
      <td>${r.allSongs?'Todo el repertorio':(songs.length?songs.length+' temas':'—')}<br><small>${esc(songs.slice(0,3).map(s=>s.title).join(' · '))}${songs.length>3?'…':''}</small></td>
      <td>${sum.confirmed}/${sum.total} confirmados<br><small>${sum.pending} pendientes · ${sum.doubt} dudas · ${sum.no} no</small></td>
      <td>${badge(r.status||'Pendiente')}</td>
      <td><button class="btn small dark" onclick="viewRehearsalModal(${r.id})">Ver</button> <button class="btn small gold" onclick="openRehearsalModal(${r.id})">Editar</button> <button class="btn small red" onclick="deleteRecord('rehearsals',${r.id})">Borrar</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="muted">Todavía no hay ensayos creados. Entra como administrador para añadir el primero.</td></tr>';
  renderConcertAttendancePanel();
}

function renderLocalPayments(){
  const section=document.getElementById('local');
  if(!section)return;

  db.localPayments = consolidateLocalPaymentRows(Array.isArray(db.localPayments) ? db.localPayments : []);
  const rows=db.localPayments.slice();
  const currentMonth = new Date().toISOString().slice(0,7);
  const months=[...new Set(rows.map(r=>normalizeMonthValue(r.month)).filter(Boolean))].sort().reverse();
  const controlMonth = months.includes(currentMonth) ? currentMonth : (months[0] || currentMonth);
  const allowed=['miguel','esther','lorenzo','oscar','jeffrey','pepe'];

  let baseRows = consolidateLocalPaymentRows(rows.filter(r=>normalizeMonthValue(r.month)===controlMonth))
    .filter(r=>allowed.includes(normalizeMemberKey(r.memberId || r.name)));

  const byMember=new Map();
  baseRows.forEach(r=>{
    const id=normalizeMemberKey(r.memberId || r.name);
    if(!byMember.has(id)) byMember.set(id,r);
    else{
      const prev=byMember.get(id);
      prev.paid=(isPaymentPaid(prev.paid)||isPaymentPaid(r.paid))?'SI':'NO';
      prev.amount=prev.amount || r.amount;
      prev.paidDate=prev.paidDate || r.paidDate;
      prev.notes=mergeTextNotes(prev.notes,r.notes);
    }
  });
  baseRows=[...byMember.values()];

  const configAmount=parseEuroValue(db.localConfig?.monthlyAmount);
  const monthlyAmount = configAmount || 217;
  const paidRaw = baseRows.filter(r=>isPaymentPaid(r.paid)).reduce((a,r)=>a+(parseEuroValue(r.amount)||0),0);
  const paid = Math.min(monthlyAmount, paidRaw);
  const pending = Math.max(0, monthlyAmount - paid);

  const kpis=document.getElementById('localKpis');
  if(kpis) kpis.innerHTML=[
    ['Mes control', controlMonth],
    ['Cuotas', baseRows.length],
    ['Total local', money2(monthlyAmount)],
    ['Pagado', money2(paid)],
    ['Pendiente', money2(pending)]
  ].map(k=>`<div class="card kpi"><strong>${esc(k[1])}</strong><span>${esc(k[0])}</span></div>`).join('');

  const tbody=document.querySelector('#localTable tbody');
  const shownRows=baseRows.length ? baseRows : rows;
  if(tbody) tbody.innerHTML=shownRows.map(r=>{
    const st=isPaymentPaid(r.paid)?'Pagado':'Pendiente';
    const memberId=normalizeMemberKey(r.memberId||r.name);
    return `<tr>
      <td>${esc(normalizeMonthValue(r.month)||'—')}</td>
      <td><strong>${esc(memberDisplayName(memberId)||r.name||'—')}</strong><br><small>${esc(memberId||'')}</small></td>
      <td>${esc(money2(parseEuroValue(r.amount)).replace(' €',''))} €</td>
      <td>${badge(st)}</td>
      <td>${esc(r.paidDate||'—')}</td>
      <td>${esc(compact(r.notes||'',120))}</td>
      <td class="admin-only"><button class="mini" onclick="markLocalPayment('${esc(normalizeMonthValue(r.month)||controlMonth)}','${esc(memberId)}','SI')">Pagado</button> <button class="mini danger" onclick="markLocalPayment('${esc(normalizeMonthValue(r.month)||controlMonth)}','${esc(memberId)}','NO')">Pendiente</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" class="muted">No hay cuotas del local cargadas en PAGOS_LOCAL.</td></tr>';
}

function markLocalPayment(month, memberId, paid){
  const id=normalizeMemberKey(memberId);
  const rows=consolidateLocalPaymentRows(db.localPayments||[]);
  let item=rows.find(r=>normalizeMonthValue(r.month)===normalizeMonthValue(month) && normalizeMemberKey(r.memberId||r.name)===id);
  if(!item){
    item={month:normalizeMonthValue(month)||new Date().toISOString().slice(0,7), memberId:id, name:memberDisplayName(id), amount:36.17, paid:'NO', notes:''};
    db.localPayments.push(item);
  }
  item.paid=paid==='SI'?'SI':'NO';
  item.paidDate=paid==='SI'?new Date().toISOString().slice(0,10):'';
  item.notes=mergeTextNotes(item.notes, paid==='SI'?'Marcado pagado desde APP-ENHE':'Marcado pendiente desde APP-ENHE');
  saveData();
  pushLocalPaymentToSheet(item)
    .then(()=>sheetStatus('Pago local actualizado en Google Sheet.','ok'))
    .catch(alertSheetWriteError);
}


function fillSelectKeep(el, options, current){
  if(!el)return;
  el.innerHTML=options;
  if(current && [...el.options].some(o=>o.value===current)) el.value=current;
}
function renderConcertAttendancePanel(){
  const concertSelect=document.getElementById('attendanceConcertSelect');
  if(!concertSelect)return;
  const prevConcert=concertSelect.value;
  const concerts=(db.concerts||[]).slice().sort((a,b)=>String(a.date||'9999-99-99').localeCompare(String(b.date||'9999-99-99')));
  fillSelectKeep(concertSelect, concerts.map(c=>`<option value="${esc(c.id)}">${esc(c.date||'sin fecha')} · ${esc(c.eventName||c.venue||'Concierto')}</option>`).join(''), prevConcert);
  const memberSelect=document.getElementById('attendanceMemberSelect');
  const prevMember=memberSelect?.value||'';
  fillSelectKeep(memberSelect, memberOptions(prevMember), prevMember);
  const c=concerts.find(x=>Number(x.id)===Number(concertSelect.value)) || concerts[0];
  if(c && !concertSelect.value) concertSelect.value=c.id;
  const mId=memberSelect?.value || bandMembers()[0]?.id;
  const saved=c?.attendance?.[mId] || {};
  const summary=document.getElementById('concertAttendanceSummary');
  if(summary){
    summary.innerHTML=c?`
      <div class="detailItem"><small>Concierto seleccionado</small><div><strong>${esc(c.date||'sin fecha')} · ${esc(c.eventName||'Concierto')}</strong><br><span style="color:var(--muted)">${esc(c.venue||'')} ${c.city?'· '+esc(c.city):''}</span></div></div>
      <div class="hr"></div>
      <h4>Estado guardado por miembro</h4>
      ${attendancePills(c.attendance)}
      ${saved.notes?`<p class="muted">Nota guardada de ${esc(memberLabel(mId))}: ${esc(saved.notes)}</p>`:''}
    `:'<p class="muted">No hay conciertos creados todavía.</p>';
  }
}
function selectedConcertForAttendance(){
  const id=Number(document.getElementById('attendanceConcertSelect')?.value||0);
  return (db.concerts||[]).find(c=>Number(c.id)===id) || (db.concerts||[])[0];
}
function copyConcertAttendanceMessage(){
  const c=selectedConcertForAttendance();
  if(!c){alert('No hay concierto seleccionado.');return;}
  const mId=document.getElementById('attendanceMemberSelect')?.value || bandMembers()[0]?.id;
  const status=document.getElementById('attendanceStatusSelect')?.value || 'Confirmo asistencia';
  const notes=document.getElementById('attendanceNotesInput')?.value || '';
  const msg=[
    'Ñ Mayúscula · Confirmación de asistencia',
    `Concierto: ${c.date||'fecha pendiente'} · ${c.eventName||c.venue||'concierto'}`,
    `Lugar: ${[c.venue,c.city].filter(Boolean).join(' · ')||'pendiente'}`,
    `Miembro: ${memberLabel(mId)}`,
    `Estado: ${status}`,
    notes?`Notas: ${notes}`:'Notas: —'
  ].join('\n');
  copyText(msg);
}
function saveConcertAttendance(){
  const c=selectedConcertForAttendance();
  if(!c){alert('No hay concierto seleccionado.');return;}
  const mId=document.getElementById('attendanceMemberSelect')?.value || bandMembers()[0]?.id;
  const status=document.getElementById('attendanceStatusSelect')?.value || 'Pendiente';
  const notes=document.getElementById('attendanceNotesInput')?.value || '';
  c.attendance=c.attendance||{};
  c.attendance[mId]={status,notes,updatedAt:new Date().toISOString()};
  saveData();
  pushConcertToSheet(c)
    .then(()=>alert('Confirmación guardada en Google Sheet.'))
    .catch(alertSheetWriteError);
}
function rehearsalHeaders(){return [
  {label:'ID',key:'id'},
  {label:'Fecha',key:'date'},
  {label:'Inicio',key:'startTime'},
  {label:'Fin',key:'endTime'},
  {label:'Lugar',key:'place'},
  {label:'Estado',key:'status'},
  {label:'Objetivo',key:'objective'},
  {label:'Todos los temas',key:o=>o.allSongs?'Sí':'No'},
  {label:'Temas',key:o=>o.allSongs?'Todo el repertorio':rehearsalSongs(o).map(s=>s.title).join(' | ')},
  {label:'Asistencia',key:o=>bandMembers().map(m=>`${m.name} ${m.role}: ${(o.attendance?.[m.id]?.status)||'Pendiente'}`).join(' | ')},
  {label:'Notas',key:'notes'}
];}
function exportRehearsalsCSV(){
  const rows=db.rehearsals||[];
  if(!rows.length){alert('No hay ensayos cargados.');return;}
  downloadBlob('n_mayuscula_ensayos.csv', new Blob([toCSV(rows,rehearsalHeaders())],{type:'text/csv;charset=utf-8'}));
}


function renderBudgetUI(){
  const box=document.getElementById('extrasBox'); if(!box)return;
  const preferred=['amp30','segundoPase','bodaMadrid','bodaPremium','zona','sonido'];
  const extras=(db.tariffs.extras||[]).slice().sort((a,b)=>preferred.indexOf(a.id)-preferred.indexOf(b.id));
  box.innerHTML=extras.map(e=>`
    <label class="checkLine">
      <input type="checkbox" data-extra="${esc(e.id)}" onchange="calcBudget()" style="width:auto">
      <span>${esc(e.name)} ${e.kind==='fixed'?`<strong>+${eur2(e.amount)}</strong>`:'<strong>consultar</strong>'}</span>
    </label>
  `).join('');
  const sd=document.getElementById('specialDates');
  if(sd) sd.innerHTML=(db.tariffs.specialDates||[]).map(x=>`<div class="detailItem"><small>${esc(x.date)}</small><div><strong>${esc(x.name)}</strong> · ${eur2(x.price)}</div></div>`).join('');
  const wc=document.getElementById('weddingConditions');
  if(wc) wc.innerHTML=(db.tariffs.weddingConditions||[]).map(x=>`<li>${esc(x)}</li>`).join('');
  calcBudget();
}

function eur2(n){
  n=Number(n||0);
  return n.toLocaleString('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
}
function numInput(id){
  const el=document.getElementById(id);
  if(!el)return 0;
  return Number(String(el.value||'').replace(',','.'))||0;
}
function val(id, fallback=''){
  const el=document.getElementById(id);
  return el ? (el.value || fallback) : fallback;
}
function checkedExtraIds(){
  return Array.from(document.querySelectorAll('[data-extra]:checked')).map(ch=>ch.dataset.extra);
}
function dayNameFromDate(dateStr){
  if(!dateStr)return '';
  const d=new Date(dateStr+'T00:00:00');
  return ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][d.getDay()]||'';
}
function formatDateEs(dateStr){
  if(!dateStr)return 'fecha pendiente';
  const d=new Date(dateStr+'T00:00:00');
  if(isNaN(d))return dateStr;
  return d.toLocaleDateString('es-ES',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}
function budgetTechnicalRange(){
  const mode=val('budgetTechEstimate','auto');
  const space=val('budgetSpace','pendiente');
  const aforo=val('budgetAforo','medium');
  const hasSound=val('budgetHasSound','no');
  const hasLights=val('budgetHasLights','no');
  const hasTech=val('budgetHasTech','no');
  const needsTech = hasSound!=='yes' || hasLights!=='yes' || hasTech!=='yes';

  if(mode==='none' || !needsTech) return {min:0,max:0,label:'Producción técnica no incluida / aportada por el espacio o proveedor externo.', included:false, needed:needsTech};
  if(mode==='custom'){
    const min=numInput('budgetTechMin'), max=numInput('budgetTechMax')||min;
    return {min,max,label:`Producción técnica estimada manual: ${eur2(min)}${max&&max!==min?` - ${eur2(max)}`:''}`, included:true, needed:true};
  }
  if(mode==='interior_small') return {min:700,max:1100,label:'Producción técnica interior pequeño/medio: sonido, microfonía, monitores, técnico e iluminación básica.', included:true, needed:true};
  if(mode==='interior_standard') return {min:1100,max:1800,label:'Producción técnica interior boda estándar: sonido completo, monitores, técnico e iluminación básica cuidada.', included:true, needed:true};
  if(mode==='exterior_basic') return {min:1800,max:3500,label:'Producción técnica exterior básica: sonido, luces, técnico y necesidades extra de protección/seguridad.', included:true, needed:true};

  // auto
  if(space==='exterior' || space==='mixto') return {min:1800,max:3500,label:'Producción técnica estimada para exterior/mixto. Confirmar cubierta, suelo, electricidad y plan B.', included:true, needed:true};
  if(aforo==='large' || aforo==='xlarge') return {min:1800,max:3500,label:'Producción técnica estimada para aforo alto. Confirmar potencia, subgraves, monitores y horarios.', included:true, needed:true};
  if(aforo==='small') return {min:700,max:1100,label:'Producción técnica estimada para interior pequeño/medio.', included:true, needed:true};
  return {min:1100,max:1800,label:'Producción técnica estimada para boda/evento interior estándar.', included:true, needed:true};
}
function budgetBaseLine(date){
  const manual=numInput('budgetManualBase');
  const base=findBaseTariff(date);
  if(manual>0) return {price:manual, name:'Caché artístico manual', note:'Importe introducido manualmente por administración.'};
  if(base && base.price>0) return {price:Number(base.price), name:base.name, note:base.special?'Fecha especial':'Tarifa base según tabla'};
  if(base && base.price===0) return {price:0, name:base.name, note:'Día laborable/no disponible en tabla. Consultar o introducir caché manual.'};
  return {price:0, name:'Sin tarifa automática', note:'La fecha no está dentro de la tabla 2026. Introducir caché artístico manual o validar tarifa.'};
}
function calcBudget(){
  const date=val('budgetDate');
  const eventType=val('budgetEventType','boda');
  const client=val('budgetClient');
  const name=val('budgetName');
  const time=val('budgetTime');
  const duration=val('budgetDuration','90');
  const moment=val('budgetMoment');
  const venue=val('budgetVenue');
  const location=val('budgetLocation');
  const zone=val('budgetZone','madrid_capital');
  const space=val('budgetSpace','interior');
  const aforo=val('budgetAforo','medium');
  const venueType=val('budgetVenueType','finca');
  const validUntil=val('budgetValidUntil');
  const discount=numInput('budgetDiscount');
  const vat=val('budgetVat','no');

  let warnings=[];
  let lines=[];
  let artistic=0;
  const base=budgetBaseLine(date);
  artistic+=Number(base.price||0);
  lines.push({label:base.name, amount:base.price, note:base.note, kind:'artistic'});
  if(base.price===0) warnings.push('La tarifa artística no queda cerrada automáticamente. Revisar manualmente.');

  const extras=checkedExtraIds();
  extras.forEach(id=>{
    const e=(db.tariffs.extras||[]).find(x=>x.id===id);
    if(!e)return;
    if(e.kind==='fixed'){
      artistic+=Number(e.amount||0);
      lines.push({label:e.name, amount:Number(e.amount||0), note:'Extra aplicado', kind:'extra'});
    }else{
      lines.push({label:e.name, amount:null, note:'Consultar según aforo/formato', kind:'consult'});
      warnings.push(`${e.name}: pendiente de cotización específica.`);
    }
  });

  // reglas automáticas suaves: no duplican si ya está marcado el extra
  if(eventType==='boda' && zone==='madrid_capital' && !extras.includes('bodaMadrid')){
    const e=(db.tariffs.extras||[]).find(x=>x.id==='bodaMadrid');
    if(e){artistic+=Number(e.amount||0);lines.push({label:'Boda Madrid', amount:Number(e.amount||0), note:'Aplicado automáticamente por tipo de evento/zona', kind:'extra'});}
  }
  if((zone==='madrid_provincia' || zone==='guadalajara') && !extras.includes('zona')){
    const e=(db.tariffs.extras||[]).find(x=>x.id==='zona');
    if(e){artistic+=Number(e.amount||0);lines.push({label:'Incremento por zona', amount:Number(e.amount||0), note:'Provincia de Madrid excepto capital / Guadalajara', kind:'extra'});}
  }

  if(discount>0){
    artistic-=discount;
    lines.push({label:'Descuento autorizado', amount:-discount, note:'Aplicado manualmente', kind:'discount'});
  }

  if(duration==='60'){
    warnings.push('Aunque el pase sea de 60 minutos, los costes principales de reserva, montaje, prueba, desplazamiento y disponibilidad de banda apenas varían respecto al formato estándar.');
  }
  if(space==='exterior' || space==='mixto'){
    warnings.push('Si es exterior, confirmar zona cubierta, suelo estable, protección ante lluvia/humedad, electricidad segura y plan B.');
  }
  if(val('budgetStage')!=='yes'){
    warnings.push('Escenario/tarima no confirmado. Revisar si el espacio es estable, seguro y suficiente para 6 músicos.');
  }

  const tech=budgetTechnicalRange();
  const totalMin = Math.max(0, artistic) + (tech.included ? tech.min : 0);
  const totalMax = Math.max(0, artistic) + (tech.included ? tech.max : 0);
  const ivaMin = vat==='yes' ? totalMin*0.21 : 0;
  const ivaMax = vat==='yes' ? totalMax*0.21 : 0;
  const totalIvaMin=totalMin+ivaMin, totalIvaMax=totalMax+ivaMax;
  const isRange = totalMax && totalMax!==totalMin;
  const totalTxt = isRange ? `${eur2(totalIvaMin)} - ${eur2(totalIvaMax)}` : eur2(totalIvaMin);
  const depositTxt = isRange ? `${eur2(totalIvaMin/2)} - ${eur2(totalIvaMax/2)}` : eur2(totalIvaMin/2);

  const detailLines=[
    ...lines.map(x=>`${x.label}: ${x.amount===null?'consultar':eur2(x.amount)}${x.note?` · ${x.note}`:''}`),
    tech.included ? `${tech.label}: ${eur2(tech.min)}${tech.max!==tech.min?` - ${eur2(tech.max)}`:''}` : tech.label,
    vat==='yes' ? `IVA 21%: ${isRange?`${eur2(ivaMin)} - ${eur2(ivaMax)}`:eur2(ivaMin)}` : 'IVA: no incluido',
    `Total orientativo: ${totalTxt}`
  ];
  const breakdown=document.getElementById('budgetBreakdown');
  if(breakdown){
    breakdown.innerHTML=detailLines.map(esc).join('<br>') + `<br><br><strong>Reserva / anticipo 50%:</strong> ${esc(depositTxt)}` + (warnings.length?`<div class="notice warn" style="margin-top:10px">${warnings.map(esc).join('<br>')}</div>`:'');
  }
  const totalEl=document.getElementById('budgetTotal');
  if(totalEl) totalEl.textContent=totalTxt;

  const dateLine = date ? `${formatDateEs(date)}${time?` · ${time} h`:''}` : 'Fecha pendiente de confirmar';
  const durationLine = duration==='custom' ? 'Duración pendiente de concretar' : `${duration} minutos`;
  const techClient = tech.included
    ? `Producción técnica estimada: ${tech.label} Rango orientativo: ${eur2(tech.min)}${tech.max!==tech.min?` - ${eur2(tech.max)}`:''}.`
    : 'Producción técnica no incluida en este presupuesto. Se entiende aportada por el espacio o por proveedor externo, pendiente de validación técnica.';

  const clientProposal = [
    'PRESUPUESTO ORIENTATIVO · Ñ MAYÚSCULA',
    '',
    `Cliente / interlocutor: ${client || 'pendiente'}`,
    `Evento: ${name || eventTypeLabel(eventType)}`,
    `Fecha y hora: ${dateLine}`,
    `Lugar: ${venue || 'pendiente'}${location?` · ${location}`:''}`,
    `Formato: banda completa · ${durationLine} · ${momentLabel(moment)}`,
    '',
    'Detalle económico:',
    ...lines.map(x=>`- ${x.label}: ${x.amount===null?'consultar':eur2(x.amount)}`),
    tech.included ? `- Producción técnica: ${eur2(tech.min)}${tech.max!==tech.min?` - ${eur2(tech.max)}`:''}` : '- Producción técnica: no incluida / pendiente de proveedor',
    vat==='yes' ? `- IVA 21% incluido en cálculo: ${isRange?`${eur2(ivaMin)} - ${eur2(ivaMax)}`:eur2(ivaMin)}` : '- Precios sin IVA',
    '',
    `Total orientativo: ${totalTxt}`,
    `Reserva de fecha: anticipo 50% (${depositTxt}) tras aceptación de presupuesto/contrato.`,
    validUntil ? `Validez: ${validUntil}` : '',
    '',
    'Condiciones y observaciones:',
    '- Presupuesto final sujeto a disponibilidad, ubicación, horarios, duración, formato y necesidades técnicas.',
    '- Cualquier necesidad de sonido, iluminación, técnico, tarima, cubierta o producción adicional debe quedar confirmada por escrito.',
    '- La fecha se bloquea únicamente con presupuesto/contrato aceptado y anticipo acordado.',
    duration==='60' ? '- La reducción a un pase de 60 minutos no implica una reducción relevante del caché artístico, ya que los costes principales de reserva, montaje, prueba, desplazamiento y disponibilidad son prácticamente los mismos.' : '',
    space==='exterior' || space==='mixto' ? '- En exterior será necesario confirmar cubierta o plan alternativo, suelo estable y condiciones eléctricas seguras.' : '',
    '',
    'Ñ Mayúscula'
  ].filter(Boolean).join('\n');

  const emailText = [
    client ? `Hola ${client.split(' ')[0]},` : 'Hola,',
    '',
    'Gracias por la información.',
    '',
    `Te enviamos una propuesta orientativa para Ñ Mayúscula en ${name || eventTypeLabel(eventType)}.`,
    '',
    `Fecha: ${dateLine}`,
    `Lugar: ${venue || 'pendiente'}${location?` · ${location}`:''}`,
    `Formato: banda completa · ${durationLine}`,
    '',
    `Parte artística y extras: ${eur2(Math.max(0,artistic))}`,
    tech.included ? `Producción técnica estimada: ${eur2(tech.min)}${tech.max!==tech.min?` - ${eur2(tech.max)}`:''}` : 'Producción técnica: pendiente / no incluida',
    `Total orientativo: ${totalTxt}`,
    '',
    techClient,
    '',
    'El presupuesto final quedaría sujeto a disponibilidad, horarios, ubicación exacta, condiciones del espacio y necesidades técnicas definitivas.',
    '',
    'Quedo pendiente de cualquier dato adicional para cerrarlo con precisión.',
    '',
    'Un saludo,',
    'Miguel',
    'Ñ Mayúscula'
  ].join('\n');

  const preview=document.getElementById('budgetClientPreview');
  if(preview) preview.textContent=clientProposal;
  const copy=document.getElementById('budgetCopy');
  if(copy) copy.textContent=emailText;

  return {date,name,client,eventType,venue,location,total:totalMin,totalMin,totalMax,artistic,tech,lines,warnings,emailText,clientProposal,depositTxt,totalTxt};
}
function eventTypeLabel(v){
  return ({boda:'boda',evento_privado:'evento privado',cumpleanos:'cumpleaños / celebración',empresa:'evento de empresa',sala:'sala / concierto',ayuntamiento:'ayuntamiento / fiestas',otro:'evento'})[v]||'evento';
}
function momentLabel(v){
  return ({fiesta:'fiesta', 'inicio-fiesta':'inicio de fiesta', coctel:'cóctel', cena:'cena', concierto:'concierto', otro:'momento pendiente'})[v]||'momento pendiente';
}
function copyBudgetText(){calcBudget();copyText(document.getElementById('budgetClientPreview')?.textContent||'');}
function copyBudgetEmail(){calcBudget();copyText(document.getElementById('budgetCopy')?.textContent||'');}
function downloadBudgetHTML(){
  const b=calcBudget();
  const title=`Presupuesto Ñ Mayúscula ${b.date||''} ${b.name||''}`.trim();
  const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;background:#120608;color:#1b130b;margin:0;padding:28px}
    .page{max-width:860px;margin:0 auto;background:#fffaf1;border:1px solid #e4a52d;border-radius:18px;padding:32px}
    h1{margin:0;color:#4b0f1f} h2{color:#4b0f1f} pre{white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5}
    .brand{color:#b27818;font-weight:bold}.total{font-size:24px;color:#4b0f1f;font-weight:bold}.note{font-size:12px;color:#6a5b49}
  </style></head><body><div class="page"><div class="brand">Ñ MAYÚSCULA</div><h1>Presupuesto orientativo</h1><p class="total">${esc(b.totalTxt)}</p><pre>${esc(b.clientProposal)}</pre><p class="note">Documento generado desde APP-ENHE. Presupuesto sujeto a validación final.</p></div></body></html>`;
  const blob=new Blob([html],{type:'text/html;charset=utf-8'});
  const a=document.createElement('a');
  const safe=(title||'presupuesto-n-mayuscula').replace(/[^\w\-áéíóúñ]+/gi,'_');
  a.href=URL.createObjectURL(blob);
  a.download=`${safe}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}
function createConcertFromBudget(){
  const b=calcBudget();
  openConcertModal(null,{
    date:b.date,
    eventName:b.name||eventTypeLabel(b.eventType)||'Evento pendiente',
    type:b.eventType==='boda'?'Boda':(b.eventType==='sala'?'Sala':'Evento privado'),
    status:'Presupuesto preparado',
    fee:b.totalMin||b.total||0,
    deposit:b.totalMin?b.totalMin/2:0,
    paid:0,
    notes:[
      `Presupuesto generado desde APP-ENHE: ${b.totalTxt}`,
      b.venue?`Lugar: ${b.venue}`:'',
      b.location?`Ubicación: ${b.location}`:'',
      b.tech&&b.tech.included?`Técnica estimada: ${eur2(b.tech.min)} - ${eur2(b.tech.max)}`:'Técnica pendiente/no incluida',
      (b.warnings||[]).join(' | ')
    ].filter(Boolean).join(' | ')
  });
}


function openPosterHelp(){
  document.getElementById('modalTitle').textContent='Cómo añadir carteles';
  document.getElementById('modalBody').innerHTML=`<div class="notice">Modo recomendado: sube el cartel a <strong>assets/posters/</strong> en GitHub y pega la ruta en el concierto. Ejemplo: <code>assets/posters/cartel-cien-x-cien-2026-06-16.jpg</code>.</div><p>También puedes editar un concierto y usar “Subir cartel al navegador”. Esa imagen queda guardada en este navegador y se conserva si haces backup JSON.</p><div class="actions"><button class="btn gold" onclick="closeModal()">Entendido</button></div>`;
  openModal();
}

function setlistRows(){
  const st=db.strategicSetlist || INITIAL_DATA.strategicSetlist || {blocks:[]};
  return (st.blocks||[]).flatMap(b=>(b.songs||[]).map(song=>Object.assign({blockId:b.id,blockName:b.name,blockObjective:b.objective,stageControl:b.stageControl,blockDuration:b.musicDuration},song)));
}
function vocalClass(v){const x=norm(v); if(x.includes('miguel'))return 'vocal vocal-miguel'; if(x.includes('esther'))return 'vocal vocal-esther'; if(x.includes('ambos'))return 'vocal vocal-ambos'; if(x.includes('lorenzo'))return 'vocal vocal-lorenzo'; return 'vocal';}
function renderSetlist(){
  const st=db.strategicSetlist || INITIAL_DATA.strategicSetlist; if(!st)return;
  const rows=setlistRows();
  const el=id=>document.getElementById(id);
  if(!el('setlistTitle'))return;
  el('setlistTitle').textContent=st.title||'Setlist estratégico';
  el('setlistSubtitle').textContent=st.subtitle||'';
  el('setlistLegend').innerHTML=(st.legend||[]).map(v=>`<span class="${vocalClass(v)}">${esc(v)}</span>`).join('');
  el('setlistRule').innerHTML=`<strong>Regla de directo:</strong> ${esc(st.rule||'')}`;
  el('setlistFinal').innerHTML=`<strong>Final obligatorio:</strong> ${esc(st.finalMandatory||'')}`;
  el('setlistSummary').innerHTML=[['Música',st.musicDuration],['Ágil',st.agileDuration],['Amplio',st.extendedDuration]].map(x=>`<div class="detailItem"><small>${esc(x[0])}</small><div><strong>${esc(x[1])}</strong></div></div>`).join('');
  el('setlistPromoterReading').innerHTML=`<p><strong>Lectura para salas/promotores:</strong><br>${esc(st.promoterReading||'')}</p>`;
  el('setlistBlocks').innerHTML=(st.blocks||[]).map(b=>`<div class="card setlistBlock" data-no="${b.id}"><h4>${b.id} · ${esc(b.name)}</h4><p>${esc(b.objective)}</p><div class="setlistMeta"><div class="detailItem"><small>Duración música</small><div>${esc(b.musicDuration)}</div></div><div class="detailItem"><small>Control de escenario</small><div>${esc(b.stageControl)}</div></div><div class="detailItem"><small>Temas</small><div>${(b.songs||[]).length}</div></div></div><div class="setlistSongs">${(b.songs||[]).map(song=>`<div class="setlistSong"><span class="num">${song.order}</span><strong>${esc(song.title)}</strong><span class="${vocalClass(song.vocal)}">${esc(song.vocal)}</span></div>`).join('')}</div></div>`).join('');
  renderBars('setlistVocalBars', counts(rows,'vocal'));
  document.querySelector('#setlistTable tbody').innerHTML=rows.map(r=>`<tr><td><strong>${r.order}</strong></td><td>${esc(r.title)}</td><td><span class="${vocalClass(r.vocal)}">${esc(r.vocal)}</span></td><td>${r.blockId} · ${esc(r.blockName)}</td><td>${esc(r.blockObjective)}</td><td>${esc(r.stageControl)}</td></tr>`).join('');
}
function exportSetlistCSV(){const rows=setlistRows(); if(!rows.length){alert('No hay setlist cargado.');return;} const headers=[{label:'#',key:'order'},{label:'Tema',key:'title'},{label:'Voz',key:'vocal'},{label:'Bloque',key:'blockName'},{label:'Duración bloque',key:'blockDuration'},{label:'Objetivo',key:'blockObjective'},{label:'Control escenario',key:'stageControl'}]; downloadBlob('n_mayuscula_setlist_estrategico.csv', new Blob([toCSV(rows,headers)],{type:'text/csv;charset=utf-8'}));}
function downloadSetlistPDF(){downloadStatic(SETLIST_PDF_URL,'Setlist_N_Bloques_Estrategicos.pdf');}


function fillRepertoireFilters(){
  const fill=(id,values,label)=>{
    const el=document.getElementById(id); if(!el)return;
    const current=el.value;
    el.innerHTML=`<option value="">${label}</option>`+[...new Set(values.filter(Boolean).map(String))].sort((a,b)=>a.localeCompare(b,'es')).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    el.value=current;
  };
  fill('fRepBlock', db.repertoire.map(s=>s.block), 'Bloque');
  fill('fRepStatus', db.repertoire.map(s=>s.status), 'Estado');
  fill('fRepSinger', db.repertoire.map(s=>s.singer||s.leadVocal), 'Voz');
}
function repertoireFiltered(){
  const q=norm(document.getElementById('qRep')?.value||'');
  const block=document.getElementById('fRepBlock')?.value||'';
  const status=document.getElementById('fRepStatus')?.value||'';
  const singer=document.getElementById('fRepSinger')?.value||'';
  return (db.repertoire||[]).filter(s=>{
    const blob=[
      s.title,s.titleCanonical,s.artist,s.versionReference,s.singer,s.leadVocal,
      s.duration,s.durationLive,s.durationOriginal,s.durationStatus,
      s.tone,s.originalKey,s.currentKey,s.rehearsalKey,s.keyStatus,
      s.keyMiguel,s.keyEsther,s.keyLorenzo,s.transposeNotes,s.capo,s.bpm,
      s.block,s.status,s.spotifyPlaylistUrl,s.spotifyUrl,s.youtubeUrl,s.chordsUrl,
      s.chordsText,s.structure,s.lyricsNotes,s.notes,s.sourceNotes
    ].join(' ');
    return (!q||norm(blob).includes(q)) && (!block||s.block===block) && (!status||s.status===status) && (!singer||(s.singer||s.leadVocal)===singer);
  });
}
function songLinkButtons(s){
  const links=[];
  if(s.spotifyUrl)links.push(`<a class="btn small dark" target="_blank" rel="noopener" href="${esc(s.spotifyUrl)}">Spotify tema</a>`);
  if(s.spotifyPlaylistUrl)links.push(`<a class="btn small dark" target="_blank" rel="noopener" href="${esc(s.spotifyPlaylistUrl)}">Playlist</a>`);
  if(s.youtubeUrl)links.push(`<a class="btn small dark" target="_blank" rel="noopener" href="${esc(s.youtubeUrl)}">YouTube</a>`);
  if(s.chordsUrl)links.push(`<a class="btn small dark" target="_blank" rel="noopener" href="${esc(s.chordsUrl)}">Acordes</a>`);
  return links.length?`<div class="songLinks">${links.join('')}</div>`:'—';
}
function renderRepertoire(){
  const artists=document.getElementById('artists');
  if(!artists)return;
  fillRepertoireFilters();

  const playlistUrl = db.createdFrom?.spotifyPlaylistUrl || db.repertoire?.find(x=>x.spotifyPlaylistUrl)?.spotifyPlaylistUrl || '';
  const playlistBox = document.getElementById('spotifyPlaylistBox');
  if(playlistBox){
    playlistBox.innerHTML = playlistUrl
      ? `<p>Playlist de referencia cargada para el repertorio de Ñ.</p><div class="actions"><a class="btn gold" target="_blank" rel="noopener" href="${esc(playlistUrl)}">Abrir playlist Spotify</a><button class="btn dark" onclick="copyText('${esc(playlistUrl)}')">Copiar URL</button></div>`
      : `<p>No hay playlist general cargada todavía.</p>`;
  }

  artists.innerHTML=(db.artistReferences||[]).map(a=>`<span class="pill">${esc(a)}</span>`).join('');
  renderBars('repBars', counts(db.repertoire||[],'block'));
  const rows=repertoireFiltered();
  const tbody=document.querySelector('#repTable tbody');
  if(!tbody)return;
  tbody.innerHTML=rows.map(s=>`<tr>
    <td><strong>${esc(s.title)}</strong><br><small>#${esc(s.order||s.id||'—')}</small></td>
    <td>${esc(s.artist||'—')}</td>
    <td>${esc(s.singer||s.leadVocal||'—')}</td>
    <td>${esc(s.durationLive||s.duration||'—')}<br><small>${esc(s.durationStatus||'')}</small></td>
    <td>${esc(s.currentKey||s.tone||'—')}<br><small>${esc(s.keyStatus||'')}</small></td>
    <td><small>Miguel</small> ${esc(s.keyMiguel||'—')}<br><small>Esther</small> ${esc(s.keyEsther||'—')}<br><small>Lorenzo</small> ${esc(s.keyLorenzo||'—')}</td>
    <td>${esc(s.block||'—')}</td>
    <td>${badge(s.status||'—')}</td>
    <td>${songLinkButtons(s)}</td>
    <td>${(s.chordsText||s.structure||s.lyricsNotes||s.chordsUrl)?'<span class="status s-blue">Ficha</span>':'—'}</td>
    <td>${esc(compact(s.notes||s.transposeNotes||s.lyricsNotes||'',80))}</td>
    <td>
      <button class="btn small dark" onclick="viewSongModal(${s.id})">Ver</button>
      <button class="btn small gold" onclick="openSongModal(${s.id})">Editar</button>
      <button class="btn small red" onclick="deleteRecord('repertoire',${s.id})">Borrar</button>
    </td>
  </tr>`).join('');
}
function songFields(){return [
  ['title','Tema','text','span2'],
  ['artist','Artista / versión','text','span2'],
  ['versionReference','Referencia concreta / versión','text','span2'],
  ['singer','Voz principal','text'],
  ['leadVocal','Voz asignada','select','', ['Miguel','Esther','Lorenzo','Ambos','Por decidir']],
  ['durationLive','Duración directo / ensayo','text'],
  ['durationOriginal','Duración original','text'],
  ['durationStatus','Estado duración','select','', ['Confirmada','Provisional · revisar en ensayo','Pendiente validar']],
  ['tone','Tono visible','text'],
  ['originalKey','Tono original','text'],
  ['currentKey','Tono actual banda','text'],
  ['rehearsalKey','Tono propuesto ensayo','text'],
  ['keyStatus','Estado tonalidad','select','', ['Confirmada','Provisional','Pendiente de reconstrucción','Pendiente validar']],
  ['keyMiguel','Tono propuesto Miguel','text'],
  ['keyEsther','Tono propuesto Esther','text'],
  ['keyLorenzo','Tono propuesto Lorenzo','text'],
  ['transposeNotes','Notas de transporte / criterio vocal','textarea','span4'],
  ['capo','Cejilla / capo','text'],
  ['bpm','BPM','text'],
  ['block','Bloque','text','span2'],
  ['status','Estado','select','', ['Activo','Ensayo','Reserva','Descartado']],
  ['spotifyPlaylistUrl','Playlist Spotify general','url','span4'],
  ['spotifyUrl','Enlace Spotify del tema','url','span2'],
  ['youtubeUrl','Enlace YouTube / referencia','url','span2'],
  ['chordsUrl','Enlace externo acordes / letra / tabla','url','span4'],
  ['structure','Estructura del tema','textarea','span4'],
  ['chordsText','Letra / acordes / tablatura / tabla de code','textarea','span4'],
  ['lyricsNotes','Notas de interpretación / letra','textarea','span4'],
  ['sourceNotes','Fuente / validación','textarea','span4'],
  ['notes','Notas internas','textarea','span4']
];}
function openSongModal(id=null){
  const item=id?db.repertoire.find(x=>x.id===id):{block:'Bloque 1',status:'Activo',durationStatus:'Pendiente validar',keyStatus:'Pendiente validar',spotifyPlaylistUrl:db.createdFrom?.spotifyPlaylistUrl||''};
  modalContext={type:'song',id};
  document.getElementById('modalTitle').textContent=id?'Editar canción':'Nueva canción';
  document.getElementById('modalBody').innerHTML=renderForm(songFields(), item)+`<div class="hr"></div><div class="actions"><button class="btn gold" onclick="saveSong()">Guardar</button><button class="btn dark" onclick="closeModal()">Cancelar</button>${id?`<button class="btn red" onclick="deleteRecord('repertoire',${id})">Borrar</button>`:''}</div>`;
  openModal();
}
function viewSongModal(id){
  const s=db.repertoire.find(x=>x.id===id);
  if(!s)return;
  document.getElementById('modalTitle').textContent=s.title||'Ficha de canción';
  document.getElementById('modalBody').innerHTML=`
    <div class="detailGrid">
      <div class="detailItem"><small>Tema</small><div><strong>${esc(s.title||'—')}</strong></div></div>
      <div class="detailItem"><small>Artista / versión</small><div>${esc(s.artist||'—')}</div></div>
      <div class="detailItem"><small>Voz principal</small><div>${esc(s.singer||s.leadVocal||'—')}</div></div>
      <div class="detailItem"><small>Duración directo</small><div>${esc(s.durationLive||s.duration||'—')} <small>${esc(s.durationStatus||'')}</small></div></div>
      <div class="detailItem"><small>Duración original</small><div>${esc(s.durationOriginal||'—')}</div></div>
      <div class="detailItem"><small>Tono actual banda</small><div>${esc(s.currentKey||s.tone||'—')} <small>${esc(s.keyStatus||'')}</small></div></div>
      <div class="detailItem"><small>Tono original</small><div>${esc(s.originalKey||'—')}</div></div>
      <div class="detailItem"><small>Tono propuesto ensayo</small><div>${esc(s.rehearsalKey||'—')}</div></div>
      <div class="detailItem"><small>Propuesta Miguel</small><div>${esc(s.keyMiguel||'—')}</div></div>
      <div class="detailItem"><small>Propuesta Esther</small><div>${esc(s.keyEsther||'—')}</div></div>
      <div class="detailItem"><small>Propuesta Lorenzo</small><div>${esc(s.keyLorenzo||'—')}</div></div>
      <div class="detailItem"><small>Bloque / estado</small><div>${esc(s.block||'—')} · ${esc(s.status||'—')}</div></div>
    </div>
    <div class="hr"></div>
    <div class="card light"><h4>Enlaces</h4>${songLinkButtons(s)}</div>
    <div class="hr"></div>
    <div class="detailItem"><small>Notas de transporte / criterio vocal</small><div>${esc(s.transposeNotes||'—')}</div></div>
    <div class="detailItem" style="margin-top:12px"><small>Estructura</small><div class="songCode">${esc(s.structure||'—')}</div></div>
    <div class="detailItem" style="margin-top:12px"><small>Letra / acordes / tablatura / tabla de code</small><div class="songCode">${esc(s.chordsText||'—')}</div></div>
    <div class="detailItem" style="margin-top:12px"><small>Notas de interpretación / letra</small><div>${esc(s.lyricsNotes||'—')}</div></div>
    <div class="detailItem" style="margin-top:12px"><small>Fuente / validación</small><div>${esc(s.sourceNotes||'—')}</div></div>
    <div class="detailItem" style="margin-top:12px"><small>Notas internas</small><div>${esc(s.notes||'—')}</div></div>
    <div class="hr"></div>
    <div class="actions"><button class="btn gold" onclick="openSongModal(${s.id})">Editar</button><button class="btn dark" onclick="closeModal()">Cerrar</button></div>
  `;
  openModal();
}
function saveSong(){
  const obj=readForm(songFields());
  obj.duration = obj.durationLive || obj.duration || '';
  obj.tone = obj.currentKey || obj.tone || '';
  obj.leadVocal = obj.leadVocal || obj.singer || '';
  if(modalContext.id){
    const idx=db.repertoire.findIndex(x=>x.id===modalContext.id);
    db.repertoire[idx]=Object.assign({},db.repertoire[idx],obj);
  }else{
    obj.id=nextId(db.repertoire);
    obj.order=obj.order||obj.id;
    db.repertoire.push(obj);
  }
  closeModal();
  saveData();
}
function repertoireHeaders(){return [
  {label:'ID',key:'id'},
  {label:'Orden',key:'order'},
  {label:'Tema',key:'title'},
  {label:'Artista / versión',key:'artist'},
  {label:'Referencia concreta',key:'versionReference'},
  {label:'Voz principal',key:'singer'},
  {label:'Voz asignada',key:'leadVocal'},
  {label:'Duración directo',key:'durationLive'},
  {label:'Duración original',key:'durationOriginal'},
  {label:'Estado duración',key:'durationStatus'},
  {label:'Tono visible',key:'tone'},
  {label:'Tono original',key:'originalKey'},
  {label:'Tono actual banda',key:'currentKey'},
  {label:'Tono propuesto ensayo',key:'rehearsalKey'},
  {label:'Estado tonalidad',key:'keyStatus'},
  {label:'Tono Miguel',key:'keyMiguel'},
  {label:'Tono Esther',key:'keyEsther'},
  {label:'Tono Lorenzo',key:'keyLorenzo'},
  {label:'Notas transporte',key:'transposeNotes'},
  {label:'Cejilla / capo',key:'capo'},
  {label:'BPM',key:'bpm'},
  {label:'Bloque',key:'block'},
  {label:'Estado',key:'status'},
  {label:'Playlist Spotify',key:'spotifyPlaylistUrl'},
  {label:'Spotify tema',key:'spotifyUrl'},
  {label:'YouTube',key:'youtubeUrl'},
  {label:'Enlace acordes/letra',key:'chordsUrl'},
  {label:'Estructura',key:'structure'},
  {label:'Letra/acordes/tablatura',key:'chordsText'},
  {label:'Notas interpretación/letra',key:'lyricsNotes'},
  {label:'Fuente / validación',key:'sourceNotes'},
  {label:'Notas internas',key:'notes'}
];}
function exportRepertoireCSV(){
  const rows=repertoireFiltered().length?repertoireFiltered():(db.repertoire||[]);
  if(!rows.length){alert('No hay canciones cargadas.');return;}
  downloadBlob('n_mayuscula_canciones_repertorio.csv', new Blob([toCSV(rows,repertoireHeaders())],{type:'text/csv;charset=utf-8'}));
}
function openSongLinksImportModal(){
  document.getElementById('modalTitle').textContent='Cargar URLs por lote';
  document.getElementById('modalBody').innerHTML=`
    <p>Pega una línea por tema. Formato recomendado con tabuladores:</p>
    <div class="copyBox">Tema\tSpotify\tYouTube\tAcordes</div>
    <textarea id="bulkSongLinks" class="bigText" placeholder="La chica de ayer\thttps://open.spotify.com/...\thttps://youtube.com/...\thttps://..."></textarea>
    <div class="hr"></div>
    <div class="actions"><button class="btn gold" onclick="applySongLinksImport()">Aplicar URLs</button><button class="btn dark" onclick="closeModal()">Cancelar</button></div>
  `;
  openModal();
}
function splitBulkLine(line){
  if(line.includes('\t')) return line.split('\t').map(x=>x.trim());
  if(line.includes(';')) return line.split(';').map(x=>x.trim());
  return line.split(',').map(x=>x.trim());
}
function applySongLinksImport(){
  const raw=document.getElementById('bulkSongLinks')?.value||'';
  const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  let updated=0, missing=[];
  lines.forEach((line,idx)=>{
    const parts=splitBulkLine(line);
    if(idx===0 && norm(parts[0]).includes('tema')) return;
    const [title,spotify,youtube,chords]=parts;
    if(!title)return;
    const song=(db.repertoire||[]).find(s=>norm(s.title)===norm(title)||norm(s.titleCanonical)===norm(title));
    if(!song){missing.push(title);return;}
    if(spotify) song.spotifyUrl=spotify;
    if(youtube) song.youtubeUrl=youtube;
    if(chords) song.chordsUrl=chords;
    updated++;
  });
  closeModal();
  saveData();
  alert(`URLs actualizadas: ${updated}${missing.length?`\nNo encontradas: ${missing.join(', ')}`:''}`);
}
function renderDossier(){
  const b=db.brand;
  document.getElementById('proposalCards').innerHTML=b.proposal.map(x=>`<div class="card light"><h4>${esc(x.title)}</h4><p>${esc(x.text)}</p></div>`).join('');
  document.getElementById('fitList').innerHTML=b.fit.map(x=>`<li>${esc(x)}</li>`).join('');
  document.getElementById('formationList').innerHTML=b.formation.map(x=>`<li>${esc(x)}</li>`).join('');
  document.getElementById('argumentList').innerHTML=b.arguments.map(x=>`<div class="detailItem"><small>${esc(x.title)}</small><div>${esc(x.text)}</div></div>`).join('');
  document.getElementById('technicalList').innerHTML=b.technicalNeeds.map(x=>`<li>${esc(x)}</li>`).join('');
  document.getElementById('budgetNeeded').innerHTML=db.tariffs.budgetNeeded.map(x=>`<span class="pill">${esc(x)}</span>`).join('');
  document.getElementById('driveDossier').style.display=db.createdFrom.driveDossierUrl?'inline-flex':'none';
}
function renderContactOptions(){
  const q=norm(document.getElementById('templateContactSearch')?.value||'');
  const opts=db.crm.filter(x=>!q || norm([x.organization,x.email,x.municipality].join(' ')).includes(q)).slice(0,120);
  const sel=document.getElementById('templateContactSelect'); if(!sel)return;
  const cur=sel.value;
  sel.innerHTML=`<option value="">Sin contacto concreto</option>`+opts.map(x=>`<option value="${x.id}" ${String(x.id)===cur?'selected':''}>${esc(x.organization)} ${x.email?`· ${esc(x.email)}`:''}</option>`).join('');
}
function getSelectedContact(){const id=Number(document.getElementById('templateContactSelect')?.value||0);return db.crm.find(x=>x.id===id)||null;}
function applyTemplate(t, contact){
  const dossier=db.createdFrom.driveDossierUrl || 'Dossier PDF adjunto';
  const name=contact?.contactPerson || contact?.organization || 'equipo';
  return t.text.replaceAll('{{Nombre}}', name).replaceAll('{{Dossier}}', dossier);
}
function renderTemplates(){
  const c=getSelectedContact();
  document.getElementById('bandContact').innerHTML=`<div class="detailItem"><small>Email</small><div>${esc(db.brand.contact.email)}</div></div><div class="detailItem"><small>WhatsApp</small><div>${esc(db.brand.contact.whatsapp)}</div></div><div class="detailItem"><small>Instagram / YouTube</small><div>${esc(db.brand.contact.instagram)} · ${esc(db.brand.contact.youtube)}</div></div>`;
  document.getElementById('templateCards').innerHTML=db.templates.map(t=>{const txt=applyTemplate(t,c); const id='tpl_'+t.id;return `<div class="card"><h4>${esc(t.type)}</h4><p><strong>Uso:</strong> ${esc(t.when)}</p><div id="${id}" class="copyBox">${esc(txt)}</div><br><div class="actions"><button class="btn gold" onclick="copyText(document.getElementById('${id}').textContent)">Copiar</button>${c?.email?`<button class="btn dark" onclick="composeTemplate(${t.id},${c.id})">Abrir email</button>`:''}</div></div>`}).join('');
}
function composeTemplate(tid,cid){const t=db.templates.find(x=>x.id===tid), c=db.crm.find(x=>x.id===cid);if(!t||!c||!c.email)return;const body=applyTemplate(t,c);const subj=`Ñ Mayúscula · dossier comercial y disponibilidad`;location.href=`mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;}
function composeForContact(id){const c=db.crm.find(x=>x.id===id); if(!c||!c.email)return; const t=db.templates[0]; const body=applyTemplate(t,c); const subj=`Ñ Mayúscula · propuesta de directo para ${c.organization||''}`; location.href=`mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;}
function taskFields(){return [['title','Tarea','text','span2'],['owner','Responsable','text'],['due','Fecha','date'],['status','Estado','select','', ['Pendiente','En curso','Completada','Cancelada']],['priority','Prioridad','select','', ['Muy alta','Alta','Media','Baja']],['area','Área','text'],['notes','Notas','textarea','span4']];}
function renderTasks(){document.querySelector('#taskTable tbody').innerHTML=db.tasks.map(t=>`<tr><td><strong>${esc(t.title)}</strong></td><td>${esc(t.owner)}</td><td>${esc(t.due)}</td><td>${badge(t.status)}</td><td>${badge(t.priority)}</td><td>${esc(t.area)}</td><td>${esc(t.notes)}</td><td><button class="btn small gold" onclick="openTaskModal(${t.id})">Editar</button> <button class="btn small red" onclick="deleteRecord('tasks',${t.id})">Borrar</button></td></tr>`).join('')||'<tr><td colspan="8">Sin tareas.</td></tr>';}
function openTaskModal(id=null){const item=id?db.tasks.find(x=>x.id===id):{status:'Pendiente',priority:'Media'};modalContext={type:'task',id};document.getElementById('modalTitle').textContent=id?'Editar tarea':'Nueva tarea';document.getElementById('modalBody').innerHTML=renderForm(taskFields(), item)+`<div class="hr"></div><div class="actions"><button class="btn gold" onclick="saveTask()">Guardar</button><button class="btn dark" onclick="closeModal()">Cancelar</button></div>`;openModal();}
function saveTask(){
  const obj=readForm(taskFields());
  let item;
  if(modalContext.id){
    const idx=db.tasks.findIndex(x=>x.id===modalContext.id);
    item=Object.assign({},db.tasks[idx],obj);
    db.tasks[idx]=item;
  }else{
    obj.id=nextId(db.tasks);
    item=obj;
    db.tasks.push(item);
  }
  closeModal();
  saveData();
  pushTaskToSheet(item).catch(alertSheetWriteError);
}
function downloadBlob(filename, blob){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  a.rel='noopener';
  a.style.display='none';
  document.body.appendChild(a);
  try{
    a.click();
  }catch(err){
    window.open(url,'_blank');
    alert('No se ha podido iniciar la descarga automática. Se ha abierto el archivo en una pestaña nueva para guardarlo manualmente.');
  }
  setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1500);
}
function downloadStatic(url, filename){const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();}
function downloadDossier(){downloadStatic(DOSSIER_PDF_URL,'N_Mayuscula_dossier_comercial_FINAL_pulido.pdf');}
function downloadXlsx(){downloadStatic(XLSX_URL,'Ene_Mayuscula_CRM_MAESTRO_UNIFICADO_v2_columnas_distintas.xlsx');}
function exportJSON(){downloadBlob('n_mayuscula_app_backup.json', new Blob([JSON.stringify(db,null,2)],{type:'application/json;charset=utf-8'}));}
function importJSON(file){if(!file)return; const r=new FileReader();r.onload=e=>{try{db=Object.assign(clone(INITIAL_DATA), JSON.parse(e.target.result));saveData();alert('JSON importado correctamente.')}catch(err){alert('No se pudo importar el JSON.')}};r.readAsText(file,'utf-8');}
function csvEscape(v){return `"${String(v??'').replaceAll('"','""')}"`;}
function toCSV(arr, headers){return '\ufeff'+[headers.map(h=>csvEscape(h.label)).join(';')].concat(arr.map(o=>headers.map(h=>csvEscape(typeof h.key==='function'?h.key(o):o[h.key])).join(';'))).join('\n');}
function crmHeaders(){return [
  {label:'ID',key:'id'},{label:'Fila CRM',key:'sheetRow'},{label:'Campaña',key:'campaign'},{label:'Organización / Local',key:'organization'},
  {label:'Tipo oportunidad',key:'opportunityType'},{label:'Segmento',key:'segment'},{label:'Municipio / Provincia',key:'municipality'},
  {label:'Dirección',key:'address'},{label:'Email',key:'email'},{label:'Email CC',key:'emailCc'},{label:'Teléfono',key:'phone'},{label:'Web',key:'web'},
  {label:'Fuente URL',key:'sourceUrl'},{label:'Prioridad',key:'priority'},{label:'Enviar',key:'send'},{label:'Estado envío',key:'sendStatus'},
  {label:'Fecha envío',key:'sendDate'},{label:'Respuesta recibida',key:'responseReceived'},{label:'Fecha respuesta',key:'responseDate'},
  {label:'Persona contacto',key:'contactPerson'},{label:'Teléfono contacto',key:'contactPhone'},{label:'Interés',key:'interest'},
  {label:'Disponibilidad / fechas',key:'availability'},{label:'Condiciones',key:'conditions'},{label:'Caché / presupuesto',key:'budget'},
  {label:'Requisitos técnicos',key:'technicalRequirements'},{label:'Próxima acción',key:'nextAction'},{label:'Fecha próxima acción',key:'nextActionDate'},
  {label:'Notas seguimiento',key:'followNotes'},{label:'Último email recibido',key:'lastEmailReceived'},{label:'Email remitente respuesta',key:'responseSender'},
  {label:'Enviar dossier',key:'sendDossier'},{label:'Dossier enviado',key:'dossierSent'},{label:'Estado dossier',key:'dossierStatus'},{label:'Notas dossier',key:'dossierNotes'}
];}
function genericHeaders(arr){return [...new Set(arr.flatMap(o=>Object.keys(o)).filter(k=>k!=='raw'))].map(k=>({label:k,key:k}));}
function exportCSV(kind){let arr=db[kind]||[], headers=kind==='crm'?crmHeaders():genericHeaders(arr); if(!arr.length){alert('No hay datos.');return;} downloadBlob(`n_mayuscula_${kind}.csv`, new Blob([toCSV(arr,headers)],{type:'text/csv;charset=utf-8'}));}
function exportFilteredCRM(){const arr=filteredCRM.length?filteredCRM:crmFiltered(); downloadBlob('n_mayuscula_crm_filtrado.csv', new Blob([toCSV(arr,crmHeaders())],{type:'text/csv;charset=utf-8'}));}
function parseCSV(text){const first=text.split(/\r?\n/)[0]||''; const sep=(first.match(/;/g)||[]).length>=(first.match(/,/g)||[]).length?';':',';let rows=[],row=[],cur='',q=false;for(let i=0;i<text.length;i++){const ch=text[i],nx=text[i+1];if(ch==='"'&&q&&nx==='"'){cur+='"';i++;}else if(ch==='"'){q=!q;}else if(ch===sep&&!q){row.push(cur);cur='';}else if((ch==='\n'||ch==='\r')&&!q){if(cur||row.length){row.push(cur);rows.push(row);row=[];cur='';} if(ch==='\r'&&nx==='\n')i++;}else cur+=ch;} if(cur||row.length){row.push(cur);rows.push(row);}return rows.filter(r=>r.some(x=>String(x).trim()));}
function mapHeader(h){const x=norm(h);const m={'organizacion':'organization','organización':'organization','organizacion / local':'organization','organización / local':'organization','sala':'organization','empresa':'organization','campana':'campaign','campaña':'campaign','tipo oportunidad':'opportunityType','segmento':'segment','municipio / provincia':'municipality','municipio':'municipality','provincia':'municipality','direccion':'address','dirección':'address','email':'email','correo':'email','email cc':'emailCc','telefono':'phone','teléfono':'phone','web':'web','fuente url':'sourceUrl','prioridad':'priority','enviar':'send','estado envio':'sendStatus','estado envío':'sendStatus','respuesta recibida':'responseReceived','fecha respuesta':'responseDate','persona contacto':'contactPerson','interes':'interest','interés':'interest','disponibilidad / fechas':'availability','condiciones':'conditions','cache / presupuesto':'budget','caché / presupuesto':'budget','requisitos tecnicos':'technicalRequirements','requisitos técnicos':'technicalRequirements','proxima accion':'nextAction','próxima acción':'nextAction','fecha proxima accion':'nextActionDate','fecha próxima acción':'nextActionDate','notas seguimiento':'followNotes','enviar dossier':'sendDossier','estado dossier':'dossierStatus','notas dossier':'dossierNotes'};return m[x]||m[x.replaceAll('_',' ')]||x.replace(/\s+/g,'');}
function importCSVContacts(){const text=document.getElementById('csvBox').value.trim();if(!text){alert('Pega primero un CSV.');return;}const rows=parseCSV(text);if(rows.length<2){alert('No detecto cabecera y filas.');return;}const headers=rows[0].map(mapHeader);let id=nextId(db.crm);const imported=rows.slice(1).map(r=>{const o={id:id++,sheetRow:'',campaign:'Salas',priority:'Media',send:'SI',sendStatus:'Pendiente'};headers.forEach((h,i)=>{if(r[i]!==undefined)o[h]=r[i];});return o;}).filter(o=>o.organization||o.email||o.phone);db.crm=imported.concat(db.crm);saveData();alert(`Importados ${imported.length} contactos.`);}

function safeCRMTodayISO(){return new Date().toISOString().slice(0,10);}
function safeCRMImportHeader(h){
  const x=norm(h);
  const extra={
    'nombre':'organization','nombre del contacto':'contactPerson','contacto':'contactPerson','cliente':'organization','local':'organization','lugar':'organization','recinto':'organization',
    'ciudad':'municipality','ciudad / lugar':'municipality','lugar / ciudad':'municipality','fecha':'availability','fecha o ventana':'availability','fecha_o_ventana':'availability',
    'tipo evento':'opportunityType','tipo de evento':'opportunityType','evento':'opportunityType','estado':'sendStatus','estado actual':'sendStatus','estado_actual':'sendStatus',
    'siguiente paso':'nextAction','siguiente_paso':'nextAction','fecha seguimiento':'nextActionDate','fecha_siguiente_paso':'nextActionDate','fecha siguiente paso':'nextActionDate',
    'notas':'followNotes','notas clave':'followNotes','notas_clave':'followNotes','importe':'budget','importe o rango':'budget','importe_o_rango':'budget','presupuesto':'budget',
    'telefono contacto':'contactPhone','teléfono contacto':'contactPhone','whatsapp':'phone'
  };
  return extra[x] || mapHeader(h);
}
function safeCRMObjectsFromJSON(text){
  const parsed=JSON.parse(text);
  if(Array.isArray(parsed)) return parsed;
  if(parsed && Array.isArray(parsed.crm)) return parsed.crm;
  if(parsed && Array.isArray(parsed.contacts)) return parsed.contacts;
  if(parsed && Array.isArray(parsed.contactos)) return parsed.contactos;
  if(parsed && Array.isArray(parsed.oportunidades)) return parsed.oportunidades;
  if(parsed && typeof parsed==='object') return [parsed];
  return [];
}
function safeCRMObjectsFromCSV(text){
  const rows=parseCSV(text);
  if(rows.length<2) throw new Error('No detecto cabecera y filas en el CSV.');
  const headers=rows[0].map(safeCRMImportHeader);
  return rows.slice(1).map(r=>{
    const raw={};
    headers.forEach((h,i)=>{if(h && h!=='id' && r[i]!==undefined) raw[h]=r[i];});
    return raw;
  });
}
function normalizeSafeCRMContact(raw,id,fileName){
  raw=raw||{};
  const o={id:id,sheetRow:'',campaign:'Importación CRM',priority:'Media',send:'Revisar',sendStatus:'Pendiente de revisión',nextAction:'Revisar contacto importado',nextActionDate:safeCRMTodayISO(),rawImport:raw,importSource:fileName||''};
  Object.keys(raw).forEach(k=>{
    const mapped=safeCRMImportHeader(k);
    if(mapped && mapped!=='id') o[mapped]=raw[k];
  });
  o.organization=o.organization||raw.organizacion||raw.organización||raw.nombre||raw.empresa||raw.sala||raw.cliente||raw.local||raw.lugar||'';
  o.contactPerson=o.contactPerson||raw.contacto||raw.persona||raw.nombreContacto||raw.nombre_contacto||'';
  o.email=o.email||raw.correo||raw.mail||'';
  o.phone=o.phone||raw.telefono||raw.teléfono||raw.whatsapp||'';
  o.municipality=o.municipality||raw.ciudad||raw.municipio||raw.lugar||'';
  o.opportunityType=o.opportunityType||raw.tipo_evento||raw.tipoEvento||raw.evento||'';
  o.availability=o.availability||raw.fecha||raw.fecha_o_ventana||raw.fechaVentana||'';
  o.budget=o.budget||raw.importe||raw.importe_o_rango||raw.presupuesto||'';
  o.followNotes=o.followNotes||raw.notas||raw.notas_clave||'';
  ['organization','campaign','priority','send','sendStatus','nextAction','nextActionDate','contactPerson','email','phone','municipality','opportunityType','availability','budget','followNotes','conditions','technicalRequirements','interest'].forEach(k=>{
    if(typeof o[k]==='string') o[k]=o[k].trim();
  });
  if(!o.campaign) o.campaign='Importación CRM';
  if(!o.priority) o.priority='Media';
  if(!o.send) o.send='Revisar';
  if(!o.sendStatus) o.sendStatus='Pendiente de revisión';
  if(!o.nextAction) o.nextAction='Revisar contacto importado';
  if(!o.nextActionDate) o.nextActionDate=safeCRMTodayISO();
  return o;
}
function safeImportCRMFile(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const content=String(e.target.result||'').trim();
      if(!content){alert('El archivo está vacío.');return;}
      const isJSON=/\.json$/i.test(file.name)||content[0]==='{'||content[0]==='[';
      const rawItems=isJSON?safeCRMObjectsFromJSON(content):safeCRMObjectsFromCSV(content);
      let id=nextId(db.crm);
      const imported=rawItems.map(x=>normalizeSafeCRMContact(x,id++,file.name)).filter(o=>o.organization||o.email||o.phone||o.contactPerson);
      if(!imported.length){alert('No se han detectado contactos útiles. Revisa que haya organización, contacto, email o teléfono.');return;}
      if(!confirm(`Se añadirán ${imported.length} registros al CRM actual. No se borrará ni sustituirá nada. ¿Continuar?`))return;
      db.crm=imported.concat(db.crm);
      db.createdFrom.lastImport=`${new Date().toLocaleString('es-ES')} · carga segura CRM · ${file.name}`;
      saveData();
      setTab('crm');
      alert(`Carga completada: ${imported.length} registros añadidos al CRM.`);
    }catch(err){
      alert('No se pudo cargar el archivo CRM: '+err.message);
    }
  };
  r.readAsText(file,'utf-8');
}

function copyText(txt){navigator.clipboard?.writeText(txt).then(()=>alert('Copiado.')).catch(()=>{const t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();alert('Copiado.');});}

function rowVal(obj, keys){
  for(const k of keys){
    if(obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return obj[k];
  }
  return '';
}

function applyLadyStoneFromSheet(ticketsRows, movementsRows, invoicesRows){
  const ls=ensureLadyStone();
  if(Array.isArray(ticketsRows) && ticketsRows.length){
    ls.tickets = ticketsRows.map(r=>({
      id: rowVal(r,['id','ID']) || ('agreement_'+Date.now()+'_'+Math.random().toString(36).slice(2)),
      project: normalizeLadyProjectName(rowVal(r,['Proyecto','project'])),
      date: rowVal(r,['Fecha','date']),
      event: rowVal(r,['Evento','event']),
      venue: rowVal(r,['Sala','venue']),
      agreementType: rowVal(r,['Modelo_economico','agreementType']) || 'canon_mas_taquilla',
      agreementLabel: rowVal(r,['Modelo_economico_texto','agreementLabel']) || agreementLabel(rowVal(r,['Modelo_economico','agreementType']) || 'canon_mas_taquilla'),
      channel: rowVal(r,['Canal','channel']),
      url: rowVal(r,['Enlace','url']),
      capacity: parseEuroValue(rowVal(r,['Aforo','capacity'])),
      invites: parseEuroValue(rowVal(r,['Invitaciones','invites'])),
      cacheFixed: parseEuroValue(rowVal(r,['Cache_fijo','cacheFixed'])),
      minimumGuarantee: parseEuroValue(rowVal(r,['Minimo_garantizado','minimumGuarantee'])),
      extraSound: parseEuroValue(rowVal(r,['Extra_sonido','extraSound'])),
      extraLights: parseEuroValue(rowVal(r,['Extra_luces','extraLights'])),
      extraTravel: parseEuroValue(rowVal(r,['Extra_desplazamiento','extraTravel'])),
      extraOther: parseEuroValue(rowVal(r,['Extra_otros','extraOther'])),
      extrasTotal: parseEuroValue(rowVal(r,['Extras_total','extrasTotal'])),
      priceAdvance: parseEuroValue(rowVal(r,['Precio_anticipada','priceAdvance'])),
      soldAdvance: parseEuroValue(rowVal(r,['Vendidas_anticipada','soldAdvance'])),
      priceDoor: parseEuroValue(rowVal(r,['Precio_taquilla','priceDoor'])),
      soldDoor: parseEuroValue(rowVal(r,['Vendidas_taquilla','soldDoor'])),
      ticketPct: parseEuroValue(rowVal(r,['Porcentaje_taquilla','ticketPct'])),
      soldTotal: parseEuroValue(rowVal(r,['Entradas_vendidas','soldTotal'])),
      gross: parseEuroValue(rowVal(r,['Taquilla_bruta','gross'])),
      netAfterVat: parseEuroValue(rowVal(r,['Taquilla_neta_sin_iva','netAfterVat'])),
      vatAmount: parseEuroValue(rowVal(r,['IVA_cultural','vatAmount'])),
      ticketPctAmount: parseEuroValue(rowVal(r,['Importe_porcentaje_taquilla','ticketPctAmount'])),
      barGross: parseEuroValue(rowVal(r,['Barra_bruta','barGross'])),
      barPct: parseEuroValue(rowVal(r,['Porcentaje_barra','barPct'])),
      barBaseMode: rowVal(r,['Base_barra','barBaseMode']),
      barBase: parseEuroValue(rowVal(r,['Barra_base_calculo','barBase'])),
      barWindow: rowVal(r,['Horario_barra','barWindow']),
      barPctAmount: parseEuroValue(rowVal(r,['Importe_porcentaje_barra','barPctAmount'])),
      canon: parseEuroValue(rowVal(r,['Canon_sala','canon'])),
      sgaeMode: rowVal(r,['SGAE_modo','sgaeMode']),
      sgaeAmount: parseEuroValue(rowVal(r,['SGAE_estimado','sgaeAmount'])),
      otherExpenses: parseEuroValue(rowVal(r,['Otros_gastos','otherExpenses'])),
      manualAmount: parseEuroValue(rowVal(r,['Ajuste_manual','manualAmount'])),
      agreementGross: parseEuroValue(rowVal(r,['Importe_base_acuerdo','agreementGross'])),
      baseDescription: rowVal(r,['Base_calculo','baseDescription']),
      netEstimate: parseEuroValue(rowVal(r,['Neto_estimado','netEstimate'])),
      netPerProject: parseEuroValue(rowVal(r,['Neto_por_proyecto','netPerProject'])),
      splitBands: rowVal(r,['Reparto_bandas','splitBands']),
      status: rowVal(r,['Estado','status']) || 'Previsión',
      notes: rowVal(r,['Notas','notes'])
    }));
  }
  if(Array.isArray(movementsRows) && movementsRows.length){
    ls.movements = movementsRows.map(r=>({
      id: rowVal(r,['id','ID']) || ('mov_'+Date.now()+'_'+Math.random().toString(36).slice(2)),
      project: normalizeLadyProjectName(rowVal(r,['Proyecto','project'])),
      date: rowVal(r,['Fecha','date']),
      type: rowVal(r,['Tipo','type']) || 'gasto',
      concept: rowVal(r,['Concepto','concept']),
      amount: parseEuroValue(rowVal(r,['Importe','amount'])),
      paidBy: rowVal(r,['Pagado_por','paidBy']),
      method: rowVal(r,['Forma_pago','method']),
      status: rowVal(r,['Estado','status']) || 'Registrado',
      notes: rowVal(r,['Notas','notes'])
    }));
  }
  if(Array.isArray(invoicesRows) && invoicesRows.length){
    ls.invoices = invoicesRows.map(r=>({
      id: rowVal(r,['id','ID']) || ('fac_'+Date.now()+'_'+Math.random().toString(36).slice(2)),
      project: normalizeLadyProjectName(rowVal(r,['Proyecto','project'])),
      date: rowVal(r,['Fecha','date']),
      client: rowVal(r,['Cliente','client']),
      concept: rowVal(r,['Concepto','concept']),
      amount: parseEuroValue(rowVal(r,['Importe','amount'])),
      status: rowVal(r,['Estado','status']) || 'Pendiente emitir',
      invoiceBy: rowVal(r,['Quien_factura','invoiceBy']),
      dueDate: rowVal(r,['Fecha_cobro_prevista','dueDate']),
      notes: rowVal(r,['Notas','notes'])
    }));
  }
}

function getInputVal(id){const el=document.getElementById(id); return el ? el.value : '';}
function setInputVal(id, value){const el=document.getElementById(id); if(el) el.value=value;}

const LADY_STONE_AGREEMENT_LABELS = {
  cache_fijo:'Caché fijo',
  cache_fijo_extras:'Caché fijo + extras',
  minimo_mas_taquilla:'Mínimo garantizado + porcentaje de taquilla',
  porcentaje_taquilla:'Porcentaje de taquilla',
  porcentaje_barra:'Porcentaje de barra / bebidas',
  taquilla_mas_barra:'Porcentaje de taquilla + barra',
  canon_mas_taquilla:'Canon de sala + taquilla para la banda',
  taquilla_sala:'Taquilla gestionada por la sala',
  taquilla_banda:'Taquilla gestionada por la banda',
  mixto:'Acuerdo mixto / personalizado'
};

function agreementLabel(v){
  return LADY_STONE_AGREEMENT_LABELS[v] || v || 'Acuerdo sin definir';
}

function ladyStoneTicketEstimateFromForm(){
  const agreementType=getInputVal('lstAgreementType') || 'canon_mas_taquilla';

  const cacheFixed=parseEuroValue(getInputVal('lstCacheFixed'));
  const minimumGuarantee=parseEuroValue(getInputVal('lstMinimumGuarantee'));
  const extraSound=parseEuroValue(getInputVal('lstExtraSound'));
  const extraLights=parseEuroValue(getInputVal('lstExtraLights'));
  const extraTravel=parseEuroValue(getInputVal('lstExtraTravel'));
  const extraOther=parseEuroValue(getInputVal('lstExtraOther'));
  const extrasTotal=extraSound+extraLights+extraTravel+extraOther;

  const priceAdvance=parseEuroValue(getInputVal('lstPriceAdvance'));
  const soldAdvance=parseEuroValue(getInputVal('lstSoldAdvance'));
  const priceDoor=parseEuroValue(getInputVal('lstPriceDoor'));
  const soldDoor=parseEuroValue(getInputVal('lstSoldDoor'));
  const ticketPct=parseEuroValue(getInputVal('lstTicketPct')) || 0;

  const barGross=parseEuroValue(getInputVal('lstBarGross'));
  const barPct=parseEuroValue(getInputVal('lstBarPct')) || 0;
  const barBaseMode=getInputVal('lstBarBase') || 'bruta';
  const barWindow=getInputVal('lstBarWindow') || '';

  const canon=parseEuroValue(getInputVal('lstCanon'));
  const vatPct=parseEuroValue(getInputVal('lstVatPct')) || 10;
  const sgaeMode=getInputVal('lstSgaeMode') || 'sala';
  const sgaePct=parseEuroValue(getInputVal('lstSgaePct')) || 8.5;
  const otherExpenses=parseEuroValue(getInputVal('lstOtherExpenses'));
  const manualAmount=parseEuroValue(getInputVal('lstManualAmount'));
  const splitBands=getInputVal('lstSplitBands') || '1';

  const gross=(priceAdvance*soldAdvance)+(priceDoor*soldDoor);
  const soldTotal=soldAdvance+soldDoor;
  const netAfterVat = gross / (1 + vatPct/100);
  const vatAmount = gross - netAfterVat;
  const ticketPctAmount = netAfterVat * (ticketPct/100);

  const barBase = barBaseMode === 'neta' ? (barGross / (1 + vatPct/100)) : barGross;
  const barPctAmount = barBase * (barPct/100);

  const sgaeBase = netAfterVat > 0 ? netAfterVat : 0;
  const sgaeAmount = sgaeMode === 'promotor' ? (sgaeBase * sgaePct / 100) : 0;

  let agreementGross=0;
  let baseDescription='';

  switch(agreementType){
    case 'cache_fijo':
      agreementGross = cacheFixed;
      baseDescription = 'Caché fijo';
      break;
    case 'cache_fijo_extras':
      agreementGross = cacheFixed + extrasTotal;
      baseDescription = 'Caché fijo + extras';
      break;
    case 'minimo_mas_taquilla':
      agreementGross = Math.max(minimumGuarantee, ticketPctAmount) + extrasTotal;
      baseDescription = `Mayor entre mínimo ${money2(minimumGuarantee)} y ${ticketPct}% taquilla`;
      break;
    case 'porcentaje_taquilla':
      agreementGross = ticketPctAmount + extrasTotal;
      baseDescription = `${ticketPct}% de taquilla neta`;
      break;
    case 'porcentaje_barra':
      agreementGross = barPctAmount + extrasTotal;
      baseDescription = `${barPct}% de barra ${barBaseMode}`;
      break;
    case 'taquilla_mas_barra':
      agreementGross = ticketPctAmount + barPctAmount + extrasTotal;
      baseDescription = `${ticketPct}% taquilla + ${barPct}% barra`;
      break;
    case 'canon_mas_taquilla':
    case 'taquilla_sala':
    case 'taquilla_banda':
      agreementGross = netAfterVat + extrasTotal;
      baseDescription = 'Taquilla neta sin IVA cultural + extras';
      break;
    case 'mixto':
      agreementGross = cacheFixed + ticketPctAmount + barPctAmount + extrasTotal + manualAmount;
      baseDescription = 'Caché + taquilla + barra + ajuste manual';
      break;
    default:
      agreementGross = cacheFixed + ticketPctAmount + barPctAmount + extrasTotal + manualAmount;
      baseDescription = 'Acuerdo personalizado';
  }

  const netEstimate = agreementGross - canon - sgaeAmount - otherExpenses;
  const split = splitBands === '2' ? 2 : 1;
  const netPerProject = splitBands === 'custom' ? netEstimate : netEstimate / split;

  return {
    agreementType, agreementLabel:agreementLabel(agreementType),
    cacheFixed, minimumGuarantee, extraSound, extraLights, extraTravel, extraOther, extrasTotal,
    priceAdvance,soldAdvance,priceDoor,soldDoor,ticketPct,canon,vatPct,sgaeMode,sgaePct,otherExpenses,manualAmount,splitBands,
    barGross,barPct,barBaseMode,barBase,barWindow,
    gross,soldTotal,netAfterVat,vatAmount,ticketPctAmount,barPctAmount,sgaeAmount,agreementGross,baseDescription,netEstimate,netPerProject
  };
}

function calculateLadyStoneTicketForm(){
  const el=document.getElementById('ladyTicketCalc');
  if(!el) return;
  const c=ladyStoneTicketEstimateFromForm();
  const warn = c.sgaeMode === 'promotor' ? 'SGAE estimada a cargo del promotor.' : (c.sgaeMode === 'sala' ? 'SGAE marcada como gestionada por la sala.' : 'SGAE sin confirmar.');
  el.innerHTML = `
    <strong>Estimación del acuerdo:</strong> ${esc(c.agreementLabel)}<br>
    Base de cálculo: ${esc(c.baseDescription)} · Importe base: ${money2(c.agreementGross)}<br>
    Caché: ${money2(c.cacheFixed)} · Extras: ${money2(c.extrasTotal)} · Mínimo garantizado: ${money2(c.minimumGuarantee)}<br>
    Entradas vendidas: ${c.soldTotal} · Taquilla bruta: ${money2(c.gross)} · Neto sin IVA cultural: ${money2(c.netAfterVat)} · % taquilla: ${money2(c.ticketPctAmount)}<br>
    Barra declarada: ${money2(c.barGross)} · Base barra: ${money2(c.barBase)} · % barra: ${money2(c.barPctAmount)} ${c.barWindow ? '· Horario: '+esc(c.barWindow) : ''}<br>
    Canon: ${money2(c.canon)} · SGAE: ${money2(c.sgaeAmount)} · Otros gastos: ${money2(c.otherExpenses)} · Ajuste manual: ${money2(c.manualAmount)}<br>
    <strong>Neto estimado total:</strong> ${money2(c.netEstimate)} · <strong>Neto por proyecto:</strong> ${money2(c.netPerProject)}<br>
    <span class="muted">${esc(warn)} Cifras orientativas; validar contrato, liquidación, factura y fiscalidad antes de cerrar.</span>
  `;
  updateLadyStoneAgreementFormMode();
  return c;
}


function ladyStoneTicketNaturalKey(t){
  const project=normalizeLadyProjectName(t.project);
  const date=String(t.date||'').trim();
  const event=norm(t.event||'');
  const venue=norm(t.venue||'');
  if(!project || !date || !event) return '';
  return [project,date,event,venue].join('|');
}

function findLadyStoneTicketDuplicate(ticket, excludeId){
  const ls=ensureLadyStone();
  const key=ladyStoneTicketNaturalKey(ticket);
  if(!key) return null;
  return (ls.tickets||[]).find(t => String(t.id||'') !== String(excludeId||'') && ladyStoneTicketNaturalKey(t) === key) || null;
}

function ladyStoneTicketFromForm(id){
  const c=ladyStoneTicketEstimateFromForm();
  return {
    id:id || 'agreement_'+Date.now(),
    project:normalizeLadyProjectName(getInputVal('lstTicketProject')),
    date:getInputVal('lstTicketDate') || todayISO(),
    event:getInputVal('lstTicketEvent') || 'Evento sin nombre',
    venue:getInputVal('lstTicketVenue') || '',
    agreementType:c.agreementType,
    agreementLabel:c.agreementLabel,
    channel:getInputVal('lstTicketChannel') || '',
    url:getInputVal('lstTicketUrl') || '',
    capacity:parseEuroValue(getInputVal('lstTicketCapacity')),
    invites:parseEuroValue(getInputVal('lstInvites')),
    cacheFixed:c.cacheFixed,
    minimumGuarantee:c.minimumGuarantee,
    extraSound:c.extraSound,
    extraLights:c.extraLights,
    extraTravel:c.extraTravel,
    extraOther:c.extraOther,
    extrasTotal:c.extrasTotal,
    priceAdvance:c.priceAdvance,
    soldAdvance:c.soldAdvance,
    priceDoor:c.priceDoor,
    soldDoor:c.soldDoor,
    ticketPct:c.ticketPct,
    soldTotal:c.soldTotal,
    gross:c.gross,
    netAfterVat:c.netAfterVat,
    vatAmount:c.vatAmount,
    ticketPctAmount:c.ticketPctAmount,
    barGross:c.barGross,
    barPct:c.barPct,
    barBaseMode:c.barBaseMode,
    barBase:c.barBase,
    barWindow:c.barWindow,
    barPctAmount:c.barPctAmount,
    canon:c.canon,
    sgaeMode:c.sgaeMode,
    sgaeAmount:c.sgaeAmount,
    otherExpenses:c.otherExpenses,
    manualAmount:c.manualAmount,
    agreementGross:c.agreementGross,
    baseDescription:c.baseDescription,
    netEstimate:c.netEstimate,
    netPerProject:c.netPerProject,
    splitBands:c.splitBands,
    status:'Previsión',
    notes:getInputVal('lstTicketNotes') || '',
    updatedAt:new Date().toISOString()
  };
}

function saveLadyStoneTicket(){
  const ls=ensureLadyStone();
  const editingId=String(getInputVal('lstAgreementId') || '').trim();
  let ticket=ladyStoneTicketFromForm(editingId || null);

  const duplicate=findLadyStoneTicketDuplicate(ticket, editingId);
  if(duplicate && !editingId){
    const ok=confirm('Ya existe un acuerdo para este proyecto, fecha, evento y sala/lugar.\\n\\n¿Quieres actualizar ese acuerdo existente en vez de crear un duplicado?');
    if(!ok) return;
    ticket.id=duplicate.id;
    ticket.createdFromDuplicate=true;
  }

  const idx=(ls.tickets||[]).findIndex(t=>String(t.id||'')===String(ticket.id||''));
  if(idx>=0){
    ls.tickets[idx]=Object.assign({}, ls.tickets[idx], ticket, {updatedAt:new Date().toISOString()});
  }else{
    ls.tickets.unshift(ticket);
  }

  setInputVal('lstAgreementId', ticket.id);
  saveData();
  updateLadyStoneAgreementFormMode();
  pushLadyStoneTicketToSheet(ticket).catch(alertSheetWriteError);
}

function createLadyStoneTicket(){
  return saveLadyStoneTicket();
}

function editLadyStoneTicket(id){
  const ls=ensureLadyStone();
  const t=(ls.tickets||[]).find(x=>String(x.id||'')===String(id||''));
  if(!t){
    alert('No encuentro ese acuerdo. Actualiza desde Google Sheet e inténtalo de nuevo.');
    return;
  }
  setInputVal('lstAgreementId', t.id || '');
  setInputVal('lstAgreementType', t.agreementType || 'canon_mas_taquilla');
  setInputVal('lstTicketProject', t.project || 'Ñ Mayúscula');
  setInputVal('lstTicketDate', t.date || todayISO());
  setInputVal('lstTicketEvent', t.event || '');
  setInputVal('lstTicketVenue', t.venue || '');
  setInputVal('lstTicketChannel', t.channel || 'Passline sala');
  setInputVal('lstTicketCapacity', t.capacity ?? 150);
  setInputVal('lstTicketUrl', t.url || '');
  setInputVal('lstCacheFixed', t.cacheFixed ?? 0);
  setInputVal('lstMinimumGuarantee', t.minimumGuarantee ?? 0);
  setInputVal('lstExtraSound', t.extraSound ?? 0);
  setInputVal('lstExtraLights', t.extraLights ?? 0);
  setInputVal('lstExtraTravel', t.extraTravel ?? 0);
  setInputVal('lstExtraOther', t.extraOther ?? 0);
  setInputVal('lstPriceAdvance', t.priceAdvance ?? 10);
  setInputVal('lstSoldAdvance', t.soldAdvance ?? 0);
  setInputVal('lstPriceDoor', t.priceDoor ?? 12);
  setInputVal('lstSoldDoor', t.soldDoor ?? 0);
  setInputVal('lstTicketPct', t.ticketPct ?? 100);
  setInputVal('lstInvites', t.invites ?? 0);
  setInputVal('lstBarGross', t.barGross ?? 0);
  setInputVal('lstBarPct', t.barPct ?? 0);
  setInputVal('lstBarBase', t.barBaseMode || 'bruta');
  setInputVal('lstBarWindow', t.barWindow || '');
  setInputVal('lstCanon', t.canon ?? 0);
  setInputVal('lstVatPct', t.vatPct ?? 10);
  setInputVal('lstSgaeMode', t.sgaeMode || 'sala');
  setInputVal('lstSgaePct', t.sgaePct ?? 8.5);
  setInputVal('lstOtherExpenses', t.otherExpenses ?? 0);
  setInputVal('lstManualAmount', t.manualAmount ?? 0);
  setInputVal('lstSplitBands', t.splitBands || '1');
  setInputVal('lstTicketNotes', t.notes || '');
  calculateLadyStoneTicketForm();
  updateLadyStoneAgreementFormMode();
  document.getElementById('ladyTicketCalc')?.scrollIntoView({behavior:'smooth', block:'center'});
}

function resetLadyStoneTicketForm(){
  setInputVal('lstAgreementId','');
  setInputVal('lstAgreementType','canon_mas_taquilla');
  setInputVal('lstTicketProject','Ñ Mayúscula');
  setInputVal('lstTicketDate', todayISO());
  setInputVal('lstTicketEvent','');
  setInputVal('lstTicketVenue','');
  setInputVal('lstTicketChannel','Passline sala');
  setInputVal('lstTicketCapacity',150);
  setInputVal('lstTicketUrl','');
  setInputVal('lstCacheFixed',0);
  setInputVal('lstMinimumGuarantee',0);
  setInputVal('lstExtraSound',0);
  setInputVal('lstExtraLights',0);
  setInputVal('lstExtraTravel',0);
  setInputVal('lstExtraOther',0);
  setInputVal('lstPriceAdvance',10);
  setInputVal('lstSoldAdvance',0);
  setInputVal('lstPriceDoor',12);
  setInputVal('lstSoldDoor',0);
  setInputVal('lstTicketPct',100);
  setInputVal('lstInvites',0);
  setInputVal('lstBarGross',0);
  setInputVal('lstBarPct',0);
  setInputVal('lstBarBase','bruta');
  setInputVal('lstBarWindow','');
  setInputVal('lstCanon',423.50);
  setInputVal('lstVatPct',10);
  setInputVal('lstSgaeMode','sala');
  setInputVal('lstSgaePct',8.5);
  setInputVal('lstOtherExpenses',0);
  setInputVal('lstManualAmount',0);
  setInputVal('lstSplitBands','2');
  setInputVal('lstTicketNotes','');
  calculateLadyStoneTicketForm();
  updateLadyStoneAgreementFormMode();
}

function deleteLadyStoneTicket(id){
  const ls=ensureLadyStone();
  const t=(ls.tickets||[]).find(x=>String(x.id||'')===String(id||''));
  if(!t){
    alert('No encuentro ese acuerdo.');
    return;
  }
  if(!confirm('Vas a borrar este acuerdo económico:\\n\\n'+(t.event||'Evento sin nombre')+' · '+(t.project||'')+' · '+(t.date||'')+'\\n\\n¿Confirmas el borrado?')) return;
  ls.tickets=(ls.tickets||[]).filter(x=>String(x.id||'')!==String(id||''));
  if(String(getInputVal('lstAgreementId')||'')===String(id||'')) resetLadyStoneTicketForm();
  saveData();
  deleteLadyStoneTicketFromSheet(id).catch(alertSheetWriteError);
}

function consolidateLadyStoneTicketDuplicates(){
  const ls=ensureLadyStone();
  const byKey={};
  const keep=[];
  const remove=[];
  (ls.tickets||[]).forEach(t=>{
    const key=ladyStoneTicketNaturalKey(t);
    if(!key){
      keep.push(t);
      return;
    }
    if(!byKey[key]){
      byKey[key]=t;
      keep.push(t);
      return;
    }
    const current=byKey[key];
    const currentDate=new Date(current.updatedAt || current.date || 0).getTime() || 0;
    const newDate=new Date(t.updatedAt || t.date || 0).getTime() || 0;
    if(newDate>currentDate){
      const idx=keep.findIndex(x=>String(x.id||'')===String(current.id||''));
      if(idx>=0) keep[idx]=t;
      remove.push(current);
      byKey[key]=t;
    }else{
      remove.push(t);
    }
  });
  if(!remove.length){
    alert('No se han encontrado acuerdos duplicados por proyecto + fecha + evento + sala/lugar.');
    return;
  }
  if(!confirm('Se han encontrado '+remove.length+' acuerdo(s) duplicado(s).\\n\\nSe conservará el más reciente por proyecto + fecha + evento + sala/lugar y se borrarán los duplicados.\\n\\n¿Continuar?')) return;
  ls.tickets=keep;
  saveData();
  Promise.all(remove.filter(x=>x.id).map(x=>deleteLadyStoneTicketFromSheet(x.id).catch(err=>err))).then(()=>{
    alert('Duplicados consolidados. Revisa Google Sheet si algún borrado no se pudo sincronizar.');
  });
}

function updateLadyStoneAgreementFormMode(){
  const id=String(getInputVal('lstAgreementId')||'').trim();
  const saveBtn=document.getElementById('lstSaveAgreementBtn');
  const deleteBtn=document.getElementById('lstDeleteAgreementBtn');
  const mode=document.getElementById('lstAgreementMode');
  if(saveBtn) saveBtn.textContent = id ? 'Actualizar acuerdo económico' : 'Guardar acuerdo económico';
  if(deleteBtn) deleteBtn.disabled = !id;
  if(mode) mode.textContent = id ? ('Editando acuerdo: '+id) : 'Nuevo acuerdo';
}

function createLadyStoneMovement(){
  const ls=ensureLadyStone();
  const mov={
    id:'mov_'+Date.now(),
    project:normalizeLadyProjectName(getInputVal('lstMovementProject')),
    type:getInputVal('lstMovementType') || 'gasto',
    date:getInputVal('lstMovementDate') || todayISO(),
    concept:getInputVal('lstMovementConcept') || 'Movimiento sin concepto',
    amount:parseEuroValue(getInputVal('lstMovementAmount')),
    paidBy:getInputVal('lstMovementPaidBy') || '',
    method:getInputVal('lstMovementMethod') || '',
    status:'Registrado',
    notes:getInputVal('lstMovementNotes') || '',
    updatedAt:new Date().toISOString()
  };
  ls.movements.unshift(mov);
  saveData();
  pushLadyStoneMovementToSheet(mov).catch(alertSheetWriteError);
}

function createLadyStoneInvoice(){
  const ls=ensureLadyStone();
  const inv={
    id:'inv_'+Date.now(),
    project:normalizeLadyProjectName(getInputVal('lstInvoiceProject')),
    status:getInputVal('lstInvoiceStatus') || 'Pendiente emitir',
    date:getInputVal('lstInvoiceDate') || todayISO(),
    client:getInputVal('lstInvoiceClient') || '',
    concept:getInputVal('lstInvoiceConcept') || '',
    amount:parseEuroValue(getInputVal('lstInvoiceAmount')),
    invoiceBy:getInputVal('lstInvoiceBy') || '',
    dueDate:getInputVal('lstInvoiceDue') || '',
    notes:getInputVal('lstInvoiceNotes') || '',
    updatedAt:new Date().toISOString()
  };
  ls.invoices.unshift(inv);
  saveData();
  pushLadyStoneInvoiceToSheet(inv).catch(alertSheetWriteError);
}

function projectTotals(project){
  const ls=ensureLadyStone();
  const movements=ls.movements.filter(x=>normalizeLadyProjectName(x.project)===project);
  const ingresos=movements.filter(x=>norm(x.type).includes('ingreso')).reduce((a,x)=>a+parseEuroValue(x.amount),0);
  const gastos=movements.filter(x=>norm(x.type).includes('gasto')).reduce((a,x)=>a+parseEuroValue(x.amount),0);
  const tickets=ls.tickets.filter(x=>normalizeLadyProjectName(x.project)===project).reduce((a,x)=>a+parseEuroValue(x.netPerProject || x.netEstimate),0);
  const invoices=ls.invoices.filter(x=>normalizeLadyProjectName(x.project)===project);
  const pendienteFacturar=invoices.filter(x=>norm(x.status).includes('pendiente')).reduce((a,x)=>a+parseEuroValue(x.amount),0);
  return {ingresos,gastos,tickets,invoices,pendienteFacturar,saldo:ingresos+tickets-gastos};
}

function renderLadyStoneAdmin(){
  const ls=ensureLadyStone();
  const assoc=document.getElementById('ladyAssociationCard');
  if(!assoc) return;
  assoc.innerHTML = `<h4>Asociación</h4>
    <div class="detailItem"><small>Nombre</small><strong>${esc(ls.association.name)}</strong></div>
    <div class="detailItem"><small>Ámbito</small><strong>${esc(ls.association.scope)}</strong></div>
    <div class="detailItem"><small>Domicilio social/fiscal</small><span>${esc(ls.association.address)}</span></div>
    <div class="detailItem"><small>Sede operativa</small><span>${esc(ls.association.operationalBase)}</span></div>
    <div class="detailItem"><small>Estado</small>${badge(ls.association.status)}</div>`;

  const proj=document.getElementById('ladyProjectSummary');
  const projectNames=['Ñ Mayúscula','Breathless Cover Band','Común asociación'];
  proj.innerHTML='<h4>Resumen por proyecto</h4>' + projectNames.map(name=>{
    const t=projectTotals(name);
    return `<div class="detailItem"><small>${esc(name)}</small><strong>Saldo interno estimado: ${money2(t.saldo)}</strong><br><span class="muted">Acuerdos previstos: ${money2(t.tickets)} · Ingresos: ${money2(t.ingresos)} · Gastos: ${money2(t.gastos)}</span></div>`;
  }).join('');

  const warn=document.getElementById('ladyQuickWarnings');
  warn.innerHTML=`<h4>Puntos de control</h4>
    <ul class="cleanList">
      <li>Separar siempre movimientos de Ñ, BCB y común.</li>
      <li>Si el acuerdo incluye taquilla o barra, pedir reporte de ventas/liquidación por escrito.</li>
      <li>No cerrar porcentajes de barra/taquilla sin definir base bruta/neta, horario, reporte y responsable de liquidación.</li>
      <li>La asociación central no debe mezclar saldos internos entre proyectos.</li>
    </ul>`;

  const ticketBody=document.querySelector('#ladyTicketsTable tbody');
  ticketBody.innerHTML=(ls.tickets||[]).slice(0,30).map(t=>`<tr>
    <td>${esc(t.date||'')}</td><td>${esc(t.project||'')}</td><td><strong>${esc(t.event||'')}</strong><br><small>${esc(t.venue||'')}</small></td>
    <td>${esc(t.agreementLabel || agreementLabel(t.agreementType) || 'Acuerdo')}</td><td>${esc(t.baseDescription || '')}</td><td>${money2(t.netEstimate)}</td><td>${esc(t.channel||'')}</td>
    <td class="actions" style="gap:6px;flex-wrap:nowrap"><button class="btn ghost" type="button" onclick="editLadyStoneTicket('${esc(t.id||'')}')">Editar</button><button class="btn danger" type="button" onclick="deleteLadyStoneTicket('${esc(t.id||'')}')">Borrar</button></td>
  </tr>`).join('') || `<tr><td colspan="8" class="muted">Sin acuerdos económicos todavía.</td></tr>`;

  const movBody=document.querySelector('#ladyMovementsTable tbody');
  movBody.innerHTML=(ls.movements||[]).slice(0,20).map(m=>`<tr>
    <td>${esc(m.date||'')}</td><td>${esc(m.project||'')}</td><td>${badge(m.type||'')}</td><td>${esc(m.concept||'')}</td><td>${money2(m.amount)}</td><td>${esc(m.status||'')}</td>
  </tr>`).join('') || `<tr><td colspan="6" class="muted">Sin movimientos registrados.</td></tr>`;

  const invBody=document.querySelector('#ladyInvoicesTable tbody');
  invBody.innerHTML=(ls.invoices||[]).slice(0,20).map(i=>`<tr>
    <td>${esc(i.date||'')}</td><td>${esc(i.project||'')}</td><td>${esc(i.client||'')}</td><td>${money2(i.amount)}</td><td>${badge(i.status||'')}</td><td>${esc(i.invoiceBy||'')}</td>
  </tr>`).join('') || `<tr><td colspan="6" class="muted">Sin facturas/liquidaciones registradas.</td></tr>`;
  calculateLadyStoneTicketForm();
  updateLadyStoneAgreementFormMode();
}

function ladyStoneSummaryText(){
  const projectNames=['Ñ Mayúscula','Breathless Cover Band','Común asociación'];
  const lines=[
    'Lady Stone Admin · Resumen interno',
    'Asociación Musical y Cultural Lady Janis Joplin Stone',
    'Fecha: '+new Date().toLocaleString('es-ES'),
    ''
  ];
  projectNames.forEach(name=>{
    const t=projectTotals(name);
    lines.push(`${name}: saldo estimado ${money2(t.saldo)} · acuerdos ${money2(t.tickets)} · ingresos ${money2(t.ingresos)} · gastos ${money2(t.gastos)}`);
  });
  lines.push('', 'Nota: resumen de control interno, no documento fiscal.');
  return lines.join('\n');
}

function copyLadyStoneSummary(){
  const txt=ladyStoneSummaryText();
  navigator.clipboard?.writeText(txt).then(()=>alert('Resumen copiado.')).catch(()=>prompt('Copia el resumen:', txt));
}

function copyLadyStoneTicketEstimate(){
  const c=calculateLadyStoneTicketForm() || ladyStoneTicketEstimateFromForm();
  const txt=[
    'Estimación de acuerdo económico / liquidación',
    `Modelo: ${c.agreementLabel}`,
    `Base de cálculo: ${c.baseDescription}`,
    `Importe base acuerdo: ${money2(c.agreementGross)}`,
    `Caché fijo: ${money2(c.cacheFixed)}`,
    `Mínimo garantizado: ${money2(c.minimumGuarantee)}`,
    `Extras: ${money2(c.extrasTotal)}`,
    `Entradas vendidas: ${c.soldTotal}`,
    `Taquilla bruta: ${money2(c.gross)}`,
    `Taquilla neta sin IVA cultural: ${money2(c.netAfterVat)}`,
    `% taquilla banda: ${money2(c.ticketPctAmount)}`,
    `Barra declarada: ${money2(c.barGross)}`,
    `% barra banda: ${money2(c.barPctAmount)}`,
    `Canon sala: ${money2(c.canon)}`,
    `SGAE estimada: ${money2(c.sgaeAmount)}`,
    `Otros gastos: ${money2(c.otherExpenses)}`,
    `Ajuste manual: ${money2(c.manualAmount)}`,
    `Neto estimado total: ${money2(c.netEstimate)}`,
    `Neto por proyecto: ${money2(c.netPerProject)}`
  ].join('\n');
  navigator.clipboard?.writeText(txt).then(()=>alert('Estimación copiada.')).catch(()=>prompt('Copia la estimación:', txt));
}

function exportLadyStoneCSV(){
  const ls=ensureLadyStone();
  const rows=[];
  rows.push(['tipo','id','proyecto','fecha','concepto_evento','modelo','base_calculo','importe_base','neto_estimado','neto_por_proyecto','estado','notas']);
  (ls.tickets||[]).forEach(t=>rows.push(['acuerdo',t.id,t.project,t.date,t.event,t.agreementLabel||agreementLabel(t.agreementType),t.baseDescription||'',parseEuroValue(t.agreementGross),parseEuroValue(t.netEstimate),parseEuroValue(t.netPerProject),t.status,t.notes]));
  (ls.movements||[]).forEach(m=>rows.push(['movimiento',m.id,m.project,m.date,m.concept,m.type||'','',parseEuroValue(m.amount),parseEuroValue(m.amount),parseEuroValue(m.amount),m.status,m.notes]));
  (ls.invoices||[]).forEach(i=>rows.push(['factura',i.id,i.project,i.date,i.concept,'factura/liquidación','',parseEuroValue(i.amount),parseEuroValue(i.amount),parseEuroValue(i.amount),i.status,i.notes]));
  const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadBlob(csv, 'lady-stone-control-v2-6.csv', 'text/csv;charset=utf-8');
}


window.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
function initialTabFromUrl(){
  try{
    const raw = new URL(window.location.href).searchParams.get('tab') || '';
    const map = {songs:'repertoire', canciones:'repertoire', repertorio:'repertoire', ensayos:'rehearsals', ensayo:'rehearsals', rehearsals:'rehearsals', ladystone:'ladyStone', asociacion:'ladyStone', asociación:'ladyStone', admin:'ladyStone', export:'importExport', exportar:'importExport', audio:'audioStudio', audiostudio:'audioStudio', nstudio:'audioStudio'};
    const id = map[raw] || raw;
    return tabs.some(t=>t[0]===id) ? id : 'dashboard';
  }catch(e){ return 'dashboard'; }
}
clearOldLocalCaches();
renderNav();refreshAll();setTab(initialTabFromUrl(), {scroll:false, updateUrl:false});
setTimeout(()=>syncCRMFromGoogleSheet({silent:true, startup:true}), 250);
window.addEventListener('focus',()=>syncCRMFromGoogleSheet({silent:true, focus:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden) syncCRMFromGoogleSheet({silent:true, visible:true});});
