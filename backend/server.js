require("dotenv").config();

function validateEnvironmentVariables() {
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

    // Exit with error code if in production, otherwise continue with warnings
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
}

validateEnvironmentVariables();

// This file serves as the entry point and launches the structured application
require('./src/server');