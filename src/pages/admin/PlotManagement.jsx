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
  Tooltip,
  Checkbox,
  FormGroup,
  Alert,
} from '@mui/material'
import { Add, Edit, Delete, Visibility, Payment, Search, CloudUpload, ArrowBack, Close, PictureAsPdf, Image as ImageIcon } from '@mui/icons-material'
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
  console.log('PlotManagement Component Loaded - Version Fix 2.0')
  const [plots, setPlots] = useState([])
  const [colonies, setColonies] = useState([])
  const [properties, setProperties] = useState([])
  const [agents, setAgents] = useState([])
  const [advocates, setAdvocates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterColony, setFilterColony] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
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
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [errors, setErrors] = useState({})
  // Owner selection state
  const [availableOwners, setAvailableOwners] = useState([])
  const [selectedOwnerIds, setSelectedOwnerIds] = useState([])
  const [newPlot, setNewPlot] = useState({
    propertyId: '',
    colonyId: '',
    plotNo: '',
    plotType: 'residential',
    frontSide: '',
    backSide: '',
    leftSide: '',
    rightSide: '',
    // Adjacent features
    adjacentFront: '',
    adjacentBack: '',
    adjacentLeft: '',
    adjacentRight: '',
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
    customerAadharNumber: '',
    customerPanNumber: '',
    customerDateOfBirth: '',
    customerSonOf: '',
    customerDaughterOf: '',
    customerWifeOf: '',
    customerFullAddress: '',
    registryDate: '',
    moreInformation: '',
    finalPrice: '',
    agentName: '',
    agentCode: '',
    agentPhone: '',
    commissionPercentage: '',
    commissionAmount: '',
    advocateName: '',
    advocateCode: '',
    advocatePhone: '',
    tahsil: '',
    modeOfPayment: '',
    transactionDate: '',
    paidAmount: '',
    paymentSlip: null,
    registryDocument: null,
    registryDocuments: [],
    registryPdf: null,
    registryStatus: 'pending',
    customerAadharFront: null,
    customerAadharBack: null,
    customerPanCard: null,
    customerPassportPhoto: null,
    customerFullPhoto: null,
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
    return Number.isFinite(total) ? total.toFixed(2) : ''
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
        front: newPlot.adjacentFront,
        back: newPlot.adjacentBack,
        left: newPlot.adjacentLeft,
        right: newPlot.adjacentRight,
      },
      sideMeasurements: {
        front: toNumber(newPlot.frontSide),
        back: toNumber(newPlot.backSide),
        left: toNumber(newPlot.leftSide),
        right: toNumber(newPlot.rightSide),
      },
    }

    // Add selected owner IDs if owner type is 'owner'
    if (newPlot.ownerType === 'owner' && selectedOwnerIds.length > 0) {
      payload.selectedOwnerIds = selectedOwnerIds
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
      if (newPlot.customerAadharNumber) {
        payload.customerAadharNumber = newPlot.customerAadharNumber
      }
      if (newPlot.customerPanNumber) {
        payload.customerPanNumber = newPlot.customerPanNumber
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
      if (newPlot.agentPhone) {
        payload.agentPhone = newPlot.agentPhone
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
      if (newPlot.advocatePhone) {
        payload.advocatePhone = newPlot.advocatePhone
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
      if (newPlot.registryStatus) {
        payload.registryStatus = newPlot.registryStatus
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
    fetchOwners()
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

  const fetchOwners = async () => {
    try {
      const { data } = await axios.get('/settings/owners')
      const ownerList = Array.isArray(data?.data?.owners) ? data.data.owners : []
      setAvailableOwners(ownerList)
    } catch (error) {
      console.error('Failed to fetch owners:', error)
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
    setSelectedOwnerIds([]) // Clear selected owners
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
      customerAadharNumber: '',
      customerPanNumber: '',
      customerDateOfBirth: '',
      customerSonOf: '',
      customerDaughterOf: '',
      customerWifeOf: '',
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
      registryDocuments: [],
      registryPdf: null,
      registryStatus: 'pending'
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
      // Adjacent features
      adjacentFront: plot.dimensions?.front || '',
      adjacentBack: plot.dimensions?.back || '',
      adjacentLeft: plot.dimensions?.left || '',
      adjacentRight: plot.dimensions?.right || '',
      areaGaj: plot.areaGaj?.toString() || (plot.area ? sqFtToGaj(plot.area).toString() : ''),
      pricePerGaj: plot.pricePerGaj?.toString() || (plot.pricePerSqFt ? pricePerSqFtToGaj(plot.pricePerSqFt).toString() : ''),
      totalPrice: plot.totalPrice?.toString() || '',
      facing: plot.facing || '',
      status: plot.status || 'available',
      ownerType: plot.ownerType || 'owner',
      plotImages: plot.plotImages ?
        // Flatten any nested arrays and ensure we only have URL strings
        [plot.plotImages].flat(Infinity)
          .filter(url => url && typeof url === 'string')
          .map(url => ({
            name: url.split('/').pop(),
            url: url,
            isExisting: true
          }))
        : [],
      customerName: plot.customerName || '',
      customerNumber: plot.customerNumber ? plot.customerNumber.replace(/^\+91/, '') : '',
      customerShortAddress: plot.customerShortAddress || '',
      customerAadharNumber: plot.customerAadharNumber || '',
      customerPanNumber: plot.customerPanNumber || '',
      customerDateOfBirth: plot.customerDateOfBirth || '',
      customerSonOf: plot.customerSonOf || '',
      customerDaughterOf: plot.customerDaughterOf || '',
      customerWifeOf: plot.customerWifeOf || '',
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
      registryDocuments: plot.registryDocument ?
        // Flatten any nested arrays and ensure we only have URL strings
        [plot.registryDocument].flat(Infinity)
          .filter(url => url && typeof url === 'string')
          .map(url => ({
            name: url.split('/').pop(),
            url: url,
            isExisting: true
          }))
        : [],
      registryStatus: plot.registryStatus || 'pending',
      // Customer Documents (Mapping from nested object to flat state)
      customerAadharFront: plot.customerDocuments?.aadharFront || null,
      customerAadharBack: plot.customerDocuments?.aadharBack || null,
      customerPanCard: plot.customerDocuments?.panCard || null,
      customerPassportPhoto: plot.customerDocuments?.passportPhoto || null,
      customerFullPhoto: plot.customerDocuments?.fullPhoto || null,

      witnesses: plot.witnesses ? plot.witnesses.map(w => ({
        ...w,
        witnessDocuments: {
          aadharFront: w.witnessDocuments?.aadharFront || null,
          aadharBack: w.witnessDocuments?.aadharBack || null,
          panCard: w.witnessDocuments?.panCard || null,
          passportPhoto: w.witnessDocuments?.passportPhoto || null,
          fullPhoto: w.witnessDocuments?.fullPhoto || null,
        }
      })) : []
    })

    // Populate selected owner IDs from plot owners
    if (plot.plotOwners && Array.isArray(plot.plotOwners)) {
      const ownerIds = plot.plotOwners.map(owner => owner.ownerId).filter(Boolean)
      setSelectedOwnerIds(ownerIds)
    } else {
      setSelectedOwnerIds([])
    }

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
      registryDocuments: [],
      registryPdf: null,
      registryStatus: 'pending'
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

  const handleRegistryFileSelect = (event) => {
    const files = Array.from(event.target.files)
    const validFiles = []

    files.forEach(file => {
      // Check file size (1MB = 1024 * 1024 bytes)
      if (file.size > 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Max size is 1MB.`)
      } else {
        validFiles.push(file)
      }
    })

    if (validFiles.length > 0) {
      setNewPlot(prev => ({
        ...prev,
        registryDocuments: [...(prev.registryDocuments || []), ...validFiles]
      }))
    }

    // Reset input
    event.target.value = ''
  }

  const removeRegistryFile = (index) => {
    setNewPlot(prev => ({
      ...prev,
      registryDocuments: prev.registryDocuments.filter((_, i) => i !== index)
    }))
  }

  const handleAddPlot = async () => {
    if (!validatePlotForm()) return

    try {
      setLoading(true)
      const payload = buildPlotPayload()

      // Create FormData if there's a file to upload
      const formData = new FormData()

      // Append all payload fields (excluding file-related fields)
      const fileRelatedFields = ['registryDocuments', 'plotImages', 'paymentSlip', 'registryPdf',
        'customerAadharFront', 'customerAadharBack', 'customerPanCard',
        'customerPassportPhoto', 'customerFullPhoto'];

      Object.keys(payload).forEach(key => {
        if (fileRelatedFields.includes(key)) return;
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
      if (newPlot.registryDocuments && newPlot.registryDocuments.length > 0) {
        newPlot.registryDocuments.forEach((file) => {
          formData.append('registryDocument', file)
        })
      }
      if (newPlot.registryPdf) {
        formData.append('registryPdf', newPlot.registryPdf)
      }
      if (newPlot.plotImages && newPlot.plotImages.length > 0) {
        newPlot.plotImages.forEach((file) => {
          formData.append('plotImages', file)
        })
      }
      // Append customer documents if exist
      if (newPlot.customerAadharFront) {
        formData.append('customerAadharFront', newPlot.customerAadharFront)
      }
      if (newPlot.customerAadharBack) {
        formData.append('customerAadharBack', newPlot.customerAadharBack)
      }
      if (newPlot.customerPanCard) {
        formData.append('customerPanCard', newPlot.customerPanCard)
      }
      if (newPlot.customerPassportPhoto) {
        formData.append('customerPassportPhoto', newPlot.customerPassportPhoto)
      }
      if (newPlot.customerFullPhoto) {
        formData.append('customerFullPhoto', newPlot.customerFullPhoto)
      }

      // Append witnesses data and documents
      // Append witnesses data and documents
      if (newPlot.witnesses && newPlot.witnesses.length > 0) {
        // Prepare witness data for JSON (preserve existing URLs, exclude File objects)
        const witnessesData = newPlot.witnesses.map(w => {
          const documents = {};
          if (w.witnessDocuments) {
            Object.keys(w.witnessDocuments).forEach(docType => {
              const val = w.witnessDocuments[docType];
              if (typeof val === 'string') {
                documents[docType] = val; // Keep existing URL
              }
            });
          }
          return { ...w, witnessDocuments: documents };
        });
        formData.append('witnesses', JSON.stringify(witnessesData));

        // Append new witness documents (Files only)
        newPlot.witnesses.forEach((witness, idx) => {
          if (witness.witnessDocuments) {
            Object.keys(witness.witnessDocuments).forEach(docType => {
              const val = witness.witnessDocuments[docType];
              if (val instanceof File) {
                formData.append(`witnessDocuments[${idx}][${docType}]`, val);
              }
            });
          }
        });
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

      // Append all payload fields (excluding file-related fields)
      const fileRelatedFields = ['registryDocuments', 'plotImages', 'paymentSlip', 'registryPdf',
        'customerAadharFront', 'customerAadharBack', 'customerPanCard',
        'customerPassportPhoto', 'customerFullPhoto'];

      Object.keys(payload).forEach(key => {
        if (fileRelatedFields.includes(key)) return;
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
      if (newPlot.registryDocuments) {
        const existingDocs = [];
        newPlot.registryDocuments.forEach((file) => {
          if (file.url && file.isExisting) {
            // Handle case where file.url might itself be an array or nested structure
            const url = file.url;
            if (Array.isArray(url)) {
              // If url is an array, flatten it and add all URLs
              url.flat(Infinity).filter(u => u && typeof u === 'string').forEach(u => existingDocs.push(u));
            } else if (typeof url === 'string') {
              existingDocs.push(url);
            } else {
              // Try to convert to string as last resort
              const urlStr = String(url);
              if (urlStr && urlStr !== '[object Object]') {
                existingDocs.push(urlStr);
              }
            }
          } else if (!file.isExisting) {
            // This is a new file object
            formData.append('registryDocument', file);
          }
        });

        // Triple-check: aggressively flatten any nested arrays (safety measure)
        const flattenedDocs = existingDocs.flat(Infinity).filter(url => url && typeof url === 'string' && url.startsWith('http'));

        console.log('Registry Documents Debug:', {
          original: newPlot.registryDocuments,
          existingDocs,
          flattenedDocs
        });

        if (flattenedDocs.length > 0) {
          formData.append('existingRegistryDocuments', JSON.stringify(flattenedDocs));
        }
      }

      if (newPlot.registryPdf) {
        if (newPlot.registryPdf.url && newPlot.registryPdf.isExisting) {
          formData.append('registryPdf', newPlot.registryPdf.url)
        } else {
          formData.append('registryPdf', newPlot.registryPdf)
        }
      }
      if (newPlot.plotImages) {
        const existingImages = [];
        newPlot.plotImages.forEach((file) => {
          if (file.url && file.isExisting) {
            // Ensure we're only pushing the URL string, not nested arrays
            const url = typeof file.url === 'string' ? file.url : String(file.url);
            existingImages.push(url);
          } else if (!file.isExisting) {
            // This is a new file object
            formData.append('plotImages', file);
          }
        });

        // Double-check: flatten any nested arrays (safety measure)
        const flattenedImages = existingImages.flat(Infinity).filter(url => typeof url === 'string');

        if (flattenedImages.length > 0) {
          formData.append('existingPlotImages', JSON.stringify(flattenedImages));
        }
      }
      // Append customer documents if exist
      if (newPlot.customerAadharFront) {
        formData.append('customerAadharFront', newPlot.customerAadharFront)
      }
      if (newPlot.customerAadharBack) {
        formData.append('customerAadharBack', newPlot.customerAadharBack)
      }
      if (newPlot.customerPanCard) {
        formData.append('customerPanCard', newPlot.customerPanCard)
      }
      if (newPlot.customerPassportPhoto) {
        formData.append('customerPassportPhoto', newPlot.customerPassportPhoto)
      }
      if (newPlot.customerFullPhoto) {
        formData.append('customerFullPhoto', newPlot.customerFullPhoto)
      }

      // Append witnesses data and documents
      // Append witnesses data and documents
      if (newPlot.witnesses && newPlot.witnesses.length > 0) {
        // Prepare witness data for JSON (preserve existing URLs, exclude File objects)
        const witnessesData = newPlot.witnesses.map(w => {
          const documents = {};
          if (w.witnessDocuments) {
            Object.keys(w.witnessDocuments).forEach(docType => {
              const val = w.witnessDocuments[docType];
              if (typeof val === 'string') {
                documents[docType] = val; // Keep existing URL
              }
            });
          }
          return { ...w, witnessDocuments: documents };
        });
        formData.append('witnesses', JSON.stringify(witnessesData));

        // Append new witness documents (Files only)
        newPlot.witnesses.forEach((witness, idx) => {
          if (witness.witnessDocuments) {
            Object.keys(witness.witnessDocuments).forEach(docType => {
              const val = witness.witnessDocuments[docType];
              if (val instanceof File) {
                formData.append(`witnessDocuments[${idx}][${docType}]`, val);
              }
            });
          }
        });
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
      available: 'error',
      booked: 'default',
      sold: 'warning', // Turmeric yellow
      blocked: 'default',
      reserved: 'info'
    }
    return colors[status] || 'default'
  }

  const getStatusStyle = (status) => {
    if (status === 'sold') {
      return {
        backgroundColor: '#FFC107',
        color: '#000',
        fontWeight: 'bold'
      }
    }
    return {}
  }

  const getFacingLabel = (value) => FACING_OPTIONS.find((opt) => opt.value === value)?.label || value

  // Filter and paginate plots
  const filteredPlots = plots.filter((plot) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        plot.plotNo?.toLowerCase().includes(query) ||
        plot.colonyId?.name?.toLowerCase().includes(query) ||
        plot.customerName?.toLowerCase().includes(query) ||
        plot._id?.toLowerCase().includes(query)
      )
      if (!matchesSearch) return false
    }

    // Status filter
    if (filterStatus) {
      if (filterStatus === 'sold_registered') {
        return plot.status === 'sold' && plot.registryStatus === 'completed'
      } else if (filterStatus === 'sold_not_registered') {
        return plot.status === 'sold' && plot.registryStatus !== 'completed'
      } else if (filterStatus === 'booked') {
        return plot.status === 'booked'
      } else if (filterStatus === 'available') {
        return plot.status === 'available'
      }
    }

    return true
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

  // Show view form if viewing plot - Excel-like format
  if (viewDialogOpen && viewingPlot) {
    // Get holders based on owner type
    const holders = viewingPlot.ownerType === 'owner'
      ? (viewingPlot.plotOwners || []).map(owner => ({
        _id: owner.ownerId,
        name: owner.ownerName,
        mobile: owner.ownerPhone,
        phone: owner.ownerPhone,
        address: owner.ownerAddress,
        aadharNumber: owner.ownerAadharNumber,
        panNumber: owner.ownerPanNumber
      }))
      : getColonyKhatoniHolders(viewingPlot.colonyId)

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Plot Details - {viewingPlot.plotNo}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => {
              setViewDialogOpen(false)
              setViewingPlot(null)
            }}
          >
            Back to Plots
          </Button>
        </Box>

        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
            <Table stickyHeader size="small" sx={{ '& td, & th': { border: '1px solid #000' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', minWidth: 200, border: '1px solid #000' }}>Field</TableCell>
                  <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', minWidth: 300, border: '1px solid #000' }}>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Basic Information Section */}
                <TableRow>
                  <TableCell colSpan={2} sx={{ bgcolor: '#2196F3', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                    BASIC INFORMATION
                  </TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Plot Number</TableCell>
                  <TableCell>{viewingPlot.plotNo}</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Colony</TableCell>
                  <TableCell >{viewingPlot.colonyId?.name || 'N/A'}</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Property</TableCell>
                  <TableCell>{viewingPlot.propertyId?.name || 'N/A'}</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Status</TableCell>
                  <TableCell>
                    <Chip
                      label={viewingPlot.status.toUpperCase()}
                      color={getStatusColor(viewingPlot.status)}
                      size="small"
                      sx={getStatusStyle(viewingPlot.status)}
                    />
                  </TableCell>
                </TableRow>
                {/* Plot Images Display Section */}
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Plot Images</TableCell>
                  <TableCell>
                    {viewingPlot.plotImages && viewingPlot.plotImages.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {viewingPlot.plotImages.map((doc, index) => {
                          const baseURL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'
                          const fileUrl = doc.startsWith('http') ? doc : `${baseURL}${doc}`
                          const isPdf = doc.toLowerCase().endsWith('.pdf')

                          return (
                            <Box
                              key={index}
                              onClick={() => {
                                if (isPdf) {
                                  window.open(fileUrl, '_blank')
                                } else {
                                  setSelectedImage(fileUrl)
                                  setImageDialogOpen(true)
                                }
                              }}
                              sx={{
                                width: 50,
                                height: 50,
                                border: '1px solid #ddd',
                                borderRadius: 1,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#f5f5f5',
                                '&:hover': { opacity: 0.8 }
                              }}
                            >
                              {isPdf ? (
                                <PictureAsPdf color="error" />
                              ) : (
                                <img
                                  src={fileUrl}
                                  alt={`Plot Image ${index + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              )}
                            </Box>
                          )
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No images uploaded</Typography>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Plot Type</TableCell>
                  <TableCell>{viewingPlot.plotType || 'Residential'}</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Facing</TableCell>
                  <TableCell>{getFacingLabel(viewingPlot.facing)}</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Khatoni Holder / Owner</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ mb: 1 }}>
                        {viewingPlot.ownerType === 'khatoniHolder' ? 'Khatoni Holder' : 'Owner'}
                      </Typography>
                      {holders.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {holders.map((holder, index) => (
                            <Box key={holder?._id || holder?.id || index} sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {holder?.name || holder?.fullName || holder?.company || 'N/A'}
                              </Typography>
                              {(holder?.mobile || holder?.phone || holder?.contact) && (
                                <Typography variant="caption" color="text.secondary">
                                  📞 {holder?.mobile || holder?.phone || holder?.contact}
                                </Typography>
                              )}
                              {holder?.address && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  📍 {holder?.address}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No holders information available</Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>

                {/* Dimensions Section */}
                <TableRow>
                  <TableCell colSpan={2} sx={{ bgcolor: '#4CAF50', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                    DIMENSIONS
                  </TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#e8f5e9', fontWeight: 600 }}>Front Side</TableCell>
                  <TableCell>{viewingPlot.sideMeasurements?.front || viewingPlot.dimensions?.frontage || viewingPlot.dimensions?.length || 'N/A'} ft</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#e8f5e9', fontWeight: 600 }}>Back Side</TableCell>
                  <TableCell>{viewingPlot.sideMeasurements?.back || viewingPlot.dimensions?.length || 'N/A'} ft</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#e8f5e9', fontWeight: 600 }}>Left Side</TableCell>
                  <TableCell>{viewingPlot.sideMeasurements?.left || viewingPlot.dimensions?.width || 'N/A'} ft</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#e8f5e9', fontWeight: 600 }}>Right Side</TableCell>
                  <TableCell>{viewingPlot.sideMeasurements?.right || viewingPlot.dimensions?.width || 'N/A'} ft</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#e8f5e9', fontWeight: 600 }}>Total Area</TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight={700} color="success.main">
                      {Number(viewingPlot.areaGaj).toFixed(3)} Gaj ({gajToSqFt(viewingPlot.areaGaj).toFixed(3)} sq ft)
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Pricing Section */}
                <TableRow>
                  <TableCell colSpan={2} sx={{ bgcolor: '#FF9800', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                    PRICING
                  </TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Asking Price per Gaj</TableCell>
                  <TableCell>₹{Number(viewingPlot.pricePerGaj).toLocaleString()}</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Total Asking Price</TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight={700} color="error.main">
                      ₹{Number(viewingPlot.totalPrice).toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
                {viewingPlot.finalPrice && (
                  <>
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                      <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Final Price per Gaj</TableCell>
                      <TableCell>₹{Number(viewingPlot.finalPrice).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                      <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Total Final Price</TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={700} color="success.main">
                          ₹{Number(viewingPlot.finalPrice * viewingPlot.areaGaj).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </>
                )}
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Paid Amount</TableCell>
                  <TableCell>₹{Number(viewingPlot.paidAmount || 0).toLocaleString()}</TableCell>
                </TableRow>
                <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <TableCell sx={{ bgcolor: '#fff3e0', fontWeight: 600 }}>Remaining Payment</TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight={700} color="error.main">
                      ₹{Number((viewingPlot.finalPrice ? viewingPlot.finalPrice * viewingPlot.areaGaj : viewingPlot.totalPrice) - (viewingPlot.paidAmount || 0)).toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Sale/Booking Details */}
                {(viewingPlot.status === 'booked' || viewingPlot.status === 'sold') && (
                  <>
                    <TableRow>
                      <TableCell colSpan={2} sx={{ bgcolor: '#F44336', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                        {viewingPlot.status === 'booked' ? 'BOOKING DETAILS' : 'SALE DETAILS'}
                      </TableCell>
                    </TableRow>
                    {viewingPlot.customerName && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Customer Name</TableCell>
                        <TableCell>{viewingPlot.customerName}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.customerNumber && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Customer Number</TableCell>
                        <TableCell>{viewingPlot.customerNumber?.replace(/^\+91/, '')}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.customerShortAddress && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Customer Address</TableCell>
                        <TableCell>{viewingPlot.customerShortAddress}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.customerFullAddress && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Customer Full Address</TableCell>
                        <TableCell>{viewingPlot.customerFullAddress}</TableCell>
                      </TableRow>
                    )}
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                      <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>{viewingPlot.status === 'booked' ? 'Booked Date' : 'Sold Date'}</TableCell>
                      <TableCell>
                        {viewingPlot.createdAt ? new Date(viewingPlot.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </TableCell>
                    </TableRow>
                    {viewingPlot.registryDate && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Registry Date</TableCell>
                        <TableCell>{new Date(viewingPlot.registryDate).toLocaleDateString('en-IN')}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.registryDocument && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Registry Documents</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {(Array.isArray(viewingPlot.registryDocument) ? viewingPlot.registryDocument : [viewingPlot.registryDocument]).map((doc, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  cursor: 'pointer',
                                  border: '1px solid #ddd',
                                  borderRadius: 1,
                                  p: 0.5,
                                  '&:hover': { bgcolor: '#f0f0f0' }
                                }}
                                onClick={() => {
                                  const getFullUrl = (path) => path?.match(/^https?:\/\//) ? path : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${path}`
                                  const fullUrl = getFullUrl(doc)

                                  if (doc.toLowerCase().endsWith('.pdf')) {
                                    window.open(fullUrl, '_blank')
                                  } else {
                                    setSelectedImage(fullUrl)
                                    setImageDialogOpen(true)
                                  }
                                }}
                              >
                                {doc.toLowerCase().endsWith('.pdf') ? (
                                  <Box display="flex" flexDirection="column" alignItems="center">
                                    <PictureAsPdf color="error" fontSize="large" />
                                    <Typography variant="caption" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      Document {idx + 1}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Box display="flex" flexDirection="column" alignItems="center">
                                    <img
                                      src={doc.match(/^https?:\/\//) ? doc : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${doc}`}
                                      alt={`Registry ${idx + 1}`}
                                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                                    />
                                    <Typography variant="caption" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mt: 0.5 }}>
                                      {doc.split('/').pop()}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.moreInformation && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>More Information</TableCell>
                        <TableCell>{viewingPlot.moreInformation}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.agentName && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Agent Name</TableCell>
                        <TableCell>{viewingPlot.agentName}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.agentCode && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Agent Code</TableCell>
                        <TableCell>{viewingPlot.agentCode}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.agentPhone && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Agent Phone</TableCell>
                        <TableCell>{viewingPlot.agentPhone}</TableCell>
                      </TableRow>
                    )}
                    {(viewingPlot.agentName || viewingPlot.agentCode) && (
                      <>
                        <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                          <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Commission Percentage</TableCell>
                          <TableCell>
                            {viewingPlot.commissionPercentage != null && viewingPlot.commissionPercentage !== ''
                              ? `${viewingPlot.commissionPercentage}%`
                              : 'Not Set'}
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                          <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Commission Amount</TableCell>
                          <TableCell>
                            {viewingPlot.commissionAmount != null && viewingPlot.commissionAmount !== ''
                              ? `₹${Number(viewingPlot.commissionAmount).toLocaleString()}`
                              : 'Not Set'}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                    {viewingPlot.advocateName && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Advocate Name</TableCell>
                        <TableCell>{viewingPlot.advocateName}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.advocateCode && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Advocate Code</TableCell>
                        <TableCell>{viewingPlot.advocateCode}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.advocatePhone && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Advocate Phone</TableCell>
                        <TableCell>{viewingPlot.advocatePhone}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.status === 'sold' && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Registry Status</TableCell>
                        <TableCell>
                          <Chip
                            label={viewingPlot.registryStatus === 'completed' ? 'Registry Completed' : 'Registry Pending'}
                            color={viewingPlot.registryStatus === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.tahsil && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Tahsil</TableCell>
                        <TableCell>{viewingPlot.tahsil}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.modeOfPayment && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Mode of Payment</TableCell>
                        <TableCell>{viewingPlot.modeOfPayment}</TableCell>
                      </TableRow>
                    )}
                    {viewingPlot.transactionDate && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ bgcolor: '#ffebee', fontWeight: 600 }}>Transaction Date</TableCell>
                        <TableCell>{new Date(viewingPlot.transactionDate).toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Image Preview Dialog */}
        <Dialog
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          maxWidth="lg"
          sx={{ zIndex: '9999 !important' }}
        >
          <Box sx={{ position: 'relative', bgcolor: 'black', minWidth: 300, minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <IconButton
              onClick={() => setImageDialogOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
            >
              <Close />
            </IconButton>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
              />
            )}
          </Box>
        </Dialog>
      </Box >
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

                {/* Owner Selection - Show when 'owner' is selected */}
                {newPlot.ownerType === 'owner' && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Select Plot Owners
                    </Typography>
                    {availableOwners.length === 0 ? (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        No owners found. Please add owners in Settings first.
                      </Alert>
                    ) : (
                      <Box>
                        <FormGroup>
                          {availableOwners.map((owner) => (
                            <FormControlLabel
                              key={owner._id}
                              control={
                                <Checkbox
                                  checked={selectedOwnerIds.includes(owner._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedOwnerIds(prev => [...prev, owner._id])
                                    } else {
                                      setSelectedOwnerIds(prev => prev.filter(id => id !== owner._id))
                                    }
                                  }}
                                  size="small"
                                />
                              }
                              label={`${owner.name}${owner.phone ? ` (${owner.phone})` : ''}`}
                            />
                          ))}
                        </FormGroup>
                        {selectedOwnerIds.length > 0 && (
                          <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                            ✓ {selectedOwnerIds.length} owner(s) selected
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}

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

                {/* Adjacent Features */}
                <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Adjacent Features (Optional)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Front Side Adjacent"
                        value={newPlot.adjacentFront}
                        onChange={(e) => setNewPlot((s) => ({ ...s, adjacentFront: e.target.value }))}
                        placeholder="e.g., Road, Park, Plot #123"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Back Side Adjacent"
                        value={newPlot.adjacentBack}
                        onChange={(e) => setNewPlot((s) => ({ ...s, adjacentBack: e.target.value }))}
                        placeholder="e.g., Road, Park, Plot #123"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Left Side Adjacent"
                        value={newPlot.adjacentLeft}
                        onChange={(e) => setNewPlot((s) => ({ ...s, adjacentLeft: e.target.value }))}
                        placeholder="e.g., Road, Park, Plot #123"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Right Side Adjacent"
                        value={newPlot.adjacentRight}
                        onChange={(e) => setNewPlot((s) => ({ ...s, adjacentRight: e.target.value }))}
                        placeholder="e.g., Road, Park, Plot #123"
                      />
                    </Grid>
                  </Grid>
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
                      label="Total Price (Verified)"
                      type="text"
                      value={newPlot.totalPrice ? `₹${Number(newPlot.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
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
                    Upload Plot Photos (JPG, PNG, PDF)
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const files = Array.from(e.target.files)
                        const validFiles = []
                        files.forEach(file => {
                          if (file.size > 1024 * 1024) {
                            toast.error(`File ${file.name} is too large. Max size is 1MB.`)
                          } else {
                            validFiles.push(file)
                          }
                        })
                        if (validFiles.length > 0) {
                          setNewPlot((s) => ({ ...s, plotImages: [...(s.plotImages || []), ...validFiles] }))
                        }
                        e.target.value = '' // Reset input
                      }}
                    />
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Supported formats: JPG, PNG, PDF. Max size: 1MB per file.
                  </Typography>
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
                            const value = e.target.value.replace(/^\+91/, '').replace(/\D/g, '').slice(0, 10)
                            setNewPlot((s) => ({ ...s, customerNumber: value }))
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

                      {/* Manual Aadhar/PAN Entry Section */}
                      <Grid item xs={12} >


                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Customer Aadhar Number (Optional)"
                              value={newPlot.customerAadharNumber}
                              onChange={(e) => setNewPlot((s) => ({ ...s, customerAadharNumber: e.target.value }))}
                              placeholder="Enter 12-digit Aadhar number"
                              inputProps={{ maxLength: 12 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Customer PAN Number (Optional)"
                              value={newPlot.customerPanNumber}
                              onChange={(e) => setNewPlot((s) => ({ ...s, customerPanNumber: e.target.value.toUpperCase() }))}
                              placeholder="Enter 10-character PAN"
                              inputProps={{ maxLength: 10 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Date of Birth (Optional)"
                              type="date"
                              value={newPlot.customerDateOfBirth || ''}
                              onChange={(e) => setNewPlot((s) => ({ ...s, customerDateOfBirth: e.target.value }))}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Son of (Optional)"
                              value={newPlot.customerSonOf || ''}
                              onChange={(e) => setNewPlot((s) => ({ ...s, customerSonOf: e.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Daughter of (Optional)"
                              value={newPlot.customerDaughterOf || ''}
                              onChange={(e) => setNewPlot((s) => ({ ...s, customerDaughterOf: e.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Wife of (Optional)"
                              value={newPlot.customerWifeOf || ''}
                              onChange={(e) => setNewPlot((s) => ({ ...s, customerWifeOf: e.target.value }))}
                            />
                          </Grid>
                        </Grid>
                        {/* <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                            💡 You can manually enter Aadhar and PAN numbers here, and optionally upload document images below.
                          </Typography> */}

                      </Grid>

                      {/* Customer Documents Section */}
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #90caf9' }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: '#1976d2' }}>
                            Customer Documents (Optional)
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6} md={4}>
                              <Button variant="outlined" component="label" fullWidth size="small">
                                Aadhar Front
                                <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => {
                                  const file = e.target.files[0]
                                  if (file && file.size > 1024 * 1024) {
                                    toast.error('File size must be less than 1MB')
                                    e.target.value = ''
                                  } else {
                                    setNewPlot((s) => ({ ...s, customerAadharFront: file }))
                                  }
                                }} />
                              </Button>
                              {newPlot.customerAadharFront && <Typography variant="caption" display="block" color="success.main">✓ {newPlot.customerAadharFront.name}</Typography>}
                              <Typography variant="caption" display="block" color="text.secondary">Supported formats: JPG, PNG, PDF. Max size:1MB.</Typography>
                            </Grid>
                            <Grid item xs={6} md={4}>
                              <Button variant="outlined" component="label" fullWidth size="small">
                                Aadhar Back
                                <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => {
                                  const file = e.target.files[0]
                                  if (file && file.size > 1024 * 1024) {
                                    toast.error('File size must be less than 1MB')
                                    e.target.value = ''
                                  } else {
                                    setNewPlot((s) => ({ ...s, customerAadharBack: file }))
                                  }
                                }} />
                              </Button>
                              {newPlot.customerAadharBack && <Typography variant="caption" display="block" color="success.main">✓ {newPlot.customerAadharBack.name}</Typography>}
                              <Typography variant="caption" display="block" color="text.secondary">Supported formats: JPG, PNG, PDF. Max size:1MB.</Typography>
                            </Grid>
                            <Grid item xs={6} md={4}>
                              <Button variant="outlined" component="label" fullWidth size="small">
                                PAN Card
                                <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => {
                                  const file = e.target.files[0]
                                  if (file && file.size > 1024 * 1024) {
                                    toast.error('File size must be less than 1MB')
                                    e.target.value = ''
                                  } else {
                                    setNewPlot((s) => ({ ...s, customerPanCard: file }))
                                  }
                                }} />
                              </Button>
                              {newPlot.customerPanCard && <Typography variant="caption" display="block" color="success.main">✓ {newPlot.customerPanCard.name}</Typography>}
                              <Typography variant="caption" display="block" color="text.secondary">Supported formats: JPG, PNG, PDF. Max size:1MB.</Typography>
                            </Grid>
                            <Grid item xs={6} md={4}>
                              <Button variant="outlined" component="label" fullWidth size="small">
                                Passport Photo
                                <input type="file" hidden accept="image/*" onChange={(e) => {
                                  const file = e.target.files[0]
                                  if (file && file.size > 1024 * 1024) {
                                    toast.error('File size must be less than 1MB')
                                    e.target.value = ''
                                  } else {
                                    setNewPlot((s) => ({ ...s, customerPassportPhoto: file }))
                                  }
                                }} />
                              </Button>
                              {newPlot.customerPassportPhoto && <Typography variant="caption" display="block" color="success.main">✓ {newPlot.customerPassportPhoto.name}</Typography>}
                              <Typography variant="caption" display="block" color="text.secondary">Supported formats: JPG, PNG, PDF. Max size:1MB.</Typography>
                            </Grid>
                            <Grid item xs={6} md={4}>
                              <Button variant="outlined" component="label" fullWidth size="small">
                                Full Photo
                                <input type="file" hidden accept="image/*" onChange={(e) => {
                                  const file = e.target.files[0]
                                  if (file && file.size > 1024 * 1024) {
                                    toast.error('File size must be less than 1MB')
                                    e.target.value = ''
                                  } else {
                                    setNewPlot((s) => ({ ...s, customerFullPhoto: file }))
                                  }
                                }} />
                              </Button>
                              {newPlot.customerFullPhoto && <Typography variant="caption" display="block" color="success.main">✓ {newPlot.customerFullPhoto.name}</Typography>}
                              <Typography variant="caption" display="block" color="text.secondary">Supported formats: JPG, PNG, PDF. Max size:1MB.</Typography>
                            </Grid>
                          </Grid>

                        </Box>
                      </Grid>
                      {/* Witness Details Section - Wrapped in Grid Item for Add Form */}
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #90caf9', mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              Witness Details (Optional)
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Add />}
                              onClick={() => {
                                setNewPlot((s) => ({
                                  ...s,
                                  witnesses: [
                                    ...(s.witnesses || []),
                                    {
                                      witnessName: '',
                                      witnessPhone: '',
                                      witnessAadharNumber: '',
                                      witnessPanNumber: '',
                                      witnessDateOfBirth: '',
                                      witnessSonOf: '',
                                      witnessDaughterOf: '',
                                      witnessWifeOf: '',
                                      witnessAddress: '',
                                      witnessDocuments: {}
                                    }
                                  ]
                                }))
                              }}
                            >
                              Add Witness
                            </Button>
                          </Box>
                          {newPlot.witnesses && newPlot.witnesses.length > 0 ? (
                            newPlot.witnesses.map((witness, witnessIdx) => (
                              <Box key={witnessIdx} sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                  <Typography variant="subtitle2" fontWeight={600} color="primary">
                                    Witness {witnessIdx + 1}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setNewPlot((s) => ({
                                        ...s,
                                        witnesses: s.witnesses.filter((_, i) => i !== witnessIdx)
                                      }))
                                    }}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Box>
                                <Grid container spacing={2}>
                                  {/* Name and Phone */}
                                  <Grid item xs={12} sm={6}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Name *"
                                      value={witness.witnessName || ''}
                                      onChange={(e) => {
                                        const newWitnesses = [...(newPlot.witnesses || [])]
                                        newWitnesses[witnessIdx].witnessName = e.target.value
                                        setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={6}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Phone"
                                      value={witness.witnessPhone || ''}
                                      onChange={(e) => {
                                        const newWitnesses = [...(newPlot.witnesses || [])]
                                        newWitnesses[witnessIdx].witnessPhone = e.target.value
                                        setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                      }}
                                    />
                                  </Grid>
                                  {/* Aadhar, PAN, DOB */}
                                  <Grid item xs={12} sm={4}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Aadhar Number"
                                      value={witness.witnessAadharNumber || ''}
                                      onChange={(e) => {
                                        const newWitnesses = [...(newPlot.witnesses || [])]
                                        newWitnesses[witnessIdx].witnessAadharNumber = e.target.value
                                        setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={4}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="PAN Number"
                                      value={witness.witnessPanNumber || ''}
                                      onChange={(e) => {
                                        const newWitnesses = [...(newPlot.witnesses || [])]
                                        newWitnesses[witnessIdx].witnessPanNumber = e.target.value
                                        setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={4}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      type="date"
                                      label="Date of Birth"
                                      value={witness.witnessDateOfBirth || ''}
                                      onChange={(e) => {
                                        const newWitnesses = [...(newPlot.witnesses || [])]
                                        newWitnesses[witnessIdx].witnessDateOfBirth = e.target.value
                                        setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                      }}
                                      InputLabelProps={{ shrink: true }}
                                    />
                                  </Grid>
                                  {/* Son of, Daughter of, Wife of */}
                                  <Grid item xs={12} sm={4}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Son of"
                                      value={witness.witnessSonOf || ''}
                                      onChange={(e) => {
                                        const newWitnesses = [...(newPlot.witnesses || [])]
                                        newWitnesses[witnessIdx].witnessSonOf = e.target.value
                                        setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={4}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Daughter of"
                                      value={witness.witnessDaughterOf || ''}
                                      onChange={(e) => {
                                        const newWitnesses = [...(newPlot.witnesses || [])]
                                        newWitnesses[witnessIdx].witnessDaughterOf = e.target.value
                                        setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={4}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Wife of"
                                      value={witness.witnessWifeOf || ''}
                                      onChange={(e) => {
                                        const newWitnesses = [...(newPlot.witnesses || [])]
                                        newWitnesses[witnessIdx].witnessWifeOf = e.target.value
                                        setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                      }}
                                    />
                                  </Grid>
                                  {/* Address */}
                                  <Grid item xs={12}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Address"
                                      multiline
                                      rows={2}
                                      value={witness.witnessAddress || ''}
                                      onChange={(e) => {
                                        const newWitnesses = [...(newPlot.witnesses || [])]
                                        newWitnesses[witnessIdx].witnessAddress = e.target.value
                                        setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                      }}
                                    />
                                  </Grid>
                                  {/* Documents - Aadhar Front */}
                                  <Grid item xs={12}>
                                    <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1 }}>
                                      Witness Documents
                                    </Typography>
                                    <Grid container spacing={1}>
                                      <Grid item xs={6} sm={4}>
                                        <Button
                                          variant="outlined"
                                          component="label"
                                          fullWidth
                                          size="small"
                                          startIcon={<CloudUpload />}
                                        >
                                          Aadhar Front
                                          <input
                                            type="file"
                                            hidden
                                            accept="image/*,.pdf"
                                            onChange={(e) => {
                                              const file = e.target.files[0]
                                              if (file) {
                                                if (file.size > 1024 * 1024) {
                                                  toast.error('File too large. Max 1MB.')
                                                } else {
                                                  const newWitnesses = [...(newPlot.witnesses || [])]
                                                  if (!newWitnesses[witnessIdx].witnessDocuments) {
                                                    newWitnesses[witnessIdx].witnessDocuments = {}
                                                  }
                                                  newWitnesses[witnessIdx].witnessDocuments.aadharFront = file
                                                  setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                                }
                                              }
                                            }}
                                          />
                                        </Button>
                                        {witness.witnessDocuments?.aadharFront && (
                                          <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                              ✓ {typeof witness.witnessDocuments.aadharFront === 'string' ? 'Uploaded' : witness.witnessDocuments.aadharFront.name}
                                            </Typography>
                                            <Box
                                              component="img"
                                              src={(() => {
                                                try {
                                                  const file = witness.witnessDocuments.aadharFront;
                                                  if (typeof file === 'string') return file;
                                                  if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
                                                  if (file?.url) return file.url;
                                                  return '';
                                                } catch (e) { return ''; }
                                              })()}
                                              alt="Aadhar Front"
                                              sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
                                            />
                                          </Box>
                                        )}
                                      </Grid>
                                      {/* Aadhar Back */}
                                      <Grid item xs={6} sm={4}>
                                        <Button
                                          variant="outlined"
                                          component="label"
                                          fullWidth
                                          size="small"
                                          startIcon={<CloudUpload />}
                                        >
                                          Aadhar Back
                                          <input
                                            type="file"
                                            hidden
                                            accept="image/*,.pdf"
                                            onChange={(e) => {
                                              const file = e.target.files[0]
                                              if (file) {
                                                if (file.size > 1024 * 1024) {
                                                  toast.error('File too large. Max 1MB.')
                                                } else {
                                                  const newWitnesses = [...(newPlot.witnesses || [])]
                                                  if (!newWitnesses[witnessIdx].witnessDocuments) {
                                                    newWitnesses[witnessIdx].witnessDocuments = {}
                                                  }
                                                  newWitnesses[witnessIdx].witnessDocuments.aadharBack = file
                                                  setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                                }
                                              }
                                            }}
                                          />
                                        </Button>
                                        {witness.witnessDocuments?.aadharBack && (
                                          <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                              ✓ {typeof witness.witnessDocuments.aadharBack === 'string' ? 'Uploaded' : witness.witnessDocuments.aadharBack.name}
                                            </Typography>
                                            <Box
                                              component="img"
                                              src={(() => {
                                                try {
                                                  const file = witness.witnessDocuments.aadharBack;
                                                  if (typeof file === 'string') return file;
                                                  if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
                                                  if (file?.url) return file.url;
                                                  return '';
                                                } catch (e) { return ''; }
                                              })()}
                                              alt="Aadhar Back"
                                              sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
                                            />
                                          </Box>
                                        )}
                                      </Grid>
                                      {/* PAN Card */}
                                      <Grid item xs={6} sm={4}>
                                        <Button
                                          variant="outlined"
                                          component="label"
                                          fullWidth
                                          size="small"
                                          startIcon={<CloudUpload />}
                                        >
                                          PAN Card
                                          <input
                                            type="file"
                                            hidden
                                            accept="image/*,.pdf"
                                            onChange={(e) => {
                                              const file = e.target.files[0]
                                              if (file) {
                                                if (file.size > 1024 * 1024) {
                                                  toast.error('File too large. Max 1MB.')
                                                } else {
                                                  const newWitnesses = [...(newPlot.witnesses || [])]
                                                  if (!newWitnesses[witnessIdx].witnessDocuments) {
                                                    newWitnesses[witnessIdx].witnessDocuments = {}
                                                  }
                                                  newWitnesses[witnessIdx].witnessDocuments.panCard = file
                                                  setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                                }
                                              }
                                            }}
                                          />
                                        </Button>
                                        {witness.witnessDocuments?.panCard && (
                                          <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                              ✓ {typeof witness.witnessDocuments.panCard === 'string' ? 'Uploaded' : witness.witnessDocuments.panCard.name}
                                            </Typography>
                                            <Box
                                              component="img"
                                              src={(() => {
                                                try {
                                                  const file = witness.witnessDocuments.panCard;
                                                  if (typeof file === 'string') return file;
                                                  if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
                                                  if (file?.url) return file.url;
                                                  return '';
                                                } catch (e) { return ''; }
                                              })()}
                                              alt="PAN Card"
                                              sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
                                            />
                                          </Box>
                                        )}
                                      </Grid>
                                      {/* Passport Photo */}
                                      <Grid item xs={6} sm={4}>
                                        <Button
                                          variant="outlined"
                                          component="label"
                                          fullWidth
                                          size="small"
                                          startIcon={<CloudUpload />}
                                        >
                                          Passport Photo
                                          <input
                                            type="file"
                                            hidden
                                            accept="image/*,.pdf"
                                            onChange={(e) => {
                                              const file = e.target.files[0]
                                              if (file) {
                                                if (file.size > 1024 * 1024) {
                                                  toast.error('File too large. Max 1MB.')
                                                } else {
                                                  const newWitnesses = [...(newPlot.witnesses || [])]
                                                  if (!newWitnesses[witnessIdx].witnessDocuments) {
                                                    newWitnesses[witnessIdx].witnessDocuments = {}
                                                  }
                                                  newWitnesses[witnessIdx].witnessDocuments.passportPhoto = file
                                                  setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                                }
                                              }
                                            }}
                                          />
                                        </Button>
                                        {witness.witnessDocuments?.passportPhoto && (
                                          <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                              ✓ {typeof witness.witnessDocuments.passportPhoto === 'string' ? 'Uploaded' : witness.witnessDocuments.passportPhoto.name}
                                            </Typography>
                                            <Box
                                              component="img"
                                              src={(() => {
                                                try {
                                                  const file = witness.witnessDocuments.passportPhoto;
                                                  if (typeof file === 'string') return file;
                                                  if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
                                                  if (file?.url) return file.url;
                                                  return '';
                                                } catch (e) { return ''; }
                                              })()}
                                              alt="Passport Photo"
                                              sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
                                            />
                                          </Box>
                                        )}
                                      </Grid>
                                      {/* Full Photo */}
                                      <Grid item xs={6} sm={4}>
                                        <Button
                                          variant="outlined"
                                          component="label"
                                          fullWidth
                                          size="small"
                                          startIcon={<CloudUpload />}
                                        >
                                          Full Photo
                                          <input
                                            type="file"
                                            hidden
                                            accept="image/*,.pdf"
                                            onChange={(e) => {
                                              const file = e.target.files[0]
                                              if (file) {
                                                if (file.size > 1024 * 1024) {
                                                  toast.error('File too large. Max 1MB.')
                                                } else {
                                                  const newWitnesses = [...(newPlot.witnesses || [])]
                                                  if (!newWitnesses[witnessIdx].witnessDocuments) {
                                                    newWitnesses[witnessIdx].witnessDocuments = {}
                                                  }
                                                  newWitnesses[witnessIdx].witnessDocuments.fullPhoto = file
                                                  setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                                }
                                              }
                                            }}
                                          />
                                        </Button>
                                        {witness.witnessDocuments?.fullPhoto && (
                                          <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                              ✓ {typeof witness.witnessDocuments.fullPhoto === 'string' ? 'Uploaded' : witness.witnessDocuments.fullPhoto.name}
                                            </Typography>
                                            <Box
                                              component="img"
                                              src={(() => {
                                                try {
                                                  const file = witness.witnessDocuments.fullPhoto;
                                                  if (typeof file === 'string') return file;
                                                  if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
                                                  if (file?.url) return file.url;
                                                  return '';
                                                } catch (e) { return ''; }
                                              })()}
                                              alt="Full Photo"
                                              sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
                                            />
                                          </Box>
                                        )}
                                      </Grid>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              </Box>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary" align="center">
                              No witnesses added. Click "Add Witness" to add witness details.
                            </Typography>
                          )}
                        </Box>
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
                      <Grid item xs={12}>
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
                          <TextField
                            size="small"
                            label="Agent Phone (Optional)"
                            value={newPlot.agentPhone}
                            onChange={(e) => setNewPlot({ ...newPlot, agentPhone: e.target.value })}
                            placeholder="Enter agent phone number"
                            sx={{ flex: 1 }}
                          />
                        </Box>
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
                      <Grid item xs={12}>
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
                          <TextField
                            size="small"
                            label="Advocate Phone (Optional)"
                            value={newPlot.advocatePhone}
                            onChange={(e) => setNewPlot({ ...newPlot, advocatePhone: e.target.value })}
                            placeholder="Enter advocate phone number"
                            sx={{ flex: 1 }}
                          />
                        </Box>
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

                        <>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                              <FormControl component="fieldset">
                                <FormLabel component="legend">Registry Status</FormLabel>
                                <RadioGroup
                                  row
                                  value={newPlot.registryStatus}
                                  onChange={(e) => setNewPlot((s) => ({ ...s, registryStatus: e.target.value }))}
                                >
                                  <FormControlLabel value="pending" control={<Radio />} label="Registry Pending" />
                                  <FormControlLabel value="completed" control={<Radio />} label="Registry Completed" />
                                </RadioGroup>
                              </FormControl>

                              <TextField
                                size="small"
                                label="Registry Date"
                                type="date"
                                value={newPlot.registryDate || ''}
                                onChange={(e) => setNewPlot((s) => ({ ...s, registryDate: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 200 }}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ p: 2, border: '1px dashed #bdbdbd', borderRadius: 1 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Registry Documents (Max 1MB per file, Images/PDFs)
                              </Typography>
                              <Button
                                variant="outlined"
                                component="label"
                                startIcon={<CloudUpload />}
                                size="small"
                                sx={{ mb: 2 }}
                              >
                                Upload Documents
                                <input
                                  type="file"
                                  hidden
                                  multiple
                                  accept="image/*,.pdf"
                                  onChange={handleRegistryFileSelect}
                                />
                              </Button>

                              {/* Selected Files List */}
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {newPlot.registryDocuments && newPlot.registryDocuments.map((file, index) => (
                                  <Chip
                                    key={index}
                                    label={file.name}
                                    icon={file.type && file.type.includes('pdf') ? <PictureAsPdf /> : <ImageIcon />}
                                    onDelete={() => removeRegistryFile(index)}
                                    color="primary"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Box sx={{ p: 2, border: '1px dashed #bdbdbd', borderRadius: 1, height: '100%' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Registry PDF (Max 1 file)
                              </Typography>
                              <Button
                                variant="outlined"
                                component="label"
                                startIcon={<PictureAsPdf />}
                                size="small"
                                sx={{ mb: 2 }}
                              >
                                Upload PDF
                                <input
                                  type="file"
                                  hidden
                                  accept=".pdf"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      if (file.size > 1024 * 1024) {
                                        toast.error('File too large. Max 1MB.');
                                      } else {
                                        setNewPlot(s => ({ ...s, registryPdf: file }));
                                      }
                                    }
                                  }}
                                />
                              </Button>
                              {newPlot.registryPdf && (
                                <Chip
                                  label={newPlot.registryPdf.name || 'Existing PDF'}
                                  icon={<PictureAsPdf />}
                                  onDelete={() => setNewPlot(s => ({ ...s, registryPdf: null }))}
                                  color="primary"
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          </Grid>
                        </>

                      )}
                    </Grid>
                  </Box >
                )}
              </Box >

              {/* Action Buttons */}
              < Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button onClick={closeAddDialog} variant="outlined">Cancel</Button>
                <Button variant="contained" onClick={handleAddPlot}>Add Plot</Button>
              </Box >
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

                {/* Owner Selection - Show when 'owner' is selected */}
                {newPlot.ownerType === 'owner' && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Select Plot Owners
                    </Typography>
                    {availableOwners.length === 0 ? (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        No owners found. Please add owners in Settings first.
                      </Alert>
                    ) : (
                      <Box>
                        <FormGroup>
                          {availableOwners.map((owner) => (
                            <FormControlLabel
                              key={owner._id}
                              control={
                                <Checkbox
                                  checked={selectedOwnerIds.includes(owner._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedOwnerIds(prev => [...prev, owner._id])
                                    } else {
                                      setSelectedOwnerIds(prev => prev.filter(id => id !== owner._id))
                                    }
                                  }}
                                  size="small"
                                />
                              }
                              label={`${owner.name}${owner.phone ? ` (${owner.phone})` : ''}`}
                            />
                          ))}
                        </FormGroup>
                        {selectedOwnerIds.length > 0 && (
                          <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                            ✓ {selectedOwnerIds.length} owner(s) selected
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}

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

                {/* Adjacent Features */}
                <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Adjacent Features (Optional)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Front Side Adjacent"
                        value={newPlot.adjacentFront}
                        onChange={(e) => setNewPlot((s) => ({ ...s, adjacentFront: e.target.value }))}
                        placeholder="e.g., Road, Park, Plot #123"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Back Side Adjacent"
                        value={newPlot.adjacentBack}
                        onChange={(e) => setNewPlot((s) => ({ ...s, adjacentBack: e.target.value }))}
                        placeholder="e.g., Road, Park, Plot #123"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Left Side Adjacent"
                        value={newPlot.adjacentLeft}
                        onChange={(e) => setNewPlot((s) => ({ ...s, adjacentLeft: e.target.value }))}
                        placeholder="e.g., Road, Park, Plot #123"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Right Side Adjacent"
                        value={newPlot.adjacentRight}
                        onChange={(e) => setNewPlot((s) => ({ ...s, adjacentRight: e.target.value }))}
                        placeholder="e.g., Road, Park, Plot #123"
                      />
                    </Grid>
                  </Grid>
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
                  label="Total Price (Verified)"
                  type="text"
                  value={newPlot.totalPrice ? `₹${Number(newPlot.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
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
                    Upload Plot Photos (JPG, PNG, PDF)
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const files = Array.from(e.target.files)
                        const validFiles = []
                        files.forEach(file => {
                          if (file.size > 1024 * 1024) {
                            toast.error(`File ${file.name} is too large. Max size is 1MB.`)
                          } else {
                            validFiles.push(file)
                          }
                        })
                        if (validFiles.length > 0) {
                          setNewPlot((s) => ({ ...s, plotImages: [...(s.plotImages || []), ...validFiles] }))
                        }
                        e.target.value = '' // Reset input
                      }}
                    />
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Supported formats: JPG, PNG, PDF. Max size: 1MB per file.
                  </Typography>
                  {newPlot.plotImages && newPlot.plotImages.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                        ✓ {newPlot.plotImages.length} image(s) selected
                      </Typography>
                      {/* Image Previews Grid */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        {newPlot.plotImages.filter(file => file).map((file, idx) => (
                          <Box key={idx} sx={{ position: 'relative' }}>
                            <Box
                              component="img"
                              src={(() => {
                                try {
                                  if (typeof file === 'string') return file;
                                  if (file.url && file.isExisting) return file.url;
                                  if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
                                  return '';
                                } catch (e) {
                                  console.error('Error creating object URL:', e);
                                  return '';
                                }
                              })()}
                              alt={`Plot Image ${idx + 1}`}
                              sx={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '1px solid #ddd'
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => {
                                setNewPlot((s) => ({
                                  ...s,
                                  plotImages: s.plotImages.filter((_, i) => i !== idx)
                                }))
                              }}
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                bgcolor: 'error.main',
                                color: 'white',
                                width: 20,
                                height: 20,
                                '&:hover': { bgcolor: 'error.dark' }
                              }}
                            >
                              <Close sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                      {/* File Names */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                        onChange={(e) => {
                          const value = e.target.value.replace(/^\+91/, '').replace(/\D/g, '').slice(0, 10)
                          setNewPlot((s) => ({ ...s, customerNumber: value }))
                        }}
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

                      {/* Manual Aadhar/PAN Entry Section */}
                      {/* <Box sx={{ p: 2, bgcolor: '#fff9e6', borderRadius: 1, border: '1px solid #ffd54f' }}> */}

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Customer Aadhar Number (Optional)"
                            value={newPlot.customerAadharNumber}
                            onChange={(e) => setNewPlot((s) => ({ ...s, customerAadharNumber: e.target.value }))}
                            placeholder="Enter 12-digit Aadhar number"
                            inputProps={{ maxLength: 12 }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Customer PAN Number (Optional)"
                            value={newPlot.customerPanNumber}
                            onChange={(e) => setNewPlot((s) => ({ ...s, customerPanNumber: e.target.value.toUpperCase() }))}
                            placeholder="Enter 10-character PAN"
                            inputProps={{ maxLength: 10 }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Date of Birth (Optional)"
                            type="date"
                            value={newPlot.customerDateOfBirth || ''}
                            onChange={(e) => setNewPlot((s) => ({ ...s, customerDateOfBirth: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Son of (Optional)"
                            value={newPlot.customerSonOf || ''}
                            onChange={(e) => setNewPlot((s) => ({ ...s, customerSonOf: e.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Daughter of (Optional)"
                            value={newPlot.customerDaughterOf || ''}
                            onChange={(e) => setNewPlot((s) => ({ ...s, customerDaughterOf: e.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Wife of (Optional)"
                            value={newPlot.customerWifeOf || ''}
                            onChange={(e) => setNewPlot((s) => ({ ...s, customerWifeOf: e.target.value }))}
                          />
                        </Grid>
                      </Grid>
                      {/* <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                          💡 You can manually enter Aadhar and PAN numbers here, and optionally upload document images below.
                        </Typography>
                      </Box> */}

                      {/* Customer Documents Upload */}
                      <Box sx={{ p: 2, bgcolor: '#f0f4ff', borderRadius: 1, border: '1px solid #c5cae9' }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: '#3f51b5' }}>
                          Customer Documents (Optional)
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Button
                              variant="outlined"
                              component="label"
                              fullWidth
                              size="small"
                              startIcon={<CloudUpload />}
                            >
                              Aadhar Front
                              <input
                                type="file"
                                hidden
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files[0]
                                  if (file && file.size > 1024 * 1024) {
                                    toast.error('File size must be less than 1MB')
                                  } else {
                                    setNewPlot((s) => ({ ...s, customerAadharFront: file }))
                                  }
                                }}
                              />
                            </Button>
                            {newPlot.customerAadharFront && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                  ✓ {typeof newPlot.customerAadharFront === 'string' ? 'Uploaded' : newPlot.customerAadharFront.name}
                                </Typography>
                                <Box
                                  component="img"
                                  src={(() => {
                                    try {
                                      const file = newPlot.customerAadharFront;
                                      if (typeof file === 'string') return file;
                                      if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
                                      if (file?.url) return file.url;
                                      return '';
                                    } catch (e) { return ''; }
                                  })()}
                                  alt="Aadhar Front Preview"
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: '1px solid #ddd'
                                  }}
                                />
                              </Box>
                            )}
                          </Grid>
                          <Grid item xs={6}>
                            <Button
                              variant="outlined"
                              component="label"
                              fullWidth
                              size="small"
                              startIcon={<CloudUpload />}
                            >
                              Aadhar Back
                              <input
                                type="file"
                                hidden
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files[0]
                                  if (file && file.size > 1024 * 1024) {
                                    toast.error('File size must be less than 1MB')
                                  } else {
                                    setNewPlot((s) => ({ ...s, customerAadharBack: file }))
                                  }
                                }}
                              />
                            </Button>
                            {newPlot.customerAadharBack && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                  ✓ {typeof newPlot.customerAadharBack === 'string' ? 'Uploaded' : newPlot.customerAadharBack.name}
                                </Typography>
                                <Box
                                  component="img"
                                  src={(() => {
                                    try {
                                      const file = newPlot.customerAadharBack;
                                      if (typeof file === 'string') return file;
                                      if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
                                      if (file?.url) return file.url;
                                      return '';
                                    } catch (e) { return ''; }
                                  })()}
                                  alt="Aadhar Back Preview"
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: '1px solid #ddd'
                                  }}
                                />
                              </Box>
                            )}
                          </Grid>
                          <Grid item xs={6}>
                            <Button
                              variant="outlined"
                              component="label"
                              fullWidth
                              size="small"
                              startIcon={<CloudUpload />}
                            >
                              PAN Card
                              <input
                                type="file"
                                hidden
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files[0]
                                  if (file && file.size > 1024 * 1024) {
                                    toast.error('File size must be less than 1MB')
                                  } else {
                                    setNewPlot((s) => ({ ...s, customerPanCard: file }))
                                  }
                                }}
                              />
                            </Button>
                            {newPlot.customerPanCard && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                  ✓ {typeof newPlot.customerPanCard === 'string' ? 'Uploaded' : newPlot.customerPanCard.name}
                                </Typography>
                                <Box
                                  component="img"
                                  src={(() => {
                                    try {
                                      const file = newPlot.customerPanCard;
                                      if (typeof file === 'string') return file;
                                      if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
                                      if (file?.url) return file.url;
                                      return '';
                                    } catch (e) { return ''; }
                                  })()}
                                  alt="PAN Card Preview"
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: '1px solid #ddd'
                                  }}
                                />
                              </Box>
                            )}
                          </Grid>
                          <Grid item xs={6}>
                            <Button
                              variant="outlined"
                              component="label"
                              fullWidth
                              size="small"
                              startIcon={<CloudUpload />}
                            >
                              Passport Photo
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0]
                                  if (file && file.size > 1024 * 1024) {
                                    toast.error('File size must be less than 1MB')
                                  } else {
                                    setNewPlot((s) => ({ ...s, customerPassportPhoto: file }))
                                  }
                                }}
                              />
                            </Button>
                            {newPlot.customerPassportPhoto && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                  ✓ {typeof newPlot.customerPassportPhoto === 'string' ? 'Uploaded' : newPlot.customerPassportPhoto.name}
                                </Typography>
                                <Box
                                  component="img"
                                  src={(() => {
                                    try {
                                      const file = newPlot.customerPassportPhoto;
                                      if (typeof file === 'string') return file;
                                      if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
                                      if (file?.url) return file.url;
                                      return '';
                                    } catch (e) { return ''; }
                                  })()}
                                  alt="Passport Photo Preview"
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: '1px solid #ddd'
                                  }}
                                />
                              </Box>
                            )}
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              variant="outlined"
                              component="label"
                              fullWidth
                              size="small"
                              startIcon={<CloudUpload />}
                            >
                              Full Photo
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0]
                                  if (file && file.size > 1024 * 1024) {
                                    toast.error('File size must be less than 1MB')
                                  } else {
                                    setNewPlot((s) => ({ ...s, customerFullPhoto: file }))
                                  }
                                }}
                              />
                            </Button>
                            {newPlot.customerFullPhoto && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                  ✓ {typeof newPlot.customerFullPhoto === 'string' ? 'Uploaded' : newPlot.customerFullPhoto.name}
                                </Typography>
                                <Box
                                  component="img"
                                  src={(() => {
                                    try {
                                      const file = newPlot.customerFullPhoto;
                                      if (typeof file === 'string') return file;
                                      if (file instanceof File || file instanceof Blob) return URL.createObjectURL(file);
                                      if (file?.url) return file.url;
                                      return '';
                                    } catch (e) { return ''; }
                                  })()}
                                  alt="Full Photo Preview"
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: '1px solid #ddd'
                                  }}
                                />
                              </Box>
                            )}
                          </Grid>
                        </Grid>
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                          Supported formats: JPG, PNG, PDF. Max size: 1MB per file.
                        </Typography>
                      </Box>
                      {/* Witness Details Section */}
                      <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #90caf9', mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Witness Details (Optional)
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => {
                              setNewPlot((s) => ({
                                ...s,
                                witnesses: [
                                  ...(s.witnesses || []),
                                  {
                                    witnessName: '',
                                    witnessPhone: '',
                                    witnessAadharNumber: '',
                                    witnessPanNumber: '',
                                    witnessDateOfBirth: '',
                                    witnessSonOf: '',
                                    witnessDaughterOf: '',
                                    witnessWifeOf: '',
                                    witnessAddress: '',
                                    witnessDocuments: {}
                                  }
                                ]
                              }))
                            }}
                          >
                            Add Witness
                          </Button>
                        </Box>
                        {newPlot.witnesses && newPlot.witnesses.length > 0 ? (
                          newPlot.witnesses.map((witness, witnessIdx) => (
                            <Box key={witnessIdx} sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600} color="primary">
                                  Witness {witnessIdx + 1}
                                </Typography>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setNewPlot((s) => ({
                                      ...s,
                                      witnesses: s.witnesses.filter((_, i) => i !== witnessIdx)
                                    }))
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                              <Grid container spacing={2}>
                                {/* Name and Phone */}
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Name *"
                                    value={witness.witnessName || ''}
                                    onChange={(e) => {
                                      const newWitnesses = [...(newPlot.witnesses || [])]
                                      newWitnesses[witnessIdx].witnessName = e.target.value
                                      setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Phone"
                                    value={witness.witnessPhone || ''}
                                    onChange={(e) => {
                                      const newWitnesses = [...(newPlot.witnesses || [])]
                                      newWitnesses[witnessIdx].witnessPhone = e.target.value
                                      setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                    }}
                                  />
                                </Grid>
                                {/* Aadhar, PAN, DOB */}
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Aadhar Number"
                                    value={witness.witnessAadharNumber || ''}
                                    onChange={(e) => {
                                      const newWitnesses = [...(newPlot.witnesses || [])]
                                      newWitnesses[witnessIdx].witnessAadharNumber = e.target.value
                                      setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="PAN Number"
                                    value={witness.witnessPanNumber || ''}
                                    onChange={(e) => {
                                      const newWitnesses = [...(newPlot.witnesses || [])]
                                      newWitnesses[witnessIdx].witnessPanNumber = e.target.value
                                      setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    label="Date of Birth"
                                    value={witness.witnessDateOfBirth || ''}
                                    onChange={(e) => {
                                      const newWitnesses = [...(newPlot.witnesses || [])]
                                      newWitnesses[witnessIdx].witnessDateOfBirth = e.target.value
                                      setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                  />
                                </Grid>
                                {/* Son of, Daughter of, Wife of */}
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Son of"
                                    value={witness.witnessSonOf || ''}
                                    onChange={(e) => {
                                      const newWitnesses = [...(newPlot.witnesses || [])]
                                      newWitnesses[witnessIdx].witnessSonOf = e.target.value
                                      setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Daughter of"
                                    value={witness.witnessDaughterOf || ''}
                                    onChange={(e) => {
                                      const newWitnesses = [...(newPlot.witnesses || [])]
                                      newWitnesses[witnessIdx].witnessDaughterOf = e.target.value
                                      setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Wife of"
                                    value={witness.witnessWifeOf || ''}
                                    onChange={(e) => {
                                      const newWitnesses = [...(newPlot.witnesses || [])]
                                      newWitnesses[witnessIdx].witnessWifeOf = e.target.value
                                      setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                    }}
                                  />
                                </Grid>
                                {/* Address */}
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Address"
                                    multiline
                                    rows={2}
                                    value={witness.witnessAddress || ''}
                                    onChange={(e) => {
                                      const newWitnesses = [...(newPlot.witnesses || [])]
                                      newWitnesses[witnessIdx].witnessAddress = e.target.value
                                      setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                    }}
                                  />
                                </Grid>
                                {/* Documents - Aadhar Front */}
                                <Grid item xs={12}>
                                  <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1 }}>
                                    Witness Documents
                                  </Typography>
                                  <Grid container spacing={1}>
                                    <Grid item xs={6} sm={4}>
                                      <Button
                                        variant="outlined"
                                        component="label"
                                        fullWidth
                                        size="small"
                                        startIcon={<CloudUpload />}
                                      >
                                        Aadhar Front
                                        <input
                                          type="file"
                                          hidden
                                          accept="image/*,.pdf"
                                          onChange={(e) => {
                                            const file = e.target.files[0]
                                            if (file) {
                                              if (file.size > 1024 * 1024) {
                                                toast.error('File too large. Max 1MB.')
                                              } else {
                                                const newWitnesses = [...(newPlot.witnesses || [])]
                                                if (!newWitnesses[witnessIdx].witnessDocuments) {
                                                  newWitnesses[witnessIdx].witnessDocuments = {}
                                                }
                                                newWitnesses[witnessIdx].witnessDocuments.aadharFront = file
                                                setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                              }
                                            }
                                          }}
                                        />
                                      </Button>
                                      {witness.witnessDocuments?.aadharFront && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                            ✓ {typeof witness.witnessDocuments.aadharFront === 'string' ? 'Uploaded' : witness.witnessDocuments.aadharFront.name}
                                          </Typography>
                                          <Box
                                            component="img"
                                            src={typeof witness.witnessDocuments.aadharFront === 'string' ? witness.witnessDocuments.aadharFront : URL.createObjectURL(witness.witnessDocuments.aadharFront)}
                                            alt="Aadhar Front"
                                            sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
                                          />
                                        </Box>
                                      )}
                                    </Grid>
                                    {/* Aadhar Back */}
                                    <Grid item xs={6} sm={4}>
                                      <Button
                                        variant="outlined"
                                        component="label"
                                        fullWidth
                                        size="small"
                                        startIcon={<CloudUpload />}
                                      >
                                        Aadhar Back
                                        <input
                                          type="file"
                                          hidden
                                          accept="image/*,.pdf"
                                          onChange={(e) => {
                                            const file = e.target.files[0]
                                            if (file) {
                                              if (file.size > 1024 * 1024) {
                                                toast.error('File too large. Max 1MB.')
                                              } else {
                                                const newWitnesses = [...(newPlot.witnesses || [])]
                                                if (!newWitnesses[witnessIdx].witnessDocuments) {
                                                  newWitnesses[witnessIdx].witnessDocuments = {}
                                                }
                                                newWitnesses[witnessIdx].witnessDocuments.aadharBack = file
                                                setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                              }
                                            }
                                          }}
                                        />
                                      </Button>
                                      {witness.witnessDocuments?.aadharBack && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                            ✓ {typeof witness.witnessDocuments.aadharBack === 'string' ? 'Uploaded' : witness.witnessDocuments.aadharBack.name}
                                          </Typography>
                                          <Box
                                            component="img"
                                            src={typeof witness.witnessDocuments.aadharBack === 'string' ? witness.witnessDocuments.aadharBack : URL.createObjectURL(witness.witnessDocuments.aadharBack)}
                                            alt="Aadhar Back"
                                            sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
                                          />
                                        </Box>
                                      )}
                                    </Grid>
                                    {/* PAN Card */}
                                    <Grid item xs={6} sm={4}>
                                      <Button
                                        variant="outlined"
                                        component="label"
                                        fullWidth
                                        size="small"
                                        startIcon={<CloudUpload />}
                                      >
                                        PAN Card
                                        <input
                                          type="file"
                                          hidden
                                          accept="image/*,.pdf"
                                          onChange={(e) => {
                                            const file = e.target.files[0]
                                            if (file) {
                                              if (file.size > 1024 * 1024) {
                                                toast.error('File too large. Max 1MB.')
                                              } else {
                                                const newWitnesses = [...(newPlot.witnesses || [])]
                                                if (!newWitnesses[witnessIdx].witnessDocuments) {
                                                  newWitnesses[witnessIdx].witnessDocuments = {}
                                                }
                                                newWitnesses[witnessIdx].witnessDocuments.panCard = file
                                                setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                              }
                                            }
                                          }}
                                        />
                                      </Button>
                                      {witness.witnessDocuments?.panCard && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                            ✓ {typeof witness.witnessDocuments.panCard === 'string' ? 'Uploaded' : witness.witnessDocuments.panCard.name}
                                          </Typography>
                                          <Box
                                            component="img"
                                            src={typeof witness.witnessDocuments.panCard === 'string' ? witness.witnessDocuments.panCard : URL.createObjectURL(witness.witnessDocuments.panCard)}
                                            alt="PAN Card"
                                            sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
                                          />
                                        </Box>
                                      )}
                                    </Grid>
                                    {/* Passport Photo */}
                                    <Grid item xs={6} sm={4}>
                                      <Button
                                        variant="outlined"
                                        component="label"
                                        fullWidth
                                        size="small"
                                        startIcon={<CloudUpload />}
                                      >
                                        Passport Photo
                                        <input
                                          type="file"
                                          hidden
                                          accept="image/*,.pdf"
                                          onChange={(e) => {
                                            const file = e.target.files[0]
                                            if (file) {
                                              if (file.size > 1024 * 1024) {
                                                toast.error('File too large. Max 1MB.')
                                              } else {
                                                const newWitnesses = [...(newPlot.witnesses || [])]
                                                if (!newWitnesses[witnessIdx].witnessDocuments) {
                                                  newWitnesses[witnessIdx].witnessDocuments = {}
                                                }
                                                newWitnesses[witnessIdx].witnessDocuments.passportPhoto = file
                                                setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                              }
                                            }
                                          }}
                                        />
                                      </Button>
                                      {witness.witnessDocuments?.passportPhoto && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                            ✓ {typeof witness.witnessDocuments.passportPhoto === 'string' ? 'Uploaded' : witness.witnessDocuments.passportPhoto.name}
                                          </Typography>
                                          <Box
                                            component="img"
                                            src={typeof witness.witnessDocuments.passportPhoto === 'string' ? witness.witnessDocuments.passportPhoto : URL.createObjectURL(witness.witnessDocuments.passportPhoto)}
                                            alt="Passport Photo"
                                            sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
                                          />
                                        </Box>
                                      )}
                                    </Grid>
                                    {/* Full Photo */}
                                    <Grid item xs={6} sm={4}>
                                      <Button
                                        variant="outlined"
                                        component="label"
                                        fullWidth
                                        size="small"
                                        startIcon={<CloudUpload />}
                                      >
                                        Full Photo
                                        <input
                                          type="file"
                                          hidden
                                          accept="image/*,.pdf"
                                          onChange={(e) => {
                                            const file = e.target.files[0]
                                            if (file) {
                                              if (file.size > 1024 * 1024) {
                                                toast.error('File too large. Max 1MB.')
                                              } else {
                                                const newWitnesses = [...(newPlot.witnesses || [])]
                                                if (!newWitnesses[witnessIdx].witnessDocuments) {
                                                  newWitnesses[witnessIdx].witnessDocuments = {}
                                                }
                                                newWitnesses[witnessIdx].witnessDocuments.fullPhoto = file
                                                setNewPlot((s) => ({ ...s, witnesses: newWitnesses }))
                                              }
                                            }
                                          }}
                                        />
                                      </Button>
                                      {witness.witnessDocuments?.fullPhoto && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography variant="caption" display="block" sx={{ mb: 0.5, color: 'success.main' }}>
                                            ✓ {typeof witness.witnessDocuments.fullPhoto === 'string' ? 'Uploaded' : witness.witnessDocuments.fullPhoto.name}
                                          </Typography>
                                          <Box
                                            component="img"
                                            src={typeof witness.witnessDocuments.fullPhoto === 'string' ? witness.witnessDocuments.fullPhoto : URL.createObjectURL(witness.witnessDocuments.fullPhoto)}
                                            alt="Full Photo"
                                            sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
                                          />
                                        </Box>
                                      )}
                                    </Grid>
                                  </Grid>
                                </Grid>
                              </Grid>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary" align="center">
                            No witnesses added. Click "Add Witness" to add witness details.
                          </Typography>
                        )}
                      </Box>

                      <TextField
                        size="small"
                        label="Registry Date (Optional)"
                        type="date"
                        value={newPlot.registryDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setNewPlot((s) => ({ ...s, registryDate: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ max: new Date().toISOString().split('T')[0] }}
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
                        <TextField
                          size="small"
                          label="Agent Phone (Optional)"
                          value={newPlot.agentPhone}
                          onChange={(e) => setNewPlot({ ...newPlot, agentPhone: e.target.value })}
                          placeholder="Enter agent phone number"
                          sx={{ flex: 1 }}
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
                        <TextField
                          size="small"
                          label="Advocate Phone (Optional)"
                          value={newPlot.advocatePhone}
                          onChange={(e) => setNewPlot({ ...newPlot, advocatePhone: e.target.value })}
                          placeholder="Enter advocate phone number"
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
                        <>
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                              <FormControl component="fieldset">
                                <FormLabel component="legend">Registry Status</FormLabel>
                                <RadioGroup
                                  row
                                  value={newPlot.registryStatus}
                                  onChange={(e) => setNewPlot((s) => ({ ...s, registryStatus: e.target.value }))}
                                >
                                  <FormControlLabel value="pending" control={<Radio />} label="Registry Pending" />
                                  <FormControlLabel value="completed" control={<Radio />} label="Registry Completed" />
                                </RadioGroup>
                              </FormControl>

                              <TextField
                                size="small"
                                label="Registry Date"
                                type="date"
                                value={newPlot.registryDate || new Date().toISOString().split('T')[0]}
                                onChange={(e) => setNewPlot((s) => ({ ...s, registryDate: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 200 }}
                                inputProps={{ max: new Date().toISOString().split('T')[0] }}
                              />
                            </Box>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ p: 2, border: '1px dashed #bdbdbd', borderRadius: 1, height: '100%' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Registry Documents (Max 1MB per file, Images/PDFs)
                                </Typography>
                                <Button
                                  variant="outlined"
                                  component="label"
                                  startIcon={<CloudUpload />}
                                  size="small"
                                  sx={{ mb: 2 }}
                                >
                                  Upload Documents
                                  <input
                                    type="file"
                                    hidden
                                    multiple
                                    accept="image/*,.pdf"
                                    onChange={handleRegistryFileSelect}
                                  />
                                </Button>

                                {/* Image Previews Grid */}
                                {newPlot.registryDocuments && newPlot.registryDocuments.length > 0 && (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    {newPlot.registryDocuments.map((file, index) => (
                                      file.type && file.type.includes('image') && (
                                        <Box key={index} sx={{ position: 'relative' }}>
                                          <Box
                                            component="img"
                                            src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                                            alt={`Registry Doc ${index + 1}`}
                                            sx={{
                                              width: 60,
                                              height: 60,
                                              objectFit: 'cover',
                                              borderRadius: 1,
                                              border: '1px solid #ddd'
                                            }}
                                          />
                                          <IconButton
                                            size="small"
                                            onClick={() => removeRegistryFile(index)}
                                            sx={{
                                              position: 'absolute',
                                              top: -8,
                                              right: -8,
                                              bgcolor: 'error.main',
                                              color: 'white',
                                              width: 18,
                                              height: 18,
                                              '&:hover': { bgcolor: 'error.dark' }
                                            }}
                                          >
                                            <Close sx={{ fontSize: 12 }} />
                                          </IconButton>
                                        </Box>
                                      )
                                    ))}
                                  </Box>
                                )}

                                {/* Selected Files List */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {newPlot.registryDocuments && newPlot.registryDocuments.map((file, index) => (
                                    <Chip
                                      key={index}
                                      label={file.name}
                                      icon={file.type && file.type.includes('pdf') ? <PictureAsPdf /> : <ImageIcon />}
                                      onDelete={() => removeRegistryFile(index)}
                                      color="primary"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <Box sx={{ p: 2, border: '1px dashed #bdbdbd', borderRadius: 1, height: '100%' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Registry PDF (Max 1 file)
                                </Typography>
                                <Button
                                  variant="outlined"
                                  component="label"
                                  startIcon={<PictureAsPdf />}
                                  size="small"
                                  sx={{ mb: 2 }}
                                >
                                  Upload PDF
                                  <input
                                    type="file"
                                    hidden
                                    accept=".pdf"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        if (file.size > 1024 * 1024) {
                                          toast.error('File too large. Max 1MB.');
                                        } else {
                                          setNewPlot(s => ({ ...s, registryPdf: file }));
                                        }
                                      }
                                    }}
                                  />
                                </Button>
                                {newPlot.registryPdf && (
                                  <Chip
                                    label={newPlot.registryPdf.name || 'Existing PDF'}
                                    icon={<PictureAsPdf />}
                                    onDelete={() => setNewPlot(s => ({ ...s, registryPdf: null }))}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </>
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
        </Paper >
        {/* Image Preview Dialog */}
        < Dialog
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          maxWidth="lg"
          sx={{ zIndex: '9999 !important' }}
        >
          <Box sx={{ position: 'relative', bgcolor: 'black', minWidth: 300, minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <IconButton
              onClick={() => setImageDialogOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
            >
              <Close />
            </IconButton>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
              />
            )}
          </Box>
        </Dialog >
      </Box >
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

          <TextField
            select
            size="small"
            label="Filter by Status"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setPage(0)
            }}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="sold_registered">Sold & Registered</MenuItem>
            <MenuItem value="sold_not_registered">Sold but Not Registered</MenuItem>
            <MenuItem value="booked">Booked</MenuItem>
            <MenuItem value="available">Available</MenuItem>
          </TextField>

          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
            Add Plot
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 200px)' }}>
        <Table stickyHeader sx={{ '& td, & th': { border: '1px solid #000' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Plot No</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Colony</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Khatoni Holders / Owners</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Area (Gaj)</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Asking Price/Gaj</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Sold Price/Gaj</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Total Price</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Remaining Payment</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Facing</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Status</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Actions</TableCell>
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
                    <TableCell>{plot.colonyId?.name.toUpperCase()}</TableCell>
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
                        sx={getStatusStyle(plot.status)}
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

      {/* Image Preview Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
        sx={{ zIndex: '9999 !important' }}
      >
        <Box sx={{ position: 'relative', bgcolor: 'black', minWidth: 300, minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IconButton
            onClick={() => setImageDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
          >
            <Close />
          </IconButton>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  )
}

export default PlotManagement
