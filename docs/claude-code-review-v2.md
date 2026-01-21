# Repository Review: calendar-puzzle (v2)

## Overview
A daily puzzle game where players arrange 8 tetris-like pieces on a calendar board to reveal the current date. Built with React 19 frontend, Fastify 5 backend, PostgreSQL database, using Google OAuth for authentication.

**Version:** 0.9.0 (beta)
**Review Date:** 2026-01-19

---

## Assessment of Previous Review (claude-code-review.md)

The previous review contained several inaccuracies that have been corrected in this review:

| Issue from Previous Review | Actual Status |
|---------------------------|---------------|
| "Missing `.env.example` file" | **INCORRECT** - File exists with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `POSTGRES_PASSWORD` |
| "Missing Rate Limiting" | **INCORRECT** - `@fastify/rate-limit` is registered globally (100/min) and per-route (5-20/min) |
| "No Input Validation Library" | **INCORRECT** - Fastify JSON schemas exist in `schemas.ts` with proper validation (month 0-11, day 1-31, etc.) |
| "Running as Root in Docker" | **INCORRECT** - `USER node` directive is present at line 18 of Dockerfile |
| "Hardcoded POSTGRES_PASSWORD=puzzle" | **PARTIALLY FIXED** - Now uses `${POSTGRES_PASSWORD}` environment variable in docker-compose.yml |
| "fs.readFileSync in request handler" | **INCORRECT** - Code uses async `fs.readFile` with caching via `getCachedFile()` |
| "Missing ESLint/Prettier configuration" | **INCORRECT** - Comprehensive ESLint config exists in `eslint.config.mjs` |
| "Non-null assertion on env vars" | **FIXED** - `validateConfig()` in `config.ts:28-41` validates required env vars at startup |

**Issues that remain valid from the previous review:**
- Limited test coverage (1 test file)
- Missing LICENSE file, README.md, and .dockerignore
- Secrets copied to Docker image (private-key.pem, public-key.pem)
- No HEALTHCHECK in Dockerfile

---

## 1. File Structure & Organization

**Strengths:**
- Clean monorepo structure with clear separation: `src/client/`, `src/server/`, `src/common/`
- Shared types and logic in `common/` directory promotes code reuse
- Well-organized component structure with co-located styled components (`.styled.ts`)
- Proper separation of concerns: routes, services, repositories, utilities, auth middleware
- Comprehensive documentation in `docs/` folder (DESIGN.md, TODO.md, AUTH.md, SESSION.md)

**Areas for Improvement:**
- No root README.md with quick start instructions
- Missing `.dockerignore` file
- Missing LICENSE file (ISC mentioned in package.json but file not present)

---

## 2. Security Analysis

### Implemented Security Features

| Area | Implementation | Location |
|------|---------------|----------|
| **Path Traversal Protection** | `validatePath()` + `getCachedFile()` safety check | `resourceUtils.ts:62-73`, `resourceUtils.ts:35-38` |
| **Session Security** | `@fastify/secure-session` with httpOnly, secure (prod), sameSite: lax | `app.ts:76-84` |
| **CSRF Protection** | `@fastify/csrf-protection` with token validation on all mutations | `app.ts:93-95`, `app.ts:155-202` |
| **Rate Limiting** | Global (100/min) + per-endpoint limits (5-20/min) | `app.ts:87-90`, individual routes |
| **OAuth Implementation** | Google OAuth 2.0 with Passport.js, proxy-aware | `passport.ts:17-57` |
| **Role-Based Access** | `requireAuth` and `requireAdmin` middleware | `requireAuth.ts:4-20` |
| **Input Validation** | Fastify JSON schemas with proper constraints | `schemas.ts:1-69` |
| **Hybrid Encryption** | RSA-OAEP + AES-256-GCM for sensitive POST payloads | `encryption.ts` (client & server) |
| **SQL Injection** | Drizzle ORM with parameterized queries | Throughout |
| **Config Validation** | Startup validation of required env vars | `config.ts:28-41` |
| **Trust Proxy** | Properly configured for reverse proxy support | `app.ts:30` |

### Security Concerns

**Medium Priority:**

