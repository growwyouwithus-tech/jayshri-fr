import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
  Chip,
  Button,
  CircularProgress
} from '@mui/material'
import {
  Notifications as NotificationIcon,
  Delete,
  CheckCircle,
  Info,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useDispatch } from 'react-redux'
import { fetchNotifications } from '@/store/slices/notificationSlice'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const { data } = await axios.get('/notifications')
      setNotifications(data.data.notifications)
      setLoading(false)
    } catch (error) {
      toast.error('Failed to load notifications')
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`)
      loadNotifications()
      dispatch(fetchNotifications())
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/notifications/read-all')
      toast.success('All notifications marked as read')
      loadNotifications()
      dispatch(fetchNotifications())
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/notifications/${id}`)
      toast.success('Notification deleted')
      loadNotifications()
      dispatch(fetchNotifications())
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <ErrorIcon color="error" />
      case 'high':
        return <Warning color="warning" />
      case 'medium':
        return <Info color="info" />
      default:
        return <NotificationIcon />
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'error',
      high: 'warning',
      medium: 'info',
      low: 'default'
    }
    return colors[priority] || 'default'
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Notifications
        </Typography>
        {notifications.some(n => !n.isRead) && (
          <Button
            variant="outlined"
            startIcon={<CheckCircle />}
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </Button>
        )}
      </Box>

      {notifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NotificationIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No notifications
          </Typography>
        </Paper>
      ) : (
        <List>
          {notifications.map((notification) => (
            <Paper
              key={notification._id}
              sx={{
                mb: 2,
                bgcolor: notification.isRead ? 'background.paper' : 'action.hover'
              }}
            >
              <ListItem
                secondaryAction={
                  <Box>
                    {!notification.isRead && (
                      <IconButton
                        edge="end"
                        onClick={() => handleMarkAsRead(notification._id)}
                        title="Mark as read"
                      >
                        <CheckCircle />
                      </IconButton>
                    )}
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(notification._id)}
                      title="Delete"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemIcon>
                  {getPriorityIcon(notification.priority)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight={notification.isRead ? 'normal' : 'bold'}>
                        {notification.title}
                      </Typography>
                      <Chip
                        label={notification.priority}
                        color={getPriorityColor(notification.priority)}
                        size="small"
                      />
                      {!notification.isRead && (
                        <Chip label="New" color="primary" size="small" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notification.createdAt && format(new Date(notification.createdAt), 'PPpp')}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  )
}

export default Notifications
