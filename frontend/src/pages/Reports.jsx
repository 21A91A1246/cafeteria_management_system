import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, Button, Paper, Divider, LinearProgress } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GetAppIcon from '@mui/icons-material/GetApp';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { reportAPI } from '../services/api';
import Chip from "@mui/material/Chip";

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const data = await reportAPI.getSalesReport();
      setReportData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    
    // Build CSV contents
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Office Cafeteria Sales Report\n\n";
    csvContent += `Generated On,${new Date().toLocaleString()}\n`;
    csvContent += `Total Orders,${reportData.totalOrders}\n`;
    csvContent += `Total Revenue,${reportData.totalRevenue.toFixed(2)}\n`;
    csvContent += `Average Order Value,${reportData.averageOrderValue.toFixed(2)}\n`;
    csvContent += `Cancelled Orders,${reportData.cancelledOrders}\n\n`;
    
    csvContent += "Orders By Category\n";
    Object.entries(reportData.ordersByCategory).forEach(([cat, val]) => {
      csvContent += `${cat},${val}\n`;
    });
    
    csvContent += "\nMost Popular Items\n";
    reportData.mostOrderedItems.forEach((item, idx) => {
      csvContent += `${idx + 1}. ${item}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cafeteria_sales_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '90vh', bgcolor: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6">Generating analytics dashboard...</Typography>
      </Box>
    );
  }

  if (!reportData) {
    return (
      <Box sx={{ minHeight: '90vh', bgcolor: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="error">Failed to generate reports. Ensure all services are running.</Typography>
      </Box>
    );
  }

  const categoryMax = Math.max(...Object.values(reportData.ordersByCategory), 1);
  const hourMax = Math.max(...Object.values(reportData.peakOrderingHours), 1);

  return (
    <Box sx={{ minHeight: '90vh', bgcolor: '#0f172a', color: '#fff', py: 6 }}>
      <Container maxWidth="lg">
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon sx={{ color: '#f59e0b', fontSize: '2.2rem', mr: 1.5 }} />
              Sales & Demand Analytics
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
              Aggregated real-time metrics across all active cafeteria services
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<GetAppIcon />}
            onClick={handleExportCSV}
            sx={{
              bgcolor: '#f59e0b',
              backgroundImage: 'linear-gradient(135deg, #f59e0b, #d97706)',
              fontWeight: 700,
              px: 3,
              py: 1.2,
              borderRadius: 2.5,
              textTransform: 'none',
              '&:hover': { bgcolor: '#d97706' }
            }}
          >
            Export Daily Report (.CSV)
          </Button>
        </Box>

        {/* Metric Cards Grid */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          
          {/* Total Orders */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#fff', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 600, mb: 1 }}>TOTAL ORDERS</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{reportData.totalOrders}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, color: '#34d399' }}>
                  <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>+12.5% demand today</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Revenue */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#fff', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 600, mb: 1 }}>TOTAL REVENUE</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#34d399' }}>₹{reportData.totalRevenue.toFixed(2)}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, color: '#34d399' }}>
                  <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Active Sales Channels</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Avg Order Value */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#fff', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 600, mb: 1 }}>AVERAGE BASKET</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#f59e0b' }}>₹{reportData.averageOrderValue.toFixed(2)}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, color: '#94a3b8' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Average value per checkout</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Cancelled Orders */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#fff', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 600, mb: 1 }}>CANCELLATIONS</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#f87171' }}>{reportData.cancelledOrders}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, color: '#f87171' }}>
                  {reportData.cancelledOrders > 0 ? (
                    <>
                      <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Needs workflow check</Typography>
                    </>
                  ) : (
                    <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600 }}>Zero wastage target reached</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts & Analytics Visuals */}
        <Grid container spacing={4}>
          
          {/* Category distribution */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#fff', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                <RestaurantIcon sx={{ mr: 1, color: '#f59e0b' }} />
                Demand by Food Category
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                {Object.entries(reportData.ordersByCategory).map(([cat, val]) => {
                  const percent = (val / categoryMax) * 100;
                  return (
                    <Box key={cat}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{cat}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#f59e0b' }}>{val} items ordered</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={percent} 
                        sx={{
                          height: 8, 
                          borderRadius: 4, 
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          '& .MuiLinearProgress-bar': { 
                            bgcolor: cat === 'Breakfast' ? '#60a5fa' : cat === 'Lunch' ? '#34d399' : cat === 'Snacks' ? '#fbbf24' : '#f472b6' 
                          }
                        }} 
                      />
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Grid>

          {/* Popular Menu Items */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#fff', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1, color: '#f59e0b' }} />
                Top 5 Most Popular Dishes
              </Typography>

              {reportData.mostOrderedItems.length === 0 ? (
                <Typography sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>No sales data available yet.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {reportData.mostOrderedItems.map((item, idx) => (
                    <Box key={idx} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 2, 
                      borderRadius: 2.5, 
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#f59e0b', width: 35 }}>
                        #{idx + 1}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, flexGrow: 1 }}>
                        {item}
                      </Typography>
                      <Chip label="High Demand" size="small" sx={{ bgcolor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', fontWeight: 600 }} />
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Peak hours analytics */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#fff' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon sx={{ mr: 1, color: '#f59e0b' }} />
                Peak Ordering Hours (Demand Timeline)
              </Typography>

              {/* Simple SVG Chart to display peak hours */}
              <Box sx={{ width: '100%', height: '240px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', pt: 3, px: 2 }}>
                {Object.entries(reportData.peakOrderingHours).map(([hour, val]) => {
                  const heightPercent = (val / hourMax) * 150 + 20; // range 20px to 170px
                  const hourLabel = parseInt(hour) > 12 ? `${parseInt(hour) - 12} PM` : parseInt(hour) === 12 ? '12 PM' : `${hour} AM`;

                  return (
                    <Box key={hour} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, mx: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700, mb: 1 }}>{val}</Typography>
                      <Box sx={{ 
                        width: '100%', 
                        maxWidth: '45px', 
                        height: `${heightPercent}px`, 
                        borderRadius: '6px 6px 0 0',
                        backgroundImage: val > 0 ? 'linear-gradient(to top, #d97706, #fbbf24)' : 'none',
                        bgcolor: val > 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'height 0.3s ease'
                      }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1.5, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {hourLabel}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default Reports;
