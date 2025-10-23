import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import axios from 'axios';

const Templates = () => {
  const [templates, setTemplates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get('http://localhost:8091/ogretmen-sablonlari');
        setTemplates(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Şablonlar yüklenirken hata oluştu:', error);
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Öğretmen Şablonları
      </Typography>

      <Grid container spacing={4}>
        {Object.entries(templates || {}).map(([key, template]) => (
          <Grid item xs={12} md={6} key={key}>
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
              <CardHeader
                title={template.title}
                subheader={template.description}
              />
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Hedefler:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {template.hedefler.map((hedef, index) => (
                      <Chip
                        key={index}
                        label={hedef}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Öğrenme Çıktıları:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {template.ogrenme_ciktilari.map((cikti, index) => (
                      <Box component="li" key={index} sx={{ mb: 1 }}>
                        {cikti}
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Değerlendirme:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {template.degerlendirme.map((item, index) => (
                      <Box component="li" key={index} sx={{ mb: 1 }}>
                        {item}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Templates; 