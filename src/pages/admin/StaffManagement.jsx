import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  MenuItem,
  Checkbox,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import { Add, Edit, Delete, CloudUpload, GetApp, Print, Search, FileDownload, ArrowBack } from '@mui/icons-material'
import apiService from '@/services/apiService'
import mockApiService from '@/services/mockApiService'
import errorService from '@/services/errorService'
import toast from 'react-hot-toast'
import axios from '@/api/axios'

const StaffManagement = () => {
  const [staff, setStaff] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentStaff, setCurrentStaff] = useState(null)
  const [showEntries, setShowEntries] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [exportAnchor, setExportAnchor] = useState(null)
  const [selectedStaff, setSelectedStaff] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    profileImage: null
  })

  useEffect(() => {
    fetchStaff()
    fetchRoles()
  }, [])

  const normalizeUser = (user) => {
    const role = user.role || {}
    return {
      ...user,
      role,
      roleName: role?.name || user.roleName || 'Unassigned'
    }
  }

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/users')
      const allUsers = (data?.data || []).map(normalizeUser)
      let staffUsers = allUsers.filter(user => {
        const roleName = user.roleName?.toLowerCase()
        return ['manager', 'agent', 'lawyer'].includes(roleName)
      })

      if (staffUsers.length === 0) {
        staffUsers = allUsers.filter(user => user.roleName?.toLowerCase() === 'admin')
      }
      setStaff(staffUsers)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch staff:', error)
      if ([401, 403].includes(error.response?.status)) {
        try {
          const mock = await mockApiService.staff.getAll()
          const fallbackUsers = (mock?.data?.data || []).map(normalizeUser)
          setStaff(fallbackUsers)
        } catch (mockError) {
          console.error('Failed to load mock staff:', mockError)
          toast.error('Failed to fetch staff')
        }
      } else {
        toast.error('Failed to fetch staff')
      }
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      console.log('Fetching roles from /users/roles/all...')
      const { data } = await axios.get('/users/roles/all')
      console.log('Roles fetched:', data)
      setRoles(data.data || [])
      
      if (!data.data || data.data.length === 0) {
        toast.error('No roles found. Please contact admin.')
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      console.error('Error details:', error.response?.data)
      toast.error(error.response?.data?.message || 'Failed to fetch roles. Please refresh.')
      setRoles([]) // Set empty array on error
    }
  }

  const handleOpenDialog = (staffMember = null) => {
    if (staffMember) {
      setEditMode(true)
      setCurrentStaff(staffMember)
      setFormData({
        name: staffMember.name,
        email: staffMember.email,
        phone: staffMember.phone,
        password: '',
        confirmPassword: '',
        role: staffMember.role?._id || '',
        profileImage: null
      })
    } else {
      setEditMode(false)
      setCurrentStaff(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: '',
        profileImage: null
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentStaff(null)
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required')
      return
    }
    
    if (!formData.role) {
      toast.error('Please select a role')
      return
    }
    
    // Validate role exists in roles list
    const roleExists = roles.find(r => r._id === formData.role)
    if (!roleExists) {
      toast.error('Invalid role selected. Please refresh and try again.')
      return
    }
    
    if (!editMode) {
      // Password is optional - will use default if not provided
      if (formData.password) {
        const password = formData.password.trim()
        const confirmPassword = formData.confirmPassword.trim()
        
        if (password.length < 6) {
          toast.error('Password must be at least 6 characters')
          return
        }
        
        if (password !== confirmPassword) {
          console.log('Password mismatch:', { password, confirmPassword })
          toast.error('Passwords do not match')
          return
        }
      }
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      ...(formData.password ? { password: formData.password.trim() } : {})
    }

    console.log('Submitting staff with payload:', payload)
    console.log('Selected role details:', roleExists)

    try {
      if (editMode) {
        await axios.put(`/users/${currentStaff._id}`, payload)
        toast.success('Staff updated successfully')
      } else {
        const response = await axios.post('/users', payload)
        
        // Show default password if generated
        if (response.data.defaultPassword) {
          toast.success(`Staff created! Default password: ${response.data.defaultPassword}`, {
            duration: 8000
          })
        } else {
          toast.success('Staff created successfully')
        }
      }
      handleCloseDialog()
      fetchStaff()
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
    if (!window.confirm('Are you sure you want to delete this staff member?')) return

    try {
      await axios.delete(`/users/${id}`)
      toast.success('Staff deleted successfully')
      fetchStaff()
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        toast.error('Not allowed to delete staff with current role')
      } else {
        toast.error(error.response?.data?.message || 'Delete failed')
      }
    }
  }

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedStaff(filteredStaff.map(s => s._id))
    } else {
      setSelectedStaff([])
    }
  }

  const handleSelectStaff = (id) => {
    setSelectedStaff(prev => 
      prev.includes(id) 
        ? prev.filter(staffId => staffId !== id)
        : [...prev, id]
    )
  }

  const handleExport = (type) => {
    setExportAnchor(null)
    switch (type) {
      case 'csv':
        exportToCSV()
        break
      case 'excel':
        exportToExcel()
        break
      case 'print':
        window.print()
        break
      default:
        break
    }
  }

  const exportToCSV = () => {
    const headers = ['SL', 'Name', 'Phone', 'Email', 'Role']
    const csvContent = [
      headers.join(','),
      ...filteredStaff.map((staffMember, index) => [
        index + 1,
        staffMember.name,
        staffMember.phone,
        staffMember.email,
        staffMember.role?.name || staffMember.roleName || ''
      ].join(','))
    ].join('\\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'staff.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('CSV exported successfully')
  }

  const exportToExcel = () => {
    toast.info('Excel export functionality would be implemented here')
  }

  const filteredStaff = staff.filter(staffMember =>
    staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.phone.includes(searchTerm)
  ).slice(0, showEntries)

  if (loading) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress />
    </Box>
  )
}

