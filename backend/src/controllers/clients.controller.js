class ClientsController {
  constructor(clientService) {
    this.clientService = clientService;
  }

  updateStatus(req, res) {
    const { clientId, users, sessions, os } = req.body;
    const clientData = {
      isOnline: true,
      os,
      users,
      sessions,
      lastUpdated: new Date(),
    };

    this.clientService.updateClient(clientId, clientData);
    this.clientService.emitUpdate(clientId, clientData);
    res.sendStatus(200);
  }

  getAllClients(req, res) {
    const clients = this.clientService.getAllClients();
    res.json(clients);
  }

  removeClient(req, res) {
    const { clientId } = req.params;

    if (this.clientService.hasClient(clientId)) {
      this.clientService.removeClient(clientId);
      this.clientService.emitRemoval(clientId);
      res.sendStatus(200);
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  }

  checkClient(req, res) {
    const exists = this.clientService.hasClient(req.params.clientId);
    res.json({ exists });
  }

  terminateSession(req, res) {
    const { clientId, sessionId } = req.body;
    const client = this.clientService.getClient(clientId);

    if (client) {
      client.terminateCommand = {
        action: 'logoff',
        sessionId,
        timestamp: new Date(),
      };
      this.clientService.emitTerminate(clientId, sessionId);
      res.sendStatus(200);
    } else {
      res.status(404).send('Client not found');
    }
  }
}

module.exports = ClientsController;