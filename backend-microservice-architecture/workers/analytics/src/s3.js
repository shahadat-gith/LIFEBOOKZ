import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * S3 sink for analytics records.
 *
 * Writes JSONL batches under Hive-style partitions
 * (`events/year=YYYY/month=MM/day=DD/…`) so Athena can partition-project
 * them without any table rewrite. Parquet would need an extra runtime
 * dependency per Lambda; JSONL + small batches is the documented trade-off
 * (see the worker README) and is swappable behind this interface.
 *
 * The client is created once per container and cached, consistent with
 * `shared/aws`' client discipline. This is AWS S3 (analytics), not R2 —
 * no custom endpoint, no checksum workarounds needed here.
 */
export function createS3Sink({ bucket, prefix = "events/", region, client, logger } = {}) {
  if (!bucket) throw new Error("createS3Sink requires a bucket name");

  let cached;

  const s3 = () => {
    if (client) return client;
    if (!cached) cached = new S3Client({ region: region || process.env.AWS_REGION || "ap-south-1" });
    return cached;
  };

  async function put(key, body) {
    await s3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "application/jsonl; charset=utf-8",
        ServerSideEncryption: "AES256",
      }),
    );

    logger?.debug?.("Analytics batch written", { key, bytes: Buffer.byteLength(body) });
    return key;
  }

  return { put, bucket, prefix };
}
