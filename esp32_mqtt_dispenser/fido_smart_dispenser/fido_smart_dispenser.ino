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
#include <Wire.h>              // Comunicación I2C para la pantalla LCD
#include <LiquidCrystal_I2C.h> // Control de pantalla LCD I2C
#include <ESP32Servo.h>        // Control de servo motor para ESP32
#include <HX711.h>             // Para la celda de carga (báscula)
#include "mqtt_connection.h"   // Manejo de conectividad MQTT
#include "publish_with_type.h"
#include <time.h> // Para la sincronización NTP

// ========== CONFIGURACIÓN DE PINES (SIN CAMBIOS) ==========
#define SDA_PIN 8    // Pin SDA para I2C (LCD)
#define SCL_PIN 9    // Pin SCL para I2C (LCD)
#define TRIG_PIN 14  // Pin Trigger del sensor ultrasónico
#define ECHO_PIN 15  // Pin Echo del sensor ultrasónico
#define SERVO_PIN 13 // Pin para control del servo motor
#define DT_PIN 5     // Pin DT del HX711 (celda de carga)
#define SCK_PIN 4    // Pin SCK del HX711
#define BUTTON_DISPENSE_PIN 12 // Botón físico para dispensación manual
#define BUTTON_POWER_PIN 16    // Botón físico para encender/apagar

// ========== UMBRALES DE DISTANCIA (cm) ==========
#define DISTANCIA_LLENO 4.0     // Distancia para considerar "LLENO" (cm, fondo a comida llena)
#define DISTANCIA_VACIO 10.0    // Distancia para considerar "VACIO" (cm, fondo a comida vacía)
#define DISTANCIA_MIN_LLENO 3.5 // Distancia mínima para considerar lleno
#define UMBRAL_VACIO_LCD 11.0   // Umbral para mostrar "VACIO" en LCD

// ========== CONFIGURACIÓN SERVO Y BÁSCULA ==========
const int ANGULO_CERRADO = 0;      // Ángulo para posición cerrada del servo
const int ANGULO_ABIERTO = 80;     // Ángulo para posición abierta del servo
const float UMBRAL_CIERRE = 150.0; // Peso en gramos para detener dispensación
float factorEscala = 1000.0;       // Factor de calibración para la báscula

// ========== OBJETOS ==========
LiquidCrystal_I2C lcd(0x27, 20, 4); // LCD I2C dirección 0x27, 20 columnas x 4 filas
Servo miServo;                      // Objeto para controlar el servo
HX711 balanza;                      // Objeto para la celda de carga

// ========== VARIABLES DE CONTROL ==========
unsigned long tiempoFinDispensacion = 0;              // Almacena cuando terminó la dispensación
bool mostrandoResultado = false;                      // Flag para estado de visualización
float cantidadDispensada = 0.0;                       // Cantidad dispensada en gramos
const unsigned long TIEMPO_MOSTRAR_RESULTADO = 10000; // 10 segundos para mostrar resultado

// Variables para MQTT
// Variables para almacenar datos de la última orden recibida desde la app
String lastPetId = "";
String lastUserId = "";
String lastFeedingTimeId = "";
float lastAmount = 0.0;

// --- ESTRUCTURA Y VARIABLES PARA HORARIOS PROGRAMADOS ---
#define MAX_HORARIOS 8 // Máximo de horarios programados
struct HorarioAlimentacion
{
  int hora;                      // Hora (0-23)
  int minuto;                    // Minuto (0-59)
  float porcion;                 // Porción en gramos
  bool activo;                   // Si el horario está activo
  unsigned long ultimaEjecucion; // Para evitar dobles disparos
  String id;                     // ID de Firestore para el registro
};
HorarioAlimentacion horarios[MAX_HORARIOS];
int numHorarios = 0;
unsigned long lastSensorUpdate = 0;
const unsigned long SENSOR_UPDATE_INTERVAL = 5000; // Enviar datos cada 5 segundos
float targetDispenseAmount = 150.0;                // Cantidad objetivo por defecto
bool dispensingViaApp = false;                     // Flag para dispensación vía app

// Variables de autenticación
const String DEVICE_PASSWORD = "FIDO2025"; // Contraseña del dispositivo
bool isConnectedToApp = false;             // Estado de conexión con la app

