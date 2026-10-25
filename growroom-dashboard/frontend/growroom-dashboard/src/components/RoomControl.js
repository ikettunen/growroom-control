import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Slider, Box, Button,
  ToggleButtonGroup, ToggleButton, Chip, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, TextField,
  Table, TableBody, TableCell, TableHead, TableRow, Divider,
  IconButton, InputBase,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Terminal, Grass, Edit, Check, Close, Settings } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

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
          <circle cx="50" cy="50" r={r} stroke={color} strokeWidth="8" fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function RoomControl() {
  const { id } = useParams();
  const { token } = useAuth();
  const [room, setRoom] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const handleNameSave = async () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== room.name) {
      await updateSetting('name', trimmed);
      await fetchRoom();
    }
    setEditingName(false);
  };

  const totalWeeks = fertilizer?.room?.totalWeeks || room.growWeek || 4;
  const currentWeek = room.growWeek || 1;
  const weekLabels = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  // Which day within the current week are we on (1-7)
  const currentDay = (() => {
    if (!room.cycleStartDate) return 1;
    const start = new Date(room.cycleStartDate + 'T00:00:00');
    const days = Math.floor((Date.now() - start.getTime()) / (24 * 60 * 60 * 1000));
    return (days % 7) + 1;
  })();
  // Total days elapsed out of totalWeeks * 7
  const totalDays = totalWeeks * 7;
  const elapsedDays = (currentWeek - 1) * 7 + currentDay;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {editingName ? (
          <>
            <InputBase
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }}
              autoFocus
              sx={{ fontSize: '2rem', fontWeight: 700, flexGrow: 1, borderBottom: '2px solid', borderColor: 'primary.main', pb: 0.5 }}
            />
            <IconButton onClick={handleNameSave} color="primary" size="small"><Check /></IconButton>
            <IconButton onClick={() => setEditingName(false)} size="small"><Close /></IconButton>
          </>
        ) : (
          <>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>{room.name}</Typography>
            <IconButton onClick={() => { setNameInput(room.name); setEditingName(true); }} size="small" sx={{ opacity: 0.5 }}>
              <Edit fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>

      <Box sx={{ mb: 3, px: 1 }}>
        {/* Track */}
        <Box sx={{ position: 'relative', height: 12, borderRadius: 6, bgcolor: '#a8d5b5', overflow: 'visible' }}>
          {/* Day ticks */}
          <Box sx={{ position: 'absolute', inset: 0, borderRadius: 6, overflow: 'hidden' }}>
            {Array.from({ length: totalDays - 1 }, (_, i) => i + 1).map(day => {
              const isWeekBoundary = day % 7 === 0;
              return (
                <Box key={day} sx={{
                  position: 'absolute',
                  left: `${(day / totalDays) * 100}%`,
                  top: 0, bottom: 0,
                  width: isWeekBoundary ? 2 : 1,
                  bgcolor: isWeekBoundary ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)',
                }} />
              );
            })}
          </Box>
          {/* Today dot */}
          <Box sx={{
            position: 'absolute',
            left: `${(elapsedDays / totalDays) * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            zIndex: 1,
          }} />
        </Box>
        {/* Week labels below */}
        <Box sx={{ display: 'flex', mt: 0.75 }}>
          {weekLabels.map(week => {
            const active = week === currentWeek;
            return (
              <Box key={week} sx={{ flex: 1, textAlign: 'center' }}>
                <Typography sx={{
                  fontSize: '0.6rem',
                  fontWeight: active ? 700 : 400,
                  color: active ? 'primary.dark' : 'text.secondary',
                  lineHeight: 1,
                }}>
                  W{week}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Live readings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', py: 1 }}>
                <Gauge
                  value={room.temperature} max={35} color="#16a34a"
                  label="Temperature" unit="°"
                  status={Math.abs(room.temperature - room.temperatureSetting) < 1 ? 'On target' : 'Adjusting'}
                  statusColor={Math.abs(room.temperature - room.temperatureSetting) < 1 ? '#16a34a' : '#b45309'}
                />
                <Gauge
                  value={room.humidity} max={100} color="#0ea5e9"
                  label="Humidity" unit="%"
                  status={Math.abs(room.humidity - room.humiditySetting) < 5 ? 'Optimal' : 'Adjusting'}
                  statusColor={Math.abs(room.humidity - room.humiditySetting) < 5 ? '#0284c7' : '#b45309'}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: '2rem' }}>{room.lightOn ? '☀️' : '🌙'}</Typography>
                  <Typography sx={{ fontSize: '2rem', opacity: room.irrigation ? 1 : 0.25 }}>💦</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <IconButton size="small" onClick={() => setSettingsOpen(o => !o)} sx={{ opacity: settingsOpen ? 1 : 0.4 }}>
                  <Settings fontSize="small" />
                </IconButton>
              </Box>

              {settingsOpen && (
                <Box sx={{ mt: 1 }}>
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
                </Box>
              )}
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
