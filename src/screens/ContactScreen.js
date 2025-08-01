import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import { sendContactEmail } from '../utils/sendEmail';
import { Modal } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContactScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleSendMessage = () => {
    // Validar campos
    if (!formData.name.trim()) {
      setModalMessage('Por favor ingresa tu nombre');
      setModalVisible(true);
      return;
    }
    if (!formData.email.trim()) {
      setModalMessage('Por favor ingresa tu correo electrónico');
      setModalVisible(true);
      return;
    }
    if (!formData.message.trim()) {
      setModalMessage('Por favor escribe tu mensaje');
      setModalVisible(true);
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setModalMessage('Por favor ingresa un correo electrónico válido');
      setModalVisible(true);
      return;
    }

    // Guardar el mensaje en Firestore y enviar correo
    addDoc(collection(db, 'contactMessages'), {
      name: formData.name.trim(),
      email: formData.email.trim(),
      message: formData.message.trim(),
      createdAt: serverTimestamp()
    })
      .then(() => {
        // Enviar correo con EmailJS
        sendContactEmail({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        })
          .then(() => {
            setModalMessage('¡Mensaje enviado! Gracias por contactarnos. Te responderemos pronto.');
            setFormData({ name: '', email: '', message: '' });
            setModalVisible(true);
          })
          .catch(() => {
            setModalMessage('El mensaje se guardó pero no se pudo enviar el correo.');
            setModalVisible(true);
          });
      })
      .catch(() => {
        setModalMessage('No se pudo enviar el mensaje. Intenta de nuevo más tarde.');
        setModalVisible(true);
      });
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <View style={styles.container}>
      {/* Modal de confirmación visual */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', maxWidth: 300 }}>
            <Ionicons name="mail" size={40} color="#4CAF50" style={{ marginBottom: 10 }} />
            <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>{modalMessage}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ backgroundColor: '#4CAF50', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 10 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Contenido principal */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <Text style={styles.title}>Contáctanos</Text>
          
          {/* Formulario de contacto */}
          <View style={styles.formContainer}>
            {/* Campo Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej: Gael Maximiliano"
                placeholderTextColor="#999"
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
              />
            </View>

            {/* Campo Correo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej: gael@gmail.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
              />
            </View>

            {/* Campo Cuéntanos */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cuéntanos:</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Escribe tu mensaje aquí..."
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
                value={formData.message}
                onChangeText={(text) => updateFormData('message', text)}
              />
            </View>

            {/* Botón Enviar */}
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <Text style={styles.sendButtonText}>Enviar</Text>
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
    paddingBottom: 100, // Incrementado para evitar que se oculte tras la barra de navegación
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 30,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#000',
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    minHeight: 50,
  },
  textArea: {
    minHeight: 120,
    maxHeight: 150,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});