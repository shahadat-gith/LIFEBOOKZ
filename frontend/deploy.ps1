param(
    [Parameter(Mandatory = $true)]
    [string]$Target
)

$ErrorActionPreference = "Stop"

$apps = @(
    "client",
    "author",
    "expert",
    "developer",
    "admin"
)

# Deploy all applications
if ($Target -eq "all") {
    $targets = $apps
}
# Deploy one application
elseif ($apps -contains $Target) {
    $targets = @($Target)
}
else {
    Write-Host ""
    Write-Host "Invalid target: $Target" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available targets:" -ForegroundColor Yellow
    Write-Host "  client"
    Write-Host "  author"
    Write-Host "  expert"
    Write-Host "  developer"
    Write-Host "  admin"
    Write-Host "  all"
    Write-Host ""
    exit 1
}

foreach ($app in $targets) {

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Deploying $app" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $appPath = Join-Path $PSScriptRoot $app

    if (!(Test-Path $appPath)) {
        Write-Host "Folder not found: $appPath" -ForegroundColor Red
        exit 1
    }

    Set-Location $appPath

    Write-Host ""
    Write-Host "Building $app..." -ForegroundColor Yellow
    npm run build

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed for $app" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "Deploying $app..." -ForegroundColor Yellow
    npx wrangler deploy

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Deployment failed for $app" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "$app deployed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green