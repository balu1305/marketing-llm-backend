require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");

// Import configurations and middleware
const connectDB = require("./config/database");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Import background services
const socketService = require("./services/socketService");

// Import routes
const routes = require("./routes");

// Initialize Express app and HTTP server for Socket.IO
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize background services
const initializeBackgroundServices = async () => {
  try {
    console.log("🔧 Initializing background services...");

    // Initialize Socket.IO
    socketService.initialize(server);

    console.log("✅ Background services initialization completed");
  } catch (error) {
    console.error(
      "❌ Failed to initialize background services:",
      error.message
    );
    console.log("⚠️  Continuing without background services...");
  }
};

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || [
      "http://localhost:8080",
      "http://localhost:3000",
      "https://market-campain-llm.vercel.app",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Marketing Campaign Generator Backend API",
    version: "1.0.0",
    documentation: "/api",
    healthCheck: "/api/health",
    timestamp: new Date().toISOString(),
  });
});

// Handle 404 errors
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5002;
const NODE_ENV = process.env.NODE_ENV || "development";

// Start server
const startServer = async () => {
  // Initialize background services first
  await initializeBackgroundServices();

  // Start HTTP server
  server.listen(PORT, () => {
    console.log(`
🚀 ================================================
   AI Marketing Campaign Generator Backend
🚀 ================================================
   
   🌐 Server running on port: ${PORT}
   📊 Environment: ${NODE_ENV}
   🕒 Started at: ${new Date().toISOString()}
   
   📋 API Endpoints:
   ├── Health Check: http://localhost:${PORT}/api/health
   ├── Documentation: http://localhost:${PORT}/api
   ├── Auth: http://localhost:${PORT}/api/auth
   ├── Personas: http://localhost:${PORT}/api/personas
   ├── Campaigns: http://localhost:${PORT}/api/campaigns
   └── Content: http://localhost:${PORT}/api/content
   
   📡 Real-time Features:
   └── WebSocket: http://localhost:${PORT}
   
🚀 ================================================
    `);
  });
};

// Start the server
startServer();

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("🛑 Shutting down gracefully...");

  try {
    // Close Socket.IO connections
    socketService.close();

    // Close HTTP server
    server.close(() => {
      console.log("✅ Process terminated");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error during shutdown:", error.message);
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error("❌ Unhandled Promise Rejection:", err.message);
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  gracefulShutdown();
});