// --- CONTROL DE RECONEXIÓN MANUAL ---
bool manualDisconnect = false; // Si está en true, no reconectar MQTT automáticamente

/**
 * FUNCIÓN: actualizarLCD
 * Actualiza la pantalla LCD con la información del sistema
 * Incluye información de conectividad MQTT
 */
void actualizarLCD(float peso, float distancia, const char *estado, bool mostrarResultado = false, float progreso = -1)
{
  lcd.clear(); // Limpia la pantalla
  if (mostrarResultado)
  {
    lcd.setCursor(0, 0);
    lcd.print("DISPENSACION FINALIZADA");
    lcd.setCursor(0, 1);
    lcd.print("Cantidad dispensada:");
    lcd.setCursor(0, 2);
    lcd.print(cantidadDispensada, 1);
    lcd.print(" gramos");
    lcd.setCursor(0, 3);
    lcd.print("Estado: ");
    lcd.print(estado);
  }
  else
  {
    // Línea 1: Título y estado de conexión
    lcd.setCursor(0, 0);
    lcd.print("FIDO Smart ");
    if (isConnected())
    {
      lcd.print("[ONLINE]");
    }
    else
    {
      lcd.print("[OFFLINE]");
    }
    // Línea 2: Peso actual
    lcd.setCursor(0, 1);
    lcd.print("Peso: ");
    lcd.print(peso, 1);
    lcd.print(" g");
    // Línea 3: Nivel del contenedor
    lcd.setCursor(0, 2);
    lcd.print("Nivel: ");
    if (distancia >= DISTANCIA_MIN_LLENO && distancia <= DISTANCIA_LLENO)
    {
      lcd.print("LLENO      ");
    }
    else if (distancia >= UMBRAL_VACIO_LCD)
    {
      lcd.print("VACIO      ");
    }
    else if (distancia < DISTANCIA_MIN_LLENO)
    {
      lcd.print("SOBRELLENO ");
    }
    else
    {
      float porcentaje = 100.0 * (DISTANCIA_VACIO - distancia) / (DISTANCIA_VACIO - DISTANCIA_LLENO);
      porcentaje = constrain(porcentaje, 0.0, 100.0);
      lcd.print(porcentaje, 0);
      lcd.print("%       ");
    }
    // Línea 4: Estado del sistema o barra de progreso
    lcd.setCursor(0, 3);
    if (progreso >= 0.0 && progreso <= 1.0)
    {
      // Barra de progreso: 20 caracteres
      int chars = (int)(progreso * 20.0f);
      lcd.print("[");
      for (int i = 0; i < 20; i++)
      {
        if (i < chars)
          lcd.print("#");
        else
          lcd.print(" ");
      }
      lcd.print("]");
    }
    else
    {
      lcd.print("Estado: ");
      lcd.print(estado);
    }
  }
}
// --- FUNCIÓN: calcularPorcentajeLlenado ---
float calcularPorcentajeLlenado(float distancia)
{
  // Debug: imprimir valores para depuración
  Serial.print("[DEBUG] Distancia medida: ");
  Serial.print(distancia);
  Serial.print(" cm | DISTANCIA_VACIO: ");
  Serial.print(DISTANCIA_VACIO);
  Serial.print(" | DISTANCIA_LLENO: ");
  Serial.println(DISTANCIA_LLENO);

  float porcentaje = 100.0 * (DISTANCIA_VACIO - distancia) / (DISTANCIA_VACIO - DISTANCIA_LLENO);
  porcentaje = constrain(porcentaje, 0.0, 100.0);

  Serial.print("[DEBUG] Porcentaje calculado: ");
  Serial.print(porcentaje);
  Serial.println("%");

  return porcentaje;
}

/**
 * FUNCIÓN: abrirDispensador
 * Abre la compuerta del dispensador moviendo el servo a posición abierta
 */
void abrirDispensador()
{
  miServo.write(ANGULO_ABIERTO);
  Serial.println("Dispensador ABIERTO");
  publishStatus("dispensing", "Compuerta abierta");
}

/**
 * FUNCIÓN: cerrarDispensador
 * Cierra la compuerta del dispensador moviendo el servo a posición cerrada
 */
