/**
 * FIDO - Pantalla de Configuración de Horarios de Alimentación
 * 
 * Esta pantalla permite a los usuarios configurar horarios y porciones
 * de alimentación específicos para cada mascota del sistema.
 * 
 * Funcionalidades principales:
 * - Selector de mascotas con información individual
 * - Configuración de horarios de alimentación (hasta 3 por mascota)
 * - Configuración de tamaños de porción personalizados
 * - Habilitación/deshabilitación de horarios específicos
 * - Modales responsivos para edición de horarios y porciones
 * - Validación de entrada de datos
 * 
 * Características del diseño:
 * - Sistema multi-mascota con datos individuales
 * - Interfaz intuitiva con toggles para horarios
 * - Modales adaptativos para diferentes tamaños de pantalla
 * - Validación en tiempo real de configuraciones
 * 
 * Dependencias:
 * - React Native: Componentes básicos, modales, scroll
 * - Expo Vector Icons: Iconografía consistente
 * - React Native Picker: Selectores de tiempo y porción
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

/**
 * Componente principal de la pantalla de configuración de horarios
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.navigation - Objeto de navegación de React Navigation
 * @returns {JSX.Element} Componente de pantalla de horarios de alimentación
 */
export default function EatTimeScreen({ navigation }) {
  
  // ============ DATOS DE MASCOTAS ============
  
  /** 
   * Lista de mascotas con configuración individual de horarios y porciones
   * En una aplicación real, estos datos vendrían de un contexto global
   * o serían sincronizados con un backend
   */
  const [pets] = useState([
    { 
      id: 1, 
      name: 'Max', 
      species: 'Perro',
      dispenserId: 'DISP001',
      feedingTimes: [
        { id: 1, time: '8am', enabled: true },
        { id: 2, time: '12pm', enabled: true },
        { id: 3, time: '6pm', enabled: true },
      ],
      portions: [
        { id: 1, amount: '150 grs', selected: true },
        { id: 2, amount: '200 grs', selected: false },
        { id: 3, amount: '250 grs', selected: false },
      ]
    },
    { 
      id: 2, 
      name: 'Luna', 
      species: 'Gato',
      dispenserId: 'DISP002',
      feedingTimes: [
        { id: 1, time: '7am', enabled: true },
        { id: 2, time: '1pm', enabled: true },
        { id: 3, time: '7pm', enabled: false },
      ],
      portions: [
        { id: 1, amount: '75 grs', selected: false },
        { id: 2, amount: '100 grs', selected: true },
        { id: 3, amount: '125 grs', selected: false },
      ]
    },
    { 
      id: 3, 
      name: 'Bella', 
      species: 'Perro',
      dispenserId: null,
      feedingTimes: [
        { id: 1, time: '8am', enabled: true },
        { id: 2, time: '5pm', enabled: true },
      ],
      portions: [
        { id: 1, amount: '200 grs', selected: true },
        { id: 2, amount: '300 grs', selected: false },
      ]
    },
  ]);

  const [selectedPetIndex, setSelectedPetIndex] = useState(0);
  const [petsData, setPetsData] = useState(pets);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [newTimeHour, setNewTimeHour] = useState('1');
  const [newTimePeriod, setNewTimePeriod] = useState('pm');
  const [newPortion, setNewPortion] = useState('');

  const currentPet = petsData[selectedPetIndex];

  const toggleFeedingTime = (timeId) => {
    setPetsData(prev => 
      prev.map((pet, index) => 
        index === selectedPetIndex 
          ? {
              ...pet,
              feedingTimes: pet.feedingTimes.map(time =>
                time.id === timeId ? { ...time, enabled: !time.enabled } : time
              )
            }
          : pet
      )
    );
  };

  const selectPortion = (portionId) => {
    setPetsData(prev =>
      prev.map((pet, index) =>
        index === selectedPetIndex
          ? {
              ...pet,
              portions: pet.portions.map(portion =>
                portion.id === portionId
                  ? { ...portion, selected: true }
                  : { ...portion, selected: false }
              )
            }
          : pet
      )
    );
  };

  const addNewTime = () => {
    if (!newTimeHour) return;
    
    const timeString = `${newTimeHour}${newTimePeriod}`;
    const newTimeObj = { id: Date.now(), time: timeString, enabled: true };
    
    setPetsData(prev =>
      prev.map((pet, index) =>
        index === selectedPetIndex
          ? { ...pet, feedingTimes: [...pet.feedingTimes, newTimeObj] }
          : pet
      )
    );
    
    setShowTimeModal(false);
    setNewTimeHour('1');
    setNewTimePeriod('pm');
  };

  const addNewPortion = () => {
    if (!newPortion || isNaN(newPortion)) {
      Alert.alert('Error', 'Por favor ingrese una cantidad válida');
      return;
    }
    
    const newPortionObj = { id: Date.now(), amount: `${newPortion} grs`, selected: false };
    
    setPetsData(prev =>
      prev.map((pet, index) =>
        index === selectedPetIndex
          ? { ...pet, portions: [...pet.portions, newPortionObj] }
          : pet
      )
    );
    
    setShowPortionModal(false);
    setNewPortion('');
  };

  const deleteFeedingTime = (timeId) => {
    Alert.alert(
      'Eliminar Horario',
      '¿Estás seguro de que quieres eliminar este horario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setPetsData(prev =>
              prev.map((pet, index) =>
                index === selectedPetIndex
                  ? { ...pet, feedingTimes: pet.feedingTimes.filter(time => time.id !== timeId) }
                  : pet
              )
            );
          }
        }
      ]
    );
  };

  const deletePortion = (portionId) => {
    Alert.alert(
      'Eliminar Porción',
      '¿Estás seguro de que quieres eliminar esta porción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setPetsData(prev =>
              prev.map((pet, index) =>
                index === selectedPetIndex
                  ? { ...pet, portions: pet.portions.filter(portion => portion.id !== portionId) }
                  : pet
              )
            );
          }
        }
      ]
    );
  };

  const TimeModal = () => (
    <Modal visible={showTimeModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Agregar Nuevo Horario para {currentPet.name}</Text>
          <View style={styles.timePickerContainer}>
            <Picker
              selectedValue={newTimeHour}
              style={styles.timePicker}
              onValueChange={(value) => setNewTimeHour(value)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                <Picker.Item key={hour} label={hour.toString()} value={hour.toString()} />
              ))}
            </Picker>
            <Picker
              selectedValue={newTimePeriod}
              style={styles.timePicker}
              onValueChange={(value) => setNewTimePeriod(value)}
            >
              <Picker.Item label="AM" value="am" />
              <Picker.Item label="PM" value="pm" />
            </Picker>
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setShowTimeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.addButton]} onPress={addNewTime}>
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const PortionModal = () => (
    <Modal visible={showPortionModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Agregar Nueva Porción para {currentPet.name}</Text>
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
              onPress={() => setShowPortionModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.addButton]} onPress={addNewPortion}>
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
              {petsData.map((pet, index) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petSelectorCard,
                    selectedPetIndex === index && styles.petSelectorCardActive
                  ]}
                  onPress={() => setSelectedPetIndex(index)}
                >
                  <Ionicons
                    name={pet.species === 'Perro' ? 'paw' : 'fish'}
                    size={24}
                    color={selectedPetIndex === index ? '#FFFFFF' : '#4CAF50'}
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
          <View style={styles.currentPetInfo}>
            <View style={styles.currentPetHeader}>
              <Ionicons
                name={currentPet.species === 'Perro' ? 'paw' : 'fish'}
                size={30}
                color="#4CAF50"
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
              
              {currentPet.feedingTimes.map((time) => (
                <View key={time.id} style={styles.timeItem}>
                  <TouchableOpacity 
                    style={styles.timeContent}
                    onPress={() => toggleFeedingTime(time.id)}
                  >
                    <Text style={[
                      styles.timeText, 
                      !time.enabled && styles.timeTextDisabled
                    ]}>
                      {time.time}
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
              
              {currentPet.feedingTimes.length === 0 && (
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
              
              {currentPet.portions.map((portion) => (
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
              
              {currentPet.portions.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No hay porciones configuradas</Text>
                </View>
              )}
            </View>
          </View>

          {/* Botón de guardar configuración */}
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => {
              Alert.alert('Configuración Guardada', `La configuración de alimentación para ${currentPet.name} ha sido guardada exitosamente.`);
            }}
          >
            <Ionicons name="save" size={20} color="#FFFFFF" style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>Guardar Configuración</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <TimeModal />
      <PortionModal />
    </View>
  );
}

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

  // Selector de mascotas
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

  // Información de mascota actual
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

  // Secciones principales
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

  // Items de tiempo
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

  // Items de porción
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

  // Botón eliminar
  deleteButton: {
    padding: 10,
    marginRight: 5,
  },

  // Estados vacíos
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

  // Botón guardar
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

  // Modales
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
  timePicker: { 
    flex: 1,
    marginHorizontal: 5,
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