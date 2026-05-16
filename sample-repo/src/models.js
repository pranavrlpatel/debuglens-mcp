/**
 * Data Models Module
 * Defines data structures and model creation functions
 */

const { generateId, formatDate, isValidEmail } = require('./utils');

/**
 * Creates a user model with validation
 * @param {Object} data - User data
 * @param {string} data.firstName - User's first name
 * @param {string} data.lastName - User's last name
 * @param {string} data.email - User's email address
 * @param {string} data.id - Optional user ID
 * @param {Date|string} data.createdAt - Optional creation date
 * @returns {Object} User model object
 * @throws {Error} If required fields are missing or invalid
 */
function createUserModel(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('User data must be an object');
  }

  const { firstName, lastName, email, id, createdAt } = data;

  // Validate required fields
  if (!firstName || typeof firstName !== 'string') {
    throw new Error('First name is required and must be a string');
  }

  if (!lastName || typeof lastName !== 'string') {
    throw new Error('Last name is required and must be a string');
  }

  if (!email || !isValidEmail(email)) {
    throw new Error('Valid email address is required');
  }

  // Create user model
  const userModel = {
    id: id || generateId('user'),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    createdAt: createdAt ? new Date(createdAt) : new Date(),
    updatedAt: new Date()
  };

  return userModel;
}

/**
 * Validates a user model
 * @param {Object} user - User model to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateUserModel(user) {
  if (!user || typeof user !== 'object') {
    throw new Error('User must be an object');
  }

  const requiredFields = ['id', 'firstName', 'lastName', 'email', 'createdAt'];
  
  for (const field of requiredFields) {
    if (!user[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!isValidEmail(user.email)) {
    throw new Error('Invalid email format');
  }

  return true;
}

/**
 * Updates a user model with new data
 * @param {Object} existingUser - Existing user model
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated user model
 */
function updateUserModel(existingUser, updates) {
  if (!existingUser || typeof existingUser !== 'object') {
    throw new Error('Existing user must be an object');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates must be an object');
  }

  // Validate existing user
  validateUserModel(existingUser);

  // Create updated user model
  const updatedUser = {
    ...existingUser,
    ...updates,
    id: existingUser.id, // ID should never change
    createdAt: existingUser.createdAt, // Creation date should never change
    updatedAt: new Date()
  };

  // Validate email if it was updated
  if (updates.email && !isValidEmail(updatedUser.email)) {
    throw new Error('Invalid email format');
  }

  return updatedUser;
}

/**
 * Converts user model to a safe public format (removes sensitive data)
 * @param {Object} user - User model
 * @returns {Object} Public user data
 */
function toPublicUser(user) {
  if (!user || typeof user !== 'object') {
    throw new Error('User must be an object');
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: formatDate(user.createdAt, 'iso')
  };
}

/**
 * Creates a user response model with metadata
 * @param {Object} user - User model
 * @param {Object} metadata - Additional metadata
 * @returns {Object} User response with metadata
 */
function createUserResponse(user, metadata = {}) {
  if (!user || typeof user !== 'object') {
    throw new Error('User must be an object');
  }

  return {
    data: toPublicUser(user),
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
}

/**
 * Creates a paginated user list response
 * @param {Array<Object>} users - Array of user models
 * @param {Object} pagination - Pagination info
 * @param {number} pagination.page - Current page
 * @param {number} pagination.limit - Items per page
 * @param {number} pagination.total - Total items
 * @returns {Object} Paginated response
 */
function createUserListResponse(users, pagination) {
  if (!Array.isArray(users)) {
    throw new Error('Users must be an array');
  }

  const { page = 1, limit = 10, total = users.length } = pagination || {};

  return {
    data: users.map(user => toPublicUser(user)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    },
    metadata: {
      timestamp: new Date().toISOString(),
      count: users.length
    }
  };
}

/**
 * User model schema definition
 */
const userSchema = {
  id: {
    type: 'string',
    required: true,
    description: 'Unique user identifier'
  },
  firstName: {
    type: 'string',
    required: true,
    description: 'User first name'
  },
  lastName: {
    type: 'string',
    required: true,
    description: 'User last name'
  },
  email: {
    type: 'string',
    required: true,
    description: 'User email address',
    validate: isValidEmail
  },
  createdAt: {
    type: 'date',
    required: true,
    description: 'Account creation timestamp'
  },
  updatedAt: {
    type: 'date',
    required: false,
    description: 'Last update timestamp'
  }
};

module.exports = {
  createUserModel,
  validateUserModel,
  updateUserModel,
  toPublicUser,
  createUserResponse,
  createUserListResponse,
  userSchema
};

// Made with Bob
