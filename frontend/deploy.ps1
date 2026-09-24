
param(
    [Parameter(
        Mandatory = $true,
        Position = 0,
        ValueFromRemainingArguments = $true
    )]
    [string[]]$Target
)

$ErrorActionPreference = "Stop"

$apps = @(
    "client",
    "author",
    "expert",
    "developer",
    "admin"
)

# ========================================
# Determine targets
# ========================================

# Deploy all applications
if ($Target -contains "all") {

    if ($Target.Count -gt 1) {
        Write-Host ""
        Write-Host "Error: 'all' cannot be combined with other targets." -ForegroundColor Red
        Write-Host ""
        exit 1
    }

    $targets = $apps
}
else {

    # Check for invalid targets
    $invalidTargets = @(
        $Target | Where-Object {
            $apps -notcontains $_
        }
    )

    if ($invalidTargets.Count -gt 0) {

        Write-Host ""
        Write-Host "Invalid target(s): $($invalidTargets -join ', ')" -ForegroundColor Red
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

    $targets = $Target
}

# ========================================
# Deploy
# ========================================

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

    # ------------------------------------
    # Build
    # ------------------------------------

    Write-Host ""
    Write-Host "Building $app..." -ForegroundColor Yellow

    npm run build

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Build failed for $app" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "Build completed successfully!" -ForegroundColor Green

    # ------------------------------------
    # Deploy
    # ------------------------------------

    Write-Host ""
    Write-Host "Deploying $app..." -ForegroundColor Yellow

    npx wrangler deploy

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Deployment failed for $app" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "$app deployed successfully!" -ForegroundColor Green
}

# ========================================
# Complete
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
