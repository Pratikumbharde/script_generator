"""
VEXYL-STT Server — Self-hosted speech-to-text using IndicConformer 600M.
Provides a simple REST API on port 8091 that Pitch Studio can call.

Endpoints:
  GET  /health           — health check
  POST /transcribe      — synchronous transcription (simpler API for Pitch Studio)
"""

import os
import io
import json
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# ─── Load model on startup ──────────────────────────────────────────────
print("[VEXYL-STT] Loading IndicConformer 600M model...")
import torch
import torchaudio
from transformers import AutoModel

MODEL_NAME = os.environ.get("VEXYL_STT_MODEL", "ai4bharat/indic-conformer-600m-multilingual")
DECODE_MODE = os.environ.get("VEXYL_STT_DECODE", "ctc")  # "ctc" (faster) or "rnnt" (more accurate)
DEVICE = os.environ.get("VEXYL_STT_DEVICE", "cpu")

model = AutoModel.from_pretrained(MODEL_NAME, trust_remote_code=True)
if DEVICE == "auto":
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(DEVICE)
model.eval()
print(f"[VEXYL-STT] Model loaded on {DEVICE} with {DECODE_MODE} decoding")

# ─── Language mapping ───────────────────────────────────────────────────
LANG_MAP = {
    "en": "en", "en-IN": "en",
    "hi": "hi", "hi-IN": "hi",
    "mr": "mr", "mr-IN": "mr",
    "es": "es", "fr": "fr", "de": "de",
    "pt": "pt", "it": "it",
    "ja": "ja", "zh": "zh", "ko": "ko",
}

# ─── Inference lock (single-threaded for CPU) ──────────────────────────
infer_lock = threading.Lock()


def transcribe_audio(audio_bytes, filename, language="en"):
    """Run inference on audio bytes. Returns transcript text."""
    import soundfile as sf
    import numpy as np

    # Load audio
    try:
        audio, sr = sf.read(io.BytesIO(audio_bytes))
    except Exception:
        # Try ffmpeg fallback for mp3/m4a/webm
        import subprocess
        tmp_in = f"_stt_temp_{int(time.time())}.{filename.rsplit('.', 1)[-1]}"
        tmp_out = f"_stt_temp_{int(time.time())}.wav"
        try:
            with open(tmp_in, "wb") as f:
                f.write(audio_bytes)
            subprocess.run(["ffmpeg", "-y", "-i", tmp_in, "-ar", "16000", "-ac", "1", tmp_out],
                           capture_output=True, check=True)
            audio, sr = sf.read(tmp_out)
        finally:
            for f in [tmp_in, tmp_out]:
                try:
                    os.remove(f)
                except:
                    pass

    # Convert to torch tensor
    if isinstance(audio, np.ndarray):
        # Ensure mono
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)
        waveform = torch.FloatTensor(audio).unsqueeze(0)
    else:
        waveform = audio

    # Resample to 16kHz
    if sr != 16000:
        resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=16000)
        waveform = resampler(waveform)
        sr = 16000

    # Map language code
    lang = LANG_MAP.get(language, "en")

    # Run inference
    with infer_lock:
        result = model(waveform.to(DEVICE), lang, DECODE_MODE)

    # Extract text
    if isinstance(result, dict):
        text = result.get("text", "") or result.get("transcript", "")
    elif isinstance(result, str):
        text = result
    elif hasattr(result, "text"):
        text = result.text
    else:
        text = str(result)

    return text.strip()


# ─── HTTP Handler ────────────────────────────────────────────────────────
class STTHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[VEXYL-STT] {args[0]}")

    def _send_json(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            self._send_json(200, {
                "status": "ok",
                "model": MODEL_NAME,
                "device": DEVICE,
                "decode_mode": DECODE_MODE,
            })
        else:
            self._send_json(404, {"error": "Not found"})

    def do_POST(self):
        path = urlparse(self.path).path
        if path != "/transcribe":
            self._send_json(404, {"error": "Not found. Use POST /transcribe"})
            return

        content_type = self.headers.get("Content-Type", "")
        content_length = int(self.headers.get("Content-Length", 0))

        if content_length > 30 * 1024 * 1024:  # 30MB max
            self._send_json(413, {"error": "File too large. Max 30MB."})
            return

        body = self.rfile.read(content_length)

        # Parse multipart form data
        audio_bytes = None
        filename = "recording.webm"
        language = "en"

        # Extract boundary
        boundary = None
        for part in content_type.split(";"):
            part = part.strip()
            if part.startswith("boundary="):
                boundary = part[9:].strip('"')
                break

        if not boundary or boundary not in body.decode("latin-1", errors="replace"):
            # Try simple form data
            audio_bytes = body
        else:
            # Parse multipart
            boundary_bytes = f"--{boundary}".encode()
            parts = body.split(boundary_bytes)

            for part in parts:
                if b"Content-Disposition" not in part:
                    continue

                # Extract headers and content
                header_end = part.find(b"\r\n\r\n")
                if header_end == -1:
                    header_end = part.find(b"\n\n")
                    header_sep = b"\n\n"
                else:
                    header_sep = b"\r\n\r\n"

                if header_end == -1:
                    continue

                headers = part[:header_end].decode("latin-1", errors="replace")
                content = part[header_end + len(header_sep):]

                # Remove trailing \r\n
                if content.endswith(b"\r\n"):
                    content = content[:-2]
                elif content.endswith(b"\n"):
                    content = content[:-1]

                if 'name="file"' in headers or 'name="audio"' in headers:
                    audio_bytes = content
                    # Extract filename
                    for h in headers.split("\r\n"):
                        if "filename=" in h:
                            filename = h.split("filename=")[1].strip('" ').split(";")[0]
                elif 'name="language"' in headers or 'name="language_code"' in headers:
                    language = content.decode("utf-8", errors="replace").strip()

        if not audio_bytes:
            self._send_json(400, {"error": "No audio file provided"})
            return

        # Transcribe
        try:
            start = time.time()
            text = transcribe_audio(audio_bytes, filename, language)
            elapsed = time.time() - start
            print(f"[VEXYL-STT] Transcribed {len(audio_bytes)} bytes in {elapsed:.1f}s: {text[:80]}...")

            self._send_json(200, {
                "text": text,
                "confidence": 0.85,
                "language": language,
                "diarization": False,
                "segments": [{"speaker": "Speaker 1", "text": text, "start": 0, "end": 0, "confidence": 0.85}],
            })
        except Exception as e:
            print(f"[VEXYL-STT] Transcription error: {e}")
            self._send_json(500, {"error": str(e)})


# ─── Start server ────────────────────────────────────────────────────────
if __name__ == "__main__":
    HOST = os.environ.get("VEXYL_STT_HOST", "127.0.0.1")
    PORT = int(os.environ.get("VEXYL_STT_PORT", "8091"))

    server = HTTPServer((HOST, PORT), STTHandler)
    print(f"[VEXYL-STT] Server running on http://{HOST}:{PORT}")
    print(f"[VEXYL-STT] Endpoints: GET /health | POST /transcribe")
    print(f"[VEXYL-STT] Model: {MODEL_NAME} | Decode: {DECODE_MODE} | Device: {DEVICE}")
    print(f"[VEXYL-STT] Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[VEXYL-STT] Shutting down...")
        server.shutdown()