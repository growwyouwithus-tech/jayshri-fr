import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tab,
  Tabs,
  Alert
} from '@mui/material'
import { Edit, Save, Cancel, CloudUpload, Delete, Add } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [companySettings, setCompanySettings] = useState({
    companyName: 'Jayshree Properties',
    email: 'info@jayshreeproperties.com',
    phone: '+91 9876543210',
    address: 'Sector 12, Gurgaon, Haryana',
    website: 'www.jayshreeproperties.com',
    logo: null,
    gstNumber: '07AABCJ1234F1Z5',
    panNumber: 'AABCJ1234F',
    owners: [], // Array of owners
    companyWitnesses: [] // Array of company witnesses
  })

  const [systemSettings, setSystemSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    autoBackup: true,
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    sessionTimeout: 30,
    maxFileSize: 10
  })

  const [paymentSettings, setPaymentSettings] = useState({
    razorpayEnabled: true,
    razorpayKeyId: '',
    paytmEnabled: false,
    paytmMerchantId: '',
    bankTransferEnabled: true,
    cashPaymentEnabled: true,
    minimumBookingAmount: 50000,
    lateFeePercentage: 2
  })

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get('/settings')
        if (response.data.success && response.data.data) {
          const data = response.data.data

          // Update company settings
          setCompanySettings(prev => ({
            ...prev,
            companyName: data.companyName || prev.companyName,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            address: data.address || prev.address,
            website: data.website || prev.website,
            gstNumber: data.gstNumber || prev.gstNumber,
            panNumber: data.panNumber || prev.panNumber,
            owners: data.owners || [],
            companyWitnesses: data.companyWitnesses || []
          }))
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    loadSettings()
  }, [])

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handleCompanySettingsChange = (field, value) => {
    setCompanySettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Owner management functions
  const addOwner = () => {
    setCompanySettings(prev => ({
      ...prev,
      owners: [...prev.owners, {
        name: '',
        phone: '',
        aadharNumber: '',
        panNumber: '',
        dateOfBirth: '',
        sonOf: '',
        daughterOf: '',
        wifeOf: '',
        address: '',
        documents: {}
      }]
    }))
  }

  const removeOwner = (index) => {
    setCompanySettings(prev => ({
      ...prev,
      owners: prev.owners.filter((_, i) => i !== index)
    }))
  }

  const updateOwner = (index, field, value) => {
    setCompanySettings(prev => {
      const newOwners = [...prev.owners]
      newOwners[index] = {
        ...newOwners[index],
        [field]: value
      }
      return { ...prev, owners: newOwners }
    })
  }

  const updateOwnerDocument = (index, docType, file) => {
    setCompanySettings(prev => {
      const newOwners = [...prev.owners]
      if (!newOwners[index].documents) {
        newOwners[index].documents = {}
      }
      newOwners[index].documents[docType] = file
      return { ...prev, owners: newOwners }
    })
  }

  const handleSystemSettingsChange = (field, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }



  // Company Witness management functions
  const handleAddWitness = () => {
    setCompanySettings(prev => ({
      ...prev,
      companyWitnesses: [...(prev.companyWitnesses || []), {
        name: '',
        phone: '',
        aadharNumber: '',
        panNumber: '',
        dateOfBirth: '',
        sonOf: '',
        daughterOf: '',
        wifeOf: '',
        address: '',
        documents: {}
      }]
    }))
  }

  const handleRemoveWitness = (index) => {
    setCompanySettings(prev => ({
      ...prev,
      companyWitnesses: (prev.companyWitnesses || []).filter((_, i) => i !== index)
    }))
  }

  const handleWitnessChange = (index, field, value) => {
    setCompanySettings(prev => {
      const newWitnesses = [...(prev.companyWitnesses || [])]
      newWitnesses[index] = {
        ...newWitnesses[index],
        [field]: value
      }
      return { ...prev, companyWitnesses: newWitnesses }
    })
  }

  const handleWitnessFileChange = (index, docType, file) => {
    setCompanySettings(prev => {
      const newWitnesses = [...(prev.companyWitnesses || [])]
      if (!newWitnesses[index]) return prev;

      if (!newWitnesses[index].documents) {
        newWitnesses[index].documents = {}
      }
      newWitnesses[index].documents[docType] = file
      return { ...prev, companyWitnesses: newWitnesses }
    })
  }

  const handlePaymentSettingsChange = (field, value) => {
    setPaymentSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveSettings = async (settingsType) => {
    setLoading(true)
    try {
      let payload
      let isFormData = false;

      switch (settingsType) {
        case 'company':
          // Create FormData for company settings to handle file uploads
          const formData = new FormData();

          // Add company fields
          Object.keys(companySettings).forEach(key => {
            if (key === 'owners' || key === 'companyWitnesses') {
              // Handle owners and witnesses separately
              return;
            }
            if (key === 'logo' && companySettings[key] instanceof File) {
              formData.append('logo', companySettings[key]);
            } else if (!(companySettings[key] instanceof File)) {
              formData.append(key, companySettings[key]);
            }
          });

          // Add owners data (without files)
          const ownersData = companySettings.owners.map(owner => ({
            name: owner.name,
            phone: owner.phone,
            aadharNumber: owner.aadharNumber,
            panNumber: owner.panNumber,
            dateOfBirth: owner.dateOfBirth,
            sonOf: owner.sonOf,
            daughterOf: owner.daughterOf,
            wifeOf: owner.wifeOf,
            address: owner.address
          }));
          formData.append('owners', JSON.stringify(ownersData));

          // Add owner documents with indexed field names
          companySettings.owners.forEach((owner, index) => {
            if (owner.documents) {
              Object.keys(owner.documents).forEach(docType => {
                const file = owner.documents[docType];
                if (file instanceof File) {
                  formData.append(`owner_${index}_${docType}`, file);
                }
              });
            }
          });

          // Add company witnesses data
          if (Array.isArray(companySettings.companyWitnesses)) {
            const witnessesData = companySettings.companyWitnesses.map(witness => ({
              _id: witness._id,
              name: witness.name,
              phone: witness.phone,
              aadharNumber: witness.aadharNumber,
              panNumber: witness.panNumber,
              dateOfBirth: witness.dateOfBirth,
              sonOf: witness.sonOf,
              daughterOf: witness.daughterOf,
              wifeOf: witness.wifeOf,
              address: witness.address
            }));
            formData.append('companyWitnesses', JSON.stringify(witnessesData));

            // Add witness documents with indexed field names
            companySettings.companyWitnesses.forEach((witness, index) => {
              if (witness.documents) {
                Object.keys(witness.documents).forEach(docType => {
                  const file = witness.documents[docType];
                  if (file instanceof File) {
                    formData.append(`witness_${index}_${docType}`, file);
                  }
                });
              }
            });
          }

          payload = formData;
          isFormData = true;
          break
        case 'system':
          payload = systemSettings
          break
        case 'payment':
          payload = paymentSettings
          break
        default:
          return
      }

      // Try to update settings, if endpoint doesn't exist, just show success
      try {
        const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        await axios.put(`/settings/${settingsType}`, payload, config)
      } catch (apiError) {
        // If API endpoint doesn't exist (404), just save locally
        if (apiError.response?.status === 404) {
          console.log(`Settings API not available, saving ${settingsType} settings locally`)
          localStorage.setItem(`${settingsType}Settings`, JSON.stringify(payload))
        } else {
          throw apiError
        }
      }

      toast.success(`${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} settings updated successfully`)
    } catch (error) {
      console.error(`Failed to update ${settingsType} settings:`, error)
      const errorMessage = error.response?.data?.message || error.message || `Failed to update ${settingsType} settings`
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const renderCompanySettings = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight="bold" mb={3}>
        Company Information
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Company Name"
            value={companySettings.companyName}
            onChange={(e) => handleCompanySettingsChange('companyName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={companySettings.email}
            onChange={(e) => handleCompanySettingsChange('email', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone"
            value={companySettings.phone}
            onChange={(e) => handleCompanySettingsChange('phone', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Website"
            value={companySettings.website}
            onChange={(e) => handleCompanySettingsChange('website', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            multiline
            rows={3}
            value={companySettings.address}
            onChange={(e) => handleCompanySettingsChange('address', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="GST Number"
            value={companySettings.gstNumber}
            onChange={(e) => handleCompanySettingsChange('gstNumber', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="PAN Number"
            value={companySettings.panNumber}
            onChange={(e) => handleCompanySettingsChange('panNumber', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2" mb={1}>Company Logo</Typography>
          <Box
            sx={{
              border: '2px dashed #e0e0e0',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
            onClick={() => document.getElementById('company-logo').click()}
          >
            <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Click to upload company logo
            </Typography>
            <input
              id="company-logo"
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => handleCompanySettingsChange('logo', e.target.files[0])}
            />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Company Owners
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={addOwner}
              size="small"
            >
              Add Owner
            </Button>
          </Box>
        </Grid>

        {companySettings.owners.map((owner, index) => (
          <Grid item xs={12} key={index}>
            <Card variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Owner {index + 1}
                </Typography>
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => removeOwner(index)}
                >
                  <Delete />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Name *"
                    required
                    value={owner.name}
                    onChange={(e) => updateOwner(index, 'name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={owner.phone}
                    onChange={(e) => updateOwner(index, 'phone', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Aadhar Number"
                    value={owner.aadharNumber}
                    onChange={(e) => updateOwner(index, 'aadharNumber', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="PAN Number"
                    value={owner.panNumber}
                    onChange={(e) => updateOwner(index, 'panNumber', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={owner.dateOfBirth || ''}
                    onChange={(e) => updateOwner(index, 'dateOfBirth', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Son of"
                    value={owner.sonOf || ''}
                    onChange={(e) => updateOwner(index, 'sonOf', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Daughter of"
                    value={owner.daughterOf || ''}
                    onChange={(e) => updateOwner(index, 'daughterOf', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Wife of"
                    value={owner.wifeOf || ''}
                    onChange={(e) => updateOwner(index, 'wifeOf', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={2}
                    value={owner.address || ''}
                    onChange={(e) => updateOwner(index, 'address', e.target.value)}
                    placeholder="as per aadhar card"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" fontWeight="bold" mb={1}>
                    Documents
                  </Typography>
                </Grid>

                <Grid item xs={6} md={4}>
                  <Typography variant="caption" display="block" mb={0.5}>Aadhar Front</Typography>
                  <Button variant="outlined" component="label" fullWidth size="small">
                    Upload
                    <input
                      type="file"
                      hidden
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          e.target.value = ''
                        } else {
                          updateOwnerDocument(index, 'aadharFront', file)
                        }
                      }}
                    />
                  </Button>
                  {owner.documents?.aadharFront && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="success.main" display="block" mb={0.5}>
                        ✓ File selected
                      </Typography>
                      {typeof owner.documents.aadharFront === 'string' ? (
                        <Box
                          component="img"
                          src={owner.documents.aadharFront}
                          alt="Aadhar Front Preview"
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                        />
                      ) : (
                        <Box
                          component="img"
                          src={URL.createObjectURL(owner.documents.aadharFront)}
                          alt="Aadhar Front Preview"
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Grid>

                <Grid item xs={6} md={4}>
                  <Typography variant="caption" display="block" mb={0.5}>Aadhar Back</Typography>
                  <Button variant="outlined" component="label" fullWidth size="small">
                    Upload
                    <input
                      type="file"
                      hidden
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          e.target.value = ''
                        } else {
                          updateOwnerDocument(index, 'aadharBack', file)
                        }
                      }}
                    />
                  </Button>
                  {owner.documents?.aadharBack && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="success.main" display="block" mb={0.5}>
                        ✓ File selected
                      </Typography>
                      {typeof owner.documents.aadharBack === 'string' ? (
                        <Box
                          component="img"
                          src={owner.documents.aadharBack}
                          alt="Aadhar Back Preview"
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                        />
                      ) : (
                        <Box
                          component="img"
                          src={URL.createObjectURL(owner.documents.aadharBack)}
                          alt="Aadhar Back Preview"
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Grid>

                <Grid item xs={6} md={4}>
                  <Typography variant="caption" display="block" mb={0.5}>PAN Card</Typography>
                  <Button variant="outlined" component="label" fullWidth size="small">
                    Upload
                    <input
                      type="file"
                      hidden
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          e.target.value = ''
                        } else {
                          updateOwnerDocument(index, 'panCard', file)
                        }
                      }}
                    />
                  </Button>
                  {owner.documents?.panCard && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="success.main" display="block" mb={0.5}>
                        ✓ File selected
                      </Typography>
                      {typeof owner.documents.panCard === 'string' ? (
                        <Box
                          component="img"
                          src={owner.documents.panCard}
                          alt="PAN Card Preview"
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                        />
                      ) : (
                        <Box
                          component="img"
                          src={URL.createObjectURL(owner.documents.panCard)}
                          alt="PAN Card Preview"
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Grid>

                <Grid item xs={6} md={4}>
                  <Typography variant="caption" display="block" mb={0.5}>Passport Photo</Typography>
                  <Button variant="outlined" component="label" fullWidth size="small">
                    Upload
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          e.target.value = ''
                        } else {
                          updateOwnerDocument(index, 'passportPhoto', file)
                        }
                      }}
                    />
                  </Button>
                  {owner.documents?.passportPhoto && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="success.main" display="block" mb={0.5}>
                        ✓ File selected
                      </Typography>
                      {typeof owner.documents.passportPhoto === 'string' ? (
                        <Box
                          component="img"
                          src={owner.documents.passportPhoto}
                          alt="Passport Photo Preview"
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                        />
                      ) : (
                        <Box
                          component="img"
                          src={URL.createObjectURL(owner.documents.passportPhoto)}
                          alt="Passport Photo Preview"
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Grid>

                <Grid item xs={6} md={4}>
                  <Typography variant="caption" display="block" mb={0.5}>Full Photo</Typography>
                  <Button variant="outlined" component="label" fullWidth size="small">
                    Upload
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          e.target.value = ''
                        } else {
                          updateOwnerDocument(index, 'fullPhoto', file)
                        }
                      }}
                    />
                  </Button>
                  {owner.documents?.fullPhoto && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="success.main" display="block" mb={0.5}>
                        ✓ File selected
                      </Typography>
                      {typeof owner.documents.fullPhoto === 'string' ? (
                        <Box
                          component="img"
                          src={owner.documents.fullPhoto}
                          alt="Full Photo Preview"
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                        />
                      ) : (
                        <Box
                          component="img"
                          src={URL.createObjectURL(owner.documents.fullPhoto)}
                          alt="Full Photo Preview"
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Card>
          </Grid>
        ))}

        {companySettings.owners.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              No owners added yet. Click "Add Owner" to add company owners.
            </Alert>
          </Grid>
        )}
      </Grid>

      <Box mt={3}>
        <Button
          variant="contained"
          onClick={() => handleSaveSettings('company')}
          disabled={loading}
        >
          Save Company Settings
        </Button>
      </Box>
    </Paper>
  )

  const renderSystemSettings = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight="bold" mb={3}>
        System Configuration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            Notifications
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={systemSettings.emailNotifications}
                onChange={(e) => handleSystemSettingsChange('emailNotifications', e.target.checked)}
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={systemSettings.smsNotifications}
                onChange={(e) => handleSystemSettingsChange('smsNotifications', e.target.checked)}
              />
            }
            label="SMS Notifications"
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            System Settings
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={systemSettings.autoBackup}
                onChange={(e) => handleSystemSettingsChange('autoBackup', e.target.checked)}
              />
            }
            label="Auto Backup"
          />
          <FormControlLabel
            control={
              <Switch
                checked={systemSettings.maintenanceMode}
                onChange={(e) => handleSystemSettingsChange('maintenanceMode', e.target.checked)}
              />
            }
            label="Maintenance Mode"
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            User Registration
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={systemSettings.allowRegistration}
                onChange={(e) => handleSystemSettingsChange('allowRegistration', e.target.checked)}
              />
            }
            label="Allow User Registration"
          />
          <FormControlLabel
            control={
              <Switch
                checked={systemSettings.requireEmailVerification}
                onChange={(e) => handleSystemSettingsChange('requireEmailVerification', e.target.checked)}
              />
            }
            label="Require Email Verification"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Session Timeout (minutes)"
            type="number"
            value={systemSettings.sessionTimeout}
            onChange={(e) => handleSystemSettingsChange('sessionTimeout', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Max File Size (MB)"
            type="number"
            value={systemSettings.maxFileSize}
            onChange={(e) => handleSystemSettingsChange('maxFileSize', e.target.value)}
          />
        </Grid>
      </Grid>

      <Box mt={3}>
        <Button
          variant="contained"
          onClick={() => handleSaveSettings('system')}
          disabled={loading}
        >
          Save System Settings
        </Button>
      </Box>
    </Paper>
  )

  const renderPaymentSettings = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight="bold" mb={3}>
        Payment Configuration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            Payment Gateways
          </Typography>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body1" fontWeight="bold">Razorpay</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Online payment gateway
                  </Typography>
                </Box>
                <Switch
                  checked={paymentSettings.razorpayEnabled}
                  onChange={(e) => handlePaymentSettingsChange('razorpayEnabled', e.target.checked)}
                />
              </Box>
              {paymentSettings.razorpayEnabled && (
                <Box mt={2}>
                  <TextField
                    fullWidth
                    label="Razorpay Key ID"
                    value={paymentSettings.razorpayKeyId}
                    onChange={(e) => handlePaymentSettingsChange('razorpayKeyId', e.target.value)}
                    placeholder="rzp_test_xxxxxxxxxx"
                  />
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body1" fontWeight="bold">Bank Transfer</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Direct bank transfer
                  </Typography>
                </Box>
                <Switch
                  checked={paymentSettings.bankTransferEnabled}
                  onChange={(e) => handlePaymentSettingsChange('bankTransferEnabled', e.target.checked)}
                />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body1" fontWeight="bold">Cash Payment</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cash payment at office
                  </Typography>
                </Box>
                <Switch
                  checked={paymentSettings.cashPaymentEnabled}
                  onChange={(e) => handlePaymentSettingsChange('cashPaymentEnabled', e.target.checked)}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            Payment Rules
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Minimum Booking Amount (₹)"
            type="number"
            value={paymentSettings.minimumBookingAmount}
            onChange={(e) => handlePaymentSettingsChange('minimumBookingAmount', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Late Fee Percentage (%)"
            type="number"
            value={paymentSettings.lateFeePercentage}
            onChange={(e) => handlePaymentSettingsChange('lateFeePercentage', e.target.value)}
          />
        </Grid>
      </Grid>

      <Box mt={3}>
        <Button
          variant="contained"
          onClick={() => handleSaveSettings('payment')}
          disabled={loading}
        >
          Save Payment Settings
        </Button>
      </Box>
    </Paper>
  )

  const renderWitnessSettings = () => (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Company Witnesses
        </Typography>
        <Button
          startIcon={<Add />}
          variant="contained"
          onClick={handleAddWitness}
          sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
        >
          Add Witness
        </Button>
      </Box>

      {companySettings.companyWitnesses && companySettings.companyWitnesses.length > 0 ? (
        companySettings.companyWitnesses.map((witness, index) => (
          <Box key={index} sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                Witness {index + 1}
              </Typography>
              <IconButton
                color="error"
                onClick={() => handleRemoveWitness(index)}
                size="small"
              >
                <Delete />
              </IconButton>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Name"
                  value={witness.name || ''}
                  onChange={(e) => handleWitnessChange(index, 'name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={witness.phone || ''}
                  onChange={(e) => handleWitnessChange(index, 'phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Aadhar Number"
                  value={witness.aadharNumber || ''}
                  onChange={(e) => handleWitnessChange(index, 'aadharNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="PAN Number"
                  value={witness.panNumber || ''}
                  onChange={(e) => handleWitnessChange(index, 'panNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date of Birth"
                  InputLabelProps={{ shrink: true }}
                  value={witness.dateOfBirth || ''}
                  onChange={(e) => handleWitnessChange(index, 'dateOfBirth', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Son of"
                  value={witness.sonOf || ''}
                  onChange={(e) => handleWitnessChange(index, 'sonOf', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Daughter of"
                  value={witness.daughterOf || ''}
                  onChange={(e) => handleWitnessChange(index, 'daughterOf', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Wife of"
                  value={witness.wifeOf || ''}
                  onChange={(e) => handleWitnessChange(index, 'wifeOf', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  value={witness.address || ''}
                  onChange={(e) => handleWitnessChange(index, 'address', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Witness Documents
                </Typography>
                <Grid container spacing={2}>
                  {['aadharFront', 'aadharBack', 'panCard', 'passportPhoto', 'fullPhoto'].map((docType) => (
                    <Grid item xs={12} sm={6} md={2.4} key={docType}>
                      <Button
                        fullWidth
                        component="label"
                        variant="outlined"
                        startIcon={
                          (witness.documents && witness.documents[docType]) ? (
                            <Box
                              component="img"
                              src={
                                witness.documents[docType] instanceof File
                                  ? URL.createObjectURL(witness.documents[docType])
                                  : witness.documents[docType]
                              }
                              sx={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <CloudUpload />
                          )
                        }
                        sx={{
                          height: '56px',
                          textTransform: 'none',
                          borderColor: (witness.documents && witness.documents[docType]) ? 'success.main' : 'inherit',
                          color: (witness.documents && witness.documents[docType]) ? 'success.main' : 'inherit',
                        }}
                      >
                        {docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => handleWitnessFileChange(index, docType, e.target.files[0])}
                        />
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Box>
        ))
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          No witnesses added yet. Click "Add Witness" to add company witnesses.
        </Alert>
      )}

      <Box mt={3}>
        <Button
          variant="contained"
          onClick={() => handleSaveSettings('company')}
          disabled={loading}
        >
          Save Company Witnesses
        </Button>
      </Box>
    </Paper>
  )

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Settings
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Company" />
          <Tab label="System" />
          <Tab label="Payment" />
          <Tab label="Company Witness" />
        </Tabs>
      </Paper>

      {activeTab === 0 && renderCompanySettings()}
      {activeTab === 1 && renderSystemSettings()}
      {activeTab === 2 && renderPaymentSettings()}
      {activeTab === 3 && renderWitnessSettings()}
    </Box>
  )
}

export default Settings
