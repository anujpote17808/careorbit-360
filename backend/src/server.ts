import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";

// Routes
import remindersRouter from "./routes/reminders.routes.js";
import appointmentsRouter from "./routes/appointments.routes.js";
import caregiversRouter from "./routes/caregivers.routes.js";
import notificationsRouter from "./routes/notifications.routes.js";
import profileRouter from "./routes/profile.routes.js";
import emergencyRouter from "./routes/emergency.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import medicationsRouter from "./routes/medications.routes.js";

const app = express();

// Security
app.disable("x-powered-by");
app.use(helmet());

// Dynamic CORS configuration (supports local dev and Vercel domains)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === env.APP_ORIGIN ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Request body size limit
app.use(express.json({ limit: "20kb" }));

// Global API rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: "Too many API requests. Please try again later.",
    },
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: "Too many API requests. Please try again later.",
      });
    },
  }),
);

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to CareOrbit 360 API",
    status: "running",
    version: "2.0.0",
  });
});

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "CareOrbit 360 API",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Mounted Modules
app.use("/api/reminders",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: "Too many reminder requests. Please try again later.",
      });
    },
  }),
  remindersRouter,
);

app.use("/api/medications", medicationsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/caregivers", caregiversRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/emergency", emergencyRouter);
app.use("/api/analytics", analyticsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Central error handler
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("API error:", error);

    res.status(500).json({
      success: false,
      error: "An unexpected server error occurred.",
    });
  },
);

// Export app for Vercel serverless deployment
export default app;
export { app };

// Start server locally when not running in Vercel serverless environment
if (!process.env.VERCEL) {
  const server = app.listen(env.PORT, () => {
    console.log(
      `CareOrbit 360 API running at http://localhost:${env.PORT}`,
    );
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("Shutting down CareOrbit 360 API...");

    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
