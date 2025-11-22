import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  IconButton,
} from '@mui/material'
import {
  TrendingUp,
  Verified,
  LocalOffer,
  ArrowForward,
  LocationOn,
  Home as HomeIcon,
} from '@mui/icons-material'
import { fetchProperties } from '../../store/slices/propertySlice'

const Home = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { properties, loading } = useSelector((state) => state.property)

  useEffect(() => {
    dispatch(fetchProperties())
  }, [dispatch])

  const featuredProperties = properties.slice(0, 3)

  const handleLocationClick = (property) => {
    if (property.colony?.coordinates?.latitude && property.colony?.coordinates?.longitude) {
      const { latitude, longitude } = property.colony.coordinates
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')
    } else {
      console.log('Location not available for this property')
    }
  }

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* Mobile Header with City Image */}
      <Box
        sx={{
          height: 200,
          backgroundImage: 'url(https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.1))',
          }
        }}
      >
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
          <IconButton 
            sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
            onClick={() => featuredProperties[0] && handleLocationClick(featuredProperties[0])}
          >
            <LocationOn sx={{ color: '#6200EA' }} />
          </IconButton>
        </Box>
      </Box>


      {/* All Properties Section - Mobile */}
      <Box sx={{ bgcolor: 'white', px: 2, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem' }}>
            All Properties
          </Typography>
          <Button
            onClick={() => navigate('/customer/properties')}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#6200EA'
            }}
          >
            See All
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {featuredProperties.map((property) => (
              <Card
                key={property._id}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                onClick={() => navigate(`/customer/properties/${property._id}`)}
              >
                <Box sx={{ position: 'relative' }}>
                  {property.media?.mainPicture ? (
                    <CardMedia
                      component="img"
                      height="160"
                      image={property.media.mainPicture}
                      alt={property.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 160,
                        bgcolor: '#CCCCCC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <HomeIcon sx={{ fontSize: 60, color: '#888' }} />
                    </Box>
                  )}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLocationClick(property)
                    }}
                  >
                    <LocationOn sx={{ color: '#6200EA', fontSize: 20 }} />
                  </IconButton>
                </Box>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body1" fontWeight={600} gutterBottom noWrap>
                    {property.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <LocationOn sx={{ fontSize: 16, color: '#666' }} />
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.8rem' }} noWrap>
                      {property.address || property.colony?.address || 'Location not specified'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
                    <Chip
                      label={property.category || 'Residential'}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        height: 24, 
                        fontSize: '0.7rem',
                        borderRadius: 5,
                        borderColor: '#999'
                      }}
                    />
                    <Chip
                      label={`Amenities: ${property.amenities?.length || 0}`}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        height: 24, 
                        fontSize: '0.7rem',
                        borderRadius: 5,
                        borderColor: '#999'
                      }}
                    />
                    <Chip
                      label={`Facilities: ${property.facilities?.length || 0}`}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        height: 24, 
                        fontSize: '0.7rem',
                        borderRadius: 5,
                        borderColor: '#999'
                      }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    endIcon={<HomeIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      bgcolor: '#6200EA',
                      borderRadius: 2,
                      py: 1,
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#5200CA',
                      }
                    }}
                  >
                    See Plots
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Home
