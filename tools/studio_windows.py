"""Windows launcher for the recording and Canvas studio (local CPU Whisper)."""
from pathlib import Path
import os
import runpy
import sys
import threading
import types
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
_model = None
_lock = threading.Lock()


def transcribe(audio, **options):
    global _model
    with _lock:
        if _model is None:
            print('Windows Whisper: small model, CPU/int8', flush=True)
            _model = WhisperModel('small', device='cpu', compute_type='int8',
                                  cpu_threads=max(1, min(8, os.cpu_count() or 4)))
    with _lock:
        segments, _ = _model.transcribe(audio, language=options.get('language', 'tr'),
                                    word_timestamps=options.get('word_timestamps', True),
                                    condition_on_previous_text=options.get('condition_on_previous_text', False))
        results = [dict(text=s.text, start=s.start, end=s.end,
                    words=[dict(word=w.word, start=w.start, end=w.end) for w in (s.words or [])]) for s in segments]
    return dict(text=''.join(s['text'] for s in results).strip(), segments=results)


if __name__ == '__main__':
    adapter = types.ModuleType('mlx_whisper')
    adapter.transcribe = transcribe
    sys.modules['mlx_whisper'] = adapter
    sys.path.insert(0, str(ROOT / 'tools'))
    os.chdir(ROOT)
    runpy.run_path(str(ROOT / 'tools/studio_server.py'), run_name='__main__')
