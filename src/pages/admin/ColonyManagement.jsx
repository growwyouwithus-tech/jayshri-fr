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
  InputAdornment,
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
  // Delete password dialog
  const [deleteColonyDialog, setDeleteColonyDialog] = useState({ open: false, colonyId: null, password: '', loading: false, showPwd: false })

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

  const handleDelete = (id) => {
    setDeleteColonyDialog({ open: true, colonyId: id, password: '', loading: false, showPwd: false })
  }

  const confirmDeleteColony = async () => {
    if (!deleteColonyDialog.password) {
      toast.error('Please enter your password')
      return
    }
    setDeleteColonyDialog(prev => ({ ...prev, loading: true }))
    try {
      await axios.post('/auth/verify-password', { password: deleteColonyDialog.password })
      await axios.delete(`/colonies/${deleteColonyDialog.colonyId}`)
      toast.success('Colony deleted successfully! 🗑️', { position: 'top-right', autoClose: 3000 })
      setDeleteColonyDialog({ open: false, colonyId: null, password: '', loading: false, showPwd: false })
      fetchColonies()
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete colony'
      toast.error(msg, { position: 'top-right', autoClose: 4000 })
      setDeleteColonyDialog(prev => ({ ...prev, loading: false }))
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          p: 2.5,
          borderRadius: 2,
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ borderLeft: '4px solid #41980a', pl: 2 }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.5px' }}>
            Colony Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Land acquisitions & project monitoring
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(135deg, #41980a 0%, #2e7d32 100%)',
            boxShadow: '0 8px 20px -5px rgba(65, 152, 10, 0.4)',
            borderRadius: 2,
            px: 3,
            py: 1.2,
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #4da810 0%, #388e3c 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 12px 25px -5px rgba(65, 152, 10, 0.5)',
            },
            transition: 'all 0.2s'
          }}
        >
          Add New Colony
        </Button>
      </Box>

      {/* Main Table Container */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: 'calc(100vh - 250px)',
          borderRadius: 2,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden',
          '& .MuiTable-root': { borderCollapse: 'collapse' }
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {[
                { label: 'Colony Details', align: 'left' },
                { label: 'Total Land', align: 'left' },
                { label: 'Road Area', align: 'left' },
                { label: 'Amenity Area', align: 'left' },
                { label: 'Used Land', align: 'left' },
                { label: 'Plots', align: 'left' },
                { label: 'Remaining', align: 'left' },
                { label: 'Actions', align: 'right' }
              ].map((column) => (
                <TableCell 
                  key={column.label}
                  align={column.align}
                  sx={{ 
                    bgcolor: '#41980a',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    py: 2,
                    border: '1px solid #cbd5e1',
                    zIndex: 10
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {colonies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                  <Box sx={{ opacity: 0.5, textAlign: 'center' }}>
                    <Typography variant="h6">No colonies discovered yet</Typography>
                    <Typography variant="body2">Start by adding your first land development project.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              colonies.map((colony) => (
                <TableRow 
                  key={colony._id}
                  hover
                  sx={{ 
                    '&:hover': { bgcolor: '#f1f5f9 !important' },
                    transition: 'background-color 0.2s',
                    '& td': { border: '1px solid #cbd5e1' }
                  }}
                >
                  <TableCell sx={{ minWidth: 250 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 2, 
                          bgcolor: '#f0fdf4', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#16a34a',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          border: '1px solid #dcfce7'
                        }}
                      >
                        {colony.name.charAt(0).toUpperCase()}
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight={700} sx={{ color: '#1e293b', lineHeight: 1.2 }}>
                          {colony.name.toUpperCase()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {colony.location?.city || '-'} • {colony.status.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="#334155">
                      {colony.totalLandAreaGaj ? colony.totalLandAreaGaj.toLocaleString('en-IN') : '-'}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#94a3b8' }}>Gaj</Typography>
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                      <Typography variant="body2" fontWeight={500} color="#1d4ed8">
                        {colony.roadAreaGaj ? colony.roadAreaGaj.toLocaleString('en-IN') : '0'}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981' }} />
                      <Typography variant="body2" fontWeight={500} color="#065f46">
                        {colony.amenityAreaGaj ? colony.amenityAreaGaj.toLocaleString('en-IN') : '0'}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                      <Typography variant="body2" fontWeight={500} color="#92400e">
                        {colony.usedLandGaj ? colony.usedLandGaj.toLocaleString('en-IN') : '0'}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip 
                      label={`${colony.totalPlots ?? '0'} Plots`}
                      size="small"
                      sx={{ 
                        bgcolor: '#f5f3ff', 
                        color: '#7c3aed', 
                        fontWeight: 700, 
                        borderRadius: 1.5,
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ color: colony.remainingLandGaj > 0 ? '#16a34a' : '#ef4444' }}>
                      {colony.remainingLandGaj ? colony.remainingLandGaj.toLocaleString('en-IN') : '0'}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(colony)}
                        sx={{ color: '#64748b', '&:hover': { color: '#41980a', bgcolor: '#f0fdf4' } }}
                        title="View Details"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(colony)}
                        sx={{ color: '#64748b', '&:hover': { color: '#3b82f6', bgcolor: '#eff6ff' } }}
                        title="Edit Colony"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(colony._id)}
                        sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}
                        title="Delete Colony"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
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

      {/* Add/Edit Form - Full Screen Redesign */}
      {showForm && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            bgcolor: '#f8fafc', 
            zIndex: 1300, 
            overflow: 'auto',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <Box sx={{ p: { xs: 2, md: 5 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Form Header */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 4,
                bgcolor: 'white',
                p: 3,
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0'
              }}
            >
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.5px' }}>
                  {editMode ? 'Refine Colony Details' : 'Initialize New Colony'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                  Please ensure all mandatory information is accurately filled for legal compliance.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="text" 
                  onClick={handleCloseForm}
                  sx={{ color: '#64748b', fontWeight: 600 }}
                >
                  Discard Changes
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  sx={{
                    background: 'linear-gradient(135deg, #41980a 0%, #2e7d32 100%)',
                    borderRadius: 2,
                    px: 4,
                    fontWeight: 700,
                    boxShadow: '0 8px 20px -5px rgba(65, 152, 10, 0.4)',
                  }}
                >
                  {editMode ? 'Update Colony' : 'Deploy Colony'}
                </Button>
              </Box>
            </Box>

            <Grid container spacing={4}>
              {/* Section 1: Core Identification */}
              <Grid item xs={12} md={7}>
                <Paper sx={{ p: 4, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 24, bgcolor: '#41980a', borderRadius: 1 }} />
                    Core Project Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Colony Name"
                        placeholder="e.g. Royal Heritage Enclave"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value })
                          clearError('name')
                        }}
                        error={!!errors.name}
                        helperText={errors.name}
                        required
                        variant="outlined"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={6}>
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
                        InputProps={{ borderRadius: 2 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <option value="planning">Initial Planning</option>
                        <option value="under_construction">Under Development</option>
                        <option value="ready_to_sell">Active Inventory</option>
                        <option value="sold_out">Project Completed</option>
                        <option value="on_hold">On Temporary Hold</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Project Address"
                        multiline
                        rows={2}
                        value={formData.location.address}
                        onChange={(e) => setFormData({
                          ...formData,
                          location: { ...formData.location, address: e.target.value }
                        })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                          setFormData({
                            ...formData,
                            location: {
                              ...formData.location,
                              city: e.target.value,
                              state: selectedCity?.state || formData.location.state
                            }
                          })
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <MenuItem value="">Select City</MenuItem>
                        {cities.map((city) => (
                          <MenuItem key={city._id} value={city.name}>{city.name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="State"
                        value={formData.location.state}
                        InputProps={{ readOnly: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f1f5f9' } }}
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
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Section 2: Technical Specs */}
                <Paper sx={{ p: 4, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none', mt: 4 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 24, bgcolor: '#3b82f6', borderRadius: 1 }} />
                    Technical Measurements (Feet)
                  </Typography>
                  <Grid container spacing={3}>
                    {['front', 'back', 'left', 'right'].map((side) => (
                      <Grid item xs={3} key={side}>
                        <TextField
                          fullWidth
                          label={side.charAt(0).toUpperCase() + side.slice(1)}
                          type="number"
                          value={formData.sideMeasurements[side]}
                          onChange={(e) => setFormData({
                            ...formData,
                            sideMeasurements: { ...formData.sideMeasurements, [side]: e.target.value }
                          })}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                    ))}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Estimated Price per Gaj"
                        type="number"
                        value={formData.basePricePerGaj}
                        onChange={(e) => setFormData({ ...formData, basePricePerGaj: e.target.value })}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, color: '#94a3b8' }}>₹</Typography>
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Section 3: Ownership & Khatoni Holders */}
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 4, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%', bgcolor: '#fdfdfd' }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 24, bgcolor: '#f59e0b', borderRadius: 1 }} />
                    Registry Ownership
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
                    Documented Khatoni Holders and legal stakeholders.
                  </Typography>

                  {/* Add New Holder Inline */}
                  <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 3, border: '1px dashed #cbd5e1', mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: '#475569' }}>Assign New Stakeholder</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField 
                          fullWidth size="small" label="Full Name" 
                          value={newKhatoniHolder.name}
                          onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, name: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField 
                          fullWidth size="small" label="Mobile" 
                          value={newKhatoniHolder.mobile}
                          onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, mobile: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField 
                          fullWidth size="small" label="Identity No." 
                          placeholder="Aadhar/PAN"
                          value={newKhatoniHolder.address}
                          onChange={(e) => setNewKhatoniHolder({ ...newKhatoniHolder, address: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button 
                          fullWidth 
                          variant="outlined" 
                          onClick={addKhatoniHolder}
                          sx={{ 
                            borderRadius: 2, 
                            textTransform: 'none', 
                            fontWeight: 700,
                            borderColor: '#cbd5e1',
                            color: '#475569'
                          }}
                        >
                          Add to Ownership List
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Holders List */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {formData.khatoniHolders.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
                        <Typography variant="body2">No shareholders assigned yet.</Typography>
                      </Box>
                    ) : (
                      formData.khatoniHolders.map((holder, index) => (
                        <Box 
                          key={holder.id || index} 
                          sx={{ 
                            p: 2, 
                            bgcolor: 'white', 
                            borderRadius: 3, 
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={700} color="#1e293b">{holder.name}</Typography>
                            <Typography variant="caption" color="#64748b">{holder.mobile} • {holder.address}</Typography>
                          </Box>
                          <IconButton size="small" color="error" onClick={() => removeKhatoniHolder(holder.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      ))
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Bottom Actions for Mobile or scroll end */}
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', pb: 10 }}>
               <Button 
                  variant="outlined" 
                  onClick={handleCloseForm}
                  sx={{ mr: 2, borderRadius: 2, px: 4 }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  sx={{
                    background: 'linear-gradient(135deg, #41980a 0%, #2e7d32 100%)',
                    borderRadius: 2,
                    px: 6,
                    fontWeight: 700,
                  }}
                >
                  Confirm & Save Project
                </Button>
            </Box>
          </Box>
        </Box>
      )}
      {/* Admin Password Confirmation Dialog - Colony Delete Redesign */}
      <Dialog 
        open={deleteColonyDialog.open} 
        onClose={() => setDeleteColonyDialog(prev => ({ ...prev, open: false }))} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 800, px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: '#fee2e2', p: 1, borderRadius: 2, display: 'flex' }}>
            <Delete sx={{ fontSize: 20 }} />
          </Box>
          Confirm Project Deletion
        </DialogTitle>
        <DialogContent sx={{ pt: 2, px: 3 }}>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3, lineHeight: 1.6 }}>
            You are about to permanently delete this colony project. Please enter your administrator password to authenticate this action.
          </Typography>
          <TextField
            fullWidth
            label="Administrator Password"
            placeholder="••••••••"
            type={deleteColonyDialog.showPwd ? 'text' : 'password'}
            value={deleteColonyDialog.password}
            onChange={(e) => setDeleteColonyDialog(prev => ({ ...prev, password: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && confirmDeleteColony()}
            autoFocus
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setDeleteColonyDialog(prev => ({ ...prev, showPwd: !prev.showPwd }))}>
                    {deleteColonyDialog.showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
          <Button
            fullWidth
            variant="text"
            onClick={() => setDeleteColonyDialog({ open: false, colonyId: null, password: '', loading: false, showPwd: false })}
            disabled={deleteColonyDialog.loading}
            sx={{ borderRadius: 2, color: '#64748b', fontWeight: 700, textTransform: 'none' }}
          >
            Go Back
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={confirmDeleteColony}
            disabled={deleteColonyDialog.loading || !deleteColonyDialog.password}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 700, 
              textTransform: 'none',
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
              boxShadow: 'none'
            }}
          >
            {deleteColonyDialog.loading ? 'Authenticating...' : 'Delete Project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ColonyManagement
