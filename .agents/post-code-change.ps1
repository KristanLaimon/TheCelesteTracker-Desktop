# Post Code Change Verification Hook (PowerShell)
# Runs the mandatory post-change verification workflow from CLAUDE.md

$ErrorActionPreference = "Stop"

Write-Host "=== Step 1/4: Running bun test ===" -ForegroundColor Cyan
bun test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== Step 2/4: Running bun run check ===" -ForegroundColor Cyan
bun run check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== Step 3/4: Running bun run lint:fix ===" -ForegroundColor Cyan
bun run lint:fix
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== Step 4/4: Verifying bun run check after lint:fix ===" -ForegroundColor Cyan
bun run check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== Post-Code-Change Verification Succeeded! ===" -ForegroundColor Green
