/**
 * FIDO - Hook personalizado para manejo de datos de usuario
 * 
 * Este hook proporciona funciones utilitarias para trabajar con
 * los datos del usuario y sincronizarlos con Firestore.
 * 
 * @author Equipo Eridanus Systems
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/**
 * Hook para manejar datos del usuario en tiempo real
 * @param {string} userId - ID del usuario
 * @returns {Object} Objeto con datos del usuario y estado de carga
 */
export function useUserData(userId) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', userId);
    
    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
          setError(null);
        } else {
          setError('No se encontraron datos del usuario');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error obteniendo datos del usuario:', error);
        setError('Error al cargar datos del usuario');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { userData, loading, error };
}

/**
 * Función utilitaria para validar formato de teléfono
 * @param {string} phone - Número de teléfono a validar
 * @returns {boolean} True si el formato es válido
 */
export function validatePhoneNumber(phone) {
  if (!phone || phone.trim() === '') return true; // Teléfono es opcional
  return /^\+?[\d\s\-\(\)]+$/.test(phone);
}

/**
 * Función utilitaria para validar nombre completo
 * @param {string} name - Nombre a validar
 * @returns {boolean} True si el nombre es válido
 */
export function validateFullName(name) {
  if (!name || name.trim() === '') return false;
  const words = name.trim().split(' ');
  return words.length >= 2 && words.every(word => word.length > 0);
}

/**
 * Función utilitaria para formatear datos del usuario
 * @param {Object} userProfile - Datos del perfil desde Firestore
 * @param {Object} currentUser - Usuario actual de Firebase Auth
 * @returns {Object} Datos formateados del usuario
 */
export function formatUserData(userProfile, currentUser) {
  return {
    name: userProfile?.displayName || currentUser?.displayName || 'Usuario FIDO',
    email: userProfile?.email || currentUser?.email || '',
    phone: userProfile?.phone || '',
    createdAt: userProfile?.createdAt,
    updatedAt: userProfile?.updatedAt
  };
}
