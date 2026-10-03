/**
 * Sets up a complete FREE consultation end-to-end via the RUNNING API so the
 * WebRTC rooms can be reproduced in a browser without Razorpay:
 *
 *   1. registers an expert with price 0 (free) and gets admin approval
 *   2. registers a user
 *   3. user books the expert (match → request)
 *   4. expert accepts (free → CONFIRMED, already paid)
 *   5. prints the consultation id + both auth tokens
 *
 * Usage: node scripts/setup-webrtc-repro.js
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]),
);

const API = `http://localhost:${env.PORT || 5000}/api/v1`;
const stamp = Date.now();

async function call(method, url, body, token) {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (res.status >= 400) {
    console.error(`  ✗ ${method} ${url} → ${res.status}`, JSON.stringify(json).slice(0, 300));
  }
  return { status: res.status, json };
}

// 1. Expert (price 0 → free consultation, no Razorpay in the repro)
console.log("Registering expert…");
const expertRes = await call("POST", "/experts/register", {
  fullName: "Dr Repro Expert",
  username: `repro_expert_${stamp}`,
  email: `repro.expert.${stamp}@test.local`,
  password: "Repro#12345",
  phone: "9999999999",
  expertise: "Reprology & Signal Diagnostics",
  qualification: "PhD in Reproduction",
  categories: ["education"],
  bio: "Dedicated to reproducing connection bugs on demand. Fully qualified, fully fictional.",
  languages: ["English"],
  experience: 5,
  price: 0,
});
const expert = expertRes.json?.data?.expert;
const expertToken = expertRes.json?.data?.token;
if (!expert) process.exit(1);
console.log("  expert:", expert.id, expert.email);

// 2. Admin approval
console.log("Admin login + approve…");
const adminLogin = await call("POST", "/admin/login", {
  email: env.ADMIN_EMAIL,
  password: env.ADMIN_PASSWORD,
});
const adminToken = adminLogin.json?.data?.token;
if (!adminToken) process.exit(1);
await call("PATCH", `/admin/experts/${expert.id}/approve`, {}, adminToken);
console.log("  approved");

// 3. User
console.log("Registering user…");
const userRes = await call("POST", "/users/register", {
  fullName: "Repro User",
  email: `repro.user.${stamp}@test.local`,
  password: "Repro#12345",
});
const user = userRes.json?.data?.user;
const userToken = userRes.json?.data?.token;
if (!user) process.exit(1);
console.log("  user:", user.id, user.email);

// 4. Match + book
console.log("Matching…");
const match = await call("POST", "/consult/match", { problem: "I need help reproducing a connection bug.", category: "education" }, userToken);
const found = match.json?.data?.experts || [];
console.log("  matched:", found.map((e) => e.fullName).join(", ") || "NONE");
if (!found.length) process.exit(1);

const book = await call("POST", "/consult/requests", {
  expertId: expert.id,
  problem: "I need help reproducing a connection bug.",
  category: "education",
}, userToken);
const consultationId = book.json?.data?.id || book.json?.data?._id;
console.log("  booked:", consultationId);

// 5. Expert accepts
console.log("Expert accepts…");
const accept = await call("POST", `/consult/${consultationId}/accept`, {}, expertToken);
console.log("  status:", accept.json?.data?.status, "| paid:", accept.json?.data?.payment?.paid ?? accept.json?.data?.amount === 0 ? "(free)" : "?");

// 6. User joins to start the session
console.log("User joins…");
const join = await call("POST", `/consult/${consultationId}/session/join`, {}, userToken);
console.log("  status:", join.json?.data?.status);

console.log("\n==================== REPRO READY ====================");
console.log("consultationId:", consultationId);
console.log("USER token   :", userToken);
console.log("EXPERT token :", expertToken);
