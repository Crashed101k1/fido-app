import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { getPetIconInfo } from '../utils/petIcons';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { db } from '../../firebaseConfig';

// --- MODALES COMO COMPONENTES EXTERNOS ---
const TimeModal = ({ visible, onCancel, onAdd, newTimeHour, setNewTimeHour, newTimeMinutes, setNewTimeMinutes, newTimePeriod, setNewTimePeriod, currentPet }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Agregar Nuevo Horario para {currentPet?.name || ''}</Text>
        <View style={styles.timePickerContainer}>
          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>Hora</Text>
            <Picker
              selectedValue={newTimeHour}
              style={styles.timePicker}
              onValueChange={setNewTimeHour}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                <Picker.Item key={hour} label={hour.toString()} value={hour.toString()} />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>Minutos</Text>
            <Picker
              selectedValue={newTimeMinutes}
              style={styles.timePicker}
              onValueChange={setNewTimeMinutes}
            >
              {Array.from({ length: 12 }, (_, i) => i * 5).map(minutes => (
                <Picker.Item 
                  key={minutes} 
                  label={minutes.toString().padStart(2, '0')} 
                  value={minutes.toString()} 
                />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>Período</Text>
            <Picker
              selectedValue={newTimePeriod}
              style={styles.timePicker}
              onValueChange={setNewTimePeriod}
            >
              <Picker.Item label="AM" value="am" />
              <Picker.Item label="PM" value="pm" />
            </Picker>
          </View>
        </View>
        <View style={styles.modalButtons}>
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]} 
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalButton, styles.addButton]} onPress={onAdd}>
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const PortionModal = ({ visible, onCancel, onAdd, newPortion, setNewPortion, currentPet }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Agregar Nueva Porción para {currentPet?.name || ''}</Text>
        <TextInput
          style={styles.portionInput}
          placeholder="Ej: 150"
          value={newPortion}
          onChangeText={setNewPortion}
          keyboardType="numeric"
        />
        <Text style={styles.inputHint}>Cantidad en gramos</Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]} 
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalButton, styles.addButton]} onPress={onAdd}>
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const AppModal = ({ visible, modalType, modalTitle, modalMessage, modalActions }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={modalStyles.overlay}>
      <View style={modalStyles.content}>
        <Ionicons
          name={modalType === 'error' ? 'alert-circle' : modalType === 'confirm' ? 'help-circle' : 'information-circle'}
          size={40}
          color={modalType === 'error' ? '#F44336' : modalType === 'confirm' ? '#FF9800' : '#4CAF50'}
          style={{ alignSelf: 'center', marginBottom: 10 }}
        />
        <Text style={modalStyles.title}>{modalTitle}</Text>
        <Text style={modalStyles.message}>{modalMessage}</Text>
        <View style={modalStyles.actions}>
          {modalActions.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                modalStyles.button,
                action.style === 'destructive' && modalStyles.destructiveButton,
                action.style === 'cancel' && modalStyles.cancelButton
              ]}
              onPress={action.onPress}
            >
              <Text style={[
                modalStyles.buttonText,
                action.style === 'destructive' && modalStyles.destructiveButtonText,
                action.style === 'cancel' && modalStyles.cancelButtonText
              ]}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  </Modal>
);
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { where } from 'firebase/firestore';
import { useDispenserDiscovery } from '../hooks/useDispenserDiscovery';

