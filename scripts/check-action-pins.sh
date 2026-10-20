#!/bin/sh
# Fails if any GitHub Action in .github/workflows/ is not pinned to a full commit SHA.
# Local actions (uses: ./...) and Docker images (uses: docker://...) are exempt.
# See docs/specs/01-repository-and-workspaces.md (R-4).
set -eu

unpinned=$(grep -RnE '^[[:space:]-]*uses:' .github/workflows/ \
    | grep -vE 'uses:[[:space:]]*["'\'']?(\./|docker://)' \
    | grep -vE 'uses:[[:space:]]*["'\'']?[^@[:space:]]+@[0-9a-f]{40}([[:space:]"'\'']|$)' \
    || true)

if [ -n "$unpinned" ]; then
    echo "These actions must be pinned to a full 40-character commit SHA (add the version in a comment):"
    echo "$unpinned"
    exit 1
fi

echo "All actions are pinned by commit SHA."
