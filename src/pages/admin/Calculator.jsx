import { useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Card,
  CardContent,
  TableContainer,
  Paper,
  IconButton
} from '@mui/material'
import { Calculate, Refresh, Delete } from '@mui/icons-material'

const GajToSqFt = 9
const createRoadRow = () => ({ length: '', width: '' })
const createSpaceRow = () => ({ front: '', back: '', left: '', right: '' })

const parseNumber = (value) => {
  const num = parseFloat(value)
  return Number.isFinite(num) ? num : 0
}

const formatNumber = (value, options = {}) => {
  if (!Number.isFinite(value)) return '-'
  return value.toLocaleString('en-IN', options)
}

const formatCurrency = (value) => formatNumber(value, { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

const Calculator = () => {
  const numberInputProps = { onWheel: (event) => event.currentTarget.blur() }

  const [summaryInputs, setSummaryInputs] = useState({
    totalLand: '',
    purchaseRate: '',
    desiredProfit: '',
    sellingPrice: ''
  })

  const [roads, setRoads] = useState([createRoadRow()])
  const [parks, setParks] = useState([createSpaceRow()])
  const [amenities, setAmenities] = useState([createSpaceRow()])

  const handleSummaryChange = (event) => {
    const { name, value } = event.target
    setSummaryInputs((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoadChange = (index, field, value) => {
    setRoads((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }
      return updated
    })
  }

  const handleSpaceChange = (index, field, value, setter) => {
    setter((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }
      return updated
    })
  }

  const getRoadAreaSqFt = (road) => parseNumber(road.length) * parseNumber(road.width)

  const getSpaceAreaSqFt = (space) => {
    const front = parseNumber(space.front)
    const back = parseNumber(space.back)
    const left = parseNumber(space.left)
    const right = parseNumber(space.right)

    if (!front && !back && !left && !right) return 0

    const avgFrontBack = (front + back) / 2
    const avgLeftRight = (left + right) / 2
    return avgFrontBack * avgLeftRight
  }

  const totalRoadAreaSqFt = useMemo(
    () => roads.reduce((sum, road) => sum + getRoadAreaSqFt(road), 0),
    [roads]
  )

  const totalParksAreaSqFt = useMemo(
    () => parks.reduce((sum, park) => sum + getSpaceAreaSqFt(park), 0),
    [parks]
  )

  const totalAmenitiesAreaSqFt = useMemo(
    () => amenities.reduce((sum, amenity) => sum + getSpaceAreaSqFt(amenity), 0),
    [amenities]
  )

  const totalRoadAreaGaj = totalRoadAreaSqFt / GajToSqFt
  const totalParksAreaGaj = totalParksAreaSqFt / GajToSqFt
  const totalAmenitiesAreaGaj = totalAmenitiesAreaSqFt / GajToSqFt

  const totalLand = parseNumber(summaryInputs.totalLand)
  const purchaseRate = parseNumber(summaryInputs.purchaseRate)
  const desiredProfit = parseNumber(summaryInputs.desiredProfit)
  const sellingPrice = parseNumber(summaryInputs.sellingPrice)

  const totalNonSalableArea = totalRoadAreaGaj + totalParksAreaGaj + totalAmenitiesAreaGaj
  const salableLandArea = Math.max(totalLand - totalNonSalableArea, 0)

  const totalPurchaseCost = totalLand * purchaseRate
  const totalRevenue = salableLandArea * sellingPrice
  const netProfit = totalRevenue - totalPurchaseCost
  const profitPercent = totalPurchaseCost > 0 ? (netProfit / totalPurchaseCost) * 100 : 0

  const effectivePurchaseCostPerGaj = salableLandArea > 0 ? totalPurchaseCost / salableLandArea : 0
  const suggestedSellingPrice = effectivePurchaseCostPerGaj * (1 + desiredProfit / 100)

  const resetAll = () => {
    setSummaryInputs({
      totalLand: '',
      purchaseRate: '',
      desiredProfit: '',
      sellingPrice: ''
    })
    setRoads([createRoadRow()])
    setParks([createSpaceRow()])
    setAmenities([createSpaceRow()])
  }

  const addRoadRow = () => setRoads((prev) => [...prev, createRoadRow()])
  const addParkRow = () => setParks((prev) => [...prev, createSpaceRow()])
  const addAmenityRow = () => setAmenities((prev) => [...prev, createSpaceRow()])
  const removeRoadRow = (index) => setRoads((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  const removeParkRow = (index) => setParks((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  const removeAmenityRow = (index) => setAmenities((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))

  const renderRoadRows = () => (
    <TableBody>
      {roads.map((road, index) => {
        const areaSqFt = getRoadAreaSqFt(road)
        const areaGaj = areaSqFt / GajToSqFt
        const disableRemove = roads.length === 1

        return (
          <TableRow key={`road-${index}`}>
            <TableCell>{`Road ${index + 1}`}</TableCell>
            <TableCell>
              <TextField
                fullWidth
                size="small"
                name="length"
                type="number"
                value={road.length}
                onChange={(event) => handleRoadChange(index, 'length', event.target.value)}
                inputProps={numberInputProps}
                InputProps={{
                  endAdornment: <Typography variant="caption">ft</Typography>
                }}
              />
            </TableCell>
            <TableCell>
              <TextField
                fullWidth
                size="small"
                name="width"
                type="number"
                value={road.width}
                onChange={(event) => handleRoadChange(index, 'width', event.target.value)}
                inputProps={numberInputProps}
                InputProps={{
                  endAdornment: <Typography variant="caption">ft</Typography>
                }}
              />
            </TableCell>
            <TableCell align="right">{formatNumber(areaSqFt, { maximumFractionDigits: 2 })}</TableCell>
            <TableCell align="right">{formatNumber(areaGaj, { maximumFractionDigits: 2 })}</TableCell>
            <TableCell align="center">
              <IconButton
                size="small"
                color="error"
                onClick={() => removeRoadRow(index)}
                disabled={disableRemove}
              >
                <Delete fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        )
      })}
      <TableRow>
        <TableCell colSpan={4}>
          <Button size="small" onClick={addRoadRow} startIcon={<Calculate fontSize="small" />} sx={{ mr: 2 }}>
            Add Road
          </Button>
          <Typography component="span" variant="subtitle2" sx={{ ml: 2 }}>Total Roads:</Typography>
        </TableCell>
        <TableCell align="right"><strong>{formatNumber(totalRoadAreaSqFt, { maximumFractionDigits: 2 })}</strong></TableCell>
        <TableCell align="right"><strong>{formatNumber(totalRoadAreaGaj, { maximumFractionDigits: 2 })}</strong></TableCell>
      </TableRow>
    </TableBody>
  )

  const renderSpaceRows = (spaces, setter, label, addRow, removeRow) => (
    <TableBody>
      {spaces.map((space, index) => {
        const areaSqFt = getSpaceAreaSqFt(space)
        const areaGaj = areaSqFt / GajToSqFt
        const disableRemove = spaces.length === 1

        return (
          <TableRow key={`${label}-${index}`}>
            <TableCell>{`${label} ${index + 1}`}</TableCell>
            {(['front', 'back', 'left', 'right']).map((side) => (
              <TableCell key={side}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={space[side]}
                  onChange={(event) => handleSpaceChange(index, side, event.target.value, setter)}
                  inputProps={numberInputProps}
                  InputProps={{ endAdornment: <Typography variant="caption">ft</Typography> }}
                />
              </TableCell>
            ))}
            <TableCell align="right">{formatNumber(areaSqFt, { maximumFractionDigits: 2 })}</TableCell>
            <TableCell align="right">{formatNumber(areaGaj, { maximumFractionDigits: 2 })}</TableCell>
            <TableCell align="center">
              <IconButton
                size="small"
                color="error"
                onClick={() => removeRow(index)}
                disabled={disableRemove}
              >
                <Delete fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        )
      })}
      <TableRow>
        <TableCell colSpan={6}>
          <Button size="small" onClick={addRow} startIcon={<Calculate fontSize="small" />} sx={{ mr: 2 }}>
            Add {label}
          </Button>
          <Typography component="span" variant="subtitle2">Total {label}s:</Typography>
        </TableCell>
        <TableCell align="right">
          <strong>{formatNumber(
            spaces === parks ? totalParksAreaSqFt : totalAmenitiesAreaSqFt,
            { maximumFractionDigits: 2 }
          )}</strong>
        </TableCell>
        <TableCell align="right">
          <strong>{formatNumber(
            spaces === parks ? totalParksAreaGaj : totalAmenitiesAreaGaj,
            { maximumFractionDigits: 2 }
          )}</strong>
        </TableCell>
      </TableRow>
    </TableBody>
  )

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Land Selling Calculator</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={resetAll} color="inherit">
          Reset All
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={3} color="primary">Key Inputs</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="totalLand"
                    label="Total Land"
                    type="number"
                    value={summaryInputs.totalLand}
                    onChange={handleSummaryChange}
                    inputProps={numberInputProps}
                    InputProps={{ endAdornment: <Typography variant="caption">gaj</Typography> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="purchaseRate"
                    label="Purchase Rate per gaj"
                    type="number"
                    value={summaryInputs.purchaseRate}
                    onChange={handleSummaryChange}
                    inputProps={numberInputProps}
                    InputProps={{ startAdornment: <Typography variant="caption">₹</Typography> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="desiredProfit"
                    label="Desired Profit %"
                    type="number"
                    value={summaryInputs.desiredProfit}
                    onChange={handleSummaryChange}
                    inputProps={numberInputProps}
                    InputProps={{ endAdornment: <Typography variant="caption">%</Typography> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="sellingPrice"
                    label="Selling Price per gaj"
                    type="number"
                    value={summaryInputs.sellingPrice}
                    onChange={handleSummaryChange}
                    inputProps={numberInputProps}
                    InputProps={{ startAdornment: <Typography variant="caption">₹</Typography> }}
                  />
                </Grid>
              </Grid>
              <Typography variant="caption" display="block" mt={2} color="text.secondary">
                * 1 gaj = {GajToSqFt} sq ft
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={3} color="primary">Summary</Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Total Land (gaj)</TableCell>
                    <TableCell align="right">{formatNumber(totalLand, { maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Purchase Rate per gaj</TableCell>
                    <TableCell align="right">{formatCurrency(purchaseRate)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Purchase Cost</TableCell>
                    <TableCell align="right">{formatCurrency(totalPurchaseCost)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Roads Area (gaj)</TableCell>
                    <TableCell align="right">{formatNumber(totalRoadAreaGaj, { maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Parks Area (gaj)</TableCell>
                    <TableCell align="right">{formatNumber(totalParksAreaGaj, { maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Amenities Area (gaj)</TableCell>
                    <TableCell align="right">{formatNumber(totalAmenitiesAreaGaj, { maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Non-Salable Area (gaj)</TableCell>
                    <TableCell align="right">{formatNumber(totalNonSalableArea, { maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Salable Land Area (gaj)</TableCell>
                    <TableCell align="right">{formatNumber(salableLandArea, { maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Effective Purchase Cost / gaj</TableCell>
                    <TableCell align="right">{formatCurrency(effectivePurchaseCostPerGaj)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Desired Profit %</TableCell>
                    <TableCell align="right">{formatNumber(desiredProfit, { maximumFractionDigits: 2 })}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Suggested Selling Price / gaj</TableCell>
                    <TableCell align="right">{formatCurrency(suggestedSellingPrice)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Selling Price / gaj (market)</TableCell>
                    <TableCell align="right">{formatCurrency(sellingPrice)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Revenue</TableCell>
                    <TableCell align="right">{formatCurrency(totalRevenue)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Net Profit</TableCell>
                    <TableCell align="right">{formatCurrency(netProfit)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Profit %</TableCell>
                    <TableCell align="right">{formatNumber(profitPercent, { maximumFractionDigits: 2 })}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={3} color="primary">Roads (Length × Width)</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Road No</TableCell>
                      <TableCell>Length (ft)</TableCell>
                      <TableCell>Width (ft)</TableCell>
                      <TableCell align="right">Area (ft²)</TableCell>
                      <TableCell align="right">Area (gaj)</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  {renderRoadRows()}
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={3} color="primary">Parks (Front, Back, Left, Right)</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Park No</TableCell>
                      <TableCell>Front (ft)</TableCell>
                      <TableCell>Back (ft)</TableCell>
                      <TableCell>Left (ft)</TableCell>
                      <TableCell>Right (ft)</TableCell>
                      <TableCell align="right">Area (ft²)</TableCell>
                      <TableCell align="right">Area (gaj)</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  {renderSpaceRows(parks, setParks, 'Park', addParkRow, removeParkRow)}
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={3} color="primary">Amenities (Front, Back, Left, Right)</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Amenity No</TableCell>
                      <TableCell>Front (ft)</TableCell>
                      <TableCell>Back (ft)</TableCell>
                      <TableCell>Left (ft)</TableCell>
                      <TableCell>Right (ft)</TableCell>
                      <TableCell align="right">Area (ft²)</TableCell>
                      <TableCell align="right">Area (gaj)</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  {renderSpaceRows(amenities, setAmenities, 'Amenity', addAmenityRow, removeAmenityRow)}
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Calculator
