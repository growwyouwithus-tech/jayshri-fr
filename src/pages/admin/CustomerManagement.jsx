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
    CircularProgress,
    TextField,
    MenuItem
} from '@mui/material'
import { Search } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const CustomerManagement = () => {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showEntries, setShowEntries] = useState(100)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchCustomersFromPlots()
    }, [])

    const fetchCustomersFromPlots = async () => {
        try {
            setLoading(true)
            // Fetch all plots with high limit to ensure we get everything
            const { data } = await axios.get('/plots?limit=10000')

            console.log('🔍 Raw API Response:', data)

            // Extract plots array from response
            let plots = []
            if (Array.isArray(data)) {
                plots = data
            } else if (data?.data?.plots && Array.isArray(data.data.plots)) {
                plots = data.data.plots
            } else if (data?.data && Array.isArray(data.data)) {
                plots = data.data
            } else if (data?.plots && Array.isArray(data.plots)) {
                plots = data.plots
            }

            console.log('📊 Total plots fetched:', plots.length)
            console.log('📊 Sample plot:', plots[0])

            // Get all plots that have customer information and are booked or sold
            const plotsWithCustomers = plots.filter(plot =>
                plot.customerName &&
                plot.customerNumber &&
                ['booked', 'sold'].includes(plot.status?.toLowerCase())
            )

            console.log('👥 Plots with customers (booked/sold):', plotsWithCustomers.length)
            console.log('👥 Sample valid plot:', plotsWithCustomers[0])

            // Create a map to store unique customers by phone number
            const customerMap = new Map()

            plotsWithCustomers.forEach(plot => {
                const customerName = plot.customerName
                const customerPhone = plot.customerNumber

                if (customerName && customerPhone) {
                    const plotNumber = plot.plotNumber || plot.plotNo
                    const colonyName = plot.colony?.name || plot.colonyName || plot.colony || ''

                    // Create a unique key combining phone and name to handle shared numbers
                    const uniqueKey = `${customerPhone}_${customerName.toLowerCase().trim()}`

                    if (!customerMap.has(uniqueKey)) {
                        customerMap.set(uniqueKey, {
                            name: customerName,
                            phone: customerPhone,
                            plotCount: 1,
                            plots: [{ plotNo: plotNumber, colony: colonyName }]
                        })
                    } else {
                        // Customer entry exists, add plot if unique
                        const existing = customerMap.get(uniqueKey)

                        const alreadyExists = existing.plots.some(p => p.plotNo === plotNumber)
                        if (!alreadyExists) {
                            existing.plotCount += 1
                            existing.plots.push({ plotNo: plotNumber, colony: colonyName })
                        }
                    }
                }
            })

            // Convert map to array
            const uniqueCustomers = Array.from(customerMap.values())

            console.log('✅ Unique customers extracted:', uniqueCustomers.length)
            console.log('✅ Customers:', uniqueCustomers)

            setCustomers(uniqueCustomers)
            setLoading(false)
        } catch (error) {
            console.error('❌ Failed to fetch customers:', error)
            toast.error('Failed to fetch customers')
            setLoading(false)
        }
    }

    const filteredCustomers = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
    ).slice(0, showEntries)

    console.log('🔍 Filtered customers for display:', filteredCustomers.length, filteredCustomers)
    console.log('🔍 Search term:', searchTerm)
    console.log('🔍 Show entries:', showEntries)

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box>
            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)' }}>
                {/* Search Bar Inside Table */}
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                    <Box display="flex" gap={2} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Search by name or phone"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                            sx={{ flexGrow: 1, bgcolor: 'white' }}
                        />
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">Show:</Typography>
                            <TextField
                                select
                                size="small"
                                value={showEntries}
                                onChange={(e) => setShowEntries(e.target.value)}
                                sx={{ minWidth: 80, bgcolor: 'white' }}
                            >
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={25}>25</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                                <MenuItem value={100}>100</MenuItem>
                            </TextField>
                        </Box>
                    </Box>
                </Box>
                <Table stickyHeader sx={{ '& td, & th': { border: '1px solid #000' } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000', textAlign: 'center' }}>S.No.</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Customer Name</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Colony Name</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Plot No</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Mobile No</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No customers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer, index) => (
                                <TableRow key={`${customer.phone}-${index}`}>
                                    <TableCell align="center">{index + 1}</TableCell>
                                    <TableCell>{customer.name}</TableCell>
                                    <TableCell>
                                        {/* Show unique colony names for all plots */}
                                        {customer.plots
                                            ? [...new Set(customer.plots.map(p => p.colony).filter(Boolean))].join(', ') || '-'
                                            : '-'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {customer.plots?.map(p => p.plotNo).join(', ') || '-'}
                                    </TableCell>

                                    <TableCell>{customer.phone}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default CustomerManagement
