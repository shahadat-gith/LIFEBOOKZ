import api from '../config/api';

/**
 * Fetch application logs.
 * params: { level, search, from, to, page, limit }
 */
export async function getLogs(params = {}) {
  const res = await api.get('/developer/logs', { params });
  return res.data.data;
}

export async function getLogStats() {
  const res = await api.get('/developer/logs/stats');
  return res.data.data;
}

/**
 * Delete logs. Pass olderThanDays to only prune old entries,
 * or omit it to clear everything.
 */
export async function clearLogs(olderThanDays) {
  const res = await api.delete('/developer/logs', {
    params: olderThanDays ? { olderThanDays } : {},
  });
  return res.data;
}

export default api;
