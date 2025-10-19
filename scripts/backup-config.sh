#!/bin/bash

# Config Backup Script for BookedSolid AI
# Backs up environment files and configuration

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups/configs"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚙️  Starting config backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup package.json
if [ -f "package.json" ]; then
    echo "📦 Backing up package.json..."
    cp package.json "$BACKUP_DIR/package_$DATE.json"
fi

# Backup next.config.js if it exists
if [ -f "next.config.js" ]; then
    echo "⚡ Backing up next.config.js..."
    cp next.config.js "$BACKUP_DIR/next_config_$DATE.js"
fi

# Backup next.config.mjs if it exists
if [ -f "next.config.mjs" ]; then
    echo "⚡ Backing up next.config.mjs..."
    cp next.config.mjs "$BACKUP_DIR/next_config_$DATE.mjs"
fi

# Backup tsconfig.json if it exists
if [ -f "tsconfig.json" ]; then
    echo "📘 Backing up tsconfig.json..."
    cp tsconfig.json "$BACKUP_DIR/tsconfig_$DATE.json"
fi

# Backup tailwind.config.js/ts if it exists
if [ -f "tailwind.config.js" ]; then
    cp tailwind.config.js "$BACKUP_DIR/tailwind_config_$DATE.js"
elif [ -f "tailwind.config.ts" ]; then
    cp tailwind.config.ts "$BACKUP_DIR/tailwind_config_$DATE.ts"
fi

# Backup .env.local (IMPORTANT: Contains sensitive data)
if [ -f ".env.local" ]; then
    echo "🔐 Backing up .env.local (SENSITIVE)..."
    cp .env.local "$BACKUP_DIR/env_local_$DATE.backup"
    echo "⚠️  WARNING: This file contains sensitive data. Store securely!"
fi

# Backup .env if it exists
if [ -f ".env" ]; then
    echo "🔐 Backing up .env..."
    cp .env "$BACKUP_DIR/env_$DATE.backup"
fi

echo -e "${GREEN}✅ Config backup completed!${NC}"
echo "   Location: $BACKUP_DIR/"
[ -f "package.json" ] && echo "   - package_$DATE.json"
[ -f "next.config.js" ] || [ -f "next.config.mjs" ] && echo "   - next_config_$DATE.{js|mjs}"
[ -f "tsconfig.json" ] && echo "   - tsconfig_$DATE.json"
[ -f ".env.local" ] && echo "   - env_local_$DATE.backup (SENSITIVE)"
echo ""

# Return backup info for manifest
echo "CONFIG_BACKUP_DIR=$BACKUP_DIR"
