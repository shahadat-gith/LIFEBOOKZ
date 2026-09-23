# Running LIFEBOOKZ locally

Three Vite portals plus an Express API. Each portal has its own `node_modules`.

## Reproduce the uncommitted artifacts

A fresh checkout needs the env files and installed dependencies:

1. **Backend env** — copy `backend/.env` from the main checkout (it is gitignored
   and holds the Mongo URL, JWT secret, R2 keys, AWS/SES credentials and the
   `FRONTEND_*_URL` values used to build email links). Never commit it.
2. **Portal envs** — copy `frontend/<portal>/.env` for each of `client`,
   `author`, `expert` when present; they point the portal at the API base URL.
3. **Install** — `npm install` inside `backend`, `frontend/client`,
   `frontend/author`, `frontend/expert`.

## Run the servers

API (default port 5000):

```bash
cd backend && npm run dev
```

Portals (Vite dev servers; ports are pinned in each `vite.config.js`):

| Portal | Command | Port |
| --- | --- | --- |
| client (readers) | `cd frontend/client && npm run dev` | 5173 |
| author | `cd frontend/author && npm run dev` | 5174 |
| expert | `cd frontend/expert && npm run dev` | 5176 |

All three portals need the API on 5000 for data; the client feed is readable
without signing in.

### Detached start (Windows)

```bash
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```

Use the exact executable name (`npm.cmd`, `node.exe`); stdout and stderr must be
different files.
