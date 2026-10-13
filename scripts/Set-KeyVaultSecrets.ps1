param(
  [Parameter(Mandatory = $true)]
  [string]$VaultName,
  [string]$SecretsFile = "key-vault-secrets.env"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not (Test-Path $SecretsFile)) {
  if (Test-Path "key-vault-secrets.env.example") {
    Copy-Item "key-vault-secrets.env.example" $SecretsFile
    Write-Host "Created $SecretsFile from the example. Fill in the values, then run this script again."
    exit 1
  }
  throw "Missing $SecretsFile. Copy key-vault-secrets.env.example first."
}

function New-SecretString {
  $bytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes)
}

az account show 1>$null
if ($LASTEXITCODE -ne 0) {
  throw "Azure CLI is not logged in. Run: az login"
}

$uploaded = 0
Get-Content $SecretsFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  $eq = $line.IndexOf("=")
  if ($eq -lt 1) { return }
  $name = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1)
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  if ($name -in @("JWT-SECRET", "ADMIN-JWT-SECRET") -and [string]::IsNullOrWhiteSpace($value)) {
    $value = New-SecretString
    Write-Host "Generated $name"
  }
  if ([string]::IsNullOrWhiteSpace($value)) {
    Write-Host "Skipping empty $name"
    return
  }
  $tmp = New-TemporaryFile
  try {
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($tmp.FullName, $value, $utf8)
    az keyvault secret set --vault-name $VaultName --name $name --file $tmp.FullName --output none
    if ($LASTEXITCODE -ne 0) { throw "Failed to set $name" }
    $uploaded++
    Write-Host "Set $name"
  } finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

Write-Host ""
Write-Host "Uploaded $uploaded secrets to Key Vault '$VaultName'."
Write-Host "On the Web App, set only this Application setting:"
Write-Host "  KEY_VAULT_URI = https://$VaultName.vault.azure.net/"
Write-Host "Do not commit key-vault-secrets.env."
