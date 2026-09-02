@echo off
echo ============================================
echo   VEXYL-STT Setup (IndicConformer 600M)
echo   Self-hosted Speech-to-Text Server
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python 3.10+ is required but not found.
    echo Download from https://www.python.org/downloads/
    pause
    exit /b 1
)

set VENV_DIR=%~dp0vexyl-stt\venv

:: Step 1: Create venv
if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo [1/5] Creating virtual environment...
    python -m venv "%VENV_DIR%"
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
) else (
    echo [1/5] Virtual environment already exists.
)

:: Step 2: Activate venv
echo [2/5] Activating virtual environment...
call "%VENV_DIR%\Scripts\activate.bat"

:: Step 3: Install dependencies
echo [3/5] Installing dependencies (this takes a few minutes)...
pip install --upgrade pip -q
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu -q
pip install transformers websockets numpy onnxruntime soundfile -q

:: Step 4: Download model (requires HuggingFace auth)
echo.
echo [4/5] Downloading IndicConformer 600M model...
echo.
echo NOTE: This model is gated on HuggingFace.
echo   1. Create account: https://huggingface.co
echo   2. Request access: https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual
echo   3. Create token: https://huggingface.co/settings/tokens
echo.
set /p HF_TOKEN=Enter your HuggingFace token (or press Enter if already cached):

if not "%HF_TOKEN%"=="" (
    python -c "from huggingface_hub import login; login(token='%HF_TOKEN%')" 2>nul
)

python -c "from transformers import AutoModel; AutoModel.from_pretrained('ai4bharat/indic-conformer-600m-multilingual', trust_remote_code=True); print('Model downloaded!')"
if errorlevel 1 (
    echo.
    echo ERROR: Model download failed. Make sure you have:
    echo   - A HuggingFace account with access to the model
    echo   - A valid token
    pause
    exit /b 1
)

:: Step 5: Create start script
echo [5/5] Creating start script...
(
echo @echo off
echo echo Starting VEXYL-STT server on port 8091...
echo call "%~dp0vexyl-stt\venv\Scripts\activate.bat"
echo set VEXYL_STT_HOST=127.0.0.1
echo set VEXYL_STT_PORT=8091
echo set VEXYL_STT_DECODE=ctc
echo set VEXYL_STT_DEVICE=cpu
echo python "%~dp0vexyl-stt\stt_server.py"
echo pause
) > start-stt.bat

echo.
echo ============================================
echo   Setup complete!
echo.
echo   To start the STT server:
echo     start-stt.bat
echo.
echo   Or manually:
echo     cd "script generator"
echo     vexyl-stt\venv\Scripts\activate
echo     set VEXYL_STT_PORT=8091
echo     python vexyl-stt\stt_server.py
echo.
echo   The server runs on http://localhost:8091
echo   Pitch Studio uses it automatically when
echo   DEEPGRAM_API_KEY is not configured.
echo ============================================
pause