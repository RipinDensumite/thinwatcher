import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Button, Chip, Grid } from '@mui/material';
import { io, Socket } from 'socket.io-client';

interface Session {
  ID: string;
  User: string;
  State: string;
}

interface ClientStatus {
  isOnline: boolean;
  users: string[];
  sessions: Session[];
  lastUpdated: Date;
}

interface Client {
  clientId: string;
  status: ClientStatus;
}

const API_URL = 'https://thinwatcherbackend.ripin.live';

export default function HomePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [socket] = useState<Socket>(() => 
    io(API_URL, {
      transports: ['websocket', 'polling'],
      upgrade: false,
      reconnectionAttempts: 5,
      withCredentials: true,
      extraHeaders: { "Access-Control-Allow-Origin": API_URL }
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/clients`);
        const data: Client[] = await response.json();
        setClients(data);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchData();

    socket.on('update', ({ clientId, status }: { clientId: string; status: ClientStatus }) => {
      setClients(prev => prev.map(client => 
        client.clientId === clientId ? { ...client, status } : client
      ));
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const terminateSession = async (clientId: string, sessionId: string) => {
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
      <h1>Clients</h1>
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