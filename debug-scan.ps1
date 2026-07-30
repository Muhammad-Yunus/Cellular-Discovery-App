$ErrorActionPreference = "Continue"
$apiBase = "http://192.168.1.108:8000/api/v1"
$body = '{"operator":"TestOp","mcc":"310","mnc":"1","rat":"LTE","latitude":-6.15,"longitude":106.9}'

# Get current scans count
Write-Host "=== GET /scans ==="
$prev = (iwr "$apiBase/scans" -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json
Write-Host "Total before: $($prev.total)"

# Try POST /scan
Write-Host "=== POST /scan ==="
try {
    $start = Get-Date
    $resp = iwr "$apiBase/scan" -Method Post -Body $body -UseBasicParsing -ContentType "application/json" -TimeoutSec 60
    $dur = (Get-Date) - $start
    Write-Host "Status: $($resp.StatusCode)"
    Write-Host "Time: $($dur.TotalSeconds)s"
    Write-Host "Body: $($resp.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

# Get scans again
Write-Host "=== GET /scans after POST ==="
$after = (iwr "$apiBase/scans" -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json
Write-Host "Total after: $($after.total)"
Write-Host "Items count: $($after.items.Count)"
