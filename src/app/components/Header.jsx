'use client';
import { useAuth } from '../lib/authContext';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

export default function Header() {
  const { restaurant } = useAuth();

  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: '#1a3c34',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        borderRadius: '0 0 10px 10px',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 'bold', color: 'white' }}
        >
          Welcome, {restaurant?.name || 'Admin'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {restaurant?.email || 'N/A'}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'capitalize',
              fontSize: '0.875rem',
            }}
          >
            {'restaurant'} {/* Fallback since role is not provided */}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}