import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Container,
  Paper,
  InputAdornment,
  Divider,
  IconButton
} from '@mui/material';
import { Print as PrintIcon, Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';

const GajToSqFt = 9;
const createRoadRow = () => ({ length: '', width: '' });
const createSpaceRow = () => ({ front: '', back: '', left: '', right: '' });

const parseNumber = (value) => {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
};

const formatNumber = (value, options = {}) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('en-IN', options);
};

const formatCurrency = (value) => formatNumber(value, { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

// Modern Styling Components
const ModernInput = ({ label, value, readOnly = false, colored = false, ...props }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, justifyContent: 'space-between' }}>
    <Typography sx={{ fontWeight: 500, color: '#333', fontSize: '14px' }}>{label}</Typography>
    <Box sx={{ width: '160px' }}>
      <TextField
        fullWidth
        size="small"
        value={value}
        InputProps={{
          readOnly: readOnly,
          sx: {
            bgcolor: readOnly ? '#f8f9fa' : '#ffffff',
            borderRadius: '4px',
            '& input': {
              color: colored && value ? (parseNumber(value) < 0 ? '#d32f2f' : '#388e3c') : '#000',
              fontWeight: readOnly ? 600 : 400,
              padding: '6px 12px'
            }
          }
        }}
        {...props}
      />
    </Box>
  </Box>
);

const SmallInput = ({ value, placeholder, onChange }) => (
  <TextField
    size="small"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    InputProps={{
      sx: { width: '75px', bgcolor: '#fff', borderRadius: '4px', '& input': { p: '6px' } }
    }}
  />
);

const AdOnBtn = ({ onClick }) => (
  <Button
    variant="contained"
    onClick={onClick}
    className="no-print"
    sx={{
      bgcolor: '#0f9d58',
      color: '#fff',
      textTransform: 'none',
      minWidth: 'auto',
      px: 2,
      height: '32px',
      fontWeight: 600,
      '&:hover': { bgcolor: '#0b8043' }
    }}
  >
    Ad on
  </Button>
);

