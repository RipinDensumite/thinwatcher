import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Button, Chip, Grid } from '@mui/material';
import { io } from 'socket.io-client';

const API_URL = 'http://167.71.207.105:3001';

export default function HomePage() {
  const [clients, setClients] = useState([]);
  const [socket] = useState(() => io(API_URL, {
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: {
      "Access-Control-Allow-Origin": "*"
    }
  }));

  useEffect(() => {
    // Initial data load with error handling
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/clients`);
        if (!response.ok) throw new Error('Network response failed');
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchData();

    // Real-time updates
    socket.on('update', ({ clientId, status }) => {
      setClients(prev => prev.map(client => 
        client.clientId === clientId ? { ...client, status } : client
      ));
    });

    return () => socket.disconnect();
  }, []);

  const terminateSession = async (clientId, sessionId) => {
    try {
      await fetch(`${API_URL}/api/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, sessionId })
      });
    } catch (error) {
      console.error('Termination failed:', error);
    }
  };

  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      {clients.map(client => (
        <Grid item xs={12} sm={6} md={4} key={client.clientId}>
          <Card variant="outlined">
            <CardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">{client.clientId}</Typography>
                <Chip 
                  label={client.status.isOnline ? 'Online' : 'Offline'} 
                  color={client.status.isOnline ? 'success' : 'error'}
                />
              </div>

              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Last Updated: {new Date(client.status.lastUpdated).toLocaleString()}
              </Typography>

              <div style={{ marginTop: 16 }}>
                <Typography variant="subtitle2">Active Sessions</Typography>
                {client.status.sessions?.map(session => (
                  <div 
                    key={session.ID} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      margin: '8px 0'
                    }}
                  >
                    <div>
                      <span style={{ marginRight: 8 }}>{session.User}</span>
                      <Chip 
                        label={session.State} 
                        size="small"
                        color={
                          session.State === 'Active' ? 'primary' : 'default'
                        }
                      />
                    </div>
                    {session.State === 'Active' && (
                      <Button 
                        variant="outlined" 
                        color="error"
                        size="small"
                        onClick={() => terminateSession(client.clientId, session.ID)}
                      >
                        Terminate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}