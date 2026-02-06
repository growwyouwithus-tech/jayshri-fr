/**
 * Reusable Validation Utility Functions
 * Use these functions across all forms in the application
 */

/**
 * Validates if a field is empty
 * @param {string} value - Field value
 * @param {string} fieldName - Name of the field for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} is required`
  }
  return null
}

/**
 * Validates email format
 * @param {string} value - Email address
 * @returns {string|null} - Error message or null if valid
 */
export const validateEmail = (value) => {
  if (!value) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address'
  }
  return null
}

/**
 * Validates phone number format (10 digits)
 * @param {string} value - Phone number
 * @returns {string|null} - Error message or null if valid
 */
export const validatePhone = (value) => {
  if (!value) return null
  const phoneRegex = /^[0-9]{10}$/
  if (!phoneRegex.test(value)) {
    return 'Phone number must be exactly 10 digits'
  }
  return null
}

/**
 * Validates numeric fields
 * @param {string} value - Numeric value
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateNumeric = (value, fieldName) => {
  if (!value) return null
  if (isNaN(value) || Number(value) <= 0) {
    return `${fieldName} must be a valid positive number`
  }
  return null
}

/**
 * Validates minimum length
 * @param {string} value - Field value
 * @param {number} minLength - Minimum required length
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateMinLength = (value, minLength, fieldName) => {
  if (!value) return null
  if (value.toString().trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`
  }
  return null
}

/**
 * Validates maximum length
 * @param {string} value - Field value
 * @param {number} maxLength - Maximum allowed length
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateMaxLength = (value, maxLength, fieldName) => {
  if (!value) return null
  if (value.toString().trim().length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`
  }
  return null
}

/**
 * Validates URL format
 * @param {string} value - URL
 * @returns {string|null} - Error message or null if valid
 */
export const validateURL = (value) => {
  if (!value) return null
  try {
    new URL(value)
    return null
  } catch {
    return 'Please enter a valid URL'
  }
}

/**
 * Validates password strength (minimum 8 characters)
 * @param {string} value - Password
 * @returns {string|null} - Error message or null if valid
 */
export const validatePassword = (value) => {
  if (!value) return null
  if (value.length < 8) {
    return 'Password must be at least 8 characters'
  }
  return null
}

/**
 * Validates password for exactly 8 digits
 * @param {string} value - Password
 * @returns {string|null} - Error message or null if valid
 */
export const validatePasswordDigits = (value) => {
  if (!value) return null
  const digitsRegex = /^[0-9]{8}$/
  if (!digitsRegex.test(value)) {
    return 'Password must be exactly 8 digits'
  }
  return null
}

/**
 * Validates password contains at least 8 characters with mixed requirements
 * @param {string} value - Password
 * @returns {string|null} - Error message or null if valid
 */
export const validateStrongPassword = (value) => {
  if (!value) return null
  if (value.length < 8) {
    return 'Password must be at least 8 characters long'
  }
  if (!/[A-Z]/.test(value)) {
    return 'Password must contain at least one uppercase letter'
  }
  if (!/[a-z]/.test(value)) {
    return 'Password must contain at least one lowercase letter'
  }
  if (!/[0-9]/.test(value)) {
    return 'Password must contain at least one number'
  }
  return null
}

/**
 * Validates if two passwords match
 * @param {string} password - Password
 * @param {string} confirmPassword - Confirm password
 * @returns {string|null} - Error message or null if valid
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) return null
  if (password !== confirmPassword) {
    return 'Passwords do not match'
  }
  return null
}

/**
 * Validates pincode (6 digits)
 * @param {string} value - Pincode
 * @returns {string|null} - Error message or null if valid
 */
export const validatePincode = (value) => {
  if (!value) return null
  const pincodeRegex = /^[0-9]{6}$/
  if (!pincodeRegex.test(value)) {
    return 'Pincode must be exactly 6 digits'
  }
  return null
}

/**
 * Validates date is not in the past
 * @param {string} value - Date string
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateFutureDate = (value, fieldName) => {
  if (!value) return null
  const selectedDate = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (selectedDate < today) {
    return `${fieldName} cannot be in the past`
  }
  return null
}

/**
 * Validates date is not in the future
 * @param {string} value - Date string
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validatePastDate = (value, fieldName) => {
  if (!value) return null
  const selectedDate = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (selectedDate > today) {
    return `${fieldName} cannot be in the future`
  }
  return null
}

/**
 * Error state management helper
 * Creates functions to manage form errors
 * @returns {Object} - Object with error management functions
 */
export const useFormErrors = () => {
  const [errors, setErrors] = React.useState({})

  const clearError = (fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  const setFieldError = (fieldName, errorMessage) => {
    setErrors(prev => ({ ...prev, [fieldName]: errorMessage }))
  }

  const clearAllErrors = () => {
    setErrors({})
  }

  const hasErrors = () => {
    return Object.keys(errors).length > 0
  }

  return {
    errors,
    setErrors,
    clearError,
    setFieldError,
    clearAllErrors,
    hasErrors
  }
}

/**
 * Validates Aadhar number (12 digits)
 * @param {string} value - Aadhar number
 * @returns {string|null} - Error message or null if valid
 */
export const validateAadhar = (value) => {
  if (!value) return null
  const aadharRegex = /^[0-9]{12}$/
  if (!aadharRegex.test(value)) {
    return 'Aadhar number must be exactly 12 digits'
  }
  return null
}

/**
 * Validates PAN number format
 * @param {string} value - PAN number
 * @returns {string|null} - Error message or null if valid
 */
export const validatePAN = (value) => {
  if (!value) return null
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  if (!panRegex.test(value.toUpperCase())) {
    return 'Please enter a valid PAN number (e.g., ABCDE1234F)'
  }
  return null
}

/**
 * Validates GST number format
 * @param {string} value - GST number
 * @returns {string|null} - Error message or null if valid
 */
export const validateGST = (value) => {
  if (!value) return null
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  if (!gstRegex.test(value.toUpperCase())) {
    return 'Please enter a valid GST number'
  }
  return null
}

/**
 * Validates percentage value (0-100)
 * @param {string} value - Percentage value
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validatePercentage = (value, fieldName) => {
  if (!value) return null
  const num = Number(value)
  if (isNaN(num) || num < 0 || num > 100) {
    return `${fieldName} must be between 0 and 100`
  }
  return null
}
