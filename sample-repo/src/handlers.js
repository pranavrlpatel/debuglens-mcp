/**
 * Error and Response Handlers Module
 * Centralized error handling and response formatting
 */

/**
 * Handles errors consistently across the application
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {Object} Formatted error response
 */
function handleError(error, context = 'unknown') {
  try {
    // Log error for debugging
    console.error(`[Error in ${context}]:`, error.message);
    console.error('Stack trace:', error.stack);

    // Determine error type and status code
    let statusCode = 500;
    let errorType = 'InternalServerError';

    if (error.message.includes('required') || error.message.includes('Invalid')) {
      statusCode = 400;
      errorType = 'BadRequest';
    } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
      statusCode = 404;
      errorType = 'NotFound';
    } else if (error.message.includes('unauthorized') || error.message.includes('permission')) {
      statusCode = 401;
      errorType = 'Unauthorized';
    } else if (error.message.includes('forbidden')) {
      statusCode = 403;
      errorType = 'Forbidden';
    }

    // Return formatted error response
    return {
      success: false,
      error: {
        type: errorType,
        message: error.message,
        context: context,
        timestamp: new Date().toISOString()
      },
      statusCode: statusCode
    };
  } catch (handlerError) {
    // Fallback error handling if the handler itself fails
    console.error('[Critical Error in handleError]:', handlerError.message);
    return {
      success: false,
      error: {
        type: 'CriticalError',
        message: 'An unexpected error occurred',
        context: 'error_handler',
        timestamp: new Date().toISOString()
      },
      statusCode: 500
    };
  }
}

/**
 * Handles successful responses consistently
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Formatted success response
 */
function handleResponse(data, statusCode = 200, metadata = {}) {
  try {
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(`Invalid success status code: ${statusCode}`);
    }

    return {
      success: true,
      data: data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      },
      statusCode: statusCode
    };
  } catch (error) {
    console.error('[Error in handleResponse]:', error.message);
    return handleError(error, 'response_handler');
  }
}

/**
 * Handles validation errors with detailed field information
 * @param {Array<Object>} validationErrors - Array of validation error objects
 * @param {string} context - Context where validation failed
 * @returns {Object} Formatted validation error response
 */
function handleValidationError(validationErrors, context = 'validation') {
  try {
    if (!Array.isArray(validationErrors)) {
      throw new Error('Validation errors must be an array');
    }

    return {
      success: false,
      error: {
        type: 'ValidationError',
        message: 'Validation failed',
        context: context,
        details: validationErrors,
        timestamp: new Date().toISOString()
      },
      statusCode: 422
    };
  } catch (error) {
    console.error('[Error in handleValidationError]:', error.message);
    return handleError(error, 'validation_handler');
  }
}

/**
 * Handles not found errors
 * @param {string} resource - Resource that was not found
 * @param {string} identifier - Resource identifier
 * @returns {Object} Formatted not found response
 */
function handleNotFound(resource, identifier) {
  try {
    const error = new Error(`${resource} with identifier '${identifier}' not found`);
    return handleError(error, 'not_found');
  } catch (error) {
    console.error('[Error in handleNotFound]:', error.message);
    return handleError(error, 'not_found_handler');
  }
}

/**
 * Handles unauthorized access errors
 * @param {string} reason - Reason for unauthorized access
 * @returns {Object} Formatted unauthorized response
 */
function handleUnauthorized(reason = 'Authentication required') {
  try {
    const error = new Error(`Unauthorized: ${reason}`);
    return handleError(error, 'unauthorized');
  } catch (error) {
    console.error('[Error in handleUnauthorized]:', error.message);
    return handleError(error, 'unauthorized_handler');
  }
}

/**
 * Handles rate limiting errors
 * @param {number} retryAfter - Seconds until retry is allowed
 * @returns {Object} Formatted rate limit response
 */
function handleRateLimit(retryAfter = 60) {
  try {
    return {
      success: false,
      error: {
        type: 'RateLimitExceeded',
        message: 'Too many requests',
        retryAfter: retryAfter,
        timestamp: new Date().toISOString()
      },
      statusCode: 429
    };
  } catch (error) {
    console.error('[Error in handleRateLimit]:', error.message);
    return handleError(error, 'rate_limit_handler');
  }
}

/**
 * Wraps an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error handling
 * @returns {Function} Wrapped function with error handling
 */
function withErrorHandling(fn, context) {
  return async (...args) => {
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      return handleError(error, context);
    }
  };
}

/**
 * Logs request information for debugging
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {Object} data - Request data
 */
function logRequest(method, path, data = {}) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${path}`);
    
    if (Object.keys(data).length > 0) {
      console.log('Request data:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('[Error in logRequest]:', error.message);
  }
}

/**
 * Logs response information for debugging
 * @param {number} statusCode - Response status code
 * @param {Object} response - Response object
 */
function logResponse(statusCode, response = {}) {
  try {
    const timestamp = new Date().toISOString();
    const status = response.success ? 'SUCCESS' : 'ERROR';
    console.log(`[${timestamp}] Response: ${statusCode} - ${status}`);
    
    if (!response.success && response.error) {
      console.log('Error details:', response.error.message);
    }
  } catch (error) {
    console.error('[Error in logResponse]:', error.message);
  }
}

/**
 * Creates a standardized API response wrapper
 * @param {Function} handler - Handler function to wrap
 * @param {string} context - Context for error handling
 * @returns {Function} Wrapped handler with standardized response
 */
function createApiHandler(handler, context) {
  return async (...args) => {
    try {
      const result = await handler(...args);
      
      // If result is already a formatted response, return it
      if (result && typeof result === 'object' && 'success' in result) {
        return result;
      }
      
      // Otherwise, wrap it in a success response
      return handleResponse(result);
    } catch (error) {
      return handleError(error, context);
    }
  };
}

module.exports = {
  handleError,
  handleResponse,
  handleValidationError,
  handleNotFound,
  handleUnauthorized,
  handleRateLimit,
  withErrorHandling,
  logRequest,
  logResponse,
  createApiHandler
};

// Made with Bob
