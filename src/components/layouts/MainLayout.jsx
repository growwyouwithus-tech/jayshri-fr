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
  Button,
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
  AccountBalance,
  PersonPin,
  Work,
  CheckCircle,
  Close,
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

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!user?.role) return false
    const permissions = user.role.permissions || []

    // Admin has all permissions
    if (permissions.includes('all')) return true

    // Handle string format: ["plots_create", "plots_read"]
    if (permissions.includes(permission)) return true

    // Handle object format: [{"module":"plots","actions":["create","read"]}]
    const [module, action] = permission.split('_')
    if (module && action) {
      const modulePermission = permissions.find(p =>
        typeof p === 'object' && p.module === module
      )
      if (modulePermission && modulePermission.actions?.includes(action)) {
        return true
      }
    }

    return false
  }

  // Navigation items based on role and permissions
  const getNavigationItems = () => {
    const roleName = user?.role?.name

    // Debug logging
    console.log('🔍 Navigation Debug:')
    console.log('User:', user?.name)
    console.log('Role:', roleName)
    console.log('Permissions:', user?.role?.permissions)

    const commonItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    ]

    // Hardcoded items for specific roles (backward compatibility)
    const roleSpecificItems = {
      'Buyer': [
        { text: 'Explore Colonies', icon: <Home />, path: '/buyer/colonies' },
        { text: 'My Bookings', icon: <Receipt />, path: '/buyer/bookings' },
      ],
      'Lawyer': [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/lawyer/dashboard' },
        { text: 'Registry Documents', icon: <Gavel />, path: '/lawyer/registry' },
        { text: 'Verified Documents', icon: <CheckCircle />, path: '/lawyer/registry?status=verified' },
        { text: 'Rejected Documents', icon: <Close />, path: '/lawyer/registry?status=rejected' },
        { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
      ],
      'Agent': [
        { text: 'My Sales', icon: <Receipt />, path: '/agent/dashboard' },
        { text: 'Commissions', icon: <TrendingUp />, path: '/agent/commissions' },
      ],
    }

    // If role has specific hardcoded items, use only those
    if (roleSpecificItems[roleName]) {
      return roleSpecificItems[roleName]
    }

    // Dynamic items based on permissions for Admin, Manager, Colony Manager and custom roles
    const dynamicItems = []

    // Colonies (check both colony_read and colonies_read)
    if (hasPermission('colony_read') || hasPermission('colonies_read') || hasPermission('colony_create') || hasPermission('colonies_create')) {
      dynamicItems.push({ text: 'Create Colony', icon: <Business />, path: '/admin/colonies' })
    }

    // Properties submenu
    if (hasPermission('colony_read') || hasPermission('colonies_read')) {
      const propertiesSubmenu = []
      if (hasPermission('colony_read') || hasPermission('colonies_read')) propertiesSubmenu.push({ text: 'Mansion Properties', path: '/admin/properties' })
      if (hasPermission('city_read') || hasPermission('cities_read')) propertiesSubmenu.push({ text: 'Create Cities', path: '/admin/cities' })
      // if (hasPermission('city_read') || hasPermission('cities_read')) propertiesSubmenu.push({ text: 'All Areas', path: '/admin/areas' })

      if (propertiesSubmenu.length > 0) {
        dynamicItems.push({
          text: 'Properties',
          icon: <Home />,
          path: '/admin/properties',
          submenu: propertiesSubmenu
        })
      }
    }

    // Plots (check both plot_read and plots_read)
    if (hasPermission('plot_read') || hasPermission('plots_read') || hasPermission('plot_create') || hasPermission('plots_create')) {
      dynamicItems.push({ text: 'Plots', icon: <Home />, path: '/admin/plots' })
    }

    // Bookings (check both booking_read and bookings_read)
    if (hasPermission('booking_read') || hasPermission('bookings_read') || hasPermission('booking_create') || hasPermission('bookings_create')) {
      dynamicItems.push({ text: 'Bookings', icon: <Receipt />, path: '/admin/bookings' })
    }

    // Sold Plots
    if (hasPermission('plot_read') || hasPermission('plots_read')) {
      dynamicItems.push({ text: 'Sold Plots', icon: <CheckCircle />, path: '/admin/sold-plots' })
    }

    // Commissions
    // if (hasPermission('commissions_read') || hasPermission('commission_read')) {
    //   dynamicItems.push({ text: 'Commissions', icon: <TrendingUp />, path: '/admin/commissions' })
    // }

    // Users (check both user_read and users_read)
    if (hasPermission('user_read') || hasPermission('users_read')) {
      dynamicItems.push({ text: 'Users', icon: <People />, path: '/admin/users' })
    }

    // Roles (check both role_read and roles_read)
    if (hasPermission('role_read') || hasPermission('roles_read')) {
      dynamicItems.push({ text: 'Roles', icon: <AdminPanelSettings />, path: '/admin/roles' })
    }

    // Staff Management
    if (hasPermission('user_read') || hasPermission('users_read')) {
      dynamicItems.push({ text: 'Staff Management', icon: <AdminPanelSettings />, path: '/admin/staff' })
    }

    // Calculator
    if (hasPermission('colony_read') || hasPermission('colonies_read') || hasPermission('calculator_read')) {
      dynamicItems.push({ text: 'Calculator', icon: <Calculate />, path: '/admin/calculator' })
    }

    // Kisan Payment
    if (hasPermission('colony_read') || hasPermission('colonies_read') || roleName === 'Admin' || roleName === 'Manager') {
      dynamicItems.push({ text: 'Kisan Payment', icon: <TrendingUp />, path: '/admin/kisan-payments' })
    }

    // Accounts & Expenses
    if (roleName === 'Admin' || roleName === 'Manager') {
      dynamicItems.push({ text: 'Accounts & Expenses', icon: <AccountBalance />, path: '/admin/expenses' })
    }

    // Customers
    if (roleName === 'Admin' || roleName === 'Manager') {
      dynamicItems.push({ text: 'Customers', icon: <People />, path: '/admin/customers' })
    }

    // Agents
    if (roleName === 'Admin' || roleName === 'Manager') {
      dynamicItems.push({ text: 'Agents', icon: <PersonPin />, path: '/admin/agents' })
    }

    // Advocates
    if (roleName === 'Admin' || roleName === 'Manager') {
      dynamicItems.push({ text: 'Advocates', icon: <Work />, path: '/admin/advocates' })
    }

    // Settings
    if (hasPermission('settings_read') || hasPermission('setting_read')) {
      dynamicItems.push({ text: 'Settings', icon: <AdminPanelSettings />, path: '/admin/settings' })
    }

    return [...commonItems, ...dynamicItems]
  }

  const isLawyer = user?.role?.name === 'Lawyer'
  const sidebarBg = isLawyer ? '#FFFFFF' : 'primary.main'
  const sidebarColor = isLawyer ? '#1A1C1E' : '#FFFFFF'
  const iconColor = isLawyer ? '#5F6368' : '#FFFFFF'
  const activeBg = isLawyer ? '#E8F5E9' : 'rgba(255,255,255,0.1)'
  const activeColor = isLawyer ? '#4CAF50' : '#FFFFFF'

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: sidebarColor, bgcolor: sidebarBg }}>
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
            alt="Smart Plot"
            sx={{
              width: 42,
              height: 42,
              objectFit: 'contain',
              borderRadius: 1,
              bgcolor: 'white',
              border: isLawyer ? '1px solid #f0f0f0' : 'none',
              p: 0.5
            }}
          />
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: sidebarColor, lineHeight: 1.2 }}>
              {isLawyer ? 'Jayshri' : 'Jayshri Properties'}
            </Typography>
            <Typography variant="caption" sx={{ color: isLawyer ? 'text.secondary' : 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              {isLawyer ? 'Advocate Portal' : 'Smart Plot Management'}
            </Typography>
          </Box>
        </Stack>
      </Toolbar>
      <Divider sx={{ mx: 2, borderColor: isLawyer ? '#f5f5f5' : 'rgba(255,255,255,0.12)' }} />
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
                      color: isActive ? activeColor : sidebarColor,
                      px: 2,
                      py: 1.2,
                      borderRadius: 0,
                      bgcolor: isActive ? activeBg : 'transparent',
                      '&.Mui-selected': {
                        color: activeColor,
                        bgcolor: activeBg,
                        borderRadius: 0,
                        '&:hover': {
                          bgcolor: activeBg,
                        }
                      },
                      '&:hover': {
                        bgcolor: activeBg,
                        color: activeColor,
                      }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive ? activeColor : iconColor,
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
                      <IconButton size="small" sx={{ color: isActive ? activeColor : iconColor }}>
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
                                  fontWeight: isSubActive ? 600 : (isLawyer ? 500 : 400),
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
            bgcolor: isLawyer ? '#F8F9FA' : 'rgba(255,255,255,0.12)',
            borderRadius: 2,
            p: 2,
            mx: 2,
            border: isLawyer ? '1px solid #f0f0f0' : 'none',
            color: isLawyer ? '#1A1C1E' : '#FFFFFF',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Need support?
          </Typography>
          <Typography variant="body2" sx={{ color: isLawyer ? 'text.secondary' : 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
            Contact admin team for quick assistance.
          </Typography>
        </Box>
        {isLawyer && (
          <Box sx={{ px: 2, mt: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<Box component="span" sx={{ fontSize: '1.2rem' }}>+</Box>}
              sx={{
                py: 1.5,
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                bgcolor: '#2E7D32',
                '&:hover': {
                  bgcolor: '#1B5E20'
                }
              }}
              onClick={() => navigate('/lawyer/registry')}
            >
              New Entry
            </Button>
          </Box>
        )}
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
              {user?.role?.name === 'Lawyer' ? 'Advocate' : user?.role?.name} Dashboard
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
                  {user?.role?.name === 'Lawyer' ? 'Advocate' : user?.role?.name}
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
              bgcolor: sidebarBg,
              borderRight: isLawyer ? '1px solid #f0f0f0' : 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        id="main-content"
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
