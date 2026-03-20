import { useState, useEffect } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Stack, Button, TextField, MenuItem, IconButton, useTheme, useMediaQuery,
  InputAdornment, Divider, Avatar
} from '@mui/material'
import { Visibility, RecordVoiceOver, FilterList, Search, LocationOn, Home, Layers, NotificationsActive, Wallet, Assessment, TrendingUp } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

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

const AgentProperties = () => {
  const [plots, setPlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterColony, setFilterColony] = useState('All')
  const [colonies, setColonies] = useState([])
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [plotsRes, coloniesRes] = await Promise.all([
        axios.get('/plots?limit=200'),
        axios.get('/colonies'),
      ])
      const ps = plotsRes.data?.data?.plots || plotsRes.data?.data || []
      const cs = coloniesRes.data?.data?.colonies || []
      setPlots(ps)
      setColonies(cs)
    } catch {
      toast.error('Failed to fetch properties')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  const filtered = plots.filter(p => filterColony === 'All' || p.colonyId?.name === filterColony)

  const stats = [
    { label: 'Total Units', val: plots.length, sub: 'Inventory', color: '#3b82f6', icon: <Layers fontSize="small" />, grad: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)" },
    { label: 'Available', val: plots.filter(p => p.status === 'available').length, sub: 'Ready', color: '#10b981', icon: <Home fontSize="small" />, grad: "linear-gradient(135deg, #10b981 0%, #34d399 100%)" },
    { label: 'Sold Units', val: plots.filter(p => p.status !== 'available').length, sub: 'Booked', color: '#f59e0b', icon: <Visibility fontSize="small" />, grad: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)" },
    { label: 'Society', val: colonies.length, sub: 'Total', color: '#1e293b', icon: <Assessment fontSize="small" />, grad: "linear-gradient(135deg, #1e293b 0%, #334155 100%)" },
  ]

  return (
    <Box sx={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Mobile Header */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -1 }}>
            Inventory
          </Typography>
          <IconButton sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
            <NotificationsActive sx={{ color: '#64748b' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Desktop Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
        <Box>
          <Typography variant="h3" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -1.5 }}>Inventory</Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>Live status of all plots across societies.</Typography>
        </Box>
        <Button variant="contained" sx={{ 
          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', 
          color: 'white', borderRadius: '16px', px: 3, py: 1.5,
          textTransform: 'none', fontWeight: 800,
          boxShadow: '0 8px 20px rgba(46, 125, 50, 0.2)'
        }} startIcon={<RecordVoiceOver />}>
          New Sale Entry
        </Button>
      </Stack>

      <Grid container spacing={isMobile ? 2 : 3} mb={5}>
        {stats.map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <ModernStatCard 
              label={s.label} 
              value={s.val} 
              subtext={s.sub}
              icon={s.icon} 
              gradient={s.grad} 
            />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: '28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 30px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        <Box sx={{ p: 4, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Search by plot number..."
              InputProps={{ 
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1.5, fontSize: 22 }} />,
                sx: { borderRadius: '16px', bgcolor: 'white' }
              }}
              sx={{ flex: 1 }}
            />
            <Stack direction="row" spacing={2}>
              <TextField select size="small" value={filterColony} onChange={e => setFilterColony(e.target.value)} sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'white' } }}>
                <MenuItem value="All">All Societies</MenuItem>
                {colonies.map(c => <MenuItem key={c._id} value={c.name}>{c.name}</MenuItem>)}
              </TextField>
              <IconButton sx={{ borderRadius: '14px', bgcolor: 'white', border: '1px solid #e2e8f0', p: 1.2 }}><FilterList /></IconButton>
            </Stack>
          </Stack>
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {['UNIT DETAILS', 'SOCIETY', 'DIMENSIONS', 'PRICING', 'STATUS', 'ACTIONS'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 800, color: '#64748b', py: 3, borderBottom: '2px solid #f1f5f9', fontSize: '0.75rem', letterSpacing: 1 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>No units found in the catalog.</TableCell></TableRow>
              ) : (
                filtered.map((p, i) => (
                  <TableRow key={p._id} hover sx={{ '&:last-child td': { border: 0 }, '&:hover td': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Typography fontWeight={900} color="#0f172a" fontSize="1rem">Plot #{p.plotNumber || p.plotNo}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>{p.facing || 'East'} Facing</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32' }}>
                          <LocationOn sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography fontWeight={800} color="#334155" fontSize="0.9rem">{p.colony?.name || p.colonyId?.name || 'Unknown Society'}</Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>{p.propertyId?.name || 'General Block'}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color="#1e293b">{p.area || 0} Sq. Ft</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{p.areaGaj || 0} Gaj Volume</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={900} color="#2e7d32" fontSize="1rem">₹{(p.totalPrice || 0).toLocaleString()}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>₹{p.rate || 0} Per/sqft</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={p.status?.toUpperCase()} 
                        size="small"
                        sx={{ 
                          fontWeight: 900, fontSize: '0.65rem',
                          bgcolor: p.status === 'available' ? '#dcfce7' : '#fee2e2',
                          color: p.status === 'available' ? '#15803d' : '#b91c1c',
                          borderRadius: '8px', px: 1
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" sx={{ borderRadius: '12px', bgcolor: '#f1f5f9', p: 1 }}><Visibility fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  )
}

export default AgentProperties
