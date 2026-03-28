import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Container,
  InputAdornment,
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';

const CustomerCalculator = () => {
  const [formData, setFormData] = useState({
    // Client section
    clientName: '',
    clientCode: '',
    address: '',
    nominee: '',
    mobileNo: '',
    relation: '',
    referralCode: '',

    // Plot section
    colonyName: '',
    khasaraNo: '',
    plotNo: '',
    direction: '',
    dim1: '',
    dim2: '',
    dim3: '',
    dim4: '',
    plc: '',
    totalPlotSqYard: '',
    price: '',
    tahsil: '',

    // Government value section
    govPrice: '',
    plotSizeMtr: '',
    gender: 'M', // Default Male
    stampValue: '',
    receipt: '',
    govTotal: '',
    marketPriceTotal: '',
    cash: '',
    advanced: '',
    registryDate: '',
    remainingAmt: '',
  });

  // Auto-calculate Total Plot Sq.yard and Plot Size in Meter based on dimensions
  useEffect(() => {
    const d1 = parseFloat(formData.dim1); // Front
    const d2 = parseFloat(formData.dim2); // Back
    const d3 = parseFloat(formData.dim3); // Left
    const d4 = parseFloat(formData.dim4); // Right

    if (!isNaN(d1) && !isNaN(d2) && !isNaN(d3) && !isNaN(d4)) {
      // Calculate Area in Gaj (Sq.yards)
      const avgLength = (d1 + d2) / 2;
      const avgWidth = (d3 + d4) / 2;
      const areaSqFt = avgLength * avgWidth;
      const areaGaj = areaSqFt / 9; // 1 gaj = 9 sq ft

      // Convert Gaj to square meters (1 Gaj = 0.836127 sq mtr)
      const areaMtr = areaGaj * 0.836127;

      setFormData((prev) => ({
        ...prev,
        totalPlotSqYard: areaGaj.toFixed(2),
        plotSizeMtr: areaMtr.toFixed(2),
      }));
    } else {
      // Clear if invalid dimensions
      setFormData((prev) => ({
        ...prev,
        totalPlotSqYard: '',
        plotSizeMtr: '',
      }));
    }
  }, [formData.dim1, formData.dim2, formData.dim3, formData.dim4]);

  // Calculate Stamp Duty when Gov Total or Gender changes
  useEffect(() => {
    if (formData.govTotal) {
      const govTotalVal = parseFloat(formData.govTotal) || 0;
      const percentage = formData.gender === 'F' ? 0.06 : 0.07;
      setFormData((prev) => ({
        ...prev,
        stampValue: (govTotalVal * percentage).toFixed(2),
      }));
    } else {
      setFormData((prev) => ({ ...prev, stampValue: '' }));
    }
  }, [formData.govTotal, formData.gender]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 0,
      height: '35px',
      backgroundColor: '#fff',
      '& fieldset': {
        borderColor: '#000',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: '#000',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#000',
        borderWidth: '1px',
      },
    },
    '& .MuiInputBase-input': {
      padding: '4px 8px',
      fontSize: '14px',
      fontWeight: 'bold',
    },
  };

  const labelStyles = {
    fontWeight: 600,
    color: '#000',
    fontSize: '14px',
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }} className="no-print">
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ bgcolor: '#1976d2' }}
        >
          Print Form
        </Button>
      </Box>

      {/* Main Form Paper */}
      <Paper
        elevation={3}
        className="print-container"
        sx={{
          p: 0,
          backgroundColor: '#e6eaf5', // Light blue/gray tint matching the photo
          border: '1px solid #000',
          minHeight: '800px',
        }}
      >
        <Box sx={{ p: 4, pb: 2 }}>
          {/* Top Title */}
          <Typography
            variant="h6"
            align="center"
            sx={{
              textDecoration: 'underline',
              fontWeight: 'bold',
              mb: 4,
              color: '#000',
            }}
          >
            Client Information & form
          </Typography>

          {/* Client Information Section */}
          <Grid container spacing={2} alignItems="center">
            {/* Left Column */}
            <Grid item xs={12} md={7}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={4}>
                  <Typography sx={labelStyles}>Client Name :</Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    sx={inputStyles}
                  />
                </Grid>

                <Grid item xs={4}>
                  <Typography sx={labelStyles}>Address :</Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    sx={inputStyles}
                  />
                </Grid>

                <Grid item xs={4}>
                  <Typography sx={labelStyles}>Mobile No :</Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    name="mobileNo"
                    value={formData.mobileNo}
                    onChange={handleChange}
                    sx={{ ...inputStyles, width: '60%' }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={5}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <Typography sx={labelStyles}>Client Code</Typography>
                </Grid>
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    name="clientCode"
                    value={formData.clientCode}
                    onChange={handleChange}
                    sx={inputStyles}
                  />
                </Grid>

                <Grid item xs={5}>
                  <Typography sx={labelStyles}>Nominee</Typography>
                </Grid>
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    name="nominee"
                    value={formData.nominee}
                    onChange={handleChange}
                    sx={inputStyles}
                  />
                </Grid>

                <Grid item xs={5}>
                  <Typography sx={labelStyles}>Relation</Typography>
                </Grid>
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    name="relation"
                    value={formData.relation}
                    onChange={handleChange}
                    sx={inputStyles}
                  />
                </Grid>

                <Grid item xs={5}>
                  <Typography sx={labelStyles}>Referral code</Typography>
                </Grid>
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    sx={inputStyles}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>

        {/* Divider 1 */}
        <Box sx={{ borderBottom: '1px solid #000', my: 1 }} />

        <Box sx={{ p: 4, pt: 1, pb: 2 }}>
          {/* Middle Title */}
          <Typography
            variant="h6"
            align="center"
            sx={{
              textDecoration: 'underline',
              fontWeight: 'bold',
              mb: 3,
              color: '#d32f2f', // Red text as in image
            }}
          >
            Plot information
          </Typography>

          {/* Plot Information Section */}
          <Grid container spacing={2} alignItems="center">
            {/* Left Column */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={4}>
                  <Typography sx={{ ...labelStyles, color: '#d32f2f' }}>Colony Name</Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    name="colonyName"
                    value={formData.colonyName}
                    onChange={handleChange}
                    sx={{
                      ...inputStyles,
                      width: '70%',
                      '& .MuiOutlinedInput-root fieldset': { borderColor: '#d32f2f' },
                    }}
                  />
                </Grid>

                <Grid item xs={4}>
                  <Typography sx={{ ...labelStyles, color: '#d32f2f' }}>Plot No</Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    name="plotNo"
                    value={formData.plotNo}
                    onChange={handleChange}
                    sx={{
                      ...inputStyles,
                      width: '20%',
                      '& .MuiOutlinedInput-root fieldset': { borderColor: '#d32f2f' },
                    }}
                  />
                </Grid>

                <Grid item xs={4}>
                  <Typography sx={{ ...labelStyles, color: '#d32f2f' }}>Plot Dimensions</Typography>
                </Grid>
                <Grid item xs={8} sx={{ display: 'flex', gap: 1 }}>
                  {['dim1', 'dim2', 'dim3', 'dim4'].map((dim, i) => (
                    <TextField
                      key={i}
                      name={dim}
                      value={formData[dim]}
                      onChange={handleChange}
                      sx={{
                        ...inputStyles,
                        width: '50px',
                        '& .MuiOutlinedInput-root fieldset': { borderColor: '#d32f2f' },
                      }}
                    />
                  ))}
                </Grid>

                <Grid item xs={4}>
                  <Typography sx={{ ...labelStyles, color: '#d32f2f' }}>Total Plot in Sq.yard</Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    name="totalPlotSqYard"
                    value={formData.totalPlotSqYard}
                    onChange={handleChange}
                    sx={{
                      ...inputStyles,
                      width: '30%',
                      '& .MuiOutlinedInput-root fieldset': { borderColor: '#d32f2f' },
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <Typography sx={{ ...labelStyles, color: '#d32f2f' }}>Khasara No</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    name="khasaraNo"
                    value={formData.khasaraNo}
                    onChange={handleChange}
                    sx={{
                      ...inputStyles,
                      '& .MuiOutlinedInput-root fieldset': { borderColor: '#d32f2f' },
                    }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography sx={{ ...labelStyles, color: '#d32f2f' }}>Direction</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    name="direction"
                    value={formData.direction}
                    onChange={handleChange}
                    sx={{
                      ...inputStyles,
                      '& .MuiOutlinedInput-root fieldset': { borderColor: '#d32f2f' },
                    }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography sx={{ ...labelStyles, color: '#d32f2f' }}>PLC</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    name="plc"
                    value={formData.plc}
                    onChange={handleChange}
                    sx={{
                      ...inputStyles,
                      '& .MuiOutlinedInput-root fieldset': { borderColor: '#d32f2f' },
                    }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography sx={{ ...labelStyles, color: '#d32f2f' }}>Price</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    sx={{
                      ...inputStyles,
                      '& .MuiOutlinedInput-root fieldset': { borderColor: '#d32f2f' },
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>

        {/* Tahsil text on red line */}
        <Box sx={{ position: 'relative', height: '30px' }}>
          <Box sx={{ borderBottom: '1px solid #d32f2f', position: 'absolute', top: '15px', width: '100%', ml: 2, mr: 2, width: 'calc(100% - 32px)' }} />
          <Typography
            align="center"
            sx={{
              position: 'absolute',
              top: '3px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#e6eaf5',
              padding: '0 10px',
              color: '#d32f2f',
              fontWeight: 'bold',
            }}
          >
            TAHSIL
          </Typography>
        </Box>

        {/* TEAR OFF LINE */}
        <Box
          sx={{
            mt: 4,
            mb: 2,
            borderBottom: '2px dashed #000',
            position: 'relative',
          }}
        >
          <Typography
            className="no-print"
            variant="caption"
            sx={{
              position: 'absolute',
              top: '-10px',
              right: '20px',
              backgroundColor: '#e6eaf5',
              padding: '0 10px',
              color: '#666',
              fontWeight: 'bold',
            }}
          >
            ✂️ Tear Here For Client
          </Typography>
        </Box>

        <Box sx={{ p: 4, pt: 2, pb: 4, backgroundColor: '#e2e7f3' }}>
          <Typography
            variant="h6"
            align="center"
            sx={{
              fontWeight: 'bold',
              mb: 4,
              color: '#000',
              letterSpacing: 1,
            }}
          >
            PLOT & GOVERNMENT VALUE
          </Typography>

          <Grid container spacing={3} alignItems="center">
            {/* Gov Price */}
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={labelStyles}>Gov. price</Typography>
                <TextField
                  name="govPrice"
                  value={formData.govPrice}
                  onChange={handleChange}
                  sx={{ ...inputStyles, width: '100px' }}
                />
              </Box>
            </Grid>

            {/* Plot Size */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                <Typography sx={{ ...labelStyles, textTransform: 'uppercase' }}>PLOT SIZE</Typography>
                <TextField
                  name="plotSizeMtr"
                  value={formData.plotSizeMtr}
                  onChange={handleChange}
                  sx={{ ...inputStyles, width: '100px' }}
                />
                <Typography sx={labelStyles}>mtr</Typography>
              </Box>
            </Grid>

            {/* Stamp F/M */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Typography sx={labelStyles}>Stamp F/M</Typography>
                <FormControl component="fieldset" className="no-print">
                  <RadioGroup
                    row
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <FormControlLabel value="F" control={<Radio size="small" />} label="F (6%)" sx={{ '& .MuiFormControlLabel-label': { fontSize: '12px', fontWeight: 'bold' } }} />
                    <FormControlLabel value="M" control={<Radio size="small" />} label="M (7%)" sx={{ '& .MuiFormControlLabel-label': { fontSize: '12px', fontWeight: 'bold' } }} />
                  </RadioGroup>
                </FormControl>
                <TextField
                  name="stampValue"
                  value={formData.stampValue}
                  onChange={handleChange}
                  sx={{ ...inputStyles, width: '120px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start" sx={{ display: 'none' }} className="print-only">{formData.gender === 'F' ? 'F' : 'M'}</InputAdornment>
                  }}
                />
              </Box>
            </Grid>

            {/* Gov Total / Receipt / Market Price */}
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography sx={labelStyles}>Gov.Total &nbsp;</Typography>
                <TextField
                  name="govTotal"
                  value={formData.govTotal}
                  onChange={handleChange}
                  sx={{ ...inputStyles, width: '100px' }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              {/* Empty space filler to match layout */}
            </Grid>

            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={labelStyles}>Receipt</Typography>
                  <TextField
                    name="receipt"
                    value={formData.receipt}
                    onChange={handleChange}
                    sx={{ ...inputStyles, width: '150px' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={labelStyles}>Market Price Total</Typography>
                  <TextField
                    name="marketPriceTotal"
                    value={formData.marketPriceTotal}
                    onChange={handleChange}
                    sx={{ ...inputStyles, width: '150px' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={labelStyles}>Cash&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</Typography>
                  <TextField
                    name="cash"
                    value={formData.cash}
                    onChange={handleChange}
                    sx={{ ...inputStyles, width: '150px' }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Bottom Divider inside Gov Value */}
          <Box sx={{ borderBottom: '2px solid #000', my: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={labelStyles}>Advanced</Typography>
                <TextField
                  name="advanced"
                  value={formData.advanced}
                  onChange={handleChange}
                  sx={{ ...inputStyles, width: '150px' }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                <Typography sx={labelStyles}>registry date</Typography>
                <TextField
                  name="registryDate"
                  value={formData.registryDate}
                  onChange={handleChange}
                  sx={{ ...inputStyles, width: '120px' }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                <Typography sx={labelStyles}>remenig amt.</Typography>
                <TextField
                  name="remainingAmt"
                  value={formData.remainingAmt}
                  onChange={handleChange}
                  sx={{ ...inputStyles, width: '150px' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              border: none !important;
              box-shadow: none !important;
            }
            .no-print {
              display: none !important;
            }
            .print-only {
              display: inline-block !important;
            }
            @page {
              size: auto;
              margin: 10mm;
            }
          }
          .print-only {
            display: none;
          }
        `}
      </style>
    </Container>
  );
};

export default CustomerCalculator;
