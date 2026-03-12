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
        bgcolor: 'background.paper',
      }}
    >
      {/* Left Panel — Form */}
      <Box
        sx={{
          width: { xs: '100%', md: '42%' },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          px: { xs: 4, md: 6 },
          py: { xs: 5, md: 7 },
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        <Outlet />

        <Box sx={{ mt: 'auto', pt: 3 }}>
          <Typography variant="caption" color="text.disabled">
            © {new Date().getFullYear()} Jayshri Group. All rights reserved.
          </Typography>
        </Box>
      </Box>

      {/* Right Panel — Background Image */}
      <Box
        sx={{
          flex: 1,
          height: '100%',
          display: { xs: 'none', md: 'block' },
          position: 'relative',
          backgroundImage:
            'linear-gradient(0deg, rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.15)), url(https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: { xs: 3, md: 5 },
            color: '#fff',
          }}
        >
          <Typography variant="overline" sx={{ letterSpacing: 4, opacity: 0.7 }}>
            JAYSHRI GROUP
          </Typography>
          <Typography variant="h4" fontWeight={700} mt={1}>
            Transforming land purchase journeys
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
            Streamline bookings, approvals, and plot insights with real-time dashboards tailored for your team.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default AuthLayout
