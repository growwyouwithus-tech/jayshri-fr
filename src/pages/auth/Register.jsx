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
import { register, clearError } from '@/store/slices/authSlice'
import toast from 'react-hot-toast'

/**
 * Register Page
 */
const Register = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
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

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Clear any existing tokens before registration
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')

    try {
      await dispatch(register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      })).unwrap()
      
      toast.success('Registration successful!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err || 'Registration failed')
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center">
        Create Account
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Full Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        margin="normal"
        required
        autoFocus
      />

      <TextField
        fullWidth
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        margin="normal"
        required
      />

      <TextField
        fullWidth
        label="Phone Number"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        margin="normal"
        required
        placeholder="10-digit number"
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

      <TextField
        fullWidth
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
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
        {loading ? <CircularProgress size={24} /> : 'Sign Up'}
      </Button>

      <Box textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" underline="hover">
            Sign In
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}

export default Register
