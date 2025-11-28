import { useState, useEffect, useMemo } from 'react'
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material'
import { Add, Edit, Delete, Visibility, ArrowBack } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { validateRequired, validateNumeric, validatePhone, validateMinLength, validateURL } from '@/utils/validation'

const ColonyManagement = () => {
  const [colonies, setColonies] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentColony, setCurrentColony] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    purchasePrice: '',
    khatoniHolders: [],
    sideMeasurements: {
      front: '',
      back: '',
      left: '',
      right: ''
    },
    location: {
      address: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: {
        lat: '',
        lng: ''
      }
    },
    latitude: '',
    longitude: '',
    layoutUrl: '',
    basePricePerGaj: '',
    status: 'planning'
  })

  const [newKhatoniHolder, setNewKhatoniHolder] = useState({ name: '', address: '', mobile: '' })
  const [errors, setErrors] = useState({})

  // Clear error for a specific field
  const clearError = (fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  const SQFT_PER_GAJ = 9

  useEffect(() => {
    fetchColonies()
    fetchCities()
  }, [])

  const fetchCities = async () => {
    try {
      const { data } = await axios.get('/cities')
      console.log('Fetched cities:', data?.data)
      setCities(data?.data || [])
    } catch (error) {
      console.error('Failed to fetch cities:', error)
      toast.error('Failed to load cities')
    }
  }

  const normalizeColony = (colony) => {
    const totalLandAreaGaj = colony.totalLandAreaGaj ?? (typeof colony.totalArea === 'number' ? Math.round(colony.totalArea / SQFT_PER_GAJ) : null)
    const totalPlots = colony.totalPlots ?? colony.plotStats?.total ?? 0
    const saleablePlots = colony.saleablePlots ?? colony.availablePlots ?? colony.plotStats?.saleable ?? 0
    const ratePerGaj = colony.basePricePerGaj ?? (typeof colony.pricePerSqFt === 'number' ? Math.round(colony.pricePerSqFt * SQFT_PER_GAJ) : null)
    return {
      ...colony,
      totalLandAreaGaj,
      totalPlots,
      saleablePlots,
      ratePerGaj,
      khatoniHolderDetails: Array.isArray(colony.khatoniHolders) && colony.khatoniHolders.length > 0
        ? colony.khatoniHolders
        : colony.createdBy
          ? [{ name: colony.createdBy.name, mobile: colony.createdBy.email || '', id: colony.createdBy._id }]
          : []
    }
  }

  const fetchColonies = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/colonies')
      const rawColonies = data?.data?.colonies || [];
      console.log('Raw colony data from API:', rawColonies);

      const coloniesWithPlotCounts = await Promise.all(
        rawColonies.map(async (colony) => {
          try {
            const plotData = await axios.get(`/plots`, { params: { colony: colony._id, limit: 1 } });
            const totalPlots = plotData.data?.data?.pagination?.total ?? 0;
            return normalizeColony({ ...colony, totalPlots });
          } catch (plotError) {
            console.error(`Failed to fetch plot count for colony ${colony._id}:`, plotError);
            return normalizeColony(colony); // Return colony without plot count on error
          }
        })
      );

      setColonies(coloniesWithPlotCounts);
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch colonies:', error)
      toast.error('Failed to fetch colonies. Please try again.', {
        position: 'top-right',
        autoClose: 4000,
      })
      setLoading(false)
    }
  }

  const handleOpenDialog = (colony = null) => {
    if (colony) {
      setEditMode(true)
      setCurrentColony(colony)
      setFormData({
        name: colony.name,
        address: colony.address || colony.location?.address || '',
        purchasePrice: colony.purchasePrice || '',
        khatoniHolders: colony.khatoniHolders || (colony.sellerName ? [{
          name: colony.sellerName,
          address: colony.sellerAddress || '',
          mobile: colony.sellerMobile || ''
        }] : []),
        sideMeasurements: colony.sideMeasurements || { front: '', back: '', left: '', right: '' },
        location: colony.location || { address: '', city: '', state: '', pincode: '', coordinates: { lat: '', lng: '' } },
        latitude: colony.coordinates?.latitude ?? colony.location?.coordinates?.lat ?? '',
        longitude: colony.coordinates?.longitude ?? colony.location?.coordinates?.lng ?? '',
        layoutUrl: colony.layoutUrl || '',
        basePricePerGaj: colony.basePricePerGaj,
        status: colony.status
      })
    } else {
      setEditMode(false)
      setCurrentColony(null)
      setFormData({
        name: '',
        address: '',
        purchasePrice: '',
        khatoniHolders: [],
        sideMeasurements: { front: '', back: '', left: '', right: '' },
        location: { address: '', city: '', state: '', pincode: '', coordinates: { lat: '', lng: '' } },
        latitude: '',
        longitude: '',
        layoutUrl: '',
        basePricePerGaj: '',
        status: 'planning'
      })
    }
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setCurrentColony(null)
    setErrors({}) // Clear all errors
    // Reset new khatoni holder form
    setNewKhatoniHolder({ name: '', address: '', mobile: '' })
  }

  // Khatoni Holder management functions
  const addKhatoniHolder = () => {
    if (newKhatoniHolder.name && newKhatoniHolder.address && newKhatoniHolder.mobile) {
      setFormData({ ...formData, khatoniHolders: [...formData.khatoniHolders, { ...newKhatoniHolder, id: Date.now() }] })
      setNewKhatoniHolder({ name: '', address: '', mobile: '' })
    } else {
      toast.error('Please fill all Khatoni Holder fields')
    }
  }

  const removeKhatoniHolder = (id) => {
    setFormData({ ...formData, khatoniHolders: formData.khatoniHolders.filter(s => s.id !== id) })
  }

  const calculateColonyArea = () => {
    const { front, back, left, right } = formData.sideMeasurements
    if (front && back && left && right) {
      const avgLength = (parseFloat(front) + parseFloat(back)) / 2
      const avgWidth = (parseFloat(left) + parseFloat(right)) / 2
      const areaFeet = avgLength * avgWidth
      const areaGaj = areaFeet / 9
      return { areaFeet: areaFeet.toFixed(3), areaGaj: areaGaj.toFixed(3) }
    }
    return null
  }

  // Validate colony form
  const validateForm = () => {
    const newErrors = {}
    let isValid = true

    // Required fields validation
    const nameError = validateRequired(formData.name, 'Colony Name') ||
      validateMinLength(formData.name, 3, 'Colony Name')
    if (nameError) {
      newErrors.name = nameError
      isValid = false
    }

    const addressError = validateRequired(formData.location.address, 'Land Location Address') ||
      validateMinLength(formData.location.address, 10, 'Land Location Address')
    if (addressError) {
      newErrors.locationAddress = addressError
      isValid = false
    }

    // Numeric validations
    if (formData.purchasePrice) {
      const priceError = validateNumeric(formData.purchasePrice, 'Purchase Price')
      if (priceError) {
        newErrors.purchasePrice = priceError
        isValid = false
      }
    }

    if (formData.basePricePerGaj) {
      const basePriceError = validateNumeric(formData.basePricePerGaj, 'Base Price per Gaj')
      if (basePriceError) {
        newErrors.basePricePerGaj = basePriceError
        isValid = false
      }
    }

    // Side measurements validation
    const { front, back, left, right } = formData.sideMeasurements
    if (front) {
      const frontError = validateNumeric(front, 'Front Side')
      if (frontError) {
        newErrors.frontSide = frontError
        isValid = false
      }
    }
    if (back) {
      const backError = validateNumeric(back, 'Back Side')
      if (backError) {
        newErrors.backSide = backError
        isValid = false
      }
    }
    if (left) {
      const leftError = validateNumeric(left, 'Left Side')
      if (leftError) {
        newErrors.leftSide = leftError
        isValid = false
      }
    }
    if (right) {
      const rightError = validateNumeric(right, 'Right Side')
      if (rightError) {
        newErrors.rightSide = rightError
        isValid = false
      }
    }

    // Layout URL validation
    if (formData.layoutUrl) {
      const urlError = validateURL(formData.layoutUrl)
      if (urlError) {
        newErrors.layoutUrl = urlError
        isValid = false
      }
    }

    setErrors(newErrors)

    // Show first error in toast
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
    // Validate form first
    if (!validateForm()) return
    try {
      if (!formData.location.address) {
        toast.error('Land Location Address is required')
        return
      }

      const colonyArea = calculateColonyArea()
      const totalAreaSqFt = colonyArea ? Number(colonyArea.areaGaj) * SQFT_PER_GAJ : undefined
      const pricePerSqFt = formData.basePricePerGaj ? Number(formData.basePricePerGaj) / SQFT_PER_GAJ : undefined

      // Clean khatoni holders data - remove temporary 'id' field
      const cleanedKhatoniHolders = formData.khatoniHolders.map(holder => {
        const { id, ...holderData } = holder;
        return holderData;
      });

      const payload = {
        name: formData.name,
        address: formData.location.address,
        location: formData.location,
        khatoniHolders: cleanedKhatoniHolders,
        totalArea: totalAreaSqFt,
        pricePerSqFt,
        layoutUrl: formData.layoutUrl,
        status: formData.status
      }

      // Only add purchasePrice if it has a value
      if (formData.purchasePrice) {
        payload.purchasePrice = Number(formData.purchasePrice)
      }

      // Only add coordinates if both latitude and longitude are provided
      if (formData.latitude && formData.longitude) {
        payload.coordinates = {
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude)
        }
      }

      if (editMode) {
        await axios.put(`/colonies/${currentColony._id}`, payload)
        toast.success('Colony updated successfully! ✅', {
          position: 'top-right',
          autoClose: 3000,
        })
      } else {
        await axios.post('/colonies', payload)
        toast.success('Colony created successfully! 🎉', {
          position: 'top-right',
          autoClose: 3000,
        })
      }

      handleCloseForm()
      fetchColonies()
    } catch (error) {
      console.error('Error saving colony:', error)
      toast.error(error.response?.data?.message || 'Failed to save colony. Please try again.', {
        position: 'top-right',
        autoClose: 4000,
      })
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this colony?')) {
      try {
        await axios.delete(`/colonies/${id}`)
        toast.success('Colony deleted successfully! 🗑️', {
          position: 'top-right',
          autoClose: 3000,
        })
        fetchColonies()
      } catch (error) {
        toast.error('Failed to delete colony. Please try again.', {
          position: 'top-right',
          autoClose: 4000,
        })
      }
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      planning: 'default',
      ready_to_sell: 'success',
      sold_out: 'error',
      on_hold: 'secondary',
      active: 'success',
      inactive: 'default',
      under_development: 'warning'
    }
    return colors[status] || 'default'
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  // Show form if showForm is true
  if (showForm) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            {editMode ? 'Edit Land' : 'Add New Land'}
          </Typography>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleCloseForm}>
            Back to Land List
          </Button>
        </Box>
        
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Land Name *"
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
                label="Purchase Price (₹)"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => {
                  setFormData({ ...formData, purchasePrice: e.target.value })
                  clearError('purchasePrice')
                }}
                error={!!errors.purchasePrice}
                helperText={errors.purchasePrice}
                placeholder="Total purchase amount"
              />
            </Grid>

            {/* Land Location */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Land Location
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address*"
                value={formData.location.address}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, address: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>City</InputLabel>
                <Select
                  value={formData.location.city}
                  label="City"
                  onChange={(e) => {
                    const selectedCity = cities.find(city => city.name === e.target.value)
                    setFormData({
                      ...formData,
                      location: { 
                        ...formData.location, 
                        city: e.target.value,
                        state: selectedCity?.state || formData.location.state
                      }
                    })
                  }}
                >
                  <MenuItem value="">Select City</MenuItem>
                  {cities.length === 0 ? (
                    <MenuItem disabled>No cities found. Please create cities first.</MenuItem>
                  ) : (
                    cities.map((city) => (
                      <MenuItem key={city._id} value={city.name}>
                        {city.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="State"
                value={formData.location.state}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, state: e.target.value }
                })}
                InputProps={{
                  readOnly: !!formData.location.city
                }}
                helperText={formData.location.city ? "Auto-filled from city" : ""}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Pincode"
                value={formData.location.pincode}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, pincode: e.target.value }
                })}
              />
            </Grid>

            {/* Multiple Khatoni Holders Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Khatoni Holders Information
              </Typography>

              {/* Existing Khatoni Holders */}
              {formData.khatoniHolders.map((holder, index) => (
                <Box key={holder.id || index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Khatoni Holder {index + 1}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeKhatoniHolder(holder.id)}
                    >
                      Remove
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Name:</strong> {holder.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Mobile:</strong> {holder.mobile}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2"><strong>Address:</strong> {holder.address}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}

              {/* Add New Khatoni Holder */}
              <Box sx={{ p: 2, border: '2px dashed #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Add New Khatoni Holder
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Khatoni Holder Name"
                      value={newKhatoniHolder.name}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Mobile"
                      value={newKhatoniHolder.mobile}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, mobile: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Address"
                      value={newKhatoniHolder.address}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, address: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={addKhatoniHolder}
                      sx={{ width: 'auto', px: 3 }}
                    >
                      Add Khatoni Holder
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Asking Price per Gaj (Optional)"
                type="number"
                value={formData.basePricePerGaj}
                onChange={(e) => {
                  setFormData({ ...formData, basePricePerGaj: e.target.value })
                  clearError('basePricePerGaj')
                }}
                error={!!errors.basePricePerGaj}
                helperText={errors.basePricePerGaj}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Status"
                select
                SelectProps={{ native: true }}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="planning">Planning</option>
                <option value="under_construction">Under Construction</option>
                <option value="ready_to_sell">Ready to Sell</option>
                <option value="sold_out">Sold Out</option>
                <option value="on_hold">On Hold</option>
              </TextField>
            </Grid>

            {/* Side Measurements */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Land Side Measurements (in Feet)
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Front (ft)"
                type="number"
                value={formData.sideMeasurements.front}
                onChange={(e) => setFormData({
                  ...formData,
                  sideMeasurements: { ...formData.sideMeasurements, front: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Back (ft)"
                type="number"
                value={formData.sideMeasurements.back}
                onChange={(e) => setFormData({
                  ...formData,
                  sideMeasurements: { ...formData.sideMeasurements, back: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Left (ft)"
                type="number"
                value={formData.sideMeasurements.left}
                onChange={(e) => setFormData({
                  ...formData,
                  sideMeasurements: { ...formData.sideMeasurements, left: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Right (ft)"
                type="number"
                value={formData.sideMeasurements.right}
                onChange={(e) => setFormData({
                  ...formData,
                  sideMeasurements: { ...formData.sideMeasurements, right: e.target.value }
                })}
              />
            </Grid>
            {calculateColonyArea() && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                  <Typography variant="body2">Total Area: <strong>{calculateColonyArea().areaFeet} sq ft = {calculateColonyArea().areaGaj} Gaj</strong></Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
          
          <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
            <Button onClick={handleCloseForm} size="large">Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" size="large">
              {editMode ? 'Update Colony' : 'Create Colony'}
            </Button>
          </Box>
        </Paper>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Land Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Land
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Land</strong></TableCell>
              <TableCell><strong>Total Land (Gaj)</strong></TableCell>
              <TableCell><strong>plots</strong></TableCell>
              <TableCell><strong>asking price Gaj</strong></TableCell>
              <TableCell><strong>Khatoni Holder</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {colonies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No colonies found. Click "Add Colony" to create one.
                </TableCell>
              </TableRow>
            ) : (
              colonies.map((colony) => (
                <TableRow key={colony._id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{colony.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {colony.address || colony.location?.address || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {colony.city?.name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{colony.totalLandAreaGaj ? colony.totalLandAreaGaj.toLocaleString('en-IN') : '-'}</TableCell>
                  <TableCell>{colony.totalPlots ?? '-'}</TableCell>
                  <TableCell>₹{colony.ratePerGaj ? colony.ratePerGaj.toLocaleString('en-IN') : '-'}</TableCell>
                  <TableCell>
                    {colony.khatoniHolderDetails && colony.khatoniHolderDetails.length > 0 ? (
                      <Box>
                        {colony.khatoniHolderDetails.map((holder, idx) => (
                          <Box key={holder.id || idx} mb={0.5}>
                            <Typography variant="body2">
                              {holder.name || '-'}
                            </Typography>
                            {holder.mobile && (
                              <Typography variant="caption" color="text.secondary">
                                {holder.mobile}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={colony.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(colony.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(colony)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(colony)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(colony._id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Form - Full Screen */}
      {showForm && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'white', zIndex: 1300, overflow: 'auto' }}>
          <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Typography variant="h4" fontWeight="bold">
                {editMode ? 'Edit Land' : 'Add New Land'}
              </Typography>
              <Button variant="outlined" onClick={handleCloseForm}>Cancel</Button>
            </Box>
          <Grid container spacing={2} sx={{ mt: 1 }}>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Land Name *"
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
                label="Purchase Price (₹)"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => {
                  setFormData({ ...formData, purchasePrice: e.target.value })
                  clearError('purchasePrice')
                }}
                error={!!errors.purchasePrice}
                helperText={errors.purchasePrice}
                placeholder="Total purchase amount"
              />
            </Grid>

            {/* <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address *"
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value })
                  clearError('address')
                }}
                error={!!errors.address}
                helperText={errors.address}
                required
              />
            </Grid> */}
             {/* land Location */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Land Location
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address*"
                value={formData.location.address}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, address: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="City"
                value={formData.location.city}
                onChange={(e) => {
                  const selectedCity = cities.find(city => city.name === e.target.value)
                  console.log('Selected city:', selectedCity)
                  setFormData({
                    ...formData,
                    location: { 
                      ...formData.location, 
                      city: e.target.value,
                      state: selectedCity?.state || formData.location.state
                    }
                  })
                }}
                SelectProps={{
                  native: false,
                }}
                helperText={`${cities.length} cities available`}
              >
                <MenuItem value="">Select City</MenuItem>
                {cities.length === 0 ? (
                  <MenuItem disabled>No cities found. Please create cities first.</MenuItem>
                ) : (
                  cities.map((city) => (
                    <MenuItem key={city._id} value={city.name}>
                      {city.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="State"
                value={formData.location.state}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, state: e.target.value }
                })}
                InputProps={{
                  readOnly: !!formData.location.city
                }}
                helperText={formData.location.city ? "Auto-filled from city" : ""}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Pincode"
                value={formData.location.pincode}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, pincode: e.target.value }
                })}
              />
            </Grid>
         

            {/* Seller & Purchase Details */}
            {/* <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Seller & Purchase Details
              </Typography>
            </Grid> */}

            {/* <Grid item xs={6}>
              <TextField
                fullWidth
                label="Calculated Total Area (Gaj)"
                value={calculateColonyArea()?.areaGaj || ''}
                InputProps={{ readOnly: true }}
                helperText="Area auto-calculated from the side measurements"
              />
            </Grid> */}
            {/* Multiple Khatoni Holders Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Khatoni Holders Information
              </Typography>

              {/* Existing Khatoni Holders */}
              {formData.khatoniHolders.map((holder, index) => (
                <Box key={holder.id || index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Khatoni Holder {index + 1}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeKhatoniHolder(holder.id)}
                    >
                      Remove
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Name:</strong> {holder.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Mobile:</strong> {holder.mobile}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2"><strong>Address:</strong> {holder.address}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}

              {/* Add New Khatoni Holder */}
              <Box sx={{ p: 2, border: '2px dashed #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Add New Khatoni Holder
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Khatoni Holder Name"
                      value={newKhatoniHolder.name}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Mobile"
                      value={newKhatoniHolder.mobile}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, mobile: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Address"
                      value={newKhatoniHolder.address}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, address: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={addKhatoniHolder}
                      sx={{ width: 'auto', px: 3 }}
                    >
                      Add Khatoni Holder
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
           

            {/* <Grid item xs={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g., 28.6139"
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g., 77.2090"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Layout Image URL (Optional)"
                value={formData.layoutUrl}
                onChange={(e) => {
                  setFormData({ ...formData, layoutUrl: e.target.value })
                  clearError('layoutUrl')
                }}
                error={!!errors.layoutUrl}
                helperText={errors.layoutUrl}
                placeholder="https://example.com/layout-image.jpg"
              />
            </Grid> */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Asking
                 Price per Gaj (Optional)"
                type="number"
                value={formData.basePricePerGaj}
                onChange={(e) => {
                  setFormData({ ...formData, basePricePerGaj: e.target.value })
                  clearError('basePricePerGaj')
                }}
                error={!!errors.basePricePerGaj}
                helperText={errors.basePricePerGaj}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Status"
                select
                SelectProps={{ native: true }}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="planning">Planning</option>
                <option value="under_construction">Under Construction</option>
                <option value="ready_to_sell">Ready to Sell</option>
                <option value="sold_out">Sold Out</option>
                <option value="on_hold">On Hold</option>
              </TextField>
            </Grid>

            {/* Side Measurements */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Land Side Measurements (in Feet)
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Front (ft)"
                type="number"
                value={formData.sideMeasurements.front}
                onChange={(e) => setFormData({
                  ...formData,
                  sideMeasurements: { ...formData.sideMeasurements, front: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Back (ft)"
                type="number"
                value={formData.sideMeasurements.back}
                onChange={(e) => setFormData({
                  ...formData,
                  sideMeasurements: { ...formData.sideMeasurements, back: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Left (ft)"
                type="number"
                value={formData.sideMeasurements.left}
                onChange={(e) => setFormData({
                  ...formData,
                  sideMeasurements: { ...formData.sideMeasurements, left: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Right (ft)"
                type="number"
                value={formData.sideMeasurements.right}
                onChange={(e) => setFormData({
                  ...formData,
                  sideMeasurements: { ...formData.sideMeasurements, right: e.target.value }
                })}
              />
            </Grid>
            {calculateColonyArea() && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                  <Typography variant="body2">Total Area: <strong>{calculateColonyArea().areaFeet} sq ft = {calculateColonyArea().areaGaj} Gaj</strong></Typography>
                </Paper>
              </Grid>
            )}

          </Grid>
          
          <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
            <Button onClick={handleCloseForm} size="large">Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" size="large">
              {editMode ? 'Update Colony' : 'Create Colony'}
            </Button>
          </Box>
        </Box>
      </Box>
      )}
    </Box>
  )
}

export default ColonyManagement
