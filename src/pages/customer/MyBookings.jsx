import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Button,
  Divider,
} from '@mui/material'
import { Receipt, LocationOn, Home, CalendarToday, Refresh, FilterList } from '@mui/icons-material'
import { IconButton, MenuItem, TextField } from '@mui/material'
import { fetchMyBookings } from '../../store/slices/bookingSlice'
import { format } from 'date-fns'

const MyBookings = () => {
  const dispatch = useDispatch()
  const { bookings, loading } = useSelector((state) => state.booking)

  useEffect(() => {
    dispatch(fetchMyBookings())
  }, [dispatch])

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      payment_pending: 'warning',
      payment_partial: 'info',
      approved: 'success',
      rejected: 'error',
      completed: 'success',
      cancelled: 'error',
    }
    return colors[status] || 'default'
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* Header - Purple */}
      <Box sx={{ bgcolor: '#6200EA', color: 'white', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" fontWeight={600} sx={{ fontSize: '1.4rem' }}>
          My Bookings
        </Typography>
        <IconButton sx={{ color: 'white' }}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Filters */}
      <Box sx={{ bgcolor: 'white', p: 2, display: 'flex', gap: 2, borderBottom: '1px solid #E0E0E0' }}>
        <TextField
          select
          size="small"
          defaultValue="pending"
          sx={{ 
            minWidth: 140,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
          InputProps={{
            startAdornment: <FilterList sx={{ mr: 1, color: '#666', fontSize: 20 }} />
          }}
        >
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          defaultValue="oldest"
          sx={{ 
            minWidth: 140,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
          InputProps={{
            startAdornment: <FilterList sx={{ mr: 1, color: '#666', fontSize: 20 }} />
          }}
        >
          <MenuItem value="oldest">Oldest</MenuItem>
          <MenuItem value="newest">Newest</MenuItem>
        </TextField>
      </Box>

      <Container maxWidth="lg" sx={{ py: 3 }}>

        {bookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
            {/* Illustration Circle */}
            <Box
              sx={{
                width: 200,
                height: 200,
                margin: '0 auto 24px',
                bgcolor: '#E8D5F5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 140,
                  bgcolor: '#6200EA',
                  borderRadius: '50% 50% 0 0',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  pb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 50,
                    bgcolor: '#FFA726',
                    borderRadius: 2,
                  }}
                />
              </Box>
            </Box>
            <Typography variant="h6" fontWeight={500} gutterBottom sx={{ fontSize: '1.1rem', mb: 1 }}>
              No Data
            </Typography>
            <Button 
              startIcon={<Refresh />}
              sx={{ 
                color: '#6200EA',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {bookings.map((booking) => (
              <Grid item xs={12} key={booking._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Booking #{booking.bookingNumber}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(booking.bookingDate), 'dd MMM yyyy')}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={booking.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(booking.status)}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Home color="primary" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Plot Details
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {booking.plotId?.plotNo}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {booking.plotId?.areaGaj} Gaj • {booking.plotId?.facing} Facing
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <LocationOn color="primary" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Colony
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {booking.plotId?.colonyId?.name}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="caption" color="text.secondary">
                          Total Amount
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          ₹{booking.totalAmount?.toLocaleString()}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="caption" color="text.secondary">
                          Paid Amount
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color="success.main">
                          ₹{booking.paidAmount?.toLocaleString()}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="caption" color="text.secondary">
                          Pending Amount
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color="error.main">
                          ₹{booking.pendingAmount?.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>

                    {booking.notes && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" color="text.secondary">
                          Notes
                        </Typography>
                        <Typography variant="body2">
                          {booking.notes}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  )
}

export default MyBookings
