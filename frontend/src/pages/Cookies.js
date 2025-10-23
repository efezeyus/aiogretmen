import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Cookies = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Çerez Politikası
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ mt: 4 }}>
          <strong>Son Güncelleme: 6 Eylül 2025</strong>
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Çerez Nedir?
          </Typography>
          <Typography variant="body1" paragraph>
            Çerezler, web sitemizi ziyaret ettiğinizde cihazınıza yerleştirilen küçük 
            metin dosyalarıdır. Bu dosyalar, size daha iyi bir kullanıcı deneyimi 
            sunmamıza yardımcı olur.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            2. Kullandığımız Çerez Türleri
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Zorunlu Çerezler
          </Typography>
          <Typography variant="body1" paragraph>
            Web sitemizin düzgün çalışması için gereklidir. Oturum bilgileri ve 
            güvenlik ayarlarını içerir.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Performans Çerezleri
          </Typography>
          <Typography variant="body1" paragraph>
            Sitemizin nasıl kullanıldığını anlamamıza ve performansını iyileştirmemize 
            yardımcı olur.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            İşlevsel Çerezler
          </Typography>
          <Typography variant="body1" paragraph>
            Dil tercihi, tema seçimi gibi kişiselleştirme ayarlarınızı hatırlar.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            3. Çerez Yönetimi
          </Typography>
          <Typography variant="body1" paragraph>
            Tarayıcı ayarlarınızdan çerezleri yönetebilir, silebilir veya 
            engelleyebilirsiniz. Ancak bazı çerezleri engellemek, site 
            işlevselliğini etkileyebilir.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            4. Üçüncü Taraf Çerezleri
          </Typography>
          <Typography variant="body1" paragraph>
            Analitik ve performans ölçümü için Google Analytics gibi güvenilir 
            üçüncü taraf hizmetleri kullanıyoruz. Bu hizmetlerin kendi gizlilik 
            politikaları vardır.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            5. İletişim
          </Typography>
          <Typography variant="body1" paragraph>
            Çerez politikamız hakkında sorularınız için: cookies@yapayzekaogrretmen.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Cookies;
