import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/**
 * Hook personalizado para obtener datos de alimentación en tiempo real
 * @param {string} petId - ID de la mascota
 * @returns {Object} Datos de alimentación
 */
export function useFeedingData(petId) {
  const [feedingData, setFeedingData] = useState({
    lastFeed: null,
    nextFeed: null,
    todayProgress: { completed: 0, total: 0, percentage: 0 },
    feedingHistory: [],
    loading: true
  });

  useEffect(() => {
    if (!petId) {
      setFeedingData({
        lastFeed: null,
        nextFeed: null,
        todayProgress: { completed: 0, total: 0, percentage: 0 },
        feedingHistory: [],
        loading: false
      });
      return;
    }

    // 1. Obtener horarios de alimentación habilitados
    const feedingTimesRef = collection(db, 'pets', petId, 'feedingTimes');
    const feedingTimesQuery = query(feedingTimesRef);

    // 2. Obtener registros de alimentación de hoy (simplificado para evitar error de índice)
    const feedingRecordsRef = collection(db, 'feedingRecords');
    const todayRecordsQuery = query(
      feedingRecordsRef,
      where('petId', '==', petId),
      orderBy('timestamp', 'desc'),
      limit(10) // Limitar a los últimos 10 registros
    );

    let unsubFeedingTimes = null;
    let unsubTodayRecords = null;
    let feedingTimesData = [];
    let todayRecordsData = [];
    let updateTimer = null;

    // Función para actualizar el estado combinando horarios y registros
    const updateFeedingState = () => {
      // Filtrar solo los horarios habilitados
      const enabledFeedingTimes = feedingTimesData.filter(time => time.enabled === true);

      if (enabledFeedingTimes.length === 0) {
        setFeedingData({
          lastFeed: null,
          nextFeed: null,
          todayProgress: { completed: 0, total: 0, percentage: 0 },
          feedingHistory: todayRecordsData,
          loading: false,
          noSchedules: true
        });
        return;
      }

      // Procesar horarios de hoy
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      // Convertir horarios a minutos desde medianoche
      const scheduledTimes = enabledFeedingTimes.map(time => {
        let hour = parseInt(time.hour);
        const minutes = parseInt(time.minutes || '0');
        const period = time.period ? time.period : 'am';
        if (period === 'pm' && hour !== 12) hour += 12;
        if (period === 'am' && hour === 12) hour = 0;
        return {
          ...time,
          minutes: hour * 60 + minutes,
          hour24: hour,
          minutesValue: minutes,
          period,
          scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minutes, 0, 0)
        };
      }).sort((a, b) => a.minutes - b.minutes);

      // Para cada horario, buscar si hay registro en feedingRecords dentro de ±2 minutos
      const completedTimes = scheduledTimes.filter(sched => {
        return todayRecordsData.some(rec => {
          const recDate = rec.timestamp ? new Date(rec.timestamp) : null;
          if (!recDate) return false;
          const diff = Math.abs((recDate.getTime() - sched.scheduledDate.getTime()) / 60000); // minutos
          return diff <= 2;
        });
      });

      // Próxima comida: el primer horario habilitado que NO se ha cumplido
      let nextFeed = null;
      if (scheduledTimes.length > 0) {
        const nextPending = scheduledTimes.find(sched => {
          const isCompleted = completedTimes.some(c => c.id === sched.id);
          return !isCompleted;
        });
        
        if (nextPending) {
          nextFeed = {
            time: nextPending.scheduledDate,
            displayTime: `${nextPending.hour}:${(nextPending.minutesValue || 0).toString().padStart(2, '0')} ${(nextPending.period || 'am').toUpperCase()}`,
            isToday: true
          };
        } else {
          // Si todos están cumplidos, mostrar el primero del día
          const first = scheduledTimes[0];
          nextFeed = first
            ? {
                time: first.scheduledDate,
                displayTime: `${first.hour}:${(first.minutesValue || 0).toString().padStart(2, '0')} ${(first.period || 'am').toUpperCase()}`,
                isToday: true
              }
            : null;
        }
      }

      setFeedingData({
        lastFeed: null, // No se usa
        nextFeed,
        todayProgress: {
          completed: completedTimes.length,
          total: scheduledTimes.length,
          percentage: scheduledTimes.length > 0 ? Math.round((completedTimes.length / scheduledTimes.length) * 100) : 0
        },
        feedingHistory: todayRecordsData,
        loading: false,
        noSchedules: scheduledTimes.length === 0
      });

      // Sincronizar los campos hasFeedingTimes y hasPortions en el documento de la mascota
      const petDocRef = doc(db, 'pets', petId);
      updateDoc(petDocRef, { 
        hasFeedingTimes: scheduledTimes.length > 0,
        hasPortions: true // Asumimos que siempre hay porciones por defecto
      }).catch(() => {});
    };

    unsubFeedingTimes = onSnapshot(feedingTimesQuery, (snapshot) => {
      feedingTimesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateFeedingState();
    });

    unsubTodayRecords = onSnapshot(todayRecordsQuery, (snapshot) => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      todayRecordsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp : null
        };
      }).filter(record => {
        if (!record.timestamp) return false;
        const recordDate = new Date(record.timestamp);
        return recordDate >= startOfDay && recordDate < endOfDay;
      }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Más reciente primero
      
      updateFeedingState();
    });

    // Timer para actualizar el estado cada minuto (para horarios en tiempo real)
    updateTimer = setInterval(() => {
      updateFeedingState();
    }, 60000); // Actualizar cada minuto

    return () => {
      if (unsubFeedingTimes) unsubFeedingTimes();
      if (unsubTodayRecords) unsubTodayRecords();
      if (updateTimer) clearInterval(updateTimer);
    };
  }, [petId]);

  return feedingData;
}

