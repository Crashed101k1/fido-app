/**
 * FIDO - Pantalla de Gestión de Mascotas
 * 
 * Esta pantalla permite al usuario gestionar toda la información relacionada
 * con sus mascotas y la configuración de dispensadores.
 * 
 * Funcionalidades principales:
 * - Carrusel de mascotas con navegación horizontal
 * - Edición de información de mascotas (CRUD completo)
 * - Asignación y configuración de dispensadores
 * - Configuración de nombres personalizados para dispensadores
 * - Agregar nuevas mascotas al sistema
 * - Eliminar mascotas existentes
 * 
 * Características técnicas:
 * - Modales responsivos para diferentes configuraciones
 * - Validación de datos de entrada
 * - Manejo de estado complejo con múltiples estados locales
 * - Integración con sistema de dispensadores
 * 
 * Dependencias:
 * - React Native: Componentes de UI, dimensiones, modales
 * - Expo Vector Icons: Iconografía
 * - React Native Picker: Selector de especies
 */

import React, { useState, useEffect } from "react";
import { useNotifications } from '../context/NotificationContext';
import { usePets } from '../hooks/usePets';
import { useDispenserDiscovery } from '../hooks/useDispenserDiscovery';
import { getPetIconInfo } from '../utils/petIcons';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import Toast from 'react-native-toast-message';

// Obtener dimensiones de la pantalla para diseño responsivo
const { width, height } = Dimensions.get("window");

/**
 * Componente principal de la pantalla de gestión de mascotas
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.navigation - Objeto de navegación de React Navigation
 * @returns {JSX.Element} Componente de pantalla de gestión de mascotas
 */
