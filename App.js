/**
 * FIDO - Aplicación Principal
 * 
 * Punto de entrada principal de la aplicación FIDO (Facilitador Inteligente 
 * de Dietas Organizadas). Esta aplicación permite a los usuarios gestionar
 * la alimentación de sus mascotas a través de dispensadores inteligentes.
 * 
 * Funcionalidades principales de la aplicación:
 * - Sistema de autenticación con pantalla de login
 * - Dashboard principal con estado de dispensadores
 * - Gestión multi-mascota con configuración individual
 * - Programación de horarios de alimentación
 * - Configuración de porciones personalizadas
 * - Estadísticas y análisis (disponibles en sitio web)
 * - Gestión de perfil de usuario
 * 
 * Arquitectura de navegación:
 * - Stack Navigator principal: Maneja autenticación y aplicación principal
 * - Tab Navigator: Navegación entre pantallas principales
 * - Drawer Navigator: Menú lateral con opciones adicionales
 * 
 * Tecnologías utilizadas:
 * - React Native: Framework principal
 * - React Navigation v6: Sistema de navegación
 * - Expo: Herramientas de desarrollo y íconos
 * - React Native Picker: Selectores de opciones
 * 
 * @version 1.2.0
 * @author Equipo FIDO
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainNavigator from './src/Navigation/MainNavigator';

// Crear instancia del Stack Navigator principal
const Stack = createStackNavigator();

/**
 * Componente principal de la aplicación
 * 
 * Configura la estructura de navegación de nivel superior que maneja:
 * - Pantalla de autenticación (Login)
 * - Navegador principal de la aplicación (MainNavigator)
 * 
 * La aplicación inicia en la pantalla de Login y, tras la autenticación
 * exitosa, navega al MainNavigator que contiene toda la funcionalidad
 * principal de la aplicación.
 * 
 * @returns {JSX.Element} Componente raíz de la aplicación
 */
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login" // Pantalla inicial de la aplicación
        screenOptions={{ headerShown: false }} // Ocultar headers por defecto
      >
        {/* Pantalla de autenticación */}
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Pantalla de registro */}
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Navegador principal de la aplicación */}
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}