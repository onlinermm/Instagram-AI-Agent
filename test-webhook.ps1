# Test webhook for Instagram AI Agent
$url = "http://localhost:3000/webhook"

# Test with single profile and interaction controls
$singleProfileBody = @{
    profileUrl = "https://www.instagram.com/test_profile/"
    username = "test_profile"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    message = "Testing single profile webhook with interaction controls"
    # New interaction control parameters
    enableLiking = $true
    enableCommenting = $false
    enableScreenshots = $false
    enableContentFiltering = $true
} | ConvertTo-Json

# Test with multiple profiles and custom settings
$multipleProfilesBody = @{
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    message = "Testing multiple profiles webhook with custom interaction settings"
    profiles = @(
        "https://www.instagram.com/profile1/",
        "https://www.instagram.com/profile2/",
        "https://www.instagram.com/profile3/"
    )
    # Custom interaction settings
    enableLiking = $false
    enableCommenting = $true
    enableScreenshots = $true
    enableContentFiltering = $false
} | ConvertTo-Json

# Test with only liking enabled
$likingOnlyBody = @{
    profileUrl = "https://www.instagram.com/test_profile/"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    message = "Testing with only liking enabled"
    enableLiking = $true
    enableCommenting = $false
    enableScreenshots = $false
    enableContentFiltering = $false
} | ConvertTo-Json

Write-Host "Testing Instagram AI Agent Webhook with Interaction Controls" -ForegroundColor Cyan

# Test 1: Single profile with interaction controls
Write-Host "`n=== Test 1: Single Profile with Interaction Controls ===" -ForegroundColor Yellow
Write-Host "Settings: Liking=ON, Commenting=OFF, Screenshots=OFF, ContentFiltering=ON" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $singleProfileBody -ContentType "application/json"
    Write-Host "✅ Single profile test successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Single profile test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Wait a bit between tests
Start-Sleep -Seconds 2

# Test 2: Multiple profiles with custom settings
Write-Host "`n=== Test 2: Multiple Profiles with Custom Settings ===" -ForegroundColor Yellow
Write-Host "Settings: Liking=OFF, Commenting=ON, Screenshots=ON, ContentFiltering=OFF" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $multipleProfilesBody -ContentType "application/json"
    Write-Host "✅ Multiple profiles test successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Multiple profiles test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Wait a bit between tests
Start-Sleep -Seconds 2

# Test 3: Only liking enabled
Write-Host "`n=== Test 3: Only Liking Enabled ===" -ForegroundColor Yellow
Write-Host "Settings: Liking=ON, All others=OFF" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $likingOnlyBody -ContentType "application/json"
    Write-Host "✅ Liking only test successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Liking only test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test status endpoint
Write-Host "`n=== Test 4: Status Endpoint ===" -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "http://localhost:3000/status" -Method GET
    Write-Host "✅ Status endpoint test successful!" -ForegroundColor Green
    Write-Host "Status: $($statusResponse | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Status endpoint test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Interaction Control Parameters Information ===" -ForegroundColor Magenta
Write-Host "📋 Available parameters for webhook control:" -ForegroundColor White
Write-Host "  • enableLiking (true/false)          - Controls whether to like posts" -ForegroundColor Gray
Write-Host "  • enableCommenting (true/false)      - Controls whether to comment on posts" -ForegroundColor Gray
Write-Host "  • enableScreenshots (true/false)     - Controls whether to take screenshots" -ForegroundColor Gray
Write-Host "  • enableContentFiltering (true/false)- Controls whether to filter content by relevance" -ForegroundColor Gray
Write-Host "`n📝 Example webhook payload:" -ForegroundColor White
Write-Host @"
{
  "profileUrl": "https://www.instagram.com/username/",
  "enableLiking": true,
  "enableCommenting": false,
  "enableScreenshots": true,
  "enableContentFiltering": true
}
"@ -ForegroundColor Gray 