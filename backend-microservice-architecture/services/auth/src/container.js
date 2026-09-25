import { createMediaStore, createRateLimiter, resolveSecretWithEnvFallback } from "@lifebookz/shared-aws";
import { createPublisher } from "@lifebookz/shared-events";

import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { createAccountRepository } from "./repositories/accounts.js";
import { createRefreshTokenRepository } from "./repositories/refresh-tokens.js";
import { createKeyProvider } from "./services/keys.js";
import { createLoginService } from "./services/login.js";
import { createPasswordResetService } from "./services/password-reset.js";
import { createPrivilegedCredentialsProvider } from "./services/privileged-credentials.js";
import { createProfileService } from "./services/profile.js";
import { createRegistrationService } from "./services/registration.js";
import { createSessionService } from "./services/session.js";
import { createVerificationService } from "./services/verification.js";

/**
 * Dependency container.
 *
 * Everything is created once per Lambda container (module scope) — clients,
 * repositories and services are stateless and reusable, while the Mongo
 * connection and cached secrets live inside their own modules. Only the
 * request-scoped context is built per invocation.
 */
export function createContainer({ logger }) {
  const publisher = createPublisher({ busName: config.eventBusName, service: "auth", logger });

  const accounts = createAccountRepository();
  const refreshTokens = createRefreshTokenRepository();
  const keyProvider = createKeyProvider();

  const sessions = createSessionService({ accounts, refreshTokens, keyProvider, publisher, logger, cfg: config });

  const rateLimiter = createRateLimiter({
    table: config.otpLimitsTable,
    service: "auth",
    region: config.region,
  });

  const mediaStore = createMediaStore({
    endpoint: config.r2Endpoint,
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
    bucket: config.r2Bucket,
    publicBaseUrl: config.r2PublicBaseUrl,
  });

  const privilegedCredentials = createPrivilegedCredentialsProvider({ cfg: config, logger });

  const deps = {
    config,
    logger,
    publisher,
    accounts,
    refreshTokens,
    keyProvider,
    sessions,
    rateLimiter,
    mediaStore,
    registration: createRegistrationService({ accounts, sessions, publisher, logger, cfg: config }),
    login: createLoginService({
      accounts,
      sessions,
      privilegedCredentials,
      rateLimiter,
      publisher,
      logger,
      cfg: config,
    }),
    passwordReset: createPasswordResetService({ accounts, sessions, rateLimiter, publisher, logger, cfg: config }),
    profile: createProfileService({ accounts, sessions, mediaStore, publisher, logger }),
    verification: createVerificationService({ accounts, publisher, logger }),

    /** Resolved once per invocation; the underlying connection is cached. */
    async ready() {
      await connectDatabase();
      return true;
    },

    /** Service token used by `system` for the internal verification call. */
    getServiceToken() {
      return resolveSecretWithEnvFallback({
        secretId: config.internalServiceTokenSecretId || undefined,
        valueEnvVar: "INTERNAL_SERVICE_TOKEN",
      });
    },
  };

  return deps;
}

let cached;

/** Memoised deps for the Lambda container. */
export function getDeps({ logger } = {}) {
  if (!cached) cached = createContainer({ logger });

  return cached;
}

export function resetContainer() {
  cached = undefined;
}
