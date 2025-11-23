# HR System Deployment Script
# Usage: .\deploy.ps1

Write-Host "Starting deployment to GitHub..." -ForegroundColor Green

# Check if Git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git is not installed!" -ForegroundColor Red
    Write-Host "Download from: https://git-scm.com" -ForegroundColor Yellow
    exit
}

# Initialize Git if not exists
if (-not (Test-Path .git)) {
    Write-Host "Initializing Git..." -ForegroundColor Yellow
    git init
}

# Add all files
Write-Host "Adding files..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Committing changes..." -ForegroundColor Yellow
$commitMessage = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "HR System - Update"
}
git commit -m $commitMessage

# Check remote
$remoteUrl = git remote get-url origin 2>$null
if ($null -eq $remoteUrl) {
    Write-Host ""
    Write-Host "Project not connected to GitHub yet!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Create new repository: hr-system" -ForegroundColor White
    Write-Host "3. Copy the repository URL" -ForegroundColor White
    Write-Host ""
    $repoUrl = Read-Host "Enter repository URL"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        git branch -M main
        Write-Host "Connected successfully!" -ForegroundColor Green
    } else {
        Write-Host "Operation cancelled" -ForegroundColor Red
        exit
    }
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://render.com" -ForegroundColor White
    Write-Host "2. Sign up with GitHub" -ForegroundColor White
    Write-Host "3. New -> Web Service" -ForegroundColor White
    Write-Host "4. Connect repository" -ForegroundColor White
    Write-Host "5. Start Command: python app.py" -ForegroundColor White
    Write-Host ""
    Write-Host "You will get a live URL!" -ForegroundColor Green
} else {
    Write-Host "Error pushing. Check your settings." -ForegroundColor Red
}
