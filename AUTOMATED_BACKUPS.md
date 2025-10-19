# Automated Backups - Complete Guide

## Overview

The automated backup system provides scheduled backups with automatic rotation (cleanup of old backups). This ensures your data is regularly backed up without manual intervention while managing disk space efficiently.

---

## Quick Setup

### Option 1: Interactive Setup (Recommended)

```bash
npm run backup:setup-cron
```

This interactive wizard will:
- Show your current cron jobs
- Let you choose a backup schedule
- Configure backup rotation
- Install the cron job automatically

### Option 2: Manual Setup

Add to your crontab:

```bash
# Edit crontab
crontab -e

# Add one of these lines:
# Daily at 2 AM:
0 2 * * * cd /Users/alansine/Downloads/Voice\ Agent/dashboard && npm run backup:auto

# Twice daily (2 AM and 2 PM):
0 2,14 * * * cd /Users/alansine/Downloads/Voice\ Agent/dashboard && npm run backup:auto

# Every 12 hours:
0 */12 * * * cd /Users/alansine/Downloads/Voice\ Agent/dashboard && npm run backup:auto

# Weekly (Sunday at 2 AM):
0 2 * * 0 cd /Users/alansine/Downloads/Voice\ Agent/dashboard && npm run backup:auto
```

**Important:** Replace the path with your actual dashboard directory path.

---

## Commands Reference

### Automated Backup with Rotation

```bash
npm run backup:auto
```

**What it does:**
1. Creates full backup (database + code + config)
2. Deletes backups older than 30 days
3. Logs everything to `backups/backup.log`

**When to use:**
- In cron jobs for automated backups
- When you want backup + rotation in one command

### Backup Rotation Only

```bash
npm run backup:rotate
```

**What it does:**
- Deletes database backups older than 30 days
- Deletes code archives older than 30 days
- Deletes config backups older than 30 days
- Deletes manifest files older than 30 days
- Shows summary of deleted files

**Custom retention:**
```bash
npm run backup:rotate 60  # Keep last 60 days
npm run backup:rotate 7   # Keep last 7 days
```

### Interactive Cron Setup

```bash
npm run backup:setup-cron
```

**Features:**
- View current cron jobs
- Choose from preset schedules
- Enable/disable automatic rotation
- Automatic path configuration
- Safe installation (removes old backup crons)

---

## Backup Schedules Explained

### Daily Backups

**Best for:** Production systems, critical data

```bash
# At 2:00 AM
0 2 * * *

# At 3:00 AM
0 3 * * *

# At 4:00 AM
0 4 * * *
```

**Pros:**
- Daily snapshots of your data
- Good balance of safety and disk usage

**Cons:**
- Higher disk usage over time
- Might fill up disk if not rotated

### Twice Daily Backups

**Best for:** High-value data, active development

```bash
# At 2:00 AM and 2:00 PM
0 2,14 * * *
```

**Pros:**
- Twice-daily snapshots
- Better for fast-changing data
- More recovery points

**Cons:**
- Higher disk usage
- More frequent rotation needed

### Every 12 Hours

**Best for:** Continuous operations

```bash
# Every 12 hours
0 */12 * * *
```

**Pros:**
- Frequent backups
- Good for 24/7 operations

**Cons:**
- Highest disk usage
- May impact performance during backup

### Weekly Backups

**Best for:** Low-change systems, dev environments

```bash
# Sunday at 2:00 AM
0 2 * * 0
```

**Pros:**
- Low disk usage
- Minimal overhead

**Cons:**
- Less frequent recovery points
- Higher data loss risk

---

## Backup Rotation

### How It Works

The rotation system automatically deletes backups older than a specified period (default: 30 days).

**Files affected:**
- Database backups (`.db` files)
- Prisma schemas (`.prisma` files)
- Migrations archives (`.tar.gz` in databases/)
- Code archives (`.tar.gz` in code/)
- Config backups (`.backup`, `.json`, `.js`, `.mjs` files)
- Backup manifests (`.json` in manifests/)

### Retention Policies

**30 Days (Default):**
```bash
npm run backup:rotate
# or
npm run backup:rotate 30
```

**Custom Retention:**
```bash
# Keep last 7 days (testing)
npm run backup:rotate 7

# Keep last 60 days (extra safety)
npm run backup:rotate 60

# Keep last 90 days (compliance)
npm run backup:rotate 90
```

### Calculating Disk Usage

**Typical backup sizes:**
- Database: 300-500 KB
- Code: 600-800 KB
- Config: 5-10 KB
- **Total per backup:** ~1 MB

**Estimated disk usage:**

| Schedule | Retention | Approx. Size |
|----------|-----------|--------------|
| Daily | 30 days | ~30 MB |
| Daily | 60 days | ~60 MB |
| Twice daily | 30 days | ~60 MB |
| Every 12 hours | 30 days | ~60 MB |
| Weekly | 52 weeks | ~52 MB |

---

## Logging

### Log File Location

```
backups/backup.log
```

### View Recent Logs

```bash
# Last 20 lines
tail -20 backups/backup.log

# Follow logs in real-time
tail -f backups/backup.log

# View all logs
cat backups/backup.log
```

### Log Format

```
[2025-10-19T06:16:15.000Z] Starting automated backup...
[2025-10-19T06:16:18.000Z] Backup completed successfully
[2025-10-19T06:16:18.000Z] Starting backup rotation (30 days retention)...
[2025-10-19T06:16:19.000Z] Backup rotation completed
[2025-10-19T06:16:19.000Z] Backup: SUCCESS
[2025-10-19T06:16:19.000Z] Rotation: SUCCESS
```

---

## Monitoring & Maintenance

### Check Cron Status

