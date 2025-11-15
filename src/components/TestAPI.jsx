import { useState, useEffect } from 'react'
import { Box, Typography, Button, Paper, CircularProgress } from '@mui/material'
import axios from '@/api/axios'

const TestAPI = () => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const addResult = (title, success, data) => {
    setResults(prev => [...prev, { title, success, data, timestamp: new Date().toLocaleTimeString() }])
  }

  const testAPIs = async () => {
    setLoading(true)
    setResults([])

    // Test 1: Health Check
    try {
      const response = await axios.get('/health')
      addResult('Health Check', true, response.data)
    } catch (error) {
      addResult('Health Check', false, { error: error.message })
    }

    // Test 2: Cities
    try {
      const response = await axios.get('/cities')
      addResult('Cities', true, { count: response.data.data?.length, sample: response.data.data?.[0] })
    } catch (error) {
      addResult('Cities', false, { error: error.message })
    }

    // Test 3: Colonies
    try {
      const response = await axios.get('/colonies')
      addResult('Colonies', true, { count: response.data.data?.length, sample: response.data.data?.[0] })
    } catch (error) {
      addResult('Colonies', false, { error: error.message })
    }

    // Test 4: Login
    try {
      const response = await axios.post('/auth/login', {
        email: 'admin@jayshree.com',
        password: 'admin123'
      })
      addResult('Login', true, { user: response.data.data.user.name, role: response.data.data.user.role.name })
      
      // Test 5: Protected route
      try {
        const usersResponse = await axios.get('/users')
        addResult('Users (Protected)', true, { count: usersResponse.data.data?.length })
      } catch (error) {
        addResult('Users (Protected)', false, { error: error.message })
      }
    } catch (error) {
      addResult('Login', false, { error: error.message })
    }

    setLoading(false)
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        API Test Component
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={testAPIs} 
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? <CircularProgress size={20} /> : 'Test APIs'}
      </Button>

      {results.map((result, index) => (
        <Paper 
          key={index} 
          sx={{ 
            p: 2, 
            mb: 2, 
            bgcolor: result.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`
          }}
        >
          <Typography variant="h6" gutterBottom>
            {result.title} - {result.timestamp}
          </Typography>
          <Typography component="pre" sx={{ fontSize: '0.875rem', overflow: 'auto' }}>
            {JSON.stringify(result.data, null, 2)}
          </Typography>
        </Paper>
      ))}
    </Box>
  )
}

export default TestAPI
