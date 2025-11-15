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
import apiService from '@/services/apiService'
import errorService from '@/services/errorService'
import toast from 'react-hot-toast'

const CitiesManagement = () => {
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentCity, setCurrentCity] = useState(null)
  const [showEntries, setShowEntries] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    priority: 0
  })

  useEffect(() => {
    fetchCities()
  }, [])

  const fetchCities = async () => {
    try {
      setLoading(true)
      const response = await apiService.cities.getAll()
      setCities(response.data.data || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch cities:', error)
      setCities([])
      setLoading(false)
    }
  }

  const handleOpenDialog = (city = null) => {
    if (city) {
      setEditMode(true)
      setCurrentCity(city)
      setFormData({
        name: city.name,
        tagline: city.tagline || '',
        priority: city.priority || 0
      })
    } else {
      setEditMode(false)
      setCurrentCity(null)
      setFormData({
        name: '',
        tagline: '',
        priority: 0
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentCity(null)
  }

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await apiService.cities.update(currentCity._id, formData)
        errorService.showSuccess('City updated successfully')
      } else {
        await apiService.cities.create(formData)
        errorService.showSuccess('City created successfully')
      }
      handleCloseDialog()
      fetchCities()
    } catch (error) {
      errorService.handleApiError(error, 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this city?')) return

    try {
      await apiService.cities.delete(id)
      errorService.showSuccess('City deleted successfully')
      fetchCities()
    } catch (error) {
      errorService.handleApiError(error, 'Delete failed')
    }
  }

  const handleApply = () => {
    // Apply search filter
    fetchCities()
  }

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (city.tagline && city.tagline.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, showEntries)

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Cities</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add City
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
          size="small"
          placeholder="Search city"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        
        <Button variant="outlined" onClick={handleApply}>
          Apply
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>SL</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Tagline</strong></TableCell>
              <TableCell><strong>Priority</strong></TableCell>
              <TableCell align="right"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No cities found. Click "Add City" to create one.
                </TableCell>
              </TableRow>
            ) : (
              filteredCities.map((city, index) => (
                <TableRow key={city._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{city.name}</TableCell>
                  <TableCell>{city.tagline || '-'}</TableCell>
                  <TableCell>{city.priority || 0}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(city)} sx={{ color: 'orange' }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(city._id)}>
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
        <DialogTitle>{editMode ? 'Edit City' : 'Add City'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                multiline
                rows={3}
                placeholder="Enter city tagline"
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

export default CitiesManagement
