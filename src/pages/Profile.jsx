import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider
} from '@mui/material'
import { AccountCircle, Save } from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user } = useSelector((state) => state.auth)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleUpdateProfile = async () => {
    try {
      await axios.put(`/users/${user._id}`, {
        name: formData.name,
        phone: formData.phone
      })
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed')
    }
  }

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      await axios.put(`/users/${user._id}`, {
        password: formData.newPassword
      })
      toast.success('Password changed successfully')
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password change failed')
    }
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: 48
              }}
            >
              {user?.name?.charAt(0)}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user?.phone}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary">
              {user?.roleId?.name}
            </Typography>
          </Paper>
        </Grid>

        {/* Edit Profile */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" mb={3}>
              Edit Profile
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formData.email}
                  disabled
                  helperText="Email cannot be changed"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleUpdateProfile}
                >
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Change Password */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>
              Change Password
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleChangePassword}
                >
                  Change Password
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Profile
