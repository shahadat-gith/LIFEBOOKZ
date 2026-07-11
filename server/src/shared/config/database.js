import mongoose from 'mongoose';
import config from './index.js';
import log from '../utils/logger.js';

const baseUri = config.mongodb.uri.replace(/\/$/, '');

export const usersConn = mongoose.createConnection(`${baseUri}/${config.mongodb.databases.users}`);
export const authorsConn = mongoose.createConnection(`${baseUri}/${config.mongodb.databases.authors}`);
export const storiesConn = mongoose.createConnection(`${baseUri}/${config.mongodb.databases.stories}`);

function setupConnection(conn, name) {
  conn.on('error', (err) => {
    log('error', `MongoDB [${name}] runtime error`, { error: err.message });
  });
  conn.on('disconnected', () => {
    log('warn', `MongoDB [${name}] disconnected`);
  });
  conn.on('connected', () => {
    log('info', `MongoDB [${name}] connected`);
  });
}

setupConnection(usersConn, 'users');
setupConnection(authorsConn, 'authors');
setupConnection(storiesConn, 'stories');

export async function connectDatabase() {
  try {
    await Promise.all([
      usersConn.asPromise(),
      authorsConn.asPromise(),
      storiesConn.asPromise(),
    ]);
    log('info', 'All MongoDB databases connected');
  } catch (error) {
    log('error', 'MongoDB connection error', { error: error.message });
    throw error;
  }
}
