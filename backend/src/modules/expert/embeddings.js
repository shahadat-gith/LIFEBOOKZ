import config from "../../core/config/index.js";
import { getQdrantClient } from "../../core/config/qdrant.js";
import { generateEmbedding } from "../../core/services/embedding.js";
import { logger } from "../../core/services/logger.js";
import { toQdrantUuid } from "../../core/utils/helpers.js";
import * as Errors from "../../core/utils/errors.js";
import Expert from "./model.js";
import { categoryLabel } from "./constants.js";

const qdrant = getQdrantClient();

const COLLECTION = config.qdrant.collections.expert;

// Creating a collection is idempotent but not free, so remember it per process.
let collectionReady = false;

/**
 * Make sure the expert embeddings collection exists before we read/write it.
 * Qdrant throws when a collection is missing, so we create it on first use.
 */
export async function ensureExpertCollection() {
  if (collectionReady) return;

  try {
    await qdrant.getCollection(COLLECTION);
    collectionReady = true;
    return;
  } catch {
    // Collection is missing — fall through and create it.
  }

  try {
    await qdrant.createCollection(COLLECTION, {
      vectors: {
        size: config.qdrant.vectorSize,
        distance: "Cosine",
      },
    });
  } catch (error) {
    // Another request may have created it between our check and create.
    if (!/already exists/i.test(error?.message || "")) {
      throw error;
    }
  }

  // Keyword index so category-filtered searches stay fast. Best-effort —
  // filtering still works without it, and it errors when already present.
  try {
    await qdrant.createPayloadIndex(COLLECTION, {
      field_name: "categories",
      field_schema: "keyword",
    });
  } catch {
    // Index already exists or the server skipped it — safe to ignore.
  }

  collectionReady = true;
}

/**
 * The single text blob that represents an expert for semantic matching.
 * Mirrors the fields a user describes in the consult form.
 */
export function buildExpertEmbeddingText(expert) {
  const categories = (expert.categories || [])
    .map((id) => categoryLabel(id))
    .join(", ");

  return [
    `Expert: ${expert.fullName}`,
    `Area of expertise: ${expert.expertise}`,
    `Qualification: ${expert.qualification}`,
    `Consultancy categories: ${categories}`,
    expert.experience ? `Experience: ${expert.experience} years` : "",
    (expert.languages || []).length
      ? `Languages: ${expert.languages.join(", ")}`
      : "",
    `About: ${expert.bio}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Build the matching text and ask the model for its vector. Writes nothing —
 * callers can therefore decide whether to persist the expert at all.
 *
 * Throws a ServiceUnavailableError when the embedding provider is down, so
 * onboarding is failed loudly instead of storing an expert that can never be
 * matched.
 */
export async function embedExpertProfile(expert) {
  const text = buildExpertEmbeddingText(expert).trim();

  if (!text) {
    throw new Errors.ValidationError(
      "Add your expertise, qualification and bio so we can build your matching profile.",
    );
  }

  try {
    const vector = await generateEmbedding(text);

    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error("Embedding provider returned an empty vector.");
    }

    return { text, vector };
  } catch (error) {
    logger.error("Expert profile embedding failed", {
      expertId: expert?._id?.toString() || null,
      reason: error.message,
      stack: error.stack,
    });

    throw new Errors.ServiceUnavailableError(
      "We couldn't build your expert matching profile right now. Please try again in a moment.",
    );
  }
}

/**
 * Write the vector into Qdrant so the expert becomes discoverable in consult
 * matching. Payload is built from the in-memory document, which lets
 * onboarding store the vector before the expert row exists.
 */
export async function storeExpertVector(expert, { vector }) {
  try {
    await ensureExpertCollection();

    await qdrant.upsert(COLLECTION, {
      wait: true,
      points: [
        {
          id: toQdrantUuid(expert._id || expert.id),
          vector,
          payload: {
            expertId: expert.id,
            fullName: expert.fullName,
            expertise: expert.expertise,
            qualification: expert.qualification,
            categories: expert.categories || [],
            rating: expert.rating || 0,
            experience: expert.experience || 0,
            price: expert.price || 0,
            avatarUrl: expert.avatar?.url || "",
          },
        },
      ],
    });
  } catch (error) {
    logger.error("Expert vector upsert failed", {
      expertId: expert?.id || null,
      reason: error.message,
      stack: error.stack,
    });

    throw new Errors.ServiceUnavailableError(
      "We couldn't save your expert search profile right now. Please try again in a moment.",
    );
  }
}

/**
 * Drop an expert's vector. Used to undo a half-finished onboarding so no
 * stray point survives a failed registration.
 */
export async function removeExpertVector(expert) {
  await ensureExpertCollection();

  await qdrant.delete(COLLECTION, {
    wait: true,
    points: [toQdrantUuid(expert._id || expert.id)],
  });
}

/**
 * Embed an expert's profile, upsert the vector and mirror the embedded text
 * onto the document. Only re-embeds when the embeddable text changed, unless
 * `force`.
 *
 * Throws when the embedding or the index write fails — callers that expose
 * the expert publicly (approval) must not continue silently.
 */
export async function syncExpertEmbedding(expert, { force = false } = {}) {
  const text = buildExpertEmbeddingText(expert).trim();

  if (!text) return false;

  if (!force) {
    // embeddingText is select:false, so load it explicitly to detect no-op
    // updates and avoid burning an embedding call on every profile save.
    const current = await Expert.findById(expert._id)
      .select("+embeddingText")
      .lean();

    if (current?.embeddingText === text) return false;
  }

  const embedding = await embedExpertProfile(expert);

  await storeExpertVector(expert, embedding);

  await Expert.updateOne(
    { _id: expert._id },
    {
      $set: {
        embeddingText: embedding.text,
        embeddingUpdatedAt: new Date(),
      },
    },
  );

  // Keep the in-memory doc in sync for callers that reuse it.
  expert.embeddingText = embedding.text;
  expert.embeddingUpdatedAt = new Date();

  return true;
}

/**
 * Vector search over approved experts.
 * Returns raw Qdrant hits (highest score first).
 */
export async function searchExpertVectors({ text, category, limit = 15 }) {
  await ensureExpertCollection();

  const embedding = await generateEmbedding(text);

  const must = [];
  if (category) {
    must.push({ key: "categories", match: { value: category } });
  }

  return qdrant.search(COLLECTION, {
    vector: embedding,
    limit,
    with_payload: true,
    ...(must.length ? { filter: { must } } : {}),
  });
}
