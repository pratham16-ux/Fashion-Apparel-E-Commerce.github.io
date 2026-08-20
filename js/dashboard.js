/* ===================== STACKLY — DASHBOARD SHARED LOGIC ===================== */

function showDashToast(msg){
  const t = document.getElementById('dashToast');
  if(!t) return;
  document.getElementById('dashToastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

function initDashboard(requiredRole){
  // ---------- Auth guard ----------
  let session = null;
  try{ session = JSON.parse(localStorage.getItem('stackly_session')); }catch(e){}

  if(!session || !session.role){
    window.location.href = 'login.html';
    return;
  }
  if(session.role !== requiredRole){
    // wrong dashboard for this role — send to correct one
    window.location.href = session.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-customer.html';
    return;
  }

  // ---------- Populate user info everywhere ----------
  const initial = (session.name || (requiredRole === 'admin' ? 'Admin' : 'Customer')).trim().charAt(0).toUpperCase();
  const displayName = session.name ? session.name.charAt(0).toUpperCase() + session.name.slice(1) : (requiredRole === 'admin' ? 'Admin' : 'Customer');

  const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setText('sideAvatar', initial);
  setText('chipAvatar', initial);
  setText('sideName', displayName);
  setText('chipName', displayName);
  setText('sideId', session.id);
  setText('chipId', 'ID: ' + session.id);
  setText('welcomeId', session.id);
  setText('welcomeName', requiredRole === 'admin' ? ('Welcome back, ' + displayName) : ('Welcome back, ' + displayName + '!'));

  const setIdField = document.getElementById('setId');
  if(setIdField) setIdField.value = session.id;
  const setEmailField = document.getElementById('setEmail');
  if(setEmailField && session.email) setEmailField.value = session.email;
  const setNameField = document.getElementById('setName');
  if(setNameField && session.name) setNameField.value = displayName;

  // ---------- Sidebar nav / view switching ----------
  const navLinks = document.querySelectorAll('.nav-link');
  const views = document.querySelectorAll('.dash-view');
  const pageTitle = document.getElementById('pageTitle');

  function goToView(viewName){
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.view === viewName));
    views.forEach(v => v.classList.toggle('active', v.id === 'view-' + viewName));
    const activeLink = document.querySelector('.nav-link[data-view="'+viewName+'"]');
    if(pageTitle && activeLink) pageTitle.textContent = activeLink.textContent.trim();
    closeSidebar();
    window.scrollTo({top:0, behavior:'smooth'});
  }

  navLinks.forEach(link=>{
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      goToView(link.dataset.view);
    });
  });

  document.querySelectorAll('[data-goto]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.preventDefault();
      goToView(el.dataset.goto);
    });
  });

  // ---------- Mobile sidebar ----------
  const sidebar = document.getElementById('dashSidebar');
  const overlay = document.getElementById('dashOverlay');
  const menuBtn = document.getElementById('dashMenuBtn');
  const closeBtn = document.getElementById('sidebarClose');

  function openSidebar(){
    sidebar.classList.add('open');
    overlay.classList.add('show');
  }
  function closeSidebar(){
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }
  if(menuBtn) menuBtn.addEventListener('click', openSidebar);
  if(closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if(overlay) overlay.addEventListener('click', closeSidebar);

  // ---------- Logout ----------
  function doLogout(){
    localStorage.removeItem('stackly_session');
    window.location.href = 'login.html';
  }
  const topLogout = document.getElementById('topLogout');
  const sidebarLogout = document.getElementById('sidebarLogout');
  if(topLogout) topLogout.addEventListener('click', doLogout);
  if(sidebarLogout) sidebarLogout.addEventListener('click', doLogout);

  // ---------- Settings save ----------
  const saveBtn = document.getElementById('saveSettings');
  if(saveBtn){
    saveBtn.addEventListener('click', ()=>{
      const nameVal = document.getElementById('setName') ? document.getElementById('setName').value : session.name;
      const emailVal = document.getElementById('setEmail') ? document.getElementById('setEmail').value : session.email;
      session.name = nameVal;
      session.email = emailVal;
      localStorage.setItem('stackly_session', JSON.stringify(session));
      const newInitial = nameVal.trim().charAt(0).toUpperCase();
      setText('sideAvatar', newInitial);
      setText('chipAvatar', newInitial);
      setText('sideName', nameVal);
      setText('chipName', nameVal);
      showDashToast('Settings saved successfully');
    });
  }

  // ---------- Wishlist remove buttons ----------
  document.querySelectorAll('.remove-wish').forEach(btn=>{
    btn.addEventListener('click', function(){
      const card = this.closest('.wish-card');
      if(card){
        card.style.transition = 'all .3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(.9)';
        setTimeout(()=>card.remove(), 300);
        showDashToast('Removed from wishlist');
      }
    });
  });

  // ---------- Generic row action buttons (view/edit/delete/track/etc.) ----------
  document.querySelectorAll('.row-actions button').forEach(btn=>{
    btn.addEventListener('click', function(){
      const icon = this.querySelector('i');
      let msg = 'Action completed';
      if(icon){
        if(icon.classList.contains('fa-trash')) msg = 'Item deleted';
        else if(icon.classList.contains('fa-pen')) msg = 'Opening editor...';
        else if(icon.classList.contains('fa-eye')) msg = 'Opening details...';
        else if(icon.classList.contains('fa-file-invoice')) msg = 'Generating invoice...';
        else if(icon.classList.contains('fa-truck')) msg = 'Tracking shipment...';
        else if(icon.classList.contains('fa-rotate-right')) msg = 'Reordering item...';
        else if(icon.classList.contains('fa-check')) msg = 'Order approved';
        else if(icon.classList.contains('fa-envelope')) msg = 'Opening message...';
      }
      showDashToast(msg);
    });
  });

  // ---------- Add product button (admin) ----------
  const addProductBtn = document.getElementById('addProductBtn');
  if(addProductBtn){
    addProductBtn.addEventListener('click', ()=> showDashToast('Add Product form would open here'));
  }

  // ---------- Notification bell ----------
  document.querySelectorAll('.icon-btn').forEach(btn=>{
    if(btn.tagName === 'A') return;
    btn.addEventListener('click', ()=> showDashToast('No new notifications'));
  });
}