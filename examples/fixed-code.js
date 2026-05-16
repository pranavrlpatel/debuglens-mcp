/**
 * User Creation Module - FIXED VERSION
 * 
 * This code was corrected after DebugLens validation detected 4 violations:
 * 
 * ✅ FIX 1: Replaced axios with native fetch (matches repository pattern)
 * ✅ FIX 2: Converted all snake_case to camelCase (matches repository convention)
 * ✅ FIX 3: Added try/catch error handling to all async functions
 * ✅ FIX 4: Now uses existing utilities from the repository:
 *    - isValidEmail() from utils.js
 *    - handleError() from handlers.js
 *    - handleResponse() from handlers.js
 *    - createUserModel() from models.js
 */

const { isValidEmail } = require('../sample-repo/src/utils');
const { handleError, handleResponse } = require('../sample-repo/src/handlers');
const { createUserModel } = require('../sample-repo/src/models');

/**
 * Base API configuration
 */
const API_BASE_URL = 'https://api.example.com';

/**
 * Creates a new user in the system
 * @param {Object} userData - The user information
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.email - User's email address
 * @returns {Promise<Object>} The created user object
 */
async function createNewUser(userData) {
  try {
    const apiEndpoint = `${API_BASE_URL}/users`;
    
    // Validate input data
    if (!userData) {
      throw new Error('User data is required');
    }
    
    if (!userData.email) {
      throw new Error('Email is required');
    }
    
    // Create user model using repository utility
    const userModel = createUserModel({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email
    });
    
    // Make API request using fetch
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userModel)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Use repository's response handler
    return handleResponse(data, response.status, {
      message: 'User created successfully'
    });
  } catch (error) {
    // Use repository's error handler
    return handleError(error, 'createNewUser');
  }
}

/**
 * Validates user data before creation
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result
 */
function validateUserData(userData) {
  try {
    const validationErrors = [];
    
    if (!userData.firstName || userData.firstName.length < 2) {
      validationErrors.push('First name must be at least 2 characters');
    }
    
    if (!userData.lastName || userData.lastName.length < 2) {
      validationErrors.push('Last name must be at least 2 characters');
    }
    
    // Use repository's email validation utility
    if (!userData.email || !isValidEmail(userData.email)) {
      validationErrors.push('Valid email address is required');
    }
    
    if (validationErrors.length > 0) {
      return {
        isValid: false,
        errors: validationErrors
      };
    }
    
    return {
      isValid: true,
      errors: []
    };
  } catch (error) {
    return handleError(error, 'validateUserData');
  }
}

/**
 * Main function to handle user creation with validation
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Result of user creation
 */
async function handleUserCreation(userData) {
  try {
    // Validate the data first
    const validationResult = validateUserData(userData);
    
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    // Create the user
    const creationResult = await createNewUser(userData);
    
    return creationResult;
  } catch (error) {
    return handleError(error, 'handleUserCreation');
  }
}

/**
 * Fetches a user by ID
 * @param {string|number} userId - User ID to fetch
 * @returns {Promise<Object>} User data
 */
async function getUserById(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return handleResponse(data, response.status);
  } catch (error) {
    return handleError(error, 'getUserById');
  }
}

/**
 * Updates an existing user
 * @param {string|number} userId - User ID to update
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user data
 */
async function updateUser(userId, userData) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!userData || typeof userData !== 'object') {
      throw new Error('Valid user data is required');
    }
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return handleResponse(data, response.status, {
      message: 'User updated successfully'
    });
  } catch (error) {
    return handleError(error, 'updateUser');
  }
}

module.exports = {
  createNewUser,
  validateUserData,
  handleUserCreation,
  getUserById,
  updateUser
};

// Made with Bob
