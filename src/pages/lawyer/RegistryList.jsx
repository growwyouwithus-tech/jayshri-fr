
import { useState, useEffect } from 'react'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Divider
} from '@mui/material'
import { Download, Visibility, Close } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const RegistryList = () => {
  const [registries, setRegistries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRegistry, setSelectedRegistry] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    fetchRegistries()
  }, [])

  const fetchRegistries = async () => {
    try {
      const { data } = await axios.get('/registry')
      console.log('[API Response]', data)
      // Handle different response structures
      const registriesData = data?.data?.registries || data?.registries || data?.data || []
      setRegistries(Array.isArray(registriesData) ? registriesData : [])
      setLoading(false)
    } catch (error) {
      console.error('[API Error]', error)
      toast.error('Failed to fetch registries')
      setRegistries([])
      setLoading(false)
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

  const handleViewDetails = (registry) => {
    setSelectedRegistry(registry)
    setDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedRegistry(null)
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

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Registry Documents
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Registry #</strong></TableCell>
              <TableCell><strong>Booking #</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Plot</strong></TableCell>
              <TableCell><strong>Colony</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Generated Date</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No registries found</TableCell>
              </TableRow>
            ) : (
              registries.map((registry) => (
                <TableRow key={registry._id}>
                  <TableCell>{registry.bookingNumber || 'N/A'}</TableCell>
                  <TableCell>{registry.bookingNumber || 'N/A'}</TableCell>
                  <TableCell>{registry.buyer?.name || registry.plot?.customerName || 'N/A'}</TableCell>
                  <TableCell>{registry.plot?.plotNumber || 'N/A'}</TableCell>
                  <TableCell>{registry.plot?.colony?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={registry.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                      color={getStatusColor(registry.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {registry.bookingDate ? format(new Date(registry.bookingDate), 'dd MMM yyyy') : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewDetails(registry)}
                      title="View Details"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleDownload(registry._id)}
                      title="Download PDF"
                    >
                      <Download fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Registry Details</Typography>
            <IconButton onClick={handleCloseDetails}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRegistry && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Plot Information</Typography>
                <Typography variant="body2"><strong>Plot No:</strong> {selectedRegistry.plot?.plotNumber}</Typography>
                <Typography variant="body2"><strong>Colony:</strong> {selectedRegistry.plot?.colony?.name}</Typography>
                <Typography variant="body2"><strong>Area:</strong> {selectedRegistry.plot?.area} sq ft</Typography>
                <Typography variant="body2"><strong>Status:</strong> {selectedRegistry.plot?.status}</Typography>
                <Typography variant="body2"><strong>Owner Type:</strong> {selectedRegistry.plot?.ownerType}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Seller Information - Owner or Khatoni Holder */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Seller Information</Typography>
                {selectedRegistry.plot?.ownerType === 'owner' && selectedRegistry.plot?.propertyId?.userId && (
                  <>
                    <Typography variant="body2"><strong>Name:</strong> {selectedRegistry.plot.propertyId.userId.name}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {selectedRegistry.plot.propertyId.userId.email}</Typography>
                    <Typography variant="body2"><strong>Phone:</strong> {selectedRegistry.plot.propertyId.userId.phone}</Typography>
                  </>
                )}
                {selectedRegistry.plot?.ownerType === 'khatoniHolder' && (
                  <Typography variant="body2" color="text.secondary">Khatoni Holder (see below for details)</Typography>
                )}
              </Grid>

              {selectedRegistry.plot?.ownerType === 'owner' && selectedRegistry.plot?.propertyId?.userId?.documents && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Seller Documents (Owner)</Typography>
                  <Grid container spacing={2}>
                    {selectedRegistry.plot.propertyId.userId.documents.aadharFront && (
                      <Grid item xs={6} md={4}>
                        <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${selectedRegistry.plot.propertyId.userId.documents.aadharFront}`} target="_blank">
                          View Aadhar Front
                        </Button>
                      </Grid>
                    )}
                    {selectedRegistry.plot.propertyId.userId.documents.aadharBack && (
                      <Grid item xs={6} md={4}>
                        <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${selectedRegistry.plot.propertyId.userId.documents.aadharBack}`} target="_blank">
                          View Aadhar Back
                        </Button>
                      </Grid>
                    )}
                    {selectedRegistry.plot.propertyId.userId.documents.panCard && (
                      <Grid item xs={6} md={4}>
                        <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${selectedRegistry.plot.propertyId.userId.documents.panCard}`} target="_blank">
                          View PAN Card
                        </Button>
                      </Grid>
                    )}
                    {selectedRegistry.plot.propertyId.userId.documents.passportPhoto && (
                      <Grid item xs={6} md={4}>
                        <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${selectedRegistry.plot.propertyId.userId.documents.passportPhoto}`} target="_blank">
                          View Passport Photo
                        </Button>
                      </Grid>
                    )}
                    {selectedRegistry.plot.propertyId.userId.documents.fullPhoto && (
                      <Grid item xs={6} md={4}>
                        <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${selectedRegistry.plot.propertyId.userId.documents.fullPhoto}`} target="_blank">
                          View Full Photo
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Buyer/Customer Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Buyer Information</Typography>
                <Typography variant="body2"><strong>Name:</strong> {selectedRegistry.buyer?.name || selectedRegistry.plot?.customerName || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Phone:</strong> {selectedRegistry.buyer?.phone || selectedRegistry.plot?.customerNumber || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Address:</strong> {selectedRegistry.plot?.customerShortAddress || 'N/A'}</Typography>
              </Grid>

              {/* Buyer Documents */}
              {(selectedRegistry.buyer?.documents || selectedRegistry.plot?.customerDocuments) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Buyer Documents</Typography>
                  <Grid container spacing={2}>
                    {(selectedRegistry.buyer?.documents?.aadharFront || selectedRegistry.plot?.customerDocuments?.aadharFront) && (
                      <Grid item xs={6} md={4}>
                        <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${selectedRegistry.buyer?.documents?.aadharFront || selectedRegistry.plot?.customerDocuments?.aadharFront}`} target="_blank">
                          View Aadhar Front
                        </Button>
                      </Grid>
                    )}
                    {(selectedRegistry.buyer?.documents?.aadharBack || selectedRegistry.plot?.customerDocuments?.aadharBack) && (
                      <Grid item xs={6} md={4}>
                        <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${selectedRegistry.buyer?.documents?.aadharBack || selectedRegistry.plot?.customerDocuments?.aadharBack}`} target="_blank">
                          View Aadhar Back
                        </Button>
                      </Grid>
                    )}
                    {(selectedRegistry.buyer?.documents?.panCard || selectedRegistry.plot?.customerDocuments?.panCard) && (
                      <Grid item xs={6} md={4}>
                        <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${selectedRegistry.buyer?.documents?.panCard || selectedRegistry.plot?.customerDocuments?.panCard}`} target="_blank">
                          View PAN Card
                        </Button>
                      </Grid>
                    )}
                    {(selectedRegistry.buyer?.documents?.passportPhoto || selectedRegistry.plot?.customerDocuments?.passportPhoto) && (
                      <Grid item xs={6} md={4}>
                        <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${selectedRegistry.buyer?.documents?.passportPhoto || selectedRegistry.plot?.customerDocuments?.passportPhoto}`} target="_blank">
                          View Passport Photo
                        </Button>
                      </Grid>
                    )}
                    {(selectedRegistry.buyer?.documents?.fullPhoto || selectedRegistry.plot?.customerDocuments?.fullPhoto) && (
                      <Grid item xs={6} md={4}>
                        <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${selectedRegistry.buyer?.documents?.fullPhoto || selectedRegistry.plot?.customerDocuments?.fullPhoto}`} target="_blank">
                          View Full Photo
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {selectedRegistry.plot?.colony?.khatoniHolders && selectedRegistry.plot.colony.khatoniHolders.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Khatoni Holders</Typography>
                  {selectedRegistry.plot.colony.khatoniHolders.map((holder, index) => (
                    <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Khatoni Holder {index + 1}</Typography>
                      <Typography variant="body2"><strong>Name:</strong> {holder.name}</Typography>
                      <Typography variant="body2"><strong>Mobile:</strong> {holder.mobile}</Typography>
                      <Typography variant="body2"><strong>Address:</strong> {holder.address}</Typography>

                      {holder.documents && (
                        <Box mt={2}>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>Documents:</Typography>
                          <Grid container spacing={1}>
                            {holder.documents.aadharFront && (
                              <Grid item xs={6} md={4}>
                                <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${holder.documents.aadharFront}`} target="_blank">
                                  Aadhar Front
                                </Button>
                              </Grid>
                            )}
                            {holder.documents.aadharBack && (
                              <Grid item xs={6} md={4}>
                                <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${holder.documents.aadharBack}`} target="_blank">
                                  Aadhar Back
                                </Button>
                              </Grid>
                            )}
                            {holder.documents.panCard && (
                              <Grid item xs={6} md={4}>
                                <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${holder.documents.panCard}`} target="_blank">
                                  PAN Card
                                </Button>
                              </Grid>
                            )}
                            {holder.documents.passportPhoto && (
                              <Grid item xs={6} md={4}>
                                <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${holder.documents.passportPhoto}`} target="_blank">
                                  Passport Photo
                                </Button>
                              </Grid>
                            )}
                            {holder.documents.fullPhoto && (
                              <Grid item xs={6} md={4}>
                                <Button variant="outlined" size="small" fullWidth href={`${import.meta.env.VITE_API_URL}${holder.documents.fullPhoto}`} target="_blank">
                                  Full Photo
                                </Button>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RegistryList
