import api from '@/api/axios'

/**
 * Authentication Service
 * Handles login, register, logout, and user management
 */

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      const { token, user } = response.data.data
      
      // Store tokens and user data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      return { success: true, data: { user, token } }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return { success: true, data: response.data.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      }
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    } catch (error) {
      return null
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    return !!(token && user)
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData)
      const updatedUser = response.data.data
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return { success: true, data: updatedUser }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Profile update failed' 
      }
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      await api.put('/auth/change-password', passwordData)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Password change failed' 
      }
    }
  }
}

export default authService
