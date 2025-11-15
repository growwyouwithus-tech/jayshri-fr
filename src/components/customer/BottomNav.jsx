import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import { Home, ShoppingCart, AccountCircle } from '@mui/icons-material'

const BottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const getActiveTab = () => {
    if (location.pathname === '/') return 0
    if (location.pathname === '/my-bookings') return 1
    if (location.pathname === '/profile') return 2
    return 0
  }

  const handleChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/')
        break
      case 1:
        navigate('/my-bookings')
        break
      case 2:
        navigate('/profile')
        break
      default:
        break
    }
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
      elevation={3}
    >
      <BottomNavigation value={getActiveTab()} onChange={handleChange} showLabels>
        <BottomNavigationAction
          label="Home"
          icon={<Home />}
          sx={{
            '&.Mui-selected': {
              color: 'primary.main',
            },
          }}
        />
        <BottomNavigationAction
          label="My Bookings"
          icon={<ShoppingCart />}
          sx={{
            '&.Mui-selected': {
              color: 'primary.main',
            },
          }}
        />
        <BottomNavigationAction
          label="Profile"
          icon={<AccountCircle />}
          sx={{
            '&.Mui-selected': {
              color: 'primary.main',
            },
          }}
        />
      </BottomNavigation>
    </Paper>
  )
}

export default BottomNav
