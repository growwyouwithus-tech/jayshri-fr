import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  Delete,
  Email,
  Phone,
  Chat,
  EventNote,
} from '@mui/icons-material';
import axios from '@/api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/contacts');
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setViewDialogOpen(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setStatusUpdateLoading(true);
      const response = await axios.patch(`/contacts/${id}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success('Status updated successfully');
        setMessages(messages.map(m => m._id === id ? { ...m, status: newStatus } : m));
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage({ ...selectedMessage, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await axios.delete(`/contacts/${id}`);
      if (response.data.success) {
        toast.success('Message deleted successfully');
        setMessages(messages.filter(m => m._id !== id));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'contacted': return 'info';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Contact Messages
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage inquiries from your website's "Contact Us" form.
          </Typography>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Message Preview</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No messages found
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow key={message._id} hover>
                  <TableCell>
                    {format(new Date(message.createdAt), 'dd MMM yyyy, hh:mm a')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{message.name}</TableCell>
                  <TableCell>{message.phone}</TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {message.message}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                      color={getStatusColor(message.status)}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton color="primary" size="small" onClick={() => handleViewMessage(message)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" size="small" onClick={() => handleDeleteMessage(message._id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Message Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedMessage && (
          <>
            <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chat color="primary" />
                <Typography variant="h6" fontWeight={600}>Message Details</Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EventNote sx={{ fontSize: 16 }} /> DATE & TIME
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {format(new Date(selectedMessage.createdAt), 'MMMM dd, yyyy - hh:mm a')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chat sx={{ fontSize: 16 }} /> SENDER NAME
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>{selectedMessage.name}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone sx={{ fontSize: 16 }} /> PHONE NUMBER
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>{selectedMessage.phone}</Typography>
                  <Button
                    size="small"
                    startIcon={<Phone />}
                    href={`tel:${selectedMessage.phone}`}
                    sx={{ mt: 0.5 }}
                  >
                    Call Now
                  </Button>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    MESSAGE
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fcfcfc', mt: 0.5 }}>
                    <Typography variant="body1">{selectedMessage.message}</Typography>
                  </Paper>
                </Box>

                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedMessage.status}
                    label="Status"
                    onChange={(e) => handleStatusChange(selectedMessage._id, e.target.value)}
                    disabled={statusUpdateLoading}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="contacted">Contacted</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ContactMessages;
