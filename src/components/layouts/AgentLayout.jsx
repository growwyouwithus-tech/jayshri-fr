import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Divider,
  Stack,
  Drawer,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
  Button,
  Tooltip,
  Paper
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  TrendingUp,
  Home,
  People,
  Settings,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout,
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  NotificationsNone
} from '@mui/icons-material'
import { BottomNavigation, BottomNavigationAction } from '@mui/material'
import { logout } from '@/store/slices/authSlice'
import toast from 'react-hot-toast'

const DRAWER_WIDTH = 260

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/agent/dashboard' },
  { text: 'My Commissions', icon: <TrendingUp />, path: '/agent/commissions' },
  { text: 'My Properties', icon: <Home />, path: '/agent/properties' },
  { text: 'My Customers', icon: <People />, path: '/agent/customers' },
  { text: 'My Profile', icon: <AccountCircle />, path: '/agent/profile' },
]

const AgentLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch {
      toast.error('Logout failed')
    }
  }

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 100%)', // Rich Green Gradient
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background element */}
      <Box sx={{ 
        position: 'absolute', top: '-10%', right: '-10%', 
        width: '150px', height: '150px', 
        borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
        filter: 'blur(30px)'
      }} />

      {/* Brand Section */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
        <Box sx={{ 
          width: 42, height: 42, bgcolor: 'white', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h6" fontWeight={900} color="#2e7d32">JP</Typography>
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} color="white" letterSpacing={-0.5} sx={{ lineHeight: 1.1 }}>
            Jayshri
          </Typography>
          <Typography variant="caption" fontWeight={600} color="rgba(255,255,255,0.7)" sx={{ letterSpacing: 1 }}>
            PROPERTIES
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, px: 2, position: 'relative' }}>
        <List sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path)
                    if (isMobile) setMobileOpen(false)
                  }}
                  sx={{
                    borderRadius: '0px',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.8)',
                    bgcolor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    py: 1.5,
                    px: 2,
                    border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: '#fff'
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: 'inherit',
                    minWidth: 40,
                    '& svg': { fontSize: 24 }
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem', 
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: 0.2
                    }} 
                  />
                  {isActive && <Box sx={{ width: 4, height: 20, bgcolor: 'white', borderRadius: 4 }} />}
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>

      {/* User Info Bottom */}
      <Box sx={{ 
        p: 2, m: 2, 
        bgcolor: 'rgba(255,255,255,0.1)', 
        borderRadius: '0px', 
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
        position: 'relative'
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ 
            width: 36, height: 36, 
            bgcolor: 'white', color: '#2e7d32',
            fontWeight: 800, fontSize: '1rem',
            border: '2px solid rgba(255,255,255,0.3)' 
          }}>
            {user?.name?.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={700} color="white" noWrap>{user?.name}</Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.6)" display="block" sx={{ fontSize: '0.7rem' }}>Authorized Agent</Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton size="small" onClick={handleLogout} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#ff8a80', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#ffffff', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
        {/* Sidebar for Desktop */}
        <Box component="nav" sx={{ width: { md: isSidebarOpen ? DRAWER_WIDTH : 0 }, flexShrink: { md: 0 }, transition: 'width 0.3s ease' }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'block', md: 'none' },
              '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' }
            }}
          >
            {drawerContent}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { 
                width: isSidebarOpen ? DRAWER_WIDTH : 0, 
                border: 'none',
                transition: 'width 0.3s ease',
                overflowX: 'hidden'
              }
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Main Container */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
          {/* Header App Bar */}
          <AppBar position="sticky" elevation={0} sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.9)', 
            backdropFilter: 'blur(20px)',
            borderBottom: isMobile && location.pathname === '/agent/dashboard' ? 'none' : '1px solid #f1f5f9',
            color: '#1e293b',
            zIndex: theme.zIndex.drawer + 1,
            display: isMobile && location.pathname === '/agent/dashboard' ? 'none' : 'block'
          }}>
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton 
                  edge="start" 
                  color="inherit" 
                  onClick={isMobile ? handleDrawerToggle : toggleSidebar} 
                  sx={{ 
                    bgcolor: '#f1f5f9', 
                    borderRadius: '12px',
                    display: { xs: 'none', md: 'flex' } // Hide hamburger on mobile as we use bottom nav
                  }}
                >
                  {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
                </IconButton>
                
                {/* Mobile Logo Center */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 32, height: 32, bgcolor: '#2e7d32', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(46, 125, 50, 0.2)'
                  }}>
                    <Typography variant="body2" fontWeight={900} color="white">JP</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={800} color="#0f172a" letterSpacing={-0.5}>
                    Jayshri
                  </Typography>
                </Box>

                <Typography variant="h6" fontWeight={800} sx={{ display: { xs: 'none', md: 'block' }, color: '#0f172a', ml: 1 }}>
                  {navItems.find(item => location.pathname.startsWith(item.path))?.text || 'Agent Portal'}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ 
                  bgcolor: '#f8fafc', px: 1.5, py: 0.5, borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center', gap: 1
                }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', animation: 'pulse 2s infinite' }} />
                  <Typography variant="caption" fontWeight={800} fontSize="0.65rem">LIVE</Typography>
                </Box>
                
                <IconButton size="small" sx={{ color: '#64748b', p: 1 }}>
                  <NotificationsNone fontSize="medium" />
                </IconButton>
                
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, alignSelf: 'center', display: { xs: 'none', sm: 'block' } }} />
                
                <Avatar 
                  onClick={() => navigate('/agent/profile')}
                  sx={{ 
                    width: 34, height: 34, 
                    bgcolor: '#2e7d32', 
                    fontSize: '0.9rem', 
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 8px rgba(46, 125, 50, 0.2)'
                  }}
                >
                  {user?.name?.charAt(0)}
                </Avatar>
              </Stack>
            </Toolbar>
          </AppBar>

          {/* Page Content */}
          <Box component="main" sx={{ 
            flexGrow: 1, 
            p: { xs: 2.5, md: 4 },
            pb: { xs: 10, md: 4 }, // Space for bottom nav
            width: '100%',
            maxWidth: '1600px',
            mx: 'auto'
          }}>
            <Outlet />
          </Box>
        </Box>
      </Box>

      {/* Bottom Navigation for Mobile */}
      <Paper 
        sx={{ 
          position: 'fixed', bottom: 0, left: 0, right: 0, 
          display: { xs: 'block', md: 'none' },
          zIndex: 1000,
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.05)',
          borderTop: '1px solid #f1f5f9'
        }} 
        elevation={0}
      >
        <BottomNavigation
          value={location.pathname}
          onChange={(event, newValue) => navigate(newValue)}
          showLabels
          sx={{ 
            height: 72,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              padding: '12px 0 4px',
              color: '#94a3b8',
              '&.Mui-selected': {
                color: '#2e7d32',
                '& .MuiSvgIcon-root': {
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease'
                }
              }
            }
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.text}
              label={item.text.replace('My ', '')}
              value={item.path}
              icon={item.icon}
              sx={{
                '& .MuiSvgIcon-root': { fontSize: 24 }
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.7; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
      `}</style>
    </Box>
  )
}

export default AgentLayout
