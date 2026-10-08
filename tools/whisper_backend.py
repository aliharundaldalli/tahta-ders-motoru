"""Whisper arka ucu: macOS Apple Silicon'da mlx-whisper, diğer sistemlerde (Windows/Linux/Intel Mac) faster-whisper.
transcribe(...) her iki durumda da mlx biçiminde döner: {'text', 'segments': [{'words': [{'word','start','end'}]}]}.
Model: WHISPER_MODEL ortam değişkeni (varsayılan large-v3-turbo)."""
import os, platform, subprocess, threading
_LOCK = threading.Lock(); _FW = None
NAME = os.environ.get('WHISPER_MODEL', 'large-v3-turbo')
def backend():
    if os.environ.get('WHISPER_BACKEND'): return os.environ['WHISPER_BACKEND']
    if platform.system() == 'Darwin' and platform.machine() == 'arm64':
        try: import mlx_whisper; return 'mlx'                       # noqa
        except ImportError: pass
    return 'faster'
def _fw():
    global _FW
    with _LOCK:
        if _FW is None:
            from faster_whisper import WhisperModel
            dev = 'cpu'
            try:
                import ctranslate2; dev = 'cuda' if ctranslate2.get_cuda_device_count() > 0 else 'cpu'
            except Exception: pass
            _FW = WhisperModel(NAME, device=dev, compute_type='float16' if dev == 'cuda' else 'int8')
    return _FW
def transcribe(path, language='tr', word_timestamps=False, initial_prompt=None, condition_on_previous_text=True):
    if backend() == 'mlx':
        import mlx_whisper
        return mlx_whisper.transcribe(path, path_or_hf_repo=f'mlx-community/whisper-{NAME}', language=language, word_timestamps=word_timestamps,
                                      initial_prompt=initial_prompt, condition_on_previous_text=condition_on_previous_text)
    import numpy as np                                              # sesi ffmpeg ile çöz (PyAV sürüm sorunlarından bağımsız)
    pcm = subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    segs, _ = _fw().transcribe(audio, language=language, word_timestamps=word_timestamps, initial_prompt=initial_prompt,
                               condition_on_previous_text=condition_on_previous_text, vad_filter=False)
    out = []
    for s in segs:
        out.append({'text': s.text, 'start': s.start, 'end': s.end,
                    'words': [{'word': w.word, 'start': w.start, 'end': w.end} for w in (s.words or [])]})
    return {'text': ''.join(s['text'] for s in out), 'segments': out}
