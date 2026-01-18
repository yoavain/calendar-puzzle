# Repository Review: calendar-puzzle

## Overview
A daily puzzle game where players arrange 8 pieces on a calendar board to reveal the current date. Built with React frontend, Fastify backend, PostgreSQL database, using Google OAuth for authentication.

---

## 1. File Structure & Organization

**Strengths:**
- Clean monorepo structure with clear separation: `src/client/`, `src/server/`, `src/common/`
- Shared types and logic in `common/` directory promotes code reuse
- Well-organized component structure with co-located styled components (`.styled.ts`)
- Proper separation of concerns: routes, services, repositories, utilities

**Areas for Improvement:**
- Missing `.env.example` file - developers need to guess required environment variables
- `docs/` folder exists but no README.md in root with quick start instructions
- No `types/` folder for global type declarations (currently spread across files)

---

## 2. Security Analysis

### Positive Security Practices

| Area | Implementation |
|------|---------------|
| **Path Traversal Protection** | `validatePath()` in `app.ts:22-33` prevents directory traversal attacks |
| **Session Security** | `@fastify/secure-session` with httpOnly cookies, secure in production |
| **OAuth Implementation** | Proper Google OAuth2 flow with passport.js |
| **Role-Based Access** | `requireAdmin` and `requireAuth` middleware properly implemented |
| **Input Validation** | Date format validation in `parseDate()`, server-side solution validation |
| **Secrets in .gitignore** | `secret-key`, `private-key.pem`, `public-key.pem`, `.env` all ignored |
| **Hybrid Encryption** | RSA-OAEP + AES-256-GCM for sensitive POST payloads |
| **SQL Injection** | Drizzle ORM parameterizes queries - safe from injection |

### Security Concerns

**Critical:**
1. **Hardcoded Database Credentials** (`docker-compose.yml:24`)
   ```yaml
   POSTGRES_PASSWORD=puzzle
   ```
   Even for dev/local, default credentials should be stronger or use environment variables.

2. **Secrets Copied to Docker Image** (`Dockerfile:23`)
   ```dockerfile
   COPY secret-key private-key.pem public-key.pem /usr/app/
   ```
   Secrets baked into images can be extracted. Consider using Docker secrets or runtime mounts.

**Medium:**
3. **Missing Rate Limiting** - No rate limiting on API endpoints. Users could spam `/api/hint/:date` or authentication endpoints.

4. **No CORS Configuration** - Missing explicit CORS policy for production.

5. **Non-null Assertion on Env Vars** (`passport.ts:17-18`)
   ```typescript
   clientID: process.env.GOOGLE_CLIENT_ID!,
   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
   ```
   Server will crash silently if these are undefined - should validate at startup.

---

## 3. Code Quality & Best Practices

### Strengths

- **TypeScript Strict Mode**: Full type safety across client and server
- **Modern Frameworks**: React 19, Fastify 5, Drizzle ORM - all recent versions
- **ESM Modules**: Using ES modules throughout (`"type": "module"`)
- **Worker Threads**: CPU-intensive solver runs in worker thread to avoid blocking
- **Proper Error Handling**: Generic errors to client, detailed logging on server
- **Session State Management**: Custom hooks (`useGameHistory`, `useGameSession`) with localStorage persistence

### Areas for Improvement

1. **Limited Test Coverage** - Only 1 test file (`puzzleSolver.test.ts`) with 1 test case. Missing:
   - API endpoint tests
   - Authentication flow tests
   - Component tests
   - Integration tests

2. **No Input Validation Library** - Manual validation instead of using `zod`, `yup`, or Fastify schema validation. Example in `statsRest.ts`:
   ```typescript
   const { month, day } = request.body;  // No validation that month is 0-11, day is 1-31
   ```

3. **Magic Numbers** (`gameLogic.ts:250`)
   ```typescript
   const TOTAL_PLAYABLE_CELLS = 41;
   ```
   Should be derived from board configuration, not hardcoded.

4. **Console.error in Client** (`puzzleService.ts:86`)
   ```typescript
   console.error('Failed to record start:', response.statusText);
   ```
   Should use a proper logging service for production.

5. **TypeScript `any` Usage** (`puzzleService.ts:70,96`)
   ```typescript
   let body: any = { month: date.month, day: date.day };
   ```
   Should use proper types.

---

## 4. Docker & Deployment

### Dockerfile Review

**Good:**
- Uses specific Node version with digest hash for reproducibility
- Multi-stage not needed (simple build), but production-only deps installed
- Timezone configured
- Slim base image

**Issues:**

1. **No Health Check**
   ```dockerfile
   # Missing HEALTHCHECK instruction
   ```
   Container orchestration can't determine if app is healthy.

2. **Running as Root** - No `USER` directive; process runs as root inside container.

3. **Build Context Too Large** - No `.dockerignore` file - copies entire repo including `node_modules`, `.git`.

---

## 5. Dependencies Analysis

**Production Dependencies** (8 packages) - All legitimate and well-maintained.

**Potential Concerns:**
- `dlx: 0.2.1` - Low version number, check maintenance status
- Consider running `npm audit` regularly

**DevDependencies Placement:**
- React/MUI in devDependencies is unusual but works because Vite bundles them. More conventional to have in dependencies.

---

## 6. Performance Considerations

**Good:**
- Puzzle solutions cached in database after first solve
- Worker thread for CPU-intensive DLX algorithm
- Static assets served efficiently via `@fastify/static`
- Client-side localStorage for session persistence

**Potential Issues:**
- `fs.readFileSync` in request handler (`app.ts:100-102`) - synchronous I/O in hot path
- `solvePuzzle()` called for both `/api/solution` and `/api/hint` - could share computation
- No caching headers on static assets

---

## 7. Specific Code Issues

| File | Line | Issue |
|------|------|-------|
| `app.ts` | 100-102 | Sync file read on every root request - should cache `index.html` |
| `passport.ts` | 62 | No null check - `db.select()` could return empty array |
| `hintRest.ts` | 53 | `hashString()` uses simple hash - predictable hint selection |
| `encryption.ts` (server) | 9 | Private key path uses `process.cwd()` - fragile in different run contexts |

---

## 8. Missing Features/Files

- `.env.example` - Document required environment variables
- `.dockerignore` - Reduce build context size
- `CONTRIBUTING.md` - Contribution guidelines
- `LICENSE` - License file (ISC mentioned in package.json but file missing)
- Root `README.md` - Quick start documentation
- API documentation
- Pre-commit hooks (husky/lint-staged)
- ESLint/Prettier configuration

---

## Summary

| Category | Rating | Notes |
|----------|--------|-------|
| **Security** | Good | Solid fundamentals; address rate limiting and secrets in images |
| **Code Quality** | Good | Clean TypeScript, modern patterns, some `any` usage |
| **Testing** | Poor | Minimal test coverage |
| **Documentation** | Poor | Missing README, env example, API docs |
| **Architecture** | Very Good | Clean separation, proper patterns |
| **DevOps** | Fair | Basic Docker setup, missing health checks and optimizations |

**Recommendation:** The codebase is well-structured and uses modern best practices for a web application. Priority improvements should focus on: (1) adding test coverage, (2) implementing rate limiting, (3) moving secrets out of Docker image, and (4) adding documentation.

---

*Review generated by Claude Code on 2026-01-18*
