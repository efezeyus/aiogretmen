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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  EmojiObjects as EmojiObjectsIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Strategies = () => {
  const [strategies, setStrategies] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await axios.get('http://localhost:8091/kisisellestirilmis-stratejiler');
        setStrategies(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Stratejiler yüklenirken hata oluştu:', error);
        setLoading(false);
      }
    };

    fetchStrategies();
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
        Kişiselleştirilmiş Stratejiler
      </Typography>

      <Grid container spacing={4}>
        {Object.entries(strategies || {}).map(([key, strategy]) => (
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
                title={strategy.title}
                subheader={strategy.description}
                avatar={<PsychologyIcon color="primary" />}
              />
              <Divider />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Öğrenci Profili
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Seviye"
                        secondary={strategy.ogrenci_profili.seviye}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EmojiObjectsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Öğrenme Stili"
                        secondary={strategy.ogrenci_profili.ogrenme_stili}
                      />
                    </ListItem>
                  </List>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Önerilen Stratejiler
                  </Typography>
                  <List>
                    {strategy.onerilen_stratejiler.map((strateji, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={strateji} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Öğretim Yöntemleri
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {strategy.ogretim_yontemleri.map((yontem, index) => (
                      <Chip
                        key={index}
                        label={yontem}
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Değerlendirme Kriterleri
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {strategy.degerlendirme_kriterleri.map((kriter, index) => (
                      <Box component="li" key={index} sx={{ mb: 1 }}>
                        {kriter}
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

export default Strategies; 