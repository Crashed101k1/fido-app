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

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

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
  
  // ============ ESTADOS LOCALES ============
  
  /** Índice de la mascota actualmente seleccionada en el carrusel */
  const [selectedPetIndex, setSelectedPetIndex] = useState(0);
  
  /** Estado que controla si se está editando información de mascota */
  const [isEditing, setIsEditing] = useState(false);
  
  /** Control de visibilidad del modal para agregar nueva mascota */
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  
  /** Control de visibilidad del modal de selección de dispensadores */
  const [showDispensersModal, setShowDispensersModal] = useState(false);
  
  /** Control de visibilidad del modal de configuración de dispensador */
  const [showDispenserConfigModal, setShowDispenserConfigModal] = useState(false);
  
  /** Dispensador seleccionado para configuración */
  const [selectedDispenser, setSelectedDispenser] = useState(null);
  
  /** Nombre personalizado para el dispensador en configuración */
  const [dispenserConfigName, setDispenserConfigName] = useState('');
  
  /** 
   * Lista de mascotas del usuario con información completa
   * Incluye datos de la mascota y configuración de dispensador asociado
   */
  const [pets, setPets] = useState([
    {
      id: 1,
      name: "FIDO",
      species: "Perro",
      age: "5 años",
      weight: "15 kg",
      gender: "Macho",
      dispenserId: "DISP-001",
      dispenserName: "Dispensador Cocina"
    },
    {
      id: 2,
      name: "Luna",
      species: "Gato",
      age: "3 años",
      weight: "5 kg",
      gender: "Hembra",
      dispenserId: null,
      dispenserName: "Sin asignar"
    }
  ]);

  /** Lista de dispensadores disponibles para asignación */
  const [availableDispensers, setAvailableDispensers] = useState([
    { id: "DISP-001", name: "Dispensador Cocina", status: "Conectado" },
    { id: "DISP-002", name: "Dispensador Jardín", status: "Conectado" },
    { id: "DISP-003", name: "Dispensador Sala", status: "Desconectado" },
  ]);

  const [newPet, setNewPet] = useState({
    name: "",
    species: "Perro",
    age: "1 año",
    weight: "1-5 kg",
    gender: "Macho",
    dispenserId: null,
    dispenserName: "Sin asignar"
  });

  const currentPet = pets[selectedPetIndex] || pets[0];

  const handleSave = () => {
    setPets(prev => prev.map((pet, index) => 
      index === selectedPetIndex ? currentPet : pet
    ));
    setIsEditing(false);
    Alert.alert(
      "Información Guardada",
      "Los datos de tu mascota han sido actualizados exitosamente."
    );
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const updatePetInfo = (field, value) => {
    setPets(prev => prev.map((pet, index) => 
      index === selectedPetIndex ? { ...pet, [field]: value } : pet
    ));
  };

  const addNewPet = () => {
    if (!newPet.name.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre de la mascota");
      return;
    }
    
    const petToAdd = {
      ...newPet,
      id: Date.now(),
    };
    
    setPets(prev => [...prev, petToAdd]);
    setNewPet({
      name: "",
      species: "Perro",
      age: "1 año",
      weight: "1-5 kg",
      gender: "Macho",
      dispenserId: null,
      dispenserName: "Sin asignar"
    });
    setShowAddPetModal(false);
    setSelectedPetIndex(pets.length); // Seleccionar la nueva mascota
    Alert.alert("Éxito", "Mascota agregada exitosamente");
  };

  const deletePet = () => {
    if (pets.length <= 1) {
      Alert.alert("Error", "Debes tener al menos una mascota registrada");
      return;
    }
    
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro de que deseas eliminar a ${currentPet.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setPets(prev => prev.filter((_, index) => index !== selectedPetIndex));
            setSelectedPetIndex(0);
          }
        }
      ]
    );
  };

  const assignDispenser = (dispenserId, dispenserName) => {
    updatePetInfo('dispenserId', dispenserId);
    updatePetInfo('dispenserName', dispenserName);
    setShowDispensersModal(false);
  };

  const openDispenserConfig = (dispenser) => {
    setSelectedDispenser(dispenser);
    setDispenserConfigName(dispenser.name);
    setShowDispenserConfigModal(true);
  };

  const saveDispenserConfig = () => {
    if (!dispenserConfigName.trim()) {
      Alert.alert("Error", "Por favor ingresa un nombre para el dispensador");
      return;
    }

    // Actualizar el nombre del dispensador
    setAvailableDispensers(prev => 
      prev.map(dispenser => 
        dispenser.id === selectedDispenser.id 
          ? { ...dispenser, name: dispenserConfigName.trim() }
          : dispenser
      )
    );

    // Actualizar el nombre en las mascotas que usan este dispensador
    setPets(prev => 
      prev.map(pet => 
        pet.dispenserId === selectedDispenser.id 
          ? { ...pet, dispenserName: dispenserConfigName.trim() }
          : pet
      )
    );

    setShowDispenserConfigModal(false);
    Alert.alert("Éxito", "Nombre del dispensador actualizado");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <Text style={styles.title}>Mis Mascotas</Text>

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
                      name="paw" 
                      size={30} 
                      color={selectedPetIndex === index ? "#FFFFFF" : "#4CAF50"} 
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
                  <Ionicons name="paw" size={60} color="#000" />
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
                  onPress={deletePet}
                >
                  <Ionicons name="trash" size={20} color="#FF5252" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
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

            {/* Campos del formulario */}
            <View style={styles.formGrid}>
              {/* Nombre y Especie */}
              <View style={styles.formRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nombre:</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.textInput}
                      value={currentPet.name}
                      onChangeText={(text) => updatePetInfo("name", text)}
                    />
                  ) : (
                    <Text style={styles.displayText}>{currentPet.name}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Especie:</Text>
                  {isEditing ? (
                    <Picker
                      selectedValue={currentPet.species}
                      style={styles.picker}
                      onValueChange={(value) => updatePetInfo("species", value)}
                    >
                      <Picker.Item label="Perro" value="Perro" />
                      <Picker.Item label="Gato" value="Gato" />
                      <Picker.Item label="Conejo" value="Conejo" />
                      <Picker.Item label="Hamster" value="Hamster" />
                    </Picker>
                  ) : (
                    <Text style={styles.displayText}>{currentPet.species}</Text>
                  )}
                </View>
              </View>

              {/* Edad y Peso */}
              <View style={styles.formRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Edad:</Text>
                  {isEditing ? (
                    <Picker
                      selectedValue={currentPet.age}
                      style={styles.picker}
                      onValueChange={(value) => updatePetInfo("age", value)}
                    >
                      <Picker.Item label="1 año" value="1 año" />
                      <Picker.Item label="2 años" value="2 años" />
                      <Picker.Item label="3 años" value="3 años" />
                      <Picker.Item label="4 años" value="4 años" />
                      <Picker.Item label="5 años" value="5 años" />
                      <Picker.Item label="6 años" value="6 años" />
                      <Picker.Item label="7 años" value="7 años" />
                      <Picker.Item label="8 años" value="8 años" />
                      <Picker.Item label="9 años" value="9 años" />
                      <Picker.Item label="10+ años" value="10+ años" />
                    </Picker>
                  ) : (
                    <Text style={styles.displayText}>{currentPet.age}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Peso:</Text>
                  {isEditing ? (
                    <Picker
                      selectedValue={currentPet.weight}
                      style={styles.picker}
                      onValueChange={(value) => updatePetInfo("weight", value)}
                    >
                      <Picker.Item label="1-5 kg" value="1-5 kg" />
                      <Picker.Item label="5-10 kg" value="5-10 kg" />
                      <Picker.Item label="10-15 kg" value="10-15 kg" />
                      <Picker.Item label="15 kg" value="15 kg" />
                      <Picker.Item label="20-25 kg" value="20-25 kg" />
                      <Picker.Item label="25-30 kg" value="25-30 kg" />
                      <Picker.Item label="30+ kg" value="30+ kg" />
                    </Picker>
                  ) : (
                    <Text style={styles.displayText}>{currentPet.weight}</Text>
                  )}
                </View>
              </View>

              {/* Sexo */}
              <View style={styles.formRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Sexo:</Text>
                  {isEditing ? (
                    <Picker
                      selectedValue={currentPet.gender}
                      style={styles.picker}
                      onValueChange={(value) => updatePetInfo("gender", value)}
                    >
                      <Picker.Item label="Macho" value="Macho" />
                      <Picker.Item label="Hembra" value="Hembra" />
                    </Picker>
                  ) : (
                    <Text style={styles.displayText}>{currentPet.gender}</Text>
                  )}
                </View>
              </View>
            </View>

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
        </View>
      </ScrollView>

      {/* Modal Agregar Mascota */}
      <Modal visible={showAddPetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Nueva Mascota</Text>
            
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
                onValueChange={(value) => setNewPet(prev => ({...prev, species: value}))}
              >
                <Picker.Item label="Perro" value="Perro" />
                <Picker.Item label="Gato" value="Gato" />
                <Picker.Item label="Conejo" value="Conejo" />
                <Picker.Item label="Hamster" value="Hamster" />
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddPetModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={addNewPet}
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
            <Text style={styles.modalTitle}>Seleccionar Dispensador</Text>
            
            <TouchableOpacity
              style={styles.dispenserOption}
              onPress={() => assignDispenser(null, "Sin asignar")}
            >
              <Ionicons name="close-circle" size={24} color="#FF5252" />
              <Text style={styles.dispenserOptionText}>Sin asignar</Text>
            </TouchableOpacity>

            {availableDispensers.map((dispenser) => (
              <View key={dispenser.id} style={styles.dispenserOptionContainer}>
                <TouchableOpacity
                  style={[
                    styles.dispenserOption,
                    dispenser.status === "Desconectado" && styles.dispenserDisabled
                  ]}
                  onPress={() => {
                    if (dispenser.status === "Conectado") {
                      assignDispenser(dispenser.id, dispenser.name);
                    }
                  }}
                  disabled={dispenser.status === "Desconectado"}
                >
                  <Ionicons 
                    name="hardware-chip" 
                    size={24} 
                    color={dispenser.status === "Conectado" ? "#4CAF50" : "#999"} 
                  />
                  <View style={styles.dispenserOptionInfo}>
                    <Text style={[
                      styles.dispenserOptionText,
                      dispenser.status === "Desconectado" && styles.dispenserDisabledText
                    ]}>
                      {dispenser.name}
                    </Text>
                    <Text style={[
                      styles.dispenserStatus,
                      dispenser.status === "Conectado" ? styles.statusConnected : styles.statusDisconnected
                    ]}>
                      {dispenser.status}
                    </Text>
                  </View>
                </TouchableOpacity>
                {dispenser.status === "Conectado" && (
                  <TouchableOpacity
                    style={styles.configDispenserButton}
                    onPress={() => openDispenserConfig(dispenser)}
                  >
                    <Ionicons name="settings" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowDispensersModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
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

  // Formulario
  formGrid: { marginBottom: 30 },
  formRow: { flexDirection: "row", marginBottom: 25 },
  inputContainer: { flex: 1, marginHorizontal: 5 },
  inputLabel: { fontSize: 16, fontWeight: "bold", color: "#000", marginBottom: 8 },
  textInput: {
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  displayText: { fontSize: 16, color: "#000", paddingVertical: 12 },
  picker: { backgroundColor: "#F5F5F5", borderRadius: 8 },

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
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 20,
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
});
