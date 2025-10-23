import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  FormHelperText,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import {
  Send,
  Psychology,
  Male,
  Female,
  History,
  DeleteOutline,
  RestartAlt,
  MicNone,
  MicOff,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { askQuestion, clearConversation } from '../../store/slices/aiSlice';

// Sınıf seviyeleri
const grades = Array.from({ length: 11 }, (_, i) => i + 2);

// Dersler
const subjects = [
  'Matematik',
  'Türkçe',
  'Fen Bilgisi',
  'Sosyal Bilgiler',
  'İngilizce',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'Din Kültürü',
  'Diğer',
];

const AskQuestion = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading, conversation, currentAnswer } = useSelector((state) => state.ai);

  // Form durumları
  const [question, setQuestion] = useState('');
  const [grade, setGrade] = useState(user?.grade || 5);
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Ses kaydı için (tarayıcı desteği varsa)
  const [recognition, setRecognition] = useState(null);

  // Öğretmen karakteri için
  const teacherGender = user?.preferences?.teacherGender || 'male';
  const TeacherIcon = teacherGender === 'male' ? Male : Female;

  // Ses tanıma API'si ayarları
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.lang = 'tr-TR';
      recognitionInstance.interimResults = false;
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        setQuestion(speechResult);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Ses tanıma hatası:', event.error);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);

  // Ses kaydını başlat/durdur
  const toggleRecording = () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  // Soru gönderme işlemi
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validasyon
    if (question.trim() === '') {
      setError('Lütfen bir soru girin');
      return;
    }

    setError('');

    dispatch(
      askQuestion({
        question,
        grade,
        subject: subject || undefined,
      })
    );

    // Formu sıfırla
    setQuestion('');
  };

  // Konuşma geçmişini temizle
  const handleClearConversation = () => {
    dispatch(clearConversation());
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Soru Sor
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Anlamadığınız konular için yapay zeka öğretmeninize soru sorabilirsiniz.
      </Typography>

      <Grid container spacing={4}>
        {/* Sol taraf - Soru formu */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 2 }} elevation={2}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth margin="normal" size="small">
                    <InputLabel id="grade-label">Sınıf</InputLabel>
                    <Select
                      labelId="grade-label"
                      id="grade"
                      value={grade}
                      label="Sınıf"
                      onChange={(e) => setGrade(e.target.value)}
                    >
                      {grades.map((g) => (
                        <MenuItem key={g} value={g}>
                          {g}. Sınıf
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth margin="normal" size="small">
                    <InputLabel id="subject-label">Ders</InputLabel>
                    <Select
                      labelId="subject-label"
                      id="subject"
                      value={subject}
                      label="Ders"
                      onChange={(e) => setSubject(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Tüm Dersler</em>
                      </MenuItem>
                      {subjects.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ position: 'relative', mt: 2 }}>
                <TextField
                  fullWidth
                  id="question"
                  name="question"
                  label="Sorunuzu yazın"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  multiline
                  rows={4}
                  margin="normal"
                  error={!!error}
                  helperText={error}
                  disabled={loading}
                  autoFocus
                  InputProps={{
                    endAdornment: recognition && (
                      <IconButton 
                        onClick={toggleRecording}
                        sx={{ position: 'absolute', bottom: 8, right: 8 }}
                      >
                        {isRecording ? <MicOff color="error" /> : <MicNone />}
                      </IconButton>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  type="button"
                  variant="outlined"
                  color="secondary"
                  onClick={handleClearConversation}
                  startIcon={<RestartAlt />}
                  disabled={loading || (!conversation || conversation.length === 0)}
                >
                  Sohbeti Temizle
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  endIcon={<Send />}
                  disabled={loading || question.trim() === ''}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                      Yanıtlanıyor...
                    </>
                  ) : (
                    'Gönder'
                  )}
                </Button>
              </Box>
            </Box>

            {/* Önceki sorular */}
            {conversation && conversation.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Önceki Sorular
                </Typography>
                <Stack spacing={1}>
                  {conversation.slice(0, 5).map((item, index) => (
                    <Chip
                      key={index}
                      label={item.question.length > 40 ? `${item.question.substring(0, 40)}...` : item.question}
                      icon={<History />}
                      onClick={() => setQuestion(item.question)}
                      sx={{ justifyContent: 'flex-start' }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sağ taraf - Cevap alanı */}
        <Grid item xs={12} md={7}>
          <Card 
            sx={{ 
              minHeight: 400, 
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                p: 2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.dark', mr: 2 }}>
                <TeacherIcon />
              </Avatar>
              <Typography variant="h6">
                {teacherGender === 'male' ? 'Öğretmen Ahmet' : 'Öğretmen Ayşe'}
              </Typography>
            </Box>
            <Divider />
            <CardContent 
              sx={{ 
                flexGrow: 1, 
                overflowY: 'auto',
                maxHeight: 450,
                bgcolor: 'grey.50'
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    flexDirection: 'column',
                  }}
                >
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Yanıtınız hazırlanıyor...
                  </Typography>
                </Box>
              ) : currentAnswer ? (
                <Box sx={{ p: 2 }}>
                  <ReactMarkdown>{currentAnswer}</ReactMarkdown>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    flexDirection: 'column',
                  }}
                >
                  <Psychology sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Yapay Zeka Öğretmeniniz
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Sol taraftaki formu kullanarak bir soru sorun.
                    <br />
                    MEB müfredatı konularında size yardımcı olacağım.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AskQuestion; 