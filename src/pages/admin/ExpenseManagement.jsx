import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, TextField, Grid, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Chip, MenuItem, Select, FormControl, InputLabel,
  Card, CardContent, CircularProgress, InputAdornment, TablePagination, Collapse
} from '@mui/material'
import {
  Add, Edit, Delete, AttachFile, Visibility, AccountBalance,
  TrendingUp, TrendingDown, Receipt, Close, Save
} from '@mui/icons-material'
import axios from '@/api/axios'
import toast from 'react-hot-toast'

const EXPENSE_CATEGORIES = [
  'Construction Materials',
  'Labor Charges',
  'Equipment Rental',
  'Transportation',
  'Legal & Documentation',
  'Marketing & Advertising',
  'Office Supplies',
  'Utilities',
  'Maintenance & Repairs',
  'Professional Fees',
  'Taxes & Licenses',
  'Insurance',
  'Salaries & Wages',
  'Miscellaneous'
]

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank']
const EXPENSE_TYPES = ['Company', 'Property']

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [filterCategory, setFilterCategory] = useState('all')
  const [filterMode, setFilterMode] = useState('all')
  const [filterExpenseType, setFilterExpenseType] = useState('all')
  const [filterProperty, setFilterProperty] = useState('all')

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    property: '',
    expenseType: 'Company',
    category: '',
    amount: '',
    mode: 'Cash',
    vendorName: '',
    remarks: '',
    billFile: null
  })

  const [stats, setStats] = useState({
    total: 0,
    cash: 0,
    upi: 0,
    bank: 0,
    company: 0,
    property: 0
  })

  useEffect(() => {
    fetchExpenses()
    fetchProperties()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [expenses])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/expenses')
      setExpenses(data.data.expenses || [])
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      const { data } = await axios.get('/properties')
      const propertiesData = data.data?.properties || data.data || []
      setProperties(Array.isArray(propertiesData) ? propertiesData : [])
    } catch (error) {
      console.error('Failed to fetch properties:', error)
      setProperties([])
    }
  }

  const calculateStats = () => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const cash = expenses.filter(exp => exp.mode === 'Cash').reduce((sum, exp) => sum + exp.amount, 0)
    const upi = expenses.filter(exp => exp.mode === 'UPI').reduce((sum, exp) => sum + exp.amount, 0)
    const bank = expenses.filter(exp => exp.mode === 'Bank').reduce((sum, exp) => sum + exp.amount, 0)
    const company = expenses.filter(exp => exp.expenseType === 'Company').reduce((sum, exp) => sum + exp.amount, 0)
    const property = expenses.filter(exp => exp.expenseType === 'Property').reduce((sum, exp) => sum + exp.amount, 0)

    setStats({ total, cash, upi, bank, company, property })
  }

  const handleShowForm = (expense = null) => {
    if (expense) {
      setEditingExpense(expense)
      setFormData({
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        property: expense.property?._id || expense.property || '',
        expenseType: expense.expenseType || 'Company',
        category: expense.category || '',
        amount: expense.amount || '',
        mode: expense.mode || 'Cash',
        vendorName: expense.vendorName || '',
        remarks: expense.remarks || '',
        billFile: null
      })
    } else {
      setEditingExpense(null)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        property: '',
        expenseType: 'Company',
        category: '',
        amount: '',
        mode: 'Cash',
        vendorName: '',
        remarks: '',
        billFile: null
      })
    }
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingExpense(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      property: '',
      expenseType: 'Company',
      category: '',
      amount: '',
      mode: 'Cash',
      vendorName: '',
      remarks: '',
      billFile: null
    })
  }

  const handleSubmit = async () => {
    try {
      if (!formData.category || !formData.amount || !formData.vendorName) {
        toast.error('Please fill all required fields')
        return
      }

      if (formData.expenseType === 'Property' && !formData.property) {
        toast.error('Please select a property for property expenses')
        return
      }

      const submitData = new FormData()
      submitData.append('date', formData.date)
      submitData.append('expenseType', formData.expenseType)
      if (formData.property) {
        submitData.append('property', formData.property)
      }
      submitData.append('category', formData.category)
      submitData.append('amount', formData.amount)
      submitData.append('mode', formData.mode)
      submitData.append('vendorName', formData.vendorName)
      submitData.append('remarks', formData.remarks)
      if (formData.billFile) {
        submitData.append('billFile', formData.billFile)
      }

      if (editingExpense) {
        await axios.put(`/expenses/${editingExpense._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Expense updated successfully')
      } else {
        await axios.post('/expenses', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Expense added successfully')
      }

      fetchExpenses()
      handleCancelForm()
    } catch (error) {
      console.error('Error saving expense:', error)
      toast.error(error.response?.data?.message || 'Failed to save expense')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return

    try {
      await axios.delete(`/expenses/${id}`)
      toast.success('Expense deleted successfully')
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    }
  }

  const getFilteredExpenses = () => {
    return expenses.filter(exp => {
      const propertyMatch = filterProperty === 'all' || 
        (filterProperty === 'none' && !exp.property) ||
        (exp.property?._id === filterProperty || exp.property === filterProperty)
      const expenseTypeMatch = filterExpenseType === 'all' || exp.expenseType === filterExpenseType
      const categoryMatch = filterCategory === 'all' || exp.category === filterCategory
      const modeMatch = filterMode === 'all' || exp.mode === filterMode
      return propertyMatch && expenseTypeMatch && categoryMatch && modeMatch
    })
  }

  const filteredExpenses = getFilteredExpenses()

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Accounts & Expenses
        </Typography>
        {!showForm && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleShowForm()}
          >
            Add Expense
          </Button>
        )}
      </Box>

      {/* Inline Add/Edit Form */}
      <Collapse in={showForm}>
        <Card sx={{ mb: 4, border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </Typography>
              <IconButton onClick={handleCancelForm} size="small">
                <Close />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Expense Type</InputLabel>
                  <Select
                    value={formData.expenseType}
                    label="Expense Type"
                    onChange={(e) => setFormData({ ...formData, expenseType: e.target.value, property: e.target.value === 'Company' ? '' : formData.property })}
                  >
                    <MenuItem value="Company">Company Expenses</MenuItem>
                    <MenuItem value="Property">Property Expenses</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required={formData.expenseType === 'Property'} disabled={formData.expenseType === 'Company'}>
                  <InputLabel>Select Property</InputLabel>
                  <Select
                    value={formData.property}
                    label="Select Property"
                    onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                  >
                    <MenuItem value="">None</MenuItem>
                    {properties.map(prop => (
                      <MenuItem key={prop._id} value={prop._id}>{prop.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Mode</InputLabel>
                  <Select
                    value={formData.mode}
                    label="Payment Mode"
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  >
                    {PAYMENT_MODES.map(mode => (
                      <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vendor Name"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<AttachFile />}
                  sx={{ height: '56px' }}
                >
                  {formData.billFile ? formData.billFile.name : 'Upload Bill/Invoice'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFormData({ ...formData, billFile: e.target.files[0] })}
                  />
                </Button>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={handleCancelForm}
                    startIcon={<Close />}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    startIcon={<Save />}
                  >
                    {editingExpense ? 'Update' : 'Save'} Expense
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
                  <Typography variant="h5" fontWeight="bold">₹{stats.total.toLocaleString()}</Typography>
                </Box>
                <AccountBalance color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">Cash</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{stats.cash.toLocaleString()}</Typography>
                </Box>
                <Receipt color="success" sx={{ fontSize: 35 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">UPI</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{stats.upi.toLocaleString()}</Typography>
                </Box>
                <TrendingUp color="info" sx={{ fontSize: 35 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">Bank</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{stats.bank.toLocaleString()}</Typography>
                </Box>
                <AccountBalance color="warning" sx={{ fontSize: 35 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">Company</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{stats.company.toLocaleString()}</Typography>
                </Box>
                <TrendingDown color="error" sx={{ fontSize: 35 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">Property</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{stats.property.toLocaleString()}</Typography>
                </Box>
                <Receipt color="secondary" sx={{ fontSize: 35 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Expense Type</InputLabel>
                <Select
                  value={filterExpenseType}
                  label="Expense Type"
                  onChange={(e) => setFilterExpenseType(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="Company">Company</MenuItem>
                  <MenuItem value="Property">Property</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Property</InputLabel>
                <Select
                  value={filterProperty}
                  label="Property"
                  onChange={(e) => setFilterProperty(e.target.value)}
                >
                  <MenuItem value="all">All Properties</MenuItem>
                  <MenuItem value="none">No Property</MenuItem>
                  {properties.map(prop => (
                    <MenuItem key={prop._id} value={prop._id}>{prop.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  label="Category"
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={filterMode}
                  label="Payment Mode"
                  onChange={(e) => setFilterMode(e.target.value)}
                >
                  <MenuItem value="all">All Modes</MenuItem>
                  {PAYMENT_MODES.map(mode => (
                    <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Expense List ({filteredExpenses.length})</Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table sx={{ '& td, & th': { border: '1px solid #000' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Date</TableCell>
                      <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Expense Type</TableCell>
                      <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Property</TableCell>
                      <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Category</TableCell>
                      <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Vendor</TableCell>
                      <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Amount</TableCell>
                      <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Mode</TableCell>
                      <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Bill</TableCell>
                      <TableCell sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white', fontWeight: 'bold', border: '1px solid #000' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredExpenses
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((expense) => (
                        <TableRow key={expense._id} hover>
                          <TableCell>{new Date(expense.date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>
                            <Chip
                              label={expense.expenseType}
                              color={expense.expenseType === 'Company' ? 'primary' : 'secondary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{expense.property?.name || '-'}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>{expense.vendorName}</TableCell>
                          <TableCell>
                            <Typography fontWeight="bold">₹{expense.amount.toLocaleString()}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={expense.mode} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            {expense.billUrl ? (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => window.open(`${axios.defaults.baseURL}${expense.billUrl}`, '_blank')}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Bill Not Uploaded
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleShowForm(expense)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(expense._id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredExpenses.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10))
                  setPage(0)
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default ExpenseManagement
