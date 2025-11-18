import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Chip,
  Stack,
  Collapse,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout,
  Home,
  Business,
  Receipt,
  Description,
  Calculate,
  People,
  AdminPanelSettings,
  Gavel,
  TrendingUp,
  ExpandLess,
  ExpandMore,
  LocationCity,
} from '@mui/icons-material'
import { logout } from '@/store/slices/authSlice'
import toast from 'react-hot-toast'

const DRAWER_WIDTH = 260

/**
 * Main Layout Component
 * Provides navigation sidebar and top app bar
 */
const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { unreadCount } = useSelector((state) => state.notification)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [expandedMenus, setExpandedMenus] = useState({})

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const handleSubmenuToggle = (menuText) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuText]: !prev[menuText]
    }))
  }

  // Navigation items based on role
  const getNavigationItems = () => {
    const roleName = user?.role?.name

    const commonItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    ]

    const roleSpecificItems = {
      'Buyer': [
        { text: 'Explore Colonies', icon: <Home />, path: '/buyer/colonies' },
        { text: 'My Bookings', icon: <Receipt />, path: '/buyer/bookings' },
      ],
      'Admin': [
        { text: 'Land Purchase', icon: <Business />, path: '/admin/colonies' },
        { 
          text: 'Properties', 
          icon: <Home />, 
          path: '/admin/properties',
          submenu: [
            { text: 'All Properties', path: '/admin/properties' },
            { text: 'All Cities', path: '/admin/cities' },
            { text: 'All Areas', path: '/admin/areas' }
          ]
        },
        { text: 'Plots', icon: <Home />, path: '/admin/plots' },
        { text: 'Bookings', icon: <Receipt />, path: '/admin/bookings' },
        { text: 'Commissions', icon: <TrendingUp />, path: '/admin/commissions' },
        { text: 'Users', icon: <People />, path: '/admin/users' },
        { text: 'Roles', icon: <AdminPanelSettings />, path: '/admin/roles' },
        { text: 'Staff Management', icon: <AdminPanelSettings />, path: '/admin/staff' },
        { text: 'Calculator', icon: <Calculate />, path: '/admin/calculator' },
        { text: 'Settings', icon: <AdminPanelSettings />, path: '/admin/settings' },
      ],
      'Manager': [
        { text: 'Land Purchase', icon: <Business />, path: '/admin/colonies' },
        { text: 'Plots', icon: <Home />, path: '/admin/plots' },
        { text: 'Bookings', icon: <Receipt />, path: '/admin/bookings' },
        { text: 'Registry', icon: <Description />, path: '/admin/registry' },
        { text: 'Calculator', icon: <Calculate />, path: '/admin/calculator' },
      ],
      'Lawyer': [
        { text: 'Registry Documents', icon: <Gavel />, path: '/lawyer/registry' },
      ],
      'Agent': [
        { text: 'My Sales', icon: <Receipt />, path: '/agent/dashboard' },
        { text: 'Commissions', icon: <TrendingUp />, path: '/agent/commissions' },
      ],
    }

    return [...commonItems, ...(roleSpecificItems[roleName] || [])]
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      <Toolbar
        sx={{
          justifyContent: 'flex-start',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 1.5,
          py: 3,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" width="100%">
          <Box
            component="img"
            src="/JAISHRI GROUP.png"
            alt="Jayshri Properties"
            sx={{
              width: 48,
              height: 48,
              objectFit: 'contain',
              borderRadius: 1,
              bgcolor: 'white',
              p: 0.5
            }}
          />
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>
              Jayshri Properties
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Smart Plot Management
            </Typography>
          </Box>
        </Stack>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
        <List sx={{ px: 1 }}>
          {getNavigationItems().map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            const hasSubmenu = item.submenu && item.submenu.length > 0
            const isExpanded = expandedMenus[item.text]
            
            return (
              <Box key={item.text}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      if (hasSubmenu) {
                        handleSubmenuToggle(item.text)
                      } else {
                        navigate(item.path)
                      }
                    }}
                    selected={isActive && !hasSubmenu}
                    sx={{
                      color: 'rgba(255,255,255,0.92)',
                      px: 2,
                      py: 1.2,
                      borderRadius: 0,
                      '&.Mui-selected': {
                        color: '#fff',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        borderRadius: 0,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: '#fff',
                        minWidth: 42,
                        '& svg': {
                          fontSize: 22,
                        },
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ fontWeight: isActive ? 600 : 500 }}
                    />
                    {hasSubmenu && (
                      <IconButton size="small" sx={{ color: '#fff' }}>
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    )}
                  </ListItemButton>
                </ListItem>
                
                {hasSubmenu && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.submenu.map((subItem) => {
                        const isSubActive = location.pathname === subItem.path
                        return (
                          <ListItem key={subItem.text} disablePadding>
                            <ListItemButton
                              onClick={() => navigate(subItem.path)}
                              selected={isSubActive}
                              sx={{
                                pl: 6,
                                py: 1,
                                color: 'rgba(255,255,255,0.8)',
                                borderRadius: 0,
                                '&.Mui-selected': {
                                  color: '#fff',
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: 0,
                                },
                              }}
                            >
                              <ListItemText
                                primary={subItem.text}
                                primaryTypographyProps={{ 
                                  fontWeight: isSubActive ? 600 : 400,
                                  fontSize: '0.875rem'
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        )
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            )
          })}
        </List>
      </Box>
      <Box sx={{ px: 3, pb: 3 }}>
        <Box
          sx={{
            bgcolor: 'rgba(255,255,255,0.12)',
            borderRadius: 0,
            p: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Need support?
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Contact admin team for quick assistance.
          </Typography>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ minHeight: 80 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {user?.role?.name} Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stay on top of colony performance and plot activity at a glance.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label={new Date().getFullYear()}
              color="secondary"
              sx={{ fontWeight: 600, bgcolor: 'rgba(255,138,0,0.12)', color: 'secondary.main' }}
            />
            <IconButton color="inherit" onClick={() => navigate('/notifications')}>
              <Badge badgeContent={unreadCount} color="error" overlap="circular">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Box onClick={handleProfileMenuOpen} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
              <Avatar sx={{ width: 36, height: 36 }}>
                {user?.name?.charAt(0)}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.role?.name}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem disabled>
          <Typography variant="body2">{user?.name}</Typography>
        </MenuItem>
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              borderRadius: 0,
              bgcolor: 'primary.main',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              borderRadius: 0,
              bgcolor: 'primary.main',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: 7, sm: 8 },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            maxWidth: 1280,
            mx: 'auto',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default MainLayout
