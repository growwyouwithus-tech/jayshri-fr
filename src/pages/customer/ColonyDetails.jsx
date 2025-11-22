import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  LocationOn,
  CheckCircle,
  ArrowBack,
  Home,
  Landscape,
  AttachMoney,
} from '@mui/icons-material'
import { fetchColonyById } from '../../store/slices/colonySlice.js'
import { fetchPlotsByColony } from '../../store/slices/plotSlice.js'

const ColonyDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { selectedColony, loading: colonyLoading } = useSelector((state) => state.colony)
  const { plots, loading: plotsLoading } = useSelector((state) => state.plot)

  useEffect(() => {
    dispatch(fetchColonyById(id))
    dispatch(fetchPlotsByColony(id))
  }, [dispatch, id])

  if (colonyLoading || !selectedColony) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  const availablePlots = plots.filter((p) => p.status === 'available')

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customer/colonies')}
          sx={{ mb: 3 }}
        >
          Back to Colonies
        </Button>

        <Grid container spacing={4}>
          {/* Left Column - Images and Details */}
          <Grid item xs={12} md={8}>
            {/* Main Image */}
            <Card sx={{ mb: 3 }}>
              <CardMedia
                component="img"
                height="400"
                image={selectedColony.layoutUrl || 'https://via.placeholder.com/800x400'}
                alt={selectedColony.name}
                sx={{ objectFit: 'cover' }}
              />
            </Card>

            {/* Colony Info */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {selectedColony.name}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationOn color="action" />
                  <Typography variant="body1" color="text.secondary">
                    {selectedColony.location?.address}, {selectedColony.location?.city}, {selectedColony.location?.state} - {selectedColony.location?.pincode}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  <Chip
                    label={`₹${selectedColony.basePricePerGaj?.toLocaleString()}/Gaj`}
                    color="primary"
                  />
                  <Chip
                    label={`${selectedColony.totalPlots} Total Plots`}
                    variant="outlined"
                  />
                  <Chip
                    label={`${selectedColony.availablePlots} Available`}
                    color="success"
                  />
                  <Chip
                    label={selectedColony.status?.replace('_', ' ').toUpperCase()}
                    color="info"
                    variant="outlined"
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {selectedColony.description || 'Premium residential colony with modern amenities and excellent connectivity.'}
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Amenities
                </Typography>
                <Grid container spacing={1}>
                  {selectedColony.amenities?.map((amenity, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle fontSize="small" color="success" />
                        <Typography variant="body2">{amenity}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {selectedColony.facilities && selectedColony.facilities.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Facilities
                    </Typography>
                    <Grid container spacing={1}>
                      {selectedColony.facilities.map((facility, idx) => (
                        <Grid item xs={12} sm={6} key={idx}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircle fontSize="small" color="primary" />
                            <Typography variant="body2">{facility}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Quick Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 80 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Quick Info
                </Typography>

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Home color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Area"
                      secondary={`${selectedColony.totalLandAreaGaj?.toFixed(2)} Gaj`}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Landscape color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Plots"
                      secondary={`${selectedColony.totalPlots} Plots`}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <AttachMoney color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Base Price"
                      secondary={`₹${selectedColony.basePricePerGaj?.toLocaleString()}/Gaj`}
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {availablePlots.length} plots available for booking
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ mt: 2 }}
                  disabled={availablePlots.length === 0}
                >
                  View Available Plots
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Available Plots Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Available Plots
          </Typography>

          {plotsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : availablePlots.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No plots available at the moment
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {availablePlots.map((plot) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={plot._id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                      },
                    }}
                    onClick={() => navigate(`/customer/plots/${plot._id}`)}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {plot.plotNo}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Area: {plot.areaGaj} Gaj
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Facing: {plot.facing}
                        </Typography>
                        {plot.cornerPlot && (
                          <Chip label="Corner Plot" size="small" color="warning" sx={{ mt: 1 }} />
                        )}
                      </Box>

                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        ₹{plot.totalPrice?.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ₹{plot.pricePerGaj?.toLocaleString()}/Gaj
                      </Typography>

                      <Button variant="outlined" fullWidth sx={{ mt: 2 }} size="small">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </Box>
  )
}

export default ColonyDetails