```bash
# List all cron jobs
crontab -l

# Check if backup cron is installed
crontab -l | grep backup
```

### Verify Backups Are Running

```bash
# Check log file for recent entries
tail -20 backups/backup.log

# List recent backups
npm run backup:list

# Check backup directory size
du -sh backups/
```

### Test Automated Backup

```bash
# Run automated backup manually
npm run backup:auto

# Check the log
tail -20 backups/backup.log
```

### Remove Automated Backups

```bash
# Edit crontab
crontab -e

# Remove the backup line, save and exit
# Or remove all cron jobs:
crontab -r
```

---

## Troubleshooting

### Cron Job Not Running

**Check cron service:**
```bash
# macOS
launchctl list | grep cron

# Linux
systemctl status cron
```

**Check permissions:**
```bash
chmod +x scripts/*.sh
chmod +x scripts/*.ts
```

**Check logs:**
```bash
# View system cron log (macOS)
log show --predicate 'process == "cron"' --last 1h

# View system cron log (Linux)
grep CRON /var/log/syslog
```

### Backups Filling Disk

**Check disk usage:**
```bash
du -sh backups/*
df -h .
```

**Solutions:**
1. Reduce retention period:
   ```bash
   npm run backup:rotate 7  # Keep only 7 days
   ```

2. Change backup frequency:
   ```bash
   # Edit cron: change to weekly instead of daily
   crontab -e
   ```

3. Manual cleanup:
   ```bash
   # Delete all backups older than 14 days
   npm run backup:rotate 14
   ```

### Backup Failed

**Check log file:**
```bash
tail -50 backups/backup.log
```

**Common issues:**

1. **Database locked:**
   - Stop development server before backup
   - Close Prisma Studio

2. **Permission denied:**
   ```bash
   chmod +x scripts/*.sh
   chmod +x scripts/*.ts
   ```

3. **Disk full:**
   ```bash
   # Check disk space
   df -h .

   # Clean up old backups
   npm run backup:rotate 7
   ```

### Rotation Not Working

**Manual rotation:**
```bash
npm run backup:rotate 30
```

**Check files:**
```bash
# List backup files by age
find backups -type f -mtime +30 -ls
```

**Force rotation:**
```bash
# Delete backups older than 30 days manually
find backups/databases -type f -mtime +30 -delete
find backups/code -type f -mtime +30 -delete
find backups/configs -type f -mtime +30 -delete
find backups/manifests -type f -mtime +30 -delete
```

---

## Best Practices

### 1. Regular Monitoring

- Check logs weekly: `tail -50 backups/backup.log`
- Verify disk space monthly: `du -sh backups/`
- Test restore quarterly: `npm run restore <backup-id>`

### 2. Retention Strategy

**Development:**
- Schedule: Daily at 2 AM
- Retention: 7-14 days
- Rotation: Automated

**Production:**
- Schedule: Daily at 2 AM
- Retention: 30-60 days
- Rotation: Automated
- **Plus:** Manual weekly offsite backup

### 3. Disaster Recovery Plan

1. **Local backups:** Automated daily with 30-day retention
2. **Weekly offsite:** Copy backups to cloud storage
3. **Quarterly full backup:** Store externally, keep indefinitely
4. **Test restores:** Quarterly verification

### 4. Security

**Backup logs:**
- Logs contain sensitive file paths
- Restrict access: `chmod 600 backups/backup.log`

**Cron environment:**
- Cron runs with limited environment variables
- Use absolute paths in cron commands
- Test cron commands manually first

**Storage:**
- Keep backups encrypted when remote
- Never commit backups to git
- Restrict access to backup directory

---

## Advanced Configuration

### Custom Backup Script

Create `scripts/custom-backup.sh`:

```bash
#!/bin/bash

# Pre-backup tasks
echo "Running pre-backup tasks..."
# ... your custom tasks ...

# Run backup
npm run backup:auto

# Post-backup tasks
echo "Running post-backup tasks..."
# Copy to external drive
rsync -av backups/ /Volumes/ExternalDrive/backups/

# Upload to cloud (example)
# aws s3 sync backups/ s3://my-bucket/backups/

echo "Custom backup completed"
```

### Backup Notifications

Add to `scripts/backup-notify.sh`:

```bash
#!/bin/bash

# Run backup
npm run backup:auto > /tmp/backup.log 2>&1

# Check result
if [ $? -eq 0 ]; then
    # Success notification
    osascript -e 'display notification "Backup completed successfully" with title "BookedSolid AI"'
else
    # Failure notification
    osascript -e 'display notification "Backup failed! Check logs." with title "BookedSolid AI" sound name "Basso"'
fi
```

### Multiple Retention Policies

```bash
#!/bin/bash

# Keep different retention for different types
find backups/databases -name "*.db" -mtime +60 -delete    # Database: 60 days
find backups/code -name "*.tar.gz" -mtime +30 -delete      # Code: 30 days
find backups/configs -name "*.backup" -mtime +90 -delete   # Config: 90 days
```

---

## Support & Resources

**Documentation:**
- [Backup System Overview](BACKUP_SYSTEM.md)
- [Quick Start Guide](BACKUP_QUICK_START.md)
- This Document (Automated Backups)

**Commands Summary:**
```bash
npm run backup           # Manual backup
npm run backup:auto      # Automated backup with rotation
npm run backup:rotate    # Rotation only
npm run backup:setup-cron # Interactive cron setup
npm run backup:list      # List all backups
npm run restore <id>     # Restore from backup
```

**Getting Help:**
- Check logs: `tail -50 backups/backup.log`
- Test manually: `npm run backup:auto`
- Verify cron: `crontab -l`

---

**Last Updated:** October 19, 2025
**Version:** 1.0.0
