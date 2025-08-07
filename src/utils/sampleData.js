import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/**
 * Utilidades para crear datos de prueba de alimentación
 */

/**
 * Crea horarios de alimentación de ejemplo para una mascota
 * @param {string} petId - ID de la mascota
 */
export async function createSampleFeedingTimes(petId) {
  try {
    const feedingTimes = [
      { hour: '8', period: 'am', enabled: true },
      { hour: '2', period: 'pm', enabled: true },
      { hour: '7', period: 'pm', enabled: true }
    ];

    for (const time of feedingTimes) {
      await addDoc(collection(db, 'pets', petId, 'feedingTimes'), {
        ...time,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('Horarios de alimentación de ejemplo creados');
  } catch (error) {
    console.error('Error al crear horarios de ejemplo:', error);
  }
}

/**
 * Crea porciones de ejemplo para una mascota
 * @param {string} petId - ID de la mascota
 */
export async function createSamplePortions(petId) {
  try {
    const portions = [
      { amount: 'pequeña', selected: false },
      { amount: 'mediana', selected: true },
      { amount: 'grande', selected: false }
    ];

    for (const portion of portions) {
      await addDoc(collection(db, 'pets', petId, 'portions'), {
        ...portion,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('Porciones de ejemplo creadas');
  } catch (error) {
    console.error('Error al crear porciones de ejemplo:', error);
  }
}

/**
 * Crea historial de alimentación de prueba para hoy
 * @param {string} petId - ID de la mascota
 */
export async function createSampleFeedingHistory(petId) {
  try {
    const now = new Date();
    
    // Crear algunos registros de alimentación recientes
    const feedingRecords = [];
    
    // Si es después de las 8:00, crear registro de la mañana
    if (now.getHours() >= 8) {
      const morningFeed = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
      feedingRecords.push({
        type: 'automatic',
        amount: 1,
        timestamp: morningFeed,
        dispenserId: 'DISP-001'
      });
    }
    
    // Si es después de las 14:00, crear registro del mediodía
    if (now.getHours() >= 14) {
      const noonFeed = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
      feedingRecords.push({
        type: 'automatic',
        amount: 1,
        timestamp: noonFeed,
        dispenserId: 'DISP-001'
      });
    }
    
    // Si es después de las 19:00, crear registro de la noche
    if (now.getHours() >= 19) {
      const eveningFeed = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
      feedingRecords.push({
        type: 'automatic',
        amount: 1,
        timestamp: eveningFeed,
        dispenserId: 'DISP-001'
      });
    }
    
    // También crear un registro de ayer para tener histórico
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(19, 30, 0, 0);
    
    feedingRecords.push({
      type: 'automatic',
      amount: 1,
      timestamp: yesterday,
      dispenserId: 'DISP-001'
    });

    // Agregar todos los registros a Firestore
    for (const record of feedingRecords) {
      await addDoc(collection(db, 'pets', petId, 'feedingHistory'), {
        ...record,
        createdAt: serverTimestamp()
      });
    }

    console.log(`Historial de alimentación creado: ${feedingRecords.length} registros`);
  } catch (error) {
    console.error('Error al crear historial de ejemplo:', error);
    throw error;
  }
}

/**
 * Inicializa todos los datos de ejemplo para una mascota
 * @param {string} petId - ID de la mascota
 */
export async function initializeSamplePetData(petId) {
  try {
    await createSampleFeedingTimes(petId);
    await createSamplePortions(petId);
    await createSampleFeedingHistory(petId);
    
    console.log('Datos de ejemplo inicializados para la mascota:', petId);
  } catch (error) {
    console.error('Error al inicializar datos de ejemplo:', error);
  }
}
