import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  Box, Typography, Card, CardContent, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress,
  Avatar, Divider, IconButton, Tooltip
} from '@mui/material'
import {
  People, TrendingUp, AttachMoney, CalendarToday, Phone, Email,
  Visibility, Refresh
} from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const AgentDashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    recentCustomers: 0
  })
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    if (user?.userCode) {
      fetchAgentData()
    }
  }, [user])

  const fetchAgentData = async () => {
    try {
      setLoading(true)
      
      // Fetch customers referred by this agent
      const { data } = await axios.get(`/customers?agentCode=${user.userCode}`)
      const referredCustomers = data.data || []
      
      setCustomers(referredCustomers)
      
      // Calculate statistics
      const totalCustomers = referredCustomers.length
      
      // Get bookings for these customers
      let totalBookings = 0
      let totalRevenue = 0
      
      for (const customer of referredCustomers) {
        if (customer.bookings && customer.bookings.length > 0) {
          totalBookings += customer.bookings.length
          // Sum up booking amounts
          customer.bookings.forEach(booking => {
            totalRevenue += booking.totalAmount || 0
          })
        }
      }
      
      // Recent customers (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentCustomers = referredCustomers.filter(c => 
        new Date(c.createdAt) > thirtyDaysAgo
      ).length
      
      setStats({
        totalCustomers,
        totalBookings,
        totalRevenue,
        recentCustomers
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch agent data:', error)
      toast.error('Failed to load agent dashboard')
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAgentData()
    setRefreshing(false)
    toast.success('Dashboard refreshed')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Agent Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your referred customers and performance
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{ bgcolor: 'background.paper' }}
          >
            <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Agent Info Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #41980a 0%, #2d6a07 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(255,255,255,0.2)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {user?.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Agent Code: <strong>{user?.userCode}</strong>
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Customers
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.totalCustomers}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Bookings
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.totalBookings}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <TrendingUp />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{(stats.totalRevenue / 100000).toFixed(1)}L
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <AttachMoney />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Recent (30 days)
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.recentCustomers}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <CalendarToday />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Customers Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Referred Customers
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {customers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <People sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Customers Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Share your agent code <strong>{user?.userCode}</strong> with potential customers
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table sx={{ '& td, & th': { border: '1px solid #000' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Customer</TableCell>
                    <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Contact</TableCell>
                    <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Joined Date</TableCell>
                    <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Bookings</TableCell>
                    <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Status</TableCell>
                    <TableCell align="center" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {customer.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption">{customer.phone}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption">{customer.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(customer.createdAt), 'dd MMM yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(customer.createdAt), 'hh:mm a')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${customer.bookings?.length || 0} Booking${customer.bookings?.length !== 1 ? 's' : ''}`}
                          size="small"
                          color={customer.bookings?.length > 0 ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={customer.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={customer.isActive ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      {stats.totalCustomers > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Performance Insights
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Conversion Rate
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    {stats.totalCustomers > 0 
                      ? ((stats.totalBookings / stats.totalCustomers) * 100).toFixed(1)
                      : 0}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Customers who made bookings
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Revenue per Customer
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    ₹{stats.totalCustomers > 0 
                      ? (stats.totalRevenue / stats.totalCustomers).toLocaleString('en-IN', { maximumFractionDigits: 0 })
                      : 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Average booking value
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Growth Rate
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="info.main">
                    {stats.totalCustomers > 0 
                      ? ((stats.recentCustomers / stats.totalCustomers) * 100).toFixed(1)
                      : 0}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    New customers this month
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default AgentDashboard
