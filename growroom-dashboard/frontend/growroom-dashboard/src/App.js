import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Container, Box, Drawer, List, ListItem, ListItemIcon, ListItemText, CssBaseline, IconButton, Tooltip } from '@mui/material';
import { Dashboard as DashboardIcon, Thermostat, WaterDrop, Logout } from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import RoomControl from './components/RoomControl';
import SSHConsole from './components/SSHConsole';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { 
      main: '#009688',
      light: '#4db6ac',
      dark: '#00796b',
    },
    secondary: { 
      main: '#26a69a',
      light: '#80cbc4',
      dark: '#00695c',
    },
    background: {
      default: '#004d40',
      paper: '#00695c',
    },
    success: {
      main: '#00bfa5',
      light: '#64ffda',
    },
    info: {
      main: '#26a69a',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(0, 150, 136, 0.3)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const drawerWidth = 240;

function AppShell() {
  const { user, logout, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Login />;

  return (
    <Router>
        <Box sx={{ display: 'flex' }}>
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <WaterDrop sx={{ mr: 2 }} />
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                GrowRoom Dashboard
              </Typography>
              <Typography variant="body2" sx={{ mr: 2, opacity: 0.8 }}>
                {user?.name || user?.email}
              </Typography>
              <Tooltip title="Sign out">
                <IconButton color="inherit" onClick={logout}>
                  <Logout />
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
            <Box sx={{ overflow: 'auto' }}>
              <List>
                <ListItem button component={Link} to="/">
                  <ListItemIcon><DashboardIcon /></ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button component={Link} to="/room/1">
                  <ListItemIcon><Thermostat /></ListItemIcon>
                  <ListItemText primary="Room 1" />
                </ListItem>
                <ListItem button component={Link} to="/room/2">
                  <ListItemIcon><Thermostat /></ListItemIcon>
                  <ListItemText primary="Room 2" />
                </ListItem>
                <ListItem button component={Link} to="/room/3">
                  <ListItemIcon><Thermostat /></ListItemIcon>
                  <ListItemText primary="Room 3" />
                </ListItem>
              </List>
            </Box>
          </Drawer>
          
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
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
