import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, Grid, Button, TextField, Divider, Paper, Chip, Collapse, IconButton } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { orderAPI } from '../services/api';

const statusColors = {
  'Placed': { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' },
  'Preparing': { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.2)' },
  'Ready for Pickup': { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', border: 'rgba(16, 185, 129, 0.2)' },
  'Completed': { bg: 'rgba(13, 148, 136, 0.1)', text: '#2dd4bf', border: 'rgba(13, 148, 136, 0.2)' },
  'Cancelled': { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: 'rgba(239, 68, 68, 0.2)' }
};

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (applyDates = false) => {
    setLoading(true);
    setError('');
    try {
      let startISO = null;
      let endISO = null;
      if (applyDates && startDate && endDate) {
        startISO = `${startDate}T00:00:00`;
        endISO = `${endDate}T23:59:59`;
      }
      const data = await orderAPI.getMyOrders(startISO, endISO);
      setOrders(data);
    } catch (err) {
      setError('Failed to fetch order history.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Please specify both start and end dates.');
      return;
    }
    fetchOrders(true);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setError('');
    fetchOrders(false);
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
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
      <Container maxWidth="md">
        
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, letterSpacing: '-0.5px' }}>
          My Order History
        </Typography>

        {/* Filters Panel */}
        <Paper component="form" onSubmit={handleFilter} sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          bgcolor: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          color: '#fff'
        }}>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, display: 'flex', alignItems: 'center' }}>
                <CalendarTodayIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> Start Date
              </Typography>
              <TextField
                type="date"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                    '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, display: 'flex', alignItems: 'center' }}>
                <CalendarTodayIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> End Date
              </Typography>
              <TextField
                type="date"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                    '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                startIcon={<FilterAltIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  bgcolor: '#f59e0b',
                  backgroundImage: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  '&:hover': { bgcolor: '#d97706' }
                }}
              >
                Filter
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleReset}
                startIcon={<RefreshIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  color: '#94a3b8',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  '&:hover': { 
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    bgcolor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
          {error && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
              {error}
            </Typography>
          )}
        </Paper>

        {/* Orders Listing */}
        {loading ? (
          <Typography sx={{ textAlign: 'center', my: 4 }}>Loading history...</Typography>
        ) : orders.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
              No orders found
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              When you order meals, they will appear here.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {orders.map((order) => {
              const statusStyle = statusColors[order.orderStatus] || statusColors['Placed'];
              const isExpanded = expandedOrder === order.orderId;

              return (
                <Card key={order.orderId} sx={{
                  borderRadius: 4,
                  bgcolor: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}>
                  <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                          ORDER ID
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#fff' }}>
                          #00{order.orderId}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                          ORDER DATE
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
                          {formatDate(order.orderDate)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                          TOTAL AMOUNT
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                          ₹{order.totalAmount.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 4, sm: 2 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'center' } }}>
                        <Chip
                          label={order.orderStatus}
                          size="small"
                          sx={{
                            bgcolor: statusStyle.bg,
                            color: statusStyle.text,
                            borderColor: statusStyle.border,
                            borderWidth: 1,
                            borderStyle: 'solid',
                            fontWeight: 700,
                            borderRadius: 1.5,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px'
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 2, sm: 1 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton onClick={() => toggleExpand(order.orderId)} sx={{ color: '#94a3b8' }}>
                          {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </Grid>
                    </Grid>

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 2, fontWeight: 700 }}>
                          ORDER ITEMS
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {order.orderItems.map((item, idx) => (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                                {item.itemName}{' '}
                                <span style={{ color: '#f59e0b', fontSize: '0.8rem', marginLeft: '6px' }}>
                                  x{item.quantity}
                                </span>
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 700 }}>
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>

                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                          <Typography variant="caption">Payment Status: <span style={{ color: '#fff', fontWeight: 600 }}>{order.paymentStatus}</span></Typography>
                          <Typography variant="caption">Total Quantity: <span style={{ color: '#fff', fontWeight: 600 }}>{order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span></Typography>
                        </Box>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default OrderHistory;
