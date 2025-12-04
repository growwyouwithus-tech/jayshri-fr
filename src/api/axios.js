import axios from 'axios'

/**
 * Axios Instance Configuration
 * Handles API requests with authentication and enhanced error handling
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    // Don't add token to login/register requests to avoid 401 with old tokens
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/register')
    
    if (!isAuthEndpoint) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    // If data is FormData, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
      console.log('[API Request] FormData detected, removing Content-Type header')
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`)
    }
    
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url}`, response.data)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Don't show error for auth endpoints - let them handle fallback
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register')
    
    if (isAuthEndpoint) {
      return Promise.reject(error)
    }

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        requestData: error.config?.data,
        responseData: error.response?.data,
        errors: error.response?.data?.errors
      })
    }

    // Handle network errors
    if (!error.response) {
      console.error('[Network Error] Unable to connect to server')
      return Promise.reject({
        message: 'Unable to connect to server. Please check your connection.',
        code: 'NETWORK_ERROR'
      })
    }

    // If error is 401, logout user
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token')
      // Don't logout for demo tokens or if already on login page
      if (!token || (!token.startsWith('demo-admin-token') && !token.startsWith('demo-token-'))) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }

    // If error is 403, show unauthorized message
    if (error.response?.status === 403) {
      console.warn('[Forbidden] You do not have permission to access this resource')
    }

    // If error is 500, log server error
    if (error.response?.status === 500) {
      console.error('[Server Error] Internal server error occurred')
    }

    return Promise.reject(error)
  }
)

export default api
