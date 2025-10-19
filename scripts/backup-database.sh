#!/bin/bash

# Database Backup Script for BookedSolid AI
# Backs up SQLite database, Prisma schema, and migrations

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups/databases"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="prisma/dev.db"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Starting database backup...${NC}"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Error: Database file not found at $DB_PATH"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup SQLite database
echo "📊 Backing up SQLite database..."
cp "$DB_PATH" "$BACKUP_DIR/db_backup_$DATE.db"

# Backup Prisma schema
echo "📄 Backing up Prisma schema..."
cp prisma/schema.prisma "$BACKUP_DIR/schema_$DATE.prisma"

# Backup migrations if they exist
if [ -d "prisma/migrations" ]; then
    echo "🔄 Backing up migrations..."
    tar -czf "$BACKUP_DIR/migrations_$DATE.tar.gz" prisma/migrations/
fi

# Get database size
DB_SIZE=$(du -h "$DB_PATH" | cut -f1)

echo -e "${GREEN}✅ Database backup completed!${NC}"
echo "   Database: $BACKUP_DIR/db_backup_$DATE.db ($DB_SIZE)"
echo "   Schema: $BACKUP_DIR/schema_$DATE.prisma"
[ -d "prisma/migrations" ] && echo "   Migrations: $BACKUP_DIR/migrations_$DATE.tar.gz"
echo ""

# Return backup info for manifest
echo "DB_BACKUP=$BACKUP_DIR/db_backup_$DATE.db"
echo "SCHEMA_BACKUP=$BACKUP_DIR/schema_$DATE.prisma"
[ -d "prisma/migrations" ] && echo "MIGRATIONS_BACKUP=$BACKUP_DIR/migrations_$DATE.tar.gz"
