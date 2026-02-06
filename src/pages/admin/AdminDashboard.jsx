import { useEffect, useState, useMemo } from 'react'
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Paper } from '@mui/material'
import { Business, Home, Receipt, TrendingUp } from '@mui/icons-material'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import axios from '@/api/axios'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [plotStatusData, setPlotStatusData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const [coloniesRes, bookingsRes, plotsRes] = await Promise.all([
        axios.get('/colonies'),
        axios.get('/bookings'),
        axios.get('/plots?limit=10000')
      ])

      const colonies = coloniesRes?.data?.data?.colonies || []
      const bookings = bookingsRes?.data?.data || []
      const plots = plotsRes?.data?.data?.plots || plotsRes?.data?.plots || []

      const totalColonies = colonies.length
      const totalPlots = plots.length
      const availablePlots = plots.filter(p => p.status === 'available').length
      const soldPlots = plots.filter(p => p.status === 'sold').length
      const reservedPlots = plots.filter(p => p.status === 'reserved').length
      const bookedPlots = plots.filter(p => p.status === 'booked').length
      const totalRevenue = plots.reduce((sum, plot) => sum + (plot.paidAmount || 0), 0)

      setStats({
        totalColonies,
        totalPlots,
        activeBookings: bookings.filter((booking) => booking.status === 'pending').length,
        totalRevenue,
        availablePlots,
        bookedPlots,
        soldPlots,
        reservedPlots
      })

      const statusData = [
        { name: 'Available', value: availablePlots },
        { name: 'Booked', value: bookedPlots },
        { name: 'Sold', value: soldPlots },
        { name: 'Reserved', value: reservedPlots }
      ].filter((item) => item.value > 0)
      setPlotStatusData(statusData)

      // Calculate revenue from plots' paidAmount grouped by month
      const revenueByMonth = plots.reduce((acc, plot) => {
        if (!plot.createdAt || !plot.paidAmount || plot.paidAmount === 0) return acc
        const date = new Date(plot.createdAt)
        const monthKey = date.toLocaleString('default', { month: 'short' })
        const monthEntry = acc.find((entry) => entry.month === monthKey)
        if (monthEntry) {
          monthEntry.revenue += plot.paidAmount
        } else {
          acc.push({ month: monthKey, revenue: plot.paidAmount })
        }
        return acc
      }, [])
      
      // Sort by month order
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const sortedRevenue = revenueByMonth.sort((a, b) => {
        return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
      })
      setRevenueData(sortedRevenue)

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setError(error.response?.data?.message || 'Failed to load dashboard')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Admin Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {stats?.totalColonies || 0}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Total Colonies
                  </Typography>
                </Box>
                <Business sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {stats?.totalPlots || 0}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Total Plots
                  </Typography>
                </Box>
                <Home sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {stats?.activeBookings || 0}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Active Bookings
                  </Typography>
                </Box>
                <Receipt sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {stats.totalRevenue > 0 
                      ? stats.totalRevenue >= 10000000 
                        ? `₹${(stats.totalRevenue / 10000000).toFixed(2)}Cr`
                        : stats.totalRevenue >= 100000
                          ? `₹${(stats.totalRevenue / 100000).toFixed(2)}L`
                          : `₹${stats.totalRevenue.toLocaleString('en-IN')}`
                      : '₹0'
                    }
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Total Revenue
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Revenue Trend</Typography>
            {revenueData && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
                      if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
                      return `₹${(value / 1000).toFixed(0)}K`
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => {
                      if (value >= 10000000) return [`₹${(value / 10000000).toFixed(2)}Cr`, 'Revenue']
                      if (value >= 100000) return [`₹${(value / 100000).toFixed(2)}L`, 'Revenue']
                      return [`₹${value.toLocaleString('en-IN')}`, 'Revenue']
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <Typography color="text.secondary">No revenue data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Plot Status</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={plotStatusData}
                  cx="60%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {plotStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AdminDashboard
