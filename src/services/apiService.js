import api from '@/api/axios'
import mockApiService from './mockApiService'

/**
 * API Service
 * Centralized API calls for all CRUD operations
 * Falls back to mock data when backend is not available
 */

// Check if we should use mock data (for development)

// Helper function to try real API first, fallback to mock

export const apiService = {
  // ============ CITIES ============
  cities: {
    getAll: () => api.get('/cities'),
    getById: (id) => api.get(`/cities/${id}`),
    create: (data) => api.post('/cities', data),
    update: (id, data) => api.put(`/cities/${id}`, data),
    delete: (id) => api.delete(`/cities/${id}`)
  },

  // ============ AREAS ============
  areas: {
    getAll: () => api.get('/areas'),
    getById: (id) => api.get(`/areas/${id}`),
    getByCity: (cityId) => api.get(`/areas?cityId=${cityId}`),
    create: (data) => api.post('/areas', data),
    update: (id, data) => api.put(`/areas/${id}`, data),
    delete: (id) => api.delete(`/areas/${id}`)
  },

  // ============ COLONIES ============
  colonies: {
    getAll: () => api.get('/colonies'),
    getById: (id) => api.get(`/colonies/${id}`),
    create: (data) => api.post('/colonies', data),
    update: (id, data) => api.put(`/colonies/${id}`, data),
    delete: (id) => api.delete(`/colonies/${id}`),
    getStats: (id) => api.get(`/colonies/${id}/stats`)
  },

  // ============ PLOTS ============
  plots: {
    getAll: (params = {}) => api.get('/plots', { params }),
    getById: (id) => api.get(`/plots/${id}`),
    getByColony: (colonyId) => api.get(`/plots/colony/${colonyId}`),
    create: (data) => api.post('/plots', data),
    update: (id, data) => api.put(`/plots/${id}`, data),
    delete: (id) => api.delete(`/plots/${id}`),
    updateStatus: (id, status) => api.put(`/plots/${id}`, { status })
  },

  // ============ PROPERTIES ============
  properties: {
    getAll: (params = {}) => api.get('/properties', { params }),
    getById: (id) => api.get(`/properties/${id}`),
    create: (data) => api.post('/properties', data),
    update: (id, data) => api.put(`/properties/${id}`, data),
    delete: (id) => api.delete(`/properties/${id}`),
    uploadImages: (id, formData) => api.post(`/properties/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
  },

  // ============ USERS ============
  users: {
    getAll: (params = {}) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status })
  },

  // ============ STAFF ============
  staff: {
    getAll: (params = {}) => api.get('/staff', { params }),
    getById: (id) => api.get(`/staff/${id}`),
    create: (data) => api.post('/staff', data),
    update: (id, data) => api.put(`/staff/${id}`, data),
    delete: (id) => api.delete(`/staff/${id}`),
    uploadProfileImage: (id, formData) => api.post(`/staff/${id}/profile-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
  },

  // ============ BOOKINGS ============
  bookings: {
    getAll: (params = {}) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    create: (data) => api.post('/bookings', data),
    update: (id, data) => api.put(`/bookings/${id}`, data),
    delete: (id) => api.delete(`/bookings/${id}`),
    updateStatus: (id, status) => api.put(`/bookings/${id}`, { status }),
    cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
    addPaymentReceipt: (id, receiptData) => api.post(`/bookings/${id}/receipts`, receiptData),
    deletePaymentReceipt: (bookingId, receiptId) => api.delete(`/bookings/${bookingId}/receipts/${receiptId}`)
  },

  // ============ ROLES ============
  roles: {
    getAll: () => api.get('/users/roles/all'),
    getById: (id) => api.get(`/users/roles/${id}`),
    create: (data) => api.post('/users/roles', data),
    update: (id, data) => api.put(`/users/roles/${id}`, data),
    delete: (id) => api.delete(`/users/roles/${id}`)
  },

  // ============ SETTINGS ============
  settings: {
    getAll: () => api.get('/settings'),
    getByCategory: (category) => api.get(`/settings/${category}`),
    update: (category, data) => api.put(`/settings/${category}`, data),
    updateCompany: (data) => api.put('/settings/company', data),
    updateSystem: (data) => api.put('/settings/system', data),
    updatePayment: (data) => api.put('/settings/payment', data)
  },

  // ============ DASHBOARD ============
  dashboard: {
    getStats: () => api.get('/dashboard/stats'),
    getChartData: (type) => api.get(`/dashboard/charts/${type}`),
    getRecentActivity: () => api.get('/dashboard/recent-activity')
  },

  // ============ FILE UPLOAD ============
  upload: {
    single: (file, folder = 'general') => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      return api.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    multiple: (files, folder = 'general') => {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      formData.append('folder', folder)
      return api.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
  },

  // ============ REPORTS ============
  reports: {
    bookings: (params = {}) => api.get('/reports/bookings', { params }),
    revenue: (params = {}) => api.get('/reports/revenue', { params }),
    plots: (params = {}) => api.get('/reports/plots', { params }),
    users: (params = {}) => api.get('/reports/users', { params }),
    export: (type, params = {}) => api.get(`/reports/export/${type}`, { 
      params,
      responseType: 'blob'
    })
  }
}

export default apiService
