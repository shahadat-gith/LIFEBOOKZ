import { SQSClient } from "@aws-sdk/client-sqs";
import config from "../config/index.js";

export const client = new SQSClient({ region: config.aws.region || "ap-south-1" });
