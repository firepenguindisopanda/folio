# Folio

Chat with your PDF documents. Upload a PDF, ask questions about it, and get answers grounded in the document. Every user gets their own dedicated vector database (a separate Neon Postgres project with pgvector), so one tenant's data is never stored alongside another's.

## Features

- Upload PDFs (up to 3 per account, 10 MB each) and chat with them
- A separate Postgres vector database for every user, created on first sign in
- Several saved conversations per document, with automatic titles, rename and delete
- Optional thinking mode that streams the model's reasoning alongside the answer
- Answers grounded in the document: an overview generated on upload, similarity search, follow up aware retrieval, and chapter and section lookups for textbooks
- Feedback on answers (thumbs up or down), copy and regenerate
- Daily message limit (50 per user) and per minute rate limiting, with usage shown in the UI
- Light and dark themes, a collapsible sidebar and a mobile layout
- Full data deletion: removing a document deletes its file, embeddings, chats and messages, and deleting an account also deletes the user's vector database

## Tech stack

- Remix (Vite) with React and Tailwind CSS
- Neon Postgres for the main database and for one vector database per user
- Drizzle ORM and migrations
- NVIDIA NIM for chat (`nvidia/nemotron-3.5-lightning-30b-a3b`) and embeddings (`nvidia/llama-nemotron-embed-vl-1b-v2`, 1024 dimensions)
- Vercel AI SDK for streaming, LangChain for text splitting and the pgvector store
- UploadThing for file storage
- Upstash Redis for rate limiting
- Google sign in with Remix Auth

## How it works

The main database stores users, documents, chats and messages, plus a `vector_databases` table that maps each user to their Neon project. When a user signs in for the first time, a new Neon project is created for them through the Neon API and migrated with the embeddings schema.

When a PDF is uploaded, its text is extracted, split into chunks, embedded and written to that user's own database. An overview of the whole document is generated at the same time.

When the user asks a question, the app searches their database for relevant passages, adds the document overview (and a chapter outline when a chapter or section is mentioned), and streams the answer back.

### Data lifecycle

Data lives in three places: the main database, the user's Neon project and UploadThing. All foreign keys in the main database cascade (users, documents, chats, messages). Each deletion step is idempotent and the main database row is removed last, so a failed deletion can be retried safely.

| Action | Deletes |
| --- | --- |
| Delete a chat | The chat and its messages |
| Delete a document | The PDF file, its embeddings, its chats and messages |
| Delete account | All PDF files, the user's Neon project, and every row the user owns |

## Getting started

### Requirements

- Node.js 20 or newer
- A Neon account and API key
- An NVIDIA NIM API key
- An UploadThing app token
- An Upstash Redis database
- A Google OAuth client

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and fill in the values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   | --- | --- |
   | `DATABASE_URL` | Connection string for the main Neon database |
   | `NEON_API_KEY` | Neon API key, used to create a project per user |
   | `NEON_ORG_ID` | Neon organization ID, required when using a personal API key |
   | `SESSION_SECRET` | Random string used to sign session cookies |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth client |
   | `GOOGLE_CALLBACK_URL` | `http://localhost:3000/api/auth/google/callback` in development |
   | `UPLOADTHING_TOKEN` | UploadThing app token (V7) |
   | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis credentials |
   | `NVIDIA_API_KEY` | NVIDIA NIM API key |
   | `NVIDIA_CHAT_MODEL` | Optional chat model override |

3. Create the main database tables:

   ```bash
   npm run db:migrate
   ```

4. Start the development server on port 3000:

   ```bash
   npm run dev
   ```

Add `http://localhost:3000/api/auth/google/callback` as an authorized redirect URI on your Google OAuth client.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run typecheck` | Type check the project |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |
| `npm run db:generate` | Generate a migration for the main database |
| `npm run db:migrate` | Apply migrations to the main database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run vector-db:generate` | Generate a migration for the per user vector databases |
| `npm run vector-db:migrate` | Apply vector database migrations to every user's database |
| `npm run documents:backfill-overviews` | Generate overviews for documents that don't have one |

## Migrations for the per user databases

The embeddings schema is defined in `app/lib/vector-db/schema.ts`. After changing it, generate a migration with `npm run vector-db:generate` and apply it to every tenant with `npm run vector-db:migrate`. New users are migrated automatically when their database is created. Keep schema changes backward compatible, since tenants are migrated one at a time.

## Project structure

```
app/
  components/       UI components (chat, layout, documents, settings)
  lib/
    db/             Main database schema, migrations and client
    vector-db/      Per user database schema, migrations and queries
    ai.server.ts    NVIDIA chat model and embeddings
    lifecycle.server.ts   Tenant provisioning and deletion
    retrieval.server.ts   Context retrieval for answering questions
  routes/           Pages and API routes
migrate.ts          Migrates every user's vector database
scripts/            Maintenance scripts
```

## Deployment

A Dockerfile is included. It builds the app with `npm ci` and `npm run build` and serves it on port 3000 with `npm run start`. Provide the same environment variables as in `.env`, with `GOOGLE_CALLBACK_URL` pointing at your deployed domain.

## Credits

Based on Neon's vector database per tenant example app.
