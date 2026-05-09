const STORE_KEY = 'n_mayuscula_control_pro_v3';
let db = loadData();
let filteredCRM = [];
const tabs = [
  ['dashboard','Panel','●'],['crm','CRM','●'],['followup','Seguimiento','●'],['gmail','Gmail','●'],['concerts','Conciertos','●'],
  ['budget','Presupuesto','●'],['repertoire','Canciones','●'],['setlist','Setlist','●'],['dossier','Dossier','●'],['templates','Plantillas','●'],['tasks','Tareas','●'],['importExport','Exportar','●']
];

function clone(o){return JSON.parse(JSON.stringify(o));}
function loadData(){
  let data=clone(INITIAL_DATA);
  try{
    const raw=localStorage.getItem(STORE_KEY);
    if(raw){
      data=Object.assign(clone(INITIAL_DATA), JSON.parse(raw));
    }
  }catch(e){}
  return migrateData(data);
}
function migrateData(data){
  data.repertoire = Array.isArray(data.repertoire) ? data.repertoire : [];
  data.artistReferences = Array.isArray(data.artistReferences) ? data.artistReferences : [];

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
        if(match[key] === undefined || match[key] === null || match[key] === ''){
          match[key] = seedSong[key];
        }
      });
    }else{
      const next = nextId(data.repertoire);
      data.repertoire.push(Object.assign({}, defaultSong, seedSong, {id: next}));
    }
  });

  data.repertoire.sort((a,b)=>(Number(a.order)||Number(a.id)||0)-(Number(b.order)||Number(b.id)||0));
  return data;
}
function saveData(){localStorage.setItem(STORE_KEY, JSON.stringify(db)); refreshAll();}
function resetData(){if(confirm('¿Restaurar los datos iniciales importados del Excel? Se perderán cambios locales de esta app.')){localStorage.removeItem(STORE_KEY);db=clone(INITIAL_DATA);refreshAll();}}
function esc(v){return String(v??'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function eur(n){n=Number(n||0);return n? n.toLocaleString('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}) : '—';}
function compact(v,n=95){v=String(v??'').trim(); return v.length>n ? v.slice(0,n-1)+'…' : v;}
function nextId(arr){return (arr||[]).reduce((m,x)=>Math.max(m, Number(x.id)||0),0)+1;}
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
function setTab(id){
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active', b.dataset.tab===id));
  if(id==='crm') renderCRM();
  if(id==='gmail') renderGmail();
  if(id==='followup') renderFollowup();
  if(id==='concerts') renderConcerts();
  if(id==='budget') calcBudget();
  if(id==='repertoire') renderRepertoire();
  if(id==='setlist') renderSetlist();
  if(id==='dossier') renderDossier();
  if(id==='templates') {renderContactOptions();renderTemplates();}
  if(id==='tasks') renderTasks();
}
function renderNav(){
  const nav=document.getElementById('nav');
  nav.innerHTML=tabs.map(t=>`<button data-tab="${t[0]}" onclick="setTab('${t[0]}')"><span>${t[2]}</span>${t[1]}<small>${tabCount(t[0])}</small></button>`).join('');
}
function tabCount(id){
  if(id==='crm')return db.crm.length;
  if(id==='gmail')return db.gmailResponses.length;
  if(id==='concerts')return db.concerts.length;
  if(id==='tasks')return db.tasks.length;
  if(id==='repertoire')return db.repertoire.length;
  if(id==='setlist')return setlistRows().length;
  return '';
}
function refreshAll(){
  renderNav();
  document.getElementById('sideLoaded').innerHTML=`${db.crm.length} contactos · ${db.gmailResponses.length} respuestas Gmail<br>Última importación: ${esc(db.createdFrom.lastImport || '—')}`;
  document.getElementById('heroBadges').innerHTML=[
    `${db.crm.length} contactos CRM`,`${countBy(db.crm,'campaign','Salas')} salas`,`${countBy(db.crm,'campaign','Eventos/Bodas/Festejos')} eventos/bodas/festejos`,
    `${db.gmailResponses.length} respuestas Gmail`,`${db.repertoire.length} canciones`,`${setlistRows().length} temas setlist`,`${db.templates.length} plantillas`
  ].map(x=>`<span class="badge">${esc(x)}</span>`).join('');
  fillFilters();
  renderDashboard();
  renderCRM();
  renderFollowup();
  renderGmail();
  renderConcerts();
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
  ['date','Fecha','date'],['time','Hora','time'],['eventName','Evento','text','span2'],['venue','Sala / lugar','text','span2'],['city','Ciudad','text'],['type','Tipo','select','', ['Sala','Boda Madrid','Boda premium completa','Fiesta privada','Ayuntamiento','Empresa','Otro']],['status','Estado','select','', ['Pre-reserva','Presupuesto enviado','Confirmado','Realizado','Cancelado']],['fee','Caché total','number'],['deposit','Anticipo','number'],['paid','Cobrado adicional','number'],['sound','Sonido/iluminación','text'],['contactId','ID contacto CRM','number'],['notes','Notas producción','textarea','span4']
];}
function renderConcerts(){
  const arr=db.concerts||[];
  const total=arr.reduce((s,x)=>s+Number(x.fee||0),0), deposit=arr.reduce((s,x)=>s+Number(x.deposit||0)+Number(x.paid||0),0), pending=Math.max(0,total-deposit);
  document.getElementById('concertKpis').innerHTML=[
    ['Conciertos', arr.length],['Facturación prevista', eur(total)],['Cobrado/anticipos', eur(deposit)],['Pendiente', eur(pending)]
  ].map(k=>`<div class="card kpi"><strong>${k[1]}</strong><span>${k[0]}</span></div>`).join('');
  document.querySelector('#concertTable tbody').innerHTML=arr.map(x=>{const paid=Number(x.deposit||0)+Number(x.paid||0), pending=Math.max(0,Number(x.fee||0)-paid);return `<tr><td>${esc(x.date)} ${esc(x.time||'')}</td><td><strong>${esc(x.eventName)}</strong><br><span style="color:var(--muted)">${esc(compact(x.notes,80))}</span></td><td>${esc(x.venue)}<br><span style="color:var(--muted)">${esc(x.city)}</span></td><td>${esc(x.type)}</td><td>${badge(x.status)}</td><td>${eur(x.fee)}</td><td>${eur(x.deposit)}</td><td>${eur(x.paid)}</td><td>${eur(pending)}</td><td><button class="btn small gold" onclick="openConcertModal(${x.id})">Editar</button> <button class="btn small red" onclick="deleteRecord('concerts',${x.id})">Borrar</button></td></tr>`}).join('')||'<tr><td colspan="10" class="muted">Todavía no hay conciertos creados. Usa “+ Concierto” o la calculadora de presupuesto.</td></tr>';
}
function openConcertModal(id=null,preset=null){
  const item=id?db.concerts.find(x=>x.id===id):(preset||{status:'Pre-reserva',type:'Sala',fee:0,deposit:0,paid:0});
  modalContext={type:'concert',id};
  document.getElementById('modalTitle').textContent=id?'Editar concierto':'Nuevo concierto';
  document.getElementById('modalBody').innerHTML=renderForm(concertFields(), item)+`<div class="hr"></div><div class="actions"><button class="btn gold" onclick="saveConcert()">Guardar</button><button class="btn dark" onclick="closeModal()">Cancelar</button></div>`;
  openModal();
}
function saveConcert(){const obj=readForm(concertFields());['fee','deposit','paid','contactId'].forEach(k=>obj[k]=Number(obj[k]||0)); if(modalContext.id){const idx=db.concerts.findIndex(x=>x.id===modalContext.id);db.concerts[idx]=Object.assign({},db.concerts[idx],obj);}else{obj.id=nextId(db.concerts);db.concerts.push(obj);} closeModal();saveData();}
function renderBudgetUI(){
  const box=document.getElementById('extrasBox'); if(!box)return;
  box.innerHTML=db.tariffs.extras.map(e=>`<label style="display:flex;gap:8px;align-items:center;color:var(--text);font-size:13px"><input type="checkbox" data-extra="${e.id}" onchange="calcBudget()" style="width:auto"> ${esc(e.name)} ${e.kind==='fixed'?`(+${eur(e.amount)})`:'(consultar)'}</label>`).join('');
  document.getElementById('specialDates').innerHTML=db.tariffs.specialDates.map(x=>`<div class="detailItem"><small>${esc(x.date)}</small><div><strong>${esc(x.name)}</strong> · ${eur(x.price)}</div></div>`).join('');
  document.getElementById('weddingConditions').innerHTML=db.tariffs.weddingConditions.map(x=>`<li>${esc(x)}</li>`).join('');
}
function findBaseTariff(dateStr){
  if(!dateStr)return null;
  const special=db.tariffs.specialDates.find(x=>x.date===dateStr); if(special)return {name:special.name, price:special.price, special:true};
  const d=new Date(dateStr+'T00:00:00'); const day=d.getDay();
  const row=db.tariffs.base.find(x=>dateStr>=x.from && dateStr<=x.to); if(!row)return null;
  let key=day===5?'friday':day===6?'saturday':day===0?'sunday':'weekday';
  return {name:row.name, price:Number(row[key]||0), special:false, dayKey:key};
}
function calcBudget(){
  const date=document.getElementById('budgetDate')?.value||'';
  const name=document.getElementById('budgetName')?.value||'';
  const base=findBaseTariff(date);
  let total=base?Number(base.price||0):0, lines=[];
  if(base) lines.push(`${base.name}: ${base.price?eur(base.price):'consultar / no disponible'}`); else lines.push('Selecciona fecha para calcular tarifa base.');
  document.querySelectorAll('[data-extra]:checked').forEach(ch=>{const e=db.tariffs.extras.find(x=>x.id===ch.dataset.extra); if(e){ if(e.kind==='fixed'){total+=Number(e.amount||0);lines.push(`${e.name}: +${eur(e.amount)}`);} else lines.push(`${e.name}: consultar`); }});
  const totalTxt=total?eur(total):'Consultar';
  document.getElementById('budgetTotal').textContent=totalTxt;
  document.getElementById('budgetBreakdown').innerHTML=lines.map(esc).join('<br>') + `<br><br><strong>Anticipo 50%:</strong> ${total?eur(total/2):'—'}`;
  const copy=`Presupuesto orientativo Ñ Mayúscula\nFecha: ${date||'pendiente'}\nEvento: ${name||'pendiente'}\n${lines.join('\n')}\nTotal orientativo: ${totalTxt}\nReserva: 50% (${total?eur(total/2):'—'})\nPrecios sin IVA. Presupuesto final sujeto a ubicación, duración, formato y necesidades técnicas.`;
  document.getElementById('budgetCopy').textContent=copy;
  return {date,name,total,lines};
}
function copyBudgetText(){calcBudget();copyText(document.getElementById('budgetCopy').textContent);}
function createConcertFromBudget(){const b=calcBudget();openConcertModal(null,{date:b.date,eventName:b.name||'Evento pendiente',type:'Sala',status:'Presupuesto enviado',fee:b.total,deposit:b.total?b.total/2:0,paid:0,notes:b.lines.join(' | ')})}

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
function saveTask(){const obj=readForm(taskFields()); if(modalContext.id){const idx=db.tasks.findIndex(x=>x.id===modalContext.id);db.tasks[idx]=Object.assign({},db.tasks[idx],obj);}else{obj.id=nextId(db.tasks);db.tasks.push(obj);} closeModal();saveData();}
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
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
renderNav();refreshAll();setTab('dashboard');
