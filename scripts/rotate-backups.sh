#!/bin/bash

# Backup Rotation Script for BookedSolid AI
# Deletes backups older than the specified retention period

set -e

# Configuration
BACKUP_DIR="./backups"
RETENTION_DAYS=${1:-30}  # Default: 30 days

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Backup Rotation - Retention: ${RETENTION_DAYS} days${NC}\n"

# Function to count and delete old files
rotate_directory() {
    local dir=$1
    local pattern=$2
    local description=$3

    if [ ! -d "$dir" ]; then
        echo -e "${YELLOW}⚠️  Directory not found: $dir${NC}"
        return
    fi

    # Count files before rotation
    local before_count=$(find "$dir" -name "$pattern" -type f | wc -l | tr -d ' ')

    # Find and delete old files
    local deleted_count=$(find "$dir" -name "$pattern" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l | tr -d ' ')

    # Count files after rotation
    local after_count=$(find "$dir" -name "$pattern" -type f | wc -l | tr -d ' ')

    if [ $deleted_count -gt 0 ]; then
        echo -e "${GREEN}✅ ${description}:${NC}"
        echo "   Before: $before_count files"
        echo "   Deleted: $deleted_count old files"
        echo "   Remaining: $after_count files"
    else
        echo -e "${BLUE}ℹ️  ${description}: $after_count files (none to delete)${NC}"
    fi
}

# Rotate database backups
echo -e "${YELLOW}Database Backups:${NC}"
rotate_directory "$BACKUP_DIR/databases" "*.db" "SQLite databases"
rotate_directory "$BACKUP_DIR/databases" "*.prisma" "Prisma schemas"
rotate_directory "$BACKUP_DIR/databases" "*.tar.gz" "Migrations"
echo ""

# Rotate code backups
echo -e "${YELLOW}Code Backups:${NC}"
rotate_directory "$BACKUP_DIR/code" "*.tar.gz" "Code archives"
echo ""

# Rotate config backups
echo -e "${YELLOW}Config Backups:${NC}"
rotate_directory "$BACKUP_DIR/configs" "*.backup" "Environment files"
rotate_directory "$BACKUP_DIR/configs" "*.json" "Config files"
rotate_directory "$BACKUP_DIR/configs" "*.js" "JavaScript configs"
rotate_directory "$BACKUP_DIR/configs" "*.mjs" "JavaScript modules"
echo ""

# Rotate manifest files
echo -e "${YELLOW}Manifests:${NC}"
rotate_directory "$BACKUP_DIR/manifests" "*.json" "Backup manifests"
echo ""

# Calculate total backup size
if [ -d "$BACKUP_DIR" ]; then
    total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    echo -e "${BLUE}Total backup size: ${total_size}${NC}\n"
fi

echo -e "${GREEN}✅ Backup rotation completed${NC}"
echo -e "${YELLOW}Retention policy: ${RETENTION_DAYS} days${NC}\n"
