import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Home } from '@mui/icons-material'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
      }}
    >
      <Typography variant="h1" fontWeight="bold" color="primary">
        404
      </Typography>
      <Typography variant="h5" mb={3}>
        Page Not Found
      </Typography>
      <Button
        variant="contained"
        startIcon={<Home />}
        onClick={() => navigate('/')}
      >
        Go Home
      </Button>
    </Box>
  )
}

export default NotFound
