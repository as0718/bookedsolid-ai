#!/usr/bin/env tsx

/**
 * Automated Backup with Rotation for BookedSolid AI
 *
 * This script:
 * 1. Runs the full backup process
 * 2. Rotates old backups (deletes backups older than 30 days)
 * 3. Logs results to backup.log
 */

import { execSync } from 'child_process';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

const LOG_FILE = './backups/backup.log';

function log(message: string, toFile = true) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);

  if (toFile) {
    try {
      // Ensure backups directory exists
      if (!existsSync('./backups')) {
        mkdirSync('./backups', { recursive: true });
      }
      appendFileSync(LOG_FILE, logMessage + '\n');
    } catch (error) {
      console.error(`Failed to write to log file: ${error}`);
    }
  }
}

function printHeader(text: string) {
  const line = '='.repeat(60);
  console.log(`\n${colors.bright}${colors.blue}${line}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  ${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${line}${colors.reset}\n`);
}

async function runBackup(): Promise<boolean> {
  try {
    log('Starting automated backup...');

    // Run the main backup script
    execSync('tsx scripts/backup.ts', { stdio: 'inherit' });

    log('Backup completed successfully');
    return true;
  } catch (error) {
    log(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    return false;
  }
}

async function runRotation(): Promise<boolean> {
  try {
    log('Starting backup rotation (30 days retention)...');

    // Run the rotation script
    const output = execSync('bash scripts/rotate-backups.sh 30', { encoding: 'utf-8' });

    // Log rotation output
    const lines = output.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      // Strip ANSI color codes for log file
      const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
      if (cleanLine.trim()) {
        log(cleanLine, true);
      }
    });

    log('Backup rotation completed');
    return true;
  } catch (error) {
    log(`Rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    return false;
  }
}

async function main() {
  printHeader('🤖 Automated Backup with Rotation');

  log('='.repeat(60), true);
  log('Automated backup process started', true);
  log('='.repeat(60), true);

  // Run backup
  const backupSuccess = await runBackup();

  if (!backupSuccess) {
    log('ERROR: Backup failed. Skipping rotation.', true);
    process.exit(1);
  }

  // Run rotation
  const rotationSuccess = await runRotation();

  // Summary
  log('='.repeat(60), true);
  log(`Backup: ${backupSuccess ? 'SUCCESS' : 'FAILED'}`, true);
  log(`Rotation: ${rotationSuccess ? 'SUCCESS' : 'FAILED'}`, true);
  log('='.repeat(60), true);

  if (backupSuccess && rotationSuccess) {
    console.log(`\n${colors.green}✅ Automated backup completed successfully${colors.reset}`);
    console.log(`${colors.blue}Log file: ${LOG_FILE}${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}❌ Automated backup completed with errors${colors.reset}`);
    console.log(`${colors.yellow}Check log file: ${LOG_FILE}${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch((error) => {
  log(`FATAL ERROR: ${error.message}`, true);
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
