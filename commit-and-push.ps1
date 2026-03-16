# Run from project root: .\commit-and-push.ps1
# Commits each file separately (when changed) to maximize commit count, then pushes.

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

git config user.name "UtkarshSingh-06"
git config user.email "utkarsh.yash77@gmail.com"

if (-not (Test-Path .git)) { git init }
$remotes = git remote 2>$null
if ($remotes -notmatch "origin") { git remote add origin "https://github.com/Rahul-03Jain/AIPAY-Sheild.git" }
else { git remote set-url origin "https://github.com/Rahul-03Jain/AIPAY-Sheild.git" }

# (path, commit message) - one commit per file when it has changes
$entries = @(
  (".gitignore", "Add gitignore for node_modules, build outputs, and env"),
  ("package.json", "Add root package with seed script and pg bcrypt deps"),
  ("DEMO_CREDENTIALS.md", "Add demo credentials and setup instructions"),
  ("database\init.sql", "PostgreSQL schema for users merchants transactions notifications"),
  ("database\seed.js", "Seed script for demo users and merchant"),
  ("frontend\package.json", "Frontend Next.js Tailwind and dev dependencies"),
  ("frontend\next.config.mjs", "Next.js config and standalone output"),
  ("frontend\postcss.config.js", "PostCSS config for Tailwind and autoprefixer"),
  ("frontend\tailwind.config.js", "Tailwind content paths and theme extensions"),
  ("frontend\tsconfig.json", "TypeScript and path alias for frontend"),
  ("frontend\next-env.d.ts", "Next.js type declarations"),
  ("frontend\.env.example", "Example env for API and WebSocket URLs"),
  ("frontend\styles\globals.css", "Root global Tailwind styles"),
  ("frontend\src\styles\globals.css", "Src global styles and dark theme fallbacks"),
  ("frontend\src\pages\_app.tsx", "App component with global CSS"),
  ("frontend\src\pages\_document.tsx", "Document with theme-color and meta"),
  ("frontend\src\pages\index.tsx", "Landing page for AI payment and fraud platform"),
  ("frontend\src\pages\login.tsx", "Login page with default API URL and clearer errors"),
  ("frontend\src\pages\register.tsx", "Registration page for user merchant analyst"),
  ("frontend\src\pages\admin\dashboard.tsx", "Admin dashboard with profile and create payment form"),
  ("backend\api-gateway\package.json", "API gateway dependencies"),
  ("backend\api-gateway\tsconfig.json", "TypeScript config for API gateway"),
  ("backend\api-gateway\src\index.ts", "Gateway with pathRewrite and auth payment analytics proxies"),
  ("backend\auth-service\package.json", "Auth service dependencies"),
  ("backend\auth-service\tsconfig.json", "TypeScript config for auth service"),
  ("backend\auth-service\src\index.ts", "Register login and profile API with merchant_id"),
  ("payment-service\package.json", "Payment service dependencies"),
  ("payment-service\tsconfig.json", "TypeScript config for payment service"),
  ("payment-service\src\index.ts", "Payment API with currency fraud analytics notifications"),
  ("currency-service\package.json", "Currency service dependencies"),
  ("currency-service\tsconfig.json", "TypeScript config for currency service"),
  ("currency-service\src\index.ts", "In-memory FX conversion API"),
  ("fraud-detection-service\requirements.txt", "Python deps for fraud detection"),
  ("fraud-detection-service\app.py", "FastAPI fraud scoring endpoint"),
  ("analytics-service\package.json", "Analytics service dependencies"),
  ("analytics-service\tsconfig.json", "TypeScript config for analytics service"),
  ("analytics-service\src\index.ts", "Analytics metrics and WebSocket streaming"),
  ("notification-service\package.json", "Notification service dependencies"),
  ("notification-service\tsconfig.json", "TypeScript config for notification service"),
  ("notification-service\src\index.ts", "Notification API and WebSocket for fraud alerts"),
  ("docker\docker-compose.yml", "Docker Compose with analytics notification env for payment"),
  ("kubernetes\api-gateway-deployment.yaml", "Kubernetes deployment and ingress for API gateway"),
  ("kubernetes\payment-service-deployment.yaml", "Kubernetes deployment for payment service"),
  ("tests\payment-service\createPayment.test.ts", "Payment service integration test skeleton"),
  ("push-changes.ps1", "Script to single-commit and push"),
  ("commit-and-push.ps1", "Script to commit per file and push to maximize commits")
)

$count = 0
foreach ($e in $entries) {
  $path = $e[0]
  $msg = $e[1]
  if (-not (Test-Path $path)) { Write-Host "Skip (missing): $path"; continue }
  & git add $path 2>&1 | Out-Null
  & git diff --cached --quiet 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    & git commit -m "$msg" 2>&1 | Out-Null
    $count++
  }
}

# Commit any remaining staged or untracked files not in the list
& git add -A 2>&1 | Out-Null
& git diff --cached --quiet 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  & git commit -m "Add remaining project files and updates" 2>&1 | Out-Null
  $count++
}

Write-Host "Total commits this run: $count"
& git branch -M main 2>&1 | Out-Null
& git push -u origin main
Write-Host "Pushed to https://github.com/Rahul-03Jain/AIPAY-Sheild.git"
