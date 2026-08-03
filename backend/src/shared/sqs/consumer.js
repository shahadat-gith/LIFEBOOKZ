import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { client } from "./config.js";
import config from "../config/index.js";
import { dispatch } from "./workers/dispatcher.js";

let running = false;

async function deleteMessage(queueUrl, receiptHandle) {
  await client.send(
    new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    }),
  );
}

async function pollOnce() {
  const queueUrl = config.aws.sqs.queueUrl;

  const response = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      // Long-poll so an empty queue doesn't hammer AWS with requests
      WaitTimeSeconds: 20,
      // Jobs call LLMs which can take minutes — keep them hidden from other
      // consumers while in flight (default visibility is only 30s)
      VisibilityTimeout: 300,
    }),
  );

  const messages = response.Messages || [];

  for (const message of messages) {
    const receiptHandle = message.ReceiptHandle;

    let body;
    try {
      body = JSON.parse(message.Body || "{}");
    } catch (error) {
      console.error(
        "[SQS] ⚠ Invalid message body — deleting:",
        message.Body,
        error.message,
      );
      await deleteMessage(queueUrl, receiptHandle);
      continue;
    }

    const target = body.storyId || body.userId || "";

    try {
      await dispatch(body);
    } catch (error) {
      const errorText = error?.message || String(error);
      // The target story is gone — retrying can never succeed, so treat it
      // as terminal and delete the message. Kept narrow on purpose so that
      // other "not found" errors (e.g. a missing Qdrant collection) still
      // get retried instead of being silently dropped.
      const isTerminal = /story not found/i.test(errorText);

      if (isTerminal) {
        console.error(
          `[SQS] ⚠ Job failed terminally (${errorText}) — deleting message: ${body.jobType} ${target}`,
        );
        try {
          await deleteMessage(queueUrl, receiptHandle);
        } catch (deleteError) {
          console.error(
            "[SQS] ❌ Failed to delete terminally-failed message:",
            deleteError.message,
          );
        }
      } else {
        // Leave the message in the queue so SQS redelivers it after the
        // visibility timeout (eventually moving to the DLQ if configured).
        console.error(
          `[SQS] ❌ Job failed — message NOT deleted (will retry): ${body.jobType} ${target}`,
          errorText,
        );
      }
      continue;
    }

    try {
      await deleteMessage(queueUrl, receiptHandle);
    } catch (error) {
      // Job succeeded but we couldn't delete — it will be redelivered and
      // skipped by the workers' idempotency guards. Log for visibility.
      console.error(
        `[SQS] ⚠ Job done but delete failed (will be redelivered & skipped by idempotency): ${body.jobType} ${target}`,
        error.message,
      );
    }
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function startConsumer() {
  if (running) return;

  if (!config.aws.sqs.queueUrl) {
    console.error(
      "[SQS] ⚠ SQS_QUEUE_URL is not set — consumer not started. Story analysis/enrichment/embedding pipeline is DISABLED.",
    );
    return;
  }

  running = true;

  const loop = async () => {
    try {
      await pollOnce();
    } catch (error) {
      console.error("[SQS] ❌ Poll error — retrying in 5s:", error.message);
      await delay(5000);
    }

    setImmediate(loop);
  };

  loop();
}
