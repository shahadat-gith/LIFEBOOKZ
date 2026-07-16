import config from "../config/index.js";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { client } from "./config.js";

export async function publishMessage(message, delaySeconds = 0) {
  const command = new SendMessageCommand({
    QueueUrl: config.aws.sqs.queueUrl,
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
    console.error("Failed to publish SQS message:", error);
    throw error;
  }
}
