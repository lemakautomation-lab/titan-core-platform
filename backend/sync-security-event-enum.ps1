$path = ".\prisma\schema.prisma"

$content = Get-Content $path -Raw

$content = $content -replace `
"enum SecurityEventType \{[\s\S]*?RATE_LIMIT_EXCEEDED\r?\n\}",
"enum SecurityEventType {
  AUTHENTICATION_SUCCESS
  AUTHENTICATION_FAILURE
  AUTHORIZATION_FAILURE
  INVALID_AUTH_HEADER
  INVALID_TOKEN
  TOKEN_EXPIRED
  TOKEN_REFRESH_SUCCESS
  TOKEN_REFRESH_FAILURE
  TOKEN_REUSE_DETECTED
  ACCOUNT_LOCKED
  SUSPICIOUS_ACTIVITY
  RATE_LIMIT_EXCEEDED
}"

Set-Content `
    -Path $path `
    -Value $content
