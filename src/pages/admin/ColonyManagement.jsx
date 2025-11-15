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

const ColonyManagement = () => {
  const [colonies, setColonies] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentColony, setCurrentColony] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plotPrefix: '',
    cityId: '',
    address: '',
    purchasePrice: '',
    sellers: [], // Changed to array for multiple sellers
    totalLandAreaGaj: '',
    expectedRevenue: '',
    sideMeasurements: {
      front: '',
      back: '',
      left: '',
      right: ''
    },
    facilities: [],
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
    roads: [],
    parks: [],
    dynamicAmenities: [],
    basePricePerGaj: '',
    amenities: '',
    status: 'planning'
  })
  
  const [newFacility, setNewFacility] = useState('')
  const [newRoad, setNewRoad] = useState({ name: '', lengthFt: '', widthFt: '' })
  const [newPark, setNewPark] = useState({ name: '', lengthFt: '', widthFt: '' })
  const [newAmenity, setNewAmenity] = useState({ name: '', lengthFt: '', widthFt: '' })
  const [newSeller, setNewSeller] = useState({ name: '', address: '', mobile: '' })

  const SQFT_PER_GAJ = 9

  useEffect(() => {
    fetchColonies()
    fetchCities()
  }, [])

  const fetchCities = async () => {
    try {
      const { data } = await axios.get('/cities')
      setCities(data?.data || [])
    } catch (error) {
      console.error('Failed to fetch cities:', error)
      toast.error('Failed to fetch cities')
    }
  }

  const normalizeColony = (colony) => {
    const totalLandAreaGaj = colony.totalLandAreaGaj ?? (typeof colony.totalArea === 'number' ? Math.round(colony.totalArea / SQFT_PER_GAJ) : null)
    const totalPlots = colony.totalPlots ?? colony.plotStats?.total ?? 0
    const saleablePlots = colony.saleablePlots ?? colony.availablePlots ?? colony.plotStats?.saleable ?? 0
    const ratePerGaj = colony.basePricePerGaj ?? (typeof colony.pricePerSqFt === 'number' ? Math.round(colony.pricePerSqFt * SQFT_PER_GAJ) : null)
    const expectedRevenue = colony.expectedRevenue ?? (ratePerGaj && totalLandAreaGaj ? ratePerGaj * totalLandAreaGaj : null)

    return {
      ...colony,
      totalLandAreaGaj,
      totalPlots,
      saleablePlots,
      ratePerGaj,
      expectedRevenue,
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
      const rawColonies = data?.data?.colonies || []
      setColonies(rawColonies.map(normalizeColony))
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch colonies:', error)
      toast.error('Failed to fetch colonies')
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
        cityId: colony.city?._id || '',
        address: colony.address || colony.location?.address || '',
        purchasePrice: colony.purchasePrice || '',
        sellers: colony.sellers || (colony.sellerName ? [{ 
          name: colony.sellerName, 
          address: colony.sellerAddress || '', 
          mobile: colony.sellerMobile || ''
        }] : []),
        totalLandAreaGaj: colony.totalLandAreaGaj || '',
        expectedRevenue: colony.expectedRevenue || '',
        sideMeasurements: colony.sideMeasurements || { front: '', back: '', left: '', right: '' },
        facilities: colony.facilities || [],
        location: colony.location || { address: '', city: '', state: '', pincode: '', coordinates: { lat: '', lng: '' } },
        latitude: colony.coordinates?.latitude ?? colony.location?.coordinates?.lat ?? '',
        longitude: colony.coordinates?.longitude ?? colony.location?.coordinates?.lng ?? '',
        layoutUrl: colony.layoutUrl || '',
        roads: colony.roads || [],
        parks: colony.parks || [],
        dynamicAmenities: colony.dynamicAmenities || [],
        basePricePerGaj: colony.basePricePerGaj,
        amenities: Array.isArray(colony.amenities) ? colony.amenities.join(', ') : colony.amenities || '',
        status: colony.status
      })
    } else {
      setEditMode(false)
      setCurrentColony(null)
      setFormData({
        name: '',
        description: '',
        plotPrefix: '',
        cityId: '',
        address: '',
        purchasePrice: '',
        sellers: [],
        totalLandAreaGaj: '',
        expectedRevenue: '',
        sideMeasurements: { front: '', back: '', left: '', right: '' },
        facilities: [],
        location: { address: '', city: '', state: '', pincode: '', coordinates: { lat: '', lng: '' } },
        latitude: '',
        longitude: '',
        layoutUrl: '',
        roads: [],
        parks: [],
        dynamicAmenities: [],
        basePricePerGaj: '',
        amenities: '',
        status: 'planning'
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentColony(null)
    // Reset new seller form
    setNewSeller({ name: '', address: '', mobile: '' })
  }
  
  // Helper functions for dynamic arrays
  const addFacility = () => {
    if (newFacility.trim()) {
      setFormData({ ...formData, facilities: [...formData.facilities, newFacility.trim()] })
      setNewFacility('')
    }
  }
  
  const removeFacility = (index) => {
    setFormData({ ...formData, facilities: formData.facilities.filter((_, i) => i !== index) })
  }
  
  const addRoad = () => {
    if (newRoad.name && newRoad.lengthFt && newRoad.widthFt) {
      setFormData({ ...formData, roads: [...formData.roads, { ...newRoad }] })
      setNewRoad({ name: '', lengthFt: '', widthFt: '' })
    }
  }
  
  const removeRoad = (index) => {
    setFormData({ ...formData, roads: formData.roads.filter((_, i) => i !== index) })
  }
  
  const addPark = () => {
    if (newPark.name && newPark.lengthFt && newPark.widthFt) {
      setFormData({ ...formData, parks: [...formData.parks, { ...newPark }] })
      setNewPark({ name: '', lengthFt: '', widthFt: '' })
    }
  }
  
  const removePark = (index) => {
    setFormData({ ...formData, parks: formData.parks.filter((_, i) => i !== index) })
  }
  
  const addDynamicAmenity = () => {
    if (newAmenity.name && newAmenity.lengthFt && newAmenity.widthFt) {
      setFormData({ ...formData, dynamicAmenities: [...formData.dynamicAmenities, { ...newAmenity }] })
      setNewAmenity({ name: '', lengthFt: '', widthFt: '' })
    }
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
  
  const removeDynamicAmenity = (index) => {
    setFormData({ ...formData, dynamicAmenities: formData.dynamicAmenities.filter((_, i) => i !== index) })
  }
  
  const calculateColonyArea = () => {
    const { front, back, left, right } = formData.sideMeasurements
    if (front && back && left && right) {
      const avgLength = (parseFloat(front) + parseFloat(back)) / 2
      const avgWidth = (parseFloat(left) + parseFloat(right)) / 2
      const areaFeet = avgLength * avgWidth
      const areaGaj = areaFeet / 9
      return { areaFeet: areaFeet.toFixed(2), areaGaj: areaGaj.toFixed(2) }
    }
    return null
  }

  const handleSubmit = async () => {
    try {
      if (!formData.cityId) {
        toast.error('Please select a city')
        return
      }

      if (!formData.address) {
        toast.error('Address is required')
        return
      }

      const totalAreaSqFt = formData.totalLandAreaGaj ? Number(formData.totalLandAreaGaj) * SQFT_PER_GAJ : undefined
      const pricePerSqFt = formData.basePricePerGaj ? Number(formData.basePricePerGaj) / SQFT_PER_GAJ : undefined

      const payload = {
        name: formData.name,
        description: formData.description,
        city: formData.cityId,
        address: formData.address,
        plotPrefix: formData.plotPrefix,
        purchasePrice: formData.purchasePrice,
        sellers: formData.sellers,
        totalArea: totalAreaSqFt,
        pricePerSqFt,
        layoutUrl: formData.layoutUrl,
        roads: formData.roads,
        parks: formData.parks,
        dynamicAmenities: formData.dynamicAmenities,
        facilities: formData.facilities,
        status: formData.status,
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean),
        coordinates: {
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
        }
      }

      if (editMode) {
        await axios.put(`/colonies/${currentColony._id}`, payload)
        toast.success('Colony updated successfully')
      } else {
        await axios.post('/colonies', payload)
        toast.success('Colony created successfully')
      }

      handleCloseDialog()
      fetchColonies()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this colony?')) return

    try {
      await axios.delete(`/colonies/${id}`)
      toast.success('Colony deleted successfully')
      fetchColonies()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed')
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
              <TableCell><strong>Saleable</strong></TableCell>
              <TableCell><strong>Rate / Gaj</strong></TableCell>
              <TableCell><strong>Expected Revenue</strong></TableCell>
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
                      {colony.city?.name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{colony.totalLandAreaGaj ? colony.totalLandAreaGaj.toLocaleString('en-IN') : '-'}</TableCell>
                  <TableCell>{colony.totalPlots ?? '-'}</TableCell>
                  <TableCell>₹{colony.ratePerGaj ? colony.ratePerGaj.toLocaleString('en-IN') : '-'}</TableCell>
                  <TableCell>₹{colony.expectedRevenue ? colony.expectedRevenue.toLocaleString('en-IN') : '-'}</TableCell>
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
                select
                label="City"
                value={formData.cityId}
                onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                required
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city._id} value={city._id}>{city.name}</option>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Colony Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                label="Purchase Price (₹)"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="Total purchase amount"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Total Land Area (Gaj)"
                type="number"
                value={formData.totalLandAreaGaj}
                onChange={(e) => setFormData({ ...formData, totalLandAreaGaj: e.target.value })}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expected Revenue (₹)"
                type="number"
                value={formData.expectedRevenue}
                onChange={(e) => setFormData({ ...formData, expectedRevenue: e.target.value })}
                placeholder="Expected total revenue"
              />
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
                label="Layout Image URL"
                value={formData.layoutUrl}
                onChange={(e) => setFormData({ ...formData, layoutUrl: e.target.value })}
                placeholder="https://example.com/layout-image.jpg"
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Base Price per Gaj"
                type="number"
                value={formData.basePricePerGaj}
                onChange={(e) => setFormData({ ...formData, basePricePerGaj: e.target.value })}
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
                label="Plot Prefix (e.g., JSR-)"
                value={formData.plotPrefix}
                onChange={(e) => setFormData({ ...formData, plotPrefix: e.target.value })}
                placeholder="JSR-"
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
            
            {/* Facilities */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Facilities
              </Typography>
            </Grid>
            <Grid item xs={10}>
              <TextField
                fullWidth
                label="Add Facility"
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
                placeholder="e.g., Water Supply, Electricity"
              />
            </Grid>
            <Grid item xs={2}>
              <Button fullWidth variant="contained" onClick={addFacility} sx={{ height: '56px' }}>
                Add
              </Button>
            </Grid>
            {formData.facilities.length > 0 && (
              <Grid item xs={12}>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {formData.facilities.map((facility, index) => (
                    <Chip
                      key={index}
                      label={facility}
                      onDelete={() => removeFacility(index)}
                      color="primary"
                    />
                  ))}
                </Box>
              </Grid>
            )}
            
            {/* Roads */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Roads
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Road Name"
                value={newRoad.name}
                onChange={(e) => setNewRoad({ ...newRoad, name: e.target.value })}
                placeholder="Road Number 1"
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Length (ft)"
                type="number"
                value={newRoad.lengthFt}
                onChange={(e) => setNewRoad({ ...newRoad, lengthFt: e.target.value })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Width (ft)"
                type="number"
                value={newRoad.widthFt}
                onChange={(e) => setNewRoad({ ...newRoad, widthFt: e.target.value })}
              />
            </Grid>
            <Grid item xs={2}>
              <Button fullWidth variant="contained" onClick={addRoad} sx={{ height: '56px' }}>
                Add
              </Button>
            </Grid>
            {formData.roads.length > 0 && (
              <Grid item xs={12}>
                <Box display="flex" flexDirection="column" gap={1}>
                  {formData.roads.map((road, index) => (
                    <Paper key={index} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>
                        <strong>{road.name}</strong>: {road.lengthFt} ft × {road.widthFt} ft = {((road.lengthFt * road.widthFt) / 9).toFixed(2)} Gaj
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => removeRoad(index)}>
                        <Delete />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
              </Grid>
            )}
            
            {/* Parks */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Parks
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Park Name"
                value={newPark.name}
                onChange={(e) => setNewPark({ ...newPark, name: e.target.value })}
                placeholder="Park Number 1"
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Length (ft)"
                type="number"
                value={newPark.lengthFt}
                onChange={(e) => setNewPark({ ...newPark, lengthFt: e.target.value })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Width (ft)"
                type="number"
                value={newPark.widthFt}
                onChange={(e) => setNewPark({ ...newPark, widthFt: e.target.value })}
              />
            </Grid>
            <Grid item xs={2}>
              <Button fullWidth variant="contained" onClick={addPark} sx={{ height: '56px' }}>
                Add
              </Button>
            </Grid>
            {formData.parks.length > 0 && (
              <Grid item xs={12}>
                <Box display="flex" flexDirection="column" gap={1}>
                  {formData.parks.map((park, index) => (
                    <Paper key={index} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>
                        <strong>{park.name}</strong>: {park.lengthFt} ft × {park.widthFt} ft = {((park.lengthFt * park.widthFt) / 9).toFixed(2)} Gaj
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => removePark(index)}>
                        <Delete />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
              </Grid>
            )}
            
            {/* Dynamic Amenities */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Amenities (Temple, School, etc.)
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Amenity Name"
                value={newAmenity.name}
                onChange={(e) => setNewAmenity({ ...newAmenity, name: e.target.value })}
                placeholder="Temple, School, etc."
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Length (ft)"
                type="number"
                value={newAmenity.lengthFt}
                onChange={(e) => setNewAmenity({ ...newAmenity, lengthFt: e.target.value })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Width (ft)"
                type="number"
                value={newAmenity.widthFt}
                onChange={(e) => setNewAmenity({ ...newAmenity, widthFt: e.target.value })}
              />
            </Grid>
            <Grid item xs={2}>
              <Button fullWidth variant="contained" onClick={addDynamicAmenity} sx={{ height: '56px' }}>
                Add
              </Button>
            </Grid>
            {formData.dynamicAmenities.length > 0 && (
              <Grid item xs={12}>
                <Box display="flex" flexDirection="column" gap={1}>
                  {formData.dynamicAmenities.map((amenity, index) => (
                    <Paper key={index} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>
                        <strong>{amenity.name}</strong>: {amenity.lengthFt} ft × {amenity.widthFt} ft = {((amenity.lengthFt * amenity.widthFt) / 9).toFixed(2)} Gaj
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => removeDynamicAmenity(index)}>
                        <Delete />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amenities (comma separated)"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                placeholder="Water Supply, Electricity, Park, Security"
              />
            </Grid>
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
