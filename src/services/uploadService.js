import api from '@/api/axios'
import errorService from './errorService'

/**
 * File Upload Service
 * Handles file uploads with progress tracking
 */

export const uploadService = {
  // Upload single file
  uploadSingle: async (file, folder = 'general', onProgress = null) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(progress)
          }
        }
      })

      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      errorService.handleApiError(error, 'File upload failed')
      return {
        success: false,
        error: error.response?.data?.message || 'Upload failed'
      }
    }
  },

  // Upload multiple files
  uploadMultiple: async (files, folder = 'general', onProgress = null) => {
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      formData.append('folder', folder)

      const response = await api.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(progress)
          }
        }
      })

      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      errorService.handleApiError(error, 'Files upload failed')
      return {
        success: false,
        error: error.response?.data?.message || 'Upload failed'
      }
    }
  },

  // Validate file before upload
  validateFile: (file, options = {}) => {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxFiles = 10
    } = options

    const errors = []

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Validate multiple files
  validateFiles: (files, options = {}) => {
    const { maxFiles = 10 } = options
    const errors = []

    // Check number of files
    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
    }

    // Validate each file
    files.forEach((file, index) => {
      const validation = uploadService.validateFile(file, options)
      if (!validation.isValid) {
        errors.push(`File ${index + 1}: ${validation.errors.join(', ')}`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Get file preview URL
  getPreviewUrl: (file) => {
    if (file instanceof File) {
      return URL.createObjectURL(file)
    }
    return file // Assume it's already a URL
  },

  // Clean up preview URLs
  cleanupPreviewUrl: (url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // Get file extension
  getFileExtension: (filename) => {
    return filename.split('.').pop().toLowerCase()
  },

  // Check if file is image
  isImage: (file) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    return imageTypes.includes(file.type)
  },

  // Check if file is document
  isDocument: (file) => {
    const docTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    return docTypes.includes(file.type)
  }
}

export default uploadService
