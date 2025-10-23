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
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  Group as GroupIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Activities = () => {
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get('http://localhost:8091/etkinlikler');
        setActivities(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Etkinlikler yüklenirken hata oluştu:', error);
        setLoading(false);
      }
    };

    fetchActivities();
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
        Etkinlikler
      </Typography>

      <Grid container spacing={4}>
        {Object.entries(activities || {}).map(([key, activity]) => (
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
                title={activity.title}
                subheader={activity.description}
              />
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Hedefler:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {activity.hedefler.map((hedef, index) => (
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
                    Etkinlik Detayları:
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <TimerIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Süre"
                        secondary={activity.sure}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <GroupIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Grup Büyüklüğü"
                        secondary={activity.grup_buyuklugu}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Seviye"
                        secondary={activity.seviye}
                      />
                    </ListItem>
                  </List>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Adımlar:
                  </Typography>
                  <List>
                    {activity.adimlar.map((adim, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={adim} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Değerlendirme:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {activity.degerlendirme.map((item, index) => (
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

export default Activities; 