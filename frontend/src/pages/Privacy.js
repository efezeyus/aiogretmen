import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Privacy = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Gizlilik Politikası
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ mt: 4 }}>
          <strong>Son Güncelleme: 6 Eylül 2025</strong>
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Veri Toplama
          </Typography>
          <Typography variant="body1" paragraph>
            Yapay Zeka Öğretmen olarak, öğrencilerimizin en iyi öğrenme deneyimini yaşaması için 
            minimum düzeyde veri toplarız. Topladığımız veriler:
          </Typography>
          <ul>
            <li>Temel profil bilgileri (ad, e-posta)</li>
            <li>Öğrenme tercihleri ve ilerleme verileri</li>
            <li>Platform kullanım istatistikleri</li>
          </ul>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            2. Veri Kullanımı
          </Typography>
          <Typography variant="body1" paragraph>
            Topladığımız verileri yalnızca:
          </Typography>
          <ul>
            <li>Kişiselleştirilmiş öğrenme deneyimi sağlamak</li>
            <li>Platform performansını iyileştirmek</li>
            <li>Güvenlik ve dolandırıcılık önleme</li>
          </ul>
          <Typography variant="body1" paragraph>
            amaçlarıyla kullanırız.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            3. Veri Güvenliği
          </Typography>
          <Typography variant="body1" paragraph>
            Verilerinizi endüstri standardı şifreleme yöntemleri ve güvenlik protokolleri ile koruruz. 
            Tüm veriler güvenli sunucularda saklanır ve yetkisiz erişime karşı korunur.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            4. Çocuk Gizliliği
          </Typography>
          <Typography variant="body1" paragraph>
            18 yaş altı kullanıcıların gizliliğini özellikle önemsiyoruz. Çocuklardan yalnızca 
            eğitim amaçlı gerekli minimum bilgileri toplar ve bu bilgileri özel koruma altında tutarız.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            5. İletişim
          </Typography>
          <Typography variant="body1" paragraph>
            Gizlilik politikamız hakkında sorularınız için: privacy@yapayzekaogrretmen.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Privacy;
