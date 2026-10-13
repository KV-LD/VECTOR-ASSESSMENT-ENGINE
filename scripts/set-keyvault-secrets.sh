#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
VAULT_NAME="${1:-}"
SECRETS_FILE="${2:-key-vault-secrets.env}"

if [[ -z "$VAULT_NAME" ]]; then
  echo "Usage: scripts/set-keyvault-secrets.sh <KeyVaultName>"
  exit 1
fi

if [[ ! -f "$SECRETS_FILE" ]]; then
  cp key-vault-secrets.env.example "$SECRETS_FILE"
  echo "Created $SECRETS_FILE from the example. Fill in the values, then run this script again."
  exit 1
fi

az account show >/dev/null

random_secret() {
  python3 - <<'PY'
import secrets, base64
print(base64.b64encode(secrets.token_bytes(48)).decode())
PY
}

uploaded=0
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  [[ -z "$line" || "$line" == \#* ]] && continue
  name="${line%%=*}"
  value="${line#*=}"
  name="$(echo "$name" | xargs)"
  if [[ "$name" == "JWT-SECRET" || "$name" == "ADMIN-JWT-SECRET" ]] && [[ -z "$value" ]]; then
    value="$(random_secret)"
    echo "Generated $name"
  fi
  if [[ -z "$value" ]]; then
    echo "Skipping empty $name"
    continue
  fi
  tmp="$(mktemp)"
  printf '%s' "$value" > "$tmp"
  az keyvault secret set --vault-name "$VAULT_NAME" --name "$name" --file "$tmp" --output none
  rm -f "$tmp"
  uploaded=$((uploaded + 1))
  echo "Set $name"
done < "$SECRETS_FILE"

echo
echo "Uploaded $uploaded secrets to Key Vault '$VAULT_NAME'."
echo "On the Web App, set only this Application setting:"
echo "  KEY_VAULT_URI = https://$VAULT_NAME.vault.azure.net/"
echo "Do not commit key-vault-secrets.env."
