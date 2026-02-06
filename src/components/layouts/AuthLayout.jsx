import { Outlet } from 'react-router-dom'
import { Box, Grid, Stack, Typography, Divider } from '@mui/material'
import { Business } from '@mui/icons-material'

/**
 * Auth Layout Component
 * Layout for login and register pages
 */
const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: { xs: 6, md: 10 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 1180,
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: '0px 24px 70px rgba(15, 23, 42, 0.18)',
          bgcolor: 'background.paper',
        }}
      >
        <Grid container>
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                height: '100%',
                px: { xs: 4, md: 6 },
                py: { xs: 5, md: 7 },
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #6C2CF9 0%, #8E40FF 100%)',
                    boxShadow: '0px 18px 30px rgba(108, 44, 249, 0.25)',
                  }}
                >
                  <Business sx={{ fontSize: 30, color: '#fff' }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    Digital Colony
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Smart Plot Management Suite
                  </Typography>
                </Box>
              </Stack>

              <Box>
                <Typography variant="h3" fontWeight={700} gutterBottom>
                  Welcome Back!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Manage colonies, track bookings, and stay updated with your latest plot insights.
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Outlet />

              <Box>
                <Typography variant="caption" color="text.disabled">
                  © {new Date().getFullYear()} Digital Colony. All rights reserved.
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={7}>
            <Box
              sx={{
                height: '100%',
                minHeight: { xs: 220, md: '100%' },
                position: 'relative',
                backgroundImage:
                  'linear-gradient(0deg, rgba(15, 23, 42, 0.25), rgba(15, 23, 42, 0.25)), url(https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80)',
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
                  justifyContent: 'space-between',
                  p: { xs: 3, md: 5 },
                  color: '#fff',
                }}
              >
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: 4, opacity: 0.7 }}>
                    DIGITAL COLONY
                  </Typography>
                  <Typography variant="h4" fontWeight={700} mt={1}>
                    Transforming land purchase journeys
                  </Typography>
                </Box>
                <Box sx={{ opacity: 0.8 }}>
                  <Typography variant="body2">
                    Streamline bookings, approvals, and plot insights with real-time dashboards tailored for your team.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default AuthLayout
