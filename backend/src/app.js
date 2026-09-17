import express from "express";
import cors from "cors";
import helmet from "helmet";

import config from "./core/config/index.js";

import apiRoutes from "./routes/index.js";
import requestLogger from "./core/middlewares/requestLogger.js";
import errorHandler from "./core/middlewares/errorHandler.js";

const app = express();

/* ---------- Security ---------- */

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: [
      config.frontend.admin,
      config.frontend.client,
      config.frontend.author,
      config.frontend.expert,
      config.frontend.developer,
    ],
    credentials: true,
  })
);

/* ---------- Body Parsing ---------- */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ---------- Logging ---------- */

// Records every request that ends in 4xx/5xx (registered before the routes
// so the response "finish" listener is always attached).
app.use(requestLogger);

/* ---------- Idempotency ---------- */

// Requests carrying an `Idempotency-Key` header are de-duplicated: replays
// get the original response instead of executing again. Must be registered
// before the routes; its error handler sits just before the global one.
import { idempotencyMiddleware, idempotencyErrorHandler } from "./core/middlewares/idempotency.js";
app.use(idempotencyMiddleware);

/* ---------- Routes ---------- */

app.use("/api/v1", apiRoutes);

/* ---------- Health Check ---------- */

app.get("/", (_req, res) => {
  return res.json({
    success: true,
    message: "LifeBookz API is running.",
  });
});

/* ---------- 404 ---------- */

app.use((req, res) => {
  // Give the request logger the detail it should persist for this 404.
  req.errorContext = {
    code: "NOT_FOUND",
    statusCode: 404,
    message: "Route not found.",
  };

  return res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found.",
    },
  });
});

/* ---------- Error Handler ---------- */

app.use(idempotencyErrorHandler);
app.use(errorHandler);

export default app;