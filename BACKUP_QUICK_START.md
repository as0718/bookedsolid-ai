# Backup System - Quick Reference

## One-Click Commands

### Create Full Backup
```bash
npm run backup
```
**Creates:** Database + Code + Config + Manifest

### List All Backups
```bash
npm run backup:list
```
**Shows:** All available backups with details

### Restore from Backup
```bash
npm run restore <backup-id>
```
**Example:** `npm run restore 2025-10-19T06-16-15`

---

## Individual Backups

### Database Only
```bash
npm run backup:db
```

### Code Only
```bash
npm run backup:code
```

### Config Only
```bash
npm run backup:config
```

---

## When to Backup

- Before major deployments
- Before database migrations
- Before major code changes
- After significant data imports
- Weekly for production systems
- Before updating dependencies

---

## Backup Contains

### Database
- SQLite database file (prisma/dev.db)
- Prisma schema
- All migrations

### Code
- All source files
- Components, pages, API routes
- Scripts and utilities
- Excludes: node_modules, .next, backups

### Config
- Environment variables (.env, .env.local)
- package.json
- next.config.js
- tsconfig.json
- tailwind.config.js/ts

---

## Restore Process

1. **List backups:**
   ```bash
   npm run backup:list
   ```

2. **Restore database:**
   ```bash
   npm run restore <backup-id>
   ```

3. **Verify:**
   ```bash
   npm run db:studio
   ```

4. **Restart app:**
   ```bash
   npm run dev
   ```

---

## Important Notes

- Backups stored in `./backups/` directory
- Current database automatically backed up before restore
- Config files require manual restore (safety feature)
- Backups excluded from git (contains sensitive data)
- Store backups securely (contains API keys and secrets)

---

## Troubleshooting

### Backup fails
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### Database locked
```bash
# Stop development server and Prisma Studio
pkill -f "next dev"
pkill -f "prisma studio"
```

### View backup details
```bash
# View manifest
cat backups/manifests/backup_<backup-id>.json
```

---

## Security

**IMPORTANT:** Backup files contain:
- API keys
- Database URLs
- Authentication secrets
- User data

**Never:**
- Commit backups to git
- Share backups publicly
- Store backups in unsecured locations

**Always:**
- Keep backups encrypted when stored remotely
- Restrict access to backup directory
- Rotate API keys when restoring old backups

---

## Full Documentation

See `BACKUP_SYSTEM.md` for complete documentation including:
- Detailed architecture
- Advanced usage
- Automation examples
- Backup rotation scripts
- Security best practices

---

**Quick Help:** Run any command without arguments for usage help
