import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
  Autocomplete,
} from '@mui/material'
import { Add, Edit, Delete, Visibility, Payment, Search, CloudUpload, ArrowBack } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumeric,
  validatePhone,
  validateEmail,
  validatePasswordDigits
} from '@/utils/validation'

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

const PLOT_TYPE_LABELS = {
  residential: 'Residential',
  commercial: 'Commercial',
  farmhouse: 'Farmhouse',
}

const getPropertyPlotTypes = (property) => {
  if (!property) {
    return ['residential', 'commercial', 'farmhouse']
  }

  const rawCategories = Array.isArray(property.categories) && property.categories.length
    ? property.categories
    : property.category
      ? [property.category]
      : []

  if (!rawCategories.length) {
    return ['residential', 'commercial', 'farmhouse']
  }

  const normalized = rawCategories
    .map((c) => (c ? c.toString().toLowerCase() : ''))

  const allowed = []

  if (normalized.some((c) => c.includes('residential'))) {
    allowed.push('residential')
  }
  if (normalized.some((c) => c.includes('commercial'))) {
    allowed.push('commercial')
  }
  if (normalized.some((c) => c.includes('farm'))) {
    allowed.push('farmhouse')
  }

  return allowed.length ? allowed : ['residential', 'commercial', 'farmhouse']
}

