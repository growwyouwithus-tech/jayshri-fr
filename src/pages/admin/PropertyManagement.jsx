import { useState, useEffect } from 'react'
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
  Alert
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
  Close
} from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const PropertyManagement = () => {
  // Main list view state
  const [properties, setProperties] = useState([])
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentProperty, setCurrentProperty] = useState(null)
  
  // Form stepper state
  const [activeStep, setActiveStep] = useState(0)
  const [colonies, setColonies] = useState([])
  const [cities, setCities] = useState([])
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    category: 'Residential',
    colonyId: '',
    name: '',
    facilities: [],
    amenities: [],
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
    parks: []
  })

  const steps = [
    'Select Type',
    'Property Details', 
    'Description & Pricing',
    'Photos',
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
  const [newPark, setNewPark] = useState({ name: '', lengthFt: '', widthFt: '' })

  useEffect(() => {
    fetchProperties()
    fetchColonies()
    fetchCities()
    fetchAreas()
  }, [])

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

  const fetchAreas = async () => {
    try {
      // Backend does not expose /areas. Keep empty list gracefully.
      setAreas([])
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
      name: selectedColony?.name || ''
    }))
  }

  const openAddDialog = () => {
    setEditMode(false)
    setCurrentProperty(null)
    setActiveStep(0)
    setFormData({
      category: 'Residential',
      colonyId: '',
      name: '',
      facilities: [],
      amenities: [],
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
      parks: []
    })
    setAddDialogOpen(true)
  }

  const openEditDialog = (property) => {
    setEditMode(true)
    setCurrentProperty(property)
    setActiveStep(0)
    setFormData({
      category: property.category || 'Residential',
      colonyId: property.colonyId?._id || property.colony?._id || '',
      name: property.name || '',
      facilities: property.facilities || [],
      amenities: property.amenities || [],
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
      parks: property.parks || []
    })
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
        if (!formData.category || !formData.colonyId) {
          toast.error('Please select category and colony')
          return false
        }
        break
      case 2:
        if (!formData.tagline || !formData.description || !formData.cityId) {
          toast.error('Please fill all required fields')
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
    setLoading(true)
    try {
      const payload = new FormData()
      
      Object.keys(formData).forEach(key => {
        if (['facilities', 'amenities', 'roads', 'parks'].includes(key)) {
          payload.append(key, JSON.stringify(formData[key]))
        } else if (key === 'moreImages') {
          if (Array.isArray(formData[key])) {
            formData[key].forEach(file => {
              if (file instanceof File) {
                payload.append('moreImages', file)
              }
            })
          }
        } else if (formData[key] instanceof File) {
          payload.append(key, formData[key])
        } else if (formData[key] !== null && formData[key] !== undefined) {
          payload.append(key, formData[key])
        }
      })

      if (editMode && currentProperty) {
        await axios.put(`/properties/${currentProperty._id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Property updated successfully!')
      } else {
        await axios.post('/properties', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Property created successfully!')
      }
      
      setActiveStep(4)
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} property`)
    } finally {
      setLoading(false)
    }
  }

  const handleFacilityToggle = (facility) => {
    const newFacilities = formData.facilities.includes(facility)
      ? formData.facilities.filter(f => f !== facility)
      : [...formData.facilities, facility]
    setFormData({ ...formData, facilities: newFacilities })
  }

  const handleAmenityToggle = (amenity) => {
    const newAmenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter(a => a !== amenity)
      : [...formData.amenities, amenity]
    setFormData({ ...formData, amenities: newAmenities })
  }

  const handleFileUpload = (field, file) => {
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

  const resetFormAndCloseDialog = () => {
    setActiveStep(0)
    setFormData({
      category: 'Residential',
      colonyId: '',
      name: '',
      facilities: [],
      amenities: [],
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
      parks: []
    })
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
    if (newPark.name && newPark.lengthFt && newPark.widthFt) {
      setFormData({ ...formData, parks: [...formData.parks, { ...newPark }] })
      setNewPark({ name: '', lengthFt: '', widthFt: '' })
    } else {
      toast.error('Please fill all park fields')
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
            <Typography variant="body2" color="text.secondary" mb={3}>
              Select A Category
            </Typography>
            
            <Grid container spacing={3} mb={4}>
              {categories.map((cat) => (
                <Grid item xs={12} md={4} key={cat.value}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: formData.category === cat.value ? '2px solid #7c4dff' : '1px solid #e0e0e0',
                      bgcolor: formData.category === cat.value ? '#f3e5f5' : 'white',
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Box sx={{ fontSize: 48, color: '#7c4dff', mb: 2 }}>
                        {cat.icon}
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {cat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

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
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              Property Details
            </Typography>
            
            <Typography variant="h6" fontWeight="bold" mb={2}>
              What are the facilities?
            </Typography>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button
                size="small"
                onClick={() => {
                  const allSelected = facilitiesList.every(f => formData.facilities.includes(f))
                  setFormData({
                    ...formData,
                    facilities: allSelected ? [] : [...facilitiesList]
                  })
                }}
              >
                Select All
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1} mb={4}>
              {facilitiesList.map((facility) => (
                <Chip
                  key={facility}
                  label={facility}
                  onClick={() => handleFacilityToggle(facility)}
                  color={formData.facilities.includes(facility) ? 'primary' : 'default'}
                  variant={formData.facilities.includes(facility) ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>

            <Typography variant="h6" fontWeight="bold" mb={2}>
              What are the amenities?
            </Typography>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button
                size="small"
                onClick={() => {
                  const allSelected = amenitiesList.every(a => formData.amenities.includes(a))
                  setFormData({
                    ...formData,
                    amenities: allSelected ? [] : [...amenitiesList]
                  })
                }}
              >
                Select All
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {amenitiesList.map((amenity) => (
                <Chip
                  key={amenity}
                  label={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  color={formData.amenities.includes(amenity) ? 'primary' : 'default'}
                  variant={formData.amenities.includes(amenity) ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>

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
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Park Name"
                  value={newPark.name}
                  onChange={(e) => setNewPark({ ...newPark, name: e.target.value })}
                  placeholder="Central Park"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Length (ft)"
                  value={newPark.lengthFt}
                  onChange={(e) => setNewPark({ ...newPark, lengthFt: e.target.value })}
                />
              </Grid>
              <Grid item xs={4}>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Width (ft)"
                    value={newPark.widthFt}
                    onChange={(e) => setNewPark({ ...newPark, widthFt: e.target.value })}
                  />
                  <Button variant="contained" onClick={addPark} sx={{ minWidth: 80 }}>
                    Add
                  </Button>
                </Box>
              </Grid>
            </Grid>
            {formData.parks.length > 0 && (
              <Box display="flex" flexDirection="column" gap={1}>
                {formData.parks.map((park, index) => (
                  <Paper key={index} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>
                      <strong>{park.name}</strong>: {park.lengthFt} ft × {park.widthFt} ft = {((park.lengthFt * park.widthFt) / 9).toFixed(3)} Gaj
                    </Typography>
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
                  onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
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
                >
                  <MenuItem value="">Select Area</MenuItem>
              {(Array.isArray(areas) ? areas.filter(area => area.cityId?._id === formData.cityId) : []).map((area) => (
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
                  {formData.category}
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

  // Main render - list view with dialog overlay
  return (
    <>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">
            Properties Management
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
            Add Property
          </Button>
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
                  <TableCell><strong>Colony</strong></TableCell>
                  <TableCell><strong>City</strong></TableCell>
                  <TableCell><strong>Facilities</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No properties found. Click "Add Property" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  properties.map((property) => (
                    <TableRow key={property._id} hover>
                      <TableCell>{property.name}</TableCell>
                      <TableCell>
                        <Chip label={property.category} size="small" />
                      </TableCell>
                      <TableCell>{property.colonyId?.name}</TableCell>
                      <TableCell>{property.cityId?.name}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {property.facilities?.slice(0, 3).map((fac, idx) => (
                            <Chip key={idx} label={fac} size="small" variant="outlined" />
                          ))}
                          {property.facilities?.length > 3 && (
                            <Chip label={`+${property.facilities.length - 3}`} size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => openEditDialog(property)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteProperty(property._id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog open={addDialogOpen} onClose={closeAddDialog} fullWidth maxWidth="md">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{editMode ? 'Edit Property' : 'Add New Property'}</Typography>
          <IconButton onClick={closeAddDialog} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
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

        {activeStep < 4 && (
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<NavigateBefore />}
              color="inherit"
            >
              Previous
            </Button>
            
            <Button
              onClick={activeStep === 3 ? handleSubmit : handleNext}
              endIcon={activeStep === 3 ? null : <NavigateNext />}
              variant="contained"
              disabled={loading}
            >
              {activeStep === 3 ? 'Submit' : 'Continue'}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}

export default PropertyManagement
