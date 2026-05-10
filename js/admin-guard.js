(function(){
  'use strict';

  const ADMIN_KEY = 'app_enhe_admin_local_unlocked_v2';
  const ADMIN_CODE = '1929';

  const ADMIN_FUNCTIONS = [
    'openContactModal',
    'saveContact',
    'deleteRecord',
    'openConcertModal',
    'saveConcert',
    'openRehearsalModal',
    'saveRehearsal',
    'saveConcertAttendance',
    'markLocalPayment',
    'exportRehearsalsCSV',
    'loadConcertPosterFile',
    'createConcertFromBudget',
    'openSongModal',
    'saveSong',
    'openTaskModal',
    'saveTask',
    'resetData',
    'importJSON',
    'importCSVContacts',
    'safeImportCRMFile',
    'exportJSON',
    'exportCSV',
    'exportFilteredCRM',
    'exportSetlistCSV',
    'exportRepertoireCSV',
    'applySongLinksImport',
    'openSongLinksImportModal',
    'downloadXlsx',
    'copyBudgetText',
    'composeTemplate',
    'composeForContact'
  ];

  const ADMIN_ONCLICK_PATTERNS = ADMIN_FUNCTIONS.slice();

  let lastUserNoticeAt = 0;

  function isAdmin(){
    return localStorage.getItem(ADMIN_KEY) === '1';
  }

  function ensureToast(){
    let toast = document.getElementById('adminSoftNotice');
    if(toast) return toast;

    toast = document.createElement('div');
    toast.id = 'adminSoftNotice';
    toast.className = 'adminSoftNotice';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    return toast;
  }

  function softNotice(message, opts){
    const now = Date.now();
    const force = opts && opts.force;

    if(!force && now - lastUserNoticeAt < 2500) return;
    lastUserNoticeAt = now;

    const toast = ensureToast();
    toast.textContent = message || 'Acción disponible solo en modo administrador.';
    toast.classList.add('show');

    clearTimeout(toast.__hideTimer);
    toast.__hideTimer = setTimeout(function(){
      toast.classList.remove('show');
    }, 3200);
  }

  function notifyUserMode(){
    softNotice('Modo usuario: solo lectura. Para editar o exportar, entra como administrador.');
  }

  function setAdmin(value){
    if(value){
      localStorage.setItem(ADMIN_KEY, '1');
      document.body.classList.add('admin-enabled');
      document.body.classList.remove('user-readonly');
      softNotice('Modo administrador activado.', {force:true});
    }else{
      localStorage.removeItem(ADMIN_KEY);
      document.body.classList.remove('admin-enabled');
      document.body.classList.add('user-readonly');
      softNotice('Modo usuario: solo lectura.', {force:true});
    }
    updateAdminUI();
    markAdminControls();
  }

  function requestAdminAccess(){
    const code = prompt('Clave de administrador de APP-ENHE:');
    if(code === null) return false;

    if(String(code).trim() === ADMIN_CODE){
      setAdmin(true);
      const panel = document.getElementById('adminPanel');
      if(panel) panel.classList.add('open');
      return true;
    }

    alert('Clave incorrecta. Sigues en modo usuario.');
    setAdmin(false);
    return false;
  }

  function callWhenReady(fnName, args){
    if(!isAdmin()){
      notifyUserMode();
      return;
    }

    const fn = window[fnName];
    if(typeof fn === 'function'){
      return fn.apply(window, args || []);
    }

    softNotice('La función "' + fnName + '" todavía no está disponible. Recarga la página y prueba de nuevo.', {force:true});
  }

  function openExportPanel(){
    if(!isAdmin()){
      notifyUserMode();
      return;
    }

    if(typeof window.setTab === 'function'){
      window.setTab('importExport');
    }else{
      softNotice('El panel de exportación todavía no está disponible. Recarga la página.', {force:true});
    }
  }

  function updateAdminUI(){
    const fab = document.getElementById('adminFab');
    const panel = document.getElementById('adminPanel');
    const state = document.getElementById('adminState');
    const modeBadge = document.getElementById('adminModeBadge');
    if(!fab || !panel || !state || !modeBadge) return;

    if(isAdmin()){
      fab.textContent = 'Admin activo';
      fab.classList.remove('locked');
      state.textContent = 'Modo administrador activo';
      modeBadge.textContent = 'Administrador';
      modeBadge.classList.add('is-admin');
      modeBadge.classList.remove('is-user');
    }else{
      fab.textContent = 'Acceso admin';
      fab.classList.add('locked');
      state.textContent = 'Modo usuario: solo lectura';
      modeBadge.textContent = 'Usuario · solo lectura';
      modeBadge.classList.add('is-user');
      modeBadge.classList.remove('is-admin');
      panel.classList.remove('open');
    }
  }

  function togglePanel(){
    const panel = document.getElementById('adminPanel');
    if(!panel) return;

    if(!isAdmin()){
      requestAdminAccess();
      return;
    }

    panel.classList.toggle('open');
    updateAdminUI();
  }

  function isAdminOnClick(value){
    const code = String(value || '');
    return ADMIN_ONCLICK_PATTERNS.some(pattern => code.includes(pattern));
  }

  function isAdminFileInput(el){
    if(!el || el.tagName !== 'INPUT') return false;
    if((el.getAttribute('type') || '').toLowerCase() !== 'file') return false;
    const change = el.getAttribute('onchange') || '';
    return isAdminOnClick(change) || change.includes('import');
  }

  function controlNeedsAdmin(el){
    if(!el || el.id === 'adminFab') return false;
    if(el.closest && el.closest('#adminPanel')) return false;
    if(el.closest && el.closest('.nav')) return false;

    if(el.dataset && el.dataset.adminLock === 'true') return true;

    const onclick = el.getAttribute ? el.getAttribute('onclick') : '';
    if(isAdminOnClick(onclick)) return true;

    if(isAdminFileInput(el)) return true;

    const labelText = (el.textContent || '').trim().toLowerCase();
    if((el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'LABEL') && (
      labelText.includes('exportar') ||
      labelText.includes('backup') ||
      labelText.includes('importar') ||
      labelText.includes('cargar archivo') ||
      labelText.includes('subir cartel') ||
      labelText.includes('restaurar') ||
      labelText.includes('+ contacto') ||
      labelText.includes('+ concierto') ||
      labelText.includes('+ ensayo') ||
      labelText.includes('+ tarea') ||
      labelText.includes('editar') ||
      labelText.includes('borrar') ||
      labelText.includes('abrir email') ||
      labelText.includes('preparar email') ||
      labelText.includes('copiar presupuesto') ||
      labelText.includes('crear concierto') ||
      labelText.includes('guardar confirmación') ||
      labelText.includes('exportar csv ensayos') ||
      labelText.includes('marcar todos') ||
      labelText.includes('usar setlist actual') ||
      labelText.includes('limpiar')
    )){
      return true;
    }

    return false;
  }

  function markAdminControls(){
    const selectors = [
      'button',
      'label.btn',
      'input[type="file"]',
      'a.btn'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(el => {
      if(controlNeedsAdmin(el)){
        el.dataset.adminLock = 'true';
        el.classList.toggle('adminLockedControl', !isAdmin());
        el.setAttribute('title', isAdmin() ? 'Disponible en modo administrador' : 'Solo administrador');
        if('disabled' in el && el.tagName === 'INPUT'){
          el.disabled = !isAdmin();
        }
      }else{
        el.classList.remove('adminLockedControl');
      }
    });
  }

  function interceptLockedClick(event){
    const target = event.target && event.target.closest ? event.target.closest('button,label,input,a') : null;
    if(!target || isAdmin()) return;

    if(controlNeedsAdmin(target)){
      event.preventDefault();
      event.stopPropagation();
      if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      notifyUserMode();
    }
  }

  function guardWindowFunctions(){
    ADMIN_FUNCTIONS.forEach(name => {
      const original = window[name];
      if(typeof original !== 'function' || original.__appEnheGuarded) return;

      const guarded = function(){
        if(!isAdmin()){
          notifyUserMode();
          return null;
        }
        return original.apply(this, arguments);
      };

      guarded.__appEnheGuarded = true;
      guarded.__appEnheOriginal = original;
      window[name] = guarded;
    });

    /*
      No se bloquea window.saveData en modo usuario.
      La app necesita guardar caché local tras sincronizar con Google Sheet.
      Bloquear saveData provocaba alertas repetidas al cargar o refrescar datos.
    */
  }

  function installObserver(){
    const observer = new MutationObserver(function(){
      guardWindowFunctions();
      markAdminControls();
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  function buildAdminUI(){
    if(document.getElementById('adminFab')) return;

    const modeBadge = document.createElement('div');
    modeBadge.id = 'adminModeBadge';
    modeBadge.className = 'adminModeBadge is-user';
    modeBadge.textContent = 'Usuario · solo lectura';

    const fab = document.createElement('button');
    fab.id = 'adminFab';
    fab.className = 'adminFab locked';
    fab.type = 'button';
    fab.textContent = 'Acceso admin';
    fab.addEventListener('click', togglePanel);

    const panel = document.createElement('div');
    panel.id = 'adminPanel';
    panel.className = 'adminPanel';
    panel.innerHTML = `
      <span class="adminState" id="adminState">Modo usuario: solo lectura</span>
      <h4>Panel administrador</h4>
      <p>Accesos de gestión para APP-ENHE. El grupo puede entrar en modo usuario y consultar datos, pero no editar ni exportar.</p>
      <div class="adminActions">
        <button type="button" class="primary" id="adminOpenExport">Abrir Exportar</button>
        <button type="button" id="adminBackup">Backup JSON</button>
        <button type="button" id="adminExportCRM">CRM CSV</button>
        <button type="button" id="adminExportFiltered">CRM filtrado</button>
        <button type="button" id="adminOpenRehearsals">Abrir Ensayos</button>
        <button type="button" class="danger" id="adminLock">Salir de admin</button>
      </div>
    `;

    document.body.appendChild(modeBadge);
    document.body.appendChild(fab);
    document.body.appendChild(panel);

    document.getElementById('adminOpenExport').addEventListener('click', openExportPanel);
    document.getElementById('adminBackup').addEventListener('click', function(){ callWhenReady('exportJSON'); });
    document.getElementById('adminExportCRM').addEventListener('click', function(){ callWhenReady('exportCSV', ['crm']); });
    document.getElementById('adminExportFiltered').addEventListener('click', function(){ callWhenReady('exportFilteredCRM'); });
    document.getElementById('adminOpenRehearsals').addEventListener('click', function(){ if(typeof window.setTab === 'function') window.setTab('rehearsals'); });
    document.getElementById('adminLock').addEventListener('click', function(){ setAdmin(false); });

    document.addEventListener('click', interceptLockedClick, true);
    document.addEventListener('change', interceptLockedClick, true);

    if(isAdmin()){
      document.body.classList.add('admin-enabled');
      document.body.classList.remove('user-readonly');
    }else{
      document.body.classList.add('user-readonly');
      document.body.classList.remove('admin-enabled');
    }

    guardWindowFunctions();
    markAdminControls();
    installObserver();
    updateAdminUI();
  }

  window.APP_ENHE_ADMIN = {
    login: requestAdminAccess,
    unlock: requestAdminAccess,
    lock: function(){ setAdmin(false); },
    isAdmin: isAdmin,
    mode: function(){ return isAdmin() ? 'admin' : 'user'; }
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', buildAdminUI);
  }else{
    buildAdminUI();
  }
})();
