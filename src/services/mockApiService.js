import { 
  testCities, testAreas, testRoles, testUsers, testColonies, 
  testPlots, testBookings, testStaff, testSettings 
} from '@/data/testData'

/**
 * Mock API Service for Development
 * Simulates API calls with hardcoded data
 */

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock response format
const mockResponse = (data) => ({
  data: { data }
})

export const mockApiService = {
  // ============ CITIES ============
  cities: {
    getAll: async () => {
      await delay()
      return mockResponse(testCities)
    },
    getById: async (id) => {
      await delay()
      const city = testCities.find(c => c._id === id)
      return mockResponse(city)
    },
    create: async (data) => {
      await delay()
      const newCity = {
        _id: Date.now().toString(),
        ...data,
        status: 'active',
        createdAt: new Date().toISOString()
      }
      testCities.push(newCity)
      return mockResponse(newCity)
    },
    update: async (id, data) => {
      await delay()
      const index = testCities.findIndex(c => c._id === id)
      if (index !== -1) {
        testCities[index] = { ...testCities[index], ...data }
        return mockResponse(testCities[index])
      }
      throw new Error('City not found')
    },
    delete: async (id) => {
      await delay()
      const index = testCities.findIndex(c => c._id === id)
      if (index !== -1) {
        testCities.splice(index, 1)
        return mockResponse({ message: 'City deleted successfully' })
      }
      throw new Error('City not found')
    }
  },

  // ============ AREAS ============
  areas: {
    getAll: async () => {
      await delay()
      return mockResponse(testAreas)
    },
    getById: async (id) => {
      await delay()
      const area = testAreas.find(a => a._id === id)
      return mockResponse(area)
    },
    getByCity: async (cityId) => {
      await delay()
      const areas = testAreas.filter(a => a.cityId._id === cityId)
      return mockResponse(areas)
    },
    create: async (data) => {
      await delay()
      const newArea = {
        _id: Date.now().toString(),
        ...data,
        status: 'active',
        createdAt: new Date().toISOString()
      }
      testAreas.push(newArea)
      return mockResponse(newArea)
    },
    update: async (id, data) => {
      await delay()
      const index = testAreas.findIndex(a => a._id === id)
      if (index !== -1) {
        testAreas[index] = { ...testAreas[index], ...data }
        return mockResponse(testAreas[index])
      }
      throw new Error('Area not found')
    },
    delete: async (id) => {
      await delay()
      const index = testAreas.findIndex(a => a._id === id)
      if (index !== -1) {
        testAreas.splice(index, 1)
        return mockResponse({ message: 'Area deleted successfully' })
      }
      throw new Error('Area not found')
    }
  },

  // ============ ROLES ============
  roles: {
    getAll: async () => {
      await delay()
      return mockResponse(testRoles)
    },
    getById: async (id) => {
      await delay()
      const role = testRoles.find(r => r._id === id)
      return mockResponse(role)
    },
    create: async (data) => {
      await delay()
      const newRole = {
        _id: Date.now().toString(),
        ...data,
        isActive: true,
        createdAt: new Date().toISOString()
      }
      testRoles.push(newRole)
      return mockResponse(newRole)
    },
    update: async (id, data) => {
      await delay()
      const index = testRoles.findIndex(r => r._id === id)
      if (index !== -1) {
        testRoles[index] = { ...testRoles[index], ...data }
        return mockResponse(testRoles[index])
      }
      throw new Error('Role not found')
    },
    delete: async (id) => {
      await delay()
      const index = testRoles.findIndex(r => r._id === id)
      if (index !== -1) {
        testRoles.splice(index, 1)
        return mockResponse({ message: 'Role deleted successfully' })
      }
      throw new Error('Role not found')
    }
  },

  // ============ USERS ============
  users: {
    getAll: async () => {
      await delay()
      return mockResponse(testUsers)
    },
    getById: async (id) => {
      await delay()
      const user = testUsers.find(u => u._id === id)
      return mockResponse(user)
    },
    create: async (data) => {
      await delay()
      const newUser = {
        _id: Date.now().toString(),
        ...data,
        status: 'active',
        profileImage: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString()
      }
      testUsers.push(newUser)
      return mockResponse(newUser)
    },
    update: async (id, data) => {
      await delay()
      const index = testUsers.findIndex(u => u._id === id)
      if (index !== -1) {
        testUsers[index] = { ...testUsers[index], ...data }
        return mockResponse(testUsers[index])
      }
      throw new Error('User not found')
    },
    delete: async (id) => {
      await delay()
      const index = testUsers.findIndex(u => u._id === id)
      if (index !== -1) {
        testUsers.splice(index, 1)
        return mockResponse({ message: 'User deleted successfully' })
      }
      throw new Error('User not found')
    }
  },

  // ============ COLONIES ============
  colonies: {
    getAll: async () => {
      await delay()
      return mockResponse(testColonies)
    },
    getById: async (id) => {
      await delay()
      const colony = testColonies.find(c => c._id === id)
      return mockResponse(colony)
    },
    create: async (data) => {
      await delay()
      const newColony = {
        _id: Date.now().toString(),
        ...data,
        status: 'planning',
        plotStats: { total: 0, available: 0, booked: 0, sold: 0 },
        createdAt: new Date().toISOString()
      }
      testColonies.push(newColony)
      return mockResponse(newColony)
    },
    update: async (id, data) => {
      await delay()
      const index = testColonies.findIndex(c => c._id === id)
      if (index !== -1) {
        testColonies[index] = { ...testColonies[index], ...data }
        return mockResponse(testColonies[index])
      }
      throw new Error('Colony not found')
    },
    delete: async (id) => {
      await delay()
      const index = testColonies.findIndex(c => c._id === id)
      if (index !== -1) {
        testColonies.splice(index, 1)
        return mockResponse({ message: 'Colony deleted successfully' })
      }
      throw new Error('Colony not found')
    }
  },

  // ============ PLOTS ============
  plots: {
    getAll: async (params = {}) => {
      await delay()
      let plots = [...testPlots]
      if (params.colonyId) {
        plots = plots.filter(p => p.colonyId._id === params.colonyId)
      }
      return mockResponse(plots)
    },
    getById: async (id) => {
      await delay()
      const plot = testPlots.find(p => p._id === id)
      return mockResponse(plot)
    },
    getByColony: async (colonyId) => {
      await delay()
      const plots = testPlots.filter(p => p.colonyId._id === colonyId)
      return mockResponse(plots)
    },
    create: async (data) => {
      await delay()
      const newPlot = {
        _id: Date.now().toString(),
        ...data,
        status: 'Available',
        registryStatus: 'Pending',
        createdAt: new Date().toISOString()
      }
      testPlots.push(newPlot)
      return mockResponse(newPlot)
    },
    update: async (id, data) => {
      await delay()
      const index = testPlots.findIndex(p => p._id === id)
      if (index !== -1) {
        testPlots[index] = { ...testPlots[index], ...data }
        return mockResponse(testPlots[index])
      }
      throw new Error('Plot not found')
    },
    delete: async (id) => {
      await delay()
      const index = testPlots.findIndex(p => p._id === id)
      if (index !== -1) {
        testPlots.splice(index, 1)
        return mockResponse({ message: 'Plot deleted successfully' })
      }
      throw new Error('Plot not found')
    }
  },

  // ============ BOOKINGS ============
  bookings: {
    getAll: async () => {
      await delay()
      return mockResponse(testBookings)
    },
    getById: async (id) => {
      await delay()
      const booking = testBookings.find(b => b._id === id)
      return mockResponse(booking)
    },
    create: async (data) => {
      await delay()
      const newBooking = {
        _id: Date.now().toString(),
        ...data,
        status: 'pending',
        paymentStatus: 'pending',
        paymentReceipts: [],
        bookingDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
      testBookings.push(newBooking)
      return mockResponse(newBooking)
    },
    update: async (id, data) => {
      await delay()
      const index = testBookings.findIndex(b => b._id === id)
      if (index !== -1) {
        testBookings[index] = { ...testBookings[index], ...data }
        return mockResponse(testBookings[index])
      }
      throw new Error('Booking not found')
    },
    delete: async (id) => {
      await delay()
      const index = testBookings.findIndex(b => b._id === id)
      if (index !== -1) {
        testBookings.splice(index, 1)
        return mockResponse({ message: 'Booking deleted successfully' })
      }
      throw new Error('Booking not found')
    }
  },

  // ============ STAFF ============
  staff: {
    getAll: async () => {
      await delay()
      return mockResponse(testStaff)
    },
    getById: async (id) => {
      await delay()
      const staff = testStaff.find(s => s._id === id)
      return mockResponse(staff)
    },
    create: async (data) => {
      await delay()
      const newStaff = {
        _id: Date.now().toString(),
        ...data,
        status: 'active',
        profileImage: 'https://via.placeholder.com/150',
        joiningDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
      testStaff.push(newStaff)
      return mockResponse(newStaff)
    },
    update: async (id, data) => {
      await delay()
      const index = testStaff.findIndex(s => s._id === id)
      if (index !== -1) {
        testStaff[index] = { ...testStaff[index], ...data }
        return mockResponse(testStaff[index])
      }
      throw new Error('Staff not found')
    },
    delete: async (id) => {
      await delay()
      const index = testStaff.findIndex(s => s._id === id)
      if (index !== -1) {
        testStaff.splice(index, 1)
        return mockResponse({ message: 'Staff deleted successfully' })
      }
      throw new Error('Staff not found')
    }
  },

  // ============ SETTINGS ============
  settings: {
    getAll: async () => {
      await delay()
      return mockResponse(testSettings)
    },
    getByCategory: async (category) => {
      await delay()
      return mockResponse(testSettings[category])
    },
    update: async (category, data) => {
      await delay()
      testSettings[category] = { ...testSettings[category], ...data }
      return mockResponse(testSettings[category])
    }
  },

  // ============ DASHBOARD ============
  dashboard: {
    getStats: async () => {
      await delay()
      return mockResponse({
        totalColonies: testColonies.length,
        totalPlots: testPlots.length,
        totalBookings: testBookings.length,
        totalUsers: testUsers.length,
        revenue: testBookings.reduce((sum, b) => sum + b.finalAmount, 0),
        availablePlots: testPlots.filter(p => p.status === 'Available').length,
        soldPlots: testPlots.filter(p => p.status === 'Sold').length
      })
    }
  }
}

export default mockApiService
