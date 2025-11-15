import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, FormControlLabel, Checkbox, MenuItem
} from '@mui/material'
import { Add, Edit, Delete, Visibility } from '@mui/icons-material'
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
    'users', 'roles', 'colonies', 'plots', 'bookings', 
    'payments', 'receipts', 'reports', 'settings'
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
      const { data } = await axios.get('/users/roles/all')
      const roleList = Array.isArray(data.data) ? data.data : []
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
      if (editMode) {
        await axios.put(`/users/roles/${currentRole._id}`, {
          ...formData,
          permissions: mapPermissionsToApi(formData.permissions)
        })
        toast.success('Role updated successfully')
      } else {
        await axios.post('/users/roles', {
          ...formData,
          permissions: mapPermissionsToApi(formData.permissions)
        })
        toast.success('Role created successfully')
      }
      handleCloseDialog()
      fetchRoles()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return
    
    try {
      await axios.delete(`/users/roles/${id}`)
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Role Name</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Permissions</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
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
