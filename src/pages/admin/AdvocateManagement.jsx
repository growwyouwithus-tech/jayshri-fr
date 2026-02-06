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
    MenuItem,
    Chip
} from '@mui/material'
import { Search } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const AdvocateManagement = () => {
    const [advocates, setAdvocates] = useState([])
    const [loading, setLoading] = useState(true)
    const [showEntries, setShowEntries] = useState(100)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchAdvocates()
    }, [])

    const fetchAdvocates = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/users')
            const allUsers = data?.data || []

            // Filter only lawyers/advocates
            const advocateUsers = allUsers.filter(user => {
                const roleName = user.role?.name?.toLowerCase()
                return roleName === 'lawyer' || roleName === 'advocate'
            })

            // Fetch plots to calculate plot numbers and advocate fees
            const { data: plotsData } = await axios.get('/plots')
            console.log('Plots data:', plotsData) // Debug log

            // Handle different response structures
            // API returns: {success: true, data: {plots: [...], totalPlots: 10}}
            let plots = []
            if (Array.isArray(plotsData)) {
                plots = plotsData
            } else if (plotsData?.data?.plots && Array.isArray(plotsData.data.plots)) {
                plots = plotsData.data.plots
            } else if (plotsData?.data && Array.isArray(plotsData.data)) {
                plots = plotsData.data
            } else if (plotsData?.plots && Array.isArray(plotsData.plots)) {
                plots = plotsData.plots
            }

            console.log('Extracted plots array:', plots.length, 'plots') // Debug log

            // Aggregate data for each advocate
            const advocatesWithData = advocateUsers.map(advocate => {
                // Match plots by advocate code or advocate name
                const advocatePlots = plots.filter(p => {
                    return p.advocateCode === advocate.userCode ||
                        p.advocateName?.toLowerCase() === advocate.name?.toLowerCase()
                })

                const plotNumbers = advocatePlots.map(p => p.plotNumber || 'N/A')
                const totalPlots = advocatePlots.length

                // For advocates, we can calculate based on registry status or a fixed fee
                // Since there's no advocateFee field, we'll need to calculate or use a default
                // For now, let's assume a standard fee or calculate based on plot price
                const totalReceived = advocatePlots.reduce((sum, p) => {
                    // You can adjust this calculation based on your business logic
                    // For example: 1% of finalPrice or a fixed fee
                    const fee = p.finalPrice ? p.finalPrice * 0.01 : 0
                    return sum + fee
                }, 0)

                return {
                    ...advocate,
                    plotNumbers,
                    totalPlots,
                    totalReceived
                }
            })

            setAdvocates(advocatesWithData)
            setLoading(false)
        } catch (error) {
            console.error('Failed to fetch advocates:', error)
            toast.error('Failed to fetch advocates')
            setLoading(false)
        }
    }

    const filteredAdvocates = advocates.filter(advocate =>
        advocate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        advocate.phone?.includes(searchTerm) ||
        advocate.userCode?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, showEntries)

    // Calculate total
    const totalAmount = filteredAdvocates.reduce((sum, advocate) => sum + (advocate.totalReceived || 0), 0)

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
                            placeholder="Search by name, phone, or code"
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
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000', textAlign: 'center' }}>s.n.</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Advocate Name</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Mobile No</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Plot No</TableCell>
                            {/* <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000', textAlign: 'right' }}>Total Received Amount</TableCell> */}
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000', textAlign: 'center' }}>Total plot</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Advocate Code</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAdvocates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No advocates found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {filteredAdvocates.map((advocate, index) => (
                                    <TableRow key={advocate._id}>
                                        <TableCell align="center">{index + 1}</TableCell>
                                        <TableCell>{advocate.name}</TableCell>
                                        <TableCell>{advocate.phone || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={0.5} flexWrap="wrap">
                                                {advocate.plotNumbers && advocate.plotNumbers.length > 0 ? (
                                                    advocate.plotNumbers.map((plotNo, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={plotNo}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: '#e3f2fd',
                                                                border: '1px solid #2196f3',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    ))
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        {/* <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                ₹{advocate.totalReceived?.toLocaleString('en-IN') || 0}
                                            </Typography>
                                        </TableCell> */}
                                        <TableCell align="center">
                                            <Typography variant="body2" fontWeight={600}>
                                                {advocate.totalPlots || 0}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} color="primary">
                                                {advocate.userCode || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Total Row */}
                                {/* <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell colSpan={3} align="center">
                                        <Typography variant="h6" fontWeight="bold">Total</Typography>
                                    </TableCell>
                                    <TableCell></TableCell>
                                    <TableCell align="right">
                                        <Typography variant="h6" fontWeight="bold">
                                            ₹{totalAmount.toLocaleString('en-IN')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                </TableRow> */}
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default AdvocateManagement
