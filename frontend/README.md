# LifeBookz Frontends

Five independent Vite + React single-page apps, each deployed on its own
(Cloudflare Workers via `deploy.ps1`), plus the shared backend in `../backend`.

| App         | Dev port | Purpose                          |
| ----------- | -------- | -------------------------------- |
| `client`    | 5173     | Reader-facing app                |
| `author`    | 5174     | Author writing/reading portal    |
| `admin`     | 5175     | Admin moderation console         |
| `expert`    | 5176     | Expert/consultant portal         |
| `developer` | 5177     | Internal logs & diagnostics      |

The apps stay independent (separate builds, env files and deploys). They share
**conventions**, not code.

## Folder structure

Every app follows the same layout under `src/`:

```
src/
  main.jsx              # mounts App inside providers (BrowserRouter, AuthProvider)
  App.jsx               # route table only: ScrollToTop + Suspense + Routes + Toaster
  index.css             # Tailwind v4 theme tokens
  api/                  # thin endpoint wrappers over the shared axios client
  assets/
  components/
    ui/                 # design-system primitives (Button, Input, Card, Badge, …)
    layout/             # app shell (AppLayout, Navbar, Sidebar, Footer, …)
    common/             # cross-cutting pieces (ProtectedRoute, LoadingScreen,
                        #   EmptyState, ErrorState, FormError, RichText, ScrollToTop)
  config/
    index.js            # app/env configuration
    api.js              # the single axios instance (interceptors live here)
  context/              # React context providers
  hooks/                # app-level hooks
  icons/                # icon registry
  pages/
    <Page>/
      index.jsx         # the route component
      components/       # components used only by this page
      hooks/            # hooks used only by this page
      utils.js          # helpers used only by this page
  utils/                # pure, app-wide helpers
```

### Rules of thumb

- **Page-specific code is co-located** under `pages/<Page>/`; only genuinely
  reusable code lives in `components/`, `hooks/` or `utils/`.
- **`ui/` vs `common/`** — `ui/` holds unstyled-by-page primitives; `common/`
  holds app-wide compositions (empty/error/loading states, guards, rich text).
- **One axios instance** per app at `config/api.js`. Endpoint wrappers belong in
  `api/`, never in `utils/`.
- **Imports are extensionless and relative** (`../../components/ui/Button`). No
  path aliases, so files can be moved with a simple relative-path rewrite.
- **`main.jsx` owns providers, `App.jsx` owns routes.** Keeping the two separate
  makes both easy to read and test.

### Backend parity

The backend mirrors the same spirit in `../backend/src` with a layered Express
layout: `routes/`, `controllers/`, `services/`, `models/`, `middleware/`,
`config/`, `utils/`, `emails/` and `app.js`/`server.js`. One file per REST
resource in each layer (`/testimonials` → `testimonial.routes.js`,
`testimonial.controller.js`, `testimonial.service.js`, `Testimonial.js`).
Backend imports always keep the `.js` extension (Node ESM).
