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
  Dialog,
  DialogContent,
} from '@mui/material'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
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
  PictureAsPdf,
  BrokenImage,
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

const isPdf = (url) => url && url.toLowerCase().includes('.pdf')

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

// Document thumbnail component
const DocThumbnail = ({ url, name, onPreview }) => {
  const fileUrl = getFileUrl(url)
  const pdf = isPdf(url)

  return (
    <Box
      onClick={() => onPreview(fileUrl, name, pdf)}
      sx={{
        width: 70,
        height: 70,
        border: '2px solid #e0e0e0',
        borderRadius: 2,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        flexShrink: 0,
        '&:hover': { borderColor: '#2E7D32', boxShadow: '0 2px 8px rgba(46,125,50,0.2)' },
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      {pdf ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <PictureAsPdf sx={{ color: '#D32F2F', fontSize: 30 }} />
          <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#D32F2F' }}>PDF</Typography>
        </Box>
      ) : (
        <img
          src={fileUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )}
      {/* Fallback icon if image fails to load */}
      <Box sx={{ display: 'none', flexDirection: 'column', alignItems: 'center', position: 'absolute', inset: 0, justifyContent: 'center' }}>
        <BrokenImage sx={{ color: '#999', fontSize: 28 }} />
      </Box>
    </Box>
  )
}

const RegistryList = () => {
  const [registries, setRegistries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRegistry, setSelectedRegistry] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  
  // Company witnesses from settings
  const [companyWitnesses, setCompanyWitnesses] = useState([])

  // Image preview popup
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewName, setPreviewName] = useState('')
  const [previewIsPdf, setPreviewIsPdf] = useState(false)
  const [advocateRemarks, setAdvocateRemarks] = useState('')
  const [updating, setUpdating] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [colony, setColony] = useState('All')
  const [date, setDate] = useState('')

  useEffect(() => {
    fetchRegistries()
    fetchCompanyWitnesses()
  }, [])

  const fetchCompanyWitnesses = async () => {
    try {
      const { data } = await axios.get('/settings')
      if (data.success && data.data?.companyWitnesses) {
        setCompanyWitnesses(data.data.companyWitnesses)
      }
    } catch (error) {
      console.error('Failed to fetch company witnesses:', error)
    }
  }

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
    setAdvocateRemarks(registry.plot?.registryRemarks || '')
    setDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedRegistry(null)
  }

  const handlePreview = (url, name, pdf = false) => {
    if (pdf) {
      window.open(url, '_blank')
      return
    }
    setPreviewUrl(url)
    setPreviewName(name)
    setPreviewIsPdf(pdf)
    setPreviewOpen(true)
  }

  const handleDownloadZIP = async () => {
    if (!selectedRegistry) return
    const zip = new JSZip()
    toast('Preparing structured ZIP...', { icon: '📦' })

    const addFileToZip = async (folder, url, baseName) => {
      if (!url) return
      try {
        const fileUrl = getFileUrl(url)
        const response = await fetch(fileUrl)
        const blob = await response.blob()
        const extension = isPdf(url) ? '.pdf' : '.jpg'
        folder.file(`${baseName}${extension}`, blob)
      } catch (error) {
        console.error(`Failed to add ${baseName} to ZIP:`, error)
      }
    }

    // --- 1. BUYER FOLDER ---
    const buyerFolder = zip.folder("1_Buyer")
    let buyerTxt = `BUYER DETAILS\n=============\n`
    buyerTxt += `Name: ${selectedRegistry.buyer?.name || selectedRegistry.name || '—'}\n`
    buyerTxt += `Phone: ${selectedRegistry.buyer?.phone || '—'}\n`
    buyerTxt += `Aadhar: ${selectedRegistry.customerAadharNumber || '—'}\n`
    buyerTxt += `PAN: ${selectedRegistry.customerPanNumber || '—'}\n`
    buyerTxt += `Address: ${selectedRegistry.customerFullAddress || selectedRegistry.buyer?.address || '—'}\n`
    buyerFolder.file("buyer_details.txt", buyerTxt)

    const buyerDocs = selectedRegistry.plot?.customerDocuments || {}
    await Promise.all([
      addFileToZip(buyerFolder, buyerDocs.aadharFront, "Aadhar_Front"),
      addFileToZip(buyerFolder, buyerDocs.aadharBack, "Aadhar_Back"),
      addFileToZip(buyerFolder, buyerDocs.panCard, "PAN_Card"),
      addFileToZip(buyerFolder, buyerDocs.passportPhoto, "Passport_Photo"),
      addFileToZip(buyerFolder, buyerDocs.fullPhoto, "Full_Photo"),
    ])

    // --- 2. WITNESSES FOLDER ---
    const witnessMainFolder = zip.folder("2_Witnesses")
    
    // Plot Witnesses
    const plotWitnesses = selectedRegistry.plot?.witnesses || []
    for (let i = 0; i < plotWitnesses.length; i++) {
      const w = plotWitnesses[i]
      const wFolder = witnessMainFolder.folder(`Plot_Witness_${i + 1}`)
      let wTxt = `WITNESS DETAILS (Plot-level)\n============================\n`
      wTxt += `Name: ${w.witnessName}\nPhone: ${w.witnessPhone}\nAddress: ${w.witnessAddress}\n`
      wFolder.file("details.txt", wTxt)
      
      const wDocs = w.witnessDocuments || {}
      await Promise.all([
        addFileToZip(wFolder, wDocs.aadharFront, "Aadhar_Front"),
        addFileToZip(wFolder, wDocs.aadharBack, "Aadhar_Back"),
        addFileToZip(wFolder, wDocs.panCard, "PAN_Card"),
        addFileToZip(wFolder, wDocs.passportPhoto, "Passport"),
        addFileToZip(wFolder, wDocs.fullPhoto, "Full_Photo"),
      ])
    }

    // Company Witnesses
    for (let i = 0; i < companyWitnesses.length; i++) {
      const cw = companyWitnesses[i]
      const cwFolder = witnessMainFolder.folder(`Company_Witness_${i + 1}`)
      let cwTxt = `WITNESS DETAILS (Company)\n=========================\n`
      cwTxt += `Name: ${cw.name}\nPhone: ${cw.phone}\nAddress: ${cw.address}\n`
      cwFolder.file("details.txt", cwTxt)
      
      const cwDocs = cw.documents || {}
      await Promise.all([
        addFileToZip(cwFolder, cwDocs.aadharFront, "Aadhar_Front"),
        addFileToZip(cwFolder, cwDocs.aadharBack, "Aadhar_Back"),
        addFileToZip(cwFolder, cwDocs.panCard, "PAN_Card"),
        addFileToZip(cwFolder, cwDocs.passportPhoto, "Passport"),
        addFileToZip(cwFolder, cwDocs.fullPhoto, "Full_Photo"),
      ])
    }

    // --- 3. OWNERS FOLDER ---
    const ownerMainFolder = zip.folder("3_Owners")
    const owners = selectedRegistry.plot?.plotOwners || []
    for (let i = 0; i < owners.length; i++) {
      const o = owners[i]
      const oFolder = ownerMainFolder.folder(`Owner_${i + 1}`)
      let oTxt = `OWNER DETAILS\n=============\n`
      oTxt += `Name: ${o.ownerName}\nPhone: ${o.ownerPhone}\nAddress: ${o.ownerAddress}\n`
      oFolder.file("details.txt", oTxt)
      
      const oDocs = o.ownerDocuments || {}
      await Promise.all([
        addFileToZip(oFolder, oDocs.aadharFront, "Aadhar_Front"),
        addFileToZip(oFolder, oDocs.aadharBack, "Aadhar_Back"),
        addFileToZip(oFolder, oDocs.panCard, "PAN_Card"),
        addFileToZip(oFolder, oDocs.passportPhoto, "Passport"),
        addFileToZip(oFolder, oDocs.fullPhoto, "Full_Photo"),
      ])
    }

    // --- 4. PLOT & REGISTRY FOLDER ---
    const plotFolder = zip.folder("4_Plot_and_Registry")
    let plotTxt = `PLOT & REGISTRY SUMMARY\n=======================\n`
    plotTxt += `Colony: ${selectedRegistry.plot?.colony?.name || '—'}\n`
    plotTxt += `Plot Number: ${selectedRegistry.plot?.plotNumber || selectedRegistry.plot?.plotNo || '—'}\n`
    plotTxt += `Area (Gaj): ${selectedRegistry.areaGaj || '—'}\n`
    plotTxt += `Price/Gaj: ${selectedRegistry.pricePerGaj || '—'}\n`
    plotTxt += `Khasara No: ${selectedRegistry.khasaraNo || '—'}\n`
    plotTxt += `\nDIMENSIONS:\n`
    plotTxt += `Dimensions: ${selectedRegistry.plot?.dimensions?.length || '—'} x ${selectedRegistry.plot?.dimensions?.width || '—'}\n`
    plotTxt += `\nADJACENT DETAILS:\n`
    plotTxt += `Front: ${selectedRegistry.plot?.dimensions?.front || '—'}\n`
    plotTxt += `Back: ${selectedRegistry.plot?.dimensions?.back || '—'}\n`
    plotTxt += `Left: ${selectedRegistry.plot?.dimensions?.left || '—'}\n`
    plotTxt += `Right: ${selectedRegistry.plot?.dimensions?.right || '—'}\n`
    plotFolder.file("plot_details.txt", plotTxt)

    // Plot Images
    const plotImages = selectedRegistry.plot?.plotImages || []
    const imgPromises = plotImages.map((url, i) => addFileToZip(plotFolder, url, `Plot_Image_${i + 1}`))
    
    // Registry Docs
    const regDocs = selectedRegistry.plot?.registryDocument
    if (Array.isArray(regDocs)) {
      regDocs.forEach((url, i) => imgPromises.push(addFileToZip(plotFolder, url, `Registry_Doc_${i + 1}`)))
    } else if (regDocs) {
      imgPromises.push(addFileToZip(plotFolder, regDocs, "Registry_Doc"))
    }
    
    if (selectedRegistry.plot?.registryPdf) {
      imgPromises.push(addFileToZip(plotFolder, selectedRegistry.plot.registryPdf, "Registry_PDF"))
    }
    if (selectedRegistry.plot?.paymentSlip) {
      imgPromises.push(addFileToZip(plotFolder, selectedRegistry.plot.paymentSlip, "Payment_Slip"))
    }

    await Promise.all(imgPromises)

    // --- GENERATE AND SAVE ---
    try {
      const content = await zip.generateAsync({ type: "blob" })
      const fileName = `Registry_Details_${selectedRegistry.plot?.plotNumber || 'Export'}.zip`
      saveAs(content, fileName)
      toast.success('Structured ZIP downloaded!')
    } catch (error) {
      console.error('ZIP generation failed:', error)
      toast.error('Failed to create ZIP')
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedRegistry?._id) return
    
    try {
      setUpdating(true)
      const { data } = await axios.put(`/registry/${selectedRegistry._id}/status`, {
        status: newStatus,
        remarks: advocateRemarks
      })

      if (data.success) {
        toast.success(`Registry status updated to ${newStatus.replace('_', ' ')}`)
        fetchRegistries() // Refresh list
        handleCloseDetails()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error(error.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusChip = (status) => {
    const configs = {
      'completed': { color: '#2E7D32', bg: '#E8F5E9', label: 'Verified' },
      'pending': { color: '#ED6C02', bg: '#FFF4E5', label: 'Pending' },
      'rejected': { color: '#D32F2F', bg: '#FFEBEE', label: 'Rejected' },
      'correction_requested': { color: '#ED6C02', bg: '#FFF3E0', label: 'Correction Required' },
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

  // Build document list from selectedRegistry
  const getDocumentList = (reg) => {
    if (!reg) return []
    const docs = []
    const cd = reg.plot?.customerDocuments
    if (cd?.aadharFront) docs.push({ name: 'Aadhar Front', url: cd.aadharFront })
    if (cd?.aadharBack) docs.push({ name: 'Aadhar Back', url: cd.aadharBack })
    if (cd?.panCard) docs.push({ name: 'PAN Card', url: cd.panCard })
    if (cd?.passportPhoto) docs.push({ name: 'Passport Photo', url: cd.passportPhoto })
    if (cd?.fullPhoto) docs.push({ name: 'Full Photo', url: cd.fullPhoto })
    // Registry documents from plot
    const regDocs = reg.plot?.registryDocument
    if (Array.isArray(regDocs)) {
      regDocs.forEach((doc, i) => docs.push({ name: `Registry Document ${i + 1}`, url: doc }))
    } else if (regDocs) {
      docs.push({ name: 'Registry Document', url: regDocs })
    }
    // Registry PDF
    if (reg.plot?.registryPdf) docs.push({ name: 'Registry PDF', url: reg.plot.registryPdf })
    // Payment slip
    if (reg.plot?.paymentSlip) docs.push({ name: 'Payment Slip', url: reg.plot.paymentSlip })
    // Booking documents
    const bDocs = reg.bookingData?.documents
    if (Array.isArray(bDocs)) {
      bDocs.forEach(doc => docs.push({ name: doc.name || 'Booking Document', url: doc.url }))
    }
    return docs
  }

  return (
    <Box>
      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <Box sx={{ position: 'relative', bgcolor: '#000' }}>
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
            <Typography variant="caption" sx={{ color: '#ccc', mb: 1 }}>{previewName}</Typography>
            <img
              src={previewUrl}
              alt={previewName}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 4 }}
            />
          </Box>
        </Box>
      </Dialog>

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
               <Button size="small" startIcon={<DownloadIcon />} variant="outlined"
                 sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                 onClick={handleDownloadZIP}
               >Download Details ZIP</Button>
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
                      { label: 'S/O', value: selectedRegistry?.customerSonOf },
                      { label: 'D/O', value: selectedRegistry?.customerDaughterOf },
                      { label: 'W/O', value: selectedRegistry?.customerWifeOf },
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
                      { label: 'Plot Number', value: selectedRegistry?.plot?.plotNumber || selectedRegistry?.plot?.plotNo },
                      { label: 'Area (Gaj)', value: selectedRegistry?.areaGaj ? Number(selectedRegistry.areaGaj).toFixed(2) : null },
                      { label: 'Price/Gaj', value: selectedRegistry?.pricePerGaj ? `₹ ${Number(selectedRegistry.pricePerGaj).toLocaleString()}` : null },
                      { label: 'Total Value', value: selectedRegistry?.totalAmount ? `₹ ${Number(selectedRegistry.totalAmount).toLocaleString()}` : (selectedRegistry?.plot?.totalPrice ? `₹ ${Number(selectedRegistry.plot.totalPrice).toLocaleString()}` : null), bold: true, color: '#2E7D32' },
                      { label: 'Final Price (per Gaj)', value: selectedRegistry?.finalPrice ? `₹ ${Number(selectedRegistry.finalPrice).toLocaleString()}` : null },
                      { label: 'Paid Amount', value: selectedRegistry?.paidAmount ? `₹ ${Number(selectedRegistry.paidAmount).toLocaleString()}` : null },
                      { label: 'Khasara No', value: selectedRegistry?.khasaraNo },
                      { label: 'Tahsil', value: selectedRegistry?.tahsil },
                      { label: 'Mode of Payment', value: selectedRegistry?.modeOfPayment },
                      { label: 'Registry Date', value: selectedRegistry?.registryDate ? new Date(selectedRegistry.registryDate).toLocaleDateString('en-IN') : null },
                      { label: 'Transaction Date', value: selectedRegistry?.transactionDate ? new Date(selectedRegistry.transactionDate).toLocaleDateString('en-IN') : null },
                    ].map(({ label, value, bold, color }) => (
                      <Grid item xs={12} sm={6} key={label}>
                        <Typography variant="caption" color="text.secondary">{label}:</Typography>
                        <Typography variant="body2" fontWeight={bold ? 800 : 600} color={color || 'inherit'}>{value || '—'}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Card>

                {/* Plot Description Card */}
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Plot Description</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Plot Size (Area)</Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {selectedRegistry?.areaGaj ? `${Number(selectedRegistry.areaGaj).toFixed(3)} Gaj` : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Sold Price per Gaj</Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {selectedRegistry?.pricePerGaj ? `₹${Number(selectedRegistry.pricePerGaj).toLocaleString()}` : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Plot Dimension</Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {selectedRegistry?.plot?.dimensions?.length && selectedRegistry?.plot?.dimensions?.width
                          ? `${selectedRegistry.plot.dimensions.length} × ${selectedRegistry.plot.dimensions.width}`
                          : '—'}
                      </Typography>
                      {selectedRegistry?.plot?.dimensions?.frontage && (
                        <Typography variant="caption" color="text.secondary">
                          Front: {selectedRegistry.plot.dimensions.frontage || '—'} |
                          Back: {selectedRegistry.plot.dimensions.width || '—'} |
                          Left: {selectedRegistry.plot.dimensions.length || '—'} |
                          Right: {selectedRegistry.plot.dimensions.width || '—'}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>

                  {/* Adjacent Details */}
                  {(selectedRegistry?.plot?.dimensions?.front ||
                    selectedRegistry?.plot?.dimensions?.back ||
                    selectedRegistry?.plot?.dimensions?.left ||
                    selectedRegistry?.plot?.dimensions?.right) && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" fontWeight={700} gutterBottom>Adjacent Details</Typography>
                      <Grid container spacing={2}>
                        {[
                          { label: 'Front', value: selectedRegistry.plot.dimensions.front },
                          { label: 'Back', value: selectedRegistry.plot.dimensions.back },
                          { label: 'Left', value: selectedRegistry.plot.dimensions.left },
                          { label: 'Right', value: selectedRegistry.plot.dimensions.right },
                        ].map(({ label, value }) => (
                          <Grid item xs={6} sm={3} key={label}>
                            <Typography variant="caption" color="text.secondary">{label}</Typography>
                            <Typography variant="body2" fontWeight={700} color={label === 'Left' || label === 'Right' ? '#1565C0' : 'inherit'}>
                              {value || '—'}
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
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

                {/* Document Checklist with Image Thumbnails */}
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>Document Checklist & Verification</Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {(() => {
                      const docs = getDocumentList(selectedRegistry)
                      return docs.length > 0 ? docs.map((item, idx) => (
                        <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center"
                          sx={{ p: 1.5, border: '1px solid #f5f5f5', borderRadius: 2, gap: 2 }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                            {/* Image Thumbnail */}
                            <DocThumbnail url={item.url} name={item.name} onPreview={handlePreview} />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: '#2E7D32', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => handlePreview(getFileUrl(item.url), item.name, isPdf(item.url))}
                              >
                                Click to view full size
                              </Typography>
                            </Box>
                          </Stack>
                          <Checkbox checked={true} size="small" sx={{ color: '#2E7D32', '&.Mui-checked': { color: '#2E7D32' } }} />
                        </Stack>
                      )) : (
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                          No documents uploaded for this registry.
                        </Typography>
                      )
                    })()}
                  </Stack>
                </Card>

                {/* Company Witnesses (from Settings) */}
                {companyWitnesses?.length > 0 && (
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Witness Details <Typography component="span" variant="caption" color="text.secondary">(Company Witnesses)</Typography>
                    </Typography>
                    <Stack spacing={2}>
                      {companyWitnesses.map((w, idx) => (
                        <Box key={idx} sx={{ p: 2, border: '2px solid #e8f5e9', borderRadius: 2, bgcolor: '#fafafa' }}>
                          <Typography variant="body2" fontWeight={800} color="#2E7D32" sx={{ mb: 1.5 }}>
                            WITNESS NO {idx + 1}
                          </Typography>
                          <Grid container spacing={1}>
                            {[
                              { label: 'NAME', value: w.name || w.witnessName },
                              { label: 'PHONE', value: w.mobile || w.phone || w.witnessPhone },
                              { label: 'ADDRESS', value: w.address || w.witnessAddress },
                              { label: 'AADHAR NO', value: w.aadharNumber || w.witnessAadharNumber },
                              { label: 'PAN NO', value: w.panNumber || w.witnessPanNumber },
                              { label: 'DOB', value: w.dateOfBirth || w.witnessDateOfBirth },
                              { label: 'S/O', value: w.sonOf || w.witnessSonOf },
                              { label: 'D/O', value: w.daughterOf || w.witnessDaughterOf },
                              { label: 'W/O', value: w.wifeOf || w.witnessWifeOf },
                            ].filter(f => f.value).map(({ label, value }) => (
                              <Grid item xs={12} sm={6} key={label}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}:</Typography>
                                <Typography variant="body2">{value}</Typography>
                              </Grid>
                            ))}
                          </Grid>
                          {/* Company Witness Documents */}
                          {w.documents && Object.values(w.documents).some(Boolean) && (
                            <Box sx={{ mt: 2 }}>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {[
                                  { label: 'Aadhar Front', url: w.documents.aadharFront },
                                  { label: 'Aadhar Back', url: w.documents.aadharBack },
                                  { label: 'PAN Card', url: w.documents.panCard },
                                  { label: 'Passport', url: w.documents.passportPhoto },
                                  { label: 'Full Photo', url: w.documents.fullPhoto },
                                ].filter(d => d.url).map((doc, di) => (
                                  <Box key={di} sx={{ textAlign: 'center' }}>
                                    <DocThumbnail url={doc.url} name={doc.label} onPreview={handlePreview} />
                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.6rem' }}>{doc.label}</Typography>
                                  </Box>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Card>
                )}

                {/* Witness Details (Plot-level witnesses) */}
                {selectedRegistry?.plot?.witnesses?.length > 0 && (
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Witness Details
                    </Typography>
                    <Stack spacing={2}>
                      {selectedRegistry.plot.witnesses.map((w, idx) => (
                        <Box key={idx} sx={{ p: 2, border: '2px solid #e8f5e9', borderRadius: 2, bgcolor: '#fafafa' }}>
                          <Typography variant="body2" fontWeight={800} color="#2E7D32" sx={{ mb: 1.5 }}>
                            WITNESS NO {idx + 1}
                          </Typography>
                          <Grid container spacing={1}>
                            {[
                              { label: 'NAME', value: w.witnessName },
                              { label: 'PHONE', value: w.witnessPhone },
                              { label: 'ADDRESS', value: w.witnessAddress },
                              { label: 'AADHAR NO', value: w.witnessAadharNumber },
                              { label: 'PAN NO', value: w.witnessPanNumber },
                              { label: 'DOB', value: w.witnessDateOfBirth },
                              { label: 'S/O', value: w.witnessSonOf },
                              { label: 'D/O', value: w.witnessDaughterOf },
                              { label: 'W/O', value: w.witnessWifeOf },
                            ].filter(f => f.value).map(({ label, value }) => (
                              <Grid item xs={12} sm={6} key={label}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}:</Typography>
                                <Typography variant="body2">{value}</Typography>
                              </Grid>
                            ))}
                          </Grid>
                          {/* Witness Documents */}
                          {w.witnessDocuments && Object.values(w.witnessDocuments).some(Boolean) && (
                            <Box sx={{ mt: 2 }}>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {[
                                  { label: 'Aadhar Front', url: w.witnessDocuments.aadharFront },
                                  { label: 'Aadhar Back', url: w.witnessDocuments.aadharBack },
                                  { label: 'PAN Card', url: w.witnessDocuments.panCard },
                                  { label: 'Passport', url: w.witnessDocuments.passportPhoto },
                                  { label: 'Full Photo', url: w.witnessDocuments.fullPhoto },
                                ].filter(d => d.url).map((doc, di) => (
                                  <Box key={di} sx={{ textAlign: 'center' }}>
                                    <DocThumbnail url={doc.url} name={doc.label} onPreview={handlePreview} />
                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.6rem' }}>{doc.label}</Typography>
                                  </Box>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Card>
                )}

                {/* Plot Owners */}
                {selectedRegistry?.plot?.plotOwners?.length > 0 && (
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Plot Owners
                    </Typography>
                    <Stack spacing={2}>
                      {selectedRegistry.plot.plotOwners.map((o, idx) => (
                        <Box key={idx} sx={{ p: 2, border: '2px solid #e3f2fd', borderRadius: 2, bgcolor: '#fafafa' }}>
                          <Typography variant="body2" fontWeight={800} color="#1565C0" sx={{ mb: 1.5 }}>
                            OWNER NO {idx + 1}
                          </Typography>
                          <Grid container spacing={1}>
                            {[
                              { label: 'NAME', value: o.ownerName },
                              { label: 'PHONE', value: o.ownerPhone },
                              { label: 'ADDRESS', value: o.ownerAddress },
                              { label: 'AADHAR NO', value: o.ownerAadharNumber },
                              { label: 'PAN NO', value: o.ownerPanNumber },
                              { label: 'DOB', value: o.ownerDateOfBirth },
                              { label: 'S/O', value: o.ownerSonOf },
                              { label: 'D/O', value: o.ownerDaughterOf },
                              { label: 'W/O', value: o.ownerWifeOf },
                            ].filter(f => f.value).map(({ label, value }) => (
                              <Grid item xs={12} sm={6} key={label}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}:</Typography>
                                <Typography variant="body2">{value}</Typography>
                              </Grid>
                            ))}
                          </Grid>
                          {/* Owner Documents */}
                          {o.ownerDocuments && Object.values(o.ownerDocuments).some(Boolean) && (
                            <Box sx={{ mt: 2 }}>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {[
                                  { label: 'Aadhar Front', url: o.ownerDocuments.aadharFront },
                                  { label: 'Aadhar Back', url: o.ownerDocuments.aadharBack },
                                  { label: 'PAN Card', url: o.ownerDocuments.panCard },
                                  { label: 'Passport', url: o.ownerDocuments.passportPhoto },
                                  { label: 'Full Photo', url: o.ownerDocuments.fullPhoto },
                                ].filter(d => d.url).map((doc, di) => (
                                  <Box key={di} sx={{ textAlign: 'center' }}>
                                    <DocThumbnail url={doc.url} name={doc.label} onPreview={handlePreview} />
                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.6rem' }}>{doc.label}</Typography>
                                  </Box>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Card>
                )}



                {/* Plot Images */}
                {selectedRegistry?.plot?.plotImages?.length > 0 && (
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>Documents & Photos (Plot Images)</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {selectedRegistry.plot.plotImages.map((img, idx) => (
                        <Box key={idx} sx={{ textAlign: 'center' }}>
                          <DocThumbnail url={img} name={`Plot Image ${idx + 1}`} onPreview={handlePreview} />
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.6rem' }}>Plot Image {idx + 1}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Card>
                )}

                {/* Remarks */}
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: 'none', mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>Advocate Remarks & Instructions</Typography>
                  <TextField 
                    fullWidth 
                    multiline 
                    rows={4} 
                    placeholder="Enter notes or correction requests here..." 
                    value={advocateRemarks}
                    onChange={(e) => setAdvocateRemarks(e.target.value)}
                    sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fafafa' } }}
                  />
                </Card>

                {/* Actions */}
                <Box sx={{ mt: 2, pb: 4 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        disabled={updating}
                        onClick={() => handleUpdateStatus('completed')}
                        sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, textTransform: 'none', py: 1.5, borderRadius: 2, fontWeight: 700 }} 
                        startIcon={<CheckCircle />}
                      >
                        Verify & Approve
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        disabled={updating}
                        onClick={() => handleUpdateStatus('correction_requested')}
                        sx={{ bgcolor: '#ED6C02', '&:hover': { bgcolor: '#E65100' }, textTransform: 'none', py: 1.5, borderRadius: 2, fontWeight: 700 }} 
                        startIcon={<Assignment />}
                      >
                        Request Correction
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        disabled={updating}
                        onClick={() => handleUpdateStatus('rejected')}
                        sx={{ bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' }, textTransform: 'none', py: 1.5, borderRadius: 2, fontWeight: 700 }} 
                        startIcon={<Cancel />}
                      >
                        Reject Document
                      </Button>
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
                      { label: 'PLC (Corner)', value: selectedRegistry?.plc?.isCorner ? `Yes — ${selectedRegistry.plc.percentage || 0}%` : (selectedRegistry?.plc ? 'No' : null) },
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
                      { title: 'Documents Uploaded', user: 'Admin', time: new Date(selectedRegistry?.createdAt || Date.now()).toLocaleString('en-IN'), color: '#2E7D32' },
                      { title: 'Registry Submitted', user: 'System', time: new Date(selectedRegistry?.updatedAt || Date.now()).toLocaleString('en-IN'), color: '#1976D2' },
                      { title: 'Advocate Review', user: 'Pending Action', time: '', color: selectedRegistry?.status === 'completed' ? '#2E7D32' : '#ED6C02' },
                    ].map((step, idx) => (
                      <Stack key={idx} direction="row" spacing={2}>
                        <Box sx={{ position: 'relative' }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: step.color, fontSize: 10 }}>{idx+1}</Avatar>
                          {idx < 2 && <Box sx={{ position: 'absolute', top: 32, left: 15, width: 2, height: 24, bgcolor: '#f0f0f0' }} />}
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
                       <Typography variant="caption" fontWeight={700}>
                         {selectedRegistry?.plot?.colony?.name || 'Colony Location'}
                       </Typography>
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
