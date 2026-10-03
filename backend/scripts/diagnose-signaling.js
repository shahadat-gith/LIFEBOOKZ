/**
 * Signaling relay diagnostic — drives the REST signaling API exactly the way
 * the two rooms do: user posts an offer + ICE, expert pulls, expert answers,
 * user pulls. Verifies the relay end-to-end against the RUNNING server.
 *
 * Usage: node scripts/diagnose-signaling.js <consultationId>
 */
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const root = path.resolve(process.cwd());
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]),
);

const consultationId = process.argv[2];
if (!consultationId) {
  console.error("Usage: node scripts/diagnose-signaling.js <consultationId>");
  process.exit(1);
}

const API = `http://localhost:${env.PORT || 5000}/api/v1`;

// ---------------------------------------------------------------------------
// Load the consultation to learn the participant ids
// ---------------------------------------------------------------------------

let userToken;
let expertToken;

if (process.argv[3] && process.argv[4]) {
  // Ids passed explicitly — no DB access needed.
  userToken = jwt.sign({ role: "user", userId: process.argv[3] }, env.JWT_SECRET, { expiresIn: "1h" });
  expertToken = jwt.sign({ role: "expert", expertId: process.argv[4] }, env.JWT_SECRET, { expiresIn: "1h" });
} else {
await mongoose.connect(env.DATABASE_URL);
const consultation = await mongoose.connection
  .collection("consultations")
  .findOne({ _id: new mongoose.Types.ObjectId(consultationId) });

if (!consultation) {
  console.error("Consultation not found:", consultationId);
  process.exit(1);
}

console.log("Consultation status:", consultation.status);
console.log("payment.paid:", consultation.payment?.paid);
console.log("session.startedAt:", consultation.session?.startedAt);
console.log(
  "session heartbeats:",
  consultation.session?.userHeartbeatAt,
  "/",
  consultation.session?.expertHeartbeatAt,
);

userToken = jwt.sign({ role: "user", userId: String(consultation.user) }, env.JWT_SECRET, {
  expiresIn: "1h",
});
expertToken = jwt.sign(
  { role: "expert", expertId: String(consultation.expert) },
  env.JWT_SECRET,
  { expiresIn: "1h" },
);

await mongoose.disconnect();
}

// ---------------------------------------------------------------------------
// REST helpers
// ---------------------------------------------------------------------------

async function call(token, method, url, body) {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

// ---------------------------------------------------------------------------
// Drive the relay
// ---------------------------------------------------------------------------

// 1. User: session config
const cfgUser = await call(userToken, "GET", `/consult/${consultationId}/session`);
console.log("\n[1] GET session (user) →", cfgUser.status, JSON.stringify(cfgUser.json).slice(0, 300));

const cfgExpert = await call(expertToken, "GET", `/consult/${consultationId}/session`);
console.log("[2] GET session (expert) →", cfgExpert.status, JSON.stringify(cfgExpert.json).slice(0, 300));

// 3. User posts an offer (fake SDP is fine — we test the relay, not WebRTC)
const fakeSdp = { type: "offer", sdp: "v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\n" };
const posted = await call(userToken, "POST", `/consult/${consultationId}/session/signal`, {
  type: "offer",
  payload: fakeSdp,
});
console.log("[3] POST signal offer (user) →", posted.status, JSON.stringify(posted.json).slice(0, 200));

// 4. User posts an ICE candidate
const ice = await call(userToken, "POST", `/consult/${consultationId}/session/signal`, {
  type: "ice",
  payload: { candidate: "candidate:1 1 udp 1 127.0.0.1 5000 typ host", sdpMid: "0" },
});
console.log("[4] POST signal ice (user) →", ice.status, JSON.stringify(ice.json).slice(0, 200));

// 5. Expert pulls — must see the offer and the ICE
const pull1 = await call(expertToken, "GET", `/consult/${consultationId}/session/messages`);
console.log(
  "[5] GET messages (expert) →",
  pull1.status,
  (pull1.json?.data?.messages || []).map((m) => m.type).join(", ") || "NO MESSAGES",
);

// 6. Expert answers
const answer = await call(expertToken, "POST", `/consult/${consultationId}/session/signal`, {
  type: "answer",
  payload: { type: "answer", sdp: "v=0\r\no=- 2 2 IN IP4 127.0.0.1\r\n" },
});
console.log("[6] POST signal answer (expert) →", answer.status, JSON.stringify(answer.json).slice(0, 200));

// 7. User pulls — must see the answer
const pull2 = await call(userToken, "GET", `/consult/${consultationId}/session/messages`);
console.log(
  "[7] GET messages (user) →",
  pull2.status,
  (pull2.json?.data?.messages || []).map((m) => m.type).join(", ") || "NO MESSAGES",
);

// 8. Full relay view: what each side sees
const all1 = await call(expertToken, "GET", `/consult/${consultationId}/session/messages`);
console.log(
  "[8] EXPERT inbox:",
  (all1.json?.data?.messages || []).map((m) => `${m.from}:${m.type}`).join(", ") || "EMPTY",
);
const all2 = await call(userToken, "GET", `/consult/${consultationId}/session/messages`);
console.log(
"    USER   inbox:",
  (all2.json?.data?.messages || []).map((m) => `${m.from}:${m.type}`).join(", ") || "EMPTY",
);

// 9. Cursor check: pull again with `after` — should be empty
const after = pull2.json?.data?.messages?.at(-1)?.id;
const pull3 = await call(userToken, "GET", `/consult/${consultationId}/session/messages?after=${after}`);
console.log(
  "[8] GET messages after cursor (user) →",
  pull3.status,
  (pull3.json?.data?.messages || []).length === 0 ? "empty (cursor works)" : "unexpected messages!",
);

console.log("\nDone.");
