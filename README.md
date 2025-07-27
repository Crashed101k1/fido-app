# FIDO - Facilitador Inteligente de Dietas Organizadas

Una aplicación móvil desarrollada en React Native para la gestión inteligente de la alimentación de mascotas a través de dispensadores automáticos.

## Características

- **Sistema de autenticación** completo (Login/Registro)
- **Dashboard principal** con estado de dispensadores
- **Gestión multi-mascota** con configuración individual
- **Programación de horarios** de alimentación
- **Configuración de porciones** personalizadas
- **Estadísticas y análisis** detallados
- **Interfaz intuitiva** con navegación por pestañas y menú lateral

## Tecnologías

- **React Native** - Framework principal
- **React Navigation v6** - Sistema de navegación
- **Expo** - Herramientas de desarrollo
- **React Native Vector Icons** - Iconografía

## Estructura del Proyecto

```
fido/
├── src/
│   ├── screens/           # Pantallas de la aplicación
│   ├── navigation/        # Configuración de navegación
│   └── assets/           # Recursos estáticos
├── App.js                # Componente principal
└── package.json          # Dependencias
```

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/fido-app.git

# Navegar al directorio
cd fido-app

# Instalar dependencias
npm install

# Ejecutar la aplicación
npm start
```

## Pantallas Implementadas

### Autenticación
- **LoginScreen** - Inicio de sesión
- **RegisterScreen** - Registro de nuevos usuarios

### Navegación Principal (Tabs)
- **HomeScreen** - Dashboard principal
- **MyPetScreen** - Gestión de mascotas
- **EatTimeScreen** - Programación de horarios
- **StatisticsScreen** - Estadísticas de alimentación

### Menú Lateral (Drawer)
- **AccountScreen** - Gestión de perfil
- **AboutScreen** - Información de la aplicación
- **ContactScreen** - Soporte y contacto

## Control de Versiones

- **v1.2.0** - Versión actual con todas las funcionalidades básicas
- Sistema de versionado semántico (SemVer)

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## Contacto

- **Proyecto:** FIDO App
- **Versión:** 1.2.0
- **Desarrollado por:** Equipo Eridanus Systems

---
*Facilitando la alimentación inteligente de tus mascotas*