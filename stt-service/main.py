"""
STT Service — FastAPI server wrapping VEXYL-STT for speech-to-text transcription.
Supports Hindi, Marathi, and English.
Does NOT provide speaker diarization — returns single-speaker segments.
"""

import os
import tempfile
import logging
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="STT Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger("stt-service")
logging.basicConfig(level=logging.INFO)

# ── Language to model mapping ────────────────────────────────────────
# IndicConformer models from AI4Bharat for Indian languages
# For English, we use whisper-base as fallback
LANGUAGE_MODELS = {
    "hi": "ai4bharat/indicconformer_stt_hi_hybrid_rwf",   # Hindi
    "mr": "ai4bharat/indicconformer_stt_mr_hybrid_rwf",   # Marathi
    "en": "openai/whisper-base",                             # English
}

# Lazy-loaded model cache
_loaded_models = {}


def get_model(language: str):
    """Load and cache the appropriate model for a language."""
    model_name = LANGUAGE_MODELS.get(language)
    if not model_name:
        raise ValueError(f"Unsupported language: {language}. Supported: {list(LANGUAGE_MODELS.keys())}")

    if model_name in _loaded_models:
        return _loaded_models[model_name]

    try:
        from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"
        torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

        logger.info(f"Loading model {model_name} on {device}...")

        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            model_name,
            torch_dtype=torch_dtype,
            low_cpu_mem_usage=True,
            use_safetensors=True,
        )
        model.to(device)

        processor = AutoProcessor.from_pretrained(model_name)

        _loaded_models[model_name] = {
            "model": model,
            "processor": processor,
            "device": device,
            "torch_dtype": torch_dtype,
        }
        logger.info(f"Model {model_name} loaded successfully")
        return _loaded_models[model_name]

    except Exception as e:
        logger.error(f"Failed to load model {model_name}: {e}")
        raise RuntimeError(f"Model loading failed: {e}")


def transcribe_with_model(model_info: dict, audio_path: str, language: str) -> dict:
    """Run transcription using a loaded model."""
    import torch
    import librosa

    processor = model_info["processor"]
    model = model_info["model"]
    device = model_info["device"]
    torch_dtype = model_info["torch_dtype"]

    # Load audio
    audio, sr = librosa.load(audio_path, sr=16000)

    # Prepare input
    inputs = processor(
        audio,
        sampling_rate=16000,
        return_tensors="pt",
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Generate transcription
    with torch.no_grad():
        generated_ids = model.generate(**inputs, max_new_tokens=448)

    transcription = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

    # Calculate audio duration
    duration = len(audio) / 16000

    return {
        "text": transcription.strip(),
        "language": language,
        "confidence": 0.85,  # Approximate — VEXYL-STT doesn't provide per-utterance confidence
        "diarization": False,
        "segments": [
            {
                "speaker": "Speaker 1",
                "text": transcription.strip(),
                "start": 0.0,
                "end": round(duration, 2),
                "confidence": 0.85,
            }
        ],
    }


# ── Health check ─────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "stt-service"}


# ── Transcribe endpoint ──────────────────────────────────────────────

@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
):
    """
    Transcribe an audio file.
    Returns transcript with single-speaker segments (no diarization).
    """
    supported = list(LANGUAGE_MODELS.keys())
    if language not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{language}'. Supported: {supported}",
        )

    # Save uploaded audio to a temp file
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        logger.info(f"Transcribing {len(content)} bytes, language={language}")

        # Try to load and run model
        try:
            model_info = get_model(language)
            result = transcribe_with_model(model_info, tmp_path, language)
            logger.info(f"Transcription result: {result['text'][:100]}...")
            return JSONResponse(content=result)

        except RuntimeError as e:
            logger.error(f"Model error: {e}")
            raise HTTPException(status_code=503, detail=f"STT model unavailable: {str(e)}")

    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


# ── Run with uvicorn ─────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)