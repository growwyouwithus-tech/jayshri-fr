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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  MenuItem
} from '@mui/material'
import { CheckCircle, Payment } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { deriveCommissionsFromBookings } from '@/utils/commissionUtils'

const CommissionManagement = () => {
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedCommission, setSelectedCommission] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [actionType, setActionType] = useState('')
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'bank_transfer',
    transactionId: '',
    remarks: ''
  })

  useEffect(() => {
    fetchCommissions()
  }, [])

  const fetchCommissions = async (status = '') => {
    try {
      setLoading(true)
      const { data } = await axios.get('/bookings')
      const bookings = Array.isArray(data?.data) ? data.data : data?.data?.bookings || []
      const derived = deriveCommissionsFromBookings(bookings)
      const filtered = status ? derived.filter((c) => c.status === status) : derived
      setCommissions(filtered)
      setLoading(false)
    } catch (error) {
      console.error('Failed to derive commissions:', error)
      toast.error('Failed to load commissions')
      setCommissions([])
      setLoading(false)
    }
  }

  const handleFilterChange = (status) => {
    setFilterStatus(status)
    fetchCommissions(status)
  }

  const handleOpenDialog = (commission, action) => {
    setSelectedCommission(commission)
    setActionType(action)
    setPaymentData({
      paymentMethod: 'bank_transfer',
      transactionId: '',
      remarks: ''
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedCommission(null)
  }

  const handleApprove = async () => {
    try {
      await axios.put(`/commissions/${selectedCommission._id}/approve`)
      toast.success('Commission approved successfully')
      handleCloseDialog()
      fetchCommissions(filterStatus)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed')
    }
  }

  const handleMarkAsPaid = async () => {
    try {
      await axios.put(`/commissions/${selectedCommission._id}/pay`, paymentData)
      toast.success('Commission marked as paid')
      handleCloseDialog()
      fetchCommissions(filterStatus)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment update failed')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'info',
      paid: 'success',
      on_hold: 'default',
      rejected: 'error'
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Commission Management
        </Typography>
        <TextField
          select
          size="small"
          label="Filter by Status"
          value={filterStatus}
          onChange={(e) => handleFilterChange(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Commissions</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ '& td, & th': { border: '1px solid #000' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Agent</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Booking #</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Sale Amount</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Rate (%)</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Commission</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>TDS</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Final Amount</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Status</TableCell>
              <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No commissions found.
                </TableCell>
              </TableRow>
            ) : (
              commissions.map((commission) => (
                <TableRow key={commission._id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {commission.agent?.name || 'Unknown Agent'}
                      </Typography>
                      {commission.agent?.email && (
                        <Typography variant="caption" color="text.secondary">
                          {commission.agent.email}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {commission.bookingNumber || 'N/A'}
                      </Typography>
                      {commission.createdAt && (
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(commission.createdAt), 'dd MMM yyyy')}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>₹{commission.saleAmount?.toLocaleString()}</TableCell>
                  <TableCell>{commission.commissionRate}%</TableCell>
                  <TableCell>₹{commission.commissionAmount?.toLocaleString()}</TableCell>
                  <TableCell>₹{commission.tdsAmount?.toLocaleString()}</TableCell>
                  <TableCell><strong>₹{commission.finalAmount?.toLocaleString()}</strong></TableCell>
                  <TableCell>
                    <Chip
                      label={commission.status?.toUpperCase()}
                      color={getStatusColor(commission.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {commission.status === 'pending' && (
                      <Button
                        size="small"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleOpenDialog(commission, 'approve')}
                      >
                        Approve
                      </Button>
                    )}
                    {commission.status === 'approved' && (
                      <Button
                        size="small"
                        color="primary"
                        startIcon={<Payment />}
                        onClick={() => handleOpenDialog(commission, 'pay')}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Commission' : 'Mark Commission as Paid'}
        </DialogTitle>
        <DialogContent>
          {selectedCommission && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Agent:</strong> {selectedCommission.agentId?.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Booking:</strong> {selectedCommission.bookingId?.bookingNumber}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Final Amount:</strong> ₹{selectedCommission.finalAmount?.toLocaleString()}
              </Typography>

              {actionType === 'pay' && (
                <>
                  <TextField
                    fullWidth
                    select
                    label="Payment Method"
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                    sx={{ mt: 2 }}
                  >
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="cheque">Cheque</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="upi">UPI</MenuItem>
                  </TextField>
                  <TextField
                    fullWidth
                    label="Transaction ID"
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                    sx={{ mt: 2 }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Remarks (Optional)"
                    value={paymentData.remarks}
                    onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                    multiline
                    rows={2}
                    sx={{ mt: 2 }}
                  />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={actionType === 'approve' ? handleApprove : handleMarkAsPaid}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'primary'}
          >
            {actionType === 'approve' ? 'Approve' : 'Mark as Paid'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CommissionManagement
