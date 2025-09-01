// js/main.js

document.addEventListener('DOMContentLoaded', () => {
  // Inicialización de Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyDHxFawAx3IStuZefZtOj_yYRMCDj5V-Rk",
    authDomain: "formiik-dev.firebaseapp.com",
    projectId: "formiik-dev",
    storageBucket: "formiik-dev.firebasestorage.app",
    messagingSenderId: "91782576906",
    appId: "1:91782576906:web:f95afdbe0f80bfa58758f3",
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const noResultsState = document.getElementById('no-results-state');
  const retryButton = document.getElementById('retry-button');
  const contentContainer = document.getElementById('catalog-content');
  const catalogGrid = document.getElementById('catalog-grid');
  
  const searchBar = document.getElementById('search-bar');
  const filterSuggestions = document.getElementById('filter-suggestions');

  const catalogModal = document.getElementById('catalog-modal');
  const closeCatalogModal = document.getElementById('close-catalog-modal');
  const modalImage = document.getElementById('modal-image');
  const modalTitle = document.getElementById('modal-title');
  const modalButton = document.getElementById('modal-button');

  const notFoundModal = document.getElementById('not-found-modal');
  const closeNotFoundModal = document.getElementById('close-not-found-modal');
  const closeNotFoundButton = document.getElementById('close-not-found-button');
  
  let allProducts = [];
  let shuffleInstance;

  // Definimos los filtros que irán en el datalist
  const filters = [
    "Todo", "Calzado", "Ropa", "Accesorios", "Hogar", "Belleza y fragancias", "Outlet", "Catálogos especiales", "Dama", "Caballeros", "Niños"
  ];

  // Llenar el datalist con los filtros
  filters.forEach(filter => {
    const option = document.createElement('option');
    option.value = filter;
    filterSuggestions.appendChild(option);
  });
  
  // Función para registrar eventos de Google Analytics
  function registerCardClickEvent(eventName, catalogo) {
    gtag('event', eventName, {
      'event_category': 'catalogo',
      'event_action': 'click_card',
      'event_label': catalogo.nombre,
      'brand': catalogo.marca
    });
  }

  function registerWhatsappClickEvent() {
    gtag('event', 'whatsapp_click', {
      'event_category': 'contacto',
      'event_action': 'click_whatsapp'
    });
  }

  // Lógica de búsqueda
  const handleSearch = () => {
    const searchTerm = searchBar.value.toLowerCase().trim();
    if (searchTerm === '') {
        renderProducts(allProducts);
        return;
    }
    const filteredProducts = allProducts.filter(product => {
      // Unimos varios campos en un solo string para buscar
      const searchString = `${product.nombre} ${product.descripcion} ${product.marca} ${product.categoria.join(' ')}`.toLowerCase();
      return searchString.includes(searchTerm);
    });
    renderProducts(filteredProducts);
  };
  
  // Función para renderizar los productos en la cuadrícula
  const renderProducts = (productsToRender) => {
    catalogGrid.innerHTML = '';
    if (productsToRender.length === 0) {
      noResultsState.classList.remove('hidden');
      catalogGrid.classList.add('hidden');
    } else {
      noResultsState.classList.add('hidden');
      catalogGrid.classList.remove('hidden');

      productsToRender.forEach(catalogo => {
        const categoryClasses = catalogo.categoria.map(cat => cat.replace(/\s+/g, '-').toLowerCase());
        const brandClass = catalogo.marca.replace(/\s+/g, '-').toLowerCase();
        const allClasses = [brandClass, ...categoryClasses];

        const card = document.createElement('a');
        card.href = catalogo.url;
        card.target = "_blank";
        card.className = 'group rounded-lg shadow-md hover:shadow-lg transition-transform hover:scale-105 duration-300 bg-md-surface flex flex-col overflow-hidden catalog-item';
        card.setAttribute("data-groups", JSON.stringify(allClasses));
        
        if (catalogo.prioridad !== undefined) {
          card.setAttribute("data-prioridad", catalogo.prioridad);
        } else {
          card.setAttribute("data-prioridad", 9999);
        }

        if (catalogo.evento_ga) {
          card.addEventListener('click', () => {
            registerCardClickEvent(catalogo.evento_ga, catalogo);
          });
        }

        const imageWrapper = document.createElement('div');
        imageWrapper.className = "relative w-full overflow-hidden";
        const image = document.createElement('img');
        image.src = catalogo.imagen;
        image.alt = `Portada de ${catalogo.nombre}`;
        image.className = "w-full h-full object-cover transition-transform duration-300 object-top";
        imageWrapper.appendChild(image);

        const textContainer = document.createElement('div');
        textContainer.className = "p-3 flex-grow text-center flex flex-col items-center";
        const title = document.createElement('h3');
        title.textContent = catalogo.nombre;
        title.className = "text-md font-bold font-oswald text-md-on-surface";
        textContainer.appendChild(title);

        card.appendChild(imageWrapper);
        card.appendChild(textContainer);
        catalogGrid.appendChild(card);
      });
      
      // Re-inicializamos Shuffle para ordenar y manejar el layout
      if (shuffleInstance) {
        shuffleInstance.destroy();
      }

      shuffleInstance = new Shuffle(catalogGrid, {
        itemSelector: '.catalog-item',
        initialSort: {
          by: (element) => {
            const prioridad = parseInt(element.getAttribute('data-prioridad'));
            const nombre = element.querySelector('h3').textContent;
            return `${prioridad.toString().padStart(10, '0')}_${nombre}`;
          },
          reverse: false
        }
      });
      imagesLoaded(catalogGrid).on('always', function() {
          catalogGrid.style.visibility = 'visible';
          shuffleInstance.layout();
      });
    }
  };

  async function fetchCatalogos() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    noResultsState.classList.add('hidden');
    contentContainer.classList.add('hidden');
    catalogGrid.style.visibility = 'hidden';

    try {
      const catalogosRef = db.collection('catalogo');
      const snapshot = await catalogosRef.get();
      allProducts = [];
      snapshot.forEach(doc => {
        allProducts.push(doc.data());
      });
      
      renderProducts(allProducts);

      loadingState.classList.add('hidden');
      contentContainer.classList.remove('hidden');

    } catch (error) {
      console.error("Error fetching documents: ", error);
      loadingState.classList.add('hidden');
      errorState.classList.remove('hidden');
    }
  }

  // Carrusel de marcas (sin cambios)
  async function generarCarruselMarcas() {
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    swiperWrapper.innerHTML = '';
    try {
      const marcas = [
        { name: "Adidas", image: "assets/img/Adidas.svg" },
        { name: "Nike", image: "assets/img/Belinda.svg" },
        { name: "Puma", image: "assets/img/puma.svg" },
        { name: "Reebok", image: "assets/img/reebok.svg" },
        { name: "Converse", image: "assets/img/converse.svg" },
        { name: "Vans", image: "assets/img/vans.svg" },
        { name: "Adidas", image: "assets/img/Adidas.svg" },
        { name: "Nike", image: "assets/img/Belinda.svg" },
        { name: "Puma", image: "assets/img/puma.svg" },
        { name: "Reebok", image: "assets/img/reebok.svg" },
        { name: "Converse", image: "assets/img/converse.svg" },
        { name: "Vans", image: "assets/img/vans.svg" },
        { name: "Adidas", image: "assets/img/Adidas.svg" },
        { name: "Nike", image: "assets/img/Belinda.svg" },
        { name: "Puma", image: "assets/img/puma.svg" },
        { name: "Reebok", image: "assets/img/reebok.svg" },
        { name: "Converse", image: "assets/img/converse.svg" },
        { name: "Vans", image: "assets/img/vans.svg" },
      ];

      marcas.forEach(marca => {
        const slideDiv = document.createElement('div');
        slideDiv.classList.add('swiper-slide');
        slideDiv.innerHTML = `
          <div class="flex justify-center items-center">
            <img src="${marca.image}" alt="${marca.name}" />
          </div>
        `;
        swiperWrapper.appendChild(slideDiv);
      });

      new Swiper('.default-carousel', {
        slidesPerView: 3,
        spaceBetween: 20,
        loop: true,
        centeredSlides: true,
        breakpoints: {
          640: { slidesPerView: 6, spaceBetween: 20 },
          768: { slidesPerView: 8, spaceBetween: 30 },
          1024: { slidesPerView: 10, spaceBetween: 40 },
        }
      });
    } catch (error) {
      console.error("Error al generar el carrusel de marcas:", error);
    }
  }

  // Código para modales (sin cambios)
  function checkUrlCatalog() {
    const urlParams = new URLSearchParams(window.location.search);
    const catalogoUrlParam = urlParams.get('catalogo');
    if (catalogoUrlParam) {
      const foundCatalogo = allProducts.find(c => c.evento_ga === catalogoUrlParam);
      if (foundCatalogo) {
        showCatalogModal(foundCatalogo);
      } else {
        showNotFoundModal();
      }
    }
  }

  function showCatalogModal(catalogo) {
    modalImage.src = catalogo.imagen;
    modalImage.alt = `Portada de ${catalogo.nombre}`;
    modalTitle.textContent = catalogo.nombre;
    modalButton.href = catalogo.url;
    modalButton.onclick = () => {
      registerCardClickEvent(catalogo.evento_ga, catalogo);
      hideCatalogModal();
    };
    catalogModal.classList.add('show');
  }

  function hideCatalogModal() {
    catalogModal.classList.remove('show');
  }

  function showNotFoundModal() {
    notFoundModal.classList.add('show');
  }

  function hideNotFoundModal() {
    notFoundModal.classList.remove('show');
  }
  
  // Consentimiento de cookies (sin cambios)
  const consentBanner = document.getElementById('consent-banner');
  const acceptAllButton = document.getElementById('accept-all-cookies');
  const openModalButton = document.getElementById('open-consent-modal');
  const consentModal = document.getElementById('consent-modal');
  const closeModalButton = document.getElementById('close-modal');
  const saveConsentButton = document.getElementById('save-consent');
  const analyticsToggle = document.getElementById('analytics-toggle');
  const adToggle = document.getElementById('ad-toggle');

  function checkConsent() {
    const storedConsent = localStorage.getItem('cookie_consent');
    if (storedConsent) {
      const consent = JSON.parse(storedConsent);
      gtag('consent', 'update', {
        'ad_storage': consent.ad_storage,
        'analytics_storage': consent.analytics_storage
      });
      analyticsToggle.checked = consent.analytics_storage === 'granted';
      adToggle.checked = consent.ad_storage === 'granted';
      consentBanner.classList.remove('show');
    } else {
      setTimeout(() => {
        consentBanner.classList.add('show');
      }, 3000);
    }
  }

  function handleAcceptAll() {
    const consent = {
      analytics_storage: 'granted',
      ad_storage: 'granted'
    };
    gtag('consent', 'update', consent);
    localStorage.setItem('cookie_consent', JSON.stringify(consent));
    consentBanner.classList.remove('show');
    console.log('Consentimiento total aceptado. Google Analytics y publicidad habilitados.');
  }

  function handleSaveConsent() {
    const analyticsGranted = analyticsToggle.checked ? 'granted' : 'denied';
    const adGranted = adToggle.checked ? 'granted' : 'denied';

    const consent = {
      analytics_storage: analyticsGranted,
      ad_storage: adGranted
    };

    gtag('consent', 'update', consent);
    localStorage.setItem('cookie_consent', JSON.stringify(consent));
    consentModal.classList.remove('show');
    consentBanner.classList.remove('show');
    console.log('Consentimiento guardado. Analytics:', analyticsGranted, 'Publicidad:', adGranted);
  }

  function handleOpenModal() {
    consentBanner.classList.remove('show');
    consentModal.classList.add('show');
  }

  function handleCloseModal() {
    consentModal.classList.remove('show');
    checkConsent();
  }
  
  // Código para el botón flotante de WhatsApp (sin cambios)
  const whatsappFloatBtn = document.getElementById('whatsapp-float');
  const scrollThreshold = 50;
  let lastScrollY = window.scrollY;

  if (whatsappFloatBtn) {
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) {
        return;
      }
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        whatsappFloatBtn.classList.add('hide');
      } else {
        whatsappFloatBtn.classList.remove('hide')
      }
      lastScrollY = currentScrollY;
    });
  }
  
  // Event listeners
  retryButton.addEventListener('click', fetchCatalogos);
  closeCatalogModal.addEventListener('click', hideCatalogModal);
  closeNotFoundModal.addEventListener('click', hideNotFoundModal);
  closeNotFoundButton.addEventListener('click', hideNotFoundModal);
  acceptAllButton.addEventListener('click', handleAcceptAll);
  openModalButton.addEventListener('click', handleOpenModal);
  closeModalButton.addEventListener('click', handleCloseModal);
  saveConsentButton.addEventListener('click', handleSaveConsent);
  whatsappFloatBtn.addEventListener('click', (e) => {
    registerWhatsappClickEvent();
  });
  
  // Nuevo event listener para la barra de búsqueda
  searchBar.addEventListener('input', handleSearch);

  // Iniciar la carga de datos
  document.addEventListener('DOMContentLoaded', () => {
    fetchCatalogos();
    checkConsent();
    generarCarruselMarcas();
  });
});
