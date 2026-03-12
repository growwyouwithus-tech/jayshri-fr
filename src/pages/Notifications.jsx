import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Stack,
  Avatar,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material'
import {
  Notifications as NotificationIcon,
  Description,
  Assignment,
  Error as ErrorIcon,
  CheckCircle,
  MoreVert,
  Delete,
  Launch,
} from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useDispatch } from 'react-redux'
import { fetchNotifications } from '@/store/slices/notificationSlice'

const NotificationCard = ({ notification, onMarkRead, onDelete }) => {
  const isUnread = !notification.isRead
  
  const getIcon = () => {
    if (notification.title?.includes('REGISTRY')) return <Assignment />
    if (notification.title?.includes('CORRECTION')) return <Description />
    if (notification.type === 'error') return <ErrorIcon />
    return <NotificationIcon />
  }

  const getIconColor = () => {
    if (notification.title?.includes('REGISTRY')) return '#2E7D32'
    if (notification.title?.includes('CORRECTION')) return '#ED6C02'
    if (notification.type === 'error') return '#D32F2F'
    return '#1976D2'
  }

  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: 4, 
        border: '1px solid #f0f0f0', 
        boxShadow: isUnread ? '0 4px 12px rgba(46, 125, 50, 0.08)' : 'none',
        bgcolor: isUnread ? '#fff' : '#FAFAFA',
        position: 'relative',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: '#A5D6A7',
          bgcolor: '#fff'
        }
      }}
    >
      <CardContent sx={{ p: '16px !important' }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar 
            sx={{ 
              bgcolor: `${getIconColor()}15`, 
              color: getIconColor(),
              width: 42,
              height: 42
            }}
          >
            {getIcon()}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" fontWeight={700} sx={{ color: getIconColor(), textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {notification.title?.includes('REGISTRY') ? 'New Registry Assigned' : 
                   notification.title?.includes('CORRECTION') ? 'Document Correction Received' : 'Notification'}
                </Typography>
                {isUnread && (
                  <Chip 
                    label="UNREAD" 
                    size="small" 
                    sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#2E7D32', color: '#fff', borderRadius: 1 }} 
                  />
                )}
                {!isUnread && (
                  <Chip 
                    label="READ" 
                    size="small" 
                    sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#E0E0E0', color: '#757575', borderRadius: 1 }} 
                  />
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {notification.createdAt ? format(new Date(notification.createdAt), 'PPpp') : 'Recently'}
              </Typography>
            </Stack>
            
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              {notification.message?.split(':')[0] || notification.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {notification.message?.split(':')[1] || notification.message}
            </Typography>

            <Stack direction="row" spacing={1.5}>
              <Button 
                variant="contained" 
                size="small" 
                endIcon={<Launch sx={{ fontSize: '14px !important' }} />}
                sx={{ 
                  textTransform: 'none', 
                  borderRadius: 2, 
                  bgcolor: '#2E7D32', 
                  '&:hover': { bgcolor: '#1B5E20' },
                  px: 2
                }}
              >
                View Case
              </Button>
              <Button 
                variant="text" 
                size="small" 
                sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
                onClick={() => onMarkRead(notification._id)}
              >
                Mark as read
              </Button>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

const Notifications = () => {
  const [tab, setTab] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/notifications')
      setNotifications(data.data.notifications || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to load notifications:', error)
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

  // Mock data for demo consistency
  const mockNotifications = [
    {
      _id: '1',
      title: 'NEW REGISTRY ASSIGNED',
      message: 'Case #4492 - Real Estate Dispute: A new commercial property dispute has been assigned to your registry. Please review.',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      title: 'DOCUMENT CORRECTION RECEIVED',
      message: 'Case #3102 - Affidavit Revision: The court clerk has requested a revision on the Affidavit for the upcoming hearing.',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      _id: '3',
      title: 'ADMIN MESSAGE',
      message: 'Scheduled Server Maintenance: The portal will be down for maintenance this Sunday from 2:00 AM to 4:00 AM GMT.',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]

  const displayNotifications = notifications.length > 0 ? notifications : mockNotifications

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={700}>
          Notifications
        </Typography>
        <Button 
          variant="text" 
          sx={{ textTransform: 'none', color: '#2E7D32', fontWeight: 700 }}
          onClick={handleMarkAllAsRead}
        >
          Mark all as read
        </Button>
      </Box>

      <Tabs 
        value={tab} 
        onChange={(e, v) => setTab(v)}
        sx={{ 
          mb: 3,
          '& .MuiTabs-indicator': { bgcolor: '#2E7D32' },
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 100 }
        }}
      >
        <Tab label="All Alerts" />
        <Tab label="Unread" />
        <Tab label="Archived" />
      </Tabs>

      <Box sx={{ maxWidth: 800 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
        ) : (
          displayNotifications.map((notif) => (
            <NotificationCard 
              key={notif._id} 
              notification={notif} 
              onMarkRead={handleMarkAsRead}
            />
          ))
        )}
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button sx={{ textTransform: 'none', color: '#2E7D32', fontWeight: 600 }}>
            Load older notifications
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default Notifications
