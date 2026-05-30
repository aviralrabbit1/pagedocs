# PageDocs

An online collaborative word editor (Google Docs–style) with first-class `.doc`/`.docx`
import/export and PDF output. Built open-source, free-tier-first.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Angular 21 (standalone, signals) + Tiptap/ProseMirror editor |
| Backend | NestJS 11 (modular monolith) |
| DB | PostgreSQL (Prisma) |
| Queue / cache | Redis + BullMQ |
| Conversion | Gotenberg (LibreOffice + Chromium) |
| Object storage | Cloudflare R2 / S3-compatible |
| Shared types | `libs/shared-types` (type-only, consumed via tsconfig paths) |

See the full architecture plan for phases, schema, and rationale.

## Monorepo layout

```
pagedocs/
├── apps/
│   ├── api/   NestJS backend
│   └── web/   Angular frontend
├── libs/
│   └── shared-types/   shared TypeScript types (compile-time only)
├── docker-compose.yml  postgres + redis + gotenberg
└── package.json        npm workspaces root
```

## How to run the project

The app has **3 parts** that all need to be running at the same time:

| Part | What it is | Address |
|---|---|---|
| **Database** | Postgres + Redis + Gotenberg (run inside Docker) | ports 5432 / 6379 / 3001 |
| **API** | The backend (NestJS) | http://localhost:3000 |
| **Web** | The website you open in the browser (Angular) | http://localhost:4200 |

> You also need **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** and **Node.js 20+** installed.

### First time only (one-time setup)

Run these once, in order, from the project folder (`pagedocs`):

```bash
# 1. Install all the code packages
npm install

# 2. Create your settings file (then open apps/api/.env and fill in secrets if needed)
#    Windows PowerShell:  Copy-Item .env.example apps\api\.env
cp .env.example apps/api/.env

# 3. Start Docker Desktop (open the app and wait until it says "running")

# 4. Start the database + helpers
npm run infra:up

# 5. Create the database tables
npm run prisma:migrate
#    If it asks for a name, type:  init
```

### Every time you want to run the app

1. **Open Docker Desktop** and wait until it says *running*.
2. In a terminal, from the `pagedocs` folder:

   ```bash
   npm run infra:up   # start the database (skip if already running)
   npm run dev        # start the API + website together
   ```

3. Open your browser at **http://localhost:4200**, then register or sign in.

To stop: press **Ctrl + C** in the terminal. To shut down the database too, run `npm run infra:down`.

### Handy commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the API **and** the website together |
| `npm run api:dev` | Start only the API |
| `npm run web:dev` | Start only the website |
| `npm run infra:up` | Start the database (Docker) |
| `npm run infra:down` | Stop the database |
| `npm run prisma:migrate` | Update the database after changing the schema |
| `npm --workspace api run prisma:studio` | Open a visual database browser |

### If something goes wrong

| You see... | It means... | Fix |
|---|---|---|
| `ERR_CONNECTION_REFUSED` or `status: 0` in the browser | The **API** is not running | Run `npm run dev` (it starts the API too) |
| `P1001: Can't reach database server` | The **database** is not running | Open Docker Desktop, then `npm run infra:up` |
| `failed to connect to the docker API` | **Docker Desktop** is not started | Open Docker Desktop and wait until it says "running" |
| `EPERM ... query_engine-windows.dll.node` | A running app is locking a file | Stop `npm run dev` first, then re-run the Prisma command |

> **Tip:** Google Sign-in stays off until you add real `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `apps/api/.env`. Email + password login works without it.

## Implementation phases

- **Phase 0** — Foundation: monorepo, auth (JWT + Google), Postgres/Prisma, document CRUD. *(in progress)*
- **Phase 1** — Core editor (Tiptap + Yjs doc model, rich text).
- **Phase 2** — Structured content (tables, images, headers/footers, page setup).
- **Phase 3** — Import/export (.docx in, docx/pdf/rtf/txt out).
- **Phase 4** — Comments, suggestions/track-changes, version history, sharing.
- **Phase 5** — External storage (GitHub, Google Drive).
- **Phase 6** — Real-time collaboration (Hocuspocus + y-prosemirror).
- **Phase 7** — Spell/grammar, a11y, performance, offline.
