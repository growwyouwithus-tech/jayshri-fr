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
import { fetchColonies } from '../../store/slices/colonySlice'

const Home = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { colonies, loading } = useSelector((state) => state.colony)

  useEffect(() => {
    dispatch(fetchColonies())
  }, [dispatch])

  const featuredColonies = colonies.slice(0, 3)

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
          <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
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
            onClick={() => navigate('/customer/colonies')}
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
            {featuredColonies.map((colony) => (
              <Card
                key={colony._id}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                onClick={() => navigate(`/customer/properties/${colony._id}`)}
              >
                <Box sx={{ position: 'relative' }}>
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
                </Box>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body1" fontWeight={600} gutterBottom noWrap>
                    {colony.name || 'live longer live happy'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <LocationOn sx={{ fontSize: 16, color: '#666' }} />
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.8rem' }}>
                      vikas nagar {'>'} Awas Vikas {'>'} Agra
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
                    <Chip
                      label="Residential"
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
                      label={`Completed: ${colony.soldPlots || 1}`}
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
                      label={`Amenities: ${colony.amenities?.length || 1}`}
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
                      label={`Facilities: ${colony.facilities?.length || 1}`}
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
