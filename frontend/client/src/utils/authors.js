/** Whether an author carries an approved verification badge. */
export function isVerifiedAuthor(author) {
  return author?.verification?.status === "approved";
}

/** An author's display name, with the fallback every view uses. */
export function authorName(author) {
  return author?.fullName || "Anonymous Author";
}
