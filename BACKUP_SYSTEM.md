# BookedSolid AI - Backup & Restore System

## Overview

This comprehensive backup system protects your BookedSolid AI application data, code, and configuration. It provides one-click backup and restore capabilities for the entire application.

## Quick Start

### Create a Full Backup

```bash
npm run backup
```

This creates:
- Database backup (SQLite + Prisma schema + migrations)
- Code backup (all source files, excluding node_modules)
- Config backup (environment files, package.json, etc.)
- Backup manifest (metadata and file inventory)

### List Available Backups

```bash
npm run backup:list
```

### Restore from Backup

```bash
npm run restore <backup-id>
```

Example:
```bash
npm run restore 2025-10-19T14-30-00
```

---

## Backup System Architecture

### Directory Structure

```
backups/
├── databases/          # SQLite database backups
│   ├── db_backup_20251019_143000.db
│   ├── schema_20251019_143000.prisma
│   └── migrations_20251019_143000.tar.gz
├── code/              # Source code archives
│   └── code_backup_20251019_143000.tar.gz
├── configs/           # Configuration backups
│   ├── env_local_20251019_143000.backup
│   ├── package_20251019_143000.json
│   └── next_config_20251019_143000.js
└── manifests/         # Backup metadata
    └── backup_2025-10-19T14-30-00.json
```

---

## Available Commands

### Full Backup

```bash
npm run backup
```

Creates a complete backup of:
- Database (SQLite file)
- Prisma schema
- Database migrations
- Source code (excluding node_modules, .next, etc.)
- Configuration files
- Environment variables

**Output:**
- Backup ID for restore operations
- Summary of backed up components
- File locations and sizes

### Individual Component Backups

#### Database Only
```bash
npm run backup:db
```

#### Code Only
```bash
npm run backup:code
```

#### Config Only
```bash
npm run backup:config
```

### Restore Operations

#### List Backups
```bash
npm run backup:list
```

Shows all available backups with:
- Backup ID
- Creation date
- Component status (database, code, config)
- Git information (branch, commit)

#### Restore from Backup
```bash
npm run restore <backup-id>
```

**What it does:**
1. Creates a safety backup of current database
2. Restores database from specified backup
3. Provides instructions for manual config restore

**Safety Features:**
- Current database automatically backed up before restore
- Config files require manual restore to prevent accidental overwrites
- Verification of backup existence before proceeding

---

## Backup Contents

### 1. Database Backup

**Files backed up:**
- `prisma/dev.db` - SQLite database file
- `prisma/schema.prisma` - Database schema
- `prisma/migrations/` - All migration files

**Why it matters:**
Contains all your application data including users, appointments, settings, subscriptions, etc.

### 2. Code Backup

**Files backed up:**
All source files except:
- `node_modules/` - Dependencies (restore with `npm install`)
- `.next/` - Build artifacts (rebuild with `npm run build`)
- `backups/` - Existing backups (prevents recursion)
- `.git/` - Git history (use git repository instead)
- `*.log` - Log files
- `.env*.local` - Environment files (backed up separately)
- Database files (backed up separately)

**Why it matters:**
Preserves your application code at a specific point in time.

### 3. Config Backup

**Files backed up:**
- `.env.local` - Environment variables (SENSITIVE)
- `.env` - Default environment variables
- `package.json` - Dependencies and scripts
- `next.config.js/mjs` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js/ts` - Tailwind CSS configuration

**Why it matters:**
Contains API keys, database URLs, and application settings.

---

## Best Practices

### Regular Backups

Create backups:
- Before major deployments
- Before database migrations
- Before major code changes
- After significant data imports
- Weekly for production systems

### Backup Storage

**Local Backups:**
- Stored in `./backups/` directory
- Add `backups/` to `.gitignore`
- Keep backups on a separate drive or cloud storage

**Remote Backups:**
Consider copying backups to:
- Cloud storage (AWS S3, Google Cloud Storage)
- External hard drive
- Network-attached storage (NAS)
- Version control (for code only, not sensitive data)

### Security Considerations

**Sensitive Data:**
- `.env.local` contains API keys and secrets
- Never commit backup files to version control
- Encrypt backups before cloud storage
- Restrict access to backup directories

**Environment Variables:**
When restoring, manually review and update:
- API keys (may need rotation)
- Database URLs
- Third-party service credentials

---

## Restore Procedures

### Complete Restore

1. **List available backups:**
   ```bash
   npm run backup:list
   ```

2. **Choose a backup and restore:**
   ```bash
   npm run restore 2025-10-19T14-30-00
   ```

3. **Verify database:**
   ```bash
   npm run db:studio
   ```
   Check that your data is present.

4. **Manually restore config (if needed):**
   ```bash
   cp backups/configs/env_local_20251019_143000.backup .env.local
   ```

5. **Regenerate Prisma client:**
   ```bash
   npm run db:generate
   ```

6. **Restart application:**
   ```bash
   npm run dev
   ```

### Partial Restore

#### Database Only
```bash
# Find the backup you want
npm run backup:list

