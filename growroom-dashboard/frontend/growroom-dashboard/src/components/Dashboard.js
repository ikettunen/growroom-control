import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Circular SVG gauge: value 0-100, colour, label, unit
function Gauge({ value, max, color, label, unit, status, statusColor }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const offset = circ * (1 - pct);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} stroke="#e8efe9" strokeWidth="8" fill="none" />
          <circle
            cx="50" cy="50" r={r}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <Box sx={{ position: 'absolute', textAlign: 'center' }}>
          <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1, color: '#1c2a1e' }}>
            {value}{unit}
          </Typography>
          {status && (
            <Box sx={{ mt: 0.3, px: 1, py: 0.2, borderRadius: 99, bgcolor: `${statusColor}18`, display: 'inline-block' }}>
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: statusColor, lineHeight: 1 }}>{status}</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function PhaseChip({ phase }) {
  const map = {
    rooting:     { label: 'Rooting',    bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
    vegetative:  { label: 'Vegetative', bg: '#f0fdf4', color: '#16a34a', border: '#4ade80' },
    generative:  { label: 'Bloom',      bg: '#fffbeb', color: '#b45309', border: '#fcd34d' },
    flush:       { label: 'Flush',      bg: '#f8fafc', color: '#475569', border: '#cbd5e1' },
  };
  const s = map[phase] || map.flush;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.4, borderRadius: 99, bgcolor: s.bg, border: `1px solid ${s.border}` }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: s.color, letterSpacing: '0.04em' }}>{s.label}</Typography>
    </Box>
  );
}

function RoomCard({ room }) {
  const tempPct = ((room.temperature - 15) / (35 - 15)) * 100;
  const humPct = room.humidity;

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{room.name}</Typography>
            {room.fertilizerFamily && room.growWeek && (
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.3 }}>
                Week {room.growWeek} · {room.fertilizerFamily}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '1.2rem' }}>{room.lightOn ? '☀️' : '🌙'}</Typography>
            <Chip
              label={room.irrigation ? 'Irrigating' : 'Idle'}
              size="small"
              sx={{
                bgcolor: room.irrigation ? '#dcfce7' : '#f8fafc',
                color: room.irrigation ? '#15803d' : '#64748b',
                border: `1px solid ${room.irrigation ? '#86efac' : '#e2e8e2'}`,
                fontWeight: 600, fontSize: '0.65rem',
              }}
            />
          </Box>
        </Box>

        {/* Gauges */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', py: 1 }}>
          <Gauge
            value={room.temperature}
            max={35}
            color="#16a34a"
            label="Temperature"
            unit="°"
            status={Math.abs(room.temperature - room.temperatureSetting) < 1 ? 'On target' : 'Adjusting'}
            statusColor={Math.abs(room.temperature - room.temperatureSetting) < 1 ? '#16a34a' : '#b45309'}
          />
          <Gauge
            value={room.humidity}
            max={100}
            color="#0ea5e9"
            label="Humidity"
            unit="%"
            status={Math.abs(room.humidity - room.humiditySetting) < 5 ? 'Optimal' : 'Adjusting'}
            statusColor={Math.abs(room.humidity - room.humiditySetting) < 5 ? '#0284c7' : '#b45309'}
          />
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            {room.lightCycleHours}h · starts {room.lightOnAt?.slice(0, 5)}
          </Typography>
          {room.fertilizerFamily && <PhaseChip phase={room.currentPhase || 'vegetative'} />}
        </Box>
      </CardContent>
    </Card>
  );
}

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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ lineHeight: 1 }}>Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Live overview of all grow rooms
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {rooms.map((room) => (
          <Grid item xs={12} md={6} lg={4} key={room.id}>
            <RoomCard room={room} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Dashboard;