void cerrarDispensador()
{
  miServo.write(ANGULO_CERRADO);
  Serial.println("Dispensador CERRADO");
  publishStatus("ready", "Compuerta cerrada");
}

/**
 * FUNCIÓN: manejarComandosMQTT
 * Callback para procesar comandos recibidos vía MQTT
 */
void manejarComandosMQTT(String command, JsonObject data)
{
  Serial.println("Comando recibido: " + command);
  Serial.println("Datos JSON completos:");
  serializeJsonPretty(data, Serial);
  Serial.println();

  if (command == "connect")
  {
    // Comando de conexión con autenticación
    Serial.println("Procesando comando de conexión...");

    if (data.containsKey("password"))
    {
      String receivedPassword = data["password"].as<String>();
      Serial.println("Contraseña recibida: '" + receivedPassword + "'");
      Serial.println("Contraseña esperada: '" + DEVICE_PASSWORD + "'");

      if (receivedPassword == DEVICE_PASSWORD)
      {
        isConnectedToApp = true;
        Serial.println("✅ Autenticación exitosa - App conectada");
        publishResponse("connect", "success", "Conexión establecida correctamente");
        publishStatus("connected", "App móvil conectada");
      }
      else
      {
        Serial.println("❌ Autenticación fallida - Contraseña incorrecta");
        publishResponse("connect", "error", "Contraseña incorrecta");
      }
    }
    else
    {
      Serial.println("❌ No se encontró campo 'password' en los datos");
      // Imprimir todos los campos disponibles
      for (JsonPair kv : data)
      {
        Serial.println("Campo disponible: " + String(kv.key().c_str()) + " = " + String(kv.value().as<String>()));
      }
      publishResponse("connect", "error", "Contraseña requerida");
    }
  }
  else if (command == "disconnect")
  {
    // Desconexión manual desde la app
    manualDisconnect = true;
    mqttConnected = false;
    isConnectedToApp = false;
    publishResponse("disconnect", "success", "Desconexión manual realizada");
    publishStatus("available", "Desconectado manualmente, listo para reconexión");
    Serial.println("[MQTT] Desconexión manual activada. No se reconectará automáticamente.");
  }
  else if (command == "dispense" && !mostrandoResultado)
  {
    // Verificar autenticación antes de dispensar
    if (!isConnectedToApp)
    {
      publishResponse("dispense", "error", "Dispositivo no autenticado");
      return;
    }

    // Comando de dispensación desde la app
    if (data.containsKey("amount"))
    {
      targetDispenseAmount = data["amount"];
    }

    // Asignar datos recibidos para registro
    if (data.containsKey("petId"))
    {
      lastPetId = data["petId"].as<String>();
    }
    else
    {
      lastPetId = "";
    }
    if (data.containsKey("userId"))
    {
      lastUserId = data["userId"].as<String>();
    }
    else
    {
      lastUserId = "";
    }
    if (data.containsKey("feedingTimeId"))
    {
      lastFeedingTimeId = data["feedingTimeId"].as<String>();
    }
    else
    {
      lastFeedingTimeId = "";
    }
    lastAmount = targetDispenseAmount;

    Serial.println("Iniciando dispensación vía MQTT: " + String(targetDispenseAmount) + "g");
    dispensingViaApp = true;

    // Iniciar dispensación
    iniciarDispensacion();

    publishResponseWithType("dispense", "started", "Dispensación iniciada", "manual", lastPetId, lastUserId, lastAmount, lastFeedingTimeId);
  }
  else if (command == "get_status")
  {
    // Verificar autenticación para obtener estado
    if (!isConnectedToApp)
    {
      publishResponse("get_status", "error", "Dispositivo no autenticado");
      return;
    }

    // Solicitud de estado
    float peso = balanza.get_units(3);
    float distancia = medirDistancia();

    publishSensorData(peso, distancia, mostrandoResultado ? "completed" : "ready", cantidadDispensada);
    publishResponse("get_status", "success", "Estado enviado");
  }
  else if (command == "set_target")
  {
    // Verificar autenticación para configurar objetivo
    if (!isConnectedToApp)
    {
      publishResponse("set_target", "error", "Dispositivo no autenticado");
      return;
    }

    // Configurar cantidad objetivo
    if (data.containsKey("amount"))
    {
      targetDispenseAmount = data["amount"];
      publishResponse("set_target", "success", "Cantidad objetivo configurada: " + String(targetDispenseAmount) + "g");
    }
  }
  else if (command == "set_schedule")
  {
    // Verificar autenticación para configurar horarios
    if (!isConnectedToApp)
    {
      publishResponse("set_schedule", "error", "Dispositivo no autenticado");
      return;
    }

    // Recibir y configurar horarios programados
    if (data.containsKey("schedules") && data["schedules"].is<JsonArray>())
    {
      JsonArray schedulesArray = data["schedules"];
      numHorarios = 0; // Resetear horarios existentes

      Serial.println("[HORARIOS] Recibiendo nuevos horarios:");

      for (JsonVariant scheduleItem : schedulesArray)
      {
        if (numHorarios >= MAX_HORARIOS)
          break;
        JsonObject schedule = scheduleItem.as<JsonObject>();
        int hora = -1, minuto = -1;
        float porcion = 0.0;
        bool activo = false;
        String id = "";
        if (schedule.containsKey("hour"))
          hora = schedule["hour"];
        if (schedule.containsKey("minute"))
          minuto = schedule["minute"];
        if (schedule.containsKey("portion"))
          porcion = schedule["portion"];
        if (schedule.containsKey("active"))
          activo = schedule["active"];
        if (schedule.containsKey("id"))
          id = schedule["id"].as<String>();
        if (hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59 && porcion > 0)
        {
          horarios[numHorarios].hora = hora;
          horarios[numHorarios].minuto = minuto;
          horarios[numHorarios].porcion = porcion;
          horarios[numHorarios].activo = activo;
          horarios[numHorarios].ultimaEjecucion = 0;
          horarios[numHorarios].id = id;
          Serial.printf("[SYNC] Horario %d: %02d:%02d - %.1fg - %s | id: %s\n",
                        numHorarios + 1,
                        horarios[numHorarios].hora,
                        horarios[numHorarios].minuto,
                        horarios[numHorarios].porcion,
                        horarios[numHorarios].activo ? "ACTIVO" : "INACTIVO",
                        horarios[numHorarios].id.c_str());
          numHorarios++;
        }
      }

      Serial.printf("[HORARIOS] Total de horarios configurados: %d\n", numHorarios);
      publishResponse("set_schedule", "success", "Horarios configurados: " + String(numHorarios));
    }
    else
    {
      publishResponse("set_schedule", "error", "Formato de horarios inválido");
    }
  }
  else if (command == "sync_schedules")
  {
    // Comando de sincronización desde la app
    if (!isConnectedToApp)
    {
      publishResponse("sync_schedules", "error", "Dispositivo no autenticado");
      return;
    }

    Serial.println("[SYNC] Recibiendo comando sync_schedules desde app");

    if (data.containsKey("schedules") && data["schedules"].is<JsonArray>())
    {
      JsonArray schedulesArray = data["schedules"];
      numHorarios = 0; // Resetear horarios existentes

      for (JsonVariant scheduleItem : schedulesArray)
      {
        if (numHorarios >= MAX_HORARIOS)
          break;

        JsonObject schedule = scheduleItem.as<JsonObject>();

        // Intentar diferentes formatos de campos
        int hora = -1, minuto = -1;
        float porcion = 0.0;
        bool activo = false;

        if (schedule.containsKey("hour"))
          hora = schedule["hour"];
        if (schedule.containsKey("minute"))
          minuto = schedule["minute"];
        if (schedule.containsKey("portion"))
          porcion = schedule["portion"];
        if (schedule.containsKey("active"))
          activo = schedule["active"];

        if (hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59 && porcion > 0)
        {
          horarios[numHorarios].hora = hora;
          horarios[numHorarios].minuto = minuto;
          horarios[numHorarios].porcion = porcion;
          horarios[numHorarios].activo = activo;
          horarios[numHorarios].ultimaEjecucion = 0;

          Serial.printf("[SYNC] Horario %d: %02d:%02d - %.1fg - %s\n",
                        numHorarios + 1,
                        horarios[numHorarios].hora,
                        horarios[numHorarios].minuto,
                        horarios[numHorarios].porcion,
                        horarios[numHorarios].activo ? "ACTIVO" : "INACTIVO");

          numHorarios++;
        }
      }

      Serial.printf("[SYNC] Total sincronizados: %d\n", numHorarios);
      publishResponse("sync_schedules", "success", "Horarios sincronizados: " + String(numHorarios));
    }
    else
    {
      publishResponse("sync_schedules", "error", "Formato de horarios inválido");
    }
  }
  else
  {
    publishResponse(command, "error", "Comando no reconocido");
  }
}

