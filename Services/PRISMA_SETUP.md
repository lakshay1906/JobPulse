# Prisma Setup Guide for JobPulse NestJS Services

This guide explains how Prisma is wired in existing services under `Services/`, and how to add the same setup when you create a new NestJS microservice.

## Overview

Each NestJS service owns its own:

| Piece | Purpose |
| --- | --- |
| `prisma/schema.prisma` | Data models and PostgreSQL datasource |
| `src/prisma/prisma.service.ts` | NestJS injectable wrapper around `PrismaClient` |
| `src/prisma/prisma.module.ts` | Global module that exports `PrismaService` |
| `.env` / `.env.example` | `DATABASE_URL` (and `PORT`) for that service |

PostgreSQL runs via root `docker-compose.yml`. Per-service databases are created by `init-scripts/01-init-databases.sql`:

| Service | Database | Default port |
| --- | --- | --- |
| Application Service | `job_pulse_app` | `3002` |
| Auth Service | `job_pulse_auth` | `3003` |
| Interview Service | `job_pulse_interview` | `3004` |

Connection string pattern:

```text
postgresql://postgres:postgres@localhost:5432/<database_name>?schema=public
```

## Prerequisites

1. Node.js and pnpm (repo uses `pnpm@11.21.0`)
2. Docker Desktop running
3. From the repo root:

```powershell
docker compose up -d postgres
pnpm install
```

Ensure Prisma build scripts are allowed in the workspace allowlist (`pnpm-workspace.yaml`):

```yaml
allowBuilds:
  '@prisma/client': true
  '@prisma/engines': true
  prisma: true
```

## Setup Prisma in a new NestJS service

Replace `<Service Name>` with your folder name under `Services/` (for example `Notification Service`).

### 1. Create the service database

Add a line to `init-scripts/01-init-databases.sql`:

```sql
CREATE DATABASE job_pulse_<short_name>;
```

If Postgres was already initialized, either recreate the volume or create the DB manually:

```powershell
docker exec -it job-pulse-postgres psql -U postgres -c "CREATE DATABASE job_pulse_<short_name>;"
```

### 2. Install dependencies

From the new service directory (or from the monorepo root with a filter):

```powershell
cd "Services/<Service Name>"
pnpm add @prisma/client
pnpm add -D prisma
```

### 3. Add `package.json` scripts

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:push": "prisma db push",
    "postinstall": "prisma generate"
  }
}
```

### 4. Create the Prisma schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add models for this service only, for example:
// model Example {
//   id        String   @id @default(cuid())
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }
```

### 5. Add NestJS Prisma module files

`src/prisma/prisma.service.ts`:

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

`src/prisma/prisma.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 6. Register the module in `AppModule`

```ts
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
      isGlobal: true,
    }),
    PrismaModule,
  ],
  // ...
})
export class AppModule {}
```

### 7. Environment files

Create `.env.example` (committed) and `.env` (local only, already gitignored):

```env
PORT=30XX
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/job_pulse_<short_name>?schema=public"
```

Copy for local development:

```powershell
Copy-Item .env.example .env
```

### 8. Generate client and apply schema

```powershell
pnpm prisma:generate
pnpm prisma:migrate
# or, for quick local prototyping without migration history:
pnpm prisma:push
```

### 9. Use `PrismaService` in feature modules

Because `PrismaModule` is `@Global()`, inject it anywhere:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExampleService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.example.findMany();
  }
}
```

## Day-to-day commands

Run these from the service directory:

| Command | When to use |
| --- | --- |
| `pnpm prisma:generate` | After changing `schema.prisma` (also runs on `postinstall`) |
| `pnpm prisma:migrate` | Create/apply versioned migrations in development |
| `pnpm prisma:push` | Push schema changes without creating a migration (prototyping) |
| `pnpm prisma:studio` | Open Prisma Studio for that service's database |
| `pnpm run build` | Confirm the Nest app still compiles after Prisma changes |

## Checklist for a new service

- [ ] Database created (`init-scripts` + Docker / manual `CREATE DATABASE`)
- [ ] `@prisma/client` and `prisma` installed
- [ ] `prisma/schema.prisma` present with correct `DATABASE_URL` env
- [ ] `PrismaService` + `PrismaModule` added under `src/prisma/`
- [ ] `PrismaModule` imported in `AppModule`
- [ ] `.env.example` and local `.env` set
- [ ] `pnpm prisma:generate` succeeds
- [ ] `pnpm prisma:migrate` or `pnpm prisma:push` succeeds
- [ ] `pnpm run build` succeeds
- [ ] Service starts without connection errors

## Notes

- Keep one Prisma schema **per service**. Do not share a single schema across microservices.
- Prefer migrations (`prisma migrate`) for anything beyond throwaway local experiments.
- Never commit `.env` files; only commit `.env.example`.
- After cloning the repo, run `pnpm install` at the root so `postinstall` regenerates Prisma Client for each service.
