import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'

const initialState = {
  properties: [],
  selectedProperty: null,
  loading: false,
  error: null,
}

// Fetch all properties (public)
export const fetchProperties = createAsyncThunk(
  'property/fetchProperties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/properties/public')
      return response.data.data.properties
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch properties')
    }
  }
)

// Fetch property by ID (public)
export const fetchPropertyById = createAsyncThunk(
  'property/fetchPropertyById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/properties/public/${id}`)
      return response.data.data.property
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch property')
    }
  }
)

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setSelectedProperty: (state, action) => {
      state.selectedProperty = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all properties
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false
        state.properties = action.payload
        state.error = null
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch property by ID
      .addCase(fetchPropertyById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedProperty = action.payload
        state.error = null
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, setSelectedProperty } = propertySlice.actions
export default propertySlice.reducer
