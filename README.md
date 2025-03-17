# ThinWatcher

ThinWatcher is a lightweight monitoring solution for thin clients. This application allows you to monitor and manage thin client sessions remotely through a modern web interface.

## Project Overview

ThinWatcher consists of three main components:

1. **Frontend**: React application with TypeScript for the user interface
2. **Backend**: Node.js server with Express and Socket.IO for real-time updates
3. **Agents**: Scripts for Windows and Linux thin clients that send data to the backend

## Features

- Real-time monitoring of thin client status
- Session tracking and management 
- User management with role-based access control
- Agent installation for Windows and Linux systems
- Responsive design that works on desktop and mobile devices

## Project Structure

```
├── agents/               # Agent scripts for different operating systems
│   ├── linux/            # Linux agent scripts
│   └── windows/          # Windows agent scripts
├── app/                  # Frontend React application
│   ├── public/           # Static assets
│   └── src/              # React source code
└── backend/              # Node.js backend server
    └── data/             # Database files
```

## Getting Started

### Prerequisites

- Node.js 14.x or later
- NPM 6.x or later
- Docker and Docker Compose (optional)

### Setting up the Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a `.env` file based on the example:
   ```
   cp .env.example .env
   ```

3. Edit the `.env` file to include your configuration:
   ```
   PORT=3001
   CORS_ORIGIN_PROD=https://your-production-domain.com
   CORS_ORIGIN_DEV=http://localhost:5173
   API_KEY=your_secure_api_key
   JWT_SECRET=your_secure_jwt_secret
   ```

4. Install dependencies and start the server:
   ```
   npm install
   npm start
   ```

### Setting up the Frontend

1. Navigate to the app directory:
   ```
   cd app
   ```

2. Create a `.env` file based on the example:
   ```
   cp .env.example .env
   ```

3. Edit the `.env` file to include your configuration:
   ```
   VITE_BACKEND_API_URL=http://localhost:3001
   VITE_API_KEY=your_secure_api_key
   ```

4. Install dependencies and start the development server:
   ```
   npm install
   npm run dev
   ```

5. For production build:
   ```
   npm run build
   ```

### Using Docker

You can use Docker to run both frontend and backend:

```
docker-compose up -d
```

## Agent Installation

### Windows Agent

1. Open PowerShell as Administrator
2. Run the installation command:
   ```powershell
   powershell -c "irm https://raw.githubusercontent.com/RipinDensumite/thinwatcher/main/agents/windows/thinwatcher.ps1 | iex"
   ```
3. Follow the prompts to configure the agent with your backend URL, heartbeat interval, and client ID

### Linux Agent

1. Open a terminal
2. Make the script executable:
   ```bash
   chmod +x linux-agent-install.sh
   ```
3. Run the installation script:
   ```bash
   sudo ./linux-agent-install.sh
   ```
4. Follow the prompts to configure the agent

## User Management

ThinWatcher includes role-based access control with two user roles:

- **User**: Can view the dashboard and clients
- **Admin**: Can manage users, delete clients, and access all features

## Troubleshooting

If you encounter issues during installation or usage, try these solutions:

- Ensure you have administrator privileges when installing agents
- Verify the backend URL is correct and accessible
- Check your internet connection
- Make sure the required environment variables are set correctly

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
