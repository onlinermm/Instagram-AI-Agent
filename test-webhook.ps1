$url = "https://mm90t4ucv092c7xlv01phwzrrqmbkdqd.3dapartment.com/webhook-test/3186e8ae-2470-4736-8827-679f3a3aae3e"
$body = @{
    test = "data"
    timestamp = "2025-05-28T10:17:00.000Z"
    profileUrl = "https://www.instagram.com/test/"
    message = "Testing webhook functionality"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Webhook test successful!" -ForegroundColor Green
    Write-Host "Response: $response" -ForegroundColor Green
} catch {
    Write-Host "❌ Webhook test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
} 