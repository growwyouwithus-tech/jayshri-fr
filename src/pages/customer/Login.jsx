import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material'
import { login } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password')
      return
    }

    setLoading(true)

    try {
      const result = await dispatch(login(formData)).unwrap()
      console.log('Login successful:', result)
      toast.success('Login successful! 🎉')
      navigate('/my-bookings')
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error?.message || error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Login to your account to continue
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            required
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" underline="hover">
                Register here
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default Login
