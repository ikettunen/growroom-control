import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, Alert } from '@mui/material';
import { Terminal as TerminalIcon } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function SSHConsole() {
  const { id } = useParams();
  const [connected, setConnected] = useState(false);
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const [piHost, setPiHost] = useState('');
  const outputRef = useRef(null);

  useEffect(() => {
    // Fetch Pi host for this room
    fetchPiHost();
  }, [id]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const fetchPiHost = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${id}`);
      const data = await response.json();
      setPiHost(data.piHost || `pi@room${id}.local`);
    } catch (error) {
      console.error('Failed to fetch Pi host:', error);
      setPiHost(`pi@room${id}.local`);
    }
  };

  const connect = () => {
    setConnected(true);
    setOutput([
      { type: 'info', text: `Connecting to ${piHost}...` },
      { type: 'info', text: 'Note: SSH connection requires backend WebSocket support' },
      { type: 'info', text: 'For now, use: ssh ' + piHost }
    ]);
  };

  const handleCommand = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setOutput(prev => [...prev, { type: 'command', text: `$ ${input}` }]);
    
    // Simulate command execution (replace with actual WebSocket/SSH implementation)
    setTimeout(() => {
      setOutput(prev => [...prev, { 
        type: 'output', 
        text: 'Command execution requires WebSocket backend implementation' 
      }]);
    }, 100);

    setInput('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        SSH Console - Room {id}
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>SSH Access:</strong> Use your terminal to connect: <code>ssh {piHost}</code>
            <br />
            Full web-based SSH requires WebSocket backend implementation.
          </Alert>

          {!connected ? (
            <Box>
              <TextField
                fullWidth
                label="Pi Host"
                value={piHost}
                onChange={(e) => setPiHost(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button 
                variant="contained" 
                startIcon={<TerminalIcon />}
                onClick={connect}
              >
                Connect to Console
              </Button>
            </Box>
          ) : (
            <Box>
              <Box
                ref={outputRef}
                sx={{
                  bgcolor: '#1e1e1e',
                  color: '#00ff00',
                  fontFamily: 'monospace',
                  p: 2,
                  height: 400,
                  overflowY: 'auto',
                  mb: 2,
                  borderRadius: 1
                }}
              >
                {output.map((line, i) => (
                  <Box key={i} sx={{ 
                    color: line.type === 'command' ? '#00bfa5' : 
                           line.type === 'error' ? '#ff5252' : '#00ff00'
                  }}>
                    {line.text}
                  </Box>
                ))}
              </Box>

              <form onSubmit={handleCommand}>
                <TextField
                  fullWidth
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter command..."
                  variant="outlined"
                  autoFocus
                  sx={{
                    '& input': {
                      fontFamily: 'monospace',
                      bgcolor: '#1e1e1e',
                      color: '#00ff00'
                    }
                  }}
                />
              </form>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default SSHConsole;
