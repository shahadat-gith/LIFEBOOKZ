import { generateKeyPairSync } from "node:crypto";

import { createAccessTokenSigner, buildJwks, buildOpenIdConfiguration, publicJwk } from "@lifebookz/shared-auth";

// Configuration is validated at import time, so the contract is filled in
// before any service module is loaded.
process.env.NODE_ENV = "test";
process.env.EVENT_BUS_NAME ||= "lifebookz-events";
process.env.JWT_ISSUER ||= "https://api.lifebookz.com";
process.env.JWT_AUDIENCE ||= "lifebookz-api";
process.env.JWT_KID ||= "test-kid";

export const TEST_KID = process.env.JWT_KID;
export const TEST_ISSUER = process.env.JWT_ISSUER;
export const TEST_AUDIENCE = process.env.JWT_AUDIENCE;

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

export function createFakeKeyProvider() {
  const signer = createAccessTokenSigner({
    privateKey,
    kid: TEST_KID,
    issuer: TEST_ISSUER,
    audience: TEST_AUDIENCE,
    ttlSeconds: 900,
  });

  return {
    async issue({ account, extra, now }) {
      return signer.sign({ account, extra, now });
    },
    async jwks() {
      return buildJwks([publicJwk({ privateKey, kid: TEST_KID })]);
    },
    async openIdConfiguration() {
      return buildOpenIdConfiguration({ issuer: TEST_ISSUER });
    },
    publicKey,
  };
}

export function createLogger() {
  const lines = [];

  const logger = {
    lines,
    debug: (message, meta) => lines.push({ level: "debug", message, meta }),
    info: (message, meta) => lines.push({ level: "info", message, meta }),
    warn: (message, meta) => lines.push({ level: "warn", message, meta }),
    error: (message, meta) => lines.push({ level: "error", message, meta }),
    failure: (message, error, meta) => lines.push({ level: "error", message, meta, error }),
    child() {
      return logger;
    },
  };

  return logger;
}

export function createPublisher() {
  const published = [];

  return {
    published,
    async publish(input) {
      published.push(input);
      return { eventId: `evt-${published.length}`, ...input };
    },
    async publishSafely(input) {
      published.push(input);
      return { eventId: `evt-${published.length}`, ...input };
    },
    of(type) {
      return published.filter((event) => event.type === type);
    },
  };
}

