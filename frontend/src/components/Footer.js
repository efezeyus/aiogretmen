import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  IconButton,
  Divider,
  Stack
} from '@mui/material';
import {
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  YouTube,
  Email,
  Phone,
  LocationOn
} from '@mui/icons-material';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box className="footer" component="footer">
      <Container maxWidth="lg">
        <Grid container spacing={4} className="footer-content">
          {/* Logo ve Açıklama */}
          <Grid item xs={12} md={4}>
            <Typography variant="h5" className="footer-logo" gutterBottom>
              🎓 Yapay Zeka Öğretmen
            </Typography>
            <Typography variant="body2" className="footer-description">
              Yapay zeka destekli öğrenme platformu ile eğitimde yeni bir dönem başlıyor. 
              Her öğrenciye özel, kişiselleştirilmiş eğitim deneyimi.
            </Typography>
            <Stack direction="row" spacing={1} className="social-links">
              <IconButton size="small" aria-label="Facebook">
                <Facebook />
              </IconButton>
              <IconButton size="small" aria-label="Twitter">
                <Twitter />
              </IconButton>
              <IconButton size="small" aria-label="LinkedIn">
                <LinkedIn />
              </IconButton>
              <IconButton size="small" aria-label="Instagram">
                <Instagram />
              </IconButton>
              <IconButton size="small" aria-label="YouTube">
                <YouTube />
              </IconButton>
            </Stack>
          </Grid>

          {/* Hızlı Linkler */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" className="footer-title" gutterBottom>
              Hızlı Linkler
            </Typography>
            <Stack spacing={1}>
              <Link to="/features" className="footer-link">Özellikler</Link>
              <Link to="/pricing" className="footer-link">Fiyatlandırma</Link>
              <Link to="/about" className="footer-link">Hakkımızda</Link>
              <Link to="/contact" className="footer-link">İletişim</Link>
              <Link to="/demo" className="footer-link">Demo</Link>
            </Stack>
          </Grid>

          {/* Özellikler */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" className="footer-title" gutterBottom>
              Özellikler
            </Typography>
            <Stack spacing={1}>
              <Link to="/features/ai-learning" className="footer-link">AI Öğrenme</Link>
              <Link to="/features/gamification" className="footer-link">Oyunlaştırma</Link>
              <Link to="/features/adaptive-learning" className="footer-link">Adaptif Öğrenme</Link>
              <Link to="/features/parent-dashboard" className="footer-link">Veli Paneli</Link>
              <Link to="/features/analytics" className="footer-link">Analitik</Link>
            </Stack>
          </Grid>

          {/* İletişim */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" className="footer-title" gutterBottom>
              İletişim
            </Typography>
            <Stack spacing={2}>
              <Box className="contact-item">
                <Email className="contact-icon" />
                <Typography variant="body2">info@yapayzekaogrretmen.com</Typography>
              </Box>
              <Box className="contact-item">
                <Phone className="contact-icon" />
                <Typography variant="body2">+90 (555) 123 45 67</Typography>
              </Box>
              <Box className="contact-item">
                <LocationOn className="contact-icon" />
                <Typography variant="body2">
                  İstanbul, Türkiye
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider className="footer-divider" />

        {/* Alt Bilgi */}
        <Box className="footer-bottom">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="body2" className="copyright">
                © {currentYear} Yapay Zeka Öğretmen. Tüm hakları saklıdır.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent={{ xs: 'center', md: 'flex-end' }}>
                <Link to="/privacy" className="footer-bottom-link">Gizlilik Politikası</Link>
                <Link to="/terms" className="footer-bottom-link">Kullanım Koşulları</Link>
                <Link to="/cookies" className="footer-bottom-link">Çerez Politikası</Link>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
