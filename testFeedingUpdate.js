/**
 * Script de prueba para verificar actualizaciones en tiempo real
 * Añade un registro de alimentación para probar las cards
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Configuración de Firebase (temporal para testing)
const firebaseConfig = {
  apiKey: "AIzaSyBCL8-YRfY-1kwVjQOqFa1rKD08wCqTgqs",
  authDomain: "fido-pet-dispenser.firebaseapp.com",
  projectId: "fido-pet-dispenser",
  storageBucket: "fido-pet-dispenser.firebasestorage.app",
  messagingSenderId: "1095509013055",
  appId: "1:1095509013055:web:7c4fd06e9d87e8cbc0027e"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Añade un registro de alimentación de prueba
 * @param {string} petId - ID de la mascota
 */
async function addTestFeedingRecord(petId) {
  if (!petId) {
    console.error('Se requiere un petId');
    return;
  }

  try {
    const now = new Date();
    
    const docRef = await addDoc(collection(db, 'feedingRecords'), {
      petId: petId,
      timestamp: now.toISOString(),
      type: 'manual',
      source: 'dispenser',
      createdAt: now.toISOString(),
      amount: 50, // gramos
      scheduledTime: null
    });
    
    console.log('✅ Registro de alimentación añadido:', docRef.id);
    console.log('⏰ Tiempo:', now.toLocaleTimeString('es-ES'));
    console.log('🔄 Las cards deberían actualizarse automáticamente');
    
  } catch (error) {
    console.error('❌ Error al añadir registro:', error);
  }
}

// Para uso en consola del navegador
if (typeof window !== 'undefined') {
  window.addTestFeedingRecord = addTestFeedingRecord;
  console.log('🧪 Función de prueba disponible: addTestFeedingRecord("PET_ID")');
}

export { addTestFeedingRecord };
