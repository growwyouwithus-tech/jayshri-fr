import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, FormControlLabel, Checkbox, MenuItem
} from '@mui/material'
import { Add, Edit, Delete, Visibility, ArrowBack } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const RoleManagement = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentRole, setCurrentRole] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    permissions: []
  })
  
  const availableModules = [
    'users', 'roles', 'colonies', 'properties', 'plots', 'bookings', 
    'payments', 'receipts', 'reports', 'settings', 'staff', 
    'accounts', 'expenses', 'calculator', 'kisan_payment', 'commissions'
  ]
  
  const availableActions = ['create', 'read', 'update', 'delete']

  const mapPermissionsFromApi = (permissions = []) => {
    if (!Array.isArray(permissions)) return []
    const moduleMap = new Map()

    const addPermission = (module, action) => {
      if (!availableModules.includes(module) || !availableActions.includes(action)) return
      if (!moduleMap.has(module)) moduleMap.set(module, new Set())
      moduleMap.get(module).add(action)
    }

    permissions.forEach((perm) => {
      if (perm === 'all') {
        availableModules.forEach((module) => {
          availableActions.forEach((action) => addPermission(module, action))
        })
        return
      }
      if (typeof perm !== 'string') return
      const [module, action] = perm.split('_')
      if (module && action) {
        addPermission(module, action)
      }
    })

    return Array.from(moduleMap.entries()).map(([module, actionsSet]) => ({
      module,
      actions: Array.from(actionsSet)
    }))
  }

  const mapPermissionsToApi = (permissions = []) => {
    if (!Array.isArray(permissions)) return []
    const flattened = new Set()
    permissions.forEach((perm) => {
      if (!perm?.module || !Array.isArray(perm.actions)) return
      perm.actions.forEach((action) => {
        if (availableModules.includes(perm.module) && availableActions.includes(action)) {
          flattened.add(`${perm.module}_${action}`)
        }
      })
    })
    return Array.from(flattened)
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      // Try new endpoint first, fallback to old endpoint
      let response
      try {
        response = await axios.get('/roles')
      } catch (err) {
        response = await axios.get('/users/roles/all')
      }
      const roleList = Array.isArray(response.data.data) ? response.data.data : []
      setRoles(roleList.map((role) => ({
        ...role,
        permissions: mapPermissionsFromApi(role.permissions)
      })))
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      toast.error('Failed to fetch roles')
      setLoading(false)
    }
  }
  
  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditMode(true)
      setCurrentRole(role)
      setFormData({
        name: role.name,
        description: role.description || '',
        isActive: role.isActive,
        permissions: role.permissions || []
      })
    } else {
      setEditMode(false)
      setCurrentRole(null)
      setFormData({
        name: '',
        description: '',
        isActive: true,
        permissions: []
      })
    }
    setOpenDialog(true)
  }
  
  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentRole(null)
  }
  
  const handlePermissionChange = (module, action, checked) => {
    const newPermissions = [...formData.permissions]
    const moduleIndex = newPermissions.findIndex(p => p.module === module)
    
    if (moduleIndex >= 0) {
      if (checked) {
        if (!newPermissions[moduleIndex].actions.includes(action)) {
          newPermissions[moduleIndex].actions.push(action)
        }
      } else {
        newPermissions[moduleIndex].actions = newPermissions[moduleIndex].actions.filter(a => a !== action)
        if (newPermissions[moduleIndex].actions.length === 0) {
          newPermissions.splice(moduleIndex, 1)
        }
      }
    } else if (checked) {
      newPermissions.push({ module, actions: [action] })
    }
    
    setFormData({ ...formData, permissions: newPermissions })
  }
  
  const isPermissionChecked = (module, action) => {
    const permission = formData.permissions.find(p => p.module === module)
    return permission ? permission.actions.includes(action) : false
  }
  
  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        permissions: mapPermissionsToApi(formData.permissions)
      }
      
      console.log('Submitting role with payload:', payload)
      
      if (editMode) {
        const response = await axios.put(`/roles/${currentRole._id}`, payload)
        console.log('Role update response:', response.data)
        toast.success('Role updated successfully')
      } else {
        const response = await axios.post('/roles', payload)
        console.log('Role create response:', response.data)
        toast.success('Role created successfully')
      }
      handleCloseDialog()
      fetchRoles()
    } catch (error) {
      console.error('Role submit error:', error)
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return
    
    try {
      await axios.delete(`/roles/${id}`)
      toast.success('Role deleted successfully')
      fetchRoles()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed')
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Role & Permission Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Role
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ '& td, & th': { border: '1px solid #000' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Role Name</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Description</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Permissions</TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Status</TableCell>
              <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(Array.isArray(roles) ? roles : []).map((role) => (
              <TableRow key={role._id}>
                <TableCell><strong>{role.name}</strong></TableCell>
                <TableCell>{role.description || '-'}</TableCell>
                <TableCell>
                  {(Array.isArray(role.permissions) ? role.permissions : []).map((perm, idx) => (
                    <Chip key={idx} label={`${perm.module}: ${(perm.actions || []).join(', ')}`} size="small" sx={{ m: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>
                  <Chip label={role.isActive ? 'Active' : 'Inactive'} color={role.isActive ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenDialog(role)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(role._id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Role' : 'Add New Role'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={editMode && ['admin', 'buyer', 'agent', 'lawyer'].includes(currentRole?.name)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </TextField>
            </Grid>
            
            {/* Permissions */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
                Permissions
              </Typography>
            </Grid>
            
            {availableModules.map((module) => (
              <Grid item xs={12} key={module}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" mb={1} textTransform="capitalize">
                    {module}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    {availableActions.map((action) => (
                      <FormControlLabel
                        key={action}
                        control={
                          <Checkbox
                            checked={isPermissionChecked(module, action)}
                            onChange={(e) => handlePermissionChange(module, action, e.target.checked)}
                          />
                        }
                        label={action.charAt(0).toUpperCase() + action.slice(1)}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RoleManagement
