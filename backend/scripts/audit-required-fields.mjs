/**
 * Read-only audit.
 *
 * Reports how many documents in each account collection are missing fields the
 * schema marks `required` — the data gap that makes `doc.save()` blow up on
 * flows that only touch `auth` (password reset being the one that hurts).
 *
 *   node scripts/audit-required-fields.mjs
 */
import dns from "node:dns";
import mongoose from "mongoose";
import config from "../src/core/config/index.js";
import User from "../src/modules/user/model.js";
import Author from "../src/modules/author/model.js";
import Expert from "../src/modules/expert/model.js";

// Some local resolvers refuse SRV lookups, which mongodb+srv:// needs.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const CHECKS = [
  { model: User, fields: ["fullName", "email", "username"] },
  { model: Author, fields: ["fullName", "email", "username"] },
  {
    model: Expert,
    fields: [
      "fullName",
      "email",
      "username",
      "phone",
      "expertise",
      "qualification",
    ],
  },
];

async function main() {
  await mongoose.connect(config.database.url);

  for (const { model, fields } of CHECKS) {
    const collection = model.collection;
    const label = model.modelName;

    const total = await collection.countDocuments();

    const perField = {};

    for (const field of fields) {
      perField[field] = await collection.countDocuments({
        $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: "" }],
      });
    }

    console.log(`\n${label}: ${total} documents`);
    for (const [field, count] of Object.entries(perField)) {
      console.log(`  ${field}: ${count} missing`);
    }
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
