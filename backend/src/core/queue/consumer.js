import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { client } from "./config.js";
import config from "../config/index.js";
import { logger } from "../services/logger.js";
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
      logger.error("Discarding SQS message with invalid JSON body", {
        body: message.Body,
        reason: error.message,
      });

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
        logger.error("SQS job failed terminally — message deleted", {
          jobType: body.jobType,
          targetId: target,
          reason: errorText,
          stack: error?.stack,
        });

        try {
          await deleteMessage(queueUrl, receiptHandle);
        } catch (deleteError) {
          logger.error("Failed to delete terminally-failed SQS message", {
            jobType: body.jobType,
            targetId: target,
            reason: deleteError.message,
            stack: deleteError.stack,
          });
        }
      } else {
        // Leave the message in the queue so SQS redelivers it after the
        // visibility timeout (eventually moving to the DLQ if configured).
        logger.error("SQS job failed — message kept for retry", {
          jobType: body.jobType,
          targetId: target,
          reason: errorText,
          stack: error?.stack,
        });
      }
      continue;
    }

    try {
      await deleteMessage(queueUrl, receiptHandle);
    } catch (error) {
      // Job succeeded but we couldn't delete — it will be redelivered and
      // skipped by the workers' idempotency guards.
      logger.warn("SQS job succeeded but message could not be deleted", {
        jobType: body.jobType,
        targetId: target,
        reason: error.message,
      });
    }
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function startConsumer() {
  if (running) return;

  if (!config.aws.sqs.queueUrl) {
    logger.warn(
      "SQS_QUEUE_URL is not set — consumer not started. Story analysis/enrichment/embedding pipeline is DISABLED.",
    );
    return;
  }

  running = true;

  const loop = async () => {
    try {
      await pollOnce();
    } catch (error) {
      logger.error("SQS poll failed — retrying in 5s", {
        reason: error.message,
        stack: error.stack,
      });
      await delay(5000);
    }

    setImmediate(loop);
  };

  loop();
}
