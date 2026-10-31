# nestjs-starter

A production-shaped [NestJS](https://nestjs.com) starter extracted and sanitized from several of the author's client backends. It ships the plumbing that every API ends up needing: JWT, Google, Facebook and API-key authentication, a role guard, email and mobile sign-up with OTP verification, password reset, an admin module with a seeded first account, a Handlebars-templated mailer, Twilio SMS, S3-compatible uploads, i18n messages, a typed API response envelope, Swagger docs and Jest unit tests. MongoDB via Mongoose is the data layer.

## Module map

| Path | What it does |
| --- | --- |
| `src/main.ts` | Bootstraps the app: global validation pipes, optional route prefix, Swagger UI, CORS |
| `src/app.module.ts` | Root module: `@nestjs/config` env loading, i18n, mailer, database and feature modules |
| `src/config/` | `env.ts` resolves which `.env` files to load; real env files live here git-ignored |
| `src/authenticate/` | Passport strategies and guards: JWT (bearer or `x-auth-token`), Google, Facebook, `x-api-key`; `RolesGuard`; JWT issuing with session tracking |
| `src/decorators/` | `@Roles(...)` metadata decorator consumed by `RolesGuard` |
| `src/user/` | Sign-up by email (OTP mail) or mobile (OTP SMS), social login, login, OTP verify/resend, forgot/reset password, profile, logout |
| `src/admin/` | Admin login/profile/logout; seeds the first admin from `ADMIN_SEED_*` on boot |
| `src/session-log/` | Per-device session records behind every issued token; used to invalidate sessions on logout |
| `src/email/` | `EmailService` over `@nestjs-modules/mailer` with Handlebars templates in `templates/` |
| `src/sms/` | `SmsService` over Twilio; degrades to a warning when credentials are absent |
| `src/cloud-storage/` | `CloudStorageService`: uploads/deletes files in an S3-compatible bucket (`@aws-sdk/client-s3`) |
| `src/database/` | Mongoose root connection from `DB_*` env vars |
| `src/i18n/` | Message catalog (`en/message.json`); language chosen by the `language` header |
| `src/interfaces/` | `ApiResponse` envelope and `AuthData` JWT payload types |
| `src/constants/` | Enums for device type, login type, verification status, user type; timeouts |
| `src/utils/` | Helpers: OTP generation, random strings, sensitive-field stripping, key camelization |
| `test/` | Jest e2e config |

Every endpoint returns the same envelope:

```ts
interface ApiResponse {
  statusCode: number;
  message: string; // translated via i18n
  data?: any;
  error?: any;
}
```

## Requirements

- Node.js 20+
- MongoDB 6+ (local or hosted)
- Optional: SMTP credentials, Twilio account, S3-compatible bucket, Google/Facebook OAuth apps

## Environment setup

```bash
cp .env.example .env
```

Fill in the values. Every variable the code reads is listed in `.env.example` with a one-line comment. The loader (`src/config/env.ts`) checks, in order, `src/config/<NODE_ENV>.env`, `.env.<NODE_ENV>` and `.env`; all of them are git-ignored, only `.env.example` is committed.

Minimum for a local boot: `DB_HOST`, `DB_NAME`, `JWT_SECRET`. Set `ADMIN_SEED_PASSWORD` to get an admin account created on first start (it is mandatory in production; elsewhere seeding is skipped with a warning). When `NODE_ENV=development` every OTP is `123456` so sign-up flows can be exercised without SMTP or Twilio.

## Run

```bash
npm install
npm run start:dev      # watch mode, NODE_ENV=development
npm run build          # compiles to dist/
npm run start:prod     # runs dist/main with NODE_ENV=production
```

With `SET_SWAGGER=true` the API explorer is served at `http://localhost:3000/<BASE_PATH>/swagger`.

## Docker

```bash
docker build -t nestjs-starter .
docker run --rm -p 3000:3000 --env-file .env nestjs-starter
```

The image is a two-stage `node:20-alpine` build: dependencies and `nest build` in the first stage, production `node_modules` plus `dist/` in the second, running as the unprivileged `node` user.

## Tests

```bash
npm test               # unit specs (Nest testing module with mocked providers, no database needed)
npm run test:cov       # with coverage
npm run test:e2e       # e2e config in test/jest-e2e.json (needs a reachable MongoDB)
npm run lint           # eslint + prettier
```

CI (`.github/workflows/ci.yml`) runs lint, build and unit tests on Node 20 for every push and pull request.

## Using the auth pieces

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(userType.admin)
@Get('reports')
reports() { ... }

@UseGuards(ApiKeyAuthGuard)   // expects x-api-key, matched against API_KEYS
@Post('webhooks/inbound')
inbound() { ... }
```

## Author

[harishgupta42](https://github.com/harishgupta42)

## License

MIT
