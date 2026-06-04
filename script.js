const API = '/api';

(async function init() {
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.header__link');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    nav.classList.toggle('open');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      nav.classList.remove('open');
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  try {
    const [settings, eventosUpcoming, testimonios, galeriaItems, tiposEventos] = await Promise.all([
      fetch(`${API}/settings`).then(r => r.json()),
      fetch(`${API}/eventos/upcoming`).then(r => r.json()),
      fetch(`${API}/testimonios`).then(r => r.json()),
      fetch(`${API}/galeria`).then(r => r.json()),
      fetch(`${API}/tipos-eventos`).then(r => r.json()),
    ]);

    applySettings(settings);
    renderProximos(eventosUpcoming);
    renderTestimonios(testimonios);
    renderTiposEventos(tiposEventos);
    applyGaleriaMedia(galeriaItems);
  } catch (err) {
    console.log('API no disponible, mostrando contenido estático');
  }

  const form = document.getElementById('reservasForm');
  const successMsg = document.getElementById('reservasSuccess');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      nombre: document.getElementById('nombre').value,
      email: document.getElementById('email').value,
      telefono: document.getElementById('telefono').value,
      tipo_evento: document.getElementById('tipo').value,
      fecha_evento: document.getElementById('fecha').value,
      invitados: parseInt(document.getElementById('invitados').value),
      mensaje: document.getElementById('mensaje').value,
    };
    try {
      const res = await fetch(`${API}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        form.reset();
        form.style.display = 'none';
        successMsg.classList.add('visible');
      } else {
        alert(json.error || 'Error al enviar la solicitud');
      }
    } catch {
      alert('Error de conexión. Intenta más tarde.');
    }
  });

  const newsletterForm = document.getElementById('newsletterForm');
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = newsletterForm.querySelector('input');
    input.value = '';
    alert('¡Gracias por suscribirte!');
  });
})();

function applySettings(s) {
  if (s.site_name) document.title = s.site_name + ' - Eventos Corporativos & Sociales';
  const logo = document.querySelector('.header__logo');
  if (logo && s.site_name) {
    const parts = s.site_name.split(/(?=[A-Z])/);
    if (parts.length > 1) {
      logo.innerHTML = parts[0] + '<span>' + parts.slice(1).join('') + '</span>';
    } else {
      logo.innerHTML = s.site_name;
    }
  }
  const heroTitle = document.querySelector('.hero__title');
  const heroSubtitle = document.querySelector('.hero__subtitle');
  if (heroTitle && s.hero_title) heroTitle.textContent = s.hero_title;
  if (heroSubtitle && s.hero_subtitle) heroSubtitle.textContent = s.hero_subtitle;

  const contactItems = document.querySelectorAll('.contacto__item p');
  if (contactItems.length >= 4) {
    if (s.contact_address) contactItems[0].textContent = s.contact_address;
    if (s.contact_phone) contactItems[1].textContent = s.contact_phone;
    if (s.contact_email) contactItems[2].textContent = s.contact_email;
  }
}

function applyGaleriaMedia(items) {
  const bySection = {};
  items.forEach(item => {
    const s = item.section || 'general';
    if (!bySection[s]) bySection[s] = [];
    bySection[s].push(item);
  });

  const heroImages = (bySection['hero'] || []).filter(i => i.type === 'image');
  if (heroImages.length > 0) {
    const heroSection = document.getElementById('inicio');
    const heroBg = document.querySelector('.hero__bg-placeholder');
    const prevBtn = document.querySelector('.hero__arrow--prev');
    const nextBtn = document.querySelector('.hero__arrow--next');
    const dotsContainer = document.querySelector('.hero__dots');

    if (heroBg) {
      heroBg.querySelector('.media-placeholder')?.remove();
      let current = 0;

      heroImages.forEach((img, i) => {
        const el = document.createElement('img');
        el.src = `/assets/uploads/${img.filename}`;
        el.alt = img.alt || '';
        el.className = `hero__bg${i === 0 ? ' hero__bg--active' : ''}`;
        heroBg.appendChild(el);
      });

      if (heroSection) heroSection.classList.add('hero--has-image');

      if (heroImages.length > 1) {
        [prevBtn, nextBtn, dotsContainer].forEach(el => el?.removeAttribute('hidden'));

        heroImages.forEach((_, i) => {
          const dot = document.createElement('button');
          dot.className = `hero__dot${i === 0 ? ' hero__dot--active' : ''}`;
          dot.setAttribute('aria-label', `Ir a imagen ${i + 1}`);
          dot.addEventListener('click', () => goTo(i));
          dotsContainer?.appendChild(dot);
        });

        function goTo(index) {
          const imgs = heroBg.querySelectorAll('.hero__bg');
          const dots = dotsContainer?.querySelectorAll('.hero__dot');
          imgs.forEach((el, i) => el.classList.toggle('hero__bg--active', i === index));
          dots?.forEach((el, i) => el.classList.toggle('hero__dot--active', i === index));
          current = index;
          resetTimer();
        }

        function next() { goTo((current + 1) % heroImages.length); }
        function prev() { goTo((current - 1 + heroImages.length) % heroImages.length); }

        prevBtn?.addEventListener('click', prev);
        nextBtn?.addEventListener('click', next);

        let timer = setInterval(next, 5000);
        function resetTimer() { clearInterval(timer); timer = setInterval(next, 5000); }

        heroSection?.addEventListener('mouseenter', () => clearInterval(timer));
        heroSection?.addEventListener('mouseleave', () => { timer = setInterval(next, 5000); });
      }
    }
  }

  document.querySelectorAll('.evento-card[data-section]').forEach(card => {
    const section = 'evento_' + card.dataset.section;
    const items = bySection[section];
    if (items && items.length > 0) {
      const img = items.find(i => i.type === 'image');
      if (img) {
        const placeholder = card.querySelector('.media-placeholder');
        if (placeholder) {
          placeholder.innerHTML = `<img src="/assets/uploads/${img.filename}" alt="${img.alt || img.filename}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:8px;" />`;
          placeholder.style.border = 'none';
          placeholder.style.background = 'none';
        }
      }
    }
  });

  const galeriaSection = bySection['galeria'];
  if (galeriaSection && galeriaSection.length > 0) {
    renderGaleria(galeriaSection);
  }
}

function renderProximos(eventos) {
  const grid = document.getElementById('proximosGrid');
  if (!eventos || eventos.length === 0) {
    grid.innerHTML = `<div class="proximos__empty media-placeholder" style="grid-column:1/-1;padding:60px">
      <i class="fas fa-calendar-alt"></i>
      <span>No hay próximos eventos por ahora</span>
    </div>`;
    return;
  }
  grid.innerHTML = eventos.map(e => `
    <div class="proximo-card">
      <div class="proximo-card__img" style="height:180px;border-radius:12px 12px 0 0;overflow:hidden;position:relative;background:var(--bg)">
        ${e.image
          ? `<img src="/assets/uploads/${e.image}" alt="${e.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" />`
          : `<div class="media-placeholder" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-muted)"><i class="fas fa-calendar-day"></i><span style="font-size:0.75rem">${e.title}.jpg</span></div>`
        }
      </div>
      <div class="proximo-card__body">
        <div class="proximo-card__date">
          <i class="far fa-calendar-alt"></i> ${formatDate(e.date)} ${e.time ? '· ' + e.time : ''}
        </div>
        <h3 class="proximo-card__title">${e.title}</h3>
        <p class="proximo-card__desc">${e.description || ''}</p>
        ${e.location ? `<div class="proximo-card__location"><i class="fas fa-map-marker-alt"></i> ${e.location}</div>` : ''}
        <div class="proximo-card__footer">
          <span class="proximo-card__price">${e.ticket_price > 0 ? '$' + parseFloat(e.ticket_price).toFixed(2) : 'Entrada gratuita'}</span>
          ${e.ticket_url ? `<a href="${e.ticket_url}" target="_blank" class="btn btn--primary" style="padding:10px 24px;font-size:0.85rem">Comprar entradas</a>`
          : `<a href="#reservas" class="btn btn--primary" style="padding:10px 24px;font-size:0.85rem">Reservar</a>`}
        </div>
      </div>
    </div>
  `).join('');
}

function renderTiposEventos(items) {
  const section = document.getElementById('eventos');
  if (!section) return;
  const published = items ? items.filter(t => t.published) : [];
  const hasContent = published.length > 0;

  let html = `
    <div class="eventos__carousel" id="eventosCarousel">
      <div class="eventos__track" id="eventosTrack">
  `;
  if (!hasContent) {
    html += '<div class="empty" style="flex:1;text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-folder-open" style="font-size:2rem;display:block;margin-bottom:12px;"></i><p>No hay tipos de eventos disponibles</p></div>';
  } else {
    html += published.map(t => `
      <div class="evento-card" data-section="${t.section}">
        <div class="evento-card__icon"><i class="fas ${t.icon}"></i></div>
        <div class="evento-card__img media-placeholder">
          ${t.image
            ? `<img src="/assets/uploads/${t.image}" alt="${t.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:8px;" />`
            : `<i class="fas fa-image"></i><span>${t.section}.jpg</span>`}
        </div>
        <h3 class="evento-card__title">${t.title}</h3>
        <p class="evento-card__desc">${t.description || ''}</p>
      </div>
    `).join('');
  }
  html += `
      </div>
      <button class="eventos__arrow eventos__arrow--prev" aria-label="Anterior" hidden><i class="fas fa-chevron-left"></i></button>
      <button class="eventos__arrow eventos__arrow--next" aria-label="Siguiente" hidden><i class="fas fa-chevron-right"></i></button>
    </div>
    <div class="eventos__dots" id="eventosDots" hidden></div>
  `;

  const container = section.querySelector('.container');
  const oldGrid = container.querySelector('.eventos__grid');
  if (oldGrid) {
    oldGrid.outerHTML = html;
  } else {
    const carouselSection = container.querySelector('.eventos__carousel');
    if (carouselSection) carouselSection.replaceWith(html);
  }

  if (hasContent && published.length > 1) {
    initEventosCarousel(published.length);
  }
}

function initEventosCarousel(totalSlides) {
  const track = document.getElementById('eventosTrack');
  const prevBtn = document.querySelector('.eventos__arrow--prev');
  const nextBtn = document.querySelector('.eventos__arrow--next');
  const dotsContainer = document.getElementById('eventosDots');
  if (!track) return;

  [prevBtn, nextBtn, dotsContainer].forEach(el => el?.removeAttribute('hidden'));

  let current = 0;
  const cards = track.querySelectorAll('.evento-card');
  if (cards.length === 0) return;

  function getVisible() {
    const w = window.innerWidth;
    if (w < 640) return 1;
    if (w < 900) return 2;
    return 3;
  }

  function getSlideWidth() {
    const first = cards[0];
    if (!first) return 0;
    const style = getComputedStyle(track);
    const gap = parseInt(style.gap) || 24;
    return first.offsetWidth + gap;
  }

  const maxIndex = Math.max(0, cards.length - getVisible());

  function goTo(index) {
    if (index < 0) index = maxIndex;
    else if (index > maxIndex) index = 0;
    current = index;
    track.style.transform = `translateX(-${current * getSlideWidth()}px)`;

    const dots = dotsContainer?.querySelectorAll('.eventos__dot');
    dots?.forEach((el, i) => el.classList.toggle('eventos__dot--active', i === current));
    resetTimer();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  const numDots = maxIndex + 1;
  for (let i = 0; i < numDots; i++) {
    const dot = document.createElement('button');
    dot.className = `eventos__dot${i === 0 ? ' eventos__dot--active' : ''}`;
    dot.setAttribute('aria-label', `Ir a diapositiva ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer?.appendChild(dot);
  }

  let timer = setInterval(next, 5000);
  function resetTimer() { clearInterval(timer); timer = setInterval(next, 5000); }

  const carousel = document.getElementById('eventosCarousel');
  carousel?.addEventListener('mouseenter', () => clearInterval(timer));
  carousel?.addEventListener('mouseleave', () => { timer = setInterval(next, 5000); });

  window.addEventListener('resize', () => {
    const newMax = Math.max(0, cards.length - getVisible());
    if (current > newMax) goTo(newMax);
    else track.style.transform = `translateX(-${current * getSlideWidth()}px)`;
  });
}

function renderTestimonios(testimonios) {
  const grid = document.getElementById('resenasGrid');
  if (!testimonios || testimonios.length === 0) {
    grid.innerHTML = `<div class="proximos__empty media-placeholder" style="grid-column:1/-1;padding:60px">
      <i class="fas fa-star"></i>
      <span>No hay testimonios aún</span>
    </div>`;
    return;
  }
  grid.innerHTML = testimonios.map(t => `
    <div class="resena-card">
      <div class="resena-card__stars">
        ${'<i class="fas fa-star"></i>'.repeat(t.rating)}${'<i class="far fa-star"></i>'.repeat(5 - t.rating)}
      </div>
      <p class="resena-card__text">"${t.text}"</p>
      <div class="resena-card__author">
        <img src="${t.avatar || 'https://i.pravatar.cc/48?u=' + t.id}" alt="${t.name}" class="resena-card__avatar" />
        <div>
          <h4>${t.name}</h4>
          <span>${t.role || ''}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderGaleria(items) {
  const grid = document.getElementById('galeriaGrid');
  if (!items || items.length === 0) {
    grid.innerHTML = '';
    return;
  }
  grid.innerHTML = items.map(g => `
    <div class="galeria__item${g.type === 'video' ? ' galeria__item--video' : ''}">
      ${g.type === 'video'
        ? `<div class="galeria__video-wrap" onclick="toggleVideo(this)">
             <video src="/assets/uploads/${g.filename}" muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover;border-radius:12px;"></video>
             <div class="galeria__play"><i class="fas fa-play"></i></div>
           </div>`
        : `<img src="/assets/uploads/${g.filename}" alt="${g.alt || g.filename}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`
      }
    </div>
  `).join('');
}

function toggleVideo(container) {
  const video = container.querySelector('video');
  const play = container.querySelector('.galeria__play');
  if (video.paused) {
    video.play();
    play.style.display = 'none';
    video.addEventListener('pause', () => { play.style.display = 'flex'; }, { once: true });
  } else {
    video.pause();
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  if (!y || !m || !d) return 'Fecha inválida';
  const date = new Date(+y, +m - 1, +d);
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}
