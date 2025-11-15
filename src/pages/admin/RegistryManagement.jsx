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
  MenuItem
} from '@mui/material'
import { Download, Visibility, Edit } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const RegistryManagement = () => {
  const [registries, setRegistries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedRegistry, setSelectedRegistry] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')

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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Registry Management
        </Typography>
        <TextField
          select
          size="small"
          label="Filter by Status"
          value={filterStatus}
          onChange={(e) => handleFilterChange(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Registries</MenuItem>
          <MenuItem value="generated">Generated</MenuItem>
          <MenuItem value="downloaded">Downloaded</MenuItem>
          <MenuItem value="under_review">Under Review</MenuItem>
          <MenuItem value="verified">Verified</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Registry #</strong></TableCell>
              <TableCell><strong>Booking #</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Plot</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Generated Date</strong></TableCell>
              <TableCell><strong>Downloads</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No registries found.
                </TableCell>
              </TableRow>
            ) : (
              registries.map((registry) => (
                <TableRow key={registry._id}>
                  <TableCell>{registry.registryNumber}</TableCell>
                  <TableCell>{registry.bookingId?.bookingNumber}</TableCell>
                  <TableCell>{registry.bookingId?.userId?.name}</TableCell>
                  <TableCell>{registry.bookingId?.plotId?.plotNo}</TableCell>
                  <TableCell>
                    <Chip
                      label={registry.status?.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(registry.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {registry.generatedAt ? format(new Date(registry.generatedAt), 'dd MMM yyyy') : '-'}
                  </TableCell>
                  <TableCell>{registry.downloadCount || 0}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleDownload(registry._id)}
                      title="Download PDF"
                    >
                      <Download fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenStatusDialog(registry)}
                      title="Update Status"
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