export default function MyPetScreen({ navigation }) {
  const { addNotification, removeNotification } = useNotifications();
  const { pets, addPet, updatePet, deletePet } = usePets();
  
  // Hook para descubrimiento y control de dispensadores
  const {
    discoveredDispensers,
    isScanning,
    mqttConnected,
    connectionStatus,
    connectToDispenser,
    sendDispenseCommand,
    syncSchedulesToDispenser,
    rescanDevices,
    isDeviceConnected,
    disconnectFromDispenser
  } = useDispenserDiscovery();
  
  const [selectedPetIndex, setSelectedPetIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showDispensersModal, setShowDispensersModal] = useState(false);
  const [showDispenserConfigModal, setShowDispenserConfigModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedDispenser, setSelectedDispenser] = useState(null);
  const [dispenserConfigName, setDispenserConfigName] = useState('');
  const [dispenserPassword, setDispenserPassword] = useState('FIDO2025');
  const [newPet, setNewPet] = useState({
    name: "",
    species: "Perro",
    breed: "",
    gender: "",
    dispenserId: null,
    dispenserName: "Sin asignar"
  });
  const [editingPet, setEditingPet] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('success'); // 'success' | 'error' | 'confirm'
  const [modalMessage, setModalMessage] = useState('');
  
  const currentPet = pets[selectedPetIndex] || null;

  // Efectos
  // Notificación de datos incompletos por mascota
  useEffect(() => {
    if (pets.length > 0 && pets[selectedPetIndex]) {
      setEditingPet({ ...pets[selectedPetIndex] });
      const pet = pets[selectedPetIndex];
      const missingFields = [
        !pet.name,
        !pet.species,
        ((pet.species === "Perro" || pet.species === "Gato") && !pet.breed),
        !pet.age,
        !pet.weight,
        !pet.gender
      ];
      if (missingFields.some(Boolean)) {
        addNotification({
          id: `pet-incomplete-${pet.id}`,
          message: `${pet.name || 'Tu mascota'} tiene datos sin completar en su registro`,
          icon: pet.species ? getPetIconInfo(pet.species).name : 'alert-circle',
          color: pet.species ? getPetIconInfo(pet.species).speciesColor : '#FF9800',
          // No incluir onPress aquí, la navegación se maneja desde HomeScreen
        });
      } else {
        removeNotification(`pet-incomplete-${pet.id}`);
      }
    }
  }, [selectedPetIndex, pets, addNotification, removeNotification]);
  useEffect(() => {
    if (selectedPetIndex >= pets.length && pets.length > 0) {
      setSelectedPetIndex(pets.length - 1);
    }
  }, [pets.length, selectedPetIndex]);

  // Handlers
  const showSimpleModal = (type, message) => {
    setModalType(type);
    setModalMessage(message);
    setModalVisible(true);
  };
  const handleSave = async () => {
    if (!currentPet) return;
    try {
      await updatePet(currentPet.id, editingPet);
      setIsEditing(false);
      showSimpleModal('success', 'Los datos de tu mascota han sido actualizados exitosamente.');
    } catch {
      showSimpleModal('error', 'No se pudieron guardar los cambios.');
    }
  };
  const handleEdit = () => setIsEditing(true);
  const updateEditingPetField = (field, value) => setEditingPet(prev => ({ ...prev, [field]: value }));
  const handleAddNewPet = async () => {
    if (!newPet.name.trim()) {
      showSimpleModal('error', 'Por favor ingresa el nombre de la mascota');
      return;
    }
    try {
      await addPet({
        name: newPet.name,
        species: newPet.species,
        breed: (newPet.species === "Perro" || newPet.species === "Gato") ? newPet.breed : "",
        age: "",
        weight: "",
        gender: "",
        dispenserId: null,
        dispenserName: "Sin asignar"
      });
      setNewPet({
        name: "",
        species: "Perro",
        breed: "",
        age: "",
        weight: "",
        gender: "",
        dispenserId: null,
        dispenserName: "Sin asignar"
      });
      setShowAddPetModal(false);
      setSelectedPetIndex(pets.length);
      showSimpleModal('success', 'Mascota agregada exitosamente. Ahora termina de completar la información de tu mascota.');
    } catch {
      showSimpleModal('error', 'No se pudo agregar la mascota.');
    }
  };
  const handleDeletePet = async () => {
    if (!currentPet) {
      console.log("No hay mascota seleccionada para eliminar");
      return;
    }
    if (pets.length <= 1) {
      console.log("Intento de eliminar la última mascota");
      showSimpleModal('error', 'Debes tener al menos una mascota registrada');
      return;
    }
    console.log("Intentando eliminar mascota:", currentPet.id, currentPet.name);
    setModalType('confirm');
    setModalMessage(`¿Estás seguro de que deseas eliminar a ${currentPet.name}?`);
    setModalVisible(true);
  };
  /**
   * Asignar dispensador a mascota
   */
  const assignDispenser = async (dispenserId, dispenserName) => {
    try {
      if (currentPet) {
        // Actualizar mascota con nuevo dispensador
        const updatedPet = {
          ...currentPet,
          dispenserId: dispenserId,
          dispenserName: dispenserName || "Sin asignar"
        };
        await updatePet(currentPet.id, updatedPet);
        setEditingPet(updatedPet);
        setShowDispensersModal(false);
        showSimpleModal('success', 
          dispenserId 
            ? `Dispensador ${dispenserName} asignado a ${currentPet.name}` 
            : `Dispensador desasignado de ${currentPet.name}`
        );
        // Forzar refresco y navegar a HomeScreen tras breve delay
        setTimeout(() => {
          if (typeof navigation?.navigate === 'function') {
            navigation.navigate('Home');
          }
        }, 800);
      }
    } catch (error) {
      showSimpleModal('error', `Error asignando dispensador: ${error.message}`);
    }
  };

  /**
   * Conectar a dispensador con contraseña
   */
  const handleConnectToDispenser = async () => {
    if (!selectedDispenser) return;
    
    try {
      setShowPasswordModal(false);
      
      // Mostrar estado de conexión
      showSimpleModal('info', `Conectando a ${selectedDispenser.name || selectedDispenser.deviceId}...`);
      
      // Conectar al dispensador
      const result = await connectToDispenser(selectedDispenser.deviceId, dispenserPassword);
      
      if (result.success) {
        // Asignar el dispensador a la mascota actual
        await assignDispenser(selectedDispenser.deviceId, selectedDispenser.name || selectedDispenser.deviceId);
        
        showSimpleModal('success', 
          `Dispensador conectado y asignado a ${currentPet.name}`
        );
      } else {
        showSimpleModal('error', `Error conectando: ${result.message}`);
      }
    } catch (error) {
      showSimpleModal('error', `Error conectando: ${error.message}`);
    }
    
    setSelectedDispenser(null);
    setDispenserPassword('FIDO2025'); // Reset password
  };

  /**
   * Manejar dispensación remota
   */
  const handleDispenseFromApp = async (dispenserId, amount = 150) => {
    try {
      if (!isDeviceConnected(dispenserId)) {
        showSimpleModal('error', 'Dispensador no conectado');
        return;
      }

      showSimpleModal('info', 'Enviando comando de dispensación...');
      
      const result = await sendDispenseCommand(dispenserId, amount);
      
      if (result.success) {
        showSimpleModal('success', 'Dispensación iniciada remotamente');
      } else {
        showSimpleModal('error', `Error: ${result.message}`);
      }
    } catch (error) {
      showSimpleModal('error', `Error enviando comando: ${error.message}`);
    }
  };

  const openDispenserConfig = (dispenser) => {
    setSelectedDispenser(dispenser);
    setDispenserConfigName(dispenser.name);
    setShowDispenserConfigModal(true);
  };
  const saveDispenserConfig = () => {
    setShowDispenserConfigModal(false);
    showSimpleModal('success', 'Nombre del dispensador actualizado (solo visual)');
  };

  // Render auxiliar para campos del formulario
  const renderFormField = ({ icon, color, label, value, onChange, editable, pickerItems, placeholder }) => (
    <View style={styles.formRowModern}>
      <Ionicons name={icon} size={22} color={color} style={styles.formIcon} />
      <View style={styles.inputContainerModern}>
        <Text style={styles.inputLabelModern}>{label}</Text>
        {editable ? (
          pickerItems ? (
            <Picker
              selectedValue={value}
              style={styles.pickerModern}
              onValueChange={onChange}
            >
              {pickerItems.map(item => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          ) : (
            <TextInput
              style={[styles.textInputModern, { borderColor: color }]}
              value={value}
              onChangeText={onChange}
              placeholder={placeholder}
            />
          )
        ) : (
          <Text style={styles.displayTextModern}>{value}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <Text style={styles.title}>Mis Mascotas</Text>

          {/* Si no hay mascotas, mostrar aviso y botón */}
          {(!pets || pets.length === 0) ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ fontSize: 18, color: '#666', marginBottom: 20 }}>
                ¡No tienes mascotas registradas!
              </Text>
              <TouchableOpacity
                style={styles.addPetCard}
                onPress={() => setShowAddPetModal(true)}
              >
                <Ionicons name="add-circle" size={40} color="#4CAF50" />
                <Text style={styles.addPetText}>Agregar mi primera mascota</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Selector de Mascotas */}
              <View style={styles.petSelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {pets.map((pet, index) => (
                    <TouchableOpacity
                      key={pet.id}
                      style={[
                        styles.petCard,
                        selectedPetIndex === index && styles.petCardSelected
                      ]}
                      onPress={() => setSelectedPetIndex(index)}
                    >
                      <View style={styles.petCardAvatar}>
                        <Ionicons 
                          name={getPetIconInfo(pet.species, selectedPetIndex === index).name}
                          size={30} 
                          color={getPetIconInfo(pet.species, selectedPetIndex === index).color}
                        />
                      </View>
                      <Text style={[
                        styles.petCardName,
                        selectedPetIndex === index && styles.petCardNameSelected
                      ]}>
                        {pet.name}
                      </Text>
                      <Text style={[
                        styles.petCardSpecies,
                        selectedPetIndex === index && styles.petCardSpeciesSelected
                      ]}>
                        {pet.species}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {/* Botón Agregar Mascota */}
                  <TouchableOpacity
                    style={styles.addPetCard}
                    onPress={() => setShowAddPetModal(true)}
                  >
                    <Ionicons name="add-circle" size={40} color="#4CAF50" />
                    <Text style={styles.addPetText}>Agregar</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* Información de la Mascota Seleccionada */}
              <View style={styles.formContainer}>
                {/* Header con Avatar y Acciones */}
                <View style={styles.petHeader}>
                  <View style={styles.petAvatarContainer}>
                    <View style={styles.petAvatar}>
                      <Ionicons name={currentPet ? getPetIconInfo(currentPet.species).name : 'paw'} size={60} color={currentPet ? getPetIconInfo(currentPet.species).speciesColor : '#000'} />
                    </View>
                  </View>
                  
                  <View style={styles.petHeaderActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setShowDispensersModal(true)}
                    >
                      <Ionicons name="hardware-chip" size={20} color="#4CAF50" />
                      <Text style={styles.actionButtonText}>Dispensador</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => {
                        if (!currentPet) return;
                        setModalType('confirm');
                        setModalMessage(`¿Estás seguro de que deseas eliminar a ${currentPet.name}?`);
                        setModalVisible(true);
                      }}
                    >
                      <Ionicons name="trash" size={20} color="#FF5252" />
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar mascota</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Información del Dispensador */}
                <View style={styles.dispenserInfo}>
                  <View style={styles.dispenserHeader}>
                    <Ionicons name="hardware-chip" size={24} color="#4CAF50" />
                    <Text style={styles.dispenserTitle}>Dispensador Asignado</Text>
                  </View>
                  <View style={styles.dispenserDetails}>
                    <Text style={styles.dispenserName}>
                      {currentPet.dispenserName}
                    </Text>
                    {currentPet.dispenserId && (
                      <View style={styles.dispenserStatus}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Conectado</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Formulario visualmente mejorado y optimizado */}
                <View style={styles.formGridModern}>
                  <View style={styles.formSectionHeader}>
                    <Ionicons 
                      name={currentPet ? getPetIconInfo(currentPet.species).name : 'paw'} 
                      size={28} 
                      color={currentPet ? getPetIconInfo(currentPet.species).speciesColor : '#7C3AED'} 
                      style={{ marginRight: 10 }} 
                    />
                    <Text style={styles.formSectionTitle}>Datos de la Mascota</Text>
                  </View>
                  {renderFormField({
                    icon: "person",
                    color: "#4CAF50",
                    label: "Nombre",
                    value: editingPet.name ?? "",
                    onChange: text => updateEditingPetField("name", text),
                    editable: isEditing,
                    placeholder: "Nombre de la mascota"
                  })}
                  <View style={styles.formSeparator} />
                  {renderFormField({
                    icon: currentPet ? getPetIconInfo(currentPet.species).name : "leaf",
                    color: currentPet ? getPetIconInfo(currentPet.species).speciesColor : "#7C3AED",
                    label: "Especie",
                    value: editingPet.species ?? "",
                    onChange: value => updateEditingPetField("species", value),
                    editable: isEditing,
                    pickerItems: [
                      { label: "Selecciona especie...", value: "" },
                      { label: "Perro", value: "Perro" },
                      { label: "Gato", value: "Gato" },
                      { label: "Conejo", value: "Conejo" },
                      { label: "Hamster", value: "Hamster" }
                    ]
                  })}
                  {(editingPet.species === "Perro" || editingPet.species === "Gato") && (
                    <>
                      <View style={styles.formSeparator} />
                      {renderFormField({
                        icon: "medal",
                        color: "#F59E42",
                        label: "Raza",
                        value: editingPet.breed ?? "",
                        onChange: text => updateEditingPetField("breed", text),
                        editable: isEditing,
                        placeholder: editingPet.species === "Perro" ? "Raza del perro" : "Raza del gato"
                      })}
                    </>
                  )}
                  <View style={styles.formSeparator} />
                  {renderFormField({
                    icon: "male-female",
                    color: "#E91E63",
                    label: "Sexo",
                    value: editingPet.gender ?? "",
                    onChange: value => updateEditingPetField("gender", value),
                    editable: isEditing,
                    pickerItems: [
                      { label: "Selecciona sexo...", value: "" },
                      { label: "Macho", value: "Macho" },
                      { label: "Hembra", value: "Hembra" }
                    ]
                  })}
                  <View style={styles.formSeparator} />
                  {renderFormField({
                    icon: "calendar",
                    color: "#2196F3",
                    label: "Edad",
                    value: editingPet.age ?? "",
                    onChange: value => updateEditingPetField("age", value),
                    editable: isEditing,
                    pickerItems: [
                      { label: "Selecciona edad...", value: "" },
                      { label: "1 año", value: "1 año" },
                      { label: "2 años", value: "2 años" },
                      { label: "3 años", value: "3 años" },
                      { label: "4 años", value: "4 años" },
                      { label: "5 años", value: "5 años" },
                      { label: "6 años", value: "6 años" },
                      { label: "7 años", value: "7 años" },
                      { label: "8 años", value: "8 años" },
                      { label: "9 años", value: "9 años" },
                      { label: "10+ años", value: "10+ años" }
                    ]
                  })}
                  <View style={styles.formSeparator} />
                  {renderFormField({
                    icon: "barbell",
                    color: "#00BCD4",
                    label: "Peso",
                    value: editingPet.weight ?? "",
                    onChange: value => updateEditingPetField("weight", value),
                    editable: isEditing,
                    pickerItems: [
                      { label: "Selecciona peso...", value: "" },
                      { label: "1-5 kg", value: "1-5 kg" },
                      { label: "5-10 kg", value: "5-10 kg" },
                      { label: "10-15 kg", value: "10-15 kg" },
                      { label: "15 kg", value: "15 kg" },
                      { label: "20-25 kg", value: "20-25 kg" },
                      { label: "25-30 kg", value: "25-30 kg" },
                      { label: "30+ kg", value: "30+ kg" }
                    ]
                  })}
                </View>

                {/* Aviso para completar información si hay campos vacíos */}
                {(
                  !editingPet.name ||
                  !editingPet.species ||
                  ((editingPet.species === "Perro" || editingPet.species === "Gato") && !editingPet.breed) ||
                  !editingPet.age ||
                  !editingPet.weight ||
                  !editingPet.gender
                ) && (
                  <View style={{ marginBottom: 15, alignItems: 'center' }}>
                    <Text style={{ color: '#FF9800', fontWeight: 'bold' }}>
                      Termina de completar la información de tu mascota
                    </Text>
                  </View>
                )}

                {/* Botones */}
                <View style={styles.buttonContainer}>
                  {isEditing ? (
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}
                    >
                      <Text style={styles.saveButtonText}>Guardar</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={handleEdit}
                    >
                      <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Modal Agregar Mascota */}
      <Modal visible={showAddPetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleContainer}>
              <Ionicons 
                name={getPetIconInfo(newPet.species).name} 
                size={32} 
                color={getPetIconInfo(newPet.species).speciesColor} 
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.modalTitle}>Agregar Nueva Mascota</Text>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre de la mascota"
              value={newPet.name}
              onChangeText={(text) => setNewPet(prev => ({...prev, name: text}))}
            />
            <View style={styles.modalPickerContainer}>
              <Text style={styles.modalLabel}>Especie:</Text>
              <Picker
                selectedValue={newPet.species}
                style={styles.modalPicker}
                onValueChange={(value) => setNewPet(prev => ({...prev, species: value, breed: ""}))}
              >
                <Picker.Item label="Perro" value="Perro" />
                <Picker.Item label="Gato" value="Gato" />
                <Picker.Item label="Conejo" value="Conejo" />
                <Picker.Item label="Hamster" value="Hamster" />
              </Picker>
            </View>
            {/* Campo raza solo si es perro o gato */}
            {(newPet.species === "Perro" || newPet.species === "Gato") && (
              <TextInput
                style={styles.modalInput}
                placeholder={newPet.species === "Perro" ? "Raza del perro" : "Raza del gato"}
                value={newPet.breed}
                onChangeText={(text) => setNewPet(prev => ({...prev, breed: text}))}
              />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddPetModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleAddNewPet}
              >
                <Text style={styles.modalSaveText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Dispensadores */}
      <Modal visible={showDispensersModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dispensadores Disponibles</Text>
            
            {/* Estado de conexión MQTT */}
            <View style={styles.mqttStatusContainer}>
              <View style={styles.mqttStatusIndicator}>
                <View style={[
                  styles.mqttStatusDot,
                  { backgroundColor: mqttConnected ? '#4CAF50' : '#FF5252' }
                ]} />
                <Text style={styles.mqttStatusText}>
                  {mqttConnected ? 'Conectado a MQTT' : 'Desconectado de MQTT'}
                </Text>
              </View>
              
              <TouchableOpacity
                style={[styles.rescanButton, { opacity: isScanning ? 0.6 : 1 }]}
                onPress={rescanDevices}
                disabled={isScanning}
              >
                <Ionicons 
                  name={isScanning ? "sync" : "refresh"} 
                  size={16} 
                  color="#4CAF50" 
                  style={isScanning ? { transform: [{ rotate: '360deg' }] } : {}}
                />
                <Text style={styles.rescanButtonText}>
                  {isScanning ? 'Buscando...' : 'Buscar Dispositivos'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Estado de conexión detallado */}
            {connectionStatus && (
              <View style={styles.connectionStatusContainer}>
                <Ionicons 
                  name="information-circle" 
                  size={16} 
                  color={mqttConnected ? '#4CAF50' : '#FF9800'} 
                />
                <Text style={[
                  styles.connectionStatusText,
                  { color: mqttConnected ? '#4CAF50' : '#FF9800' }
                ]}>
                  {connectionStatus}
                </Text>
              </View>
            )}
            
            {/* Opción para sin asignar */}
            <TouchableOpacity
              style={styles.dispenserOption}
              onPress={() => assignDispenser(null, "Sin asignar")}
            >
              <Ionicons name="close-circle" size={24} color="#FF5252" />
              <Text style={styles.dispenserOptionText}>Sin asignar</Text>
            </TouchableOpacity>

            {/* Lista de dispensadores descubiertos */}
            {!mqttConnected ? (
              <View style={styles.noDispensersContainer}>
                <Ionicons name="wifi" size={48} color="#CCC" />
                <Text style={styles.noDispensersText}>
                  Sin conexión MQTT
                </Text>
                <Text style={styles.noDispensersSubtext}>
                  Verifica tu conexión a internet y reinicia la app
                </Text>
              </View>
            ) : discoveredDispensers.length === 0 && !isScanning ? (
              <View style={styles.noDispensersContainer}>
                <Ionicons name="search" size={48} color="#CCC" />
                <Text style={styles.noDispensersText}>
                  No se encontraron dispensadores
                </Text>
                <Text style={styles.noDispensersSubtext}>
                  Asegúrate de que tu dispensador esté encendido y conectado
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={rescanDevices}
                >
                  <Ionicons name="refresh" size={16} color="#2196F3" />
                  <Text style={styles.retryButtonText}>Buscar de nuevo</Text>
                </TouchableOpacity>
              </View>
            ) : isScanning ? (
              <View style={styles.scanningContainer}>
                <Ionicons name="sync" size={32} color="#4CAF50" />
                <Text style={styles.scanningText}>Buscando dispensadores...</Text>
                <Text style={styles.scanningSubtext}>
                  Esto puede tomar unos segundos
                </Text>
              </View>
            ) : (
              discoveredDispensers.map((dispenser) => (
                <View key={dispenser.deviceId} style={styles.dispenserOptionContainer}>
                  <TouchableOpacity
                    style={[
                      styles.dispenserOption,
                      !dispenser.isAvailable && styles.dispenserDisabled
                    ]}
                    onPress={() => {
                      if (dispenser.isAvailable) {
                        if (isDeviceConnected(dispenser.deviceId)) {
                          assignDispenser(dispenser.deviceId, dispenser.name || dispenser.deviceId);
                        } else {
                          // Mostrar modal de contraseña
                          setSelectedDispenser(dispenser);
                          setShowPasswordModal(true);
                        }
                      }
                    }}
                    disabled={!dispenser.isAvailable}
                  >
                    <View style={styles.dispenserMainInfo}>
                      <Ionicons 
                        name="hardware-chip" 
                        size={24} 
                        color={dispenser.isAvailable ? "#4CAF50" : "#999"} 
                      />
                      <View style={styles.dispenserInfo}>
                        <Text style={[
                          styles.dispenserName,
                          !dispenser.isAvailable && styles.dispenserDisabledText
                        ]}>
                          {dispenser.name || dispenser.deviceId}
                        </Text>
                        <Text style={styles.dispenserDetails}>
                          ID: {dispenser.deviceId}
                        </Text>
                        <View style={styles.dispenserStatus}>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                              {isDeviceConnected(dispenser.deviceId) ? 'Conectado' : 
                               dispenser.isAvailable ? 'Disponible' : 'No disponible'}
                            </Text>
                          </View>
                          {dispenser.batteryLevel && (
                            <View style={styles.batteryInfo}>
                              <Ionicons name="battery-half" size={14} color="#666" />
                              <Text style={styles.batteryText}>{dispenser.batteryLevel}%</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    
                    {/* Botones de acción */}
                    <View style={styles.dispenserActions}>
                      {isDeviceConnected(dispenser.deviceId) && (
                        <>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDispenseFromApp(dispenser.deviceId, 150)}
                          >
                            <Ionicons name="play" size={16} color="#4CAF50" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => openDispenserConfig(dispenser)}
                          >
                            <Ionicons name="settings" size={16} color="#666" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => disconnectFromDispenser(dispenser.deviceId)}
                          >
                            <Ionicons name="unlink" size={16} color="#FF5252" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowDispensersModal(false)}
            >
              <Text style={styles.modalCancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Contraseña para Conexión */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Conectar Dispensador</Text>
            
            {selectedDispenser && (
              <View style={styles.dispenserInfoCard}>
                <Ionicons name="hardware-chip" size={32} color="#4CAF50" />
                <View style={styles.dispenserInfoDetails}>
                  <Text style={styles.dispenserInfoTitle}>
                    {selectedDispenser.name || selectedDispenser.deviceId}
                  </Text>
                  <Text style={styles.dispenserInfoSubtitle}>
                    ID: {selectedDispenser.deviceId}
                  </Text>
                  {selectedDispenser.batteryLevel && (
                    <View style={styles.batteryInfoCard}>
                      <Ionicons name="battery-half" size={16} color="#666" />
                      <Text style={styles.batteryInfoText}>
                        Batería: {selectedDispenser.batteryLevel}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            <View style={styles.passwordInputContainer}>
              <Text style={styles.passwordLabel}>Contraseña del Dispositivo:</Text>
              <TextInput
                style={styles.passwordInput}
                value={dispenserPassword}
                onChangeText={setDispenserPassword}
                placeholder="Ingresa la contraseña"
                secureTextEntry={true}
                autoCapitalize="none"
              />
              <Text style={styles.passwordHint}>
                💡 Contraseña por defecto: FIDO2025
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowPasswordModal(false);
                  setSelectedDispenser(null);
                  setDispenserPassword('FIDO2025');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { opacity: !dispenserPassword.trim() ? 0.5 : 1 }]}
                onPress={handleConnectToDispenser}
                disabled={!dispenserPassword.trim()}
              >
                <Text style={styles.modalSaveText}>Conectar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Configuración de Dispensador */}
      <Modal visible={showDispenserConfigModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configurar Dispensador</Text>
            
            <View style={styles.modalPickerContainer}>
              <Text style={styles.modalLabel}>Nombre del Dispensador:</Text>
              <TextInput
                style={styles.modalInput}
                value={dispenserConfigName}
                onChangeText={setDispenserConfigName}
                placeholder="Ej: Comedero de FIDO"
                maxLength={30}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDispenserConfigModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveDispenserConfig}
              >
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Simple para mensajes y confirmaciones */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', justifyContent: 'center', paddingTop: 30, paddingBottom: 30 }]}>  
            {modalType === 'confirm' ? (
              <>
                <Ionicons name="alert" size={48} color="#F59E42" style={{ marginBottom: 10 }} />
                <Text style={[styles.modalTitle, { marginBottom: 10 }]}>{modalMessage}</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={async () => {
                      setModalVisible(false);
                      try {
                        await deletePet(currentPet.id);
                        setSelectedPetIndex(0);
                        showSimpleModal('success', `${currentPet.name} ha sido eliminada exitosamente.`);
                      } catch {
                        showSimpleModal('error', 'No se pudo eliminar la mascota.');
                      }
                    }}
                  >
                    <Text style={styles.modalSaveText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Ionicons 
                  name={modalType === 'success' ? 'checkmark-circle' : 'close-circle'} 
                  size={56} 
                  color={modalType === 'success' ? '#4CAF50' : '#FF5252'} 
                  style={{ marginBottom: 10 }} 
                />
                <Text style={[styles.modalTitle, { color: modalType === 'success' ? '#4CAF50' : '#FF5252', marginBottom: 10 }]}>{modalType === 'success' ? '¡Éxito!' : 'Error'}</Text>
                <Text style={{ fontSize: 16, color: '#333', marginBottom: 24, textAlign: 'center', fontWeight: '500' }}>{modalMessage}</Text>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalSaveText}>Aceptar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0D5F7" },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 100 },
  mainContent: { paddingHorizontal: 20, paddingTop: 30 },
  title: { fontSize: 32, fontWeight: "bold", color: "#000", marginBottom: 30 },
  
  // Selector de Mascotas
  petSelectorContainer: {
    marginBottom: 30,
  },
  petCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    alignItems: "center",
    minWidth: 100,
    borderWidth: 2,
    borderColor: "transparent",
  },
  petCardSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
  },
  petCardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  petCardName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  petCardNameSelected: {
    color: "#FFFFFF",
  },
  petCardSpecies: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  petCardSpeciesSelected: {
    color: "#E8F5E8",
  },
  addPetCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderStyle: "dashed",
  },
  addPetText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "bold",
    marginTop: 5,
  },

  // Contenedor del formulario
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 30,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#000",
  },

  // Header de la mascota
  petHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  petAvatarContainer: {
    flex: 1,
    alignItems: "center",
  },
  petAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#000",
  },
  petHeaderActions: {
    flex: 1,
    alignItems: "flex-end",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  deleteButton: {
    borderColor: "#FF5252",
  },
  actionButtonText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 5,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#FF5252",
  },

  // Información del dispensador
  dispenserInfo: {
    backgroundColor: "#F8F9FA",
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dispenserHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dispenserTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginLeft: 10,
  },
  dispenserDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dispenserName: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  dispenserStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },

  // Formulario Moderno
  formGridModern: {
    marginBottom: 30,
    backgroundColor: '#F8F9FA',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
  },
  formSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  formRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  formIcon: {
    marginRight: 8,
    backgroundColor: '#F3F0FF',
    borderRadius: 8,
    padding: 6,
  },
  inputContainerModern: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputLabelModern: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  textInputModern: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  displayTextModern: {
    fontSize: 15,
    color: '#222',
    paddingVertical: 10,
    marginBottom: 2,
  },
  pickerModern: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 44,
    marginBottom: 2,
  },
  formSeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 6,
    borderRadius: 1,
  },

  // Botones
  buttonContainer: { alignItems: "center" },
  editButton: {
    backgroundColor: "#4472C4",
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },

  // Modales
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    maxWidth: 400,
    maxHeight: height * 0.85,
    minHeight: height * 0.4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  modalTitleContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  modalInput: {
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: "#000",
    marginBottom: 15,
    minHeight: 50,
  },
  modalPickerContainer: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  modalPicker: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 50,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    gap: 15,
  },
  modalCancelButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flex: 1,
    minHeight: 50,
  },
  modalCancelText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  modalSaveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flex: 1,
    minHeight: 50,
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Opciones de dispensador
  dispenserOptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dispenserOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    flex: 1,
    marginRight: 10,
  },
  dispenserDisabled: {
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
  },
  dispenserOptionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  dispenserOptionText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
  dispenserDisabledText: {
    color: "#999",
  },
  configDispenserButton: {
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  statusConnected: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
  },
  statusDisconnected: {
    color: "#FF5252",
    fontSize: 12,
    fontWeight: "600",
  },

  // Estilos MQTT y conexión
  mqttStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  mqttStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  mqttStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  mqttStatusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  rescanButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E8F5E8",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  rescanButtonText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    marginLeft: 4,
  },
  connectionStatus: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
    fontStyle: "italic",
  },
  noDispensersContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 16,
  },
  noDispensersText: {
    fontSize: 16,
    color: "#666",
    marginVertical: 12,
    textAlign: "center",
  },
  dispenserDetailsText: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },

  // Modal de contraseña
  dispenserInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 20,
  },
  dispenserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dispenserInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  dispenserInfoDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  passwordInputContainer: {
    marginBottom: 24,
  },
  passwordLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFF",
  },
  passwordHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },

  // Estilos para estado MQTT y dispensadores
  mqttStatusContainer: {
    marginBottom: 16,
  },
  mqttStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  mqttStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  mqttStatusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  rescanButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#F0F8F0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  rescanButtonText: {
    fontSize: 14,
    color: "#4CAF50",
    marginLeft: 4,
    fontWeight: "500",
  },
  connectionStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    marginBottom: 16,
  },
  connectionStatusText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  dispenserOptionContainer: {
    marginBottom: 8,
  },
  dispenserMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dispenserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dispenserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  dispenserDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  dispenserStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "500",
  },
  batteryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  batteryText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 2,
  },
  dispenserActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
  },
  dispenserDisabled: {
    opacity: 0.5,
  },
  dispenserDisabledText: {
    color: "#999",
  },
  noDispensersContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noDispensersText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 12,
    textAlign: "center",
  },
  noDispensersSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    color: "#2196F3",
    marginLeft: 4,
    fontWeight: "500",
  },
  scanningContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  scanningText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
    marginTop: 12,
  },
  scanningSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  dispenserInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 20,
  },
  dispenserInfoDetails: {
    marginLeft: 12,
    flex: 1,
  },
  dispenserInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  dispenserInfoSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  batteryInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  batteryInfoText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
});
