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
import { validateRequired, validateMinLength, validateNumeric } from '@/utils/validation'

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
    state: '',
    tagline: '',
    priority: 0
  })
  const [selectedCity, setSelectedCity] = useState(null)
  const [showAreas, setShowAreas] = useState(false)
  const [areaDialogOpen, setAreaDialogOpen] = useState(false)
  const [areaFormData, setAreaFormData] = useState({ name: '', cityId: '' })
  const [editingArea, setEditingArea] = useState(null)
  const [errors, setErrors] = useState({})

  const clearError = (fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

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
        state: city.state || '',
        tagline: city.tagline || '',
        priority: city.priority || 0
      })
    } else {
      setEditMode(false)
      setCurrentCity(null)
      setFormData({
        name: '',
        state: '',
        tagline: '',
        priority: 0
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentCity(null)
    setErrors({}) // Clear errors
  }

  const validateForm = () => {
    const newErrors = {}
    let isValid = true

    const nameError = validateRequired(formData.name, 'City Name') ||
                      validateMinLength(formData.name, 2, 'City Name')
    if (nameError) {
      newErrors.name = nameError
      isValid = false
    }

    const stateError = validateRequired(formData.state, 'State') ||
                       validateMinLength(formData.state, 2, 'State')
    if (stateError) {
      newErrors.state = stateError
      isValid = false
    }

    if (formData.priority) {
      const priorityError = validateNumeric(formData.priority, 'Priority')
      if (priorityError) {
        newErrors.priority = priorityError
        isValid = false
      }
    }

    setErrors(newErrors)

    if (!isValid) {
      const firstError = Object.values(newErrors)[0]
      toast.error(firstError, {
        position: 'top-right',
        autoClose: 4000,
      })
    }

    return isValid
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
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

  const handleAreaSubmit = async () => {
    if (!areaFormData.name.trim()) {
      toast.error('Area name is required')
      return
    }

    try {
      const updatedAreas = editingArea
        ? selectedCity.areas.map(a => a._id === editingArea._id ? { ...a, name: areaFormData.name } : a)
        : [...(selectedCity.areas || []), { name: areaFormData.name, _id: Date.now().toString() }]

      await apiService.cities.update(selectedCity._id, { areas: updatedAreas })
      toast.success(editingArea ? 'Area updated successfully' : 'Area added successfully')
      
      setAreaDialogOpen(false)
      setAreaFormData({ name: '', cityId: '' })
      setEditingArea(null)
      fetchCities()
      
      // Update selected city
      const updatedCity = { ...selectedCity, areas: updatedAreas }
      setSelectedCity(updatedCity)
    } catch (error) {
      toast.error('Failed to save area')
      console.error(error)
    }
  }

  const handleDeleteArea = async (areaId) => {
    if (!window.confirm('Are you sure you want to delete this area?')) return

    try {
      const updatedAreas = selectedCity.areas.filter(a => (a._id || a.name) !== areaId)
      await apiService.cities.update(selectedCity._id, { areas: updatedAreas })
      toast.success('Area deleted successfully')
      
      fetchCities()
      const updatedCity = { ...selectedCity, areas: updatedAreas }
      setSelectedCity(updatedCity)
    } catch (error) {
      toast.error('Failed to delete area')
      console.error(error)
    }
  }

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (city.tagline && city.tagline.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, showEntries)

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Cities & Areas Management</Typography>
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
        <Table sx={{ '& td, & th': { border: '1px solid #000' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>SL</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>City Name</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>State</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Areas</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Priority</TableCell>
              <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No cities found. Click "Add City" to create one.
                </TableCell>
              </TableRow>
            ) : (
              filteredCities.map((city, index) => (
                <TableRow key={city._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight={600}>{city.name}</Typography>
                    {city.tagline && (
                      <Typography variant="caption" color="text.secondary">{city.tagline}</Typography>
                    )}
                  </TableCell>
                  <TableCell>{city.state}</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => {
                        setSelectedCity(city)
                        setShowAreas(true)
                      }}
                    >
                      Manage Areas ({city.areas?.length || 0})
                    </Button>
                  </TableCell>
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

      {/* Add/Edit City Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit City' : 'Add City'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="City Name *"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  clearError('name')
                }}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="State *"
                value={formData.state}
                onChange={(e) => {
                  setFormData({ ...formData, state: e.target.value })
                  clearError('state')
                }}
                error={!!errors.state}
                helperText={errors.state}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Priority (Optional)"
                type="number"
                value={formData.priority}
                onChange={(e) => {
                  setFormData({ ...formData, priority: e.target.value })
                  clearError('priority')
                }}
                error={!!errors.priority}
                helperText={errors.priority}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tagline (Optional)"
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

      {/* Areas Management Dialog */}
      <Dialog open={showAreas} onClose={() => { setShowAreas(false); setSelectedCity(null) }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Manage Areas - {selectedCity?.name}</Typography>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<Add />}
              onClick={() => {
                setAreaFormData({ name: '', cityId: selectedCity?._id })
                setEditingArea(null)
                setAreaDialogOpen(true)
              }}
            >
              Add Area
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table sx={{ '& td, & th': { border: '1px solid #000' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>SL</TableCell>
                  <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Area Name</TableCell>
                  <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!selectedCity?.areas || selectedCity.areas.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No areas found. Click "Add Area" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedCity.areas.map((area, index) => (
                    <TableRow key={area._id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{area.name}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setAreaFormData({ name: area.name, cityId: selectedCity._id })
                            setEditingArea(area)
                            setAreaDialogOpen(true)
                          }}
                          sx={{ color: 'orange' }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteArea(area._id || area.name)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowAreas(false); setSelectedCity(null) }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Area Dialog */}
      <Dialog open={areaDialogOpen} onClose={() => setAreaDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingArea ? 'Edit Area' : 'Add Area'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Area Name *"
            value={areaFormData.name}
            onChange={(e) => setAreaFormData({ ...areaFormData, name: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAreaDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAreaSubmit} variant="contained">
            {editingArea ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CitiesManagement
