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

// Estilos base para los botones de filtro (deben coincidir con los de createFilterButtons)
const baseClasses = 'px-4 py-2 rounded-full font-bold transition-colors duration-300 text-sm md:text-base ' +
    'bg-transparent border-2 border-md-primary text-md-on-surface-variant ' +
    'hover:bg-md-primary-container hover:text-md-on-primary-container ' +
    'focus:outline-none focus:ring-2 focus:ring-md-primary';
    
// Estilos para el botón activo (deben coincidir con los de createFilterButtons)
const activeClasses = 'px-4 py-2 rounded-full font-bold transition-colors duration-300 text-sm md:text-base ' +
    'bg-md-primary border-2 border-md-primary text-md-on-primary ' +
    'hover:bg-md-primary-container hover:text-md-on-primary-container ' +
    'focus:outline-none focus:ring-2 focus:ring-md-primary';

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

const searchBar = document.getElementById('search-bar');
const filterSuggestions = document.getElementById('filter-suggestions');

// Añade las nuevas variables del DOM
const titleContainer = document.getElementById('title-container');
const searchContainer = document.getElementById('search-container');
const searchToggleButton = document.getElementById('search-toggle-button');
const closeSearchButton = document.getElementById('close-search-button');

// Lógica para mostrar/ocultar la barra de búsqueda en móvil
searchToggleButton.addEventListener('click', () => {
    titleContainer.classList.add('hidden');
    searchContainer.classList.remove('hidden');
    searchContainer.classList.add('flex');
    searchToggleButton.classList.add('hidden');
});

closeSearchButton.addEventListener('click', () => {
    searchBar.value = ''; // Borra el texto de la barra de búsqueda
    handleSearch(); // Llama a la función de búsqueda para limpiar los resultados
    titleContainer.classList.remove('hidden');
    searchContainer.classList.add('hidden');
    searchContainer.classList.remove('flex');
    searchToggleButton.classList.remove('hidden');
});

const searchFilters = [
    "Calzado", "Ropa", "Accesorios", "Hogar", "Belleza y fragancias", "Outlet", "Catálogos especiales", "Dama", "Caballeros", "Niños"
];
searchFilters.forEach(filter => {
    const option = document.createElement('option');
    option.value = filter;
    filterSuggestions.appendChild(option);
});

let catalogosData = [];
let shuffleInstance;
let filters = {
    brand: 'all',
    category: 'all'
};

function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
}

/*menuButton.addEventListener('click', () => {
  sidebar.classList.remove('-translate-x-full');
  sidebarOverlay.classList.remove('hidden');
});
closeButton.addEventListener('click', () => {
    closeSidebar();
});
sidebarOverlay.addEventListener('click', () => {
    closeSidebar();
});*/

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

/*whatsappButton.addEventListener('click', (e) => {
  registerWhatsappClickEvent();
});*/

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

function handleSearch() {
    const searchTerm = searchBar.value.toLowerCase().trim();

    if (searchTerm === '') {
        // Si la búsqueda está vacía, aplica los filtros de los botones
        applyFilters();
    } else {
        // Si hay un término de búsqueda, ignora los filtros de los botones y aplica solo la búsqueda
        shuffleInstance.filter((element) => {
            const productData = catalogosData.find(d => d.nombre === element.querySelector('h3').textContent);
            if (!productData) {
                return false;
            }
            const searchString = `${productData.nombre} ${productData.marca} ${productData.categoria.join(' ')}`.toLowerCase();
            return searchString.includes(searchTerm);
        });
        shuffleInstance.layout();
    }
    
    checkEmptyShuffle();
}

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
        card.className = 'group rounded-lg border border-md-secondary-container shadow-sm hover:shadow-md transition-transform hover:scale-105 duration-300 bg-white flex flex-col overflow-hidden catalog-item';
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

    shuffleInstance.on(Shuffle.EventType.LAYOUT, function () {
        checkEmptyShuffle();
    });

    imagesLoaded(grid).on('always', function () {
        grid.style.visibility = 'visible';
        shuffleInstance.layout();
        checkUrlFilter();
    });
}

