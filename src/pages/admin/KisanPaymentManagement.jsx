import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Autocomplete,
} from '@mui/material'
import { Add, Delete, Payment as PaymentIcon, Save, Clear, Edit, AttachFile, Visibility } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const PAYMENT_TYPES = ['CASH', 'BY CHEQUE', 'BY BANK TRANSFER']

const KisanPaymentManagement = () => {
  const [payments, setPayments] = useState([])
  const [properties, setProperties] = useState([])
  const [colonies, setColonies] = useState([])
  const [plots, setPlots] = useState([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedPropertyData, setSelectedPropertyData] = useState(null)
  const [selectedColonyData, setSelectedColonyData] = useState(null)
  const [selectedPlot, setSelectedPlot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)

  // Add/Edit Payment Form State
  const [newPayment, setNewPayment] = useState({
    property: '',
    colony: '',
    paymentType: 'CASH',
    rupees: '',
    rupeesInWords: '',
    regPlotNo: '',
    gaj: '',
    remark: '',
    remainingLand: '',
    chequeNumber: '',
    transactionId: '',
    voucherNo: '',
    photoFile: null,
  })


  useEffect(() => {
    fetchProperties()
    fetchColonies()
  }, [])

  useEffect(() => {
    if (selectedProperty) {
      fetchPayments(selectedProperty)
      fetchPropertyData(selectedProperty)
      fetchPlots(selectedProperty)
    }
  }, [selectedProperty])

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/properties?populate=colonyId')
      const propertiesData = response.data?.data?.properties || response.data?.data || []
      setProperties(propertiesData)
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast.error('Failed to fetch properties')
    }
  }

  const fetchColonies = async () => {
    try {
      const response = await axios.get('/colonies')
      const coloniesData = response.data?.data?.colonies || []
      setColonies(coloniesData)
    } catch (error) {
      console.error('Error fetching colonies:', error)
      toast.error('Failed to fetch colonies')
    }
  }

  const fetchPropertyData = async (propertyId) => {
    try {
      const response = await axios.get(`/properties/${propertyId}`)
      const propertyData = response.data?.data?.property || response.data?.data || null
      setSelectedPropertyData(propertyData)
      
      if (propertyData?.colonyId || propertyData?.colony) {
        const colonyId = propertyData.colonyId?._id || propertyData.colonyId || propertyData.colony?._id || propertyData.colony
        fetchColonyData(colonyId)
      }
    } catch (error) {
      console.error('Error fetching property data:', error)
      toast.error('Failed to fetch property details')
    }
  }

  const fetchColonyData = async (colonyId) => {
    try {
      const response = await axios.get(`/colonies/${colonyId}`)
      const colonyData = response.data?.data?.colony || response.data?.data || null
      setSelectedColonyData(colonyData)
    } catch (error) {
      console.error('Error fetching colony data:', error)
      toast.error('Failed to fetch colony details')
    }
  }

  const fetchPayments = async (propertyId) => {
    setLoading(true)
    try {
      const response = await axios.get('/kisan-payments', {
        params: { property: propertyId }
      })
      const paymentsData = response.data.data || []
      // Sort by creation date in ascending order (oldest first)
      const sortedPayments = paymentsData.sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
      setPayments(sortedPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlots = async (propertyId) => {
    try {
      const response = await axios.get('/plots', {
        params: { property: propertyId }
      })
      const plotsData = response.data?.data?.plots || response.data?.data || []
      setPlots(plotsData)
    } catch (error) {
      console.error('Error fetching plots:', error)
      toast.error('Failed to fetch plots')
    }
  }

  const calculateTotalPlots = () => {
    return payments.length
  }

  const calculateTotalGaj = () => {
    return payments.reduce((total, payment) => {
      const gaj = parseFloat(payment.gaj) || 0
      return total + gaj
    }, 0)
  }

  const calculateTotalRupees = () => {
    return payments.reduce((total, payment) => {
      const rupees = parseFloat(payment.rupees) || 0
      return total + rupees
    }, 0)
  }

  const calculateTotalRemaining = () => {
    if (payments.length === 0) return 0
    return payments[payments.length - 1]?.remainingLand || 0
  }

  const calculateRemainingLand = () => {
    const totalLand = selectedPropertyData?.totalLandAreaGaj || 0
    const usedLand = calculateUsedLand()
    return totalLand - usedLand
  }

  const calculateRemainingLandForPayment = (currentIndex) => {
    const initialRemaining = calculateRemainingLand()
    let remaining = initialRemaining
    
    // Subtract gaj from all previous payments
    for (let i = 0; i <= currentIndex; i++) {
      const gaj = parseFloat(payments[i]?.gaj) || 0
      remaining -= gaj
    }
    
    return remaining
  }

  const calculateUsedLand = () => {
    let usedLand = 0
    if (selectedPropertyData?.roads && Array.isArray(selectedPropertyData.roads)) {
      selectedPropertyData.roads.forEach(road => {
        const lengthFt = parseFloat(road.lengthFt) || 0
        const widthFt = parseFloat(road.widthFt) || 0
        usedLand += (lengthFt * widthFt) / 9
      })
    }
    if (selectedPropertyData?.parks && Array.isArray(selectedPropertyData.parks)) {
      selectedPropertyData.parks.forEach(park => {
        usedLand += parseFloat(park.areaGaj) || 0
      })
    }
    return usedLand
  }


  const calculatePerGajPrice = () => {
    const purchasePrice = selectedColonyData?.purchasePrice || 0
    const remainingLand = calculateRemainingLand()
    if (remainingLand <= 0) return 0
    return purchasePrice / remainingLand
  }

  const handleAddPayment = async () => {
    if (!selectedProperty) {
      toast.error('Please select a property first')
      return
    }
    
    if (!newPayment.rupees) {
      toast.error('Please fill Rupees amount')
      return
    }

    try {
      const colonyId = selectedPropertyData?.colonyId?._id || selectedPropertyData?.colonyId || selectedPropertyData?.colony?._id || selectedPropertyData?.colony
      
      // Calculate remaining land based on current payments
      const currentRemaining = calculateRemainingLand()
      const totalGajUsed = calculateTotalGaj() + (parseFloat(newPayment.gaj) || 0)
      const newRemainingLand = currentRemaining - totalGajUsed
      
      const formData = new FormData()
      formData.append('property', selectedProperty)
      formData.append('colony', colonyId)
      formData.append('paymentType', newPayment.paymentType)
      formData.append('rupees', parseFloat(newPayment.rupees))
      formData.append('rupeesInWords', newPayment.rupeesInWords)
      formData.append('regPlotNo', newPayment.regPlotNo)
      formData.append('gaj', parseFloat(newPayment.gaj) || 0)
      formData.append('remark', newPayment.remark)
      formData.append('remainingLand', newRemainingLand)
      formData.append('chequeNumber', newPayment.paymentType === 'BY CHEQUE' ? newPayment.chequeNumber : '')
      formData.append('transactionId', newPayment.paymentType === 'BY BANK TRANSFER' ? newPayment.transactionId : '')
      formData.append('voucherNo', newPayment.voucherNo || '')
      if (newPayment.photoFile) {
        formData.append('photoFile', newPayment.photoFile)
      }
      
      if (editMode && editingPayment) {
        await axios.put(`/kisan-payments/${editingPayment._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Payment updated successfully')
      } else {
        await axios.post('/kisan-payments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Payment added successfully')
      }
      
      setShowAddForm(false)
      setEditMode(false)
      setEditingPayment(null)
      resetAddForm()
      fetchPayments(selectedProperty)
    } catch (error) {
      console.error('Error saving payment:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to save payment')
    }
  }

  const handleEditPayment = (payment) => {
    setEditMode(true)
    setEditingPayment(payment)
    
    // Find the plot if regPlotNo exists
    const plot = plots.find(p => p.plotNumber === payment.regPlotNo)
    setSelectedPlot(plot || null)
    
    setNewPayment({
      property: payment.property?._id || payment.property,
      colony: payment.colony?._id || payment.colony,
      paymentType: payment.paymentType,
      rupees: payment.rupees,
      rupeesInWords: payment.rupeesInWords,
      regPlotNo: payment.regPlotNo,
      gaj: payment.gaj,
      remark: payment.remark,
      remainingLand: payment.remainingLand,
      chequeNumber: payment.chequeNumber || '',
      transactionId: payment.transactionId || '',
      voucherNo: payment.voucherNo || '',
      photoFile: null,
    })
    
    setShowAddForm(true)
  }

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return
    }
    
    try {
      await axios.delete(`/kisan-payments/${paymentId}`)
      toast.success('Payment deleted successfully')
      fetchPayments(selectedProperty)
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast.error('Failed to delete payment')
    }
  }


  const resetAddForm = () => {
    setSelectedPlot(null)
    setNewPayment({
      property: selectedProperty,
      colony: '',
      paymentType: 'CASH',
      rupees: '',
      rupeesInWords: '',
      regPlotNo: '',
      gaj: '',
      remark: '',
      remainingLand: '',
      chequeNumber: '',
      transactionId: '',
      voucherNo: '',
      photoFile: null,
    })
  }

  const handlePlotSelect = (event, value) => {
    setSelectedPlot(value)
    if (value) {
      // Auto-fill Gaj and Reg. Plot No when plot is selected
      setNewPayment({
        ...newPayment,
        regPlotNo: value.plotNumber || '',
        gaj: value.areaGaj || value.area || '',
      })
    } else {
      // Clear fields if no plot selected
      setNewPayment({
        ...newPayment,
        regPlotNo: '',
        gaj: '',
      })
    }
  }




  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Kisan Payment Management
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={showAddForm ? <Clear /> : <Add />}
            onClick={() => {
              if (!selectedProperty) {
                toast.error('Please select a property first')
                return
              }
              setShowAddForm(!showAddForm)
              setEditMode(false)
              setEditingPayment(null)
              if (!showAddForm) resetAddForm()
            }}
            disabled={!selectedProperty}
          >
            {showAddForm ? 'Cancel' : 'Add Payment'}
          </Button>
        </Box>
      </Box>

      {/* Property Selection */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Property</InputLabel>
                <Select
                  value={selectedProperty}
                  label="Select Property"
                  onChange={(e) => {
                    setSelectedProperty(e.target.value)
                    setPayments([])
                    setShowAddForm(false)
                    setEditMode(false)
                    setEditingPayment(null)
                    setSelectedPlot(null)
                  }}
                >
                  <MenuItem value="">
                    <em>-- Select Property --</em>
                  </MenuItem>
                  {properties.map((property) => (
                    <MenuItem key={property._id} value={property._id}>
                      {property.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Top Summary Section */}
      {selectedProperty && selectedPropertyData && selectedColonyData && (
        <Card sx={{ mb: 3, boxShadow: 3, backgroundColor: '#f5f5f5' }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Remaining Land</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {calculateRemainingLand().toFixed(2)} Gaj
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Purchase Price</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  ₹{(selectedColonyData.purchasePrice || 0).toLocaleString('en-IN')}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Per Gaj Price</Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  ₹{calculatePerGajPrice().toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Total Land</Typography>
                <Typography variant="h5" fontWeight="bold">
                  {(selectedPropertyData.totalLandAreaGaj || 0).toFixed(2)} Gaj
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {!selectedProperty && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select a property to view and manage payments.
        </Alert>
      )}

      {/* Add/Edit Payment Form */}
      {showAddForm && selectedProperty && (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              {editMode ? 'Edit Payment' : 'Add New Payment'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Payment Type"
                  value={newPayment.paymentType}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentType: e.target.value })}
                  required
                >
                  {PAYMENT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Rupees"
                  type="number"
                  value={newPayment.rupees}
                  onChange={(e) => setNewPayment({ ...newPayment, rupees: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Rupees in Words"
                  value={newPayment.rupeesInWords}
                  onChange={(e) => setNewPayment({ ...newPayment, rupeesInWords: e.target.value })}
                  placeholder="e.g., One Lakh Only"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  fullWidth
                  options={plots}
                  value={selectedPlot}
                  onChange={handlePlotSelect}
                  getOptionLabel={(option) => option.plotNumber || ''}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {option.plotNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.areaGaj || option.area} Gaj | Status: {option.status}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Plot"
                      placeholder="Search plot number..."
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Gaj"
                  type="number"
                  value={newPayment.gaj}
                  onChange={(e) => setNewPayment({ ...newPayment, gaj: e.target.value })}
                  helperText="Auto-filled when plot is selected"
                />
              </Grid>
              {/* Conditional Fields based on Payment Type */}
              {newPayment.paymentType === 'BY CHEQUE' && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Enter Cheque Number"
                    value={newPayment.chequeNumber}
                    onChange={(e) => setNewPayment({ ...newPayment, chequeNumber: e.target.value })}
                    required
                  />
                </Grid>
              )}
              {newPayment.paymentType === 'BY BANK TRANSFER' && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Enter Transaction ID"
                    value={newPayment.transactionId}
                    onChange={(e) => setNewPayment({ ...newPayment, transactionId: e.target.value })}
                    required
                  />
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Voucher No (Optional)"
                  value={newPayment.voucherNo}
                  onChange={(e) => setNewPayment({ ...newPayment, voucherNo: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  component="label"
                  startIcon={<AttachFile />}
                  sx={{ height: '56px' }}
                >
                  {newPayment.photoFile ? newPayment.photoFile.name : 'Upload Photo (Optional)'}
                  <input
                    type="file"
                    hidden
                    accept="image/*,.pdf"
                    onChange={(e) => setNewPayment({ ...newPayment, photoFile: e.target.files[0] })}
                  />
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Remark"
                  value={newPayment.remark}
                  onChange={(e) => setNewPayment({ ...newPayment, remark: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setShowAddForm(false)
                      setEditMode(false)
                      setEditingPayment(null)
                      resetAddForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<Save />}
                    onClick={handleAddPayment}
                    disabled={!newPayment.rupees}
                  >
                    {editMode ? 'Update Payment' : 'Save Payment'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {selectedProperty && (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table sx={{ '& td, & th': { border: '1px solid #000' } }}>
            <TableHead sx={{ backgroundColor: '#2e7d32' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>SN</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>PAYMENT TYPE</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>RUPEES</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>RUPEES IN WORDS</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>REG. PLOT NO</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>GAJ</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>CHEQUE NO</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>TRANSACTION ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>VOUCHER NO</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>PHOTO</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>REMARK</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>REMAINING LAND</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment, index) => {
                const remainingForThisRow = calculateRemainingLandForPayment(index)
                return (
                  <TableRow key={payment._id} hover>
                    <TableCell sx={{ border: '1px solid #000' }}>{index + 1}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>
                      <Chip label={payment.paymentType} size="small" color="primary" />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{parseFloat(payment.rupees || 0).toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{payment.rupeesInWords || '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{payment.regPlotNo || '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{payment.gaj || 0}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{payment.chequeNumber || '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{payment.transactionId || '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{payment.voucherNo || '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>
                      {payment.photoUrl ? (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => window.open(`${axios.defaults.baseURL}${payment.photoUrl}`, '_blank')}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      ) : '-'}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{payment.remark || '-'}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {remainingForThisRow.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>
                      <Box display="flex" gap={1}>
                        <IconButton size="small" color="primary" onClick={() => handleEditPayment(payment)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeletePayment(payment._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ border: '1px solid #000' }}>
                    <Typography variant="body2" color="text.secondary" py={3}>
                      No payments found. Click "Add Payment" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {/* Totals Row */}
              {payments.length > 0 && (
                <TableRow sx={{ backgroundColor: '#e3f2fd', borderTop: '2px solid #2196f3' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '1rem', border: '1px solid #000' }}>
                    TOTAL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', border: '1px solid #000' }}>
                    <Typography variant="body1" fontWeight="bold">
                      ₹{calculateTotalRupees().toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', border: '1px solid #000' }}>
                    Total Plots: {calculateTotalPlots()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', border: '1px solid #000' }}>
                    {calculateTotalGaj().toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'success.main', border: '1px solid #000' }}>
                    {calculateRemainingLandForPayment(payments.length - 1).toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default KisanPaymentManagement
