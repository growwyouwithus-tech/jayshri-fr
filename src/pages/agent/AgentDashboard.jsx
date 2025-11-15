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
      // Fetch bookings assigned to this agent
      const { data } = await axios.get('/bookings')
      const agentBookings = data.data?.bookings || []
      
      setBookings(agentBookings)
      
      // Calculate stats
      const stats = {
        totalBookings: agentBookings.length,
        pendingBookings: agentBookings.filter(b => b.status === 'pending').length,
        approvedBookings: agentBookings.filter(b => b.status === 'approved').length,
        totalCommission: agentBookings
          .filter(b => b.status === 'approved')
          .reduce((sum, b) => sum + (b.totalAmount * 0.02), 0) // 2% commission
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
      case 'approved': return 'success'
      case 'rejected': return 'error'
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
                    <TableCell><strong>Booking ID</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>Plot</strong></TableCell>
                    <TableCell><strong>Colony</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.slice(0, 10).map((booking) => (
                    <TableRow key={booking._id} hover>
                      <TableCell>#{booking._id.slice(-6)}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {booking.buyerDetails?.name || booking.userId?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.buyerDetails?.email || booking.userId?.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        Plot #{booking.plotId?.plotNo}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {booking.plotId?.areaGaj} Gaj
                        </Typography>
                      </TableCell>
                      <TableCell>{booking.colonyId?.name}</TableCell>
                      <TableCell>₹{booking.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.status} 
                          color={getStatusColor(booking.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
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
