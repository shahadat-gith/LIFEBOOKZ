import { loadConfig } from "@lifebookz/shared-aws";

/**
 * Auth owns the *only* signing key in the architecture, so its configuration is
 * the most sensitive one. Nothing that could sign a token lives anywhere else.
 */
export const config = loadConfig({
  service: "auth",
  required: {
    eventBusName: "EVENT_BUS_NAME",
    issuer: "JWT_ISSUER",
    audience: "JWT_AUDIENCE",
    kid: "JWT_KID",
  },
  optional: {
    mongoSecretId: ["MONGODB_AUTH_URI_SECRET_ID", ""],
    mongoUri: ["MONGODB_AUTH_URI", ""],
    jwtPrivateKeySecretId: ["JWT_PRIVATE_KEY_SECRET_ID", "lifebookz/auth/jwt-signing-key"],
    jwtPrivateKey: ["JWT_PRIVATE_KEY", ""],
    jwtPublicKey: ["JWT_PUBLIC_KEY", ""],
    previousKid: ["JWT_PREVIOUS_KID", ""],
    previousPublicKey: ["JWT_PREVIOUS_PUBLIC_KEY", ""],
    internalServiceTokenSecretId: ["INTERNAL_SERVICE_TOKEN_SECRET_ID", ""],
    internalServiceToken: ["INTERNAL_SERVICE_TOKEN", ""],
    adminCredentialsSecretId: ["ADMIN_CREDENTIALS_SECRET_ID", ""],
    developerCredentialsSecretId: ["DEVELOPER_CREDENTIALS_SECRET_ID", ""],
    r2Endpoint: ["R2_ENDPOINT", ""],
    r2AccessKeyId: ["R2_ACCESS_KEY_ID", ""],
    r2SecretAccessKey: ["R2_SECRET_ACCESS_KEY", ""],
    r2Bucket: ["R2_BUCKET_NAME", ""],
    r2PublicBaseUrl: ["R2_PUBLIC_BASE_URL", ""],
    otpLimitsTable: ["DYNAMODB_OTP_LIMITS_TABLE", "lifebookz-auth-otp-limits"],
  },
  numbers: {
    accessTokenTtlSeconds: { variable: "ACCESS_TOKEN_TTL_SECONDS", fallback: 900, min: 60, max: 86400 },
    refreshTokenTtlDays: { variable: "REFRESH_TOKEN_TTL_DAYS", fallback: 30, min: 1, max: 365 },
    otpRequestLimitPerHour: { variable: "OTP_REQUEST_LIMIT_PER_HOUR", fallback: 3, min: 1, max: 100 },
    otpVerifyLimitPerHour: { variable: "OTP_VERIFY_LIMIT_PER_HOUR", fallback: 5, min: 1, max: 100 },
    loginAttemptLimitPerWindow: { variable: "LOGIN_ATTEMPT_LIMIT", fallback: 10, min: 1, max: 1000 },
    bcryptRounds: { variable: "BCRYPT_ROUNDS", fallback: 12, min: 8, max: 15 },
    resetTokenTtlSeconds: { variable: "RESET_TOKEN_TTL_SECONDS", fallback: 300, min: 60, max: 3600 },
    otpTtlSeconds: { variable: "OTP_TTL_SECONDS", fallback: 600, min: 60, max: 3600 },
    mongoMaxPoolSize: { variable: "MONGO_MAX_POOL_SIZE", fallback: 10, min: 1, max: 50 },
  },
});

export const MONGO_URI_ENV = { secretId: config.mongoSecretId, value: config.mongoUri };
