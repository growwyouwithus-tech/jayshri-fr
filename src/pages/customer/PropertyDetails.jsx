import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material'
import {
  ArrowBack,
  LocationOn,
  Home,
  CheckCircle,
} from '@mui/icons-material'
import { fetchColonyById } from '../../store/slices/colonySlice'

const PropertyDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { selectedColony, loading } = useSelector((state) => state.colony)

  useEffect(() => {
    dispatch(fetchColonyById(id))
  }, [dispatch, id])

  if (loading || !selectedColony) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* Header - Grey like screenshot */}
      <Box sx={{ bgcolor: '#E0E0E0', color: '#000', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ArrowBack onClick={() => navigate('/colonies')} sx={{ cursor: 'pointer', fontSize: 24 }} />
          <Typography variant="h6" fontWeight={500} sx={{ fontSize: '1.1rem' }}>
            {selectedColony.name || 'live longer live happy'}
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="sm" sx={{ px: 0, py: 0 }}>
        {/* Property Card */}
        <Card
          sx={{
            borderRadius: 0,
            boxShadow: 'none',
            bgcolor: 'white',
          }}
        >
          {/* Property Image */}
          <Box
            sx={{
              height: 250,
              bgcolor: '#CCCCCC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Home sx={{ fontSize: 100, color: '#888' }} />
          </Box>

          <CardContent sx={{ p: 2.5, pb: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ fontSize: '1.4rem', mb: 1.5 }}>
              {selectedColony.name || 'live longer live happy'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2.5 }}>
              <LocationOn fontSize="small" sx={{ color: '#666', fontSize: 18 }} />
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                vikas nagar {'>'} Awas Vikas {'>'} Agra
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              <Chip
                label="Residential"
                size="small"
                variant="outlined"
                sx={{ 
                  borderRadius: 5, 
                  borderColor: '#999',
                  color: '#666',
                  fontSize: '0.75rem',
                  height: 28
                }}
              />
              <Chip
                label="Clubhouse"
                size="small"
                variant="outlined"
                sx={{ 
                  borderRadius: 5, 
                  borderColor: '#999',
                  color: '#666',
                  fontSize: '0.75rem',
                  height: 28
                }}
              />
              <Chip
                label="Completed: 1"
                size="small"
                variant="outlined"
                sx={{ 
                  borderRadius: 5, 
                  borderColor: '#999',
                  color: '#666',
                  fontSize: '0.75rem',
                  height: 28
                }}
              />
            </Box>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: '1.1rem', mb: 1 }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', mb: 3, lineHeight: 1.6 }}>
              {selectedColony.description || 'serklj hgkhkjfjksdkjhg'}
            </Typography>

            {/* Apply Property Button */}
            <Button
              variant="contained"
              fullWidth
              startIcon={<CheckCircle sx={{ fontSize: 20 }} />}
              onClick={() => navigate(`/colonies/${id}`)}
              sx={{
                bgcolor: '#6200EA',
                color: 'white',
                borderRadius: 8,
                py: 1.8,
                fontWeight: 600,
                fontSize: '1.05rem',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(98,0,234,0.3)',
                '&:hover': {
                  bgcolor: '#5200CA',
                  boxShadow: '0 6px 16px rgba(98,0,234,0.4)',
                },
              }}
            >
              Apply Property
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default PropertyDetails
