import { SESv2Client } from "@aws-sdk/client-sesv2";
import config from "./index.js";

let client;

export function getSesClient() {
  if (client) return client;

  client = new SESv2Client({
    region: config.aws.region,
  });

  return client;
}

export function getSesSender() {
  const { fromName, fromMail } = config.aws.ses;

  return `"${fromName}" <${fromMail}>`;
}

export function isSesConfigured() {
  return Boolean(
    config.aws.region &&
    config.aws.ses.fromMail
  );
}