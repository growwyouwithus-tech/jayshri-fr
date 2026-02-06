import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'

/**
 * Booking Slice
 * Manages booking state and operations
 */

const initialState = {
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  },
}

// Async thunks
export const fetchBookings = createAsyncThunk(
  'booking/fetchBookings',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings', { params })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings')
    }
  }
)

export const fetchBookingById = createAsyncThunk(
  'booking/fetchBookingById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/bookings/${id}`)
      return response.data.data.booking
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking')
    }
  }
)

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings', bookingData)
      return response.data.data.booking
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking')
    }
  }
)

export const approveBooking = createAsyncThunk(
  'booking/approveBooking',
  async ({ id, remarks }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${id}/approve`, { remarks })
      return response.data.data.booking
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve booking')
    }
  }
)

export const rejectBooking = createAsyncThunk(
  'booking/rejectBooking',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${id}/reject`, { reason })
      return response.data.data.booking
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject booking')
    }
  }
)

export const addPayment = createAsyncThunk(
  'booking/addPayment',
  async ({ id, paymentData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/${id}/payment`, paymentData)
      return response.data.data.booking
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add payment')
    }
  }
)

// Slice
const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false
        state.bookings = action.payload.bookings
        state.pagination = action.payload.pagination
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Booking By ID
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false
        state.currentBooking = action.payload
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Create Booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false
        state.bookings.unshift(action.payload)
        state.currentBooking = action.payload
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Approve Booking
      .addCase(approveBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id)
        if (index !== -1) {
          state.bookings[index] = action.payload
        }
        if (state.currentBooking?._id === action.payload._id) {
          state.currentBooking = action.payload
        }
      })
      
      // Reject Booking
      .addCase(rejectBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id)
        if (index !== -1) {
          state.bookings[index] = action.payload
        }
        if (state.currentBooking?._id === action.payload._id) {
          state.currentBooking = action.payload
        }
      })
      
      // Add Payment
      .addCase(addPayment.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id)
        if (index !== -1) {
          state.bookings[index] = action.payload
        }
        if (state.currentBooking?._id === action.payload._id) {
          state.currentBooking = action.payload
        }
      })
  },
})

export const { clearError, clearCurrentBooking } = bookingSlice.actions
export default bookingSlice.reducer
