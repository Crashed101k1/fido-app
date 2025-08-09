/*
 * DISPENSADOR INTELIGENTE CON CONECTIVIDAD MQTT
 * 
 * Este programa controla un sistema de dispensación automática con:
 * - Medición de peso mediante celda de carga (HX711)
 * - Detección de nivel con sensor ultrasónico HC-SR04
 * - Visualización en pantalla LCD I2C 20x4
 * - Control de compuerta con servo motor
 * - Conectividad WiFi y MQTT para control remoto
 */

// ========== INCLUSIÓN DE BIBLIOTECAS ==========
#include <Wire.h>               // Comunicación I2C para la pantalla LCD
#include <LiquidCrystal_I2C.h>  // Control de pantalla LCD I2C
#include <ESP32Servo.h>         // Control de servo motor para ESP32
#include <HX711.h>              // Para la celda de carga (báscula)
#include "mqtt_connection.h"    // Manejo de conectividad MQTT

// ========== CONFIGURACIÓN DE PINES (SIN CAMBIOS) ==========
#define SDA_PIN 8      // Pin SDA para I2C (LCD)
#define SCL_PIN 9      // Pin SCL para I2C (LCD)
#define TRIG_PIN 14    // Pin Trigger del sensor ultrasónico
#define ECHO_PIN 15    // Pin Echo del sensor ultrasónico
#define SERVO_PIN 13   // Pin para control del servo motor
#define DT_PIN 5       // Pin DT del HX711 (celda de carga)
#define SCK_PIN 4      // Pin SCK del HX711

// ========== UMBRALES DE DISTANCIA (cm) ==========
#define DISTANCIA_LLENO 8.0     // Distancia para considerar "LLENO"
#define DISTANCIA_VACIO 12.5    // Distancia para considerar "VACIO"
#define DISTANCIA_MIN_LLENO 8.0 // Límite inferior para "LLENO"
#define UMBRAL_VACIO_LCD 10.0   // Umbral para mostrar "VACIO" en LCD

// ========== CONFIGURACIÓN SERVO Y BÁSCULA ==========
const int ANGULO_CERRADO = 0;   // Ángulo para posición cerrada del servo
const int ANGULO_ABIERTO = 80;  // Ángulo para posición abierta del servo
const float UMBRAL_CIERRE = 150.0; // Peso en gramos para detener dispensación
float factorEscala = 1000.0;    // Factor de calibración para la báscula

// ========== OBJETOS ==========
LiquidCrystal_I2C lcd(0x27, 20, 4); // LCD I2C dirección 0x27, 20 columnas x 4 filas
Servo miServo;                      // Objeto para controlar el servo
HX711 balanza;                      // Objeto para la celda de carga

// ========== VARIABLES DE CONTROL ==========
unsigned long tiempoFinDispensacion = 0; // Almacena cuando terminó la dispensación
bool mostrandoResultado = false;         // Flag para estado de visualización
float cantidadDispensada = 0.0;          // Cantidad dispensada en gramos
const unsigned long TIEMPO_MOSTRAR_RESULTADO = 10000; // 10 segundos para mostrar resultado

// Variables para MQTT
unsigned long lastSensorUpdate = 0;
const unsigned long SENSOR_UPDATE_INTERVAL = 5000; // Enviar datos cada 5 segundos
float targetDispenseAmount = 150.0; // Cantidad objetivo por defecto
bool dispensingViaApp = false;       // Flag para dispensación vía app

// Variables de autenticación
const String DEVICE_PASSWORD = "FIDO2025"; // Contraseña del dispositivo
bool isConnectedToApp = false;               // Estado de conexión con la app

/**
 * FUNCIÓN: actualizarLCD
 * Actualiza la pantalla LCD con la información del sistema
 * Incluye información de conectividad MQTT
 */
void actualizarLCD(float peso, float distancia, const char* estado, bool mostrarResultado = false) {
  lcd.clear(); // Limpia la pantalla
  
  if(mostrarResultado) {
    // MODO RESULTADO: Muestra pantalla especial con cantidad dispensada
    lcd.setCursor(0, 0);
    lcd.print("DISPENSACION FINALIZADA");
    lcd.setCursor(0, 1);
    lcd.print("Cantidad dispensada:");
    lcd.setCursor(0, 2);
    lcd.print(cantidadDispensada, 1); // Muestra con 1 decimal
    lcd.print(" gramos");
    lcd.setCursor(0, 3);
    lcd.print("Estado: ");
    lcd.print(estado);
  } else {
    // MODO NORMAL: Muestra información operativa completa
    
    // Línea 1: Título y estado de conexión
    lcd.setCursor(0, 0);
    lcd.print("FIDO Smart ");
    if (isConnected()) {
      lcd.print("[ONLINE]");
    } else {
      lcd.print("[OFFLINE]");
    }
    
    // Línea 2: Peso actual
    lcd.setCursor(0, 1);
    lcd.print("Peso: ");
    lcd.print(peso, 1); // Muestra con 1 decimal
    lcd.print(" g");
    
    // Línea 3: Nivel del contenedor
    lcd.setCursor(0, 2);
    lcd.print("Nivel: ");
    if(distancia >= DISTANCIA_MIN_LLENO && distancia <= DISTANCIA_LLENO) {
      lcd.print("LLENO      ");
    } 
    else if(distancia >= UMBRAL_VACIO_LCD) {
      lcd.print("VACIO      ");
    }
    else if(distancia < DISTANCIA_MIN_LLENO) {
      lcd.print("SOBRELLENO ");
    }
    else {
      // Calcula porcentaje para niveles intermedios
      float porcentaje = 100.0 * (DISTANCIA_VACIO - distancia) / (DISTANCIA_VACIO - DISTANCIA_LLENO);
      porcentaje = constrain(porcentaje, 0.0, 100.0); // Limita entre 0-100%
      lcd.print(porcentaje, 0); // Muestra sin decimales
      lcd.print("%       ");
    }
    
    // Línea 4: Estado del sistema
    lcd.setCursor(0, 3);
    lcd.print("Estado: ");
    lcd.print(estado);
  }
}

