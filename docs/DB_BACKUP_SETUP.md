# Database Backup & Restore

Each environment's Postgres runs on its Proxmox LXC. The backup and restore scripts reach it over SSH as
the deploy account, with the same key and host settings as `npm run deploy:<env>:proxmox`.

- `scripts/db-backup.js` streams a plain-SQL `pg_dump` from the LXC to a local file.
- `scripts/db-restore.js` streams a local file back into `psql` on the LXC, after a Y/N prompt.
- `scripts/db-target.mjs` builds the remote commands. Read its comments for the flag choices.

Always use the `:proxmox` npm scripts. The scripts default to `--target docker` when called directly.

## Behavior

- **Dumps restore onto a populated database.** `pg_dump --clean --if-exists` emits a `DROP` before each `CREATE`.
- **Restores are all-or-nothing.** `psql --single-transaction -v ON_ERROR_STOP=1` stops at the first error and rolls back. A failed restore leaves the old data in place.
- **A restore replaces the whole database.** The tables and the `drizzle` migrations schema are both replaced.
- **Production to Dev is allowed.** `--from production` seeds Dev with real data, for example to rehearse a migration.
- **Dev to Production is refused.** No flag overrides this.

## Setup

Add these keys to `.env`. The deploy script uses the same SSH keys.

| Key | Required | Meaning |
|---|---|---|
| `CALENDAR_PUZZLE_DB_BACKUP_PATH` | yes | Local backup directory, e.g. `C:\Backups\calendar-puzzle`. The script creates it. |
| `CALENDAR_PUZZLE_DEV_HOST` | yes | Address of the Dev LXC |
| `CALENDAR_PUZZLE_PRODUCTION_HOST` | yes | Address of the Production LXC |
| `CALENDAR_PUZZLE_DEPLOY_USER` | no | SSH user. Default: `deploy`. |
| `CALENDAR_PUZZLE_SSH_KEY` | no | Private key path. Default: `~/.ssh/id_ed25519_calpuzzle`. |

SSH runs with `BatchMode=yes`, so it never prompts. A key with a passphrase works only when `ssh-agent`
holds it.

## Back up

```bash
npm run backup:dev:proxmox
npm run backup:production:proxmox
```

The output is `<CALENDAR_PUZZLE_DB_BACKUP_PATH>\YYYY-MM-DD-<env>.sql`. The date is the local date at
backup time.

**One file per environment per day.** A second backup of the same environment on the same day overwrites
the first. Before a deploy that runs a migration, back up that environment. Do not back it up again that
day, or copy the file somewhere else first.

## Restore

Restores are manual and interactive. The script shows the target and the source file, then asks for `Y`.

```bash
npm run restore:dev:proxmox -- --date 2026-05-15
npm run restore:production:proxmox -- --date 2026-05-15

# Seed Dev from a Production backup
npm run restore:dev:proxmox -- --from production --date 2026-05-15
```

A restore does not change the deployed code. To roll back a release that ran a migration, restore the
backup, then deploy the previous release.

## Scheduled daily backups

Run in PowerShell as Administrator. `-Force` replaces a task of the same name.

```powershell
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries

# Dev: daily at 3:00 AM
$action  = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c npm run backup:dev:proxmox" `
    -WorkingDirectory "C:\Dev\_MISC\calendar-puzzle"
$trigger = New-ScheduledTaskTrigger -Daily -At 3:00am
Register-ScheduledTask -TaskName "CalendarPuzzle-Backup-Dev" -Force `
    -Action $action -Trigger $trigger -Settings $settings `
    -Description "Daily pg_dump of calendar-puzzle dev DB"

# Production: daily at 3:15 AM
$action  = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c npm run backup:production:proxmox" `
    -WorkingDirectory "C:\Dev\_MISC\calendar-puzzle"
$trigger = New-ScheduledTaskTrigger -Daily -At 3:15am
Register-ScheduledTask -TaskName "CalendarPuzzle-Backup-Production" -Force `
    -Action $action -Trigger $trigger -Settings $settings `
    -Description "Daily pg_dump of calendar-puzzle production DB"
```

To test a task, open Task Scheduler (`taskschd.msc`), right-click the task, and select **Run**. A new
`.sql` file with today's date appears in the backup directory.

A scheduled backup needs three conditions:

1. The machine is on.
2. The machine reaches the LXC over the network.
3. SSH reaches the LXC without a prompt (see Setup).

There is no automatic cleanup. Delete old files in the backup directory by hand.

## Troubleshooting

| Symptom | Check |
|---|---|
| `CALENDAR_PUZZLE_<ENV>_HOST is not set` | Add the key to `.env`. |
| `Permission denied (publickey)` or a timeout | Run the command by hand. Check the key path and that the LXC is up. |
| `backup file is empty` / `pg_dump exited with code N` | Read the `[pg_dump stderr]` lines. Postgres on the LXC may be down. |
| Task shows "Did not complete" | Run `npm run backup:<env>:proxmox` by hand and read the output. |

<details>
<summary>Docker target (retired)</summary>

The same scripts support the retired Docker Compose stacks with `--target docker`. They reach the
container `calendar-puzzle-<env>-postgres-1` with `docker exec`. Docker Desktop must run.

```bash
npm run backup:dev:docker
npm run backup:production:docker
npm run restore:dev:docker -- --date 2026-05-15
npm run restore:production:docker -- --date 2026-05-15
```

The Docker target does not need the host, user or key keys in `.env`. It needs only
`CALENDAR_PUZZLE_DB_BACKUP_PATH`.

</details>
