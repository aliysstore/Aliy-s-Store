// Import Firebase módulos
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDHxFawAx3IStuZefZtOj_yYRMCDj5V-Rk",
  authDomain: "formiik-dev.firebaseapp.com",
  projectId: "formiik-dev",
  storageBucket: "formiik-dev.firebasestorage.app",
  messagingSenderId: "91782576906",
  appId: "1:91782576906:web:f95afdbe0f80bfa58758f3",
  measurementId: "G-ZW7YPM60FN",
};

// Inicializar Firebase y Analytics
console.log("📌 Inicializando Firebase...");
const app = initializeApp(firebaseConfig);

console.log("📌 Inicializando Analytics...");
const analytics = getAnalytics(app);

console.log("📌 Inicializando Firestore...");
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ DOM cargado. Iniciando carga concurrente...");

  mostrarSpinner(); // 🔹 Mostrar antes de empezar

  try {
    await Promise.all([
      cargarCarrusel(),
      cargarCatalogos(),
      cargarCatalogosAccesorios(),
    ]);
  } catch (e) {
    console.error("❌ Error en la carga:", e);
  } finally {
    ocultarSpinner(); // 🔹 Ocultar cuando todas terminen
  }

  console.log("✅ Todas las cargas terminadas.");
});

function mostrarSpinner() {
  document.getElementById("spinner-overlay").style.display = "flex";
}

function ocultarSpinner() {
  document.getElementById("spinner-overlay").style.display = "none";
}

async function cargarCarrusel() {
  const contenedor = document.getElementById("carrusel");

  try {
    console.log("📡 Realizando consulta a Firestore con filtro y orden...");
    const q = query(
      collection(db, "catalogo"),
      where("seccion", "==", "banner_novedades"),
      orderBy("id", "asc")
    );

    const snapshot = await getDocs(q);
    console.log(`📊 Documentos obtenidos: ${snapshot.size}`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`🖼 Procesando banner ID ${doc.id}:`, data);

      const card = document.createElement("div");
      card.classList.add("carrusel-card");

      const link = document.createElement("a");
      link.href = data.url;
      link.target = "_blank";
      link.addEventListener("click", () => {
        const nombreEvento = data.evento_ga || "click_banner";
        console.log(`📍 Evento GA: ${nombreEvento}, URL: ${data.url}`);
        logEvent(analytics, nombreEvento, {
          banner_id: doc.id,
          url: data.url,
        });
      });

      const img = document.createElement("img");
      img.src = data.imagen;
      img.alt = data.alt || "Banner";
      img.loading = "lazy";

      link.appendChild(img);
      card.appendChild(link);
      contenedor.appendChild(card);
    });

    console.log("✅ Carrusel cargado correctamente.");
  } catch (error) {
    console.error("❌ Error cargando carrusel:", error);
    contenedor.innerHTML = "Error al cargar carrusel";
  }
}

async function cargarCatalogos() {
  const contenedor = document.getElementById("catalogos");

  try {
    const q = query(
      collection(db, "catalogo"),
      where("seccion", "==", "catalogo_calzado"),
      orderBy("id", "asc")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach((doc) => {
      const data = doc.data();

      const card = document.createElement("div");
      card.classList.add("catalogos-card");

      // Contenedor imagen
      const contenedorImagen = document.createElement("div");
      contenedorImagen.classList.add("imagen-contenedor");

      const img = document.createElement("img");
      img.src = data.imagen;
      img.alt = data.alt || "Catalogo";
      img.loading = "lazy";

      contenedorImagen.appendChild(img);

      // Contenedor texto
      const texto = document.createElement("div");
      texto.classList.add("catalogo-texto");
      texto.textContent = data.nombre || "";

      // Armar card
      card.appendChild(contenedorImagen);
      card.appendChild(texto);

      // Evento click con evento GA
      card.addEventListener("click", () => {
        console.log(
          `📍 Clic en catálogo ID ${doc.id}, evento: ${data.evento_ga}`
        );

        // Registrar en Google Analytics
        logEvent(analytics, data.evento_ga || "click_default", {
          catalogo_id: doc.id,
          texto: data.texto,
        });

        // Abrir URL en nueva pestaña (si existe en Firestore)
        if (data.url) {
          window.open(data.url, "_blank");
        } else {
          console.warn("⚠️ El documento no tiene URL definida:", doc.id);
        }
      });

      // 🔹 Si es nuevo, añadir etiqueta
      if (data.esNuevo === true) {
        const etiqueta = document.createElement("div");
        etiqueta.classList.add("etiqueta-nuevo");
        etiqueta.textContent = "Nuevo";
        card.appendChild(etiqueta);
      }

      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error("❌ Error cargando catálogos:", error);
    contenedor.innerHTML = "Error al cargar catálogos";
  }
}

async function cargarCatalogosAccesorios() {
  const contenedor = document.getElementById("catalogos-accesorios");

  try {
    const q = query(
      collection(db, "catalogo"),
      where("seccion", "==", "catalogo_accesorios"),
      orderBy("id", "asc")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach((doc) => {
      const data = doc.data();

      const card = document.createElement("div");
      card.classList.add("catalogos-card");

      // Contenedor imagen
      const contenedorImagen = document.createElement("div");
      contenedorImagen.classList.add("imagen-contenedor");

      const img = document.createElement("img");
      img.src = data.imagen;
      img.alt = data.alt || "Catalogo";
      img.loading = "lazy";

      contenedorImagen.appendChild(img);

      // Contenedor texto
      const texto = document.createElement("div");
      texto.classList.add("catalogo-texto");
      texto.textContent = data.nombre || "";

      // Armar card
      card.appendChild(contenedorImagen);
      card.appendChild(texto);

      // Evento click con evento GA
      card.addEventListener("click", () => {
        console.log(
          `📍 Clic en catálogo ID ${doc.id}, evento: ${data.evento_ga}`
        );

        // Registrar en Google Analytics
        logEvent(analytics, data.evento_ga || "click_default", {
          catalogo_id: doc.id,
          texto: data.texto,
        });

        // Abrir URL en nueva pestaña (si existe en Firestore)
        if (data.url) {
          window.open(data.url, "_blank");
        } else {
          console.warn("⚠️ El documento no tiene URL definida:", doc.id);
        }
      });

      // 🔹 Si es nuevo, añadir etiqueta
      if (data.esNuevo === true) {
        const etiqueta = document.createElement("div");
        etiqueta.classList.add("etiqueta-nuevo");
        etiqueta.textContent = "Nuevo";
        card.appendChild(etiqueta);
      }

      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error("❌ Error cargando catálogos:", error);
    contenedor.innerHTML = "Error al cargar catálogos";
  }
}
