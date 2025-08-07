#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <Servo.h>
#include <LiquidCrystal_I2C.h>
#include <HX711.h>

// Configuración WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// Configuración de pines
#define SERVO_PIN 18
#define TRIG_PIN 5
#define ECHO_PIN 19
#define HX711_DOUT_PIN 4
#define HX711_SCK_PIN 16

// Objetos
WebServer server(80);
Servo servoMotor;
LiquidCrystal_I2C lcd(0x27, 16, 2); // Dirección I2C de tu LCD
HX711 scale;

// Variables globales
float foodLevel = 0;
float plateWeight = 0;
bool isDispensing = false;
String deviceId = "DISP-001";

void setup() {
  Serial.begin(115200);
  
  // Inicializar LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("FIDO Dispensador");
  lcd.setCursor(0, 1);
  lcd.print("Iniciando...");
  
  // Configurar pines
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Inicializar servo
  servoMotor.attach(SERVO_PIN);
  servoMotor.write(0); // Posición cerrada
  
  // Inicializar sensor de peso
  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  scale.set_scale(2280.f); // Factor de calibración (ajustar según tu sensor)
  scale.tare(); // Calibrar a cero
  
  // Conectar a WiFi
  WiFi.begin(ssid, password);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Conectando WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando a WiFi...");
  }
  
  Serial.println("WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi: Conectado");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP());
  
  // Configurar rutas del servidor web
  setupServerRoutes();
  
  server.begin();
  Serial.println("Servidor web iniciado");
  
  delay(2000);
  updateDisplay();
}

void loop() {
  server.handleClient();
  
  // Actualizar sensores cada 5 segundos
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 5000) {
    updateSensors();
    updateDisplay();
    lastUpdate = millis();
  }
  
  delay(100);
}

void setupServerRoutes() {
  // Habilitar CORS para la app
  server.enableCORS(true);
  
  // Ruta para obtener estado del dispensador
  server.on("/status", HTTP_GET, []() {
    StaticJsonDocument<200> doc;
    doc["deviceId"] = deviceId;
    doc["foodLevel"] = foodLevel;
    doc["plateWeight"] = plateWeight;
    doc["batteryLevel"] = 95; // Simular batería (puedes agregar sensor real)
    doc["isOnline"] = true;
    doc["isDispensing"] = isDispensing;
    doc["lastSync"] = millis();
    
    String response;
    serializeJson(doc, response);
    
    server.send(200, "application/json", response);
  });
  
  // Ruta para dispensar comida
  server.on("/dispense", HTTP_POST, []() {
    if (server.hasArg("amount")) {
      int amount = server.arg("amount").toInt();
      
      StaticJsonDocument<100> doc;
      doc["success"] = dispenseFeed(amount);
      doc["message"] = doc["success"] ? "Comida dispensada" : "Error al dispensar";
      
      String response;
      serializeJson(doc, response);
      
      server.send(200, "application/json", response);
    } else {
      server.send(400, "application/json", "{\"error\":\"Parámetro 'amount' requerido\"}");
    }
  });
  
  // Ruta para configuración
  server.on("/config", HTTP_POST, []() {
    // Aquí puedes manejar configuraciones enviadas desde la app
    server.send(200, "application/json", "{\"success\":true}");
  });
}

void updateSensors() {
  // Leer sensor ultrasónico (nivel de comida)
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2; // Convertir a cm
  
  // Calcular porcentaje (ajustar según la altura de tu contenedor)
  float containerHeight = 20.0; // cm, ajustar según tu contenedor
  foodLevel = max(0.0, min(100.0, ((containerHeight - distance) / containerHeight) * 100));
  
  // Leer sensor de peso
  if (scale.is_ready()) {
    plateWeight = max(0.0, scale.get_units()); // En gramos
  }
}

void updateDisplay() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Nivel: ");
  lcd.print((int)foodLevel);
  lcd.print("%");
  
  lcd.setCursor(0, 1);
  lcd.print("Plato: ");
  lcd.print((int)plateWeight);
  lcd.print("g");
}

bool dispenseFeed(int amount) {
  if (isDispensing) return false;
  
  isDispensing = true;
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Dispensando...");
  lcd.setCursor(0, 1);
  lcd.print(amount);
  lcd.print(" gramos");
  
  // Abrir servo (ajustar ángulo según tu mecanismo)
  servoMotor.write(90);
  
  // Calcular tiempo basado en cantidad
  // Esto debes calibrarlo según tu dispensador
  int dispenseTime = amount * 50; // 50ms por gramo (ajustar)
  delay(dispenseTime);
  
  // Cerrar servo
  servoMotor.write(0);
  
  isDispensing = false;
  updateDisplay();
  
  return true;
}
