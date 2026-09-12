export const config = {
  apiBase: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1',
  appName: 'Lifebookz Developer Portal',
  logRefreshMs: 15000,
};

export const LOG_LEVELS = [
  { id: 'error', label: 'Error' },
  { id: 'warn', label: 'Warning' },
  { id: 'info', label: 'Info' },
  { id: 'debug', label: 'Debug' },
];
