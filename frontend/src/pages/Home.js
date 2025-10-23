import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CardActions,
} from '@mui/material';
import {
  School,
  Psychology,
  Devices,
  VerifiedUser,
  CheckCircle,
  ArrowForward,
  Male,
  Female,
  MenuBook as MenuBookIcon,
  Assignment as AssignmentIcon,
  EmojiObjects as EmojiObjectsIcon,
} from '@mui/icons-material';

const featureList = [
  {
    icon: <School />,
    title: 'MEB Müfredatı',
    description: '2-12. sınıflar için tüm zorunlu derslerde tam müfredat desteği',
  },
  {
    icon: <Psychology />,
    title: 'Yapay Zeka Öğretmen',
    description: 'Konuları anlamak için özelleştirilmiş yapay zeka desteği',
  },
  {
    icon: <Devices />,
    title: 'Her Cihazda Erişim',
    description: 'Web, iOS ve Android uygulamaları ile her an her yerden erişim',
  },
  {
    icon: <VerifiedUser />,
    title: 'Ücretsiz Deneme',
    description: '3 gün boyunca tüm özelliklere ücretsiz erişim',
  },
];

const gradeList = [
  '2. Sınıf',
  '3. Sınıf',
  '4. Sınıf',
  '5. Sınıf',
  '6. Sınıf',
  '7. Sınıf',
  '8. Sınıf',
  '9. Sınıf',
  '10. Sınıf',
  '11. Sınıf',
  '12. Sınıf',
];

