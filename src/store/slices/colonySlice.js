// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import api from '@/api/axios'

// const initialState = {
//   colonies: [],
//   currentColony: null,
//   loading: false,
//   error: null,
// }

// export const fetchColonies = createAsyncThunk(
//   'colony/fetchColonies',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await api.get('/colonies')
//       return response.data.data.colonies
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch colonies')
//     }
//   }
// )

// const colonySlice = createSlice({
//   name: 'colony',
//   initialState,
//   reducers: {
//     clearError: (state) => {
//       state.error = null
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchColonies.pending, (state) => {
//         state.loading = true
//       })
//       .addCase(fetchColonies.fulfilled, (state, action) => {
//         state.loading = false
//         state.colonies = action.payload
//       })
//       .addCase(fetchColonies.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//       })
//   },
// })

// export const { clearError } = colonySlice.actions
// export default colonySlice.reducer


//new.......

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'

const initialState = {
  colonies: [],
  selectedColony: null,
  loading: false,
  error: null,
}

// 🟢 Fetch all colonies
export const fetchColonies = createAsyncThunk(
  'colony/fetchColonies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/colonies')
      console.log('API Response:', response.data)
      return response.data.data.colonies
    } catch (error) {
      console.error('Fetch colonies error:', error)
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch colonies')
    }
  }
)

// 🟢 Fetch single colony by ID
export const fetchColonyById = createAsyncThunk(
  'colony/fetchColonyById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/colonies/${id}`)
      console.log('Single Colony Response:', response.data)
      return response.data.data.colony
    } catch (error) {
      console.error('Fetch colony error:', error)
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch colony details')
    }
  }
)

const colonySlice = createSlice({
  name: 'colony',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔵 Fetch all colonies
      .addCase(fetchColonies.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchColonies.fulfilled, (state, action) => {
        state.loading = false
        state.colonies = action.payload
      })
      .addCase(fetchColonies.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // 🔵 Fetch single colony by ID
      .addCase(fetchColonyById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchColonyById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedColony = action.payload
        state.error = null
      })
      .addCase(fetchColonyById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.selectedColony = null
      })
  },
})

export const { clearError } = colonySlice.actions
export default colonySlice.reducer