export function createFakeAccounts(seed = []) {
  const docs = seed.map((doc, index) => ({ _id: doc._id || `acc-${index + 1}`, status: "active", ...doc }));

  const byEmail = (email) => docs.find((doc) => doc.email === String(email).toLowerCase());

  return {
    docs,
    async create(doc) {
      const account = {
        _id: `acc-${docs.length + 1}`,
        status: "active",
        verification: { status: "pending" },
        createdAt: new Date(),
        ...doc,
      };
      docs.push(account);
      return account;
    },
    async findByEmail(email, { withSecrets = false } = {}) {
      const account = byEmail(email);
      if (!account) return null;
      if (withSecrets) return account;
      return { ...account, credentials: { tokenVersion: account.credentials?.tokenVersion ?? 0 } };
    },
    async findByEmailRaw(email) {
      return byEmail(email) || null;
    },
    async findById(id) {
      return docs.find((doc) => String(doc._id) === String(id)) || null;
    },
    async findPublicById(id) {
      const account = await this.findById(id);
      if (!account) return null;
      return { _id: account._id, fullName: account.fullName, avatar: account.avatar || {}, createdAt: account.createdAt };
    },
    async emailExists(email) {
      return Boolean(byEmail(email));
    },
    async usernameExists(username) {
      return docs.some((doc) => doc.username === String(username).toLowerCase());
    },
    async findRolesByEmail(email) {
      return docs.filter((doc) => doc.email === String(email).toLowerCase()).map((doc) => doc.role);
    },
    async setLastLogin(id) {
      const account = await this.findById(id);
      if (account) account.lastLoginAt = new Date();
    },
    async setOtp(id, { hash, expiresAt, purpose }) {
      const account = await this.findById(id);
      if (account) account.otp = { hash, expiresAt, purpose, verifiedAt: null, attempts: 0 };
    },
    async setOtpVerified(id, { hash, expiresAt }) {
      const account = await this.findById(id);
      if (account) account.otp = { ...account.otp, hash, expiresAt, verifiedAt: new Date() };
    },
    async incrementOtpAttempts(id) {
      const account = await this.findById(id);
      if (account) account.otp = { ...account.otp, attempts: (account.otp?.attempts || 0) + 1 };
    },
    async findByOtpHash(hash) {
      return docs.find((doc) => doc.otp?.hash === hash && doc.otp?.verifiedAt && doc.otp?.expiresAt > new Date()) || null;
    },
    async completePasswordReset({ tokenHash, passwordHash, accountId }) {
      const account = docs.find(
        (doc) =>
          String(doc._id) === String(accountId) &&
          doc.otp?.hash === tokenHash &&
          doc.otp?.verifiedAt &&
          doc.otp?.expiresAt > new Date(),
      );

      if (!account) return false;

      account.credentials = {
        ...account.credentials,
        passwordHash,
        tokenVersion: (account.credentials?.tokenVersion ?? 0) + 1,
      };
      account.otp = { attempts: 0 };

      return true;
    },
    async updateProfile(id, patch) {
      const account = await this.findById(id);
      if (!account) return null;

      for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined) account[key] = value;
      }

      return account;
    },
    async setVerification(id, { status, reason, decidedBy }) {
      const account = await this.findById(id);
      if (!account) return null;
      account.verification = { status, rejectionReason: reason, decidedBy, verifiedAt: new Date() };
      return account;
    },
    async setStatus(id, status) {
      const account = await this.findById(id);
      if (account) account.status = status;
      return account;
    },
    async softDelete(id) {
      const account = await this.findById(id);
      if (account) {
        account.status = "deleted";
        account.credentials = { ...account.credentials, tokenVersion: (account.credentials?.tokenVersion ?? 0) + 1 };
      }
      return account;
    },
  };
}

export function createFakeRefreshTokens() {
  const rows = [];

  return {
    rows,
    async store(row) {
      rows.push({ _id: `rt-${rows.length + 1}`, revokedAt: null, usedAt: null, ...row });
      return rows.at(-1);
    },
    async findByHash(tokenHash) {
      return rows.find((row) => row.tokenHash === tokenHash) || null;
    },
    async markUsed(id, at = new Date()) {
      const row = rows.find((entry) => String(entry._id) === String(id));
      if (row) row.usedAt = at;
      return row;
    },
    async revokeFamily(familyId, reason) {
      let modified = 0;
      for (const row of rows) {
        if (row.familyId === familyId && !row.revokedAt) {
          row.revokedAt = new Date();
          row.revokedReason = reason;
          modified += 1;
        }
      }
      return modified;
    },
    async revokeAllForAccount(accountId, reason) {
      let modified = 0;
      for (const row of rows) {
        if (String(row.accountId) === String(accountId) && !row.revokedAt) {
          row.revokedAt = new Date();
          row.revokedReason = reason;
          modified += 1;
        }
      }
      return modified;
    },
    async revokeByHash(tokenHash, reason) {
      const row = rows.find((entry) => entry.tokenHash === tokenHash && !entry.revokedAt);
      if (!row) return 0;
      row.revokedAt = new Date();
      row.revokedReason = reason;
      return 1;
    },
    async countActive(accountId) {
      return rows.filter((row) => String(row.accountId) === String(accountId) && !row.revokedAt).length;
    },
  };
}

export function createFakeRateLimiter() {
  const counters = new Map();

  return {
    counters,
    async consume({ key, limit }) {
      const count = (counters.get(key) || 0) + 1;
      counters.set(key, count);

      return { allowed: count <= limit, count, limit, remaining: Math.max(limit - count, 0), retryAfterSeconds: count > limit ? 900 : 0 };
    },
  };
}

export function createFakeMediaStore() {
  return {
    async presignUpload({ kind, contentType, accountId }) {
      return { uploadUrl: "https://r2.example/put", key: `${kind}/${accountId}/file.jpg`, url: "https://cdn.example/file.jpg", expiresIn: 600, contentType };
    },
    async deleteMedia() {
      return true;
    },
  };
}
