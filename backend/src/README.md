# ThinWatcher Backend

## Project Structure

```
src/
├── config/           # Application and database configuration
├── controllers/      # Request handlers
├── middleware/       # Express middleware
├── models/          # Data models and database schema
├── routes/          # Express routes
├── services/        # Business logic and data processing
└── utils/           # Utility functions and helpers
```

## Components

### Config
- `app.config.js` - Application configuration and environment variables
- `database.js` - Database connection and setup

### Controllers
- `admin.controller.js` - Admin user management operations
- `auth.controller.js` - Authentication and user operations
- `clients.controller.js` - Client management and monitoring

### Middleware
- `auth.js` - Authentication and authorization middleware
- `validation.js` - Request validation middleware

### Routes
- `admin.routes.js` - Admin-specific routes
- `auth.routes.js` - Authentication routes
- `clients.routes.js` - Client management routes

### Services
- `client.service.js` - Client management and WebSocket handling

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user (first user only)
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout
- `GET /api/auth/can-register` - Check if registration is allowed

### Admin Routes
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users/add` - Add a new user
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user

### Client Routes
- `GET /api/clients` - Get all clients
- `POST /api/clients/status` - Update client status
- `DELETE /api/clients/:clientId` - Remove client
- `GET /api/clients/check-client/:clientId` - Check client existence
- `POST /api/clients/terminate` - Terminate client session

## WebSocket Events

### Server to Client
- `initial-data` - Send initial client data on connection
- `update` - Client status update
- `client-removed` - Client removal notification
- `terminate` - Session termination command

## Environment Variables
Required environment variables in `.env`:
- `PORT` - Server port
- `CORS_ORIGIN_PROD` - Production CORS origin
- `CORS_ORIGIN_DEV` - Development CORS origin
- `JWT_SECRET` - JWT signing secret