function createFilterButtons(brands) {
    filterContainer.innerHTML = '';

    // Botón "Todo"
    const allButton = document.createElement('button');
    allButton.textContent = 'Todo';
    allButton.className = activeClasses; // Empieza como activo
    allButton.dataset.filter = 'all';
    filterContainer.appendChild(allButton);

    // Botones de marcas
    brands.forEach(brand => {
        const button = document.createElement('button');
        button.textContent = brand;
        button.className = `${baseClasses} ${activeClasses}`; // No está activo al inicio
        button.dataset.filter = brand.replace(/\s+/g, '-').toLowerCase();
        filterContainer.appendChild(button);
    });

    // Delegación de eventos
    filterContainer.addEventListener('click', (event) => {
        const clickedButton = event.target;
        if (clickedButton.tagName === 'BUTTON') {
            searchBar.value = '';
            
            // Remueve los estilos activos de todos los botones
            document.querySelectorAll('#filter-container button').forEach(btn => {
                btn.classList.remove(...activeClasses.split(' '));
                btn.classList.add(...baseClasses.split(' '));
            });

            // Agrega los estilos activos al botón clickeado
            clickedButton.classList.remove(...baseClasses.split(' '));
            clickedButton.classList.add(...activeClasses.split(' '));
            // clickedButton.className = `${baseClasses} ${activeClasses}`
            
            filters.brand = clickedButton.dataset.filter;
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
        // Seleccionamos el botón usando el `data-filter`
        const filterButton = document.querySelector(`button[data-filter="${brandFromUrl}"]`);
        if (filterButton) {
            // Remueve las clases activas de todos los botones y añade las clases base
            document.querySelectorAll('#filter-container button').forEach(btn => {
                btn.className = baseClasses;
            });

            // Añade las clases activas al botón del filtro de la URL
            filterButton.className = activeClasses;
            filters.brand = brandFromUrl;
        }
    }

    if (categoryFromUrl) {
        // La lógica para la categoría asume que `sidebar-link` se mantiene con su CSS original
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



/*function createFilterButtons(brands) {
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
        button.dataset.filter = brand.replace(/\s+/g, '-').toLowerCase();
        filterContainer.appendChild(button);
    });
    // Se añade el event listener directamente al contenedor para delegación
    filterContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('filter-button')) {
            // Se borra el contenido de la barra de búsqueda al hacer clic en un botón de filtro
            searchBar.value = '';
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            filters.brand = event.target.dataset.filter;
            applyFilters();
            updateUrlParameter(filters.brand, filters.category);
        }
    });
}*/

/*function checkUrlFilter() {
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
}*/

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
    window.history.replaceState({ path: newUrl }, '', newUrl);
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
        
        // Se borra el contenido de la barra de búsqueda al hacer clic en un enlace de la barra lateral
        searchBar.value = '';

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

searchBar.addEventListener('input', handleSearch);

document.addEventListener(
    'DOMContentLoaded', () => {
        fetchCatalogos();
        checkConsent();
    }
);

async function generarCarruselMarcas() {
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    swiperWrapper.innerHTML = '';
    try {
        const marcas = [
            { name: "Adidas", image: "assets/img/Adidas.svg" },
            { name: "Nike", image: "assets/img/Belinda.svg" },
            { name: "CAT", image: "assets/img/CAT.svg" },
            { name: "Charly", image: "assets/img/charly.svg" },
            { name: "Converse", image: "assets/img/converse.svg" },
            { name: "DC", image: "assets/img/DC.svg" },
            { name: "Fila", image: "assets/img/Fila.svg" },
            { name: "Flexi", image: "assets/img/FLEXI.svg" },
            { name: "Goodyear", image: "assets/img/goodyear.svg" },
            { name: "Hummer", image: "assets/img/hummer.svg" },
            { name: "Jansport", image: "assets/img/Jansport.svg" },
            { name: "Jeep", image: "assets/img/Jeep.svg" },
            { name: "Kswiss", image: "assets/img/Kswiss.svg" },
            { name: "Lacoste", image: "assets/img/lacoste.svg" },
            { name: "Levis", image: "assets/img/levis.svg" },
            { name: "Lotto", image: "assets/img/lotto.svg" },
            { name: "Michael Domit", image: "assets/img/Michael_Domit.svg" },
            { name: "Mirage", image: "assets/img/mirage.svg" },
            { name: "Newera", image: "assets/img/newera.svg" },
            { name: "Panam", image: "assets/img/Panam.svg" },
            { name: "Perry Ellis", image: "assets/img/perry_ellis.svg" },
            { name: "Pirma", image: "assets/img/pirma.svg" },
            { name: "Polo", image: "assets/img/Polo.svg" },
            { name: "Prokennex", image: "assets/img/PROKENNEX.svg" },
            { name: "Puma", image: "assets/img/PUMA.svg" },
            { name: "Reebok", image: "assets/img/reebok.svg" },
            { name: "Skechers", image: "assets/img/skechers.svg" },
            { name: "Thalia", image: "assets/img/Thalia_S.svg" },
            
            { name: "Timberland", image: "assets/img/Timberland.svg" },
            { name: "Tommy", image: "assets/img/Tommy.svg" },
            { name: "Under Armour", image: "assets/img/Under_Armour.svg" },
            { name: "Vans", image: "assets/img/Vans.svg" }
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
                640: {
                    slidesPerView: 6,
                    spaceBetween: 20
                },
                768: {
                    slidesPerView: 8,
                    spaceBetween: 30
                },
                1024: {
                    slidesPerView: 10,
                    spaceBetween: 40
                },
            },
            autoplay: {
                delay: 2500,
                disableOnInteraction: false
            }
        });
    } catch (error) {
        console.error("Error al generar el carrusel de marcas:", error);
    }
}

document.addEventListener('DOMContentLoaded', generarCarruselMarcas);
