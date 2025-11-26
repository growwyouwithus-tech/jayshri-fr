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
} from '@mui/material'
import { Add, Delete, Payment as PaymentIcon, Save, Clear } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const PAYMENT_MODES = ['CASH', 'CHEQUE', 'ONLINE', 'UPI', 'BANK TRANSFER']
const TRANSACTION_TYPES = ['DEPOSITED', 'WITHDRAWN', 'PENDING']

const KisanPaymentManagement = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // Add Payment Form State
  const [newPayment, setNewPayment] = useState({
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
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/kisan-payments')
      setPayments(response.data.data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalAmount = () => {
    return payments.reduce((total, payment) => {
      const amount = parseFloat(payment.paidAmount) || 0
      return total + amount
    }, 0)
  }

  const handleAddPayment = async () => {
    console.log('handleAddPayment called')
    console.log('newPayment:', newPayment)
    
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
        paidAmount: parseFloat(newPayment.paidAmount),
      }
      
      console.log('Sending payload:', payload)
      const response = await axios.post('/kisan-payments', payload)
      console.log('Response:', response)
      
      toast.success('Payment added successfully')
      setShowAddForm(false)
      resetAddForm()
      fetchPayments()
    } catch (error) {
      console.error('Error adding payment:', error)
      console.error('Error response:', error.response)
      toast.error(error.response?.data?.message || error.message || 'Failed to add payment')
    }
  }


  const resetAddForm = () => {
    setNewPayment({
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
          <Chip 
            label={`Total Amount: ₹${calculateTotalAmount().toLocaleString('en-IN')}`}
            color="primary"
            sx={{ fontSize: '1.1rem', padding: '20px 10px' }}
          />
          <Button
            variant="contained"
            startIcon={showAddForm ? <Clear /> : <Add />}
            onClick={() => {
              setShowAddForm(!showAddForm)
              if (!showAddForm) resetAddForm()
            }}
          >
            {showAddForm ? 'Cancel' : 'Add Payment'}
          </Button>
        </Box>
      </Box>

      {/* Add Payment Form */}
      {showAddForm && (
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
              <Grid item xs={12} md={6}>
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
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" py={3}>
                    No payments found. Click "Add Payment" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default KisanPaymentManagement
