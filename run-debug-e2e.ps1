# Run dev server on port 3000 and debug test
Set-Location C:\D\DOCUMENT_BCK\GitHub\Cellular-Discovery-App

# Start Nuxt dev server in background (unlimited output)
$devProc = Start-Process pnpm dev -NoNewWindow -PassThru

# Wait for Nuxt to be ready (~45 seconds)
Write-Host "Waiting for Nuxt dev server..."
Start-Sleep -Seconds 45

# Run Playwright debug test
Write-Host "Running Playwright debug test..."
pnpm test:e2e --debug tests\e2e\debug-scan-click.spec.ts

# Optionally kill dev process after test
Write-Host "Killing dev server..."
$devProc | Stop-Process -Force