/**
 * FUNCIÓN: abrirDispensador
 * Abre la compuerta del dispensador moviendo el servo a posición abierta
 */
void abrirDispensador() {
  miServo.write(ANGULO_ABIERTO);
  Serial.println("Dispensador ABIERTO");
  publishStatus("dispensing", "Compuerta abierta");
}

/**
 * FUNCIÓN: cerrarDispensador
 * Cierra la compuerta del dispensador moviendo el servo a posición cerrada
 */
void cerrarDispensador() {
  miServo.write(ANGULO_CERRADO);
  Serial.println("Dispensador CERRADO");
  publishStatus("ready", "Compuerta cerrada");
}

/**
 * FUNCIÓN: manejarComandosMQTT
 * Callback para procesar comandos recibidos vía MQTT
 */
void manejarComandosMQTT(String command, JsonObject data) {
  Serial.println("Comando recibido: " + command);
  Serial.println("Datos JSON completos:");
  serializeJsonPretty(data, Serial);
  Serial.println();
  
  if (command == "connect") {
    // Comando de conexión con autenticación
    Serial.println("Procesando comando de conexión...");
    
    if (data.containsKey("password")) {
      String receivedPassword = data["password"].as<String>();
      Serial.println("Contraseña recibida: '" + receivedPassword + "'");
      Serial.println("Contraseña esperada: '" + DEVICE_PASSWORD + "'");
      
      if (receivedPassword == DEVICE_PASSWORD) {
        isConnectedToApp = true;
        Serial.println("✅ Autenticación exitosa - App conectada");
        publishResponse("connect", "success", "Conexión establecida correctamente");
        publishStatus("connected", "App móvil conectada");
      } else {
        Serial.println("❌ Autenticación fallida - Contraseña incorrecta");
        publishResponse("connect", "error", "Contraseña incorrecta");
      }
    } else {
      Serial.println("❌ No se encontró campo 'password' en los datos");
      // Imprimir todos los campos disponibles
      for (JsonPair kv : data) {
        Serial.println("Campo disponible: " + String(kv.key().c_str()) + " = " + String(kv.value().as<String>()));
      }
      publishResponse("connect", "error", "Contraseña requerida");
    }
    
  } else if (command == "dispense" && !mostrandoResultado) {
    // Verificar autenticación antes de dispensar
    if (!isConnectedToApp) {
      publishResponse("dispense", "error", "Dispositivo no autenticado");
      return;
    }
    
    // Comando de dispensación desde la app
    if (data.containsKey("amount")) {
      targetDispenseAmount = data["amount"];
    }
    
    Serial.println("Iniciando dispensación vía MQTT: " + String(targetDispenseAmount) + "g");
    dispensingViaApp = true;
    
    // Iniciar dispensación
    iniciarDispensacion();
    
    publishResponse("dispense", "started", "Dispensación iniciada");
    
  } else if (command == "get_status") {
    // Verificar autenticación para obtener estado
    if (!isConnectedToApp) {
      publishResponse("get_status", "error", "Dispositivo no autenticado");
      return;
    }
    
    // Solicitud de estado
    float peso = balanza.get_units(3);
    float distancia = medirDistancia();
    
    publishSensorData(peso, distancia, mostrandoResultado ? "completed" : "ready", cantidadDispensada);
    publishResponse("get_status", "success", "Estado enviado");
    
  } else if (command == "set_target") {
    // Verificar autenticación para configurar objetivo
    if (!isConnectedToApp) {
      publishResponse("set_target", "error", "Dispositivo no autenticado");
      return;
    }
    
    // Configurar cantidad objetivo
    if (data.containsKey("amount")) {
      targetDispenseAmount = data["amount"];
      publishResponse("set_target", "success", "Cantidad objetivo configurada: " + String(targetDispenseAmount) + "g");
    }
    
  } else {
    publishResponse(command, "error", "Comando no reconocido");
  }
}

/**
 * FUNCIÓN: medirDistancia
 * Mide la distancia usando el sensor ultrasónico
 */
float medirDistancia() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duracion = pulseIn(ECHO_PIN, HIGH);
  return duracion * 0.034 / 2;
}

