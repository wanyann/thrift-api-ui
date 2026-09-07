#!/usr/bin/env bash
#
# Build Thrift API UI natively for Apple Silicon (macOS arm64).
#
# Usage:
#   ./build-macos-arm64.sh            # build + package (install deps if missing)
#   ./build-macos-arm64.sh --install  # force reinstall of dependencies first
#
# Output:
#   release/*.app and release/*.dmg
#
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Platform check"
if [ "$(uname -s)" != "Darwin" ]; then
    echo "ERROR: this script is intended for macOS only" >&2
    exit 1
fi
if [ "$(uname -m)" != "arm64" ]; then
    echo "WARNING: detected $(uname -m). On Intel (x86_64) macOS the app will be built for x86_64, not Apple Silicon." >&2
fi

command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js is not installed" >&2; exit 1; }

# Use global yarn if available, otherwise fall back to npx.
YARN="$(command -v yarn || true)"
if [ -z "$YARN" ]; then
    echo "==> yarn not found, using npx yarn@1.22.22"
    YARN="npx --yes yarn@1.22.22"
fi

NEED_INSTALL=0
if [ ! -d node_modules ]; then
    echo "==> node_modules not found, dependencies will be installed"
    NEED_INSTALL=1
fi
if [ "${1:-}" = "--install" ]; then
    NEED_INSTALL=1
fi

if [ "$NEED_INSTALL" = "1" ]; then
    echo "==> Installing dependencies"
    # --ignore-optional: fsevents@1.x (file watching) has no arm64/Node 24 build
    # and is optional anyway.
    $YARN install --ignore-optional
fi

echo "==> Building (webpack main + renderer)"
npm run build

echo "==> Packaging macOS arm64 app"
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac

echo "==> Verifying binary architecture"
APP_BIN="$(ls -d release/mac-arm64/*.app 2>/dev/null | head -1)"
if [ -n "$APP_BIN" ]; then
    file "$APP_BIN/Contents/MacOS/"* | grep -q arm64 && echo "OK: native arm64 build" || echo "WARNING: binary is not arm64"
else
    echo "WARNING: .app bundle not found in release/mac-arm64"
fi

echo "==> Done. Artifacts:"
ls -1 release/*.app release/*.dmg 2>/dev/null || ls -1 release