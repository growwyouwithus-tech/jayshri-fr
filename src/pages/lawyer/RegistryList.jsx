
import { useState, useEffect } from 'react'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, CircularProgress
} from '@mui/material'
import { Download, Visibility } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const RegistryList = () => {
  const [registries, setRegistries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRegistries()
  }, [])

  const fetchRegistries = async () => {
    try {
      const { data } = await axios.get('/registry')
      setRegistries(data.data.registries)
      setLoading(false)
    } catch (error) {
      toast.error('Failed to fetch registries')
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
                  <TableCell>{registry.registryNumber}</TableCell>
                  <TableCell>{registry.bookingId?.bookingNumber}</TableCell>
                  <TableCell>{registry.bookingId?.userId?.name}</TableCell>
                  <TableCell>{registry.bookingId?.plotId?.plotNo}</TableCell>
                  <TableCell>{registry.bookingId?.plotId?.colonyId?.name}</TableCell>
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
                  <TableCell align="right">
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
    </Box>
  )
}

export default RegistryList
