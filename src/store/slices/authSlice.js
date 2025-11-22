import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'

/**
 * Auth Slice
 * Manages authentication state and user session
 */

// Initial state
const initialState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false, // Don't start with loading state
  error: null,
}

// Register (Admin/Staff)
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData)
      // Handle both direct response and wrapped response
      const data = response.data.data || response.data
      
      // Save tokens to localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      return {
        user: data.user,
        token: data.token,
      }
    } catch (error) {
      console.error('Registration error:', error)
      return rejectWithValue(error.response?.data?.message || error.message || 'Registration failed')
    }
  }
)

// Register Customer (User App)
export const registerCustomer = createAsyncThunk(
  'auth/registerCustomer',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/customer-auth/register', userData)
      const data = response.data.data || response.data
      
      // Save tokens to localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('customer', JSON.stringify(data.customer))
      localStorage.setItem('userType', 'customer')
      
      return {
        user: data.customer,
        token: data.token,
        userType: 'customer'
      }
    } catch (error) {
      console.error('Customer registration error:', error)
      return rejectWithValue(error.response?.data?.message || error.message || 'Registration failed')
    }
  }
)

// Login Customer (User App)
export const loginCustomer = createAsyncThunk(
  'auth/loginCustomer',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/customer-auth/login', credentials)
      const data = response.data.data || response.data
      
      // Save tokens to localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('customer', JSON.stringify(data.customer))
      localStorage.setItem('userType', 'customer')
      
      return {
        user: data.customer,
        token: data.token,
        userType: 'customer'
      }
    } catch (error) {
      console.error('Customer login error:', error)
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed')
    }
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials)
      // Handle both direct response and wrapped response
      const data = response.data.data || response.data
      
      // Save tokens to localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      return {
        user: data.user,
        token: data.token,
      }
    } catch (error) {
      console.error('Login error:', error)
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { refreshToken } = getState().auth
      if (!refreshToken) {
        return null
      }
      await api.post('/auth/logout', { refreshToken })
      return null
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed')
    }
  }
)

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        return rejectWithValue('No token found')
      }
      
      // Check if demo token
      if (token.startsWith('demo-admin-token') || token.startsWith('demo-token-')) {
        // Return demo user for demo tokens
        const demoUser = JSON.parse(localStorage.getItem('user')) || {
          _id: 'demo123',
          name: 'Demo User',
          email: localStorage.getItem('email') || 'demo@example.com',
          role: { name: 'Buyer' },
        }
        return { user: demoUser }
      }
      
      const response = await api.get('/auth/me')
      const userData = response.data.data || response.data
      // Update localStorage with fresh user data
      localStorage.setItem('user', JSON.stringify(userData))
      return { user: userData }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Authentication check failed')
    }
  }
)

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Register Customer
      .addCase(registerCustomer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        localStorage.setItem('token', action.payload.token)
        localStorage.setItem('userType', 'customer')
      })
      .addCase(registerCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Login Customer
      .addCase(loginCustomer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        localStorage.setItem('token', action.payload.token)
        localStorage.setItem('userType', 'customer')
      })
      .addCase(loginCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.error = null
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .addCase(logout.rejected, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        // Update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
  },
})

export const { clearError, updateUser } = authSlice.actions
export default authSlice.reducer
