import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material'
import { ArrowForward } from '@mui/icons-material'

/**
 * Common Dashboard
 * Redirects to role-specific dashboard
 */
const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (user?.role?.name) {
      const roleRoutes = {
        'Buyer': '/buyer/dashboard',
        'Admin': '/admin/dashboard',
        'Manager': '/admin/dashboard',
        'Lawyer': '/lawyer/dashboard',
        'Agent': '/agent/dashboard',
      }

      const route = roleRoutes[user.role.name]
      if (route) {
        navigate(route, { replace: true })
      }
    }
  }, [user, navigate])

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Welcome, {user?.name}!
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Getting Started
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Explore the platform features based on your role
              </Typography>
              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/dashboard')}
              >
                Explore
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
