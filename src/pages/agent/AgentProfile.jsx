import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Box, Typography, Avatar, Card, CardContent, Divider, Stack, 
  IconButton, Button, Switch, useTheme, useMediaQuery, Chip
} from '@mui/material'
import { 
  Person, Email, Phone, Security, Logout, Edit, 
  NavigateNext, Notifications, Language, DarkMode,
  AccountCircle, Verified
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { logout } from '@/store/slices/authSlice'
import toast from 'react-hot-toast'

const SettingRow = ({ icon, label, subtext, action, onClick }) => (
  <Stack 
    direction="row" 
    justifyContent="space-between" 
    alignItems="center" 
    sx={{ 
      py: 2, 
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { bgcolor: 'rgba(0,0,0,0.01)' } : {}
    }}
    onClick={onClick}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ 
        width: 40, height: 40, 
        borderRadius: '12px', 
        bgcolor: '#f8fafc', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#64748b'
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" fontWeight={700} color="#1e293b">{label}</Typography>
        {subtext && <Typography variant="caption" color="text.secondary">{subtext}</Typography>}
      </Box>
    </Stack>
    {action || <NavigateNext sx={{ color: '#cbd5e1' }} />}
  </Stack>
)

const AgentProfile = () => {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', pb: 10 }}>
      {/* Profile Header */}
      <Box sx={{ textAlign: 'center', mb: 4, mt: isMobile ? 2 : 0 }}>
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Avatar 
            sx={{ 
              width: 100, height: 100, 
              mx: 'auto', mb: 2, 
              bgcolor: '#10b981',
              fontSize: '2.5rem',
              fontWeight: 900,
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)',
              border: '4px solid white'
            }}
          >
            {user?.name?.charAt(0)}
          </Avatar>
          <Box sx={{ 
            position: 'absolute', bottom: 15, right: 0, 
            bgcolor: '#3b82f6', color: 'white', 
            borderRadius: '50%', p: 0.5, 
            border: '2px solid white',
            display: 'flex'
          }}>
            <Verified sx={{ fontSize: 16 }} />
          </Box>
        </Box>
        <Typography variant="h5" fontWeight={900} color="#0f172a">
          {user?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
          {user?.role?.name || 'Authorized Agent'}
        </Typography>
        <Chip 
          label={`ID: ${user?.userCode || user?._id?.slice(-6).toUpperCase()}`} 
          size="small" 
          sx={{ fontWeight: 900, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', borderRadius: '8px', mt: 1, letterSpacing: 0.5 }}
        />
      </Box>

      {/* Account Info Card */}
      <Card sx={{ borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', mb: 3 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ px: 3, pt: 3, pb: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary">PERSONAL INFORMATION</Typography>
          </Box>
          <Box sx={{ px: 3 }}>
            <SettingRow icon={<Email />} label="Email Address" subtext={user?.email} />
            <Divider />
            <SettingRow icon={<Phone />} label="Mobile Number" subtext={user?.phone || 'Not Provided'} />
            <Divider />
            <SettingRow icon={<AccountCircle />} label="Identity KYC" subtext={user?.isActive ? "Verified Profile" : "Pending Verification"} action={<Chip label={user?.isActive ? "Verified" : "Pending"} size="small" color={user?.isActive ? "success" : "warning"} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />} />
          </Box>
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card sx={{ borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', mb: 3 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ px: 3, pt: 3, pb: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary">APP SETTINGS</Typography>
          </Box>
          <Box sx={{ px: 3 }}>
            <SettingRow icon={<Notifications />} label="Push Notifications" subtext="Active bookings & news" action={<Switch defaultChecked color="success" />} />
            <Divider />
            <SettingRow icon={<DarkMode />} label="Dark Mode" subtext="System preference" action={<Switch color="success" />} />
            <Divider />
            <SettingRow icon={<Language />} label="App Language" subtext="English (India)" />
          </Box>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card sx={{ borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ px: 3, pt: 3, pb: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary">SECURITY</Typography>
          </Box>
          <Box sx={{ px: 3 }}>
            <SettingRow icon={<Security />} label="Change Password" onClick={() => {}} />
            <Divider />
            <Stack 
              direction="row" 
              spacing={2} 
              alignItems="center" 
              sx={{ py: 2.5, px: 0, cursor: 'pointer', color: '#ef4444' }}
              onClick={handleLogout}
            >
              <Box sx={{ 
                width: 40, height: 40, 
                borderRadius: '12px', 
                bgcolor: '#fee2e2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#ef4444'
              }}>
                <Logout />
              </Box>
              <Typography variant="body2" fontWeight={800}>Logout Session</Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 4, color: 'text.secondary', fontWeight: 600 }}>
        Jayshri Properties v2.4.0 • Authorized Agent App
      </Typography>
    </Box>
  )
}

export default AgentProfile
