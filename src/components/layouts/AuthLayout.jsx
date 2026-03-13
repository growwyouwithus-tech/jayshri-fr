import { Outlet } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { useEffect } from 'react'

const AuthLayout = () => {
  useEffect(() => {
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        overflow: 'hidden',
        bgcolor: '#fff',
      }}
    >
      {/* Left Panel — Form */}
      <Box
        sx={{
          width: { xs: '100%', md: '45%', lg: '40%' },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 2,
          boxShadow: '20px 0 50px rgba(0,0,0,0.05)',
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: { xs: 4, md: 6, lg: 8 }, py: 3 }}>
          <Outlet />
        </Box>

        <Box sx={{ p: 4, textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500, letterSpacing: 0.5 }}>
            © {new Date().getFullYear()} JAYSHRI GROUP • PREMIUM REAL ESTATE SOLUTIONS
          </Typography>
        </Box>
      </Box>

      {/* Right Panel — Immersive Visual */}
      <Box
        sx={{
          flex: 1,
          height: '100%',
          display: { xs: 'none', md: 'block' },
          position: 'relative',
          backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=90)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(225deg, rgba(65, 152, 10, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
            zIndex: 1,
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: { md: 10, lg: 15 },
            color: '#fff',
            zIndex: 2,
          }}
        >
          <Box sx={{ maxWidth: 600 }}>
            <Typography 
              variant="overline" 
              sx={{ 
                letterSpacing: 6, 
                opacity: 0.9, 
                fontWeight: 800, 
                color: '#41980a',
                display: 'block',
                mb: 2
              }}
            >
              ESTABLISHED 2010
            </Typography>
            <Typography 
              variant="h2" 
              fontWeight={800} 
              sx={{ 
                lineHeight: 1.1, 
                mb: 3,
                fontSize: { md: '3.5rem', lg: '4.5rem' },
                textShadow: '0 10px 30px rgba(0,0,0,0.3)'
              }}
            >
              Build Your <span style={{ color: '#41980a' }}>Legacy</span> In Real Estate
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                opacity: 0.8, 
                fontWeight: 400, 
                lineHeight: 1.6,
                maxWidth: 500,
                mb: 4
              }}
            >
              Join the most trusted platform for property management and streamlined registry workflows.
            </Typography>

            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box>
                <Typography variant="h4" fontWeight={800}>500+</Typography>
                <Typography variant="caption" sx={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>Plots Sold</Typography>
              </Box>
              <Box sx={{ width: 1, height: 40, bgcolor: 'rgba(255,255,255,0.2)', alignSelf: 'center' }} />
              <Box>
                <Typography variant="h4" fontWeight={800}>15+</Typography>
                <Typography variant="caption" sx={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>Active Colonies</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default AuthLayout
