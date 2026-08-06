# Start Nuxt dev server in a hidden process with proper working directory
Write-Host "Starting Nuxt dev server..."
$proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c pnpm dev" -WindowStyle Hidden -PassThru -WorkingDirectory "C:/D/DOCUMENT_BCK/GitHub/Cellular-Discovery-App"
Write-Host "Dev server started with PID $($proc.Id)"

# Wait for the dev server to be ready (poll port 3000)
Write-Host "Waiting for Nuxt dev server to be ready..."
while ((Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue).TcpTestSucceeded -eq $false) {
    Start-Sleep -Seconds 5
}
Write-Host "Nuxt dev server is ready."

# Run the e2e tests for the History page
Write-Host "Running e2e tests for History page..."
pnpm test:e2e tests/e2e/history.spec.ts

# Stop the dev server after tests
Write-Host "Stopping dev server..."
Stop-Process -Id $proc.Id -Force
Write-Host "Done.\n"