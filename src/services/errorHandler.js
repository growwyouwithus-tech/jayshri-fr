/**
 * Error Service
 * Handles error responses from API and provides user-friendly messages
 */

export class APIError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.timestamp = new Date().toISOString()
  }
}

export const handleAPIError = (error) => {
  console.error('[Error Handler]', error)

  // Network error
  if (!error.response) {
    return {
      message: 'Unable to connect to server. Please check your internet connection.',
      statusCode: 0,
      type: 'NETWORK_ERROR',
      canRetry: true
    }
  }

  // Timeout error
  if (error.code === 'ECONNABORTED') {
    return {
      message: 'Request timeout. Please try again.',
      statusCode: 0,
      type: 'TIMEOUT_ERROR',
      canRetry: true
    }
  }

  const status = error.response?.status
  const data = error.response?.data

  // Validation error
  if (status === 400) {
    return {
      message: data?.message || 'Invalid request. Please check your input.',
      statusCode: 400,
      type: 'VALIDATION_ERROR',
      errors: data?.errors,
      canRetry: false
    }
  }

  // Unauthorized
  if (status === 401) {
    return {
      message: 'Your session has expired. Please login again.',
      statusCode: 401,
      type: 'UNAUTHORIZED',
      canRetry: false,
      redirect: '/login'
    }
  }

  // Forbidden
  if (status === 403) {
    return {
      message: 'You do not have permission to perform this action.',
      statusCode: 403,
      type: 'FORBIDDEN',
      canRetry: false
    }
  }

  // Not found
  if (status === 404) {
    return {
      message: 'The requested resource was not found.',
      statusCode: 404,
      type: 'NOT_FOUND',
      canRetry: false
    }
  }

  // Conflict (duplicate)
  if (status === 409) {
    return {
      message: data?.message || 'This resource already exists.',
      statusCode: 409,
      type: 'CONFLICT',
      canRetry: false
    }
  }

  // Server error
  if (status >= 500) {
    return {
      message: 'Server error occurred. Please try again later.',
      statusCode: status,
      type: 'SERVER_ERROR',
      canRetry: true
    }
  }

  // Default error
  return {
    message: data?.message || 'An unexpected error occurred. Please try again.',
    statusCode: status || 500,
    type: 'UNKNOWN_ERROR',
    canRetry: true
  }
}

export const getErrorMessage = (error) => {
  const errorInfo = handleAPIError(error)
  return errorInfo.message
}

export const isRetryableError = (error) => {
  const errorInfo = handleAPIError(error)
  return errorInfo.canRetry
}

export default {
  APIError,
  handleAPIError,
  getErrorMessage,
  isRetryableError
}
