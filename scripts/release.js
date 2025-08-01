#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting release process...\n');

try {
  // Step 1: Update versions
  console.log('📦 Step 1: Updating package versions...');
  execSync('npm run version:update', { stdio: 'inherit' });
  console.log('✅ Versions updated successfully\n');

  // Step 2: Build for production
  console.log('🔨 Step 2: Building packages for production...');
  execSync('npm run build:prod', { stdio: 'inherit' });
  console.log('✅ Build completed successfully\n');

  // Step 3: Run tests
  console.log('🧪 Step 3: Running tests...');
  execSync('npm run test', { stdio: 'inherit' });
  console.log('✅ All tests passed\n');

  // Step 4: Publish packages
  console.log('📤 Step 4: Publishing packages to npm...');
  execSync('npm run publish:all', { stdio: 'inherit' });
  console.log('✅ Packages published successfully\n');

  console.log('🎉 Release completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Create a git tag: git tag v0.0.2');
  console.log('2. Push the tag: git push origin v0.0.2');
  console.log('3. Create a GitHub release');
  console.log('4. Deploy documentation: git push origin main');

} catch (error) {
  console.error('\n❌ Release failed:', error.message);
  console.error('\nPlease fix the issue and try again.');
  process.exit(1);
} 