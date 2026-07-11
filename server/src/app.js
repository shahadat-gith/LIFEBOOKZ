import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import passport from "./shared/config/passport.js";
import config from "./shared/config/index.js";
import errorHandler from "./shared/middleware/errorHandler.js";
import apiRoutes from "./routes/index.js";

const app = express();

// Security
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Passport
app.use(passport.initialize());

// Request ID
app.use((req, _res, next) => {
  req.id = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  next();
});

// Routes
app.use(config.apiPrefix, apiRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({
    type: "/errors/not-found",
    title: "Not Found",
    status: 404,
    detail: "Resource not found",
  });
});

// Error handler
app.use(errorHandler);

export default app;
