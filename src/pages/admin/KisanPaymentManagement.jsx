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
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)

  // Add Payment Form State
  const [newPayment, setNewPayment] = useState({
    dateTime: new Date().toISOString().slice(0, 16), // Set current datetime
    advanceAmount: '',
    advanceAmountInWord: '',
    paymentMode: 'CASH',
    transaction: 'DEPOSITED',
    hintsInWord: '',
  })

  // Payment Mode Form State
  const [paymentDetails, setPaymentDetails] = useState({
    chequeNumber: '',
    bankName: '',
    chequeDate: '',
    upiId: '',
    transactionId: '',
    accountNumber: '',
    ifscCode: '',
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
      const amount = parseFloat(payment.advanceAmount) || 0
      return payment.transaction === 'DEPOSITED' ? total + amount : total - amount
    }, 0)
  }

  const handleAddPayment = async () => {
    console.log('handleAddPayment called')
    console.log('newPayment:', newPayment)
    
    if (!newPayment.advanceAmount || !newPayment.advanceAmountInWord) {
      toast.error('Please fill Advance Amount and Amount in Words')
      return
    }
    
    if (!newPayment.dateTime) {
      toast.error('Please select Date & Time')
      return
    }

    try {
      const payload = {
        ...newPayment,
        advanceAmount: parseFloat(newPayment.advanceAmount),
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

  const handleUpdatePayment = async () => {
    try {
      await axios.put(`/kisan-payments/${selectedPayment._id}`, paymentDetails)
      toast.success('Payment details updated successfully')
      setShowPaymentForm(false)
      setSelectedPayment(null)
      resetPaymentForm()
      fetchPayments()
    } catch (error) {
      console.error('Error updating payment:', error)
      toast.error(error.response?.data?.message || 'Failed to update payment')
    }
  }

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return
    
    try {
      await axios.delete(`/kisan-payments/${id}`)
      toast.success('Payment deleted successfully')
      fetchPayments()
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast.error('Failed to delete payment')
    }
  }

  const openPaymentForm = (payment) => {
    setSelectedPayment(payment)
    setPaymentDetails({
      chequeNumber: payment.chequeNumber || '',
      bankName: payment.bankName || '',
      chequeDate: payment.chequeDate || '',
      upiId: payment.upiId || '',
      transactionId: payment.transactionId || '',
      accountNumber: payment.accountNumber || '',
      ifscCode: payment.ifscCode || '',
    })
    setShowPaymentForm(true)
    setShowAddForm(false)
  }

  const resetAddForm = () => {
    setNewPayment({
      dateTime: new Date().toISOString().slice(0, 16), // Reset to current datetime
      advanceAmount: '',
      advanceAmountInWord: '',
      paymentMode: 'CASH',
      transaction: 'DEPOSITED',
      hintsInWord: '',
    })
  }

  const resetPaymentForm = () => {
    setPaymentDetails({
      chequeNumber: '',
      bankName: '',
      chequeDate: '',
      upiId: '',
      transactionId: '',
      accountNumber: '',
      ifscCode: '',
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

  const getTransactionColor = (transaction) => {
    switch (transaction) {
      case 'DEPOSITED':
        return 'success'
      case 'WITHDRAWN':
        return 'error'
      case 'PENDING':
        return 'warning'
      default:
        return 'default'
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
              setShowPaymentForm(false)
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
                  label="Advance Amount"
                  type="number"
                  value={newPayment.advanceAmount}
                  onChange={(e) => setNewPayment({ ...newPayment, advanceAmount: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Advance Amount in Words"
                  value={newPayment.advanceAmountInWord}
                  onChange={(e) => setNewPayment({ ...newPayment, advanceAmountInWord: e.target.value })}
                  placeholder="e.g., TEN LAC"
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
                  select
                  label="Transaction Type"
                  value={newPayment.transaction}
                  onChange={(e) => setNewPayment({ ...newPayment, transaction: e.target.value })}
                >
                  {TRANSACTION_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Hints in Word"
                  value={newPayment.hintsInWord}
                  onChange={(e) => setNewPayment({ ...newPayment, hintsInWord: e.target.value })}
                  placeholder="e.g., IN ROOM"
                  multiline
                  rows={2}
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
                    disabled={!newPayment.advanceAmount || !newPayment.advanceAmountInWord}
                  >
                    Save Payment
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Payment Details Form */}
      {showPaymentForm && selectedPayment && (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Payment Details - {selectedPayment.paymentMode}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {selectedPayment.paymentMode === 'CHEQUE' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Cheque Number"
                      value={paymentDetails.chequeNumber}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, chequeNumber: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Bank Name"
                      value={paymentDetails.bankName}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Cheque Date"
                      type="date"
                      value={paymentDetails.chequeDate}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, chequeDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}
              {selectedPayment.paymentMode === 'UPI' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="UPI ID"
                      value={paymentDetails.upiId}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Transaction ID"
                      value={paymentDetails.transactionId}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                    />
                  </Grid>
                </>
              )}
              {(selectedPayment.paymentMode === 'ONLINE' || selectedPayment.paymentMode === 'BANK TRANSFER') && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Account Number"
                      value={paymentDetails.accountNumber}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="IFSC Code"
                      value={paymentDetails.ifscCode}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, ifscCode: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Bank Name"
                      value={paymentDetails.bankName}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Transaction ID"
                      value={paymentDetails.transactionId}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                    />
                  </Grid>
                </>
              )}
              {selectedPayment.paymentMode === 'CASH' && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" align="center" py={3}>
                    No additional details required for cash payment
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setShowPaymentForm(false)
                      setSelectedPayment(null)
                      resetPaymentForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<Save />}
                    onClick={handleUpdatePayment}
                  >
                    Save Details
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
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>DATE & TIME OF PAYMENT</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ADVANCE AMOUNT IN WORD</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>PAYMENT MODE</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>TRANSACTION</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>HINTS IN WORD</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">TOTAL AMOUNT</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment, index) => {
              const runningTotal = payments.slice(0, index + 1).reduce((total, p) => {
                const amount = parseFloat(p.advanceAmount) || 0
                return p.transaction === 'DEPOSITED' ? total + amount : total - amount
              }, 0)

              return (
                <TableRow key={payment._id} hover>
                  <TableCell>{formatDateTime(payment.dateTime)}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{parseFloat(payment.advanceAmount).toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payment.advanceAmountInWord}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={payment.paymentMode} size="small" color="info" />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={payment.transaction} 
                      size="small" 
                      color={getTransactionColor(payment.transaction)}
                    />
                  </TableCell>
                  <TableCell>{payment.hintsInWord}</TableCell>
                  <TableCell align="right">
                    <Typography 
                      fontWeight="bold" 
                      color={runningTotal >= 0 ? 'success.main' : 'error.main'}
                    >
                      ₹{runningTotal.toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => openPaymentForm(payment)}
                      title="Add Payment Details"
                    >
                      <PaymentIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeletePayment(payment._id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
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
