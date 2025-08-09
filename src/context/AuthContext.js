/**
 * FIDO - Contexto de Autenticación
 * 
 * Este contexto maneja el estado global de autenticación de la aplicación,
 * proporcionando funciones para registro, inicio de sesión y cierre de sesión
 * utilizando Firebase Authentication.
 * 
 * Funcionalidades principales:
 * - Registro de nuevos usuarios con email y contraseña
 * - Inicio de sesión con credenciales
 * - Cierre de sesión
 * - Monitoreo del estado de autenticación
 * - Actualización del perfil de usuario
 * 
 * @author Equipo Eridanus Systems
 * @version 1.0.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

// Crear el contexto de autenticación
const AuthContext = createContext();

/**
 * Hook personalizado para usar el contexto de autenticación
 * @returns {Object} Objeto con el usuario actual y funciones de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

/**
 * Proveedor del contexto de autenticación
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 * @returns {JSX.Element} Proveedor del contexto
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Función para crear documento del usuario en Firestore
   * @param {Object} user - Usuario de Firebase Auth
   * @param {string} displayName - Nombre del usuario
   * @returns {Promise} Promesa que resuelve cuando se crea el documento
   */
  async function createUserDocument(user, displayName) {
    const userRef = doc(db, 'users', user.uid);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      phone: '', // Campo vacío inicialmente
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(userRef, userData);
    return userData;
  }

  /**
   * Función para obtener datos del usuario desde Firestore
   * @param {string} uid - ID del usuario
   * @returns {Promise} Promesa que resuelve con los datos del usuario
   */
  async function getUserDocument(uid) {
    try {
      if (!uid) {
        console.log('AuthContext: UID no proporcionado');
        return null;
      }
      
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        console.log('AuthContext: Documento de usuario no existe');
        return null;
      }
    } catch (error) {
      console.log('AuthContext: Error obteniendo documento usuario:', error.message);
      // No mostrar error al usuario si es por permisos
      if (error.code === 'permission-denied') {
        console.log('AuthContext: Permisos insuficientes, usuario no autenticado');
      }
      return null;
    }
  }

  /**
   * Función para registrar un nuevo usuario
   * @param {string} email - Correo electrónico del usuario
   * @param {string} password - Contraseña del usuario
   * @param {string} displayName - Nombre a mostrar del usuario
   * @returns {Promise} Promesa que resuelve cuando el registro es exitoso
   */
  function signup(email, password, displayName) {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(async (result) => {
        // Actualizar el perfil en Firebase Auth
        await updateProfile(result.user, {
          displayName: displayName
        });
        
        // Crear documento del usuario en Firestore
        await createUserDocument(result.user, displayName);
        
        return result;
      });
  }

  /**
   * Función para iniciar sesión
   * @param {string} email - Correo electrónico del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise} Promesa que resuelve cuando el login es exitoso
   */
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  /**
   * Función para cerrar sesión
   * @returns {Promise} Promesa que resuelve cuando el logout es exitoso
   */
  function logout() {
    return signOut(auth);
  }

  /**
   * Función para actualizar el perfil del usuario en Firestore
   * @param {Object} updates - Objeto con las actualizaciones del perfil
   * @returns {Promise} Promesa que resuelve cuando la actualización es exitosa
   */
  async function updateUserProfile(updates) {
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updateData);
      return updateData;
    }
    return Promise.reject(new Error('No hay usuario autenticado'));
  }

  // Efecto para monitorear cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Obtener datos del usuario desde Firestore
        try {
          const userData = await getUserDocument(user.uid);
          setUserProfile(userData);
          
          // Si no existe el documento, crearlo
          if (!userData) {
            const newUserData = await createUserDocument(user, user.displayName || 'Usuario FIDO');
            setUserProfile(newUserData);
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    // Cleanup: desuscribirse del listener cuando el componente se desmonte
    return unsubscribe;
  }, []);

  // Efecto para escuchar cambios en tiempo real del perfil del usuario
  useEffect(() => {
    let unsubscribe = null;
    
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data());
        }
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  // Valor del contexto que se proporcionará a los componentes hijos
  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
