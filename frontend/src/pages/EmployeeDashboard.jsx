
import { Box, Container, Typography, Grid, Card, CardMedia,Dialog,DialogTitle ,DialogContent ,DialogActions , CardContent, CardActions, Button, Tabs, Tab, TextField, InputAdornment, Drawer, List, ListItem, ListItemText, Divider, IconButton, Badge, Alert, Snackbar, Paper, FormControl, Select, MenuItem, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { menuAPI, orderAPI, paymentAPI } from '../services/api';
import { useState,useEffect } from 'react';

const categories = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Beverages'];

const EmployeeDashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', severity: 'success' });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [vegFilter, setVegFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('none');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({ upiId: 'canteen@upi', payeeName: 'Office Cafeteria' });

  const employeeName = localStorage.getItem('name') || 'Employee';

  useEffect(() => {
    fetchMenu();
    // Load cached cart if any
    const cachedCart = localStorage.getItem('cart');
    if (cachedCart) {
      try {
        setCart(JSON.parse(cachedCart));
      } catch (e) {}
    }
    fetchPaymentConfig();
  }, []);

  const fetchPaymentConfig = async () => {
    try {
      const config = await paymentAPI.getPaymentConfig();
      setPaymentConfig(config);
    } catch (e) {
      console.error("Failed to load payment config", e);
    }
  };

  const fetchMenu = async () => {
    try {
      const data = await menuAPI.getAvailableMenu();
      setMenuItems(data);
      setFilteredItems(data);
    } catch (err) {
      showToast('Failed to load menu items. Please refresh.', 'error');
    }
  };

  useEffect(() => {
    // Filter items based on category, search query, and veg flag
    let temp = [...menuItems];
    
    if (selectedCategory > 0) {
      const categoryName = categories[selectedCategory];
      temp = temp.filter(item => item.category.toLowerCase() === categoryName.toLowerCase());
    }

    if (search.trim() !== '') {
      temp = temp.filter(item => item.itemName.toLowerCase().includes(search.toLowerCase()));
    }

    if (vegFilter === 'veg') {
      temp = temp.filter(item => item.veg === true);
    } else if (vegFilter === 'nonveg') {
      temp = temp.filter(item => item.veg === false);
    }

    // Apply Price Sorting
    if (priceSort === 'asc') {
      temp.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'desc') {
      temp.sort((a, b) => b.price - a.price);
    }

    setFilteredItems(temp);
  }, [search, selectedCategory, vegFilter, priceSort, menuItems]);

  const showToast = (text, severity = 'success') => {
    setMessage({ text, severity });
    setSnackbarOpen(true);
  };

  const handleAddToCart = (item) => {
    const existing = cart.find(c => c.itemId === item.itemId);
    let newCart;
    if (existing) {
      newCart = cart.map(c => c.itemId === item.itemId ? { ...c, quantity: c.quantity + 1 } : c);
    } else {
      newCart = [...cart, { ...item, quantity: 1 }];
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    showToast(`Added ₹{item.itemName} to cart`);
  };

  const handleUpdateQty = (itemId, amount) => {
    const existing = cart.find(c => c.itemId === itemId);
    if (!existing) return;

    let newCart;
    if (existing.quantity + amount <= 0) {
      newCart = cart.filter(c => c.itemId !== itemId);
    } else {
      newCart = cart.map(c => c.itemId === itemId ? { ...c, quantity: c.quantity + amount } : c);
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const handleRemoveFromCart = (itemId) => {
    const newCart = cart.filter(c => c.itemId !== itemId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    
    // Map cart items to payload format
    const payloadItems = cart.map(item => ({
      menuItemId: item.itemId,
      quantity: item.quantity
    }));

    try {
      const createdOrder = await orderAPI.placeOrder(employeeName, payloadItems);
      // Open simulated payment dialog
      setPaymentOrderId(createdOrder.orderId);
      setPaymentAmount(createdOrder.totalAmount);
      setPaymentDialogOpen(true);
      setCartOpen(false); // Close cart drawer
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setPaymentProcessing(true);
    try {
      await paymentAPI.processPayment(paymentOrderId, paymentAmount, paymentMethod);
      showToast(`Payment of ₹${paymentAmount} successful! Order #${paymentOrderId} placed.`, 'success');
      // Clear cart
      setCart([]);
      localStorage.removeItem('cart');
      setPaymentDialogOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment processing failed. Please try again.', 'error');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <Box sx={{ minHeight: '90vh', bgcolor: '#0f172a', color: '#fff', pb: 8 }}>
      
      {/* Banner / Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
        py: 6,
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        textAlign: 'center'
      }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
            What would you like to eat, <span style={{ color: '#f59e0b' }}>{employeeName}</span>?
          </Typography>
          <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 400 }}>
            Browse today's available meals and order instantly
          </Typography>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        
        {/* Filters and Search */}
        <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Tabs 
              value={selectedCategory} 
              onChange={(e, val) => setSelectedCategory(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTabs-indicator': { bgcolor: '#f59e0b', height: '3px' },
                '& .MuiTab-root': { 
                  color: '#94a3b8', 
                  fontWeight: 600,
                  fontSize: '1rem',
                  '&.Mui-selected': { color: '#f59e0b' }
                }
              }}
            >
              {categories.map((cat, idx) => (
                <Tab key={cat} label={cat} id={`category-tab-${idx}`} />
              ))}
            </Tabs>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  borderRadius: 3,
                  bgcolor: 'rgba(30, 41, 59, 0.6)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                }
              }}
            />
          </Grid>
        </Grid>

        {/* Additional Filters and Sorting */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 4, mt: -2 }}>
          {/* Diet Filters (Buttons/Toggle) */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[
              { id: 'all', label: 'All Dishes' },
              { id: 'veg', label: 'Veg Only' },
              { id: 'nonveg', label: 'Non-Veg Only' }
            ].map(pref => {
              const active = vegFilter === pref.id;
              return (
                <Button
                  key={pref.id}
                  variant={active ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setVegFilter(pref.id)}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2.5,
                    py: 0.75,
                    bgcolor: active ? (pref.id === 'veg' ? 'rgba(34, 197, 94, 0.2)' : pref.id === 'nonveg' ? 'rgba(239, 68, 68, 0.2)' : '#f59e0b') : 'transparent',
                    color: active ? (pref.id === 'veg' ? '#4ade80' : pref.id === 'nonveg' ? '#f87171' : '#fff') : '#94a3b8',
                    borderColor: active ? (pref.id === 'veg' ? '#22c55e' : pref.id === 'nonveg' ? '#ef4444' : '#f59e0b') : 'rgba(255, 255, 255, 0.08)',
                    '&:hover': {
                      bgcolor: active ? (pref.id === 'veg' ? 'rgba(34, 197, 94, 0.3)' : pref.id === 'nonveg' ? 'rgba(239, 68, 68, 0.3)' : '#d97706') : 'rgba(255,255,255,0.05)',
                      borderColor: active ? (pref.id === 'veg' ? '#22c55e' : pref.id === 'nonveg' ? '#ef4444' : '#f59e0b') : 'rgba(255, 255, 255, 0.2)',
                    }
                  }}
                >
                  {pref.id === 'veg' && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', mr: 1, boxShadow: '0 0 6px #22c55e' }} />
                  )}
                  {pref.id === 'nonveg' && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ef4444', mr: 1, boxShadow: '0 0 6px #ef4444' }} />
                  )}
                  {pref.label}
                </Button>
              );
            })}
          </Box>

          {/* Price Sorting Selector */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: 2.5,
                color: '#fff',
                bgcolor: 'rgba(30, 41, 59, 0.6)',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                '& .MuiSvgIcon-root': { color: '#94a3b8' }
              }}
            >
              <MenuItem value="none">No Price Sorting</MenuItem>
              <MenuItem value="asc">Price: Low to High</MenuItem>
              <MenuItem value="desc">Price: High to Low</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Menu Grid */}
        {filteredItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" sx={{ color: '#64748b', mb: 2 }}>
              No dishes found matching your criteria.
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569' }}>
              Check back later or change your category filters.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {filteredItems.map((item) => (
              <Grid key={item.itemId} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  bgcolor: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)',
                    borderColor: 'rgba(245, 158, 11, 0.3)'
                  }
                }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={item.imageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500"}
                    alt={item.itemName}
                    sx={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                  />
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                        {item.itemName}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                        ₹{item.price.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={item.veg ? "VEG" : "NON-VEG"} 
                        size="small" 
                        sx={{ 
                          bgcolor: item.veg ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                          color: item.veg ? '#4ade80' : '#f87171', 
                          border: `1px solid ${item.veg ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          fontWeight: 700, 
                          fontSize: '0.65rem',
                          borderRadius: 1.5
                        }} 
                      />
                      <Chip 
                        label={item.category} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255, 255, 255, 0.05)', 
                          color: '#94a3b8', 
                          fontWeight: 600, 
                          fontSize: '0.65rem',
                          borderRadius: 1.5
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', minHeight: '40px' }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      startIcon={<AddIcon />}
                      onClick={() => handleAddToCart(item)}
                      sx={{
                        color: '#f59e0b',
                        borderColor: '#f59e0b',
                        borderRadius: 2.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: 'rgba(245, 158, 11, 0.1)',
                          borderColor: '#f59e0b'
                        }
                      }}
                    >
                      Add to Cart
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <Button
          onClick={() => setCartOpen(true)}
          variant="contained"
          sx={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            borderRadius: '50px',
            padding:'30px',
            px: 3,
            py: 1.5,
            bgcolor: '#f59e0b',
            boxShadow: '0 8px 30px rgba(245, 158, 11, 0.4)',
            backgroundImage: 'linear-gradient(135deg, #f59e0b, #d97706)',
            '&:hover': {
              bgcolor: '#d97706',
              boxShadow: '0 8px 30px rgba(245, 158, 11, 0.6)'
            }
          }}
        >
          <Badge badgeContent={cart.reduce((sum, item) => sum + item.quantity, 0)} color="error" sx={{ mr: 1.5 }}>
            <ShoppingCartIcon />
          </Badge>
          <Typography variant="button" sx={{ fontWeight: 700 }}>
            View Cart (₹{getCartTotal()})
          </Typography>
        </Button>
      )}

      {/* Cart Drawer */}
      <Drawer
  anchor="right"
  open={cartOpen}
  onClose={() => setCartOpen(false)}
  PaperProps={{
    sx: {
      width: { xs: "100%", sm: 420 },
      bgcolor: "#020617",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      borderLeft: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden",
    },
  }}
>
  {/* Header */}
  <Box
    sx={{
      px: 3,
      py: 2.5,
      borderBottom: "1px solid rgba(255,255,255,.08)",
      backdropFilter: "blur(15px)",
      bgcolor: "rgba(15,23,42,.95)",
      position: "sticky",
      top: 0,
      zIndex: 5,
    }}
  >
    <Typography
      variant="h5"
      sx={{
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <ShoppingCartIcon sx={{ color: "#f59e0b", fontSize: 30 }} />
      Your Cart
    </Typography>

    <Typography
      sx={{
        color: "#94a3b8",
        mt: 0.5,
        fontSize: 14,
      }}
    >
      {cart.length} Item{cart.length !== 1 && "s"}
    </Typography>
  </Box>

  {cart.length === 0 ? (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        px: 3,
      }}
    >
      <ShoppingCartIcon
        sx={{
          fontSize: 70,
          color: "#334155",
          mb: 2,
        }}
      />

      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 1,
        }}
      >
        Your cart is empty
      </Typography>

      <Typography
        sx={{
          color: "#64748b",
          textAlign: "center",
          mb: 3,
        }}
      >
        Looks like you haven't added anything yet.
      </Typography>

      <Button
        variant="contained"
        onClick={() => setCartOpen(false)}
        sx={{
          borderRadius: 3,
          bgcolor: "#f59e0b",
          px: 4,
          fontWeight: 700,
        }}
      >
        Browse Menu
      </Button>
    </Box>
  ) : (
    <>
      {/* Cart Items */}
      <List
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 2,
        }}
      >
        {cart.map((item) => (
          <Paper
            key={item.itemId}
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 4,
              background:
                "linear-gradient(145deg, rgba(30,41,59,.95), rgba(15,23,42,.95))",
              border: "1px solid rgba(255,255,255,.06)",
              transition: ".25s",
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: "rgba(245,158,11,.3)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 17,
                  }}
                >
                  {item.itemName}
                </Typography>

                <Typography
                  sx={{
                    color: "#94a3b8",
                    mt: 0.5,
                  }}
                >
                  ₹{item.price.toFixed(2)} each
                </Typography>
              </Box>

              <IconButton
                onClick={() => handleRemoveFromCart(item.itemId)}
                sx={{
                  color: "#ef4444",
                  bgcolor: "rgba(239,68,68,.08)",
                  "&:hover": {
                    bgcolor: "rgba(239,68,68,.18)",
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "#1e293b",
                  borderRadius: 999,
                  px: 0.5,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleUpdateQty(item.itemId, -1)}
                  sx={{ color: "#fff" }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>

                <Typography
                  sx={{
                    width: 30,
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  {item.quantity}
                </Typography>

                <IconButton
                  size="small"
                  onClick={() => handleUpdateQty(item.itemId, 1)}
                  sx={{ color: "#fff" }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 20,
                  color: "#f59e0b",
                }}
              >
                ₹{(item.price * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        ))}
      </List>

      {/* Footer */}
      <Box
        sx={{
          p: 3,
          borderTop: "1px solid rgba(255,255,255,.08)",
          bgcolor: "rgba(15,23,42,.98)",
          backdropFilter: "blur(15px)",
          position: "sticky",
          bottom: 0,
        }}
      >
        <Box
          sx={{display: "flex",justifyContent: "space-between",mb: 3,}}
        >
          <Typography sx={{color: "#cbd5e1",fontWeight: 600,}}>
            Total
          </Typography>

          <Typography
            sx={{fontWeight: 800,fontSize: 28,color: "#f59e0b",}}
          >
            ₹ {getCartTotal()}
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={handlePlaceOrder}
          disabled={loading}
          sx={{
            py: 1.8,
            borderRadius: 3,
            fontWeight: 700,
            fontSize: 16,
            textTransform: "none",
            background:
              "linear-gradient(135deg,#f59e0b,#d97706)",
            boxShadow: "0 10px 25px rgba(245,158,11,.35)",
            "&:hover": {
              background:
                "linear-gradient(135deg,#fbbf24,#d97706)",
            },
          }}
        >
          {loading ? "Placing Order..." : "Place Order"}
        </Button>
      </Box>
    </>
  )}
</Drawer>

      {/* Snackbar notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={message.severity} 
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {message.text}
        </Alert>
      </Snackbar>

      {/* SIMULATED PAYMENT DIALOG */}
      <Dialog
        open={paymentDialogOpen}
        onClose={paymentProcessing ? null : () => setPaymentDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: '#fff',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            maxWidth: '400px',
            width: '100%',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pb: 1, color: '#fff' }}>
          Secure Payment Portal
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)', p: 2.5, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.04)', textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
              TOTAL PAYABLE AMOUNT
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f59e0b' }}>
              ₹{paymentAmount}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 1 }}>
              Order Reference ID: #00{paymentOrderId}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600, mb: 1.5 }}>
              Select Payment Method
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={paymentProcessing}
                sx={{
                  color: '#fff',
                  borderRadius: 2.5,
                  bgcolor: 'rgba(30, 41, 59, 0.6)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                  '& .MuiSvgIcon-root': { color: '#94a3b8' }
                }}
              >
                <MenuItem value="UPI">Simulated UPI (Mock GPay/PhonePe)</MenuItem>
                <MenuItem value="Card">Simulated Credit/Debit Card</MenuItem>
                <MenuItem value="Wallet">Simulated Employee Meal Wallet</MenuItem>
                <MenuItem value="Cash">Cash on Counter</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {paymentMethod === 'Card' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <TextField 
                size="small" label="Card Number" placeholder="1234 5678 9876 5432" disabled 
                value="4321 •••• •••• 9876 (Simulated Card)"
                sx={{ input: { color: '#94a3b8' }, '& label': { color: '#64748b' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.05)' } }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                  size="small" label="Expiry" value="12/32" disabled 
                  sx={{ input: { color: '#94a3b8' }, '& label': { color: '#64748b' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.05)' } }}
                />
                <TextField 
                  size="small" label="CVV" value="***" disabled 
                  sx={{ input: { color: '#94a3b8' }, '& label': { color: '#64748b' }, '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.05)' } }}
                />
              </Box>
            </Box>
          )}

          {paymentMethod === 'UPI' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, borderRadius: 3, bgcolor: 'rgba(255, 255, 255, 0.01)', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
              <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1.5, fontWeight: 700 }}>
                SCAN THIS DYNAMIC QR CODE TO PAY
              </Typography>
              <Box 
                component="img" 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${paymentConfig.upiId}&pn=${paymentConfig.payeeName}&am=${paymentAmount}&cu=INR`)}`}
                alt="UPI Payment QR Code"
                sx={{ bgcolor: '#fff', p: 1.5, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
              />
              <Typography variant="caption" sx={{ color: '#64748b', mt: 2, textAlign: 'center' }}>
                Payee: {paymentConfig.payeeName} ({paymentConfig.upiId})
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, fontWeight: 600, textAlign: 'center' }}>
                Scan using any UPI app (GPay, PhonePe, BHIM)
              </Typography>
            </Box>
          )}

          {paymentMethod === 'Wallet' && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, borderRadius: 2.5, bgcolor: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>Balance: ₹500.00</Typography>
              <Chip label="WALLET ACTIVE" size="small" color="success" sx={{ fontSize: '0.65rem', fontWeight: 700, borderRadius: 1 }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, display: 'flex', gap: 1.5 }}>
          <Button 
            onClick={() => setPaymentDialogOpen(false)} 
            disabled={paymentProcessing}
            sx={{ 
              color: '#94a3b8', 
              flex: 1, 
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 2.5,
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmPayment} 
            disabled={paymentProcessing}
            variant="contained"
            sx={{ 
              flex: 2,
              borderRadius: 2.5,
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: '#22c55e',
              '&:hover': { bgcolor: '#16a34a' }
            }}
          >
            {paymentProcessing ? 'Processing Transaction...' : 'Pay & Complete Order'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default EmployeeDashboard;
