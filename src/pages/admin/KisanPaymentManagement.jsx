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
} from '@mui/material'
import { Add, Delete, Payment as PaymentIcon, Save, Clear } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const PAYMENT_MODES = ['CASH', 'CHEQUE', 'ONLINE', 'UPI', 'BANK TRANSFER']
const TRANSACTION_TYPES = ['DEPOSITED', 'WITHDRAWN', 'PENDING']

const KisanPaymentManagement = () => {
  const [payments, setPayments] = useState([])
  const [colonies, setColonies] = useState([])
  const [selectedColony, setSelectedColony] = useState('')
  const [selectedColonyData, setSelectedColonyData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // Add Payment Form State
  const [newPayment, setNewPayment] = useState({
    colony: '',
    dateTime: new Date().toLocaleString('en-IN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false 
    }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+)/, '$3-$2-$1T$4:$5'),
    paidAmount: '',
    paymentMode: 'CASH',
    hintsInWord: '',
  })


  useEffect(() => {
    fetchColonies()
  }, [])

  useEffect(() => {
    if (selectedColony) {
      fetchPayments(selectedColony)
      fetchColonyData(selectedColony)
    }
  }, [selectedColony])

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

  const fetchColonyData = async (colonyId) => {
    try {
      const response = await axios.get(`/colonies/${colonyId}`)
      console.log('Colony data response:', response.data)
      // Backend returns { success: true, data: { colony: {...} } }
      const colonyData = response.data?.data?.colony || response.data?.data || null
      console.log('Extracted colony data:', colonyData)
      console.log('Purchase Price:', colonyData?.purchasePrice)
      setSelectedColonyData(colonyData)
    } catch (error) {
      console.error('Error fetching colony data:', error)
      toast.error('Failed to fetch colony details')
    }
  }

  const fetchPayments = async (colonyId) => {
    setLoading(true)
    try {
      const response = await axios.get('/kisan-payments', {
        params: { colony: colonyId }
      })
      setPayments(response.data.data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalPaid = () => {
    return payments.reduce((total, payment) => {
      const amount = parseFloat(payment.paidAmount) || 0
      return total + amount
    }, 0)
  }

  const calculateRemaining = () => {
    const purchasePrice = selectedColonyData?.purchasePrice || 0
    const totalPaid = calculateTotalPaid()
    return purchasePrice - totalPaid
  }

  const handleAddPayment = async () => {
    if (!selectedColony) {
      toast.error('Please select a colony first')
      return
    }
    
    if (!newPayment.paidAmount) {
      toast.error('Please fill Paid Amount')
      return
    }
    
    if (!newPayment.dateTime) {
      toast.error('Please select Date & Time')
      return
    }

    try {
      const payload = {
        ...newPayment,
        colony: selectedColony,
        paidAmount: parseFloat(newPayment.paidAmount),
      }
      
      const response = await axios.post('/kisan-payments', payload)
      
      toast.success('Payment added successfully')
      setShowAddForm(false)
      resetAddForm()
      fetchPayments(selectedColony)
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to add payment')
    }
  }


  const resetAddForm = () => {
    setNewPayment({
      colony: selectedColony,
      dateTime: new Date().toLocaleString('en-IN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
      }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+)/, '$3-$2-$1T$4:$5'),
      paidAmount: '',
      paymentMode: 'CASH',
      hintsInWord: '',
    })
  }


  const formatDateTime = (dateTime) => {
    if (!dateTime) return ''
    const date = new Date(dateTime)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
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
          Kisan to Company Payment Mode
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={showAddForm ? <Clear /> : <Add />}
            onClick={() => {
              if (!selectedColony) {
                toast.error('Please select a colony first')
                return
              }
              setShowAddForm(!showAddForm)
              if (!showAddForm) resetAddForm()
            }}
            disabled={!selectedColony}
          >
            {showAddForm ? 'Cancel' : 'Add Payment'}
          </Button>
        </Box>
      </Box>

      {/* Colony Selection */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Colony</InputLabel>
                <Select
                  value={selectedColony}
                  label="Select Colony"
                  onChange={(e) => {
                    setSelectedColony(e.target.value)
                    setPayments([])
                    setShowAddForm(false)
                  }}
                >
                  <MenuItem value="">
                    <em>-- Select Colony --</em>
                  </MenuItem>
                  {colonies.map((colony) => (
                    <MenuItem key={colony._id} value={colony._id}>
                      {colony.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {selectedColonyData && (
              <Grid item xs={12} md={6}>
                {!selectedColonyData.purchasePrice && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    This colony doesn't have a purchase price set. Please edit the colony to add the purchase price.
                  </Alert>
                )}
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip 
                    label={`Purchase Price: ₹${(selectedColonyData.purchasePrice || 0).toLocaleString('en-IN')}`}
                    color={selectedColonyData.purchasePrice ? "primary" : "default"}
                    sx={{ fontSize: '1rem', padding: '20px 10px' }}
                  />
                  {/* <Chip 
                    label={`Total Paid: ₹${calculateTotalPaid().toLocaleString('en-IN')}`}
                    color="success"
                    sx={{ fontSize: '1rem', padding: '20px 10px' }}
                  />
                  <Chip 
                    label={`Remaining: ₹${calculateRemaining().toLocaleString('en-IN')}`}
                    color={calculateRemaining() > 0 ? 'warning' : 'success'}
                    sx={{ fontSize: '1rem', padding: '20px 10px' }}
                  /> */}
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {!selectedColony && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select a colony to view and manage payments.
        </Alert>
      )}

      {/* Add Payment Form */}
      {showAddForm && selectedColony && (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Add New Payment
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date & Time"
                  type="datetime-local"
                  value={newPayment.dateTime}
                  onChange={(e) => setNewPayment({ ...newPayment, dateTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Paid Amount"
                  type="number"
                  value={newPayment.paidAmount}
                  onChange={(e) => setNewPayment({ ...newPayment, paidAmount: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Payment Mode"
                  value={newPayment.paymentMode}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentMode: e.target.value })}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Hints in Words"
                  value={newPayment.hintsInWord}
                  onChange={(e) => setNewPayment({ ...newPayment, hintsInWord: e.target.value })}
                  placeholder="e.g., IN ROOM"
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setShowAddForm(false)
                      resetAddForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<Save />}
                    onClick={() => {
                      console.log('Save Payment button clicked!')
                      handleAddPayment()
                    }}
                    disabled={!newPayment.paidAmount}
                  >
                    Save Payment
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {selectedColony && (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#2e7d32' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>S.R. NO.</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>DATE & TIME</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>PAID AMOUNT</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>PAYMENT MODE</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>HINTS IN WORDS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment, index) => (
                <TableRow key={payment._id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{formatDateTime(payment.dateTime)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{parseFloat(payment.paidAmount || 0).toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={payment.paymentMode} size="small" color="info" />
                  </TableCell>
                  <TableCell>{payment.hintsInWord || '-'}</TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      No payments found. Click "Add Payment" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {/* Summary Row - Always show when colony is selected */}
              {selectedColonyData && (
                <TableRow sx={{ backgroundColor: '#e8f5e9', borderTop: '2px solid #4caf50' }}>
                  <TableCell colSpan={6}>
                    <Box display="flex" justifyContent="space-around" alignItems="center" py={1}>
                      <Box textAlign="center">
                        <Typography variant="caption" color="text.secondary">
                          Colony Purchase Price
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          ₹{(selectedColonyData.purchasePrice || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                      <Typography variant="h5" color="text.secondary">-</Typography>
                      <Box textAlign="center">
                        <Typography variant="caption" color="text.secondary">
                          Total Paid
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          ₹{calculateTotalPaid().toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                      <Typography variant="h5" color="text.secondary">=</Typography>
                      <Box textAlign="center">
                        <Typography variant="caption" color="text.secondary">
                          Remaining
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color={calculateRemaining() > 0 ? 'error.main' : 'success.main'}>
                          ₹{calculateRemaining().toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
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
