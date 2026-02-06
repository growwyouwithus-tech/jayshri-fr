import { Box } from '@mui/material'
import ProductionDataDisplay from '@/components/ProductionDataDisplay'

const TestHome = () => {
  return (
    <Box sx={{ p: 0, bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      <ProductionDataDisplay />
    </Box>
  )
}

export default TestHome
