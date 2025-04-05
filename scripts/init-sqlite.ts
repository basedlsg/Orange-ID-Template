/**
 * This script is a simple wrapper around the main setup.ts script
 * for backward compatibility with older documentation.
 * 
 * It ensures that SQLite mode is activated and then runs the setup script.
 */

import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

// Ensure the .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, 'USE_SQLITE=true\n');
} else {
  // Check if USE_SQLITE is in the .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('USE_SQLITE=true')) {
    fs.appendFileSync(envPath, '\nUSE_SQLITE=true\n');
  }
}

console.log(chalk.blue('ℹ Setting SQLite mode and running the unified setup script...'));

// Run the main setup script
try {
  execSync('npx tsx scripts/setup.ts', { stdio: 'inherit' });
} catch (error) {
  console.error(chalk.red('✗ Failed to run the setup script:'), error);
  process.exit(1);
}
