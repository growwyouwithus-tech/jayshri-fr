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
  Select,
  Popover,
  List,
  ListItem,
  ListItemText
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

  const [newKhatoniHolder, setNewKhatoniHolder] = useState({
    name: '',
    address: '',
    mobile: '',
    aadharNumber: '',
    panNumber: '',
    dateOfBirth: '',
    sonOf: '',
    daughterOf: '',
    wifeOf: ''
  })
  const [errors, setErrors] = useState({})
  const [khatoniPopoverAnchor, setKhatoniPopoverAnchor] = useState(null)
  const [selectedKhatoniHolders, setSelectedKhatoniHolders] = useState([])

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
    const totalPlots = colony.totalPlots ?? colony.availablePlots ?? colony.plotStats?.total ?? 0
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
      const { data } = await axios.get('/colonies', { params: { limit: 1000 } })
      const rawColonies = data?.data?.colonies || [];
      console.log('Raw colony data from API:', rawColonies);

      // Fetch all plots and properties in parallel
      try {
        const [plotsResponse, propertiesResponse] = await Promise.all([
          axios.get('/plots', { params: { limit: 1000 } }),
          axios.get('/properties', { params: { limit: 1000 } })
        ]);

        const allPlots = plotsResponse.data?.data?.plots || [];
        const allProperties = propertiesResponse.data?.data?.properties || [];

        // Group plots by colony
        const plotCountsByColony = {};
        allPlots.forEach(plot => {
          const colonyId = plot.colony?._id || plot.colony;
          if (colonyId) {
            plotCountsByColony[colonyId] = (plotCountsByColony[colonyId] || 0) + 1;
          }
        });

        // Calculate property stats by colony
        const propertyStatsByColony = {};
        allProperties.forEach(property => {
          const colonyId = property.colony?._id || property.colony;
          if (colonyId) {
            if (!propertyStatsByColony[colonyId]) {
              propertyStatsByColony[colonyId] = {
                roadAreaGaj: 0,
                amenityAreaGaj: 0,
                usedLandGaj: 0
              };
            }

            // Calculate road area from roads array
            if (property.roads && Array.isArray(property.roads)) {
              property.roads.forEach(road => {
                if (road.lengthFt && road.widthFt) {
                  const roadAreaSqFt = road.lengthFt * road.widthFt;
                  propertyStatsByColony[colonyId].roadAreaGaj += roadAreaSqFt / 9;
                }
              });
            }

            // Calculate amenity area from parks array
            if (property.parks && Array.isArray(property.parks)) {
              property.parks.forEach(park => {
                if (park.areaGaj) {
                  propertyStatsByColony[colonyId].amenityAreaGaj += park.areaGaj;
                } else if (park.frontFt && park.backFt && park.leftFt && park.rightFt) {
                  const avgLength = (park.frontFt + park.backFt) / 2;
                  const avgWidth = (park.leftFt + park.rightFt) / 2;
                  const parkAreaSqFt = avgLength * avgWidth;
                  propertyStatsByColony[colonyId].amenityAreaGaj += parkAreaSqFt / 9;
                }
              });
            }
          }
        });

        // Calculate used land for each colony
        Object.keys(propertyStatsByColony).forEach(colonyId => {
          const stats = propertyStatsByColony[colonyId];
          stats.usedLandGaj = stats.roadAreaGaj + stats.amenityAreaGaj;
        });

        // Add plot counts and property stats to colonies
        const coloniesWithStats = rawColonies.map(colony => {
          const totalPlots = plotCountsByColony[colony._id] || 0;
          const propertyStats = propertyStatsByColony[colony._id] || {
            roadAreaGaj: 0,
            amenityAreaGaj: 0,
            usedLandGaj: 0
          };

          const totalLandAreaGaj = colony.totalLandAreaGaj ?? (typeof colony.totalArea === 'number' ? Math.round(colony.totalArea / SQFT_PER_GAJ) : 0);
          const usedLandGaj = Math.round(propertyStats.usedLandGaj * 100) / 100;
          const remainingLandGaj = totalLandAreaGaj > 0 ? Math.round((totalLandAreaGaj - usedLandGaj) * 100) / 100 : 0;

          return normalizeColony({
            ...colony,
            totalPlots,
            roadAreaGaj: Math.round(propertyStats.roadAreaGaj * 100) / 100,
            amenityAreaGaj: Math.round(propertyStats.amenityAreaGaj * 100) / 100,
            usedLandGaj,
            remainingLandGaj
          });
        });

        setColonies(coloniesWithStats);
      } catch (plotError) {
        console.error('Failed to fetch plots/properties:', plotError);
        // If fetching fails, still show colonies without stats
        setColonies(rawColonies.map(colony => normalizeColony(colony)));
      }

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

      // Ensure all khatoni holders have unique IDs
      const khatoniHoldersWithIds = (colony.khatoniHolders || (colony.sellerName ? [{
        name: colony.sellerName,
        address: colony.sellerAddress || '',
        mobile: colony.sellerMobile || ''
      }] : [])).map((holder, index) => ({
        ...holder,
        id: holder.id || holder._id || `existing-${index}-${Date.now()}`
      }));

      setFormData({
        name: colony.name || '',
        address: colony.address || colony.location?.address || '',
        purchasePrice: colony.purchasePrice || '',
        khatoniHolders: khatoniHoldersWithIds,
        sideMeasurements: {
          front: colony.sideMeasurements?.front || '',
          back: colony.sideMeasurements?.back || '',
          left: colony.sideMeasurements?.left || '',
          right: colony.sideMeasurements?.right || ''
        },
        location: {
          address: colony.location?.address || colony.address || '',
          city: colony.location?.city || colony.city?.name || '',
          state: colony.location?.state || colony.city?.state || '',
          pincode: colony.location?.pincode || '',
          coordinates: {
            lat: colony.location?.coordinates?.lat || colony.coordinates?.latitude || '',
            lng: colony.location?.coordinates?.lng || colony.coordinates?.longitude || ''
          }
        },
        latitude: colony.coordinates?.latitude ?? colony.location?.coordinates?.lat ?? '',
        longitude: colony.coordinates?.longitude ?? colony.location?.coordinates?.lng ?? '',
        layoutUrl: colony.layoutUrl || '',
        basePricePerGaj: colony.basePricePerGaj || colony.ratePerGaj || '',
        status: colony.status || 'planning'
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
    setNewKhatoniHolder({
      name: '',
      address: '',
      mobile: '',
      aadharNumber: '',
      panNumber: '',
      dateOfBirth: '',
      sonOf: '',
      daughterOf: '',
      wifeOf: ''
    })
  }

  const [editingHolderIndex, setEditingHolderIndex] = useState(null)

  // Khatoni Holder management functions
  const addKhatoniHolder = () => {
    if (newKhatoniHolder.name && newKhatoniHolder.address && newKhatoniHolder.mobile) {
      if (editingHolderIndex !== null) {
        // Update existing holder
        const updatedHolders = [...formData.khatoniHolders]
        updatedHolders[editingHolderIndex] = { ...newKhatoniHolder, id: updatedHolders[editingHolderIndex].id }
        setFormData({ ...formData, khatoniHolders: updatedHolders })
        setEditingHolderIndex(null)
        toast.success('Khatoni holder updated successfully')
      } else {
        // Add new holder
        setFormData({ ...formData, khatoniHolders: [...formData.khatoniHolders, { ...newKhatoniHolder, id: Date.now() }] })
        toast.success('Khatoni holder added successfully')
      }

      // Reset form
      setNewKhatoniHolder({
        name: '',
        address: '',
        mobile: '',
        aadharNumber: '',
        panNumber: '',
        dateOfBirth: '',
        sonOf: '',
        daughterOf: '',
        wifeOf: '',
        aadharFront: null,
        aadharBack: null,
        panCard: null,
        passportPhoto: null,
        fullPhoto: null
      })
    } else {
      toast.error('Please fill all Khatoni Holder fields')
    }
  }

  const handleEditKhatoniHolder = (holder, index) => {
    setNewKhatoniHolder({ ...holder })
    setEditingHolderIndex(index)
    // Scroll to form (optional but good UX)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }



  const removeKhatoniHolder = (id) => {
    setFormData({
      ...formData,
      khatoniHolders: formData.khatoniHolders.filter(holder => holder.id !== id)
    })
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
        toast.success('Colony updated successfully! ✅', { position: 'top-right', autoClose: 3000 })

        // Handle document uploads for each khatoni holder
        try {
          // We need to use the indices from the payload/formData as they match the array order in backend
          for (let i = 0; i < formData.khatoniHolders.length; i++) {
            const holder = formData.khatoniHolders[i]
            const uploadFormData = new FormData()
            let hasFiles = false

            if (holder.aadharFront instanceof File) {
              uploadFormData.append('aadharFront', holder.aadharFront)
              hasFiles = true
            }
            if (holder.aadharBack instanceof File) {
              uploadFormData.append('aadharBack', holder.aadharBack)
              hasFiles = true
            }
            if (holder.panCard instanceof File) {
              uploadFormData.append('panCard', holder.panCard)
              hasFiles = true
            }
            if (holder.passportPhoto instanceof File) {
              uploadFormData.append('passportPhoto', holder.passportPhoto)
              hasFiles = true
            }
            if (holder.fullPhoto instanceof File) {
              uploadFormData.append('fullPhoto', holder.fullPhoto)
              hasFiles = true
            }

            if (hasFiles) {
              await axios.post(
                `/colonies/${currentColony._id}/khatoni-holders/${i}/documents`,
                uploadFormData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
              )
            }
          }
        } catch (uploadError) {
          console.error('Error uploading documents:', uploadError)
          toast.error('Colony saved but some documents failed to upload')
        }

      } else {
        const response = await axios.post('/colonies', payload)
        const newColonyId = response.data.data.colony._id
        toast.success('Colony created successfully! 🎉', { position: 'top-right', autoClose: 3000 })

        // Handle document uploads for each khatoni holder
        try {
          for (let i = 0; i < formData.khatoniHolders.length; i++) {
            const holder = formData.khatoniHolders[i]
            const uploadFormData = new FormData()
            let hasFiles = false

            if (holder.aadharFront instanceof File) {
              uploadFormData.append('aadharFront', holder.aadharFront)
              hasFiles = true
            }
            if (holder.aadharBack instanceof File) {
              uploadFormData.append('aadharBack', holder.aadharBack)
              hasFiles = true
            }
            if (holder.panCard instanceof File) {
              uploadFormData.append('panCard', holder.panCard)
              hasFiles = true
            }
            if (holder.passportPhoto instanceof File) {
              uploadFormData.append('passportPhoto', holder.passportPhoto)
              hasFiles = true
            }
            if (holder.fullPhoto instanceof File) {
              uploadFormData.append('fullPhoto', holder.fullPhoto)
              hasFiles = true
            }

            if (hasFiles) {
              await axios.post(
                `/colonies/${newColonyId}/khatoni-holders/${i}/documents`,
                uploadFormData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
              )
            }
          }
        } catch (uploadError) {
          console.error('Error uploading documents:', uploadError)
          toast.error('Colony created but some documents failed to upload')
        }
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
            {editMode ? 'Edit Colony' : 'Add New Colony'}
          </Typography>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleCloseForm}>
            Back to colony List
          </Button>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
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
                Colony Location
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
                    <Box>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => handleEditKhatoniHolder(holder, index)}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => removeKhatoniHolder(holder.id)}
                      >
                        Remove
                      </Button>
                    </Box>
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
                    {holder.aadharNumber && (
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Aadhar:</strong> {holder.aadharNumber}</Typography>
                      </Grid>
                    )}
                    {holder.panNumber && (
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>PAN:</strong> {holder.panNumber}</Typography>
                      </Grid>
                    )}
                    {holder.dateOfBirth && (
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>DOB:</strong> {holder.dateOfBirth}</Typography>
                      </Grid>
                    )}
                    {holder.sonOf && (
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Son of:</strong> {holder.sonOf}</Typography>
                      </Grid>
                    )}
                    {holder.daughterOf && (
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Daughter of:</strong> {holder.daughterOf}</Typography>
                      </Grid>
                    )}
                    {holder.wifeOf && (
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Wife of:</strong> {holder.wifeOf}</Typography>
                      </Grid>
                    )}
                  </Grid>

                  {/* Document Previews */}
                  <Box mt={2} p={1} bgcolor="#f5f5f5" borderRadius={1}>
                    <Typography variant="caption" fontWeight="bold" display="block" mb={1}>
                      Documents Preview:
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      {/* Aadhar Front */}
                      {(holder.aadharFront || holder.documents?.aadharFront) && (
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <img
                            src={holder.aadharFront instanceof File ? URL.createObjectURL(holder.aadharFront) : (holder.documents?.aadharFront || holder.aadharFront)}
                            alt="Aadhar Front"
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                          />
                          <Typography variant="caption" style={{ fontSize: '0.7rem', marginTop: 4 }}>Aadhar Frnt</Typography>
                        </Box>
                      )}
                      {/* Aadhar Back */}
                      {(holder.aadharBack || holder.documents?.aadharBack) && (
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <img
                            src={holder.aadharBack instanceof File ? URL.createObjectURL(holder.aadharBack) : (holder.documents?.aadharBack || holder.aadharBack)}
                            alt="Aadhar Back"
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                          />
                          <Typography variant="caption" style={{ fontSize: '0.7rem', marginTop: 4 }}>Aadhar Bck</Typography>
                        </Box>
                      )}
                      {/* PAN Card */}
                      {(holder.panCard || holder.documents?.panCard) && (
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <img
                            src={holder.panCard instanceof File ? URL.createObjectURL(holder.panCard) : (holder.documents?.panCard || holder.panCard)}
                            alt="PAN Card"
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                          />
                          <Typography variant="caption" style={{ fontSize: '0.7rem', marginTop: 4 }}>PAN Card</Typography>
                        </Box>
                      )}
                      {/* Passport Photo */}
                      {(holder.passportPhoto || holder.documents?.passportPhoto) && (
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <img
                            src={holder.passportPhoto instanceof File ? URL.createObjectURL(holder.passportPhoto) : (holder.documents?.passportPhoto || holder.passportPhoto)}
                            alt="Passport Photo"
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                          />
                          <Typography variant="caption" style={{ fontSize: '0.7rem', marginTop: 4 }}>Passport</Typography>
                        </Box>
                      )}
                      {/* Full Photo */}
                      {(holder.fullPhoto || holder.documents?.fullPhoto) && (
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <img
                            src={holder.fullPhoto instanceof File ? URL.createObjectURL(holder.fullPhoto) : (holder.documents?.fullPhoto || holder.fullPhoto)}
                            alt="Full Photo"
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                          />
                          <Typography variant="caption" style={{ fontSize: '0.7rem', marginTop: 4 }}>Full Photo</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}

              {/* Add New Khatoni Holder */}
              <Box sx={{ p: 2, border: '2px dashed #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {editingHolderIndex !== null ? 'Update Khatoni Holder' : 'Add New Khatoni Holder'}
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
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Aadhar Number"
                      value={newKhatoniHolder.aadharNumber}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, aadharNumber: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="PAN Number"
                      value={newKhatoniHolder.panNumber}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, panNumber: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Date of Birth"
                      type="date"
                      value={newKhatoniHolder.dateOfBirth || ''}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, dateOfBirth: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Son of"
                      value={newKhatoniHolder.sonOf || ''}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, sonOf: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Daughter of"
                      value={newKhatoniHolder.daughterOf || ''}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, daughterOf: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Wife of"
                      value={newKhatoniHolder.wifeOf || ''}
                      onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, wifeOf: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                      Upload Documents
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Button variant="outlined" component="label" fullWidth size="small">
                      Aadhar Front
                      <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          e.target.value = ''
                        } else {
                          setNewKhatoniHolder({ ...newKhatoniHolder, aadharFront: file })
                        }
                      }} />
                    </Button>
                    {newKhatoniHolder.aadharFront && <Typography variant="caption" display="block" color="success.main">✓ {newKhatoniHolder.aadharFront.name}</Typography>}
                    {newKhatoniHolder.aadharFront && (
                      <Box mt={1}>
                        <img
                          src={URL.createObjectURL(newKhatoniHolder.aadharFront)}
                          alt="Preview"
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                      </Box>
                    )}
                    <Typography variant="caption" display="block" color="text.secondary">Supported formats: JPG, PNG, PDF. Max size:1MB.</Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Button variant="outlined" component="label" fullWidth size="small">
                      Aadhar Back
                      <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          e.target.value = ''
                        } else {
                          setNewKhatoniHolder({ ...newKhatoniHolder, aadharBack: file })
                        }
                      }} />
                    </Button>
                    {newKhatoniHolder.aadharBack && <Typography variant="caption" display="block" color="success.main">✓ {newKhatoniHolder.aadharBack.name}</Typography>}
                    {newKhatoniHolder.aadharBack && (
                      <Box mt={1}>
                        <img
                          src={URL.createObjectURL(newKhatoniHolder.aadharBack)}
                          alt="Preview"
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                      </Box>
                    )}
                    <Typography variant="caption" display="block" color="text.secondary">Supported formats: JPG, PNG, PDF. Max size:1MB.</Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Button variant="outlined" component="label" fullWidth size="small">
                      PAN Card
                      <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          e.target.value = ''
                        } else {
                          setNewKhatoniHolder({ ...newKhatoniHolder, panCard: file })
                        }
                      }} />
                    </Button>
                    {newKhatoniHolder.panCard && <Typography variant="caption" display="block" color="success.main">✓ {newKhatoniHolder.panCard.name}</Typography>}
                    {newKhatoniHolder.panCard && (
                      <Box mt={1}>
                        <img
                          src={URL.createObjectURL(newKhatoniHolder.panCard)}
                          alt="Preview"
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                      </Box>
                    )}
                    <Typography variant="caption" display="block" color="text.secondary">Supported formats: JPG, PNG, PDF. Max size:1MB.</Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Button variant="outlined" component="label" fullWidth size="small">
                      Passport Photo
                      <input type="file" hidden accept="image/*" onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          e.target.value = ''
                        } else {
                          setNewKhatoniHolder({ ...newKhatoniHolder, passportPhoto: file })
                        }
                      }} />
                    </Button>
                    {newKhatoniHolder.passportPhoto && <Typography variant="caption" display="block" color="success.main">✓ {newKhatoniHolder.passportPhoto.name}</Typography>}
                    {newKhatoniHolder.passportPhoto && (
                      <Box mt={1}>
                        <img
                          src={URL.createObjectURL(newKhatoniHolder.passportPhoto)}
                          alt="Preview"
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                      </Box>
                    )}
                    <Typography variant="caption" display="block" color="text.secondary">Supported formats: JPG, PNG, PDF. Max size:1MB.</Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Button variant="outlined" component="label" fullWidth size="small">
                      Full Photo
                      <input type="file" hidden accept="image/*" onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          e.target.value = ''
                        } else {
                          setNewKhatoniHolder({ ...newKhatoniHolder, fullPhoto: file })
                        }
                      }} />
                    </Button>
                    {newKhatoniHolder.fullPhoto && <Typography variant="caption" display="block" color="success.main">✓ {newKhatoniHolder.fullPhoto.name}</Typography>}
                    {newKhatoniHolder.fullPhoto && (
                      <Box mt={1}>
                        <img
                          src={URL.createObjectURL(newKhatoniHolder.fullPhoto)}
                          alt="Preview"
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                      </Box>
                    )}
                    <Typography variant="caption" display="block" color="text.secondary">Supported formats: JPG, PNG, PDF. Max size:1MB.</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={addKhatoniHolder}
                      sx={{ width: 'auto', px: 3 }}
                    >
                      {editingHolderIndex !== null ? 'Update Khatoni Holder' : 'Add Khatoni Holder'}
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
                Colony Side Measurements (in Feet)
              </Typography>
            </Grid>
            {calculateColonyArea() && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                  <Typography variant="body2">Total Area: <strong>{calculateColonyArea().areaFeet} sq ft = {calculateColonyArea().areaGaj} Gaj</strong></Typography>
                </Paper>
              </Grid>
            )}
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

          </Grid>

          <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
            <Button onClick={handleCloseForm} size="large">Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" size="large">
              {editMode ? 'Update Colony' : 'Create Colony'}
            </Button>
          </Box>
        </Paper>
      </Box >
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

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 200px)' }}>
        <Table stickyHeader sx={{ '& td, & th': { border: '1px solid #000' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Colony</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Total Land (Gaj)</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Road Area(Gaj)</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Park/Tample(Gaj)</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Used Land (Gaj)</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Total Plots</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Plot Area(Gaj)</TableCell>
              <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Action</TableCell>
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
                    <Typography variant="body2" fontWeight={600} fontSize={18}>{colony.name.toUpperCase()}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {colony.address || colony.location?.address || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {colony.city?.name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{colony.totalLandAreaGaj ? colony.totalLandAreaGaj.toLocaleString('en-IN') : '-'}</TableCell>
                  <TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 600, color: '#1976d2' }}>
                    {colony.roadAreaGaj ? colony.roadAreaGaj.toLocaleString('en-IN') : '0'}
                  </TableCell>
                  <TableCell sx={{ bgcolor: '#e8f5e9', fontWeight: 600, color: '#2e7d32' }}>
                    {colony.amenityAreaGaj ? colony.amenityAreaGaj.toLocaleString('en-IN') : '0'}
                  </TableCell>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600, color: '#f57c00' }}>
                    {colony.usedLandGaj ? colony.usedLandGaj.toLocaleString('en-IN') : '0'}
                  </TableCell>
                  <TableCell sx={{ bgcolor: '#f3e5f5', fontWeight: 600, color: '#7b1fa2' }}>
                    {colony.totalPlots ?? '0'}
                  </TableCell>
                  {/* <TableCell>₹{colony.ratePerGaj ? colony.ratePerGaj.toLocaleString('en-IN') : '-'}</TableCell> */}
                  <TableCell>{colony.remainingLandGaj ? colony.remainingLandGaj.toLocaleString('en-IN') : '0'}</TableCell>
                  {/* <TableCell>
                    {colony.khatoniHolderDetails && colony.khatoniHolderDetails.length > 0 ? (
                      <Box> */}
                  {/* Show first Khatoni Holder */}
                  {/* <Box mb={0.5}>
                          <Typography variant="body2">
                            {colony.khatoniHolderDetails[0].name || '-'}
                          </Typography>
                          {colony.khatoniHolderDetails[0].mobile && (
                            <Typography variant="caption" color="text.secondary">
                              {colony.khatoniHolderDetails[0].mobile}
                            </Typography>
                          )}
                        </Box> */}
                  {/* Show "See More" if there are multiple holders */}
                  {/* {colony.khatoniHolderDetails.length > 1 && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={(e) => {
                              setKhatoniPopoverAnchor(e.currentTarget)
                              setSelectedKhatoniHolders(colony.khatoniHolderDetails)
                            }}
                            sx={{ textTransform: 'none', p: 0, minWidth: 'auto', fontSize: '0.75rem' }}
                          >
                            See More ({colony.khatoniHolderDetails.length - 1} more)
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell> */}
                  {/* <TableCell>
                    <Chip
                      label={colony.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(colony.status)}
                      size="small"
                    />
                  </TableCell> */}
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

      {/* Khatoni Holders Popover */}
      <Popover
        open={Boolean(khatoniPopoverAnchor)}
        anchorEl={khatoniPopoverAnchor}
        onClose={() => setKhatoniPopoverAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 400 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            All Khatoni Holders
          </Typography>
          <List dense>
            {selectedKhatoniHolders.map((holder, idx) => (
              <ListItem key={holder.id || idx} sx={{ px: 0 }}>
                <ListItemText
                  primary={holder.name || '-'}
                  secondary={
                    <>
                      {holder.mobile && <Typography variant="caption" display="block">{holder.mobile}</Typography>}
                      {holder.address && <Typography variant="caption" display="block" color="text.secondary">{holder.address}</Typography>}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>

      {/* Add/Edit Form - Full Screen */}
      {showForm && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'white', zIndex: 1300, overflow: 'auto' }}>
          <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Typography variant="h4" fontWeight="bold">
                {editMode ? 'Edit Colony' : 'Add New Colony'}
              </Typography>
              <Button variant="outlined" onClick={handleCloseForm}>Cancel</Button>
            </Box>
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
                  Colony Location
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
