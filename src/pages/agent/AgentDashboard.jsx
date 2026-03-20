import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Grid, Card, CardContent, Chip, CircularProgress,
  Stack, Avatar, Divider, Button, useTheme, useMediaQuery, Tooltip, IconButton
} from '@mui/material'
import {
  NavigateNext, AccountBalanceWallet, Home, Add, Receipt, TrendingDown, Description, 
  Wallet, PersonOutline, LocalOffer, Assessment, CheckCircle, NotificationsActive, Event, TrendingUp, People
} from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const ModernStatCard = ({ label, value, change, icon, color, positive, gradient, subtext }) => {
  const isSmall = useMediaQuery('(max-width:600px)');
  
  return (
    <Card sx={{
      borderRadius: isSmall ? '20px' : '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      border: '1px solid #f1f5f9',
      transition: 'all 0.3s ease',
      height: '100%',
      background: gradient || 'white',
      color: gradient ? 'white' : 'inherit',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.06)' }
    }}>
      <CardContent sx={{ p: isSmall ? 2 : 3 }}>
        <Stack spacing={isSmall ? 1 : 2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" 
              sx={{ 
                fontWeight: 700, 
                opacity: gradient ? 0.9 : 0.6,
                textTransform: 'none',
                fontSize: isSmall ? '0.7rem' : '0.8rem'
              }}>
              {label}
            </Typography>
            <Box sx={{ 
              p: 0.8, 
              borderRadius: '12px', 
              bgcolor: gradient ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.04)',
              display: 'flex'
            }}>
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

const QuickAction = ({ icon, label, color, onClick }) => (
  <Stack spacing={1} alignItems="center" sx={{ cursor: 'pointer', flex: 1 }} onClick={onClick}>
    <Box sx={{ 
      width: 56, height: 56, 
      borderRadius: '20px', 
      bgcolor: `${color}15`, 
      color: color,
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      transition: 'all 0.2s',
      '&:hover': { transform: 'scale(1.1)', bgcolor: `${color}25` }
    }}>
      {icon}
    </Box>
    <Typography variant="caption" fontWeight={700} color="#334155">{label}</Typography>
  </Stack>
)

const MonthBar = ({ month, percent, active }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, flex: 1 }}>
    <Box sx={{ height: 160, width: '100%', maxWidth: 36, display: 'flex', alignItems: 'flex-end', borderRadius: '14px', overflow: 'hidden', bgcolor: '#f1f5f9' }}>
      <Tooltip title={`${percent}% Capacity`}>
        <Box sx={{
          width: '100%', height: `${percent}%`,
          background: active ? 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)' : '#cbd5e1',
          borderRadius: '14px',
          boxShadow: active ? '0 4px 15px rgba(34, 197, 94, 0.4)' : 'none',
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }} />
      </Tooltip>
    </Box>
    <Typography variant="caption" fontWeight={active ? 800 : 600} color={active ? '#1b5e20' : 'text.secondary'}>
      {month}
    </Typography>
  </Box>
)

const AgentDashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalSales: 0, commissionsEarned: 0, pendingPayouts: 0, activeCustomers: 0 })
  const [properties, setProperties] = useState([])
  const [recentDeals, setRecentDeals] = useState([])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [bookingsRes, propertiesRes, coloniesRes] = await Promise.all([
        axios.get('/bookings').catch(() => ({ data: { data: [] } })),
        axios.get('/properties').catch(() => ({ data: { data: { properties: [] } } })),
        axios.get('/colonies').catch(() => ({ data: { data: { colonies: [] } } }))
      ])

      const bookings = Array.isArray(bookingsRes.data?.data) ? bookingsRes.data.data : bookingsRes.data?.data?.bookings || []
      const propertiesData = Array.isArray(propertiesRes.data?.data?.properties) ? propertiesRes.data.data.properties : Array.isArray(propertiesRes.data?.data) ? propertiesRes.data.data : []
      const coloniesData = Array.isArray(coloniesRes.data?.data?.colonies) ? coloniesRes.data.data.colonies : Array.isArray(coloniesRes.data?.data) ? coloniesRes.data.data : []

      const totalSales = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      const pendingBookings = bookings.filter(b => b.status === 'pending').length
      
      const today = new Date().toDateString()
      const todayCollection = bookings
        .filter(b => new Date(b.createdAt).toDateString() === today)
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0)

      setStats({
        totalSales,
        commissionsEarned: totalSales * 0.05, 
        pendingPayouts: totalSales * 0.01,
        activeCustomers: bookings.length,
        colonyCount: coloniesData.length,
        pendingBookings,
        todayCollection
      })
      setProperties(propertiesData.slice(0, 4)) // Using properties from Admin Panel

      // Process recent deals from bookings
      const recent = bookings.slice(0, 3).map(b => ({
        title: 'Booking Confirmed',
        desc: `Plot ${b.plot?.plotNo || 'N/A'} booked by ${b.customer?.name || 'Client'}`,
        time: new Date(b.createdAt).toLocaleDateString(),
        icon: <CheckCircle sx={{ color: '#22c55e' }} />,
        dot: '#22c55e'
      }))
      setRecentDeals(recent)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  return (
    <Box sx={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Namaste Header (Mobile Only) */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar 
              sx={{ 
                width: 54, height: 54, 
                bgcolor: '#ef4444', 
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                border: '2px solid white' 
              }}
            >
              <PersonOutline sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -0.5 }}>
                Namaste, {user?.name?.split(' ')[0]} 👋
              </Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                Authorized Agent
              </Typography>
            </Box>
          </Stack>
          <IconButton sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
            <NotificationsActive sx={{ color: '#64748b' }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Overview Desktop */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
        <Box>
          <Typography variant="h3" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -1.5, mb: 0.5 }}>Overview</Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>Welcome back, <strong>{user?.name}</strong>.</Typography>
        </Box>
        <Button variant="contained" sx={{
          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
          color: 'white', borderRadius: '16px', px: 4, py: 1.8,
          textTransform: 'none', fontWeight: 800, fontSize: '0.95rem',
          boxShadow: '0 10px 25px rgba(46, 125, 50, 0.3)',
          '&:hover': { background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', transform: 'scale(1.02)' }
        }} startIcon={<Event />}>
          Schedule Meeting
        </Button>
      </Stack>

      {/* Stats 2x2 Grid on Mobile */}
      <Grid container spacing={isSmall ? 2 : 3} mb={isSmall ? 4 : 5}>
        <Grid item xs={6} md={3}>
          <ModernStatCard
            label="Total Sales"
            value={`₹${(stats.totalSales / 100000).toFixed(1)}L`}
            subtext="Overall Performance"
            icon={<Wallet sx={{ fontSize: 24 }} />}
            gradient="linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <ModernStatCard
            label="Commissions"
            value={`₹${(stats.commissionsEarned / 1000).toFixed(1)}K`}
            subtext={`${stats.pendingBookings} leads pending`}
            icon={<Event sx={{ fontSize: 24 }} />}
            gradient="linear-gradient(135deg, #f97316 0%, #fb923c 100%)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <ModernStatCard
            label="Outstanding"
            value={`₹${(stats.pendingPayouts / 1000).toFixed(1)}K`}
            subtext={`Across ${stats.colonyCount} colonies`}
            icon={<TrendingUp sx={{ fontSize: 24 }} />}
            gradient="linear-gradient(135deg, #1e293b 0%, #334155 100%)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <ModernStatCard
            label="Client Base"
            value={stats.activeCustomers}
            subtext="Active Directory"
            icon={<NotificationsActive sx={{ fontSize: 24 }} />}
            gradient="linear-gradient(135deg, #ef4444 0%, #f87171 100%)"
          />
        </Grid>
      </Grid>

      {/* Quick Actions (Mobile Reference) */}
      <Box mb={isSmall ? 4 : 5}>
        <Typography variant="h6" fontWeight={800} color="#1e293b" mb={3}>Quick Actions</Typography>
        <Stack direction="row" spacing={isSmall ? 2 : 4} justifyContent="space-between">
          <QuickAction icon={<PersonOutline />} label="Add Cust." color="#6366f1" onClick={() => navigate('/agent/customers')} />
          <QuickAction icon={<Add />} label="New Deal" color="#f59e0b" onClick={() => navigate('/agent/properties')} />
          <QuickAction icon={<Receipt />} label="Collect" color="#10b981" onClick={() => navigate('/agent/commissions')} />
          <QuickAction icon={<Assessment />} label="Reports" color="#3b82f6" onClick={() => navigate('/agent/commissions')} />
        </Stack>
      </Box>

      {/* Progress Card (Mobile Reference) */}
      <Card sx={{ 
        borderRadius: '24px', 
        mb: 5, 
        border: '1px solid #f1f5f9', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        overflow: 'hidden' 
      }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={800} color="#1e293b">Today's Collection</Typography>
            <Typography variant="caption" fontWeight={700} color="text.secondary">17 Mar</Typography>
          </Stack>
          
          <Stack direction="row" spacing={0.5} alignItems="baseline" mb={2}>
            <Typography variant="h4" fontWeight={900} color="#10b981">₹{(stats.todayCollection / 1000).toFixed(1)}K</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>/ ₹50K Target</Typography>
          </Stack>
          
          <Box sx={{ height: 8, bgcolor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', mb: 1.5 }}>
            <Box sx={{ 
              width: `${Math.min((stats.todayCollection / 50000) * 100, 100)}%`, 
              height: '100%', 
              bgcolor: '#10b981', 
              borderRadius: 4,
              transition: 'width 1s ease-in-out'
            }} />
          </Box>
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            {((stats.todayCollection / 50000) * 100).toFixed(0)}% of daily target reached
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={4} mb={5}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: '28px', p: 1, border: '1px solid #f1f5f9', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={6}>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">Performance Analytics</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Monthly sales volume trends</Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                  <Chip label="Income" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#15803d', fontWeight: 800, px: 1 }} />
                  <Chip label="Target" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 800, px: 1 }} />
                </Stack>
              </Stack>
              <Stack direction="row" spacing={isSmall ? 1 : 4} sx={{ height: isSmall ? 160 : 220, alignItems: 'flex-end', px: 2 }}>
                {[
                  { m: 'Jan', p: 45 }, { m: 'Feb', p: 65 }, { m: 'Mar', p: 35 },
                  { m: 'Apr', p: 85 }, { m: 'May', p: 55 }, { m: 'Jun', p: 95, active: true },
                  { m: 'Jul', p: 40 }, { m: 'Aug', p: 75 }
                ].slice(isSmall ? -5 : 0).map(d => <MonthBar key={d.m} month={d.m} percent={d.p} active={d.active} />)}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: '28px', height: '100%', border: '1px solid #f1f5f9', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={800} mb={4} color="#0f172a">Recent Deal Journal</Typography>
              <Stack spacing={4}>
                {recentDeals.length > 0 ? recentDeals.map((item, idx) => (
                  <Stack key={idx} direction="row" spacing={2.5} alignItems="flex-start">
                    <Box sx={{
                      p: 1.2, borderRadius: '14px', bgcolor: `${item.dot}12`,
                      display: 'flex', border: `1px solid ${item.dot}20`
                    }}>
                      {item.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={800} color="#334155">{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={500} display="block">{item.desc}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>{item.time}</Typography>
                  </Stack>
                )) : (
                  <Typography variant="body2" color="text.secondary" align="center" py={3}>No recent deals found.</Typography>
                )}
              </Stack>
              <Button fullWidth sx={{
                mt: 5, textTransform: 'none', fontWeight: 800, color: '#2e7d32',
                bgcolor: 'rgba(46, 125, 50, 0.05)', borderRadius: '14px', py: 1.2,
                '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.1)' }
              }} endIcon={<NavigateNext />}>
                Full Activity History
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={900} color="#0f172a">Featured Properties</Typography>
        <Button size="small" sx={{ fontWeight: 800, color: '#2e7d32', textTransform: 'none' }} onClick={() => navigate('/agent/properties')}>Explore All</Button>
      </Box>

      <Grid container spacing={3}>
        {properties.map((p, idx) => {
          const mainImage = p.media?.mainPicture || p.media?.moreImages?.[0];
          
          return (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid #f1f5f9',
              boxShadow: '0 4px 25px rgba(0,0,0,0.03)',
              '&:hover': { transform: 'translateY(-5px)' },
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <Box sx={{ height: 180, bgcolor: '#f8fafc', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {mainImage && (
                  <Box
                    component="img"
                    src={mainImage.startsWith('http') 
                      ? mainImage 
                      : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${mainImage.startsWith('/') ? '' : '/'}${mainImage}`}
                    alt={p.name}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                )}
                <Home sx={{ fontSize: 60, color: 'rgba(46, 125, 50, 0.1)', display: mainImage ? 'none' : 'block', position: 'relative', zIndex: 1 }} />
                <Box sx={{
                  position: 'absolute', top: 16, left: 16, px: 2, py: 0.8,
                  borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(8px)', boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', gap: 1, zIndex: 2
                }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e' }} />
                  <Typography variant="caption" fontWeight={900} color="#15803d" sx={{ letterSpacing: 0.5 }}>
                    {p.status ? p.status.toUpperCase() : 'ACTIVE'}
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={900} color="#1e293b" noWrap>{p.name || 'Unknown Property'}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2} fontWeight={600}>
                  {p.city?.name || 'Local'} • {p.totalLandAreaGaj ? `${Number(p.totalLandAreaGaj)} Gaj` : 'Area TBD'}
                </Typography>

                <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">STARTING AT</Typography>
                    <Typography variant="h6" fontWeight={900} color="#2e7d32">{p.basePricePerGaj ? `₹${Number(p.basePricePerGaj * (p.totalLandAreaGaj || 1)).toLocaleString()}` : 'N/A'}</Typography>
                  </Box>
                  <IconButton sx={{ bgcolor: '#f1f5f9', color: '#2e7d32', borderRadius: '12px' }}>
                    <NavigateNext />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )})}
      </Grid>
    </Box>
  )
}

export default AgentDashboard
