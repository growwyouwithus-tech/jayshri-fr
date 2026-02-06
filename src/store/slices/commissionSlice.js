import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'

const initialState = {
  commissions: [],
  summary: null,
  loading: false,
  error: null,
}

export const fetchCommissions = createAsyncThunk(
  'commission/fetchCommissions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/commissions', { params })
      return response.data.data.commissions
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch commissions')
    }
  }
)

export const fetchCommissionSummary = createAsyncThunk(
  'commission/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/commissions/summary')
      return response.data.data.summary
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary')
    }
  }
)

const commissionSlice = createSlice({
  name: 'commission',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommissions.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchCommissions.fulfilled, (state, action) => {
        state.loading = false
        state.commissions = action.payload
      })
      .addCase(fetchCommissions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchCommissionSummary.fulfilled, (state, action) => {
        state.summary = action.payload
      })
  },
})

export const { clearError } = commissionSlice.actions
export default commissionSlice.reducer
