import React from 'react';
import { Container, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  
  return (
    <Container>
      <Typography variant="h4">פרופיל של {user?.username}</Typography>
    </Container>
  );
};

export default Profile; 