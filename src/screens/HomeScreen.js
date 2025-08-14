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

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { usePets } from '../hooks/usePets';
import { getAuth } from 'firebase/auth';
import { useFeedingData, useDispenserData } from '../hooks/useFeedingData';
import { useContext } from 'react';
import { DispenserDiscoveryContext } from '../context/DispenserDiscoveryContext';
import { getPetIconInfo } from '../utils/petIcons';
import { formatDate, formatFutureDate, formatPercentageWithColor } from '../utils/dateUtils';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput
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
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectPassword, setConnectPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  // Contexto global para funciones del dispensador
  const {
    sendDispenseCommand,
    isDeviceConnected,
    mqttConnected,
    connectToDispenser,
    disconnectFromDispenser
  } = useContext(DispenserDiscoveryContext);
  const { addNotification, removeNotification } = useNotifications();
  const { pets, loading } = usePets();
  const [selectedPet, setSelectedPet] = useState(0);

  // Calcular mascota actual y hooks de datos
  const currentPet = pets && pets.length > 0 ? pets[selectedPet] : null;
  const feedingData = useFeedingData(currentPet?.id);
  const dispenserData = useDispenserData(currentPet?.dispenserId);

  // Notificación de nivel de alimento bajo o medio
  useEffect(() => {
    if (!dispenserData.loading && dispenserData.isOnline) {
      if (dispenserData.foodLevel <= 10) {
        addNotification({
          id: 'food-empty',
          message: '¡El dispensador está vacío! Por favor, rellena el alimento.',
          icon: 'alert-circle',
          color: '#F44336',
        });
      } else if (dispenserData.foodLevel <= 50) {
        addNotification({
          id: 'food-medium',
          message: 'El nivel de alimento es medio. Considera rellenar pronto.',
          icon: 'alert',
          color: '#FF9800',
        });
      } else {
        removeNotification('food-empty');
        removeNotification('food-medium');
      }
    }
  }, [dispenserData.foodLevel, dispenserData.loading, dispenserData.isOnline, addNotification, removeNotification]);

  // Debug log para datos del dispensador
  useEffect(() => {
    if (currentPet?.dispenserId) {
      console.log('[HomeScreen] ===== DEBUG DISPENSADOR =====');
      console.log('[HomeScreen] Mascota actual:', currentPet.name);
      console.log('[HomeScreen] DispenserID esperado:', currentPet.dispenserId);
      console.log('[HomeScreen] Datos del dispensador recibidos:', {
        dispenserId: currentPet.dispenserId,
        foodLevel: dispenserData.foodLevel,
        isOnline: dispenserData.isOnline,
        loading: dispenserData.loading,
        lastSync: dispenserData.lastSync
      });
      console.log('[HomeScreen] ================================');
    } else {
      // Si se desasigna el dispensador, desconectar
      if (dispenserData?.isOnline && dispenserData?.dispenserId) {
        disconnectFromDispenser(dispenserData.dispenserId);
        console.log('[HomeScreen] Dispensador desconectado por desasignación:', dispenserData.dispenserId);
      }
    }
  }, [currentPet?.dispenserId, dispenserData]);

  /**
   * Registra una alimentación inmediata en Firebase
   */
  const addFeedingRecord = async (petId, amount = null, dispenserType = 'manual') => {
    try {
      const now = new Date();
      const auth = getAuth();
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      console.log('[FIREBASE] userId a guardar:', userId);
      if (!userId) throw new Error('Usuario no autenticado');
      const docData = {
        petId: petId,
        userId: userId,
        timestamp: now.toISOString(),
        type: dispenserType,
        source: 'dispenser',
        createdAt: now.toISOString()
      };
      
      // Agregar cantidad si está disponible
      if (amount !== null) {
        docData.amount = parseFloat(amount);
        docData.amountUnit = 'grams';
      }
      
      console.log('[FIREBASE] Documento a guardar en feedingRecords:', docData);
      await addDoc(collection(db, 'feedingRecords'), docData);
      console.log('[FIREBASE] Documento guardado correctamente en feedingRecords');
    } catch (error) {
      console.error('[FIREBASE] Error guardando en feedingRecords:', error);
      throw error;
    }
  };

  // Listener para confirmaciones de dispensación desde el ESP32
  useEffect(() => {
    if (!currentPet?.dispenserId) return;
    
    const handleDispensingComplete = (data) => {
      console.log('[DISPENSING] Confirmación recibida del ESP32:', data);
      if (data.state === 'completed' && data.dispensedAmount > 0 && data.type) {
        // Registrar en Firebase con la cantidad real dispensada
        addFeedingRecord(currentPet.id, data.dispensedAmount, data.type)
          .then(() => {
            console.log('[FIREBASE] Registro automático completado');
          })
          .catch((error) => {
            console.error('[FIREBASE] Error en registro automático:', error);
          });
      }
    };

    // TODO: Agregar listener real para mensajes MQTT del dispensador
    // Esto debería conectarse al contexto MQTT para escuchar confirmaciones
    
    return () => {
      // Cleanup si es necesario
    };
  }, [currentPet?.dispenserId, addFeedingRecord]);


  useEffect(() => {
    if (!pets) return;
    
    if (pets.length === 0) {
      addNotification({
        id: 'add-first-pet',
        message: '¡Bienvenido! Añade tu primera mascota para comenzar.',
        icon: 'paw',
        color: '#4CAF50',
        onPress: () => {
          navigation.navigate('MyPet');
          return false;
        }
      });
    } else {
      removeNotification('add-first-pet');
      
      pets.forEach((pet) => {
        if (!pet.name || !pet.species || !pet.age || !pet.weight) {
          addNotification({
            id: `pet-incomplete-${pet.id}`,
            message: `Completa los datos de ${pet.name || 'tu mascota'}.`,
            icon: pet.species ? getPetIconInfo(pet.species).name : 'create',
            color: pet.species ? getPetIconInfo(pet.species).speciesColor : '#FF9800',
            onPress: () => {
              navigation.navigate('MyPet', { selectedPetId: pet.id });
              return false;
            }
          });
        } else {
          removeNotification(`pet-incomplete-${pet.id}`);
        }

        if (!pet.hasFeedingTimes || !pet.hasPortions) {
          addNotification({
            id: `pet-config-${pet.id}`,
            message: `Configura horarios y porciones para ${pet.name}.`,
            icon: pet.species ? getPetIconInfo(pet.species).name : 'time',
            color: pet.species ? getPetIconInfo(pet.species).speciesColor : '#2196F3',
            onPress: () => {
              navigation.navigate('EatTime', { selectedPetId: pet.id });
              return false;
            }
          });
        } else {
          removeNotification(`pet-config-${pet.id}`);
        }
      });
    }
  }, [pets, addNotification, removeNotification, navigation]);

  useEffect(() => {
    if (pets && pets.length > 0 && selectedPet >= pets.length) {
      setSelectedPet(0);
    }
  }, [pets, selectedPet]);

  const handleDispenseNow = async () => {
    if (!currentPet?.dispenserId) {
      Alert.alert(
        'Dispensador No Conectado',
        `${currentPet?.name || 'La mascota'} no tiene un dispensador asignado. Ve a "Mi Mascota" para conectar un dispositivo.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Mi Mascota', onPress: () => navigation.navigate('MyPet') }
        ]
      );
      return;
    }
    if (!isDeviceConnected(currentPet.dispenserId)) {
      Alert.alert(
        'Dispensador Desconectado',
        'Conecta el dispensador antes de dispensar alimento.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      console.log('[APP] Enviando comando MQTT DISPENSE a', currentPet.dispenserId, 'por 150g');
      const auth = getAuth();
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      const result = await sendDispenseCommand(currentPet.dispenserId, 150, currentPet.id, userId);
      if (result.success) {
        Alert.alert(
          'Comando Enviado',
          `Se envió comando de dispensación para ${currentPet.name}. El registro se completará automáticamente.`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          'Error',
          `No se pudo dispensar: ${result.message}`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `No se pudo dispensar: ${error.message}`,
        [{ text: "OK" }]
      );
    }
  };

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
                    <Text style={styles.dispenserStatusText}>Conectado</Text>
                  </View>
                </View>
                <View style={styles.dispenserActions}>
                  <TouchableOpacity style={styles.configButton} onPress={() => navigation.navigate('MyPet')}>
                    <Ionicons name="settings" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.dispenserDisconnectedCard}>
                <Ionicons name="alert-circle" size={30} color="#F44336" />
                <View style={styles.dispenserDetails}>
                  <Text style={styles.dispenserName}>Sin Dispensador</Text>
                  <Text style={styles.dispenserStatusText}>No hay dispositivo conectado</Text>
                </View>
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => navigation.navigate('MyPet')}
                >
                  <Text style={styles.connectButtonText}>Configurar</Text>
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
                      name={getPetIconInfo(pet.species, selectedPet === index).name}
                      size={24}
                      color={getPetIconInfo(pet.species, selectedPet === index).color}
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
                name={currentPet ? getPetIconInfo(currentPet.species).name : 'paw'}
                size={30}
                color={currentPet ? getPetIconInfo(currentPet.species).speciesColor : '#4CAF50'}
              />
              <View style={styles.currentPetDetails}>
                <Text style={styles.currentPetName}>{currentPet ? currentPet.name : 'Sin mascota'}</Text>
                <Text style={styles.currentPetSpecies}>{currentPet ? currentPet.species : ''}</Text>
              </View>
              {currentPet && (
                <View style={styles.petSelectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                </View>
              )}
            </View>
          </View>

          {/* Cards de información */}
          <View style={styles.cardsContainer}>
            {/* Card: Última Comida */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="time" size={20} color="#FF9800" />
                <Text style={styles.cardTitle}>Última Comida</Text>
              </View>
              {feedingData.loading ? (
                <Text style={styles.cardValue}>Cargando...</Text>
              ) : feedingData.noSchedules ? (
                <>
                  <Text style={styles.cardValue}>No hay horarios configurados</Text>
                  <Text style={styles.cardSubtitle}>Configura horarios primero</Text>
                </>
              ) : feedingData.feedingHistory && feedingData.feedingHistory.length > 0 ? (
                <>
                  <Text style={styles.cardValue}>
                    {feedingData.feedingHistory[0].timestamp 
                      ? new Date(feedingData.feedingHistory[0].timestamp).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : 'Sin registro'
                    }
                  </Text>
                  <Text style={styles.cardSubtitle}>Último dispensado registrado</Text>
                </>
              ) : (
                <>
                  <Text style={styles.cardValue}>Sin registro hoy</Text>
                  <Text style={styles.cardSubtitle}>No hay dispensados registrados</Text>
                </>
              )}
            </View>

            {/* Card: Próxima Comida */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="alarm" size={20} color="#2196F3" />
                <Text style={styles.cardTitle}>Próxima Comida</Text>
              </View>
              {feedingData.loading ? (
                <Text style={styles.cardValue}>Cargando...</Text>
              ) : feedingData.noSchedules ? (
                <>
                  <Text style={styles.cardValue}>No hay horarios configurados</Text>
                  <Text style={styles.cardSubtitle}>Configura horarios en la mascota</Text>
                </>
              ) : (
                <>
                  <Text style={styles.cardValue}>
                    {feedingData.nextFeed 
                      ? feedingData.nextFeed.displayTime 
                      : 'No programado'
                    }
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {feedingData.nextFeed 
                      ? (feedingData.nextFeed.isToday ? 'Hoy' : 'Mañana')
                      : 'Ve a "Configurar Horarios"'
                    }
                  </Text>
                </>
              )}
            </View>

            {/* Card: Progreso Hoy */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.cardTitle}>Progreso Hoy</Text>
              </View>
              {feedingData.loading ? (
                <Text style={styles.cardValue}>Cargando...</Text>
              ) : feedingData.noSchedules ? (
                <>
                  <Text style={styles.cardValue}>Sin horarios</Text>
                  <Text style={styles.cardSubtitle}>Configura horarios de alimentación</Text>
                </>
              ) : (
                <View style={styles.cardProgressContainer}>
                  <Text style={styles.cardValue}>
                    {`${feedingData.todayProgress?.completed || 0}/${feedingData.todayProgress?.total || 0}`}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: `${feedingData.todayProgress?.percentage || 0}%`,
                          backgroundColor: (feedingData.todayProgress?.percentage || 0) >= 100 ? '#4CAF50' : '#2196F3'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {`${feedingData.todayProgress?.percentage || 0}%`}
                  </Text>
                </View>
              )}
              <Text style={styles.cardSubtitle}>
                {feedingData.noSchedules ? 'Ve a "Configurar Horarios"' : 'Porciones completadas hoy'}
              </Text>
            </View>

            {/* Card: Nivel de Alimento */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons 
                  name="restaurant" 
                  size={20} 
                  color={formatPercentageWithColor(dispenserData.foodLevel).color} 
                />
                <Text style={styles.cardTitle}>Nivel de Alimento</Text>
              </View>
              {dispenserData.loading ? (
                <Text style={styles.cardValue}>Conectando...</Text>
              ) : (
                <View style={styles.cardProgressContainer}>
                  <Text 
                    style={[
                      styles.cardValue, 
                      { color: formatPercentageWithColor(dispenserData.foodLevel).color }
                    ]}
                  >
                    {formatPercentageWithColor(dispenserData.foodLevel).text}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: `${dispenserData.foodLevel}%`,
                          backgroundColor: formatPercentageWithColor(dispenserData.foodLevel).color
                        }
                      ]} 
                    />
                  </View>
                  {dispenserData.isOnline && (
                    <View style={styles.onlineIndicator}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>En línea</Text>
                    </View>
                  )}
                </View>
              )}
              <Text style={styles.cardSubtitle}>
                {currentPet?.dispenserId 
                  ? (dispenserData.isOnline ? 'Dispensador activo' : 'Dispensador offline')
                  : 'Sin dispensador'
                }
              </Text>
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
  petSelectedIndicator: {
    marginLeft: 10,
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
  cardProgressContainer: {
    alignItems: 'center',
    marginVertical: 5,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  onlineText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
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
