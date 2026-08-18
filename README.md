# KrishAI Hub

KrishAI Hub is an agriculture-focused React client with an accompanying tRPC/Express/MySQL backend source package. The repository includes the supplied frontend, backend modules, Drizzle migrations, and `master.sql` database dump.

## Frontend

The frontend is built with Vite and can be run locally with:

```bash
npm install
npm run dev:frontend
```

The production build is generated with `npm run build` into `dist/`. The GitHub Pages workflow deploys this static build on every push to `main`.

## Backend

The backend source is preserved under `server/` and expects Node.js 22+, a MySQL/TiDB-compatible database, and the environment variables described in `README.source.md`. The supplied backend archive does not include the referenced `server/_core` runtime modules (`trpc`, `cookies`, `sdk`, and `systemRouter`) or a server entry point, so the backend is not yet executable from this delivery package. The frontend build is verified independently for GitHub Pages deployment.

Import `master.sql` into the target MySQL/TiDB database before enabling the backend. Do not commit real credentials or `.env` files.

## GitHub Pages and custom domain

Pages is configured through `.github/workflows/deploy-pages.yml`. After the repository is created, enable **Settings → Pages → GitHub Actions** as the source. A custom domain can then be added in Pages settings or committed as a root-level `CNAME` file once the exact domain name is supplied. DNS must point the domain to GitHub Pages according to GitHub's current Pages documentation.

## Demo information

The source README identifies the demo credentials as `demo / 123456`; use them only with a properly configured backend and database. The published static frontend cannot perform authenticated tRPC operations without a separately hosted backend and a configured API origin.
