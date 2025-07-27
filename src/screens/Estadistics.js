/**
 * FIDO - Pantalla de Estadísticas
 * 
 * Esta pantalla muestra información sobre estadísticas de alimentación
 * y redirige al usuario al sitio web oficial para ver análisis detallados.
 * 
 * Funcionalidades principales:
 * - Visualización de información de estadísticas
 * - Redirección al sitio web oficial (www.fido.com)
 * - Presentación de características disponibles en la web
 * - Diseño responsive con scroll para contenido extenso
 * 
 * Dependencias:
 * - React Native: Para componentes de UI y funcionalidades móviles
 * - Expo Vector Icons: Para iconografía consistente
 * - Linking API: Para abrir URLs externas
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente principal de la pantalla de Estadísticas
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.navigation - Objeto de navegación de React Navigation
 * @returns {JSX.Element} Componente de pantalla de estadísticas
 */
export default function EstadisticsScreen({ navigation }) {
  /**
   * Función para manejar la apertura del sitio web oficial
   * 
   * Utiliza la API Linking de React Native para abrir el sitio web oficial
   * de FIDO en el navegador del dispositivo. Incluye manejo de errores
   * para casos donde el enlace no puede ser abierto.
   * 
   * Flujo de ejecución:
   * 1. Verifica si el dispositivo puede abrir la URL
   * 2. Si es compatible, abre la URL en el navegador
   * 3. Si no es compatible o hay error, muestra un Alert informativo
   * 
   * @async
   * @function handleOpenWebsite
   * @returns {Promise<void>} Promise que se resuelve cuando se completa la operación
   */
  const handleOpenWebsite = async () => {
    const url = 'https://www.fido.com';
    
    try {
      // Verificar si el dispositivo puede abrir la URL
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        // Abrir la URL en el navegador del dispositivo
        await Linking.openURL(url);
      } else {
        // Mostrar error si la URL no es compatible
        Alert.alert(
          'Error',
          'No se puede abrir el enlace. Por favor, visita www.fido.com desde tu navegador web.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Manejo de errores generales durante la apertura del enlace
      Alert.alert(
        'Error',
        'Hubo un problema al abrir el enlace. Por favor, visita www.fido.com desde tu navegador web.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Estructura de renderizado de la pantalla
   * 
   * La pantalla está organizada en las siguientes secciones:
   * 1. Contenedor principal con scroll vertical
   * 2. Sección de encabezado con icono y títulos
   * 3. Mensaje principal con call-to-action
   * 4. Grid de características disponibles en la web
   * 5. Sección final de llamada a la acción
   */
  return (
    <View style={styles.container}>
      {/* Contenedor de scroll para manejar contenido que excede la pantalla */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          {/* Sección de encabezado con icono principal y títulos */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="analytics" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.title}>Estadísticas</Text>
            <Text style={styles.subtitle}>Análisis completo de alimentación</Text>
          </View>
          
          {/* Sección de mensaje principal con información y botón de enlace */}
          <View style={styles.messageContainer}>
            {/* Icono informativo para el mensaje principal */}
            <View style={styles.messageIcon}>
              <Ionicons name="information-circle" size={40} color="#4CAF50" />
            </View>
            
            {/* Texto explicativo sobre las estadísticas */}
            <Text style={styles.message}>
              Para acceder a las estadísticas detalladas que generamos en base a la alimentación de tu mascota
            </Text>
            
            {/* Texto enfatizado para dirigir la acción del usuario */}
            <Text style={styles.emphasizedText}>
              Visita nuestro sitio web oficial
            </Text>
            
            {/* Botón principal para acceder al sitio web de FIDO */}
            <TouchableOpacity 
              style={styles.websiteButton}
              onPress={handleOpenWebsite}
            >
              <Ionicons name="globe" size={24} color="#FFFFFF" />
              <Text style={styles.websiteButtonText}>www.fido.com</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Sección de características disponibles en el sitio web */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>¿Qué encontrarás?</Text>
            
            {/* Grid de 2x2 con las características principales del sitio web */}
            <View style={styles.featureGrid}>
              {/* Tarjeta 1: Gráficos Detallados */}
              <View style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="bar-chart" size={30} color="#4CAF50" />
                </View>
                <Text style={styles.featureTitle}>Gráficos Detallados</Text>
                <Text style={styles.featureDescription}>
                  Visualiza patrones de alimentación y tendencias
                </Text>
              </View>
              
              {/* Tarjeta 2: Análisis de Progreso */}
              <View style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="trending-up" size={30} color="#2196F3" />
                </View>
                <Text style={styles.featureTitle}>Análisis de Progreso</Text>
                <Text style={styles.featureDescription}>
                  Seguimiento del desarrollo nutricional
                </Text>
              </View>
              
              {/* Tarjeta 3: Reportes Personalizados */}
              <View style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="document-text" size={30} color="#FF9800" />
                </View>
                <Text style={styles.featureTitle}>Reportes Personalizados</Text>
                <Text style={styles.featureDescription}>
                  Informes adaptados a cada mascota
                </Text>
              </View>
              
              {/* Tarjeta 4: Exportar Datos */}
              <View style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="cloud-download" size={30} color="#9C27B0" />
                </View>
                <Text style={styles.featureTitle}>Exportar Datos</Text>
                <Text style={styles.featureDescription}>
                  Descarga información para veterinarios
                </Text>
              </View>
            </View>
          </View>
          
          {/* Sección final de llamada a la acción */}
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaText}>
              ¡Descubre todo el potencial de FIDO en la web!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Estilos para la pantalla de Estadísticas
 * 
 * Estructura de estilos:
 * - Contenedores principales y de scroll
 * - Sección de encabezado con icono y títulos
 * - Contenedor de mensaje principal con botón
 * - Grid de características en formato 2x2
 * - Sección de llamada a la acción final
 * 
 * Características del diseño:
 * - Diseño responsive para diferentes tamaños de pantalla
 * - Sombras y elevaciones para profundidad visual
 * - Colores consistentes con la paleta de FIDO
 * - Scroll vertical para contenido extenso
 */
const styles = StyleSheet.create({
  // ============ CONTENEDORES PRINCIPALES ============
  /** Contenedor raíz de toda la pantalla */
  container: {
    flex: 1,
    backgroundColor: '#E0D5F7', // Color de fondo principal (lila claro)
  },
  /** Contenedor del scroll para manejar contenido largo */
  scrollContainer: {
    flex: 1,
  },
  /** Configuración del contenido interno del scroll */
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Espacio extra al final para evitar cortes
  },
  /** Contenedor principal del contenido con padding horizontal */
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  
  // ============ SECCIÓN DE ENCABEZADO ============
  /** Contenedor de la sección de encabezado con icono y títulos */
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  /** Contenedor del icono principal con fondo blanco y sombra */
  iconContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8, // Sombra para Android
  },
  /** Estilo del título principal */
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  /** Estilo del subtítulo descriptivo */
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  
  // ============ SECCIÓN DE MENSAJE PRINCIPAL ============
  /** Contenedor principal del mensaje con borde verde y sombra */
  messageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6, // Sombra para Android
    borderWidth: 2,
    borderColor: '#4CAF50', // Borde verde de marca
    alignItems: 'center',
  },
  /** Contenedor del icono informativo del mensaje */
  messageIcon: {
    marginBottom: 15,
  },
  /** Estilo del texto principal del mensaje */
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
  },
  /** Texto enfatizado para dirigir la acción */
  emphasizedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50', // Color verde de marca
    textAlign: 'center',
    marginBottom: 25,
  },
  /** Botón principal para acceder al sitio web */
  websiteButton: {
    backgroundColor: '#4CAF50', // Fondo verde de marca
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5, // Sombra para Android
    minWidth: 200, // Ancho mínimo para mantener proporción
  },
  /** Texto del botón del sitio web */
  websiteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  
  // ============ SECCIÓN DE CARACTERÍSTICAS ============
  /** Contenedor principal de las características del sitio web */
  featuresContainer: {
    marginBottom: 30,
  },
  /** Título de la sección de características */
  featuresTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  /** Grid en formato 2x2 para las tarjetas de características */
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  /** Tarjeta individual de característica */
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '48%', // Dos columnas (48% cada una con espacio entre ellas)
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4, // Sombra para Android
    borderWidth: 1,
    borderColor: '#F0F0F0', // Borde sutil para definición
  },
  /** Contenedor del icono de cada característica */
  featureIconContainer: {
    backgroundColor: '#F8F9FA', // Fondo gris claro
    borderRadius: 25,
    padding: 15,
    marginBottom: 12,
  },
  /** Título de cada característica */
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  /** Descripción de cada característica */
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // ============ SECCIÓN DE LLAMADA A LA ACCIÓN FINAL ============
  /** Contenedor de la llamada a la acción final */
  ctaContainer: {
    backgroundColor: '#4CAF50', // Fondo verde de marca
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  /** Texto de la llamada a la acción final */
  ctaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
