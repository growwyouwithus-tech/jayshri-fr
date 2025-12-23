import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, CircularProgress, MenuItem, Switch
} from '@mui/material'
import { Add, Edit, Delete, Block, CheckCircle, ArrowBack } from '@mui/icons-material'
import axios from '@/api/axios'
import mockApiService from '@/services/mockApiService'
import { checkAuth } from '@/store/slices/authSlice'
import toast from 'react-hot-toast'

const UserManagement = () => {
  const dispatch = useDispatch()
  const { user: currentLoggedInUser } = useSelector((state) => state.auth)
  const [customers, setCustomers] = useState([])
  const [cities, setCities] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: '', cityId: ''
  })

  useEffect(() => {
    fetchCustomers()
    fetchCities()
    fetchRoles()
  }, [])

  const fetchCities = async () => {
    try {
      const { data } = await axios.get('/cities')
      setCities(data?.data || [])
    } catch (error) {
      console.error('Failed to fetch cities:', error)
      toast.error('Failed to fetch cities')
    }
  }

  const fetchRoles = async () => {
    try {
      const { data } = await axios.get('/roles')
      setRoles(data?.data || [])
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      toast.error('Failed to fetch roles')
    }
  }

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/customers')
      setCustomers(data.data || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      toast.error('Failed to fetch customers')
      setLoading(false)
    }
  }


  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditMode(true)
      setCurrentUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: '',
        role: user.role?._id || '',
        cityId: user.cityId?._id || ''
      })
    } else {
      setEditMode(false)
      setCurrentUser(null)
      setFormData({ name: '', email: '', phone: '', password: '', role: '', cityId: '' })
    }
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.name || !formData.email) {
        toast.error('Name and email are required')
        return
      }
      
      // Password is optional for new users - will use default if not provided
      if (!editMode && formData.password && formData.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      
      if (!formData.role) {
        toast.error('Please select a role')
        return
      }
      
      if (editMode) {
        // Don't send password if empty during edit
        const updateData = { ...formData }
        if (!updateData.password) {
          delete updateData.password
        }
        
        await axios.put(`/users/${currentUser._id}`, updateData)
        toast.success('User updated')
        
        // If the updated user is the currently logged-in user, refresh their session
        if (currentUser._id === currentLoggedInUser?._id) {
          await dispatch(checkAuth()).unwrap()
          toast.info('Your session has been updated')
        }
      } else {
        const response = await axios.post('/users', formData)
        
        // Show default password if generated
        if (response.data.defaultPassword) {
          toast.success(`User created! Default password: ${response.data.defaultPassword}`, {
            duration: 8000
          })
        } else {
          toast.success('User created')
        }
      }
      setOpenDialog(false)
      fetchCustomers()
    } catch (error) {
      // Show validation errors if available
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.path}: ${err.msg}`)
        })
      } else {
        toast.error(error.response?.data?.message || 'Operation failed')
      }
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return
    try {
      await axios.delete(`/users/${id}`)
      toast.success('User deleted')
      fetchCustomers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed')
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(`/users/${id}/toggle-status`)
      toast.success('User status updated')
      fetchCustomers()
    } catch (error) {
      toast.error('Status update failed')
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  // Show form if dialog is open
  if (openDialog) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            {editMode ? 'Edit User' : 'Add New User'}
          </Typography>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setOpenDialog(false)}>
            Back to Users
          </Button>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </Grid>
            {!editMode && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="City" value={formData.cityId} onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}>
                <MenuItem value="">Select City</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city._id} value={city._id}>{city.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={() => setOpenDialog(false)} variant="outlined">Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>{editMode ? 'Update' : 'Add'} User</Button>
          </Box>
        </Paper>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom mb={4}>Customer Management</Typography>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <TextField
          size="small"
          placeholder="Search by name, phone, email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 250 }}
        />
        
        <TextField
          select
          size="small"
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          sx={{ minWidth: 150 }}
          SelectProps={{ displayEmpty: true }}
        >
          <MenuItem value="">-- Filter by City --</MenuItem>
          {cities.map((city) => (
            <MenuItem key={city._id} value={city.name}>
              {city.name}
            </MenuItem>
          ))}
        </TextField>
        
        <Button variant="contained" onClick={() => fetchCustomers()}>
          Refresh
        </Button>
        
        <Button variant="outlined" onClick={() => {
          setSearchTerm('')
          setFilterCity('')
          fetchCustomers()
        }}>
          Reset
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ '& td, & th': { border: '1px solid #000' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Name</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Phone</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Email</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>City</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Status</TableCell>
              <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.filter(user => {
              const matchesSearch = !searchTerm || 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
              const matchesCity = !filterCity || user.cityId?.name === filterCity
              return matchesSearch && matchesCity
            }).map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.cityId?.name || '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.isActive ? 'Active' : 'Inactive'} 
                    size="small"
                    color={user.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleToggleStatus(user._id)}>
                    {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={editMode} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required disabled={editMode} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="City" value={formData.cityId} onChange={(e) => setFormData({ ...formData, cityId: e.target.value })} required>
                <MenuItem value="">-- Select City --</MenuItem>
                {cities.map((city) => (<MenuItem key={city._id} value={city._id}>{city.name}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="User Type" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required>
                <MenuItem value="">-- Select Type --</MenuItem>
                {roles.map((role) => (<MenuItem key={role._id} value={role._id}>{role.name}</MenuItem>))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editMode ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserManagement
