# Start Nuxt dev server in background
$proc = Start-Process pnpm dev -NoNewWindow -PassThru
Write-Host "Dev server PID: $($proc.Id)"

# Wait for Nuxt to be ready (30 secs)
Write-Host "Waiting for Nuxt server..."
Start-Sleep -Seconds 30

# Run Playwright test with trace disabled
Write-Host "Running Playwright test..."
pnpm test:e2e tests/e2e/debug-scan-click.spec.ts

# Kill dev process after test
Write-Host "Stopping dev server..."
$proc | Stop-Process -Force