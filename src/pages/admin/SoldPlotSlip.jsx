import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, Paper, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Print } from '@mui/icons-material';
import axios from '@/api/axios';
import { format } from 'date-fns';

const SoldPlotSlip = () => {
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookingDetail();
    }, [id]);

    const fetchBookingDetail = async () => {
        try {
            if (id.startsWith('temp-')) {
                const plotId = id.replace('temp-', '');
                const { data } = await axios.get(`/plots/${plotId}`);
                const plot = data.data.plot || data.data;

                const pseudoBooking = {
                    _id: id,
                    isPseudo: true,
                    bookingNumber: `SOLD-${plot.plotNumber || plot.plotNo}`,
                    userId: {
                        name: plot.customerName || 'Direct Customer',
                        phone: plot.customerNumber,
                        address: plot.customerShortAddress
                    },
                    customerDetails: {
                        name: plot.customerName,
                        phone: plot.customerNumber,
                        address: plot.customerShortAddress,
                        wifeOf: plot.customerWifeOf,
                        sonOf: plot.customerSonOf
                    },
                    plotId: plot,
                    plot: plot,
                    // Agent information from plot
                    agent: plot.agentName ? {
                        name: plot.agentName,
                        userCode: plot.agentCode,
                        _id: plot.agentId || 'pseudo-agent'
                    } : null,
                    agentId: plot.agentName ? {
                        name: plot.agentName,
                        code: plot.agentCode,
                        _id: plot.agentId || 'pseudo-agent'
                    } : null,
                    // Commission data from plot
                    commissions: plot.commissionPercentage || plot.commissionAmount ? [{
                        percentage: plot.commissionPercentage,
                        amount: plot.commissionAmount,
                        agent: plot.agentId || 'pseudo-agent'
                    }] : [],
                    commissionPercentage: plot.commissionPercentage,
                    commissionAmount: plot.commissionAmount,
                    totalAmount: (plot.finalPrice && plot.areaGaj) ? (Number(plot.finalPrice) * Number(plot.areaGaj)) : (plot.totalPrice || 0),
                    paidAmount: plot.paidAmount || 0,
                    createdAt: plot.updatedAt || new Date().toISOString()
                };
                setBooking(pseudoBooking);
            } else {
                const { data } = await axios.get(`/bookings/${id}`);
                setBooking(data.data);
                console.log('Booking data:', data.data);
                console.log('Agent:', data.data.agent);
                console.log('Commissions:', data.data.commissions);
            }
        } catch (error) {
            console.error('Failed to fetch booking details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!booking) {
        return <Typography variant="h6" align="center" mt={4}>Booking/Plot not found</Typography>;
    }

    const plot = booking.plot || booking.plotId || {};
    const colony = plot.colony || plot.colonyId || {};
    const customer = booking.userId || booking.customerDetails || {};
    const agent = booking.agentId || {};
    // Extract relation info if available
    const relationName = customer.wifeOf || customer.sonOf || customer.daughterOf || '';
    const relationLabel = customer.wifeOf ? 'w/o' : (customer.sonOf ? 's/o' : (customer.daughterOf ? 'd/o' : 'w/o'));

    const dimensions = plot.dimensions || {};
    const address = customer.address || '';

    // Formatting Helpers
    const formatCurrency = (val) => val ? `₹ ${Number(val).toLocaleString()}` : '';
    const formatDimension = (val) => val ? `${val} ft,` : ''; // Added 'ft,' based on image

    // Styles for "input-like" boxes
    const BoxValue = ({ children }) => (
        <Box sx={{ border: '1px solid #999', px: 1, py: 0.2, minHeight: '22px', fontSize: '0.9rem', bgcolor: '#fff', display: 'inline-block', minWidth: '100px' }}>
            {children}
        </Box>
    );

    // Consistency with SoldPlotManagement.jsx logic
    const toNumber = (val) => {
        const num = Number(val);
        return Number.isFinite(num) ? num : 0;
    };
    const areaGaj = plot.areaGaj || (plot.area ? (toNumber(plot.area) / 9).toFixed(3) : 0);
    const calculatedFromFinal = (plot.finalPrice && areaGaj) ? (toNumber(areaGaj) * toNumber(plot.finalPrice)) : 0;
    const displayTotalPrice = calculatedFromFinal || booking.totalAmount || plot.totalPrice || (toNumber(areaGaj) * toNumber(plot.pricePerGaj || plot.ratePerGaj || 0));

    return (
        <Box sx={{
            p: 4,
            bgcolor: '#f0f0f0',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            '@media print': {
                p: 0,
                bgcolor: 'white',
                display: 'block'
            }
        }}>
            {/* Action Bar (Hidden in Print) */}
            <Box sx={{
                width: '100%',
                maxWidth: '210mm',
                display: 'flex',
                justifyContent: 'flex-end',
                mb: 2,
                '@media print': { display: 'none' }
            }}>
                <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>
                    Print
                </Button>
            </Box>

            <Paper elevation={0} sx={{
                width: '100%',
                maxWidth: '280mm', // Wider landscape-ish feel or standard A4? Image looks wide. Let's try fitting A4 width first but maximizing content.
                // Image looks like landscape A4 or just packed layout. Let's stick to A4 Portrait width standard but fit to page.
                // Actually the image looks like a screen capture of a form, not necessarily a printed page. 
                // But as a slip, A4 width (210mm) is standard.
                // maxWidth: '210mm',
                bgcolor: '#fff',
                mx: 'auto',
                p: 0, // No padding on main paper, layout handles it
                '@media print': {
                    boxShadow: 'none',
                    mx: 0,
                    width: '100%',
                    maxWidth: '100%'
                }
            }}>
                {/* Header Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, pt: 2, px: 2 }}>
                    {/* Center Header Box */}
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ bgcolor: '#2A2A96', color: 'white', p: 1, textAlign: 'center', minWidth: '300px' }}>
                            <Typography variant="h6" fontWeight="bold">
                                Colony Name: {colony.name || 'Jay Shiv'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                Property &nbsp;&nbsp;&nbsp; {plot.khasaraNumber ? `Khasara no ${plot.khasaraNumber}` : 'Khasara no 116'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Status Badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ color: '#333' }}>Status:</Typography>
                        <Box sx={{ bgcolor: 'red', color: 'white', px: 2, py: 0.5, fontWeight: 'bold' }}>
                            SOLD
                        </Box>
                    </Box>
                </Box>

                {/* Main Content Info */}
                <Box sx={{ px: 3, mb: 3 }}>
                    <Grid container spacing={4}>
                        {/* Left Column: Customer */}
                        <Grid item xs={7}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={3}>
                                    <Typography>Customer Name:</Typography>
                                </Grid>
                                {/* <Grid item xs={2}>
                                    <Typography>smt.</Typography>
                                </Grid> */}
                                <Grid item xs={7}>
                                    <BoxValue>{customer.name}</BoxValue>
                                </Grid>

                                <Grid item xs={3}>
                                    <Typography>{relationLabel}</Typography>
                                </Grid>
                                <Grid item xs={7}>
                                    <BoxValue>{relationName}</BoxValue>
                                </Grid>

                                <Grid item xs={4} sx={{ alignSelf: 'flex-start', pt: 1 }}>
                                    <Typography>Customer Address</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography sx={{ display: 'inline' }}>{address || 'Kishorpura, Agra'}</Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography>Mob: No.</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography>+{customer.phone || '916239278524'}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Right Column: Agent */}
                        <Grid item xs={5}>
                            <Grid container spacing={1} alignItems="center">
                                <Grid item xs={6} textAlign="right">
                                    <Typography>Agent Name</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <BoxValue>{agent.name || (booking.agent && booking.agent.name) || 'Direct'}</BoxValue>
                                </Grid>

                                <Grid item xs={6} textAlign="right">
                                    <Typography>Agent Code</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <BoxValue>{agent.userCode || (booking.agent && booking.agent.userCode) || 'AG-00007'}</BoxValue>
                                </Grid>

                                <Grid item xs={6} textAlign="right">
                                    <Typography>Commission Percentage</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <BoxValue>
                                        {(() => {
                                            const agentId = agent._id || (booking.agent && booking.agent._id);
                                            const commission = booking.commissions?.find(c => c.agent && (c.agent._id === agentId || c.agent === agentId));
                                            return commission ? `${commission.percentage}%` : (booking.commissionPercentage ? `${booking.commissionPercentage}%` : 'Not Set');
                                        })()}
                                    </BoxValue>
                                </Grid>

                                <Grid item xs={6} textAlign="right">
                                    <Typography>Commission Amount</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <BoxValue>
                                        {(() => {
                                            const agentId = agent._id || (booking.agent && booking.agent._id);
                                            const commission = booking.commissions?.find(c => c.agent && (c.agent._id === agentId || c.agent === agentId));
                                            const amount = commission ? commission.amount : booking.commissionAmount;
                                            return amount ? formatCurrency(amount) : 'Not Set';
                                        })()}
                                    </BoxValue>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Box>

                {/* Orange Pricing Header */}
                <Box sx={{ mx: 2 }}>
                    <Grid container sx={{ textAlign: 'center', mb: 1 }}>
                        <Grid item xs={4} sx={{ bgcolor: '#F47920', border: '1px solid #F47920', p: 0.5 }}>
                            <Typography fontWeight="bold" color="#000">PRICING INFORMATION</Typography>
                        </Grid>
                        <Grid item xs={4} sx={{ bgcolor: '#F47920', borderTop: '1px solid #F47920', borderBottom: '1px solid #F47920', p: 0.5 }}>
                            <Typography fontWeight="bold" color="#000">Total Area</Typography>
                        </Grid>
                        <Grid item xs={4} sx={{ bgcolor: '#F47920', border: '1px solid #F47920', p: 0.5 }}>
                            <Typography fontWeight="bold" color="#000">DIMENSIONS</Typography>
                        </Grid>
                    </Grid>

                    {/* Pricing Content */}
                    <Grid container spacing={2}>
                        {/* 1st Col: Pricing Details */}
                        <Grid item xs={4}>
                            <Grid container spacing={1} alignItems="center">
                                <Grid item xs={6}><Typography>Plot Number</Typography></Grid>
                                <Grid item xs={6}><BoxValue>{plot.plotNo || plot.plotNumber || ''}</BoxValue></Grid>

                                <Grid item xs={6}><Typography>Plot Type</Typography></Grid>
                                <Grid item xs={6}><BoxValue>{plot.type || 'Residential'}</BoxValue></Grid>

                                <Grid item xs={6}><Typography>Price Per Gaj</Typography></Grid>
                                <Grid item xs={6}><BoxValue>{formatCurrency(Math.round(Number(plot.finalPrice || plot.pricePerGaj || plot.ratePerGaj || 14000)))}</BoxValue></Grid>

                                <Grid item xs={6}><Typography>Price Per Sqft</Typography></Grid>
                                <Grid item xs={6}><BoxValue>{formatCurrency((Number(plot.finalPrice || plot.pricePerGaj || plot.ratePerGaj || 14000) / 9).toFixed(2))}</BoxValue></Grid>
                            </Grid>
                        </Grid>

                        {/* 2nd Col: Area Details */}
                        <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center', mt: 1 }}>
                                <Typography sx={{ fontSize: '1.1rem', mb: 2 }}>
                                    {areaGaj ? `${Number(areaGaj).toFixed(3)} Gaj` : '0 Gaj'} ({plot.area ? `${Number(plot.area).toFixed(2)} sqft` : (Number(areaGaj) * 9).toFixed(2) + ' sqft'})
                                </Typography>
                                <Typography sx={{ mb: 2 }}>
                                    {(toNumber(areaGaj) * 0.836127).toFixed(2)} mtr
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                                    <Typography>Total Price:</Typography>
                                    <BoxValue>{formatCurrency(displayTotalPrice).replace('₹ ', '₹ ')}</BoxValue>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <Typography>Facing</Typography>
                                    <BoxValue>{plot.facing || 'South'}</BoxValue>
                                </Box>
                            </Box>
                        </Grid>

                        {/* 3rd Col: Dimensions */}
                        <Grid item xs={4}>
                            <Grid container spacing={1} alignItems="center">
                                <Grid item xs={6} textAlign="right"><Typography>Front Side</Typography></Grid>
                                <Grid item xs={6}><BoxValue>{formatDimension(plot.sideMeasurements?.front || dimensions.length)}</BoxValue></Grid>

                                <Grid item xs={6} textAlign="right"><Typography>Back Side</Typography></Grid>
                                <Grid item xs={6}><BoxValue>{formatDimension(plot.sideMeasurements?.back || dimensions.length)}</BoxValue></Grid>

                                <Grid item xs={6} textAlign="right"><Typography>Left Side</Typography></Grid>
                                <Grid item xs={6}><BoxValue>{formatDimension(plot.sideMeasurements?.left || dimensions.width)}</BoxValue></Grid>

                                <Grid item xs={6} textAlign="right"><Typography>Right Side</Typography></Grid>
                                <Grid item xs={6}><BoxValue>{formatDimension(plot.sideMeasurements?.right || dimensions.width)}</BoxValue></Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Box>

                {/* Footer Advocate Bar */}
                <Box sx={{ bgcolor: '#2A2A96', color: 'white', p: 1, px: 2, mt: 4, mx: 2 }}>
                    <Typography fontWeight="bold">
                        Advocate Name: {booking.advocateName || 'Rajeev Lochan Joshi'}, Mob: {booking.advocateMobile || '9319582180'}, Code{booking.advocateCode || 'ADV-00001'}
                    </Typography>
                </Box>

                {/* Bottom Status */}
                <Box sx={{ mt: 2, px: 4, pb: 4 }}>
                    <Typography>
                        Registry Status {booking.registryStatus || 'Registry Completed'} dated {booking.registryDate ? format(new Date(booking.registryDate), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}
                    </Typography>
                </Box>

            </Paper>
        </Box>
    );
};

export default SoldPlotSlip;
