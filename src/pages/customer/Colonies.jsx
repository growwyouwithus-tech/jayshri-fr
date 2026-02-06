import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  TextField,
  MenuItem,
  CircularProgress,
  Button,
  InputAdornment,
} from '@mui/material'
import { Search, LocationOn, ArrowForward, FilterList } from '@mui/icons-material'
import { fetchColonies } from '../../store/slices/colonySlice'

const Colonies = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { colonies, loading } = useSelector((state) => state.colony)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    dispatch(fetchColonies())
  }, [dispatch])

  const filteredColonies = colonies
    .filter((colony) => {
      const matchesSearch = colony.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        colony.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || colony.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'price_low') return a.basePricePerGaj - b.basePricePerGaj
      if (sortBy === 'price_high') return b.basePricePerGaj - a.basePricePerGaj
      if (sortBy === 'available') return b.availablePlots - a.availablePlots
      return 0
    })

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Browse Colonies
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explore our premium colony projects across prime locations
          </Typography>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 4, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="ready_to_sell">Ready to Sell</MenuItem>
                <MenuItem value="selling">Selling</MenuItem>
                <MenuItem value="under_development">Under Development</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Name (A-Z)</MenuItem>
                <MenuItem value="price_low">Price (Low to High)</MenuItem>
                <MenuItem value="price_high">Price (High to Low)</MenuItem>
                <MenuItem value="available">Most Available</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterList />
                <Typography variant="body2" color="text.secondary">
                  {filteredColonies.length} Results
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Colony Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredColonies.length === 0 ? (
          <Card sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No colonies found matching your criteria
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredColonies.map((colony) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={colony._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    },
                  }}
                  onClick={() => navigate(`/customer/properties/${colony._id}`)}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={colony.layoutUrl || 'https://via.placeholder.com/400x180'}
                    alt={colony.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
                      {colony.name}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {colony.location?.city}, {colony.location?.state}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        flexGrow: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {colony.description || 'Premium colony with modern amenities'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip
                        label={`₹${colony.basePricePerGaj?.toLocaleString()}/Gaj`}
                        size="small"
                        color="primary"
                        variant="filled"
                      />
                      {colony.availablePlots > 0 && (
                        <Chip
                          label={`${colony.availablePlots} Available`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                      {colony.amenities?.slice(0, 3).map((amenity, idx) => (
                        <Chip
                          key={idx}
                          label={amenity}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                      {colony.amenities?.length > 3 && (
                        <Chip
                          label={`+${colony.amenities.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>

                    <Button
                      variant="outlined"
                      fullWidth
                      endIcon={<ArrowForward />}
                      size="small"
                    >
                      View Details
                    </Button>
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

export default Colonies
