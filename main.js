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
  measurementId: "G-ZW7YPM60FN"
};

// Inicializar Firebase y Analytics
console.log("📌 Inicializando Firebase...");
const app = initializeApp(firebaseConfig);

console.log("📌 Inicializando Analytics...");
const analytics = getAnalytics(app);

console.log("📌 Inicializando Firestore...");
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ DOM cargado. Iniciando carga del carrusel...");
  await cargarCarrusel();
});

async function cargarCarrusel() {
  const contenedor = document.getElementById("carrusel");
  
  // Mostrar spinner centrado
  contenedor.innerHTML = `<div class="spinner"></div>`;
  
  try {
    console.log("📡 Realizando consulta a Firestore con filtro y orden...");
    const q = query(
      collection(db, "catalogo"),
      where("seccion", "==", "banner_novedades"),
      orderBy("id", "asc")
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 Documentos obtenidos: ${snapshot.size}`);
    
    contenedor.innerHTML = ""; // Quitar el spinner
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`🖼 Procesando banner ID ${doc.id}:`, data);
      
      const card = document.createElement("div");
      card.classList.add("carrusel-card");
      
      const link = document.createElement("a");
      link.href = data.url;
      link.target = "_blank";
      link.addEventListener("click", () => {
        console.log(`📍 Clic en banner ID ${doc.id}, URL: ${data.url}`);
        logEvent(analytics, "click_banner", {
          banner_id: doc.id,
          url: data.url
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