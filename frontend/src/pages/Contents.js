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
  Divider,
} from '@mui/material';
import axios from 'axios';

const Contents = () => {
  const [contents, setContents] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const response = await axios.get('http://localhost:8091/ders-icerikleri');
        setContents(response.data);
        setLoading(false);
      } catch (error) {
        console.error('İçerikler yüklenirken hata oluştu:', error);
        setLoading(false);
      }
    };

    fetchContents();
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
        Ders İçerikleri
      </Typography>

      <Grid container spacing={4}>
        {Object.entries(contents || {}).map(([key, content]) => (
          <Grid item xs={12} key={key}>
            <Card
              sx={{
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.01)',
                },
              }}
            >
              <CardHeader
                title={content.title}
                subheader={content.description}
              />
              <Divider />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Giriş
                  </Typography>
                  <Typography paragraph>{content.giris}</Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Ana Konular
                  </Typography>
                  {content.ana_konular.map((konu, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {konu.baslik}
                      </Typography>
                      <Typography paragraph>{konu.aciklama}</Typography>
                      {konu.alt_konular && (
                        <Box component="ul" sx={{ pl: 2 }}>
                          {konu.alt_konular.map((altKonu, altIndex) => (
                            <Box component="li" key={altIndex} sx={{ mb: 1 }}>
                              <Typography variant="body2">{altKonu}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Özet
                  </Typography>
                  <Typography paragraph>{content.ozet}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Contents; 