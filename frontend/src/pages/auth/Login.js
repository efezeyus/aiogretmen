import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  TextField,
  Link,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from '@mui/icons-material';
import { login, clearError } from '../../store/slices/authSlice';
import { useFormik } from 'formik';
import * as yup from 'yup';

// Validasyon şeması
const validationSchema = yup.object({
  email: yup
    .string()
    .email('Geçerli bir e-posta adresi giriniz')
    .required('E-posta gereklidir'),
  password: yup
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır')
    .required('Şifre gereklidir'),
});

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [showPassword, setShowPassword] = useState(false);

  // Giriş yapıldıysa anasayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    
    // Bileşen kaldırıldığında hataları temizle
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  // Form yönetimi
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      dispatch(login(values));
    },
  });

  // Şifre görünürlüğünü değiştir
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography component="h1" variant="h4" fontWeight="bold">
          Giriş Yap
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Yapay Zeka Öğretmen hesabınıza giriş yapın
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={formik.handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="E-posta Adresi"
          name="email"
          autoComplete="email"
          autoFocus
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          disabled={loading}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Şifre"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ textAlign: 'right', mt: 1 }}>
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
            underline="hover"
          >
            Şifrenizi mi unuttunuz?
          </Link>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          startIcon={<LoginIcon />}
          disabled={loading}
          sx={{ mt: 3, mb: 2, py: 1.2 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Giriş Yap'
          )}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          ya da
        </Typography>
      </Divider>

      <Stack spacing={2} direction="column" sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Henüz bir hesabınız yok mu?
        </Typography>
        <Button
          component={RouterLink}
          to="/register"
          fullWidth
          variant="outlined"
          disabled={loading}
        >
          Hesap Oluştur
        </Button>
      </Stack>
    </Box>
  );
};

export default Login; 