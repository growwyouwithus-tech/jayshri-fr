import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'

const initialState = {
  plots: [],
  selectedPlot: null,
  loading: false,
  error: null,
}

export const fetchPlots = createAsyncThunk(
  'plot/fetchPlots',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/plots', { params })
      return response.data.data.plots
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plots')
    }
  }
)

export const fetchPlotsByColony = createAsyncThunk(
  'plot/fetchPlotsByColony',
  async (colonyId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/plots/colony/${colonyId}`)
      return response.data.data.plots
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plots')
    }
  }
)

export const fetchPlotById = createAsyncThunk(
  'plot/fetchPlotById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/plots/${id}`)
      console.log('Single Plot Response:', response.data)
      return response.data.data.plot
    } catch (error) {
      console.error('Fetch plot error:', error)
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plot details')
    }
  }
)

const plotSlice = createSlice({
  name: 'plot',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentPlot: (state, action) => {
      state.selectedPlot = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔵 Fetch all plots
      .addCase(fetchPlots.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchPlots.fulfilled, (state, action) => {
        state.loading = false
        state.plots = action.payload
      })
      .addCase(fetchPlots.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // 🔵 Fetch plots by colony
      .addCase(fetchPlotsByColony.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPlotsByColony.fulfilled, (state, action) => {
        state.loading = false
        state.plots = action.payload
        state.error = null
      })
      .addCase(fetchPlotsByColony.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // 🔵 Fetch single plot by ID
      .addCase(fetchPlotById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPlotById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedPlot = action.payload
        state.error = null
      })
      .addCase(fetchPlotById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.selectedPlot = null
      })
  },
})

export const { clearError, setCurrentPlot } = plotSlice.actions
export default plotSlice.reducer
