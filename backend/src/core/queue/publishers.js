import config from "../config/index.js";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { client } from "./config.js";
import { logger } from "../services/logger.js";

export async function publishMessage(message, delaySeconds = 0) {
  const queueUrl = config.aws.sqs.queueUrl;

  if (!queueUrl) {
    const error = new Error(
      "SQS_QUEUE_URL is not set — cannot publish SQS message.",
    );

    logger.error("Failed to publish SQS message — queue not configured", {
      jobType: message?.jobType,
      reason: error.message,
    });

    throw error;
  }

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    DelaySeconds: Math.min(Math.max(delaySeconds, 0), 900),
  });

  try {
    const response = await client.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    logger.error("Failed to publish SQS message", {
      jobType: message?.jobType,
      targetId: message?.storyId || message?.userId || null,
      reason: error.message,
      stack: error.stack,
    });

    throw error;
  }
}
