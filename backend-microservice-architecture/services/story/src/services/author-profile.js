import { badRequestError, notFoundError } from "@lifebookz/shared-errors";

import { parseJsonField } from "@lifebookz/shared-validation";

/** Author-facing media kinds this service presigns. */
const AUTHOR_MEDIA_KINDS = ["authorAvatar", "authorCover", "authorCoverMobile"];

/** The fields whose presence unlocks publishing (same set as the monolith). */
export function isProfileComplete(profile) {
  return Boolean(profile?.profession && profile?.bio && profile?.phone && profile?.dob && profile?.gender);
}

/**
 * Author profiles.
 *
 * `fullName` and `avatar` are projections of the Auth account; the professional
 * fields are owned here. `PATCH /authors/me` writes the professional fields and
 * *also* accepts identity fields so the existing author-portal save flow keeps
 * working in one request — but identity changes are applied by Auth
 * (`PATCH /api/v1/auth/me`) and mirrored back through `AccountProfileUpdated`,
 * so there is still exactly one writer per field.
 */
export function createAuthorProfileService({ authorProfiles, lifebooks, engagement, mediaStore, publisher, logger }) {
  return {
    async mine({ accountId }) {
      const profile = await authorProfiles.findById(accountId);

      if (!profile) throw notFoundError("Author profile not found.");

      const submitted = profile.isProfileCompleted ?? isProfileComplete(profile);

      return { ...profile, id: String(profile._id), role: "author", isProfileCompleted: Boolean(submitted) };
    },

    async update({ accountId, claims, input }) {
      const profile = await authorProfiles.findById(accountId);

      if (!profile) throw notFoundError("Author profile not found.");

      const patch = {};

      if (input.profession !== undefined) patch.profession = String(input.profession).trim().slice(0, 100);
      if (input.bio !== undefined) patch.bio = String(input.bio).trim().slice(0, 2000);
      if (input.phone !== undefined) patch.phone = String(input.phone).trim();
      if (input.dob !== undefined) patch.dob = input.dob ? new Date(input.dob) : null;
      if (input.gender !== undefined) patch.gender = input.gender || null;

      // FormData sends nested objects as JSON strings.
      const address = parseJsonField(input.address);
      if (address) patch.address = { ...profile.address, ...address };

      const socialLinks = parseJsonField(input.socialLinks);
      if (socialLinks) patch.socialLinks = { ...profile.socialLinks, ...socialLinks };

      for (const field of ["avatar", "coverImage", "coverImageMobile"]) {
        if (input[field] !== undefined) patch[field] = input[field];
      }

      const wasComplete = Boolean(profile.isProfileCompleted);
      // Captured before the write: `profile` may be the same object the
      // repository mutates, so comparing against it after the update would
      // always look unchanged.
      const previousProfession = profile.profession;
      const merged = { ...profile, ...patch };
      const nowComplete = isProfileComplete(merged);

      if (nowComplete && !wasComplete) {
        patch.isProfileCompleted = true;
        patch.profileSubmittedAt = new Date();
      }

      const updated = await authorProfiles.updateOwned(accountId, patch);

      // The feed filters on the lifebook's denormalised profession, so a
      // profession change has to be propagated to the author's existing books.
      if (patch.profession !== undefined && patch.profession !== previousProfession) {
        const touched = await lifebooks.updateAuthorProfession({ authorId: accountId, profession: patch.profession });
        logger?.info?.("Author profession propagated to lifebooks", { accountId: String(accountId), touched });
      }

      // A freshly completed profile enters the admin review queue (System
      // keeps the review read model; Auth owns the verification state).
      if (nowComplete && !wasComplete) {
        await publisher?.publishSafely({
          type: "AuthorProfileSubmitted",
          data: {
            accountId: String(accountId),
            fullName: updated.fullName,
            profession: updated.profession,
          },
          actor: claims,
        });
      } else {
        await publisher?.publishSafely({
          type: "AuthorProfileUpdated",
          data: {
            accountId: String(accountId),
            fullName: updated.fullName,
            profession: updated.profession,
            isProfileCompleted: Boolean(updated.isProfileCompleted),
          },
          actor: claims,
        });
      }

      return { ...updated, id: String(updated._id), role: "author" };
    },

    /** Public author profile: the page needs the story count and follow state. */
    async publicProfile({ authorId, claims }) {
      const profile = await authorProfiles.findById(authorId, { publicOnly: true });

      if (!profile) throw notFoundError("Author not found.");

      const isSelf = Boolean(claims?.accountId) && String(claims.accountId) === String(authorId);

      const [storyCount, follow] = await Promise.all([
        lifebooks.countByAuthor({ authorId, status: "published" }),
        !claims?.accountId || isSelf ? null : engagement.findFollow({ followerId: claims.accountId, authorId }),
      ]);

      return {
        ...profile,
        id: String(profile._id),
        role: "author",
        stats: { ...profile.stats, stories: storyCount },
        isSelf,
        isFollowedByLoggedInUser: Boolean(follow),
      };
    },

    async approvedAuthors() {
      const rows = await authorProfiles.listApproved();

      return Promise.all(
        rows.map(async (row) => ({
          ...row,
          id: String(row._id),
          role: "author",
          storyCount: await lifebooks.countByAuthor({ authorId: row._id, status: "published" }),
        })),
      );
    },

    async professions() {
      return authorProfiles.listProfessions();
    },

    async presignMedia({ accountId, input }) {
      if (!AUTHOR_MEDIA_KINDS.includes(input.kind)) {
        throw badRequestError(`Only ${AUTHOR_MEDIA_KINDS.join(", ")} can be presigned here.`);
      }

      return mediaStore.presignUpload({ ...input, accountId });
    },
  };
}
