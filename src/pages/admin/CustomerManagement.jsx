import { useState, useEffect, useMemo } from 'react'
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
    const [selectedColony, setSelectedColony] = useState('all')

    useEffect(() => {
        fetchCustomersFromPlots()
    }, [])

    const fetchCustomersFromPlots = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/plots?limit=10000')

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

            // Get all plots that have customer information assigned (any status)
            const plotsWithCustomers = plots.filter(plot =>
                plot.customerName &&
                plot.customerNumber
            )

            // Create a map to store unique customers by phone+name key
            // Use plot._id as the unique key so same plot number in different colonies are not deduped
            const customerMap = new Map()
            const seenPlotIds = new Set()

            plotsWithCustomers.forEach(plot => {
                const customerName = plot.customerName
                const customerPhone = plot.customerNumber

                if (customerName && customerPhone) {
                    // Use MongoDB _id to guarantee each plot is only counted once
                    const plotId = plot._id?.toString() || `${plot.plotNumber}_${plot.colony?._id || plot.colony}`
                    const plotNumber = plot.plotNumber || plot.plotNo
                    const colonyName = plot.colony?.name || plot.colonyName || ''

                    // Skip duplicate plots
                    if (seenPlotIds.has(plotId)) return
                    seenPlotIds.add(plotId)

                    // Group by phone + normalized name
                    const uniqueKey = `${customerPhone}_${customerName.toLowerCase().trim()}`

                    if (!customerMap.has(uniqueKey)) {
                        customerMap.set(uniqueKey, {
                            name: customerName,
                            phone: customerPhone,
                            plotCount: 1,
                            plots: [{ plotNo: plotNumber, colony: colonyName }]
                        })
                    } else {
                        const existing = customerMap.get(uniqueKey)
                        existing.plotCount += 1
                        existing.plots.push({ plotNo: plotNumber, colony: colonyName })
                    }
                }
            })

            setCustomers(Array.from(customerMap.values()))
            setLoading(false)
        } catch (error) {
            console.error('❌ Failed to fetch customers:', error)
            toast.error('Failed to fetch customers')
            setLoading(false)
        }
    }

    // Collect all unique colony names across all customers
    const allColonies = useMemo(() => {
        const coloniesSet = new Set()
        customers.forEach(c => {
            c.plots?.forEach(p => {
                if (p.colony) coloniesSet.add(p.colony)
            })
        })
        return [...coloniesSet].sort()
    }, [customers])

    // Apply search + colony filter
    const filteredCustomers = useMemo(() => {
        return customers
            .filter(customer => {
                const search = searchTerm.toLowerCase().trim()
                const matchesSearch =
                    !search ||
                    customer.name?.toLowerCase().includes(search) ||
                    customer.phone?.includes(search)

                const matchesColony =
                    selectedColony === 'all' ||
                    customer.plots?.some(p => p.colony === selectedColony)

                return matchesSearch && matchesColony
            })
            .slice(0, showEntries)
    }, [customers, searchTerm, selectedColony, showEntries])

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
                {/* Filters Inside Table */}
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                    <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                        {/* Search */}
                        <TextField
                            size="small"
                            placeholder="Search by name or phone"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                            sx={{ flexGrow: 1, minWidth: 200, bgcolor: 'white' }}
                        />

                        {/* Colony Filter */}
                        <TextField
                            select
                            size="small"
                            label="Colony"
                            value={selectedColony}
                            onChange={(e) => setSelectedColony(e.target.value)}
                            sx={{ minWidth: 200, bgcolor: 'white' }}
                        >
                            <MenuItem value="all">All Colonies</MenuItem>
                            {allColonies.map(colony => (
                                <MenuItem key={colony} value={colony}>{colony}</MenuItem>
                            ))}
                        </TextField>

                        {/* Show entries */}
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">Show:</Typography>
                            <TextField
                                select
                                size="small"
                                value={showEntries}
                                onChange={(e) => setShowEntries(Number(e.target.value))}
                                sx={{ minWidth: 80, bgcolor: 'white' }}
                            >
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={25}>25</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                                <MenuItem value={100}>100</MenuItem>
                                <MenuItem value={500}>500</MenuItem>
                            </TextField>
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                            Total: {filteredCustomers.length} customers
                        </Typography>
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
                                        {[...new Set(customer.plots?.map(p => p.colony).filter(Boolean))].join(', ') || '-'}
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
