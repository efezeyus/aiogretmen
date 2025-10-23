import React from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Link,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Psychology } from '@mui/icons-material';
import Footer from './Footer';

const AuthLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: theme.palette.grey[50],
      }}
    >
      {/* Üst Kısım - Logo */}
      <Box
        component="header"
        sx={{
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ color: 'primary.main', fontSize: 36, mr: 1 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 700,
              letterSpacing: '.1rem',
              color: 'primary.main',
              textDecoration: 'none',
            }}
          >
            Yapay Zeka Öğretmen
          </Typography>
        </Box>
        <Link
          component={RouterLink}
          to="/"
          variant="body2"
          sx={{ textDecoration: 'none', color: 'text.secondary' }}
        >
          Ana Sayfaya Dön
        </Link>
      </Box>

      {/* Ana İçerik */}
      <Container component="main" maxWidth="md" sx={{ py: 8, flexGrow: 1 }}>
        <Grid container spacing={4}>
          {/* Sol Taraf - Tanıtım (Sadece Masaüstünde) */}
          {!isMobile && (
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ p: 3 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  fontWeight="bold"
                  color="primary.main"
                >
                  Yapay Zeka ile Eğitimde Yeni Bir Boyut
                </Typography>
                <Typography variant="subtitle1" paragraph>
                  MEB müfredatına uygun, 2-12. sınıf öğrencileri için kişiselleştirilmiş eğitim desteği.
                </Typography>
                <Box
                  component="img"
                  src="/assets/auth-image.png"
                  alt="Yapay Zeka Öğretmen"
                  sx={{
                    width: '100%',
                    maxWidth: 400,
                    height: 'auto',
                    display: 'block',
                    mx: 'auto',
                    filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.2))',
                  }}
                />
              </Box>
            </Grid>
          )}

          {/* Sağ Taraf - Form İçeriği */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 2,
              }}
            >
              {/* Outlet ile Route içeriğini göster */}
              <Outlet />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Alt Bilgi */}
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', bgcolor: 'background.paper' }}>
        <Container maxWidth="md">
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; {new Date().getFullYear()} Yapay Zeka Öğretmen. Tüm hakları saklıdır.
            <Box component="span" mx={1}>•</Box>
            <Link color="inherit" component={RouterLink} to="/privacy">
              Gizlilik
            </Link>
            <Box component="span" mx={1}>•</Box>
            <Link color="inherit" component={RouterLink} to="/terms">
              Koşullar
            </Link>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default AuthLayout; 