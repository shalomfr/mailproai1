import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
} from '@mui/material';
import {
  Email as EmailIcon,
  AccountCircle as AccountIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    navigate('/login');
  };

  const isMenuOpen = Boolean(anchorEl);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            מנהל חשבונות מייל
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              startIcon={<DashboardIcon />}
              onClick={() => navigate('/dashboard')}
            >
              לוח בקרה
            </Button>
            
            <Button
              color="inherit"
              startIcon={<EmailIcon />}
              onClick={() => navigate('/accounts')}
            >
              חשבונות מייל
            </Button>
            
            <Button
              color="inherit"
              startIcon={<AddIcon />}
              onClick={() => navigate('/accounts/add')}
            >
              הוסף חשבון
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <Typography variant="body2">
              שלום, {user?.firstName || user?.username || 'משתמש'}
            </Typography>
            <IconButton
              size="large"
              edge="end"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <AccountIcon sx={{ mr: 2 }} />
          פרופיל
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 2 }} />
          יציאה
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Navbar; 