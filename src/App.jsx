import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Box, CircularProgress } from '@mui/material'
import { checkAuth } from './store/slices/authSlice'

// Layouts
import MainLayout from './components/layouts/MainLayout'
import AuthLayout from './components/layouts/AuthLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Dashboard Pages
import Dashboard from './pages/Dashboard'

// Buyer Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard'
import ColonyMap from './pages/buyer/ColonyMap'
import MyBookings from './pages/buyer/MyBookings'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ColonyManagement from './pages/admin/ColonyManagement'
import PlotManagement from './pages/admin/PlotManagement'
import BookingManagement from './pages/admin/BookingManagement'
import SoldPlotManagement from './pages/admin/SoldPlotManagement'
import SoldPlotSlip from './pages/admin/SoldPlotSlip'
import RegistryManagement from './pages/admin/RegistryManagement'
import CommissionManagement from './pages/admin/CommissionManagement'
import UserManagement from './pages/admin/UserManagement'
import RoleManagement from './pages/admin/RoleManagement'
import Calculator from './pages/admin/Calculator'
import PropertyManagement from './pages/admin/PropertyManagement'
import CitiesManagement from './pages/admin/CitiesManagement'
import AreasManagement from './pages/admin/AreasManagement'
import StaffManagement from './pages/admin/StaffManagement'
import BookingDetail from './pages/admin/BookingDetail'
import Settings from './pages/admin/Settings'
import KisanPaymentManagement from './pages/admin/KisanPaymentManagement'
import ExpenseManagement from './pages/admin/ExpenseManagement'
import AgentManagement from './pages/admin/AgentManagement'
import AdvocateManagement from './pages/admin/AdvocateManagement'
import CustomerManagement from './pages/admin/CustomerManagement'



// Lawyer Pages
import LawyerDashboard from './pages/lawyer/LawyerDashboard'
import RegistryList from './pages/lawyer/RegistryList'

// Agent Pages
import AgentDashboard from '@/pages/agent/AgentDashboard'
import AgentCommissions from '@/pages/agent/AgentCommissions'
import Profile from '@/pages/Profile'
import Notifications from '@/pages/Notifications'

// Customer Pages
import CustomerHome from './pages/customer/Home'
import CustomerColonies from './pages/customer/Colonies'
import CustomerColonyDetails from './pages/customer/ColonyDetails'
import CustomerPlotDetails from './pages/customer/PlotDetails'

// Common Pages
import NotFound from './pages/NotFound'
import Unauthorized from './pages/Unauthorized'

// Test Component
import TestAPI from './components/TestAPI'

// Route Guards
import PrivateRoute from './components/guards/PrivateRoute'
import RoleRoute from './components/guards/RoleRoute'

/**
 * Main App Component
 * Handles routing and authentication state
 */
