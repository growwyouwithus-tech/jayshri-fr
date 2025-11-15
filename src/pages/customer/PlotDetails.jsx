import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from '@mui/material'
import {
  ArrowBack,
  LocationOn,
  Map,
  AspectRatio,
  AttachMoney,
  Phone,
  CheckCircle,
  Tag,
} from '@mui/icons-material'
import { fetchPlotById } from '../../store/slices/plotSlice'
import { createBooking } from '../../store/slices/bookingSlice'
import toast from 'react-hot-toast'

const PlotDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { selectedPlot, loading } = useSelector((state) => state.plot)
  const { isAuthenticated } = useSelector((state) => state.auth)

  const [bookingDialog, setBookingDialog] = useState(false)
  const [bookingAmount, setBookingAmount] = useState('')
  const [priceView, setPriceView] = useState('perYard')

  useEffect(() => {
    dispatch(fetchPlotById(id))
  }, [dispatch, id])

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a plot')
      navigate('/login')
      return
    }

    if (!bookingAmount || bookingAmount <= 0) {
      toast.error('Please enter a valid booking amount')
      return
    }

    try {
      await dispatch(createBooking({
        plotId: id,
        bookingAmount: Number(bookingAmount),
      })).unwrap()

      toast.success('Booking request submitted successfully!')
      setBookingDialog(false)
      navigate('/my-bookings')
    } catch (error) {
      toast.error(error || 'Failed to create booking')
    }
  }

  if (loading || !selectedPlot) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  const isAvailable = selectedPlot.status === 'available'

  return (
    <Box sx={{ bgcolor: '#6200EA', minHeight: '100vh', pb: 2 }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#6200EA', color: 'white', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArrowBack onClick={() => navigate(`/customer/properties/${selectedPlot.colonyId._id}`)} sx={{ cursor: 'pointer' }} />
          <Typography variant="h6" fontWeight={500}>
            {selectedPlot.colonyId?.name || 'live longer live happy'} • Plots
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="sm" sx={{ px: 2 }}>

        {/* Plot Card */}
        <Card
          sx={{
            borderRadius: 4,
            overflow: 'visible',
            position: 'relative',
            mt: 2,
          }}
        >
          {/* Plot Image with Available Badge */}
          <Box
            sx={{
              height: 220,
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              borderRadius: '16px 16px 0 0',
            }}
          >
            {isAvailable && (
              <Chip
                label="AVAILABLE"
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  bgcolor: '#4CAF50',
                  color: 'white',
                  fontWeight: 700,
                  transform: 'rotate(-15deg)',
                  fontSize: '0.75rem',
                  height: 32,
                }}
              />
            )}
            <Chip
              label={`# #${selectedPlot.plotNo}`}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                fontWeight: 600,
              }}
            />
            <Map sx={{ fontSize: 80, color: 'grey.400' }} />
            
            {/* Dimensions Overlay */}
            <Chip
              icon={<AspectRatio sx={{ color: 'white !important' }} />}
              label={`Dimensions: ${selectedPlot.sideMeasurements?.front} ft × ${selectedPlot.sideMeasurements?.left} ft`}
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontWeight: 600,
              }}
            />
          </Box>

          <CardContent sx={{ p: 0 }}>
            {/* Price Toggle */}
            <Box sx={{ bgcolor: '#03A9F4', p: 2, display: 'flex', gap: 1 }}>
              <ToggleButtonGroup
                value={priceView}
                exclusive
                onChange={(e, val) => val && setPriceView(val)}
                sx={{ width: '100%' }}
              >
                <ToggleButton
                  value="perYard"
                  sx={{
                    flex: 1,
                    bgcolor: priceView === 'perYard' ? '#0288D1' : 'transparent',
                    color: 'white',
                    border: 'none',
                    borderRadius: 3,
                    '&.Mui-selected': {
                      bgcolor: '#0288D1',
                      color: 'white',
                      '&:hover': { bgcolor: '#0277BD' },
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <Tag sx={{ mr: 1, fontSize: 18 }} />
                  Price / Yard
                </ToggleButton>
                <ToggleButton
                  value="total"
                  sx={{
                    flex: 1,
                    bgcolor: priceView === 'total' ? '#7C4DFF' : 'transparent',
                    color: 'white',
                    border: 'none',
                    borderRadius: 3,
                    '&.Mui-selected': {
                      bgcolor: '#7C4DFF',
                      color: 'white',
                      '&:hover': { bgcolor: '#6A3DE8' },
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <AttachMoney sx={{ fontSize: 18 }} />
                  Total Price
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Plot Details */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AspectRatio color="action" />
                <Typography variant="body2" color="text.secondary">
                  Size
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ ml: 'auto' }}>
                  {selectedPlot.areaGaj}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Length (ft):
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedPlot.sideMeasurements?.front}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Width (ft):
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedPlot.sideMeasurements?.left}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Action Buttons */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Phone />}
                    sx={{
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      borderRadius: 3,
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    Contact
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<CheckCircle />}
                    disabled={!isAvailable}
                    onClick={() => setBookingDialog(true)}
                    sx={{
                      bgcolor: 'grey.700',
                      borderRadius: 3,
                      py: 1.5,
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'grey.800' },
                    }}
                  >
                    Book Now
                  </Button>
                </Grid>
              </Grid>

            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book Plot {selectedPlot.plotNo}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter your booking amount to proceed. Minimum booking amount is ₹1,00,000.
          </Typography>
          <TextField
            fullWidth
            label="Booking Amount"
            type="number"
            value={bookingAmount}
            onChange={(e) => setBookingAmount(e.target.value)}
            placeholder="100000"
            InputProps={{
              startAdornment: '₹',
            }}
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Total Plot Price: ₹{selectedPlot.totalPrice?.toLocaleString()}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(false)}>Cancel</Button>
          <Button onClick={handleBooking} variant="contained">
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PlotDetails
