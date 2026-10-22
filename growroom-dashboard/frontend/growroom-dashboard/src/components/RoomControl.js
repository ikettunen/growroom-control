import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Slider, Box, Button,
  ToggleButtonGroup, ToggleButton, Chip, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, TextField,
  Table, TableBody, TableCell, TableHead, TableRow, Divider
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Terminal, Grass } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function RoomControl() {
  const { id } = useParams();
  const { token } = useAuth();
  const [room, setRoom] = useState(null);
  const [settings, setSettings] = useState({
    light: 0,
    temperature: 22,
    humidity: 60,
    irrigation: false,
    lightCycleHours: 18,
    lightOnAt: '06:00:00',
  });
  const [irrigationTimer, setIrrigationTimer] = useState(30);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [fertilizer, setFertilizer] = useState(null);
  const [fertilizerLoading, setFertilizerLoading] = useState(false);
  const [bucketSize, setBucketSize] = useState(10);
  const [growCycleEdit, setGrowCycleEdit] = useState({ cycleStartDate: '', fertilizerFamily: '' });

  useEffect(() => {
    fetchRoom();
    fetchHistory();
    const interval = setInterval(fetchRoom, 5000);
    return () => clearInterval(interval);
  }, [id, token]);

  useEffect(() => {
    if (room?.fertilizerFamily) fetchFertilizer();
  }, [room?.fertilizerFamily, room?.growWeek]);

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  const fetchRoom = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${id}`, {
        headers: authHeaders(),
      });
      if (!response.ok) return;
      const data = await response.json();
      setRoom(data);
      setSettings({
        light: data.lightSetting,
        temperature: data.temperatureSetting,
        humidity: data.humiditySetting,
        irrigation: data.irrigation,
        lightCycleHours: data.lightCycleHours,
        lightOnAt: data.lightOnAt,
      });
      setGrowCycleEdit({
        cycleStartDate: data.cycleStartDate || '',
        fertilizerFamily: data.fertilizerFamily || '',
      });
    } catch (error) {
      console.error('Failed to fetch room:', error);
    }
  };

  const fetchFertilizer = async (bucket = bucketSize) => {
    if (!room?.fertilizerFamily) return;
    setFertilizerLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/rooms/${id}/fertilizer?bucketSize=${bucket}`,
        { headers: authHeaders() }
      );
      if (!response.ok) return;
      const data = await response.json();
      setFertilizer(data);
    } catch (error) {
      console.error('Failed to fetch fertilizer:', error);
    } finally {
      setFertilizerLoading(false);
    }
  };

  const saveGrowCycle = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          cycleStartDate: growCycleEdit.cycleStartDate || null,
          fertilizerFamily: growCycleEdit.fertilizerFamily || null,
        }),
      });
      if (response.ok) {
        await fetchRoom();
      }
    } catch (error) {
      console.error('Failed to save grow cycle:', error);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/rooms/${id}/history`, {
        headers: authHeaders(),
      });
      if (!response.ok) return;
      const data = await response.json();
      // Convert epoch ms timestamp to readable label for chart
      const formatted = data.map(p => ({
        ...p,
        time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
      setHistory(formatted);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ [key]: value }),
      });
      if (response.ok) {
        setSettings(prev => ({ ...prev, [key]: value }));
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const updateLightCycle = async (hours) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ lightCycleHours: hours }),
      });
      if (response.ok) {
        setSettings(prev => ({ ...prev, lightCycleHours: hours }));
      }
    } catch (error) {
      console.error('Failed to update light cycle:', error);
    }
  };

  const startIrrigation = async () => {
    await updateSetting('irrigation', true);
    setTimeout(() => updateSetting('irrigation', false), irrigationTimer * 1000);
  };

  if (!room) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {room.name} Control
      </Typography>

      <Grid container spacing={3}>
        {/* Live readings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Live Readings</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ fontSize: 40, mb: 1 }}>🌡️</Box>
                    <Typography variant="h3" color="primary">{room.temperature}°C</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Target: {room.temperatureSetting}°C
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ fontSize: 40, mb: 1 }}>💧</Box>
                    <Typography variant="h3" color="primary">{room.humidity}%</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Target: {room.humiditySetting}%
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ fontSize: 40, mb: 1 }}>{room.lightOn ? '☀️' : '🌙'}</Box>
                    <Chip
                      label={room.lightOn ? 'ON' : 'OFF'}
                      color={room.lightOn ? 'warning' : 'default'}
                      size="large"
                    />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                      {room.lightCycleHours}h cycle · starts {room.lightOnAt?.slice(0, 5)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ fontSize: 40, mb: 1 }}>💦</Box>
                    <Chip
                      label={room.irrigation ? 'ACTIVE' : 'OFF'}
                      color={room.irrigation ? 'primary' : 'default'}
                      size="large"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Controls</Typography>

              {/* Light cycle */}
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Light Cycle (hours/day)</Typography>
                <ToggleButtonGroup
                  value={String(settings.lightCycleHours)}
                  exclusive
                  onChange={(e, val) => val && updateLightCycle(parseInt(val))}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  <ToggleButton value="0">Off</ToggleButton>
                  <ToggleButton value="12">12h</ToggleButton>
                  <ToggleButton value="18">18h</ToggleButton>
                  <ToggleButton value="24">24h</ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary">
                  {settings.lightCycleHours === 0
                    ? 'Lights off'
                    : settings.lightCycleHours === 24
                    ? 'Always on'
                    : `${settings.lightCycleHours}h on / ${24 - settings.lightCycleHours}h off · starts ${settings.lightOnAt?.slice(0, 5)}`}
                </Typography>
              </Box>

              {/* Light intensity */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Light Intensity</Typography>
                  <Typography color="primary">{settings.light}%</Typography>
                </Box>
                <Slider
                  value={settings.light}
                  onChange={(e, val) => setSettings(prev => ({ ...prev, light: val }))}
                  onChangeCommitted={(e, val) => updateSetting('light', val)}
                  min={0} max={100}
                  marks={[{ value: 0, label: 'Off' }, { value: 50, label: '50%' }, { value: 100, label: 'Max' }]}
                />
              </Box>

              {/* Target temperature */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Target Temperature</Typography>
                  <Typography color="primary">{settings.temperature}°C</Typography>
                </Box>
                <Slider
                  value={settings.temperature}
                  onChange={(e, val) => setSettings(prev => ({ ...prev, temperature: val }))}
                  onChangeCommitted={(e, val) => updateSetting('temperature', val)}
                  min={17} max={29}
                  marks={[{ value: 17, label: '17°C' }, { value: 23, label: '23°C' }, { value: 29, label: '29°C' }]}
                />
              </Box>

              {/* Target humidity */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Target Humidity</Typography>
                  <Typography color="primary">{settings.humidity}%</Typography>
                </Box>
                <Slider
                  value={settings.humidity}
                  onChange={(e, val) => setSettings(prev => ({ ...prev, humidity: val }))}
                  onChangeCommitted={(e, val) => updateSetting('humidity', val)}
                  min={40} max={80}
                  marks={[{ value: 40, label: '40%' }, { value: 60, label: '60%' }, { value: 80, label: '80%' }]}
                />
                <Typography variant="caption" color="text.secondary">
                  Dehumidifier triggers outside ±5% band
                </Typography>
              </Box>

              {/* Irrigation */}
              <Box sx={{ mb: 1 }}>
                <Typography gutterBottom>Irrigation Timer</Typography>
                <Slider
                  value={irrigationTimer}
                  onChange={(e, val) => setIrrigationTimer(val)}
                  min={10} max={120} step={10}
                  marks={[{ value: 10, label: '10s' }, { value: 60, label: '1m' }, { value: 120, label: '2m' }]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={val => `${val}s`}
                />
              </Box>
              <Button
                variant="contained"
                fullWidth
                onClick={startIrrigation}
                disabled={settings.irrigation}
              >
                {settings.irrigation ? 'Irrigation Running…' : `Start Irrigation (${irrigationTimer}s)`}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* History chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Environment History (last 24h)</Typography>
                <Button size="small" onClick={fetchHistory} disabled={historyLoading}>
                  {historyLoading ? <CircularProgress size={16} /> : 'Refresh'}
                </Button>
              </Box>
              {history.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No history yet — data accumulates as the Pi sends readings.
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="temp" domain={[15, 35]} label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="hum" orientation="right" domain={[0, 100]} label={{ value: '%', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="temp" type="monotone" dataKey="temperature" stroke="#ff6b6b" name="Temp (°C)" strokeWidth={2} dot={false} />
                    <Line yAxisId="hum" type="monotone" dataKey="humidity" stroke="#4ecdc4" name="Humidity (%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Grow Cycle & Fertilizer */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Grass color="success" />
                <Typography variant="h6">Grow Cycle</Typography>
                {room.growWeek && (
                  <Chip label={`Week ${room.growWeek}`} color="success" size="small" />
                )}
              </Box>

              {/* Cycle configuration */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Cycle Start Date"
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={growCycleEdit.cycleStartDate}
                    onChange={e => setGrowCycleEdit(prev => ({ ...prev, cycleStartDate: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Fertilizer Family</InputLabel>
                    <Select
                      value={growCycleEdit.fertilizerFamily}
                      label="Fertilizer Family"
                      onChange={e => setGrowCycleEdit(prev => ({ ...prev, fertilizerFamily: e.target.value }))}
                    >
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="canna-coco">CANNA COCO</MenuItem>
                      <MenuItem value="sensi-coco">AN Sensi Coco</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button variant="contained" size="small" onClick={saveGrowCycle}>
                    Save
                  </Button>
                  {room.cycleStartDate && (
                    <Typography variant="caption" color="text.secondary">
                      Started {room.cycleStartDate}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              {/* Fertilizer dosage */}
              {room.fertilizerFamily && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="subtitle2">Bucket size:</Typography>
                    <ToggleButtonGroup
                      value={String(bucketSize)}
                      exclusive
                      onChange={(e, val) => {
                        if (!val) return;
                        const l = parseInt(val);
                        setBucketSize(l);
                        fetchFertilizer(l);
                      }}
                      size="small"
                    >
                      {[5, 10, 20, 50].map(l => (
                        <ToggleButton key={l} value={String(l)}>{l}L</ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                    {fertilizerLoading && <CircularProgress size={16} />}
                  </Box>

                  {fertilizer && fertilizer.schedule?.weeks?.length > 0 && (() => {
                    const w = fertilizer.schedule.weeks[0];
                    return (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          {fertilizer.schedule.familyName} · Week {w.week} — {w.label}
                        </Typography>
                        {w.ec && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            EC: {w.ec.total} mS/cm · pH: {w.ph}
                          </Typography>
                        )}
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Product</TableCell>
                              <TableCell align="right">ml/L</TableCell>
                              <TableCell align="right">{bucketSize}L bucket</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {w.products.map(p => (
                              <TableRow key={p.name}>
                                <TableCell>{p.name}</TableCell>
                                <TableCell align="right">
                                  {p.mlPerLiter.min === p.mlPerLiter.max
                                    ? p.mlPerLiter.min
                                    : `${p.mlPerLiter.min}–${p.mlPerLiter.max}`}
                                </TableCell>
                                <TableCell align="right">
                                  <strong>
                                    {p.dosageMl.min === p.dosageMl.max
                                      ? `${p.dosageMl.min} ml`
                                      : `${p.dosageMl.min}–${p.dosageMl.max} ml`}
                                  </strong>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {w.note && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {w.note}
                          </Typography>
                        )}
                      </Box>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* SSH console link */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Raspberry Pi Console</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Connect to the Raspberry Pi controller for this room via SSH
              </Typography>
              <Button
                variant="outlined"
                onClick={() => window.open(`/ssh/${id}`, '_blank')}
                startIcon={<Terminal />}
              >
                Connect to Pi Console
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default RoomControl;
