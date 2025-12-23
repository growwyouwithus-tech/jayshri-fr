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
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select
} from '@mui/material'
import { Download, Visibility, Edit, Add, ArrowBack } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const RegistryManagement = () => {
  const [registries, setRegistries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedRegistry, setSelectedRegistry] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [formData, setFormData] = useState({
    plotNo: '',
    dimension: '',
    sqYard: '',
    santoshJainPath: '',
    buyerName: '',
    partyMobileNo: '',
    regTime: '',
    partyAddress: '',
    plotBookedName: '',
    tahsilAdvName: '',
    lakhmiSharma: '',
    status: 'Pending'
  })

  useEffect(() => {
    fetchRegistries()
  }, [])

  const fetchRegistries = async (status = '') => {
    try {
      const url = status ? `/registry?status=${status}` : '/registry'
      const { data } = await axios.get(url)
      setRegistries(data.data || [])
      setLoading(false)
    } catch (error) {
      toast.error('Failed to fetch registries')
      setLoading(false)
    }
  }

  const handleFilterChange = (status) => {
    setFilterStatus(status)
    fetchRegistries(status)
  }

  const handleGeneratePDF = async (bookingId) => {
    try {
      await axios.post('/registry/generate', { bookingId })
      toast.success('Registry PDF generated successfully')
      fetchRegistries(filterStatus)
    } catch (error) {
      toast.error(error.response?.data?.message || 'PDF generation failed')
    }
  }

  const handleDownload = async (registryId) => {
    try {
      const response = await axios.get(`/registry/${registryId}/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `registry_${registryId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Registry downloaded')
    } catch (error) {
      toast.error('Download failed')
    }
  }

  const handleOpenStatusDialog = (registry) => {
    setSelectedRegistry(registry)
    setNewStatus(registry.status)
    setNote('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedRegistry(null)
    setNote('')
  }

  const handleUpdateStatus = async () => {
    try {
      await axios.patch(`/registry/${selectedRegistry._id}/status`, {
        status: newStatus,
        note
      })
      toast.success('Registry status updated')
      handleCloseDialog()
      fetchRegistries(filterStatus)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status update failed')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      generated: 'info',
      downloaded: 'warning',
      under_review: 'default',
      verified: 'success',
      completed: 'success'
    }
    return colors[status] || 'default'
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  // Show form if showForm is true
  if (showForm) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Add New Registry
          </Typography>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setShowForm(false)}>
            Back to Registry List
          </Button>
        </Box>
        
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Plot No *"
                value={formData.plotNo}
                onChange={(e) => setFormData({ ...formData, plotNo: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Dimension"
                value={formData.dimension}
                onChange={(e) => setFormData({ ...formData, dimension: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sq Yard"
                type="number"
                value={formData.sqYard}
                onChange={(e) => setFormData({ ...formData, sqYard: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Santosh/jain/umez/other</InputLabel>
                <Select
                  value={formData.santoshJainPath}
                  label="Santosh/jain/umez/other"
                  onChange={(e) => setFormData({ ...formData, santoshJainPath: e.target.value })}
                >
                  <MenuItem value="Santosh/jain/umez/other">Santosh/jain/umez/other</MenuItem>
                  <MenuItem value="Rajni/Avdesh">Rajni/Avdesh</MenuItem>
                  <MenuItem value="Satish devi/Lakhan Singh">Satish devi/Lakhan Singh</MenuItem>
                  <MenuItem value="Lakhmi Sharma">Lakhmi Sharma</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Buyer Name/PARTY NAME *"
                value={formData.buyerName}
                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PARTY Mobile NO *"
                value={formData.partyMobileNo}
                onChange={(e) => setFormData({ ...formData, partyMobileNo: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reg. Time"
                type="date"
                value={formData.regTime}
                onChange={(e) => setFormData({ ...formData, regTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="PARTY Address"
                value={formData.partyAddress}
                onChange={(e) => setFormData({ ...formData, partyAddress: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plot Booked Name"
                value={formData.plotBookedName}
                onChange={(e) => setFormData({ ...formData, plotBookedName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="TAHSIL ADV Name"
                value={formData.tahsilAdvName}
                onChange={(e) => setFormData({ ...formData, tahsilAdvName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lakhmi Sharma"
                value={formData.lakhmiSharma}
                onChange={(e) => setFormData({ ...formData, lakhmiSharma: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Kuldeep">Kuldeep</MenuItem>
                  <MenuItem value="Ramvilas">Ramvilas</MenuItem>
                  <MenuItem value="Sompal foji">Sompal foji</MenuItem>
                  <MenuItem value="Manish Dixit">Manish Dixit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
            <Button onClick={() => setShowForm(false)} size="large">Cancel</Button>
            <Button 
              onClick={async () => {
                try {
                  await axios.post('/registry', formData)
                  toast.success('Registry added successfully!')
                  setShowForm(false)
                  setFormData({
                    plotNo: '',
                    dimension: '',
                    sqYard: '',
                    santoshJainPath: '',
                    buyerName: '',
                    partyMobileNo: '',
                    regTime: '',
                    partyAddress: '',
                    plotBookedName: '',
                    tahsilAdvName: '',
                    lakhmiSharma: '',
                    status: 'Pending'
                  })
                  fetchRegistries()
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Failed to add registry')
                }
              }} 
              variant="contained" 
              size="large"
            >
              Add Registry
            </Button>
          </Box>
        </Paper>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Registry Management
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            select
            size="small"
            label="Filter by Status"
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Registries</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Kuldeep">Kuldeep</MenuItem>
            <MenuItem value="Ramvilas">Ramvilas</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowForm(true)}
          >
            Add Registry
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small" sx={{ '& td, & th': { border: '1px solid #000' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>PLOT NO</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Dimension</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Sq Yard</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Santosh/jain/umez/other</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Buyer Name/PARTY NAME</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>PARTY Mobile NO</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Reg. Time</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>PARTY Address</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Plot Booked Name</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>TAHSIL ADV Name</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Lakhmi Sharma</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Status</TableCell>
              <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} align="center">
                  No registries found.
                </TableCell>
              </TableRow>
            ) : (
              registries.map((registry, index) => (
                <TableRow key={registry._id} hover>
                  <TableCell>{registry.plotNo}</TableCell>
                  <TableCell>{registry.dimension}</TableCell>
                  <TableCell>{registry.sqYard}</TableCell>
                  <TableCell>{registry.santoshJainPath}</TableCell>
                  <TableCell>{registry.buyerName}</TableCell>
                  <TableCell>{registry.partyMobileNo}</TableCell>
                  <TableCell>{registry.regTime ? format(new Date(registry.regTime), 'dd-MMM-yy') : '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {registry.partyAddress}
                  </TableCell>
                  <TableCell>{registry.plotBookedName}</TableCell>
                  <TableCell>{registry.tahsilAdvName}</TableCell>
                  <TableCell>{registry.lakhmiSharma}</TableCell>
                  <TableCell>
                    <Chip
                      label={registry.status}
                      color={registry.status === 'Pending' ? 'warning' : registry.status === 'Completed' ? 'success' : 'default'}
                      size="small"
                      sx={{ 
                        backgroundColor: registry.status === 'Pending' ? '#FFF59D' : undefined,
                        color: registry.status === 'Pending' ? '#000' : undefined
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenStatusDialog(registry)}
                      title="Edit Registry"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Update Status Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Update Registry Status</DialogTitle>
        <DialogContent>
          {selectedRegistry && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Registry Number:</strong> {selectedRegistry.registryNumber}
              </Typography>
              <Typography variant="body2" gutterBottom mb={2}>
                <strong>Current Status:</strong> {selectedRegistry.status?.replace('_', ' ').toUpperCase()}
              </Typography>
              <TextField
                fullWidth
                select
                label="New Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="generated">Generated</MenuItem>
                <MenuItem value="downloaded">Downloaded</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Note (Optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                multiline
                rows={3}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RegistryManagement
