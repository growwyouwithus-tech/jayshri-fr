import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  MenuItem
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const AreasManagement = () => {
  const [areas, setAreas] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentArea, setCurrentArea] = useState(null)
  const [showEntries, setShowEntries] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('All Cities')
  const [formData, setFormData] = useState({
    name: '',
    cityId: ''
  })

  useEffect(() => {
    // Backend does not provide /areas; keep empty to avoid 404
    setAreas([])
    fetchCities()
    setLoading(false)
  }, [])

  const fetchAreas = async () => {
    // No-op: areas API not available
    setAreas([])
  }

  const fetchCities = async () => {
    try {
      const { data } = await axios.get('/cities')
      setCities(data.data || [])
    } catch (error) {
      console.error('Failed to fetch cities')
    }
  }

  const handleOpenDialog = (area = null) => {
    if (area) {
      setEditMode(true)
      setCurrentArea(area)
      setFormData({
        name: area.name,
        cityId: area.cityId._id || area.cityId
      })
    } else {
      setEditMode(false)
      setCurrentArea(null)
      setFormData({
        name: '',
        cityId: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentArea(null)
  }

  const handleSubmit = async () => {
    toast.error('Areas API not available')
  }

  const handleDelete = async (id) => {
    toast.error('Areas API not available')
  }

  const handleApply = () => {
    fetchAreas()
  }

  const filteredAreas = areas.filter(area => {
    const matchesSearch = area.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCity = selectedCity === 'All Cities' || 
      (area.cityId?.name === selectedCity)
    return matchesSearch && matchesCity
  }).slice(0, showEntries)

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Areas</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Area
        </Button>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">Show:</Typography>
          <TextField
            select
            size="small"
            value={showEntries}
            onChange={(e) => setShowEntries(e.target.value)}
            sx={{ minWidth: 80 }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </TextField>
        </Box>

        <TextField
          select
          size="small"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="All Cities">All Cities</MenuItem>
          {cities.map((city) => (
            <MenuItem key={city._id} value={city.name}>
              {city.name}
            </MenuItem>
          ))}
        </TextField>
        
        <TextField
          size="small"
          placeholder="Search area"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        
        <Button variant="outlined" onClick={handleApply}>
          Apply
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ '& td, & th': { border: '1px solid #000' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>SL</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Area</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>City</TableCell>
              <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAreas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No areas found. Click "Add Area" to create one.
                </TableCell>
              </TableRow>
            ) : (
              filteredAreas.map((area, index) => (
                <TableRow key={area._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{area.name}</TableCell>
                  <TableCell>{area.cityId?.name || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(area)} sx={{ color: 'orange' }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(area._id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Area' : 'Add Area'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="City"
                value={formData.cityId}
                onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                required
              >
                <MenuItem value="">Select City</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city._id} value={city._id}>
                    {city.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Area Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AreasManagement
