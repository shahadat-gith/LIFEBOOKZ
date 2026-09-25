import dns from "node:dns";

import mongoose from "mongoose";

/**
 * Lambda ↔ MongoDB connection management.
 *
 * The rule: never open a connection per invocation. MongoDB Atlas bills and
 * limits *connections*, and a Lambda that connects on every call exhausts the
 * cluster during a traffic spike (each concurrent container is its own client).
 *
 * Strategy
 * --------
 * 1. The connection promise is created once per container (module scope) and
 *    reused for every subsequent invocation — the warm-start path is a no-op.
 * 2. The ready state is checked first so a reconnect after a dropped socket
 *    does not try to open a second pool.
 * 3. Pool sizes are small and explicit (`maxPoolSize`) because concurrent
 *    Lambda containers already multiply the pool: 100 containers × 10 = 1000
 *    sockets. See each service README for the numbers chosen and why.
 * 4. Timeouts are short (`serverSelectionTimeoutMS`) so a failing cluster
 *    surfaces as a fast 503 instead of burning the API Gateway 30s timeout
 *    (and the Lambda bill).
 * 5. `minPoolSize: 0` (default) keeps an idle container from holding sockets
 *    Atlas has to maintain during cold periods; Lambda containers are frozen
 *    between invocations, so a warm minimum buys little.
 */
export const MONGO_LAMBDA_DEFAULTS = Object.freeze({
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  // Serverless-friendly: never wait forever on an unreachable primary.
  waitQueueTimeoutMS: 10000,
  appName: "lifebookz-lambda",
});

/**
 * Local development DNS fix.
 *
 * The existing backend had to point Node at public DNS resolvers because
 * `mongodb+srv://` SRV lookups fail with `ECONNREFUSED` on some local
 * networks. Kept opt-in and never applied in a Lambda.
 */
export function configureDevDns({ enabled = process.env.NODE_ENV !== "production" } = {}) {
  if (!enabled) return false;

  const servers = (process.env.MONGO_DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length === 0) return false;

  dns.setServers(servers);

  return true;
}

/**
 * Create a cached connection accessor for one service.
 *
 * @param {object} options
 * @param {string} options.uri      connection string (from Secrets Manager)
 * @param {string} options.service  service name, used for logs and appName
 * @param {object} [options.options] mongoose connect options (merged over defaults)
 * @param {object} [options.logger]
 */
export function createMongoConnection({ uri, service, options = {}, logger } = {}) {
  let connectionPromise = null;

  if (!uri) {
    throw new Error(`[${service}] createMongoConnection requires a MongoDB URI.`);
  }

  async function connect() {
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    if (!connectionPromise) {
      if (options.configureDns !== false) configureDevDns();

      connectionPromise = mongoose
        .connect(uri, { ...MONGO_LAMBDA_DEFAULTS, ...options, appName: options.appName || `lifebookz-${service}` })
        .then(() => mongoose.connection)
        .catch((error) => {
          // Let the next invocation retry instead of caching a broken promise.
          connectionPromise = null;
          logger?.error?.("MongoDB connection failed", { service, error: error.message });
          throw error;
        });
    }

    return connectionPromise;
  }

  async function close() {
    connectionPromise = null;
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }

  return {
    connect,
    close,
    readyState: () => mongoose.connection.readyState,
    mongoose,
  };
}

/** Health/observability helper used by the routers and consumers. */
export function mongoState() {
  return mongoose.connection.readyState;
}
