import React, { useEffect } from 'react';
import { Container, Typography, Button, Box, Paper, Chip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useEmail } from '../contexts/EmailContext';

const EmailAccounts = () => {
  const navigate = useNavigate();
  const { accounts, loadAccounts } = useEmail();

  useEffect(() => {
    loadAccounts();
  }, []);

  const getStatusChip = (status) => {
    switch (status) {
      case 'connected':
        return <Chip label="מחובר" color="success" size="small" />;
      case 'disconnected':
        return <Chip label="מנותק" color="default" size="small" />;
      case 'error':
        return <Chip label="שגיאה" color="error" size="small" />;
      default:
        return <Chip label="לא ידוע" color="default" size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          חשבונות מייל
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/accounts/add')}
        >
          הוסף חשבון
        </Button>
      </Box>

      {accounts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            עדיין לא הוספת חשבונות מייל
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/accounts/add')}
            size="large"
          >
            הוסף חשבון מייל
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          {accounts.map((account) => (
            <Box key={account.id} sx={{ p: 2, borderBottom: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{account.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {account.email} • {account.provider}
                  </Typography>
                </Box>
                {getStatusChip(account.status)}
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Container>
  );
};

export default EmailAccounts; 