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
  DialogActions,
  Alert
} from '@mui/material'
import {
  NavigateNext,
  NavigateBefore,
  CloudUpload,
  CheckCircle,
  Home,
  Business,
  Agriculture
} from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const PropertyManagement = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [colonies, setColonies] = useState([])
  const [cities, setCities] = useState([])
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    // Step 1: Select Type
    category: 'Residential',
    colonyId: '',
    
    // Step 2: Property Details
    name: '',
    facilities: [],
    amenities: [],
    
    // Step 3: Description & Pricing
    tagline: '',
    description: '',
    address: '',
    cityId: '',
    areaId: '',
    
    // Step 4: Photos
    mainPicture: null,
    videoUpload: null,
    mapImage: null,
    noc: null,
    registry: null,
    legalDoc: null,
    moreImages: [],
    agreeTerms: false
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

  useEffect(() => {
    fetchColonies()
    fetchCities()
    fetchAreas()
  }, [])

  const fetchColonies = async () => {
    try {
      const { data } = await axios.get('/colonies')
      setColonies(data.data.colonies || [])
    } catch (error) {
      console.error('Failed to fetch colonies')
    }
  }

  const fetchCities = async () => {
    try {
      const { data } = await axios.get('/cities')
      setCities(data.data.cities || [])
    } catch (error) {
      console.error('Failed to fetch cities')
    }
  }

  const fetchAreas = async () => {
    try {
      const { data } = await axios.get('/areas')
      setAreas(data.data.areas || [])
    } catch (error) {
      console.error('Failed to fetch areas')
    }
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
      case 1:
        if (!formData.name) {
          toast.error('Please enter property name')
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
      
      // Add form data
      Object.keys(formData).forEach(key => {
        if (key === 'facilities' || key === 'amenities') {
          payload.append(key, JSON.stringify(formData[key]))
        } else if (key === 'moreImages') {
          formData[key].forEach(file => {
            payload.append('moreImages', file)
          })
        } else if (formData[key] instanceof File) {
          payload.append(key, formData[key])
        } else {
          payload.append(key, formData[key])
        }
      })

      await axios.post('/properties', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setShowSuccess(true)
      setActiveStep(4)
      toast.success('Property created successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create property')
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
              onChange={(e) => setFormData({ ...formData, colonyId: e.target.value })}
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
            
            <TextField
              fullWidth
              label="Property Name*"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter Property Name"
              sx={{ mb: 4 }}
            />

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
                  {areas.filter(area => area.cityId._id === formData.cityId).map((area) => (
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
              Thank you for posting on Jay Shree
            </Typography>
            <Alert severity="success" sx={{ mb: 4 }}>
              Admin Has Successfully Created A Property For Super Admin
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
                <Chip label="Approved" color="warning" size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>

            <Box display="flex" gap={2} justifyContent="center">
              <Button variant="outlined" size="large">
                Browse your property
              </Button>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => {
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
                    agreeTerms: false
                  })
                }}
              >
                Post Another Property
              </Button>
            </Box>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Add New Property
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>
              <Typography variant="body2">
                {index + 1}
              </Typography>
              <Typography variant="body2">
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 4, minHeight: 500 }}>
        {renderStepContent()}
      </Paper>

      {activeStep < 4 && (
        <Box display="flex" justifyContent="space-between" mt={3}>
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
    </Box>
  )
}

export default PropertyManagement