function calculateNextFeed(feedingTimes) {
  if (!feedingTimes || feedingTimes.length === 0) {
    return null;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Convertir horarios a minutos desde medianoche
  const scheduledTimes = feedingTimes.map(time => {
    let hour = parseInt(time.hour);
    const minutes = parseInt(time.minutes || '0');
    // Si period no está definido, asumimos 'am' por defecto
    const period = time.period ? time.period : 'am';
    if (period === 'pm' && hour !== 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    return {
      ...time,
      minutes: hour * 60 + minutes,
      hour24: hour,
      minutesValue: minutes,
      period // aseguramos que siempre hay period
    };
  }).sort((a, b) => a.minutes - b.minutes);

  // Buscar el próximo horario hoy
  const nextToday = scheduledTimes.find(time => time.minutes > currentMinutes);
  
  if (nextToday) {
    const nextTime = new Date();
    nextTime.setHours(nextToday.hour24, nextToday.minutesValue, 0, 0);
    
    const result = {
      time: nextTime,
      displayTime: `${nextToday.hour}:${(nextToday.minutesValue || 0).toString().padStart(2, '0')} ${(nextToday.period || 'am').toUpperCase()}`,
      isToday: true
    };
    
    return result;
  }

  // Si no hay horarios hoy, tomar el primero de mañana
  if (scheduledTimes.length > 0) {
    const firstTomorrow = scheduledTimes[0];
    const nextTime = new Date();
    nextTime.setDate(nextTime.getDate() + 1);
    nextTime.setHours(firstTomorrow.hour24, firstTomorrow.minutesValue, 0, 0);

    const result = {
      time: nextTime,
      displayTime: `${firstTomorrow.hour}:${(firstTomorrow.minutesValue || 0).toString().padStart(2, '0')} ${(firstTomorrow.period || 'am').toUpperCase()}`,
      isToday: false
    };
    
    return result;
  }

  return null;
}

/**
 * Hook para datos del dispensador (simulado)
 * @param {string} dispenserId - ID del dispensador
 * @returns {Object} Datos del dispensador
 */
export function useDispenserData(dispenserId) {
  const [dispenserData, setDispenserData] = useState({
    foodLevel: 0,
    batteryLevel: 100,
    isOnline: false,
    lastSync: null,
    loading: true
  });

  useEffect(() => {
    if (!dispenserId) {
      setDispenserData({
        foodLevel: 0,
        batteryLevel: 100,
        isOnline: false,
        lastSync: null,
        loading: false
      });
      return;
    }

    // Simular datos iniciales realistas
    const initialFoodLevel = 60 + Math.floor(Math.random() * 30); // Entre 60-90%
    const initialBatteryLevel = 85 + Math.floor(Math.random() * 15); // Entre 85-100%

    // Establecer datos iniciales inmediatamente
    setDispenserData({
      foodLevel: initialFoodLevel,
      batteryLevel: initialBatteryLevel,
      isOnline: true,
      lastSync: new Date(),
      loading: false
    });

    // Simular actualizaciones periódicas del dispensador
    const interval = setInterval(() => {
      setDispenserData(prev => ({
        ...prev,
        foodLevel: Math.max(0, prev.foodLevel - Math.random() * 0.5), // Disminuir gradualmente pero más lento
        batteryLevel: Math.max(80, prev.batteryLevel - Math.random() * 0.05), // Disminuir muy lentamente
        isOnline: Math.random() > 0.02, // 98% probabilidad de estar online
        lastSync: new Date()
      }));
    }, 5000); // Actualizar cada 5 segundos para mejor tiempo real

    return () => clearInterval(interval);
  }, [dispenserId]);

  return dispenserData;
}
