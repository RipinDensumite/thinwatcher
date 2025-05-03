require('dotenv').config();

const validateEnvironmentVariables = () => {
  const requiredEnvVars = [
    "PORT",
    "CORS_ORIGIN_PROD",
    "CORS_ORIGIN_DEV",
    "JWT_SECRET",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error(
      "⚠️ ENVIRONMENT ERROR: Missing required environment variables:"
    );
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      "Please check your .env file. See .env.example for required variables."
    );

    if (process.env.NODE_ENV === "production") {
      console.error(
        "Exiting process due to missing environment variables in production mode."
      );
      process.exit(1);
    } else {
      console.warn(
        "⚠️ Running in development mode with missing environment variables."
      );
    }
  } else {
    console.log("✅ All required environment variables are present");
  }
};

const config = {
  port: process.env.PORT || 3001,
  jwt: {
    secret: process.env.JWT_SECRET || "your_jwt_secret_key",
    expiresIn: "1h"
  },
  cors: {
    origins: [process.env.CORS_ORIGIN_PROD, process.env.CORS_ORIGIN_DEV],
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    credentials: true
  },
  socket: {
    cors: {
      origin: [process.env.CORS_ORIGIN_PROD, process.env.CORS_ORIGIN_DEV],
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    },
    transports: ["websocket", "polling"]
  },
  client: {
    offlineTimeout: parseInt(20000, 10),
    cleanupInterval: parseInt(10000, 10)
  }
};

module.exports = { config, validateEnvironmentVariables };