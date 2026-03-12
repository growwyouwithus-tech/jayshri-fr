import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Pagination,
  Drawer,
  Checkbox,
  FormControlLabel,
  Divider,
  Breadcrumbs,
  Link,
  Tooltip,
  LinearProgress,
} from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Close as CloseIcon,
  CheckCircle,
  Cancel,
  Assignment,
  KeyboardArrowRight,
  EventNote,
  InsertDriveFile,
  TaskAlt,
  Gavel,
  Map as MapIcon,
} from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const getFileUrl = (url) => {
  if (!url) return '#'
  if (url.startsWith('http')) return url
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'
  return `${baseUrl}/${url}`
}

const SummaryCard = ({ title, value, icon, color }) => (
  <Card sx={{ borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none' }}>
    <CardContent sx={{ p: 2 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
        <Typography variant="h4" fontWeight={700}>
          {value}
        </Typography>
        <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 36, height: 36 }}>
          {icon}
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
)

const RegistryList = () => {
  const [registries, setRegistries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRegistry, setSelectedRegistry] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  
  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [colony, setColony] = useState('All')
  const [date, setDate] = useState('')

  useEffect(() => {
    fetchRegistries()
  }, [])

  const fetchRegistries = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/registry')
      const registriesData = data?.data || []
      setRegistries(registriesData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch registries:', error)
      setLoading(false)
    }
  }

  const handleOpenDetails = (registry) => {
    setSelectedRegistry(registry)
    setDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedRegistry(null)
  }

  const getStatusChip = (status) => {
    const configs = {
      'completed': { color: '#2E7D32', bg: '#E8F5E9', label: 'Verified' },
      'pending': { color: '#ED6C02', bg: '#FFF4E5', label: 'Pending' },
      'rejected': { color: '#D32F2F', bg: '#FFEBEE', label: 'Rejected' },
    }
    const config = configs[status?.toLowerCase()] || configs['pending']
    return (
      <Chip 
        label={config.label} 
        size="small" 
        sx={{ 
          bgcolor: config.bg, 
          color: config.color, 
          fontWeight: 700, 
          fontSize: '0.65rem',
          borderRadius: 1
        }} 
      />
    )
  }

  const [searchParams] = useSearchParams()
  const statusFilter = searchParams.get('status')

  // Mock data for display consistency
  const mockRows = [
    { id: '#REG-2026-042', name: 'Amit Kumar Sharma', phone: '9876543210', custId: 'BK-88210', plot: '402', block: 'Block A', colony: 'Green Valley Resideny', status: 'pending' },
    { id: '#REG-2026-039', name: 'Meera Deshmukh', phone: '9822110044', custId: 'BK-83115', plot: '12', block: 'Block C', colony: 'The Pine Heights', status: 'completed' },
    { id: '#REG-2026-035', name: 'Rajesh Koothrappali', phone: '9123456789', custId: 'BK-80150', plot: '50', block: 'Block B', colony: 'Grand Orchid Parks', status: 'rejected' },
  ]

  const rawRows = registries.length > 0 ? registries : mockRows

  // Combine filters: URL status + Local search + Local status dropdown
  const displayRows = rawRows.filter(row => {
    // 1. URL Status Filter (from Sidebar)
    if (statusFilter === 'verified' && row.status?.toLowerCase() !== 'completed') return false
    if (statusFilter === 'rejected' && row.status?.toLowerCase() !== 'rejected') return false

    // 2. Search Text
    if (search && !row.id?.toLowerCase().includes(search.toLowerCase()) && !row.name?.toLowerCase().includes(search.toLowerCase())) return false

    // 3. Status Dropdown
    if (status !== 'All' && row.status?.toLowerCase() !== status.toLowerCase()) {
       // Correction for completed/verified mapping
       if (status === 'Verified' && row.status?.toLowerCase() !== 'completed') return false
       if (status !== 'Verified' && row.status?.toLowerCase() !== status.toLowerCase()) return false
    }

    return true
  })

  // Calculate stats from registries data
  const statsCounts = {
    pending: registries.filter(r => r.status?.toLowerCase() === 'pending').length,
    verified: registries.filter(r => r.status?.toLowerCase() === 'completed').length,
    rejected: registries.filter(r => r.status?.toLowerCase() === 'rejected').length,
    total: registries.length
  }

  return (
    <Box>
      {/* List View */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Registry Documents
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and manage property legal documentation
        </Typography>
      </Box>
 
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Pending Registries" value={statsCounts.pending} icon={<Assignment />} color="#1976D2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Verified Total" value={statsCounts.verified} icon={<CheckCircle />} color="#2E7D32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Rejected" value={statsCounts.rejected} icon={<Cancel />} color="#D32F2F" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Total Documents" value={statsCounts.total} icon={<Gavel />} color="#666" />
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Card sx={{ borderRadius: 4, mb: 4, border: '1px solid #f0f0f0', boxShadow: 'none', p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Registry #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, bgcolor: '#F8F9FA' }
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              InputProps={{ sx: { borderRadius: 2, bgcolor: '#F8F9FA' } }}
            >
              <MenuItem value="All">Status: All</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Verified">Verified</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              value={colony}
              onChange={(e) => setColony(e.target.value)}
              InputProps={{ sx: { borderRadius: 2, bgcolor: '#F8F9FA' } }}
            >
              <MenuItem value="All">Colony: All</MenuItem>
              <MenuItem value="Green Valley">Green Valley</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              size="small"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputProps={{ 
                sx: { borderRadius: 2, bgcolor: '#F8F9FA' },
                startAdornment: (
                  <InputAdornment position="start">
                    <EventNote sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <IconButton sx={{ bgcolor: '#F8F9FA', borderRadius: 2 }}>
              <FilterIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: 4, border: '1px solid #f0f0f0', boxShadow: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F8F9FA' }}>
              <TableRow>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#5F6368' }}>REGISTRY #</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#5F6368' }}>CUSTOMER NAME</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#5F6368' }}>PLOT INFO</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#5F6368' }}>CHECKLIST</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#5F6368' }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayRows.map((row, idx) => (
                <TableRow key={idx} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetails(row)}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="#2E7D32">
                      {row.bookingNumber || row.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.plot?.plotNumber || row.custId || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{row.buyer?.name || row.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.buyer?.phone || row.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      Plot {row.plot?.plotNumber || row.plot}, {row.plot?.block || row.block || ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.plot?.colony?.name || row.colony}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2E7D32' }} />
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2E7D32' }} />
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: row.status === 'completed' ? '#2E7D32' : '#D32F2F' }} />
                    </Stack>
                  </TableCell>
                  <TableCell>{getStatusChip(row.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {displayRows.length} of {registries.length} documents
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" sx={{ textTransform: 'none', borderRadius: 2 }}>Previous</Button>
            <Button size="small" variant="outlined" sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7' }}>Next</Button>
          </Stack>
        </Box>
      </Card>

      {/* Document Overview Drawer */}
      <Drawer
        anchor="right"
        open={detailsOpen}
        onClose={handleCloseDetails}
        PaperProps={{ sx: { width: { xs: '100%', md: '85vw' }, maxWidth: 1000, p: 0 } }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#F8F9FA' }}>
          {/* Header */}
          <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Registry Documents {' > '} Document Overview
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                Document Overview: {selectedRegistry?.bookingNumber || selectedRegistry?.id || 'N/A'} 
                <Chip 
                  label={selectedRegistry?.status || 'Pending'} 
                  size="small" 
                  sx={{ 
                    ml: 2, 
                    bgcolor: selectedRegistry?.status === 'completed' ? '#E8F5E9' : '#FFF4E5', 
                    color: selectedRegistry?.status === 'completed' ? '#2E7D32' : '#ED6C02', 
                    fontWeight: 700, 
                    fontSize: '0.65rem', 
                    borderRadius: 1 
                  }} 
                />
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
               <Button size="small" startIcon={<DownloadIcon />} variant="outlined" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>Download All</Button>
               <IconButton onClick={handleCloseDetails}><CloseIcon /></IconButton>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            <Grid container spacing={3}>
              {/* Left Side - Main Content */}
              <Grid item xs={12} lg={8}>
                {/* Customer Summary Card */}
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Customer & Plot Summary</Typography>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Customer Name', value: selectedRegistry?.buyer?.name || selectedRegistry?.name },
                      { label: 'Phone', value: selectedRegistry?.buyer?.phone },
                      { label: 'S/O, D/O, W/O', value: selectedRegistry?.customerSonOf || selectedRegistry?.customerWifeOf || selectedRegistry?.customerDaughterOf },
                      { label: 'Aadhar Number', value: selectedRegistry?.customerAadharNumber },
                      { label: 'PAN Number', value: selectedRegistry?.customerPanNumber },
                      { label: 'Date of Birth', value: selectedRegistry?.customerDateOfBirth },
                      { label: 'Address', value: selectedRegistry?.customerFullAddress || selectedRegistry?.buyer?.address },
                      { label: 'Client Code', value: selectedRegistry?.clientCode },
                      { label: 'Nominee', value: selectedRegistry?.nominee },
                      { label: 'Nominee Relation', value: selectedRegistry?.nomineeRelation },
                      { label: 'Booking Number', value: selectedRegistry?.bookingNumber },
                    ].map(({ label, value }) => (
                      <Grid item xs={12} sm={6} key={label}>
                        <Typography variant="caption" color="text.secondary">{label}:</Typography>
                        <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
                      </Grid>
                    ))}
                    <Grid item xs={12}><Divider /></Grid>
                    {[
                      { label: 'Colony', value: selectedRegistry?.plot?.colony?.name },
                      { label: 'Plot Number', value: selectedRegistry?.plot?.plotNumber },
                      { label: 'Area (Gaj)', value: selectedRegistry?.areaGaj ? Number(selectedRegistry.areaGaj).toFixed(2) : null },
                      { label: 'Price/Gaj', value: selectedRegistry?.pricePerGaj ? `₹ ${Number(selectedRegistry.pricePerGaj).toLocaleString()}` : null },
                      { label: 'Total Value', value: selectedRegistry?.totalAmount ? `₹ ${Number(selectedRegistry.totalAmount).toLocaleString()}` : null, bold: true, color: '#2E7D32' },
                      { label: 'Paid Amount', value: selectedRegistry?.paidAmount ? `₹ ${Number(selectedRegistry.paidAmount).toLocaleString()}` : null },
                      { label: 'Khasara No', value: selectedRegistry?.khasaraNo },
                      { label: 'Tahsil', value: selectedRegistry?.tahsil },
                      { label: 'Mode of Payment', value: selectedRegistry?.modeOfPayment },
                      { label: 'Registry Date', value: selectedRegistry?.registryDate ? new Date(selectedRegistry.registryDate).toLocaleDateString('en-IN') : null },
                    ].map(({ label, value, bold, color }) => (
                      <Grid item xs={12} sm={6} key={label}>
                        <Typography variant="caption" color="text.secondary">{label}:</Typography>
                        <Typography variant="body2" fontWeight={bold ? 800 : 600} color={color || 'inherit'}>{value || '—'}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Card>

                {/* Tehsil Expenses Card */}
                {selectedRegistry?.tehsilExpenses && (
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>Tehsil / Registry Expenses</Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: 'Circle Rate (Gov.)', value: selectedRegistry.tehsilExpenses.govPriceCircleRate ? `₹ ${Number(selectedRegistry.tehsilExpenses.govPriceCircleRate).toLocaleString()}` : null },
                        { label: 'Plot Size (Mtr)', value: selectedRegistry.tehsilExpenses.plotSizeMtr },
                        { label: 'Price (Mtr)', value: selectedRegistry.tehsilExpenses.priceMtr ? `₹ ${Number(selectedRegistry.tehsilExpenses.priceMtr).toLocaleString()}` : null },
                        { label: 'Stamp Duty + ₹500', value: selectedRegistry.tehsilExpenses.stampDuty ? `₹ ${Number(selectedRegistry.tehsilExpenses.stampDuty).toLocaleString()}` : null },
                        { label: 'Receipt (1% + ₹500)', value: selectedRegistry.tehsilExpenses.receiptAmount ? `₹ ${Number(selectedRegistry.tehsilExpenses.receiptAmount).toLocaleString()}` : null },
                        { label: 'Gender', value: selectedRegistry.tehsilExpenses.gender },
                        { label: 'Advocate Fee', value: selectedRegistry.tehsilExpenses.advocateFee ? `₹ ${Number(selectedRegistry.tehsilExpenses.advocateFee).toLocaleString()}` : null },
                        { label: 'Total Expense', value: selectedRegistry.tehsilExpenses.totalExpense ? `₹ ${Number(selectedRegistry.tehsilExpenses.totalExpense).toLocaleString()}` : null, bold: true },
                        { label: 'Money Difference', value: selectedRegistry.tehsilExpenses.moneyDifference ? `₹ ${Number(selectedRegistry.tehsilExpenses.moneyDifference).toLocaleString()}` : null },
                        { label: 'Market Price/Sq.Yd', value: selectedRegistry.tehsilExpenses.marketPriceSqYard ? `₹ ${Number(selectedRegistry.tehsilExpenses.marketPriceSqYard).toLocaleString()}` : null },
                      ].map(({ label, value, bold }) => value ? (
                        <Grid item xs={12} sm={6} key={label}>
                          <Typography variant="caption" color="text.secondary">{label}:</Typography>
                          <Typography variant="body2" fontWeight={bold ? 800 : 600}>{value}</Typography>
                        </Grid>
                      ) : null)}
                    </Grid>
                  </Card>
                )}

                {/* Dynamic Documents Section */}
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>Document Checklist & Verification</Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {[
                      // Plot Customer Documents
                      ...(selectedRegistry?.plot?.customerDocuments ? [
                        { name: 'Aadhar Front', url: selectedRegistry.plot.customerDocuments.aadharFront, checked: !!selectedRegistry.plot.customerDocuments.aadharFront },
                        { name: 'Aadhar Back', url: selectedRegistry.plot.customerDocuments.aadharBack, checked: !!selectedRegistry.plot.customerDocuments.aadharBack },
                        { name: 'PAN Card', url: selectedRegistry.plot.customerDocuments.panCard, checked: !!selectedRegistry.plot.customerDocuments.panCard },
                        { name: 'Passport Photo', url: selectedRegistry.plot.customerDocuments.passportPhoto, checked: !!selectedRegistry.plot.customerDocuments.passportPhoto },
                      ] : []),
                      // Plot Registry Documents
                      ...(selectedRegistry?.plot?.registryDocument?.map((doc, idx) => ({
                        name: `Registry Document ${idx + 1}`,
                        url: doc,
                        checked: true
                      })) || []),
                      // Booking Documents
                      ...(selectedRegistry?.bookingData?.documents?.map(doc => ({
                        name: doc.name || 'Booking Document',
                        url: doc.url,
                        checked: true
                      })) || []),
                    ].length > 0 ? (
                      [
                        // Plot Customer Documents
                        ...(selectedRegistry?.plot?.customerDocuments ? [
                          { name: 'Aadhar Front', url: selectedRegistry.plot.customerDocuments.aadharFront, checked: !!selectedRegistry.plot.customerDocuments.aadharFront },
                          { name: 'Aadhar Back', url: selectedRegistry.plot.customerDocuments.aadharBack, checked: !!selectedRegistry.plot.customerDocuments.aadharBack },
                          { name: 'PAN Card', url: selectedRegistry.plot.customerDocuments.panCard, checked: !!selectedRegistry.plot.customerDocuments.panCard },
                          { name: 'Passport Photo', url: selectedRegistry.plot.customerDocuments.passportPhoto, checked: !!selectedRegistry.plot.customerDocuments.passportPhoto },
                        ] : []),
                        // Plot Registry Documents
                        ...(selectedRegistry?.plot?.registryDocument?.map((doc, idx) => ({
                          name: `Registry Document ${idx + 1}`,
                          url: doc,
                          checked: true
                        })) || []),
                        // Booking Documents
                        ...(selectedRegistry?.bookingData?.documents?.map(doc => ({
                          name: doc.name || 'Booking Document',
                          url: doc.url,
                          checked: true
                        })) || []),
                      ].map((item, idx) => (
                        <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, border: '1px solid #f5f5f5', borderRadius: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <InsertDriveFile sx={{ color: item.checked ? '#2E7D32' : '#999' }} />
                            <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={2} alignItems="center">
                            {item.url && (
                              <Button 
                                size="small" 
                                startIcon={<VisibilityIcon />} 
                                sx={{ textTransform: 'none', color: '#2E7D32', fontSize: '0.75rem' }}
                                onClick={() => window.open(getFileUrl(item.url), '_blank')}
                              >
                                View
                              </Button>
                            )}
                            <Checkbox checked={item.checked} size="small" sx={{ color: '#2E7D32', '&.Mui-checked': { color: '#2E7D32' } }} />
                          </Stack>
                        </Stack>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                        No documents uploaded for this registry.
                      </Typography>
                    )}
                  </Stack>
                </Card>

                {/* Remarks */}
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>Advocate Remarks & Instructions</Typography>
                  <TextField 
                    fullWidth 
                    multiline 
                    rows={4} 
                    placeholder="Enter notes or correction requests here..." 
                    sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fafafa' } }}
                  />
                </Card>

                {/* Actions */}
                <Box sx={{ mt: 2, pb: 4 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Button fullWidth variant="contained" sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, textTransform: 'none', py: 1.5, borderRadius: 2, fontWeight: 700 }} startIcon={<CheckCircle />}>Verify & Approve</Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button fullWidth variant="contained" sx={{ bgcolor: '#ED6C02', '&:hover': { bgcolor: '#E65100' }, textTransform: 'none', py: 1.5, borderRadius: 2, fontWeight: 700 }} startIcon={<Assignment />}>Request Correction</Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button fullWidth variant="contained" sx={{ bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' }, textTransform: 'none', py: 1.5, borderRadius: 2, fontWeight: 700 }} startIcon={<Cancel />}>Reject Document</Button>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Right Side - Meta Info */}
              <Grid item xs={12} lg={4}>
                {/* Summary Info Card */}
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Summary Info</Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {[
                      { label: 'Registry Status', value: selectedRegistry?.status || '—' },
                      { label: 'Booking Date', value: selectedRegistry?.bookingDate ? new Date(selectedRegistry.bookingDate).toLocaleDateString('en-IN') : '—' },
                      { label: 'Agent Name', value: selectedRegistry?.agentName },
                      { label: 'Agent Phone', value: selectedRegistry?.agentPhone },
                      { label: 'Commission', value: selectedRegistry?.commissionAmount ? `₹ ${Number(selectedRegistry.commissionAmount).toLocaleString()} (${selectedRegistry.commissionPercentage || 0}%)` : null },
                      { label: 'Advocate', value: selectedRegistry?.advocateName },
                      { label: 'Adv. Phone', value: selectedRegistry?.advocatePhone },
                      { label: 'Referral Code', value: selectedRegistry?.referralCode },
                      { label: 'PLC (Corner)', value: selectedRegistry?.plc?.isCorner ? `Yes — ${selectedRegistry.plc.percentage || 0}%` : 'No' },
                      { label: 'More Info', value: selectedRegistry?.moreInformation },
                    ].map(({ label, value }) => value ? (
                      <Box key={label}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{value}</Typography>
                      </Box>
                    ) : null)}
                  </Stack>
                </Card>

                {/* Timeline */}
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Activity Timeline</Typography>
                  <Stack spacing={3} sx={{ mt: 3 }}>
                    {[
                      { title: 'Documents Uploaded', user: 'Admin Sarah J.', time: 'TODAY: 09:42 AM', color: '#2E7D32' },
                      { title: 'Advocate Viewed', user: 'Access from Head Office IP', time: 'TODAY: 11:20 AM', color: '#999' },
                      { title: 'Internal Comment Added', user: '"Checked Aadhaar validity."', time: 'TODAY: 11:45 AM', color: '#ED6C02' },
                      { title: 'Final Approval Pending', user: 'AWAITING ACTION', time: '', color: '#ddd' },
                    ].map((step, idx) => (
                      <Stack key={idx} direction="row" spacing={2}>
                        <Box sx={{ position: 'relative' }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: step.color, fontSize: 10 }}>{idx+1}</Avatar>
                          {idx < 3 && <Box sx={{ position: 'absolute', top: 32, left: 15, width: 2, height: 24, bgcolor: '#f0f0f0' }} />}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>{step.title}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>By {step.user}</Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{step.time}</Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </Card>

                {/* Small Map Placeholder */}
                <Card sx={{ borderRadius: 3, overflow: 'hidden', height: 120, border: '1px solid #f0f0f0', boxShadow: 'none' }}>
                  <Box sx={{ position: 'relative', height: '100%', bgcolor: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapIcon sx={{ fontSize: 40, color: '#2196F3', opacity: 0.5 }} />
                    <Box sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(255,255,255,0.9)', p: 0.5, px: 1, borderRadius: 1 }}>
                       <Typography variant="caption" fontWeight={700}>Sector 45, Green Valley</Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Drawer>
    </Box>
  )
}

export default RegistryList
