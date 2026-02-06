import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Grid, Card, CardContent, Button, CircularProgress } from '@mui/material'
import { Home, Receipt, TrendingUp, Payment } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const BuyerDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    totalPaid: 0,
    pendingAmount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/bookings')
      const bookings = data.data.bookings
      
      const totalPaid = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0)
      const pendingAmount = bookings.reduce((sum, b) => sum + (b.pendingAmount || 0), 0)
      
      setStats({
        totalBookings: bookings.length,
        activeBookings: bookings.filter(b => b.status === 'approved' || b.status === 'pending').length,
        totalPaid,
        pendingAmount
      })
      setLoading(false)
    } catch (error) {
      toast.error('Failed to fetch stats')
      setLoading(false)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Buyer Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" color="white" fontWeight="bold">{stats.totalBookings}</Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">Total Bookings</Typography>
                </Box>
                <Receipt sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" color="white" fontWeight="bold">{stats.activeBookings}</Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">Active Bookings</Typography>
                </Box>
                <Home sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" color="white" fontWeight="bold">₹{(stats.totalPaid / 100000).toFixed(1)}L</Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">Total Paid</Typography>
                </Box>
                <Payment sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" color="white" fontWeight="bold">₹{(stats.pendingAmount / 100000).toFixed(1)}L</Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">Pending Amount</Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Home color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6">Explore Colonies</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Browse available properties and find your dream plot
              </Typography>
              <Button variant="contained" onClick={() => navigate('/buyer/colonies')}>View Colonies</Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Receipt color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6">My Bookings</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Track your plot bookings and payment status
              </Typography>
              <Button variant="contained" onClick={() => navigate('/buyer/bookings')}>View Bookings</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default BuyerDashboard
