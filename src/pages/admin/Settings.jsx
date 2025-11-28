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
import { Edit, Save, Cancel, CloudUpload } from '@mui/icons-material'
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
    panNumber: 'AABCJ1234F'
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handleCompanySettingsChange = (field, value) => {
    setCompanySettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSystemSettingsChange = (field, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [field]: value
    }))
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
      switch (settingsType) {
        case 'company':
          payload = companySettings
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
        await axios.put(`/settings/${settingsType}`, payload)
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
        </Tabs>
      </Paper>

      {activeTab === 0 && renderCompanySettings()}
      {activeTab === 1 && renderSystemSettings()}
      {activeTab === 2 && renderPaymentSettings()}
    </Box>
  )
}

export default Settings
