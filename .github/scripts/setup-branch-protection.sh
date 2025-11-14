#!/bin/bash

# Script to set up branch protection for the main branch
# Requires: GitHub CLI (gh) to be installed and authenticated

set -e

REPO_OWNER=$(gh repo view --json owner -q .owner.login)
REPO_NAME=$(gh repo view --json name -q .name)

echo "Setting up branch protection for $REPO_OWNER/$REPO_NAME..."

# Configure branch protection
gh api repos/$REPO_OWNER/$REPO_NAME/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":[]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismissal_restrictions":{},"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field lock_branch=false

echo "✅ Branch protection configured successfully!"
echo ""
echo "Main branch is now protected with:"
echo "  - Force pushes: DISABLED"
echo "  - Deletions: DISABLED"

