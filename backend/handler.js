import serverless from "serverless-http";

import app from "./src/app.js";
import { connectDatabase } from "./src/shared/config/database.js";


await connectDatabase();

export const handler = serverless(app);

export default handler;