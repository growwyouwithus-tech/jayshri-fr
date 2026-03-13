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
  IconButton,
  InputAdornment,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
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
  const [showPassword, setShowPassword] = useState(false)

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
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '100%', maxWidth: 450, mx: 'auto' }}
    >
      {/* Brand Identity */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <img 
          src="/JAISHRI GROUP.png" 
          alt="Jayshri Group" 
          style={{ width: '160px', height: 'auto', marginBottom: '12px' }}
        />
        <Typography 
          variant="h4" 
          fontWeight={800} 
          sx={{ 
            color: '#1e293b', 
            letterSpacing: -1,
            fontSize: '1.75rem'
          }}
        >
          Welcome Back
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 400 }}>
          Please enter your credentials to access your portal.
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ mb: 2, py: 0, borderRadius: 2, bgcolor: '#fef2f2', color: '#dc2626', '& .MuiAlert-icon': { color: '#dc2626' }, border: '1px solid #fee2e2' }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
            Identity
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Email or User Code"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoFocus
            autoComplete="email"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#f8fafc',
                '&:hover': { bgcolor: '#f1f5f9' },
                '&.Mui-focused': { bgcolor: '#fff' }
              }
            }}
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
              Security
            </Typography>
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="Secret Passcode"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                    sx={{ color: '#64748b', mr: 0.5 }}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#f8fafc',
                '&:hover': { bgcolor: '#f1f5f9' },
                '&.Mui-focused': { bgcolor: '#fff' }
              }
            }}
          />
        </Box>

        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="medium"
          disabled={loading}
          sx={{ 
            mt: 1, 
            py: 1.2, 
            borderRadius: 2,
            fontSize: '0.9rem',
            fontWeight: 700,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #41980a 0%, #2e7d32 100%)',
            boxShadow: '0 8px 20px -5px rgba(65, 152, 10, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4da810 0%, #388e3c 100%)',
              boxShadow: '0 15px 25px -10px rgba(65, 152, 10, 0.4)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Log In to Portal'}
        </Button>
      </Box>

      <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #e2e8f0', textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Authorized access only. Need help?{' '}
          <Link 
            component={RouterLink} 
            to="/support" 
            sx={{ 
              color: '#41980a', 
              fontWeight: 700, 
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            Contact Administrator
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}

export default Login
