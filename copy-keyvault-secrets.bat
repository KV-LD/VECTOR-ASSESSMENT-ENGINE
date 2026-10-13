@echo off
setlocal
cd /d "%~dp0"

if not exist "key-vault-secrets.env.example" (
  echo.
  echo Cannot find key-vault-secrets.env.example in:
  echo   %CD%
  echo.
  echo You are either in the wrong folder or you do not have the latest branch.
  echo Run these commands, then run this file again:
  echo.
  echo   cd /d C:\Users\305198\Documents\GitHub\VECTOR-ASSESSMENT-ENGINE
  echo   git checkout cursor/rebuild-vector-engine-6fe4
  echo   git pull origin cursor/rebuild-vector-engine-6fe4
  echo   copy-keyvault-secrets.bat
  echo.
  pause
  exit /b 1
)

if not exist "key-vault-secrets.env" (
  copy /Y "key-vault-secrets.env.example" "key-vault-secrets.env" >nul
  echo Created key-vault-secrets.env
) else (
  echo key-vault-secrets.env already exists
)

echo.
echo Opening the file in Notepad.
echo Fill in Postgres, admin, and SMTP values. Leave JWT-SECRET blank.
echo Save and close Notepad when you are done.
echo Do not paste those values into chat.
echo.
notepad "key-vault-secrets.env"

echo.
echo File is at:
echo   %CD%\key-vault-secrets.env
echo.
echo Next, upload it to Key Vault:
echo   az login
echo   powershell -File scripts\Set-KeyVaultSecrets.ps1 -VaultName YOUR-VAULT-NAME
echo.
pause