/**
 * FUNCIÓN: iniciarDispensacion
 * Inicia el proceso de dispensación (común para serial y MQTT)
 */
void iniciarDispensacion() {
  float peso = balanza.get_units(3);
  float distancia = medirDistancia();
  
  actualizarLCD(peso, distancia, "Dispensando");
  abrirDispensador();
  
  float pesoInicial = peso;
  float umbralActual = dispensingViaApp ? targetDispenseAmount : UMBRAL_CIERRE;
  
  // Bucle de dispensación activa
  while(true) {
    peso = balanza.get_units(3);
    distancia = medirDistancia();
    float diferencia = peso - pesoInicial;
    
    // Actualizar pantalla
    if(!mostrandoResultado) {
      actualizarLCD(peso, distancia, "Dispensando");
    }
    
    // Enviar datos en tiempo real si es vía app
    if (dispensingViaApp) {
      publishSensorData(peso, distancia, "dispensing", diferencia);
    }
    
    // Mantener conexión MQTT
    maintainMQTTConnection();
    
    // Condición de salida: alcanzó el peso objetivo
    if(diferencia >= umbralActual) {
      cantidadDispensada = diferencia;
      break;
    }
    
    delay(100);
  }
  
  // Finalización
  cerrarDispensador();
  mostrandoResultado = true;
  tiempoFinDispensacion = millis();
  dispensingViaApp = false;
  
  actualizarLCD(0, 0, "Completado", true);
  
  Serial.print("Dispensación completada: ");
  Serial.print(cantidadDispensada, 1);
  Serial.println(" g");
  
  // Notificar via MQTT
  publishSensorData(peso, distancia, "completed", cantidadDispensada);
  publishStatus("completed", "Dispensación completada: " + String(cantidadDispensada, 1) + "g");
}

/**
 * FUNCIÓN: setup
 * Configuración inicial del sistema (ejecuta una vez al iniciar)
 */
void setup() {
  Serial.begin(115200);
  Serial.println("Iniciando FIDO Smart Dispenser...");
  
  // Configuración LCD I2C
  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  actualizarLCD(0.0, 0.0, "Iniciando...");
  
  // Configuración sensor ultrasónico
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Configuración servo motor
  ESP32PWM::allocateTimer(0);
  miServo.setPeriodHertz(50);
  miServo.attach(SERVO_PIN, 500, 2400);
  cerrarDispensador();
  
  // Configuración celda de carga
  balanza.begin(DT_PIN, SCK_PIN);
  balanza.set_scale(factorEscala);
  delay(2000);
  balanza.tare();
  
  // Configurar callback para comandos MQTT
  setCommandCallback(manejarComandosMQTT);
  
  // Inicializar conectividad
  actualizarLCD(0.0, 0.0, "Conectando...");
  if (initConnectivity()) {
    actualizarLCD(0.0, 0.0, "Conectado!");
    Serial.println("Sistema conectado y listo");
  } else {
    actualizarLCD(0.0, 0.0, "Sin conexion");
    Serial.println("Sistema listo (sin conexión)");
  }
  
  delay(2000);
  actualizarLCD(0.0, 0.0, "Listo");
}

/**
 * FUNCIÓN: loop
 * Bucle principal que se ejecuta continuamente
 */
void loop() {
  // Mantener conexión MQTT
  maintainMQTTConnection();
  
  // 1. MEDICIÓN DE SENSORES
  float distancia = medirDistancia();
  float pesoGramos = balanza.get_units(3);
  
  // 2. CONTROL DE VISUALIZACIÓN DE RESULTADO
  if(mostrandoResultado && millis() - tiempoFinDispensacion >= TIEMPO_MOSTRAR_RESULTADO) {
    mostrandoResultado = false;
  }
  
  // 3. ACTUALIZACIÓN PERIÓDICA DE PANTALLA (cada 500ms)
  static unsigned long ultimaActualizacion = 0;
  if(millis() - ultimaActualizacion >= 500) {
    if(mostrandoResultado) {
      actualizarLCD(0, 0, "Completado", true);
    } else {
      actualizarLCD(pesoGramos, distancia, "Monitoreando");
    }
    ultimaActualizacion = millis();
    
    // Debug por serial
    Serial.print("Distancia: ");
    Serial.print(distancia);
    Serial.print(" cm | Peso: ");
    Serial.print(pesoGramos, 1);
    Serial.print(" g | ");
    Serial.println(getConnectionInfo());
  }
  
  // 4. ENVÍO PERIÓDICO DE DATOS VÍA MQTT (cada 5 segundos)
  if (isConnected() && millis() - lastSensorUpdate >= SENSOR_UPDATE_INTERVAL) {
    String state = mostrandoResultado ? "completed" : "ready";
    publishSensorData(pesoGramos, distancia, state, cantidadDispensada);
    lastSensorUpdate = millis();
  }
  
  // 5. CONTROL POR SERIAL (iniciar dispensación con 'a')
  if(Serial.available() && Serial.read() == 'a' && !mostrandoResultado) {
    dispensingViaApp = false; // Dispensación manual por serial
    iniciarDispensacion();
  }
}
