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
  CircularProgress
} from '@mui/material'
import { Add, Edit, Delete, Visibility } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { validateRequired, validateNumeric, validatePhone, validateMinLength, validateURL } from '@/utils/validation'

const ColonyManagement = () => {
  const [colonies, setColonies] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentColony, setCurrentColony] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plotPrefix: '',
    address: '',
    purchasePrice: '',
    sellers: [], // Changed to array for multiple sellers
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
  
  const [newSeller, setNewSeller] = useState({ name: '', address: '', mobile: '' })
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
  }, [])

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
      sellerDetails: Array.isArray(colony.sellers) && colony.sellers.length > 0
        ? colony.sellers
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
        description: colony.description || '',
        plotPrefix: colony.plotPrefix || '',
        address: colony.address || colony.location?.address || '',
        purchasePrice: colony.purchasePrice || '',
        sellers: colony.sellers || (colony.sellerName ? [{ 
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
        description: '',
        plotPrefix: '',
        address: '',
        purchasePrice: '',
        sellers: [],
        sideMeasurements: { front: '', back: '', left: '', right: '' },
        location: { address: '', city: '', state: '', pincode: '', coordinates: { lat: '', lng: '' } },
        latitude: '',
        longitude: '',
        layoutUrl: '',
        basePricePerGaj: '',
        status: 'planning'
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentColony(null)
    setErrors({}) // Clear all errors
    // Reset new seller form
    setNewSeller({ name: '', address: '', mobile: '' })
  }
  
  // Seller management functions
  const addSeller = () => {
    if (newSeller.name && newSeller.address && newSeller.mobile) {
      setFormData({ ...formData, sellers: [...formData.sellers, { ...newSeller, id: Date.now() }] })
      setNewSeller({ name: '', address: '', mobile: '' })
    } else {
      toast.error('Please fill all seller fields')
    }
  }
  
  const removeSeller = (index) => {
    setFormData({ ...formData, sellers: formData.sellers.filter((_, i) => i !== index) })
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

    const addressError = validateRequired(formData.address, 'Address') ||
                         validateMinLength(formData.address, 10, 'Address')
    if (addressError) {
      newErrors.address = addressError
      isValid = false
    }

    const plotPrefixError = validateRequired(formData.plotPrefix, 'Plot Prefix')
    if (plotPrefixError) {
      newErrors.plotPrefix = plotPrefixError
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
      if (!formData.address) {
        toast.error('Address is required')
        return
      }

      const colonyArea = calculateColonyArea()
      const totalAreaSqFt = colonyArea ? Number(colonyArea.areaGaj) * SQFT_PER_GAJ : undefined
      const pricePerSqFt = formData.basePricePerGaj ? Number(formData.basePricePerGaj) / SQFT_PER_GAJ : undefined

      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        plotPrefix: formData.plotPrefix,
        purchasePrice: formData.purchasePrice,
        sellers: formData.sellers,
        totalArea: totalAreaSqFt,
        pricePerSqFt,
        layoutUrl: formData.layoutUrl,
        status: formData.status,
        coordinates: {
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
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

      handleCloseDialog()
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Colony Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Colony
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Colony</strong></TableCell>
              <TableCell><strong>Total Land (Gaj)</strong></TableCell>
              <TableCell><strong>plots</strong></TableCell>
              <TableCell><strong>Rate / Gaj</strong></TableCell>
              <TableCell><strong>Seller</strong></TableCell>
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
                    {colony.sellerDetails && colony.sellerDetails.length > 0 ? (
                      <Box>
                        {colony.sellerDetails.map((seller, idx) => (
                          <Box key={seller.id || idx} mb={0.5}>
                            <Typography variant="body2">
                              {seller.name || '-'}
                            </Typography>
                            {seller.mobile && (
                              <Typography variant="caption" color="text.secondary">
                                {seller.mobile}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2">-</Typography>
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

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Colony' : 'Add New Colony'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Colony Name *"
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
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
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
            </Grid>
            
            {/* Seller & Purchase Details */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Seller & Purchase Details
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Purchase Price (₹) (Optional)"
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
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Calculated Total Area (Gaj)"
                value={calculateColonyArea()?.areaGaj || ''}
                InputProps={{ readOnly: true }}
                helperText="Area auto-calculated from the side measurements"
              />
            </Grid>
            {/* Multiple Sellers Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Sellers Information
              </Typography>
              
              {/* Existing Sellers */}
              {formData.sellers.map((seller, index) => (
                <Box key={seller.id || index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Seller {index + 1}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeSeller(index)}
                    >
                      Remove
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Name:</strong> {seller.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Mobile:</strong> {seller.mobile}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2"><strong>Address:</strong> {seller.address}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              
              {/* Add New Seller */}
              <Box sx={{ p: 2, border: '2px dashed #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Add New Seller
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Seller Name"
                      value={newSeller.name}
                      onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Mobile"
                      value={newSeller.mobile}
                      onChange={(e) => setNewSeller({ ...newSeller, mobile: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Address"
                      value={newSeller.address}
                      onChange={(e) => setNewSeller({ ...newSeller, address: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={addSeller}
                      sx={{ width: 'auto', px: 3 }}
                    >
                      Add Seller
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            {/* Colony Location */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Colony Location
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location Address"
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
                label="City"
                value={formData.location.city}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, city: e.target.value }
                })}
              />
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
            <Grid item xs={6}>
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
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Base Price per Gaj (Optional)"
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
            
            {/* Plot Prefix */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Plot Prefix (e.g., JSR-) *"
                value={formData.plotPrefix}
                onChange={(e) => {
                  setFormData({ ...formData, plotPrefix: e.target.value })
                  clearError('plotPrefix')
                }}
                error={!!errors.plotPrefix}
                helperText={errors.plotPrefix}
                placeholder="JSR-"
                required
              />
            </Grid>
            
            {/* Side Measurements */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Colony Side Measurements (in Feet)
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ColonyManagement
