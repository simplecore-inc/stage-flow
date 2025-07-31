#!/usr/bin/env node

/**
 * Bundle size analysis script
 * Analyzes the size of built packages and provides optimization insights
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');
const PACKAGES = ['core', 'react', 'plugins', 'testing'];

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Analyze bundle sizes for a package
 */
function analyzePackage(packageName) {
  const packageDir = path.join(PACKAGES_DIR, packageName);
  const distDir = path.join(packageDir, 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.log(`[ERROR] ${packageName}: No dist directory found`);
    return null;
  }

  const files = {
    esm: path.join(distDir, 'index.esm.js'),
    cjs: path.join(distDir, 'index.js'),
    umd: path.join(distDir, 'index.umd.js'),
    types: path.join(distDir, 'index.d.ts')
  };

  const sizes = {};
  let totalSize = 0;

  for (const [format, filePath] of Object.entries(files)) {
    const size = getFileSize(filePath);
    sizes[format] = size;
    if (format !== 'types') {
      totalSize += size;
    }
  }

  return {
    name: packageName,
    sizes,
    totalSize,
    files
  };
}

/**
 * Main analysis function
 */
function analyzeBundles() {
  console.log('Bundle Size Analysis');
  console.log('=' .repeat(60));

  const results = [];
  let grandTotal = 0;

  for (const packageName of PACKAGES) {
    const analysis = analyzePackage(packageName);
    if (analysis) {
      results.push(analysis);
      grandTotal += analysis.totalSize;
    }
  }

  // Display results
  for (const result of results) {
    console.log(`\nPackage: @stage-flow/${result.name}`);
    console.log('-'.repeat(40));
    console.log(`ESM:   ${formatBytes(result.sizes.esm).padStart(8)}`);
    console.log(`CJS:   ${formatBytes(result.sizes.cjs).padStart(8)}`);
    console.log(`UMD:   ${formatBytes(result.sizes.umd).padStart(8)}`);
    console.log(`Types: ${formatBytes(result.sizes.types).padStart(8)}`);
    console.log(`Total: ${formatBytes(result.totalSize).padStart(8)} (JS only)`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total Bundle Size: ${formatBytes(grandTotal)}`);

  // Recommendations
  console.log('\nOptimization Recommendations:');
  
  for (const result of results) {
    const largestFormat = Object.entries(result.sizes)
      .filter(([format]) => format !== 'types')
      .sort(([,a], [,b]) => b - a)[0];
    
    if (largestFormat[1] > 50000) { // > 50KB
      console.log(`[WARNING] ${result.name}: ${largestFormat[0].toUpperCase()} bundle is ${formatBytes(largestFormat[1])} - consider code splitting`);
    }
    
    if (result.totalSize > 100000) { // > 100KB total
      console.log(`[WARNING] ${result.name}: Total size is ${formatBytes(result.totalSize)} - review dependencies and tree-shaking`);
    }
  }

  // Tree-shaking check
  console.log('\nTree-shaking Analysis:');
  for (const result of results) {
    const esmSize = result.sizes.esm;
    const cjsSize = result.sizes.cjs;
    const difference = Math.abs(esmSize - cjsSize);
    const percentDiff = ((difference / Math.max(esmSize, cjsSize)) * 100).toFixed(1);
    
    if (percentDiff > 10) {
      console.log(`[WARNING] ${result.name}: ESM/CJS size difference is ${percentDiff}% - check tree-shaking effectiveness`);
    } else {
      console.log(`[OK] ${result.name}: Good tree-shaking (${percentDiff}% difference)`);
    }
  }

  console.log('\nBundle Size Targets:');
  console.log('• Core library: < 50KB (currently ' + formatBytes(results.find(r => r.name === 'core')?.totalSize || 0) + ')');
  console.log('• React integration: < 30KB (currently ' + formatBytes(results.find(r => r.name === 'react')?.totalSize || 0) + ')');
  console.log('• Plugins: < 20KB (currently ' + formatBytes(results.find(r => r.name === 'plugins')?.totalSize || 0) + ')');
  console.log('• Testing utilities: < 25KB (currently ' + formatBytes(results.find(r => r.name === 'testing')?.totalSize || 0) + ')');
}

// Run analysis
analyzeBundles();