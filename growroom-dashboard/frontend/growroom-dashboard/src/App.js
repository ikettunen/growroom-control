import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Container, Box, Drawer, List, ListItem, ListItemIcon, ListItemText, CssBaseline, IconButton, Tooltip } from '@mui/material';
import { Dashboard as DashboardIcon, Thermostat, Logout, Grass } from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import RoomControl from './components/RoomControl';
import SSHConsole from './components/SSHConsole';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
    },
    secondary: {
      main: '#166534',
      light: '#4ade80',
      dark: '#14532d',
    },
    background: {
      default: '#f3f6f3',
      paper: '#ffffff',
    },
    text: {
      primary: '#1c2a1e',
      secondary: '#64748b',
    },
    divider: '#e2e8e2',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.025em' },
    h4: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 600, letterSpacing: '-0.015em' },
    h6: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 600, letterSpacing: '-0.015em' },
    button: { fontWeight: 600, letterSpacing: '-0.01em' },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1c2a1e',
          boxShadow: '0 1px 0 #e2e8e2',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#14532d',
          color: '#ffffff',
          border: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: '1px solid #e2e8e2',
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04), 0 2px 6px -1px rgba(0,0,0,0.02)',
          transition: 'border-color 0.2s',
          '&:hover': { borderColor: '#86efac' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundColor: '#16a34a',
          '&:hover': { backgroundColor: '#15803d' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: '#16a34a' },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px !important',
          textTransform: 'none',
          fontWeight: 600,
          '&.Mui-selected': {
            backgroundColor: '#16a34a',
            color: '#ffffff',
            '&:hover': { backgroundColor: '#15803d' },
          },
        },
      },
    },
  },
});

const drawerWidth = 220;

function NavItem({ to, icon, label }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <ListItem
      button
      component={Link}
      to={to}
      sx={{
        mx: 1.5,
        mb: 0.5,
        borderRadius: 3,
        px: 1.5,
        py: 1,
        backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
        '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
        width: 'auto',
      }}
    >
      <ListItemIcon sx={{ minWidth: 36, color: active ? '#86efac' : 'rgba(255,255,255,0.6)' }}>
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: '0.875rem',
          fontWeight: active ? 700 : 500,
          color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
        }}
      />
    </ListItem>
  );
}

function AppShell() {
  const { user, logout, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Login />;

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ gap: 2 }}>
            {/* Logo */}
            <Box sx={{
              width: 36, height: 36, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #15803d, #22c55e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(21,128,61,0.3)',
              flexShrink: 0,
            }}>
              <Grass sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.025em', lineHeight: 1, color: '#14532d' }}>
                SenrowOS
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#16a34a', lineHeight: 1 }}>
                Grow Room Automation
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {user?.name || user?.email}
            </Typography>
            <Tooltip title="Sign out">
              <IconButton onClick={logout} size="small" sx={{ color: 'text.secondary' }}>
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', pt: 1 }}>
            {/* Section label */}
            <Typography sx={{ px: 3, pt: 1, pb: 0.5, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Overview
            </Typography>
            <List disablePadding>
              <NavItem to="/" icon={<DashboardIcon fontSize="small" />} label="Dashboard" />
            </List>
            <Typography sx={{ px: 3, pt: 2, pb: 0.5, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Rooms
            </Typography>
            <List disablePadding>
              <NavItem to="/room/1" icon={<Thermostat fontSize="small" />} label="Room 1" />
              <NavItem to="/room/2" icon={<Thermostat fontSize="small" />} label="Room 2" />
              <NavItem to="/room/3" icon={<Thermostat fontSize="small" />} label="Room 3" />
            </List>
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="xl">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/room/:id" element={<RoomControl />} />
              <Route path="/ssh/:id" element={<SSHConsole />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
