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
  IconButton,
  TablePagination,
  InputAdornment,
} from '@mui/material'
import { Add, Edit, Delete, Visibility, Payment, Search, CloudUpload, ArrowBack } from '@mui/icons-material'
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

const TAHSIL_OPTIONS = [
  { label: 'Agra', value: 'agra' },
  { label: 'Fatehabad', value: 'fatehabad' },
  { label: 'Kheragarh', value: 'kheragarh' },
  { label: 'Bah', value: 'bah' },
  { label: 'Pinahat', value: 'pinahat' },
  { label: 'Achhnera', value: 'achhnera' },
  { label: 'Etmadpur', value: 'etmadpur' },
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
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterColony, setFilterColony] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingPlotId, setEditingPlotId] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingPlot, setViewingPlot] = useState(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentPlot, setPaymentPlot] = useState(null)
  const [showTransactions, setShowTransactions] = useState(false)
  const [showPlotDetails, setShowPlotDetails] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    mode: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [newPlot, setNewPlot] = useState({
    propertyId: '',
    colonyId: '',
    plotNo: '',
    plotType: 'residential',
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
    plotImages: [],
    // Booking/Sale details
    customerName: '',
    customerNumber: '',
    customerShortAddress: '',
    customerFullAddress: '',
    registryDate: '',
    moreInformation: '',
    finalPrice: '',
    agentName: '',
    agentCode: '',
    advocateName: '',
    advocateCode: '',
    tahsil: '',
    modeOfPayment: '',
    transactionDate: '',
    paidAmount: '',
    paymentSlip: null,
    registryDocument: null,
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

  const getColonyKhatoniHolders = (colonyRef) => {
    const colonyFromState = getColonyFromState(colonyRef)
    if (colonyFromState && Array.isArray(colonyFromState.khatoniHolders)) {
      return colonyFromState.khatoniHolders
    }

    if (colonyRef && typeof colonyRef === 'object' && Array.isArray(colonyRef.khatoniHolders)) {
      return colonyRef.khatoniHolders
    }

    return []
  }

  const formatKhatoniHolderLabel = (holder) => {
    if (!holder) return 'Khatoni Holder'
    const name = holder.name || holder.fullName || holder.company || 'Khatoni Holder'
    const phone = holder.mobile || holder.phone || holder.contact || holder.email || ''
    return phone ? `${name} (${phone})` : name
  }

  const renderKhatoniHolderInfoSection = (colonyRef) => {
    if (!colonyRef) return null

    const holders = getColonyKhatoniHolders(colonyRef)

    return (
      <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: 1, border: '1px solid #ececec' }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Colony Khatoni Holders / Owners
        </Typography>
        {holders.length ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {holders.map((holder, index) => (
              <Chip
                key={holder?._id || holder?.id || `${holder?.name || 'holder'}-${index}`}
                label={formatKhatoniHolderLabel(holder)}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No Khatoni Holders added for this colony yet.
          </Typography>
        )}
      </Box>
    )
  }

  const gajToSqFt = (gaj) => toNumber(gaj) * 9
  const sqFtToGaj = (sqft) => {
    const num = toNumber(sqft)
    if (!num) return ''
    return Math.round((num / 9) * 1000) / 1000
  }

  const pricePerGajToSqFt = (pricePerGaj) => {
    const num = toNumber(pricePerGaj)
    if (!num) return 0
    return num / 9
  }

  const pricePerSqFtToGaj = (pricePerSqFt) => {
    const num = toNumber(pricePerSqFt)
    if (!num) return ''
    return Math.round(num * 9 * 1000) / 1000
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
    const formatted = price.toFixed(3)
    return formatted.endsWith('.000') ? parseInt(formatted, 10).toString() : formatted
  }

  const normalizePlotFromApi = (plot) => {
    const colonyRef = plot.colony || plot.colonyId
    return {
      ...plot,
      colonyId: colonyRef,
      plotNo: plot.plotNo || plot.plotNumber || '',
      areaGaj: plot.areaGaj ?? (plot.area ? sqFtToGaj(plot.area) : ''),
      pricePerGaj: plot.pricePerGaj ?? (plot.pricePerSqFt ? pricePerSqFtToGaj(plot.pricePerSqFt) : null),
      ownerType: plot.ownerType === 'khatoniHolder' ? 'khatoniHolder' : 'owner',
    }
  }

  const buildPlotPayload = () => {
    const area = gajToSqFt(newPlot.areaGaj)
    const pricePerSqFt = pricePerGajToSqFt(newPlot.pricePerGaj)
    const totalPrice = newPlot.totalPrice
      ? Number(newPlot.totalPrice)
      : Math.round(area * pricePerSqFt)

    const payload = {
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

    // Add booking/sale details if status is booked or sold
    if (newPlot.status === 'booked' || newPlot.status === 'sold') {
      payload.customerName = newPlot.customerName
      payload.customerNumber = newPlot.customerNumber
      payload.customerShortAddress = newPlot.customerShortAddress
      payload.customerFullAddress = newPlot.customerFullAddress
      payload.registryDate = newPlot.registryDate
      payload.moreInformation = newPlot.moreInformation
      payload.finalPrice = newPlot.finalPrice ? Number(newPlot.finalPrice) : 0
      payload.agentName = newPlot.agentName
      payload.agentCode = newPlot.agentCode
      payload.advocateName = newPlot.advocateName
      payload.advocateCode = newPlot.advocateCode
      payload.tahsil = newPlot.tahsil
      payload.modeOfPayment = newPlot.modeOfPayment
      payload.transactionDate = newPlot.transactionDate
      payload.paidAmount = newPlot.paidAmount ? Number(newPlot.paidAmount) : 0
    }

    return payload
  }

  // Remaining land calculation function
  const calculateRemainingLand = (property) => {
    if (!property) return { remaining: 0, total: 0, used: 0, roads: 0, parks: 0 }
    
    const totalLand = property.totalLandAreaGaj || 0
    
    // Calculate roads area (convert feet to gaj: 1 gaj = 3 feet)
    const roadsArea = (property.roads || []).reduce((sum, road) => {
      const lengthGaj = (road.lengthFt || 0) / 3
      const widthGaj = (road.widthFt || 0) / 3
      return sum + (lengthGaj * widthGaj)
    }, 0)
    
    // Calculate parks area
    const parksArea = (property.parks || []).reduce((sum, park) => {
      const lengthGaj = (park.lengthFt || 0) / 3
      const widthGaj = (park.widthFt || 0) / 3
      return sum + (lengthGaj * widthGaj)
    }, 0)
    
    const usedArea = roadsArea + parksArea
    const remainingLand = totalLand - usedArea
    
    return {
      total: totalLand.toFixed(2),
      used: usedArea.toFixed(2),
      roads: roadsArea.toFixed(2),
      parks: parksArea.toFixed(2),
      remaining: remainingLand.toFixed(2)
    }
  }

  useEffect(() => {
    fetchProperties()
    fetchColonies()
    fetchPlots()
  }, [])

  const fetchProperties = async () => {
    try {
      const { data } = await axios.get('/properties')
      const propertyList = Array.isArray(data?.data?.properties) ? data.data.properties : []
      setProperties(propertyList)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
      toast.error('Failed to fetch properties')
    }
  }

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
      // Fetch all plots with high limit to avoid pagination issues
      const url = colonyId ? `/plots?colony=${colonyId}&limit=1000` : '/plots?limit=1000'
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
    setErrors({}) // Clear all errors
    setNewPlot({ 
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
      customerName: '', 
      customerNumber: '', 
      customerShortAddress: '',
      customerFullAddress: '',
      registryDate: '',
      moreInformation: '',
      finalPrice: '',
      agentName: '',
      agentCode: '',
      advocateName: '',
      advocateCode: '',
      tahsil: '',
      modeOfPayment: '', 
      transactionDate: '', 
      paidAmount: '', 
      paymentSlip: null, 
      registryDocument: null 
    })
  }

  const openEditDialog = (plot) => {
    setEditingPlotId(plot._id)
    const colonyRef = plot.colonyId?._id || plot.colony?._id || plot.colonyId || plot.colony || ''
    const propertyRef = plot.propertyId?._id || plot.propertyId || ''
    setNewPlot({
      propertyId: typeof propertyRef === 'string' ? propertyRef : propertyRef?._id || '',
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
      customerName: plot.customerName || '',
      customerNumber: plot.customerNumber || '',
      customerShortAddress: plot.customerShortAddress || '',
      customerFullAddress: plot.customerFullAddress || '',
      registryDate: plot.registryDate || '',
      moreInformation: plot.moreInformation || '',
      finalPrice: plot.finalPrice?.toString() || '',
      agentName: plot.agentName || '',
      agentCode: plot.agentCode || '',
      advocateName: plot.advocateName || '',
      advocateCode: plot.advocateCode || '',
      tahsil: plot.tahsil || '',
      modeOfPayment: plot.modeOfPayment || '',
      transactionDate: plot.transactionDate || '',
      paidAmount: plot.paidAmount?.toString() || '',
      paymentSlip: null,
      registryDocument: null,
    })
    setEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setEditDialogOpen(false)
    setEditingPlotId(null)
    setErrors({}) // Clear all errors
    setNewPlot({ 
      propertyId: '',
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
      customerName: '', 
      customerNumber: '', 
      customerShortAddress: '',
      customerFullAddress: '',
      registryDate: '',
      moreInformation: '',
      finalPrice: '',
      agentName: '',
      agentCode: '',
      advocateName: '',
      advocateCode: '',
      tahsil: '',
      modeOfPayment: '', 
      transactionDate: '', 
      paidAmount: '', 
      paymentSlip: null, 
      registryDocument: null 
    })
  }

  // Calculate area using the formula: ((front + back) / 2) * ((left + right) / 2) / 9
  const calculateArea = (front, back, left, right) => {
    if (!front || !back || !left || !right) return null
    const avgLength = (Number(front) + Number(back)) / 2
    const avgWidth = (Number(left) + Number(right)) / 2
    const areaSqFt = avgLength * avgWidth
    const areaGaj = areaSqFt / 9 // 1 gaj = 9 sq ft
    return Math.round(areaGaj * 1000) / 1000 // Round to 3 decimal places
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

  /**
   * Comprehensive form validation with detailed error messages
   * @returns {boolean} - True if form is valid, false otherwise
   */
  const validatePlotForm = () => {
    const newErrors = {}
    let isValid = true

    // Property is REQUIRED
    const propertyError = validateRequired(newPlot.propertyId, 'Property')
    if (propertyError) {
      newErrors.propertyId = propertyError
      isValid = false
    }

    // Colony is auto-selected from property, but still validate
    const colonyError = validateRequired(newPlot.colonyId, 'Colony')
    if (colonyError) {
      newErrors.colonyId = 'Please select a property first'
      isValid = false
    }

    const plotNoError = validateRequired(newPlot.plotNo, 'Plot Number')
    if (plotNoError) {
      newErrors.plotNo = plotNoError
      isValid = false
    }

    // Dimensions Validation
    const frontSideError = validateRequired(newPlot.frontSide, 'Front Side') || 
                          validateNumeric(newPlot.frontSide, 'Front Side')
    if (frontSideError) {
      newErrors.frontSide = frontSideError
      isValid = false
    }

    const backSideError = validateRequired(newPlot.backSide, 'Back Side') || 
                         validateNumeric(newPlot.backSide, 'Back Side')
    if (backSideError) {
      newErrors.backSide = backSideError
      isValid = false
    }

    const leftSideError = validateRequired(newPlot.leftSide, 'Left Side') || 
                         validateNumeric(newPlot.leftSide, 'Left Side')
    if (leftSideError) {
      newErrors.leftSide = leftSideError
      isValid = false
    }

    const rightSideError = validateRequired(newPlot.rightSide, 'Right Side') || 
                          validateNumeric(newPlot.rightSide, 'Right Side')
    if (rightSideError) {
      newErrors.rightSide = rightSideError
      isValid = false
    }

    // Pricing Validation
    const pricePerGajError = validateRequired(newPlot.pricePerGaj, 'Price per Gaj') || 
                            validateNumeric(newPlot.pricePerGaj, 'Price per Gaj')
    if (pricePerGajError) {
      newErrors.pricePerGaj = pricePerGajError
      isValid = false
    }

    // Facing Validation
    const facingError = validateRequired(newPlot.facing, 'Facing')
    if (facingError) {
      newErrors.facing = facingError
      isValid = false
    }

    // Sale/Booking Details Validation (only if status is booked or sold)
    if (newPlot.status === 'booked' || newPlot.status === 'sold') {
      const customerNameError = validateRequired(newPlot.customerName, 'Customer Name') ||
                               validateMinLength(newPlot.customerName, 2, 'Customer Name')
      if (customerNameError) {
        newErrors.customerName = customerNameError
        isValid = false
      }

      const customerNumberError = validateRequired(newPlot.customerNumber, 'Customer Number') ||
                                 validatePhone(newPlot.customerNumber)
      if (customerNumberError) {
        newErrors.customerNumber = customerNumberError
        isValid = false
      }

      const customerAddressError = validateRequired(newPlot.customerShortAddress, 'Customer Short Address') ||
                                  validateMinLength(newPlot.customerShortAddress, 5, 'Customer Short Address')
      if (customerAddressError) {
        newErrors.customerShortAddress = customerAddressError
        isValid = false
      }

      // Optional field validations (only validate if filled)
      if (newPlot.finalPrice) {
        const finalPriceError = validateNumeric(newPlot.finalPrice, 'Final Price')
        if (finalPriceError) {
          newErrors.finalPrice = finalPriceError
          isValid = false
        }
      }

      if (newPlot.paidAmount) {
        const paidAmountError = validateNumeric(newPlot.paidAmount, 'Amount Paid')
        if (paidAmountError) {
          newErrors.paidAmount = paidAmountError
          isValid = false
        }
      }
    }

    setErrors(newErrors)

    // Show appropriate toast messages
    if (!isValid) {
      const firstError = Object.values(newErrors)[0]
      toast.error(firstError, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }

    return isValid
  }

  const handleAddPlot = async () => {
    if (!validatePlotForm()) return

    try {
      setLoading(true)
      const payload = buildPlotPayload()
      
      // Create FormData if there's a file to upload
      const formData = new FormData()
      
      // Append all payload fields
      Object.keys(payload).forEach(key => {
        if (typeof payload[key] === 'object' && payload[key] !== null) {
          formData.append(key, JSON.stringify(payload[key]))
        } else {
          formData.append(key, payload[key])
        }
      })
      
      // Append files if exist
      if (newPlot.paymentSlip) {
        formData.append('paymentSlip', newPlot.paymentSlip)
      }
      if (newPlot.registryDocument) {
        formData.append('registryDocument', newPlot.registryDocument)
      }
      
      const response = await axios.post('/plots', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (response.data.success) {
        toast.success('Plot added successfully! 🎉', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        fetchPlots(filterColony)
        closeAddDialog()
      }
    } catch (error) {
      console.error('Failed to add plot:', error)
      const errorMessage = error.response?.data?.message || 'Failed to add plot. Please try again.'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditPlot = async () => {
    if (!validatePlotForm()) return

    try {
      setLoading(true)
      const payload = buildPlotPayload()
      
      // Create FormData if there's a file to upload
      const formData = new FormData()
      
      // Append all payload fields
      Object.keys(payload).forEach(key => {
        if (typeof payload[key] === 'object' && payload[key] !== null) {
          formData.append(key, JSON.stringify(payload[key]))
        } else {
          formData.append(key, payload[key])
        }
      })
      
      // Append files if exist
      if (newPlot.paymentSlip) {
        formData.append('paymentSlip', newPlot.paymentSlip)
      }
      if (newPlot.registryDocument) {
        formData.append('registryDocument', newPlot.registryDocument)
      }
      
      const response = await axios.put(`/plots/${editingPlotId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (response.data.success) {
        toast.success('Plot updated successfully! ✅', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        fetchPlots(filterColony)
        closeEditDialog()
      }
    } catch (error) {
      console.error('Failed to update plot:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update plot. Please try again.'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlot = async (plotId) => {
    if (window.confirm('Are you sure you want to delete this plot?')) {
      try {
        await axios.delete(`/plots/${plotId}`)
        toast.success('Plot deleted successfully! 🗑️', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        fetchPlots(filterColony)
      } catch (error) {
        toast.error('Failed to delete plot. Please try again.', {
          position: 'top-right',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      }
    }
  }

  const handleAddPayment = async () => {
    if (!paymentData.amount || !paymentData.mode || !paymentData.date) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      const currentPaid = paymentPlot.paidAmount || 0
      const newPaidAmount = currentPaid + Number(paymentData.amount)

      await axios.put(`/plots/${paymentPlot._id}`, {
        paidAmount: newPaidAmount,
        modeOfPayment: paymentData.mode,
        transactionDate: paymentData.date,
        moreInformation: paymentData.notes
      })

      toast.success('Payment added successfully! 💰')
      setPaymentDialogOpen(false)
      setPaymentPlot(null)
      setPaymentData({
        amount: '',
        mode: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      fetchPlots(filterColony)
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to add payment. Please try again.')
    } finally {
      setLoading(false)
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

  // Filter and paginate plots
  const filteredPlots = plots.filter((plot) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      plot.plotNo?.toLowerCase().includes(query) ||
      plot.colonyId?.name?.toLowerCase().includes(query) ||
      plot.customerName?.toLowerCase().includes(query) ||
      plot._id?.toLowerCase().includes(query)
    )
  })

  const paginatedPlots = filteredPlots.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // ============================================
  // VALIDATION FUNCTIONS (Reusable)
  // ============================================
  
  /**
   * Validates if a field is empty
   * @param {string} value - Field value
   * @param {string} fieldName - Name of the field for error message
   * @returns {string|null} - Error message or null if valid
   */
  const validateRequired = (value, fieldName) => {
    if (!value || value.toString().trim() === '') {
      return `${fieldName} is required`
    }
    return null
  }

  /**
   * Validates phone number format (10 digits)
   * @param {string} value - Phone number
   * @returns {string|null} - Error message or null if valid
   */
  const validatePhone = (value) => {
    if (!value) return null
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(value)) {
      return 'Phone number must be exactly 10 digits'
    }
    return null
  }

  /**
   * Validates numeric fields
   * @param {string} value - Numeric value
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} - Error message or null if valid
   */
  const validateNumeric = (value, fieldName) => {
    if (!value) return null
    if (isNaN(value) || Number(value) <= 0) {
      return `${fieldName} must be a valid positive number`
    }
    return null
  }

  /**
   * Validates minimum length
   * @param {string} value - Field value
   * @param {number} minLength - Minimum required length
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} - Error message or null if valid
   */
  const validateMinLength = (value, minLength, fieldName) => {
    if (!value) return null
    if (value.toString().trim().length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`
    }
    return null
  }

  /**
   * Clears error for a specific field
   * @param {string} fieldName - Name of the field
   */
  const clearError = (fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  /**
   * Sets error for a specific field
   * @param {string} fieldName - Name of the field
   * @param {string} errorMessage - Error message
   */
  const setFieldError = (fieldName, errorMessage) => {
    setErrors(prev => ({ ...prev, [fieldName]: errorMessage }))
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  // Show form if add or edit dialog is open
  if (addDialogOpen || editDialogOpen) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            {addDialogOpen ? 'Add New Plot' : 'Edit Plot'}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={addDialogOpen ? closeAddDialog : closeEditDialog}
          >
            Back to Plots
          </Button>
        </Box>
        
        <Paper sx={{ p: 3 }}>
          {addDialogOpen ? (
            <>
              {/* ADD PLOT FORM */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Property Selector - REQUIRED */}
                <FormControl size="small" error={!!errors.propertyId} required>
                  <InputLabel id="property-select-label">Property *</InputLabel>
                  <Select
                    labelId="property-select-label"
                    value={newPlot.propertyId || ''}
                    label="Property *"
                    onChange={(e) => {
                      const selectedProperty = properties.find(p => p._id === e.target.value)
                      setNewPlot((s) => ({ 
                        ...s, 
                        propertyId: e.target.value,
                        colonyId: selectedProperty?.colony?._id || selectedProperty?.colony || '',
                        pricePerGaj: selectedProperty?.basePricePerGaj || s.pricePerGaj
                      }))
                      clearError('propertyId')
                    }}
                  >
                    <MenuItem value="">
                      <em>Select Property</em>
                    </MenuItem>
                    {properties.map((property) => (
                      <MenuItem key={property._id} value={property._id}>
                        {property.name} - {property.category}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.propertyId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.propertyId}
                    </Typography>
                  )}
                </FormControl>

                {/* Remaining Land Calculation Display */}
                {newPlot.propertyId && (() => {
                  const selectedProperty = properties.find(p => p._id === newPlot.propertyId)
                  if (!selectedProperty) return null
                  
                  const landCalc = calculateRemainingLand(selectedProperty)
                  
                  return (
                    <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary">
                        📊 Land Calculation Summary - {selectedProperty.name}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Total Land: <strong>{landCalc.total} Gaj</strong>
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Roads: <strong>{landCalc.roads} Gaj</strong>
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Parks: <strong>{landCalc.parks} Gaj</strong>
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Used Area: <strong>{landCalc.used} Gaj</strong>
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <Typography variant="body1" color="success.main" fontWeight={700}>
                            ✅ Remaining Land: {landCalc.remaining} Gaj
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      {selectedProperty.basePricePerGaj && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          💰 Base Price: ₹{selectedProperty.basePricePerGaj.toLocaleString()}/Gaj
                        </Typography>
                      )}
                    </Box>
                  )
                })()}

                {/* Colony is auto-selected from Property */}
                {newPlot.colonyId && (() => {
                  const colony = colonies.find(c => c._id === newPlot.colonyId)
                  return colony ? (
                    <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Colony: <strong>{colony.name}</strong>
                      </Typography>
                    </Box>
                  ) : null
                })()}

                {renderKhatoniHolderInfoSection(newPlot.colonyId)}

                <FormControl component="fieldset" sx={{ mt: 1 }}>
                  <FormLabel component="legend">Plot Owner</FormLabel>
                  <RadioGroup
                    row
                    value={newPlot.ownerType}
                    onChange={(e) => setNewPlot((s) => ({ ...s, ownerType: e.target.value }))}
                  >
                    <FormControlLabel value="owner" control={<Radio size="small" />} label="Owner" />
                    <FormControlLabel value="khatoniHolder" control={<Radio size="small" />} label="Khatoni Holder" />
                  </RadioGroup>
                </FormControl>

                <TextField 
                  size="small" 
                  label="Plot Number *" 
                  value={newPlot.plotNo} 
                  onChange={(e) => {
                    setNewPlot((s) => ({ ...s, plotNo: e.target.value }))
                    clearError('plotNo')
                  }}
                  error={!!errors.plotNo}
                  helperText={errors.plotNo}
                  required
                />
                
                {/* Side Measurements */}
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Plot Dimensions (in feet) *
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField 
                        fullWidth
                        size="small" 
                        label="Front Side (ft) *" 
                        type="number"
                        value={newPlot.frontSide} 
                        onChange={(e) => {
                          handleSideMeasurementChange('frontSide', e.target.value)
                          clearError('frontSide')
                        }}
                        error={!!errors.frontSide}
                        helperText={errors.frontSide}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField 
                        fullWidth
                        size="small" 
                        label="Back Side (ft) *" 
                        type="number"
                        value={newPlot.backSide} 
                        onChange={(e) => {
                          handleSideMeasurementChange('backSide', e.target.value)
                          clearError('backSide')
                        }}
                        error={!!errors.backSide}
                        helperText={errors.backSide}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField 
                        fullWidth
                        size="small" 
                        label="Left Side (ft) *" 
                        type="number"
                        value={newPlot.leftSide} 
                        onChange={(e) => {
                          handleSideMeasurementChange('leftSide', e.target.value)
                          clearError('leftSide')
                        }}
                        error={!!errors.leftSide}
                        helperText={errors.leftSide}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField 
                        fullWidth
                        size="small" 
                        label="Right Side (ft) *" 
                        type="number"
                        value={newPlot.rightSide} 
                        onChange={(e) => {
                          handleSideMeasurementChange('rightSide', e.target.value)
                          clearError('rightSide')
                        }}
                        error={!!errors.rightSide}
                        helperText={errors.rightSide}
                        required
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
                  label="Price per Gaj *" 
                  type="number" 
                  value={newPlot.pricePerGaj} 
                  onChange={(e) => {
                    updatePricingFromPricePerGaj(e.target.value)
                    clearError('pricePerGaj')
                  }}
                  error={!!errors.pricePerGaj}
                  helperText={errors.pricePerGaj}
                  required
                />
                <TextField
                  size="small"
                  label="Total Price (Auto-calculated)"
                  type="number"
                  value={newPlot.totalPrice}
                  onChange={(e) => updatePricingFromTotal(e.target.value)}
                  InputProps={{ readOnly: true }}
                />
                
                <FormControl size="small" error={!!errors.facing} required>
                  <InputLabel id="facing-select-label">Facing *</InputLabel>
                  <Select
                    labelId="facing-select-label"
                    value={newPlot.facing}
                    label="Facing *"
                    onChange={(e) => {
                      setNewPlot((s) => ({ ...s, facing: e.target.value }))
                      clearError('facing')
                    }}
                  >
                    <MenuItem value="">Select Facing</MenuItem>
                    {FACING_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.facing && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.facing}
                    </Typography>
                  )}
                </FormControl>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField 
                      fullWidth
                      size="small" 
                      select 
                      label="Plot Type *" 
                      value={newPlot.plotType} 
                      onChange={(e) => setNewPlot((s) => ({ ...s, plotType: e.target.value }))}
                    >
                      <MenuItem value="residential">Residential</MenuItem>
                      <MenuItem value="commercial">Commercial</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField 
                      fullWidth
                      size="small" 
                      select 
                      label="Status" 
                      value={newPlot.status} 
                      onChange={(e) => setNewPlot((s) => ({ ...s, status: e.target.value }))}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                {/* Plot Images Upload */}
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Plot Images (Optional)
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    Upload Plot Photos
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files)
                        setNewPlot((s) => ({ ...s, plotImages: files }))
                      }}
                    />
                  </Button>
                  {newPlot.plotImages && newPlot.plotImages.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="success.main">
                        ✓ {newPlot.plotImages.length} image(s) selected
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {newPlot.plotImages.map((file, idx) => (
                          <Chip 
                            key={idx} 
                            label={file.name} 
                            size="small" 
                            onDelete={() => {
                              setNewPlot((s) => ({
                                ...s,
                                plotImages: s.plotImages.filter((_, i) => i !== idx)
                              }))
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Conditional fields for Booked/Sold status */}
                {(newPlot.status === 'booked' || newPlot.status === 'sold') && (
                  <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffb74d', mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: '#e65100' }}>
                      {newPlot.status === 'booked' ? 'Booking Details' : 'Sale Details'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        size="small"
                        label="Customer Name *"
                        value={newPlot.customerName}
                        onChange={(e) => {
                          setNewPlot((s) => ({ ...s, customerName: e.target.value }))
                          clearError('customerName')
                        }}
                        error={!!errors.customerName}
                        helperText={errors.customerName}
                        required
                      />
                      <TextField
                        size="small"
                        label="Customer Number *"
                        type="tel"
                        value={newPlot.customerNumber}
                        onChange={(e) => {
                          setNewPlot((s) => ({ ...s, customerNumber: e.target.value }))
                          clearError('customerNumber')
                        }}
                        error={!!errors.customerNumber}
                        helperText={errors.customerNumber}
                        placeholder="10 digit mobile number"
                        required
                      />
                      <TextField
                        size="small"
                        label="Customer Short Address *"
                        value={newPlot.customerShortAddress}
                        onChange={(e) => {
                          setNewPlot((s) => ({ ...s, customerShortAddress: e.target.value }))
                          clearError('customerShortAddress')
                        }}
                        error={!!errors.customerShortAddress}
                        helperText={errors.customerShortAddress}
                        required
                      />
                      <TextField
                        size="small"
                        label="Registry Date (Optional)"
                        type="date"
                        value={newPlot.registryDate}
                        onChange={(e) => setNewPlot((s) => ({ ...s, registryDate: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        size="small"
                        label="Customer Full Address (Optional)"
                        multiline
                        rows={2}
                        value={newPlot.customerFullAddress}
                        onChange={(e) => setNewPlot((s) => ({ ...s, customerFullAddress: e.target.value }))}
                      />
                      <TextField
                        size="small"
                        label="More Information (Optional)"
                        multiline
                        rows={2}
                        value={newPlot.moreInformation}
                        onChange={(e) => setNewPlot((s) => ({ ...s, moreInformation: e.target.value }))}
                      />
                      <TextField
                        size="small"
                        label="Final Price (Optional)"
                        type="number"
                        value={newPlot.finalPrice}
                        onChange={(e) => {
                          setNewPlot((s) => ({ ...s, finalPrice: e.target.value }))
                          clearError('finalPrice')
                        }}
                        error={!!errors.finalPrice}
                        helperText={errors.finalPrice}
                      />
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          size="small"
                          label="Agent Name (Optional)"
                          value={newPlot.agentName}
                          onChange={(e) => setNewPlot((s) => ({ ...s, agentName: e.target.value }))}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          label="Agent Code (Optional)"
                          value={newPlot.agentCode}
                          onChange={(e) => setNewPlot((s) => ({ ...s, agentCode: e.target.value }))}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          size="small"
                          label="Advocate Name (Optional)"
                          value={newPlot.advocateName}
                          onChange={(e) => setNewPlot((s) => ({ ...s, advocateName: e.target.value }))}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          label="Advocate Code (Optional)"
                          value={newPlot.advocateCode}
                          onChange={(e) => setNewPlot((s) => ({ ...s, advocateCode: e.target.value }))}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                      <TextField
                        size="small"
                        select
                        label="Tahsil (Optional)"
                        value={newPlot.tahsil}
                        onChange={(e) => setNewPlot((s) => ({ ...s, tahsil: e.target.value }))}
                      >
                        <MenuItem value="">Select Tahsil</MenuItem>
                        {TAHSIL_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        select
                        label="Mode of Payment (Optional)"
                        value={newPlot.modeOfPayment}
                        onChange={(e) => setNewPlot((s) => ({ ...s, modeOfPayment: e.target.value }))}
                      >
                        <MenuItem value="">Select Mode</MenuItem>
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="cheque">Cheque</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                      </TextField>
                      <TextField
                        size="small"
                        label="Transaction Date & Time (Optional)"
                        type="datetime-local"
                        value={newPlot.transactionDate}
                        onChange={(e) => setNewPlot((s) => ({ ...s, transactionDate: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        size="small"
                        label="Amount Paid (Optional)"
                        type="number"
                        value={newPlot.paidAmount}
                        onChange={(e) => {
                          setNewPlot((s) => ({ ...s, paidAmount: e.target.value }))
                          clearError('paidAmount')
                        }}
                        error={!!errors.paidAmount}
                        helperText={errors.paidAmount}
                      />
                      <Box>
                        <Button
                          variant="outlined"
                          component="label"
                          fullWidth
                          size="small"
                        >
                          Upload Payment Slip/Screenshot (Optional)
                          <input
                            type="file"
                            hidden
                            accept="image/*,.pdf"
                            onChange={(e) => setNewPlot((s) => ({ ...s, paymentSlip: e.target.files[0] }))}
                          />
                        </Button>
                        {newPlot.paymentSlip && (
                          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                            ✓ {newPlot.paymentSlip.name}
                          </Typography>
                        )}
                      </Box>
                      {newPlot.status === 'sold' && (
                        <Box>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            size="small"
                            color="secondary"
                          >
                            Upload Registry Document (Optional)
                            <input
                              type="file"
                              hidden
                              accept="image/*,.pdf"
                              onChange={(e) => setNewPlot((s) => ({ ...s, registryDocument: e.target.files[0] }))}
                            />
                          </Button>
                          {newPlot.registryDocument && (
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                              ✓ {newPlot.registryDocument.name}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button onClick={closeAddDialog} variant="outlined">Cancel</Button>
                <Button variant="contained" onClick={handleAddPlot}>Add Plot</Button>
              </Box>
            </>
          ) : (
            <>
              {/* EDIT PLOT FORM - COMPLETE COPY OF ADD PLOT FORM */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Property Selector - REQUIRED */}
                <FormControl size="small" error={!!errors.propertyId} required>
                  <InputLabel id="property-select-label-edit">Property *</InputLabel>
                  <Select
                    labelId="property-select-label-edit"
                    value={newPlot.propertyId || ''}
                    label="Property *"
                    onChange={(e) => {
                      const selectedProperty = properties.find(p => p._id === e.target.value)
                      setNewPlot((s) => ({ 
                        ...s, 
                        propertyId: e.target.value,
                        colonyId: selectedProperty?.colony?._id || selectedProperty?.colony || '',
                        pricePerGaj: selectedProperty?.basePricePerGaj || s.pricePerGaj
                      }))
                      clearError('propertyId')
                    }}
                  >
                    <MenuItem value="">
                      <em>Select Property</em>
                    </MenuItem>
                    {properties.map((property) => (
                      <MenuItem key={property._id} value={property._id}>
                        {property.name} - {property.category}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.propertyId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.propertyId}
                    </Typography>
                  )}
                </FormControl>

                {/* Colony is auto-selected from Property */}
                {newPlot.colonyId && (() => {
                  const colony = colonies.find(c => c._id === newPlot.colonyId)
                  return colony ? (
                    <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Colony: <strong>{colony.name}</strong>
                      </Typography>
                    </Box>
                  ) : null
                })()}

                {renderKhatoniHolderInfoSection(newPlot.colonyId)}

                <FormControl component="fieldset" sx={{ mt: 1 }}>
                  <FormLabel component="legend">Plot Owner</FormLabel>
                  <RadioGroup
                    row
                    value={newPlot.ownerType}
                    onChange={(e) => setNewPlot((s) => ({ ...s, ownerType: e.target.value }))}
                  >
                    <FormControlLabel value="owner" control={<Radio size="small" />} label="Owner" />
                    <FormControlLabel value="khatoniHolder" control={<Radio size="small" />} label="Khatoni Holder" />
                  </RadioGroup>
                </FormControl>

                <TextField 
                  size="small" 
                  label="Plot Number *" 
                  value={newPlot.plotNo} 
                  onChange={(e) => setNewPlot((s) => ({ ...s, plotNo: e.target.value }))} 
                  required
                />
                
                {/* Side Measurements */}
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Plot Dimensions (in feet) *
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField 
                        fullWidth
                        size="small" 
                        label="Front Side (ft) *" 
                        type="number"
                        value={newPlot.frontSide} 
                        onChange={(e) => handleSideMeasurementChange('frontSide', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField 
                        fullWidth
                        size="small" 
                        label="Back Side (ft) *" 
                        type="number"
                        value={newPlot.backSide} 
                        onChange={(e) => handleSideMeasurementChange('backSide', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField 
                        fullWidth
                        size="small" 
                        label="Left Side (ft) *" 
                        type="number"
                        value={newPlot.leftSide} 
                        onChange={(e) => handleSideMeasurementChange('leftSide', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField 
                        fullWidth
                        size="small" 
                        label="Right Side (ft) *" 
                        type="number"
                        value={newPlot.rightSide} 
                        onChange={(e) => handleSideMeasurementChange('rightSide', e.target.value)}
                        required
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
                  label="Price per Gaj *" 
                  type="number" 
                  value={newPlot.pricePerGaj} 
                  onChange={(e) => updatePricingFromPricePerGaj(e.target.value)}
                  required
                />
                <TextField
                  size="small"
                  label="Total Price (Auto-calculated)"
                  type="number"
                  value={newPlot.totalPrice}
                  onChange={(e) => updatePricingFromTotal(e.target.value)}
                  InputProps={{ readOnly: true }}
                />
                
                <FormControl size="small" required>
                  <InputLabel>Facing *</InputLabel>
                  <Select
                    value={newPlot.facing}
                    label="Facing *"
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

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField 
                      fullWidth
                      size="small" 
                      select 
                      label="Plot Type *" 
                      value={newPlot.plotType} 
                      onChange={(e) => setNewPlot((s) => ({ ...s, plotType: e.target.value }))}
                    >
                      <MenuItem value="residential">Residential</MenuItem>
                      <MenuItem value="commercial">Commercial</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField 
                      fullWidth
                      size="small" 
                      select 
                      label="Status" 
                      value={newPlot.status} 
                      onChange={(e) => setNewPlot((s) => ({ ...s, status: e.target.value }))}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                {/* Plot Images Upload */}
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Plot Images (Optional)
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    Upload Plot Photos
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files)
                        setNewPlot((s) => ({ ...s, plotImages: files }))
                      }}
                    />
                  </Button>
                  {newPlot.plotImages && newPlot.plotImages.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="success.main">
                        ✓ {newPlot.plotImages.length} image(s) selected
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {newPlot.plotImages.map((file, idx) => (
                          <Chip 
                            key={idx} 
                            label={file.name} 
                            size="small" 
                            onDelete={() => {
                              setNewPlot((s) => ({
                                ...s,
                                plotImages: s.plotImages.filter((_, i) => i !== idx)
                              }))
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Conditional fields for Booked/Sold status */}
                {(newPlot.status === 'booked' || newPlot.status === 'sold') && (
                  <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffb74d', mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: '#e65100' }}>
                      {newPlot.status === 'booked' ? 'Booking Details' : 'Sale Details'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        size="small"
                        label="Customer Name *"
                        value={newPlot.customerName}
                        onChange={(e) => setNewPlot((s) => ({ ...s, customerName: e.target.value }))}
                        required
                      />
                      <TextField
                        size="small"
                        label="Customer Number *"
                        type="tel"
                        value={newPlot.customerNumber}
                        onChange={(e) => setNewPlot((s) => ({ ...s, customerNumber: e.target.value }))}
                        placeholder="10 digit mobile number"
                        required
                      />
                      <TextField
                        size="small"
                        label="Customer Short Address *"
                        value={newPlot.customerShortAddress}
                        onChange={(e) => setNewPlot((s) => ({ ...s, customerShortAddress: e.target.value }))}
                        required
                      />
                      <TextField
                        size="small"
                        label="Registry Date (Optional)"
                        type="date"
                        value={newPlot.registryDate}
                        onChange={(e) => setNewPlot((s) => ({ ...s, registryDate: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        size="small"
                        label="Customer Full Address (Optional)"
                        multiline
                        rows={2}
                        value={newPlot.customerFullAddress}
                        onChange={(e) => setNewPlot((s) => ({ ...s, customerFullAddress: e.target.value }))}
                      />
                      <TextField
                        size="small"
                        label="More Information (Optional)"
                        multiline
                        rows={2}
                        value={newPlot.moreInformation}
                        onChange={(e) => setNewPlot((s) => ({ ...s, moreInformation: e.target.value }))}
                      />
                      <TextField
                        size="small"
                        label="Final Price (Optional)"
                        type="number"
                        value={newPlot.finalPrice}
                        onChange={(e) => setNewPlot((s) => ({ ...s, finalPrice: e.target.value }))}
                      />
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          size="small"
                          label="Agent Name (Optional)"
                          value={newPlot.agentName}
                          onChange={(e) => setNewPlot((s) => ({ ...s, agentName: e.target.value }))}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          label="Agent Code (Optional)"
                          value={newPlot.agentCode}
                          onChange={(e) => setNewPlot((s) => ({ ...s, agentCode: e.target.value }))}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          size="small"
                          label="Advocate Name (Optional)"
                          value={newPlot.advocateName}
                          onChange={(e) => setNewPlot((s) => ({ ...s, advocateName: e.target.value }))}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          label="Advocate Code (Optional)"
                          value={newPlot.advocateCode}
                          onChange={(e) => setNewPlot((s) => ({ ...s, advocateCode: e.target.value }))}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                      <TextField
                        size="small"
                        select
                        label="Tahsil (Optional)"
                        value={newPlot.tahsil}
                        onChange={(e) => setNewPlot((s) => ({ ...s, tahsil: e.target.value }))}
                      >
                        <MenuItem value="">Select Tahsil</MenuItem>
                        {TAHSIL_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        select
                        label="Mode of Payment (Optional)"
                        value={newPlot.modeOfPayment}
                        onChange={(e) => setNewPlot((s) => ({ ...s, modeOfPayment: e.target.value }))}
                      >
                        <MenuItem value="">Select Mode</MenuItem>
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="cheque">Cheque</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                      </TextField>
                      <TextField
                        size="small"
                        label="Transaction Date & Time (Optional)"
                        type="datetime-local"
                        value={newPlot.transactionDate}
                        onChange={(e) => setNewPlot((s) => ({ ...s, transactionDate: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        size="small"
                        label="Amount Paid (Optional)"
                        type="number"
                        value={newPlot.paidAmount}
                        onChange={(e) => setNewPlot((s) => ({ ...s, paidAmount: e.target.value }))}
                      />
                      <Box>
                        <Button
                          variant="outlined"
                          component="label"
                          fullWidth
                          size="small"
                        >
                          Upload Payment Slip/Screenshot (Optional)
                          <input
                            type="file"
                            hidden
                            accept="image/*,.pdf"
                            onChange={(e) => setNewPlot((s) => ({ ...s, paymentSlip: e.target.files[0] }))}
                          />
                        </Button>
                        {newPlot.paymentSlip && (
                          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                            ✓ {newPlot.paymentSlip.name}
                          </Typography>
                        )}
                      </Box>
                      {newPlot.status === 'sold' && (
                        <Box>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            size="small"
                            color="secondary"
                          >
                            Upload Registry Document (Optional)
                            <input
                              type="file"
                              hidden
                              accept="image/*,.pdf"
                              onChange={(e) => setNewPlot((s) => ({ ...s, registryDocument: e.target.files[0] }))}
                            />
                          </Button>
                          {newPlot.registryDocument && (
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                              ✓ {newPlot.registryDocument.name}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button onClick={closeEditDialog} variant="outlined">Cancel</Button>
                <Button variant="contained" onClick={handleEditPlot}>Update Plot</Button>
              </Box>
            </>
          )}
        </Paper>
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
            size="small"
            placeholder="Search by plot no, colony, customer..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(0)
            }}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
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
              <TableCell><strong>Khatoni Holders / Owners</strong></TableCell>
              <TableCell><strong>Area (Gaj)</strong></TableCell>
              <TableCell><strong>Asking Price/Gaj</strong></TableCell>
              <TableCell><strong>Final Price/Gaj</strong></TableCell>
              <TableCell><strong>Total Price</strong></TableCell>
              <TableCell><strong>Remaining Payment</strong></TableCell>
              <TableCell><strong>Facing</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPlots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchQuery ? 'No plots found matching your search.' : 'No plots found for the selected colony.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPlots.map((plot) => {
                const finalPricePerGaj = plot.finalPrice && plot.areaGaj 
                  ? (plot.finalPrice / plot.areaGaj).toFixed(2)
                  : null;
                const displayTotalPrice = plot.finalPrice || plot.totalPrice;
                
                return (
                  <TableRow key={plot._id} hover>
                    <TableCell>{plot.plotNo}</TableCell>
                    <TableCell>{plot.colonyId?.name}</TableCell>
                    <TableCell>
                      {plot.ownerType === 'khatoniHolder' ? (
                        <Chip label="Khatoni Holder" size="small" color="info" />
                      ) : (
                        <Chip label="Owner" size="small" />
                      )}
                    </TableCell>
                    <TableCell>{Number(plot.areaGaj).toFixed(3)}</TableCell>
                    <TableCell>₹{Number(plot.pricePerGaj).toLocaleString()}</TableCell>
                    <TableCell>
                      {finalPricePerGaj ? (
                        <Chip 
                          label={`₹${Number(finalPricePerGaj).toLocaleString()}`}
                          size="small"
                          color="success"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <strong>₹{Number(displayTotalPrice).toLocaleString()}</strong>
                      {/* {plot.finalPrice && (
                        <Chip 
                          label="Final" 
                          size="small" 
                          color="success" 
                          sx={{ ml: 1 }}
                        />
                      )} */}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const paidAmount = plot.paidAmount || 0;
                        const remaining = displayTotalPrice - paidAmount;
                        return (
                          <Box>
                            <Typography variant="body2" fontWeight={600} color={remaining > 0 ? 'error.main' : 'success.main'}>
                              ₹{Number(remaining).toLocaleString()}
                            </Typography>
                            {paidAmount > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Paid: ₹{Number(paidAmount).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{getFacingLabel(plot.facing)}</TableCell>
                  <TableCell>
                    <Chip
                      label={plot.status.toUpperCase()}
                      color={getStatusColor(plot.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => {
                          setViewingPlot(plot)
                          setViewDialogOpen(true)
                        }}
                        title="View Details"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openEditDialog(plot)}
                        title="Edit Plot"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => {
                          setPaymentPlot(plot)
                          setPaymentData({
                            amount: '',
                            mode: '',
                            date: new Date().toISOString().split('T')[0],
                            notes: ''
                          })
                          setPaymentDialogOpen(true)
                        }}
                        title="Add Payment"
                      >
                        <Payment fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePlot(plot._id)}
                        title="Delete Plot"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredPlots.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[20, 50, 100]}
        />
      </TableContainer>

      {/* Add Plot Dialog */}
      <Dialog open={addDialogOpen} onClose={closeAddDialog} fullWidth maxWidth="md">
        <DialogTitle>Add New Plot</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Property Selector - REQUIRED */}
            <FormControl size="small" error={!!errors.propertyId} required>
              <InputLabel id="property-select-label">Property *</InputLabel>
              <Select
                labelId="property-select-label"
                value={newPlot.propertyId || ''}
                label="Property *"
                onChange={(e) => {
                  const selectedProperty = properties.find(p => p._id === e.target.value)
                  setNewPlot((s) => ({ 
                    ...s, 
                    propertyId: e.target.value,
                    colonyId: selectedProperty?.colony?._id || selectedProperty?.colony || '',
                    pricePerGaj: selectedProperty?.basePricePerGaj || s.pricePerGaj
                  }))
                  clearError('propertyId')
                }}
              >
                <MenuItem value="">
                  <em>Select Property</em>
                </MenuItem>
                {properties.map((property) => (
                  <MenuItem key={property._id} value={property._id}>
                    {property.name} - {property.category}
                  </MenuItem>
                ))}
              </Select>
              {errors.propertyId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.propertyId}
                </Typography>
              )}
            </FormControl>

            {/* Remaining Land Calculation Display */}
            {newPlot.propertyId && (() => {
              const selectedProperty = properties.find(p => p._id === newPlot.propertyId)
              if (!selectedProperty) return null
              
              const landCalc = calculateRemainingLand(selectedProperty)
              
              return (
                <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary">
                    📊 Land Calculation Summary - {selectedProperty.name}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Total Land: <strong>{landCalc.total} Gaj</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Roads: <strong>{landCalc.roads} Gaj</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Parks: <strong>{landCalc.parks} Gaj</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Used Area: <strong>{landCalc.used} Gaj</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="body1" color="success.main" fontWeight={700}>
                        ✅ Remaining Land: {landCalc.remaining} Gaj
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {selectedProperty.basePricePerGaj && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      💰 Base Price: ₹{selectedProperty.basePricePerGaj.toLocaleString()}/Gaj
                    </Typography>
                  )}
                </Box>
              )
            })()}

            {/* Colony is auto-selected from Property */}
            {newPlot.colonyId && (() => {
              const colony = colonies.find(c => c._id === newPlot.colonyId)
              return colony ? (
                <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Colony: <strong>{colony.name}</strong>
                  </Typography>
                </Box>
              ) : null
            })()}

            {renderKhatoniHolderInfoSection(newPlot.colonyId)}

            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <FormLabel component="legend">Plot Owner</FormLabel>
              <RadioGroup
                row
                value={newPlot.ownerType}
                onChange={(e) => setNewPlot((s) => ({ ...s, ownerType: e.target.value }))}
              >
                <FormControlLabel value="owner" control={<Radio size="small" />} label="Owner" />
                <FormControlLabel value="khatoniHolder" control={<Radio size="small" />} label="Khatoni Holder" />
              </RadioGroup>
            </FormControl>

            <TextField 
              size="small" 
              label="Plot Number *" 
              value={newPlot.plotNo} 
              onChange={(e) => {
                setNewPlot((s) => ({ ...s, plotNo: e.target.value }))
                clearError('plotNo')
              }}
              error={!!errors.plotNo}
              helperText={errors.plotNo}
              required
            />
            
            {/* Side Measurements */}
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Plot Dimensions (in feet) *
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Front Side (ft) *" 
                    type="number"
                    value={newPlot.frontSide} 
                    onChange={(e) => {
                      handleSideMeasurementChange('frontSide', e.target.value)
                      clearError('frontSide')
                    }}
                    error={!!errors.frontSide}
                    helperText={errors.frontSide}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Back Side (ft) *" 
                    type="number"
                    value={newPlot.backSide} 
                    onChange={(e) => {
                      handleSideMeasurementChange('backSide', e.target.value)
                      clearError('backSide')
                    }}
                    error={!!errors.backSide}
                    helperText={errors.backSide}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Left Side (ft) *" 
                    type="number"
                    value={newPlot.leftSide} 
                    onChange={(e) => {
                      handleSideMeasurementChange('leftSide', e.target.value)
                      clearError('leftSide')
                    }}
                    error={!!errors.leftSide}
                    helperText={errors.leftSide}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth
                    size="small" 
                    label="Right Side (ft) *" 
                    type="number"
                    value={newPlot.rightSide} 
                    onChange={(e) => {
                      handleSideMeasurementChange('rightSide', e.target.value)
                      clearError('rightSide')
                    }}
                    error={!!errors.rightSide}
                    helperText={errors.rightSide}
                    required
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
              label="Price per Gaj *" 
              type="number" 
              value={newPlot.pricePerGaj} 
              onChange={(e) => {
                updatePricingFromPricePerGaj(e.target.value)
                clearError('pricePerGaj')
              }}
              error={!!errors.pricePerGaj}
              helperText={errors.pricePerGaj}
              required
            />
            <TextField
              size="small"
              label="Total Price (Auto-calculated)"
              type="number"
              value={newPlot.totalPrice}
              onChange={(e) => updatePricingFromTotal(e.target.value)}
              InputProps={{ readOnly: true }}
            />
            
            <FormControl size="small" error={!!errors.facing} required>
              <InputLabel id="facing-select-label">Facing *</InputLabel>
              <Select
                labelId="facing-select-label"
                value={newPlot.facing}
                label="Facing *"
                onChange={(e) => {
                  setNewPlot((s) => ({ ...s, facing: e.target.value }))
                  clearError('facing')
                }}
              >
                <MenuItem value="">Select Facing</MenuItem>
                {FACING_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.facing && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.facing}
                </Typography>
              )}
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  fullWidth
                  size="small" 
                  select 
                  label="Plot Type *" 
                  value={newPlot.plotType} 
                  onChange={(e) => setNewPlot((s) => ({ ...s, plotType: e.target.value }))}
                >
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  fullWidth
                  size="small" 
                  select 
                  label="Status" 
                  value={newPlot.status} 
                  onChange={(e) => setNewPlot((s) => ({ ...s, status: e.target.value }))}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {/* Plot Images Upload */}
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Plot Images (Optional)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
              >
                Upload Plot Photos
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files)
                    setNewPlot((s) => ({ ...s, plotImages: files }))
                  }}
                />
              </Button>
              {newPlot.plotImages && newPlot.plotImages.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="success.main">
                    ✓ {newPlot.plotImages.length} image(s) selected
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {newPlot.plotImages.map((file, idx) => (
                      <Chip 
                        key={idx} 
                        label={file.name} 
                        size="small" 
                        onDelete={() => {
                          setNewPlot((s) => ({
                            ...s,
                            plotImages: s.plotImages.filter((_, i) => i !== idx)
                          }))
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Conditional fields for Booked/Sold status */}
            {(newPlot.status === 'booked' || newPlot.status === 'sold') && (
              <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffb74d' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: '#e65100' }}>
                  {newPlot.status === 'booked' ? 'Booking Details' : 'Sale Details'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    size="small"
                    label="Customer Name *"
                    value={newPlot.customerName}
                    onChange={(e) => {
                      setNewPlot((s) => ({ ...s, customerName: e.target.value }))
                      clearError('customerName')
                    }}
                    error={!!errors.customerName}
                    helperText={errors.customerName}
                    required
                  />
                  <TextField
                    size="small"
                    label="Customer Number *"
                    type="tel"
                    value={newPlot.customerNumber}
                    onChange={(e) => {
                      setNewPlot((s) => ({ ...s, customerNumber: e.target.value }))
                      clearError('customerNumber')
                    }}
                    error={!!errors.customerNumber}
                    helperText={errors.customerNumber}
                    placeholder="10 digit mobile number"
                    required
                  />
                  <TextField
                    size="small"
                    label="Customer Short Address *"
                    value={newPlot.customerShortAddress}
                    onChange={(e) => {
                      setNewPlot((s) => ({ ...s, customerShortAddress: e.target.value }))
                      clearError('customerShortAddress')
                    }}
                    error={!!errors.customerShortAddress}
                    helperText={errors.customerShortAddress}
                    required
                  />
                  <TextField
                    size="small"
                    label="Registry Date (Optional)"
                    type="date"
                    value={newPlot.registryDate}
                    onChange={(e) => setNewPlot((s) => ({ ...s, registryDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    size="small"
                    label="Customer Full Address (Optional)"
                    multiline
                    rows={2}
                    value={newPlot.customerFullAddress}
                    onChange={(e) => setNewPlot((s) => ({ ...s, customerFullAddress: e.target.value }))}
                  />
                  <TextField
                    size="small"
                    label="More Information (Optional)"
                    multiline
                    rows={2}
                    value={newPlot.moreInformation}
                    onChange={(e) => setNewPlot((s) => ({ ...s, moreInformation: e.target.value }))}
                  />
                  <TextField
                    size="small"
                    label="Final Price (Optional)"
                    type="number"
                    value={newPlot.finalPrice}
                    onChange={(e) => {
                      setNewPlot((s) => ({ ...s, finalPrice: e.target.value }))
                      clearError('finalPrice')
                    }}
                    error={!!errors.finalPrice}
                    helperText={errors.finalPrice}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      size="small"
                      label="Agent Name (Optional)"
                      value={newPlot.agentName}
                      onChange={(e) => setNewPlot((s) => ({ ...s, agentName: e.target.value }))}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Agent Code (Optional)"
                      value={newPlot.agentCode}
                      onChange={(e) => setNewPlot((s) => ({ ...s, agentCode: e.target.value }))}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      size="small"
                      label="Advocate Name (Optional)"
                      value={newPlot.advocateName}
                      onChange={(e) => setNewPlot((s) => ({ ...s, advocateName: e.target.value }))}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Advocate Code (Optional)"
                      value={newPlot.advocateCode}
                      onChange={(e) => setNewPlot((s) => ({ ...s, advocateCode: e.target.value }))}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <TextField
                    size="small"
                    select
                    label="Tahsil (Optional)"
                    value={newPlot.tahsil}
                    onChange={(e) => setNewPlot((s) => ({ ...s, tahsil: e.target.value }))}
                  >
                    <MenuItem value="">Select Tahsil</MenuItem>
                    {TAHSIL_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    select
                    label="Mode of Payment (Optional)"
                    value={newPlot.modeOfPayment}
                    onChange={(e) => setNewPlot((s) => ({ ...s, modeOfPayment: e.target.value }))}
                  >
                    <MenuItem value="">Select Mode</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="upi">UPI</MenuItem>
                    <MenuItem value="cheque">Cheque</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                  </TextField>
                  <TextField
                    size="small"
                    label="Transaction Date & Time (Optional)"
                    type="datetime-local"
                    value={newPlot.transactionDate}
                    onChange={(e) => setNewPlot((s) => ({ ...s, transactionDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    size="small"
                    label="Amount Paid (Optional)"
                    type="number"
                    value={newPlot.paidAmount}
                    onChange={(e) => {
                      setNewPlot((s) => ({ ...s, paidAmount: e.target.value }))
                      clearError('paidAmount')
                    }}
                    error={!!errors.paidAmount}
                    helperText={errors.paidAmount}
                  />
                  <Box>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      size="small"
                    >
                      Upload Payment Slip/Screenshot (Optional)
                      <input
                        type="file"
                        hidden
                        accept="image/*,.pdf"
                        onChange={(e) => setNewPlot((s) => ({ ...s, paymentSlip: e.target.files[0] }))}
                      />
                    </Button>
                    {newPlot.paymentSlip && (
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                        ✓ {newPlot.paymentSlip.name}
                      </Typography>
                    )}
                  </Box>
                  {newPlot.status === 'sold' && (
                    <Box>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        size="small"
                        color="secondary"
                      >
                        Upload Registry Document (Optional)
                        <input
                          type="file"
                          hidden
                          accept="image/*,.pdf"
                          onChange={(e) => setNewPlot((s) => ({ ...s, registryDocument: e.target.files[0] }))}
                        />
                      </Button>
                      {newPlot.registryDocument && (
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                          ✓ {newPlot.registryDocument.name}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
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
            {/* Property Selector - REQUIRED */}
            <FormControl size="small" error={!!errors.propertyId} required>
              <InputLabel id="property-select-label-edit">Property *</InputLabel>
              <Select
                labelId="property-select-label-edit"
                value={newPlot.propertyId || ''}
                label="Property *"
                onChange={(e) => {
                  const selectedProperty = properties.find(p => p._id === e.target.value)
                  setNewPlot((s) => ({ 
                    ...s, 
                    propertyId: e.target.value,
                    colonyId: selectedProperty?.colony?._id || selectedProperty?.colony || '',
                    pricePerGaj: selectedProperty?.basePricePerGaj || s.pricePerGaj
                  }))
                  clearError('propertyId')
                }}
              >
                <MenuItem value="">
                  <em>Select Property</em>
                </MenuItem>
                {properties.map((property) => (
                  <MenuItem key={property._id} value={property._id}>
                    {property.name} - {property.category}
                  </MenuItem>
                ))}
              </Select>
              {errors.propertyId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.propertyId}
                </Typography>
              )}
            </FormControl>

            {/* Colony is auto-selected from Property */}
            {newPlot.colonyId && (() => {
              const colony = colonies.find(c => c._id === newPlot.colonyId)
              return colony ? (
                <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Colony: <strong>{colony.name}</strong>
                  </Typography>
                </Box>
              ) : null
            })()}

            {renderKhatoniHolderInfoSection(newPlot.colonyId)}

            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <FormLabel component="legend">Plot Owner</FormLabel>
              <RadioGroup
                row
                value={newPlot.ownerType}
                onChange={(e) => setNewPlot((s) => ({ ...s, ownerType: e.target.value }))}
              >
                <FormControlLabel value="owner" control={<Radio size="small" />} label="Owner" />
                <FormControlLabel value="khatoniHolder" control={<Radio size="small" />} label="Khatoni Holder" />
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

            {/* Conditional fields for Booked/Sold status */}
            {(newPlot.status === 'booked' || newPlot.status === 'sold') && (
              <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffb74d' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: '#e65100' }}>
                  {newPlot.status === 'booked' ? 'Booking Details' : 'Sale Details'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    size="small"
                    label="Customer Name *"
                    value={newPlot.customerName}
                    onChange={(e) => {
                      setNewPlot((s) => ({ ...s, customerName: e.target.value }))
                      clearError('customerName')
                    }}
                    error={!!errors.customerName}
                    helperText={errors.customerName}
                    required
                  />
                  <TextField
                    size="small"
                    label="Customer Number *"
                    type="tel"
                    value={newPlot.customerNumber}
                    onChange={(e) => {
                      setNewPlot((s) => ({ ...s, customerNumber: e.target.value }))
                      clearError('customerNumber')
                    }}
                    error={!!errors.customerNumber}
                    helperText={errors.customerNumber}
                    placeholder="10 digit mobile number"
                    required
                  />
                  <TextField
                    size="small"
                    label="Customer Short Address *"
                    value={newPlot.customerShortAddress}
                    onChange={(e) => {
                      setNewPlot((s) => ({ ...s, customerShortAddress: e.target.value }))
                      clearError('customerShortAddress')
                    }}
                    error={!!errors.customerShortAddress}
                    helperText={errors.customerShortAddress}
                    required
                  />
                  <TextField
                    size="small"
                    label="Registry Date (Optional)"
                    type="date"
                    value={newPlot.registryDate}
                    onChange={(e) => setNewPlot((s) => ({ ...s, registryDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    size="small"
                    label="Customer Full Address (Optional)"
                    multiline
                    rows={2}
                    value={newPlot.customerFullAddress}
                    onChange={(e) => setNewPlot((s) => ({ ...s, customerFullAddress: e.target.value }))}
                  />
                  <TextField
                    size="small"
                    label="More Information (Optional)"
                    multiline
                    rows={2}
                    value={newPlot.moreInformation}
                    onChange={(e) => setNewPlot((s) => ({ ...s, moreInformation: e.target.value }))}
                  />
                  <TextField
                    size="small"
                    label="Final Price (Optional)"
                    type="number"
                    value={newPlot.finalPrice}
                    onChange={(e) => {
                      setNewPlot((s) => ({ ...s, finalPrice: e.target.value }))
                      clearError('finalPrice')
                    }}
                    error={!!errors.finalPrice}
                    helperText={errors.finalPrice}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      size="small"
                      label="Agent Name (Optional)"
                      value={newPlot.agentName}
                      onChange={(e) => setNewPlot((s) => ({ ...s, agentName: e.target.value }))}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Agent Code (Optional)"
                      value={newPlot.agentCode}
                      onChange={(e) => setNewPlot((s) => ({ ...s, agentCode: e.target.value }))}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      size="small"
                      label="Advocate Name (Optional)"
                      value={newPlot.advocateName}
                      onChange={(e) => setNewPlot((s) => ({ ...s, advocateName: e.target.value }))}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Advocate Code (Optional)"
                      value={newPlot.advocateCode}
                      onChange={(e) => setNewPlot((s) => ({ ...s, advocateCode: e.target.value }))}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <TextField
                    size="small"
                    select
                    label="Tahsil (Optional)"
                    value={newPlot.tahsil}
                    onChange={(e) => setNewPlot((s) => ({ ...s, tahsil: e.target.value }))}
                  >
                    <MenuItem value="">Select Tahsil</MenuItem>
                    {TAHSIL_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    select
                    label="Mode of Payment (Optional)"
                    value={newPlot.modeOfPayment}
                    onChange={(e) => setNewPlot((s) => ({ ...s, modeOfPayment: e.target.value }))}
                  >
                    <MenuItem value="">Select Mode</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="upi">UPI</MenuItem>
                    <MenuItem value="cheque">Cheque</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                  </TextField>
                  <TextField
                    size="small"
                    label="Transaction Date & Time (Optional)"
                    type="datetime-local"
                    value={newPlot.transactionDate}
                    onChange={(e) => setNewPlot((s) => ({ ...s, transactionDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    size="small"
                    label="Amount Paid (Optional)"
                    type="number"
                    value={newPlot.paidAmount}
                    onChange={(e) => {
                      setNewPlot((s) => ({ ...s, paidAmount: e.target.value }))
                      clearError('paidAmount')
                    }}
                    error={!!errors.paidAmount}
                    helperText={errors.paidAmount}
                  />
                  <Box>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      size="small"
                    >
                      Upload Payment Slip/Screenshot (Optional)
                      <input
                        type="file"
                        hidden
                        accept="image/*,.pdf"
                        onChange={(e) => setNewPlot((s) => ({ ...s, paymentSlip: e.target.files[0] }))}
                      />
                    </Button>
                    {newPlot.paymentSlip && (
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                        ✓ {newPlot.paymentSlip.name}
                      </Typography>
                    )}
                  </Box>
                  {newPlot.status === 'sold' && (
                    <Box>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        size="small"
                        color="secondary"
                      >
                        Upload Registry Document (Optional)
                        <input
                          type="file"
                          hidden
                          accept="image/*,.pdf"
                          onChange={(e) => setNewPlot((s) => ({ ...s, registryDocument: e.target.files[0] }))}
                        />
                      </Button>
                      {newPlot.registryDocument && (
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                          ✓ {newPlot.registryDocument.name}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleEditPlot}>Update Plot</Button>
        </DialogActions>
      </Dialog>

      {/* View Plot Details Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => {
          setViewDialogOpen(false)
          setViewingPlot(null)
          setShowTransactions(false)
          setShowPlotDetails(false)
        }} 
        fullWidth 
        maxWidth="lg"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Plot Details - {viewingPlot?.plotNo}</Typography>
            <Box display="flex" gap={1}>
              <Button 
                variant={showTransactions ? "contained" : "outlined"}
                size="small"
                onClick={() => {
                  setShowTransactions(true)
                  setShowPlotDetails(false)
                }}
              >
                Transactions
              </Button>
              <Button 
                variant={showPlotDetails ? "contained" : "outlined"}
                size="small"
                onClick={() => {
                  setShowPlotDetails(true)
                  setShowTransactions(false)
                }}
              >
                Plot Details
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewingPlot && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              
              {/* Transaction Card */}
              {showTransactions && (
                <Paper elevation={3} sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    💳 Payment Transactions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Price</Typography>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        ₹{Number(viewingPlot.finalPrice || viewingPlot.totalPrice).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Paid Amount</Typography>
                      <Typography variant="h6" fontWeight={700} color="success.main">
                        ₹{Number(viewingPlot.paidAmount || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Remaining Payment</Typography>
                      <Typography variant="h5" fontWeight={700} color="error.main">
                        ₹{Number((viewingPlot.finalPrice || viewingPlot.totalPrice) - (viewingPlot.paidAmount || 0)).toLocaleString()}
                      </Typography>
                    </Grid>
                    {viewingPlot.transactionDate && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Last Transaction Date</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {new Date(viewingPlot.transactionDate).toLocaleDateString('en-IN')}
                        </Typography>
                      </Grid>
                    )}
                    {viewingPlot.modeOfPayment && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Payment Mode</Typography>
                        <Chip 
                          label={viewingPlot.modeOfPayment.replace('_', ' ').toUpperCase()} 
                          size="small"
                          color="info"
                        />
                      </Grid>
                    )}
                  </Grid>
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Payment History
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {viewingPlot.paidAmount > 0 
                        ? `Payment of ₹${viewingPlot.paidAmount?.toLocaleString()} received on ${viewingPlot.transactionDate ? new Date(viewingPlot.transactionDate).toLocaleDateString('en-IN') : 'N/A'}`
                        : 'No payments received yet'
                      }
                    </Typography>
                  </Box>
                </Paper>
              )}

              {/* Plot Details Card */}
              {showPlotDetails && (
                <Paper elevation={3} sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    📋 Complete Plot Information
                  </Typography>
                  {/* Basic Information */}
                  <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Plot Number</Typography>
                    <Typography variant="body1" fontWeight={600}>{viewingPlot.plotNo}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Colony</Typography>
                    <Typography variant="body1" fontWeight={600}>{viewingPlot.colonyId?.name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={viewingPlot.status.toUpperCase()} 
                      color={getStatusColor(viewingPlot.status)} 
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Owner Type</Typography>
                    <Chip 
                      label={viewingPlot.ownerType === 'khatoniHolder' ? 'Khatoni Holder' : 'Owner'} 
                      size="small"
                      color={viewingPlot.ownerType === 'khatoniHolder' ? 'info' : 'default'}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Facing</Typography>
                    <Typography variant="body1" fontWeight={600}>{getFacingLabel(viewingPlot.facing)}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Dimensions */}
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'success.main' }}>
                  Dimensions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Front Side</Typography>
                    <Typography variant="body1" fontWeight={600}>{viewingPlot.frontSide || 'N/A'} ft</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Back Side</Typography>
                    <Typography variant="body1" fontWeight={600}>{viewingPlot.backSide || 'N/A'} ft</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Left Side</Typography>
                    <Typography variant="body1" fontWeight={600}>{viewingPlot.leftSide || 'N/A'} ft</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Right Side</Typography>
                    <Typography variant="body1" fontWeight={600}>{viewingPlot.rightSide || 'N/A'} ft</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Total Area</Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: 'success.main' }}>
                      {Number(viewingPlot.areaGaj).toFixed(3)} Gaj ({gajToSqFt(viewingPlot.areaGaj).toFixed(3)} sq ft)
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Pricing */}
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                  Pricing
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Price per Gaj</Typography>
                    <Typography variant="body1" fontWeight={600}>₹{Number(viewingPlot.pricePerGaj).toFixed(3)}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Price per Sq Ft</Typography>
                    <Typography variant="body1" fontWeight={600}>₹{pricePerGajToSqFt(viewingPlot.pricePerGaj).toFixed(3)}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Total Price</Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: 'error.main' }}>
                      ₹{Number(viewingPlot.totalPrice).toFixed(3)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Sale/Booking Details */}
              {(viewingPlot.status === 'booked' || viewingPlot.status === 'sold') && (
                <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: '#e65100' }}>
                    {viewingPlot.status === 'booked' ? 'Booking Details' : 'Sale Details'}
                  </Typography>
                  <Grid container spacing={2}>
                    {viewingPlot.customerName && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Customer Name</Typography>
                        <Typography variant="body1" fontWeight={600}>{viewingPlot.customerName}</Typography>
                      </Grid>
                    )}
                    {viewingPlot.customerNumber && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Customer Number</Typography>
                        <Typography variant="body1" fontWeight={600}>{viewingPlot.customerNumber}</Typography>
                      </Grid>
                    )}
                    {viewingPlot.customerShortAddress && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Customer Short Address</Typography>
                        <Typography variant="body1" fontWeight={600}>{viewingPlot.customerShortAddress}</Typography>
                      </Grid>
                    )}
                    {viewingPlot.customerFullAddress && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Customer Full Address</Typography>
                        <Typography variant="body1" fontWeight={600}>{viewingPlot.customerFullAddress}</Typography>
                      </Grid>
                    )}
                    {viewingPlot.registryDate && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Registry Date</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {new Date(viewingPlot.registryDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}
                    {viewingPlot.finalPrice && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Final Price</Typography>
                        <Typography variant="body1" fontWeight={600}>₹{viewingPlot.finalPrice?.toLocaleString()}</Typography>
                      </Grid>
                    )}
                    {viewingPlot.agentName && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Agent Name</Typography>
                        <Typography variant="body1" fontWeight={600}>{viewingPlot.agentName}</Typography>
                      </Grid>
                    )}
                    {viewingPlot.agentCode && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Agent Code</Typography>
                        <Typography variant="body1" fontWeight={600}>{viewingPlot.agentCode}</Typography>
                      </Grid>
                    )}
                    {viewingPlot.advocateName && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Advocate Name</Typography>
                        <Typography variant="body1" fontWeight={600}>{viewingPlot.advocateName}</Typography>
                      </Grid>
                    )}
                    {viewingPlot.advocateCode && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Advocate Code</Typography>
                        <Typography variant="body1" fontWeight={600}>{viewingPlot.advocateCode}</Typography>
                      </Grid>
                    )}
                    {viewingPlot.tahsil && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Tahsil</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {TAHSIL_OPTIONS.find(t => t.value === viewingPlot.tahsil)?.label || viewingPlot.tahsil}
                        </Typography>
                      </Grid>
                    )}
                    {viewingPlot.modeOfPayment && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Mode of Payment</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {viewingPlot.modeOfPayment.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Grid>
                    )}
                    {viewingPlot.transactionDate && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Transaction Date & Time</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {new Date(viewingPlot.transactionDate).toLocaleString()}
                        </Typography>
                      </Grid>
                    )}
                    {viewingPlot.paidAmount && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Amount Paid</Typography>
                        <Typography variant="body1" fontWeight={600}>₹{viewingPlot.paidAmount?.toLocaleString()}</Typography>
                      </Grid>
                    )}
                    {viewingPlot.moreInformation && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">More Information</Typography>
                        <Typography variant="body1" fontWeight={600}>{viewingPlot.moreInformation}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewDialogOpen(false)
            setViewingPlot(null)
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => {
          setPaymentDialogOpen(false)
          setPaymentPlot(null)
        }} 
        fullWidth 
        maxWidth="sm"
      >
        <DialogTitle>Add Payment - Plot {paymentPlot?.plotNo}</DialogTitle>
        <DialogContent>
          {paymentPlot && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Total Price</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      ₹{Number(paymentPlot.finalPrice || paymentPlot.totalPrice).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Paid</Typography>
                    <Typography variant="body1" fontWeight={600} color="success.main">
                      ₹{Number(paymentPlot.paidAmount || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Remaining</Typography>
                    <Typography variant="h6" fontWeight={700} color="error.main">
                      ₹{Number((paymentPlot.finalPrice || paymentPlot.totalPrice) - (paymentPlot.paidAmount || 0)).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <TextField
                label="Payment Amount"
                type="number"
                fullWidth
                required
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                placeholder="Enter amount"
                helperText="Enter the payment amount received"
              />
              
              <TextField
                label="Payment Mode"
                select
                fullWidth
                required
                value={paymentData.mode}
                onChange={(e) => setPaymentData({ ...paymentData, mode: e.target.value })}
              >
                <MenuItem value="">Select Mode</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="card">Card</MenuItem>
              </TextField>
              
              <TextField
                label="Transaction Date"
                type="date"
                fullWidth
                required
                value={paymentData.date}
                onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                label="Notes"
                multiline
                rows={3}
                fullWidth
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                placeholder="Add any notes about this payment"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPaymentDialogOpen(false)
            setPaymentPlot(null)
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleAddPayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Add Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PlotManagement
