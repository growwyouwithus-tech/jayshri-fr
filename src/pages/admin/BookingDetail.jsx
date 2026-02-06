import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
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
import { ArrowBack, Delete, CloudUpload, Print } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Download failed:', error)
    window.open(url, '_blank')
  }
}

const DocumentCard = ({ title, url }) => {
  if (!url) return null
  return (
    <Grid item xs={6} sm={4} md={3}>
      <Paper variant="outlined" sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          component="img"
          src={url}
          alt={title}
          sx={{
            width: '100%',
            height: 150,
            objectFit: 'cover',
            cursor: 'pointer',
            bgcolor: '#f5f5f5'
          }}
          onClick={() => window.open(url, '_blank')}
        />
        <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" noWrap title={title} sx={{ flex: 1, mr: 1 }}>
            {title}
          </Typography>
          <IconButton
            size="small"
            color="primary"
            onClick={() => downloadFile(url, `${title}.jpg`)}
            title="Download"
          >
            <CloudUpload sx={{ transform: 'rotate(180deg)' }} fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Grid>
  )
}

const BookingDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [booking, setBooking] = useState(null)
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [companyWitnesses, setCompanyWitnesses] = useState([])
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
    fetchCompanyWitnesses()
  }, [id])

  // Split effect for receipts to depend on booking state or handle inside fetchBookingDetail
  useEffect(() => {
    if (booking && !id.startsWith('temp-')) {
      fetchReceipts()
    }
  }, [id, booking])

  const fetchBookingDetail = async () => {
    try {
      if (id.startsWith('temp-')) {
        // Handle Pseudo-Booking (Plot looked up directly)
        const plotId = id.replace('temp-', '')
        const { data } = await axios.get(`/plots/${plotId}`)
        const plot = data.data.plot || data.data

        // Construct pseudo-booking object
        const pseudoBooking = {
          _id: id,
          isPseudo: true,
          bookingNumber: `SOLD-${plot.plotNumber || plot.plotNo}`,
          userId: {
            _id: 'manual-user',
            name: plot.customerName || 'Direct Customer',
            phone: plot.customerNumber,
            email: ''
          },
          customerDetails: {
            name: plot.customerName,
            phone: plot.customerNumber,
            address: plot.customerShortAddress
          },
          plotId: plot,
          plot: plot, // Redundant but safe

          // Financials
          totalAmount: plot.totalPrice || 0,
          discount: 0,
          paidAmount: plot.paidAmount || 0,

          // Status Logic
          status: 'Approved',
          paymentStatus: (plot.paidAmount >= plot.totalPrice) ? 'Paid' : 'Partial',

          // Metadata
          remarks: 'Auto-generated from Plot details',
          createdAt: plot.updatedAt || new Date().toISOString()
        }

        setBooking(pseudoBooking)
        setBookingData({
          status: 'Approved',
          paymentStatus: (plot.paidAmount >= plot.totalPrice) ? 'Paid' : 'Partial', // Simple logic
          finalAmount: plot.finalPrice || plot.totalPrice || '',
          discount: '0.00',
          remarks: 'Auto-generated from Sold Plot details'
        })
        setLoading(false)
        return
      }

      if (id === 'new') {
        const mockBooking = {
          _id: 'new',
          bookingNumber: 'BK-NEW',
          customerName: 'New Customer',
          plot: {
            plotNumber: 'A-101',
            colony: { name: 'Green Valley' },
            area: 1000,
            rate: 2500,
            image: null
          },
          amount: 2500000,
          date: new Date().toISOString(),
          status: 'Pending',
          paymentStatus: 'Unpaid',
          tahsil: 'Default Tahsil'
        }
        setBooking(mockBooking)
        setBookingData({
          status: 'Approved',
          paymentStatus: 'Unpaid',
          finalAmount: mockBooking.amount,
          discount: '0.00',
          remarks: 'New booking'
        })
        setLoading(false)
        return
      }

      const { data } = await axios.get(`/bookings/${id}`)
      const bookingInfo = data.data
      setBooking(bookingInfo)
      console.log('Booking Info:', bookingInfo);
      console.log('Plot Colony Data:', bookingInfo.plot?.colony);
      console.log('Khatoni Holders:', bookingInfo.plot?.colony?.khatoniHolders);
      setBookingData({
        status: bookingInfo.status || 'Pending',
        paymentStatus: bookingInfo.paymentStatus || 'Unpaid',
        finalAmount: bookingInfo.totalAmount || '',
        discount: bookingInfo.discount || '0.00',
        remarks: bookingInfo.remarks || ''
      })
      setLoading(false)
    } catch (error) {
      console.error(error)
      // If 404 and it looks like a valid ID, maybe it's a plot ID passed mistakenly without temp tag?
      // For now, just show error.
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

  const fetchCompanyWitnesses = async () => {
    try {
      const { data } = await axios.get('/settings')
      if (data.success && data.data && data.data.companyWitnesses) {
        setCompanyWitnesses(data.data.companyWitnesses)
      }
    } catch (error) {
      console.error('Failed to fetch company witnesses:', error)
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

  // Normalize Plot Object
  const plot = booking.plot || booking.plotId || {}
  const colony = plot.colony || plot.colonyId || {}
  const customerDocs = plot.customerDocuments || {}
  const dimensions = plot.dimensions || {}
  const adjacent = {
    front: dimensions.front || '-',
    back: dimensions.back || '-',
    left: dimensions.left || '-',
    right: dimensions.right || '-'
  }

  // Calculate side dimensions for display (matching slip logic)
  const sideDimensions = {
    front: plot.sideMeasurements?.front || dimensions.length || '-',
    back: plot.sideMeasurements?.back || dimensions.length || '-',
    left: plot.sideMeasurements?.left || dimensions.width || '-',
    right: plot.sideMeasurements?.right || dimensions.width || '-'
  }

  // Helper function for number conversion
  const toNumber = (val) => {
    const num = Number(val)
    return Number.isFinite(num) ? num : 0
  }

  // Calculate area in Gaj and prices (matching BookingManagement logic)
  const areaGaj = plot.areaGaj || (plot.area ? (toNumber(plot.area) / 9).toFixed(3) : null)
  const pricePerGaj = plot.pricePerGaj || (plot.pricePerSqFt ? (toNumber(plot.pricePerSqFt) * 9).toFixed(2) : null)
  const finalPricePerGaj = plot.finalPrice || null


  // Calculate total price (prioritize finalPrice calculation when available)
  const displayTotalPrice = (finalPricePerGaj && areaGaj)
    ? toNumber(finalPricePerGaj) * toNumber(areaGaj)
    : (booking.totalAmount || plot.totalPrice ||
      (areaGaj && pricePerGaj ? toNumber(areaGaj) * toNumber(pricePerGaj) : 0))



  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <IconButton onClick={() => navigate(location.state?.from || '/admin/bookings')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          {(plot.status === 'sold' || booking.status === 'completed') ? 'Sold Plot Detail' : 'Booking Detail'}
        </Typography>
        <Box flexGrow={1} />
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Print />}
          onClick={() => {
            // Determine the correct ID to use (handle pseudo-bookings)
            // If it's a pseudo-booking, the ID is already correct (starts with "temp-")
            // If it's a real booking, pass the booking ID
            // BUT we also need to handle the case where we might want to print a slip for a plot looked up by ID
            // The current page is /admin/bookings/:id
            // So we can just append /print to the current URL structure
            navigate(`/admin/bookings/${id}/print`);
          }}
        >
          Print Slip
        </Button>
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
                  <strong>Area:</strong> {booking.plotId?.areaGaj || (booking.plotId?.area ? (booking.plotId.area / 9).toFixed(3) : '-')} Gaj
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Total Price:</strong> ₹{Number(displayTotalPrice).toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* 1. Plot Description (Detailed) */}
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Plot Description
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Plot Size (Area)</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {plot.areaGaj || (plot.area ? (plot.area / 9).toFixed(3) : '-')} Gaj
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Sold Price per Gaj</Typography>
                <Typography variant="body1" fontWeight="medium">
                  ₹{plot.finalPrice ? Number(plot.finalPrice).toLocaleString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Plot Dimension</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {dimensions.length || '-'} × {dimensions.width || '-'}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                  Front: {sideDimensions.front} | Back: {sideDimensions.back}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Left: {sideDimensions.left} | Right: {sideDimensions.right}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>Adjacent Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Front</Typography>
                    <Typography variant="body2">{adjacent.front}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Back</Typography>
                    <Typography variant="body2">{adjacent.back}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Left</Typography>
                    <Typography variant="body2">{adjacent.left}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Right</Typography>
                    <Typography variant="body2">{adjacent.right}</Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* 2. Customer Documents */}
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Customer Documents
          </Typography>
          <Grid container spacing={2}>
            <DocumentCard title="Aadhar Front" url={customerDocs.aadharFront || plot.customerAadharFront} />
            <DocumentCard title="Aadhar Back" url={customerDocs.aadharBack || plot.customerAadharBack} />
            <DocumentCard title="PAN Card" url={customerDocs.panCard || plot.customerPanCard} />
            <DocumentCard title="Passport Photo" url={customerDocs.passportPhoto || plot.customerPassportPhoto} />
            <DocumentCard title="Full Photo" url={customerDocs.fullPhoto || plot.customerFullPhoto} />
            {(!customerDocs.aadharFront && !plot.customerAadharFront) && (
              <Grid item xs={12}><Typography color="text.secondary">No customer documents available.</Typography></Grid>
            )}
          </Grid>
        </Box>

        {/* Khatoni Holders / Owners - New Structured Format */}
        {/* {(colony.khatoniHolders && colony.khatoniHolders.length > 0 && (!plot.ownerType || plot.ownerType === 'khatoniHolder')) && (
          <Box mb={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Khatoni Holders / Owners
            </Typography>
            {colony.khatoniHolders.map((holder, idx) => (
              <Box key={idx} mb={3}> */}
        {/* Khatoni Holder Details Box */}
        {/* <Paper
                  variant="outlined"
                  sx={{
                    border: '2px solid #000',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                > */}
        {/* Holder Info Section */}
        {/* <Box sx={{ p: 2, bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}> */}
        {/* <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          KHATONI HOLDER NO {idx + 1}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>NAME</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {holder.name || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>ADD</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {holder.address || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>MOBI</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {holder.mobile || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>ADHAR NO</strong>&nbsp;: {holder.aadharNumber || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>PAN NO</strong>&nbsp;&nbsp;&nbsp;&nbsp;: {holder.panNumber || '-'}
                          </Typography>
                          {holder.dateOfBirth && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>DOB</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {holder.dateOfBirth}
                            </Typography>
                          )}
                          {holder.sonOf && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>SON OF</strong>&nbsp;&nbsp;&nbsp;: {holder.sonOf}
                            </Typography>
                          )}
                          {holder.daughterOf && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>D/O</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {holder.daughterOf}
                            </Typography>
                          )}
                          {holder.wifeOf && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>WIFE OF</strong>&nbsp;&nbsp;: {holder.wifeOf}
                            </Typography>
                          )}
                        </Box>
                      </Box> */}
        {/* <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const text = `KHATONI HOLDER NO ${idx + 1}\nNAME: ${holder.name || '-'}\nADD: ${holder.address || '-'}\nMOBI: ${holder.mobile || '-'}\nADHAR NO: ${holder.aadharNumber || '-'}\nPAN NO: ${holder.panNumber || '-'}`;
                          navigator.clipboard.writeText(text);
                          toast.success('Khatoni holder details copied!');
                        }}
                      >
                        COPY
                      </Button>
                    </Box>
                  </Box> */}

        {/* Document Previews and Buttons Section */}
        {/* <Box sx={{ bgcolor: '#4caf50', p: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {holder.documents?.aadharFront && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={holder.documents.aadharFront}
                            alt="Aadhar Front"
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '2px solid #fff',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => window.open(holder.documents.aadharFront, '_blank')}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              bgcolor: '#2e7d32',
                              color: '#fff',
                              '&:hover': { bgcolor: '#1b5e20' },
                              textTransform: 'none',
                              minWidth: 80
                            }}
                            onClick={() => window.open(holder.documents.aadharFront, '_blank')}
                          >
                            Aadhar frnt
                          </Button>
                        </Box>
                      )}
                      {holder.documents?.aadharBack && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={holder.documents.aadharBack}
                            alt="Aadhar Back"
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '2px solid #fff',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => window.open(holder.documents.aadharBack, '_blank')}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              bgcolor: '#2e7d32',
                              color: '#fff',
                              '&:hover': { bgcolor: '#1b5e20' },
                              textTransform: 'none',
                              minWidth: 80
                            }}
                            onClick={() => window.open(holder.documents.aadharBack, '_blank')}
                          >
                            Aadhar bck
                          </Button>
                        </Box>
                      )}
                      {holder.documents?.panCard && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={holder.documents.panCard}
                            alt="PAN Card"
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '2px solid #fff',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => window.open(holder.documents.panCard, '_blank')}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              bgcolor: '#2e7d32',
                              color: '#fff',
                              '&:hover': { bgcolor: '#1b5e20' },
                              textTransform: 'none',
                              minWidth: 80
                            }}
                            onClick={() => window.open(holder.documents.panCard, '_blank')}
                          >
                            PanCard
                          </Button>
                        </Box>
                      )}
                      {holder.documents?.passportPhoto && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={holder.documents.passportPhoto}
                            alt="Passport Photo"
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '2px solid #fff',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => window.open(holder.documents.passportPhoto, '_blank')}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              bgcolor: '#2e7d32',
                              color: '#fff',
                              '&:hover': { bgcolor: '#1b5e20' },
                              textTransform: 'none',
                              minWidth: 80
                            }}
                            onClick={() => window.open(holder.documents.passportPhoto, '_blank')}
                          >
                            Passport
                          </Button>
                        </Box>
                      )}
                      {holder.documents?.fullPhoto && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={holder.documents.fullPhoto}
                            alt="Full Photo"
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '2px solid #fff',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => window.open(holder.documents.fullPhoto, '_blank')}
                          /> */}
        {/* <Button
                            variant="contained"
                            size="small"
                            sx={{
                              bgcolor: '#2e7d32',
                              color: '#fff',
                              '&:hover': { bgcolor: '#1b5e20' },
                              textTransform: 'none',
                              minWidth: 80
                            }}
                            onClick={() => window.open(holder.documents.fullPhoto, '_blank')}
                          >
                            Full Photo
                          </Button>
                        </Box> */}
        {/* //           )} */}
        {/* //           {(!holder.documents?.aadharFront && !holder.documents?.aadharBack && */}
        {/* //             !holder.documents?.panCard && !holder.documents?.passportPhoto &&
            //             !holder.documents?.fullPhoto) && (
            //               <Typography variant="caption" sx={{ color: '#fff', ml: 1 }}>
            //                 No documents available
            //               </Typography>
            //             )}
            //         </Box>
            //       </Box> */}
        {/* //     </Paper>
            //   </Box> */}
        {/* // ))}         </Box> */}
        {/* )}   
            Witness Details - Conditional Display */}
        {(() => {
          const hasPlotWitnesses = plot.witnesses && plot.witnesses.length > 0;
          const hasCompanyWitnesses = companyWitnesses && companyWitnesses.length > 0;

          const witnessesToDisplay = hasPlotWitnesses
            ? plot.witnesses
            : (hasCompanyWitnesses
              ? companyWitnesses.map(cw => ({
                witnessName: cw.name,
                witnessPhone: cw.phone,
                witnessAadharNumber: cw.aadharNumber,
                witnessPanNumber: cw.panNumber,
                witnessDateOfBirth: cw.dateOfBirth,
                witnessSonOf: cw.sonOf,
                witnessDaughterOf: cw.daughterOf,
                witnessWifeOf: cw.wifeOf,
                witnessAddress: cw.address,
                witnessDocuments: cw.documents
              }))
              : []);

          return witnessesToDisplay.length > 0 && (
            <Box mb={4}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Witness Details {!hasPlotWitnesses && <Typography component="span" variant="caption" color="text.secondary">(Company Witnesses)</Typography>}
              </Typography>
              {witnessesToDisplay.map((witness, idx) => (
                <Box key={idx} mb={3}>
                  <Paper
                    variant="outlined"
                    sx={{
                      border: '2px solid #000',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{ p: 2, bgcolor: '#fff' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            WITNESS NO {idx + 1}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>NAME</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {witness.witnessName || '-'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>ADD</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {witness.witnessAddress || '-'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>MOBI</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {witness.witnessPhone || '-'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>ADHAR NO</strong>&nbsp;: {witness.witnessAadharNumber || '-'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>PAN NO</strong>&nbsp;&nbsp;&nbsp;&nbsp;: {witness.witnessPanNumber || '-'}
                            </Typography>
                            {witness.witnessDateOfBirth && (
                              <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                                <strong>DOB</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {witness.witnessDateOfBirth}
                              </Typography>
                            )}
                            {witness.witnessSonOf && (
                              <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                                <strong>SON OF</strong>&nbsp;&nbsp;&nbsp;: {witness.witnessSonOf}
                              </Typography>
                            )}
                            {witness.witnessDaughterOf && (
                              <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                                <strong>D/O</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {witness.witnessDaughterOf}
                              </Typography>
                            )}
                            {witness.witnessWifeOf && (
                              <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                                <strong>WIFE OF</strong>&nbsp;&nbsp;: {witness.witnessWifeOf}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const text = `WITNESS NO ${idx + 1}\\nNAME: ${witness.witnessName || '-'}\\nADD: ${witness.witnessAddress || '-'}\\nMOBI: ${witness.witnessPhone || '-'}\\nADHAR NO: ${witness.witnessAadharNumber || '-'}\\nPAN NO: ${witness.witnessPanNumber || '-'}`;
                            navigator.clipboard.writeText(text);
                            toast.success('Witness details copied!');
                          }}
                        >
                          COPY
                        </Button>
                      </Box>
                    </Box>

                    <Box sx={{ bgcolor: '#4caf50', p: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {witness.witnessDocuments?.aadharFront && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Box
                              component="img"
                              src={witness.witnessDocuments.aadharFront}
                              alt="Aadhar Front"
                              sx={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '2px solid #fff',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                              }}
                              onClick={() => window.open(witness.witnessDocuments.aadharFront, '_blank')}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              sx={{
                                bgcolor: '#2e7d32',
                                color: '#fff',
                                '&:hover': { bgcolor: '#1b5e20' },
                                textTransform: 'none',
                                minWidth: 80
                              }}
                              onClick={() => window.open(witness.witnessDocuments.aadharFront, '_blank')}
                            >
                              Aadhar frnt
                            </Button>
                          </Box>
                        )}
                        {witness.witnessDocuments?.aadharBack && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Box
                              component="img"
                              src={witness.witnessDocuments.aadharBack}
                              alt="Aadhar Back"
                              sx={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '2px solid #fff',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                              }}
                              onClick={() => window.open(witness.witnessDocuments.aadharBack, '_blank')}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              sx={{
                                bgcolor: '#2e7d32',
                                color: '#fff',
                                '&:hover': { bgcolor: '#1b5e20' },
                                textTransform: 'none',
                                minWidth: 80
                              }}
                              onClick={() => window.open(witness.witnessDocuments.aadharBack, '_blank')}
                            >
                              Aadhar bck
                            </Button>
                          </Box>
                        )}
                        {witness.witnessDocuments?.panCard && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Box
                              component="img"
                              src={witness.witnessDocuments.panCard}
                              alt="PAN Card"
                              sx={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '2px solid #fff',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                              }}
                              onClick={() => window.open(witness.witnessDocuments.panCard, '_blank')}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              sx={{
                                bgcolor: '#2e7d32',
                                color: '#fff',
                                '&:hover': { bgcolor: '#1b5e20' },
                                textTransform: 'none',
                                minWidth: 80
                              }}
                              onClick={() => window.open(witness.witnessDocuments.panCard, '_blank')}
                            >
                              PanCard
                            </Button>
                          </Box>
                        )}
                        {witness.witnessDocuments?.passportPhoto && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Box
                              component="img"
                              src={witness.witnessDocuments.passportPhoto}
                              alt="Passport Photo"
                              sx={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '2px solid #fff',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                              }}
                              onClick={() => window.open(witness.witnessDocuments.passportPhoto, '_blank')}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              sx={{
                                bgcolor: '#2e7d32',
                                color: '#fff',
                                '&:hover': { bgcolor: '#1b5e20' },
                                textTransform: 'none',
                                minWidth: 80
                              }}
                              onClick={() => window.open(witness.witnessDocuments.passportPhoto, '_blank')}
                            >
                              Passport
                            </Button>
                          </Box>
                        )}
                        {witness.witnessDocuments?.fullPhoto && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Box
                              component="img"
                              src={witness.witnessDocuments.fullPhoto}
                              alt="Full Photo"
                              sx={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '2px solid #fff',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                              }}
                              onClick={() => window.open(witness.witnessDocuments.fullPhoto, '_blank')}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              sx={{
                                bgcolor: '#2e7d32',
                                color: '#fff',
                                '&:hover': { bgcolor: '#1b5e20' },
                                textTransform: 'none',
                                minWidth: 80
                              }}
                              onClick={() => window.open(witness.witnessDocuments.fullPhoto, '_blank')}
                            >
                              Full Photo
                            </Button>
                          </Box>
                        )}
                        {(!witness.witnessDocuments?.aadharFront && !witness.witnessDocuments?.aadharBack &&
                          !witness.witnessDocuments?.panCard && !witness.witnessDocuments?.passportPhoto &&
                          !witness.witnessDocuments?.fullPhoto) && (
                            <Typography variant="caption" sx={{ color: '#fff', ml: 1 }}>
                              No documents available
                            </Typography>
                          )}
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              ))}
            </Box>
          );
        })()}

        {(plot.plotOwners && plot.plotOwners.length > 0 && (!plot.ownerType || plot.ownerType === 'owner')) && (
          <Box mb={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Plot Owners
            </Typography>
            {plot.plotOwners.map((owner, idx) => (
              <Box key={idx} mb={3}>
                {/* Owner Details Box */}
                <Paper
                  variant="outlined"
                  sx={{
                    border: '2px solid #000',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  {/* Owner Info Section */}
                  <Box sx={{ p: 2, bgcolor: '#fff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          OWNER NO {idx + 1}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>NAME</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {owner.ownerName || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>ADD</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {owner.ownerAddress || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>MOBI</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {owner.ownerPhone || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>ADHAR NO</strong>&nbsp;: {owner.ownerAadharNumber || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>PAN NO</strong>&nbsp;&nbsp;&nbsp;&nbsp;: {owner.ownerPanNumber || '-'}
                          </Typography>
                          {owner.ownerDateOfBirth && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>DOB</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {owner.ownerDateOfBirth}
                            </Typography>
                          )}
                          {owner.ownerSonOf && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>SON OF</strong>&nbsp;&nbsp;&nbsp;: {owner.ownerSonOf}
                            </Typography>
                          )}
                          {owner.ownerDaughterOf && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>D/O</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {owner.ownerDaughterOf}
                            </Typography>
                          )}
                          {owner.ownerWifeOf && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>WIFE OF</strong>&nbsp;&nbsp;: {owner.ownerWifeOf}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const text = `OWNER NO ${idx + 1}\nNAME: ${owner.ownerName || '-'}\nADD: ${owner.ownerAddress || '-'}\nMOBI: ${owner.ownerPhone || '-'}\nADHAR NO: ${owner.ownerAadharNumber || '-'}\nPAN NO: ${owner.ownerPanNumber || '-'}`;
                          navigator.clipboard.writeText(text);
                          toast.success('Owner details copied!');
                        }}
                      >
                        COPY
                      </Button>
                    </Box>
                  </Box>

                  {/* Document Previews and Buttons Section */}
                  <Box sx={{ bgcolor: '#4caf50', p: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {owner.ownerDocuments?.aadharFront && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={owner.ownerDocuments.aadharFront}
                            alt="Aadhar Front"
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '2px solid #fff',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => window.open(owner.ownerDocuments.aadharFront, '_blank')}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              bgcolor: '#2e7d32',
                              color: '#fff',
                              '&:hover': { bgcolor: '#1b5e20' },
                              textTransform: 'none',
                              minWidth: 80
                            }}
                            onClick={() => window.open(owner.ownerDocuments.aadharFront, '_blank')}
                          >
                            Aadhar frnt
                          </Button>
                        </Box>
                      )}
                      {owner.ownerDocuments?.aadharBack && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={owner.ownerDocuments.aadharBack}
                            alt="Aadhar Back"
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '2px solid #fff',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => window.open(owner.ownerDocuments.aadharBack, '_blank')}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              bgcolor: '#2e7d32',
                              color: '#fff',
                              '&:hover': { bgcolor: '#1b5e20' },
                              textTransform: 'none',
                              minWidth: 80
                            }}
                            onClick={() => window.open(owner.ownerDocuments.aadharBack, '_blank')}
                          >
                            Aadhar bck
                          </Button>
                        </Box>
                      )}
                      {owner.ownerDocuments?.panCard && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={owner.ownerDocuments.panCard}
                            alt="PAN Card"
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '2px solid #fff',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => window.open(owner.ownerDocuments.panCard, '_blank')}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              bgcolor: '#2e7d32',
                              color: '#fff',
                              '&:hover': { bgcolor: '#1b5e20' },
                              textTransform: 'none',
                              minWidth: 80
                            }}
                            onClick={() => window.open(owner.ownerDocuments.panCard, '_blank')}
                          >
                            PanCard
                          </Button>
                        </Box>
                      )}
                      {owner.ownerDocuments?.passportPhoto && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={owner.ownerDocuments.passportPhoto}
                            alt="Passport Photo"
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '2px solid #fff',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => window.open(owner.ownerDocuments.passportPhoto, '_blank')}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              bgcolor: '#2e7d32',
                              color: '#fff',
                              '&:hover': { bgcolor: '#1b5e20' },
                              textTransform: 'none',
                              minWidth: 80
                            }}
                            onClick={() => window.open(owner.ownerDocuments.passportPhoto, '_blank')}
                          >
                            Passport
                          </Button>
                        </Box>
                      )}
                      {owner.ownerDocuments?.fullPhoto && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={owner.ownerDocuments.fullPhoto}
                            alt="Full Photo"
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '2px solid #fff',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => window.open(owner.ownerDocuments.fullPhoto, '_blank')}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              bgcolor: '#2e7d32',
                              color: '#fff',
                              '&:hover': { bgcolor: '#1b5e20' },
                              textTransform: 'none',
                              minWidth: 80
                            }}
                            onClick={() => window.open(owner.ownerDocuments.fullPhoto, '_blank')}
                          >
                            Full Photo
                          </Button>
                        </Box>
                      )}
                      {(!owner.ownerDocuments?.aadharFront && !owner.ownerDocuments?.aadharBack &&
                        !owner.ownerDocuments?.panCard && !owner.ownerDocuments?.passportPhoto &&
                        !owner.ownerDocuments?.fullPhoto) && (
                          <Typography variant="caption" sx={{ color: '#fff', ml: 1 }}>
                            No documents available
                          </Typography>
                        )}
                    </Box>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        )}

        {/* Khatoni Holders Section */}
        {((plot.colony?.khatoniHolders?.length > 0) || (plot.colonyId?.khatoniHolders?.length > 0)) && (
          <Box mb={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Khatoni Holders
            </Typography>
            {((plot.colony?.khatoniHolders) || (plot.colonyId?.khatoniHolders) || []).map((holder, idx) => (
              <Box key={idx} mb={3}>
                <Paper variant="outlined" sx={{ border: '2px solid #ed6c02', borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={{ p: 2, bgcolor: '#fff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="warning.dark">
                          KHATONI HOLDER {idx + 1}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>NAME</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {holder.name || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>ADD</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {holder.address || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>MOBI</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {holder.mobile || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>ADHAR NO</strong>&nbsp;: {holder.aadharNumber || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                            <strong>PAN NO</strong>&nbsp;&nbsp;&nbsp;&nbsp;: {holder.panNumber || '-'}
                          </Typography>
                          {holder.dateOfBirth && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>DOB</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {holder.dateOfBirth}
                            </Typography>
                          )}
                          {holder.sonOf && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>SON OF</strong>&nbsp;&nbsp;&nbsp;: {holder.sonOf}
                            </Typography>
                          )}
                          {holder.daughterOf && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>D/O</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {holder.daughterOf}
                            </Typography>
                          )}
                          {holder.wifeOf && (
                            <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                              <strong>WIFE OF</strong>&nbsp;&nbsp;: {holder.wifeOf}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        onClick={() => {
                          const text = `KHATONI HOLDER ${idx + 1}\nNAME: ${holder.name || '-'}\nADD: ${holder.address || '-'}\nMOBI: ${holder.mobile || '-'}\nADHAR NO: ${holder.aadharNumber || '-'}\nPAN NO: ${holder.panNumber || '-'}`;
                          navigator.clipboard.writeText(text);
                          toast.success('Khatoni holder details copied!');
                        }}
                      >
                        COPY
                      </Button>
                    </Box>
                  </Box>

                  {/* Document Previews */}
                  <Box sx={{ bgcolor: '#ed6c02', p: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {holder.documents?.aadharFront && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={holder.documents.aadharFront}
                            alt="Aadhar Front"
                            sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '2px solid #fff', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                            onClick={() => window.open(holder.documents.aadharFront, '_blank')}
                          />
                          <Button variant="contained" size="small" sx={{ bgcolor: '#e65100', color: '#fff', '&:hover': { bgcolor: '#bf360c' }, textTransform: 'none', minWidth: 80 }} onClick={() => window.open(holder.documents.aadharFront, '_blank')}>
                            Aadhar frnt
                          </Button>
                        </Box>
                      )}
                      {holder.documents?.aadharBack && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={holder.documents.aadharBack}
                            alt="Aadhar Back"
                            sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '2px solid #fff', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                            onClick={() => window.open(holder.documents.aadharBack, '_blank')}
                          />
                          <Button variant="contained" size="small" sx={{ bgcolor: '#e65100', color: '#fff', '&:hover': { bgcolor: '#bf360c' }, textTransform: 'none', minWidth: 80 }} onClick={() => window.open(holder.documents.aadharBack, '_blank')}>
                            Aadhar bck
                          </Button>
                        </Box>
                      )}
                      {holder.documents?.panCard && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={holder.documents.panCard}
                            alt="PAN Card"
                            sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '2px solid #fff', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                            onClick={() => window.open(holder.documents.panCard, '_blank')}
                          />
                          <Button variant="contained" size="small" sx={{ bgcolor: '#e65100', color: '#fff', '&:hover': { bgcolor: '#bf360c' }, textTransform: 'none', minWidth: 80 }} onClick={() => window.open(holder.documents.panCard, '_blank')}>
                            PanCard
                          </Button>
                        </Box>
                      )}
                      {holder.documents?.passportPhoto && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={holder.documents.passportPhoto}
                            alt="Passport Photo"
                            sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '2px solid #fff', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                            onClick={() => window.open(holder.documents.passportPhoto, '_blank')}
                          />
                          <Button variant="contained" size="small" sx={{ bgcolor: '#e65100', color: '#fff', '&:hover': { bgcolor: '#bf360c' }, textTransform: 'none', minWidth: 80 }} onClick={() => window.open(holder.documents.passportPhoto, '_blank')}>
                            Passport
                          </Button>
                        </Box>
                      )}
                      {holder.documents?.fullPhoto && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={holder.documents.fullPhoto}
                            alt="Full Photo"
                            sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '2px solid #fff', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                            onClick={() => window.open(holder.documents.fullPhoto, '_blank')}
                          />
                          <Button variant="contained" size="small" sx={{ bgcolor: '#e65100', color: '#fff', '&:hover': { bgcolor: '#bf360c' }, textTransform: 'none', minWidth: 80 }} onClick={() => window.open(holder.documents.fullPhoto, '_blank')}>
                            Full Photo
                          </Button>
                        </Box>
                      )}
                      {(!holder.documents?.aadharFront && !holder.documents?.aadharBack &&
                        !holder.documents?.panCard && !holder.documents?.passportPhoto &&
                        !holder.documents?.fullPhoto) && (
                          <Typography variant="caption" sx={{ color: '#fff', ml: 1 }}>
                            No documents available
                          </Typography>
                        )}
                    </Box>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        )}

        {/* Documents Section */}
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Documents & Photos
          </Typography>
          <Grid container spacing={2}>
            {/* Plot Images */}
            {((booking.plotId?.plotImages?.length > 0) || (booking.plotId?.images?.length > 0)) ? (
              (booking.plotId?.plotImages || booking.plotId?.images || []).map((img, idx) => (
                <Grid item xs={6} sm={4} md={3} key={idx}>
                  <Paper variant="outlined" sx={{ p: 1 }}>
                    <Box component="img" src={img} alt={`Plot ${idx}`} sx={{ width: '100%', height: 150, objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(img, '_blank')} />
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

        {/* Registry Details Section - Only show if coming from Sold Plots */}
        {(location.state?.from === '/admin/sold-plots' && (plot.status === 'sold' || booking.status === 'completed' || plot.registryDate)) && (
          <Box mb={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Registry Details
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Registry Date</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {plot.registryDate ? format(new Date(plot.registryDate), 'dd-MM-yyyy') : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Registry Number</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {plot.registryNumber || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Registry Place</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {plot.registryPlace || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* Registry Scans/Documents - Only show if coming from Sold Plots */}
        {(location.state?.from === '/admin/sold-plots' && (plot.status === 'sold' || booking.status === 'completed' || plot.registryDate)) && (
          <Box mb={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Registry Documents
            </Typography>
            <Grid container spacing={2}>
              {plot.registryDocument?.map((url, idx) => (
                <DocumentCard key={idx} title={`Registry Page ${idx + 1}`} url={url} />
              ))}
              {plot.registryPdf && (
                <Grid item xs={6} sm={4} md={3}>
                  <Paper variant="outlined" sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 150 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Registry PDF</Typography>
                    <Button variant="contained" size="small" onClick={() => window.open(plot.registryPdf, '_blank')}>View PDF</Button>
                  </Paper>
                </Grid>
              )}
              {(!plot.registryDocument?.length && !plot.registryPdf) && (
                <Grid item xs={12}><Typography color="text.secondary">No registry documents uploaded.</Typography></Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* <Divider sx={{ my: 3 }} />

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
            disabled={updating || id.startsWith('temp-')}
          >
            {updating ? 'Updating...' : 'Update Booking'}
          </Button>
          {id.startsWith('temp-') && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Updates are disabled for manually booked plots.
            </Typography>
          )}
        </Box> */}
      </Paper >

      {/* Payment Receipts Section - REMOVED AS PER USER REQUEST */}
      {/* 
      {!id.startsWith('temp-') && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
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
                  {receipts.length > 0 ? (
                    receipts.map((receipt) => (
                      <TableRow key={receipt._id}>
                        <TableCell sx={{ border: '1px solid #000' }}>{receipt.receiptNumber}</TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}>₹{receipt.amount}</TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}>{receipt.paymentMode}</TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}>{format(new Date(receipt.paymentDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell sx={{ border: '1px solid #000' }}>
                          {receipt.receiptFile && (
                            <Button
                              size="small"
                              startIcon={<CloudUpload />}
                              href={receipt.receiptFile}
                              target="_blank"
                            >
                              View
                            </Button>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ border: '1px solid #000' }}>
                          <IconButton color="error" onClick={() => handleDeleteReceipt(receipt._id)}>
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, border: '1px solid #000' }}>
                        No receipts added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box mt={4}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Add New Receipt
              </Typography>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" mb={1}>Amount (₹)</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder="Enter amount"
                    value={receiptData.amount}
                    onChange={(e) => setReceiptData({ ...receiptData, amount: e.target.value })}
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
                    <MenuItem value="Online">Online</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" mb={1}>Payment Date</Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={receiptData.paymentDate}
                    onChange={(e) => setReceiptData({ ...receiptData, paymentDate: e.target.value })}
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
          </>
        )}
       */}
    </Box>
  )
}

export default BookingDetail
