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

Each environment runs on its own Proxmox LXC, with its own DNS and its own Postgres.
`scripts/deploy-proxmox.mjs` ships the built tree over SSH and restarts the `calendar-puzzle` systemd unit.
It ships no secrets; those live on each LXC.

| Environment | Deploy command | DB backup |
|---|---|---|
| **Dev** | `npm run deploy:dev:proxmox` | `npm run backup:dev:proxmox` |
| **Production** | `npm run deploy:production:proxmox` | `npm run backup:production:proxmox` |

**Every change must be deployed to Dev first and manually tested before being promoted to Production.**
Deploy to Production only after Dev validation.

- The server applies pending DB migrations at startup, so each deploy migrates that environment's DB.
  Back up an environment before a deploy that adds a migration. See
  [docs/DB_BACKUP_SETUP.md](docs/DB_BACKUP_SETUP.md) for backup, restore and rollback.
- `.node-version` sets the Node version on the LXC. The deploy installs that version when the LXC differs.
  The `Dockerfile` is deprecated. Do not update its Node version.

<details>
<summary>Docker deploy (retired)</summary>

The Docker Compose target is retired, and its commands remain in `package.json`. It runs both environments
on one host machine. It builds images locally and never pushes them to a registry, so secrets baked into
image layers stay with the host operator.

| Environment | Deploy command |
|---|---|
| **Dev** | `npm run deploy:dev:docker` |
| **Production** | `npm run deploy:production:docker` |

</details>

## Conventions

All commits should follow `<subject> – <description>` style.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
