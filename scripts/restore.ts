#!/usr/bin/env tsx

/**
 * Restore Utility for BookedSolid AI
 *
 * This script restores the application from a backup:
 * 1. Lists available backups
 * 2. Restores database from backup
 * 3. Optionally restores configuration files
 *
 * Usage:
 *   npm run restore              # Interactive: lists backups and prompts
 *   npm run restore <backup-id>  # Restore specific backup
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, copyFileSync } from 'fs';
import { join } from 'path';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

interface BackupManifest {
  timestamp: string;
  date: string;
  backupId: string;
  components: {
    database: { completed: boolean; files: string[] };
    code: { completed: boolean; files: string[] };
    config: { completed: boolean; files: string[] };
  };
  gitInfo?: {
    branch: string;
    commit: string;
  };
}

function printHeader(text: string) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  ${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

function printSuccess(text: string) {
  console.log(`${colors.green}✅ ${text}${colors.reset}`);
}

function printError(text: string) {
  console.log(`${colors.red}❌ ${text}${colors.reset}`);
}

function printInfo(text: string) {
  console.log(`${colors.cyan}ℹ️  ${text}${colors.reset}`);
}

function printWarning(text: string) {
  console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`);
}

function listBackups(): BackupManifest[] {
  const manifestDir = './backups/manifests';

  if (!existsSync(manifestDir)) {
    printError('No backups found. Run "npm run backup" to create a backup first.');
    process.exit(1);
  }

  const manifestFiles = readdirSync(manifestDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .reverse();

  if (manifestFiles.length === 0) {
    printError('No backups found. Run "npm run backup" to create a backup first.');
    process.exit(1);
  }

  const manifests: BackupManifest[] = manifestFiles.map((file) => {
    const content = readFileSync(join(manifestDir, file), 'utf-8');
    return JSON.parse(content) as BackupManifest;
  });

  return manifests;
}

function displayBackups(backups: BackupManifest[]) {
  printHeader('📦 Available Backups');

  backups.forEach((backup, index) => {
    console.log(`${colors.bright}${index + 1}. ${backup.backupId}${colors.reset}`);
    console.log(`   Date: ${backup.date}`);
    console.log(`   Database: ${backup.components.database.completed ? '✅' : '❌'}`);
    console.log(`   Code: ${backup.components.code.completed ? '✅' : '❌'}`);
    console.log(`   Config: ${backup.components.config.completed ? '✅' : '❌'}`);
    if (backup.gitInfo) {
      console.log(`   Git: ${backup.gitInfo.branch} (${backup.gitInfo.commit.slice(0, 8)})`);
    }
    console.log('');
  });
}

function restoreDatabase(manifest: BackupManifest): boolean {
  printInfo('Restoring database...');

  if (!manifest.components.database.completed || manifest.components.database.files.length === 0) {
    printError('No database backup found in this backup.');
    return false;
  }

  // Find the database backup file
  const dbBackupFile = manifest.components.database.files.find((file) => file.includes('db_backup_'));

  if (!dbBackupFile || !existsSync(dbBackupFile)) {
    printError(`Database backup file not found: ${dbBackupFile}`);
    return false;
  }

  try {
    // Create a backup of the current database first
    if (existsSync('prisma/dev.db')) {
      const currentBackup = `prisma/dev.db.pre-restore-${Date.now()}.backup`;
      copyFileSync('prisma/dev.db', currentBackup);
      printInfo(`Current database backed up to: ${currentBackup}`);
    }

    // Restore the database
    copyFileSync(dbBackupFile, 'prisma/dev.db');
    printSuccess('Database restored successfully!');
    return true;
  } catch (error) {
    printError(`Failed to restore database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

function restoreConfig(manifest: BackupManifest): boolean {
  printWarning('Config restore is interactive to prevent accidental overwrites.');
  printInfo('Skipping automatic config restore. Restore manually if needed from:');
  console.log(`   ${manifest.components.config.files.join('\n   ')}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const backupId = args[0];

  printHeader('🔄 BookedSolid AI - Restore System');

  const backups = listBackups();

  if (!backupId) {
    displayBackups(backups);
    console.log(`${colors.yellow}Usage: npm run restore <backup-id>${colors.reset}`);
    console.log(`${colors.yellow}Example: npm run restore ${backups[0].backupId}${colors.reset}\n`);
    process.exit(0);
  }

  // Find the backup
  const backup = backups.find((b) => b.backupId === backupId);

  if (!backup) {
    printError(`Backup not found: ${backupId}`);
    console.log('\nAvailable backups:');
    displayBackups(backups);
    process.exit(1);
  }

  printInfo(`Restoring backup: ${backup.backupId}`);
  printInfo(`Created: ${backup.date}`);

  printWarning('\n⚠️  THIS WILL REPLACE YOUR CURRENT DATABASE!');
  printWarning('Make sure you have a recent backup before proceeding.\n');

  // Restore database
  const dbSuccess = restoreDatabase(backup);

  if (!dbSuccess) {
    printError('Database restore failed. Aborting.');
    process.exit(1);
  }

  // Config restore (informational only)
  restoreConfig(backup);

  // Summary
  printHeader('📊 Restore Summary');
  console.log(`Backup ID: ${backup.backupId}`);
  console.log(`Database: ${dbSuccess ? '✅' : '❌'}`);
  console.log(`Config: ℹ️  Manual restore required\n`);

  printSuccess('🎉 Restore completed successfully!');
  printInfo('Run "npm run db:generate" to update Prisma client if needed.');
  printInfo('Run "npm run dev" to start the application.\n');
}

main().catch((error) => {
  printError(`Restore failed: ${error.message}`);
  process.exit(1);
});
