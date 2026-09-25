import { timingSafeEqual } from "node:crypto";

import { authenticationError } from "@lifebookz/shared-errors";

/**
 * Service-to-service authentication.
 *
 * Used for the one privileged, internal call in the architecture:
 * `system` -> `auth` to record an admin's verification decision. The token
 * lives in Secrets Manager (`INTERNAL_SERVICE_TOKEN_SECRET_ID`) and is rotated
 * independently of user credentials.
 */
export const SERVICE_TOKEN_HEADER = "x-lifebookz-service-token";

export function readServiceToken(headers = {}) {
  for (const [key, value] of Object.entries(headers || {})) {
    if (key.toLowerCase() === SERVICE_TOKEN_HEADER) return value;
  }

  return null;
}

/** Constant-time comparison so a token cannot be brute-forced byte by byte. */
export function assertServiceToken(provided, expected, { headerName = SERVICE_TOKEN_HEADER } = {}) {
  if (!expected) {
    throw authenticationError("Service authentication is not configured.");
  }

  if (!provided || typeof provided !== "string") {
    throw authenticationError(`Missing ${headerName} header.`);
  }

  const left = Buffer.from(provided);
  const right = Buffer.from(expected);

  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw authenticationError("Invalid service token.");
  }

  return true;
}
