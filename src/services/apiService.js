import api from '@/api/axios'
import mockApiService from './mockApiService'

/**
 * API Service
 * Centralized API calls for all CRUD operations
 * Falls back to mock data when backend is not available
 */

// Check if we should use mock data (for development)
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' && import.meta.env.MODE !== 'production'

// Helper function to try real API first, fallback to mock
const withFallback = async (realApiCall, mockApiCall) => {
  if (USE_MOCK_DATA) {
    return mockApiCall()
  }
  return realApiCall()
}

export const apiService = {
  // ============ CITIES ============
  cities: {
    getAll: () => withFallback(
      () => api.get('/cities'),
      () => mockApiService.cities.getAll()
    ),
    getById: (id) => withFallback(
      () => api.get(`/cities/${id}`),
      () => mockApiService.cities.getById(id)
    ),
    create: (data) => withFallback(
      () => api.post('/cities', data),
      () => mockApiService.cities.create(data)
    ),
    update: (id, data) => withFallback(
      () => api.put(`/cities/${id}`, data),
      () => mockApiService.cities.update(id, data)
    ),
    delete: (id) => withFallback(
      () => api.delete(`/cities/${id}`),
      () => mockApiService.cities.delete(id)
    )
  },

  // ============ AREAS ============
  areas: {
    getAll: () => withFallback(
      () => api.get('/areas'),
      () => mockApiService.areas.getAll()
    ),
    getById: (id) => withFallback(
      () => api.get(`/areas/${id}`),
      () => mockApiService.areas.getById(id)
    ),
    getByCity: (cityId) => withFallback(
      () => api.get(`/areas?cityId=${cityId}`),
      () => mockApiService.areas.getByCity(cityId)
    ),
    create: (data) => withFallback(
      () => api.post('/areas', data),
      () => mockApiService.areas.create(data)
    ),
    update: (id, data) => withFallback(
      () => api.put(`/areas/${id}`, data),
      () => mockApiService.areas.update(id, data)
    ),
    delete: (id) => withFallback(
      () => api.delete(`/areas/${id}`),
      () => mockApiService.areas.delete(id)
    )
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
    getAll: (params = {}) => withFallback(
      () => api.get('/properties', { params }),
      () => Promise.resolve({ data: { data: [] } })
    ),
    getById: (id) => withFallback(
      () => api.get(`/properties/${id}`),
      () => Promise.resolve({ data: { data: null } })
    ),
    create: (data) => withFallback(
      () => api.post('/properties', data),
      () => mockApiService.plots.create(data)
    ),
    update: (id, data) => withFallback(
      () => api.put(`/properties/${id}`, data),
      () => mockApiService.plots.update(id, data)
    ),
    delete: (id) => withFallback(
      () => api.delete(`/properties/${id}`),
      () => mockApiService.plots.delete(id)
    ),
    uploadImages: (id, formData) => withFallback(
      () => api.post(`/properties/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
      () => Promise.resolve({ data: { data: [] } })
    )
  },

  // ============ USERS ============
  users: {
    getAll: (params = {}) => withFallback(
      () => api.get('/users', { params }),
      () => mockApiService.users.getAll()
    ),
    getById: (id) => withFallback(
      () => api.get(`/users/${id}`),
      () => mockApiService.users.getById(id)
    ),
    create: (data) => withFallback(
      () => api.post('/users', data),
      () => mockApiService.users.create(data)
    ),
    update: (id, data) => withFallback(
      () => api.put(`/users/${id}`, data),
      () => mockApiService.users.update(id, data)
    ),
    delete: (id) => withFallback(
      () => api.delete(`/users/${id}`),
      () => mockApiService.users.delete(id)
    ),
    updateStatus: (id, status) => withFallback(
      () => api.patch(`/users/${id}/status`, { status }),
      () => mockApiService.users.update(id, { status })
    )
  },

  // ============ STAFF ============
  staff: {
    getAll: (params = {}) => withFallback(
      () => api.get('/staff', { params }),
      () => mockApiService.staff.getAll()
    ),
    getById: (id) => withFallback(
      () => api.get(`/staff/${id}`),
      () => mockApiService.staff.getById(id)
    ),
    create: (data) => withFallback(
      () => api.post('/staff', data),
      () => mockApiService.staff.create(data)
    ),
    update: (id, data) => withFallback(
      () => api.put(`/staff/${id}`, data),
      () => mockApiService.staff.update(id, data)
    ),
    delete: (id) => withFallback(
      () => api.delete(`/staff/${id}`),
      () => mockApiService.staff.delete(id)
    ),
    uploadProfileImage: (id, formData) => withFallback(
      () => api.post(`/staff/${id}/profile-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
      () => Promise.resolve({ data: { data: { profileImage: 'https://via.placeholder.com/150' } } })
    )
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
    getAll: () => withFallback(
      () => api.get('/users/roles/all'),
      () => mockApiService.roles.getAll()
    ),
    getById: (id) => withFallback(
      () => api.get(`/users/roles/${id}`),
      () => mockApiService.roles.getById(id)
    ),
    create: (data) => withFallback(
      () => api.post('/users/roles', data),
      () => mockApiService.roles.create(data)
    ),
    update: (id, data) => withFallback(
      () => api.put(`/users/roles/${id}`, data),
      () => mockApiService.roles.update(id, data)
    ),
    delete: (id) => withFallback(
      () => api.delete(`/users/roles/${id}`),
      () => mockApiService.roles.delete(id)
    )
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
