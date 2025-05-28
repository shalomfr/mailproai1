import React, { useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Chip,
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as ConnectedIcon,
  Error as ErrorIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEmail } from '../contexts/EmailContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accounts, loadAccounts } = useEmail();

  useEffect(() => {
    loadAccounts();
  }, []);

  const connectedAccounts = accounts.filter(account => account.status === 'connected');
  const disconnectedAccounts = accounts.filter(account => account.status === 'disconnected');
  const errorAccounts = accounts.filter(account => account.status === 'error');

  const stats = [
    {
      title: 'סה"כ חשבונות',
      value: accounts.length,
      icon: <EmailIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary.main',
    },
    {
      title: 'חשבונות מחוברים',
      value: connectedAccounts.length,
      icon: <ConnectedIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success.main',
    },
    {
      title: 'שגיאות חיבור',
      value: errorAccounts.length,
      icon: <ErrorIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      color: 'error.main',
    },
  ];

  const getStatusChip = (status) => {
    switch (status) {
      case 'connected':
        return <Chip label="מחובר" color="success" size="small" />;
      case 'disconnected':
        return <Chip label="מנותק" color="default" size="small" />;
      case 'error':
        return <Chip label="שגיאה" color="error" size="small" />;
      case 'testing':
        return <Chip label="בבדיקה" color="warning" size="small" />;
      default:
        return <Chip label="לא ידוע" color="default" size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ברוך הבא, {user?.firstName || user?.username || 'משתמש'}! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary">
          מצב חשבונות המייל שלך
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      {stat.title}
                    </Typography>
                    <Typography variant="h3" component="h2" sx={{ color: stat.color }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              חשבונות מייל אחרונים
            </Typography>
            
            {accounts.length === 0 ? (
              <Box textAlign="center" py={4}>
                <EmailIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  עדיין לא הוספת חשבונות מייל
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  התחל על ידי הוספת החשבון הראשון שלך
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/accounts/add')}
                  size="large"
                >
                  הוסף חשבון מייל
                </Button>
              </Box>
            ) : (
              <Box>
                {accounts.slice(0, 5).map((account) => (
                  <Box
                    key={account.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 2,
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {account.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {account.email}
                      </Typography>
                    </Box>
                    <Box>
                      {getStatusChip(account.status)}
                    </Box>
                  </Box>
                ))}
                
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/accounts')}
                  >
                    צפה בכל החשבונות
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              פעולות מהירות
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/accounts/add')}
                fullWidth
              >
                הוסף חשבון מייל
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => navigate('/accounts')}
                fullWidth
              >
                נהל חשבונות
              </Button>
            </Box>

            {accounts.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  סטטיסטיקות
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">שיעור חיבור:</Typography>
                    <Typography variant="body2" color="success.main">
                      {accounts.length > 0 
                        ? Math.round((connectedAccounts.length / accounts.length) * 100)
                        : 0}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">ספקים פעילים:</Typography>
                    <Typography variant="body2">
                      {new Set(accounts.map(a => a.provider)).size}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 