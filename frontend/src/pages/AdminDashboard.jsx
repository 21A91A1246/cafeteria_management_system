import React, { useState, useEffect } from 'react';
// import { Box, Container, Typography, Tab, Tabs, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Switch, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControlLabel, Chip, FormControl, InputLabel, Select, Checkbox } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import { menuAPI, orderAPI, paymentAPI } from '../services/api';
import Grid from '@mui/material/Grid';
import {
  Box,
  Container,
  Typography,
  Tab,
  Tabs,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Checkbox
} from '@mui/material';

const categories = ['Breakfast', 'Lunch', 'Snacks', 'Beverages'];
const orderStatuses = ['Placed', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'];

const statusColors = {
  'Placed': { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' },
  'Preparing': { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.2)' },
  'Ready for Pickup': { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', border: 'rgba(16, 185, 129, 0.2)' },
  'Completed': { bg: 'rgba(13, 148, 136, 0.1)', text: '#2dd4bf', border: 'rgba(13, 148, 136, 0.2)' },
  'Cancelled': { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: 'rgba(239, 68, 68, 0.2)' }
};

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // Menu Management State
  const [menuItems, setMenuItems] = useState([]);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [menuForm, setMenuForm] = useState({ itemName: '', category: 'Breakfast', description: '', price: '', availability: true, imageUrl: '', veg: true });
  
  // Order Management State
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ orderId: '', employeeName: '', menuItemName: '', status: '', todayOnly: false });

  // Payment Config State
  const [paymentConfig, setPaymentConfig] = useState({ upiId: 'canteen@upi', payeeName: 'Office Cafeteria' });
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    if (tabValue === 0) {
      fetchMenu();
    } else if (tabValue === 1) {
      fetchOrders();
    } else if (tabValue === 2) {
      fetchPaymentConfig();
    }
  }, [tabValue]);

  // --- MENU MANAGEMENT LOGIC ---
  const fetchMenu = async () => {
    try {
      const data = await menuAPI.getAllMenuAdmin();
      setMenuItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenMenuDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setMenuForm({ ...item });
    } else {
      setEditingItem(null);
      setMenuForm({ itemName: '', category: 'Breakfast', description: '', price: '', availability: true, imageUrl: '', veg: true });
    }
    setMenuDialogOpen(true);
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...menuForm,
        price: parseFloat(menuForm.price)
      };
      if (editingItem) {
        await menuAPI.updateMenuItem(editingItem.itemId, payload);
      } else {
        await menuAPI.createMenuItem(payload);
      }
      setMenuDialogOpen(false);
      fetchMenu();
    } catch (err) {
      console.error('Error saving item: ', err);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const updated = { ...item, availability: !item.availability };
      await menuAPI.updateMenuItem(item.itemId, updated);
      fetchMenu();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await menuAPI.deleteMenuItem(id);
        fetchMenu();
      } catch (e) {
        alert("Failed to delete menu item. It might be referenced in previous orders.");
      }
    }
  };

  // --- ORDER MANAGEMENT LOGIC ---
  const fetchOrders = async () => {
    try {
      const data = await orderAPI.getAllOrdersAdmin(filters);
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderAPI.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetFilters = () => {
    setFilters({ orderId: '', employeeName: '', menuItemName: '', status: '', todayOnly: false });
  };

  const fetchPaymentConfig = async () => {
    try {
      const data = await paymentAPI.getPaymentConfig();
      setPaymentConfig(data);
    } catch (e) {
      console.error("Failed to load payment config", e);
    }
  };

  const handleSavePaymentConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const saved = await paymentAPI.savePaymentConfig(paymentConfig);
      setPaymentConfig(saved);
      alert("Payment configurations saved successfully!");
    } catch (e) {
      console.error("Failed to save payment config", e);
      alert("Failed to save configurations. Please try again.");
    } finally {
      setSavingConfig(false);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Box sx={{ minHeight: '90vh', bgcolor: '#0f172a', color: '#fff', py: 6 }}>
      <Container maxWidth="lg">
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            Cafeteria Administration
          </Typography>
          <Tabs 
            value={tabValue} 
            onChange={(e, val) => setTabValue(val)}
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#f59e0b', height: '3px' },
              '& .MuiTab-root': { 
                color: '#94a3b8', 
                fontWeight: 700,
                '&.Mui-selected': { color: '#f59e0b' }
              }
            }}
          >
            <Tab label="Menu Catalog" />
            <Tab label="Live Orders" />
            <Tab label="Payment Settings" />
          </Tabs>
        </Box>

        {/* Tab 0: MENU CATALOG */}
        {tabValue === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenMenuDialog()}
                sx={{
                  bgcolor: '#f59e0b',
                  backgroundImage: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  borderRadius: 2.5,
                  '&:hover': { bgcolor: '#d97706' }
                }}
              >
                Add Menu Item
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ 
              borderRadius: 4, 
              bgcolor: 'rgba(30, 41, 59, 0.7)', 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
              '& .MuiTableCell-root': { borderColor: 'rgba(255, 255, 255, 0.05)', color: '#fff' }
            }}>
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Available</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {menuItems.map((item) => (
                    <TableRow key={item.itemId} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: item.veg ? '#22c55e' : '#ef4444', 
                            boxShadow: `0 0 8px ${item.veg ? '#22c55e' : '#ef4444'}` 
                          }} />
                          <Typography sx={{ fontWeight: 700, color: '#fff' }}>{item.itemName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.category} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)', color: '#e2e8f0', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.description}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#f59e0b' }}>
                        ₹{item.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.availability}
                          onChange={() => handleToggleAvailability(item)}
                          color="warning"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleOpenMenuDialog(item)} sx={{ color: '#38bdf8', mr: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteItem(item.itemId)} sx={{ color: '#ef4444' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 1: LIVE ORDERS */}
        {tabValue === 1 && (
          <Box>
            {/* Advanced Filters Panel */}
            <Paper sx={{
              p: 3,
              mb: 4,
              borderRadius: 4,
              bgcolor: 'rgba(30, 41, 59, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: '#fff'
            }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    placeholder="Search Employee..."
                    fullWidth
                    size="small"
                    value={filters.employeeName}
                    onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })}
                    sx={{ input: { color: '#fff' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField
                    placeholder="Order ID..."
                    fullWidth
                    size="small"
                    value={filters.orderId}
                    onChange={(e) => setFilters({ ...filters, orderId: e.target.value })}
                    sx={{ input: { color: '#fff' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#94a3b8' }}>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      sx={{ color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '& .MuiSvgIcon-root': { color: '#94a3b8' } }}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      {orderStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={filters.todayOnly} 
                        onChange={(e) => setFilters({ ...filters, todayOnly: e.target.checked })} 
                        color="warning" 
                      />
                    }
                    label="Today's Orders Only"
                    sx={{ color: '#e2e8f0' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2.5 }} sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={fetchOrders} startIcon={<FilterAltIcon />} sx={{ bgcolor: '#f59e0b', backgroundImage: 'linear-gradient(135deg, #f59e0b, #d97706)', '&:hover': { bgcolor: '#d97706' } }}>
                    Search
                  </Button>
                  <Button variant="outlined" onClick={handleResetFilters} startIcon={<RefreshIcon />} sx={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)' }}>
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Orders Table */}
            {orders.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Typography variant="h6" sx={{ color: '#64748b' }}>No live orders found</Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ 
                borderRadius: 4, 
                bgcolor: 'rgba(30, 41, 59, 0.7)', 
                border: '1px solid rgba(255, 255, 255, 0.05)',
                '& .MuiTableCell-root': { borderColor: 'rgba(255, 255, 255, 0.05)', color: '#fff' }
              }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Dishes</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => {
                      const statusStyle = statusColors[order.orderStatus] || statusColors['Placed'];
                      return (
                        <TableRow key={order.orderId} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' } }}>
                          <TableCell sx={{ fontWeight: 700 }}>#00{order.orderId}</TableCell>
                          <TableCell>{order.employeeName}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem' }}>{formatDate(order.orderDate)}</TableCell>
                          <TableCell sx={{ maxWidth: '250px' }}>
                            {order.orderItems.map((item, idx) => (
                              <Typography key={idx} variant="body2" sx={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                                • {item.itemName} <span style={{ color: '#f59e0b' }}>x{item.quantity}</span>
                              </Typography>
                            ))}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#f59e0b' }}>
                            ₹{order.totalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={order.orderStatus}
                              size="small"
                              sx={{
                                bgcolor: statusStyle.bg,
                                color: statusStyle.text,
                                borderColor: statusStyle.border,
                                borderWidth: 1,
                                borderStyle: 'solid',
                                fontWeight: 700
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {/* Sequential Status Transitions */}
                            {order.orderStatus === 'Placed' && (
                              <Button size="small" variant="contained" color="warning" onClick={() => handleStatusChange(order.orderId, 'Preparing')} sx={{ textTransform: 'none', mr: 1 }}>
                                Prepare
                              </Button>
                            )}
                            {order.orderStatus === 'Preparing' && (
                              <Button size="small" variant="contained" color="success" onClick={() => handleStatusChange(order.orderId, 'Ready for Pickup')} sx={{ textTransform: 'none', mr: 1 }}>
                                Ready
                              </Button>
                            )}
                            {order.orderStatus === 'Ready for Pickup' && (
                              <Button size="small" variant="contained" color="info" onClick={() => handleStatusChange(order.orderId, 'Completed')} sx={{ textTransform: 'none', mr: 1 }}>
                                Complete
                              </Button>
                            )}
                            
                            {/* Cancel Option for non-finished orders */}
                            {['Placed', 'Preparing', 'Ready for Pickup'].includes(order.orderStatus) && (
                              <Button size="small" variant="outlined" color="error" onClick={() => handleStatusChange(order.orderId, 'Cancelled')} sx={{ textTransform: 'none' }}>
                                Cancel
                              </Button>
                            )}
                            
                            {['Completed', 'Cancelled'].includes(order.orderStatus) && (
                              <Typography variant="caption" sx={{ color: '#475569' }}>Archived</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* DIALOG FOR MENU ITEM CREATION / EDIT */}
        <Dialog 
          open={menuDialogOpen} 
          onClose={() => setMenuDialogOpen(false)}
          PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </DialogTitle>
          <form onSubmit={handleSaveMenuItem}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: '320px', pt: 1 }}>
              <TextField
                label="Item Name" fullWidth required value={menuForm.itemName}
                onChange={(e) => setMenuForm({ ...menuForm, itemName: e.target.value })}
                sx={{ input: { color: '#fff' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }}
              />
              <TextField
                select
                label="Category"
                fullWidth
                required
                value={menuForm.category}
                onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '& .MuiSvgIcon-root': { color: '#94a3b8' } }}
              >
                {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField
                label="Price (₹)"
                type="number"
                inputProps={{ step: '0.01', min: '0.1' }}
                fullWidth
                required
                value={menuForm.price}
                onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                sx={{ input: { color: '#fff' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }}
              />
              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                value={menuForm.description}
                onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }}
              />
              <TextField
                label="Image URL"
                fullWidth
                value={menuForm.imageUrl}
                onChange={(e) => setMenuForm({ ...menuForm, imageUrl: e.target.value })}
                sx={{ input: { color: '#fff' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={menuForm.veg}
                    onChange={(e) => setMenuForm({ ...menuForm, veg: e.target.checked })}
                    color="success"
                  />
                }
                label={menuForm.veg ? "Vegetarian (Veg)" : "Non-Vegetarian (Non-Veg)"}
                sx={{ color: '#e2e8f0' }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={menuForm.availability}
                    onChange={(e) => setMenuForm({ ...menuForm, availability: e.target.checked })}
                    color="warning"
                  />
                }
                label="Available immediately"
                sx={{ color: '#e2e8f0' }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setMenuDialogOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}>Save</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Tab 2: PAYMENT SETTINGS */}
        {tabValue === 2 && (
          <Box>
            <Paper sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: '#fff',
              maxWidth: '600px',
              mx: 'auto'
            }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
                UPI Payment Settings
              </Typography>
              
              <Box component="form" onSubmit={handleSavePaymentConfig} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Payee UPI ID"
                  required
                  fullWidth
                  placeholder="e.g. cafeteria@okaxis"
                  value={paymentConfig.upiId}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, upiId: e.target.value })}
                  sx={{ input: { color: '#fff' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }}
                  helperText="This is the UPI address where employee payments will be transferred."
                  FormHelperTextProps={{ sx: { color: '#64748b' } }}
                />

                <TextField
                  label="Merchant / Payee Name"
                  required
                  fullWidth
                  placeholder="e.g. Office Cafeteria"
                  value={paymentConfig.payeeName}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, payeeName: e.target.value })}
                  sx={{ input: { color: '#fff' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }}
                  helperText="The business name displayed to the user during checkout."
                  FormHelperTextProps={{ sx: { color: '#64748b' } }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', mt: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 2, fontWeight: 700 }}>
                    PREVIEW GENERATED UPI QR CODE
                  </Typography>
                  <Box 
                    component="img" 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${paymentConfig.upiId || 'canteen@upi'}&pn=${paymentConfig.payeeName || 'Office Cafeteria'}&cu=INR`)}`}
                    alt="UPI QR Code Preview"
                    sx={{ bgcolor: '#fff', p: 1.5, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
                  />
                  <Typography variant="caption" sx={{ color: '#64748b', mt: 2, textAlign: 'center' }}>
                    A scan-to-pay QR code will dynamically render for employees matching these credentials.
                  </Typography>
                </Box>

                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={savingConfig}
                  sx={{ 
                    mt: 2, 
                    py: 1.5, 
                    borderRadius: 2.5, 
                    fontWeight: 700, 
                    bgcolor: '#f59e0b', 
                    backgroundImage: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    '&:hover': { bgcolor: '#d97706' } 
                  }}
                >
                  {savingConfig ? 'Saving Settings...' : 'Save Settings'}
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

      </Container>
    </Box>
  );
};

export default AdminDashboard;
