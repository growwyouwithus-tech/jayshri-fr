import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box, CircularProgress } from '@mui/material'

/**
 * Private Route Guard
 * Redirects to login if user is not authenticated
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth)

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

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default PrivateRoute
