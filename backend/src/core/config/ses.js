import { SESv2Client } from "@aws-sdk/client-sesv2";
import config from "./index.js";

let client;

export function getSesClient() {
  if (client) return client;

  const { region, key } = config.aws;

  client = new SESv2Client({
    region,
    credentials: {
      accessKeyId: key.access,
      secretAccessKey: key.secret,
    },
  });

  return client;
}

export function getSesSender() {
  const { fromName, fromMail } = config.aws.ses;
  return `"${fromName}" <${fromMail}>`;
}

export function isSesConfigured() {
  const { key } = config.aws;
  return Boolean(key.access && key.secret);
}