1. **Secrets in Docker Image** (`Dockerfile:24`)
   ```dockerfile
   COPY --chown=node:node secret-key private-key.pem public-key.pem /usr/app/
   ```
   While `secret-key` is properly mounted as read-only volume in docker-compose.yml, `private-key.pem` and `public-key.pem` are baked into the image. Consider using Docker secrets or runtime mounts for all sensitive files.

2. **Potential User Enumeration** (`passport.ts:64-66`)
   ```typescript
   const [user] = await db.select().from(users).where(eq(users.id, id));
   return user as SessionUser;
   ```
   If user doesn't exist (deleted account), this returns `undefined` which may cause issues downstream. Consider adding null check.

3. **Hash Function Predictability** (`hintRest.ts:11-19`)
   ```typescript
   const hashString = (str: string): number => { ... }
   ```
   Simple hash makes hint selection deterministic and predictable. Users can predict which piece will be hinted. This is a minor gameplay concern, not a security issue.

**Low Priority:**

4. **No CSP Headers** - Consider adding Content-Security-Policy headers for additional XSS protection.

5. **No CORS Configuration** - Explicit CORS policy may be needed if API is accessed from other origins.

---

## 3. Code Quality & Best Practices

### Strengths

- **TypeScript Strict Mode**: Full type safety with `"strict": true`
- **Modern Stack**: React 19, Fastify 5.7.1, Drizzle ORM, Vite 7.3.1
- **ESM Modules**: Consistent use of ES modules (`"type": "module"`)
- **Worker Threads**: CPU-intensive DLX solver runs in worker thread (`solverService.ts`)
- **Proper Error Handling**: Generic errors to client, detailed logging on server
- **Async File Operations**: Uses `fs.promises` throughout server code
- **File Caching**: Static files cached after first read (`resourceUtils.ts`)
- **Comprehensive ESLint**: Well-configured with TypeScript, React, Jest, security plugins
- **Type-Safe Database**: Drizzle ORM with inferred types from schema

### Areas for Improvement

1. **Limited Test Coverage**
   - Only 1 test file (`puzzleSolver.test.ts`) with 1 test case
   - Missing: API tests, auth flow tests, component tests, integration tests

2. **Magic Number with Comment** (`gameLogic.ts:271`)
   ```typescript
   /** Total playable cells that need to be covered (41 = 12 months + 31 days - 2 highlighted) */
   const TOTAL_PLAYABLE_CELLS = 41;
   ```
   While documented, this could be derived programmatically from board configuration.

3. **Type Cast in Deserializer** (`passport.ts:65`)
   ```typescript
   return user as SessionUser;
   ```
   Should handle case where user is not found (deleted account).

4. **Unused CORS** - `@fastify/cors` is not installed or configured, which may be intentional if same-origin only.

---

## 4. Docker & Deployment

### Dockerfile Analysis

**Strengths:**
- Specific Node version with SHA digest for reproducibility
- Non-root user (`USER node`)
- Production-only dependencies (`npm ci --omit=dev`)
- Timezone configured
- Slim base image
- Proper directory permissions

**Issues:**

1. **No Health Check**
   ```dockerfile
   # Missing HEALTHCHECK instruction
   ```
   Container orchestration cannot determine application health.

2. **No .dockerignore**
   Build context may include unnecessary files (node_modules, .git, etc.)

3. **Secrets in Image**
   Private keys should be mounted at runtime, not baked into image.

### docker-compose.yml

**Strengths:**
- Environment variables for secrets
- Volume mount for secret-key (read-only)
- Proper service dependencies
- Named volume for PostgreSQL data
- Restart policy configured

---

## 5. Dependencies Analysis

### Production Dependencies (10 packages)

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| @fastify/csrf-protection | 7.1.0 | CSRF tokens | Current |
| @fastify/passport | 3.0.2 | Auth integration | Current |
| @fastify/rate-limit | 10.3.0 | Rate limiting | Current |
| @fastify/secure-session | 8.3.0 | Session management | Current |
| @fastify/static | 9.0.0 | Static file serving | Current |
| dlx | 0.2.1 | Dancing Links algorithm | Low version, check maintenance |
| drizzle-orm | 0.45.1 | Database ORM | Current |
| fastify | 5.7.1 | Web framework | Current |
| passport-google-oauth20 | 2.0.0 | Google OAuth | Current |
| pg | 8.17.1 | PostgreSQL client | Current |

