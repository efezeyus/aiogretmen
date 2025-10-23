import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Stack,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  YouTube,
  Psychology,
} from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Alt bağlantılar
  const links = {
    company: [
      { name: 'Hakkımızda', href: '/about' },
      { name: 'Kariyer', href: '/careers' },
      { name: 'Blog', href: '/blog' },
    ],
    product: [
      { name: 'Özellikler', href: '/features' },
      { name: 'Fiyatlandırma', href: '/pricing' },
      { name: 'Sık Sorulan Sorular', href: '/faq' },
    ],
    legal: [
      { name: 'Gizlilik Politikası', href: '/privacy' },
      { name: 'Kullanım Koşulları', href: '/terms' },
      { name: 'Çerez Politikası', href: '/cookies' },
    ],
    support: [
      { name: 'Yardım Merkezi', href: '/help' },
      { name: 'İletişim', href: '/contact' },
      { name: 'Topluluk', href: '/community' },
    ],
  };

  // Sosyal medya bağlantıları
  const socialLinks = [
    { icon: <Facebook />, name: 'Facebook', href: 'https://facebook.com' },
    { icon: <Twitter />, name: 'Twitter', href: 'https://twitter.com' },
    { icon: <Instagram />, name: 'Instagram', href: 'https://instagram.com' },
    { icon: <YouTube />, name: 'YouTube', href: 'https://youtube.com' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Logo ve Açıklama */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Psychology
                sx={{ color: 'primary.main', fontSize: 36, mr: 1 }}
              />
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
            <Typography variant="body2" color="text.secondary" paragraph>
              Yapay zeka destekli eğitim platformu ile öğrencilere
              kişiselleştirilmiş öğrenme deneyimi sunuyoruz. 2. sınıftan 12.
              sınıfa kadar MEB müfredatına uygun ders içerikleri.
            </Typography>
            <Stack direction="row" spacing={1}>
              {socialLinks.map((social) => (
                <IconButton
                  key={social.name}
                  component="a"
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  size="small"
                  sx={{
                    color: 'primary.main',
                    '&:hover': {
                      color: 'primary.dark',
                      bgcolor: 'rgba(25, 118, 210, 0.08)',
                    },
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* Linkler */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Şirket
            </Typography>
            <Stack spacing={1}>
              {links.company.map((link) => (
                <Link
                  key={link.name}
                  component={RouterLink}
                  to={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{ '&:hover': { color: 'primary.main' } }}
                >
                  {link.name}
                </Link>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Ürün
            </Typography>
            <Stack spacing={1}>
              {links.product.map((link) => (
                <Link
                  key={link.name}
                  component={RouterLink}
                  to={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{ '&:hover': { color: 'primary.main' } }}
                >
                  {link.name}
                </Link>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Yasal
            </Typography>
            <Stack spacing={1}>
              {links.legal.map((link) => (
                <Link
                  key={link.name}
                  component={RouterLink}
                  to={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{ '&:hover': { color: 'primary.main' } }}
                >
                  {link.name}
                </Link>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Destek
            </Typography>
            <Stack spacing={1}>
              {links.support.map((link) => (
                <Link
                  key={link.name}
                  component={RouterLink}
                  to={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{ '&:hover': { color: 'primary.main' } }}
                >
                  {link.name}
                </Link>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {currentYear} Yapay Zeka Öğretmen. Tüm hakları saklıdır.
          </Typography>
          <Box>
            <Link
              component={RouterLink}
              to="/privacy"
              variant="body2"
              color="text.secondary"
              sx={{ mr: 2, '&:hover': { color: 'primary.main' } }}
            >
              Gizlilik
            </Link>
            <Link
              component={RouterLink}
              to="/terms"
              variant="body2"
              color="text.secondary"
              sx={{ '&:hover': { color: 'primary.main' } }}
            >
              Koşullar
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 