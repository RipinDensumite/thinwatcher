const express = require('express');
const router = express.Router();
const ClientsController = require('../controllers/clients.controller');
const { auth } = require('../middleware/auth');

// We'll inject the controller instance when setting up the routes
let clientsController;

const initializeRoutes = (controller) => {
  clientsController = controller;

  // Status update endpoint
  router.post('/status', (req, res) => clientsController.updateStatus(req, res));

  // Protected endpoints
  router.get('/', auth, (req, res) => clientsController.getAllClients(req, res));
  router.delete('/:clientId', auth, (req, res) => clientsController.removeClient(req, res));
  router.post('/terminate', auth, (req, res) => clientsController.terminateSession(req, res));

  // Public endpoints
  router.get('/check-client/:clientId', (req, res) => clientsController.checkClient(req, res));
};

module.exports = { router, initializeRoutes };