# Manually copy the database file
cp backups/databases/db_backup_20251019_143000.db prisma/dev.db

# Restart the app
npm run dev
```

#### Code Only
```bash
# Extract code backup
tar -xzf backups/code/code_backup_20251019_143000.tar.gz -C ./restored/

# Review and selectively copy files
```

---

## Automation

### Scheduled Backups (Optional)

Add to your crontab for daily backups:

```bash
# Open crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/dashboard && npm run backup
```

### Pre-Deployment Backup Hook

Add to your deployment script:

```bash
#!/bin/bash
echo "Creating pre-deployment backup..."
npm run backup

echo "Deploying application..."
# ... your deployment commands
```

---

## Troubleshooting

### Backup Fails

**Issue:** Permission denied
```bash
chmod +x scripts/*.sh
```

**Issue:** No space left on device
- Clean up old backups
- Move backups to external storage

**Issue:** Database locked
- Stop the development server
- Close Prisma Studio
- Retry backup

### Restore Fails

**Issue:** Backup ID not found
```bash
# List available backups
npm run backup:list

# Use exact backup ID from list
```

**Issue:** Database restore fails
```bash
# Check file exists
ls -lh backups/databases/db_backup_*.db

# Verify database is not in use
pkill -f "prisma studio"
pkill -f "next dev"

# Retry restore
```

---

## Backup Manifest

Each backup includes a JSON manifest with:

```json
{
  "timestamp": "2025-10-19T14:30:00.000Z",
  "date": "10/19/2025, 2:30:00 PM",
  "backupId": "2025-10-19T14-30-00",
  "components": {
    "database": {
      "completed": true,
      "files": [
        "backups/databases/db_backup_20251019_143000.db",
        "backups/databases/schema_20251019_143000.prisma"
      ]
    },
    "code": {
      "completed": true,
      "files": ["backups/code/code_backup_20251019_143000.tar.gz"]
    },
    "config": {
      "completed": true,
      "files": ["backups/configs/env_local_20251019_143000.backup"]
    }
  },
  "gitInfo": {
    "branch": "main",
    "commit": "abc123def456",
    "status": "M package.json"
  },
  "metadata": {
    "nodeVersion": "v20.11.0",
    "platform": "darwin"
  }
}
```

---

## Advanced Usage

### Custom Backup Scripts

Create custom backup workflows:

```bash
#!/bin/bash
# pre-migration-backup.sh

echo "Creating pre-migration backup..."
npm run backup

echo "Running migration..."
npm run db:migrate

echo "Verifying migration..."
npm run db:studio
```

### Backup Rotation

Implement backup rotation to save space:

```bash
#!/bin/bash
# Keep only last 30 days of backups

find backups/databases -name "*.db" -mtime +30 -delete
find backups/code -name "*.tar.gz" -mtime +30 -delete
find backups/configs -name "*.backup" -mtime +30 -delete
find backups/manifests -name "*.json" -mtime +30 -delete
```

---

## Support

For issues with the backup system:

1. Check this documentation
2. Review error messages carefully
3. Verify file permissions
4. Ensure sufficient disk space
5. Check that scripts are executable

For questions about your specific use case, consult the main application documentation.

---

**Last Updated:** October 19, 2025
**Version:** 1.0.0
