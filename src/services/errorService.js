import toast from 'react-hot-toast'

/**
 * Error Handling Service
 * Centralized error handling and user feedback
 */

export const errorService = {
  // Handle API errors
  handleApiError: (error, customMessage = null) => {
    console.error('API Error:', error)
    
    let message = customMessage || 'Something went wrong'
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          message = data.message || 'Invalid request'
          break
        case 401:
          message = 'Unauthorized access'
          break
        case 403:
          message = 'Access forbidden'
          break
        case 404:
          message = 'Resource not found'
          break
        case 422:
          message = data.message || 'Validation error'
          break
        case 500:
          message = 'Server error. Please try again later'
          break
        default:
          message = data.message || `Error ${status}`
      }
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your connection'
    }
    
    toast.error(message)
    return message
  },

  // Handle validation errors
  handleValidationError: (errors) => {
    if (Array.isArray(errors)) {
      errors.forEach(error => toast.error(error.message))
    } else if (typeof errors === 'object') {
      Object.values(errors).forEach(error => {
        if (Array.isArray(error)) {
          error.forEach(msg => toast.error(msg))
        } else {
          toast.error(error)
        }
      })
    } else {
      toast.error(errors)
    }
  },

  // Show success message
  showSuccess: (message) => {
    toast.success(message)
  },

  // Show info message
  showInfo: (message) => {
    toast(message, { icon: 'ℹ️' })
  },

  // Show warning message
  showWarning: (message) => {
    toast(message, { icon: '⚠️' })
  },

  // Handle loading states
  withLoading: async (asyncFunction, loadingSetter) => {
    try {
      loadingSetter(true)
      const result = await asyncFunction()
      return result
    } catch (error) {
      errorService.handleApiError(error)
      throw error
    } finally {
      loadingSetter(false)
    }
  }
}

export default errorService
