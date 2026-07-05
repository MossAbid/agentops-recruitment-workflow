#!/bin/bash
# One-command setup for WhisperFlow on macOS.
# Usage: ./setup.sh          (installs everything, then launches the app)
#        ./setup.sh --no-run (installs only)
set -euo pipefail
cd "$(dirname "$0")"

say_step() { printf '\n\033[1;36m▸ %s\033[0m\n' "$1"; }

if [[ "$(uname)" != "Darwin" ]]; then
  echo "This script targets macOS." >&2; exit 1
fi

say_step "Checking Homebrew"
if ! command -v brew >/dev/null; then
  echo "Homebrew is missing. Install it first: https://brew.sh" >&2; exit 1
fi

say_step "Installing Ollama"
if ! command -v ollama >/dev/null; then
  brew install ollama
else
  echo "already installed"
fi

say_step "Starting Ollama"
if ! curl -s http://localhost:11434 >/dev/null; then
  (ollama serve >/dev/null 2>&1 &)
  for _ in $(seq 1 20); do
    curl -s http://localhost:11434 >/dev/null && break
    sleep 0.5
  done
fi
echo "running"

say_step "Pulling cleanup model (qwen2.5:7b-instruct, ~4.7 GB, skipped if present)"
ollama pull qwen2.5:7b-instruct

say_step "Creating Python environment"
if [[ ! -d .venv ]]; then python3 -m venv .venv; fi
source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo "dependencies installed"

if [[ ! -f config.json ]]; then
  say_step "Creating config.json (edit it to change hotkey/language/models)"
  cp config.example.json config.json
fi

cat <<'EOF'

──────────────────────────────────────────────────────────────
 MANUAL STEP — macOS permissions (one-time, Apple requires it)
 System Settings → Privacy & Security, grant to your terminal:
   • Microphone
   • Input Monitoring
   • Accessibility
 Then RESTART the terminal app.
──────────────────────────────────────────────────────────────
EOF

if [[ "${1:-}" == "--no-run" ]]; then
  echo "Setup done. Launch with: source .venv/bin/activate && python flow.py"
else
  say_step "Launching WhisperFlow (first run downloads the Whisper model, ~1.6 GB)"
  exec python flow.py
fi
