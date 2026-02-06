import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  Alert,
} from '@mui/material'
import { login, clearError } from '@/store/slices/authSlice'
import toast from 'react-hot-toast'




/**
 * Login Page
 */
const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    if (error) dispatch(clearError())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear any existing tokens before login to prevent 401 errors
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    try {
      await dispatch(login(formData)).unwrap()
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err || 'Login failed')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: '100%', maxWidth: 400, px: 2 }}
      >
        {/* Jayshree Properties Logo */}
        <Box display="flex" justifyContent="center" mb={3}>
          <img 
            src="/JAISHRI GROUP.png" 
            alt="Jayshri Properties" 
            style={{ width: '200px', height: 'auto' }}
          />
        </Box>
        
        <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center">
          Sign In
        </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Email or Phone"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        margin="normal"
        required
        autoFocus
        autoComplete="email"
        placeholder="admin@digitalcolony.com"
      />

      <TextField
        fullWidth
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        margin="normal"
        required
      />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>

        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register" underline="hover">
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default Login
