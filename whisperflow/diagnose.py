#!/usr/bin/env python3
"""Diagnose why WhisperFlow's hotkey isn't triggering.

Run this instead of flow.py when the app doesn't seem to react to your
hotkey. It checks each dependency independently, then listens to the
keyboard for 10 seconds and prints the name of every key you press —
this tells you two things at once:

  1. If NOTHING prints when you press keys: macOS is not delivering key
     events to this process. That's almost always the "Input Monitoring"
     permission missing for your terminal app (or the terminal wasn't
     restarted after granting it).

  2. If keys print but not the name you expected for your hotkey (e.g.
     you press what you think is "right Option" but see "alt_l" or
     something else): your config.json "hotkey" value doesn't match.
     Use the printed name verbatim in config.json.
"""

import json
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def check(label, fn):
    try:
        result = fn()
        print(f"  [OK]   {label}" + (f" — {result}" if isinstance(result, str) else ""))
        return True
    except Exception as exc:
        print(f"  [FAIL] {label} — {exc}")
        return False


def check_ollama():
    import requests
    r = requests.get("http://localhost:11434/api/tags", timeout=3)
    r.raise_for_status()
    models = [m["name"] for m in r.json().get("models", [])]
    if not models:
        raise RuntimeError("Ollama is running but no models are pulled — run: ollama pull qwen2.5:7b-instruct")
    return ", ".join(models)


def check_config():
    path = BASE_DIR / "config.json"
    if not path.exists():
        raise RuntimeError(f"{path} missing — copy config.example.json to config.json")
    config = json.loads(path.read_text())
    hotkey = config.get("hotkey", "<missing>")
    return f"hotkey = {hotkey!r}, mode = {config.get('mode')!r}"


def check_stt_import():
    try:
        import mlx_whisper  # noqa: F401
        return "mlx-whisper available (Apple Silicon path)"
    except ImportError:
        pass
    import faster_whisper  # noqa: F401
    return "faster-whisper available (Intel/fallback path)"


def check_mic():
    import sounddevice as sd
    devices = sd.query_devices()
    inputs = [d["name"] for d in devices if d["max_input_channels"] > 0]
    if not inputs:
        raise RuntimeError("no input device found")
    default = sd.query_devices(kind="input")["name"]
    return f"default = {default!r} ({len(inputs)} input device(s) total)"


def listen_for_keys(seconds=10):
    from pynput import keyboard

    print(f"\n--- Live key test: press keys for {seconds}s (include your hotkey) ---")
    print("If NOTHING appears below when you press keys, grant 'Input Monitoring'")
    print("to your terminal app in System Settings > Privacy & Security, then")
    print("fully quit and reopen the terminal before retrying.\n")

    seen = []

    def on_press(key):
        name = key.char if hasattr(key, "char") and key.char else str(key).replace("Key.", "")
        seen.append(name)
        print(f"  key pressed: {name!r}")

    listener = keyboard.Listener(on_press=on_press)
    listener.start()
    time.sleep(seconds)
    listener.stop()

    print()
    if not seen:
        print("No keys were detected at all -> this is a macOS permission problem,")
        print("not a WhisperFlow bug. Fix Input Monitoring and try again.")
    else:
        print(f"Detected {len(seen)} key event(s): {seen}")
        print("Use the exact name shown above (without quotes) as \"hotkey\" in config.json.")


def main():
    print("=== 1/5 Ollama server + model ===")
    check("Ollama reachable with a pulled model", check_ollama)

    print("\n=== 2/5 config.json ===")
    check("config.json present and valid", check_config)

    print("\n=== 3/5 Speech-to-text backend ===")
    check("mlx-whisper or faster-whisper importable", check_stt_import)

    print("\n=== 4/5 Microphone ===")
    check("Input audio device detected", check_mic)

    print("\n=== 5/5 Keyboard / hotkey permission ===")
    try:
        listen_for_keys()
    except Exception as exc:
        print(f"  [FAIL] could not start key listener — {exc}")
        print("  This usually also means Input Monitoring is not granted.")


if __name__ == "__main__":
    sys.exit(main())
