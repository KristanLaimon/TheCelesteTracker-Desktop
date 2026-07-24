#!/usr/bin/env bash
# Post Code Change Verification Hook (Bash/Sh)
# Runs the mandatory post-change verification workflow from CLAUDE.md

set -e

echo "=== Step 1/4: Running bun test ==="
bun test

echo "=== Step 2/4: Running bun run check ==="
bun run check

echo "=== Step 3/4: Running bun run lint:fix ==="
bun run lint:fix

echo "=== Step 4/4: Verifying bun run check after lint:fix ==="
bun run check

echo "=== Post-Code-Change Verification Succeeded! ==="