### Dev Dependencies Placement

React, MUI, and Emotion are in devDependencies, which is unconventional but works because Vite bundles them for production. This is intentional for the monorepo setup.

### Recommendations
- Run `npm audit` regularly
- Consider adding `npm-check-updates` to track outdated packages
- Monitor `dlx` package for maintenance/updates

---

## 6. Performance Considerations

### Implemented Optimizations

| Optimization | Location |
|-------------|----------|
| Solution caching in database | `solutionRepository.ts` |
| Worker thread for CPU-intensive solving | `puzzleSolverWorker.ts` |
| Static file caching in memory | `resourceUtils.ts:9, 26-56` |
| Client-side localStorage persistence | `useGameSession.ts` |
| CSRF token caching | `puzzleService.ts:5-7` |
| Public key caching | `puzzleService.ts:5` |

### Potential Improvements

1. **Add Cache Headers** - Static assets could benefit from cache-control headers.

2. **Shared Computation** - `/api/solution` and `/api/hint` both call `solvePuzzle()`. If hints are requested frequently, consider caching the solution after first hint request.

3. **Build Output Size** - Consider analyzing bundle size with Vite's built-in analyzer.

---

## 7. Specific Code Review

### Server Code

| File | Line | Observation |
|------|------|-------------|
| `passport.ts` | 64-66 | Deserializer doesn't handle missing users |
| `hintRest.ts` | 11-19 | Hash function is predictable (design choice) |
| `config.ts` | 15-16 | Google credentials could be undefined before validation |
| `app.ts` | 48-49 | Type casting with `any` - acceptable for polyfill |

### Client Code

| File | Line | Observation |
|------|------|-------------|
| `puzzleService.ts` | 26-28 | Silent failure on public key fetch (acceptable for optional encryption) |
| `encryption.ts` | 15 | Uses `window.atob` - won't work in SSR (not applicable here) |

### Common Code

| File | Line | Observation |
|------|------|-------------|
| `gameLogic.ts` | 271 | Magic number with good documentation |
| `gameLogic.ts` | 159 | `parseInt(content)` without radix - should be `parseInt(content, 10)` |

---

## 8. Configuration Files

### ESLint (`eslint.config.mjs`)
- Comprehensive configuration with TypeScript, React, Jest support
- Security plugin included
- Proper ignore patterns
- Style rules enforced (4-space indent, double quotes, semicolons)

### TypeScript (`tsconfig.json`)
- Strict mode enabled
- Proper module resolution for bundler
- Path aliases configured
- Appropriate includes/excludes

### Vite (`vite.config.ts`)
- Proper dev server proxy configuration
- Source maps enabled for debugging
- Path aliases matching tsconfig

---

## 9. Missing Files/Features

| Item | Priority | Notes |
|------|----------|-------|
| Root README.md | High | Quick start, features, installation |
| LICENSE file | High | ISC license mentioned but file missing |
| .dockerignore | Medium | Reduce build context |
| HEALTHCHECK | Medium | Container health monitoring |
| CONTRIBUTING.md | Low | Contribution guidelines |
| API documentation | Low | OpenAPI/Swagger spec |
| More test coverage | High | API, auth, component tests |

---

## 10. Summary

| Category | Rating | Notes |
|----------|--------|-------|
| **Security** | Very Good | Comprehensive security measures implemented |
| **Code Quality** | Very Good | Clean TypeScript, modern patterns, minor issues |
| **Testing** | Poor | Only 1 test file with 1 test case |
| **Documentation** | Fair | Good design docs, missing README and LICENSE |
| **Architecture** | Excellent | Clean separation, proper patterns, worker threads |
| **DevOps** | Good | Docker setup works, missing health checks |
| **Performance** | Good | Caching implemented, worker threads for CPU work |

### Priority Recommendations

1. **High**: Add test coverage (API, auth, components)
2. **High**: Add root README.md and LICENSE file
3. **Medium**: Add .dockerignore file
4. **Medium**: Add HEALTHCHECK to Dockerfile
5. **Medium**: Move private-key.pem to runtime mount instead of image
6. **Low**: Add CSP headers
7. **Low**: Handle missing user in passport deserializer

---

*Review generated by Claude Code on 2026-01-19*
