import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Divider
} from '@mui/material'
import { ArrowBack, Delete, CloudUpload } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const BookingDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [bookingData, setBookingData] = useState({
    status: '',
    paymentStatus: '',
    finalAmount: '',
    discount: '',
    remarks: ''
  })
  const [receiptData, setReceiptData] = useState({
    amount: '',
    paymentMode: 'Cash',
    paymentDate: '',
    receiptFile: null
  })

  useEffect(() => {
    fetchBookingDetail()
    fetchReceipts()
  }, [id])

  const fetchBookingDetail = async () => {
    try {
      const { data } = await axios.get(`/bookings/${id}`)
      const bookingInfo = data.data.booking
      setBooking(bookingInfo)
      setBookingData({
        status: bookingInfo.status || 'Pending',
        paymentStatus: bookingInfo.paymentStatus || 'Unpaid',
        finalAmount: bookingInfo.totalAmount || '',
        discount: bookingInfo.discount || '0.00',
        remarks: bookingInfo.remarks || ''
      })
      setLoading(false)
    } catch (error) {
      toast.error('Failed to fetch booking details')
      setLoading(false)
    }
  }

  const fetchReceipts = async () => {
    try {
      const { data } = await axios.get(`/bookings/${id}/receipts`)
      setReceipts(data.data.receipts || [])
    } catch (error) {
      console.error('Failed to fetch receipts')
    }
  }

  const handleUpdateBooking = async () => {
    setUpdating(true)
    try {
      await axios.put(`/bookings/${id}`, bookingData)
      toast.success('Booking updated successfully')
      fetchBookingDetail()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const handleAddReceipt = async () => {
    if (!receiptData.amount || !receiptData.paymentDate) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const payload = new FormData()
      payload.append('amount', receiptData.amount)
      payload.append('paymentMode', receiptData.paymentMode)
      payload.append('paymentDate', receiptData.paymentDate)
      if (receiptData.receiptFile) {
        payload.append('receiptFile', receiptData.receiptFile)
      }

      await axios.post(`/bookings/${id}/receipts`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Receipt added successfully')
      setReceiptData({
        amount: '',
        paymentMode: 'Cash',
        paymentDate: '',
        receiptFile: null
      })
      fetchReceipts()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add receipt')
    }
  }

  const handleDeleteReceipt = async (receiptId) => {
    if (!window.confirm('Are you sure you want to delete this receipt?')) return

    try {
      await axios.delete(`/bookings/${id}/receipts/${receiptId}`)
      toast.success('Receipt deleted successfully')
      fetchReceipts()
    } catch (error) {
      toast.error('Failed to delete receipt')
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!booking) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6">Booking not found</Typography>
        <Button onClick={() => navigate('/admin/bookings')} sx={{ mt: 2 }}>
          Back to Bookings
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <IconButton onClick={() => navigate('/admin/bookings')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Booking #{booking.bookingNumber || booking._id?.slice(-6)}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} mb={3}>
          {/* Client Details */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Client / Customer Details
              </Typography>
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Name:</strong> {booking.userId?.name || booking.customerDetails?.name || '-'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Phone:</strong> {booking.userId?.phone || booking.customerDetails?.phone || '-'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Address:</strong> {booking.customerDetails?.address || booking.userId?.address || '-'}
                </Typography>
                {booking.customerDetails?.aadharNumber && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Aadhar:</strong> {booking.customerDetails.aadharNumber}
                  </Typography>
                )}
                {booking.customerDetails?.panNumber && (
                  <Typography variant="body2" gutterBottom>
                    <strong>PAN:</strong> {booking.customerDetails.panNumber}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Plot Details */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Plot Details
              </Typography>
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Colony:</strong> {booking.plotId?.colonyId?.name || booking.plotId?.colony?.name || '-'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Plot No:</strong> {booking.plotId?.plotNo || booking.plotId?.plotNumber || '-'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Area:</strong> {booking.plotId?.area || booking.plotId?.areaGaj} Gaj
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Total Price:</strong> ₹{booking.totalAmount?.toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Khatoni / Owner Details */}
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Khatoni Holders / Owners
          </Typography>
          {booking.plotId?.colony?.khatoniHolders?.length > 0 || booking.plotId?.colonyId?.khatoniHolders?.length > 0 ? (
            <Grid container spacing={2}>
              {(booking.plotId?.colony?.khatoniHolders || booking.plotId?.colonyId?.khatoniHolders || []).map((holder, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">{holder.name}</Typography>
                    <Typography variant="body2" color="text.secondary">Mobile: {holder.mobile}</Typography>
                    <Typography variant="body2" color="text.secondary">Address: {holder.address}</Typography>
                    {holder.aadharNumber && <Typography variant="caption" display="block">Aadhar: {holder.aadharNumber}</Typography>}
                    {holder.panNumber && <Typography variant="caption" display="block">PAN: {holder.panNumber}</Typography>}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary">No Khatoni details available.</Typography>
          )}
        </Box>

        {/* Documents Section */}
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Documents & Photos
          </Typography>
          <Grid container spacing={2}>
            {/* Plot Images */}
            {booking.plotId?.images?.length > 0 ? (
              booking.plotId.images.map((img, idx) => (
                <Grid item xs={6} sm={4} md={3} key={idx}>
                  <Paper variant="outlined" sx={{ p: 1 }}>
                    <Box component="img" src={img} alt={`Plot ${idx}`} sx={{ width: '100%', height: 150, objectFit: 'cover' }} />
                    <Typography variant="caption" align="center" display="block">Plot Image {idx + 1}</Typography>
                  </Paper>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">No images uploaded for this plot.</Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" mb={1}>Status</Typography>
            <TextField
              fullWidth
              select
              value={bookingData.status}
              onChange={(e) => setBookingData({ ...bookingData, status: e.target.value })}
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" mb={1}>Final Amount</Typography>
            <TextField
              fullWidth
              type="number"
              value={bookingData.finalAmount}
              onChange={(e) => setBookingData({ ...bookingData, finalAmount: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" mb={1}>Discount</Typography>
            <TextField
              fullWidth
              type="number"
              value={bookingData.discount}
              onChange={(e) => setBookingData({ ...bookingData, discount: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" mb={1}>Payment Status</Typography>
            <TextField
              fullWidth
              select
              value={bookingData.paymentStatus}
              onChange={(e) => setBookingData({ ...bookingData, paymentStatus: e.target.value })}
            >
              <MenuItem value="Unpaid">Unpaid</MenuItem>
              <MenuItem value="Partial">Partial</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" mb={1}>Remarks</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={bookingData.remarks}
              onChange={(e) => setBookingData({ ...bookingData, remarks: e.target.value })}
              placeholder="Enter remarks..."
            />
          </Grid>
        </Grid>

        <Box mt={3}>
          <Button
            variant="contained"
            onClick={handleUpdateBooking}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Booking'}
          </Button>
        </Box>
      </Paper>

      {/* Payment Receipts Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          Payment Receipts
        </Typography>

        <TableContainer>
          <Table sx={{ '& td, & th': { border: '1px solid #000' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Receipt No</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Amount</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Mode</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Date</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>File</TableCell>
                <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No receipts added yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((receipt, index) => (
                  <TableRow key={receipt._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>₹{receipt.amount?.toLocaleString()}</TableCell>
                    <TableCell>{receipt.paymentMode}</TableCell>
                    <TableCell>
                      {receipt.paymentDate ? format(new Date(receipt.paymentDate), 'dd-MM-yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {receipt.receiptFile ? (
                        <Button size="small" onClick={() => window.open(receipt.receiptFile)}>
                          View File
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => handleDeleteReceipt(receipt._id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" fontWeight="bold" mb={3}>
          Add New Receipt
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" mb={1}>Amount (₹)</Typography>
            <TextField
              fullWidth
              type="number"
              value={receiptData.amount}
              onChange={(e) => setReceiptData({ ...receiptData, amount: e.target.value })}
              placeholder="Enter amount"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" mb={1}>Payment Mode</Typography>
            <TextField
              fullWidth
              select
              value={receiptData.paymentMode}
              onChange={(e) => setReceiptData({ ...receiptData, paymentMode: e.target.value })}
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
              <MenuItem value="Online">Online</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" mb={1}>Payment Date</Typography>
            <TextField
              fullWidth
              type="date"
              value={receiptData.paymentDate}
              onChange={(e) => setReceiptData({ ...receiptData, paymentDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" mb={1}>Receipt File</Typography>
            <Button
              fullWidth
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              sx={{ height: 56 }}
            >
              Choose file
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setReceiptData({ ...receiptData, receiptFile: e.target.files[0] })}
              />
            </Button>
            {receiptData.receiptFile && (
              <Typography variant="caption" color="success.main" display="block" mt={1}>
                ✓ {receiptData.receiptFile.name}
              </Typography>
            )}
          </Grid>
        </Grid>

        <Box mt={3}>
          <Button variant="contained" onClick={handleAddReceipt}>
            Add Receipt
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default BookingDetail
