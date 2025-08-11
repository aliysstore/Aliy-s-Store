// Import Firebase módulos
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { getFirestore, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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


// Tu código existente de carga concurrente...

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ DOM cargado. Iniciando carga concurrente...");
  
  mostrarSpinner();
  
  try {
    await Promise.all([
      cargarCarrusel(),
      cargarCatalogos(),
      cargarCatalogosAccesorios(),
      cargarResenas()
    ]);
  } catch (e) {
    console.error("❌ Error en la carga:", e);
  } finally {
    ocultarSpinner();
  }
  
  console.log("✅ Todas las cargas terminadas.");
  
  const btn = document.getElementById("whatsapp-btn");
  
  setInterval(() => {
    btn.classList.add("animate-pulse");
    setTimeout(() => {
      btn.classList.remove("animate-pulse");
    }, 1000);
  }, 5000);
  
  // Aquí agregamos el listener del formulario de reseñas
  const formReseña = document.getElementById("form-reseña");
  if (formReseña) {
    formReseña.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const nombre = document.getElementById("nombre").value.trim();
      const mensaje = document.getElementById("mensaje").value.trim();
      const calificacion = document.querySelector('input[name="calificacion"]:checked')?.value || null;
      
      if (!nombre || !mensaje || !calificacion) {
        alert("Por favor completa todos los campos y selecciona una calificación.");
        return;
      }
      
      try {
        await addDoc(collection(db, "resenas"), {
          nombre: nombre,
          mensaje: mensaje,
          calificacion: Number(calificacion),
          fecha: serverTimestamp(),
          verificado: false
        });
        
        alert("¡Gracias por tu reseña!");
        formReseña.reset();
      } catch (error) {
        console.error("Error guardando reseña:", error);
        alert("Ocurrió un error al guardar tu reseña.");
      }
    });
  }
});

// Funciones mostrar/ocultar spinner y carga de datos (tus funciones existentes)...
// cargarCarrusel, cargarCatalogos, cargarCatalogosAccesorios, mostrarSpinner, ocultarSpinner
// (se mantienen igual que en tu código actual)

document.querySelector('.whatsapp-fab').addEventListener('click', () => {
  logEvent(analytics, "click_whatsapp", { origen: "FAB flotante" });
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


async function cargarResenas() {
  try {
    const q = query(
      collection(db, "resenas"),
      //where("verificado", "==", true),
      //orderBy("fecha", "desc")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      document.getElementById("card-reseñas-navegacion").innerHTML =
        "<p>No hay reseñas verificadas aún.</p>";
      return;
    }

    let reseñas = []; // variable global para guardar reseñas
    snapshot.forEach((doc) => {
      const data = doc.data();
      reseñas.push({
        autor: data.nombre || "Anónimo",
        texto: data.mensaje,
        calificacion: data.calificacion,
      });
    });

    let indiceActual = 0;

    const textoReseña = document.getElementById("texto-reseña");
    const autorReseña = document.getElementById("autor-reseña");
    const estrellasReseña = document.getElementById("estrellas-reseña");

    const btnAnterior = document.getElementById("btn-anterior");
    const btnSiguiente = document.getElementById("btn-siguiente");

    function mostrarReseña(indice) {
      const r = reseñas[indice];
      textoReseña.textContent = r.texto;
      autorReseña.textContent = `— ${r.autor}`;
      estrellasReseña.innerHTML = "";

      for (let i = 1; i <= 5; i++) {
        const estrella = document.createElement("span");
        estrella.textContent = "★";
        estrella.style.color = i <= r.calificacion ? "#ffc107" : "#ddd";
        estrellasReseña.appendChild(estrella);
      }

      btnAnterior.disabled = indice === 0;
      btnSiguiente.disabled = indice === reseñas.length - 1;
    }

    btnAnterior.addEventListener("click", () => {
      if (indiceActual > 0) {
        indiceActual--;
        mostrarReseña(indiceActual);
      }
    });

    btnSiguiente.addEventListener("click", () => {
      if (indiceActual < reseñas.length - 1) {
        indiceActual++;
        mostrarReseña(indiceActual);
      }
    });

    mostrarReseña(indiceActual);
  } catch (error) {
    console.error("❌ Error cargando reseñas:", error);
    const contenedor = document.getElementById("card-reseñas-navegacion");

    // Detectar error típico de índice faltante (Firestore)
    if (error.message && error.message.includes("index")) {
      // Extraer URL si está en el mensaje de error (Firebase usualmente provee un link)
      const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com\/[^\s)]+/);
      const urlIndice = urlMatch ? urlMatch[0] : null;
      
      contenedor.innerHTML = `
        <p>Error al cargar reseñas debido a índice faltante.</p>
        <p>Para solucionarlo, crea el índice en Firestore haciendo clic en el siguiente enlace:</p>
        ${
          urlIndice
            ? `<p><a href="${urlIndice}" target="_blank" rel="noopener noreferrer">${urlIndice}</a></p>`
            : `<p><em>No se pudo obtener el enlace automático. Por favor crea el índice manualmente en Firebase Console.</em></p>`
        }
      `;
    } else {
      // Mensaje genérico para otros errores
      contenedor.innerHTML = `<p>Error al cargar reseñas: ${error.message || error}</p>`;
    }
  }
}