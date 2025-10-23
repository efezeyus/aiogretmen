import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Terms = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Kullanım Koşulları
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ mt: 4 }}>
          <strong>Yürürlük Tarihi: 6 Eylül 2025</strong>
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Hizmet Tanımı
          </Typography>
          <Typography variant="body1" paragraph>
            Yapay Zeka Öğretmen, öğrencilere kişiselleştirilmiş eğitim deneyimi sunan 
            bir çevrimiçi öğrenme platformudur. Platform, yapay zeka teknolojileri kullanarak 
            her öğrencinin ihtiyaçlarına özel içerik ve öğrenme yolları oluşturur.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            2. Kullanım Şartları
          </Typography>
          <Typography variant="body1" paragraph>
            Platformumuzu kullanarak aşağıdaki şartları kabul etmiş olursunuz:
          </Typography>
          <ul>
            <li>Doğru ve güncel bilgiler sağlamayı</li>
            <li>Hesap güvenliğinizi korumayı</li>
            <li>Platform kurallarına uymayı</li>
            <li>Telif haklarına saygı göstermeyi</li>
          </ul>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            3. Yasaklı Kullanımlar
          </Typography>
          <Typography variant="body1" paragraph>
            Aşağıdaki davranışlar kesinlikle yasaktır:
          </Typography>
          <ul>
            <li>Platformu yasa dışı amaçlarla kullanmak</li>
            <li>Diğer kullanıcıları rahatsız etmek veya taciz etmek</li>
            <li>Sistem güvenliğini tehlikeye atacak girişimlerde bulunmak</li>
            <li>İçerikleri izinsiz kopyalamak veya dağıtmak</li>
          </ul>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            4. Fikri Mülkiyet
          </Typography>
          <Typography variant="body1" paragraph>
            Platform üzerindeki tüm içerikler, tasarımlar ve yazılımlar Yapay Zeka Öğretmen'e 
            aittir ve telif hakları ile korunmaktadır. İzinsiz kullanım yasal takibe tabidir.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            5. Sorumluluk Sınırı
          </Typography>
          <Typography variant="body1" paragraph>
            Platform "olduğu gibi" sunulmaktadır. Eğitim içeriklerinin doğruluğu ve 
            etkinliği konusunda garanti vermemekle birlikte, en kaliteli hizmeti sunmak 
            için sürekli çalışmaktayız.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            6. İletişim
          </Typography>
          <Typography variant="body1" paragraph>
            Kullanım koşulları hakkında sorularınız için: legal@yapayzekaogrretmen.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Terms;
