# WhisperFlow — local Wispr Flow clone for macOS

Hold a key anywhere in macOS, speak, release: your words appear at the cursor,
cleaned up (no "um"s, proper punctuation) by a local LLM. Fully offline —
Whisper runs on-device via MLX, cleanup runs on Ollama. Nothing leaves your Mac.

Pipeline: `hotkey → mic capture → mlx-whisper (STT) → Ollama LLM (cleanup) → paste at cursor`

## Setup (Apple Silicon, macOS 14+)

**One command:**

```bash
cd whisperflow && ./setup.sh
```

It installs Ollama, pulls the models, sets up the Python env, and launches
the app. Or do it manually:

```bash
# 1. Python deps
cd whisperflow
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Ollama + cleanup model
brew install ollama
ollama serve &                # or run the Ollama.app
ollama pull qwen2.5:7b-instruct

# 3. Run (first launch downloads the Whisper model, ~1.6 GB)
python flow.py
```

Then focus any text field, **hold right Option (⌥)**, speak, release.

## macOS permissions (one-time)

Grant these to your terminal app (Terminal/iTerm/VS Code) in
**System Settings → Privacy & Security**, then restart the terminal:

- **Microphone** — to record you.
- **Input Monitoring** — for the global hotkey (`pynput`).
- **Accessibility** — to paste into other apps (`osascript` keystroke).

## Configuration

Copy `config.example.json` to `config.json` and edit:

| Key | Meaning |
|---|---|
| `hotkey` | `alt_r` (right ⌥), `cmd_r`, `f19`, or any single character |
| `mode` | `hold` = push-to-talk · `toggle` = press to start/stop |
| `language` | `null` autodetects; pin `"en"` / `"fr"` for speed & accuracy |
| `mlx_model` | `mlx-community/whisper-large-v3-turbo` (default). Smaller/faster: `mlx-community/whisper-small-mlx` |
| `ollama_model` | `qwen2.5:7b-instruct` (default) · lighter: `qwen2.5:3b-instruct` |
| `cleanup` | `false` = raw Whisper output, no LLM pass |

`dictionary.json` is your personal dictionary — names, jargon, brands whose
spelling the cleanup model must respect.

If Ollama isn't running, the app still works and pastes the raw transcript.

## Troubleshooting: hotkey doesn't do anything

Run the diagnostic instead of `flow.py`:

```bash
source .venv/bin/activate
python diagnose.py
```

It checks Ollama, `config.json`, the STT backend, and the microphone one by
one, then listens to your keyboard for 10 seconds and **prints the name of
every key you press**:

- **Nothing prints when you press keys** → macOS isn't delivering key events
  to your terminal at all. This is the *Input Monitoring* permission, not a
  bug in the app. Grant it to your terminal app in
  **System Settings → Privacy & Security → Input Monitoring**, then fully
  quit and reopen the terminal (a restart of the window is not enough).
- **Keys print, but not the one you expect for your hotkey** → your
  `config.json` `"hotkey"` value doesn't match what pynput calls that key on
  your keyboard. Copy the exact name it printed into `config.json`.
- **Recording starts (you hear the chime) but nothing gets pasted** → that's
  the *Accessibility* permission, needed for the synthetic ⌘V keystroke.

## Intel Macs

`pip install faster-whisper` instead of `mlx-whisper` (or set
`"stt_backend": "faster-whisper"`). Expect slower transcription; use the
`small` model.

## Roadmap

See `../WHISPERFLOW_CLONE_PLAN.md` — next milestones: menu-bar indicator,
VAD auto-stop, Command Mode ("make this more formal" on selected text),
per-app tone awareness.
