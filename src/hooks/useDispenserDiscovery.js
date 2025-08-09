/**
 * Hook para descubrimiento y control de dispensadores MQTT REALES
 * 
 * Conexión directa con dispensadores físicos ESP32 via MQTT
 * SIN SIMULACIONES - Solo hardware real
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

export function useDispenserDiscovery() {
  // Estados del hook
  const [discoveredDispensers, setDiscoveredDispensers] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [connectedDevices, setConnectedDevices] = useState(new Set());
  
  // Referencias
  const mqttClient = useRef(null);
  const scanTimeout = useRef(null);
  const messageHandlers = useRef(new Map());
  const clientLoaded = useRef(false);

  // Configuración MQTT (broker shiftr.io)
  const MQTT_CONFIG = {
    host: 'eridanus.cloud.shiftr.io',
    port: 1883,
    websocketPort: 443,
    username: 'eridanus',
    password: 'Aeui6hvnooMPWo2j',
    clientId: `fido_app_${Date.now()}`,
    topics: {
      discovery: 'fido/dispensers/discovery',
      status: 'fido/dispensers/+/status',
      data: 'fido/dispensers/+/data',
      commands: 'fido/dispensers/{deviceId}/commands',
      response: 'fido/dispensers/+/response'
    }
  };

  /**
   * Cargar cliente MQTT según la plataforma
   */
  const loadMQTTClient = useCallback(async () => {
    if (clientLoaded.current) return true;
    
    try {
      if (Platform.OS === 'web') {
        // Para web: cargar mqtt.js desde CDN
        if (typeof window !== 'undefined' && !window.mqtt) {
          console.log('[MQTT] 🔄 Cargando cliente web desde CDN...');
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js';
            script.timeout = 10000; // Timeout de 10 segundos
            
            script.onload = () => {
              // Verificar que mqtt esté disponible
              if (window.mqtt && typeof window.mqtt.connect === 'function') {
                console.log('[MQTT] ✅ Cliente web cargado desde CDN');
                clientLoaded.current = true;
                resolve(true);
              } else {
                console.error('[MQTT] ❌ mqtt.connect no disponible después de cargar');
                reject(new Error('mqtt.connect no es una función después de cargar CDN'));
              }
            };
            
            script.onerror = () => {
              console.error('[MQTT] ❌ Error cargando cliente web');
              reject(new Error('Error cargando mqtt.js desde CDN'));
            };
            
            // Timeout manual
            setTimeout(() => {
              if (!clientLoaded.current) {
                console.error('[MQTT] ⏱️ Timeout cargando cliente web');
                reject(new Error('Timeout cargando mqtt.js desde CDN'));
              }
            }, 10000);
            
            document.head.appendChild(script);
          });
        } else if (window.mqtt && typeof window.mqtt.connect === 'function') {
          console.log('[MQTT] ✅ Cliente web ya disponible');
          clientLoaded.current = true;
          return true;
        } else {
          console.error('[MQTT] ❌ window.mqtt no tiene función connect');
          return false;
        }
      } else {
        // Para React Native: importar directamente
        console.log('[MQTT] 🔄 Cargando cliente React Native...');
        const mqtt = require('mqtt');
        if (mqtt && typeof mqtt.connect === 'function') {
          console.log('[MQTT] ✅ Cliente React Native cargado');
          clientLoaded.current = true;
          return true;
        } else {
          console.error('[MQTT] ❌ mqtt.connect no es una función en React Native');
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('[MQTT] Error cargando cliente:', error);
      return false;
    }
  }, []);

  /**
   * Procesar mensaje MQTT entrante
   */
  const handleMQTTMessage = useCallback((topic, payload) => {
    try {
      const message = JSON.parse(payload.toString());
      console.log('[MQTT] Mensaje recibido:', topic, message);
      
      // Manejar status de dispositivos
      if (topic.includes('/status')) {
        const deviceId = topic.split('/')[2];
        setDiscoveredDispensers(prev => {
          const existing = prev.find(d => d.deviceId === deviceId);
          const updated = {
            deviceId,
            name: message.name || `Dispensador ${deviceId.slice(-4)}`,
            ...message,
            lastSeen: new Date(),
            isAvailable: true,
            isConnected: connectedDevices.has(deviceId)
          };
          
          if (existing) {
            return prev.map(d => d.deviceId === deviceId ? updated : d);
          } else {
            return [...prev, updated];
          }
        });
      }
      
      // Manejar datos de sensores
      if (topic.includes('/data')) {
        const deviceId = topic.split('/')[2];
        setDiscoveredDispensers(prev => 
          prev.map(d => 
            d.deviceId === deviceId 
              ? { ...d, ...message, lastSeen: new Date() }
              : d
          )
        );
      }
      
      // Manejar respuestas de comandos
      if (topic.includes('/response')) {
        console.log('[MQTT] 📨 Respuesta recibida:', message);
        const deviceId = topic.split('/')[2];
        
        // Buscar handler por command o action
        const commandKey = message.command || message.action || '';
        const handlerKey = `${deviceId}_${commandKey}`;
        
        console.log('[MQTT] 🔍 Buscando handler:', handlerKey);
        console.log('[MQTT] 📋 Handlers disponibles:', Array.from(messageHandlers.current.keys()));
        
        const handler = messageHandlers.current.get(handlerKey);
        if (handler) {
          console.log('[MQTT] ✅ Handler encontrado, ejecutando...');
          handler(message);
          messageHandlers.current.delete(handlerKey);
        } else {
          console.warn('[MQTT] ⚠️ No se encontró handler para:', handlerKey);
        }
      }
      
    } catch (error) {
      console.error('[MQTT] Error procesando mensaje:', error);
    }
  }, [connectedDevices]);

  /**
   * Inicializar conexión MQTT real
   */
  const initMQTTClient = useCallback(async () => {
    try {
      console.log('[MQTT] 🚀 Iniciando conexión MQTT...');
      
      // Primero cargar el cliente
      const loaded = await loadMQTTClient();
      if (!loaded) {
        const error = 'Cliente MQTT no disponible para esta plataforma';
        console.error('[MQTT] ❌', error);
        setConnectionStatus(error);
        return false;
      }

      setConnectionStatus('Conectando a broker MQTT...');
      
      if (Platform.OS === 'web') {
        // Para web: usar mqtt desde window global
        if (!window.mqtt || typeof window.mqtt.connect !== 'function') {
          const error = 'Error: mqtt.js no cargado correctamente';
          console.error('[MQTT] ❌', error);
          setConnectionStatus(error);
          return false;
        }

        const brokerUrl = `wss://${MQTT_CONFIG.username}:${MQTT_CONFIG.password}@${MQTT_CONFIG.host}`;
        console.log('[MQTT] 🌐 Conectando vía WSS a:', brokerUrl);
        
        try {
          mqttClient.current = window.mqtt.connect(brokerUrl, {
            clientId: MQTT_CONFIG.clientId,
            keepalive: 60,
            reconnectPeriod: 5000,
            clean: true,
            connectTimeout: 10000
          });
        } catch (connectError) {
          console.error('[MQTT] ❌ Error en window.mqtt.connect:', connectError);
          setConnectionStatus('Error: Fallo en conexión web');
          return false;
        }

      } else {
        // Para React Native: usar require normal
        console.log('[MQTT] 📱 Conectando vía TCP...');
        try {
          const mqtt = require('mqtt');
          if (!mqtt || typeof mqtt.connect !== 'function') {
            throw new Error('mqtt.connect no es una función en React Native');
          }
          
          const brokerUrl = `mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`;
          
          mqttClient.current = mqtt.connect(brokerUrl, {
            clientId: MQTT_CONFIG.clientId,
            username: MQTT_CONFIG.username,
            password: MQTT_CONFIG.password,
            keepalive: 60,
            reconnectPeriod: 5000,
            clean: true,
            connectTimeout: 10000
          });
        } catch (connectError) {
          console.error('[MQTT] ❌ Error en mqtt.connect (React Native):', connectError);
          setConnectionStatus('Error: Fallo en conexión móvil');
          return false;
        }
      }

      // Verificar que el cliente se creó correctamente
      if (!mqttClient.current) {
        console.error('[MQTT] ❌ Cliente MQTT no se creó');
        setConnectionStatus('Error: Cliente MQTT no creado');
        return false;
      }

      // Configurar eventos comunes
      mqttClient.current.on('connect', () => {
        console.log('[MQTT] ✅ Conectado al broker');
        setMqttConnected(true);
        setConnectionStatus('Conectado al broker MQTT');
        
        // Suscribirse a tópicos
        const topics = [
          MQTT_CONFIG.topics.discovery,
          MQTT_CONFIG.topics.status,
          MQTT_CONFIG.topics.data,
          MQTT_CONFIG.topics.response
        ];
        
        mqttClient.current.subscribe(topics, { qos: 1 });
        console.log('[MQTT] Suscrito a tópicos:', topics);
      });

      mqttClient.current.on('error', (err) => {
        console.error('[MQTT] ❌ Error:', err);
        setMqttConnected(false);
        setConnectionStatus('Error de conexión MQTT: ' + err.message);
      });

      mqttClient.current.on('disconnect', () => {
        console.log('[MQTT] 🔌 Desconectado');
        setMqttConnected(false);
        setConnectionStatus('Desconectado del broker');
      });

      mqttClient.current.on('message', handleMQTTMessage);
      
      return true;
      
    } catch (error) {
      console.error('[MQTT] Error inicializando:', error);
      setConnectionStatus('Error: ' + error.message);
      return false;
    }
  }, [loadMQTTClient, handleMQTTMessage]);

  /**
   * Función auxiliar para publicar mensajes MQTT
   */
  const publishMessage = useCallback((topic, payload) => {
    if (!mqttClient.current) return false;
    
    try {
      // Usar mqtt.js para ambas plataformas
      mqttClient.current.publish(topic, JSON.stringify(payload), { qos: 1 });
      return true;
    } catch (error) {
      console.error('[MQTT] Error publicando:', error);
      return false;
    }
  }, []);

  /**
   * Buscar dispensadores físicos reales
   */
  const rescanDevices = useCallback(async () => {
    if (!mqttConnected || isScanning) return;
    
    setIsScanning(true);
    setConnectionStatus('Buscando dispensadores físicos...');
    setDiscoveredDispensers([]);
    
    // Enviar comando de descubrimiento
    const discoveryMsg = {
      action: 'discover',
      timestamp: new Date().toISOString(),
      from: MQTT_CONFIG.clientId
    };
    
    const published = publishMessage(MQTT_CONFIG.topics.discovery, discoveryMsg);
    
    if (published) {
      console.log('[DISCOVERY] 📡 Mensaje enviado');
    } else {
      console.error('[DISCOVERY] ❌ Error enviando mensaje');
    }
    
    // Timeout de búsqueda
    scanTimeout.current = setTimeout(() => {
      setIsScanning(false);
      setConnectionStatus(
        discoveredDispensers.length > 0 
          ? `${discoveredDispensers.length} dispensador(es) encontrado(s)`
          : 'No se encontraron dispensadores físicos'
      );
    }, 8000);
    
  }, [mqttConnected, isScanning, discoveredDispensers.length, publishMessage]);

  /**
   * Conectar a dispensador físico
   */
  const connectToDispenser = useCallback((deviceId, password = 'FIDO2025') => {
    return new Promise((resolve, reject) => {
      if (!mqttConnected) {
        reject(new Error('Sin conexión MQTT'));
        return;
      }

      const commandTopic = MQTT_CONFIG.topics.commands.replace('{deviceId}', deviceId);
      const connectMsg = {
        action: 'connect',
        password: password,
        timestamp: new Date().toISOString(),
        from: MQTT_CONFIG.clientId
      };

      // Handler para respuesta
      const handleResponse = (response) => {
        console.log('[CONNECT] 📨 Respuesta recibida:', response);
        
        if (response.result === 'success') {
          console.log('[CONNECT] ✅ Conexión exitosa');
          setConnectedDevices(prev => new Set([...prev, deviceId]));
          setDiscoveredDispensers(prev => 
            prev.map(d => 
              d.deviceId === deviceId 
                ? { ...d, isConnected: true }
                : d
            )
          );
          setConnectionStatus(`Conectado a ${deviceId}`);
          resolve({ success: true, message: 'Conexión exitosa' });
        } else {
          console.log('[CONNECT] ❌ Error de conexión:', response.message);
          reject(new Error(response.message || 'Error de conexión'));
        }
      };

      // Registrar handler temporal
      messageHandlers.current.set(`${deviceId}_connect`, handleResponse);
      
      // Timeout
      setTimeout(() => {
        if (messageHandlers.current.has(`${deviceId}_connect`)) {
          messageHandlers.current.delete(`${deviceId}_connect`);
          reject(new Error('Timeout: Dispensador no respondió'));
        }
      }, 10000);

      // Enviar comando
      const published = publishMessage(commandTopic, connectMsg);
      if (!published) {
        messageHandlers.current.delete(`${deviceId}_connect`);
        reject(new Error('Error enviando comando MQTT'));
        return;
      }
      console.log('[CONNECT] 📤 Comando enviado a', deviceId);
    });
  }, [mqttConnected, publishMessage]);

  /**
   * Enviar comando de dispensación real
   */
  const sendDispenseCommand = useCallback((deviceId, amount = 150) => {
    return new Promise((resolve, reject) => {
      if (!connectedDevices.has(deviceId)) {
        reject(new Error('Dispositivo no conectado'));
        return;
      }

      const commandTopic = MQTT_CONFIG.topics.commands.replace('{deviceId}', deviceId);
      const dispenseMsg = {
        action: 'dispense',
        amount: amount,
        timestamp: new Date().toISOString(),
        from: MQTT_CONFIG.clientId
      };

      // Handler para respuesta
      const handleResponse = (response) => {
        if (response.status === 'success') {
          resolve({ success: true, message: `Dispensando ${amount}g` });
        } else {
          reject(new Error(response.message || 'Error dispensando'));
        }
      };

      // Registrar handler temporal
      messageHandlers.current.set(`${deviceId}_dispense`, handleResponse);
      
      // Timeout
      setTimeout(() => {
        if (messageHandlers.current.has(`${deviceId}_dispense`)) {
          messageHandlers.current.delete(`${deviceId}_dispense`);
          reject(new Error('Timeout: Dispensador no respondió'));
        }
      }, 15000);

      // Enviar comando
      const published = publishMessage(commandTopic, dispenseMsg);
      if (!published) {
        messageHandlers.current.delete(`${deviceId}_dispense`);
        reject(new Error('Error enviando comando MQTT'));
        return;
      }
      console.log('[DISPENSE] 📤 Comando enviado:', amount + 'g a', deviceId);
    });
  }, [connectedDevices, publishMessage]);

  /**
   * Sincronizar horarios reales
   */
  const syncSchedulesToDispenser = useCallback((deviceId, schedules) => {
    return new Promise((resolve, reject) => {
      if (!connectedDevices.has(deviceId)) {
        reject(new Error('Dispositivo no conectado'));
        return;
      }

      const commandTopic = MQTT_CONFIG.topics.commands.replace('{deviceId}', deviceId);
      const syncMsg = {
        action: 'sync_schedules',
        schedules: schedules,
        timestamp: new Date().toISOString(),
        from: MQTT_CONFIG.clientId
      };

      // Handler para respuesta
      const handleResponse = (response) => {
        if (response.status === 'success') {
          resolve({ success: true, message: 'Horarios sincronizados' });
        } else {
          reject(new Error(response.message || 'Error sincronizando'));
        }
      };

      // Registrar handler temporal
      messageHandlers.current.set(`${deviceId}_sync_schedules`, handleResponse);
      
      // Timeout
      setTimeout(() => {
        if (messageHandlers.current.has(`${deviceId}_sync_schedules`)) {
          messageHandlers.current.delete(`${deviceId}_sync_schedules`);
          reject(new Error('Timeout: Dispensador no respondió'));
        }
      }, 10000);

      // Enviar comando
      const published = publishMessage(commandTopic, syncMsg);
      if (!published) {
        messageHandlers.current.delete(`${deviceId}_sync_schedules`);
        reject(new Error('Error enviando comando MQTT'));
        return;
      }
      console.log('[SYNC] 📤 Horarios enviados a', deviceId);
    });
  }, [connectedDevices, publishMessage]);

  /**
   * Verificar si dispositivo está conectado
   */
  const isDeviceConnected = useCallback((deviceId) => {
    return connectedDevices.has(deviceId);
  }, [connectedDevices]);

  /**
   * Desconectar dispensador
   */
  const disconnectFromDispenser = useCallback((deviceId) => {
    if (mqttConnected) {
      const commandTopic = MQTT_CONFIG.topics.commands.replace('{deviceId}', deviceId);
      const disconnectMsg = {
        action: 'disconnect',
        timestamp: new Date().toISOString(),
        from: MQTT_CONFIG.clientId
      };
      
      publishMessage(commandTopic, disconnectMsg);
    }
    
    setConnectedDevices(prev => {
      const updated = new Set(prev);
      updated.delete(deviceId);
      return updated;
    });
    
    setDiscoveredDispensers(prev => 
      prev.map(d => 
        d.deviceId === deviceId 
          ? { ...d, isConnected: false }
          : d
      )
    );
    
    setConnectionStatus(`Desconectado de ${deviceId}`);
    console.log('[DISCONNECT] 📤 Desconectado de', deviceId);
  }, [mqttConnected, publishMessage]);

  // Inicializar MQTT al montar
  useEffect(() => {
    initMQTTClient();
    
    return () => {
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }
      if (mqttClient.current?.end) {
        mqttClient.current.end();
      }
    };
  }, [initMQTTClient]);

  // Auto-búsqueda al conectar
  useEffect(() => {
    if (mqttConnected && discoveredDispensers.length === 0 && !isScanning) {
      const timer = setTimeout(rescanDevices, 2000);
      return () => clearTimeout(timer);
    }
  }, [mqttConnected, discoveredDispensers.length, isScanning, rescanDevices]);

  return {
    // Estados
    discoveredDispensers,
    isScanning,
    mqttConnected,
    connectionStatus,
    
    // Funciones
    connectToDispenser,
    sendDispenseCommand,
    syncSchedulesToDispenser,
    rescanDevices,
    isDeviceConnected,
    disconnectFromDispenser
  };
}
