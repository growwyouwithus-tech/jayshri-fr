import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  IconButton,
  Button,
} from '@mui/material'
import { ArrowBack, MoreVert, Refresh } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const Notifications = () => {
  const navigate = useNavigate()
  const [notifications] = useState([])

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* Header - Purple */}
      <Box sx={{ bgcolor: '#6200EA', color: 'white', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ArrowBack onClick={() => navigate(-1)} sx={{ cursor: 'pointer', fontSize: 24 }} />
            <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.3rem' }}>
              Notifications
            </Typography>
          </Box>
          <IconButton sx={{ color: 'white' }}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      <Container maxWidth="md" sx={{ py: 4, px: 3 }}>
        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            {/* Illustration Circle - Same as My Bookings */}
            <Box
              sx={{
                width: 200,
                height: 200,
                margin: '0 auto 24px',
                bgcolor: '#E8D5F5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 140,
                  bgcolor: '#6200EA',
                  borderRadius: '50% 50% 0 0',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  pb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 50,
                    bgcolor: '#FFA726',
                    borderRadius: 2,
                  }}
                />
              </Box>
            </Box>
            <Typography variant="h6" fontWeight={500} gutterBottom sx={{ fontSize: '1.1rem', mb: 0.5 }}>
              No notification available.
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 3, fontSize: '0.9rem' }}>
              You can see your notification here when available.
            </Typography>
            <Button
              startIcon={<Refresh />}
              sx={{ 
                color: '#6200EA',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <Box>
            {/* Notifications will be displayed here */}
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default Notifications
