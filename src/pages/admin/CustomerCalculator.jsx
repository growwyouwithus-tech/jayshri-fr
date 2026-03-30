import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Container,
  Checkbox,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { Print as PrintIcon, Save as SaveIcon } from '@mui/icons-material';

const CustomerCalculator = () => {
  const [formData, setFormData] = useState({
    // Client section
    clientName: '',
    clientCode: '',
    address1: '',
    address2: '',
    nominee: '',
    mobileNo: '',
    relation: '',
    referralCode: '',

    // Plot & Government Value section
    colonyName: '',
    marketPrice: '',
    totalPrice: '',
    plotNo: '',
    khasraNo: '',
    dim1: '', dim2: '', dim3: '', dim4: '',
    direction: '',
    dirS: false, dirW: false, dirE: false, dirN: false,
    totalPriceExtra: '', // (Effect Corner 20/10% extra)

    // Tehsil section
    circlePrice: '', // Gov Price
    priceInMtr: '',
    plcCorner: false,
    plcPark: false,
    plcBigRoad: false,
    roadAbove9m: false,
    road9m: false,
    gender: 'male', // male or female
    advFee: '',
    totalAPay: '',
    totalBPay: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const setGender = (g) => setFormData(prev => ({ ...prev, gender: g }));

  // Calculations
  const calcs = useMemo(() => {
    const d1 = parseFloat(formData.dim1) || 0;
    const d2 = parseFloat(formData.dim2) || 0;
    const d3 = parseFloat(formData.dim3) || 0;
    const d4 = parseFloat(formData.dim4) || 0;

    // Area in Sq.Yards (Gaj)
    const avgLen = (d1 + d2) / 2;
    const avgWid = (d3 + d4) / 2;
    const areaGaj = (avgLen * avgWid) / 9;
    const areaMtr = areaGaj * 0.836127;

    const govPrice = parseFloat(formData.circlePrice) || 0;
    const priceInMtr = govPrice ? (govPrice / 0.836127).toFixed(2) : '';

    // Gov Value Base
    let govValue = govPrice * areaGaj;

    // PLC Extra Plot Per (20%)
    const cornerExtra = formData.plcCorner ? (govValue * 0.20) : 0;
    
    // Road Above 9m (1000 per gaj extra)
    const roadExtra = formData.roadAbove9m ? (1000 * areaGaj) : 0;

    const finalGovValue = govValue + cornerExtra + roadExtra;

    // Stamp
    const stampPercent = formData.gender === 'female' ? 0.06 : 0.07;
    const stamp = finalGovValue * stampPercent;

    // Receipt (1%)
    const receipt = finalGovValue * 0.01;

    const advFee = parseFloat(formData.advFee) || 0;
    const totalPayWithAdv = finalGovValue + stamp + receipt + advFee;

    return {
      areaGaj: areaGaj.toFixed(2),
      areaMtr: areaMtr.toFixed(2),
      priceInMtr,
      cornerExtra: cornerExtra.toFixed(2),
      roadExtra: roadExtra.toFixed(2),
      finalGovValue: finalGovValue.toFixed(2),
      stamp: stamp.toFixed(2),
      receipt: receipt.toFixed(2),
      totalPayWithAdv: totalPayWithAdv.toFixed(2)
    };
  }, [formData]);

  const handlePrint = () => window.print();

  const boxStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 0,
      backgroundColor: '#fff',
      height: '32px',
      '& fieldset': { borderColor: '#777' },
      '&:hover fieldset': { borderColor: '#000' },
      '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '1px' },
    },
    '& input': { padding: '4px 8px', fontSize: '13px', fontWeight: 500 }
  };

  const titleStyle = {
    color: '#d32f2f',
    fontWeight: 700,
    textDecoration: 'underline',
    textAlign: 'center',
    mb: 3,
    fontSize: '24px'
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }} className="calculator-root">
      <Paper
        elevation={0}
        className="print-container"
        sx={{
          p: 4,
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          minHeight: '1100px',
          width: '100%',
          position: 'relative'
        }}
      >
        {/* Buttons at Top Right */}
        <Box sx={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 1 }} className="no-print">
          <Button variant="contained" size="small" startIcon={<SaveIcon />} sx={{ bgcolor: '#1a237e' }}>Save</Button>
          <Button variant="contained" size="small" startIcon={<PrintIcon />} sx={{ bgcolor: '#1a237e' }} onClick={handlePrint}>Print</Button>
        </Box>

        {/* SECTION 1: CLINT INFORMATION */}
        <Typography sx={{ ...titleStyle, color: '#d32f2f' }}>Clint Information & form</Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <Typography sx={{ minWidth: '100px', fontSize: '14px', fontWeight: 500 }}>Clint Name</Typography>
              <TextField fullWidth size="small" name="clientName" value={formData.clientName} onChange={handleChange} sx={boxStyle} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <Typography sx={{ minWidth: '100px', fontSize: '14px', fontWeight: 500 }}>Addresss</Typography>
              <TextField fullWidth size="small" name="address1" value={formData.address1} onChange={handleChange} sx={boxStyle} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <Typography sx={{ minWidth: '100px' }} />
              <TextField fullWidth size="small" name="address2" value={formData.address2} onChange={handleChange} sx={boxStyle} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <Typography sx={{ minWidth: '100px', fontSize: '14px', fontWeight: 500 }}>Mobile No</Typography>
              <TextField sx={{ ...boxStyle, width: '220px' }} size="small" name="mobileNo" value={formData.mobileNo} onChange={handleChange} />
            </Box>
          </Grid>
          
          <Grid item xs={5} sx={{ pl: 2, borderLeft: '1px solid #ccc' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <Typography sx={{ minWidth: '100px', fontSize: '14px', fontWeight: 500 }}>Clint Code</Typography>
              <TextField fullWidth size="small" name="clientCode" value={formData.clientCode} onChange={handleChange} sx={boxStyle} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <Typography sx={{ minWidth: '100px', fontSize: '14px', fontWeight: 500 }}>Nominee</Typography>
              <TextField fullWidth size="small" name="nominee" value={formData.nominee} onChange={handleChange} sx={boxStyle} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <Typography sx={{ minWidth: '100px', fontSize: '14px', fontWeight: 500 }}>Relation</Typography>
              <TextField fullWidth size="small" name="relation" value={formData.relation} onChange={handleChange} sx={boxStyle} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <Typography sx={{ minWidth: '100px', fontSize: '14px', fontWeight: 500 }}>Referral Code</Typography>
              <TextField fullWidth size="small" name="referralCode" value={formData.referralCode} onChange={handleChange} sx={boxStyle} />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: '#ccc' }} />

        {/* SECTION 2: PLOT & GOVERNMENT VALUE */}
        <Typography sx={{ ...titleStyle, color: '#d32f2f' }}>Plot & Government Value</Typography>

        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <Typography sx={{ minWidth: '120px', fontSize: '14px', fontWeight: 500 }}>Colony Name</Typography>
              <TextField fullWidth size="small" name="colonyName" value={formData.colonyName} onChange={handleChange} sx={boxStyle} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <Typography sx={{ minWidth: '120px', fontSize: '14px', fontWeight: 500 }}>Plot No</Typography>
              <TextField fullWidth size="small" name="plotNo" value={formData.plotNo} onChange={handleChange} sx={boxStyle} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <Typography sx={{ minWidth: '120px', fontSize: '14px', fontWeight: 500 }}>Plot Dimention</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {['dim1', 'dim2', 'dim3', 'dim4'].map(d => (
                  <TextField key={d} sx={{ ...boxStyle, width: '45px' }} size="small" name={d} value={formData[d]} onChange={handleChange} />
                ))}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <Typography sx={{ minWidth: '120px', fontSize: '14px', fontWeight: 500 }}>Total Plot in Sq.yard</Typography>
              <TextField sx={{ ...boxStyle, width: '180px' }} size="small" value={calcs.areaGaj} readOnly />
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <Typography sx={{ minWidth: '100px', fontSize: '14px', fontWeight: 500 }}>Market Price</Typography>
              <TextField sx={{ ...boxStyle, width: '80px' }} size="small" name="marketPrice" value={formData.marketPrice} onChange={handleChange} />
              <Typography sx={{ minWidth: '80px', fontSize: '14px', textAlign: 'right', fontWeight: 500 }}>Total Price</Typography>
              <TextField sx={{ ...boxStyle, width: '100px' }} size="small" name="totalPrice" value={formData.totalPrice} onChange={handleChange} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <Typography sx={{ minWidth: '100px', fontSize: '14px', fontWeight: 500 }}>Khasra No</Typography>
              <TextField fullWidth size="small" name="khasraNo" value={formData.khasraNo} onChange={handleChange} sx={boxStyle} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <Typography sx={{ minWidth: '80px', fontSize: '14px', fontWeight: 500 }}>Direction</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
                {['S', 'W', 'E', 'N'].map(dir => (
                  <Box key={dir} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography fontSize="12px" sx={{ mr: 0.5 }}>{dir}</Typography>
                    <Checkbox
                      size="small"
                      name={`dir${dir}`}
                      checked={formData[`dir${dir}`]}
                      onChange={handleChange}
                      sx={{ p: 0 }}
                    />
                  </Box>
                ))}
                <TextField fullWidth size="small" name="direction" value={formData.direction} onChange={handleChange} sx={boxStyle} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                <Box sx={{ textAlign: 'right', mr: 1 }}>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Total Price</Typography>
                  <Typography sx={{ fontSize: '10px', color: '#666' }}>(Efect Corner 20/10%extra)</Typography>
                </Box>
                <TextField sx={{ ...boxStyle, width: '180px' }} size="small" name="totalPriceExtra" value={formData.totalPriceExtra} onChange={handleChange} />
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: '#ccc' }} />

        {/* SECTION 3: TEHSIL */}
        <Typography sx={{ ...titleStyle, color: '#d32f2f' }}>Tehsil</Typography>

        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Circle Price/Gov Price</Typography>
                <TextField sx={{ ...boxStyle, width: '100px' }} size="small" name="circlePrice" value={formData.circlePrice} onChange={handleChange} />
              </Box>
              <Typography sx={{ fontSize: '10px', color: '#666' }}>(Efect above 9 mtr 1000 extra,Corner 20%extra)</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>PLC</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography fontSize="12px">Cornr</Typography>
                <Checkbox size="small" name="plcCorner" checked={formData.plcCorner} onChange={handleChange} sx={{ p: 0 }} />
                <Typography fontSize="12px">Park</Typography>
                <Checkbox size="small" name="plcPark" checked={formData.plcPark} onChange={handleChange} sx={{ p: 0 }} />
                <Typography fontSize="12px">Big Road</Typography>
                <Checkbox size="small" name="plcBigRoad" checked={formData.plcBigRoad} onChange={handleChange} sx={{ p: 0 }} />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Road</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography fontSize="12px">Road Above 9 mtr</Typography>
                <Checkbox size="small" name="roadAbove9m" checked={formData.roadAbove9m} onChange={handleChange} sx={{ p: 0 }} />
                <Typography fontSize="12px">9 mtr Road</Typography>
                <Checkbox size="small" name="road9m" checked={formData.road9m} onChange={handleChange} sx={{ p: 0 }} />
              </Box>
            </Box>

            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>Like</Typography>
              <TextField fullWidth size="small" readOnly value="Corner 20%, Park 10%, Big Road/Above 9mtr 1000extra" sx={boxStyle} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Adv. Fee</Typography>
              <TextField sx={{ ...boxStyle, width: '100px' }} size="small" name="advFee" value={formData.advFee} onChange={handleChange} />
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, justifyContent: 'flex-end' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Price in Mtr.</Typography>
              <TextField sx={{ ...boxStyle, width: '180px' }} size="small" value={calcs.priceInMtr} readOnly />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, justifyContent: 'flex-end' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Male7%/ Female6%</Typography>
              <Box sx={{ display: 'flex', borderRadius: 0, overflow: 'hidden', border: '1px solid #777', height: '32px' }}>
                <Button
                  sx={{
                    borderRadius: 0,
                    px: 1.5,
                    fontSize: '12px',
                    bgcolor: formData.gender === 'male' ? '#1a237e' : '#fff',
                    color: formData.gender === 'male' ? '#fff' : '#000',
                    '&:hover': { bgcolor: formData.gender === 'male' ? '#1a237e' : '#eee' }
                  }}
                  onClick={() => setGender('male')}
                >
                  Male
                </Button>
                <Button
                  sx={{
                    borderRadius: 0,
                    px: 1.5,
                    fontSize: '12px',
                    bgcolor: formData.gender === 'female' ? '#1a237e' : '#fff',
                    color: formData.gender === 'female' ? '#fff' : '#000',
                    '&:hover': { bgcolor: formData.gender === 'female' ? '#1a237e' : '#eee' }
                  }}
                  onClick={() => setGender('female')}
                >
                  female
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, justifyContent: 'flex-end' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Stamp</Typography>
              <TextField sx={{ ...boxStyle, width: '180px' }} size="small" value={calcs.stamp} readOnly />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, justifyContent: 'flex-end' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Receipt</Typography>
              <TextField sx={{ ...boxStyle, width: '180px' }} size="small" value={calcs.receipt} readOnly />
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid #ccc' }}>
          <Grid container justifyContent="flex-end">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, justifyContent: 'flex-end' }}>
                <Typography sx={{ fontSize: '16px', fontWeight: 700 }}>Total Pay With adv and all</Typography>
                <TextField sx={{ ...boxStyle, width: '180px', '& input': { fontWeight: 700, fontSize: '16px' } }} size="small" value={calcs.totalPayWithAdv} readOnly />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2, justifyContent: 'flex-end' }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Tota A Pay</Typography>
                <TextField sx={{ ...boxStyle, width: '120px' }} size="small" name="totalAPay" value={formData.totalAPay} onChange={handleChange} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2, justifyContent: 'flex-end' }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Tota B Pay</Typography>
                <TextField sx={{ ...boxStyle, width: '120px' }} size="small" name="totalBPay" value={formData.totalBPay} onChange={handleChange} />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <style>
        {`
          @media print {
            body { margin: 0; padding: 0; }
            .print-container {
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              box-shadow: none !important;
            }
            .no-print { display: none !important; }
            @page {
              size: A4;
              margin: 10mm;
            }
          }
          .calculator-root input[type=number]::-webkit-inner-spin-button, 
          .calculator-root input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
          }
        `}
      </style>
    </Container>
  );
};

export default CustomerCalculator;
