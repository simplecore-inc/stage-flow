#!/bin/bash

# Stage Flow Deployment Script

set -e

echo "Starting Stage Flow deployment..."

# Check version
echo "Checking current version..."
VERSION=$(node -p "require('./package.json').version")
echo "Current version: $VERSION"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Type check
echo "Running type check..."
npm run type-check

# Linting
echo "Running linting..."
npm run lint

# Tests
echo "Running tests..."
npm run test

# Build
echo "Building packages..."
npm run build:prod

# Deploy each package
echo "Publishing to NPM..."

cd packages/core
npm publish --access public
echo "Published @stage-flow/core"

cd ../react
npm publish --access public
echo "Published @stage-flow/react"

cd ../plugins
npm publish --access public
echo "Published @stage-flow/plugins"

cd ../testing
npm publish --access public
echo "Published @stage-flow/testing"

cd ../..

echo "All packages published successfully!"
echo "Documentation: https://stage-flow.dev"
echo "NPM packages: https://www.npmjs.com/org/stage-flow" 