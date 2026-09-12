import User from "../../modules/user/model.js";
import Author from "../../modules/author/model.js";
import Expert from "../../modules/expert/model.js";

/**
 * Account types that own this email address.
 *
 * Every portal has its own collection and signs in independently, so the most
 * common cause of a failed sign-in is simply "this email belongs to another
 * portal". Recording which one it is makes that diagnosable from the logs
 * without telling anonymous callers whether an email exists.
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
