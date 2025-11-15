import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  TextField,
  Button,
  Divider,
} from '@mui/material'
import { AccountCircle, Edit, Save, ChevronRight, Language, Lock, Info, Logout as LogoutIcon } from '@mui/icons-material'
import { List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material'

const Profile = () => {
  const { user } = useSelector((state) => state.auth)

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* Header - Purple */}
      <Box sx={{ bgcolor: '#6200EA', color: 'white', p: 4, textAlign: 'center' }}>
        <Avatar
          sx={{
            width: 100,
            height: 100,
            bgcolor: 'white',
            color: '#6200EA',
            fontSize: '2.5rem',
            margin: '0 auto 16px',
            border: '4px solid rgba(255,255,255,0.2)',
            fontWeight: 600,
          }}
        >
          {user?.name?.charAt(0).toUpperCase() || 'V'}
        </Avatar>
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ fontSize: '1.4rem' }}>
          {user?.name || 'vishnu sharma'}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95, fontSize: '0.9rem' }}>
          {user?.email || 'balag.rudra@gmail.com'}
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 3, px: 2 }}>
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <List sx={{ p: 0 }}>
            <ListItemButton sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 48 }}>
                <Box sx={{ bgcolor: '#E1BEE7', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AccountCircle sx={{ color: '#6200EA', fontSize: 24 }} />
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary="Profile" 
                primaryTypographyProps={{ fontWeight: 500, fontSize: '1rem' }}
              />
              <ChevronRight sx={{ color: '#999' }} />
            </ListItemButton>

            <Divider sx={{ mx: 2 }} />

            <ListItemButton sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 48 }}>
                <Box sx={{ bgcolor: '#B3E5FC', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Language sx={{ color: '#0288D1', fontSize: 24 }} />
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary="Language" 
                primaryTypographyProps={{ fontWeight: 500, fontSize: '1rem' }}
              />
              <Typography variant="body2" sx={{ color: '#999', mr: 1 }}>English</Typography>
              <ChevronRight sx={{ color: '#999' }} />
            </ListItemButton>

            <Divider sx={{ mx: 2 }} />

            <ListItemButton sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 48 }}>
                <Box sx={{ bgcolor: '#D1C4E9', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock sx={{ color: '#6200EA', fontSize: 24 }} />
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary="Terms & Conditions" 
                primaryTypographyProps={{ fontWeight: 500, fontSize: '1rem' }}
              />
              <ChevronRight sx={{ color: '#999' }} />
            </ListItemButton>

            <Divider sx={{ mx: 2 }} />

            <ListItemButton sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 48 }}>
                <Box sx={{ bgcolor: '#B3E5FC', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Info sx={{ color: '#0288D1', fontSize: 24 }} />
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary="About Us" 
                primaryTypographyProps={{ fontWeight: 500, fontSize: '1rem' }}
              />
              <ChevronRight sx={{ color: '#999' }} />
            </ListItemButton>

            <Divider sx={{ mx: 2 }} />

            <ListItemButton sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 48 }}>
                <Box sx={{ bgcolor: '#FFE0B2', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogoutIcon sx={{ color: '#F57C00', fontSize: 24 }} />
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                primaryTypographyProps={{ fontWeight: 500, fontSize: '1rem' }}
              />
              <ChevronRight sx={{ color: '#999' }} />
            </ListItemButton>
          </List>
        </Card>
      </Container>
    </Box>
  )
}

export default Profile
