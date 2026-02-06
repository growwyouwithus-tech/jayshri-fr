import { useState, useEffect } from 'react'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, LinearProgress
} from '@mui/material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const MyBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get('/bookings')
      setBookings(data.data.bookings)
      setLoading(false)
    } catch (error) {
      toast.error('Failed to fetch bookings')
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      completed: 'info'
    }
    return colors[status] || 'default'
  }

  const getPaymentProgress = (paid, total) => {
    return (paid / total) * 100
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        My Bookings
      </Typography>

      {bookings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No bookings found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Booking #</strong></TableCell>
                <TableCell><strong>Plot</strong></TableCell>
                <TableCell><strong>Colony</strong></TableCell>
                <TableCell><strong>Total Amount</strong></TableCell>
                <TableCell><strong>Paid</strong></TableCell>
                <TableCell><strong>Payment Progress</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell>{booking.bookingNumber}</TableCell>
                  <TableCell>{booking.plotId?.plotNo}</TableCell>
                  <TableCell>{booking.plotId?.colonyId?.name}</TableCell>
                  <TableCell>₹{booking.totalAmount?.toLocaleString()}</TableCell>
                  <TableCell>₹{booking.paidAmount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Box sx={{ width: '100%' }}>
                      <LinearProgress
                        variant="determinate"
                        value={getPaymentProgress(booking.paidAmount, booking.totalAmount)}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {getPaymentProgress(booking.paidAmount, booking.totalAmount).toFixed(0)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status?.toUpperCase()}
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {booking.createdAt ? format(new Date(booking.createdAt), 'dd MMM yyyy') : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default MyBookings
