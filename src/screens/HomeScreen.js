/**
 * FIDO - Pantalla Principal (Dashboard)
 * 
 * Esta es la pantalla principal de la aplicación que muestra el estado
 * del dispensador y la información de las mascotas del usuario.
 * 
 * Funcionalidades principales:
 * - Mostrar estado de conectividad del dispensador (prioridad principal)
 * - Selector de mascotas con navegación horizontal
 * - Información de alimentación de la mascota seleccionada
 * - Opciones de dispensado manual y navegación a otras pantallas
 * - Visualización de estadísticas básicas de alimentación
 * 
 * Arquitectura:
 * - Sistema multi-mascota con selector dinámico
 * - Estado del dispensador como información prioritaria
 * - Integración con navegación de React Navigation
 * 
 * Dependencias:
 * - React Native: Componentes básicos de UI y scroll
 * - Expo Vector Icons: Iconografía consistente
 * - React Navigation: Navegación entre pantallas
 */

import React, { useState } from 'react';
import { usePets } from '../hooks/usePets';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente principal de la pantalla de inicio
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.navigation - Objeto de navegación de React Navigation
 * @returns {JSX.Element} Componente de pantalla principal
 */
export default function HomeScreen({ navigation }) {
  // ============ ESTADO LOCAL ============
  const { pets, loading } = usePets();
  const [selectedPet, setSelectedPet] = useState(0);

  // ============ DATOS DERIVADOS ============
  
  /** Referencia a la mascota actualmente seleccionada */
  const currentPet = pets && pets.length > 0 ? pets[selectedPet] : null;

  // ============ FUNCIONES DE MANEJO DE EVENTOS ============

  /**
   * Función para manejar el dispensado manual de comida
   * 
   * Verifica que la mascota tenga un dispensador conectado antes de permitir
   * el dispensado. Si no tiene dispensador, muestra un alert con opciones
   * para navegar a la pantalla de configuración.
   * 
   * Flujo de ejecución:
   * 1. Verificar si la mascota tiene dispensador asignado
   * 2. Si no tiene, mostrar alert con opción de ir a configuración
   * 3. Si tiene, proceder con el dispensado y mostrar confirmación
   * 
   * @function handleDispenseNow
   * @returns {void}
   */
  const handleDispenseNow = () => {
    if (!currentPet.dispenserId) {
      Alert.alert(
        'Dispensador No Conectado',
        `${currentPet.name} no tiene un dispensador asignado. Ve a "Mi Mascota" para conectar un dispositivo.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Mi Mascota', onPress: () => navigation.navigate('MyPet') }
        ]
      );
      return;
    }

    // Si la mascota tiene dispensador conectado, proceder con el dispensado
    Alert.alert(
      'Dispensando Comida',
      `Dispensando porción para ${currentPet.name}...`,
      [{ text: "OK" }]
    );
  };

  // ============ ESTRUCTURA DE RENDERIZADO ============
  
  /**
   * Estructura de la pantalla principal:
   * 1. Estado del dispensador (información prioritaria)
   * 2. Selector de mascotas horizontal
   * 3. Información de la mascota seleccionada
   * 4. Botones de acción principal
   * 5. Accesos rápidos a otras pantallas
   */
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <Text style={styles.title}>Dashboard</Text>

          {/* Estado del Dispensador */}
          <View style={styles.dispenserStatusContainer}>
            <Text style={styles.sectionTitle}>Estado del Dispensador</Text>
            {currentPet && currentPet.dispenserId ? (
              <View style={styles.dispenserConnectedCard}>
                <View style={styles.dispenserInfo}>
                  <Ionicons name="hardware-chip" size={30} color="#4CAF50" />
                  <View style={styles.dispenserDetails}>
                    <Text style={styles.dispenserName}>
                      {currentPet.dispenserName || `Dispensador ${currentPet.dispenserId}`}
                    </Text>
                    <Text style={styles.dispenserStatusText}>✓ Conectado y Activo</Text>
                  </View>
                </View>
                <View style={styles.dispenserActions}>
                  <TouchableOpacity style={styles.configButton} onPress={() => {}}>
                    <Ionicons name="settings" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.dispenserDisconnectedCard}>
                <Ionicons name="alert-circle" size={30} color="#F44336" />
                <View style={styles.dispenserDetails}>
                  <Text style={styles.dispenserName}>Sin Dispensador</Text>
                  <Text style={styles.dispenserStatusText}>⚠️ No hay dispositivo conectado</Text>
                </View>
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => navigation.navigate('MyPet')}
                >
                  <Text style={styles.connectButtonText}>Conectar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Selector de Mascotas */}
          <View style={styles.petSelectorContainer}>
            <Text style={styles.sectionTitle}>Seleccionar Mascota</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.petSelectorScroll}
            >
              {pets && pets.length > 0 ? (
                pets.map((pet, index) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petSelectorCard,
                      selectedPet === index && styles.petSelectorCardActive
                    ]}
                    onPress={() => setSelectedPet(index)}
                  >
                    <Ionicons
                      name={pet.species === 'Perro' ? 'paw' : 'fish'}
                      size={24}
                      color={selectedPet === index ? '#FFFFFF' : '#4CAF50'}
                    />
                    <Text style={[
                      styles.petSelectorName,
                      selectedPet === index && styles.petSelectorNameActive
                    ]}>
                      {pet.name}
                    </Text>
                    {pet.dispenserId && (
                      <View style={styles.dispenserIndicator}>
                        <Ionicons name="hardware-chip" size={12} color={selectedPet === index ? '#FFFFFF' : '#666'} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ color: '#666', marginTop: 10 }}>No tienes mascotas registradas.</Text>
              )}
            </ScrollView>
          </View>

          {/* Información de mascota actual */}
          <View style={styles.currentPetInfo}>
            <View style={styles.currentPetHeader}>
              <Ionicons
                name={currentPet && currentPet.species === 'Perro' ? 'paw' : 'fish'}
                size={30}
                color="#4CAF50"
              />
              <View style={styles.currentPetDetails}>
                <Text style={styles.currentPetName}>{currentPet ? currentPet.name : 'Sin mascota'}</Text>
                <Text style={styles.currentPetSpecies}>{currentPet ? currentPet.species : ''}</Text>
              </View>
            </View>
          </View>

          {/* Cards de información */}
          <View style={styles.cardsContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="time" size={20} color="#FF9800" />
                <Text style={styles.cardTitle}>Última Comida</Text>
              </View>
              <Text style={styles.cardValue}>{currentPet && currentPet.lastFeed ? currentPet.lastFeed : 'Sin registro'}</Text>
              <Text style={styles.cardSubtitle}>Registro más reciente</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="alarm" size={20} color="#2196F3" />
                <Text style={styles.cardTitle}>Próxima Comida</Text>
              </View>
              <Text style={styles.cardValue}>{currentPet && currentPet.nextFeed ? currentPet.nextFeed : 'No programado'}</Text>
              <Text style={styles.cardSubtitle}>Siguiente horario programado</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.cardTitle}>Progreso Hoy</Text>
              </View>
              <Text style={styles.cardValue}>
                {currentPet && typeof currentPet.completedToday === 'number' && typeof currentPet.dailyPortions === 'number'
                  ? `${currentPet.completedToday}/${currentPet.dailyPortions}`
                  : '0/0'}
              </Text>
              <Text style={styles.cardSubtitle}>Porciones completadas</Text>
            </View>
          </View>

          {/* Botón dispensar */}
          <View style={styles.dispenseContainer}>
            <TouchableOpacity
              style={[
                styles.dispenseButton,
                !(currentPet && currentPet.dispenserId) && styles.dispenseButtonDisabled
              ]}
              onPress={handleDispenseNow}
              disabled={!(currentPet && currentPet.dispenserId)}
            >
              <Ionicons
                name="restaurant"
                size={40}
                color={currentPet && currentPet.dispenserId ? "#FFFFFF" : "#999"}
              />
            </TouchableOpacity>
            <Text style={[
              styles.dispenseText,
              !(currentPet && currentPet.dispenserId) && styles.dispenseTextDisabled
            ]}>
              {currentPet && currentPet.dispenserId ? 'Dispensar Ahora' : 'Sin Dispensador'}
            </Text>
          </View>

          {/* Acciones rápidas */}
          <View style={styles.quickActionContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('EatTime', { selectedPetIndex: selectedPet })}
            >
              <Ionicons name="time" size={16} color="#4472C4" />
              <Text style={styles.quickActionText}>Configurar Horarios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0D5F7',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },

  // Estado del dispensador
  dispenserStatusContainer: {
    marginBottom: 25,
  },
  dispenserConnectedCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dispenserDisconnectedCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dispenserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dispenserDetails: {
    marginLeft: 15,
    flex: 1,
  },
  dispenserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  dispenserStatusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dispenserActions: {
    alignItems: 'center',
  },
  configButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  connectButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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

  // Cards de información
  cardsContainer: {
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // Botón dispensar
  dispenseContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  dispenseButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  dispenseButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  dispenseText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 5,
  },
  dispenseTextDisabled: {
    color: '#999',
  },

  // Acciones rápidas
  quickActionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4472C4',
  },
  quickActionText: {
    fontSize: 14,
    color: '#4472C4',
    fontWeight: '600',
    marginLeft: 8,
  },
});
