import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Button,
  LinearProgress,
  Divider,
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  BarChart as BarChartIcon,
  Map as MapIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const StatCard = ({ title, value, trend, trendValue, icon, color, isMain }) => (
  <Card 
    sx={{ 
      borderRadius: 4, 
      border: '1px solid #f0f0f0', 
      boxShadow: 'none',
      bgcolor: isMain ? '#2E7D32' : '#fff',
      color: isMain ? '#fff' : 'inherit',
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" sx={{ opacity: isMain ? 0.8 : 0.6, fontWeight: 500, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
            {trend === 'up' ? (
              <TrendingUp sx={{ fontSize: 16, color: isMain ? '#fff' : '#2E7D32' }} />
            ) : trend === 'down' ? (
              <TrendingDown sx={{ fontSize: 16, color: isMain ? '#fff' : '#D32F2F' }} />
            ) : (
              <RefreshIcon sx={{ fontSize: 16, color: isMain ? '#fff' : '#666' }} />
            )}
            <Typography variant="caption" sx={{ color: isMain ? '#fff' : (trend === 'up' ? '#2E7D32' : trend === 'down' ? '#D32F2F' : '#666'), fontWeight: 600 }}>
              {trendValue}
            </Typography>
          </Stack>
        </Box>
        <Avatar 
          sx={{ 
            bgcolor: isMain ? 'rgba(255,255,255,0.2)' : `${color}15`, 
            color: isMain ? '#fff' : color,
            width: 42,
            height: 42
          }}
        >
          {icon}
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
)

const RecentActivityItem = ({ title, time, description, icon, color, isLast }) => (
  <Box sx={{ position: 'relative', pl: 4, pb: isLast ? 0 : 3 }}>
    {!isLast && (
      <Box 
        sx={{ 
          position: 'absolute', 
          left: 11, 
          top: 30, 
          bottom: 0, 
          width: 1, 
          bgcolor: '#f0f0f0' 
        }} 
      />
    )}
    <Box 
      sx={{ 
        position: 'absolute', 
        left: 0, 
        top: 4, 
        width: 24, 
        height: 24, 
        borderRadius: '50%', 
        bgcolor: `${color}15`, 
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1
      }}
    >
      {icon}
    </Box>
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        <Typography variant="caption" color="text.secondary">{time}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
        {description}
      </Typography>
    </Box>
  </Box>
)

const LawyerDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pending: 24, verified: 142, rejected: 12, total: 178 })
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/registry')
      if (data.success) {
        const registries = data.data || []
        
        // Calculate dynamic stats from real data
        const pending = registries.filter(r => r.status?.toLowerCase() === 'pending').length
        const verified = registries.filter(r => r.status?.toLowerCase() === 'completed').length
        const rejected = registries.filter(r => r.status?.toLowerCase() === 'rejected').length
        
        setStats({
          pending,
          verified,
          rejected,
          total: registries.length
        })
        
        setQueue(registries.slice(0, 5))
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  // Mock data for demo consistency with screenshots
  const mockQueue = [
    { id: '#PLT-9921', name: 'Robert Chambers', date: 'Oct 24, 2023', status: 'REVIEWING' },
    { id: '#PLT-8742', name: 'Sarah Jenkins', date: 'Oct 23, 2023', status: 'QUEUED' },
    { id: '#PLT-3312', name: 'Michael Vane', date: 'Oct 22, 2023', status: 'FLAGGED' },
    { id: '#PLT-1029', name: 'Legal Dept (Corp)', date: 'Oct 21, 2023', status: 'QUEUED' },
  ]

  const mockActivities = [
    { title: 'Plot #PLT-4402 Verified', time: '2 hours ago', description: 'Ownership documents cross-checked with registry office.', color: '#2E7D32', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
    { title: 'New Document Uploaded', time: '5 hours ago', description: 'Sarah Jenkins uploaded "Survey_Map_2023.pdf" for review.', color: '#1976D2', icon: <AssignmentIcon sx={{ fontSize: 14 }} /> },
    { title: 'Verification Rejected', time: 'Yesterday', description: 'Plot #PLT-1120 failed compliance check: Missing stamp.', color: '#D32F2F', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
    { title: 'New Client Onboarding', time: 'Yesterday', description: 'Michael Vane added a new plot entry for legal review.', color: '#ED6C02', icon: <AssignmentIcon sx={{ fontSize: 14 }} /> },
  ]

  const getStatusChip = (status) => {
    const configs = {
      'reviewing': { color: '#ED6C02', bg: '#FFF4E5', label: 'REVIEWING' },
      'queued': { color: '#1976D2', bg: '#E3F2FD', label: 'QUEUED' },
      'flagged': { color: '#D32F2F', bg: '#FFEBEE', label: 'FLAGGED' },
      'verified': { color: '#2E7D32', bg: '#E8F5E9', label: 'VERIFIED' },
      'pending': { color: '#ED6C02', bg: '#FFF4E5', label: 'PENDING' },
      'completed': { color: '#2E7D32', bg: '#E8F5E9', label: 'VERIFIED' },
      'sold': { color: '#1976D2', bg: '#E3F2FD', label: 'SOLD' },
    }
    const config = configs[status?.toLowerCase()] || configs['queued']
    return (
      <Chip 
        label={config.label} 
        size="small" 
        sx={{ 
          bgcolor: config.bg, 
          color: config.color, 
          fontWeight: 700, 
          fontSize: '0.65rem',
          borderRadius: 1
        }} 
      />
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Advocate Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back, Advocate. Here is the current status of your plot legal verifications.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pending" 
            value={stats.pending} 
            trend="up" 
            trendValue="+5% from last week" 
            icon={<AssignmentIcon />} 
            color="#ED6C02" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Verified" 
            value={stats.verified} 
            trend="down" 
            trendValue="-2% from last week" 
            icon={<CheckCircleIcon />} 
            color="#2E7D32" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Rejected" 
            value={stats.rejected} 
            trend="stable" 
            trendValue="Stable since yesterday" 
            icon={<CancelIcon />} 
            color="#D32F2F" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Plots" 
            value={stats.total} 
            trend="up" 
            trendValue="+3% overall growth" 
            icon={<MapIcon />} 
            color="#2E7D32" 
            isMain 
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Verification Queue */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 4, border: '1px solid #f0f0f0', boxShadow: 'none' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>Verification Queue</Typography>
              <Button size="small" sx={{ textTransform: 'none', fontWeight: 600, color: '#2E7D32' }}>View All</Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#F8F9FA' }}>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#5F6368' }}>PLOT ID</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#5F6368' }}>CLIENT NAME</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#5F6368' }}>SUBMITTED</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#5F6368' }}>STATUS</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#5F6368' }} align="right">ACTION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(queue.length > 0 ? queue : mockQueue).map((row, idx) => (
                    <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.bookingNumber || row.id}</TableCell>
                      <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem' }}>{row.buyer?.name || row.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{row.bookingDate ? format(new Date(row.bookingDate), 'MMM dd, yyyy') : (row.date || 'Recently')}</TableCell>
                      <TableCell>{getStatusChip(row.status)}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => navigate('/lawyer/registry')}>
                          <VisibilityIcon sx={{ fontSize: 18, color: '#2E7D32' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Banner */}
          <Card 
            sx={{ 
              mt: 3, 
              borderRadius: 4, 
              bgcolor: '#F5F9F6', 
              border: '1px dashed #A5D6A7', 
              boxShadow: 'none',
              p: 2
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#2E7D32', width: 42, height: 42 }}>
                <MapIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>Interactive Plot Mapping</Typography>
                <Typography variant="caption" color="text.secondary">View real-time legal status across all registered plots.</Typography>
              </Box>
              <Button 
                variant="contained" 
                size="small" 
                sx={{ 
                  bgcolor: '#2E7D32', 
                  '&:hover': { bgcolor: '#1B5E20' },
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                Open Map View
              </Button>
            </Stack>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 4, border: '1px solid #f0f0f0', boxShadow: 'none', height: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>Recent Activity</Typography>
              <IconButton size="small"><RefreshIcon sx={{ fontSize: 18 }} /></IconButton>
            </Box>
            <Box sx={{ px: 3, pb: 2 }}>
              {mockActivities.map((activity, idx) => (
                <RecentActivityItem 
                  key={idx}
                  {...activity}
                  isLast={idx === mockActivities.length - 1}
                />
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default LawyerDashboard
