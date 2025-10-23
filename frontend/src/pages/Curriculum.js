import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Book as BookIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Curriculum = () => {
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState({});

  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        const response = await axios.get('http://localhost:8091/mufredat');
        setCurriculum(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Müfredat yüklenirken hata oluştu:', error);
        setLoading(false);
      }
    };

    fetchCurriculum();
  }, []);

  const handleUnitClick = (unitIndex) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitIndex]: !prev[unitIndex],
    }));
  };

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
        5. Sınıf Matematik Müfredatı
      </Typography>

      {curriculum?.units?.map((unit, unitIndex) => (
        <Paper
          key={unitIndex}
          sx={{
            mb: 2,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: 3,
            },
          }}
        >
          <ListItem
            button
            onClick={() => handleUnitClick(unitIndex)}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>
              <BookIcon />
            </ListItemIcon>
            <ListItemText
              primary={unit.title}
              primaryTypographyProps={{
                variant: 'h6',
                fontWeight: 'bold',
              }}
            />
            {expandedUnits[unitIndex] ? <ExpandLess /> : <ExpandMore />}
          </ListItem>

          <Collapse in={expandedUnits[unitIndex]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {unit.topics.map((topic, topicIndex) => (
                <ListItem
                  key={topicIndex}
                  sx={{
                    pl: 4,
                    bgcolor: 'background.default',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon>
                    <SchoolIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={topic.title}
                    secondary={
                      <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                        {topic.kazanimlar.map((kazanim, kazanimIndex) => (
                          <Box
                            component="li"
                            key={kazanimIndex}
                            sx={{ mb: 0.5 }}
                          >
                            {kazanim}
                          </Box>
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Paper>
      ))}
    </Container>
  );
};

export default Curriculum; 