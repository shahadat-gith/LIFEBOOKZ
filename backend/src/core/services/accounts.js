import User from "../../modules/user/model.js";
import Author from "../../modules/author/model.js";
import Expert from "../../modules/expert/model.js";

/**
 * Account types that own this email address.
 *
 * Every portal has its own collection and signs in independently, so the most
 * common cause of a failed sign-in is simply "this email belongs to another
 * portal". Naming the portal in the failure message saves the person a
 * support email that just says "wrong password".
 */
export async function findAccountRolesByEmail(email) {
  if (!email) return [];

  const [isUser, isAuthor, isExpert] = await Promise.all([
    User.exists({ email }),
    Author.exists({ email }),
    Expert.exists({ email }),
  ]);

  const roles = [];
  if (isUser) roles.push("user");
  if (isAuthor) roles.push("author");
  if (isExpert) roles.push("expert");

  return roles;
}

const ROLE_LABELS = {
  user: "reader",
  author: "author",
  expert: "expert",
};

/**
 * What to tell someone whose email has no account in the portal they typed it
 * into. When the address does exist elsewhere we point at the right portal.
 */
export function noAccountMessage(roles, portalRole) {
  const elsewhere = roles
    .filter((role) => role !== portalRole)
    .map((role) => ROLE_LABELS[role]);

  if (!elsewhere.length) return "No account found with this email.";

  const list =
    elsewhere.length === 1
      ? elsewhere[0]
      : `${elsewhere.slice(0, -1).join(", ")} or ${elsewhere.at(-1)}`;

  return `No account found with this email — it is registered as a ${list} account.`;
}
