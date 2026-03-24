#!/bin/bash
set -euo pipefail

# Resolve rust-toolchain.toml relative to this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLCHAIN_FILE="${SCRIPT_DIR}/../rust-toolchain.toml"

# Check that rust-toolchain.toml exists
if [[ ! -f "$TOOLCHAIN_FILE" ]]; then
  echo "Error: rust-toolchain.toml not found at $TOOLCHAIN_FILE" >&2
  exit 1
fi

# Extract toolchain version from the canonical `channel` field.
# Fall back to the legacy `version` field for backwards compatibility.
VERSION=$(awk -F'"' '
  /channel[[:space:]]*=/ { gsub(/[[:space:]]/, "", $2); print $2; exit }
  /version[[:space:]]*=/ { legacy = $2 }
  END {
    if (legacy != "") {
      gsub(/[[:space:]]/, "", legacy)
      print legacy
    }
  }
' "$TOOLCHAIN_FILE")

# Validate that we got a version
if [[ -z "$VERSION" ]]; then
  echo "Error: Could not extract toolchain version from $TOOLCHAIN_FILE" >&2
  exit 1
fi

# Output version (without trailing newline for consistency)
echo -n "$VERSION"
