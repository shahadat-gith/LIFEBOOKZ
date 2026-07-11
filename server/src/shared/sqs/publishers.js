import config from "../config/index.js";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { client } from "./config.js";

export const publishMessage = async (message, delaySeconds = 0) => {
  const command = new SendMessageCommand({
    QueueUrl: config.aws.sqs.queueUrl,
    MessageBody: JSON.stringify(message),
    DelaySeconds: delaySeconds,
  });

  const response = await client.send(command);

  return {
    messageId: response.MessageId,
    success: true,
  };
};

export const publishEmbeddingEvent = async (storyId) => {
  return publishMessage({
    jobType: 'embed-story',
    storyId: storyId.toString(),
  });
};
