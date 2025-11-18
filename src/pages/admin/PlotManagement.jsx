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
  TextField,
  CircularProgress,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  InputLabel,
  FormControl,
  Grid,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const FACING_OPTIONS = [
  { label: 'North', value: 'north' },
  { label: 'South', value: 'south' },
  { label: 'East', value: 'east' },
  { label: 'West', value: 'west' },
  { label: 'North-East', value: 'northeast' },
  { label: 'North-West', value: 'northwest' },
  { label: 'South-East', value: 'southeast' },
  { label: 'South-West', value: 'southwest' },
]

const STATUS_OPTIONS = [
  { label: 'Available', value: 'available' },
  { label: 'Booked', value: 'booked' },
  { label: 'Sold', value: 'sold' },
  { label: 'Reserved', value: 'reserved' },
]

const PlotManagement = () => {
  const [plots, setPlots] = useState([])
  const [colonies, setColonies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterColony, setFilterColony] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingPlotId, setEditingPlotId] = useState(null)
  const [newPlot, setNewPlot] = useState({
    colonyId: '',
    plotNo: '',
    frontSide: '',
    backSide: '',
    leftSide: '',
    rightSide: '',
    areaGaj: '',
    pricePerGaj: '',
    totalPrice: '',
    facing: '',
    status: 'available',
    ownerType: 'owner',
  })

  const toNumber = (value) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }

  const resolveColonyId = (colonyRef) => {
    if (!colonyRef) return ''
    if (typeof colonyRef === 'string') return colonyRef
    if (typeof colonyRef === 'object') {
      if (colonyRef._id) return colonyRef._id
      if (colonyRef.id) return colonyRef.id
    }
    return ''
  }

  const getColonyFromState = (colonyRef) => {
    const colonyId = resolveColonyId(colonyRef)
    if (!colonyId) return null
    return colonies.find((colony) => colony._id === colonyId) || null
  }

  const getColonySellers = (colonyRef) => {
    const colonyFromState = getColonyFromState(colonyRef)
    if (colonyFromState && Array.isArray(colonyFromState.sellers)) {
      return colonyFromState.sellers
    }

    if (colonyRef && typeof colonyRef === 'object' && Array.isArray(colonyRef.sellers)) {
      return colonyRef.sellers
    }

    return []
  }

  const formatSellerLabel = (seller) => {
    if (!seller) return 'Seller'
    const name = seller.name || seller.fullName || seller.company || 'Seller'
    const phone = seller.mobile || seller.phone || seller.contact || seller.email || ''
    return phone ? `${name} (${phone})` : name
  }

  const renderSellerInfoSection = (colonyRef) => {
    if (!colonyRef) return null

    const sellers = getColonySellers(colonyRef)

    return (
      <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: 1, border: '1px solid #ececec' }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Colony Sellers / Owners
        </Typography>
        {sellers.length ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sellers.map((seller, index) => (
              <Chip
                key={seller?._id || seller?.id || `${seller?.name || 'seller'}-${index}`}
                label={formatSellerLabel(seller)}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No sellers added for this colony yet.
          </Typography>
        )}
      </Box>
    )
  }

  const gajToSqFt = (gaj) => toNumber(gaj) * 9
  const sqFtToGaj = (sqft) => {
    const num = toNumber(sqft)
    if (!num) return ''
    return Math.round((num / 9) * 100) / 100
  }

  const pricePerGajToSqFt = (pricePerGaj) => {
    const num = toNumber(pricePerGaj)
    if (!num) return 0
    return num / 9
  }

  const pricePerSqFtToGaj = (pricePerSqFt) => {
    const num = toNumber(pricePerSqFt)
    if (!num) return ''
    return Math.round(num * 9 * 100) / 100
  }

  const isNumericInput = (value) => value !== '' && !Number.isNaN(Number(value))

  const calculateTotalPriceFromArea = (areaGaj, pricePerGaj) => {
    if (!isNumericInput(areaGaj) || !isNumericInput(pricePerGaj)) return ''
    const total = Number(areaGaj) * Number(pricePerGaj)
    return Number.isFinite(total) ? total.toString() : ''
  }

  const calculatePricePerGajFromTotal = (totalPrice, areaGaj) => {
    if (!isNumericInput(totalPrice) || !isNumericInput(areaGaj) || Number(areaGaj) === 0) return ''
    const price = Number(totalPrice) / Number(areaGaj)
    if (!Number.isFinite(price)) return ''
    const formatted = price.toFixed(2)
    return formatted.endsWith('.00') ? parseInt(formatted, 10).toString() : formatted
  }

  const normalizePlotFromApi = (plot) => {
    const colonyRef = plot.colony || plot.colonyId
    return {
      ...plot,
      colonyId: colonyRef,
      plotNo: plot.plotNo || plot.plotNumber || '',
      areaGaj: plot.areaGaj ?? (plot.area ? sqFtToGaj(plot.area) : ''),
      pricePerGaj: plot.pricePerGaj ?? (plot.pricePerSqFt ? pricePerSqFtToGaj(plot.pricePerSqFt) : null),
      ownerType: plot.ownerType === 'seller' ? 'seller' : 'owner',
    }
  }

  const buildPlotPayload = () => {
    const area = gajToSqFt(newPlot.areaGaj)
    const pricePerSqFt = pricePerGajToSqFt(newPlot.pricePerGaj)
    const totalPrice = newPlot.totalPrice
      ? Number(newPlot.totalPrice)
      : Math.round(area * pricePerSqFt)

    return {
      plotNumber: newPlot.plotNo,
      colony: newPlot.colonyId,
      area,
      pricePerSqFt,
      totalPrice,
      facing: newPlot.facing,
      status: newPlot.status,
      ownerType: newPlot.ownerType,
      dimensions: {
        length: toNumber(newPlot.frontSide),
        width: toNumber(newPlot.leftSide),
        frontage: toNumber(newPlot.frontSide),
      },
      sideMeasurements: {
        front: toNumber(newPlot.frontSide),
        back: toNumber(newPlot.backSide),
        left: toNumber(newPlot.leftSide),
        right: toNumber(newPlot.rightSide),
      },
    }
  }

  useEffect(() => {
    fetchColonies()
    fetchPlots()
  }, [])

  const fetchColonies = async () => {
    try {
      const { data } = await axios.get('/colonies')
      const colonyList = Array.isArray(data?.data?.colonies) ? data.data.colonies : []
      setColonies(colonyList)
    } catch (error) {
      console.error('Failed to fetch colonies:', error)
      toast.error('Failed to fetch colonies')
    }
  }

  const fetchPlots = async (colonyId = '') => {
    try {
      setLoading(true)
      const url = colonyId ? `/plots?colony=${colonyId}` : '/plots'
      const { data } = await axios.get(url)
      const plotList = Array.isArray(data?.data?.plots)
        ? data.data.plots
        : Array.isArray(data?.data)
          ? data.data
          : []
      const normalizedPlots = plotList.map(normalizePlotFromApi)
      setPlots(normalizedPlots)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch plots:', error)
      toast.error('Failed to fetch plots')
      setLoading(false)
    }
  }

  const handleFilterChange = (colonyId) => {
    setFilterColony(colonyId)
    fetchPlots(colonyId)
  }

  const openAddDialog = () => setAddDialogOpen(true)
  const closeAddDialog = () => {
    setAddDialogOpen(false)
    setNewPlot({ colonyId: '', plotNo: '', frontSide: '', backSide: '', leftSide: '', rightSide: '', areaGaj: '', pricePerGaj: '', totalPrice: '', facing: '', status: 'available', ownerType: 'owner' })
  }

  const openEditDialog = (plot) => {
    setEditingPlotId(plot._id)
    const colonyRef = plot.colonyId?._id || plot.colony?._id || plot.colonyId || plot.colony || ''
    setNewPlot({
      colonyId: typeof colonyRef === 'string' ? colonyRef : colonyRef?._id || '',
      plotNo: plot.plotNo || plot.plotNumber || '',
      frontSide: plot.sideMeasurements?.front?.toString() || plot.dimensions?.length?.toString() || '',
      backSide: plot.sideMeasurements?.back?.toString() || plot.dimensions?.length?.toString() || '',
      leftSide: plot.sideMeasurements?.left?.toString() || plot.dimensions?.width?.toString() || '',
      rightSide: plot.sideMeasurements?.right?.toString() || plot.dimensions?.width?.toString() || '',
      areaGaj: plot.areaGaj?.toString() || (plot.area ? sqFtToGaj(plot.area).toString() : ''),
      pricePerGaj: plot.pricePerGaj?.toString() || (plot.pricePerSqFt ? pricePerSqFtToGaj(plot.pricePerSqFt).toString() : ''),
      totalPrice: plot.totalPrice?.toString() || '',
      facing: plot.facing || '',
      status: plot.status || 'available',
      ownerType: plot.ownerType || 'owner',
    })
    setEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setEditDialogOpen(false)
    setEditingPlotId(null)
    setNewPlot({ colonyId: '', plotNo: '', frontSide: '', backSide: '', leftSide: '', rightSide: '', areaGaj: '', pricePerGaj: '', totalPrice: '', facing: '', status: 'available', ownerType: 'owner' })
  }

  // Calculate area using the formula: ((front + back) / 2) * ((left + right) / 2) / 9
  const calculateArea = (front, back, left, right) => {
    if (!front || !back || !left || !right) return 0
    const avgLength = (Number(front) + Number(back)) / 2
    const avgWidth = (Number(left) + Number(right)) / 2
    const areaSqFt = avgLength * avgWidth
    const areaGaj = areaSqFt / 9 // 1 gaj = 9 sq ft
    return Math.round(areaGaj * 100) / 100 // Round to 2 decimal places
  }

  const handleSideMeasurementChange = (side, value) => {
    setNewPlot((prev) => {
      const updated = { ...prev, [side]: value }
      const calculatedArea = calculateArea(updated.frontSide, updated.backSide, updated.leftSide, updated.rightSide)
      const areaGaj = calculatedArea ? calculatedArea.toString() : ''
      const totalPrice = calculateTotalPriceFromArea(areaGaj, updated.pricePerGaj)
      return {
        ...updated,
        areaGaj,
        totalPrice: totalPrice || ''
      }
    })
  }

  const updatePricingFromPricePerGaj = (pricePerGaj) => {
    setNewPlot((prev) => {
      const totalPrice = calculateTotalPriceFromArea(prev.areaGaj, pricePerGaj)
      return {
        ...prev,
        pricePerGaj,
        totalPrice: totalPrice || ''
      }
    })
  }

  const updatePricingFromTotal = (totalPrice) => {
    setNewPlot((prev) => {
      const pricePerGaj = calculatePricePerGajFromTotal(totalPrice, prev.areaGaj)
      return {
        ...prev,
        totalPrice,
        pricePerGaj: pricePerGaj || prev.pricePerGaj
      }
    })
  }

  const validatePlotForm = () => {
    if (!newPlot.colonyId || !newPlot.plotNo) {
      toast.error('Please provide colony and plot number')
      return false
    }
    if (!newPlot.frontSide || !newPlot.backSide || !newPlot.leftSide || !newPlot.rightSide) {
      toast.error('Please provide all four sides measurements')
      return false
    }
    if (!newPlot.pricePerGaj) {
      toast.error('Please provide price per gaj')
      return false
    }
    if (!newPlot.facing) {
      toast.error('Please select facing')
      return false
    }
    return true
  }

  const handleAddPlot = async () => {
    if (!validatePlotForm()) return

    try {
      setLoading(true)
      const payload = buildPlotPayload()
      
      const response = await axios.post('/plots', payload)
      if (response.data.success) {
        toast.success('Plot added successfully')
        fetchPlots(filterColony)
        closeAddDialog()
      }
    } catch (error) {
      console.error('Failed to add plot:', error)
      toast.error(error.response?.data?.message || 'Failed to add plot')
    } finally {
      setLoading(false)
    }
  }

  const handleEditPlot = async () => {
    if (!validatePlotForm()) return

    try {
      setLoading(true)
      const payload = buildPlotPayload()
      
      const response = await axios.put(`/plots/${editingPlotId}`, payload)
      if (response.data.success) {
        toast.success('Plot updated successfully')
        fetchPlots(filterColony)
        closeEditDialog()
      }
    } catch (error) {
      console.error('Failed to update plot:', error)
      toast.error(error.response?.data?.message || 'Failed to update plot')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlot = async (plotId) => {
    if (window.confirm('Are you sure you want to delete this plot?')) {
      try {
        await axios.delete(`/plots/${plotId}`)
        toast.success('Plot deleted successfully')
        fetchPlots(filterColony)
      } catch (error) {
        toast.error('Failed to delete plot')
      }
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      available: 'success',
      booked: 'warning',
      sold: 'error',
      blocked: 'default',
      reserved: 'info'
    }
    return colors[status] || 'default'
  }

  const getFacingLabel = (value) => FACING_OPTIONS.find((opt) => opt.value === value)?.label || value

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
          Plot Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Filter by Colony"
            value={filterColony}
            onChange={(e) => handleFilterChange(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Colonies</MenuItem>
            {colonies.map((colony) => (
              <MenuItem key={colony._id} value={colony._id}>
                {colony.name}
              </MenuItem>
            ))}
          </TextField>

          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
            Add Plot
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Plot No</strong></TableCell>
              <TableCell><strong>Colony</strong></TableCell>
              <TableCell><strong>Sellers / Owners</strong></TableCell>
              <TableCell><strong>Area (Gaj)</strong></TableCell>
              <TableCell><strong>Price/Gaj</strong></TableCell>
              <TableCell><strong>Total Price</strong></TableCell>
              <TableCell><strong>Facing</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No plots found for the selected colony.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              plots.map((plot) => (
                <TableRow key={plot._id} hover>
                  <TableCell>{plot.plotNo}</TableCell>
                  <TableCell>{plot.colonyId?.name}</TableCell>
                  <TableCell>
                    {plot.ownerType === 'seller' ? (
                      <Chip label="Seller" size="small" color="info" />
                    ) : (
                      <Chip label="Owner" size="small" />
                    )}
                  </TableCell>
                  <TableCell>{plot.areaGaj}</TableCell>
                  <TableCell>₹{plot.pricePerGaj?.toLocaleString()}</TableCell>
                  <TableCell>₹{plot.totalPrice?.toLocaleString()}</TableCell>
                  <TableCell>{getFacingLabel(plot.facing)}</TableCell>
                  <TableCell>
                    <Chip
                      label={plot.status.toUpperCase()}
                      color={getStatusColor(plot.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => openEditDialog(plot)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeletePlot(plot._id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Plot Dialog */}
      <Dialog open={addDialogOpen} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add New Plot</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl size="small">
              <InputLabel id="colony-select-label">Colony</InputLabel>
              <Select
                labelId="colony-select-label"
                value={newPlot.colonyId}
                label="Colony"
                onChange={(e) => setNewPlot((s) => ({ ...s, colonyId: e.target.value }))}
              >
                {colonies.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {renderSellerInfoSection(newPlot.colonyId)}

            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <FormLabel component="legend">Plot Owner</FormLabel>
              <RadioGroup
                row
                value={newPlot.ownerType}
                onChange={(e) => setNewPlot((s) => ({ ...s, ownerType: e.target.value }))}
              >
                <FormControlLabel value="owner" control={<Radio size="small" />} label="Owner" />
                <FormControlLabel value="seller" control={<Radio size="small" />} label="Seller" />
              </RadioGroup>
            </FormControl>

            <TextField size="small" label="Plot Number" value={newPlot.plotNo} onChange={(e) => setNewPlot((s) => ({ ...s, plotNo: e.target.value }))} />
            
            {/* Side Measurements */}
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Plot Dimensions (in feet)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Front Side (ft)" 
                    type="number"
                    value={newPlot.frontSide} 
                    onChange={(e) => handleSideMeasurementChange('frontSide', e.target.value)} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Back Side (ft)" 
                    type="number"
                    value={newPlot.backSide} 
                    onChange={(e) => handleSideMeasurementChange('backSide', e.target.value)} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Left Side (ft)" 
                    type="number"
                    value={newPlot.leftSide} 
                    onChange={(e) => handleSideMeasurementChange('leftSide', e.target.value)} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Right Side (ft)" 
                    type="number"
                    value={newPlot.rightSide} 
                    onChange={(e) => handleSideMeasurementChange('rightSide', e.target.value)} 
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">Calculated Area:</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main' }}>
                  {newPlot.areaGaj ? `${newPlot.areaGaj} Gaj` : 'Enter all sides to calculate'}
                </Typography>
              </Box>
            </Box>

            <TextField 
              size="small" 
              label="Price per Gaj" 
              type="number" 
              value={newPlot.pricePerGaj} 
              onChange={(e) => updatePricingFromPricePerGaj(e.target.value)} 
            />
            <TextField
              size="small"
              label="Total Price"
              type="number"
              value={newPlot.totalPrice}
              onChange={(e) => updatePricingFromTotal(e.target.value)}
            />
            
            <FormControl size="small">
              <InputLabel id="facing-select-label">Facing</InputLabel>
              <Select
                labelId="facing-select-label"
                value={newPlot.facing}
                label="Facing"
                onChange={(e) => setNewPlot((s) => ({ ...s, facing: e.target.value }))}
              >
                <MenuItem value="">Select Facing</MenuItem>
                {FACING_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField size="small" select label="Status" value={newPlot.status} onChange={(e) => setNewPlot((s) => ({ ...s, status: e.target.value }))}>
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPlot}>Add Plot</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Plot Dialog */}
      <Dialog open={editDialogOpen} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edit Plot</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl size="small">
              <InputLabel id="colony-select-label-edit">Colony</InputLabel>
              <Select
                labelId="colony-select-label-edit"
                value={newPlot.colonyId}
                label="Colony"
                onChange={(e) => setNewPlot((s) => ({ ...s, colonyId: e.target.value }))}
              >
                {colonies.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {renderSellerInfoSection(newPlot.colonyId)}

            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <FormLabel component="legend">Plot Owner</FormLabel>
              <RadioGroup
                row
                value={newPlot.ownerType}
                onChange={(e) => setNewPlot((s) => ({ ...s, ownerType: e.target.value }))}
              >
                <FormControlLabel value="owner" control={<Radio size="small" />} label="Owner" />
                <FormControlLabel value="seller" control={<Radio size="small" />} label="Seller" />
              </RadioGroup>
            </FormControl>

            <TextField size="small" label="Plot Number" value={newPlot.plotNo} onChange={(e) => setNewPlot((s) => ({ ...s, plotNo: e.target.value }))} />
            
            {/* Side Measurements */}
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Plot Dimensions (in feet)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Front Side (ft)" 
                    type="number"
                    value={newPlot.frontSide} 
                    onChange={(e) => handleSideMeasurementChange('frontSide', e.target.value)} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Back Side (ft)" 
                    type="number"
                    value={newPlot.backSide} 
                    onChange={(e) => handleSideMeasurementChange('backSide', e.target.value)} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Left Side (ft)" 
                    type="number"
                    value={newPlot.leftSide} 
                    onChange={(e) => handleSideMeasurementChange('leftSide', e.target.value)} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Right Side (ft)" 
                    type="number"
                    value={newPlot.rightSide} 
                    onChange={(e) => handleSideMeasurementChange('rightSide', e.target.value)} 
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">Calculated Area:</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main' }}>
                  {newPlot.areaGaj ? `${newPlot.areaGaj} Gaj` : 'Enter all sides to calculate'}
                </Typography>
              </Box>
            </Box>

            <TextField 
              size="small" 
              label="Price per Gaj" 
              type="number" 
              value={newPlot.pricePerGaj} 
              onChange={(e) => updatePricingFromPricePerGaj(e.target.value)} 
            />
            <TextField
              size="small"
              label="Total Price"
              type="number"
              value={newPlot.totalPrice}
              onChange={(e) => updatePricingFromTotal(e.target.value)}
            />
            
            <FormControl size="small">
              <InputLabel id="facing-select-label-edit">Facing</InputLabel>
              <Select
                labelId="facing-select-label-edit"
                value={newPlot.facing}
                label="Facing"
                onChange={(e) => setNewPlot((s) => ({ ...s, facing: e.target.value }))}
              >
                <MenuItem value="">Select Facing</MenuItem>
                {FACING_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField size="small" select label="Status" value={newPlot.status} onChange={(e) => setNewPlot((s) => ({ ...s, status: e.target.value }))}>
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleEditPlot}>Update Plot</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PlotManagement
