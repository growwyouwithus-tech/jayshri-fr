import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'

const initialState = {
  registries: [],
  currentRegistry: null,
  history: [],
  loading: false,
  error: null,
}

export const fetchRegistries = createAsyncThunk(
  'registry/fetchRegistries',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/registry', { params })
      return response.data.data.registries
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch registries')
    }
  }
)

export const generateRegistry = createAsyncThunk(
  'registry/generateRegistry',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.post('/registry/generate', { bookingId })
      return response.data.data.registry
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate registry')
    }
  }
)

export const updateRegistryStatus = createAsyncThunk(
  'registry/updateStatus',
  async ({ id, status, note }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/registry/${id}/status`, { status, note })
      return response.data.data.registry
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status')
    }
  }
)

export const fetchRegistryHistory = createAsyncThunk(
  'registry/fetchHistory',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/registry/${id}/history`)
      return response.data.data.history
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch history')
    }
  }
)

const registrySlice = createSlice({
  name: 'registry',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRegistries.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchRegistries.fulfilled, (state, action) => {
        state.loading = false
        state.registries = action.payload
      })
      .addCase(fetchRegistries.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(generateRegistry.fulfilled, (state, action) => {
        state.registries.unshift(action.payload)
      })
      .addCase(updateRegistryStatus.fulfilled, (state, action) => {
        const index = state.registries.findIndex(r => r._id === action.payload._id)
        if (index !== -1) {
          state.registries[index] = action.payload
        }
      })
      .addCase(fetchRegistryHistory.fulfilled, (state, action) => {
        state.history = action.payload
      })
  },
})

export const { clearError } = registrySlice.actions
export default registrySlice.reducer
