#!/bin/bash
# prod-vid environment. Source this before any script. Override any variable before sourcing.
# PROD_VID_PKGS: node_modules holding hyperframes, playwright-core, gsap, @fontsource/*  (npm i in a packages folder)
export PROD_VID_PKGS="${PROD_VID_PKGS:-$PWD/node_modules}"
export PKGS="$PROD_VID_PKGS"
# Headless Chromium: first match under PLAYWRIGHT_BROWSERS_PATH (default /opt/pw-browsers), else HEADLESS_SHELL must be set.
if [ -z "$HEADLESS_SHELL" ]; then
  HEADLESS_SHELL=$(ls -d "${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | tail -1)
fi
export HEADLESS_SHELL PRODUCER_HEADLESS_SHELL_PATH="$HEADLESS_SHELL" HYPERFRAMES_BROWSER_PATH="$HEADLESS_SHELL"
export HYPERFRAMES_NO_TELEMETRY=1 HYPERFRAMES_SKIP_SKILLS=1 HYPERFRAMES_NO_UPDATE_CHECK=1
# Serialize full-spec renders when several films share a machine.
export PROD_VID_LOCK="${PROD_VID_LOCK:-/tmp/prod-vid-render.lock}"
