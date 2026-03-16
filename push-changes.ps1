# Run from project root to commit and push all changes to GitHub.
# Usage: .\push-changes.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

git config user.name "UtkarshSingh-06"
git config user.email "utkarsh.yash77@gmail.com"

$remote = git remote 2>$null
if ($remote -notmatch "origin") {
  git remote add origin "https://github.com/Rahul-03Jain/AIPAY-Sheild.git"
} else {
  git remote set-url origin "https://github.com/Rahul-03Jain/AIPAY-Sheild.git"
}

git add -A
git status
$msg = "Complete backend, demo users, seed script, and frontend payment flow"
git commit -m $msg
git branch -M main
git push -u origin main

Write-Host "Done. Pushed to https://github.com/Rahul-03Jain/AIPAY-Sheild.git"