// --- ESTILOS ANTES DE LA FUNCIÓN PRINCIPAL ---
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    minWidth: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    marginVertical: 16,
    textAlign: 'center',
    color: '#333',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginHorizontal: 8,
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  destructiveButton: {
    backgroundColor: '#F44336',
  },
  destructiveButtonText: {
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#333',
  },
});

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#E0D5F7' 
  },
  scrollContainer: { 
    flex: 1 
  },
  scrollContent: { 
    flexGrow: 1, 
    paddingBottom: 100 
  },
  mainContent: { 
    padding: 20 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: '#000'
  },
  // ...resto de estilos igual...
  petSelectorContainer: {
    marginBottom: 25,
  },
  petSelectorScroll: {
    marginTop: 10,
  },
  petSelectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  petSelectorCardActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  petSelectorName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 5,
    textAlign: 'center',
  },
  petSelectorNameActive: {
    color: '#FFFFFF',
  },
  dispenserIndicator: {
    marginTop: 3,
  },
  currentPetInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  currentPetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPetDetails: {
    flex: 1,
    marginLeft: 15,
  },
  currentPetName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  currentPetSpecies: {
    fontSize: 14,
    color: '#666',
  },
  dispenserStatus: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 5,
  },
  dispenserStatusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  sectionsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  section: { 
    flex: 1, 
    marginHorizontal: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#000',
  },
  addIconButton: {
    padding: 5,
  },
  timeItem: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  timeTextDisabled: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  portionItem: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  portionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  portionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  portionTextSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 10,
    marginRight: 5,
  },
  emptyState: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  modalContent: { 
    backgroundColor: '#FFFFFF', 
    padding: 25, 
    borderRadius: 15,
    width: '100%',
    maxWidth: 400,
    minHeight: 200,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  timePickerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  pickerSection: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  timePicker: { 
    width: '100%',
  },
  portionInput: { 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  addButton: { 
    backgroundColor: '#4CAF50',
  },
  addButtonText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

import { useFocusEffect } from '@react-navigation/native';


const EatTimeScreen = forwardRef(({ navigation, route }, ref) => {
  const { currentUser } = useAuth();
  const { mqttConnected, syncSchedulesToDispenser, sendDispenseCommand } = useDispenserDiscovery();
  const [pets, setPets] = useState([]);
  // Permitir selección inicial y sincronización de mascota vía parámetro (índice o ID)
  const [selectedPetIndex, setSelectedPetIndex] = useState(() => {
    if (route?.params?.selectedPetId) return 0;
    return route?.params?.selectedPetIndex ?? 0;
  });

  // Sincronizar selectedPetIndex si cambia el parámetro de navegación (índice o ID)
  useEffect(() => {
    // Si se pasa selectedPetIndex, priorizarlo
    if (typeof route?.params?.selectedPetIndex === 'number' && route.params.selectedPetIndex !== selectedPetIndex) {
      setSelectedPetIndex(route.params.selectedPetIndex);
      return;
    }
    // Si se pasa selectedPetId, buscar el índice correspondiente
    if (route?.params?.selectedPetId && pets.length > 0) {
      const idx = pets.findIndex(p => p.id === route.params.selectedPetId);
      if (idx !== -1 && idx !== selectedPetIndex) {
        setSelectedPetIndex(idx);
      }
    }
  }, [route?.params?.selectedPetIndex, route?.params?.selectedPetId, pets]);
  // Estados sincronizados con Firestore
  const [feedingTimes, setFeedingTimes] = useState([]);
  const [portions, setPortions] = useState([]);
  // Estados locales editables
  const [localFeedingTimes, setLocalFeedingTimes] = useState([]);
  const [localPortions, setLocalPortions] = useState([]);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [newTimeHour, setNewTimeHour] = useState('1');
  const [newTimeMinutes, setNewTimeMinutes] = useState('0');
  const [newTimePeriod, setNewTimePeriod] = useState('pm');
  const [newPortion, setNewPortion] = useState('');

  // Estado para modal de avisos/errores/confirmaciones
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('info'); // 'info', 'error', 'confirm'
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalActions, setModalActions] = useState([]); // [{text, onPress, style}]

  // Estado para advertencia de cambios no guardados
  const [pendingPetIndex, setPendingPetIndex] = useState(null);

  // Estado para advertencia al salir de la pantalla
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const currentPet = pets[selectedPetIndex];
  // Sincronizar mascotas del usuario
  useEffect(() => {
    if (!currentUser) {
      console.log('Usuario no autenticado, omitiendo sincronización de mascotas');
      return;
    }
    
    try {
      const petsRef = collection(db, 'pets');
      const q = query(petsRef, where('userId', '==', currentUser.uid));
      const unsub = onSnapshot(q, (snap) => {
        setPets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.log('Error en snapshot de mascotas:', error.message);
        // No mostrar error al usuario si no está autenticado
        if (error.code !== 'permission-denied') {
          console.error('Error de Firestore:', error);
        }
      });
      return () => unsub();
    } catch (error) {
      console.log('Error configurando listener de mascotas:', error.message);
    }
  }, [currentUser]);

  // Sincronizar subcolecciones de la mascota seleccionada
  useEffect(() => {
    if (!currentPet || !currentUser) {
      setFeedingTimes([]);
      setPortions([]);
      setLocalFeedingTimes([]);
      setLocalPortions([]);
      return;
    }
    
    try {
      const feedingRef = collection(db, 'pets', currentPet.id, 'feedingTimes');
      const portionsRef = collection(db, 'pets', currentPet.id, 'portions');
      
      const unsub1 = onSnapshot(query(feedingRef, orderBy('timeOrder', 'asc')), (snap) => {
        let times = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFeedingTimes(times);
        setLocalFeedingTimes(times);
      }, (error) => {
        console.log('Error en snapshot de horarios:', error.message);
        if (error.code !== 'permission-denied') {
          console.error('Error de Firestore en horarios:', error);
        }
      });
      
      const unsub2 = onSnapshot(portionsRef, (snap) => {
        const pors = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPortions(pors);
        setLocalPortions(pors);
      }, (error) => {
        console.log('Error en snapshot de porciones:', error.message);
        if (error.code !== 'permission-denied') {
          console.error('Error de Firestore en porciones:', error);
        }
      });
      
      return () => { unsub1(); unsub2(); };
    } catch (error) {
      console.log('Error configurando listeners de subcolecciones:', error.message);
    }
  }, [currentPet, currentUser]);


  // CRUD LOCAL
  const toggleFeedingTime = (timeId, enabled) => {
    setLocalFeedingTimes(times => times.map(t => t.id === timeId ? { ...t, enabled: !enabled } : t));
  };

  const selectPortion = (portionId) => {
    setLocalPortions(portions => portions.map(p => ({ ...p, selected: p.id === portionId })));
  };

  const addNewTime = () => {
    if (!newTimeHour) return;
    setLocalFeedingTimes(times => ([
      ...times,
      {
        id: `local-${Date.now()}`,
        hour: newTimeHour,
        minutes: newTimeMinutes,
        period: newTimePeriod,
        enabled: true,
        local: true,
        timeOrder: calculateTimeOrder(newTimeHour, newTimeMinutes, newTimePeriod)
      }
    ]));
    setShowTimeModal(false);
    setNewTimeHour('1');
    setNewTimeMinutes('0');
    setNewTimePeriod('pm');
  };

  const addNewPortion = () => {
    if (!newPortion || isNaN(newPortion)) {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Por favor ingrese una cantidad válida');
      setModalActions([
        { text: 'OK', onPress: () => setModalVisible(false), style: 'default' }
      ]);
      setModalVisible(true);
      return;
    }
    setLocalPortions(portions => ([
      ...portions,
      { id: `local-${Date.now()}`, amount: `${newPortion} grs`, selected: false, local: true }
    ]));
    setShowPortionModal(false);
    setNewPortion('');
  };

  const deleteFeedingTime = (timeId) => {
    setModalType('confirm');
    setModalTitle('Eliminar Horario');
    setModalMessage('¿Estás seguro de que quieres eliminar este horario?');
    setModalActions([
      { text: 'Cancelar', onPress: () => setModalVisible(false), style: 'cancel' },
      {
        text: 'Eliminar',
        onPress: () => {
          setLocalFeedingTimes(times => times.filter(t => t.id !== timeId));
          setModalVisible(false);
        },
        style: 'destructive'
      }
    ]);
    setModalVisible(true);
  };

  const deletePortion = (portionId) => {
    setModalType('confirm');
    setModalTitle('Eliminar Porción');
    setModalMessage('¿Estás seguro de que quieres eliminar esta porción?');
    setModalActions([
      { text: 'Cancelar', onPress: () => setModalVisible(false), style: 'cancel' },
      {
        text: 'Eliminar',
        onPress: () => {
          setLocalPortions(portions => portions.filter(p => p.id !== portionId));
          setModalVisible(false);
        },
        style: 'destructive'
      }
    ]);
    setModalVisible(true);
  };

  // GUARDAR EN FIRESTORE AL PRESIONAR BOTÓN
  const calculateTimeOrder = (hour, minutes, period) => {
    let hourNum = parseInt(hour);
    const minutesNum = parseInt(minutes || '0');
    if (period === 'pm' && hourNum !== 12) hourNum += 12;
    if (period === 'am' && hourNum === 12) hourNum = 0;
    return hourNum * 60 + minutesNum;
  };

  const saveConfig = async () => {
    if (!currentPet) return;
    // Guardar horarios
    // 1. Eliminar los que ya no existen
    const toDeleteTimes = feedingTimes.filter(t => !localFeedingTimes.some(lt => lt.id === t.id));
    for (const t of toDeleteTimes) {
      await deleteDoc(doc(db, 'pets', currentPet.id, 'feedingTimes', t.id));
    }
    // 2. Crear nuevos
    const toAddTimes = localFeedingTimes.filter(lt => lt.local);
    for (const t of toAddTimes) {
      await addDoc(collection(db, 'pets', currentPet.id, 'feedingTimes'), {
        hour: t.hour,
        minutes: t.minutes || '0',
        period: t.period,
        enabled: t.enabled,
        timeOrder: calculateTimeOrder(t.hour, t.minutes || '0', t.period)
      });
    }
    // 3. Actualizar existentes
    const toUpdateTimes = localFeedingTimes.filter(lt => !lt.local);
    for (const t of toUpdateTimes) {
      await updateDoc(doc(db, 'pets', currentPet.id, 'feedingTimes', t.id), {
        hour: t.hour,
        minutes: t.minutes || '0',
        period: t.period,
        enabled: t.enabled,
        timeOrder: calculateTimeOrder(t.hour, t.minutes || '0', t.period)
      });
    }

    // Guardar porciones
    // 1. Eliminar las que ya no existen
    const toDeletePortions = portions.filter(p => !localPortions.some(lp => lp.id === p.id));
    for (const p of toDeletePortions) {
      await deleteDoc(doc(db, 'pets', currentPet.id, 'portions', p.id));
    }
    // 2. Crear nuevas
    const toAddPortions = localPortions.filter(lp => lp.local);
    for (const p of toAddPortions) {
      await addDoc(collection(db, 'pets', currentPet.id, 'portions'), {
        amount: p.amount,
        selected: p.selected
      });
    }
    // 3. Actualizar existentes
    const toUpdatePortions = localPortions.filter(lp => !lp.local);
    for (const p of toUpdatePortions) {
      await updateDoc(doc(db, 'pets', currentPet.id, 'portions', p.id), {
        amount: p.amount,
        selected: p.selected
      });
    }

    setModalType('info');
    setModalTitle('Configuración Guardada');
    setModalMessage(`La configuración de alimentación para ${currentPet?.name || ''} ha sido guardada exitosamente.`);
    setModalActions([
      { text: 'OK', onPress: () => setModalVisible(false), style: 'default' }
    ]);
    setModalVisible(true);

    // Sincronizar arrays locales después del guardado
    // Remover la propiedad 'local' de los elementos guardados
    setLocalFeedingTimes(times => times.map(t => {
      const { local, ...rest } = t;
      return rest;
    }));
    setLocalPortions(portions => portions.map(p => {
      const { local, ...rest } = p;
      return rest;
    }));
  };

  // Función para sincronizar horarios con el dispensador
  const syncWithDispenser = async () => {
    if (!currentPet || !currentPet.dispenserId) {
      setModalType('error');
      setModalTitle('Sin Dispensador');
      setModalMessage(`${currentPet?.name || 'Esta mascota'} no tiene un dispensador asignado.`);
      setModalActions([
        { text: 'OK', onPress: () => setModalVisible(false), style: 'default' }
      ]);
      setModalVisible(true);
      return;
    }

    try {
      // Obtener horarios habilitados y porción seleccionada
      const enabledTimes = localFeedingTimes.filter(t => t.enabled);
      const selectedPortion = localPortions.find(p => p.selected);
      if (enabledTimes.length === 0) {
        setModalType('error');
        setModalTitle('Sin Horarios');
        setModalMessage('No hay horarios habilitados para sincronizar.');
        setModalActions([
          { text: 'OK', onPress: () => setModalVisible(false), style: 'default' }
        ]);
        setModalVisible(true);
        return;
      }
      if (!selectedPortion) {
        setModalType('error');
        setModalTitle('Sin Porción');
        setModalMessage('No hay una porción seleccionada.');
        setModalActions([
          { text: 'OK', onPress: () => setModalVisible(false), style: 'default' }
        ]);
        setModalVisible(true);
        return;
      }
      // Convertir horarios al formato del ESP32
      const schedulesToSync = enabledTimes.map(time => {
        let hour = parseInt(time.hour);
        const minute = parseInt(time.minutes || '0');
        if (time.period === 'pm' && hour !== 12) hour += 12;
        if (time.period === 'am' && hour === 12) hour = 0;
        return {
          hour: hour,
          minute: minute,
          portion: parseFloat(selectedPortion.amount),
          active: true
        };
      });
      console.log('[SYNC] Intentando sincronizar horarios:', schedulesToSync);
      // Enviar al dispensador
      await syncSchedulesToDispenser(currentPet.dispenserId, schedulesToSync);
      console.log('[SYNC] Sincronización exitosa con el dispensador:', currentPet.dispenserId);
      setModalType('info');
      setModalTitle('Sincronización Exitosa');
      setModalMessage(`Los horarios de ${currentPet.name} han sido sincronizados con el dispensador.`);
      setModalActions([
        { text: 'OK', onPress: () => setModalVisible(false), style: 'default' }
      ]);
      setModalVisible(true);
    } catch (error) {
      console.error('[SYNC] Error en la sincronización:', error);
      setModalType('error');
      setModalTitle('Error de Sincronización');
      setModalMessage(`Error: ${error.message}`);
      setModalActions([
        { text: 'OK', onPress: () => setModalVisible(false), style: 'default' }
      ]);
      setModalVisible(true);
    }
  };

  // Función para detectar cambios no guardados
  const hasUnsavedChanges = () => {
    // Función para comparar arrays de horarios
    const arrEqTimes = (a, b) => {
      // Filtrar elementos locales de 'a' (localFeedingTimes)
      const aFiltered = a.filter(item => !item.local);
      
      if (aFiltered.length !== b.length) return false;
      
      // Ordenar por timeOrder para comparación consistente
      const aSorted = aFiltered.sort((x, y) => (x.timeOrder || 0) - (y.timeOrder || 0));
      const bSorted = b.sort((x, y) => (x.timeOrder || 0) - (y.timeOrder || 0));
      
      for (let i = 0; i < aSorted.length; i++) {
        if (
          aSorted[i].hour !== bSorted[i].hour ||
          (aSorted[i].minutes || '0') !== (bSorted[i].minutes || '0') ||
          aSorted[i].period !== bSorted[i].period ||
          aSorted[i].enabled !== bSorted[i].enabled
        ) return false;
      }
      return true;
    };

    // Función para comparar arrays de porciones
    const arrEqPortions = (a, b) => {
      // Filtrar elementos locales de 'a' (localPortions)
      const aFiltered = a.filter(item => !item.local);
      
      if (aFiltered.length !== b.length) return false;
      
      // Ordenar por amount para comparación consistente
      const aSorted = aFiltered.sort((x, y) => parseInt(x.amount) - parseInt(y.amount));
      const bSorted = b.sort((x, y) => parseInt(x.amount) - parseInt(y.amount));
      
      for (let i = 0; i < aSorted.length; i++) {
        if (
          aSorted[i].amount !== bSorted[i].amount ||
          aSorted[i].selected !== bSorted[i].selected
        ) return false;
      }
      return true;
    };

    return !arrEqTimes(feedingTimes, localFeedingTimes) || !arrEqPortions(portions, localPortions);
  };

  // Función para mostrar modal de cambios no guardados
  const showUnsavedModal = (onConfirm) => {
    setModalType('confirm');
    setModalTitle('Cambios no guardados');
    setModalMessage('¿Está seguro que desea abandonar? Los cambios no se guardarán.');
    setModalActions([
      { text: 'Cancelar', onPress: () => { setModalVisible(false); setPendingPetIndex(null); }, style: 'cancel' },
      { text: 'Abandonar', onPress: () => {
          setModalVisible(false);
          setPendingPetIndex(null);
          if (onConfirm) onConfirm();
        }, style: 'destructive' }
    ]);
    setModalVisible(true);
  };

  // Handler para cambio de mascota
  const handlePetSelect = (index) => {
    if (index === selectedPetIndex) return;
    if (hasUnsavedChanges()) {
      setPendingPetIndex(index);
      showUnsavedModal(() => setSelectedPetIndex(index));
    } else {
      setSelectedPetIndex(index);
    }
  };

  // Exponer métodos para navegación de tabs
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges,
    showUnsavedModal: (onConfirm) => {
      setModalType('confirm');
      setModalTitle('Cambios no guardados');
      setModalMessage('¿Está seguro que desea abandonar? Los cambios no se guardarán.');
      setModalActions([
        { text: 'Cancelar', onPress: () => { setModalVisible(false); setPendingPetIndex(null); }, style: 'cancel' },
        { text: 'Abandonar', onPress: () => {
            setModalVisible(false);
            setPendingPetIndex(null);
            if (onConfirm) onConfirm();
          }, style: 'destructive' }
      ]);
      setModalVisible(true);
    }
  }));

  // Bloquear navegación si hay cambios no guardados (solo para back stack)
  useFocusEffect(
    React.useCallback(() => {
      const beforeRemoveListener = (e) => {
        if (!hasUnsavedChanges()) return;
        e.preventDefault();
        setPendingNavigation(e.data.action);
        setModalType('confirm');
        setModalTitle('Cambios no guardados');
        setModalMessage('¿Está seguro que desea abandonar? Los cambios no se guardarán.');
        setModalActions([
          { text: 'Cancelar', onPress: () => { setModalVisible(false); setPendingNavigation(null); }, style: 'cancel' },
          { text: 'Abandonar', onPress: () => {
              setModalVisible(false);
              setPendingNavigation(null);
              navigation.dispatch(e.data.action);
            }, style: 'destructive' }
        ]);
        setModalVisible(true);
      };
      navigation.addListener('beforeRemove', beforeRemoveListener);
      return () => navigation.removeListener('beforeRemove', beforeRemoveListener);
    }, [navigation, hasUnsavedChanges, localFeedingTimes, localPortions, feedingTimes, portions])
  );

  const [lastDispensed, setLastDispensed] = useState(null);
  const [dispensedToday, setDispensedToday] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      if (!currentPet || !currentPet.dispenserId) return;
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const todayKey = `${year}-${month}-${day}`;
      // Buscar horario habilitado que coincida con la hora actual
      const enabledTimes = localFeedingTimes.filter(t => t.enabled);
      const selectedPortion = localPortions.find(p => p.selected);
      if (!selectedPortion) return;
      enabledTimes.forEach(time => {
        let horario24 = parseInt(time.hour);
        if (time.period === 'pm' && horario24 !== 12) horario24 += 12;
        if (time.period === 'am' && horario24 === 12) horario24 = 0;
        const minutos = parseInt(time.minutes || '0');
        const horarioId = `${todayKey}_${horario24}:${minutos}`;
        // Validar si ya se dispensó este horario hoy
        if (hour === horario24 && minute === minutos && !dispensedToday[horarioId]) {
          sendDispenseCommand(currentPet.dispenserId, parseFloat(selectedPortion.amount))
            .then(() => {
              setDispensedToday(prev => ({ ...prev, [horarioId]: true }));
              console.log(`[DISPENSE] Alimento dispensado para horario ${horarioId}`);
            })
            .catch(err => {
              console.error('[DISPENSE] Error:', err.message);
            });
        }
      });
    }, 60000); // cada minuto
    return () => clearInterval(interval);
  }, [localFeedingTimes, localPortions, currentPet, dispensedToday]);

  return (
  <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <Text style={styles.title}>Hora de Comer</Text>
          {/* Selector de Mascotas */}
          <View style={styles.petSelectorContainer}>
            <Text style={styles.sectionTitle}>Seleccionar Mascota</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.petSelectorScroll}
            >
              {pets.map((pet, index) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petSelectorCard,
                    selectedPetIndex === index && styles.petSelectorCardActive
                  ]}
                  onPress={() => handlePetSelect(index)}
                >
                  <Ionicons
                    name={getPetIconInfo(pet.species, selectedPetIndex === index).name}
                    size={24}
                    color={getPetIconInfo(pet.species, selectedPetIndex === index).color}
                  />
                  <Text style={[
                    styles.petSelectorName,
                    selectedPetIndex === index && styles.petSelectorNameActive
                  ]}>
                    {pet.name}
                  </Text>
                  {pet.dispenserId && (
                    <View style={styles.dispenserIndicator}>
                      <Ionicons name="hardware-chip" size={12} color={selectedPetIndex === index ? '#FFFFFF' : '#666'} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Información de la mascota actual */}
          {currentPet && (
            <View style={styles.currentPetInfo}>
              <View style={styles.currentPetHeader}>
                <Ionicons
                  name={getPetIconInfo(currentPet.species).name}
                  size={30}
                  color={getPetIconInfo(currentPet.species).speciesColor}
                />
                <View style={styles.currentPetDetails}>
                  <Text style={styles.currentPetName}>{currentPet.name}</Text>
                  <Text style={styles.currentPetSpecies}>{currentPet.species}</Text>
                </View>
                <View style={styles.dispenserStatus}>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: currentPet.dispenserId ? '#4CAF50' : '#E0E0E0' }
                  ]} />
                  <Text style={styles.dispenserStatusText}>
                    {currentPet.dispenserId ? 'Conectado' : 'Sin Dispensador'}
                  </Text>
                </View>
              </View>
            </View>
          )}
          <View style={styles.sectionsContainer}>
            {/* Sección de Horarios */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Horarios de Alimentación</Text>
                <TouchableOpacity 
                  style={styles.addIconButton} 
                  onPress={() => setShowTimeModal(true)}
                >
                  <Ionicons name="add-circle" size={24} color="#4CAF50" />
                </TouchableOpacity>
              </View>
              {localFeedingTimes.map((time) => (
                <View key={time.id} style={styles.timeItem}>
                  <TouchableOpacity 
                    style={styles.timeContent}
                    onPress={() => toggleFeedingTime(time.id, time.enabled)}
                  >
                    <Text style={[styles.timeText, !time.enabled && styles.timeTextDisabled]}>
                      {time.hour}:{(time.minutes || '0').padStart(2, '0')} {time.period ? time.period.toUpperCase() : 'AM'}
                    </Text>
                    <Ionicons
                      name={time.enabled ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={time.enabled ? '#4CAF50' : '#CCC'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteFeedingTime(time.id)}
                  >
                    <Ionicons name="trash" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}
              {localFeedingTimes.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No hay horarios configurados</Text>
                </View>
              )}
            </View>
            {/* Sección de Porciones */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Porciones</Text>
                <TouchableOpacity 
                  style={styles.addIconButton} 
                  onPress={() => setShowPortionModal(true)}
                >
                  <Ionicons name="add-circle" size={24} color="#4CAF50" />
                </TouchableOpacity>
              </View>
              {localPortions.map((portion) => (
                <View key={portion.id} style={styles.portionItem}>
                  <TouchableOpacity 
                    style={styles.portionContent}
                    onPress={() => selectPortion(portion.id)}
                  >
                    <Text style={[
                      styles.portionText,
                      portion.selected && styles.portionTextSelected
                    ]}>
                      {portion.amount}
                    </Text>
                    <Ionicons
                      name={portion.selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={portion.selected ? '#4CAF50' : '#CCC'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deletePortion(portion.id)}
                  >
                    <Ionicons name="trash" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}
              {localPortions.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No hay porciones configuradas</Text>
                </View>
              )}
            </View>
          </View>
          {/* Botón de guardar configuración */}
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveConfig}
          >
            <Ionicons name="save" size={20} color="#FFFFFF" style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>Guardar Configuración</Text>
          </TouchableOpacity>
          
          {/* Botón de sincronizar con dispensador */}
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: '#2196F3', marginTop: 10 }]}
            onPress={syncWithDispenser}
          >
            <Ionicons name="sync" size={20} color="#FFFFFF" style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>Sincronizar con Dispensador</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <TimeModal
        visible={showTimeModal}
        onCancel={() => setShowTimeModal(false)}
        onAdd={addNewTime}
        newTimeHour={newTimeHour}
        setNewTimeHour={setNewTimeHour}
        newTimeMinutes={newTimeMinutes}
        setNewTimeMinutes={setNewTimeMinutes}
        newTimePeriod={newTimePeriod}
        setNewTimePeriod={setNewTimePeriod}
        currentPet={currentPet}
      />
      <PortionModal
        visible={showPortionModal}
        onCancel={() => setShowPortionModal(false)}
        onAdd={addNewPortion}
        newPortion={newPortion}
        setNewPortion={setNewPortion}
        currentPet={currentPet}
      />
      <AppModal
        visible={modalVisible}
        modalType={modalType}
        modalTitle={modalTitle}
        modalMessage={modalMessage}
        modalActions={modalActions}
      />
    </View>
  );
});
export default EatTimeScreen;