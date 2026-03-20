import { useState, useEffect } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress,
  Stack, Button, TextField, MenuItem, IconButton, useTheme, useMediaQuery, Avatar
} from '@mui/material'
import { 
  TrendingUp, HourglassEmpty, Payment, GetApp, FilterList, Search, 
  AccountBalance, Wallet, LocalOffer, Assessment, NotificationsActive, PersonOutline
} from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { deriveCommissionsFromBookings } from '@/utils/commissionUtils'

const ModernStatCard = ({ label, value, subtext, icon, gradient }) => {
  const isSmall = useMediaQuery('(max-width:600px)');
  return (
    <Card sx={{ 
      borderRadius: isSmall ? '20px' : '24px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
      border: '1px solid #f1f5f9',
      height: '100%',
      background: gradient,
      color: 'white',
      '&:hover': { transform: 'translateY(-4px)' }
    }}>
      <CardContent sx={{ p: isSmall ? 2 : 3 }}>
        <Stack spacing={isSmall ? 1 : 2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, textTransform: 'none', fontSize: isSmall ? '0.7rem' : '0.8rem' }}>
              {label}
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex' }}>
              {icon}
            </Box>
          </Stack>
          <Box>
            <Typography variant={isSmall ? "h5" : "h4"} fontWeight={900} sx={{ letterSpacing: -0.5 }}>
              {value}
            </Typography>
            {subtext && (
              <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block', fontWeight: 500 }}>
                {subtext}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

const AgentCommissions = () => {
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterProperty, setFilterProperty] = useState('All Properties')
  const [stats, setStats] = useState({ total: 0, pending: 0, monthly: 0 })
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => { fetchCommissions() }, [])

  const fetchCommissions = async () => {
    try {
      const { data } = await axios.get('/bookings')
      const bookings = Array.isArray(data?.data) ? data.data : data?.data?.bookings || []
      const comms = deriveCommissionsFromBookings(bookings)
      setCommissions(comms)
      setStats({
        total: comms.reduce((s, c) => s + (c.finalAmount || 0), 0),
        pending: comms.filter(c => c.status === 'pending').reduce((s, c) => s + (c.finalAmount || 0), 0),
        monthly: comms.filter(c => { const d = new Date(c.createdAt); return d.getMonth() === new Date().getMonth() }).reduce((s, c) => s + (c.finalAmount || 0), 0),
      })
    } catch {
      toast.error('Failed to fetch commissions')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  return (
    <Box sx={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Mobile Header */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -1 }}>
            Earnings
          </Typography>
          <IconButton sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
            <NotificationsActive sx={{ color: '#64748b' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Desktop Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
        <Box>
          <Typography variant="h3" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -1.5 }}>Earnings</Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>Track your commissions and payout history.</Typography>
        </Box>
        <Button variant="contained" sx={{ 
          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', 
          color: 'white', borderRadius: '16px', px: 3, py: 1.5,
          textTransform: 'none', fontWeight: 800,
          boxShadow: '0 8px 20px rgba(46, 125, 50, 0.2)'
        }} startIcon={<GetApp />}>
          Export Report
        </Button>
      </Stack>

      <Grid container spacing={isMobile ? 2 : 3} mb={5}>
        <Grid item xs={6} md={4}>
          <ModernStatCard 
            label="Total Balance" 
            value={`₹${(stats.total / 100000).toFixed(2)}L`} 
            subtext="Life-time"
            icon={<Wallet sx={{ fontSize: 24 }} />} 
            gradient="linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)" 
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <ModernStatCard 
            label="In Clearance" 
            value={`₹${(stats.pending / 1000).toFixed(1)}K`} 
            subtext="Pending"
            icon={<HourglassEmpty sx={{ fontSize: 24 }} />} 
            gradient="linear-gradient(135deg, #f97316 0%, #fb923c 100%)" 
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <ModernStatCard 
            label="This Month" 
            value={`₹${(stats.monthly / 1000).toFixed(1)}K`} 
            subtext="Active"
            icon={<Payment sx={{ fontSize: 24 }} />} 
            gradient="linear-gradient(135deg, #1e293b 0%, #334155 100%)" 
          />
        </Grid>
        <Grid item xs={6} md={4} sx={{ display: { xs: 'block', md: 'none' } }}>
          <ModernStatCard 
            label="Client List" 
            value={commissions.length} 
            subtext="Total Deals"
            icon={<PersonOutline sx={{ fontSize: 24 }} />} 
            gradient="linear-gradient(135deg, #ef4444 0%, #f87171 100%)" 
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: '28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 30px rgba(0,0,0,0.02)', mb: 4, overflow: 'hidden' }}>
        <Box sx={{ p: 4, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by deal or client..."
              InputProps={{ 
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1.5, fontSize: 22 }} />,
                sx: { borderRadius: '16px', bgcolor: 'white' }
              }}
              sx={{ flex: 1 }}
            />
            <Stack direction="row" spacing={2}>
              <TextField select size="small" value={filterProperty} onChange={e => setFilterProperty(e.target.value)} sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'white' } }}>
                <MenuItem value="All Properties">All Properties</MenuItem>
              </TextField>
              <IconButton sx={{ borderRadius: '14px', bgcolor: 'white', border: '1px solid #e2e8f0', p: 1.2 }}><FilterList /></IconButton>
            </Stack>
          </Stack>
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {['REFERENCE', 'CLIENT', 'PROPERTY', 'SALE VALUE', 'COMMISSION', 'STATUS'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 800, color: '#64748b', py: 3, borderBottom: '2px solid #f1f5f9', fontSize: '0.75rem', letterSpacing: 1 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {commissions.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>No commission records found.</TableCell></TableRow>
              ) : (
                commissions.map((c, i) => (
                  <TableRow key={i} hover sx={{ '&:last-child td': { border: 0 }, '&:hover td': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Typography fontWeight={900} color="#0f172a" fontSize="0.9rem">#DL-{String(i + 2045).padStart(4, '0')}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{new Date(c.createdAt || Date.now()).toLocaleDateString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32', fontSize: '0.9rem', fontWeight: 800, border: '2px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                          {c.customerName?.charAt(0) || 'U'}
                        </Avatar>
                        <Typography fontWeight={800} color="#334155" fontSize="0.9rem">{c.customerName || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color="#1e293b">{c.colonyName || c.colony?.name || 'Unknown Society'}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{c.propertyName || 'General Block'} • {c.bookingNumber || c.plotNumber || 'Unknown'}</Typography>
                    </TableCell>
                    <TableCell fontWeight={900} color="#1e293b">₹{(c.saleAmount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography fontWeight={900} color="#2e7d32" fontSize="1rem">₹{(c.finalAmount || 0).toLocaleString()}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Earned @ {c.commissionRate}%</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={c.status?.toUpperCase() || 'PAID'} 
                        size="small" 
                        sx={{ 
                          fontWeight: 900, fontSize: '0.65rem',
                          bgcolor: c.status === 'paid' ? '#dcfce7' : '#fef3c7',
                          color: c.status === 'paid' ? '#15803d' : '#92400e',
                          borderRadius: '8px', px: 1
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      
      <Box sx={{ p: 3, bgcolor: '#f1f5f9', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: '16px' }}>
          <AccountBalance sx={{ color: '#2e7d32' }} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={800} color="#0f172a">Bank Payout Info</Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>All commissions are settled on the 1st of every month.</Typography>
        </Box>
        <Button size="small" sx={{ ml: 'auto', fontWeight: 800, color: '#2e7d32', textTransform: 'none' }}>Update Bank Details</Button>
      </Box>
    </Box>
  )
}

export default AgentCommissions
