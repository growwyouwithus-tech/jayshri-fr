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

const AgentManagement = () => {
    const [agents, setAgents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showEntries, setShowEntries] = useState(100)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchAgents()
    }, [])

    const fetchAgents = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/users')
            const allUsers = data?.data || []

            // Filter only agents
            const agentUsers = allUsers.filter(user => {
                const roleName = user.role?.name?.toLowerCase()
                return roleName === 'agent'
            })

            // Fetch plots to calculate plot numbers and commission amounts
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

            // Aggregate data for each agent
            const agentsWithData = agentUsers.map(agent => {
                // Match plots by agent code or agent name
                const agentPlots = plots.filter(p => {
                    return p.agentCode === agent.userCode ||
                        p.agentName?.toLowerCase() === agent.name?.toLowerCase()
                })

                const plotNumbers = agentPlots.map(p => p.plotNumber || 'N/A')
                const totalPlots = agentPlots.length
                const totalReceived = agentPlots.reduce((sum, p) => {
                    return sum + (p.commissionAmount || 0)
                }, 0)

                return {
                    ...agent,
                    plotNumbers,
                    totalPlots,
                    totalReceived
                }
            })

            setAgents(agentsWithData)
            setLoading(false)
        } catch (error) {
            console.error('Failed to fetch agents:', error)
            toast.error('Failed to fetch agents')
            setLoading(false)
        }
    }

    const filteredAgents = agents.filter(agent =>
        agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone?.includes(searchTerm) ||
        agent.userCode?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, showEntries)

    // Calculate total
    const totalAmount = filteredAgents.reduce((sum, agent) => sum + (agent.totalReceived || 0), 0)

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
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Agent Name</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Mobile No</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Plot No</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000', textAlign: 'right' }}>Total Received Amount</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000', textAlign: 'center' }}>Total plot</TableCell>
                            <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Agent Code</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAgents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No agents found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {filteredAgents.map((agent, index) => (
                                    <TableRow key={agent._id}>
                                        <TableCell align="center">{index + 1}</TableCell>
                                        <TableCell>{agent.name}</TableCell>
                                        <TableCell>{agent.phone || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={0.5} flexWrap="wrap">
                                                {agent.plotNumbers && agent.plotNumbers.length > 0 ? (
                                                    agent.plotNumbers.map((plotNo, idx) => (
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
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                ₹{agent.totalReceived?.toLocaleString('en-IN') || 0}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" fontWeight={600}>
                                                {agent.totalPlots || 0}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} color="primary">
                                                {agent.userCode || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Total Row */}
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
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
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default AgentManagement
