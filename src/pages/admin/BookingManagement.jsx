import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import { CheckCircle, Cancel, Visibility, GetApp, Print, FileDownload } from '@mui/icons-material'
import axios from '@/api/axios'
import mockApiService from '@/services/mockApiService'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const BookingManagement = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [users, setUsers] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [filterUser, setFilterUser] = useState('All Users')
  const [filterProperty, setFilterProperty] = useState('All Properties')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [actionType, setActionType] = useState('')
  const [remarks, setRemarks] = useState('')
  const [exportAnchor, setExportAnchor] = useState(null)

  useEffect(() => {
    fetchBookings()
    fetchUsers()
    fetchProperties()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/users?role=buyer')
      setUsers(Array.isArray(data?.data) ? data.data : [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
      if ([401, 403].includes(error.response?.status)) {
        try {
          const mock = await mockApiService.users.getAll()
          setUsers(mock?.data?.data || [])
        } catch (mockError) {
          console.error('Failed to load mock users:', mockError)
          toast.error('Failed to fetch users')
        }
      } else {
        toast.error('Failed to fetch users')
      }
    }
  }

  const fetchProperties = async () => {
    try {
      const { data } = await axios.get('/colonies')
      setProperties(data.data.colonies || [])
    } catch (error) {
      console.error('Failed to fetch properties:', error)
      toast.error('Failed to fetch properties')
    }
  }

  const handleExport = (type) => {
    setExportAnchor(null)
    switch (type) {
      case 'csv':
        exportToCSV()
        break
      case 'excel':
        exportToExcel()
        break
      case 'print':
        window.print()
        break
      default:
        break
    }
  }

  const exportToCSV = () => {
    const headers = ['ID', 'User', 'Property', 'Plot', 'Total (₹)', 'Discount (₹)', 'Status', 'Payment', 'Date']
    const csvContent = [
      headers.join(','),
      ...filteredBookings.map(booking => [
        booking._id,
        booking.userId?.name || '',
        booking.plotId?.colonyId?.name || '',
        booking.plotId?.plotNo || '',
        booking.totalAmount || 0,
        booking.discount || 0,
        booking.status,
        booking.paymentStatus,
        format(new Date(booking.createdAt), 'dd-MM-yyyy')
      ].join(','))
    ].join('\\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bookings.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('CSV exported successfully')
  }

  const exportToExcel = () => {
    toast.info('Excel export functionality would be implemented here')
  }

  const normalizeBooking = (booking) => {
    const user = booking.userId || booking.buyer
    const plot = booking.plotId || booking.plot
    const paymentStatus = booking.paymentStatus || booking.payment?.status || 'pending'

    return {
      ...booking,
      userId: user,
      plotId: plot,
      totalAmount: booking.totalAmount ?? booking.finalAmount ?? 0,
      discount: booking.discount ?? booking.discountAmount ?? 0,
      paymentStatus,
      status: booking.status || 'pending',
      createdAt: booking.createdAt || booking.bookingDate
    }
  }

  const fetchBookings = async (status = '') => {
    try {
      setLoading(true)
      const url = status ? `/bookings?status=${status}` : '/bookings'
      const { data } = await axios.get(url)
      const list = Array.isArray(data?.data) ? data.data : data?.data?.bookings || []
      const normalized = list.map(normalizeBooking)
      setBookings(normalized)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      toast.error('Failed to fetch bookings')
      setLoading(false)
    }
  }

  const handleFilterChange = (status) => {
    setFilterStatus(status)
    fetchBookings(status)
  }

  const handleOpenDialog = (booking, action) => {
    setSelectedBooking(booking)
    setActionType(action)
    setRemarks('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedBooking(null)
    setRemarks('')
  }

  const handleApprove = async () => {
    try {
      await axios.put(`/bookings/${selectedBooking._id}/approve`, { remarks })
      toast.success('Booking approved successfully')
      handleCloseDialog()
      fetchBookings(filterStatus)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed')
    }
  }

  const handleReject = async () => {
    try {
      await axios.put(`/bookings/${selectedBooking._id}/reject`, { reason: remarks })
      toast.success('Booking rejected')
      handleCloseDialog()
      fetchBookings(filterStatus)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rejection failed')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      completed: 'info',
      cancelled: 'default'
    }
    return colors[status] || 'default'
  }

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'error',
      partial: 'warning',
      completed: 'success'
    }
    return colors[status] || 'default'
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesUser = filterUser === 'All Users' || booking.userId?.name === filterUser
    const matchesProperty = filterProperty === 'All Properties' || booking.plotId?.colonyId?.name === filterProperty
    const matchesStatus = filterStatus === 'All Status' || booking.status === filterStatus.toLowerCase()
    
    let matchesDate = true
    if (fromDate && toDate) {
      const bookingDate = new Date(booking.createdAt)
      const from = new Date(fromDate)
      const to = new Date(toDate)
      matchesDate = bookingDate >= from && bookingDate <= to
    }
    
    return matchesUser && matchesProperty && matchesStatus && matchesDate
  })

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
          Bookings List
        </Typography>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField
          select
          size="small"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="All Users">All Users</MenuItem>
          {users.map((user) => (
            <MenuItem key={user._id} value={user.name}>
              {user.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          value={filterProperty}
          onChange={(e) => setFilterProperty(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="All Properties">All Properties</MenuItem>
          {properties.map((property) => (
            <MenuItem key={property._id} value={property.name}>
              {property.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="All Status">All Status</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Approved">Approved</MenuItem>
          <MenuItem value="Rejected">Rejected</MenuItem>
        </TextField>

        <TextField
          type="date"
          size="small"
          label="From"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />

        <TextField
          type="date"
          size="small"
          label="To"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />

        <Button
          variant="contained"
          startIcon={<GetApp />}
          onClick={(e) => setExportAnchor(e.currentTarget)}
        >
          Export
        </Button>
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
      >
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon><FileDownload /></ListItemIcon>
          <ListItemText>CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemIcon><FileDownload /></ListItemIcon>
          <ListItemText>Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('print')}>
          <ListItemIcon><Print /></ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
      </Menu>

      <TableContainer component={Paper}>
        <Table sx={{ '& td, & th': { border: '1px solid #000' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>ID</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>User</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Property</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Plot</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Total (₹)</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Discount (₹)</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Status</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Payment</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Date</TableCell>
              <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking, index) => (
                <TableRow key={booking._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{booking.userId?.name || '-'}</TableCell>
                  <TableCell>{booking.plotId?.colonyId?.name || '-'}</TableCell>
                  <TableCell>{booking.plotId?.plotNo || '-'}</TableCell>
                  <TableCell>{booking.totalAmount?.toLocaleString() || '0.00'}</TableCell>
                  <TableCell>{booking.discount?.toLocaleString() || '0.00'}</TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status === 'pending' ? 'Pending' : booking.status}
                      color={booking.status === 'pending' ? 'info' : 'default'}
                      size="small"
                      sx={{ 
                        bgcolor: booking.status === 'pending' ? '#00bcd4' : undefined,
                        color: booking.status === 'pending' ? 'white' : undefined
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.paymentStatus === 'pending' ? 'Unpaid' : booking.paymentStatus}
                      color={booking.paymentStatus === 'pending' ? 'default' : 'success'}
                      size="small"
                      sx={{ 
                        bgcolor: booking.paymentStatus === 'pending' ? '#9e9e9e' : undefined,
                        color: booking.paymentStatus === 'pending' ? 'white' : undefined
                      }}
                    />
                  </TableCell>
                  <TableCell>{format(new Date(booking.createdAt), 'dd-MM-yyyy')}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/admin/bookings/${booking._id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Approve/Reject Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Booking' : 'Reject Booking'}
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Booking Number:</strong> {selectedBooking.bookingNumber}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Customer:</strong> {selectedBooking.userId?.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Plot:</strong> {selectedBooking.plotId?.plotNo}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Amount:</strong> ₹{selectedBooking.totalAmount?.toLocaleString()}
              </Typography>
              <TextField
                fullWidth
                label={actionType === 'approve' ? 'Remarks (Optional)' : 'Reason for Rejection'}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                multiline
                rows={3}
                sx={{ mt: 2 }}
                required={actionType === 'reject'}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={actionType === 'approve' ? handleApprove : handleReject}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BookingManagement
