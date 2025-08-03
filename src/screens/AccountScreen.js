/**
 * FIDO - Pantalla de Gestión de Cuenta de Usuario
 * 
 * Esta pantalla permite al usuario visualizar y gestionar su información
 * personal, así como obtener un resumen de sus mascotas registradas.
 * 
 * Funcionalidades principales:
 * - Visualización y edición de información personal del usuario
 * - Email de solo lectura (no editable por seguridad)
 * - Resumen de mascotas registradas con información básica
 * - Navegación rápida a gestión de mascotas
 * - Función de cierre de sesión
 * - Modo de edición toggleable para datos del perfil
 * 
 * Características de seguridad:
 * - Campo de email protegido contra edición
 * - Validación de datos antes de guardado
 * - Confirmación de acciones críticas como logout
 * 
 * Dependencias:
 * - React Native: Componentes básicos, scroll, input
 * - Expo Vector Icons: Iconografía consistente
 */

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { usePets } from '../hooks/usePets';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

/**
 * Componente principal de la pantalla de cuenta de usuario
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.navigation - Objeto de navegación de React Navigation
 * @returns {JSX.Element} Componente de pantalla de cuenta
 */
export default function AccountScreen({ navigation }) {
  
  // ============ ESTADOS LOCALES ============
  
  /** Estado que controla si la información del usuario está en modo edición */
  const [isEditing, setIsEditing] = useState(false);
  const { currentUser, userProfile, logout, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  /** 
   * Información del usuario actual - Se carga dinámicamente desde Firestore
   */
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Efecto para actualizar userInfo cuando cambie userProfile
  useEffect(() => {
    if (userProfile && currentUser) {
      setUserInfo({
        name: userProfile.displayName || currentUser.displayName || 'Usuario FIDO',
        email: userProfile.email || currentUser.email || '',
        phone: userProfile.phone || ''
      });
    }
  }, [userProfile, currentUser]);

  // Mascotas en tiempo real
  const { pets } = usePets();


  // ============ NOTIFICACIONES ============
  const { addNotification, removeNotification } = useNotifications();

  // Notificación: Faltan campos en Mi Cuenta
  useEffect(() => {
    if (!currentUser) return;
    const missingFields = !userInfo.name.trim() || !userInfo.phone.trim();
    if (missingFields) {
      addNotification({
        id: 'account-missing-fields',
        message: 'Completa tu información de cuenta para una mejor experiencia.',
        icon: 'person-circle',
        color: '#FF9800',
        onPress: () => {
          navigation.navigate('Account');
          // Solo eliminar la notificación cuando los datos estén completos (ver efecto de userInfo)
          return false;
        }
      });
    } else {
      removeNotification('account-missing-fields');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo.name, userInfo.phone, currentUser]);

  /**
   * Función para alternar entre modo de visualización y edición del perfil
   * @function handleEditProfile
   * @returns {void}
   */
  const handleEditProfile = () => {
    setIsEditing(!isEditing);
  };

  /**
   * Función para guardar los cambios realizados en el perfil
   * Incluye validación y persistencia de datos en Firestore
   * @function handleSaveProfile
   * @returns {void}
   */
  const handleSaveProfile = async () => {
    // Validar que el nombre no esté vacío
    if (!userInfo.name.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }

    // Validar formato de teléfono básico
    if (userInfo.phone && !userInfo.phone.match(/^\+?[\d\s\-\(\)]+$/)) {
      Alert.alert("Error", "Por favor ingresa un número de teléfono válido");
      return;
    }

    try {
      setLoading(true);
      
      // Actualizar datos en Firestore
      await updateUserProfile({
        displayName: userInfo.name.trim(),
        phone: userInfo.phone.trim()
      });

      setIsEditing(false);
      
      Alert.alert(
        "Perfil Actualizado", 
        "Tus datos han sido guardados exitosamente",
        [{ text: "OK" }]
      );
      
    } catch (error) {
      Alert.alert("Error", "No se pudieron guardar los cambios. Intenta de nuevo.");
      console.error('Error actualizando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para manejar el cierre de sesión del usuario
   * Navega de vuelta a la pantalla de login
   * @function handleLogout
   * @returns {void}
   */
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      // La navegación se manejará automáticamente por el AuthContext
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar sesión");
    } finally {
      setLoading(false);
    }
  };

  // ============ ESTRUCTURA DE RENDERIZADO ============

  return (
    <View style={styles.container}>
      {/* Contenedor principal con scroll para manejar contenido extenso */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          {/* Título principal de la pantalla */}
          <Text style={styles.title}>Mi Cuenta</Text>
          
          {/* Avatar del usuario */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={60} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Información del usuario */}
          <View style={styles.cardsContainer}>
            {/* Card Información Personal */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Información Personal</Text>
                <TouchableOpacity 
                  onPress={isEditing ? handleSaveProfile : handleEditProfile}
                  style={styles.editButton}
                >
                  <Ionicons 
                    name={isEditing ? "checkmark-circle" : "pencil"} 
                    size={20} 
                    color={isEditing ? "#4CAF50" : "#4472C4"} 
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={userInfo.name}
                    onChangeText={(text) => setUserInfo({...userInfo, name: text})}
                  />
                ) : (
                  <Text style={styles.infoValue}>{userInfo.name}</Text>
                )}
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <View style={styles.emailContainer}>
                  <Text style={[styles.infoValue, styles.emailText]}>{userInfo.email}</Text>
                  {isEditing && (
                    <Text style={styles.emailHint}>
                      (Este correo se vincula con tu cuenta de inicio de sesión)
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={userInfo.phone}
                    onChangeText={(text) => setUserInfo({...userInfo, phone: text})}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.infoValue}>{userInfo.phone}</Text>
                )}
              </View>
            </View>

            {/* Card Información de las Mascotas */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Mis Mascotas</Text>
                <TouchableOpacity 
                  style={styles.managePetsButton}
                  onPress={() => navigation.navigate('TabNavigator', { screen: 'MyPet' })}
                >
                  <Ionicons name="settings" size={20} color="#4CAF50" />
                  <Text style={styles.managePetsText}>Gestionar</Text>
                </TouchableOpacity>
              </View>
              
              {pets.length > 0 ? (
                <View style={styles.petsList}>
                  {pets && pets.length > 0 ? pets.map((pet) => (
                    <View key={pet.id} style={styles.petItem}>
                      <View style={styles.petInfo}>
                        <Ionicons
                          name={pet.species === 'Perro' ? 'paw' : pet.species === 'Gato' ? 'logo-octocat' : 'fish'}
                          size={20}
                          color="#4CAF50"
                          style={styles.petIcon}
                        />
                        <View style={styles.petDetails}>
                          <Text style={styles.petName}>{pet.name}</Text>
                          <Text style={styles.petBreed}>
                            {(pet.breed || pet.race || 'Sin raza')} • {(pet.age || pet.edad || 'Sin edad')}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.petStatus}>
                        <View style={[
                          styles.petStatusIndicator,
                          { backgroundColor: pet.dispenserId ? '#4CAF50' : '#E0E0E0' }
                        ]} />
                        <Text style={styles.petStatusText}>
                          {pet.dispenserId ? 'Conectado' : 'Sin Dispensador'}
                        </Text>
                      </View>
                    </View>
                  )) : (
                    <Text style={styles.noPetsText}>No tienes mascotas registradas</Text>
                  )}
                </View>
              ) : (
                <View style={styles.noPetsContainer}>
                  <Ionicons name="add-circle-outline" size={40} color="#CCC" />
                  <Text style={styles.noPetsText}>No tienes mascotas registradas</Text>
                  <TouchableOpacity 
                    style={styles.addPetButton}
                    onPress={() => navigation.navigate('TabNavigator', { screen: 'MyPet' })}
                  >
                    <Text style={styles.addPetButtonText}>Agregar Mascota</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionButtonsContainer}>
            {isEditing && (
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.logoutButton, 
                loading && styles.logoutButtonDisabled
              ]} 
              onPress={handleLogout}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.logoutButtonText}>Cerrando Sesión...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={20} color="#FFF" />
                  <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </>
              )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 25,
    justifyContent: 'space-between',
  },
  menuButton: {
    padding: 5,
  },
  menuLine: {
    width: 22,
    height: 3,
    backgroundColor: '#000',
    marginVertical: 2,
    borderRadius: 2,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  notificationButton: {
    padding: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50, // Incrementado para las pantallas del drawer (no tienen barra de navegación)
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
    textAlign: 'left',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    backgroundColor: '#9E9E9E',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  cardsContainer: {
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
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
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  managePetsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  managePetsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  petsList: {
    marginTop: 10,
  },
  petItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  petIcon: {
    marginRight: 12,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  petBreed: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  petStatus: {
    alignItems: 'flex-end',
  },
  petStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 3,
  },
  petStatusText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  noPetsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noPetsText: {
    fontSize: 14,
    color: '#999',
    marginVertical: 10,
  },
  addPetButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addPetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    flex: 2,
    textAlign: 'right',
  },
  infoInput: {
    fontSize: 14,
    color: '#000',
    flex: 2,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: '#4472C4',
    paddingBottom: 2,
  },
  emailContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  emailText: {
    color: '#666',
    fontStyle: 'italic',
  },
  emailHint: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButtonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.7,
  },
  editButton: {
    padding: 5,
    borderRadius: 15,
  },
});