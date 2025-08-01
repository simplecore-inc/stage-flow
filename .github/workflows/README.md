# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the Stage Flow project.

## Workflow Overview

### 1. CI (`ci.yml`)
**Purpose**: Continuous Integration - Automated testing and building on code changes

**Triggers**:
- Push to `main` branch
- Pull requests to `main` branch

**Actions**:
- Type checking
- Linting
- Running tests
- Building packages

**Matrix**: Node.js 18.x and 20.x

**Note**: Skips execution for release commits (containing "Release version")

**Manual Execution**: ❌ (Automatic only)

---

### 2. Release (`release.yml`)
**Purpose**: Create a new release version and Git tag

**Triggers**:
- Manual dispatch (`workflow_dispatch`)

**Inputs**:
- `version` (required): Version to release (e.g., "0.0.3")

**Actions**:
1. Update version in root `package.json`
2. Update all package versions using `npm run version:update`
3. Run tests
4. Build packages
5. Create Git commit and tag
6. Push to main branch and tag

**Manual Execution**: ✅ (GitHub Actions UI)

**Example**:
```bash
# In GitHub Actions UI:
# 1. Go to Actions tab
# 2. Select "Release" workflow
# 3. Click "Run workflow"
# 4. Enter version: 0.0.3
# 5. Click "Run workflow"
```

---

### 3. NPM Publish (`npm-publish.yml`)
**Purpose**: Publish packages to npm registry

**Triggers**:
- Manual dispatch (`workflow_dispatch`)

**Inputs**:
- `tag` (required): Git tag to publish (e.g., "v0.0.3")

**Actions**:
1. Checkout repository with full history
2. Fetch all tags from remote
3. Verify tag exists
4. Checkout the specified Git tag
5. Run tests
6. Build packages
7. Login to npm registry
8. Publish to npm registry

**Manual Execution**: ✅ (GitHub Actions UI)

**Prerequisites**:
- Git tag must exist (created by Release workflow)
- NPM_TOKEN secret must be configured

**Important**: Tag format must be `v{version}` (e.g., "v0.0.3")

**Example**:
```bash
# In GitHub Actions UI:
# 1. Go to Actions tab
# 2. Select "Publish to npm" workflow
# 3. Click "Run workflow"
# 4. Enter tag: v0.0.3
# 5. Click "Run workflow"
```

---

### 4. Documentation Deploy (`docs-deploy.yml`)
**Purpose**: Deploy documentation to GitHub Pages

**Triggers**:
- Manual dispatch (`workflow_dispatch`)

**Actions**:
1. Build packages
2. Build website
3. Deploy to GitHub Pages

**Manual Execution**: ✅ (GitHub Actions UI)

**Prerequisites**:
- GitHub Pages must be enabled for the repository

**Example**:
```bash
# In GitHub Actions UI:
# 1. Go to Actions tab
# 2. Select "Deploy Documentation" workflow
# 3. Click "Run workflow"
```

---

## Typical Release Process

### Step 1: Create Release
1. Go to GitHub Actions → Release workflow
2. Enter version (e.g., "0.0.3")
3. Run workflow
4. This creates a Git tag `v0.0.3`

### Step 2: Publish to npm (Optional)
1. Go to GitHub Actions → Publish to npm workflow
2. Enter tag (e.g., "v0.0.3")
3. Run workflow
4. Packages are published to npm registry

### Step 3: Deploy Documentation (Optional)
1. Go to GitHub Actions → Deploy Documentation workflow
2. Run workflow
3. Documentation is deployed to GitHub Pages

---

## Workflow Dependencies

```
CI (ci.yml)
├── Runs on: push/PR to main
└── Excludes: release commits

Release (release.yml)
├── Creates: Git tag
└── Triggers: Manual

NPM Publish (npm-publish.yml)
├── Requires: Git tag (from Release)
└── Publishes: npm packages

Docs Deploy (docs-deploy.yml)
├── Independent: Can run anytime
└── Deploys: GitHub Pages
```

---

## Configuration

### Required Secrets
- `NPM_TOKEN`: npm registry authentication token

**How to set up NPM_TOKEN**:
1. Go to npmjs.com and log in
2. Go to your profile → Access Tokens
3. Create a new token with "Automation" type
4. Copy the token
5. Go to GitHub repository → Settings → Secrets and variables → Actions
6. Create new secret named `NPM_TOKEN`
7. Paste the npm token value

### Required Permissions
- `id-token: write`: For GitHub Pages deployment
- `pages: write`: For GitHub Pages deployment
- `contents: read`: For repository access

---

## Troubleshooting

### Common Issues

1. **NPM Publish fails with authentication error**
   - Check if NPM_TOKEN secret is configured in GitHub repository settings
   - Verify the token has "Automation" type and publish permissions
   - Ensure the token is not expired
   - Check if the package name is available on npm

2. **NPM Publish fails with tag not found**
   - Check if Git tag exists: `git tag`
   - Ensure tag format is correct: `v{version}` (e.g., "v0.0.3")
   - Verify tag was created by Release workflow
   - Check tag name spelling
   - Ensure tag was pushed to remote: `git push origin v0.0.3`

3. **NPM Publish fails**
   - Check if Git tag exists
   - Verify NPM_TOKEN secret is configured
   - Ensure package.json version matches tag

4. **Documentation deploy fails**
   - Check if GitHub Pages is enabled
   - Verify repository permissions
   - Check website build logs

5. **Release workflow fails**
   - Ensure version format is correct (e.g., "0.0.3")
   - Check if all tests pass
   - Verify Git permissions

### Debugging
- Check workflow logs in GitHub Actions tab
- Verify input parameters are correct
- Ensure all prerequisites are met
- Check available tags: `git tag`
- Check remote tags: `git ls-remote --tags origin`
- Verify npm token permissions: https://www.npmjs.com/package/@stage-flow/core 