const PlotManagement = () => {
  const [plots, setPlots] = useState([])
  const [colonies, setColonies] = useState([])
  const [properties, setProperties] = useState([])
  const [agents, setAgents] = useState([])
  const [advocates, setAdvocates] = useState([])
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
    commissionPercentage: '',
    commissionAmount: '',
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
      propertyId: newPlot.propertyId,
      colony: newPlot.colonyId,
      // Ensure the user-entered plot number is sent as-is for both create and edit
      plotNumber: newPlot.plotNo,
      area,
      pricePerSqFt,
      totalPrice,
      facing: newPlot.facing,
      status: newPlot.status,
      ownerType: newPlot.ownerType,
      plotType: newPlot.plotType || 'residential',
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
      
      // Only include optional fields if they have values
      if (newPlot.customerFullAddress) {
        payload.customerFullAddress = newPlot.customerFullAddress
      }
      if (newPlot.registryDate) {
        payload.registryDate = newPlot.registryDate
      }
      if (newPlot.moreInformation) {
        payload.moreInformation = newPlot.moreInformation
      }
      if (newPlot.finalPrice) {
        payload.finalPrice = Number(newPlot.finalPrice)
      }
      if (newPlot.agentName) {
        payload.agentName = newPlot.agentName
      }
      if (newPlot.agentCode) {
        payload.agentCode = newPlot.agentCode
      }
      if (newPlot.commissionPercentage) {
        payload.commissionPercentage = Number(newPlot.commissionPercentage)
      }
      if (newPlot.commissionAmount) {
        payload.commissionAmount = Number(newPlot.commissionAmount)
      }
      if (newPlot.advocateName) {
        payload.advocateName = newPlot.advocateName
      }
      if (newPlot.advocateCode) {
        payload.advocateCode = newPlot.advocateCode
      }
      if (newPlot.tahsil) {
        payload.tahsil = newPlot.tahsil
      }
      if (newPlot.modeOfPayment) {
        payload.modeOfPayment = newPlot.modeOfPayment
      }
      if (newPlot.transactionDate) {
        payload.transactionDate = newPlot.transactionDate
      }
      if (newPlot.paidAmount) {
        payload.paidAmount = Number(newPlot.paidAmount)
      }
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

  const location = useLocation()

  useEffect(() => {
    fetchProperties()
    fetchColonies()
    fetchPlots()
    fetchAgents()
    fetchAdvocates()
  }, [])

  // Handle pre-selected property from navigation state
  useEffect(() => {
    if (location.state?.preSelectedProperty && location.state?.openAddDialog) {
      const propertyId = location.state.preSelectedProperty
      const colonyId = location.state.preSelectedColony
      const selectedProperty = properties.find(p => p._id === propertyId)
      
      if (selectedProperty) {
        const allowedPlotTypes = getPropertyPlotTypes(selectedProperty)
        setNewPlot((prev) => ({
          ...prev,
          propertyId: propertyId,
          colonyId: colonyId || '',
          pricePerGaj: selectedProperty?.basePricePerGaj || prev.pricePerGaj,
          plotType: allowedPlotTypes[0] || 'residential'
        }))
        setAddDialogOpen(true)
      }
      
      // Clear the navigation state to prevent reopening on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state, properties])

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

  const fetchAgents = async () => {
    try {
      const { data } = await axios.get('/users?role=Agent&limit=1000')
      const agentList = Array.isArray(data?.data) ? data.data : []
      setAgents(agentList)
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }

  const fetchAdvocates = async () => {
    try {
      const { data } = await axios.get('/users?role=Lawyer&limit=1000')
      const advocateList = Array.isArray(data?.data) ? data.data : []
      setAdvocates(advocateList)
    } catch (error) {
      console.error('Failed to fetch advocates:', error)
    }
  }

  const handleFilterChange = (colonyId) => {
    setFilterColony(colonyId)
    fetchPlots(colonyId)
  }

  // Auto-fill handlers for Agent fields
  const handleAgentNameChange = (value) => {
    setNewPlot((s) => ({ ...s, agentName: value }))
    
    // Find agent by name and auto-fill code
    const agent = agents.find(a => a.name.toLowerCase() === value.toLowerCase())
    if (agent && agent.userCode) {
      setNewPlot((s) => ({ ...s, agentName: value, agentCode: agent.userCode }))
    }
  }

  const handleAgentCodeChange = (value) => {
    setNewPlot((s) => ({ ...s, agentCode: value }))
    
    // Find agent by code and auto-fill name
    const agent = agents.find(a => a.userCode && a.userCode.toLowerCase() === value.toLowerCase())
    if (agent && agent.name) {
      setNewPlot((s) => ({ ...s, agentCode: value, agentName: agent.name }))
    }
  }

  // Commission calculation handlers
  const handleCommissionPercentageChange = (value) => {
    const percentage = value === '' ? '' : Number(value)
    setNewPlot((s) => {
      const soldTotalPrice = (Number(s.finalPrice) || 0) * (Number(s.areaGaj) || 0)
      const commissionAmount = soldTotalPrice && percentage !== '' ? (soldTotalPrice * percentage / 100) : ''
      return { ...s, commissionPercentage: value, commissionAmount: commissionAmount }
    })
  }

  const handleCommissionAmountChange = (value) => {
    const amount = value === '' ? '' : Number(value)
    setNewPlot((s) => {
      const soldTotalPrice = (Number(s.finalPrice) || 0) * (Number(s.areaGaj) || 0)
      const percentage = soldTotalPrice && amount !== '' ? ((amount / soldTotalPrice) * 100).toFixed(2) : ''
      return { ...s, commissionAmount: value, commissionPercentage: percentage }
    })
  }

  // Auto-fill handlers for Advocate fields
  const handleAdvocateNameChange = (value) => {
    setNewPlot((s) => ({ ...s, advocateName: value }))
    
    // Find advocate by name and auto-fill code
    const advocate = advocates.find(a => a.name.toLowerCase() === value.toLowerCase())
    if (advocate && advocate.userCode) {
      setNewPlot((s) => ({ ...s, advocateName: value, advocateCode: advocate.userCode }))
    }
  }

  const handleAdvocateCodeChange = (value) => {
    setNewPlot((s) => ({ ...s, advocateCode: value }))
    
    // Find advocate by code and auto-fill name
    const advocate = advocates.find(a => a.userCode && a.userCode.toLowerCase() === value.toLowerCase())
    if (advocate && advocate.name) {
      setNewPlot((s) => ({ ...s, advocateCode: value, advocateName: advocate.name }))
    }
  }

  const handleFinalPriceChange = (value) => {
    setNewPlot((s) => {
      const soldTotalPrice = (Number(value) || 0) * (Number(s.areaGaj) || 0)
      const percentage = Number(s.commissionPercentage) || 0
      const commissionAmount = soldTotalPrice && percentage ? (soldTotalPrice * percentage / 100) : s.commissionAmount
      return { ...s, finalPrice: value, commissionAmount: commissionAmount }
    })
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
      commissionPercentage: '',
      commissionAmount: '',
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
      plotType: plot.plotType || 'residential',
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
      plotImages: [],
      customerName: plot.customerName || '',
      customerNumber: plot.customerNumber || '',
      customerShortAddress: plot.customerShortAddress || '',
      customerFullAddress: plot.customerFullAddress || '',
      registryDate: plot.registryDate || '',
      moreInformation: plot.moreInformation || '',
      finalPrice: plot.finalPrice?.toString() || '',
      agentName: plot.agentName || '',
      agentCode: plot.agentCode || '',
      commissionPercentage: plot.commissionPercentage?.toString() || '',
      commissionAmount: plot.commissionAmount?.toString() || '',
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
      customerName: '', 
      customerNumber: '', 
      customerShortAddress: '',
      customerFullAddress: '',
      registryDate: '',
      moreInformation: '',
      finalPrice: '',
      agentName: '',
      agentCode: '',
      commissionPercentage: '',
      commissionAmount: '',
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
      const percentage = Number(prev.commissionPercentage) || 0
      const commissionAmount = totalPrice && percentage ? (Number(totalPrice) * percentage / 100) : prev.commissionAmount
      return {
        ...prev,
        totalPrice,
        pricePerGaj: pricePerGaj || prev.pricePerGaj,
        commissionAmount: commissionAmount
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

    // Plot Number validation with specific requirements
    const plotNoError = validateRequired(newPlot.plotNo, 'Plot number') ||
                       validateMinLength(newPlot.plotNo, 1, 'Plot number') ||
                       validateMaxLength(newPlot.plotNo, 20, 'Plot number')
    if (plotNoError) {
      newErrors.plotNo = plotNoError
      isValid = false
    }

    // Dimensions Validation with specific messages
    const frontSideError = validateRequired(newPlot.frontSide, 'Front side dimension') || 
                          validateNumeric(newPlot.frontSide, 'Front side dimension')
    if (frontSideError) {
      newErrors.frontSide = frontSideError
      isValid = false
    }

    const backSideError = validateRequired(newPlot.backSide, 'Back side dimension') || 
                         validateNumeric(newPlot.backSide, 'Back side dimension')
    if (backSideError) {
      newErrors.backSide = backSideError
      isValid = false
    }

    const leftSideError = validateRequired(newPlot.leftSide, 'Left side dimension') || 
                         validateNumeric(newPlot.leftSide, 'Left side dimension')
    if (leftSideError) {
      newErrors.leftSide = leftSideError
      isValid = false
    }

    const rightSideError = validateRequired(newPlot.rightSide, 'Right side dimension') || 
                          validateNumeric(newPlot.rightSide, 'Right side dimension')
    if (rightSideError) {
      newErrors.rightSide = rightSideError
      isValid = false
    }

    // Area validation
    const areaError = validateRequired(newPlot.areaGaj, 'Area in Gaj') || 
                     validateNumeric(newPlot.areaGaj, 'Area in Gaj')
    if (areaError) {
      newErrors.areaGaj = areaError
      isValid = false
    }

    // Pricing Validation with specific requirements
    const pricePerGajError = validateRequired(newPlot.pricePerGaj, 'Price per Gaj') || 
                            validateNumeric(newPlot.pricePerGaj, 'Price per Gaj')
    if (pricePerGajError) {
      newErrors.pricePerGaj = pricePerGajError
      isValid = false
    }

    // Total Price validation
    if (newPlot.totalPrice) {
      const totalPriceError = validateNumeric(newPlot.totalPrice, 'Total price')
      if (totalPriceError) {
        newErrors.totalPrice = totalPriceError
        isValid = false
      }
    }

    // Facing Validation
    const facingError = validateRequired(newPlot.facing, 'Facing direction')
    if (facingError) {
      newErrors.facing = facingError
      isValid = false
    }

    // Sale/Booking Details Validation (only if status is booked or sold)
    if (newPlot.status === 'booked' || newPlot.status === 'sold') {
      const customerNameError = validateRequired(newPlot.customerName, 'Customer name') ||
                               validateMinLength(newPlot.customerName, 2, 'Customer name') ||
                               validateMaxLength(newPlot.customerName, 100, 'Customer name')
      if (customerNameError) {
        newErrors.customerName = customerNameError
        isValid = false
      }

      const customerNumberError = validateRequired(newPlot.customerNumber, 'Customer phone number') ||
                                 validatePhone(newPlot.customerNumber)
      if (customerNumberError) {
        newErrors.customerNumber = customerNumberError
        isValid = false
      }

      const customerAddressError = validateRequired(newPlot.customerShortAddress, 'Customer short address') ||
                                  validateMinLength(newPlot.customerShortAddress, 5, 'Customer short address') ||
                                  validateMaxLength(newPlot.customerShortAddress, 200, 'Customer short address')
      if (customerAddressError) {
        newErrors.customerShortAddress = customerAddressError
        isValid = false
      }

      // Optional field validations (only validate if filled)
      if (newPlot.finalPrice) {
        const finalPriceError = validateNumeric(newPlot.finalPrice, 'Sold price')
        if (finalPriceError) {
          newErrors.finalPrice = finalPriceError
          isValid = false
        }
      }

      if (newPlot.paidAmount) {
        const paidAmountError = validateNumeric(newPlot.paidAmount, 'Amount paid')
        if (paidAmountError) {
          newErrors.paidAmount = paidAmountError
          isValid = false
        }
      }
    }

    setErrors(newErrors)

    // Show appropriate toast messages with specific requirements
    if (!isValid) {
      const firstError = Object.values(newErrors)[0]
      toast.error(firstError, {
        duration: 4000,
        position: 'top-right'
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
      console.log('Edit Plot Payload:', payload)
      console.log('Commission fields in payload:', {
        commissionPercentage: payload.commissionPercentage,
        commissionAmount: payload.commissionAmount
      })
      
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
                  <InputLabel id="property-select-label">Property</InputLabel>
                  <Select
                    labelId="property-select-label"
                    value={newPlot.propertyId || ''}
                    label="Property *"
                    onChange={(e) => {
                      const selectedProperty = properties.find(p => p._id === e.target.value)
                      const allowedPlotTypes = getPropertyPlotTypes(selectedProperty)
                      setNewPlot((s) => ({ 
                        ...s, 
                        propertyId: e.target.value,
                        colonyId: selectedProperty?.colony?._id || selectedProperty?.colony || '',
                        pricePerGaj: selectedProperty?.basePricePerGaj || s.pricePerGaj,
                        plotType: allowedPlotTypes.includes(s.plotType) ? s.plotType : allowedPlotTypes[0] || 'residential',
                      }))
                      clearError('propertyId')
                    }}
                  >
                    <MenuItem value="">
                      <em>Select Property</em>
                    </MenuItem>
                    {properties.map((property) => {
                      const categories = Array.isArray(property.categories) && property.categories.length
                        ? property.categories.join(', ')
                        : property.category
                      return (
                        <MenuItem key={property._id} value={property._id}>
                          {property.name} - {categories}
                        </MenuItem>
                      )
                    })}
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

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth
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
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" error={!!errors.facing} required>
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
                  </Grid>
                </Grid>
                
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

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth
                      size="small" 
                      label="Asking Price per Gaj *" 
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
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Total Price (Auto-calculated)"
                      type="number"
                      value={newPlot.totalPrice}
                      onChange={(e) => updatePricingFromTotal(e.target.value)}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </Grid>

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
                      {getPropertyPlotTypes(properties.find(p => p._id === newPlot.propertyId)).map((type) => (
                        <MenuItem key={type} value={type}>{PLOT_TYPE_LABELS[type] || type}</MenuItem>
                      ))}
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
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
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
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
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
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
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
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Registry Date (Optional)"
                          type="date"
                          value={newPlot.registryDate}
                          onChange={(e) => setNewPlot((s) => ({ ...s, registryDate: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Customer Full Address (Optional)"
                          multiline
                          rows={2}
                          value={newPlot.customerFullAddress}
                          onChange={(e) => setNewPlot((s) => ({ ...s, customerFullAddress: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="More Information (Optional)"
                          multiline
                          rows={2}
                          value={newPlot.moreInformation}
                          onChange={(e) => setNewPlot((s) => ({ ...s, moreInformation: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Sold Price per Gaj (Optional)"
                          type="number"
                          value={newPlot.finalPrice}
                          onChange={(e) => {
                            handleFinalPriceChange(e.target.value)
                            clearError('finalPrice')
                          }}
                          error={!!errors.finalPrice}
                          helperText={errors.finalPrice || 'Enter negotiated price per Gaj'}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Total Sold Amount"
                          type="number"
                          value={newPlot.finalPrice && newPlot.areaGaj ? (Number(newPlot.finalPrice) * Number(newPlot.areaGaj)).toFixed(2) : ''}
                          InputProps={{ 
                            readOnly: true,
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                          }}
                          helperText="Auto-calculated from Sold Price × Area"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
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
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          freeSolo
                          options={agents.map(a => a.name)}
                          value={newPlot.agentName}
                          onInputChange={(event, newValue) => {
                            handleAgentNameChange(newValue || '')
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              size="small"
                              label="Agent Name (Optional)"
                              placeholder="Type to search..."
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          freeSolo
                          options={agents.map(a => a.userCode).filter(Boolean)}
                          value={newPlot.agentCode}
                          onInputChange={(event, newValue) => {
                            handleAgentCodeChange(newValue || '')
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              size="small"
                              label="Agent Code (Optional)"
                              placeholder="Type to search..."
                            />
                          )}
                        />
                      </Grid>
                      {(newPlot.agentName || newPlot.agentCode) && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Commission Percentage (%)"
                              value={newPlot.commissionPercentage}
                              onChange={(e) => handleCommissionPercentageChange(e.target.value)}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                              }}
                              helperText="Enter percentage to auto-calculate amount"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Commission Amount (₹)"
                              value={newPlot.commissionAmount}
                              onChange={(e) => handleCommissionAmountChange(e.target.value)}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>
                              }}
                              helperText="Enter amount to auto-calculate percentage"
                            />
                          </Grid>
                        </>
                      )}
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          freeSolo
                          options={advocates.map(a => a.name)}
                          value={newPlot.advocateName}
                          onInputChange={(event, newValue) => {
                            handleAdvocateNameChange(newValue || '')
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              size="small"
                              label="Advocate Name (Optional)"
                              placeholder="Type to search..."
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          freeSolo
                          options={advocates.map(a => a.userCode).filter(Boolean)}
                          value={newPlot.advocateCode}
                          onInputChange={(event, newValue) => {
                            handleAdvocateCodeChange(newValue || '')
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              size="small"
                              label="Advocate Code (Optional)"
                              placeholder="Type to search..."
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
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
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Transaction Date & Time (Optional)"
                          type="datetime-local"
                          value={newPlot.transactionDate}
                          onChange={(e) => setNewPlot((s) => ({ ...s, transactionDate: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
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
                      </Grid>
                      <Grid item xs={12} sm={6}>
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
                      </Grid>
                      {newPlot.status === 'sold' && (
                        <Grid item xs={12} sm={6}>
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
                        </Grid>
                      )}
                    </Grid>
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
                      const allowedPlotTypes = getPropertyPlotTypes(selectedProperty)
                      setNewPlot((s) => ({ 
                        ...s, 
                        propertyId: e.target.value,
                        colonyId: selectedProperty?.colony?._id || selectedProperty?.colony || '',
                        pricePerGaj: selectedProperty?.basePricePerGaj || s.pricePerGaj,
                        plotType: allowedPlotTypes.includes(s.plotType) ? s.plotType : allowedPlotTypes[0] || 'residential',
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
                      <MenuItem value="farmhouse">Farmhouse</MenuItem>
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
                        label="Sold Price per Gaj (Optional)"
                        type="number"
                        value={newPlot.finalPrice}
                        onChange={(e) => handleFinalPriceChange(e.target.value)}
                      />
                      <TextField
                        size="small"
                        label="Total Sold Amount"
                        type="number"
                        value={newPlot.finalPrice && newPlot.areaGaj ? (Number(newPlot.finalPrice) * Number(newPlot.areaGaj)).toFixed(2) : ''}
                        InputProps={{ 
                          readOnly: true,
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                        helperText="Auto-calculated from Sold Price × Area"
                      />
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Autocomplete
                          freeSolo
                          options={agents.map(a => a.name)}
                          value={newPlot.agentName}
                          onInputChange={(event, newValue) => {
                            handleAgentNameChange(newValue || '')
                          }}
                          sx={{ flex: 1 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              label="Agent Name (Optional)"
                              placeholder="Type to search..."
                            />
                          )}
                        />
                        <Autocomplete
                          freeSolo
                          options={agents.map(a => a.userCode).filter(Boolean)}
                          value={newPlot.agentCode}
                          onInputChange={(event, newValue) => {
                            handleAgentCodeChange(newValue || '')
                          }}
                          sx={{ flex: 1 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              label="Agent Code (Optional)"
                              placeholder="Type to search..."
                            />
                          )}
                        />
                      </Box>
                      {(newPlot.agentName || newPlot.agentCode) && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <TextField
                            size="small"
                            type="number"
                            label="Commission %"
                            value={newPlot.commissionPercentage}
                            onChange={(e) => handleCommissionPercentageChange(e.target.value)}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>
                            }}
                            sx={{ flex: 1 }}
                            helperText="Auto-calculates amount"
                          />
                          <TextField
                            size="small"
                            type="number"
                            label="Commission Amount"
                            value={newPlot.commissionAmount}
                            onChange={(e) => handleCommissionAmountChange(e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                            sx={{ flex: 1 }}
                            helperText="Auto-calculates %"
                          />
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Autocomplete
                          freeSolo
                          options={advocates.map(a => a.name)}
                          value={newPlot.advocateName}
                          onInputChange={(event, newValue) => {
                            handleAdvocateNameChange(newValue || '')
                          }}
                          sx={{ flex: 1 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              label="Advocate Name (Optional)"
                              placeholder="Type to search..."
                            />
                          )}
                        />
                        <Autocomplete
                          freeSolo
                          options={advocates.map(a => a.userCode).filter(Boolean)}
                          value={newPlot.advocateCode}
                          onInputChange={(event, newValue) => {
                            handleAdvocateCodeChange(newValue || '')
                          }}
                          sx={{ flex: 1 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              label="Advocate Code (Optional)"
                              placeholder="Type to search..."
                            />
                          )}
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
              <TableCell><strong>Sold Price/Gaj</strong></TableCell>
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
                // finalPrice is stored as per Gaj rate
                const finalPricePerGaj = plot.finalPrice || null;
                // Calculate total from finalPrice per Gaj
                const finalTotalPrice = plot.finalPrice && plot.areaGaj 
                  ? plot.finalPrice * plot.areaGaj 
                  : null;
                const displayTotalPrice = finalTotalPrice || plot.totalPrice;
                
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
                          console.log('=== VIEWING PLOT DATA ===')
                          console.log('Full Plot:', plot)
                          console.log('Dimensions:', plot.dimensions)
                          console.log('Side Measurements:', plot.sideMeasurements)
                          console.log('Commission Percentage:', plot.commissionPercentage)
                          console.log('Commission Amount:', plot.commissionAmount)
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
    </Box>
  )
}

export default PlotManagement
