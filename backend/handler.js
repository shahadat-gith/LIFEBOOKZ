import serverless from "serverless-http";
import app from "./src/app.js";
import { connectDatabase } from "./src/core/config/database.js";

const serverlessApp = serverless(app);

export async function handler(event, context) {
  await connectDatabase();

  return serverlessApp(event, context);
}

export default handler;