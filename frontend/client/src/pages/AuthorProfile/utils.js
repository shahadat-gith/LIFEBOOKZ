import { formatDate } from "../../utils/helpers";

/**
 * Derivations for an author's public profile.
 *
 * Everything here reads the payload of `GET /authors/:id`, which already
 * answers the questions this page would otherwise re-ask: whether the
 * signed-in account follows this author, and whether the profile is the
 * viewer's own.
 */

/** "Joined March 2026" — when the author joined. */
export function joinedLabel(createdAt) {
  return createdAt ? `Joined ${formatDate(createdAt, "MMMM YYYY")}` : "";
}

/** The follower/story/like numbers shown as a stat strip. */
export function profileStats(author = {}) {
  const stats = author.stats || {};
  return [
    { label: "Followers", value: stats.followers || 0 },
    { label: "Stories", value: stats.stories || 0 },
    { label: "Likes", value: stats.likes || 0 },
  ];
}

/** The social links that were actually filled in, as icon-ready rows. */
export function filledSocialLinks(socialLinks = {}) {
  return Object.entries(socialLinks)
    .filter(([, url]) => Boolean(url))
    .map(([key, url]) => ({ key, url }));
}

/** @handle · PROFESSION · Joined <date>, in one row. */
export function profileMeta(author = {}) {
  return [
    author.username ? `@${author.username}` : "",
    author.profession || "",
    joinedLabel(author.createdAt),
  ].filter(Boolean);
}
