import test from "node:test";
import assert from "node:assert/strict";

import { createRouter } from "@lifebookz/shared-aws";

import { createFakeAccountProjections, createFakeNotifications, createFakeQueue, createLogger, createPublisher } from "./fakes.js";

import routes from "../src/routes.js";
import { createEmailJobService } from "../src/services/email-jobs.js";
import { createNotificationService } from "../src/services/notifications.js";

const AUTHOR = "65f1c0a2b3d4e5f6a7b8c9d0";
const READER = "65f1c0a2b3d4e5f6a7b8c9d2";

const cfg = { maxNotificationFanout: 500, maxNotificationsPerPage: 50 };

function createDeps() {
  const logger = createLogger();
  const publisher = createPublisher();
  const notifications = createFakeNotifications();
  const accountProjections = createFakeAccountProjections();

  return {
    publisher,
    notifications,
    accountProjections,
    notificationService: createNotificationService({ notifications, accountProjections, logger, cfg }),
    emailJobService: createEmailJobService({ queue: createFakeQueue(), config: cfg, logger }),
    ready: async () => true,
  };
}

function buildRouter(deps) {
  return createRouter({ service: "notification", routes, logger: createLogger(), createDeps: async () => deps });
}

function event({ method = "GET", path, claims, query } = {}) {
  return {
    rawPath: path,
    requestContext: {
      requestId: "req-notif-1",
      http: { method, path },
      ...(claims ? { authorizer: { jwt: { claims } } } : {}),
    },
    ...(query ? { queryStringParameters: query } : {}),
  };
}

const authorClaims = { sub: AUTHOR, role: "author" };
const readerClaims = { sub: READER, role: "user" };

test("the inbox requires an account token and rejects privileged roles", async () => {
  const router = buildRouter(createDeps());

  const anonymous = await router.handler(event({ path: "/api/v1/notifications" }));
  assert.equal(anonymous.statusCode, 401);

  const admin = await router.handler(event({ path: "/api/v1/notifications", claims: { sub: "admin-1", role: "admin" } }));
  assert.equal(admin.statusCode, 403);
});

test("an author's inbox never exposes a reader's notifications", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  await deps.notificationService.create({
    recipient: { id: READER, model: "User" },
    type: "system",
    preview: "welcome",
  });
  await deps.notificationService.create({
    recipient: { id: AUTHOR, model: "Author" },
    type: "like",
    preview: "liked your lifebook",
    link: "/feed/story/my-life",
  });

  const authorInbox = await router.handler(event({ path: "/api/v1/notifications", claims: authorClaims }));
  const body = JSON.parse(authorInbox.body);

  assert.equal(authorInbox.statusCode, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.items.length, 1);
  assert.equal(body.data.items[0].preview, "liked your lifebook");

  const unread = await router.handler(event({ path: "/api/v1/notifications/unread-count", claims: authorClaims }));
  assert.equal(JSON.parse(unread.body).data.count, 1);
});

test("read state can be set per notification and for the whole inbox", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const first = await deps.notificationService.create({ recipient: { id: AUTHOR, model: "Author" }, type: "like", preview: "a" });
  await deps.notificationService.create({ recipient: { id: AUTHOR, model: "Author" }, type: "follow", preview: "b" });

  const read = await router.handler(
    event({ method: "PATCH", path: `/api/v1/notifications/${first._id}/read`, claims: authorClaims }),
  );
  assert.equal(read.statusCode, 200);

  const count = await router.handler(event({ path: "/api/v1/notifications/unread-count", claims: authorClaims }));
  assert.equal(JSON.parse(count.body).data.count, 1);

  const readAll = await router.handler(event({ method: "PATCH", path: "/api/v1/notifications/read-all", claims: authorClaims }));
  assert.equal(readAll.statusCode, 200);
  assert.equal(JSON.parse(readAll.body).data.modifiedCount, 1);

  const after = await router.handler(event({ path: "/api/v1/notifications/unread-count", claims: authorClaims }));
  assert.equal(JSON.parse(after.body).data.count, 0);
});

test("marking another account's notification as read is a 404, not a 403", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const other = await deps.notificationService.create({ recipient: { id: READER, model: "User" }, type: "like", preview: "a" });

  const response = await router.handler(
    event({ method: "PATCH", path: `/api/v1/notifications/${other._id}/read`, claims: authorClaims }),
  );

  assert.equal(response.statusCode, 404);
  assert.equal(JSON.parse(response.body).error.code, "NOT_FOUND");
});

test("deleting one notification and clearing the inbox are both scoped to the caller", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const mine = await deps.notificationService.create({ recipient: { id: AUTHOR, model: "Author" }, type: "like", preview: "a" });
  await deps.notificationService.create({ recipient: { id: AUTHOR, model: "Author" }, type: "follow", preview: "b" });
  await deps.notificationService.create({ recipient: { id: READER, model: "User" }, type: "like", preview: "c" });

  const deleted = await router.handler(event({ method: "DELETE", path: `/api/v1/notifications/${mine._id}`, claims: authorClaims }));
  assert.equal(deleted.statusCode, 200);

  const missing = await router.handler(event({ method: "DELETE", path: `/api/v1/notifications/${mine._id}`, claims: authorClaims }));
  assert.equal(missing.statusCode, 404);

  const cleared = await router.handler(event({ method: "DELETE", path: "/api/v1/notifications", claims: authorClaims }));
  assert.equal(JSON.parse(cleared.body).data.deletedCount, 1);

  // The reader's notification survived.
  const readerInbox = await router.handler(event({ path: "/api/v1/notifications", claims: readerClaims }));
  assert.equal(JSON.parse(readerInbox.body).data.items.length, 1);
});

test("the pagination cursor and limit are validated", async () => {
  const router = buildRouter(createDeps());

  const tooBig = await router.handler(
    event({ path: "/api/v1/notifications", claims: authorClaims, query: { limit: "500" } }),
  );
  assert.equal(tooBig.statusCode, 422);

  const ok = await router.handler(event({ path: "/api/v1/notifications", claims: authorClaims, query: { limit: "5" } }));
  assert.equal(ok.statusCode, 200);
});