const Home = () => {
  const sections = [
    {
      title: 'Müfredat',
      description: '5. Sınıf Matematik dersi müfredatını inceleyin',
      icon: <MenuBookIcon sx={{ fontSize: 40 }} />,
      path: '/mufredat',
    },
    {
      title: 'Öğretmen Şablonları',
      description: 'Öğretmenler için hazırlanmış şablonları görüntüleyin',
      icon: <School />,
      path: '/ogretmen-sablonlari',
    },
    {
      title: 'Ders İçerikleri',
      description: 'Detaylı ders içeriklerini keşfedin',
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      path: '/ders-icerikleri',
    },
    {
      title: 'Etkinlikler',
      description: 'Öğrenciler için hazırlanmış etkinlikleri inceleyin',
      icon: <EmojiObjectsIcon sx={{ fontSize: 40 }} />,
      path: '/etkinlikler',
    },
    {
      title: 'Kişiselleştirilmiş Stratejiler',
      description: 'Öğrenci seviyesine göre özelleştirilmiş stratejileri keşfedin',
      icon: <Psychology />,
      path: '/kisisellestirilmis-stratejiler',
    },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {/* Hero Bölümü */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                Yapay Zeka Destekli Öğretmen
              </Typography>
              <Typography variant="h5" paragraph>
                Her öğrencinin kişisel ihtiyaçlarına göre derslerini destekleyen, anında yanıt veren ve öğrenme sürecini kolaylaştıran yapay zeka teknolojisi.
              </Typography>
              <Stack direction="row" spacing={2} mt={4}>
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to="/register"
                  sx={{
                    bgcolor: 'secondary.main',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    '&:hover': { bgcolor: 'secondary.dark' },
                  }}
                >
                  Ücretsiz Dene
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  Giriş Yap
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/assets/hero-image.png"
                alt="Yapay Zeka Öğretmen"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto',
                  filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.2))',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Özellikler Bölümü */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
            Benzersiz Özellikler
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Yapay Zeka Öğretmen uygulaması, öğrencilerin eğitim sürecini kolaylaştırmak için tasarlanmış ileri teknoloji özellikleri sunuyor.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {featureList.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 40px -12px rgba(0,0,0,0.2)',
                  },
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    color: 'primary.main',
                  }}
                >
                  <Box fontSize="3rem">{feature.icon}</Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Typography gutterBottom variant="h5" component="h3" fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Öğretmen Karakterleri */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              Öğretmen Karakterleri
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              İstediğiniz öğretmen karakterini seçerek daha kişiselleştirilmiş bir deneyim yaşayın.
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={5}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  borderRadius: 4,
                }}
              >
                <Male sx={{ fontSize: 100, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" component="h3" gutterBottom fontWeight="bold">
                  Erkek Öğretmen
                </Typography>
                <Typography variant="body1" textAlign="center" paragraph>
                  Tüm derslerde uzman erkek öğretmen karakteri ile çalışma imkanı.
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  component={RouterLink}
                  to="/register"
                  startIcon={<ArrowForward />}
                  sx={{ mt: 'auto' }}
                >
                  Hemen Dene
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  borderRadius: 4,
                }}
              >
                <Female sx={{ fontSize: 100, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h4" component="h3" gutterBottom fontWeight="bold">
                  Kadın Öğretmen
                </Typography>
                <Typography variant="body1" textAlign="center" paragraph>
                  Tüm derslerde uzman kadın öğretmen karakteri ile çalışma imkanı.
                </Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  component={RouterLink}
                  to="/register"
                  startIcon={<ArrowForward />}
                  sx={{ mt: 'auto' }}
                >
                  Hemen Dene
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Sınıf Seviyesi */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
            Tüm Sınıf Seviyeleri İçin
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            2. sınıftan 12. sınıfa kadar MEB müfredatına uygun eğitim desteği
          </Typography>
        </Box>

        <Grid container spacing={2} justifyContent="center">
          {gradeList.map((grade, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Card
                sx={{
                  textAlign: 'center',
                  p: 2,
                  height: '100%',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Typography variant="h6" component="div" fontWeight="bold">
                  {grade}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Kullanım Adımları */}
      <Box sx={{ bgcolor: 'secondary.main', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              Nasıl Çalışır?
            </Typography>
            <Typography variant="h6" sx={{ maxWidth: 700, mx: 'auto', color: 'white.main' }}>
              Yapay Zeka Öğretmen ile öğrenim sürecinizi kolaylaştırın
            </Typography>
          </Box>

          <List sx={{ maxWidth: 700, mx: 'auto' }}>
            <ListItem sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)', p: 3, borderRadius: 2 }}>
              <ListItemIcon sx={{ color: 'white' }}>
                <CheckCircle fontSize="large" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="h6" fontWeight="bold">
                    Üye olun ve sınıf seviyenizi seçin
                  </Typography>
                }
                secondary={
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Hızlı kayıt işlemi ile sisteme giriş yaparak sınıf seviyenizi belirleyin.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)', p: 3, borderRadius: 2 }}>
              <ListItemIcon sx={{ color: 'white' }}>
                <CheckCircle fontSize="large" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="h6" fontWeight="bold">
                    Derslerinizi ve konularınızı seçin
                  </Typography>
                }
                secondary={
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Çalışmak istediğiniz dersi ve konuyu belirleyin, Yapay Zeka Öğretmen hazır.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)', p: 3, borderRadius: 2 }}>
              <ListItemIcon sx={{ color: 'white' }}>
                <CheckCircle fontSize="large" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="h6" fontWeight="bold">
                    Anlamadığınız her konuyu sorun
                  </Typography>
                }
                secondary={
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Yapay zeka öğretmen, tüm sorularınızı anında yanıtlar ve anlamanıza yardımcı olur.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)', p: 3, borderRadius: 2 }}>
              <ListItemIcon sx={{ color: 'white' }}>
                <CheckCircle fontSize="large" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="h6" fontWeight="bold">
                    İlerlemenizi takip edin
                  </Typography>
                }
                secondary={
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Detaylı raporlar ve analizlerle öğrenme sürecinizi takip edin, güçlü ve zayıf yönlerinizi keşfedin.
                  </Typography>
                }
              />
            </ListItem>
          </List>

          <Box textAlign="center" mt={6}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/register"
              sx={{
                bgcolor: 'white',
                color: 'secondary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
            >
              Hemen Başla
            </Button>
          </Box>
        </Container>
      </Box>

      {/* CTA Bölümü */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
          Eğitim Yolculuğunuzu Dönüştürün
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Yapay Zeka Öğretmen ile derslerinizde daha başarılı olun. 3 günlük ücretsiz deneme ile hemen başlayın.
        </Typography>
        <Button
          variant="contained"
          size="large"
          component={RouterLink}
          to="/register"
          sx={{
            mt: 3,
            px: 6,
            py: 1.5,
            fontSize: '1.2rem',
          }}
        >
          Ücretsiz Dene
        </Button>
      </Container>

      {/* Yeni Bölümü */}
      <Container maxWidth="lg" sx={{ py: 8, mt: 4 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
            Yeni Özellikler
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Yeni özellikleri keşfedin ve eğitim sürecinizi daha verimli hale getirin.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {sections.map((section) => (
            <Grid item xs={12} sm={6} md={4} key={section.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{section.icon}</Box>
                  <Typography gutterBottom variant="h5" component="h2">
                    {section.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {section.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    component={RouterLink}
                    to={section.path}
                    fullWidth
                  >
                    İncele
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home; 