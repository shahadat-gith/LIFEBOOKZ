/**
 * Backfill missing usernames.
 *
 * Accounts created before `username` became required have no value for it, so
 * Mongoose validation rejects any `save()` on those documents — profile edits
 * and (formerly) password resets. This fills the gap using the same generator
 * registration uses.
 *
 *   node scripts/backfill-usernames.mjs          # dry run
 *   node scripts/backfill-usernames.mjs --apply  # write
 */
import dns from "node:dns";
import mongoose from "mongoose";

import config from "../src/core/config/index.js";
import User from "../src/modules/user/model.js";

// Some local resolvers refuse SRV lookups, which mongodb+srv:// needs.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const hasMissingUsername = { $or: [{ username: { $exists: false } }, { username: null }, { username: "" }] };

async function main() {
  const apply = process.argv.includes("--apply");

  await mongoose.connect(config.database.url);

  const { buildUniqueUsername } = await import(
    "../src/modules/user/service.js"
  );

  const users = await User.find(hasMissingUsername);

  console.log(`${users.length} user(s) without a username`);

  for (const user of users) {
    const username = await buildUniqueUsername(user.email);

    console.log(`  ${user.email} -> ${username}`);

    if (apply) {
      // A targeted write, so the incomplete document is not validated.
      await User.updateOne({ _id: user._id }, { $set: { username } });
    }
  }

  console.log(apply ? "Applied." : "Dry run — pass --apply to write.");

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
