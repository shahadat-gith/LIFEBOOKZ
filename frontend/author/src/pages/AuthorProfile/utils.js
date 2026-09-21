import moment from "moment";

/**
 * Derivations for an author's public profile.
 *
 * Everything here reads the payload of `GET /authors/:id`, which already
 * answers the questions this page would otherwise re-ask: whether the
 * signed-in account follows this author, and whether the profile is the
 * viewer's own.
 */

/** "March 2026" — when the author joined. */
export function joinedLabel(createdAt) {
  if (!createdAt) return "";
  const date = moment(createdAt);
  return date.isValid() ? `Joined ${date.format("MMMM YYYY")}` : "";
}

/**
 * The social links that were actually filled in, as icon-ready rows.
 * `keys` match the icons the profile page renders.
 */
export function filledSocialLinks(socialLinks = {}) {
  return Object.entries(socialLinks)
    .filter(([, url]) => Boolean(url))
    .map(([key, url]) => ({ key, url }));
}

/** The author's own profile — no follow button, no follower counts. */
export function isOwnProfile(author = {}) {
  return Boolean(author.isSelf);
}
