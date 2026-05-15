# Database Backup & Restore Setup Guide

This document explains how to finalize the setup of the daily database backup system after the scripts have been added to the codebase.

## Files Added

- `scripts/db-backup.js` — Backup utility
- `scripts/db-restore.js` — Restore utility with Y/N confirmation gate
- `package.json` — Four new npm scripts:
  - `backup:dev`, `backup:production`
  - `restore:dev`, `restore:production`

## Step 1: Configure `.env`

Add the backup directory to your `.env` file:

```
CALENDAR_PUZZLE_DB_BACKUP_PATH=C:\Backups\calendar-puzzle
```

You can use any path you prefer. The directory will be created automatically if it doesn't exist.

## Step 2: Test the Scripts Manually

Verify both scripts work before setting up the schedule:

### Backup test (dev)

```bash
npm run backup:dev
```

Expected output:
```
[2026-05-15] Backing up dev database...
  Container: calendar-puzzle-dev-postgres-1
  Output:    C:\Backups\calendar-puzzle\2026-05-15-dev.sql
✓ Backup complete (XXX KB, X.XXs)
```

A file at `C:\Backups\calendar-puzzle\2026-05-15-dev.sql` should exist with SQL dump contents.

### Restore test (dev only)

After backing up, make a test change to the dev database (add a row via the app), then restore:

```bash
npm run restore:dev -- --date 2026-05-15
```

You should see:
1. A loud warning with the environment, container, and file details
2. A prompt: "Type Y to proceed, anything else to abort: "
3. Type `Y` to proceed
4. Upon completion: "✓ Restore complete"

Verify the app rolls back to the backed-up state.

## Step 3: Create Windows Task Scheduler Tasks

Run the PowerShell commands below as Administrator. Open PowerShell as Administrator and paste:

```powershell
# Create the dev backup task (daily at 3:00 AM)
$action  = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c npm run backup:dev" `
    -WorkingDirectory "C:\Dev\_MISC\calendar-puzzle"
$trigger = New-ScheduledTaskTrigger -Daily -At 3:00am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries
Register-ScheduledTask -TaskName "CalendarPuzzle-Backup-Dev" `
    -Action $action -Trigger $trigger -Settings $settings `
    -Description "Daily pg_dump of calendar-puzzle dev DB"

# Create the production backup task (daily at 3:15 AM, offset so they don't compete)
$action  = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c npm run backup:production" `
    -WorkingDirectory "C:\Dev\_MISC\calendar-puzzle"
$trigger = New-ScheduledTaskTrigger -Daily -At 3:15am
Register-ScheduledTask -TaskName "CalendarPuzzle-Backup-Production" `
    -Action $action -Trigger $trigger -Settings $settings `
    -Description "Daily pg_dump of calendar-puzzle production DB"
```

### Verify the tasks were created

Open Task Scheduler (`taskschd.msc`) and confirm:
- **CalendarPuzzle-Backup-Dev** is listed (trigger: Daily, 3:00 AM)
- **CalendarPuzzle-Backup-Production** is listed (trigger: Daily, 3:15 AM)

### Test the tasks

Right-click each task → **Run** to execute them immediately. Check that new `.sql` files appear in your backup directory with today's date.

### Important: Docker Desktop Requirement

The scheduled tasks **will not work if Docker Desktop is not running** when they fire. Ensure one of the following:

1. **Docker Desktop starts on login** (recommended):
   - Open Docker Desktop → Settings → General → check "Start Docker Desktop when you sign in"
   - Close and reopen Docker Desktop to confirm

2. **Your machine is always on at 3:00 AM** and Docker is running

## Restore: Manual Operation

Restores are **always manual and interactive** — there is no schedule for them. To restore from a backup:

```bash
npm run restore:dev -- --date 2026-05-15
npm run restore:production -- --date 2026-05-15
```

The script will prompt for Y/N confirmation. This is intentional — restores are destructive and require deliberate action.

## File Naming

Backups are named `YYYY-MM-DD-<env>.sql`, e.g.:
- `2026-05-15-dev.sql` (dev backup from May 15, 2026)
- `2026-05-15-production.sql` (production backup from May 15, 2026)

The date is derived from the **system's local timezone** at backup time.

## Backup Directory Contents

Backups accumulate in the directory you configured. There is **no automatic cleanup** — you manage retention manually:

```bash
# List all backups
dir C:\Backups\calendar-puzzle

# Delete a backup
del C:\Backups\calendar-puzzle\2026-04-15-dev.sql
```

## Troubleshooting

### Task shows "Did not complete" in Task Scheduler

1. Check that Docker Desktop is running
2. Manually run `npm run backup:dev` and check the output
3. Check the backup directory for the file

### "Error: container not found" or "Error spawning docker"

The docker container may not exist or Docker Desktop may not be running. Verify:
- Docker Desktop is running
- Run `docker ps` and confirm containers exist
- Run `npm run backup:dev` manually to see the error

### "Error: backup file is empty"

pg_dump may have failed. Check:
- Is the database running?
- Is the container still healthy?
- Try the backup manually and check for stderr output
