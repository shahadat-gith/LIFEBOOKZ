import app from './app.js';
import config from './shared/config/index.js';
import { connectDatabase } from './shared/config/database.js';

async function start() {
  try {
    await connectDatabase();
    app.listen(config.port, () => {
      console.log(`\n  🚀 Lifebookz API: http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
