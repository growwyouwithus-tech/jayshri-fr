import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import colonyReducer from './slices/colonySlice'
import plotReducer from './slices/plotSlice'
import propertyReducer from './slices/propertySlice'
import bookingReducer from './slices/bookingSlice'
import registryReducer from './slices/registrySlice'
import commissionReducer from './slices/commissionSlice'
import notificationReducer from './slices/notificationSlice'

/**
 * Redux Store Configuration
 * Combines all slice reducers
 */
const store = configureStore({
  reducer: {
    auth: authReducer,
    colony: colonyReducer,
    plot: plotReducer,
    property: propertyReducer,
    booking: bookingReducer,
    registry: registryReducer,
    commission: commissionReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export default store
