# Google OAuth Authentication

This document describes the Google OAuth implementation for the Calendar Puzzle application.

## Overview

Authentication is used to gate access to hint and solution features. Authenticated users can see and use the Hint and Solution buttons; anonymous users cannot.

**Current scope:**
- [x] Google OAuth sign-in
- [x] Session-based authentication (secure cookies)
- [x] Protected hint/solution API endpoints
- [x] Database persistence (users + puzzle stats in PostgreSQL)
- [ ] Game state sync across devices (future)

---

## Setup

### 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add all **Authorized redirect URIs** for your environments:
   - `http://localhost:3001/auth/google/callback`
   - `https://dev.yourdomain.com/auth/google/callback`
   - `https://yourdomain.com/auth/google/callback`
7. Save the **Client ID** and **Client Secret**

### 2. Environment Variables

Create a `.env` file with:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

**Note:** `GOOGLE_CALLBACK_URL` is not needed - the callback URL is derived automatically from the request host using a relative path (`/auth/google/callback`).

### 3. Generate Session Secret Key

The `@fastify/secure-session` plugin requires a 32-byte cryptographic key file:

```bash
# Linux/macOS
npx @fastify/secure-session > secret-key

# Windows (PowerShell) - use Node.js to avoid encoding issues
node -e "require('fs').writeFileSync('secret-key', require('crypto').randomBytes(32))"
```

This file is in `.gitignore`. Each environment needs its own `secret-key` file.

---

## Architecture

```
Browser                     Fastify Server                 Google
   |                              |                           |
   |-- GET /auth/google --------->|                           |
   |                              |-- Redirect to Google ---->|
   |<-------- Google consent screen --------------------------|
   |                              |                           |
   |-- GET /auth/google/callback?code=xyz ------------------->|
   |                              |<-- Exchange code -------->|
   |                              |<-- User profile ----------|
   |<-- Set session cookie -------|                           |
   |                              |                           |
   |-- PUT /api/hint ------------>|                           |
   |   (with session cookie)      |                           |
   |<-- 200 OK (hint data) -------|                           |
```

---

## Implementation

### Server Files

| File | Purpose |
|------|---------|
| `src/server/auth/passport.ts` | Google OAuth strategy configuration |
| `src/server/auth/requireAuth.ts` | Authentication middleware |
| `src/server/rest/authRest.ts` | OAuth routes (`/auth/*`) |
| `src/server/app.ts` | Registers session, passport, and routes |

### Client Files

| File | Purpose |
|------|---------|
| `src/client/context/UserContext.tsx` | Auth state management (`useUser` hook) |
| `src/client/components/LoginButton.tsx` | "Sign in with Google" button |
| `src/client/components/UserMenu.tsx` | User avatar with logout menu |
| `src/client/components/HintButton.tsx` | Shows only when authenticated |
| `src/client/components/SolutionButton.tsx` | Shows only when authenticated |

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/google` | No | Initiates OAuth flow |
| GET | `/auth/google/callback` | No | Handles OAuth callback |
| GET | `/api/auth/me` | No | Returns current user or 401 |
| POST | `/auth/logout` | No | Clears session |
| PUT | `/api/hint` | Yes | Returns a hint (protected) |
| GET | `/api/admin/solution/:date` | Yes (Admin) | Returns full solution (protected) |
| GET | `/api/hall-of-fame` | Yes | Returns user activity statistics |

---

## Configuration Details

### Trust Proxy

The server and OAuth strategy are configured to correctly handle reverse proxies (Cloudflare, nginx, etc.):

1. **Fastify**: `trustProxy: true` - trusts `X-Forwarded-*` headers for IP detection
2. **GoogleStrategy**: `proxy: true` - uses `X-Forwarded-Proto` header for protocol detection when building the callback URL

This ensures:

- Correct protocol detection (http vs https)
- Correct host detection for callback URL resolution
- Secure cookies work correctly behind proxies

### Session Cookies

```typescript
cookie: {
    path: '/',
    httpOnly: true,  // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production'  // HTTPS only in prod
}
```

---

## Docker Deployment

Credentials are passed via environment variables, and the session key is mounted as a file:

```yaml
environment:
  - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
  - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
volumes:
  - ./secret-key:/usr/app/secret-key:ro
```

**Setup steps:**

1. Generate the `secret-key` file in the project root:
   ```bash
   # Linux/macOS
   npx @fastify/secure-session > secret-key
   
   # Windows (PowerShell)
   node -e "require('fs').writeFileSync('secret-key', require('crypto').randomBytes(32))"
   ```

2. Create a `.env` file with your Google credentials:
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

3. Run docker-compose:
   ```bash
   docker-compose up -d
   ```

**Note:** Each environment (dev, production) should have its own `secret-key` file. Changing the key will invalidate all existing sessions (users will be logged out).

---

## Testing Checklist

- [ ] OAuth flow redirects to Google
- [ ] Callback sets session and redirects to `/`
- [ ] `GET /api/auth/me` returns user info when logged in
- [ ] `GET /api/auth/me` returns 401 when not logged in
- [ ] Hint/Solution buttons appear only when authenticated
- [ ] `PUT /api/hint` returns 401 for anonymous users
- [ ] `GET /api/admin/solution/:date` returns 401 for anonymous users
- [ ] Logout clears session and hides buttons
- [ ] Session persists across page refresh

---

## Future Enhancements

### Database Integration

Database persistence is **implemented**: `users` and `userPuzzleStats` tables exist, migrations run via Drizzle ORM, and all stats routes read/write PostgreSQL. Cross-device real-time game-state sync remains a future item.

### Security Improvements

- [x] Rate limit `/auth/*` endpoints
- [x] CSRF protection (`/api/auth/csrf-token`)
- [ ] Session expiration/rotation
