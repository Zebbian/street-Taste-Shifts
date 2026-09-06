import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./env.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";
import { shiftsRouter } from "./routes/shifts.js";
import { dashboardRouter } from "./routes/dashboard.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(
    pinoHttp({
      logger,
      // Never log Authorization headers or bodies containing secrets/PII.
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          'res.headers["set-cookie"]',
        ],
        remove: true,
      },
    })
  );

  app.use("/api/health", healthRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/shifts", shiftsRouter);
  app.use("/api/dashboard", dashboardRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: { message: "Not found" } });
  });

  // Centralized error handler — must be registered last.
  app.use(errorHandler);

  return app;
}
