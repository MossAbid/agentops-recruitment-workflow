# WhisperFlow (Wispr Flow) Local Clone — Research & Implementation Plan

Goal: recreate Wispr Flow's core functionality 100% locally — no cloud, no
subscription — using a local speech-to-text engine plus a local LLM served by
**Ollama** for the "AI cleanup" stage.

---

## 1. How Wispr Flow actually works

Wispr Flow is a system-wide dictation app (macOS / Windows / iOS). The user
experience:

1. **Hold a hotkey** (default `Fn`) anywhere in the OS and speak.
2. Audio is captured locally, then **sent to Wispr's cloud servers**.
3. A **two-stage AI pipeline** runs remotely:
   - **Stage 1 — ASR (speech-to-text):** a Whisper-class model transcribes the raw audio.
   - **Stage 2 — LLM post-processing:** a language model removes filler words
     ("um", "uh"), fixes punctuation/capitalization, applies the user's
     personal dictionary, and formats the text for the app that has focus
     (casual for Slack, formal for email, etc.).
4. The polished text is **injected at the cursor** via OS-level input APIs
   (works in any app that accepts keyboard input). Round trip ≈ under 2 s.

Key features on top of the pipeline:

| Feature | What it does |
|---|---|
| Push-to-talk + toggle modes | Hold `Fn` or toggle hands-free dictation |
| Auto-edits | Filler removal, punctuation, self-correction ("no wait, make that Tuesday") |
| Tone / context awareness | Reads the focused app & nearby text to adapt formatting and spell names correctly |
| Command Mode | Select text, say "make this more formal" → LLM rewrites it |
| Personal dictionary | Learns corrections automatically; manual entries for jargon/names |
| 100+ languages, whisper-level speech | Whisper models are multilingual and robust to quiet speech |

**The important architectural fact:** Wispr Flow is *not* one magic model.
It's `hotkey → audio capture → ASR → LLM cleanup → keystroke injection`.
Every stage has a strong local, open-source equivalent, which is why several
open-source clones already exist (FreeFlow, VoiceInk, OpenWhispr,
OpenTypeless, Murmur…). We're building the same pipeline, tailored to us.

## 2. One correction about Ollama

**Ollama cannot do the speech-to-text step.** Ollama serves text LLMs; it has
no audio-input API (the "whisper" uploads on ollama.com are not usable for
transcription through Ollama). The standard local architecture — used by every
open-source clone — is:

