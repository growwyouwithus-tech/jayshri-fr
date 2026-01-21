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
    TablePagination,
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

const SoldPlotManagement = () => {
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
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(20)

    const handleChangePage = (event, newPage) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

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
        a.download = 'sold_plots.csv'
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

            // Execute both requests in parallel
            const [bookingsResponse, plotsResponse] = await Promise.all([
                axios.get(url),
                axios.get('/plots?limit=5000') // Fetch all plots to find missing bookings
            ])

            const bookingList = Array.isArray(bookingsResponse.data?.data)
                ? bookingsResponse.data.data
                : bookingsResponse.data?.data?.bookings || []

            const allPlots = Array.isArray(plotsResponse.data?.data?.plots)
                ? plotsResponse.data.data.plots
                : Array.isArray(plotsResponse.data?.data)
                    ? plotsResponse.data.data
                    : []

            // Normalize existing bookings
            let combinedList = bookingList.map(normalizeBooking)

            // Create a Set of Plot IDs that already have a booking
            const bookedPlotIds = new Set(
                combinedList.map(b => getPlotId(b))
            )

            // Helper to safely get ID
            function getPlotId(booking) {
                if (booking.plotId?._id) return booking.plotId._id
                if (booking.plot?._id) return booking.plot._id
                if (booking.plot) return booking.plot
                return null
            }

            // Filter plots that are 'sold' but have NO booking record
            const missingPlots = allPlots.filter(plot => {
                const s = (plot.status || '').toLowerCase()
                // Here is the constraint: ONLY 'sold' plots
                const isSoldState = s === 'sold'
                return isSoldState && !bookedPlotIds.has(plot._id)
            })

            // Convert these plots into "Pseudo-Booking" objects
            const pseudoBookings = missingPlots.map(plot => {
                // Calculate correct total price
                const areaGaj = plot.areaGaj || (plot.area ? Number(plot.area) / 9 : 0);
                const ratePerGaj = plot.finalPrice || plot.pricePerGaj || 0;

                let calculatedTotal = plot.totalPrice || 0;

                if (['sold'].includes((plot.status || '').toLowerCase()) && ratePerGaj && areaGaj) {
                    calculatedTotal = Number(ratePerGaj) * Number(areaGaj);
                }

                return {
                    _id: `temp-${plot._id}`,
                    isPseudo: true, // Marker
                    bookingNumber: `SOLD-${plot.plotNumber || plot.plotNo}`, // Differentiate Sold ones

                    // Construct User/Customer object
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

                    // Construct Plot object similar to populated booking.plot
                    plotId: plot,
                    plot: plot,

                    totalAmount: calculatedTotal,
                    discount: 0,
                    paymentStatus: 'completed', // Sold usually means completed or handled
                    paidAmount: plot.paidAmount || 0,

                    // Status mapping
                    status: 'completed', // Sold implies completed
                    createdAt: plot.updatedAt || new Date().toISOString()
                }
            })

            // Merge and sort by date
            combinedList = [...combinedList, ...pseudoBookings].sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            )

            setBookings(combinedList)
            setLoading(false)
        } catch (error) {
            console.error('Failed to fetch sold plots:', error)
            toast.error('Failed to fetch sold plots')
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

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            approved: 'success',
            rejected: 'error',
            completed: 'success',
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
        const plot = booking.plot || booking.plotId || {} // Determine plot object
        const matchesUser = filterUser === 'All Users' || booking.userId?.name === filterUser
        const matchesProperty = filterProperty === 'All Properties' || plot.colonyId?.name === filterProperty || plot.colony?.name === filterProperty

        // Determine the effective status
        const effectiveStatus = (plot.status || booking.status || 'Pending').toLowerCase();

        // GLOBAL CONSTRAINT: ONLY show sold plots
        const isSold = effectiveStatus === 'sold';

        let matchesDate = true
        if (fromDate && toDate) {
            const bookingDate = new Date(booking.createdAt)
            const from = new Date(fromDate)
            const to = new Date(toDate)
            matchesDate = bookingDate >= from && bookingDate <= to
        }

        return matchesUser && matchesProperty && isSold && matchesDate
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
                    Sold Plots List
                </Typography>
            </Box>

            {/* Filters */}
            <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
                <TextField
                    select
                    size="small"
                    value={filterUser}
                    onChange={(e) => {
                        setFilterUser(e.target.value)
                        setPage(0)
                    }}
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
                    onChange={(e) => {
                        setFilterProperty(e.target.value)
                        setPage(0)
                    }}
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

            <TableContainer component={Paper} sx={{ maxHeight: '75vh' }}>
                <Table stickyHeader sx={{ '& td, & th': { border: '1px solid #000' } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Plot No</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Colony</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Khatoni Holders / Owners</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Customer</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Area (Gaj)</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Sold Price/Gaj</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Total Price</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Paid Amount</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Remaining</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Facing</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Status</TableCell>
                            <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={12} align="center">
                                    No sold plots found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBookings
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((booking) => {
                                    // Determine plot object (handle populate variations)
                                    const rawPlot = booking.plot || booking.plotId || {};

                                    // Helper functions
                                    const toNumber = (val) => {
                                        const num = Number(val);
                                        return Number.isFinite(num) ? num : 0;
                                    };

                                    // Conversions (assuming backend uses sqft, frontend expects gaj)
                                    // 1 Gaj = 9 SqFt
                                    const areaGaj = rawPlot.areaGaj || (rawPlot.area ? (toNumber(rawPlot.area) / 9).toFixed(3) : null);
                                    const pricePerGaj = rawPlot.pricePerGaj || (rawPlot.pricePerSqFt ? (toNumber(rawPlot.pricePerSqFt) * 9).toFixed(2) : null);

                                    // Derived values
                                    const plotNo = rawPlot.plotNo || rawPlot.plotNumber || '-';
                                    const customerName = booking.userId?.name || booking.customerDetails?.name || rawPlot.customerName || 'Unknown';
                                    const colonyName = rawPlot.colonyId?.name || rawPlot.colony?.name || '-';
                                    const ownerType = rawPlot.ownerType || 'owner';
                                    const finalPricePerGaj = rawPlot.finalPrice || null;

                                    // Total Price and Paid Amount
                                    const displayTotalPrice = booking.totalAmount || rawPlot.totalPrice || (areaGaj && pricePerGaj ? toNumber(areaGaj) * toNumber(pricePerGaj) : 0);
                                    const paidAmount = booking.paidAmount || rawPlot.paidAmount || 0;
                                    const remaining = displayTotalPrice - paidAmount;
                                    const facing = rawPlot.facing || '-';
                                    const status = rawPlot.status || booking.status || 'Pending';

                                    const getStatusColor = (s) => {
                                        switch (String(s).toLowerCase()) {
                                            case 'available': return 'success'
                                            case 'booked': return 'warning'
                                            case 'sold': return 'error'
                                            case 'reserved': return 'info'
                                            case 'completed': return 'success'
                                            case 'confirmed': return 'success'
                                            default: return 'default'
                                        }
                                    }

                                    const getStatusStyle = (s) => {
                                        switch (String(s).toLowerCase()) {
                                            case 'available': return { bgcolor: '#e8f5e9', color: '#2e7d32' }
                                            case 'booked': return { bgcolor: '#fff3e0', color: '#ef6c00' }
                                            case 'sold': return { bgcolor: '#ffebee', color: '#c62828' }
                                            default: return {}
                                        }
                                    }

                                    return (
                                        <TableRow key={booking._id} hover>
                                            <TableCell>{plotNo}</TableCell>
                                            <TableCell>{colonyName}</TableCell>
                                            <TableCell>
                                                {ownerType === 'khatoniHolder' ? (
                                                    <Chip label="Khatoni Holder" size="small" color="info" />
                                                ) : (
                                                    <Chip label="Owner" size="small" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2">{customerName}</Typography>
                                                    {!booking.userId && (booking.customerDetails || rawPlot.customerName) && (
                                                        <Chip label="Manual" size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '0.625rem' }} />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{areaGaj ? Number(areaGaj).toFixed(3) : '-'}</TableCell>
                                            <TableCell>
                                                {finalPricePerGaj ? (
                                                    <Chip
                                                        label={`₹${Number(finalPricePerGaj).toLocaleString()}`}
                                                        size="small"
                                                        color="success"
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <strong>₹{Number(displayTotalPrice).toLocaleString()}</strong>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="success.main">
                                                    ₹{Number(paidAmount).toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} color={remaining > 0 ? 'error.main' : 'success.main'}>
                                                    ₹{Number(remaining).toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textTransform: 'capitalize' }}>{facing}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={status.toUpperCase()}
                                                    color={getStatusColor(status)}
                                                    size="small"
                                                    sx={getStatusStyle(status)}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<Visibility />}
                                                    onClick={() => navigate(`/admin/bookings/${booking._id}`, { state: { from: '/admin/sold-plots' } })}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[20, 50, 100]}
                    component="div"
                    count={filteredBookings.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
        </Box>
    )
}

export default SoldPlotManagement
