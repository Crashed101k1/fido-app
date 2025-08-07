/**
 * FIDO - Utilidades de Formateo de Fecha y Hora
 * 
 * Funciones utilitarias para formatear fechas, horas y duraciones
 * en español para la interfaz de usuario.
 */

/**
 * Formatea una fecha en formato legible en español
 * @param {Date|string|number} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatDate(date) {
  if (!date) return 'Sin fecha';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return 'Fecha inválida';
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Si es hoy
  if (diffDays === 0) {
    if (diffMinutes < 1) {
      return 'Ahora mismo';
    } else if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min`;
    } else {
      return `Hace ${diffHours}h`;
    }
  }
  
  // Si es ayer
  if (diffDays === 1) {
    return `Ayer ${dateObj.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  // Si es esta semana (últimos 7 días)
  if (diffDays < 7) {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return `${days[dateObj.getDay()]} ${dateObj.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  // Fecha completa
  return dateObj.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea una fecha futura en formato legible
 * @param {Date|string|number} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatFutureDate(date) {
  if (!date) return 'No programado';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return 'Fecha inválida';
  
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Si es en el pasado
  if (diffMs < 0) {
    return 'Ya pasó';
  }
  
  // Si es hoy
  if (diffDays === 0) {
    if (diffMinutes < 60) {
      return `En ${diffMinutes} min`;
    } else {
      return `En ${diffHours}h`;
    }
  }
  
  // Si es mañana
  if (diffDays === 1) {
    return `Mañana ${dateObj.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  // Si es esta semana (próximos 7 días)
  if (diffDays < 7) {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return `${days[dateObj.getDay()]} ${dateObj.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  // Fecha completa
  return dateObj.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea una hora en formato 12 horas
 * @param {number} hour - Hora en formato 24h
 * @param {number} minute - Minutos
 * @returns {string} Hora formateada
 */
export function formatTime12(hour, minute = 0) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Obtiene el color para un porcentaje
 * @param {number} percentage - Porcentaje (0-100)
 * @returns {string} Color hex
 */
export function getPercentageColor(percentage) {
  if (percentage >= 70) return '#4CAF50'; // Verde
  if (percentage >= 40) return '#FF9800'; // Naranja
  if (percentage >= 20) return '#F44336'; // Rojo
  return '#9E9E9E'; // Gris para valores muy bajos
}

/**
 * Formatea un porcentaje con color
 * @param {number} percentage - Porcentaje (0-100)
 * @returns {Object} Objeto con percentage y color
 */
export function formatPercentageWithColor(percentage) {
  const safePercentage = Math.max(0, Math.min(100, percentage || 0));
  return {
    percentage: safePercentage,
    color: getPercentageColor(safePercentage),
    text: `${Math.round(safePercentage)}%`
  };
}

/**
 * Calcula tiempo restante hasta una fecha
 * @param {Date|string|number} targetDate - Fecha objetivo
 * @returns {string} Tiempo restante formateado
 */
export function getTimeUntil(targetDate) {
  if (!targetDate) return 'Sin programar';
  
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Ya es hora';
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}m`;
  } else {
    return `${diffMinutes}m`;
  }
}
