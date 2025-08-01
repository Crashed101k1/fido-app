import React, { useState } from 'react';
import Toast from '../components/Toast';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { signup } = useAuth();

  const handleRegister = async () => {
    // Validar campos vacíos
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setToast({ visible: true, message: 'Por favor completa todos los campos', type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
      return;
    }

    // Validar nombre completo (mínimo 2 palabras, solo letras y espacios)
    const nameWords = fullName.trim().split(/\s+/);
    if (nameWords.length < 2 || !/^([A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,})$/.test(fullName.trim())) {
      setToast({ visible: true, message: 'Ingresa tu nombre completo (solo letras y espacios)', type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
      return;
    }

    // Validación de email (sin espacios, formato correcto)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.includes(' ')) {
      setToast({ visible: true, message: 'Por favor ingresa un email válido y sin espacios', type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
      return;
    }

    // Validar longitud y fortaleza de contraseña
    // Debe tener al menos 6 caracteres, una mayúscula, una minúscula, un número y sin espacios
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
    if (password.length < 6) {
      setToast({ visible: true, message: 'La contraseña debe tener al menos 6 caracteres', type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
      return;
    }
    if (!passwordRegex.test(password)) {
      setToast({ visible: true, message: 'La contraseña debe tener mayúsculas, minúsculas y números', type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
      return;
    }
    if (password.includes(' ')) {
      setToast({ visible: true, message: 'La contraseña no debe contener espacios', type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setToast({ visible: true, message: 'Las contraseñas no coinciden', type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, fullName.trim());
      setShowSuccessModal(true);
    } catch (error) {
      let errorMessage = "No se pudo crear la cuenta.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Este correo ya está registrado. Intenta iniciar sesión o usa otro correo.";
          break;
        case 'auth/invalid-email':
          errorMessage = "El correo ingresado no es válido. Verifica el formato.";
          break;
        case 'auth/weak-password':
          errorMessage = "La contraseña es demasiado débil. Usa una más segura.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "El registro está temporalmente deshabilitado. Intenta más tarde.";
          break;
        default:
          errorMessage = "No se pudo crear la cuenta. Verifica tus datos o intenta más tarde.";
      }
      setToast({ visible: true, message: errorMessage, type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
      {/* Modal de éxito */}
      {showSuccessModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 32, alignItems: 'center', maxWidth: 320 }}>
            <Image source={require('../../assets/FIDO_LOGO.png')} style={{ width: 60, height: 60, marginBottom: 18 }} />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#4CAF50', marginBottom: 10 }}>¡Registro exitoso!</Text>
            <Text style={{ fontSize: 16, color: '#333', marginBottom: 24, textAlign: 'center' }}>Tu cuenta ha sido creada correctamente.</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#4CAF50', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 }}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.replace('Main');
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Ir al inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { paddingBottom: 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/FIDO_LOGO.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.mainContent}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a la comunidad FIDO</Text>
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña (mínimo 6 caracteres)"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={handleBackToLogin} disabled={loading}>
                <Text style={[styles.loginLink, loading && styles.linkDisabled]}>
                  Inicia sesión aquí
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Los estilos son similares a LoginScreen con pequeñas variaciones
const styles = StyleSheet.create({
  // ... (mismo estilo que LoginScreen con ajustes menores)
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 600,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  mainContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  registerButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  loginText: {
    color: '#7F8C8D',
    fontSize: 16,
  },
  loginLink: {
    color: '#4472C4',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  linkDisabled: {
    color: '#BDC3C7',
  },
});