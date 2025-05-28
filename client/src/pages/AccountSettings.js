import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

const AccountSettings = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  return (
    <Container>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/accounts')}>
        חזור
      </Button>
      <Typography variant="h4">הגדרות חשבון {id}</Typography>
    </Container>
  );
};

export default AccountSettings; 