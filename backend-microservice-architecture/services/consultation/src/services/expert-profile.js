import { authorizationError, notFoundError, validationError } from "@lifebookz/shared-errors";
import { parseJsonField } from "@lifebookz/shared-validation";

import { CONSULT_CATEGORY_IDS } from "../constants.js";

/** Fields the expert must supply before the profile enters admin review. */
export function isProfileComplete(profile) {
  return Boolean(
    profile?.phone &&
      profile?.expertise &&
      profile?.qualification &&
      profile?.bio &&
      Array.isArray(profile?.categories) &&
      profile.categories.length > 0,
  );
}

export const EXPERT_MEDIA_KINDS = ["expertAvatar", "expertCover", "expertCoverMobile"];

/**
 * Expert profiles (Consulation service).
 *
 * Identity fields (`fullName`, `email`, `username`, `avatar`, account status,
 * verification) are a projection of the Auth account kept in sync by
 * `AccountProfileUpdated` / `AccountVerificationDecided` / `AccountStatusChanged`.
 * Professional fields are owned by this service. `PATCH /experts/me` accepts the
 * identity fields too, so the existing expert portal save-in-one-request flow
 * keeps working, but the authoritative write for identity is Auth's
 * `PATCH /api/v1/auth/me` — one writer per field, mirrored by the event.
 */
export function createExpertProfileService({ expertProfiles, bookings, mediaStore, publisher, logger }) {
  return {
    async mine({ accountId }) {
      const profile = await expertProfiles.findById(accountId);

      if (!profile) throw notFoundError("Expert profile not found.");

      const completeness = profile.isProfileCompleted ?? isProfileComplete(profile);

      return { ...profile, id: String(profile._id), role: "expert", isProfileCompleted: Boolean(completeness) };
    },

    async update({ accountId, claims, input }) {
      const profile = await expertProfiles.findById(accountId);

      if (!profile) throw notFoundError("Expert profile not found.");

      const categories = parseJsonField(input.categories);

      if (categories !== undefined) {
        const invalid = categories.filter((category) => !CONSULT_CATEGORY_IDS.includes(category));

        if (invalid.length > 0) {
          throw validationError(`Unknown consultancy category: ${invalid.join(", ")}.`);
        }
      }

      const patch = {};

      if (input.phone !== undefined) patch.phone = String(input.phone).trim().slice(0, 30);
      if (input.expertise !== undefined) patch.expertise = String(input.expertise).trim().slice(0, 200);
      if (input.qualification !== undefined) patch.qualification = String(input.qualification).trim().slice(0, 300);
      if (input.bio !== undefined) patch.bio = String(input.bio).trim().slice(0, 2000);
      if (input.languages !== undefined) patch.languages = input.languages;
      if (input.experience !== undefined) patch.experience = Number(input.experience) || 0;
      if (input.price !== undefined) patch.price = Number(input.price) || 0;
      if (categories !== undefined) patch.categories = categories;

      // Identity fields the expert portal also posts: accepted and applied here
      // as a projection only. Auth remains the source of truth.
      if (input.fullName !== undefined) patch.fullName = String(input.fullName).trim();
      if (input.username !== undefined) patch.username = String(input.username).trim().toLowerCase();
      if (input.avatar !== undefined) patch.avatar = input.avatar;
      if (input.coverImage !== undefined) patch.coverImage = input.coverImage;
      if (input.coverImageMobile !== undefined) patch.coverImageMobile = input.coverImageMobile;

      const wasComplete = Boolean(profile.isProfileCompleted);
      const nowComplete = isProfileComplete({ ...profile, ...patch });

      if (nowComplete && !wasComplete) {
        patch.isProfileCompleted = true;
        patch.profileSubmittedAt = new Date();
      }

      const updated = await expertProfiles.updateOwned(accountId, patch);

      // A newly completed profile enters the admin review queue. System owns the
      // queue; Auth owns the verification decision; this event is the handoff.
      if (nowComplete && !wasComplete) {
        await publisher?.publishSafely({
          type: "ExpertProfileSubmitted",
          data: { accountId: String(accountId), fullName: updated.fullName, expertise: updated.expertise, categories: updated.categories },
          actor: claims,
        });
      } else {
        await publisher?.publishSafely({
          type: "ExpertProfileUpdated",
          data: {
            accountId: String(accountId),
            fullName: updated.fullName,
            expertise: updated.expertise,
            categories: updated.categories,
            price: updated.price,
            isProfileCompleted: Boolean(updated.isProfileCompleted),
          },
          actor: claims,
        });
      }

      return { ...updated, id: String(updated._id), role: "expert" };
    },

    /** Public expert page: profile + the counters the page renders. */
    async publicProfile({ expertId }) {
      const profile = await expertProfiles.findPublicById(expertId);

      if (!profile) throw notFoundError("Expert not found.");

      const [completed, total] = await Promise.all([
        bookings.count({ expertId, status: "completed" }),
        bookings.count({ expertId }),
      ]);

      return { ...profile, id: String(profile._id), role: "expert", stats: { completedConsultations: completed, totalRequests: total } };
    },

    /**
     * Presigned upload for expert media.
     *
     * R2 stays the media store (analytics uses S3 — different responsibility),
     * and the browser uploads directly, exactly like the monolith's
     * `/experts/me/media/presign`-equivalent flow.
     */
    async presignMedia({ accountId, input }) {
      if (!EXPERT_MEDIA_KINDS.includes(input.kind)) {
        throw validationError("Unsupported media kind for the expert profile.");
      }

      return mediaStore.presignUpload({ ...input, accountId });
    },

    async deleteMedia({ accountId, input }) {
      const key = input.key || mediaStore.objectKeyFromUrl(input.url);

      if (!key) throw validationError("Provide the media key or url to delete.");

      // An expert may only remove objects under the expert media prefixes.
      if (!String(key).startsWith("experts/")) {
        throw authorizationError("You can only delete your own expert media.");
      }

      return { deleted: await mediaStore.deleteMedia({ key, logger }) };
    },
  };
}
