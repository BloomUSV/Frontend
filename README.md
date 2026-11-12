# Research Resource Manager Frontend

React, TypeScript, Vite, and Material UI frontend for the Research Resource
Manager.

## Setup

1. Install Node.js and pnpm, then run `pnpm install`.
2. Start the API from the separate backend repository. The frontend expects it
   at `http://localhost:3001/api` by default.
3. If the API uses a different address, set `VITE_API_BASE_URL` to its
   `/api` URL. For local development, create `.env.local` with:

   ```text
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

4. Run `pnpm dev` and open the URL printed by Vite (port 8443 by default).
   Use `http://localhost` rather than `http://127.0.0.1` so the browser sends
   the API's HttpOnly session cookie.

## Checks

- `pnpm test` runs the frontend tests.
- `pnpm build` creates the production build.

The backend's `FRONTEND_ORIGIN` setting must match the exact origin used by
the browser.
