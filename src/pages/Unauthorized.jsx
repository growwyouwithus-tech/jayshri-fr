import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Lock } from '@mui/icons-material'

const Unauthorized = () => {
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
      <Lock sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Access Denied
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        You don't have permission to access this page
      </Typography>
      <Button variant="contained" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </Box>
  )
}

export default Unauthorized