- **STT:** `faster-whisper` (CTranslate2) or `whisper.cpp` running locally.
- **Cleanup LLM:** a small instruct model **served by Ollama** (this is where
  Ollama fits, and it's the stage that makes output feel "Wispr-quality").

## 3. Proposed architecture (fully local)

```
┌────────────┐   hold/press   ┌──────────────┐  16 kHz mono  ┌───────────────┐
│ Global      │ ─────────────▶ │ Audio capture │ ────────────▶ │ Local STT      │
│ hotkey      │                │ (sounddevice) │               │ faster-whisper │
│ listener    │                │ + VAD trim    │               │ or whisper.cpp │
└────────────┘                └──────────────┘               └──────┬────────┘
                                                                    │ raw transcript
                                                             ┌──────▼────────┐
                                                             │ Ollama LLM     │
                                                             │ cleanup prompt │
                                                             │ + personal     │
                                                             │   dictionary   │
                                                             └──────┬────────┘
                                                                    │ polished text
                                                             ┌──────▼────────┐
                                                             │ Text injection │
                                                             │ (paste or      │
                                                             │  synthetic     │
                                                             │  keystrokes)   │
                                                             └───────────────┘
```

### Component choices

| Stage | Recommended | Alternatives / notes |
|---|---|---|
| Hotkey | `pynput` global listener (hold-to-talk + toggle) | OS-native APIs later; macOS needs Accessibility permission |
| Capture | `sounddevice`, 16 kHz mono PCM | Add `silero-vad` to trim silence → faster STT |
| STT | **`faster-whisper`** with `large-v3-turbo` (good GPU/Apple Silicon) or `small`/`distil-small.en` (CPU) | `whisper.cpp` if we go native/Swift; NVIDIA **Parakeet** models are faster for English-only |
| Cleanup LLM | **Ollama** + `qwen2.5:7b-instruct` or `llama3.1:8b` (temp 0–0.2) | `gemma2:2b`/`qwen2.5:3b` on weak hardware; skippable "raw mode" toggle |
| Injection | Clipboard save→paste→restore (`pyperclip` + synthetic Cmd/Ctrl+V) — most reliable across apps | Per-OS typing: macOS CGEvent/AppleScript, Windows SendInput, Linux `xdotool`/`wtype` |
| Dictionary | JSON file of terms + corrections, injected into the LLM prompt | Auto-learn from user edits later |

### Cleanup prompt (Stage 2, the "Wispr feel")

System prompt to the Ollama model, roughly:

> You clean up dictated text. Remove filler words, fix punctuation,
> capitalization and obvious self-corrections ("no wait, X" → keep X only).
> Never add content, never answer questions in the text, output only the
> cleaned text. Spell these terms exactly: {personal dictionary}.

### Latency budget (target < 2–3 s for a ~10 s utterance)

- VAD-trimmed STT with `large-v3-turbo` on GPU / `small` on CPU: 0.5–1.5 s
- Ollama 7B cleanup of a short paragraph: 0.3–1 s (keep `keep_alive` warm!)
- Injection: ~instant.
- Warm-start both models at app launch; never load per-utterance.

## 4. Hardware requirements

- **Minimum (CPU-only laptop):** `faster-whisper small` (int8) + `qwen2.5:3b` — workable, ~3–5 s.
- **Comfortable (Apple Silicon 16 GB+ or NVIDIA 8 GB+):** `large-v3-turbo` + 7–8B LLM — Wispr-like quality and speed.
- Disk: 1–3 GB STT model + 2–5 GB LLM.

## 5. Milestones

- **M1 — MVP (a weekend):** single Python script: hold hotkey → record → faster-whisper → paste at cursor. No LLM yet. ~200 lines.
- **M2 — Cleanup + dictionary:** pipe transcript through Ollama with the cleanup prompt; JSON personal dictionary; "raw mode" fallback if Ollama is down.
- **M3 — Polish:** toggle mode, tray/menu-bar indicator + recording chime, VAD auto-stop, config file (model names, hotkey, language).
- **M4 — Command Mode:** second hotkey; reads current selection (via clipboard), sends `selection + spoken instruction` to Ollama, replaces selection with the rewrite.
- **M5 — Context awareness:** detect focused app (window title) and pass it to the prompt for tone; optionally read nearby text via accessibility APIs.

## 6. Open decisions

1. **Target OS** — the injection + hotkey layer is the only OS-specific part.
   Python (`pynput` + clipboard-paste) covers macOS/Windows/Linux for the MVP;
   a native Swift app (à la VoiceInk/FreeFlow) is the long-term nicer macOS path.
2. **English-only vs multilingual** — English-only unlocks faster models
   (distil-whisper, Parakeet); multilingual (e.g. French) means Whisper
   `small`/`large-v3-turbo`.
3. **Streaming vs record-then-transcribe** — clones all start with
   record-then-transcribe (simpler, and fine under ~30 s utterances). Streaming
   partial transcripts is a later optimization.

## 7. Reference projects to crib from

- **FreeFlow** (github.com/zachlatta/freeflow) — Swift/macOS, hold-`Fn`, OpenAI-compatible endpoints → works with Ollama; context-aware cleanup + Edit Mode.
- **VoiceInk** (github.com/Beingpax/VoiceInk) — Swift/macOS, whisper.cpp + Parakeet, CGEvent injection, Power Mode per-app profiles, personal dictionary.
- **OpenWhispr / OpenTypeless / Murmur** — cross-platform takes on the same pipeline (Murmur = Whisper + Ollama Qwen 2.5 7B exactly as proposed here).
