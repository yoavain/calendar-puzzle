# Backend (`src/server/`)

## Fastify Route Generics

Import request/reply types from `src/common/restTypes.ts`.

**What generics do NOT affect:** hook slot types (`preValidation`, `preHandler`, etc.).
Those are always `(...args) => void | Promise<unknown>` regardless of route generics.
This is why `fastifyPassport.authenticate()` (returns `RouteHandlerMethod`) must be cast
`as unknown as preValidationHookHandler` — Fastify v5.8.0 tightened hook slot types,
and `@fastify/passport` hasn't updated its return type yet.
