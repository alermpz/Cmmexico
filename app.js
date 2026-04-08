/* ==========================================================================
   CMMexico — Logica SPA (Single Page Application)
   --------------------------------------------------------------------------
   Este modulo controla:
     1. Enrutamiento interno (Hub <-> Secciones de Detalle)
     2. Animaciones de transicion suaves entre vistas
     3. Navegacion movil (hamburguesa)
     4. Comportamiento del scroll al cambiar de vista

   NOTA: Se utiliza delegacion de eventos sobre el contenedor .services-grid
   para garantizar que los clics en elementos hijos (SVG, span, p) siempre
   se propaguen correctamente a la tarjeta padre con [data-target].
   ========================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------------------------------
     REFERENCIAS AL DOM
     ----------------------------------------------------------------------- */

  /** Secciones principales del Hub */
  const heroSection    = document.getElementById('hero');
  const servicesHub    = document.getElementById('services-hub');
  const servicesGrid   = document.querySelector('.services-grid');

  /** Contenedores de detalle — cada uno es un panel independiente */
  const panelMarketing       = document.getElementById('detail-marketing');
  const panelCertificaciones = document.getElementById('detail-certificaciones');
  const panelGestoria        = document.getElementById('detail-gestoria');

  /** Mapa de paneles para acceso directo por ID */
  const panelsMap = {
    'detail-marketing':       panelMarketing,
    'detail-certificaciones': panelCertificaciones,
    'detail-gestoria':        panelGestoria
  };

  /** Botones de "Regresar al inicio" dentro de cada panel */
  const backButtons = document.querySelectorAll('.btn-back');

  /** Navegacion movil */
  const navToggle  = document.getElementById('nav-toggle');
  const siteNav    = document.getElementById('site-nav');
  const navOverlay = document.getElementById('nav-overlay');

  /** Marca / logo en el header */
  const brandLink = document.getElementById('brand-link');

  /** Links internos de la navegacion del header */
  const navLinks = document.querySelectorAll('.site-nav__link[data-target]');

  /** Duracion de las animaciones (ms) — sincronizada con CSS */
  const ANIM_DURATION_OUT = 350;
  const ANIM_DURATION_IN  = 400;

  /** Bandera para evitar doble clic durante animaciones */
  let isAnimating = false;


  /* -----------------------------------------------------------------------
     FUNCIONES AUXILIARES
     ----------------------------------------------------------------------- */

  /**
   * Desplaza la ventana suavemente hasta la parte superior de la pagina.
   */
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Cierra el menu de navegacion movil si esta abierto.
   */
  function closeMenu() {
    navToggle.classList.remove('is-active');
    siteNav.classList.remove('is-open');
    navOverlay.classList.remove('is-visible');
    document.body.style.overflow = '';
  }


  /* -----------------------------------------------------------------------
     ENRUTADOR INTERNO: HUB -> DETALLE
     ----------------------------------------------------------------------- */

  /**
   * Oculta el Hub (Hero + Grid) con animacion de salida y revela el panel
   * de detalle independiente correspondiente al servicio seleccionado.
   *
   * @param {string} targetId — ID del panel de detalle a mostrar.
   *   Valores validos: 'detail-marketing', 'detail-certificaciones',
   *                     'detail-gestoria'
   */
  function showDetail(targetId) {
    /* Validar que el panel existe en el mapa */
    const targetPanel = panelsMap[targetId];
    if (!targetPanel || isAnimating) return;

    isAnimating = true;

    /* Paso 1: Aplicar animacion de salida al Hero y al Grid */
    heroSection.classList.add('fade-out');
    servicesHub.classList.add('fade-out');

    /* Paso 2: Esperar a que termine la animacion de salida */
    setTimeout(() => {
      /* Ocultar el Hub completamente */
      heroSection.classList.add('is-hidden');
      servicesHub.classList.add('is-hidden');

      /* Limpiar la clase de animacion de salida */
      heroSection.classList.remove('fade-out');
      servicesHub.classList.remove('fade-out');

      /* Paso 3: Mostrar el panel de detalle independiente */
      targetPanel.classList.add('is-visible');

      /* Scroll al inicio de la nueva vista */
      scrollToTop();

      /* Liberar la bandera tras completar la animacion de entrada */
      setTimeout(() => {
        isAnimating = false;
      }, ANIM_DURATION_IN);

    }, ANIM_DURATION_OUT);
  }

  /**
   * Oculta el panel de detalle activo con animacion de salida y restaura
   * la vista principal del Hub (Hero + Grid) con animacion de entrada.
   */
  function showHub() {
    if (isAnimating) return;

    /* Encontrar el panel de detalle activo (solo uno puede estar visible) */
    const activePanel = document.querySelector('.detail-section.is-visible');
    if (!activePanel) return;

    isAnimating = true;

    /* Paso 1: Aplicar animacion de salida al panel activo */
    activePanel.classList.add('is-leaving');

    /* Paso 2: Esperar a que termine la animacion de salida */
    setTimeout(() => {
      /* Ocultar el panel completamente */
      activePanel.classList.remove('is-visible', 'is-leaving');

      /* Paso 3: Restaurar el Hub con animacion de entrada */
      heroSection.classList.remove('is-hidden');
      servicesHub.classList.remove('is-hidden');

      heroSection.classList.add('fade-in');
      servicesHub.classList.add('fade-in');

      /* Scroll al inicio */
      scrollToTop();

      /* Limpiar la clase de animacion de entrada tras completarse */
      setTimeout(() => {
        heroSection.classList.remove('fade-in');
        servicesHub.classList.remove('fade-in');
        isAnimating = false;
      }, ANIM_DURATION_IN);

    }, ANIM_DURATION_OUT);
  }


  /* -----------------------------------------------------------------------
     EVENT LISTENER: DELEGACION DE EVENTOS EN EL GRID DE SERVICIOS
     -----------------------------------------------------------------------
     En lugar de adjuntar listeners individuales a cada tarjeta, se utiliza
     un unico listener en el contenedor .services-grid. Al hacer clic en
     cualquier elemento hijo (icono SVG, titulo, parrafo, span CTA), el
     metodo closest() busca hacia arriba el ancestro .service-card mas
     cercano que tenga un atributo [data-target]. Esto garantiza que el
     clic funcione correctamente en las tres tarjetas internas sin importar
     en que elemento hijo se haga clic.
     ----------------------------------------------------------------------- */

  if (servicesGrid) {
    servicesGrid.addEventListener('click', (e) => {
      /* Buscar el ancestro .service-card con data-target mas cercano */
      const card = e.target.closest('.service-card[data-target]');
      if (!card) return;  /* Clic fuera de una tarjeta interna, ignorar */

      const targetId = card.getAttribute('data-target');
      showDetail(targetId);
    });
  }


  /* -----------------------------------------------------------------------
     EVENT LISTENERS: BOTONES "REGRESAR AL INICIO"
     -----------------------------------------------------------------------
     Cada uno de los tres paneles independientes (Marketing, Certificaciones,
     Gestoria) contiene su propio boton .btn-back. Al hacer clic, se oculta
     el panel activo y se restaura el Hub principal.
     ----------------------------------------------------------------------- */

  backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      showHub();
    });
  });


  /* -----------------------------------------------------------------------
     EVENT LISTENER: MARCA (LOGO) EN EL HEADER
     -----------------------------------------------------------------------
     Si hay un panel de detalle visible, al hacer clic en "CMMexico" se
     regresa al Hub. Si ya estamos en el Hub, simplemente hace scroll
     al inicio.
     ----------------------------------------------------------------------- */

  brandLink.addEventListener('click', () => {
    const activePanel = document.querySelector('.detail-section.is-visible');
    if (activePanel) {
      showHub();
    } else {
      scrollToTop();
    }
    closeMenu();
  });


  /* -----------------------------------------------------------------------
     EVENT LISTENERS: LINKS DE NAVEGACION DEL HEADER
     -----------------------------------------------------------------------
     Los enlaces con data-target en la barra de navegacion permiten abrir
     directamente un panel de detalle sin pasar por el Grid.
     ----------------------------------------------------------------------- */

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      /* Si ya hay un panel visible, ocultarlo primero */
      const activePanel = document.querySelector('.detail-section.is-visible');
      if (activePanel) {
        /* Si el panel activo es el mismo al que se quiere ir, solo cerrar menu */
        const targetId = link.getAttribute('data-target');
        if (activePanel.id === targetId) {
          closeMenu();
          return;
        }
        /* Caso contrario: ocultar el panel activo y mostrar el nuevo */
        activePanel.classList.remove('is-visible');
        const newPanel = panelsMap[targetId];
        if (newPanel) {
          newPanel.classList.add('is-visible');
          scrollToTop();
        }
      } else {
        /* Hub esta visible: ocultarlo y mostrar el panel de detalle */
        const targetId = link.getAttribute('data-target');
        showDetail(targetId);
      }
      closeMenu();
    });
  });


  /* -----------------------------------------------------------------------
     NAVEGACION MOVIL
     ----------------------------------------------------------------------- */

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('is-open');
      navToggle.classList.toggle('is-active');
      navOverlay.classList.toggle('is-visible');

      /* Prevenir scroll del body cuando el menu esta abierto */
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  if (navOverlay) {
    navOverlay.addEventListener('click', closeMenu);
  }


  /* -----------------------------------------------------------------------
     ACCESIBILIDAD: NAVEGACION CON TECLADO
     -----------------------------------------------------------------------
     Las tarjetas internas (div, no <a>) reciben tabindex y role para
     ser navegables con teclado. Enter y Espacio activan el clic.
     ----------------------------------------------------------------------- */

  const internalCards = servicesGrid
    ? servicesGrid.querySelectorAll('.service-card[data-target]')
    : [];

  internalCards.forEach(card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  /* -----------------------------------------------------------------------
     AUTO-HIDE HEADER (SCROLL)
     ----------------------------------------------------------------------- */
  const siteHeader = document.querySelector('.site-header');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    if (!siteHeader) return;
    
    const currentScrollY = window.scrollY;
    
    /* Si baja el scroll más allá del tamaño del header, ocultamos */
    if (currentScrollY > lastScrollY && currentScrollY > 72) {
      siteHeader.classList.add('site-header--hidden');
    } else {
      /* Si sube, mostramos */
      siteHeader.classList.remove('site-header--hidden');
    }
    
    lastScrollY = currentScrollY;
  }, { passive: true });

  /* -----------------------------------------------------------------------
     SCROLL REVEALS (INTERSECTION OBSERVER)
     ----------------------------------------------------------------------- */
  // Asignamos clase ".reveal" dinámicamente a elementos importantes si no la tienen en HTML
  const revealElements = document.querySelectorAll('.hero__content, .services-hub__header, .service-card, .detail-header, .detail-body__text, .detail-body__highlights');
  
  revealElements.forEach(el => {
    if(!el.classList.contains('reveal')) {
        el.classList.add('reveal');
    }
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  };

  const scrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        // Una vez revelado, dejamos de observarlo (opcional, para animar solo la primera vez)
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => scrollObserver.observe(el));

});
