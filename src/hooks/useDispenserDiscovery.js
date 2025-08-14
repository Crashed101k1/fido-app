import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

// Hook para descubrimiento y control de dispensadores MQTT REALES
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
        if (typeof window !== 'undefined' && !window.mqtt) {
          console.log('[MQTT] 🔄 Cargando cliente web desde CDN...');
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js';
            script.onload = () => {
              if (window.mqtt && typeof window.mqtt.connect === 'function') {
                console.log('[MQTT] ✅ Cliente web cargado desde CDN');
                clientLoaded.current = true;
                resolve(true);
              } else {
                reject(new Error('mqtt.connect no disponible'));
              }
            };
            script.onerror = () => reject(new Error('Error cargando mqtt.js desde CDN'));
            document.head.appendChild(script);
          });
        } else if (window.mqtt && typeof window.mqtt.connect === 'function') {
          clientLoaded.current = true;
          return true;
        }
        return false;
      } else {
        const mqtt = require('mqtt');
        if (mqtt && typeof mqtt.connect === 'function') {
          clientLoaded.current = true;
          return true;
        }
        return false;
      }
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

      if (topic.includes('/status')) {
        const deviceId = topic.split('/')[2];
        if (message.status === 'connected' || message.status === 'online') {
          setConnectedDevices(prev => new Set([...prev, deviceId]));
        }
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
          return existing
            ? prev.map(d => (d.deviceId === deviceId ? updated : d))
            : [...prev, updated];
        });
      }

      if (topic.includes('/data')) {
        const deviceId = topic.split('/')[2];
        setDiscoveredDispensers(prev =>
          prev.map(d =>
            d.deviceId === deviceId ? { ...d, ...message, lastSeen: new Date() } : d
          )
        );
      }

      // Procesar mensajes de discovery
      if (topic === MQTT_CONFIG.topics.discovery) {
        const deviceId = message.deviceId || '';
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
          return existing
            ? prev.map(d => (d.deviceId === deviceId ? updated : d))
            : [...prev, updated];
        });
      }

      if (topic.includes('/response')) {
        const deviceId = topic.split('/')[2];
        const commandKey = message.command || message.action || '';
        const handlerKey = `${deviceId}_${commandKey}`;
        const handler = messageHandlers.current.get(handlerKey);
        if (handler) {
          handler(message);
          if (message.result === 'completed' || message.result === 'error') {
            messageHandlers.current.delete(handlerKey);
          }
        }
      }
    } catch (error) {
      console.error('[MQTT] Error procesando mensaje:', error);
    }
  }, [connectedDevices]);

  /**
   * Inicializar conexión MQTT
   */
  const initMQTTClient = useCallback(async () => {
    try {
      const loaded = await loadMQTTClient();
      if (!loaded) {
        setConnectionStatus('Cliente MQTT no disponible');
        return false;
      }
      setConnectionStatus('Conectando...');
      if (Platform.OS === 'web') {
        const brokerUrl = `wss://${MQTT_CONFIG.username}:${MQTT_CONFIG.password}@${MQTT_CONFIG.host}`;
        mqttClient.current = window.mqtt.connect(brokerUrl, { clientId: MQTT_CONFIG.clientId });
      } else {
        const mqtt = require('mqtt');
        const brokerUrl = `mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`;
        mqttClient.current = mqtt.connect(brokerUrl, {
          clientId: MQTT_CONFIG.clientId,
          username: MQTT_CONFIG.username,
          password: MQTT_CONFIG.password
        });
      }
      mqttClient.current.on('connect', () => {
        setMqttConnected(true);
        setConnectionStatus('Conectado');
        mqttClient.current.subscribe([
          MQTT_CONFIG.topics.discovery,
          MQTT_CONFIG.topics.status,
          MQTT_CONFIG.topics.data,
          MQTT_CONFIG.topics.response
        ]);
      });
      mqttClient.current.on('message', handleMQTTMessage);
      mqttClient.current.on('error', err => {
        setConnectionStatus('Error: ' + err.message);
        setMqttConnected(false);
      });
      return true;
    } catch (error) {
      setConnectionStatus('Error: ' + error.message);
      return false;
    }
  }, [loadMQTTClient, handleMQTTMessage]);

  const publishMessage = useCallback((topic, payload) => {
    if (!mqttClient.current) return false;
    try {
      mqttClient.current.publish(topic, JSON.stringify(payload), { qos: 1 });
      return true;
    } catch (error) {
      console.error('[MQTT] Error publicando:', error);
      return false;
    }
  }, []);

  const rescanDevices = useCallback(() => {
    if (!mqttConnected || isScanning) return;
    setIsScanning(true);
    setDiscoveredDispensers([]);
    publishMessage(MQTT_CONFIG.topics.discovery, { action: 'discover' });
    scanTimeout.current = setTimeout(() => {
      setIsScanning(false);
    }, 8000);
  }, [mqttConnected, isScanning, publishMessage]);

  const connectToDispenser = useCallback((deviceId, password = 'FIDO2025') => {
    return new Promise((resolve, reject) => {
      if (!mqttConnected) return reject(new Error('Sin conexión MQTT'));
      const commandTopic = MQTT_CONFIG.topics.commands.replace('{deviceId}', deviceId);
      const connectMsg = { action: 'connect', password };
      messageHandlers.current.set(`${deviceId}_connect`, response => {
        if (response.result === 'success') {
          setConnectedDevices(prev => new Set([...prev, deviceId]));
          resolve({ success: true });
        } else {
          reject(new Error(response.message || 'Error de conexión'));
        }
      });
      publishMessage(commandTopic, connectMsg);
    });
  }, [mqttConnected, publishMessage]);

  const isDeviceConnected = useCallback(deviceId => connectedDevices.has(deviceId), [connectedDevices]);

  const disconnectFromDispenser = useCallback(deviceId => {
    setConnectedDevices(prev => {
      const newSet = new Set(prev);
      newSet.delete(deviceId);
      return newSet;
    });
    setDiscoveredDispensers(prev =>
      prev.map(d => (d.deviceId === deviceId ? { ...d, isConnected: false } : d))
    );
    setConnectionStatus(`Desconectado de ${deviceId}`);
  }, []);

  // Enviar comando para dispensar alimento
  const sendDispenseCommand = useCallback(async (deviceId, cantidad) => {
    if (!mqttConnected) throw new Error('Sin conexión MQTT');
    if (!isDeviceConnected(deviceId)) {
      try {
        await connectToDispenser(deviceId);
      } catch (err) {
        throw new Error('No se pudo autenticar el dispositivo: ' + err.message);
      }
    }
    return new Promise((resolve, reject) => {
      const commandTopic = MQTT_CONFIG.topics.commands.replace('{deviceId}', deviceId);
      const dispenseMsg = { action: 'dispense', amount: cantidad };
      messageHandlers.current.set(`${deviceId}_dispense`, response => {
        if (response.result === 'success') {
          resolve({ success: true, message: 'Alimento dispensado' });
        } else {
          reject(new Error(response.message || 'Error al dispensar'));
        }
      });
      publishMessage(commandTopic, dispenseMsg);
    });
  }, [mqttConnected, isDeviceConnected, connectToDispenser, publishMessage]);

  useEffect(() => {
    initMQTTClient();
    return () => {
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
      if (mqttClient.current?.end) mqttClient.current.end();
    };
  }, [initMQTTClient]);

  useEffect(() => {
    if (mqttConnected && discoveredDispensers.length === 0 && !isScanning) {
      const timer = setTimeout(rescanDevices, 2000);
      return () => clearTimeout(timer);
    }
  }, [mqttConnected, discoveredDispensers.length, isScanning, rescanDevices]);

  // Sincroniza los horarios con el dispensador
  const syncSchedulesToDispenser = async (deviceId, schedules) => {
    if (!mqttConnected) throw new Error('Sin conexión MQTT');
    if (!isDeviceConnected(deviceId)) {
      throw new Error('Dispositivo no autenticado. Conéctate primero.');
    }
    return new Promise((resolve, reject) => {
      const commandTopic = MQTT_CONFIG.topics.commands.replace('{deviceId}', deviceId);
      const syncMsg = { action: 'sync_schedules', schedules };
      messageHandlers.current.set(`${deviceId}_sync_schedules`, response => {
        if (response.result === 'success') {
          resolve({ success: true, message: 'Horarios sincronizados' });
        } else {
          reject(new Error(response.message || 'Error sincronizando'));
        }
      });
      publishMessage(commandTopic, syncMsg);
    });
  };

  return {
    discoveredDispensers,
    isScanning,
    mqttConnected,
    connectionStatus,
    connectToDispenser,
    rescanDevices,
    isDeviceConnected,
    disconnectFromDispenser,
    syncSchedulesToDispenser,
    sendDispenseCommand
  };
}
