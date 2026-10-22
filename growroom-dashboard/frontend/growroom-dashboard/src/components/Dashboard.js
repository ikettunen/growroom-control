import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { Thermostat, WaterDrop, LightMode, Nightlight } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Dashboard() {
  const { token } = useAuth();
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        GrowRoom Overview
      </Typography>

      <Grid container spacing={3}>
        {rooms.map((room) => (
          <Grid item xs={12} md={6} lg={4} key={room.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {room.name}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Thermostat sx={{ mr: 1 }} />
                  <Typography>
                    {room.temperature}°C
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      target {room.temperatureSetting}°C
                    </Typography>
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WaterDrop sx={{ mr: 1 }} />
                  <Typography>
                    {room.humidity}%
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      target {room.humiditySetting}%
                    </Typography>
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                  {room.lightOn ? <LightMode sx={{ color: 'warning.main' }} /> : <Nightlight />}
                  <Chip
                    label={room.lightOn ? 'Light ON' : 'Light OFF'}
                    color={room.lightOn ? 'warning' : 'default'}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {room.lightCycleHours}h cycle
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label={room.irrigation ? 'Irrigation ACTIVE' : 'Irrigation OFF'}
                    color={room.irrigation ? 'primary' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Dashboard;
