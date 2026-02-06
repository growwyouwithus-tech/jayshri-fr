
import { useState, useEffect } from 'react'
import { Box, Typography, Grid, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material'
import { Assignment, CheckCircle, Pending } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const LawyerDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0
  })
  const [recentRegistries, setRecentRegistries] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/registry')

      if (data.success) {
        const registries = data.data || []

        // Calculate statistics
        const total = registries.length
        const pending = registries.filter(r => r.status === 'pending' || r.status === 'confirmed').length
        const completed = registries.filter(r => r.status === 'completed').length

        setStats({ total, pending, completed })
        setRecentRegistries(registries.slice(0, 5)) // Show only 5 recent
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to load dashboard data')
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      completed: 'success',
      cancelled: 'error'
    }
    return colors[status] || 'default'
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Lawyer Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Stay on top of colony performance and plot activity at a glance.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Assignment sx={{ fontSize: 48, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Registries</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Pending sx={{ fontSize: 48, color: 'warning.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">{stats.pending}</Typography>
              <Typography variant="body2" color="text.secondary">Pending Registries</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">{stats.completed}</Typography>
              <Typography variant="body2" color="text.secondary">Completed Registries</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Registries */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Recent Registries
        </Typography>
        {recentRegistries.length === 0 ? (
          <Typography color="text.secondary">No registries assigned yet</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Booking #</TableCell>
                  <TableCell>Plot</TableCell>
                  <TableCell>Buyer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentRegistries.map((registry) => (
                  <TableRow key={registry._id}>
                    <TableCell>{registry.bookingNumber}</TableCell>
                    <TableCell>{registry.plot?.plotNumber || 'N/A'}</TableCell>
                    <TableCell>{registry.buyer?.name || 'N/A'}</TableCell>
                    <TableCell>₹{registry.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={registry.status}
                        color={getStatusColor(registry.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {registry.bookingDate ? format(new Date(registry.bookingDate), 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export default LawyerDashboard
