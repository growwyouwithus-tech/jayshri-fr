import { useState, useEffect } from 'react'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Grid, Card, CardContent
} from '@mui/material'
import { TrendingUp, Payment, HourglassEmpty } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { deriveCommissionsFromBookings } from '@/utils/commissionUtils'

const AgentCommissions = () => {
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0
  })

  useEffect(() => {
    fetchCommissions()
  }, [])

  const fetchCommissions = async () => {
    try {
      const { data } = await axios.get('/bookings')
      const bookings = Array.isArray(data?.data) ? data.data : data?.data?.bookings || []
      const comms = deriveCommissionsFromBookings(bookings)
        .filter((commission) => commission.agent?._id === data?.currentUserId || commission.agent?._id === bookings[0]?.agent?._id)
      setCommissions(comms)

      setStats({
        total: comms.reduce((sum, c) => sum + (c.finalAmount || 0), 0),
        pending: comms.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.finalAmount || 0), 0),
        approved: comms.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.finalAmount || 0), 0),
        paid: comms.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.finalAmount || 0), 0)
      })
      setLoading(false)
    } catch (error) {
      toast.error('Failed to fetch commissions')
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'info',
      paid: 'success'
    }
    return colors[status] || 'default'
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        My Commissions
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" color="white" fontWeight="bold">₹{(stats.total / 100000).toFixed(1)}L</Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">Total Commission</Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" color="white" fontWeight="bold">₹{(stats.pending / 100000).toFixed(1)}L</Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">Pending</Typography>
                </Box>
                <HourglassEmpty sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" color="white" fontWeight="bold">₹{(stats.approved / 100000).toFixed(1)}L</Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">Approved</Typography>
                </Box>
                <Payment sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" color="white" fontWeight="bold">₹{(stats.paid / 100000).toFixed(1)}L</Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">Paid</Typography>
                </Box>
                <Payment sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Booking #</strong></TableCell>
              <TableCell><strong>Sale Amount</strong></TableCell>
              <TableCell><strong>Rate</strong></TableCell>
              <TableCell><strong>Commission</strong></TableCell>
              <TableCell><strong>TDS</strong></TableCell>
              <TableCell><strong>Final Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No commissions found</TableCell>
              </TableRow>
            ) : (
              commissions.map((comm) => (
                <TableRow key={comm._id}>
                  <TableCell>{comm.bookingNumber}</TableCell>
                  <TableCell>₹{comm.saleAmount?.toLocaleString()}</TableCell>
                  <TableCell>{comm.commissionRate}%</TableCell>
                  <TableCell>₹{comm.commissionAmount?.toLocaleString()}</TableCell>
                  <TableCell>₹{comm.tdsAmount?.toLocaleString()}</TableCell>
                  <TableCell><strong>₹{comm.finalAmount?.toLocaleString()}</strong></TableCell>
                  <TableCell>
                    <Chip label={comm.status?.toUpperCase()} color={getStatusColor(comm.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    {comm.createdAt ? format(new Date(comm.createdAt), 'dd MMM yyyy') : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default AgentCommissions
