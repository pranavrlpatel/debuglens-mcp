/**
 * API Module
 * Handles HTTP requests using native fetch API
 */

const { handleError, handleResponse } = require('./handlers');

/**
 * Base API configuration
 */
const API_BASE_URL = 'https://api.example.com';

/**
 * Fetches a user by their ID
 * @param {string|number} id - User ID
 * @returns {Promise<Object>} User data
 */
async function getUserById(id) {
  try {
    if (!id) {
      throw new Error('User ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
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
 * Creates a new user
 * @param {Object} userData - User data to create
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.email - User's email address
 * @returns {Promise<Object>} Created user data
 */
async function createUser(userData) {
  try {
    if (!userData || typeof userData !== 'object') {
      throw new Error('Valid user data is required');
    }

    if (!userData.email) {
      throw new Error('Email is required');
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
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
    return handleResponse(data, response.status);
  } catch (error) {
    return handleError(error, 'createUser');
  }
}

/**
 * Updates an existing user
 * @param {string|number} id - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user data
 */
async function updateUser(id, userData) {
  try {
    if (!id) {
      throw new Error('User ID is required');
    }

    if (!userData || typeof userData !== 'object') {
      throw new Error('Valid user data is required');
    }

    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
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
    return handleResponse(data, response.status);
  } catch (error) {
    return handleError(error, 'updateUser');
  }
}

/**
 * Deletes a user by ID
 * @param {string|number} id - User ID
 * @returns {Promise<Object>} Deletion confirmation
 */
async function deleteUser(id) {
  try {
    if (!id) {
      throw new Error('User ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return handleResponse({ success: true, id }, response.status);
  } catch (error) {
    return handleError(error, 'deleteUser');
  }
}

/**
 * Fetches all users with optional pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @returns {Promise<Object>} List of users
 */
async function getAllUsers(options = {}) {
  try {
    const { page = 1, limit = 10 } = options;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
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
    return handleError(error, 'getAllUsers');
  }
}

module.exports = {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers
};

// Made with Bob
