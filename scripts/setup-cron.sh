#!/bin/bash

# Automated Backup Setup for BookedSolid AI
# This script helps you set up automated backups using cron

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   BookedSolid AI - Automated Backup Setup                 ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}\n"

# Get the absolute path to the dashboard directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${YELLOW}Project directory: ${PROJECT_DIR}${NC}\n"

# Check if crontab is available
if ! command -v crontab &> /dev/null; then
    echo -e "${RED}❌ Error: crontab is not available on this system${NC}"
    echo "Automated backups require cron to be installed."
    exit 1
fi

echo -e "${GREEN}✅ crontab is available${NC}\n"

# Show current crontab
echo -e "${BLUE}Current crontab entries:${NC}"
crontab -l 2>/dev/null || echo "No crontab entries found"
echo ""

# Backup schedule options
echo -e "${YELLOW}Select backup schedule:${NC}"
echo "1) Daily at 2:00 AM"
echo "2) Daily at 3:00 AM"
echo "3) Daily at 4:00 AM"
echo "4) Twice daily (2:00 AM and 2:00 PM)"
echo "5) Every 12 hours"
echo "6) Weekly (Sunday at 2:00 AM)"
echo "7) Custom schedule"
echo "8) Cancel"
echo ""

read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="Daily at 2:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 3 * * *"
        DESCRIPTION="Daily at 3:00 AM"
        ;;
    3)
        CRON_SCHEDULE="0 4 * * *"
        DESCRIPTION="Daily at 4:00 AM"
        ;;
    4)
        CRON_SCHEDULE="0 2,14 * * *"
        DESCRIPTION="Twice daily (2:00 AM and 2:00 PM)"
        ;;
    5)
        CRON_SCHEDULE="0 */12 * * *"
        DESCRIPTION="Every 12 hours"
        ;;
    6)
        CRON_SCHEDULE="0 2 * * 0"
        DESCRIPTION="Weekly (Sunday at 2:00 AM)"
        ;;
    7)
        echo -e "\n${YELLOW}Enter custom cron schedule (e.g., '0 2 * * *'):${NC}"
        read -p "Schedule: " CRON_SCHEDULE
        DESCRIPTION="Custom schedule: $CRON_SCHEDULE"
        ;;
    8)
        echo -e "\n${YELLOW}Setup cancelled${NC}"
        exit 0
        ;;
    *)
        echo -e "\n${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Backup rotation option
echo -e "\n${YELLOW}Enable automatic backup rotation (delete old backups)?${NC}"
echo "This will keep only the last 30 days of backups."
read -p "Enable rotation? (y/n): " rotation_choice

if [[ $rotation_choice == "y" || $rotation_choice == "Y" ]]; then
    ENABLE_ROTATION=true
    BACKUP_CMD="cd $PROJECT_DIR && npm run backup:auto 2>&1 | tee -a $PROJECT_DIR/backups/backup.log"
else
    ENABLE_ROTATION=false
    BACKUP_CMD="cd $PROJECT_DIR && npm run backup 2>&1 | tee -a $PROJECT_DIR/backups/backup.log"
fi

# Create the cron entry
CRON_ENTRY="$CRON_SCHEDULE $BACKUP_CMD"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo -e "  Schedule: ${DESCRIPTION}"
echo -e "  Command: npm run backup$([ "$ENABLE_ROTATION" = true ] && echo ':auto' || echo '')"
echo -e "  Rotation: $([ "$ENABLE_ROTATION" = true ] && echo 'Enabled (30 days)' || echo 'Disabled')"
echo -e "  Log file: $PROJECT_DIR/backups/backup.log"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

read -p "Proceed with installation? (y/n): " confirm

if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo -e "\n${YELLOW}Setup cancelled${NC}"
    exit 0
fi

# Install the cron job
(crontab -l 2>/dev/null | grep -v "npm run backup"; echo "$CRON_ENTRY") | crontab -

echo -e "\n${GREEN}✅ Automated backup installed successfully!${NC}\n"
echo -e "${BLUE}Next steps:${NC}"
echo "1. Verify cron job: crontab -l"
echo "2. Monitor logs: tail -f $PROJECT_DIR/backups/backup.log"
echo "3. Test backup: npm run backup"
echo ""
echo -e "${YELLOW}To remove automated backups:${NC}"
echo "  crontab -e"
echo "  (Remove the backup line and save)"
echo ""
