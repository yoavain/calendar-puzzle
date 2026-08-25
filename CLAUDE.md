# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layering

`src/common/` is the **pure game logic layer — no DOM dependencies, no React.** `src/client/` is the
UI layer; `src/server/` is the Fastify backend.

Directory-scoped guidance loads on demand when you work under those paths:

- `src/client/CLAUDE.md` — styling convention, drag-and-drop patterns, known mobile issues.
- `src/server/CLAUDE.md` — Fastify route generics.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the architecture overview and
[docs/DESIGN.md](docs/DESIGN.md) for schema information.

## Environments

> **Local-only project.** Both environments run on the same host machine via Docker Compose. Docker images are built locally and never pushed to any registry. Secrets baked into image layers are only accessible to the host operator and do not represent a distribution risk.

There are two separate deployed environments, each with its own DNS:

| Environment | Deploy command |
|---|---|
| **Dev** | `npm run deploy:dev` |
| **Production** | `npm run deploy:production` |

**Every change must be deployed to Dev first and manually tested before being promoted to Production.**
Deploy to Production only after Dev validation.

## Conventions

All commits should follow `<subject> – <description>` style.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
