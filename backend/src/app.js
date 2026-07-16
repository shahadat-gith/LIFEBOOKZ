import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import config from "./shared/config/index.js";

import apiRoutes from "./routes/index.js";
import errorHandler from "./shared/middlewares/errorHandler.js";

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
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ---------- Cookies ---------- */

app.use(cookieParser());

/* ---------- Body Parsing ---------- */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

app.use((_req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found.",
    },
  });
});

/* ---------- Error Handler ---------- */

app.use(errorHandler);

export default app;