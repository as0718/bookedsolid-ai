#!/usr/bin/env tsx

/**
 * Comprehensive Backup System for BookedSolid AI
 *
 * This script orchestrates the complete backup process:
 * 1. Database backup (SQLite + Prisma schema + migrations)
 * 2. Code backup (source files, excluding build artifacts)
 * 3. Config backup (environment files, package.json, etc.)
 * 4. Creates a backup manifest with metadata
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
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

interface BackupManifest {
  timestamp: string;
  date: string;
  backupId: string;
  components: {
    database: {
      completed: boolean;
      files: string[];
      error?: string;
    };
    code: {
      completed: boolean;
      files: string[];
      error?: string;
    };
    config: {
      completed: boolean;
      files: string[];
      error?: string;
    };
  };
  gitInfo?: {
    branch: string;
    commit: string;
    status: string;
  };
  metadata: {
    nodeVersion: string;
    platform: string;
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
  console.log(`${colors.yellow}ℹ️  ${text}${colors.reset}`);
}

function runScript(scriptPath: string, name: string): { success: boolean; output: string } {
  try {
    console.log(`\n${colors.yellow}Running ${name}...${colors.reset}`);
    const output = execSync(`bash ${scriptPath}`, { encoding: 'utf-8' });
    printSuccess(`${name} completed`);
    return { success: true, output };
  } catch (error) {
    printError(`${name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, output: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function getGitInfo(): BackupManifest['gitInfo'] {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const status = execSync('git status --short', { encoding: 'utf-8' }).trim();
    return { branch, commit, status };
  } catch {
    return undefined;
  }
}

async function main() {
  printHeader('🚀 BookedSolid AI - Comprehensive Backup System');

  const timestamp = new Date().toISOString();
  const backupId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  printInfo(`Backup ID: ${backupId}`);
  printInfo(`Timestamp: ${timestamp}`);

  const manifest: BackupManifest = {
    timestamp,
    date: new Date().toLocaleString(),
    backupId,
    components: {
      database: { completed: false, files: [] },
      code: { completed: false, files: [] },
      config: { completed: false, files: [] },
    },
    gitInfo: getGitInfo(),
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
    },
  };

  // 1. Database Backup
  const dbBackup = runScript('./scripts/backup-database.sh', 'Database Backup');
  manifest.components.database.completed = dbBackup.success;
  if (dbBackup.success) {
    // Parse output to extract file paths
    const dbFiles = dbBackup.output.match(/backups\/databases\/[^\s]+/g) || [];
    manifest.components.database.files = dbFiles;
  } else {
    manifest.components.database.error = dbBackup.output;
  }

  // 2. Code Backup
  const codeBackup = runScript('./scripts/backup-code.sh', 'Code Backup');
  manifest.components.code.completed = codeBackup.success;
  if (codeBackup.success) {
    const codeFiles = codeBackup.output.match(/backups\/code\/[^\s]+/g) || [];
    manifest.components.code.files = codeFiles;
  } else {
    manifest.components.code.error = codeBackup.output;
  }

  // 3. Config Backup
  const configBackup = runScript('./scripts/backup-config.sh', 'Config Backup');
  manifest.components.config.completed = configBackup.success;
  if (configBackup.success) {
    const configFiles = configBackup.output.match(/backups\/configs\/[^\s]+/g) || [];
    manifest.components.config.files = configFiles;
  } else {
    manifest.components.config.error = configBackup.output;
  }

  // 4. Create Manifest
  printInfo('Creating backup manifest...');
  const manifestDir = './backups/manifests';
  const manifestPath = join(manifestDir, `backup_${backupId}.json`);

  if (!existsSync(manifestDir)) {
    execSync(`mkdir -p ${manifestDir}`);
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  printSuccess(`Manifest created: ${manifestPath}`);

  // Summary
  printHeader('📊 Backup Summary');

  const allSuccess = manifest.components.database.completed &&
                     manifest.components.code.completed &&
                     manifest.components.config.completed;

  console.log(`Database: ${manifest.components.database.completed ? '✅' : '❌'}`);
  console.log(`Code: ${manifest.components.code.completed ? '✅' : '❌'}`);
  console.log(`Config: ${manifest.components.config.completed ? '✅' : '❌'}`);

  if (manifest.gitInfo) {
    console.log(`\nGit Info:`);
    console.log(`  Branch: ${manifest.gitInfo.branch}`);
    console.log(`  Commit: ${manifest.gitInfo.commit.slice(0, 8)}`);
  }

  console.log(`\nManifest: ${manifestPath}`);

  if (allSuccess) {
    printSuccess('\n🎉 Full backup completed successfully!');
    console.log(`\n${colors.bright}Backup ID: ${backupId}${colors.reset}`);
    console.log(`${colors.bright}Location: ./backups/${colors.reset}\n`);
  } else {
    printError('\n⚠️  Backup completed with errors. Check the manifest for details.');
    process.exit(1);
  }
}

main().catch((error) => {
  printError(`Backup failed: ${error.message}`);
  process.exit(1);
});
