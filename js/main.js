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

const menuButton = document.getElementById('menu-button');
const closeButton = document.getElementById('close-button');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const catalogGrid = document.getElementById('catalog-grid');
const filterContainer = document.getElementById('filter-container');
const whatsappButton = document.getElementById('whatsapp-contact-button');
const sidebarLinks = document.querySelectorAll('.sidebar-link');

const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const noResultsState = document.getElementById('no-results-state');
const retryButton = document.getElementById('retry-button');
const contentContainer = document.getElementById('catalog-content');

const catalogModal = document.getElementById('catalog-modal');
const closeCatalogModal = document.getElementById('close-catalog-modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalButton = document.getElementById('modal-button');

const notFoundModal = document.getElementById('not-found-modal');
const closeNotFoundModal = document.getElementById('close-not-found-modal');
const closeNotFoundButton = document.getElementById('close-not-found-button');

let catalogosData = [];
// ¡CAMBIO! Variable para la instancia de Shuffle
let shuffleInstance; 
let filters = {
    brand: 'all',
    category: 'all'
};

function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
}

menuButton.addEventListener('click', () => {
  sidebar.classList.remove('-translate-x-full');
  sidebarOverlay.classList.remove('hidden');
});
closeButton.addEventListener('click', () => {
    closeSidebar();
});
sidebarOverlay.addEventListener('click', () => {
    closeSidebar();
});

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

whatsappButton.addEventListener('click', (e) => {
  registerWhatsappClickEvent();
});

function applyFilters() {
  shuffleInstance.filter((element) => {
    const brandFilter = filters.brand === 'all' ? null : filters.brand;
    const categoryFilter = filters.category === 'all' ? null : filters.category;
    const elementGroups = JSON.parse(element.getAttribute('data-groups'));

    if (brandFilter && !elementGroups.includes(brandFilter)) {
      return false;
    }

    if (categoryFilter && !elementGroups.includes(categoryFilter)) {
      return false;
    }

    return true;
  });

  shuffleInstance.layout();
  
} 

// ¡CAMBIO! Lógica para manejar resultados vacíos

function checkEmptyShuffle() {
  if (shuffleInstance) {
    const visibleItemsCount = shuffleInstance.items.filter(item => item.isVisible).length;
    
    if (visibleItemsCount === 0) {
      noResultsState.classList.remove('hidden');
      catalogGrid.classList.add('hidden');
    } else {
      noResultsState.classList.add('hidden');
      catalogGrid.classList.remove('hidden');
    }
  }
}

function displayCatalogos() {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '';
    if (catalogosData.length === 0) {
        noResultsState.classList.remove('hidden');
        catalogGrid.classList.add('hidden');
        return;
    } else {
        noResultsState.classList.add('hidden');
        catalogGrid.classList.remove('hidden');
    }

    catalogosData.forEach(catalogo => {
        const categoryClasses = catalogo.categoria.map(cat => cat.replace(/\s+/g, '-').toLowerCase());
        const brandClass = catalogo.marca.replace(/\s+/g, '-').toLowerCase();
        const allClasses = [brandClass, ...categoryClasses];

        const card = document.createElement('a');
        card.href = catalogo.url;
        card.target = "_blank";
        // ¡CAMBIO! Las clases de filtro se añaden al atributo data-groups
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
        grid.appendChild(card);
    });

    // ¡CAMBIO! Inicialización de Shuffle
    if (shuffleInstance) {
      shuffleInstance.destroy();
    }

    shuffleInstance = new Shuffle(grid, {
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
    
    shuffleInstance.on(Shuffle.EventType.LAYOUT, function() {
        checkEmptyShuffle();
    });
    
    imagesLoaded(grid).on('always', function() {
        grid.style.visibility = 'visible';
        shuffleInstance.layout();
        checkUrlFilter();
    });
}

function createFilterButtons(brands) {
    filterContainer.innerHTML = '';
    const allButton = document.createElement('button');
    allButton.textContent = 'Todo';
    allButton.className = 'filter-button active';
    allButton.dataset.filter = 'all';
    filterContainer.appendChild(allButton);
    brands.forEach(brand => {
        const button = document.createElement('button');
        button.textContent = brand;
        button.className = 'filter-button';
        // ¡CAMBIO! El valor del filtro es la clase de CSS, no el selector
        button.dataset.filter = brand.replace(/\s+/g, '-').toLowerCase(); 
        filterContainer.appendChild(button);
    });
    filterContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('filter-button')) {
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            filters.brand = event.target.dataset.filter;
            applyFilters();
            updateUrlParameter(filters.brand, filters.category);
        }
    });
}

function checkUrlFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    const brandFromUrl = urlParams.get('brand');
    const categoryFromUrl = urlParams.get('category');

    if (brandFromUrl) {
        const filterButton = document.querySelector(`.filter-button[data-filter="${brandFromUrl}"]`);
        if (filterButton) {
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            filterButton.classList.add('active');
            filters.brand = brandFromUrl;
        }
    }

    if (categoryFromUrl) {
        const sidebarLink = document.querySelector(`.sidebar-link[data-filter="${categoryFromUrl}"]`);
        if (sidebarLink) {
            sidebarLinks.forEach(l => l.classList.remove('active'));
            sidebarLink.classList.add('active');
            filters.category = categoryFromUrl;
        }
    }
    
    if (shuffleInstance) {
        applyFilters();
    }
}

function updateUrlParameter(brandName, categoryName) {
  const urlParams = new URLSearchParams(window.location.search);
  if (brandName === 'all') {
      urlParams.delete('brand');
  } else {
      urlParams.set('brand', brandName);
  }

  if (categoryName === 'all') {
      urlParams.delete('category');
  } else {
      urlParams.set('category', categoryName);
  }
  
  const newUrl = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`;
  window.history.replaceState({path: newUrl}, '', newUrl);
}

async function fetchCatalogos() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    noResultsState.classList.add('hidden');
    contentContainer.classList.add('hidden');
    catalogGrid.style.visibility = 'hidden';

    try {
        const catalogosRef = db.collection('catalogo');
        const snapshot = await catalogosRef.get();
        catalogosData = [];
        snapshot.forEach(doc => {
            catalogosData.push(doc.data());
        });
        
        const brands = [...new Set(catalogosData.map(item => item.marca).filter(Boolean))].sort();

        createFilterButtons(brands);
        displayCatalogos();

        loadingState.classList.add('hidden');
        contentContainer.classList.remove('hidden');
        
        checkUrlFilter();
        checkUrlCatalog();

    } catch (error) {
        console.error("Error fetching documents: ", error);
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }
}

function checkUrlCatalog() {
  const urlParams = new URLSearchParams(window.location.search);
  const catalogoUrlParam = urlParams.get('catalogo');

  if (catalogoUrlParam) {
    const foundCatalogo = catalogosData.find(c => c.evento_ga === catalogoUrlParam);

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

sidebarLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); 
        sidebarLinks.forEach(l => l.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        // ¡CAMBIO! El valor del filtro se toma del data-filter
        const categoryValue = event.currentTarget.dataset.filter;
        filters.category = categoryValue;
        applyFilters();
        updateUrlParameter(filters.brand, filters.category);
        
        closeSidebar();
    });
});

retryButton.addEventListener('click', fetchCatalogos);
closeCatalogModal.addEventListener('click', hideCatalogModal);
closeNotFoundModal.addEventListener('click', hideNotFoundModal);
closeNotFoundButton.addEventListener('click', hideNotFoundModal);

// Consentimiento de cookies
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

acceptAllButton.addEventListener('click', handleAcceptAll);
openModalButton.addEventListener('click', handleOpenModal);
closeModalButton.addEventListener('click', handleCloseModal);
saveConsentButton.addEventListener('click', handleSaveConsent);

// Código para el botón flotante de WhatsApp
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

whatsappFloatBtn.addEventListener('click', (e) => {
  registerWhatsappClickEvent();
});

document.addEventListener(
    'DOMContentLoaded', () => {
        fetchCatalogos();
        checkConsent();
    }
);


// Carrusel de marcas
const swiper = new Swiper(".mySwiper", {
    slidesPerView: "auto",
    spaceBetween: 10,
    loop: true,
    autoplay: {
      delay: 1500,
      disableOnInteraction: false,
    }
});