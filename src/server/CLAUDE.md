# Backend (`src/server/`)

## Fastify Route Generics

Import request/reply types from `src/common/restTypes.ts`.

**What generics do NOT affect:** hook slot types (`preValidation`, `preHandler`, etc.).
Those are always `(...args) => void | Promise<unknown>` regardless of route generics.

`fastifyPassport.authenticate()` needs no cast. `@fastify/passport` v4.0.1 returns an
async pre-validation hook. Earlier versions returned `RouteHandlerMethod`. That type was
not compatible with the hook slot types of Fastify v5.8.0. The code then needed an
`as unknown as preValidationHookHandler` cast. Do not add that cast back.