/**
 * FUNCIÓN: medirDistancia
 * Mide la distancia usando el sensor ultrasónico
 */
float medirDistancia()
{
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
void iniciarDispensacion()
{
  // Determinar tipo de dispensación
  String tipoDispensacion = dispensingViaApp ? "manual" : "scheduled";
  float peso = balanza.get_units(3);
  float distancia = medirDistancia();
  float porcentajeLlenado = calcularPorcentajeLlenado(distancia);

  // Mensaje de inicio
  String msgInicio = dispensingViaApp ? "[APP] Iniciando dispensación manual" : "[AUTO] Iniciando dispensación programada";
  Serial.println(msgInicio);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Iniciando...");
  lcd.setCursor(0, 1);
  lcd.print(tipoDispensacion == "manual" ? "Desde APP" : "Programado");
  lcd.setCursor(0, 2);
  lcd.print("Porcion: ");
  lcd.print(dispensingViaApp ? targetDispenseAmount : targetDispenseAmount, 1);
  lcd.print("g");
  abrirDispensador(); // Abrir el servo inmediatamente

  float pesoInicial = peso;
  float umbralActual = targetDispenseAmount;

  // Bucle de dispensación activa con barra de progreso
  while (true)
  {
    peso = balanza.get_units(3);
    distancia = medirDistancia();
    float diferencia = peso - pesoInicial;
    float progreso = 0.0f;
    if (umbralActual > 0.0f)
    {
      progreso = constrain(diferencia / umbralActual, 0.0f, 1.0f);
    }
    if (!mostrandoResultado)
    {
      actualizarLCD(peso, distancia, "Dispensando", false, progreso);
    }
    publishSensorData(peso, distancia, "dispensing", diferencia, calcularPorcentajeLlenado(distancia), tipoDispensacion);
    maintainMQTTConnection();
    if (diferencia >= umbralActual)
    {
      cantidadDispensada = diferencia;
      cerrarDispensador(); // Cerrar el servo inmediatamente al alcanzar el objetivo
      break;
    }
    delay(100);
  }

  // Finalización
  mostrandoResultado = true;
  tiempoFinDispensacion = millis();
  dispensingViaApp = false;

  // Mensaje de finalización
  String msgFin = tipoDispensacion == "manual" ? "[APP] Dispensación manual finalizada" : "[AUTO] Dispensación programada finalizada";
  Serial.println(msgFin);
  Serial.print("Cantidad dispensada: ");
  Serial.print(cantidadDispensada, 1);
  Serial.println(" g");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Finalizado");
  lcd.setCursor(0, 1);
  lcd.print(tipoDispensacion == "manual" ? "Desde APP" : "Programado");
  lcd.setCursor(0, 2);
  lcd.print("Dispensado:");
  lcd.setCursor(0, 3);
  lcd.print(cantidadDispensada, 1);
  lcd.print("g");
  delay(1800);

  actualizarLCD(0, 0, "Completado", true);

  // Notificar via MQTT
  publishSensorData(peso, distancia, "completed", cantidadDispensada, calcularPorcentajeLlenado(distancia), tipoDispensacion);
  String mensajeCompleto = "Dispensación completada: " + String(cantidadDispensada, 1) + "g";
  publishStatus("completed", mensajeCompleto);
  // Obtener datos relevantes para el registro
  String petId = dispensingViaApp ? lastPetId : "";
  String userId = dispensingViaApp ? lastUserId : "";
  String feedingTimeId = dispensingViaApp ? lastFeedingTimeId : "";
  float amount = cantidadDispensada;
  String tipo = dispensingViaApp ? tipoDispensacion : "manual";
  // Log de verificación antes de publicar
  Serial.println("[DEBUG MQTT] Publicando mensaje de confirmación:");
  Serial.print("petId: ");
  Serial.println(petId);
  Serial.print("userId: ");
  Serial.println(userId);
  Serial.print("amount: ");
  Serial.println(amount);
  Serial.print("feedingTimeId: ");
  Serial.println(feedingTimeId);
  publishResponseWithType("dispense", "completed", mensajeCompleto.c_str(), tipo, petId, userId, amount, feedingTimeId);
}

/**
 * FUNCIÓN: setup
 * Configuración inicial del sistema (ejecuta una vez al iniciar)
 */
void setup()
{
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

    // Configuración botones físicos
  pinMode(BUTTON_DISPENSE_PIN, INPUT_PULLUP); // Botón dispensar
  pinMode(BUTTON_POWER_PIN, INPUT_PULLUP);    // Botón encender/apagar

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
  if (initConnectivity())
  {
    actualizarLCD(0.0, 0.0, "Conectado!");
    Serial.println("Sistema conectado y listo");
  }
  else
  {
    actualizarLCD(0.0, 0.0, "Sin conexion");
    Serial.println("Sistema listo (sin conexión)");
  }

  // Sincronización NTP
  configTime(-6 * 3600, 0, "pool.ntp.org", "time.nist.gov"); // UTC-6, ajusta según tu zona
  Serial.println("Esperando sincronización NTP...");
  while (time(nullptr) < 100000)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nHora sincronizada!");

  delay(2000);
  actualizarLCD(0.0, 0.0, "Listo");
}

/**
 * FUNCIÓN: loop
 * Bucle principal que se ejecuta continuamente
 */
void loop()
{
  // Mantener conexión MQTT
  maintainMQTTConnection();

  // 1. MEDICIÓN DE SENSORES
  float distancia = medirDistancia();
  float pesoGramos = balanza.get_units(3);

  // 2. CONTROL DE VISUALIZACIÓN DE RESULTADO
  if (mostrandoResultado && millis() - tiempoFinDispensacion >= TIEMPO_MOSTRAR_RESULTADO)
  {
    mostrandoResultado = false;
  }

  // 3. ACTUALIZACIÓN PERIÓDICA DE PANTALLA (cada 500ms)
  static unsigned long ultimaActualizacion = 0;
  if (millis() - ultimaActualizacion >= 500)
  {
    if (mostrandoResultado)
    {
      actualizarLCD(0, 0, "Completado", true);
    }
    else
    {
      actualizarLCD(pesoGramos, distancia, "Monitoreando");
    }
    ultimaActualizacion = millis();

    // Debug por serial mejorado
    float porcentajeActual = calcularPorcentajeLlenado(distancia);
    Serial.println("========== DEBUG SENSORES ==========");
    Serial.print("Distancia: ");
    Serial.print(distancia, 2);
    Serial.print(" cm | Peso: ");
    Serial.print(pesoGramos, 1);
    Serial.print(" g | Nivel: ");
    Serial.print(porcentajeActual, 1);
    Serial.print("% | ");
    Serial.println(getConnectionInfo());
    Serial.println("===================================");
  }

  // 4. ENVÍO PERIÓDICO DE DATOS VÍA MQTT (cada 5 segundos)
  if (isConnected() && millis() - lastSensorUpdate >= SENSOR_UPDATE_INTERVAL)
  {
    String state = mostrandoResultado ? "completed" : "ready";
    float porcentajeLlenado = calcularPorcentajeLlenado(distancia);

    Serial.println("========== ENVIO PERIODICO MQTT ==========");
    Serial.print("[MQTT] Estado conexión: ");
    Serial.println(isConnected() ? "CONECTADO" : "DESCONECTADO");
    Serial.print("[MQTT] Enviando datos - Peso: ");
    Serial.print(pesoGramos, 1);
    Serial.print("g | Distancia: ");
    Serial.print(distancia, 1);
    Serial.print("cm | Nivel: ");
    Serial.print(porcentajeLlenado, 1);
    Serial.println("%");
    Serial.println("==========================================");

    publishSensorData(pesoGramos, distancia, state, cantidadDispensada, porcentajeLlenado, "status");
    lastSensorUpdate = millis();
  }
  else if (!isConnected())
  {
    static unsigned long lastOfflineLog = 0;
    if (millis() - lastOfflineLog >= 10000)
    { // Log cada 10 segundos si está desconectado
      Serial.println("[MQTT] ⚠️ DESCONECTADO - No se pueden enviar datos");
      lastOfflineLog = millis();
    }
  }

  // 5. CONTROL POR SERIAL (iniciar dispensación con 'a')
  if (Serial.available() && Serial.read() == 'a' && !mostrandoResultado)
  {
    dispensingViaApp = false; // Dispensación manual por serial
    iniciarDispensacion();
  }

    // 5b. CONTROL POR BOTÓN FÍSICO DE DISPENSACIÓN MANUAL
  static bool lastDispenseBtnState = HIGH;
  bool dispenseBtnState = digitalRead(BUTTON_DISPENSE_PIN);
  if (lastDispenseBtnState == HIGH && dispenseBtnState == LOW && !mostrandoResultado) {
    // Botón presionado (flanco descendente)
    Serial.println("[BOTÓN] Dispensación manual por botón físico");
    dispensingViaApp = false;
    iniciarDispensacion();
  }
  lastDispenseBtnState = dispenseBtnState;

  // 5c. CONTROL POR BOTÓN FÍSICO DE ENCendido/APAGADO
  static bool lastPowerBtnState = HIGH;
  bool powerBtnState = digitalRead(BUTTON_POWER_PIN);
  if (lastPowerBtnState == HIGH && powerBtnState == LOW) {
    // Botón presionado (flanco descendente)
    Serial.println("[BOTÓN] Encendido/Apagado solicitado");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Apagando...");
    delay(1000);
    ESP.restart(); // Reinicia el ESP32 (simula apagado/encendido)
  }
  lastPowerBtnState = powerBtnState;

  // 6. EJECUCIÓN AUTOMÁTICA DE HORARIOS PROGRAMADOS
  if (!mostrandoResultado && numHorarios > 0)
  {
    time_t now = time(nullptr);
    struct tm *tm_now = localtime(&now);
    int horaActual = tm_now->tm_hour;
    int minutoActual = tm_now->tm_min;
    unsigned long ahoraMillis = millis();

    // Debug de horarios cada 30 segundos
    static unsigned long lastScheduleDebug = 0;
    if (millis() - lastScheduleDebug >= 30000)
    {
      Serial.printf("[HORARIOS] Hora actual: %02d:%02d | Horarios activos: %d\n", horaActual, minutoActual, numHorarios);
      for (int i = 0; i < numHorarios; i++)
      {
        Serial.printf("[HORARIOS] %d: %02d:%02d %.1fg %s\n",
                      i + 1, horarios[i].hora, horarios[i].minuto, horarios[i].porcion,
                      horarios[i].activo ? "ACTIVO" : "INACTIVO");
      }
      lastScheduleDebug = millis();
    }

    for (int i = 0; i < numHorarios; i++)
    {
      if (!horarios[i].activo)
        continue;
      // Si coincide hora y minuto, y no se ha ejecutado en este minuto
      if (horaActual == horarios[i].hora && minutoActual == horarios[i].minuto)
      {
        // Evitar dobles disparos en el mismo minuto
        if (ahoraMillis - horarios[i].ultimaEjecucion > 60000UL)
        {
          Serial.printf("[AUTO] Ejecutando horario %02d:%02d - %.1fg\n", horarios[i].hora, horarios[i].minuto, horarios[i].porcion);
          time_t nowLog = time(nullptr);
          struct tm *tm_nowLog = localtime(&nowLog);
          Serial.printf("[AUTO] Hora del sistema: %02d:%02d:%02d\n", tm_nowLog->tm_hour, tm_nowLog->tm_min, tm_nowLog->tm_sec);
          Serial.printf("[AUTO] Cantidad a dispensar: %.1fg\n", horarios[i].porcion);
          targetDispenseAmount = horarios[i].porcion;
          dispensingViaApp = false; // Es programado
          lastFeedingTimeId = horarios[i].id;
          iniciarDispensacion();
          horarios[i].ultimaEjecucion = ahoraMillis;
        }
      }
    }
  }
}
