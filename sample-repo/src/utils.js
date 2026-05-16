/**
 * Utility Functions Module
 * Common helper functions used across the application
 */

/**
 * Formats a date object or timestamp into a readable string
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'iso')
 * @returns {string} Formatted date string
 */
function formatDate(date, format = 'short') {
  try {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString();
      case 'long':
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'iso':
        return dateObj.toISOString();
      default:
        return dateObj.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error.message);
    return '';
  }
}

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalizes the first letter of each word in a string
 * @param {string} str - String to capitalize
 * @returns {string} Title-cased string
 */
function capitalizeWords(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str
    .split(' ')
    .map(word => capitalizeString(word))
    .join(' ');
}

/**
 * Generates a unique ID using timestamp and random number
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Generated unique ID
 */
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  const id = `${timestamp}${randomPart}`;
  
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Validates an email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncates a string to a specified length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
function truncateString(str, maxLength, suffix = '...') {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Delays execution for a specified time
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Deep clones an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Sanitizes a string by removing special characters
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str.replace(/[^a-zA-Z0-9\s-_]/g, '');
}

/**
 * Converts a string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} Kebab-cased string
 */
function toKebabCase(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Converts a string to camelCase
 * @param {string} str - String to convert
 * @returns {string} CamelCased string
 */
function toCamelCase(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');
}

module.exports = {
  formatDate,
  capitalizeString,
  capitalizeWords,
  generateId,
  isValidEmail,
  truncateString,
  delay,
  deepClone,
  isEmpty,
  sanitizeString,
  toKebabCase,
  toCamelCase
};

// Made with Bob
