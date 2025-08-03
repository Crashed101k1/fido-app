/**
 * FIDO - Utilidades de Iconos de Mascotas
 * 
 * Este módulo proporciona funciones para obtener iconos apropiados
 * según el tipo de mascota/animal.
 */

/**
 * Obtiene el nombre del icono apropiado para una especie de mascota
 * @param {string} species - La especie de la mascota
 * @returns {string} El nombre del icono de Ionicons
 */
export function getPetIcon(species) {
  if (!species) return 'paw'; // Icono por defecto
  
  const normalizedSpecies = species.toLowerCase().trim();
  
  switch (normalizedSpecies) {
    case 'perro':
      return 'paw'; // Huella para perros
    case 'gato':
      return 'logo-octocat'; // Icono de gato (más específico que paw)
    case 'conejo':
      return 'leaf'; // Representa naturaleza/vegetarianos
    case 'hamster':
      return 'ellipse'; // Representación redonda para roedores pequeños
    case 'pez':
    case 'pescado':
      return 'fish';
    case 'ave':
    case 'pájaro':
    case 'loro':
    case 'canario':
      return 'chevron-up'; // Representa vuelo hacia arriba
    case 'tortuga':
      return 'shield'; // Forma que recuerda al caparazón
    case 'iguana':
    case 'gecko':
    case 'lagarto':
      return 'triangle'; // Forma angular para reptiles
    case 'serpiente':
      return 'remove'; // Línea ondulada
    default:
      return 'paw'; // Icono por defecto para especies no reconocidas
  }
}

/**
 * Obtiene el color apropiado para una especie de mascota
 * @param {string} species - La especie de la mascota
 * @returns {string} El código de color hexadecimal
 */
export function getPetIconColor(species) {
  if (!species) return '#4CAF50'; // Color por defecto
  
  const normalizedSpecies = species.toLowerCase().trim();
  
  switch (normalizedSpecies) {
    case 'perro':
      return '#8D6E63'; // Café/marrón para perros
    case 'gato':
      return '#FF7043'; // Naranja para gatos
    case 'conejo':
      return '#81C784'; // Verde claro para conejos
    case 'hamster':
      return '#FFB74D'; // Amarillo/dorado para hamsters
    case 'pez':
    case 'pescado':
      return '#42A5F5'; // Azul para peces
    case 'ave':
    case 'pájaro':
    case 'loro':
    case 'canario':
      return '#FFA726'; // Naranja/amarillo para aves
    case 'tortuga':
      return '#66BB6A'; // Verde para tortugas
    case 'iguana':
    case 'gecko':
    case 'lagarto':
      return '#4DB6AC'; // Verde azulado para reptiles
    case 'serpiente':
      return '#7E57C2'; // Púrpura para serpientes
    default:
      return '#4CAF50'; // Color por defecto
  }
}

/**
 * Obtiene información completa del icono para una mascota
 * @param {string} species - La especie de la mascota
 * @param {boolean} isSelected - Si la mascota está seleccionada
 * @param {string} defaultColor - Color por defecto a usar si no está seleccionada
 * @returns {Object} Objeto con name, color e información del icono
 */
export function getPetIconInfo(species, isSelected = false, defaultColor = '#4CAF50') {
  const iconName = getPetIcon(species);
  const speciesColor = getPetIconColor(species);
  
  return {
    name: iconName,
    color: isSelected ? '#FFFFFF' : (defaultColor === '#4CAF50' ? speciesColor : defaultColor),
    speciesColor: speciesColor
  };
}

/**
 * Obtiene una lista de especies de mascotas soportadas por la aplicación
 * @returns {Array} Array de objetos con información de especies
 */
export function getSupportedSpecies() {
  return [
    { name: 'Perro', icon: 'paw', color: '#8D6E63' },
    { name: 'Gato', icon: 'logo-octocat', color: '#FF7043' },
    { name: 'Conejo', icon: 'leaf', color: '#81C784' },
    { name: 'Hamster', icon: 'ellipse', color: '#FFB74D' },
    { name: 'Pez', icon: 'fish', color: '#42A5F5' },
    { name: 'Ave', icon: 'chevron-up', color: '#FFA726' },
    { name: 'Tortuga', icon: 'shield', color: '#66BB6A' },
    { name: 'Iguana', icon: 'triangle', color: '#4DB6AC' },
    { name: 'Serpiente', icon: 'remove', color: '#7E57C2' }
  ];
}
