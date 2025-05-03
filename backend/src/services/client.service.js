const { config } = require('../config/app.config');

class ClientService {
  constructor(io) {
    this.io = io;
    this.clients = new Map();
    this.startCleanupInterval();
  }

  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      this.clients.forEach((client, clientId) => {
        if (client.isOnline && now - client.lastUpdated > config.client.offlineTimeout) {
          client.isOnline = false;
          client.users = [];
          client.sessions = [];
          this.emitUpdate(clientId, client);
        }
      });
    }, config.client.cleanupInterval);
  }

  updateClient(clientId, data) {
    this.clients.set(clientId, data);
  }

  getClient(clientId) {
    return this.clients.get(clientId);
  }

  hasClient(clientId) {
    return this.clients.has(clientId);
  }

  removeClient(clientId) {
    this.clients.delete(clientId);
  }

  getAllClients() {
    return Array.from(this.clients.entries()).map(([id, data]) => ({
      clientId: id,
      status: data,
    }));
  }

  emitUpdate(clientId, status) {
    this.io.emit('update', { clientId, status });
  }

  emitRemoval(clientId) {
    this.io.emit('client-removed', clientId);
  }

  emitTerminate(clientId, sessionId) {
    this.io.emit('terminate', { clientId, sessionId });
  }

  handleSocketConnection(socket) {
    const authToken = socket.handshake.query.token;

    socket.emit('initial-data', Array.from(this.clients.entries()));

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  }
}

module.exports = ClientService;