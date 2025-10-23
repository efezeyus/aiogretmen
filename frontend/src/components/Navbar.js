import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Ana Sayfa', path: '/' },
    { text: 'Özellikler', path: '/features' },
    { text: 'Fiyatlandırma', path: '/pricing' },
    { text: 'Hakkımızda', path: '/about' },
    { text: 'İletişim', path: '/contact' },
  ];

  const featureSubmenu = [
    { text: 'AI Öğrenme', path: '/features/ai-learning' },
    { text: 'Gamifikasyon', path: '/features/gamification' },
    { text: 'Blockchain Sertifikalar', path: '/features/blockchain' },
    { text: 'Adaptif Öğrenme', path: '/features/adaptive-learning' },
    { text: 'Veli Paneli', path: '/features/parent-dashboard' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleFeaturesClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const drawer = (
    <Box sx={{ width: 250, pt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2 }}>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              onClick={handleDrawerToggle}
            >
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/login"
            onClick={handleDrawerToggle}
          >
            <ListItemText primary="Giriş Yap" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" 
        sx={{ 
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <SchoolIcon sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }} />
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                flexGrow: { xs: 1, md: 0 },
                mr: { md: 4 },
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 700,
              }}
            >
              Yapay Zeka Öğretmen
            </Typography>

            {/* Desktop Menu */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {menuItems.map((item) => (
                item.text === 'Özellikler' ? (
                  <Box key={item.path}>
                    <Button
                      color="inherit"
                      onClick={handleFeaturesClick}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      {item.text}
                    </Button>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleCloseMenu}
                    >
                      {featureSubmenu.map((subItem) => (
                        <MenuItem
                          key={subItem.path}
                          onClick={() => {
                            navigate(subItem.path);
                            handleCloseMenu();
                          }}
                        >
                          {subItem.text}
                        </MenuItem>
                      ))}
                    </Menu>
                  </Box>
                ) : (
                  <Button
                    key={item.path}
                    component={RouterLink}
                    to={item.path}
                    color="inherit"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    {item.text}
                  </Button>
                )
              ))}
            </Box>

            {/* Desktop Login Button */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
              <Button
                component={RouterLink}
                to="/demo"
                variant="outlined"
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Demo
              </Button>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                startIcon={<LoginIcon />}
                sx={{
                  backgroundColor: 'white',
                  color: '#1e3c72',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              >
                Giriş Yap
              </Button>
            </Box>

            {/* Mobile Menu Button */}
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar; 