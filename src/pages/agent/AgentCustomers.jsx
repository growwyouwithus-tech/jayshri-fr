import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Stack, Button, TextField, Avatar, InputAdornment, IconButton, Pagination,
  useTheme, useMediaQuery, Grid
} from '@mui/material'
import { PersonAdd, Search, Tune, MoreVert, Phone, Email, VerifiedUser, Group, NotificationsActive, Wallet, Assessment, TrendingUp } from '@mui/icons-material'
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

const AgentCustomers = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get('/customers')
      setCustomers(data.data || [])
    } catch {
      toast.error('Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  const filtered = customers.filter(c => 
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: 'Total Base', val: customers.length, sub: 'Prospects', grad: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)", icon: <Group fontSize="small" /> },
    { label: 'Active Buyers', val: customers.filter(c => (c.totalPurchases || 0) > 0).length, sub: 'Verified', grad: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", icon: <VerifiedUser fontSize="small" /> },
    { label: 'New Leads', val: customers.filter(c => !(c.totalPurchases || 0)).length, sub: 'Negotiating', grad: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)", icon: <Search fontSize="small" /> },
    { label: 'Registry', val: 0, sub: 'In Process', grad: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", icon: <Assessment fontSize="small" /> },
  ]

  return (
    <Box sx={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Mobile Header */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -1 }}>
            Clients
          </Typography>
          <IconButton sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
            <NotificationsActive sx={{ color: '#64748b' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Desktop Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
        <Box>
          <Typography variant="h3" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -1.5 }}>Clients</Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>Manage your directory of prospects and buyers.</Typography>
        </Box>
        <Button variant="contained" sx={{ 
          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', 
          color: 'white', borderRadius: '16px', px: 3, py: 1.5,
          textTransform: 'none', fontWeight: 800,
          boxShadow: '0 8px 20px rgba(46, 125, 50, 0.2)'
        }} startIcon={<PersonAdd />}>
          Register Client
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
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              placeholder="Search by client name, mobile, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{ 
                startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary', mr: 1, fontSize: 22 }} /></InputAdornment>,
                sx: { borderRadius: '16px', bgcolor: 'white' }
              }}
              sx={{ flex: 1 }}
            />
            <IconButton sx={{ borderRadius: '14px', bgcolor: 'white', border: '1px solid #e2e8f0', p: 1.2 }}><Tune /></IconButton>
          </Stack>
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {['CLIENT IDENTITY', 'CONTACT INFORMATION', 'OWNERSHIP', 'KYC STATUS', 'ACTIONS'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 800, color: '#64748b', py: 3, borderBottom: '2px solid #f1f5f9', fontSize: '0.75rem', letterSpacing: 1 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>No clients found in your directory.</TableCell></TableRow>
              ) : (
                filtered.map((c, i) => (
                  <TableRow key={c._id || i} hover sx={{ '&:last-child td': { border: 0 }, '&:hover td': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Stack direction="row" spacing={2.5} alignItems="center">
                        <Avatar sx={{ 
                          width: 48, height: 48, borderRadius: '16px',
                          background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 80%) 0%, hsl(${i * 60}, 70%, 90%) 100%)`, 
                          color: `hsl(${i * 60}, 70%, 30%)`,
                          fontWeight: 900, fontSize: '1.2rem',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                          border: '2px solid white'
                        }}>
                          {c.name?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={900} color="#0f172a" fontSize="1rem">{c.name}</Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>Member Since {new Date(c.createdAt || Date.now()).getFullYear()}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ p: 0.5, bgcolor: '#f1f5f9', borderRadius: '6px', display: 'flex' }}><Phone sx={{ fontSize: 13, color: '#64748b' }} /></Box>
                          <Typography variant="body2" fontWeight={800} color="#334155">{c.phone || 'N/A'}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ p: 0.5, bgcolor: '#f1f5f9', borderRadius: '6px', display: 'flex' }}><Email sx={{ fontSize: 13, color: '#64748b' }} /></Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>{c.email || 'N/A'}</Typography>
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={900} color="#0f172a" fontSize="1rem">{c.totalPurchases || 0}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Plots Owned</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={c.kycStatus === 'verified' ? 'VERIFIED' : 'PENDING'} 
                        size="small"
                        sx={{ 
                          fontWeight: 900, fontSize: '0.65rem',
                          bgcolor: c.kycStatus === 'verified' ? '#dcfce7' : '#fef3c7',
                          color: c.kycStatus === 'verified' ? '#15803d' : '#92400e',
                          borderRadius: '8px', px: 1
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}><MoreVert fontSize="small" /></IconButton>
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

export default AgentCustomers