// Show form if dialog is open
if (openDialog) {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          {editMode ? 'Edit Staff' : 'Add New Staff'}
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleCloseDialog}>
          Back to Staff List
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
            <TextField fullWidth select label="Role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required>
              {roles.map((role) => (
                <MenuItem key={role._id} value={role._id}>{role.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <Button onClick={handleCloseDialog} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editMode ? 'Update' : 'Add'} Staff</Button>
        </Box>
      </Paper>
    </Box>
  )
}

return (
  <Box>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
      <Typography variant="h4" fontWeight="bold">Staff Management</Typography>
      <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
        Add Staff
      </Button>
    </Box>

    {/* Controls */}
    <Box display="flex" gap={2} mb={3} alignItems="center">
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body2">Show:</Typography>
        <TextField
          select
          size="small"
          value={showEntries}
          onChange={(e) => setShowEntries(e.target.value)}
          sx={{ minWidth: 80 }}
        >
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={25}>25</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={100}>100</MenuItem>
        </TextField>
      </Box>
      
      <TextField
        size="small"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ minWidth: 200 }}
        />
        
        <Button
          variant="contained"
          startIcon={<GetApp />}
          onClick={(e) => setExportAnchor(e.currentTarget)}
        >
          Export
        </Button>
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
      >
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon><FileDownload /></ListItemIcon>
          <ListItemText>CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemIcon><FileDownload /></ListItemIcon>
          <ListItemText>Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('print')}>
          <ListItemIcon><Print /></ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
      </Menu>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedStaff.length > 0 && selectedStaff.length < filteredStaff.length}
                  checked={filteredStaff.length > 0 && selectedStaff.length === filteredStaff.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell><strong>SL.</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Code</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell align="right"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No staff found. Click "Add Staff" to create one.
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((staffMember, index) => (
                <TableRow key={staffMember._id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedStaff.includes(staffMember._id)}
                      onChange={() => handleSelectStaff(staffMember._id)}
                    />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar src={staffMember.profileImage} sx={{ width: 32, height: 32 }}>
                        {staffMember.name.charAt(0)}
                      </Avatar>
                      {staffMember.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {staffMember.userCode || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{staffMember.phone}</TableCell>
                  <TableCell>{staffMember.email}</TableCell>
                  <TableCell>{staffMember.role?.name || staffMember.roleName || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(staffMember)} sx={{ color: 'orange' }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(staffMember._id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <Typography variant="body2" mb={1}>Full Name</Typography>
              <TextField
                fullWidth
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" mb={1}>Email Address</Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="superadmin@jayshree.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={editMode}
              />
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" mb={1}>Phone</Typography>
              <TextField
                fullWidth
                placeholder="Enter Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                InputProps={{
                  startAdornment: (
                    <Box display="flex" alignItems="center" mr={1}>
                      🇮🇳 +91
                    </Box>
                  )
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" mb={1}>Password</Typography>
              <TextField
                fullWidth
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editMode}
                helperText={!editMode && !formData.password ? "Leave empty for auto-generated password" : ""}
              />
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" mb={1}>Confirm Password</Typography>
              <TextField
                fullWidth
                type="password"
                placeholder="••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required={!editMode}
                error={formData.password && formData.confirmPassword && formData.password.trim() !== formData.confirmPassword.trim()}
                helperText={
                  formData.password && formData.confirmPassword && formData.password.trim() !== formData.confirmPassword.trim()
                    ? "Passwords do not match"
                    : ""
                }
              />
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" mb={1}>Role*</Typography>
              <TextField
                fullWidth
                select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                error={!formData.role && roles.length > 0}
                helperText={
                  roles.length === 0 
                    ? "Loading roles..." 
                    : !formData.role 
                      ? "Please select a role" 
                      : ""
                }
              >
                <MenuItem value="">Select One</MenuItem>
                {roles.length === 0 ? (
                  <MenuItem disabled>Loading roles...</MenuItem>
                ) : (
                  roles.map((role) => (
                    <MenuItem key={role._id} value={role._id}>
                      {role.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" mb={1}>Profile Image (optional)</Typography>
              <Box
                sx={{
                  border: '2px dashed #e0e0e0',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
                onClick={() => document.getElementById('profile-image').click()}
              >
                <Add sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Click to upload profile image
                </Typography>
                <input
                  id="profile-image"
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, profileImage: e.target.files[0] })}
                />
                {formData.profileImage && (
                  <Typography variant="body2" color="success.main" mt={1}>
                    ✓ {formData.profileImage.name}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StaffManagement
