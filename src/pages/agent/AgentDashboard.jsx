import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  TrendingUp,
  People,
  Assignment,
  AttachMoney
} from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const AgentDashboard = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    totalCommission: 0
  })

  useEffect(() => {
    fetchAgentData()
  }, [])

  const fetchAgentData = async () => {
    try {
      setLoading(true)
      // Fetch all bookings with high limit to get agent's bookings
      const { data } = await axios.get('/bookings?limit=10000')
      const allBookings = data.data || []
      
      // Get current user info
      const userStr = localStorage.getItem('user')
      const currentUser = userStr ? JSON.parse(userStr) : null
      
      // Filter bookings where current user is the agent
      const agentBookings = allBookings.filter(b => 
        b.agent?._id === currentUser?._id || b.agent === currentUser?._id
      )
      
      setBookings(agentBookings)
      
      // Calculate stats
      const totalCommission = agentBookings.reduce((sum, booking) => {
        // Check if booking has commissions array
        if (booking.commissions && Array.isArray(booking.commissions)) {
          const agentCommission = booking.commissions.find(c => 
            c.agent?._id === currentUser?._id || c.agent === currentUser?._id
          )
          return sum + (agentCommission?.amount || 0)
        }
        return sum
      }, 0)
      
      const stats = {
        totalBookings: agentBookings.length,
        pendingBookings: agentBookings.filter(b => b.status === 'pending').length,
        approvedBookings: agentBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length,
        totalCommission: totalCommission
      }
      
      setStats(stats)
    } catch (error) {
      console.error('Failed to fetch agent data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'confirmed': return 'success'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Agent Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Bookings
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalBookings}
                  </Typography>
                </Box>
                <Assignment color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending Bookings
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.pendingBookings}
                  </Typography>
                </Box>
                <People color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Approved Bookings
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.approvedBookings}
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Commission
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{stats.totalCommission.toLocaleString()}
                  </Typography>
                </Box>
                <AttachMoney color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Bookings */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={3}>
            Recent Bookings
          </Typography>
          
          {bookings.length === 0 ? (
            <Alert severity="info">
              No bookings assigned to you yet. Contact your admin to get plot assignments.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Booking No.</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>Plot</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Commission</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.slice(0, 10).map((booking) => {
                    const userStr = localStorage.getItem('user')
                    const currentUser = userStr ? JSON.parse(userStr) : null
                    const agentCommission = booking.commissions?.find(c => 
                      c.agent?._id === currentUser?._id || c.agent === currentUser?._id
                    )
                    
                    return (
                      <TableRow key={booking._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {booking.bookingNumber || `#${booking._id.slice(-6)}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {booking.buyer?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking.buyer?.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {booking.plot?.plotNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.plot?.area} Sq.Ft
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            ₹{booking.totalAmount?.toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600" color="success.main">
                            ₹{agentCommission?.amount?.toLocaleString('en-IN') || '0'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={booking.status} 
                            color={getStatusColor(booking.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-IN')}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default AgentDashboard
