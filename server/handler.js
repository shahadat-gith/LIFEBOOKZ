import serverless from 'serverless-http';
import app from './src/app.js';
import { connectDatabase } from './src/shared/config/database.js';

/**
 * AWS Lambda handler for API Gateway.
 * On cold start, connects to MongoDB.
 * Subsequent invocations reuse the cached connection.
 */
export const handler = serverless(app, {
  request: async (req, event) => {
    // Ensure DB is connected on each invocation
    try {
      await connectDatabase();
    } catch (error) {
      console.error('DB connection failed in Lambda:', error.message);
    }
    return req;
  },
});

// Also export a non-serverless version for direct invocation
export default handler;
