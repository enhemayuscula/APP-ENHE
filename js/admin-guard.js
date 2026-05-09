(function(){
  const ADMIN_KEY = 'app_enhe_admin_local_unlocked_v1';

  function isAdmin(){
    return localStorage.getItem(ADMIN_KEY) === '1';
  }

  function setAdmin(value){
    if(value){
      localStorage.setItem(ADMIN_KEY, '1');
      document.body.classList.add('admin-enabled');
    }else{
      localStorage.removeItem(ADMIN_KEY);
      document.body.classList.remove('admin-enabled');
    }
    updateAdminUI();
  }

  function callWhenReady(fnName, args){
    const fn = window[fnName];
    if(typeof fn === 'function'){
      return fn.apply(window, args || []);
    }
    alert('La función "' + fnName + '" todavía no está disponible. Recarga la página y prueba de nuevo.');
  }

  function openExportPanel(){
    if(typeof window.setTab === 'function'){
      window.setTab('importExport');
    }else{
      alert('El panel de exportación todavía no está disponible. Recarga la página.');
    }
  }

  function unlockAdmin(){
    const ok = confirm(
      'Activar modo administrador local en este navegador.\n\n' +
      'Nota: GitHub Pages es una web estática; esto no es un login real de servidor, solo desbloquea controles de gestión en tu navegador.'
    );
    if(ok) setAdmin(true);
  }

  function updateAdminUI(){
    const fab = document.getElementById('adminFab');
    const panel = document.getElementById('adminPanel');
    const state = document.getElementById('adminState');
    if(!fab || !panel || !state) return;

    if(isAdmin()){
      fab.textContent = 'Admin activo';
      fab.classList.remove('locked');
      state.textContent = 'Administrador desbloqueado';
    }else{
      fab.textContent = 'Admin';
      fab.classList.add('locked');
      state.textContent = 'Modo administrador bloqueado';
    }
  }

  function togglePanel(){
    const panel = document.getElementById('adminPanel');
    if(!panel) return;

    if(!isAdmin()){
      unlockAdmin();
      if(!isAdmin()) return;
    }

    panel.classList.toggle('open');
    updateAdminUI();
  }

  function buildAdminUI(){
    if(document.getElementById('adminFab')) return;

    const fab = document.createElement('button');
    fab.id = 'adminFab';
    fab.className = 'adminFab locked';
    fab.type = 'button';
    fab.textContent = 'Admin';
    fab.addEventListener('click', togglePanel);

    const panel = document.createElement('div');
    panel.id = 'adminPanel';
    panel.className = 'adminPanel';
    panel.innerHTML = `
      <span class="adminState" id="adminState">Modo administrador bloqueado</span>
      <h4>Panel administrador</h4>
      <p>Accesos rápidos para gestión local de APP-ENHE. Antes de cambios importantes, descarga backup JSON.</p>
      <div class="adminActions">
        <button type="button" class="primary" id="adminOpenExport">Abrir Exportar</button>
        <button type="button" id="adminBackup">Backup JSON</button>
        <button type="button" id="adminExportCRM">CRM CSV</button>
        <button type="button" id="adminExportFiltered">CRM filtrado</button>
        <button type="button" class="danger" id="adminLock">Bloquear admin</button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    document.getElementById('adminOpenExport').addEventListener('click', openExportPanel);
    document.getElementById('adminBackup').addEventListener('click', function(){ callWhenReady('exportJSON'); });
    document.getElementById('adminExportCRM').addEventListener('click', function(){ callWhenReady('exportCSV', ['crm']); });
    document.getElementById('adminExportFiltered').addEventListener('click', function(){ callWhenReady('exportFilteredCRM'); });
    document.getElementById('adminLock').addEventListener('click', function(){ setAdmin(false); panel.classList.remove('open'); });

    if(isAdmin()){
      document.body.classList.add('admin-enabled');
    }

    updateAdminUI();
  }

  window.APP_ENHE_ADMIN = {
    unlock: function(){ setAdmin(true); },
    lock: function(){ setAdmin(false); },
    isAdmin
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', buildAdminUI);
  }else{
    buildAdminUI();
  }
})();
