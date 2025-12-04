import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  TextField,
  Grid,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Autocomplete
} from '@mui/material'
import {
  NavigateNext,
  NavigateBefore,
  CloudUpload,
  CheckCircle,
  Home,
  Business,
  Agriculture,
  Add,
  Edit,
  Delete,
  Close,
  Visibility,
  ArrowBack
} from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const PropertyManagement = () => {
  const navigate = useNavigate()
  
  // Main list view state
  const [properties, setProperties] = useState([])
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentProperty, setCurrentProperty] = useState(null)
  const [selectedPropertyPlots, setSelectedPropertyPlots] = useState(null)
  const [plotsDialogOpen, setPlotsDialogOpen] = useState(false)
  const [propertyStats, setPropertyStats] = useState({})
  
  // Form stepper state
  const [activeStep, setActiveStep] = useState(0)
  const [colonies, setColonies] = useState([])
  const [cities, setCities] = useState([])
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    categories: [],
    colonyId: '',
    name: '',
    facilities: [],
    tagline: '',
    description: '',
    address: '',
    cityId: '',
    areaId: '',
    mainPicture: null,
    videoUpload: null,
    mapImage: null,
    noc: null,
    registry: null,
    legalDoc: null,
    moreImages: [],
    agreeTerms: false,
    roads: [],
    parks: [],
    coordinates: {
      latitude: '',
      longitude: ''
    }
  })
  
  const predefinedFacilities = [
    'Nearby Schools and Colleges',
    'Nearby metro station',
    'Nearby universities',
    'Nearby Long and wide roads',
    "Colony's 35' wide Road",
    'Nearby hospitals',
    'Nice environment',
    "The colony's own plantation",
    'The colony is electrified',
    'The colony has its own CCTV cameras installed.',
    'The colony has its own watchman and guards posted.',
    'The colony has its own RCC roads.',
    'The Taj Mahal is near the colony.',
    'There is a temple near the colony.',
    'There is a beautiful temple inside the colony',
    'Big market is available inside the colony'
  ]

  const [selectedFacility, setSelectedFacility] = useState('')

  const steps = [
    'Select Type',
    'Property Details', 
    'Description & Pricing',
    'Photos',
    'Preview',
    'Successfully Submitted'
  ]

  const categories = [
    { value: 'Residential', icon: <Home />, label: 'Residential' },
    { value: 'Commercial', icon: <Business />, label: 'Commercial' },
    { value: 'Farmhouse', icon: <Agriculture />, label: 'Farmhouse' }
  ]

  const facilitiesList = [
    'Parking', 'Security', 'Lift', 'Swimming Pool',
    'Playground', 'Gymnasium', 'Sauna', 'Barbeque Area',
    'Minimart', 'Multipurpose Hall', 'Club House',
    'Tennis Court', 'Squash Court'
  ]

  const amenitiesList = [
    'Air-Cond', 'Cooking Allowed', 'Near KTM/LRT',
    'Washing Machine', 'Internet'
  ]

  const [newRoad, setNewRoad] = useState({ name: '', lengthFt: '', widthFt: '' })
  const [newPark, setNewPark] = useState({ name: '', frontFt: '', backFt: '', leftFt: '', rightFt: '' })

  useEffect(() => {
    fetchProperties()
    fetchColonies()
    fetchCities()
    fetchAreas()
    fetchPropertyStats()
  }, [])

  const fetchPropertyStats = async () => {
    try {
      const { data } = await axios.get('/plots?limit=1000')
      const plots = data?.data?.plots || []
      
      // Group plots by property
      const statsByProperty = {}
      plots.forEach(plot => {
        const propId = plot.propertyId?._id || plot.propertyId
        if (!propId) return
        
        if (!statsByProperty[propId]) {
          statsByProperty[propId] = {
            totalSold: 0,
            totalRevenue: 0,
            plots: []
          }
        }
        
        statsByProperty[propId].plots.push(plot)
        if (plot.status === 'sold' || plot.status === 'booked') {
          statsByProperty[propId].totalSold += plot.area || 0
          statsByProperty[propId].totalRevenue += plot.paidAmount || 0
        }
      })
      
      setPropertyStats(statsByProperty)
    } catch (error) {
      console.error('Failed to fetch property stats:', error)
    }
  }

  const normalizeProperty = (property) => {
    const colony = property.colony || property.colonyId
    const city = property.city || property.cityId
    return {
      ...property,
      colonyId: colony,
      cityId: city,
      facilities: Array.isArray(property.facilities) ? property.facilities : [],
      amenities: Array.isArray(property.amenities) ? property.amenities : []
    }
  }

  const fetchProperties = async () => {
    try {
      setPropertiesLoading(true)
      const { data } = await axios.get('/properties')
      const list = Array.isArray(data?.data?.properties)
        ? data.data.properties
        : Array.isArray(data?.data)
          ? data.data
          : []
      setProperties(list.map(normalizeProperty))
      await fetchPropertyStats()
    } catch (error) {
      console.error('Failed to fetch properties:', error)
      toast.error('Failed to fetch properties')
    } finally {
      setPropertiesLoading(false)
    }
  }

  const fetchColonies = async () => {
    try {
      const { data } = await axios.get('/colonies')
      setColonies(data?.data?.colonies || data?.data || [])
    } catch (error) {
      console.error('Failed to fetch colonies')
    }
  }

  const fetchCities = async () => {
    try {
      const { data } = await axios.get('/cities')
      setCities(Array.isArray(data?.data) ? data.data : data?.data?.cities || data?.data?.data || [])
    } catch (error) {
      console.error('Failed to fetch cities')
    }
  }

  const fetchAreas = async (cityId = null) => {
    try {
      if (!cityId && !formData.cityId) {
        setAreas([])
        return
      }
      
      const targetCityId = cityId || formData.cityId
      const selectedCity = cities.find(city => city._id === targetCityId)
      
      if (selectedCity && selectedCity.areas) {
        setAreas(selectedCity.areas.map(area => ({
          _id: area._id || area.name,
          name: area.name,
          cityId: { _id: selectedCity._id, name: selectedCity.name }
        })))
      } else {
        setAreas([])
      }
    } catch (error) {
      console.error('Failed to fetch areas')
      setAreas([])
    }
  }

  const handleColonySelect = (colonyId) => {
    const selectedColony = colonies.find((colony) => colony._id === colonyId)
    setFormData((prev) => ({
      ...prev,
      colonyId,
      name: selectedColony?.name || '',
      address: selectedColony?.address || selectedColony?.location?.address || prev.address
    }))
  }

  const openAddDialog = () => {
    setEditMode(false)
    setCurrentProperty(null)
    setActiveStep(0)
    setFormData({
      categories: [],
      colonyId: '',
      name: '',
      facilities: [],
      tagline: '',
      description: '',
      address: '',
      cityId: '',
      areaId: '',
      mainPicture: null,
      videoUpload: null,
      mapImage: null,
      noc: null,
      registry: null,
      legalDoc: null,
      moreImages: [],
      agreeTerms: false,
      roads: [],
      parks: [],
      coordinates: {
        latitude: '',
        longitude: ''
      }
    })
    setSelectedFacility('')
    setAddDialogOpen(true)
  }

  const openEditDialog = (property) => {
    setEditMode(true)
    setCurrentProperty(property)
    setActiveStep(0)
    setFormData({
      categories: property.categories || [],
      colonyId: property.colonyId?._id || property.colony?._id || '',
      name: property.name || '',
      facilities: property.facilities || [],
      tagline: property.tagline || '',
      description: property.description || '',
      address: property.address || '',
      cityId: property.cityId?._id || property.city?._id || '',
      areaId: property.areaId?._id || property.area?._id || '',
      mainPicture: null,
      videoUpload: null,
      mapImage: null,
      noc: null,
      registry: null,
      legalDoc: null,
      moreImages: [],
      agreeTerms: true,
      roads: property.roads || [],
      parks: property.parks || [],
      coordinates: {
        latitude: property.coordinates?.latitude || '',
        longitude: property.coordinates?.longitude || ''
      }
    })
    setSelectedFacility('')
    setAddDialogOpen(true)
  }

  const closeAddDialog = () => {
    setAddDialogOpen(false)
  }

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        if (formData.categories.length === 0 || !formData.colonyId) {
          toast.error('Please select at least one category and colony')
          return false
        }
        break
      case 2:
        if (!formData.tagline || !formData.description) {
          toast.error('Please fill tagline and description')
          return false
        }
        break
      case 3:
        if (!formData.agreeTerms) {
          toast.error('Please agree to terms and conditions')
          return false
        }
        break
      default:
        break
    }
    return true
  }

  const handleSubmit = async () => {
    console.log('🚀 Property Submit Started')
    console.log('📝 Form Data:', formData)
    console.log('📁 Files check:', {
      mainPicture: formData.mainPicture instanceof File,
      videoUpload: formData.videoUpload instanceof File,
      mapImage: formData.mapImage instanceof File,
      moreImages: Array.isArray(formData.moreImages) && formData.moreImages.length
    })
    
    setLoading(true)
    try {
      const payload = new FormData()
      console.log('📦 Preparing payload...')
      
      Object.keys(formData).forEach(key => {
        if (['facilities', 'roads', 'parks', 'categories'].includes(key)) {
          payload.append(key, JSON.stringify(formData[key]))
        } else if (key === 'moreImages') {
          if (Array.isArray(formData[key])) {
            formData[key].forEach(file => {
              if (file instanceof File) {
                payload.append('moreImages', file)
              }
            })
          }
        } else if (key === 'coordinates') {
          // Handle coordinates separately
          payload.append('latitude', formData.coordinates.latitude || '')
          payload.append('longitude', formData.coordinates.longitude || '')
        } else if (formData[key] instanceof File) {
          payload.append(key, formData[key])
        } else if (formData[key] !== null && formData[key] !== undefined) {
          payload.append(key, formData[key])
        }
      })

      if (editMode && currentProperty) {
        console.log('✏️ Updating property:', currentProperty._id)
        // Don't set Content-Type header - let axios interceptor handle it for FormData
        const response = await axios.put(`/properties/${currentProperty._id}`, payload)
        console.log('✅ Update Response:', response.data)
        toast.success('Property updated successfully!')
      } else {
        console.log('➕ Creating new property')
        // Don't set Content-Type header - let axios interceptor handle it for FormData
        const response = await axios.post('/properties', payload)
        console.log('✅ Create Response:', response.data)
        toast.success('Property created successfully!')
      }
      
      // Refresh property list
      console.log('🔄 Refreshing property list...')
      await fetchProperties()
      console.log('✅ Property list refreshed')
      
      setActiveStep(5)
      
      // Auto-close dialog after 2 seconds to show updated list
      setTimeout(() => {
        resetFormAndCloseDialog()
      }, 2000)
    } catch (error) {
      console.error('❌ Property Submit Error:', error)
      console.error('❌ Error Response:', error.response?.data)
      console.error('❌ Error Status:', error.response?.status)
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.errors?.[0]?.message
        || error.message
        || `Failed to ${editMode ? 'update' : 'create'} property`
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryToggle = (category) => {
    const newCategories = formData.categories.includes(category)
      ? formData.categories.filter(c => c !== category)
      : [...formData.categories, category]
    setFormData({ ...formData, categories: newCategories })
  }

  const addFacility = () => {
    console.log('addFacility called:', selectedFacility)
    console.log('Current facilities:', formData.facilities)
    if (selectedFacility && selectedFacility.trim() && !formData.facilities.includes(selectedFacility.trim())) {
      setFormData({ ...formData, facilities: [...formData.facilities, selectedFacility.trim()] })
      setSelectedFacility('')
      console.log('Facility added successfully')
    } else if (formData.facilities.includes(selectedFacility.trim())) {
      toast.error('This facility is already added')
    } else {
      toast.error('Please select a facility')
    }
  }

  const removeFacility = (index) => {
    setFormData({ ...formData, facilities: formData.facilities.filter((_, i) => i !== index) })
  }

  const handleFileUpload = (field, file) => {
    console.log(`📎 File uploaded for ${field}:`, file)
    setFormData({ ...formData, [field]: file })
  }

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await axios.delete(`/properties/${id}`)
        toast.success('Property deleted successfully')
        fetchProperties()
      } catch (error) {
        toast.error('Failed to delete property')
      }
    }
  }

  const handleViewPlots = (property) => {
    const stats = propertyStats[property._id]
    setSelectedPropertyPlots({
      property,
      plots: stats?.plots || [],
      stats
    })
    setPlotsDialogOpen(true)
  }

  const handleAddPlotForProperty = (property) => {
    // Navigate to plot management with pre-selected property
    navigate('/admin/plots', { 
      state: { 
        preSelectedProperty: property._id,
        preSelectedColony: property.colonyId?._id || property.colonyId,
        openAddDialog: true 
      } 
    })
  }

  const handleAddFeatureForProperty = (property) => {
    // Open edit dialog for the property to add features
    openEditDialog(property)
    setPlotsDialogOpen(false)
  }

  const calculateRemainingLand = (property) => {
    const totalLand = property.totalLandAreaGaj || 0
    const usedLand = calculateUsedLand(property)
    const stats = propertyStats[property._id] || { totalSold: 0 }
    const soldLandGaj = stats.totalSold / 9
    return totalLand - usedLand - soldLandGaj
  }

  const calculateUsedLand = (property) => {
    let usedLand = 0
    
    // Calculate land used by roads
    if (property.roads && Array.isArray(property.roads)) {
      property.roads.forEach(road => {
        const lengthFt = parseFloat(road.lengthFt) || 0
        const widthFt = parseFloat(road.widthFt) || 0
        usedLand += (lengthFt * widthFt) / 9 // Convert sq ft to Gaj
      })
    }
    
    // Calculate land used by parks/amenities
    if (property.parks && Array.isArray(property.parks)) {
      property.parks.forEach(park => {
        usedLand += parseFloat(park.areaGaj) || 0
      })
    }
    
    return usedLand
  }

  const resetFormAndCloseDialog = () => {
    setActiveStep(0)
    setFormData({
      categories: [],
      colonyId: '',
      name: '',
      facilities: [],
      tagline: '',
      description: '',
      address: '',
      cityId: '',
      areaId: '',
      mainPicture: null,
      videoUpload: null,
      mapImage: null,
      noc: null,
      registry: null,
      legalDoc: null,
      moreImages: [],
      agreeTerms: false,
      roads: [],
      parks: [],
      coordinates: {
        latitude: '',
        longitude: ''
      }
    })
    setSelectedFacility('')
    closeAddDialog()
    fetchProperties()
  }

  const addRoad = () => {
    if (newRoad.name && newRoad.lengthFt && newRoad.widthFt) {
      setFormData({ ...formData, roads: [...formData.roads, { ...newRoad }] })
      setNewRoad({ name: '', lengthFt: '', widthFt: '' })
    } else {
      toast.error('Please fill all road fields')
    }
  }

  const removeRoad = (index) => {
    setFormData({ ...formData, roads: formData.roads.filter((_, i) => i !== index) })
  }

  const addPark = () => {
    if (newPark.name && newPark.frontFt && newPark.backFt && newPark.leftFt && newPark.rightFt) {
      const avgLength = (Number(newPark.frontFt) + Number(newPark.backFt)) / 2
      const avgWidth = (Number(newPark.leftFt) + Number(newPark.rightFt)) / 2
      const areaGaj = (avgLength * avgWidth) / 9
      setFormData({ ...formData, parks: [...formData.parks, { ...newPark, areaGaj: areaGaj.toFixed(3) }] })
      setNewPark({ name: '', frontFt: '', backFt: '', leftFt: '', rightFt: '' })
    } else {
      toast.error('Please fill all park dimension fields')
    }
  }

  const removePark = (index) => {
    setFormData({ ...formData, parks: formData.parks.filter((_, i) => i !== index) })
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" fontWeight="bold" mb={2}>
              What Would you like to Post?
            </Typography>
    
             <Typography variant="body1" fontWeight="bold" mb={2}>
              Select Colony (Land)
            </Typography>
            <TextField
              fullWidth
              select
              value={formData.colonyId}
              onChange={(e) => handleColonySelect(e.target.value)}
              placeholder="-- Select Colony --"
            >
              <MenuItem value="">-- Select Colony --</MenuItem>
              {colonies.map((colony) => (
                <MenuItem key={colony._id} value={colony._id}>
                  {colony.name}
                </MenuItem>
              ))}
            </TextField>

             <Typography variant="body2" color="text.secondary" mb={3} mt={3}>
              Select A Category
            </Typography>

            <Grid container spacing={3} mb={4}>
              {categories.map((cat) => (
                <Grid item xs={12} md={4} key={cat.value}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: formData.categories.includes(cat.value) ? '2px solid #7c4dff' : '1px solid #e0e0e0',
                      bgcolor: formData.categories.includes(cat.value) ? '#f3e5f5' : 'white',
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                    onClick={() => handleCategoryToggle(cat.value)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Box sx={{ fontSize: 48, color: '#7c4dff', mb: 2 }}>
                        {cat.icon}
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {cat.label}
                      </Typography>
                      {formData.categories.includes(cat.value) && (
                        <Chip label="Selected" color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Alert severity="info" sx={{ mb: 3 }}>
              You can select multiple categories (e.g., Residential + Commercial)
            </Alert>

           
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              Property Details
            </Typography>
            
            {/* Property Name Field */}
            <TextField
              fullWidth
              label="Property Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter property name"
              sx={{ mb: 3 }}
              required
            />
            
            <Typography variant="h6" fontWeight="bold" mb={2}>
              What are the facilities?
            </Typography>
            
            {/* Dynamic Facility Dropdown - Test Version */}
            <Box sx={{ mb: 3, p: 2, border: '2px dashed #e0e0e0', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={9}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Add Facility"
                    value={selectedFacility}
                    onChange={(e) => {
                      console.log('TextField onChange:', e.target.value)
                      setSelectedFacility(e.target.value)
                    }}
                  >
                    <MenuItem value="">
                      <em>Select a facility...</em>
                    </MenuItem>
                    {predefinedFacilities
                      .filter(facility => !formData.facilities.includes(facility))
                      .map((facility, index) => (
                        <MenuItem key={index} value={facility}>
                          {facility}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>
                <Grid item xs={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={addFacility}
                    startIcon={<Add />}
                    disabled={!selectedFacility}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            {/* Display Added Facilities */}
            {formData.facilities.length > 0 && (
              <Box display="flex" flexWrap="wrap" gap={1} mb={4}>
                {formData.facilities.map((facility, index) => (
                  <Chip
                    key={index}
                    label={facility}
                    onDelete={() => removeFacility(index)}
                    color="primary"
                    variant="filled"
                  />
                ))}
              </Box>
            )}

            <Typography variant="h6" fontWeight="bold" mt={4} mb={2}>
              Road Details
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Road Name"
                  value={newRoad.name}
                  onChange={(e) => setNewRoad({ ...newRoad, name: e.target.value })}
                  placeholder="Main Road"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Length (ft)"
                  value={newRoad.lengthFt}
                  onChange={(e) => setNewRoad({ ...newRoad, lengthFt: e.target.value })}
                />
              </Grid>
              <Grid item xs={4}>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Width (ft)"
                    value={newRoad.widthFt}
                    onChange={(e) => setNewRoad({ ...newRoad, widthFt: e.target.value })}
                  />
                  <Button variant="contained" onClick={addRoad} sx={{ minWidth: 80 }}>
                    Add
                  </Button>
                </Box>
              </Grid>
            </Grid>
            {formData.roads.length > 0 && (
              <Box display="flex" flexDirection="column" gap={1} mb={3}>
                {formData.roads.map((road, index) => (
                  <Paper key={index} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>
                      <strong>{road.name}</strong>: {road.lengthFt} ft × {road.widthFt} ft = {((road.lengthFt * road.widthFt) / 9).toFixed(3)} Gaj
                    </Typography>
                    <IconButton size="small" color="error" onClick={() => removeRoad(index)}>
                      <Delete />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            )}

            <Typography variant="h6" fontWeight="bold" mt={4} mb={2}>
              Park / Amenity Area
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Park Name"
                  value={newPark.name}
                  onChange={(e) => setNewPark({ ...newPark, name: e.target.value })}
                  placeholder="Central Park"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Front (ft)"
                  value={newPark.frontFt}
                  onChange={(e) => setNewPark({ ...newPark, frontFt: e.target.value })}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Back (ft)"
                  value={newPark.backFt}
                  onChange={(e) => setNewPark({ ...newPark, backFt: e.target.value })}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Left (ft)"
                  value={newPark.leftFt}
                  onChange={(e) => setNewPark({ ...newPark, leftFt: e.target.value })}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Right (ft)"
                  value={newPark.rightFt}
                  onChange={(e) => setNewPark({ ...newPark, rightFt: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={addPark} startIcon={<Add />}>
                  Add Park
                </Button>
              </Grid>
            </Grid>
            {formData.parks.length > 0 && (
              <Box display="flex" flexDirection="column" gap={1}>
                {formData.parks.map((park, index) => (
                  <Paper key={index} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">{park.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Front: {park.frontFt}ft, Back: {park.backFt}ft, Left: {park.leftFt}ft, Right: {park.rightFt}ft
                      </Typography>
                      <Typography variant="body2" color="primary.main">
                        Area: {park.areaGaj} Gaj
                      </Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => removePark(index)}>
                      <Delete />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )

      case 2:
        return (
          <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              Describe the Property
            </Typography>
            
            <TextField
              fullWidth
              label="Property Tagline *"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Enter Tagline / Title"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              multiline
              rows={4}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address"
              sx={{ mb: 3 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="City"
                  value={formData.cityId}
                  onChange={(e) => {
                    const cityId = e.target.value
                    setFormData({ ...formData, cityId, areaId: '' })
                    fetchAreas(cityId)
                  }}
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
                  select
                  label="Area"
                  value={formData.areaId}
                  onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                  disabled={!formData.cityId || areas.length === 0}
                >
                  <MenuItem value="">Select Area</MenuItem>
                  {areas.map((area) => (
                    <MenuItem key={area._id} value={area._id}>
                      {area.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        )

      case 3:
        return (
          <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              Upload Photos & Documents
            </Typography>
            
            <Grid container spacing={3}>
              {[
                { key: 'mainPicture', label: 'Main Picture', icon: '🏢' },
                { key: 'videoUpload', label: 'Video Upload', icon: '▶️' },
                { key: 'mapImage', label: 'Map Image/PDF', icon: '🗺️' },
                { key: 'noc', label: 'NOC', icon: '📄' },
                { key: 'registry', label: 'Registry', icon: '📋' },
                { key: 'legalDoc', label: 'Any Other Legal Doc', icon: '📝' },
                { key: 'moreImages', label: 'More Property Picture', icon: '📷' }
              ].map((upload) => (
                <Grid item xs={12} md={6} key={upload.key}>
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      border: '2px dashed #e0e0e0',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                    onClick={() => document.getElementById(upload.key).click()}
                  >
                    <Box sx={{ fontSize: 48, mb: 2 }}>{upload.icon}</Box>
                    <Typography variant="body1" fontWeight="bold">
                      {upload.label}
                    </Typography>
                    <input
                      id={upload.key}
                      type="file"
                      hidden
                      accept={upload.key === 'videoUpload' ? 'video/*' : upload.key === 'mapImage' || upload.key === 'noc' || upload.key === 'registry' || upload.key === 'legalDoc' ? 'image/*,application/pdf' : 'image/*'}
                      multiple={upload.key === 'moreImages'}
                      onChange={(e) => {
                        const files = upload.key === 'moreImages' 
                          ? Array.from(e.target.files)
                          : e.target.files[0]
                        handleFileUpload(upload.key, files)
                      }}
                    />
                    {formData[upload.key] && (
                      <Typography variant="body2" color="success.main" mt={1}>
                        ✓ {upload.key === 'moreImages' 
                          ? `${formData[upload.key].length} files selected`
                          : 'File selected'
                        }
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Property Location Section */}
            <Box sx={{ mt: 4, p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: 24 }}>📍</Box>
                Property Current Location
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    type="number"
                    step="any"
                    placeholder="e.g., 27.1767"
                    value={formData.coordinates.latitude}
                    onChange={(e) => setFormData({
                      ...formData,
                      coordinates: {
                        ...formData.coordinates,
                        latitude: e.target.value
                      }
                    })}
                    helperText="Enter property latitude coordinates"
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1, color: 'text.secondary' }}>🌍</Box>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    type="number"
                    step="any"
                    placeholder="e.g., 78.0081"
                    value={formData.coordinates.longitude}
                    onChange={(e) => setFormData({
                      ...formData,
                      coordinates: {
                        ...formData.coordinates,
                        longitude: e.target.value
                      }
                    })}
                    helperText="Enter property longitude coordinates"
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1, color: 'text.secondary' }}>🌍</Box>
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>How to get coordinates:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  1. Open Google Maps<br/>
                  2. Search for your property location<br/>
                  3. Right-click on the exact location<br/>
                  4. Click on the coordinates to copy<br/>
                  5. Paste latitude and longitude above
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    // Open Google Maps in a new tab
                    window.open('https://maps.google.com', '_blank');
                  }}
                  startIcon={<Box sx={{ fontSize: 16 }}>🗺️</Box>}
                >
                  Open Google Maps
                </Button>
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                />
              }
              label={
                <Typography>
                  I Agree With <Button sx={{ p: 0, textDecoration: 'underline' }}>Terms & Conditions</Button>
                </Typography>
              }
              sx={{ mt: 3 }}
            />
          </Box>
        )

      case 4:
        return (
          <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              Preview - Review Your Property Details
            </Typography>
            
            <Grid container spacing={3}>
              {/* Basic Info */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>Basic Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Property Name</Typography>
                      <Typography variant="body1" fontWeight="bold">{formData.name || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Categories</Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        {formData.categories.map(cat => (
                          <Chip key={cat} label={cat} size="small" color="primary" />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Colony</Typography>
                      <Typography variant="body1">{colonies.find(c => c._id === formData.colonyId)?.name || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">City</Typography>
                      <Typography variant="body1">{cities.find(c => c._id === formData.cityId)?.name || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Address</Typography>
                      <Typography variant="body1">{formData.address || '-'}</Typography>
                    </Grid>
                    {(formData.coordinates.latitude || formData.coordinates.longitude) && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Location Coordinates</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                          <Typography variant="body1">
                            📍 Lat: {formData.coordinates.latitude || '-'}, Lng: {formData.coordinates.longitude || '-'}
                          </Typography>
                          {(formData.coordinates.latitude && formData.coordinates.longitude) && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                const url = `https://maps.google.com/?q=${formData.coordinates.latitude},${formData.coordinates.longitude}`;
                                window.open(url, '_blank');
                              }}
                              sx={{ ml: 1 }}
                            >
                              View on Map
                            </Button>
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              {/* Facilities */}
              {formData.facilities.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" mb={2}>Facilities</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {formData.facilities.map((facility, idx) => (
                        <Chip key={idx} label={facility} color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Roads */}
              {formData.roads.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" mb={2}>Roads ({formData.roads.length})</Typography>
                    {formData.roads.map((road, idx) => (
                      <Typography key={idx} variant="body2" mb={1}>
                        • {road.name}: {road.lengthFt}ft × {road.widthFt}ft = {((road.lengthFt * road.widthFt) / 9).toFixed(3)} Gaj
                      </Typography>
                    ))}
                  </Paper>
                </Grid>
              )}

              {/* Parks */}
              {formData.parks.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" mb={2}>Parks/Amenity Areas ({formData.parks.length})</Typography>
                    {formData.parks.map((park, idx) => (
                      <Box key={idx} mb={2}>
                        <Typography variant="body1" fontWeight="bold">{park.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Front: {park.frontFt}ft, Back: {park.backFt}ft, Left: {park.leftFt}ft, Right: {park.rightFt}ft
                        </Typography>
                        <Typography variant="body2" color="primary.main">Area: {park.areaGaj} Gaj</Typography>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              )}

              {/* Description */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>Description</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>Tagline</Typography>
                  <Typography variant="body1" mb={2}>{formData.tagline || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>Full Description</Typography>
                  <Typography variant="body1">{formData.description || '-'}</Typography>
                </Paper>
              </Grid>

              {/* Files */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>Uploaded Files</Typography>
                  <Grid container spacing={2}>
                    {formData.mainPicture && (
                      <Grid item xs={4}>
                        <Chip label="Main Picture" color="success" icon={<CheckCircle />} />
                      </Grid>
                    )}
                    {formData.videoUpload && (
                      <Grid item xs={4}>
                        <Chip label="Video" color="success" icon={<CheckCircle />} />
                      </Grid>
                    )}
                    {formData.mapImage && (
                      <Grid item xs={4}>
                        <Chip label="Map Image" color="success" icon={<CheckCircle />} />
                      </Grid>
                    )}
                    {formData.noc && (
                      <Grid item xs={4}>
                        <Chip label="NOC" color="success" icon={<CheckCircle />} />
                      </Grid>
                    )}
                    {formData.registry && (
                      <Grid item xs={4}>
                        <Chip label="Registry" color="success" icon={<CheckCircle />} />
                      </Grid>
                    )}
                    {formData.legalDoc && (
                      <Grid item xs={4}>
                        <Chip label="Legal Doc" color="success" icon={<CheckCircle />} />
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              Please review all details carefully before submitting. Click "Continue" to create the property.
            </Alert>
          </Box>
        )

      case 5:
        return (
          <Box textAlign="center" py={4}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" mb={2}>
              Thank you for posting!
            </Typography>
            <Alert severity="success" sx={{ mb: 4 }}>
              Property "{formData.name}" has been {editMode ? 'updated' : 'created'} successfully
            </Alert>
            
            <Card sx={{ maxWidth: 300, mx: 'auto', mb: 4 }}>
              <CardContent>
                <Box sx={{ fontSize: 48, mb: 2 }}>📷</Box>
                <Typography variant="h6" fontWeight="bold">
                  {formData.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.categories && formData.categories.length > 0 
                    ? formData.categories.join(', ') 
                    : '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📍 {cities.find(c => c._id === formData.cityId)?.name}
                </Typography>
                <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>

            <Button 
              variant="contained" 
              size="large"
              onClick={resetFormAndCloseDialog}
            >
              Back to Properties
            </Button>
          </Box>
        )

      default:
        return null
    }
  }

  // Show form if addDialogOpen is true
  if (addDialogOpen) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            {editMode ? 'Edit Property' : 'Add New Property'}
          </Typography>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={closeAddDialog}>
            Back to Properties
          </Button>
        </Box>

        <Paper sx={{ p: 3 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          {activeStep < 5 && (
            <Box display="flex" justifyContent="space-between" mt={4}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<NavigateBefore />}
                color="inherit"
                size="large"
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={activeStep === 4 ? handleSubmit : handleNext}
                endIcon={activeStep === 4 ? <CheckCircle /> : <NavigateNext />}
                size="large"
                disabled={loading}
              >
                {loading ? 'Submitting...' : activeStep === 4 ? 'Submit Property' : 'Continue'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    )
  }

  // Main render - list view
  return (
    <>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">
            Mansion Properties
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
            Add feature
          </Button>
        </Box>

        {/* Search Bar */}
        <Box mb={3}>
          <TextField
            fullWidth
            placeholder="Search properties by name, category, or land..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="medium"
            sx={{ maxWidth: 600 }}
          />
        </Box>

        {propertiesLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Property Name</strong></TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  {/* <TableCell><strong>Land</strong></TableCell> */}
                  <TableCell><strong>Total Land (Gaj)</strong></TableCell>
                  <TableCell><strong>Used Land (Gaj)</strong></TableCell>
                  <TableCell><strong>Land Sold (Gaj)</strong></TableCell>
                  <TableCell><strong>Remaining Land (Gaj)</strong></TableCell>
                  <TableCell><strong>Total Revenue</strong></TableCell>
                  <TableCell><strong>Plots</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No properties found. Click "Add Property" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  properties
                    .filter(property => {
                      if (!searchTerm) return true
                      const search = searchTerm.toLowerCase()
                      return (
                        property.name?.toLowerCase().includes(search) ||
                        property.category?.toLowerCase().includes(search) ||
                        property.categories?.some(cat => cat.toLowerCase().includes(search)) ||
                        property.colonyId?.name?.toLowerCase().includes(search)
                      )
                    })
                    .map((property) => {
                    const stats = propertyStats[property._id] || { totalSold: 0, totalRevenue: 0, plots: [] }
                    const totalLand = property.totalLandAreaGaj || 0
                    const usedLand = calculateUsedLand(property)
                    const soldLandGaj = stats.totalSold / 9
                    const remainingLand = calculateRemainingLand(property)
                    
                    return (
                      <TableRow 
                        key={property._id} 
                        hover 
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleViewPlots(property)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{property.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {/* {property.categories && property.categories.length > 0 
                              ? property.categories.join(', ') 
                              : property.category || '-'} */}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {property.categories && property.categories.length > 0 
                              ? property.categories.map((cat, idx) => (
                                  <Chip key={idx} label={cat} size="small" />
                                ))
                              : <Chip label={property.category || '-'} size="small" />
                            }
                          </Box>
                        </TableCell>
                        {/* <TableCell>{property.colonyId?.name || '-'}</TableCell> */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {totalLand > 0 ? totalLand.toFixed(2) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={usedLand.toFixed(2)} 
                            size="small" 
                            color="warning"
                            title="Land used by roads, parks, and amenities"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error.main">
                            {soldLandGaj > 0 ? soldLandGaj.toFixed(2) : '0.00'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={remainingLand.toFixed(2)} 
                            size="small" 
                            color={remainingLand > 0 ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            ₹{stats.totalRevenue.toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${stats.plots.length} plots`} 
                            size="small" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewPlots(property)
                            }}
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleViewPlots(property)}
                            title="View Details"
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => openEditDialog(property)}
                            title="Edit Property"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteProperty(property._id)}
                            title="Delete Property"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {addDialogOpen && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'white', zIndex: 1300, overflow: 'auto' }}>
          <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Typography variant="h4" fontWeight="bold">
                {editMode ? 'Edit Property' : 'Add New Property'}
              </Typography>
              <Button variant="outlined" onClick={closeAddDialog} startIcon={<Close />}>Cancel</Button>
            </Box>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>
                <Typography variant="body2">{label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
          {renderStepContent()}
        </Box>

        {activeStep < 5 && (
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<NavigateBefore />}
              color="inherit"
              size="large"
            >
              Previous
            </Button>
            
            <Button
              onClick={activeStep === 4 ? handleSubmit : handleNext}
              endIcon={activeStep === 4 ? <CheckCircle /> : <NavigateNext />}
              variant="contained"
              disabled={loading}
              size="large"
            >
              {loading ? 'Submitting...' : activeStep === 4 ? 'Submit Property' : 'Continue'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
      )}

      {/* Plots Dialog */}
      <Dialog open={plotsDialogOpen} onClose={() => setPlotsDialogOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">Plots - {selectedPropertyPlots?.property?.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Total: {selectedPropertyPlots?.plots?.length || 0} plots
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button 
                variant="contained" 
                color="primary" 
                size="small"
                startIcon={<Add />}
                onClick={() => handleAddPlotForProperty(selectedPropertyPlots?.property)}
              >
                Add Plot
              </Button>
              {/* <Button 
                variant="contained" 
                color="secondary" 
                size="small"
                startIcon={<Add />}
                onClick={() => handleAddFeatureForProperty(selectedPropertyPlots?.property)}
              >
                Add Feature
              </Button> */}
              <IconButton onClick={() => setPlotsDialogOpen(false)} size="small">
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPropertyPlots && (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={2.4}>
                    <Typography variant="body2" color="text.secondary">Total Land</Typography>
                    <Typography variant="h6">{selectedPropertyPlots.property.totalLandAreaGaj?.toFixed(2) || 0} Gaj</Typography>
                  </Grid>
                  <Grid item xs={2.4}>
                    <Typography variant="body2" color="text.secondary">Used Land</Typography>
                    <Typography variant="h6" color="warning.main">
                      {calculateUsedLand(selectedPropertyPlots.property).toFixed(2)} Gaj
                    </Typography>
                  </Grid>
                  <Grid item xs={2.4}>
                    <Typography variant="body2" color="text.secondary">Land Sold</Typography>
                    <Typography variant="h6" color="error.main">
                      {(selectedPropertyPlots.stats?.totalSold / 9 || 0).toFixed(2)} Gaj
                    </Typography>
                  </Grid>
                  <Grid item xs={2.4}>
                    <Typography variant="body2" color="text.secondary">Remaining Land</Typography>
                    <Typography variant="h6" color="success.main">
                      {calculateRemainingLand(selectedPropertyPlots.property).toFixed(2)} Gaj
                    </Typography>
                  </Grid>
                  <Grid item xs={2.4}>
                    <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                    <Typography variant="h6" color="primary.main">
                      ₹{(selectedPropertyPlots.stats?.totalRevenue || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Plot No</strong></TableCell>
                      <TableCell><strong>Area (Gaj)</strong></TableCell>
                      <TableCell><strong>Asking Price/Gaj</strong></TableCell>
                      <TableCell><strong>Total Price</strong></TableCell>
                      {/* <TableCell><strong>Paid Amount</strong></TableCell> */}
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPropertyPlots.plots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No plots found</TableCell>
                      </TableRow>
                    ) : (
                      selectedPropertyPlots.plots.map((plot) => (
                        <TableRow key={plot._id} hover>
                          <TableCell>{plot.plotNumber || plot.plotNo}</TableCell>
                          <TableCell>{(plot.area / 9).toFixed(3)}</TableCell>
                          <TableCell>₹{((plot.pricePerSqFt || 0) * 9).toLocaleString('en-IN')}</TableCell>
                          <TableCell>₹{(plot.totalPrice || 0).toLocaleString('en-IN')}</TableCell>
                          {/* <TableCell>₹{(plot.paidAmount || 0).toLocaleString('en-IN')}</TableCell> */}
                          <TableCell>
                            <Chip 
                              label={plot.status} 
                              size="small" 
                              color={plot.status === 'sold' ? 'error' : plot.status === 'available' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PropertyManagement
