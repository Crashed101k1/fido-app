import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para gestionar mascotas en Firestore en tiempo real
 * @returns {Object} Estado y funciones para CRUD de mascotas
 */
export function usePets() {
  const { currentUser } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setPets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const petsRef = collection(db, 'pets');
    const q = query(petsRef, where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const petsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPets(petsData);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Agregar mascota
  const addPet = async (petData) => {
    if (!currentUser) throw new Error('No hay usuario autenticado');
    const newPet = {
      ...petData,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      dispenserId: null,
      dispenserName: 'Sin asignar',
    };
    await addDoc(collection(db, 'pets'), newPet);
  };

  // Editar mascota
  const updatePet = async (petId, updates) => {
    await updateDoc(doc(db, 'pets', petId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };

  // Eliminar mascota
  const deletePet = async (petId) => {
    await deleteDoc(doc(db, 'pets', petId));
  };

  return {
    pets,
    loading,
    error,
    addPet,
    updatePet,
    deletePet
  };
}
