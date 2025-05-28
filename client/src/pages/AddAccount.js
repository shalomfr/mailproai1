import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useEmail } from '../contexts/EmailContext';

const AddAccount = () => {
  const navigate = useNavigate();
  const { addAccount } = useEmail();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    provider: 'gmail',
    imapServer: 'imap.gmail.com',
    imapPort: '993',
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
  });

  const providers = [
    { value: 'gmail', label: 'Gmail', imap: 'imap.gmail.com', smtp: 'smtp.gmail.com' },
    { value: 'outlook', label: 'Outlook', imap: 'outlook.office365.com', smtp: 'smtp.office365.com' },
    { value: 'yahoo', label: 'Yahoo', imap: 'imap.mail.yahoo.com', smtp: 'smtp.mail.yahoo.com' },
    { value: 'icloud', label: 'iCloud', imap: 'imap.mail.me.com', smtp: 'smtp.mail.me.com' },
    { value: 'custom', label: 'אחר', imap: '', smtp: '' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'provider') {
      const provider = providers.find(p => p.value === value);
      if (provider && provider.value !== 'custom') {
        setFormData(prev => ({
          ...prev,
          imapServer: provider.imap,
          smtpServer: provider.smtp,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const accountData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        provider: formData.provider,
        settings: {
          imap: {
            server: formData.imapServer,
            port: parseInt(formData.imapPort),
            ssl: true,
            auth: 'normal',
          },
          smtp: {
            server: formData.smtpServer,
            port: parseInt(formData.smtpPort),
            ssl: false,
            tls: true,
            auth: 'normal',
          },
          sync: {
            enabled: true,
            interval: 5,
            folders: ['INBOX'],
          },
        },
      };

      const result = await addAccount(accountData);
      if (result.success) {
        navigate('/accounts');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('שגיאה ביצירת החשבון');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/accounts')}
          sx={{ mb: 2 }}
        >
          חזור לרשימה
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          הוסף חשבון מייל חדש
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="שם החשבון"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>ספק מייל</InputLabel>
                <Select
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {providers.map((provider) => (
                    <MenuItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="כתובת מייל"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="סיסמה"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                הגדרות שרת
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="שרת IMAP"
                name="imapServer"
                value={formData.imapServer}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="פורט IMAP"
                name="imapPort"
                value={formData.imapPort}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="שרת SMTP"
                name="smtpServer"
                value={formData.smtpServer}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="פורט SMTP"
                name="smtpPort"
                value={formData.smtpPort}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/accounts')}
                  disabled={loading}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'שומר...' : 'שמור חשבון'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddAccount; 