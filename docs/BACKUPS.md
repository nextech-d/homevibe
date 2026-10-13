# Database backups

Neon keeps its own history of the database (point-in-time restore on a branch),
and that is the first thing to reach for after a bad write. These backups are
for what Neon's history can't cover: losing the Neon project, the account, or
the history window itself.

## What runs, and when

`.github/workflows/db-backup.yml`, the **Database backup** workflow:

- **When:** every day at 22:00 UTC (01:00 Nairobi), and whenever it's started
  by hand (Actions → Database backup → Run workflow). Scheduled runs only
  happen from `main`, and GitHub can start them some minutes late.
- **What:** `pg_dump --format=custom` of the production database, read through
  the `BACKUP_DATABASE_URL` secret (the direct, non-pooled Neon connection).
  The dump is piped straight into `age`, encrypted to the public key in the
  `BACKUP_AGE_PUBLIC_KEY` secret. The unencrypted dump is never written to
  disk and never appears in the log.
- **Checks:** the run fails if `pg_dump` or `age` fails, if the file isn't an
  age file, or if it's under `MIN_BACKUP_BYTES` (set in the workflow; raise it
  as the database grows). GitHub emails failed scheduled runs to whoever last
  changed the workflow's schedule.
- **Row counts:** each run's summary page lists the row count of every table,
  taken just after the dump. That's what a restore is checked against.

## Where it's stored, and for how long

Each run uploads one artifact, `homevibe-db-YYYY-MM-DD` (the UTC date),
containing `homevibe-db-YYYY-MM-DD.dump.age`. Artifacts are kept for **90
days**, then GitHub deletes them. They're visible to anyone with read access
to the repository, which is why they're encrypted.

The **private key** that decrypts them is not in GitHub and must never be. Keep
it somewhere you control (a password manager, offline). Without it, every
backup is unreadable.

## Restore

Restore into a **new Neon branch, in a new empty database. Never restore over
production.** A restore doesn't replace what's there: on top of live data it
fails partway or leaves a mix of old and new rows.

You need: the private key file, `age`, the GitHub CLI (`gh`), the Neon CLI
(`neonctl`), and `pg_restore` / `psql` version 18 or newer (on a Mac,
`brew install libpq age gh neonctl`; libpq's tools are in
`$(brew --prefix libpq)/bin`).

### 1. Download the backup

```bash
gh run list --workflow db-backup.yml --limit 10      # pick a successful run
gh run download <run-id> --dir ~/homevibe-restore    # the .dump.age file
```

Or from the run's page under Actions → Database backup → Artifacts (a zip
holding the `.dump.age` file).

Open the same run's summary and keep its **row counts** for step 5.

### 2. Check it decrypts

```bash
age --decrypt --identity ~/path/to/backup-key.txt \
  ~/homevibe-restore/homevibe-db-YYYY-MM-DD.dump.age | pg_restore --list | head
```

This prints the start of the backup's table of contents. Nothing decrypted is
written to disk.

### 3. Create a new Neon branch and an empty database in it

A new branch starts as a copy of its parent's data, so the restore goes into a
separate, empty database on that branch:

```bash
neonctl branches create --name restore-YYYY-MM-DD
neonctl databases create --branch restore-YYYY-MM-DD --name restore_check
RESTORE_URL=$(neonctl connection-string restore-YYYY-MM-DD --database-name restore_check)
```

(Pass `--project-id` to each if you have more than one Neon project. The Neon
console works too: Branches → Create branch, then Databases → New database.)

Before going on, make sure `RESTORE_URL` is not production:

```bash
psql "$RESTORE_URL" -c "SELECT current_database()"   # must say restore_check
psql "$RESTORE_URL" -c "\dt"                         # must say: Did not find any relations
```

and that its host (`ep-...`) differs from the production endpoint shown in the
Neon console. If either check fails, stop.

### 4. Restore

```bash
age --decrypt --identity ~/path/to/backup-key.txt \
  ~/homevibe-restore/homevibe-db-YYYY-MM-DD.dump.age \
  | pg_restore --no-owner --no-privileges --exit-on-error --dbname "$RESTORE_URL"
```

Again, nothing decrypted touches disk. It should finish with no output.

### 5. Verify row counts

```bash
psql "$RESTORE_URL" --tuples-only --no-align --field-separator=' ' -c "
  SELECT table_name,
         (xpath('/row/c/text()',
                query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name),
                             false, true, '')))[1]::text
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name"
```

Every table should match the run summary from step 1. The counts there were
taken just after the dump, so a busy table (`rate_limits`, `sessions`) can be
off by a few; anything else that differs means the restore isn't complete.

### 6. Clean up

```bash
neonctl branches delete restore-YYYY-MM-DD
rm -r ~/homevibe-restore
```

### Recovering for real

Steps 1–5 are the same. Once the restored database checks out, switching the
site to it is a deliberate change of `DATABASE_URL` on the Vercel projects -
decided at the time, not part of this procedure. Production itself is never
the restore target.

## Test it

A backup nobody has restored is a hope, not a backup. Run steps 1–6 every few
months, and after any change to the workflow.
