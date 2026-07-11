import app from './app.js';
import config from './shared/config/index.js';
import { connectDatabase } from './shared/config/database.js';
import { initializeQdrantCollections } from './shared/config/qdrant.js';
import log from './shared/utils/logger.js';

async function start() {
  try {
    await connectDatabase();
    await log('info', 'Database connected');

    initializeQdrantCollections().catch(err => log('warn', 'Qdrant init skipped', { error: err.message }));

    app.listen(config.port, () => {
      log('info', `Server running on port ${config.port}`);
      console.log(`\n  🚀 Lifebookz API: http://localhost:${config.port}${config.apiPrefix}`);
      console.log(`  📖 Health: http://localhost:${config.port}${config.apiPrefix}/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