function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)

  useEffect(() => {
    // Check authentication on app load only if token exists
    const token = localStorage.getItem('token')
    console.log('🔐 Auth Check:', { token: !!token, user: user?.name, role: user?.role?.name })
    if (token && !user) {
      dispatch(checkAuth())
    }
  }, [dispatch, user])

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        {/* Common Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* Buyer Routes */}
        <Route path="/buyer">
          <Route index element={<Navigate to="/buyer/dashboard" replace />} />
          <Route path="dashboard" element={<RoleRoute roles={['Buyer']}><BuyerDashboard /></RoleRoute>} />
          <Route path="colonies" element={<RoleRoute roles={['Buyer']}><ColonyMap /></RoleRoute>} />
          <Route path="bookings" element={<RoleRoute roles={['Buyer']}><MyBookings /></RoleRoute>} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin">
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<RoleRoute roles={['Admin', 'Manager', 'Colony Manager']}><AdminDashboard /></RoleRoute>} />
          <Route path="colonies" element={<RoleRoute roles={['Admin', 'Manager']}><ColonyManagement /></RoleRoute>} />
          <Route path="plots" element={<RoleRoute roles={['Admin', 'Manager', 'Colony Manager']} permissions={['plot_read', 'plots_read', 'plot_create', 'plots_create']}><PlotManagement /></RoleRoute>} />
          <Route path="bookings" element={<RoleRoute roles={['Admin', 'Manager', 'Agent']}><BookingManagement /></RoleRoute>} />
          <Route path="sold-plots" element={<RoleRoute roles={['Admin', 'Manager', 'Agent']}><SoldPlotManagement /></RoleRoute>} />
          <Route path="registry" element={<RoleRoute roles={['Admin', 'Manager']}><RegistryManagement /></RoleRoute>} />
          <Route path="commissions" element={<RoleRoute roles={['Admin', 'Manager']}><CommissionManagement /></RoleRoute>} />
          <Route path="properties" element={<RoleRoute roles={['Admin', 'Manager']}><PropertyManagement /></RoleRoute>} />
          <Route path="cities" element={<RoleRoute roles={['Admin']}><CitiesManagement /></RoleRoute>} />
          <Route path="areas" element={<RoleRoute roles={['Admin']}><AreasManagement /></RoleRoute>} />
          <Route path="users" element={<RoleRoute roles={['Admin']}><UserManagement /></RoleRoute>} />
          <Route path="staff" element={<RoleRoute roles={['Admin']}><StaffManagement /></RoleRoute>} />
          <Route path="bookings/:id" element={<RoleRoute roles={['Admin', 'Manager']}><BookingDetail /></RoleRoute>} />

          <Route path="land-purchase" element={<RoleRoute roles={['Admin']}><ColonyManagement /></RoleRoute>} />
          <Route path="settings" element={<RoleRoute roles={['Admin']}><Settings /></RoleRoute>} />
          <Route path="roles" element={<RoleRoute roles={['Admin']}><RoleManagement /></RoleRoute>} />
          <Route path="calculator" element={<RoleRoute roles={['Admin', 'Manager']}><Calculator /></RoleRoute>} />
          <Route path="kisan-payments" element={<RoleRoute roles={['Admin', 'Manager']}><KisanPaymentManagement /></RoleRoute>} />
          <Route path="expenses" element={<RoleRoute roles={['Admin', 'Manager']}><ExpenseManagement /></RoleRoute>} />
          <Route path="customers" element={<RoleRoute roles={['Admin', 'Manager']}><CustomerManagement /></RoleRoute>} />
          <Route path="agents" element={<RoleRoute roles={['Admin', 'Manager']}><AgentManagement /></RoleRoute>} />
          <Route path="advocates" element={<RoleRoute roles={['Admin', 'Manager']}><AdvocateManagement /></RoleRoute>} />
        </Route>

        {/* Lawyer Routes */}
        <Route path="/lawyer">
          <Route index element={<Navigate to="/lawyer/dashboard" replace />} />
          <Route path="dashboard" element={<RoleRoute roles={['Lawyer']}><LawyerDashboard /></RoleRoute>} />
          <Route path="registry" element={<RoleRoute roles={['Lawyer']}><RegistryList /></RoleRoute>} />
        </Route>

        {/* Agent Routes */}
        <Route path="/agent">
          <Route index element={<Navigate to="/agent/dashboard" replace />} />
          <Route path="dashboard" element={<RoleRoute roles={['Agent']}><AgentDashboard /></RoleRoute>} />
          <Route path="commissions" element={<RoleRoute roles={['Agent']}><AgentCommissions /></RoleRoute>} />
        </Route>

        {/* Customer Routes - Public Access */}
        <Route path="/customer">
          <Route index element={<CustomerHome />} />
          <Route path="colonies" element={<CustomerColonies />} />
          <Route path="properties/:id" element={<CustomerColonyDetails />} />
          <Route path="plots/:id" element={<CustomerPlotDetails />} />
        </Route>
      </Route>

      {/* Standalone Protected Routes (Print Views) */}
      <Route path="/admin/bookings/:id/print" element={
        <PrivateRoute>
          <RoleRoute roles={['Admin', 'Manager']}>
            <SoldPlotSlip />
          </RoleRoute>
        </PrivateRoute>
      } />

      {/* Public Customer Routes */}
      <Route path="/customer">
        <Route index element={<CustomerHome />} />
        <Route path="colonies" element={<CustomerColonies />} />
        <Route path="properties/:id" element={<CustomerColonyDetails />} />
        <Route path="plots/:id" element={<CustomerPlotDetails />} />
      </Route>

      {/* Test Route */}
      <Route path="/test-api" element={<TestAPI />} />

      {/* Error Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />

      {/* Default Routes */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
