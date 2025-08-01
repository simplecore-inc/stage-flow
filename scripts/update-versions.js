#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get root package.json version
const rootPackagePath = path.join(__dirname, '..', 'package.json');
const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
const rootVersion = rootPackage.version;

console.log(`Updating all packages to version: ${rootVersion}`);

// Packages to update
const packages = [
  'packages/core',
  'packages/react', 
  'packages/plugins',
  'packages/testing'
];

// Update each package
packages.forEach(packageDir => {
  const packagePath = path.join(__dirname, '..', packageDir, 'package.json');
  
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const oldVersion = packageJson.version;
    
    // Update version
    packageJson.version = rootVersion;
    
    // Update dependencies to other @stage-flow packages
    if (packageJson.dependencies) {
      Object.keys(packageJson.dependencies).forEach(dep => {
        if (dep.startsWith('@stage-flow/')) {
          packageJson.dependencies[dep] = `^${rootVersion}`;
        }
      });
    }
    
    // Update peerDependencies to other @stage-flow packages
    if (packageJson.peerDependencies) {
      Object.keys(packageJson.peerDependencies).forEach(dep => {
        if (dep.startsWith('@stage-flow/')) {
          packageJson.peerDependencies[dep] = `^${rootVersion}`;
        }
      });
    }
    
    // Write updated package.json
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`✅ Updated ${packageDir}: ${oldVersion} → ${rootVersion}`);
  } else {
    console.log(`⚠️  Package not found: ${packageDir}`);
  }
});

// Update website package.json if it has @stage-flow dependencies
const websitePackagePath = path.join(__dirname, '..', 'website', 'package.json');
if (fs.existsSync(websitePackagePath)) {
  const websitePackage = JSON.parse(fs.readFileSync(websitePackagePath, 'utf8'));
  let updated = false;
  
  if (websitePackage.dependencies) {
    Object.keys(websitePackage.dependencies).forEach(dep => {
      if (dep.startsWith('@stage-flow/')) {
        websitePackage.dependencies[dep] = `^${rootVersion}`;
        updated = true;
      }
    });
  }
  
  if (updated) {
    fs.writeFileSync(websitePackagePath, JSON.stringify(websitePackage, null, 2) + '\n');
    console.log(`✅ Updated website dependencies to version: ${rootVersion}`);
  }
}

console.log('\n🎉 All packages updated successfully!');
console.log(`\nTo release, run: npm run release`);
console.log(`Or manually: npm run build:prod && npm run test && npm run publish:all`); 