
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import remindersRouter from "./routes/reminders.routes.js";

const app = express();

// Security
app.disable("x-powered-by");
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.APP_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Request body size limit
app.use(express.json({ limit: "20kb" }));

// Global API rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
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

// Medication reminder endpoint
app.use(
  "/api/reminders",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: "Too many reminder requests. Please try again later.",
    },
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: "Too many reminder requests. Please try again later.",
      });
    },
  }),
  remindersRouter,
);

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
