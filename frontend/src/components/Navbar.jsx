import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip, Avatar, Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name') || 'User';
  const department = localStorage.getItem('department') || 'General';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!token) return null; // Don't show navbar if not logged in

  const isAdmin = role === 'ROLE_ADMIN';

  return (
    <AppBar position="sticky" sx={{ 
      background: 'rgba(30, 41, 59, 0.9)', 
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        
        {/* Brand / Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(isAdmin ? '/admin' : '/')}>
          <RestaurantMenuIcon sx={{ mr: 1.5, color: '#f59e0b', fontSize: '2rem' }} />
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 800, 
            letterSpacing: '0.5px',
            background: 'linear-gradient(45deg, #f59e0b, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: { xs: 'none', sm: 'block' }
          }}>
            Cafeteria Hub
          </Typography>
        </Box>

        {/* Navigation Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isAdmin ? (
            <>
              <Button 
                startIcon={<RestaurantMenuIcon />} 
                onClick={() => navigate('/')}
                sx={{ 
                  color: location.pathname === '/' ? '#f59e0b' : '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                Browse Menu
              </Button>
              <Button 
                startIcon={<HistoryIcon />} 
                onClick={() => navigate('/history')}
                sx={{ 
                  color: location.pathname === '/history' ? '#f59e0b' : '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                My Orders
              </Button>
            </>
          ) : (
            <>
              <Button 
                startIcon={<DashboardIcon />} 
                onClick={() => navigate('/admin')}
                sx={{ 
                  color: location.pathname === '/admin' ? '#f59e0b' : '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                Admin Panel
              </Button>
              <Button 
                startIcon={<AssessmentIcon />} 
                onClick={() => navigate('/reports')}
                sx={{ 
                  color: location.pathname === '/reports' ? '#f59e0b' : '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                Analytics
              </Button>
              <Button 
                startIcon={<RestaurantMenuIcon />} 
                onClick={() => navigate('/menu-view')}
                sx={{ 
                  color: location.pathname === '/menu-view' ? '#f59e0b' : '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                View Catalog
              </Button>
            </>
          )}
        </Box>

        {/* User Info & Logout */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-end' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
              {name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              {department} • {isAdmin ? 'Admin' : 'Employee'}
            </Typography>
          </Box>
          
          <Chip 
            icon={<AccountCircleIcon style={{ color: '#f59e0b' }} />} 
            label={isAdmin ? "Admin" : department} 
            size="small" 
            sx={{ 
              bgcolor: 'rgba(245, 158, 11, 0.1)', 
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              fontWeight: 600
            }} 
          />

          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} sx={{ 
              color: '#ef4444', 
              bgcolor: 'rgba(239, 68, 68, 0.1)', 
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' } 
            }}>
              <LogoutIcon size="small" />
            </IconButton>
          </Tooltip>
        </Box>

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
