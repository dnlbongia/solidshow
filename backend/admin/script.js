const API = '/api';
let token = localStorage.getItem('token');
let currentView = 'dashboard';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function api(path, options = {}) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const isFormData = options.body instanceof FormData;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return fetch(API + path, { ...options, headers }).then(r => {
    if (r.status === 401 && token) { logout(); return Promise.reject('Unauthorized'); }
    return r.json();
  });
}

// ====== AUTH ======
function login() {
  const username = $('#loginUser').value;
  const password = $('#loginPass').value;
  api('/auth/login', { method:'POST', body:JSON.stringify({username,password}) })
    .then(data => {
      if (data.error) { $('#loginError').textContent = data.error; return; }
      token = data.token;
      localStorage.setItem('token', token);
      renderDashboard();
    });
}

function logout() {
  token = null;
  localStorage.removeItem('token');
  renderLogin();
}

// ====== RENDER ======
function renderLogin() {
  $('#app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <h1>Solid<span>Show</span></h1>
        <p>Panel de administración</p>
        <div class="form-group">
          <label>Usuario</label>
          <input type="text" id="loginUser" placeholder="admin" />
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" id="loginPass" placeholder="••••••" onkeydown="if(event.key==='Enter')login()" />
        </div>
        <p class="error" id="loginError"></p>
        <button class="btn" onclick="login()">Ingresar</button>
      </div>
    </div>
  `;
}

function renderDashboard() {
  Promise.all([
    api('/settings'),
    api('/eventos'),
    api('/reservas'),
    api('/testimonios/all'),
    api('/galeria'),
    api('/tipos-eventos'),
  ]).then(([settings, eventos, reservas, testimonios, galeria, tiposEventos]) => {
    const pendientes = reservas.filter(r => r.status === 'pendiente').length;
    const upcoming = eventos.filter(e => e.published && e.date >= new Date().toISOString().slice(0,10)).length;
    const totalReservas = reservas.length;
    const totalTestimonios = testimonios.length;
    const totalTipos = tiposEventos.length;

    const sections = [
      { id:'dashboard', icon:'fa-chart-pie', label:'Dashboard' },
      { id:'settings', icon:'fa-cog', label:'Configuración' },
      { id:'eventos', icon:'fa-calendar-alt', label:'Eventos' },
      { id:'tipos-eventos', icon:'fa-th-large', label:'Tipos de Eventos' },
      { id:'reservas', icon:'fa-envelope', label:'Reservas' },
      { id:'testimonios', icon:'fa-star', label:'Testimonios' },
      { id:'galeria', icon:'fa-images', label:'Galería' },
    ];

    const navLinks = sections.map(s =>
      `<div class="sidebar__link${currentView===s.id?' active':''}" onclick="navigate('${s.id}')">
        <i class="fas ${s.icon}"></i> ${s.label}
      </div>`
    ).join('');

    $('#app').innerHTML = `
      <div class="dashboard">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar__header">
            <h2>Solid<span>Show</span></h2>
            <small>Panel de administración</small>
          </div>
          <nav class="sidebar__nav">${navLinks}</nav>
          <div class="sidebar__footer">
            <button onclick="logout()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
          </div>
        </aside>
        <main class="main">
          <div class="topbar">
            <button class="topbar__toggle" onclick="toggleSidebar()"><i class="fas fa-bars"></i></button>
            <h1 id="pageTitle">Dashboard</h1>
            <span style="color:var(--text-light);font-size:0.85rem;">${new Date().toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
          </div>
          <div id="pageContent"></div>
        </main>
      </div>
    `;

    window.dashboardData = { settings, eventos, reservas, testimonios, galeria, tiposEventos, pendientes, upcoming, totalReservas, totalTestimonios, totalTipos };
    navigate(currentView);
  });
}

function navigate(view) {
  currentView = view;
  document.querySelectorAll('.sidebar__link').forEach(el => el.classList.remove('active'));
  const viewOrder = ['dashboard','settings','eventos','tipos-eventos','reservas','testimonios','galeria'];
  const idx = viewOrder.indexOf(view);
  if (idx >= 0) document.querySelectorAll('.sidebar__link')[idx].classList.add('active');

  const titles = { dashboard:'Dashboard', settings:'Configuración', eventos:'Eventos', 'tipos-eventos':'Tipos de Eventos', reservas:'Reservas', testimonios:'Testimonios', galeria:'Galería' };
  $('#pageTitle').textContent = titles[view] || 'Dashboard';

  const d = window.dashboardData;
  if (view === 'dashboard') renderDashboardView(d);
  else if (view === 'settings') renderSettings(d.settings);
  else if (view === 'eventos') renderEventos(d.eventos);
  else if (view === 'tipos-eventos') renderTiposEventos(d.tiposEventos);
  else if (view === 'reservas') renderReservas(d.reservas);
  else if (view === 'testimonios') renderTestimonios(d.testimonios);
  else if (view === 'galeria') renderGaleria(d.galeria);

  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ====== DASHBOARD VIEW ======
function renderDashboardView(d) {
  $('#pageContent').innerHTML = `
    <div class="stats">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--primary"><i class="fas fa-calendar-alt"></i></div>
        <div><div class="stat-card__number">${d.upcoming}</div><div class="stat-card__label">Próximos eventos</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--success"><i class="fas fa-envelope"></i></div>
        <div><div class="stat-card__number">${d.totalReservas}</div><div class="stat-card__label">Reservas totales</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--warning"><i class="fas fa-clock"></i></div>
        <div><div class="stat-card__number">${d.pendientes}</div><div class="stat-card__label">Reservas pendientes</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--danger"><i class="fas fa-star"></i></div>
        <div><div class="stat-card__number">${d.totalTestimonios}</div><div class="stat-card__label">Testimonios</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--primary"><i class="fas fa-th-large"></i></div>
        <div><div class="stat-card__number">${d.totalTipos}</div><div class="stat-card__label">Tipos de eventos</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card__header"><h3>Últimas reservas</h3></div>
      <div class="card__body">
        ${d.reservas.length === 0 ? '<div class="empty"><i class="fas fa-inbox"></i><p>No hay reservas aún</p></div>' : `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Email</th><th>Tipo</th><th>Fecha</th><th>Invitados</th><th>Estado</th></tr></thead>
            <tbody>
              ${d.reservas.slice(0,5).map(r => `
                <tr>
                  <td>${r.nombre}</td>
                  <td>${r.email}</td>
                  <td>${r.tipo_evento}</td>
                  <td>${r.fecha_evento}</td>
                  <td>${r.invitados}</td>
                  <td><span class="badge badge--${r.status}">${r.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>
  `;
}

// ====== SETTINGS ======
function renderSettings(settings) {
  const fields = [
    { key:'site_name', label:'Nombre del sitio', type:'text' },
    { key:'site_description', label:'Descripción', type:'text' },
    { key:'hero_title', label:'Título del Hero', type:'text' },
    { key:'hero_subtitle', label:'Subtítulo del Hero', type:'text' },
    { key:'contact_email', label:'Email de contacto', type:'email' },
    { key:'contact_phone', label:'Teléfono de contacto', type:'text' },
    { key:'contact_address', label:'Dirección', type:'text' },
    { key:'reservas_email', label:'Email para notificaciones de reservas', type:'email' },
  ];

  const formHtml = fields.map(f => `
    <div class="form-group">
      <label>${f.label}</label>
      <input type="${f.type}" id="set_${f.key}" value="${(settings[f.key]||'')}" />
    </div>
  `).join('');

  $('#pageContent').innerHTML = `
    <div class="card">
      <div class="card__header"><h3>Configuración del sitio</h3></div>
      <div class="card__body">
        <form onsubmit="saveSettings(event)">
          ${formHtml}
          <button type="submit" class="btn-sm btn-sm--primary">Guardar cambios</button>
        </form>
      </div>
    </div>
  `;
}

function saveSettings(e) {
  e.preventDefault();
  const data = {};
  document.querySelectorAll('#pageContent input').forEach(input => {
    data[input.id.replace('set_', '')] = input.value;
  });
  api('/settings', { method:'PUT', body:JSON.stringify(data) }).then(() => {
    alert('Configuración guardada');
  });
}

// ====== EVENTOS ======
function renderEventos(eventos) {
  $('#pageContent').innerHTML = `
    <div style="margin-bottom:16px;display:flex;justify-content:flex-end;">
      <button class="btn-sm btn-sm--primary" onclick="openEventoModal()"><i class="fas fa-plus"></i> Nuevo evento</button>
    </div>
    <div class="card">
      <div class="card__body">
        ${eventos.length === 0 ? '<div class="empty"><i class="fas fa-calendar-plus"></i><p>No hay eventos aún</p></div>' : `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Título</th><th>Fecha</th><th>Hora</th><th>Lugar</th><th>Precio</th><th>Venta entradas</th><th>Publicado</th><th></th></tr></thead>
            <tbody>
              ${eventos.map(e => `
                <tr>
                  <td><strong>${e.title}</strong></td>
                  <td>${e.date}</td>
                  <td>${e.time || '—'}</td>
                  <td>${e.location || '—'}</td>
                  <td>${e.ticket_price ? '$' + e.ticket_price : '—'}</td>
                  <td>${e.ticket_url ? `<a href="${e.ticket_url}" target="_blank" style="color:var(--primary)">Link</a>` : '—'}</td>
                  <td>${e.published ? '<span style="color:var(--success)">✓</span>' : '<span style="color:var(--text-muted)">✗</span>'}</td>
                  <td>
                    <button class="btn-sm btn-sm--outline" onclick="openEventoModal(${e.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm btn-sm--danger" onclick="deleteEvento(${e.id})"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>
  `;
}

function openEventoModal(id) {
  const d = window.dashboardData;
  const evento = id ? d.eventos.find(e => e.id === id) : null;
  const title = evento ? 'Editar evento' : 'Nuevo evento';
  const e = evento || { title:'', description:'', date:'', time:'', location:'', image:'', ticket_price:0, ticket_url:'', published:1 };

  const proximasImages = (d.galeria || []).filter(g => g.section === 'proximos' && g.type === 'image');
  const imageOptions = proximasImages.map(g =>
    `<option value="${g.filename}" ${e.image === g.filename ? 'selected' : ''}>${g.alt || g.filename}</option>`
  ).join('');

  $('#modalContent').innerHTML = `
    <h2>${title}</h2>
    <form onsubmit="saveEvento(event, ${id || 'null'})">
      <div class="form-row">
        <div class="form-group"><label>Título *</label><input type="text" id="ev_title" value="${e.title}" required /></div>
        <div class="form-group"><label>Fecha *</label><input type="date" id="ev_date" value="${e.date}" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Hora</label><input type="time" id="ev_time" value="${e.time}" /></div>
        <div class="form-group"><label>Lugar</label><input type="text" id="ev_location" value="${e.location}" /></div>
      </div>
      <div class="form-group"><label>Descripción</label><textarea id="ev_description" rows="3">${e.description}</textarea></div>
      <div class="form-row">
        <div class="form-group">
          <label>Imagen</label>
          <select id="ev_image">
            <option value="">— Sin imagen —</option>
            ${imageOptions}
          </select>
          ${proximasImages.length === 0 ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">No hay imágenes en la sección "Próximos eventos". Agrega imágenes en la Galería.</div>' : ''}
        </div>
        <div class="form-group"><label>Precio entrada ($)</label><input type="number" id="ev_ticket_price" value="${e.ticket_price}" min="0" step="0.01" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>URL de venta de entradas</label><input type="url" id="ev_ticket_url" value="${e.ticket_url}" placeholder="https://..." /></div>
        <div class="form-group"><label>Publicado</label><select id="ev_published"><option value="1" ${e.published?'selected':''}>Sí</option><option value="0" ${!e.published?'selected':''}>No</option></select></div>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn-sm btn-sm--outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn-sm btn-sm--primary">Guardar</button>
      </div>
    </form>
  `;
  $('#modal').classList.remove('hidden');
}

function saveEvento(e, id) {
  e.preventDefault();
  const data = {
    title: $('#ev_title').value,
    description: $('#ev_description').value,
    date: $('#ev_date').value,
    time: $('#ev_time').value,
    location: $('#ev_location').value,
    image: $('#ev_image').value,
    ticket_price: parseFloat($('#ev_ticket_price').value) || 0,
    ticket_url: $('#ev_ticket_url').value,
    published: parseInt($('#ev_published').value),
  };
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/eventos/${id}` : '/eventos';
  api(url, { method, body:JSON.stringify(data) }).then(() => {
    closeModal();
    refreshData();
  });
}

function deleteEvento(id) {
  if (!confirm('¿Eliminar este evento?')) return;
  api(`/eventos/${id}`, { method:'DELETE' }).then(refreshData);
}

// ====== TIPOS DE EVENTOS ======
function renderTiposEventos(items) {
  $('#pageContent').innerHTML = `
    <div style="margin-bottom:16px;display:flex;justify-content:flex-end;">
      <button class="btn-sm btn-sm--primary" onclick="openTipoEventoModal()"><i class="fas fa-plus"></i> Nuevo tipo</button>
    </div>
    <div class="card">
      <div class="card__body">
        ${items.length === 0 ? '<div class="empty"><i class="fas fa-th-large"></i><p>No hay tipos de eventos aún</p></div>' : `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Sección</th><th>Icono</th><th>Título</th><th>Descripción</th><th>Orden</th><th>Publicado</th><th></th></tr></thead>
            <tbody>
              ${items.map(t => `
                <tr>
                  <td><code>${t.section}</code></td>
                  <td><i class="fas ${t.icon}" style="color:var(--primary-light);font-size:1.1rem;"></i></td>
                  <td><strong>${t.title}</strong></td>
                  <td style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.description || ''}</td>
                  <td>${t.ord}</td>
                  <td>${t.published ? '<span style="color:var(--success)">✓</span>' : '<span style="color:var(--text-muted)">✗</span>'}</td>
                  <td>
                    <button class="btn-sm btn-sm--outline" onclick="openTipoEventoModal(${t.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm btn-sm--danger" onclick="deleteTipoEvento(${t.id})"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>
  `;
}

function openTipoEventoModal(id) {
  const d = window.dashboardData;
  const item = id ? d.tiposEventos.find(t => t.id === id) : null;
  const title = item ? 'Editar tipo de evento' : 'Nuevo tipo de evento';
  const t = item || { section:'', icon:'fa-folder', title:'', description:'', image:'', ord:0, published:1 };

  const galeriaImages = (d.galeria || []).filter(g => g.type === 'image');
  const imageOptions = galeriaImages.map(g =>
    `<option value="${g.filename}" ${t.image === g.filename ? 'selected' : ''}>[${g.section}] ${g.alt || g.filename}</option>`
  ).join('');

  $('#modalContent').innerHTML = `
    <h2>${title}</h2>
    <form onsubmit="saveTipoEvento(event, ${id || 'null'})">
      <div class="form-row">
        <div class="form-group"><label>Sección *</label><input type="text" id="te_section" value="${t.section}" placeholder="ej: corporativos" required /></div>
        <div class="form-group"><label>Icono (Font Awesome)</label><input type="text" id="te_icon" value="${t.icon}" placeholder="fa-briefcase" /></div>
      </div>
      <div class="form-group"><label>Título *</label><input type="text" id="te_title" value="${t.title}" required /></div>
      <div class="form-group"><label>Descripción</label><textarea id="te_description" rows="3">${t.description || ''}</textarea></div>
      <div class="form-group">
        <label>Imagen de galería</label>
        <select id="te_image">
          <option value="">— Sin imagen —</option>
          ${imageOptions}
        </select>
        ${galeriaImages.length === 0 ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">No hay imágenes en la galería. Sube imágenes primero.</div>' : ''}
      </div>
      <div class="form-row">
        <div class="form-group"><label>Orden</label><input type="number" id="te_ord" value="${t.ord}" min="0" /></div>
        <div class="form-group"><label>Publicado</label><select id="te_published"><option value="1" ${t.published?'selected':''}>Sí</option><option value="0" ${!t.published?'selected':''}>No</option></select></div>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn-sm btn-sm--outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn-sm btn-sm--primary">Guardar</button>
      </div>
    </form>
  `;
  $('#modal').classList.remove('hidden');
}

function saveTipoEvento(e, id) {
  e.preventDefault();
  const data = {
    section: $('#te_section').value.trim(),
    icon: $('#te_icon').value.trim() || 'fa-folder',
    title: $('#te_title').value.trim(),
    description: $('#te_description').value.trim(),
    image: $('#te_image').value,
    ord: parseInt($('#te_ord').value) || 0,
    published: parseInt($('#te_published').value),
  };
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/tipos-eventos/${id}` : '/tipos-eventos';
  api(url, { method, body: JSON.stringify(data) }).then(res => {
    if (res.error) { alert('Error: ' + res.error); return; }
    closeModal();
    refreshData();
  });
}

function deleteTipoEvento(id) {
  if (!confirm('¿Eliminar este tipo de evento?')) return;
  api(`/tipos-eventos/${id}`, { method:'DELETE' }).then(refreshData);
}

// ====== RESERVAS ======
function renderReservas(reservas) {
  const statusFilter = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn-sm btn-sm--outline" onclick="filterReservas('')">Todas</button>
      <button class="btn-sm btn-sm--outline" onclick="filterReservas('pendiente')">Pendientes</button>
      <button class="btn-sm btn-sm--outline" onclick="filterReservas('confirmada')">Confirmadas</button>
      <button class="btn-sm btn-sm--outline" onclick="filterReservas('cancelada')">Canceladas</button>
    </div>
  `;

  $('#pageContent').innerHTML = `
    ${statusFilter}
    <div style="height:16px"></div>
    <div class="card">
      <div class="card__body" id="reservasTable">
        ${reservas.length === 0 ? '<div class="empty"><i class="fas fa-inbox"></i><p>No hay reservas</p></div>' : `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Tipo</th><th>Fecha evento</th><th>Invitados</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              ${reservas.map(r => `
                <tr>
                  <td><strong>${r.nombre}</strong></td>
                  <td>${r.email}</td>
                  <td>${r.telefono}</td>
                  <td>${r.tipo_evento}</td>
                  <td>${r.fecha_evento}</td>
                  <td>${r.invitados}</td>
                  <td><span class="badge badge--${r.status}">${r.status}</span></td>
                  <td>
                    <button class="btn-sm btn-sm--success" onclick="updateReservaStatus(${r.id},'confirmada')"><i class="fas fa-check"></i></button>
                    <button class="btn-sm btn-sm--warning" onclick="updateReservaStatus(${r.id},'pendiente')"><i class="fas fa-undo"></i></button>
                    <button class="btn-sm btn-sm--danger" onclick="updateReservaStatus(${r.id},'cancelada')"><i class="fas fa-times"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>
  `;
}

function filterReservas(status) {
  const url = status ? `/reservas?status=${status}` : '/reservas';
  api(url).then(reservas => {
    window.dashboardData.reservas = reservas;
    renderReservas(reservas);
  });
}

function updateReservaStatus(id, status) {
  api(`/reservas/${id}/status`, { method:'PUT', body:JSON.stringify({status}) }).then(refreshData);
}

// ====== TESTIMONIOS ======
function renderTestimonios(testimonios) {
  $('#pageContent').innerHTML = `
    <div style="margin-bottom:16px;display:flex;justify-content:flex-end;">
      <button class="btn-sm btn-sm--primary" onclick="openTestimonioModal()"><i class="fas fa-plus"></i> Nuevo testimonio</button>
    </div>
    <div class="card">
      <div class="card__body">
        ${testimonios.length === 0 ? '<div class="empty"><i class="fas fa-star"></i><p>No hay testimonios</p></div>' : `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Rol</th><th>Texto</th><th>Rating</th><th>Publicado</th><th></th></tr></thead>
            <tbody>
              ${testimonios.map(t => `
                <tr>
                  <td><strong>${t.name}</strong></td>
                  <td>${t.role || '—'}</td>
                  <td>${t.text.slice(0,60)}${t.text.length>60?'...':''}</td>
                  <td>${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</td>
                  <td>${t.published ? '<span style="color:var(--success)">✓</span>' : '<span style="color:var(--text-muted)">✗</span>'}</td>
                  <td>
                    <button class="btn-sm btn-sm--outline" onclick="openTestimonioModal(${t.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm btn-sm--danger" onclick="deleteTestimonio(${t.id})"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>
  `;
}

function openTestimonioModal(id) {
  const d = window.dashboardData;
  const t = id ? d.testimonios.find(x => x.id === id) : null;
  const title = t ? 'Editar testimonio' : 'Nuevo testimonio';
  const data = t || { name:'', role:'', text:'', avatar:'', rating:5, published:1 };

  $('#modalContent').innerHTML = `
    <h2>${title}</h2>
    <form onsubmit="saveTestimonio(event, ${id || 'null'})">
      <div class="form-row">
        <div class="form-group"><label>Nombre *</label><input type="text" id="tes_name" value="${data.name}" required /></div>
        <div class="form-group"><label>Rol</label><input type="text" id="tes_role" value="${data.role}" /></div>
      </div>
      <div class="form-group"><label>Texto *</label><textarea id="tes_text" rows="3" required>${data.text}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Avatar (URL)</label><input type="url" id="tes_avatar" value="${data.avatar}" /></div>
        <div class="form-group"><label>Rating</label><select id="tes_rating">${[1,2,3,4,5].map(n => `<option value="${n}" ${data.rating==n?'selected':''}>${n} estrella${n>1?'s':''}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label>Publicado</label><select id="tes_published"><option value="1" ${data.published?'selected':''}>Sí</option><option value="0" ${!data.published?'selected':''}>No</option></select></div>
      <div class="modal__actions">
        <button type="button" class="btn-sm btn-sm--outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn-sm btn-sm--primary">Guardar</button>
      </div>
    </form>
  `;
  $('#modal').classList.remove('hidden');
}

function saveTestimonio(e, id) {
  e.preventDefault();
  const data = {
    name: $('#tes_name').value,
    role: $('#tes_role').value,
    text: $('#tes_text').value,
    avatar: $('#tes_avatar').value,
    rating: parseInt($('#tes_rating').value),
    published: parseInt($('#tes_published').value),
  };
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/testimonios/${id}` : '/testimonios';
  api(url, { method, body:JSON.stringify(data) }).then(() => {
    closeModal();
    refreshData();
  });
}

function deleteTestimonio(id) {
  if (!confirm('¿Eliminar este testimonio?')) return;
  api(`/testimonios/${id}`, { method:'DELETE' }).then(refreshData);
}

// ====== GALERIA ======
const SECTION_LABELS = {
  hero: 'Portada (Hero) — Fondo principal',
  evento_corporativos: 'Tarjeta: Corporativos — 1ª tarjeta',
  evento_sociales: 'Tarjeta: Sociales — 2ª tarjeta',
  evento_conciertos: 'Tarjeta: Fiestas & Conciertos — 3ª tarjeta',
  evento_talleres: 'Tarjeta: Talleres & Seminarios — 4ª tarjeta',
  proximos: 'Próximos eventos — Imagen de cada evento',
  testimonios: 'Testimonios — Avatares de clientes',
  galeria: 'Galería de imágenes — Grid de fotos',
  general: 'General — Sin ubicación específica',
};

const SECTION_ICONS = {
  hero: 'fa-image',
  evento_corporativos: 'fa-briefcase',
  evento_sociales: 'fa-ring',
  evento_conciertos: 'fa-music',
  evento_talleres: 'fa-chalkboard',
  proximos: 'fa-clock',
  testimonios: 'fa-star',
  galeria: 'fa-images',
  general: 'fa-folder',
};

const SECTION_PREVIEWS = {
  hero: 'Aparecerá como fondo de la portada principal.',
  evento_corporativos: 'Reemplaza la imagen de la tarjeta "Corporativos" (1ª).',
  evento_sociales: 'Reemplaza la imagen de la tarjeta "Sociales" (2ª).',
  evento_conciertos: 'Reemplaza la imagen de la tarjeta "Fiestas & Conciertos" (3ª).',
  evento_talleres: 'Reemplaza la imagen de la tarjeta "Talleres & Seminarios" (4ª).',
  proximos: 'Se usará como imagen de los próximos eventos si no tienen imagen propia.',
  testimonios: 'Se usará como avatar por defecto para testimonios sin foto.',
  galeria: 'Aparecerá en el grid de la galería de imágenes.',
  general: 'No se muestra automáticamente. Úsalo para almacenar imágenes de respaldo.',
};

function renderGaleria(items) {
  const groups = {};
  items.forEach(item => {
    const s = item.section || 'general';
    if (!groups[s]) groups[s] = [];
    groups[s].push(item);
  });

  const sectionKeys = Object.keys(SECTION_LABELS);
  const sections = sectionKeys.filter(k => groups[k]);
  const otherSections = Object.keys(groups).filter(k => !sectionKeys.includes(k));
  const allSections = [...sections, ...otherSections];

  $('#pageContent').innerHTML = `
    <div style="margin-bottom:16px;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;">
      <button class="btn-sm btn-sm--primary" onclick="openGaleriaModal()"><i class="fas fa-plus"></i> Agregar imagen</button>
    </div>
    ${allSections.length === 0 ? `<div class="card"><div class="card__body"><div class="empty"><i class="fas fa-images"></i><p>No hay imágenes en la galería</p><p style="font-size:0.85rem;margin-top:8px;color:var(--text-muted)">Sube imágenes y asígnalas a una sección de la landing page.</p></div></div></div>` : `
    <div class="galeria-sections">
      ${allSections.map(s => {
        const label = SECTION_LABELS[s] || s;
        const icon = SECTION_ICONS[s] || 'fa-folder';
        const sectionItems = groups[s];
        return `
          <div class="galeria-section">
            <div class="galeria-section__header">
              <div class="galeria-section__title">
                <i class="fas ${icon}"></i>
                <div>
                  <h3>${label}</h3>
                  <span class="galeria-section__hint">${SECTION_PREVIEWS[s] || ''}</span>
                </div>
                <span class="galeria-section__count">${sectionItems.length}</span>
              </div>
              <button class="btn-sm btn-sm--primary" onclick="openGaleriaModal('','${s}')"><i class="fas fa-plus"></i></button>
            </div>
            <div class="galeria-grid">
              ${sectionItems.map(g => `
                <div class="galeria-card${g.type === 'video' ? ' galeria-card--video' : ''}">
                  <div class="galeria-card__preview">
                    ${g.type === 'video'
                      ? `<div class="galeria-card__video-thumb"><i class="fas fa-play"></i><span>${g.filename}</span></div>`
                      : `<img src="/assets/uploads/${g.filename}" alt="${g.alt || g.filename}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
                         <div class="galeria-card__fallback" style="display:none"><i class="fas fa-image"></i><span>${g.filename}</span></div>`
                    }
                    <div class="galeria-card__type-badge">
                      <i class="fas ${g.type === 'video' ? 'fa-video' : 'fa-camera'}"></i>
                    </div>
                  </div>
                  <div class="galeria-card__info">
                    <span class="galeria-card__alt" title="${g.alt || g.filename}">${g.alt || g.filename}</span>
                    <div class="galeria-card__actions">
                      <button class="btn-sm btn-sm--outline" onclick="openGaleriaModal(${g.id})" title="Editar"><i class="fas fa-edit"></i></button>
                      <button class="btn-sm btn-sm--danger" onclick="deleteGaleria(${g.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>`}
  `;
}

function openGaleriaModal(id, presetSection) {
  const d = window.dashboardData;
  const item = id ? d.galeria.find(g => g.id === id) : null;
  const title = item ? 'Editar imagen' : 'Agregar imagen';
  const data = item || { type:'image', filename:'', alt:'', section: presetSection || 'general', ord:0 };

  const sectionOptions = Object.entries(SECTION_LABELS).map(([key, label]) =>
    `<option value="${key}" ${data.section === key ? 'selected' : ''}>${label}</option>`
  ).join('');

  $('#modalContent').innerHTML = `
    <h2>${title}</h2>
    <form onsubmit="saveGaleria(event, ${id || 'null'})">
      <div class="form-row">
        <div class="form-group">
          <label>Sección</label>
          <select id="gal_section" required onchange="updateSectionHint()">${sectionOptions}</select>
          <div class="section-hint" id="sectionHint">${SECTION_PREVIEWS[data.section] || ''}</div>
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select id="gal_type">
            <option value="image" ${data.type==='image'?'selected':''}>Imagen</option>
            <option value="video" ${data.type==='video'?'selected':''}>Video</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Archivo ${id ? '(dejar vacío para mantener el actual)' : '*'}</label>
        <input type="file" id="gal_file" accept="image/*,video/mp4,video/webm" />
        ${data.filename ? `<div class="galeria-current-file"><i class="fas fa-paperclip"></i> ${data.filename}</div>` : ''}
      </div>
      <div class="form-row">
        <div class="form-group"><label>Descripción (texto alternativo)</label><input type="text" id="gal_alt" value="${data.alt || ''}" placeholder="Describe la imagen..." /></div>
        <div class="form-group"><label>Orden</label><input type="number" id="gal_ord" value="${data.ord}" min="0" placeholder="0" /></div>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn-sm btn-sm--outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn-sm btn-sm--primary">Guardar</button>
      </div>
    </form>
  `;
  $('#modal').classList.remove('hidden');
}

function updateSectionHint() {
  const hint = document.getElementById('sectionHint');
  if (hint) {
    const section = document.getElementById('gal_section').value;
    hint.textContent = SECTION_PREVIEWS[section] || '';
  }
}

function saveGaleria(e, id) {
  e.preventDefault();
  const fileInput = $('#gal_file');
  const hasFile = fileInput.files && fileInput.files[0];

  if (!id && !hasFile) {
    alert('Debes seleccionar un archivo para subir.');
    return;
  }

  const fd = new FormData();
  if (hasFile) fd.append('file', fileInput.files[0]);
  fd.append('type', $('#gal_type').value);
  fd.append('section', $('#gal_section').value);
  fd.append('alt', $('#gal_alt').value);
  fd.append('ord', parseInt($('#gal_ord').value) || 0);

  const method = id ? 'PUT' : 'POST';
  const url = id ? `/galeria/${id}` : '/galeria';
  api(url, { method, body: fd }).then(data => {
    if (data.error) {
      alert('Error: ' + data.error);
      return;
    }
    closeModal();
    refreshData();
  }).catch(err => {
    alert('Error al guardar: ' + (typeof err === 'string' ? err : JSON.stringify(err)));
  });
}

function deleteGaleria(id) {
  if (!confirm('¿Eliminar esta imagen?')) return;
  api(`/galeria/${id}`, { method:'DELETE' }).then(refreshData);
}

// ====== HELPERS ======
function closeModal() {
  $('#modal').classList.add('hidden');
}

function refreshData() {
  Promise.all([
    api('/settings'),
    api('/eventos'),
    api('/reservas'),
    api('/testimonios/all'),
    api('/galeria'),
    api('/tipos-eventos'),
  ]).then(([settings, eventos, reservas, testimonios, galeria, tiposEventos]) => {
    window.dashboardData = { settings, eventos, reservas, testimonios, galeria, tiposEventos };
    navigate(currentView);
  });
}

// ====== INIT ======
if (token) renderDashboard();
else renderLogin();
