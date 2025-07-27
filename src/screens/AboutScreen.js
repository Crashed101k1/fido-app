import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen({ navigation }) {
  const handleErydanusPress = () => {
    Linking.openURL('https://erydanus.com');
  };

  return (
    <View style={styles.container}>
      {/* Contenido principal */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <Text style={styles.title}>Acerca De</Text>

          {/* Información del proyecto */}
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>F.I.D.O</Text>
            <Text style={styles.versionText}>Versión: 1.2.0</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Última Actualización:</Text>
              <Text style={styles.infoValue}>22/07/2025</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Desarrollado por:</Text>
              <TouchableOpacity onPress={handleErydanusPress}>
                <Text style={styles.linkText}>Erydanus Systems</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tecnologías Usadas */}
          <View style={styles.technologiesSection}>
            <Text style={styles.sectionTitle}>Tecnologías Usadas:</Text>

            <View style={styles.techContainer}>
              <View style={styles.techGrid}>
                {/* Fila 1 */}
                <View style={styles.techRow}>
                  <View style={styles.techCircle}>
                    <Image
                      source={require('../../assets/html.webp')}
                      style={styles.techLogo}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.techCircle}>
                    <Image
                      source={require('../../assets/css3.png')}
                      style={styles.techLogo}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.techCircle}>
                    <Image
                      source={require('../../assets/js.webp')}
                      style={styles.techLogo}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {/* Fila 2 */}
                <View style={styles.techRow}>
                  <View style={styles.techCircle}>
                    <Image
                      source={require('../../assets/nodeJs.png')}
                      style={styles.techLogo}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.techCircle}>
                    <Image
                      source={require('../../assets/React.png')}
                      style={styles.techLogo}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.techCircle}>
                    <Image
                      source={require('../../assets/react-native.svg')}
                      style={styles.techLogo}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {/* Fila 3 */}
                <View style={styles.techRow}>
                  <View style={styles.techCircle}>
                    <Image
                      source={require('../../assets/esp32.svg')}
                      style={styles.techLogo}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.techCircle}>
                    <Image
                      source={require('../../assets/firebase.png')}
                      style={styles.techLogo}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.techCircle}>
                    <Image
                      source={require('../../assets/expoGo.svg')}
                      style={styles.techLogo}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Mensaje de agradecimiento */}
          <View style={styles.thanksSection}>
            <Text style={styles.thanksText}>
              Agradecemos a todos los que confiaron y alos que no confiaron por darnos un motivos más para cumplir esta meta
            </Text>
            <View style={styles.pawContainer}>
              <Ionicons name="paw" size={40} color="#FFD54F" />
            </View>
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
  projectInfo: {
    marginBottom: 40,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  versionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    marginRight: 10,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  linkText: {
    fontSize: 16,
    color: '#4472C4',
    textDecorationLine: 'underline',
  },
  technologiesSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 25,
    textAlign: 'center',
  },
  techContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  techGrid: {
    alignItems: 'center',
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    width: '100%',
  },
  techCircle: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  techLogo: {
    width: 45,
    height: 45,
  },
  thanksSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  thanksText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  pawContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});