Last-known-good published CMS JSON.

Regenerate (read-only Sanity):

```bash
npm run cms:snapshot
```

Invalid or empty CMS output does not overwrite these files.
Do not put dataset `.tar.gz` backups here — use `npm run sanity:backup` → `/backups/` (gitignored).