const Calculator = () => {
  const numberInputProps = { onWheel: (event) => event.currentTarget.blur() };

  const [summaryInputs, setSummaryInputs] = useState({
    totalLand: '',
    purchaseRate: '',
    desiredProfit: '',
    sellingPrice: ''
  });

  const [roads, setRoads] = useState([createRoadRow()]);
  const [parks, setParks] = useState([createSpaceRow()]);
  const [amenities, setAmenities] = useState([createSpaceRow()]);

  const handleSummaryChange = (event) => {
    const { name, value } = event.target;

    // Auto calculate Selling Price if Desired Profit is typed
    if (name === 'desiredProfit') {
      const dp = parseNumber(value);
      const effectiveCost = salableLandArea > 0 ? totalPurchaseCost / salableLandArea : 0;
      const sp = effectiveCost * (1 + dp / 100);
      setSummaryInputs((prev) => ({
        ...prev,
        [name]: value,
        sellingPrice: sp > 0 ? sp.toFixed(2) : ''
      }));
    } else {
      setSummaryInputs((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleRoadChange = (index, field, value) => {
    setRoads((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSpaceChange = (index, field, value, setter) => {
    setter((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRoadRow = () => setRoads((prev) => [...prev, createRoadRow()]);
  const removeRoadRow = (index) => setRoads((prev) => prev.filter((_, i) => i !== index));

  const addParkRow = () => setParks((prev) => [...prev, createSpaceRow()]);
  const removeParkRow = (index) => setParks((prev) => prev.filter((_, i) => i !== index));

  const addAmenityRow = () => setAmenities((prev) => [...prev, createSpaceRow()]);
  const removeAmenityRow = (index) => setAmenities((prev) => prev.filter((_, i) => i !== index));

  const getRoadAreaSqFt = (road) => parseNumber(road.length) * parseNumber(road.width);
  const getSpaceAreaSqFt = (space) => {
    const front = parseNumber(space.front);
    const back = parseNumber(space.back);
    const left = parseNumber(space.left);
    const right = parseNumber(space.right);
    if (!front && !back && !left && !right) return 0;
    return ((front + back) / 2) * ((left + right) / 2);
  };

  const totalRoadAreaSqFt = useMemo(() => roads.reduce((sum, r) => sum + getRoadAreaSqFt(r), 0), [roads]);
  const totalParksAreaSqFt = useMemo(() => parks.reduce((sum, p) => sum + getSpaceAreaSqFt(p), 0), [parks]);
  const totalAmenitiesAreaSqFt = useMemo(() => amenities.reduce((sum, a) => sum + getSpaceAreaSqFt(a), 0), [amenities]);

  const totalRoadAreaGaj = totalRoadAreaSqFt / GajToSqFt;
  const totalParksAreaGaj = totalParksAreaSqFt / GajToSqFt;
  const totalAmenitiesAreaGaj = totalAmenitiesAreaSqFt / GajToSqFt;

  const totalLand = parseNumber(summaryInputs.totalLand);
  const purchaseRate = parseNumber(summaryInputs.purchaseRate);
  const sellingPrice = parseNumber(summaryInputs.sellingPrice);

  const totalNonSalableArea = totalRoadAreaGaj + totalParksAreaGaj + totalAmenitiesAreaGaj;
  const salableLandArea = Math.max(totalLand - totalNonSalableArea, 0);

  const totalPurchaseCost = totalLand * purchaseRate;
  const totalRevenue = salableLandArea * sellingPrice;
  const netProfit = totalRevenue - totalPurchaseCost;
  const profitPercent = totalPurchaseCost > 0 ? (netProfit / totalPurchaseCost) * 100 : 0;
  const effectivePurchaseCostPerGaj = salableLandArea > 0 ? totalPurchaseCost / salableLandArea : 0;
  const suggestedSellingPrice = effectivePurchaseCostPerGaj * (1 + parseNumber(summaryInputs.desiredProfit) / 100);

  const handlePrint = () => window.print();

  return (
    <Container maxWidth={false} sx={{ mt: 3, mb: 6, px: { xs: 1, md: 4 } }}>
      <Paper elevation={3} className="print-container" sx={{ p: { xs: 2, md: 5 }, borderRadius: 2, bgcolor: '#ffffff', width: '100%', minHeight: '80vh' }}>

        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ width: '80px' }} className="no-print" /> {/* Spacer */}
          <Typography
            variant="h4"
            align="center"
            className="print-title"
            sx={{
              fontWeight: 600,
              color: '#1a237e',
              textDecoration: 'underline',
              textUnderlineOffset: '8px',
              fontSize: { xs: '1.5rem', md: '2.5rem' }
            }}
          >
            JAYSHRI LAND CALCULATOR
          </Typography>
          <Button
            variant="contained"
            className="no-print"
            onClick={handlePrint}
            sx={{
              bgcolor: '#1a237e',
              color: '#fff',
              fontWeight: 600,
              textTransform: 'none',
              px: { xs: 2, md: 4 },
              py: 1,
              '&:hover': { bgcolor: '#0d47a1' }
            }}
          >
            Print
          </Button>
        </Box>

        {/* TOP TWO COLUMNS */}
        <Grid container spacing={{ xs: 4, md: 10 }} sx={{ mb: 6 }}>
          <Grid item xs={12} md={5}>
            <ModernInput
              label="Total Land"
              name="totalLand"
              type="number"
              value={summaryInputs.totalLand}
              onChange={handleSummaryChange}
              placeholder="Total Gaj"
            />
            <ModernInput
              label="Buy Price"
              name="purchaseRate"
              type="number"
              value={summaryInputs.purchaseRate}
              onChange={handleSummaryChange}
              placeholder="Rate per gaj"
            />
            <ModernInput
              label="If Selling Price"
              name="sellingPrice"
              type="number"
              value={summaryInputs.sellingPrice}
              onChange={handleSummaryChange}
              placeholder="Selling per gaj"
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
            <ModernInput
              label="Desired Profit %"
              name="desiredProfit"
              type="number"
              value={summaryInputs.desiredProfit}
              onChange={handleSummaryChange}
              placeholder="e.g. 20"
            />
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            <Divider orientation="vertical" sx={{ height: '100%' }} />
          </Grid>

          <Grid item xs={12} md={5}>
            <ModernInput
              label="Total Purchase Cost"
              readOnly
              value={totalPurchaseCost > 0 ? formatCurrency(totalPurchaseCost) : ''}
            />
            <ModernInput
              label="Total Sale Area"
              readOnly
              value={salableLandArea > 0 ? formatNumber(salableLandArea, { maximumFractionDigits: 2 }) : ''}
              InputProps={{ endAdornment: <InputAdornment position="end">gaj</InputAdornment> }}
            />
            <ModernInput
              label="Effective Purchase Cost / gaj"
              readOnly
              value={effectivePurchaseCostPerGaj > 0 ? formatCurrency(effectivePurchaseCostPerGaj) : ''}
            />
            <ModernInput
              label="Suggested Selling Price / gaj"
              readOnly
              value={suggestedSellingPrice > 0 ? formatCurrency(suggestedSellingPrice) : ''}
            />
            <ModernInput
              label="Total Revenue"
              readOnly
              value={totalRevenue > 0 ? formatCurrency(totalRevenue) : ''}
            />
            <ModernInput
              label="Net Profit"
              readOnly
              colored
              value={totalPurchaseCost > 0 && totalRevenue > 0 ? formatCurrency(netProfit) : ''}
            />
            <ModernInput
              label="Net Profit in %"
              readOnly
              colored
              value={totalPurchaseCost > 0 && totalRevenue > 0 ? `${formatNumber(profitPercent, { maximumFractionDigits: 2 })}%` : ''}
            />
          </Grid>
        </Grid>

        <Box sx={{ mb: 4, mt: 10 }}>

          {/* ROADS SECTION */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3, borderBottom: '3px solid #1a237e', pb: 0.5 }}>
              Roads Calculation (Length × Width)
            </Typography>
            {roads.map((road, idx) => (
              <Box key={`road-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, width: '100%' }}>
                <Box sx={{ flex: 1 }}><SmallInput placeholder="Length" value={road.length} onChange={(e) => handleRoadChange(idx, 'length', e.target.value)} /></Box>
                <Box sx={{ flex: 1 }}><SmallInput placeholder="Width" value={road.width} onChange={(e) => handleRoadChange(idx, 'width', e.target.value)} /></Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {idx === roads.length - 1 && <AdOnBtn onClick={addRoadRow} />}
                  {roads.length > 1 && (
                    <IconButton onClick={() => removeRoadRow(idx)} color="error" className="no-print">
                      <CloseIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          {/* PARKS SECTION */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3, borderBottom: '3px solid #1a237e', pb: 0.5 }}>
              Parks Calculation (F, B, L, R)
            </Typography>
            {parks.map((park, idx) => (
              <Box key={`park-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, width: '100%' }}>
                <Box sx={{ flex: 1 }}><SmallInput placeholder="Front" value={park.front} onChange={(e) => handleSpaceChange(idx, 'front', e.target.value, setParks)} /></Box>
                <Box sx={{ flex: 1 }}><SmallInput placeholder="Back" value={park.back} onChange={(e) => handleSpaceChange(idx, 'back', e.target.value, setParks)} /></Box>
                <Box sx={{ flex: 1 }}><SmallInput placeholder="Left" value={park.left} onChange={(e) => handleSpaceChange(idx, 'left', e.target.value, setParks)} /></Box>
                <Box sx={{ flex: 1 }}><SmallInput placeholder="Right" value={park.right} onChange={(e) => handleSpaceChange(idx, 'right', e.target.value, setParks)} /></Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {idx === parks.length - 1 && <AdOnBtn onClick={addParkRow} />}
                  {parks.length > 1 && (
                    <IconButton onClick={() => removeParkRow(idx)} color="error" className="no-print">
                      <CloseIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          {/* AMENITIES SECTION */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3, borderBottom: '3px solid #1a237e', pb: 0.5 }}>
              Amenities Calculation (F, B, L, R)
            </Typography>
            {amenities.map((amenity, idx) => (
              <Box key={`amenity-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, width: '100%' }}>
                <Box sx={{ flex: 1 }}><SmallInput placeholder="Front" value={amenity.front} onChange={(e) => handleSpaceChange(idx, 'front', e.target.value, setAmenities)} /></Box>
                <Box sx={{ flex: 1 }}><SmallInput placeholder="Back" value={amenity.back} onChange={(e) => handleSpaceChange(idx, 'back', e.target.value, setAmenities)} /></Box>
                <Box sx={{ flex: 1 }}><SmallInput placeholder="Left" value={amenity.left} onChange={(e) => handleSpaceChange(idx, 'left', e.target.value, setAmenities)} /></Box>
                <Box sx={{ flex: 1 }}><SmallInput placeholder="Right" value={amenity.right} onChange={(e) => handleSpaceChange(idx, 'right', e.target.value, setAmenities)} /></Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {idx === amenities.length - 1 && <AdOnBtn onClick={addAmenityRow} />}
                  {amenities.length > 1 && (
                    <IconButton onClick={() => removeAmenityRow(idx)} color="error" className="no-print">
                      <CloseIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          {/* BOTTOM SUMMARIES */}
          <Grid container spacing={4} sx={{ mt: 6 }}>
            <Grid item xs={12} sm={3} className="prevent-break">
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#444' }}>Total Roads Area (gaj)</Typography>
              <TextField
                fullWidth
                size="small"
                value={totalRoadAreaGaj > 0 ? formatNumber(totalRoadAreaGaj, { maximumFractionDigits: 2 }) : ''}
                InputProps={{ readOnly: true, sx: { bgcolor: '#f8f9fa', borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12} sm={3} className="prevent-break">
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#444' }}>Total Parks Area (gaj)</Typography>
              <TextField
                fullWidth
                size="small"
                value={totalParksAreaGaj > 0 ? formatNumber(totalParksAreaGaj, { maximumFractionDigits: 2 }) : ''}
                InputProps={{ readOnly: true, sx: { bgcolor: '#f8f9fa', borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12} sm={3} className="prevent-break">
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#444' }}>Total Amenities Area (gaj)</Typography>
              <TextField
                fullWidth
                size="small"
                value={totalAmenitiesAreaGaj > 0 ? formatNumber(totalAmenitiesAreaGaj, { maximumFractionDigits: 2 }) : ''}
                InputProps={{ readOnly: true, sx: { bgcolor: '#f8f9fa', borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12} sm={3} className="prevent-break">
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#444' }}>Total Non-Salable Area (gaj)</Typography>
              <TextField
                fullWidth
                size="small"
                value={totalNonSalableArea > 0 ? formatNumber(totalNonSalableArea, { maximumFractionDigits: 2 }) : ''}
                InputProps={{ readOnly: true, sx: { bgcolor: '#f8f9fa', borderRadius: '8px' } }}
              />
            </Grid>
          </Grid>
        </Box>

      </Paper>

      <style>
        {`
          @media print {
            body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #fff !important;
              -webkit-print-color-adjust: exact;
            }
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 5mm !important;
              border: none !important;
              box-shadow: none !important;
              zoom: 0.85; /* Chrome-supported way to shrink layout physically */
              break-inside: avoid;
            }
            .prevent-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4 portrait;
              margin: 5mm;
            }
          }
        `}
      </style>
    </Container>
  );
};

export default Calculator;
