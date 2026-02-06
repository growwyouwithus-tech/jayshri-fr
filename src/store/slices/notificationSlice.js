import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
}

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications', { params })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications')
    }
  }
)

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`)
      return response.data.data.notification
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read')
    }
  }
)

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload)
      state.unreadCount += 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.notifications = action.payload.notifications
        state.unreadCount = action.payload.unreadCount
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n._id === action.payload._id)
        if (index !== -1) {
          state.notifications[index] = action.payload
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
  },
})

export const { clearError, addNotification } = notificationSlice.actions
export default notificationSlice.reducer
