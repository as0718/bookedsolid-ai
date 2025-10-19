#!/bin/bash

# Code Backup Script for BookedSolid AI
# Backs up source code, excluding node_modules and build artifacts

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups/code"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}💻 Starting code backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create tarball of source code
echo "📦 Creating code archive..."
tar -czf "$BACKUP_DIR/code_backup_$DATE.tar.gz" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='backups' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.env.local' \
  --exclude='.env*.local' \
  --exclude='prisma/dev.db' \
  --exclude='prisma/dev.db-journal' \
  .

# Get archive size
ARCHIVE_SIZE=$(du -h "$BACKUP_DIR/code_backup_$DATE.tar.gz" | cut -f1)

echo -e "${GREEN}✅ Code backup completed!${NC}"
echo "   Archive: $BACKUP_DIR/code_backup_$DATE.tar.gz ($ARCHIVE_SIZE)"
echo ""

# Return backup info for manifest
echo "CODE_BACKUP=$BACKUP_DIR/code_backup_$DATE.tar.gz"
